// 단계 되돌아감 검사(헤드리스 브라우저, 그래픽 검증 아님) — 2026-11-18 스토리 사몽(DREAM) 실플레이에서 재현:
//  dist02 DREAM 에서 중간보스를 먼저 쓰러뜨려 단계가 'complete' 가 된 뒤 남은 필드 잡몹을 잡으면 엔진 advanceFieldWave6 이 단계를 'fieldReady' 로 덮었다.
//  (bossReady 에서 잡아도 'field' 로 되돌아감.) 그러면 길잡이가 출구(door-2 너머 포탈) 대신 제단으로 되돌아가 '기억의 기록' 창만 열고 멈췄다(게임 시간 90초 넘게).
// 검사: ① 중간보스 처치 뒤 bossReady → 제단 → 'complete' ①b bossReady 에서 남은 잡몹을 잡아도 bossReady 유지 ② 남은 잡몹을 다 잡아도 'complete' 유지 ③ 보스 전(필드 단계)에서 마지막 잡몹을 잡으면 원래대로 'fieldReady'(회귀) ④ 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click().catch(()=>{});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<300&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async(id,L)=>{await p.evaluate(async([id,L])=>{await enterRegion(id,null,{layer:L,restore:true});},[id,L]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await p.waitForTimeout(500);await skip();};
const killWhere=f=>p.evaluate(src=>{const pick=new Function('e','return ('+src+')(e)');for(let k=0;k<20;k++){const rows=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&pick(e));if(!rows.length)break;for(const e of rows){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}return room.encounterStage;},String(f));
const S=()=>p.evaluate(()=>({stage:room.encounterStage,alive:room.enemies.filter(e=>e.hp>0&&!e.deadRecorded).length,mid:room.enemies.filter(e=>e.midboss).map(e=>Math.round(e.hp)+':'+e.spawnState)}));
// ①②
await go('dist02','DREAM');
await p.evaluate(()=>{player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await p.evaluate(()=>{for(let i=0;i<40;i++)tick(.05);});await skip();
const s0=await S();
await killWhere(e=>e.midboss||e.boss);await skip();await p.evaluate(()=>{for(let i=0;i<120;i++)tick(.05);});await skip();
const s1=await S();await p.evaluate(()=>{player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await p.evaluate(()=>{for(let i=0;i<60;i++)tick(.05);});await skip();
const s1b=await S();ok(s1.stage==='bossReady'&&s1b.stage==='complete','① 중간보스를 먼저 잡으면 bossReady → 제단 상호작용 → complete',{before:s0,mid:s1,after:s1b});
await killWhere(e=>!e.boss&&!e.midboss);await skip();await p.evaluate(()=>{for(let i=0;i<60;i++)tick(.05);});
const s2=await S();ok(s2.stage==='complete'&&s2.alive===0,'② 남은 필드 잡몹을 다 잡아도 complete 유지(fieldReady 로 되돌아가지 않음)',s2);
// ①b bossReady 단계에서 잡몹 처치
await go('dist01','DREAM');await p.evaluate(()=>{player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await p.evaluate(()=>{for(let i=0;i<40;i++)tick(.05);});await skip();
await killWhere(e=>e.midboss||e.boss);await skip();await p.evaluate(()=>{for(let i=0;i<60;i++)tick(.05);});await skip();const b0=await S();
await killWhere(e=>!e.boss&&!e.midboss);await skip();const b1=await S();ok(b0.stage==='bossReady'&&b1.stage==='bossReady','①b bossReady 에서 남은 잡몹을 다 잡아도 bossReady 유지',{before:b0,after:b1});
// ③ 회귀: 보스 전 필드 단계에서 마지막 잡몹 → fieldReady
await go('dist03','DREAM');const f0=await S();
await killWhere(e=>!e.boss&&!e.midboss);await p.evaluate(()=>{for(let i=0;i<60;i++)tick(.05);});
const f1=await S();ok(f0.stage==='field'&&f1.stage==='fieldReady','③ 보스 전 필드 단계는 그대로(마지막 잡몹 → fieldReady)',{before:f0,after:f1});
ok(errs.length===0,'④ 페이지 오류 0',errs.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
