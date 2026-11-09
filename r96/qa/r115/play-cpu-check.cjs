// R115 CPU checks: 전투·화면 다듬기(play-r115.js)와 그에 맞춘 기존 오버레이 수정. 브라우저 없이 소스와 순수 함수를 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source'),read=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const P=read('play-r115.js');
for(const f of ['play-r115.js','play-r113.js','polish-r101.js','fx-d2s-r106.js','vfx-r98.js','hero-fx-r102.js','samong-zones-r115.js'])
 {let ok=true,err='';try{new vm.Script(read(f),{filename:f});}catch(e){ok=false;err=String(e);}check(f+' parses',ok,err);}
const html=fs.readFileSync(path.join(SRC,'..','runtime-text','index.html'),'utf8');
check('play-r115 loads after cinema-r114 (last combat overlay)',html.indexOf('play-r115.js')>html.indexOf('cinema-r114.js')&&html.indexOf('cinema-r114.js')>0);
check('zone data loads before the zone module',html.indexOf('samong-zones-r115-data.js')>0&&html.indexOf('samong-zones-r115-data.js')<html.indexOf('samong-zones-r115.js"'));
// ① 타격 중심
check('enemy draw measures the drawn body (opaque box, transform-mapped)',/function opaqueBox/.test(P)&&/getImageData/.test(P)&&/inverse\(\)\.multiply/.test(P));
check('hero hit FX use the measured centre',/centreOf\?\.\(e\.tgt\)/.test(read('polish-r101.js'))&&/tgt:e/.test(read('polish-r101.js'))&&/__STORYWORLD_PLAY_R115__\?\.place\?\./.test(read('fx-d2s-r106.js'))&&/centreOf\?\.\(e\.target\)/.test(read('vfx-r98.js'))&&/e568HeroImpact'&&f\.targetIdE568/.test(P));
// place() 수학: 발밑에서 z/키 비율만큼 실제 그림 높이로
{const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,head:{appendChild(){}},createElement:()=>({})},tick(){},drawEnemy(){},DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}},console,Math,JSON,Object,Array,Number,String,Boolean,Set,Map,WeakMap,WeakSet,RegExp,Error};
 sb.window=sb;vm.createContext(sb);vm.runInContext(P,sb);const A=sb.__STORYWORLD_PLAY_R115__;check('module exposes centreOf/place/sinkOf',A&&typeof A.place==='function'&&typeof A.sinkOf==='function');
 check('props sink 4–6%, wall-hung/door/chest/record markers never sink',A.sinkOf({id:'prop:statue:1'},{})>=.04&&A.sinkOf({id:'prop:statue:1'},{})<=.06&&A.sinkOf({id:'wall-torch:3'},{})===0&&A.sinkOf({id:'x'},{samongR103:'record'})===0&&A.sinkOf({id:'r115:door'},{})===0);}
