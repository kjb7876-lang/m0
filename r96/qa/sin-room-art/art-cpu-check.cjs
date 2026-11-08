'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const file='r96/client-source/sin-room-art.js',s={window:null,console,setInterval:()=>0,localStorage:{getItem:()=>null}};s.window=s;vm.createContext(s);
vm.runInContext(read('r96/client-source/story-maps-r171.js'),s);vm.runInContext(read('r96/client-source/mammon-bossroom.js'),s);vm.runInContext(read(file),s);
const A=s.__STORYWORLD_SIN_ROOM_ART__,M=s.__STORYWORLD_STORY_MAPS_R171__;
const topologies={ep1b02:'compressed-rooms',ep1b03:'mirror-corridors',ep1b04:'counter-maze',ep1b05:'spotlight-runways',ep1b06:'vault-spokes',ep1b07:'burning-stairwell'};
assert(A,'dedicated art API available');assert.deepEqual(Object.keys(A.themes).sort(),Object.keys(topologies).sort());
const bounds=w=>w.analyticBounds12||[w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2],collisionCache=new WeakMap();
function blocked(L,x,y,r=.29){let c=collisionCache.get(L);if(!c){c={cells:new Set(L.floorCells.map(c=>c.join(':'))),bounds:L.walls.map(bounds)};collisionCache.set(L,c);}return !c.cells.has(Math.floor(x)+':'+Math.floor(y))||c.bounds.some(b=>x+r>b[0]&&x-r<b[2]&&y+r>b[1]&&y-r<b[3]);}
function reachable(L,open){const key=(x,y)=>x+':'+y,cells=new Set(L.floorCells.filter(([x,y])=>!blocked(L,x+.5,y+.5)).map(c=>c.join(':'))),doors=L.worldR74.doors.filter(d=>!open.includes(d.id)),start=key(Math.floor(L.entry.x),Math.floor(L.entry.y)),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const[x,y]=queue[i].split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!cells.has(k)||seen.has(k)||doors.some(d=>d.axis==='y'&&x===nx&&Math.max(y,ny)===d.y&&x+.5>d.x-d.width/2&&x+.5<d.x+d.width/2))continue;seen.add(k);queue.push(k);}}return p=>seen.has(key(Math.floor(p.x),Math.floor(p.y)));}
const layouts={};
for(const[id,sourceTopology]of Object.entries(topologies)){
 const native=M.build(id,null,{sourceTopology}),source=id==='ep1b06'?s.__STORYWORLD_MAMMON_BOSSROOM__.layout(id,native):native,snapshot=JSON.stringify(source),L=A.layout(id,source);layouts[id]=L;
 assert.notEqual(L,source,id+' layout copied');assert.equal(JSON.stringify(source),snapshot,id+' native source unchanged');
 assert.equal(A.layout(id,source),L,id+' cache');assert.equal(A.layout(id,L),L,id+' idempotence');
 for(const key of ['floorCells','floorRects','worldR74','worldR78','worldWardR81'])assert.equal(L[key],source[key],id+' native '+key+' retained');
 assert(source.walls.every(w=>L.walls.includes(w)),id+' all native walls retained');
 const solids=L.walls.filter(w=>w.sinArtFurniture);assert.equal(solids.length,A.themes[id].props.filter(p=>!p.existingCollision).length,id+' one new collision per new prop');
 for(const p of A.themes[id].props){const w=p.existingCollision?L.walls.find(w=>w.id==='mammon:'+p.key):solids.find(w=>w.id==='sin-art:'+id+':'+p.key);assert(w,id+' owned or existing collision '+p.key);assert((w.sinFurniture||w.mammonFurniture)&&!w.decorative);assert.equal(w.height,.01);if(!p.existingCollision)assert.equal(w.r98BaseHeight,.01);assert(blocked(L,p.x,p.y),id+' solid '+p.key);assert(p.x-p.width/2>=6&&p.x+p.width/2<=26&&p.y-p.depth/2>=6&&p.y+p.depth/2<=20,id+' interior footprint');for(const d of L.worldR74.doors)assert(Math.hypot(p.x-d.x,p.y-d.y)>d.width/2+1,id+' door clearance '+p.key);}
 assert(!blocked(L,16,13,.5),id+' central combat space');for(const p of L.worldWardR81.bossPoints)assert(!blocked(L,p.x,p.y,.5),id+' boss anchor free');
 assert(!reachable(L,[])(L.worldWardR81.bossAnchor),id+' closed boss door blocks');assert(reachable(L,['door-0'])(L.worldWardR81.bossAnchor),id+' open boss route');assert(!reachable(L,['door-0'])(L.worldWardR81.portalNext),id+' closed onward door blocks');assert(reachable(L,['door-0','door-2'])(L.worldWardR81.portalNext),id+' open onward route');
 for(const k of ['samongR103','samongR115']){const fixture={...source,[k]:true};assert.equal(A.layout(id,fixture),fixture,id+' excludes '+k);}
 const nonStory={...source,storyMapR171:null};assert.equal(A.layout(id,nonStory),nonStory,id+' story scope');s.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};assert.equal(A.layout(id,source),source,id+' co-op scope');delete s.__STORYWORLD_COOP_SIM_R62__;
 console.log('PASS',id,'native metadata/walls, scope/cache, solid furniture, boss anchors and closed/open door routes');
}
for(const id of ['ep1b06b','ep1b08','ep1b01']){const L={storyMapR171:true};assert.equal(A.layout(id,L),L,id+' other room untouched');}
assert.equal(read(file),read('r96/runtime-text/sin-room-art.js'),'runtime synchronized');

