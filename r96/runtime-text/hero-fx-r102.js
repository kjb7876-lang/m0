/* R102 hero skill colours and growth.
   Presentation only: damage, timing, collision, targeting and saves are untouched.
   - One palette per hero: a primary and a secondary colour (환도 silver + gold, every
     other hero its own colour + silver). The R101 aura reads the same table.
   - Skill art (Q 고유 기술, Z/X/C source skills, their projectiles and their hit
     bursts) is drawn in the hero's two colours: while such an effect is drawn its
     image is swapped for a recoloured copy (luminance → primary → secondary).
     Basic attacks keep their plain native look.
   - Growth: learned skill and passive ranks give a presentation tier 0–4. Each tier
     adds layers to a skill cast (ground ring, directional streaks, the hero's
     signature flourish, finisher) and enlarges skill projectiles a little.
   - Projectile and thrust art painted pointing down-left is turned so it points
     along the attack. */
(() => {
'use strict';
if(window.__STORYWORLD_HERO_FX_R102__)return;
if(typeof drawEffect!=='function'||typeof fx!=='function'||typeof special!=='function'||typeof project!=='function'||typeof drawProjectile!=='function'||typeof hitEnemy!=='function'||typeof tick!=='function')return;
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const rnd=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
let lastError=null;
const stats={casts:0,werCasts:0,recolourDraws:0,turnDraws:0,builds:0,buildFailures:0,deferredBuilds:0,purged:0,tierUps:0,errors:0};
function fail(err){stats.errors++;lastError=String(err?.message||err);}
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const Z=()=>typeof zoom==='number'?zoom:1;
const rgba=(c,a)=>'rgba('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+','+clamp(a,0,1).toFixed(3)+')';
const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
function scope(owner,fn){if(typeof ctx?.scope==='function')return ctx.scope(owner,fn);return fn();}
function screenAngle(a){const o=project(0,0),d=project(Math.cos(a),Math.sin(a));return Math.atan2(d.y-o.y,d.x-o.x);}
const egoNow=()=>typeof ego151!=='undefined'&&!!ego151?.active;

// ---- preferences -------------------------------------------------------------------
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r102.herofx';
const DEFAULTS=Object.freeze({colour:true,flourish:true,turn:true});
const LABELS={colour:'스킬 이펙트를 영웅 고유색+보조색으로 (환도 실버·골드, 다른 영웅 고유색·실버)',flourish:'패시브·스킬을 배울수록 스킬 시전 연출이 화려해짐 (0~7단계: 고리·모이는 띠·사방·땅·하늘·비·전부)',turn:'비스듬히 그려진 화살·창·혜성 그림을 공격 방향으로 돌리기'};
const prefs={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}

// ---- palette -----------------------------------------------------------------------
// a: primary, b: secondary, sig/sig2: R100 strip colours ('pale' is drawn as silver),
// form: R101 aura shape, style: R102 cast flourish.
const SILVER=Object.freeze([226,232,242]),GOLD=Object.freeze([255,198,72]);
const pal=o=>Object.freeze({...o,a:Object.freeze(o.a.slice()),b:Object.freeze(o.b.slice())});
const PALETTE=Object.freeze({
 hwando:pal({a:[214,222,234],b:GOLD,sig:'pale',sig2:'gold',form:'blade',style:'blade',name:'실버',name2:'골드'}),
 seoha:pal({a:[120,206,255],b:SILVER,sig:'cyan',sig2:'pale',form:'orbs',style:'beam',name:'아이스 블루',name2:'실버'}),
 neon:pal({a:[52,236,176],b:SILVER,sig:'teal',sig2:'pale',form:'arcs',style:'bolt',name:'민트',name2:'실버'}),
 michaela:pal({a:[255,122,178],b:SILVER,sig:'pink',sig2:'pale',form:'angel',style:'holy',name:'로즈',name2:'실버'}),
 lauren:pal({a:[164,98,255],b:SILVER,sig:'violet',sig2:'pale',form:'runes',style:'rune',name:'바이올렛',name2:'실버'}),
 hunter:pal({a:[255,96,40],b:SILVER,sig:'orange',sig2:'pale',form:'petals',style:'arrows',name:'주홍',name2:'실버'}),
 slayer:pal({a:[222,22,52],b:SILVER,sig:'red',sig2:'pale',form:'dark',style:'smash',name:'크림슨',name2:'실버'}),
 gunner:pal({a:[70,124,255],b:SILVER,sig:'blue',sig2:'pale',form:'shards',style:'pixels',name:'코발트',name2:'실버'})
});
const palOf=id=>PALETTE[id]||PALETTE.hwando;

// ---- growth tier ---------------------------------------------------------------------
// Native talents: 고유 기술 숙련 and the two hero-only passives count 1 per rank, the
// common ones 0.5. R62 endless passives: skill-related 0.5, others 0.3.
const SKILL_R62=new Set(['endlessPower','endlessCooldown','egoAura','threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64']);
const STEPS=Object.freeze([1,4,9,16,25,36,49]),TOP=STEPS.length;
function score(p){let s=0;
 try{if(typeof UPGRADES!=='undefined')for(const u of UPGRADES){if(u.dream)continue;const k=u.hero?p.hero+':'+u.id:u.id,n=finite(p.upgrades?.[k]);if(n>0)s+=n*(u.id==='special'||u.hero?1:.5);}}catch(e){fail(e);}
 try{const R=window.__STORYWORLD_PROGRESSION_R62__;if(Array.isArray(R?.defs)&&typeof R.ranks==='function')for(const d of R.defs){const n=finite(R.ranks(d.id,p));if(n>0)s+=n*(SKILL_R62.has(d.id)?.5:.3);}}catch(e){fail(e);}
 // R103: 사몽 확률 발동 단계 1씩, 미카엘라의 처방 0.5씩.
 try{const G=window.__STORYWORLD_GROWTH_R103__?.state?.();if(G){for(const[k,n]of Object.entries(G.procs||{}))if(k.startsWith(p.hero+':'))s+=finite(n);s+=.5*(G.picks?.length||0);}}catch(e){fail(e);}
 return Math.round(s*10)/10;}
let tc={p:null,hero:null,at:-1e9,score:0,tier:0};
function info(p=player){if(!p)return{score:0,tier:0,next:STEPS[0]};const now=performance.now();if(!(tc.p===p&&tc.hero===p.hero&&now-tc.at<400&&now>=tc.at)){const s=score(p);let t=0;for(const x of STEPS)if(s>=x)t++;tc={p,hero:p.hero,at:now,score:s,tier:t};}
 return{score:tc.score,tier:tc.tier,next:tc.tier<TOP?STEPS[tc.tier]:null};}
// EGO lifts the presentation one tier, 사몽 to the top while it lasts.
function tier(p=player){if(!p)return 0;const t=info(p).tier;if(finite(p.samong)>0)return TOP;if(finite(p.ego)>0||egoNow())return Math.min(TOP,t+1);return t;}

// ---- recoloured / turned copies of native art -----------------------------------------
const luts=new Map();
function lut(F){const key=F.a.join()+'|'+F.b.join();let L=luts.get(key);if(L)return L;L=new Uint8ClampedArray(768);
 const stops=[[0,F.a.map(v=>v*.1)],[.3,F.a.map(v=>v*.5)],[.55,F.a],[.76,mix(F.a,F.b,.6)],[.9,F.b],[1,[255,255,255]]];
 for(let i=0;i<256;i++){const l=i/255;let j=1;while(j<stops.length-1&&l>stops[j][0])j++;const[a0,c0]=stops[j-1],[a1,c1]=stops[j],c=mix(c0,c1,clamp((l-a0)/Math.max(1e-6,a1-a0),0,1));L[i*3]=c[0];L[i*3+1]=c[1];L[i*3+2]=c[2];}
 luts.set(key,L);return L;}
// Painted pointing down-left (about 140°) or slightly up; turned to point along +x.
const TURN=Object.freeze({'assets/vfx/heroes/hunter-a.webp':-140,'assets/vfx/heroes/hunter-q.webp':-140,'assets/vfx/heroes/gunner-a.webp':-141,'assets/vfx/heroes/michaela-a.webp':-144,'assets/vfx/heroes/lauren-a.webp':-144,'assets/vfx/heroes/hunter-e.webp':26});
const RECOLOUR=new Set(['slash','burst','sigil','link','e568HeroImpact','storySourceSkill']);
const variants=new Map(),MAXV=28;let budget=1;
function tightCrop(px,w,h){let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++){const r=y*w*4;for(let x=0;x<w;x++)if(px[r+x*4+3]>18){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
 if(x1<x0)return null;const x=Math.max(0,x0-1),y=Math.max(0,y0-1);return{x,y,w:Math.min(w-x,x1-x+2),h:Math.min(h-y,y1-y+2)};}
function build(im,F,turn,tag){const w0=im.naturalWidth||im.width,h0=im.naturalHeight||im.height;if(!(w0>0&&h0>0)||w0*h0>1100000)return null;
 const side=turn?Math.ceil(Math.hypot(w0,h0)):0,w=side||w0,h=side||h0,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});if(!g)return null;
 if(turn){g.translate(w/2,h/2);g.rotate(turn*Math.PI/180);g.drawImage(im,-w0/2,-h0/2);g.setTransform(1,0,0,1,0,0);}else g.drawImage(im,0,0);
 const d=g.getImageData(0,0,w,h),px=d.data;// throws for a tainted source: no copy then
 if(F){const L=lut(F);for(let i=0;i<px.length;i+=4){if(px[i+3]===0)continue;const j=((px[i]*54+px[i+1]*183+px[i+2]*19)>>8)*3;px[i]=L[j];px[i+1]=L[j+1];px[i+2]=L[j+2];}g.putImageData(d,0,0);}
 cv.naturalWidth=w;cv.naturalHeight=h;try{Object.defineProperty(cv,'__storyworldStaticTint',{value:Object.freeze({path:tag,immutable:true,r102:true})});}catch(_){}
 return{canvas:cv,crop:turn?tightCrop(px,w,h):null};}
function variant(path,row,hero,turn){const key=(hero||'-')+'|'+(turn||0)+'|'+path;
 if(variants.has(key)){const v=variants.get(key);if(v){variants.delete(key);variants.set(key,v);}return v||null;}
 if(budget<=0){stats.deferredBuilds++;return null;}budget--;let v=null;
 try{v=build(row.image,hero?PALETTE[hero]:null,turn,'r102:'+key);}catch(e){fail(e);v=null;}
 if(v)stats.builds++;else stats.buildFailures++;variants.set(key,v||false);
 while(variants.size>MAXV)variants.delete(variants.keys().next().value);return v;}
// Same art, other aspect: the effect painters stretch the crop into a fixed box, so a
// turned crop is padded to that box's aspect around its centre.
function fitCrop(c,aspect,cv){if(!c||!(aspect>0))return c;let{x,y,w,h}=c;const W=cv.naturalWidth,H=cv.naturalHeight;
 if(w/h>aspect){const nh=Math.min(H,w/aspect);y=clamp(y+h/2-nh/2,0,H-nh);h=nh;}else{const nw=Math.min(W,h*aspect);x=clamp(x+w/2-nw/2,0,W-nw);w=nw;}return{x,y,w,h};}
// The filtered-sprite cache (spriteTintCache3) is keyed by path: entries made while a
// copy was swapped in are dropped so they never reach an unswapped draw.
function tintKeys(key){const out=new Set();if(typeof spriteTintCache3!=='undefined')for(const k of spriteTintCache3.keys())if(k.startsWith(key+'|'))out.add(k);return out;}
function purge(key,before){if(typeof spriteTintCache3==='undefined')return;for(const k of[...spriteTintCache3.keys()])if(k.startsWith(key+'|')&&!before.has(k)){spriteTintCache3.delete(k);stats.purged++;}}
function withImage(path,v,crop,fn){const row=typeof imageCache!=='undefined'?imageCache.get(path):null;if(!row?.ready||!row.image||!v)return fn();
 const im=row.image,cr=row.crop,before=tintKeys(path);row.image=v.canvas;if(crop)row.crop=crop;
 try{return fn();}finally{row.image=im;row.crop=cr;purge(path,before);}}
function rowOf(path){const row=typeof imageCache!=='undefined'?imageCache.get(path):null;return row?.ready&&row.image?row:null;}

// ---- which effects belong to a skill ---------------------------------------------------
let hitHero=null,castHero=null,inHit=0;
function skillHeroOf(type,o){
 if(type==='storySourceSkill'&&o.storyWER&&o.sourceHero)return String(o.sourceHero);
 if(inHit>0)return hitHero;// inside a hit the hit's source decides
 const c=typeof e568HeroActionContext!=='undefined'?e568HeroActionContext:null;
 if(c?.kind==='skill'&&c.heroId)return String(c.heroId);
 return castHero;}
// A source that says what it is decides; the action in progress (special()) only speaks
// for sources that carry nothing.
function skillSourceHero(source,c){
 if(source&&typeof source==='object'){
  if(source.storyWER)return String(source.sourceHero||player?.hero||'');
  const sc=source.e568HeroActionContext;if(sc&&typeof sc==='object')return sc.kind==='skill'&&sc.heroId?String(sc.heroId):null;
  if(typeof source.attackKind9==='string')return source.friendly!==false&&source.attackKind9==='skill'?String(source.sourceHero||player?.hero||''):null;
  if(source.friendly===false)return null;}
 if(c?.kind==='skill'&&c.heroId)return String(c.heroId);
 return castHero;}
const shotHero=p=>String(p.sourceHero||p.e568HeroActionContext?.heroId||p.pxfSourceHero||player?.hero||'');
const skillShot=p=>p.storyWER===true||p.attackKind9==='skill'||p.e568HeroActionContext?.kind==='skill';
const fxBase=fx;fx=function(type,x,y,opt){let o=opt||{};
 try{if(live()){if(RECOLOUR.has(type)){const h=skillHeroOf(type,o);if(h&&PALETTE[h])o={...o,r102Hero:h};}
  if(type==='storySourceSkill'&&o.storyWER&&o.stage==='warning'&&o.sourceHero===player.hero)onWerCast(x,y,o);}}catch(e){fail(e);}
 return fxBase.call(this,type,x,y,o);};
const hitBase=hitEnemy;hitEnemy=function(e,value,source,...rest){let hero=null;
 try{hero=live()?skillSourceHero(source,typeof e568HeroActionContext!=='undefined'?e568HeroActionContext:null):null;if(hero&&!PALETTE[hero])hero=null;}catch(err){fail(err);}
 const prev=hitHero;hitHero=hero;inHit++;try{return hitBase.call(this,e,value,source,...rest);}finally{inHit--;hitHero=prev;}};

// ---- drawing swaps ---------------------------------------------------------------------
const effectBase=drawEffect;drawEffect=function(e){
 if(e&&e.type==='r102-air'){try{drawOwn();}catch(err){fail(err);}return;}
 let v=null,crop=null,path=null;
 try{const raw=e&&typeof e.asset==='string'?e.asset:null,turn=raw&&prefs.turn?TURN[raw]||0:0,hero=raw&&e.r102Hero&&prefs.colour&&e.r102Hero!=='hwando'&&RECOLOUR.has(e.type)&&!egoNow()?e.r102Hero:null;
  if(turn||hero){path=raw;const row=rowOf(path);if(row){v=variant(path,row,hero,turn);if(v&&turn)crop=fitCrop(v.crop,e.type==='slash'?1/.65:e.type==='sigil'?1/.62:1,v.canvas);if(v){if(hero)stats.recolourDraws++;if(turn)stats.turnDraws++;}}}}catch(err){fail(err);v=null;}
 if(!v)return effectBase.apply(this,arguments);
 return withImage(path,v,crop,()=>effectBase.apply(this,arguments));};
const projectileBase=drawProjectile;drawProjectile=function(p){
 if(!p||p.friendly!==true||typeof p.asset!=='string'||!live())return projectileBase.apply(this,arguments);
 let v=null,crop=null,scaled=null;
 try{const path=p.asset,turn=prefs.turn?TURN[path]||0:0,skill=skillShot(p),hero=skill&&prefs.colour&&!egoNow()?shotHero(p):null,tint=hero&&hero!=='hwando'&&PALETTE[hero]?hero:null;
  if(turn||tint){const row=rowOf(path);if(row){v=variant(path,row,tint,turn);if(v&&turn)crop=v.crop;if(v){if(tint)stats.recolourDraws++;if(turn)stats.turnDraws++;}}}
  if(skill&&prefs.flourish&&Number.isFinite(p.scale)){const k=[1,1,1.12,1.25,1.4,1.48,1.56,1.65][tier()]||1;if(k>1){scaled=p.scale;p.scale*=k;}}}catch(err){fail(err);v=null;}
 try{return v?withImage(p.asset,v,crop,()=>projectileBase.apply(this,arguments)):projectileBase.apply(this,arguments);}finally{if(scaled!==null)p.scale=scaled;}};
const drawFrameBase=draw;draw=function(...a){budget=lowFx()?1:2;return drawFrameBase.apply(this,a);};

// Copies for the current hero are made a few at a time while nothing is drawn yet.
const WARM_COMMON=['assets/vfx/generated/v300/burst-impact.webp'];
const WARM_HERO={seoha:['assets/vfx/generated/v31307/hero-impacts/seoha-time-fracture.webp'],neon:['assets/vfx/generated/v31307/hero-impacts/neon-sanctuary-impact.webp','assets/vfx/generated/v300/glitch-fracture.webp'],michaela:['assets/vfx/generated/v31307/hero-impacts/michaela-seraph-spark.webp','assets/vfx/generated/v300/barrier-sigil.webp'],lauren:['assets/vfx/generated/v31307/hero-impacts/lauren-stigma-puncture.webp'],hunter:['assets/vfx/generated/v31307/hero-impacts/hunter-petal-impact.webp'],slayer:['assets/vfx/generated/v315/slayer-blood-rend-cyclone.webp'],gunner:['assets/vfx/generated/v31307/hero-impacts/gunner-memory-impact.webp']};
let warmTimer=null,warmHero=null;
function warm(hero){if(!hero||hero===warmHero||!PALETTE[hero])return;warmHero=hero;clearTimeout(warmTimer);
 for(const k of[...variants.keys()]){const h=k.split('|')[0];if(h!=='-'&&h!==hero)variants.delete(k);}
 const acts=window.StoryPhase1?.CURRENT_PUBLIC_HERO_DATA?.heroActions?.[hero]||{},jobs=[];
 if(hero!=='hwando')for(const p of[acts.q,acts.w,acts.e,acts.r,...WARM_COMMON,...(WARM_HERO[hero]||[])])if(p)jobs.push([p,hero,TURN[p]||0]);
 for(const p of[acts.a,acts.q,acts.e])if(p&&TURN[p])jobs.push([p,null,TURN[p]]);
 const step=()=>{warmTimer=null;if(warmHero!==hero)return;let n=0;while(jobs.length&&n<2){const[p,h,t]=jobs.shift(),row=rowOf(p);if(!row){if(typeof addImage==='function')try{addImage(p,'R102 hero colour');}catch(_){}continue;}
   if(!variants.has((h||'-')+'|'+t+'|'+p)){budget=Math.max(budget,1);variant(p,row,h,t);n++;}}
  if(jobs.length)warmTimer=setTimeout(step,120);};
 warmTimer=setTimeout(step,250);}

// ---- cast flourishes -----------------------------------------------------------------------
const list=[],MAX=24;let serial=0;
function add(e){if(list.length>=MAX)list.shift();e.id='r102:'+(++serial);e.at=time;list.push(e);return e;}
const age=e=>time-e.at;
const SENTINEL={type:'r102-air',x:0,y:0,age:0,life:Infinity,r102Sentinel:true};
function cast(slot,angle,origin,target){if(!prefs.flourish||!live()||!origin)return;const p=player,hero=p.hero,F=PALETTE[hero];if(!F)return;const t=tier(p),a=Number.isFinite(angle)?angle:0;
 let tx=target?.x,ty=target?.y;if(!Number.isFinite(tx)||!Number.isFinite(ty)){tx=origin.x+Math.cos(a)*3.2;ty=origin.y+Math.sin(a)*3.2;}
 const d=Math.hypot(tx-origin.x,ty-origin.y);if(d>9){tx=origin.x+(tx-origin.x)*9/d;ty=origin.y+(ty-origin.y)*9/d;}
 let extra=null;if(F.style==='bolt'&&t>=4&&typeof liveEnemies==='function'){extra=liveEnemies().filter(v=>Math.hypot(v.x-tx,v.y-ty)>.4&&Math.hypot(v.x-tx,v.y-ty)<5).sort((u,v)=>Math.hypot(u.x-tx,u.y-ty)-Math.hypot(v.x-tx,v.y-ty)).slice(0,4).map(v=>({x:v.x,y:v.y}));}
 add({kind:'cast',style:F.style,hero,F,slot,tier:t,x:origin.x,y:origin.y,tx,ty,angle:a,extra,life:.55+.08*t+(F.style==='holy'||F.style==='rune'?.15:0),seed:Math.random()*6.28});stats.casts++;}
function onWerCast(x,y,o){stats.werCasts++;const e=typeof nearestEnemy==='function'?nearestEnemy(12):null;cast(String(o.sourceSlot||'w'),Number.isFinite(o.visualWorldAngle35)?o.visualWorldAngle35:e?Math.atan2(e.y-y,e.x-x):0,{x,y},e?{x:e.x,y:e.y}:null);}
const specialBase=special;special=function(...a){let ang=null,tgt=null,before=null;
 try{if(live()){before=player.specialCD;if(!(before>0)){const e=typeof nearestEnemy==='function'?nearestEnemy(12):null;tgt=e?{x:e.x,y:e.y}:null;ang=e?Math.atan2(e.y-player.y,e.x-player.x):typeof storyAim22==='function'?storyAim22():0;}}}catch(err){fail(err);}
 const prev=castHero;castHero=live()&&PALETTE[player.hero]?player.hero:null;let r;try{r=specialBase.apply(this,a);}finally{castHero=prev;}
 try{if(live()&&player.specialCD>0&&!(before>0))cast('q',ang,{x:player.x,y:player.y},tgt);}catch(err){fail(err);}return r;};

// primitives (Canvas paths only: the Three recorder supports fill/stroke/ellipse/curves)
function disc(x,y,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);ctx.fill();}
function glow(x,y,r,c,a){disc(x,y,r,rgba(c,a*.16));disc(x,y,r*.62,rgba(c,a*.26));disc(x,y,r*.3,rgba(c,a*.5));}
function ring(x,y,rx,ry,col,w){ctx.strokeStyle=col;ctx.lineWidth=Math.max(.8,w);ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);ctx.stroke();}
function streak(x0,y0,x1,y1,w,col){const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(L<1)return;const nx=-dy/L*w,ny=dx/L*w,mx=(x0+x1)/2,my=(y0+y1)/2;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(mx+nx,my+ny,x1,y1);ctx.quadraticCurveTo(mx-nx,my-ny,x0,y0);ctx.closePath();ctx.fill();}
function polyline(pts,col,w){ctx.strokeStyle=col;ctx.lineWidth=Math.max(.8,w);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function crescent(x,y,r,ang,span,th,F,a){const a0=ang-span/2,a1=ang+span/2,r2=Math.max(.5,r-th);
 ctx.fillStyle=rgba(F.a,.85*a);ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,a0,a1);ctx.ellipse(x,y,r2,r2*.6,0,a1,a0,true);ctx.closePath();ctx.fill();
 ctx.strokeStyle=rgba(F.b,.95*a);ctx.lineWidth=Math.max(1,1.6*Z());ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,a0,a1);ctx.stroke();}
