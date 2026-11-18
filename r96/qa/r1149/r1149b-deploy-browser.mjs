// R1149b 멀티 영웅 배치 헤드리스 검사(각자 1명): 아래 준비 부분은 r1149-browser.mjs 와 같다.
// R1149 무한생존 멀티플레이 헤드리스 검사: 브라우저 두 개(방장·친구)가 진짜 중계 서버 코드(옛 R62 고정본 = 지금 Render 에 떠 있는 판, 그리고 리포 최신)로
//  방 만들기 → 참가 → 준비 → '무한 생존 함께 시작' → 같은 무대·정화 구슬·몹 체력 배수·자동 레벨업·자기 영웅 선택지·판 끝 맞춤을 본다.
// 실행: 빌드한 site 를 http://127.0.0.1:4396/ 에 올린 뒤  node r96/qa/r1149/r1149-browser.mjs   (BASE=… , KINDS=legacy,current)
// 헤드리스 소프트웨어 렌더링 검사다. 실기기·GPU·사람 여럿의 자연 플레이·실제 Render 서버는 따로(미검증)다.
import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const BASE=process.env.BASE||'http://127.0.0.1:4396/';const OUT=path.join(ROOT,'out/r1149b');fs.mkdirSync(OUT,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,700));}};
const mods={legacy:await import(pathToFileURL(path.join(ROOT,'relay/test/fixtures/server-r62.mjs')).href),current:await import(pathToFileURL(path.join(ROOT,'relay/server.mjs')).href)};
const browser=await chromium.launch({args:['--disable-dev-shm-usage']});
async function page(tag){const ctx=await browser.newContext({viewport:{width:640,height:400}});const p=await ctx.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 await p.goto(BASE,{timeout:90000});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!document.getElementById('coopCreate62'),null,{timeout:120000});
 await p.evaluate(()=>{window.__r1149err=[];window.__STORYWORLD_COOP_CLIENT_R62__.on('error',e=>window.__r1149err.push(e.code));try{settings.sound=false;settings.music=false;settings.narration=false;}catch(_){}});p.tag=tag;return p;}
async function openCoop(p,id){await p.evaluate(()=>{const d=document.querySelector('details.r1015TitleMore');if(d)d.open=true;});await p.click(id);}
const insp=p=>p.evaluate(()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect(),M=window.__STORYWORLD_SURVIVAL_COOP_R1149__,S=window.__STORYWORLD_SURVIVAL_R600__;let st=null;try{st=S.state();}catch(_){}
 return{status:c.status,role:c.role,phase:c.phase,players:c.players.length,message:c.message,err:window.__r1149err,mp:M?.inspect?.()||null,sv:st&&{i:st.i,loop:st.loop,diff:st.diff,phase:st.phase,lv:st.lv,over:st.over,ready:st.ready,core:{hp:Math.round(st.core.hp),lv:st.core.lv},gems:st.gems},here:!!S?.here?.(),zone:typeof zone!=='undefined'?zone:null,
  arena:(()=>{try{return room.survivalR600.arena;}catch(_){return null;}})(),mobs:(()=>{try{return room.enemies.filter(e=>e.hp>0).length;}catch(_){return -1;}})()};});
