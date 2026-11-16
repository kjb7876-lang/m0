// R1104 — 페르소나 '순수악의' 임시 코드 걸음. 사용자 2026-11-16 06:36Z "페르소나 순수악의 왜 이동모션을 안함".
//  원인(헤드리스 실측 qa/r1104/probe.json): 페르소나 몸 그림은 rc133 art 의 방향별 정지 그림(base·awake 8장)뿐이라 걷는 동안에도 같은 한 장이
//  미끄러졌다(이동 154프레임 모두 base-1.png). 보스 공통 R620 걸음 출렁임은 걸려 있지만 키 변화 ±0.5px 라 보이지 않았다. R1097 수묵은 원인이 아니다.
//  정식본은 Dots 걷기 시트(CX-0106PB). 시트가 오기 전까지만 쓰는 코드 걸음이며 최종 그림이 아니다.
//  · 하는 법: 렌더러가 받는 프레임 명령에서(R1097 수묵 처리를 먼저 부른 뒤 — process 는 같은 명령을 두 번 바꾸지 않는다) 페르소나 몸 그림 한 장을
//    상체(엉덩이 줄 위) + 하체 왼쪽·오른쪽(가운데 4% 겹침)으로 나눈다. 같은 그림의 칸(sourceRect)만 나누므로 색·수묵·필터는 그대로다.
//  · 걸음: 위상은 '지나간 거리'(0.65칸에 한 걸음)로 정해 발이 미끄러지지 않는다. 다리 엇갈림(발끝 ±10% 폭), 드는 발만 키의 4.5% 들림,
//    디딤 출렁임(키의 3%), 가는 쪽으로 상체 숙임(키의 3.5%). 멈추면 0.15초 안에 0 으로 돌아온다.
//  · 걷는지 판단: 0.35초 동안의 순 이동이 초당 0.35칸 넘을 때만(제자리 떨림·밀림 왕복은 걷기 아님).
//  판정·피해·AI·저장·서사·이펙트·탄은 바꾸지 않는다(보스 몸 그림만). 끄기: localStorage['storyworld.r1104.personaStride']='0'.
// R1104b — Dots CX-0120PW 걷기 3방향 8칸 시트(아래·위·옆, 사용자 2026-11-16 08:53Z "이거 적용함?"·08:54Z "몸통이랑 다리 자연스럽게 연결").
//  · 시트는 qa/r1104b/build-walk-sheets.py 로 다듬은 webp(옆: 상체·다리 이음매 색 잇기·망토 그늘·틈 채우기, 아래·위: 칸마다 튀던 머리 높이 고르기).
//  · 걷는 동안(걸음 세기 w>.5) 기본형(base) 몸 그림 한 장을 방향에 맞는 시트 칸으로 바꿔 끼운다. 방향 표: 0·1 아래, 7 아래 뒤집기, 2 옆, 6 옆 뒤집기, 3·4 위, 5 위 뒤집기.
//  · 칸 = 지나간 거리 위상(0.65칸에 한 걸음, 8칸 = 두 걸음)이라 발이 미끄러지지 않는다. 바라보는 쪽과 반대로 움직이면 칸을 거꾸로 돌린다.
//  · 크기·자리: 시트 발선 가운데(ax, ground)를 원래 그림 발 자리(172, 385)에, 시트 키 424px 를 원래 키 357px 에 맞춘다.
//  · 수묵(R1097)이 이 몸 그림을 바꿨으면 시트 칸도 R1097 inkify 로 한 번씩 구워 쓴다(굽기 전엔 코드 걸음). 각성형(awake)·시트를 못 읽었을 때는 R1104 코드 걸음 그대로.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_STRIDE_R1104__)return;
const REV='R1104-persona-stride-2-sheets-r1104b',KEY='storyworld.r1104.personaStride';
const HIP=.6,OV=.04,STEP=.65,SWING=.1,FOOT_LIFT=.045,BOB=.03,LEAN=.035,WIN=.35,WALK_V=.35,EASE=7;
const BODY=/rc133\/art\/(?:base|awake)-[0-7]\.(?:png|webp)/i;
const stats={frames:0,split:0,steps:0,errors:0,sheets:0,baked:0,sheetFrames:0,lastSheet:null};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:null;}catch(_){return null;}};
function persona(){try{const rm=typeof room!=='undefined'?room:null;const list=rm&&Array.isArray(rm.enemies)?rm.enemies:[];for(const e of list)if(e&&e.persona&&e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y))return e;}catch(_){}return null;}
// ---------------- R1104b 걷기 시트 ----------------
const CELL=512,FRAMES=8,ART={ax:172,ground:385,height:357,sheetH:424};ART.k=ART.height/ART.sheetH;
const WALK=Object.freeze({front:Object.freeze({src:'assets/r1104b/persona-walk-front.webp',ax:256,ground:476,fwd:[0,1]}),
 rear:Object.freeze({src:'assets/r1104b/persona-walk-rear.webp',ax:256,ground:477,fwd:[0,-1]}),
 side:Object.freeze({src:'assets/r1104b/persona-walk-side.webp',ax:266,ground:476,fwd:[-1,0]})});
