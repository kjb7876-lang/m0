import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), html=fs.readFileSync('out/hospital-b2/site/index.html','utf8'), renderer=fs.readFileSync('out/hospital-b2/site/dist/phase1.js','utf8');
const hash=x=>createHash('sha256').update(x).digest('hex'), clone=x=>JSON.parse(JSON.stringify(x));
const report={scriptSHA256:hash(fs.readFileSync(new URL(import.meta.url))),filter:process.env.SIM_CASE_FILTER||null,schema:'m0.hospital.cpu-simulation/v1',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),htmlSHA256:hash(html),rendererSHA256:hash(renderer),node:process.version,platform:process.platform,startedAt:new Date().toISOString(),method:'CPU Node VM, real compiled layout/collision/path and extracted native progression/restore functions plus real modular route/slot/door/hospital wrappers. Assisted state fixtures; no browser, DOM rendering, GPU, touch or natural game completion.',substitutions:['DOM/panels/buttons: inert objects and handler Map','B2 adds exact compiled runtime adapter and R52 nav; basic cases use already attached layout fixture; mode cases use actual cache/get/attach with selected wrapper order, NOT full HTML order; tick/move/separate base remain inert; no full AI' ,'input: direct native function calls and collision-validated fixture walking, not keyboard/touch','region fixtures: real canonical ID/order/chapter/records, synthetic w/e directional exit labels; underlying enterRegion is an admitted fixture, not complete production chapter/asset admission or ordinary arrival placement','clock: explicit simulation dt; no rAF','narrative base renderer: in-memory scene queue, manually acknowledged; native checkpoint wrapper retained','room construction: disposable sourcePlan actors; no full compileWorld, R52/R53 ordinary placement, health/tier normalization or AI execution','full version6 outer schema/asset/unlock validation: fixture envelope admission; native core restore loop retained, not complete production validator','audio/effects/XP presentation: no-op or audit counters; native point/progress completion retained','progress before hospital: explicitly seeded complete in isolated fixture, never natural progression','forced ordinary/midboss deaths and empty corridor fixtures: explicitly labelled; no combat balance claim'],cases:[],extracted:[],errors:[]};
report.branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();report.coreSourceSHA256=hash(fs.readFileSync('client-source/hospital-core-b2.js'));report.buildEvidence=JSON.parse(fs.readFileSync('out/hospital-b2/build.json','utf8'));
assert.equal(report.htmlSHA256,report.buildEvidence.runtimeHashes['index.html']);assert.equal(report.rendererSHA256,report.buildEvidence.runtimeHashes['dist/phase1.js']);
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
function runtime({withSlots=false,initialStorage={},seed=123,installB2=true}={}){
 const prefix='storyworld.hospital-b2.test.v1:',rawStorage=new Map(Object.entries(initialStorage).map(([k,v])=>[prefix+k,v])),storage={get:k=>rawStorage.get(prefix+k),set:(k,v)=>rawStorage.set(prefix+k,v),delete:k=>rawStorage.delete(prefix+k)},handlers=new Map(),audit=[];let quotaKey=null;
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
 c.tick=()=>{};c.moveActor=()=>{};c.separate3=()=>{};
 vm.runInContext(script('hospital-navigation-r52'),c);
 const rs=html.indexOf(' const saveBase=serializeSave;serializeSave=function(...args){const data=saveBase.apply(this,args),rows={};for(const r of new Set([...Object.values(world||{}),room]))if(hospital(r)&&r.hospitalBossSummonsR53)'),re=html.indexOf(' window.__STORYWORLD_HOSPITAL_BOSS_R53__=',rs);
 assert.ok(rs>0&&re>rs);
 c.regionById.ep1a08.roster=sourceRows('ep1a08').filter(e=>!e.midboss).map(e=>({...e,id:e.nativeId}));
 c.actor3=(def,id,x,y)=>Object.assign(actor({...def,id,nativeId:def.id}),{id,x,y,homeX:x,homeY:y});
 vm.runInContext("(()=>{const hospital=r=>r?.id==='ep1a08',metrics={restoredSummons:0},finite=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"+html.slice(rs,re)+"})();",c);
 vm.runInContext(script('routes-r72'),c);vm.runInContext(script('portal-arrival-r73'),c);
 c.__STORYWORLD_EXPLORATION__.attach=r=>r;
 if(installB2){vm.runInContext(script('hospital-core-b2-runtime'),c);c.__STORYWORLD_HOSPITAL_CORE_B2__.repair(c.room);}

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



function modeRuntime({seed=48,connectionHTML=html}={}){
 const h=runtime({seed,installB2:false}),c=h.c;
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
 vm.runInContext(script('hospital-core-b2-runtime'),c);c.__STORYWORLD_HOSPITAL_CORE_B2__.repair(c.room);
 return{...h,connectionSHA256:hash(connection),api:c.__STORYWORLD_EXPLORATION__};
}

await test('B2 replaces core with internal rooms and forces a turn before objective',()=>{
 const h=runtime(),c=h.c,L=c.room.exploration;
 assert.ok(L.hospitalCoreB2);assert.equal(L.coreReshaped,true);assert.equal(L.hospitalPrototypeB1,undefined);
 for(const p of [{x:18,y:18.5},{x:18,y:19},{x:21,y:19}]){assert.equal(c.blocked(p.x,p.y,.4),true);assert.equal(BA.explorationBlocked(baselineHospital,p.x,p.y,.4),false);}
 assert.equal(c.clearPath3({x:18,y:32},c.room.objective,.4),false);
 const path=c.findPath({x:18,y:32},c.room.objective,c.room,.4);assert.ok(path.length>=2);
 return{changedCorePoints:[[18,18.5],[18,19],[21,19]],path,rectangles:clone(L.hospitalCoreB2.rects),screenVerified:false};
});
await test('B2 union floor cells/polygons and wall thickness share exact definition',()=>{
 const L=hospital,rows=[];
 for(let y=1;y<36;y+=.5)for(let x=-3;x<36;x+=.5){
  const inside=A.hospitalCoreContainsB2(x+.13,y+.13),drawn=L.floorRects.some(f=>x+.13>=f.x&&x+.13<f.x+f.width&&y+.13>=f.y&&y+.13<f.y+f.depth);
  assert.equal(inside,drawn);if(inside)assert.equal(A.explorationBlocked(L,x+.13,y+.13,0),L.hospitalBoundary12.some(w=>{
   const[a,b]=w.endpoints,dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x+.13-a[0])*dx+(y+.13-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x+.13-a[0]-t*dx,y+.13-a[1]-t*dy)<.12;
  }));
 }
 assert.equal(L.floorCells.length,L.hospitalWalkArea12);assert.ok(L.hospitalBoundary12.every(w=>w.depth===.24));
 assert.equal(A.explorationBlocked(L,14.2,18,.27),true);return{floorCells:L.floorCells.length,floorRects:L.floorRects.length,walls:L.walls.length,wallDepth:.24,method:'real compiled collision and union; no GPU'};
});
await test('B2 every four-unit inner door passes maximum native .55 body plus .14 margin',()=>{
 const h=runtime(),c=h.c,rows=[];const paths=[['west-inner',{x:12,y:15},{x:12,y:22}],['east-inner',{x:24,y:15},{x:24,y:22}],['north',{x:16,y:2},{x:16,y:9}],['west-ward',{x:1,y:15},{x:8,y:15}],['upper-exit',{x:8,y:8},{x:12,y:8}]];
 for(const[name,a,b]of paths){assert.equal(c.clearPath3(a,b,.69),true,name);rows.push({name,a,b,bodyAndMargin:.69});}
 return{rows,nominalWidth:4,afterWallDepth:3.76,centreTravelAtMaxBody:2.38,dynamicAIOrAttackHazards:false};
});
await test('B2 original actor positions repair by native nav without identity/HP/wave mutation',()=>{
 const h=runtime(),c=h.c;
 c.room.enemies.forEach(e=>{e.combatProfile.bodyBlock.r=.55;e.hp=37.25;e.maxHp=111.5;});
 const before=c.room.enemies.map(e=>({ref:e,id:e.id,hp:e.hp,maxHp:e.maxHp,wave:e.fieldWaveIndex6,state:e.spawnState,path:e.path}));
 const a=c.room.enemies.find(e=>e.nativeId==='a08-o1'),b=c.room.enemies.find(e=>e.nativeId==='a08-o2');
 Object.assign(a,{x:26.1872,y:22.4552});Object.assign(b,{x:6.1737,y:10.4307});const from=[{id:a.id,x:a.x,y:a.y},{id:b.id,x:b.x,y:b.y}];
 c.__STORYWORLD_HOSPITAL_CORE_B2__.repairActors(c.room);
 for(const old of before){const e=c.room.enemies.find(e=>e.id===old.id);assert.equal(e,old.ref);assert.equal(e.hp,old.hp);assert.equal(e.maxHp,old.maxHp);assert.equal(e.fieldWaveIndex6,old.wave);assert.equal(e.spawnState,old.state);assert.equal(e.path,old.path);assert.equal(c.blocked(e.x,e.y,.69),false);}
 return{count:before.length,from,to:[{id:a.id,x:a.x,y:a.y},{id:b.id,x:b.x,y:b.y}],maxBody:.55,clearance:.14};
});
await test('B2 actual R53 placement plan adapts 24 density fixture objects into unchanged four bay IDs',()=>{
 const h=runtime(),c=h.c,nav=c.__STORYWORLD_HOSPITAL_NAV_R52__,units=[];
 for(const row of sourceRows('ep1a08').filter(r=>!r.midboss))for(let i=0;i<2;i++){const e=actor({...row,id:row.id+(i?':density2':'')});e.combatProfile.bodyBlock.r=.55;units.push(e);}
 c.room.enemies=units;
 const begin=html.indexOf('function plan(r){',html.indexOf("revision='hospital-layout-and-foot-health-r53'")),end=html.indexOf('function groups(',begin),actual=html.slice(begin,end);
 c.__planInput=units;vm.runInContext("(()=>{const hospital=r=>r.id==='ep1a08',ordinary=e=>!e.midboss,nav=()=>window.__STORYWORLD_HOSPITAL_NAV_R52__;"+actual+"window.__actualPlanB2=plan;})();",c);
 const plan=c.__actualPlanB2(c.room);assert.equal(plan.length,24);
 for(const row of plan){assert.equal(nav.isSafe(row.e,row.p.x,row.p.y,c.room),true);assert.ok(['left-upper','right-upper','left-lower','right-lower'].includes(row.bay.id));}
 for(let i=0;i<plan.length;i++)for(let j=0;j<i;j++)assert.ok(c.distance(plan[i].p,plan[j].p)>=1.63-.000001);
 return{count:plan.length,bodyAndMargin:.69,actualPlanSHA256:hash(actual),groups:[...new Set(plan.map(p=>p.group))],populationIsDeliberateFixture:true};
});
await test('B2 actual native R53 summon position search retains safe body and retreat',()=>{
 const h=runtime(),c=h.c,e=c.room.enemies.find(e=>e.midboss);Object.assign(e,{x:18,y:11,spawnState:'active'});c.room.enemies=[e];Object.assign(c.player,{x:15,y:13});
 const start=html.indexOf('function spawnPosition(e,r,index){'),end=html.indexOf('function summon(e,p){',start),actual=html.slice(start,end);vm.runInContext(actual,c);
 const rows=[];for(let i=0;i<2;i++){const p=c.spawnPosition(e,c.room,i);assert.ok(p);assert.equal(c.__STORYWORLD_HOSPITAL_NAV_R52__.isSafe(e,p.x,p.y,c.room),true);assert.ok(c.findPath(p,c.room.objective,c.room,.69).length);rows.push({index:i,point:p});}
 return{rows,sourceSHA256:hash(actual),nativeSearchExecuted:true,actualUnitConstructionAndLiveAI:false};
});
await test('B2 stage-specific invalid player and route-entry restoration retains native progress',async()=>{
 const rows=[];for(const stage of ['field','active','complete']){
  const h=modeRuntime({seed:49}),c=h.c;
  if(stage!=='field'){h.forceFieldClear();c.player.x=15;c.player.y=13;c.interact();c.stepSummoning(1);}
  if(stage==='complete'){c.killEnemy(c.room.enemies.find(e=>e.midboss));c.interact();h.ack();}
  const raw=h.raw();raw.player.x=50.5;raw.player.y=50.5;raw.routeEntriesR72={version:1,entries:{'STORY:ep1a08':{x:50.5,y:50.5}}};
  const before={progress:JSON.stringify(c.progress),hp:c.player.hp,points:c.player.points,stage:c.room.encounterStage};await c.restoreSave(raw);
  assert.equal(JSON.stringify(c.progress),before.progress);assert.equal(c.player.hp,before.hp);assert.equal(c.player.points,before.points);assert.equal(c.room.encounterStage,before.stage);
  assert.equal(c.blocked(c.player.x,c.player.y,.4),false);const entry=c.__STORYWORLD_ROUTES_R72__.points().previous;assert.ok(entry);assert.equal(c.blocked(entry.x,entry.y,.43),false);
  for(const e of c.room.enemies)assert.equal(c.blocked(e.x,e.y,c.__STORYWORLD_HOSPITAL_CORE_B2__.radius(e)),false);
  if(stage==='active')assert.ok(c.player.y<17&&c.player.x>=10,'active safe point remains inside new combat room');
  rows.push({stage,position:{x:c.player.x,y:c.player.y},entry,schemaChanged:false});
 }return{rows,productionValidatorStillFixture:true};
});
await test('B2 simultaneous saved ordinary/dead/major/dynamic entity repair preserves state and references',async()=>{
 const h=modeRuntime(),c=h.c;const r=c.room;
 const units=[actor(sourceRows('ep1a08')[0]),actor(sourceRows('ep1a08')[1]),actor(sourceRows('ep1a08').at(-1)),actor({...sourceRows('ep1a08')[0],id:'r53-summon:fixture'})];
 units.forEach((e,i)=>{e.x=50+i;e.y=50;e.homeX=e.x;e.homeY=e.y;e.hp=i===1?0:23+i;e.deadRecorded=i===1;e.spawnState=i===1?'dead':'active';e.combatProfile.bodyBlock.r=.55;});units[3].hospitalSummonR53={owner:units[2].id,version:1,serial:1};
 r.enemies=units;const before=units.map(e=>({e,id:e.id,hp:e.hp,dead:e.deadRecorded,state:e.spawnState,wave:e.fieldWaveIndex6,summon:JSON.stringify(e.hospitalSummonR53)}));
 c.__STORYWORLD_HOSPITAL_CORE_B2__.repair(r);
 for(const o of before){assert.equal(r.enemies.find(e=>e.id===o.id),o.e);assert.equal(o.e.hp,o.hp);assert.equal(o.e.deadRecorded,o.dead);assert.equal(o.e.spawnState,o.state);assert.equal(o.e.fieldWaveIndex6,o.wave);assert.equal(JSON.stringify(o.e.hospitalSummonR53),o.summon);assert.equal(c.blocked(o.e.x,o.e.y,.69),false);}
 return{count:units.length,actorsAreDiscardableSavedStateFixtures:true,actualB2RepairAndNativeR52Nearest:true,fullR53AndR61RestoreWrappersNotExecuted:true};
});
await test('B2 actual warm cache/get/attach repairs both directions including all actors and entries',()=>{
 const h=modeRuntime({seed:48}),c=h.c,api=h.api,identities=new Map(),rows=[];
 for(const role of ['off','host','guest']){c.role=role;identities.set(role,api.layout('ep1a08'));}c.role='off';api.attach(c.room);
 const state=()=>JSON.stringify({progress:c.progress,points:c.player.points,actors:c.room.enemies.map(e=>({id:e.id,hp:e.hp,dead:e.deadRecorded,wave:e.fieldWaveIndex6,state:e.spawnState,path:e.path}))});
 for(const role of ['host','guest'])for(let cycle=0;cycle<3;cycle++){
  c.role='off';api.attach(c.room);Object.assign(c.player,{x:.5,y:19});c.room.r72Entry={x:.5,y:19};const before=state();
  for(const m of [role,'off']){c.role=m;api.attach(c.room);assert.equal(c.room.exploration,identities.get(m));assert.equal(c.blocked(c.player.x,c.player.y,.4),false);assert.ok(c.findPath(c.player,c.room.objective).length);for(const e of c.room.enemies)assert.equal(c.blocked(e.x,e.y,c.__STORYWORLD_HOSPITAL_CORE_B2__.radius(e)),false);const entry=c.__STORYWORLD_ROUTES_R72__.points().previous;assert.ok(entry);assert.equal(c.blocked(entry.x,entry.y,.43),false);assert.equal(state(),before);rows.push({mode:m,cycle,position:{x:c.player.x,y:c.player.y}});}
 }
 return{rows,actualSameVMCacheGetAttach:true,network:false,run:1729,seed:0,versions:[0,0]};
});
await test('B2 actual R53 serialized dynamic units restore with player entry and existing enemy HP',async()=>{
 const h=modeRuntime({seed:49}),c=h.c;h.forceFieldClear();Object.assign(c.player,{x:15,y:13});c.interact();c.stepSummoning(1);
 const boss=c.room.enemies.find(e=>e.midboss);boss.hp=31.5;
 const unit=actor({...sourceRows('ep1a08')[0],id:'r53-summon:1'});Object.assign(unit,{id:'ep1a08:r53-summon:1',hp:17.25,maxHp:200,spawnState:'active',x:50,y:50});unit.hospitalSummonR53={version:1,owner:boss.id,nativeId:unit.nativeId,serial:1};c.room.enemies.push(unit);
 c.room.hospitalBossSummonsR53={version:1,used:1,serial:1,casts:2,nextAt:c.time+4};const raw=h.raw();raw.player.x=50;raw.player.y=50;raw.routeEntriesR72.entries['STORY:ep1a08']={x:50,y:50};
 assert.equal(raw.hospitalBossR53.rooms['STORY:ep1a08'].units[0].id,unit.id);
 const dead=JSON.stringify(raw.rooms['STORY:ep1a08'].defeatedActorIds),points=c.player.points;await c.restoreSave(raw);
 const restored=c.room.enemies.find(e=>e.id===unit.id);assert.ok(restored);assert.equal(restored.hp,17.25);assert.equal(restored.maxHp,200);assert.equal(restored.hospitalSummonR53.owner,boss.id);assert.equal(c.room.enemies.find(e=>e.id===boss.id).hp,31.5);assert.equal(c.player.points,points);assert.equal(JSON.stringify(h.raw().rooms['STORY:ep1a08'].defeatedActorIds),dead);
 assert.equal(c.blocked(restored.x,restored.y,c.__STORYWORLD_HOSPITAL_CORE_B2__.radius(restored)),false);assert.equal(c.blocked(c.player.x,c.player.y,.4),false);
 const next=h.raw();assert.equal(next.hospitalBossR53.rooms['STORY:ep1a08'].units[0].hp,17.25);
 return{unitId:restored.id,hp:restored.hp,maxHp:restored.maxHp,position:{x:restored.x,y:restored.y},actualR53SerializerAndRestore:true,actorConstructorFixture:true,outerValidatorFixture:true};
});
await test('B2 valid coordinates survive reload in both layers and role snapshots restore safely',async()=>{
 const rows=[];for(const l of ['STORY','DREAM'])for(const p of [{x:15,y:13},{x:12,y:22},{x:.5,y:19},{x:32,y:23}]){
  const h=modeRuntime(),c=h.c;c.layer=l;c.room=c.getRoom('ep1a08',l);h.api.attach(c.room);Object.assign(c.player,p);const raw=h.raw();await c.restoreSave(raw);assert.equal(c.player.x,p.x);assert.equal(c.player.y,p.y);
  for(const role of ['host','guest','off']){c.role=role;await c.restoreSave(raw);assert.equal(c.blocked(c.player.x,c.player.y,.4),false);assert.equal(!!c.room.exploration.hospitalCoreB2,role==='off');}
  rows.push({layer:l,original:p});
 }return{rows,fullVersion6Validator:'fixture envelope only',realUserSaves:false};
});
await test('B2 native/EGO authored approaches stay body-safe and native EGO gate is not advanced by position',()=>{
 const h=runtime(),c=h.c,L=c.room.exploration,source=A.REGIONAL_ROUTE_DATA.ep1a08,rows=[];
 for(const p of source.landmarks){assert.equal(c.blocked(p.x,p.y,.69),false,p.cue);assert.ok(c.findPath(c.room.objective,p,c.room,.69).length);rows.push({x:p.x,y:p.y,cue:p.cue});}
 const a=html.indexOf("(()=>{'use strict';\n const data=window.StoryPhase1.REGIONAL_ROUTE_DATA"),b=html.indexOf('\n})();',a);assert.ok(a>0&&b>a);
 c.pathTo3=(from,to,r,where=c.room)=>c.findPath(from,to,where,r);c.segmentDistance=(x,y,p,q)=>{const dx=q.x-p.x,dy=q.y-p.y,t=Math.max(0,Math.min(1,((x-p.x)*dx+(y-p.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-p.x-t*dx,y-p.y-t*dy);};
 vm.runInContext(html.slice(a,b)+'\n})();',c);const native=c.__STORYWORLD_REGION_ROUTES__;let cleared=false,advanced=0;
 c.__STORYWORLD_EGO151__={inspect:()=>({isVisit:true,state:{active:true,index:0,direction:1,cleared}}),routeIds:()=>['ep1a08','ep1a09'],advanceRoute:()=>{advanced++;return true;}};
 vm.runInContext(script('routes-r72'),c);const d=Object.keys(c.regionById.ep1a08.exits).find(d=>c.regionById.ep1a08.exits[d]==='ep1a09');
 assert.equal(c.__STORYWORLD_ROUTES_R72__.status(d).open,false);assert.equal(advanced,0);cleared=true;assert.equal(c.__STORYWORLD_ROUTES_R72__.status(d).egoAdvance,true);assert.equal(c.__STORYWORLD_ROUTES_R72__.status(d).open,true);
 return{rows,nativeModuleSHA256:hash(html.slice(a,b)+'\n})();'),actualNativeEGOAdmission:true,fullEGOJournalAndRouteRoomRestore:false};
});
await test('B2 co-op hospital and all nonhospital compiled layouts retain exact baseline bytes',()=>{
 const rows=[];for(const role of ['host','guest']){const box={window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>role}},console,URL,performance,Float32Array};vm.createContext(box);vm.runInContext(renderer,box);const l=box.window.StoryPhase1.explorationLayout('ep1a08','hospital',false,{});assert.equal(hash(JSON.stringify(l)),hash(JSON.stringify(baselineHospital)));rows.push(role);}
 for(const id of data.portalOrder.filter(id=>id!=='ep1a08')){const safe=!!campaign.profiles.find(p=>p.id===id)?.rest,meta={seedR73:75,worldR74:1,worldR75:1};assert.equal(hash(JSON.stringify(A.explorationLayout(id,A.REGIONAL_TERRAIN_ART[id]?.theme||'forest',safe,meta))),hash(JSON.stringify(BA.explorationLayout(id,BA.REGIONAL_TERRAIN_ART[id]?.theme||'forest',safe,meta))));}
 return{cooperativeRoles:rows,otherRegions:data.portalOrder.length-1,actualNetwork:false};
});
await test('B2 Three/Legacy/options use same structure and core art is excluded without schema/combat edits',()=>{
 const L=hospital;
 assert.ok(html.includes('if(layout?.hospitalCoreB2){/* core map pixels preserved as an asset, not drawn as play floor */}'));
 assert.ok(html.includes('wallProps.get(r).layoutB2===r.exploration'));
 assert.ok(renderer.includes("!frame.exploration?.hospitalCoreB2&&!window.__STORYWORLD_VISUAL_OPTIONS__?.enabled"));
 const signature=hash(JSON.stringify(L));for(const enabled of [true,false]){renderContext.window.__STORYWORLD_VISUAL_OPTIONS__={enabled};const next=A.explorationLayout('ep1a08','hospital',false,{});assert.equal(hash(JSON.stringify(next)),signature);}
 assert.deepEqual(clone(L.coreFloorRects),[]);assert.ok(L.floorRects.length>0);assert.ok(L.walls.length>0);
 return{layoutSHA256:signature,legacyAndThreeActualPixels:false,GPUCompile:false,scope:'actual source wiring and runtime layout; no drawn screenshot acceptance'};
});
await test('B2 actual CPU Three floor/wall geometry preserves full new wall panels without old door cuts',async()=>{
 const T=await import('../../out/hospital-b2/site/vendor/three/build/three.module.js');
 const L=hospital,g=A.hospitalFloorGeometry(T,L.floorRects),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getZ(i);assert.ok(L.floorRects.some(f=>x>=f.x-1e-5&&x<=f.x+f.width+1e-5&&y>=f.y-1e-5&&y<=f.y+f.depth+1e-5));}
 let faces=0;for(const w of L.walls){assert.equal(A.hospitalWallHeight(w,L.floorRects),w.height);const rows=A.hospitalWallPieces12(w,L.floorRects);assert.ok(rows.length>=3);
  for(const row of rows){const area=row.polygons.reduce((n,p)=>n+Math.abs(p.reduce((v,a,i)=>v+a.uv[0]*p[(i+1)%p.length].uv[1]-p[(i+1)%p.length].uv[0]*a.uv[1],0)/2),0);assert.ok(Math.abs(area-1)<1e-7,'old south-door crop must not cut B2 wall '+w.id);faces++;}
 }
 const triangles=g.index.count/3;g.dispose();return{floorVertices:pos.count,floorTriangles:triangles,fullWallFaces:faces,ThreeVersion:T.REVISION,actualDrawCalls:false,GPUCompile:false};
});

report.finishedAt=new Date().toISOString();report.passed=report.cases.filter(x=>x.ok).length;report.failed=report.cases.filter(x=>!x.ok).length;
report.supersededB1Cases=['additive domain/core/old anchors','old outer ward geometry','B1 markers/palette visual plan'];
report.method+=' B2 structural replacement; new cases below replace incompatible B1 additive/visual expectations.';
fs.writeFileSync('out/hospital-b2/results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:report.failed}));process.exitCode=report.failed?1:0;
