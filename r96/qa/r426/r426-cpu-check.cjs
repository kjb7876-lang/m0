// R426 — 길잡이 중 보이는 적은 끝까지 처리하고 이동(guide-clear-r426) + 결전의 날: 같은 서사 두 번(R370 rev 6 문장 중복 막기),
//  초천사 배신 시네마틱 '본 적 있음'이 기기 전체에 영구 저장돼 다시 안 나오던 문제(R317·R368: 새 게임마다 비움·영화 모드는 늘).
// CPU 에서 가짜 엔진에 붙여 본다. 실제 음성·자연 플레이·GPU·모바일은 미검증.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const GC=C('guide-clear-r426.js'),CIN=C('cinema-mode-r370.js'),R317=C('maps-palace-slum-r317.js'),R368=C('betrayal-video-r368.js'),html=RT('index.html');
ok('runtime copies match client-source',['guide-clear-r426.js','cinema-mode-r370.js','maps-palace-slum-r317.js','betrayal-video-r368.js'].every(f=>RT(f)===C(f)));
ok('index.html loads guide-clear-r426 once, right after aggro-chase-r390 (outside every guideStep wrapper)',html.split('"./guide-clear-r426.js"').length===2&&/aggro-chase-r390\.js"><\/script><script src="\.\/guide-clear-r426\.js"><\/script>/.test(html));
ok('public verify list, runtime inputs, Pages CPU step',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'guide-clear-r426.js',")&&JSON.parse(RT('../runtime-inputs.json')).textPaths.includes('guide-clear-r426.js')&&/node r96\/qa\/r426\/r426-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('no eval / new Function',!/\beval\s*\(|new Function/.test(GC));
// ── 길잡이: 적 고르기(순수 판단) ──
function gc(o={}){const sb={localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 if(o.chase)sb.__STORYWORLD_AGGRO_CHASE_R390__={engaged:e=>!!e.spotted};vm.createContext(sb);
 vm.runInContext(`var guide=true,modal=false,loading=false,time=0,command=null,target=null,route=[],player={x:0,y:0,hp:100},
  room={id:'z',engaged:false,enemies:[]},__base=0,__wall=new Set();
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clearLine(a,b){return !__wall.has(b.id);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function guideStep(dt){__base++;}`,sb);if(o.setup)vm.runInContext(o.setup,sb);vm.runInContext(GC,sb);
 return{sb,api:sb.__STORYWORLD_GUIDE_CLEAR_R426__,ev:s=>vm.runInContext(s,sb),step:(n=1,dt=.3)=>{for(let i=0;i<n;i++){vm.runInContext(`time+=${dt};guideStep(${dt})`,sb);}}};}
{const {api}=gc();const P=(rows,o)=>api.pick(rows,{x:0,y:0},o)?.enemy?.id??null;
 const A={id:'a',x:5,y:0,hp:9},B={id:'b',x:3,y:0,hp:9},Far={id:'f',x:14,y:0,hp:9},H={id:'h',x:1,y:0,hp:9,spawnState:'hidden'},D={id:'d',x:1,y:0,hp:9,deadRecorded:true};
 ok('nearest visible enemy within 10 tiles with a clear line is picked',P([A,B])==='b');
 ok('hidden / dead enemies are ignored',P([H,D])===null);
 ok('enemy behind a wall is not picked unless it spotted the hero',P([B],{los:()=>false})===null&&P([B],{los:()=>false,engaged:()=>true})==='b');
 ok('enemy 10–16 tiles away is picked only if it is chasing the hero (R390)',P([Far])===null&&P([Far],{engaged:()=>true})==='f'&&P([{...Far,x:20}],{engaged:()=>true})===null);
 ok('current focus is kept until it dies even if another one is nearer',P([A,B],{focusId:'a'})==='a'&&P([{...A,hp:0},B],{focusId:'a'})==='b');
 ok('banned (unreachable) enemy is skipped',P([A,B],{banned:new Set(['b'])})==='a');}
{const F=gc();F.ev("room.enemies.push({id:'m',x:6,y:0,hp:20})");F.step();
 ok('guide on + enemy in sight → attack order (command=target=enemy), route goal skipped',F.ev('command')==='m'&&F.ev('target')==='m'&&F.ev('__base')===0);
 F.ev("room.enemies[0].hp=0");F.step(2);ok('enemy dead → original guide moves again',F.ev('__base')>=1&&F.api.inspect().focus===null);}
{const F=gc();F.ev("room.enemies.push({id:'m',x:30,y:0,hp:20})");F.step(3);ok('no enemy in sight → original guide untouched',F.ev('__base')===3&&F.ev('command')===null);}
{const F=gc();F.ev("guide=false;room.enemies.push({id:'m',x:3,y:0,hp:20})");F.step();ok('guide off (manual play) → does nothing',F.ev('__base')===1&&F.ev('command')===null);}
{const F=gc({prefs:{on:false}});F.ev("room.enemies.push({id:'m',x:3,y:0,hp:20})");F.step();ok('pref off → does nothing',F.ev('__base')===1&&F.ev('command')===null);}
{const F=gc();F.ev("room.enemies.push({id:'b',x:20,y:0,hp:20,boss:true},{id:'m',x:4,y:0,hp:20})");F.step();ok('boss is left to the engine rule (only once the fight is engaged)',F.ev('command')==='m');}
{const F=gc();F.ev("room.enemies.push({id:'s',x:6,y:0,hp:20})");F.step();F.step(40,.25);// 10초 동안 다가가지도 깎지도 못함
 ok('stuck 8 s on one enemy (no approach, no damage) → rests it and the guide moves on',F.api.inspect().banned.includes('s')&&F.ev('__base')>0&&F.api.inspect().stats.gaveUp===1,F.api.inspect());}
{const F=gc();F.ev("room.enemies.push({id:'s',x:6,y:0,hp:20})");for(let i=0;i<40;i++){F.ev('room.enemies[0].hp-=.4');F.step(1,.25);}
 ok('enemy still being damaged is never given up',!F.api.inspect().banned.length&&F.ev('command')==='s');}
{const F=gc();F.ev("room.enemies.push({id:'m',x:6,y:0,hp:20})");F.step();F.ev("command=null;route=[{x:1,y:1}]");F.step();
 ok('R115 dodge step (command cleared, one-step route) is not overridden',F.ev('command')===null&&F.api.inspect().stats.yields===1);}
{const F=gc({chase:true});F.ev("__wall.add('c');room.enemies.push({id:'c',x:12,y:0,hp:20,spotted:true})");F.step();ok('enemy chasing the hero from behind a wall is engaged',F.ev('command')==='c');}
{const F=gc();F.ev("room.enemies.push({id:'m',x:6,y:0,hp:20})");F.step();F.ev("room={id:'z2',engaged:false,enemies:[]}");F.step();ok('room change clears focus',F.api.inspect().focus===null);}
// ── R441: 가는 길의 적만 잡고, 구석 몹은 두고 중앙 집결실로 ──
{const {api}=gc();
 ok('R441 laneDist: distance to the path polyline',Math.abs(api.laneDist({x:5,y:2},[{x:0,y:0},{x:10,y:0}])-2)<1e-9&&Math.abs(api.laneDist({x:13,y:4},[{x:0,y:0},{x:10,y:0}])-5)<1e-9);
 ok('R441 onPath: near the hero or within the lane of the path ahead',api.onPath({x:3,y:3},{x:0,y:0},4.2,null,{x:20,y:0})===true&&api.onPath({x:9,y:1},{x:0,y:0},9.1,[{x:20,y:0}],{x:20,y:0})===true&&api.onPath({x:6,y:8},{x:0,y:0},10,[{x:20,y:0}],{x:20,y:0})===false);}
const WARD=(phase)=>`var __phase='${phase}';window.__STORYWORLD_WORLD_COMBAT_R78__={controlled:()=>true,state:()=>({phase:__phase})};room.exploration={worldWardR81:{gatherAnchor:{x:20,y:0}}};
 var __paths=0;function findPath(a,b){__paths++;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));return Array.from({length:n},(_,i)=>({x:a.x+(b.x-a.x)*(i+1)/n,y:a.y+(b.y-a.y)*(i+1)/n}));}`;
{const F=gc({setup:WARD('route')});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:20},{id:'way',x:9,y:1,hp:20})");F.step();
 ok('R441 route phase: the enemy on the way to the gather room is fought',F.ev('command')==='way'&&F.ev('__base')===0);
 F.ev("room.enemies[1].hp=0");F.step(2);
 ok('R441 …the corner enemy is left alone and the guide walks to the gather room instead',F.ev('command')===null&&F.ev('route.length')>0&&F.ev('route[route.length-1].x')===20&&F.ev('__base')===0&&F.api.inspect().stats.toRally>=1&&F.api.inspect().stats.skippedOffPath>=1,F.api.inspect());
 F.ev("room.enemies[0].spotted=true");}
{const F=gc({chase:true,setup:WARD('route')});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:20,spotted:true})");F.step();
 ok('R441 an enemy that spotted the hero and chases it is still fought',F.ev('command')==='corner');}
{const F=gc({setup:WARD('route')});F.ev("player.x=17;room.enemies.push({id:'corner',x:-8,y:-9,hp:20})");F.step();
 ok('R441 at the gather room → the original guide takes over (rally trigger)',F.ev('__base')===1);}
{const F=gc({setup:WARD('rally')});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:20})");F.step();
 ok('R441 rally phase (survivors gathered) → every visible enemy is fought as before',F.ev('command')==='corner');}
{const F=gc({setup:WARD('route')});F.ev("room.engaged=true;room.enemies.push({id:'corner',x:6,y:8,hp:20})");F.step();
 ok('R441 engaged fight → unchanged',F.ev('command')==='corner');}
{const F=gc({prefs:{path:false},setup:WARD('route')});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:20})");F.step();
 ok('R441 pref path:false → old behaviour',F.ev('command')==='corner');}
{const F=gc({setup:"room.exploration={worldWardR81:{gatherAnchor:{x:20,y:0}}};"});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:20})");F.step();
 ok('R441 wave maps without the R78 ward (full clear is the real seal) → unchanged',F.ev('command')==='corner');}
{const F=gc({setup:WARD('route')});F.ev("room.enemies.push({id:'corner',x:6,y:8,hp:-1})");for(let i=0;i<8;i++)F.step();
 ok('R441 path is re-planned at most once a second (no findPath every turn)',F.ev('__paths')<=3,F.ev('__paths'));}
