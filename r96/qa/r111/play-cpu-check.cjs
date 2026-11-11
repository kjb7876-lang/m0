// R111 CPU check (user 2026-10-28 00:12–01:28): hero faces the foe while kiting, resonance shown out of 777, D-key guard
// (−77% damage, 7%/s heal), samong storm lines take 77% of a normal mob's current HP (bosses keep native damage),
// ranged heroes get range + escape instead of dash, 7-tier effect tables, boss telegraph spots, enemy attack-cell facing table.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const read=f=>fs.readFileSync(path.join(SRC,f),'utf8');

// ---- play-r111 in a small sandbox -------------------------------------------------------------
const hits=[],hurts=[],effects=[];
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,
 localStorage:{getItem:()=>null,setItem(){}},NodeFilter:{SHOW_TEXT:4},
 document:{getElementById:()=>null,querySelector:()=>null,createTreeWalker:()=>({nextNode:()=>null}),createElement:()=>({getContext:()=>null})},
 time:10,started:true,modal:false,loading:false,settings:{},zoom:1,target:null,
 player:{x:0,y:0,hp:50,hero:'hwando',direction:'front',resonance:0,attackAnim:0,skillAnim:0,moving:false},
 room:{enemies:[],props:[]},
 HEROES:{hwando:{range:1.5},seoha:{range:8.1},michaela:{range:7},hunter:{range:8.3},gunner:{range:8.2}},
 maxHP:()=>100,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*34,y:(x+y)*17}),facing:(dx,dy)=>dx-dy>0?'right':'left',
 tick(dt){sb.time+=dt;},drawHero(){},drawEffect(){},drawProjectile(){},
 hitEnemy(e,value,source){hits.push({e,value,source});e.hp-=value;return true;},hurt(d){hurts.push(d);sb.player.hp-=d;},
 fx(type,x,y,o){effects.push({type,x,y,...o});}};
sb.window=sb;
sb.__STORYWORLD_WER__={defs:{seoha:{e:['E','x','dash']},hunter:{e:['E','x','dash']},gunner:{e:['E','x','dash']},michaela:{e:['E','x','escape']},hwando:{e:['E','x','dash']}}};
let samongActive=true;sb.__STORYWORLD_SAMONG_R75__={active:()=>samongActive};
vm.createContext(sb);vm.runInContext(read('play-r111.js'),sb,{filename:'play-r111.js'});
const P=sb.__STORYWORLD_PLAY_R111__;
check('overlay installs',P?.revision==='R111-play-1',P&&JSON.stringify(P.inspect().lastError));
check('resonance shows 0..777',P.resonance.max===777&&P.resonance.shown(100)===777&&P.resonance.shown(30)===233);
// ranged heroes: range up and E becomes escape (first tick applies)
sb.tick(.016);
check('ranged heroes reach further, melee unchanged',sb.HEROES.seoha.range>8.1&&sb.HEROES.hunter.range>8.3&&sb.HEROES.gunner.range>8.2&&sb.HEROES.michaela.range>7&&sb.HEROES.hwando.range===1.5);
check('ranged E is escape, not dash',['seoha','hunter','gunner','michaela'].every(h=>sb.__STORYWORLD_WER__.defs[h].e[2]==='escape')&&sb.__STORYWORLD_WER__.defs.hwando.e[2]==='dash');
// facing while kiting: an attack then moving away keeps facing the foe
const foe={id:'m1',x:-2,y:2,hp:10,spawnState:'active'};sb.room.enemies=[foe];sb.target='m1';
sb.player.attackAnim=.2;sb.tick(.016);sb.player.attackAnim=0;sb.player.moving=true;sb.player.direction='right';sb.tick(.1);
check('kiting hero faces the foe after an attack',sb.player.direction==='left'&&P.inspect().faceFoe==='m1',sb.player.direction);
sb.time+=1;sb.player.direction='right';sb.tick(.016);
check('facing hold ends .55 s after the last attack',sb.player.direction==='right');
// guard: −77% damage and 7%/s heal while D is held
sb.player.guard=true;sb.player.hp=50;hurts.length=0;sb.hurt(100);
check('guard takes 23% of the damage (native 40% replaced)',Math.abs(hurts[0]-57.5)<1e-9,hurts[0]);
sb.player.hp=50;sb.tick(1);
check('guard heals 7% of max HP per second',Math.abs(sb.player.hp-57)<1e-6,sb.player.hp);
sb.player.guard=false;
// samong storm: 77% of a normal mob's current HP; bosses keep the native value
const mob={id:'n',hp:1000,x:1,y:1},boss={id:'b',hp:1000,x:1,y:1,boss:true};
sb.player.hp=50;sb.tick(.016);
hits.length=0;sb.hitEnemy(mob,5,{kind:'hero-samong-storm-r75'});sb.hitEnemy(boss,5,{kind:'hero-samong-storm-r75'});sb.hitEnemy(mob,5,{kind:'basic'});
check('storm line takes 77% of a normal mob\'s current HP',Math.abs(hits[0].value-770)<1e-9,hits[0].value);
check('bosses and other hits keep their native damage',hits[1].value===5&&hits[2].value===5);
check('storm hit leaves a hero-colour cut effect',effects.some(e=>e.type==='r111SamongCut'));
const st=P.inspect();check('no runtime errors',st.stats.errors===0,st.lastError);

