// R106 CPU check: 사몽 survival arenas are wide open fields (뱀서류, D2 Survivors 참고), every layout stays reachable, and survival
// mobs are faster. R106 also made the flashlight mazes denser; R108 widened them again (see the maze pins below). Stub environment as R105.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:new Proxy({},{get:()=>({floorRect:[0,0,1,1],wallRect:[0,0,1,1]})})};
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,Proxy,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}},playScenes(){},escapeHTML:s=>String(s)};
sb.window=sb;vm.createContext(sb);
for(const f of['samong-text-r103.js','samong-r103.js','growth-r103.js','samong-maps-r105.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,EP=SM.episodes;
function reach(L,from){const key=(x,y)=>x+':'+y,cells=new Set(L.floorCells.map(([x,y])=>key(x,y))),s=key(Math.floor(from.x),Math.floor(from.y));if(!cells.has(s))return null;const seen=new Set([s]),q=[s];while(q.length){const[x,y]=q.shift().split(':').map(Number);for(const[a,b]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,b);if(cells.has(k)&&!seen.has(k)){seen.add(k);q.push(k);}}}return{seen,cells,key};}
const surv=[],mazes=[],fails=[];
for(let i=1;i<EP.length;i++){
 const L=SM.layoutFor(i,'survival'),x=L.samongR103,r=reach(L,L.entry);surv.push({i,floor:L.floorCells.length,span:L.bounds[2],pillars:x.pillars.length,shape:x.shape});
 if(!r||!r.seen.has(r.key(Math.floor(x.centre.x),Math.floor(x.centre.y))))fails.push('survival '+i+' centre');
 const islands=r?r.cells.size-r.seen.size:0;if(islands>r.cells.size*.02)fails.push('survival '+i+' unreachable floor '+islands);
}
// mazes through the R103 entry point (uses R105 blueprints)
for(let i=1;i<EP.length;i++){const L=SM.layoutFor(i,'maze'),x=L.samongR103,r=reach(L,L.entry);mazes.push({i,cells:x.cols*x.rows,path:x.pathLength,dead:(x.deadEnds||[]).length,floor:L.floorCells.length});
 if(!r||!r.seen.has(r.key(Math.floor(x.exit.x),Math.floor(x.exit.y))))fails.push('maze '+i+' exit');}
const minFloor=Math.min(...surv.map(s=>s.floor)),minSpan=Math.min(...surv.map(s=>s.span));
check('survival arenas are wide fields (min floor '+minFloor+' cells, min span '+minSpan+')',minFloor>=1800&&minSpan>=90,JSON.stringify(surv.slice(0,4)));
check('survival arenas keep cover obstacles (bridges: broken spans)',surv.every(s=>s.pillars>=6||s.shape==='bridge'),JSON.stringify(surv.filter(s=>s.pillars<6)));
// R108: the R106 pins (>=144 rooms, >=10 dead ends) measured density, and density is what made the maze feel cramped. The maze is now a
// coarser grid (8-tile cells, 8x8..11x11) with 4-wide corridors, plazas, dead-end rooms and more loops. What must not shrink is the playable
// area and the dead-end rooms the three chests need; width, openness, walking distance and placement clearance are pinned in r108/maze-cpu-check.cjs.
const minMazeFloor=Math.min(...mazes.map(m=>m.floor)),minDead=Math.min(...mazes.map(m=>m.dead));
check('flashlight mazes stay large (min '+minMazeFloor+' floor tiles, ≥2600; R107 had 1885-3420 on 144-256 smaller rooms)',minMazeFloor>=2600,JSON.stringify(mazes.slice(0,4)));
check('flashlight mazes keep dead-end rooms for the chests (min '+minDead+', ≥3)',minDead>=3,JSON.stringify(mazes.map(m=>m.dead)));
check('every survival centre and maze exit reachable from the entry',!fails.length,fails.slice(0,5).join(' | '));
const src=fs.readFileSync(path.join(SRC,'samong-r103.js'),'utf8');
check('survival mobs move faster (×1.9, elite ×1.5) and attack sooner',/e\.speed=\(e\.speed\|\|1\)\*\(elite\?1\.5:1\.9\)/.test(src)&&/e\.cd=Math\.max\(0,e\.cd-dt\*\.6\)/.test(src)&&/x\.spawnAt=time\+\.3;const batch=Math\.min\(6/.test(src));
check('old saved positions off the new floor fall back to the entry',/pick=\[position,stage==='maze'&&S\.checkpoint\]\.find\(onFloor\)/.test(src));
console.log(JSON.stringify({checks:n,failed}));process.exitCode=failed?1:0;
