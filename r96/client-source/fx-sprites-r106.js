/* R106: 그림 텍스처 이펙트 공용 함수.
 * 날개·후광·스킬 연출이 단순 도형(원·삼각형·네모)으로 그려지던 것을, 코드로 만든 회색 그림 텍스처
 * (assets/r106/fx/*.webp, scripts/r106-fx-sprites.py)를 영웅 고유색+보조색으로 물들여 그립니다.
 * - 회색 밝기 → 어두운 주색 → 주색 → 보조색 → 흰색 순서로 물들입니다(R102 영웅색과 같은 규칙).
 * - 물들인 그림은 바뀌지 않는 캔버스(__storyworldStaticTint)라 three 렌더러가 텍스처로 한 번만 올립니다.
 * - 그림이 아직 준비되지 않았으면 false를 돌려주고, 부르는 쪽은 예전 도형으로 그립니다.
 * - 보이는 것만 바뀌며 피해·판정·저장은 그대로입니다. */
(()=>{'use strict';
if(window.__STORYWORLD_FX_SPRITES_R106__)return;
const BASE='assets/r106/fx/';
// name: [w,h,[pivotX,pivotY],frames]; bolt frames are rows, flame frames are columns.
const META=Object.freeze({"glow":[128,128,[0.5,0.5],1],"orb":[64,64,[0.5,0.5],1],"flare":[256,256,[0.5,0.5],1],"ring":[256,256,[0.5,0.5],1],"halo":[256,96,[0.5,0.5],1],"slashline":[512,96,[0.5,0.5],1],"spark":[128,32,[1,0.5],1],"line":[64,32,[0.5,0.5],1],"wing":[512,512,[0.1277,0.4046],1],"feather":[48,144,[0.5,0.95],1],"petal":[64,48,[0.5,0.5],1],"shard":[96,192,[0.5,0.62],1],"pillar":[128,512,[0.5,0.99],1],"cross":[256,384,[0.5,0.3385],1],"bolt":[512,288,[0,0.5],4],"smoke":[256,256,[0.5,0.5],1],"crack":[256,256,[0.5,0.5],1],"pixel":[48,48,[0.5,0.5],1],"blade":[256,72,[0.5,0.5],1],"flame":[768,288,[0.5,0.97],4],"spike":[64,192,[0.5,0.99],1],"slash":[512,288,[0.5,1.0417],1],"slashwide":[512,288,[0.5,1.0417],1],"rune":[512,512,[0.5,0.5],1],"clock":[512,512,[0.5,0.5],1],"circuit":[512,512,[0.5,0.5],1]});
const ROWS=new Set(['bolt']);
const NAMES=Object.freeze(Object.keys(META));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const WHITE=[255,255,255];
const stats={builds:0,draws:0,misses:0,deferred:0,warmed:0,evicted:0,errors:0};let lastError=null;
function fail(e){stats.errors++;lastError=String(e?.message||e);}
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r106.fxsprites';
let enabled=true;try{const v=localStorage.getItem(KEY);if(v==='0')enabled=false;}catch(_){}
function setEnabled(on){enabled=!!on;try{localStorage.setItem(KEY,enabled?'1':'0');}catch(_){}return enabled;}
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);

// ---- palettes -----------------------------------------------------------------------
const luts=new Map();
function lut(F){const key=F.a.join()+'|'+F.b.join();let L=luts.get(key);if(L)return L;L=new Uint8ClampedArray(768);
 const stops=[[0,F.a.map(v=>v*.1)],[.3,F.a.map(v=>v*.5)],[.55,F.a],[.76,mix(F.a,F.b,.6)],[.9,F.b],[1,WHITE]];
 for(let i=0;i<256;i++){const l=i/255;let j=1;while(j<stops.length-1&&l>stops[j][0])j++;const[a0,c0]=stops[j-1],[a1,c1]=stops[j],c=mix(c0,c1,clamp((l-a0)/Math.max(1e-6,a1-a0),0,1));L[i*3]=c[0];L[i*3+1]=c[1];L[i*3+2]=c[2];}
 if(luts.size>48)luts.delete(luts.keys().next().value);luts.set(key,L);return L;}
const pals=new Map();
// One colour → that colour with a paler partner; [r,g,b] arrays or {a,b} pairs pass through.
function pal(a,b=null){if(a&&a.a&&a.b)return a;const A=(a||WHITE).map(v=>Math.round(v)),B=(b||mix(A,WHITE,.55)).map(v=>Math.round(v)),k=A.join()+'|'+B.join();let p=pals.get(k);if(!p){p=Object.freeze({a:Object.freeze(A),b:Object.freeze(B)});if(pals.size>96)pals.delete(pals.keys().next().value);pals.set(k,p);}return p;}
const parsed=new Map();
// 'rgba(r,g,b,a)' → {c:[r,g,b],a}; anything else → null
function parseColour(s){if(typeof s!=='string')return null;let v=parsed.get(s);if(v!==undefined)return v;const m=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);v=m?{c:[+m[1],+m[2],+m[3]],a:m[4]===undefined?1:+m[4]}:null;if(parsed.size>512)parsed.clear();parsed.set(s,v);return v;}

// ---- tinted copies ---------------------------------------------------------------------
const tints=new Map(),MAXT=220;let budgetAt=null,budget=0;
function source(name){const path=BASE+name+'.webp';if(typeof readyImage!=='function')return null;const row=readyImage(path);if(row?.image)return row.image;
 try{if(typeof imageCache!=='undefined'&&!imageCache.has(path)&&typeof addImage==='function')addImage(path,'R106 effect texture');}catch(e){fail(e);}return null;}