const DIRS=[['front',1],['front',1],['side',1],['rear',1],['rear',1],['rear',-1],['side',-1],['front',-1]]; // [시트, 1=그대로 -1=좌우 뒤집기]
const SS={};for(const k in WALK)SS[k]={state:'idle',raw:null,ink:null,inkState:'idle',inkHalf:null};
const RAWQ=new WeakMap(),RX=/(?:^|[\/:])assets\/rc133\/art\/(base|awake)-([0-7])\.(?:png|webp)(?:[?#].*)?$/i;
const hasDom=()=>{try{return typeof document!=='undefined'&&document&&typeof document.createElement==='function'&&typeof Image==='function';}catch(_){return false;}};
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function abs(u){try{return new URL(u,document.baseURI||window.location?.href).href;}catch(_){return u;}}
function loadSheet(k){const S=SS[k];if(S.state!=='idle'||!hasDom())return;S.state='wait';
 try{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  img.onload=()=>{try{const raw=[];for(let f=0;f<FRAMES;f++){const cv=canvas(CELL,CELL),g=cv.getContext('2d');g.drawImage(img,f*CELL,0,CELL,CELL,0,0,CELL,CELL);
     const path='r1104b:walk:'+k+':'+f+':raw';cv.__storyworldStaticSource={path};raw.push({canvas:cv,w:CELL,h:CELL,pad:0,path});}
    S.raw=raw;S.state='ready';stats.sheets++;}catch(e){S.state='failed';fail(e);}};
  img.onerror=()=>{S.state='failed';};img.src=abs(WALK[k].src);}catch(e){S.state='failed';fail(e);}}
// 수묵: R1097 inkify 로 칸마다 한 번 굽기(0.03초 간격으로 하나씩)
const inkQ=[];let inkBusy=false;
function inkMod(){try{const m=window.__STORYWORLD_PERSONA_INK_R1097__;return m&&typeof m.inkify==='function'?m:null;}catch(_){return null;}}
function wantInk(k){const S=SS[k],M=inkMod();if(!M||S.state!=='ready')return;let half=false;try{half=!!M.inspect?.().half;}catch(_){}
 if(S.inkState!=='idle'&&S.inkHalf===half)return;S.inkHalf=half;S.inkState='wait';S.ink=new Array(FRAMES).fill(null);for(let f=0;f<FRAMES;f++)inkQ.push([k,f,half]);pumpInk();}
function pumpInk(){if(inkBusy||!inkQ.length)return;inkBusy=true;const [k,f,half]=inkQ.shift(),S=SS[k];
 try{const M=inkMod();if(M&&S.raw&&S.inkHalf===half){const sc=half?.5:1,cw=Math.round(CELL*sc),src=canvas(cw,cw),g=src.getContext('2d',{willReadFrequently:true});g.drawImage(S.raw[f].canvas,0,0,cw,cw);
   const data=g.getImageData(0,0,cw,cw).data,r=M.inkify(data,cw,cw,{pad:Math.max(8,Math.round(26*sc/ART.k)),seed:300+Object.keys(WALK).indexOf(k)*11,unit:sc/ART.k});
   if(r&&r.solid){const out=canvas(r.width,r.height),og=out.getContext('2d'),im=og.createImageData(r.width,r.height);im.data.set(r.data);og.putImageData(im,0,0);
    const path='r1104b:walk:'+k+':'+f+':ink';out.__storyworldStaticSource={path};S.ink[f]={canvas:out,w:r.width,h:r.height,pad:r.pad/sc,path};stats.baked++;}
   if(S.ink.every(Boolean))S.inkState='ready';}}catch(e){S.inkState='failed';fail(e);}
 inkBusy=false;if(inkQ.length){try{setTimeout(pumpInk,30);}catch(_){}}}
function prewarm(){for(const k in WALK)loadSheet(k);}
// 시트 칸으로 바꿔 끼우기: 원래 그림 좌표(344×400) 사각형 P 위에 시트 칸을 발 자리·키 맞춰 올린다
function swapSheet(c,q,s,ink){const [k,m]=DIRS[q.dir],S=SS[k],W=WALK[k];const set=ink?(S.inkState==='ready'?S.ink:null):(S.state==='ready'?S.raw:null);if(!set)return false;
 const P=q.P,sr=q.sr,cw=sr[2],ch=sr[3],px=(cw-344)/2,py=(ch-400)/2;
 const ux=[(P[1][0]-P[0][0])/cw,(P[1][1]-P[0][1])/cw],vy=[(P[3][0]-P[0][0])/ch,(P[3][1]-P[0][1])/ch];
 const A=(u,v)=>{const ax=ART.ax+m*(u-W.ax)*ART.k+px,ay=ART.ground+(v-W.ground)*ART.k+py;return [P[0][0]+ux[0]*ax+vy[0]*ay,P[0][1]+ux[1]*ax+vy[1]*ay];};
 // 앞으로 걷는가: 시트가 향한 화면 방향(뒤집으면 좌우 반대)과 실제 움직임
 const fx=W.fwd[0]*m,fy=W.fwd[1],dot=fx*s.scr[0]+fy*s.scr[1];const f0=Math.floor(s.phase/(Math.PI/4))%FRAMES,f=dot<-.2?(FRAMES-f0)%FRAMES:f0;
 const fr=set[f];if(!fr)return false;const p=fr.pad,pts=[A(-p,-p),A(CELL+p,-p),A(CELL+p,CELL+p),A(-p,CELL+p)];if(!pts.every(okPt))return false;
 c.image=fr.canvas;c.mutable=false;c.sourcePath=fr.path;c.immutableTint=fr.canvas.__storyworldStaticSource;c.sourceRect=[0,0,fr.w,fr.h];c.imageSize=[fr.w,fr.h];c.points=pts;c.r1104b=true;c.r1104bPad=p;
 stats.sheetFrames++;stats.lastSheet=k+':'+f+(m<0?':flip':'')+(ink?':ink':'');return true;}
// 걸음 상태(페르소나 몸마다)
const ST=new WeakMap();
function track(e,t){let s=ST.get(e);if(!s){s={hist:[],w:0,phase:0,lastT:t,sdx:1,half:0,scr:[0,0]};ST.set(e,s);}
 if(t<s.lastT||t-s.lastT>1){s.hist.length=0;s.w=0;s.lastT=t;}
 const dt=t-s.lastT;if(dt<=0&&s.hist.length)return s;s.lastT=t;
 s.hist.push({t,x:e.x,y:e.y});while(s.hist.length>2&&t-s.hist[0].t>WIN)s.hist.shift();
 const a=s.hist[0],span=t-a.t,dx=e.x-a.x,dy=e.y-a.y,v=span>.12?Math.hypot(dx,dy)/span:0;
 const walking=v>WALK_V;s.w+=((walking?1:0)-s.w)*Math.min(1,dt*EASE);if(s.w<1e-3)s.w=0;
 if(walking){const sd=dx-dy,sv=dx+dy,sl=Math.hypot(sd,sv)||1;s.scr=[sd/sl,sv/sl];if(Math.abs(sd)>1e-4)s.sdx=sd>0?1:-1;s.phase+=v*dt/STEP*Math.PI;const half=Math.floor(s.phase/Math.PI);if(half>s.half){stats.steps+=half-s.half;}s.half=half;}
 return s;}
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const lerp=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
function split(cmds,i,s){const c=cmds[i],P=c.points,sr=c.sourceRect;
 const Q=(u,v)=>lerp(lerp(P[0],P[1],u),lerp(P[3],P[2],u),v);
 const W=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),H=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]);if(!(W>1)||!(H>1))return false;
 const w=s.w,sn=Math.sin(s.phase),lift=H*BOB*w*Math.abs(sn),lean=s.sdx*H*LEAN*w;
 const up=(p,dxk)=>[p[0]+dxk,p[1]-lift];
 const piece=(u0,u1,v0,v1,pts)=>({...c,sourceRect:[sr[0]+sr[2]*u0,sr[1]+sr[3]*v0,sr[2]*(u1-u0),sr[3]*(v1-v0)],points:pts,r1104:true});
 const upper=piece(0,1,0,HIP,[up(Q(0,0),lean),up(Q(1,0),lean),up(Q(1,HIP),0),up(Q(0,HIP),0)]);
 const leg=(u0,u1,sw)=>{const fl=H*FOOT_LIFT*w*Math.max(0,sw>0?Math.abs(sn):0),dxs=sw*W*SWING*w;
  return piece(u0,u1,HIP,1,[up(Q(u0,HIP),0),up(Q(u1,HIP),0),[Q(u1,1)[0]+dxs,Q(u1,1)[1]-fl],[Q(u0,1)[0]+dxs,Q(u0,1)[1]-fl]]);};
 // 앞으로 내딛는 다리(sw>0 쪽 위상)를 나중에 그려 겹침 가운데에서 위로 오게
 const L=leg(0,.5+OV,sn*s.sdx),R=leg(.5-OV,1,-sn*s.sdx);
 const all=[upper.points,L.points,R.points].flat();if(!all.every(okPt))return false;
 const order=sn*s.sdx>0?[R,L,upper]:[L,R,upper];cmds.splice(i,1,...order);return true;}
