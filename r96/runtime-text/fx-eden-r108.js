/* R108 EDEN: Dark-Eden-style painted skill effects.
 * 12 painted additive atlases (assets/r108/eden/*.webp, 1024x1024, 4x4 cells of 256 px, straight RGBA, drawn with 'lighter')
 * play as clips: charge on the caster -> cast -> travel -> impact -> afterglow.
 *  - atlas manager: lazy load through addImage/readyImage, at most MAX_RESIDENT atlases resident (least recently used goes
 *    first), idle atlases are released after IDLE_MS (the current hero's own sheets stay), re-requested when the game purges
 *    its image cache on region entry. Neutral sheets (nova, smoke) are tinted per hero at half resolution (1 MB each).
 *  - fx-d2s-r106.js calls pre()/post() for each hero archetype: pre() paints the whole archetype (returns true) or, when its
 *    atlas is not decoded yet / lowFx, returns false and the R106/R107 sprite drawing runs; post() adds painted layers on top.
 *  - own effects: guard dome (D/3), blink vortex (S/2), EGO ring (F/5), skill hit sparks.
 * R116: growth-linked. Painted layers start plain (R102 tier 0: 62% size, 60% light, no flares) and grow with the
 *   skill tier (full size and light from tier 5, flares from tier 3) — basic attacks stay plain as the owner asked.
 * Presentation only: no damage, cooldown, hit shape, collision, spawn or save is read for writing. */
