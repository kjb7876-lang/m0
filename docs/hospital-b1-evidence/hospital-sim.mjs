import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), html=fs.readFileSync('out/hospital-b1/build-connected/site/index.html','utf8'), renderer=fs.readFileSync('out/hospital-b1/build-connected/site/dist/phase1.js','utf8');
const hash=x=>createHash('sha256').update(x).digest('hex'), clone=x=>JSON.parse(JSON.stringify(x));
const report={scriptSHA256:hash(fs.readFileSync(new URL(import.meta.url))),filter:process.env.SIM_CASE_FILTER||null,schema:'m0.hospital.cpu-simulation/v1',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),htmlSHA256:hash(html),rendererSHA256:hash(renderer),node:process.version,platform:process.platform,startedAt:new Date().toISOString(),method:'CPU Node VM, real compiled layout/collision/path and extracted native progression/restore functions plus real modular route/slot/door/hospital wrappers. Assisted state fixtures; no browser, DOM rendering, GPU, touch or natural game completion.',substitutions:['DOM/panels/buttons: inert objects and handler Map','input: direct native function calls and collision-validated fixture walking, not keyboard/touch','region fixtures: real canonical ID/order/chapter/records, synthetic w/e directional exit labels; underlying enterRegion is an admitted fixture, not complete production chapter/asset admission or ordinary arrival placement','clock: explicit simulation dt; no rAF','narrative base renderer: in-memory scene queue, manually acknowledged; native checkpoint wrapper retained','room construction: disposable sourcePlan actors; no full compileWorld, R52/R53 ordinary placement, health/tier normalization or AI execution','full version6 outer schema/asset/unlock validation: fixture envelope admission; native core restore loop retained, not complete production validator','audio/effects/XP presentation: no-op or audit counters; native point/progress completion retained','progress before hospital: explicitly seeded complete in isolated fixture, never natural progression','forced ordinary/midboss deaths and empty corridor fixtures: explicitly labelled; no combat balance claim'],cases:[],extracted:[],errors:[]};
report.branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();report.candidateSourceDiffSHA256=hash(fs.readFileSync('out/hospital-b1/build-connected/candidate-source.patch'));report.buildEvidence=JSON.parse(fs.readFileSync('out/hospital-b1/build-connected/build.json','utf8'));
assert.equal(report.htmlSHA256,'d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f');assert.equal(report.rendererSHA256,'a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d');
function between(name,start,end,source=html){const a=source.indexOf(start);assert.ok(a>=0,name+' start');const b=source.indexOf(end,a+start.length);assert.ok(b>a,name+' end');const s=source.slice(a,b);report.extracted.push({name,line:source===html?html.slice(0,a).split('\n').length:null,sha256:hash(s)});return s;}
function iife(name,comment){return between(name,comment,'\n})();')+'\n})();';}
function script(id){return html.match(new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</script>'))[1];}
const data=JSON.parse(fs.readFileSync('story-source/runtime-r75.json','utf8'));
const campaign=JSON.parse(html.match(/window\.__STORYWORLD_CAMPAIGN_DATA_R54__=(.*?);\n/)[1]);
const portable=JSON.parse(script('portable-data'));
const renderContext={window:{},console,URL,performance,Float32Array};vm.createContext(renderContext);vm.runInContext(renderer,renderContext);const A=renderContext.window.StoryPhase1;
const baselineRenderer=fs.readFileSync('_pages/docs/dist/phase1.js','utf8');
const baselineBox={window:{},console,URL,performance,Float32Array};vm.createContext(baselineBox);vm.runInContext(baselineRenderer,baselineBox);const BA=baselineBox.window.StoryPhase1;
assert.equal(hash(baselineRenderer),'cc71147117dbbb7fd04d2619c95408ad810804b1c1bb5462afbc09bd93f0502c');
const baselineHospital=BA.explorationLayout('ep1a08','hospital',false,{});
const hospital=A.explorationLayout('ep1a08','hospital',false,{});
const layoutCache=new Map([['ep1a08',hospital]]),hospitalInitialHash=hash(JSON.stringify(hospital));
function layoutFor(id,safe){if(!layoutCache.has(id))layoutCache.set(id,A.explorationLayout(id,A.REGIONAL_TERRAIN_ART[id]?.theme||'forest',safe,{seedR73:75,worldR74:1,worldR75:1}));return layoutCache.get(id);}
const retreatCache=new Map();
function retreatPaths(c){for(const start of hospital.starts)if(!retreatCache.has(start.id)){const path=c.findPath(c.room.objective,start);assert.ok(path.length);let at=c.room.objective;for(const q of path){assert.ok(c.clearPath3(at,q,.31));at=q;}retreatCache.set(start.id,path);}return retreatCache;}
const sourceRows=id=>portable.mainlineRosterExpectations.zones.find(r=>r.id===id)?.sourcePlan?.plannedActors||[];
for(const id of ['routes-r72','portal-arrival-r73','save-slots-r73','world-r74'])report.extracted.push({name:'compiled-module:'+id,sha256:hash(script(id))});
const snippets={
 saveNative:between('native-save-write','saveGame=function(notice=true){','\nexportSave='),
 hit:between('native-hit-admission','hitEnemy=function(e,value,source){','\nfunction cleanupOwner3'),
 live:html.split('\n').find(l=>l.startsWith('liveEnemies=function')) ,
 waveSave:between('native-wave-save-and-restore','  const serializeSaveBase6 = serializeSave;','\n  const diagnosticsBase6'),
 roles:between('native-role-predicates','const majorActor3=','function burnIntensity3'),
 helpers:html.split('\n').find(l=>l.startsWith('function layerKey(')),
 complete:between('native-complete-base','function completeRegion(id){','\nfunction interact(){'),
 kill:between('native-kill','killEnemy=function(e){','\nfunction prerequisites3'),
 summon:between('native-summon','function summon3(','\ninteract=function'),
 ready:between('native-ready-stage','function readyStage3(','\nfunction spawnTrial3'),
 finish:between('native-finish','finishEncounter=function(){','\nconst v2Complete3'),
 completeWrap:between('native-complete-wrapper','const v2Complete3=completeRegion;','\nfunction clash3'),
 wave:between('native-wave-advance','  function advanceFieldWave6()','\n  const updateHUDBase6'),
 scenes:between('native-scene-checkpoint-and-ack','const v2Scenes3=playScenes;','\nconst v2Serialize3'),
 serialize:between('native-room-serialize','const v2Serialize3=serializeSave;','\nsaveGame=function(notice=true)'),
 restore:between('native-core-restore','restoreSave=async function(input){','\nconst v2Enter3'),
 place:between('native-major-placement',' function placeMajorRight150(','\n function frameFight150'),
 hospital:iife('hospital-r5-wrapper','/* Hospital r5 layout lifecycle.'),
 alignment:iife('hospital-analytic-migration','/* Spatial-only migration, after all original save/lock/EGO validation.'),
};
// The first base complete marker ends at a different legacy next function in some builds.
const tickStart=html.indexOf('tickEnemies=function(frameDT){');
const tickA=html.indexOf(" if(room.encounterStage==='summoning'){",tickStart),tickB=html.indexOf('\n for(const e of room.enemies)',tickA);
snippets.activation='function stepSummoning(dt){'+html.slice(tickA,tickB)+'\n}';report.extracted.push({name:'native-tick-summoning-branch-only',sha256:hash(snippets.activation)});
const makeDef=id=>{const p=campaign.profiles.find(p=>p.id===id),row=data.records.find(r=>r.zoneId===id);return{id,title:row?.title||id,index:data.portalOrder.indexOf(id),chapterIndex:p?.chapterIndex||0,safe:id==='hub'||!!row?.rest,records:row?[{...row.parts,title:row.title,paragraphs:row.body.split('\n\n'),narrator:row.narratorLabel}]:[],bosses:[],midboss:null,exits:{},paths:[]};};
function actor(row,id='ep1a08') {const major=!!(row.boss||row.midboss),hp=Number(row.hp)||100;return{id:id+':'+row.id,nativeId:row.nativeId||row.id,name:row.name,path:row.runtimeSprite||row.sourceSprite||'fixture.png',hp,maxHp:hp,x:Number(row.x)||15,y:Number(row.y)||13,homeX:Number(row.x)||15,homeY:Number(row.y)||13,boss:!!row.boss,midboss:!!row.midboss,spawnState:major||Number(row.wave)>1?'hidden':'active',fieldWaveIndex6:major?null:Number(row.wave)-1,deadRecorded:false,combatProfile:{bodyBlock:{r:major?.52:.28},hurtbox:{r:major?.55:.31},attackShape:{range:1.65},spriteRect:{height:major?1.65:1}},profile:{id:row.nativeId||row.id},phase:0,phaseAge:0,phaseStage:'active',cd:100,rest:0,beat:0,graceUntil:0,nav:[],state:'idle',defScale:1};}
function runtime({withSlots=false,initialStorage={},seed=123}={}){
 const prefix='storyworld.hospital-b1.test.v1:',rawStorage=new Map(Object.entries(initialStorage).map(([k,v])=>[prefix+k,v])),storage={get:k=>rawStorage.get(prefix+k),set:(k,v)=>rawStorage.set(prefix+k,v),delete:k=>rawStorage.delete(prefix+k)},handlers=new Map(),audit=[];let quotaKey=null;
 const defs=data.portalOrder.map(makeDef),by=Object.fromEntries(defs.map(r=>[r.id,r]));
 for(let i=0;i<defs.length;i++) {if(i)defs[i].exits.w=defs[i-1].id;if(i+1<defs.length)defs[i].exits.e=defs[i+1].id;}
 for(const id of ['ep1a08','ep1a10','ep1a11']){const row=sourceRows(id).find(e=>e.midboss);if(row)by[id].midboss={id:row.nativeId||row.id};}
 by.ep1a11.bosses=[{id:'a11-boss'}];
 const c={N:30,console,URL,Math:Object.create(Math),Date,Number,Object,JSON,Map,Set,Uint32Array,Float32Array,performance,StoryArtR74:JSON.parse(fs.readFileSync('client-source/art-r74.json')),StoryWorldProfilesR74:renderContext.StoryWorldProfilesR74,location:{href:'http://cpu.invalid/?hospitalSeed='+seed},W:1365,H:850,TILE:34,zoom:1,started:true,booted:false,loading:false,modal:false,storyScene:null,storyQueue:[],storyDone:null,zone:'ep1a08',layer:'STORY',time:10,guide:false,auto:false,guideTimer:0,transitionCD:0,lastHub:'hub',target:null,route:[],command:null,cam:{x:15,y:13},visited:new Set(['STORY:dist06']),readScenes:new Set(),ending:{STORY:false,DREAM:false},regions:defs,regionById:by,progress:{STORY:Object.fromEntries(data.portalOrder.slice(1,8).map(id=>[id,true])),DREAM:{}},player:{x:15,y:13,hp:777,maxHp:777,level:1,points:0,hero:'hwando'},settings:{sound:false,music:false,narration:false,lowFx:false,reducedMotion:false,volume:0,bgm:0,voice:0},world:{},projectiles:[],hazards:[],delayed:[],COMBAT_HEALTH_R26:1.65,SW3:{counts:{restores:0,summons:0,damage:0},events:[]},VFX:{clock:'clock',crown:'crown',cross:'cross',burst:'burst'},SAVE:'hospital-sim-save',portable:{assetExists:{},assetMap:{assets:[]},runtimeAssetHashes:{}},imageInventory:new Set(),heroArt:{},voiceGeneration:0,voiceManifest:{},voiceElement:null};c.window=c;c.StoryPhase1=A;
 c.__STORYWORLD_STORY_PROFILE_R54__={campaignOrder:data.portalOrder,inspect:()=>({})};c.__STORYWORLD_COOP_SIM_R62__={mode:()=>c.role||'off'};c.__STORYWORLD_EGO151__={inspect:()=>({isVisit:false})};c.__STORYWORLD_CHEAT777__={active:()=>false,leave:async()=>true};c.__STORYWORLD_SOURCE_PHASE5__={restore:()=>{},initialize:()=>{}};
 for(const n of ['sound','fx','warn','toast','refreshIcons','stopVoice','stopEffects','cameraTick','draw','drawProp','sprite','drawExits','updateHUD','guideStep','showTitle','showMenu','showWorld','loadLocal','newGame','bindControls','gainResonance','cleanupOwner3','spawnBurnDeath3','awaken','enterNarrative','placeActor3','showEnding','moveAI3','tickEnemies','clash3','showJournal','register','openPanel','closePanel'])c[n]=()=>{};
 c.register=x=>x;c.ensureImages=async()=>true;c.maxHP=()=>777;c.gainXP=v=>audit.push({kind:'xp',v});c.event3=(kind,detail={})=>audit.push({kind,...detail});c.isEgoVisit151=()=>false;c.finite=(x,d=0)=>Number.isFinite(x)?x:d;c.clamp=(x,a,b)=>Math.max(a,Math.min(b,x));c.distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);c.opposite={e:'w',w:'e',n:'s',s:'n'};c.facing=()=> 'front';c.project=(x,y)=>({x,y});c.actorHeight=()=>66;c.spellName=()=>'';c.nearestEnemy=()=>null;c.escapeHTML=String;
 const panel={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[],appendChild(){}};c.$=id=>id==='panel'?panel:{textContent:'',style:{},classList:{toggle(){}},querySelector:()=>null};c.document={createElement:()=>({})};c.button=(id,fn)=>handlers.set(id,fn);
 c.localStorage={getItem:k=>rawStorage.get(k)??null,setItem(k,v){if(k===prefix+quotaKey)throw Error('fixture quota');rawStorage.set(k,String(v));},removeItem:k=>rawStorage.delete(k)};
 c.makeRoom=(id,l)=>{const rows=sourceRows(id),r={id,layer:l,props:[],enemies:rows.map(row=>actor(row,id)),kills:0,minionKills:0,engaged:false,cleared:false,finalizing:false,revision:0,objective:{x:15,y:13},defeatedActorIds:new Set(),encounterStage:rows.length?'field':'fieldReady',activeEncounter:'',summonClock:0,spawnNonce:0,finalStage:0,trialIndex:0,cosmicIndex:0,persona:{phase:'locked',clashUsed:false,completed:false},sceneCheckpoint:null,rewardCommitted:false,fieldWaves6:rows.length?[1,2]:[],fieldWaveIndex6:0,fieldWaveCleared6:!rows.length,exploration:layoutFor(id,!!by[id].safe),worldR74:1};return r;};
 c.getRoom=(id,l=c.layer)=>c.world[l+':'+id]??=(c.makeRoom(id,l));c.room=c.getRoom('ep1a08');
 c.blocked=(x,y,r=.27,where=c.room)=>A.explorationBlocked(where.exploration,x,y,r);
 c.clearPath3=(a,b,r=.31,where=c.room)=>{const n=Math.max(1,Math.ceil(c.distance(a,b)/.12));for(let i=0;i<=n;i++)if(c.blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r,where))return false;return true;};c.clearLine=(a,b,where=c.room)=>c.clearPath3(a,b,.05,where);
 c.findPath=(a,b,where=c.room,r=.31)=>A.explorationPath(where.exploration,a,b,r,(x,y,v)=>c.blocked(x,y,v,where),(p,q,v)=>c.clearPath3(p,q,v,where));
 c.serializeSave=()=>({version:6,scope:'hapil.storyworld.depth-full.20261008',zone:c.zone,layer:c.layer,time:c.time,player:clone(c.player),progress:clone(c.progress),visited:[...c.visited],readScenes:[...c.readScenes],ending:{...c.ending},rooms:Object.fromEntries(Object.entries(c.world).map(([k,r])=>[k,{kills:r.kills,cleared:r.cleared,engaged:r.engaged,finalStage:r.finalStage}])),settings:{...c.settings},enemyHpScaleE159:2,bossHpExtraOct11:2,combatHealthR26:1.65});
 c.saveGame=(notice=true)=>{if(!c.started||!c.player||c.player.hp<=0||c.loading)return false;try{c.__STORYWORLD_TEST_STORAGE_B1__.store.setItem(c.__STORYWORLD_SAVE_SLOTS_R73__?.key()||c.SAVE,JSON.stringify(c.serializeSave()));return true;}catch(e){return false;}};
 c.normalSaveKeyR73=()=>c.__STORYWORLD_SAVE_SLOTS_R73__?.key()||c.SAVE;
 c.normalizeSave3=raw=>{if(!raw||raw.version!==6||raw.scope!=='hapil.storyworld.depth-full.20261008'||!by[raw.zone]||!['STORY','DREAM'].includes(raw.layer)||!raw.player||!raw.progress||!raw.rooms)throw Error('fixture envelope rejected');return{raw,valid:{player:clone(raw.player),progress:clone(raw.progress),visited:clone(raw.visited||[]),time:Number(raw.time)||0}};};
 c.playScenes=(scenes,done)=>{c.storyQueue=[...scenes];c.storyDone=done;c.storyScene=c.storyQueue.shift()||null;c.modal=!!c.storyScene;if(!c.storyScene){c.storyDone=null;done?.();}};
 c.advanceScene=()=>{c.storyScene=c.storyQueue.shift()||null;c.modal=!!c.storyScene;if(!c.storyScene){const done=c.storyDone;c.storyDone=null;done?.();}};
 c.nextScenes=(def,part)=>{const r=data.records.find(r=>r.zoneId===def.id),text=r?.parts?.[part];return text?[{id:def.id,part,text,title:r.title,key:c.layer+':'+def.id+':'+part+':r75'}]:[];};
 c.enterRegion=async(id,from=null,opts={})=>{if(!by[id])return false;c.zone=id;c.layer=opts.layer||c.layer;c.room=c.getRoom(id);c.visited.add(c.layer+':'+id);if(!opts.restore){c.player.x=15;c.player.y=19;}return true;};
 c.travel=()=>false;c.interact=()=>false;c.exitPoint=()=>({x:15,y:13});c.canTravel=()=>!c.room.engaged&&!c.room.finalizing&&!c.loading&&!c.storyScene;c.spawnPoint=()=>({x:15,y:19});c.compileWorld=()=>{};c.playVoice=async()=>{};
 vm.createContext(c);vm.runInContext(script('hospital-b1-test-storage'),c);vm.runInContext(fs.readFileSync('client-source/art-core-r74.js','utf8'),c);
 const bounds=html.slice(html.indexOf('minimum:axis=>'),html.indexOf(',shotOutside:',html.indexOf('minimum:axis=>')));vm.runInContext('window.__STORYWORLD_EXPLORATION__={'+bounds+'};',c);
 for(const name of ['roles','live','helpers','complete','kill','hit','summon','ready','finish','completeWrap','wave','scenes','serialize','saveNative','restore','place','activation'])vm.runInContext(snippets[name],c,{filename:'native-extract:'+name});
 const nativeSerialize=c.serializeSave;c.serializeSave=(...a)=>{const raw=nativeSerialize(...a);raw.version=6;raw.scope='hapil.storyworld.depth-full.20261008';return raw;};
 vm.runInContext(snippets.waveSave,c);
 vm.runInContext(snippets.hospital,c);vm.runInContext(snippets.alignment,c);
 c.__STORYWORLD_REGION_ROUTES__={source:id=>A.REGIONAL_ROUTE_DATA[id],status:()=>({}),visibleDirections:()=>[],principal:()=>null};c.__STORYWORLD_PORTALS_R61__={};
 vm.runInContext(script('routes-r72'),c);vm.runInContext(script('portal-arrival-r73'),c);
 if(withSlots)vm.runInContext(script('save-slots-r73'),c);
 c.booted=true;
 return{c,storage,handlers,audit,quota:k=>quotaKey=k,raw:()=>clone(c.serializeSave()),ack:()=>{let n=0;while(c.storyScene){assert.ok(n++<20);c.advanceScene();}},forceFieldClear:()=>{for(const e of [...c.room.enemies])if(!e.boss&&!e.midboss)c.killEnemy(e);}};
}

