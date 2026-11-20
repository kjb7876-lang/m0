// R1279 CPU 검사: 마우스 더블클릭으로 상호작용(dblclick-use-r1279.js) — 사용자 2026-11-20 "마우스 더블클릭으로도 근처에 다가가면 상호작용가능하게".
//  ① 사람·문·상자·제단·출구(커서 분류 talk/use)를 더블클릭하면 영웅이 다가가 닿는 거리에서 interact() 를 한 번만 부른다. 이미 가까우면 바로.
//  ② 이동·공격·줍기 더블클릭, 한 번 클릭, 막힌 대상은 아무것도 하지 않는다.
//  ③ 취소: 새 클릭·이동 키·조이스틱·창·사망·구역 바뀜·시간 초과. 끄기 설정.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','dblclick-use-r1279.js');ok(fs.existsSync(F),'dblclick-use-r1279.js exists');const src=fs.readFileSync(F,'utf8');
function world({store={},cls={kind:'talk',target:{id:'npc1',x:20,y:10}},blockedAll=false,player0={x:10,y:10,hp:100}}={}){
 const L={},WL={},kd=[];let timers=[];
 const canvas={id:'game',addEventListener:(t,f)=>{(L[t]||(L[t]=[])).push(f);},getBoundingClientRect:()=>({left:0,top:44,width:1280,height:676})};
 const ctx={Math,String,Number,Array,Object,JSON,Map,isFinite,Date,console,devicePixelRatio:1,
  document:{getElementById:id=>id==='game'?canvas:null,addEventListener:(t,f)=>{(WL[t]||(WL[t]=[])).push(f);}},
  addEventListener:(t,f)=>{(WL[t]||(WL[t]=[])).push(f);},localStorage:{getItem:k=>store[k]??null,setItem(){}},
  setInterval:(f,ms)=>{timers.push(f);return timers.length;},clearInterval(){},performance:{now:()=>ctx.__now},__now:0};ctx.window=ctx;vm.createContext(ctx);
 ctx.__cls=cls;ctx.__blockedAll=blockedAll;ctx.__interact=0;
 ctx.__STORYWORLD_CURSOR_R780__={classify:()=>ctx.__cls};
 vm.runInContext(`var started=true,modal=null,loading=false,storyScene=null,time=0,zone='z1',joystickVector={x:0,y:0},player=${JSON.stringify(player0)},route=[],command=null,target=null;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function findPath(a,b){return __blockedAll?[]:[{x:b.x,y:b.y}];}
  function toast(){}
  function interact(){__interact++;}`,ctx);
 vm.runInContext(src,ctx);
 const fire=(t,ev,onCanvas=true)=>{const e={preventDefault(){},pointerType:'mouse',button:0,clientX:300,clientY:300,...ev};for(const f of onCanvas?(L[t]||[]):(WL[t]||[]))f(e);};
 // 엔진 걸음: route 첫 점 쪽으로 speed*dt 만큼
 const step=(dt=.1,speed=6)=>{ctx.__now+=dt*1000;vm.runInContext(`time+=${dt}`,ctx);for(const f of timers)f();
  vm.runInContext(`(function(){if(route.length){const p=route[0],d=distance(player,p),s=${speed*dt};if(d<=s){player.x=p.x;player.y=p.y;route.shift();}else{player.x+=(p.x-player.x)/d*s;player.y+=(p.y-player.y)/d*s;}}})()`,ctx);};
 const get=e=>vm.runInContext(e,ctx);
 return {ctx,fire,step,get,api:()=>ctx.__STORYWORLD_DBLCLICK_USE_R1279__,timers:()=>timers};}
const dbl=w=>{w.fire('pointerdown',{});w.fire('pointerdown',{});w.fire('dblclick',{});};
// ① 멀리 있는 사람 더블클릭 → 걸어가서 한 번 상호작용
{const w=world();ok(w.api(),'api exposed');dbl(w);ok(w.get('__interact')===0,'far: not instant');ok(w.get('route.length')>0,'far: route set');
 let i=0;while(w.get('__interact')===0&&i++<200)w.step();ok(w.get('__interact')===1,'far: interact once');
 const d=w.get('distance(player,{x:20,y:10})');ok(d<=1.9+1e-6,'far: stopped within reach '+d);ok(d>0.2,'far: did not walk onto target');
 for(let k=0;k<30;k++)w.step();ok(w.get('__interact')===1,'far: still once after more ticks');ok(w.api().state().pending===null,'far: pending cleared');}
