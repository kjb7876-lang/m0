// R426 headless check (Playwright): ① 기본 메뉴에 '영화 길잡이 모드' 단추, ② 길잡이가 보이는 적에게 공격 명령을 주고 처리 뒤 다시 움직임,
//  ③ 결전의 날(ep1a09b): 발록이 쓰러지면 초천사 배신 장면(R368 영상 또는 R317 장면)이 '본 적 있음'이어도 영화 모드에서 다시 나온다.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r426 node r96/qa/r426/r426-browser.mjs
// 헤드리스(소프트웨어 렌더·음성 없음): 판정만 본다. GPU·실기기·실제 음성·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r426';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(name,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,500)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));
 // 이전에 본 적 있음(옛 동작이면 다시 안 나옴)
 localStorage.setItem('storyworld.r317.betrayal',JSON.stringify({seen:true}));localStorage.setItem('storyworld.r368.betrayal',JSON.stringify({on:true,tint:true,seen:true}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
check('R426 loaded',await p.evaluate(()=>window.__STORYWORLD_GUIDE_CLEAR_R426__?.revision==='R426-clear-2-R441'&&window.__STORYWORLD_CINEMA_MODE_R370__.inspect().revision==='R370-cinema-6'));
// ① 메뉴
const m=await p.evaluate(async()=>{showMenu();await new Promise(r=>setTimeout(r,600));const b=document.getElementById('menuCinemaR426'),g=document.getElementById('menuGuide');
 return{text:b?.textContent,afterGuide:g?.nextElementSibling===b,group:b?.closest('[data-r339]')?.dataset.r339||null,visible:!!(b&&b.offsetParent)};});
check('menu shows "영화 길잡이 모드 켜기" next to 길잡이 in the 진행 group',m.text==='영화 길잡이 모드 켜기'&&m.afterGuide&&m.group==='진행'&&m.visible,m);
await p.screenshot({path:`${OUT}/menu.jpg`,quality:72});
await p.evaluate(()=>{document.getElementById('menuCinemaR426').click();});
const m2=await p.evaluate(()=>({cine:window.__STORYWORLD_CINEMA_MODE_R370__.prefs().on,modal:!!modal,guide}));
check('clicking it turns cinema guide mode on (and the guide) and closes the menu',m2.cine===true&&!m2.modal&&m2.guide===true,m2);
// ② 길잡이: dist00 으로 가서 보이는 적에게 명령
await p.waitForFunction(()=>room?.id==='dist00'&&!loading,null,{timeout:240000});
await p.waitForFunction(()=>window.__STORYWORLD_GUIDE_CLEAR_R426__.inspect().stats.picks>=1,null,{timeout:90000}).catch(()=>{});
const g1=await p.evaluate(()=>{const I=window.__STORYWORLD_GUIDE_CLEAR_R426__.inspect(),e=room.enemies.find(x=>x.id===I.focus);return{I,command,target,d:e?+distance(player,e).toFixed(1):null,hp:e?.hp,phase:window.__STORYWORLD_WORLD_COMBAT_R78__?.state(room)?.phase};});
check('guide picks a visible enemy and gives the attack order (command=target=focus)',g1.I.stats.picks>=1&&g1.I.focus&&g1.command===g1.I.focus&&g1.target===g1.I.focus,g1);
await p.screenshot({path:`${OUT}/guide-fight.jpg`,quality:72});
// 보이는 적을 모두 처치하면 다시 이동(원래 길잡이 차례가 돈다)
const g2=await p.evaluate(async()=>{const I0=window.__STORYWORLD_GUIDE_CLEAR_R426__.inspect().stats.passes;
 for(const e of room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden')){e.hp=.5;hitEnemy(e,5);}
 await new Promise(r=>setTimeout(r,4000));const I=window.__STORYWORLD_GUIDE_CLEAR_R426__.inspect();const nf=room.enemies.find(e=>e.id===I.focus);return{passes:I.stats.passes-I0,focus:I.focus,newFocus:!!(nf&&nf.hp>0&&nf.spawnState!=='hidden'&&command===nf.id),errors:I.stats.errors};});
check('after the visible enemies die the guide moves on, or turns to the next visible enemy (cinema respawn keeps the fight going)',(g2.passes>0||g2.newFocus)&&g2.errors===0,g2);
// ③ 결전의 날 시네마틱(영화 모드 + '본 적 있음')
await p.evaluate(async()=>{window.__STORYWORLD_CINEMA_SYNC_R384__?.set?.({finale:false,lock:false});window.__STORYWORLD_CINEMA_MODE_R370__.set({on:false});guide=false;auto=false;window.__STORYWORLD_GUIDE_CLEAR_R426__.set({on:false});try{await window.__STORYWORLD_CHEAT777__.activate('777');}catch(_){}await new Promise(r=>setTimeout(r,3000));for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);for(let k=0;k<4&&room?.id!=='ep1a09b';k++){window.__r426enter=await enterRegion('ep1a09b',null,{layer:'STORY',restore:true});await new Promise(r=>setTimeout(r,4000));}window.__r426log=room.id;});
await p.waitForFunction(()=>!loading&&room?.id==='ep1a09b',null,{timeout:120000}).catch(()=>{});await p.waitForTimeout(1500);
const e1=await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);window.__STORYWORLD_CINEMA_MODE_R370__.set({on:true});guide=false;auto=false;
 const B=room.enemies.find(e=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__?.isBalrog?.(e));return{room:room.id,balrog:!!B,ret:String(window.__r426enter),loading,log:window.__r426log};});
check('ep1a09b reachable with its Balrog',e1.room==='ep1a09b'&&e1.balrog,e1);
if(e1.balrog){const e2=await p.evaluate(async()=>{window.__STORYWORLD_CINEMA_SYNC_R384__?.set?.({finale:false,lock:false});room.engaged=true;
  const B=room.enemies.find(e=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.isBalrog(e));B.spawnState='active';B.hp=.5;hitEnemy(B,5);if(B.hp<=0&&!B.deadRecorded)killEnemy(B);
  await new Promise(r=>setTimeout(r,1500));return{dead:B.deadRecorded===true,video:!!document.getElementById('r368v'),slides:!!document.getElementById('r317Cinema'),r368:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect?.()?.stats||null};});
 check('Balrog falls → betrayal cinematic shows again in cinema mode although it was "seen" before',e2.dead&&(e2.video||e2.slides),e2);
 await p.screenshot({path:`${OUT}/betrayal.jpg`,quality:72});}
check('no page errors / R426 errors',errors.length===0&&(await p.evaluate(()=>window.__STORYWORLD_GUIDE_CLEAR_R426__.inspect().stats.errors))===0,{errors});
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;
