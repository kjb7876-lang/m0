// R690 무한 생존 스트레스 측정(헤드리스 960×540 SwiftShader — GPU·실기기 아님). SW_URL 기본 http://127.0.0.1:4410/m0/, INIT=localStorage JSON, OUT=스크린샷 접두.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const INIT=process.env.INIT?JSON.parse(process.env.INIT):{};const OUT=process.env.OUT||'s';
const b=await chromium.launch();const c=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await c.addInitScript(i=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));for(const [k,v] of Object.entries(i))localStorage.setItem(k,v);},INIT);
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.start('hwando'));
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
const keep=()=>A(()=>{const b=document.getElementById('r600Pick0');if(b&&modal)b.click();const S=window.__STORYWORLD_SURVIVAL_R600__;try{S.skipNarration();}catch(_){}player.invincible=99999;try{S.qaCoreHp(1e6);}catch(_){}});
// 몹이 모일 때까지
for(let i=0;i<40;i++){await keep();const n=await A(()=>room.enemies.filter(e=>e.hp>0).length);if(n>=40)break;await p.waitForTimeout(1000);}
await A(()=>{window.__m={ft:[],cmd:[],clip:[],r462:[]};let last=performance.now();__m.rt=[];__m.dt=[];const TH=__STORYWORLD_PHASE1__.controller.state.three,rb=TH.render;TH.render=function(frame,...a){const cs=frame?.commands||[];let cl=0,r=0;for(const x of cs){if(x.clips&&x.clips.length)cl++;if(String(x.owner?.id||'').startsWith('r462'))r++;}__m.cmd.push(cs.length);__m.clip.push(cl);__m.r462.push(r);const t=performance.now();try{return rb.call(this,frame,...a);}finally{__m.rt.push(performance.now()-t);}};
const C=__STORYWORLD_PHASE1__.controller,db=C.draw;C.draw=function(...a){const t=performance.now();try{return db.apply(this,a);}finally{__m.dt.push(performance.now()-t);}};
const loop=()=>{const n=performance.now();__m.ft.push(n-last);last=n;requestAnimationFrame(loop)};requestAnimationFrame(loop);});
await keep();
const s0=await A(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three.commands.stats;for(const k of ['ft','cmd','clip','r462','rt','dt'])__m[k].length=0;window.__g0=time;window.__s0={...T};return time;});
let kills=0,shot=0;const until=async t=>{for(let i=0;i<2000;i++){await keep();if(await A(t=>time>=t,t))return;await p.waitForTimeout(150);}};
for(let w=0;w<10;w++){await keep();
 kills+=await A(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.r600Boss);live.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const ks=live.slice(0,8);
  ks.forEach((e,i)=>{e.x=player.x+(1.2+i*.25)*Math.cos(i*2.4);e.y=player.y+(1.2+i*.25)*Math.sin(i*2.4);e.hp=0;killEnemy(e);});return ks.length;});
 const g=await A(()=>time);
 if(w===6){for(let k=0;k<4;k++){await until(g+k*.3);await p.screenshot({path:`${OUT}-w6-${k}.png`});}}
 await until(g+1.5);}
const r=await A(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three.commands.stats,g=time-__g0,q=a=>{const s=[...a].sort((x,y)=>x-y);return{med:+s[s.length>>1].toFixed(1),p90:+s[Math.floor(s.length*.9)].toFixed(1),max:+s.at(-1).toFixed(1),mean:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)}};
 const d=k=>Math.round((T[k]-__s0[k])/g);
 return{game:+g.toFixed(2),frames:__m.ft.length,fps:+(__m.ft.length/(__m.ft.reduce((a,b)=>a+b,0)/1000)).toFixed(2),ft:q(__m.ft),cmd:q(__m.cmd),clip:q(__m.clip),r462cmd:q(__m.r462),renderMs:q(__m.rt),drawMs:q(__m.dt),perGameSec:{geometryUpdates:d('geometryUpdates'),created:d('created'),removed:d('removed'),filterUpdates:d('filterUpdates'),texturesCreated:d('texturesCreated')},r462:window.__STORYWORLD_MOB_DEATH_R462__.inspect()};});
r.kills=kills;r.errs=errs;console.log(JSON.stringify(r));await b.close();
