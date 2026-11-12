// R961 무한 생존 효과음 검사(헤드리스 — 소리를 귀로 듣는 검사가 아니라 sound() 호출·통계를 보는 검사. R770 초안 #438 의 검사를 지금 main 에 맞춰 옮기고 회복 차임 항목을 더함).
//  생존 전용 사건(조각 줍기·레벨 업·코어 피격·코어 파괴·영웅 쓰러짐)이 효과음을 부르는지, 부르는 횟수에 상한이 있는지,
//  회복 차임(swHeal)이 잔회복에는 조용하고 큰 회복에는 울리는지 본다. SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4396/).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const A=f=>p.evaluate(f);
await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading,null,{timeout:240000});
await A(()=>{window.__sc=[];const s=sound;sound=function(k,al,...a){window.__sc.push([k,!!al]);return s.call(this,k,al,...a);};window.__STORYWORLD_SURVIVAL_R600__.skipNarration();});
const calls=()=>A(()=>window.__sc.slice());const clear=()=>A(()=>{window.__sc.length=0;});
const count=(c,k)=>c.filter(x=>x[0]===k).length;
const gameWait=async sec=>{const t0=await A(()=>time);await p.waitForFunction(t=>time>=t,t0+sec,{timeout:240000,polling:200});};
await A(()=>{player.hp=maxHP();});
// 1) 조각 줍기: 처치로 떨어진 조각을 영웅이 먹을 때 pickup 한 번(여러 조각은 상한)
await gameWait(1);await clear();const tp0=await A(()=>time);
await A(()=>{for(const e of room.enemies.filter(e=>e.hp>0).slice(0,6)){e.x=player.x+.3;e.y=player.y;e.hp=.5;e.graceUntil=0;hitEnemy(e,1e9);}});
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.state().gems===0,null,{timeout:120000,polling:200}).catch(()=>{});
{const c=await calls(),dt=(await A(()=>time))-tp0;ok('shard pickup plays a pickup sound',count(c,'pickup')>=1,c.slice(0,12));
 ok('shard pickup calls are bounded by game time (≤ 1 per 0.3s + 1)',count(c,'pickup')<=Math.floor(dt/.3)+1,{pickups:count(c,'pickup'),dt});}
// 2) 레벨 업
await clear();await A(()=>window.__STORYWORLD_SURVIVAL_R600__.qaCredit(1e5));
{const c=await calls();ok('level up plays an upgrade sound',count(c,'upgrade')>=1,c);}
// 강화 창 닫고 이어서
await p.waitForFunction(()=>modal&&!!document.getElementById('r600Pick0'),null,{timeout:60000,polling:200}).catch(()=>{});
for(let i=0;i<40&&await A(()=>modal&&!!document.getElementById('r600Pick0'));i++){await A(()=>document.getElementById('r600Pick0')?.click());await p.waitForTimeout(120);}
await A(()=>{if(modal)closePanel(true);player.hp=maxHP();});
// 3) 코어 피격
await gameWait(1);await clear();
const ch0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreHits);
await A(()=>{const c=room.survivalR600.centre;for(const e of room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,4)){e.r600Core=true;e.hp=e.maxHp=1e7;e.x=c.x+.5;e.y=c.y;e.r600CoreAt=-9;}player.hp=maxHP();});
await gameWait(2.5);
{const c=await calls(),hits=(await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreHits))-ch0;ok('core was actually hit (test precondition)',hits>=1,hits);
 ok('core hit plays a guard sound',count(c,'parry')>=1,c.slice(0,10));ok('core hit sound is rate-limited (≤ 1 per 1.5s + 1)',count(c,'parry')<=Math.floor(2.5/1.5)+1,count(c,'parry'));}
// 4) 영웅 쓰러짐 — 생존의 showDeath 가로채기가 R546 쓰러짐 소리를 건너뛰지 않는다
await A(()=>{player.hp=maxHP();});await clear();
await A(()=>{showDeath();});
{const c=await calls();ok('hero fall plays r546Fall (allowModal)',c.some(x=>x[0]==='r546Fall'&&x[1]),c);}
// 5) 코어 파괴 — 새 판을 시작해서 코어 체력을 0 으로
await A(()=>{if(modal)closePanel(true);});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.start('hwando','normal'));
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading,null,{timeout:240000});
await A(()=>{window.__STORYWORLD_SURVIVAL_R600__.skipNarration();if(modal)closePanel(true);});
// 6) 회복 차임 — 틱당 0.12% 잔회복은 4% 가 모일 때까지 조용하고, 3초(게임 시간) 안에 두 번 울리지 않는다. 큰 회복은 간격이 지나면 울린다.
const hs=()=>A(()=>{const s=window.__STORYWORLD_SURVIVAL_R600__.inspect().stats;return {cues:s.healCues||0,muted:s.healMuted||0,t:time};});
await A(()=>{player.hp=maxHP()*.4;});await gameWait(3.2);await p.waitForTimeout(100);const h0=await hs();
await A(async()=>{for(let i=0;i<120;i++){player.hp=Math.min(maxHP()*.9,player.hp+maxHP()*.0012);sound('swHeal');if(i%10===9)await new Promise(r=>setTimeout(r,20));}});
{const h1=await hs(),dt=h1.t-h0.t;ok('trickle regen (120 × 0.12%) is mostly silent',h1.muted-h0.muted>=100,{h0,h1});
 ok('trickle regen chimes at most once per 3s of game time',h1.cues-h0.cues<=Math.floor(dt/3)+1,{cues:h1.cues-h0.cues,dt});}
// 기다리는 동안 전투 흡혈이 차임을 먼저 쓰지 않게 체력을 가득 채워 둔다(가득이면 회복이 없다)
await A(()=>{window.__full=setInterval(()=>{try{player.hp=maxHP();}catch(_){}},15);});for(let i=0;i<5;i++){const c0=(await hs()).cues;await gameWait(3.4);if((await hs()).cues===c0)break;}/* 앞서 모인 잔회복이 간격 끝에 한 번 울릴 수 있으니, 3초 넘게 조용했던 것을 확인하고 넘어간다 */await A(()=>{clearInterval(window.__full);player.hp=maxHP()*.5;});await p.waitForTimeout(150);
{const h1=await hs();await A(()=>{player.hp=Math.min(maxHP(),player.hp+maxHP()*.2);sound('swHeal');});const h2=await hs();ok('a large heal after the gap chimes',h2.cues-h1.cues===1,{h1,h2});
 await A(()=>{player.hp=Math.min(maxHP(),player.hp+maxHP()*.2);sound('swHeal');});const h3=await hs();ok('a second large heal right after stays silent',h3.cues===h2.cues&&h3.muted===h2.muted+1,{h2,h3});}
await gameWait(1);await clear();await A(()=>window.__STORYWORLD_SURVIVAL_R600__.qaCoreHp(0));
await p.waitForTimeout(400);
{const c=await calls();ok('core destruction plays r546Fall (allowModal)',c.some(x=>x[0]==='r546Fall'&&x[1]),c);}
ok('no page errors',errs.length===0,errs);
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
