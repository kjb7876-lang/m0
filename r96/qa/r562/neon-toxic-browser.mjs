// R562 브라우저 검사(헤드리스, 소프트웨어 렌더, 3D 기록기 켬): dist00 에서 네온으로 몹 9마리 → Q → 2차 감전·독·장판, R(보스 낙인) → 큰 장판. SHOT=접두어, PERF=1 프레임 시간.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',perf=!!process.env.PERF;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r183.scene3d':'{"on":true}'}});
await go(p,'dist00');let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('neon'));player.hero='neon';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const setup=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).slice(0,9);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 let ang=0;for(let k=0;k<16;k++){const a=k*Math.PI/8;let free=true;for(let d=0;d<=12.5;d+=.25)if(blocked(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d,.35)){free=false;break;}if(free){ang=a;break;}}
 const ux=Math.cos(ang),uy=Math.sin(ang),nx=-uy,ny=ux;window.__r562ang=ang;
 live.forEach((e,i)=>{const d=i<6?7.4+(i%3)*.7:10.6+(i-6)*.5,o=i<6?(Math.floor(i/3)-.5)*1.2:(i-7)*.6;e.x=player.x+ux*d+nx*o;e.y=player.y+uy*d+ny*o;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});player.specialCD=0;return live.length;});
const I=()=>p.evaluate(()=>window.__STORYWORLD_NEON_TOXIC_R562__.inspect());const freeze=async(path)=>{await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);await p.screenshot({path,quality:85});await p.evaluate(()=>{window.__SLOW=1;});};
ok('mobs arranged',await setup()>=6);
await p.evaluate(()=>special());let i=await I();ok('Q chain started (poisoned '+i.poisoned.length+')',i.stats.qCasts===1&&i.poisoned.length>=3);
await p.waitForFunction(()=>window.__STORYWORLD_NEON_TOXIC_R562__.inspect().stats.arcs>=1||time>99999,null,{timeout:120000}).catch(()=>{});
if(shot)await freeze(shot+'-arc.jpg');
await p.waitForFunction(()=>window.__STORYWORLD_NEON_TOXIC_R562__.inspect().pools.length>=1,null,{timeout:120000}).catch(()=>{});
if(shot){await p.waitForFunction(()=>{const q=window.__STORYWORLD_NEON_TOXIC_R562__.inspect().pools[0];return q&&time-q.t0>.6;},null,{timeout:60000}).catch(()=>{});await freeze(shot+'-pool.jpg');}
await p.waitForFunction(()=>window.__STORYWORLD_NEON_TOXIC_R562__.inspect().stats.poolTicks>=3,null,{timeout:200000}).catch(()=>{});
i=await I();ok('arc jumped to an outside mob',i.stats.arcHits>=1);ok('poison ticked',i.stats.poisonTicks>=3);ok('pool laid and ticked',i.stats.pools>=1&&i.stats.poolTicks>=3);
const okR=await p.evaluate(()=>{const S=window.__STORYWORLD_STORY_WER__||null;player.storyWER&&(player.storyWER.ready={});try{return typeof window.__STORYWORLD_KEYS_R291__!=='undefined';}catch(_){return false;}});
await p.keyboard.press('r');await p.waitForFunction(()=>window.__STORYWORLD_NEON_TOXIC_R562__.inspect().stats.rPools>=1,null,{timeout:120000}).catch(()=>{});
i=await I();ok('R (boss mark, key r) → big pool',i.stats.rPools===1);ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(perf){const run=(on)=>p.evaluate(async(on)=>{window.__STORYWORLD_NEON_TOXIC_R562__.set(on);const t0=time,f=[];let last=performance.now(),castAt=-9;
  while(time-t0<12){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();f.push(n-last);last=n;if(time-castAt>3){castAt=time;player.specialCD=0;special();}}
  f.sort((a,b)=>a-b);return {frames:f.length,mean:+(f.reduce((s,v)=>s+v,0)/f.length).toFixed(1),p95:+f[Math.floor(f.length*.95)].toFixed(1)};},on);
 const r=[];for(const on of [false,true,false,true]){await setup();r.push([on,await run(on)]);}console.log('  frame ms',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