(()=>{'use strict';
if(window.__STORYWORLD_EDEN_R108__&&!window.__STORYWORLD_EDEN_R108__.stub)return;
const D=window.__STORYWORLD_EDEN_DATA_R108__;
if(!D||D.stub||typeof drawEffect!=='function'||typeof tick!=='function'||typeof project!=='function'||typeof imageCache==='undefined'||typeof addImage!=='function')return;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const rnd=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
const MAX_RESIDENT=6,IDLE_MS=20000,CELL=256,TINT_CELL=128,MAX_TINTS=3,MAX_SPARKS=14,MAX_OWN=20;
const stats={draws:0,bands:0,pre:0,post:0,fallbacks:0,loads:0,evicted:0,released:0,sparks:0,guard:0,blink:0,ego:0,tints:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e);};
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__,R102=()=>window.__STORYWORLD_HERO_FX_R102__;
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.eden';
let enabled=true;try{if(localStorage.getItem(KEY)==='0')enabled=false;}catch(_){}
const on=()=>enabled&&!!SP()?.on?.();
function setEnabled(v){enabled=!!v;try{localStorage.setItem(KEY,enabled?'1':'0');}catch(_){}return enabled;}
const Hh=()=>typeof actorHeight==='function'?actorHeight():60;
const P=(x,y,z=0)=>{const q=project(x,y);return{x:q.x,y:q.y-z};};
const nowMs=()=>performance.now();

// ---- atlas manager -----------------------------------------------------------------------------------------
const NAMES=Object.keys(D.sheets),A={};
for(const n of NAMES)A[n]={path:D.base+n+'.webp',last:0,retry:0};
// the current hero's own sheets: kept resident while that hero plays (everything else follows the 20 s idle rule)
const CORE=Object.freeze({hwando:['hit','slash'],seoha:['ice'],neon:['lightning'],michaela:['holy'],lauren:['fire'],hunter:['hit'],slayer:['earth'],gunner:['nova','hit']});
const rowOf=n=>imageCache.get(A[n].path)||null;
const isCore=n=>!!(live()&&CORE[player.hero]?.includes(n));
function resident(){const out=[];for(const n of NAMES)if(rowOf(n))out.push(n);return out;}
function dropSheet(n,why){const a=A[n];if(imageCache.delete(a.path)){stats[why]=(stats[why]||0)+1;return true;}return false;}
function evictOne(except){let best=null,bt=Infinity;const t=nowMs();for(const n of resident()){if(n===except)continue;const a=A[n];if(t-a.last<400)continue;// drawn in the last 0.4 s: in use
  const score=a.last+(isCore(n)?6e4:0);if(score<bt){bt=score;best=n;}}return best?dropSheet(best,'evicted'):false;}
// Returns the decoded image or null (and starts loading it). `lite` marks the hero's own sheets, the only ones lowFx may load.
function ensure(n,force=false){const a=A[n];if(!a)return null;const t=nowMs(),row=rowOf(n);
 if(row){if(row.ready&&row.image){a.last=t;return row.image;}if(row.error){imageCache.delete(a.path);a.retry=t+6000;}return null;}
 if(t<a.retry||document.hidden)return null;if(lowFx()&&!isCore(n)&&!force)return null;
 let guard=0;while(resident().length>=MAX_RESIDENT&&guard++<4)if(!evictOne(n))return null;
 try{addImage(a.path,'R108 eden painted effect');a.last=t;stats.loads++;}catch(e){fail(e);a.retry=t+6000;}return null;}
const has=n=>!!(rowOf(n)?.ready&&rowOf(n).image);
function residentBytes(){let b=0;for(const n of resident())if(rowOf(n).ready)b+=D.sheets[n].w*D.sheets[n].h*4;for(const r of tints.values())b+=r.cv.width*r.cv.height*4;return b;}

// ---- tinted copies of the neutral sheets (nova, smoke) at half resolution ------------------------------------
const tints=new Map(),luts=new Map();
const mixc=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
function lut(F){const key=F.a.join()+'|'+F.b.join();let L=luts.get(key);if(L)return L;L=new Uint8ClampedArray(768);
 const stops=[[0,F.a.map(v=>v*.35)],[.3,F.a.map(v=>v*.7)],[.55,F.a],[.78,mixc(F.a,F.b,.6)],[.92,F.b],[1,[255,255,255]]];
 for(let i=0;i<256;i++){const l=i/255;let j=1;while(j<stops.length-1&&l>stops[j][0])j++;const[a0,c0]=stops[j-1],[a1,c1]=stops[j],c=mixc(c0,c1,clamp((l-a0)/Math.max(1e-6,a1-a0),0,1));L[i*3]=c[0];L[i*3+1]=c[1];L[i*3+2]=c[2];}
 if(luts.size>12)luts.delete(luts.keys().next().value);luts.set(key,L);return L;}
function tintCanvas(sheet,F){const key=sheet+'#'+F.a.join()+'|'+F.b.join();let r=tints.get(key);if(r){r.last=nowMs();return r.cv;}
 const im=ensure(sheet);if(!im)return null;
 try{const n=CELL*4*(TINT_CELL/CELL),cv=document.createElement('canvas');cv.width=cv.height=n;const g=cv.getContext('2d',{willReadFrequently:true});if(!g)return null;g.drawImage(im,0,0,n,n);
  const d=g.getImageData(0,0,n,n),px=d.data,L=lut(F);for(let i=0;i<px.length;i+=4){const al=px[i+3];if(!al)continue;const j=al*3;px[i]=L[j];px[i+1]=L[j+1];px[i+2]=L[j+2];}g.putImageData(d,0,0);
  cv.naturalWidth=cv.naturalHeight=n;try{Object.defineProperty(cv,'__storyworldStaticTint',{value:Object.freeze({path:'r108eden:'+key,immutable:true,r108:true})});}catch(_){}
  while(tints.size>=MAX_TINTS)tints.delete(tints.keys().next().value);tints.set(key,{cv,last:nowMs()});stats.tints++;return cv;}catch(e){fail(e);return null;}}

// ---- painted frames ----------------------------------------------------------------------------------------------
// Draws cell `fr` of `sheet` with its pivot (share of the cell) at (x,y); `size` = px width of the whole 256 px cell.
// o: alpha, angle (rotation around the pivot), flip, squash, blend, tint (palette {a,b}), noVeil, fade (top-edge bands for art cut at the cell top)
function frame(sheet,fr,x,y,size,o){o=o||{};const alpha=(o.alpha??1)*tLight();size*=tSize();if(!(alpha>.004)||!(size>=1)||!Number.isFinite(x+y+size))return true;
 if(typeof ctx==='undefined'||!ctx)return false;
 let src=null,c=CELL;if(o.tint){src=tintCanvas(sheet,o.tint);if(src)c=TINT_CELL;}if(!src)src=ensure(sheet);if(!src)return false;
 fr=((fr|0)%16+16)%16;const sx=(fr&3)*c,sy=(fr>>2)*c,piv=o.pivot||[.5,.5],bb=D.box[sheet][fr];let veil=1;
 if(!o.noVeil){const s=SP();if(s?.veilBox){const sq=o.squash||1,bw=(bb[2]-bb[0]+1)/CELL*size,bh=(bb[3]-bb[1]+1)/CELL*size*sq,ext=o.angle?Math.max(bw,bh):0;
   const cx=x+(o.angle?0:((bb[0]+bb[2])/2/CELL-piv[0])*size),cy=y+(o.angle?0:((bb[1]+bb[3])/2/CELL-piv[1])*size*sq);veil=s.veilBox(cx,cy,ext||bw,ext||bh,o.blend||'lighter');}}
 const a=clamp(alpha*veil,0,1);if(!(a>.004))return true;
 ctx.save();try{ctx.translate(x,y);if(o.squash&&o.squash!==1)ctx.scale(1,o.squash);if(o.angle)ctx.rotate(o.angle);if(o.flip)ctx.scale(-1,1);
  ctx.globalCompositeOperation=o.blend||'lighter';const dx=-piv[0]*size,dy=-piv[1]*size;
  // art cut off at the top of its cell (holy pillar): the top 22% is drawn in four bands that fade in, so no hard edge shows
  const cut=o.fade!==false&&bb[1]<=1&&sheet==='holy';
  if(cut){const band=c*.055,h4=size*.055;for(let k=0;k<4;k++){ctx.globalAlpha=a*(.12+.26*k+(k>2?.0:0));ctx.drawImage(src,sx,sy+band*k,c,band,dx,dy+h4*k,size,h4);stats.bands++;}
   ctx.globalAlpha=a;ctx.drawImage(src,sx,sy+band*4,c,c-band*4,dx,dy+h4*4,size,size-h4*4);}
  else{ctx.globalAlpha=a;ctx.drawImage(src,sx,sy,c,c,dx,dy,size,size);}
 }catch(e){fail(e);return false;}finally{ctx.restore();}stats.draws++;return true;}
// Plays clip `name` at time t (s): loops or holds its last frame; returns false when the atlas is not ready yet.
function clipFrame(c,t){const n=c.b-c.a+1,i=Math.floor(Math.max(0,t)*c.fps);return c.a+(c.loop?i%n:Math.min(n-1,i));}
function clip(name,t,x,y,size,o){const c=D.clips[name];if(!c)return false;return frame(c.s,clipFrame(c,t),x,y,size,{pivot:c.p,...o});}
// progress version: u in 0..1 spans the whole clip (the effect's own timing decides the pace)
function clipU(name,u,x,y,size,o){const c=D.clips[name];if(!c)return false;const n=c.b-c.a+1;return frame(c.s,c.a+Math.min(n-1,Math.floor(clamp(u,0,.9999)*n)),x,y,size,{pivot:c.p,...o});}
const clipLen=name=>{const c=D.clips[name];return(c.b-c.a+1)/c.fps;};
// A vertical bolt (top -> impact) stretched from screen point a to b: the cell's +y axis runs along the segment.
function bolt(name,fr,ax,ay,bx,by,thick,o){o=o||{};const c=D.clips[name],dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy);if(!c||!(L>2))return true;
 const src=ensure(c.s);if(!src)return false;fr=((fr|0)%16+16)%16;const body=c.len*CELL,sy=L/body,sx=Math.max(thick/(CELL*.5),sy*.5),bb=D.box[c.s][fr];
 const veil=o.noVeil?1:SP()?.veilBox?.((ax+bx)/2,(ay+by)/2,Math.abs(dx)+thick,Math.abs(dy)+thick,'lighter')??1,al=clamp((o.alpha??1)*veil*tLight(),0,1);if(!(al>.004))return true;void bb;
 ctx.save();try{ctx.translate(ax,ay);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);ctx.scale(sx,sy);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al;
  ctx.drawImage(src,(fr&3)*CELL,(fr>>2)*CELL,CELL,CELL,-c.p[0]*CELL,-c.p[1]*CELL,CELL,CELL);}catch(e){fail(e);return false;}finally{ctx.restore();}stats.draws++;return true;}

