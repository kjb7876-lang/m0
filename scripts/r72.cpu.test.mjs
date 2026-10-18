import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const core=fs.readFileSync('client-source/golden-core-r72.js','utf8'),runtime=fs.readFileSync('client-source/golden-thread-r72.js','utf8');
const v={};vm.createContext(v);vm.runInContext(core,v);const C=v.StoryGoldenCoreR72,plain=x=>JSON.parse(JSON.stringify(x));
const line=[[{x:-1,y:0},{x:1,y:0}]];
test('line density, duplicate samples and aspect-independent uniform normalization',()=>{
 const dense=[Array.from({length:1000},(_,i)=>({x:100+800*i/999,y:200}))];
 assert.deepEqual(plain(C.normalize(dense)),plain(C.normalize(line)));
 assert.deepEqual(plain(C.normalize([[{x:2,y:0},{x:2,y:0},{x:6,y:0}]])),plain(C.normalize(line)));
});
test('curves, cross, multi-stroke, repeated scribble stay bounded and preserve pen-up boundaries',()=>{
 for(const raw of [[Array.from({length:200},(_,i)=>({x:Math.cos(i/20),y:Math.sin(i/20)}))],[[{x:-1,y:-1},{x:1,y:1}],[{x:1,y:-1},{x:-1,y:1}]],[Array.from({length:2048},(_,i)=>({x:i%2?1:-1,y:i%3?1:-1}))]]){
  const n=C.normalize(raw),segments=C.segments(n);assert.ok(n.flat().length<=96);assert.ok(segments.length<=64);assert.ok(C.validStrokes(n));assert.equal(segments.filter(v=>v.gap).length,n.length);assert.ok(n.flat().every(p=>Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001));
 }
 for(const raw of [[],[[{x:0,y:0}]],[[{x:NaN,y:1},{x:1,y:1}]],Array(13).fill(line[0]),[Array(2049).fill({x:0,y:0})]])assert.throws(()=>C.normalize(raw));
});
test('save migration rejects malformed extension, limits paid capacity, equipped references and cooldown',()=>{
 assert.deepEqual(plain(C.sanitize({version:99})),plain(C.fresh()));const strokes=C.normalize(line),designs=Array.from({length:14},(_,i)=>({id:'d'+i,name:'<name>',strokes}));
 const s=C.sanitize({version:1,designs,equipped:['d0','missing','d0','d1'],ranks:{slots:999,equip:99,damage:Infinity},readyIn:1e9});assert.equal(s.designs.length,12);assert.deepEqual(plain(s.equipped),['d0','d1']);assert.equal(s.ranks.damage,0);assert.equal(s.readyIn,24);assert.ok(s.designs.every(d=>!d.name.includes('<')));
 assert.equal(C.sanitize({version:1,designs}).designs.length,3);
});
test('safety planner rejects void, blocked stroke and pen-up jump; bounded shrink preserves shape',()=>{
 const n=C.normalize(line),origin={x:0,y:0};assert.equal(C.plan(n,origin,3,()=>false,()=>true,origin),null);
 assert.equal(C.plan(n,origin,3,()=>true,()=>false,origin),null);
 const plan=C.plan(n,origin,3,p=>Math.abs(p.x)<=1.9&&Math.abs(p.y)<=1.9,()=>true,origin);assert.ok(plan.scale<1);assert.ok(plan.path.every(v=>Math.abs(v.a.x)<=1.9&&Math.abs(v.b.x)<=1.9));
});
function fixture(){
 const nodes=new Map(),element=()=>({style:{},innerHTML:'',appendChild(){},addEventListener(){},getContext(){return{};}}),doc={createElement:element,addEventListener(){},querySelectorAll(){return[];}};
 const x={window:{},document:doc,console,performance:{now:()=>0},requestAnimationFrame:()=>0,cancelAnimationFrame(){},canvas:element(),$:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},button(){},toast(){},sound(){},saveGame(){return true;},escapeHTML:x=>x};vm.createContext(x);vm.runInContext(core,x);
 vm.runInContext(`var player={x:0,y:0,hp:777,hero:'hwando',points:100},time=0,started=true,modal=false,loading=false,auto=false,settings={autoSkill:false},target=null,route=[],command=null,layer='STORY',effects=[],damage=[],positions=[],wall=false,room={id:'arena',enemies:[{id:'enemy',x:2,y:2,hp:10000,spawnState:'active'}]};
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function blocked(x,y){return wall||Math.abs(x)>30||Math.abs(y)>30}function clearPath3(a,b){for(let i=0;i<=20;i++)if(blocked(a.x+(b.x-a.x)*i/20,a.y+(b.y-a.y)*i/20))return false;return true}function clearLine(a,b){return clearPath3(a,b)}function safeRegion(){return false}function liveEnemies(){return room.enemies.filter(e=>e.hp>0)}function attackPower(){return 100}function facing(){return 'front'}function hitEnemy(e,amount,source){e.hp-=amount;damage.push({amount,source,x:player.x,y:player.y});return true}function fx(type,x,y,opt){effects.push({type,x,y,...opt})}function tick(dt){time+=dt;positions.push({x:player.x,y:player.y})}function drawEffect(){}function enterRegion(){return Promise.resolve(true)}function restoreSave(){return Promise.resolve(true)}function newGame(){return Promise.resolve(true)}function showDeath(){}function closePanel(){}function openPanel(){}function showMenu(){}function showUpgrades(){}function updateHUD(){}function project(x,y){return{x,y}}function unproject(x,y){return{x,y}}var zoom=1,ctx={};
 window.__STORYWORLD_PROGRESSION_R62__={ranks:()=>1,factors:()=>({cooldown:1})};
 window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'off',currentPlayer:()=>player,localPlayer:()=>player};`,x);vm.runInContext(runtime,x);return x;
}
function run(fps,speed=0,strokes=line){const x=fixture();x.strokes=plain(C.normalize(strokes));x.speed=speed;vm.runInContext(`var api=window.__STORYWORLD_GOLDEN_R72__;api.applyCommand(player,{op:'save',name:'test',strokes});api.applyCommand(player,{op:'learn'});api.applyCommand(player,{op:'equip',id:api.state().designs[0].id});api.state().ranks.speed=speed;var before={x:player.x,y:player.y};var cast=api.cast();`,x);for(let i=0;i<fps*3;i++)vm.runInContext(`tick(${1/fps})`,x);return x;}
test('actual scheduler teleports/poses and conserves damage and event ids at 15/30/60/144fps and speed ranks',()=>{
 const rows=[];for(const fps of [15,30,60,144])for(const speed of [0,10]){const x=run(fps,speed);assert.equal(x.cast,true);assert.equal(x.damage.length,8);assert.equal(new Set(x.damage.map(v=>v.source.eventId)).size,8);assert.ok(x.damage.every(v=>v.source.ability==='goldenThreadR72'));assert.ok(x.positions.some(p=>p.x!==0||p.y!==0));assert.deepEqual({x:x.player.x,y:x.player.y},{x:0,y:0});assert.equal(x.window.__STORYWORLD_GOLDEN_R72__.inspect().active,0);rows.push(x.damage.reduce((n,v)=>n+v.amount,0));}assert.ok(rows.every(n=>Math.abs(n-rows[0])<1e-8));
});
test('pen-up crossing never hits, impossible cast spends nothing, stun/death/region cancel leaves no reservations',async()=>{
 const x=fixture();vm.runInContext(`room.enemies[0].x=0;room.enemies[0].y=0`,x);x.input=plain(C.normalize([[{x:-1,y:-1},{x:1,y:-1}],[{x:-1,y:1},{x:1,y:1}]]));vm.runInContext(`var api=window.__STORYWORLD_GOLDEN_R72__;api.applyCommand(player,{op:'save',name:'gap',strokes:input});api.applyCommand(player,{op:'learn'});api.applyCommand(player,{op:'equip',id:api.state().designs[0].id});api.cast();`,x);for(let i=0;i<180;i++)vm.runInContext('tick(1/60)',x);assert.equal(x.damage.length,0);
 vm.runInContext('time=100;wall=true;var cd=player.goldenReadyAtR72;var points=player.points;var denied=api.cast()',x);assert.equal(x.denied,false);assert.equal(x.cd,x.player.goldenReadyAtR72);assert.equal(x.points,x.player.points);
 for(const reason of ['stun','death','region']){const f=run(1);vm.runInContext(`time=100;api.cast();`,f);if(reason==='stun')vm.runInContext('player.stun=1;tick(.01)',f);else if(reason==='death')vm.runInContext('player.hp=0;showDeath()',f);else await vm.runInContext('enterRegion("other")',f);assert.equal(f.window.__STORYWORLD_GOLDEN_R72__.inspect().active,0);const n=f.damage.length;vm.runInContext('tick(100)',f);assert.equal(f.damage.length,n);}
});
test('all generated scripts parse; R71 renderer/media and source docs remain exact',()=>{
 const html=fs.readFileSync('_pages/docs/index.html','utf8');let parsed=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/type=["']application\/json/.test(m[1]))continue;new vm.Script(m[2]);parsed++;}assert.ok(parsed>75);
 assert.deepEqual(fs.readFileSync('_pages/docs/dist/phase1.js'),fs.readFileSync('_r71/docs/dist/phase1.js'));
 const a=JSON.parse(fs.readFileSync('_r71/docs/web-manifest-r62.json')),b=JSON.parse(fs.readFileSync('_pages/docs/web-manifest-r62.json'));assert.equal(a.files.length,b.files.length);assert.deepEqual(b.files.filter((v,i)=>v.sha256!==a.files[i].sha256).map(v=>v.path),['index.html']);
});
