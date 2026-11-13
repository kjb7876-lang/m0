// R952 브라우저 검사(헤드리스, 소프트웨어 렌더): 헌터로 몹을 세워 두고 세 단계를 하나씩 강제(force) → 소환 몸·피해·진법·해산 확인 + 장면 사진.
//  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r952/r952-browser.mjs      SHOT=접두어 면 단계마다 대표 순간을 찍는다(찍기 직전 tick 배율 1e-4).
//  FREE=초 면 그 시간 동안 평타만으로 자연 발동이 몇 번 나오는지 센다. 헤드리스는 화면 품질 검증이 아니다(그림은 사진을 사람이 본다).
import {chromium,boot,go} from '../r444/lib.mjs';
const shot=process.env.SHOT||'',zone=process.env.ZONE||'dist00',free=+(process.env.FREE||0);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,zone);
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
await p.evaluate(async()=>{await ensureImages(heroPaths('hunter'));await ensureImages(heroPaths('slayer'));player.hero='hunter';player.hp=player.maxHp=99999;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 window.__hits=[];const hb=hitEnemy;hitEnemy=function(e,v,s,...r){const who=player,o=e&&e.hp,ret=hb.call(this,e,v,s,...r);try{window.__hits.push({id:e&&e.id,v,d:o-(e&&e.hp),hero:who.hero,summon:who.r952Summon===true,tag:s&&s.r952||null,kind:s&&s.kind||null,r425:s&&s.r425||null,t:time});}catch(_){}return ret;};
 window.__shots=[];const mb=makeShot;makeShot=function(...a){const r=mb.apply(this,a);try{if(r)window.__shots.push({hero:player.hero,summon:player.r952Summon===true,t:time});}catch(_){}return r;};});
const A='window.__STORYWORLD_HUNTER_SQUAD_R952__';
ok('module loaded',await p.evaluate(A+'&&'+A+'.revision'));
const setup=(n=7,spread=1.8,dx=3.4)=>p.evaluate(([n,spread,dx])=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,n);room.enemies.filter(e=>!live.includes(e)&&!e.boss).forEach(e=>{e.hp=0;e.dead=true;});
 const c={x:player.x+dx,y:player.y+.3};live.forEach((e,i)=>{const a=i*2*Math.PI/live.length,r=i===0?0:spread*(.5+(i%3)*.35);e.x=c.x+Math.cos(a)*r;e.y=c.y+Math.sin(a)*r;e.dead=false;e.spawnState='active';e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.moveSpeed=0;});
 window.__ids=live.map(e=>e.id);window.__hits.length=0;window.__shots.length=0;return live.length;},[n,spread,dx]);
const I=()=>p.evaluate(A+'.inspect()');
const fire=k=>p.evaluate(([A,k])=>{const api=eval(A);api.force(k);player.attackCD=0;basicAttack(true);return time;},[A,k]);
const waitT=(t0,s)=>p.waitForFunction(([t0,s])=>time-t0>=s,[t0,s],{timeout:240000});
async function snap(name,t0,at){await waitT(t0,at);await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:shot+'-'+name+'.jpg',quality:88,clip:{x:120,y:40,width:720,height:450}});await p.evaluate(()=>{window.__SLOW=1;});}
const hits=()=>p.evaluate(()=>window.__hits.slice());
const sane=async(label)=>{const s=await p.evaluate(()=>({hero:player.hero,summon:player.r952Summon===true,props:(room.props||[]).filter(a=>a&&a.r952Prop).length}));ok(label+': 조종 영웅 그대로·남은 소환 조형물 0',s.hero==='hunter'&&!s.summon&&s.props===0);};

// ① 혈맹 호출
ok('mobs arranged',await setup()>=4);let t0=await fire('call');let i=await I();
ok('① 발동: 슬레이어 1',i.active&&i.tier==='call'&&i.units.length===1&&i.units[0].kind==='slayer');
if(shot)await snap('call-enter',t0,.25);if(shot)await snap('call-fight',t0,2.2);await waitT(t0,4.5);
{const h=await hits(),sl=h.filter(x=>x.summon&&x.hero==='slayer'),me=h.filter(x=>!x.summon&&x.hero==='hunter');i=await I();
 console.log('  slayer casts',JSON.stringify(i.stats.casts),'slayer hits',sl.length,'dmg',Math.round(sl.reduce((a,x)=>a+x.d,0)),'hunter hits',me.length,'dmg',Math.round(me.reduce((a,x)=>a+x.d,0)));
 ok('슬레이어가 엔진 공격으로 적을 침',sl.length>=3&&i.stats.casts.basic>=2);ok('슬레이어 고유기·스킬도 나감',i.stats.casts.q+i.stats.casts.w+i.stats.casts.e+i.stats.casts.r>=1);
 ok('분신 없음(①)',h.every(x=>x.tag!=='shade'));ok('player 는 헌터',await p.evaluate(()=>player.hero==='hunter'&&!player.r952Summon));}
