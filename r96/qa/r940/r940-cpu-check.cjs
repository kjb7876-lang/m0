// R940 CPU check — 상태 스냅샷(읽기 전용) 모듈.
//  사용자 2026-11-12 "확실하게 사용하면 좋을것만 개선해서 충돌없이 버그없이 적용"(외부 프로토타입 '불씨의 서약' 검토 뒤).
//  고치기 전: 검사 스크립트·플레이 점검 AI 가 room/player/time 같은 엔진 내부 이름을 스크립트마다 따로 읽고,
//   "입장 뒤 몇 초 만에 맞았나", "보스를 몇 초에 잡았나" 를 재는 공용 수단이 없다.
//  고친 뒤 기대: window.__STORYWORLD_SNAPSHOT_R940__ 하나로 지금 상태와 최근 사건 120건, 입장 뒤 첫 피격 시간, 보스 처치 시간을 읽는다.
//   게임 상태는 절대 쓰지 않는다(얼린 상태로 돌려도 오류 0). 게임 동작·화면·밸런스 변화 없음.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),P=(...a)=>path.join(R,...a),ROOT=f=>fs.readFileSync(path.join(R,'..',f),'utf8');
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(c!==true){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}else console.log('ok  ',m);};
const F='qa-snapshot-r940.js',has=fs.existsSync(P('client-source',F)),src=has?fs.readFileSync(P('client-source',F),'utf8'):'';
ok('module exists',has);
ok('runtime copy matches client source',has&&fs.existsSync(P('runtime-text',F))&&fs.readFileSync(P('runtime-text',F),'utf8')===src);
const html=fs.readFileSync(P('runtime-text','index.html'),'utf8');
ok('index.html loads the module once',(html.match(/<script src="\.\/qa-snapshot-r940\.js"><\/script>/g)||[]).length===1);
ok('pages.yml runs this check',/r96\/qa\/r940\/r940-cpu-check\.cjs/.test(ROOT('.github/workflows/pages.yml')));
ok('public verify expects the module',/qa-snapshot-r940\.js/.test(ROOT('scripts/verify-r96-public.py')));
ok('runtime manifest lists the module',/qa-snapshot-r940\.js/.test(fs.readFileSync(P('runtime-manifest.json'),'utf8')));
ok('runtime inputs list the module',/qa-snapshot-r940\.js/.test(fs.readFileSync(P('runtime-inputs.json'),'utf8')));
// 읽기 전용: 엔진 함수·전역을 바꿔 끼우지 않고, 그리기·소리·저장소에 손대지 않는다
ok('no engine wrapping, drawing, audio or storage access in source',has&&!/\b(localStorage|sessionStorage|getContext|drawImage|AudioContext|requestAnimationFrame|addEventListener|document\.|fetch\()/.test(src.replace(/\/\/.*$/gm,'')));
ok('no assignment to engine names',has&&!/\b(room|player|time|loading|started|killEnemy|enterRegion)\s*(\.[\w.]+\s*)?(=(?!=)|\+=|-=|\+\+|--)/.test(src.replace(/\/\/.*$/gm,'')));

const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;};
function load(globals={}){const timers=[];const w={};const ctx=vm.createContext({window:w,console,setInterval:(f,ms)=>{timers.push({f,ms});return timers.length;},clearInterval:()=>{},JSON,Math,Object,Array,Number,String,WeakSet,WeakMap,Set,Map,...globals});
 if(has)vm.runInContext(src,ctx,{filename:F});return {ctx,api:w.__STORYWORLD_SNAPSHOT_R940__,timers};}
const mob=(o={})=>({hp:30,maxHp:30,x:1,y:1,spawnState:'active',...o});
const state=(o={})=>({started:true,loading:false,time:10,room:{id:'dist01',enemies:[mob(),mob(),mob({spawnState:'hidden'})]},player:{hp:100,maxHp:100,x:5,y:6},...o});

