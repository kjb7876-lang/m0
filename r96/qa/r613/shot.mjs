// 전후 장면: 한 장 몹을 영웅 옆 한 줄로 세워 오른쪽으로 걷게 하고 4장 찍는다(R613 끔/켬).
import {chromium,boot,go} from './lib.mjs';import fs from 'node:fs';
const [zone,re,out]=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r286.motion':'{"on":false}'}});
await go(p,zone);
await p.evaluate(re=>{auto=false;guide=false;const R=new RegExp(re);const T=room.enemies.filter(e=>e.hp>0&&R.test(e.name)&&!(e.boss||e.midboss)).slice(0,3);
 window.__sh={T,t0:time};for(const e of room.enemies)if(!T.includes(e)){e.x+=40;e.y+=40;}
 const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);const S=window.__sh;player.hp=9e8;player.invincible=999;
  S.T.forEach((e,j)=>{const u=((time-S.t0)*1.3)%3;e.speed=0;e.attack=null;e.rangedWindup=0;e.x=player.x-1.6+u+j*.9;e.y=player.y+1.6-j*.9+u*0;e.moving=true;e.spawnState='active';e.direction='right';});
  for(const e of room.enemies)if(!S.T.includes(e)){e.speed=0;}return r;};},re);
const shots=[];for(const mode of ['off','on']){await p.evaluate(m=>window.__STORYWORLD_MOB_GAIT_R613__.set(m==='on'),mode);
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time-t>1.2,t0,{timeout:300000});
 for(let k=0;k<4;k++){const t=await p.evaluate(()=>time);await p.waitForFunction(t=>time-t>.09,t,{timeout:120000});const f=`${out}-${mode}-${k}.png`;await p.screenshot({path:f,clip:{x:240,y:120,width:480,height:300}});shots.push(f);}}
console.log(JSON.stringify(await p.evaluate(()=>({g:window.__STORYWORLD_MOB_GAIT_R613__.inspect().names,n:window.__sh.T.map(e=>e.name)}))));
await b.close();
