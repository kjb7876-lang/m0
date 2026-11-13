// R967 CPU check — EGO 각성·사몽 각성 중 모든 스킬 재사용 대기 감소(사용자 2026-11-13 "ego 각성는 모든 스킬쿨타임 줄여주고 사몽각성은 그거보다 더줄여주게").
//  규칙: EGO 중 새로 거는 대기 ×0.77(−23%), EGO 진입 순간 돌고 있던 대기 ×0.77. 사몽 중 새로 거는 대기 ×0.23(−77%, R571 그대로), 사몽 진입 순간 돌던 대기 ×0.60(−40%).
//  EGO 자기 대기(egoCD)·사몽 자기 대기(samongCD)·기본 공격 간격·600초 넘는 막힘은 그대로. 각성이 끝나면 새로 거는 대기는 원래 값.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=path.join(R,'client-source');
const results=[];const check=(name,ok,detail='')=>results.push({name,ok:!!ok,detail});
const near=(a,b,e=2e-3)=>Math.abs(a-b)<=e;
const FILE='samong-surge-r571.js';
const F=1/60;
function stage(opt={}){
 const store=Object.assign({},opt.store||{});
 const ops=[];
 const ctx=new Proxy({scope:null,filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'',strokeStyle:'',lineWidth:1,lineCap:'butt'},{
  get(t,k){if(k in t&&typeof t[k]!=='function')return t[k];if(k==='scope')return undefined;return (...a)=>{ops.push(String(k));if(k==='save'||k==='restore'||k==='beginPath'||k==='closePath')return;};},
  set(t,k,v){t[k]=v;if(k==='filter')ops.push('filter:'+v);if(k==='fillStyle'||k==='strokeStyle')ops.push('colour:'+v);return true;}});
 const sb={console,JSON,Date,Set,Map,WeakMap,Object,Array,Number,String,Boolean,Symbol,Error,TypeError,Proxy,Reflect,isFinite,
  performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}},hidden:false},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  StoryArtR74:{atlases:{materials:{path:'a',styles:{}}}}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  var started=true,modal=false,loading=false,layer='DREAM',zone='z1',time=100,zoom=1,W=1280,H=720,settings={lowFx:false};
  var room={enemies:[]};var e568HeroActionContext=null;var ctx=null;var delayed=[];var projectiles=[];var fxLog=[];var hits=[];var moved=[];
  var player={hero:'hwando',x:10,y:10,hp:100,ego:0,egoCount:0,samong:0,samongCD:0,specialCD:0,blinkCD:0,egoCD:0,attackCD:0,storyWER:{ready:{},buffs:{}}};
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function project(x,y){return{x:(x-y)*64+W/2,y:(x+y)*32+H*.52};}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}
  function hitEnemy(e,v,s){hits.push({id:e.id,v,d:Math.hypot(e.x-player.x,e.y-player.y)});e.hp-=v;return true;}
  function moveActor(a,dx,dy){moved.push(Math.hypot(dx,dy));a.x+=dx;a.y+=dy;}
  function clearLine(a,b){return Math.hypot(a.x-b.x,a.y-b.y)>=0;}
  function blocked(x,y,r){return false;}
  function fx(type,x,y,opt={}){fxLog.push({type,size:opt.size});}
  function makeShot(x,y,a,speed,damage,opt={}){const p={x,y,speed,damage,radius:.14,life:7,scale:1,...opt};projectiles.push(p);return p;}
  function blast(x,y,radius,damage){fx('sigil',x,y,{size:radius});for(const e of liveEnemies())if(distance(e,{x,y})<=radius+(e.radius||0))hitEnemy(e,damage);}
  function delay(seconds,fn,owner=null){delayed.push({at:time+seconds,fn,owner});}
  function runDelayed(){const due=delayed.splice(0);for(const d of due)d.fn();}
  function special(){if(player.specialCD>0)return;player.specialCD=10;blast(player.x,player.y,4,10);makeShot(player.x,player.y,0,20,5,{friendly:true,owner:'hero',life:.8});delay(.1,()=>{fx('slash',player.x,player.y,{size:4.2});},'hero');}
  function blink(){if(player.blinkCD>0)return;player.blinkCD=4;}
  function ego(){if(player.hp<=0||player.egoCD>0||player.ego>0||player.samong>0)return;player.ego=3;player.egoCD=6;player.egoCount=Math.min(7,(player.egoCount||0)+1);if(player.egoCount===7)awaken('seven');}
  function basicAttack(){player.attackCD=.5;}
  function awaken(reason){if(player.samong>0||reason!=='story'&&player.samongCD>0)return false;player.samong=7;player.samongCD=77;player.ego=0;player.egoCount=0;return true;}
  function tick(dt){time+=dt;for(const k of ['attackCD','specialCD','blinkCD','egoCD','ego','samong','samongCD'])player[k]=Math.max(0,player[k]-dt);}
  function drawHero(){ops_hero++;}var ops_hero=0;
  function werCast(slot){player.storyWER.ready[player.hero+':'+slot]=time+5;}
  function serializeSave(){return JSON.parse(JSON.stringify({player}));}
 `,sb);
 sb.ctx=ctx;vm.runInContext('ctx=window.ctx',sb);
 if(opt.growth!==false)vm.runInContext(fs.readFileSync(path.join(SRC,'growth-r103.js'),'utf8'),sb,{filename:'growth-r103.js'});
 vm.runInContext(fs.readFileSync(path.join(SRC,FILE),'utf8'),sb,{filename:FILE});
 return {sb,ops,run:c=>vm.runInContext(c,sb)};
}


let S;try{S=stage();}catch(e){check('module loads',false,String(e&&e.stack||e).split('\n').slice(0,3).join(' | '));}
if(S){const {run,sb}=S;const A=sb.__STORYWORLD_SAMONG_SURGE_R571__;const fresh='player.ego=0;player.egoCD=0;player.egoCount=0;player.samong=0;player.samongCD=0;player.specialCD=0;player.blinkCD=0;player.storyWER.ready={};tick(F)';
 run('var F='+F);
 check('API: rules.egoCooldown .77, rules.egoEntry .77, rules.samongEntry .60, samong cooldown .23 kept',A&&near(A.rules.egoCooldown,.77,1e-9)&&near(A.rules.egoEntry,.77,1e-9)&&near(A.rules.samongEntry,.6,1e-9)&&near(A.rules.cooldown,.23,1e-9),A&&JSON.stringify(A.rules));
 check('API: egoActive() and cdFactor() exist',A&&typeof A.egoActive==='function'&&typeof A.cdFactor==='function');
 // ---- EGO: 새로 거는 대기 ----
 run(fresh+';ego();tick(F)');check('EGO starts (ego 3, egoCD 6)',run('player.ego')>2.9&&A.egoActive&&A.egoActive?.()===true);
 check('EGO own cooldown (egoCD 6) is not reduced by EGO',near(run('player.egoCD'),6-F),run('player.egoCD'));
 run('special();tick(F)');check('EGO: Q cooldown 10 → 7.7',near(run('player.specialCD'),7.7-F),run('player.specialCD'));
 run('blink();tick(F)');check('EGO: blink 4 → 3.08',near(run('player.blinkCD'),3.08-F),run('player.blinkCD'));
 run('werCast("w");tick(F)');check('EGO: W/E/R deadline 5 → 3.85',near(run('player.storyWER.ready["hwando:w"]-time'),3.85-F),run('player.storyWER.ready["hwando:w"]-time'));
 run('basicAttack();tick(F)');check('EGO: basic attack interval untouched',near(run('player.attackCD'),.5-F,1e-6));
 run('player.storyWER.ready["hwando:e"]=time+1e6;tick(F)');check('EGO: far "blocked" deadline untouched',run('player.storyWER.ready["hwando:e"]-time')>9e5);
 check('EGO: cdFactor() .77 during EGO',near(A.cdFactor?.(),.77,1e-9));
 check('EGO: R571 cd() API stays 사몽-only (other modules add their own deadlines through it)',A.cd(10)===10);
 // ---- EGO 진입: 돌던 대기 ----
 run(fresh+';player.specialCD=8;player.blinkCD=2;player.storyWER.ready["hwando:r"]=time+4;player.samongCD=50;tick(F)');
 run('ego();tick(F)');
 check('EGO entry: running Q 8 → ×.77',near(run('player.specialCD'),(8-F)*.77-F),run('player.specialCD'));
 check('EGO entry: running blink 2 → ×.77',near(run('player.blinkCD'),(2-F)*.77-F),run('player.blinkCD'));
 check('EGO entry: running W/E/R deadline 4 → ×.77',near(run('player.storyWER.ready["hwando:r"]-time'),(4-F)*.77-F),run('player.storyWER.ready["hwando:r"]-time'));
 check('EGO entry: 사몽 own cooldown (samongCD) untouched',near(run('player.samongCD'),50-2*F),run('player.samongCD'));
 run('var q=player.specialCD;player.ego=3;tick(F)');check('EGO refresh while already in EGO (R169 중첩) does not cut again',near(run('player.specialCD'),run('q')-F,1e-6),run('player.specialCD'));
 // ---- EGO 끝 ----
 run('player.ego=0;tick(F);player.specialCD=0;player.blinkCD=0;tick(F);special();blink();werCast("w");tick(F)');
 check('after EGO: Q 10, blink 4, W 5 again',near(run('player.specialCD'),10-F,1e-6)&&near(run('player.blinkCD'),4-F,1e-6)&&near(run('player.storyWER.ready["hwando:w"]-time'),5-F,1e-6));
 check('after EGO: cdFactor() 1, egoActive() false',A.cdFactor?.()===1&&A.egoActive?.()===false);
 run('player.egoCD=0;ego();tick(F)');check('EGO re-entry cuts running cooldowns again (10 → ×.77)',near(run('player.specialCD'),(10-F)*.77-F),run('player.specialCD'));
 // ---- 경계값 ----
 run(fresh+';player.specialCD=0;player.blinkCD=0;ego();tick(F)');check('EGO entry with zero cooldowns keeps them zero (no negatives)',run('player.specialCD')===0&&run('player.blinkCD')===0);
 run(fresh+';player.specialCD=NaN;ego();tick(F)');check('EGO entry: NaN cooldown left as is, no throw',Number.isNaN(run('player.specialCD'))&&A.inspect().stats.errors===0,JSON.stringify(A.inspect().lastError));
 run(fresh+';player.hp=0;player.ego=3;player.specialCD=8;tick(F);special();tick(F);player.hp=100');check('dead hero: no EGO reduction',near(run('player.specialCD'),8-2*F,1e-6));
 // ---- 사몽: EGO 보다 더 ----
 run(fresh+';player.samongCD=0;player.specialCD=8;player.blinkCD=2;player.storyWER.ready["hwando:r"]=time+4;tick(F);awaken("seven");tick(F)');
 check('사몽 entry: running Q 8 → ×.60',near(run('player.specialCD'),(8-F)*.6-F),run('player.specialCD'));
 check('사몽 entry: running W/E/R deadline 4 → ×.60',near(run('player.storyWER.ready["hwando:r"]-time'),(4-F)*.6-F),run('player.storyWER.ready["hwando:r"]-time'));
 check('사몽 entry: own samongCD (77) untouched',near(run('player.samongCD'),77-F),run('player.samongCD'));
 run('player.specialCD=0;tick(F);special();tick(F)');check('사몽: new Q still 10 → 2.3 (R571 rule kept, stronger than EGO 7.7)',near(run('player.specialCD'),2.3-F),run('player.specialCD'));
 check('사몽: cdFactor() .23',near(A.cdFactor?.(),.23,1e-9));
 // 7번째 EGO 로 사몽이 켜지는 경우: 돌던 대기는 사몽 진입값(.60)만, EGO .77 과 겹치지 않는다. EGO 자기 대기는 사몽 규칙(×.23)을 따른다(R571 그대로).
 run(fresh+';player.egoCount=6;player.specialCD=8;tick(F);ego();tick(F)');
 check('7th EGO → 사몽 starts',run('player.samong')>6.9&&run('player.ego')===0);
 check('7th EGO → 사몽: running Q 8 → ×.60 only (not ×.77×.60)',near(run('player.specialCD'),(8-F)*.6-F),run('player.specialCD'));
 // EGO 중에 사몽으로 올라가면 합계가 사몽 진입값(.60)이 되도록 나머지만 더 줄인다.
 run(fresh+';player.specialCD=8;tick(F);ego();tick(F);player.ego=0;awaken("story");tick(F)');
 check('EGO → 사몽 upgrade: total entry cut is .60 (not .77×.60)',near(run('player.specialCD'),(8-F)*.6-2*F,5e-3),run('player.specialCD'));
 run('player.samong=0;tick(F)');
 // ---- 저장 ----
 check('nothing of R967 is written into the save',!/r571|r967|surge|egoEntry/i.test(run('JSON.stringify(serializeSave())')));
}
{let T=null;try{T=stage({store:{'storyworld.r571.surge':JSON.stringify({on:false})}});}catch(e){}
 if(T){T.run('var F='+F+';ego();tick(F);special();tick(F)');check('pref off: no EGO cooldown change',near(T.run('player.specialCD'),10-F,1e-6));}
 else check('pref off stage loads',false);}
{let T=null;try{T=stage({store:{'storyworld.r571.surge':JSON.stringify({ego:false})}});}catch(e){}
 if(T){T.run('var F='+F+';ego();tick(F);special();tick(F)');check('pref ego:false turns only the EGO part off',near(T.run('player.specialCD'),10-F,1e-6));
  T.run('player.specialCD=0;player.samongCD=0;awaken("story");tick(F);special();tick(F)');check('pref ego:false keeps 사몽 ×.23',near(T.run('player.specialCD'),2.3-F));}
 else check('pref ego stage loads',false);}
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
check('runtime copy matches source',fs.readFileSync(path.join(R,'runtime-text',FILE),'utf8')===fs.readFileSync(path.join(SRC,FILE),'utf8'));
check('index still loads samong-surge-r571.js',idx.includes('<script src="./samong-surge-r571.js"></script>'));
const failed=results.filter(r=>!r.ok);
for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));
process.exit(failed.length?1:0);
