/* R62: motion-owned boss sieges. The generated status image, telegraph and
 * admitted damage share the same immutable floor footprint. Host simulation
 * owns every pulse; a network snapshot is display-only. */
(()=>{'use strict';
 if(window.__STORYWORLD_BOSS_FIELDS_R62__)return;
 const finite=Number.isFinite,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const F=window.__STORYWORLD_FIELDS_R61__,owners=new WeakMap(),casts=new Map(),events=[];
 const limits=Object.freeze({fields:96,castFields:48,pulseInterval:.80,maximumPulseFraction:.045,minimumWarning:1.45,safeRadius:1.55});
 const metrics={prepared:0,released:0,zones:0,pulses:0,admitted:0,skippedLate:0,cancelled:0,missingArt:0,duplicateContacts:0,snapshots:0};
 const textureRows=new Map();let textureLookups=new WeakMap();
 let trackedRoom=room,serial=0,remoteSequence=-1,remoteAt=0,remoteWall=0,remotePaused=false,remoteFields=[];
 const themes=Object.freeze({
  dark:{pattern:'eclipse',label:'암흑 침식',color:'#b7aeca'},shock:{pattern:'conductor',label:'과부하 도선',color:'#b4c8d3'},
  frost:{pattern:'fracture',label:'빙결 균열',color:'#bdd1d8'},fire:{pattern:'fan',label:'잿불 확산',color:'#d2ae91'},
  charm:{pattern:'petals',label:'매혹의 화관',color:'#cbaeb9'},weakness:{pattern:'spiral',label:'기억 쇠약',color:'#b9b6c9'},
  corruption:{pattern:'cross',label:'타락 성흔',color:'#b7a8bb'},bind:{pattern:'roots',label:'속박 뿌리',color:'#aebaad'},
  harvest:{pattern:'crescent',label:'생명 수확',color:'#c7c1a6'},pollution:{pattern:'spill',label:'오염 확산',color:'#b5bea2'},
  disease:{pattern:'clusters',label:'역병 군락',color:'#c5b69d'},bleed:{pattern:'rake',label:'절개 혈흔',color:'#c7a1a0'}
 });
 const note=e=>{events.push({...e,at:time});if(events.length>180)events.shift();};
 const coop=()=>window.__STORYWORLD_COOP_SIM_R62__;
 const authoritative=()=>coop()?.authoritative?.()!==false;
 const targets=()=>{const rows=coop()?.mode?.()==='off'?[player]:coop()?.players?.()||[player];return rows.filter(p=>p&&p.hp>0&&p.connectedR62!==false&&finite(p.x)&&finite(p.y));};
 const withPlayer=(p,fn)=>coop()?.withPlayer?coop().withPlayer(p,fn):fn();
 const playerId=p=>String(p.coopIdR62||p.id||'solo');
 const major=e=>!!e&&!e.r61Summoned&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial);
 const live=e=>!!e&&room?.enemies?.includes(e)&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&!e.disabled;
 const hash=x=>[...String(x)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
 function ownerState(e){let s=owners.get(e);if(!s||s.room!==room){s={room,step:0,next:time+1.8+(hash(e.id)%11)*.07};owners.set(e,s);}return s;}
 function difficulty(e){
  const progress=window.__STORYWORLD_SCALE_MELEE_R61__?.progression?.(room)||0,health=clamp(e.hp/Math.max(1,e.maxHp)),rage=1-health;
  const ego=Math.max(1,Number(e.egoScale151)||1),hard=clamp(progress*.75+(layer==='DREAM'?.35:0)+Math.min(.35,Math.log2(ego)*.055));
  const siege=health<=.28&&hard>=.36;
  return{health,rage,progress,hard,siege,radius:siege?3.8+hard*.9:1.45+rage*.7+hard*.35,count:siege?limits.castFields:Math.min(14,2+Math.floor(rage*8+hard*4)),duration:siege?4.8:3.5+rage*.7,cooldown:clamp(6.8-rage*1.8-hard*.8,4.2,6.8),pulseFraction:Math.min(limits.maximumPulseFraction,.018+rage*.014+hard*.010),coverageGoal:siege?.70:0};
 }
 function profile(e){const key=F.themeFor(e),base=themes[key]||themes.dark,words=String(e.weapon||'')+' '+String(e.name||'');let pattern=base.pattern;
  if(/bow|gun|rifle|총|활/i.test(words)&&!['pollution','disease'].includes(key))pattern='conductor';
  if(/scythe|낫|수확/i.test(words))pattern='crescent';
  if(/blade|sword|검|도끼/i.test(words)&&['bleed','dark'].includes(key))pattern='rake';
  return{key,...base,pattern,variant:hash(e.nativeId||e.id)%3};
 }
 function floorData(){const l=room?.exploration||window.__STORYWORLD_EXPLORATION__?.layout?.(room?.id),cells=l?.floorCells||[];return cells.map(([x,y])=>({x:x+.5,y:y+.5,key:x+':'+y,ix:x,iy:y})).filter(p=>!blocked(p.x,p.y,.24,room));}
 function safePockets(e,rows,angle){const out=[];for(const p of rows){let best=null;for(const radius of [2.5,3.2,1.8]){for(let i=0;i<16;i++){const a=angle+Math.PI/2+i*Math.PI/8,q={x:p.x+Math.cos(a)*radius,y:p.y-.15+Math.sin(a)*radius};if(!blocked(q.x,q.y,.34,room)&&clearLine(p,q)){best=q;break;}}if(best)break;}if(best)out.push({...best,radius:limits.safeRadius});}return out;}
 const safeContains=(safe,x,y,r=.0)=>safe.some(p=>Math.hypot(x-p.x,y-p.y)<=p.radius+r);
 function patternPoints(p,origin,target,angle,count,radius){const rows=[],step=radius*1.6,v=p.variant;for(let i=0;i<count;i++){
  let x=target.x,y=target.y,theta=angle,dist=0;
  switch(p.pattern){
   case'conductor':theta=angle+(i%2?Math.PI/2:0);dist=(Math.floor(i/2)-1)*step;break;
   case'fracture':theta=angle+(i%3-1)*Math.PI/3;dist=Math.floor(i/3)*step;break;
   case'fan':theta=angle+(i%5-2)*.40;dist=2+Math.floor(i/5)*step;x=origin.x;y=origin.y;break;
   case'petals':theta=angle+i*2.399963;dist=i?step*(1+.25*Math.floor(i/5)):0;break;
   case'spiral':theta=angle+i*1.25;dist=Math.sqrt(i)*radius*1.1;break;
   case'cross':theta=i%2?Math.PI/2:0;dist=(Math.floor(i/2)-2)*step;break;
   case'roots':theta=angle+(i%3-1)*.72;dist=Math.floor(i/3)*step;break;
   case'crescent':theta=angle-Math.PI*.7+i*Math.PI*1.4/Math.max(1,count-1);dist=step*1.5;x=origin.x;y=origin.y;break;
   case'rake':theta=angle+Math.PI/2;dist=(i-(count-1)/2)*radius*1.15;break;
   case'clusters':theta=angle+(i%3)*Math.PI*2/3;dist=radius*(1.1+Math.floor(i/3)*1.4);break;
   case'eclipse':theta=angle+i*2*Math.PI/Math.max(1,count);dist=i?step:0;break;
   default:theta=angle+i*2.399963;dist=Math.sqrt(i)*radius*1.3;
  }
  rows.push({x:x+Math.cos(theta)*dist,y:y+Math.sin(theta)*dist,order:i,rotation:(v*.4+theta)});
 }return rows;}
 function plan(e,p=profile(e),d=difficulty(e),rows=targets()){
  if(!rows.length)return null;const target=rows.slice().sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[ownerState(e).step%rows.length],aim={x:target.x,y:target.y-.15},origin={x:e.x,y:e.y},angle=Math.atan2(aim.y-e.y,aim.x-e.x),floor=floorData();
  if(!floor.length)return null;const shared=d.siege?[...casts.values()].find(c=>c.room===room&&!c.cancelled&&c.difficulty.siege&&c.fields.some(h=>h.r62Field.endAt>time)):null,safe=d.siege?(shared?shared.safe.map(s=>({...s})):safePockets(e,rows,angle)):[],eligible=floor.filter(q=>!safeContains(safe,q.x,q.y,.25)),covered=new Set(),points=[];
  const capacity=Math.max(0,Math.min(d.count,limits.fields-hazards.filter(h=>h.r62Field&&h.age<h.life).length));if(!capacity)return null;
  const nearest=q=>eligible.reduce((best,c)=>!best||Math.hypot(c.x-q.x,c.y-q.y)<Math.hypot(best.x-q.x,best.y-q.y)?c:best,null);
  const append=q=>{if(!q||points.some(t=>Math.hypot(t.x-q.x,t.y-q.y)<d.radius*.85))return false;const cells=eligible.filter(c=>Math.hypot(c.x-q.x,c.y-q.y)<=d.radius+.5);if(!cells.length)return false;points.push({x:q.x,y:q.y,rotation:q.rotation||0,cells:cells.map(c=>[c.ix,c.iy])});for(const c of cells)if(Math.hypot(c.x-q.x,c.y-q.y)<=d.radius)covered.add(c.key);return true;};
  for(const q of patternPoints(p,origin,aim,angle,Math.min(d.siege?5:capacity,capacity),d.radius))append(nearest(q));
  if(d.siege){const candidates=eligible.filter(c=>c.ix%3===0&&c.iy%3===0).map(c=>({...c,members:eligible.filter(q=>Math.hypot(c.x-q.x,c.y-q.y)<=d.radius)}));while(points.length<capacity&&covered.size/floor.length<d.coverageGoal){let best=null,score=0;for(const c of candidates){if(points.some(t=>Math.hypot(t.x-c.x,t.y-c.y)<d.radius*.85))continue;let n=0;for(const q of c.members)if(!covered.has(q.key))n++;if(n>score){score=n;best=c;}}if(!best||score<2||!append(best))break;}}
  if(!points.length)return null;return{profile:p,difficulty:d,origin,target:aim,angle,safe,points,coverage:covered.size/floor.length,walkableCells:floor.length,targetId:playerId(target)};
 }
 const releasePaths={dark:'void-shard',corruption:'void-shard',harvest:'void-shard',shock:'storm-core',frost:'frost-crystal',fire:'ember-heart'};
 const supplementalPaths=[...new Set(Object.values(releasePaths))].map(name=>'assets/boss-vfx-r62/'+name+'.webp');
 for(const path of supplementalPaths){const hash=window.__STORYWORLD_GENERATED_ASSETS_R62__?.[path];if(!hash)continue;imageInventory.add(path);register(path,'image','R62 generated boss release');portable.runtimeAssetHashes[path]=hash;portable.assetExists[path]=true;if(!portable.assetMap.assets.some(a=>a.path===path))portable.assetMap.assets.push({path,sha256:hash,source:'R62 generated boss release'});addImage(path).promise.catch(error=>warn('보스 투척 이미지 읽기 실패: '+error.message));}
 function releaseArt(key){if(room?.id==='ep1a08'&&key==='pollution'&&typeof MEDICAL_ART20!=='undefined'&&readyImage(MEDICAL_ART20.path)?.image)return MEDICAL_ART20.path;const candidate='assets/boss-vfx-r62/'+releasePaths[key]+'.webp';return releasePaths[key]&&readyImage(candidate)?.image?candidate:F.pathFor(key);}
 function hand(e,a){const native=room?.id==='ep1a08'&&window.__STORYWORLD_HOSPITAL_MOTION_R53__?.throwHand?.({owner:e,kind:'poison',angle:a.angle,origin:a.origin});if(native)return{dx:native.dx/actorHeight(),dy:native.dy/actorHeight()};const v=window.__STORYWORLD_STORY_COMBAT_R54__.projection(a.angle),size=(Number(e.combatProfile?.spriteRect?.height)||1)*(Number(e.defScale)||1);return{dx:v.x*size*.10,dy:-size*.62};}
 function prepare(e){
  if(!authoritative()||!major(e)||!live(e)||!room.engaged||modal||loading||!targets().length)return null;
  const p=profile(e),asset=F.pathFor(p.key);if(!readyImage(asset)?.image||!F.motionReady(e)){metrics.missingArt++;return null;}
  const blueprint=plan(e,p);if(!blueprint)return null;const d=blueprint.difficulty,windup=d.siege?1.5:1.05,a=F.beginMotion(e,'siege-r62',{windup,recovery:.58,cooldown:2.0,angle:blueprint.angle});if(!a)return null;
  const id='r62-cast-'+(++serial),cast={id,owner:e,room,action:a,key:p.key,profile:p,difficulty:d,origin:{...a.origin},hand:hand(e,a),safe:blueprint.safe,start:time,released:false,cancelled:false,ledgers:new Map(),fields:[],coverage:blueprint.coverage,targetId:blueprint.targetId,asset,releaseAsset:releaseArt(p.key)};
  casts.set(id,cast);a.r62Cast=id;a.onRelease=()=>{
   if(!live(e)||a.cancelled||room!==cast.room||!readyImage(asset)?.image||!readyImage(cast.releaseAsset)?.image){cancelCast(cast,'missing-owner-or-art');return;}
   cast.released=true;metrics.released++;note({kind:'release',id,owner:e.id,zones:cast.fields.length,key:cast.key});sound(p.key==='shock'?'special':'swMetal');
  };
  for(let i=0;i<blueprint.points.length;i++){const point=blueprint.points[i],flight=clamp(Math.hypot(point.x-e.x,point.y-e.y)/12,.62,1.55)+(d.siege?Math.floor(i/8)*.10:i*.045),impactAt=Math.max(a.releaseAt+flight,a.start+limits.minimumWarning),endAt=impactAt+d.duration;
   const h={id:++uid,type:'field',owner:e.id,x:point.x,y:point.y,radius:d.radius,age:0,warning:impactAt-time,life:endAt-time,damage:0,lastHit:-99,asset,r62Tag:p.key,r62Field:{castId:id,ownerId:e.id,key:p.key,impactAt,endAt,start:time,cells:point.cells,safe:cast.safe,rotation:point.rotation,origin:cast.origin,hand:cast.hand,releaseAsset:cast.releaseAsset,releaseRect:typeof MEDICAL_ART20!=='undefined'&&cast.releaseAsset===MEDICAL_ART20.path?[...MEDICAL_ART20.frames.vial.renderRect]:null,releaseAt:a.releaseAt,released:false,remote:false}};
   cast.fields.push(h);hazards.push(h);
  }
  ownerState(e).step++;ownerState(e).next=Math.max(a.endAt+d.cooldown,Math.max(...cast.fields.map(h=>h.r62Field.endAt))+.72);metrics.prepared++;metrics.zones+=cast.fields.length;note({kind:'prepare',id,owner:e.id,key:p.key,pattern:p.pattern,health:d.health,hard:d.hard,siege:d.siege,zones:cast.fields.length,coverage:cast.coverage,next:ownerState(e).next});return a;
 }
 function cancelCast(c,reason){if(c.cancelled)return;c.cancelled=true;for(const h of c.fields)h.life=0;if(!c.released&&c.action){c.action.cancelled=true;if(c.owner.r61Action===c.action)delete c.owner.r61Action;c.owner.r61BusyUntil=0;}metrics.cancelled++;note({kind:'cancel',id:c.id,reason});}
 function clear(reason='clear'){for(const c of casts.values())cancelCast(c,reason);casts.clear();textureRows.clear();textureLookups=new WeakMap();hazards=hazards.filter(h=>!h.r62Field);remoteFields=[];remoteSequence=-1;trackedRoom=room;note({kind:'clear',reason});}
 function refresh(){if(trackedRoom!==room)clear('room-identity');for(const[id,c]of casts){if(c.room!==room||!live(c.owner)||c.action?.cancelled||!readyImage(c.asset)?.image||!readyImage(c.releaseAsset)?.image)cancelCast(c,'lifecycle');if(c.cancelled||c.fields.every(h=>time>=h.r62Field.endAt)){for(const h of c.fields)textureRows.delete(room.id+':'+h.id);casts.delete(id);}}}
 const enemiesBase=tickEnemies;tickEnemies=function(dt){if(!authoritative())return;refresh();if(!modal&&!loading&&targets().length){for(const e of room?.enemies||[]){if(!major(e)||!live(e)||!room.engaged||time<(e.graceUntil||0)||time<ownerState(e).next)continue;const near=targets().some(p=>Math.hypot(p.x-e.x,p.y-e.y)<14&&clearLine(e,p));if(near)prepare(e);}}return enemiesBase.apply(this,arguments);};
 function touches(h,p){const m=h.r62Field,x=p.x,y=p.y-.15;return m.cells.some(c=>c[0]===Math.floor(x)&&c[1]===Math.floor(y))&&!safeContains(m.safe,x,y,.12)&&!blocked(x,y,.12,room)&&Math.hypot(x-h.x,y-h.y)<=h.radius+.12;}
 function pulse(c,p,now){const id=playerId(p);let ledger=c.ledgers.get(id);if(!ledger){ledger={next:now,contacts:0};c.ledgers.set(id,ledger);}if(now+1e-7<ledger.next)return;const missed=Math.floor(Math.max(0,now-ledger.next)/limits.pulseInterval);metrics.skippedLate+=missed;ledger.next=now+limits.pulseInterval;
  const inside=c.fields.find(h=>now>=h.r62Field.impactAt&&now<h.r62Field.endAt&&touches(h,p));if(!inside)return;
  const contactId=c.id+':'+id+':'+(++ledger.contacts),source={id:contactId,owner:c.owner.id,ownerId:c.owner.id,x:inside.x,y:inside.y,lastHit:now,asset:c.asset,r62FieldContact:true,r62TargetId:id,r62Tag:c.key,r58Affliction:{key:({dark:'curse',frost:'chill',fire:'burn',charm:'weakness',corruption:'curse',harvest:'curse',pollution:'poison',disease:'poison'})[c.key]||c.key,wound:F.defs[c.key].wound,owner:c.owner.id}};
  withPlayer(p,()=>{if(!player||player.hp<=0)return;const before=player.hp,raw=Math.max(1,maxHP())*c.difficulty.pulseFraction,outcome=hurt(raw,source);metrics.pulses++;if(outcome==='hit'&&player.hp<before){metrics.admitted++;F.applyStatus(c.key,c.owner);fx('contactR61',player.x,player.y-.15,{life:.38,r61Key:c.key,r61Player:player,r61Room:room});}});
 }
 // Classify the conserved native wound budget without invoking the separate
 // legacy medical attack renderer or requiring its unrelated poison sheets.
 const woundsBase=window.__STORYWORLD_HOSPITAL_WOUNDS_R53__;if(woundsBase)window.__STORYWORLD_HOSPITAL_WOUNDS_R53__=Object.freeze({...woundsBase,admit(actual,source){const key=source?.r62Tag;if(source?.r62FieldContact&&room?.id==='ep1a08'&&['pollution','disease','shock'].includes(key)){const owner=room.enemies.find(e=>e.id===source.owner);return woundsBase.admit(actual,{...source,medical20:{owner,room,kind:key==='shock'?'shock':'poison',r62ClassificationOnly:true}});}return woundsBase.admit(actual,source);}});
 const hazardsBase=tickHazards;tickHazards=function(dt){const own=hazards.filter(h=>h.r62Field);hazards=hazards.filter(h=>!h.r62Field);let result;try{result=hazardsBase.apply(this,arguments);}finally{if(trackedRoom===room)hazards.push(...own);}if(!authoritative())return result;refresh();for(const c of casts.values()){
   for(const h of c.fields){h.age=time-c.start;h.r62Field.released=c.released;}if(!c.released||c.cancelled)continue;const first=Math.min(...c.fields.map(h=>h.r62Field.impactAt));if(time<first)continue;for(const p of targets())pulse(c,p,time);
  }hazards=hazards.filter(h=>h.age<h.life);return result;};
 function scope(h,ground,fn){const paint=()=>{ctx.save();try{ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';return fn();}finally{ctx.restore();}};return typeof ctx.scope==='function'?ctx.scope({id:'r62:field:'+h.id,kind:'hazard',x:h.x,y:h.y,groundAligned:ground,alive:false,lightShadowApproved:true},paint):paint();}
 function groundTexture(h,warning){
  const im=readyImage(h.asset)?.image;if(!im)return null;const m=h.r62Field,key=room.id+':'+h.id;let row=textureLookups.get(h);
  if(!row){const signature=JSON.stringify([h.x,h.y,h.radius,h.asset,m.cells,m.safe]);row=textureRows.get(key);if(!row||row.signature!==signature){row={signature};textureRows.set(key,row);}textureLookups.set(h,row);}
  const stage=warning?'warning':'active';if(row[stage])return row[stage];
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const paint=canvas.getContext('2d');if(!paint)return null;const r=h.radius,scale=256/(r*2);
  paint.save();try{paint.beginPath();for(const[x,y]of m.cells)paint.rect(128+(x-h.x)*scale,128+(y-h.y)*scale,scale,scale);paint.clip();paint.beginPath();paint.arc(128,128,128,0,TAU);paint.clip();paint.globalAlpha=warning?.14:1;paint.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,256,256);
   if(warning){paint.globalAlpha=.48;paint.strokeStyle=themes[m.key]?.color||'#c4b9ab';paint.lineWidth=.032*scale;paint.beginPath();paint.arc(128,128,128-.018*scale,0,TAU);paint.stroke();}
  }finally{paint.restore();}
  // Remove refuges after restoring the floor clip, so anti-aliased tile edges
  // cannot retain a faint residue when the destination-out pass overlaps them.
  paint.save();try{paint.globalAlpha=1;paint.globalCompositeOperation='destination-out';for(const safe of m.safe){paint.beginPath();paint.arc(128+(safe.x-h.x)*scale,128+(safe.y-h.y)*scale,safe.radius*scale,0,TAU);paint.fill();}}finally{paint.restore();}
  // Immutable, bounded runtime masking of the existing generated image. The
  // representative Three renderer uploads it once and builds only two triangles;
  // it does not triangulate thousands of tile/escape clips on camera movement.
  canvas.__storyworldStaticSource={path:h.asset,revision:'r62-clipped-ground',immutable:true};row[stage]=canvas;return canvas;
 }
 function groundImage(h,alpha,warning=false){
  const im=groundTexture(h,warning);if(!im)return false;const q=project(h.x,h.y),u=project(h.x+1,h.y),v=project(h.x,h.y+1),w=h.radius*2;ctx.save();try{ctx.globalAlpha*=alpha;ctx.filter='saturate(.82) brightness(.96)';ctx.transform(u.x-q.x,u.y-q.y,v.x-q.x,v.y-q.y,q.x,q.y);ctx.drawImage(im,0,0,im.width,im.height,-w/2,-w/2,w,w);}finally{ctx.restore();}drawStats.sprites++;return true;
 }
 function draw(h){const m=h.r62Field,c=casts.get(m.castId),at=m.remote?remoteAt+(remotePaused?0:Math.min(.15,Math.max(0,(performance.now()-remoteWall)/1000))):time,released=m.remote?m.released:!!c?.released;if(!readyImage(h.asset)?.image||at>=m.endAt||!m.remote&&(!c||c.cancelled))return;
  if(at<m.impactAt){scope(h,true,()=>groundImage(h,1,true));
   if(released&&at>=m.releaseAt)scope(h,false,()=>{const u=clamp((at-m.releaseAt)/(m.impactAt-m.releaseAt)),q=project(m.origin.x+(h.x-m.origin.x)*u,m.origin.y+(h.y-m.origin.y)*u),size=actorHeight()*.50,im=readyImage(m.releaseAsset)?.image;if(im){const x=q.x+actorHeight()*m.hand.dx*(1-u),y=q.y+actorHeight()*m.hand.dy*(1-u)-actorHeight()*.72*Math.sin(Math.PI*u);if(m.releaseRect){const[sx,sy,sw,sh]=m.releaseRect,w=size*.65,h=w*sh/sw;ctx.save();try{ctx.translate(x,y);ctx.rotate(u*.65);ctx.globalAlpha*=.94;ctx.drawImage(im,sx,sy,sw,sh,-w/2,-h/2,w,h);}finally{ctx.restore();}}else drawImage(m.releaseAsset,x,y,size,size,{alpha:.94,angle:u*.65,blend:'source-over'});}});
  }else if(released){const fade=Math.min(1,(m.endAt-at)/.55,(at-m.impactAt)/.14+.45);scope(h,true,()=>groundImage(h,.78*fade));}
 }
 const drawBase=drawHazard;drawHazard=function(h,...args){return h?.r62Field?draw(h):drawBase.apply(this,[h,...args]);};
 function snapshot(){return{version:1,roomId:room?.id,layer,at:time,paused:!!(modal||loading||document.hidden),fields:hazards.filter(h=>h.r62Field&&h.age<h.life).map(h=>({id:h.id,x:h.x,y:h.y,radius:h.radius,asset:h.asset,r62Field:{...h.r62Field,released:casts.get(h.r62Field.castId)?.released===true,remote:true}}))};}
 function applySnapshot(data,sequence=remoteSequence+1){if(authoritative()||!data||data.version!==1||data.roomId!==room?.id||data.layer!==layer||!finite(sequence)||sequence<=remoteSequence||!finite(data.at)||!Array.isArray(data.fields)||data.fields.length>limits.fields)return false;const rows=[];for(const h of data.fields){const m=h?.r62Field;if(!m||!Object.prototype.hasOwnProperty.call(themes,m.key)||m.releaseRect!=null&&!(typeof MEDICAL_ART20!=='undefined'&&m.releaseAsset===MEDICAL_ART20.path&&JSON.stringify(m.releaseRect)===JSON.stringify(MEDICAL_ART20.frames.vial.renderRect))||h.asset!==F.pathFor(m.key)||!(m.releaseAsset===h.asset||supplementalPaths.includes(m.releaseAsset)||typeof MEDICAL_ART20!=='undefined'&&m.releaseAsset===MEDICAL_ART20.path&&JSON.stringify(m.releaseRect)===JSON.stringify(MEDICAL_ART20.frames.vial.renderRect))||![h.x,h.y,h.radius,m.start,m.releaseAt,m.impactAt,m.endAt].every(finite)||h.radius<=0||h.radius>5||m.releaseAt<m.start||m.impactAt<m.releaseAt||m.endAt<=m.impactAt||m.endAt-m.start>15||Math.abs(h.x)>512||Math.abs(h.y)>512||!Array.isArray(m.cells)||m.cells.length>180||m.cells.some(c=>!Array.isArray(c)||c.length!==2||!c.every(n=>Number.isInteger(n)&&Math.abs(n)<=512))||!Array.isArray(m.safe)||m.safe.length>4||m.safe.some(s=>![s.x,s.y,s.radius].every(finite)||s.radius<0||s.radius>3)||!m.origin||!m.hand||![m.origin.x,m.origin.y,m.hand.dx,m.hand.dy].every(finite))return false;rows.push({...h,type:'field',damage:0,age:data.at-m.start,life:m.endAt-m.start,r62Field:{...m,remote:true}});}remoteSequence=sequence;remoteAt=data.at;remoteWall=performance.now();remotePaused=data.paused===true;remoteFields=rows;const kept=new Set(rows.map(h=>room.id+':'+h.id));for(const key of textureRows.keys())if(!kept.has(key))textureRows.delete(key);hazards=hazards.filter(h=>!h.r62Field).concat(rows);metrics.snapshots++;return true;}
 const enterBase=enterRegion;enterRegion=async function(...args){const def=regionById[args[0]];if(def)for(const path of supplementalPaths)if(!def.paths.includes(path))def.paths.push(path);const before=room;let result;try{result=await enterBase.apply(this,args);}catch(error){if(room!==before)clear('partial-region');throw error;}if(result===true||room!==before)clear('region');return result;};
 for(const key of ['restoreSave','newGame']){const base=key==='restoreSave'?restoreSave:newGame,fn=async function(...args){clear(key);return base.apply(this,args);};if(key==='restoreSave')restoreSave=fn;else newGame=fn;}
 const deathBase=showDeath;showDeath=function(...args){if(!coop()?.players?.().some(p=>p.hp>0))clear('death');return deathBase.apply(this,args);};
 window.__STORYWORLD_BOSS_FIELDS_R62__=Object.freeze({limits,themes,profile,difficulty,plan,prepare,clear,snapshot,applySnapshot,ownerState,touches,inspect:()=>({revision:'motion-owned-boss-siege-r62',metrics:{...metrics},events:[...events],casts:[...casts.values()].map(c=>({id:c.id,owner:c.owner.id,key:c.key,profile:c.profile,difficulty:c.difficulty,coverage:c.coverage,zones:c.fields.length,released:c.released,ledgers:[...c.ledgers].map(([id,v])=>({id,...v}))})),guestDisplayOnly:true,textureCacheEntries:textureRows.size,groundMaskResolution:256,damage:'native admitted fraction of each target maxHP; one pulse per cast and player every .80 seconds; no overdue catchup',browser:false,GPU:false})});
})();
