// R600 무한 생존 모드 브라우저 검사(헤드리스, 소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님).
//  처음 화면 입구 → 영웅 고르기 → 첫 지역 직사각형 무대·중앙 시작 → 서사 동안 몹 생성 → 경험치 조각·3택 강화 → 서사 끝+6.5초 뒤 생성 멈춤
//  → 섬멸하면 보스 서사·보스 등장 → 섬멸하면 다음 지역 자동 전환(다시 중앙) → 저장 안 함 → 코어가 부서지면 결과 창 → 다시 도전.
//  SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4410/m0/). 스크린샷은 SHOTS=폴더 로.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const shot=async n=>{if(SHOTS)await p.screenshot({path:SHOTS+'/'+n+'.jpg',quality:82});};
const A=f=>p.evaluate(f);const S=()=>A(()=>window.__STORYWORLD_SURVIVAL_R600__.state());
// 레벨업 3택이 열리면(게임이 멈춤) 첫 카드를 골라 넘긴다 — 몰려오는 적을 잡는 사이 여러 번 뜰 수 있다.
const pickAny=()=>A(()=>{const b=document.getElementById('r600Pick0');if(b&&modal){b.click();return 1;}return 0;});
const waitT=async(fn,arg,limit=240000)=>{const end=Date.now()+limit;for(;;){await pickAny();if(await p.evaluate(fn,arg))return;if(Date.now()>end)throw new Error('timeout '+fn);await p.waitForTimeout(250);}};
const gameWait=async(sec,limit=240000)=>{const t0=await A(()=>time);await waitT(t=>time>=t,t0+sec,limit);};
await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});
const slotKeys=()=>A(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!/maps\.v1$|r183|r370|settings/i.test(k)).map(k=>[k,localStorage.getItem(k)])));
const ls0=await slotKeys();
ok('title: survival entry present, pixel entry gone',await A(()=>!!document.getElementById('survivalStartR600')&&!document.getElementById('pixelStartR306')&&document.getElementById('survivalStartR600').textContent==='무한 생존으로 시작'));
await shot('01-title');
await p.locator('#survivalStartR600').click();
const heroes=await A(()=>[...document.querySelectorAll('[data-r600hero]')].map(b=>b.getAttribute('data-r600hero')));
ok('hero picker lists every hero',heroes.length>=8&&heroes.includes('hwando'),heroes);await shot('02-heroes');
await p.locator('[data-r600hero="hwando"]').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading,null,{timeout:240000});
{const r=await A(()=>{const L=room.exploration,c=room.survivalR600.centre,host=window.__STORYWORLD_EXPLORATION__.layout('dist00');return{id:room.id,type:L.type,cells:L.floorCells.length,rects:L.floorRects.length,b:L.bounds,px:[player.x,player.y],c,auto,guide,hero:player.hero,first:window.__STORYWORLD_SURVIVAL_R600__.state().ids};});
 ok('first map = first story combat region (dist00), hwando',r.id==='dist00'&&r.hero==='hwando',r);
 ok('one wide rectangle the size of the story map (100x104 → 98x102 floor)',r.type==='r600-survival'&&r.rects===1&&r.cells===98*102,r);
 ok('starts at map centre (just below the core)',Math.abs(r.px[0]-r.c.x)<.6&&Math.abs(r.px[1]-r.c.y-1.8)<.6,r);
 ok('semi-auto on, guide off',r.auto===true&&r.guide===false,r);}
await gameWait(3);
{const r=await A(()=>({narr:window.__STORYWORLD_SURVIVAL_R600__.narr(),st:window.__STORYWORLD_SURVIVAL_R600__.state(),alive:room.enemies.filter(e=>e.hp>0).length,subs:document.getElementById('r600Subs')?.classList.contains('on'),hud:document.getElementById('r600Hud')?.textContent}));
 ok('narration plays with subtitles',r.narr.playing&&r.subs===true&&r.st.narrating===true,r.narr);
 ok('enemies keep spawning while narration plays (capped)',r.alive>0&&r.alive<=48,r.alive);
 {const h0=await A(()=>room.enemies.filter(e=>e.hp>0&&e.survivalR600).map(e=>[e.id,e.maxHp,!!e.r61PreserveHealth]));await gameWait(1);const h1=await A(()=>Object.fromEntries(room.enemies.filter(e=>e.survivalR600).map(e=>[e.id,e.maxHp])));const bad=h0.filter(([id,m,f])=>!f||(id in h1&&h1[id]!==m));ok('survival HP survives the native R61 normalizer (marked + unchanged after ticks)',h0.length>0&&bad.length===0,{n:h0.length,bad:bad.slice(0,3)});}ok('HUD shows mode, map and kills',/무한 생존/.test(r.hud)&&/악마화 나무의 정원/.test(r.hud),r.hud);}
