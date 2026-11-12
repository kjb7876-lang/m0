// R792 장면(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 사용: node r96/qa/r792/r792-scene.mjs <outdir> [zone…]
//  last303: 앳된 남자 숨쉬기(멀리)·내밀기(가까이)·창. ep1a10·ep1a11: 보스를 쓰러뜨린 뒤 제단 곁 전(끔)·후·창.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.',ZONES=process.argv.slice(3).length?process.argv.slice(3):['last303','ep1a10','ep1a11'];fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase),waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
const clip=q=>({x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-240)),width:560,height:400});
const panel=async(p,f)=>{await p.evaluate(()=>interact());await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:f});};
async function toDoor(p,z){await go(p,z);await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');}
for(const z of ZONES){
 if(z==='last303'){const {ctx,p}=await boot(b);await toDoor(p,z);const d=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');return [d.x,d.y];});
  await p.evaluate(([x,y])=>{player.x=x-2.6;player.y=y+6.2;},d);await waitT(p,6);const q=await p.evaluate(()=>{const n=room.props.find(p=>p.r790NPC),s=project(n.x-.8,n.y+1);return [s.x,s.y];});
  await p.screenshot({path:`${OUT}/${z}-idle-wide.png`});await p.screenshot({path:`${OUT}/${z}-idle-close.png`,clip:clip(q)});
  await p.evaluate(()=>{const n=room.props.find(p=>p.r790NPC);player.x=n.x-1.7;player.y=n.y+.9;});await waitT(p,2.5);const q2=await p.evaluate(()=>{const n=room.props.find(p=>p.r790NPC),s=project(n.x-.8,n.y+1);return [s.x,s.y];});
  await p.screenshot({path:`${OUT}/${z}-offer-close.png`,clip:clip(q2)});await panel(p,`${OUT}/${z}-panel.png`);console.log(z,JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats)));await ctx.close();continue;}
 for(const [tag,init] of [['before',{'storyworld.r790.npc':'{"on":false}'}],['after',null]]){const {ctx,p}=await boot(b,{init});await toDoor(p,z);
  await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;interact();});
  for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}
  await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.some(e=>e.boss||e.midboss),null,{timeout:180000});
  await p.evaluate(()=>{for(const e of [...room.enemies])if((e.boss||e.midboss)&&e.hp>0){e.spawnState='active';e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'exit');
  await p.evaluate(()=>{player.x=room.objective.x-1.4;player.y=room.objective.y+1.2;});await waitT(p,6);await p.screenshot({path:`${OUT}/${z}-${tag}-wide.png`});
  const q=await p.evaluate(()=>{const s=project(room.objective.x+.6,room.objective.y+.4);return [s.x,s.y];});await p.screenshot({path:`${OUT}/${z}-${tag}-close.png`,clip:clip(q)});
  if(tag==='after'){await panel(p,`${OUT}/${z}-panel.png`);console.log(z,JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats)));}await ctx.close();}}
await b.close();