function walkFixture(c,to){const path=c.findPath(c.player,to);assert.ok(path.length||c.distance(c.player,to)<.1);let distance=0;for(const q of path){const from={x:c.player.x,y:c.player.y},length=c.distance(from,q),n=Math.max(1,Math.ceil(length/.12));for(let i=1;i<=n;i++){const p={x:from.x+(q.x-from.x)*i/n,y:from.y+(q.y-from.y)*i/n};assert.equal(c.blocked(p.x,p.y,.31),false);c.player.x=p.x;c.player.y=p.y;}distance+=length;}return{segments:path.length,distance};}

async function test(name,fn){if(process.env.SIM_CASE_FILTER&&!new RegExp(process.env.SIM_CASE_FILTER).test(name))return;const t=performance.now();try{const detail=await fn();report.cases.push({name,ok:true,ms:performance.now()-t,detail:detail??null});console.log('PASS',name);}catch(e){report.cases.push({name,ok:false,ms:performance.now()-t,error:e.stack});console.log('FAIL',name,e.message);}}
await test('seed index coverage/determinism across 4096 seeds and uint32 boundaries',()=>{const seeds=[...Array.from({length:4096},(_,i)=>i),0xffffffff,0x80000000,0x7fffffff,123456789,2606444145],counts=[0,0,0],examples=[[],[],[]];for(const seed of seeds){const i=A.hospitalStart5(seed);assert.ok(i>=0&&i<3&&Number.isInteger(i));assert.equal(i,A.hospitalStart5(seed));counts[i]++;if(examples[i].length<5)examples[i].push(seed);}assert.ok(counts.every(n=>n>0));return{seedNamespace:'hospitalSeed5; NOT seedR73',seedCount:seeds.length,counts,examples};});
await test('all authored hospital starts to objective and reverse via exact analytic collision/path',()=>{const h=runtime(),c=h.c,rows=[];for(const start of hospital.starts){assert.equal(c.blocked(start.x,start.y,.4),false);const path=c.findPath(start,c.room.objective);assert.ok(path.length,start.id+' objective path');let at=start;for(const q of path){assert.ok(c.clearPath3(at,q,.31));at=q;}const reverse=c.findPath(c.room.objective,start);assert.ok(reverse.length);let back=c.room.objective;for(const q of reverse){assert.ok(c.clearPath3(back,q,.31));back=q;}retreatCache.set(start.id,reverse);rows.push({startId:start.id,point:{x:start.x,y:start.y},segments:path.length,pathLength:path.reduce((sum,p,i)=>sum+c.distance(i?path[i-1]:start,p),0)});}return{rows,actorsAndAttackHazardsNotInCollision:true};});
await test('hospital entry seed selection/save namespace roundtrip for all 3 index classes',async()=>{const found=[[],[],[]];for(let seed=0;seed<4096;seed++){const index=A.hospitalStart5(seed);if(found[index].length<2)found[index].push(seed);}const examples=found.flat(),rows=[];for(const seed of examples){const h=runtime({seed}),c=h.c;c.zone='dist06';c.room=c.getRoom('dist06');await c.enterRegion('ep1a08');const raw=h.raw(),startId=c.room.hospitalStart5;assert.equal(startId,hospital.starts[A.hospitalStart5(seed)].id);assert.equal(raw.hospitalMaze5.rooms['STORY:ep1a08'].seed,seed);const origin={x:c.player.x,y:c.player.y};await c.restoreSave(raw);assert.equal(c.room.hospitalStart5,startId);assert.ok(c.distance(c.player,origin)<.001);assert.equal(c.blocked(origin.x,origin.y,.34),false);assert.ok(c.distance(origin,hospital.starts[A.hospitalStart5(seed)])>=1.9);rows.push({seed,index:A.hospitalStart5(seed),startId,finalPosition:origin});}return{rows,priorZone:'dist06 (admitted fixture; not naturally cleared)',entryWrapperR72OffsetIncluded:true};});
await test('native summon placement around objective retains safe paths and potential retreat',()=>{const h=runtime(),c=h.c,rows=[];const majorRow=sourceRows('ep1a08').find(e=>e.midboss);for(let i=0;i<16;i++){const angle=i*Math.PI/8,p={x:15+Math.cos(angle)*2.55,y:13+Math.sin(angle)*2.55};if(c.blocked(p.x,p.y,.31))continue;c.player={...c.player,...p};const e=actor(majorRow);c.room.enemies=[e];c.placeMajorRight150([e]);assert.equal(c.blocked(e.x,e.y,e.combatProfile.bodyBlock.r+.08),false);assert.ok(c.findPath(c.player,e).length);const toObjective=c.findPath(c.player,c.room.objective);assert.ok(toObjective.length||c.distance(c.player,c.room.objective)<.1);let at=c.player;for(const q of toObjective){assert.ok(c.clearPath3(at,q,.31));at=q;}const retreat=[...retreatPaths(c)].map(([id,path])=>({id,path:[...toObjective,...path]}));assert.equal(retreat.length,3);rows.push({approach:i,player:p,major:{x:e.x,y:e.y},relocated:!!e.sourceSpawn150,retreatStartIds:retreat.map(r=>r.id)});}assert.ok(rows.length>=8);return{rows,scope:'static map, controlled major fixture; exact validated approach-to-objective path plus cached exact objective-to-start paths; excludes live AI/attack hazards and dynamic actor separation'};});
await test('native ordinary waves block summon; assisted kills advance wave and native midboss transitions',()=>{const h=runtime(),c=h.c;c.interact();assert.equal(c.room.engaged,false);for(const e of [...c.room.enemies].filter(e=>e.fieldWaveIndex6===0))c.killEnemy(e);assert.equal(c.room.fieldWaveIndex6,1);assert.ok(c.room.enemies.filter(e=>e.fieldWaveIndex6===1).every(e=>e.spawnState==='active'));c.interact();assert.equal(c.room.engaged,false);h.forceFieldClear();assert.equal(c.prerequisites3(),true);c.interact();assert.equal(c.room.activeEncounter,'midboss');assert.equal(c.room.encounterStage,'summoning');c.stepSummoning(.4);assert.equal(c.room.encounterStage,'summoning');c.stepSummoning(.6);assert.equal(c.room.encounterStage,'active');const mid=c.room.enemies.find(e=>e.midboss);assert.equal(mid.spawnState,'active');c.killEnemy(mid);assert.equal(c.room.encounterStage,'bossReady');assert.equal(c.completed('ep1a08'),false);c.interact();assert.equal(c.storyScene.part,'post');assert.equal(c.room.sceneCheckpoint.action,'complete');h.ack();assert.equal(c.completed('ep1a08'),true);assert.equal(c.room.encounterStage,'complete');assert.equal(c.player.points,2);c.completeRegion('ep1a08');assert.equal(c.player.points,2);return{forcedDeaths:true,nativeClockBranches:true,nativeCompletionPoints:c.player.points,events:h.audit.filter(e=>['FieldWaveActivated','FieldWavesCleared','SummonRequested','SummonActivated','RegionCompleted'].includes(e.kind))};});
await test('STORY/DREAM stages and native core restore preserve partial HP/dead IDs without crossing layers',async()=>{const h=runtime(),c=h.c;h.forceFieldClear();c.interact();c.stepSummoning(1);let mid=c.room.enemies.find(e=>e.midboss);mid.hp*=.37;mid.phase=2;const expected=mid.hp;c.getRoom('ep1a08','DREAM').enemies.find(e=>e.midboss).hp*=.81;const raw=h.raw();await c.restoreSave(raw);mid=c.room.enemies.find(e=>e.midboss);assert.equal(mid.hp,expected);assert.equal(mid.phase,2);assert.equal(mid.spawnState,'active');assert.equal(c.room.activeEncounter,'midboss');assert.equal(c.room.fieldWaveIndex6,2);assert.ok(c.room.enemies.every(e=>e.midboss));assert.ok(c.world['DREAM:ep1a08'].enemies.some(e=>!e.midboss));assert.equal(c.completed('ep1a08','DREAM'),false);return{restoredMidHp:mid.hp,deadIdCount:c.room.defeatedActorIds.size,dreamMidHp:c.world['DREAM:ep1a08'].enemies.find(e=>e.midboss).hp};});
await test('native post checkpoint reload then acknowledgement completes exactly once',async()=>{const h=runtime(),c=h.c;h.forceFieldClear();c.interact();c.stepSummoning(1);c.killEnemy(c.room.enemies.find(e=>e.midboss));c.interact();const raw=h.raw();await c.restoreSave(raw);assert.equal(c.storyScene.part,'post');assert.equal(c.completed('ep1a08'),false);h.ack();assert.equal(c.completed('ep1a08'),true);assert.equal(c.player.points,2);await c.restoreSave(h.raw());assert.equal(c.player.points,2);return{scope:'native checkpoint/resume code with in-memory scene UI, fixture outer validator'};});
await test('native R72 portal admission/next/previous roundtrip and guest/battle denial',async()=>{const h=runtime({seed:123}),c=h.c;await c.enterRegion('ep1a08');const api=c.__STORYWORLD_ROUTES_R72__;assert.equal(api.permit('ep1a09','next'),false);h.forceFieldClear();c.player.x=15;c.player.y=13;c.interact();c.stepSummoning(1);c.killEnemy(c.room.enemies.find(e=>e.midboss));c.interact();h.ack();assert.equal(api.permit('ep1a09','next'),true);c.role='guest';assert.equal(api.permit('ep1a09','next'),false);c.role='off';c.room.engaged=true;assert.equal(api.permit('ep1a09','next'),false);c.room.engaged=false;const before=JSON.stringify(c.progress);const next=api.inspect().portals.find(p=>p.role==='next');assert.ok(next?.open);assert.equal(c.blocked(next.point.x,next.point.y,.43),false);assert.equal(await c.travel(next.direction),false,'far-from-portal request must be refused');const walkNext=walkFixture(c,next.point);assert.equal(await c.travel(next.direction),true,'near and clear next portal');assert.equal(c.zone,'ep1a09');const previous=api.inspect().portals.find(p=>p.role==='previous');assert.ok(previous?.open);const walkPrevious=walkFixture(c,previous.point);assert.equal(await c.travel(previous.direction),true,'near and clear previous portal');assert.equal(c.zone,'ep1a08');assert.equal(JSON.stringify(c.progress),before);return{farRequestDenied:true,walkNext,walkPrevious,nextPoint:next.point,previousPoint:previous.point,returnedPosition:{x:c.player.x,y:c.player.y},progressUnchanged:true,travelUsesNativeRouteWrapperButFixtureUnderlyingEnter:true};});
await test('actual native hostile damage admits active a08 actors and rejects hidden; staff protection unresolved',()=>{const h=runtime(),c=h.c;const hit=between('native-hit-admission','hitEnemy=function(e,value,source){','\nfunction cleanupOwner3');vm.runInContext(hit,c);const results=[];for(const row of sourceRows('ep1a08').filter(r=>r.id===r.nativeId)){const e=actor(row);e.spawnState='hidden';assert.equal(c.hitEnemy(e,1,{kind:'cpu-test'}),false);e.spawnState='active';const hp=e.hp;assert.equal(c.hitEnemy(e,1,{kind:'cpu-test'}),true);assert.equal(e.hp,hp-1);results.push({nativeId:e.nativeId,kind:row.kind,activeReceivesNativeDamage:true});}return{results,actualMedicalStaffIDContract:'unresolved; no medical staff exemption claimed, no actor reclassification'};});
// Slot/door tests use real production wrappers, while core envelope/DOM/storage remain disclosed fixtures.
await test('three normal slots isolate hospital STORY/DREAM and preserve legacy bytes',async()=>{const seedHarness=runtime();const legacy=JSON.stringify(seedHarness.raw());const h=runtime({withSlots:true,initialStorage:{'hospital-sim-save':legacy}}),c=h.c,api=c.__STORYWORLD_SAVE_SLOTS_R73__;assert.equal(h.storage.get('hospital-sim-save'),legacy);const snapshots=[];for(let slot=1;slot<=3;slot++){if(slot!==1){api.confirm('new',slot);c.__STORYWORLD_STORY_PROFILE_R54__={campaignOrder:data.portalOrder,inspect:()=>({}),begin:async()=>{c.zone='hub';c.layer='STORY';c.player={...c.player,hp:777,points:0};c.progress={STORY:{},DREAM:{}};c.world={};c.room=c.getRoom('hub');return c.saveGame(false);}};assert.equal(await h.handlers.get('slotConfirmR73')(),true);}c.zone='ep1a08';c.layer=slot===2?'DREAM':'STORY';c.room=c.getRoom(c.zone,c.layer);c.player.x=hospital.starts[slot-1].x;c.player.y=hospital.starts[slot-1].y;c.player.points=slot*17;assert.equal(c.saveGame(false),true);snapshots.push(h.storage.get('hospital-sim-save.slot-r73.'+slot));}for(let slot=1;slot<=3;slot++){assert.equal(await api.confirm('load',slot),true);assert.equal(c.player.points,slot*17);assert.equal(c.layer,slot===2?'DREAM':'STORY');assert.equal(c.zone,'ep1a08');}assert.equal(h.storage.get('hospital-sim-save'),legacy);return{slotLayers:['STORY','DREAM','STORY'],legacySHA256:hash(legacy),legacyPreserved:true,syntheticSaveOnly:true};});
await test('generated R74/R75 doors stay in ID0..2 for inspected hospital-associated maps; actual door module restore/refusal',async()=>{const layouts={};for(const id of ['ep1a09','ep1a09b','ep1a10','ep1a11']){const l=A.explorationLayout(id,A.REGIONAL_TERRAIN_ART[id].theme,false,{seedR73:75,worldR74:1,worldR75:1});assert.ok(l.worldR74.doors.length<=3);assert.ok(l.worldR74.doors.every(d=>/^door-[0-2]$/.test(d.id)));layouts[id]=l;}const h=runtime(),c=h.c;vm.runInContext(script('world-r74'),c);const api=c.__STORYWORLD_WORLD_R74__;c.zone='ep1a09';c.room=c.getRoom(c.zone);api.version(c.zone);const door=c.room.exploration.worldR74.doors[0];assert.ok(door);const t=api.interactions()[0];const sides=[-1,1].map(s=>({x:door.x+s*1.2,y:door.y}));const p=sides.find(p=>!c.blocked(p.x,p.y,.31));Object.assign(c.player,p);assert.equal(api.use(t),true);assert.equal(c.blocked(door.x,door.y,.29),false);const raw=h.raw();assert.equal(api.use(t),true);assert.equal(c.blocked(door.x,door.y,.29),true);await c.restoreSave(raw);assert.equal(c.blocked(door.x,door.y,.29),false);const prior=JSON.stringify(api.inspect()),progress=JSON.stringify(c.progress);for(const ids of [['door-3'],['door-0','door-1','door-2','door-3'],['door-0','door-0']]){const bad=clone(raw);bad.worldR74.opened['STORY:ep1a09']=ids;await assert.rejects(()=>c.restoreSave(bad));assert.equal(JSON.stringify(api.inspect().opened),JSON.stringify(JSON.parse(prior).opened));assert.equal(JSON.stringify(c.progress),progress);}return{generatedDoorCounts:Object.fromEntries(Object.entries(layouts).map(([id,l])=>[id,l.worldR74.doors.length])),hospital08Excluded:api.version('ep1a08')===0,invalidDoor3:'synthetic negative input, not generated or public bug'};});
await test('hospital hidden/summoning/active/bossReady/post/complete snapshot matrix',async()=>{
 const rows=[];
 for(const stage of ['hidden','summoning','active','bossReady','post','complete']){
  const h=runtime({seed:987654321}),c=h.c;await c.enterRegion('ep1a08');c.player.x=15;c.player.y=13;
  if(stage!=='hidden'){h.forceFieldClear();c.interact();}
  if(['active','bossReady','post','complete'].includes(stage))c.stepSummoning(1);
  if(stage==='active')c.room.enemies.find(e=>e.midboss).hp*=.43;
  if(['bossReady','post','complete'].includes(stage))c.killEnemy(c.room.enemies.find(e=>e.midboss));
  if(['post','complete'].includes(stage))c.interact();
  if(stage==='complete')h.ack();
  const raw=h.raw(),before={progress:JSON.stringify(c.progress),points:c.player.points,stage:c.room.encounterStage,active:c.room.activeEncounter,mid:c.room.enemies.find(e=>e.midboss)?.hp??null,dead:[...c.room.defeatedActorIds].sort()};
  await c.restoreSave(raw);
  assert.equal(JSON.stringify(c.progress),before.progress);assert.equal(c.player.points,before.points);assert.equal(c.room.encounterStage,before.stage);assert.equal(c.room.activeEncounter,before.active);assert.equal(c.room.enemies.find(e=>e.midboss)?.hp??null,before.mid);assert.deepEqual([...c.room.defeatedActorIds].sort(),before.dead);
  if(stage==='summoning'){assert.equal(c.room.summonClock,.9);c.stepSummoning(1);assert.equal(c.room.enemies.find(e=>e.midboss).spawnState,'active');}
  if(stage==='post'){assert.equal(c.storyScene.part,'post');h.ack();assert.equal(c.completed('ep1a08'),true);assert.equal(c.player.points,2);}
  rows.push({snapshot:stage,restoredStage:before.stage,midHP:before.mid,deadCount:before.dead.length,points:before.points});
 }
 return{rows,summonClockRestore:'native resets to .9; remaining pre-save delay is not preserved',assistance:'prior story and source actor fixtures, forced kills, manually acknowledged scene queue'};
});
await test('hospital save slot rejects synthetic invalid door metadata without overwriting legacy or rejected slot',async()=>{
 const base=runtime(),legacy=JSON.stringify(base.raw()),h=runtime({withSlots:true,initialStorage:{'hospital-sim-save':legacy}}),c=h.c;vm.runInContext(script('world-r74'),c);const api=c.__STORYWORLD_SAVE_SLOTS_R73__;
 assert.equal(c.saveGame(false),true);const points=c.player.points,original=h.storage.get('hospital-sim-save.slot-r73.1'),bad=h.raw();bad.worldR74={version:1,entries:{'STORY:ep1a09':1},opened:{'STORY:ep1a09':['door-3']}};const badBytes=JSON.stringify(bad);h.storage.set('hospital-sim-save.slot-r73.2',badBytes);
 assert.equal(await api.confirm('load',2),false);assert.equal(api.inspect().active,1);assert.equal(c.zone,'ep1a08');assert.equal(c.player.points,points);assert.equal(h.storage.get('hospital-sim-save'),legacy);assert.equal(h.storage.get('hospital-sim-save.slot-r73.2'),badBytes);assert.equal(h.storage.get('hospital-sim-save.slot-r73.1'),original);
 h.quota('hospital-sim-save.slot-r73.1');assert.equal(c.saveGame(false),false);assert.equal(h.storage.get('hospital-sim-save.slot-r73.1'),original);
 return{legacyPreserved:true,rejectedSlotPreserved:true,activeSlotPreserved:true,quotaPreserved:true,invalidDoorData:'deliberately injected fixture, not normal generator output'};
});
await test('all eight generated three-door states preserve objective route after reload/reentry and layer separation',async()=>{
 const h=runtime(),c=h.c;vm.runInContext(script('world-r74'),c);const api=c.__STORYWORLD_WORLD_R74__;c.zone='ep1a09';c.room=c.getRoom(c.zone);api.version(c.zone);const doors=c.room.exploration.worldR74.doors;assert.equal(doors.length,3);const rows=[];
 for(let mask=0;mask<8;mask++){
  const raw=h.raw(),ids=doors.filter((d,i)=>mask&(1<<i)).map(d=>d.id);raw.worldR74.entries['STORY:ep1a09']=1;raw.worldR74.entries['DREAM:ep1a09']=1;raw.worldR74.opened['STORY:ep1a09']=ids;raw.worldR74.opened['DREAM:ep1a09']=[];raw.player.x=c.room.exploration.entry.x;raw.player.y=c.room.exploration.entry.y;
  await c.restoreSave(raw);assert.deepEqual(Array.from(api.inspect().opened['STORY:ep1a09']),clone(ids));for(const d of doors)assert.equal(c.blocked(d.x,d.y,.29),!ids.includes(d.id));const path=c.findPath(c.room.exploration.entry,c.room.objective);assert.ok(path.length,'mask '+mask+' route');let at=c.room.exploration.entry;for(const p of path){assert.ok(c.clearPath3(at,p,.31));at=p;}
  const saved=h.raw();await c.restoreSave(saved);assert.deepEqual(Array.from(api.inspect().opened['STORY:ep1a09']),clone(ids));
  await c.enterRegion('ep1a08',null,{restore:true});await c.enterRegion('ep1a09',null,{restore:true});assert.deepEqual(Array.from(api.inspect().opened['STORY:ep1a09']),clone(ids));assert.ok(c.findPath(c.room.exploration.entry,c.room.objective).length);
  c.layer='DREAM';c.room=c.getRoom('ep1a09','DREAM');for(const d of doors)assert.equal(c.blocked(d.x,d.y,.29),true);c.layer='STORY';c.room=c.getRoom('ep1a09','STORY');rows.push({mask,opened:ids,pathSegments:path.length});
 }
 return{rows,layoutSeedR73:75,scope:'actual generated ep1a09 doors; forced admitted map entry for spatial reentry, no natural story travel claim'};
});