ok('R441 revision',/REV='R426-clear-2-R441'/.test(GC));
// ── R370 rev 6: 같은 문장 두 번 막기 ──
function cin(full){let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};let su=null;const spoken=[];
 const ss={getVoices:()=>[{name:'ko',lang:'ko-KR'}],speak(u){spoken.push(u.text);su=u;setT(()=>{if(su===u){su=null;u.onend&&u.onend();}},u.text.length/(7*u.rate)*1000);},cancel(){su=null;},pause(){},resume(){},addEventListener(){}};
 const el=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){}},querySelector:()=>({}),appendChild(){},setAttribute(){},isConnected:true});
 const ivs=[];const sb={localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;},performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},setInterval:f=>{ivs.push(f);},addEventListener(){},
  document:{hidden:false,getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null},toast(){},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise};
 sb.window=sb;sb.__STORYWORLD_PLAY_R169__={collect(){}};const flag={full};sb.__STORYWORLD_CINEMA_SYNC_R384__={full:()=>flag.full};
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=false,guide=true,auto=true,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.8},readScenes=new Set(),
  room={id:'dist01',enemies:[{hp:100}]},regionById={dist01:{title:'x'}};
  function stopVoice(){}function advanceScene(){if(storyScene)readScenes.add(storyScene.key);storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;if(d)d();}}
  function playScenes(sc,done){storyQueue=sc.slice();storyDone=done||null;storyScene=null;advanceScene();}
  async function enterRegion(){return true;}function showSettings(){}`,sb);
 vm.runInContext(CIN,sb);const A=sb.__STORYWORLD_CINEMA_MODE_R370__;A.set({on:true});
 const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
 const tick=s=>{for(let i=0;i<s*2;i++){run(.5);ivs.forEach(f=>f());}};
 // 지역 시간보다 훨씬 긴 서사(약 60문장)
 const long=Array.from({length:60},(_,i)=>`그날의 기억 ${i+1}번째 조각이 천천히 떠올랐다.`).join(' ');
 
 return{A,sb,spoken,tick,flag,ev:s=>vm.runInContext(s,sb)};}
{const F=cin(false);F.ev("playScenes([{key:'a',text:'초천사가 웃으며 권능을 펼쳤다. 그런데 사라진 것은 악마들이 아니었다.'}],()=>{})");
 F.ev("playScenes([{key:'a2',text:'초천사가 웃으며 권능을 펼쳤다. 그런데 사라진 것은 악마들이 아니었다. 수호자 가운데 남아 있는 것은 나 하나뿐이었다.'}],()=>{})");F.tick(120);
 const c=t=>F.spoken.filter(s=>s.includes(t)).length;
 ok('R370 rev 6: the same sentence arriving twice in one zone is spoken once',c('웃으며 권능을')===1&&c('악마들이 아니었다')===1&&c('나 하나뿐')===1&&F.A.inspect().stats?.dupes!==0,{spoken:F.spoken});
 F.ev("room={id:'dist02',enemies:[{hp:1}]}");F.ev("playScenes([{key:'a',text:'초천사가 웃으며 권능을 펼쳤다.'}],()=>{})");F.tick(30);
 ok('…a new zone may speak it again',c('웃으며 권능을')===2,{spoken:F.spoken});}
{const F=cin(false);F.ev("playScenes([{key:'STORY:dist00:post:0',text:'뿌리 아래에서 오래된 이름이 깨어났다. 나는 그 이름을 불렀다.'}],()=>{})");F.tick(20);
 F.ev("playScenes([{key:'STORY:dist00:post:0',text:'뿌리 아래에서 오래된 이름이 깨어났다.  나는 그 이름을 불렀다.'}],()=>{})");F.tick(40);
 ok('R370 rev 6: boss story played during the fight (R384 post) and again by the engine when the boss dies → spoken once',F.spoken.filter(s=>s.includes('오래된 이름')).length===1&&F.spoken.filter(s=>s.includes('이름을 불렀다')).length===1,{spoken:F.spoken});}
ok('R370 revision 6',/REV='R370-cinema-6'/.test(CIN));
// ── 초천사 배신 시네마틱 ──
ok('R317: seen no longer blocks in 영화 모드, and a new game clears it',/\(seen&&!cineOn\(\)\)/.test(R317)&&/newGame=function\(\.\.\.a\)\{seen=false;try\{localStorage\.removeItem\(KEY\)/.test(R317));
ok('R368: seen no longer blocks in 영화 모드, and a new game clears it',/\(prefs\.seen&&!cineOn\(\)\)/.test(R368)&&/newGame=function\(\.\.\.a\)\{if\(prefs\.seen\)\{prefs\.seen=false;save\(\);\}/.test(R368));
// ── 기본 메뉴 '영화 길잡이 모드' 단추 ──
{const els={};const mk=(id)=>{const e={id,children:[],listeners:{},textContent:'',isConnected:false,parent:null,nextElementSibling:null,
  addEventListener(k,f){this.listeners[k]=f;},insertAdjacentElement(_,b){b.isConnected=true;b.parent=this.parent;this.nextElementSibling=b;},appendChild(b){b.isConnected=true;b.parent=this;this.children.push(b);},querySelector(q){return q==='#menuClose'?els.menuClose:q==='.actions'?els.actions:null;}};if(id)els[id]=e;return e;};
 mk('panel');mk('menuClose');mk('actions');const g=mk('menuGuide');g.isConnected=true;let created=null;
 const doc={getElementById:id=>els[id]&&(els[id].isConnected||['panel','menuClose','menuGuide'].includes(id))?els[id]:(id==='menuCinemaR426'?created:null),createElement:()=>{created=mk(null);return created;}};
 let on=false,closed=0,toasts=[];const sb={document:doc,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 sb.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on}),set:p=>{on=p.on;return{on};}};vm.createContext(sb);
 vm.runInContext(`var guide=false,modal=false,loading=false,time=0,command=null,target=null,route=[],player={x:0,y:0,hp:100},room={enemies:[]};
  function guideStep(){}function liveEnemies(){return[];}function showMenu(){return 'menu';}`,sb);sb.closePanel=()=>closed++;sb.toast=t=>toasts.push(t);vm.runInContext(GC,sb);
 const r=sb.showMenu();const b=created;
 ok('menu: "영화 길잡이 모드 켜기" button is placed right after the 길잡이 button',r==='menu'&&b&&b.id==='menuCinemaR426'&&g.nextElementSibling===b&&b.textContent==='영화 길잡이 모드 켜기',b&&b.textContent);
 b.listeners.click();ok('…click turns cinema guide mode on, closes the menu and says so',on===true&&closed===1&&/켬/.test(toasts[0]||''));
 sb.showMenu();ok('…next time the menu shows "끄기" and reuses the same button',created===b&&b.textContent==='영화 길잡이 모드 끄기');
 b.listeners.click();ok('…and turns it off again',on===false&&closed===2);}
let failed=0;for(const c of checks){if(!c.pass)failed++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'').slice(0,600)));}
console.log(JSON.stringify({total:checks.length,failed}));if(failed)process.exitCode=1;
