// R1104 — 페르소나 '순수악의' 임시 코드 걸음. 사용자 2026-11-16 06:36Z "페르소나 순수악의 왜 이동모션을 안함".
//  원인(헤드리스 실측 qa/r1104/probe.json): 페르소나 몸 그림은 rc133 art 의 방향별 정지 그림(base·awake 8장)뿐이라 걷는 동안에도 같은 한 장이
//  미끄러졌다(이동 154프레임 모두 base-1.png). 보스 공통 R620 걸음 출렁임은 걸려 있지만 키 변화 ±0.5px 라 보이지 않았다. R1097 수묵은 원인이 아니다.
//  정식본은 Dots 걷기 시트(CX-0106PB). 시트가 오기 전까지만 쓰는 코드 걸음이며 최종 그림이 아니다.
//  · 하는 법: 렌더러가 받는 프레임 명령에서(R1097 수묵 처리를 먼저 부른 뒤 — process 는 같은 명령을 두 번 바꾸지 않는다) 페르소나 몸 그림 한 장을
//    상체(엉덩이 줄 위) + 하체 왼쪽·오른쪽(가운데 4% 겹침)으로 나눈다. 같은 그림의 칸(sourceRect)만 나누므로 색·수묵·필터는 그대로다.
//  · 걸음: 위상은 '지나간 거리'(0.65칸에 한 걸음)로 정해 발이 미끄러지지 않는다. 다리 엇갈림(발끝 ±10% 폭), 드는 발만 키의 4.5% 들림,
//    디딤 출렁임(키의 3%), 가는 쪽으로 상체 숙임(키의 3.5%). 멈추면 0.15초 안에 0 으로 돌아온다.
//  · 걷는지 판단: 0.35초 동안의 순 이동이 초당 0.35칸 넘을 때만(제자리 떨림·밀림 왕복은 걷기 아님).
//  · R1097d: 렌더러는 명령을 key(owner.id+':'+순번)로 메시 하나에 묶는다 → 조각마다 key 뒤에 ':r1104u|l|r' 를 붙인다(같은 key 면 상체만 남고 하체가 사라졌다).
//  판정·피해·AI·저장·서사·이펙트·탄은 바꾸지 않는다(보스 몸 그림만). 끄기: localStorage['storyworld.r1104.personaStride']='0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_STRIDE_R1104__)return;
const REV='R1104-persona-stride-1',KEY='storyworld.r1104.personaStride';
const HIP=.6,OV=.04,STEP=.65,SWING=.1,FOOT_LIFT=.045,BOB=.03,LEAN=.035,WIN=.35,WALK_V=.35,EASE=7;
const BODY=/rc133\/art\/(?:base|awake)-[0-7]\.(?:png|webp)/i;
const stats={frames:0,split:0,steps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:null;}catch(_){return null;}};
function persona(){try{const rm=typeof room!=='undefined'?room:null;const list=rm&&Array.isArray(rm.enemies)?rm.enemies:[];for(const e of list)if(e&&e.persona&&e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y))return e;}catch(_){}return null;}
// 걸음 상태(페르소나 몸마다)
const ST=new WeakMap();
function track(e,t){let s=ST.get(e);if(!s){s={hist:[],w:0,phase:0,lastT:t,sdx:1,half:0};ST.set(e,s);}
 if(t<s.lastT||t-s.lastT>1){s.hist.length=0;s.w=0;s.lastT=t;}
 const dt=t-s.lastT;if(dt<=0&&s.hist.length)return s;s.lastT=t;
 s.hist.push({t,x:e.x,y:e.y});while(s.hist.length>2&&t-s.hist[0].t>WIN)s.hist.shift();
 const a=s.hist[0],span=t-a.t,dx=e.x-a.x,dy=e.y-a.y,v=span>.12?Math.hypot(dx,dy)/span:0;
 const walking=v>WALK_V;s.w+=((walking?1:0)-s.w)*Math.min(1,dt*EASE);if(s.w<1e-3)s.w=0;
 if(walking){const sd=dx-dy;if(Math.abs(sd)>1e-4)s.sdx=sd>0?1:-1;s.phase+=v*dt/STEP*Math.PI;const half=Math.floor(s.phase/Math.PI);if(half>s.half){stats.steps+=half-s.half;}s.half=half;}
 return s;}
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const lerp=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
function split(cmds,i,s){const c=cmds[i],P=c.points,sr=c.sourceRect;
 const Q=(u,v)=>lerp(lerp(P[0],P[1],u),lerp(P[3],P[2],u),v);
 const W=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),H=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]);if(!(W>1)||!(H>1))return false;
 const w=s.w,sn=Math.sin(s.phase),lift=H*BOB*w*Math.abs(sn),lean=s.sdx*H*LEAN*w;
 const up=(p,dxk)=>[p[0]+dxk,p[1]-lift];
 const piece=(u0,u1,v0,v1,pts,tag)=>({...c,key:c.key!=null?String(c.key)+':r1104'+tag:c.key,sourceRect:[sr[0]+sr[2]*u0,sr[1]+sr[3]*v0,sr[2]*(u1-u0),sr[3]*(v1-v0)],points:pts,r1104:true});
 const upper=piece(0,1,0,HIP,[up(Q(0,0),lean),up(Q(1,0),lean),up(Q(1,HIP),0),up(Q(0,HIP),0)],'u');
 const leg=(u0,u1,sw,tag)=>{const fl=H*FOOT_LIFT*w*Math.max(0,sw>0?Math.abs(sn):0),dxs=sw*W*SWING*w;
  return piece(u0,u1,HIP,1,[up(Q(u0,HIP),0),up(Q(u1,HIP),0),[Q(u1,1)[0]+dxs,Q(u1,1)[1]-fl],[Q(u0,1)[0]+dxs,Q(u0,1)[1]-fl]],tag);};
 // 앞으로 내딛는 다리(sw>0 쪽 위상)를 나중에 그려 겹침 가운데에서 위로 오게
 const L=leg(0,.5+OV,sn*s.sdx,'l'),R=leg(.5-OV,1,-sn*s.sdx,'r');
 const all=[upper.points,L.points,R.points].flat();if(!all.every(okPt))return false;
 const order=sn*s.sdx>0?[R,L,upper]:[L,R,upper];cmds.splice(i,1,...order);return true;}