function sparks(x,y,dir,spread,n,len,col,a,seed,u){for(let i=0;i<n;i++){const ang=dir+(rnd(seed,i)-.5)*spread,d=len*(.25+.75*smooth(u))*(.5+.5*rnd(seed,i+9)),l=len*.22*(1-u);
 ctx.strokeStyle=rgba(col,a);ctx.lineWidth=Math.max(1,1.6*Z());ctx.beginPath();ctx.moveTo(x+Math.cos(ang)*d,y+Math.sin(ang)*d*.7);ctx.lineTo(x+Math.cos(ang)*(d+l),y+Math.sin(ang)*(d+l)*.7);ctx.stroke();}}
function xslash(x,y,s,dir,F,u,fade){const v=clamp(u/.3,0,1),a=fade*(1-smooth((u-.3)/.7));if(a<=0)return;
 for(const o of[.78,-.78]){const ang=dir+o,dx=Math.cos(ang)*s*.6*v,dy=Math.sin(ang)*s*.6*v*.7;streak(x-dx,y-dy,x+dx,y+dy,s*.07,rgba(F.a,.85*a));streak(x-dx*.9,y-dy*.9,x+dx*.9,y+dy*.9,s*.025,rgba(F.b,a));}
 glow(x,y,s*.35,F.b,a*.8);}
