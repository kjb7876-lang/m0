'use strict';
// R1124: 배치 변경/해제의 자원 보존, 중간 자리 삭제 및 지연 시전 소유권 회귀.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../../client-source/hero-defense-r720.js'),'utf8');
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('ok',name);};
const HEROES=Object.fromEntries(['hwando','gunner','neon','lauren','hunter','slayer','seoha'].map(id=>[id,{name:id,range:8,interval:.5,type:'memory',color:'#bff3ea'}]));
function engine(){
 const el=()=>({style:{},classList:{add(){},remove(){}},appendChild(){},setAttribute(){}}),sv={here:true,starts:1};
 const c={console,HEROES,structuredClone,localStorage:{getItem:()=>null},document:{head:el(),body:el(),createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},addEventListener(){},
  started:true,modal:false,loading:false,storyScene:null,time:0,target:'main-target',command:{kind:'move',x:9,y:8},route:[{x:9,y:8}],
  player:{hero:'hwando',x:80,y:80,hp:100,level:1,upgrades:{},progressionR62:{},attackCD:0,attackAnim:0,skillAnim:0},
  room:{props:[],enemies:[],engaged:true,survivalR600:{centre:{x:50,y:50},arena:{x0:0,y0:0,x1:100,y1:100}}},
  late:[],delayed:[],panel:'',heroArt:Object.fromEntries(Object.keys(HEROES).map(id=>[id,{idle:{front:id+'.webp'}}])),
  ensureImages:async()=>{},heroPaths:id=>[id+'.webp'],urlFor:s=>s,toast(){},refreshIcons(){},drawProp(){},drawHero(){},killEnemy(){},hitEnemy:()=>true,makeShot:()=>({}),
  basicAttack(){},special(){},facing:()=> 'front',readyImage:()=>null};
 c.delay=(dt,fn)=>c.delayed.push({at:c.time+dt,fn});c.tick=dt=>{if(c.modal||c.loading)return;c.time+=dt;const due=c.delayed.filter(d=>d.at<=c.time);c.delayed=c.delayed.filter(d=>d.at>c.time);for(const d of due)d.fn();};
 c.openPanel=html=>{c.panel=html;c.modal=true;};c.closePanel=()=>{c.modal=false;};
 c.__STORYWORLD_SURVIVAL_R600__={here:()=>sv.here,state:()=>({phase:'pre',i:0,over:false,core:{stats:{range:5.5}}}),inspect:()=>({stats:{starts:sv.starts}})};
 c.window=c;vm.createContext(c);vm.runInContext(src,c);return {c,sv,A:c.__STORYWORLD_HERO_DEFENSE_R720__};
}
const {A}=engine(),P=A.pure,env={centre:{x:50,y:50},range:5.5},spots=[{x:52,y:50},{x:48,y:50},{x:50,y:52},{x:50,y:48}];
const filled=()=>{const s=P.fresh('hwando');s.crystals=10000;for(const id of ['gunner','neon','lauren','hunter','slayer'])P.doBuy(s,id,HEROES);['gunner','neon','lauren','hunter'].forEach((id,i)=>P.doPlace(s,id,spots[i],env));return s;};
check('full four slots can replace a deployed hero without changing main, ownership, position or upgrades',()=>{
 const s=filled();P.doUpgrade(s,1,'level');P.doUpgrade(s,1,'range');P.doUpgrade(s,1,'radius');const before=JSON.stringify({...s.slots[1],hero:null}),cash=s.crystals;
 assert.equal(P.doReplace(s,1,'slayer',HEROES).ok,true);assert.equal(s.slots.length,4);assert.equal(s.slots[1].hero,'slayer');assert.equal(JSON.stringify({...s.slots[1],hero:null}),before);assert.equal(s.crystals,cash);assert.equal(s.main,'hwando');assert.equal(s.owned.neon,true);
});
check('invalid replacement is atomic: missing, current, duplicate, unowned and unknown heroes rejected',()=>{
 const s=filled();for(const [i,id]of [[-1,'slayer'],[1.5,'slayer'],[99,'slayer'],[1,'hwando'],[1,'gunner'],[1,'neon'],[1,'seoha'],[1,'missing']]){const before=JSON.stringify(s);assert.equal(P.doReplace(s,i,id,HEROES).ok,false);assert.equal(JSON.stringify(s),before);}
});
check('remove refunds exactly all paid upgrades, preserves recruitment, and redeploy cannot duplicate refunds',()=>{
 const s=filled(),cash=s.crystals;let spent=0;for(const kind of ['level','range','radius'])for(let k=0;k<20;k++){const r=P.doUpgrade(s,1,kind);if(r.ok)spent+=r.paid;}
 assert.equal(P.upgradeRefund(s.slots[1]),spent);const r=P.doRemove(s,1);assert.equal(r.refund,spent);assert.equal(s.crystals,cash);assert.equal(s.owned.neon,true);assert.equal(s.slots.length,3);
 assert.equal(P.doPlace(s,'neon',spots[1],env).ok,true);assert.equal(s.slots[3].lv,1);assert.equal(P.doRemove(s,3).refund,0);assert.equal(s.crystals,cash);assert.equal(P.doRemove(s,3).ok,false);assert.equal(s.crystals,cash);
});
check('changing hero before removal refunds only the unchanged slot investment',()=>{
 const s=filled(),cash=s.crystals;P.doUpgrade(s,0,'range');P.doReplace(s,0,'slayer',HEROES);assert.equal(P.doRemove(s,0).refund,25);assert.equal(s.crystals,cash);assert.equal(s.owned.gunner,true);assert.equal(s.owned.slayer,true);
});
check('middle-slot removal preserves other bodies and cancels only the removed actor delayed work',()=>{
 const {A,c}=engine();A.qaGive(10000);for(const id of ['gunner','neon','lauren','hunter'])A.buy(id);['gunner','neon','lauren','hunter'].forEach((id,i)=>assert.equal(A.placeHere(id,spots[i]).ok,true));c.tick(.01);
 const bodies=A.bodies(),command=c.command,route=c.route;A.asHero('neon',()=>c.delay(.1,()=>c.late.push(c.player.hero)));A.asHero('lauren',()=>c.delay(.1,()=>c.late.push(c.player.hero)));
 assert.equal(A.remove(1).ok,true);assert.equal(A.bodies()[0],bodies[0]);assert.equal(A.bodies()[1],bodies[2]);assert.equal(A.bodies()[2],bodies[3]);assert.equal(bodies[1].r720Retired,true);assert.equal(bodies[1].hp,0);
 assert.deepEqual(c.room.props.map(p=>p.r720Slot),[0,1,2]);c.tick(.2);assert.deepEqual(c.late,['lauren']);assert.equal(c.player.hero,'hwando');assert.equal(c.command,command);assert.equal(c.route,route);
});
check('replacement invalidates old body callbacks and creates the new actor at the slot anchor',()=>{
 const {A,c}=engine();A.qaGive(10000);A.buy('gunner');A.buy('slayer');A.placeHere('gunner',spots[0]);c.tick(.01);const old=A.bodies()[0];A.asHero('gunner',()=>c.delay(.1,()=>c.late.push(c.player.hero)));
 assert.equal(A.replace(0,'slayer').ok,true);assert.equal(old.r720Retired,true);c.tick(.2);assert.equal(c.late.length,0);const body=A.bodies()[0];assert.notEqual(body,old);assert.equal(body.hero,'slayer');assert.equal(body.x,52);assert.equal(body.y,50);assert.equal(c.room.props.length,1);
});
check('base selected point and explicit position are used without moving or commanding main hero',()=>{
 const {A,c}=engine();A.qaGive(10000);A.buy('gunner');const original={x:c.player.x,y:c.player.y,command:c.command,route:c.route};c.__STORYWORLD_SURVIVAL_COMMAND_R1124__={placementPoint:()=>spots[0]};assert.equal(A.placeHere('gunner').ok,true);
 assert.equal(A.moveHere(0,spots[2]).ok,true);assert.equal(A.state().slots[0].ox,0);assert.equal(A.state().slots[0].oy,2);assert.equal(c.player.x,original.x);assert.equal(c.player.y,original.y);assert.equal(c.command,original.command);assert.equal(c.route,original.route);
});
check('deployment panel exposes separate replacement, removal/refund, and main hero swap controls',()=>{
 const {A,c}=engine();A.qaGive(10000);A.buy('gunner');A.buy('neon');A.placeHere('gunner',spots[0]);A.upgrade(0,'range');assert.equal(A.open(),true);
 assert.match(c.panel,/data-r720replace="0"/);assert.match(c.panel,/data-r720replacement="0"/);assert.match(c.panel,/data-r720remove="0"/);assert.match(c.panel,/강화 25 반환/);assert.match(c.panel,/직접 조종 영웅으로 교대/);assert.match(c.panel,/value="neon"/);assert.doesNotMatch(c.panel,/value="hwando"/);assert.match(c.panel,/강화 결정만 전액/);
});
check('other modes reject new actions and new runs reset recruitment and removed-slot refunds',()=>{
 const {A,c,sv}=engine();A.qaGive(10000);A.buy('gunner');A.placeHere('gunner',spots[0]);sv.here=false;assert.equal(A.remove(0).ok,false);assert.equal(A.replace(0,'neon').ok,false);sv.here=true;sv.starts++;c.tick(.01);assert.equal(A.state().slots.length,0);assert.equal(A.state().crystals,0);assert.equal(A.state().owned.gunner,undefined);
});
// R564 keeps its follow-ups in a private queue rather than the engine delay().
// Exercise the real overlay so removing/redeploying while the panel pauses time
// cannot move an old Q onto a newly created body with the same hero id.
function chronoEngine(){const f=engine(),c=f.c;Object.assign(c,{zoom:1,TILE:34,effects:[],projectiles:[],shots:[],
 liveEnemies:()=>c.room.enemies,nearestEnemy:()=>null,rank:()=>0,attackPower:()=>10,storyAim22:()=>0,fx(){},
 special(){if(!(c.player.specialCD>0)){c.player.specialCD=10;c.player.skillAnim=.6;}},
 makeShot(x,y,a,sp,dmg,opt){const shot={x,y,...opt};c.shots.push(shot);return shot;}});
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../client-source/seoha-chrono-r564.js'),'utf8'),c);return f;}
check('remove then immediately redeploy Seoha cancels the old private Q queue and permits a new cast',()=>{
 const {A,c}=chronoEngine();A.qaGive(10000);A.buy('seoha');assert.equal(A.placeHere('seoha',spots[0]).ok,true);c.tick(.01);
 const old=A.bodies()[0];assert.equal(A.qaCast(0,'q'),true);assert.equal(c.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().jobs,3);
 assert.equal(A.remove(0).ok,true);assert.equal(A.placeHere('seoha',spots[1]).ok,true);c.tick(.4);
 assert.equal(old.r720Retired,true);assert.notEqual(A.bodies()[0],old);assert.equal(c.shots.length,0);assert.equal(c.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().jobs,0);
 assert.equal(A.qaCast(0,'q'),true);c.tick(.4);assert.equal(c.shots.length,2);assert(c.shots.every(s=>s.x===spots[1].x&&s.y===spots[1].y));assert.equal(c.player.hero,'hwando');
});
check('removing a different hero leaves Seoha private Q follow-ups on their original body',()=>{
 const {A,c}=chronoEngine();A.qaGive(10000);A.buy('gunner');A.buy('seoha');A.placeHere('gunner',spots[0]);A.placeHere('seoha',spots[1]);c.tick(.01);
 const seoha=A.bodies()[1];assert.equal(A.qaCast(1,'q'),true);A.remove(0);c.tick(.4);
 assert.equal(A.bodies()[0],seoha);assert.equal(c.shots.length,2);assert(c.shots.every(s=>s.x===seoha.x&&s.y===seoha.y));assert.equal(c.player.hero,'hwando');
});
check('redeploy cancels Seoha pending R and releases projectiles held by the retired body',()=>{
 const {A,c}=chronoEngine(),chrono=c.__STORYWORLD_SEOHA_CHRONO_R564__;A.qaGive(10000);A.buy('seoha');A.placeHere('seoha',spots[0]);c.tick(.01);
 const cast=()=>A.asHero('seoha',()=>c.fx('storySourceSkill',c.player.x,c.player.y,{storyWER:true,stage:'warning',sourceHero:'seoha',sourceSlot:'r',castId:'r:'+c.time}));
 cast();A.remove(0);A.placeHere('seoha',spots[0]);c.tick(.2);assert.equal(chrono.inspect().stop,null);assert.equal(chrono.inspect().stats.stops,0);
 const shot={x:52,y:51,vx:2,vy:-1,life:3,owner:'enemy'};c.projectiles.push(shot);cast();c.tick(.2);assert(chrono.inspect().stop);assert.equal(shot.vx,0);assert.equal(shot.vy,0);
 A.remove(0);A.placeHere('seoha',spots[1]);c.tick(.01);assert.equal(chrono.inspect().stop,null);assert.equal(shot.vx,2);assert.equal(shot.vy,-1);assert.equal(chrono.inspect().heldShots,0);
});
console.log('R1124 slots:',checks,'checks passed');
