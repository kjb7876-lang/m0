// R1148 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기/자연 플레이 검증 아님): 무한 생존 배치 창 777 → EGO·페르소나 해금·배치·교대.
//  빈 저장(서사 진행·해금 없음)으로 시작 → 헌터로 생존 → I → 7·7·7 → 칸 생김 → EGO 영입·배치(몸 = 환도+EGO 표식, EGO 그림) → 교대 → 페르소나 배치(몸 = 라우렌+페르소나 표식, 페르소나 그림).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOTS=process.env.SHOTS||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const shot=async n=>{if(SHOTS)await p.screenshot({path:SHOTS+'/'+n+'.png'});};const A=(f,a)=>p.evaluate(f,a);
const D=()=>A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;return {...d.state(),ins:d.inspect(),hero:player.hero,ego:player.egoSovereignR1046===true,persona:player.personaHeroR1113===true};});
const calm=async()=>{await A(()=>{player.attackCD=Math.max(player.attackCD||0,4);player.specialCD=Math.max(player.specialCD||0,4);});await p.waitForFunction(()=>{const s=window.__STORYWORLD_DANCE_FREE_R706__?.state?.();return !s||(!s.body&&!s.dancing);},null,{timeout:120000});};
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:240000});};
const openI=async sel=>{await p.keyboard.press('b');await p.waitForFunction(s=>!!document.getElementById('r720Panel')&&(!s||!!document.querySelector(s)),sel,{timeout:20000});};
const closeI=async()=>{await p.keyboard.press('b');await p.waitForFunction(()=>!document.getElementById('r720Panel')||document.getElementById('modal').classList.contains('hidden'),null,{timeout:20000});};

