import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
await p.evaluate(()=>{window.__P=room.enemies.find(e=>e.persona);window.__S=new Set();window.__EV=[];const mk=makeShot;makeShot=function(...a){const r=mk.apply(this,a);try{if(r&&!r.friendly)window.__S.add(String(r.asset).split('/').slice(-2).join('/'));}catch(_){}return r;};});
const T0=await p.evaluate(()=>time);
for(let k=0;k<8;k++){
 await p.evaluate(()=>{player.hp=maxHP();player.invincible=Math.max(player.invincible||0,3);});
 await p.waitForFunction(t=>time>t,T0+3+k*4,{timeout:300000});await skip(p);
 const s=await p.evaluate(()=>{const e=__P;return {t:time|0,in:room.enemies.includes(e),st:room.encounterStage,hp:[e.hp|0,e.maxHp|0],e:[+e.x.toFixed(1),+e.y.toFixed(1)],pl:[+player.x.toFixed(1),+player.y.toFixed(1)],d:+Math.hypot(e.x-player.x,e.y-player.y).toFixed(1),awake:e.awakeUntil>time,red:e.redTimeUntil9>time,shots:projectiles.filter(b=>!b.friendly).length,assets:[...__S],ev:SW3.events.slice(-4).map(x=>x.type+(x.key?':'+x.key:'')),r225:window.__STORYWORLD_REACH_R225__.inspect().stats.moved};});
 console.log(JSON.stringify(s));
 if(k%2==1)await p.screenshot({path:'r96/qa/r1047/persona-'+k+'.png'});}
await b.close();
