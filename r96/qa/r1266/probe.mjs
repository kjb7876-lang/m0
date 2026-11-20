// R1266 재현: 실제 S 키 블링크 뒤 rAF 마다 영웅 위치·카메라·R1236 상태를 기록(헤드리스).
import {chromium,boot,skip,go} from '../r444/lib.mjs';
const b=await chromium.launch();
const MOB=process.env.MOBILE==='1';const {ctx,p}=await boot(b,{vp:MOB?{width:844,height:390}:{width:1280,height:720},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
for(const z of (process.env.ZONES||'murder01').split(',')){await go(p,z);
const all=await p.evaluate(()=>Object.keys(HEROES));console.log('heroes',all.join(','));
for(const h of (process.env.HEROES?process.env.HEROES.split(','):all)){
 await p.evaluate(async h=>{await ensureImages(heroPaths(h));player.hero=h;auto=false;try{guide=false}catch(_){}
  for(const e of liveEnemies()){e.x=player.x+40;e.y=player.y+40;e.speed=0;}player.hp=Math.max(player.hp,300);player.invincible=9;player.blinkCD=0;
  window.__rec=[];const off=()=>{const q=project(player.x,player.y);return Math.round(Math.hypot(q.x-W/2,q.y-H/2))};
  const f=()=>{window.__rec.push([+time.toFixed(3),+player.x.toFixed(2),+player.y.toFixed(2),off(),window.__STORYWORLD_BLINK_CAMERA_R1236__?.inspect().stats.boosts,layer]);if(window.__rec.length<12)requestAnimationFrame(f)};
  await new Promise(r=>{const t0=time;const w=()=>{if(time-t0>.6)r();else requestAnimationFrame(w)};requestAnimationFrame(w)});requestAnimationFrame(f);},h);
 await p.keyboard.press('s');await p.waitForTimeout(100);await p.keyboard.press('KeyS');
 await p.waitForFunction(()=>window.__rec.length>=12,null,{timeout:120000});
 const r=await p.evaluate(()=>({rec:window.__rec,cd:player.blinkCD,keys:[],snaps:window.__STORYWORLD_BLINK_CAMERA_R1236__.inspect().stats.snaps}));
 console.log(z,h,JSON.stringify(r.keys),'cd',r.cd);console.log('  offsets',JSON.stringify(r.rec.map(q=>q[3])),'moved',JSON.stringify(r.rec.slice(0,2).map(q=>[q[1],q[2]])),'layer',r.rec[0][5],'boosts',r.rec.at(-1)[4],'snaps',r.snaps);}}
await b.close();
