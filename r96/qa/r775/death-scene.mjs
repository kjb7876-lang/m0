import {chromium,boot,go} from '/home/user/m0/r96/qa/r444/lib.mjs';
const zone=process.argv[3]||'dist03';const b=await chromium.launch();const {p}=await boot(b,{});
await go(p,zone);await p.waitForTimeout(1500);
const info=await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};player.hp=player.maxHp=1e9;player.invincible=1e9;
 const M=window.__STORYWORLD_MOB_DEATH_R462__;const all=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss);const pick=all.slice(0,4);const boss=room.enemies.find(e=>e.boss||e.midboss);
 for(const e of room.enemies)if(!pick.includes(e)&&e!==boss){e.spawnState='hidden';e.x=-999;e.y=-999;}
 pick.forEach((e,i)=>{e.spawnState='active';e.speed=0;e.x=player.x+1.6+i*.9;e.y=player.y-1+((i%2)?.8:-.4);});if(boss){boss.spawnState='active';boss.speed=0;boss.x=player.x-2.2;boss.y=player.y+.6;}
 window.__cnt={flame:0,wall:0};const tx=texture;let F=null;try{F=VFX.burnFlame;}catch(_){}
 const di=CanvasRenderingContext2D.prototype.drawImage;
 return {zone:room.id,n:pick.length,names:pick.map(e=>e.name),boss:boss?.name||null,F};});
await p.waitForTimeout(800);
await p.evaluate(()=>{const M=window.__STORYWORLD_MOB_DEATH_R462__;for(const e of room.enemies)if(e.spawnState==='active'&&e.hp>0)hitEnemy(e,1e9);});
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.28,t0,{timeout:200000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);
const st=await p.evaluate(()=>{const fx=effects.filter(f=>f.type==='enemyBurnDeath').map(f=>({kind:f.r462?.kind||null,boss:!!f.boss,age:+f.age.toFixed(2),embers:(f.embers||[]).length}));return {fx,r462:window.__STORYWORLD_MOB_DEATH_R462__?.inspect?.()?.stats};});
await p.screenshot({path:process.argv[2]});console.log(JSON.stringify({info:await p.evaluate(()=>0)===0?undefined:0,st}));await b.close();
