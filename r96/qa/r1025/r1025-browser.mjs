// R1025 브라우저 검사(헤드리스, 소프트웨어 렌더): 특수 패시브 레벨 해금·소환 영웅 서사 확인을 실제 게임에서 확인.
//  ① 스토리: 해금 API 가 스토리 모드·영웅 레벨을 읽음. Lv1 은 주사위 0 이어도 서하 패시브 0번, Lv5 는 시간 붕괴만.
//  ② 스토리 서사 잠금: 서사 지역 방문 전 서하 평행세계 소집은 영웅 0명(시간 붕괴로 대신), dreamRest·hando03 방문 뒤 헌터·라우렌만(네온 빠짐).
//     소환 몸은 진짜 영웅 그리기(drawHero) — 그린 횟수·소환 영웅 그림 읽힘 확인 + 장면 사진.
//  ③ 헌터: 슬레이어 서사 전 혈맹 호출은 안 나가고, 기러기진은 슬레이어 없이. dreamRest 뒤에는 슬레이어가 나옴.
//  ④ 무한생존: 모드 'survival', 생존 레벨 기준, 서사 없어도 소환 열림, 생존 레벨이 문턱을 넘으면 해금 알림.
// 쓰기: SW_URL=http://127.0.0.1:4410/m0/ [SHOT=경로접두어] node r96/qa/r1025/r1025-browser.mjs
import {chromium,URL,skip,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'';let fail=0;const ok=(n,c,x)=>{console.log(c?'PASS':'FAIL',n,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();
const U='window.__STORYWORLD_PASSIVE_UNLOCK_R1025__',SE='window.__STORYWORLD_SEOHA_EPOCH_R949__',HU='window.__STORYWORLD_HUNTER_SQUAD_R952__';
// ── 스토리 ──
{const ctx=await b.newContext({viewport:{width:960,height:540}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);await go(p,'dist00');await p.waitForTimeout(1500);
 ok('dist00 몹 있음',await p.evaluate(()=>zone==='dist00'&&room.enemies.filter(e=>!e.boss&&!e.midboss).length>=3));
 await p.evaluate(async()=>{for(const h of ['seoha','hunter','slayer','lauren','neon'])await ensureImages(heroPaths(h));player.hero='seoha';player.hp=player.maxHp=99999;auto=false;guide=false;
  const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,8);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
  live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:1.6;e.x=player.x+2.4+Math.cos(a)*r;e.y=player.y+.3+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=9999999;e.damage=0;e.speed=0;e.moveSpeed=0;e.cd=1e6;});window.__ids=live.map(e=>e.id);});
 const st=await p.evaluate(U+'.inspect()');ok('① 스토리 모드로 읽음',st.mode==='story',st);
 const roll=lv=>p.evaluate(([SE,lv])=>{const a=eval(SE);player.level=lv;a.qaReset();a.qaRandom(()=>0);const s0=a.inspect().stats.procTotal;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'seoha'});const i=a.inspect();const k=i.active?i.active.kind:null;a.qaReset();a.qaRandom(null);return {procs:i.stats.procTotal-s0,kind:k};},[SE,lv]);
 let r=await roll(1);ok('① Lv1: 주사위 0 이어도 발동 0',r.procs===0,r);
 r=await roll(4);ok('① Lv4: 발동 0',r.procs===0,r);
 r=await roll(5);ok('① Lv5: 1단 시간 붕괴 발동',r.procs===1&&r.kind==='collapse',r);
 const t=await p.evaluate(U+'.table()');ok('① 표: Lv5 서하 1단만 열림',t.seoha[0].open&&!t.seoha[1].open&&!t.seoha[2].open,t.seoha);
 // ② 서사 잠금
 const summon=trio=>p.evaluate(([SE,trio])=>{const a=eval(SE);player.level=777;a.qaReset();a.qaTrio(trio);a.qaForce('heroes');const f0=a.inspect().stats.fallbacks;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'seoha'});const i=a.inspect();return {kind:i.active?i.active.kind:null,heroes:i.summons.map(s=>s.hero),fallback:i.stats.fallbacks-f0};},[SE,trio]);
 const visited0=await p.evaluate(()=>[...visited]);
 r=await summon(['neon','hunter','lauren']);ok('② 서사 전: 영웅 0명, 시간 붕괴로 대신',r.heroes.length===0&&r.kind==='collapse'&&r.fallback===1,{r,visited0});
 await p.evaluate(SE+'.qaReset()');await p.waitForFunction(SE+'.inspect().active===null',null,{timeout:600000,polling:200}).catch(()=>{});
 await p.evaluate(()=>{visited.add('STORY:dreamRest');visited.add('STORY:hando03');});
 r=await summon(['neon','hunter','lauren']);const OPEN=['hunter','slayer','lauren'];ok('② dreamRest·hando03 뒤: 서사 열린 헌터·슬레이어·라우렌 안에서만(네온 빠짐, 빈자리는 열린 영웅으로)',r.kind==='heroes'&&r.heroes.length===3&&r.heroes.every(h=>OPEN.includes(h))&&r.heroes.includes('hunter')&&r.heroes.includes('lauren'),r);
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t0=>time-t0>=1.4,t0,{timeout:600000,polling:200});
 const d=await p.evaluate(SE+'.inspect()');ok('② 소환 몸을 진짜 영웅 그리기로 그림(bodyDraws '+d.stats.bodyDraws+')',d.stats.bodyDraws>0&&d.summons.every(s=>OPEN.includes(s.hero)));
 const ready=await p.evaluate(()=>['hunter','lauren','slayer'].every(h=>!!readyImage(heroArt[h].idle.front)));ok('② 소환 영웅 그림 = 그 영웅 그림 경로(heroArt)',ready);
 if(shot){await p.evaluate(()=>{const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};});await p.waitForTimeout(800);await p.screenshot({path:shot+'-story-summon.jpg',quality:88});await p.evaluate(()=>{tick=window.__tb;});}
 await p.waitForFunction(SE+'.inspect().active===null',null,{timeout:600000,polling:200}).catch(()=>{});
 // ③ 헌터
 await p.evaluate(()=>{visited.delete('STORY:dreamRest');player.hero='hunter';player.level=777;});
 const hfire=k=>p.evaluate(([HU,k])=>{const a=eval(HU);a.force(k);player.attackCD=0;target=room.enemies.find(v=>v.id===window.__ids[0]);basicAttack(true);const i=a.inspect();return {active:i.active,tier:i.tier,units:i.units.map(u=>u.hero)};},[HU,k]);
 r=await hfire('call');ok('③ 슬레이어 서사 전: 혈맹 호출 안 나감',!r.active,r);
 r=await hfire('squad');ok('③ 기러기진은 슬레이어 없이 헌터 분신만',r.active&&r.tier==='squad'&&r.units.length===4&&r.units.every(h=>h==='hunter'),r);
 await p.waitForFunction(HU+'.inspect().active===false',null,{timeout:600000,polling:200}).catch(()=>{});
 await p.evaluate(()=>{visited.add('STORY:dreamRest');const a=window.__STORYWORLD_HUNTER_SQUAD_R952__;const s=a.inspect();});
 await p.evaluate(HU+'.set?.(true)').catch(()=>{});
 await p.evaluate(()=>{const a=window.__STORYWORLD_HUNTER_SQUAD_R952__;try{a.qaReset?.();}catch(_){}});
 r=await hfire('call');ok('③ dreamRest 뒤: 혈맹 호출에 슬레이어',r.active&&r.units.includes('slayer'),r);
 const ins=await p.evaluate(U+'.inspect()');ok('스토리 오류 없음',ins.stats.errors===0&&errs.length===0,{ins,errs});
 await ctx.close();}
