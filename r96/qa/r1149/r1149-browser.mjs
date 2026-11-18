// R1149 무한생존 멀티플레이 헤드리스 검사: 브라우저 두 개(방장·친구)가 진짜 중계 서버 코드(옛 R62 고정본 = 지금 Render 에 떠 있는 판, 그리고 리포 최신)로
//  방 만들기 → 참가 → 준비 → '무한 생존 함께 시작' → 같은 무대·정화 구슬·몹 체력 배수·자동 레벨업·자기 영웅 선택지·판 끝 맞춤을 본다.
// 실행: 빌드한 site 를 http://127.0.0.1:4396/ 에 올린 뒤  node r96/qa/r1149/r1149-browser.mjs   (BASE=… , KINDS=legacy,current)
// 헤드리스 소프트웨어 렌더링 검사다. 실기기·GPU·사람 여럿의 자연 플레이·실제 Render 서버는 따로(미검증)다.
import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const BASE=process.env.BASE||'http://127.0.0.1:4396/';const OUT=path.join(ROOT,'out/r1149');fs.mkdirSync(OUT,{recursive:true});
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
  ok(h0.mp.count===2&&h0.mp.scale===2&&h0.mp.deployLimit===1,`[${kind}] 2명: 체력 배수 2·배치 한도 각자 1`,h0.mp);
  // 몹: 복제 없이 체력만 2배
  await host.evaluate(()=>{try{closePanel(true);}catch(_){}});await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});
  const mobs=await until(host,()=>room.enemies.filter(e=>e.hp>0&&e.survivalR600&&!e.r600Boss).length>=3,null,180000,'mobs');
  const mh=await host.evaluate(()=>{const P=window.__STORYWORLD_SURVIVAL_R600__.pure,st=window.__STORYWORLD_SURVIVAL_R600__.state();const rows=room.enemies.filter(e=>e.survivalR600&&!e.r600Boss);
   return{n:rows.length,replicas:room.enemies.filter(e=>e.coopReplicaR62).length,scales:[...new Set(rows.map(e=>e.r1149Scale))],ratio:rows.filter(e=>!e.r600Elite).map(e=>e.maxHp/e.r1149BaseHp).slice(0,5),soloHp:rows.filter(e=>!e.r600Elite).map(e=>e.r1149BaseHp).slice(0,3),diff:st.diff};});
  ok(mobs&&mh.n>=3&&mh.replicas===0,`[${kind}] 몹이 나오고 인원수 복제 몹은 없음`,mh);
  ok(mh.scales.length===1&&mh.scales[0]===2&&mh.ratio.length>0&&mh.ratio.every(r=>Math.abs(r-2)<.02),`[${kind}] 몹 체력 = 혼자 값 × 2`,mh);
  ok(await until(guest,()=>room.enemies.filter(e=>e.hp>0).length>=3,null,60000,'guest mobs'),`[${kind}] 손님 화면에도 몹이 보임`);
  // 정화 구슬 체력 맞춤
  await host.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.qaCoreHp(321));
  ok(await until(guest,()=>Math.abs(window.__STORYWORLD_SURVIVAL_R600__.state().core.hp-321)<60,null,30000,'core sync'),`[${kind}] 손님 정화 구슬 체력이 방장 값을 따라감`,await insp(guest));
  // 레벨업: 구슬 자동 강화 + 각자 선택 대기
  await host.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.qaCredit(400));
  const lvl=await until(host,()=>window.__STORYWORLD_SURVIVAL_R600__.state().lv>=3,null,20000,'level');const h1=await insp(host);
  const coreSum=Object.values(h1.sv.core.lv||{}).reduce((a,b)=>a+b,0),ups=h1.sv.lv-1;
  ok(lvl&&coreSum===ups,`[${kind}] 정화 구슬이 레벨업마다 알아서 강화됨(레벨 +${ups} → 구슬 강화 ${coreSum})`,h1.sv);
  const ids=await host.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().players.map(p=>p.id));
  ok(ids.every(id=>h1.mp.pend[id]===ups),`[${kind}] 두 사람 모두 강화 ${ups}번 대기`,h1.mp.pend);
  ok(await until(guest,u=>{const M=window.__STORYWORLD_SURVIVAL_COOP_R1149__.inspect();return M.pendSelf===u&&window.__STORYWORLD_SURVIVAL_R600__.state().lv>=3;},ups,30000,'guest pend'),`[${kind}] 손님에게 레벨·대기 수가 전해짐`,await insp(guest));
  // 손님 선택지: 자기 영웅 것만(구슬 강화 없음), 고르면 방장 쪽 손님 몸의 강화가 오름
  const offer=await guest.evaluate(()=>{const M=window.__STORYWORLD_SURVIVAL_COOP_R1149__;M.openChoice();return [...document.querySelectorAll('.r1149Card')].map(b=>({id:b.dataset.pick,kind:b.dataset.kind,text:b.textContent}));});
  ok(offer.length>=1&&offer.length<=3&&offer.every(o=>o.kind!=='core'&&!/정화 코어/.test(o.text)),`[${kind}] 손님 선택지에 구슬 강화 없음(영웅 것 ${offer.length}개)`,offer);
  await guest.screenshot({path:path.join(OUT,`${kind}-guest-cards.png`)}).catch(()=>{});
  const gid=await guest.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().selfId);
  const upSum=()=>host.evaluate(id=>{const a=window.__STORYWORLD_COOP_SIM_R62__.players().find(p=>p.coopIdR62===id);return{hero:a.hero,sum:Object.values(a.upgrades||{}).reduce((x,y)=>x+(+y||0),0),keys:Object.keys(a.upgrades||{})};},gid);
  const before=await upSum();await guest.click('.r1149Card');
  const picked=await until(host,([id,b])=>{const a=window.__STORYWORLD_COOP_SIM_R62__.players().find(p=>p.coopIdR62===id);return Object.values(a.upgrades||{}).reduce((x,y)=>x+(+y||0),0)===b+1;},[gid,before.sum],30000,'guest pick');const after=await upSum();
  ok(picked&&after.hero==='seoha',`[${kind}] 손님이 고른 강화가 방장 쪽 손님 영웅(윤서하)에 적용`,[before,after]);
  const hostActor=await host.evaluate(()=>{const a=window.__STORYWORLD_COOP_SIM_R62__.localPlayer();return Object.values(a.upgrades||{}).reduce((x,y)=>x+(+y||0),0);});
  ok(hostActor===0,`[${kind}] 손님 선택이 방장 영웅에는 섞이지 않음`,hostActor);
  ok(await until(host,([id,u])=>window.__STORYWORLD_SURVIVAL_COOP_R1149__.inspect().pend[id]===u-1,[gid,ups],15000,'pend dec'),`[${kind}] 손님 대기 수 1 줄어듦`,(await insp(host)).mp.pend);
  // 방장 선택지도 영웅 것만
  const hostOffer=await host.evaluate(()=>{const M=window.__STORYWORLD_SURVIVAL_COOP_R1149__;M.openChoice();return [...document.querySelectorAll('.r600Card,.r1149Card')].map(b=>b.className+'|'+b.textContent);});
  ok(hostOffer.length>=1&&hostOffer.every(t=>!/core|정화 코어/.test(t)),`[${kind}] 방장 선택지에도 구슬 강화 없음`,hostOffer);
  await host.evaluate(()=>{document.querySelector('.r600Card,.r1149Card')?.click();try{closePanel(true);}catch(_){}});
  // 영웅 배치: 이번 단계에서는 멀티에서 닫혀 있음(각자 1명 규칙은 다음 단계에서 열림) — 열리지 않고 안내만
  const dep=await host.evaluate(()=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;const r=D.open();return{opened:r,panel:!!document.getElementById('r720Panel')};});
  ok(dep.opened!==true&&!dep.panel,`[${kind}] 멀티 중 영웅 배치 창은 닫혀 있음(이번 단계)`,dep);
  // 영화 서사 모드는 혼자만
  ok(await host.evaluate(()=>window.__STORYWORLD_SURVIVAL_COOP_R1149__.inspect().cinemaBlocked===true),`[${kind}] 멀티 중에는 영화 서사 모드 시작이 막힘`);
  // 판 끝 맞춤
  await host.evaluate(()=>{try{closePanel(true);}catch(_){}window.__STORYWORLD_SURVIVAL_R600__.qaCoreHp(0);});
  ok(await until(host,()=>window.__STORYWORLD_SURVIVAL_R600__.state().over===true,null,20000,'host over'),`[${kind}] 구슬이 부서지면 방장 판 끝`);
  ok(await until(guest,()=>window.__STORYWORLD_SURVIVAL_R600__.state().over===true,null,30000,'guest over'),`[${kind}] 손님도 판 끝을 봄`,await insp(guest));
  // 함께 다시 도전 → 둘 다 새 판
  await host.waitForSelector('#r600Again',{timeout:30000});ok(await guest.evaluate(()=>!document.getElementById('r600Again')||true)&&await until(guest,()=>!!document.getElementById('r600Title'),null,30000,'guest result'),`[${kind}] 손님 결과 창(방 나가기)`);
  await host.click('#r600Again');
  const again=s0=>{const S=window.__STORYWORLD_SURVIVAL_R600__,st=S.state();return !!st&&st.over===false&&st.ready===true&&S.here()===true&&st.lv===1&&window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing';};
  ok(await until(host,again,null,240000,'host again')&&await until(guest,again,null,240000,'guest again'),`[${kind}] 함께 다시 도전 → 둘 다 새 판(레벨 1, 판 끝 풀림)`,[await insp(host),await insp(guest)]);
  // 다음 지역으로 넘어가면 손님도 같은 지역·무대
  await host.evaluate(()=>{try{closePanel(true);}catch(_){}});await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});
  await host.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(1));
  const moved=await until(host,()=>{const st=window.__STORYWORLD_SURVIVAL_R600__.state();return st.i===1&&st.ready&&window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing';},null,240000,'host stage 2')&&await until(guest,()=>{const st=window.__STORYWORLD_SURVIVAL_R600__.state();return st.i===1&&st.ready&&window.__STORYWORLD_SURVIVAL_R600__.here()&&window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing';},null,240000,'guest stage 2');
  const h2=await insp(host),g2=await insp(guest);ok(moved&&h2.zone===g2.zone&&h2.zone!==h0.zone&&JSON.stringify(h2.arena)===JSON.stringify(g2.arena),`[${kind}] 다음 지역 전환을 손님이 따라옴(${h0.zone} → ${h2.zone})`,[h2,g2]);
  // 한 사람이 쓰러져도 동료가 살아 있으면 판이 이어지고, 모두 쓰러지면 끝난다
  await host.evaluate(()=>{try{closePanel(true);}catch(_){}const C=window.__STORYWORLD_COOP_SIM_R62__,p=C.localPlayer();C.withPlayer(p,()=>{player.hp=0;showDeath();});});
  await host.waitForTimeout(1500);const mid=await host.evaluate(()=>({over:window.__STORYWORLD_SURVIVAL_R600__.state().over,hp:window.__STORYWORLD_COOP_SIM_R62__.localPlayer().hp,alive:window.__STORYWORLD_SURVIVAL_COOP_R1149__.alive().length}));
  await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});await guest.waitForTimeout(800);await guest.screenshot({path:path.join(OUT,`${kind}-guest-play.png`)}).catch(()=>{});await host.screenshot({path:path.join(OUT,`${kind}-host-play.png`)}).catch(()=>{});
  ok(mid.over===false&&mid.alive===1,`[${kind}] 방장이 쓰러져도 손님이 살아 있으면 판이 이어짐`,mid);
  await host.evaluate(id=>{const C=window.__STORYWORLD_COOP_SIM_R62__,p=C.players().find(a=>a.coopIdR62===id);C.withPlayer(p,()=>{player.hp=0;});},gid);
  ok(await until(host,()=>window.__STORYWORLD_SURVIVAL_R600__.state().over===true,null,60000,'all down'),`[${kind}] 모두 쓰러지면 판 끝`,await insp(host));
  ok(await until(guest,()=>window.__STORYWORLD_SURVIVAL_R600__.state().over===true,null,30000,'guest all down'),`[${kind}] 손님도 판 끝을 봄(모두 쓰러짐)`);
  const h9=await insp(host),g9=await insp(guest);
  const badCodes=['STATE_INVALID','TRANSITION_INVALID','REGION_INVALID','COMMAND_INVALID','STALE_SEQUENCE','INPUT_INVALID','VERSION_MISMATCH','NOT_READY'];
  ok(!h9.err.some(c=>badCodes.includes(c))&&!g9.err.some(c=>badCodes.includes(c)),`[${kind}] 중계 서버 거절 없음`,[h9.err,g9.err]);
  ok(!host.errors.length&&!guest.errors.length,`[${kind}] 페이지 오류 없음`,[host.errors.slice(0,3),guest.errors.slice(0,3)]);
  ok((h9.mp.errors||0)===0&&(g9.mp.errors||0)===0,`[${kind}] 오버레이 내부 오류 없음`,[h9.mp,g9.mp]);
  await host.screenshot({path:path.join(OUT,`${kind}-host.png`)}).catch(()=>{});await guest.screenshot({path:path.join(OUT,`${kind}-guest.png`)}).catch(()=>{});
 }finally{await host.context().close();await guest.context().close();await relay.close();}}
for(const kind of (process.env.KINDS||'legacy,current').split(','))if(mods[kind])await run(kind);
// 혼자(회귀): 멀티가 아니면 꺼져 있고 영화 모드 단추가 그대로 눌림
{const p=await page('solo');const s=await p.evaluate(()=>{const M=window.__STORYWORLD_SURVIVAL_COOP_R1149__.inspect();return{on:M.on,blocked:M.cinemaBlocked,btn:!!document.getElementById('cinemaStartR461')};});
 ok(s.on===false&&s.blocked===false,'[solo] 혼자일 때 멀티 꺼짐·영화 모드 안 막힘',s);ok(!p.errors.length,'[solo] 페이지 오류 없음',p.errors.slice(0,3));await p.context().close();}
await browser.close();console.log(`\nR1149 브라우저: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
