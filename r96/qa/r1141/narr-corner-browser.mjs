// R1141 브라우저 검사(헤드리스): 서사 글이 오른쪽 아래 상자에만 나오고, 설정 맨 위 '서사 텍스트' 단추로 끄고 켜는지.
//  무한 생존을 폰 세로 390×844(아이폰), 폰 가로 844×390, PC 1280×720 에서 켜고 잰다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=경로앞부분] node r96/qa/r1141/narr-corner-browser.mjs
//  헤드리스라 실기기·GPU·터치 감각 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''&&!ok?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
async function survival(vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.locator('#survivalStartR600').waitFor({timeout:180000});await p.waitForTimeout(800);await p.locator('#survivalStartR600').click();await p.waitForTimeout(800);
 await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();});return {ctx,p};}
const waitSubs=p=>p.waitForFunction(()=>document.getElementById('r600Subs')?.classList.contains('on')&&(document.querySelector('#r600Subs .t')?.textContent||'').length>0,null,{timeout:240000}).then(()=>true).catch(()=>false);
const snap=p=>p.evaluate(()=>{const R=e=>{if(!e)return null;const cs=getComputedStyle(e);if(cs.display==='none'||e.hidden)return null;const r=e.getBoundingClientRect();return r.width>1&&r.height>1?{l:r.left,t:r.top,r:r.right,b:r.bottom}:null;};
 const box=document.getElementById('r1141Narr'),A=window.__STORYWORLD_NARR_CORNER_R1141__;
 const subsT=(document.querySelector('#r600Subs .t')?.textContent||'').trim();
 return {api:!!A,box:R(box),boxOn:!!box&&box.classList.contains('on')&&!box.hidden&&getComputedStyle(box).opacity!=='0',boxText:(box?.querySelector('.t')?.textContent||'').trim(),subsT,
  subsVis:(()=>{const e=document.getElementById('r600Subs');return e?getComputedStyle(e).visibility:'missing';})(),
  noteVis:(()=>{const e=document.getElementById('r331BgmNote');return e?getComputedStyle(e).visibility:'missing';})(),
  hero:R(document.getElementById('heroCard')),btns:['touchActionsR100','touchUse','r1124TouchHomeBtn'].map(id=>R(document.getElementById(id))).filter(Boolean),
  shelf:R(document.getElementById('noticeShelfR63R2')),hotbar:R(document.querySelector('footer .hotbar')),footRight:R(document.querySelector('footer .footRight')),footer:R(document.querySelector('footer')),
  W:innerWidth,H:innerHeight,err:A?A.inspect().lastError:'no api'};});
