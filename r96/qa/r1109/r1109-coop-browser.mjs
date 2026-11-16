// R1109 동행(온라인 협동) 헤드리스 검사: 브라우저 두 개(방장·친구)가 진짜 중계 서버 코드로 방 만들기 → 참가 → 준비 → 함께 시작 → 친구 이동이 방장 쪽에 닿는지.
// 중계 서버 두 판을 모두 본다: 옛 R62(지금 실제 Render 에 떠 있는 판, relay/test/fixtures/server-r62.mjs) 와 리포 최신 relay/server.mjs(R63R1).
// 실행: 빌드한 site 를 http://127.0.0.1:4396/ 에 올린 뒤  node r96/qa/r1109/r1109-coop-browser.mjs   (BASE=… 로 바꿀 수 있음)
// 실제 Render 서버 확인(선택): LIVE_RELAY=1 BASE=https://kjb7876-lang.github.io/m0/ INJECT=r96/client-source/coop-relay-r1109.js node …  (공개판에 아직 없으면 INJECT 로 덧붙임, CI 에선 돌리지 않음)
// 헤드리스 소프트웨어 렌더링 검사다. 실기기·GPU·사람 둘의 자연 플레이는 따로다.
import {createRequire} from 'node:module';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const BASE=process.env.BASE||'http://127.0.0.1:4396/';
const LIVE='wss://storyworld-r62-relay.onrender.com/ws';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,500));}};
const legacy=await import(pathToFileURL(path.join(ROOT,'relay/test/fixtures/server-r62.mjs')).href);
const current=await import(pathToFileURL(path.join(ROOT,'relay/server.mjs')).href);
ok(legacy.PROTOCOL.build==='R62'&&current.PROTOCOL.build==='R63R1','고정본 판: 옛 R62 / 최신 R63R1',[legacy.PROTOCOL,current.PROTOCOL]);
const browser=await chromium.launch({args:['--disable-dev-shm-usage']});
async function page(tag){const ctx=await browser.newContext({viewport:{width:640,height:400}});const p=await ctx.newPage();p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
 if(process.env.R1109_OFF)await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r1109.coopRelay','{"off":true}');}catch(_){}});
 await p.goto(BASE,{timeout:90000});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&!!document.getElementById('coopCreate62'),null,{timeout:120000});
 await p.evaluate(()=>{window.__r1109err=[];window.__STORYWORLD_COOP_CLIENT_R62__.on('error',e=>window.__r1109err.push(e.code));try{settings.sound=false;settings.music=false;settings.narration=false;}catch(_){}});if(process.env.INJECT)await p.addScriptTag({path:path.resolve(ROOT,process.env.INJECT)});p.tag=tag;return p;}