// ---- small helpers on the existing sprite library ------------------------------------------------------------------
function S(name,F,x,y,w,h,o){const s=SP();if(!s)return false;if(curTier>=0){if(name==='flare'&&curTier<3)return true;const k=tSize();w*=k;h*=k;o={...(o||{}),alpha:(o?.alpha??1)*tLight()};}return s.draw(name,F,x,y,w,h,o);}
function Aln(name,F,x0,y0,x1,y1,th,o){const s=SP();return!!s&&s.along(name,F,x0,y0,x1,y1,th,o);}
const pb=F=>SP()?.pal?.(F.b)||F;
const heroOf=e=>e.F||R102()?.PALETTE?.[e.hero]||{a:[255,255,255],b:[255,255,255]};
const screenAngle=a=>{const o=project(0,0),d=project(Math.cos(a),Math.sin(a));return Math.atan2(d.y-o.y,d.x-o.x);};
const TM=[1,1,1.06,1.12,1.18,1.24,1.3,1.36];
// R116: painted size / light by skill tier while a hero archetype is drawn (own sparks/dome/EGO ring keep 1)
const TS=[.62,.7,.78,.86,.94,1,1,1],TL=[.6,.67,.74,.81,.88,.95,1,1];let curTier=-1;
const tSize=()=>curTier<0?1:TS[clamp(curTier,0,7)],tLight=()=>curTier<0?1:TL[clamp(curTier,0,7)];
const tierK=e=>TM[clamp(e.tier|0,0,7)];
function enemies(){try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return[];}}

// ---- own effect list: skill hit sparks, guard dome, blink vortex, EGO ring ---------------------------------------
const list=[];let serial=0,frozen=false;
const SENTINEL={type:'r108-eden',x:0,y:0,age:0,life:Infinity,r108Sentinel:true};
function add(e){if(list.length>=MAX_OWN){const i=list.findIndex(v=>v.kind==='spark');list.splice(i>=0?i:0,1);}e.id='r108eden:'+(++serial);e.t=0;list.push(e);return e;}
function sparkCount(){let n=0;for(const e of list)if(e.kind==='spark')n++;return n;}
const SPARK_KIND={gold:{clip:'hit.gold',size:1.25},blood:{clip:'hit.blood',size:1.35},small:{clip:'hit.gold',size:.8},slash:{clip:'slash.gold',size:1.6}};
// Painted skill hit: kind gold | blood | small | slash; x,y world, z lift in actor heights. Returns true when queued.
function hitSpark(x,y,kind,z){if(!enabled||!live()||!Number.isFinite(x+y)||sparkCount()>=MAX_SPARKS)return false;const k=SPARK_KIND[kind]||SPARK_KIND.gold;
 if(!has('hit')&&!ensure('hit'))return false;
 add({kind:'spark',x,y,z:Number.isFinite(z)?z:.45,spec:k,seed:Math.random()*6.28,life:clipLen(k.clip)+.04,w:lowFx()?.7:1});stats.sparks++;return true;}
const SPARK_HERO={hwando:'gold',seoha:'small',neon:'small',michaela:'gold',lauren:'gold',hunter:'small',slayer:'blood',gunner:'small'};
const lastSpark=new WeakMap();
if(typeof hitEnemy==='function'){const hb=hitEnemy;hitEnemy=function(e,value,source,...rest){let hero=null,before=null;
 try{if(on()&&live()&&e){before=e.hp;hero=R102()?.skillOf?.(source)||null;}}catch(err){fail(err);}
 const r=hb.call(this,e,value,source,...rest);
 try{if(hero&&r&&Number.isFinite(before)&&e.hp<before){const t=nowMs();if(t-(lastSpark.get(e)||0)>70){lastSpark.set(e,t);hitSpark(e.x,e.y,SPARK_HERO[hero]||'gold');}}}catch(err){fail(err);}return r;};}
