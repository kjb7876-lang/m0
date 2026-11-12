// R947 헤드리스 화면: 슬레이어로 dist01 에서 적을 둘레에 세우고, 혈침·성혈검우·혈격자를 하나씩 강제로 터뜨려 장면을 찍는다.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node r947-browser.mjs <출력폴더> <URL> [3d|2d]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL,MODE='3d']=process.argv.slice(2);const b=await chromium.launch();const log={mode:MODE};
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
if(MODE==='2d')await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const at=t=>p.waitForFunction(t=>time>=t,t,{timeout:120000,polling:16}).catch(()=>{}),now=()=>p.evaluate(()=>time);
const pin=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0);const ring=[[1.2,.2],[2.6,-1.2],[-2,1.4],[1.4,2.6],[-1.2,-2.4],[3.4,1.8],[-3,-0.6],[0.4,-3.6]];/* 서로 3칸 안팎 — 적혈 연쇄가 이어 튀게 */
 live.slice(0,ring.length).forEach((e,i)=>{const [dx,dy]=ring[i];const x=player.x+dx,y=player.y+dy;if(!blocked(x,y,.3,room)){e.x=x;e.y=y;}e.hp=Math.max(e.hp,9e4);e.maxHp=Math.max(e.maxHp||0,9e4);e.speed=0;e.attackCD=99;});
 for(const e of live.slice(ring.length)){e.hp=0;e.spawnState='dead';}return Math.min(live.length,ring.length);});
const reset=()=>p.evaluate(()=>{player.attackCD=0;player.hp=Math.max(Number(player.hp)||0,777);player.direction='right';});
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';});
await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(3000);
log.pinned=await pin();await p.waitForTimeout(1200);
const A='__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__';
const plan=[['needle',[.1,.22,.36]],['swords',[.25,.5,.75,1.1]],['lattice',[.45,.8,1.0,1.3]]];
for(const [k,ts] of plan){await reset();await pin();await p.waitForTimeout(300);
 const t0=await now();log[k+'-cast']=await p.evaluate(([A,k])=>{window[A].force(k);basicAttack();return {cd:player.attackCD,modal,stats:window[A].inspect().stats};},[A,k]);
 for(const dt of ts){await at(t0+dt);await p.screenshot({path:`${OUT}/${k}-${String(dt).replace('.','')}-${MODE}.png`});}
 await at(t0+2.4);log[k+'-after']=await p.evaluate(([A])=>{const i=window[A].inspect();return {stats:i.stats,errors:i.errors,lastError:i.lastError,drawCalls:i.drawCalls,modal,time};},[A]);}
// 게임 시간이 멈추지 않는지(3D 기록기 함정): 1초 기다려 time 이 흐르는지
const tA=await now();await p.waitForTimeout(2500);log.timeFlows=(await now())>tA;
log.errs=errs.slice(0,6);console.log(JSON.stringify(log,null,1));await b.close();
