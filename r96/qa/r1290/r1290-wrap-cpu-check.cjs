'use strict';
// R1290 CPU 검사: 3D EGO 로 넘어온 뒤 점점 심해지는 렉(사용자 2026-11-21 06:22Z "기억사수영웅으로 777코드로 플레이하다 3d히든영웅에고로 넘어왔는데 렉이 심해지는 이유 찾아서 개선").
//  원인(헤드리스 실측): R1286(EGO 구름 오라, 1초마다)과 R1041(영웅 Dots 이펙트, 2초마다)이 DrawCommands.prototype.push 를
//  '바깥 함수에 내 표식이 없으면 다시 감싼다'로 서로의 표식을 가려 번갈아 끝없이 감쌌다(실측 2초에 약 2겹, 10분이면 600겹).
//  push 는 그리기 명령마다(화면당 수천 번) 불리므로 겹마다 규칙 검사가 다시 돌아 시간이 갈수록 프레임 JS 시간이 늘어난다. 같은 종류 버그 앞선 검사: qa/wrap-once.
// 검사: ① 주기 감싸기를 많이 돌려도 push 깊이가 늘지 않음 ② 두 감싸기 모두 걸려 있음(표식 둘 다) ③ 표식을 안 옮기는 다른 덧씌우기가 끼어도 한 번만 늘고 멈춤
//       ④ ego·hurt 감싸기도 같은 규칙 ⑤ 기능 그대로: R1041 규칙 없는 명령은 그대로 통과, 한 번 push 에 바닥 push 한 번 ⑥ 빌드 사본 = client-source
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m,d!==undefined?JSON.stringify(d).slice(0,160):'');};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAMES=['hero-dots-fx-r1041.js','ego-cloud-r1286.js'];const COPIES=NAMES.concat(['persona-hero-r1113.js','combat-guide-r1249.js']);
Error.stackTraceLimit=Infinity;
function stage(){
 const store={},intervals=[];let now=1e6;
 const D=function(...a){return new Date(...a);};D.now=()=>now;
 const sb={console:{log(){},warn(){},error(){}},JSON,Date:D,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,URL,
  setTimeout:()=>0,clearTimeout(){},setInterval:(f,ms)=>{intervals.push(f);return intervals.length;},clearInterval(){},
  performance:{now:()=>now},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  readyImage:()=>null,addImage:()=>{}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  var started=true,modal=false,loading=false,storyScene=null,layer='STORY',time=100,settings={lowFx:false};
  var player={hero:'gunner',x:10,y:10,hp:100,ego:0};var room={id:'dist02'};
  var __d=()=>new Error().stack.split('\\n').length,__depth={push:0,ego:0,hurt:0},__base={push:0};
  function DrawCommands(){this.commands=[];this.owner={kind:'effect',id:'fx1'};this.globalAlpha=1;}
  DrawCommands.prototype.push=function(kind,data){__depth.push=__d();__base.push++;this.commands.push({kind,...data});};
  var StoryPhase1={DrawCommands};
  var __PX={play(){return null;}};window.__STORYWORLD_PIXELFX_R163__=__PX;
  function tick(dt){time+=dt||0;}
  function ego(){__depth.ego=__d();}
  function hurt(d){__depth.hurt=__d();player.hp-=0;}
  var ctx=new DrawCommands();
 `,sb);
 for(const N of NAMES)vm.runInContext(rd(path.join(R,'client-source',N)),sb,{filename:N});
 // 한 바퀴 = 실제 시간 1초: setInterval 처리기 + tick(R1041 은 tick 안에서 2초마다 다시 감싼다)
 const pump=k=>{for(let i=0;i<k;i++){now+=1000;for(const f of intervals.slice())try{f();}catch(_){}try{vm.runInContext('tick(0.016)',sb);}catch(_){}}};
 const depth=()=>{vm.runInContext('__base.push=0;ctx.push("image",{key:"x",points:[[0,0],[1,0],[1,1],[0,1]]});ego();hurt(0);',sb);return {...vm.runInContext('__depth',sb),basePush:vm.runInContext('__base.push',sb)};};
 return {sb,pump,depth,run:c=>vm.runInContext(c,sb)};
}
// ① ②
{const S=stage();S.pump(3);const d0=S.depth();S.pump(600);const d1=S.depth();
 ok(d1.push<=d0.push,'① push 감싸기 깊이가 주기 감싸기 600초 뒤에도 그대로',{before:d0.push,after:d1.push});
 ok(d1.push<=40,'① push 깊이가 작게 유지(감싸기 층이 쌓이지 않음)',{after:d1.push});
 const marks=S.run('[!!StoryPhase1.DrawCommands.prototype.push.__r1041,!!StoryPhase1.DrawCommands.prototype.push.__r1286]');
 ok(marks.every(Boolean),'② 바깥 push 에서 두 표식 모두 보임(R1041·R1286 감싸기 둘 다 살아 있음)',marks);
 ok(d1.basePush===1,'⑤ 한 번 push 에 바닥 push 는 정확히 한 번',d1.basePush);
 ok(d1.ego<=d0.ego&&d1.hurt<=d0.hurt,'④ ego·hurt 감싸기 깊이도 그대로',{d0,d1});
 const st=S.run('window.__STORYWORLD_EGO_CLOUD_R1286__.inspect().stats.wraps');ok(st<=6,'② R1286 감싸기 횟수가 처음 몇 번에서 멈춤(고치기 전 600초면 수백)',st);}
// ③ 표식을 안 옮기는 다른 덧씌우기가 나중에 끼어듦
{const S=stage();S.pump(3);const d0=S.depth();
 S.run('(function(){const P=StoryPhase1.DrawCommands.prototype,b=P.push;P.push=function(k,d){return b.call(this,k,d);};const e=ego;ego=function(){return e.apply(this,arguments);};})();');
 S.pump(600);const d1=S.depth();
 ok(d1.push-d0.push<=4,'③ 다른 덧씌우기가 끼어도 push 깊이는 한 번만 늘고 멈춤',{before:d0.push,after:d1.push});
 ok(d1.ego-d0.ego<=3,'③ ego 깊이도 한 번만 늘고 멈춤',{before:d0.ego,after:d1.ego});
 ok(d1.basePush===1,'③ 그래도 바닥 push 는 한 번',d1.basePush);}

// ⑦ 같은 종류 둘째 핑퐁(전수 감시에서 발견): R1113 페르소나(0.25초 무렵)·R1249 조작 안내(0.5초)가 setHudTextR63R2 를 서로 다시 감쌌다(2초 감시마다 바뀜).
{const store={},intervals=[];
 const sb={console:{log(){},warn(){},error(){}},JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,URL,RegExp,
  setTimeout:()=>0,clearTimeout(){},setInterval:(f,ms)=>{intervals.push(f);return intervals.length;},clearInterval(){},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},matchMedia:()=>({matches:false}),navigator:{maxTouchPoints:0,userAgent:''}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`var started=true,modal=false,loading=false,storyScene=null,layer='STORY',zone='dist00',time=100,settings={lowFx:false};
  var player={hero:'hwando',x:10,y:10,hp:100};var room={id:'dist00'};function maxHP(){return 100;}function floatText(){}function toast(){}
  var __d=()=>new Error().stack.split('\\n').length,__hud={depth:0,n:0};function tick(dt){time+=dt||0;}
  function serializeSave(){return {player:{hero:player.hero}};}async function restoreSave(raw){return true;}
  function setHudTextR63R2(id,text){__hud.depth=__d();__hud.n++;}function showHelp(){}`,sb);
 let loaded=0;for(const N of ['ego-sovereign-r1046-data.js','ego-sovereign-r1046.js','persona-hero-r1113.js','combat-guide-r1249.js']){try{vm.runInContext(rd(path.join(R,'client-source',N)),sb,{filename:N});loaded++;}catch(e){console.log('load',N,String(e).slice(0,120));}}
 const pump=k=>{for(let i=0;i<k;i++)for(const f of intervals.slice())try{f();}catch(_){}};
 const hud=()=>{vm.runInContext('__hud.n=0;setHudTextR63R2("hp","1")',sb);return {...vm.runInContext('__hud',sb)};};
 pump(4);const h0=hud();pump(600);const h1=hud();
 ok(loaded===4,'⑦ 네 오버레이 읽힘',loaded);
 ok(h1.depth<=h0.depth,'⑦ setHudTextR63R2 감싸기 깊이가 주기 감싸기 600번 뒤에도 그대로',{before:h0.depth,after:h1.depth});
 ok(h1.n===1,'⑦ 한 번 부르면 바닥 HUD 함수는 한 번',h1.n);
 const m=vm.runInContext('[!!setHudTextR63R2.__r1113,!!setHudTextR63R2.__r1249]',sb);ok(m.every(Boolean),'⑦ R1113·R1249 감싸기 둘 다 살아 있음',m);}
// ⑥ 사본
for(const N of COPIES)ok(rd(path.join(R,'client-source',N))===rd(path.join(R,'runtime-text',N)),'⑥ '+N+' runtime-text 사본 = client-source');
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