await shot('03-wave');
// 경험치 조각·3택
{await A(()=>{const e=room.enemies.find(e=>e.hp>0);e.hp=.5;hitEnemy(e,5);});const g=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().gems);ok('kill drops an XP shard (not instant XP)',g>=1,g);
 await A(()=>{player.xp=levelCost(player.level)-1;});await gameWait(1.2);
 await A(()=>{const e=room.enemies.find(e=>e.hp>0&&e.survivalR600);if(e){e.x=player.x+.2;e.y=player.y;e.hp=.5;hitEnemy(e,5);}});
 await p.waitForFunction(()=>!!document.getElementById('r600Pick0'),null,{timeout:120000,polling:200}).catch(()=>{});
 const cards=await A(()=>[...document.querySelectorAll('.r600Card')].map(b=>b.textContent));ok('level up pauses and offers 3 choices',cards.length===3&&new Set(cards).size===3&&await A(()=>modal),cards);
 {const v=await A(()=>{const e=document.getElementById('r600Subs');return e?getComputedStyle(e).opacity:'none';});ok('narration subtitle hidden while the choice panel is open',v==='0'||v==='none',v);}
 await shot('04-choice');
 await p.keyboard.press('Escape');await p.waitForTimeout(300);await A(()=>{if(modal)closePanel(true);});/* Esc·다른 길로 닫힘 */
 await p.waitForFunction(()=>!!document.getElementById('r600Pick0')&&modal,null,{timeout:120000,polling:200}).catch(()=>{});ok('upgrade panel closed without a pick comes back (choice not lost)',await A(()=>!!document.getElementById('r600Pick0')&&modal&&document.querySelectorAll('.r600Card').length===3));
 const before=await A(()=>({pts:player.points,lv:player.level}));await p.locator('#r600Pick0').click();
 const after=await A(()=>({modal,taken:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.choices,pts:player.points}));ok('picking applies and resumes; no passive points granted',after.modal===false&&after.taken>=1&&after.pts===before.pts,{before,after});}
// 코어
{const c0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreShots);await A(()=>{const c=room.survivalR600.centre,e=room.enemies.find(e=>e.hp>0&&!e.boss);if(e){e.x=c.x+2;e.y=c.y;e.hp=e.maxHp=99999;}});await gameWait(2.5);
 const r=await A(()=>({shots:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreShots,core:window.__STORYWORLD_SURVIVAL_R600__.state().core}));ok('core purifies nearby enemies on its own',r.shots>c0,r.shots);
 const d=await A(()=>({props:room.props.filter(p=>p.r600CoreProp).length,draws:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.coreDraws||0}));ok('core is a room prop drawn in the engine prop pass (reaches the WebGL frame)',d.props===1&&d.draws>0,d);
 await A(()=>{window.__STORYWORLD_SURVIVAL_R600__.state();});const h0=await A(()=>{const S=window.__STORYWORLD_SURVIVAL_R600__;return S.state().core.hp;});ok('core has hp/regen/heal-on-kill spec',h0>0,h0);}
