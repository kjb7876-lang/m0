// R949 브라우저 검사(헤드리스, 소프트웨어 렌더): 서하로 몹을 둘러 세우고 세 발동을 하나씩 강제(qaForce) → 실제 엔진에서 소환·피해·걷어 내기 확인 + 장면 사진.
// SHOT=접두어 면 대표 순간을 찍는다(찍기 직전 tick 배율 1e-4). S3D=1 이면 3D 기록기(Three.js)로 돈다. FREE=초 면 평타만으로 자연 발동 횟수를 센다.
import {chromium,URL,skip,go} from '../r444/lib.mjs';
// r444 boot 와 같은 순서(새 게임 → 777 → 지역 이동). 사진 해상도(DSF)만 고를 수 있게 여기 따로 둔다.
async function boot(b,{init=null,vp}={}){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:+(process.env.DSF||1)});
 await ctx.addInitScript(([init])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(init)for(const [k,v] of Object.entries(init))localStorage.setItem(k,v);},[init]);
 const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);return {ctx,p};}
const shot=process.env.SHOT||'',zone=process.env.ZONE||'dist00',free=+(process.env.FREE||0),only=process.env.ONLY||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:+(process.env.VW||960),height:+(process.env.VH||540)},init:process.env.S3D?{'storyworld.r183.scene3d':'{"on":true}'}:null});
await go(p,zone);
// 넓은 자리 찾기: 지금 자리에서 가까운 순으로, 둘레 4.5칸이 막히지 않은 곳
await p.evaluate(()=>{const o={x:player.x,y:player.y};let best=null;for(let r=0;r<=14&&!best;r+=1)for(let k=0;k<16&&!best;k++){const x=o.x+Math.cos(k*Math.PI/8)*r,y=o.y+Math.sin(k*Math.PI/8)*r;let free=true;for(let i=0;i<24&&free;i++)for(const d of [1.5,3,4.5])if(blocked(x+Math.cos(i*Math.PI/12)*d,y+Math.sin(i*Math.PI/12)*d,.3)){free=false;break;}if(free&&!blocked(x,y,.3))best={x,y};}if(best){player.x=best.x;player.y=best.y;}window.__open=!!best;});
await p.waitForTimeout(1500);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async q=>{window.__QUIET=q;await ensureImages(heroPaths('seoha'));player.hero='seoha';player.hp=99999;auto=false;guide=false;window.__SLOW=1;const tb=tick;tick=function(dt,...a){if(window.__QUIET)for(const e of room.enemies){if(e.hp>0){e.cd=1e6;e.tell=0;}}return tb.call(this,dt*(window.__SLOW??1),...a);};},!!process.env.QUIET);
const A='window.__STORYWORLD_SEOHA_EPOCH_R949__';
ok('module loaded',await p.evaluate(A+'&&'+A+'.revision'));
const setup=(n=8,spread=2.4,dx=2.6)=>p.evaluate(([n,spread,dx])=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,n);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c={x:player.x+dx,y:player.y+.3};live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:spread*(.5+(i%3)*.35);e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=9999999;e.damage=0;e.speed=0;e.moveSpeed=0;if(window.__QUIET){e.cd=1e6;e.tell=0;e.aim=null;}});
 window.__ids=live.map(e=>e.id);window.__n0=room.enemies.length;window.__boss0=room.enemies.filter(e=>e.boss).length;window.__kills0=room.kills;return live.length;},[n,spread,dx]);
const I=()=>p.evaluate(A+'.inspect()');
const fire=(k,trio)=>p.evaluate(([A,k,trio])=>{const api=eval(A);api.qaReset();if(trio)api.qaTrio(trio);api.qaForce(k);const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'seoha'});return time;},[A,k,trio||null]);
const waitT=(t0,s)=>p.waitForFunction(([t0,s])=>time-t0>=s,[t0,s],{timeout:600000,polling:200});
async function snap(name,t0,at){await waitT(t0,at);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(900);const c=await p.evaluate(()=>{const q=project(player.x+1.2,player.y+.2),r=document.querySelector('canvas').getBoundingClientRect(),k=r.width/(typeof W==='number'?W:r.width);return {x:r.left+q.x*k,y:r.top+q.y*k,w:innerWidth,h:innerHeight};}),cw=Math.min(c.w,+(process.env.CW||720)),ch=Math.min(c.h,+(process.env.CH||450));
 await p.screenshot({path:shot+'-'+name+'.jpg',quality:90,clip:{x:Math.max(0,Math.min(c.w-cw,c.x-cw/2)),y:Math.max(0,Math.min(c.h-ch,c.y-ch*.55)),width:cw,height:ch}});await p.evaluate(()=>{window.__SLOW=1;});}
const safe=()=>p.evaluate(()=>({n:room.enemies.length===window.__n0,boss:room.enemies.filter(e=>e.boss).length===window.__boss0,kills:room.kills===window.__kills0,props:(room.props||[]).filter(a=>a&&a.r949Prop).length,hero:player.hero,ally:player.r720Ally===true,scene:!!storyScene,modal:!!modal}));
const hpSum=()=>p.evaluate(()=>window.__ids.reduce((n,id)=>n+(9999999-room.enemies.find(v=>v.id===id).hp),0));
// ③ 시간 붕괴
if(!only||only==='collapse'){ok('mobs arranged',await setup(6,3.6,3.4)>=5);const t0=await fire('collapse');let i=await I();ok('collapse started',i.active&&i.active.kind==='collapse');
 if(shot){await snap('collapse-wind',t0,.45);await snap('collapse-boom',t0,.58);await snap('collapse-mid',t0,3.2);}await waitT(t0,7.2);i=await I();
 ok('collapse: 14 pulses, explosions and hits ('+i.stats.explosions+'/'+i.stats.hits+')',i.stats.pulses===14&&i.stats.explosions>=14&&i.stats.hits>=14);ok('collapse ended',i.active===null);ok('afterimages ('+i.stats.ghosts+')',i.stats.ghosts>=20);
 const s=await safe();ok('collapse: enemies list/boss count/kills untouched',s.n&&s.boss&&s.kills&&s.props===0);}
