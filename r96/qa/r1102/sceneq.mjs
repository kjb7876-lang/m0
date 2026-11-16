// R1102 전후 장면(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 헌터가 기본 화살을 쏜 직후(화살 나이 0.03~0.10초)를 영웅 둘레로 잘라 찍는다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL,OUT=process.env.OUT,N=+process.env.N||4;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:3});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hunter"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{const mk=makeShot;makeShot=function(...a){const s=mk.apply(this,a);try{if(s&&s.r160Basic&&!player.r720Ally)window.__shot={t:time,s};}catch(_){}return s;};
 const tk=tick;window.__freeze=false;tick=function(dt,...a){return tk.call(this,window.__freeze?dt*1e-4:dt,...a);};});
const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+4,{timeout:900000});

const OUT2=process.env.OUT;
await A(()=>{player.hp=player.maxHp||player.hp;const L=room.enemies.filter(e=>e.hp>0);const keep=L[0];for(const e of L)if(e!==keep){e.x=player.x+40;e.y=player.y+40;e.speed=0;}keep.x=player.x+4;keep.y=player.y-4;keep.speed=0;keep.hp=keep.maxHp||9999;window.__t=time;});
for(const [i,w] of [[0,.15],[1,.3],[2,.5]]){await A(()=>{window.__freeze=false;try{special();}catch(e){}window.__t=time;});
 await p.waitForFunction(a=>time>=window.__t+a,w,{timeout:900000,polling:5});await A(()=>{window.__freeze=true;});await p.waitForTimeout(400);
 const q=await A(()=>{const c=project(player.x,player.y),r=document.querySelector('#game, canvas').getBoundingClientRect();return{x:c.x+r.left,y:c.y+r.top};});
 await p.screenshot({path:`${OUT2}-${i}.png`,clip:{x:Math.max(0,q.x-90),y:Math.max(0,q.y-100),width:180,height:130}});
 await A(()=>{window.__freeze=false;});await p.waitForFunction(a=>time>=a,(await A(()=>time))+2.5,{timeout:900000});}
await b.close();
