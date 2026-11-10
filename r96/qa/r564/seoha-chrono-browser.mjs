// R564 브라우저 검사(헤드리스, 소프트웨어 렌더, 3D 기록기 켬): dist00 에서 윤서하로 몹 9마리(공격 켬) → R(키 r) 시간 정지 동안 몹이 멈추고 영웅 피해 0,
// Q → 분신 2·한 발씩, W(키 w) 가속 중 이동 잔상. SHOT=접두어, PERF=1.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',perf=!!process.env.PERF;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r183.scene3d':'{"on":true}'}});
await go(p,'dist00');let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('seoha'));player.hero='seoha';window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const setup=(attack)=>p.evaluate((attack)=>{const live=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).slice(0,9);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 live.forEach((e,i)=>{const a=i*2.4,r=1.4+(i%3)*1.1;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;e.spawnState='active';e.hp=e.maxHp=99999;if(!attack){e.damage=0;e.speed=0;e.moveSpeed=0;}});
 player.hp=player.maxHp||maxHP();player.specialCD=0;if(player.storyWER)player.storyWER.ready={};window.__r564ids=live.map(e=>e.id);return live.length;},attack);
const I=()=>p.evaluate(()=>window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect());const freeze=async(path)=>{await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);await p.screenshot({path,quality:85});await p.evaluate(()=>{window.__SLOW=1;});};
ok('mobs arranged (attacking)',await setup(true)>=6);
await p.keyboard.press('r');await p.waitForFunction(()=>!!window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stop,null,{timeout:60000}).catch(()=>{});
let i=await I();ok('R → time stop with frozen mobs ('+i.frozen.length+')',!!i.stop&&i.frozen.length>=3);
const s0=await p.evaluate(()=>({hp:player.hp,pos:window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().frozen.map(id=>{const e=room.enemies.find(x=>x.id===id);return [e.x,e.y];})}));
if(shot){await p.waitForFunction(()=>{const s=window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stop;return s&&time-s.t0>.5;},null,{timeout:60000}).catch(()=>{});await freeze(shot+'-stop.jpg');}
await p.waitForFunction(()=>{const s=window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stop;return s&&time-s.t0>1.4;},null,{timeout:120000}).catch(()=>{});
const s1=await p.evaluate(()=>({hp:player.hp,pos:window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().frozen.map(id=>{const e=room.enemies.find(x=>x.id===id);return [e.x,e.y];})}));
ok('frozen mobs did not move during stop',s0.pos.length===s1.pos.length&&s0.pos.every((q,k)=>Math.hypot(q[0]-s1.pos[k][0],q[1]-s1.pos[k][1])<1e-6));
console.log('  hero hp during stop',s0.hp,'→',s1.hp,' blockedHurts',(await I()).stats.blockedHurts);
ok('no damage from frozen mobs during stop',s1.hp>=s0.hp-1e-6);
await p.waitForFunction(()=>!window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stop,null,{timeout:120000}).catch(()=>{});ok('stop released',!(await I()).stop);
await setup(false);await p.evaluate(()=>special());await p.waitForFunction(()=>window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().clones.length===2,null,{timeout:60000}).catch(()=>{});
if(shot)await freeze(shot+'-clones.jpg');
await p.waitForFunction(()=>window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stats.cloneShots>=2,null,{timeout:60000}).catch(()=>{});ok('Q → 2 clone shots',(await I()).stats.cloneShots===2);
await p.keyboard.press('w');await p.waitForFunction(()=>Number(player.storyWER?.buffs?.hasteUntil)>time,null,{timeout:60000}).catch(()=>{});
await p.keyboard.down('ArrowRight');await p.waitForFunction(()=>window.__STORYWORLD_SEOHA_CHRONO_R564__.inspect().stats.hasteTrails>=4,null,{timeout:120000}).catch(()=>{});
if(shot)await freeze(shot+'-haste.jpg');await p.keyboard.up('ArrowRight');
i=await I();ok('W haste + moving → afterimages',i.stats.hasteTrails>=4);ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(perf){const run=(on)=>p.evaluate(async(on)=>{window.__STORYWORLD_SEOHA_CHRONO_R564__.set(on);const t0=time,f=[];let last=performance.now(),castAt=-9;
  while(time-t0<12){await new Promise(r=>requestAnimationFrame(r));const n=performance.now();f.push(n-last);last=n;if(time-castAt>3){castAt=time;player.specialCD=0;special();fx('storySourceSkill',player.x,player.y,{storyWER:true,stage:'warning',sourceHero:'seoha',sourceSlot:'r',castId:'perf:'+time});}}
  f.sort((a,b)=>a-b);return {frames:f.length,mean:+(f.reduce((s,v)=>s+v,0)/f.length).toFixed(1),p95:+f[Math.floor(f.length*.95)].toFixed(1)};},on);
 const r=[];for(const on of [false,true,false,true]){await setup(false);r.push([on,await run(on)]);}console.log('  frame ms',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