// ② 수문장 아르벨리아
if(!only||only==='arbelia'){await setup(6,3.4,3.6);await p.evaluate(async()=>{const P=window.__STORYWORLD_SEOHA_EPOCH_R949__;hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});for(let k=0;k<200;k++){if(readyImage('assets/generated-v31224/actors-normalized/b9b65cd61430_arvelia_delay_archon.webp')&&readyImage('assets/generated-v31224/actors-normalized/822930c614eb_arvelia_delay_archon_attack.webp')&&readyImage('assets/generated-v31224/actors-normalized/a5b3ff549ec2_arvelia_delay_archon_windup.webp')&&readyImage('assets/generated-v31224/actors-normalized/44fa887e7bcc_arvelia_delay_archon_transition.webp'))break;await new Promise(r=>setTimeout(r,100));}});
 const d0=await hpSum(),t0=await fire('arbelia');let i=await I();ok('arbelia summoned (art preloaded by first roll)',i.active&&i.active.kind==='arbelia'&&!!i.arbelia);let s=await safe();ok('arbelia: not an enemy, drawn as one prop',s.n&&s.boss&&s.props===1);
 if(shot){await snap('arb-line-wind',t0,.95);await snap('arb-line',t0,1.12);await snap('arb-donut',t0,2.72);await snap('arb-circle',t0,4.3);await snap('arb-room',t0,5.9);}await waitT(t0,7.2);i=await I();
 ok('arbelia cast four boss patterns in order',JSON.stringify(i.stats.arbOrder.slice(-4))===JSON.stringify(['line','donut','circle','room']));ok('arbelia damaged mobs ('+Math.round(await hpSum()-d0)+')',await hpSum()-d0>100);
 s=await safe();ok('arbelia gone, enemies/boss/kills untouched, no props',i.active===null&&s.n&&s.boss&&s.kills&&s.props===0);ok('arbelia body drawn',i.stats.bodyDraws>0);}
// ① 평행세계 소집
if(!only||only==='heroes'){const trio=(process.env.TRIO||'neon,hunter,lauren').split(',');await p.evaluate(async trio=>{for(const id of trio)await ensureImages(heroPaths(id));},trio);await setup(8,2.4,2.6);
 const st=await p.evaluate(()=>({t:target,c:command,x:player.x,y:player.y,xp:player.xp,lv:player.level}));const d0=await hpSum(),t0=await fire('heroes',trio);let i=await I();
 ok('heroes summoned: '+i.summons.map(s=>s.hero).join(','),i.active&&i.active.kind==='heroes'&&i.summons.length===trio.length);let s=await safe();ok('heroes: not enemies, drawn as props, controlled hero still Seoha',s.n&&s.boss&&s.props===trio.length&&s.hero==='seoha'&&!s.ally);
 if(shot){await snap('heroes-in',t0,.35);await snap('heroes-mid',t0,2.4);await snap('heroes-late',t0,4.6);}await waitT(t0,6.5);i=await I();s=await safe();
 ok('summons attacked with engine basics/skills '+JSON.stringify(i.stats.heroCasts)+' hits '+i.stats.heroHits,i.stats.heroCasts.basic>=6&&i.stats.heroHits>=6);ok('controlled hero stays Seoha mid-summon',s.hero==='seoha'&&!s.ally&&i.swapped===0);
 await waitT(t0,7.2);i=await I();s=await safe();const en=await p.evaluate(()=>({t:target,c:command,x:player.x,y:player.y}));
 ok('heroes gone, no props, enemies/boss untouched',i.active===null&&i.summons.length===0&&s.props===0&&s.n&&s.boss);ok('summon damage landed ('+Math.round(await hpSum()-d0)+')',await hpSum()-d0>50);
 ok('controlled hero not dragged (moved '+Math.hypot(en.x-st.x,en.y-st.y).toFixed(2)+')',Math.hypot(en.x-st.x,en.y-st.y)<.6);
 await p.waitForTimeout(1500);i=await I();ok('no late swaps / errors after the end',i.swapped===0&&(await safe()).hero==='seoha');}
let i=await I();ok('no errors '+(i.stats.lastError||''),i.stats.errors===0);console.log(JSON.stringify(i.stats));
if(free){await setup(8,1.6,1.4);const r=await p.evaluate(async([A,free])=>{const api=eval(A);api.qaReset();api.qaRandom(null);const s0=api.inspect().stats.procTotal,t0=time;let last=-9;
  while(time-t0<free){await new Promise(r=>requestAnimationFrame(r));if(time-last>.5){last=time;const e=room.enemies.find(v=>v.id===window.__ids[0]);hitEnemy(e,1,{kind:'basic',sourceHero:'seoha'});}}
  return {procs:api.inspect().stats.procTotal-s0,secs:time-t0,by:api.inspect().stats.procs};},[A,free]);console.log('  natural procs',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
