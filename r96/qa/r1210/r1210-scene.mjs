// R1210 장면 찍기(헤드리스 소프트웨어 렌더 — 그래픽 검증 아님): 종류별 예고·발사 순간
//  실행: SW_URL=… SHOT=/tmp/dir node r96/qa/r1210/r1210-scene.mjs
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'/tmp';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
for(const [kind,name] of [['laser','프리즘 저격병'],['radiation','포낭 곡사체'],['sonic','펄스 척후병']]){
 await p.evaluate(async zone=>{const SM=__STORYWORLD_SAMONG_R103__,i=SM.episodes.findIndex(e=>e.key==='S-06');await SM.go(i,null,{zone});},'sz115-S06-1');
 await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
 await p.evaluate(name=>{auto=false;guide=false;player.invincible=1e9;const L=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss);L.forEach((e,i)=>{if(i<2){e.name=name;e.x=player.x+(i?3.2:-.5);e.y=player.y+(i?-2.6:4.4);e.speed=0;e.ai='melee';if(e.r1210){e.r1210.next=0;}}else{e.hp=0;e.spawnState='dead';}});},name);
 for(const [tag,cond] of [['windup',"s.mode==='windup'&&time-s.t0>s.windup*.6"],['fire',"window.__STORYWORLD_DYS_RANGED_R1210__.inspect().live>0&&(s.mode==='fire'||time-s.t0<(s.kind==='radiation'?1.2:.5))"]]){
  await p.waitForFunction(c=>room.enemies.some(e=>{const s=e.r1210;return s&&s.mode!==undefined&&eval(c);}),cond,{timeout:120000,polling:30}).catch(()=>console.log('timeout',kind,tag));
  await p.screenshot({path:`${SHOT}/r1210-${kind}-${tag}.png`});}
}
console.log('errs',errs.slice(0,3),await p.evaluate(()=>window.__STORYWORLD_DYS_RANGED_R1210__.inspect().stats));await b.close();
