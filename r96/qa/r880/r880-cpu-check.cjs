// R880 선화 컷씬(지역 진입, SVG 선 그림) CPU 검사 — 뜨는 조건·게임 멈춤·건너뛰기·영화 모드·정본 자막·장면 길이·그리기 값
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return null;}};
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,400));};
const ENGINE='lineart-cine-r880.js',SCENES=['lineart-scenes-r881.js','lineart-scenes-r882.js','lineart-scenes-r883.js','lineart-scenes-r884.js','lineart-scenes-r885.js','lineart-scenes-r886.js','lineart-scenes-r887.js'];
const SRC=rd(path.join(R,'client-source',ENGINE)),SC=SCENES.map(f=>rd(path.join(R,'client-source',f)));
const CANON=rd(path.join(R,'client-source','story-canon-r106-data.js'));
ok('engine file exists',!!SRC);ok('scene files exist',SC.every(Boolean));
if(!SRC||!SC.every(Boolean)){console.log(`R880 CPU ${pass}/${total}`);process.exit(1);}
// 이미 영상·컷신이 있는 곳과 다른 작업 몫(맘몬)은 넣지 않는다
const EXCLUDED=['dist00','ep1a09b','ep1a10','ep1a11','last301','last302','ep1b06','ep1b06b'];
const BATCH1=['dist01','dist02','dist03','dist04','dist05','dist06','ep1a08','ep1a09','last304','last305','last303'];
// 둘째 묶음(R882): 2부. 맘몬(ep1b06·ep1b06b)은 빼고 여덟 곳
const BATCH2=['ep1b01','ep1b02','ep1b03','ep1b04','ep1b05','ep1b07','ep1b08','ep1b09'],BATCH3=['u201','u202','u204','u205','u206','u203'],BATCH4=['kair01','kair04','kair05','kair06','kair07','kair08','kair09','kair10','kair02','kair03'],BATCH5=['hando01','hando02','hando03','murder01','murder02','murder04','murder03'],BATCH6=['cult01','cult02','cult05','cult06','cult03','cult04'],BATCH7=['dreamRest','restEp1b','restU2','restLast3','restKairo','restHando'],ALL=[...BATCH1,...BATCH2,...BATCH3,...BATCH4,...BATCH5,...BATCH6,...BATCH7];// 셋째 묶음(R883): 3부 여섯 곳 · 넷째 묶음(R884): 5부 열 곳
// ---- 가짜 DOM: 속성 값을 모두 적어 둔다 ----
function fakeDom(){const attrs=[];let made=0;const byId=new Map();
 const node=tag=>{const n={tagName:tag,children:[],attrs:{},style:{setProperty(k,v){n.style[k]=v;},removeProperty(){} },dataset:{},listeners:{},parentNode:null,textContent:'',hidden:false,
   classList:{set:new Set(),add(...c){c.forEach(x=>n.classList.set.add(x));},remove(...c){c.forEach(x=>n.classList.set.delete(x));},toggle(c,f){const on=f===undefined?!n.classList.set.has(c):!!f;on?n.classList.set.add(c):n.classList.set.delete(c);return on;},contains:c=>n.classList.set.has(c)},
   setAttribute(k,v){v=String(v);n.attrs[k]=v;attrs.push([tag,k,v]);if(k==='id')byId.set(v,n);},getAttribute:k=>n.attrs[k]??null,removeAttribute(k){delete n.attrs[k];},
   appendChild(c){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);n.children.push(c);c.parentNode=n;return c;},
   insertBefore(c,ref){if(c.parentNode)c.parentNode.children=c.parentNode.children.filter(x=>x!==c);const i=n.children.indexOf(ref);if(i<0)n.children.push(c);else n.children.splice(i,0,c);c.parentNode=n;return c;},
   removeChild(c){n.children=n.children.filter(x=>x!==c);c.parentNode=null;return c;},remove(){if(n.parentNode)n.parentNode.removeChild(n);if(n.id)byId.delete(n.id);},
   get firstChild(){return n.children[0]||null;},querySelector(){return null;},querySelectorAll(){return[];},
   addEventListener(t,f){(n.listeners[t]=n.listeners[t]||[]).push(f);},removeEventListener(){},focus(){},getScreenCTM(){return null;},getBoundingClientRect(){return{left:0,top:0,width:1280,height:720};}};
  made++;let id='';Object.defineProperty(n,'id',{get:()=>id,set(v){id=String(v);byId.set(id,n);}});return n;};
 const body=node('body'),head=node('head');
 const document={hidden:false,body,head,activeElement:null,createElement:t=>node(t),createElementNS:(_,t)=>node(t),getElementById:id=>{const n=byId.get(id);return n&&(n.parentNode||n===body)?n:null;}};
 return{document,attrs,body,byId,count:()=>made};}
