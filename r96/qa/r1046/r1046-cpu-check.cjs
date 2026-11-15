'use strict';
// R1046 히든 영웅 '마지막 수호자 EGO' — CPU 검사(사용자 2026-11-15 06:53Z "이 자산으로 … 히든영웅 넣어줘", 후속 지시 우선).
//  ① 빌드 연결(사본·태그 위치·verify 목록·pages.yml·manifest·자산)
//  ② 데이터: 능력 표(id·이름·발동·효과·대기·지연·몸짓·이펙트 분리), 봉인 칸, 걷는/안 걷는 상태 표, 게임 밖 사정을 직접 말하는 낱말 없음
//  ③ 해금: 처음엔 잠김, 사몽 S-07 클리어 → 해금·기억(localStorage), unlock() API, 해금 컷인 대기열
//  ④ 형상: 환도에서만 켜짐, 다른 영웅으로 바뀌면 꺼짐, 저장·불러오기
//  ⑤ 관측 폐기: 0.7초 지연(0.69 미발동·0.71 발동), 16초 대기, 걷는 상태(150·R58·R53·R71·회복 봉쇄) 걷기, R61 은 안 건드림,
//     이미 받은 피해·죽음은 그대로, 형상 아님/다른 영웅이면 발동 0, NaN 시간에도 던지지 않음
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,240):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAMES=['ego-sovereign-r1046-data.js','ego-sovereign-r1046.js'];
// ① 빌드 연결
const html=rd(path.join(R,'runtime-text/index.html')),man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
for(const N of NAMES){const src=rd(path.join(R,'client-source',N));ok(src.length>0,N+' 존재');ok(src.length>0&&rd(path.join(R,'runtime-text',N))===src,N+' runtime-text 사본 = client-source');
 ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),N+' verify-r96-public.py 기대 목록');ok(man.includes(N)&&inp.includes(N),N+' runtime-manifest·inputs');}
const t=N=>html.indexOf('<script src="./'+N+'"></script>');
ok(t(NAMES[0])>0&&t(NAMES[0])<t(NAMES[1]),'index.html: 데이터 태그가 오버레이 앞');
ok(t(NAMES[1])>t('ego-paint-r1039.js')&&t(NAMES[1])<t('boot-lean-r1038.js'),'index.html: 오버레이는 ego-paint-r1039 뒤, boot-lean-r1038 앞');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1046/r1046-cpu-check.cjs'),'pages.yml CPU 검사 줄');
for(const a of ['assets/r1046/ego-cutin.webp','assets/r1046/ego-portrait.webp'])ok(fs.existsSync(path.join(R,'runtime-text',a))&&man.includes(a)&&inp.includes(a),a+' 있음·manifest·inputs');
for(const a of ['assets/r100/sig-gather-red.webp','assets/r100/sig-aura-red.webp'])ok(fs.existsSync(path.join(R,'runtime-text',a)),a+' (재사용 시트) 있음');

