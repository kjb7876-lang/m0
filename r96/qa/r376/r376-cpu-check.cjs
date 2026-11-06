// R376 — 난이도 '실화'(영화 모드 길잡이가 고름: 하드 기준 적 체력 2배·적 피해 절반) + 실화 지역 서사 시간 맞춤(R370) + 오프닝 제목 글자 제거.
// CPU 에서 가짜 엔진에 붙여 본다. 실제 전투 체감·음성 품질·브라우저·모바일은 여기서 보지 않는다(미검증).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const SRC=C('real-mode-r376.js'),CIN=C('cinema-mode-r370.js'),html=RT('index.html');
// ── 빌드 연결 ──
ok('runtime copies match client-source',RT('real-mode-r376.js')===SRC&&RT('cinema-mode-r370.js')===CIN&&RT('intro-video-r309.js')===C('intro-video-r309.js')&&RT('intro-tree-r309.js')===C('intro-tree-r309.js'));
ok('index.html loads real-mode-r376 once, right after the last Dots mob overlay (r374/r375) (after cinema-mode-r370 and guide-difficulty-r189)',html.split('"./real-mode-r376.js"').length===2&&/mob-dots-r37[45]\.js"><\/script><script src="\.\/real-mode-r376\.js"><\/script>/.test(html)&&html.indexOf('real-mode-r376.js')>html.indexOf('cinema-mode-r370.js')&&html.indexOf('real-mode-r376.js')>html.indexOf('guide-difficulty-r189.js'));
ok('public verify list (with comma), runtime inputs, Pages CPU step',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'real-mode-r376.js',")&&JSON.parse(RT('../runtime-inputs.json')).textPaths.includes('real-mode-r376.js')&&/node r96\/qa\/r376\/r376-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('no eval / new Function / ctx.filter blur',!/\beval\s*\(|new Function/.test(SRC)&&!/filter\s*=\s*['"][^'"]*(drop-shadow|blur)/.test(SRC));
// ── 오프닝 제목 글자 ──
const V=C('intro-video-r309.js'),T=C('intro-tree-r309.js');
ok('opening video shows no title text (SHOW_TITLE=false, empty .ttl), fallback animation has no title text',/SHOW_TITLE=false/.test(V)&&/'<div class="ttl">'\+\(SHOW_TITLE\?TITLE:''\)\+'<\/div>/.test(V)&&T.includes('<div class="ttl"></div>')&&!T.replace(/^\/\/.*$/mg,'').includes('합일'));
// ── 영화 모드 화면 정리·초상화(정적) ──
const H=C('hud-cinema-r376.js');
ok('hud-cinema runtime copy, loaded once right after real-mode-r376, public list',RT('hud-cinema-r376.js')===H&&/real-mode-r376\.js"><\/script><script src="\.\/hud-cinema-r376\.js"><\/script>/.test(html)&&html.split('"./hud-cinema-r376.js"').length===2&&fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'hud-cinema-r376.js',"));
ok('cinema hides every body child except stage/modal/subtitles/video scenes, and HUD/guide parts inside the stage',/body\.r376cine>:not\(/.test(H)&&["'stage'","'modal'","'r370Subs'","'r309v'","'r368v'","'r369v'","'r372v'"].every(k=>H.includes(k))&&["'navCompassR100'","'minipanel'","'phase1-labels'","'touchActionsR100'","'heroCard'"].every(k=>H.includes(k)));
ok('ground guide trail off through R100 nav (original remembered and restored)',/P\.set\(\{nav:false\}\)/.test(H)&&/storyworld\.r376\.navRestore/.test(H)&&/P\.set\(\{nav:true\}\)/.test(H));
ok('Esc (and touch tap) turns cinema off then opens settings, not while a window/story/loading/video is open',/e\.key!=='Escape'/.test(H)&&/cinema\(\)\?\.set\?\.\(\{on:false\}\)/.test(H)&&/showSettings\(\)/.test(H)&&/function busy\(\)\{return G\(\(\)=>modal/.test(H)&&/videoOpen\(\)/.test(H)&&/e\.pointerType==='mouse'/.test(H));
ok('portrait: R108 select-screen art only replaces the engine idle art (EGO cut-in kept), falls back on load error',/function portrait\(\)/.test(H)&&/src===base/.test(H)&&/r108\/heroes/.test(H)&&/addEventListener\('error'/.test(H)&&/#heroCard\.mobile-hud-r63 #r376Pf\{display:none!important\}/.test(H));
ok('no drop-shadow/blur in ctx.filter, no eval',!/ctx\.filter/.test(H)&&!/\beval\s*\(|new Function/.test(H));
// ── 실화 가짜 엔진 ──
function mk({cinema=true,coop='off'}={}){const toasts=[],hurts=[],store={};
 const sb={console,Math,JSON,Number,String,Array,Object,Map,Set,RegExp,Promise,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  setTimeout:(f)=>{sb.__t.push(f);return 0;},setInterval:f=>{sb.__iv=f;},addEventListener:(t,f)=>{if(t==='click')sb.__click=f;},
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({appendChild(){},style:{}}),createTextNode:t=>t},__t:[],toast:m=>toasts.push(m)};
 sb.window=sb;
 sb.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:sb.__cinema})};sb.__cinema=cinema;
 sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 sb.__hurts=hurts;
 vm.createContext(sb);
 vm.runInContext(`var layer='STORY',zone='hub',world={},room={id:'hub',layer:'STORY',enemies:[]};
  function mkE(id,hp,f,boss){return {id,hp,maxHp:hp,difficultyBaseHpR63:hp/f,difficultyFactorR63:f,boss:!!boss};}
  function hurt(v,src){__hurts.push(v);return 'hit';}
  // R63 흉내: 다음 지역은 길잡이가 고른 난이도로, 진입하면 room.difficultyR63 를 둔다
  var __tier=null;
  async function enterRegion(id,from,opt={}){const t=opt.difficultyR63||(opt.restore?(world['STORY:'+id]?.difficultyR63||'normal'):__STORYWORLD_GUIDE_R77__.takeNextNormal(id,'STORY',zone));
   const k='STORY:'+id;const r=world[k]||(world[k]={id,layer:'STORY',enemies:[mkE(id+':a',40,.664),mkE(id+':b',40,.664),mkE(id+':boss',400,.4,true)]});r.difficultyR63=t;room=r;zone=id;return true;}
  function serializeSave(){const rooms={};for(const[k,r]of Object.entries(world))rooms[k]={enemies:r.enemies.map(e=>({id:e.id,hp:e.hp}))};return {rooms,enemyHpScaleE159:2};}
  function restoreSave(raw){world={};for(const k of Object.keys(raw.rooms||{})){const id=k.split(':')[1];const r={id,layer:'STORY',difficultyR63:'hard',enemies:[mkE(id+':a',40,.664),mkE(id+':b',40,.664),mkE(id+':boss',400,.4,true)]};
    // 엔진처럼: 저장된 체력을 2배 전 최대 체력으로 자른다
    for(const e of r.enemies){const o=raw.rooms[k].enemies.find(x=>x.id===e.id);if(o)e.hp=Math.min(e.maxHp,o.hp);}world[k]=r;}room=world['STORY:'+raw.zone]||room;return true;}
  async function newGame(){world={};room={id:'hub',layer:'STORY',enemies:[]};zone='hub';return true;}
  function showSettings(){}
  // R189 처럼 감싼 R77
  window.__STORYWORLD_GUIDE_R77__=Object.freeze({__r189:true,takeNextNormal(d,l,f){return __tier;}});`,sb);
 vm.runInContext(SRC,sb);
 return {sb,api:sb.__STORYWORLD_REAL_MODE_R376__,toasts,hurts,ev:c=>vm.runInContext(c,sb),tick:()=>sb.__iv&&sb.__iv()};}
(async()=>{
 {const F=mk();
  ok('guide wrapper installed on top of R189',F.ev('__STORYWORLD_GUIDE_R77__.__r376===true'));
  F.ev("__tier='normal'");await F.ev("enterRegion('dist00',null,{})");
  ok('cinema guide picks 실화: R63 tier is hard, room marked real',F.ev("room.difficultyR63")==='hard'&&F.api.active()&&F.api.maps().includes('STORY:dist00'));
  const e=F.ev('room.enemies');
  ok('enemy HP doubled vs hard (max and current, factor ×2)',e[0].maxHp===80&&e[0].hp===80&&Math.abs(e[0].difficultyFactorR63-1.328)<1e-9&&e[2].maxHp===800,e.map(x=>x.maxHp));
  F.tick();F.tick();F.api.ensure();
  ok('doubling is applied once (interval and repeat ensure do not compound)',F.ev('room.enemies[0].maxHp')===80&&F.ev('room.enemies[2].maxHp')===800);
  // R63 재계산 흉내: factor 가 하드로 되돌아가면 다시 2배
  F.ev("{const x=room.enemies[1];x.hp=20;x.maxHp=40;x.difficultyFactorR63=.664;}");F.tick();
  ok('after an R63 rescale back to hard, ×2 is re-applied keeping the HP fraction',F.ev('room.enemies[1].maxHp')===80&&F.ev('room.enemies[1].hp')===40);
  // R373 분대 복제 흉내({...src})
  F.ev("room.enemies.push({...room.enemies[0],id:'dist00:a:r373c1'})");F.tick();
  ok('a squad clone copying the marker is not doubled again',F.ev('room.enemies[3].maxHp')===80);
  F.ev("room.enemies.push(mkE('dist00:late',40,.664))");F.tick();
  ok('a reinforcement spawned later is doubled by the interval',F.ev('room.enemies[4].maxHp')===80);
  F.hurts.length=0;F.ev("hurt(10,room.enemies[0]);hurt(10,{owner:room.enemies[2]});hurt(10,{owner:'dist00:b'});hurt(10,{kind:'trap'});hurt(10,null)");
  ok('enemy damage halved (direct, owner object, owner id string — same rule as R63); non-enemy damage untouched',JSON.stringify(F.hurts)==='[5,5,5,10,10]',F.hurts);
  ok('entry toast names the mode',F.toasts.some(t=>/실화/.test(t)&&/2배/.test(t)));
  // 저장 → 불러오기: 저장한 체력이 2배 전 최대 체력으로 잘리지 않고 2배가 다시 걸린다
  F.ev("room.enemies[2].hp=600");const save=F.ev('JSON.parse(JSON.stringify(Object.assign(serializeSave(),{zone:"dist00"})))');
  ok('save file lists real maps',Array.isArray(save.realModeR376?.maps)&&save.realModeR376.maps.includes('STORY:dist00'));
  await F.ev(`restoreSave(${JSON.stringify(save)})`);
  ok('restore: ×2 re-applied once and saved HP (600/800) kept',F.ev('room.enemies[2].maxHp')===800&&F.ev('room.enemies[2].hp')===600&&F.ev('room.enemies[0].maxHp')===80,[F.ev('room.enemies[2].hp'),F.ev('room.enemies[2].maxHp')]);
  // 직접 난이도 창에서 고르면 실화에서 빠진다
  F.sb.__click({target:{closest:()=>({id:'campaignNormalR63'})}});await F.ev("enterRegion('dist00',null,{difficultyR63:'normal'})");
  ok('explicit picker choice removes the map from 실화',!F.api.maps().includes('STORY:dist00')&&!F.api.active());
  await F.ev("newGame()");ok('new game clears 실화 maps',F.api.maps().length===0);
 }
 {const F=mk();F.ev("__tier='normal'");await F.ev("enterRegion('dist03',null,{})");F.ev("delete room.difficultyR63;window.__STORYWORLD_TEST_STORAGE_B1__={store:{getItem:k=>k==='hapil.storyworld.campaign-r63.maps.v1'?JSON.stringify({version:1,maps:{'STORY:dist03':'hard'}}):null}};room.enemies.push(mkE('dist03:n',40,.664))");F.tick();
  ok('tier read from the R63 per-map store when room.difficultyR63 is missing (enter wrappers returning non-true)',F.api.active()&&F.ev("room.enemies.find(e=>e.id==='dist03:n').maxHp")===80);}
 {const F=mk({cinema:false});F.ev("__tier='hard'");await F.ev("enterRegion('dist01',null,{})");
  ok('cinema mode off: guide tier untouched, no 실화',F.ev('room.difficultyR63')==='hard'&&!F.api.active()&&F.ev('room.enemies[0].maxHp')===40);
  F.hurts.length=0;F.ev('hurt(10,room.enemies[0])');ok('…and enemy damage is not changed',F.hurts[0]===10);}
 {const F=mk();F.api.set({on:false});F.ev("__tier='easy'");await F.ev("enterRegion('dist01',null,{})");
  ok('setting off: cinema guide keeps the normal R189 choice',F.ev('room.difficultyR63')==='easy'&&!F.api.active());}
 {const F=mk({coop:'host'});F.ev("__tier='normal'");await F.ev("enterRegion('dist01',null,{})");
  ok('co-op: never 실화',F.ev('room.difficultyR63')==='normal'&&!F.api.active());}
 {const F=mk();F.ev("__tier=null");const r=F.ev("__STORYWORLD_GUIDE_R77__.takeNextNormal('dist02','STORY','dist01')");
  ok('non-guide travel (R77 returns falsy) is passed through',r===null&&F.api.maps().length===0);}
 // ── R370 실화 시간 맞춤·전투 중 다시 채우기 ──
 {let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};const spoken=[];let su=null;
  const ss={getVoices:()=>[{name:'ko',lang:'ko-KR'}],speak(u){spoken.push(u.text);su=u;setT(()=>{if(su===u){su=null;u.onend&&u.onend();}},u.text.length/(7*u.rate)*1000);},cancel(){su=null;},pause(){},resume(){},addEventListener(){}};
  const el=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){}},querySelector:()=>({}),appendChild(){},setAttribute(){},isConnected:true});
  const sb={localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;},performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},setInterval:f=>{sb.__iv=f;},addEventListener(){},
   document:{hidden:false,getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null},toast(){},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise};
  sb.window=sb;sb.__real=true;sb.__STORYWORLD_REAL_MODE_R376__={timeMul:()=>sb.__real?1.8:1};sb.__STORYWORLD_PLAY_R169__={collect(){}};
  vm.createContext(sb);
  vm.runInContext(`var started=true,loading=false,modal=false,guide=true,auto=true,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.8},
   room={id:'dist01',enemies:[{hp:10},{hp:10}]},regionById={dist01:{title:'x'}};
   function stopVoice(){}function advanceScene(){storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;if(d)d();}}
   function playScenes(sc,done){storyQueue=sc.slice();storyDone=done||null;storyScene=null;advanceScene();}
   async function enterRegion(){return true;}function showSettings(){}`,sb);
  vm.runInContext(CIN,sb);const api=sb.__STORYWORLD_CINEMA_MODE_R370__;api.set({on:true});
  const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
  const tickIv=s=>{for(let i=0;i<s;i++){run(1);sb.__iv&&sb.__iv();}};
  tickIv(1);const i0=api.inspect();
  ok('R370 rev 2: real zone keyed real:dist01 with combat estimate ×1.8 (216 s)',i0.revision==='R370-cinema-2'&&i0.zone.key==='real:dist01'&&Math.abs(i0.zone.estimate-216)<1e-6,i0.zone);
  const text=Array.from({length:400},(_,i)=>'전투 중에 이어질 원문 '+i+'번째 문장이 길게 이어졌다.').join(' ');
  vm.runInContext(`playScenes([{key:'dist01:pre',id:'dist01',title:'t',text:${JSON.stringify(text)}}],null)`,sb);
  const i1=api.inspect();ok('long scene: some sentences kept, the rest held in reserve (not thrown away)',i1.queue>0&&i1.reserve>0&&i1.stats.dropped===i1.reserve,{q:i1.queue,r:i1.reserve});
  tickIv(320);const i2=api.inspect();
  ok('while enemies live and zone time remains, reserve refills so narration keeps going in combat',i2.stats.refilled>0&&spoken.length>i1.stats.kept,{refilled:i2.stats.refilled,spoken:spoken.length,kept:i1.stats.kept});
  vm.runInContext('room.enemies.forEach(e=>e.hp=0)',sb);const n0=spoken.length;tickIv(400);const after=spoken.length;tickIv(60);
  ok('no refill once the fight is over (queue drains, then quiet)',spoken.length===after&&api.inspect().queue===0,{n0,after,end:spoken.length});
  vm.runInContext("room={id:'dist02',enemies:[{hp:5}]};",sb);sb.__real=false;tickIv(2);
  ok('zone change clears the reserve; non-real zone uses the normal estimate (120 s)',api.inspect().reserve===0&&api.inspect().zone.key==='dist02'&&api.inspect().zone.estimate===120,api.inspect().zone);}
 const fails=checks.filter(c=>!c.pass);
 for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail??'')));
 console.log(JSON.stringify({total:checks.length,failed:fails.length}));
 const out=path.join(__dirname,'r376-cpu.json');try{fs.writeFileSync(out,JSON.stringify({checks},null,1));}catch(_){}
 process.exit(fails.length?1:0);})().catch(e=>{console.error(e);process.exit(1);});
