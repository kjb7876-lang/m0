// R1038 CPU 검사: 첫 화면 전 자가 진단(selfTests) 미루기.
//  사용자 2026-11-14 13:47Z "병원테스트같이 지금 안쓰는 기능 정리해서 보다 효율적이게 작동하도록".
//  boot() 끝의 selfTests() 는 플레이어에게 보이지 않는 개발용 자가검사(53항목, 지역을 여러 번 새로 만든다)다.
//  헤드리스 실측(소프트웨어 렌더링) 첫 화면까지 26.1초 중 9.8초. 진단 창을 열 때(또는 직접 부를 때) 처음 실행하도록 미룬다.
//  ① 빌드 연결 ② 실제 index.html 을 가짜 DOM 에서 부팅: 부팅 중엔 안 돌고, 진단·직접 호출은 그대로 전부 돈다 ③ 병원 직행 시작 등 기존 흐름 회귀
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
let pass=0,fail=0;const ok=(c,n,x)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,x!==undefined?JSON.stringify(x).slice(0,240):'');}};
const F='boot-lean-r1038.js',API='__STORYWORLD_BOOT_LEAN_R1038__';
const src=rd(path.join(R,'client-source',F));ok(src.length>0,F+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',F))===src,'runtime-text 사본 = client-source');
try{new vm.Script(src);ok(src.length>0,'문법');}catch(e){ok(false,'문법 '+e.message);}
const html=rd(path.join(R,'runtime-text','index.html'));
ok(html.split('<script src="./'+F+'"></script>').length===2,'index.html 태그 한 번');
ok(/<script src="\.\/boot-lean-r1038\.js"><\/script>\n<script src="\.\/story-reader-r122\.js">/.test(html),'태그는 story-reader-r122 줄 바로 앞(다른 오버레이 뒤), 자기 줄');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1038/r1038-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(F)&&rd(path.join(R,'runtime-inputs.json')).includes(F),'runtime-manifest·inputs 등록');
ok(html.includes('booted=true;loading=false;refreshIcons();selfTests();updateHUD();'),'엔진 boot 원문은 그대로(오버레이로만 덧붙임)');

(async()=>{
 const site=path.join(R,'hospital-three-pc/site');
 if(!fs.existsSync(path.join(site,'index.html'))){ok(false,'빌드 결과(site) 없음 — scripts/build-r96.py 먼저');return done();}
 const {createHarness}=require('../harness.cjs');
 // 1회차: 부팅
 const h=createHarness({timeoutMs:180000});
 const t0=Date.now();const boot=await h.boot();const bootMs=Date.now()-t0;
 console.log('vm boot ms',bootMs);
 const s0=h.run(`({booted,loading,started,checks:browserChecks.length,api:typeof ${API},state:typeof ${API}!=='undefined'?${API}.state():null})`);
 ok(s0.booted===true&&s0.loading===false&&s0.started===false,'부팅 끝(타이틀) 상태 그대로',s0);
 ok(s0.api==='object','API 있음',s0.api);
 ok(s0.checks===0,'부팅 중에는 자가 진단을 돌리지 않음(browserChecks 비어 있음)',s0.checks);
 ok(s0.state&&s0.state.deferred===1&&s0.state.ran===0,'미룬 횟수 1·실행 0',s0.state);
 // 진단 보고서: 처음 열 때 한 번 전부 돈다
 const d1=h.run(`(()=>{const d=diagnostics();return {n:d.browserChecks.length,failed:d.browserChecks.filter(x=>x.status==='failed').map(x=>x.name),st:${API}.state()};})()`);
 ok(d1.n>=40,'진단 보고서를 처음 열면 자가 진단 전부 실행(40항목 이상)',d1.n);
 ok(d1.st.ran===1,'실행 1회',d1.st);
 const d2=h.run(`(()=>{const d=diagnostics();return {n:d.browserChecks.length,st:${API}.state()};})()`);
 ok(d2.n===d1.n&&d2.st.ran===1,'두 번째 보고서는 다시 돌리지 않음(같은 항목 수, 실행 1회 그대로)',d2);
 // 진단 창 '자가검사 다시 실행'·직접 호출은 언제나 전부 돈다
 const t1=h.run(`(()=>{const a=selfTests();const b=selfTests();return {a:a.length,b:b.length,checks:browserChecks.length,st:${API}.state()};})()`);
 ok(t1.a===d1.n&&t1.b===d1.n&&t1.checks===d1.n,'selfTests() 직접 호출은 건너뛰지 않음(연속 2회 모두 전체)',t1);
 ok(t1.st.deferred===1,'미루기는 부팅 때 한 번뿐',t1.st);
 // 진단 창 열기(showDiagnostics)도 미룬 진단을 채운다 — 새 하네스로 확인
 const h2=createHarness({timeoutMs:180000});await h2.boot();
 const sd=h2.run(`(()=>{showDiagnostics();return {checks:browserChecks.length,st:${API}.state(),modal:!!modal};})()`);
 ok(sd.checks>=40&&sd.st.ran===1,'진단 창을 열면 미룬 자가 진단이 채워짐',sd);
 // 회귀: 병원 직행 시작·저장 흐름
 const h3=createHarness();await h3.boot();
 const st=await h3.start();await new Promise(r=>setImmediate(r));
 const s3=h3.run(`({started,zone,loading,room:room?.id,checks:browserChecks.length})`);
 ok(s3.started===true&&s3.room==='ep1a08','병원 직행 시작 그대로(ep1a08)',{st,s3});
 ok(s3.checks===0,'게임 시작 뒤에도 자가 진단은 저절로 돌지 않음',s3.checks);
 const sv=h3.run(`(()=>{const s=serializeSave();return !!s&&typeof s==='object'&&s.zone==='ep1a08';})()`);
 ok(sv===true,'저장 직렬화 그대로',sv);
 // 부팅 오류 로그 없음
 const errs=h.logs.filter(l=>l[0]==='error').map(l=>String(l[1]).slice(0,120));
 ok(errs.length===0,'부팅 콘솔 오류 없음',errs);
 done();
})().catch(e=>{ok(false,'예외 '+(e&&e.stack||e));done();});
function done(){console.log(`R1038 CPU ${pass}/${pass+fail}`);process.exit(fail?1:0);}
