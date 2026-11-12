// R769 헤드리스 장면: last302 에서 약방 아낙 셋이 쏜 투사체(proj6 시트)와 소복 처녀(걷기 임시본)를 한 화면에. 게임 시간 기준으로 기다리고, 투사체가 날 때 시간을 멈춰 찍는다.
// usage: node r96/qa/r760/r769-scene.mjs <out-dir>   (STORYWORLD_URL 기본 http://127.0.0.1:4410/m0/)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'out-r769';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await go(p,'last302');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 player.hp=player.maxHp=1e9;player.invincible=1e9;const V=window.__STORYWORLD_VILLAGERS_R763__;
 const hw=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0&&V.kindFor(e)==='herbwife').slice(0,3),sb=room.enemies.filter(e=>e.hp>0&&V.kindFor(e)==='sobok').slice(0,2),keep=[...hw,...sb];
 for(const e of room.enemies)if(!keep.includes(e)){e.spawnState='hidden';e.x=-999;e.y=-999;}
 hw.forEach((e,i)=>{e.spawnState='active';e.x=player.x+4.2;e.y=player.y-2+i*1.6;});sb.forEach((e,i)=>{e.spawnState='active';e.x=player.x-2.5;e.y=player.y+1.5+i*1.2;});
 window.__N={hw:hw.length,sb:sb.length};});
await p.waitForFunction(()=>projectiles.some(b=>!b.friendly&&b.age>.12),null,{timeout:600000,polling:50});
await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:OUT+'/shot.png'});
const st=await p.evaluate(()=>({n:window.__N,shots:projectiles.filter(b=>!b.friendly).length,r763:window.__STORYWORLD_VILLAGERS_R763__.inspect(),sobok:room.enemies.filter(e=>e.r763==='sobok'&&e.hp>0).map(e=>e.name)}));
console.log(JSON.stringify({...st,errors:errs}));await b.close();