// guard dome: forms while D is held, pulses, fades when released
let guardFx=null;
function guardWatch(){const g=!!player.guard;if(g&&!guardFx){if(lowFx())return;ensure('dome');guardFx=add({kind:'dome',x:player.x,y:player.y,t:0,life:Infinity,out:null});stats.guard++;}
 else if(!g&&guardFx&&guardFx.out===null){guardFx.out=0;}}
function drawDome(e,h){const q=P(player.x,player.y),a0=e.out!==null?1-clamp(e.out/.22,0,1):1,form=clipLen('dome.form');if(!(a0>0))return;
 const x=q.x,y=q.y+h*.02,size=h*(2.7+.1*Math.sin(e.t*5)),al=.72*a0;
 const ok=e.t<form?clip('dome.form',e.t,x,y,size,{alpha:al,noVeil:true}):clip('dome.loop',e.t-form,x,y,size,{alpha:al,noVeil:true});
 if(ok)e.painted=true;}
// blink vortex: gathers where the hero left, dissolves where it arrives
const blinkBase=typeof blink==='function'?blink:null;
if(blinkBase){blink=function(...a){let ox=0,oy=0,had=false;try{if(live()&&on()&&!(player.blinkCD>0)){ox=player.x;oy=player.y;had=true;}}catch(_){}
 const r=blinkBase.apply(this,a);try{if(had&&player.blinkCD>0&&!lowFx()){const F=R102()?.PALETTE?.[player.hero];ensure('smoke');add({kind:'vortex',x:ox,y:oy,F,t:0,life:clipLen('smoke.all')+.05,mode:'all'});add({kind:'vortex',x:player.x,y:player.y,F,t:0,life:clipLen('smoke.mid')+.05,mode:'out'});stats.blink++;}}catch(err){fail(err);}return r;};}
// EGO awakening: nova ring in the hero's colours + holy flare
const egoBase=typeof ego==='function'?ego:null;
if(egoBase){ego=function(...a){let had=false;try{had=live()&&on()&&!(player.ego>0)&&!(player.egoCD>0)&&player.resonance>=30&&!(player.samong>0);}catch(_){}
 const r=egoBase.apply(this,a);try{if(had&&player.ego>0&&!lowFx()){const F=R102()?.PALETTE?.[player.hero];ensure('nova');ensure('holy');add({kind:'egoRing',x:player.x,y:player.y,F,t:0,life:clipLen('nova.all')+.1,seed:Math.random()*6.28});stats.ego++;}}catch(err){fail(err);}return r;};}

function drawOwn(e,h){
 if(e.kind==='spark'){const q=P(e.x,e.y,h*e.z),sz=h*e.spec.size*e.w*(reduced()?.8:1);clip(e.spec.clip,e.t,q.x,q.y,sz,{angle:e.seed,alpha:(reduced()?.7:1)*(1-smooth((e.t-e.life*.7)/(e.life*.3)))});return;}
 if(e.kind==='dome'){drawDome(e,h);return;}
 if(e.kind==='vortex'){const q=P(e.x,e.y),F=e.F,tint=F?{a:F.a,b:F.b}:null,al=e.mode==='all'?.9:.7,y=q.y+h*.04,fade=1-smooth((e.t-e.life*.75)/(e.life*.25));
  const nm=e.mode==='all'?'smoke.all':'smoke.mid',sz=h*(e.mode==='all'?2.6:2.3);
  if(!clip(nm,e.t,q.x,y,sz,{alpha:al*fade,tint})&&tint)clip(nm,e.t,q.x,y,sz,{alpha:al*fade*.8});return;}
 if(e.kind==='egoRing'){const q=P(e.x,e.y),F=e.F,u=e.t/e.life,tint=F?{a:F.a,b:F.b}:null,sz=h*(5.6+2.2*smooth(u)),al=1-smooth((u-.55)/.45);
  if(!clip('nova.all',e.t,q.x,q.y+h*.02,sz,{alpha:al,tint,squash:1,noVeil:true})&&tint)clip('nova.all',e.t,q.x,q.y+h*.02,sz,{alpha:al*.8,noVeil:true});
  const v=clamp(e.t/.5,0,1);clip('holy.burst',e.t*.9,q.x,q.y,h*(2.6+1.2*v),{alpha:.85*(1-smooth((u-.4)/.5))});
  if(!reduced()&&u<.35){const f=SP();if(f){f.draw('flare',pb(F||{a:[255,255,255],b:[255,255,255]}),q.x,q.y-h*.55,h*(2.2+2.4*u),h*(2.2+2.4*u),{alpha:(1-u/.35)*.8,angle:u*3,overHero:false});}}return;}
}
function drawAllOwn(){if(!list.length||typeof ctx==='undefined'||!ctx)return;const h=Hh();
 for(const e of list){ctx.save();try{const run=()=>drawOwn(e,h);if(typeof ctx.scope==='function')ctx.scope({id:e.id,kind:'effect',x:e.x,y:e.y,r108:true},run);else run();}catch(err){fail(err);}finally{ctx.restore();}}}

