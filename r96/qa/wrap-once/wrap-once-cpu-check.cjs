'use strict';
// 감싸기 핑퐁 검사(2026-11-18 스토리 실플레이): 페르소나(R1113, 0.25초)·EGO(R1046, 0.5초) 덧씌우기가 tick·serializeSave·restoreSave 를
//  주기적으로 '바깥 함수에 내 표식이 없으면 다시 감싼다' → 서로의 표식을 가려 번갈아 끝없이 감쌌다(헤드리스 실측 초당 약 4단).
//  실제 시간 약 40~80분 뒤 tick 이 'Maximum call stack size exceeded' 로 매 프레임 실패 → 게임 정지(스토리 hando03·cult02 재현), 그 전엔 매 tick 마다 step()·watch() 가 수백 번 돎.
// 검사: ① 주기 감싸기를 많이 돌려도 tick·serializeSave·restoreSave 감싸기 깊이가 늘지 않음 ② 두 덧씌우기 모두 계속 걸려 있음(표식 둘 다·각 tick 에서 한 번씩만 실행)
//       ③ 표식을 안 옮기는 다른 덧씌우기가 끼어도 깊이는 한 번만 늘고 멈춤 ④ 저장 필드(EGO·페르소나 형상) 그대로 ⑤ 빌드 사본 = client-source
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m,d!==undefined?JSON.stringify(d).slice(0,160):'');};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAMES=['ego-sovereign-r1046-data.js','ego-sovereign-r1046.js','persona-hero-r1113.js'];
Error.stackTraceLimit=Infinity;
function stage(){
 const store={},intervals=[];
 const sb={console:{log(){},warn(){},error(){}},JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,URL,setTimeout:()=>0,clearTimeout(){},
  setInterval:(f,ms)=>{intervals.push(f);return intervals.length;},clearInterval(){},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  var started=true,modal=false,loading=false,storyScene=null,layer='STORY',zone='dist00',time=100,settings={lowFx:false};
  var player={hero:'hwando',x:10,y:10,hp:100};var room={id:'dist00'};
  function maxHP(){return 100;}function floatText(){}function toast(){}
  var __depth={tick:0,save:0,restore:0},__d=()=>new Error().stack.split('\\n').length;
  function tick(dt){__depth.tick=__d();time+=dt||0;}
  function serializeSave(){__depth.save=__d();return {player:{hero:player.hero}};}
  async function restoreSave(raw){__depth.restore=__d();player.hero=raw.player.hero;return true;}
 `,sb);
 for(const N of NAMES)vm.runInContext(rd(path.join(R,'client-source',N)),sb,{filename:N});
 const pump=k=>{for(let i=0;i<k;i++)for(const f of intervals.slice())try{f();}catch(_){}};
 const depth=async()=>{vm.runInContext('tick(0)',sb);vm.runInContext('serializeSave()',sb);await vm.runInContext('restoreSave({player:{hero:"hwando"}})',sb);return {...vm.runInContext('__depth',sb)};};
 return {sb,intervals,pump,depth,run:c=>vm.runInContext(c,sb)};
}
(async()=>{
 // ① ②
 {const S=stage();ok(S.intervals.length>=2,'두 영웅의 UI·렌더러 유지보수 타이머가 걸림',S.intervals.length);
  S.pump(4);const d0=await S.depth();S.pump(400);const d1=await S.depth();
  ok(d1.tick<=d0.tick,'① tick 감싸기 깊이가 주기 감싸기 400번 뒤에도 그대로',{before:d0.tick,after:d1.tick});
  ok(d1.save<=d0.save,'① serializeSave 감싸기 깊이 그대로',{before:d0.save,after:d1.save});
  ok(d1.restore<=d0.restore,'① restoreSave 감싸기 깊이 그대로',{before:d0.restore,after:d1.restore});
  const marks=S.run('[!!tick.__r1046,!!tick.__r1113,!!serializeSave.__r1046,!!serializeSave.__r1113,!!restoreSave.__r1046,!!restoreSave.__r1113]');
  ok(marks.every(Boolean),'② 바깥 함수에서 두 표식 모두 보임(EGO·페르소나 감싸기 둘 다 살아 있음)',marks);
  // 각 감싸기가 tick 한 번에 한 번만 도는지: 감싸기 층 수 = 깊이 차이로 확인(맨 처음 원본 깊이 대비 +2 이하)
  ok(d1.tick<=d0.tick&&d1.tick<=30,'② tick 깊이가 작게 유지(감싸기 층이 쌓이지 않음, 고치기 전 819)',{before:d0.tick,after:d1.tick});}
 // ③ 표식을 안 옮기는 다른 덧씌우기가 나중에 끼어듦
 {const S=stage();S.pump(4);const d0=await S.depth();S.run('(function(){const b=tick;tick=function(...a){return b.apply(this,a);};const s=serializeSave;serializeSave=function(...a){return s.apply(this,a);};})();');
  S.pump(400);const d1=await S.depth();
  ok(d1.tick-d0.tick<=3,'③ 다른 덧씌우기가 끼어도 tick 깊이는 한 번만 늘고 멈춤',{before:d0.tick,after:d1.tick});
  ok(d1.save-d0.save<=3,'③ serializeSave 도 한 번만 늘고 멈춤',{before:d0.save,after:d1.save});}
 // ④ 저장 필드
 {const S=stage();S.pump(10);const d=S.run('serializeSave()');ok(d&&d.player&&'egoSovereignR1046' in d.player&&'personaHeroR1113' in d.player,'④ 저장에 EGO·페르소나 형상 필드 둘 다 들어감',d&&d.player);}
 // ⑤ 사본
 for(const N of NAMES.slice(1))ok(rd(path.join(R,'client-source',N))===rd(path.join(R,'runtime-text',N)),'⑤ '+N+' runtime-text 사본 = client-source');
 console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
})();
