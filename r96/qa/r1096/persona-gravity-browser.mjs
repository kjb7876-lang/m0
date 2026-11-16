// R1096 헤드리스: 사몽 층 cult04 히든 페르소나 결전에서 '거울 천체' 3기(붉은 거울별·검은 우물별·자아 월식)가 예고→발동되는지,
//  자연 굴림이 나오는지, 오류가 없는지 본다. 스크린샷은 예고·발동 순간(헤드리스 소프트웨어 렌더 — 그래픽 검증 아님).
import {chromium,boot,skip} from '../r444/lib.mjs';
const OUT='r96/qa/r1096/';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>enterRegion('cult04',null,{layer:'DREAM',restore:true}));
await p.waitForFunction(()=>!loading&&room?.id==='cult04',null,{timeout:150000});await skip(p);
await p.evaluate(()=>{room.enemies=[];preparePersona3();});await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.persona);summon3([e],'persona');});
await p.waitForFunction(()=>room.encounterStage==='active',null,{timeout:120000});await skip(p);
const A='__STORYWORLD_PERSONA_GRAVITY_R1096__';
const info=await p.evaluate(A=>{const e=room.enemies.find(e=>e.persona);window.__P=e;return {damage:e.damage,hp:e.maxHp,heroMax:maxHP(),api:!!window[A],rev:window[A]?.revision,persona:window[A]?.inspect().persona};},A);
console.log('info',JSON.stringify(info));
// 자연 굴림 40초(게임 시간): 영웅 체력만 채움(무적 아님)
const T0=await p.evaluate(()=>time);let hpLog=[];
for(let k=0;k<10;k++){await p.evaluate(()=>{player.hp=maxHP();});await p.waitForFunction(t=>time>t,T0+4*(k+1),{timeout:300000});await skip(p);
 hpLog.push(await p.evaluate(A=>{const s=window[A].inspect();return {t:time|0,rolls:s.stats.rolls,procs:s.stats.procs,cast:s.stats.cast,hits:s.stats.hits,acts:s.acts.map(a=>a.kind+':'+a.phase),err:s.stats.errors+(s.stats.lastError?':'+s.stats.lastError:'')};},A));}
for(const h of hpLog)console.log('nat',JSON.stringify(h));
// 강제 시전 → 예고·발동 순간 스크린샷
for(const [k,w,l] of [['crimson',.45,1.05],['abyss',.45,1.3],['eclipse',.55,1.05]]){
 await p.evaluate(()=>{player.hp=maxHP();player.invincible=0;const e=__P;player.x=e.x+4.2;player.y=e.y+.6;projectiles.length=0;});
 if(k==='eclipse')await p.evaluate(A=>window[A].qaCombo(true),A);
 const r=await p.evaluate(([A,k])=>{for(const x of window[A].inspect().acts);return {k:window[A].qaForce(k),t:time};},[A,k]);
 await p.waitForFunction(t=>time>t,r.t+w,{timeout:120000});await p.evaluate(()=>{projectiles.length=0;});await p.screenshot({path:OUT+k+'-warn.png'});
 await p.waitForFunction(t=>time>t,r.t+l,{timeout:120000});await p.evaluate(()=>{projectiles.length=0;});await p.screenshot({path:OUT+k+'-live.png'});
 await p.waitForFunction(t=>time>t,r.t+3,{timeout:120000});
 console.log('force',k,JSON.stringify(await p.evaluate(A=>{const s=window[A].inspect();return {forced:true,hits:s.stats.hits,sheets:window[A].sheets(),draws:s.stats.draws,sheetDraws:s.stats.sheetDraws,err:s.stats.errors+':'+s.stats.lastError,heroHp:player.hp|0};},A)),'ok='+r.k);}
await b.close();