// Exercise native prop population and source-rectangle recording independently.
const draws=[],scopes=[],requested=[],registrations=[],image={width:1312,height:1199},stack=[];let loads=true,baseDraws=0;
const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},translate(){},scale(){},drawImage(...args){draws.push({args,alpha:this.globalAlpha});},scope(meta,paint){scopes.push(meta);paint();}};
const rs={window:null,console,setInterval:()=>0,ctx,zoom:1,room:null,player:{x:-99,y:-99},project:(x,y)=>({x:x*34,y:y*17}),addImage:p=>requested.push(p),readyImage:()=>loads?{image,crop:{x:900,y:900,w:1,h:1}}:null,drawProp(){baseDraws++;},drawObjective(){},__STORYWORLD_PERF_GROUPS_R266__:{registerPropRenderer:f=>registrations.push(f)}};rs.window=rs;vm.createContext(rs);vm.runInContext(read(file),rs);const B=rs.__STORYWORLD_SIN_ROOM_ART__;
assert.equal(registrations.length,1,'registers one native prop renderer');
for(const[id,L]of Object.entries(layouts)){
 const protectedProps=[{id:'native-door',x:16,y:19,r74Door:true},{id:'loot',x:13,y:7,chest:true},{id:'native-note',x:13,y:7,interactive:true},{id:'boss-marker',x:13,y:7,name:'boss'}],r={id,layer:'STORY',exploration:L,props:[...protectedProps]};rs.room=r;B.apply(r);
 assert(protectedProps.every(p=>r.props.includes(p)),id+' native prop identities kept');assert.equal(r.props.filter(p=>p.sinArt).length,B.themes[id].props.length,id+' four themed props');const first=r.props;B.apply(r);assert.equal(r.props,first,id+' stable prop array when applied');
 const own=r.props.filter(p=>p.sinArt);assert.equal(new Set(own.map(p=>p.id)).size,own.length,id+' unique IDs');
 for(const p of own){const c=B.ATLAS[B.themes[id].atlas].cells[p.sinArtKey];draws.length=0;scopes.length=0;assert(registrations[0](p),id+' renderer owns '+p.id);assert.equal(draws.length,1,id+' one image command');assert.equal(draws[0].args.length,9,id+' source-rect draw');assert.deepEqual(draws[0].args.slice(1,5),Array.from(c.sourceRect),id+' exact cell, ignoring global image crop');assert.equal(scopes[0].id,'prop:'+p.id);assert.equal(scopes[0].kind,'prop');assert.equal(scopes[0].bodyPath,p.path);assert(!B.covered(p,id),'authored prop never hides itself');}
 const q=B.themes[id].props[0],clutter={x:q.x,y:q.y,decorative:true};assert(B.covered(clutter,id),id+' only footprint clutter hidden');assert(!B.covered({x:16,y:13,decorative:true},id),id+' central native dressing not indiscriminately hidden');
 for(const protection of[{name:'important'},{interactive:true},{solid:true},{chest:true},{altar:true},{r74Door:true},{r81WardDoor:true},{r75NPC:true},{r75NarrativeNPC:true},{terrainWall:true},{id:'memory-7'},{kind:'portal'}])assert(!B.covered({...clutter,...protection},id),id+' native interaction protected');
 // A reconstructed native props array gets exactly one authored set.
 r.props=[...r.props];B.apply(r);assert.equal(r.props.filter(p=>p.sinArt).length,own.length,id+' clone refresh without duplicates');
 r.props=r.props.filter(p=>!p.sinArt);B.apply(r);assert.equal(r.props.filter(p=>p.sinArt).length,own.length,id+' rebuild after native load');
 const p=r.props.find(p=>p.sinArt);rs.player={x:p.x,y:p.y-1};draws.length=0;B.drawOwn(p);assert.equal(draws[0].alpha,.36,id+' player behind furniture stays visible');assert.equal(ctx.globalAlpha,1,id+' painter restores alpha');rs.player={x:-99,y:-99};
 rs.__STORYWORLD_SIGHT24__={enabled:true,pointVisible:()=>false};draws.length=0;B.drawOwn(p);assert.equal(draws.length,0,id+' fog hides unseen furniture');delete rs.__STORYWORLD_SIGHT24__;
 loads=false;draws.length=0;const requestCount=requested.length;B.drawOwn(p);assert.equal(draws.length,0,id+' unloaded images not painted');assert.equal(requested.length,requestCount+1,id+' missing image requested');loads=true;
 for(const marker of [{layer:'DREAM'},{samongR103:true},{samongR115:true}]){const excluded={...r,...marker,props:[...protectedProps]};B.apply(excluded);assert.equal(excluded.props.length,protectedProps.length,id+' room eligibility guard');}
 r.layer='DREAM';B.apply(r);assert.equal(r.props.filter(p=>p.sinArt).length,0,id+' leaving STORY removes only owned props');assert(protectedProps.every(p=>r.props.includes(p)),id+' native props survive cleanup');
}
assert.equal(B.inspect().stats.errors,0,'native prop fixture has no swallowed errors');
console.log('PASS native prop ownership, rebuild/idempotence, source rects, fog, occlusion alpha, load retry and scope cleanup');

