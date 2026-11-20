// R1280 브라우저 검사(헤드리스 Chromium — 실기기·GPU·실플레이 검증 아님): PC 설정창 겹치는 칸 합치기.
//  사용자 2026-11-20 "pc 설정에서 겹치는 기능 하나로 모아줘 설정ui 간편화".
//  확인: ① 겹치던 옛 칸은 숨고 하나만 보임 ② 통합 칸이 옛 칸 모두를 같은 값으로 몬다(각 모듈의 원래 저장 그대로)
//        ③ 예전 저장값이 서로 다르면 통합 칸이 '일부'(indeterminate)로 보이고 값은 건드리지 않음(손실 없음)
//        ④ 사용자 기본값(서사 창·서사 음성·수묵화풍 켜짐, 제목 줄 서사 단추, 적중 이펙트 투명도) 그대로 ⑤ 휴대폰 설정은 손대지 않고 오류 없음.
//  실행: SW_URL=http://127.0.0.1:4396/ node r96/qa/r1280/r1280-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let n=0,bad=0;
const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const b=await chromium.launch();
async function game(ctx){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.evaluate(()=>document.getElementById('campaignNew54').click());await p.waitForTimeout(300);
 await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/새 게임 시작/.test(x.textContent))?.click();});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});return {p,errs};}
const openS=async p=>{await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(250);await p.evaluate(()=>showSettings());await p.waitForTimeout(900);
 await p.evaluate(()=>document.querySelectorAll('#panel details').forEach(d=>d.open=true));await p.waitForTimeout(250);};
const vis=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const l=e.closest('label')||e;return !!(l.checkVisibility?l.checkVisibility():l.offsetParent)&&(e.checkVisibility?e.checkVisibility():true);},s);
const count=p=>p.evaluate(()=>[...document.querySelectorAll('#panel input,#panel select,#panel button')].filter(e=>e.checkVisibility?e.checkVisibility():!!e.offsetParent).length);
const HIDDEN=[['input[data-r1021="subs"]','서사 자막 칸(제목 줄 서사 텍스트 단추와 같은 값)'],['#r365SkipStory','서사 창 자동 넘기기(= 서사 창)'],['#r182Auto','주운 쪽지 바로 펼치기(= 쪽지 창)'],
 ['#r365GuideFrag','길잡이 중 쪽지 창(= 쪽지 창)'],['#r365ManualFrag','직접 조작 중 쪽지 창(= 쪽지 창)'],['[data-setting="narration"]','서사 음성 자동 재생(엔진)'],['#r1223Chk','기억 조각·서사 음성 자동 재생'],
 ['#flashlightModeR58','손전등 주변 시야(= 시야 고르기)'],['#cameraFactorR63','가로·세로 표시 범위'],['#viewFactorR217','시야 배율'],['[data-r114-horror]','R114 호러 세기 줄'],['[data-r123-tone]','R123 어둠 세기 줄'],
 ['#r123QuickMood input','간이설정 사몽 분위기 사본'],['[data-r114-api="c114"][data-r114-key="palette"]','R114 몹 고유색'],['#r100-signature','R100 몹 고유색'],['[data-r137="faceAlways"]','몹이 늘 영웅을 봄(= 서로 바라보기)']];