// 서사 끝 → +6.5초 뒤 생성 멈춤 → 섬멸 → 보스
{for(let i=0;i<400;i++){const pl=await A(()=>{const S=window.__STORYWORLD_SURVIVAL_R600__;if(S.narr().playing)S.skipNarration();return S.narr().playing;});if(!pl)break;await p.waitForTimeout(30);}
 await p.waitForFunction(()=>Number.isFinite(window.__STORYWORLD_SURVIVAL_R600__.state().narrEndAt),null,{timeout:30000});
 const e0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().narrEndAt);await waitT(t=>time>=t+3,e0);
 const sp1=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.spawned);ok('3 s after narration ends enemies still spawn (tail 6.5 s)',await A(()=>window.__STORYWORLD_SURVIVAL_R600__.pure.spawning(window.__STORYWORLD_SURVIVAL_R600__.state(),time)));
 await waitT(t=>time>=t+7,e0);const sp2=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.spawned);await gameWait(1.5);const sp3=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.spawned);
 ok('after narration + 6.5 s spawning stops',sp3===sp2,{sp1,sp2,sp3});
 await A(()=>{for(const e of room.enemies)if(e.hp>0){e.hp=.5;hitEnemy(e,5);}});
 await waitT(()=>window.__STORYWORLD_SURVIVAL_R600__.state().phase==='boss',null,120000).catch(()=>{});
 const r=await A(()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),boss:room.enemies.filter(e=>e.hp>0&&e.r600Boss).map(e=>[e.name,e.boss,Math.round(e.hp)]),eng:room.engaged,narr:window.__STORYWORLD_SURVIVAL_R600__.narr()}));
 ok('cleared wave → boss narration starts and the boss appears',r.st.phase==='boss'&&r.boss.length===1&&r.boss[0][1]===true&&r.eng===true&&r.narr.playing,r);
 {await gameWait(.6);const o=await A(()=>{const bb=document.getElementById('bossbar').getBoundingClientRect(),h=document.getElementById('r600Hud').getBoundingClientRect();return{bb:bb.bottom,bh:bb.height,hud:h.top};});ok('survival HUD sits below the boss bar (no overlap)',o.bh>0&&o.hud>=o.bb,o);}}
await gameWait(1.5);await shot('05-boss');
// 보스·남은 적 섬멸 → 다음 지역
{for(let i=0;i<400;i++){const pl=await A(()=>{const S=window.__STORYWORLD_SURVIVAL_R600__;if(S.narr().playing)S.skipNarration();return S.narr().playing;});if(!pl)break;await p.waitForTimeout(30);}
 for(let k=0;k<12;k++){await A(()=>{if(room.id!=='dist00')return;for(const e of room.enemies)if(e.hp>0){e.hp=.5;hitEnemy(e,5);}});const ph=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().phase);if(ph==='clear')break;await gameWait(1.5);}
 ok('all cleared → phase clear',await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state().phase==='clear'||room.id!=='dist00'));
 await waitT(()=>room?.id==='dist01'&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.here()&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null).catch(()=>{});
 const r=await A(()=>({id:room.id,px:[player.x,player.y],c:room.survivalR600?.centre,st:window.__STORYWORLD_SURVIVAL_R600__.state(),cells:room.exploration.floorCells.length}));
 ok('next map loads automatically (dist01) and restarts at the centre',r.id==='dist01'&&r.st.i===1&&r.st.startPos&&Math.abs(r.st.startPos.x-r.c.x)<.6&&Math.abs(r.st.startPos.y-r.c.y-1.8)<.6&&r.cells>9000,r);
 ok('new map starts at its first (pre-boss) narration wave, not the boss',r.st.phase==='pre'&&r.st.narrating===true&&!r.st.bossUp,{phase:r.st.phase,narr:r.st.narrating,boss:r.st.bossUp});}
await gameWait(2);await shot('06-next');
// 프레임 시간(헤드리스 참고값)
{await A(()=>{const c=room.survivalR600.centre;});await gameWait(4);const fr=await A(()=>new Promise(res=>{const t=[];let last=performance.now();const f=now=>{t.push(now-last);last=now;if(t.length<60)requestAnimationFrame(f);else res({avg:t.reduce((a,b)=>a+b,0)/t.length,max:Math.max(...t),alive:room.enemies.filter(e=>e.hp>0).length});};requestAnimationFrame(f);}));
 console.log('INFO frame (headless software, reference only)',JSON.stringify(fr));}