await waitT(t0,7.3);i=await I();ok('7초 뒤 해산',!i.active);await sane('①');

// ② 혈영 강습
await setup();await p.evaluate(()=>{window.__rnd=Math.random;Math.random=()=>.01;});t0=await fire('shade');
if(shot){await waitT(t0,.6);for(let k=0;k<40;k++){if((await I()).shades>0)break;await p.waitForTimeout(150);}await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:shot+'-shade.jpg',quality:88,clip:{x:120,y:40,width:720,height:450}});await p.evaluate(()=>{window.__SLOW=1;});}
await waitT(t0,4.5);await p.evaluate(()=>{Math.random=window.__rnd;});
{const h=await hits(),sh=h.filter(x=>x.tag==='shade');i=await I();console.log('  shades',i.stats.shades,'shade hits',sh.length,'targets',new Set(sh.map(x=>x.id)).size);
 ok('② 슬레이어 분신이 나와 벰',i.tier==='shade'&&sh.length>=2&&sh.every(x=>x.d>0));ok('분신이 여러 적에게',new Set(sh.map(x=>x.id)).size>=2);ok('헌터 분신 없음(②)',i.units.length===1);}
await waitT(t0,7.3);ok('② 7초 뒤 해산',!(await I()).active);await sane('②');

// ③ 기러기진 섬멸
await setup(8,2.0,4.2);t0=await fire('squad');i=await I();ok('③ 발동: 슬레이어 1 + 헌터 분신 4',i.tier==='squad'&&i.units.filter(u=>u.kind==='hunter').length===4&&i.units.filter(u=>u.kind==='slayer').length===1);
if(shot)await snap('squad-form',t0,.5);if(shot)await snap('squad-volley',t0,1.15);if(shot)await snap('squad-fight',t0,3.2);await waitT(t0,4.5);
{const h=await hits(),sh=await p.evaluate(()=>window.__shots.slice());i=await I();const hc=sh.filter(x=>x.summon&&x.hero==='hunter'),hh=h.filter(x=>x.summon&&x.hero==='hunter');
 console.log('  clone shots',hc.length,'clone hits',hh.length,'volleys',i.stats.volleys,'cloneShots',i.stats.cloneShots,'slayer',h.filter(x=>x.summon&&x.hero==='slayer').length,'shade',h.filter(x=>x.tag==='shade').length);
 ok('헌터 분신이 엔진 화살을 쏨',hc.length>=8&&i.stats.cloneShots>=8);ok('고유기 일제 사격 4회',i.stats.volleys===4);
 ok('분신이 진법 자리에 섬',i.units.filter(u=>u.kind==='hunter').every(u=>Math.hypot(u.x-i.slots[u.i].x,u.y-i.slots[u.i].y)<.3));
 const me=h.filter(x=>!x.summon&&x.kind!=='r952-shade'),tot=h.reduce((a,x)=>a+x.d,0),mine=me.reduce((a,x)=>a+x.d,0);console.log('  damage share: hunter',Math.round(mine),'squad',Math.round(tot-mine));}
await waitT(t0,7.3);ok('③ 7초 뒤 해산',!(await I()).active);await sane('③');
i=await I();ok('오류 0',i.errors===0);if(i.errors)console.log('  lastError',i.lastError);console.log(JSON.stringify(i.stats));
ok('치명 오류 없음',await p.evaluate(()=>!document.getElementById('fatal').textContent.trim()));
if(free){await setup(8,1.6,3);const r=await p.evaluate(async([A,free])=>{const api=eval(A),s0=api.inspect().stats,p0={...s0.procs},t0=time;
  while(time-t0<free){await new Promise(r=>requestAnimationFrame(r));if(!(player.attackCD>0))basicAttack(true);}
  const s=api.inspect().stats;return {secs:+(time-t0).toFixed(1),swings:s.swings-s0.swings,rolls:s.rolls-s0.rolls,procs:{call:s.procs.call-p0.call,shade:s.procs.shade-p0.shade,squad:s.procs.squad-p0.squad},errors:api.inspect().errors};},[A,free]);console.log('  natural procs',JSON.stringify(r));}
await b.close();process.exit(fail?1:0);
