// R1236 재현: 블링크 직후 프레임마다 영웅의 화면 위치(가운데에서 떨어진 정도)를 잰다.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();
const {ctx,p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
const zones=(process.env.ZONES||'murder01').split(',');
for(const z of zones){await go(p,z);
 for(const h of (process.env.HEROES||'michaela,gunner,neon').split(',')){
  const r=await p.evaluate(async h=>{await ensureImages(heroPaths(h));player.hero=h;auto=false;try{guide=false}catch(_){}
   for(const e of liveEnemies()){e.x=player.x+40;e.y=player.y+40;e.speed=0;}
   player.hp=Math.max(player.hp,200);player.invincible=5;
   // 먼저 카메라를 영웅에 맞춘다
   await new Promise(res=>{const t0=time;const f=()=>{if(time-t0>=1)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
   const off=()=>{const q=project(player.x,player.y);return Math.hypot(q.x-W/2,q.y-H/2)};
   const before=off();player.blinkCD=0;const x0=player.x,y0=player.y;keys.clear?.();blink();
   const moved=Math.hypot(player.x-x0,player.y-y0);const tr=[];const t0=time;
   await new Promise(res=>{const st=performance.now();const f=()=>{tr.push([+(time-t0).toFixed(3),+off().toFixed(1)]);if(time-t0>=1.2||performance.now()-st>40000)res();else requestAnimationFrame(f)};requestAnimationFrame(f)});
   const first=tr[0]?.[1]||0;const settle=(fr)=>{const x=tr.find(q=>q[1]<=before+(first-before)*fr);return x?x[0]:null};
   return {h,owner:!!window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.(),moved:+moved.toFixed(2),before:+before.toFixed(1),first,t50:settle(.5),t10:settle(.1),end:tr.at(-1)[1],trace:tr.filter((_,i)=>i%3==0).slice(0,14)};},h);
  console.log(z,JSON.stringify(r));}}
await b.close();
