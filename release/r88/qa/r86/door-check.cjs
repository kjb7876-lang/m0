'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),{createHarness}=require('../harness.cjs');
const report={schema:'r86-door-front-surface/v1',checks:[],browserVerified:false,GPUVerified:false,method:'Native hospital door capture and original DrawCommands replay to pinned Three; actual image alpha sample and ray/depth regression. Scripted opening is a fixture, not natural play.'};
function check(name,passed,detail){report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);}
(async()=>{
 const h=createHarness({timeoutMs:90000}),T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js'),api=h.context.__STORYWORLD_WORLD_DOORS_R83__;
 await h.boot();await h.start();h.run('for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;W=1280;H=800;dpr=1;zoom=1;');
 check('Hospital registers both three original physical doors and the packaged clinical art',api.inspect().clinicalDoorsRegistered&&h.run('room.exploration.hospitalDoorsB3.length')===3&&api.inspect().clinicalDoorPath==='assets/world-r80/r80-057.webp');
 check('Native hospital entry preloads the new door before drawing',h.run("!!readyImage('assets/world-r80/r80-057.webp')?.image"));
 const image=spawnSync('python',['-c',`from PIL import Image
import json,sys
im=Image.open(sys.argv[1]).convert('RGBA'); points=[]
# Interior source points of the registered parallelogram, excluding frame/shadow.
for u in [.1,.3,.5,.7,.9]:
 for v in [.1,.3,.5,.7,.9]:
  x=round(60+177*u);y=round(477-46*u-379*v);points.append(im.getpixel((x,y))[3])
print(json.dumps({'size':list(im.size),'alpha':points}))`,path.join(h.site,api.inspect().clinicalDoorPath)],{encoding:'utf8'});if(image.status!==0)throw Error(image.stderr);const pixels=JSON.parse(image.stdout);
 check('Real clinical door source is264x512 and every sampled leaf texel is opaque',JSON.stringify(pixels.size)==='[264,512]'&&pixels.alpha.length===25&&pixels.alpha.every(a=>a>250),pixels);
 h.run("{const i=readyImage('assets/world-r80/r80-057.webp').image;i.width=i.naturalWidth=264;i.height=i.naturalHeight=512;const w=readyImage('assets/visual-test/hospital-quiet-material-atlas-r42.png').image;w.width=w.naturalWidth=1254;w.height=w.naturalHeight=1254;}");
 const A=h.context.StoryPhase1,projection=new A.Projection(),camera=new T.OrthographicCamera(),cs=new A.CommandScene(T,{projection,camera,spatial:true}),rec=new A.DrawCommands();h.context.doorR86Rec=rec;
 const closed=h.run(`(()=>{const before=JSON.stringify({props:room.props,doors:room.exploration.hospitalDoorsB3,walls:room.exploration.walls,hp:player.hp,enemyHP:room.enemies.map(e=>e.hp)}),out=[];for(const d of room.exploration.hospitalDoorsB3){const p=room.props.find(p=>p.hospitalDoorFrameB3?.id===d.id);if(!p)throw Error('Missing native frame');cam.x=d.x;cam.y=d.y;player.x=d.x;player.y=d.y+3;const saved=ctx;ctx=doorR86Rec;doorR86Rec.reset(1);try{drawProp(p);out.push({door:{...d},commands:doorR86Rec.finish(),blocked:blocked(d.x,d.y,.2,room),projection:{width:W,height:H,zoom,camX:cam.x,camY:cam.y,tile:TILE}});}finally{ctx=saved;}}return {out,unchanged:before===JSON.stringify({props:room.props,doors:room.exploration.hospitalDoorsB3,walls:room.exploration.walls,hp:player.hp,enemyHP:room.enemies.map(e=>e.hp)})};})()`);
 check('Door rendering changes no physical doors walls props enemyHP or playerHP',closed.unchanged);
 check('All three closed hospital doors have two image leaves and their original collision',closed.out.length===3&&closed.out.every(r=>r.blocked&&r.commands.filter(c=>c.kind==='image'&&c.owner.doorId===r.door.id&&c.owner.r83DoorPart.startsWith('closed')).length===2),closed.out.map(r=>({id:r.door.id,blocked:r.blocked,commands:r.commands.length})));
 const depth=[];for(const r of closed.out){projection.configure(r.projection);projection.configureCamera(camera);cs.render(r.commands);
  const wall=new T.Mesh(new T.BoxGeometry(r.door.width,2.7,r.door.depth),new T.MeshBasicMaterial({side:T.DoubleSide}));wall.position.set(r.door.x,1.35,r.door.y);wall.updateMatrixWorld();
  const images=r.commands.filter(c=>c.kind==='image'&&c.owner.r83DoorPart.startsWith('closed'));
  for(const c of images){const row=cs.rows.get(c.key),mesh=row.mesh;mesh.updateMatrixWorld();const center=new T.Vector3();mesh.geometry.computeBoundingBox();mesh.geometry.boundingBox.getCenter(center);const direction=new T.Vector3(-Math.sqrt(3/8),-.5,-Math.sqrt(3/8)).normalize(),origin=center.clone().addScaledVector(direction,-100),ray=new T.Raycaster(origin,direction);ray.layers.enableAll();const wallDistance=ray.intersectObject(wall)[0]?.distance,artDistance=ray.intersectObject(mesh)[0]?.distance;
   const old=mesh.clone();old.geometry=mesh.geometry.clone();old.geometry.translate(0,0,-c.owner.doorFaceOffsetR86);old.updateMatrixWorld();const oldDistance=ray.intersectObject(old)[0]?.distance;
   depth.push({door:r.door.id,part:c.owner.r83DoorPart,wallDistance,oldDistance,artDistance,clearance:wallDistance-artDistance,oldOccluded:wallDistance<oldDistance,depthTest:mesh.material.depthTest,polygonOffset:mesh.material.polygonOffset,renderOrder:mesh.renderOrder});old.geometry.dispose();}
  wall.geometry.dispose();wall.material.dispose();
 }
 check('Reproducer: native opaque barrier hides the old centre-plane leaf on every hospital door',depth.length===6&&depth.every(r=>r.oldOccluded),depth);
 check('Corrected art lies visibly in front of the native barrier with positive depth clearance',depth.every(r=>Number.isFinite(r.artDistance)&&r.clearance>.01&&r.clearance<.03),depth.map(r=>({door:r.door,part:r.part,clearance:r.clearance})));
 // Direct commands are manually tagged by the full-frame classifier, below.
 const full=h.run(`(()=>{const d=room.exploration.hospitalDoorsB3[0];cam.x=d.x;cam.y=d.y;player.x=d.x;player.y=d.y+3;return __STORYWORLD_PHASE1__.captureVisual().filter(c=>c.owner.hospitalDoorR86);})()`);
 check('Actual full-frame classifier keeps hospital door art in depth-tested body pass',full.length>0&&full.every(c=>c.spatialRole==='body'&&c.owner.r83DoorPlane));
 projection.configure(h.run('__STORYWORLD_PHASE1__.capture().projection'));projection.configureCamera(camera);cs.render(full);const imageRows=full.filter(c=>c.kind==='image').map(c=>cs.rows.get(c.key)).filter(Boolean);
 check('Depth-tested door textures retain deterministic overlay and anti-z-fighting',imageRows.length>=3&&imageRows.every(r=>r.mesh.material.depthTest&&r.mesh.material.polygonOffset&&r.mesh.renderOrder===2));
 const open=h.run(`(()=>{const d=room.exploration.hospitalDoorsB3.find(d=>d.id==='door-1');player.x=d.x;player.y=d.y+2;modal=false;loading=false;storyScene=null;__STORYWORLD_WORLD_R74__.use({kind:'door',id:d.id});__STORYWORLD_EXPLORATION__.attach(room);__STORYWORLD_HOSPITAL_CORE_B2__.repair(room);const p=room.props.find(p=>p.hospitalDoorFrameB3?.id===d.id),saved=ctx;ctx=doorR86Rec;doorR86Rec.reset(1);cam.x=d.x;cam.y=d.y;try{drawProp(p);return{open:__STORYWORLD_WORLD_R74__.isOpen(room,d),blocked:blocked(d.x,d.y,.2,room),commands:doorR86Rec.finish(),doors:room.exploration.hospitalDoorsB3.length};}finally{ctx=saved;}})()`);
 check('Native hospital opening removes closed leaves and unblocks the existing aperture',open.open&&!open.blocked&&open.doors===3&&!open.commands.some(c=>c.owner.r83DoorPart?.startsWith('closed'))&&['open-left','open-right'].every(part=>open.commands.some(c=>c.kind==='image'&&c.owner.r83DoorPart===part)),{open:open.open,blocked:open.blocked,parts:[...new Set(open.commands.map(c=>c.owner.r83DoorPart))]});
 projection.configure(h.run('__STORYWORLD_PHASE1__.capture().projection'));projection.configureCamera(camera);cs.render(open.commands);
 check('Open leaves have finite Three geometry and stay outside the centre passage',Array.from(cs.rows.values()).every(r=>r.mesh.geometry.attributes.position.array.every(Number.isFinite))&&open.commands.filter(c=>c.kind==='image'&&c.owner.r83DoorPart?.startsWith('open')).every(c=>Math.abs(c.owner.r83DoorPlane.ax-29)>=2.99&&Math.abs(c.owner.r83DoorPlane.bx-29)>=2.99));
 cs.dispose();check('Door CPU regression records no native runtime error',h.run('errors.length')===0,h.run('[...errors]'));
 report.depthEvidence=depth;
})().catch(e=>{report.failure=e.stack;report.checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;fs.writeFileSync(__dirname+'/door-results.json',JSON.stringify(report,null,2)+'\n');console.log(report.checks.filter(c=>c.passed).length+'/'+report.checks.length);});
