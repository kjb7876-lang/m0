/* R206 땅에 붙은 몹 — 사용자 2026-11-01 "떠다니는 몬스터 아니면 그림자 없애, 땅에 붙어 있는 느낌이 확실하게".
 *  몹을 그릴 때(drawEnemy) 엔진 접촉 그림자(shadow)를 부르면, 그 몹이 떠 있지 않으면 그리지 않는다.
 *  떠 있음 = R109 가 띄운 높이(visualLiftPx>0)·그림자 인자 lift>0·R100 그림 정보의 fly·이름이 날짐승·유령류.
 *  영웅·소품·투사체 그림자는 그대로. 판정·위치·저장은 그대로. storyworld.r206.ground {on:false} 로 원래대로.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_MOB_GROUND_R206__)return;
const REV='R206-ground-2',KEY='storyworld.r206.ground';
let prefs={on:true,contact:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of ['on','contact'])if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={skipped:0,kept:0,contacts:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const FLY_NAME=/유령|망령|혼령|원혼|잔영|박쥐|나방|날개|비행|부유|떠도는|wisp|ghost|bat|moth|wing|fly|hover|float/i;
function floating(e,opt){try{if(e?.r208Mob)return false;/* R208 땅 몹 그림 */if(Number(e?.visualLiftPx)>0.5||Number(opt?.lift)>0.02)return true;if(window.__STORYWORLD_POLISH_R100__?.artOf?.(e)?.fly)return true;
 return FLY_NAME.test(String(e?.name||'')+' '+String(e?.nativeId||'')+' '+String(e?.r200Shade||''));}catch(err){fail(err);return false;}}
let cur=null,painted=false;
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(x,lo));
const RING=Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8),Math.sin(i*Math.PI/8)]);
const NOT_MOB=e=>e.dead||e.visible===false||e.disabled===true||e.hero||e.ally||e.friendly||e.r953Ally||e.prop||e.object||e.terrainWall||e.r170Tower||e.r446Pillar||e.r251Circle||e.towerR193||e.r193Tower;
// Keep the old pixel-save path and its distinct quantized shadow unchanged.
let pixelApi=null,pixelAt=NaN,usingPixel=false;
function legacyPixel(){
 const api=window.__STORYWORLD_MOB_ART_VARIANTS_R306__,t=typeof time==='number'?time:0;
 if(!api?.inspect)return false;
 if(api!==pixelApi||t!==pixelAt){pixelApi=api;pixelAt=t;usingPixel=api.inspect().mode==='pixel';}
 return usingPixel;
}
function contactOnly(e,radius=18,opt){
 if(!prefs.contact||painted||!cur||e!==cur||!(e.hp>0)||e.spawnState!=='active'||NOT_MOB(e)||e.visualLiftPx>.5||opt?.lift>.02||floating(e,opt))return;
 if(typeof ctx!=='object'||!ctx||typeof ctx.ellipse!=='function'||typeof project!=='function'||!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(radius)||radius<=0)return;
 const fade=Number.isFinite(opt?.alpha)?clamp(opt.alpha,0,1):1;
 if(fade<=.01)return;
 try{
  if(legacyPixel())return;
  const q=project(e.x,e.y);if(!Number.isFinite(q.x)||!Number.isFinite(q.y))return;
  const z=typeof zoom==='number'&&Number.isFinite(zoom)&&zoom>0?zoom:1;
  const light=typeof settings==='object'&&settings?.lowFx||typeof coarsePointerQueryR63R2==='object'&&coarsePointerQueryR63R2?.matches;
  const rx=Math.min(radius*.40,22*z),ry=Math.max(.55*z,rx*(light ? .22 : .30)),alpha=(light ? .46 : .58)*fade;
  const g=ctx;
  function paint(){
   g.save();try{g.globalAlpha*=alpha;g.fillStyle='#0b0d0e';g.beginPath();
    if(typeof g.scope==='function'){
     // One bounded ellipse path in the recorder (no gradients or extra snapshots).
     const n=light?2:1;g.moveTo(q.x+rx,q.y);
     for(let i=n;i<RING.length;i+=n)g.lineTo(q.x+RING[i][0]*rx,q.y+RING[i][1]*ry);
     g.closePath();
    }else g.ellipse(q.x,q.y,rx,ry,0,0,Math.PI*2);
    g.fill();}finally{g.restore();}
  }
  // Match the existing Three recorder scope when drawing a ground ellipse, not a body mesh.
  if(typeof g.scope==='function'&&g.owner?.kind==='enemy')g.scope({...g.owner,kind:'contact'},paint);
  else if(typeof g.scope!=='function')paint();
  else return; // do not attribute a new ellipse to another actor or a scene/FX command.
  painted=true;stats.contacts++;
 }catch(err){fail(err);}
}
if(typeof drawEnemy==='function'){
 const base=drawEnemy;
 drawEnemy=function(e,...a){
  const prev=cur,prior=painted;cur=e||null;painted=false;
  try{return base.call(this,e,...a);}finally{cur=prev;painted=prior;}
 };
}
if(typeof shadow==='function'){
 const base=shadow;
 shadow=function(x,y,radius,opt,...a){
  if(prefs.on&&cur&&!floating(cur,opt)){stats.skipped++;contactOnly(cur,radius,opt);return;}
  if(cur)stats.kept++;
  const result=base.apply(this,arguments);
  if(cur)contactOnly(cur,radius,opt);
  return result;
 };
}
function set(p){for(const k of ['on','contact'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOB_GROUND_R206__=Object.freeze({revision:REV,set,floating,contactOnly,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
