import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';

const baselineBytes=fs.readFileSync('out/r76/phase1-r75.js');
const candidateBytes=fs.readFileSync('_pages/docs/dist/phase1.js');
const digest=b=>createHash('sha256').update(b).digest('hex');
const build=JSON.parse(fs.readFileSync('out/r76/build.json','utf8'));
assert.equal(digest(baselineBytes),build.baselineR75RendererSHA256,'exact pinned R75 renderer baseline');
assert.equal(digest(candidateBytes),build.rendererSHA256,'candidate renderer matches R76 build report');

function load(bytes){
 const box={window:{},console,URL,performance,Float32Array};
 vm.createContext(box);
 vm.runInContext(bytes.toString('utf8'),box);
 return box.window.StoryPhase1;
}

test('optimized exploration collision matches R75 on seeded maps and boundary probes',()=>{
 const baseline=load(baselineBytes),candidate=load(candidateBytes);
 const regions=['dist02','ep1b08','kair07','ep1a09b','hando02'];
 let seed=0x6e624eb7;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const phases=[];

 for(const id of regions){
  const theme=baseline.REGIONAL_TERRAIN_ART[id]?.theme;
  assert.ok(theme,`baseline terrain profile exists for ${id}`);
  const meta={seedR73:75,worldR74:1,worldR75:1};
  const oldLayout=baseline.explorationLayout(id,theme,false,meta);
  const newLayout=candidate.explorationLayout(id,theme,false,meta);
  assert.equal(oldLayout?.worldR75?.family,newLayout?.worldR75?.family,`${id} layout family`);
  assert.deepEqual(JSON.parse(JSON.stringify(oldLayout.bounds)),JSON.parse(JSON.stringify(newLayout.bounds)),`${id} bounds`);
  assert.equal(oldLayout.floorCells.length,newLayout.floorCells.length,`${id} floor count`);
  assert.equal(oldLayout.walls.length,newLayout.walls.length,`${id} wall count`);

  const probes=[],floor=oldLayout.floorCells,walls=oldLayout.walls;
  for(let i=0;i<30000;i++){
   let x,y;
   if(i%4<2){
    const p=floor[Math.floor(random()*floor.length)];
    x=p[0]+.5+(random()-.5)*1.3;
    y=p[1]+.5+(random()-.5)*1.3;
   }else if(i%4===2){
    x=oldLayout.bounds[0]+random()*(oldLayout.bounds[2]-oldLayout.bounds[0]);
    y=oldLayout.bounds[1]+random()*(oldLayout.bounds[3]-oldLayout.bounds[1]);
   }else{
    const w=walls[Math.floor(random()*walls.length)];
    x=w.x+(random()-.5)*w.width*2;
    y=w.y+(random()-.5)*w.depth*2;
   }
   probes.push([x,y,[.29,.31,.42][i%3]]);
  }
  for(let i=0;i<walls.length;i+=5){
   const w=walls[i];
   for(const radius of [.29,.31,.42]){
    probes.push([w.x+w.width/2+radius,w.y,radius]);
    probes.push([w.x+w.width/2+radius-1e-10,w.y,radius]);
    probes.push([w.x+w.width/2+radius+1e-10,w.y,radius]);
   }
  }
  for(let i=0;i<floor.length;i+=Math.max(1,Math.floor(floor.length/128))){
   const [x,y]=floor[i];
   for(const radius of [.29,.31,.42]){
    probes.push([x+1+radius,y+.5,radius]);
    probes.push([x+1+radius-1e-10,y+.5,radius]);
    probes.push([x+1+radius+1e-10,y+.5,radius]);
   }
  }
  probes.push([NaN,0,.31],[0,NaN,.31],[0,0,-.1],[oldLayout.bounds[0]-.31,1,.31]);

  const oldBlocked=(x,y,r)=>baseline.explorationBlocked(oldLayout,x,y,r);
  const newBlocked=(x,y,r)=>candidate.explorationBlocked(newLayout,x,y,r);
  let mismatchCount=0,oldHits=0,newHits=0;
  for(const [x,y,r]of probes){const a=oldBlocked(x,y,r),b=newBlocked(x,y,r);oldHits+=a?1:0;newHits+=b?1:0;if(a!==b)mismatchCount++;}
  assert.equal(mismatchCount,0,`${id} collision parity across ${probes.length} probes`);
  assert.equal(oldHits,newHits,`${id} blocked-result count`);
  phases.push({id,probeCount:probes.length,blockedCount:oldHits,mismatches:mismatchCount});
 }

 const result={
  status:'R76_WORLD_BLOCKED_CPU_PARITY_PASSED',
  method:'Exact compiled R75 and R76 collision functions in Node VM; deterministic seeded probes on five R75 region layouts, including floor/wall contact boundaries; CPU correctness only.',
  commitSHA:build.headSHA||null,
  node:process.version,platform:process.platform,arch:process.arch,seed:'0x6e624eb7',
  htmlSHA256:build.htmlSHA256,
  baselineRendererSHA256:digest(baselineBytes),candidateRendererSHA256:digest(candidateBytes),
  probesPerRegionMinimum:30000,phases,
  interpretation:'Asserts collision-result parity only. It contains no frame-time, GPU, mobile, or performance claim.'
 };
 fs.mkdirSync('out/r76',{recursive:true});
 fs.writeFileSync('out/r76/world-blocked-parity.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
});
