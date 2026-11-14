// R1021 브라우저 검사(헤드리스): 전투 화면 집중 — 무한 생존을 폰 세로 375×812 와 PC 1280×720 에서 켜고 잰다.
//  사용자 2026-11-14: 가운데 체력바로 정화 구슬 체력 알게, 위쪽 황금실 메뉴 삭제, 아래 동그라미는 켜고 끌 수 있게, 서사 텍스트 켜고 끄기(PC 생존 포함),
//  오른쪽 아래 것 제거, 영웅 배치 단추 하나 + 블링크만 남기고 나머지는 자동 발동, 설정 들어가면 바로 스킬창.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1021/r1021-browser.mjs
//  헤드리스라 실기기·GPU·터치 감각 확인은 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const SHOT=process.env.SW_SHOT||'';
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const b=await chromium.launch();const errors=[];
const VIS=e=>{if(!e)return false;if(e.checkVisibility&&!e.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true,opacityProperty:true}))return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
async function survival(vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e).slice(0,200)));await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.locator('#survivalStartR600').waitFor({timeout:180000});await p.waitForTimeout(800);await p.locator('#survivalStartR600').click();await p.waitForTimeout(800);
 await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();});
 // 게임 시간으로 3초 흐르기를 기다린다(헤드리스는 느리다)
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+3,t0,{timeout:180000}).catch(()=>{});return {ctx,p};}
const isVis=(p,sel)=>p.evaluate(([s,f])=>{const V=eval(f);return V(document.querySelector(s));},[sel,'('+VIS+')']);
const touchLabels=p=>p.evaluate(f=>{const V=eval(f);return [...document.querySelectorAll('#touchActionsR100 button')].filter(V).map(e=>e.getAttribute('aria-label')||e.textContent.trim());},'('+VIS+')');
const api=p=>p.evaluate(()=>{const a=window.__STORYWORLD_UI_COMBAT_R1021__;return a?a.inspect():null;});
async function openSettings(p){await p.evaluate(()=>{showSettings();});await p.waitForTimeout(600);}
async function setPref(p,k,v){await p.evaluate(([k,v])=>{const i=document.querySelector('#combatScreenR1021 input[data-r1021="'+k+'"]');if(!i)throw Error('no toggle '+k);if(i.checked!==v){i.checked=v;i.dispatchEvent(new Event('change',{bubbles:true}));}},[k,v]);await p.waitForTimeout(200);}
async function common(tag,p,phone){
 check(`${tag}: R1021 모듈이 켜져 있음`,!!(await api(p))?.on,JSON.stringify(await api(p)));
 // ② 위쪽: 황금실 제작·연속 줄 없음(메뉴 R339 묶음에는 그대로 있음)
 check(`${tag} 위쪽: 황금실 제작·연속 단추 줄이 안 보임`,!(await isVis(p,'#goldHudR72')));
 // ① 가운데: 구슬 위 체력 막대에 '정화 구슬 n/m' 이름표, 위쪽 중복 막대는 숨김
 const s0=await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreLabel||0);
 await p.evaluate(()=>{const t=time;return new Promise(r=>{const w=()=>time>t+.5?r():setTimeout(w,100);w();});});
 const s1=await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreLabel||0);
 check(`${tag} 가운데: 정화 구슬 체력 막대에 이름표(정화 구슬 n/m)를 그림`,s1>s0&&s1>0,s0+' → '+s1);
 check(`${tag} 가운데: 막대 글이 실제 체력과 맞음`,await p.evaluate(()=>{const L=window.__STORYWORLD_SURVIVAL_R600__.inspect().coreLabelText||'';return /^정화 구슬 \d+\/\d+$/.test(L);}),await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().coreLabelText));
 check(`${tag} 위쪽: 생존 글줄은 남고 위쪽 구슬 막대(중복)는 숨김`,(await isVis(p,'#r600Hud .s'))&&!(await isVis(p,'#r600Hud .c')));
 // ④ 서사 자막 끄기·켜기
 await openSettings(p);if(SHOT)await p.screenshot({path:SHOT+'-'+(phone?'phone':'pc')+'-settings.png'});
 const sk=await p.evaluate(f=>{const V=eval(f);const s=document.getElementById('r1021Skills'),panel=document.getElementById('panel');if(!s)return null;
  const first=[...panel.children].filter(V).filter(e=>!/^(H2|BUTTON)$/.test(e.tagName)&&!e.classList.contains('eyebrow'))[0];return {vis:V(s),first:first===s,text:s.textContent};},'('+VIS+')');
 check(`${tag} 설정: 들어가면 바로 스킬창이 맨 위에 보임`,sk&&sk.vis&&sk.first,JSON.stringify(sk&&{vis:sk.vis,first:sk.first}));
 check(`${tag} 설정 스킬창: 영웅·Q 기술 이름·패시브·EGO·회피가 적힘`,sk&&['환도','정화 연참','EGO','회피','세 번째 베기'].every(w=>sk.text.includes(w)),sk&&sk.text.slice(0,240));
 check(`${tag} 설정 스킬창: 무엇이 자동인지 적힘`,sk&&/자동/.test(sk.text));
 const sec=await p.evaluate(()=>{const s=document.getElementById('combatScreenR1021');return s?{title:s.querySelector('h3')?.textContent||'',keys:[...s.querySelectorAll('input[data-r1021]')].map(i=>i.dataset.r1021)}:null;});
 check(`${tag} 설정: '전투 화면' 묶음에 서사 자막 켜고 끄기`,sec&&/전투 화면/.test(sec.title)&&sec.keys.includes('subs'),JSON.stringify(sec));
 if(phone)check(`${tag} 설정: 폰은 화면 단추·자동 발동 켜고 끄기도 있음`,sec&&sec.keys.includes('buttons')&&sec.keys.includes('autoSkills'),JSON.stringify(sec));
 await setPref(p,'subs',false);
 const off=await p.evaluate(()=>{const e=document.getElementById('r600Subs');return {cls:document.body.classList.contains('r1021SubsOff'),d:e?getComputedStyle(e).display:'missing'};});
 check(`${tag} 서사 자막 끄면: 생존 서사 글(r600Subs)이 숨음`,off.cls&&off.d==='none',JSON.stringify(off));
 check(`${tag} 서사 자막 끄기가 저장됨`,await p.evaluate(()=>JSON.parse(localStorage.getItem('storyworld.r1021.combat')||'{}').subs===false));
 await setPref(p,'subs',true);
 const on=await p.evaluate(()=>{const e=document.getElementById('r600Subs');return {cls:document.body.classList.contains('r1021SubsOff'),d:e?getComputedStyle(e).display:'missing'};});
 check(`${tag} 서사 자막 다시 켜면: 다시 보일 수 있음`,!on.cls&&on.d!=='none',JSON.stringify(on));
 await p.evaluate(()=>closePanel(true));await p.waitForTimeout(300);}
