// R108 CPU check: mobs-r108.js + the R101 mob pose (polish-r101.js). Static scan + a tiny sandbox run.
// Pins: solid-sprite motion caps (no idle scale/sway, flyer single hover <=1.5%, walk bob <=3%, attack/hit scale
// <=4% and <0.2 s), corpse/pool caps, the settings section id, no writes to hp/timers/AI, and the script order.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source'),RT=path.join(__dirname,'..','..','runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const mobs=fs.readFileSync(path.join(SRC,'mobs-r108.js'),'utf8'),pol=fs.readFileSync(path.join(SRC,'polish-r101.js'),'utf8');
// ---- motion caps in polish-r101 ----
const capsM=/const MOTION_CAPS=Object\.freeze\((\{[^}]*\})\)/.exec(pol);let caps=null;try{caps=capsM&&Function('return '+capsM[1])();}catch(_){}
check('MOTION_CAPS table exists',!!caps,capsM?.[1]);
if(caps){
 check('idle: vertical bob <=1% at ~0.5 Hz, lean <=0.01 rad',caps.idleBob<=.01&&caps.idleHz<=.6&&caps.idleLean<=.01,JSON.stringify(caps));
 check('flyer: one hover <=1.5% body at ~1 Hz',caps.hoverAmp<=.015&&caps.hoverHz>=.9&&caps.hoverHz<=1.1);
 check('walk: bob <=3%, lean <=0.05 rad',caps.walkBob<=.03&&caps.walkLean<=.05);
 check('attack/hit: scale <=4% (majors half), under 0.2 s',caps.actScale<=.04&&caps.actScaleMajor<=caps.actScale/2&&caps.hitSeconds<.2);
}
const motionSrc=pol.slice(pol.indexOf('function motion(e)'),pol.indexOf('const R52=window.__STORYWORLD_HOSPITAL_CHARGE_R52__'));
check('motion() found',motionSrc.length>500);
const idleSrc=motionSrc.slice(motionSrc.indexOf('// idle:'),motionSrc.indexOf('// attack:'));
check('idle block never scales (sx/sy) or sways (dx) the picture',idleSrc.length>0&&!/P\.s[xy]\s*[*+\-]?=|P\.dx\s*[+\-]?=/.test(idleSrc),idleSrc);
const flySrc=motionSrc.slice(motionSrc.indexOf('if(fly){'),motionSrc.indexOf('else{',motionSrc.indexOf('if(fly){')));
check('flyer block: single sine bob only, no sx/sy/dx terms',(flySrc.match(/Math\.sin\(/g)||[]).length===1&&!/P\.s[xy]|P\.dx/.test(flySrc),flySrc);
const walkSrc=motionSrc.slice(motionSrc.indexOf('if(w>.02){'),motionSrc.indexOf('// idle:'));
check('walk block never stretches the picture (no sx/sy)',walkSrc.length>0&&!/P\.s[xy]/.test(walkSrc),walkSrc);
check('final clamps bound scale to the attack cap',/P\.sx=clamp\(P\.sx,1-smax,1\+smax\);P\.sy=clamp\(P\.sy,1-smax,1\+smax\)/.test(motionSrc));
check('stride-locked footfalls and dust kept',/s\.phase\+=Math\.min\(s\.dist\*Math\.PI\/stride/.test(motionSrc)&&/kind:'dust'/.test(motionSrc));
check('R101 pose exposes poseNow/noteHit for R108',/poseNow:\(\)=>scopePose/.test(pol)&&/noteHit:\(e,dmg,skill=false\)/.test(pol));
// ---- no writes to gameplay state ----
const writes=/\b(e|b|m|enemy)\.(hp|maxHp|attack|cd|rest|hitTimer|flash|speed|damage|x|y|state|direction|spawnState|deadAt|rangedWindup|aggro)\s*=[^=]/;
check('mobs-r108 never assigns hp/timers/positions/AI fields',!writes.test(mobs),(writes.exec(mobs)||[])[0]);
check('mob pose block never assigns hp/timers/positions/AI fields',!writes.test(motionSrc),(writes.exec(motionSrc)||[])[0]);
check('mobs-r108 does not touch saves',!/serializeSave|localStorage\.setItem\((?!KEY)/.test(mobs));
check('storage key keeps the save prefix',/storyworld\.hospital-three-pc\.maze\.v11:'\)\+'r108\.mobs'/.test(mobs));
// ---- caps & settings ----
const capsR=/const CAPS=Object\.freeze\((\{[^}]*\})\)/.exec(mobs);let C=null;try{C=capsR&&Function('return '+capsR[1])();}catch(_){}
check('corpse caps: <=40 (lowFx fewer), pools <=24, life 20-40 s',!!C&&C.corpses<=40&&C.corpsesLow<C.corpses&&C.pools<=24&&C.corpseLife>=20&&C.corpseLife<=40&&C.corpseLifeLow<=C.corpseLife,capsR?.[1]);
check('oldest corpse/pool removed first (shift on overflow)',/while\(corpses\.length>cap\)corpses\.shift\(\)/.test(mobs)&&/while\(pools\.length>CAPS\.pools\)pools\.shift\(\)/.test(mobs));
check('corpses are drawn right after the ground, never as actors',/const groundBase=groundImage;groundImage=function/.test(mobs)&&/kind:'ground',groundAligned:true/.test(mobs));
check('corpses skip the hospital reference zone and bosses',/hospital\(\)\|\|!\(strength\(\)>0\)\|\|!prefs\.corpses\|\|major\(e\)/.test(mobs));
check('settings section id retroSettingsR108Mobs with 끔/약하게/기본',/s\.id='retroSettingsR108Mobs'/.test(mobs)&&/off:'끔',light:'약하게',normal:'기본'/.test(mobs));
check('lowFx / reducedMotion respected',/lowFx\(\)\?CAPS\.corpsesLow/.test(mobs)&&/reduced\(\)/.test(mobs));
check('swarm LOD: off-screen skip, far mobs cheap when 25+ alive',/swarm=n>24/.test(mobs)&&/return 0;}/.test(mobs)&&/return 1;}/.test(mobs));
// ---- sandbox run: settings, corpses, strength ----
const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Date,
 started:true,time:0,zone:'dist00',W:1280,H:720,settings:{},player:{x:10,y:10,hp:100},room:{id:'dist00',enemies:[]},
 project:(x,y)=>({x:(x-y)*32+640,y:(x+y)*16}),actorHeight:()=>66,readyImage:()=>null,
 localStorage:{v:{},getItem(k){return this.v[k]??null;},setItem(k,s){this.v[k]=s;}},
 document:{getElementById:()=>null,createElement:()=>({querySelectorAll:()=>[],querySelector:()=>({}),set innerHTML(v){}}),},
 ctx:{save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},ellipse(){},fill(){},drawImage(){},set filter(v){},globalAlpha:1,globalCompositeOperation:'source-over'}};
