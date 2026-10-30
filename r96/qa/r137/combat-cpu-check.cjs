// R137 CPU check: 몹·보스 규칙과 공명 방어(combat-r137.js). 환영은 중간보스급 이상, 중간보스 70%, 전투 중 영웅 쪽 보기,
// 속박은 뿌리 보스만·걸리면 이동 불가, 공명 방어로 상태이상 해제·체력 구슬 표시, 길잡이·반자동 7초마다 공명 방어, 블링크 얇은 벽 넘기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text'),REPO=path.join(ROOT,'..');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const code=fs.readFileSync(path.join(SRC,'combat-r137.js'),'utf8');
check('runtime copy matches client-source',code===fs.readFileSync(path.join(RT,'combat-r137.js'),'utf8'));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('loaded right before audio-r98.js and listed in the public verify script',/combat-r137\.js"><\/script><script src="\.\/audio-r98\.js">/.test(html)&&fs.readFileSync(path.join(REPO,'scripts','verify-r96-public.py'),'utf8').includes("'combat-r137.js'"));
// sandbox: rules
const enemies=[],calls=[];let guardOn=false;
const sb={console,Math,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Error,Promise,Symbol,localStorage:{getItem(){return null;},setItem(){}},document:{querySelector:()=>null,getElementById:()=>null,body:{contains:()=>false},createElement:()=>({style:{},querySelector:()=>({style:{},setAttribute(){}})})},getComputedStyle:()=>({position:'relative'}),requestAnimationFrame(){},
 started:true,loading:false,modal:null,time:10,zone:'dist00',regionById:{dist00:{safe:false}},keys:new Set(),joystickVector:{x:0,y:0},route:[],guide:true,auto:false,
 player:{x:0,y:0,hp:100,guard:false,direction:'front',shield:0,blinkCD:0},room:{enemies,engaged:true},
 tick(){},drawEnemy(e){calls.push(['draw',e.defScale,e.direction]);},hurt(v,s){calls.push(['hurt',s?.r58Affliction?.key,s?.r61Tag]);return 'hit';},moveActor(e,dx,dy){calls.push(['move']);e.x+=dx;e.y+=dy;return true;},
 guardStart(){sb.player.guard=true;guardOn=true;calls.push(['guardStart']);},guardEnd(){sb.player.guard=false;calls.push(['guardEnd']);},blink(){calls.push(['blink']);sb.player.blinkCD=4;},showSettings(){},
 blocked:(x,y)=>x>1&&x<2,findPath:()=>[{x:0,y:0}]};
sb.window=sb;sb.globalThis=sb;
const st=new WeakMap();
sb.__STORYWORLD_FIELDS_R61__={defs:{bind:{},frost:{},shock:{},poison:{}},state:e=>{if(!st.has(e))st.set(e,{next:5,step:0});return st.get(e);},statusRows:()=>sb.__r61rows||[],themeFor:()=>'bind'};
let r58cleared=0,r53cleared=0;sb.__STORYWORLD_REGIONAL_COMBAT_R58__={defs:{bind:{wound:'bind'},poison:{wound:'poison'},bleed:{wound:'bleed'}},statusRows:()=>[],affliction:()=>({key:'bind',wound:'bind'}),state:()=>({step:0}),clear(){r58cleared++;}};
sb.__STORYWORLD_HOSPITAL_WOUNDS_R53__={clear(){r53cleared++;}};
vm.createContext(sb);vm.runInContext(code,sb);const C=sb.__STORYWORLD_COMBAT_R137__;
const mob={id:'m',hp:10,x:3,y:0,defScale:2,direction:'right',name:'잡몹'},mid={id:'c',hp:10,x:-3,y:0,defScale:2,direction:'right',wardChampionR81:true,name:'중간보스 · 근위'},boss={id:'b',hp:10,x:5,y:5,defScale:2,boss:true,name:'뿌리의 문지기',nativeId:'dist00-boss'};
enemies.push(mob,mid,boss);
sb.tick(1/60);
check('ordinary mob never starts an R61 illusion/throw; midboss-class and bosses keep theirs',sb.__STORYWORLD_FIELDS_R61__.state(mob).next===Infinity&&sb.__STORYWORLD_FIELDS_R61__.state(mid).next===5&&sb.__STORYWORLD_FIELDS_R61__.state(boss).next===5);
calls.length=0;sb.drawEnemy(mid);sb.drawEnemy(boss);
check('midboss-class drawn at 70% (scale restored after), boss unchanged',Math.abs(calls[0][1]-1.4)<1e-9&&calls[1][1]===2&&mid.defScale===2);
calls.length=0;mob.direction='right';sb.drawEnemy(mob);
check('a mob in the fight is drawn facing the hero (hero to its screen-left) and its own direction is restored',calls[0][2]==='left'&&mob.direction==='right');
calls.length=0;sb.hurt(5,{owner:'m',vx:1,vy:0});sb.hurt(5,{owner:'b',vx:1,vy:0});
check('bind from an ordinary mob becomes another status; the root boss still binds',calls[0][1]==='poison'&&calls[0][2]&&calls[0][2]!=='bind'&&!calls[1][1]&&!calls[1][2],JSON.stringify(calls));
sb.__r61rows=[{key:'bind'}];calls.length=0;const ok=sb.moveActor(sb.player,1,0);sb.__r61rows=[];
check('while bound the hero cannot walk',ok===false&&!calls.some(c=>c[0]==='move'));
r58cleared=r53cleared=0;sb.player.storyStatus150={key:'slow'};sb.player.heroSlowUntil150=99;sb.player.guard=false;sb.guardStart();
check('resonance guard clears R53/R58/story statuses',r58cleared===1&&r53cleared===1&&sb.player.storyStatus150===null&&sb.player.heroSlowUntil150===0);
sb.guardEnd();calls.length=0;mob.x=3;sb.time=10;sb.tick(1/60);sb.time=17.1;sb.tick(1/60);const started=calls.some(c=>c[0]==='guardStart');sb.time=17.9;sb.tick(1/60);
check('guide/semi-auto: resonance guard every 7 s for 0.7 s in a fight',started&&calls.some(c=>c[0]==='guardEnd'),JSON.stringify(calls));
const q=C.overWall({x:0,y:0},{x:1,y:0},0);check('blink target past a thin wall lands on free floor beyond it',q&&q.x>2&&q.x<2.6,JSON.stringify(q));
check('thick walls (>1.3 tiles) are not crossed',(()=>{const b=sb.blocked;sb.blocked=(x)=>x>1&&x<3;const r=C.overWall({x:0,y:0},{x:1,y:0},0);sb.blocked=b;return r===null;})());
check('workflow runs this check',fs.readFileSync(path.join(REPO,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r137/combat-cpu-check.cjs'));
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r137 combat checks');process.exit(failed?1:0);
