// R1296 표적 재현: 윤서하 '평행세계 소집'(R949)을 영웅 묶음마다 강제로 일으키고, 3D 장면 캡처(captureVisual)가 호출 스택 초과를 내는지 본다.
//  URL=… node r96/qa/r1296/epoch-probe.mjs   (헤드리스 소프트웨어 렌더링)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4410/m0/',ZONE=process.env.ZONE||'kair07';
const TRIOS=(process.env.TRIOS||'hwando,lauren,neon;michaela,hunter,slayer;gunner,string,hwando;ego,persona,hwando').split(';').map(s=>s.split(','));
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,600)));
await p.addInitScript(()=>{let v;Object.defineProperty(window,'StoryPhase1',{configurable:true,get(){return v;},set(x){
 if(x&&!x.__probe&&typeof x.createController==='function'){const cc=x.createController;x={...x,__probe:1,createController(h,o){const c=cc.call(this,h,o);window.__r1296ctl=c;window.__r1296cap=()=>h.captureVisual();return c;}};}
 v=x;}});});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async(z)=>{await window.__STORYWORLD_CHEAT777__.go(z,'STORY');},ZONE).catch(()=>{});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{for(const z of ['dreamRest','restEp1b','u201','restU2','kair01','hando01'])visited.add('STORY:'+z);});
await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('seoha'));player.hero='seoha';}finally{loading=false;}player.invincible=1e9;auto=true;guide=true;});
let fails=0;
for(const trio of TRIOS){
 await p.evaluate(async(trio)=>{const E=window.__STORYWORLD_SEOHA_EPOCH_R949__;const GATE={hunter:'dreamRest',slayer:'dreamRest',michaela:'restEp1b',gunner:'u201',hwando:'restU2',lauren:'hando01',neon:'hando01'};for(const z of Object.values(GATE))visited.delete('STORY:'+z);for(const id of trio)if(GATE[id])visited.add('STORY:'+GATE[id]);player.level=777;E.qaReset();E.qaTrio(trio);for(const id of trio){try{await ensureImages(heroPaths(id));}catch(_){}}for(let k=0;k<6;k++){E.qaReset();E.qaTrio(trio);E.qaForce('heroes');const e0=room.enemies.filter(v=>v.hp>0)[0];if(e0)hitEnemy(e0,1,{kind:'basic',sourceHero:'seoha'});if(E.inspect().summons.length)break;await new Promise(r=>setTimeout(r,2500));}{const u=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;window.__r1296diag={list:u?.summonList?.('seoha',['seoha',player.hero]),open:Object.fromEntries(['hwando','lauren','neon','michaela','hunter','slayer','gunner','string'].map(k=>[k,[u?.summonOpen?.(k),(()=>{try{return !!ready(heroArt[k].idle.front);}catch(e){return 'x'}})()]]))};}if(E.inspect().summons.length)return;E.qaForce('heroes');const e=room.enemies.filter(v=>v.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(e)hitEnemy(e,1,{kind:'basic',sourceHero:'seoha'});},trio);
 // 서하가 적을 때리면 굴림 → 강제 종류 발동. 게임 시간으로 기다린다.
 const r=await p.evaluate(async()=>{const E=window.__STORYWORLD_SEOHA_EPOCH_R949__;const t0=time;const w0=Date.now();while(time-t0<2&&Date.now()-w0<90000&&!E.inspect().summons.length)await new Promise(r=>setTimeout(r,200));
  const ins=E.inspect();const out={gt:Math.round(time-t0),modal:!!modal,loading,summons:ins.summons.map(s=>s.hero),failed:window.__r1296ctl?.state?.failed,reason:String(window.__r1296ctl?.state?.reason||'').slice(0,100),cap:null,r1228:window.__STORYWORLD_THREE_RECOVER_R1228__?.inspect?.().failures,errs:ins.stats?.errors,lastError:null};
  for(let i=0;i<20&&!out.cap?.startsWith?.('THROW');i++){await new Promise(r=>setTimeout(r,150));try{out.cap=window.__r1296cap().length;}catch(e){out.cap='THROW '+String(e&&e.stack||e).slice(0,1500);}}
  out.diag=window.__r1296diag;out.summons2=E.inspect().summons.map(s=>s.hero);out.bodyDraws=E.inspect().stats.bodyDraws;out.r949err=E.inspect().stats;
  try{out.cap=out.cap?.startsWith?.('THROW')?out.cap:window.__r1296cap().length;}catch(e){out.cap='THROW '+String(e&&e.stack||e).slice(0,1500);}
  return out;});
 const bad=typeof r.cap!=='number'||r.failed||(r.r1228||0)>0;if(bad)fails++;
 console.log((bad?'FAIL':'ok  ')+' 소환 '+trio.join('+')+': '+JSON.stringify(r).slice(0,2200));
 await p.evaluate(()=>window.__STORYWORLD_SEOHA_EPOCH_R949__.qaReset());await p.waitForTimeout(500);}
console.log('PAGEERR',errs.length,errs.slice(0,2).join('\n---\n').slice(0,1500));
console.log(fails?`FAIL ${fails}건`:'ALL OK');await b.close();process.exit(fails?1:0);
