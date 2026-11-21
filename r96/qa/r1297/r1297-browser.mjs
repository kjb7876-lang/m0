// R1297 브라우저 전후 촬영(헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 검증 아님).
//  실행: SW_URL=<게임 주소> node r1297-browser.mjs <출력 폴더> <접두어>   (전: 공개판 https://kjb7876-lang.github.io/m0/ , 후: 로컬 빌드)
//  ① F(EGO 진입) 뒤 .8초·1.6초 오라 명령(r111:ego-back) 겹 수·알파·합성  ② 슬레이어 평타 적중 이펙트 그리기 알파  ③ 장면 캡처  ④ 페이지 오류
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.',TAG=process.argv[3]||'x';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await go(p,'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__k=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*window.__k,...a);};player.hp=99999;
 const t=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const rb=t.render;t.render=function(frame){try{if(Array.isArray(frame?.commands))window.__last=frame.commands.map(c=>({id:String(c.owner?.id||''),src:String(c.sourcePath||''),a:c.style?.globalAlpha,op:c.style?.globalCompositeOperation}));}catch(_){}return rb.apply(this,arguments);};
 // 드로우 순간 ctx 알파 기록(적중 이펙트)
 const de=drawEffect;window.__hitA=[];drawEffect=function(e,...a){const r=de.call(this,e,...a);return r;};
 player.hero='slayer';player.ego=0;player.egoCD=0;player.resonance=100;
 const es=room.enemies.filter(e=>e.hp>0).slice(0,3);es.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.speed=0;e.x=player.x+1.1+i*.3;e.y=player.y+(i-1)*.5;});
 for(const e of room.enemies)if(!es.includes(e)){e.hp=0;}});
await p.waitForTimeout(2500);
// 오라 그림(R1039 sig-aura·R1286 구름)은 첫 EGO 때 읽기 시작하므로 한 번 켜서 읽힌 뒤 되돌린다(안 하면 '전'·'후' 모두 오라 그림 없이 찍힘)
await p.evaluate(()=>{ego();});await p.waitForTimeout(15000);await p.evaluate(()=>{player.ego=0;player.egoCD=0;});await p.waitForTimeout(1500);
async function at(t){await p.evaluate(()=>{window.__k=1;});await p.waitForFunction(t=>{if(time>=t){window.__k=1e-4;return true;}return false;},t,{timeout:120000,polling:'raf'});await p.waitForTimeout(400);}
const clip={x:300,y:90,width:360,height:330};
// ② 적중: 평타 적중 이펙트가 화면에 있는 순간을 찍는다
const hit=[];for(let i=0;i<4;i++){const t0=await p.evaluate(()=>{window.__k=1;return time;});await at(t0+.45);
 const r=await p.evaluate(()=>{const L=window.__last||[];const fx=effects.filter(e=>['burst','slash','e568HeroImpact','r912hit','heroHit'].includes(e.type)).map(e=>e.type);
  return {fx,lvl:window.__STORYWORLD_HIT_TRANSLUCENT_R1271__?.level?.()};});hit.push(r);await p.screenshot({path:`${OUT}/${TAG}-hit-${i}.png`,clip});}
console.log('HIT',JSON.stringify(hit));
// ① EGO 오라
const t0=await p.evaluate(()=>{window.__k=1;ego();return time;});const aura=[];
for(const dt of [.8,1.6]){await at(t0+dt);const r=await p.evaluate(()=>{const L=(window.__last||[]).filter(c=>c.id==='r111:ego-back'&&c.src&&/sig-aura|fx-m3|r1286:cloud/.test(c.src));return L.map(c=>({src:c.src.replace(/^.*\//,'').slice(0,40),a:+(+c.a).toFixed(3),op:c.op}));});
 aura.push({dt,layers:r.length,cmds:r});await p.screenshot({path:`${OUT}/${TAG}-aura-${dt}.png`,clip});}
console.log('AURA',JSON.stringify(aura));
console.log('ERRORS',errs.length,errs.join(' | '));await b.close();