// Collision-only walls remain real obstacles while their floor-height native
// meshes are hidden. Exercise native streaming order, not just the public hook.
class TerrainRenderer{
 constructor(){this.wallRows=new Map();this.sceneGeneration=1;this.nativeRenders=0;this.render=this.render.bind(this);}
 activateTerrain(row){for(const w of row.descriptor.terrain||[])if(!this.wallRows.has(w.id))this.wallRows.set(w.id,{mesh:{name:w.id,layers:{mask:w.fixtureMask||4},visible:true,userData:{originalWall:{...w},collisionBounds:[w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2]}},refs:new Set([row.key])});return 'activated';}
 render(frame){this.nativeRenders++;if(frame.admit)this.activateTerrain(frame.admit);this.nativeObserved=[...this.wallRows.values()].map(e=>({id:e.mesh.name,mask:e.mesh.layers.mask}));this.nativeCommands=(frame.commands||[]).map(c=>({sourceRect:c.sourceRect?.slice(),points:c.points?.map(p=>p.slice())}));return 'rendered';}
 clearScene(){this.wallRows.clear();this.sceneGeneration++;return 'cleared';}
}
const renderer=new TerrainRenderer(),intervals=[],ts={window:null,console,StoryPhase1:{ThreeRenderer:TerrainRenderer},__STORYWORLD_PHASE1__:{controller:{state:{three:renderer}}},setInterval:f=>{intervals.push(f);return intervals.length;}};ts.window=ts;vm.createContext(ts);vm.runInContext(read(file),ts);const H=ts.__STORYWORLD_SIN_ROOM_ART__;
assert.equal(typeof H.hideOwnedWalls,'function');assert.equal(typeof H.restoreOwnedWalls,'function');
const ownedWall={id:'sin-art:ep1b02:sofa',x:13,y:7,width:4,depth:1.8,height:.01,r98BaseHeight:.01,sinArtFurniture:true,sinFurniture:true,fixtureMask:8},mammonWall={id:'mammon:safe',x:22,y:7,width:2.4,depth:1.8,height:.01,mammonFurniture:true,fixtureMask:16},ordinaryWall={id:'sin-art-looking-native-wall',x:6,y:12,width:.2,depth:4,height:2,fixtureMask:4};
const nativeRecords=JSON.stringify([ownedWall,mammonWall,ordinaryWall]);renderer.activateTerrain({key:'existing',descriptor:{terrain:[ownedWall,ordinaryWall]}});
const ownedMesh=renderer.wallRows.get(ownedWall.id).mesh,ordinaryMesh=renderer.wallRows.get(ordinaryWall.id).mesh,ownedBounds=JSON.stringify(ownedMesh.userData.collisionBounds),ownedOriginal=JSON.stringify(ownedMesh.userData.originalWall);
const artFrame={zone:'ep1b02',layer:'STORY',exploration:layouts.ep1b02};
assert.equal(renderer.render(artFrame),'rendered','native render return value retained');assert.equal(ownedMesh.layers.mask,0,'existing collision mesh hidden before native rendering');assert.equal(ordinaryMesh.layers.mask,4,'ordinary wall remains on its original layers');assert.equal(ownedMesh.visible,true,'native visible flag untouched');
assert.equal(renderer.nativeObserved.find(e=>e.id===ownedWall.id).mask,0,'native draw sees hidden pad');assert.equal(JSON.stringify(ownedMesh.userData.originalWall),ownedOriginal,'native wall collision record unchanged');assert.equal(JSON.stringify(ownedMesh.userData.collisionBounds),ownedBounds,'native collision bounds unchanged');
const newWall={...ownedWall,id:'sin-art:ep1b02:fridge',fixtureMask:32};assert.equal(renderer.activateTerrain({key:'streamed',descriptor:{terrain:[newWall]}}),'activated','native terrain activation return value retained');const newMesh=renderer.wallRows.get(newWall.id).mesh;assert.equal(newMesh.layers.mask,0,'new streamed chunk pad hidden immediately');
renderer.render({...artFrame,zone:'ep1b06',exploration:layouts.ep1b06,admit:{key:'inside-render',descriptor:{terrain:[mammonWall]}}});const mammonMesh=renderer.wallRows.get(mammonWall.id).mesh;assert.equal(mammonMesh.layers.mask,0,'Mammon-owned pad admitted during render is hidden');assert.equal(renderer.nativeObserved.find(e=>e.id===mammonWall.id).mask,0,'new chunk hidden before native draw');
assert.equal(JSON.stringify([ownedWall,mammonWall,ordinaryWall]),nativeRecords,'all input wall records preserved');
renderer.render({...artFrame,layer:'DREAM'});assert.equal(ownedMesh.layers.mask,8,'scope exit restores exact prior mask');assert.equal(newMesh.layers.mask,32,'streamed mesh mask restored');assert.equal(mammonMesh.layers.mask,16,'Mammon exact mask restored');assert.equal(ordinaryMesh.layers.mask,4);
renderer.render(artFrame);ts.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};renderer.render(artFrame);assert.equal(ownedMesh.layers.mask,8,'co-op restores scope');delete ts.__STORYWORLD_COOP_SIM_R62__;
renderer.render(artFrame);renderer.render({zone:'ep1b08',layer:'STORY',exploration:layouts.ep1b08||{sinRoomArt:H.revision}});assert.equal(ownedMesh.layers.mask,8,'unowned Pride restores scope');
renderer.render(artFrame);renderer.wallRows.delete(newWall.id);renderer.render(artFrame);assert.equal(newMesh.layers.mask,32,'evicted mesh releases saved mask');assert.equal(ownedMesh.layers.mask,0,'remaining owned mesh stays hidden');
const oldRows=renderer.wallRows;renderer.wallRows=new Map();renderer.sceneGeneration++;renderer.render(artFrame);assert.equal(ownedMesh.layers.mask,8,'old native generation restored');assert.equal(mammonMesh.layers.mask,16,'old generation Mammon mask restored');assert(oldRows.has(ordinaryWall.id),'overlay does not delete native wall records');
renderer.activateTerrain({key:'new-generation',descriptor:{terrain:[newWall,ordinaryWall]}});const generationMesh=renderer.wallRows.get(newWall.id).mesh;assert.equal(generationMesh.layers.mask,0,'new scene generation pad hidden');H.restoreOwnedWalls(renderer);assert.equal(generationMesh.layers.mask,32,'explicit restore exact mask');H.restoreOwnedWalls(renderer);assert.equal(generationMesh.layers.mask,32,'restore idempotent');
renderer.render(artFrame);assert.equal(generationMesh.layers.mask,0);assert.equal(renderer.clearScene(),'cleared','native clearScene return retained');assert.equal(generationMesh.layers.mask,32,'clearScene restores previous masks before native disposal');assert.equal(renderer.wallRows.size,0,'native scene clearing retained');
assert.equal(H.inspect().stats.errors,0,'terrain hook fixture has no swallowed errors');console.log('PASS native pad masks, ordinary walls/collision preservation, streamed chunks, copied render, scope/eviction/generation restoration');

