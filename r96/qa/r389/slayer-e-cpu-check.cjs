// R389 슬레이어 동향(페르소나 W 수평반전본, baked)·남향 밝기 파생본 CPU 검사. 셋업은 R377 검사와 같다.
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
 const E=s.anims,shaOf=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 for(const a of ['walk','attack'])for(const d of ['s','e']){const A=E[a][d];check(A&&shaOf(path.join(dir,A.file))===A.sha256&&fs.statSync(path.join(dir,A.file)).size===A.bytes,`${a}-${d} bytes/hash`);}
 check(E.walk.e.baked===true&&E.attack.e.baked===true&&E.walk.e.n===4&&E.attack.e.n===4&&E.attack.e.contact===2,'E clips baked 4+4, contact 2');
 check(E.attack.e.ms.slice(0,2).reduce((a,b)=>a+b)===420&&E.attack.e.ms.reduce((a,b)=>a+b)===950,'E contact start 420ms and total 950ms keep W timing');
 for(const f of ['walk-w.webp','attack-w.webp','index.json'])check(fs.existsSync(path.join(R,'runtime-text/assets/r351/slayer',f)),'R351 W kept '+f);
 for(const f of ['index.json','slayer-walk-s-persona.webp','slayer-attack-s-persona.webp'])check(fs.existsSync(path.join(R,'runtime-text/assets/r377/slayer-south',f)),'R377 originals kept '+f);
 {const c=await setup();c.player.moveVX150=.1;c.player.moveVY150=-.1;c.player.x+=.1;c.player.y-=.1;const f=c.step(.05);check(f.sourcePath.includes('r389/slayer/walk-e')&&f.points[1][0]>f.points[0][0],'east walk uses baked E, not flipped');
  const seen=new Set();for(let i=0;i<40;i++){c.player.x+=.1;c.player.y-=.1;seen.add(c.step(.05).sourceRect[0]/384);}check(seen.size===4,'east walk uses four poses');
  const idle=c.step(.3);check(idle.sourcePath.includes('walk-e')&&idle.sourceRect[0]===384,'east idle = E walk idle_frame 1');}
 {const c=await setup();c.player.moveVX150=-.1;c.player.moveVY150=.1;c.player.x-=.1;c.player.y+=.1;const f=c.step(.05);check(f.sourcePath.includes('r351/slayer/walk-w')&&f.points[1][0]>f.points[0][0],'west walk still R351 W unflipped');}
 {const c=await setup();c.player.x+=.1;c.player.y-=.1;c.player.moveVX150=.1;c.player.moveVY150=-.1;c.step(.05);c.player.moveVX150=0;c.player.moveVY150=0;c.step(.3);
  c.player.direction='right';c.player.attackAnim=.3;c.player.attackCD=.69;let f=c.frame();check(f.sourcePath.includes('attack-e')&&f.points[1][0]>f.points[0][0],'east attack swing uses baked E attack');
  const xs=new Set([f.sourceRect[0]]);for(let i=0;i<20;i++){c.time+=.05;xs.add(c.frame().sourceRect[0]);}check([...xs].every(x=>x%384===0&&x<1536),'east attack frames stay inside 4-cell E strip');}
 {const c=await setup({loaded:false});c.player.moveVX150=.1;c.player.moveVY150=-.1;c.player.x+=.1;c.player.y-=.1;const f=c.step(.05);check(!f.sourcePath.includes('r389'),'E not loaded → no E sheet (falls back)');}
 console.log('R389 '+count+'/'+count);
})().catch(e=>{console.error(e);process.exit(1);});
