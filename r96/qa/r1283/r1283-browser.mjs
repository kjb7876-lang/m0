// R1283 헤드리스 검사(소프트웨어 렌더 — GPU·실기기·자연 플레이 미검증): 검수에서 남은 두 건.
//  A. PC 설정창을 열어 두고 가만히 있으면 화면(설정창 DOM·월드)이 계속 다시 그려지던 문제.
//  B. 영웅 교체 뒤 '붉은 하이힐 칼날'(붉은 굽 검사) 공격·사망 모션이 빠지던 문제(R1281 이 그 시트를 놓은 뒤 R1065 가 다시 받지 않음).
//  STORYWORLD_URL=http://127.0.0.1:4396/m0/ node r96/qa/r1283/r1283-browser.mjs
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/';
let fails=0;const check=(name,okv,info)=>{if(!okv)fails++;console.log((okv?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,700)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const wait=ms=>p.evaluate(ms=>new Promise(r=>setTimeout(r,ms)),ms);

// ---------- A. 설정창 가만히 둘 때 ----------
// R1280 이 만든·숨긴 칸에 생긴 변화만 센다(다른 모듈의 곡 이름 글자·#panel class 다시 쓰기는 R1280 몫이 아님)
await p.evaluate(()=>{window.__mut=0;const mine=m=>{const t=m.target.nodeType===1?m.target:m.target.parentElement;if(!t)return false;return /R1280/.test(t.id||'')||!!t.closest?.('[id$="R1280"],.r1280Hidden')||(m.attributeName==='class'&&String(t.className).includes('r1280Hidden'));};const mo=new MutationObserver(l=>{window.__mut+=l.filter(mine).length;});mo.observe(document.getElementById('panel'),{childList:true,subtree:true,attributes:true,characterData:true});window.__mo=mo;});
await p.evaluate(()=>showSettings());await wait(2500); // 늦게 붙는 칸(200·600·1200ms) 다 붙은 뒤
const a0=await p.evaluate(()=>({b:window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds,m:window.__mut,s:{...window.__STORYWORLD_STATIC_PAUSE_R1249__.inspect().stats}}));
await wait(4000);
const a1=await p.evaluate(()=>({b:window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds,m:window.__mut,s:{...window.__STORYWORLD_STATIC_PAUSE_R1249__.inspect().stats},modal:!!modal,open:!!document.getElementById('settingsClose')}));
const builds=a1.b-a0.b,muts=a1.m-a0.m,drawn=a1.s.drawn-a0.s.drawn,skipped=a1.s.skipped-a0.s.skipped;
check('A0 설정창이 열려 있음',a1.modal&&a1.open,a1);
check('A1 가만히 4초 동안 설정창 통합 칸 다시 만들기 2회 이하(예전: 프레임마다)',builds<=2,{builds});
check('A2 가만히 4초 동안 R1280 칸 DOM 변화 0건',muts===0,{muts});
check('A3 가만히 4초 동안 월드 다시 그림 6번 이하(R1249 1초 유지 그리기만)',drawn<=6,{drawn,skipped});
// 회귀: 늦게 붙는 실제 칸은 여전히 잡아서 숨김(요소 추가 감시 유지)
const late=await p.evaluate(async()=>{const l=document.createElement('label');l.id='lateR1283';l.innerHTML='<input type="checkbox" data-r1021="subs"> 늦게 붙은 서사 자막 칸';
 (document.querySelector('#panel .settings')||document.getElementById('panel')).appendChild(l);const b0=window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds;
 await new Promise(r=>setTimeout(r,1500));const hid=l.classList.contains('r1280Hidden')&&!(l.checkVisibility?l.checkVisibility():l.offsetParent);const b1=window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds;l.remove();
 await new Promise(r=>setTimeout(r,600));const b2=window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds;await new Promise(r=>setTimeout(r,2000));
 return {hid,built:b1-b0,afterRemove:b2-b1,idle2s:window.__STORYWORLD_SETTINGS_MERGE_R1280__.inspect().stats.builds-b2};});
check('A6 회귀: 늦게 붙은 겹치는 칸도 숨김(다시 만들기 1~3회)',late.hid&&late.built>=1&&late.built<=3,late);
check('A7 그 뒤 무입력 2초 동안 다시 만들기 0회',late.idle2s===0,late);
// 회귀: 통합 칸을 누르면 원래 칸이 따라가고 다시 보여 줌
const reg=await p.evaluate(async()=>{const box=document.getElementById('narrVoiceR1280');const v0=box.checked;box.click();await new Promise(r=>setTimeout(r,300));
 const after={box:box.checked,narr:settings.narration,mem:window.__STORYWORLD_MEMORY_VOICE_R1223__?.prefs().on};box.click();await new Promise(r=>setTimeout(r,300));
 const s=document.getElementById('viewRangeR1280');const o=document.querySelector('#viewRowR1280 output')?.textContent;return {v0,after,back:box.checked,narrBack:settings.narration,view:s&&+s.value,out:o};});
check('A4 회귀: 통합 서사 음성 칸이 엔진·R1223 값을 함께 바꾸고 되돌림',reg.v0===true&&reg.after.box===false&&reg.after.narr===false&&reg.after.mem===false&&reg.back===true&&reg.narrBack===true,reg);
check('A5 회귀: 시야 범위 표시 값 그대로(1.50배)',reg.view===1.5&&reg.out==='1.50배',reg);
await p.evaluate(()=>{window.__mo.disconnect();closePanel(true);});await wait(300);

// ---------- B. 영웅 교체 뒤 붉은 하이힐 칼날 ----------
const ATK='assets/r1065/mobs/ma-02-red-heel-blade-attack.webp',DIE='assets/r1111/mobs/md-16-red-heel-blade-death.webp',WALK='r380/mobs/ep1b-red-heel-blade-walk-d1.webp';
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(()=>{guide=false;auto=false;player.invincible=1e9;});
const firstHero=await p.evaluate(()=>player.hero);
// 지금 영웅으로 싸우는 동안 R1065 가 붉은 하이힐 칼날 공격·사망 시트를 받는다(공격 시트는 실제 덧그림처럼 ensureImages 로, 사망 시트는 R1065 deathFrame 길로)
const look={path:WALK,name:'붉은 하이힐 칼날'};
await p.evaluate(async([ATK,look])=>{window.__look=look;window.__D=window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;window.__D.deathFrame(look,.1);await ensureImages([ATK]);},[ATK,look]);
await p.waitForFunction(DIE=>imageCache.get(DIE)?.ready,DIE,{timeout:60000});
const b0=await p.evaluate(()=>({death:!!window.__D.deathFrame(window.__look,.1)}));
check('B0 교체 전: 붉은 하이힐 칼날 사망 모션 시트 준비됨',b0.death,b0);
async function sw(id0){return p.evaluate(async(id0)=>{showHeroes(false);await new Promise(r=>setTimeout(r,60));
 let el=null;for(let k=0;k<100&&!el;k++){el=document.querySelector(`#panel button[data-hero="${id0}"]`);if(!el)await new Promise(r=>setTimeout(r,50));}if(!el)return{err:'no card '+id0};
 el.click();await new Promise(r=>setTimeout(r,300));const c=document.getElementById('chooseHero');if(!c)return{err:'no choose'};c.click();
 for(let k=0;k<600&&(loading||modal);k++)await new Promise(r=>setTimeout(r,25));return{hero:player.hero};},id0);}
// LOWQ=1: 저사양(바로 앞 영웅도 놓음) A→B 1번, 기본: PC A→B→C 2번
const LOWQ=process.env.LOWQ==='1';if(LOWQ)await p.evaluate(()=>{try{settings.lowFx=true;}catch(_){}});
const order=['hwando','neon','slayer','hunter'].filter(h=>h!==firstHero).slice(0,LOWQ?1:2);
for(const h of order){const r=await sw(h);check('B1 영웅 교체 '+h,!r.err&&r.hero===h,r);await wait(2600);}
const rel=await p.evaluate(([ATK,DIE])=>{const i=window.__STORYWORLD_HERO_SWITCH_MEM_R1281__.inspect();return {released:i.stats.released,has:[ATK,DIE].map(x=>i.releasedPaths.includes(x))};},[ATK,DIE]);
console.log('R1281 놓은 그림',JSON.stringify(rel));
// 교체 뒤 몹이 다시 공격·사망: 덧그림은 readyImage 만 묻는다(R1065 asked 는 다시 받지 않음) — 몇 프레임 동안 물어 본다
const after=await p.evaluate(async([ATK])=>{const t0=performance.now();let death=null,atk=false;
 while(performance.now()-t0<6000){death=window.__D.deathFrame(window.__look,.1);atk=!!readyImage(ATK)?.image?.naturalWidth;if(death&&atk)break;await new Promise(r=>setTimeout(r,100));}
 return {death:!!death,atk,ms:Math.round(performance.now()-t0)};},[ATK]);
check('B2 영웅 교체 뒤에도 붉은 하이힐 칼날 사망 모션 나옴(6초 안)',after.death,after);
check('B3 영웅 교체 뒤에도 붉은 하이힐 칼날 공격 시트 준비됨(6초 안)',after.atk,after);
// 회귀: R1281 메모리 정리는 그대로(놓인 그림이 있음), 지금 영웅 그림은 다 준비
const mem=await p.evaluate(()=>({released:window.__STORYWORLD_HERO_SWITCH_MEM_R1281__.inspect().stats.released,cur:heroPaths(player.hero).filter(x=>!imageCache.get(cleanPath(x))?.ready).length}));
check('B4 회귀: R1281 이 안 쓰는 영웅 그림은 여전히 놓음',mem.released>0,mem);
check('B5 회귀: 지금 영웅 그림 모두 준비',mem.cur===0,mem);
check('C 페이지 오류 없음',errors.length===0,errors.slice(0,5));
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