function pillar(x,y,h,F,u){const k=1-u,w=h*(.2+.12*u),H=h*(2+.6*u);for(const[s,col,al]of[[1,F.a,.22],[.45,F.b,.35]]){ctx.fillStyle=rgba(col,al*k);ctx.beginPath();ctx.moveTo(x-w*s,y);ctx.lineTo(x-w*s*.4,y-H);ctx.lineTo(x+w*s*.4,y-H);ctx.lineTo(x+w*s,y);ctx.closePath();ctx.fill();}}
function diamond(x,y,s,col,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-s*1.5);ctx.lineTo(s*.7,0);ctx.lineTo(0,s*1.5);ctx.lineTo(-s*.7,0);ctx.closePath();ctx.fill();ctx.restore();}
function jag(a,b,seed,amp,n){const pts=[[a.x,a.y]],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;for(let i=1;i<n;i++){const u=i/n,o=(rnd(seed,i)-.5)*2*amp*Math.sin(Math.PI*u);pts.push([a.x+dx*u+nx*o,a.y+dy*u+ny*o]);}pts.push([b.x,b.y]);return pts;}
function lightning(a,b,F,al,seed,h,branches){const frame=Math.floor(time*20),pts=jag(a,b,seed+frame,h*.14,8);
 polyline(pts,rgba(F.a,.3*al),5*Z());polyline(pts,rgba(F.a,.9*al),2.2*Z());polyline(pts,rgba(F.b,.95*al),1*Z());
 for(let k=0;k<branches;k++){const p=pts[2+((k*3+frame)%4)],ang=Math.atan2(b.y-a.y,b.x-a.x)+(k%2?.75:-.75),L=h*(.5+rnd(seed+frame,k)*.5),q={x:p[0]+Math.cos(ang)*L,y:p[1]+Math.sin(ang)*L*.6},bp=jag({x:p[0],y:p[1]},q,seed+frame+k*13,h*.08,4);
  polyline(bp,rgba(F.a,.75*al),1.6*Z());polyline(bp,rgba(F.b,.8*al),.8*Z());}}
