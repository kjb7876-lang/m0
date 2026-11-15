// R1057 영웅 선택창 비밀 777 → EGO 칸만 — 헤드리스 브라우저 검사(그래픽 검증 아님 — 헤드리스 소프트웨어 렌더, GPU·실기기 미검증).
//  실행: SW_URL=http://127.0.0.1:4396/ [SW_SHOT=폴더] node r96/qa/r1057/r1057-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,300):''));};
const b=await chromium.launch();
async function open(){const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);return {ctx,p,errs};}
const vis=p=>p.evaluate(()=>{const v=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none';return{heroes:[...document.querySelectorAll('#panel .heroRowR101 [data-hero]')].filter(v).length,all:document.querySelectorAll('#panel .heroRowR101 [data-hero]').length,ego:[...document.querySelectorAll('#panel [data-ego-r1046]')].filter(v).length,egoSel:!!document.querySelector('#panel [data-ego-r1046].selected'),nm:document.querySelector('#r263Stage .nm')?.textContent||''};});
// 1) 잠긴 상태 시작창: 7·7 만 → 그대로, 7·8·7·7 → 그대로
const {ctx,p,errs}=await open();
let v=await vis(p);ok(v.heroes>=8&&v.ego===0,'처음: 영웅 칸 보임, EGO 칸 없음(잠김)',v);
if(SH)await p.screenshot({path:SH+'/before.jpg',quality:82});
await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(400);v=await vis(p);ok(v.heroes>=8&&v.ego===0,'7·7 두 번은 그대로',v);
await p.waitForTimeout(1700);await p.keyboard.press('Digit7');await p.keyboard.press('Digit8');await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(400);v=await vis(p);ok(v.heroes>=8&&v.ego===0,'다른 키(8) 낀 7·8·7·7 은 그대로',v);
await p.waitForTimeout(1700);
// 2) 텐키 7·숫자열 7 섞어 777 → 영웅 칸 모두 숨김, EGO 만, 자동 선택
await p.keyboard.press('Numpad7');await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(700);v=await vis(p);
ok(v.heroes===0&&v.all>=8,'777 뒤: 다른 영웅 칸 모두 안 보임(지우지 않고 숨김)',v);ok(v.ego===1,'EGO 칸 하나만 보임',v);ok(v.egoSel&&v.nm==='EGO','EGO 칸 자동 선택·무대 이름 EGO',v);
const stg=await p.evaluate(()=>{const e=document.getElementById('r263Stage');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none';});ok(stg,'R263 큰 무대(EGO 초상·설명)는 보임(회귀)');
if(SH)await p.screenshot({path:SH+'/after-777.jpg',quality:82});
const st=await p.evaluate(()=>({s:window.__STORYWORLD_EGO_SECRET_R1057__.inspect(),e:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.inspect().saved}));ok(st.e.on===true,'EGO 해금 저장(S-07 없이)',st);
// 3) 시작 → EGO 형상
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();});await p.waitForTimeout(1200);
const g=await p.evaluate(()=>({hero:player.hero,form:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),cls:document.getElementById('panel').classList.contains('r1057secret')}));
ok(g.hero==='hwando'&&g.form===true,'시작 뒤 EGO 형상 켜짐',g);
// 4) 전투 중 7·7·7 은 영웅창 밖 → 비밀 상태 안 켜짐(E 스킬 키 그대로)
await p.evaluate(()=>{if(modal)closePanel(true);});await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(300);
const c=await p.evaluate(()=>window.__STORYWORLD_EGO_SECRET_R1057__.inspect());ok(c.active===false&&!g.cls,'전투 중(창 닫힘) 777 무시·비밀 class 없음',c);
// 5) 거점 영웅 변경 창(#chooseHero .cards)에서도 777 → EGO 칸만·자동 선택, 창 닫으면 원래대로
await p.evaluate(()=>{player.hero='hunter';window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false);showHeroes(false);});await p.waitForTimeout(600);
await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(800);
const ch=await p.evaluate(()=>{const v=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none';return{heroes:[...document.querySelectorAll('#panel .cards [data-hero]')].filter(v).length,ego:[...document.querySelectorAll('#panel [data-ego-r1046]')].filter(v).length,sel:!!document.querySelector('#panel [data-ego-r1046].selected')};});
ok(ch.heroes===0&&ch.ego===1&&ch.sel,'거점 영웅 변경 창: 영웅 칸 숨김·EGO 칸만·선택됨',ch);
if(SH)await p.screenshot({path:SH+'/change-777.jpg',quality:82});
await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:60000});await p.waitForTimeout(800);
const ch2=await p.evaluate(()=>({hero:player.hero,form:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),cls:document.getElementById('panel').classList.contains('r1057secret')}));
ok(ch2.hero==='hwando'&&ch2.form===true&&ch2.cls===false,'변경 확정: 환도 계보 EGO 형상, 창 닫힘 뒤 비밀 class 해제',ch2);
await p.evaluate(()=>showHeroes(false));await p.waitForTimeout(500);
const ch3=await p.evaluate(()=>{const v=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none';return{heroes:[...document.querySelectorAll('#panel .cards [data-hero]')].filter(v).length,ego:[...document.querySelectorAll('#panel [data-ego-r1046]')].filter(v).length};});
ok(ch3.heroes>=8&&ch3.ego===1,'다시 열면 평소 줄(영웅 8 + 해금된 EGO 칸)',ch3);
ok(errs.length===0,'페이지 오류 0',errs);
await ctx.close();await b.close();
console.log(`\nR1057 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
