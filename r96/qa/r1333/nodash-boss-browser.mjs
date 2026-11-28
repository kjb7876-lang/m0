// R1333 헤드리스(그래픽·GPU 검증 아님): 보스·중간보스 돌진을 R1333 끔/켬으로 잰다.
//  지역마다 보스급 2마리만 살려(불사) 영웅(무적·제자리) 5칸 옆에서 게임 시간 SECS 초 동안
//  R52 돌진(엔진 metrics)·R268 빠른 돌진·R114 환영 돌진·R205 환영 쪽 이동·R116 챔피언 돌진, 그리고 몸이 6칸/초 넘게 0.5칸 넘게 움직인 횟수(틱 표본)를 센다.
//  사용: SW_URL=http://127.0.0.1:4411/m0/ [SECS=30] [ZONES=ep1b05,dist02,ep1b06,kair04] node r96/qa/r1333/nodash-boss-browser.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
const SECS=+(process.env.SECS||30),ZONES=(process.env.ZONES||'ep1b05,dist02,ep1b06,kair04').split(',');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_MOB_NODASH_R1333__.set({on}),on);await p.evaluate(()=>{if(room?.id!=='hub')enterRegion('hub',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='hub',null,{timeout:150000});await go(p,zone);
 return p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  const ms=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss||e.persona||/중간보스/.test(e.name||''))).slice(0,2);if(!ms.length)return {zone:room.id,none:true};
  const B=ms[0];player.x=B.x+5;player.y=B.y;try{if(blocked(player.x,player.y,.3,room))player.x=B.x-5;}catch(_){}
  room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});ms.forEach(e=>{e.hp=e.maxHp=1e9;e.spawnState='active';e.hidden=false;});room.engaged=true;
  const G=(f,d=0)=>{try{const v=f();return Number.isFinite(v)?v:d;}catch(_){return d;}};
  const snap=()=>({r52:G(()=>window.__STORYWORLD_HOSPITAL_CHARGE_R52__.inspect().metrics.charges),r268:G(()=>window.__STORYWORLD_MOB_GAZE_R268__.inspect().stats.dashes),r268b:G(()=>window.__STORYWORLD_MOB_GAZE_R268__.inspect().stats.blinks),
   r114:G(()=>window.__STORYWORLD_COMBAT_R114__.inspect().stats.dashes),r205:G(()=>window.__STORYWORLD_BOSS_R205__.inspect().stats.moves)});
  const s0=snap(),px=player.x,py=player.y,t0=time;const prev=new Map(ms.map(e=>[e,{x:e.x,y:e.y,t:time}]));let fast=0;const acts=new Set();
  await new Promise(r=>{const f=()=>{player.hp=player.maxHp=1e9;player.invincible=99;player.x=px;player.y=py;
   for(const e of ms){const q=prev.get(e),dt=time-q.t;if(dt>0){const d=Math.hypot(e.x-q.x,e.y-q.y);if(d>.5&&d/dt>6&&!e.r268Blink)fast++;}prev.set(e,{x:e.x,y:e.y,t:time});const A=e.attack||e.r61Action;if(A)acts.add(A.id??A);}
   if(time>t0+secs)r();else setTimeout(f,30);};f();});
  const s1=snap();const d={};for(const k in s0)d[k]=s1[k]-s0[k];
  return {zone:room.id,mobs:ms.map(e=>e.name),...d,fast,acts:acts.size,dist:ms.map(e=>+Math.hypot(e.x-px,e.y-py).toFixed(1)),ai:ms.map(e=>e.ai+'/'+(e.state||'')),game:+(time-t0).toFixed(1)};},[SECS]);}
const sum={off:{},on:{}};
const ORDER=process.env.ORDER||'offon';
for(const z of ZONES){let off,on;if(ORDER==='onoff'){on=await run(z,true);off=await run(z,false);}else{off=await run(z,false);on=await run(z,true);}console.log('끔',JSON.stringify(off));console.log('켬',JSON.stringify(on));
 if(on.none){ok(false,z+': 보스급 없음');continue;}
 for(const k of ['r52','r268','r114','r205','fast']){sum.off[k]=(sum.off[k]||0)+off[k];sum.on[k]=(sum.on[k]||0)+on[k];}
 ok(on.r52+on.r268+on.r114+on.r205===0,z+': 켬 보스 돌진 0',{r52:on.r52,r268:on.r268,r114:on.r114,r205:on.r205});ok(on.acts>0,z+': 켬 보스 공격은 그대로',on.acts);}
ok(sum.off.r52+sum.off.r268+sum.off.r114+sum.off.r205>0,'끔: 보스 돌진이 실제로 일어남(측정이 의미 있음)',sum.off);
ok(sum.on.fast<=Math.max(1,sum.off.fast*.25),'켬: 빠른 몸 이동이 크게 줄어듦',{on:sum.on.fast,off:sum.off.fast});
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));console.log(`R1333 boss browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
