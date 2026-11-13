// R996: 일반몹을 모두 잡은 뒤(보스만 남음) 불면귀 보스전에서 R990 안개 소환이 나오는지 잰다.
import {chromium,boot,go} from '../r444/lib.mjs';
const DUR=+(process.argv[2]||40),MOBILE=process.argv[3]==='mobile';
const b=await chromium.launch();const {p}=await boot(b,{init:{'storyworld.r790.npc':'{"on":false}'}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'last303');
const pre=await p.evaluate(()=>({mobs:room.enemies.filter(e=>e.nativeId==='l302-e1').length,roster:(regionById.last303?.roster||[]).map(r=>r?.id)}));
await p.evaluate((mob)=>{if(mob){window.__R996_MOBILE=1;try{settings.lowFx=true;}catch(_){}}
 const B=room.enemies.find(e=>e.boss&&!e.midboss);window.__B=B;
 for(const e of room.enemies)if(e!==B){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}
 room.enemies=room.enemies.filter(e=>e===B);
 B.spawnState='active';room.engaged=true;player.hp=player.maxHp=1e9;player.invincible=1e9;player.x=B.x+3;player.y=B.y+2;
 window.__L={peak:0};setInterval(()=>{const n=room.enemies.filter(e=>e.r990Fog&&e.hp>0).length;if(n>__L.peak)__L.peak=n;},250);},MOBILE);
const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,DUR],{timeout:1500000,polling:500}).catch(()=>{});
const r=await p.evaluate(()=>({t:time,st:window.__STORYWORLD_BMG_FOG_R990__?.inspect?.().stats,peak:__L.peak,lowFx:settings.lowFx}));
console.log(JSON.stringify({pre,...r,errs:errs.slice(0,3)}));await b.close();
