// R1133 보스 '소환 중' 고정 검사(헤드리스 브라우저, 그래픽 검증 아님) — 2026-11-18 스토리 사몽(DREAM) ep1b05 실플레이 1/2판:
//  중간보스를 잡고 제단으로 보스 소환을 시작한 뒤(단계 summoning) 남은 필드 잡몹이 죽으면 엔진 advanceFieldWave6 이 단계를 fieldReady 로 덮었다.
//  소환 완료 처리는 단계 summoning 에서만 돌아 보스가 spawnState 'summoning' 에 600초 넘게 갇혔다(길잡이 '소환의 실체화 기다리기').
// 검사: ① 소환 중 마지막 잡몹 처치 뒤에도 단계 summoning ② 보스가 깨어나 active ③ 결전(active) 중 잡몹 처치 뒤에도 active ④ 보스 처치 뒤 진행 ⑤ 페이지 오류 0
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
const S=()=>p.evaluate(()=>({stage:room.encounterStage,enc:room.activeEncounter||null,alive:room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss).length,boss:room.enemies.filter(e=>e.boss).map(e=>Math.round(e.hp)+':'+e.spawnState)}));
const ticks=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tick(.05);},n);
const ZONE=process.env.ZONE||'ep1b05';
await go(ZONE,'DREAM');
await p.evaluate(()=>{player.invincible=99999;player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await ticks(40);await skip();
// 잡몹을 한 마리만 남긴다(소환 중에 그 마지막 한 마리를 잡는다).
await p.evaluate(()=>{const rows=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss);for(const e of rows.slice(1)){e.hp=0;e.spawnState='active';killEnemy(e);}});await ticks(20);
await killWhere(e=>e.midboss);await skip();await ticks(80);await skip();
const s0=await S();
await p.evaluate(()=>{player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await ticks(4);
const s1=await S();
await p.evaluate(()=>{for(const e of room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss)){e.hp=0;e.spawnState='active';killEnemy(e);}});await ticks(2);
const s2=await S();
ok(s0.alive===1&&s1.stage==='summoning'&&s2.stage==='summoning','① 보스 소환 중 마지막 필드 잡몹을 잡아도 단계 summoning 유지',{ready:s0,summon:s1,afterKill:s2});
await ticks(400);await skip();const s3=await S();
ok(s3.boss.some(b=>/:active$/.test(b))&&s3.stage==='active','② 소환이 끝나 보스가 깨어난다(spawnState active, 단계 active)',s3);
await p.evaluate(()=>{const z=room.enemies.find(e=>!e.boss&&!e.midboss);if(z){z.hp=0;z.deadRecorded=false;z.spawnState='active';killEnemy(z);}});await ticks(2);
const s4=await S();ok(s4.stage==='active','③ 보스 결전 중 잡몹이 죽어도 단계 active 유지',s4);
await killWhere(e=>e.boss);await skip();await ticks(120);await skip();const s5=await S();
ok(s5.boss.every(b=>/^0:/.test(b))&&!['field','fieldReady','summoning'].includes(s5.stage),'④ 보스 처치 뒤 진행',s5);
ok(errs.length===0,'⑤ 페이지 오류 0',errs.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
