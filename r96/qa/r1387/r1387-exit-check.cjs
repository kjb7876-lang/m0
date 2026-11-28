// R1387 — R1304 CPU 검사가 CI 에서 "RESULT PASS" 를 찍은 뒤 37분 멈춘 문제(main e96b728·5c6d500a) 회귀 검사.
// 원인(gdb 로 확인): Node 24 에서 process.exit() 는 V8 힙을 내리기 전에 플랫폼 작업 스레드부터 join 한다
//  (node::DefaultProcessExitHandlerInternal → NodePlatform::Shutdown → uv_thread_join).
//  그 순간 Maglev 동시 컴파일 작업이 힙 할당 중 GC 를 기다리고 있으면(CollectionBarrier::AwaitCollectionBackground)
//  GC 를 해 줄 주 스레드는 join 에 묶여 있어 둘 다 영원히 기다린다. R1304 는 9만 정점 뜨거운 반복 직후 끝나서 자주 걸린다.
// 자연 종료(process.exitCode)는 힙 해체(Heap::StartTearDown → 대기 중인 작업 스레드 깨움) 뒤 플랫폼을 닫아 이 교착이 없다.
// 이 검사는 R1304 판정 기준은 건드리지 않고 "끝내는 방식"과 "제한 시간 안 종료"만 본다.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const CHECK=path.join(R,'qa','r1304','r1304-cpu-check.cjs');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const src=String(fs.readFileSync(CHECK));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'r1387-'));

// ① 정적: R1304 검사는 process.exit() 를 부르지 않고 process.exitCode 로 끝난다(주석 줄 제외).
const code=src.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
ok(!/process\s*\.\s*(?:exit|reallyExit)\s*\(/.test(code),'R1304 검사가 process.exit()/reallyExit() 를 부르지 않음');
ok(/process\.exitCode\s*=\s*fail\s*\?\s*1\s*:\s*0/.test(code),'R1304 검사가 실패 수로 process.exitCode 를 정함(실패면 1)');
ok(/console\.log\(fail\?`RESULT FAIL \$\{fail\}`:'RESULT PASS'\)/.test(code),'RESULT 줄 형식 그대로');

// ② 실행: process.exit 경로(process.reallyExit)를 타는지 직접 잰다. 미리 읽기 스크립트가 reallyExit 를 감싸 표식을 남긴다.
const probe=path.join(tmp,'probe.cjs');
fs.writeFileSync(probe,`const fs=require('node:fs');const real=process.reallyExit;
process.reallyExit=function(c){try{fs.writeSync(2,'R1387-REALLYEXIT '+c+'\\n');}catch(_){}return real.call(this,c);};
process.on('exit',c=>{try{fs.writeSync(2,'R1387-EXIT '+c+'\\n');}catch(_){}});
if(process.env.R1387_BREAK_MANIFEST){const rf=fs.readFileSync;fs.readFileSync=function(p,...a){if(String(p).endsWith('runtime-manifest.json'))return Buffer.from('{}');return rf.call(this,p,...a);};}
`);
const run=(env={},timeout=60000)=>{const t0=Date.now();const r=cp.spawnSync(process.execPath,['--require',probe,CHECK],{cwd:ROOT,encoding:'utf8',timeout,killSignal:'SIGKILL',env:{...process.env,...env},maxBuffer:16<<20});return{...r,ms:Date.now()-t0,out:(r.stdout||'')+(r.stderr||'')};};
const pass=run();
ok(pass.status===0&&/RESULT PASS/.test(pass.stdout),'정상 경로: RESULT PASS·종료 코드 0 ('+pass.status+', '+pass.ms+'ms)');
ok(/R1387-EXIT 0/.test(pass.stderr)&&!/R1387-REALLYEXIT/.test(pass.stderr),'정상 경로: process.exit 경로 없이 자연 종료 '+JSON.stringify((pass.stderr.match(/R1387-\S+ \d+/g)||[])));
// 경계: 판정이 하나라도 틀리면 여전히 실패 코드 1 로 끝나야 한다(통과로 바뀌면 안 됨).
const bad=run({R1387_BREAK_MANIFEST:'1'});
ok(bad.status===1&&/FAIL 매니페스트 GLB 해시 일치/.test(bad.stdout)&&/RESULT FAIL 1/.test(bad.stdout),'경계: 매니페스트를 깨면 RESULT FAIL 1·종료 코드 1 ('+bad.status+')');
ok(!/R1387-REALLYEXIT/.test(bad.stderr),'경계: 실패 때도 process.exit 경로 없음');

// ③ 반복: 여러 번 동시에 돌려도 모두 제한 시간(각 60초) 안에 끝난다. 기본 12회(4병렬), R1387_RUNS 로 늘림.
const N=Math.max(1,Number(process.env.R1387_RUNS)||12),P=4;
(async()=>{
 const results=[];let next=0;
 const one=()=>new Promise(res=>{const t0=Date.now();const ch=cp.spawn(process.execPath,[CHECK],{cwd:ROOT,stdio:['ignore','pipe','pipe']});let out='';ch.stdout.on('data',d=>out+=d);ch.stderr.on('data',()=>{});
  const timer=setTimeout(()=>{ch.kill('SIGKILL');},60000);ch.on('close',(c,s)=>{clearTimeout(timer);res({code:c,signal:s,pass:/RESULT PASS/.test(out),ms:Date.now()-t0});});});
 await Promise.all(Array.from({length:P},async()=>{while(next<N){next++;results.push(await one());}}));
 const hung=results.filter(r=>r.signal),bad2=results.filter(r=>!r.signal&&(r.code!==0||!r.pass));
 ok(hung.length===0&&bad2.length===0,`반복 ${N}회 모두 제한 시간 안 종료·통과 (멈춤 ${hung.length}, 실패 ${bad2.length}, 최장 ${Math.max(...results.map(r=>r.ms))}ms)`);
 // ④ CI 연결: pages.yml 이 이 검사를 R1304 바로 뒤에서 돌린다(run: 키 중복 없음).
 const yml=String(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml')));
 const i1=yml.indexOf('run: node r96/qa/r1304/r1304-cpu-check.cjs'),i2=yml.indexOf('run: node r96/qa/r1387/r1387-exit-check.cjs');
 ok(i1>0&&i2>i1&&yml.slice(i1,i2).split('\n').slice(1).filter(l=>/^\s+run:/.test(l)).length===0,'pages.yml 이 R1304 바로 다음 단계로 이 검사를 돌림');
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exitCode=fail?1:0;
})();
