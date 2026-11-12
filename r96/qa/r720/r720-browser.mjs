// R720 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기/자연 플레이 검증 아님): 무한 생존 영웅 배치.
//  실제 빌드에서 I 키 → 창 → 영입·배치 → 스스로 공격 → 강화 → 교대(창 단추·엔진 영웅 변경) → 다음 지역 → 새 판 초기화 → 스토리 모드 불간섭.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const shot=async n=>{if(SHOTS)await p.screenshot({path:SHOTS+'/'+n+'.png'});};const A=(f,a)=>p.evaluate(f,a);
const D=()=>A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;return {...d.state(),allies:d.allies(),ins:d.inspect(),modal:!!modal,hero:player.hero,px:player.x,py:player.y,panel:!!document.getElementById('r720Panel')&&!document.getElementById('modal').classList.contains('hidden')};});
// 게임 시간으로 기다린다(헤드리스는 게임 시간이 벽시계보다 느리다)
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:240000});};

await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
// 스토리 쪽 불간섭(타이틀): I 를 눌러도 창이 없다
await p.keyboard.press('i');ok('title screen: I does nothing',await A(()=>!document.getElementById('r720Panel')));
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
let s=await D();ok('fresh run: no crystals, main hero owned, no slots',s.crystals===0&&s.main==='hwando'&&s.slots.length===0&&s.ins.stats.errors===0,s);
ok('nav button shows only in survival with the crystal count',await A(()=>{const b=document.getElementById('r720NavBtn');return !!b&&b.style.display!=='none'&&/배치/.test(b.textContent);}));

// I → 창(전투 멈춤) → I → 닫힘
await p.keyboard.press('i');await p.waitForFunction(()=>!!document.getElementById('r720Panel'),null,{timeout:20000});s=await D();
ok('I opens the placement window and pauses the fight',s.panel&&s.modal,s);
ok('window lists 8 heroes, prices rise in order',await A(()=>{const pr=[...document.querySelectorAll('[data-r720buy]')].map(b=>+b.textContent.replace(/\D/g,''));return document.querySelectorAll('.r720Hero').length===8&&pr.length===7&&pr.every((v,i)=>i===0||v>pr[i-1])&&[...document.querySelectorAll('[data-r720buy]')].every(b=>b.disabled);}));
await shot('r720-1-window-empty');
const t0=await A(()=>time);await p.waitForTimeout(1200);ok('game time does not advance while the window is open',await A(a=>time===a,t0));
await p.keyboard.press('i');await p.waitForTimeout(300);s=await D();ok('I again closes it',!s.panel&&!s.modal,s);
// 처치 보상(실제 몹 한 마리를 엔진 hitEnemy 로 처치)
await p.waitForFunction(()=>room.enemies.some(e=>e.hp>0&&e.survivalR600&&!e.r600Elite&&time>(e.graceUntil||0)+.2),null,{timeout:120000});/* 등장 직후 보호 시간(graceUntil)에는 엔진이 처치를 받지 않는다 */
const got=await A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,c0=d.state().crystals,e=room.enemies.find(e=>e.hp>0&&e.survivalR600&&!e.r600Elite&&time>(e.graceUntil||0)+.2);hitEnemy(e,1e9);/* 실제 처치 길(hitEnemy → killEnemy). 체력이 남은 적에게 killEnemy 를 바로 부르면 죽음 연출 덧씌우기가 받지 않는다 */return {c0,c1:d.state().crystals,dead:!!e.deadRecorded};});
ok('a kill gives one crystal',got.dead&&got.c1===got.c0+1,got);

