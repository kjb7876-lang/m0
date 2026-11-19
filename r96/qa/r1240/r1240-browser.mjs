// R1240 헤드리스 확인: 영웅 변경창에서 영웅 칸이 '큰 무대(고른 영웅 1명)' 아래로 밀려 안 보이고 눌리지 않던 문제(사용자 2026-11-19 "영웅변경할때 한영웅이미지만 크게나오면서 영웅변경이 안되는문제").
//  화면 크기마다 ① 처음부터 시작 줄 ② 게임 중 영웅 변경창(777 해금 → EGO 2D·3D·페르소나 칸 포함)의 모든 칸이 창 안 보이는 곳에 있고 그 자리를 누르면 그 칸이 맞는지,
//  ③ 실제 마우스로 칸을 누르고 '이 영웅으로 변경'을 눌러 모든 영웅(8명 + EGO 2D/3D + 페르소나)으로 바뀌는지 본다.
//  (헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1240/r1240-browser.mjs [크기,크기…]
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const SIZES=(process.argv[2]||'1366x640,1280x720,1920x900,740x360,390x844').split(',');const FULL=new Set((process.env.R1240_FULL||'1366x640').split(','));
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const b=await chromium.launch();
// 창 안 모든 영웅 칸(시작 줄·변경창 줄)과 확정 단추가 창의 보이는 범위 안에 있고, 칸 가운데를 누르면 그 칸이 맞는지
const layout=p=>p.evaluate(()=>{const P=document.getElementById('panel');if(!P)return null;const pr=P.getBoundingClientRect(),lo=Math.max(0,pr.top),hi=Math.min(innerHeight,pr.bottom),L=Math.max(0,pr.left),Rt=Math.min(innerWidth,pr.right);
 const row=P.querySelector('#heroRowR101 .heroRowR101')||P.querySelector('.cards');const cells=row?[...row.children].filter(c=>c.matches('button')):[];
 const vis=el=>{if(!el)return {ok:false};let r=el.getBoundingClientRect();/* 가로 띠(R1106) 안에서는 띠를 옮겨 보이는 칸으로 친다 */const sc=el.parentElement;if(sc&&sc.scrollWidth>sc.clientWidth+2){const s=sc.getBoundingClientRect();if(r.left<s.left||r.right>s.right){sc.scrollLeft+=r.left-s.left-8;r=el.getBoundingClientRect();}}
  const x=r.left+r.width/2,y=r.top+Math.min(r.height/2,24),hit=document.elementFromPoint(x,y);return {ok:r.top>=lo-1&&r.bottom<=hi+1&&r.left>=L-1&&r.right<=Rt+1&&!!hit&&el.contains(hit),top:r.top|0,bottom:r.bottom|0,x:x|0,y:y|0};};
 const name=c=>c.dataset.hero||(c.dataset.egoR1046?'ego2d':c.dataset.r1176==='3d'?'ego3d':c.dataset.personaR1113?'persona':'?');
 const go=P.querySelector('#chooseHero,#slotConfirmR73');
 return {panel:[lo|0,hi|0],cells:cells.map(c=>({id:name(c),...vis(c)})),go:go?{id:go.id,...vis(go)}:null,stage:(()=>{const s=document.getElementById('r263Stage');if(!s)return null;const r=s.getBoundingClientRect();return [r.top|0,r.bottom|0];})()};});
