// R571 CPU check — 사몽 발현 중 강화(재사용 대기 −77%, 확률 발동 ×1.77, 사거리·범위 +77%)와 영웅 주색 불꽃 오라.
// 엔진을 흉내 낸 작은 무대(stub)에 samong-surge-r571.js 와 growth-r103.js 를 실어 정상 경로·경계값·회귀를 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),SRC=path.join(R,'client-source');
const results=[];const check=(name,ok,detail='')=>results.push({name,ok:!!ok,detail});
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
const FILE='samong-surge-r571.js';

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
  var player={hero:'hwando',x:10,y:10,hp:100,samong:0,samongCD:0,specialCD:0,blinkCD:0,egoCD:0,attackCD:0,storyWER:{ready:{},buffs:{}}};
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
  function ego(){if(player.egoCD>0)return;player.egoCD=6;}
  function basicAttack(){player.attackCD=.5;}
  function awaken(reason){if(player.samong>0||reason!=='story'&&player.samongCD>0)return false;player.samong=7;player.samongCD=77;return true;}
  function tick(dt){time+=dt;for(const k of ['attackCD','specialCD','blinkCD','egoCD','samong','samongCD'])player[k]=Math.max(0,player[k]-dt);}
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
if(S){const {run,sb}=S;const A=sb.__STORYWORLD_SAMONG_SURGE_R571__;
 check('module loads and exposes API',A&&typeof A.active==='function'&&typeof A.cd==='function'&&typeof A.range==='function'&&typeof A.chance==='function');
 check('rules are exactly −77% / ×1.77 / +77%',A&&near(A.rules.cooldown,.23)&&near(A.rules.chance,1.77)&&near(A.rules.range,1.77));
 // ---- 재사용 대기 ----
 run('special()');check('outside 사몽: Q cooldown unchanged (10)',near(run('player.specialCD'),10));
 run('player.specialCD=0;awaken("seven");tick(1/60)');check('사몽 starts',run('player.samong')>6.9&&A.active()===true);
 run('special();tick(1/60)');check('사몽: Q cooldown 10 → 2.3',near(run('player.specialCD'),2.3-1/60,1e-3),run('player.specialCD'));
 run('blink();tick(1/60)');check('사몽: blink 4 → .92',near(run('player.blinkCD'),.92-1/60,1e-3),run('player.blinkCD'));
 run('werCast("w");tick(1/60)');check('사몽: W/E/R deadline cooldown 5 → 1.15',near(run('player.storyWER.ready["hwando:w"]-time'),1.15-1/60,2e-3),run('player.storyWER.ready["hwando:w"]-time'));
 run('player.storyWER.ready={};tick(1/60);werCast("w");tick(1/60)');check('W/E/R: re-cast after the ready table was cleared is scaled in full (browser regression: old deadline was used as base)',near(run('player.storyWER.ready["hwando:w"]-time'),1.15-1/60,2e-3),run('player.storyWER.ready["hwando:w"]-time'));
run('player.storyWER.ready["hwando:e"]=time+1e6;tick(1/60)');check('skills-r209 "blocked" far deadline untouched',run('player.storyWER.ready["hwando:e"]-time')>9e5);
 run('basicAttack();tick(1/60)');check('basic attack interval untouched (not a skill)',near(run('player.attackCD'),.5-1/60,1e-6));
 check('사몽 own cooldown (samongCD) untouched',run('player.samongCD')>76);
 run('player.specialCD=0;tick(1/60);special();tick(1/60);player.specialCD+=2;tick(1/60)');check('enemy "delay" extension during 사몽 is scaled only by its added part (2.3 running + 2 → +.46)',near(run('player.specialCD'),2.3-2/60+.46,2e-3),run('player.specialCD'));
 run('player.specialCD=0;awaken("seven");awaken("story");special();tick(1/60)');check('double 발현 does not stack (still ×.23, not ×.0529)',near(run('player.specialCD'),2.3-1/60,1e-3),run('player.specialCD'));
 // ---- 범위·사거리 ----
 run('room.enemies=[{id:"far",x:16,y:10,hp:99,radius:.3},{id:"near",x:12,y:10,hp:99,radius:.3}];hits.length=0;player.specialCD=0;special()');
 check('사몽: blast radius 4 reaches an enemy 6 away (6 ≤ 4×1.77+.3)',run('hits.some(h=>h.id==="far")'),run('JSON.stringify(hits)'));
 check('damage values are not changed by range scaling',run('hits.every(h=>h.v===10)'));
 check('hitEnemy runs with real distances (suspended)',run('hits.find(h=>h.id==="far").d')===6);
 check('Math.hypot outside a skill is exact during 사몽',run('Math.hypot(3,4)')===5);
 const shot=run('projectiles[projectiles.length-1]');check('사몽: friendly skill shot reach +77% (life .8 → 1.416) and radius ×1.77',near(shot.life,.8*1.77)&&near(shot.radius,.14*1.77),JSON.stringify(shot));
 run('makeShot(1,1,0,5,5,{friendly:false,owner:"e1",life:2})');check('enemy shots untouched',near(run('projectiles[projectiles.length-1].life'),2));
 run('fxLog.length=0;runDelayed()');check('delayed skill visual (owner hero, skill context) grows ×1.77',run('fxLog.some(f=>f.type==="slash"&&Math.abs(f.size-4.2*1.77)<1e-9)'),run('JSON.stringify(fxLog)'));
 run('var hv=[];delay(0,()=>{hv.push(Math.hypot(3,4));},"story-wer:9");delay(0,()=>{hv.push(Math.hypot(3,4));},"misc");runDelayed()');
 check('W/E/R delayed effect scaled, unrelated delayed job exact',near(run('hv[0]'),5/1.77)&&run('hv[1]')===5,run('JSON.stringify(hv)'));
 run('var nested=[];e568HeroActionContext={kind:"skill"};delay(0,()=>{nested.push(Math.hypot(3,4));delay(0,()=>nested.push(Math.hypot(3,4)),"story-wer:x");},"hero");e568HeroActionContext=null;runDelayed();runDelayed()');
 check('nested skill scopes scale once (5/1.77, not 5/1.77²)',run('nested.length')===2&&run('nested').every(v=>near(v,5/1.77)),run('JSON.stringify(nested)'));
 run('moved.length=0;e568HeroActionContext={kind:"skill"};delay(0,()=>moveActor(player,1,0),"hero");e568HeroActionContext=null;runDelayed()');check('moveActor keeps real step length inside a skill',near(run('moved[0]'),1));
 run('var h3=Math.hypot(1,2,2)');check('3-argument Math.hypot still exact',run('h3')===3);
 // ---- 확률 발동 ----
 const GR=sb.__STORYWORLD_GROWTH_R103__;
 if(GR){run('window.__STORYWORLD_GROWTH_R103__.state().routeOpen=true');
  const inS=[1,3,7].map(l=>GR.procChance(l));run('player.samong=0;tick(1/60)');const off=[1,3,7].map(l=>GR.procChance(l));
  check('procChance outside 사몽 is the original rule (.03+.04k, ≤.6)',near(off[0],.07)&&near(off[1],.15)&&near(off[2],.31),JSON.stringify(off));
  check('procChance in 사몽 ×1.77 (k=1 .07→.1239, k=3 .15→.2655, k=7 .31→.5487)',near(inS[0],.07*1.77)&&near(inS[1],.15*1.77)&&near(inS[2],.31*1.77),JSON.stringify(inS));
  check('procChance level 0 stays 0 in 사몽',(run('player.samong=7'),GR.procChance(0))===0);
  check('chance cap: never above 1',near(A.chance(.6),1)&&near(A.chance(.5),.885)&&A.chance(0)===0);
  run('player.samong=0');
 }else check('growth-r103 loads',false);
 // ---- 사몽이 끝나면 원래 값 ----
 run('player.samong=0;player.specialCD=0;player.blinkCD=0;tick(1/60);special();blink();werCast("r");tick(1/60)');
 check('after 사몽: Q 10, blink 4, W/E/R 5 again',near(run('player.specialCD'),10-1/60,1e-6)&&near(run('player.blinkCD'),4-1/60,1e-6)&&near(run('player.storyWER.ready["hwando:r"]-time'),5-1/60,1e-6));
 run('room.enemies=[{id:"far",x:16,y:10,hp:99,radius:.3}];hits.length=0;player.specialCD=0;special()');check('after 사몽: blast radius back to 4 (enemy at 6 not hit)',run('hits.length')===0);
 check('after 사몽: shots back to original life',near(run('projectiles[projectiles.length-1].life'),.8));
 run('e568HeroActionContext={kind:"skill"};var h0;delay(0,()=>{h0=Math.hypot(3,4)},"hero");e568HeroActionContext=null;runDelayed()');check('after 사몽: skill geometry exact',run('h0')===5);
 check('API reports inactive after 사몽',A.active()===false&&A.cd(10)===10&&A.range(4)===4&&A.chance(.3)===.3);
 // ---- 저장·이어하기 ----
 const save=run('JSON.stringify(serializeSave())');check('nothing of R571 is written into the save',!/r571|surge/i.test(save));
 run('player={hero:"slayer",x:5,y:5,hp:100,samong:0,samongCD:30,specialCD:0,blinkCD:0,egoCD:0,attackCD:0,storyWER:{ready:{"slayer:w":time+3},buffs:{}}};tick(1/60);special();tick(1/60)');
 check('after loading a save (사몽 not running): Q 10 and loaded W deadline kept',near(run('player.specialCD'),10-1/60,1e-6)&&near(run('player.storyWER.ready["slayer:w"]-time'),3-2/60,1e-6));
 run('player.samong=7;player.specialCD=0;tick(1/60);special();tick(1/60)');check('loaded player in 사몽 also gets ×.23',near(run('player.specialCD'),2.3-1/60,1e-3));
 // ---- 오라 ----
 S.ops.length=0;run('player.hero="hwando";player.samong=7;drawHero()');const auraOps=S.ops.filter(o=>o==='fill'||o==='stroke').length;
 check('aura: draws flames while 사몽',auraOps>=6,'fills '+auraOps);
 check('aura: hero body still drawn exactly once',run('ops_hero')===1);
 const cols=S.ops.filter(o=>o.startsWith('colour:')).join(' ');
 check('aura: 환도 uses silver (214,222,234) and gold (255,198,72)',/214,222,234/.test(cols)&&/255,198,72/.test(cols),cols.slice(0,300));
 check('aura: never sets ctx.filter (Three.js recorder safe)',!S.ops.some(o=>o.startsWith('filter:')));
 check('aura: bounded draw cost (≤ 90 fill/stroke per frame)',auraOps<=90,'ops '+auraOps);
 run('settings.lowFx=true');S.ops.length=0;run('drawHero()');const lowOps=S.ops.filter(o=>o==='fill'||o==='stroke').length;run('settings.lowFx=false');
 check('aura: lowFx draws less',lowOps>0&&lowOps<auraOps,lowOps+' < '+auraOps);
 S.ops.length=0;run('player.samong=0;drawHero()');check('aura: nothing outside 사몽',S.ops.filter(o=>o==='fill'||o==='stroke').length===0);
 for(const h of ['seoha','neon','michaela','lauren','hunter','slayer','gunner']){S.ops.length=0;run('player.hero="'+h+'";player.samong=5;drawHero()');const c=S.ops.filter(o=>o.startsWith('colour:')).join(' ');const main=A.palette(h).main.join(',');check('aura colour from hero main · '+h,c.includes(main),main);}
 run('player.samong=0');
}
// ---- 꺼짐 설정 ----
{let T=null;try{T=stage({store:{'storyworld.r571.surge':JSON.stringify({on:false})}});}catch(e){}
 if(T){T.run('awaken("seven");tick(1/60);special();tick(1/60)');check('pref off: no cooldown change',near(T.run('player.specialCD'),10-1/60,1e-6));
  T.ops.length=0;T.run('drawHero()');check('pref off: no aura',T.ops.filter(o=>o==='fill').length===0);}
 else check('pref off stage loads',false);}
// ---- 빌드 연결 ----
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
check('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',FILE))&&fs.readFileSync(path.join(R,'runtime-text',FILE),'utf8')===fs.readFileSync(path.join(SRC,FILE),'utf8'));
check('index loads R571 after actor-tone-r453 and before combat-r118',/actor-tone-r453\.js"><\/script>(?:<script src="\.\/hwando-chain-r590\.js"><\/script>)?(?:<script src="\.\/samong-theme-r572\.js"><\/script>)?<script src="\.\/samong-surge-r571\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(idx));
check('public verify lists the file',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes(FILE));
check('growth-r103 runtime copy matches source',fs.readFileSync(path.join(R,'runtime-text','growth-r103.js'),'utf8')===fs.readFileSync(path.join(SRC,'growth-r103.js'),'utf8'));

const failed=results.filter(r=>!r.ok);
for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));
process.exit(failed.length?1:0);