// ---- 폰 ----
{const {ctx,p}=await survival({width:375,height:812},true);const T='폰';
 if(SHOT)await p.screenshot({path:SHOT+'-phone.png'});
 const L=await touchLabels(p);check(`${T} 아래 단추: 회피·영웅 배치 둘만(기술·EGO 는 자동)`,L.length===2&&L.includes('회피')&&L.includes('영웅 배치'),JSON.stringify(L));
 check(`${T} 오른쪽 아래: '이전 시작점' 같은 상호작용 단추가 생존에서 안 보임`,!(await isVis(p,'#touchUse')));
 const ov=await p.evaluate(()=>{const s=document.querySelector('#r600Subs .w'),t=document.getElementById('touchActionsR100');if(!s||!t)return 'missing';const a=s.getBoundingClientRect(),b=t.getBoundingClientRect();return {subsRight:a.right|0,btnLeft:b.left|0};});
 check(`${T} 자막 상자가 오른쪽 아래 동그라미를 덮지 않음`,ov!=='missing'&&ov.subsRight<=ov.btnLeft,JSON.stringify(ov));
 // 자동 발동: 재사용이 끝났고 가까이 적이 있으면 기술(Q)·EGO(F)가 저절로 나간다
 const a0=await api(p);
 await p.evaluate(()=>{player.specialCD=0;player.egoCD=0;player.ego=0;player.samong=0;player.resonance=Math.max(60,player.resonance||0);const e=liveEnemies()[0];if(e){e.x=player.x+2;e.y=player.y;}});
 // 다른 자동(엔진 오토 등)이 먼저 EGO 를 켜 둘 수 있으므로, 상태를 몇 번 다시 맞추며 기다린다
 for(let k=0;k<40;k++){const ok=await p.evaluate(()=>{const s=window.__STORYWORLD_UI_COMBAT_R1021__?.inspect().stats;return s&&s.autoSpecial>0&&s.autoEgo>0;});if(ok)break;
  await p.evaluate(()=>{if(!(player.ego>0))player.egoCD=0;player.samong=0;player.resonance=Math.max(60,player.resonance||0);if(player.specialCD>0&&window.__STORYWORLD_UI_COMBAT_R1021__.inspect().stats.autoSpecial===0)player.specialCD=0;const e=liveEnemies()[0];if(e){e.x=player.x+2;e.y=player.y;}});
  await p.waitForTimeout(1500);}
 const a1=await api(p);check(`${T} 자동 발동: 기술(Q) 자동`,a1&&a1.stats.autoSpecial>(a0?.stats.autoSpecial||0),JSON.stringify(a1?.stats));
 check(`${T} 자동 발동: EGO(F) 자동(공명 30 이상)`,a1&&a1.stats.autoEgo>(a0?.stats.autoEgo||0),JSON.stringify(a1?.stats));
 // 영웅 배치 단추: 무한 생존에서는 R720 영웅 배치 창(PC 의 I 키)을 연다
 const h0=await p.evaluate(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.opens);
 await p.locator('#r1021Hero').click();await p.waitForTimeout(800);
 const h1=await p.evaluate(()=>({opens:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.opens,modal,txt:(document.getElementById('panel')?.innerText||'').slice(0,60)}));
 check(`${T} 영웅 배치 단추: 누르면 영웅 배치 창이 열림`,h1.opens>h0&&h1.modal,JSON.stringify(h1));
 if(SHOT)await p.screenshot({path:SHOT+'-phone-place.png'});
 await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(300);
 await common(T,p,true);
 // 아래 동그라미 끄고 켜기, 자동 끄면 기술·EGO 단추가 돌아옴
 await openSettings(p);await setPref(p,'buttons',false);await p.evaluate(()=>closePanel(true));await p.waitForTimeout(300);
 check(`${T} 화면 단추 끄면: 아래 동그라미가 모두 숨음`,!(await isVis(p,'#touchActionsR100')));
 await openSettings(p);await setPref(p,'buttons',true);await setPref(p,'autoSkills',false);await p.evaluate(()=>closePanel(true));await p.waitForTimeout(300);
 const L2=await touchLabels(p);check(`${T} 자동 발동 끄면: 기술·EGO 단추가 돌아옴`,['회피','기술','EGO','영웅 배치'].every(x=>L2.includes(x)),JSON.stringify(L2));
 const c0=(await api(p)).stats.autoSpecial;await p.evaluate(()=>{player.specialCD=0;});const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+1,t0,{timeout:60000}).catch(()=>{});
 check(`${T} 자동 발동 끄면: 기술이 저절로 나가지 않음`,(await api(p)).stats.autoSpecial===c0);
 await openSettings(p);await setPref(p,'autoSkills',true);await p.evaluate(()=>closePanel(true));
 if(SHOT){await p.waitForTimeout(400);await p.screenshot({path:SHOT+'-phone-after.png'});}
 check(`${T}: R1021 오류 0`,(await api(p)).stats.errors===0,(await api(p)).lastError||'');
 await ctx.close();}
// ---- PC ----
{const {ctx,p}=await survival({width:1280,height:720},false);const T='PC';
 if(SHOT)await p.screenshot({path:SHOT+'-pc.png'});
 await common(T,p,false);
 const a=await api(p);check(`${T}: 자동 발동은 폰에서만(PC 는 Q·F 직접)`,a.stats.autoSpecial===0&&a.stats.autoEgo===0,JSON.stringify(a.stats));
 check(`${T}: R1021 오류 0`,a.stats.errors===0,a.lastError||'');
 check(`${T}: 생존 모듈 오류 없음`,await p.evaluate(()=>!window.__STORYWORLD_SURVIVAL_R600__.inspect().lastError),await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().lastError));
 await ctx.close();}
check('페이지 오류 0',errors.length===0,JSON.stringify(errors.slice(0,3)));
await b.close();const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed,method:'playwright headless chromium, survival mode phone 375x812 + PC 1280x720; not real device/GPU'}));process.exit(failed?1:0);
