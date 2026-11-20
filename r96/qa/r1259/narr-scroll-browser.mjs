// R1259 브라우저 검사(헤드리스): 서사 글을 내려 읽는 창의 스크롤바가 브라우저 기본 굵은 막대가 아니라 얇고 은은한 수묵 막대인지,
//  남은 글은 위/아래 페이드로 보이는지, 스크롤·휠·한 장 넘기기 동작과 서사 글은 그대로인지.
//  사용자 2026-11-20 "서사텍스트 내릴때 휠나오는 부분개선해줘 디자인".
//  대상: 쪽지 창(#r177Doc 한 장씩 .pg / 한 번에 보기), 서사 창(#panel .storyText), 쪽지 모음(#panel 자체), 사몽 기록(#r103RecBody 는 .storyText).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=경로앞부분] node r96/qa/r1259/narr-scroll-browser.mjs
//  헤드리스라 실기기·GPU·터치 감각 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
let n=0,bad=0;const check=(m,ok,d)=>{n++;if(!ok)bad++;console.log((ok?'PASS ':'FAIL ')+m+(!ok&&d!==undefined?' :: '+JSON.stringify(d):''));};
const LONG=Array.from({length:14},(_,i)=>(i+1)+'번째 문단. 복도 끝의 형광등이 깜빡일 때마다 나는 내 발소리가 아닌 다른 발소리를 세었다. 숫자는 늘 하나씩 모자랐다.').join('\n\n');
// Playwright 헤드리스는 기본으로 스크롤바를 숨긴다(--hide-scrollbars) → 실제 PC 처럼 막대가 보이게 끈다
const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const errors=[];
async function boot(vp,init){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});
 await ctx.addInitScript(i=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(i)for(const[k,v]of Object.entries(i))localStorage.setItem(k,v);},init||null);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 // 쪽지 창은 창(modal)이 열려 있으면 숨으므로 무한 생존을 켜서 게임 화면에서 잰다(R1141 검사와 같은 길)
 await p.locator('#survivalStartR600').waitFor({timeout:180000});await p.waitForTimeout(800);await p.locator('#survivalStartR600').click();await p.waitForTimeout(800);
 await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();try{if(modal)closePanel();}catch(_){}});await p.waitForTimeout(400);
 await p.waitForFunction(()=>!!window.__STORYWORLD_STORY_COLLECT_R177__&&typeof openPanel==='function'&&!modal,null,{timeout:60000});return {ctx,p};}
// 스크롤바 굵기 = 바깥 너비 − 안쪽 너비 − 좌우 테두리
const bar=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const cs=getComputedStyle(e);
 const mask=(cs.maskImage&&cs.maskImage!=='none'?cs.maskImage:(cs.webkitMaskImage||'none'));
 return {w:e.offsetWidth-e.clientWidth-parseFloat(cs.borderLeftWidth)-parseFloat(cs.borderRightWidth),over:e.scrollHeight-e.clientHeight,top:e.scrollTop,mask,
  fade:e.getAttribute('data-r1259fade')||'',mode:e.getAttribute('data-r1259m')||'',text:e.textContent,
  veil:['::before','::after'].map(ps=>{const c=getComputedStyle(e,ps);return {op:c.opacity,img:c.borderImageSource||'none',pos:c.position};})};},sel);
// 페이드가 실제로 그려지는가: 바탕 없는 칸은 mask 그라데이션, 종이 바탕 칸은 위(::before)·아래(::after) 붙박이 베일의 그라데이션이 보임
const fadeOf=m=>{if(/gradient/.test(m.mask))return true;if(m.mode!=='veil')return false;
 const need=[m.fade==='top'||m.fade==='both',m.fade==='bot'||m.fade==='both'];
 return need.some(Boolean)&&need.every((nd,i)=>!nd||(m.veil[i].op==='1'&&/gradient/.test(m.veil[i].img)&&m.veil[i].pos==='sticky'));};
async function scrollTo(p,sel,y){await p.evaluate(([s,y])=>{const e=document.querySelector(s);e.scrollTop=y==='end'?e.scrollHeight:y;e.dispatchEvent(new Event('scroll'));},[sel,y]);await p.waitForTimeout(120);}