const state=p=>p.evaluate(()=>({hero:player.hero,ego:!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),persona:!!window.__STORYWORLD_PERSONA_HERO_R1113__?.formActive?.(),look:window.__STORYWORLD_EGO_FORM_R1176__?.look?.(),modal:!!modal,loading}));
for(const S of SIZES){const [W,H]=S.split('x').map(Number);const mobile=W<800;
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,hasTouch:mobile,isMobile:mobile});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:60000});await p.waitForTimeout(900);
 ok(await p.evaluate(()=>!!window.__STORYWORLD_HERO_FIT_R1240__),S+' R1240 모듈 실림');
 let L=await layout(p);ok(L&&L.cells.length>=8&&L.cells.every(c=>c.ok)&&L.go?.ok,S+' 처음부터 시작: 영웅 칸 8개·확정 단추가 모두 창 안에 보이고 눌림',L&&{panel:L.panel,stage:L.stage,bad:L.cells.filter(c=>!c.ok),go:L.go});
 await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();await p.waitForTimeout(1200);await skip();
 const settle=async()=>{for(let i=0,prev='';i<30;i++){await p.waitForTimeout(500);const L=await layout(p),k=JSON.stringify(L&&[L.stage,L.cells.map(c=>[c.id,c.top,c.bottom])]);if(L&&L.cells.length>=8&&L.cells.every(c=>c.bottom>c.top)&&k===prev)break;prev=k;}};
 const open=async()=>{await p.evaluate(()=>{if(modal)closePanel(true);window.__STORYWORLD_HERO_SELECT_R263__.open();});await p.waitForFunction(()=>document.querySelectorAll('#panel .cards > [data-persona-r1113],#panel .cards > [data-r1176="3d"]').length===2,null,{timeout:20000}).catch(()=>{});/* 헤드리스는 게임 틱이 느려 EGO·페르소나 칸 끼우기(0.25초 주기)와 맞춤(0.2초 주기)이 늦게 끝난다 — 칸 11개가 자리 잡고 두 번 잰 자리가 같을 때까지(최대 15초) */
  for(let i=0,prev='';i<30;i++){await p.waitForTimeout(500);const L=await layout(p),k=JSON.stringify(L&&[L.stage,L.cells.map(c=>[c.id,c.top,c.bottom])]);if(L&&L.cells.length===11&&L.cells.every(c=>c.bottom>c.top)&&k===prev)break;prev=k;}};
 await open();L=await layout(p);
 ok(L&&L.cells.length===11,S+' 영웅 변경창: 칸 11개(EGO 2D·3D + 8명 + 페르소나)',L&&L.cells.map(c=>c.id));
 ok(L&&L.cells.every(c=>c.ok)&&L.go?.ok,S+' 영웅 변경창: 모든 칸과 "이 영웅으로 변경"이 스크롤 없이 창 안에 보이고 그 자리를 누르면 그 칸',L&&{panel:L.panel,stage:L.stage,bad:L.cells.filter(c=>!c.ok),go:L.go});
 ok(L&&L.stage&&L.stage[1]-L.stage[0]>=90,S+' 고른 영웅 무대는 남아 있음(없애지 않음)',L&&L.stage);
 if(FULL.has(S)){
  const jumps=[];
  const want=['seoha','neon','michaela','lauren','hunter','slayer','gunner','hwando','persona','ego2d','ego3d','michaela'];
  for(const id of want){await open();const L2=await layout(p);const c=L2.cells.find(x=>x.id===id);if(!c||!c.ok){ok(false,S+' 실제 마우스로 '+id+' 칸 누르기',c);continue;}
   await p.mouse.click(c.x,c.y);await p.waitForTimeout(600);const L3=await layout(p);if(!L3?.go?.ok){ok(false,S+' '+id+' 고른 뒤 변경 단추 보임',L3?.go);continue;}
   jumps.push(Math.abs(L3.go.y-L2.go.y));
   await p.mouse.click(L3.go.x,L3.go.y);/* 페르소나·EGO 형상은 창이 닫힌 뒤 주기 점검(0.25초)에서 켜진다 — 기대 상태가 될 때까지 최대 12초 */await p.waitForFunction(id=>{if(modal||loading)return false;const e=!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),q=!!window.__STORYWORLD_PERSONA_HERO_R1113__?.formActive?.(),lk=window.__STORYWORLD_EGO_FORM_R1176__?.look?.();return id==='ego2d'?player.hero==='hwando'&&e&&lk==='2d':id==='ego3d'?player.hero==='hwando'&&e&&lk==='3d':id==='persona'?player.hero==='lauren'&&q:player.hero===id&&!e&&!q;},id,{timeout:12000}).catch(()=>{});const st=await state(p);
   const good=id==='ego2d'?st.hero==='hwando'&&st.ego&&st.look==='2d':id==='ego3d'?st.hero==='hwando'&&st.ego&&st.look==='3d':id==='persona'?st.hero==='lauren'&&st.persona:st.hero===id&&!st.ego&&!st.persona;
   ok(good&&!st.modal,S+' 실제 마우스로 '+id+' 칸 → 이 영웅으로 변경 → 그 영웅으로 바뀜',st);}
  ok(jumps.length>=10&&Math.max(...jumps)<=2,S+' 영웅 칸을 눌러도 "이 영웅으로 변경" 단추 자리가 그대로(창 내용이 위로 튀지 않음)',jumps);
  // 빠른 손: 히든 칸(페르소나·EGO)을 누르고 곧바로(0.05초) '이 영웅으로 변경' — 창이 다시 그려져 히든 칸이 아직 다시 안 끼워진 순간에도 그 히든 영웅으로
  for(const id of ['persona','ego2d']){await p.evaluate(()=>{player.hero='seoha';if(window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.())window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm?.(false);window.__STORYWORLD_PERSONA_HERO_R1113__?.setForm?.(false);});
   await open();const L2=await layout(p),c=L2.cells.find(x=>x.id===id);if(!c?.ok||!L2.go?.ok){ok(false,S+' 빠른 손 '+id+' 칸 보임',c);continue;}
   await p.mouse.click(c.x,c.y);await p.waitForTimeout(50);await p.mouse.click(L2.go.x,L2.go.y);
   await p.waitForFunction(id=>{if(modal||loading)return false;const e=!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),q=!!window.__STORYWORLD_PERSONA_HERO_R1113__?.formActive?.();return id==='persona'?player.hero==='lauren'&&q:player.hero==='hwando'&&e;},id,{timeout:12000}).catch(()=>{});
   const st=await state(p);ok(id==='persona'?st.hero==='lauren'&&st.persona:st.hero==='hwando'&&st.ego,S+' 빠른 손: '+id+' 칸 → 곧바로 변경 → 그 히든 영웅',st);}
  // 무대(큰 그림)를 눌러도 창이 깨지지 않고 영웅 칸이 그대로 보인다
  await open();const s0=await layout(p);await p.mouse.click(W/2,(s0.stage[0]+s0.stage[1])/2);await p.waitForTimeout(500);const s1=await layout(p);
  ok(s1&&s1.cells.every(c=>c.ok)&&s1.go?.ok,S+' 무대를 눌러도 영웅 칸·변경 단추는 그대로 보임',s1&&{bad:s1.cells.filter(c=>!c.ok)});
  // 창 크기를 줄였다 늘려도 맞춤이 따라감
  await p.setViewportSize({width:W,height:Math.max(560,H-80)});await settle();const r1=await layout(p);
  ok(r1&&r1.cells.every(c=>c.ok)&&r1.go?.ok,S+' 창 높이를 줄여도 모든 칸이 보임',r1&&{panel:r1.panel,bad:r1.cells.filter(c=>!c.ok)});
  await p.setViewportSize({width:W,height:H+300});await settle();const r2=await layout(p),nat=await p.evaluate(()=>{const pt=document.querySelector('#r263Stage .pt');return pt?pt.getBoundingClientRect().height|0:0;});
  ok(r2&&r2.cells.every(c=>c.ok)&&nat>=200,S+' 창을 키우면 무대 그림이 원래 크기로 돌아옴',{nat});
  await p.setViewportSize({width:W,height:H});
 }
 ok(errs.length===0,S+' 페이지 오류 0',errs);await ctx.close();}
await b.close();console.log(`\nR1240 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
