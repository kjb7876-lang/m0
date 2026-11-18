'use strict';
// R1171 CPU 검사 — 무한 생존 영웅 고르기 창에서 히든 영웅 EGO·페르소나를 고를 수 있게(모바일 포함).
//  사용자 2026-11-18 12:20Z "모바일에서 생존모드로 페르소나및 히든에고영웅 플래이가안됨 관련버그수정"
//  원인: R600 영웅 고르기 창이 HEROES 8명만 보여 주고, 시작이 형상 표식(egoSovereignR1046·personaHeroR1113)을 켜지 않았다.
//  ① 빌드 연결 ② 고르기 목록(해금 0·1·2·원래 영웅 없음·끄기) ③ 형상 → 원래 영웅 ④ 비밀 입력(7키 3번·제목 7연타) 경계값
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(root,'client-source','survival-r600.js'));
// ① 빌드 연결
ok(src.length>0&&src===rd(path.join(root,'runtime-text','survival-r600.js')),'runtime-text 사본 = client-source');
ok(/R1171/.test(src),'survival-r600 에 R1171 표시');
ok(rd(path.join(root,'..','.github','workflows','pages.yml')).includes('node r96/qa/r1171/r1171-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// 모듈 적재
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
try{new Function('window','document','localStorage',src)(win,doc,{getItem:()=>null,setItem(){}});}catch(e){ok(false,'모듈 적재',String(e));}
const P=win.__STORYWORLD_SURVIVAL_R600__?.pure||{};
const H={hwando:{},seoha:{},neon:{},michaela:{},lauren:{},hunter:{},slayer:{},gunner:{}};
const base=Object.keys(H);
// ② 고르기 목록
ok(typeof P.pickIds==='function','pure.pickIds 있음');
const pick=(h,on)=>{try{return P.pickIds(h,on);}catch(e){return 'ERR '+e;}};
ok(JSON.stringify(pick(H,()=>false))===JSON.stringify(base),'해금 없음: 8명 그대로(회귀)',pick(H,()=>false));
ok(JSON.stringify(pick(H,k=>k==='ego'))===JSON.stringify([...base,'ego']),'EGO 만 해금: 9명, EGO 는 맨 뒤',pick(H,k=>k==='ego'));
ok(JSON.stringify(pick(H,k=>k==='persona'))===JSON.stringify([...base,'persona']),'페르소나만 해금: 9명',pick(H,k=>k==='persona'));
ok(JSON.stringify(pick(H,()=>true))===JSON.stringify([...base,'ego','persona']),'둘 다 해금: 10명(EGO·페르소나 순)',pick(H,()=>true));
const noH={...H};delete noH.hwando;
ok(JSON.stringify(pick(noH,()=>true))===JSON.stringify([...Object.keys(noH),'persona']),'원래 영웅(환도) 없으면 EGO 칸 없음(경계)',pick(noH,()=>true));
ok(JSON.stringify(pick({},()=>true))==='[]','영웅 표가 비면 빈 목록',pick({},()=>true));
ok(JSON.stringify(pick(H,()=>{throw new Error('x');}))===JSON.stringify(base),'해금 조회가 던지면 미해금으로(회귀 안전)',pick(H,()=>{throw new Error('x');}));
// ③ 형상 → 원래 영웅
ok(typeof P.baseHero==='function'&&P.baseHero('ego')==='hwando'&&P.baseHero('persona')==='lauren','baseHero: ego→hwando, persona→lauren');
ok(typeof P.baseHero==='function'&&P.baseHero('hunter')==='hunter'&&P.baseHero('hwando')==='hwando'&&P.baseHero('lauren')==='lauren','baseHero: 보통 영웅은 그대로');
ok(typeof P.baseHero==='function'&&P.baseHero('toString')==='toString'&&P.baseHero(undefined)===undefined,'baseHero: 프로토타입 이름·undefined 는 형상으로 안 봄(경계)');
ok(P.FORMS_R1171&&P.FORMS_R1171.ego?.field==='egoSovereignR1046'&&P.FORMS_R1171.persona?.field==='personaHeroR1113','형상 표식 필드 = R1046·R1113 과 같은 이름');
// ④ 비밀 입력 경계값(1.5초 간격 안)
ok(typeof P.secretStep==='function','pure.secretStep 있음');
if(typeof P.secretStep==='function'){
 const run=(ts,need)=>{let s={n:0,at:NaN},fired=0;for(const t of ts){const r=P.secretStep(s,t,need);s=r.s;if(r.fire)fired++;}return {fired,s};};
 ok(run([0,100,200],3).fired===1,'7키 3번(0.1초 간격) → 발동');
 ok(run([0,1500,3000],3).fired===1,'간격 정확히 1.5초 → 발동(경계 포함)');
 ok(run([0,1501,3002],3).fired===0,'간격 1.501초 → 처음부터 다시(경계 밖)');
 ok(run([0,100],3).fired===0,'2번만 → 발동 안 함');
 ok(run([0,100,200,300,400,500],3).fired===2,'6번 → 2번 발동(발동 뒤 다시 셈)');
 ok(run([0,100,200,300,400,500,600],7).fired===1,'제목 7연타 → 발동');
 ok(run([0,100,200,300,400,500,2200],7).fired===0,'6연타 뒤 멈춤 → 발동 안 함(회귀)');
 ok(run([0,100,200,300,400,500,2200,2300,2400,2500,2600,2700,2800],7).fired===1,'멈춘 뒤 새로 7연타 → 발동');
 ok(run([NaN,0,1,2],3).fired===1,'NaN 시각이 끼어도 던지지 않고 뒤 3번으로 발동');}
console.log((bad?'FAIL':'PASS')+' r1171 cpu '+(n-bad)+'/'+n);process.exit(bad?1:0);
