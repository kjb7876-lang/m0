'use strict';
// CPU fixtures, not browser input, screenshots or a GPU test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../..'),site=process.env.MAMMON_SITE||path.join(root,'r96/hospital-three-pc/site'),file=path.join(root,'r96/client-source/mammon-miniature-pilot.js'),source=fs.readFileSync(file,'utf8');
const assetDir=path.join(root,'r96/runtime-text/assets/mammon-v3'),index=JSON.parse(fs.readFileSync(path.join(assetDir,'index.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rows=[];
async function check(name,fn){const detail=await fn();rows.push({name,detail:detail??true});console.log('PASS '+name);}
(async()=>{
 await check('all derivative bytes, RIFF/WEBP and manifest hashes',()=>{for(const a of index.assets){const b=fs.readFileSync(path.join(assetDir,a.file));assert.equal(b.length,a.bytes);assert.equal(sha(b),a.sha256);assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(Math.max(...a.size)<=768);}const active=index.assets.filter(a=>a.status==='registered');return{prepared:index.assets.length,active:active.map(a=>a.id),activeEncodedBytes:active.reduce((v,a)=>v+a.bytes,0),activeRGBA8Base:active.reduce((v,a)=>v+a.size[0]*a.size[1]*4,0)};});
 const h=require('./native-harness.cjs').createHarness();await h.boot();await h.start();
 await check('production entry loads one registered overlay and all seven reviewed asset bytes', () => {
   const runtimeName = 'mammon-miniature-pilot.js';
   const scriptTag = '<script src="./mammon-miniature-pilot.js" data-mammon-release></script>';
   const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
   assert.equal(html.split(scriptTag).length, 2, 'expected exactly one release script tag');
   assert.equal(sha(fs.readFileSync(path.join(site, runtimeName))), sha(source));
   const assets = index.assets.filter(asset => asset.status === 'registered');
   assert.deepEqual(assets.map(asset => asset.id).sort(), ['D01','F01','O01','O02','P01','P02','W06']);
   for (const asset of assets) {
     assert.equal(sha(fs.readFileSync(path.join(site, 'assets/mammon-v3', asset.file))), asset.sha256);
   }
   assert.equal(h.run('__STORYWORLD_MAMMON_MINIATURE_PILOT__.inspect().registered'), true);
   return { assets: assets.length, entryCount: 1 };
 });
 await check('native makeRoom/placeRoom on seeds 27,77,777; door approaches, role placement, immutable data',()=>JSON.parse(h.run(`(()=>{const rows=[];for(const seed of [27,77,777]){let x=seed;Math.random=()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296);const r=makeRoom('ep1b06','STORY');__STORYWORLD_WORLD_COMBAT_R78__.placeRoom(r);const before=JSON.stringify(r),L=r.exploration,p=__STORYWORLD_MAMMON_MINIATURE_PILOT__.plan('ep1b06',L,r);if(!p.props.length||p.props.length>12||p.floors.length)throw Error('invalid count');const roles=new Set(p.props.map(p=>p.role));if(!roles.has('records')||!roles.has('security')||!roles.has('vault'))throw Error('unrepresented role '+[...roles]);for(const o of p.props){if(!L.floorCells.some(c=>c[0]===Math.floor(o.x)&&c[1]===Math.floor(o.y)))throw Error('non-floor');if(L.worldR74.doors.some(d=>Math.hypot(o.x-d.x,o.y-d.y)<Math.max(d.width||0,d.depth||0)/2+4.1))throw Error('door overlap');if(!L.nodes.find(n=>n.id===o.roomId&&n.storyMapR171!=='waypoint'))throw Error('waypoint');}if(!L.surface?.art?.r55PhysicalUV)throw Error('non-physical UV');if(before!==JSON.stringify(r))throw Error('simulation mutated');rows.push({seed,rooms:p.sourceRooms,props:p.props.map(o=>[o.roomId,o.role,o.kind]),floor:L.floorCells.length,walls:L.walls.length,doors:L.worldR74.doors.length,physicalUV:!!L.surface?.art?.r55PhysicalUV});}return JSON.stringify(rows);})()`)));
 await check('native R224 furnishing leaves a readable records desk near the first named room',()=>JSON.parse(h.run(`(()=>{let a=77;Math.random=()=>((a=Math.imul(a,1664525)+1013904223>>>0)/4294967296);const r=makeRoom('ep1b06','STORY');__STORYWORLD_WORLD_COMBAT_R78__.placeRoom(r);__STORYWORLD_CAVE_R204__.furnish(r,{seed:0x5e1b06,kind:'forge'},'ep1b06');const r224=r.props.filter(p=>p.r224Furniture);if(!r224.length)throw Error('missing R224 furnishings');const plan=__STORYWORLD_MAMMON_MINIATURE_PILOT__.plan('ep1b06',r.exploration,r),center=r.exploration.nodes.find(n=>n.name==='기록실'),desk=plan.props.find(p=>p.roomId===center.id&&p.kind==='ledger');if(!desk)throw Error('first records desk absent');const screenOffset=(desk.x-desk.y)-(center.x-center.y);if(Math.abs(screenOffset)>5)throw Error('desk too far across portrait frame '+screenOffset);return JSON.stringify({r224:r224.length,room:center.id,desk:[desk.x,desk.y],screenOffset,method:'native seeded R224; not a screenshot'});})()`)));
 const T=await import(pathToFileURL(path.join(site,'vendor/three/build/three.module.js')));
 const L={r224Rooms:[{id:5,x0:1,y0:1,x1:16,y1:13},{id:6,x0:18,y0:1,x1:32,y1:13}],nodes:[{id:5,name:'기록실'},{id:6,name:'금고 구획'}],floorCells:[],walls:[],worldR74:{doors:[]}};
 for(let y=1;y<14;y++)for(let x=1;x<33;x++)L.floorCells.push([x,y]);
 const rm={exploration:L,props:[]},frame={zone:'ep1b06',layer:'STORY',exploration:L,entities:[],hazards:[]};
 const captures=[];let parked=false,nativeCalls=0,failImage=null;
 const originals={};class Renderer{constructor(){this.T=T;this.terrainArt={r55PhysicalUV:true};this.spatialBuilt=true;this.sceneGeneration=1;this.spatialResources=new Set();this.spatialRoot=new T.Group();this.scene=new T.Scene();this.scene.add(this.spatialRoot);this.camera=new T.OrthographicCamera();this.camera.layers.enable(2);this.camera.quaternion.setFromEuler(new T.Euler(-.49,.78,0));this.wallRows=new Map();for(const k of ['stoneMaterial','wallMaterial','wallCapMaterial61','regionalTrimMaterial55']){this[k]=new T.MeshBasicMaterial({map:new T.Texture(),color:0xabcdef});originals[k]=this[k].map;}const w=new T.Mesh(new T.BoxGeometry(8,2,.8),this.wallMaterial);w.userData.originalWall={id:'raised',x:3,y:2,width:8,depth:.8,height:2,angle:0};w.layers.set(2);this.spatialRoot.add(w);this.wallRows.set('w',{mesh:w});this.renderer={render:()=>{if(parked)w.layers.mask=0;this.scene.onBeforeRender(this.renderer,this.scene,this.camera);const g=this.spatialRoot.getObjectByName('mammon-miniature-pilot');captures.push({floor:this.stoneMaterial.map,wall:w.material.map,instanceCounts:g?.children.filter(o=>o.isInstancedMesh).map(o=>o.count)});this.scene.onAfterRender(this.renderer,this.scene,this.camera);return 42;}};this.scene.onBeforeRender=()=>nativeCalls++;}
 render(){return this.renderer.render();}clearScene(){this.spatialRoot.clear();}}
 const r=new Renderer(),native=r.spatialRoot.children[0];r.sightState24={uniforms:{}};const tint=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial({blending:T.MultiplyBlending}));tint.name='r228-room-floors';tint.layers.set(2);r.spatialRoot.add(tint);class Image{set src(v){const a=index.assets.find(a=>v.endsWith('/'+a.file));if(!a)throw Error('bad runtime asset '+v);if(a.id===failImage){this.onerror();return;}[this.naturalWidth,this.naturalHeight]=a.size;this.onload();}}
 const ctx={window:null,Image,room:rm,StoryPhase1:{ThreeRenderer:Renderer,explorationBlocked:()=>false,attachSight24:h.run('StoryPhase1.attachSight24')},__STORYWORLD_PHASE1__:{controller:{state:{three:r}}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);const api=ctx.__STORYWORLD_MAMMON_MINIATURE_PILOT__,group=()=>r.spatialRoot.getObjectByName('mammon-miniature-pilot'),props=()=>group().children.filter(o=>o.userData.assetId),originalRM=JSON.stringify(rm);
 await check('native surface map only during draw; no floor overlay / original R228 retained',()=>{assert.equal(r.render(frame),42);const c=captures.at(-1);assert.notEqual(c.floor,originals.stoneMaterial);assert.notEqual(c.wall,originals.wallMaterial);assert.equal(r.stoneMaterial.map,originals.stoneMaterial);assert.equal(r.wallMaterial.map,originals.wallMaterial);assert.deepEqual(c.instanceCounts,[1,1,2]);assert.ok(!group().children.some(o=>/floor|inlay/i.test(o.name)));assert.equal(tint.parent,r.spatialRoot);assert.equal(tint.layers.mask,4);assert.equal(tint.material.blending,T.MultiplyBlending);assert.equal(JSON.stringify(rm),originalRM);});
 await check('two V3 furniture roles; camera quaternion, source pivot, contact shadow; no double tilt',()=>{assert.deepEqual(props().map(o=>o.userData.assetId).sort(),['O01','O02']);for(const o of props()){assert.ok(o.quaternion.angleTo(r.camera.quaternion)<1e-7);const a=index.assets.find(a=>a.id===o.userData.assetId),g=o.geometry;g.computeBoundingBox();const bb=g.boundingBox,px=a.pivot[0]/a.size[0],py=a.pivot[1]/a.size[1];assert.ok(Math.abs(bb.min.x+(bb.max.x-bb.min.x)*px)<1e-6);assert.ok(Math.abs(bb.max.y-(bb.max.y-bb.min.y)*py)<1e-6);}assert.equal(group().children.filter(o=>o.name.includes('contact-')).length,2);});
 await check('painted book stacks, lock hardware and foot shadows retain native sight shader; pressure eases in and out',()=>{
  const samples=[];
  for(const o of group().children.filter(o=>o.userData.assetId||o.name.includes('contact-')||o.isInstancedMesh)){
   const sh={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader,uniforms:{}};
   o.material.onBeforeCompile(sh,{});assert.ok(sh.fragmentShader.includes('sightCover24'),'native sight shader must survive');
   const furniture=o.userData.assetId==='O01'||o.userData.assetId==='O02';
   if(furniture){assert.ok(sh.fragmentShader.includes('uniform float mammonDecorFocus'));assert.ok(sh.uniforms.mammonDecorFocus);
    assert.ok(sh.fragmentShader.includes(o.userData.assetId==='O01'?'leftBook':'float brass='));}
   if(o.name.includes('contact-'))assert.ok(sh.fragmentShader.includes('gl_FragColor.a*=shade'));
   if(o.isInstancedMesh)assert.ok(sh.vertexShader.includes('instanceMatrix * sightLocalPilot'));
   samples.push({name:o.userData.assetId||o.name,vertex:sh.vertexShader,fragment:sh.fragmentShader,map:!!o.material.map,instanced:!!o.isInstancedMesh});
  }
  if(process.env.MAMMON_SHADER_PROBE_OUTPUT)fs.writeFileSync(process.env.MAMMON_SHADER_PROBE_OUTPUT,JSON.stringify({programs:samples,chunks:T.ShaderChunk}));
  const book=props().find(o=>o.userData.assetId==='O01');const fallback={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:'void main(){}',uniforms:{}};
  book.material.onBeforeCompile(fallback,{});assert.equal(api.inspect().last.paintStatus.O01,'native-fallback');assert.ok(!fallback.fragmentShader.includes('leftBook'));
  r.render({...frame,time:10,player:{x:70,y:70}});r.render({...frame,time:10.1,player:{x:70,y:70},entities:[{x:72,y:70,enemy:true,alive:true}]});
  const engaged=api.inspect().last.decorFocus;assert.ok(engaged>0&&engaged<1);const caps=group().children.find(o=>o.isInstancedMesh);assert.ok(caps.material.color.r<1);
  r.render({...frame,time:10.2,player:{x:70,y:70}});const easing=api.inspect().last.decorFocus;assert.ok(easing>0&&easing<engaged);
  assert.equal(r.wallMaterial.color.getHex(),api.palette.wall);return {programs:samples.length,engaged,easing,scope:'Three ShaderLib hook source and uniforms; no pixels'};
 });
 await check('async native R224 furnishing cannot double-place; simulation prop preserved',()=>{const p=props()[0].position.clone();const addition={id:'r224:furn:ep1b06:1',r224Furniture:true,x:p.x,y:p.z,visible:true};rm.props.push(addition);r.render(frame);assert.deepEqual(rm.props,[addition]);assert.ok(props().every(o=>Math.hypot(o.position.x-p.x,o.position.z-p.z)>=3.4));});
 await check('native fade clones/late parking hide all finishes; no stale V3 texture in clone',()=>{const clone=r.wallMaterial.clone();native.material=clone;native.userData.occlusion54={alpha:.4,materials:[clone]};r.render(frame);assert.deepEqual(captures.at(-1).instanceCounts,[0,0,0]);assert.equal(clone.map,originals.wallMaterial);native.userData.occlusion54.alpha=1;parked=true;r.render(frame);assert.deepEqual(captures.at(-1).instanceCounts,[0,0,0]);parked=false;native.layers.set(2);r.render(frame);assert.deepEqual(captures.at(-1).instanceCounts,[1,1,2]);});
 await check('crowds and area warnings protect intersecting silhouettes; remote decor stays visible',()=>{
  const [near,far]=props(),shadow=o=>group().children.find(m=>m.name==='mammon-pilot-contact-'+(o.userData.assetId==='O01'?'ledger':'lock')&&m.position.x===o.position.x&&m.position.z===o.position.z);
  const at={x:near.position.x,y:near.position.z};
  const actors=Array.from({length:8},(_,i)=>({x:80+i,y:90,alive:true}));
  for(const overrides of [{entities:[...actors,{...at,alive:true,height:120}]},{hazards:[{...at,radius:2.4,alpha:.8}]},{player:at}]){
   r.render({...frame,...overrides});assert.ok(!near.visible&&!shadow(near).visible);assert.ok(far.visible&&shadow(far).visible);
  }
  r.render({...frame,hazards:[{kind:'beam',alpha:1}]});assert.ok(props().every(o=>!o.visible&&!shadow(o).visible));
  r.render(frame);assert.ok(props().every(o=>o.visible&&shadow(o).visible));
 });
 await check('no second application / other mode; releasing restores materials and removes only owned meshes',()=>{for(const id of ['ep1b02','ep1b03','ep1b04','ep1b05','ep1b07','ep1b08'])assert.ok(!api.eligible({...frame,zone:id}));ctx.__STORYWORLD_SEVEN_SINS_ART__={inspect:()=>({on:true})};r.render(frame);assert.ok(!group());assert.equal(r.spatialResources.size,0);assert.equal(native.parent,r.spatialRoot);delete ctx.__STORYWORLD_SEVEN_SINS_ART__;assert.ok(!api.eligible({...frame,layer:'DREAM'}));r.render(frame);api.set(false);assert.equal(r.spatialResources.size,0);assert.equal(r.stoneMaterial.map,originals.stoneMaterial);assert.equal(r.wallMaterial.map,originals.wallMaterial);assert.ok(nativeCalls>0);assert.equal(api.inspect().stats.errors,0);});
 await check('expanded native wall supports: both jambs of all doors, posts and same-frame hide',()=>{
  const packed=JSON.parse(h.run(`(()=>{let a=77;Math.random=()=>((a=Math.imul(a,1664525)+1013904223>>>0)/4294967296);const room=makeRoom('ep1b06','STORY');__STORYWORLD_WORLD_COMBAT_R78__.placeRoom(room);return JSON.stringify({exploration:room.exploration,props:room.props,objective:room.objective,altar:room.altar});})()`));
  api.set(true);ctx.room=packed;r.wallRows.clear();for(const w of packed.exploration.walls.filter(w=>!w.decorative)){const o=new T.Mesh(new T.BoxGeometry(w.width,w.height,w.depth),r.wallMaterial);o.userData.originalWall={...w};o.layers.set(2);r.spatialRoot.add(o);r.wallRows.set(w.id,{mesh:o});}
  const f={...frame,exploration:packed.exploration};r.render(f);r.render(f);
  const finishes=api.inspect().last.architecture;
  assert.ok(['records','vault','security'].every(k=>finishes.roleWalls[k]>0),'all three named room roles must own visible native wall rows');
  const batches=group().children.filter(o=>o.isInstancedMesh);assert.equal(batches.length,3);
  const cap=batches[0],painted=new Set();for(let i=0;i<cap.count;i++){const t=new T.Color();cap.getColorAt(i,t);painted.add(t.getHex());}
  assert.ok([0xd2ad8f,0xd0b77f,0x90adbb].every(c=>painted.has(c)),'role finishes must reach instance colors');
  const mounted=group().children.filter(o=>o.userData.support);const jambs=mounted.filter(o=>o.userData.assetId==='D01');assert.equal(jambs.length,6);
  assert.ok(mounted.some(o=>o.userData.assetId==='P01'));assert.ok(mounted.some(o=>o.userData.assetId==='P02'));assert.ok(mounted.every(o=>o.visible));
  for(let i=0;i<jambs.length;i++){const o=jambs[i],w=r.wallRows.get(o.userData.support).mesh.userData.originalWall;const anchor=new T.Vector3(...o.userData.nativeAnchor);assert.ok(Math.abs(anchor.x-w.x)<=w.width/2+.16);assert.ok(Math.abs(anchor.z-w.y)<=w.depth/2+.16);const n=new T.Vector3(0,0,1).applyQuaternion(r.camera.quaternion),pos=o.geometry.attributes.position,axis=w.width<=w.depth?'x':'z',sign=Math.sign(n[axis]),center=axis==='x'?w.x:w.y,half=(axis==='x'?w.width:w.depth)/2;assert.ok(new T.Vector3().subVectors(o.position,anchor).cross(n).length()<1e-6,'projected jamb anchor shifted');for(let j=0;j<pos.count;j++){const at=new T.Vector3().fromBufferAttribute(pos,j).applyMatrix4(o.matrixWorld);assert.ok((at[axis]-center)*sign>=half+.002,'jamb vertex behind support');}o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(i%2?b.min.x>=-1e-7:b.max.x<=1e-7,'inner edge intrudes into the aperture');assert.ok(o.quaternion.angleTo(r.camera.quaternion)<1e-7);}
  const owner=r.wallRows.get(jambs[0].userData.support).mesh;owner.layers.mask=0;r.render(f);assert.equal(jambs[0].visible,false);owner.layers.set(2);r.render(f);assert.equal(jambs[0].visible,true);r.render({...f,hazards:[{kind:'beam'}]});assert.ok(mounted.every(o=>!o.visible));api.set(false);ctx.room=rm;return {jambs:jambs.length,posts:mounted.length-jambs.length,roleWalls:finishes.roleWalls,finishBatches:batches.length,method:'physical wall rows with real Three classes, no pixels'};
 });
 await check('V15 PC/mobile security and vault repro: rear cabinet remains while front silhouettes and warnings clear',()=>{
  const actual=JSON.parse(h.run(`(()=>{let a=77;Math.random=()=>((a=Math.imul(a,1664525)+1013904223>>>0)/4294967296);
   const r=makeRoom('ep1b06','STORY');__STORYWORLD_WORLD_COMBAT_R78__.placeRoom(r);__STORYWORLD_CAVE_R204__.furnish(r,{seed:0x5e1b06,kind:'forge'},r.id);
   const raw=__STORYWORLD_PHASE1_ART__.hero(),presented=window.StoryHeroPresentationR83?.present(raw.frame);
   return JSON.stringify({rm:{exploration:r.exploration,props:r.props,objective:r.objective,altar:r.altar},pose:(presented?.frame||raw.frame).assetFrame});
  })()`));
  const savedBlocked=ctx.StoryPhase1.explorationBlocked;
  const result=[];ctx.StoryPhase1.explorationBlocked=h.run('StoryPhase1.explorationBlocked');ctx.room=actual.rm;api.set(true);
  try{
   for(const [screenWidth,screenHeight] of [[1920,864],[390,806]])for(const [role,roomId,x,y,ox,oy] of [['security',7,29.5,90.5,26.9,88.05],['vault',6,49.5,97.5,46.4,95.05]]){
    const projection=new (h.run('StoryPhase1.Projection'))();projection.configure({width:screenWidth,height:screenHeight,camX:x,camY:y,tile:34,zoom:.8});projection.configureCamera(r.camera);
    const hero={hero:true,alive:true,x,y,height:66,frame:{assetFrame:actual.pose}},f={...frame,exploration:actual.rm.exploration,projection,entities:[hero]};
    r.render(f);
    const item=group().children.find(o=>o.userData.assetId==='O02'&&Math.hypot(o.position.x-ox,o.position.z-oy)<1e-4);
    assert.ok(item,role+' cabinet absent at V15 anchor');assert.ok(item.visible);
    const detail=()=>api.inspect().last.furniture.find(b=>b.roomId===roomId);
    assert.equal(detail().whyHidden,null);assert.equal(detail().visible,true);assert.ok(api.inspect().last.furnitureByRole[role].visible>=1);
    const poseTop=actual.pose.pivot[1]/actual.pose.visibleHeight*66/(34*Math.SQRT2)+.12;
    const oldBottom=-((ox-x)+(oy-y))*Math.SQRT1_2*.5+(411.5-489)/512*1.95;
    assert.ok(oldBottom<poseTop,'fixture must reproduce the previous crop overlap');
    const view=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(r.camera.projectionMatrix,r.camera.matrixWorldInverse));item.updateMatrixWorld(true);
    assert.ok(view.intersectsObject(item),'same camera must frame cabinet');
    result.push({viewport:[screenWidth,screenHeight],role,anchor:[ox,oy],oldBottom,poseTop,enabled:item.visible});
    r.render({...f,entities:[{...hero,x:ox-1.32,y:oy-1.32}]});assert.equal(detail().whyHidden,'actor');assert.ok(!item.visible);assert.ok(api.inspect().last.furnitureByRole[role].actor>=1);
    r.render({...f,hazards:[{x:ox,y:oy,radius:2,alpha:1}]});assert.equal(detail().whyHidden,'warning');assert.ok(!item.visible);
    actual.rm.props.push({id:'qa-moving-native-prop',x:ox,y:oy,visible:true});
    r.render(f);assert.equal(detail().whyHidden,'native-prop');assert.ok(!item.visible);actual.rm.props.pop();
    r.render(f);assert.equal(detail().visible,true);
   }
  }finally{api.set(false);ctx.room=rm;ctx.StoryPhase1.explorationBlocked=savedBlocked;}
  return {screens:result,method:'Actual seed 77 R224 props, canonical idle hero pose and native Projection; Three CPU, no pixel claim'};
 });
 await check('failed image leaves native materials alone and does not report assembled art',()=>{failImage='W06';class FailRenderer extends Renderer{render(){return this.renderer.render();}}const rf=new FailRenderer();const fresh={window:null,Image,room:rm,StoryPhase1:{ThreeRenderer:FailRenderer,explorationBlocked:()=>false}};fresh.window=fresh;vm.createContext(fresh);vm.runInContext(source,fresh);rf.render(frame);const v=fresh.__STORYWORLD_MAMMON_MINIATURE_PILOT__.inspect();assert.equal(v.last.loaded,false);assert.deepEqual([...v.last.assembledAssets],[]);assert.deepEqual([...v.last.failedAssets],['metal']);assert.equal(rf.wallMaterial.color.getHex(),0xabcdef);fresh.__STORYWORLD_MAMMON_MINIATURE_PILOT__.set(false);failImage=null;});
 await check('F01 and native tile seams share one texture; failed canvas restores the native floor',()=>{
  const nativeMap=r.stoneMaterial.map,cell={width:512,height:512},draws=[];
  nativeMap.image=cell;nativeMap.userData.r55IsolatedCell={noAtlasBleed:true};
  let canvases=0,mode='ready';
  ctx.document={createElement(tag){
   assert.equal(tag,'canvas');canvases++;
   return {getContext(){if(mode==='no-context')return null;return {globalAlpha:1,drawImage(source){
    if(mode==='throw'&&source===cell)throw Error('CPU fixture: source image not drawable');
    draws.push({source,opacity:this.globalAlpha});
   }};}};
  }};
  api.set(true);
  try{
   r.render(frame);const finish=captures.at(-1).floor;
   assert.notEqual(finish,nativeMap);assert.equal(finish.image.width,768);assert.equal(finish.image.height,768);
   assert.equal(draws.length,2);assert.equal(draws[0].source.naturalWidth,768);
   assert.equal(draws[0].opacity,1);assert.equal(draws[1].source,cell);assert.equal(draws[1].opacity,.57);
   assert.equal(r.stoneMaterial.map,nativeMap);assert.equal(nativeMap.image,cell);
   r.render(frame);assert.equal(canvases,1);assert.equal(captures.at(-1).floor,finish);
   for(const failure of ['throw','no-context']){
    mode=failure;nativeMap.needsUpdate=true;const prior=canvases;
    r.render(frame);assert.equal(captures.at(-1).floor,nativeMap);assert.equal(r.stoneMaterial.map,nativeMap);
    r.render(frame);assert.equal(canvases,prior+1,'failed source must not retry every frame');
    assert.ok(!api.inspect().last.assembledAssets.includes('F01'));
   }
   mode='ready';nativeMap.needsUpdate=true;r.render(frame);
   assert.equal(captures.at(-1).floor,finish,'source recovery reuses the owned GPU texture');
   assert.equal(r.stoneMaterial.map,nativeMap);assert.equal(nativeMap.image,cell);
   return {f01Weight:.43,nativeWeight:.57,drawFailureFallback:true,noContextFallback:true};
  }finally{api.set(false);delete ctx.document;delete nativeMap.userData.r55IsolatedCell;nativeMap.image=null;}
 });
 const out={ok:true,method:'CPU: native VM with seeded state + Three classes and simulated renderer, not screenshot/input/GPU',sourceSHA256:sha(source),checks:rows};console.log(JSON.stringify(out));if(process.env.MAMMON_QA_JSON)fs.writeFileSync(process.env.MAMMON_QA_JSON,JSON.stringify(out,null,2)+'\n');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
