// R563 브라우저 검사(헤드리스, 소프트웨어 렌더, 3D 기록기 켬): dist00 에서 미카엘라로 몹 9마리 → R(키 r) → 하늘 열림·빛기둥 8·큰 기둥, Q → 작은 기둥 3. SHOT=접두어, PERF=1.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',perf=!!process.env.PERF;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r183.scene3d':'{"on":true}'}});
await go(p,'dist00');let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('michaela'));player.hero='michaela';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const setup=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).slice(0,9);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 live.forEach((e,i)=>{const a=i*2.4,r=1.8+(i%3)*1.3;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});player.specialCD=0;if(player.storyWER)player.storyWER.ready={};return live.length;});
const I=()=>p.evaluate(()=>window.__STORYWORLD_MICHAELA_GENESIS_R563__.inspect());const freeze=async(path)=>{await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);await p.screenshot({path,quality:85});await p.evaluate(()=>{window.__SLOW=1;});};
ok('mobs arranged',await setup()>=6);
await p.keyboard.press('r');await p.waitForFunction(()=>window.__STORYWORLD_MICHAELA_GENESIS_R563__.inspect().stats.rCasts>=1,null,{timeout:60000}).catch(()=>{});
if(shot){await p.waitForFunction(()=>window.__STORYWORLD_MICHAELA_GENESIS_R563__.inspect().stats.pillars>=5,null,{timeout:120000}).catch(()=>{});await freeze(shot+'-pillars.jpg');}
await p.waitForFunction(()=>window.__STORYWORLD_MICHAELA_GENESIS_R563__.inspect().stats.grand>=1,null,{timeout:120000}).catch(()=>{});
if(shot)await freeze(shot+'-grand.jpg');
let i=await I();ok('R chain: 8 pillars + grand',i.stats.rCasts===1&&i.stats.pillars===9&&i.stats.grand===1);ok('pillars hit mobs',i.stats.pillarHits>=6);
await p.evaluate(()=>special());await p.waitForFunction(()=>window.__STORYWORLD_MICHAELA_GENESIS_R563__.inspect().stats.pillars>=12,null,{timeout:120000}).catch(()=>{});
i=await I();ok('Q chain: 3 small pillars',i.stats.qCasts===1&&i.stats.pillars===12);ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(perf){const run=(on)=>p.evaluate(async(on)=>{window.__STORYWORLD_MICHAELA_GENESIS_R563__.set(on);const t0=time,f=[];let last=performance.now(),castAt=-9;
  while(time-t0<12){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();f.push(n-last);last=n;if(time-castAt>3){castAt=time;player.specialCD=0;special();fx('storySourceSkill',player.x,player.y,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'r',castId:'perf:'+time});}}
  f.sort((a,b)=>a-b);return {frames:f.length,mean:+(f.reduce((s,v)=>s+v,0)/f.length).toFixed(1),p95:+f[Math.floor(f.length*.95)].toFixed(1)};},on);
 const r=[];for(const on of [false,true,false,true]){await setup();r.push([on,await run(on)]);}console.log('  frame ms',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