function process(cmds){if(!on||!Array.isArray(cmds))return 0;const t=T(),e=persona();if(t==null||!e)return 0;const s=track(e,t);if(!(s.w>.02))return 0;
 let best=-1,bh=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.r1104||c.r620Ghost)continue;const o=c.owner;if(!o||o.kind!=='enemy'||o.groundAligned===true)continue;
  const sp=String(c.sourcePath||'');if(!(BODY.test(sp)||c.r1097))continue;const P=c.points,sr=c.sourceRect;if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||!sr.every(Number.isFinite)||!(sr[2]>0)||!(sr[3]>0))continue;
  const h=Math.abs(P[3][1]-P[0][1]);if(h>bh){bh=h;best=i;}}
 if(best<0)return 0;try{if(split(cmds,best,s)){stats.split++;return 1;}}catch(err){fail(err);}return 0;}
// 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만)
let depth=0;
const wrapFn=fn=>{if(fn.__r1104)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;
   try{const ink=window.__STORYWORLD_PERSONA_INK_R1097__;if(ink&&typeof ink.process==='function')ink.process(frame.commands);}catch(err){fail(err);}
   process(frame.commands);}}catch(err){fail(err);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1104=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
try{setInterval(wrapInst,500);}catch(e){fail(e);}wrapInst();
window.__STORYWORLD_PERSONA_STRIDE_R1104__=Object.freeze({revision:REV,storageKey:KEY,set,enabled:()=>on,process,
 inspect:()=>{const e=persona(),s=e?ST.get(e):null;return {revision:REV,on,walk:s?+s.w.toFixed(3):0,phase:s?+s.phase.toFixed(3):0,tuning:{HIP,OV,STEP,SWING,FOOT_LIFT,BOB,LEAN,WIN,WALK_V},stats:{...stats},lastError};}});
})();
