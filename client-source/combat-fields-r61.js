/* R61 motion-owned afterimages, scenery throws and lasting elemental ground.
 * Native projectile capacity, swept collision, hurt/guard/wound admission and
 * the hospital poison attack remain authoritative. No render-owned damage. */
(()=>{'use strict';
 const finite=Number.isFinite,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),states=new WeakMap(),singleStatuses=new Map(),events=[];
 const statusMap=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return c&&c.mode()!=='off'?c.statusLane():singleStatuses;};
 const statuses={get size(){return statusMap().size;},get:k=>statusMap().get(k),has:k=>statusMap().has(k),set:(k,v)=>statusMap().set(k,v),delete:k=>statusMap().delete(k),clear:()=>statusMap().clear(),values:()=>statusMap().values(),entries:()=>statusMap().entries(),[Symbol.iterator]:()=>statusMap()[Symbol.iterator]()};
 const metrics={prepared:0,released:0,echo:0,prop:0,field:0,cancelled:0,refusedArt:0,statuses:0,fieldPulses:0,frames:0,motionDraws:0,clears:0};
 let scoped=null,victim=null,statusRoom=null,trackedRoom=null,trackedPlayer=null;
 const defs=Object.freeze({
  dark:{label:'암흑 · 집중 저하',icon:'◐',wound:'curse',duration:3.4},shock:{label:'감전 · 공격 지연',icon:'ϟ',wound:'shock',duration:2.3},
  frost:{label:'빙결 · 이동 둔화',icon:'❄',wound:'chill',duration:2.8},fire:{label:'방화 · 화상',icon:'♨',wound:'burn',duration:3.3},
  charm:{label:'매혹 · 위력 저하',icon:'♡',wound:'weakness',duration:3.1},weakness:{label:'허약 · 공격 저하',icon:'↓',wound:'weakness',duration:3.4},
  corruption:{label:'타락 · 흡혈 저하',icon:'☠',wound:'curse',duration:3.4},bind:{label:'속박 · 이동 제한',icon:'⌁',wound:'bind',duration:2.2},
  harvest:{label:'수확 · 생명력 고갈',icon:'☠',wound:'curse',duration:3.2},pollution:{label:'오염 · 중독',icon:'☠',wound:'poison',duration:3.4},
  disease:{label:'질병 · 회복 저하',icon:'✚',wound:'poison',duration:3.5},bleed:{label:'출혈',icon:'☠',wound:'bleed',duration:3}
 });
 const pathFor=key=>'assets/ailments-r61/'+key+'.webp';
 const allPaths=Object.keys(defs).map(pathFor),major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.cosmic||e?.trial);
 const note=x=>{events.push({...x,at:time});if(events.length>220)events.shift();};
 const live=e=>!!e&&!!room&&room.enemies.includes(e)&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&!e.disabled&&visible3(e);
 const activeAction=e=>{const a=e?.r61Action;return a&&a.room===room&&time<a.endAt&&!a.cancelled?a:null;};
 function themeFor(e){
  const origin=(e?.trial||e?.cosmic)?regions.find(r=>[...(r.bosses||[]),...(r.midboss?[r.midboss]:[])].some(a=>a.id===(e.nativeId||e.profile?.id)))?.id:null;
  const id=String(e?.r61OriginZone||e?.summonSourceZone61||e?.originZone||origin||room?.id||zone||''),r=regionById[id]||regionById[zone]||{},words=[e?.nativeId,e?.name,e?.weapon,e?.profile?.name,r.name,r.title].join(' ').toLowerCase();
  if(/a08|ep1a08/.test(id+' '+e?.nativeId))return /shock|전기|감전|a08-s1/.test(words)?'shock':major(e)||e.nativeId==='mb-ep1a08'||e.r61CloneSource==='mb-ep1a08'?'pollution':/a08-c1/.test(words)?'bleed':'disease';
  if(/persona|inner-evil|페르소나/.test(words)||e?.persona)return'corruption';
  if(/last30[4-6]|cult0[34]|흑장미|타락|lucifer/.test(id+' '+words))return'corruption';
  if(/수확|scythe|harvest|낫/.test(words)||/last30[12]/.test(id))return'harvest';
  if(/frost|ice|snow|빙|설원|검은태양/.test(words)||/^ep1b06/.test(id))return'frost';
  if(/매혹|charm|rose|쾌락|두 사람/.test(words)||/^u20[56]$/.test(id))return'charm';
  if(/ep1a10|ep1b07|kair0[27]|machine|도시|과부하|전기|shock/.test(id+' '+words))return'shock';
  if(/fire|burn|화염|잿불|방화|피란불/.test(words)||/dist05|last303/.test(id))return'fire';
  if(/병|disease|plague|잠들지/.test(words)||/^u20[789]$/.test(id))return'disease';
  if(/^dist0[24]$/.test(id)||r.theme==='swamp'||/poison|오염|독|늪/.test(words))return'pollution';
  if(/root|뿌리|거미|속박|통제/.test(words)||r.theme==='forest'||/^u20[1234]$/.test(id))return'bind';
  if(/kair0[568]|기억|뇌|허약/.test(id+' '+words))return'weakness';
  if(r.theme==='time')return'frost';if(r.theme==='city'||r.theme==='ruin')return'fire';
  if(/claw|blade|cleave|polearm|검|도끼/.test(words))return'bleed';return'dark';
 }
 function state(e){let s=states.get(e);if(!s||s.room!==room){const seed=[...String(e?.id||'')].reduce((n,c)=>n+c.charCodeAt(0),0);s={room,next:time+4.2+(seed%23)*.17,step:0};states.set(e,s);}return s;}
 function clock(e){const a=activeAction(e);if(!a)return null;const elapsed=Math.max(0,time-a.start),windup=Math.max(.01,a.releaseAt-a.start),after=time-a.releaseAt,frame=after>=.15?3:after>=-1e-7?2:elapsed>=windup*.32?1:0;return{token:a.token,kind:a.kind,angle:a.angle,elapsed,windup,active:.15,recovery:Math.max(.1,a.endAt-a.releaseAt-.15),frame,phase:['ready','windup','contact','recovery'][frame]};}
 function medicalFrame(e,index=1){
  const hospital=room?.id==='ep1a08'&&!e?.persona&&!e?.cosmic&&!e?.trial;if(!hospital)return null;
  const v=window.__STORYWORLD_STORY_COMBAT_R54__.projection(activeAction(e)?.angle??Math.atan2(player.y-e.y,player.x-e.x)),back=v.y<-.04;
  const boss=major(e)||e.nativeId==='mb-ep1a08'||e.r61CloneSource==='mb-ep1a08',path=boss?'assets/visual-test/hospital-boss-motion-r53.png':back?'assets/visual-test/hospital-ranged-back-r53.png':'assets/visual-test/hospital-ranged-motion-r52.png',meta=boss?window.__STORYWORLD_BOSS_ATLAS_R53__:back?window.__STORYWORLD_RANGED_BACK_ATLAS_R53__:window.__STORYWORLD_RANGED_ATLAS_R52__,cell=meta?.cells?.[(boss?(back?12:8):e.nativeId==='a08-s1'?8:e.nativeId==='a08-o2'?4:0)+index];
  if(!cell)return null;return{path,assetFrame:{sourceRect:cell.sourceRect,pivot:cell.pivot,visibleHeight:cell.visibleHeight,bakedFacing:'eight-way'},flip:v.x<0,r61Hospital:true};
 }
 const personaClone=e=>!!e?.r61Clone&&/inner-evil|persona/i.test(String(e.nativeId||e.r61CloneSource||''));
 function personaFrame(e){
  if(!e?.persona&&!personaClone(e))return null;const a=activeAction(e)?.angle??e.attack?.angle??(e.rangedWindup>0?e.rangedAim:null)??window.__STORYWORLD_COMBAT_FOCUS_R54__?.angle?.(e)??Math.atan2(player.y-.15-e.y,player.x-e.x),index=((Math.round(Math.atan2(-Math.cos(a),Math.sin(a))/(Math.PI/4))%8)+8)%8,data=portable.rc142GameplayArt?.hiddenPersona?.bodyDirections,direction=data?.directionOrder?.[index],prefix=e.awakeUntil>time?'awake-':'base-',row=data?.frames?.find(r=>r.direction===direction&&String(r.path).split('/').at(-1)===prefix+index+'.png');
  if(!row||!readyImage(row.path)?.image)return null;const[w,h]=row.outputDimensions||[];return{path:row.path,assetFrame:{sourceRect:[0,0,w,h],pivot:[...row.pivot.canvasPx],visibleHeight:h,bakedFacing:'eight-way'},r61PersonaSource:true};
 }
 function sourceFrame(e,index=2){
  if(!e)return null;const persona=personaFrame(e);if(persona)return persona;const hospital=medicalFrame(e,index);if(hospital&&window.__STORYWORLD_STORY_COMBAT_R54__.validFrame(hospital))return hospital;
  const f=window.__STORYWORLD_STORY_COMBAT_R54__.frameSet(e),keys=index===0?['idle','move','anticipation','windup','attack']:index===1?['anticipation','windup','attackA','attack','strike']:index===2?['strike','attackA','attack','attackB','windup']:['recover','recovery','idle','anticipation','attack'];
  let chosen=keys.map(k=>f[k]).find(v=>window.__STORYWORLD_STORY_COMBAT_R54__.validFrame(v));
  if(!chosen&&(index===0||index===3)&&readyImage(e.path)?.image){const row=readyImage(e.path),im=row.image,c=row.crop||{x:0,y:0,w:im.naturalWidth,h:im.naturalHeight};chosen={path:e.path,assetFrame:{sourceRect:[c.x||0,c.y||0,c.w,c.h],pivot:[c.w/2,c.h],visibleHeight:c.h}};}
  if(chosen&&!chosen.assetFrame){const row=readyImage(chosen.path),im=row?.image,c=row?.crop||{x:0,y:0,w:im?.naturalWidth,h:im?.naturalHeight};if(im&&c.w>0&&c.h>0)chosen={...chosen,assetFrame:{sourceRect:[c.x||0,c.y||0,c.w,c.h],pivot:[c.w/2,c.h],visibleHeight:c.h,bakedFacing:'right'}};}return chosen||null;
 }
 function motionReady(e){if(!live(e))return false;if(room?.id==='ep1a08'&&!e.persona&&!e.cosmic&&!e.trial){if(!['assets/visual-test/hospital-medical-tools-r20.png','assets/vfx/bosses/v393/ep1a08-restraint-wave.webp'].every(p=>readyImage(p)?.image))return false;const a=medicalFrame(e,1),b=medicalFrame(e,2);if(!a||!b||!window.__STORYWORLD_STORY_COMBAT_R54__.validFrame(a)||!window.__STORYWORLD_STORY_COMBAT_R54__.validFrame(b))return false;}return !!sourceFrame(e,1)&&!!sourceFrame(e,2);}
 function frameFor(e,fallback){const c=clock(e);if(!c)return fallback;const f=activeAction(e)?.frames?.[c.frame]||sourceFrame(e,c.frame);if(!f)return fallback;const baked=f.assetFrame?.bakedFacing,v=window.__STORYWORLD_STORY_COMBAT_R54__.projection(c.angle),flip=f.r61Hospital?f.flip:baked==='eight-way'||e.persona?false:baked==='left'?v.x>0:v.x<0;metrics.frames++;return{...f,flip,r61ActionFrame:true,r54StoryPose:true,r54Angle:c.angle,r54Phase:c.phase,r54Frame:c.frame};}
 function nativeBusy(e){return!!e.attack||e.rangedWindup>0||e.rest>0||delayed.some(q=>q.owner===e.id&&q.key===layerKey())||(e.personaPendingShots150||[]).some(q=>q.key===layerKey())||time<Number(e.storyAttackUntil5||0)||hazards.some(h=>h.owner===e.id&&!h.r61Field&&h.age<h.life&&(h.medical20&&!h.medical20.cancelled&&time<h.medical20.releaseAt+.46||h.cast150&&!h.cast150.consumed||h.personaWarning150));}
 function cancel(e,reason){const a=e?.r61Action;if(!a||!a.r61FieldsOwned)return;if(!a.released)metrics.cancelled++;a.cancelled=true;if(a.hazard)a.hazard.life=0;if(e.r61Action===a)delete e.r61Action;e.r61BusyUntil=0;note({kind:'cancel',owner:e.id,reason});}
 function beginMotion(e,kind,options={}){
  if(trackedRoom!==room||trackedPlayer!==player)clear('identity-before-prepare');
  if(!live(e)||!player||player.hp<=0||modal||loading||activeAction(e)||nativeBusy(e)||!motionReady(e))return null;
  const a={kind,room,start:time,releaseAt:time+Math.max(.58,Number(options.windup)||.92),endAt:0,angle:finite(options.angle)?options.angle:Math.atan2(player.y-.15-e.y,player.x-e.x),token:++uid,r61FieldsOwned:true,released:false,onRelease:typeof options.onRelease==='function'?options.onRelease:null};
  a.endAt=a.releaseAt+Math.max(.42,Number(options.recovery)||.48);a.origin={x:e.x,y:e.y};a.target={x:player.x,y:player.y-.15};e.r61Action=a;a.frames=[0,1,2,3].map(i=>sourceFrame(e,i));e.r61BusyUntil=a.endAt;e.direction=facing(Math.cos(a.angle),Math.sin(a.angle));e.moving=false;state(e).next=Math.max(state(e).next,a.endAt+Math.max(2,Number(options.cooldown)||8));metrics.prepared++;note({kind:'prepare',owner:e.id,action:kind,token:a.token,angle:a.angle});return a;
 }
 function propFor(e){
  const hospital=room?.id==='ep1a08',themed=(room?.exploration?.scenery59?.props||[]).filter(p=>p.path&&readyImage(p.path)?.image);
  const rows=(hospital?(window.__STORYWORLD_HOSPITAL_ZONES13__?.props(room)||[]).filter(p=>['gurney','wheelchair','curtain'].includes(p.visualHospitalFrame)):themed.length?themed:room?.props||[]).filter(p=>p.path&&readyImage(p.path)?.image&&p.visible!==false&&!p.destroyed&&!p.disabled&&!p.terrainWall&&!/door|wall/i.test(p.visualHospitalFrame||'')&&p!==e);
  rows.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));const p=rows[state(e).step%Math.max(1,Math.min(rows.length,4))];
  if(!p){if(hospital)return null;const path=window.__STORYWORLD_SCENERY_R59__?.assetFor(room.id,state(e).step);return path&&readyImage(path)?.image?{path,x:e.x,y:e.y,id:null,frame:null}:null;}
  const f=hospital&&window.__STORYWORLD_VISUAL_TEST__?.frames?.[p.visualHospitalFrame],frame=f?{path:p.path,assetFrame:{sourceRect:[...f.rect],pivot:[...f.pivot],visibleHeight:f.pivot[1],bakedFacing:'right'}}:null;
  return{path:p.path,x:Math.hypot(p.x-e.x,p.y-e.y)<18?p.x:e.x,y:Math.hypot(p.x-e.x,p.y-e.y)<18?p.y:e.y,id:p.id,frame,medicalProp:hospital?p.visualHospitalFrame:null};
 }
 function affliction(key,e){return{key:({dark:'curse',frost:'chill',fire:'burn',charm:'weakness',corruption:'curse',harvest:'curse',pollution:'poison',disease:'poison'})[key]||key,wound:defs[key].wound,owner:e.id};}
 function throwAction(e,kind){
  if(!live(e)||!['echo','prop','field'].includes(kind))return null;
  const key=themeFor(e),frame=sourceFrame(e,2),prop=kind==='echo'?null:propFor(e),path=kind==='echo'?frame?.path:prop?.path;
  if(!path||!readyImage(path)?.image||kind==='field'&&!readyImage(pathFor(key))?.image){metrics.refusedArt++;state(e).next=time+2;return null;}
  if(kind==='field'&&hazards.filter(h=>h.r61Field&&h.age<h.life).length>=(settings.lowFx?5:9)){state(e).next=time+1.5;return null;}
  if(kind!=='field'&&projectiles.filter(p=>p.r61Shot&&!p.dead).length>=(settings.lowFx?12:20)){state(e).next=time+1.2;return null;}
  const a=beginMotion(e,kind,{windup:major(e)?1.08:.92,cooldown:major(e)?8.2:10.5});if(!a)return null;
  a.key=key;a.path=kind==='echo'?a.frames[2]?.path||path:path;a.prop=prop;a.frame=kind==='echo'?{...(a.frames[2]||frame)}:prop?.frame||null;a.damage=Math.max(1,Number(e.damage)||1)*(kind==='field'?.72:.64);a.onRelease=()=>releaseThrow(e,a);state(e).step++;
  if(kind==='field'){
   const flight=clamp(Math.hypot(a.target.x-a.origin.x,a.target.y-a.origin.y)/7,.70,1.4),duration=3.4,radius=1.45+(1-clamp(e.hp/Math.max(1,e.maxHp)))*.30;
   const h={id:++uid,type:'field',owner:e.id,x:a.target.x,y:a.target.y,radius,age:0,warning:a.releaseAt-time+flight,life:a.releaseAt-time+flight+duration,damage:0,lastHit:-99,asset:pathFor(key),r58Affliction:affliction(key,e),r61Tag:key,r61Field:{room,player,owner:e,action:a,impactAt:a.releaseAt+flight,endAt:a.releaseAt+flight+duration,duration,remaining:a.damage,pulses:0,released:false}};
   a.hazard=h;hazards.push(h);
  }
  return a;
 }
 function releaseThrow(e,a){
  if(a.room!==room||!live(e)||!readyImage(a.path)?.image||!motionReady(e)){if(a.hazard)a.hazard.life=0;metrics.refusedArt++;return false;}
  const kind=a.kind;if(kind==='field'){
   if(!readyImage(pathFor(a.key))?.image){a.hazard.life=0;metrics.refusedArt++;return false;}a.hazard.r61Field.released=true;metrics.field++;
  }else{
   const speed=kind==='echo'?4.8:4.15,radius=kind==='echo'?.22:.24;
   const shot=makeShot(a.origin.x,a.origin.y,a.angle,speed,a.damage,{owner:e.id,asset:a.path,radius,life:Math.min(3.2,9/speed),scale:1.1,r58Affliction:affliction(a.key,e),r61Tag:a.key,r61Shot:{room,player,owner:e,frame:a.frame,path:a.path,kind,angle:a.angle,token:a.token,bodyScale:(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1),flight:Math.max(.12,Math.hypot(a.target.x-a.origin.x,a.target.y-a.origin.y)/speed),hand:(()=>{const h=throwHand(e,a),n=actorHeight();return{dx:h.dx/n,dy:h.dy/n};})(),flip:frameFor(e,a.frame)?.flip??false}});
   if(!shot)return false;metrics[kind]++;
  }
  metrics.released++;note({kind:'release',owner:e.id,action:kind,token:a.token,key:a.key,path:a.path});sound(a.key==='shock'?'special':'swMetal');return true;
 }
 function clear(reason='clear'){
  for(const r of new Set([room,trackedRoom]))for(const e of r?.enemies||[])cancel(e,reason);
  hazards=hazards.filter(h=>!h.r61Field);projectiles=projectiles.filter(p=>!p.r61Shot);statuses.clear();victim=null;statusRoom=null;trackedRoom=room;trackedPlayer=player;metrics.clears++;note({kind:'clear',reason});
 }
 function statusValid(){if(window.__STORYWORLD_COOP_SIM_R62__?.mode()!=='off'&&window.__STORYWORLD_COOP_SIM_R62__){if(!player||player.hp<=0){statuses.clear();return false;}for(const[k,v]of statuses)if(time>=v.until)statuses.delete(k);return true;}if(victim!==player||statusRoom!==room||!player||player.hp<=0){statuses.clear();return false;}for(const[k,v]of statuses)if(time>=v.until)statuses.delete(k);return true;}
 const has=k=>statusValid()&&statuses.has(k);
 function applyStatus(key,e){if(!defs[key]||!live(e)||!player||player.hp<=0)return false;statusValid();victim=player;statusRoom=room;const old=statuses.get(key);if(!old&&statuses.size>=5)statuses.delete([...statuses.values()].sort((a,b)=>a.until-b.until)[0].key);statuses.set(key,{key,owner:e.id,start:old?.start??time,until:time+defs[key].duration});if(!old){if(key==='shock')player.attackCD=Math.min(.75,Math.max(0,player.attackCD)+.22);if(key==='charm'||key==='harvest')player.resonance=Math.max(0,player.resonance-(key==='harvest'?6:4));}metrics.statuses++;return true;}
 const hurtBase=hurt;hurt=function(value,source){
  const meta=source?.r61Shot||source?.r61Field,key=source?.r61Tag;if(!meta)return hurtBase.apply(this,arguments);
  if(meta.room!==room||meta.player!==player||!live(meta.owner)||!readyImage(source.asset)?.image||meta.action&&!meta.released)return'ignored';
  const before=player?.hp,outcome=hurtBase.apply(this,arguments);if(outcome==='hit'&&player?.hp<before&&player.hp>0){applyStatus(key,meta.owner);fx('contactR61',player.x,player.y-.15,{life:.38,r61Key:key,r61Player:player,r61Room:room});}return outcome;
 };
 const tickEnemiesBase=tickEnemies;tickEnemies=function(dt){
  if(trackedRoom!==room||trackedPlayer!==player)clear('identity');
  const units=(room?.enemies||[]).slice(),held=[];
  for(const e of units){let a=activeAction(e);if(e.r61Action?.r61FieldsOwned&&!live(e)){cancel(e,'owner');continue;}
   if(!a&&live(e)&&!modal&&!loading&&player?.hp>0&&time>=(e.graceUntil||0)&&(!major(e)||room.engaged)&&!nativeBusy(e)){
    const s=state(e),d=Math.hypot(player.x-e.x,player.y-e.y);if(time>=s.next&&d<9&&d>.45&&clearLine(e,player))a=throwAction(e,major(e)?['field','echo','prop'][s.step%3]:['echo','prop'][s.step%2]);
   }
   if(a?.r61FieldsOwned){if(a.room!==room||!live(e)){cancel(e,'lifecycle');continue;}held.push([e,e.rest]);e.rest=999;e.moving=false;e.moveDX=e.moveDY=0;
    if(!a.released&&time+1e-7>=a.releaseAt){a.released=true;try{a.onRelease?.();}catch(error){cancel(e,'release-error');throw error;}}
   }
  }
  let result;try{result=tickEnemiesBase.apply(this,arguments);}finally{for(const[e,rest]of held)e.rest=Math.max(0,rest-dt);}
  for(const e of units){const a=e.r61Action;if(a?.r61FieldsOwned&&time>=a.endAt){delete e.r61Action;e.r61BusyUntil=0;e.cd=Math.max(Number(e.cd)||0,.4);}}
  return result;
 };
 const tickHazardsBase=tickHazards;tickHazards=function(dt){
  const own=hazards.filter(h=>h.r61Field),base=hazards.filter(h=>!h.r61Field);hazards=base;let result;try{result=tickHazardsBase.apply(this,arguments);}finally{if(room===trackedRoom)hazards.push(...own);}
  for(const h of own){const m=h.r61Field;h.age=time-m.action.start;
   if(m.room!==room||m.player!==player||!live(m.owner)||!readyImage(h.asset)?.image||!readyImage(m.action.path)?.image||m.action.cancelled||time>=m.endAt){h.life=0;continue;}
   if(!m.released||time<m.impactAt)continue;
   // Four native-admitted contacts share one finite cast budget. The lingering
   // image remains for 3.4 seconds; it cannot deal unbounded frame-rate damage.
   while(m.pulses<4&&time>=m.impactAt+m.pulses*.85){const due=m.impactAt+m.pulses*.85;m.pulses++;if(time-due>.18)continue;const g=genericFootprint154(h);if(footprintContains154(g,player.x,player.y-.15,.12)&&clearLine({x:h.x,y:h.y},player)){
     const amount=m.remaining/Math.max(1,5-m.pulses);m.remaining-=amount;h.lastHit=due;metrics.fieldPulses++;hurt(amount,h);
    }}
  }
  hazards=hazards.filter(h=>h.age<h.life);return result;
 };
 const tickShotsBase=tickShots;tickShots=function(...args){for(const p of projectiles){const m=p.r61Shot;if(m&&(m.room!==room||m.player!==player||!live(m.owner)||!readyImage(m.path)?.image))p.dead=true;}return tickShotsBase.apply(this,args);};
 const story=window.__STORYWORLD_STORY_COMBAT_R54__;window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...story,clock:e=>clock(e)||story.clock(e),frameSet(e){const f=personaClone(e)&&personaFrame(e);return f?{idle:f,move:f,anticipation:f,windup:f,attack:f,strike:f,recover:f}:story.frameSet(e);},frameFor(e,f){const a=activeAction(e);if(a)return frameFor(e,story.frameFor(e,f));const p=personaClone(e)&&personaFrame(e),c=story.clock(e);return p?{...p,r54StoryPose:true,r54Angle:c?.angle??Math.atan2(player.y-.15-e.y,player.x-e.x),r54Phase:c?.phase||'combat-stance',r54Frame:c?.frame??-1,flip:false}:story.frameFor(e,f);}});
 const flip=window.__STORYWORLD_ENEMY_MOTION_R51__;if(flip)window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...flip,flip:(e,f,b)=>f?.r61ActionFrame?f.flip:flip.flip(e,f,b)});
 const medical=window.__STORYWORLD_MEDICAL_R49__;if(medical)window.__STORYWORLD_MEDICAL_R49__=Object.freeze({...medical,bossFrame:(e,f)=>activeAction(e)?frameFor(e,f):medical.bossFrame(e,f),bossFlip:(e,f)=>activeAction(e)?frameFor(e,null)?.flip??f:medical.bossFlip(e,f)});
 const art=window.__STORYWORLD_PHASE1_ART__;if(art)window.__STORYWORLD_PHASE1_ART__=Object.freeze({...art,enemy(e){const old=art.enemy(e),f=activeAction(e)&&frameFor(e,null);return f?{...old,path:f.path,frame:f,flip:f.flip}:old;}});
 const body=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(body)window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...body,hasMotion:e=>!!activeAction(e)||body.hasMotion(e),applyBodyPose(c,hero=false){const a=!hero&&clock(scoped);if(!a)return body.applyBodyPose(c,hero);const v=story.projection(a.angle),lean=a.frame<2?-.028:a.frame===2?.068:.026,q=settings.reducedMotion?.4:settings.lowFx?.7:1;c.transform(1,0,-v.x*lean*q,1-Math.max(0,lean)*.18*q,0,0);metrics.motionDraws++;return{phase:a.phase,angle:a.angle};}});
 const drawEnemyBase=drawEnemy;drawEnemy=function(e,...args){const old=scoped;scoped=e;try{const result=drawEnemyBase.apply(this,[e,...args]),a=activeAction(e);if(a&&['echo','prop'].includes(a.kind)&&time<a.releaseAt){const u=clamp((time-a.start)/(a.releaseAt-a.start)),q=project(a.origin.x,a.origin.y),height=actorHeight()*(a.kind==='echo'?(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1):.58);if(a.kind==='echo')bitmap(a.path,q.x,q.y-actorHeight()*.48,height,{frame:a.frame,alpha:.19*u,flip:a.frames?.[2]?.flip??false});else{const v=clamp(u/.6),hand=throwHand(e,a),p=project((a.prop?.x??a.origin.x)+(a.origin.x-(a.prop?.x??a.origin.x))*v,(a.prop?.y??a.origin.y)+(a.origin.y-(a.prop?.y??a.origin.y))*v);bitmap(a.path,p.x+hand.dx*v,p.y+hand.dy*v-actorHeight()*.12*(1-v),height,{frame:a.frame,alpha:.55+.35*u,angle:u*.18});}}return result;}finally{scoped=old;}};
 function throwHand(e,a){const q=project(a.origin.x,a.origin.y),h=actorHeight()*(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1),v=story.projection(a.angle),native=room?.id==='ep1a08'&&window.__STORYWORLD_HOSPITAL_MOTION_R53__?.throwHand({owner:e,kind:'poison',angle:a.angle,origin:a.origin});return native||{x:q.x+h*.10*v.x,y:q.y-h*.62,dx:h*.10*v.x,dy:-h*.62};}
 function bitmap(path,x,y,height,options={}){const row=readyImage(path);if(!row?.image)return false;if(options.frame?.assetFrame)return drawAssetFrame3(path,options.frame,x,y+height*.5,height,options);const c=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight},w=height*c.w/c.h;return drawImage(path,x,y,w,height,{blend:'source-over',...options});}
 const drawProjectileBase=drawProjectile;drawProjectile=function(p,...args){const m=p?.r61Shot;if(!m)return drawProjectileBase.apply(this,[p,...args]);if(m.room!==room||m.player!==player||p.dead)return;const q=project(p.x,p.y),height=actorHeight()*(m.kind==='echo'?m.bodyScale:.66);if(m.kind==='echo'){
   const v=story.projection(m.angle);for(let i=2;i>=0;i--)bitmap(m.path,q.x-v.x*i*height*.14,q.y-height*.42-v.y*i*height*.14,height,{frame:m.frame,flip:m.flip,alpha:i===0?.72:.16,filter:'saturate(.60) brightness(1.08)'});
  }else{const u=clamp(p.age/m.flight),n=actorHeight();bitmap(m.path,q.x+n*m.hand.dx*(1-u),q.y+n*(m.hand.dy*(1-u)-.46*u),height,{frame:m.frame,alpha:.95,angle:Math.min(1.6,p.age*1.9)});}
 };
 function fieldGround(h,g,alpha){
  const im=readyImage(h.asset)?.image;if(!im)return false;const q=project(g.x,g.y),u=project(g.x+1,g.y),v=project(g.x,g.y+1),w=g.radius*2;
  ctx.save();try{traceFootprint154(g);ctx.clip();ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha);ctx.filter='saturate(.84) brightness(.98)';ctx.transform(u.x-q.x,u.y-q.y,v.x-q.x,v.y-q.y,q.x,q.y);ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,-w/2,-w/2,w,w);}finally{ctx.restore();}drawStats.sprites++;
  if(typeof recordFootprint154==='function')recordFootprint154('draws',{castId:h.id,path:h.asset,stage:'r61-lingering-field',geometry:{...g},at:time,sourceBoundsKind:'generated-alpha-ground-patch'});return true;
 }
 const drawHazardBase=drawHazard;drawHazard=function(h,...args){const m=h?.r61Field;if(!m)return drawHazardBase.apply(this,[h,...args]);if(m.room!==room||!live(m.owner)||!readyImage(h.asset)?.image||m.action.cancelled||time>=m.endAt)return;
  const a=m.action,g=genericFootprint154(h),size=actorHeight()*.68,hand=throwHand(m.owner,a);
  if(time<m.impactAt){strokeFootprint154(g,'warning','#c2b6a0');if(time<a.releaseAt){const u=clamp((time-a.start)/(a.releaseAt-a.start)),v=clamp(u/.65),o=a.prop||a.origin,q=project(o.x+(a.origin.x-o.x)*v,o.y+(a.origin.y-o.y)*v);bitmap(a.path,q.x+hand.dx*v,q.y+hand.dy*v-actorHeight()*.12*(1-v),size,{frame:a.frame,alpha:.70+.22*u,angle:u*.18});}
   else if(m.released){const u=clamp((time-a.releaseAt)/(m.impactAt-a.releaseAt)),q=project(a.origin.x+(a.target.x-a.origin.x)*u,a.origin.y+(a.target.y-a.origin.y)*u);shadow(q.x,q.y,size*.25,{alpha:.20});bitmap(a.path,q.x+hand.dx*(1-u),q.y+hand.dy*(1-u)-actorHeight()*.65*Math.sin(Math.PI*u),size,{frame:a.frame,alpha:.95,angle:u*1.8});}
  }else if(m.released){const fade=Math.min(1,(m.endAt-time)/.6,(time-m.impactAt)/.16+.3);fieldGround(h,g,.76*fade);}
 };
 const drawEffectBase=drawEffect;drawEffect=function(e,...args){if(e?.type!=='contactR61')return drawEffectBase.apply(this,[e,...args]);if(e.r61Room!==room||e.r61Player!==player||!player||player.hp<=0)return;const q=project(player.x,player.y-.15);bitmap(pathFor(e.r61Key),q.x,q.y-actorHeight()*.58,actorHeight()*.56,{alpha:.48*(1-e.age/e.life)});};
 const heroBase=drawHero;drawHero=function(...args){const result=heroBase.apply(this,args);if(!statusValid())return result;const q=project(player.x,player.y-.15);let i=0;for(const[k,v]of statuses){if(i++>=(settings.lowFx?1:2))break;bitmap(pathFor(k),q.x+(i%2?-.1:.1)*actorHeight(),q.y-actorHeight()*.46,actorHeight()*.48,{alpha:.23*Math.min(1,(v.until-time)/.5)});}return result;};
 const moveBase=moveActor;moveActor=function(e,dx,dy,...args){const factor=e===player?(has('bind')?.48:has('frost')?.60:1):1;return moveBase.call(this,e,dx*factor,dy*factor,...args);};
 const hitBase=hitEnemy;hitEnemy=function(e,damage,...args){const factor=has('charm')?.72:has('weakness')?.75:has('dark')?.85:has('disease')?.90:1;return hitBase.call(this,e,damage*factor,...args);};
 const wounds=window.__STORYWORLD_HOSPITAL_WOUNDS_R53__;if(wounds)window.__STORYWORLD_HOSPITAL_WOUNDS_R53__=Object.freeze({...wounds,admit(actual,source){const meta=source?.r61Shot||source?.r61Field,key=source?.r61Tag,wound=defs[key]?.wound;if(room?.id==='ep1a08'&&meta&&['poison','shock'].includes(wound)){return wounds.admit(actual,{...source,medical20:{owner:meta.owner,room,kind:wound,r61BudgetClassificationOnly:true}});}return wounds.admit(actual,source);},lifestealEfficiency(){return wounds.lifestealEfficiency()*(has('harvest')?.30:has('corruption')?.40:has('disease')?.45:has('pollution')?.55:has('dark')?.78:1);},statusRows(){const rows=wounds.statusRows();if(statusValid())for(const[k,v]of statuses)rows.push({key:'r61-'+k,label:defs[k].label,icon:defs[k].icon,remaining:v.until-time,kind:'debuff'});return rows;}});
 for(const[path,hash]of Object.entries(window.__STORYWORLD_AILMENT_ASSETS_R61__||{})){imageInventory.add(path);register(path,'image','R61 generated elemental ground');portable.runtimeAssetHashes[path]=typeof hash==='string'?hash:hash.sha256;portable.assetExists[path]=true;if(!portable.assetMap.assets.some(a=>a.path===path))portable.assetMap.assets.push({path,sha256:typeof hash==='string'?hash:hash.sha256,source:'R61 generated elemental ground'});}
 function renderScope(kind,obj,fn,groundAligned=false){const paint=()=>{ctx.save();try{if(['hazard','projectile','effect'].includes(kind)){ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';}return fn();}finally{ctx.restore();}};if(typeof ctx.scope!=='function')return paint();return ctx.scope({id:'r61:'+kind+':'+String(obj?.id||obj?.token||'player'),kind,x:obj?.x??obj?.origin?.x??player?.x,y:obj?.y??obj?.origin?.y??player?.y,groundAligned,alive:kind==='enemy'||kind==='hero',lightShadowApproved:true},paint);}
 const hazardScopeBase=drawHazard;drawHazard=function(h,...args){return h?.r61Field?renderScope('hazard',h,()=>hazardScopeBase.apply(this,[h,...args]),time>=h.r61Field.impactAt):hazardScopeBase.apply(this,[h,...args]);};
 const projectileScopeBase=drawProjectile;drawProjectile=function(p,...args){return p?.r61Shot?renderScope('projectile',p,()=>projectileScopeBase.apply(this,[p,...args])):projectileScopeBase.apply(this,[p,...args]);};
 const enemyScopeBase=drawEnemy;drawEnemy=function(e,...args){return activeAction(e)?renderScope('enemy',e,()=>enemyScopeBase.apply(this,[e,...args])):enemyScopeBase.apply(this,[e,...args]);};
 const effectScopeBase=drawEffect;drawEffect=function(e,...args){return e?.type==='contactR61'?renderScope('effect',e,()=>effectScopeBase.apply(this,[e,...args])):effectScopeBase.apply(this,[e,...args]);};
 const heroScopeBase=drawHero;drawHero=function(...args){return statusValid()&&statuses.size?renderScope('hero',player,()=>heroScopeBase.apply(this,args)):heroScopeBase.apply(this,args);};
 const propBase=drawProp;drawProp=function(p,...args){if(p?.id&&(room?.enemies||[]).some(e=>{const a=activeAction(e);return a?.prop?.id===p.id&&time<a.releaseAt+.8;}))return;return propBase.apply(this,[p,...args]);};
 const enterBase=enterRegion;enterRegion=async function(id,...args){if(regionById[id])for(const path of allPaths)if(!regionById[id].paths.includes(path))regionById[id].paths.push(path);const beforeRoom=room,beforePlayer=player;let result;try{result=await enterBase.call(this,id,...args);}catch(error){if(beforeRoom!==room||beforePlayer!==player)clear('partial-region-entry');throw error;}if(result===true||beforeRoom!==room||beforePlayer!==player)clear('region-entry');return result;};
 for(const name of ['restoreSave','newGame']){const base=name==='restoreSave'?restoreSave:newGame;const fn=async function(...args){clear(name);return base.apply(this,args);};if(name==='restoreSave')restoreSave=fn;else newGame=fn;}
 const deathBase=showDeath;showDeath=function(...args){clear('death');return deathBase.apply(this,args);};
 window.__STORYWORLD_FIELDS_R61__=Object.freeze({defs,themeFor,pathFor,sourceFrame,motionReady,frameFor,clock,activeAction,beginMotion,prepare:throwAction,applyStatus,clear,statusRows:()=>statusValid()?[...statuses.values()].map(x=>({...x})):[],state,inspect:()=>({revision:'motion-owned-elemental-fields-r61',nativeHospitalPoisonUnmodified:true,nativeSweptShots:true,fieldBudget:'four admitted pulses maximum; one finite .72-owner-damage budget',activeFields:hazards.filter(h=>h.r61Field).length,activeShots:projectiles.filter(p=>p.r61Shot).length,metrics:{...metrics},events:[...events],browser:false,GPU:false})});
})();
