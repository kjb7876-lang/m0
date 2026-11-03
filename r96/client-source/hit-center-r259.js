// R259 플레이어 이펙트가 적 그림 가운데에 맞게 — 사용자 2026-11-03 "플레이어이펙트가 확실하게 적이미지중앙부근에 적중되도록".
//  실측(헤드리스 dist02): 진흙등 거미 몸 그림은 발 위 9~137px(가운데 ≈ 64px)인데, 엔진 기본 적중 그림(burst)은 영웅 키×0.3 ≈ 16px(다리)에 그려졌다.
//  R115 가 적 그림 가운데를 재지만(centreOf) ① 그 측정이 R248 몹 고유 시트·R260 대기보다 안쪽이라 R248 몹은 숨겨진 원래 그림 기준으로 재었고,
//  ② 엔진 기본 적중(burst·slash)·hero-fx-r102 기술(번개·화살 끝점)은 그 가운데를 쓰지 않았다.
//  · 가장 바깥 drawEnemy 에서(R248·R260 뒤) 실제로 칠해진 몸 그림의 불투명 사각형을 다시 재어 그 몹의 가운데로 쓴다(R115 와 같은 방식, 픽셀 읽기는 프레임당 6장까지).
//    R115 centreOf 를 이 값으로 먼저 답하게 바꿔 끼운다 → 이미 centreOf 를 쓰는 polish-r101 적중·vfx-r98 불꽃·visual-r119 도 R248 몹에서 맞는다.
//  · 엔진 fx() 로 적 발밑에 생긴 적중 그림(burst·slash)은 그 적 그림 가운데로, 숫자(text)는 머리 위로 옮겨 그린다.
//  · hero-fx-r102 기술의 끝점은 aim() 으로 그 적 그림 가운데를 겨눈다.
//  끄기: localStorage['storyworld.r259.hitCenter']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HIT_CENTER_R259__)return;
const REV='R259-hit-center-1',KEY='storyworld.r259.hitCenter',NEAR=.15;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={measured:0,scans:0,moved:0,aimed:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const now=()=>typeof performance!=='undefined'?performance.now()/1000:0;
const SKIP=/shadow|ring|glow|hp|bar|effects\/|vfx|fx|halo|aura|mark/i;// 몸이 아닌 그림
const VC=new WeakMap(),BOX=new WeakMap();let budget=6,scanCanvas=null,frameT=-1;
const srcOf=im=>{try{return String(im?.__path||im?.src||'');}catch(_){return '';}};
function opaqueBox(img,sx,sy,sw,sh){let m=BOX.get(img);if(!m){m=new Map();BOX.set(img,m);}const k=Math.round(sx)+','+Math.round(sy)+','+Math.round(sw)+','+Math.round(sh);if(m.has(k))return m.get(k);
 if(budget<=0||typeof document==='undefined')return null;budget--;let b={x0:0,y0:0,x1:1,y1:1};
 try{const N=40;scanCanvas??=document.createElement('canvas');scanCanvas.width=N;scanCanvas.height=N;const g=scanCanvas.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,N,N);g.drawImage(img,sx,sy,sw,sh,0,0,N,N);
  const d=g.getImageData(0,0,N,N).data;let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1>=0)b={x0:x0/N,y0:y0/N,x1:(x1+1)/N,y1:(y1+1)/N};stats.scans++;}catch(_){}
 if(m.size>2000)m.clear();m.set(k,b);return b;}
