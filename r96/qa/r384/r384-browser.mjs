// R384 headless check (Playwright): 영화 모드 길잡이 → dist00 길 단계에서 보스 전 서사가 바로 흐르고, 남은 음성 시간이 숫자로 나오며,
//  몹이 줄면 다시 나오고(리젠), 배율이 움직인다. 보스 단계는 강제로 넘겨 보스 서사·분신 쿨타임 조절이 붙는지만 본다.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r384 node r96/qa/r384/r384-browser.mjs
// 헤드리스(소프트웨어 렌더·음성 없음): 판정만 본다. GPU·실기기·실제 음성 길이·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r384';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(name,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,400)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
check('R384 loaded',await p.evaluate(()=>window.__STORYWORLD_CINEMA_SYNC_R384__?.revision==='R390-sync-4'&&window.__STORYWORLD_CINEMA_MODE_R370__.inspect().revision==='R370-cinema-5'));
await p.evaluate(()=>window.__STORYWORLD_CINEMA_MODE_R370__.set({on:true}));
await p.waitForFunction(()=>room?.id==='dist00'&&!loading,null,{timeout:240000});
await p.waitForFunction(()=>window.__STORYWORLD_CINEMA_SYNC_R384__.inspect().stats.pre>=1,null,{timeout:20000}).catch(()=>{});
const s1=await p.evaluate(()=>{const S=window.__STORYWORLD_CINEMA_SYNC_R384__.inspect(),C=window.__STORYWORLD_CINEMA_MODE_R370__;return{S,phase:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,rs:C.remainingSecs(),q:C.inspect().queue,cur:C.inspect().current};});
check('dist00 route phase: pre-boss narration queued during normal combat',['route','rally'].includes(s1.phase)&&s1.S.stats.pre===1&&(s1.q>0||s1.cur),s1);
check('remainingSecs() is a positive number',typeof s1.rs==='number'&&s1.rs>1,s1.rs);
await p.screenshot({path:`${OUT}/route-pre-story.jpg`,quality:72});
// 리젠: 길 단계의 일반 몹을 모두 잡는다(체력을 거의 비우고 hitEnemy → 엔진 처리) → 다시 나와야 한다.
const s2=await p.evaluate(async()=>{const field=e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss&&!e.r61Summoned&&e.spawnState!=='hidden';const rows=room.enemies.filter(field);
 for(const e of rows){e.hp=.5;hitEnemy(e,5);if(e.hp<=0&&!e.deadRecorded)killEnemy(e);}await new Promise(r=>setTimeout(r,2600));
 return{killed:rows.length,phase:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,alive:room.enemies.filter(field).length,respawned:room.enemies.filter(e=>e.r384Respawn&&e.hp>0).length,S:window.__STORYWORLD_CINEMA_SYNC_R384__.inspect(),rs:window.__STORYWORLD_CINEMA_MODE_R370__.remainingSecs()};});
check('all route mobs killed while voice remains → route does not end, mobs respawn',s2.killed>0&&['route','rally'].includes(s2.phase)&&s2.respawned>0&&s2.S.stats.respawned>0,s2);
const pos=await p.evaluate(()=>room.enemies.filter(e=>e.r384Respawn).map(e=>({d:e.r384SpawnD,blocked:blocked(e.homeX,e.homeY,.3)})));
check('respawned mobs stand on open floor 6–9 tiles from the hero',pos.length>0&&pos.every(q=>!q.blocked&&q.d>=6-1e-6&&q.d<=9+1e-6),pos);
await p.waitForTimeout(1500);await p.screenshot({path:`${OUT}/route-respawn.jpg`,quality:72});
// R388 실화: 음성을 끝내면(정지) 남은 일반 몹이 영웅 둘레로 모이고 체력 1%
const s3=await p.evaluate(async()=>{const S=window.__STORYWORLD_CINEMA_SYNC_R384__;const real=S.inspect().real;window.__STORYWORLD_CINEMA_MODE_R370__.stop();
 await new Promise(r=>setTimeout(r,1600));const rows=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'&&!e.boss&&!e.midboss&&!e.r61Summoned);
 return{real,rs:window.__STORYWORLD_CINEMA_MODE_R370__.remainingSecs(),gathered:S.inspect().stats.gathered,rows:rows.map(e=>({low:e.hp<=e.maxHp*.01+1e-6,d:+Math.hypot(e.x-player.x,e.y-player.y).toFixed(1)}))};});
check('R388 실화: narration over → remaining route mobs gathered around the hero at 1% HP',s3.real&&s3.gathered>0&&s3.rows.every(r=>r.low),s3);
await p.screenshot({path:`${OUT}/route-finale.jpg`,quality:72});
check('no page errors / R384 errors',errors.length===0&&s2.S.stats.errors===0&&(await p.evaluate(()=>window.__STORYWORLD_CINEMA_SYNC_R384__.inspect().stats.errors))===0,{errors,last:s2.S.lastError});
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;
