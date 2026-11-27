// R1358 헤드리스 브라우저 검사(GPU·실기기·손맛 미검증): 중간보스·상위수문장 고유 스킬이 실제 엔진에서 시전·그려지고,
//  맞으면 보스 낙인(초당 최대 체력 6%)이 걸리고, 공명 방어(D 키)를 누르면 바로 풀리는지 + 스크린샷.
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1358_OUT||'/tmp/r1358-shots';fs.mkdirSync(OUT,{recursive:true});
const CASES=[['dist01','mb-dist01'],['ep1a11','mb-ep1a11'],['u205','u205-mid'],['kair07','kair-elite-53'],['ep1a09','mb-ep1a09'],['cult06','c106-mid'],['ep1a08','mb-ep1a08s'],['last303','l303-boss'],['dist00','dist00-boss'],['kair03','k103-boss'],['hando03','h103-boss'],['dist04','mb-dist04'],['ep1a08','mb-ep1a08'],['ep1b07','mb-ep1b07'],['u203','u203-mid'],['hando01','mb-hando01'],['hando03','mb-hando03']].filter(c=>!process.env.R1358_ONLY||c[0]===process.env.R1358_ONLY);
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));if(!c)fail++;};
const skipIn='for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);';
const b=await chromium.launch();
for(const [zone,id] of CASES){const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await go(p,zone);
 const setup=await p.evaluate(id=>{const A=window.__STORYWORLD_BOSS_IDENTITY_R1346__,U=window.__STORYWORLD_BOSS_UNIQUE_R1358__;const e=room.enemies.find(x=>A.spec(x)?.id===id);
  if(!A||!U||!e)return {A:!!A,U:!!U,boss:null,ids:room.enemies.filter(x=>x.boss||x.midboss||/elite/.test(x.nativeId||'')).map(x=>x.nativeId)};
  room.engaged=true;e.spawnState='active';e.hidden=false;e.hp=e.maxHp;e.x=player.x+3.2;e.y=player.y-1.2;e.speed=0;for(const m of room.enemies)if(m!==e)m.hp=0;
  player.hp=maxHP();window.__mh=maxHP();return {boss:[e.name,e.nativeId],sig:A.spec(e).sig,cast:A.cast(e)};},id);
 ok(id+': 고유 스킬 시전',!!setup.boss&&setup.cast&&setup.sig&&(setup.sig.temp===true||setup.sig.dots===true),setup);if(!setup.boss){await p.context().close();continue;}
 const t0=await p.evaluate(()=>time);
 for(const dt of [.35,.8]){await p.waitForFunction(new Function('a','const [t0,dt]=a;'+skipIn+'return time>=t0+dt;'),[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/r1358-${id}-${dt}.png`});}
 await p.waitForFunction(new Function('t0',skipIn+'return time>=t0+2.5||!!window.__STORYWORLD_BOSS_UNIQUE_R1358__.state();'),t0,{timeout:240000});
 // 엔진 시전이 영웅을 못 맞혔으면(헤드리스에서 자리 어긋남) 그 시그니처의 실제 hurt 경로로 직접 맞힌다
 const hit=await p.evaluate(id=>{const U=window.__STORYWORLD_BOSS_UNIQUE_R1358__;if(U.state())return 'engine';player.invincible=0;const e=room.enemies.find(x=>window.__STORYWORLD_BOSS_IDENTITY_R1346__.spec(x)?.id===id);const r=hurt(5,{r1346:id,source:e,enemy:e,kind:'r1346-signature'});return 'manual:'+r;},id);
 const s1=await p.evaluate(()=>({st:window.__STORYWORLD_BOSS_UNIQUE_R1358__.state(),hp:player.hp,t:time,d:window.__STORYWORLD_BOSS_UNIQUE_R1358__.inspect().damage}));
 ok(id+': 보스 낙인 걸림',!!s1.st,[hit,s1]);
 await p.waitForFunction(new Function('t',skipIn+'return time>=t+1;'),s1.t,{timeout:240000});
 const s2=await p.evaluate(()=>({st:window.__STORYWORLD_BOSS_UNIQUE_R1358__.state(),hp:player.hp,t:time,m:maxHP(),d:window.__STORYWORLD_BOSS_UNIQUE_R1358__.inspect().damage}));
 // 체력은 보스 직접 타격·R53 상처로도 줄므로 낙인 피해 누계로 잰다
 const lost=(s2.d-s1.d)/s2.m/(s2.t-s1.t);ok(id+': 게임 1초에 최대 체력 약 6%',lost>.05&&lost<.07,{lost,s1,s2});
 await p.screenshot({path:`${OUT}/r1358-${id}-mark.png`});
 await p.keyboard.down('d');await p.waitForFunction(new Function(skipIn+'return !window.__STORYWORLD_BOSS_UNIQUE_R1358__.state();'),null,{timeout:60000}).catch(()=>{});await p.keyboard.up('d');
 const s3=await p.evaluate(()=>({st:window.__STORYWORLD_BOSS_UNIQUE_R1358__.state(),ins:window.__STORYWORLD_BOSS_UNIQUE_R1358__.inspect(),hp:player.hp,t:time}));
 ok(id+': D(공명 방어)로 바로 풀림',!s3.st&&s3.ins.cleansed>=1,s3);
 await p.waitForFunction(new Function('t',skipIn+'return time>=t+1;'),s3.t,{timeout:240000});
 // 체력은 보스 직접 타격·R53 상처(맞은 타격의 나눠 받는 몫)로도 줄 수 있으므로, 낙인이 준 피해 누계로 잰다
 const s4=await p.evaluate(()=>({d:window.__STORYWORLD_BOSS_UNIQUE_R1358__.inspect().damage,st:window.__STORYWORLD_BOSS_UNIQUE_R1358__.state()}));ok(id+': 풀린 뒤 낙인 피해 없음(다시 맞지 않았으면)',s4.st||Math.abs(s4.d-s3.ins.damage)<1e-9,[s3.ins.damage,s4]);
 const ins=await p.evaluate(()=>[window.__STORYWORLD_BOSS_IDENTITY_R1346__.inspect(),window.__STORYWORLD_BOSS_UNIQUE_R1358__.inspect()]);
 ok(id+': 그림 호출·오류 없음',ins[0].draws>10&&ins[0].errors===0&&ins[1].errors===0&&!errs.length,[ins,errs]);
 await p.context().close();}
await b.close();console.log(fail?`R1358 browser: ${fail} failed`:'R1358 browser: all passed');process.exit(fail?1:0);
