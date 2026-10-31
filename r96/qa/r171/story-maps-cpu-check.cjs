// R171 CPU 검사: 스토리 전투 지역별 서사 지도(story-maps-r171.js).
//  - 지역마다 원래 지형 자료(sourceTopology)에 맞는 배치 틀, 바닥 1,500~4,000칸.
//  - 문 셋(door-0 보스 구역 문 20,20 · door-1 앞방 문 · door-2 다음 구역 문 5,6)이 병동 미로와 같은 번호·자리.
//  - 4방향 BFS: 문이 닫혀 있을 때 입구 → 중앙 전투실(집결)은 이어지고 보스 전투실·다음 구역 문 앞·앞방은 닫혀 있다.
//    door-0 을 열면 보스 전투실, door-2 까지 열면 다음 구역 문 뒤, door-1 을 열면 앞방에 닿는다.
//  - 적 자리(두 갈래 길·집결·중간보스·보스)는 사방 한 칸이 바닥인 칸, 앞방(spawnExclude) 밖.
//  - 실제 777 진입(dist01·dist02·cult03)에서 살아 있는 적이 벽에 박히지 않는다.
//  - 끄기 설정 storyworld.r171.maps {on:false} 이면 아무 지역도 바꾸지 않는다.
// 실행: 빌드된 사이트(r96/hospital-three-pc/site)가 있어야 한다. CPU VM — 브라우저·GPU·자연 플레이 아님.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail:String(typeof detail==='string'?detail:JSON.stringify(detail)).slice(0,600)});};
(async()=>{
 const src=fs.readFileSync(R('r96/client-source/story-maps-r171.js'),'utf8'),html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8');
 check('runtime copy identical',fs.readFileSync(R('r96/runtime-text/story-maps-r171.js'),'utf8')===src);
 check('loaded right after dist/phase1.js',/dist\/phase1\.js[^"]*"><\/script>\s*<script src="\.\/story-maps-r171\.js"><\/script>/.test(html));
 check('listed in verify-r96-public.py',fs.readFileSync(R('scripts/verify-r96-public.py'),'utf8').includes("'story-maps-r171.js'"));

 // ---- 끄기 설정: 모듈만 따로 띄워 본다 ----
 {const store=new Map([['storyworld.r171.maps',JSON.stringify({on:false})]]);const sb={window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},Math,JSON,Object,Array,Number,String,Map,Set,Error};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:'story-maps-r171.js'});
  const M=sb.__STORYWORLD_STORY_MAPS_R171__;check('pref {on:false} disables every region',M&&M.prefs().on===false&&M.eligible('dist02','STORY')===false&&M.setPref({on:true}).reload===true&&JSON.parse(store.get('storyworld.r171.maps')).on===true);}

 const {createHarness}=require(R('r96/qa/harness.cjs'));const h=createHarness({timeoutMs:120000}),run=s=>h.run(s);
 const boot=await h.boot();check('native boot completes',boot.booted&&!boot.errors.length,boot.errors);
 const M=run('window.__STORYWORLD_STORY_MAPS_R171__');check('module installed',!!M&&run('__STORYWORLD_STORY_MAPS_R171__.revision')==='R171-story-maps-1'&&run('__STORYWORLD_STORY_MAPS_R171__.inspect().failures')===0,run('__STORYWORLD_STORY_MAPS_R171__.inspect()'));
 const rows=run(`(()=>{const M=__STORYWORLD_STORY_MAPS_R171__,P=StoryWorldProfilesR74.profiles,out=[];
  for(const id of Object.keys(regionById)){const d=regionById[id];if(d.safe||!P[id])continue;const L=__STORYWORLD_EXPLORATION__.layout(id,'STORY');
   const row={id,eligible:M.eligible(id,'STORY'),type:L?.type,topology:P[id].sourceTopology,mode:P[id].mode};
   if(L?.storyMapR171){const S=L.storyMapR171,g=L.worldWardR81,cells=new Set(L.floorCells.map(c=>c[0]+':'+c[1]));
    Object.assign(row,{template:S.template,expected:(M.TOPO[P[id].sourceTopology]||[P[id].mode==='indoor'?'ward':'grove'])[0],cells:L.floorCells.length,bounds:L.bounds,
     doors:L.worldR74.doors.map(d=>({id:d.id,x:d.x,y:d.y,width:d.width,depth:d.depth,axis:d.axis})),bossDoorId:L.bossDoorId,entry:L.entry,gather:g.gatherAnchor,boss:g.bossAnchor,next:g.portalNext,bossBounds:g.bossBounds,
     closet:L.nodes[S.closet]?{x:L.nodes[S.closet].x,y:L.nodes[S.closet].y}:null,spawnExclude:L.spawnExclude,
     spots:[...g.routeSpawns['1'],...g.routeSpawns['2'],...g.rallySpots,...g.fieldAnchors,...g.bossPoints],floor:[...cells],
     again:JSON.stringify(M.build(id,null,P[id]).floorCells)===JSON.stringify(L.floorCells)});}
   out.push(row);}return out;})()`);
 const NATIVE=['hando01','hando02','hando03','kair02','kair03','last301','cult04'];
 const maps=rows.filter(r=>r.type==='r171-story-narrative-map');
 check('every eligible story region uses an R171 map ('+maps.length+')',maps.length>=40&&rows.every(r=>r.eligible===(r.type==='r171-story-narrative-map')),rows.filter(r=>r.eligible!==(r.type==='r171-story-narrative-map')).map(r=>r.id));
 check('native-owner regions and the hospital keep their own layout',rows.filter(r=>NATIVE.includes(r.id)||r.id==='ep1a08').every(r=>r.type!=='r171-story-narrative-map'));
 check('template follows the region source topology',maps.every(r=>r.template===r.expected),maps.filter(r=>r.template!==r.expected).map(r=>r.id+':'+r.topology+'→'+r.template));
 check('several templates are in use (not one shared maze)',new Set(maps.map(r=>r.template)).size>=8,[...new Set(maps.map(r=>r.template))]);
 check('floor cells within 1,500–4,000 and bounds 68×70',maps.every(r=>r.cells>=1500&&r.cells<=4000&&JSON.stringify(r.bounds)==='[0,0,68,70]'),maps.map(r=>r.id+':'+r.cells));
 check('layout is deterministic per region',maps.every(r=>r.again),maps.filter(r=>!r.again).map(r=>r.id));
 const doorOK=r=>r.bossDoorId==='door-0'&&r.doors.map(d=>d.id).join()==='door-0,door-1,door-2'&&r.doors[0].x===20&&r.doors[0].y===20&&r.doors[0].width===6&&r.doors[2].x===5&&r.doors[2].y===6&&r.doors[2].width===8;
 check('three doors with the ward ids and positions (boss 20,20 · exit 5,6)',maps.every(doorOK),maps.filter(r=>!doorOK(r)).map(r=>r.id));
 // BFS: 닫힌 문은 문 선을 건너는 칸 이동을 막는다(axis y 문: y 선, x 구간).
 function reach(r,open){const cells=new Set(r.floor),closed=r.doors.filter(d=>!open.includes(d.id)),cross=(x,y,nx,ny)=>closed.some(d=>d.axis==='y'&&x===nx&&Math.max(y,ny)===d.y&&x>=d.x-d.width/2&&x<d.x+d.width/2);
  const k=(x,y)=>x+':'+y,s=k(Math.floor(r.entry.x),Math.floor(r.entry.y)),seen=new Set([s]),q=[s];
  for(let i=0;i<q.length;i++){const[x,y]=q[i].split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=k(x+dx,y+dy);if(cells.has(n)&&!seen.has(n)&&!cross(x,y,x+dx,y+dy)){seen.add(n);q.push(n);}}}
  return p=>seen.has(k(Math.floor(p.x),Math.floor(p.y)));}
 const bfs=maps.map(r=>{const c=reach(r,[]),b=reach(r,['door-0']),e=reach(r,['door-0','door-2']),o=reach(r,['door-1']);
  return{id:r.id,entryGather:c(r.gather),closedBoss:!c(r.boss),closedNext:!c({x:5,y:8})&&!c(r.next),closedCloset:!c(r.closet),bossOpen:b(r.boss)&&b({x:20,y:12})&&b({x:5,y:8})&&!b(r.next),exitOpen:e(r.next),closetOpen:o(r.closet),spotsReach:r.spots.filter(p=>!(p.x>=r.bossBounds[0]&&p.x<r.bossBounds[2]&&p.y>=r.bossBounds[1]&&p.y<r.bossBounds[3])).every(c)};});
 const bad=k=>bfs.filter(b=>!b[k]).map(b=>b.id);
 check('BFS entry → gathering room with every door closed',!bad('entryGather').length,bad('entryGather'));
 check('closed doors seal the boss room, the exit and the side room',!bad('closedBoss').length&&!bad('closedNext').length&&!bad('closedCloset').length,{boss:bad('closedBoss'),next:bad('closedNext'),closet:bad('closedCloset')});
 check('door-0 opens the boss room (and its exit yard); door-2 then reaches the next-region alcove',!bad('bossOpen').length&&!bad('exitOpen').length,{boss:bad('bossOpen'),exit:bad('exitOpen')});
 check('door-1 opens the side room',!bad('closetOpen').length,bad('closetOpen'));
 check('every field spawn spot is reachable from the entry with doors closed',!bad('spotsReach').length,bad('spotsReach'));
 const solid3=(set,x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!set.has((x+dx)+':'+(y+dy)))return false;return true;};
 const spotBad=maps.map(r=>{const set=new Set(r.floor);return{id:r.id,bad:r.spots.filter(p=>!solid3(set,Math.floor(p.x),Math.floor(p.y))||(r.spawnExclude||[]).some(b=>p.x>=b[0]&&p.x<b[2]&&p.y>=b[1]&&p.y<b[3]))};}).filter(r=>r.bad.length);
 check('enemy spots stand on cells whose eight neighbours are floor, outside the side room',!spotBad.length,spotBad.slice(0,5));
 // ---- 실제 777 진입 ----
 await run("newGame('hwando')");run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');await run("__STORYWORLD_CHEAT777__.activate('777')");
 const live=[];for(const id of ['dist01','dist02','cult03']){h.context.r171Zone=id;await run("__STORYWORLD_CHEAT777__.go(r171Zone,'STORY')");if(run('__STORYWORLD_PROGRESSION_R71__.difficultyState().open')){run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')");await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()');}
  run('for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');
  live.push(run(`(()=>{const L=room.exploration;return{id:zone,type:L.type,hero:!blocked(player.x,player.y,.34,room),alive:room.enemies.filter(e=>e.hp>0).length,champions:room.enemies.filter(e=>e.wardChampionR81).length,unsafe:room.enemies.filter(e=>e.hp>0&&StoryPhase1.explorationBlocked(L,e.x,e.y,e.combatProfile?.bodyBlock?.r||.3)).map(e=>e.id),inCloset:room.enemies.filter(e=>e.hp>0&&(L.spawnExclude||[]).some(b=>e.x>=b[0]&&e.x<b[2]&&e.y>=b[1]&&e.y<b[3])).map(e=>e.id),gather:findPath(player,L.worldWardR81.gatherAnchor,room,.31).length>0,boss:findPath(player,L.worldWardR81.bossAnchor,room,.31).length===0,phase:__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase};})()`));}
 check('777 entry: R171 map, safe hero, gathering room reachable, boss room locked',live.every(r=>r.type==='r171-story-narrative-map'&&r.hero&&r.gather&&r.boss&&r.phase==='route'),live);
 check('777 entry: no living enemy (champions included) embedded in walls or parked in the side room',live.every(r=>r.alive>0&&r.champions>0&&!r.unsafe.length&&!r.inCloset.length),live);
 check('native error ledger stays clear',run('errors.length')===0,run('[...errors]'));
 const failed=results.filter(r=>!r.ok);for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
 console.log(JSON.stringify({checks:results.length,failed:failed.length,browser:false,GPU:false}));
 fs.writeFileSync(path.join(__dirname,'story-maps-cpu-results.json'),JSON.stringify({revision:'r171-story-maps-cpu',results,passed:!failed.length,browser:false,GPU:false},null,1));
 process.exit(failed.length?1:0);
})().catch(e=>{console.error(e.stack);process.exit(1);});
