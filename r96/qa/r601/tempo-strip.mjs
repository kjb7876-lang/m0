// R601 전후 띠 그림: 몹 하나의 근접 공격을 실제 시간 0.08초 간격으로 찍어 위(예전)·아래(R601) 두 줄로 남긴다.
// 실행: SW_URL=… node r96/qa/r601/tempo-strip.mjs <zone> <mobIndex> <outDir>
import fs from 'node:fs';import {chromium,boot,go} from '../r444/lib.mjs';
const [,,zone='ep1a08',idx='0',outDir='/tmp/r601-strip']=process.argv;fs.mkdirSync(outDir,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,zone);await p.waitForTimeout(2000);
const info=await p.evaluate((idx)=>{const tb=tick;window.__SLOW=1e-4;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};
 for(const o of room.enemies)if(o.hp>0){o.x=player.x+30;o.y=player.y+30;}
 const e=room.enemies.filter(e=>e.hp>0&&!e.boss&&e.combatProfile?.attackShape)[+idx];const sh=e.combatProfile.attackShape;
 e.x=player.x+.9;e.y=player.y+.9;const atk={elapsed:0,angle:Math.atan2(player.y-.15-e.y,player.x-e.x),committed:true,id:998001,origin154:{x:e.x,y:e.y},shape154:Object.freeze({...sh})};
 window.__r601={e,atk};const q=project(e.x,e.y);return {name:e.name,nativeId:e.nativeId,W:sh.windup,A:sh.active,R:sh.recovery,x:q.x,y:q.y,h:actorHeight()};},idx);
const tot=info.W+info.A+info.R,step=.08,ts=[];for(let t=0;t<tot-1e-6;t+=step)ts.push(+t.toFixed(3));
await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const pos=await p.evaluate(()=>{const {e}=window.__r601;const q=project(e.x,e.y),c=document.querySelector('canvas'),k=c?c.clientWidth/(c.width||c.clientWidth):1;return {x:q.x*k,y:q.y*k,h:actorHeight()*k};});
const box={x:Math.max(0,pos.x-pos.h*.9),y:Math.max(0,pos.y-pos.h*1.5),width:pos.h*1.8,height:pos.h*1.75};
for(const on of [false,true])for(const t of ts){await p.evaluate(([t,on])=>{const {e,atk}=window.__r601;window.__STORYWORLD_ATTACK_TEMPO_R601__.set('on',on);e.attack=atk;atk.elapsed=t;e.hitTimer=0;e.flash=0;},[t,on]);
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.evaluate(([t])=>{const {e,atk}=window.__r601;e.attack=atk;atk.elapsed=t;},[t]);
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));await p.screenshot({path:`${outDir}/${on?'new':'old'}-${String(Math.round(t*1000)).padStart(4,'0')}.png`,clip:box});}
await p.evaluate(()=>window.__STORYWORLD_ATTACK_TEMPO_R601__.set('on',true));
fs.writeFileSync(outDir+'/info.json',JSON.stringify({...info,ts,step},null,1));console.log(JSON.stringify({...info,frames:ts.length}));await b.close();
