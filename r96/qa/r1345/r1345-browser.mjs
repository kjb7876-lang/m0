// R1345 헤드리스 브라우저 검사(GPU·실기기·손맛은 미검증): 탐식의 주방 보스방(ep1b04)에서 실제 엔진으로 '위장의 꿈틀거림' 시전 →
//  시트가 실제로 그려짐, 주름이 보스방 틀 전역에 퍼짐, 피해 합 상한, 오류 없음, 장면 스크린샷·GIF 프레임.
//  R1345_3D=1 이면 탐식 보스 3D 설정을 켜고 같은 검사. R1345_FRAMES=1 이면 0.1초(게임 시간)마다 프레임 저장(GIF 용).
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1345_OUT||'/tmp/r1345-shots';fs.mkdirSync(OUT,{recursive:true});
const FR=!!process.env.R1345_FRAMES,TAG=process.env.R1345_3D?'3d':'2d';
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));if(!c)fail++;};
const b=await chromium.launch();
const init=process.env.R1345_3D?{'storyworld.r1315.mob':'on'}:null;
const {p}=await boot(b,{vp:{width:960,height:540},init});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'ep1b04');
// 실제 보스전 흐름(R1258 boss-fight 방식): 필드 정리 → 목표 → 중간보스 → 보스 문 → 보스방 가운데
await p.evaluate(()=>{for(let k=0;k<20;k++){const r=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss);if(!r.length)break;for(const e of r){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}if(room.objective){player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();}});await skip(p);
await p.evaluate(()=>{for(let i=0;i<40;i++)tick(.05);});await skip(p);
await p.evaluate(()=>{for(const e of room.enemies.filter(e=>(e.midboss)&&e.hp>0&&e.spawnState==='active')){e.hp=0;killEnemy(e);}for(let i=0;i<60;i++)tick(.05);});await skip(p);
await p.evaluate(()=>{const X=room.exploration,d=(X.worldR74?.doors||[]).find(d=>d.id===X.bossDoorId);if(d){player.x=d.x+.6;player.y=d.y+.6;interact();}});await skip(p);await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const b=room.exploration.worldWardR81?.bossBounds;if(b){player.x=(b[0]+b[2])/2;player.y=(b[1]+b[3])/2;}for(let i=0;i<10;i++)tick(.05);});await skip(p);
const setup=await p.evaluate(()=>{const A=window.__STORYWORLD_GUT_WRITHE_R1345__;const e=room.enemies.find(x=>A&&A.which(x));
 if(!A||!e)return {A:!!A,boss:null,names:room.enemies.filter(x=>x.boss).map(x=>[x.name,x.nativeId])};
 const bb=room.exploration?.worldWardR81?.bossBounds;
 room.engaged=true;e.spawnState='active';e.hp=e.maxHp;window.__h=[];hurt=function(d,s){window.__h.push([d,s&&s.r1345,s&&s.kind]);return 'hit';};
 window.__STORYWORLD_SIN_SKILLS_R1263__?.set?.({on:false});
 e.speed=0;e.x=player.x+3.2;e.y=player.y-1.2;window.__pin=[player.x,player.y];
 return {boss:[e.name,e.nativeId,e.damage,e.spawnState],bb,stage:room.encounterStage,p:[player.x,player.y],cast:A.cast(true)};});
ok('보스·API·보스방 틀 있음',!!setup.boss&&setup.cast,setup);
if(setup.boss){const t0=await p.evaluate(()=>time);const ins0=await p.evaluate(()=>window.__STORYWORLD_GUT_WRITHE_R1345__.inspect());
 const bb=ins0.bounds,xs=ins0.folds.map(f=>f.x),ys=ins0.folds.map(f=>f.y);
 ok('주름 16개 이상이 보스방 전역(가로·세로 60% 이상)',ins0.folds.length>=16&&Math.max(...xs)-Math.min(...xs)>=.6*(bb[2]-bb[0])&&Math.max(...ys)-Math.min(...ys)>=.6*(bb[3]-bb[1]),{n:ins0.folds.length,bb});
 ok('위벽 8곳 이상',ins0.walls.length>=8,ins0.walls.length);
 if(FR){/* 게임 시간을 거의 멈추고(R444 scene4 방식) 0.1초씩 손으로 tick 해서 찍는다 — 헤드리스 렌더가 느려도 프레임 간격이 일정 */
  await p.evaluate(()=>{window.__SLOW=1e-4;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});await p.waitForTimeout(300);
  for(let i=0;i<=48;i++){await p.evaluate(()=>{window.__SLOW=1;for(let k=0;k<4;k++)tick(.025);window.__SLOW=1e-4;});await p.waitForTimeout(250);await p.screenshot({path:`${OUT}/f-${TAG}-${String(i).padStart(3,'0')}.png`});}
  await p.evaluate(()=>{window.__SLOW=1;});}
 else for(const dt of [.5,1.3,1.9,2.6,3.3]){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t0,dt],{timeout:240000});await p.screenshot({path:`${OUT}/r1345-${TAG}-${dt}.png`});}
 await p.waitForFunction(t0=>time>=t0+6,t0,{timeout:300000});
 const r=await p.evaluate(()=>({ins:window.__STORYWORLD_GUT_WRITHE_R1345__.inspect(),h:window.__h}));
 ok('시전 1회 이상·끝나고 정리',r.ins.casts>=1&&!r.ins.casting,{casts:r.ins.casts,casting:r.ins.casting});ok('시트 그림 호출 100회 이상',r.ins.drawn>100,r.ins.drawn);
 const mine=r.h.filter(h=>h[1]==='gut');ok('서 있는 영웅 맞음·피해 합 ≤ 1.0대 × 시전 수',mine.length>=1&&mine.reduce((a,h)=>a+h[0],0)<=setup.boss[2]*1.0*r.ins.casts+1e-6,mine);
 ok('오류 없음',r.ins.errors===0&&!errs.length,[r.ins.lastError,errs]);}
await b.close();console.log(fail?`R1345 browser(${TAG}): ${fail} failed`:`R1345 browser(${TAG}): all passed`);process.exit(fail?1:0);
