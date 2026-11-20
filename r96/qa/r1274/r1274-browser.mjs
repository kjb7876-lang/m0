// R1274 헤드리스 브라우저 검사(GPU·실기기·손맛은 미검증): 색욕 보스방(ep1b05)에서 실제 엔진으로
//  ① 서윤 자기 조명 → 버프(받는 피해 ↓) ② 영웅 조명 → 디버프(받는 피해 ↑·둔화) ③ 공격 그림이 좌우반전본으로 읽힘 + 장면 스크린샷.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1274_OUT||'/tmp/r1274-shots';fs.mkdirSync(OUT,{recursive:true});
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:process.env.NOMIR?{'storyworld.r1274.spotlight':'{"mirror":false}'}:null});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'ep1b05');
const setup=await p.evaluate(()=>{const A=window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__;const e=room.enemies.find(x=>A&&A.which(x)==='seoyun');
 if(!A||!e)return {A:!!A,boss:null};room.engaged=true;e.spawnState='active';e.hp=e.maxHp;e.x=player.x+3;e.y=player.y-1;e.speed=0;for(const m of room.enemies)if(m!==e)m.hp=0;
 window.__R1263=window.__STORYWORLD_SIN_SKILLS_R1263__;window.__R1263?.set?.({on:false});window.__STORYWORLD_KISS_R1042__?.set?.({on:false});
 window.__h=[];const base=hurt;hurt=function(d,s){window.__h.push(d);return 'hit';};
 return {boss:[e.name,e.hp],cast:A.cast('self'),url:urlFor('assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp')};});
ok('서윤·API 있음',!!setup.boss&&setup.cast,setup);if(!process.env.NOMIR)ok('공격 그림 주소 → 좌우반전본',/r1274\/lust-human-attack-mirror\.webp/.test(setup.url),setup.url);
const t0=await p.evaluate(()=>time);
for(const dt of [.3,1.2,3.5]){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/self-${dt}.png`});}
const r1=await p.evaluate(()=>{const A=window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__,e=room.enemies.find(x=>A.which(x)==='seoyun');const i=A.inspect();const h0=e.hp;e.hp-=1000;return {i,h0,e};});
await p.waitForFunction(t=>time>=t+.1,await p.evaluate(()=>time),{timeout:60000});
const r1b=await p.evaluate(()=>{const A=window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__,e=room.enemies.find(x=>A.which(x)==='seoyun');return {hp:e.hp,ins:A.inspect()};});
ok('자기 조명: 버프 걸림',r1.i.buff>0,r1.i);ok('버프 중 피해 1000 → 750',Math.abs((r1.h0-r1b.hp)-750)<1,{h0:r1.h0,hp:r1b.hp});
await p.evaluate(()=>{window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__.cast('hero');});const t1=await p.evaluate(()=>time);
for(const dt of [.2,.6,1.2,2.5]){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t1,dt],{timeout:240000});await p.screenshot({path:`${OUT}/hero-${dt}.png`});}
const r2=await p.evaluate(()=>({ins:window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__.inspect(),slow:player.heroSlowUntil150-time}));
ok('영웅 조명: 디버프 걸림',r2.ins.debuff>0,r2);
ok('시트 그림 호출 30회 이상',r2.ins.drawn>30,r2.ins.drawn);ok('오류 없음',r2.ins.errors===0&&!errs.length,[r2.ins.lastError,errs]);
// 공격 그림: 영웅 오른쪽·왼쪽에서 근접 공격을 걸어 장면을 찍는다
for(const side of ['heroRight','heroLeft']){await p.evaluate(side=>{const A=window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__;A.set({on:false});const e=room.enemies.find(x=>A.which(x)==='seoyun');
  const dx=side==='heroRight'?-1.6:1.6;e.x=player.x+dx;e.y=player.y-dx;e.attack=null;e.cooldown=0;e.attackCD=0;},side);
 const tt=await p.evaluate(()=>time);let got=false;
 try{await p.waitForFunction(()=>{const e=room.enemies.find(x=>x.nativeId==='b05-boss');return !!e.attack;},null,{timeout:120000});got=true;}catch(_){}
 await p.waitForFunction(t=>time>=t+.25,await p.evaluate(()=>time),{timeout:120000});await p.screenshot({path:`${OUT}/attack-${side}${process.env.NOMIR?'-orig':''}.png`});
 const st=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='b05-boss');return {atk:!!e.attack,left:window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e),ex:e.x,ey:e.y,px:player.x,py:player.y,path:e.path};});
 console.log('ATTACK',side,got,JSON.stringify(st));}
const m=await p.evaluate(()=>window.__STORYWORLD_SEOYUN_SPOTLIGHT_R1274__.inspect().mirrored||0);console.log('mirrored url calls',m);
await b.close();console.log(fail?`R1274 browser: ${fail} failed`:'R1274 browser: all passed');process.exit(fail?1:0);
