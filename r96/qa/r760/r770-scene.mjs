// R770 헤드리스 장면: last302 에서 소복 처녀(부유 이동 하나·떠 있는 대기 하나)와 약방 아낙(피격 하나·죽는 중 둘). 게임 시간을 멈춰 세 순간을 찍는다.
// usage: node r96/qa/r760/r770-scene.mjs <out-dir>   (STORYWORLD_URL 기본 http://127.0.0.1:4410/m0/)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'out-r770';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await go(p,'last302');
await p.waitForFunction(()=>['herbwife-death','herbwife-hit','sobok-float','sobok-idle','sobok-atk','sobok-hit'].every(k=>readyImage('assets/r770/villagers/'+k+'.webp')),null,{timeout:300000,polling:200});
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 player.hp=player.maxHp=1e9;player.invincible=1e9;const V=window.__STORYWORLD_VILLAGERS_R763__;
 const hw=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0&&V.kindFor(e)==='herbwife').slice(0,3),sb=room.enemies.filter(e=>e.hp>0&&V.kindFor(e)==='sobok').slice(0,2),keep=[...hw,...sb];
 for(const e of room.enemies)if(!keep.includes(e)){e.spawnState='hidden';e.x=-999;e.y=-999;}
 for(const e of keep){e.spawnState='active';e.speed=0;e.attackCooldown=99;e.rangedCooldown=99;}
 hw.forEach((e,i)=>{e.x=player.x+3.2;e.y=player.y-2.2+i*1.9;});sb.forEach((e,i)=>{e.x=player.x-2.6+i*.4;e.y=player.y-1+i*2.2;});
 window.__K={hw,sb};window.__N={hw:hw.length,sb:sb.length};});
const shot=async(name,fn,wait=.02)=>{await p.evaluate(fn);await p.evaluate(()=>{window.__SLOW=1;});const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,w])=>time>t+w,[t0,wait],{timeout:120000,polling:50});
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);await p.screenshot({path:OUT+'/'+name+'.png'});};
// 1) 소복 하나는 부유 이동(moving), 아낙 하나 피격
await shot('a-float-hit',()=>{const {hw,sb}=window.__K;sb[0].moving=true;sb[1].moving=false;hw[0].hitTimer=.3;});
// 1b) R771 소복 피격(떠 있는 채 젖혀짐)
await shot('a2-sobok-hit',()=>{const {sb}=window.__K;sb[0].moving=false;sb[1].hitTimer=.6;},.1);
// 2) 아낙 둘 죽음: 한 명은 무너지는 중, 한 명은 엎드린 뒤
await shot('b-death',()=>{const {hw,sb}=window.__K;sb[0].moving=false;for(const e of [hw[1],hw[2]])hitEnemy(e,1e9);
 const fx=effects.filter(f=>f.r763?.k==='herbwife');if(fx[0])fx[0].age=.35;if(fx[1])fx[1].age=1.1;});
const st=await p.evaluate(()=>({sobokHit:window.__STORYWORLD_STORY_COMBAT_R54__.frameFor(window.__K.sb[1],null)?.path,n:window.__N,r763:window.__STORYWORLD_VILLAGERS_R763__.inspect(),fx:effects.filter(f=>f.r763).map(f=>[f.r763.k,+f.age.toFixed(2),f.life])}));
console.log(JSON.stringify({...st,errors:errs}));await b.close();
