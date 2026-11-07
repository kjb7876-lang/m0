'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),{performance}=require('perf_hooks');
const ROOT=path.resolve(__dirname,'../..'),SRC=path.join(ROOT,'client-source'),results=[],rows=[];
function check(name,f){try{f();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:String(e)});console.error('FAIL '+name+' '+e);}}
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:Object.fromEntries(['garden','domestic','clinical','forge'].map(k=>[k,{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}]))};
const s={console,Math,JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Promise,performance,matchMedia:()=>({matches:false}),setTimeout(){},clearTimeout(){},
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}}};s.window=s;vm.createContext(s);
for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-r103.js','samong-wide-r355.js','world-scale-r375.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),s,{filename:f});
// Actual engine collision implementation, including its unmodified hospital
// limitation. A pure floor BFS would miss a jamb sealing the passage.
vm.runInContext(fs.readFileSync(path.join(ROOT,'runtime-text/dist/phase1.js'),'utf8'),s,{filename:'phase1.js'});
const M=s.__STORYWORLD_WORLD_SCALE_R375__,Z=s.__STORYWORLD_SAMONG_ZONES_R115__,SM=s.__STORYWORLD_SAMONG_R103__,A=s.StoryPhase1;
const json=v=>JSON.stringify(v),K=(x,y)=>x+':'+y;
function connected(L){const cells=new Set(L.floorCells.map(([x,y])=>K(x,y))),start=[Math.floor(L.entry.x),Math.floor(L.entry.y)],seen=new Set([K(...start)]),q=[start];for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=K(xx,yy);if(cells.has(k)&&!seen.has(k)){seen.add(k);q.push([xx,yy]);}}}return{cells,seen};}
let ei=0,totalMs=0;
for(const [chapter,zones]of Object.entries(Z.chapters)){
 for(const z of zones){const L=SM.layoutFor(ei,Z.stageOf(z),z.id),doors=Z.carve(z).doors,before=json(L),t=performance.now(),Q=M.scaleLayout(L,{doors}),elapsed=performance.now()-t,def=M.scaleZone(z),conn=connected(Q);totalMs+=elapsed;
  check(z.id+' exactly 2x bounds / 4x unique floor cells / unchanged source',()=>{assert.equal(Q.floorCells.length,L.floorCells.length*4);assert.equal(json(Q.bounds),json(L.bounds.map(v=>v*2)));assert.equal(json(L),before);assert.notEqual(Q,L);assert.equal(M.scaleLayout(Q),Q);});
  check(z.id+' floor connectivity and all transformed objectives',()=>{assert.equal(conn.cells.size,conn.seen.size);for(const p of [Q.entry,...['exit','save','dais','core','top'].map(k=>Q.samongR103?.[k]),...(Q.samongR103?.chests||[])].filter(Boolean))assert(conn.seen.has(K(Math.floor(p.x),Math.floor(p.y))),json(p));});
  check(z.id+' scaled clue/grid/nav definitions match geometry',()=>{assert.equal(def.entry.x,z.entry.x*2);for(let i=0;i<z.rooms.length;i++){assert.equal(def.rooms[i].w,z.rooms[i].w*2);assert.equal(def.rooms[i].h,z.rooms[i].h*2);}for(const c of def.clues||[]){const R=def.rooms[c.room];assert(conn.cells.has(K(Math.floor(R.x+c.at[0]),Math.floor(R.y+c.at[1]))));}});
  check(z.id+' door extensions cover only added aperture, centre remains passable',()=>{for(const d of doors){const vertical=d.axis==='v',off=-.5+(d.lo+d.hi)/2,cx=(d.x+(vertical?0:off))*2,cy=(d.y+(vertical?off:0))*2;
   // Some canonical descriptors overlap another wall/jamb. Require no new
   // obstruction at a centre that was already passable at actor radius .29.
   if(!A.explorationBlocked(L,cx/2,cy/2,.29))assert(!A.explorationBlocked(Q,cx,cy,.29),json({d,cx,cy}));
  }});
  rows.push({chapter,id:z.id,beforeCells:L.floorCells.length,afterCells:Q.floorCells.length,bounds:Q.bounds,doors:doors.length,jambs:Q.walls.filter(w=>w.r375Jamb).length,ms:+elapsed.toFixed(3)});
 }ei++;
}
check('all 16 chapters / 163 zones included',()=>{assert.equal(ei,16);assert.equal(rows.length,163);});
check('polygon floors, branch points, refuge portal and edge widths share coordinates',()=>{const L={id:'metadata',bounds:[0,0,2,2],floorCells:[[0,0]],walls:[],floorRects:[{x:0,y:0,width:2,depth:2,polygon:[[0,0],[2,0],[1,2]]}],branches:[[1,2]],edges:[[4,8,3]],refugeR82:{portalNext:{x:1,y:2}},sourceExits:{n:{x:1,y:2,sourceFoot:[44,88],sourceRect:[1,2,3,4]}},worldR78:{routeBranches:[[4,8,3]]}};const Q=M.scaleLayout(L);
 assert.equal(json(Q.floorRects[0].polygon),json([[0,0],[4,0],[2,4]]));assert.equal(json(Q.branches),json([[2,4]]));assert.equal(json(Q.edges),json([[4,8,6]]));assert.equal(Q.refugeR82.portalNext.x,2);assert.equal(Q.sourceExits.n.x,2);assert.equal(json(Q.sourceExits.n.sourceFoot),json([44,88]));assert.equal(json(Q.sourceExits.n.sourceRect),json([1,2,3,4]));assert.equal(json(Q.worldR78.routeBranches),json([[4,8,3]]));});