// 영입 → 지금 자리에 배치(코어 사거리 안)
await A(()=>{const z=room.survivalR600.centre;player.x=z.x+2.5;player.y=z.y+1;window.__STORYWORLD_HERO_DEFENSE_R720__.qaGive(1000);});
await p.keyboard.press('i');await p.waitForFunction(()=>!!document.querySelector('[data-r720buy="seoha"]'),null,{timeout:20000});
await A(()=>document.querySelector('[data-r720buy="seoha"]').click());await p.waitForTimeout(200);s=await D();
ok('buying places the hero where the player stands',s.slots.length===1&&s.slots[0].hero==='seoha'&&Math.abs(s.slots[0].ox-2.5)<.05&&Math.abs(s.slots[0].oy-1)<.05&&s.owned.seoha===true,s.slots);
ok('window re-renders with the slot card and upgrade buttons',await A(()=>document.querySelectorAll('.r720Slot:not(.empty)').length===1&&document.querySelectorAll('[data-r720up]').length===3&&/윤서하/.test(document.querySelector('.r720Slot').textContent)));
await shot('r720-2-window-placed');
// 강화(레벨·사거리·이동 반경 한 번씩)
const c0=s.crystals;for(const k of['level','range','radius']){await A(k=>document.querySelector('[data-r720up="0:'+k+'"]').click(),k);await p.waitForTimeout(120);}
s=await D();ok('upgrades apply to the slot and cost crystals',s.slots[0].lv===2&&s.slots[0].rangeLv===1&&s.slots[0].radiusLv===1&&s.crystals===c0-30-25-20,{c0,c:s.crystals,slot:s.slots[0]});
// 코어 사거리 밖에서는 배치 불가(영입은 됨)
await p.keyboard.press('i');await p.waitForTimeout(200);
await A(()=>{const z=room.survivalR600.centre;player.x=z.x-9;player.y=z.y;});
await p.keyboard.press('i');await p.waitForFunction(()=>!!document.querySelector('[data-r720buy="neon"]'),null,{timeout:20000});
ok('outside the core ring the window says so',await A(()=>document.querySelector('.r720Spot').classList.contains('bad')&&/사거리 밖/.test(document.querySelector('.r720Spot').textContent)));
await A(()=>document.querySelector('[data-r720buy="neon"]').click());await p.waitForTimeout(200);s=await D();
ok('bought outside the ring: owned but not placed',s.owned.neon===true&&s.slots.length===1,s);
await p.keyboard.press('i');await p.waitForTimeout(200);
await A(()=>{const z=room.survivalR600.centre;player.x=z.x-2.5;player.y=z.y+1;});
await p.keyboard.press('i');await p.waitForFunction(()=>!!document.querySelector('[data-r720place="neon"]'),null,{timeout:20000});
await A(()=>document.querySelector('[data-r720place="neon"]').click());await p.waitForTimeout(200);s=await D();
ok('placing an owned hero inside the ring',s.slots.length===2&&s.slots[1].hero==='neon',s.slots);
await p.keyboard.press('i');await p.waitForTimeout(200);

// 스스로 공격: 게임 시간 4초 동안 배치 영웅이 때리고, 이동 반경을 벗어나지 않는다
const h0=(await D()).ins.stats.hits;await A(()=>{player.hp=maxHP();player.invincible=9999;});await waitGame(4);
s=await D();const lim=await A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,P=d.pure,z=room.survivalR600,st=d.state();return d.allies().map((a,i)=>{const an=P.anchorOf(st.slots[i],z.centre,z.arena);return {d:Math.hypot(a.x-an.x,a.y-an.y),r:P.slotStats(st.slots[i]).radius};});});
ok('placed heroes attack on their own',s.ins.stats.hits>h0,{h0,h:s.ins.stats.hits});
ok('they stay inside their move radius',lim.every(x=>x.d<=x.r+1e-6),lim);
ok('ally props are in the room once each and get drawn',await A(()=>room.props.filter(q=>q.r720AllyProp).length===2)&&s.ins.stats.draws>0,s.ins.stats);
ok('every kill is still counted by survival (kills, XP gems) and rewarded once',await A(()=>{const k=window.__STORYWORLD_SURVIVAL_R600__.state().kills;return k>0&&k===window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.rewards;}));
await shot('r720-3-field');