// ---- static: 7 tiers, telegraph spots, facing table, load order -----------------------------
const d2s=read('fx-d2s-r106.js');
const m=/per=\[([^\]]+)\][^;]*targets=\[([^\]]+)\]/.exec(d2s);
const per=m?m[1].split(',').map(Number):[],tg=m?m[2].split(',').map(Number):[];
check('hwando iai has 8 entries (tier 0..7), tier 0 is a single cut on one foe',per.length===8&&tg.length===8&&per[0]===1&&tg[0]===1);
check('iai grows to many cuts on many foes at tier 7',per[7]>=7&&tg[7]>=7);
const pol=read('polish-r101.js');
check('aura heat table has 8 tiers',/HEAT_BASE=\[(?:[^,\]]+,){7}[^,\]]+\]/.test(pol));
check('aura form table has 8 tiers',/FORM7=\[(?:[^,\]]*,){7}[^\]]*\]/.test(pol));
const vfx=read('vfx-r98.js');check('boss line/rect telegraphs are filled by several spots',/function spots\(/.test(vfx)&&/lagged\(/.test(vfx));
const mobs=read('mobs-r109.js');const keys=(mobs.match(/'assets\/rc137\/mob-attacks-0\d\.png#\d+,\d+':'[LR]'/g)||[]);
check('enemy attack-cell facing table covers the surveyed rc137 cells',keys.length>=80,keys.length);
check('skeleton M001 attack cell is marked as art facing left',keys.includes("'assets/rc137/mob-attacks-01.png#0,0':'R'"));
check('tree guard M004 cell keeps the R110 setting',keys.includes("'assets/rc137/mob-attacks-01.png#940,0':'L'"));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');

// ---- R766(사용자 2026-11-11 "자동회피는 이동해서 회피가 아니라 확률적으로 적공격이 빗나가게"): 원거리 영웅 자동 회피 = 확률 빗나감, 몸은 안 옮긴다
{const R0=Math.random,setR=v=>{Math.random=()=>v;},hp0=()=>{sb.player.hp=100;hurts.length=0;effects.length=0;};
 sb.player.guard=false;sb.player.hero='gunner';sb.player.x=0;sb.player.y=0;sb.player.invincible=0;sb.player.dashAnim=0;
 const src={type:'enemy-attack',owner:'m1'};
 try{
  // R767c(CI full-frame-render-replay 13% 깜빡 실패): 빗나감은 워크3식 의사난수(PRD) — 직전 빗나감(또는 영웅 바뀜) 뒤 첫 공격은 반드시 맞고, 맞을 때마다 확률이 C씩 오른다
  hp0();setR(0);sb.hurt(30,src);check('R767c PRD: the first hit after start/hero change lands even on the luckiest roll',hurts.length===1&&hurts[0]===30,hurts);
  hp0();setR(0);const r=sb.hurt(30,src);
  check('R766 ranged hero: a lucky roll makes the enemy hit miss (no damage, "회피" text)',hurts.length===0&&sb.player.hp===100&&effects.some(e=>e.type==='text'&&/회피/.test(e.text||'')),{hurts,r});
  check('R766 a miss does not move the hero or grant i-frames',sb.player.x===0&&sb.player.y===0&&!(sb.player.invincible>0)&&!(sb.player.dashAnim>0));
  hp0();setR(0);sb.hurt(30,src);check('R767c PRD: never two misses in a row (the hit right after a miss lands)',hurts.length===1&&hurts[0]===30,hurts);
  hp0();setR(.99);sb.hurt(30,src);check('R766 an unlucky roll still hurts (full damage)',hurts.length===1&&hurts[0]===30,hurts);
  hp0();sb.player.hero='hwando';setR(0);sb.hurt(30,src);check('R766 melee heroes never get the miss chance',hurts.length===1,hurts);sb.player.hero='gunner';
  hp0();setR(0);sb.hurt(30,{type:'r330-status',status:'burn',r330:true});check('R766 status/hazard ticks (r330 status) are not dodged',hurts.length===1,hurts);
  hp0();setR(0);sb.hurt(0,src);check('R766 zero damage passes through untouched',hurts.length===1&&hurts[0]===0,hurts);
  sb.player.hero='gunner';hp0();setR(.99);sb.hurt(1,src);hp0();setR(0);sb.hurt(30,{type:'r330-status',status:'burn',r330:true});check('R767c status ticks are not dodged even with a primed counter',hurts.length===1,hurts);
  Math.random=R0;const rate=h=>{sb.player.hero=h;let miss=0,two=0,last=false;for(let i=0;i<20000;i++){sb.player.hp=100;const n=hurts.length;sb.hurt(1,src);const m=hurts.length===n;if(m){miss++;if(last)two++;}last=m;}twos+=two;return miss/20000;};let twos=0;
  const rg=rate('gunner'),rh=rate('hunter'),rs=rate('seoha'),rm=rate('michaela');
  check('R766 miss rates ≈ 20/17/15/13% (gunner>hunter>seoha>michaela, each within ±3%) '+JSON.stringify({rg,rh,rs,rm}),Math.abs(rg-.20)<.03&&Math.abs(rh-.17)<.03&&Math.abs(rs-.15)<.03&&Math.abs(rm-.13)<.03);
  check('R767c PRD: no back-to-back misses over 80k hits',twos===0,{twos});
  // 옛 이동 회피가 남아 있지 않다: 공격 예고 안에 서 있어도 몸이 밀리지 않는다
  sb.player.hero='gunner';sb.player.x=0;sb.player.y=0;sb.time+=30;const atk={id:'a1',x:1,y:0,hp:10,spawnState:'active',attack:{elapsed:.3,castWindup150:.4,committed:false}};sb.room.enemies=[atk];sb.tick(.016);
  check('R766 no more move-dodge: hero standing in a telegraph is not pushed',sb.player.x===0&&sb.player.y===0,{x:sb.player.x,y:sb.player.y});
  sb.room.enemies=[];
  const coop=sb.__STORYWORLD_COOP_SIM_R62__;sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};hp0();setR(0);sb.hurt(30,src);check('R766 co-op: no miss chance (host rules)',hurts.length===1,hurts);sb.__STORYWORLD_COOP_SIM_R62__=coop;
 }finally{Math.random=R0;sb.player.hero='hwando';}}
check('play-r111 loads after mobs-r109',html.indexOf('play-r111.js')>html.indexOf('mobs-r109.js')&&html.indexOf('mobs-r109.js')>0);
check('runtime copy matches client source',fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===read('play-r111.js'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
