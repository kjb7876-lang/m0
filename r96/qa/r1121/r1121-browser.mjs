// R1121 헤드리스 확인: 히든 영웅 EGO 의 페르소나 탄이 원본 그림(rc134)으로 그려지고, 거점에선 발밑에 멈춘 탄이 없다
//  (헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1121/r1121-browser.mjs [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,25));},s);
const reset=()=>p.evaluate(()=>{for(const k in player)if(/CD$/.test(k))player[k]=0;player.resonance=100;player.invincible=1e6;});
// 렌더러가 받는 명령 중 탄 그림 경로 모으기
await p.evaluate(()=>{window.__r1121={paths:{}};const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__r1121)return;r.__r1121=true;const base=r.render;
 r.render=function(f){try{for(const c of f?.commands||[])if(c?.owner?.kind==='projectile'){const sp=String(c.sourcePath||c.image?.src||'');const k=/rc134\/persona-skills/.test(sp)?'persona':/hwando-a/.test(sp)?'hwandoA':'other';window.__r1121.paths[k]=(window.__r1121.paths[k]||0)+1;}}catch(_){}return base.apply(this,arguments);};};setInterval(tag,50);});
// ① 거점(safeRegion): 기본 공격 3타·Q·F 뒤 페르소나 탄 0
ok(await p.evaluate(()=>safeRegion()),'시작 지역은 거점(safeRegion)');
for(let i=0;i<3;i++){await reset();await p.keyboard.press('KeyA');await waitG(.3);}
await reset();await p.keyboard.press('KeyQ');await waitG(.8);await reset();await p.keyboard.press('KeyF');await waitG(.6);
const hub=await p.evaluate(()=>({kit:projectiles.filter(s=>s.egoKitR1094).length,stuck:projectiles.filter(s=>s.friendly&&!(s.age>0)).length,st:window.__STORYWORLD_EGO_KIT_R1094__.inspect?.()}));
ok(hub.kit===0&&hub.stuck===0,'거점: 페르소나 탄 0 · 발밑에 멈춘 아군 탄 0',hub);
if(SH){const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:SH+'/hub-after.png',clip:{x:q.x-120,y:q.y-180,width:240,height:240}});}
// ② 전투 지역(사몽 층): Q 뒤 페르소나 탄은 원본 그림이고 움직인다
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(5,'survival',{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:200000});await skip();
ok(await p.evaluate(()=>!safeRegion()&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()),'사몽 층 전투 지역 · EGO 형상');
await p.evaluate(()=>{window.__r1121.paths={};window.__seen=[];window.__iv=setInterval(()=>{for(const s of projectiles)if(s.egoKitR1094&&!__seen.includes(s))__seen.push(s);},20);});
await reset();await p.keyboard.press('KeyQ');await waitG(.75);
if(SH){const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:SH+'/combat-q.png',clip:{x:q.x-260,y:q.y-220,width:520,height:320}});}
await reset();await p.keyboard.press('KeyF');await waitG(.75);
const cb=await p.evaluate(()=>{clearInterval(__iv);return {n:__seen.length,assets:[...new Set(__seen.map(s=>s.asset))],src:[...new Set(__seen.map(s=>s.sourceProjectile5?.path))],keys:[...new Set(__seen.map(s=>s.storyWorldKey5))],moved:__seen.filter(s=>s.age>0&&Math.hypot(s.x-s.px,s.y-s.py)>=0).filter(s=>s.age>0).length,paths:window.__r1121.paths};});
ok(cb.n>=6,'전투: Q·F 페르소나 탄이 나감',cb.n);
ok(cb.assets.length>0&&cb.assets.every(a=>/rc134\/persona-skills\//.test(a))&&cb.src.every(a=>/rc134\/persona-skills\//.test(a)),'전투: 탄 그림·출처 = 페르소나 원본(rc134)',{assets:cb.assets,src:cb.src});
ok(cb.keys.every(k=>!/hwando/.test(k)),'전투: 탄 열쇠에 환도 A 그림 없음',cb.keys);
ok(cb.moved===cb.n,'전투: 탄이 날아감(age>0)',cb);
ok((cb.paths.persona||0)>0&&!(cb.paths.hwandoA>0),'렌더러가 받은 탄 그림 = 페르소나(환도 hwando-a 0)',cb.paths);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`\nR1121 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