// ---- hero archetypes (called by fx-d2s-r106.js) --------------------------------------------------------------------
// pre(e,u,h,dt): paints the whole archetype -> true, or false when the atlas is not decoded yet (legacy drawing runs).
// post(e,u,h,dt): extra painted layers over the legacy drawing.
const PRE={},POST={};
const NEED={orb:['ice'],chain:['lightning'],fist:['holy'],meteor:['fire'],fissure:['earth'],nova:['nova'],iai:['hit','slash'],multishot:['hit']};
function ready(names){let ok=true;for(const n of names){if(!has(n)){ensure(n);ok=false;}else A[n].last=nowMs();}return ok;}

// hwando: gold sparks at every cut + a silver-blue / gold slash flash (the R107 * and # cuts stay as they are)
POST.iai=(e,u,h)=>{if(!ready(NEED.iai))return;const T=e.t,lo=lowFx(),cs=e.cuts||[],o=e.fx||e;
 const c=P(o.x,o.y,h*.5),ang=screenAngle(e.a);
 clip('slash.silver',T-.05,c.x,c.y,h*3.1*tierK(e),{angle:ang+.5,alpha:.8});
 const last=cs.length?cs[cs.length-1].t0+.06:.4;clip('slash.gold',T-last,c.x,c.y,h*3.4*tierK(e),{angle:ang-.35,alpha:.9,flip:true});
 const n=lo?Math.min(4,cs.length):cs.length;for(let i=0;i<n;i++){const cut=cs[i],v=T-(cut.t0+.045);if(v<0||v>clipLen('hit.gold')+.02)continue;const m=P(cut.cx,cut.cy,h*.42);
  clip('hit.gold',v,m.x,m.y,h*1.55*tierK(e),{angle:cut.ang+i,alpha:.95});}};

// seoha: charge glow at the hands, ice crowns rising along the path, big eruption + frost at the end of the flight
POST.orb=(e,u,h)=>{if(!ready(NEED.orb))return;const T=e.t,F=heroOf(e),lo=lowFx(),Tend=1.1,sp=e.speed||5.2,k=tierK(e);
 if(T<.26){const hx=P(e.x+Math.cos(e.a)*.5,e.y+Math.sin(e.a)*.5,h*.62),g=1-T/.26;S('glow',F,hx.x,hx.y,h*(.5+1.4*(1-g)),h*(.5+1.4*(1-g)),{alpha:.35+.6*g});S('flare',pb(F),hx.x,hx.y,h*(.9+.6*(1-g)),h*(.9+.6*(1-g)),{angle:T*9,alpha:.7*g,overHero:true});}
 const n=lo?2:3+Math.min(3,e.tier>>1);
 for(let i=0;i<n;i++){const ts=.2+i*.2,v=T-ts;if(v<0||v>clipLen('ice.rise')+clipLen('ice.shatter')+.02)continue;const d=sp*Math.min(ts,Tend),q=P(e.x+Math.cos(e.a)*d,e.y+Math.sin(e.a)*d),sz=h*(1.7+.18*i)*k,rise=clipLen('ice.rise')*.85;
  if(v<rise)clip('ice.rise',v*(clipLen('ice.rise')/rise),q.x,q.y,sz,{alpha:.95});else clip('ice.shatter',v-rise,q.x,q.y-h*.1,sz,{alpha:.9});}
 const v=T-(Tend-.05);if(v>0){const q=P(e.bx??(e.x+Math.cos(e.a)*sp*Tend),e.by??(e.y+Math.sin(e.a)*sp*Tend)),rise=.32,sz=h*3.6*k;
  if(v<rise)clip('ice.rise',v*(clipLen('ice.rise')/rise),q.x,q.y,sz,{alpha:1});else clip('ice.shatter',v-rise,q.x,q.y-h*.14,sz*1.05,{alpha:.95});
  if(v<.5&&!reduced())S('flare',pb(F),q.x,q.y-h*.5,h*3.2*(1-v),h*3.2*(1-v),{alpha:(1-v/.5)*.8,angle:v*3});}};

// neon: flash on the caster, a painted bolt stretched along every hop, impact ring at every enemy
PRE.chain=(e,u,h)=>{if(!ready(NEED.chain))return false;const F=heroOf(e),T=e.t,step=.07,fr=Math.floor(time*(reduced()?10:24));let from=P(e.x,e.y,h*.55);const k=tierK(e);
 const c0=P(e.x,e.y);if(T<.36)clip('lightning.ring',T,c0.x,c0.y+h*.02,h*1.9*k,{alpha:.85});
 if(T<.2&&!reduced())S('flare',pb(F),from.x,from.y,h*(1.2+1.6*T/.2),h*(1.2+1.6*T/.2),{alpha:(1-T/.2)*.9,angle:T*8,overHero:true});
 e.hops.forEach((hp,i)=>{const v=T-i*step,ok=hp.e&&hp.e.hp>0,hx=ok?hp.e.x:hp.x,hy=ok?hp.e.y:hp.y,to=P(hx,hy,h*.45);
  if(v>0&&v<.34){const a=1-smooth((v-.16)/.18);bolt('lightning.bolt',fr+i*3,from.x,from.y,to.x,to.y,h*(1.1+.1*e.tier),{alpha:a});if(!lowFx())bolt('lightning.bolt',fr+i*3+5,from.x,from.y,to.x,to.y,h*.7,{alpha:.55*a});
   const g=P(hx,hy);clip('lightning.ring',v+.03,g.x,g.y+h*.02,h*1.7*k,{alpha:a});if(v<.12)S('glow',F,to.x,to.y,h*1.4,h*1.4,{alpha:.7*(1-v/.12)});}
  from=to;});
 for(let i=0;i<e.bolts;i++){const v=T-.02*i;if(v<0||v>.6)continue;const ang=e.a+(rnd(e.seed,i)-.5)*1.8,d=v*5,j=Math.sin(time*40+i*3)*.25,q=P(e.x+Math.cos(ang)*d-Math.sin(ang)*j,e.y+Math.sin(ang)*d+Math.cos(ang)*j,h*.3),a=1-v/.6;
  S('orb',pb(F),q.x,q.y,h*.3,h*.3,{alpha:a});if(!reduced())S('flare',F,q.x,q.y,h*.46,h*.46,{angle:time*20+i,alpha:.75*a});}
 return true;};

