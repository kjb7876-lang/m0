// 지역 진입 뒤 늦게 뜨는 서사 장면(cult04 등)은 기다리는 동안 넘긴다.
// R1346 헤드리스 브라우저 검사(GPU·실기기·손맛은 미검증): 시그니처 스킬이 실제 엔진에서 시전·그려지고, 공용 재해가 꺼지고, 오류가 없는지 + 장면 스크린샷.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1346_OUT||'/tmp/r1346-shots';fs.mkdirSync(OUT,{recursive:true});
const CASES=[['dist00','dist00-boss'],['last303','l303-boss'],['cult04','c104-boss'],['kair03','k103-boss'],['u203','u203-boss'],['last301','l301-boss']].filter(c=>!process.env.R1346_ONLY||c[0]===process.env.R1346_ONLY);
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));if(!c)fail++;};
const b=await chromium.launch();
for(const [zone,id] of CASES){const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await go(p,zone);
 const setup=await p.evaluate(id=>{const A=window.__STORYWORLD_BOSS_IDENTITY_R1346__;const e=room.enemies.find(x=>x.nativeId===id);
  if(!A||!e)return {A:!!A,boss:null,ids:room.enemies.filter(x=>x.boss||x.midboss).map(x=>x.nativeId)};
  room.engaged=true;e.spawnState='active';e.hidden=false;e.hp=e.maxHp;window.__h=[];hurt=function(d,s){window.__h.push([d,s&&s.r1346]);return 'hit';};
  e.x=player.x+3.2;e.y=player.y-1.2;e.speed=0;for(const m of room.enemies)if(m!==e)m.hp=0;
  window.__r330=JSON.stringify(window.__STORYWORLD_DISASTER_R330__?.inspect?.()?.stats?.byKind||{});
  return {boss:[e.name,e.nativeId,e.damage],spec:A.spec(e),cast:A.cast(e),r330allow:A.allow('disaster',e)};},id);
 ok(id+': 보스·API·시전',!!setup.boss&&setup.cast,setup);if(!setup.boss){await p.context().close();continue;}
 const t0=await p.evaluate(()=>time);
 for(const dt of [.35,.8,1.4]){await p.waitForFunction(([t0,dt])=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time>=t0+dt;},[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/r1346-${id}-${dt}.png`});}
 await p.waitForFunction(t0=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time>=t0+5;},t0,{timeout:240000});
 const r=await p.evaluate(()=>({ins:window.__STORYWORLD_BOSS_IDENTITY_R1346__.inspect(),h:window.__h,r330:JSON.stringify(window.__STORYWORLD_DISASTER_R330__?.inspect?.()?.stats?.byKind||{}),before:window.__r330}));
 ok(id+': 시트 그림 호출 20회 이상',r.ins.draws>20,r.ins);
 ok(id+': 피해 합 ≤ 보스 근접 1.4대 × 시전',r.h.filter(h=>h[1]===id).reduce((a,h)=>a+h[0],0)<=setup.boss[2]*1.4*r.ins.casts+1e-6,r.h);
 ok(id+': 공용 재해 끔(R330 시전 늘지 않음)',setup.r330allow===false&&r.r330===r.before,[r.before,r.r330]);
 ok(id+': 오류 없음',r.ins.errors===0&&!errs.length,[r.ins.lastError,errs]);
 await p.context().close();}
await b.close();console.log(fail?`R1346 browser: ${fail} failed`:'R1346 browser: all passed');process.exit(fail?1:0);
