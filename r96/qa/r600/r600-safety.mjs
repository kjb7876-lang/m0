// R600 안전 검사(헤드리스): 무한 생존이 스토리 세이브를 덮지 않는지, 생존 뒤 스토리 죽음 화면이 막히지 않는지.
//  1) 스토리 새 게임 → 저장(슬롯 기록) → 타이틀 → 무한 생존 시작 → 메뉴 '쉼터로'(returnHome) → 타이틀로 가고 슬롯 그대로
//  2) 다시 생존 → 생존 중 죽음 = 생존 결과 창(스토리 죽음 화면 아님) → 타이틀 → 슬롯 그대로
//  3) 스토리 이어하기(restoreSave) → 죽음 = 스토리 'MEMORY REMAINS' 복구 화면
//  SW_URL 로 주소를 바꾼다(기본 http://127.0.0.1:4410/m0/).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=f=>p.evaluate(f);
const slots=()=>A(()=>{const st=window.__STORYWORLD_TEST_STORAGE_B1__.store,k=normalSaveKeyR73();return{[k]:st.getItem(k)};});
const skip=()=>A(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const panel=()=>A(()=>document.getElementById('panel')?.textContent||'');
const SV=()=>A(()=>({active:window.__STORYWORLD_SURVIVAL_R600__.active(),st:window.__STORYWORLD_SURVIVAL_R600__.state()}));
const startSurvival=async()=>{await p.locator('#survivalStartR600').click({timeout:120000});await p.locator('[data-r600hero="hwando"]').click();
 try{await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});}catch(e){console.log('DBG',JSON.stringify(await A(()=>({room:room?.id,loading,modal,started,st:window.__STORYWORLD_SURVIVAL_R600__.state(),ins:window.__STORYWORLD_SURVIVAL_R600__.inspect().lastError,panel:(document.getElementById('panel')?.textContent||'').slice(0,120)}))).slice(0,800));throw e;}};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await A(()=>{saveGame(true);});await p.waitForTimeout(500);const s0=await slots();
ok('story save exists before survival',Object.values(s0).every(v=>typeof v==='string'&&v.length>100),Object.keys(s0));
// 1) 생존 중 메뉴 '쉼터로'
await A(()=>{if(modal)closePanel(true);showTitle();});await startSurvival();
await A(()=>{if(modal)closePanel(true);returnHome();});await p.waitForTimeout(2500);
const r1=await A(()=>({title:!!document.getElementById('survivalStartR600')&&document.getElementById('survivalStartR600').offsetParent!==null,saved:saveGame(false)}));
ok('menu retreat from survival lands on the title',r1.title,r1);
ok('menu retreat never writes the story save (slot unchanged, saves still blocked)',r1.saved===false&&JSON.stringify(await slots())===JSON.stringify(s0),r1);
// 2) 생존 중 죽음
await startSurvival();await A(()=>{if(modal)closePanel(true);showDeath();});await p.waitForTimeout(500);
const t2=await panel();ok('death during survival shows the survival result (not the story recovery panel)',/무한 생존 · 기록/.test(t2)&&!!(await A(()=>document.getElementById('r600Title'))),t2.slice(0,80));
await p.locator('#r600Title').click();await p.waitForTimeout(800);
ok('story save still unchanged after a lost survival run',JSON.stringify(await slots())===JSON.stringify(s0));
// 2b) 강화 창·메뉴로 전투가 멈춘 동안 서사가 넘어가지 않는다(웨이브 길이 보존)
await startSurvival();const n0=await A(()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),t:time}));await A(()=>openPanel('<h2>멈춤 검사</h2>'));await p.waitForTimeout(45000);
const n1=await A(()=>({st:window.__STORYWORLD_SURVIVAL_R600__.state(),t:time,modal}));await A(()=>closePanel(true));
ok('narration holds while the game is paused (still narrating, minimum wave end in game time)',n1.modal&&n1.st.narrating===true&&n1.st.narrMinEnd>n0.t+5,{narr:n1.st.narrating,min:n1.st.narrMinEnd,t0:n0.t,t1:n1.t});
// 2c) 마지막 결투(last301)의 스토리 전용 '정해진 쓰러짐'이 생존 보스를 붙잡지 않는다
{const idx=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.stageIds().indexOf('last301'));await p.evaluate(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),idx);
 await p.waitForFunction(()=>room?.id==='last301'&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000}).catch(()=>{});
 await A(()=>{if(modal)closePanel(true);});await p.waitForFunction(()=>room.enemies.some(e=>e.hp>0&&e.survivalR600&&e.spawnState==='active'),null,{timeout:180000}).catch(()=>{});
 // 틱 경로: 보스가 66% 아래로 내려가고 게임 시간이 흘러도 R75 쓰러짐·완료 정리(decorate 가 적 숨김)가 생존 적을 숨기지 않는다
 const tk=await A(()=>{if(modal)closePanel(true);const e=room.enemies.find(e=>e.hp>0&&e.survivalR600&&e.spawnState==='active');if(!e)return{none:true};e.boss=true;room.engaged=true;e.maxHp=1e6;e.hp=4e5;/* 2초 동안 영웅·코어 공격에 쓰러지지 않게, 66% 아래 */window.__r600tk={e,t:time};return{t:time};});
 await p.waitForFunction(()=>time>window.__r600tk.t+2,null,{timeout:180000}).catch(()=>{});
 const tr=await A(()=>{const live=room.enemies.filter(e=>e.survivalR600&&e.hp>0);return{room:room.id,live:live.length,hidden:live.filter(e=>e.spawnState==='hidden').length,fin:!!room.finalizing,heroHp:Math.round(player.hp/maxHP()*100),done:!!progress.STORY?.last301};});
 ok('last301 tick in survival keeps enemies visible (no scripted fall, no completed-region hiding)',!tk.none&&tr.room==='last301'&&tr.live>0&&tr.hidden===0&&!tr.fin&&!tr.done,{...tr});
 const k=await A(()=>{if(modal)closePanel(true);const e=room.enemies.find(e=>e.hp>0&&e.survivalR600)||null;if(!e)return{none:true,room:room?.id};e.boss=true;e.hp=0;killEnemy(e);/* 엔진처럼 체력 0 뒤 처치 */const live=room.enemies.filter(o=>o.survivalR600&&o.hp>0);return{room:room.id,hp:e.hp,dead:!!e.deadRecorded,hidden:e.spawnState==='hidden'||live.some(o=>o.spawnState==='hidden'),fin:!!room.finalizing};});
 ok('last301 boss kill in survival is a real kill (no campaign scripted fall)',idx>=0&&k.room==='last301'&&k.hp<=0&&k.dead&&!k.hidden&&!k.fin,{idx,...k});}
