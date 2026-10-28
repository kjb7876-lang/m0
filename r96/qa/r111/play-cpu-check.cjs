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
check('play-r111 loads after mobs-r109',html.indexOf('play-r111.js')>html.indexOf('mobs-r109.js')&&html.indexOf('mobs-r109.js')>0);
check('runtime copy matches client source',fs.readFileSync(path.join(RT,'play-r111.js'),'utf8')===read('play-r111.js'));
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
