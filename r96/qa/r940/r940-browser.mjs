// R940 브라우저 검사(헤드리스, 소프트웨어 렌더): 라우렌으로 몹을 둘러 세우고 다섯 발동을 하나씩 강제(qaForce) → 피해·밀림·끌림·조형물 숨김/되돌림 확인 + 장면 사진.
// SHOT=접두어 면 각 발동의 대표 순간을 찍는다(찍기 직전 tick 배율 1e-4 로 고정). 자연 발동(확률) 은 FREE=초 로 그 시간 동안 평타만으로 몇 번 나오는지 센다.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',zone=process.env.ZONE||'dist00',free=+(process.env.FREE||0);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,zone);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
const A='window.__STORYWORLD_LAUREN_CELESTIAL_R940__';
ok('module loaded',await p.evaluate(A+'&&'+A+'.revision'));
const setup=(n=8,spread=2.4,dx=2.6)=>p.evaluate(([n,spread,dx])=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,n);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c={x:player.x+dx,y:player.y+.3};live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:spread*(.5+(i%3)*.35);e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});
 window.__ids=live.map(e=>e.id);return live.length;},[n,spread,dx]);
const pos=()=>p.evaluate(()=>window.__ids.map(id=>{const e=room.enemies.find(v=>v.id===id);return {x:e.x,y:e.y,hp:e.hp};}));
const I=()=>p.evaluate(A+'.inspect()');
const fire=k=>p.evaluate(([A,k])=>{const api=eval(A);api.qaReset();api.qaForce(k);const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});return time;},[A,k]);
const waitT=(t0,s)=>p.waitForFunction(([t0,s])=>time-t0>=s,[t0,s],{timeout:180000});
async function snap(name,t0,at){await waitT(t0,at);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:shot+'-'+name+'.jpg',quality:86,clip:{x:160,y:70,width:640,height:400}});await p.evaluate(()=>{window.__SLOW=1;});}
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// ① 항성 반발
ok('mobs arranged',await setup(8,2.0,1.2)>=5);let before=await pos(),pl=await p.evaluate(()=>({x:player.x,y:player.y}));let t0=await fire('repulse');
if(shot)await snap('repulse',t0,.18);await waitT(t0,.8);let after=await pos();
{const pushed=before.filter((v,i)=>D(v,pl)<=2.8&&D(after[i],pl)>D(v,pl)+1.0).length;ok('repulse pushed nearby mobs outward ('+pushed+')',pushed>=3);}
// ② 적색 거성
await setup(6,1.0,2.6);before=await pos();t0=await fire('red');if(shot)await snap('red',t0,.35);await waitT(t0,1.6);after=await pos();
{const i=await I();ok('red orb hit + pushed forward',i.stats.procs.red===1&&after.some((v,k)=>v.x+v.y>before[k].x+before[k].y+.8));}
// ③ 청색 왜성
await setup(8,3.0,2.8);before=await pos();t0=await fire('blue');if(shot)await snap('blue',t0,.9);await waitT(t0,1.9);after=await pos();
{const c=before[0];const pulled=before.filter((v,k)=>k&&D(v,c)<=3.4&&D(v,c)>.8&&D(after[k],c)<D(v,c)-.3).length;ok('blue orb pulled mobs in ('+pulled+')',pulled>=2);}
// ④ 쌍성 소멸
await setup(6,.8,3.0);await p.evaluate(()=>{const ids=window.__ids;ids.forEach((id,i)=>{const e=room.enemies.find(v=>v.id===id);e.x=player.x+2+i*1.4;e.y=player.y+(i%2?.3:-.3);});});
t0=await fire('violet');if(shot)await snap('violet-charge',t0,.3);if(shot)await snap('violet',t0,.72);await waitT(t0,1.8);
{const i=await I();ok('violet beam pierced several mobs ('+i.stats.hits+' hits so far)',i.stats.procs.violet===1);const hp=await pos();ok('violet damaged ≥3 mobs on the line',hp.filter(v=>v.hp<99999-1).length>=3);}
// ⑤ 유성 궤도
const props=await p.evaluate(()=>(room.props||[]).filter(a=>a&&typeof a.path==='string'&&!a.solid&&a.visible!==false).map(a=>({id:a.id,x:a.x,y:a.y,h:a.height,path:a.path})).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,6));
console.log('  nearest props',JSON.stringify(props.map(v=>[v.id,+Math.hypot(v.x,v.y).toFixed(1),v.h,v.path.split('/').pop()])));
const elig=await p.evaluate(A+'.qaProps()');console.log('  eligible props in room',elig.length,JSON.stringify(elig.slice(0,8).map(v=>[v.id,v.path.split('/').pop(),v.height])));
if(elig.length){await p.evaluate(([x,y])=>{for(const [dx,dy] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.2,1.2],[-1.2,-1.2]]){if(!blocked(x+dx,y+dy,.3)){player.x=x+dx;player.y=y+dy;return;}}},[elig[0].x,elig[0].y]);}
await setup(6,1.6,3.6);t0=await fire('meteor');let i=await I();const met=i.acts.find(a=>a.kind==='meteor');console.log('  meteor rocks',JSON.stringify(met&&met.rocks));
ok('meteor gathered 3 objects',met&&met.rocks.length===3);
const hid=await p.evaluate(()=>(room.props||[]).filter(a=>a.r940Hidden).map(a=>[a.id,a.visible]));console.log('  hidden props',JSON.stringify(hid));
if(shot){await snap('meteor-orbit',t0,.8);await snap('meteor-impact',t0,1.32);}await waitT(t0,2.6);
i=await I();ok('meteor exploded and props restored',i.stats.procs.meteor===1&&i.stats.hiddenProps===i.stats.restoredProps&&!(await p.evaluate(()=>(room.props||[]).some(a=>a.r940Hidden))));
ok('no errors',i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(free){await setup(8,1.6,1.4);const r=await p.evaluate(async([A,free])=>{const api=eval(A);api.qaRandom(null);const s0=api.inspect().stats.procTotal,t0=time;let last=-9;
  while(time-t0<free){await new Promise(r=>requestAnimationFrame(r));if(time-last>.5){last=time;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});}}
  return {procs:api.inspect().stats.procTotal-s0,secs:time-t0,by:api.inspect().stats.procs};},[A,free]);console.log('  natural procs',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
