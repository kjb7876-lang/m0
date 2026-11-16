// R1104 헤드리스: 페르소나가 걷는 동안 몸 그림 조각·걸음 수를 재고, 걷는 장면을 연속으로 잘라 찍는다(소프트웨어 렌더 — 그래픽 검증 아님).
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'fs';
const OUT='r96/qa/r1104/';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
const A='__STORYWORLD_PERSONA_STRIDE_R1104__';
const T0=await p.evaluate(()=>time);
const log=[];const shots=[];
for(let k=0;k<60;k++){await p.evaluate(k=>{player.hp=maxHP();if(k%12===0){const e=room.enemies.find(e=>e.persona);for(const [dx,dy] of [[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,-4]]){if(!blocked(e.x+dx,e.y+dy,.3)&&!blocked(e.x+dx/2,e.y+dy/2,.3)){player.x=e.x+dx;player.y=e.y+dy;break;}}}},k);await p.waitForFunction(t=>time>t,T0+.09*(k+1),{timeout:120000});
 const s=await p.evaluate(A=>{const e=room.enemies.find(e=>e.persona),q=project(e.x,e.y),i=window[A].inspect();return {t:+time.toFixed(2),walk:i.walk,steps:i.stats.steps,split:i.stats.split,err:i.stats.errors,q:[Math.round(q.x),Math.round(q.y)],ink:window.__STORYWORLD_PERSONA_INK_R1097__?.inspect?.().swapped};},A);
 log.push(s);if(s.walk>.6&&shots.length<12){const f=OUT+'walk-'+shots.length+'.png';await p.screenshot({path:f,clip:{x:Math.max(0,s.q[0]-60),y:Math.max(0,s.q[1]-75),width:120,height:130}});shots.push(f);}}
fs.writeFileSync(OUT+'walk-shots.json',JSON.stringify(log));
console.log('walkFrames',log.filter(l=>l.walk>.6).length,'/',log.length,'last',JSON.stringify(log.at(-1)),'shots',shots.length);
await b.close();
