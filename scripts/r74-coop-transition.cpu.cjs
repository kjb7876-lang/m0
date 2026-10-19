const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const html=fs.readFileSync('_pages/docs/index.html','utf8');
const sha=crypto.createHash('sha256').update(html).digest('hex');
assert.ok(html.includes('R74-MOBILE-WORLD'));
function script(id){const tag='<script id="'+id+'">',i=html.indexOf(tag)+tag.length;assert.ok(i>=tag.length);return html.slice(i,html.indexOf('</script>',i));}
const coop=script('coop-sim-r62'),gold=script('golden-thread-r72'),core=script('golden-core-r72'),save=script('golden-save-r72');
const nativeStart=html.indexOf('restoreSave=async function(input){const {valid,raw}=normalizeSave3(input);');
assert.ok(nativeStart>0);
const nativeRestore=html.slice(nativeStart,html.indexOf('\n};',nativeStart));
assert.equal(nativeRestore.indexOf('await '),nativeRestore.indexOf('await enterRegion('),'native restoration calls the current global region entry before its first await');
assert.ok(gold.includes('cancelAll(name);return base.apply(this,a);'),'golden lifecycle wrapper must cancel before calling captured region entry');
const baseNames=coop.match(/const base=\{([^}]+)\}/)[1].split(',');
function fixture(deferred,shape){
 const nodes=new Map(),element=()=>({style:{},appendChild(){},addEventListener(){},getContext(){return{};}});
 const x={window:{},console,performance:{now:()=>0},document:{hidden:false,createElement:element,addEventListener(){},querySelectorAll(){return[];}},requestAnimationFrame:()=>0,cancelAnimationFrame(){},canvas:element(),$:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},button(){},toast(){},sound(){},escapeHTML:x=>x};
 vm.createContext(x);
 vm.runInContext(baseNames.map(n=>'function '+n+'(){}').join('\n')+`
 var player={x:0,y:0,hp:777,hero:'hwando',points:100,upgrades:{},resonance:0},time=0,booted=true,started=true,modal=false,loading=false,auto=false,guide=false,settings={autoSkill:false},target=null,route=[],command=null,layer='STORY',zone='arena',effects=[],projectiles=[],hazards=[],delayed=[],damage=[],positions=[],world={},progress={STORY:{},DREAM:{}},visited=new Set(),readScenes=new Set(),ending={},lastHub='hub',storyScene=null,storyQueue=[],storyDone=null,egoRoom151=null,ego151=null,keys=new Set(),joystickVector={x:0,y:0},zoom=1,ctx={},restoreCalls=0;
 var room={id:'arena',layer:'STORY',enemies:[{id:'enemy',x:2,y:2,hp:10000,spawnState:'active'}]};world['STORY:arena']=room;
 var HEROES={hwando:{}},regionById={arena:{}},SPEED=1,soundProfiles={};
 var storage=new Map([['solo','unchanged-single-save-bytes']]);var localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 function normalSaveKeyR73(){return 'solo'}
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
 function blocked(x,y){return Math.abs(x)>30||Math.abs(y)>30}
 function clearPath3(){return true}function clearLine(){return true}function safeRegion(){return false}
 function liveEnemies(){return room.enemies.filter(e=>e.hp>0)}function attackPower(){return 100}function facing(){return 'front'}
 function hitEnemy(e,amount,source){e.hp-=amount;damage.push({amount,source});return true}
 function fx(type,x,y,opt){effects.push({type,x,y,...opt})}
 function tick(dt){time+=dt;positions.push({x:player.x,y:player.y})}
 function serializeSave(){return JSON.parse(JSON.stringify({player,time,zone,layer}))}
 function validateSave(raw){return{player:JSON.parse(JSON.stringify(raw.player))}}
 function normalizeSave3(raw){return{valid:validateSave(raw)}}
 var restoreGate=null,releaseRestore=null;
 async function restoreSave(raw){restoreCalls++;if(restoreGate)await restoreGate;player=validateSave(raw).player;time=raw.time;zone=raw.zone;layer=raw.layer;world={};await enterRegion(zone,null,{restore:true,position:{x:player.x,y:player.y}});return true}
 async function enterRegion(id){room={id,layer,enemies:[{id:'enemy',x:2,y:2,hp:10000,spawnState:'active'}]};world[layerKey()]=room;return true}
 function layerKey(id=zone,l=layer){return l+':'+id}
 function freshPlayer(){return{x:0,y:0,hp:777,hero:'hwando',points:100,upgrades:{},resonance:0}}
 async function newGame(){player=freshPlayer();await enterRegion('arena');return true}
 function ensureImages(){return Promise.resolve([])}function heroPaths(){return[]}function clearControls(){}function maxHP(){return 777}function warn(){}function showTitle(){}function project(x,y){return{x,y}}function unproject(x,y){return{x,y}}
 function closePanel(){}function openPanel(){}function showMenu(){}function showUpgrades(){}
 window.__STORYWORLD_PROGRESSION_R62__={ranks:()=>1,factors:()=>({cooldown:1}),onClear(){}};
 `,x);
 vm.runInContext(core,x);vm.runInContext(save,x);vm.runInContext(coop,x);vm.runInContext(gold,x);
 if(deferred)vm.runInContext('restoreGate=new Promise(r=>releaseRestore=()=>{restoreGate=null;r()})',x);
 x.input=shape==='long'?[Array.from({length:10},(_,i)=>({x:i%2?1:-1,y:i%2?1:-1}))]:[[{x:-1,y:0},{x:1,y:0}]];
 vm.runInContext(`var api=window.__STORYWORLD_GOLDEN_R72__,sim=window.__STORYWORLD_COOP_SIM_R62__;api.applyCommand(player,{op:'save',name:'transition',strokes:input});api.applyCommand(player,{op:'learn'});api.applyCommand(player,{op:'equip',id:api.state().designs[0].id});var soloActor=player;var designBefore=JSON.stringify(api.state());var castStarted=api.cast();tick(.25);var activeBefore=api.inspect().active;var damageBefore=damage.length;var actorBefore={x:soloActor.x,y:soloActor.y};`,x);
 assert.equal(x.castStarted,true);assert.equal(x.activeBefore,1);
 return x;
}
async function check(role,deferred,shape){
 const x=fixture(deferred,shape),beforeBytes=x.storage.get('solo');
 const start=vm.runInContext(`sim.start({role:'${role}',selfId:'host',hostId:'host',hero:'hwando',members:[{id:'host',character:'hwando',nick:'host'}]})`,x);
 if(deferred&&role==='host'){
  assert.equal(x.window.__STORYWORLD_COOP_SIM_R62__.inspect().paused,true);
  const t=x.time,hits=x.damage.length,p={x:x.soloActor.x,y:x.soloActor.y};
  for(let i=0;i<250;i++)vm.runInContext('tick(.01)',x);
  assert.equal(x.time,t);assert.equal(x.damage.length,hits);assert.deepEqual({x:x.soloActor.x,y:x.soloActor.y},p);
  vm.runInContext('releaseRestore()',x);
 }
 await start;
 assert.equal(x.window.__STORYWORLD_GOLDEN_R72__.inspect().active,0,'captured native restore must call the current golden enterRegion cancellation wrapper');
 const hits=x.damage.length,old={x:x.soloActor.x,y:x.soloActor.y};
 vm.runInContext("sim.receive({type:'all_loaded',epoch:sim.inspect().epoch,phase:'running'})",x);
 for(let i=0;i<250;i++)vm.runInContext('tick(.01)',x);
 assert.equal(x.damage.length,hits);assert.deepEqual({x:x.soloActor.x,y:x.soloActor.y},old);
 assert.equal(vm.runInContext('api.cast()',x),false);
 await vm.runInContext('sim.stop()',x);
 assert.equal(x.storage.get('solo'),beforeBytes);
 assert.equal(x.player.x,0,'co-op return must restore the original safe cast origin');assert.equal(x.player.y,0);
 assert.equal(vm.runInContext('JSON.stringify({...api.state(),readyIn:0})',x),x.designBefore);
 assert.equal(x.window.__STORYWORLD_GOLDEN_R72__.inspect().cooldown,23.75,'the spent solo cooldown is restored rather than reset');
 assert.equal(x.window.__STORYWORLD_GOLDEN_R72__.inspect().active,0);
 return{role,shape,duration:x.window.__STORYWORLD_GOLDEN_R72__.inspect().events.find(e=>e.kind==='cast').duration,deferredRestore:deferred,activeBefore:x.activeBefore,activeAfterStart:0,pausedFrames:deferred?250:0,postStartFrames:250,newCoopHits:x.damage.length-hits,soloSaveBytesPreserved:true,goldenDesignsAndEquipmentPreserved:true,cooldownAfterStop:x.window.__STORYWORLD_GOLDEN_R72__.inspect().cooldown,castPoint:x.actorBefore,oldActorAfterStart:old,liveSoloAfterStop:{x:x.player.x,y:x.player.y},restoreCalls:x.restoreCalls,events:x.window.__STORYWORLD_GOLDEN_R72__.inspect().events.slice(-5)};
}
(async()=>{const results=[];for(const shape of ['line','long'])for(const args of [['host',false],['host',true],['guest',false]])results.push(await check(...args,shape));const out={scope:'CPU VM: exact compiled R74 core/save/co-op adapter/golden scripts; labelled native world/save/DOM fixture, not browser/network/physical-device reproduction',runtimeHTMLSHA256:sha,results};fs.writeFileSync('out/r74/coop-transition-cpu.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({scope:out.scope,runtimeHTMLSHA256:sha,results:results.map(({events,...v})=>v)}));})().catch(e=>{console.error(e);process.exitCode=1});