function world(opt={}){const store={...(opt.store||{})};const dom=fakeDom();const frames=[];let nowMs=1000;
 const g={console,Math,Number,Object,JSON,Map,WeakMap,Set,String,Array,Date,Error,RegExp,Symbol,Promise,isFinite,parseFloat,parseInt,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},store,dom,document:dom.document,
  navigator:{webdriver:!!opt.webdriver},location:{search:opt.search||''},innerWidth:1280,innerHeight:720,devicePixelRatio:1,
  performance:{now:()=>nowMs},advance(ms){nowMs+=ms;},
  requestAnimationFrame(f){frames.push(f);return frames.length;},cancelAnimationFrame(){},setTimeout(f,ms){g.timers.push([nowMs+(ms||0),f]);return g.timers.length;},clearTimeout(){},timers:[],
  matchMedia:()=>({matches:!!opt.reduced}),winListeners:{},addEventListener(t,f){(g.winListeners[t]=g.winListeners[t]||[]).push(f);},removeEventListener(){},
  DOMPoint:function(){},
  // 엔진 전역
  started:true,loading:false,modal:null,storyScene:null,layer:'STORY',zone:'hub',time:0,keys:new Set(),settings:{reducedMotion:!!opt.reduced},
  player:{hp:100,hero:'ego',x:0,y:0},room:{id:'hub',layer:'STORY',enemies:[]},regionById:{},baseTicks:0,done:new Set(opt.completed||[])};
 for(const z of [...ALL,...EXCLUDED,'hub'])g.regionById[z]={id:z,title:'제목 '+z,chapter:'장'};
 g.window=g;g.globalThis=g;
 g.completed=(id,l)=>g.done.has((l||g.layer)+':'+id);
 g.__STORYWORLD_COOP_SIM_R62__={mode:()=>opt.coop?'host':'off'};
 if(opt.cinema)g.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};
 vm.createContext(g);
 vm.runInContext('var tick=function(){baseTicks++;};var enterRegion=async function(id,from,options){zone=id;if(options&&options.layer)layer=options.layer;room={id,layer,enemies:[]};return true;};',g);
 vm.runInContext(CANON,g);vm.runInContext(SRC,g,{filename:ENGINE});SC.forEach((s,i)=>vm.runInContext(s,g,{filename:SCENES[i]}));
 if(opt.voice){g.voiceCalls=[];g.voiceStops=0;g.__STORYWORLD_VOICE_R381__={idOf:t=>sha16(t),has:t=>R381IDS.has(sha16(t)),preload(){return true;},play(text,o={}){const c={text,o,at:nowMs,ended:null,stopped:false};g.voiceCalls.push(c);if(opt.voice==='error'){g.setTimeout(()=>o.onerror&&o.onerror(),0);}return{id:sha16(text),stop(){c.stopped=true;g.voiceStops++;}};}};if(VDATA)vm.runInContext(VDATA,g);}
 // 가짜 녹음: 실제 길이(+late)만큼 지나면 끝났다고 알린다
 g.voiceTick=(late=0)=>{for(const c of g.voiceCalls||[]){if(c.ended==null&&!c.stopped&&nowMs>=c.at+(VDUR[sha16(c.text)]+late)*1000){c.ended=nowMs;c.o.onend&&c.o.onend();}}};
 g.now=()=>nowMs;
 g.api=g.__STORYWORLD_LINEART_R880__;
 g.go=async(id,o)=>{await vm.runInContext('enterRegion',g)(id,null,o);};
 g.tk=(n=1)=>{for(let i=0;i<n;i++)vm.runInContext('tick',g)(1/60);};
 g.raf=(ms=16.7)=>{nowMs+=ms;const fs2=frames.splice(0);fs2.forEach(f=>f(nowMs));};
 g.runTimers=()=>{const due=g.timers.filter(t=>t[0]<=nowMs);g.timers=g.timers.filter(t=>t[0]>nowMs);due.forEach(t=>t[1]());};
 g.key=(type,key)=>{const ev={type,key,code:key===' '?'Space':key,repeat:false,prevented:false,preventDefault(){ev.prevented=true;},stopImmediatePropagation(){ev.stopped=true;}};(g.winListeners[type]||[]).forEach(f=>f(ev));return ev;};
 return g;}