await test('hospital post manual save is blocked by actual slot readiness guard',()=>{const h=runtime({withSlots:true}),c=h.c;assert.equal(c.saveGame(false),true);h.forceFieldClear();c.interact();c.stepSummoning(1);c.killEnemy(c.room.enemies.find(e=>e.midboss));const key=c.__STORYWORLD_SAVE_SLOTS_R73__.key(),before=h.storage.get(key);c.interact();assert.equal(c.storyScene.part,'post');assert.equal(c.saveGame(false),false);assert.equal(h.storage.get(key),before);const internal=h.raw();assert.equal(internal.rooms['STORY:ep1a08'].sceneCheckpoint.action,'complete');h.ack();assert.equal(c.completed('ep1a08'),true);assert.equal(c.saveGame(false),true);return{manualMidSceneSaveBlocked:true,internalSnapshotIsNotManualSlotSave:true,postStateMatrixScope:'internal serializer/restore snapshot; no claim that UI manual save accepts a live story scene'};});


await test('B1 scope: all other canonical region layouts retain baseline bytes',()=>{
 const rows=[];
 for(const id of data.portalOrder.filter(id=>id!=='ep1a08')){
  const safe=!!campaign.profiles.find(p=>p.id===id)?.safe;
  const theme=A.REGIONAL_TERRAIN_ART[id]?.theme||'forest';
  for(const meta of [{},{seedR73:75,worldR74:1,worldR75:1}]){
   const old=BA.explorationLayout(id,theme,safe,meta),now=A.explorationLayout(id,theme,safe,meta);
   assert.equal(hash(JSON.stringify(now)),hash(JSON.stringify(old)),id+' layout changed');
  }
  rows.push(id);
 }
 return{regionCount:rows.length,ids:rows,metaConfigurations:2,comparison:'complete serialized generated layout equality; CPU only'};
});
await test('B1 additive collision preserves sampled old positions, native walls and all anchors',()=>{
 const old=baselineHospital,now=hospital;let sampled=0,oldFree=0,newlyFree=0;
 for(let y=-27.5;y<81;y+=.75)for(let x=-27.5;x<81;x+=.75){
  const b=BA.explorationBlocked(old,x,y,.31),n=A.explorationBlocked(now,x,y,.31);sampled++;
  if(!b){oldFree++;assert.equal(n,false,'old free position blocked '+x+','+y);}
  if(b&&!n)newlyFree++;
 }
 assert.ok(newlyFree>0);assert.deepEqual(clone(now.walls.filter(w=>!w.annex)),clone(old.walls.filter(w=>!w.annex)));
 for(const k of ['starts','gate','doorUV','entry','sourceExits','originalEncounterBounds','renderEnvelope','backdropRects','fogRects','surface'])assert.deepEqual(clone(now[k]),clone(old[k]),k);
 for(let y=8.5;y<=21.5;y+=.5)for(let x=8.5;x<=21.5;x+=.5)assert.equal(A.explorationBlocked(now,x,y,.6),BA.explorationBlocked(old,x,y,.6));
 return{sampled,oldFree,newlyFree,nativePhysicalWallsPreserved:true,centralArenaRadius:.6,walkAreaBefore:old.hospitalWalkArea12,walkAreaAfter:now.hospitalWalkArea12,notAnAllContinuousPositionsProof:true};
});
await test('B1 ward branches rejoin the native approach with two statically walkable alternatives',()=>{
 const h=runtime(),c=h.c,xy=(u,v)=>({x:(v+u)/2,y:(v-u)/2});
 const routes=[[-39,-20,-17], [39,20,17]].map(([side,room,rejoin])=>[xy(side,55),xy(room,55),xy(rejoin,61),xy(rejoin,68),xy(0,70),xy(0,61),xy(0,54),c.room.objective]);
 const rows=[];
 for(const [i,route] of routes.entries()){
  let at=route[0],distance=0;
  assert.equal(c.blocked(at.x,at.y,.6),false);
  for(const [segment,next] of route.slice(1).entries()){const path=c.findPath(at,next,c.room,.6);assert.ok(path.length,'branch '+i+' segment '+segment);for(const q of path){assert.ok(c.clearPath3(at,q,.6),'walkable branch '+i+' segment '+segment);distance+=c.distance(at,q);at=q;}}
  for(const start of hospital.starts)assert.ok(c.findPath(start,route[0]).length,'start reaches branch');
  rows.push({side:i?'east':'west',points:route,distance,clearanceRadius:.6});
 }
 return{routes:rows,staticActorFreeOnly:true,additionalSerializedDoors:0};
});
await test('B1 old and new ward positions reload and keep objective routes in both layers',async()=>{
 const rows=[],xy=(u,v)=>({x:(v+u)/2,y:(v-u)/2});
 for(const layerName of ['STORY','DREAM']){
  const h=runtime(),c=h.c;c.layer=layerName;c.room=c.getRoom('ep1a08',layerName);
  for(const p of [...hospital.starts,xy(-20,55),xy(20,55),xy(-17,63),xy(17,63)]){
   assert.equal(c.blocked(p.x,p.y,.34),false);Object.assign(c.player,{x:p.x,y:p.y});const raw=h.raw();await c.restoreSave(raw);
   assert.equal(c.zone,'ep1a08');assert.equal(c.layer,layerName);assert.equal(c.player.x,p.x);assert.equal(c.player.y,p.y);assert.ok(c.findPath(c.player,c.room.objective).length);
   rows.push({layer:layerName,position:p,restored:{x:c.player.x,y:c.player.y}});
  }
 }
 return{rows,fixtureOuterValidator:true,originalUserSaveCompatibility:'unverified'};
});
await test('B1 floor polygons, boundary junctions and existing door registration agree without GPU',()=>{
 let checked=0;
 for(const poly of hospital.hospitalWalkPolygons12){const p={x:poly.reduce((s,v)=>s+v[0],0)/poly.length,y:poly.reduce((s,v)=>s+v[1],0)/poly.length};assert.equal(A.explorationBlocked(hospital,p.x,p.y,0),false);checked++;}
 const wallPlan=A.hospitalWallPlan34(hospital),registration=A.hospitalDoorRegistration31(hospital);
 assert.deepEqual(clone(registration.opening),clone(BA.hospitalDoorRegistration31(baselineHospital).opening));
 for(const w of hospital.hospitalBoundary12){const [a,b]=w.endpoints,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),p={x:(a[0]+b[0])/2,y:(a[1]+b[1])/2};assert.ok(len>0);assert.equal(A.explorationBlocked(hospital,p.x,p.y,.01),true);assert.ok([1,-1].some(s=>!A.explorationBlocked(hospital,p.x+s*(-dy/len)*.05,p.y+s*(dx/len)*.05,0)));}
 const metric=l=>({area:l.hospitalWalkArea12,floorPolygons:l.floorRects.length,wallSegments:l.hospitalBoundary12.length,navigationCells:l.floorCells.length});
 report.structureMetrics={baseline:metric(baselineHospital),candidate:metric(hospital)};
 return{polygonCentroidsChecked:checked,boundariesChecked:hospital.hospitalBoundary12.length,joinedRenderCorners:wallPlan.junctions34,doorOpeningPreserved:clone(registration.opening),metrics:report.structureMetrics,claim:'CPU descriptors and analytic boundary only; no rasterization, depth/occlusion or visual approval'};
});


