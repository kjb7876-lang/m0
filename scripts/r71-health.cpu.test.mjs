import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {test} from 'node:test';

const helper=fs.readFileSync(new URL('../client-source/health-r71.js',import.meta.url),'utf8');
const sourcePath=new URL('../_r70/docs/index.html',import.meta.url);
const baseline=fs.readFileSync(sourcePath,'utf8');
const pyTransform=`import importlib.util,sys\nspec=importlib.util.spec_from_file_location('health_r71','scripts/health-r71.py')\nm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\nsys.stdout.write(m.transform_html(sys.stdin.read()))`;

function fixture({coopFacade=false}={}){
 const window={},effects=[],enemy={id:'enemy-boss',boss:true,x:15,y:14,maxHp:12345,hp:12345,difficultyBaseHpR63:12345,difficultyFactorR63:1};
 let player={id:'local',hero:'hwando',x:15,y:15,hp:193,level:5,upgrades:{vital:2},progressionR62:{ranks:{endlessVital:2}},healthR71Applied:false,invincible:0};
 let time=0,mode='off',zone='arena',layer='STORY',room={id:zone,layer,enemies:[enemy]};
 const context={window,console,Math,Number,JSON,Map,Set,WeakMap,Promise,
  performance:{now:()=>0},
 };
 vm.createContext(context);
 const code=`(()=>{'use strict';
  let activeActor=globalThis.__fixture.player,time=0,zone='arena',layer='STORY',room={id:'arena',layer,enemies:[globalThis.__fixture.enemy]},effects=[];
  let mode='off';const regions=[],UPGRADES=[{id:'vital',text:'',max:6}],MAX=100000;
  const playerFacade=new Proxy({}, {get(_t,k){if(k==='__coopFacadeR62')return true;if(k==='toJSON')return()=>activeActor;return activeActor?.[k]},set(_t,k,v){if(activeActor)activeActor[k]=v;return true;}});
  let player=globalThis.__fixture.coopFacade?playerFacade:activeActor;
  const window=globalThis.window,register=()=>({}),ensureImages=()=>Promise.resolve([]),warn=()=>{},readyImage=()=>({image:{}});
  const progression=window.__STORYWORLD_PROGRESSION_R62__={defs:[{id:'endlessVital',text:'',maxRank:100}],ranks:(id,p=player)=>Number(p?.progressionR62?.ranks?.[id]||0)};
  const withPlayer=(p,fn)=>{const oldActor=activeActor,oldPlayer=player;activeActor=p;if(!globalThis.__fixture.coopFacade)player=p;try{return fn()}finally{activeActor=oldActor;player=oldPlayer;}};
  window.__STORYWORLD_COOP_SIM_R62__={mode:()=>mode,withPlayer,currentPlayer:()=>activeActor,players:()=>[activeActor,...(globalThis.__fixture.extraActors||[])]};
  function maxHP(){return 260+35*Number(player?.upgrades?.vital||0)+5*(Number(player?.level||1)-1)+18*progression.ranks('endlessVital',player)}
  function freshPlayer(){return{hero:'hwando',hp:260,level:1,upgrades:{}}}
  function scaleEnemy(e){const factor=Number(e?.difficultyFactorR63)||1,base=Number(e?.difficultyBaseHpR63)||e?.maxHp;if(!e)return false;const f=Number(e.hp)/Number(e.maxHp);e.difficultyBaseHpR63=base;e.maxHp=base*factor;e.hp=e.maxHp*f;return true}
  function actor3(def,id){return{id,boss:true,maxHp:1000,hp:1000}}
  function makeRoom(id){return{id,layer,enemies:[]}}
  function summon3(){return true}
  function fx(type,x,y,options={}){const e={type,x,y,...options,age:0,life:options.life||.3};if(mode!=='off')e.coopPlayerR62=activeActor?.coopIdR62;effects.push(e);return e}
  function project(x,y){return{x:x*20,y:y*20}}
  function actorHeight(){return 10}
  function drawEffect(e){if(!e?.r52Blood)return{drawn:false};const age=time-e.r52At;if(e.r52Cancelled||e.r52Player!==player||e.r52Room!==room||age<0||age>=e.life)return{drawn:false,reason:'r52-filter'};const world={x:e.x+player.x-e.r52Origin.x,y:e.y+player.y-e.r52Origin.y},q=project(world.x,world.y);return{drawn:true,actorId:activeActor?.coopIdR62||activeActor?.id,world,screen:{x:q.x,y:q.y-actorHeight()*.4}}
  }
  function hurt(amount,source){if(!Number.isFinite(amount)||amount<=0||player.hp<=0)return'ignored';if(player.invincible>0)return'invulnerable';player.hp=Math.max(0,player.hp-amount);return'hit'}
  function serializeSave(){return{player:{hp:player.hp},time,zone,layer}}
  function validateSave(raw){return{player:{...raw.player,level:player.level,upgrades:{...player.upgrades},progressionR62:player.progressionR62}}}
  function normalizeSave3(raw){return{valid:validateSave(raw)}}
  async function restoreSave(){return true}
  async function newGame(){player=freshPlayer();return true}
  async function enterRegion(id){zone=id;room={id,layer,enemies:[]};return true}
  function showDeath(){} function updateHUD(){} function showUpgrades(){}
  const fixture=globalThis.__fixture;
  Object.defineProperties(fixture,{player:{get:()=>activeActor,set:v=>{activeActor=v;if(!globalThis.__fixture.coopFacade)player=v;}},room:{get:()=>room,set:v=>{room=v;}},time:{get:()=>time,set:v=>{time=v;}},mode:{get:()=>mode,set:v=>{mode=v;}},effects:{get:()=>effects}});
  fixture.facade=playerFacade;fixture.maxHP=()=>maxHP();fixture.hurt=(...args)=>hurt(...args);fixture.drawEffect=e=>drawEffect(e);
  ${helper}
  fixture.api=window.__STORYWORLD_HEALTH_R71__;
 })();`;
 const f={player,enemy,coopFacade,extraActors:[]};context.__fixture=f;context.window=window;
 vm.runInContext(code,context,{timeout:3000});
 return{context,window,fixture:f,api:f.api};
}

