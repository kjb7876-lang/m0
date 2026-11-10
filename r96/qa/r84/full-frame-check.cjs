'use strict';
// Exercise the shipped native visual capture AND the pinned Three command
// converter. This is CPU scene construction, not a WebGL/browser screenshot.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {createHarness}=require('../harness.cjs');
const report={schema:'r84-independent-dynamic-native-frame-replay/v1',checks:[],frames:[],method:'Actual shipped R84 native-event captureVisual -> pinned Three CommandScene.render, real source image dimensions and CPU geometry/material ownership. Scripted native events, positioning and status setup; image crop pixels, browser, WebGL/GPU, audio and natural play are unverified.',browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
async function verifyDynamicBindings(h,T,A,projection,scene,dimensions){
 const samples=[],staleMedical=[],fingerprint=commands=>JSON.stringify(commands.map(c=>({kind:c.kind,points:c.points,paths:c.paths,source:c.sourceRect,alpha:c.style.globalAlpha,fill:c.style.fillStyle,stroke:c.style.strokeStyle}))),gameplay=()=>h.run(`JSON.stringify({zone,layer,player:{x:player.x,y:player.y,hp:player.hp,shield:player.shield,resonance:player.resonance,attackCD:player.attackCD,blinkCD:player.blinkCD},enemyHP:room.enemies.map(e=>[e.id,e.hp,e.x,e.y]),shots:projectiles.map(p=>[p.id,p.x,p.y,p.age,p.damage]),statuses:__STORYWORLD_FIELDS_R61__.statusRows()})`);
 const capture=(id,label)=>{
  h.run('cameraTick(0)');const before=gameplay(),data=h.run('({frame:__STORYWORLD_PHASE1__.capture(),commands:__STORYWORLD_PHASE1__.captureVisual()})'),after=gameplay();
  projection.configure(data.frame.projection);projection.configureCamera(scene.camera);scene.render(data.commands);
  const commands=data.commands.filter(c=>c.owner?.r84Id===id);let nonfinite=0;for(const row of scene.rows.values())for(const attribute of Object.values(row.mesh.geometry.attributes))for(const n of attribute.array)if(!Number.isFinite(n))nonfinite++;
  return{id,label,commands:commands.length,signature:fingerprint(commands),drawOnly:before===after,nonfinite};
 };
 const temporal=(id,label,first,second)=>{first();const a=capture(id,label);second();const b=capture(id,label),paused=capture(id,label);samples.push({id,label,commands:[a.commands,b.commands],temporal:a.signature!==b.signature,pausedStable:b.signature===paused.signature,drawOnly:a.drawOnly&&b.drawOnly&&paused.drawOnly,nonfinite:a.nonfinite+b.nonfinite+paused.nonfinite});};
 // The state setup is scripted; visual attachment must come from admitted
 // existing native casts, status records, projectiles and open portal draws.
 await h.run(`(()=>{zone='dist01';layer='STORY';room=getRoom(zone,layer);player.x=20;player.y=36;player.hp=maxHP();player.invincible=9999;player.invReason='기술 회피';auto=guide=false;settings.autoSkill=false;modal=loading=false;effects=[];hazards=[];projectiles=[];for(const e of room.enemies){e.spawnState='hidden';e.attack=null;e.cd=9999;}const foe=room.enemies.find(e=>!e.boss&&!e.midboss);foe.hp=foe.maxHp=1e9;foe.spawnState='active';foe.x=21;foe.y=36;target=foe.id;return ensureImages([...room.props.map(p=>p.path),...room.enemies.map(e=>e.path)]);})()`);dimensions();
 for(const kind of ['gold','silver']){
  h.context.auditKindR84=kind;
  const cast=h.run(`(()=>{effects=[];const api=__STORYWORLD_DANCES_R74__,s=api.state(auditKindR84);s.learned=true;s.designs=[{id:'audit-'+auditKindR84,name:'QA native cast',strokes:[[{x:-.3,y:0},{x:.3,y:0}]]}];s.equipped=[s.designs[0].id];delete player[auditKindR84==='gold'?'goldenCooldownsR74':'silverCooldownsR74'];const ok=api.cast(auditKindR84,0,{x:21,y:36},true);for(let i=0;i<3;i++)tick(.05);return{ok,effects:effects.filter(e=>e.type===(auditKindR84==='gold'?'goldenThreadR72':'threadSlashR63')).length};})()`);
  check('Actual native '+kind+' dance admits a trail before dynamic decoration',cast.ok&&cast.effects>0,cast);
  const type=kind==='gold'?'goldenThreadR72':'threadSlashR63';temporal('procedural-'+kind+'-thread','native '+kind+' dance',()=>h.run(`for(const e of effects)if(e.type===${JSON.stringify(type)})e.age=.08`),()=>h.run(`for(const e of effects)if(e.type===${JSON.stringify(type)})e.age=.24`));
  h.run('__STORYWORLD_DANCES_R74__.cancelAll();effects=[]');
 }
 const statusKeys={pollution:'poison',bleed:'bleed',shock:'shock',frost:'freeze',fire:'burn',charm:'charm',weakness:'weakness',corruption:'corruption',bind:'binding',harvest:'harvest',disease:'disease'};
 for(const [key,motif]of Object.entries(statusKeys)){
  h.context.auditStatusR84=key;
  const status=h.run(`(()=>{__STORYWORLD_FIELDS_R61__.clear('independent status fixture');const e=room.enemies.find(e=>e.spawnState==='active'&&e.hp>0),ok=__STORYWORLD_FIELDS_R61__.applyStatus(auditStatusR84,e),row=__STORYWORLD_FIELDS_R61__.statusRows().find(s=>s.key===auditStatusR84);return{ok,start:row?.start,until:row?.until};})()`);
  if(!status.ok||!Number.isFinite(status.start+status.until))throw Error('Native field status not admitted: '+key);
  const recipe=h.context.STORY_VFX_CATALOG.find(e=>e.id==='procedural-'+motif),duration=Math.min(recipe.duration,status.until-status.start);h.context.auditStatusClockR84={a:status.start+duration*.2,b:status.start+duration*.55};
  temporal('procedural-'+motif,'native active status '+key,()=>h.run('time=auditStatusClockR84.a'),()=>h.run('time=auditStatusClockR84.b'));
 }
 h.run("__STORYWORLD_FIELDS_R61__.clear('independent status complete');effects=[];hazards=[];projectiles=[];");
 await h.run(`(()=>{zone='ep1a08';room=getRoom(zone,'STORY');player.x=20;player.y=36;modal=loading=false;for(const e of room.enemies){e.spawnState='hidden';e.cd=9999;}return ensureImages([...room.props.map(p=>p.path),...room.enemies.map(e=>e.path)]);})()`);dimensions();
 for(const frame of ['scalpel','syringe']){
  h.context.auditMedicalFrameR84=frame;
  const shot=h.run(`(()=>{projectiles=[];const owner=room.enemies.find(e=>['a08-o1','a08-o2'].includes(e.nativeId))||room.enemies[0];owner.hp=Math.max(1,owner.hp);owner.spawnState='active';owner.x=18;owner.y=36;const epoch=__STORYWORLD_MEDICAL20__.inspect().epoch,p=enemyShot(owner,.2,4,8,{medical20:{kind:'tool',frame:auditMedicalFrameR84,epoch,room,owner,budget:8,phase:'flight'}});return{admitted:!!p,id:p?.id,frame:p?.medical20?.frame};})()`);
  check('Native medical projectile admission retains its '+frame+' frame',shot.admitted&&shot.frame===frame,shot);
  temporal('procedural-'+(frame==='syringe'?'poison-syringe':'scalpel'),'native medical '+frame,()=>h.run('for(const p of projectiles)p.age=.12'),()=>h.run('for(const p of projectiles)p.age=.32'));
  h.run('for(const p of projectiles)if(p.medical20)p.medical20.epoch--');const stale=h.run('__STORYWORLD_PHASE1__.captureVisual()');staleMedical.push({frame,commands:stale.filter(c=>c.owner?.r84Id==='procedural-'+(frame==='syringe'?'poison-syringe':'scalpel')).length});
 }
 await h.run(`(()=>{zone='hub';room=getRoom(zone,'STORY');modal=loading=false;effects=[];hazards=[];projectiles=[];const api=__STORYWORLD_ROUTES_R72__,row=api.visibleDirections().map(d=>api.status(d)).find(v=>v.open&&v.point);if(!row)throw Error('No native open refuge portal');player.x=row.point.x;player.y=row.point.y;return ensureImages([...room.props.map(p=>p.path)]);})()`);dimensions();
 h.context.auditPortalClockR84=h.run('time');temporal('procedural-portal','native open refuge portal',()=>h.run('time=auditPortalClockR84+.2'),()=>h.run('time=auditPortalClockR84+.8'));
 report.dynamicBindings=samples;
 check('All16 new recipes attach to native admitted cast/status/projectile/portal full frames',samples.length===16&&new Set(samples.map(s=>s.id)).size===16&&samples.every(s=>s.commands.every(n=>n>0)),samples);
 check('Every new native-bound recipe changes over time and remains deterministic while paused',samples.every(s=>s.temporal&&s.pausedStable),samples.filter(s=>!s.temporal||!s.pausedStable));
 check('Every dynamic native full-frame replay remains finite and leaves simulation values unchanged',samples.every(s=>s.drawOnly&&s.nonfinite===0),samples.filter(s=>!s.drawOnly||s.nonfinite));
 check('Cancelled medical epochs cannot create a new procedural tool silhouette',staleMedical.length===2&&staleMedical.every(s=>s.commands===0),staleMedical);
}
async function main(){
 const h=createHarness({timeoutMs:90000}),T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js');
 check('Actual delivered runtime includes the supplied dynamic80 sampler and R84 adapter',!!h.context.__STORYWORLD_DYNAMIC_VFX_R84__&&typeof h.context.__STORYWORLD_DYNAMIC_VFX_R84__.paint64==='function'&&typeof h.context.StoryVFX?.sample==='function'&&h.context.STORY_VFX_CATALOG?.length===80);
 const py=spawnSync('python3',['-c',`import json,sys
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1]);out={}
for p in root.rglob('*'):
 if p.suffix.lower() in ('.png','.webp','.jpg','.jpeg','.bmp','.gif'):
  try:
   with Image.open(p) as im:out[p.relative_to(root).as_posix()]=list(im.size)
  except Exception:pass
print(json.dumps(out))`,h.site],{encoding:'utf8',maxBuffer:8*1024*1024});
 if(py.status!==0)throw Error(py.stderr);h.context.auditImageDimensions=JSON.parse(py.stdout);
 // The supplied static PNG pool deliberately does not use imageCache. Give
 // every future Image (including its private pool) its real source dimensions
 // before its asynchronous onload callback runs.
 h.run(`(()=>{const descriptor=Object.getOwnPropertyDescriptor(Image.prototype,'src');Object.defineProperty(Image.prototype,'src',{configurable:true,get:descriptor.get,set(value){descriptor.set.call(this,value);let p;try{p=new URL(value,document.baseURI).pathname.replace(/^\\//,'');}catch(_){p=String(value).replace(/^\\.\\//,'');}const size=auditImageDimensions[p];if(size){this.naturalWidth=this.width=size[0];this.naturalHeight=this.height=size[1];}}});})()`);
 const dimensions=()=>h.run(`(()=>{let applied=0;for(const [p,r]of imageCache){const size=auditImageDimensions[p];if(size&&r.image){r.image.naturalWidth=r.image.width=size[0];r.image.naturalHeight=r.image.height=size[1];applied++;}}return applied;})()`);
 await h.boot();await h.start();h.run(`for(let i=0;i<50&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.reducedMotion=false;settings.lowFx=false;player.invincible=1e5;W=1280;H=800;dpr=1;`);
 check('Real source dimensions are available for the loaded images',dimensions()>100);
 const A=h.context.StoryPhase1,p=new A.Projection(),camera=new T.OrthographicCamera(),scene=new T.Scene(),commands=new A.CommandScene(T,{projection:p,camera,scene,spatial:true});
 const doorAudit=[],sequence=[['ep1a08','hwando',20,12],['ep1a08','seoha',20,20],['dist00','neon',20,36],['dist01','michaela',20,20],['dist02','lauren',29,90],['hando02','hunter',17,105],['cult05','slayer',5,6],['hub','gunner',15,19]];
 for(const [id,hero,x,y]of sequence){
  h.context.auditFrameInput={id,hero,x,y};
  await h.run(`(()=>{const a=auditFrameInput;zone=a.id;layer='STORY';room=getRoom(zone,layer);player.hero=a.hero;player.x=a.x;player.y=a.y;player.attackAnim=player.skillAnim=player.dashAnim=player.hurtAnim=0;player.moving=false;cam.x=a.x;cam.y=a.y;zoom=1;started=true;modal=false;loading=false;storyScene=null;effects=[];hazards=[];projectiles=[];return ensureImages([...room.props.map(v=>v.path),...room.enemies.map(v=>v.path),...Object.values(HEROES[a.hero]).filter(v=>typeof v==='string'&&v.startsWith('assets/'))]);})()`);
  dimensions();
  if(['dist01','dist02'].includes(id)){
   await h.run('__STORYWORLD_SELECTED_VFX_R83__.ready()');
   const trigger=h.run(`(()=>{effects=[];const e=room.enemies.find(e=>(e.boss||e.midboss)&&e.hp>0);if(!e)return{missingBoss:true};player.invincible=0;player.guard=false;player.shield=0;player.hp=maxHP();const before=player.hp,result=hurt(8,{owner:e.id,vx:1,vy:.2,kind:'independent admitted damage fixture'});for(const fx of effects)if(fx.type==='selectedStaticVfxR83')fx.age=.12;return{before,after:player.hp,result,selected:effects.filter(fx=>fx.type==='selectedStaticVfxR83').length};})()`);
   check('Native admitted boss damage creates supplied PNG effect: '+id,trigger.result==='hit'&&trigger.after<trigger.before&&trigger.selected>0,trigger);
  }
  // Actual controller.draw initializes the presentation owner before taking
  // its snapshot. Match that ordering after scripted scene changes.
  h.run('cameraTick(0)');
  const native=h.run(`(()=>{const frame=__STORYWORLD_PHASE1__.capture(),commands=__STORYWORLD_PHASE1__.captureVisual();return{frame,commands,projectionAfter:{zoom,camX:cam.x,camY:cam.y},shake,screenShake:{x:Math.sin(time*91)*shake,y:Math.cos(time*83)*shake*.5}};})()`);
  if(native.frame.projection.zoom!==native.projectionAfter.zoom||native.frame.projection.camX!==native.projectionAfter.camX||native.frame.projection.camY!==native.projectionAfter.camY)throw Error('Native visual capture changed the shared projection: '+id);
  p.configure(native.frame.projection);p.configureCamera(camera);
  let outsideSource=0;for(const c of native.commands)if(c.kind==='image'){const [sx,sy,sw,sh]=c.sourceRect,[iw,ih]=c.imageSize;if(sx<0||sy<0||sx+sw>iw+.01||sy+sh>ih+.01)outsideSource++;}
  commands.render(native.commands);
  let nonfinite=0;for(const row of commands.rows.values())for(const a of Object.values(row.mesh.geometry.attributes))for(const n of a.array)if(!Number.isFinite(n))nonfinite++;
  for(const live of commands.rows.values()){
   const o=live.mesh.userData.owner;if(!o?.r83WardDoor)continue;
   const plane=o.r83DoorPlane,dx=plane.bx-plane.ax,dy=plane.by-plane.ay,length2=dx*dx+dy*dy,pos=live.mesh.geometry.attributes.position;let outside=0,maxPlaneError=0,minU=Infinity,maxU=-Infinity,minHeight=Infinity,maxHeight=-Infinity;
   for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i),u=((x-plane.ax)*dx+(z-plane.ay)*dy)/length2,error=Math.abs((x-plane.ax)*dy-(z-plane.ay)*dx)/Math.sqrt(length2);maxPlaneError=Math.max(maxPlaneError,error);minU=Math.min(minU,u);maxU=Math.max(maxU,u);minHeight=Math.min(minHeight,y);maxHeight=Math.max(maxHeight,y);if(u<-.00001||u>1.00001||y<-.00001||y>2.70001)outside++;}
   doorAudit.push({region:id,door:o.doorId,part:o.r83DoorPart,vertices:pos.count,outside,maxPlaneError,minU,maxU,minHeight,maxHeight,depthTest:live.mesh.material.depthTest});
  }
  const selected=native.commands.filter(c=>c.owner?.r83Role),doors=native.commands.filter(c=>c.owner?.r83WardDoor),accents=native.commands.filter(c=>c.owner?.r84Role==='64-accent');
  const row={id,hero,commands:native.commands.length,meshes:commands.rows.size,imageCommands:native.commands.filter(c=>c.kind==='image').length,outsideSource,nonfinite,projection:native.frame.projection,screenShake:native.screenShake,selectedPNGs:selected.filter(c=>c.kind==='image').map(c=>({path:c.sourcePath,source:c.sourceRect,image:c.imageSize})),dynamic64:accents.map(c=>({id:c.owner.r84Id,progress:c.owner.r84Progress,kind:c.kind})),doorPlanes:doors.length,operations:[...new Set(native.commands.map(c=>c.style?.globalCompositeOperation).filter(Boolean))]};report.frames.push(row);
  check('Native full frame converts without invalid geometry: '+id+'/'+hero,row.commands>0&&row.meshes>0&&row.imageCommands>0&&nonfinite===0&&outsideSource===0,row);
  if(['dist01','dist02'].includes(id)){
   check('Full native frame includes the supplied PNG at its real source dimensions: '+id,row.selectedPNGs.length>0&&selected.filter(c=>c.kind==='image').every(c=>{const name=new URL(c.sourcePath||c.image.src,'http://127.0.0.1/').pathname.replace(/^\//,'');const size=h.context.auditImageDimensions[name];return size&&c.imageSize[0]===size[0]&&c.imageSize[1]===size[1];}),row.selectedPNGs);
   const signature=cmds=>JSON.stringify(cmds.filter(c=>c.owner?.r84Role==='64-accent').map(c=>({id:c.owner.r84Id,points:c.points,paths:c.paths,alpha:c.style.globalAlpha}))),first=signature(native.commands);
   h.run("for(const e of effects)if(e.type==='selectedStaticVfxR83')e.age=.22");
   const next=h.run('__STORYWORLD_PHASE1__.captureVisual()'),paused=h.run('__STORYWORLD_PHASE1__.captureVisual()');commands.render(next);let invalid=0;for(const row of commands.rows.values())for(const a of Object.values(row.mesh.geometry.attributes))if(!a.array.every(Number.isFinite))invalid++;
   check('Actual native64 PNG uses changing timeline accents and freezes with the simulation: '+id,accents.length>0&&next.some(c=>c.owner?.r84Role==='64-accent')&&first!==signature(next)&&signature(next)===signature(paused)&&invalid===0,{firstAccents:accents.length,nextAccents:next.filter(c=>c.owner?.r84Role==='64-accent').length,invalid});
  }
 }
 report.doorPlanes=doorAudit;check('Captured regional doors remain on their physical aperture planes with body depth testing',doorAudit.length>20&&doorAudit.every(v=>v.outside===0&&v.maxPlaneError<.00001&&v.depthTest===true),{meshes:doorAudit.length,invalid:doorAudit.filter(v=>v.outside||v.maxPlaneError>=.00001||!v.depthTest)});
 await verifyDynamicBindings(h,T,A,p,commands,dimensions);
 const before=commands.rows.size;commands.clear();check('Cross-map command scene clears all owned meshes and textures',before>0&&commands.rows.size===0&&commands.textures.size===0&&scene.children.length===0,{before,after:scene.children.length});
 const errors=h.run('[...errors]');check('No native runtime errors were recorded during complete frame capture',errors.length===0,errors);
}
main().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,'full-frame-results.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed?'PASS':'FAIL',report.checks.filter(c=>c.passed).length+'/'+report.checks.length);});
