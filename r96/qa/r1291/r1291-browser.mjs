// R1291 헤드리스 확인: 설정창·메뉴·진단 창 터치 영역과 나침반 지역 이름 잘림(사용자 2026-11-21 "impeccable 방식으로 점검").
//  폰(가로 844×390·세로 390×844, 터치): 설정 체크 칸 22px 이상·그 줄 높이 36px 이상, 화풍 고르기·닫기 단추·진단 접기 줄 높이 36px 이상.
//  모든 크기: 나침반 아래 지역 이름이 말줄임(…) 없이 다 보인다(두 줄까지). PC(1366×768, 마우스)는 설정 체크 칸 크기가 예전 그대로(13px).
//  (헤드리스 소프트웨어 렌더링 — 실기기 터치·GPU 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1291/r1291-browser.mjs
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();
for(const S of ['844x390','390x844','1366x768']){const [W,H]=S.split('x').map(Number);const touch=W<900||H<500;
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,hasTouch:touch,isMobile:touch});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:60000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>!!window.__STORYWORLD_UI_TAP_R1291__),S+' R1291 모듈 실림');
 const lab=await p.evaluate(()=>{const l=document.querySelector('#navCompassR100 .label');if(!l||!l.checkVisibility())return null;return {text:l.textContent,sw:l.scrollWidth,cw:l.clientWidth,sh:l.scrollHeight,ch:l.clientHeight,h:l.getBoundingClientRect().height|0};});
 ok(lab&&lab.sw<=lab.cw+1&&lab.sh<=lab.ch+1&&lab.h<=30,S+' 나침반 지역 이름이 잘리지 않음(두 줄까지)',lab);
 const st=await p.evaluate(()=>{showSettings();const P=document.getElementById('panel');const cbs=[...P.querySelectorAll('input[type=checkbox]')].filter(e=>e.checkVisibility());
  const rows=cbs.map(c=>{const r=c.getBoundingClientRect(),l=c.closest('label')?.getBoundingClientRect();return {id:c.id||c.dataset.r1021||'',w:r.width|0,h:r.height|0,row:l?l.height|0:0};});
  const sel=document.getElementById('inkSelR1055')?.getBoundingClientRect();const out={n:cbs.length,rows,sel:sel?sel.height|0:0};closePanel(true);
  showMenu();const cl=[...document.querySelectorAll('#panel button[data-r176="back"]')].find(e=>e.checkVisibility());out.close=cl?cl.getBoundingClientRect().height|0:-1;closePanel(true);
  showDiagnostics();const sm=[...document.querySelectorAll('#panel summary')].find(e=>e.checkVisibility());out.sum=sm?sm.getBoundingClientRect().height|0:-1;closePanel(true);return out;});
 if(touch){
  ok(st.n>=6&&st.rows.every(r=>r.w>=22&&r.h>=22),S+' 설정 체크 칸이 모두 22px 이상',st.rows.filter(r=>r.w<22||r.h<22).slice(0,6));
  ok(st.rows.every(r=>r.row>=36),S+' 설정 체크 줄(라벨) 높이 36px 이상',st.rows.filter(r=>r.row<36).slice(0,6));
  ok(st.sel>=36,S+' 화풍 고르기 높이 36px 이상',st.sel);
  ok(st.close>=36,S+' 메뉴 닫기 단추 높이 36px 이상',st.close);
  ok(st.sum>=36,S+' 진단 창 접기 줄 높이 36px 이상',st.sum);
 }else{
  ok(st.n>=6&&st.rows.every(r=>r.w===13&&r.h===13),S+' PC(마우스): 설정 체크 칸 크기 그대로 13px',st.rows.filter(r=>r.w!==13).slice(0,4));
  ok(st.close>0&&st.close<36,S+' PC(마우스): 메뉴 닫기 단추 크기 그대로',st.close);
 }
 ok(errs.length===0,S+' 페이지 오류 0',errs);await ctx.close();}
await b.close();console.log(`\nR1291 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