await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
ok('빈 저장: EGO·페르소나 미해금',await A(()=>!window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked()&&!window.__STORYWORLD_PERSONA_HERO_R1113__.unlocked()));
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hunter"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await openI();ok('777 전: 창에 EGO·페르소나 칸 없음',await A(()=>!document.querySelector('[data-r720buy="ego"],[data-r720buy="persona"]')&&document.querySelectorAll('.r720Hero').length===8));
await shot('r1148-1-before');
for(let i=0;i<3;i++){await p.keyboard.press('7');await p.waitForTimeout(150);}
await p.waitForFunction(()=>!!document.querySelector('[data-r720buy="ego"]')&&!!document.querySelector('[data-r720buy="persona"]'),null,{timeout:10000}).catch(()=>{});
ok('777 → 창에 EGO·페르소나 영입 칸(10명)',await A(()=>!!document.querySelector('[data-r720buy="ego"]')&&!!document.querySelector('[data-r720buy="persona"]')&&document.querySelectorAll('.r720Hero').length===10));
ok('해금 저장(영웅창 777 과 같은 저장)',await A(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked()&&window.__STORYWORLD_PERSONA_HERO_R1113__.unlocked()&&/"on":true/.test(localStorage.getItem('storyworld.r1113.personaHero')||'')));
ok('창이 열린 동안 7 은 스킬로 새지 않음(조종 영웅 그대로)',(await D()).hero==='hunter');
await A(()=>document.querySelector('[data-r720buy="persona"]').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await shot('r1148-2-after777');
await closeI();
// EGO 영입·배치
await calm();await A(()=>{const z=room.survivalR600.centre;player.x=z.x+2.5;player.y=z.y+1;window.__STORYWORLD_HERO_DEFENSE_R720__.qaGive(3000);
 window.__r1148paths=new Set();const base=readyImage;readyImage=function(path,...r){try{if(player&&player.r720Ally&&typeof path==='string')window.__r1148paths.add(player.hero+'|'+(player.egoSovereignR1046?'E':'')+(player.personaHeroR1113?'P':'')+'|'+path);}catch(_){}return base.apply(this,[path,...r]);};});
await openI('[data-r720buy="ego"]');await A(()=>document.querySelector('[data-r720buy="ego"]').click());await p.waitForTimeout(250);
let s=await D();ok('EGO 영입 → 지금 자리에 배치',s.slots.length===1&&s.slots[0].hero==='ego'&&s.owned.ego===true,s.slots);
ok('EGO 자리 카드 이름 EGO',await A(()=>/EGO/.test(document.querySelector('.r720Slot:not(.empty)')?.textContent||'')));
await closeI();await waitGame(2.5);
let body=await A(()=>{const b=window.__STORYWORLD_HERO_DEFENSE_R720__.bodies()[0];return b&&{hero:b.hero,ego:b.egoSovereignR1046===true,persona:b.personaHeroR1113===true};});
ok('EGO 몸 = 환도 + EGO 표식',body&&body.hero==='hwando'&&body.ego&&!body.persona,body);
let paths=await A(()=>[...window.__r1148paths].filter(x=>x.startsWith('hwando|E|')));
ok('EGO 몸이 EGO 그림(r1048·r1139b)을 읽음',paths.some(x=>/r1048|r1139b|\/ego/i.test(x)),paths.filter(x=>/r1048|r1139b|ego/i.test(x)).slice(0,4));
ok('조종 영웅(헌터)은 그대로, EGO 표식 없음',(await D()).hero==='hunter'&&!(await D()).ego);
await shot('r1148-3-ego-placed');
if(SHOTS){await calm();await A(()=>{const a=window.__STORYWORLD_HERO_DEFENSE_R720__.allies()[0];player.x=a.x+1.6;player.y=a.y+1.2;});await waitGame(.6);await shot('r1148-3b-ego-near');}
// 교대: EGO 를 조종
await openI('[data-r720swap="0"]');await A(()=>document.querySelector('[data-r720swap="0"]').click());
await p.waitForFunction(()=>player.hero==='hwando',null,{timeout:20000}).catch(()=>{});await waitGame(.5);
s=await D();ok('교대 → 조종 = EGO(환도+표식), 헌터가 그 자리',s.hero==='hwando'&&s.ego&&!s.persona&&s.main==='ego'&&s.slots[0].hero==='hunter',s);
ok('EGO 조종 중 HUD 이름 EGO',await A(()=>/EGO/.test(document.getElementById('heroName')?.textContent||'')),await A(()=>document.getElementById('heroName')?.textContent));
body=await A(()=>{const b=window.__STORYWORLD_HERO_DEFENSE_R720__.bodies()[0];return b&&{hero:b.hero,ego:b.egoSovereignR1046===true};});
ok('헌터 몸에 EGO 표식이 새지 않음',body&&body.hero==='hunter'&&!body.ego,body);
await shot('r1148-4-ego-main');
// 페르소나 영입·배치
await calm();await A(()=>{const z=room.survivalR600.centre;player.x=z.x-2.5;player.y=z.y+1;});
await openI('[data-r720buy="persona"]');await A(()=>document.querySelector('[data-r720buy="persona"]').click());await p.waitForTimeout(250);
s=await D();ok('페르소나 영입 → 배치',s.slots.length===2&&s.slots[1].hero==='persona',s.slots);
ok('같은 몸 규칙: EGO 조종 중 환도 영입 칸은 배치 불가 표시 없이 영입만(환도는 아직 미보유)',await A(()=>!!document.querySelector('[data-r720buy="hwando"]')));
await closeI();await waitGame(2.5);
body=await A(()=>{const b=window.__STORYWORLD_HERO_DEFENSE_R720__.bodies()[1];return b&&{hero:b.hero,ego:b.egoSovereignR1046===true,persona:b.personaHeroR1113===true};});
ok('페르소나 몸 = 라우렌 + 페르소나 표식',body&&body.hero==='lauren'&&body.persona&&!body.ego,body);
const sum=o=>['swaps','walkSwaps','idleSwaps','actSwaps'].reduce((a,k)=>a+(+o[k]||0),0);const sw0=await A(()=>({s:window.__STORYWORLD_PERSONA_HERO_R1113__.inspect().stats,f:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.formFx||0}));await waitGame(1);
const sw1=await A(()=>({s:window.__STORYWORLD_PERSONA_HERO_R1113__.inspect().stats,f:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.formFx||0,form:window.__STORYWORLD_PERSONA_HERO_R1113__.formActive()}));
ok('조종 영웅은 페르소나가 아닌데도 배치 페르소나 몸 그림이 페르소나로 바뀜(R1113 몸 바꿈 수 증가)',!sw1.form&&sum(sw1.s)>sum(sw0.s)&&sw1.f>sw0.f,{sw0,sw1});
await A(()=>{const a=window.__STORYWORLD_HERO_DEFENSE_R720__.allies()[1];window.__r1148q=project(a.x,a.y);});
await shot('r1148-5-persona-placed');
if(SHOTS){await calm();await A(()=>{const a=window.__STORYWORLD_HERO_DEFENSE_R720__.allies()[1];player.x=a.x+1.6;player.y=a.y+1.2;});await waitGame(.6);await shot('r1148-6-persona-near');}
// 엔진 영웅 창 길(직접 바꿈)로 환도 → EGO 몸 자리와 맞바꿈 없이 형상만 끔
await A(()=>{player.egoSovereignR1046=false;});await waitGame(.3);s=await D();
ok('EGO→환도(형상만 끔): 조종 = 환도, 자리 그대로',s.main==='hwando'&&s.slots[0].hero==='hunter'&&s.slots[1].hero==='persona',s);
s=await D();ok('R720 오류 0',s.ins.stats.errors===0,s.ins.lastError);
ok('페이지 오류 없음',errs.length===0,errs);
await b.close();console.log(fail?'R1148 browser: '+fail+' FAIL':'R1148 browser: ALL PASS');process.exit(fail?1:0);