check('play-r113 grounding buries the base (crops the source rect under the ground line)',/sinkOf\?\.\(owner,p\)/.test(read('play-r113.js'))&&/c\.sourceRect=\[r\[0\],r\[1\],r\[2\],r\[3\]\*sink\.keep\]/.test(read('play-r113.js')));
// ② 보스 조준
check('boss floor attacks: one of each new batch aims at the hero\'s lead position',/function aimTick/.test(P)&&/major\(o\)/.test(P)&&/best\.x=px;best\.y=py/.test(P));
// ③ 보조
check('semi-auto/guide dodges telegraphs, ranged kite, melee side-step, W/E/R auto',/inThreat\(player\.x,player\.y/.test(P)&&/stats\.kites\+\+/.test(P)&&/stats\.sidesteps\+\+/.test(P)&&/wer\.cast\(slot,true\)/.test(P)&&/!steering\(\)/.test(P));
check('assist never overrides the player\'s own movement and never steers in co-op',/steering\(\)/.test(P)&&/solo\(\)/.test(P));
check('guide presses E on arrival at clue/statement/door, never while the player steers',/function reachTick/.test(P)&&/g\.kind!=='objective'&&g\.kind!=='exit'/.test(P)&&/steering\(\)\)return;if\(!room\?\.samongR103\)/.test(P));
// ④ 간격
check('mobs keep a size-based gap, bosses/patrols untouched',/rad\(a\)\+rad\(b\)\+\.42/.test(P)&&/!major\(e\)&&!e\.samongPatrolR115/.test(P));
// ⑥ 빛
check('shadows fall behind objects (light from the viewer)',/y-len\*\.42\*\.55/.test(P)&&/frontLight/.test(P));
// ⑦ 사몽선
check('사몽 lines: 3 in 4 rerouted through dense clusters, weighted, rest random',/r<\.25\)continue/.test(P)&&/Math\.pow\(c\.n,1\.4\)/.test(P)&&/runs\.length=0;runs\.push/.test(P));
// ⑧ 강화 모음
check('skill-upgrade collection: groups, levels, +1 buttons, tier/W/E/R bars, view toggle',/스킬 강화 모음/.test(P)&&/data-r115up/.test(P)&&/data-r115view/.test(P)&&/r115bar/.test(P));
// ⑨ 벽
check('non-samong walls: R452 one wall top (old varied/door-spike rule only when storyworld.r452.walls is off)',/r452Flat&&room\?\.id!=='ep1a08'\)h=Math\.max\(h0,DOOR\+\.15\)/.test(P)&&/DOOR\+\.45/.test(P)&&/L\.samongR103\|\|L\.samongR115/.test(P));
// R413: 벽 높이는 3D 벽을 짓기 전에(draw 앞) 정하고, 높이가 바뀐 벽의 묵은 모양은 다시 쓰지 않는다
{const seen=[];const t={idleGeometry:new Map(),idleGeometryBytes:20,geometryBytes:()=>10,activated:0,activateTerrain(row){this.activated++;}};
 const geo=h=>{const g={disposed:false,boundingBox:{min:{y:-h/2},max:{y:h/2}},dispose(){this.disposed=true;}};return g;};
 const L={walls:[{id:'w1',x:1,y:1,width:2,depth:.24,height:1.3},{id:'w2',x:12,y:12,width:2,depth:.24,height:2.7},{id:'w3',x:20,y:20,width:2,depth:.24,height:3.4}],doors:[{x:1,y:1.6}]};
 const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,head:{appendChild(){}},createElement:()=>({})},tick(){},drawEnemy(){},
  draw(){seen.push(L.walls.map(w=>w.height));},started:true,player:{x:0,y:0,hp:1},room:{id:'x',exploration:L,props:[],enemies:[]},
  DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}},console,Math,JSON,Object,Array,Number,String,Boolean,Set,Map,WeakMap,WeakSet,RegExp,Error};
 sb.window=sb;sb.window.__STORYWORLD_PHASE1__={controller:{state:{three:t}}};vm.createContext(sb);vm.runInContext(P,sb);const A=sb.__STORYWORLD_PLAY_R115__;
 sb.draw();const first=seen[0]||[];
 check('R413/R452: walls are raised before the first 3D draw builds them (not on a later tick), all to one top (2.85, taller walls kept, no jitter / door spikes)',first.length===3&&first[0]===2.85&&first[1]===2.85&&first[2]===3.4&&first[2]===L.walls[2].height&&L.walls[0].r115Wall===1.3&&L.walls[1].r115Wall===2.7,JSON.stringify(first));
 const old=geo(1.3),ok=geo(L.walls[1].height);t.idleGeometry.set('wall:w1',old);t.idleGeometry.set('wall:w2',ok);
 t.activateTerrain({descriptor:{terrain:L.walls}});
 check('R413: a cached wall shape built at the old height is dropped so the engine rebuilds it (no floating wall); fitting shapes are kept',
  !t.idleGeometry.has('wall:w1')&&old.disposed&&t.idleGeometry.get('wall:w2')===ok&&!ok.disposed&&t.activated===1&&t.idleGeometryBytes===10&&A.inspect().stats.staleWallShapes===1,JSON.stringify(A.inspect().stats));
 sb.draw();check('R413: the activateTerrain guard is installed once per renderer',t.activated===1&&typeof A.wallFit==='function');}
check('R115 revision bumped for the R413 wall-timing fix',/R115-play-2/.test(P));
// R102 바닥 연출 병용
check('first ground-changing skill FX kept alongside D2S (mixed by situation)',/r115Mix/.test(read('hero-fx-r102.js'))&&/n>=3\|\|t>=5/.test(read('hero-fx-r102.js')));
// 방향
check('facing: bosses face the hero across 2× rooms',/major\(e\)\?22:10/.test(read('play-r113.js')));
check('no damage/HP/cooldown numbers changed by play-r115',!/\.damage\s*=|maxHp\s*=|CD\s*=/.test(P));
const failed=results.filter(r=>!r.ok);console.log(JSON.stringify({checks:results.length,failed:failed.length}));process.exitCode=failed.length?1:0;
