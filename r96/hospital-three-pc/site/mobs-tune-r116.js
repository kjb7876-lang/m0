/* R116 mob tuning (ported from R108 onto R115; owner feedback 2026-10-28).
 * Facing ("도리도리" hold and the shared attack-sheet table) is left to R111/R113, which already own it.
 * 1. Ward champions (R81 "중간보스 · <mob>", an ordinary mob drawn twice as large) fight like the
 *    mob they came from, not like a story boss: illusion throw (R61 echo), prop throw (R61 prop),
 *    a telegraphed charge, and the ordinary melee swing. They no longer fire native ranged bolts
 *    (ai is held at 'melee') and nothing they throw or leave on the ground carries a status
 *    (bind/poison/bleed/...). Damage numbers, health, placement and rewards are unchanged.
 * 2. Ordinary mobs no longer all throw the same light-blue core (VFX.bolt): the shot takes the mob's
 *    R114 signature colour (palette glow), falling back to the R100 colour bucket.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_MOBS_TUNE_R116__||typeof tickEnemies!=='function'||typeof drawEnemy!=='function'||typeof makeShot!=='function'||typeof moveActor!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r116.mobtune';
 const prefs={championLimits:true,tintBolts:true};
 try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
 const stats={boltsTinted:0,championsTuned:0,aiHeld:0,shotsCleaned:0,hazardsCleaned:0,charges:0,chargeHits:0};
 let lastError=null;const fail=e=>{lastError=String(e?.stack||e).slice(0,300);};
 const T=()=>typeof time==='number'?time:0;
  const major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.cosmic||e?.trial);
 const champion=e=>!!e&&e.wardChampionR81===true&&!major(e);

 // ---- 2. ward champions: illusion, prop throw, charge, melee — no bolts, no statuses ----------
 const ownerOf=id=>room?.enemies?.find(e=>e.id===id)||null;
 const shotBase=makeShot;
 makeShot=function(x,y,angle,speed,damage,opts,...rest){let shot;
  try{if(prefs.championLimits&&opts&&opts.r58Affliction&&champion(ownerOf(opts.owner))){const o={...opts};delete o.r58Affliction;stats.shotsCleaned++;shot=shotBase.call(this,x,y,angle,speed,damage,o,...rest);}}catch(err){fail(err);}
  if(shot===undefined)shot=shotBase.apply(this,arguments);
  try{tintShot(shot);}catch(err){fail(err);}return shot;};
 // 3. Ordinary mobs all threw the same light-blue core (VFX.bolt). It now takes the mob's signature
 //    colour (R100 colourOf: violet, red, gold, ...). Tinted copies are made once per colour.
 const TINT={blue:[90,150,255],cyan:[90,230,255],dark:[120,70,150],gold:[255,200,80],lime:[170,255,90],magenta:[255,80,220],orange:[255,140,50],pale:[235,235,245],pink:[255,130,190],purple:[170,90,255],red:[255,70,60],teal:[60,220,190],violet:[190,110,255]};
 const tinted=new Map();
 function tintPath(base,colour){const rgb=Array.isArray(colour)?colour.map(v=>Math.round(v/8)*8):TINT[colour];if(!rgb)return null;const key='r116tint/'+rgb.join('-')+'/'+String(base).split('/').pop();if(tinted.has(key))return tinted.get(key);
  const row=typeof readyImage==='function'?readyImage(base):null;if(!row?.image)return null;const im=row.image,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!w||!h)return null;
  if(tinted.size>96)return null;const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),[R,G,B]=rgb;
  g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba('+R+','+G+','+B+',.82)';g.fillRect(0,0,w,h);
  g.globalCompositeOperation='lighter';g.globalAlpha=.28;g.drawImage(im,0,0);// keep a bright core
  c.__storyworldStaticTint={immutable:true,key};imageCache.set(key,{...row,image:c,ready:true,path:key});tinted.set(key,key);return key;}
 function tintShot(shot){if(!shot||shot.friendly||typeof VFX==='undefined'||shot.asset!==VFX.bolt)return;const o=ownerOf(shot.owner);if(!o||o.boss||o.persona)return;
  if(!prefs.tintBolts)return;const pal=window.__STORYWORLD_COMBAT_R114__?.palette?.(o),glow=pal?.gp;
  const colour=Array.isArray(glow)?glow:window.__STORYWORLD_POLISH_R100__?.colourOf?.(o);if(!colour||(!Array.isArray(colour)&&(!TINT[colour]||colour==='blue'||colour==='cyan')))return;const k=tintPath(shot.asset,colour);if(k){shot.asset=k;stats.boltsTinted++;}}
 // Statuses ride on the hit: R58 reads source.r58Affliction (or derives one from the owner) and
 // R61 reads source.r61Tag. For a champion's hit both get a key no status table knows, so the hit
 // lands with its normal damage and no bind/poison/bleed/... is admitted; the source is restored.
 const NO_STATUS=Object.freeze({key:'r108-none',wound:null});
 if(typeof hurt==='function'){const hurtBase=hurt;
  hurt=function(value,source,...rest){let o=null;
   try{if(prefs.championLimits&&source&&typeof source==='object'){const w=source.owner;o=typeof w==='object'?w:ownerOf(w);if(!champion(o))o=null;}}catch(err){fail(err);o=null;}
   if(!o)return hurtBase.apply(this,arguments);
   const hadA=Object.prototype.hasOwnProperty.call(source,'r58Affliction'),a=source.r58Affliction,hadT=Object.prototype.hasOwnProperty.call(source,'r61Tag'),tg=source.r61Tag;
   source.r58Affliction=NO_STATUS;if(hadT)source.r61Tag='r108-none';stats.statusBlocked=(stats.statusBlocked||0)+1;
   try{return hurtBase.call(this,value,source,...rest);}
   finally{if(hadA)source.r58Affliction=a;else delete source.r58Affliction;if(hadT)source.r61Tag=tg;}};}
 const charge=new WeakMap();
 const CH={min:2.6,max:6.2,wind:.5,dash:.42,speed:10.5,cdMin:6.5,cdMax:9};
 function seed(e){let h=0;for(const c of String(e.id))h=(h*31+c.charCodeAt(0))>>>0;return h;}
 function chargeStart(e,s,d){const t=T();s.phase='wind';s.t=t;s.tx=player.x;s.ty=player.y;s.next=t+CH.cdMin+(seed(e)%100)/100*(CH.cdMax-CH.cdMin);
  if(typeof facing==='function')e.direction=facing(player.x-e.x,player.y-e.y);
  try{if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX.mark)fx('sigil',s.tx,s.ty,{asset:VFX.mark,size:1.15,life:CH.wind+.15});}catch(_){}stats.charges++;}
 const tickBase=tickEnemies;
 tickEnemies=function(dt){
  const held=[];
  try{if(prefs.championLimits&&room?.enemies&&player){const t=T();
   for(const e of room.enemies){if(!champion(e)||!(e.hp>0))continue;
    if(!e.r108ChampionTuned){e.r108ChampionTuned=true;e.r108OriginalAi=e.ai;stats.championsTuned++;}
    if(e.ai!=='melee'){e.ai='melee';stats.aiHeld++;}e.rangedWindup=0;
    let s=charge.get(e);if(!s){s={phase:null,t:0,next:t+3+(seed(e)%300)/100,tx:0,ty:0};charge.set(e,s);}
    const d=Math.hypot(player.x-e.x,player.y-e.y);
    if(!s.phase&&t>=s.next&&!e.attack&&!e.r61Action&&e.spawnState==='active'&&player.hp>0&&!modal&&!loading&&d>=CH.min&&d<=CH.max&&(typeof clearLine!=='function'||clearLine(e,player)))chargeStart(e,s,d);
    if(s.phase){held.push([e,e.rest]);e.rest=999;e.moving=false;e.moveDX=e.moveDY=0;}}}}catch(err){fail(err);}
  let result;try{result=tickBase.apply(this,arguments);}finally{for(const[e,r]of held)e.rest=r;}
  try{if(prefs.championLimits&&room?.enemies&&player){const t=T(),step=Math.max(0,Math.min(.05,dt||0));
   for(const e of room.enemies){if(!champion(e))continue;const s=charge.get(e);if(!s?.phase)continue;
    if(!(e.hp>0)||e.r61Action||modal||loading){s.phase=null;continue;}
    if(s.phase==='wind'){if(t-s.t>=CH.wind){s.phase='dash';s.t=t;}continue;}
    const reach=(e.combatProfile?.attackShape?.range||1)*.85,dx=s.tx-e.x,dy=s.ty-e.y,L=Math.hypot(dx,dy),pd=Math.hypot(player.x-e.x,player.y-e.y);
    if(t-s.t>=CH.dash||L<.15||pd<=reach){if(pd<=reach)stats.chargeHits++;s.phase=null;e.cd=Math.min(finite(e.cd)||0,.12);continue;}
    const ox=e.x,oy=e.y,mv=Math.min(L,CH.speed*step),r=e.combatProfile?.bodyBlock?.r||.4;moveActor(e,dx/L*mv,dy/L*mv,r);
    e.moveDX=e.x-ox;e.moveDY=e.y-oy;e.moving=true;e.state='move';if(Math.hypot(e.x-ox,e.y-oy)<mv*.2){s.phase=null;}}
   for(const h of hazards)if(h&&h.r58Affliction&&champion(ownerOf(h.owner))){delete h.r58Affliction;stats.hazardsCleaned++;}}}catch(err){fail(err);}
  return result;};
 const finite=n=>Number.isFinite(n)?n:0;

 function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];
  if(!prefs.championLimits)for(const e of room?.enemies||[])if(e.r108ChampionTuned&&e.r108OriginalAi){e.ai=e.r108OriginalAi;e.r108ChampionTuned=false;}
  try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_MOBS_TUNE_R116__=Object.freeze({revision:'R116-mob-tune',prefs:()=>({...prefs}),set,storageKey:KEY,isChampion:champion,
  charge:{...CH},
  inspect:()=>({prefs:{...prefs},stats:{...stats},lastError,champions:(room?.enemies||[]).filter(champion).map(e=>({id:e.id,name:e.name,ai:e.ai,originalAi:e.r108OriginalAi||null,charge:charge.get(e)?.phase||null}))})});
})();
