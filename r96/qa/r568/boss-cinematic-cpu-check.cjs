// R568 CPU 검사: 주요 서사 보스 마주침 컷신(게임 안 실시간 그림, 영상 파일 없음).
//  · 연결(소스=런타임 사본, 스크립트 태그 위치, verify-r96-public 목록, pages.yml 검사 줄)
//  · 정본 문장은 그대로(지어내지 않음), R450 박자 줄과 겹치지 않음, 맘몬 지역 제외, 게임 판정 쓰기 없음, 새 자산 없음
//  · 시작 조건: STORY 층·보스전 열림(room.engaged)·보스 살아 있음·서사 장면/창 닫힘·혼자 플레이·영화 모드 아님·자동 검사(webdriver) 아님·설정 켬
//  · 재생 중 게임 시간 멈춤(엔진 tick 건너뜀), 끝나면 다시 흐름, 같은 보스는 한 번(저장), 다른 지역으로 가면 닫힘
//  · 컷 흐름(0~DUR 초): 열기 → 공간 → 영웅 → 보스 → 닫기, 경계 시각
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='boss-cinematic-r568.js';
let src='';try{src=C(F);}catch(_){}
ok(F+' exists',!!src);
let rt='';try{rt=RT(F);}catch(_){}
ok(F+' runtime copy matches source',!!src&&src===rt);
try{new vm.Script(src);ok(F+' syntax',!!src);}catch(e){ok(F+' syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, after battle-beats-r450',html.split('"./'+F+'"').length===2&&html.indexOf('"./battle-beats-r450.js"')<html.indexOf('"./'+F+'"'));
ok('script tag before combat-r118 (tail order kept)',html.indexOf('"./'+F+'"')<html.lastIndexOf('"./combat-r118.js"'));
ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r568\/boss-cinematic-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('no gameplay writes (hp/damage/save/attack/engaged)',!!src&&!/\.hp\s*=[^=]|\.damage\s*=|saveGame\(|\.attack\s*=[^=]|\.engaged\s*=[^=]/.test(src));
ok('no new media files (no mp4/webm/png/jpg literal)',!!src&&!/\.(mp4|webm|png|jpe?g|webp|ogg|mp3)['"]/.test(src));
ok('Mammon zones (ep1b06, ep1b06b) not in table',!!src&&!/['"]ep1b06b?['"|]/.test(src));
ok('no canvas filter blur/drop-shadow on game ctx (only own canvas)',!!src&&!/\bctx\.filter\s*=/.test(src));
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}

// ---- 가짜 브라우저 ----
function fakeCtx(){const calls=[];return new Proxy({calls,canvas:{width:1280,height:720}},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{calls.push([k,a]);return{addColorStop(){}};};if(k==='measureText')return s=>({width:String(s).length*10});return(...a)=>{calls.push([k,a]);};},set(t,k,v){t[k]=v;if(k==='fillStyle')calls.push(['fillStyle',[v]]);return true;}});}
function el(tag){const n={tag,style:{},children:[],dataset:{},classList:{s:new Set(),add(c){this.s.add(c);},remove(c){this.s.delete(c);},contains(c){return this.s.has(c);}},
 setAttribute(){},removeAttribute(){},appendChild(c){this.children.push(c);c.parentNode=this;return c;},insertBefore(c){this.children.unshift(c);return c;},remove(){this.removed=true;},
 addEventListener(){},removeEventListener(){},querySelector(){return el('div');},querySelectorAll(){return[];},getContext(){return n.ctx||(n.ctx=fakeCtx());},isConnected:true,width:1280,height:720,textContent:'',focus(){}};return n;}
function env(o={}){const store=new Map(Object.entries(o.store||{}));const nodes=[];
 const doc={createElement:t=>{const n=el(t);nodes.push(n);return n;},getElementById:()=>null,head:el('head'),body:el('body'),querySelectorAll:()=>[],activeElement:null,hidden:false};
 const g={localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},document:doc,navigator:{webdriver:!!o.webdriver},
  matchMedia:()=>({matches:false}),performance:{now:()=>g.__now},__now:0,console,nodes,store,innerWidth:o.w||1280,innerHeight:o.h||720,devicePixelRatio:1,location:{search:o.search||''},
  requestAnimationFrame:f=>{g.__raf.push(f);return g.__raf.length;},cancelAnimationFrame(){},__raf:[],setTimeout:(f,ms)=>{g.__to.push([f,ms]);return g.__to.length;},clearTimeout(){},__to:[],
  addEventListener(){},removeEventListener(){},Image:function(){return el('img');}};
 g.window=g;vm.createContext(g);vm.runInContext(C('story-canon-r106-data.js'),g);vm.runInContext(C('battle-beats-r450.js').replace(/^/,''),g);
 vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,layer="STORY",ticks=0,player={x:10,y:10,hp:100,hero:"hwando",direction:"right"};
  var heroArt={hwando:{awakening:"assets/rc91/awakening/hwando.png",idle:{right:"h-idle-r",left:"h-idle-l",front:"h-f",back:"h-b"}}};
  var regionById={ep1a11:{title:"천사의 가면과 의목사 후보생",chapter:"제1부 — 마지막 수호자 EGO"},ep1b07:{title:"불을 지른 남자",chapter:"x"}};
  var keys=new Set();var ready=new Set(["assets/rc91/awakening/hwando.png","boss.webp","h-idle-r","h-b"]);
  function readyImage(p){return ready.has(p)?{image:{naturalWidth:512,naturalHeight:512},crop:{x:0,y:0,w:512,h:512}}:null}
  function ensureImages(ps){for(const p of ps)ready.add(p);return Promise.resolve();}
  function project(x,y){return{x:640+(x-y)*20,y:360+(x+y)*10}}
  var boss={nativeId:"a11-boss",name:"루시퍼 · 가면 벗은 초천사",boss:true,hp:1000,maxHp:1000,spawnState:"active",x:14,y:10,path:"boss.webp"};
  var room={id:"ep1a11",layer:"STORY",engaged:false,enemies:[boss]};
  function tick(dt){ticks++;time+=dt;}`,g);
 if(o.cinema)vm.runInContext('window.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};',g);
 if(o.coop)vm.runInContext('window.__STORYWORLD_COOP_SIM_R62__={mode:()=>"host"};',g);
 vm.runInContext(src,g);return g;}
const step=(g,n=1,dt=1/60)=>{for(let i=0;i<n;i++){g.__now+=dt*1000;vm.runInContext('tick('+dt+')',g);const fs=g.__raf.splice(0);for(const f of fs)f(g.__now);}};
const api=g=>g.__STORYWORLD_BOSS_CINEMATIC_R568__;

// 기본: API·표·문장
{const g=env(),A=api(g);ok('API exposed',!!A&&typeof A.play==='function'&&typeof A.inspect==='function'&&typeof A.shotAt==='function');
 const T=A?.TABLE||[];ok('pilot entry ep1a11 a11-boss present',T.some(r=>r.zone==='ep1a11'&&r.enemy==='a11-boss'));
 const Z=g.__STORYWORLD_STORY_CANON_R106__.zones,B=g.__STORYWORLD_BATTLE_BEATS_R450__;
 const caps=T.map(r=>({r,text:A.caption(r.zone,r.enemy)}));
 ok('every caption resolves to a canon sentence',caps.length>0&&caps.every(c=>c.text&&c.text.length>8));
 ok('every caption verbatim in its zone canon',caps.every(c=>Z[c.r.zone].blocks.some(b=>b.paras.some(p=>p.replace(/\s*\n\s*/g,' ').includes(c.text)))));
 const beatTexts=new Set(B.resolveAll().map(x=>x.text));ok('captions differ from R450 beat lines (no duplicate line after cut)',caps.every(c=>!beatTexts.has(c.text)));
 ok('table rows only boss zones with known canon',T.every(r=>Z[r.zone]));
 const d=A.duration;ok('duration 8~12s',d>=8&&d<=12);
 ok('shot at 0 = open',A.shotAt(0)==='open');ok('shot at 1.5 = place',A.shotAt(1.5)==='place');ok('shot at 4.5 = hero',A.shotAt(4.5)==='hero');ok('shot at 7.5 = boss',A.shotAt(7.5)==='boss');
 ok('shot at duration-.2 = close',A.shotAt(d-.2)==='close');ok('shot past end = done',A.shotAt(d+.1)==='done');ok('shot negative = open',A.shotAt(-1)==='open');
 const cuts=A.cuts;ok('cuts strictly increasing',Array.isArray(cuts)&&cuts.every((c,i)=>i===0||c>cuts[i-1]));}

// 시작 조건
function fight(g){vm.runInContext('room.engaged=true',g);}
{const g=env();step(g,30);ok('no play before boss fight opens',!api(g).inspect().active);fight(g);step(g,3);const s=api(g).inspect();ok('plays when boss fight opens',s.active&&s.key==='ep1a11|a11-boss');
 const t0=g.ticks;step(g,60);ok('game time paused while playing (engine tick skipped)',g.ticks===t0);
 ok('bgmGain stays 1 (BGM untouched)',api(g).bgmGain()===1);
 step(g,Math.ceil(api(g).duration*60)+80);const s2=api(g).inspect();ok('ends by itself after duration',!s2.active&&s2.stats.ended===1);
 for(const [f] of g.__to.splice(0))f();const t1=g.ticks;step(g,10);ok('game time resumes after',g.ticks>t1);
 ok('seen saved',/a11-boss/.test(g.store.get('storyworld.r568.cine')||''));
 vm.runInContext('room.engaged=false',g);step(g,5);fight(g);step(g,5);ok('same boss not replayed',!api(g).inspect().active);}
{const g=env({store:{'storyworld.r568.cine':JSON.stringify({on:true,seen:['ep1a11|a11-boss']})}});fight(g);step(g,5);ok('seen from save → no replay',!api(g).inspect().active);}
{const g=env();vm.runInContext('storyScene={id:"pre"}',g);fight(g);step(g,10);ok('waits while story scene open',!api(g).inspect().active);vm.runInContext('storyScene=null',g);step(g,3);ok('plays after story scene closes',api(g).inspect().active);}
{const g=env();vm.runInContext('modal="settings"',g);fight(g);step(g,5);ok('waits while a panel is open',!api(g).inspect().active);}
{const g=env({cinema:true});fight(g);step(g,5);ok('cinema mode (R370 voice) → no play',!api(g).inspect().active);}
{const g=env({coop:true});fight(g);step(g,5);ok('co-op → no play',!api(g).inspect().active);}
{const g=env({webdriver:true});fight(g);step(g,5);ok('automation (webdriver) → no auto play',!api(g).inspect().active);ok('force play works under webdriver',api(g).play({force:true})===true&&api(g).inspect().active);}
{const g=env({webdriver:true,search:'?cine568=1'});fight(g);step(g,5);ok('?cine568=1 forces auto play under webdriver',api(g).inspect().active);}
{const g=env({store:{'storyworld.r568.cine':JSON.stringify({on:false})}});fight(g);step(g,5);ok('setting off → no play',!api(g).inspect().active);}
{const g=env();vm.runInContext('layer="DREAM";room.layer="DREAM"',g);fight(g);step(g,5);ok('DREAM layer → no play',!api(g).inspect().active);}
{const g=env();vm.runInContext('boss.hp=0',g);fight(g);step(g,5);ok('boss already dead → no play',!api(g).inspect().active);}
{const g=env();vm.runInContext('boss.spawnState="hidden";',g);fight(g);step(g,5);ok('boss still hidden → no play',!api(g).inspect().active);vm.runInContext('boss.spawnState="active"',g);step(g,3);ok('plays once boss wakes',api(g).inspect().active);}
{const g=env();vm.runInContext('room.id="ep1b06";boss.nativeId="b06-boss"',g);fight(g);step(g,5);ok('unlisted boss (Mammon) → no play',!api(g).inspect().active);}
{const g=env();vm.runInContext('boss.r61Clone=true',g);fight(g);step(g,5);ok('R61 clone ignored',!api(g).inspect().active);}
{const g=env();vm.runInContext('player.hp=0',g);fight(g);step(g,5);ok('hero down → no play',!api(g).inspect().active);}
// 건너뛰기·지역 이동
{const g=env();fight(g);step(g,3);ok('skip() closes',api(g).skip()===true);for(const [f] of g.__to.splice(0))f();ok('after skip inactive, counted',!api(g).inspect().active&&api(g).inspect().stats.skips===1);ok('skip also marks seen',/a11-boss/.test(g.store.get('storyworld.r568.cine')||''));}
{const g=env();fight(g);step(g,3);vm.runInContext('room={id:"ep1b07",layer:"STORY",engaged:false,enemies:[]}',g);step(g,2);for(const [f] of g.__to.splice(0))f();ok('room change closes cutscene',!api(g).inspect().active);}
// 그림이 없으면 그 컷을 건너뛰되 멈추지 않는다
{const g=env();vm.runInContext('ready.delete("boss.webp");ready.delete("assets/rc91/awakening/hwando.png");ensureImages=()=>Promise.reject(new Error("x"));',g);fight(g);step(g,3);const A=api(g);
 step(g,Math.ceil(A.duration*60)+80);ok('missing art: still ends, no throw',!A.inspect().active&&A.inspect().stats.errors===0);}
// at= 고정 프레임(검사용)
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:7.2});step(g,30);const s=A.inspect();ok('frozen at= stays on boss shot',s.active&&s.shot==='boss');A.skip();}
// 그림이 잘리지 않음: 영웅·보스 컷에서 그림(9인자 drawImage)이 화면 안, 위아래 검은 띠 안쪽에 다 들어간다(PC·폰 가로·폰 세로)
for(const [w,h] of [[1280,720],[844,390],[390,844],[1920,1080]]){
 for(const t of [3.6,4.5,5.9,6.4,7.0,8.2,9.1]){const g=env({webdriver:true,w,h});const A=api(g);A.play({force:true,at:t});step(g,2);
  const cv=g.nodes.find(n=>n.id==='r568c');const W=cv.width,H=cv.height,bar=H*.115,tol=Math.max(3,H*.02);
  const draws=(cv.ctx?.calls||[]).filter(([k,a])=>k==='drawImage'&&a.length===9).map(([,a])=>({x:a[5],y:a[6],w:a[7],h:a[8]}));
  const bad=draws.filter(d=>d.x<-tol||d.x+d.w>W+tol||d.y<bar-tol||d.y+d.h>H-bar+tol);
  ok(`art not cut ${w}x${h} t=${t} (${draws.length} art draws)`,draws.length>0&&bad.length===0);if(bad.length)console.log('  cut',JSON.stringify(bad.map(d=>[d.x|0,d.y|0,d.w|0,d.h|0])),'frame',W,H);A.skip();}}
// 보스 이름 카드는 아래 띠 안(그림을 가리지 않게)
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:8.2});step(g,2);const cv=g.nodes.find(n=>n.id==='r568c');const H=cv.height;
 const names=(cv.ctx?.calls||[]).filter(([k,a])=>k==='fillText'&&/루시퍼/.test(a[0]));ok('boss name drawn in the bottom bar',names.length>0&&names.every(([,a])=>a[2]>=H*(1-.115)));}
// 이름 카드는 검은 띠를 칠한 뒤에 그려져야 보인다(띠에 덮이면 안 됨)
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:8.2});step(g,1);const cv=g.nodes.find(n=>n.id==='r568c');const H=cv.height,calls=cv.ctx.calls;
 const lastBar=calls.map(([k,a],i)=>k==='fillRect'&&a[1]>=H*.8&&a[3]>=H*.1?i:-1).filter(i=>i>=0).pop(),nameAt=calls.findIndex(([k,a])=>k==='fillText'&&/루시퍼/.test(a[0]));
 ok('boss name drawn after the bottom bar (visible)',nameAt>lastBar&&lastBar>=0);}
// 원본 그림 자체가 칼로 자른 듯 끝나는 경우(그림 끝 열에 불투명 픽셀이 길게 늘어섬) 알아보기 — 루시퍼 그림 오른쪽 날개
{const g=env();const A=api(g);ok('edgeCut API',typeof A.edgeCut==='function');
 if(A.edgeCut){ok('long opaque run on right end column → right',JSON.stringify(A.edgeCut(2,120,294))===JSON.stringify(['right']));
  ok('left end column → left',JSON.stringify(A.edgeCut(90,0,294))===JSON.stringify(['left']));
  ok('sparse ends (normal soft edge) → none',A.edgeCut(6,9,294).length===0);
  ok('boundary 12% exactly → none, above → cut',A.edgeCut(0,Math.floor(294*.12),294).length===0&&A.edgeCut(0,Math.ceil(294*.12)+1,294).length===1);
  ok('both sides → both',A.edgeCut(80,80,294).length===2);ok('zero height safe',A.edgeCut(5,5,0).length===0);}}
// 7분야 심사 1차 지적 고침: ① 어깨 너머 영웅은 게임의 실제 뒷모습 그림(idle.back) ② 번쩍은 화면 전체가 아니라 보스 뒤에서 퍼지는 빛 ③ 잿불은 네모가 아님
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:7.4});step(g,2);ok('over-the-shoulder hero uses real back-view art',A.inspect().backView===true);A.skip();}
{const g=env({webdriver:true});vm.runInContext('ready.delete("h-b");ensureImages=()=>Promise.resolve();',g);const A=api(g);A.play({force:true,at:7.4});step(g,2);ok('no back-view art → falls back without error',A.inspect().backView===false&&A.inspect().stats.errors===0);A.skip();}
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:6.75});step(g,1);const cv=g.nodes.find(n=>n.id==='r568c'),W=cv.width,H=cv.height,c=cv.ctx.calls;let st=null,full=0,radial=0;
 for(const [k,a] of c){if(k==='fillStyle')st=a[0];if(k==='fillRect'&&a[0]===0&&a[1]===0&&a[2]===W&&a[3]===H&&st===A.TABLE[0].light)full++;if(k==='createRadialGradient')radial++;}
 ok('reveal flash is not a full-screen light-colour fill',full===0);ok('reveal flash uses a radial burst',radial>=2);}
{const g=env({webdriver:true});const A=api(g);A.play({force:true,at:2});step(g,1);const c=g.nodes.find(n=>n.id==='r568c').ctx.calls;const sq=c.filter(([k,a])=>k==='fillRect'&&a[2]<6&&a[3]<6).length,fl=c.filter(([k])=>k==='fill').length;
 ok('embers are not tiny squares',sq===0&&fl>=20);}
// 리뷰 지적(Codex #366): ① 뒤에 실린 tick 감싸개(mobile-bonus-r286 등)도 컷신 동안 돌지 않아야 한다(재사용 대기 회복 금지)
{const g=env();vm.runInContext('var cdTicks=0;(function(){const b=tick;tick=function(dt){cdTicks++;player.blinkCD=Math.max(0,(player.blinkCD??10)-dt);return b.apply(this,arguments);};})();player.blinkCD=10;',g);
 fight(g);step(g,3);ok('outer wrapper started before cutscene',api(g).inspect().active);const c0=g.cdTicks,b0=g.player.blinkCD;step(g,300);
 ok('later tick wrappers paused during cutscene (cooldown frozen)',g.cdTicks===c0&&g.player.blinkCD===b0);api(g).skip();for(const [f] of g.__to.splice(0))f();step(g,5);ok('later wrappers run again after',g.cdTicks>c0);}
// ② 폰 세로에서 보스 이름이 화면 폭을 넘지 않게(그리기 최대 폭 지정), BOSS 표시는 화면 밖으로 나가지 않게
{const g=env({webdriver:true,w:390,h:844});const A=api(g);A.play({force:true,at:8.2});step(g,1);const cv=g.nodes.find(n=>n.id==='r568c'),W=cv.width;
 const nm=cv.ctx.calls.filter(([k,a])=>k==='fillText'&&/루시퍼/.test(a[0]));ok('portrait: name drawn with maxWidth inside screen',nm.length>0&&nm.every(([,a])=>a[3]>0&&a[3]<=W*.92&&a[1]-a[3]/2>=0&&a[1]+a[3]/2<=W));
 const lb=cv.ctx.calls.filter(([k,a])=>k==='fillText'&&/B O S S/.test(a[0]));ok('portrait: BOSS label not off-screen',lb.every(([,a])=>a[1]-a[0].length*10>=0));A.skip();}
// ③ '흔들림·강한 점멸 줄이기'(settings.reducedMotion)면 흔들림 없음, 번쩍 약하게
function shakeAt(o){const g=env({webdriver:true});if(o)vm.runInContext('var settings={reducedMotion:true,sound:false,volume:0};',g);const A=api(g);A.play({force:true,at:6.8});step(g,1);const c=g.nodes.find(n=>n.id==='r568c').ctx.calls;
 return{tr:c.filter(([k,a])=>k==='translate'&&(Math.abs(a[0])>0||Math.abs(a[1])>0)).length,st:c.filter(([k])=>k==='fillStyle').map(([,a])=>String(a[0]))};}
{const n=shakeAt(false),r=shakeAt(true);ok('normal: shake present at reveal',n.tr>0);ok('reduced motion: no shake',r.tr===0);}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