// Real assets, not mocked placeholders: different PNG per theme and usable alpha.
const paths=Object.values(A.ATLAS).map(a=>a.path);assert.equal(new Set(paths).size,Object.keys(A.themes).length,'no atlas reused across themes');
const assetHashes=new Set(),assetResults=[],manifest=JSON.parse(read('r96/runtime-text/assets/sin-rooms/index.json'));assert.equal(manifest.expected_count,Object.keys(A.ATLAS).length);assert.equal(manifest.assets.length,manifest.expected_count);
for(const[theme,a]of Object.entries(A.ATLAS)){
 const abs=path.join(root,'r96/runtime-text',a.path),data=fs.readFileSync(abs),hash=crypto.createHash('sha256').update(data).digest('hex');assert(!assetHashes.has(hash),theme+' unique bytes');assetHashes.add(hash);const entry=manifest.assets.find(e=>e.theme===theme);assert(entry,theme+' provenance present');assert.equal(entry.path,a.path);assert.equal(entry.bytes,data.length);assert.equal(entry.sha256,hash,theme+' source hash');assert(entry.origin&&entry.license&&entry.applied,theme+' provenance/use recorded');assert.deepEqual(JSON.parse(JSON.stringify(a.cells)),entry.cells,theme+' runtime cells match source manifest');
 const measured=JSON.parse(execFileSync('python3',['-c',"from PIL import Image;import sys,json;im=Image.open(sys.argv[1]);a=im.getchannel('A');print(json.dumps({'size':im.size,'mode':im.mode,'alpha':a.getextrema(),'corner':a.getpixel((0,0))}))",abs],{encoding:'utf8'}));assert.equal(measured.mode,'RGBA');assert.deepEqual(measured.size,[entry.format.width,entry.format.height],theme+' source dimensions');assert.equal(measured.alpha[0],0,theme+' transparent background');assert(measured.alpha[1]>=250,theme+' opaque furniture');assert(measured.corner<=2,theme+' effectively transparent corner (2/255 antialias tolerance)');
 for(const[key,c]of Object.entries(a.cells)){const[x,y,w,h]=c.sourceRect;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=measured.size[0]&&y+h<=measured.size[1],theme+' crop in PNG '+key);assert(c.pivot[0]>=0&&c.pivot[0]<=w&&c.pivot[1]>=0&&c.pivot[1]<=h,theme+' pivot in sprite '+key);assert(c.visibleHeight>0&&c.visibleHeight<=h);}
 assetResults.push({theme,path:a.path,sha256:hash,...measured});
}
fs.writeFileSync(path.join(__dirname,'asset-results.json'),JSON.stringify(assetResults,null,2)+'\n');console.log('PASS unique real PNG assets, transparent backgrounds, cell bounds and pivots');

