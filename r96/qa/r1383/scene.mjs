// R1383 장면 찍기(헤드리스): 보스를 영웅에게서 조금 떨어뜨리고 뿌리 터짐이 떠 있는 순간을 확대해 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1383_OUT||'/tmp/r1383-shots';fs.mkdirSync(OUT,{recursive:true});const TAG=process.env.TAG||'after';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:process.env.INIT?JSON.parse(process.env.INIT):null});
await go(p,'dist00');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist00-boss');room.engaged=true;e.spawnState='active';e.hidden=false;e.x=player.x+4.5;e.y=player.y-2.5;for(const m of room.enemies)if(m!==e)m.hp=0;window.__boss=e;});
const t0=await p.evaluate(()=>time);let n=0;
for(let k=1;k<=80&&n<5;k++){const r=await p.waitForFunction(a=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;e.hp=Math.max(e.hp,e.maxHp*.8);
  if(time<a[0]+a[1])return false;const F=window.__STORYWORLD_BOSS_PATTERN_FX_R1040__?.inspect?.();return {live:F?.live||0,q:player?project(player.x,player.y):null};},[t0,k*.4],{timeout:300000}).then(h=>h.jsonValue());
 if(r.live>0){n++;await p.screenshot({path:`${OUT}/scene-${TAG}-${n}.png`});}}
await b.close();console.log('shots',n);