async function until(p,fn,arg,ms,label){try{await p.waitForFunction(fn,arg,{timeout:ms,polling:250});return true;}catch(_){console.log('  (기다림 끝)',label,JSON.stringify(await insp(p)).slice(0,600));return false;}}
async function run(kind){
 const relay=mods[kind].createRelay({production:false});const addr=await relay.listen(0,'127.0.0.1');const endpoint=`ws://127.0.0.1:${addr.port}/ws`;
 const host=await page('host'),guest=await page('guest');
 try{
  await openCoop(host,'#coopCreate62');await host.waitForSelector('#coopRelay62');await host.fill('#coopRelay62',endpoint);await host.fill('#coopNick62','방장');await host.click('#coopConnect62');
  const hostIn=await until(host,()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return c.status==='connected'&&c.role==='host'&&!!c.code;},null,30000,'host connect');ok(hostIn,`[${kind}] 방장 방 만들기`);if(!hostIn)return;
  const code=await host.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().code);
  // 대기실: 방장에게만 '무한 생존 함께 시작' 단추, 혼자일 땐 누를 수 있고 손님이 준비 전이면 잠김
  ok(await until(host,()=>!!document.getElementById('svCoop1149Start')&&!!document.getElementById('svCoop1149Diff'),null,10000,'lobby button'),`[${kind}] 방장 대기실에 '무한 생존 함께 시작'·난이도`);
  await openCoop(guest,'#coopJoin62');await guest.waitForSelector('#coopCode62');await guest.fill('#coopCode62',code);await guest.fill('#coopRelay62',endpoint);await guest.fill('#coopNick62','친구');await guest.selectOption('#coopHero62','seoha');await guest.click('#coopConnect62');
  const guestIn=await until(guest,()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return c.status==='connected'&&c.role==='guest';},null,30000,'guest join');ok(guestIn,`[${kind}] 친구 참가`);if(!guestIn)return;
  await until(host,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().players.length===2,null,15000,'roster');
  ok(await guest.evaluate(()=>!document.getElementById('svCoop1149Start')),`[${kind}] 손님 대기실에는 시작 단추 없음`);
  ok(await host.evaluate(()=>document.getElementById('svCoop1149Start')?.disabled===true),`[${kind}] 손님 준비 전에는 시작 단추 잠김`);
  await guest.waitForSelector('#coopReady62:not([disabled])',{timeout:60000});await guest.click('#coopReady62');
  await host.waitForSelector('#svCoop1149Start:not([disabled])',{timeout:60000});await host.screenshot({path:path.join(OUT,`${kind}-lobby.png`)}).catch(()=>{});await host.selectOption('#svCoop1149Diff','easy');await host.click('#svCoop1149Start');
  const playH=await until(host,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing'&&window.__STORYWORLD_SURVIVAL_R600__.here()===true,null,240000,'host playing');
  const playG=await until(guest,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing'&&window.__STORYWORLD_SURVIVAL_R600__.here()===true,null,240000,'guest playing');
  const h0=await insp(host),g0=await insp(guest);ok(playH&&playG,`[${kind}] 함께 시작 → 둘 다 생존 무대에 섬`,[h0,g0]);if(!(playH&&playG))return;
  ok(h0.mp?.on&&h0.mp.role==='host'&&g0.mp?.on&&g0.mp.role==='guest',`[${kind}] 멀티 상태(방장·손님)`,[h0.mp,g0.mp]);
  ok(h0.zone===g0.zone&&!!h0.arena&&JSON.stringify(h0.arena)===JSON.stringify(g0.arena),`[${kind}] 같은 지역·같은 직사각형 무대`,[h0.zone,g0.zone,h0.arena,g0.arena]);
  ok(h0.sv?.diff==='easy'&&g0.sv?.diff==='easy'&&h0.sv.i===0&&g0.sv.i===0,`[${kind}] 난이도·단계 맞음`,[h0.sv,g0.sv]);
  ok(h0.mp.count===2&&h0.mp.deployLimit===1&&g0.mp.deployLimit===1,`[${kind}] 2명: 배치 한도 각자 1`,[h0.mp.deployLimit,g0.mp.deployLimit]);
  await host.evaluate(()=>{try{closePanel(true);}catch(_){}});await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});
  const D='__STORYWORLD_HERO_DEFENSE_R720__';
  const ids=await host.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().players.map(p=>p.id));const hid=await host.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().selfId),gid=ids.find(x=>x!==hid);
  const hs=()=>host.evaluate(k=>{const A=window[k];return{st:A.state(),mp:A.mp(),allies:A.allies(),err:A.inspect().lastError,errors:A.inspect().stats.errors,earned:A.inspect().stats.earned||0,gw:(A.mp().wallets.find(w=>w[0]!==A.mp().me)||[])[1]};},D);
  // 정화 결정은 싸움이 이어지는 동안 계속 들어온다(모두 같은 양) → 방장 값은 '준 것 − 쓴 것 + 그동안 번 것(earned)'으로 정확히, 손님 화면 값은 방장 장부의 손님 지갑과 견준다.
  const e0=(await hs()).earned;const near=(v,want,slack=60)=>v>=want&&v<=want+slack;
  const gs=()=>guest.evaluate(k=>{const A=window[k];return{st:A.state(),mp:A.mp(),allies:A.allies(),bodies:A.bodies().map(b=>b&&{hero:b.hero,x:b.x,y:b.y,dir:b.direction}),err:A.inspect().lastError,errors:A.inspect().stats.errors,draws:A.inspect().stats.heroDraws};},D);
  // 각자 지갑: 방장·손님에게 따로 결정을 주고 손님 화면에 자기 몫만 보이는지
  await host.evaluate(([k,g])=>{const A=window[k];A.qaGive(400);A.qaGive(260,g);},[D,gid]);
  ok(await until(guest,k=>{const c=window[k].state().crystals;return c>=260&&c<=320;},D,20000,'guest wallet'),`[${kind}] 손님 지갑(260)이 손님 화면에 전해짐`,await gs());
  const h1=await hs();ok(h1.st.crystals===400+h1.earned-e0&&h1.gw===260+h1.earned-e0,`[${kind}] 방장 지갑 400 · 손님 지갑 260 따로`,h1.mp);
  // 방장: 한 명 배치, 두 번째는 full
  const centre=await host.evaluate(()=>room.survivalR600.centre);
  const hb=await host.evaluate(([k,c])=>{const A=window[k];const a=A.buy('hunter');const p1=A.state().slots.length?{ok:true,already:true}:A.placeHere('hunter',{x:c.x+2.2,y:c.y});const mv=A.moveHere(0,{x:c.x+2.2,y:c.y});const b=A.buy('slayer');const p2=A.placeHere('slayer',{x:c.x-2.2,y:c.y});return{a,p1,mv,b,p2,st:A.state()};},[D,centre]);
  ok(hb.a.ok&&hb.mv.ok&&hb.st.slots.length===1&&hb.st.slots[0].hero==='hunter'&&hb.st.slots[0].owner===hid&&Math.abs(hb.st.slots[0].ox-2.2)<1e-6,`[${kind}] 방장이 헌터 1명 배치(주인 = 방장)`,hb);
  ok(hb.b.ok&&hb.p2.ok===false&&hb.p2.why==='full',`[${kind}] 방장의 두 번째 배치는 거절(각자 1명)`,hb.p2);
  ok(await until(guest,k=>{const s=window[k].state();return s.slots.length===1&&s.slots[0].hero==='hunter';},D,20000,'guest sees host slot'),`[${kind}] 손님 화면에 방장의 배치 영웅 자리가 보임`,await gs());
  // 손님: 창에는 내 자리만(0/1), 동료 조종 영웅·동료 배치 영웅 표시
  const gp=await guest.evaluate(k=>{const A=window[k];const r=A.open();const P=document.getElementById('r720Panel');const out={opened:r,head:P?.querySelector('h3')?.textContent,slots:P?P.querySelectorAll('.r720Slot:not(.empty)').length:-1,swap:P?P.querySelectorAll('[data-r720swap]').length:-1,text:P?.textContent||''};return out;},D);
  ok(gp.opened===true&&/0 \/ 1/.test(gp.head||'')&&gp.slots===0&&gp.swap===0,`[${kind}] 손님 배치 창: 내 자리 0 / 1, 방장 자리 카드는 안 보이고 교대 단추 없음`,gp);
  ok(/동료가 조종 중/.test(gp.text)&&/동료가 배치함/.test(gp.text),`[${kind}] 손님 창에 동료 조종 영웅·동료 배치 영웅 표시`,gp.text.slice(0,200));
  await guest.screenshot({path:path.join(OUT,`${kind}-guest-panel.png`)}).catch(()=>{});
  // 손님: 영입 + 배치 명령 → 방장이 적용 → 손님 화면에 반영
  const gb=await guest.evaluate(([k,c])=>{const A=window[k];A.close();return A.buy('gunner');},[D,centre]);
  ok(gb.ok&&gb.sent===true,`[${kind}] 손님 영입은 방장에게 명령으로 보냄`,gb);
  ok(await until(host,([k,g,e])=>{const A=window[k];return A.mp().wallets.some(([id,c])=>id===g&&c===150+(A.inspect().stats.earned||0)-e);},[D,gid,e0],20000,'host applied buy'),`[${kind}] 방장이 손님 지갑에서 110 차감(260 → 150, 번 것 제외)`,await hs());
  await until(guest,k=>window[k].state().owned.gunner===true,D,20000,'guest owned');
  const g2=await gs();const placedByBuy=g2.st.slots.some(s=>s.hero==='gunner');
  if(!placedByBuy){const gpz=await guest.evaluate(([k,c])=>window[k].placeHere('gunner',{x:c.x-2.4,y:c.y-1}),[D,centre]);ok(gpz.ok&&gpz.sent,`[${kind}] 손님 배치 명령 보냄`,gpz);}
  ok(await until(host,([k,g])=>{const s=window[k].state();return s.slots.length===2&&s.slots.some(v=>v.hero==='gunner'&&v.owner===g);},[D,gid],20000,'host slot'),`[${kind}] 방장 자리판에 손님의 기억사수(주인 = 손님)`,(await hs()).st);
  ok(await until(guest,k=>{const A=window[k];return A.state().slots.length===2&&A.bodies().filter(Boolean).length===2;},D,30000,'guest bodies'),`[${kind}] 손님 화면에 배치 영웅 몸 2개(방장 것·내 것)`,await gs());
  // 손님: 두 번째 배치는 거절되고 까닭이 손님 창에 뜸
  await guest.evaluate(k=>window[k].open(),D);
  const g3=await guest.evaluate(k=>{const P=document.getElementById('r720Panel');return{head:P?.querySelector('h3')?.textContent,slots:P?P.querySelectorAll('.r720Slot:not(.empty)').length:-1};},D);
  ok(/1 \/ 1/.test(g3.head||'')&&g3.slots===1,`[${kind}] 손님 창: 내 자리 1 / 1, 내 자리 카드 1개`,g3);
  // 손님 강화·옮기기
  await host.evaluate(([k,g])=>window[k].qaGive(100,g),[D,gid]);await until(guest,k=>window[k].state().crystals>=250,D,20000,'guest crystals');/* 손님 장부: 260 − 110 + 100 = 250 */
  const before=await hs();const gslot=before.st.slots.find(s=>s.owner===gid);
  const gu=await guest.evaluate(k=>window[k].upgrade(0,'range'),D);ok(gu.ok&&gu.sent,`[${kind}] 손님 강화 명령 보냄`,gu);
  ok(await until(host,([k,g])=>window[k].state().slots.find(s=>s.owner===g)?.rangeLv===1,[D,gid],20000,'host upgrade'),`[${kind}] 방장에서 손님 자리 사거리 +1, 방장 자리는 그대로`,(await hs()).st.slots);
  const h4=await hs();ok(h4.st.slots.find(s=>s.owner===hid).rangeLv===0&&h4.st.crystals===400-50-65+h4.earned-e0&&h4.gw===225+h4.earned-e0,`[${kind}] 손님 강화가 방장 지갑·자리에 섞이지 않음`,h4.st);
  const gm=await guest.evaluate(([k,c])=>window[k].moveHere(0,{x:c.x+.4,y:c.y+3}),[D,centre]);ok(gm.ok&&gm.sent,`[${kind}] 손님 옮기기 명령 보냄`,gm);
  ok(await until(host,([k,g,ox])=>{const s=window[k].state().slots.find(v=>v.owner===g);return s&&Math.abs(s.ox-.4)<.02&&Math.abs(s.oy-3)<.02;},[D,gid],20000,'host move'),`[${kind}] 방장에서 손님 자리가 옮겨짐`,(await hs()).st.slots);
  // 손님 화면: 배치 몸이 방장 위치를 따라가고 그려짐
  await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});
  const follow=await until(guest,([k,g])=>{const A=window[k],s=A.state().slots.findIndex(v=>v.owner===g),a=A.allies()[s],c=room.survivalR600.centre;return a&&Math.hypot(a.x-(c.x+.4),a.y-(c.y+3))<2.2;},[D,gid],30000,'guest follow');
  const g5=await gs();ok(follow&&g5.draws>0,`[${kind}] 손님 화면에서 배치 영웅이 방장 위치를 따라가며 그려짐(그리기 ${g5.draws}번)`,g5);
  // 배치 영웅이 실제로 싸움(방장): 공격 횟수가 늘어남
  const c0=await host.evaluate(k=>window[k].inspect().stats.casts.basic,D);
  const fights=await until(host,([k,c])=>window[k].inspect().stats.casts.basic>c+2,[D,c0],120000,'ally fights');ok(fights,`[${kind}] 방장에서 배치 영웅들이 공격함`,(await hs()).allies);
  for(const p of [host,guest]){await p.setViewportSize({width:1280,height:800});await p.evaluate(()=>{try{closePanel(true);}catch(_){}});await p.waitForTimeout(1500);await p.screenshot({path:path.join(OUT,`${kind}-${p.tag}.png`)}).catch(()=>{});await p.setViewportSize({width:640,height:400});}
  // 손님 해제 → 강화 환급, 방장 자리는 남음
  const gr=await guest.evaluate(k=>window[k].remove(0),D);ok(gr.ok&&gr.sent,`[${kind}] 손님 해제 명령 보냄`,gr);
  ok(await until(host,([k,h])=>{const s=window[k].state();return s.slots.length===1&&s.slots[0].owner===h;},[D,hid],20000,'host remove'),`[${kind}] 손님 자리만 해제, 방장 자리는 남음`,(await hs()).st.slots);
  ok(await until(guest,k=>{const s=window[k].state();return s.slots.length===1&&s.crystals>=250&&s.crystals<=330&&s.owned.gunner===true;},D,20000,'guest refund'),`[${kind}] 손님: 강화 결정 25 환급(225 → 250), 영웅 보유 유지`,(await gs()).st);
  // 이상한 명령·남의 자리 건드리기 불가
  const bad=await guest.evaluate(()=>{const M=window.__STORYWORLD_SURVIVAL_COOP_R1149__;return [M.sendDeploy('zz-hack'),M.sendDeploy('g-range'),M.sendDeploy('x')];});
  await host.waitForTimeout(1500);const h6=await hs();
  ok(h6.st.slots.length===1&&h6.st.slots[0].rangeLv===0&&h6.st.crystals===285+h6.earned-e0&&h6.gw===250+h6.earned-e0,`[${kind}] 자리 없는 손님의 강화·해제·모르는 명령은 방장 자리에 닿지 않음`,[bad,h6.st]);
  const h9=await insp(host),g9=await insp(guest),g7=await gs();
  const badCodes=['STATE_INVALID','TRANSITION_INVALID','REGION_INVALID','COMMAND_INVALID','STALE_SEQUENCE','INPUT_INVALID','VERSION_MISMATCH','NOT_READY'];
  ok(!h9.err.some(c=>badCodes.includes(c))&&!g9.err.some(c=>badCodes.includes(c)),`[${kind}] 중계 서버 거절 없음`,[h9.err,g9.err]);
  ok(!host.errors.length&&!guest.errors.length,`[${kind}] 페이지 오류 없음`,[host.errors.slice(0,3),guest.errors.slice(0,3)]);
  ok((h9.mp.errors||0)===0&&(g9.mp.errors||0)===0&&h6.errors===0&&g7.errors===0,`[${kind}] 오버레이 내부 오류 없음`,[h9.mp,g9.mp,h6.err,g7.err]);
 }finally{await host.context().close();await guest.context().close();await relay.close();}}
for(const kind of (process.env.KINDS||'legacy').split(','))if(mods[kind])await run(kind);
await browser.close();console.log(`\nR1149b 배치 브라우저: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