// ② 이미 가까우면 바로
{const w=world({player0:{x:19,y:10,hp:100}});dbl(w);ok(w.get('__interact')===1,'near: instant interact');w.step();ok(w.get('__interact')===1,'near: once');}
// 경계: 1.9 정확히 → 실행, 1.91 → 아직
{const w=world({player0:{x:20-1.9,y:10,hp:100}});dbl(w);ok(w.get('__interact')===1,'boundary 1.9 fires');}
{const w=world({player0:{x:20-1.91,y:10,hp:100}});dbl(w);ok(w.get('__interact')===0,'boundary 1.91 not yet');}
// ③ 대상 종류
for(const kind of ['move','attack','pickup','blocked','ui']){const w=world({cls:{kind,target:{id:'x',x:20,y:10}}});dbl(w);for(let i=0;i<50;i++)w.step();ok(w.get('__interact')===0&&w.api().state().pending===null,'kind '+kind+' ignored');}
for(const kind of ['use']){const w=world({cls:{kind,target:{id:'door',x:20,y:10}}});dbl(w);for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===1,'kind '+kind+' interacts');}
// 한 번 클릭 · 오른쪽 · 좌표 없음
{const w=world();w.fire('pointerdown',{});for(let i=0;i<50;i++)w.step();ok(w.get('__interact')===0,'single click: nothing');}
{const w=world();w.fire('dblclick',{button:2});ok(w.api().state().pending===null,'right button ignored');}
{const w=world({cls:{kind:'talk',target:{id:'n',x:NaN,y:10}}});dbl(w);ok(w.api().state().pending===null&&w.get('__interact')===0,'NaN target ignored');}
{const w=world({cls:{kind:'talk',target:null}});dbl(w);ok(w.api().state().pending===null,'null target ignored');}
// 막힌 대상: 길 없음 → 취소, interact 0, 무한 반복 없음
{const w=world({blockedAll:true});dbl(w);for(let i=0;i<300;i++)w.step();ok(w.get('__interact')===0&&w.api().state().pending===null,'blocked: cancelled, no interact');}
// 취소들
const armed=()=>{const w=world();dbl(w);w.step();ok(w.api().state().pending,'armed');return w;};
{const w=armed();w.fire('pointerdown',{});for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0,'cancel by new click');}
{const w=armed();w.fire('keydown',{key:'a'},false);for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0,'cancel by move key');}
{const w=armed();w.fire('keydown',{key:'e'},false);ok(w.api().state().pending,'interact key does not cancel');}
{const w=armed();w.get('joystickVector={x:.8,y:0}');w.step();ok(w.api().state().pending===null,'cancel by joystick');}
{const w=armed();w.get('modal={}');for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0&&w.api().state().pending===null,'cancel by modal');}
{const w=armed();w.get('player.hp=0');for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0,'cancel by death');}
{const w=armed();w.get("zone='z2'");for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0&&w.api().state().pending===null,'cancel by zone change');}
{const w=world();dbl(w);w.get('player.x=-100');w.step();let k=0;w.get('route=[]');while(w.api().state().pending&&k++<400)w.step();ok(w.api().state().pending===null&&w.get('__interact')===0,'timeout cancel');}
// 다시 더블클릭하면 새 대상으로 교체, interact 는 한 번
{const w=world();dbl(w);w.step();w.ctx.__cls={kind:'use',target:{id:'door',x:10,y:14}};dbl(w);for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===1,'re-arm: once');ok(w.get('distance(player,{x:10,y:14})')<=1.9+1e-6,'re-arm: went to new target');}
// 끄기
{const w=world({store:{'storyworld.r1279.dblclick':'off'}});dbl(w);for(let i=0;i<200;i++)w.step();ok(w.get('__interact')===0,'off switch');}
// 다른 더블클릭 뒤 이전 대기는 남지 않음 / 경로 도중 키 E 로 직접 상호작용해도 두 번 호출 안 함은 interact 몫 — 여기선 대기만 비운다
{const w=world();ok(w.api().state().armedCount===0,'no arm before use');dbl(w);ok(w.api().state().armedCount===1,'armed once');}
console.log('dblclick-use r1279 cpu check OK ('+n+' checks)');
