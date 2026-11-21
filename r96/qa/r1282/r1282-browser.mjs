// R1282 브라우저 검사(헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 검증 아님). 실행: node r1282-browser.mjs <출력 폴더>  (서버 SW_URL, 기본 127.0.0.1:4410/m0/)
//  ① 실제 게임에 실림·감싸기가 맨 바깥(ego·hurt·pixelfx·DrawCommands push)
//  ② 영웅·형상별 F(EGO 진입): 영웅 둘레 땅 균열 명령 0, 영웅색 구름(r1282:cloud) 명령 있음(미카엘라는 R1041 원본 M3)
//  ③ 적 공격 적중(hurt) → 영웅 자리 반투명 검은 균열 명령 / 돌진 몹 적중 → 작은 회색 균열  ④ 장면 캡처  ⑤ 페이지 오류 0
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await go(p,'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__k=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*window.__k,...a);};player.hp=99999;for(const e of room.enemies){e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;}
 const t=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const rb=t.render;t.render=function(frame){try{if(Array.isArray(frame?.commands))window.__last=frame.commands.map(c=>({id:String(c.owner?.id||''),src:String(c.sourcePath||c.image?.src||''),a:c.style?.globalAlpha??c.globalAlpha,pts:c.points}));}catch(_){}return rb.apply(this,arguments);};});
await p.waitForTimeout(2500);
const api=await p.evaluate(()=>{const A=window.__STORYWORLD_EGO_CLOUD_R1282__;return {has:!!A,rev:A?.revision,ego:!!ego.__r1282,hurt:!!hurt.__r1282,fx:!!window.__STORYWORLD_PIXELFX_R163__?.__r1282,push:!!StoryPhase1.DrawCommands.prototype.push.__r1282};});
ok(api.has&&api.ego&&api.hurt&&api.fx&&api.push,'① 실림·맨 바깥 감싸기 '+JSON.stringify(api));
async function at(t){await p.evaluate(()=>{window.__k=1;});await p.waitForFunction(t=>{if(time>=t){window.__k=1e-4;return true;}return false;},t,{timeout:90000,polling:'raf'});await p.waitForTimeout(350);}
const FORMS=['slayer','hwando','michaela','lauren','neon','seoha','hunter','gunner','ego','persona'];
for(const f of FORMS){
 await p.evaluate(f=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;window.__k=1;try{E?.setForm?.(false);}catch(_){}player.egoSovereignR1046=false;player.personaHeroR1113=false;
  if(f==='ego'){player.hero='hwando';E?.unlock?.();try{E?.setForm?.(true);}catch(_){}player.egoSovereignR1046=true;}else if(f==='persona'){player.hero='lauren';player.personaHeroR1113=true;}else player.hero=f;
  player.ego=0;player.egoCD=0;player.samong=0;player.resonance=100;},f);
 await p.waitForTimeout(3000);
 const t0=await p.evaluate(()=>{window.__k=1;ego();return time;});
 const s0=await p.evaluate(()=>window.__STORYWORLD_EGO_CLOUD_R1282__.inspect().stats);
 let rup=0,cloud=0,m3=0,form='';
 for(const dt of [.15,.35,.8]){await at(t0+dt);const r=await p.evaluate(()=>{const L=window.__last||[];return {rup:L.filter(c=>/earth-rupture/.test(c.id)).length,cloud:L.filter(c=>/^r1282:cloud:/.test(c.src)).map(c=>c.src),m3:L.filter(c=>/fx-m3-michaela/.test(c.src)).length,form:window.__STORYWORLD_EGO_CLOUD_R1282__.formOf()};});
  rup+=r.rup;cloud+=r.cloud.length;m3+=r.m3;form=r.form;if(dt===.8)await p.screenshot({path:`${OUT}/f-${f}.png`,clip:{x:330,y:120,width:300,height:280}});}
 ok(rup===0,'② '+f+' F: 영웅 둘레 땅 균열 0 (명령 '+rup+')');
 if(f==='michaela')ok(m3>0&&cloud===0,'② michaela F: R1041 원본 구름 그대로 (m3 '+m3+')');
 else ok(cloud>0,'② '+f+' F: 영웅색 구름 명령 '+cloud+' (형상 '+form+')');
 await p.evaluate(()=>{window.__k=1;});await p.waitForFunction(t=>time>=t,t0+3.3,{timeout:120000});}
// ③ 적중
await p.evaluate(()=>{player.hero='slayer';player.egoSovereignR1046=false;player.personaHeroR1113=false;player.invincible=0;player.ego=0;});await p.waitForTimeout(1500);
for(const kind of ['normal','dash']){
 const r0=await p.evaluate(kind=>{const e=room.enemies.find(e=>e.hp>0)||{id:'x',x:player.x+1,y:player.y,hp:1};e.r286=e.r286||{};const m0=e.r286.mode;if(kind==='dash')e.r286.mode='dash';
  player.invincible=0;player.hp=99999;const s0=window.__STORYWORLD_EGO_CLOUD_R1282__.inspect().stats;window.__k=1;const before=player.hp;hurt(25,e);e.r286.mode=m0;return {t:time,hit:player.hp<before,s0};},kind);
 await at(r0.t+.3);const r=await p.evaluate(()=>{const L=window.__last||[];return {cmds:L.filter(c=>/earth-rupture/.test(c.id)).map(c=>c.a),stats:window.__STORYWORLD_EGO_CLOUD_R1282__.inspect().stats};});
 await p.screenshot({path:`${OUT}/hit-${kind}.png`,clip:{x:330,y:120,width:300,height:280}});
 const key=kind==='dash'?'dashHits':'hitShadows';
 ok(r0.hit&&r.stats[key]===r0.s0[key]+1&&r.cmds.length>0&&r.cmds.every(a=>a==null||a<=.75),'③ '+kind+' 적중 → 영웅 자리 반투명 균열 '+JSON.stringify({hit:r0.hit,n:r.cmds.length,alpha:r.cmds.slice(0,2),[key]:r.stats[key]}));
 await p.evaluate(()=>{window.__k=1;});await p.waitForTimeout(1500);}
ok(errs.length===0,'⑤ 페이지 오류 0 '+errs.join(' | '));
console.log(JSON.stringify({fails,method:'headless chromium software render'}));await b.close();process.exit(fails?1:0);
