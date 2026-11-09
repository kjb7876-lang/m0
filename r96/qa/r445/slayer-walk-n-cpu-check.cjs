// R445 슬레이어 북향(뒷모습) 걷기 4칸 CPU 검사. 셋업은 R389 검사와 같고 r445 index 를 더 돌려준다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(R,'client-source/slayer-r351.js'),'utf8');
const w=JSON.parse(fs.readFileSync(path.join(R,'runtime-text/assets/r351/slayer/index.json'))),dir=path.join(R,'runtime-text/assets/r389/slayer'),s=JSON.parse(fs.readFileSync(path.join(dir,'index.json')));
const nd=path.join(R,'runtime-text/assets/r445/slayer'),n=JSON.parse(fs.readFileSync(path.join(nd,'index.json')));
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8'),at=html.indexOf('function basicAttack('),native=html.slice(at,html.indexOf('\nfunction ',at+1));
let count=0;function check(value,message){assert.ok(value,message);count++;console.log('ok  ',message);}
async function setup({south=true,north=true,loaded=true,hero='slayer',off=false}={}){
 const images=new Set(),c={console,Date,Math,JSON,Promise,window:{},localStorage:{getItem:k=>off&&k==='storyworld.r445.slayerNorth'?'0':null,setItem(){}},time:0,started:true,modal:false,loading:false,zone:'test',layer:'STORY',target:null,held:false,clear:true,fxs:[],hits:[],blasts:[],nativeAccepted:0,outerAccepted:0,
  HEROES:{slayer:{type:'heavy',range:2,interval:.69},hwando:{type:'blade',range:2,interval:.69}},VFX:{slash:'native-slash',flare:'flare',burst:'burst'},room:{engaged:true,enemies:[]},
  player:{hero,hp:100,x:5,y:5,combo:0,attackCD:0,attackAnim:0,hurtAnim:0,skillAnim:0,dashAnim:0,ultimateAnim:0,direction:'front',counter:0},
  project:(x,y)=>({x:(x-y)*40,y:(x+y)*20}),actorHeight:()=>66,
  distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),facing:(x,y)=>x-y>1e-6?'right':x-y< -1e-6?'left':x+y>0?'front':'back',rank:()=>0,attackPower:()=>10,sound(){},storyAim22:()=>Math.PI/4,
  fetch:p=>Promise.resolve({ok:(!p.includes('r389')||south)&&(!p.includes('r445')||north),json:()=>Promise.resolve(p.includes('r445')?n:p.includes('r389')?s:w)}),
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
 const N=n.anims.walk.n,shaOf=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 check(N&&shaOf(path.join(nd,N.file))===N.sha256&&fs.statSync(path.join(nd,N.file)).size===N.bytes,'walk-n bytes/hash');
 check(N.n===4&&N.cols===4&&N.cell[0]===192&&N.cell[1]===256&&N.body===s.anims.walk.s.body&&N.anchor.join()===s.anims.walk.s.anchor.join(),'N 4 frames, same cell/body/anchor as S');
 for(let i=0;i<4;i++)check(fs.existsSync(path.join(R,'runtime-text/assets/r445/slayer-walk-n-src',`walk-n-0${i}.png`)),'candidate original kept '+i);
 for(const f of ['walk-s.webp','walk-e.webp','attack-s.webp','attack-e.webp','index.json'])check(fs.existsSync(path.join(dir,f)),'R389 kept '+f);
 const mv=(c,dx,dy)=>{c.player.moveVX150=dx;c.player.moveVY150=dy;c.player.x+=dx;c.player.y+=dy;return c.step(.05);};
 {const c=await setup();const f=mv(c,-.1,-.1);check(f.sourcePath.includes('r445/slayer/walk-n')&&f.points[1][0]>f.points[0][0],'straight up uses N walk, not flipped');
  const seen=new Set();for(let i=0;i<40;i++)seen.add(mv(c,-.1,-.1).sourceRect[0]/192);check(seen.size===4,'north walk uses four poses');
  const idle=c.step(.3);check(idle.sourcePath.includes('walk-n')&&idle.sourceRect[0]===0,'stop after north = N idle_frame 0');
  c.player.attackAnim=.3;c.player.attackCD=.69;c.player.direction='back';const a=c.frame();check(!a.sourcePath.includes('r445'),'attack keeps left/right (no N attack)');}
 // 화면 위 ±30도: project (x-y)*40,(x+y)*20 → (dx,dy)=(-.1,-.07) 은 화면 (-1.2,-3.4) 약 19°, (-.1,-.03) 은 (-2.8,-2.6) 약 47°
 {const c=await setup();const f=mv(c,-.1,-.07);check(f.sourcePath.includes('walk-n'),'up 19° off vertical → N');}
 {const c=await setup();const f=mv(c,-.1,-.03);check(!f.sourcePath.includes('walk-n'),'up-diagonal 47° → left/right');}
 {const c=await setup();const f=mv(c,.1,.1);check(f.sourcePath.includes('r389/slayer/walk-s'),'down still S');}
 {const c=await setup();const f=mv(c,.1,-.1);check(f.sourcePath.includes('walk-e'),'right still E');}
 {const c=await setup({north:false});const f=mv(c,-.1,-.1);check(!f.sourcePath.includes('r445')&&f.sourcePath.includes('slayer'),'no N index → old left/right walk');}
 {const c=await setup({loaded:false});const f=mv(c,-.1,-.1);check(!f.sourcePath.includes('r445'),'N not loaded → falls back');}
 {const c=await setup({off:true});const f=mv(c,-.1,-.1);check(!f.sourcePath.includes('r445'),'switch off → left/right');}
 {const c=await setup({hero:'hwando'});c.player.x-=.1;c.player.y-=.1;const f=c.step(.05);check(f.sourcePath==='assets/hero-authored/slayer.webp','other hero untouched');}
 console.log('R445 '+count+'/'+count);
})().catch(e=>{console.error(e);process.exit(1);});