// ---- PC 기본 ----
{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const {p,errs}=await game(ctx);await openS(p);
 ok('R1280 모듈 있음',await p.evaluate(()=>!!window.__STORYWORLD_SETTINGS_MERGE_R1280__));
 for(const [s,name] of HIDDEN)ok('겹치던 칸 숨김: '+name,!(await vis(p,s)));
 for(const [s,name] of [['#r1141NarrBtn','제목 줄 서사 텍스트 단추(#771)'],['input[data-r1037="story"]','서사 창'],['input[data-r1037="fragment"]','기억 조각·쪽지 창'],['#narrVoiceR1280','통합: 서사 음성'],
  ['#lightModeR182','시야 고르기'],['#viewRangeR1280','통합: 시야 범위'],['#horrorR1280','통합: 분위기 세기'],['[data-r123="mood"]','사몽 구역 분위기(세부)'],['#signatureR1280','통합: 몹·보스 고유색 이펙트'],
  ['#faceAllR1043','서로 바라보기'],['#hitAlphaR1271','적중 이펙트 투명도(R1271)'],['#inkOnR1055','맵 수묵화풍']])ok('보임: '+name,await vis(p,s));
 const d=await p.evaluate(()=>({narr:settings.narration,mem:window.__STORYWORLD_MEMORY_VOICE_R1223__?.prefs().on,box:document.getElementById('narrVoiceR1280')?.checked,ind:document.getElementById('narrVoiceR1280')?.indeterminate,
  subsBtn:document.getElementById('r1141NarrBtn')?.getAttribute('aria-pressed'),story:document.querySelector('input[data-r1037="story"]')?.checked,ink:document.getElementById('inkOnR1055')?.checked,
  view:+document.getElementById('viewRangeR1280')?.value,cam:+document.getElementById('cameraFactorR63')?.value,f:window.__STORYWORLD_VIEW_R217__?.factor(),
  horror:document.querySelector('#horrorR1280 [aria-pressed="true"]')?.dataset.r1280Horror,sig:document.getElementById('signatureR1280')?.checked}));
 ok('기본값: 서사 음성 켜짐(엔진·R1223 둘 다, 통합 칸 체크)',d.narr===true&&d.mem===true&&d.box===true&&d.ind===false,d);
 ok('기본값: 서사 텍스트·서사 창·수묵화풍 켜짐',d.subsBtn==='true'&&d.story===true&&d.ink===true,d);
 ok('시야 범위 = 표시 범위 × 시야 배율 (PC 기본 1.5)',Math.abs(d.view-d.cam*d.f)<1e-6&&Math.abs(d.view-1.5)<1e-6,d);
 ok('분위기 세기 기본 보통, 고유색 이펙트 켜짐',d.horror==='mid'&&d.sig===true,d);
 // 통합 칸이 옛 칸을 모두 몬다
 const v1=await p.evaluate(()=>{const c=document.getElementById('narrVoiceR1280');c.click();const off={narr:settings.narration,mem:window.__STORYWORLD_MEMORY_VOICE_R1223__.prefs().on,saved:JSON.parse(localStorage.getItem('storyworld.r1223.memvoice')||'{}').on};c.click();return {off,on:{narr:settings.narration,mem:window.__STORYWORLD_MEMORY_VOICE_R1223__.prefs().on}};});
 ok('서사 음성 끄기 → 엔진 서사 음성·기억 조각 음성 둘 다 꺼지고 저장, 켜기 → 둘 다 켜짐',v1.off.narr===false&&v1.off.mem===false&&v1.off.saved===false&&v1.on.narr===true&&v1.on.mem===true,v1);
 const v2=await p.evaluate(async()=>{const camSaved=()=>{const k=Object.keys(localStorage).find(k=>/camera\.r63\.v1$/.test(k));const o=k?JSON.parse(localStorage.getItem(k)||'{}'):{};return (o.pc||o.desktop||Object.values(o)[0]||{}).factor;};const s=document.getElementById('viewRangeR1280');const put=v=>{s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));};
  put(.8);const a={f:window.__STORYWORLD_VIEW_R217__.factor(),cam:camSaved()};put(1.8);const b2={f:window.__STORYWORLD_VIEW_R217__.factor(),cam:camSaved()};put(1.5);return {a,b:b2};});
 ok('시야 범위 0.8 → 시야 배율 0.8·표시 범위 1, 1.8 → 시야 배율 1·표시 범위 1.8',Math.abs(v2.a.f-.8)<1e-6&&Math.abs(v2.b.f-1)<1e-6&&v2.a.cam===1&&v2.b.cam===1.8,v2);
 const v3=await p.evaluate(()=>{document.querySelector('#horrorR1280 [data-r1280-horror="high"]').click();const r={c:window.__STORYWORLD_CINEMA_R114__.prefs().horror,d:window.__STORYWORLD_DARK_R123__.prefs().tone};
  document.querySelector('#horrorR1280 [data-r1280-horror="mid"]').click();r.back=[window.__STORYWORLD_CINEMA_R114__.prefs().horror,window.__STORYWORLD_DARK_R123__.prefs().tone];return r;});
 ok('분위기 세기 강 → R114 호러·R123 어둠 둘 다 강, 보통으로 되돌림',v3.c==='high'&&v3.d==='high'&&v3.back.join()==='mid,mid',v3);
 const v4=await p.evaluate(()=>{const c=document.getElementById('signatureR1280');c.click();const off=[window.__STORYWORLD_COMBAT_R114__.prefs().palette,window.__STORYWORLD_POLISH_R100__.prefs().signature];c.click();return {off,on:[window.__STORYWORLD_COMBAT_R114__.prefs().palette,window.__STORYWORLD_POLISH_R100__.prefs().signature]};});
 ok('고유색 이펙트 끄기 → R114·R100 둘 다 꺼짐, 켜기 → 둘 다 켜짐',v4.off.join()==='false,false'&&v4.on.join()==='true,true',v4);
 const v5=await p.evaluate(()=>{const s=document.querySelector('input[data-r1037="fragment"]');s.click();const r=[document.getElementById('r182Auto')?.checked,document.getElementById('r365GuideFrag')?.checked,document.getElementById('r365ManualFrag')?.checked];s.click();return r;});
 ok('쪽지 창 끄기가 숨은 옛 칸까지 맞춤(R1037 그대로)',v5.join()==='false,true,true'||v5.every(x=>x===false),v5);
 const after=await count(p);ok('모두 펼친 설정창의 보이는 조작 수가 줄어듦(R1280 전 PC 203)',after<=203-8,after);
 ok('PC 기본: 페이지 오류 없음',errs.length===0,errs);await ctx.close();}