// 샌드박스
function stage(opt={}){
 const store=Object.assign({},opt.store||{});const calls={r58:0,r53:0,r71:0,r61:0,float:[]};
 const sb={console,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,setTimeout,clearTimeout,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  var started=true,modal=false,loading=false,storyScene=null,layer='STORY',zone='dist00',time=100,settings={lowFx:false};
  var player={hero:'hwando',x:10,y:10,hp:100,storyStatus150:null,heroSlowUntil150:0,heroHealingBlockedUntil:0,healthBleedR71:null};
  var room={id:'dist00'};
  function maxHP(){return 100;}
  function floatText(s){__calls.float.push(String(s));}
  function toast(){}
  function tick(dt){time+=dt;}
  function serializeSave(){return {player:{hero:player.hero}};}
  async function restoreSave(raw){player={hero:raw.player.hero,x:1,y:1,hp:100};return true;}
  var R58=new Map(),R53=new Map(),R61=new Map();
  window.__STORYWORLD_REGIONAL_COMBAT_R58__={statusRows:()=>[...R58.values()],clear:()=>{__calls.r58++;R58.clear();}};
  window.__STORYWORLD_HOSPITAL_WOUNDS_R53__={statusRows:()=>[...R53.values()],clear:()=>{__calls.r53++;R53.clear();}};
  window.__STORYWORLD_FIELDS_R61__={statusRows:()=>[...R61.values()],clear:()=>{__calls.r61++;R61.clear();}};
  window.__STORYWORLD_HEALTH_R71__={statusRows:p=>p&&p.healthBleedR71?[{key:'bleed71',label:'출혈',kind:'debuff'}]:[],clearBleeding:(p)=>{__calls.r71++;const h=!!p.healthBleedR71;p.healthBleedR71=null;return h;}};
  var SAMONG={cleared:[]};
  window.__STORYWORLD_SAMONG_R103__={episodes:[{key:'P'},{key:'S-01'},{key:'S-02'},{key:'S-03'},{key:'S-04'},{key:'S-05'},{key:'S-06'},{key:'S-07'},{key:'RA'}],state:()=>SAMONG};
 `,Object.assign(sb,{__calls:calls}));
 for(const N of NAMES)vm.runInContext(rd(path.join(R,'client-source',N)),sb,{filename:N});
 return {sb,store,calls,run:c=>vm.runInContext(c,sb)};
}
const adv=(S,sec,step=1/60)=>{for(let i=0;i<Math.round(sec/step);i++)S.run('tick('+step+')');};
// ② 데이터
let S;try{S=stage();}catch(e){ok(false,'모듈 읽기',String(e&&e.stack||e).split('\n').slice(0,3).join(' | '));}
const D=S&&S.sb.__STORYWORLD_EGO_SOVEREIGN_R1046_DATA__,A=S&&S.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__;
ok(!!D&&!!A,'데이터·API 전역');
if(D&&A){
 const od=D.abilities.find(a=>a.id==='observe-discard');
 ok(od&&od.name==='관측 폐기'&&od.delay===.7&&od.cooldown>0&&od.trigger&&od.effect&&od.anim&&od.fx&&od.key===null,'능력 표: 관측 폐기(지연 .7·대기·발동·효과·몸짓·이펙트 분리, 새 키 없음)',od);
 ok(D.abilities.filter(a=>a.sealed).length>=1,'봉인 칸 ≥1(향후 능력 자리)');
 ok(new Set(D.abilities.map(a=>a.id)).size===D.abilities.length,'능력 id 겹치지 않음');
 const ids=[...D.dispel.dispellable,...D.dispel.nonDispellable].map(x=>x.id);
 ok(D.dispel.dispellable.length>=4&&D.dispel.nonDispellable.some(x=>x.id==='fields61')&&D.dispel.nonDispellable.some(x=>x.id==='death')&&new Set(ids).size===ids.length,'걷는/안 걷는 상태 표가 이름으로 나뉨(R61·죽음은 안 걷음)');
 const txt=JSON.stringify(D.profile)+JSON.stringify(D.abilities);
 const banned=['개발자','제작자','게임','플레이어','코드','카피','모방','애니메이션','만화','영화','소설','작가','프로그래머'];
 ok(!banned.some(w=>txt.includes(w)),'보이는 글에 게임 밖 사정을 직접 말하는 낱말 없음',banned.filter(w=>txt.includes(w)));
 ok(D.profile.record.join('').includes('구원하지는 못한다'),'기록: 스스로를 구원하지 못함');
 // ③ 해금
 ok(A.unlocked()===false,'처음엔 잠김');
 ok(A.setForm(true)===false&&!S.sb.player.egoSovereignR1046,'잠긴 동안 형상 켜기 거부');
 S.run('SAMONG.cleared.push(6)');adv(S,1.2);ok(A.unlocked()===false,'S-06 까지만 깬 상태는 잠김');
 S.run('SAMONG.cleared.push(7)');adv(S,1.2);ok(A.unlocked()===true,'사몽 S-07 클리어 → 해금');
 ok(/"on":true/.test(S.store['storyworld.r1046.ego']||''),'해금 기억(localStorage)',S.store['storyworld.r1046.ego']);
 ok(A.inspect().cutinQueued===true||A.inspect().stats.cutins>=1,'해금 컷인 대기열',A.inspect());
 const S2=stage({store:{...S.store}});ok(S2.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked()===true,'새로 켜도 해금 유지');
 const S3=stage();S3.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('test');ok(S3.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked(),'unlock() API(페르소나 보스 등에서 호출)');
 // ④ 형상
 ok(A.setForm(true)===true&&A.active()===true,'환도에서 형상 켜짐');
 const sv=S.run('serializeSave()');ok(sv.player.egoSovereignR1046===true,'저장에 형상 기록');
 S.run('player.hero="seoha"');adv(S,.1);ok(A.active()===false&&!S.sb.player.egoSovereignR1046,'다른 영웅으로 바뀌면 형상 꺼짐');
 ok(A.setForm(true)===false,'환도 아닌 영웅은 형상 거부');
 S.run('player.hero="hwando"');A.setForm(true);
 // ⑤ 관측 폐기
 S.run('player.storyStatus150={key:"slow",label:"x",until:time+5};player.heroSlowUntil150=time+5;player.hp=60');
 adv(S,.69);ok(S.sb.player.storyStatus150!==null,'0.69초: 아직 그대로(지연 .7)');
 adv(S,.03);ok(S.sb.player.storyStatus150===null&&!(S.sb.player.heroSlowUntil150>S.sb.time),'0.71초: 이야기 둔화 걷힘');
 ok(S.sb.player.hp===60,'이미 받은 피해는 그대로');
 ok(S.calls.float.some(s=>D.abilities[0].lines.includes(s)),'대사 한 줄',S.calls.float);
 S.run('player.storyStatus150={key:"drain",label:"x",until:time+20}');adv(S,3);ok(S.sb.player.storyStatus150!==null,'대기(16초) 동안은 다시 안 걷음');
 adv(S,14);ok(S.sb.player.storyStatus150===null,'대기 끝나면 다시 걷음');
 adv(S,17);
 S.run('R58.set("poison",{key:"poison",kind:"debuff"});R53.set("w",{key:"hospital-wound-r53-poison",kind:"debuff"});R61.set("dark",{key:"dark"});player.healthBleedR71={version:1};player.heroHealingBlockedUntil=time+9');
 adv(S,.75);ok(S.calls.r58===1&&S.calls.r53===1&&S.calls.r71===1,'R58·R53·R71 걷음',S.calls);
 ok(S.calls.r61===0&&S.run('R61.size')===1,'R61 원소 장판 상태는 안 건드림');
 ok(!(S.sb.player.heroHealingBlockedUntil>S.sb.time),'회복 봉쇄 걷힘');
 adv(S,17);const before=A.inspect().stats.discards;S.run('player.hp=0;player.storyStatus150={key:"slow",label:"x",until:time+5}');adv(S,1);
 ok(A.inspect().stats.discards===before&&S.sb.player.hp===0,'죽음은 폐기하지 못함(체력 0 이면 발동 0)');
 // 형상 아님
 const T=stage({store:{'storyworld.r1046.ego':'{"on":true}'}});T.run('player.storyStatus150={key:"slow",label:"x",until:time+5}');adv(T,1);
 ok(T.sb.player.storyStatus150!==null&&T.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.inspect().stats.discards===0,'형상 아닌 환도(일반 환도)는 발동 0 — 기존 영웅 회귀 없음');
 T.run('player.hero="seoha"');T.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);adv(T,1);ok(T.sb.player.storyStatus150!==null,'다른 영웅 발동 0');
 // 기존 RC151 EGO(페르소나 처치 뒤 '마지막 수호자 EGO' 변신)와 잇기: 해금 공유(컷인은 RC151 것만), 변신 중에는 어떤 영웅이든 관측 폐기
 const E=stage();E.run('var ego151={unlocked:true,active:false};player.hero="seoha"');adv(E,.6);const EA=E.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__;
 ok(EA.unlocked()===true&&EA.inspect().cutinQueued===false&&EA.inspect().stats.cutins===0,'RC151 해금(페르소나 처치) → 히든 칸 해금, 컷인은 겹치지 않음',EA.inspect());
 E.run('ego151.active=true;player.storyStatus150={key:"slow",label:"x",until:time+5}');adv(E,.8);
 ok(E.sb.player.storyStatus150===null&&EA.inspect().stats.discards===1,'RC151 EGO 변신 중(서하 몸)에도 관측 폐기',EA.inspect().stats);
 ok(EA.inspect().rc151===true&&!E.sb.player.egoSovereignR1046,'RC151 변신은 선택창 형상 표시와 따로(저장 필드 안 씀)');
 ok(D.abilities.filter(a=>a.kind==='existing'&&a.source==='RC151').length>=3,'능력 표에 기존 RC151 능력(창탄·융합 정화·적색 시간)을 지우지 않고 같은 표로 기록');
 // NaN
 let threw=false;try{T.run('player.hero="hwando"');T.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);T.run('time=NaN;tick(1/60);time=200;tick(1/60)');}catch(e){threw=String(e);}ok(!threw,'NaN 시간에도 던지지 않음',threw);
 // 불러오기
 (async()=>{const U=stage({store:{'storyworld.r1046.ego':'{"on":true}'}});await U.run('restoreSave({player:{hero:"hwando",egoSovereignR1046:true}})');ok(U.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()===true,'불러오기: 형상 복원');
  await U.run('restoreSave({player:{hero:"neon",egoSovereignR1046:true}})');ok(U.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()===false,'불러오기: 환도 아니면 형상 없음');
  const V=stage();await V.run('restoreSave({player:{hero:"hwando",egoSovereignR1046:true}})');ok(V.sb.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()===false,'불러오기: 잠긴 상태면 형상 없음');
  ok(A.inspect().stats.errors===0,'내부 오류 0',A.inspect().lastError);
  fin();})();
}else fin();
function fin(){console.log(`\n${n-bad}/${n} 통과`);process.exitCode=bad?1:0;}
