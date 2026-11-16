// R1114 교주 사몽(cult04 DREAM) 시련 보스 6마리 동시 소환 — 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-16 11:26Z "교주사몽 지금 보스6마리 차례차례소환하잖아 이거 한번에 6마리 소환하게 해줘".
//  실행: SW_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1114/r1114-browser.mjs
//  ① 제단에서 소환하면 시련 보스 6마리가 한꺼번에 실체화(기존: 1마리씩 6번)
//  ② 서로 4칸 이상 떨어지고 전부 걸을 수 있는 자리(벽·기둥 속 아님), 좌표 NaN 없음, 플레이어 시작 지점에서도 떨어짐
//  ③ 5마리 잡아도 전투가 계속되고 6마리를 다 잡아야 페르소나 결전 준비(personaReady)로 넘어감
//  ④ 6마리가 떠 있어도 한 걸음 계산이 한 마리일 때의 몇 배 이하(렉 점검, 헤드리스 상대 비교) · 저장 오류 0 · 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const T=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t,t0+s,{timeout:s*60000+60000}).catch(()=>{});};
await p.evaluate(async()=>{await enterRegion('cult04',null,{layer:'DREAM',restore:true});});await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await T(1);
// 소환 준비: 침식체 3 · 영웅을 제단 곁에
await p.evaluate(()=>{room.enemies=room.enemies.filter(e=>e.boss&&e.midboss);room.minionKills=3;room.encounterStage='field';player.hp=player.maxHp=9e8;player.invincible=1e9;player.x=room.objective.x;player.y=room.objective.y+1.2;});
// 한 마리 기준 걸음 비용(보스 없을 때)
const cost=()=>p.evaluate(()=>{const t=performance.now();for(let i=0;i<30;i++)tick(1/60);return (performance.now()-t)/30;});
const c0=await cost();
// 소환 직후(아직 움직이기 전)의 자리를 먼저 본다
const P0=await p.evaluate(()=>{interact();const bs=room.enemies.filter(e=>e.trial&&e.hp>0);const pts=bs.map(e=>({x:e.x,y:e.y,blocked:blocked(e.x,e.y,.2,room)}));let minD=1e9;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)minD=Math.min(minD,Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y));return {pts,minD,pd:Math.min(...pts.map(q=>Math.hypot(q.x-player.x,q.y-player.y)))};});
await T(2.5);await skip();
const S=await p.evaluate(()=>{const bs=room.enemies.filter(e=>e.trial&&e.hp>0);
 const pts=bs.map(e=>({id:e.id,name:e.name,x:e.x,y:e.y,st:e.spawnState,blocked:blocked(e.x,e.y,.2,room)}));
 let minD=1e9;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)minD=Math.min(minD,Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y));
 const pd=Math.min(...pts.map(q=>Math.hypot(q.x-player.x,q.y-player.y)));
 return {count:bs.length,pts,minD,pd,stage:room.encounterStage,act:room.activeEncounter,idx:room.trialIndex,engaged:room.engaged};});
ok(S.count===6,'시련 보스 6마리가 한꺼번에 있음(기존 1마리)',{count:S.count,stage:S.stage,act:S.act});
ok(S.count===6&&S.pts.every(q=>q.st==='active'),'6마리 모두 실체화(active)',S.pts.map(q=>q.st));
ok(S.count===6&&new Set(S.pts.map(q=>q.id)).size===6,'6마리 id 서로 다름',S.pts.map(q=>q.id));
ok(P0.pts.length===6&&P0.pts.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&!q.blocked),'소환 자리: 좌표 NaN 없음 · 벽·기둥 속 아님',P0.pts.map(q=>[+q.x.toFixed(1),+q.y.toFixed(1),q.blocked]));
ok(P0.pts.length===6&&P0.minD>=4,'소환 자리: 서로 4칸 이상 떨어짐(겹침 없음)',{minD:P0.minD});
ok(P0.pts.length===6&&P0.pd>=4,'소환 자리: 영웅 곁에 바로 붙지 않음(4칸 이상)',{pd:P0.pd});
const c6=await cost();
ok(c6<Math.max(c0*8,c0+25),'6마리 한 걸음 비용 한 마리 대비 폭증 없음(헤드리스 ms)',{c0:+c0.toFixed(2),c6:+c6.toFixed(2)});
// 저장 오류 없음
const sv=await p.evaluate(()=>{try{saveGame(false);return 'ok';}catch(e){return String(e).slice(0,120);}});ok(sv==='ok','전투 중 저장 오류 없음',sv);
// 5마리 잡기
await p.evaluate(()=>{const bs=room.enemies.filter(e=>e.trial&&e.hp>0).slice(0,5);for(const e of bs){try{hitEnemy(e,e.hp+1);}catch(_){e.hp=0;}}});await T(1.5);
const M=await p.evaluate(()=>({left:room.enemies.filter(e=>e.trial&&e.hp>0).length,engaged:room.engaged,stage:room.encounterStage,phase:room.persona?.phase}));
ok(M.left===1&&M.engaged&&M.phase!=='ready','5마리를 잡아도 전투 계속(1마리 남음, 페르소나 준비 전)',M);
await p.evaluate(()=>{const e=room.enemies.find(e=>e.trial&&e.hp>0);if(e)try{hitEnemy(e,e.hp+1);}catch(_){e.hp=0;}});await T(3);await skip();
const E=await p.evaluate(()=>({left:room.enemies.filter(e=>e.trial&&e.hp>0).length,phase:room.persona?.phase,stage:room.encounterStage,idx:room.trialIndex,persona:room.enemies.some(e=>e.persona)}));
ok(E.left===0&&(E.phase==='ready'||E.stage==='personaReady')&&E.persona,'6마리를 다 잡으면 페르소나 결전 준비',E);
ok(errs.length===0,'페이지 오류 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
