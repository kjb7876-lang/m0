// R298: mobile-only, presentation-only early rejection of offscreen image quads.
// The renderer already caps mobile DPR and R119/R287 handle FX creation and terrain.
// Here we avoid recording/snapshotting images that CommandScene would later discard.
// Actual transformed image bounds (not effect/sentinel positions) keep visible
// attacks, large sprites and R259 hit-centre translations intact. No particle,
// combat, save, frame timing or mobile-bonus state is changed.
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_PERF_R298__)return;
const REV='R298-mobile-perf-1',KEY='storyworld.r298.mobilePerf',MARGIN=128;
let on=true,installed=false,lastError=null;
try{on=JSON.parse(localStorage.getItem(KEY)||'null')?.on!==false;}catch(_){}
const stats={frames:0,images:0,culled:0,snapshotPixelsSaved:0,errors:0};
function mobile(){
 try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}
}
function safeStyle(r){
 // Spatial filters and destructive compositing may affect pixels beyond the quad.
 return (r.globalCompositeOperation==='source-over'||r.globalCompositeOperation==='lighter')&&r.shadowBlur===0&&
  (r.filter==='none'||/^(?:(?:brightness|contrast|saturate|grayscale|hue-rotate)\([^()]+\)\s*)+$/.test(r.filter));
}
function outside(r,image,a){
 if(!image||image===r.canvas||r.disposed||r.globalAlpha<=0||!safeStyle(r))return false;
 const kind=r.owner?.kind;if(kind!=='effect'&&kind!=='enemy')return false;
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
 if(!Number.isFinite(iw)||!Number.isFinite(ih)||iw<=0||ih<=0)return false;
 let sx=0,sy=0,sw=iw,sh=ih,x,y,w,h;
 if(a.length===2){[x,y]=a;w=iw;h=ih;}
 else if(a.length===4){[x,y,w,h]=a;}
 else if(a.length===8){[sx,sy,sw,sh,x,y,w,h]=a;}
 else return false;
 if(!Number.isFinite(sx)||!Number.isFinite(sy)||!Number.isFinite(sw)||!Number.isFinite(sh)||sw<=0||sh<=0||
  !Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(w)||!Number.isFinite(h)||w===0||h===0)return false;
 const m=r.matrix,d=r.dpr;
 if(!m||m.length!==6||!m.every(Number.isFinite)||!Number.isFinite(d)||d<=0)return false;
 // An affine rectangle's centre +/- projected half-extents gives the exact AABB,
 // including rotation, reflection and camera shake, without four temporary points.
 const cx=(m[0]*(x+w/2)+m[2]*(y+h/2)+m[4])/d,cy=(m[1]*(x+w/2)+m[3]*(y+h/2)+m[5])/d;
 const rx=(Math.abs(m[0]*w)+Math.abs(m[2]*h))/(2*d),ry=(Math.abs(m[1]*w)+Math.abs(m[3]*h))/(2*d);
 if(!Number.isFinite(cx)||!Number.isFinite(cy)||!Number.isFinite(rx)||!Number.isFinite(ry))return false;
 return cx+rx<-MARGIN||cy+ry<-MARGIN||cx-rx>r.__r298Width+MARGIN||cy-ry>r.__r298Height+MARGIN;
}
function install(){
 if(installed)return true;
 const p=window.StoryPhase1?.DrawCommands?.prototype;
 if(typeof p?.reset!=='function'||typeof p.drawImage!=='function')return false;
 const reset=p.reset,drawImage=p.drawImage;
 p.reset=function(...a){const result=reset.apply(this,a);
  this.__r298Active=on&&mobile();
  this.__r298Width=typeof W==='number'?W:this.canvas?.width/this.dpr;
  this.__r298Height=typeof H==='number'?H:this.canvas?.height/this.dpr;
  this.__r298Active=this.__r298Active&&Number.isFinite(this.__r298Width)&&this.__r298Width>0&&Number.isFinite(this.__r298Height)&&this.__r298Height>0;
  if(this.__r298Active)stats.frames++;return result;};
 p.drawImage=function(image,...a){
  if(on&&this.__r298Active){
   stats.images++;
   let skip=false;try{skip=outside(this,image,a);}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,160);}
   if(skip){
    // Reserve the original owner's ordinal so following snapshot/texture keys stay
    // stable when an earlier image leaves or re-enters the viewport.
    this.counts.set(this.owner.id,(this.counts.get(this.owner.id)||0)+1);
    stats.culled++;
    if(typeof image.getContext==='function'&&!image.__storyworldStaticTint&&!image.__storyworldStaticSource)stats.snapshotPixelsSaved+=(image.naturalWidth||image.width)*(image.naturalHeight||image.height);
    return;
   }
  }
  return drawImage.apply(this,[image,...a]);
 };
 installed=true;return true;
}
window.__STORYWORLD_MOBILE_PERF_R298__=Object.freeze({revision:REV,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,installed,on,mobile:mobile(),margin:MARGIN,stats:{...stats},lastError,GPUVerified:false})});
// The phase module is synchronous today; bounded retry also supports delayed boot.
function start(n=0){if(!install()&&n<40&&typeof setTimeout==='function')setTimeout(()=>start(n+1),250);}
start();
})();
