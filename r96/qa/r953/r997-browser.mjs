// R953 헤드리스 화면: 기억사수로 dist01 에서 적을 둘레에 세우고, 잔영 위장·표적 소거 난사·귀환 전우를 하나씩 강제로 터뜨려 장면을 찍고 수치를 잰다.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node r953-browser.mjs <출력폴더> <URL> [3d|2d] [지역]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL,MODE='3d',ZONE='dist01']=process.argv.slice(2);const b=await chromium.launch();const log={mode:MODE,zone:ZONE};
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});
// 궁극기(R)를 바로 재려고 스킬 성장 잠금(R663, 포인트로 배우는 순서)만 끈다 — 검사 도구 안에서만
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
if(MODE==='2d')await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const at=t=>p.waitForFunction(t=>time>=t,t,{timeout:180000,polling:16}).catch(()=>{}),now=()=>p.evaluate(()=>time);
const pin=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss);const ring=[[5.2,.4],[6.2,-3.6],[-5.4,3.8]];
 live.slice(0,ring.length).forEach((e,i)=>{const [dx,dy]=ring[i];const x=player.x+dx,y=player.y+dy;if(!blocked(x,y,.3,room)){e.x=x;e.y=y;}e.hp=Math.max(e.hp,9e5);e.maxHp=Math.max(e.maxHp||0,9e5);e.speed=0;e.attackCD=99;e.cd=99;});
 for(const e of live.slice(ring.length)){e.hp=0;e.spawnState='dead';e.deadRecorded=true;}return Math.min(live.length,ring.length);});
const reset=()=>p.evaluate(()=>{player.attackCD=0;player.hp=Math.max(Number(player.hp)||0,777);});
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(async()=>{await ensureImages(heroPaths('gunner'));player.hero='gunner';});
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),ZONE);await p.waitForFunction(z=>!loading&&room?.id===z,ZONE,{timeout:120000});await skip();await p.waitForTimeout(3000);
log.pinned=await pin();await p.waitForTimeout(1500);
const A='__STORYWORLD_GUNNER_VEIL_R953__',G='__STORYWORLD_GUNNER_ARMS_R561__';
// R997: 은신 장막 r3(걸림 GV-01 · 유지 GV-02 · 풀림 GV-03) 장면. 사용: node r997-browser.mjs <출력폴더> <URL> [3d|2d] [지역] — 헤드리스 소프트웨어 렌더링(GPU·실기기 아님)
const where=()=>p.evaluate(()=>{const q=project(player.x,player.y);return [Math.round(q.x),Math.round(q.y),Math.round(actorHeight())];});
const shot=async n=>{const [x,y,h]=await where();const r=Math.max(90,h*1.7);await p.screenshot({path:`${OUT}/${n}-${MODE}.png`,clip:{x:Math.max(0,x-r),y:Math.max(0,y-r*1.35),width:r*2,height:r*1.8}});};
// 찍는 동안 게임 시간이 흐르지 않게 tick 배율을 낮춘다(검사 도구 안에서만)
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
await reset();await pin();{const t0=await now();await p.evaluate(([A])=>{window[A].force('cloak');basicAttack();},[A]);log.hero=await where();
 log.left=[];for(const dt of [.3,.6,2.0,3.0,5.44,5.56,5.68,5.8]){await p.evaluate(dt=>{window.__SLOW=dt>5?.15:1;},dt);await at(t0+dt);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(250);const l=await p.evaluate(([A])=>window[A].inspect().cloak.left,[A]);log.left.push([dt,l]);await shot('veil-'+dt.toFixed(2));await p.evaluate(()=>{window.__SLOW=1;});}await at(t0+7);}
log.end=await p.evaluate(([A])=>{const i=window[A].inspect();return {errors:i.errors,lastError:i.lastError,sheets:window[A].sheets||null,stats:i.stats,time,cloak:i.cloak,r350:(()=>{try{const v=window.__STORYWORLD_HERO_VISIBILITY_R350__;const q=v.inspect?v.inspect():null;return q?{veiled:q.stats?.veiled,last:(q.lastVeiled||[]).filter(r=>String(r[0]).includes('r953')).slice(-4)}:null;}catch(e){return String(e);}})(),enemies:room.enemies.length,kills:room.kills,imgs:['in','loop','out'].map(k=>!!readyImage('assets/r953/gv-veil-'+k+'.webp')?.image)};},[A]);
log.errs=errs;console.log(JSON.stringify(log));await b.close();