// 2d) 메뉴 '처음 화면' 이 생존 중에도 나가진다(저장 없이)
{const s1=await slots();await A(()=>{if(modal)closePanel(true);showMenu();});await p.waitForTimeout(300);await A(()=>document.getElementById('menuTitle')?.click());await p.waitForTimeout(1500);
 const m=await A(()=>({active:window.__STORYWORLD_SURVIVAL_R600__.active(),title:!!document.getElementById('survivalStartR600')}));
 ok('menu title button leaves survival to the title without writing the story save',m.active===false&&m.title&&JSON.stringify(await slots())===JSON.stringify(s1)&&JSON.stringify(s1)===JSON.stringify(s0),m);}
// 2e) 스토리 새 게임 확인 창(R101 영웅 줄)을 열었다 취소한 뒤에도 생존에서 고른 영웅으로 시작한다
{await A(()=>{if(modal)closePanel(true);showTitle();});await p.waitForTimeout(500);
 await p.locator('#campaignNew54').click({timeout:60000});await p.waitForTimeout(500);const row=await A(()=>({row:!!document.getElementById('heroRowR101'),picked:window.__STORYWORLD_POLISH_R101__?.pickedHero?.()}));
 await A(()=>document.getElementById('slotCancelR73')?.click());await p.waitForTimeout(300);await A(()=>{if(modal)closePanel(true);showTitle();});await p.waitForTimeout(500);
 await p.locator('#survivalStartR600').click({timeout:60000});await p.locator('[data-r600hero="hunter"]').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000}).catch(()=>{});
 const h=await A(()=>({hero:player.hero,picked:window.__STORYWORLD_POLISH_R101__?.pickedHero?.()??null}));
 ok('survival starts with the survival-picked hero even after the campaign hero row was opened and cancelled',h.hero==='hunter',{...row,...h});
 await A(()=>{if(modal)closePanel(true);showMenu();});await p.waitForTimeout(300);await A(()=>document.getElementById('menuTitle')?.click());await p.waitForTimeout(1500);}
// 3) 스토리 이어하기 → 죽음 화면
const loaded=await A(async()=>{const st=window.__STORYWORLD_TEST_STORAGE_B1__.store;let raw=null;try{raw=JSON.parse(st.getItem(normalSaveKeyR73()));}catch(_){}return raw?await restoreSave(raw):false;});
await p.waitForTimeout(1500);await p.waitForFunction(()=>started&&!loading,null,{timeout:240000}).catch(()=>{});/* 불러오기 창 글은 닫힌 뒤에도 패널 안에 남으므로 loading 으로 본다 */await skip();await p.waitForTimeout(600);await A(()=>{if(modal)closePanel(true);});
await A(()=>{player.hp=0;showDeath();});/* R151 쓰러짐 연출은 체력 0 일 때만 끝에 창을 연다 */await p.waitForTimeout(3000);
const d=await A(()=>({survival:window.__STORYWORLD_SURVIVAL_R600__.active(),modal:!!modal,tx:(document.getElementById('panel')?.textContent||'').slice(0,80)}));
ok('story death after a survival run shows the normal recovery panel',d.modal&&/MEMORY REMAINS/.test(d.tx)&&!d.survival,{loaded:loaded!==false,...d});
ok('no page errors',errs.length===0,errs);
console.log('R600 safety',n-fail+'/'+n);await b.close();process.exit(fail?1:0);