// 상자는 150ms 마다 원래 자막을 따라간다(헤드리스는 타이머가 느리다) → 상자 글이 자막과 같아지고 다 나타날 때까지 기다린다
const waitBox=p=>p.waitForFunction(()=>{const x=document.getElementById('r1141Narr'),t=(document.querySelector('#r600Subs .t')?.textContent||'').trim();return !!x&&!x.hidden&&x.classList.contains('on')&&getComputedStyle(x).opacity==='1'&&(x.querySelector('.t')?.textContent||'').trim()===t&&t.length>0;},null,{timeout:30000}).then(()=>true).catch(()=>false);
const inter=(a,b)=>!!a&&!!b&&a.l<b.r-.5&&b.l<a.r-.5&&a.t<b.b-.5&&b.t<a.b-.5;
async function corner(T,p,phone){
 const got=await waitSubs(p);check(`${T}: 생존 서사 자막이 나옴(검사 전제)`,got);
 await waitBox(p);const s=await snap(p);if(SHOT)await p.screenshot({path:SHOT+'-'+T+'.png'});
 check(`${T}: R1141 모듈이 읽힘`,s.api&&!s.err,JSON.stringify(s.err));
 check(`${T}: 오른쪽 아래 상자에 서사 글이 나옴`,s.boxOn&&!!s.box,JSON.stringify(s.box));
 check(`${T}: 상자 글이 원래 서사 글과 같음(내용 그대로)`,s.boxText&&s.boxText===s.subsT,s.boxText+' / '+s.subsT);
 check(`${T}: 원래 가운데·아래 자막 칸은 감춤`,s.subsVis==='hidden',s.subsVis);
 check(`${T}: 위쪽 곡 소개 쪽지도 화면 위에 안 뜸`,s.noteVis==='hidden'||s.noteVis==='missing',s.noteVis);
 const bx=s.box;
 check(`${T}: 상자가 오른쪽 아래(가로 가운데보다 오른쪽, 세로 아래 1/3)`,bx&&(bx.l+bx.r)/2>s.W*0.5&&bx.t>=s.H*0.6,JSON.stringify(bx));
 check(`${T}: 상자가 화면 안`,bx&&bx.l>=0&&bx.r<=s.W&&bx.b<=s.H,JSON.stringify(bx));
 check(`${T}: 상자가 회피·배치·본진 단추와 안 겹침`,bx&&!s.btns.some(x=>inter(bx,x)),JSON.stringify({bx,btns:s.btns}));
 if(phone){check(`${T}: 상자가 HP·MP 구슬 카드와 안 겹침`,bx&&!inter(bx,s.hero),JSON.stringify({bx,hero:s.hero}));
  check(`${T}: 상자가 아래 키 안내줄과 안 겹침`,bx&&!inter(bx,s.shelf),JSON.stringify({bx,shelf:s.shelf}));}
 else check(`${T}: 상자가 아래 단축칸·패시브 강화 줄과 안 겹침`,bx&&!inter(bx,s.hotbar)&&!inter(bx,s.footRight)&&!inter(bx,s.footer),JSON.stringify({bx,f:s.footer}));
 check(`${T}: 상자가 화면 가운데(전투 자리)를 덮지 않음`,bx&&!inter(bx,{l:s.W*0.3,t:s.H*0.2,r:s.W*0.7,b:s.H*0.62}),JSON.stringify(bx));
 // 설정: 맨 위 '서사 텍스트' 단추
 await p.evaluate(()=>showSettings());await p.waitForTimeout(800);if(SHOT)await p.screenshot({path:SHOT+'-'+T+'-settings.png'});
 const st=await p.evaluate(()=>{const b=document.getElementById('r1141NarrBtn'),P=document.getElementById('panel');if(!b||!P)return null;const r=b.getBoundingClientRect(),pr=P.getBoundingClientRect(),h=P.querySelector('h2').getBoundingClientRect(),c=document.getElementById('settingsClose')?.getBoundingClientRect();
  const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
  return {txt:b.textContent,pressed:b.getAttribute('aria-pressed'),top:r.top-pr.top,vis:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight,onTop:!!hit&&(hit===b||b.contains(hit)),
   overClose:!!c&&r.right>c.left&&r.left<c.right&&r.top<c.bottom&&c.top<r.bottom,overTitle:r.left<h.left+60&&r.top<h.bottom&&h.top<r.bottom,
   first:(()=>{const kids=[...P.children].filter(e=>e.checkVisibility()&&!/^(H2|BUTTON)$/.test(e.tagName)&&!e.classList.contains('eyebrow'));return kids[0]?.id;})()};});
 check(`${T} 설정: 맨 위 제목 줄에 '서사 텍스트 켜짐' 단추가 바로 보임`,st&&st.vis&&st.onTop&&st.top<90&&/서사 텍스트 켜짐/.test(st.txt)&&st.pressed==='true',JSON.stringify(st));
 check(`${T} 설정: 단추가 닫기·제목을 가리지 않음`,st&&!st.overClose&&!st.overTitle,JSON.stringify(st));
 check(`${T} 설정: R1021 스킬창이 여전히 맨 위 묶음`,st&&st.first==='r1021Skills',JSON.stringify(st));
 await p.locator('#r1141NarrBtn').click();await p.waitForTimeout(300);
 const off=await p.evaluate(()=>({txt:document.getElementById('r1141NarrBtn').textContent,saved:JSON.parse(localStorage.getItem('storyworld.r1021.combat')||'{}').subs,cb:document.querySelector('#combatScreenR1021 input[data-r1021="subs"]')?.checked}));
 check(`${T} 설정: 누르면 '꺼짐'·저장·R1021 서사 자막 칸도 꺼짐`,/꺼짐/.test(off.txt)&&off.saved===false&&off.cb===false,JSON.stringify(off));
 await p.evaluate(()=>closePanel(true));const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+1.5,t0,{timeout:120000}).catch(()=>{});
 const s2=await snap(p);
 check(`${T}: 끄면 상자도 원래 자막도 안 보임`,!s2.boxOn&&s2.subsVis!=='visible',JSON.stringify({on:s2.boxOn,v:s2.subsVis}));
 await p.evaluate(()=>showSettings());await p.waitForTimeout(600);await p.locator('#r1141NarrBtn').click();await p.waitForTimeout(200);
 const back=await p.evaluate(()=>({txt:document.getElementById('r1141NarrBtn').textContent,saved:JSON.parse(localStorage.getItem('storyworld.r1021.combat')||'{}').subs}));
 check(`${T} 설정: 다시 누르면 '켜짐'으로 돌아옴`,/켜짐/.test(back.txt)&&back.saved===true,JSON.stringify(back));
 await p.evaluate(()=>closePanel(true));await p.waitForTimeout(200);
 const got2=await waitSubs(p);await waitBox(p);const s3=await snap(p);
 check(`${T}: 다시 켜면 상자에 서사 글이 다시 나옴`,got2&&s3.boxOn&&s3.boxText===s3.subsT,JSON.stringify({on:s3.boxOn,t:s3.boxText}));}
for(const [T,vp,touch] of [['폰세로',{width:390,height:844},true],['PC',{width:1280,height:720},false],['폰가로',{width:844,height:390},true]]){
 const {ctx,p}=await survival(vp,touch);try{await corner(T,p,touch);}catch(e){check(T+': 예외 없이 끝남',false,String(e).slice(0,200));}await ctx.close();}
check('페이지 오류 없음',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const bad=res.filter(r=>!r.ok).length;console.log((bad?'R1141 BROWSER FAILED ':'R1141 BROWSER PASSED ')+(res.length-bad)+'/'+res.length);process.exit(bad?1:0);
