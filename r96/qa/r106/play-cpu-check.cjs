// R106 CPU check: play-r106.js — enemy facing table (mirror single-view art toward the hero), Enter/1·2·3 on the
// difficulty dialog, D2 Survivors-style survival rules (life orbs, close-range push-back), and the hero veil in fx-sprites.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const listeners=[];let confirmed=0,selected=null,open=true;
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,
 started:true,loading:false,time:0,zone:'z',effects:[],settings:{},
 player:{x:10,y:10,hp:100,visible:true},room:{enemies:[],samongR103:{stage:'survival'}},
 project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),maxHP:()=>200,blocked:(x,y)=>x>30,floatText(){},
 document:{activeElement:null},
 addEventListener:(t,f,c)=>listeners.push({t,f,c}),
 __STORYWORLD_PROGRESSION_R71__:{difficultyState:()=>({open}),confirmDifficulty:()=>{confirmed++;return true;},selectDifficulty:t=>{selected=t;return true;}},
 __STORYWORLD_ENEMY_MOTION_R51__:{flip:()=>'native'}};
sb.window=sb;
sb.tick=function(){};sb.drawEffect=function(){return 'base';};sb.enterRegion=async function(){return true;};
sb.killEnemy=function(e){e.deadRecorded=true;e.hp=0;return true;};
vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(SRC,'play-r106.js'),'utf8'),sb,{filename:'play-r106.js'});
const P=sb.__STORYWORLD_PLAY_R106__,M=()=>sb.__STORYWORLD_ENEMY_MOTION_R51__;
check('overlay installs',!!P&&P.revision==='R106-play-1');
// facing
const mk=(p,x,y,o={})=>({path:p,x,y,hp:10,...o});
const L='assets/dist/cult_mage.png',R='assets/generated-v31224/actors-normalized/c386e08b76cf_ep1a_stabilization_supervisor.webp';
const eL=mk(L,8,12),eR=mk(L,12,8),rL=mk(R,8,12),front=mk('assets/u2/mdrone_idle.png',8,12);
check('left-facing art on the hero\'s left is mirrored to face right',M().flip(eL,{},false)===true);
check('left-facing art on the hero\'s right keeps its native side',M().flip(eR,{},false)===false);
check('right-facing art on the hero\'s left keeps its native side',M().flip(rL,{},false)===false);
check('front / unlisted art falls through to the earlier rules',M().flip(front,{},false)==='native');
check('special pose frames keep their own facing',M().flip(eL,{r52RangedPose:true},false)==='native'&&M().flip(eL,{r74Monster:'x'},false)==='native');
const boss=mk(L,8,12,{boss:true});const b0=M().flip(boss,{},false);boss.x=12;boss.y=8;sb.time=.1;const b1=M().flip(boss,{},false);sb.time=.5;const b2=M().flip(boss,{},false);
check('bosses turn after a short hold (no twitch)',b0===true&&b1===true&&b2===false,[b0,b1,b2].join());
check('every table entry is L or R and points at an assets/ path',Object.entries(P.face).every(([k,v])=>k.startsWith('assets/')&&(v==='L'||v==='R'))&&Object.keys(P.face).length>=10);
// difficulty keys
const kd=listeners.find(l=>l.t==='keydown'&&l.c===true);
const ev=(key,o={})=>({key,repeat:false,preventDefault(){},stopPropagation(){},...o});
sb.document.activeElement={tagName:'BUTTON',id:'r71DifficultyNormal',dataset:{r71Tier:'normal'}};
kd.f(ev('3'));kd.f(ev('Enter'));
check('1/2/3 selects a tier and Enter confirms from a focused tier card',selected==='hard'&&confirmed===1,selected+' '+confirmed);
sb.document.activeElement={tagName:'BUTTON',id:'r71DifficultyCancel',dataset:{}};kd.f(ev('Enter'));
check('Enter on the cancel button is left to the button',confirmed===1);
sb.document.activeElement=null;kd.f(ev('Enter',{repeat:true}));open=false;kd.f(ev('Enter'));
check('held Enter and a closed dialog do nothing',confirmed===1);
// survival rules
const elites=[];for(let i=0;i<60;i++){const e=mk('m.webp',11+(i%3)*.5,11.2,{samongElite:true,samongSurvival:true});sb.room.enemies.push(e);sb.killEnemy(e);elites.push(e);}
const dropped=P.inspect().orbsDropped;
check('elite kills in survival drop life orbs (~35%)',dropped>=10&&dropped<=35,dropped);
for(let i=0;i<120;i++)sb.tick(.05);
const ins=P.inspect();
check('orbs within 3 tiles fly to the hero and heal 6% of max HP each',ins.orbsTaken>=1&&sb.player.hp<=200&&ins.healed>0&&Math.abs(ins.healed-Math.min(200-100,ins.orbsTaken*12))<1e-6,JSON.stringify(ins));
const before=P.inspect().orbsDropped;sb.room.samongR103.stage='maze';for(let i=0;i<20;i++){const e=mk('m.webp',11,11,{samongElite:true});sb.killEnemy(e);}
check('no orbs outside the survival stage',P.inspect().orbsDropped===before);
sb.room.samongR103.stage='survival';sb.room.enemies.length=0;
const near=mk('m.webp',11.5,10,{hp:50}),far=mk('m.webp',15,10,{hp:50}),el=mk('m.webp',10,11.5,{hp:50,samongElite:true});sb.room.enemies.push(near,far,el);
sb.tick(.016);near.hp=40;far.hp=40;el.hp=40;sb.tick(.016);
check('a struck mob within 2.6 tiles is pushed 0.22 tiles away; far mobs and elites stay',Math.abs(near.x-11.72)<1e-9&&far.x===15&&el.y===11.5,[near.x,far.x,el.y].join());
const wall=mk('m.webp',10,10.5,{hp:50});sb.player.x=29.5;sb.player.y=10.5;wall.x=29.9;sb.room.enemies=[wall];sb.tick(.016);wall.hp=1;sb.tick(.016);
check('push-back never moves a mob into a blocked cell',wall.x===29.9);
// hero veil (fx-sprites)
const fx=fs.readFileSync(path.join(SRC,'fx-sprites-r106.js'),'utf8');
check('fx sprites fade by the share of the hero body they cover (≤62%, opt-out for pickups)',/function heroVeil\(/.test(fx)&&/Math\.min\(\.62,/.test(fx)&&/alpha\*veil/.test(fx)&&/o\.overHero\?1:/.test(fx));
check('play-r106 is loaded by the runtime page',fs.readFileSync(path.join(__dirname,'..','..','runtime-text','index.html'),'utf8').includes('<script src="./play-r106.js"></script>'));
console.log(JSON.stringify({checks:n,failed}));process.exit(failed?1:0);