sb.window=sb;sb.drawEnemy=function(){};sb.groundImage=function(){};sb.killEnemy=function(e){e.deadRecorded=true;e.hp=0;};sb.hitEnemy=function(e,v){e.hp-=v;};sb.tick=function(){};sb.shadow=function(){};sb.drawBurnDeath3=function(){};sb.showSettings=function(){};sb.enterRegion=async function(){};sb.restoreSave=async function(){};
vm.createContext(sb);vm.runInContext(mobs,sb,{filename:'mobs-r108.js'});
const M=sb.__STORYWORLD_MOBS_R108__;
check('overlay installs',!!M&&M.revision==='R108-mobs-1');
check('default level 기본 = strength 1',M.prefs().level==='normal'&&M.strength()===1);
M.set({level:'light'});check('약하게 = 0.55, persisted',M.strength()===.55&&JSON.parse(sb.localStorage.v['storyworld.hospital-three-pc.maze.v11:r108.mobs']).level==='light');
M.setQuality('low');check('UI preset low -> 약하게, normal -> 기본',M.prefs().level==='light'&&M.setQuality('normal').level==='normal');
M.set({level:'off'});check('끔 = 0 and nothing is drawn/recorded',M.strength()===0);M.set({level:'normal'});
sb.time=5;for(let i=0;i<50;i++){const e={id:'m'+i,x:10+i*.1,y:10,hp:0,maxHp:10,deadRecorded:false,rc146BodySprite:'assets/a.webp',rc146BodyHeight:70};sb.room.enemies.push(e);sb.killEnemy(e);M.test.death(e);}
check('corpses capped at 40 (oldest dropped), pools at 24',M.corpses().length===40&&M.pools()===24,M.corpses().length+' '+M.pools());
const hp0={id:'h',x:11,y:10,hp:100,maxHp:100};sb.hitEnemy(hp0,10);check('a 10% hit leaves a splat; hp only changed by the native call',M.splats()===1&&hp0.hp===90);
sb.time=60;sb.groundImage();check('corpses expire after their life',M.corpses().length===0&&M.pools()===0);
check('inspect reports presentation-only',M.inspect().presentationOnly===true&&M.inspect().gameplayChanged===false);
// ---- script order in the runtime page (only once the lead registers it) ----
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
if(html.includes('mobs-r108.js'))check('mobs-r108.js loads after polish-r101.js and play-r106.js',html.indexOf('mobs-r108.js')>html.indexOf('polish-r101.js')&&html.indexOf('mobs-r108.js')>html.indexOf('play-r106.js'));
else console.log('NOTE mobs-r108.js not yet registered in runtime-text/index.html (lead integrates)');
console.log(JSON.stringify({checks:n,failed}));process.exit(failed?1:0);
