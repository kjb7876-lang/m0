// R1106 폰 화면 영웅 선택창 — 큰 무대(고른 영웅 1명) 아래로 영웅 줄이 화면 밖에 밀려 '영웅이 하나만 나오는' 문제 검사.
//  헤드리스 소프트웨어 렌더(그래픽·실기기 미검증). 실행: SW_URL=http://127.0.0.1:4396/ [SW_SHOT=폴더] node r96/qa/r1106/r1106-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
let pw;try{pw=createRequire(import.meta.url)('playwright');}catch(_){pw=createRequire('/opt/node22/lib/node_modules/')('playwright');}
const {chromium,devices}=pw;
const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();
const measure=p=>p.evaluate(()=>{const inView=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).display!=='none'&&r.top>=-1&&r.bottom<=innerHeight+1&&r.left>=-1&&r.right<=innerWidth+1;};
 const btn=[...document.querySelectorAll('#panel button[data-hero]')],ego=[...document.querySelectorAll('#panel [data-ego-r1046]')];
 const row=btn[0]?.parentElement,rr=row?.getBoundingClientRect(),st=document.getElementById('r263Stage');
 return {vp:innerWidth+'x'+innerHeight,all:btn.length,visible:btn.filter(inView).length,ego:ego.length,egoVisible:ego.filter(inView).length,
  rowTop:rr?Math.round(rr.top):null,rowBottom:rr?Math.round(rr.bottom):null,stageBeforeRow:!!(st&&row&&(st.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_FOLLOWING)),
  rowScrollable:!!row&&(row.scrollWidth<=row.clientWidth+1||['auto','scroll'].includes(getComputedStyle(row).overflowX)),
  docOverflowX:document.documentElement.scrollWidth>innerWidth+1,stageName:st?.querySelector('.nm')?.textContent||'',sel:document.querySelector('#panel button[data-hero].selected')?.dataset.hero||''};});
async function boot(dev,ego){const ctx=await b.newContext({...dev});await ctx.addInitScript(e=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(e)localStorage.setItem('storyworld.r1046.ego','{"on":true}');},!!ego);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});
 await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(1200);return {ctx,p,errs};}
// 기대: 영웅 줄 전체가 화면 안(세로), 가로로 넘치면 줄 안에서 가로 스크롤(문서 가로 넘침 없음), 보이는 칸 = min(8, 화면 폭이 담는 수) 이상.
const need=w=>Math.min(8,Math.max(4,Math.floor((w-40)/80)));
const CASES=[['iPhone 13 가로',devices['iPhone 13 landscape']],['Galaxy S9+ 가로',devices['Galaxy S9+ landscape']],['iPhone 13 세로',devices['iPhone 13']],['iPhone SE 세로',devices['iPhone SE']]];
for(const [name,dev] of CASES){const {ctx,p,errs}=await boot(dev,name.includes('13 가로'));
 let m=await measure(p);
 ok(m.all===8,name+' 처음부터 시작: 영웅 칸 8개 그대로(지우지 않음)',m);
 ok(m.rowTop!==null&&m.rowTop>=0&&m.rowBottom<=parseInt(m.vp.split('x')[1])+1,name+' 처음부터 시작: 영웅 줄이 스크롤 없이 화면 안',m);
 ok(m.visible>=need(parseInt(m.vp)),name+' 처음부터 시작: 화면 안에 보이는 영웅 칸 '+need(parseInt(m.vp))+'개 이상',m);
 ok(m.rowScrollable&&!m.docOverflowX,name+' 처음부터 시작: 넘치는 칸은 줄 안 가로 스크롤(화면 가로 넘침 없음)',m);
 if(name.includes('13 가로'))ok(m.ego===1&&m.egoVisible===1,name+' EGO 해금 시 EGO 칸도 화면 안',m);
 // 영웅 바꿔 고르기: 무대 이름 따라감(회귀)
 await p.locator('#panel button[data-hero="neon"]').click();await p.waitForTimeout(500);m=await measure(p);
 ok(m.sel==='neon'&&m.stageName.length>0&&m.stageName!=='환도',name+' 다른 영웅 누르면 선택·무대 바뀜',m);
 if(SH)await p.screenshot({path:SH+'/'+name.replace(/\s+/g,'_')+'-start.png'});
 if(name==='iPhone 13 가로'){
  await p.locator('#panel button[data-hero="hwando"]').click();await p.waitForTimeout(300);
  await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1500);
  await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();});await p.waitForTimeout(1000);await p.evaluate(()=>{if(modal)closePanel(true);});
  await p.evaluate(()=>showHeroes(false));await p.waitForTimeout(1500);m=await measure(p);
  ok(m.all===8&&m.rowTop>=0&&m.rowBottom<=parseInt(m.vp.split('x')[1])+1&&m.visible>=need(parseInt(m.vp)),name+' 거점 영웅 변경 창: 영웅 줄 화면 안',m);
  if(SH)await p.screenshot({path:SH+'/'+name.replace(/\s+/g,'_')+'-change.png'});
  await p.locator('#panel button[data-hero="seoha"]').click();await p.waitForTimeout(400);await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:60000});
  ok(await p.evaluate(()=>player.hero)==='seoha',name+' 변경 확정 동작(회귀)');}
 ok(errs.length===0,name+' 페이지 오류 0',errs);await ctx.close();}
// PC 회귀: 1280×720 은 예전 배치 그대로(무대가 영웅 줄 위) + 8칸 보임
{const {ctx,p,errs}=await boot({viewport:{width:1280,height:720}});const m=await measure(p);
 ok(m.visible===8&&m.stageBeforeRow,'PC 1280×720: 8칸 보임·무대가 줄 위(배치 그대로)',m);if(SH)await p.screenshot({path:SH+'/pc-start.png'});ok(errs.length===0,'PC 페이지 오류 0',errs);await ctx.close();}
await b.close();console.log(`\nR1106 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
