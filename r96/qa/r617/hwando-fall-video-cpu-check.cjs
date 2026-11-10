// R617 CPU 검사: 환도의 기억 서사 영상 3편(타락천사 기사 강림 · 추락 · 해변).  node r96/qa/r617/hwando-fall-video-cpu-check.cjs
//  · 연결: 소스=런타임 사본, 스크립트 태그(R372 뒤·combat-r118 앞), verify-r96-public 목록·자산, pages.yml, bgm-map-r308 배수, 매니페스트
//  · 자산: index.json 크기·sha256, mp4 faststart·편당 1MB 이하·합계 2MB 이하, 포스터, 원본 영상 미포함, 처리 기록(자르지 않음·delogo)
//  · 자막: 정본 개선본 last301·last302 문장 그대로, 시간 순서·끝까지
//  · 동작(가짜 브라우저): knight=보스 깨어날 때 / fall=보스 쓰러진 뒤 1.2초 / beach=last302 입장 서사창 닫힌 뒤 0.7초,
//    경계(서사창·창·협동·webdriver·사몽 층·다른 지역·이미 봄·꺼짐), 재생 중 tick 멈춤(바깥 감싸개 포함)·끝나면 흐름, 다른 지역으로 가면 닫힘, 실패 시 다시
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='hwando-fall-video-r617.js';let src='';try{src=C(F);}catch(_){}
ok(F+' exists',!!src);ok(F+' runtime copy matches source',!!src&&src===RT(F));
ok('bgm-map-r308 runtime copy matches source',C('bgm-map-r308.js')===RT('bgm-map-r308.js'));
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html'),tag='"./'+F+'"';
ok('script tag once on its own line after swamp-hands-r474 (outside the r176/r266 tag chains), before combat-r118 (later tick wrappers are gated at play time by gateOuter)',html.split(tag).length===2&&html.includes('\n<script src='+tag+'></script>\n')&&html.indexOf('"./swamp-hands-r474.js"')<html.indexOf(tag)&&/function gateOuter\(/.test(src)&&html.indexOf(tag)<html.lastIndexOf('"./combat-r118.js"'));
const ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');
ok('verify-r96-public.py lists js and assets/r617/ (no missing comma)',ver.includes("'"+F+"'")&&/assets\/r617\//.test(ver)&&!/\.js''/.test(ver));
ok('pages.yml runs this check',/node r96\/qa\/r617\/hwando-fall-video-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('bgm-map-r308 multiplies R617 bgmGain',/__STORYWORLD_HWANDO_FALL_VIDEO_R617__\?\.bgmGain\?\.\(\)\?\?1/.test(C('bgm-map-r308.js')));
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}
const A=['assets/r617/index.json','assets/r617/knight.mp4','assets/r617/fall.mp4','assets/r617/beach.mp4','assets/r617/knight-poster.jpg','assets/r617/fall-poster.jpg','assets/r617/beach-poster.jpg'];
ok('runtime-manifest has overlay and all R617 assets (R372·R369 kept)',[F,...A,'root-gate-video-r372.js','assets/r369/poison-city.mp4'].every(p=>man.includes('"'+p+'"')));
// ---- 자산 ----
let IDX=null;try{IDX=JSON.parse(RT('assets/r617/index.json'));}catch(_){}
ok('index.json present with 6 files',!!IDX&&Array.isArray(IDX.files)&&IDX.files.length===6);
let total=0;for(const f of IDX?.files||[]){let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(f.path+' size·sha256 match',!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256);
 ok(f.path+' table: source·use·process·applied',f.applied===true&&!!f.use&&!!f.process&&!!f.source);
 if(b&&/\.mp4$/.test(f.path)){total+=b.length;ok(f.path+' mp4 faststart ≤1MB ('+b.length+')',b.slice(4,8).toString()==='ftyp'&&b.length<=1000000&&b.indexOf('moov')>0&&b.indexOf('moov')<b.indexOf('mdat'));
  ok(f.path+' processed without crop (pad/overlay) and logo removed',/자르지 않/.test(f.process)&&/delogo/.test(f.process));}
 if(b&&/\.jpg$/.test(f.path))ok(f.path+' jpeg ≤60KB',b[0]===0xff&&b[1]===0xd8&&b.length<=60000);}
ok('three videos total ≤2MB ('+total+')',total>0&&total<=2000000);
ok('user original videos not committed',fs.readdirSync(path.join(R,'client-source')).every(n=>!/dreamina|타락천사|배경만/.test(n))&&(()=>{try{return fs.readdirSync(path.join(R,'runtime-text/assets/r617')).every(n=>/^(knight|fall|beach)(-poster)?\.(mp4|jpg)$|^index\.json$/.test(n));}catch(_){return false;}})());
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}
// ---- 정적 ----
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');const code=strip(src);
ok('no gameplay writes (hp/damage/save/engaged/spawnState)',!/\.hp\s*-?=[^=]|damage\s*\(|saveGame\(|\.engaged\s*=[^=]|\.spawnState\s*=[^=]|ctx\.filter|fetch\(/.test(code));
ok('Mammon zones untouched',!/ep1b06/.test(code));
// ---- 가짜 브라우저 ----
function cls(){const s=new Set();return{s,add:c=>s.add(c),remove:c=>s.delete(c),contains:c=>s.has(c),toggle:(c,v)=>{if(v===undefined?!s.has(c):v)s.add(c);else s.delete(c);}};}
function el(tag,g){const L={};const n={tag,style:{},children:[],classList:cls(),attrs:{},L,setAttribute(k,v){n.attrs[k]=v;},removeAttribute(k){delete n.attrs[k];if(k==='src')n.src='';},
 appendChild(c){n.children.push(c);c.parentNode=n;return c;},insertBefore(c){n.children.unshift(c);c.parentNode=n;return c;},remove(){n.removed=true;g.__dom.delete(n.id);},
 addEventListener(t,f){(L[t]=L[t]||[]).push(f);},removeEventListener(t,f){L[t]=(L[t]||[]).filter(x=>x!==f);},fire(t,e={}){for(const f of [...(L[t]||[])])f({type:t,target:n,preventDefault(){},stopPropagation(){},...e});},
 _q:{},querySelector(s){return n._q[s]||(n._q[s]=el('div',g));},textContent:'',focus(){},src:'',currentTime:0,paused:true,
 load(){},pause(){n.paused=true;},play(){n.paused=false;n.playCalls=(n.playCalls||0)+1;return g.__playFail?{catch(f){f(new Error('blocked'));}}:{catch(){}};}};
 Object.defineProperty(n,'innerHTML',{set(v){n._html=v;},get(){return n._html||'';}});
 Object.defineProperty(n,'id',{set(v){n._id=v;if(v)g.__dom.set(v,n);},get(){return n._id;}});return n;}
function env(o={}){const store=new Map(Object.entries(o.store||{}));const g={__dom:new Map(),__to:[],__now:0,__playFail:!!o.playFail,console};
 const doc={createElement:t=>{const n=el(t,g);g.__made.push(n);return n;},getElementById:id=>g.__dom.get(id)||null,head:null,body:null,activeElement:null,hidden:false};g.__made=[];
 doc.head=el('head',g);doc.body=el('body',g);
 Object.assign(g,{localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},document:doc,navigator:{webdriver:!!o.webdriver},location:{search:o.search||''},
  performance:{now:()=>g.__now},requestAnimationFrame:f=>f(),setTimeout:(f,ms)=>{const id=g.__to.length+1;g.__to.push({id,f,at:g.__now+(ms||0)});return id;},
  clearTimeout:id=>{const t=g.__to.find(t=>t.id===id);if(t)t.f=null;},addEventListener(){},store});
 g.window=g;vm.createContext(g);
 vm.runInContext(`var started=true,loading=false,modal=null,storyScene=null,layer="STORY",ticks=0,outerTicks=0,player={x:1,y:1,hp:100,hero:"hwando"};
  var regionById={last301:{title:"타락천사 기사"},last302:{title:"잠들지 못하는 마을"}};var keys=new Set();
  var knight={nativeId:"l301-boss",name:"타락천사 기사",boss:true,hp:26000,spawnState:"hidden"};
  var rooms={last301:{id:"last301",layer:"STORY",engaged:false,enemies:[knight]},last302:{id:"last302",layer:"STORY",engaged:false,enemies:[]},hando01:{id:"hando01",layer:"STORY",enemies:[]}};
  var room=rooms.hando01;function tick(dt){ticks++;}
  async function enterRegion(id,s,opt){room=rooms[id]||{id,layer:(opt&&opt.layer)||"STORY",enemies:[]};if(opt&&opt.layer)room.layer=opt.layer;return room;}`,g);
 if(o.coop)vm.runInContext('window.__STORYWORLD_COOP_SIM_R62__={mode:()=>"host"};',g);
 vm.runInContext(src,g);
 if(o.outer)vm.runInContext('(()=>{const b=tick;tick=function(...a){outerTicks++;return b.apply(this,a);};})()',g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
const flush=g=>{for(let k=0;k<50;k++){const due=g.__to.filter(t=>t.f&&t.at<=g.__now);if(!due.length)break;for(const t of due){const f=t.f;t.f=null;f();}}};
const step=(g,n=1,ms=100)=>{for(let i=0;i<n;i++){g.__now+=ms;run(g,'tick(.1)');flush(g);}};
const api=g=>g.__STORYWORLD_HWANDO_FALL_VIDEO_R617__;
const ins=g=>api(g).inspect();
const vid=g=>g.__dom.get('r617v')?.children.find(n=>n.tag==='video');
const enter=async(g,id,layer='STORY')=>{await run(g,`enterRegion("${id}",null,{layer:"${layer}"})`);};
// 자막·정본
{const g=env(),Z=g&&(()=>{const c=vm.createContext({window:{}});c.window=c;vm.runInContext(C('story-canon-r106-data.js'),c);return c.__STORYWORLD_STORY_CANON_R106__.zones;})();
 const T=api(g).CLIPS;ok('three clips knight·fall·beach in story order',T.map(c=>c.id).join()==='knight,fall,beach'&&T[0].zone==='last301'&&T[1].zone==='last301'&&T[2].zone==='last302');
 const body=z=>Z[z].blocks.map(b=>b.paras.join(' ')).join(' ');
 for(const c of T){ok(c.id+' cues ordered and reach the end',c.cues.length>=2&&c.cues.every((q,i)=>q[0]<q[1]&&(i===0||c.cues[i-1][1]<=q[0]))&&c.cues[c.cues.length-1][1]>=c.seconds);
  ok(c.id+' cues are canon '+c.zone+' sentences verbatim',c.cues.every(q=>body(c.zone).includes(q[2].replace(/…$/,''))));}
 ok('fall cues come from last301 third paragraph (fall into the sea)',Z.last301.blocks[0].paras[2].includes(T[1].cues[0][2])&&Z.last301.blocks[0].paras[2].includes(T[1].cues[1][2]));
 ok('beach cues come from last302 first paragraph (waking on the shore)',Z.last302.blocks[0].paras[0].includes(T[2].cues[0][2])&&Z.last302.blocks[0].paras[0].includes(T[2].cues[1][2]));
 for(const c of T)ok(c.id+' core = original picture width share of 960×540 frame',Math.abs(c.core-({knight:540*720/1280/960,fall:540*1112/834/960,beach:540*720/1280/960})[c.id])<.005);
 ok('portrait: video widened so the original picture spans the screen width (filler only goes off-screen), capped to screen height',/@media \(orientation:portrait\)\{#r617v\{--h2:min\(50vh,calc\(28\.125vw \/ var\(--core,1\)\)\)\}#r617v video\{flex:none;width:min\(calc\(100vw \/ var\(--core,1\)\),177\.78vh\)/.test(src)&&/setProperty\?\.\('--core'/.test(src));
 ok('caption and name card follow the shown picture height (--h2)',/top:min\(calc\(50% \+ var\(--h2\) - 64px\)/.test(src)&&/top:max\(12vh,calc\(50% - var\(--h2\) \+ 28px\)\)/.test(src));
 ok('knight name card appears before the end fade (nameAt ≤ seconds-2)',T[0].nameAt!=null&&T[0].nameAt<=T[0].seconds-2);
 ok('no inverted cross / new names in captions',!/역십자|†/.test(JSON.stringify(T)));}
(async()=>{
// knight: 보스가 깨어날 때
{const g=env();await enter(g,'last301');step(g,3);ok('knight: not before boss fight opens',ins(g).open===null);
 run(g,'room.engaged=true');step(g,2);ok('knight: not while boss hidden (engaged only)',ins(g).open===null);
 run(g,'knight.spawnState="active";storyScene={}');step(g,2);ok('knight: waits while story scene open',ins(g).open===null);
 run(g,'storyScene=null');step(g,1);ok('knight: plays when boss awake and calm',ins(g).open==='knight');
 ok('knight: preloads fall video meanwhile',ins(g).preloaded.includes('fall'));
 const t0=run(g,'ticks');step(g,5);ok('knight: game tick paused during video',run(g,'ticks')===t0);
 const v=vid(g);v.currentTime=1;v.fire('timeupdate');ok('knight: first canon caption at 1s',ins(g).caption==='거센 폭풍이 몸을 밀어내어 발 디딜 곳부터 찾아야 했다.');
 v.currentTime=5.0;v.fire('timeupdate');ok('knight: no name card yet at 5.0s',!g.__dom.get('r617v').querySelector('.name').classList.contains('on'));v.currentTime=6.5;v.fire('timeupdate');ok('knight: name card on at 6.5s',g.__dom.get('r617v').querySelector('.name').classList.contains('on'));ok('knight: boss name card from game data',ins(g).name==='타락천사 기사');
 v.fire('playing');v.fire('ended');step(g,8);ok('knight: closes after end hold, saved seen',ins(g).open===null&&ins(g).prefs.seen.includes('knight'));
 const t1=run(g,'ticks');step(g,8);ok('knight: game resumes (after the 0.46s closing fade)',run(g,'ticks')>t1);
 run(g,'room.engaged=false');run(g,'room.engaged=true');step(g,3);ok('knight: only once',ins(g).open===null);
 // fall
 // 필수 패배(index.html R75 fall()): 기사는 체력 남은 채 숨고, room.r75Falling, 뒤 서사창이 열림
 run(g,'modal={}');run(g,'room.r75Falling=true;room.engaged=false;knight.hp=Math.max(1,knight.hp);knight.spawnState="hidden";storyScene=null');step(g,20);ok('fall: waits while a panel/modal (not the story scene) is open',ins(g).open===null);
 run(g,'storyScene={}');step(g,2);ok('fall: not before 0.35s (story scene sets modal too, as in the real game)',ins(g).open===null);
 step(g,3);ok('fall: plays on the R75 required fall (boss alive, hidden), over the post story scene and its modal',ins(g).open==='fall'&&run(g,'knight.hp')>0&&run(g,'!!storyScene'));
 const v2=vid(g);v2.currentTime=3;v2.fire('timeupdate');ok('fall: caption "차가운 바닷물…"',ins(g).caption.startsWith('차가운 바닷물이'));
 v2.fire('ended');step(g,8);run(g,'storyScene=null;modal=null');ok('fall: closes, saved',ins(g).open===null&&ins(g).prefs.seen.includes('fall'));
 step(g,30);ok('fall: only once',ins(g).open===null);
 // beach
 await run(g,'storyScene={}');await enter(g,'last302');step(g,10);ok('beach: waits for entry story scene',ins(g).open===null&&ins(g).pending==='beach');
 run(g,'storyScene=null');step(g,5);ok('beach: not before 0.7s',ins(g).open===null);step(g,3);ok('beach: plays after entry story closes + 0.7s',ins(g).open==='beach');
 const v3=vid(g);v3.currentTime=5;v3.fire('timeupdate');ok('beach: caption "눈을 뜨니…"',ins(g).caption.startsWith('눈을 뜨니'));ok('beach: no boss name card',ins(g).name==='');
 const s=vm.runInContext('localStorage',g);ok('bgmGain 0 while playing',api(g).bgmGain()===0);
 g.__dom.get('r617v').fire('pointerdown');ok('beach: tap skips, saved',ins(g).open===null&&ins(g).prefs.seen.includes('beach')&&api(g).bgmGain()===1);
 ok('saved to storyworld.r617.hwandofall',JSON.parse(s.getItem('storyworld.r617.hwandofall')).seen.length===3);}
// 처음부터 보스가 쓰러진 채 들어옴(knight 못 봄) → fall 은 그대로
{const g=env();await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active";knight.hp=0');step(g,15);ok('boss actually killed (other path): fall plays (knight skipped)',ins(g).open==='fall');}
{const g=env();await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active";room.r75Falling=true;storyScene={}');step(g,6);ok('fall preferred over knight when the fall already started',ins(g).open==='fall');}
// 경계
{const g=env({coop:true});await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,3);ok('coop: no video',ins(g).open===null);}
{const g=env({webdriver:true});await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,3);ok('webdriver: no video',ins(g).open===null);}
{const g=env({webdriver:true,search:'?vid617=1'});await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,3);ok('webdriver with ?vid617=1: plays',ins(g).open==='knight');}
{const g=env();await enter(g,'last302','SAMONG');step(g,20);ok('Samong layer last302: no beach',ins(g).open===null);}
{const g=env();await enter(g,'hando01');step(g,20);ok('other zone: nothing',ins(g).open===null&&ins(g).pending===null);}
{const g=env({store:{'storyworld.r617.hwandofall':JSON.stringify({on:false})}});await enter(g,'last302');step(g,20);ok('turned off: no beach',ins(g).open===null);}
{const g=env({store:{'storyworld.r617.hwandofall':JSON.stringify({seen:['beach']})}});await enter(g,'last302');step(g,20);ok('already seen: no beach',ins(g).open===null);}
{const g=env();run(g,'document.getElementById=id=>id==="r372v"?{}:null');await enter(g,'last302');step(g,20);ok('another video open: waits',ins(g).open===null&&ins(g).pending==='beach');}
{const g=env();run(g,'player.hp=0');await enter(g,'last302');step(g,20);ok('player down: waits',ins(g).open===null);}
// 다른 지역으로 가면 닫힘, 바깥 tick 감싸개도 멈춤, 실패하면 다시
{const g=env({outer:true});await enter(g,'last302');step(g,10);ok('beach opens (outer wrapper present)',ins(g).open==='beach');
 const o0=run(g,'outerTicks'),t0=run(g,'ticks');step(g,5);ok('outer wrapper paused too (gateOuter)',run(g,'outerTicks')===o0&&run(g,'ticks')===t0);
 await enter(g,'hando01');step(g,1);ok('room change closes video, not saved',ins(g).open===null&&!ins(g).prefs.seen.includes('beach')&&ins(g).stats.room===1);}
// 닫힐 때의 검은 막(0.46초)이 남아 있는 동안에도 게임은 멈춰 있다(R619 가 그 동안 그리기를 쉬므로, 보이지 않는 채 적이 움직이면 안 됨 — Codex P2)
{const g=env({outer:true});await enter(g,'last302');step(g,10);api(g).skip();const o0=run(g,'outerTicks'),t0=run(g,'ticks');
 g.__now+=100;run(g,'tick(.1)');g.__now+=100;run(g,'tick(.1)');ok('closing fade: overlay still there, game and outer wrapper still paused',!!g.__dom.get('r617v')&&run(g,'ticks')===t0&&run(g,'outerTicks')===o0);
 g.__now+=300;flush(g);ok('closing fade done: overlay removed',!g.__dom.get('r617v'));step(g,2);ok('after overlay removed: game and outer wrapper run',run(g,'ticks')>t0&&run(g,'outerTicks')>o0);}
{const g=env();await enter(g,'last302');step(g,10);const v=vid(g);v.fire('error');step(g,1);ok('video error: closes, not seen (retry next time)',ins(g).open===null&&!ins(g).prefs.seen.includes('beach'));}
{const g=env();await enter(g,'last302');step(g,10);step(g,61);ok('stall 6s: closes, not seen',ins(g).open===null&&ins(g).stats.stalled===1&&!ins(g).prefs.seen.includes('beach'));}
// Codex P2: 영화 모드(R370) 낭독이 흐르는 동안은 기다렸다가 끝나면 튼다(서사창은 R370 이 바로 닫음)
{const g=env();run(g,'var cine={on:true,current:"첫 문장",queue:2};window.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:cine.on}),inspect:()=>({current:cine.current,queue:cine.queue})};');
 await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,10);ok('cinema narration running: knight waits',ins(g).open===null);
 run(g,'cine.current=null;cine.queue=1');step(g,3);ok('cinema queue not empty: still waits',ins(g).open===null);
 run(g,'cine.queue=0');step(g,2);ok('cinema narration done: knight plays',ins(g).open==='knight');
 api(g).skip();step(g,6);run(g,'cine.current="추락 문장";room.r75Falling=true;room.engaged=false;knight.spawnState="hidden"');step(g,10);ok('cinema narration running: fall waits too',ins(g).open===null);
 run(g,'cine.current=null');step(g,6);ok('then fall plays',ins(g).open==='fall');}
{const g=env();run(g,'window.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:false}),inspect:()=>({current:"x",queue:3})};');await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,3);ok('cinema mode off: stale queue ignored',ins(g).open==='knight');}
{const g=env({playFail:true});await enter(g,'last302');step(g,10);ok('autoplay blocked: retries muted',ins(g).stats.muted===1);}
// Codex P2: 재생이 끝내 안 되면 같은 방문에서 다시 열지 않음(게임이 막히지 않게), 다음 방문에 한 번 더, 세션당 2번까지
{const g=env({playFail:true});await enter(g,'last301');run(g,'room.engaged=true;knight.spawnState="active"');step(g,60);
 ok('knight playback failure: no reopen loop in the same visit (1 play, game ticks)',ins(g).stats.plays===1&&ins(g).open===null&&run(g,'ticks')>=55);
 await enter(g,'hando01');run(g,'rooms.last301={...rooms.last301}');await enter(g,'last301');step(g,10);ok('next visit (new room object, as makeRoom does): one more try',ins(g).stats.plays===2);
 await enter(g,'hando01');run(g,'rooms.last301={...rooms.last301}');await enter(g,'last301');step(g,10);ok('session cap: at most 2 tries',ins(g).stats.plays===2);}
{const g=env();await enter(g,'last302');step(g,10);vid(g).fire('error');step(g,40);ok('async media error: not reopened in the same visit',ins(g).stats.plays===1&&ins(g).open===null);}
{const g=env();await enter(g,'last301');ok('replay API: play("fall") forced',api(g).play('fall')===true&&ins(g).open==='fall');api(g).skip();ok('skip API closes',ins(g).open===null);}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);})();