function circuit(x,y,h,F,u,fade,seed){const r=h*(.9+.2*smooth(u)),a=fade*(1-u*.6),spin=time*.9+seed,pts=[];for(let i=0;i<6;i++){const ang=spin+i*TAU/6;pts.push([x+Math.cos(ang)*r,y+Math.sin(ang)*r*.5]);}
 pts.push(pts[0]);polyline(pts,rgba(F.a,.55*a),1.4*Z());for(let i=0;i<6;i++){const blink=.5+.5*Math.sin(time*9+i*1.7);disc(pts[i][0],pts[i][1],2.6*Z(),rgba(F.b,a*blink));}}
function clockRing(x,y,r,F,u,fade){const a=fade*(1-u*.5);ring(x,y,r,r*.5,rgba(F.a,.55*a),1.6*Z());for(let i=0;i<12;i++){const ang=i*TAU/12,inner=i%3?.88:.78;ctx.strokeStyle=rgba(F.b,.8*a);ctx.lineWidth=Math.max(1,1.2*Z());ctx.beginPath();ctx.moveTo(x+Math.cos(ang)*r*inner,y+Math.sin(ang)*r*inner*.5);ctx.lineTo(x+Math.cos(ang)*r,y+Math.sin(ang)*r*.5);ctx.stroke();}
 const hand=time*2.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(hand)*r*.7,y+Math.sin(hand)*r*.35);ctx.stroke();}
