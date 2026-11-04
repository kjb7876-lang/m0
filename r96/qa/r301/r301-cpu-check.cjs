// CX-0001 / R301: real native enemy painter + R90 HUD in a CPU VM.
// Canvas and unrelated sprite dependencies are fixtures; no GPU acceptance.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(R,f),'utf8');
const index=read('runtime-text/index.html'),source=read('client-source/visual-r90.js');
const start=index.indexOf('drawEnemy=function(e){if(!renderable3(e))return;');
const end=index.indexOf('\n};',start);
assert.ok(start>=0&&end>start,'native enemy painter extraction');
const native=index.slice(start,end+3);
let checks=0,failures=0;
function check(name,fn){checks++;try{fn();console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+' '+e.message);}}
function world(zone,{boss=true,midboss=false,coop=false,target=true,health=true}={}){
 const calls=[];
 function context(surface){
  const stack=[],c={globalAlpha:1};
  for(const method of ['fillText','fillRect','ellipse','clearRect','setTransform','beginPath','stroke'])c[method]=function(...args){calls.push({surface,method,args});};
  c.save=()=>stack.push({fillStyle:c.fillStyle,font:c.font,textAlign:c.textAlign,shadowBlur:c.shadowBlur,shadowColor:c.shadowColor,globalAlpha:c.globalAlpha});
  c.restore=()=>Object.assign(c,stack.pop());
  return c;
 }
 const ctx=context('world'),hud=context('hud'),e={id:zone+':boss',name:zone+' boss fixture',boss,midboss,hp:80,maxHp:100,x:5,y:5,defScale:1,
  spawnState:'alive',path:'fixture.png',profile:{frames:{}},combatProfile:{spriteRect:{width:1,height:1}},visualLiftPx:12};
 const c={console,ctx,zone,layer:'STORY',room:{enemies:[e]},player:{x:4,y:5,hp:100,hero:'gunner'},settings:{hitboxes:false},
  time:10,zoom:1,W:800,H:600,dpr:1,auto:true,target:e.id,selected:e,coop,
  project:()=>({x:400,y:300}),actorHeight:()=>60,maxHP:()=>100,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),finite:(v,f=0)=>Number.isFinite(v)?v:f,
  renderable3:a=>a.visible!==false,readyImage:()=>null,shadow(){},sprite(){},drawLivingBurn3(){},drawAssetFrame3:()=>false,texture(){},VFX:{mark:'mark'},
  document:{documentElement:{classList:{toggle(){}}},createElement:()=>({}),head:{appendChild(){}},
   querySelector:()=>({getContext:()=>hud}),getElementById:()=>null},
  localStorage:{getItem:()=>null,setItem(){}},
 };
 c.window=c;c.__STORYWORLD_COOP_SIM_R62__={mode:()=>c.coop?'host':'off'};
 c.__STORYWORLD_HANDO_FINAL_R49__={autoTarget:()=>c.selected};
 c.__STORYWORLD_COMBAT_HUD_R51__={model:()=>({visible:true,health:{hp:100,max:100,ratio:1,shieldRatio:0,width:80,x:100,y:500}}),paint(){}};
 vm.createContext(c);vm.runInContext(native,c,{filename:'index.html:native-drawEnemy'});
 vm.runInContext('draw=function(){for(const actor of room.enemies)drawEnemy(actor);return 42;};',c);
 vm.runInContext(source,c,{filename:'visual-r90.js'});
 c.__STORYWORLD_VISUAL_R90__.set({target,health});
 function frame(){calls.length=0;const before=JSON.stringify(c.room);assert.equal(c.draw(),42);assert.equal(JSON.stringify(c.room),before,'render must not mutate enemies');assert.equal(c.__STORYWORLD_VISUAL_R90__.inspect().stats.errors,0);return calls;}
 const labels=()=>calls.filter(v=>v.method==='fillText'&&v.args[0]===e.name);
 return{c,e,calls,frame,labels};
}
for(const zone of ['kair02','last301']){
 check(zone+': selected boss name is drawn exactly once per frame',()=>{
  const w=world(zone);for(let frame=0;frame<3;frame++){
   w.frame();const labels=w.labels();assert.equal(labels.length,1,JSON.stringify(labels));
   assert.equal(labels[0].surface,'world');assert.equal(labels[0].args[2],222,'native lifted name position retained');
   assert.equal(w.calls.filter(c=>c.surface==='hud'&&c.method==='ellipse').length,1,'target ring retained');
   assert.equal(w.calls.filter(c=>c.surface==='hud'&&c.method==='fillRect').length,6,'player and target HP retained');
  }
 });
 for(const options of [{target:false},{health:false},{coop:true}])check(zone+': native boss label retained '+JSON.stringify(options),()=>{
  const w=world(zone,options);w.frame();assert.equal(w.labels().length,1);
 });
 check(zone+': untargeted boss retains native label',()=>{const w=world(zone);w.c.selected=null;w.frame();assert.equal(w.labels().length,1);});
 check(zone+': dead/hidden boss has no name',()=>{
  const w=world(zone);w.e.hp=0;w.e.spawnState='dead';w.frame();assert.equal(w.labels().length,0);
  w.e.hp=80;w.e.spawnState='alive';w.e.visible=false;w.frame();assert.equal(w.labels().length,0);
 });
 check(zone+': distinct bosses with identical names each keep one label',()=>{
  const w=world(zone);w.c.room.enemies.push({...w.e,id:zone+':second'});w.frame();assert.equal(w.labels().length,2);
 });
}
for(const midboss of [false,true])check('non-boss target label retained (midboss='+midboss+')',()=>{
 const w=world('ordinary',{boss:false,midboss});w.frame();assert.equal(w.labels().length,1);assert.equal(w.labels()[0].surface,'hud');
});
check('runtime copy and manifest match the canonical overlay',()=>{
 assert.equal(read('runtime-text/visual-r90.js'),source);
 const row=JSON.parse(read('runtime-manifest.json')).files.find(r=>r.path==='visual-r90.js');
 assert.equal(row.sha256,crypto.createHash('sha256').update(source).digest('hex'));assert.equal(row.bytes,Buffer.byteLength(source));
 assert.ok(JSON.parse(read('runtime-inputs.json')).textPaths.includes('visual-r90.js'));
});
console.log(`R301 ${checks-failures}/${checks}; CPU only, full game/GPU/mobile unverified`);
if(failures)process.exitCode=1;