// michaela: light pillar on the target (frames 0-7) -> burst ring (8-15) + feathers; wings on the caster as before
PRE.fist=(e,u,h)=>{if(!ready(NEED.fist))return false;const F=heroOf(e),T=e.t,q=P(e.tx,e.ty),k=tierK(e),pl=clipLen('holy.pillar'),a=1-smooth((u-.62)/.38);
 if(T<pl+.25){const al=T<pl?1:1-(T-pl)/.25;clip('holy.pillar',T,q.x,q.y,h*5.0*k,{alpha:al*.95});if(T>.08&&T<.36){const g=1-(T-.08)/.28;S('glow',GOLD,q.x,q.y-h*.2,h*3.4,h*1.5,{alpha:.7*g});if(!lowFx())clip('holy.pillar',T,q.x,q.y,h*5.0*k,{alpha:.4*g,noVeil:true});}}
 const b=T-(pl-.07);if(b>0){clip('holy.burst',b,q.x,q.y,h*4.8*k,{alpha:Math.min(1,a*1.1)});if(!reduced()&&b<.4)S('flare',pb(F),q.x,q.y-h*.4,h*3.2*(.5+b),h*3.2*(.5+b),{angle:b*2,alpha:(1-b/.4)*.8});}
 const nf=lowFx()?5:9;for(let i=0;i<nf;i++){const v=(T-.12-i*.045)/.9;if(v<0||v>1)continue;const ang=rnd(e.seed,i)*TAU,d=.4+2.4*smooth(v)*(.5+rnd(e.seed,i+4)),fq=P(e.tx+Math.cos(ang)*d,e.ty+Math.sin(ang)*d,h*(.3+1.5*v));
  S('feather',F,fq.x,fq.y,h*.14,h*.42,{alpha:.9*(1-v*v),angle:Math.sin(T*3+i)*.7,blend:'lighter'});}
 const c=P(e.x,e.y,h*.66),w=h*2.1*(.6+.4*smooth(T/.25));if(u<.8){S('wing',F,c.x+h*.08,c.y,w,w,{alpha:.8*(1-u/.8),blend:'lighter'});S('wing',F,c.x-h*.08,c.y,w,w,{alpha:.8*(1-u/.8),flip:true,blend:'lighter'});}
 return true;};

// lauren: rune -> fireball flight (above-left -> target) -> explosion + smoke -> scorch and embers
const GOLD=Object.freeze({a:Object.freeze([255,198,84]),b:Object.freeze([255,246,208])});
const FIRE=Object.freeze({a:Object.freeze([255,112,28]),b:Object.freeze([255,224,150])});
PRE.meteor=(e,u,h)=>{if(!ready(NEED.meteor))return false;const F=heroOf(e),q=P(e.tx,e.ty),fall=e.fall,T=e.t,k=tierK(e),fr=Math.floor(T*20);
 if(T<fall+.1)S('rune',F,q.x,q.y,h*2.6*k,h*2.6*k,{squash:.5,angle:time*1.5,alpha:.85*smooth(T/.15)});
 if(T<fall){const v=T/fall,s={x:q.x-h*5.4,y:q.y-h*8.6},e2=v*v,m={x:lerp(s.x,q.x,e2),y:lerp(s.y,q.y-h*.35,e2)},th=Math.atan2(q.y-h*.35-s.y,q.x-s.x),sz=h*(2.7+2.3*v)*k;
  const sh=P(e.tx,e.ty);S('glow',{a:[30,6,10],b:[60,16,20]},sh.x,sh.y,h*(.6+1.4*v),h*(.3+.6*v),{blend:'source-over',alpha:.25+.3*v});
  clip('fire.fly',T*1.0,m.x,m.y,sz,{angle:th,alpha:1,noVeil:true});S('glow',F,m.x,m.y,h*1.7,h*1.7,{alpha:.55*v+.3});return true;}
 const w=T-fall,burn=1-smooth((w-.9)/(e.life-fall-.9));
 clip('fire.boom',w,q.x,q.y-h*.55,h*3.7*k,{alpha:1});
 if(w<.3){const kk=w/.3;if(!reduced())S('flare',pb(FIRE),q.x,q.y-h*.3,h*5*(.4+kk),h*5*(.4+kk),{angle:kk,alpha:(1-kk)*.9});S('ring',FIRE,q.x,q.y,h*(1.5+5*kk),h*(.75+2.5*kk),{alpha:1-kk});}
 S('crack',{a:[40,8,10],b:[110,40,20]},q.x,q.y,h*3.4,h*3.4,{squash:.5,angle:e.seed,alpha:.85*burn,blend:'source-over'});S('crack',FIRE,q.x,q.y,h*3.0,h*3.0,{squash:.5,angle:e.seed,alpha:.6*burn});
 const ne=lowFx()?3:7;for(let i=0;i<ne;i++){const ang=rnd(e.seed,i)*TAU,d=rnd(e.seed,i+9)*1.3,qq=P(e.tx+Math.cos(ang)*d,e.ty+Math.sin(ang)*d);S('flame',FIRE,qq.x,qq.y,h*.9,h*(1.1+.5*rnd(e.seed,i+3)),{frame:fr+i,alpha:.8*burn*smooth(w/.25)});}
 const nem=lowFx()?4:11;for(let i=0;i<nem;i++){const v=(w-.1*rnd(e.seed,i))/1.5;if(v<0||v>1)continue;const ang=rnd(e.seed,i+20)*TAU,d=.3+1.6*rnd(e.seed,i+31)*smooth(v),eq=P(e.tx+Math.cos(ang)*d,e.ty+Math.sin(ang)*d,h*(.2+1.8*v));S('pixel',{a:[255,110,30],b:[255,220,140]},eq.x,eq.y,h*.14*(1-v*.6),h*.14*(1-v*.6),{alpha:.95*(1-v)});}
 return true;};

