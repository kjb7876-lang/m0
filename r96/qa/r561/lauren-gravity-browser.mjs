// R561 브라우저 검사(헤드리스, 소프트웨어 렌더): dist00 에서 라우렌으로 몹 9마리를 둘러 세우고 Q → 끌림·붕괴 확인, 장면 2장, 켜고/끄고 프레임 시간.
// SHOT=접두어 면 끌림 중·붕괴 순간을 찍는다. PERF=1 이면 Q 를 3초마다 다시 써 가며 켬/끔 각 12초(게임 시간) 평균 프레임 시간을 잰다.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',perf=!!process.env.PERF,zone=process.env.ZONE||'dist00';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r183.scene3d':'{"on":true}'}});
await go(p,zone);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const setup=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).slice(0,9);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c={x:player.x+2.2,y:player.y+.4};live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:2.2+(i%3)*.9;e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});
 target=live[0]?.id;player.specialCD=0;window.__r561ids=live.map(e=>e.id);return {n:live.length,c,d0:live.slice(1).map(e=>Math.hypot(e.x-live[0].x,e.y-live[0].y))};});
const s0=await setup();ok('mobs arranged ('+s0.n+')',s0.n>=5);
await p.evaluate(()=>special());
const I=()=>p.evaluate(()=>window.__STORYWORLD_LAUREN_GRAVITY_R561__.inspect());
let i=await I();const W0=i.well;ok('Q opened a gravity well',i.stats.wells===1&&!!i.well);
if(shot){await p.waitForFunction(()=>{const w=window.__STORYWORLD_LAUREN_GRAVITY_R561__.inspect().well;return w&&time-w.t0>.7;},null,{timeout:120000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);await p.screenshot({path:shot+'-pull.jpg',quality:85,clip:{x:240,y:120,width:480,height:300}});await p.evaluate(()=>{window.__SLOW=1;});
 await p.waitForFunction(()=>{const w=window.__STORYWORLD_LAUREN_GRAVITY_R561__.inspect().well;return w&&time-w.t0>1.32;},null,{timeout:120000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);await p.screenshot({path:shot+'-collapse.jpg',quality:85,clip:{x:240,y:120,width:480,height:300}});await p.evaluate(()=>{window.__SLOW=1;});}
await p.waitForFunction(()=>!window.__STORYWORLD_LAUREN_GRAVITY_R561__.inspect().well,null,{timeout:120000});
i=await I();const d1=await p.evaluate(()=>{const live=window.__r561ids.map(id=>room.enemies.find(e=>e.id===id));return live.map(e=>[+e.x.toFixed(2),+e.y.toFixed(2),Math.round(e.hp),e.spawnState]);});const near=d1.filter(r=>Math.hypot(r[0]-W0.x,r[1]-W0.y)<2.4).length;ok('mobs gathered inside the collapse radius ('+near+' of '+d1.length+')',near>=5);console.log('  well',W0&&[W0.x.toFixed(2),W0.y.toFixed(2)],'after',JSON.stringify(d1));
const avg=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);ok('collapse fired and hit',i.stats.collapses===1&&i.stats.collapseHits>=3);ok('drawn',i.stats.draws>10);ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(perf){const run=(on)=>p.evaluate(async(on)=>{window.__STORYWORLD_LAUREN_GRAVITY_R561__.set(on);const t0=time,f=[];let last=performance.now(),castAt=-9;
  while(time-t0<12){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();f.push(n-last);last=n;if(time-castAt>3){castAt=time;player.specialCD=0;special();}}
  f.sort((a,b)=>a-b);return {frames:f.length,mean:f.reduce((s,v)=>s+v,0)/f.length,p95:f[Math.floor(f.length*.95)]};},on);
 await setup();const A=await run(false);await setup();const B=await run(true);await setup();const A2=await run(false);await setup();const B2=await run(true);
 console.log('  frame ms off',JSON.stringify(A),JSON.stringify(A2));console.log('  frame ms on ',JSON.stringify(B),JSON.stringify(B2));}
await b.close();process.exit(fail?1:0);
