'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const {createHarness}=require('./harness.cjs');
const h=createHarness();
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-hospital-layout.json'),'utf8'));
h.context.originalHospitalFixture=original;
h.context.plannedTopologyFixture=JSON.parse(fs.readFileSync(path.join(__dirname,'topology-plan.json'),'utf8'));
const result=h.run(`(()=>{
 const A=window.StoryPhase1,closed=A.hospitalCoreLayoutB2({walls:[],surface:{}},[]),opened=A.hospitalCoreLayoutB2({walls:[],surface:{}},['door-0','door-1','door-2']),bossOpen=A.hospitalCoreLayoutB2({walls:[],surface:{}},['door-0']);
 const roof=window.__STORYWORLD_HOSPITAL_A5__.plan(closed),checks=[];
 const check=(name,pass,detail)=>checks.push({name,passed:!!pass,...(detail===undefined?{}:{detail})});
 const key=(x,y)=>x+':'+y,originalFloor=new Set();
 for(const[,x0,y0,x1,y1]of originalHospitalFixture.rects)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)originalFloor.add(key(x,y));
 const floor=new Set(closed.floorCells.map(([x,y])=>key(x,y)));
 check('All original 5710 floor cells retained; expanded to 8022',floor.size===8022&&originalFloor.size===5710&&[...originalFloor].every(k=>floor.has(k)),{original:originalFloor.size,current:floor.size});
 check('Original named rooms retained and widened in place',originalHospitalFixture.rects.every(r=>A.HOSPITAL_CORE_B2.rects.some(n=>n[0]===r[0])));
 const cover=new Map(),roofCover=new Map();let outOfBounds=0,nonIntegral=0;
 for(const k of floor)cover.set(k,1);
 for(const r of roof.roofRects){if(![r.x,r.y,r.width,r.depth].every(Number.isInteger))nonIntegral++;for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++){const k=key(x,y);cover.set(k,(cover.get(k)||0)+1);roofCover.set(k,(roofCover.get(k)||0)+1);if(x<0||x>=87||y<0||y>=113)outOfBounds++;}}
 let holes=0,overlaps=0;for(let y=0;y<113;y++)for(let x=0;x<87;x++){const n=cover.get(key(x,y))||0;if(!n)holes++;if(n>1)overlaps++;}
 check('Floor + masonry covers all 87 × 113 cells without holes or overlap',cover.size===87*113&&!holes&&!overlaps&&!outOfBounds&&!nonIntegral,{totalCells:cover.size,floorCells:floor.size,masonryCells:roofCover.size,holes,overlaps,outOfBounds});
 const tileCover=new Map();for(const r of roof.tiles){if(![r.x,r.y,r.width,r.depth].every(Number.isInteger))nonIntegral++;for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++){const k=key(x,y);tileCover.set(k,(tileCover.get(k)||0)+1);}}
 check('Rendered masonry tile footprints cover precisely the roof cells',tileCover.size===roofCover.size&&[...tileCover].every(([k,v])=>v===1&&roofCover.get(k)===1)&&!nonIntegral,{tileRectangles:roof.tiles.length});
 const actual=closed.hospitalBoundary12.filter(w=>w.hospitalMazeBarrier),expected=plannedTopologyFixture.barriers;
 check('20 baffle segments match planned endpoints exactly',actual.length===20&&expected.length===20&&expected.every(b=>actual.some(w=>w.id==='hospital-maze:'+b.id&&JSON.stringify(w.endpoints)===JSON.stringify(b.endpoints))),{count:actual.length});
 check('Visual and physical wall arrays share the same wall objects',closed.hospitalVisualWalls12===closed.hospitalBoundary12&&closed.walls===closed.hospitalBoundary12);
 check('Exactly three preserved door IDs',closed.hospitalDoorsB3.length===3&&closed.hospitalDoorsB3.every((d,i)=>d.id==='door-'+i),{doors:closed.hospitalDoorsB3});
 const projectile=[];
 for(const w of actual){const[a,b]=w.endpoints,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  for(const radius of [.08,.18]){const hit=A.hospitalBoundaryContact12(closed,mx-nx,my-ny,mx+nx,my+ny,radius);projectile.push({id:w.id,radius,contact:hit});}
 }
 check('Scalpel/syringe swept-radius fixtures hit every added baffle',projectile.length===40&&projectile.every(r=>Number.isFinite(r.contact)&&r.contact>=0&&r.contact<1),{cases:projectile.length});
 const doorShots=[];
 for(const d of closed.hospitalDoorsB3)for(const radius of [.08,.18]){const args=[d.x,d.y-1,d.x,d.y+1,radius],shut=A.hospitalBoundaryContact12(closed,...args),open=A.hospitalBoundaryContact12(opened,...args);doorShots.push({id:d.id,radius,closedContact:shut,openContact:open});}
 check('Both projectile-radius fixtures hit all 3 closed doors',doorShots.every(s=>Number.isFinite(s.closedContact)&&s.closedContact>=0&&s.closedContact<1),{cases:doorShots.length});
 check('Opening native doors removes projectile collision at each threshold',doorShots.every(s=>s.openContact===null));
 function flood(L){const start=[43,109],visited=new Set([key(...start)]),queue=[start];for(let i=0;i<queue.length;i++){const[x,y]=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(visited.has(k)||!floor.has(k)||A.hospitalCoreBlockedB2(L,xx+.5,yy+.5,.30))continue;if(A.hospitalBoundaryContact12(L,x+.5,y+.5,xx+.5,yy+.5,.30)!==null)continue;visited.add(k);queue.push([xx,yy]);}}return visited;}
 const f0=flood(closed),fb=flood(bossOpen),fo=flood(opened);
 check('Closed boss gate excludes boss room and exit from entry',!f0.has('20:12')&&!f0.has('5:3')&&f0.has('20:36'),{reachableCells:f0.size});
 check('Opening boss gate admits boss room while exit gate remains locked',fb.has('20:12')&&!fb.has('5:3'));
 check('Opening all doors allows boss-room-to-exit continuity',fo.has('20:12')&&fo.has('5:3'));
 check('Both route spawn sets remain wall-safe',Object.values(window.__STORYWORLD_HOSPITAL_MAZE_LAYOUT__.routeSpawns).flat().every(p=>!A.hospitalCoreBlockedB2(closed,p.x,p.y,.8)));
 return{schema:'hospital-maze-layout-cpu/v1',method:'Native layout, A5 masonry plan, native analytical swept wall collision, and grid flood reachability in Node VM. DOM/Image/audio/timers are stubs. boot() and renderer readiness spy were NOT invoked. Not browser input, image rendering, WebGL/GPU or natural-play verification.',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,projectileBaffleCases:projectile,projectileDoorCases:doorShots,browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
})()`,'layout-validation');
fs.writeFileSync(path.join(__dirname,'layout-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:result.passed,failed:result.failed,checks:result.checks},null,2));
if(result.failed)process.exitCode=1;
