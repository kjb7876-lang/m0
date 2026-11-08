'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const s={window:null,localStorage:{getItem:()=>null},setInterval:()=>0,console};s.window=s;vm.createContext(s);
vm.runInContext(read('r96/client-source/story-maps-r171.js'),s);
vm.runInContext(read('r96/client-source/seven-sins-bossrooms.js'),s);
const M=s.__STORYWORLD_STORY_MAPS_R171__,A=s.__STORYWORLD_SIN_BOSSROOMS__;
assert(A,'overlay API exposed');
const topologies={ep1b08:'vertical-cross-lanes'};
const migrated={ep1b02:'compressed-rooms',ep1b03:'mirror-corridors',ep1b04:'counter-maze',ep1b05:'spotlight-runways',ep1b07:'burning-stairwell'};
for(const [id,sourceTopology] of Object.entries(migrated)){const source=M.build(id,null,{sourceTopology});assert.equal(A.layout(id,source),source,id+' delegated to dedicated art overlay');}
assert.deepEqual(Object.keys(A.themes).sort(),[...Object.keys(topologies),...Object.keys(migrated)].sort(),'historical theme metadata remains available');
function bounds(w){return w.analyticBounds12||[w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2];}
const collisionCache=new WeakMap();
function blocked(L,x,y,r=.29){let c=collisionCache.get(L);if(!c){c={cells:new Set(L.floorCells.map(c=>c.join(':'))),bounds:L.walls.map(bounds)};collisionCache.set(L,c);}return !c.cells.has(Math.floor(x)+':'+Math.floor(y))||c.bounds.some(b=>x+r>b[0]&&x-r<b[2]&&y+r>b[1]&&y-r<b[3]);}
function reach(L,open){const key=(x,y)=>x+':'+y,cells=new Set(L.floorCells.filter(([x,y])=>!blocked(L,x+.5,y+.5)).map(c=>c.join(':'))),doors=L.worldR74.doors.filter(d=>!open.includes(d.id)),start=key(Math.floor(L.entry.x),Math.floor(L.entry.y)),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const[x,y]=queue[i].split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!cells.has(k)||seen.has(k)||doors.some(d=>d.axis==='y'&&x===nx&&Math.max(y,ny)===d.y&&x+.5>d.x-d.width/2&&x+.5<d.x+d.width/2))continue;seen.add(k);queue.push(k);}}return p=>seen.has(key(Math.floor(p.x),Math.floor(p.y)));}
for(const [id,sourceTopology]of Object.entries(topologies)){
 const source=M.build(id,null,{sourceTopology}),before=JSON.stringify(source),L=A.layout(id,source);
 assert.equal(JSON.stringify(source),before,id+' source unchanged');assert.notEqual(L,source,id+' copied layout');assert(L.sinBossroom,id+' marker');
 assert.equal(A.layout(id,source),L,id+' cache');assert.equal(A.layout(id,L),L,id+' idempotence');
 for(const k of ['floorCells','floorRects','worldR74','worldWardR81','worldR78'])assert.equal(L[k],source[k],id+' preserves '+k);
 assert(source.walls.every(w=>L.walls.includes(w)),id+' preserves original walls');
 for(const p of A.themes[id].props){
  assert(p.x-p.width/2>=6&&p.x+p.width/2<=26&&p.y-p.depth/2>=6&&p.y+p.depth/2<=20,id+' prop in room');
  assert(L.walls.some(w=>w.id==='sin:'+id+':'+p.id&&w.sinFurniture),id+' collision marker '+p.id);
  assert(blocked(L,p.x,p.y),id+' solid furniture '+p.id);
  for(const d of L.worldR74.doors)assert(Math.hypot(p.x-d.x,p.y-d.y)>d.width/2+1,id+' door clearance '+p.id);
 }
 assert(!blocked(L,16,13,.5),id+' central space');
 for(const p of L.worldWardR81.bossPoints)assert(!blocked(L,p.x,p.y,.5),id+' boss anchor');
 assert(!reach(L,[])(L.worldWardR81.bossAnchor),id+' closed boss door');
 assert(reach(L,['door-0'])(L.worldWardR81.bossAnchor),id+' open boss door furniture-aware route');
 assert(!reach(L,['door-0'])(L.worldWardR81.portalNext),id+' closed next door');
 assert(reach(L,['door-0','door-2'])(L.worldWardR81.portalNext),id+' open exit furniture-aware route');
 assert.equal(A.layout(id,{...source,samongR103:true}).sinBossroom,undefined,id+' samong R103 excluded');
 assert.equal(A.layout(id,{...source,samongR115:true}).sinBossroom,undefined,id+' samong R115 excluded');
 const native={...source,storyMapR171:null};assert.equal(A.layout(id,native),native,id+' native non-story-map layout excluded');
 s.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};assert.equal(A.layout(id,source),source,id+' coop excluded');delete s.__STORYWORLD_COOP_SIM_R62__;
 console.log('PASS',id,'source/floor/walls/metadata/cache/scope/furniture/spawns/closed-open routes');
}
const other=M.build('ep1b06',null,{sourceTopology:'vault-spokes'});assert.equal(A.layout('ep1b06',other),other,'Mammon stays independently owned');assert.equal(A.layout('ep1b06b',other),other,'winter interlude excluded');
assert.equal(read('r96/client-source/seven-sins-bossrooms.js'),read('r96/runtime-text/seven-sins-bossrooms.js'),'runtime source synchronized');
console.log('PASS retained Pride CPU fixture and five migrated-room exclusions; runtime copy; Mammon and interlude exclusions');
// Independent renderer fixture: native scene ownership, stale async callbacks and Legacy scope.
class Group{constructor(){this.children=[];}add(o){this.children.push(o);o.parent=this;}removeFromParent(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}}
class Resource{constructor(...args){this.args=args;this.color={multiplyScalar(){}};}dispose(){this.disposed=true;}}
class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position={set(x,y,z){this.x=x;this.y=y;this.z=z;}};this.rotation={z:0};this.layers={set(){}};this.userData={};}}
class Renderer{render(){this.nativeRenders=(this.nativeRenders||0)+1;}}
const images=[];class ImageStub{constructor(){images.push(this);}}
const renderer=new Renderer(),engineResource=new Resource();Object.assign(renderer,{T:{Group,Mesh,MeshStandardMaterial:Resource,BoxGeometry:Resource,CylinderGeometry:Resource,CanvasTexture:Resource,SRGBColorSpace:'srgb'},spatialRoot:new Group(),spatialResources:new Set([engineResource]),spatialBuilt:true,sceneGeneration:1});
let faces=0,propDraws=0;
const rs={window:null,console,Image:ImageStub,setInterval:()=>0,document:{createElement:()=>({getContext:()=>({drawImage(){}})})},StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:renderer}}},drawObjective(){},drawProp(){propDraws++;},project:(x,y)=>({x,y}),ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){faces++;}},room:null};rs.window=rs;vm.createContext(rs);vm.runInContext(read('r96/client-source/seven-sins-bossrooms.js'),rs);
const RA=rs.__STORYWORLD_SIN_BOSSROOMS__,roomLayout=id=>RA.layout(id,M.build(id,null,{sourceTopology:topologies[id]}));
const frame=(id,L=roomLayout(id),layer='STORY')=>({zone:id,layer,exploration:L});
const start=frame('ep1b08');renderer.render(start);assert(renderer.__sinBossroom,'initial scene built');const first=renderer.__sinBossroom,n=renderer.spatialResources.size,stale=images.at(-1);renderer.render(start);assert.equal(renderer.__sinBossroom,first,'same layout reuses assembly');assert.equal(renderer.spatialResources.size,n,'same layout no extra resources');
renderer.render({...start,exploration:{...start.exploration}});assert(first.group.removed,'replacement removes old group');assert([...first.resources].every(o=>o.disposed),'replacement releases owned resources');assert(!engineResource.disposed&&renderer.spatialResources.has(engineResource),'engine-owned resources preserved');assert.equal(renderer.spatialResources.size,n,'replacement has stable resource count');assert.equal(renderer.spatialRoot.children.length,1,'replacement retains single assembly');
const current=renderer.__sinBossroom,resourceCount=renderer.spatialResources.size;stale.onload();stale.onerror();assert.equal(renderer.spatialResources.size,resourceCount,'obsolete layout image ignored');images.at(-1).onload();assert.equal(renderer.spatialResources.size,resourceCount+1,'current image creates one owned texture');
renderer.render(frame('ep1b08',{...start.exploration}));assert(current.group.removed&&[...current.resources].every(o=>o.disposed),'layout replacement cleans old assembly');
for(const id of Object.keys(migrated)){renderer.render(start);const prior=renderer.__sinBossroom;renderer.render({zone:id,layer:'STORY',exploration:{sinRoomArt:true,sinBossroom:true}});assert(!renderer.__sinBossroom&&prior.group.removed,id+' migrated room releases old assembly');}
for(const id of Object.keys(topologies)){renderer.render(frame(id));const assembly=renderer.__sinBossroom;assert(assembly?.group.children.length>0,id+' authored geometry exists');for(const p of RA.themes[id].props){const owned=assembly.group.children.filter(m=>m.name.startsWith('sin:'+id+':'+p.id+':'));assert(owned.length>0,id+' furniture has mesh '+p.id);for(const m of owned){const isCylinder=/plate|bottle|hob|pan$|waste-bin|waste-opening|wheel|bucket/.test(m.name)&&m.geometry.args.length===4;const [w,h,d]=isCylinder?[m.geometry.args[0]*2,m.geometry.args[2],m.geometry.args[0]*2]:m.geometry.args;const a=m.rotation.z||0,halfX=Math.abs(w*Math.cos(a)/2)+Math.abs(h*Math.sin(a)/2);assert(m.position.x-halfX>=p.x-p.width/2-.12&&m.position.x+halfX<=p.x+p.width/2+.12,id+' mesh width within furniture tolerance '+m.name);assert(m.position.z-d/2>=p.y-p.depth/2-.12&&m.position.z+d/2<=p.y+p.depth/2+.12,id+' mesh depth within furniture tolerance '+m.name);}}}
let last=renderer.__sinBossroom;const oldImage=images.at(-1);renderer.render(frame('ep1b08',last.L,'DREAM'));assert(!renderer.__sinBossroom,'non-STORY releases overlay');assert(last.group.removed&&[...last.resources].every(o=>o.disposed),'non-STORY resources released');assert.equal(renderer.spatialRoot.children.length,0);const scopeCount=renderer.spatialResources.size;oldImage.onload();oldImage.onerror();assert.equal(renderer.spatialResources.size,scopeCount,'image after release ignored');
renderer.render(start);last=renderer.__sinBossroom;rs.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};renderer.render(start);assert(!renderer.__sinBossroom&&last.group.removed,'co-op releases overlay');delete rs.__STORYWORLD_COOP_SIM_R62__;
renderer.render(start);last=renderer.__sinBossroom;renderer.render({zone:'ep1b06',layer:'STORY',exploration:{mammonBossroom:true}});assert(!renderer.__sinBossroom&&last.group.removed,'unowned Mammon releases overlay');
renderer.render(start);last=renderer.__sinBossroom;const generationImage=images.at(-1);for(const o of renderer.spatialResources)o.dispose?.();renderer.spatialResources.clear();renderer.spatialRoot=new Group();renderer.sceneGeneration++;renderer.render(start);assert.notEqual(renderer.__sinBossroom,last,'native scene rebuild creates new assembly');const newCount=renderer.spatialResources.size;generationImage.onload();generationImage.onerror();assert.equal(renderer.spatialResources.size,newCount,'old scene image ignored');const disposedImage=images.at(-1);renderer.disposed=true;disposedImage.onload();disposedImage.onerror();assert.equal(renderer.spatialResources.size,newCount,'disposed renderer ignores pending image');renderer.disposed=false;
rs.__STORYWORLD_PHASE1__.controller.state.three=null;
for(const id of Object.keys(topologies)){rs.room={id,layer:'STORY',exploration:roomLayout(id)};faces=0;rs.drawObjective();assert.equal(faces,RA.themes[id].props.length*3,id+' legacy shows solid footprints');const p=RA.themes[id].props[0];propDraws=0;rs.drawProp({x:p.x,y:p.y,decorative:true});assert.equal(propDraws,0,id+' covered passive dressing hidden');for(const protection of [{name:'important'},{interactive:true},{solid:true},{chest:true},{r74Door:{}}])rs.drawProp({x:p.x,y:p.y,decorative:true,...protection});assert.equal(propDraws,5,id+' gameplay props preserved');}
rs.room.layer='DREAM';faces=0;rs.drawObjective();assert.equal(faces,0,'legacy non-STORY excluded');rs.room.layer='STORY';rs.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};rs.drawObjective();assert.equal(faces,0,'legacy co-op excluded');delete rs.__STORYWORLD_COOP_SIM_R62__;rs.room.samongR115=true;rs.drawObjective();assert.equal(faces,0,'legacy Samong excluded');
assert.equal(RA.inspect().stats.errors,0,'renderer fixture has no swallowed exceptions');
console.log('PASS renderer reuse/replacement/zone/scope/native-generation cleanup, owned resources, stale/disposed async image guards, mesh footprint tolerance, Legacy scopes and protected props');
// Cave terrain must not turn authored furniture envelopes into rock masses.
class CaveRenderer{render(){}}
const cs={window:null,console,StoryPhase1:{ThreeRenderer:CaveRenderer},localStorage:{getItem:()=>null},setInterval:()=>0};cs.window=cs;vm.createContext(cs);vm.runInContext(read('r96/client-source/cave-r204.js'),cs);
const cave=cs.__STORYWORLD_CAVE_R204__;assert(cave?.field,'cave field API');
const base=M.build('ep1b08',null,{sourceTopology:topologies.ep1b08}),cropped={...base,bounds:[0,0,30,24],entry:{x:16,y:13},starts:[{x:16,y:13}],floorCells:base.floorCells.filter(([x,y])=>x<30&&y<24),walls:base.walls.filter(w=>w.x<30&&w.y<24)};
const owned=RA.layout('ep1b08',cropped),cfg={seed:0x57a17,bulge:.5,thick:1.4},originalField=cave.field(cropped,cfg,[]),furnishedField=cave.field(owned,cfg,[]);
for(const k of ['inside','raw','f','G'])assert.deepEqual(Buffer.from(furnishedField[k].buffer),Buffer.from(originalField[k].buffer),'authored furniture does not change cave field '+k);
const regularWall={id:'ordinary-fixture-wall',x:16,y:13,width:2,depth:2,height:2.7},regularField=cave.field({...cropped,walls:[...cropped.walls,regularWall]},cfg,[]);assert.notDeepEqual(Buffer.from(regularField.inside),Buffer.from(originalField.inside),'ordinary solid walls still contribute cave rock');
for(const w of owned.walls.filter(w=>w.sinFurniture)){assert.equal(w.height,.01);assert.equal(w.r98BaseHeight,.01,'regional dressing preserves collision-only floor height');assert(!w.decorative,'solid furniture never bypasses collision as decorative');}
assert.equal(read('r96/client-source/cave-r204.js'),read('r96/runtime-text/cave-r204.js'),'cave source synchronized');
console.log('PASS cave distance fields identical with authored furniture; ordinary wall geometry retained; regional-height protection and cave source copy');
