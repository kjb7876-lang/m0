// R1023 모바일 그래픽 자동 단계 검사 (헤드리스 Chromium 모바일 뷰포트 — 아이폰·사파리 실기기·GPU 검증 아님).
//  사용자 2026-11-14 "모바일에서는 현재를 최저사양으로 해서 좋은환경일때는 피시급그래픽까지 올리도록 동시에 렉개선까지".
//  단계: 0 낮음(지금 공개본 그대로: 가벼운 효과 lowFx, 화면 배율 1, 50만 화소 이상 그림 절반 사본, 빛·날씨 모바일 예산)
//        1 보통(200만 화소 이상 그림만 절반, 나머지 같음)
//        2 높음(lowFx 끔, 화면 배율 ≤1.25, 200만 화소 이상만 절반)
//        3 PC급(절반 사본 없음, 화면 배율 ≤1.5, 빛·날씨 PC 예산)
//  (처음 쓴 검사는 지금 공개본 휴대폰 배율을 1.25 로 잘못 알았다 — 실제로는 부팅 때 휴대폰은 lowFx 가 켜져 배율 1. 구현 전에 기준을 바로잡음.)
//  자동: 처음엔 늘 0. 플레이 중 장면 간격이 넉넉하고 메모리 신호가 괜찮으면 한 단계씩 올리고, 느려지거나 메모리가 차면 바로 내린다.
//  자동 시험 브라우저(navigator.webdriver)는 실제 장면 간격과 무관하므로 자동 판정은 qa() 로 켰을 때만 하고, 장면 간격은 _feed 로 넣는다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const T='__STORYWORLD_MOBILE_TIER_R1023__';
async function survival(p,hero){await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${hero}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});}
const play=(p,sec)=>p.evaluate(sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T0=performance.now();while(time-t0<sec&&performance.now()-T0<15000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();tick(1/30);}return time-t0;},sec);

// 1) PC: 기본은 지금 그대로(PC급, 아무것도 바꾸지 않음). 사용자 2026-11-14 "피시에서도 최저사양 설정 추가" → 설정에서 낮은 단계를 고를 수 있다.
{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 const st=()=>p.evaluate(T=>{const M=window[T];if(!M)return null;const i=M.inspect();const H=window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect();return {active:i.active,pcDefault:i.pcDefault,tier:i.tier,pref:i.pref,dpr,lowFx:settings.lowFx,cw:canvas.width,W,live:H?.live,halfMin:H?.halfMinPx,light:window.__STORYWORLD_LIGHT_ATMOS_R300__?.budget?.().tier??null,applies:i.stats.applies};},T);
 let r=await st();
 ok('PC default: R1023 present, no auto, PC grade untouched (dpr 1.5, lowFx off, no half, light pc)',!!r&&r.active===false&&r.pcDefault===true&&r.tier===3&&r.dpr===1.5&&r.cw===Math.round(r.W*1.5)&&r.lowFx===false&&r.live===false&&r.light==='pc'&&r.applies===0,r);
 await p.evaluate(()=>{try{showSettings();}catch(_){}});await p.waitForTimeout(300);
 const row=await p.evaluate(()=>{const r=document.getElementById('mobileTierRowR1023');return r?{n:r.querySelectorAll('[data-r1023-tier]').length,auto:!!r.querySelector('[data-r1023-tier="auto"]'),pcOn:r.querySelector('[data-r1023-tier="pc"]')?.getAttribute('aria-pressed'),text:r.textContent}:null;});
 ok('PC settings: graphics tier row with 4 choices, PC grade (default) pressed, no auto',!!row&&row.n===4&&!row.auto&&row.pcOn==='true',row);
 await p.evaluate(()=>document.querySelector('[data-r1023-tier="low"]')?.click());await p.waitForTimeout(200);r=await st();
 ok('PC "low": lowFx on, dpr 1, half copies ≥ 500k px, light mobile budget',r.tier===0&&r.lowFx===true&&r.dpr===1&&r.cw===r.W&&r.live===true&&r.halfMin===5e5&&r.light==='mobile',r);
 await p.evaluate(()=>document.querySelector('[data-r1023-tier="high"]')?.click());await p.waitForTimeout(200);r=await st();
 ok('PC "high": lowFx off, dpr 1.25, half ≥ 2M px',r.tier===2&&r.lowFx===false&&r.dpr===1.25&&r.live===true&&r.halfMin===2e6,r);
 await p.evaluate(()=>document.querySelector('[data-r1023-tier="pc"]')?.click());await p.waitForTimeout(200);r=await st();
 ok('PC back to PC grade: dpr 1.5, lowFx off (original), no half, light pc',r.tier===3&&r.dpr===1.5&&r.lowFx===false&&r.live===false&&r.light==='pc',r);
 await p.evaluate(()=>document.querySelector('[data-r1023-tier="low"]')?.click());await p.reload({timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});r=await st();
 ok('PC "low" survives reload',r.tier===0&&r.pref==='low'&&r.dpr===1&&r.live===true,r);
 await p.evaluate(T=>window[T].setPref('pc'),T);
 ok('PC: no page errors',errs.length===0,errs);await ctx.close();}