// Real native DrawCommands + installed grounding/sinking scope wrappers. The
// opaque alpha fixture makes native bottom detection deterministic; no scope,
// drawImage, source-rect correction or wall relocation code is mocked here.
const alphaCanvas=()=>({width:64,height:64,getContext:()=>({clearRect(){},drawImage(){},getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4);data.fill(255);return{data};}})});
const ns={window:null,console,document:{createElement:alphaCanvas},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0,setTimeout:()=>0,started:true,settings:{lowFx:false},time:0,zoom:1,player:{x:16,y:13,hp:777},room:null,tick(){},draw(){},drawEnemy(){},drawProp(){},drawObjective(){},addImage(){},project:(x,y)=>({x:640+(x-y)*34,y:180+(x+y)*17})};ns.window=ns;ns.blocked=(x,y,r)=>blocked(ns.room.exploration,x,y,r);ns.readyImage=p=>({image:{src:p,width:1312,height:1199,naturalWidth:1312,naturalHeight:1199}});vm.createContext(ns);
for(const p of ['r96/runtime-text/dist/phase1.js','r96/client-source/play-r113.js','r96/client-source/play-r115.js',file])vm.runInContext(read(p),ns,{filename:p});
const N=ns.__STORYWORLD_SIN_ROOM_ART__,DC=ns.StoryPhase1.DrawCommands;assert(DC.prototype.__r113,'real native grounding scope installed');assert(ns.__STORYWORLD_PLAY_R115__.prefs().sink,'native sinking enabled');assert.equal(typeof N.restoreAuthoredCommands,'function');
const nativeProjection=new ns.StoryPhase1.Projection().configure({width:1280,height:720,zoom:1,camX:0,camY:0,tile:34});ns.project=(x,y)=>nativeProjection.worldToScreen(x,y);
const closePoints=(got,want,label)=>{assert.equal(got.length,want.length,label);for(let i=0;i<want.length;i++)for(let j=0;j<2;j++)assert(Math.abs(got[i][j]-want[i][j])<1e-8,label+' '+i+','+j+' got '+got[i][j]+' expected '+want[i][j]);};
let nestedMutations=0,checkedNativeCells=0;
for(const[id,L]of Object.entries(layouts)){
 const r={id,layer:'STORY',exploration:L,props:[],enemies:[]};ns.room=r;N.apply(r);
 for(const p of r.props.filter(p=>p.sinArt)){
  const c=N.ATLAS[N.themes[id].atlas].cells[p.sinArtKey],rec=new DC({makeCanvas:alphaCanvas});ns.ctx=rec;ns.draw();
  const q=ns.project(p.x,p.y),scale=p.height/c.visibleHeight,flip=p.sinArtFlip?-1:1,left=-c.pivot[0]*scale,top=-c.pivot[1]*scale,w=c.sourceRect[2]*scale,h=c.sourceRect[3]*scale;
  const expected=[[left,top],[left+w,top],[left+w,top+h],[left,top+h]].map(([x,y])=>[q.x+flip*x,q.y+y]);
  // The outer native prop scope can apply grounding after drawOwn restored its
  // inner scope. The final renderer-bound correction must handle this as well.
  rec.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true},()=>N.drawOwn(p));
  const imageCommands=rec.finish().filter(c=>c.kind==='image');assert.equal(imageCommands.length,1,id+' native image command '+p.sinArtKey);const command=imageCommands[0];
  if(JSON.stringify(command.sourceRect)!==JSON.stringify(c.sourceRect)||JSON.stringify(command.points)!==JSON.stringify(expected))nestedMutations++;
  renderer.render({zone:id,layer:'STORY',exploration:L,commands:imageCommands});
  assert.deepEqual(Array.from(renderer.nativeCommands[0].sourceRect),Array.from(c.sourceRect),id+' native render receives whole sprite '+p.sinArtKey);closePoints(renderer.nativeCommands[0].points,expected,id+' native render receives authored position '+p.sinArtKey);
  assert.deepEqual(Array.from(command.sourceRect),Array.from(c.sourceRect),id+' final source crop preserves entire '+p.sinArtKey);closePoints(command.points,expected,id+' final sprite stays at authored ground position '+p.sinArtKey);assert.equal(command.owner.x,p.x);assert.equal(command.owner.y,p.y);checkedNativeCells++;
 }
}
// A generic native prop still sinks/relocates, proving grounding is active and
// the authored fix did not globally disable the existing presentation system.
const control={id:'fixture-ground-control',x:13,y:7.15,path:'assets/fixture-furniture.png',solid:false,r80PresentationOnly:true},controlRoom={id:'ep1b02',layer:'STORY',exploration:layouts.ep1b02,props:[control],enemies:[]};ns.room=controlRoom;const rec=new DC({makeCanvas:alphaCanvas});ns.ctx=rec;ns.draw();const q=ns.project(control.x,control.y),controlRect=[0,0,100,100],controlPoints=[[q.x-50,q.y-100],[q.x+50,q.y-100],[q.x+50,q.y],[q.x-50,q.y]];
rec.scope({id:'prop:'+control.id,kind:'prop',x:control.x,y:control.y,bodyPath:control.path,alive:true},()=>rec.drawImage(ns.readyImage(control.path).image,...controlRect,q.x-50,q.y-100,100,100));const nativeControl=rec.finish().find(c=>c.kind==='image');assert(nativeControl.sourceRect[3]<100,'negative control: native sink really trims ordinary sprite');assert.notEqual(JSON.stringify(nativeControl.points),JSON.stringify(controlPoints),'negative control: native grounding changes ordinary sprite geometry');const controlBefore=JSON.stringify({sourceRect:nativeControl.sourceRect,points:nativeControl.points});N.restoreAuthoredCommands({commands:[nativeControl]});assert.equal(JSON.stringify({sourceRect:nativeControl.sourceRect,points:nativeControl.points}),controlBefore,'ordinary native prop correction retained');
assert.equal(checkedNativeCells,24,'all 24 authored cells exercised through native scope chain');assert(nestedMutations>0,'outer native scope attempted to mutate authored image commands');assert.equal(ns.__STORYWORLD_PLAY_R113__.stats().failures,0,'native grounding chain errors');assert.equal(ns.__STORYWORLD_PLAY_R115__.inspect().failures,0,'native sink installation errors');assert.equal(N.inspect().stats.errors,0,'authored correction chain errors');console.log('PASS actual native DrawCommands + grounding/sink scopes: all 24 final source rectangles/positions preserved; generic prop behavior retained');

