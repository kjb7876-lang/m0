// R1036 CPU 검사: 영상이 나오는 동안 맵을 준비한다(사용자 2026-11-14 13:43Z "시네마틱영상나오는시간에도 맵을 렌더링해서 첫입장시 렉적게 … 영상나올때도 같이 하는식으로해서 시간을 버는 거지").
//  헤드리스 실측(qa/r1036/entry-lag-probe.mjs, 1280×720 last301→last302): 영상 루트가 덮은 동안 R619 가 draw 를 모두 쉬어서, 새 지역 맵은
//  영상이 닫힌 뒤 첫 draw 에서야 만들어졌다(첫 draw 429ms, 평소 65~135ms). 입장 영상(R617 해안 last302 · R369 중독의 도시 ep1a10)은 로딩·입장 서사창이 끝난 뒤에야 시작했다.
//  기대 ① R619: 영상이 덮고 있어도 '새 지역이 다 실렸고 아직 한 번도 그리지 않았으면' 몇 번(최대 3번, 0.3초 간격)만 그려 맵을 미리 만든다. 같은 지역·로딩 중·영상 없음은 예전과 같다.
//       ② entry-video-r1036: 그 지역에 처음 들어갈 때 볼 입장 영상이 남아 있으면 로딩을 시작하는 그 순간 영상을 먼저 튼다(로딩은 영상 뒤에서 같이).
//          입장 서사창은 영상이 닫힌 뒤 연다(영상 뒤에서 글·낭독이 흘러가지 않게). 영상이 로딩보다 먼저 끝나면 로딩 화면이 그대로 기다린다.
//       경계: 이미 봄·꺼짐·사몽(DREAM)·협동·자동 검사·영화 모드 낭독·로딩 중·다른 영상이 열림·진입 실패. 회귀: 다른 지역·예전 흐름(이 오버레이 끔).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const C=f=>{try{return fs.readFileSync(path.join(R,'client-source',f),'utf8');}catch(_){return '';}},RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='entry-video-r1036.js',src=C(F),s619=C('video-render-pause-r619.js'),s617=C('hwando-fall-video-r617.js'),s369=C('poison-city-video-r369.js');
ok(F+' exists',!!src);for(const f of [F,'video-render-pause-r619.js','hwando-fall-video-r617.js','poison-city-video-r369.js'])ok(f+' runtime copy matches source',!!C(f)&&C(f)===RT(f));
const html=RT('index.html'),tag='"./'+F+'"';
ok('script tag once on its own line right after video-render-pause-r619',html.split(tag).length===2&&html.includes('<script src="./video-render-pause-r619.js"></script>\n<script src='+tag+'></script>\n'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',/node r96\/qa\/r1036\/r1036-entry-video-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('runtime-manifest has overlay',RT('../runtime-manifest.json').includes('"'+F+'"')||fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('"'+F+'"'));
if(!src){console.log(`\n${pass} pass, ${fail} fail (overlay missing)`);process.exit(1);}
// ---------- ① R619 미리 그리기 ----------
function env619(){const dom=new Map();const g={__now:0,console};Object.assign(g,{localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>g.__now},document:{getElementById:id=>dom.get(id)||null},addEventListener(){},dom});
 g.window=g;vm.createContext(g);vm.runInContext('var draws=0,loading=false,room={id:"a"};function draw(){draws++;}function updateHUD(){}',g);vm.runInContext(s619,g);return g;}
{const g=env619(),run=js=>vm.runInContext(js,g),fr=(n,ms=16)=>{for(let i=0;i<n;i++){g.__now+=ms;run('draw()');}};const A=g.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__,N=A.WARM_N,GAP=A.WARM_GAP_MS;
 ok('619: warm-up budget sized for async map build (6..20 draws, gap ≥250ms, ≤10s total)',N>=6&&N<=20&&GAP>=250&&N*GAP<=10000);
 fr(3);ok('619: no video → draws',run('draws')===3);
 g.dom.set('r617v',{id:'r617v'});fr(20);ok('619: video over the room already drawn → skipped (R619 kept)',run('draws')===3);
 run('loading=true;room={id:"b"}');fr(20);ok('619: new room still loading → skipped',run('draws')===3);
 run('loading=false');fr(1);ok('619: new room loaded under video → one warm-up draw at once',run('draws')===4);
 fr(Math.floor((GAP-20)/16),16);ok('619: next warm-up waits for the gap (video keeps the main thread)',run('draws')===4);
 fr(3,16);ok('619: second warm-up after the gap',run('draws')===5);
 fr(Math.ceil(GAP*N*3/16),16);ok('619: at most WARM_N warm-up draws per new room',run('draws')===3+N);
 const ins=A.inspect();ok('619: stats.warmed counts them',ins.stats.warmed===N);
 fr(Math.ceil(GAP*N*3/16),16);ok('619: still at most WARM_N (no leak)',run('draws')===3+N);
 run('room={id:"c"}');fr(1);ok('619: another new room → warms again',run('draws')===4+N);
 g.dom.delete('r617v');fr(2);ok('619: video closed → every frame draws',run('draws')===6+N);}
// 회귀(헤드리스 실측: 미리 그리기 12번이 모두 HUD 갱신에 쓰여 맵이 하나도 안 그려짐): 게임 frame() 은 draw 와 updateHUD 를 함께 부른다
{const dom=new Map();const g={__now:0,console};Object.assign(g,{localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>g.__now},document:{getElementById:id=>dom.get(id)||null},addEventListener(){},dom});g.window=g;vm.createContext(g);
 vm.runInContext('var draws=0,huds=0,loading=false,room={id:"a"};function draw(){draws++;}function updateHUD(){huds++;}',g);vm.runInContext(s619,g);const run=js=>vm.runInContext(js,g);
 run('draw();updateHUD();');dom.set('r617v',{});run('room={id:"b"}');const N=g.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__.WARM_N;
 for(let i=0;i<400;i++){g.__now+=16;run('updateHUD();draw();updateHUD();');}
 ok('619: HUD updates do not use up the warm-up budget — the map gets all WARM_N draws',run('draws')===1+N);
 ok('619: HUD stays paused under the video',run('huds')===1);}