function shatter(x,y,h,F,u,seed){const a=1-u;for(let i=0;i<10;i++){const ang=i*TAU/10+rnd(seed,i)*.4,d=h*(.2+.9*smooth(u));diamond(x+Math.cos(ang)*d,y+Math.sin(ang)*d*.6,h*.05*(1-u*.4),rgba(i%2?F.b:F.a,.9*a),ang);}ring(x,y,h*(.3+.9*u),h*(.15+.45*u),rgba(F.b,.7*a),1.6*Z());}
function crossGlyph(x,y,s,F,u,fade){const v=smooth(u/.25),a=fade*(1-smooth((u-.4)/.6));if(a<=0)return;glow(x,y,s*1.1,F.a,a*.9);
 for(const[w,col,al]of[[s*.16,F.a,.7],[s*.07,F.b,1]]){ctx.fillStyle=rgba(col,al*a);ctx.fillRect(x-w/2,y-s*v,w,s*1.9*v);ctx.fillRect(x-s*.62*v,y-s*.32-w/2,s*1.24*v,w);}}
function rays(x,y,len,F,u,fade,n){const a=fade*(1-u*.7),spin=time*.6;for(let i=0;i<n;i++){const ang=spin+i*TAU/n,l=len*(.4+.6*smooth(u/.4));streak(x+Math.cos(ang)*len*.12,y+Math.sin(ang)*len*.07,x+Math.cos(ang)*l,y+Math.sin(ang)*l*.55,len*.035,rgba(i%2?F.b:F.a,.6*a));}}
function wingFlash(x,y,s,F,u,fade){const a=fade*Math.sin(Math.PI*clamp(u*1.2,0,1)),spread=.5+.5*smooth(u/.35);if(a<=0)return;
 for(const side of[-1,1])for(let i=0;i<3;i++){const L=s*(1-.2*i)*spread,lift=.75-.22*i;ctx.fillStyle=rgba(i?F.b:F.a,(.5-.12*i)*a);ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*L*.45,y-L*lift,x+side*L,y-L*(lift-.45));ctx.quadraticCurveTo(x+side*L*.6,y-L*(lift-.45)+L*.2,x+side*L*.12,y+L*(.08+.18*i));ctx.closePath();ctx.fill();}}
function runeCircle(x,y,r,F,u,fade,t,seed){const v=smooth(u/.25),a=fade*(1-smooth((u-.55)/.45)),R=r*v,spin=time*1.3+seed;if(a<=0||R<1)return;
 ring(x,y,R,R*.5,rgba(F.a,.8*a),2*Z());ring(x,y,R*.82,R*.41,rgba(F.b,.6*a),1.1*Z());
 for(let i=0;i<6;i++){const ang=spin+i*TAU/6;disc(x+Math.cos(ang)*R*.91,y+Math.sin(ang)*R*.455,2*Z(),rgba(F.b,.9*a));}
 if(t>=2){const tri=[0,1,2,0].map(i=>{const ang=-spin*.7+i*TAU/3-Math.PI/2;return[x+Math.cos(ang)*R*.7,y+Math.sin(ang)*R*.35];});polyline(tri,rgba(F.b,.75*a),1.3*Z());
  for(let i=0;i<4;i++){const ang=spin*1.4+i*TAU/4;ctx.save();ctx.translate(x+Math.cos(ang)*R,y+Math.sin(ang)*R*.5);ctx.rotate(ang);ctx.fillStyle=rgba(F.a,.85*a);ctx.fillRect(-3*Z(),-3*Z(),6*Z(),6*Z());ctx.restore();}}
 if(t>=3)ring(x,y,R*1.18,R*.59,rgba(F.a,.4*a),1.2*Z());glow(x,y-r*.05,r*.4,F.a,a*.55);}
function shardsRise(x,y,h,F,u,seed){const a=1-u;for(let i=0;i<7;i++){const ox=(rnd(seed,i)-.5)*h*1.2,rise=h*(.2+1.1*smooth(u))*(.6+.4*rnd(seed,i+7));diamond(x+ox,y-rise,h*.045,rgba(i%2?F.b:F.a,.85*a),.3*(i%3-1));}}
function triBeam(x,y,h,F,u){const k=1-u,H=h*(2.2+.6*u),w=h*.3;ctx.fillStyle=rgba(F.a,.28*k);ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x,y-H);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();ctx.fillStyle=rgba(F.b,.35*k);ctx.beginPath();ctx.moveTo(x-w*.35,y);ctx.lineTo(x,y-H*.9);ctx.lineTo(x+w*.35,y);ctx.closePath();ctx.fill();}
function petal(x,y,s,rot,col){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0,0,s,s*.48,0,0,TAU);ctx.fill();ctx.restore();}
function petalBurst(x,y,r,F,u,seed,n){const a=1-u;for(let i=0;i<n;i++){const ang=i*TAU/n+rnd(seed,i)*.5,d=r*(.15+.85*smooth(u)),fall=r*.3*u*u;petal(x+Math.cos(ang)*d,y+Math.sin(ang)*d*.6+fall,4.5*Z()*(1-u*.3),ang+u*3,rgba(i%3?F.a:F.b,.85*a));}}
function petalRing(x,y,h,F,u,seed){const a=Math.sin(Math.PI*u),spin=time*2.6+seed,r=h*(.9+.3*u);for(let i=0;i<14;i++){const ang=spin+i*TAU/14;petal(x+Math.cos(ang)*r,y-h*.4+Math.sin(ang)*r*.45,4*Z(),ang*2,rgba(i%2?F.a:F.b,.8*a));}}
function shock(x,y,r,F,u,fade){const v=smooth(u),a=fade*(1-v);if(a<=0)return;ring(x,y,r*(.25+.75*v),r*(.25+.75*v)*.5,rgba(F.a,.8*a),(3.5-2*v)*Z());ring(x,y,r*(.18+.6*v),r*(.18+.6*v)*.5,rgba(F.b,.55*a),1.2*Z());}
function smoke(x,y,h,u,seed){const a=.5*(1-u);ctx.globalCompositeOperation='source-over';for(let i=0;i<5;i++){const ang=rnd(seed,i)*TAU,d=h*(.2+.6*smooth(u)),r=h*(.16+.14*u);disc(x+Math.cos(ang)*d,y+Math.sin(ang)*d*.5-h*.15*u,r,'rgba(24,6,10,'+(a*.6).toFixed(3)+')');}ctx.globalCompositeOperation='lighter';}
function cracks(x,y,r,F,u,seed,n){const v=smooth(u/.3),a=1-smooth((u-.4)/.6);if(a<=0)return;for(let i=0;i<n;i++){const ang=rnd(seed,i)*TAU,pts=[[x,y]];let px=x,py=y;for(let j=1;j<=3;j++){const d=r*v*j/3,jit=(rnd(seed,i*5+j)-.5)*.5;px=x+Math.cos(ang+jit)*d;py=y+Math.sin(ang+jit)*d*.5;pts.push([px,py]);}
 ctx.globalCompositeOperation='source-over';polyline(pts,'rgba(20,4,8,'+(.7*a).toFixed(3)+')',2.4*Z());ctx.globalCompositeOperation='lighter';polyline(pts,rgba(F.a,.7*a),1*Z());}}
