// R953 헤드리스 화면: 기억사수로 dist01 에서 적을 둘레에 세우고, 잔영 위장·표적 소거 난사·귀환 전우를 하나씩 강제로 터뜨려 장면을 찍고 수치를 잰다.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node r953-browser.mjs <출력폴더> <URL> [3d|2d] [지역]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL,MODE='3d',ZONE='dist01']=process.argv.slice(2);const b=await chromium.launch();const log={mode:MODE,zone:ZONE};
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
// 궁극기(R)를 바로 재려고 스킬 성장 잠금(R663, 포인트로 배우는 순서)만 끈다 — 검사 도구 안에서만
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
if(MODE==='2d')await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const at=t=>p.waitForFunction(t=>time>=t,t,{timeout:180000,polling:16}).catch(()=>{}),now=()=>p.evaluate(()=>time);
const pin=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss);const ring=[[2.2,.4],[3.2,-1.6],[-2.4,1.8],[1.6,3.2],[-1.6,-2.8],[4.2,2.0],[-3.4,-0.6],[0.6,-4.0]];
 live.slice(0,ring.length).forEach((e,i)=>{const [dx,dy]=ring[i];const x=player.x+dx,y=player.y+dy;if(!blocked(x,y,.3,room)){e.x=x;e.y=y;}e.hp=Math.max(e.hp,9e5);e.maxHp=Math.max(e.maxHp||0,9e5);e.speed=0;e.attackCD=99;e.cd=99;});
 for(const e of live.slice(ring.length)){e.hp=0;e.spawnState='dead';e.deadRecorded=true;}return Math.min(live.length,ring.length);});
const reset=()=>p.evaluate(()=>{player.attackCD=0;player.hp=Math.max(Number(player.hp)||0,777);});
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(async()=>{await ensureImages(heroPaths('gunner'));player.hero='gunner';});
await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),ZONE);await p.waitForFunction(z=>!loading&&room?.id===z,ZONE,{timeout:120000});await skip();await p.waitForTimeout(3000);
log.pinned=await pin();await p.waitForTimeout(1500);
const A='__STORYWORLD_GUNNER_VEIL_R953__',G='__STORYWORLD_GUNNER_ARMS_R561__';
const shot=async n=>{await p.evaluate(()=>{window.__ts=window.__STORYWORLD_PHASE1__?.controller?.state?.reason||null;});await p.screenshot({path:`${OUT}/${n}-${MODE}.png`});};
{await reset();await pin();{const t0=await now();await p.evaluate(([A])=>{window[A].force('barrage');basicAttack();},[A]);for(const dt of [.15,.5,.95,1.05]){await at(t0+dt);await shot('barrage-'+dt);}await at(t0+1.8);}
await reset();await pin();{const t0=await now();await p.evaluate(([A])=>{window[A].force('summon');basicAttack();},[A]);for(const dt of [.2,.6,1.0,2.5]){await at(t0+dt);await shot('summon-'+dt);}await at(t0+8.5);}}
log.end=await p.evaluate(([A])=>{const i=window[A].inspect();return {errors:i.errors,lastError:i.lastError,rev:window[A].revision,reason:window.__STORYWORLD_PHASE1__?.controller?.state?.reason||null,time,pos:[player.x,player.y],imgs:['lock','friend','call'].map(k=>!!readyImage('assets/r953/gv-'+k+'.webp')?.image)};},[A]);
log.errs=errs;console.log(JSON.stringify(log));await b.close();
