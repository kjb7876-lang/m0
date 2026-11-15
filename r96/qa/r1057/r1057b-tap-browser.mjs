// R1057b 모바일 대안 — 헤드리스 터치 에뮬레이션 검사(실기기 아님, GPU 미검증).
//  실행: SW_URL=http://127.0.0.1:4396/ [SW_SHOT=폴더] node r96/qa/r1057/r1057b-tap-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
let pw;try{pw=createRequire(import.meta.url)('playwright');}catch(_){pw=createRequire('/opt/node22/lib/node_modules/')('playwright');}
const {chromium,devices}=pw;const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,300):''));};
const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 13 Mini']});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').tap({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
const vis=()=>p.evaluate(()=>{const v=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).display!=='none';return{heroes:[...document.querySelectorAll('#panel button[data-hero]')].filter(v).length,ego:[...document.querySelectorAll('#panel [data-ego-r1046]')].filter(v).length,sel:!!document.querySelector('#panel [data-ego-r1046].selected'),title:document.querySelector('#panel h2')?.textContent||''};});
let v=await vis();ok(v.title.length>0&&v.heroes>=8&&v.ego===0,'시작창 제목(h2) 있음, 영웅 칸 보임, EGO 없음',v);
const T=p.locator('#panel h2').first();
for(let i=0;i<6;i++){await T.tap();await p.waitForTimeout(120);}await p.waitForTimeout(300);v=await vis();ok(v.heroes>=8&&v.ego===0,'6번 탭은 그대로',v);
await p.waitForTimeout(1700);
for(let i=0;i<7;i++){await T.tap();await p.waitForTimeout(120);}await p.waitForTimeout(800);v=await vis();
ok(v.heroes===0&&v.ego===1&&v.sel,'제목 7연타: 영웅 칸 숨김·EGO 칸만·선택됨',v);
if(SH)await p.screenshot({path:SH+'/mobile-7tap.jpg',quality:82});
ok(errs.length===0,'페이지 오류 0',errs);
await ctx.close();await b.close();console.log(`\nR1057b tap browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
