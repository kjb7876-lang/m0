// R1104 헤드리스 탐색: 페르소나 결전 중 보스가 움직일 때 몸 그림이 무엇으로 그려지는지(경로·네 점) 기록.
import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
await p.evaluate(()=>{window.__P=room.enemies.find(e=>e.persona);window.__L=[];const base=drawEnemy;drawEnemy=function(e,...a){const cm=ctx.commands,st=Array.isArray(cm)?cm.length:-1;const r=base.call(this,e,...a);
 if(e===__P&&st>=0){let best=null,bh=0;for(let i=st;i<cm.length;i++){const c=cm[i];if(c?.kind!=='image'||!Array.isArray(c.points))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
  if(best)__L.push({t:+time.toFixed(3),x:+e.x.toFixed(3),y:+e.y.toFixed(3),path:String(best.sourcePath||'').split('/').slice(-2).join('/'),r1097:!!best.r1097,top:+best.points[0][1].toFixed(1),foot:+((best.points[2][1]+best.points[3][1])/2).toFixed(1),lx:+best.points[0][0].toFixed(1),rx:+best.points[1][0].toFixed(1),atk:!!e.attack,state:e.storyAttackState5||'',hit:e.hitTimer>0});}return r;};});
const T0=await p.evaluate(()=>time);
await p.evaluate(()=>{player.hp=maxHP();});
await p.waitForFunction(t=>time>t,T0+14,{timeout:400000});
const L=await p.evaluate(()=>__L);
const inspect=await p.evaluate(()=>({r620:window.__STORYWORLD_BOSS_MOTION_R620__?.inspect(),r1097:window.__STORYWORLD_PERSONA_INK_R1097__?.inspect?.()}));
import fs from 'fs';fs.writeFileSync('r96/qa/r1104/probe.json',JSON.stringify({L,inspect},null,0));
// 요약: 움직인 구간(속도>0.3)의 그림 경로 종류·머리 높이 변화
let moving=[];for(let i=1;i<L.length;i++){const a=L[i-1],c=L[i],dt=c.t-a.t;if(dt<=0)continue;const v=Math.hypot(c.x-a.x,c.y-a.y)/dt;if(v>.3)moving.push({...c,v:+v.toFixed(2),dh:+((c.foot-c.top)-(a.foot-a.top)).toFixed(2)});}
const paths={};for(const m of moving)paths[m.path]=(paths[m.path]||0)+1;
console.log('samples',L.length,'moving',moving.length,'paths',JSON.stringify(paths));
console.log('moving sample',JSON.stringify(moving.slice(0,12)));
console.log('height range moving',Math.min(...moving.map(m=>m.foot-m.top)).toFixed(1),Math.max(...moving.map(m=>m.foot-m.top)).toFixed(1));
console.log('r620',JSON.stringify(inspect.r620?.stats),'r1097',JSON.stringify(inspect.r1097?.stats||inspect.r1097));
await b.close();
