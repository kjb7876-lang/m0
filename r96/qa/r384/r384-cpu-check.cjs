// R384 — 영화 모드: 보스 전 서사는 일반 전투 중, 보스 서사는 보스전 중 + 남은 서사 시간에 맞춰 적이 받는 피해 배율 조정 + 말 빠르기 일정(R370 rev 4).
// CPU 에서 가짜 엔진에 붙여 본다. 실제 전투 체감·음성 품질·브라우저·모바일은 여기서 보지 않는다(미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const SRC=C('cinema-sync-r384.js'),CIN=C('cinema-mode-r370.js'),html=RT('index.html');
// ── 빌드 연결 ──
ok('runtime copies match client-source',RT('cinema-sync-r384.js')===SRC&&RT('cinema-mode-r370.js')===CIN);
ok('index.html loads cinema-sync-r384 once, after voice-r381 and cinema-mode-r370',html.split('"./cinema-sync-r384.js"').length===2&&/voice-r381\.js"><\/script><script src="\.\/cinema-sync-r384\.js"><\/script>/.test(html)&&html.indexOf('cinema-sync-r384.js')>html.indexOf('cinema-mode-r370.js'));
ok('public verify list (with comma), runtime inputs, Pages CPU step (R376 step restored too)',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'cinema-sync-r384.js',")&&JSON.parse(RT('../runtime-inputs.json')).textPaths.includes('cinema-sync-r384.js')&&/node r96\/qa\/r384\/r384-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8'))&&/node r96\/qa\/r376\/r376-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('no eval / new Function',!/\beval\s*\(|new Function/.test(SRC));
// ── R370 rev 4: 말 빠르기 일정 ──
ok('R370 rev 4: no per-sentence rate change (rateFor/gapFor gone, one steady rate)',/REV='R370-cinema-[45]'/.test(CIN)&&!/rateFor\(|gapFor\(|RATE_MIN/.test(CIN)&&/rate=steadyRate\(prefs\.rate\)/.test(CIN));
ok('R370 exposes remainingSecs() as a top-level number function',/remainingSecs:\(\)=>\+remainingSecs\(\)\.toFixed\(1\)/.test(CIN));
// ── 가짜 엔진 ──
function mk(o={}){let clock=0;let iv=null;const played=[],hits=[];
 const st={on:o.cinema!==false,voice:o.voice??60,phase:o.phase??'route',controlled:true,real:!!o.real};
 const sb={setTimeout,localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},performance:{now:()=>clock*1000},setInterval:f=>{iv=f;},Math,JSON,String,Array,Set,Map,Object,Number};
 sb.window=sb;
 sb.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:st.on}),remainingSecs:()=>st.voice};
 sb.__STORYWORLD_WORLD_COMBAT_R78__={controlled:()=>st.controlled,state:()=>({phase:st.phase})};
 if(o.s61)sb.__STORYWORLD_SUMMONS_R61__=o.s61;
 sb.__STORYWORLD_REAL_MODE_R376__={active:()=>st.real};
 if(o.coop)sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>o.coop};
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=false,storyScene=null,readScenes=new Set(),
  room={id:'dist01',enemies:[{id:'a',hp:100,maxHp:100,profile:{id:'m'}},{id:'b',hp:100,maxHp:100,profile:{id:'m'}},{id:'boss',hp:400,maxHp:400,boss:true,spawnState:'hidden',profile:{id:'B'}}]},regionById={dist01:{title:'x'}};
  var time=0,player={x:0,y:0,hp:100},__went=[];async function enterRegion(id,from,opt){__went.push(id);return true;}
  var __world=${!!o.world},__kill=[];function blocked(){if(!__world)throw new Error('no world');return false;}function findPath(a,b){return [b];}
  function killEnemy(e){if(e.deadRecorded)return;__kill.push(room.enemies.filter(x=>x!==e&&x.hp>0&&!x.boss&&!x.deadRecorded&&x.spawnState!=='hidden').length);e.hp=0;e.deadRecorded=true;}
  var __played=[],__hits=[];
  function nextScenes(def,part){return part==='pre'?[{key:'p1',text:'보스 전 1'},{key:'p2',text:'보스 전 2'}]:[{key:'q1',text:'보스 서사'}];}
  function playScenes(sc,done){__played.push(sc.map(s=>s.key));for(const s of sc)readScenes.add(s.key);done&&done();}
  function hitEnemy(e,v){__hits.push(v);e.hp-=v;return true;}`,sb);
 vm.runInContext(SRC,sb);
 const api=sb.__STORYWORLD_CINEMA_SYNC_R384__;
 const tick=(s,dmg=0)=>{for(let i=0;i<s*2;i++){clock+=.5;sb.time=clock;if(o.voiceClock)st.voice=Math.max(0,o.voiceClock-clock);if(dmg)for(const e of sb.room.enemies)if(e.hp>0&&!(e.spawnState==='hidden'))sb.hitEnemy(e,dmg/2/(sb.room.enemies.filter(x=>x.hp>0&&x.spawnState!=='hidden').length||1));iv&&iv();}};
 return{sb,api,st,tick,ev:s=>vm.runInContext(s,sb),clock:()=>clock,step:(dt)=>{clock+=dt;sb.time=clock;if(o.voiceClock)st.voice=Math.max(0,o.voiceClock-clock);},iv:()=>iv&&iv()};}
// ① 서사 시점
{const F=mk();F.tick(1);
 ok('route phase: pre-boss story plays once during normal combat',JSON.stringify(F.ev('__played'))==='[["p1","p2"]]'&&F.api.inspect().stats.pre===1,F.ev('__played'));
 F.tick(3);ok('…not played again',F.ev('__played').length===1);
 F.st.phase='doorStory';F.tick(1);ok('door story: nothing new (engine finds pre scenes already read)',F.ev('__played').length===1&&F.ev('readScenes.has("p2")'));
 F.st.phase='boss';F.tick(1);ok('boss phase, boss still hidden: boss story waits',F.ev('__played').length===1);
 F.ev("room.enemies[2].spawnState='active'");F.tick(1);ok('boss appears: boss story plays during the boss fight',JSON.stringify(F.ev('__played')[1])==='["q1"]'&&F.api.inspect().stats.post===1);
 F.tick(2);ok('…once',F.ev('__played').length===2);}
{const F=mk();F.ev('storyScene={key:"x"}');F.tick(1);ok('waits while an engine story window is open',F.ev('__played').length===0);F.ev('storyScene=null');F.tick(1);ok('…then plays',F.ev('__played').length===1);}
{const F=mk();F.ev('readScenes.add("p1");readScenes.add("p2")');F.tick(1);ok('already-read pre story is not replayed',F.ev('__played').length===0);}
{const F=mk({cinema:false});F.tick(2);ok('cinema off: no early story, factor 1',F.ev('__played').length===0&&F.api.factor()===1&&!F.api.inspect().active);}
{const F=mk({coop:'host'});F.tick(2);ok('co-op: off',F.ev('__played').length===0&&!F.api.inspect().active);}
{const F=mk();F.st.controlled=false;F.tick(2);ok('not an R78 zone: off',F.ev('__played').length===0&&F.api.inspect().phase===null);}
{const F=mk({prefs:{story:false}});F.tick(2);ok('story:false pref keeps the old door/exit timing',F.ev('__played').length===0);}
// ② 전투 시간 맞추기
{const F=mk({voice:60});F.tick(3);ok('no damage yet (rate 0): factor stays 1',F.api.factor()===1);
 // 200 HP at 40 HP/s(unscaled) → 5 s fight vs 60 s voice → defense up(factor down)
 F.tick(6,40);
 const f=F.api.factor();ok('fight would end long before narration: enemies take less damage (factor < 1, ≥ .35)',f<1&&f>=.35,f);
 ok('each 2 s step is at most ×0.75 (3 steps → ≥ .42)',f>=.75**3-1e-9&&F.api.inspect().last?.voice===60,F.api.inspect().last);}
{const F=mk({voice:60});F.ev('room.enemies[0].hp=5000;room.enemies[1].hp=5000');for(let i=0;i<8;i++)F.tick(2,20);
 const f=F.api.factor();ok('fight would outlast narration: enemies take more damage (factor > 1, ≤ 2.5)',f>1&&f<=2.5,f);}
{const F=mk({voice:0});F.ev('room.enemies[0].hp=5000;room.enemies[1].hp=5000');F.tick(4,20);ok('narration finished, enemies left: finish faster (factor ≥ 1.6)',F.api.factor()>=1.6,F.api.factor());}
{const F=mk({voice:0});F.ev('room.enemies[0].hp=1e6;room.enemies[1].hp=1e6');for(let i=0;i<40;i++)F.tick(2,20);ok('clamped at 2.5',F.api.factor()<=2.5+1e-9);}
{const F=mk({voice:0});F.ev('room.enemies[0].hp=5000;room.enemies[1].hp=5000');F.tick(4,20);
 F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],10);ok('hitEnemy scales damage to current-phase targets',Math.abs(F.ev('__hits[0]')-10*F.api.factor())<1e-9);
 F.ev('__hits.length=0');F.sb.hitEnemy({hp:50},10);ok('…but not other enemies',F.ev('__hits[0]')===10);
 F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[2],10);ok('…nor the hidden boss during route phase',F.ev('__hits[0]')===10);
 F.st.on=false;F.tick(1);F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],10);ok('cinema turned off: factor back to 1, damage normal',F.api.factor()===1&&F.ev('__hits[0]')===10);}
{const F=mk({voice:0,prefs:{pace:false}});F.ev('room.enemies[0].hp=5000;room.enemies[1].hp=5000');F.tick(4,20);ok('pace:false pref: no change',F.api.factor()===1);}
{const F=mk({voice:0});F.ev('room.enemies[0].hp=5000;room.enemies[1].hp=5000');F.tick(4,20);F.st.phase='boss';F.ev("room.enemies[2].spawnState='active'");F.tick(.5);ok('phase change resets the factor for the new fight',F.api.factor()===1||F.api.inspect().phase==='boss');
 F.tick(4,20);F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],10);ok('boss phase: adds are not scaled, only boss/midboss',F.ev('__hits[0]')===10);}
// ③ 리젠(뱀서류)
{const F=mk({world:true,voice:60});F.tick(1);const sp=F.ev('room.enemies.filter(e=>e.r384Respawn)');
 ok('route: fewer than 5 mobs while voice remains → mobs respawn around the hero (≤3 at once)',sp.length===3&&F.api.inspect().spawned===3,sp.length);
 ok('…copies of this zone\'s mobs at 60% HP, unique ids, 6–9 tiles from the hero, active',sp.every(e=>e.profile.id==='m'&&Math.abs(e.hp-60)<1e-9&&e.spawnState==='active'&&!e.deadRecorded&&Math.hypot(e.x,e.y)>=6-1e-9&&Math.hypot(e.x,e.y)<=9+1e-9)&&new Set(sp.map(e=>e.id)).size===3);
 F.tick(5);ok('…keeps the field at 5 (not endless)',F.ev('room.enemies.filter(e=>e.hp>0&&!e.boss).length')===5);
 F.ev('room.enemies.forEach(e=>{if(!e.boss){e.hp=0;e.deadRecorded=true;}})');for(let i=0;i<40;i++){F.tick(1.5);F.ev('room.enemies.forEach(e=>{if(!e.boss){e.hp=0;e.deadRecorded=true;}})');}
 ok('…capped at 60 per fight stage',F.api.inspect().spawned===60);}
{const F=mk({world:true,voice:60});F.ev('killEnemy(room.enemies[0])');F.ev('__kill.length=0');F.sb.killEnemy(F.sb.room.enemies[1]);
 ok('killing the last mob with voice left: 2 replacements appear before the kill is processed (R78 does not end the route)',F.ev('__kill[0]')>=2&&F.api.inspect().stats.saves===1,F.ev('__kill'));}
{const F=mk({world:true,voice:2});F.tick(2);ok('voice under 3 s: no respawn (fight ends with the narration)',F.api.inspect().spawned===0);}
{const F=mk({world:true,voice:60,prefs:{respawn:false}});F.tick(2);ok('respawn:false pref: no respawn',F.api.inspect().spawned===0);}
{const F=mk({world:true,voice:60,cinema:false});F.tick(2);F.ev('__kill.length=0');F.sb.killEnemy(F.sb.room.enemies[0]);F.sb.killEnemy(F.sb.room.enemies[1]);ok('cinema off: no respawn',F.api.inspect().spawned===0&&F.ev('room.enemies.length')===3);}
{const F=mk({world:true,voice:60,phase:'boss'});F.ev("room.enemies[2].spawnState='active'");F.tick(2);ok('boss phase: no respawn',F.api.inspect().spawned===0);}
// ④ 보스전: 음성 끝 + 2.5초 쯤 마무리
function bossSim(voice0,hp,dps){const F=mk({phase:'boss',voiceClock:voice0});F.ev(`room.enemies.length=0;room.enemies.push({id:'boss',hp:${hp},maxHp:${hp},boss:true,spawnState:'active',profile:{id:'B'}})`);
 let deadAt=null;for(let i=0;i<20*(voice0+40);i++){F.step(.05);const b=F.sb.room.enemies[0];if(b.hp>0)F.sb.hitEnemy(b,dps*.05);if(b.hp<=0){deadAt=F.clock();break;}if(i%10===9)F.iv();}
 return {deadAt,voiceEnd:voice0,m:F.api.factor()};}
for(const [v,hp,dps,label] of [[30,1000,100,'boss would die in 10 s, voice 30 s'],[20,6000,100,'boss would need 60 s, voice 20 s'],[45,3000,100,'boss 30 s vs voice 45 s']]){
 const r=bossSim(v,hp,dps);ok('boss timing: '+label+' → dies ~2–3 s after the voice ends (allow 0.5–5 s)',r.deadAt!=null&&r.deadAt-r.voiceEnd>=.5&&r.deadAt-r.voiceEnd<=5,r);}
{const s={};const api={enabled:()=>true,state:(e)=>s[e.id]??=({nextAt:100})};const F=mk({phase:'boss',voice:60,s61:api});F.ev("room.enemies[2].spawnState='active';time=0");
 F.tick(1);F.sb.hitEnemy(F.sb.room.enemies[2],50);F.tick(1);F.sb.hitEnemy(F.sb.room.enemies[2],50);F.tick(1);
 ok('clone cooldown: fight running ahead of the narration → next summon pulled to ≤ 8 s',s.boss.nextAt<=F.clock()+8+1e-9&&F.api.inspect().stats.summonSooner>0,s.boss);
 F.st.voice=5;F.tick(.5);ok('clone cooldown: under 10 s of voice left → no new summon before the end',s.boss.nextAt>=F.clock()+5+2.5&&F.api.inspect().stats.summonHeld>0,s.boss);}
{const F=mk({phase:'boss',voice:4});F.ev("room.enemies[2].spawnState='active';room.enemies.push({id:'cl',hp:30,maxHp:30,r61Clone:true,r61Summoned:{kind:'clone'},spawnState:'active'})");F.tick(1);
 F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[3],10);ok('clone HP: in the last 6 s of voice clones take ×3 so they do not drag the ending',Math.abs(F.ev('__hits[0]')-30)<1e-9&&F.api.addFactor()>=3,F.ev('__hits[0]'));}
(async()=>{
// ⑤ R388 실화 마무리
{const F=mk({world:true,real:true,voice:60});F.tick(1);F.ev("room.enemies.push({id:'h',hp:100,maxHp:100,profile:{id:'m'},spawnState:'hidden',x:40,y:40})");
 F.st.voice=0;F.tick(2.5);const rows=F.ev("room.enemies.filter(e=>!e.boss&&e.hp>0)");
 ok('R388 real: route narration over → every remaining mob (hidden too) gathered 1.8–3.4 tiles around the hero at 1% HP',rows.length>=3&&rows.every(e=>e.hp<=e.maxHp*.01+1e-9&&e.spawnState!=='hidden'&&Math.hypot(e.x,e.y)>=1.8-1e-9&&Math.hypot(e.x,e.y)<=3.4+1e-9),rows.map(e=>[e.id,e.hp,+Math.hypot(e.x,e.y).toFixed(1)]));
 ok('…boss untouched, respawn stopped',F.ev("room.enemies[2].hp")===400&&F.ev("room.enemies.filter(e=>e.r384Respawn).length")===F.api.inspect().spawned);}
{const F=mk({world:true,real:false,voice:60});F.tick(1);F.st.voice=0;F.tick(1);ok('R388 not 실화 (cinema only): no gather / 1% (old pacing)',F.ev("room.enemies[0].hp")===100&&F.api.inspect().stats.gathered===0);}
{const F=mk({world:true,real:true,voice:0});F.ev('readScenes.add("p1");readScenes.add("p2")');F.tick(2);ok('R388: no pre narration played in this stage → no gather',F.api.inspect().stats.gathered===0);}
function bossR(o={}){const F=mk({world:true,real:true,voice:0,phase:'boss',...o});F.ev("room.enemies.length=0;room.enemies.push({id:'boss',hp:1000,maxHp:1000,boss:true,spawnState:'active',profile:{id:'B'}},{id:'cl',hp:60,maxHp:60,r61Clone:true,r61Summoned:{kind:'clone'},spawnState:'active'})");F.st.voice=40;F.tick(1);return F;}
{const F=bossR();ok('R388 boss: boss narration played when the boss is up',F.api.inspect().stats.post===1);
 F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],100);ok('before enrage: fast (×1.6)',F.api.inspect().bossMode==='fast'&&Math.abs(F.ev('__hits[0]')-160)<1e-9,F.ev('__hits'));
 F.sb.hitEnemy(F.sb.room.enemies[0],5000);ok('…but a huge hit cannot kill it while voice remains (floor 3%)',Math.abs(F.ev('room.enemies[0].hp')-30)<1e-6,F.ev('room.enemies[0].hp'));
 F.ev('room.enemies[0].r205Enraged={at:0}');F.tick(1);ok('after enrage (R205): 99% damage cancelled',F.api.inspect().bossMode==='hold'&&F.api.factor()===.01);
 F.ev('room.enemies[0].hp=200;__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],100);ok('…hit ×0.01',Math.abs(F.ev('__hits[0]')-1)<1e-9);
 F.ev('room.enemies[0].hp=31');F.sb.hitEnemy(F.sb.room.enemies[0],1e6);F.sb.killEnemy(F.sb.room.enemies[0]);ok('…cannot be killed while voice remains (hitEnemy floor + killEnemy refused)',F.ev('room.enemies[0].hp')>=30-1e-9&&!F.ev('room.enemies[0].deadRecorded')&&F.api.inspect().stats.blockedKills===1);
 F.st.voice=0;F.tick(2.5);ok('voice over → boss and clones set to 1% HP, normal damage',F.api.inspect().bossMode==='end'&&F.ev('room.enemies[0].hp')<=10+1e-9&&F.ev('room.enemies[1].hp')<=.6+1e-9&&F.api.factor()===1);
 F.ev('__hits.length=0');F.sb.hitEnemy(F.sb.room.enemies[0],50);ok('…next hit finishes it',F.ev('room.enemies[0].hp')<=0);}
{const F=bossR();F.st.voice=0;F.tick(1);ok('boss narration must run 2 s before the end can trigger',F.ev('room.enemies[0].hp')===1000||F.api.inspect().bossMode!=='end'||F.clock()>=2);}
{const F=bossR({real:false});F.tick(1);ok('not 실화: no boss hold / floor',F.api.inspect().bossMode===null);}
// ⑥ R390: 중간보스가 보스 단계의 주인인 지역(거미 동굴 보라검천사), 음성 틈 오판 방지
function midR(o={}){const F=mk({world:true,real:true,voice:0,phase:'boss',...o});F.ev("room.enemies.length=0;room.enemies.push({id:'mb',hp:1000,maxHp:1000,midboss:true,spawnState:'active',profile:{id:'V'}})");F.st.voice=40;F.tick(1);return F;}
{const F=midR();ok('R390 midboss-led boss stage: boss narration plays when the midboss is up',F.api.inspect().stats.post===1&&F.api.inspect().bossMode==='fast');
 F.sb.hitEnemy(F.sb.room.enemies[0],5000);ok('…midboss cannot be killed while voice remains (3% floor)',Math.abs(F.ev('room.enemies[0].hp')-30)<1e-6,F.ev('room.enemies[0].hp'));
 F.tick(1);ok('…midboss at ≤30% counts as enraged → 99% cancelled',F.api.inspect().bossMode==='hold'&&F.api.factor()===.01);
 F.sb.killEnemy(F.sb.room.enemies[0]);ok('…killEnemy refused while held',!F.ev('room.enemies[0].deadRecorded'));
 F.st.voice=0;F.tick(1);ok('R390 voice gap under 1.5 s is not "narration over"',F.api.inspect().bossMode==='hold'&&F.ev('room.enemies[0].hp')>=30-1e-6);
 F.st.voice=8;F.tick(1);F.st.voice=0;F.tick(1);ok('…gap resets when voice comes back',F.api.inspect().bossMode==='hold');
 F.tick(1.5);ok('…1.5 s of silence → midboss to 1%',F.api.inspect().bossMode==='end'&&F.ev('room.enemies[0].hp')<=10+1e-9);}
{const F=bossR();ok('R390 sync exposes full() for R370 while 실화 + finale on',F.api.full()===true);F.api.set({finale:false});ok('…off when finale pref off',F.api.full()===false);F.api.set({finale:true});}
{const F=bossR({real:false});ok('…off outside 실화',F.api.full()===false);}
// 지역 이동 잠금
{const F=bossR();F.st.voice=10;const p=F.sb.enterRegion('dist02','dist01',{});F.tick(2);ok('R388 travel lock: voice left → next region waits',F.ev('__went.length')===0&&F.api.inspect().locked&&F.api.inspect().stats.locks===1);
 F.st.voice=0;await new Promise(r=>setTimeout(r,700));ok('…then goes when the narration ends',F.ev('__went[0]')==='dist02'&&!F.api.inspect().locked);}
{const F=bossR();F.st.voice=10;F.sb.enterRegion('dist02','dist01',{restore:true});await new Promise(r=>setTimeout(r,50));ok('restore/load is never locked',F.ev('__went[0]')==='dist02');}
{const F=bossR({real:false});F.st.voice=10;F.sb.enterRegion('dist02','dist01',{});await new Promise(r=>setTimeout(r,50));ok('not 실화: not locked',F.ev('__went[0]')==='dist02');}
// ── R370 실물 + R384: remainingSecs 가 숫자로 넘어온다 ──
{let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};let su=null;const rates=[];
 const ss={getVoices:()=>[{name:'ko',lang:'ko-KR'}],speak(u){rates.push(u.rate);su=u;setT(()=>{if(su===u){su=null;u.onend&&u.onend();}},u.text.length/(7*u.rate)*1000);},cancel(){su=null;},pause(){},resume(){},addEventListener(){}};
 const el=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){}},querySelector:()=>({}),appendChild(){},setAttribute(){},isConnected:true});
 const ivs=[];const sb={localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;},performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},setInterval:f=>{ivs.push(f);},addEventListener(){},
  document:{hidden:false,getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null},toast(){},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise};
 sb.window=sb;sb.__STORYWORLD_PLAY_R169__={collect(){}};sb.__STORYWORLD_WORLD_COMBAT_R78__={controlled:()=>true,state:()=>({phase:'route'})};
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=false,guide=true,auto=true,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.8},readScenes=new Set(),
  room={id:'dist01',enemies:[{hp:100},{hp:100}]},regionById={dist01:{title:'x'}};
  function stopVoice(){}function advanceScene(){if(storyScene)readScenes.add(storyScene.key);storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;if(d)d();}}
  function playScenes(sc,done){storyQueue=sc.slice();storyDone=done||null;storyScene=null;advanceScene();}
  function nextScenes(def,part){return part==='pre'?[{key:'p1',text:'나는 오래된 문 앞에 섰다. 그 너머에서 무언가가 숨을 죽이고 있었다. 손끝이 차가웠다.'},{key:'p2',text:'이제 돌아갈 수 없다는 것을 알았다.'}]:[];}
  function hitEnemy(e,v){e.hp-=v;}async function enterRegion(){return true;}function showSettings(){}`,sb);
 vm.runInContext(CIN,sb);vm.runInContext(SRC,sb);const A=sb.__STORYWORLD_CINEMA_MODE_R370__,S=sb.__STORYWORLD_CINEMA_SYNC_R384__;A.set({on:true});
 const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
 for(let i=0;i<4;i++){run(.5);ivs.forEach(f=>f());}
 const rs=A.remainingSecs();ok('with real R370: pre story queued during the route phase and remainingSecs() is a positive number',S.inspect().stats.pre===1&&typeof rs==='number'&&rs>1,{rs,stats:S.inspect().stats,rates});
 for(let i=0;i<60;i++){run(.5);ivs.forEach(f=>f());}
 ok('every sentence spoken at the same rate',rates.length>=2&&rates.every(r=>Math.abs(r-rates[0])<1e-9),rates);
 ok('remainingSecs falls to ~0 when the queue is spoken',A.remainingSecs()<1,A.remainingSecs());}
let failed=0;for(const c of checks){if(!c.pass)failed++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));}
console.log(JSON.stringify({total:checks.length,failed}));if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