await test('B1 merged floor exactly matches sampled baseline plus authored additions',()=>{
 const contains=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 const rects=[...hospital.hospitalPrototypeB1.rooms,...hospital.hospitalPrototypeB1.corridors].map(r=>r.uv);let probes=0;
 for(let y=-27.877;y<81;y+=.5)for(let x=-27.731;x<81;x+=.5){const u=x-y,v=x+y,expected=BA.hospitalInside12(x,y)||rects.some(([a,b,c,d])=>u>=a&&u<b&&v>=c&&v<d),actual=hospital.hospitalWalkPolygons12.some(poly=>contains([x,y],poly));assert.equal(actual,expected,'floor coverage '+x+','+y);probes++;}
 return{probes,method:'non-boundary grid samples: actual clipped polygon union compared with exact baseline analytic domain union authored room/corridor rectangles; boundary contacts are tested separately',continuousProof:false};
});


await test('B1 co-op host/guest preserve the published hospital layout; solo prototype only',()=>{
 const rows=[];
 for(const role of ['host','guest']){
  const b={window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>role}},console,URL,performance,Float32Array};vm.createContext(b);vm.runInContext(renderer,b);
  const oldBox={window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>role}},console,URL,performance,Float32Array};vm.createContext(oldBox);vm.runInContext(baselineRenderer,oldBox);
  const meta={seedR73:75,worldR74:1,worldR75:1},old=oldBox.window.StoryPhase1.explorationLayout('ep1a08','hospital',false,meta),now=b.window.StoryPhase1.explorationLayout('ep1a08','hospital',false,meta);
  assert.equal(hash(JSON.stringify(now)),hash(JSON.stringify(old)));assert.equal(now.hospitalPrototypeB1,undefined);rows.push({role,layoutSHA256:hash(JSON.stringify(now)),baselineEqual:true});
 }
 assert.equal(hospital.hospitalPrototypeB1.revision,'ep1a08-ward-loop-b1');
 return{rows,scope:'CPU descriptor equality for co-op spatial layout only; no real networking, reconnect, peer protocol or co-op battle validation'};
});