function record(e,best){const{img,sx,sy,sw,sh,dx,dy,dw,dh,T}=best;const b=opaqueBox(img,sx,sy,sw,sh);if(!b)return;
 const tp=(u,v)=>{const x=dx+dw*u,y=dy+dh*v;return{x:T.a*x+T.c*y+T.e,y:T.b*x+T.d*y+T.f};};
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [u,v] of [[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]]){const p=tp(u,v);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);}
 if(!(y1-y0>4))return;VC.set(e,{cx:(x0+x1)/2,cy:(y0+y1)/2,top:y0,bottom:y1,h:y1-y0,w:x1-x0,t:now()});stats.measured++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
 if(!on||!e||typeof ctx==='undefined'||typeof ctx?.getTransform!=='function'||typeof ctx?.drawImage!=='function')return base.apply(this,[e,...a]);
 const t=typeof time==='number'?time:0;if(t!==frameT){frameT=t;budget=6;}
 const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage;let best=null,bh=0;
 c.drawImage=function(img,...q){try{if(!SKIP.test(srcOf(img))){const T=c.getTransform();
   if(q.length===8){const h=Math.abs(q[7]*T.d)+Math.abs(q[7]*T.c);if(h>bh){bh=h;best={img,sx:q[0],sy:q[1],sw:q[2],sh:q[3],dx:q[4],dy:q[5],dw:q[6],dh:q[7],T};}}
   else if(q.length===4&&img){const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,h=Math.abs(q[3]*T.d);if(h>bh&&W&&H){bh=h;best={img,sx:0,sy:0,sw:W,sh:H,dx:q[0],dy:q[1],dw:q[2],dh:q[3],T};}}}}catch(_){}
  return prev.call(this,img,...q);};
 try{return base.apply(this,[e,...a]);}finally{if(own)c.drawImage=prev;else delete c.drawImage;if(best)try{record(e,best);}catch(err){fail(err);}}};}
function centreOf(e){if(!on||!e)return null;const v=VC.get(e);if(!v||now()-v.t>.6)return null;return v;}
const anyCentre=e=>{const v=centreOf(e);if(v)return v;try{return window.__STORYWORLD_PLAY_R115__?.centreOf?.(e)||null;}catch(_){return null;}};// 이 측정이 없으면 R115 측정
function enemyAt(x,y){try{for(const e of (typeof room==='object'&&room?.enemies)||[])if(e&&e.hp>0&&Math.abs(e.x-x)<NEAR&&Math.abs(e.y-y)<NEAR)return e;}catch(_){}return null;}
// R115 centreOf 를 이 측정으로 먼저 답하게(없으면 R115 값)
(function patch115(n=0){try{const P=window.__STORYWORLD_PLAY_R115__;if(P&&!P.__r259){const old=P.centreOf;window.__STORYWORLD_PLAY_R115__=Object.freeze({...P,__r259:true,centreOf(e){return centreOf(e)||(typeof old==='function'?old.call(P,e):null);}});return;}}catch(e){fail(e);}
 if(n<40&&typeof setTimeout==='function')setTimeout(()=>patch115(n+1),250);})();
// 엔진 fx(): 적 발밑에 생긴 적중 그림에 그 적을 붙여 둔다
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,...a){const r=base.apply(this,[type,x,y,...a]);
 try{if(on&&(type==='burst'||type==='slash'||type==='text')&&typeof effects!=='undefined'&&Array.isArray(effects)){const f=effects[effects.length-1];if(f&&f.x===x&&f.y===y){const e=enemyAt(x,y);if(e)f.r259E=e;}}}catch(err){fail(err);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){
 try{const e=on&&f?.r259E,v=e&&anyCentre(e);if(v&&typeof ctx?.translate==='function'&&typeof project==='function'){const q=project(f.x,f.y),AH=typeof actorHeight==='function'?actorHeight():60;
   const was=f.type==='text'?q.y-AH*.65:q.y-AH*.3,want=f.type==='text'?v.top-6:v.cy;ctx.save();try{ctx.translate(v.cx-q.x,want-was);stats.moved++;return base.apply(this,[f,...a]);}finally{ctx.restore();}}}catch(err){fail(err);}
 return base.apply(this,[f,...a]);};}
// 기술 끝점: 발밑(tx,ty)을 겨눈 점 → 그 적 그림 가운데. lift 는 그 효과가 원래 쓰던 높이(px, 발 위).
function aim(x,y,lift=0){const q=typeof project==='function'?project(x,y):{x:0,y:0};try{const e=on&&enemyAt(x,y),v=e&&anyCentre(e);if(v){stats.aimed++;return {x:v.cx,y:v.cy+lift};}}catch(err){fail(err);}return q;}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HIT_CENTER_R259__=Object.freeze({revision:REV,set,centreOf,aim,enemyAt,inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