// hunter: bright arrows as before; painted hit sparks where an arrow meets an enemy; tier 3+ the target burns
POST.multishot=(e,u,h)=>{if(!ready(NEED.multishot))return;const T=e.t,sp=12;
 if(!e.arr){e.arr=[];const dx=Math.cos(e.a),dy=Math.sin(e.a),en=enemies();for(let i=0;i<e.n;i++){const ang=e.a+(i-(e.n-1)/2)*.12,ax=Math.cos(ang),ay=Math.sin(ang);let best=e.range,hit=null;
   for(const m of en){const rx=m.x-e.x,ry=m.y-e.y,al=rx*ax+ry*ay,pp=Math.abs(rx*ay-ry*ax);if(al>.8&&al<best+.2&&pp<.5+(m.radius||.35)&&al<best){best=al;hit=m;}}
   e.arr.push({x:e.x+ax*best,y:e.y+ay*best,t:best/sp,hit:!!hit});}void dx;void dy;}
 const cn=clipLen('hit.gold'),lim=lowFx()?4:99;let shown=0;
 for(const a of e.arr){if(!a.hit||shown>=lim)continue;const v=T-a.t;if(v<0||v>cn+.02)continue;shown++;const q=P(a.x,a.y,h*.5);clip('hit.gold',v,q.x,q.y,h*1.45,{angle:a.x*7,alpha:.95});}
 if(e.tier>=3&&has('fire')){const ti=Math.min(e.range,Math.hypot(e.tx-e.x,e.ty-e.y))/sp,v=T-ti;if(v>0&&v<clipLen('fire.boom')+.05){const q=P(e.tx,e.ty);clip('fire.boom',v,q.x,q.y-h*.5,h*2.7,{alpha:.95});}}else if(e.tier>=3)ensure('fire');};

// slayer: earth cracks opening one after another along the line, each with rocks and dust
PRE.fissure=(e,u,h)=>{if(!ready(NEED.fissure))return false;const F=heroOf(e),T=e.t,k=tierK(e),sa=screenAngle(e.a),rot=((sa+Math.PI/2)%Math.PI+Math.PI)%Math.PI-Math.PI/2;
 for(let i=0;i<e.n;i++){const t0=i*e.step,v=(T-t0)/1.05;if(v<0||v>1)continue;const d=1+i*.95,j=(rnd(e.seed,i)-.5)*.9,x=e.x+Math.cos(e.a)*d-Math.sin(e.a)*j,y=e.y+Math.sin(e.a)*d+Math.cos(e.a)*j,q=P(x,y),a=1-smooth((v-.72)/.28);
  S('crack',{a:[30,4,8],b:[70,16,22]},q.x,q.y,h*2.4,h*2.4,{squash:.5,angle:e.seed+i,alpha:.6*a*Math.min(1,v*6),blend:'source-over'});
  clipU('earth.crack',v,q.x,q.y+h*.12,h*3.0*k,{alpha:a,flip:i%2===1,angle:rot*.35});if(!lowFx()&&v>.12&&v<.6)clipU('earth.crack',v,q.x,q.y+h*.12,h*3.0*k,{alpha:.4*a,flip:i%2===1,angle:rot*.35,noVeil:true});
  if(v<.22&&!reduced())S('ring',F,q.x,q.y,h*2.0*(.4+v*3),h*1.0*(.4+v*3),{alpha:(1-v/.22)*.8});}
 return true;};