check('unknown doorway width fails explicitly instead of silently doubling doors',()=>{assert.throws(()=>M.scaleLayout({id:'unknown',bounds:[0,0,2,2],floorCells:[[0,0]],walls:[],worldR74:{doors:[{x:0,y:0,axis:'h'}]}}),/aperture/);});
check('vertical analytic hospital leaf and jambs use segment geometry',()=>{const d={id:'v',x:5,y:5,width:4,depth:.24,endpoints:[[5,3],[5,7]],angle:Math.PI/2},L={id:'v',bounds:[0,0,10,10],floorCells:[[5,5]],walls:[{...d,hospitalDoorB3:'v',hospitalCoreB2:true}],hospitalCoreB2:{rects:[],doors:[d]},hospitalDoorsB3:[d],hospitalBoundary12:[]};const Q=M.scaleLayout(L),leaf=Q.walls[0],j=Q.walls[1];assert.equal(json(leaf.endpoints),json([[10,8],[10,12]]));assert.equal(json(leaf.analyticBounds12),json([9.88,7.88,10.12,12.12]));assert.equal(j.angle,Math.PI/2);assert.equal(j.width,2);assert.equal(j.depth,.24);assert.equal(j.endpoints[1][1]-j.endpoints[0][1],j.width);});
check('horizontal and vertical closed doors cannot be bypassed through enlarged aperture',()=>{
 for(const vertical of [false,true]){const d={id:'door-0',x:5,y:5,width:vertical?.24:4,depth:vertical?4:.24,closed:true,reach:3},L={id:'fixture',bounds:[0,0,10,10],expanded:true,floorCells:Array.from({length:100},(_,i)=>[i%10,Math.floor(i/10)]),walls:[],worldR74:{doors:[d]}};
  const Q=M.scaleLayout(L),leaf=Q.worldR74.doors[0];assert.equal(leaf.width,d.width);assert.equal(leaf.depth,d.depth);assert.equal(leaf.reach,d.reach);assert.equal(leaf.id,d.id);
  // Engine door state is separate from terrain. Test the exact door leaf plus
  // permanent side walls as a single wall domain for closed/open states.
  const closed={...Q,walls:[...Q.walls,{...leaf,annex:true}]};for(let u=-3.8;u<=3.8;u+=.2)assert(A.explorationBlocked(closed,10+(vertical?0:u),10+(vertical?u:0),.1));
  assert(!A.explorationBlocked(Q,10,10,.29));assert(A.explorationBlocked(Q,10+(vertical?0:3),10+(vertical?3:0),.1));
 }
});
const summary={mode:'pure geometry, real R115/R355 generators and phase1 collision; no campaign/save integration',passed:results.filter(r=>r.ok).length,total:results.length,zones:rows.length,chapters:ei,totalMs:+totalMs.toFixed(2),maxCells:Math.max(...rows.map(r=>r.afterCells)),maxMs:Math.max(...rows.map(r=>r.ms)),results,rows};
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'geometry-result.json'),JSON.stringify(summary,null,2));}
console.log(JSON.stringify({...summary,results:undefined,rows:undefined}));if(results.some(r=>!r.ok))process.exitCode=1;
