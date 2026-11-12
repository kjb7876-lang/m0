// R791 전후 장면(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): last305 보스를 쓰러뜨린 뒤 제단 곁. 사용: node r96/qa/r791/r791-scene.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
for(const [tag,init] of [['before',{'storyworld.r790.npc':'{"on":false}'}],['after',null]]){const {ctx,p}=await boot(b,{init});await go(p,'last305');
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}
 await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.some(e=>e.boss&&e.spawnState!=='hidden'),null,{timeout:180000});
 await p.evaluate(()=>{for(const e of [...room.enemies])if((e.boss||e.midboss)&&e.hp>0){e.spawnState='active';e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'exit');
 await p.evaluate(()=>{player.x=room.objective.x-1.4;player.y=room.objective.y+1.2;});await waitT(p,6);
 await p.screenshot({path:`${OUT}/${tag}-wide.png`});
 const q=await p.evaluate(()=>{const s=project(room.objective.x+.6,room.objective.y+.4);return [s.x,s.y];});
 await p.screenshot({path:`${OUT}/${tag}-close.png`,clip:{x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-230)),width:560,height:400}});
 if(tag==='after'){await p.evaluate(()=>interact());await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:`${OUT}/after-panel.png`});
  console.log(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats)));}
 await ctx.close();}
await b.close();