function trailSquares(x0,y0,x1,y1,h,F,a,seed){streak(x0,y0,x1,y1,h*.035,rgba(F.a,.7*a));const n=6;for(let i=0;i<n;i++){const k=i/n,s=h*.05*(1-k*.6);ctx.fillStyle=rgba(i%2?F.b:F.a,.8*a*(1-k*.5));ctx.fillRect(lerp(x1,x0,k)-s/2+(rnd(seed,i)-.5)*h*.12,lerp(y1,y0,k)-s/2+(rnd(seed,i+4)-.5)*h*.08,s,s);}disc(x1,y1,h*.04,rgba(F.b,.95*a));}
function squaresBurst(x,y,r,F,u,seed,n){const a=1-u;for(let i=0;i<n;i++){const ang=rnd(seed,i)*TAU,d=r*(.1+.9*smooth(u))*(.5+.5*rnd(seed,i+3)),s=(3+4*rnd(seed,i+6))*Z()*(1-u*.5);ctx.fillStyle=rgba(i%3?F.a:F.b,.85*a);ctx.fillRect(x+Math.cos(ang)*d-s/2,y+Math.sin(ang)*d*.6-s/2,s,s);}}
function squareRing(x,y,r,F,u,fade,seed){const a=fade*(1-u*.6),spin=time*1.5+seed,R=r*(.4+.6*smooth(u/.4));for(let i=0;i<16;i++){const ang=spin+i*TAU/16,s=(i%4?3:5)*Z();ctx.fillStyle=rgba(i%4?F.a:F.b,.85*a);ctx.fillRect(x+Math.cos(ang)*R-s/2,y+Math.sin(ang)*R*.5-s/2,s,s);}ring(x,y,R*.8,R*.4,rgba(F.a,.45*a),1.2*Z());}

