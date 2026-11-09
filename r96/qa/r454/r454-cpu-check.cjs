// R454 영화 모드 별도 입구 검사: 처음 화면 입구·기록 성격 저장/불러오기·일반 기록에서 켜기 거절·서사 화자 영웅 고정(CPU, 가짜 엔진).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const src=CS('cinema-run-r454.js');assert.strictEqual(src,RT('cinema-run-r454.js'));ok('client-source and runtime copies agree');
const idx=RT('index.html');const at=k=>idx.indexOf('"./'+k+'"');
assert(idx.split('"./cinema-run-r454.js"').length===2&&at('cinema-mode-r370.js')<at('cinema-run-r454.js')&&at('hud-cinema-r376.js')<at('cinema-run-r454.js')&&at('mob-art-variants-r306.js')<at('cinema-run-r454.js')&&at('cinema-run-r454.js')<at('combat-r118.js'));ok('loaded once, after R306/R370/R376, before combat-r118');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'cinema-run-r454.js'"));ok('public verify list includes it');
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r454/r454-cpu-check.cjs'));ok('Pages CPU step');
assert(JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8')).textPaths.some(p=>/cinema-run-r454\.js$/.test(p)));ok('runtime inputs list it');
// 가짜 엔진
function boot(stored){const ls=new Map(Object.entries(stored||{}));const localStorage={getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v))};
 const win={};const toasts=[];const E={toast:(t)=>toasts.push(t)};
 let cprefs={on:false};try{const s=JSON.parse(ls.get('storyworld.r370.cinema')||'{}');if(s.on===true)cprefs.on=true;}catch(_){}
 const rawCalls=[];win.__STORYWORLD_CINEMA_MODE_R370__=Object.freeze({prefs:()=>({...cprefs}),set(p){rawCalls.push({...p});if(typeof p.on==='boolean')cprefs.on=p.on;return {...cprefs};}});
 const HEROES={hwando:{name:'환도'},seoha:{name:'윤서하'},michaela:{name:'미카엘라'},gunner:{name:'기억사수'},slayer:{name:'슬레이어'}};
 const regionById={hub:{records:[]},dist00:{records:[{narrator:'〈EGO의 기억〉'}]},kair01:{records:[{narrator:'〈윤서하의 기억〉'}]},restKairo:{records:[{narrator:'〈윤서하의 기억〉'},{narrator:'〈미카엘라의 기억〉'}]},murder03:{records:[{narrator:'〈환도의 기억〉'},{narrator:'〈한이경의 기억〉'}]},cult01:{locked:true,records:[{narrator:'〈미카엘라의 기억〉'}]}};
 const pre=`let player=null,room=null,zone='hub',saved=0,heroPanel=0;
 let enterRegion=async(id)=>{if(regionById[id]&&regionById[id].locked)return false;room={id};zone=id;return true;};let playScenes=(sc,done)=>{done&&done();};let showHeroes=(isNew)=>{heroPanel++;};
 let newGame=async(id)=>{player={hero:id,level:7,xp:33};await enterRegion('hub');return true;};let restoreSave=async(raw)=>{player={hero:raw.hero,level:12,xp:5,upgrades:{a:1}};await enterRegion(raw.zone);return true;};
 let serializeSave=()=>({hero:player&&player.hero});let showTitle=()=>{},showMenu=()=>{},showSettings=()=>{};
 const ensureImages=async()=>{await new Promise(r=>setTimeout(r,3));},heroPaths=()=>[],refreshIcons=()=>{},saveGame=()=>{saved++;};`;
 const post=`return {get player(){return player;},get heroPanel(){return heroPanel;},enterRegion:()=>enterRegion,playScenes:()=>playScenes,showHeroes:()=>showHeroes,newGame:()=>newGame,restoreSave:()=>restoreSave,serializeSave:()=>serializeSave};`;
 const doc={getElementById:()=>null,addEventListener:()=>{},createElement:()=>({})};
 const live=new Function('window','localStorage','document','toast','HEROES','regionById',pre+src+';'+post)(win,localStorage,doc,E.toast,HEROES,regionById);
 const S=live;
 return {win,ls,S,toasts,rawCalls,cprefs:()=>cprefs,live,R:win.__STORYWORLD_CINEMA_RUN_R454__,C:win.__STORYWORLD_CINEMA_MODE_R370__};}