// 교대(창 단추): 윤서하를 조종하고 환도가 그 자리에
const before=await D();await p.keyboard.press('i');await p.waitForFunction(()=>!!document.querySelector('[data-r720swap="0"]'),null,{timeout:20000});
await A(()=>document.querySelector('[data-r720swap="0"]').click());await p.waitForFunction(()=>player.hero==='seoha'&&!modal,null,{timeout:60000});await waitGame(.3);s=await D();
ok('swap button: now controlling seoha, hwando takes that slot with its upgrades',s.hero==='seoha'&&s.main==='seoha'&&s.slots[0].hero==='hwando'&&s.slots[0].lv===2&&s.slots[0].rangeLv===1&&Math.abs(s.slots[0].ox-before.slots[0].ox)<1e-9,s.slots[0]);
ok('player position unchanged by the swap',Math.abs(s.px-before.px)<3&&Math.abs(s.py-before.py)<3,{b:[before.px,before.py],a:[s.px,s.py]});
await waitGame(1.5);await shot('r720-4-swapped');
// 교대(엔진 영웅 변경 창): 환도로 돌아오면 윤서하가 다시 그 자리
await A(()=>showHeroes(false));await p.locator('[data-hero="hwando"]').first().click();await p.locator('#chooseHero').click();
await p.waitForFunction(()=>player.hero==='hwando'&&!modal&&!loading,null,{timeout:60000});await waitGame(.3);s=await D();
ok('engine hero-change window: back to hwando, seoha returns to the slot',s.main==='hwando'&&s.slots[0].hero==='seoha'&&s.slots[1].hero==='neon',s.slots);

// 다음 지역: 코어 기준 같은 자리
await A(()=>{room.enemies.length=0;return window.__STORYWORLD_SURVIVAL_R600__.qaGo(1);});
await p.waitForFunction(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__.state();return z.i===1&&z.ready&&!loading;},null,{timeout:240000});await waitGame(.3);
const nx=await A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600,st=d.state();return {n:room.props.filter(q=>q.r720AllyProp).length,off:d.allies().map((a,i)=>Math.hypot(a.x-(z.centre.x+st.slots[i].ox),a.y-(z.centre.y+st.slots[i].oy))),r:d.allies().map((a,i)=>d.pure.slotStats(st.slots[i]).radius)};});
ok('next region: the same slots stand around the new core',nx.n===2&&nx.off.every((d,i)=>d<=nx.r[i]+1e-6),nx);await shot('r720-5-next-region');

// 강화 카드 창이 떠 있을 때 I 는 그 창을 건드리지 않는다
await A(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__;z.skipNarration();z.qaCredit(400);z.qaPlayT(78);});
await p.waitForFunction(()=>modal&&document.querySelectorAll('.r600Card').length===3,null,{timeout:60000});await p.keyboard.press('i');await p.waitForTimeout(300);
ok('I does not disturb the survival upgrade window',await A(()=>modal&&document.querySelectorAll('.r600Card').length===3&&!document.getElementById('r720Panel')));
for(let i=0;i<12;i++){const more=await A(()=>{const x=document.getElementById('r600Pick0');if(x){x.click();return true;}return false;});if(!more)break;await p.waitForTimeout(150);}
await p.waitForFunction(()=>!modal,null,{timeout:20000});

// 다시 도전(새 판): 초기화
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.start('seoha','normal'));
await p.waitForFunction(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__;return z.here()&&!loading&&z.state().ready&&z.state().i===0&&player.hero==='seoha';},null,{timeout:240000});await waitGame(.2);s=await D();
ok('new run: crystals, owned heroes and slots reset',s.crystals===0&&s.slots.length===0&&s.main==='seoha'&&Object.keys(s.owned).join()==='seoha'&&await A(()=>room.props.every(q=>!q.r720AllyProp)),s);
const sv=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect());ok('survival module reports no errors',sv.stats.errors===0,sv.lastError);
s=await D();ok('hero-defense module reports no errors',s.ins.stats.errors===0,s.ins.lastError);
ok('no page errors',errs.length===0,errs);await b.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0);
