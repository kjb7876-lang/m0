// Native basicAttack is taken from the game, not a second combat implementation.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(R,'client-source/slayer-r351.js'),'utf8');
const w=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r351/slayer/index.json'))),dir=path.join(R,'runtime-text/assets/r389/slayer'),s=JSON.parse(fs.readFileSync(path.join(dir,'index.json')));
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),at=html.indexOf('function basicAttack('),native=html.slice(at,html.indexOf('\nfunction ',at+1));
let count=0;function check(value,message){assert.ok(value,message);count++;console.log('ok  ',message);}
async function setup({south=true,loaded=true,hero='slayer'}={}){
 const images=new Set(),c={console,Date,Math,JSON,Promise,window:{},localStorage:{getItem:()=>null,setItem(){}},time:0,started:true,modal:false,loading:false,zone:'test',layer:'STORY',target:null,held:false,clear:true,fxs:[],hits:[],blasts:[],nativeAccepted:0,outerAccepted:0,
  HEROES:{slayer:{type:'heavy',range:2,interval:.69},hwando:{type:'blade',range:2,interval:.69}},VFX:{slash:'native-slash',flare:'flare',burst:'burst'},room:{engaged:true,enemies:[]},
  player:{hero,hp:100,x:5,y:5,combo:0,attackCD:0,attackAnim:0,hurtAnim:0,skillAnim:0,dashAnim:0,ultimateAnim:0,direction:'front',counter:0},
  project:(x,y)=>({x:(x-y)*40,y:(x+y)*20}),actorHeight:()=>66,
  distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),facing:(x,y)=>x-y>1e-6?'right':x-y< -1e-6?'left':x+y>0?'front':'back',rank:()=>0,attackPower:()=>10,sound(){},storyAim22:()=>Math.PI/4,
  fetch:p=>Promise.resolve({ok:!p.includes('r389')||south,json:()=>Promise.resolve(p.includes('r389')?s:w)}),
  readyImage:p=>images.has(p)?{image:{src:p,naturalWidth:1152,naturalHeight:256}}:null,
  ensureImages:ps=>{if(loaded)for(const p of ps)images.add(p);return Promise.resolve();}
 };
 c.liveEnemies=()=>c.room.enemies.filter(e=>e.hp>0);c.clearLine=()=>c.clear;
 c.nearestEnemy=range=>c.liveEnemies().find(e=>c.distance(e,c.player)<=range);
 c.hitEnemy=(e,n)=>{c.hits.push({e,n,time:c.time});e.hp-=n;return true;};c.blast=(...a)=>c.blasts.push(a);c.fx=(type,x,y,opt)=>c.fxs.push({type,x,y,opt,time:c.time});
 c.drawHero=()=>c.ctx.commands.push({kind:'image',owner:{kind:'hero'},sourcePath:'assets/hero-authored/slayer.webp',image:{src:'old'},points:[[0,0],[10,0],[10,40],[0,40]]});
 vm.createContext(c);vm.runInContext(native+`;const nativeBasicR377=basicAttack;basicAttack=function(...a){const before=player.attackCD;const r=nativeBasicR377.apply(this,a);if(before<=0&&player.attackCD>0)nativeAccepted++;return r;};function tick(dt){time+=dt;for(const k of ['attackCD','attackAnim','hurtAnim'])player[k]=Math.max(0,player[k]-dt);if(held)basicAttack();}`,c);
 vm.runInContext(src,c);vm.runInContext(`const outerBasicR377=basicAttack;basicAttack=function(...a){const before=player.attackCD;const r=outerBasicR377.apply(this,a);if(before<=0&&player.attackCD>0)outerAccepted++;return r;};`,c);
 await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
 c.api=c.window.__STORYWORLD_SLAYER_R351__;c.frame=()=>{c.ctx={commands:[]};c.drawHero();return c.ctx.commands[0];};
 c.enemy=(dx=.65,dy=.65,id='one')=>{const e={id,x:c.player.x+dx,y:c.player.y+dy,hp:1000,maxHp:1000,radius:.2};c.room.enemies.push(e);return e;};
 c.step=dt=>{c.tick(dt);return c.frame();};c.frame();return c;
}
(async()=>{
 check(fs.readFileSync(path.join(R,'runtime-text/slayer-r351.js'),'utf8')===src,'source/runtime identical');
 check(!/drive\.google|docs\.google/.test(src+JSON.stringify(s)),'no private Drive URL in code/index');
 for(const a of ['walk','attack']){const A=s.anims[a].s,b=fs.readFileSync(path.join(dir,A.file));check(b.length===A.bytes&&crypto.createHash('sha256').update(b).digest('hex')===A.sha256,a+' approved bytes/hash');check(A.anchor.join()==='96,226'&&A.body===158,a+' stable foot anchor/common body');}
 const W=w.anims.walk.w,S=s.anims.walk.s;check(Math.abs(W.n*W.stride.px_per_frame/W.body-S.n*S.stride.px_per_frame/S.body)<1e-9,'four-frame cycle preserves W screen cycle distance');
 for(const [dx,dy,label,expected,mirror] of [[.1,.1,'south','r389',false],[-.1,-.1,'north','r351',false],[-.1,.1,'west','r351',false],[.1,-.1,'east','r389',false]]){
  const c=await setup();c.player.moveVX150=dx;c.player.moveVY150=dy;c.player.x+=dx;c.player.y+=dy;const f=c.step(.05);check(f.sourcePath.includes(expected)&&((f.points[1][0]<f.points[0][0])===mirror),label+' movement sheet and mirror');
  if(label==='south'){const k=66*.98/158,q=c.project(c.player.x,c.player.y);check(Math.abs(f.points[0][1]+226*k-q.y)<1e-8,'S foot anchored at projected player');const seen=new Set();for(let i=0;i<50;i++){c.player.x+=dx;c.player.y+=dy;const f=c.step(.05);seen.add(f.sourceRect[0]/192);}check(seen.size===4,'south walk uses all four poses');check(c.api.state().h!=='s','south does not overwrite W/E memory');{/* R425(사용자 2026-11-08 "슬레이어 내려가는 대기자세도 내려가는 거 모션 중 자연스러운 걸로"): 아래로 걷다 멈추면 아래 걷기의 선 자세 칸(3번째)으로 선다 */const g=c.step(.2);check(/walk-s\.webp$/.test(g.sourcePath)&&g.sourceRect[0]/192===2,'idle after walking down = natural walk-S stance frame (R425)');}}
 }
 {
  const c=await setup(),e=c.enemy();c.player.counter=1;const saved=JSON.stringify(c.player);c.basicAttack();check(e.hp===1000&&c.player.attackCD===0&&c.player.combo===0,'preparation changes no HP/CD/combo');check(c.nativeAccepted===0&&c.outerAccepted===0&&c.fxs.length===0,'no early native/outer proc or FX');check(JSON.stringify(c.player)===saved,'preparation adds no player/save field');
  check(c.frame().sourceRect[0]===0,'first preparation pose starts at zero');check(c.step(.15).sourceRect[0]===192,'second preparation pose shown');c.step(.169);check(c.hits.length===0,'no hit before 320ms');const f=c.step(.001);
  check(c.hits.length===1&&Math.abs(c.hits[0].time-.32)<1e-9,'native hit exactly at 320ms simulation tick');check(e.hp===987&&c.player.counter===0,'counter consumed once by native at contact');check(c.nativeAccepted===1&&c.outerAccepted===1,'wrappers before/after overlay approve exactly once');check(c.fxs.find(x=>x.type==='slash').time===c.hits[0].time,'native slash and damage same tick');check(f.sourcePath.includes('r389')&&f.sourceRect[0]===384,'damage coincides with visible slash pose 2');check(c.player.attackCD===.69&&c.player.combo===1,'native CD and combo retained, start at contact');
  const seen=new Set([0,1,2]);for(const dt of [.081,.111,.131])seen.add(c.step(dt).sourceRect[0]/192);check(seen.size===6,'all six attack poses incl recovery');check(c.api.inspect().south.stats.released===1,'one release recorded');check(c.api.inspect().stats.errors===0,'no release error');
 }
 for(const [dx,dy,name] of [[-.65,.65,'west'],[.65,-.65,'east'],[-.65,-.65,'north']]){const c=await setup(),e=c.enemy(dx,dy);c.basicAttack();check(e.hp<1000&&c.nativeAccepted===1&&c.outerAccepted===1,name+' remains immediate native attack');}
 for(const [name,change] of [
  ['target dies',c=>{c.room.enemies[0].hp=0;}],['target moves north',c=>{c.room.enemies[0].x=4.35;c.room.enemies[0].y=4.35;}],['target out of range',c=>{c.room.enemies[0].x=10;}],['wall blocks',c=>{c.clear=false;}],['selection changes',c=>{c.target='elsewhere';}],['new nearer candidate',c=>c.enemy(.1,-.1,'two')],['player moves',c=>{c.player.x+=.3;}],['hurt',c=>{c.player.hurtAnim=.2;}],['HP loss',c=>{c.player.hp--;}],['skill',c=>{c.player.skillAnim=.3;}],['dash',c=>{c.player.dashAnim=.3;}],['guard',c=>{c.player.guard=true;}],['EGO',c=>{c.player.ego=3;}],['tornado at age zero',c=>{c.window.__STORYWORLD_SLAYER_R_TORNADO_R366__={active:()=>0};}],['room switch',c=>{c.room={...c.room};}],['zone switch',c=>{c.zone='next';}],['layer switch',c=>{c.layer='DREAM';}],['save reload/player replacement',c=>{c.player={...c.player};}],['hero switch',c=>{c.player.hero='hwando';}],['disabled',c=>c.api.set(false)],['coop',c=>{c.window.__STORYWORLD_COOP_SIM_R62__={mode:()=> 'host'};}],['modal',c=>{c.modal=true;}],['loading',c=>{c.loading=true;}],['death',c=>{c.player.hp=0;}],['time reset',c=>{c.time=-1;}]
 ]){const c=await setup();c.enemy();c.basicAttack();change(c);c.step(.4);check(c.hits.length===0&&c.api.inspect().south.phase===null,name+' cancels without delayed hit');}
 for(const [name,change] of [['instant accepted skill pose',c=>{c.player.poseStarted5={skill:.01};}],['instant accepted blink',c=>{c.player.blinkCD=1;}],['instant guard press/release',c=>{c.player.guard=false;c.player.poseStarted5={guard:.01};}] ]){const c=await setup();c.enemy();c.basicAttack();change(c);c.step(.4);check(c.hits.length===0&&c.api.inspect().south.phase===null,name+' cancels even after active animation ends');}
 {
  const c=await setup();c.enemy();c.basicAttack();const side=c.enemy(.65,-.65,'side');c.target=side.id;c.basicAttack();check(c.hits.length===0&&c.api.inspect().south.phase===null,'invalidated request cancels without same-call retarget');c.basicAttack();check(c.hits.some(h=>h.e===side),'next independent side request retains native immediate attack');
 }
 {
  const c=await setup();c.enemy();c.basicAttack();c.step(.5);check(c.hits.length===1&&c.hits[0].time===.5&&c.frame().sourceRect[0]===384,'late simulation tick releases once at actual contact pose');
 }
 {
  const c=await setup();c.enemy();c.player.combo=3;c.basicAttack();check(c.blasts.length===0&&c.player.combo===3,'heavy fourth-hit proc waits during preparation');c.step(.32);check(c.blasts.length===1&&c.player.combo===4,'native heavy fourth-hit proc fires once at contact');
 }
 {
  const c=await setup();c.enemy();c.basicAttack();c.fx=()=>{throw new Error('test native failure');};c.step(.32);check(c.api.inspect().south.phase===null&&c.api.inspect().lastError==='test native failure','release exception cancels and exposes error');c.step(1);check(c.hits.length===0&&c.player.combo===1,'failed native release is never retried');
 }
 {
  const c=await setup();c.enemy();c.basicAttack();c.basicAttack();c.held=true;c.step(.1);c.step(.1);c.step(.12);check(c.nativeAccepted===1&&c.hits.length===1,'held/repeated input does not duplicate pending hit');
 }
 {
  const c=await setup();c.target='one';const e=c.enemy(),near=c.enemy(.1,-.1,'two');c.basicAttack();c.step(.32);check(c.hits.some(h=>h.e===e)&&!c.hits.some(h=>h.e===near),'selected south target beats nearer side target');
 }
 {
  const c=await setup();const e=c.enemy();c.basicAttack();e.x+=.03;c.step(.32);check(c.hits.length===1&&c.hits[0].e===e,'same target may move within south sector before native aim');
 }
 {
  const c=await setup();c.basicAttack(true);check(c.api.inspect().south.phase==='prepare','forced empty south swing prepares');c.step(.32);check(c.nativeAccepted===1&&c.fxs.some(f=>f.type==='slash')&&c.hits.length===0,'forced empty swing releases once without invented target');
 }
 for(const opts of [{south:false},{loaded:false},{hero:'hwando'}]){const c=await setup(opts),e=c.enemy();c.basicAttack();check(e.hp<1000&&c.api.inspect().south.phase===null,'missing asset/other hero falls back to immediate native path '+JSON.stringify(opts));}
 {
  const c=await setup();c.enemy();c.basicAttack();c.tick=()=>{};c.time=1;c.frame();check(c.hits.length===0,'draw does not apply deferred damage');
 }
 console.log('R377 '+count+'/'+count);
})().catch(e=>{console.error(e);process.exitCode=1;});
