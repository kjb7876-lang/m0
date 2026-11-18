/* R98 combat feel. Idle fighters face their opponent and ordinary melee mobs
 * circle, pace and hesitate instead of standing still between swings.
 * Damage, cooldowns, attack shapes, aggro ranges, hit detection, progression
 * and saves are read, never written. Native speed is restored exactly after
 * every tick. Canonical source; copied by scripts/apply-r98.cjs. */
(()=>{'use strict';
 if(window.__STORYWORLD_COMBAT_R98__||typeof tickEnemies!=='function'||typeof tick!=='function'||typeof facing!=='function'||typeof moveActor!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r98.combat';
 const DEFAULTS=Object.freeze({facing:true,mobMotion:true}),LABELS={facing:'전투 중 서로 마주보기',mobMotion:'잡몹 돌기·보폭 변화'};
 let prefs={...DEFAULTS},lastError=null;
 const stats={ticks:0,enemyFaces:0,heroFaces:0,orbitSteps:0,paceTicks:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const finite=v=>Number.isFinite(v)?v:0;
 // Same eight screen sectors the hero pose picker uses for its idle fallback.
 const ANGLES={e:0,se:Math.PI/4,s:Math.PI/2,sw:3*Math.PI/4,w:Math.PI,nw:-3*Math.PI/4,n:-Math.PI/2,ne:-Math.PI/4};
 function sectorOf(dx,dy){const a=Math.atan2((dx+dy)*.5,dx-dy);let best='s',bd=Infinity;for(const k in ANGLES){const r=ANGLES[k],d=Math.abs(Math.atan2(Math.sin(a-r),Math.cos(a-r)));if(d<bd){bd=d;best=k;}}return best;}
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const live=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded;
 const major=e=>!!(e.boss||e.midboss||e.persona);
 // Any committed or authored action owns the facing; only truly idle actors turn.
 const busy=e=>!!e.attack||e.rangedWindup>0||e.rest>0||time<e.graceUntil||e.state==='attack'||finite(e.r61BusyUntil)>time||!!e.r61Action;
 const ordinaryMelee=e=>!major(e)&&(e.ai==='melee'||!e.ai)&&!!e.combatProfile?.attackShape&&!e.r74Monster;

 function orbit(e,d,dt){
  const shape=e.combatProfile.attackShape,r=e.combatProfile.bodyBlock?.r||.28,h=hash(e.id);
  // Direction flips on a per-enemy clock, so a pack never circles in lockstep.
  const period=2.6+(h%7)*.35,dir=((Math.floor((time+(h%13)*.3)/period)+h)&1)?1:-1;
  const ux=(player.x-e.x)/d,uy=(player.y-e.y)/d,want=Math.max(.9,shape.range*.92);
  const tangent=.62,radial=Math.max(-.6,Math.min(.6,(d-want)*.9));
  const vx=-uy*dir*tangent+ux*radial,vy=ux*dir*tangent+uy*radial,len=Math.hypot(vx,vy);if(len<.001)return false;
  const step=e.speed*dt*Math.min(1,len),ox=e.x,oy=e.y;
  moveActor(e,vx/len*step,vy/len*step,r);
  const mx=e.x-ox,my=e.y-oy;if(Math.hypot(mx,my)<.0005){e.x=ox;e.y=oy;return false;}
  e.moveDX=mx;e.moveDY=my;e.moving=true;e.state='move';e.stuck=0;stats.orbitSteps++;return true;
 }

 const base=tickEnemies;
 tickEnemies=function(dt){
  const r=room,pace=[];
  try{
   if(prefs.mobMotion&&solo()&&r?.enemies&&typeof player!=='undefined'&&player){
    // Pace: a slow breathing speed change while approaching, never while swinging.
    for(const e of r.enemies){if(!live(e)||!ordinaryMelee(e)||busy(e))continue;const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<=e.combatProfile.attackShape.range+1.4||d>e.combatProfile.aggro)continue;
     const s=e.speed,m=1+.16*Math.sin(time*2.1+(hash(e.id)%628)/100);pace.push([e,s]);e.speed=s*m;stats.paceTicks++;}
   }
  }catch(err){fail(err);}
  let result;
  try{result=base.call(this,dt);}finally{for(const[e,s]of pace)e.speed=s;}
  try{
   if(r&&r===room&&r.enemies&&typeof player!=='undefined'&&player&&solo()&&!(typeof modal!=='undefined'&&modal)){
    for(const e of r.enemies){
     if(!live(e)||busy(e))continue;
     const d=Math.hypot(player.x-e.x,player.y-e.y);if(!(d>.001)||d>e.combatProfile.aggro)continue;
     const shape=e.combatProfile.attackShape;let orbited=false;
     if(prefs.mobMotion&&ordinaryMelee(e)&&(e.cd>0||!e.moving)&&d<shape.range+1.5&&d>shape.range*.45&&clearLine(e,player))orbited=orbit(e,d,dt);
     if(prefs.facing&&(!e.moving||orbited)&&clearLine(e,player)){e.direction=facing(player.x-e.x,player.y-e.y);stats.enemyFaces++;}
    }
   }
  }catch(err){fail(err);}
  stats.ticks++;return result;
 };

 const tickBase=tick;
 tick=function(dt){
  const result=tickBase.call(this,dt);
  try{
   if(prefs.facing&&typeof started!=='undefined'&&started&&!modal&&!loading&&player&&player.hp>0&&!player.moving&&!(player.attackAnim>0)&&!(player.skillAnim>0)&&!(player.dashAnim>0)&&room&&solo()&&!(typeof safeRegion==='function'&&safeRegion())){
    let best=null,bd=3.6;for(const e of room.enemies){if(!live(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd&&clearLine(player,e)){bd=d;best=e;}}
    if(best){const dx=best.x-player.x,dy=best.y-player.y;player.direction=facing(dx,dy);player.currentVisualSector=sectorOf(dx,dy);stats.heroFaces++;}
   }
  }catch(err){fail(err);}
  return result;
 };

 function settingsSection(){const host=document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR92Boss')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR98Combat'))return;
  const s=document.createElement('section');s.id='retroSettingsR98Combat';s.innerHTML='<h3>전투 느낌 (R98)</h3><p class="small muted">피해·쿨타임·공격 범위는 그대로이며 이 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r98c-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r98c-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_COMBAT_R98__=Object.freeze({prefs:()=>({...prefs}),set,sectorOf,inspect:()=>({revision:'R98-combat-feel',prefs:{...prefs},stats:{...stats},lastError,damageChanged:false,cooldownsChanged:false,attackShapesChanged:false,speedRestoredEachTick:true,savesTouched:false})});
})();