// gunner: nova ring from the caster (tinted cobalt/silver) + gold sparks on enemies as the ring reaches them
PRE.nova=(e,u,h)=>{if(!ready(NEED.nova))return false;const F=heroOf(e),T=e.t,c=P(e.x,e.y),k=tierK(e),R=6.2;
 const sz=h*7.2*k*(1+.12*smooth(T/.7)),al=1-smooth((T-.55)/.35),tint={a:F.a,b:F.b};
 if(!clipU('nova.all',T/.8,c.x,c.y+h*.02,sz,{alpha:al,tint,noVeil:true,pivot:[.5,.5]}))clipU('nova.all',T/.8,c.x,c.y+h*.02,sz,{alpha:al*.8,noVeil:true});
 if(!e.hits){e.hits=[];for(const m of enemies()){const d=Math.hypot(m.x-e.x,m.y-e.y);if(d<R)e.hits.push({x:m.x,y:m.y,t:.04+.4*(d/R)});}e.hits.sort((a,b)=>a.t-b.t);e.hits.length=Math.min(e.hits.length,lowFx()?4:9);}
 if(has('hit')){const cn=clipLen('hit.gold');for(const s of e.hits){const v=T-s.t;if(v<0||v>cn+.02)continue;const q=P(s.x,s.y,h*.45);clip('hit.gold',v,q.x,q.y,h*1.15,{alpha:.9,angle:s.x*5});}}else ensure('hit');
 if(!reduced()&&T<.3){const f=1-T/.3;S('flare',pb(F),c.x,c.y-h*.5,h*2.4*(1-.5*T/.3),h*2.4*(1-.5*T/.3),{alpha:f});}
 for(let i=0;i<e.bolts;i++){const ang=i*TAU/e.bolts+rnd(e.seed,i)*.4,d=T*(5+rnd(e.seed,i+5)*2),j=Math.sin(time*36+i*2)*.3,q=P(e.x+Math.cos(ang)*d-Math.sin(ang)*j,e.y+Math.sin(ang)*d+Math.cos(ang)*j,h*.3),b=1-T/e.life;S('pixel',pb(F),q.x,q.y,h*.26,h*.26,{alpha:b});}
 return true;};

function pre(e,u,h,dt){if(!on()||!enabled)return false;curTier=e.tier|0;try{const f=PRE[e.kind];if(!f)return false;const ok=f(e,u,h,dt)===true;ok?stats.pre++:stats.fallbacks++;return ok;}catch(err){fail(err);return false;}finally{curTier=-1;}}
function post(e,u,h,dt){if(!on()||!enabled)return;curTier=e.tier|0;try{const f=POST[e.kind];if(f){f(e,u,h,dt);stats.post++;}}catch(err){fail(err);}finally{curTier=-1;}}

// ---- loop ---------------------------------------------------------------------------------------------------------
const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r108-eden'){try{drawAllOwn();}catch(err){fail(err);}return;}return effectBase.apply(this,arguments);};
let sweepAt=0,warmAt=0,warmHero=null;
function warm(hero){if(!hero)return;const t=nowMs();if(warmHero===hero&&t-warmAt<2500)return;warmHero=hero;warmAt=t;const core=CORE[hero]||[];for(const n of core){if(has(n)){A[n].last=t;continue;}if(resident().length<MAX_RESIDENT-1)ensure(n);}}
function sweep(){const t=nowMs();for(const n of resident()){const a=A[n];if(t-a.last>IDLE_MS&&!isCore(n))dropSheet(n,'released');}
 for(const[k,r]of tints)if(t-r.last>IDLE_MS*2)tints.delete(k);}
const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);
 try{if(live()&&!(typeof loading!=='undefined'&&loading)&&enabled){const d=frozen?0:Number.isFinite(dt)?clamp(dt,0,.1):0;
   for(const e of list){e.t+=d;if(e.out!==null&&e.out!==undefined)e.out+=d;}
   for(let i=list.length-1;i>=0;i--){const e=list[i];if(e.kind==='dome'){if(e.out!==null&&e.out>.25){list.splice(i,1);if(guardFx===e)guardFx=null;}}else if(e.t>e.life)list.splice(i,1);}
   if(on())guardWatch();
   if(list.length&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}
   const t=nowMs();if(t-sweepAt>1000){sweepAt=t;sweep();}warm(player.hero);}}catch(e){fail(e);}return r;};
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);if(r!==false){list.length=0;guardFx=null;warmAt=0;}return r;};}

window.__STORYWORLD_EDEN_R108__=Object.freeze({revision:'R116-eden-tier',maxResident:MAX_RESIDENT,idleMs:IDLE_MS,on,setEnabled,pre,post,hitSpark,has,ensure,clip,clipU,clipLen,frame,
 sheets:NAMES,core:CORE,
 resident:()=>resident().map(n=>({name:n,ready:!!rowOf(n)?.ready,idleMs:Math.round(nowMs()-A[n].last)})),residentBytes,
 test:Object.freeze({freeze:v=>{frozen=!!v;return frozen;},seek:t=>{for(const e of list)e.t=t;return list.length;},clear:()=>{list.length=0;guardFx=null;},spawn:(kind,o={})=>add({kind,x:player.x,y:player.y,t:0,life:2,F:R102()?.PALETTE?.[player.hero],out:null,...o}),releaseAll:()=>{for(const n of resident())dropSheet(n,'released');tints.clear();}}),
 inspect:()=>({tiers:{size:TS,light:TL},revision:'R116-eden-tier',enabled,on:on(),resident:resident(),residentBytes:residentBytes(),cap:MAX_RESIDENT,effects:list.length,tints:tints.size,...stats,lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