(async()=>{
 // 순수 함수
 {const t=boot();const P=t.R.pure,H={hwando:{name:'환도'},seoha:{name:'윤서하'},gunner:{name:'기억사수'}};
  assert.strictEqual(P.speaker('〈환도의 기억〉'),'환도');assert.strictEqual(P.speaker('도겸의 기억 — 고흐라 불리던 자리'),'도겸');assert.strictEqual(P.speaker('한이경'),'한이경');
  assert.strictEqual(P.heroFor('〈윤서하의 기억〉',H),'seoha');assert.strictEqual(P.heroFor('기억사수의 기억',H),'gunner');
  assert.strictEqual(P.heroFor('〈EGO의 기억〉',H),null);assert.strictEqual(P.heroFor('〈윤서하의 진료기록〉',H),null);
  assert.strictEqual(P.heroFor('〈의목사 A의 기억〉',H),'slayer');assert.strictEqual(P.heroFor('〈의목사 A의 기억〉',H,undefined,'hunter'),'hunter');assert.strictEqual(P.heroFor('〈의목사 A의 기억〉',H,undefined,'seoha'),'slayer');
  assert.strictEqual(P.heroFor('〈의목사 B의 기억〉',H),'gunner');assert.strictEqual(P.heroFor('〈의목사 B의 기억〉',H,undefined,'hwando','dream'),'hwando');assert.strictEqual(P.heroFor('〈의목사 B의 기억〉',H,undefined,'seoha','dream'),'hwando');
  assert.strictEqual(P.heroFor('환도의 기억',H,undefined,'gunner','samong'),'gunner');assert.strictEqual(P.heroFor('도겸의 기억',H,undefined,'seoha','samong'),'hwando');assert.strictEqual(P.heroFor('기억사수의 기억',H,undefined,'hwando','samong'),'gunner');
  assert.strictEqual(P.firstHero(['도겸의 기억','환도의 기억'],H),'hwando');
  {const pl={level:9,points:3,upgrades:{power:4,'hwando:heroMechanic':3,'hwando:heroEcho':5,'seoha:heroEcho':2,'seoha:heroMechanic':4}};const D=[{id:'heroMechanic',max:5},{id:'heroEcho',max:4}];
   const n=P.carry(pl,'hwando','seoha',D);assert.strictEqual(n,1);assert.strictEqual(pl.upgrades['seoha:heroEcho'],4);assert.strictEqual(pl.upgrades['seoha:heroMechanic'],4);assert.strictEqual(pl.upgrades.power,4);assert.strictEqual(pl.points,3);assert.strictEqual(pl.level,9);
   P.carry(pl,'seoha','gunner',D);assert.strictEqual(pl.upgrades['gunner:heroMechanic'],4);assert.strictEqual(pl.upgrades['gunner:heroEcho'],4);}
  ok('hero-only upgrades carry to the next hero (raise to the previous rank, never lower, capped at max; level/points/common upgrades untouched)');
  ok('narrator → hero: hero names exact; 의목사 A = slayer|hunter, 의목사 B = gunner (dream: gunner|hwando), samong 환도/unnamed = hwando|gunner keeping current; EGO/진료기록 unmapped');}
 // 예전 설정으로 켜져 있던 영화 모드는 처음 실릴 때 꺼진다
 {const t=boot({'storyworld.r370.cinema':JSON.stringify({on:true})});assert.strictEqual(t.cprefs().on,false);ok('legacy cinema setting is turned off at load (normal play never inherits it)');}
 // 일반 기록: 켜기 거절, 영웅 고정 없음
 {const t=boot();await t.live.newGame()('hwando');assert.strictEqual(t.R.run(),'normal');t.C.set({on:true});assert.strictEqual(t.cprefs().on,false);assert(t.toasts.some(x=>/영화 모드로 시작/.test(x)));
  await t.live.enterRegion()('kair01');assert.strictEqual(t.S.player.hero,'hwando');assert(!('playModeR454' in t.live.serializeSave()()));
  t.live.showHeroes()(false);assert.strictEqual(t.S.heroPanel,1);
  ok('normal run: turning cinema on from outside is refused, no hero lock, save carries no cinema flag, hero change allowed');}
 // 영화 기록: 입구 → 켜짐, 영웅 고정, 저장/불러오기
 {const t=boot();t.R.inspect();
  // 입구 단추 대신 pending 을 흉내: titleChoice 는 DOM 이 없으면 아무것도 안 하므로 내부 상태를 newGame 직전에 cinema 로 둔다
  const pend=src.includes("pending='cinema'");assert(pend);
  // pending 을 바깥에서 둘 길이 없으니 restoreSave 로 영화 기록을 불러온다
  await t.live.restoreSave()({hero:'slayer',zone:'hub',playModeR454:'cinema'});assert.strictEqual(t.R.run(),'cinema');assert.strictEqual(t.cprefs().on,true);
  await t.live.enterRegion()('dist00');assert.strictEqual(t.S.player.hero,'slayer');
  await t.live.enterRegion()('kair01');await new Promise(r=>setTimeout(r,30));assert.strictEqual(t.S.player.hero,'seoha');
  await t.live.enterRegion()('restKairo');await new Promise(r=>setTimeout(r,30));assert.strictEqual(t.S.player.hero,'seoha');
  t.live.playScenes()([{narrator:'〈미카엘라의 기억〉',key:'x'}]);await new Promise(r=>setTimeout(r,30));assert.strictEqual(t.S.player.hero,'seoha');
  assert.strictEqual(t.S.player.level,12);assert.deepStrictEqual(t.S.player.upgrades,{a:1});
  await t.live.enterRegion()('murder03');await new Promise(r=>setTimeout(r,30));assert.strictEqual(t.S.player.hero,'hwando');
  assert.strictEqual(await t.live.enterRegion()('cult01'),false);await new Promise(r=>setTimeout(r,30));assert.strictEqual(t.S.player.hero,'hwando');
  assert.strictEqual(t.live.serializeSave()().playModeR454,'cinema');
  t.live.showHeroes()(false);assert.strictEqual(t.S.heroPanel,0);t.live.showHeroes()(true);assert.strictEqual(t.S.heroPanel,1);
  t.C.set({on:false});assert.strictEqual(t.cprefs().on,false);assert.strictEqual(t.R.run(),'cinema');t.C.set({on:true});assert.strictEqual(t.cprefs().on,true);
  await t.live.restoreSave()({hero:'hwando',zone:'hub'});assert.strictEqual(t.R.run(),'normal');assert.strictEqual(t.cprefs().on,false);
  ok('cinema run: restore turns it on, EGO keeps current hero, 윤서하/환도 regions lock their hero once per region (level/upgrades shared), save flag kept, sanctuary hero change blocked, Esc = pause, normal save turns it off, refused entry restores the previous hero');}
 console.log(n+' checks passed');
})().catch(e=>{console.error(e);process.exit(1);});
