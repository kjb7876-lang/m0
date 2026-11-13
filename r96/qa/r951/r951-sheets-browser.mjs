// R951 Dots 시트(CX-0092NS) 적용 장면 사진(헤드리스, 소프트웨어 렌더). r951-browser.mjs 와 같은 순서에 새 시트 5장을 미리 읽고, 시트가 실제로 그려졌는지(브라우저 안 drawImage 경로) 센다.
// SHOT=접두어 면 각 발동의 대표 순간을 찍는다(찍기 직전 tick 배율 1e-4 로 고정). FREE=초 면 그 시간 동안 평타만으로 자연 발동이 몇 번 나오는지 센다.
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',zone=process.env.ZONE||'dist00',free=+(process.env.FREE||0);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,zone);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('neon'));player.hero='neon';player.hp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 await ensureImages(['assets/r562/neon-lightning-strike.webp','assets/r562/neon-toxic-mist.webp','assets/r951/neon-skybeam.webp','assets/r951/neon-big-strike.webp','assets/r951/neon-lance.webp','assets/r951/neon-lance-impact.webp']);
 window.__r951src={};const hook=()=>{try{if(ctx&&!ctx.__r951hook){const di=ctx.drawImage;ctx.__r951hook=1;ctx.drawImage=function(im,...a){try{const m=/assets\/r951\/([a-z-]+)\.webp/.exec(im&&(im.currentSrc||im.src)||'');if(m)window.__r951src[m[1]]=(window.__r951src[m[1]]||0)+1;}catch(_){}return di.apply(this,[im,...a]);};}}catch(_){}};hook();const de2=drawEffect;drawEffect=function(...a){hook();return de2.apply(this,a);};});
const A='window.__STORYWORLD_NEON_STORM_R951__';
ok('module loaded',await p.evaluate(A+'&&'+A+'.revision'));
const setup=(n=12,spread=4)=>p.evaluate(([n,spread])=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,n);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c={x:player.x,y:player.y};live.forEach((e,i)=>{const a=i*2.399,r=1.4+spread*Math.sqrt((i+.5)/live.length);let x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;if(typeof blocked==='function'&&blocked(x,y,.3)){x=c.x+Math.cos(a)*1.4;y=c.y+Math.sin(a)*1.4;}
  e.x=x;e.y=y;e.dead=false;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;});window.__ids=live.map(e=>e.id);return live.length;},[n,spread]);
const hpLost=()=>p.evaluate(()=>window.__ids.map(id=>{const e=room.enemies.find(v=>v.id===id);return 99999-e.hp;}));
const I=()=>p.evaluate(A+'.inspect()');
const fire=k=>p.evaluate(([A,k])=>{const api=eval(A);api.qaReset();api.qaForce(k);const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'neon'});return time;},[A,k]);
const waitT=(t0,s)=>p.waitForFunction(([t0,s])=>time-t0>=s,[t0,s],{timeout:240000});
async function snap(name,t0,at){await waitT(t0,at);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:shot+'-'+name+'.jpg',quality:86});await p.evaluate(()=>{window.__SLOW=1;});}
// 그리기 시간: 발동 중 실제 프레임 간격(rAF) 평균을 끄기 상태와 비교
async function frameMs(ms=2500){return p.evaluate(async ms=>{const ts=[];const t0=performance.now();while(performance.now()-t0<ms){await new Promise(r=>requestAnimationFrame(r));ts.push(performance.now());}const d=ts.slice(1).map((t,i)=>t-ts[i]);d.sort((a,b)=>a-b);return {n:d.length,avg:d.reduce((a,b)=>a+b,0)/d.length,p90:d[Math.floor(d.length*.9)]};},ms);}
ok('mobs arranged',await setup(14,5)>=8);
const base=await frameMs();console.log('  frame ms idle',JSON.stringify(base));
// ② 쌍갈래 뇌창
let t0=await fire('lance');if(shot){await snap('lance-fall',t0,.32);await snap('lance-hit',t0,.62);}await waitT(t0,2.0);
{const lost=await hpLost(),i=await I();ok('lance: 6 spears, ≥3 mobs struck ('+lost.filter(v=>v>0).length+')',i.stats.lances===6&&lost.filter(v=>v>0).length>=3);}
// ③ 생화학 경보
await setup(14,5);t0=await fire('fog');if(shot){await snap('fog-sign',t0,.35);await snap('fog-scatter',t0,.85);await snap('fog',t0,2.2);}
const fogMs=await frameMs(1500);console.log('  frame ms fog',JSON.stringify(fogMs));await waitT(t0,5.2);
{const lost=await hpLost(),i=await I();ok('fog: every arranged mob poisoned 8 ticks',i.stats.fogTicks===8&&lost.every(v=>v>0));}
// ① 천공 낙뢰
await setup(14,5);t0=await fire('storm');if(shot){await snap('storm-charge',t0,.3);await snap('storm-flash',t0,.52);await snap('storm',t0,.75);}
const stMs=await frameMs(1200);console.log('  frame ms storm',JSON.stringify(stMs));await waitT(t0,3.0);
{const lost=await hpLost(),i=await I();ok('storm: 3 waves, ≥10 mobs struck ('+lost.filter(v=>v>0).length+')',i.stats.stormWaves===3&&lost.filter(v=>v>0).length>=10);
 ok('no errors',i.stats.errors===0);ok('sheets drawn (Drive strike / mist)',i.stats.sheetDraws>0);console.log(JSON.stringify(i.stats));}
ok('storm frame time within 1.6× idle (headless software)',stMs.avg<=base.avg*1.6+4);
{const n=await p.evaluate(()=>window.__r951src);console.log('  r951 sheet draws (game ctx)',JSON.stringify(n));ok('all four Dots sheets reached a real drawImage',['neon-skybeam','neon-big-strike','neon-lance','neon-lance-impact'].every(k=>n[k]>0));}
if(free){await setup(8,2);const r=await p.evaluate(async([A,free])=>{const api=eval(A);api.qaRandom(null);const s0=api.inspect().stats.procTotal,t0=time;let last=-9;
  while(time-t0<free){await new Promise(r=>requestAnimationFrame(r));if(time-last>.5){last=time;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'neon'});}}
  return {procs:api.inspect().stats.procTotal-s0,secs:time-t0,by:api.inspect().stats.procs};},[A,free]);console.log('  natural procs',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
