// R767 CPU check (사용자 2026-11-11 "영웅을 적에게 옮기는 스킬은 순간적으로 분신이 적에게 간 다음 스킬 적중시키고 분신은 사라지는걸로,
//  슬레이어 r 상태면 블링크 쿨다운 7초간 없어지고, 모든 영웅 ego 상태에는 블링크 쿨다운 없애줘").
// ① 슬레이어 R 적혈 오라: 먼 적에게 영웅이 걸어가지 않고, 분신(ghost)이 적 자리에 나타나 한 번 베고 사라진다. 가까우면 제자리 기본 공격. 손 입력 중엔 아무것도 안 함.
// ② 슬레이어 오라 동안·모든 영웅 EGO 동안 S 블링크 재사용 대기 0.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
function slayerEnv(foes,opt={}){const hits=[],fxs=[],swings=[];
 const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Promise,Error,isFinite,localStorage:{getItem:()=>null,setItem(){}},time:5,room:{id:'rv',enemies:foes},
  player:{x:0,y:0,hero:'slayer',hp:100,specialCD:0,attackCD:0,blinkCD:0,direction:'e',storyWER:{ready:{}}},effects:[],settings:{},shake:0,started:true,modal:null,loading:false,keys:new Set(opt.keys||[]),joystickVector:{x:0,y:0},
  HEROES:{slayer:{range:1.6}}};
 env.window=env;env.actorHeight=()=>54;env.project=(x,y)=>({x:640+x*32,y:360+y*16});env.attackPower=()=>50;env.rank=()=>0;env.nearestEnemy=()=>foes[0];env.facing=(dx,dy)=>dx>=0?'right':'left';env.sound=()=>{};env.blocked=()=>false;
 env.readyImage=()=>null;env.ensureImages=()=>{};env.delay=(t,f)=>f();env.liveEnemies=()=>foes.filter(e=>e.hp>0);env.special=()=>{};env.tick=()=>{};env.drawEffect=()=>{};env.drawHero=()=>{};
 env.heroArt={slayer:{attack:{left:'a/left.webp',right:'a/right.webp',front:'a/front.webp'}}};
 env.fx=(type,x,y,o)=>{fxs.push({type,x,y,o});return null;};
 env.moveActor=(a,dx,dy)=>{a.x+=dx;a.y+=dy;};
 env.basicAttack=()=>{swings.push(env.time);env.player.attackCD=.48;};
 env.hitEnemy=(e,a,s)=>{hits.push({id:e.id,a,s});e.hp-=a;return true;};
 if(opt.clone){env.__cl=[];env.__STORYWORLD_CLONE_R767__={spawn:(x,y,o)=>{env.__cl.push({x,y,o});return true;}};}
 vm.createContext(env);vm.runInContext(C('slayer-blood-r425.js'),env);
 const S=env.__STORYWORLD_SLAYER_BLOOD_R425__;
 env.fx('storySourceSkill',0,0,{storyWER:true,sourceHero:'slayer',sourceSlot:'r',stage:'warning',castId:1});
 env.time+=1.0;hits.length=0;fxs.length=0;
 const run=(sec,dt=.05)=>{for(let t=0;t<sec;t+=dt){env.time+=dt;if(env.player.attackCD>0)env.player.attackCD=Math.max(0,env.player.attackCD-dt);env.tick(dt);}};
 return {env,S,hits,fxs,swings,run};}
