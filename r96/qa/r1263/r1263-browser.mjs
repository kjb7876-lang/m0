// R1263 헤드리스 브라우저 검사(GPU·실기기·손맛은 미검증): 7대죄 보스방 4곳에서 실제 엔진으로 서사 스킬 시전 →
//  시트가 실제로 그려짐, 피해 합 상한, 오류 없음, 장면 스크린샷.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1263_OUT||'/tmp/r1263-shots';fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.env.R1263_ONLY;
const CASES=[['gluttony','ep1b04',[.5,1.3,2.3]],['lust','ep1b05',[.55,1.2,2.0]],['wrath','ep1b07',[.45,1.2,2.1,2.9]],['boot','ep1b09',[.75,1.5,2.2]],['greed','ep1b06',[.9,1.5,2.1]]].filter(c=>!ONLY||c[0]===ONLY);
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));if(!c)fail++;};
const b=await chromium.launch();
for(const [k,zone,shots] of CASES){const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await go(p,zone);
 const setup=await p.evaluate(k=>{const A=window.__STORYWORLD_SIN_SKILLS_R1263__;const e=room.enemies.find(x=>A&&A.which(x)===k);
  if(!A||!e)return {A:!!A,boss:null,names:room.enemies.filter(x=>x.boss).map(x=>[x.name,x.nativeId])};
  room.engaged=true;e.spawnState='active';e.hp=e.maxHp;window.__h=[];hurt=function(d,s){window.__h.push([d,s&&s.r1263,s&&s.r1263part]);return 'hit';};
  e.x=player.x+3.2;e.y=player.y-1.2;e.speed=0;for(const m of room.enemies)if(m!==e)m.hp=0;
  return {boss:[e.name,e.nativeId,e.damage],cast:A.cast(true)};},k);
 ok(k+': 보스·API 있음',!!setup.boss&&setup.cast,setup);if(!setup.boss){await p.context().close();continue;}
 const t0=await p.evaluate(()=>time);
 for(const dt of shots){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/r1263-${k}-${dt}.png`});}
 await p.waitForFunction(t0=>time>=t0+6,t0,{timeout:240000});
 const r=await p.evaluate(()=>({ins:window.__STORYWORLD_SIN_SKILLS_R1263__.inspect(),h:window.__h}));
 ok(k+': 시전 1회 이상·끝나고 정리',r.ins.casts>=1,r.ins);ok(k+': 시트 그림 호출 30회 이상',r.ins.drawn>30,r.ins.drawn);
 ok(k+': 피해 합 ≤ 보스 근접 1.4대 × 시전 수',r.h.filter(h=>h[1]===k).reduce((a,h)=>a+h[0],0)<=setup.boss[2]*1.4*r.ins.casts+1e-6,r.h);
 ok(k+': 오류 없음',r.ins.errors===0&&!errs.length,[r.ins.lastError,errs]);console.log(k,'맞은 부위',JSON.stringify(r.h.map(h=>h[2])));
 await p.context().close();}
await b.close();console.log(fail?`R1263 browser: ${fail} failed`:'R1263 browser: all passed');process.exit(fail?1:0);
