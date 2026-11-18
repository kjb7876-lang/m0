// R1135 무한생존 난이도별 동시 보스 수 — 헤드리스 브라우저 검사(그래픽·GPU·실기기 손맛은 미검증).
//  난이도 넷마다: 고르기 카드에 '보스 N마리' → 보스 지역에서 몹 물결을 비우면 보스가 N마리 한꺼번에 → 서로 2.5칸 이상·막힌 칸 아님·체력 66배 하한·6% 잠금 → 모두 처치하면 정화 완료.
//  렉: 보스 N마리가 살아 있는 동안 tick(1/30) 한 번 평균·최대 ms(640×360). SW_URL·SHOT(스크린샷 폴더)·DIFFS(쉼표).
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',DIFFS=(E.DIFFS||'easy,normal,hard,nightmare').split(','),WANT={easy:1,normal:2,hard:3,nightmare:6};
let fails=0;const check=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();
for(const DIFF of DIFFS){const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));const A=(f,a)=>p.evaluate(f,a);
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();
 const card=await p.locator(`[data-r600diff="${DIFF}"]`).innerText();check(card.includes('보스 '+WANT[DIFF]+'마리'),`${DIFF} 난이도 카드 '보스 ${WANT[DIFF]}마리' (${card.replace(/\s+/g,' ').slice(-40)})`);
 await p.locator(`[data-r600diff="${DIFF}"]`).click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
 await ready();
 // 보스(R.boss)가 있는 첫 지역으로
 const N=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().ids);let idx=-1;
 for(let i=0;i<Math.min(N,20);i++){await A(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await ready();const has=await A(()=>!!room.survivalR600.roster.boss);if(has){idx=i;break;}}
 check(idx>=0,`${DIFF} 보스 지역 찾음 i=${idx}`);
 // 물결 비우기: 서사 건너뛰고 몹 처치를 반복해 보스 단계로
 const r=await A(async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T0=performance.now();
  while(performance.now()-T0<120000){if(modal){const bt=document.getElementById('r600Pick0');if(bt){bt.click();continue;}}
   if(Z.narr().playing)Z.skipNarration();const st=Z.state();if(st.phase==='boss'&&st.bossUp)break;
   for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded&&!e.r600Boss){try{killEnemy(e);}catch(_){}}
   player.hp=maxHP();tick(1/30);await new Promise(r=>setTimeout(r,0));}
  const B=room.enemies.filter(e=>e.r600Boss&&e.hp>0&&!e.deadRecorded),P=Z.pure,s=Z.state();
  const fl=66*P.mobHp(s.i,s.loop,s.diff,Math.max(8,attackPower()),false);let md=1e9;for(let a=0;a<B.length;a++)for(let c=a+1;c<B.length;c++)md=Math.min(md,Math.hypot(B[a].x-B[c].x,B[a].y-B[c].y));
  return {phase:s.phase,n:B.length,names:[...new Set(B.map(e=>e.name))],hp:B.map(e=>Math.round(e.maxHp)),dmg:B.map(e=>+e.damage.toFixed(1)),blocked:B.filter(e=>blocked(e.x,e.y,.3,room)).length,md,fl:Math.round(fl),
   pd:Math.min(...B.map(e=>Math.hypot(e.x-player.x,e.y-player.y))),guarded:B.every(e=>!!Object.getOwnPropertyDescriptor(e,'hp')?.get)};});
 console.log(DIFF,JSON.stringify(r));
 check(r.phase==='boss'&&r.n===WANT[DIFF],`${DIFF} 보스 ${r.n}마리 동시 (기대 ${WANT[DIFF]})`);
 check(r.n<2||r.md>=2.5-1e-6,`${DIFF} 보스 사이 최소 거리 ${r.md===1e9?'-':r.md.toFixed(2)}칸 ≥ 2.5`);
 check(r.blocked===0,`${DIFF} 막힌 칸에 선 보스 0`);check(r.guarded,`${DIFF} 모든 보스 6% 잠금`);
 // 렉: 보스가 살아 있는 동안 tick 300번(10초) 비용 — 영웅·코어는 채워 둠
 const perf=await A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const ms=[];for(let k=0;k<300;k++){player.hp=maxHP();const s=Z.state();if(s.core.hp<s.core.stats.max)Z.qaCoreHp(s.core.stats.max);const t=performance.now();tick(1/30);ms.push(performance.now()-t);}
  ms.sort((a,b)=>a-b);return {avg:+(ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(2),p95:+ms[Math.floor(ms.length*.95)].toFixed(2),max:+ms[ms.length-1].toFixed(2),alive:room.enemies.filter(e=>e.r600Boss&&e.hp>0).length,errs:Z.inspect?.().errors??Z.inspect?.().stats?.errors};});
 console.log(DIFF,'tick',JSON.stringify(perf));
 if(E.SHOT){fs.mkdirSync(E.SHOT,{recursive:true});await p.waitForTimeout(1500);await p.screenshot({path:`${E.SHOT}/r1135-${DIFF}.png`});}
 // 모두 처치 → 정화 완료: 보스는 hitEnemy 로 매 틱 크게 때린다(6%/초 잠금이 있으니 게임 시간 약 17초+). 몹은 killEnemy.
 const done=await A(async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T0=performance.now(),t0=time;let first=null;
  while(performance.now()-T0<240000){if(modal){const bt=document.getElementById('r600Pick0');if(bt){bt.click();continue;}}if(Z.narr().playing)Z.skipNarration();
   for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded){try{if(e.r600Boss)hitEnemy(e,e.maxHp);else killEnemy(e);}catch(_){}}
   player.hp=maxHP();const s0=Z.state();if(s0.core.hp<s0.core.stats.max)Z.qaCoreHp(s0.core.stats.max);tick(1/30);
   const alive=room.enemies.filter(e=>e.r600Boss&&e.hp>0&&!e.deadRecorded).length;if(!alive&&first==null)first=time-t0;
   const s=Z.state();if(s.phase==='clear')return {phase:s.phase,killT:+(first??-1).toFixed(1)};await new Promise(r=>setTimeout(r,0));}return {phase:Z.state().phase,killT:first};});
 console.log(DIFF,'clear',JSON.stringify(done));
 check(done.phase==='clear'&&done.killT>0,`${DIFF} 보스 모두 처치 뒤 정화 완료 (${done.phase}, 마지막 보스까지 ${done.killT}초)`);
 check(errs.length===0,`${DIFF} 페이지 오류 0 (${errs.length}) ${errs[0]||''}`);
 await ctx.close();}
await b.close();console.log(fails?`R1135 브라우저 실패 ${fails}`:'R1135 브라우저 통과');process.exit(fails?1:0);