for(const [label,vp] of [['PC 1280×720',{width:1280,height:720}],['폰 가로 844×390',{width:844,height:390}]]){
 const {ctx,p}=await boot(vp);
 check(label+': API __STORYWORLD_NARR_SCROLL_R1259__ 이 있음',await p.evaluate(()=>!!window.__STORYWORLD_NARR_SCROLL_R1259__));
 // ① 쪽지 창 — 한 장씩 넘기기(기본) : .pg 가 넘치면 스크롤
 await p.evaluate(t=>{const V=window.__STORYWORLD_STORY_COLLECT_R177__;V.set?.({pages:true,autoShow:true,secs:60});V.show({form:'note',title:'시험 쪽지',narr:'나',text:t},{force:true});},LONG);
 await p.waitForSelector('#r177Doc:not([hidden])');
 // 한 장에 들어갈 만큼만 넣으므로, 넘침을 만들려고 장 높이를 낮춘다(글은 그대로)
 await p.evaluate(()=>{const g=document.querySelector('#r177Doc .pg');if(g)g.style.maxHeight='90px';});
 // 페이드 표시는 스크롤 때 바로, 처음 열릴 땐 0.3초 주기로 잰다 — 헤드리스는 느려서 3초까지 기다림
 await p.waitForFunction(()=>document.querySelector('#r177Doc .pg')?.hasAttribute('data-r1259fade'),null,{timeout:3000}).catch(()=>{});
 let m=await bar(p,'#r177Doc .pg');
 check(label+': 쪽지 한 장(.pg)이 넘침',m&&m.over>20,m&&{over:m.over});
 check(label+': 쪽지 한 장 스크롤바 굵기 1~5px(기본 막대 아님)',m&&m.w>=1&&m.w<=5,m&&m.w);
 check(label+': 맨 위에선 아래 페이드만',m&&m.fade==='bot'&&fadeOf(m),m&&{fade:m.fade,mask:m.mask.slice(0,80)});
 if(SHOT)await p.screenshot({path:SHOT+'-'+vp.width+'-doc.png'});
 await scrollTo(p,'#r177Doc .pg',40);m=await bar(p,'#r177Doc .pg');
 check(label+': 가운데에선 위·아래 페이드',m&&m.top>0&&m.fade==='both'&&fadeOf(m),m&&{top:m.top,fade:m.fade});
 await scrollTo(p,'#r177Doc .pg','end');m=await bar(p,'#r177Doc .pg');
 check(label+': 맨 아래에선 위 페이드만',m&&m.fade==='top'&&fadeOf(m),m&&{fade:m.fade});
 const pg0=await p.evaluate(()=>document.querySelector('#r177Doc .foot')?.textContent||'');
 await p.hover('#r177Doc');await p.mouse.wheel(0,200);await p.waitForTimeout(250);
 const pg1=await p.evaluate(()=>document.querySelector('#r177Doc .foot')?.textContent||'');
 check(label+': 한 장 넘기기(휠 = 다음 장) 그대로',pg0!==pg1,{pg0,pg1});
 await p.evaluate(()=>{document.querySelector('#r177Doc [data-r182="close"]')?.click();});await p.waitForTimeout(200);
 // ② 쪽지 창 — 넘기기 끔(한 번에 보기): 창 자체가 스크롤
 await p.evaluate(t=>{const V=window.__STORYWORLD_STORY_COLLECT_R177__;V.set?.({pages:false});V.show({form:'shard',title:'시험 기억',narr:'나',text:t},{force:true});},LONG);
 await p.waitForSelector('#r177Doc:not([hidden])');await p.waitForFunction(s=>document.querySelector(s)?.hasAttribute('data-r1259fade'),'#r177Doc',{timeout:3000}).catch(()=>{});
 m=await bar(p,'#r177Doc');
 check(label+': 한 번에 보기 쪽지가 넘침',m&&m.over>20,m&&{over:m.over});
 check(label+': 한 번에 보기 쪽지 스크롤바 1~5px',m&&m.w>=1&&m.w<=5,m&&m.w);
 check(label+': 한 번에 보기 쪽지 아래 페이드',m&&m.fade==='bot'&&fadeOf(m),m&&{fade:m.fade});
 const t0=m&&m.top;await p.hover('#r177Doc');await p.mouse.wheel(0,160);
 // 게임이 도는 동안(창 없음) 헤드리스 1280 은 주 스레드가 바빠 휠 스크롤이 늦게 닿는다 → 6초까지 기다림
 await p.waitForFunction(t=>document.getElementById('r177Doc').scrollTop>t,t0,{timeout:6000}).catch(()=>{});m=await bar(p,'#r177Doc');
 check(label+': 휠로 내려 읽기 그대로',m&&m.top>t0,m&&{t0,top:m.top});
 check(label+': 쪽지 글이 바뀌지 않음',m&&m.text.includes('14번째 문단.')&&m.text.includes('숫자는 늘 하나씩 모자랐다.'));
 if(SHOT)await p.screenshot({path:SHOT+'-'+vp.width+'-doc-all.png'});
 await p.evaluate(()=>{document.getElementById('r177Doc')?.click();});await p.waitForTimeout(200);
 // ③ 서사 창(#panel .storyText)
 await p.evaluate(t=>{openPanel('<h2>서사</h2><div class="storyText">'+t.split('\n\n').map(x=>'<p>'+x+'</p>').join('')+'</div>');},LONG);await p.waitForFunction(s=>document.querySelector(s)?.hasAttribute('data-r1259fade'),'#panel .storyText',{timeout:3000}).catch(()=>{});
 m=await bar(p,'#panel .storyText');
 check(label+': 서사 창 글이 넘침',m&&m.over>20,m&&{over:m.over});
 check(label+': 서사 창 스크롤바 1~5px',m&&m.w>=1&&m.w<=5,m&&m.w);
 check(label+': 서사 창 아래 페이드',m&&m.fade==='bot'&&fadeOf(m),m&&{fade:m.fade});
 const s0=m&&m.top;await p.hover('#panel .storyText');await p.mouse.wheel(0,160);
 await p.waitForFunction(t=>document.querySelector('#panel .storyText').scrollTop>t,s0,{timeout:6000}).catch(()=>{});await p.waitForTimeout(150);m=await bar(p,'#panel .storyText');
 check(label+': 서사 창 휠 스크롤 그대로',m&&m.top>s0,m&&{s0,top:m.top});
 check(label+': 서사 창 위 페이드 생김',m&&(m.fade==='both'||m.fade==='top'),m&&{fade:m.fade});
 if(SHOT)await p.screenshot({path:SHOT+'-'+vp.width+'-panel.png'});
 // ④ 창(#panel) 자체가 넘칠 때(쪽지 모음 등)
 await p.evaluate(t=>{openPanel('<h2>쪽지 모음</h2>'+Array.from({length:40},(_,i)=>'<p>'+i+' '+t.slice(0,60)+'</p>').join(''));},LONG);await p.waitForTimeout(250);
 m=await bar(p,'#panel');
 check(label+': 창(#panel)이 넘침',m&&m.over>20,m&&{over:m.over});
 check(label+': 창(#panel) 스크롤바 1~5px',m&&m.w>=1&&m.w<=5,m&&m.w);
 // ⑤ 넘치지 않는 짧은 글은 페이드 없음
 await p.evaluate(()=>{openPanel('<div class="storyText"><p>짧은 글.</p></div>');});await p.waitForTimeout(900);
 m=await bar(p,'#panel .storyText');
 check(label+': 짧은 글은 페이드·가림 없음',m&&m.over<=0&&m.fade===''&&!fadeOf(m),m&&{over:m.over,fade:m.fade,mask:m.mask.slice(0,60)});
 await p.evaluate(()=>{try{closePanel?.();}catch(_){}});
 await ctx.close();
}
// ⑥ 한지(밝은 종이) 바탕에서도 막대가 얇음
{const {ctx,p}=await boot({width:1280,height:720},{'storyworld.r1086.hanji':'1'});
 await p.evaluate(t=>{openPanel('<div class="storyText">'+t.split('\n\n').map(x=>'<p>'+x+'</p>').join('')+'</div>');},LONG);
 await p.waitForFunction(()=>document.querySelector('#panel .storyText')?.hasAttribute('data-r1259fade'),null,{timeout:5000}).catch(()=>{});
 const m=await bar(p,'#panel .storyText');
 check('한지 바탕: 서사 창 스크롤바 1~5px',m&&m.w>=1&&m.w<=5,m&&m.w);
 await ctx.close();}
check('페이지 오류 없음',errors.length===0,errors.slice(0,3));
await b.close();
console.log(`${n-bad}/${n} 통과`);process.exit(bad?1:0);
