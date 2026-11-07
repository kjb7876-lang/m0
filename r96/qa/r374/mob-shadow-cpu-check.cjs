'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const dir=path.join(__dirname,'../../client-source'),src=n=>fs.readFileSync(path.join(dir,n),'utf8');
const source=src('mob-shadow-r374.js');let checks=0;
const run=(c,s)=>vm.runInContext(s,c),A=c=>c.__STORYWORLD_MOB_SHADOW_R374__;
function check(name,f){f();checks++;console.log('PASS '+name)}
function world({legacy=[],overlay=true}={}){
 const c={console,localStorage:{getItem:()=>null,setItem:()=>{}},queue:[],setTimeout:()=>1};c.window=c;c.requestAnimationFrame=cb=>{c.queue.push(cb);return c.queue.length};vm.createContext(c);
 run(c,`var time=10,started=true,loading=false,modal=null,storyScene=null,zone='dist02',layer='STORY';
 var player={x:0,y:0,hp:777},room={enemies:[]},wall=null,draws=[],shots=[],baseDT=0,calls=0,blockedCalls=0;
 var e={id:'a',nativeId:'dist02-g1',name:'몹',hp:100,maxHp:100,x:6,y:0,damage:12,speed:2,spawnState:'active',moving:true,combatProfile:{aggro:8,bodyBlock:{r:.3},attackShape:{range:1.2,windup:.4,active:.15,recovery:.35}},path:'body.png',profile:{frames:{}}};room.enemies=[e];
 var track={attack:{path:'attack.png',frames:4}},sheet=null,coop='off',stationaryTick=false;
 window.__STORYWORLD_MOBS_R109__={trackFor:()=>track,inspect:()=>({state:'ready'}),prefs:()=>({frames:true})};
 window.__STORYWORLD_MOB_UNIQUE_R248__={sheetFor:()=>sheet,inspect:()=>({prefs:{on:true}}),baseName:n=>n};
 window.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 window.__STORYWORLD_HOSPITAL_MOTION_R53__={canPrepare:()=>true};
 function blocked(x,y,r){blockedCalls++;return !!wall&&x+r>wall[0]&&x-r<wall[1]&&Math.abs(y)<5}
 function clearLine(){return true}function facing(dx){return dx<0?'left':'right'}
 function enemyShot(e,a,v,d,o){shots.push({a,v,d,o});return shots.at(-1)}
 function project(x,y){return{x:(x-y)*32,y:(x+y)*16}}function actorHeight(){return 60}
 function drawEnemy(e){draws.push({x:e.x,y:e.y,path:e.path,moving:e.moving,attack:e.attack})}
 function moveAI3(e,goal,dt){baseDT+=dt;calls++;const d=Math.hypot(goal.x-e.x,goal.y-e.y),step=Math.min(d,e.speed*dt),x=e.x+(goal.x-e.x)/d*step,y=e.y+(goal.y-e.y)/d*step;e.moving=false;if(d>.01&&!blocked(x,y,e.combatProfile.bodyBlock.r)){e.moveDX=x-e.x;e.moveDY=y-e.y;e.x=x;e.y=y;e.moving=true}}
 function tick(dt){time+=dt;if(!stationaryTick&&!e.attack&&!e.rangedWindup&&!e.rest&&e.hp>0)moveAI3(e,player,dt)}
 `);
 for(const name of legacy)run(c,src(name));if(overlay)run(c,source);return c;
}
const eq=assert.strictEqual;
check('gather holds, burst moves with existing path',()=>{const c=world();run(c,'for(let i=0;i<10;i++)tick(1/60)');eq(c.e.x,6);run(c,'tick(1/60);tick(1/60)');assert(c.e.x<6);assert(A(c).inspect().stats.bursts>0)});
check('uninterrupted cycle conserves movement budget and speed stat',()=>{const c=world();run(c,'for(let i=0;i<22;i++)tick(1/60)');assert(Math.abs(c.baseDT-22/60)<1e-8);assert(Math.abs(c.e.x-(6-2*22/60))<1e-8);eq(c.e.speed,2);eq(c.e.damage,12)});
check('idle-only and static actors also use short bursts',()=>{for(const t of [{idle:{path:'i',frames:4}},null]){const c=world();c.track=t;run(c,'for(let i=0;i<10;i++)tick(1/60)');eq(c.e.x,6);run(c,'for(let i=0;i<12;i++)tick(1/60)');assert(c.e.x<6)}});
check('full and move-only actors retain continuous locomotion',()=>{for(const t of [{move:{frames:8},attack:{}},{move:{frames:8}}]){const c=world();c.track=t;run(c,'tick(1/60)');assert(c.e.x<6);eq(A(c).kindOf(c.e),null)}});
check('new walk sheet immediately disables fallback',()=>{const c=world();run(c,'tick(1/60);sheet={path:"walk"};tick(1/60)');eq(A(c).kindOf(c.e),null);assert(c.e.x<6)});
check('lazy R363 walk assignment is recognized before first draw',()=>{const c=world();c.__STORYWORLD_MOB_LEGACY_R363__={rows:{x:{nativeId:c.e.nativeId,name:c.e.name}},inspect:()=>({prefs:{on:true}})};eq(A(c).kindOf(c.e),null)});
check('pixel mode, unknown native walk and hospital preserved',()=>{for(const expr of ['__STORYWORLD_MOB_ART_VARIANTS_R306__={inspect:()=>({mode:"pixel"})}','track=null;e.profile.frames={idle:{path:"i"},move:{path:"m"}}','zone="ep1a08"']){const c=world();run(c,expr);eq(A(c).kindOf(c.e),null)}});
check('all fixed and major flags excluded',()=>{for(const key of ['stationary','r75Tower','r170Tower','turret','rooted','immobile','r251Circle','r193Doll','r74Monster','boss','midboss','persona','cosmic','trial','samongBoss']){const c=world();c.e[key]=true;eq(A(c).kindOf(c.e),null)}});
check('name-only miniboss, zero speed and hidden excluded',()=>{for(const expr of ['e.name="중간보스 · 몹"','e.elite="boss"','e.speed=0','e.spawnState="hidden"','e.visible=false']){const c=world();run(c,expr);eq(A(c).kindOf(c.e),null)}});
check('render-only gather and burst stay before the real strike frame',()=>{const c=world();run(c,'for(let i=0;i<5;i++)tick(1/60);drawEnemy(e)');assert(c.draws[0].attack.elapsed<.4);eq(c.e.attack,undefined);run(c,'for(let i=0;i<9;i++)tick(1/60);drawEnemy(e)');assert(c.draws[1].attack.elapsed<.4);assert(c.draws[1].attack.elapsed>c.draws[0].attack.elapsed);eq(c.e.attack,undefined);eq(c.shots.length,0)});
check('real attacks and hits are not replaced with fake poses',()=>{for(const [k,v]of [['attack',{id:7}],['hitTimer',.2],['rangedWindup',.2]]){const c=world();run(c,'tick(1/60)');c.e[k]=v;run(c,'drawEnemy(e)');eq(c.draws[0].attack,c.e.attack)}});
check('existing R286/R268 actions keep their own motion',()=>{for(const expr of ['e.r286={mode:"charge"}','e.r286={mode:"dash"}','e.r268Dash={}']){const c=world();run(c,'tick(1/60);'+expr+';drawEnemy(e)');eq(A(c).motion(c.e),null)}});
check('render exceptions restore actor attack/moving state',()=>{const c=world({overlay:false});run(c,'drawEnemy=()=>{throw Error("fixture")};');run(c,source);run(c,'tick(1/60)');const moving=c.e.moving;assert.throws(()=>run(c,'drawEnemy(e)'));eq(c.e.attack,undefined);eq(c.e.moving,moving)});
check('pause, clock rewind and room changes discard motion credit',()=>{for(const expr of ['modal=true','loading=true','storyScene={}','time=0','room={enemies:[e]}']){const c=world();run(c,'for(let i=0;i<5;i++)tick(1/60);stationaryTick=true;'+expr+';tick(1/60)');eq(A(c).motion(c.e),null)}});
check('combat interrupts credit without a delayed post-attack lunge',()=>{const c=world();run(c,'for(let i=0;i<10;i++)tick(1/60);e.attack={};tick(1/60);e.attack=null;tick(1/60)');eq(c.e.x,6);assert(A(c).motion(c.e).credit<.02)});
check('long inactivity resets movement credit',()=>{const c=world();run(c,'for(let i=0;i<10;i++)tick(1/60);time+=1;tick(1/60)');eq(c.e.x,6);assert(A(c).motion(c.e).credit<.02)});
check('coop/disabled path passes through unchanged',()=>{for(const off of [false,true]){const c=world();if(off)A(c).set(false);else c.coop='guest';run(c,'tick(1/60)');assert(c.e.x<6);eq(A(c).motion(c.e),null)}});
check('no save schema or new enemy fields for motion state',()=>{const c=world();run(c,'e.moveDX=0;e.moveDY=0;e.attack=undefined');const keys=Object.keys(c.e).sort().join();run(c,'for(let i=0;i<22;i++)tick(1/60);drawEnemy(e)');eq(Object.keys(c.e).sort().join(),keys);assert(!JSON.stringify(c.e).includes('r374'))});
check('blocked direct path cannot blink to a free endpoint',()=>{const c=world();run(c,'wall=[3.6,4.4]');assert(!A(c).canRelocate(c.e,{x:2.8,y:0}));eq(c.e.x,6)});
check('full body radius, diagonal corner and path bound enforced',()=>{const c=world();run(c,'e.combatProfile.bodyBlock.r=.6;wall=[4,4.1]');assert(!A(c).canRelocate(c.e,{x:4.5,y:0}));run(c,'blocked=(x,y,r)=>Math.abs(x-5)<r&&Math.abs(y-1)<r');assert(!A(c).pathSafe(c.e,{x:6,y:0},{x:4,y:2}));assert(!A(c).pathSafe(c.e,{x:6,y:0},{x:1000,y:0}))});
check('player and other actor arrival overlap rejected',()=>{const c=world();assert(!A(c).canRelocate(c.e,{x:.1,y:0}));run(c,'room.enemies.push({...e,id:"b",x:3,y:0})');assert(!A(c).canRelocate(c.e,{x:3,y:0}));assert(A(c).canRelocate(c.e,{x:4,y:0}))});
check('unavailable collision fails closed for targeted relocations',()=>{const c=world();run(c,'blocked=undefined');assert(!A(c).canRelocate(c.e,{x:3,y:0}))});
check('ordinary actor movement does not invoke destination population scan',()=>{const c=world();run(c,'for(let i=0;i<22;i++)tick(1/60)');eq(A(c).inspect().stats.admitted,0)});
check('R230 public flank respects wall hook and preserves no-hook behavior',()=>{for(const overlay of [false,true]){const c=world({legacy:['mob-flank-r230.js'],overlay});run(c,'e.x=2;e.y=2;wall=[1.1,1.5]');const moved=c.__STORYWORLD_MOB_FLANK_R230__.flank(c.e);eq(moved,!overlay);if(overlay){eq(c.e.x,2);eq(c.e.y,2)}}});
check('R268 direct relocation respects wall hook',()=>{const c=world({legacy:['mob-gaze-r268.js']});run(c,'e.x=2;e.y=2;wall=[1.1,1.5]');eq(c.__STORYWORLD_MOB_GAZE_R268__.relocate(c.e),false);eq(c.e.x,2)});
check('R268 private RAF loop respects hook, not only exported function',()=>{const c=world({legacy:['mob-gaze-r268.js']});run(c,'e.x=2;e.y=2;wall=[1.1,1.5];stationaryTick=true');for(let i=0;i<10;i++){run(c,'time+=.11');c.queue.shift()();}eq(c.e.x,2);eq(c.e.y,2);assert(A(c).inspect().stats.blocked>0)});
check('R268 clear relocation remains allowed',()=>{const c=world({legacy:['mob-gaze-r268.js']});run(c,'e.x=2;e.y=2');eq(c.__STORYWORLD_MOB_GAZE_R268__.relocate(c.e),true);assert(c.e.x!==2)});
check('R286 blocked dash cannot use old wall-blink fallback',()=>{const c=world({legacy:['mob-motion-r286.js']});run(c,'wall=[3.6,4.4];e.r286={mode:null,nextDash:0,nextShot:999,side:1};for(let i=0;i<60;i++)tick(1/60)');assert(c.e.x>4.4);eq(c.__STORYWORLD_MOB_MOTION_R286__.inspect().stats.blinks,0);assert(A(c).inspect().stats.blocked>0)});
check('R286 closed door during dash checked before moving',()=>{const c=world({legacy:['mob-motion-r286.js']});run(c,'stationaryTick=true;e.r286={mode:"dash",t0:time,fx:6,fy:0,tx:3,ty:0,trail:0};wall=[4.8,5.1];tick(.15)');eq(c.e.x,6);eq(c.e.r286.mode,null)});
check('R286 clear dash remains functional',()=>{const c=world({legacy:['mob-motion-r286.js']});run(c,'e.r286={mode:null,nextDash:0,nextShot:999,side:1};for(let i=0;i<60;i++)tick(1/60)');assert(c.e.x<4);eq(c.e.damage,12)});
check('bounded sweep cost',()=>{const c=world();run(c,'blockedCalls=0');A(c).pathSafe(c.e,{x:6,y:0},{x:6,y:10});assert(c.blockedCalls<=129)});
check('no added effects, paid API, save writer or damage calls',()=>{assert(!/fetch\(|XMLHttpRequest|saveGame\(|hitEnemy\(|hurt\(|makeShot\(|\.play\(/.test(source))});
console.log(JSON.stringify({ok:true,checks}));
