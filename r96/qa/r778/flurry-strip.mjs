// R778 보스 연타 전후 띠: 보스 한 명의 공격 한 번을 실제 시간 0.06초 간격으로 찍어 위(예전 2배속 한 번)·아래(R778 연타) 두 줄로 남긴다.
// 실행: SW_URL=… node r96/qa/r778/flurry-strip.mjs <zone> <outDir>
import fs from 'node:fs';import {chromium,boot,go} from '../r444/lib.mjs';
const [,,zone='ep1a11',outDir='/tmp/r778-strip']=process.argv;fs.mkdirSync(outDir,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,zone);await p.waitForTimeout(2000);
const info=await p.evaluate(()=>{const tb=tick;window.__SLOW=1e-4;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};
 const e=room.enemies.find(e=>e.hp>0&&(e.boss||e.midboss));if(!e)return null;for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=player.x+30;o.y=player.y+30;}
 e.spawnState='active';player.x=e.x-1.6;player.y=e.y+1.1;const sh=e.combatProfile?.attackShape?.windup>0?e.combatProfile.attackShape:{windup:.6,active:.2,recovery:.7};
 const atk={elapsed:0,angle:Math.atan2(player.y-.15-e.y,player.x-e.x),committed:true,id:998002,origin154:{x:e.x,y:e.y},shape154:Object.freeze({windup:sh.windup,active:sh.active,recovery:sh.recovery})};
 window.__r778={e,atk};return {name:e.name,nativeId:e.nativeId,boss:!!e.boss,W:sh.windup,A:sh.active,R:sh.recovery};});
if(!info){console.log('no boss');process.exit(1);}
for(let i=0;i<6;i++)await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
await p.screenshot({path:outDir+'/full.png'});
const dbg=await p.evaluate(()=>{const {e}=window.__r778;return {x:e.x,y:e.y,px:player.x,py:player.y,ss:e.spawnState,vis:e.visible,hidden:e.hidden,r75:e.r75State||null,q:project(e.x,e.y)};});console.log(JSON.stringify(dbg));
const pos=await p.evaluate(()=>{const {e}=window.__r778;const q=project(e.x,e.y),c=document.querySelector('canvas'),k=c?c.clientWidth/(c.width||c.clientWidth):1;return {x:q.x*k,y:q.y*k,h:actorHeight()*k*2.4};});
const box={x:Math.max(0,pos.x-pos.h*.75),y:Math.max(0,pos.y-pos.h*.75),width:pos.h*1.5,height:pos.h*1.4};
const tot=info.W+info.A+info.R,ts=[];for(let t=info.W-.12;t<tot-1e-6;t+=.06)ts.push(+t.toFixed(3));
if(process.env.ONLYFULL){await b.close();process.exit(0);}
for(const on of [false,true])for(const t of ts){await p.evaluate(([t,on])=>{const {e,atk}=window.__r778;window.__STORYWORLD_ATTACK_TEMPO_R601__.set('flurry',on);e.attack=atk;atk.elapsed=t;e.hitTimer=0;e.flash=0;},[t,on]);
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.evaluate(([t])=>{const {e,atk}=window.__r778;e.attack=atk;atk.elapsed=t;},[t]);
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));await p.screenshot({path:`${outDir}/${on?'new':'old'}-${String(Math.round(t*1000)).padStart(4,'0')}.png`,clip:box});}
await p.evaluate(()=>window.__STORYWORLD_ATTACK_TEMPO_R601__.set('flurry',true));
fs.writeFileSync(outDir+'/info.json',JSON.stringify({...info,ts},null,1));console.log(JSON.stringify({...info,frames:ts.length}));await b.close();