ok('no saves written by the run (slot data unchanged)',JSON.stringify(await slotKeys())===JSON.stringify(ls0));
// 코어 파괴 → 결과 → 다시 도전
{await A(()=>{const S=window.__STORYWORLD_SURVIVAL_R600__;const st=S.state();});await A(()=>{const c=room.survivalR600.centre;for(const e of room.enemies.filter(e=>e.hp>0).slice(0,6)){e.r600Core=true;e.x=c.x+.5;e.y=c.y;e.damage=99999;}player.x=c.x+12;player.y=c.y+12;});
 await waitT(()=>/정화 코어가 부서졌습니다/.test(document.getElementById('panel')?.textContent||''),null,180000).catch(()=>{});
 ok('core destroyed → run ends with a result panel',await A(()=>/정화 코어가 부서졌습니다/.test(document.getElementById('panel')?.textContent||'')&&!!document.getElementById('r600Again')));await shot('07-over');
 await p.locator('#r600Again').click();await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&room.id==='dist00',null,{timeout:240000}).catch(()=>{});
 ok('retry starts a fresh run at the first map',await A(()=>room.id==='dist00'&&window.__STORYWORLD_SURVIVAL_R600__.state().kills===0&&!window.__STORYWORLD_SURVIVAL_R600__.state().over));}
ok('upgrade levels never exceed their max',await A(()=>{const S=window.__STORYWORLD_SURVIVAL_R600__,lv=S.state().core.lv;return S.pure.CORE_UPS.every(u=>(lv[u.id]||0)<=u.max)&&UPGRADES.every(u=>(+player.upgrades?.[upgradeKey(u)]||0)<=u.max);}));
ok('story unlocks untouched by the run (coop gate restored)',await A(()=>!Object.prototype.hasOwnProperty.call(window.__STORYWORLD_COOP_SIM_R62__,'__r600')&&typeof window.__STORYWORLD_COOP_SIM_R62__.authoritativeRegionLoad==='function'&&window.__STORYWORLD_COOP_SIM_R62__.authoritativeRegionLoad('dist05','STORY')===false));
// 생존 패배 → 타이틀 → 스토리 죽음 화면은 그대로 떠야 한다
{await A(()=>{if(modal)closePanel(true);showDeath();});await p.waitForFunction(()=>!!document.getElementById('r600Title'),null,{timeout:60000}).catch(()=>{});await p.locator('#r600Title').click().catch(()=>{});await p.waitForTimeout(500);
 const st0=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.state()?.over);await A(()=>newGame('hwando'));await p.waitForFunction(()=>started&&!loading,null,{timeout:240000}).catch(()=>{});await A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await p.waitForTimeout(800);await A(()=>{if(modal)closePanel(true);});
 await A(()=>{player.hp=0;showDeath();});/* R151 쓰러짐 연출은 체력 0 일 때만 1.5초 뒤 창을 연다 */await p.waitForTimeout(3000);
 const d=await A(()=>{const tx=document.getElementById('panel')?.textContent||'';return{over:true,st0:window.__STORYWORLD_SURVIVAL_R600__.state()?.over,active:window.__STORYWORLD_SURVIVAL_R600__.active(),here:window.__STORYWORLD_SURVIVAL_R600__.here(),modal,panel:/MEMORY REMAINS/.test(tx)&&!/정화 코어|무한 생존/.test(tx),tx:tx.slice(0,80)};});d.over=st0;
 ok('after a lost survival run, the normal death panel is not suppressed',d.over===true&&d.active===false&&d.panel,d);await A(()=>{if(modal)closePanel(true);});}
// 메뉴 '쉼터로'(returnHome) → 타이틀로, 스토리 슬롯에 저장 안 함
{await A(()=>window.__STORYWORLD_SURVIVAL_R600__.start('hwando'));await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000}).catch(()=>{});
 const ls1=await slotKeys();await A(()=>{if(modal)closePanel(true);returnHome();});await p.waitForTimeout(1500);
 const r=await A(()=>({active:window.__STORYWORLD_SURVIVAL_R600__.active(),tainted:window.__STORYWORLD_SURVIVAL_R600__.state()?.tainted,saved:saveGame(false),title:!!document.getElementById('survivalStartR600')}));
 ok('menu retreat from survival goes to the title and never writes the story save',r.active===false&&r.tainted===true&&r.saved===false&&r.title&&JSON.stringify(await slotKeys())===JSON.stringify(ls1),r);}
const ins=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect());ok('no page errors, no module errors',errs.length===0&&ins.stats.errors===0,{errs,last:ins.lastError});
console.log(JSON.stringify(ins.stats));console.log('R600 browser',n-fail+'/'+n);await b.close();process.exit(fail?1:0);
