// R1226 화면 확인: 지역 z 에서 이름 정규식 몹 하나만 남기고 대기 → 영웅 오른쪽 공격 → 왼쪽 공격 장면을 찍어 한 장으로 붙인다
import fs from 'node:fs';import {chromium,boot,go,skip} from './lib.mjs';
const [z,re,out,offArg]=process.argv.slice(2);const off=offArg==='off';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
if(off)await p.evaluate(()=>window.__STORYWORLD_MOB_MOTION_R1226__?.set({on:false}));
await go(p,z);
const id=await p.evaluate(re=>{const R=new RegExp(re);const B=room.enemies.find(e=>e.hp>0&&R.test(e.name));if(!B)return null;window.__B=B;
 for(const e of room.enemies)if(e!==B){e.spawnState='hidden';e.attack=null;e.rangedWindup=0;e.x=-99;e.y=-99;}
 B.spawnState='active';B.graceUntil=0;room.engaged=true;player.maxHp=player.hp=1e9;player.invincible=1e9;auto=false;guide=false;
 window.__put=d=>{for(const s of [1,.8,.6,.45]){const tx=B.x+d*s,ty=B.y-d*s;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;return;}}player.x=B.x+d*.3;player.y=B.y-d*.3;};return B.id;},re);
if(!id){console.log('no mob');await b.close();process.exit(1);}
const until=async(f,arg,ms=60000)=>{const t0=Date.now();while(Date.now()-t0<ms){const ok=await p.evaluate(([f,a])=>{try{for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}return (0,eval)(f)(a);},[f,arg]);if(ok)return true;await p.waitForTimeout(120);}return false;};
const shots=[];const snap=async(lab)=>{const q=await p.evaluate(()=>{const B=window.__B;const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const s=project(B.x,B.y);return {x:s.x*r.width/c.width+r.left,y:s.y*r.height/c.height+r.top,st:window.__STORYWORLD_MOB_MOTION_R1226__?.stats?.()||null};});
 const clip={x:Math.max(0,q.x-110),y:Math.max(0,q.y-170),width:220,height:200};clip.width=Math.min(clip.width,640-clip.x);clip.height=Math.min(clip.height,360-clip.y);
 const f=`${out}-${shots.length}.png`;await p.screenshot({path:f,clip});shots.push({f,lab});};
await p.evaluate(()=>window.__put(4));await until('()=>{window.__t=window.__t??time;return time>window.__t+.6}');await snap('idle');
for(const [lab,d] of [['R',.9],['L',-.9]]){await p.evaluate(d=>{window.__B.attack=null;window.__B.cooldown=0;window.__put(d);},d);
 const ok=await until('()=>!!(window.__B.attack&&!window.__B.attack.storyWorldPose5)||window.__B.rangedWindup>0');
 if(!ok){await snap(lab+' 공격 없음');continue;}
 await until('()=>{const a=window.__B.attack;window.__a0=window.__a0??time;return !a||time>window.__a0+.12}');await snap(lab+'1');
 await p.evaluate(()=>{window.__a1=time;});await until('()=>time>window.__a1+.18');await snap(lab+'2');await p.evaluate(()=>{window.__a0=undefined;});}
const st=await p.evaluate(()=>window.__STORYWORLD_MOB_MOTION_R1226__?.stats?.()||null);console.log(JSON.stringify({z,re,off,st,shots:shots.map(s=>s.lab)}));
fs.writeFileSync(out+'.json',JSON.stringify(shots));await b.close();