function process(cmds){if(!on||!Array.isArray(cmds))return 0;const t=T(),e=persona();if(t==null||!e)return 0;prewarm();const s=track(e,t);if(!(s.w>.02))return 0;
 let best=-1,bh=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.r1104||c.r620Ghost)continue;const o=c.owner;if(!o||o.kind!=='enemy'||o.groundAligned===true)continue;
  const sp=String(c.sourcePath||'');if(!(BODY.test(sp)||c.r1097))continue;const P=c.points,sr=c.sourceRect;if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||!sr.every(Number.isFinite)||!(sr[2]>0)||!(sr[3]>0))continue;
  const h=Math.abs(P[3][1]-P[0][1]);if(h>bh){bh=h;best=i;}}
 if(best<0)return 0;
 const c=cmds[best];let q=RAWQ.get(c);if(!q){const m=RX.exec(String(c.sourcePath||''));if(m&&!c.r1097)q={P:c.points.map(p=>[...p]),sr:[...c.sourceRect],kind:m[1].toLowerCase(),dir:+m[2]};}
 if(q&&q.kind==='base'&&q.sr[0]===0&&q.sr[1]===0){const k=DIRS[q.dir][0],ink=!!c.r1097;if(ink)wantInk(k);
  const ready=ink?SS[k].inkState==='ready':SS[k].state==='ready';
  if(ready){if(s.w>.5){try{if(swapSheet(c,q,s,ink))return 1;}catch(err){fail(err);}}else return 0;}}
 try{if(split(cmds,best,s)){stats.split++;return 1;}}catch(err){fail(err);}return 0;}
