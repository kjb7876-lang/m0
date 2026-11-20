'use strict';
// R1276 CPU 검사 — 영웅 10명 적중 효과음을 빗방울 소리로 (사용자 2026-11-20 "빗소리 … 듣기좋은소리로 개선해서 모든영웅들 적중효과음에 적절하게 배치해 지금 전자음 다 빼고").
//  r785Hit_<영웅>(기본 적중 4변주)·r785HitBig_<영웅>(스킬 적중 2변주) 프로필 20종을 assets/r1276/sfx 의 빗방울 파일로 바꿔 끼운다. 영웅 = 8 + EGO + 페르소나.
//  엔진·R785·R1155 파일은 고치지 않는다. 끄기 localStorage storyworld.r1276.sfx='0'(→ 예전 소리 그대로).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='rain-hit-r1276.js',API='__STORYWORLD_RAIN_HIT_R1276__',SRC=rd(path.join(R,'client-source',N));
const HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','ego','persona'];
// ── 연결 ──
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');
 ok(t(N)>0&&t(N)>t('combat-sfx-r785.js')&&t(N)>t('hidden-hero-sfx-r1155.js')&&t(N)<t('combat-r118.js'),'태그: R785·R1155 뒤, combat-r118 앞',{n:t(N)});}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1276/r1276-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'rain-hit-r1276\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(rd(path.join(R,'runtime-inputs.json')).includes(N),'runtime-inputs 에 새 파일');
ok(!/elevenlabs/i.test(SRC.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'')),'코드에 유료 생성 호출 없음');
ok(!/createOscillator/.test(SRC),'코드 합성(전자음) 없음');
// ── 파일: 영웅 10 × (적중 4 + 스킬 적중 2), 작고 있음 ──
const DIR=path.join(R,'runtime-text','assets','r1276','sfx');
{const miss=[],big=[],tiny=[];for(const h of HEROES){for(let i=1;i<=4;i++)chk('rain-hit-'+h+'-'+i+'.ogg');for(let i=1;i<=2;i++)chk('rain-hitbig-'+h+'-'+i+'.ogg');}
 function chk(f){const p=path.join(DIR,f);if(!fs.existsSync(p))miss.push(f);else{const s=fs.statSync(p).size;if(s>40000)big.push(f);if(s<1500)tiny.push(f);}}
 ok(!miss.length,'소리 파일 60개 모두 있음',miss.slice(0,5));ok(!big.length,'파일마다 40KB 이하',big);ok(!tiny.length,'빈 파일 없음',tiny);}
// ── 동작 ──
function env({off=false,profiles=true,inner=true}={}){
 const store={};if(off)store['storyworld.r1276.sfx']='0';
 const g={console,Math,JSON,Object,Array,Map,Set,Number,String,Promise,performance:{now:()=>1000},
  localStorage:{getItem:k=>store[k]??null,setItem(){}},document:{readyState:'complete',addEventListener(){}},addEventListener(){}};g.window=g;vm.createContext(g);
 vm.runInContext('var soundProfiles='+(profiles?'{}':'undefined')+';function setupAudio(){return "audio";}',g);
 if(profiles&&inner)vm.runInContext(`for(const h of ${JSON.stringify(HEROES)}){soundProfiles['r785Hit_'+h]=[{key:'old',path:'assets/r785/sfx/hit-'+h+'-1.ogg'}];soundProfiles['r785HitBig_'+h]=[{key:'old',path:'assets/r785/sfx/hitbig-'+h+'-1.ogg'}];}`,g);
 g.__STORYWORLD_SFX_COMFORT__={aliases:{}};
 vm.runInContext(SRC,g);return g;}
const prof=(g,k)=>vm.runInContext('soundProfiles['+JSON.stringify(k)+']',g);
try{
 const g=env();
 ok(!!g[API],'API '+API);
 const bad1=[],badN=[];for(const h of HEROES){const a=prof(g,'r785Hit_'+h),b=prof(g,'r785HitBig_'+h);
  if(!a||a.length!==4||!a.every(r=>r.path.startsWith('assets/r1276/sfx/rain-hit-'+h+'-')&&r.r541===true&&r.gain>0))bad1.push('hit '+h);
  if(!b||b.length!==2||!b.every(r=>r.path.startsWith('assets/r1276/sfx/rain-hitbig-'+h+'-')&&r.r541===true&&r.gain>0))bad1.push('big '+h);}
 ok(!bad1.length,'영웅 10명 적중·스킬 적중 프로필이 빗방울 파일',bad1);
 ok(HEROES.every(h=>g.__STORYWORLD_SFX_COMFORT__.aliases['r785Hit_'+h]==='enemyHit'&&g.__STORYWORLD_SFX_COMFORT__.aliases['r785HitBig_'+h]==='enemyHit'),'믹스 별칭 enemyHit 유지(음량 규칙 동일)');
 // 다른 오버레이가 프로필을 다시 써도 setupAudio 뒤에 되돌림
 vm.runInContext(`for(const h of ${JSON.stringify(HEROES)})soundProfiles['r785Hit_'+h]=[{key:'old2',path:'assets/r1155/x.ogg'}];setupAudio();`,g);
 ok(HEROES.every(h=>prof(g,'r785Hit_'+h)[0].path.includes('r1276')),'setupAudio 뒤 다시 빗방울로(R1155 등이 덮어써도)');
 // 같은 소리 연속 반복 방지용 변주 4개는 서로 다른 파일
 ok(HEROES.every(h=>new Set(prof(g,'r785Hit_'+h).map(r=>r.path)).size===4),'변주 4개는 서로 다른 파일');
 // 끄기
 const o=env({off:true});ok(HEROES.every(h=>prof(o,'r785Hit_'+h)[0].key==='old'),'끄기: 예전 소리 그대로');
 // 프로필 표가 없을 때·엔진 밖에서도 던지지 않음
 let thrown=null;try{env({profiles:false});}catch(e){thrown=String(e);}ok(!thrown,'soundProfiles 없어도 오류 없음',thrown);
 // 예전 프로필이 없는 영웅 칸(ego·persona 가 아직 안 생긴 시점)도 채움
 const e2=env({inner:false});ok(HEROES.every(h=>prof(e2,'r785Hit_'+h)&&prof(e2,'r785HitBig_'+h)),'예전 프로필 없어도 10명 모두 채움');
}catch(e){ok(false,'동작 블록 실행 오류',String(e).slice(0,300));}
console.log((bad?'FAIL ':'PASS ')+(n-bad)+'/'+n);process.exit(bad?1:0);
