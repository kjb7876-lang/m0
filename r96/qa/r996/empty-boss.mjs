// R996: 일반몹을 모두 잡은 뒤(보스만 남음) 불면귀 보스전에서 R990 안개 소환이 나오는지 잰다.
import {chromium,boot,go} from '../r444/lib.mjs';
const DUR=+(process.argv[2]||40),MOBILE=process.argv[3]==='mobile',KILL=process.argv.includes('kill'),LOW=process.argv.includes('low');
const b=await chromium.launch();const {p}=await boot(b,{init:{'storyworld.r790.npc':'{"on":false}'}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'last303');
const pre=await p.evaluate(()=>({mobs:room.enemies.filter(e=>e.nativeId==='l302-e1').length,roster:(regionById.last303?.roster||[]).map(r=>r?.id)}));
await p.evaluate((mob)=>{if(mob){window.__R996_MOBILE=1;try{settings.lowFx=true;}catch(_){}}
 const B=room.enemies.find(e=>e.boss&&!e.midboss);window.__B=B;
 for(const e of room.enemies)if(e!==B){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}
 room.enemies=room.enemies.filter(e=>e===B);
 B.spawnState='active';room.engaged=true;player.hp=player.maxHp=1e9;player.invincible=1e9;player.x=B.x+3;player.y=B.y+2;
 window.__L={peak:0,waves:[],last:0};setInterval(()=>{const w=window.__STORYWORLD_BMG_FOG_R990__?.inspect?.().stats.waves||0;if(w>__L.last){__L.last=w;__L.waves.push(+time.toFixed(1));}
 if(window.__KILL)for(const e of room.enemies)if(e.r990Fog&&e.hp>0){e.__b=e.__b??time;if(time-e.__b>3){e.hp=0;}}
 const n=room.enemies.filter(e=>e.r990Fog&&e.hp>0).length;if(n>__L.peak)__L.peak=n;},250);},MOBILE);if(LOW)await p.evaluate(()=>{__B.hp=__B.maxHp*.2;});if(KILL)await p.evaluate(()=>{window.__KILL=1;});
const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,DUR],{timeout:1500000,polling:500}).catch(()=>{});
const r=await p.evaluate(()=>({t:time,st:window.__STORYWORLD_BMG_FOG_R990__?.inspect?.().stats,peak:__L.peak,waveAt:__L.waves,hp:+(__B.hp/__B.maxHp).toFixed(2),lowFx:settings.lowFx}));
console.log(JSON.stringify({pre,...r,errs:errs.slice(0,3)}));await b.close();
