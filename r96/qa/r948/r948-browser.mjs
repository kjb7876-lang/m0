// R948 브라우저 검사(헤드리스, 소프트웨어 렌더): 미카엘라로 몹을 둘러 세우고 세 발동을 하나씩 강제(qaForce) → 피해·홀림·오르골탑 투사체 확인 + 장면 사진.
// SHOT=접두어 면 각 발동의 대표 순간을 찍는다(찍기 직전 tick 배율 1e-4 로 고정). S3D=1 이면 3D 기록기를 켜고(게임 시간이 멈추지 않는지 확인 — R946 함정), FREE=초 면 자연 발동 횟수를 센다.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',zone=process.env.ZONE||'dist00',free=+(process.env.FREE||0),s3d=process.env.S3D==='1';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:s3d?{'storyworld.r183.scene3d':JSON.stringify({on:true})}:null});
if(s3d)await p.evaluate(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:true})));
await go(p,zone);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('michaela'));player.hero='michaela';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const A='window.__STORYWORLD_MICHAELA_HEART_R948__';
ok('module loaded',await p.evaluate(A+'&&'+A+'.revision'));
const setup=(n=8,spread=2.4,dx=2.6,ring=false)=>p.evaluate(([n,spread,dx,ring])=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,n);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c=ring?{x:player.x,y:player.y}:{x:player.x+dx,y:player.y+.3};live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=ring?spread:(i===0?0:spread*(.5+(i%3)*.35));e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});
 window.__ids=live.map(e=>e.id);return live.length;},[n,spread,dx,ring]);
const pos=()=>p.evaluate(()=>window.__ids.map(id=>{const e=room.enemies.find(v=>v.id===id);return {x:e.x,y:e.y,hp:e.hp};}));
const I=()=>p.evaluate(A+'.inspect()');
const fire=k=>p.evaluate(([A,k])=>{const api=eval(A);api.qaReset();api.qaForce(k);const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'michaela'});return time;},[A,k]);
const waitT=(t0,s)=>p.waitForFunction(([t0,s])=>time-t0>=s,[t0,s],{timeout:240000});
async function snap(name,t0,at){await waitT(t0,at);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:shot+'-'+name+'.jpg',quality:86,clip:{x:160,y:40,width:640,height:440}});await p.evaluate(()=>{window.__SLOW=1;});}
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pl=()=>p.evaluate(()=>({x:player.x,y:player.y}));
// ② 하트 세례
ok('mobs arranged in a ring',await setup(8,2.6,0,true)>=5);let before=await pos(),P0=await pl();let t0=await fire('volley');
if(shot)await snap('volley',t0,.2);await waitT(t0,1.2);let after=await pos();
{const hit=after.filter(v=>v.hp<99999-1e-6).length,closer=before.filter((v,i)=>D(after[i],P0)<D(v,P0)-.3).length;ok('volley hit mobs all around ('+hit+') and charmed them closer ('+closer+')',hit>=4&&closer>=3);}
// ① 연심 대개화
await setup(7,1.4,3.0);t0=await fire('bloom');if(shot){await snap('bloom-charge',t0,1.4);await snap('bloom-blast',t0,2.12);await snap('bloom-cloud',t0,3.4);}await waitT(t0,6.6);
{const hp=await pos(),i=await I();ok('bloom exploded on ≥3 mobs and cloud ticked',hp.filter(v=>v.hp<99999-1).length>=3&&i.stats.procs.bloom===1&&!i.acts.length);}
// ③ 쉼터 오르골탑
await setup(7,2.6,2.2);t0=await fire('tower');
{const i=await I(),tw=i.acts.find(a=>a.kind==='tower');ok('tower summoned beside Michaela',!!tw);}
if(shot){await snap('tower-float',t0,1.0);await snap('tower-stick',t0,1.75);await snap('tower-burst',t0,2.5);}
await waitT(t0,4.0);{const i=await I();ok('tower projectiles stuck to several mobs ('+i.stats.stuck+') and burst ('+i.stats.bursts+')',i.stats.stuck>=3&&i.stats.bursts>=3);}
await waitT(t0,10.5);{const i=await I(),hp=await pos();ok('tower gone after 7 s, floaters cleared',!i.acts.length&&!i.floaters.length);ok('tower damaged ≥4 mobs',hp.filter(v=>v.hp<99999-1).length>=4);
 ok('orgel picture loaded (R378 frames ready)',await p.evaluate(()=>!!readyImage('assets/r378/orgel-0.webp')));ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));}
if(s3d){const r=await p.evaluate(async()=>{const t0=time;for(let k=0;k<40;k++)await new Promise(r=>requestAnimationFrame(r));return {dt:time-t0,modal:!!modal};});ok('3D recorder: game time keeps running after effects (dt '+r.dt.toFixed(3)+')',r.dt>0&&!r.modal);}
if(free){await setup(8,1.6,1.4);const r=await p.evaluate(async([A,free])=>{const api=eval(A);api.qaRandom(null);const s0=api.inspect().stats.procTotal,t0=time;let last=-9;
  while(time-t0<free){await new Promise(r=>requestAnimationFrame(r));if(time-last>.5){last=time;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'michaela'});}}
  return {procs:api.inspect().stats.procTotal-s0,secs:time-t0,by:api.inspect().stats.procs};},[A,free]);console.log('  natural procs',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