// 수묵 처리 전에 원래 몸 그림 사각형을 적어 둔다(수묵은 여백을 붙여 점을 바꾸므로)
function remember(cmds){for(const c of cmds){if(!c||c.kind!=='image'||c.r1097)continue;const m=RX.exec(String(c.sourcePath||''));if(!m)continue;const P=c.points,sr=c.sourceRect;
 if(Array.isArray(P)&&P.length===4&&P.every(okPt)&&Array.isArray(sr)&&sr.length>=4&&sr.every(Number.isFinite))RAWQ.set(c,{P:P.map(p=>[...p]),sr:[...sr],kind:m[1].toLowerCase(),dir:+m[2]});}}
// 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만)
let depth=0;
const wrapFn=fn=>{if(fn.__r1104)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;
   try{if(on)remember(frame.commands);}catch(err){fail(err);}
   try{const ink=window.__STORYWORLD_PERSONA_INK_R1097__;if(ink&&typeof ink.process==='function')ink.process(frame.commands);}catch(err){fail(err);}
   process(frame.commands);}}catch(err){fail(err);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1104=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
try{setInterval(wrapInst,500);}catch(e){fail(e);}wrapInst();
window.__STORYWORLD_PERSONA_STRIDE_R1104__=Object.freeze({revision:REV,storageKey:KEY,set,enabled:()=>on,process,walkSheets:WALK,dirs:DIRS,art:Object.freeze({...ART}),
 sheets:()=>{const o={};for(const k in SS)o[k]={state:SS[k].state,ink:SS[k].inkState,half:SS[k].inkHalf};return o;},
 inspect:()=>{const e=persona(),s=e?ST.get(e):null;return {revision:REV,on,walk:s?+s.w.toFixed(3):0,phase:s?+s.phase.toFixed(3):0,tuning:{HIP,OV,STEP,SWING,FOOT_LIFT,BOB,LEAN,WIN,WALK_V},sheets:Object.fromEntries(Object.entries(SS).map(([k,v])=>[k,v.state+'/'+v.inkState])),stats:{...stats},lastError};}});
})();