function modeRuntime({seed=48,connectionHTML=html}={}){
 const h=runtime({seed}),c=h.c;
 // Renderer and real HTML connection share this VM/window/mode accessor.
 vm.runInContext(renderer,c,{filename:'candidate-renderer-same-vm'});
 for(const d of c.regions)d.theme=c.StoryPhase1.REGIONAL_TERRAIN_ART[d.id]?.theme||'forest';
 c.__STORYWORLD_MAZE_R73__={run:()=>1729,seed:()=>0};
 c.__STORYWORLD_WORLD_R74__={version:()=>0};c.__STORYWORLD_WORLD_R75__={version:()=>0};
 for(const n of ['groundImage','drawMini'])c[n]=()=>{};
 c.pathTo3=(a,b,r,where=c.room)=>c.findPath(a,b,where,r);
 const factory=c.makeRoom;c.makeRoom=(...args)=>{const r=factory(...args);delete r.exploration;return r;};
 for(const r of Object.values(c.world))delete r.exploration;
 const a=connectionHTML.indexOf('/* Original encounter props, altars, portals and progression are retained. */');
 const b=connectionHTML.indexOf('\n})();',a);assert.ok(a>0&&b>a);
 const connection=connectionHTML.slice(a,b)+'\n})();';
 vm.runInContext(connection,c,{filename:'exact-HTML-spatial-connection'});
 c.__STORYWORLD_EXPLORATION__.attach(c.room);
 c.room.hospitalSeed5=seed;c.__STORYWORLD_HOSPITAL_R5__.selected(c.room);
 return{...h,connectionSHA256:hash(connection),api:c.__STORYWORLD_EXPLORATION__};
}
await test('mode regression counterfactual: prior real connection reuses solo layout in host/guest',()=>{
 const oldHTML=fs.readFileSync('out/hospital-b1/candidate-v3/site/index.html','utf8');
 const h=modeRuntime({connectionHTML:oldHTML}),c=h.c,api=h.api,off=api.layout('ep1a08');
 assert.ok(off.hospitalPrototypeB1);const rows=[];
 for(const mode of ['host','guest']){c.role=mode;api.attach(c.room);assert.equal(api.layout('ep1a08'),off);assert.equal(c.room.exploration,off);rows.push({mode,staleSoloLayoutReused:true});}
 return{rows,scope:'same VM real prior cache/get/attach with fixed run1729/seed0/version0; controlled mode accessor, no network',connectionSHA256:h.connectionSHA256};
});
await test('mode cache/get/attach warm repeated off-host-off and off-guest-off rebind and reuse native safe arrival',()=>{
 const h=modeRuntime({seed:48}),c=h.c,api=h.api,off=api.layout('ep1a08');
 const objects={off},rows=[];let selectedCalls=0,arrivalCalls=0;
 const r5=c.__STORYWORLD_HOSPITAL_R5__,arrival=c.__STORYWORLD_PORTAL_ARRIVAL_R73__;
 c.__STORYWORLD_HOSPITAL_R5__={...r5,selected(...a){selectedCalls++;return r5.selected(...a);}};
 c.__STORYWORLD_PORTAL_ARRIVAL_R73__={...arrival,point(...a){arrivalCalls++;return arrival.point(...a);}};
 const snapshot=()=>JSON.stringify({progress:c.progress,points:c.player.points,hp:c.player.hp,actors:c.room.enemies.map(e=>({id:e.id,hp:e.hp,kind:e.midboss?'midboss':'ordinary',path:e.path,spawnState:e.spawnState}))});
 for(const mode of ['host','guest']){c.role=mode;objects[mode]=api.layout('ep1a08');assert.notEqual(objects[mode],off);assert.equal(objects[mode].hospitalPrototypeB1,undefined);}
 assert.notEqual(objects.host,objects.guest);c.role='off';
 for(const mode of ['host','guest'])for(const location of [{kind:'existing-corridor',x:47,y:8},{kind:'new-ward',x:17.5,y:37.5}])for(let repeat=0;repeat<2;repeat++){
  api.attach(c.room);assert.equal(c.room.exploration,objects.off);Object.assign(c.player,{x:location.x,y:location.y});assert.equal(c.blocked(c.player.x,c.player.y,.4),false);
  const actors=JSON.stringify(c.room.enemies.map(e=>({id:e.id,hp:e.hp,path:e.path,spawnState:e.spawnState}))),props=c.room.props.length,before=snapshot(),priorSelected=selectedCalls,priorArrival=arrivalCalls;
  c.role=mode;api.attach(c.room);assert.equal(c.room.exploration,objects[mode]);assert.equal(api.layout('ep1a08'),objects[mode]);assert.equal(c.room.props.length,props);
  const corrected=location.kind==='new-ward';assert.equal(c.blocked(location.x,location.y,.4),corrected);
  assert.equal(c.blocked(c.player.x,c.player.y,.34),false);assert.ok(c.findPath(c.player,c.room.objective).length);
  assert.equal(selectedCalls-priorSelected,corrected?1:0);assert.equal(arrivalCalls-priorArrival,corrected?1:0);
  if(!corrected){assert.equal(c.player.x,location.x);assert.equal(c.player.y,location.y);}
  const cooperativePosition={x:c.player.x,y:c.player.y};assert.equal(snapshot(),before);api.attach(c.room);assert.equal(c.player.x,cooperativePosition.x);assert.equal(c.player.y,cooperativePosition.y);assert.equal(selectedCalls-priorSelected,corrected?1:0);assert.equal(arrivalCalls-priorArrival,corrected?1:0);
  c.role='off';api.attach(c.room);assert.equal(c.room.exploration,objects.off);assert.equal(c.player.x,cooperativePosition.x);assert.equal(c.player.y,cooperativePosition.y);assert.equal(c.blocked(location.x,location.y,.4),false);
  assert.equal(JSON.stringify(c.room.enemies.map(e=>({id:e.id,hp:e.hp,path:e.path,spawnState:e.spawnState}))),actors);assert.equal(c.__STORYWORLD_MAZE_R73__.run(),1729);
  rows.push({mode,location:location.kind,repeat,cooperativePosition,correctedWithNativeEntry:corrected,run:1729,seed:0,version:0,r75version:0});
 }
 return{rows,selectedCalls,arrivalCalls,connectionSHA256:h.connectionSHA256,identityChecks:'same attached room, warmed off/host/guest object caches, no run/seed/version change',modeSetter:'controlled fixture; actual co-op start/stop and network not executed'};
});
await test('mode native restore attaches current layout and preserves safe save positions across roles and layers',async()=>{
 const rows=[];
 for(const seed of [0,49,48]){
  const h=modeRuntime({seed}),c=h.c,api=h.api;
  for(const l of ['STORY','DREAM']){
   c.role='off';c.layer=l;c.room=c.getRoom('ep1a08',l);api.attach(c.room);c.room.hospitalSeed5=seed;
   Object.assign(c.player,{x:17.5,y:37.5});const solo=h.raw();assert.equal(solo.player.x,17.5);assert.equal(solo.player.y,37.5);
   for(const mode of ['host','guest']){
    c.role=mode;await c.restoreSave(solo);assert.equal(c.room.exploration.hospitalPrototypeB1,undefined);for(const r of Object.values(c.world))if(r.id==='ep1a08'){assert.equal(r.exploration,api.layout(r.id,r.layer));assert.equal(r.exploration.hospitalPrototypeB1,undefined);}assert.equal(c.blocked(c.player.x,c.player.y,.34),false);assert.ok(c.findPath(c.player,c.room.objective).length);
    const safe={x:c.player.x,y:c.player.y},safeSave=h.raw();assert.notEqual(JSON.stringify(safe),JSON.stringify({x:17.5,y:37.5}));await c.restoreSave(safeSave);assert.equal(c.player.x,safe.x);assert.equal(c.player.y,safe.y);
    c.role='off';await c.restoreSave(solo);assert.ok(c.room.exploration.hospitalPrototypeB1);assert.equal(c.player.x,17.5);assert.equal(c.player.y,37.5);assert.ok(c.findPath(c.player,c.room.objective).length);
    rows.push({seed,layer:l,mode,safePosition:safe,soloPositionRestored:true});
   }
  }
 }
 return{rows,connection:'actual HTML cache/get/attach and restore wrapper plus native hospital R5/R73 and core restore',outerValidator:'version6 admission remains a fixture; no original user save compatibility claim',network:'not exercised'};
});

