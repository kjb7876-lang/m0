// R1279b CPU 검사: 더블클릭 닿는 거리를 대상별로(문 NPC 0.85칸) — 사용자 2026-11-20 "마우스 더블클릭으로도 근처에 다가가면 상호작용가능하게".
//  ① 사람·문·상자·제단·출구(커서 분류 talk/use)를 더블클릭하면 영웅이 다가가 닿는 거리에서 interact() 를 한 번만 부른다. 이미 가까우면 바로.
//  ② 이동·공격·줍기 더블클릭, 한 번 클릭, 막힌 대상은 아무것도 하지 않는다.
//  ③ 취소: 새 클릭·이동 키·조이스틱·창·사망·구역 바뀜·시간 초과. 끄기 설정.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','dblclick-use-r1279.js');ok(fs.existsSync(F),'dblclick-use-r1279.js exists');const src=fs.readFileSync(F,'utf8');
function world({reach=undefined,doorId=undefined,store={},cls={kind:'talk',target:{id:'npc1',x:20,y:10}},blockedAll=false,player0={x:10,y:10,hp:100}}={}){
 const L={},WL={},kd=[];let timers=[];
 const canvas={id:'game',addEventListener:(t,f)=>{(L[t]||(L[t]=[])).push(f);},getBoundingClientRect:()=>({left:0,top:44,width:1280,height:676})};
 const ctx={Math,String,Number,Array,Object,JSON,Map,isFinite,Date,console,devicePixelRatio:1,
  document:{getElementById:id=>id==='game'?canvas:null,addEventListener:(t,f)=>{(WL[t]||(WL[t]=[])).push(f);}},
  addEventListener:(t,f)=>{(WL[t]||(WL[t]=[])).push(f);},localStorage:{getItem:k=>store[k]??null,setItem(){}},
  setInterval:(f,ms)=>{timers.push(f);return timers.length;},clearInterval(){},performance:{now:()=>ctx.__now},__now:0};ctx.window=ctx;vm.createContext(ctx);
 ctx.__cls=cls;ctx.__blockedAll=blockedAll;ctx.__interact=0;
 ctx.__STORYWORLD_CURSOR_R780__={classify:()=>ctx.__cls};if(reach!==undefined)ctx.__STORYWORLD_WORLD_R74__={interactions:()=>[{id:'door-npc',kind:'npc',reach}]};
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
const door={kind:'talk',target:{id:'door-npc',x:20,y:10,doorId:'door-0'}};
// ① 문 NPC(닿는 거리 .85): 1.9칸에서 실행하지 않고 .85 안까지 다가간 뒤 한 번 실행
{const w=world({reach:.85,cls:door});dbl(w);let at=null,i=0;while(w.get('__interact')===0&&i++<400){w.step();}
 ok(w.get('__interact')===1,'door npc: interacts once');const d=w.get('distance(player,{x:20,y:10})');ok(d<=.85+1e-6,'door npc: within .85 at interact '+d);}
{const w=world({reach:.85,cls:door,player0:{x:20-1.5,y:10,hp:100}});dbl(w);ok(w.get('__interact')===0,'door npc: 1.5 away does NOT fire');ok(w.api().state().pending,'door npc: pending kept');ok(w.get('route.length')>0,'door npc: keeps walking');}
{const w=world({reach:.85,cls:door,player0:{x:20-.8,y:10,hp:100}});dbl(w);ok(w.get('__interact')===1,'door npc: 0.8 away fires at once');}
// ② doorId 만 있고 interactions 에 없어도 .85 로 본다
{const w=world({cls:door,player0:{x:20-1.5,y:10,hp:100}});dbl(w);ok(w.get('__interact')===0,'doorId fallback: 1.5 no fire');}
// ③ 길이 대상 한가운데로 막혀도 .85 안 자리를 찾는다(고리 반지름이 닿는 거리 안)
{const w=world({reach:.85,cls:door});w.get("findPath=function(a,b){return Math.hypot(b.x-20,b.y-10)<.01?[]:[{x:b.x,y:b.y}];}");dbl(w);for(let i=0;i<400;i++)w.step();ok(w.get('__interact')===1&&w.get('distance(player,{x:20,y:10})')<=.85+1e-6,'door npc: blocked centre -> ring within reach');}
// ④ 회귀: 보통 NPC(닿는 거리 2.2)와 interactions 없음은 그대로 1.9
{const w=world({reach:2.2,player0:{x:20-1.9,y:10,hp:100}});dbl(w);ok(w.get('__interact')===1,'normal npc still 1.9');}
{const w=world({player0:{x:20-1.91,y:10,hp:100}});dbl(w);ok(w.get('__interact')===0,'default 1.91 not yet');}
// ⑤ 닿는 거리가 이상한 값이면 기본으로
for(const bad of [NaN,0,-1,Infinity]){const w=world({reach:bad,player0:{x:19,y:10,hp:100}});dbl(w);ok(w.get('__interact')===1,'bad reach '+bad+' -> default');}
// ⑥ 시간 초과는 게임 시간 기준: 실제 시간이 20초 흘러도 게임 시간이 안 갔으면 취소하지 않는다, 게임 시간 15초 넘으면 취소
{const w=world();dbl(w);w.ctx.__now+=20000;w.timers().forEach(f=>f());ok(w.api().state().pending,'real clock jump alone does not cancel');
 w.get('time+=16');w.timers().forEach(f=>f());ok(w.api().state().pending===null,'game time 16s cancels');}
console.log('dblclick reach r1279b cpu check OK ('+n+' checks)');
