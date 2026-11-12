// R880 선화 컷씬(지역 진입, SVG 선 그림) CPU 검사 — 뜨는 조건·게임 멈춤·건너뛰기·영화 모드·정본 자막·장면 길이·그리기 값
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return null;}};
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;else console.log('FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,400));};
const ENGINE='lineart-cine-r880.js',SCENES=['lineart-scenes-r881.js'];
const SRC=rd(path.join(R,'client-source',ENGINE)),SC=SCENES.map(f=>rd(path.join(R,'client-source',f)));
const CANON=rd(path.join(R,'client-source','story-canon-r106-data.js'));
ok('engine file exists',!!SRC);ok('scene files exist',SC.every(Boolean));
if(!SRC||!SC.every(Boolean)){console.log(`R880 CPU ${pass}/${total}`);process.exit(1);}
// 이미 영상·컷신이 있는 곳과 다른 작업 몫(맘몬)은 넣지 않는다
const EXCLUDED=['dist00','ep1a09b','ep1a10','ep1a11','last301','last302','ep1b06','ep1b06b'];
const BATCH1=['dist01','dist02','dist03','dist04','dist05','dist06','ep1a08','ep1a09','last304','last305','last303'];
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
 for(const z of [...BATCH1,...EXCLUDED,'hub'])g.regionById[z]={id:z,title:'제목 '+z,chapter:'장'};
 g.window=g;g.globalThis=g;
 g.completed=(id,l)=>g.done.has((l||g.layer)+':'+id);
 g.__STORYWORLD_COOP_SIM_R62__={mode:()=>opt.coop?'host':'off'};
 if(opt.cinema)g.__STORYWORLD_CINEMA_MODE_R370__={prefs:()=>({on:true})};
 vm.createContext(g);
 vm.runInContext('var tick=function(){baseTicks++;};var enterRegion=async function(id,from,options){zone=id;if(options&&options.layer)layer=options.layer;room={id,layer,enemies:[]};return true;};',g);
 vm.runInContext(CANON,g);vm.runInContext(SRC,g,{filename:ENGINE});SC.forEach((s,i)=>vm.runInContext(s,g,{filename:SCENES[i]}));
 g.api=g.__STORYWORLD_LINEART_R880__;
 g.go=async(id,o)=>{await vm.runInContext('enterRegion',g)(id,null,o);};
 g.tk=(n=1)=>{for(let i=0;i<n;i++)vm.runInContext('tick',g)(1/60);};
 g.raf=(ms=16.7)=>{nowMs+=ms;const fs2=frames.splice(0);fs2.forEach(f=>f(nowMs));};
 g.runTimers=()=>{const due=g.timers.filter(t=>t[0]<=nowMs);g.timers=g.timers.filter(t=>t[0]>nowMs);due.forEach(t=>t[1]());};
 g.key=(type,key)=>{const ev={type,key,code:key===' '?'Space':key,repeat:false,prevented:false,preventDefault(){ev.prevented=true;},stopImmediatePropagation(){ev.stopped=true;}};(g.winListeners[type]||[]).forEach(f=>f(ev));return ev;};
 return g;}
const flat=s=>String(s).replace(/\s*\n\s*/g,' ');
(async()=>{
// 1) 등록·API
{const g=world(),A=g.api;ok('API exposed',!!A&&typeof A.play==='function'&&typeof A.skip==='function'&&typeof A.inspect==='function'&&typeof A.add==='function');
 const zs=A?A.zones():[];ok('batch 1 zones registered exactly',JSON.stringify([...zs].sort())===JSON.stringify([...BATCH1].sort()),zs);
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
// 9) 빌드 연결 다섯 곳
{const html=rd(path.join(R,'runtime-text','index.html'))||'',lines=html.split('\n');
 const iT=lines.findIndex(l=>l.includes('./title-bg-video-r667.js')),iE=lines.findIndex(l=>l.includes('./'+ENGINE)),iS=lines.findIndex(l=>l.includes('./'+SCENES[0]));
 ok('script tags: engine then scenes, right after the video cinematics',iT>0&&iE===iT+1&&iS===iE+1&&lines[iE].trim()==='<script src="./'+ENGINE+'"></script>',[iT,iE,iS]);
 const ver=rd(path.join(ROOT,'scripts','verify-r96-public.py'))||'';ok('public verify list has both files',[ENGINE,...SCENES].every(f=>ver.includes("'"+f+"'")));
 const yml=rd(path.join(ROOT,'.github','workflows','pages.yml'))||'';ok('CI runs this check',yml.includes('node r96/qa/r880/r880-cpu-check.cjs'));
 const man=rd(path.join(R,'runtime-inputs.json'))||'';ok('runtime inputs list both files',[ENGINE,...SCENES].every(f=>man.includes(f)));}
console.log(`R880 CPU ${pass}/${total}`);process.exit(pass===total?0:1);
})().catch(e=>{console.log('CRASH',e&&e.stack||e);process.exit(1);});
