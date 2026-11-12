// R953 헤드리스 화면: 기억사수로 dist01 에서 적을 둘레에 세우고, 잔영 위장·표적 소거 난사·귀환 전우를 하나씩 강제로 터뜨려 장면을 찍고 수치를 잰다.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node r953-browser.mjs <출력폴더> <URL> [3d|2d] [지역]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL,MODE='3d',ZONE='dist01']=process.argv.slice(2);const b=await chromium.launch();const log={mode:MODE,zone:ZONE};
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
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
const snap=()=>p.evaluate(()=>({enemies:room.enemies.length,kills:room.kills,hazards:hazards.length,hazardOwners:hazards.map(h=>String(h.type)+'|'+String(h.owner)).slice(0,4),hp:player.hp,engaged:!!room.engaged,stage:room.encounterStage||null}));
const base=await snap();log.base=base;
// 평소 궁극기(회귀): 지연·재사용
log.ultNormal=await p.evaluate(([G])=>{const ok=window[G].fire('r',false);return {ok,remain:+window[G].remain('r').toFixed(2)};},[G]);
{const t0=await now();await at(t0+2.2);}
// ① 잔영 위장
await reset();{const t0=await now();log.cloak=await p.evaluate(([A,G])=>{const before=window[G].remain('r');window[A].force('cloak');basicAttack();return {before:+before.toFixed(3),after:+window[G].remain('r').toFixed(3),cloaked:window[A].cloaked(),ult:window[A].ult()};},[A,G]);
 for(const dt of [.2,1.2]){await at(t0+dt);await p.screenshot({path:`${OUT}/cloak-${String(dt).replace('.','')}-${MODE}.png`});}
 // 은신 중 궁극기: 남은 대기를 기다렸다가 쏘고, 폭격까지 걸린 게임 시간을 잰다
 await at(t0+(log.cloak.after||0)+.1);log.cloakUlt=await p.evaluate(([A,G])=>{window.__r953Boom=null;const b=hitEnemy;if(!window.__r953Hook){window.__r953Hook=true;hitEnemy=function(e,v,s,...a){if(s&&s.ability==='gunnerStrikeR561'&&window.__r953Boom==null)window.__r953Boom=time;return b.call(this,e,v,s,...a);};}
   window.__r953Cast=time;const ok=window[G].fire('r',false);return {ok,cloaked:window[A].cloaked(),remain:+window[G].remain('r').toFixed(3)};},[A,G]);
 const t1=await now();await at(t1+.2);await p.screenshot({path:`${OUT}/cloak-ult-${MODE}.png`});await at(t1+1.2);
 log.cloakUlt.delay=await p.evaluate(()=>window.__r953Boom==null?null:+(window.__r953Boom-window.__r953Cast).toFixed(3));
 await at(t0+6.6);log.cloakEnd=await p.evaluate(([A])=>({cloaked:window[A].cloaked(),ult:window[A].ult()}),[A]);}
// ② 표적 소거 난사
await reset();await pin();{const t0=await now();log.barrage=await p.evaluate(([A])=>{window[A].force('barrage');basicAttack();return window[A].inspect().barrage;},[A]);
 for(const dt of [.2,.45,.7,1.0]){await at(t0+dt);await p.screenshot({path:`${OUT}/barrage-${String(dt).replace('.','')}-${MODE}.png`});}
 await at(t0+1.6);log.barrageAfter=await p.evaluate(([A])=>{const i=window[A].inspect();return {stats:i.stats,errors:i.errors,lastError:i.lastError};},[A]);}
// ③ 귀환 전우
await reset();await pin();{const t0=await now();log.summon=await p.evaluate(([A])=>{window[A].force('summon');basicAttack();return window[A].inspect().allies;},[A]);
 for(const dt of [.3,1.0,1.6,2.4,3.4,4.6,6.0,7.2,7.6]){await at(t0+dt);await p.screenshot({path:`${OUT}/summon-${String(dt).replace('.','')}-${MODE}.png`});if(dt===3.4)log.summonMid={...(await snap()),allies:await p.evaluate(([A])=>window[A].inspect().allies,[A]),inEnemyList:await p.evaluate(()=>room.enemies.some(e=>e.r953Ally)||liveEnemies().some(e=>e.r953Ally))};}
 await at(t0+8.4);log.summonAfter=await p.evaluate(([A])=>{const i=window[A].inspect();return {allies:i.allies.length,stats:i.stats,errors:i.errors,lastError:i.lastError,drawCalls:i.drawCalls,hazards:i.hazards};},[A]);}
log.end=await snap();
// 게임 시간이 멈추지 않는지(3D 기록기 함정)
const tA=await now();await p.waitForTimeout(2500);log.timeFlows=(await now())>tA;
log.errs=errs.slice(0,6);console.log(JSON.stringify(log,null,1));await b.close();