const foe=(id,x,y)=>({id,name:'몹',x,y,hp:1e6,maxHp:1e6,spawnState:'active',radius:.3});
// ① 먼 적: 분신이 대신 간다
{const T=slayerEnv([foe('far',5,0)]);ok('setup: aura is on 1 s after R',T.S.auraOn()===true);T.run(1.2);
 const clone=T.hits.filter(h=>h.id==='far'&&h.s&&h.s.r425==='clone');
 ok('aura, far enemy (5 tiles): the hero does NOT walk to it (position unchanged)',T.env.player.x===0&&T.env.player.y===0,{x:T.env.player.x,y:T.env.player.y});
 ok('aura, far enemy: a clone strike hits it (r425 "clone", friendly hero damage)',clone.length>=1&&clone.every(h=>h.s.friendly===true&&h.s.owner==='hero'&&h.a>0),clone.slice(0,2));
 const g=T.fxs.filter(f=>f.type==='ghost');
 ok('aura, far enemy: the clone is a short ghost of the slayer attack pose (fallback without the shared drawer: engine ghost) drawn next to the enemy, then gone (life ≤ .4 s)',g.filter(f=>Math.hypot(f.x-5,f.y)<1.2).length>=1&&g.every(f=>f.o&&/a\//.test(f.o.asset||'')&&f.o.life>0&&f.o.life<=.4),g.slice(0,2));
 ok('aura, far enemy: clone strikes keep the basic-attack rhythm (≤ 1 per 0.45 s)',clone.length<=Math.ceil(1.2/.45)+1,{n:clone.length});}
// 공용 분신 그리기(R767 play-r113)가 있으면 그쪽으로: 적 앞 본체 + 영웅→적 잔상
{const T=slayerEnv([foe('far',5,0)],{clone:true});T.run(.6);const L=T.env.__cl;ok('with the shared clone drawer: a clone body is queued in front of the enemy plus a short trail from the hero, no engine ghosts',L.length>=3&&L.some(c=>Math.hypot(c.x-4.3,c.y)<.05&&c.o.life<=.4&&c.o.alpha>=.5)&&L.some(c=>c.x>.5&&c.x<4)&&!T.fxs.some(f=>f.type==='ghost'),L.slice(0,4));}
// 가까운 적: 제자리 기본 공격(이동 없음)
{const T=slayerEnv([foe('near',1,0)]);T.run(1);ok('aura, enemy in reach: basic attack in place, no clone, no move',T.swings.length>=1&&!T.hits.some(h=>h.s&&h.s.r425==='clone')&&T.env.player.x===0,{sw:T.swings.length});}
// 손 입력 중엔 아무것도 하지 않는다
{const T=slayerEnv([foe('far',5,0)],{keys:['ArrowLeft']});T.run(1);ok('aura with arrow key held: no clone strikes',!T.hits.some(h=>h.s&&h.s.r425==='clone'));}
// 9칸 밖·벽 뒤는 안 감
{const T=slayerEnv([foe('out',9.5,0)]);T.run(1);ok('aura: enemy beyond 9 tiles is left alone',T.hits.length===0);}
// 오라가 끝나면 멈춘다
{const T=slayerEnv([foe('far',5,0)]);T.run(7.5);const n=T.hits.filter(h=>h.s&&h.s.r425==='clone').length;T.run(1.5);ok('aura ends after 7 s: no more clone strikes',T.hits.filter(h=>h.s&&h.s.r425==='clone').length===n&&T.S.auraOn()===false,{n});}

// ② 블링크 재사용 대기 — play-r111 tick
function playEnv(hero){const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},
  document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),createElement:()=>({getContext:()=>null})},
  time:10,started:true,modal:false,loading:false,settings:{},zoom:1,target:null,player:{x:0,y:0,hp:50,hero,direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false,blinkCD:4},
  room:{enemies:[],props:[]},HEROES:{hwando:{range:1.5},slayer:{range:1.6},gunner:{range:8.2}},maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x,y}),facing:()=>'left',
  tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},hitEnemy(){return true;},hurt(){},fx(){}};
 sb.window=sb;vm.createContext(sb);vm.runInContext(C('play-r111.js'),sb);return sb;}
for(const h of ['hwando','gunner','slayer']){const sb=playEnv(h);sb.__STORYWORLD_EGO151__={inspect:()=>({state:{active:true}})};sb.tick(.016);ok('EGO active ('+h+'): blink cooldown is 0',sb.player.blinkCD===0,sb.player.blinkCD);}
{const sb=playEnv('hwando');sb.tick(.016);ok('no EGO, no aura: blink cooldown untouched',sb.player.blinkCD===4,sb.player.blinkCD);}
{const sb=playEnv('slayer');sb.__STORYWORLD_SLAYER_BLOOD_R425__={auraOn:()=>true};sb.tick(.016);ok('slayer blood aura: blink cooldown is 0',sb.player.blinkCD===0,sb.player.blinkCD);
 sb.__STORYWORLD_SLAYER_BLOOD_R425__={auraOn:()=>false};sb.player.blinkCD=4;sb.tick(.016);ok('slayer after the aura: blink cooldown is back to normal',sb.player.blinkCD===4,sb.player.blinkCD);}
{const sb=playEnv('slayer');sb.player.ego=1;sb.tick(.016);ok('EGO via player.ego>0 also clears blink cooldown',sb.player.blinkCD===0,sb.player.blinkCD);}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R767 clone & blink: ${pass}/${checks.length}`);if(pass!==checks.length)process.exitCode=1;