// 2) 모바일
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await A(()=>{try{localStorage.removeItem('storyworld.r1023.mobileTier');}catch(_){}});
await p.reload({timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
let s=await A(T=>{const M=window[T];if(!M)return null;const i=M.inspect();const H=window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect();return {active:i.active,tier:i.tier,pref:i.pref,dpr,lowFx:settings.lowFx,cw:canvas.width,W,halfMin:H?.halfMinPx,half:H?.half};},T);
ok('mobile: R1023 active, starts at tier 0 (= current public: lowFx on, dpr 1, half ≥ 500k px)',!!s&&s.active===true&&s.tier===0&&s.pref==='auto'&&s.lowFx===true&&s.dpr===1&&s.cw===s.W&&s.halfMin===5e5&&s.half===true,s);
await p.mouse.click(5,5).catch(()=>{});
await survival(p,'slayer');await p.waitForTimeout(1500);

// 자동 판정을 시험용으로 켠다(실제 rAF 간격은 무시, _feed 로 넣은 간격만 본다). 기기 메모리는 모름(아이폰 사파리처럼).
await A(T=>window[T].qa({auto:true,deviceMemory:null,heapRatio:null}),T);
const feed=(ms,sec)=>A(([T,ms,sec])=>window[T]._feed(ms,sec),[T,ms,sec]);
// 경계값: NaN·Infinity·음수 간격은 무시하고 단계가 바뀌지 않는다.
s=await A(T=>{const M=window[T];M._feed(NaN,30);M._feed(Infinity,30);M._feed(-5,30);return M.inspect();},T);
ok('NaN / Infinity / negative frame gaps are ignored (tier stays 0, no error)',s.tier===0&&s.stats.errors===0,{tier:s.tier,errors:s.stats.errors,lastError:s.lastError});
// 기기 메모리를 모르면(아이폰 사파리) 아무리 넉넉해도 올리지 않는다(꺼짐 재발 방지).
s=await feed(16.7,60);
ok('memory unknown (iPhone Safari): auto never upgrades (stays at current public settings)',s.tier===0&&s.maxAuto===0,{tier:s.tier,maxAuto:s.maxAuto});
// 4GB 로 알려지면 1단계까지.
await A(T=>window[T].qa({deviceMemory:4}),T);
s=await A(([T])=>window[T]._feed(16.7,10),[T]);
ok('good frames for 10 s: not yet upgraded (needs ≥ 20 s)',s.tier===0,{tier:s.tier,goodFor:s.goodFor});
s=await feed(16.7,12);
ok('deviceMemory 4GB, good frames for 22 s: upgraded to tier 1',s.tier===1,{tier:s.tier,why:s.lastChange});
s=await A(T=>({...window[T].inspect(),halfMin:window.__STORYWORLD_MOBILE_MEMORY_R980__.inspect().halfMinPx,dpr,lowFx:settings.lowFx}),T);
ok('tier 1: half copies only for ≥ 2M px images, lowFx still on, dpr 1',s.halfMin===2e6&&s.dpr===1&&s.lowFx===true,{halfMin:s.halfMin,dpr:s.dpr,lowFx:s.lowFx});
s=await feed(16.7,40);
ok('deviceMemory 4GB: auto never goes above tier 1',s.tier===1,{tier:s.tier,maxAuto:s.maxAuto});
// 기기 메모리 8GB 로 알려지면 PC급까지.
await A(T=>window[T].qa({deviceMemory:8}),T);s=await feed(16.7,25);
ok('deviceMemory 8GB + good frames: upgraded to tier 2',s.tier===2,{tier:s.tier,why:s.lastChange});
s=await A(T=>({dpr,cw:canvas.width,W,lowFx:settings.lowFx,halfMin:window.__STORYWORLD_MOBILE_MEMORY_R980__.inspect().halfMinPx}),T);
ok('tier 2: lowFx off, dpr 1.25, half only ≥ 2M px',s.lowFx===false&&s.dpr===1.25&&s.cw===Math.round(s.W*1.25)&&s.halfMin===2e6,s);
s=await feed(16.7,25);
ok('another 25 s of good frames: tier 3 (PC grade)',s.tier===3,{tier:s.tier,why:s.lastChange});
await play(p,6);await p.waitForTimeout(300);
s=await A(T=>{const H=window.__STORYWORLD_MOBILE_MEMORY_R980__.inspect();return {tier:window[T].inspect().tier,dpr,cw:canvas.width,W,halfMin:H.halfMinPx,live:H.live,light:window.__STORYWORLD_LIGHT_ATMOS_R300__?.budget?.().tier??null,lod:window.__STORYWORLD_RENDER_LOD_R287__?.inspect?.().cap??null};},T);
ok('tier 3: dpr 1.5, canvas resized, no half copies, light budget = pc',s.dpr===1.5&&s.cw===Math.round(s.W*1.5)&&s.live===false&&s.light==='pc',s);
// 느려지면(중앙값 40ms 4초 넘게) 한 단계 내린다.
s=await feed(40,5);
ok('slow frames (40 ms) for 5 s: dropped one tier to 2',s.tier===2,{tier:s.tier,why:s.lastChange});
s=await feed(16.7,30);
ok('right after a drop: no re-upgrade within cooldown (120 s)',s.tier===2,{tier:s.tier,cooldownLeft:s.cooldownLeft});
// 메모리 압박(힙 80%)이면 바로 0.
await A(T=>window[T].qa({heapRatio:.8}),T);s=await feed(16.7,2);
ok('heap 80% of limit: dropped straight to tier 0',s.tier===0,{tier:s.tier,why:s.lastChange});
await A(T=>window[T].qa({heapRatio:.3}),T);
await play(p,6);await p.waitForTimeout(300);
s=await A(T=>{const H=window.__STORYWORLD_MOBILE_MEMORY_R980__.inspect();return {dpr,cw:canvas.width,W,lowFx:settings.lowFx,halfMin:H.halfMinPx,live:H.live,light:window.__STORYWORLD_LIGHT_ATMOS_R300__?.budget?.().tier??null};},T);
ok('back at tier 0: lowFx on, dpr 1, half copies on again, light budget = mobile',s.lowFx===true&&s.dpr===1&&s.cw===s.W&&s.halfMin===5e5&&s.live===true&&s.light==='mobile',s);
// 텍스처 참조 수: 절반 ↔ 원본을 오가도 3D 텍스처가 새지 않는다(절반으로 내준 참조는 절반으로 돌려받는다).
s=await A(()=>{const sc=window.__STORYWORLD_MOBILE_MEMORY_R980__.inspect().stats;return {mixed:sc.halfRefMismatch??null};});
ok('texture refs: no half/original release mismatch after switching tiers',s.mixed===0,s);
// 수동 설정: 설정 창에 휴대폰 그래픽 단계 줄(자동·낮음·보통·높음)이 있고, '높음'을 누르면 바로 2, 저장된다.
await A(()=>{try{showSettings();}catch(_){}});await p.waitForTimeout(300);
s=await A(()=>{const r=document.getElementById('mobileTierRowR1023');return r?{n:r.querySelectorAll('[data-r1023-tier]').length,text:r.textContent}:null;});
ok('settings: mobile graphics tier row with 5 choices (auto + 4 tiers)',!!s&&s.n===5,s);
await A(()=>document.querySelector('[data-r1023-tier="pc"]')?.click());await p.waitForTimeout(200);
s=await A(T=>({...window[T].inspect(),saved:localStorage.getItem('storyworld.r1023.mobileTier')}),T);
ok('manual "PC": tier 3 now and saved',s.tier===3&&s.pref==='pc'&&/"pref":"pc"/.test(s.saved||''),{tier:s.tier,pref:s.pref,saved:s.saved});
s=await feed(45,10);
ok('manual tier is kept even when frames are slow (no auto drop)',s.tier===3,{tier:s.tier});
await A(()=>document.querySelector('[data-r1023-tier="auto"]')?.click());await p.waitForTimeout(200);
s=await A(T=>window[T].inspect(),T);
ok('back to "auto": restarts at tier 0',s.tier===0&&s.pref==='auto',{tier:s.tier,pref:s.pref});
await A(()=>{try{closePanel();}catch(_){}});
// 꺼짐 방지: 단계 2 에서 깨끗하게 닫히지 않고(탭 꺼짐) 다시 열리면 자동 최고 단계를 1로 묶는다.
await p.close().catch(()=>{});
const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));
await p2.addInitScript(()=>{localStorage.setItem('storyworld.r1023.mobileTier',JSON.stringify({pref:'auto',live:{tier:3,at:Date.now()},cap:3}));});
await p2.goto(URL,{timeout:180000});await p2.locator('#campaignNew54').waitFor({timeout:180000});
s=await p2.evaluate(T=>window[T].inspect(),T);
ok('after an unclean exit at tier 3: auto cap lowered to 2, starts at tier 0',s.cap===2&&s.tier===0&&s.crashGuard===true,{cap:s.cap,tier:s.tier,crashGuard:s.crashGuard});
await p2.evaluate(T=>window[T].qa({auto:true,deviceMemory:8}),T);
s=await p2.evaluate(T=>{const M=window[T];M._feed(16.7,30);M._feed(16.7,30);M._feed(16.7,30);return M._feed(16.7,30);},T);
ok('capped device never auto-upgrades beyond the cap',s.tier===2,{tier:s.tier,cap:s.cap});
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
