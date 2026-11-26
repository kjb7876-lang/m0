// R1341 헤드리스: ep1a11 보스를 쓰러뜨린 뒤 제단 곁 인물(미카엘라) 장면과 대화창을 찍는다.
// 사용: node r96/qa/r1341/npc-shot.mjs <out폴더>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {ctx,p}=await boot(b,{vp:{width:1280,height:720}});
await go(p,'ep1a11');
const st=await p.evaluate(async()=>{const R78=window.__STORYWORLD_WORLD_COMBAT_R78__;player.hp=player.maxHp=1e9;
 for(let k=0;k<40;k++){for(const e of room.enemies){if(e.hp>0){try{hitEnemy(e,1e9,{kind:'qa'});}catch(_){e.hp=0;}}}await new Promise(r=>setTimeout(r,500));
  const S=R78?.state?.(room);if(S&&k>=2&&S.phase!=='exit'&&S.phase!=='exitStory'&&S.phase!=='done'){S.phase='exit';S.doorStoryDone=true;}/* 헤드리스: 길·집결을 걷지 않고 보스 뒤 단계로 */
  const ph=R78?.state?.(room)?.phase;if(ph==='exit'&&room.props.some(p=>p.r790NPC))break;
  try{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}}
 const n=room.props.find(p=>p.r790NPC);return {phase:R78?.state?.(room)?.phase,npc:n?{kind:n.r790NPC,x:n.x,y:n.y}:null};});
console.log(JSON.stringify(st));
if(st.npc){await p.evaluate(n=>{player.x=n.x-1.6;player.y=n.y+.6;},st.npc);
 for(let i=0;i<30;i++){await skip(p);await p.waitForTimeout(200);}
 await p.screenshot({path:OUT+'/npc-scene.png'});
 await p.evaluate(n=>{player.x=n.x-1;player.y=n.y;},st.npc);await p.waitForTimeout(600);
 await p.evaluate(()=>{try{interact();}catch(e){console.log(e)}});await p.waitForTimeout(1500);
 await p.screenshot({path:OUT+'/npc-panel.png'});
 console.log(await p.evaluate(()=>document.querySelector('#panel,.panel,.modal')?.innerText?.slice(0,300)||window.__STORYWORLD_NPC_R790__?.inspect?.()));}
await b.close();
