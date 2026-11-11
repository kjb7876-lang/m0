// R790 전후 장면(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): last303 보스 문 앞. 사용: node r96/qa/r790/r790-scene.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
for(const [tag,init] of [['before',{'storyworld.r790.npc':'{"on":false}'}],['after',null]]){const {ctx,p}=await boot(b,{init});await go(p,'last303');
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});
 await p.waitForFunction(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase==='rally',null,{timeout:120000});
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});
 await p.waitForFunction(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase==='door',null,{timeout:120000});
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-1.2;player.y=d.y+3.6;});await waitT(p,6);
 await p.screenshot({path:`${OUT}/${tag}-wide.png`});
 const q=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0'),s=project(d.x+1,d.y+2.4);return [s.x,s.y];});
 await p.screenshot({path:`${OUT}/${tag}-close.png`,clip:{x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-250)),width:560,height:400}});
 if(tag==='after'){await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-.6;player.y=d.y+2.9;interact();});await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:`${OUT}/after-panel.png`});
  console.log(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats)));}
 await ctx.close();}
await b.close();
