import {chromium,boot,go,skip} from '../r444/lib.mjs';
const OUT=process.argv[2],ZONES=process.argv.slice(3);
const b=await chromium.launch();
const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
const {p}=await boot(b,{init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
console.log('start room',await p.evaluate(()=>room.id));
for(const z of ZONES){try{await go(p,z);
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;let i=0;for(const e of room.enemies){if(!(e.hp>0))continue;e.spawnState='active';e.hidden=false;e.engaged=true;e.hp=e.maxHp=1e8;e.speed=0;e.attackCooldown=99;e.x=player.x+((i%4)-1.5)*1.6+1;e.y=player.y-1.2-Math.floor(i/4)*1.4;i++;if(i>=8)break;}
  for(const e of room.enemies.slice(8)){e.x=player.x+300;e.y=player.y+300;}});
 await p.waitForTimeout(6000);await skip(p);
 const info=await p.evaluate(()=>({room:room.id,names:[...new Set(room.enemies.filter(e=>e.hp>0).slice(0,8).map(e=>e.name))],r409:window.__STORYWORLD_COMBAT_READ_R409__?.inspect().stats}));
 console.log(z,JSON.stringify(info));
 await p.screenshot({path:`${OUT}/${z}-on.png`});
 await p.evaluate(()=>window.__STORYWORLD_COMBAT_READ_R409__.set({outline:false}));await p.waitForTimeout(2500);
 await p.screenshot({path:`${OUT}/${z}-off.png`});
 await p.evaluate(()=>window.__STORYWORLD_COMBAT_READ_R409__.set({outline:true}));
}catch(e){console.log('ERR',z,String(e).slice(0,200));}}
await b.close();
