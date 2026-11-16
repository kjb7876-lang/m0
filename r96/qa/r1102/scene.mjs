// R1102 전후 장면(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 헌터가 기본 화살을 쏜 직후(화살 나이 0.03~0.10초)를 영웅 둘레로 잘라 찍는다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL,OUT=process.env.OUT,N=+process.env.N||4;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hunter"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{const mk=makeShot;makeShot=function(...a){const s=mk.apply(this,a);try{if(s&&s.r160Basic&&!player.r720Ally)window.__shot={t:time,s};}catch(_){}return s;};
 const tk=tick;window.__freeze=false;tick=function(dt,...a){return tk.call(this,window.__freeze?dt*1e-4:dt,...a);};});
const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+4,{timeout:900000});
const DIRS=[[3.2,-3.2],[-3.2,3.2],[3,1.2],[-1.2,-3]];
for(let i=0;i<N;i++){await A(d=>{window.__shot=null;window.__freeze=false;player.hp=player.maxHp||player.hp;const L=room.enemies.filter(e=>e.hp>0);const keep=L[0];for(const e of L)if(e!==keep){e.x=player.x+40;e.y=player.y+40;e.speed=0;}if(keep){keep.x=player.x+d[0];keep.y=player.y+d[1];keep.speed=0;keep.hp=keep.maxHp||9999;}},DIRS[i%4]);
 await p.waitForFunction(()=>{const s=window.__shot;if(s&&time-s.t>=.03){window.__freeze=true;return true;}return false;},null,{timeout:900000,polling:5});
 await p.waitForTimeout(400);const q=await A(()=>{const c=project(player.x,player.y),r=document.querySelector('canvas').getBoundingClientRect();return{x:c.x+r.left,y:c.y+r.top,h:actorHeight()};});
 await p.screenshot({path:`${OUT}-${i}.png`,clip:{x:Math.max(0,q.x-150),y:Math.max(0,q.y-130),width:300,height:180}});
 const t1=await A(()=>{window.__freeze=false;return time;});await p.waitForFunction(a=>time>=a,t1+1.2,{timeout:900000});}
await b.close();
