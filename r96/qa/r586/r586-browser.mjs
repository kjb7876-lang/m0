// R586 브라우저(헤드리스, GPU 아님): 실제 엔진에서 슬레이어 낙인·W 처형·E 피사슬 끌기가 도는지, 화면을 찍고 수치를 남긴다.
// 사용: node r586-browser.mjs <출력폴더> <URL>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL]=process.argv.slice(2);const b=await chromium.launch();const log={};
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const at=t=>p.waitForFunction(t=>time>=t,t,{timeout:120000,polling:16}).catch(()=>{});
const clip=async()=>{const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const v=project(player.x,player.y);return {x:r.left+v.x*(r.width/(c.clientWidth||r.width)),y:r.top+v.y*(r.height/(c.clientHeight||r.height))};});return {x:Math.max(0,Math.min(960-480,q.x-240)),y:Math.max(0,Math.min(540-320,q.y-220)),width:480,height:320};};
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';});
await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(3000);
// 몹 셋: a(낙인 쌓을 표적), low(체력 10%), side(E 끌기 표적)
const setup=()=>p.evaluate(()=>{const L=room.enemies.filter(e=>e.hp>0);for(const e of L.slice(3)){e.hp=0;e.spawnState='dead';}const [a,low,side]=L;
 a.x=player.x+1.3;a.y=player.y;a.hp=a.maxHp=Math.max(a.maxHp,9e4);low.x=player.x+.9;low.y=player.y+.9;low.maxHp=Math.max(low.maxHp,2000);low.hp=low.maxHp*.1;
 side.x=player.x+2.0;side.y=player.y-.3;side.hp=side.maxHp=Math.max(side.maxHp,9e4);for(const e of [a,low,side]){e.speed=0;e.cd=99;}
 player.storyWER&&(player.storyWER.ready={});player.direction='right';window.__r586t=[a,low,side];return [0,1,2];});
const ids=await setup();log.ids=ids;
// 1) 낙인: 슬레이어 타격 5번(0.25초 간격)
log.marks=[];for(let i=0;i<5;i++){const t=await p.evaluate(()=>time);await p.evaluate(id=>{const e=window.__r586t[id];hitEnemy(e,1);},ids[0]);await at(t+.25);log.marks.push(await p.evaluate(id=>__STORYWORLD_SLAYER_BERSERK_R586__.marks(window.__r586t[id]),ids[0]));}
await p.screenshot({path:`${OUT}/r586-marks.png`,clip:await clip()});
// 2) W → 처형
const hp0=await p.evaluate(ids=>ids.map(id=>window.__r586t[id].hp),ids);const t0=await p.evaluate(()=>time);
log.wCast=await p.evaluate(()=>__STORYWORLD_WER__.cast('w'));await at(t0+.33);await p.screenshot({path:`${OUT}/r586-exec.png`,clip:await clip()});
log.afterW=await p.evaluate(ids=>({hp:ids.map(id=>window.__r586t[id].hp),wReady:+(player.storyWER?.ready?.['slayer:w']-time).toFixed(2),r586:__STORYWORLD_SLAYER_BERSERK_R586__.inspect()}),ids);log.hp0=hp0;
// 3) E → 끌기(왼쪽으로 물러섰다가 오른쪽으로 대시)
await p.evaluate(()=>{player.x-=2.2;});await at((await p.evaluate(()=>time))+.1);
const before=await p.evaluate(id=>{const e=window.__r586t[id];return {ex:e.x,ey:e.y,px:player.x,py:player.y};},ids[2]);const t1=await p.evaluate(()=>time);
log.eCast=await p.evaluate(()=>__STORYWORLD_WER__.cast('e'));await at(t1+.3);await p.screenshot({path:`${OUT}/r586-pull.png`,clip:await clip()});
log.pull=await p.evaluate(([id,b])=>{const e=window.__r586t[id];return {before:b,after:{ex:e.x,ey:e.y,px:player.x,py:player.y},dist:+Math.hypot(e.x-player.x,e.y-player.y).toFixed(2)};},[ids[2],before]);
log.final=await p.evaluate(()=>__STORYWORLD_SLAYER_BERSERK_R586__.inspect());log.errs=errs.slice(0,5);
console.log(JSON.stringify(log,null,1));await b.close();