// 회귀(헤드리스 실측: 미리 그리기가 1번만 실제로 그려짐): R619 는 load 뒤 다시 감싸 바깥에도 하나 더 선다 → 바깥이 허락한 한 번을 안쪽이 다시 막으면 안 된다
{const dom=new Map(),loads=[];const g={__now:0,console};Object.assign(g,{localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>g.__now},document:{getElementById:id=>dom.get(id)||null},addEventListener:(t,f)=>{if(t==='load')loads.push(f);},dom});g.window=g;vm.createContext(g);
 vm.runInContext('var draws=0,outer=0,loading=false,room={id:"a"};function draw(){draws++;}function updateHUD(){}',g);vm.runInContext(s619,g);const run=js=>vm.runInContext(js,g);
 run('(()=>{const b=draw;draw=function(...a){outer++;return b.apply(this,a);};})()');for(const f of loads)f();
 run('draw();');dom.set('r617v',{});run('room={id:"b"}');const N=g.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__.WARM_N;
 for(let i=0;i<400;i++){g.__now+=16;run('draw();');}
 ok('619: wrapped twice (script + load): every warm-up allowed outside reaches the map draw ('+run('draws')+')',run('draws')===1+N);
 dom.delete('r617v');run('draw();draw();');ok('619: wrapped twice: normal drawing after the video',run('draws')===3+N);}
{const g=env619(),run=js=>vm.runInContext(js,g);vm.runInContext('room=undefined',g);g.dom.set('r368v',{});for(let i=0;i<30;i++){g.__now+=50;run('draw()');}ok('619: no room global → never warms (old behaviour)',run('draws')===0);}
// ---------- ② 입장 영상 먼저 ----------
function cls(){const s=new Set();return{s,add:c=>s.add(c),remove:c=>s.delete(c),contains:c=>s.has(c),toggle:(c,v)=>{if(v===undefined?!s.has(c):v)s.add(c);else s.delete(c);}};}
function el(tag,g){const L={};const n={tag,style:{setProperty(){}},children:[],classList:cls(),attrs:{},L,setAttribute(k,v){n.attrs[k]=v;},removeAttribute(k){delete n.attrs[k];if(k==='src')n.src='';},
 appendChild(c){n.children.push(c);c.parentNode=n;return c;},insertBefore(c){n.children.unshift(c);c.parentNode=n;return c;},remove(){n.removed=true;g.__dom.delete(n.id);},isConnected:true,
 addEventListener(t,f){(L[t]=L[t]||[]).push(f);},removeEventListener(t,f){L[t]=(L[t]||[]).filter(x=>x!==f);},fire(t,e={}){for(const f of [...(L[t]||[])])f({type:t,target:n,preventDefault(){},stopPropagation(){},...e});},
 _q:{},querySelector(s){return n._q[s]||(n._q[s]=el('div',g));},textContent:'',focus(){},src:'',currentTime:0,paused:true,load(){},pause(){n.paused=true;},play(){n.paused=false;return {catch(){}};}};
 Object.defineProperty(n,'innerHTML',{set(v){n._html=v;},get(){return n._html||'';}});Object.defineProperty(n,'id',{set(v){n._id=v;if(v)g.__dom.set(v,n);},get(){return n._id;}});return n;}