function build(name,F,im){const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!(w>0&&h>0))return null;
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});if(!g)return null;g.drawImage(im,0,0);
 const d=g.getImageData(0,0,w,h),px=d.data,L=lut(F);for(let i=0;i<px.length;i+=4){if(px[i+3]===0)continue;const j=px[i]*3;px[i]=L[j];px[i+1]=L[j+1];px[i+2]=L[j+2];}g.putImageData(d,0,0);
 cv.naturalWidth=w;cv.naturalHeight=h;try{Object.defineProperty(cv,'__storyworldStaticTint',{value:Object.freeze({path:'r106fx:'+name+':'+F.a.join('.')+':'+F.b.join('.'),immutable:true,r106:true})});}catch(_){}
 stats.builds++;return cv;}
function tinted(name,F,force=false){const k=name+'#'+F.a.join()+'|'+F.b.join();let c=tints.get(k);if(c){if(tints.size>MAXT/2){tints.delete(k);tints.set(k,c);}return c;}
 if(!META[name])return null;const im=source(name);if(!im)return null;
 const now=typeof time==='number'?time:0;if(budgetAt!==now){budgetAt=now;budget=lowFx()?1:3;}if(!force&&budget<=0){stats.deferred++;return null;}budget--;
 try{c=build(name,F,im);}catch(e){fail(e);c=null;}if(!c)return null;
 tints.set(k,c);while(tints.size>MAXT){tints.delete(tints.keys().next().value);stats.evicted++;}return c;}
const ready=(name,F)=>!!tints.get(name+'#'+F.a.join()+'|'+F.b.join());

// ---- drawing ------------------------------------------------------------------------------
// Draws sprite `name` with its pivot at (x,y), size w×h px. o: angle (after squash), squash
// (y scale applied before the rotation, for ground-plane art), flip, alpha, blend, frame, pivot.
function draw(name,F,x,y,w,h,o={}){if(!enabled||typeof ctx==='undefined'||!ctx)return false;
 if(!(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(w)&&Number.isFinite(h))||Math.abs(w)<.5||Math.abs(h)<.5)return true;
 const alpha=o.alpha??1;if(!(alpha>.004))return true;
 const m=META[name];if(!m)return false;const P=pal(F),c=tinted(name,P);if(!c){stats.misses++;return false;}
 const n=m[3],fr=n>1?((Math.floor(o.frame||0)%n)+n)%n:0,rows=ROWS.has(name),fw=rows?c.width:c.width/n,fh=rows?c.height/n:c.height,sx=rows?0:fr*fw,sy=rows?fr*fh:0,piv=o.pivot||m[2];
 ctx.save();try{ctx.translate(x,y);if(o.squash&&o.squash!==1)ctx.scale(1,o.squash);if(o.angle)ctx.rotate(o.angle);if(o.flip)ctx.scale(-1,1);
  ctx.globalAlpha*=clamp(alpha,0,1);ctx.globalCompositeOperation=o.blend||'lighter';ctx.drawImage(c,sx,sy,fw,fh,-piv[0]*w,-piv[1]*h,w,h);}
 catch(e){fail(e);}finally{ctx.restore();}stats.draws++;return true;}
// A sprite laid along a segment: its x axis from (x0,y0) to (x1,y1), `thick` px across.
// 'line' has its ends at 25%/75% of the width; other strips span the full width.
function along(name,F,x0,y0,x1,y1,thick,o={}){const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(!(L>=.5))return true;const a=Math.atan2(dy,dx);
 if(name==='line')return draw(name,F,(x0+x1)/2,(y0+y1)/2,L*2,thick*2,{...o,angle:a,pivot:[.5,.5]});
 return draw(name,F,x0,y0,L,thick,{...o,angle:a,pivot:[0,.5]});}
// Glowing polyline built from 'line' segments.
function poly(F,pts,thick,o={}){if(!Array.isArray(pts)||pts.length<2)return true;if(!tinted('line',pal(F)))return false;for(let i=1;i<pts.length;i++)along('line',F,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],thick,o);return true;}

// ---- warm-up: tinted copies for a palette are made a few per frame ahead of use ---------------
const queue=[];
function warm(F,names=NAMES){const P=pal(F);for(const n of names)if(META[n]&&!ready(n,P)&&!queue.some(q=>q[0]===n&&q[1]===P))queue.push([n,P]);}
function pump(){let n=lowFx()?1:2;while(queue.length&&n>0){const[name,P]=queue[0];if(ready(name,P)){queue.shift();continue;}const im=source(name);if(!im){queue.push(queue.shift());n--;continue;}
  if(tinted(name,P,true)){stats.warmed++;queue.shift();}else queue.push(queue.shift());n--;}}
if(typeof tick==='function'){const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);try{if(enabled&&queue.length&&!(typeof loading!=='undefined'&&loading))pump();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({revision:'R106-fx-sprites-1',base:BASE,names:NAMES,meta:META,on:()=>enabled,setEnabled,pal,parseColour,draw,along,poly,warm,ready:(n,F)=>ready(n,pal(F)),
 inspect:()=>({revision:'R106-fx-sprites-1',enabled,tints:tints.size,queue:queue.length,...stats,lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