const sha16=t=>require('crypto').createHash('sha1').update(String(t||'').trim()).digest('hex').slice(0,16);
const VFILE='lineart-voice-r888-data.js',VDATA=rd(path.join(R,'client-source',VFILE));
const R381IDS=new Set((()=>{try{return JSON.parse(rd(path.join(R,'client-source','voice-r381-data.js')).match(/Object\.freeze\((\{[\s\S]*\})\)/)[1]).ids;}catch(_){return[];}})());
const VDUR=(()=>{try{const w={};vm.runInNewContext(VDATA,{window:w,Object});return w.__STORYWORLD_LINEART_VOICE_R888__.dur;}catch(_){return{};}})();
const flat=s=>String(s).replace(/\s*\n\s*/g,' ');
(async()=>{
// 1) 등록·API
{const g=world(),A=g.api;ok('API exposed',!!A&&typeof A.play==='function'&&typeof A.skip==='function'&&typeof A.inspect==='function'&&typeof A.add==='function');
 ok('rest zones: a zone unfinished before arrival stays eligible for that arrival',/const was=finished\(id\);/.test(SRC)&&SRC.includes('fresh=!was&&finished(id)?id:null;')&&SRC.includes('(!finished(r.id)||fresh===r.id)'));
 ok('seventh scene file adds only the rest zones',BATCH7.every(z=>SC[6].includes("zone:'"+z+"'"))&&[...BATCH1,...BATCH2,...BATCH3,...BATCH4,...BATCH5,...BATCH6].every(z=>!SC[6].includes("zone:'"+z+"'")));
 ok('sixth scene file adds only the 8부 zones',BATCH6.every(z=>SC[5].includes("zone:'"+z+"'"))&&[...BATCH1,...BATCH2,...BATCH3,...BATCH4,...BATCH5].every(z=>!SC[5].includes("zone:'"+z+"'"))&&!SC[5].includes('역십자'));
 ok('fifth scene file adds only the 6부·7부 zones',BATCH5.every(z=>SC[4].includes("zone:'"+z+"'"))&&[...BATCH1,...BATCH2,...BATCH3,...BATCH4].every(z=>!SC[4].includes("zone:'"+z+"'")));
 ok('fourth scene file adds only the 5부 zones',BATCH4.every(z=>SC[3].includes("zone:'"+z+"'"))&&[...BATCH1,...BATCH2,...BATCH3].every(z=>!SC[3].includes("zone:'"+z+"'")));
 const zs=A?A.zones():[];ok('third scene file adds only the 3부 zones',BATCH3.every(z=>SC[2].includes("zone:'"+z+"'"))&&[...BATCH1,...BATCH2].every(z=>!SC[2].includes("zone:'"+z+"'")));
 ok('batch 1+2+3 zones registered exactly',JSON.stringify([...zs].sort())===JSON.stringify([...ALL].sort()),zs);
 ok('second scene file adds only the 2부 zones',BATCH2.every(z=>SC[1].includes("zone:'"+z+"'"))&&BATCH1.every(z=>!SC[1].includes("zone:'"+z+"'")));
 ok('no inverted-cross or hexagram sentence is used as a caption',zs.every(z=>A.scene(z).subs.every(s=>!/십자가|육망성/.test(s[2]))));
 ok('no zone that already has a cinematic or belongs to another task',zs.every(z=>!EXCLUDED.includes(z)),zs.filter(z=>EXCLUDED.includes(z)));
 ok('third-party notice kept in engine (MIT)',/MIT/.test(SRC)&&/JDhruv14/.test(SRC));
 // 2) 장면 규격: 길이(15~20초: 시안 12초보다 몇 초 길게), 자막 3줄 이상·순서·정본 문장 그대로(보스 앞 서사 범위)
 const canon=g.__STORYWORLD_STORY_CANON_R106__.zones;
 for(const z of zs){const d=A.scene(z);ok(z+': duration 15..20s',d&&d.D>=15&&d.D<=20,d&&d.D);
  const subs=d?.subs||[];ok(z+': at least 3 captions',subs.length>=3,subs.length);
  let prev=0,ordered=true;for(const [a,b] of subs){if(!(a>=prev&&b>a&&b<=d.D+.01))ordered=false;prev=b;}ok(z+': captions ordered inside the scene',ordered,subs.map(s=>[s[0],s[1]]));
  ok(z+': captions readable (>=2.2s each, <=24 chars/s)',subs.every(([a,b,t])=>b-a>=2.2&&t.length/(b-a)<=24),subs.map(([a,b,t])=>[+(b-a).toFixed(1),t.length]));
  const cz=canon[z],paras=(cz?.blocks||[]).flatMap(b=>b.paras||[]).map(flat),pre=paras.slice(cz?.cuts?.pre?.[0]??0,cz?.cuts?.pre?.[1]??paras.length).join(' ¶ ');
  for(const [, ,t] of subs){ok(z+': caption is canon text verbatim: '+t.slice(0,14),t.length>=6&&pre.includes(t),t);
   const i=pre.indexOf(t);ok(z+': caption starts at a sentence start: '+t.slice(0,10),i===0||/[.?!…”’¶] $/.test(pre.slice(Math.max(0,i-2),i)),pre.slice(Math.max(0,i-6),i));
   ok(z+': caption ends at a sentence or clause end: '+t.slice(-8),/[.?!…,”’]$/.test(t),t.slice(-4));}
  ok(z+': title comes from region data',A.titleFor(z)==='제목 '+z+' · 기억',A.titleFor(z));}
 ok('captions not repeated across scenes',(()=>{const all=zs.flatMap(z=>A.scene(z).subs.map(s=>s[2]));return new Set(all).size===all.length;})());}
// 3) 뜨는 조건
{const g=world(),A=g.api;await g.go('dist01');
 ok('eligible: STORY zone in table, unseen',A.eligible(g.room)===true);
 ok('not eligible: zone without a line-art scene',A.eligible({id:'ep1a10',layer:'STORY'})===false);
 ok('not eligible: DREAM layer',A.eligible({id:'dist01',layer:'DREAM'})===false);
 ok('not eligible: samong room flag',A.eligible({id:'dist01',layer:'STORY',samongR103:true})===false);
 g.done.add('STORY:dist01');ok('not eligible: narrative of that zone already completed (old saves)',A.eligible(g.room)===false);}
{const g=world({coop:true});await g.go('dist01');ok('not eligible in co-op',g.api.eligible(g.room)===false);}
{const g=world({store:{'storyworld.r880.lineart':'{"on":false}'}});await g.go('dist01');g.advance(2000);g.tk(5);ok('pref off: never plays',g.api.inspect().active===false&&g.api.inspect().stats.plays===0);}
{const g=world({webdriver:true});await g.go('dist01');g.advance(2000);g.tk(5);ok('automated browser without flag: never plays (CI suites keep running)',g.api.inspect().stats.plays===0);}
{const g=world({webdriver:true,search:'?cine880=1'});await g.go('dist01');g.advance(2000);g.tk(5);ok('automated browser with ?cine880=1: plays',g.api.inspect().stats.plays===1);}
// 4) 흐름: 도착 → (서사창·로딩이 닫히고 0.7초) → 재생, 재생 중 게임 멈춤, 끝나면 이어짐, 한 번만
{const g=world(),A=g.api;await g.go('dist01');g.storyScene={id:'x'};g.advance(3000);g.tk(3);
 ok('waits while a story window is open',A.inspect().active===false&&g.baseTicks===3,g.baseTicks);
 g.storyScene=null;g.tk(1);ok('still waits right after the window closes (0.7s)',A.inspect().active===false);
 g.advance(400);g.tk(1);ok('boundary: 0.4s after closing is too early',A.inspect().active===false);
 g.advance(350);g.tk(1);ok('plays 0.75s after the window closed',A.inspect().active===true&&A.inspect().zone==='dist01',A.inspect());
 const root=g.dom.document.getElementById('r880');ok('overlay added to the page',!!root&&root.parentNode===g.dom.body);
 ok('overlay is a modal dialog with a skip button',root?.attrs.role==='dialog'&&root.attrs['aria-modal']==='true'&&JSON.stringify(root.children.map(c=>c.tagName)).includes('button'));
 const before=g.baseTicks;g.tk(10);ok('game time is stopped while playing (guide/autoplay included)',g.baseTicks===before,[before,g.baseTicks]);
 ok('normal mode: own caption shown, top-most layer',!root.classList.contains('cinema'));
 // 프레임 진행
 for(let i=0;i<30;i++)g.raf(33);ok('frames advance',A.inspect().t>0.5&&A.inspect().stats.frames>=29,A.inspect());
 ok('seen is saved as soon as it starts playing',JSON.parse(g.store['storyworld.r880.lineart']).seen.includes('dist01'));
 const D=A.scene('dist01').D;for(let i=0;i<Math.ceil(D/0.033)+10;i++)g.raf(33);
 ok('ends by itself after its duration',A.inspect().active===false&&A.inspect().stats.ended===1,A.inspect());
 const held=g.baseTicks;g.tk(2);ok('game stays stopped during the closing fade',g.baseTicks===held);
 g.advance(600);g.runTimers();g.tk(2);ok('game resumes after the fade',g.baseTicks===held+2&&!g.dom.document.getElementById('r880'));
 await g.go('hub');await g.go('dist01');g.advance(2000);g.tk(3);ok('second visit: does not play again',A.inspect().stats.plays===1);
 ok('no errors in a full run',A.inspect().stats.errors===0,A.inspect().lastError);}
// 5) 건너뛰기·지역 이동
{const g=world(),A=g.api;await g.go('dist02');g.advance(800);g.tk(1);ok('playing dist02',A.inspect().active===true);
 const up=g.key('keyup','a');ok('game keys are swallowed while playing',up.prevented===true&&up.stopped===true);
 const ev=g.key('keydown','Escape');ok('Escape skips',ev.prevented&&A.inspect().active===false&&A.inspect().stats.skips===1);
 ok('registered with the shared cinema key guards',Array.isArray(g.__STORYWORLD_CINEMA_GUARDS__)&&g.__STORYWORLD_CINEMA_GUARDS__.length>=1);}
{const g=world(),A=g.api;await g.go('dist03');g.advance(800);g.tk(1);const root=g.dom.document.getElementById('r880');
 (root.listeners.pointerdown||[]).forEach(f=>f({preventDefault(){},target:root}));ok('pressing the screen skips',A.inspect().active===false&&A.inspect().stats.skips===1);}
{const g=world(),A=g.api;await g.go('dist03');g.advance(800);g.tk(1);g.room={id:'hub',layer:'STORY'};g.tk(1);ok('leaving the zone closes it',A.inspect().active===false&&A.inspect().stats.closedByRoom===1,A.inspect().stats);}
{const g=world(),A=g.api;await g.go('dist01');const o=g.dom.document.createElement('div');o.id='r369v';g.dom.body.appendChild(o);g.advance(2000);g.tk(2);
 ok('waits while another cinematic overlay is open',A.inspect().active===false);o.remove();g.advance(800);g.tk(1);g.advance(800);g.tk(1);ok('then plays',A.inspect().active===true);}
{const g=world(),A=g.api;await g.go('dist01');g.player.hp=0;g.advance(2000);g.tk(2);ok('does not play over a dead hero',A.inspect().active===false);}
// 6) 영화 모드(R370): 자막·음성은 영화 모드 것이 보이게 낮은 층, 자기 자막은 숨김
{const g=world({cinema:true}),A=g.api;await g.go('dist01');g.advance(800);g.tk(1);const root=g.dom.document.getElementById('r880');
 ok('cinema mode: plays as a picture layer under the R370 captions',A.inspect().active===true&&root.classList.contains('cinema'));
 ok('cinema mode: layer sits below R370 captions (z 9000) in CSS',/#r880\.cinema\{[^}]*z-index:8995/.test(SRC)&&/#r880\.cinema \.cap\{[^}]*display:none/.test(SRC));}
// 7) 흔들림 줄이기 설정: 가벼운 방식(선 떨림 필터·카메라 흔들림 없음)
{const g=world({reduced:true}),A=g.api;await g.go('dist01');g.advance(800);g.tk(1);ok('reduced motion → lite mode',A.inspect().lite===true);}
// 8) 모든 장면을 처음부터 끝까지 그려 본다: 예외 없음, 속성에 NaN·undefined·Infinity 없음, 십자 금지 표식 없음
{const g=world(),A=g.api;for(const z of A.zones()){g.dom.attrs.length=0;const okPlay=A.play({zone:z,force:true});ok(z+': force play starts',okPlay===true);
  const D=A.scene(z).D;let t=0;for(;t<=D+.2;t+=1/30){A.seek(Math.min(t,D));g.raf(33);}
  const bad=g.dom.attrs.filter(([, ,v])=>/NaN|undefined|Infinity/.test(v));ok(z+': every drawn value is a number',bad.length===0,bad.slice(0,3));
  ok(z+': draws something substantial (>=120 nodes) and no errors',g.dom.attrs.length>3000&&A.inspect().stats.errors===0,[g.dom.attrs.length,A.inspect().lastError]);
  A.skip();g.advance(600);g.runTimers();}}
// 8b) 자막 음성(R888, 사용자 2026-11-12 "모든영상 오디오음성도 나오게"): 자막 문장은 스토리 모드와 같은 R381 녹음을 그대로 쓴다
{const g0=world(),A0=g0.api;
 const capsOf=z=>A0.scene(z).subs;
 ok('voice: every caption of every scene has an R381 recording, its mp3 file and a length',ALL.every(z=>capsOf(z).every(([a,b,t])=>{const id=sha16(t);return R381IDS.has(id)&&VDUR[id]>0.3&&fs.existsSync(path.join(R,'runtime-text','assets','r381','voice',id+'.mp3'));})),ALL.filter(z=>!capsOf(z).every(([a,b,t])=>VDUR[sha16(t)]>0.3)));
 ok('voice: length table has no extra entries',Object.keys(VDUR).length===new Set(ALL.flatMap(z=>capsOf(z).map(c=>sha16(c[2])))).size,Object.keys(VDUR).length);
 const run=(g,z,{late=0,max=6000,skipAt=null}={})=>{const A=g.api;A.play({zone:z});const t0=g.now();let n=0;while(A.inspect().active&&n++<max){g.raf(33);g.voiceTick(late);if(skipAt!=null&&n===skipAt)A.skip();}return{ms:g.now()-t0,frames:n};};
 for(const z of ['bmg01','dist01','kair01','restHando']){if(!ALL.includes(z))continue;
  const g=world({voice:true}),A=g.api,sc=A.scene(z),r=run(g,z),c=g.voiceCalls;
  ok(z+' voice: each caption is spoken once, in order, with the caption text',JSON.stringify(c.map(x=>x.text))===JSON.stringify(sc.subs.map(x=>x[2])),c.map(x=>x.text));
  ok(z+' voice: a line never starts before the previous line has finished',c.every((x,i)=>i===0||(c[i-1].ended!=null&&x.at>=c[i-1].ended)),c.map(x=>[x.at,x.ended]));
  ok(z+' voice: every line is heard to the end before the scene closes',c.every(x=>x.ended!=null&&!x.stopped)&&A.inspect().stats.ended===1&&A.inspect().stats.errors===0,A.inspect());
  const need=sc.subs.reduce((n,x)=>n+VDUR[sha16(x[2])],0);
  ok(z+' voice: scene stretches to fit the voice but not beyond (≤ D + voice + 6s)',r.ms/1000>=Math.min(sc.D,need)&&r.ms/1000<=sc.D+need+6,[r.ms/1000,sc.D,need]);
  ok(z+' voice: default volume follows the voice volume setting (.8)',c.every(x=>Math.abs(x.o.volume-.8)<1e-9));}
 {const g=world({voice:true}),A=g.api,sc=A.scene('dist01'),r=run(g,'dist01',{late:2.5}),c=g.voiceCalls;
  ok('voice late by 2.5s (slow network): next line still waits for the previous one',c.length===sc.subs.length&&c.every((x,i)=>i===0||x.at>=c[i-1].ended),c.map(x=>[x.at,x.ended]));}
 {const g=world({voice:true}),A=g.api,sc=A.scene('dist01'),r=run(g,'dist01',{late:1e6}),c=g.voiceCalls;
  ok('voice that never reports its end: the scene still finishes (hold is bounded)',A.inspect().active===false&&A.inspect().stats.ended===1&&r.ms/1000<sc.D+sc.subs.reduce((n,x)=>n+VDUR[sha16(x[2])]+5,0),[r.ms/1000]);}
 {const g=world({voice:'error'}),A=g.api,sc=A.scene('dist01');A.play({zone:'dist01'});const t0=g.now();let n=0;while(A.inspect().active&&n++<6000){g.raf(33);g.runTimers();}
  ok('voice file fails: scene keeps its own pace (within 1.5s of D), no engine error',Math.abs((g.now()-t0)/1000-sc.D)<1.5&&A.inspect().stats.errors===0,[(g.now()-t0)/1000,sc.D]);}
 {const g=world({voice:true});g.settings.narration=false;const sc=g.api.scene('dist01'),r=run(g,'dist01');
  ok('setting 서사 음성 자동 재생 off: silent, own pace',g.voiceCalls.length===0&&Math.abs(r.ms/1000-sc.D)<0.2,[g.voiceCalls.length,r.ms]);}
 {const g=world({voice:true});g.settings.voice=0;const r=run(g,'dist01');ok('voice volume 0: silent',g.voiceCalls.length===0);}
 {const g=world({voice:true});g.settings.voice=.35;run(g,'dist01');ok('voice volume setting is passed on',g.voiceCalls.length>0&&g.voiceCalls.every(x=>Math.abs(x.o.volume-.35)<1e-9));}
 {const g=world({voice:true,cinema:true});run(g,'dist01');ok('cinema mode: line-art stays silent (cinema mode speaks the story itself)',g.voiceCalls.length===0);}
 {const g=world({voice:true});const r=run(g,'dist01',{skipAt:120});const c=g.voiceCalls;
  ok('skip stops the voice at once and starts no further line',c.length>=1&&c[c.length-1].stopped===true&&g.api.inspect().stats.skips===1,c.map(x=>x.stopped));}
 {const g=world({voice:true}),A=g.api;A.play({zone:'dist01',at:6});for(let i=0;i<20;i++)g.raf(33);ok('still frame (at=…): no voice',g.voiceCalls.length===0);A.skip();}
 {const g=world({voice:true}),A=g.api;A.play({zone:'dist01'});for(let i=0;i<200;i++){g.raf(33);g.voiceTick();}const i1=A.inspect();
  ok('inspect reports voice state',i1.voice&&i1.voice.on===true&&i1.voice.spoken>=1,i1.voice);A.skip();}
}
// 8c) 화면 마감(R889, 사용자 2026-11-12 "조금만더 퀄리티업 전반적으로"): 전 장면 공통
{const g=world(),A=g.api;A.play({zone:'dist01'});const root=g.dom.document.getElementById('r880'),cls=root.children.map(c=>c.className||'');
 ok('finish: title card, top/bottom shade and grain layers exist; caption and skip still there',['ttl','shade t','shade b','grain','cap','skip','chap'].every(c=>cls.includes(c)),cls);
 const ttl=root.children.find(c=>c.className==='ttl');ok('finish: title card shows the region title',String(ttl?.textContent||'').includes('제목 dist01'),ttl?.textContent);
 ok('finish: grain uses no blend mode (measured −30% fps in software rendering)',!/\.grain\{[^}]*mix-blend-mode/.test(SRC));
 ok('finish: reduced-motion stops grain and title animation',/prefers-reduced-motion: reduce\)\{[^@]*\.grain\{animation:none\}/.test(SRC));
 ok('finish: cinema mode hides the title card',/#r880\.cinema \.ttl\{display:none\}/.test(SRC));
 for(let i=0;i<60;i++)g.raf(33);ok('finish: no errors with dust, breathing camera and shadows',A.inspect().stats.errors===0,A.inspect().lastError);A.skip();
 const g2=world(),A2=g2.api;A2.play({zone:'dist01',at:5});ok('finish: still frame (at=…) has no title card',!g2.dom.document.getElementById('r880').children.some(c=>c.className==='ttl'));A2.skip();}
// 9) 빌드 연결 다섯 곳
{const html=rd(path.join(R,'runtime-text','index.html'))||'',lines=html.split('\n');
 const iT=lines.findIndex(l=>l.includes('./title-bg-video-r667.js')),iE=lines.findIndex(l=>l.includes('./'+ENGINE)),iS=lines.findIndex(l=>l.includes('./'+SCENES[0])),iS2=SCENES.map(f=>lines.findIndex(l=>l.includes('./'+f)));
 ok('script tags: every scene file follows the engine in order',iS2.every((v,i)=>v===iE+1+i),iS2);
 ok('script tags: engine then scenes, right after the video cinematics',iT>0&&iE===iT+1&&iS===iE+1&&lines[iE].trim()==='<script src="./'+ENGINE+'"></script>',[iT,iE,iS]);
 const ver=rd(path.join(ROOT,'scripts','verify-r96-public.py'))||'';ok('public verify list has both files',[ENGINE,...SCENES,VFILE].every(f=>ver.includes("'"+f+"'")));
 const yml=rd(path.join(ROOT,'.github','workflows','pages.yml'))||'';ok('CI runs this check',yml.includes('node r96/qa/r880/r880-cpu-check.cjs'));
 const man=rd(path.join(R,'runtime-inputs.json'))||'';ok('runtime inputs list both files',[ENGINE,...SCENES,VFILE].every(f=>man.includes(f)));}
console.log(`R880 CPU ${pass}/${total}`);process.exit(pass===total?0:1);
})().catch(e=>{console.log('CRASH',e&&e.stack||e);process.exit(1);});