// ── 무한생존 ──
{const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="seoha"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 let i=await p.evaluate(U+'.inspect()');ok('④ 생존 모드·생존 레벨 1',i.mode==='survival'&&i.level===1,i);
 ok('④ 생존: 서사 없어도 소환 열림(네온·슬레이어)',await p.evaluate(U+'.summonOpen("neon")&&'+U+'.summonOpen("slayer")'));
 const toasts0=await p.evaluate(U+'.inspect().stats.toasts');
 await p.evaluate(()=>{const s=window.__STORYWORLD_SURVIVAL_R600__;s.qaCredit(30+22+5);});
 await p.waitForFunction(U+'.inspect().level>=2',null,{timeout:60000});await p.waitForTimeout(1500);
 i=await p.evaluate(U+'.inspect()');const tb=await p.evaluate(U+'.table()');
 ok('④ 생존 Lv2: 서하 1단 열림·2단 잠김',tb.seoha[0].open&&!tb.seoha[1].open,{lv:i.level,s:tb.seoha});
 ok('④ 해금 알림 1번',i.stats.toasts-toasts0===1,i.stats);
 ok('생존 오류 없음',i.stats.errors===0&&errs.length===0,{errs});
 await ctx.close();}
await b.close();console.log(fail?'R1025 browser: FAIL '+fail:'R1025 browser: all pass');process.exit(fail?1:0);
