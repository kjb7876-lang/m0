import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

function runtime(path='_pages/docs/dist/phase1.js'){
 const box={window:{},console,URL,performance,Float32Array};
 vm.createContext(box);vm.runInContext(fs.readFileSync(path,'utf8'),box);return box.window.StoryPhase1;
}

test('last301 preserves its black-sea boss core inside a connected themed maze and retains every portal',()=>{
 const A=runtime(),baseline=runtime('out/r76/phase1-r75.js'),source=A.REGIONAL_ROUTE_DATA.last301,theme=A.REGIONAL_TERRAIN_ART.last301.theme;
 const layout=A.explorationLayout('last301',theme,false,{seedR73:75,worldR74:1,worldR75:1});
 const original=baseline.explorationLayout('last301',theme,false,{seedR73:75,worldR74:1,worldR75:1});
 const blocked=(x,y,r)=>A.explorationBlocked(layout,x,y,r);
 assert.equal(layout.type,'r76-enclosed-boss-core');
 assert.deepEqual(JSON.parse(JSON.stringify(layout.worldR75)),{version:1,family:'encircled-boss-core',sourceTopology:'storm-castle-rampart'});
 assert.equal(layout.worldR74.style,'fallen-angel-black-sea');
 const candidateArt=JSON.parse(JSON.stringify(layout.surface.art)),originalArt=JSON.parse(JSON.stringify(original.surface.art));
 candidateArt.r59Backdrop.brightness=originalArt.r59Backdrop.brightness;
 assert.deepEqual(candidateArt,originalArt,'R76 keeps the exact last301 regional material and only raises the background brightness');
 assert.ok(layout.surface.art.r59Backdrop.brightness>=.65,'last301 landscape texture is bright enough to remain visible around the maze');
 assert.equal(layout.backdropRects.length,1,'the regional landscape texture fills the expanded map behind walkable floors');
 assert.equal(layout.fogRects.length,0,'no dark fog masks the newly visible regional backdrop');
 assert.equal(layout.surface.art.environment,'fallen-angel-black-sea');
 assert.equal(layout.surface.art.theme,original.surface.art.theme);
 assert.equal(layout.nodes[layout.bossRoomNodeId]?.bossCoreR76,true,'the native arena is a first-class node in the maze graph');
 assert.equal(layout.worldR74.rooms.find(r=>r.id===layout.bossRoomNodeId)?.purpose,'검은 바다 보스 전투실');
 assert.equal(layout.worldR74.rooms.length,layout.nodes.length);
 assert.equal(layout.worldR74.doors.length,1,'the boss approach contains an actual interactive door');
 const door=layout.worldR74.doors[0];
 assert.equal(door.id,layout.bossDoorId);
 assert.deepEqual(JSON.parse(JSON.stringify(door.edge)),[layout.bossRoomNodeId,5]);
 assert.equal(blocked(door.x,door.y,.29),false,'the closed door sits on a safe walkable threshold');
 assert.ok(layout.worldR74.corridors.some(c=>c.kind==='boss-approach'&&c.from===layout.bossRoomNodeId&&c.to===5));
 assert.ok(layout.edges.length>=layout.nodes.length-1,'rooms and boss core form one corridor graph');
 const graphSeen=new Set([layout.bossRoomNodeId]);
 for(let changed=true;changed;){changed=false;for(const[a,b]of layout.edges)if(graphSeen.has(a)&&!graphSeen.has(b)){graphSeen.add(b);changed=true;}else if(graphSeen.has(b)&&!graphSeen.has(a)){graphSeen.add(a);changed=true;}}
 assert.equal(graphSeen.size,layout.nodes.length,'the boss room and outer rooms share the maze graph');
 assert.ok(Object.values(source.exits).every(e=>Math.hypot(e.x-door.x,e.y-door.y)>5),'the new door stays clear of all original map portals');
 assert.deepEqual(JSON.parse(JSON.stringify(layout.sourceExits)),JSON.parse(JSON.stringify(source.exits)));
 assert.equal(layout.r76BossEnclosure,true);
 assert.deepEqual(JSON.parse(JSON.stringify(layout.originalEncounterBounds)),[1,1,29,29]);
 assert.ok(layout.bounds[0]<0&&layout.bounds[1]<0,'maze extends around the original map core');
 assert.ok(layout.bounds[2]>50&&layout.bounds[3]>50,'maze retains the outside approach');
 assert.equal(layout.mazeFirst,true);

 const cells=new Set(layout.floorCells.map(([x,y])=>`${x}:${y}`));
 const start=`${Math.floor(layout.entry.x)}:${Math.floor(layout.entry.y)}`;
 assert.ok(cells.has(start),'actual entry lands on the generated walk surface');
 const seen=new Set([start]),todo=[start];
 for(let at=0;at<todo.length;at++){
  const [x,y]=todo[at].split(':').map(Number);
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
   const next=`${x+dx}:${y+dy}`;
   if(cells.has(next)&&!seen.has(next)){seen.add(next);todo.push(next);}
  }
 }
 assert.equal(seen.size,cells.size,'maze, boss core and native exits use one connected floor graph');

 assert.equal(blocked(15.5,13.5,.31),false,'native boss arena core remains walkable');
 assert.ok(seen.has('15:13'),'boss arena connects to the maze graph');
 const clear=(a,b,r)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.2));for(let i=0;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;};
 assert.ok(A.explorationPath(layout,layout.entry,{x:15.5,y:13.5},.31,blocked,clear).length,'collision-safe route reaches the preserved boss arena');
 const exits=Object.values(source.exits),clearance=(path,from)=>{const points=[from,...path];let best=Infinity;for(const exit of exits)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((exit.x-a.x)*dx+(exit.y-a.y)*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(exit.x-(a.x+dx*t),exit.y-(a.y+dy*t)));}return best;};
 const detour={x:20.5,y:15.5},toDetour=A.explorationPath(layout,layout.entry,detour,.31,blocked,clear),toBoss=A.explorationPath(layout,detour,{x:15.5,y:13.5},.31,blocked,clear);
 assert.ok(toDetour.length&&toBoss.length,'a two-leg route reaches the core without relying on an open portal');
 assert.ok(clearance(toDetour,layout.entry)>1,'the 777-mode approach route stays outside each portal trigger radius');
 assert.ok(clearance(toBoss,detour)>1,'the final boss approach also stays outside each portal trigger radius');
 for(const[direction,exit]of Object.entries(source.exits)){
  assert.equal(blocked(exit.x,exit.y,.29),false,`${direction} source exit remains walkable`);
  assert.ok(seen.has(`${Math.floor(exit.x)}:${Math.floor(exit.y)}`),`${direction} source exit connects to the boss maze`);
  assert.ok(A.explorationPath(layout,layout.entry,exit,.29,blocked,clear).length,`${direction} source portal is reachable without crossing a collision boundary`);
 }
});