// ---- 예전 저장값 이관(손실 없음) ----
{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{if(sessionStorage.getItem('r1280seed'))return;sessionStorage.setItem('r1280seed','1');localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));
  localStorage.setItem('storyworld.r1223.memvoice',JSON.stringify({on:false}));localStorage.setItem('storyworld.r217.view',JSON.stringify({f:.8}));
  localStorage.setItem('storyworld.hospital-three-pc.maze.v11:r123.dark',JSON.stringify({tone:'low',torches:true,fog:true,embers:true}));});
 const {p,errs}=await game(ctx);await openS(p);
 const m=await p.evaluate(()=>({narr:settings.narration,mem:window.__STORYWORLD_MEMORY_VOICE_R1223__.prefs().on,box:document.getElementById('narrVoiceR1280')?.checked,ind:document.getElementById('narrVoiceR1280')?.indeterminate,
  view:+document.getElementById('viewRangeR1280')?.value,cam:+document.getElementById('cameraFactorR63')?.value,f:window.__STORYWORLD_VIEW_R217__.factor(),
  pressed:document.querySelectorAll('#horrorR1280 [aria-pressed="true"]').length,c:window.__STORYWORLD_CINEMA_R114__.prefs().horror,d:window.__STORYWORLD_DARK_R123__.prefs().tone}));
 ok('이관: 기억 조각 음성만 꺼져 있던 저장 → 통합 칸 "일부"(indeterminate), 값은 그대로',m.narr===true&&m.mem===false&&m.box===false&&m.ind===true,m);
 ok('이관: 시야 배율 0.8 저장 → 통합 시야 범위 = 1.5×0.8 = 1.2, 저장값 그대로',Math.abs(m.view-1.2)<1e-6&&Math.abs(m.f-.8)<1e-6&&Math.abs(m.cam-1.5)<1e-6,m);
 ok('이관: 호러 보통·어둠 약으로 엇갈린 저장 → 어느 칸도 눌리지 않음(일부), 값 그대로',m.pressed===0&&m.c==='mid'&&m.d==='low',m);
 ok('이관: 오류 없음',errs.length===0,errs);await ctx.close();}
// ---- 휴대폰: 이번 범위 아님 — 깨지지 않게만 ----
{const ctx=await b.newContext({...devices['iPhone 13 Mini']});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const {p,errs}=await game(ctx);await openS(p);
 const r=await p.evaluate(()=>({mod:!!window.__STORYWORLD_SETTINGS_MERGE_R1280__,applied:window.__STORYWORLD_SETTINGS_MERGE_R1280__?.inspect().applied,merged:!!document.getElementById('narrVoiceR1280'),narr:!!document.querySelector('[data-setting="narration"]')}));
 ok('휴대폰: R1280 은 설정창을 바꾸지 않음(모바일 설정은 범위 밖)',r.mod&&r.applied===false&&!r.merged&&r.narr,r);
 ok('휴대폰: 페이지 오류 없음',errs.length===0,errs);await ctx.close();}
console.log((bad?'R1280 BROWSER FAILED ':'R1280 BROWSER PASSED ')+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
