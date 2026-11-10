// R95 contract migration: preserves the 13 applicable inherited map checks, replacing the pre-R89 native-focus-key assertion with 4 stronger current cutaway checks. Original baseline failure is retained separately.
'use strict';
const fs=require('fs'),{createHarness}=require('../r83/map-fixture.cjs'),checks=[];
const check=(name,passed,detail)=>{checks.push({name,passed:!!passed,detail});if(!passed)throw Error(name);};
async function currentFocusContract(T,h,C,r,frame,check){
 const api=h.context.__STORYWORLD_WORLD_RETRO_R89__,entities=frame.entities,focus=frame.hospitalFocus13,before=JSON.stringify(frame);
 C.ensureHospitalRoofsR2.call(r,frame);
 check('Dither cutaway restores the original actor/focus input references and all frame data',frame.entities===entities&&frame.hospitalFocus13===focus&&JSON.stringify(frame)===before);
 const roof=r.hospitalRoofMeshR2,roofGeometry=roof.geometry,perimeter=r.perimeterMeshR83,perimeterGeometry=perimeter.geometry;
 let immutable=true;for(let i=0;i<120;i++){
  const moving={...frame,entities:[{hero:true,x:20+i/20,y:12+i/40,alive:true}],hospitalFocus13:[{x:20+i/20,y:12+i/40,focusWidth:1.2,focusHeight:3}]},prior=JSON.stringify(moving),es=moving.entities,fs=moving.hospitalFocus13;
  C.ensureHospitalRoofsR2.call(r,moving);
  immutable=immutable&&r.hospitalRoofMeshR2===roof&&roof.geometry===roofGeometry&&r.perimeterMeshR83===perimeter&&perimeter.geometry===perimeterGeometry&&moving.entities===es&&moving.hospitalFocus13===fs&&JSON.stringify(moving)===prior;
 }
 check('120 moving-actor frames retain actual roof and perimeter geometry without mutating input',immutable);
 // Load the actual delivered overlay on a CPU Three render spy. Its real shader
 // callback and layer-2 render wrapper are exercised; this is not a GPU claim.
 const vm=require('node:vm'),path=require('node:path');
 class Probe{render(f){this.camera.layers.set(2);this.renderer.render(this.scene,this.camera);}clearScene(){this.spatialRoot.clear();}dispose(){this.clearScene();}}
 const w={StoryPhase1:{ThreeRenderer:Probe,explorationBlocked:()=>false}},context=vm.createContext({window:w,document:{querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../../hospital-three-pc/site/world-retro-r89.js'),'utf8'),context);
 const q=new Probe();q.T=T;q.scene=new T.Scene();q.camera=new T.PerspectiveCamera();q.spatialRoot=new T.Group();q.scene.add(q.spatialRoot);q.wallRows=new Map();q.floorRows=new Map();q.backdropRows=new Map();q.commands={rows:new Map()};
 q.projection={width:1280,height:720,zoom:1,worldToScreen:(x,y)=>({x:640+(x-y)*24,y:360+(x+y)*12})};
 const m=new T.MeshBasicMaterial(),wall=new T.Mesh(new T.BoxGeometry(2,2,1),m);wall.name='wall-focus-probe';q.spatialRoot.add(wall);q.wallRows.set('wall',{mesh:wall});
 const observed=[];q.renderer={domElement:{width:2560,height:1440},render(){const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'void main(){\n#include <dithering_fragment>\n}'};m.onBeforeCompile(shader);const U=shader.uniforms;observed.push({enabled:U.r89Dither?.value,count:U.r89FocusCount?.value,point:U.r89Focus?.value[0].toArray(),radius:U.r89FocusR?.value[0].toArray(),actualShader:shader.fragmentShader.includes('if(r89Dither>.5')&&shader.fragmentShader.includes('discard;')});}};
 for(const [x,y]of [[20,12],[25,15]])q.render({layer:'STORY',zone:'ep1a08',time:1,entities:[{hero:true,x,y,height:66}],props:[],commands:[],settings:{},exploration:{}});
 const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-8);
 const projected=[[20,12],[25,15]].map(([x,y])=>{const s=q.projection.worldToScreen(x,y);return{point:[s.x*2,1440-(s.y-66*.25)*2,(x+y)/2,0],radius:[66*1.8*2,66*1.4*2]};});
 check('Delivered dither shader uses current projected hero position, depth and radius on every layer-2 pass',observed.length===2&&observed.every((o,i)=>o.enabled===1&&o.count===1&&o.actualShader&&equal(o.point,projected[i].point)&&equal(o.radius,projected[i].radius))&&!equal(observed[0].point,observed[1].point)&&w.__STORYWORLD_WORLD_RETRO_R89__.inspect().stats.errors===0,{observed,expected:projected});
 api.set({dither:false});C.ensureHospitalRoofsR2.call(r,frame);const nativeReturned=r.hospitalRoofFocusR2.includes('20')&&r.hospitalRoofFocusR2.includes('12')&&frame.entities===entities&&frame.hospitalFocus13===focus;
 api.set({dither:true});C.ensureHospitalRoofsR2.call(r,frame);q.dispose();wall.geometry.dispose();m.dispose();
 check('Disabling dither restores native focus cutaway and re-enabling restores the static path',nativeReturned&&!r.hospitalRoofFocusR2.includes('20')&&frame.entities===entities&&frame.hospitalFocus13===focus&&JSON.stringify(frame)===before);
}

(async()=>{const h=createHarness({timeoutMs:60000}),T=await import('../../hospital-three-pc/site/vendor/three/build/three.module.js'),A=h.context.StoryPhase1,C=A.ThreeRenderer.prototype,api=h.context.__STORYWORLD_WORLD_PRESENTATION_R81__;
const wallTexture=new T.Texture({width:512,height:512}),brain=new T.Texture({width:1024,height:1024});let loads=0,releases=0;
const make=()=>({T,sceneGeneration:0,spatialRoot:new T.Group(),spatialResources:new Set(),visibleTerrainBounds:[-18,-18,109,133],visualWardMesh:new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial()),backdropRows:new Map(),fogRows:new Map(),floorRows:new Map(),bridgeRows:new Map(),wallRows:new Map(),idleGeometry:new Map(),glows:[],chunks:{clear(){}},commands:{clear(){}},wallMaterial:new T.MeshBasicMaterial({map:wallTexture,color:0x7d9290}),assets:{lease(path){loads++;return{promise:Promise.resolve({texture:brain}),release(){releases++;}};}}});
const ids=['ep1a08','hub',...JSON.parse(fs.readFileSync(__dirname+'/../r81/canonical-v4-baseline.json')).ids],rows=[];const layout=id=>id==='ep1a08'?A.hospitalCoreLayoutB2({walls:[],surface:{}},['door-0','door-1','door-2']):h.run(`StoryPhase1.explorationLayout(${JSON.stringify(id)},StoryWorldProfilesR74.profiles[${JSON.stringify(id)}]?.style||'forest',${id==='hub'},{seedR73:75,worldR74:1,worldR75:1,layerR81:'STORY'})`);
for(const id of ids){const L=layout(id),before=JSON.stringify(L),frame={zone:id,layer:'STORY',hero:'hwando',entities:[],exploration:L,hospitalFocus13:[]},mapped=api.roofFrame(frame),renderer=make();C.ensureHospitalRoofsR2.call(renderer,frame);await Promise.resolve();
const b=api.perimeterBounds(L),g=renderer.hospitalRoofMeshR2?.geometry;
if(!g)throw Error('Missing native roof for '+id);
const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),floor=L.floorCells,doorPoints=(L.worldR74?.doors||L.hospitalDoorsB3||[]).map(d=>[d.x,d.y]);renderer.hospitalRoofMeshR2.updateMatrixWorld();let blocked=0,sampled=0;
for(const [x,y]of floor.filter((_,i)=>i%Math.max(1,Math.floor(floor.length/80))===0)){ray.set(new T.Vector3(x+.5,20,y+.5),down);if(ray.intersectObject(renderer.hospitalRoofMeshR2).length)blocked++;sampled++;}
let doorBlocked=0;for(const[x,y]of doorPoints){ray.set(new T.Vector3(x,20,y),down);if(ray.intersectObject(renderer.hospitalRoofMeshR2).length)doorBlocked++;}
const p=g.attributes.position;let roofMinX=Infinity,roofMaxX=-Infinity,roofMinZ=Infinity,roofMaxZ=-Infinity;for(let i=0;i<p.count;i++){roofMinX=Math.min(roofMinX,p.getX(i));roofMaxX=Math.max(roofMaxX,p.getX(i));roofMinZ=Math.min(roofMinZ,p.getZ(i));roofMaxZ=Math.max(roofMaxZ,p.getZ(i));}
rows.push({id,unaltered:before===JSON.stringify(L),sharedFloor:mapped.exploration.floorCells===L.floorCells,sharedWalls:mapped.exploration.walls===L.walls,expanded:b.every((v,i)=>v===mapped.exploration.bounds[i]),roofSpan:[roofMinX,roofMinZ,roofMaxX,roofMaxZ],expected:b,blocked,sampled,doorBlocked,doors:doorPoints.length,perimeter:renderer.perimeterMeshR83.geometry.userData,sourceMatched:renderer.perimeterMaterialR83.map===renderer.hospitalRoofMaterialR2.map});C.clearScene.call(renderer);}
check('Hospital, refuge and every55ward keep authoritative layout, floor and walls untouched',rows.length===57&&rows.every(r=>r.unaltered&&r.sharedFloor&&r.sharedWalls),{maps:rows.length});
check('All native roof meshes extend precisely3tiles beyond the envelope',rows.every(r=>r.expanded&&r.roofSpan.every((v,i)=>Math.abs(v-r.expected[i])<1e-5)),rows.map(r=>({id:r.id,span:r.roofSpan})));
check('Actual Three downward rays find no cap over sampled playable tiles',rows.every(r=>r.blocked===0),{samples:rows.reduce((n,r)=>n+r.sampled,0),blocked:rows.filter(r=>r.blocked)});
check('Original door apertures stay free of horizontal roof caps',rows.every(r=>r.doorBlocked===0),{doors:rows.reduce((n,r)=>n+r.doors,0),blocked:rows.filter(r=>r.doorBlocked)});
check('Each region has one textured beveled foundation continuous with wall caps',rows.every(r=>r.sourceMatched&&r.perimeter.bevel===.18&&!r.perimeter.collisionChanged));
const L=layout('ep1a08'),frame={zone:'ep1a08',layer:'STORY',exploration:L,entities:[{hero:true,x:20,y:12,alive:true}],hospitalFocus13:[{x:20,y:12,focusWidth:1.2,focusHeight:3}]},r=make();C.ensureHospitalRoofsR2.call(r,frame);await Promise.resolve();
const perimeter=r.perimeterMeshR83,g=perimeter.geometry,p=g.attributes.position,uv=g.attributes.uv,b=api.perimeterBounds(L);let safe=true,finite=true;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);if(x>b[0]+1e-5&&x<b[2]-1e-5&&z>b[1]+1e-5&&z<b[3]-1e-5)safe=false;if(!Number.isFinite(x+p.getY(i)+z+uv.getX(i)+uv.getY(i)))finite=false;}
check('Boundary bevel/fascia remains outside play envelope with finite UVs',safe&&finite&&p.count===32&&g.index.count===48,{vertices:p.count,indices:g.index.count});
await currentFocusContract(T,h,C,r,frame,check);
let disposals=0;g.addEventListener('dispose',()=>disposals++);const count=r.spatialResources.size,old=r.perimeterMeshR83;for(let i=0;i<120;i++)C.ensureHospitalRoofsR2.call(r,frame);check('Stationary120frames reuse boundary geometry, textures and materials',r.perimeterMeshR83===old&&r.spatialResources.size===count&&disposals===0);
const newMap=new T.Texture({width:256,height:256});r.wallMaterial.map=newMap;C.ensureHospitalRoofsR2.call(r,frame);check('Boundary inherits a changed wall texture without owning or duplicating it',r.perimeterMaterialR83.map===r.hospitalRoofMaterialR2.map&&r.perimeterMaterialR83.map.image===newMap.image);
C.clearScene.call(r);check('Scene transition disposes perimeter once and clears references',disposals===1&&!r.perimeterMeshR83&&!r.perimeterMaterialR83&&r.spatialResources.size===0);
const co=api.roofFrame({...frame,layer:'DREAM'});check('DREAM rendering never receives the new presentation envelope',co.exploration===L&&!co.exploration.r83PresentationEnvelope);
await h.boot();await h.start();h.run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;W=1280;H=720;player.invincible=9999;');
const movement=h.run(`(()=>{player.x=20;player.y=36;for(let i=0;i<120;i++)cameraTick(.05);const start={x:cam.x,y:cam.y,z:zoom},out=[];for(let i=0;i<240;i++){const e=room.enemies[0];e.x=i%2?12:28;e.y=i%2?12:8;cameraTick(1/60);out.push({x:cam.x,y:cam.y,z:zoom});}return{start,range:Math.max(...out.map(p=>Math.hypot(p.x-start.x,p.y-start.y))),zoomRange:Math.max(...out.map(p=>p.z))-Math.min(...out.map(p=>p.z)),factor:__STORYWORLD_WORLD_PRESENTATION_R81__.inspect().pcZoomFactor};})()`);
check('Closer battle framing remains a fixed preference multiplier with no enemy drift',movement.range<1e-9&&movement.zoomRange<1e-9&&movement.factor===1.22,movement);
const cover=[];for(const id of ['ep1a08','hub','dist00','dist01','dist02']){const L=layout(id),positions=[L.entry,...(L.nodes||[]).map(n=>({x:n.x,y:n.y}))].filter(Boolean);for(const p of positions){const old=api.sample(L,{width:1280,height:720,tile:34,zoom:1.12,camX:p.x,camY:p.y}),next=api.sample(L,{width:1280,height:720,tile:34,zoom:1.22,camX:p.x,camY:p.y});cover.push({id,x:p.x,y:p.y,before:old.exterior,after:next.exterior,brainAfter:api.sample({...L,bounds:api.perimeterBounds(L)},{width:1280,height:720,tile:34,zoom:1.22,camX:p.x,camY:p.y}).exterior});}}
check('Closer static framing reduces mean visible exterior at canonical rooms and entries',cover.reduce((n,r)=>n+r.after,0)<cover.reduce((n,r)=>n+r.before,0),{samples:cover.length,before:cover.reduce((n,r)=>n+r.before,0)/cover.length,after:cover.reduce((n,r)=>n+r.after,0)/cover.length});
check('Masonry perimeter leaves only a narrow visible brain exterior at room anchors',cover.reduce((n,r)=>n+r.brainAfter,0)/cover.length<.045,{before:cover.reduce((n,r)=>n+r.before,0)/cover.length,after:cover.reduce((n,r)=>n+r.brainAfter,0)/cover.length,samples:cover.length});
fs.writeFileSync(__dirname+'/map-current-geometry-evidence.json',JSON.stringify({method:'Actual pinned Three CPU geometry/raycasting; no GPU screen rendering',maps:rows,coverage:cover},null,2));
})().catch(e=>{checks.push({name:'Exception',passed:false,detail:e.stack});process.exitCode=1;}).finally(()=>{fs.writeFileSync(__dirname+'/map-current-results.json',JSON.stringify({checks,passed:checks.every(c=>c.passed),browserVerified:false,GPUVerified:false},null,2));console.log(checks.filter(c=>c.passed).length+'/'+checks.length);});