function env(o={}){const store=new Map(Object.entries(o.store||{}));const g={__dom:new Map(),__to:[],__now:0,console};
 const doc={createElement:t=>el(t,g),getElementById:id=>g.__dom.get(id)||null,head:null,body:null,activeElement:null,hidden:false};doc.head=el('head',g);doc.body=el('body',g);
 Object.assign(g,{localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},document:doc,navigator:{webdriver:!!o.webdriver},location:{search:o.search||''},
  performance:{now:()=>g.__now},requestAnimationFrame:f=>f(),setTimeout:(f,ms)=>{const id=g.__to.length+1;g.__to.push({id,f,at:g.__now+(ms||0)});return id;},
  clearTimeout:id=>{const t=g.__to.find(t=>t.id===id);if(t)t.f=null;},setInterval:(f,ms)=>{const sched=()=>{g.__to.push({id:g.__to.length+1,at:g.__now+ms,f:()=>{f();sched();}});};sched();return -1;},addEventListener(){},store});
 g.window=g;vm.createContext(g);
 // 가짜 엔진: enterRegion 은 loading 을 켜고, 손으로 finish() 할 때까지 그림을 읽는 척한다. noStory 가 아니면 끝에 enterNarrative.
 vm.runInContext(`var started=true,loading=false,modal=null,storyScene=null,layer="STORY",ticks=0,narr=[],baseCalls=[],player={x:1,y:1,hp:100,hero:"hwando"},keys=new Set();
  var regionById={last301:{id:"last301",title:"타락천사 기사"},last302:{id:"last302",title:"잠들지 못하는 마을"},ep1a10:{id:"ep1a10",title:"환자와 중독의 도시"},ep1a09:{id:"ep1a09",title:"x"},hub:{id:"hub",title:"정원"}};
  var rooms={};var room={id:"last301",layer:"STORY",enemies:[]};var pendingLoad=null;
  function chapterOpen(){return true;}function enterNarrative(def){narr.push(def.id);}function tick(dt){ticks++;}function draw(){}function updateHUD(){}
  async function enterRegion(id,from,opt={}){if(!regionById[id]||loading)return false;loading=true;baseCalls.push({id,noStory:!!opt.noStory});
   const okLoad=await new Promise(r=>{pendingLoad=r;});if(!okLoad){loading=false;return false;}
   room={id,layer:opt.layer||layer,enemies:[]};if(opt.layer)layer=opt.layer;loading=false;if(!opt.noStory)enterNarrative(regionById[id]);return true;}
  function finish(v=true){const r=pendingLoad;pendingLoad=null;if(r)r(v);}`,g);
 if(o.innerAwait)vm.runInContext('(()=>{const b=enterRegion;enterRegion=async function(...a){await new Promise(r=>setTimeout(r,500));return b.apply(this,a);};})()',g);
 if(o.coop)vm.runInContext('window.__STORYWORLD_COOP_SIM_R62__={mode:()=>"host"};',g);
 if(o.cinema)vm.runInContext('window.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true}),inspect:()=>({current:null,queue:0})};',g);
 // 게임과 같은 순서: R617 → R619 → R1036 → R369
 for(const s of [s617,s619,src,s369])vm.runInContext(s,g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
const flush=g=>{for(let k=0;k<80;k++){const due=g.__to.filter(t=>t.f&&t.at<=g.__now);if(!due.length)break;for(const t of due){const f=t.f;t.f=null;f();}}};
const step=(g,n=1,ms=100)=>{for(let i=0;i<n;i++){g.__now+=ms;run(g,'tick(.1)');flush(g);}};
const settle=async g=>{for(let i=0;i<6;i++)await null;};
const v617=g=>g.__dom.get('r617v'),v369=g=>g.__dom.get('r369v'),vidOf=root=>root?.children.find(n=>n.tag==='video');
const I617=g=>g.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.inspect(),api=g=>g.__STORYWORLD_ENTRY_VIDEO_R1036__;
async function enter(g,id,layer='STORY'){const p=run(g,`enterRegion("${id}",null,{layer:"${layer}"})`);await settle(g);return [p];}
(async()=>{
// 정상: last302 첫 입장 — 로딩 시작과 함께 해안 영상, 로딩은 뒤에서
{const g=env();ok('entry: API exposed',!!api(g)&&typeof api(g).inspect==='function');
 const [p]=await enter(g,'last302');
 ok('entry: beach video opens the moment loading starts (loading still on)',!!v617(g)&&run(g,'loading')===true&&I617(g).open==='beach');
 step(g,30);ok('entry: video survives ticks while the old room is still shown under loading',!!v617(g)&&I617(g).open==='beach');
 ok('entry: engine asked not to open the entry story under the video',run(g,'baseCalls[0].noStory')===true);
 run(g,'finish(true)');await p;await settle(g);step(g,5);
 ok('entry: after load the video keeps playing in the new room (adopted, not closed as room change)',I617(g).open==='beach'&&run(g,'room.id')==='last302');
 ok('entry: entry story waits for the video',run(g,'narr.length')===0);
 const v=vidOf(v617(g));v.fire('playing');v.currentTime=8;v.fire('timeupdate');v.fire('ended');step(g,20);
 ok('entry: video closed after end',!v617(g)&&I617(g).open===null);
 ok('entry: entry story opens once after the video',run(g,'narr.join()')==='last302');
 ok('entry: beach marked seen',I617(g).prefs.seen.includes('beach'));
 step(g,60);ok('entry: beach does not play a second time after the story',!v617(g)&&I617(g).stats.plays===1);}
// 회귀(헤드리스 실측 1.0초 만에 닫힘): 바깥 감싸개가 엔진 로딩을 켜기 전에 await 하면, 그 틈에 옛 방·loading=false 로 보이는 tick 이 돈다 → 그래도 닫지 않는다
{const g=env({innerAwait:true});const [p]=await enter(g,'last302');ok('inner await: video opened',!!v617(g));
 step(g,4,100);ok('inner await: before engine loading starts (old room, loading off) the video stays',!!v617(g)&&run(g,'loading')===false);
 step(g,2,100);await settle(g);ok('inner await: engine now loading, video still there',!!v617(g)&&run(g,'loading')===true);
 run(g,'finish(true)');await p;await settle(g);step(g,3);ok('inner await: adopted after load',I617(g).open==='beach'&&run(g,'room.id')==='last302');}
// 영상이 로딩보다 먼저 끝남 → 로딩이 끝날 때까지 기다렸다가 서사
{const g=env();const [p]=await enter(g,'last302');const v=vidOf(v617(g));v.fire('playing');v.fire('ended');step(g,20);
 ok('short video: closed while loading, story not yet (still loading)',!v617(g)&&run(g,'narr.length')===0&&run(g,'loading')===true);
 run(g,'finish(true)');await p;await settle(g);step(g,5);ok('short video: story opens after load completes',run(g,'narr.join()')==='last302');}
// 건너뛰기도 같은 길
{const g=env();const [p]=await enter(g,'last302');run(g,'finish(true)');await p;await settle(g);g.__STORYWORLD_HWANDO_FALL_VIDEO_R617__.skip();step(g,10);ok('skip: story opens after skip',run(g,'narr.join()')==='last302'&&I617(g).prefs.seen.includes('beach'));}
// R369 ep1a10 도 같은 방식
{const g=env();const [p]=await enter(g,'ep1a10');ok('ep1a10: poison-city video opens with loading',!!v369(g)&&run(g,'loading')===true);
 run(g,'finish(true)');await p;await settle(g);step(g,5);ok('ep1a10: kept after load, story waits',!!v369(g)&&run(g,'narr.length')===0);
 const v=vidOf(v369(g));v.fire('playing');v.fire('ended');step(g,20);ok('ep1a10: story after video, seen saved',!v369(g)&&run(g,'narr.join()')==='ep1a10'&&g.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect().prefs.seen===true);
 step(g,40);ok('ep1a10: no second play',g.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect().stats.plays===1);}
// 경계: 이미 봄 → 예전 흐름(엔진이 서사를 바로 연다)
{const g=env({store:{'storyworld.r617.hwandofall':JSON.stringify({seen:['beach']})}});const [p]=await enter(g,'last302');ok('seen: no early video',!v617(g)&&run(g,'baseCalls[0].noStory')===false);run(g,'finish(true)');await p;ok('seen: engine opens story itself',run(g,'narr.join()')==='last302');}
// 경계: 사몽(DREAM)·협동·자동 검사·영화 모드·끔
for(const [label,o,layer] of [['DREAM layer',{},'DREAM'],['coop',{coop:true},'STORY'],['webdriver',{webdriver:true},'STORY'],['cinema-mode narration',{cinema:true},'STORY'],['R1036 off',{store:{'storyworld.r1036.entryvideo':'{"on":false}'}},'STORY'],['R617 off',{store:{'storyworld.r617.hwandofall':'{"on":false}'}},'STORY']]){
 const g=env(o);const [p]=await enter(g,'last302',layer);ok(label+': no early video, engine story untouched',!v617(g)&&run(g,'baseCalls[0].noStory')===false);run(g,'finish(true)');await p;}
{const g=env({webdriver:true,search:'?vid617=1'});await enter(g,'last302');ok('webdriver + ?vid617=1: early video allowed (test hook same as R617)',!!v617(g));}
// 경계: 이미 로딩 중이면 손대지 않음(엔진도 거절)
{const g=env();run(g,'loading=true');const [rp]=await enter(g,'last302');const r=await rp;ok('already loading: nothing opens',!v617(g)&&r===false);}
// 경계: 다른 영상이 이미 열려 있으면 기다림(예전 흐름)
{const g=env();g.__dom.set('r368v',{id:'r368v'});const [p]=await enter(g,'last302');ok('another video open: no early video',!v617(g)&&run(g,'baseCalls[0].noStory')===false);run(g,'finish(true)');await p;}
// 경계: 진입 실패 → 영상 닫고 서사 없음
{const g=env();const [p]=await enter(g,'last302');run(g,'finish(false)');const r=await p;await settle(g);step(g,10);ok('load failed: video closed, no story',r===false&&!v617(g)&&run(g,'narr.length')===0);}
// 경계: 영상 중 다른 지역으로 가면 닫힘·서사 안 엶
{const g=env();const [p]=await enter(g,'last302');run(g,'finish(true)');await p;await settle(g);step(g,3);run(g,'room={id:"hub",layer:"STORY",enemies:[]}');step(g,10);ok('left the zone: video closed, no stale story',!v617(g)&&run(g,'narr.length')===0);}
// 회귀: 다른 지역은 예전 그대로
{const g=env();const [p]=await enter(g,'ep1a09');ok('other zone: no video, engine story',!v617(g)&&!v369(g)&&run(g,'baseCalls[0].noStory')===false);run(g,'finish(true)');await p;ok('other zone: story by engine',run(g,'narr.join()')==='ep1a09');}
// 회귀: 오버레이 끔이면 R617 예전 흐름(서사창 닫힌 뒤 0.7초 해안)
{const g=env({store:{'storyworld.r1036.entryvideo':'{"on":false}'}});const [p]=await enter(g,'last302');run(g,'finish(true)');await p;await settle(g);step(g,10);ok('off: old R617 flow plays beach after entry',!!v617(g));}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL crash',e);process.exit(1);});
