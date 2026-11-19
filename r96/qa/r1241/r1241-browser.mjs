// R1241 헤드리스 브라우저 검사(그래픽 GPU·실기기·손맛은 미검증): 솔로몬의 봉인식(ep1b01) 보스방에서 실제 엔진으로
//  제72문 보스가 '72 그림자 소환'을 시전 → 6파×12=72 솟음, 그림자·인장 시트가 실제로 그려짐, 오류 없음, 장면 스크린샷.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.R1241_OUT||'/tmp/r1241-shots';import fs from 'node:fs';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));if(!c)fail++;};
await go(p,'ep1b01');
const setup=await p.evaluate(()=>{const A=window.__STORYWORLD_BOSS72_SHADOWS_R1241__;const e=room.enemies.find(x=>A&&A.isBoss(x));if(!A||!e)return {A:!!A,boss:null,names:room.enemies.filter(x=>x.boss).map(x=>[x.name,x.nativeId])};
 room.engaged=true;e.spawnState='active';e.hp=e.maxHp;window.__r1241hurt=[];const H=hurt;window.hurt=undefined;
 hurt=function(d,s){window.__r1241hurt.push([d,s&&s.r1241]);return 'hit';};
 e.spawnState='active';e.x=player.x+2.5;e.y=player.y-1.5;e.speed0=e.speed;for(const m of room.enemies)if(m!==e)m.hp=0;
 window.__r1241imgs={};const C=ctx;const di=C.drawImage.bind(C);
 return {boss:[e.name,e.nativeId,e.damage],cast:A.cast(true)};});
ok('보스방에 제72문 보스·API 있음',!!setup.boss&&setup.cast,setup);
const shots=[[1.1,'a-seal'],[2.4,'b-wave2'],[4.2,'c-wave3-4'],[6.4,'d-wave5-6'],[8.2,'e-sink']];
const t0=await p.evaluate(()=>time);
for(const [dt,n] of shots){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/r1241-${n}.png`});}
await p.waitForFunction(t0=>time>=t0+9.6,t0,{timeout:240000});
const r=await p.evaluate(()=>({ins:window.__STORYWORLD_BOSS72_SHADOWS_R1241__.inspect(),hurt:window.__r1241hurt,cmds:null}));
ok('72개 모두 솟음(6파)',r.ins.spawned===72&&r.ins.wavesDone===6,{s:r.ins.spawned,w:r.ins.wavesDone});
ok('실제로 그려짐(시트 호출)',r.ins.drawn>200,r.ins.drawn);
ok('시전 끝나고 정리',!r.ins.casting&&r.ins.live===0,r.ins);
ok('그림자 피해 합 ≤ 보스 근접 1.4대',r.hurt.filter(h=>h[1]==='shadow').reduce((a,h)=>a+h[0],0)<=setup.boss[2]*1.4+1e-6,r.hurt);
ok('R1241 오류 없음',r.ins.errors===0,r.ins.lastError);
await b.close();console.log(fail?`R1241 browser: ${fail} failed`:'R1241 browser: all passed');process.exit(fail?1:0);