const T=await import('./site/vendor/three/build/three.module.js');
const modeFixRenderer=fs.readFileSync('out/hospital-b1/mode-fix/site/dist/phase1.js','utf8');
const hex=m=>m.color.getHexString();
function visualFixture(){
 renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled:true};
 const texture=new T.Texture(),mat=()=>new T.MeshBasicMaterial({map:texture,color:0xffffff}),floor=()=>new T.MeshStandardMaterial({map:texture,color:0xffffff,emissive:0x444444});
 const r={T,sceneGeneration:1,spatialRoot:new T.Group(),spatialResources:new Set(),sightState24:{uniforms:{sightEnabled24:{value:0}}},stoneMaterial:mat(),wallMaterial:mat(),backgroundMaterial:mat(),wallCapMaterial61:mat(),regionalTrimMaterial55:mat(),visualWardMaterial:mat(),hospitalWallMaterial:mat(),hospitalDoorDetailMaterial37:mat(),visualFloorMaterials:[floor(),floor()]};r.visualFloorMaterial=r.visualFloorMaterials[0];A.applyMapReadabilityR71(r,{theme:'hospital'});return r;
}
await test('visual plan scope and structure/projection/door/legacy stay locked; HTML only adds test storage/cache',()=>{
 let role='off';renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled:true};renderContext.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>role};
 const f={zone:'ep1a08',exploration:hospital};assert.ok(A.hospitalVisualPlanB1(f));
 for(const id of data.portalOrder.filter(id=>id!=='ep1a08'))assert.equal(A.hospitalVisualPlanB1({...f,zone:id}),null);
 for(const mode of ['host','guest']){role=mode;assert.equal(A.hospitalVisualPlanB1(f),null);}role='off';assert.equal(A.hospitalVisualPlanB1({...f,exploration:baselineHospital}),null);renderContext.window.__STORYWORLD_VISUAL_OPTIONS__.enabled=false;assert.equal(A.hospitalVisualPlanB1(f),null);renderContext.window.__STORYWORLD_VISUAL_OPTIONS__.enabled=true;
 const slice=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
 for(const [a,b]of [['function explorationBlocked(','/* Hospital only: approved text diagram'],['function hospitalDoorRegistration31(','function hospitalWallPieces12('],['class Projection {','// Explicit source-frame geometry'],['class LegacyRenderer {','function createController(']])assert.equal(slice(renderer,a,b),slice(modeFixRenderer,a,b));
 const prior=html.replace(/<script id="hospital-b1-test-storage">[\s\S]*?<\/script>\n/,'').replaceAll('window.__STORYWORLD_TEST_STORAGE_B1__.store.','localStorage.').replace('./dist/phase1.js?hospital-b1=a09c0d264510286b','./dist/phase1.js?r76=1');assert.equal(prior,fs.readFileSync('out/hospital-b1/mode-fix/site/index.html','utf8'));
 const mf={window:{},console,URL,performance,Float32Array};vm.createContext(mf);vm.runInContext(modeFixRenderer,mf);assert.equal(hash(JSON.stringify(hospital)),hash(JSON.stringify(mf.window.StoryPhase1.explorationLayout('ep1a08','hospital',false,{}))));
 return{HTMLByteEqual:false,HTMLMatchesAfterOnlyTestStorageAndCacheWiring:true,actualStorageAdapterExecuted:true,layoutByteEqual:true,coreCollisionProjectionDoorLegacySourceByteEqual:true,scope:'solo ep1a08 Three presentation only; no Legacy change'};
});
await test('visual actual Three CPU meshes reuse wall texture/mask at wall texel density without floor props',()=>{
 renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled:true};renderContext.window.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'off'};
 const r=visualFixture(),frame={zone:'ep1a08',exploration:hospital},before=hash(JSON.stringify(hospital));
 const d=A.applyHospitalVisualB1(r,frame);assert.equal(d.wallMarkers,2);assert.equal(d.meshCount,7);assert.equal(d.newLights,0);assert.equal(d.newFog,0);assert.equal(d.newBloom,0);
 const root=r.spatialRoot.children[0];assert.equal(root.children.length,2);let meshes=0,triangles=0;const rows=[];
 for(const group of root.children){group.updateMatrixWorld(true);const p=new T.Vector3();group.getWorldPosition(p);assert.equal(A.explorationBlocked(hospital,p.x,p.z,0),false);assert.equal(A.explorationBlocked(hospital,p.x,p.z,.31),true,'wall-mounted marker lies inside native wall clearance');assert.equal(A.explorationBlocked(hospital,p.x+.5*Math.SQRT1_2,p.z+.5*Math.SQRT1_2,.31),false);assert.equal(p.y,1.25);
  const nearest=hospital.hospitalBoundary12.map(w=>{const[a,b]=w.endpoints,dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(dx*dx+dz*dz)));return{w,d:Math.hypot(p.x-a[0]-t*dx,p.z-a[1]-t*dz)};}).sort((a,b)=>a.d-b.d)[0],contactGap=nearest.d-.045/2-nearest.w.depth/2;assert.ok(contactGap>=-.02&&contactGap<=0,'flush wall contact with bounded overlap');assert.equal(group.children[0].renderOrder,0);assert.equal(group.children[1].renderOrder,1);for(const mesh of group.children.slice(2))assert.equal(mesh.renderOrder,2);const cells=new Set();
  group.traverse(mesh=>{if(!mesh.isMesh)return;meshes++;triangles+=mesh.geometry.index.count/3;assert.equal(mesh.material.map,r.hospitalWallMaterial.map);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.depthWrite,false);assert.ok(String(mesh.material.onBeforeCompile).includes('sightGround24'));assert.equal(mesh.castShadow,false);assert.equal(mesh.userData.collisionChanged,false);assert.ok(mesh.layers.isEnabled(2));
   const pos=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,panelHeight=Math.max(...hospital.hospitalVisualWalls12.map(w=>w.height));
   for(let i=0;i<pos.count;i++){const world=mesh.localToWorld(new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)));assert.ok(world.y>=.85);const along=(world.x-world.z)/Math.SQRT2/panelHeight,cell=Math.floor(along);cells.add(cell);const u=((cell%2+2)%2)?1-(along-cell):along-cell,v=1-world.y/panelHeight;assert.ok(Math.abs(uv.getX(i)-(628.5+u*623)/1254)<1e-6);assert.ok(Math.abs(uv.getY(i)-(1-(1.5+v*623)/1254))<1e-6);assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);}
  });assert.equal(cells.size,1,'small marker never crosses UV fold');rows.push({id:group.name,position:{x:p.x,y:p.y,z:p.z},boxMeshes:group.children.length,UVCells:[...cells],wallContactGap:contactGap,renderOrders:group.children.map(m=>m.renderOrder)});
 }
 assert.equal(meshes,7);assert.equal(triangles,84);assert.equal(hash(JSON.stringify(hospital)),before);const resources=r.spatialResources.size;A.applyHospitalVisualB1(r,frame);assert.equal(r.spatialRoot.children[0],root);assert.equal(r.spatialResources.size,resources);
 report.visualMeshEvidence={rows,meshes,triangles,newMaterials:resources,originalTexturesReused:true,GPUVerified:false};return report.visualMeshEvidence;
});
await test('visual palette/material/marker lifecycle restores host and other-region state with bounded resources',()=>{
 let role='off';renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled:true};renderContext.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>role};const r=visualFixture(),frame={zone:'ep1a08',exploration:hospital};
 const all=[r.stoneMaterial,r.wallMaterial,r.backgroundMaterial,r.visualWardMaterial,r.hospitalWallMaterial,r.hospitalDoorDetailMaterial37,...r.visualFloorMaterials],old=all.map(m=>({m,color:hex(m),emissive:m.emissive?.getHexString(),hook:m.onBeforeCompile,map:m.map}));
 A.applyHospitalVisualB1(r,frame);assert.equal(hex(r.stoneMaterial),'bfc6bf');assert.equal(hex(r.hospitalWallMaterial),'78878a');assert.equal(hex(r.visualWardMaterial),'4c5d62');assert.equal(hex(r.hospitalDoorDetailMaterial37),'9eafaa');
 for(const v of old){if(v.m===r.hospitalWallMaterial){assert.notEqual(v.m.onBeforeCompile,v.hook,'hospital source gets an intentional safe wrapper');const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};v.m.onBeforeCompile(shader,{});assert.equal((shader.vertexShader.match(/varying vec2 sightGround24;/g)||[]).length,1);assert.equal((shader.fragmentShader.match(/uniform sampler2D sightMask24;/g)||[]).length,1);}else assert.equal(v.m.onBeforeCompile,v.hook);assert.equal(v.m.map,v.map);}
 role='host';assert.equal(A.applyHospitalVisualB1(r,frame),null);assert.equal(r.spatialRoot.children.length,0);assert.equal(r.spatialResources.size,0);for(const v of old){assert.equal(hex(v.m),v.color);assert.equal(v.m.emissive?.getHexString(),v.emissive);}
 role='off';A.applyHospitalVisualB1(r,frame);assert.equal(r.spatialRoot.children.length,1);assert.equal(r.spatialResources.size,2);
 renderContext.window.__STORYWORLD_VISUAL_OPTIONS__.enabled=false;assert.equal(A.applyHospitalVisualB1(r,frame),null);assert.equal(r.spatialRoot.children.length,0);assert.equal(r.spatialResources.size,0);for(const v of old){assert.equal(hex(v.m),v.color);assert.equal(v.m.emissive?.getHexString(),v.emissive);}
 renderContext.window.__STORYWORLD_VISUAL_OPTIONS__.enabled=true;A.applyHospitalVisualB1(r,frame);
 // Mirror the existing scene clear before re-entering; no WebGL constructor.
 r.spatialRoot.traverse(o=>o.geometry?.dispose());r.spatialRoot.clear();for(const m of r.spatialResources)m.dispose();r.spatialResources.clear();r.sceneGeneration++;
 A.applyHospitalVisualB1(r,frame);assert.equal(r.spatialRoot.children.length,1);assert.equal(r.spatialResources.size,2);A.applyHospitalVisualB1(r,{zone:'ep1a09',exploration:baselineHospital});assert.equal(r.spatialRoot.children.length,0);assert.equal(r.spatialResources.size,0);
 return{actualThreeRevision:T.REVISION,hostRestoresOriginalColors:true,existingVisualOptionOFFRestoresOriginal:true,materialMapsPreserved:true,otherHooksUnchanged:true,hospitalSourceHookIntentionallyWrapped:true,warmFrameNoAllocation:true,sceneClearReentryBounded:true,additionalLights:0,additionalImageAssets:0,GPUVerified:false};
});
await test('visual proposed material role contrast is numeric only and original asset bytes remain preserved',()=>{
 renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled:true};renderContext.window.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'off'};const p=A.hospitalVisualPlanB1({zone:'ep1a08',exploration:hospital}).palette;
 const luminance=hex=>{const c=[16,8,0].map(n=>(hex>>n&255)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];},contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05),floorWall=contrast(p.floor,p.wall),floorBackground=contrast(p.floor,p.background);
 assert.ok(floorWall>=2);assert.ok(floorBackground>=3);
 const assets=['assets/visual-test/hospital-floor-material-atlas.png','assets/visual-test/hospital-quiet-material-atlas-r42.png','assets/rc138/map-ep1a08.png'];const rows=assets.map(path=>{const old=fs.readFileSync('out/hospital-b1/mode-fix/site/'+path),current=fs.readFileSync('out/hospital-b1/build-connected/site/'+path);assert.deepEqual(current,old);return{path,sha256:hash(current),bytes:current.length};});
 return{floorWallMaterialTintRatio:floorWall,floorBackgroundMaterialTintRatio:floorBackground,sourceAssets:rows,meaning:'proposed tint coefficients only; actual textured pixel/lighting/occlusion/flashlight/touch quality unverified',generatedImages:0,GPUVerified:false};
});

assert.equal(hash(JSON.stringify(hospital)),hospitalInitialHash,'shared hospital layout was not mutated');
report.finishedAt=new Date().toISOString();report.passed=report.cases.filter(c=>c.ok).length;report.failed=report.cases.filter(c=>!c.ok).length;report.ok=report.failed===0;report.remainingUnverified=['Browser natural progression from hub through early maps to hospital','Full production outer validator/asset admission and user save compatibility','R52/R53 ordinary spawn/AI and actual combat balance/evade/hazards','Real medical staff ID classification/protection across all attack channels','Visual floor/wall/door/flashlight quality, touch usability, physical/mobile/GPU performance'];
fs.writeFileSync(process.env.SIM_RESULTS||'out/hospital-b1/build-connected/final-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,ok:report.ok}));if(!report.ok)process.exitCode=1;