// 첫 화면의 협동 줄은 R1015 이후 '더 보기 · 함께 하기·안내' 접힘 안에 있다 → 펼친 뒤 누른다(사람이 하는 길과 같음).
async function openCoop(p,id){await p.evaluate(()=>{const d=document.querySelector('details.r1015TitleMore');if(d)d.open=true;});await p.click(id);}
const insp=p=>p.evaluate(()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return{status:c.status,role:c.role,code:c.code,phase:c.phase,players:c.players.map(x=>({nick:x.nick,ready:x.ready,connected:x.connected})),message:c.message,err:window.__r1109err,relay:window.__STORYWORLD_COOP_RELAY_R1109__?.inspect?.()||null};});
async function until(p,fn,arg,ms,label){try{await p.waitForFunction(fn,arg,{timeout:ms});return true;}catch(_){console.log('  (기다림 끝)',label,JSON.stringify(await insp(p)).slice(0,400));return false;}}
async function run(kind,mod){
 const relay=mod?mod.createRelay({production:false}):null;const addr=relay?await relay.listen(0,'127.0.0.1'):null;const endpoint=relay?`ws://127.0.0.1:${addr.port}/ws`:LIVE;
 const host=await page('host'),guest=await page('guest');
 try{
  // 방장: 방 만들기 화면 — 기본 주소가 채워져 있어야 함
  await openCoop(host,'#coopCreate62');await host.waitForSelector('#coopRelay62');
  const pre=await host.evaluate(()=>({relay:document.getElementById('coopRelay62').value,hint:[...document.querySelectorAll('#panel p')].map(n=>n.textContent).join(' | ')}));
  ok(pre.relay===LIVE,`[${kind}] 중계 주소 칸에 실제 서버 주소가 미리 채워짐`,pre.relay);
  ok(!/R63R1/.test(pre.hint)&&/최신 공개판/.test(pre.hint),`[${kind}] 안내 문구에 옛 'R63R1 빌드' 대신 최신 공개판`,pre.hint);
  await host.fill('#coopRelay62',endpoint);await host.fill('#coopNick62','방장');await host.click('#coopConnect62');
  const hostIn=await until(host,()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return c.status==='connected'&&c.role==='host'&&!!c.code;},null,relay?30000:120000,'host connect');
  const h1=await insp(host);ok(hostIn,`[${kind}] 방장 방 만들기 성공(방 코드 ${h1.code||'-'})`,h1);
  if(!hostIn)return;
  // 친구: 방 코드로 참가
  await openCoop(guest,'#coopJoin62');await guest.waitForSelector('#coopCode62');await guest.fill('#coopCode62',h1.code);await guest.fill('#coopRelay62',endpoint);await guest.fill('#coopNick62','친구');
  await guest.selectOption('#coopHero62','seoha');await guest.click('#coopConnect62');
  const guestIn=await until(guest,()=>{const c=window.__STORYWORLD_COOP_CLIENT_R62__.inspect();return c.status==='connected'&&c.role==='guest';},null,30000,'guest join');
  ok(guestIn,`[${kind}] 친구 방 코드로 참가 성공`,await insp(guest));if(!guestIn)return;
  ok(await until(host,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().players.length===2,null,15000,'roster'),`[${kind}] 방장 화면 참가자 2명`);
  await guest.waitForSelector('#coopReady62:not([disabled])',{timeout:60000});await guest.click('#coopReady62');
  await host.waitForSelector('#coopStart62:not([disabled])',{timeout:60000});await host.click('#coopStart62');
  const playH=await until(host,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing',null,180000,'host playing');
  const playG=await until(guest,()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().phase==='playing',null,180000,'guest playing');
  ok(playH&&playG,`[${kind}] 함께 시작 → 둘 다 playing`,[await insp(host),await insp(guest)]);if(!(playH&&playG))return;
  // 친구 이동 → 방장 시뮬레이션의 친구 몸이 움직임
  const gid=(await insp(guest)).players&&await guest.evaluate(()=>window.__STORYWORLD_COOP_CLIENT_R62__.inspect().selfId);
  const pos=()=>host.evaluate(id=>{const a=(window.__STORYWORLD_COOP_SIM_R62__.players?.()||[]).find(p=>p&&p.coopIdR62===id);return a?{x:a.x,y:a.y}:null;},gid);
  await guest.evaluate(()=>{try{closePanel(true);}catch(_){}});
  const before=await pos();
  for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']){await guest.keyboard.down(key);await guest.waitForTimeout(2500);await guest.keyboard.up(key);const now=await pos();if(before&&now&&Math.hypot(now.x-before.x,now.y-before.y)>.3)break;}
  const after=await pos();const moved=!!(before&&after)&&Math.hypot(after.x-before.x,after.y-before.y);
  ok(before&&after&&moved>.3,`[${kind}] 친구 키 입력이 방장 쪽 친구 몸을 움직임(${moved?moved.toFixed(2):'-'}칸)`,{before,after});
  const g=await insp(guest);ok(!g.err.includes('INPUT_INVALID')&&!g.err.includes('VERSION_MISMATCH'),`[${kind}] 친구 쪽 INPUT_INVALID·VERSION_MISMATCH 없음`,g.err);
  const want=kind==='live'?LIVE_BUILD:kind==='legacy'?'R62':'R63R1';ok(g.relay?.known?.[endpoint]===want,`[${kind}] 판 기억(${want})`,g.relay);
  ok(!host.errors.length&&!guest.errors.length,`[${kind}] 페이지 오류 없음`,[host.errors.slice(0,3),guest.errors.slice(0,3)]);
  await host.screenshot({path:path.join(ROOT,`out/r1109/${kind}-host.png`)}).catch(()=>{});await guest.screenshot({path:path.join(ROOT,`out/r1109/${kind}-guest.png`)}).catch(()=>{});
 }finally{await host.context().close();await guest.context().close();await relay?.close();}}
await (await import('node:fs/promises')).mkdir(path.join(ROOT,'out/r1109'),{recursive:true});
const LIVE_BUILD=process.env.LIVE_RELAY?(await (await fetch(LIVE.replace('wss://','https://').replace(/\/ws$/,'/health'))).json()).build:null;if(LIVE_BUILD)console.log('실제 Render 중계 서버 /health build =',LIVE_BUILD);
for(const [kind,mod] of process.env.LIVE_RELAY?[['live',null]]:[['legacy',legacy],['current',current]])await run(kind,mod);
await browser.close();
console.log(`\n${n-bad}/${n} 통과${process.env.R1109_OFF?' (R1109 끈 대조 실행)':''}`);process.exit(bad?1:0);