// Signature strips (R100 painted effects); 'pale' is drawn as silver.
const sigData=()=>window.__STORYWORLD_POLISH_R100_DATA__;
function sig(kind,colour,x,y,u,size,{alpha=1,angle=0,ay=.5}={}){const spec=sigData()?.sig?.[kind];if(!spec||!colour||!(size>0)||!(alpha>0)||typeof readyImage!=='function')return;
 const path='assets/r100/sig-'+kind+'-'+colour+'.webp',row=readyImage(path);if(!row?.image){if(typeof addImage==='function')try{addImage(path,'R102 hero effect');}catch(_){}return;}
 const n=spec.frames,S=spec.size,i=Math.min(n-1,Math.floor(clamp(u,0,.999)*n));ctx.save();try{ctx.translate(x,y);if(angle)ctx.rotate(angle);if(colour==='pale')ctx.filter='grayscale(1) brightness(1.12)';ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';ctx.drawImage(row.image,i*S,0,S,S,-size/2,-size*ay,size,size);}finally{ctx.restore();}}

const STYLES={
 blade(e,u,q,qt,h,F,t,sa,fade){const cy=q.y-h*.42,n=1+Math.min(4,t),reach=h*(1.05+.18*t);
  for(let i=0;i<n;i++){const v=clamp((u-i*.07)/.55,0,1);if(v<=0||v>=1)continue;crescent(q.x,cy,reach*(.55+.6*smooth(v)),sa+(i?(i%2?.35:-.35):0),1.5+.25*t,h*(.12+.02*t)*(1-v*.5),F,(1-v)*fade*(1-.08*i));}
  if(t>=2){sig('slash',F.sig2,q.x+Math.cos(sa)*reach*.7,cy+Math.sin(sa)*reach*.45,u,h*(1.2+.2*t),{alpha:.8*fade,angle:sa});sparks(q.x+Math.cos(sa)*reach*.8,cy+Math.sin(sa)*reach*.5,sa,1.4,6+2*t,h*.6,F.b,fade*(1-u),e.seed,u);}
  if(t>=3)xslash(qt.x,qt.y-h*.45,h*(.8+.15*t),sa,F,u,fade);
  if(t>=4)pillar(qt.x,qt.y,h,F,u);},
 beam(e,u,q,qt,h,F,t,sa,fade){const cy=q.y-h*.5,len=h*(2.6+.5*t),w=h*(.05+.012*t),v=smooth(u/.25),x1=q.x+Math.cos(sa)*len*v,y1=cy+Math.sin(sa)*len*v,a=fade*(1-u*.6);
  streak(q.x,cy,x1,y1,w*2.4,rgba(F.a,.35*a));streak(q.x,cy,x1,y1,w,rgba(F.b,.9*a));
  if(t>=2)for(let i=0;i<4+2*t;i++){const k=rnd(e.seed,i),drift=(rnd(e.seed,i+20)-.5)*h*.6*smooth(u);diamond(lerp(q.x,x1,k)-Math.sin(sa)*drift,lerp(cy,y1,k)+Math.cos(sa)*drift,h*.04,rgba(i%2?F.b:F.a,.9*a),time*3+i);}
  if(t>=3){clockRing(q.x,q.y,h*.85,F,u,fade);for(const s of[-1,1])streak(q.x,cy,q.x+Math.cos(sa+s*.07)*len*v*.85,cy+Math.sin(sa+s*.07)*len*v*.85,w*.9,rgba(F.a,.45*a));}
  if(t>=4)shatter(qt.x,qt.y-h*.4,h,F,u,e.seed);},
 bolt(e,u,q,qt,h,F,t,sa,fade){const from={x:q.x,y:q.y-h*.55},to={x:qt.x,y:qt.y-h*.45};lightning(from,to,F,fade*(1-u*.5),e.seed,h,t>=2?2:0);glow(to.x,to.y,h*(.3+.06*t),F.a,fade*(1-u));
  if(t>=3)circuit(q.x,q.y,h,F,u,fade,e.seed);
  if(t>=4&&e.extra)for(const x of e.extra){const p=project(x.x,x.y);lightning(to,{x:p.x,y:p.y-h*.45},F,fade*(1-u)*.8,e.seed+3,h,0);}},
 holy(e,u,q,qt,h,F,t,sa,fade){crossGlyph(q.x,q.y-h*1.3,h*(.35+.08*t),F,u,fade);
  if(t>=2)rays(q.x,q.y-h*.5,h*(1+.25*t),F,u,fade,8+2*t);
  if(t>=3)wingFlash(q.x,q.y-h*.62,h*(.9+.15*t),F,u,fade);
  if(t>=4)pillar(q.x,q.y,h,F,u);},
 rune(e,u,q,qt,h,F,t,sa,fade){runeCircle(qt.x,qt.y,h*(.75+.12*t),F,u,fade,t,e.seed);
  if(t>=3)shardsRise(qt.x,qt.y,h,F,u,e.seed);
  if(t>=4)triBeam(qt.x,qt.y,h,F,u);},
 arrows(e,u,q,qt,h,F,t,sa,fade){const n=[3,3,5,7,9,9,11,11][t]||3,cy=q.y-h*.5,len=h*(2.2+.4*t);
  for(let i=0;i<n;i++){const v=clamp((u-Math.abs(i-(n-1)/2)*.03)/.35,0,1);if(v<=0)continue;const ang=sa+(i-(n-1)/2)*(.09+.01*t),head=len*smooth(v),tail=Math.max(0,head-h*(.9+.1*t)),al=fade*(1-v*.7),x1=q.x+Math.cos(ang)*head,y1=cy+Math.sin(ang)*head;
   streak(q.x+Math.cos(ang)*tail,cy+Math.sin(ang)*tail,x1,y1,h*.03,rgba(F.a,.85*al));disc(x1,y1,h*.03,rgba(F.b,.9*al));}
  if(t>=2)petalBurst(q.x,q.y-h*.4,h*(.6+.1*t),F,u,e.seed,6+2*t);
  if(t>=3)petalBurst(qt.x,qt.y-h*.4,h*(.8+.1*t),F,u,e.seed+5,8+2*t);
  if(t>=4)petalRing(q.x,q.y,h,F,u,e.seed);},
 smash(e,u,q,qt,h,F,t,sa,fade){shock(qt.x,qt.y,h*(1+.25*t),F,u,fade);
  if(t>=1)smoke(qt.x,qt.y,h,u,e.seed);
  if(t>=2)cracks(qt.x,qt.y,h*(.9+.2*t),F,u,e.seed,6+t);
  if(t>=3)xslash(qt.x,qt.y-h*.45,h*(.9+.15*t),sa,F,u,fade);
  if(t>=4){pillar(qt.x,qt.y,h,F,u);shock(qt.x,qt.y,h*(1.6+.3*t),F,clamp(u*1.4-.3,0,1),fade);}},
 pixels(e,u,q,qt,h,F,t,sa,fade){const n=[2,3,3,4,5,5,6,6][t]||3,cy=q.y-h*.55,len=h*(2.4+.4*t);
  for(let i=0;i<n;i++){const v=clamp((u-i*.06)/.4,0,1);if(v<=0)continue;const ang=sa+(i-(n-1)/2)*.05,head=len*smooth(v),tail=Math.max(0,head-h*.8);trailSquares(q.x+Math.cos(ang)*tail,cy+Math.sin(ang)*tail,q.x+Math.cos(ang)*head,cy+Math.sin(ang)*head,h,F,fade*(1-v*.6),e.seed+i);}
  if(t>=2)squaresBurst(q.x,q.y-h*.5,h*(.8+.15*t),F,u,e.seed,10+3*t);
  if(t>=3)squareRing(qt.x,qt.y,h*(.8+.1*t),F,u,fade,e.seed);
  if(t>=4)shock(q.x,q.y,h*2.2,F,u,fade);}
};
// ---- R103 patterns: 사방에서 날아드는 조각, 땅에서 솟는 가시, 하늘에서 떨어지는 빛, 쏟아지는 비 ----
// x,y: screen centre; R: radius in px; u: 0..1 progress. Shared by hero casts (tier 3+)
// and by 사몽 boss patterns (hostile palette).
function patSides(x,y,R,F,u,seed,n,fade){for(let i=0;i<n;i++){const ang=i*TAU/n+rnd(seed,i)*.3,d0=R*(1.05+.25*rnd(seed,i+3)),v=smooth(clamp((u-.05*rnd(seed,i+5))/.55,0,1)),d=d0*(1-v),a=fade*(v<1?1:0)*(1-u*.4);if(a<=0)continue;
 const px=x+Math.cos(ang)*d,py=y+Math.sin(ang)*d*.55,tx=x+Math.cos(ang)*(d+R*.22),ty=y+Math.sin(ang)*(d+R*.22)*.55;streak(tx,ty,px,py,R*.018,rgba(F.a,.7*a));diamond(px,py,R*.03,rgba(i%2?F.b:F.a,.95*a),ang+Math.PI/2);}
 if(u>.55)shock(x,y,R*.5,F,clamp((u-.55)/.45,0,1),fade);}
function patGround(x,y,R,F,u,seed,n,fade){for(let i=0;i<n;i++){const ang=rnd(seed,i)*TAU,d=R*(.15+.8*rnd(seed,i+11)),px=x+Math.cos(ang)*d,py=y+Math.sin(ang)*d*.5,t0=.08*rnd(seed,i+2),v=clamp((u-t0)/.5,0,1),rise=Math.sin(Math.PI*v),H=R*(.32+.25*rnd(seed,i+7))*rise,w=R*.045,a=fade*rise;if(a<=.02)continue;
 ctx.fillStyle=rgba(F.a,.75*a);ctx.beginPath();ctx.moveTo(px-w,py);ctx.lineTo(px,py-H);ctx.lineTo(px+w,py);ctx.closePath();ctx.fill();ctx.fillStyle=rgba(F.b,.85*a);ctx.beginPath();ctx.moveTo(px-w*.35,py);ctx.lineTo(px,py-H*.85);ctx.lineTo(px+w*.35,py);ctx.closePath();ctx.fill();disc(px,py,w*1.3,rgba(F.a,.35*a));}
 ring(x,y,R*(.4+.6*smooth(u)),R*(.2+.3*smooth(u)),rgba(F.a,.45*fade*(1-u)),1.4*Z());}
function patSky(x,y,R,F,u,seed,n,fade){for(let i=0;i<n;i++){const ox=(rnd(seed,i)-.5)*2*R*.85,oy=(rnd(seed,i+4)-.5)*R*.7,t0=.4*rnd(seed,i+8),v=clamp((u-t0)/.3,0,1),tx=x+ox,ty=y+oy,top=ty-R*1.9;if(v<=0)continue;
 if(v<1){const hy=lerp(top,ty,smooth(v)),tail=Math.max(top,hy-R*.6);streak(tx+R*.06,tail,tx,hy,R*.03,rgba(F.a,.8*fade));streak(tx+R*.04,tail+R*.2,tx,hy,R*.012,rgba(F.b,.95*fade));}
 else{const k=clamp((u-t0-.3)/.25,0,1);if(k<1){glow(tx,ty,R*.2*(1+k),F.b,fade*(1-k));ring(tx,ty,R*.25*(.4+k),R*.12*(.4+k),rgba(F.a,.8*fade*(1-k)),1.6*Z());}}}}
function patRain(x,y,R,F,u,seed,n,fade){const a=fade*Math.sin(Math.PI*clamp(u,0,1));if(a<=0)return;for(let i=0;i<n;i++){const ox=(rnd(seed,i)-.5)*2*R,oy=(rnd(seed,i+6)-.5)*R,ph=(u*2.4+rnd(seed,i+9))%1,px=x+ox-ph*R*.12,py=y+oy-R*1.2*(1-ph);
 streak(px+R*.05,py-R*.14,px,py,R*.008,rgba(i%3?F.a:F.b,.8*a));if(ph>.86)disc(px,py+R*.02,R*.025,rgba(F.b,.6*a));}
 ctx.fillStyle=rgba(F.a,.07*a);ctx.beginPath();ctx.ellipse(x,y,R,R*.5,0,0,TAU);ctx.fill();}
const PATTERNS={sides:patSides,ground:patGround,sky:patSky,rain:patRain};
function drawCast(e,u){const q=project(e.x,e.y),qt=project(e.tx,e.ty),h=actorHeight(),F=e.F,t=e.tier,fade=u<.7?1:1-(u-.7)/.3;
 let sa=Math.atan2(qt.y-q.y,qt.x-q.x);if(Math.hypot(qt.x-q.x,qt.y-q.y)<2)sa=screenAngle(e.angle);
 ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
 // tier 0: one thin ring in the primary colour; from tier 1 a double ring (primary + secondary)
 if(t>=1){const r=h*(.35+1.1*smooth(u));ring(q.x,q.y,r,r*.5,rgba(F.a,.7*(1-u)),(2+t*.6)*Z());ring(q.x,q.y,r*.72,r*.36,rgba(F.b,.55*(1-u)),1.2*Z());}
 else{const r=h*(.3+.8*smooth(u));ring(q.x,q.y,r,r*.5,rgba(F.a,.5*(1-u)),1.5*Z());}
 if(t>=2&&u<.6)sig('gather',F.sig,q.x,q.y-h*.45,u/.6,h*(1.1+.15*t),{alpha:.75*(1-u/.6)});
 STYLES[e.style]?.(e,u,q,qt,h,F,t,sa,fade);
 // 3 사방 → 4 땅 → 5 하늘 → 6 비 → 7 네 가지를 한꺼번에, 더 크게.
 if(t>=3){const lo=lowFx(),R=h*(1.3+.12*t)*(t>=7?1.25:1),cx=qt.x,cy=qt.y,k=lo?.5:1;
  patSides(cx,cy-h*.3,R,F,u,e.seed+1,Math.round((6+t)*k),fade);
  if(t>=4)patGround(cx,cy,R,F,u,e.seed+2,Math.round((5+t)*k),fade);
  if(t>=5)patSky(cx,cy,R,F,u,e.seed+3,Math.round((3+t)*k),fade);
  if(t>=6)patRain(cx,cy,R*1.15,F,u,e.seed+4,Math.round((10+3*t)*k),fade);
  if(t>=7)shock(cx,cy,R*1.6,F,clamp(u*1.3-.2,0,1),fade);}}
const HOSTILE=Object.freeze({a:[176,44,86],b:[236,214,255]});
function drawPattern(e,u){const q=project(e.x,e.y),h=actorHeight(),R=h*e.size,fade=u<.75?1:1-(u-.75)/.25,F=e.F||HOSTILE;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';PATTERNS[e.pattern]?.(q.x,q.y,R,F,u,e.seed,lowFx()?Math.ceil(e.n/2):e.n,fade);}
function pattern(kind,x,y,{hostile=true,size=2.6,life=1.3,hero=null}={}){if(!live()||!PATTERNS[kind]||!Number.isFinite(x+y))return false;const F=hostile?HOSTILE:palOf(hero||player.hero);
 add({kind:'pattern',pattern:kind,x,y,F,size,n:{sides:14,ground:12,sky:9,rain:34}[kind],life,seed:Math.random()*6.28});stats.patterns=(stats.patterns||0)+1;return true;}
function drawOwn(){if(!list.length||typeof ctx==='undefined'||!ctx)return;for(const e of list){const u=age(e)/e.life;if(u<0||u>1)continue;
 ctx.save();try{scope({id:e.id,kind:'effect',x:e.x,y:e.y,r102:true},()=>e.kind==='pattern'?drawPattern(e,u):drawCast(e,u));}catch(err){fail(err);}finally{ctx.restore();}}}

// ---- growth notes: upgrade panels, tier-up toast ----------------------------------------------
function tierLine(p=player){const i=info(p),F=palOf(p.hero),hero=typeof HEROES!=='undefined'?HEROES[p.hero]?.name||p.hero:p.hero;
 return'스킬 연출 '+i.tier+'/'+TOP+'단계 · '+hero+' '+F.name+'+'+F.name2+' · 성장 '+i.score+(i.next!=null?' → 다음 단계 '+i.next:' (최대)')+' · 고유 기술·고유 패시브 1, 공통 패시브 0.5, 반복 패시브 0.3~0.5씩';}
function decoratePanel(){const panel=document.getElementById('panel');if(!panel||!live())return;const cards=panel.querySelector('.cards');if(!cards)return;
 let note=document.getElementById('r102TierNote');if(!note){note=document.createElement('p');note.id='r102TierNote';note.className='small';cards.parentNode.insertBefore(note,cards);}note.textContent=tierLine();
 for(const b of cards.querySelectorAll('[data-up],[data-r62-passive]')){const id=b.dataset.up||b.dataset.r62Passive;if(id==='special'||id==='heroMechanic'||id==='heroEcho'||SKILL_R62.has(id))b.classList.add('r102Skill');}}
if(typeof openPanel==='function'){const opBase=openPanel;openPanel=function(html,...a){const r=opBase.call(this,html,...a);try{if(typeof html==='string'&&(html.includes('data-r62-passive')||html.includes('data-up="')))decoratePanel();}catch(e){fail(e);}return r;};}
let seenTier=null,seenKey=null;
function watchTier(){const p=player,key=p.hero+'|'+(typeof layer!=='undefined'?layer:'');const t=info(p).tier;
 if(seenKey!==key||seenTier===null){seenKey=key;seenTier=t;return;}
 if(t>seenTier){stats.tierUps++;if(typeof toast==='function')toast('스킬 연출 '+t+'/'+TOP+'단계 · 스킬이 더 화려해졌습니다',3.2);const note=document.getElementById('r102TierNote');if(note)note.textContent=tierLine();}
 seenTier=t;}

// ---- lifecycle ---------------------------------------------------------------------------------
let tierCheckAt=0;
const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);try{if(live()&&!loading){
 for(let i=list.length-1;i>=0;i--)if(age(list[i])>list[i].life||age(list[i])<-1)list.splice(i,1);
 if(list.length&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}
 warm(player.hero);
 const now=performance.now();if(now-tierCheckAt>500){tierCheckAt=now;watchTier();}}}catch(e){fail(e);}return r;};
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);list.length=0;return r;};}
const style=document.createElement('style');style.id='heroFxStyleR102';style.textContent=`
#r102TierNote{margin:2px 0 8px;color:#f3dfae;line-height:1.45}
.card.upgrade.r102Skill strong::after{content:' ✦ 스킬 연출';color:#ffd36b;font-size:10px;font-weight:600;white-space:nowrap}`;
document.head.appendChild(style);
function settingsSection(){const host=document.getElementById('retroSettingsR101')||document.getElementById('retroSettingsR100')||document.getElementById('retroSettingsR93');if(!host||document.getElementById('retroSettingsR102'))return;
 const s=document.createElement('section');s.id='retroSettingsR102';s.innerHTML='<h3>R102 영웅 스킬 색·성장</h3><p class="small muted">보이는 것만 바꾸며 피해·판정·저장은 그대로입니다. 기본공격은 담백하게 두고, 스킬만 영웅 색으로 그려집니다.</p><p class="small" id="r102TierSettings"></p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r102-'+k+'"> '+LABELS[k]+'</label> ').join('');
 host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r102-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}
 const line=s.querySelector('#r102TierSettings');if(line&&live())line.textContent=tierLine();}
if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...a){const r=sb.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_HERO_FX_R102__=Object.freeze({revision:'R102-hero-fx',PALETTE,palette:id=>({...palOf(id)}),tier,info:(p=player)=>({...info(p)}),steps:STEPS,prefs:()=>({...prefs}),set,turn:{...TURN},
 effects:()=>list.map(e=>({kind:e.kind,style:e.style,tier:e.tier,age:age(e),life:e.life})),cast,
 inspect:()=>({revision:'R102-hero-fx',prefs:{...prefs},stats:{...stats},variants:variants.size,tier:live()?tier():null,score:live()?info().score:null,effects:list.length,lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
window.__STORYWORLD_HERO_FX_R103__=Object.freeze({revision:'R103-hero-fx-7',tiers:TOP,steps:STEPS,patterns:Object.keys(PATTERNS),pattern,tier,inspect:()=>({tier:live()?tier():null,top:TOP,patterns:stats.patterns||0,effects:list.length,lastError})});
})();