// Measure contact directly from the actual PNG alpha, then pass that visible
// foot through the unmodified native CommandScene world-plane projection.
const contactRequests=Object.entries(N.themes).flatMap(([id,t])=>t.props.map(p=>({id,key:p.key,theme:t.atlas,path:path.join(root,'r96/runtime-text',N.ATLAS[t.atlas].path),cell:N.ATLAS[t.atlas].cells[p.key],slope:p.x<8?-.5:.5,flip:p.flip?-1:1})));
const contacts=JSON.parse(execFileSync('python3',['-c',`from PIL import Image
import sys,json
rows=[]
for r in json.load(sys.stdin):
 x,y,w,h=r['cell']['sourceRect'];px,py=r['cell']['pivot']
 alpha=Image.open(r['path']).getchannel('A').crop((x,y,x+w,y+h))
 choices=((r['slope']*r['flip']*(i%w-px)-(i//w-py),i%w,i//w) for i,a in enumerate(alpha.get_flattened_data() if hasattr(alpha,'get_flattened_data') else alpha.getdata()) if a>16)
 edge,u,v=min(choices)
 rows.append({'id':r['id'],'key':r['key'],'theme':r['theme'],'edge':edge,'pixel':[u,v]})
print(json.dumps(rows))`],{input:JSON.stringify(contactRequests),encoding:'utf8'}));
class NativePoint{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}}
const worldPoint=ns.StoryPhase1.CommandScene.prototype.worldPoint,projectionContext={projection:nativeProjection,T:{Vector3:NativePoint}},contactResults=[];
for(const measured of contacts){
 const t=N.themes[measured.id],p=t.props.find(p=>p.key===measured.key),c=N.ATLAS[t.atlas].cells[p.key];assert.equal(measured.edge,N.GROUND_EDGE[t.atlas][p.key],measured.id+' alpha-measured ground edge '+p.key);
 const item={...p,sinArtZone:measured.id,sinArtKey:p.key,sinArtFlip:p.flip},plane=N.propPlane(item),q=ns.project(p.x,p.y),scale=p.height/c.visibleHeight,flip=p.flip?-1:1;
 const screen=[q.x+flip*(measured.pixel[0]-c.pivot[0])*scale,q.y+(measured.pixel[1]-c.pivot[1])*scale],world=worldPoint.call(projectionContext,screen,{r83DoorPlane:plane});
 assert(Math.abs(world.y-.005/Math.sqrt(1.5))<1e-8,measured.id+' visible foot clears native floor '+p.key);assert(world.y>0,measured.id+' opaque pixels never sink below native floor '+p.key);
 if(p.x<8){assert.equal(plane.ax,plane.bx,measured.id+' west-wall parallel plane');assert(Math.abs(plane.ax-p.x)<=p.width/2,measured.id+' plane inside west furniture footprint '+p.key);}
 else{assert.equal(plane.ay,plane.by,measured.id+' north-wall parallel plane');assert(Math.abs(plane.ay-p.y)<=p.depth/2,measured.id+' plane inside north furniture footprint '+p.key);}
 const projected=nativeProjection.worldToScreen(world.x,world.z,world.y);assert(Math.abs(projected.x-screen[0])<1e-8&&Math.abs(projected.y-screen[1])<1e-8,measured.id+' native world plane preserves intended screen position '+p.key);
 contactResults.push({...measured,plane,minimumOpaqueWorldHeight:world.y});
}
assert.equal(contactResults.length,24);fs.writeFileSync(path.join(__dirname,'contact-results.json'),JSON.stringify(contactResults,null,2)+'\n');console.log('PASS all 24 alpha-derived feet above floor, native vertical planes within collision footprints and exact screen reprojection');
