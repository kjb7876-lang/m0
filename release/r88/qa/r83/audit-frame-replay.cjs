'use strict';
// Exercise the shipped native visual capture AND the pinned Three command
// converter. This is CPU scene construction, not a WebGL/browser screenshot.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {createHarness}=require('../harness.cjs');
const report={schema:'r83-independent-native-frame-replay/v1',checks:[],frames:[],method:'Actual native captureVisual -> pinned Three CommandScene.render, real source image dimensions and CPU geometry/material ownership. Image crop pixels, browser, WebGL/GPU, audio and natural play are unverified.',browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
async function main(){
 const h=createHarness({timeoutMs:90000}),T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js');
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
  const selected=native.commands.filter(c=>c.owner?.r83Role),doors=native.commands.filter(c=>c.owner?.r83WardDoor);
  const row={id,hero,commands:native.commands.length,meshes:commands.rows.size,imageCommands:native.commands.filter(c=>c.kind==='image').length,outsideSource,nonfinite,projection:native.frame.projection,screenShake:native.screenShake,selectedPNGs:selected.filter(c=>c.kind==='image').map(c=>({path:c.sourcePath,source:c.sourceRect,image:c.imageSize})),doorPlanes:doors.length,operations:[...new Set(native.commands.map(c=>c.style?.globalCompositeOperation).filter(Boolean))]};report.frames.push(row);
  check('Native full frame converts without invalid geometry: '+id+'/'+hero,row.commands>0&&row.meshes>0&&row.imageCommands>0&&nonfinite===0&&outsideSource===0,row);
  if(['dist01','dist02'].includes(id))check('Full native frame includes the supplied PNG at its real source dimensions: '+id,row.selectedPNGs.length>0&&selected.filter(c=>c.kind==='image').every(c=>{const name=new URL(c.sourcePath||c.image.src,'http://127.0.0.1/').pathname.replace(/^\//,'');const size=h.context.auditImageDimensions[name];return size&&c.imageSize[0]===size[0]&&c.imageSize[1]===size[1];}),row.selectedPNGs);
 }
 report.doorPlanes=doorAudit;check('Captured regional doors remain on their physical aperture planes with body depth testing',doorAudit.length>20&&doorAudit.every(v=>v.outside===0&&v.maxPlaneError<.00001&&v.depthTest===true),{meshes:doorAudit.length,invalid:doorAudit.filter(v=>v.outside||v.maxPlaneError>=.00001||!v.depthTest)});
 const before=commands.rows.size;commands.clear();check('Cross-map command scene clears all owned meshes and textures',before>0&&commands.rows.size===0&&commands.textures.size===0&&scene.children.length===0,{before,after:scene.children.length});
 const errors=h.run('[...errors]');check('No native runtime errors were recorded during complete frame capture',errors.length===0,errors);
}
main().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(path.join(__dirname,'audit-frame-results.json'),JSON.stringify(report,null,2)+'\n');console.log('FINAL',report.passed?'PASS':'FAIL',report.checks.filter(c=>c.passed).length+'/'+report.checks.length);});
