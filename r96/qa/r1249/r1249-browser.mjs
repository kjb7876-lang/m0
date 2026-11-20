// R1249·R1250 브라우저 검사(헤드리스 Chromium — 실기기·GPU·터치 감각 확인 아님).
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4396/ SW_SHOT=/tmp/r1249 node r96/qa/r1249/r1249-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SHOT=process.env.SW_SHOT||'';
let n=0,bad=0;const check=(m,c,d='')=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==''?' :: '+String(typeof d==='string'?d:JSON.stringify(d)).slice(0,300):''));};
const b=await chromium.launch();const window_HINT='바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기';
async function story(touch){const ctx=await b.newContext(touch?{viewport:{width:812,height:375},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:720}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof newGame==='function'&&window.__STORYWORLD_COMBAT_GUIDE_R1249__&&window.__STORYWORLD_PLAY_LOG_R1250__,null,{timeout:180000});
 await p.waitForFunction(()=>!loading,null,{timeout:180000});await p.waitForTimeout(1500);const title=await p.evaluate(()=>{const h=document.getElementById('hint');return {t:h?.textContent||'',fs:h?getComputedStyle(h).fontSize:''};});
 check((touch?'폰':'PC')+': 첫 화면 아래 줄 = '+(touch?'터치 안내':'키보드 안내'),touch?title.t===window_HINT:/방향키 이동/.test(title.t),title);
 await p.evaluate(()=>showHelp());await p.waitForTimeout(300);const help=await p.evaluate(()=>{const g=document.querySelector('#panel .keygrid');return g?[g.children[0]?.textContent,g.children[1]?.textContent]:null;});
 check((touch?'폰':'PC')+': 도움말 첫 줄 '+(touch?'= 터치 조작':'= 키 표 그대로'),touch?help&&help[0]==='터치'&&help[1]===window_HINT:help&&help[0]!=='터치',help);await p.evaluate(()=>closePanel(true));await p.waitForTimeout(300);
 await p.evaluate(async()=>{await newGame('hwando');});await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();});
 await p.evaluate(()=>enterRegion('dist00',null,{restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();});
 return {ctx,p,errs};}
const gameWait=(p,s)=>p.evaluate(s=>new Promise(r=>{const t=time;const w=()=>time>t+s?r():setTimeout(w,100);w();}),s).catch(()=>{});
const toNearest=p=>p.evaluate(()=>{const e=room.enemies.filter(e=>e.hp>0&&!e.ally).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(!e)return false;
 for(const [dx,dy] of [[2.5,0],[-2.5,0],[0,2.5],[0,-2.5],[2,2]]){if(typeof blocked!=='function'||!blocked(e.x+dx,e.y+dy,.3,room)){player.x=e.x+dx;player.y=e.y+dy;return true;}}player.x=e.x+2.5;player.y=e.y;return true;});
for(const touch of [true,false]){const T=touch?'폰':'PC';const {ctx,p,errs}=await story(touch);
 await p.evaluate(()=>{window.__r1249hurt=hurt;hurt=function(){return 'ignored';};});/* 헤드리스는 느려 영웅이 죽으면 다시 불러져 상태가 리셋된다 */
 const before=await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.inspect().stats.hints);
 check(`${T}: 첫 전투 지역 들어와 적과 멀면 아직 안내 없음`,before===0,before);
 await toNearest(p);await gameWait(p,1.5);await p.waitForTimeout(1200);
 const g=await p.evaluate(()=>({hints:window.__STORYWORLD_COMBAT_GUIDE_R1249__.inspect().stats.hints,toast:document.getElementById('toast')?.textContent||'',saved:localStorage.getItem('storyworld.r1249.guide')}));
 if(touch){check(`${T}: 적이 가까워지면 '바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기' 한 번`,g.hints===1&&g.toast.includes('바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기'),g);
  if(SHOT)await p.screenshot({path:SHOT+'-phone-hint.png'});}
 else{check(`${T}: 새 안내 없음(키보드 안내 그대로)`,g.hints===0&&!g.toast.includes('바닥을 탭해'),g);
  const keys=await p.evaluate(()=>[...document.querySelectorAll('kbd,.r93-key,[class*=key]')].map(e=>e.textContent.trim()).filter(Boolean).slice(0,12));check(`${T}: 기술 칸 키 글자(A/J/1 등) 그대로`,keys.some(k=>/A\s*\/\s*J|S\s*\/\s*2/.test(k)),keys);}
 // 위험 경계: 영웅 둘레에 경고 중인 예고를 놓고 기술을 써서 큰 이펙트를 겹친다
 if(!touch){await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0);hazards.push({id:++uid,type:'field',owner:e?.id,x:player.x,y:player.y,radius:2.2,age:0,warning:60,life:61,asset:VFX.cross,damage:1});});
  const d0=await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.inspect().stats);
  for(const k of ['KeyQ','KeyW','KeyE','KeyR','KeyD']){await p.keyboard.press(k);await gameWait(p,.25);}
  await gameWait(p,1);const d1=await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.inspect());
  check(`${T}: 실제 렌더러에서 예고(위험 경계)를 잡음`,d1.stats.dangers>d0.dangers,{d0,d1:d1.stats});
  check(`${T}: 예고를 덮은 영웅 쪽 큰 이펙트를 옅게 함(최소 1번)`,d1.stats.veiled>d0.veiled,{veiled:d1.stats.veiled,last:d1.lastVeiled});
  if(SHOT){await p.evaluate(()=>{window.__r1249tick=1e-4;});await p.screenshot({path:SHOT+'-pc-veil-on.png'});await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.set({edge:false}));await p.waitForTimeout(400);await p.screenshot({path:SHOT+'-pc-veil-off.png'});await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.set({edge:true}));}
  check(`${T}: 오류 0`,(await p.evaluate(()=>window.__STORYWORLD_COMBAT_GUIDE_R1249__.inspect().stats.errors))===0);}
 // 플레이 기록
 const L=await p.evaluate(()=>window.__STORYWORLD_PLAY_LOG_R1250__.current());
 check(`${T}: 플레이 기록 = 스토리·환도, 교전 시간 > 0`,L&&L.mode==='story'&&L.hero==='hwando'&&L.combatSecs>0,L);
 if(!touch)check(`${T}: 영웅 둘레 예고가 회피 판정 대상으로 잡히는 중`,(await p.evaluate(()=>window.__STORYWORLD_PLAY_LOG_R1250__.inspect().tracking))>=1);
 await p.evaluate(()=>showSettings());await p.waitForTimeout(500);
 const sec=await p.evaluate(()=>{const d=document.getElementById('playLogR1250');return d?{text:d.textContent.slice(0,200)}:null;});
 check(`${T}: 설정 창에 '플레이 기록(난이도 측정)' 칸`,sec&&/플레이 기록/.test(sec.text)&&/스토리/.test(sec.text),sec);
 if(SHOT){await p.evaluate(()=>{const d=document.getElementById('playLogR1250');if(d){d.open=true;d.scrollIntoView();}});await p.waitForTimeout(300);await p.screenshot({path:SHOT+'-'+(touch?'phone':'pc')+'-playlog.png'});}
 check(`${T}: 페이지 오류 0`,errs.length===0,errs);await ctx.close();}
await b.close();console.log(`R1249 browser ${bad?'FAILED':'PASSED'} ${n-bad}/${n}`);process.exit(bad?1:0);
