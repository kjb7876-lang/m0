// R1230 전후 장면: node r96/qa/r1230/r1230-scene.mjs <outdir> — 피의 육망성 조형물·R75 제자리 원거리 몹의 대기/모음/웅크림/뻗음/되돌림 5컷을 찍고,
//  엿보기 없이 30초 둔 뒤 drawEnemy 감싸기 횟수(덧씌우기끼리 서로 다시 감싸며 사슬이 자라지 않는지)를 적는다. 헤드리스 소프트웨어 렌더링(3D 장면 끔).
import fs from 'node:fs';import {chromium,boot,go,skip} from '../r444/lib.mjs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,'dist00');
const w0=await p.evaluate(()=>window.__STORYWORLD_FIXED_ATTACK_R1230__.inspect().stats.wraps);
const t0=Date.now();while(Date.now()-t0<30000){await skip(p);await p.waitForTimeout(1000);}
const w1=await p.evaluate(()=>window.__STORYWORLD_FIXED_ATTACK_R1230__.inspect().stats.wraps);console.log('wraps',w0,'→ 30초 뒤',w1);
await p.evaluate(()=>{const C=window.__STORYWORLD_COMBAT_R170__,d=room.enemies.find(e=>e.hp>0&&!e.boss&&!e.r75Tower);const art=C?.artOf?.(regionById?.[room.id]?.regionObjects6)||null;const path=art?.path||window.__STORYWORLD_STATIC_PROPS_R105__?.art?.pillar?.path;
 for(const x of room.enemies){x.spawnState='hidden';}
 const e=JSON.parse(JSON.stringify(d,(k,v)=>k==='r390Engaged'?undefined:v));Object.assign(e,{id:'r1230:shot:tower',x:player.x+2.2,y:player.y-1.2,homeX:0,homeY:0,nav:[],attack:null,rangedWindup:0,spawnState:'active',
  r170Tower:{art:path,h:art?.h||90,next:time+99,casts:0,summoned:12,snap:'{}'},r75Tower:true,speed:0,ai:'melee',cd:99,name:'피의 육망성 조형물'});e.hp=e.maxHp=1e6;room.enemies.push(e);window.__T=e;
 const m=room.enemies.find(x=>x.r75Tower&&!x.r170Tower);m.spawnState='active';m.x=player.x-1.6;m.y=player.y+1.4;m.speed=0;m.cd=99;m.hp=m.maxHp;window.__M=m;player.maxHp=player.hp=1e9;player.invincible=1e9;
 // 찍는 동안 게임 시간을 거의 멈춘다(R444 scene4 방식): tick 의 dt 를 1e-4 배로
 const tb=tick;tick=function(dt,...a){return tb.call(this,(Number(dt)||0)*(window.__slow||1),...a);};});
const cut=async(name,fn)=>{await p.evaluate(fn);await p.waitForTimeout(700);await p.screenshot({path:`${out}/${name}.png`});console.log('shot',name,await p.evaluate(()=>JSON.stringify([window.__STORYWORLD_FIXED_ATTACK_R1230__.phase(window.__T).k,window.__STORYWORLD_FIXED_ATTACK_R1230__.phase(window.__M).k])));};
await p.evaluate(()=>{window.__slow=1e-4;});
await cut('1-idle',()=>{__T.r170Tower.next=time+99;__M.rangedWindup=0;});
await cut('2-gather',()=>{__T.r170Tower.next=time+1.1;__M.rangedWindup=.5;});
await cut('3-crouch',()=>{__T.r170Tower.next=time+.2;__M.rangedWindup=.08;});
await cut('4-release',()=>{__T.r170Tower.casts++;__T.r170Tower.next=time+99;__M.rangedWindup=0;});
await p.evaluate(()=>{window.__slow=1;});await p.waitForFunction(()=>{const k=window.__STORYWORLD_FIXED_ATTACK_R1230__.phase(window.__T).k;return k==='recover';},null,{timeout:60000,polling:10}).catch(()=>{});await p.evaluate(()=>{window.__slow=1e-4;});
await p.screenshot({path:`${out}/5-recover.png`});
await b.close();