if(has){
 // 1) 엔진 이름이 하나도 없어도(제목 화면 전) 던지지 않는다
 {const {api}=load();ok('api present',!!api&&typeof api.snapshot==='function'&&typeof api.tick==='function'&&typeof api.events==='function'&&typeof api.reset==='function');
  let s,err=null;try{api.tick();s=api.snapshot();}catch(e){err=String(e);}
  ok('no engine globals: snapshot is safe and says not ready',err===null&&s&&s.ready===false&&s.errors===0,{err,s});
  ok('snapshot is plain JSON',(()=>{try{return JSON.stringify(JSON.parse(JSON.stringify(s)))===JSON.stringify(s);}catch(_){return false;}})());}
 // 2) 정상 경로: 지금 상태
 {const g=state(),{ctx,api,timers}=load(g);api.tick();const s=api.snapshot();
  ok('reads zone, time, hero',s.ready===true&&s.zone==='dist01'&&s.time===10&&s.hero.hp===100&&s.hero.maxHp===100&&s.hero.x===5&&s.hero.y===6,s);
  ok('counts enemies: 3 alive, 2 active, 1 hidden, 0 boss',s.enemies.alive===3&&s.enemies.active===2&&s.enemies.hidden===1&&s.enemies.bosses.length===0,s.enemies);
  ok('first tick records zone entry',api.events().some(e=>e.type==='enter'&&e.zone==='dist01'&&e.t===10)&&s.entry.zone==='dist01'&&s.entry.firstHitAfter===null,api.events());
  ok('sampler interval is registered once, 200~500ms',timers.length===1&&timers[0].ms>=200&&timers[0].ms<=500,timers.map(t=>t.ms));
  // 피격: 입장 1.5초 뒤 12 피해
  ctx.time=11.5;ctx.player.hp=88;api.tick();let s2=api.snapshot();
  ok('hero hit event with damage and time since entry',api.events().some(e=>e.type==='heroHit'&&e.dmg===12&&Math.abs(e.sinceEntry-1.5)<1e-9)&&s2.counters.heroHits===1&&s2.counters.heroDamage===12,api.events());
  ok('first hit after entry = 1.5s',Math.abs(s2.entry.firstHitAfter-1.5)<1e-9,s2.entry);
  ctx.time=12;ctx.player.hp=95;api.tick();ok('healing is not a hit',api.snapshot().counters.heroHits===1);
  ctx.time=13;ctx.player.hp=60;api.tick();ok('second hit keeps first-hit time',Math.abs(api.snapshot().entry.firstHitAfter-1.5)<1e-9&&api.snapshot().counters.heroHits===2);
  // 처치
  ctx.time=14;ctx.room.enemies[0].hp=0;api.tick();ctx.time=14.3;api.tick();
  ok('kill counted once even if the dead mob stays in the list',api.snapshot().counters.kills===1&&api.events().filter(e=>e.type==='kill').length===1,api.events());
  ctx.time=15;ctx.room.enemies.splice(1,1);api.tick();ok('mob removed from the list without dying is not a kill',api.snapshot().counters.kills===1);
  // 쓰러짐
  ctx.time=16;ctx.player.hp=0;api.tick();ok('hero down event once',api.events().filter(e=>e.type==='heroDown').length===1);ctx.time=16.3;api.tick();ok('still one hero down',api.events().filter(e=>e.type==='heroDown').length===1);
  // 지역 이동 → 입장 기록 새로
  ctx.time=20;ctx.player.hp=100;ctx.room={id:'dist02',enemies:[mob()]};api.tick();const s3=api.snapshot();
  ok('zone change: new entry, first hit cleared, revive is not a hit (hits stay 3: 12, 35, and the 60 that downed the hero)',s3.zone==='dist02'&&s3.entry.zone==='dist02'&&s3.entry.t===20&&s3.entry.firstHitAfter===null&&s3.counters.heroHits===3,s3.entry);
  // 불러오기(시간이 거꾸로) → 기준 다시 잡기, 가짜 피격·처치 없음
  ctx.time=3;ctx.player.hp=40;ctx.room={id:'dist02',enemies:[mob(),mob()]};api.tick();const s4=api.snapshot();
  ok('time rewind (load): rebased, no fake hit or kill',s4.counters.heroHits===3&&s4.counters.kills===1&&api.events().some(e=>e.type==='rewind')&&s4.entry.t===3,{c:s4.counters,e:s4.entry});}
 // 3) 보스 처치 시간
 {const g=state({room:{id:'ep1a11',enemies:[mob({boss:true,hp:500,maxHp:500,name:'시험 보스'}),mob()]}}),{ctx,api}=load(g);api.tick();
  ok('boss listed with hp',api.snapshot().enemies.bosses.length===1&&api.snapshot().enemies.bosses[0].hp===500&&api.snapshot().bossFights.length===0,api.snapshot().enemies);
  ctx.time=12;ctx.room.enemies[0].hp=450;api.tick();ctx.time=20;ctx.room.enemies[0].hp=200;api.tick();
  ok('boss fight open while boss alive',api.snapshot().bossFights.length===1&&api.snapshot().bossFights[0].end===null&&api.snapshot().bossFights[0].start===12,api.snapshot().bossFights);
  ctx.time=24.5;ctx.room.enemies[0].hp=0;api.tick();const f=api.snapshot().bossFights[0];
  ok('boss down: ttk = 12.5s, event recorded',f&&f.end===24.5&&Math.abs(f.ttk-12.5)<1e-9&&f.zone==='ep1a11'&&f.name==='시험 보스'&&api.events().some(e=>e.type==='bossDown'&&Math.abs(e.ttk-12.5)<1e-9),f);
  ok('boss kill is also a kill',api.snapshot().counters.kills===1);}
 // 4) 경계: 사건 기록은 120건을 넘지 않는다, reset 은 기록만 지운다
 {const g=state(),{ctx,api}=load(g);api.tick();for(let i=0;i<300;i++){ctx.time+=.3;ctx.player.hp=i%2?100:90;api.tick();}
  ok('event ring capped at 120',api.events().length===120,api.events().length);ok('counters keep the full count',api.snapshot().counters.heroHits===150,api.snapshot().counters);
  api.reset();ok('reset clears events and counters, keeps reading',api.events().length===0&&api.snapshot().counters.heroHits===0&&api.snapshot().zone==='dist01');
  ok('events() returns a copy',(()=>{const a=api.events();a.push(1);return api.events().length===0;})());}
 // 5) 회귀 방지: 얼린 상태로 돌려도 오류 0 — 게임 상태에 쓰지 않는다
 {const g=state({room:{id:'dist03',enemies:[mob({boss:true,hp:9,maxHp:10}),mob({hp:0}),mob()]}});deepFreeze(g.room);deepFreeze(g.player);const {api}=load(g);for(let i=0;i<5;i++)api.tick();
  ok('frozen game state: zero errors (never writes to game objects)',api.snapshot().errors===0&&api.snapshot().ready===true,api.snapshot());}
 // 6) 이상값: NaN·없는 필드·enemies 가 배열이 아님
 {const g=state({time:NaN,room:{id:'x',enemies:null},player:{hp:undefined}}),{api}=load(g);let err=null;try{api.tick();api.tick();}catch(e){err=String(e);}const s=api.snapshot();
  ok('bad values do not throw and do not invent events',err===null&&s.errors===0&&s.counters.heroHits===0&&s.counters.kills===0&&s.enemies.alive===0,{err,s});}
 // 7) 읽는 중 예외가 나도 게임으로 새지 않는다
 {const g=state();Object.defineProperty(g.room,'enemies',{get(){throw new Error('boom');}});const {api}=load(g);let err=null;try{api.tick();api.tick();}catch(e){err=String(e);}
  ok('reader exception is contained and counted',err===null&&api.snapshot().errors>=1,{err});}
 // 9) 최대 체력: 엔진은 player.maxHp 가 아니라 maxHP() 함수로 준다(브라우저 실측에서 확인) → 있으면 그 값을 읽고, 던져도 새지 않는다
 {const {api}=load({...state({player:{hp:120,x:1,y:2}}),maxHP:()=>260});api.tick();ok('max health comes from engine maxHP() when present',api.snapshot().hero.maxHp===260&&api.snapshot().hero.hp===120,api.snapshot().hero);}
 {const {api}=load({...state({player:{hp:120,x:1,y:2}}),maxHP:()=>{throw new Error('x');}});api.tick();const s=api.snapshot();ok('maxHP() that throws: max health null, snapshot still ready',s.ready===true&&s.hero.maxHp===null&&s.hero.hp===120,s);}
 // 10) 회귀(브라우저 실측): 엔진 killEnemy 는 죽은 적을 같은 프레임에 room.enemies 에서 뺀다 → 목록에서 사라졌어도 죽은 것이면 한 번 센다
 {const g=state({room:{id:'dist01',enemies:[mob(),mob(),mob({boss:true,hp:80,maxHp:100,name:'B'})]}}),{ctx,api}=load(g);api.tick();
  const m=ctx.room.enemies[0],bo=ctx.room.enemies[2];ctx.time=11;m.hp=0;m.deadRecorded=true;m.spawnState='dead';ctx.room.enemies.splice(0,1);api.tick();ctx.time=11.3;api.tick();
  ok('dead mob already removed from the list is counted once',api.snapshot().counters.kills===1&&api.events().filter(e=>e.type==='kill').length===1,api.snapshot().counters);
  ctx.time=15;bo.hp=0;bo.deadRecorded=true;ctx.room.enemies.splice(ctx.room.enemies.indexOf(bo),1);api.tick();const f=api.snapshot().bossFights[0];
  ok('boss removed from the list on death still closes the fight (ttk 5s)',api.snapshot().counters.bossKills===1&&f&&f.end===15&&Math.abs(f.ttk-5)<1e-9,api.snapshot().bossFights);
  ctx.time=16;ctx.room={id:'dist02',enemies:[mob()]};api.tick();ctx.time=17;api.tick();ok('leaving the zone does not turn the old zone mobs into kills',api.snapshot().counters.kills===2,api.snapshot().counters);}
 // 8) 두 번 실려도 하나
 {const {ctx,api,timers}=load(state());vm.runInContext(src,ctx);ok('double load keeps one api and one timer',ctx.window.__STORYWORLD_SNAPSHOT_R940__===api&&timers.length===1);}
}
console.log(`\nR940 CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
