'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const s={window:null,localStorage:{getItem:()=>null},setInterval:()=>0,console};s.window=s;vm.createContext(s);
vm.runInContext(read('r96/client-source/story-maps-r171.js'),s);
vm.runInContext(read('r96/client-source/mammon-bossroom.js'),s);
const M=s.__STORYWORLD_STORY_MAPS_R171__,A=s.__STORYWORLD_MAMMON_BOSSROOM__;
const source=M.build('ep1b06',null,{sourceTopology:'vault-spokes'}),before=JSON.stringify(source),L=A.layout('ep1b06',source);
assert.equal(JSON.stringify(source),before,'source layout unchanged');assert.notEqual(L,source);
assert.equal(A.layout('ep1b06',source),L);assert.equal(A.layout('ep1b06',L),L);
assert.equal(A.layout('ep1b06b',source),source);assert.equal(A.layout('ep1a08',source),source);
assert.equal(L.worldR74,source.worldR74);assert.equal(L.worldWardR81,source.worldWardR81);assert.equal(L.worldR78,source.worldR78);
const oldCells=new Set(source.floorCells.map(c=>c.join(':'))),cells=new Set(L.floorCells.map(c=>c.join(':')));
for(const k of oldCells)assert(cells.has(k),'no original walkable cell removed');
for(const [x,y] of L.floorCells)if(!oldCells.has(x+':'+y))assert(x>=10&&x<=21&&y>=9&&y<=16,'floor changes limited to core');
for(let x=10;x<23;x++)for(let y=9;y<18;y++)assert(cells.has(x+':'+y),'central arena open');
function reach(open){const doors=L.worldR74.doors.filter(d=>!open.includes(d.id)),key=(x,y)=>x+':'+y,start=key(Math.floor(L.entry.x),Math.floor(L.entry.y)),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++){const[x,y]=queue[i].split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!cells.has(k)||seen.has(k)||doors.some(d=>d.axis==='y'&&x===nx&&Math.max(y,ny)===d.y&&x>=d.x-d.width/2&&x<d.x+d.width/2))continue;seen.add(k);queue.push(k);}}return p=>seen.has(key(Math.floor(p.x),Math.floor(p.y)));}
assert(!reach([])(L.worldWardR81.bossAnchor));assert(reach(['door-0'])(L.worldWardR81.bossAnchor));assert(!reach(['door-0'])(L.worldWardR81.portalNext));assert(reach(['door-0','door-2'])(L.worldWardR81.portalNext));
for(const p of A.furniture){assert(p.x-p.width/2>=6&&p.x+p.width/2<=26);assert(p.y-p.depth/2>=6&&p.y+p.depth/2<=20);for(const d of L.worldR74.doors)assert(Math.hypot(p.x-d.x,p.y-d.y)>d.width/2+1,'door clearance');}
for(const p of [{r74Door:{}},{interactive:true},{solid:true},{terrainWall:true}])assert(!A.clutter({...p,x:16,y:13,decorative:true}));
assert(A.clutter({x:16,y:13,decorative:true}));
assert.equal(read('r96/client-source/mammon-bossroom.js'),read('r96/runtime-text/mammon-bossroom.js'));
console.log('PASS: source immutability, cache, scope, progress metadata, central floor, closed/open door BFS, furniture/door clearance, protected props, runtime copy');
// Rendering lifecycle fixture: replacing a layout within a scene releases only owned resources.
class Group{constructor(){this.children=[];}add(o){this.children.push(o);o.parent=this;}removeFromParent(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}}
class Resource{constructor(){this.color={setHex(){}};}dispose(){this.disposed=true;}}
class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position={set(){}};this.layers={set(){}};this.userData={};}}
class Renderer{render(){}}
const renderer=new Renderer();Object.assign(renderer,{T:{Group,Mesh,MeshStandardMaterial:Resource,BoxGeometry:Resource},spatialRoot:new Group(),spatialResources:new Set(),spatialBuilt:true,sceneGeneration:1});
let fallbackFaces=0;const renderContext={window:null,console,Image:class{},setInterval:()=>0,StoryPhase1:{ThreeRenderer:Renderer},__STORYWORLD_PHASE1__:{controller:{state:{three:renderer}}},drawObjective(){},project:(x,y)=>({x,y}),ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){fallbackFaces++;}},room:{id:'ep1b06',layer:'STORY',exploration:{mammonBossroom:true}}};renderContext.window=renderContext;vm.createContext(renderContext);vm.runInContext(read('r96/client-source/mammon-bossroom.js'),renderContext);
const frame={zone:'ep1b06',layer:'STORY',exploration:L};renderer.render(frame);const first=renderer.__mammon,n=renderer.spatialResources.size;renderer.render({...frame,exploration:{...L}});assert(first.group.removed);assert([...first.resources].every(r=>r.disposed));assert.equal(renderer.spatialResources.size,n);assert.equal(renderer.spatialRoot.children.length,1);
// V16 owns the inherited architectural finish only when production-registered
// and enabled. Its state may change without a layout or generation change.
const nativeGroup=new Group(),nativeResource=new Resource();renderer.spatialRoot.add(nativeGroup);renderer.spatialResources.add(nativeResource);
const pilotState={registered:false,on:true};
renderContext.__STORYWORLD_MAMMON_MINIATURE_PILOT__=Object.freeze({inspect:()=>({...pilotState})});
const isFinish=name=>/^mammon:(iron-|north-cornice|west-cornice|brass-jamb|brass-header)/.test(name);
const names=()=>renderer.__mammon.group.children.map(o=>o.name);
renderer.render(frame);
const furnitureNames=names().filter(name=>!isFinish(name)).sort();
function assertOwnership(inherited){
 const scene=renderer.__mammon,all=names();assert.equal(scene.inheritedFinish,inherited);
 assert.equal(all.some(name=>name==='mammon:iron-north'),!inherited,'exactly one owner of north iron finish');
 assert.equal(all.some(name=>name==='mammon:brass-jamb'),!inherited,'exactly one owner of native door jamb finish');
 if(inherited)assert(!all.some(isFinish),'no duplicate iron, cornice or brass frame while V16 owns finish');
 assert(all.includes('mammon:safe-body'),'safe remains visible with either finish owner');
 assert.equal(all.filter(name=>/^mammon:cash-stack-\d+$/.test(name)).length,5,'all five cash bundles remain with either finish owner');
 assert.deepEqual(all.filter(name=>!isFinish(name)).sort(),furnitureNames,'finish handoff preserves every furniture mesh');
 assert(renderer.spatialRoot.children.includes(nativeGroup),'native presentation group is preserved');
 assert(renderer.spatialResources.has(nativeResource)&&!nativeResource.disposed,'native presentation resource is preserved');
 assert.equal(renderer.spatialRoot.children.length,2,'one native group and one current owned group');
 const size=renderer.spatialResources.size;renderer.render(frame);
 assert.equal(renderer.__mammon,scene,'stable ownership does not rebuild every frame');assert.equal(renderer.spatialResources.size,size);
}
function changePilot(registered,on,inherited){
 const previous=renderer.__mammon,generation=renderer.sceneGeneration;Object.assign(pilotState,{registered,on});renderer.render(frame);
 assert.equal(renderer.sceneGeneration,generation,'handoff occurs within the same native scene');
 assert.notEqual(renderer.__mammon,previous,'ownership change refreshes the cached scene');
 assert(previous.group.removed,'previous owned group is detached');
 for(const resource of previous.resources){assert(resource.disposed,'previous owned resource disposed');assert(!renderer.spatialResources.has(resource),'previous owned resource unregistered');}
 assertOwnership(inherited);
}
assertOwnership(false); // An unregistered diagnostic pilot must not suppress production art.
changePilot(true,true,true);changePilot(true,false,false);changePilot(true,true,true);changePilot(false,true,false);
delete renderContext.__STORYWORLD_MAMMON_MINIATURE_PILOT__;
console.log('PASS V16 registration/on ownership, furniture preservation, same-scene toggle cleanup and native resource isolation');
renderContext.__STORYWORLD_PHASE1__.controller.state.three=null;renderContext.drawObjective();assert.equal(fallbackFaces,19,'legacy furniture has visible faces');console.log('PASS same-scene resource cleanup and legacy furniture painter');

assert.equal(A.cashBundles.length,5);for(const c of A.cashBundles){assert(A.furniture.some(p=>c.x-.36>=p.x-p.width/2&&c.x+.36<=p.x+p.width/2&&c.y-.21>=p.y-p.depth/2&&c.y+.21<=p.y+p.depth/2&&c.z>=p.height),"cash stays on furniture");}assert(L.walls.some(w=>w.id==="mammon:safe"));console.log("PASS safe collision footprint and five cash bundles on furniture");
