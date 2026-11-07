// R390 — 실화 영화 모드 '전체 서사'(R370 rev 5) + 한 번 발견한 적은 끝까지 쫓아옴(aggro-chase-r390). 보스·중간보스 버티기 판정은 r384 검사에.
// CPU 에서 가짜 엔진에 붙여 본다. 실제 음성·자연 플레이·GPU·모바일은 미검증.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const CH=C('aggro-chase-r390.js'),CIN=C('cinema-mode-r370.js'),html=RT('index.html');
ok('runtime copies match client-source',RT('aggro-chase-r390.js')===CH&&RT('cinema-mode-r370.js')===CIN&&RT('cinema-sync-r384.js')===C('cinema-sync-r384.js'));
ok('index.html loads aggro-chase-r390 once, right after mob-moves-r385 (outside R74/R75 pursuing wrappers)',html.split('"./aggro-chase-r390.js"').length===2&&/mob-moves-r385\.js"><\/script><script src="\.\/aggro-chase-r390\.js"><\/script>/.test(html));
ok('public verify list, runtime inputs, Pages CPU step',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'aggro-chase-r390.js',")&&JSON.parse(RT('../runtime-inputs.json')).textPaths.includes('aggro-chase-r390.js')&&/node r96\/qa\/r390\/r390-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('no eval / new Function',!/\beval\s*\(|new Function/.test(CH));
// ── R370 rev 5 전체 서사 ──
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
 vm.runInContext(`playScenes([{key:'k1',text:${JSON.stringify(long)}}],()=>{})`,sb);
 return{A,sb,spoken,tick,flag,ev:s=>vm.runInContext(s,sb)};}
{const N=cin(false);const i=N.A.inspect();ok('baseline (not 실화): R370 still trims long narration into a reserve',i.reserve>0,i);
 const F=cin(true);const j=F.A.inspect();ok('R390 full mode: nothing trimmed, all 60 sentences queued',j.reserve===0&&j.queue+(j.current?1:0)>=59,j);
 ok('…remainingSecs covers the whole narration (> 3 min)',F.A.remainingSecs()>180,F.A.remainingSecs());}
{const F=cin(false);const r0=F.A.inspect().reserve;F.flag.full=true;const rs=F.A.remainingSecs();
 ok('R390: when full mode turns on, the leftover reserve counts toward remainingSecs (no false "narration over" gap)',r0>0&&rs>180,{r0,rs});
 F.ev('room.enemies.length=0');F.tick(600);ok('…and is read to the end even after the fight is over',F.A.inspect().reserve===0&&F.spoken.length>=60&&F.A.remainingSecs()<1,{sp:F.spoken.length,i:F.A.inspect().reserve});}
// ── 끝까지 쫓아옴 ──
function chase(o={}){let iv=null;const sb={setTimeout,localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setInterval:f=>{iv=f;},Math,JSON,String,Array,Set,Map,Object,Number};sb.window=sb;
 sb.__STORYWORLD_WORLD_R74__=Object.freeze({pursuing:e=>!!e.__alert,doors:()=>[] });vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,player={x:0,y:0,hp:100},
  room={id:'z',enemies:[{id:'a',x:4,y:0,homeX:4,homeY:0,hp:50,combatProfile:{aggro:5}},{id:'g',x:6,y:0,homeX:6,homeY:0,hp:50,combatProfile:{aggro:9},explorationGroup:'p1',explorationLeash:9},{id:'far',x:30,y:0,hp:50,combatProfile:{aggro:5}},{id:'hid',x:1,y:0,hp:50,spawnState:'hidden',combatProfile:{aggro:5}}]};
  var __hits=[],__hurts=[];function hitEnemy(e,v){__hits.push(e.id);return true;}function hurt(v,s){__hurts.push(v);return true;}`,sb);
 vm.runInContext(CH,sb);return{sb,api:sb.__STORYWORLD_AGGRO_CHASE_R390__,tick:()=>iv&&iv(),ev:s=>vm.runInContext(s,sb),P:e=>sb.__STORYWORLD_WORLD_R74__.pursuing(e)};}
{const F=chase();F.tick();const E=id=>F.ev(`room.enemies.find(e=>e.id==='${id}')`);
 ok('R74 pursuing wrapped once, other API kept',F.sb.__STORYWORLD_WORLD_R74__.__r390===true&&typeof F.sb.__STORYWORLD_WORLD_R74__.doors==='function');
 ok('enemy inside its aggro range (and group leash) → spotted',F.api.engaged(E('a'))&&F.api.engaged(E('g')));
 ok('far enemy and hidden enemy are not spotted',!F.api.engaged(E('far'))&&!F.api.engaged(E('hid')));
 F.ev('player.x=-40');F.tick();ok('spotted enemy keeps pursuing after the hero runs 40 tiles away (no leash, no 12 s limit)',F.P(E('a'))===true&&F.P(E('g'))===true);
 ok('…not spotted one still uses the engine rule',F.P(E('far'))===false);
 F.ev("room.enemies.find(e=>e.id==='a').hp=0");ok('dead enemy stops',F.P(E('a'))===false);
 F.sb.hitEnemy(E('far'),5);ok('hit by the hero → spotted',F.P(E('far'))===true&&F.api.inspect().stats.hitSpotted===1);
 F.ev("room.enemies.push({id:'h2',x:50,y:0,hp:10,combatProfile:{aggro:3}})");F.sb.hurt(5,{owner:'h2'});ok('hurt the hero (source owner id) → spotted',F.P(E('h2'))===true&&F.api.inspect().stats.hurtSpotted===1);
 const other={id:'o',x:0,y:0,hp:10,combatProfile:{aggro:9}};F.sb.hitEnemy(other,1);ok('enemy of another room is never marked',!F.api.engaged(other));
 F.ev("room.enemies.push({id:'al',x:60,y:0,hp:10,combatProfile:{aggro:3},__alert:true})");ok('engine alert (R74/R75) still honoured and marks the enemy',F.P(E('al'))===true&&F.api.engaged(E('al')));
 F.ev("room.enemies.find(e=>e.id==='al').__alert=false");ok('…and it keeps chasing after the engine alert expires',F.P(E('al'))===true);}
{const F=chase();F.ev("room.enemies.find(e=>e.id==='g').x=20");F.tick();ok('group enemy more than 7.15 tiles away is not spotted (same as engine)',!F.api.engaged(F.ev("room.enemies.find(e=>e.id==='g')")));}
{const F=chase({prefs:{on:false}});F.tick();ok('pref off: nothing changes',!F.api.engaged(F.ev("room.enemies[0]"))&&F.P(F.ev("room.enemies[0]"))===false);}
{const F=chase();F.sb.__STORYWORLD_WORLD_R74__=Object.freeze({pursuing:()=>false,swapped:true});F.tick();ok('re-wraps when another overlay swaps the R74 object',F.sb.__STORYWORLD_WORLD_R74__.__r390===true&&F.sb.__STORYWORLD_WORLD_R74__.swapped===true);}
let failed=0;for(const c of checks){if(!c.pass)failed++;console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));}
console.log(JSON.stringify({total:checks.length,failed}));if(failed)process.exitCode=1;
