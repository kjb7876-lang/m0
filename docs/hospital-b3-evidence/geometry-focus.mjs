import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const root='out/hospital-b3-stability/',sha=s=>createHash('sha256').update(s).digest('hex');
function load(path){const source=fs.readFileSync(path,'utf8'),b={window:{},URL,performance,console};vm.createContext(b);vm.runInContext(source,b);return{A:b.window.StoryPhase1,hash:sha(source)};}
const old=load('out/hospital-b3-candidate/site/dist/phase1.js'),now=load(root+'site/dist/phase1.js'),plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
for(let mask=0;mask<8;mask++){
 const opened=['door-0','door-1','door-2'].filter((_,i)=>mask&(1<<i)),meta={hospitalDoorsB3:opened},a=old.A.explorationLayout('ep1a08','hospital',false,meta),b=now.A.explorationLayout('ep1a08','hospital',false,meta);
 for(const key of ['floorCells','floorRects','hospitalBoundary12','hospitalVisualWalls12','starts','hospitalDoorsB3','bounds','renderEnvelope'])assert.deepEqual(plain(b[key]),plain(a[key]),key);
 assert.deepEqual(plain(b.combatRoomNodeIds),[36,39,17,19]);assert.equal(b.entry.node,44);
 b.hospitalCoreB2.bays.forEach((p,i)=>{const n=b.nodes[b.combatRoomNodeIds[i]];assert.equal(n.x,p.x);assert.equal(n.y,p.y);assert.equal(now.A.explorationBlocked(b,p.x,p.y,.9),false);});
 for(const d of b.hospitalDoorsB3){const open=opened.includes(d.id);assert.equal(now.A.explorationBlocked(b,d.x,d.y,.4),!open);const inner=d.width/2-d.depth/2;assert.equal(inner*2,5.76);if(open){assert.equal(now.A.explorationBlocked(b,d.x+inner-.41,d.y,.4),false);assert.equal(now.A.explorationBlocked(b,d.x+inner-.39,d.y,.4),true);}}
 rows.push({opened,unchangedPhysicalLayout:true,combatNodes:[36,39,17,19],entryNode:44});
}
const result={method:'Actual compiled layout/collision CPU comparison only; 8 door states; no path/play/GPU run',oldRenderer:old.hash,candidateRenderer:now.hash,passed:8,failed:0,rows};fs.writeFileSync(root+'evidence/geometry-focus.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:8,failed:0}));
