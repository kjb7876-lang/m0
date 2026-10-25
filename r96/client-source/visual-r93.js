/* R93 presentation fixes. Presentation only unless a section says otherwise.
 * 1. Hero body anchor: the native sprite centres the whole alpha box (sword and
 *    cloth included) on the foot point, so effects attached to the player
 *    (status auras, thorn bind, passive aura) are shifted by the measured body
 *    centre of the image actually drawn this frame.
 * Canonical source; copied by apply-r93.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1;
 if(!A||window.__STORYWORLD_VISUAL_R93__||typeof drawHero!=='function')return;
 const stats={measured:0,measureFailed:0,bodyFrames:0,shiftedEffects:0,errors:0};let lastError=null;
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};

 // ---- 0. hero idle, 8 directions -------------------------------------------
 // r3 idle candidates (4 frames per hero/direction). Only while the hero stands
 // still in a plain pose the single native body drawImage is swapped, like the
 // R91 walk; facing keeps the last walking direction. Installed first so the
 // body-anchor pass below measures the idle frame actually drawn.
 const IDLE_INDEX='./assets/r93/idle/index.json',IDLE_STEP=.42,HERO_ART=/hero-authored|hero_direction33\d|heroes\/normalized/;
 const DIR4={front:'s',back:'n',left:'w',right:'e'};let idle=null,idleState='idle',idleAt=0,facing8=null;
 function loadIdle(){if(idleState!=='idle')return;idleState='loading';fetch(IDLE_INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R93 idle index '+r.status);return r.json();}).then(j=>{idle=j;idleState='ready';}).catch(e=>{idleState='failed';fail(e);});}
 function moveDir(){const vx=Number(player.moveVX150)||0,vy=Number(player.moveVY150)||0;if(Math.hypot(vx,vy)<.02)return null;
  const a=project(player.x,player.y),b=project(player.x+vx,player.y+vy),s=Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4));
  return{'0':'e','1':'se','2':'s','3':'sw','4':'w','-4':'w','-3':'nw','-2':'n','-1':'ne'}[s];}
 const plainStand=()=>player&&player.hp>0&&!player.moving&&!(player.attackAnim>0||player.skillAnim>0||player.dashAnim>0||player.hurtAnim>.05||player.ultimateAnim>0||player.guard)&&
  !window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active&&(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off'&&(typeof layer==='undefined'||layer==='STORY');
 function idleFrame(){loadIdle();if(!idle||!player)return null;const d=moveDir();if(d){facing8=d;return null;}if(!plainStand())return null;
  const now=performance.now();if(now-idleAt>2000&&typeof addImage==='function'&&typeof readyImage==='function'){idleAt=now;for(const it of idle.items)if(it.hero===player.hero&&!readyImage(it.path))addImage(it.path,'R93 generated idle');}
  const dir=facing8||DIR4[player.direction]||'s',it=idle.items.find(i=>i.hero===player.hero&&i.dir===dir),img=it&&typeof readyImage==='function'&&readyImage(it.path)?.image;if(!img)return null;
  return{it,img,f:Math.floor(time/IDLE_STEP)%it.frames};}
 {const base=drawHero;drawHero=function(...args){let w=null;try{w=idleFrame();}catch(e){fail(e);}
  if(!w||typeof ctx==='undefined')return base.apply(this,args);const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage;let done=false;
  // Every native hero-body draw in this pass gets the same idle cell: a second
  // body draw (overlay or echo) left native would show two different poses.
  c.drawImage=function(img,...a){if(a.length===8&&HERO_ART.test(String(img?.src||''))){if(done)stats.idleExtraBodies=(stats.idleExtraBodies||0)+1;done=true;try{const k=(typeof actorHeight==='function'?actorHeight():66)/w.it.refBody;
     return prev.call(this,w.img,w.f*w.it.cellW,0,w.it.cellW,w.it.cellH,-w.it.footX*k,-w.it.footY*k,w.it.cellW*k,w.it.cellH*k);}catch(e){fail(e);return prev.apply(this,[img,...a]);}}return prev.apply(this,[img,...a]);};
  try{return base.apply(this,args);}finally{if(own)c.drawImage=prev;else delete c.drawImage;if(done)stats.idleFrames=(stats.idleFrames||0)+1;}};}

 // ---- 1. hero body anchor ------------------------------------------------
 const centres=new Map();let body={dx:0,dy:0,at:-1};
 // Median x of alpha mass (alpha>40) inside the source rect, as a 0..1 fraction.
 // A thin blade carries little mass, so the median stays on the torso.
 function centre(img,sx,sy,sw,sh){const key=(img.currentSrc||img.src||'')+'|'+[sx,sy,sw,sh].map(Math.round).join(',');if(centres.has(key))return centres.get(key);
  let frac=.5;try{const k=Math.min(1,96/Math.max(1,sh)),w=Math.max(1,Math.round(sw*k)),h=Math.max(1,Math.round(sh*k)),c=document.createElement('canvas');c.width=w;c.height=h;
   const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,sx,sy,sw,sh,0,0,w,h);const px=g.getImageData(0,0,w,h).data,col=new Float64Array(w);let total=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=px[(y*w+x)*4+3];if(a>40){col[x]+=a;total+=a;}}
   if(total>0){let run=0;for(let x=0;x<w;x++){run+=col[x];if(run>=total/2){frac=(x+.5)/w;break;}}}stats.measured++;}catch(_){stats.measureFailed++;}
  if(centres.size>256)centres.clear();centres.set(key,frac);return frac;}
 // During a frame ctx is the renderer's command recorder, which keeps its own
 // matrix and rejects canvas-only calls (an exception there drops the WebGL
 // path), so read the recorder matrix and never let a probe throw.
 function transform(c){try{if(Array.isArray(c.matrix)&&c.matrix.length===6)return new DOMMatrix(c.matrix);}catch(_){}return null;}
 const heroBase=drawHero;
 drawHero=function(...args){const c=typeof ctx==='undefined'?null:ctx,root=c&&transform(c);if(!root)return heroBase.apply(this,args);
  // Other overlays draw props and effects inside this pass too; the body is the
  // largest plain image whose local origin sits on the hero's foot column.
  const base=c.drawImage;let inv=null,q0=null,best=null;try{inv=root.inverse();q0=player?project(player.x,player.y):null;}catch(_){return heroBase.apply(this,args);}
  c.drawImage=function(img,...a){try{if(q0&&a.length===8&&c.globalCompositeOperation==='source-over'&&(!best||a[7]>best.dh)){const m=transform(c);if(!m)return base.call(this,img,...a);const o=inv.multiply(m).transformPoint(new DOMPoint(0,0));
    if(Math.abs(o.x-q0.x)<3&&Math.abs(o.y-q0.y)<a[7]*.7){const[sx,sy,sw,sh,dx,dy,dw,dh]=a;best={img,sx,sy,sw,sh,dx,dy,dw,dh,m};}}}catch(_){}return base.call(this,img,...a);};
  let result;try{result=heroBase.apply(this,args);}finally{c.drawImage=base;}
  try{if(best&&q0){const f=centre(best.img,best.sx,best.sy,best.sw,best.sh),p=inv.multiply(best.m).transformPoint(new DOMPoint(best.dx+f*best.dw,best.dy+best.dh));
    body={dx:p.x-q0.x,dy:0,at:time};stats.bodyFrames++;}}catch(e){fail(e);}
  return result;};
 // Effects that belong to the player's body, identified by their draw owner.
 const heroOwned=o=>!!o&&o.kind==='effect'&&(String(o.id||'').startsWith('final42-r88:native-status:')||o.r87Painted==='bind'||String(o.id||'').startsWith('r62:passive-aura:hero'));
 let patched=null;
 function patchScope(){if(typeof ctx==='undefined'||typeof ctx.scope!=='function'||patched===ctx.scope)return;const base=ctx.scope;
  patched=ctx.scope=function(owner,paint,...rest){if(heroOwned(owner)&&Math.abs(body.dx)>.5&&time-body.at<.5&&typeof paint==='function'){stats.shiftedEffects++;
    return base.call(this,owner,()=>{ctx.save();try{ctx.translate(body.dx,body.dy);return paint();}finally{ctx.restore();}},...rest);}
   return base.call(this,owner,paint,...rest);};}
 // The renderer owns the global draw(); the scope hook is (re)installed from the
 // hero pass instead, which runs once per frame on the frame's context.
 const heroScoped=drawHero;drawHero=function(...args){try{patchScope();}catch(e){fail(e);}return heroScoped.apply(this,args);};

 // ---- 2. enemy facing ---------------------------------------------------
 // Native story frames turn every mob toward the player assuming the art faces
 // right, and flip on every crossing of the player's vertical. Most generated
 // art is drawn front-on; a few sheets face one side (checked by eye, R93
 // contact sheets). Facing now follows the player when near, else the walk
 // direction, with a side threshold and a short hold so it does not flicker.
 const ART_LEFT=new Set(['assets/dist/cult_mage.png','assets/generated-v31224/actors-normalized/42daad5a3557_dist_fallen_comrade_demon_echo.webp',
  'assets/generated-v31224/actors-normalized/7efeeaa5bb8b_ep1b06b_greed_child_phase0.webp','assets/episode1b/generated-v394/wrath_fire_beast.webp',
  'assets/u2/generated-v350/u2_cyborg_hound.webp','assets/u2/generated-v350/u2_blue_wraith.webp','assets/u2/generated-v350/u2_observer_spider.webp',
  'assets/last3/Monster_Goblin.png','assets/murder/rooftop_echo.png','assets/cult-v3123/black_robed_nightmare_demon.webp','assets/cult-v3123/black_rose_demon_soldier.webp']);
 const ART_RIGHT=new Set(['assets/generated-v31224/actors-normalized/6998402eb8e7_purple_sword_spider_angel.webp','assets/generated-v31224/actors-normalized/80f5ab6bab50_balrog-idle.webp',
  'assets/episode1b/generated-v394/sloth_moldling.webp','assets/episode1b/generated-v394/greed_fox_hound.webp','assets/episode1b/generated-v394/greed_mammon.webp',
  'assets/last3/Monster_Wolf.png','assets/kair/enemies/time-collector.png','assets/heroes/normalized/directions/ion-right.webp','assets/heroes/normalized/directions/rian-right.webp']);
 const NEAR=8,HOLD=.25,faces=new WeakMap();
 const artOf=e=>{const p=String(e?.profile?.frames?.idle?.path||e?.path||'').replace(/^\.\//,'');return ART_LEFT.has(p)?'L':ART_RIGHT.has(p)?'R':'F';};
 // Screen-horizontal offset of a world vector (same axis as native facing()).
 const screenX=(dx,dy)=>dx-dy;
 function side(e,art){const st=faces.get(e)||{side:0,pend:0,since:0};faces.set(e,st);let want=0,mag=0;
  if(player&&player.hp>0&&Math.hypot(player.x-e.x,player.y-e.y)<NEAR){const sx=screenX(player.x-e.x,player.y-e.y);want=Math.sign(sx);mag=Math.abs(sx);}
  else if(e.moving&&(e.moveDX||e.moveDY)){const sx=screenX(e.moveDX||0,e.moveDY||0);want=Math.sign(sx);mag=Math.abs(sx)*8;}
  const threshold=art==='F'?.9:.35;
  if(want&&want!==st.side&&mag>threshold){if(st.pend!==want){st.pend=want;st.since=time;}if(!st.side||time-st.since>=HOLD){st.side=want;st.pend=0;}}else if(want===st.side)st.pend=0;
  return st.side;}
 function bossHold(e,native){const st=faces.get(e)||{side:native?-1:1,pend:0,since:0};faces.set(e,st);const want=native?-1:1;
  if(e.attack||e.rangedWindup>0){st.side=want;st.pend=0;return native;}
  if(want!==st.side){if(st.pend!==want){st.pend=want;st.since=time;}if(time-st.since>=HOLD){st.side=want;st.pend=0;}}else st.pend=0;return st.side<0;}
 const motion=window.__STORYWORLD_ENEMY_MOTION_R51__;
 if(motion&&typeof motion.flip==='function')window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...motion,flip(e,frame,fallback){const native=motion.flip(e,frame,fallback);
  try{if(!e||e.hp<=0||zone==='ep1a08'||(typeof layer!=='undefined'&&layer!=='STORY'))return native;stats.facing=(stats.facing||0)+1;
   if(e.boss||e.midboss||e.persona)return bossHold(e,native);
   const art=artOf(e),s=side(e,art);if(!s)return native;
   // Mirroring turns the art to the other side: right-facing and front art face
   // left when flipped, left-facing art faces right when flipped.
   return art==='L'?s>0:s<0;}catch(err){fail(err);return native;}}});

 // ---- 3. thread dance end position (gameplay: player position only) -------
 // User request: after 실검무 the hero stays where the last strike put them
 // instead of snapping back to the cast point. The R74 dance manager returns to
 // its stored home when its last motion leaves; when that happens and the final
 // strike point is still standable, the hero is put back on that point. Damage,
 // timing, targets and cooldowns are untouched.
 const dances=()=>window.__STORYWORLD_DANCES_R74__;let dance=null;
 const standable=(x,y)=>{try{if(typeof blocked==='function'&&blocked(x,y,.31,room))return false;return typeof A.explorationBlocked!=='function'||!room?.exploration||!A.explorationBlocked(room.exploration,x,y,.31);}catch(_){return false;}};
 function watchDance(){const D=dances();if(!D||!player||typeof D.moving!=='function')return;const moving=!!D.moving(player);
  if(moving){dance={x:player.x,y:player.y,room,layer:typeof layer==='undefined'?null:layer,start:dance?.start??{x:player.x,y:player.y}};return;}
  if(!dance)return;const d=dance;dance=null;
  if(d.room!==room||player.hp<=0)return;
  const snapped=Math.hypot(player.x-d.x,player.y-d.y)>.6;
  if(snapped&&standable(d.x,d.y)){player.x=d.x;player.y=d.y;player.moving=false;stats.danceStays=(stats.danceStays||0)+1;}}
 // Native 실검무 finishes through the window API: restore in the same call so no
 // frame is drawn at the cast point. Custom silver designs finish internally and
 // are caught by the per-tick watcher below.
 const D0=dances();
 if(D0&&typeof D0.nativeFinish==='function')window.__STORYWORLD_DANCES_R74__=Object.freeze({...D0,nativeFinish(p,token,...rest){const at=p?{x:p.x,y:p.y}:null,r=room,result=D0.nativeFinish.call(this,p,token,...rest);
  try{if(at&&p===player&&r===room&&p.hp>0&&!D0.moving(p)&&Math.hypot(p.x-at.x,p.y-at.y)>.6&&standable(at.x,at.y)){p.x=at.x;p.y=at.y;p.moving=false;dance=null;stats.danceStays=(stats.danceStays||0)+1;}}catch(e){fail(e);}return result;}});
 if(typeof tickEnemies==='function'){const tickBase=tickEnemies;tickEnemies=function(...args){const result=tickBase.apply(this,args);try{watchDance();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_VISUAL_R93__=Object.freeze({body:()=>({...body}),facing:e=>({art:artOf(e),side:faces.get(e)?.side||0}),dance:()=>dance&&{...dance},
  inspect:()=>({revision:'R93',stats:{...stats},lastError,cachedCentres:centres.size})});
})();
