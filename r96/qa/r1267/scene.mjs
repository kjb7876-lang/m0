// R1267 전후 장면(헤드리스 소프트웨어 렌더): 미카엘라 R(제네시스)·Q·하트 패시브를 쓰고 게임 시간 정해진 순간마다 멈춰 찍는다.
//  OFF=1 → R1267 끔(전). 가상 60fps(실제 rAF 한 번 = 1/60초)로 돌리고 찍는 순간엔 시계를 멈춘다.
import fs from 'node:fs';import {boot} from './boot.mjs';
const OFF=!!process.env.OFF,OUT=process.env.OUT||'out/r1267',VW=+(process.env.VW||640),VH=Math.round(VW*9/16),SC=process.env.SC||'R';fs.mkdirSync(OUT,{recursive:true});
const AT=(process.env.AT||'.35,.7,1.0,1.3,1.6,2.0').split(',').map(Number);
const {b,p,errors}=await boot({w:VW,h:VH,init:(off)=>{try{if(off){localStorage.setItem('storyworld.r1267.flashGuard','off');localStorage.setItem('storyworld.r1267.genesis','off');}}catch(_){}},initArg:OFF});
await p.evaluate(()=>{const S=window.__sc={virt:false,freeze:false};let lastReal=-1,virt=0;const raf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=function(cb){return raf(ts=>{if(ts!==lastReal){lastReal=ts;if(S.virt&&!S.freeze)virt+=1000/60;else if(!S.virt)virt=ts;}return cb(virt);});};
 for(const e of room.enemies){if(e.hp>0){e.hp=1e7;e.maxHp=1e7;}}const es=room.enemies.filter(v=>v.hp>0&&!v.boss);es.slice(8).forEach(v=>{v.x=player.x-60;v.y=player.y-60;v.speed=0;});
 es.slice(0,8).forEach((e,i)=>{e.x=player.x+1.6+(i%4)*.9;e.y=player.y-1.6+Math.floor(i/4)*1.4;e.speed=0;e.attack=null;});room.engaged=true;player.invincible=999;});
const t0=await p.evaluate(async(sc)=>{player.hp=maxHP();await new Promise(r=>setTimeout(r,500));window.__sc.virt=true;
 if(sc==='R')window.__STORYWORLD_WER__.cast('r');else if(sc==='Q'){player.specialCD=0;special();}else if(sc==='heart'){window.__STORYWORLD_MICHAELA_HEART_R948__?.qaForce?.('volley');window.__iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);}
 return time;},SC);
for(const a of AT){await p.waitForFunction(t=>time>=t,t0+a,{timeout:3000000});await p.evaluate(()=>{window.__sc.freeze=true;});await p.waitForTimeout(400);
 const q=await p.evaluate(()=>project(player.x+.8,player.y-.6));const s=VW/960;
 await p.screenshot({path:`${OUT}/${SC}-${OFF?'before':'after'}-${a.toFixed(2)}.png`,clip:{x:Math.max(0,q.x-260*s),y:Math.max(0,q.y-330*s),width:Math.min(VW,520*s),height:Math.min(VH,400*s)}});
 await p.evaluate(()=>{window.__sc.freeze=false;});}
console.log(JSON.stringify({off:OFF,errors,guard:await p.evaluate(()=>window.__STORYWORLD_FLASH_GUARD_R1267__?.inspect?.())}).slice(0,600));await b.close();