test('health transform is anchored, fail-closed, and patches exact save/coop/status/heal hooks',()=>{
 const good=spawnSync('python3',['-c',pyTransform],{cwd:process.cwd(),input:baseline,encoding:'utf8',maxBuffer:16*1024*1024});
 assert.equal(good.status,0,good.stderr);const html=good.stdout;
 assert.equal((html.match(/R71-HEALTH-BLEED/g)||[]).length,2);
 assert.equal((html.match(/healthR71\?\.onAdmittedHit/g)||[]).length,1);
 assert.ok(html.includes("rows.push(...(window.__STORYWORLD_HEALTH_R71__?.statusRows(player)||[]))"));
 assert.ok(html.includes("const actorPublicKeys=['healthR71Applied','healthBleedR71','hero',"));
 assert.equal((html.match(/scaleLegacyHeal\(dt\*25/g)||[]).length,2);
 assert.equal((html.match(/mapClearHeal\(player,35,\.12\)/g)||[]).length,1);
 assert.equal((html.match(/healthR71\.normalizeRoom\(room,'coop-session-start'\)/g)||[]).length,1);
 assert.equal((html.match(/<script\b/gi)||[]).length,(html.match(/<\/script\s*>/gi)||[]).length);
 const duplicate=spawnSync('python3',['-c',pyTransform],{cwd:process.cwd(),input:html,encoding:'utf8',maxBuffer:16*1024*1024});assert.notEqual(duplicate.status,0);
 const bad='<script id="campaign-combat-r63r1"></script>';
 const drift=spawnSync('python3',['-c',pyTransform],{cwd:process.cwd(),input:bad,encoding:'utf8'});assert.notEqual(drift.status,0);
});

test('player migration is proportional, idempotent, and leaves max HP at exactly 777',()=>{
 const f=fixture(),p=f.fixture.player,api=f.api,legacy=260+35*2+5*4+18*2;
 assert.equal(api.maxHP,777);assert.equal(f.fixture.maxHP(),777);
 const migrated=api.ensureActor(p,{source:'cpu-test'});assert.equal(migrated.hp,193/legacy*777);assert.equal(migrated.healthR71Applied,true);
 const hp=migrated.hp;api.ensureActor(migrated,{source:'repeat'});assert.equal(migrated.hp,hp);
 assert.equal(api.legacyMaxHP(p),legacy);assert.equal(api.normalization(p),777/legacy);
 const oldSave={player:{hp:193},progressionR62:{version:1,hp:193}};
 assert.equal(api.restoreSavedHp(oldSave,p),193/legacy*777);
 assert.equal(api.restoreSavedHp({player:{hp:111,healthR71Applied:true},healthR71:{version:1,hp:111}},p),111);
 assert.equal(api.inspect(p).player.maxHp,777);assert.equal(api.inspect(p).player.effectiveFraction,hp/777);
});

test('boss suffix uses the unrounded canonical health, preserves fraction, and reapplies difficulty without compounding',()=>{
 const f=fixture(),api=f.api,b={id:'fixture-boss',boss:true,hp:12345/2,maxHp:12345,difficultyBaseHpR63:12345,difficultyFactorR63:1};
 assert.equal(api.normalizeBoss(b,'cpu-test'),true);assert.equal(b.maxHp,12666);assert.equal(b.hp,6333);assert.equal(b.healthR71Adjusted,true);
 api.normalizeBoss(b,'repeat');assert.equal(b.maxHp,12666);assert.equal(b.hp,6333);
 assert.equal(api.unapplyBoss(b),true);assert.equal(b.maxHp,12345);assert.equal(b.hp,6172.5);
 b.difficultyFactorR63=.4;b.maxHp=12345*.4;b.hp=b.maxHp*.5;api.normalizeBoss(b,'hard-tier');
 assert.equal(b.maxHp,4666);assert.equal(b.hp,2333);assert.equal(b.difficultyBaseHpR63,12345);
 const explicit={id:'persona',persona:true,hp:1000,maxHp:1000,difficultyBaseHpR63:2000,difficultyFactorR63:1};
 api.normalizeBoss(explicit,'phase-rebase');assert.equal(explicit.maxHp,666);assert.equal(explicit.difficultyBaseHpR63,1000);
});

test('R61 clones keep their exact 6% owner health and are excluded from boss suffix normalization',()=>{
 const f=fixture(),api=f.api,owner={id:'owner-boss',boss:true,hp:12345,maxHp:12345},clone={id:'owner-clone',boss:false,midboss:false,persona:false,cosmic:false,trial:false,r61Summoned:{version:1,owner:'owner-boss',kind:'clone'},r61Clone:true,maxHp:owner.maxHp*.06,hp:owner.maxHp*.06};
 api.normalizeBoss(owner,'owner');assert.equal(owner.maxHp,12666);
 clone.maxHp=clone.hp=owner.maxHp*.06;const exactCloneHp=clone.maxHp;
 assert.equal(api.normalizeBoss(clone,'clone'),false);
 assert.equal(api.normalizeRoom({enemies:[owner,clone]},'clone-room'),1);
 assert.equal(clone.maxHp,exactCloneHp);assert.equal(clone.hp,exactCloneHp);assert.ok(Math.abs(clone.maxHp/owner.maxHp-.06)<1e-12);
});

test('only admitted enemy HP loss bleeds; dodge, blocked, self, DOT, and guest paths do not',()=>{
 const f=fixture(),p=f.fixture.player,api=f.api,enemy=f.fixture.enemy;
 api.ensureActor(p,{source:'fixture'});p.hp=700;p.invincible=0;f.fixture.time=1;
 const before=p.hp,result=api.normalizeIncoming(100,p,enemy),status=api.onAdmittedHit(p,enemy,before,p.hp-result,'hit');
 assert.equal(status,true);p.hp-=result; // native hurt would commit the same normalized amount
 const bleeding=api.inspect(p).bleeding;assert.equal(bleeding.active,true);assert.equal(bleeding.remaining,3);assert.equal(bleeding.activeVisuals,1);
 assert.equal(f.fixture.effects.at(-1).r71BleedVisualR71,true);assert.equal(f.fixture.effects.at(-1).r52Blood,true);
 assert.equal(api.statusRows(p)[0].key,'health-r71-bleed');
 api.clearBleeding(p,'test-reset');p.hp=700;
 const dodged=api.normalizeIncoming(100,p,enemy);assert.equal(api.onAdmittedHit(p,enemy,p.hp,p.hp,'invulnerable'),false);assert.equal(dodged>0,true);assert.equal(api.isBleeding(p),false);
 const friendly={owner:'hero',friendly:true};assert.equal(api.normalizeIncoming(100,p,friendly),100);assert.equal(api.onAdmittedHit(p,friendly,700,600,'hit'),false);
 const selfCost={owner:enemy,selfCost:true};assert.equal(api.normalizeIncoming(100,p,selfCost),100);assert.equal(api.onAdmittedHit(p,selfCost,700,600,'hit'),false);
 const dot={owner:enemy,r53WoundTick:true};assert.equal(api.normalizeIncoming(100,p,dot),100);assert.equal(api.onAdmittedHit(p,dot,700,600,'hit'),false);
 const field={owner:enemy,r62FieldContact:true};assert.equal(api.normalizeIncoming(100,p,field),100);assert.equal(api.onAdmittedHit(p,field,700,600,'hit'),true);
 api.clearBleeding(p,'test-reset');f.fixture.mode='guest';assert.equal(api.normalizeIncoming(100,p,enemy),100);assert.equal(api.onAdmittedHit(p,enemy,700,600,'hit'),false);assert.equal(api.isBleeding(p),false);
});

test('R71 coop blood keeps the peer impact point while R52 sees its stable player facade',()=>{
 const f=fixture({coopFacade:true}),api=f.api,host=f.fixture.player,peer={id:'coop-peer',coopIdR62:'peer',hero:'hwando',x:30,y:30.15,hp:700,level:5,upgrades:{vital:2},progressionR62:{ranks:{endlessVital:2}},healthR71Applied:true};
 const other={id:'coop-other',coopIdR62:'other',hero:'hwando',x:50,y:50,hp:700,level:5,upgrades:{},healthR71Applied:true};
 f.fixture.extraActors.push(peer,other);f.fixture.mode='host';f.fixture.time=4;api.ensureActor(peer,{source:'peer-fixture'});
 const before=peer.hp;peer.hp-=20;assert.equal(api.onAdmittedHit(peer,f.fixture.enemy,before,peer.hp,'hit'),true);
 const effect=f.fixture.effects.at(-1),impact={x:30,y:30};assert.equal(effect.r52Player,f.fixture.facade);assert.equal(effect.r71OwnerActorR71,peer);
 effect.r71OwnerActorR71=f.fixture.facade; // R62 decode maps any $ref:'player' to this facade, ignoring the ID.
 peer.x=33;peer.y=34;f.fixture.player=host;
 const drawn=f.fixture.drawEffect(effect);assert.equal(drawn.drawn,true);assert.equal(drawn.actorId,'peer');assert.deepEqual(JSON.parse(JSON.stringify(drawn.world)),impact);
 assert.deepEqual(JSON.parse(JSON.stringify(drawn.screen)),{x:600,y:596});
 const visual=api.inspect(peer).bleedVisuals.find(v=>v.actorId==='peer');assert.deepEqual(JSON.parse(JSON.stringify(visual.world)),impact);assert.deepEqual(JSON.parse(JSON.stringify(visual.screen)),{x:600,y:596});assert.equal(visual.drawActorId,'peer');assert.equal(visual.drawCount,1);
 effect.r71ActorId='missing';assert.equal(f.fixture.drawEffect(effect),undefined);const hidden=api.inspect(peer).bleedVisuals.find(v=>v.ownerId==='enemy-boss');assert.equal(hidden.actorId,'missing');assert.equal(hidden.drawActorId,'peer');assert.equal(hidden.drawCount,1);assert.equal(hidden.hiddenReason,'owner-unresolved');
});

test('R71 solo blood uses its retained actor and does not require a coop ID',()=>{
 const f=fixture(),api=f.api,p=f.fixture.player;api.ensureActor(p,{source:'solo-render'});p.x=21;p.y=22;p.hp=700;f.fixture.time=6;
 assert.equal(api.onAdmittedHit(p,f.fixture.enemy,700,690,'hit'),true);const effect=f.fixture.effects.at(-1),drawn=f.fixture.drawEffect(effect);
 assert.equal(drawn.drawn,true);assert.equal(drawn.actorId,'local');assert.deepEqual(JSON.parse(JSON.stringify(drawn.world)),{x:21,y:21.85});
});

test('native hurt wrapper admits one enemy bleed event and lethal hits leave only the short visual',()=>{
 const f=fixture(),api=f.api,p=f.fixture.player,enemy=f.fixture.enemy;
 api.ensureActor(p,{source:'fixture'});p.hp=700;p.invincible=0;f.fixture.time=2;
 const starting=api.inspect(p).metrics.admittedEnemyHits;
 const hit=f.fixture.hurt(20,enemy);
 assert.equal(hit,'hit');assert.equal(api.inspect(p).metrics.admittedEnemyHits,starting+1);assert.equal(api.inspect(p).bleeding.active,true);
 api.clearBleeding(p,'lethal-setup');p.hp=10;p.invincible=0;f.fixture.time=3;
 const lethal=f.fixture.hurt(100,enemy);
 assert.equal(lethal,'hit');assert.equal(p.hp,0);assert.equal(api.inspect(p).bleeding.active,false);
 const last=f.fixture.effects.at(-1);assert.equal(last.r71BleedVisualR71,true);assert.ok(last.age<last.life);assert.equal(api.inspect(p).dotAdded,false);
});
