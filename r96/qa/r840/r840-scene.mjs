// R840 장면 사진(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 네 지역의 NPC·조형물·단서를 몹 없이 찍는다. 사용: node r96/qa/r840/r840-scene.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {ctx,p}=await boot(b);
const waitT=dt=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:300000}));
const clear=()=>p.evaluate(()=>{player.hp=player.maxHp=1e9;for(const e of room.enemies){e.x=-900;e.y=-900;e.speed=0;}});
const shot=name=>p.screenshot({path:`${OUT}/${name}.png`,clip:{x:340,y:110,width:600,height:400}});
for(const z of ['last302','last303','last304','last305']){await go(p,z);await clear();await waitT(.4);
 await p.evaluate(()=>{const q=room.props.find(q=>q.r840NPC);player.x=q.x+2.0;player.y=q.y+2.4;});await clear();await waitT(2.2);await shot(z+'-1-npc');
 await p.evaluate(()=>{const q=room.props.find(q=>q.r840NPC);player.x=q.x+1.2;player.y=q.y+1.2;interact();});await p.waitForTimeout(900);if(z==='last302'||z==='last304')await p.screenshot({path:`${OUT}/${z}-2-panel.png`});
 await p.locator('#questTakeR840').click();const q=await p.evaluate(()=>window.__STORYWORLD_QUEST_R840__.inspect());
 if(q.prop){await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop);player.x=q.x+1.9;player.y=q.y+2.3;});await clear();await waitT(2.2);await shot(z+'-3-prop');
  await p.evaluate(()=>{const q=room.props.find(q=>q.r840Prop);player.x=q.x+1.2;player.y=q.y+1.0;});for(let i=0;i<3;i++){await p.evaluate(()=>interact());await waitT(.3);}
  await p.evaluate(()=>{const o=room.props.find(q=>q.r840Clue);player.x=o.x+2.2;player.y=o.y+2.2;});await clear();await waitT(1.2);await shot(z+'-4-clue');}
 console.log(z,JSON.stringify(q.prop||'kill'));}
await b.close();
