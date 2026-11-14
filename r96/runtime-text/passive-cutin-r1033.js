// R1033 세 번째 특수 패시브 컷인 — 사용자 2026-11-14 12:06Z "삼향묵회(삼협묵희) 환도 확률발동패시브하면 3명컷씬나오잖아 멋있던데
//  나머지영웅들도 확률발동패시브 3번째스킬 발동되면 그런컷씬나오게 서사테마영웅고유성 고려해서 구현적용해줘".
//  기준: 환도 삼협묵희 컷인(hwando-ink-r945.js cutin) — 화면 위쪽 1/3 에 띠를 깔고 인물들이 오른쪽에서 차례로 스쳐 들어와 1.25초 안에 사라지는 DOM 연출.
//  게임 캔버스(3D 기록기) 밖 DOM 이라 렌더러 필터·몸 가림(R350)과 얽히지 않고, 게임을 멈추지 않는다(전투는 그대로 흐름).
//  세 번째 패시브 = R1025 해금 3단(가장 드문 것). 인물·그림은 그 패시브에 실제로 나오는 것만 쓴다(서사·설정은 지어내지 않음):
//   · 슬레이어 혈격자 — 슬레이어 + 교차점에 솟는 적혈 정십자 둘(R585 Dots 시트, 똑바른 십자) + 띠에 핏빛 격자.
//   · 미카엘라 연심 대개화 — 미카엘라 + 장미 하트 둘(R948 Dots MH-03 시트), 십자 없음 + 장미·실버 띠.
//   · 라우렌 유성 궤도·쌍성 소멸 — 라우렌 + 은빛 거성·심연 구(R946 Dots 시트, 쌍성) + 보라 별무리 띠.
//   · 네온 천공 낙뢰 — 네온 + 민트 낙뢰 둘(R951 시트) + 금빛 회로 띠.
//   · 서하 수문장 아르벨리아 — 서하 + 아르벨리아(카이로 02 보스 그림 그대로, R949 이 넘김) + 시계 고리 띠.
//   · 헌터 기러기진 섬멸 — 헌터 + 슬레이어(분대에 실제로 있을 때만, 서사 전이면 없음) + 헌터 분신 둘(기러기 두 날개).
//   · 기억사수 귀환 전우 — 기억사수 + 실제로 불려 온 통제자 이야기 기계 보스(최대 3, 코발트 벗 빛) + 코발트 띠.
//  영웅 그림은 영웅 선택 창 초상화(assets/r108/heroes/*.webp) 그대로 — 사각 그림의 가장자리는 CSS 마스크로 녹인다(사용자 13:53Z). 새 그림을 그리지 않았다.
//  같은 요청으로 사몽 각성 컷인(#cutin 작은 그림·가운데 sw8 큰 그림)도 각성 일러스트(rc91) 대신 이 초상화를 보인다(특히 기억사수). 각성 그림 경로는
//   showAwakening 이 도는 동안만 바꿔 넘기고 곧바로 되돌린다 → 제목·엔딩·궁극기 자세 등 다른 쓰임은 그대로. 끄기: localStorage 'storyworld.r1033.portrait'='0'.
//  안 띄움: 배치·소환 몸(r720Ally·r949Summon·r952Body·r952Unit)이 쓸 때, 대화창·서사 장면 중, 끔일 때, document 없을 때.
//  빈도: 스토리·영화 8초, 무한생존 20초에 한 번(영웅이 달라도 하나의 시계, 실제 시간 기준). 환도 컷인은 끄기만 함께 따른다(hwando-ink-r945 cutin → allow('hwando')).
//  설정: 설정 창 '전투 화면' 묶음(R1021)에 한 줄, 없으면 간이설정 끝. 끄기/켜기: localStorage 'storyworld.r1033.cutin' = '0'/'1' 또는 set(bool).
//  렉: 조종 영웅의 그림만 미리 읽음(상반신 1장 + 시트 0~2장, 영웅이 바뀔 때만), DOM 노드 9개 이하, 그리기 루프 없음. 모션 줄이기 설정이면 미끄러짐 없이 나타났다 사라짐.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PASSIVE_CUTIN_R1033__)return;
const REV='R1033-passive-cutin-2',KEY='storyworld.r1033.cutin',MS=1250,GAP=Object.freeze({story:8,survival:20});
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const BUST=h=>'assets/r108/heroes/'+h+'.webp',KEY_P='storyworld.r1033.portrait';/* 영웅 선택 창 초상화(R108, 384×512) — 사용자 13:53Z "영웅 고르는 창에 나오는 간지나는 초상화 기준" */
// 시트 한 칸(Dots 시트 재사용): cols×rows 칸, f = 보여 줄 칸, ar = 칸 가로/세로
const SHEET=Object.freeze({
 cross:{path:'assets/r585/slayer-r-cross.webp',cols:6,rows:4,f:9,ar:1},
 heart:{path:'assets/r948/mh03-heart24.webp',cols:6,rows:4,f:14,ar:1},
 silver:{path:'assets/r946/lauren-red.webp',cols:6,rows:4,f:0,ar:1},
 abyss:{path:'assets/r946/lauren-blue.webp',cols:6,rows:4,f:0,ar:1},
 bolt:{path:'assets/r951/neon-skybeam.webp',cols:6,rows:2,f:9,ar:.25}});
// 영웅별 세 번째 패시브(R1025 해금 3단과 같음 — CPU 검사가 대조)와 인물 배치(왼→오)
const HEROES=Object.freeze({
 slayer:{kinds:['lattice'],cast:()=>[['deco','cross'],['main'],['deco','cross']]},
 michaela:{kinds:['bloom'],cast:()=>[['deco','heart'],['main'],['deco','heart']]},
 lauren:{kinds:['meteor','violet'],cast:()=>[['deco','silver'],['main'],['deco','abyss']]},
 neon:{kinds:['storm'],cast:()=>[['deco','bolt'],['main'],['deco','bolt']]},
 seoha:{kinds:['arbelia'],cast:x=>{const a=arts(x,1);return a.length?[['main'],['boss',a[0]]]:[['main']];}},
 hunter:{kinds:['squad'],cast:x=>{const hs=Array.isArray(x?.heroes)?x.heroes:[];return hs.includes('slayer')?[['shade','hunter'],['ally','slayer'],['main'],['shade','hunter']]:[['shade','hunter'],['main'],['shade','hunter']];}},
 gunner:{kinds:['summon'],cast:x=>{const a=arts(x,3);return [...a.slice(0,1).map(p=>['boss',p]),['main'],...a.slice(1).map(p=>['boss',p])];}}});
const SAFE=/^assets\/[\w\-./]+\.(?:webp|png)$/;
function arts(x,n){const a=Array.isArray(x?.art)?x.art:[];return a.filter(p=>typeof p==='string'&&SAFE.test(p)&&!p.includes('..')).slice(0,n);}
const stats={shown:0,skipped:{off:0,hero:0,tier:0,body:0,scene:0,gap:0,dom:0},errors:0,warmed:0};let lastError=null,lastAt=-1e9,last=null,el=null,timer=0,nowFn=null;
function fail(e){stats.errors++;lastError=String(e&&e.message||e).slice(0,200);}
function on(){return G(()=>localStorage.getItem(KEY),null)!=='0';}
function set(v){G(()=>localStorage.setItem(KEY,v?'1':'0'));const t=G(()=>document.getElementById('passiveCutinR1033Toggle'),null);if(t)t.checked=on();return on();}
const now=()=>{const v=nowFn?nowFn():G(()=>performance.now()/1000,NaN);return Number.isFinite(v)?v:G(()=>Date.now()/1000,NaN);};
const survival=()=>!!G(()=>window.__STORYWORLD_SURVIVAL_R600__?.here?.(),false);
const gap=()=>survival()?GAP.survival:GAP.story;
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const scene=()=>!!(G(()=>typeof modal!=='undefined'&&modal,null)||G(()=>typeof storyScene!=='undefined'&&storyScene,null));
// ---- DOM ----
const CSS=[
 '#r1033Cutin{position:fixed;left:0;right:0;top:13vh;height:min(30vh,250px,31vw);pointer-events:none;z-index:45;display:flex;justify-content:center;align-items:flex-end;opacity:0;visibility:hidden;contain:layout paint;--a:#e8e2d4;--b:rgba(20,16,18,.82);--c:rgba(255,255,255,.0)}',
 '#r1033Cutin::before{content:"";position:absolute;left:-6%;right:-6%;top:14%;bottom:3%;background:linear-gradient(90deg,transparent 0%,var(--b) 20%,var(--b) 80%,transparent 100%);transform:skewY(-2.5deg);-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 24%,#000 80%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0%,#000 24%,#000 80%,transparent 100%)}',
 '#r1033Cutin::after{content:"";position:absolute;left:8%;right:8%;top:20%;bottom:9%;background:var(--c);transform:skewY(-2.5deg);opacity:.85;-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}',
 '#r1033Cutin .r1033f{position:relative;flex:none;height:100%;width:auto;margin:0 -2.2%;opacity:0;transform:translateX(18vw);z-index:3}',
 '#r1033Cutin img.r1033main,#r1033Cutin img.r1033ally,#r1033Cutin img.r1033shade{aspect-ratio:.92;object-fit:cover;object-position:50% 4%;-webkit-mask-image:radial-gradient(ellipse 50% 54% at 50% 42%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 50% 54% at 50% 42%,#000 62%,transparent 100%)}',
 '#r1033Cutin .r1033main{height:100%;margin:0 -1%;filter:brightness(1.12) contrast(1.06)}',
 '#r1033Cutin .r1033ally{height:92%;margin:0 -5% 0 -2%;z-index:2;filter:brightness(1.05)}',
 '#r1033Cutin .r1033shade{height:68%;align-self:flex-start;margin:0 -4%;z-index:1;filter:brightness(.7) saturate(.5) sepia(.35) contrast(1.05)}',
 '#r1033Cutin .r1033boss{height:124%;margin:0 -13%;z-index:1;filter:brightness(1.35) drop-shadow(0 0 5px rgba(120,176,255,.95))}',
 '#r1033Cutin .r1033deco{height:62%;align-self:center;margin:0 2.5%;background-repeat:no-repeat;z-index:4}',
 '#r1033Cutin .r1033deco[data-sheet="bolt"]{height:132%;align-self:flex-end;margin:0 1.5%}',
 '#r1033Cutin.on{visibility:visible;animation:r1033Band 1.15s linear forwards}',
 '#r1033Cutin.on .r1033f{animation:r1033In 1.05s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--d,0s)}',
 '#r1033Cutin.on .r1033shade{animation-name:r1033Shade}',
 '#r1033Cutin.on .r1033deco{animation-name:r1033Pop}',
 '@keyframes r1033Band{0%{opacity:0}10%{opacity:1}70%{opacity:1}96%{opacity:0}100%{opacity:0}}',
 '@keyframes r1033In{0%{opacity:0;transform:translateX(18vw)}22%{opacity:1;transform:translateX(0)}74%{opacity:1;transform:translateX(-1.5vw)}100%{opacity:0;transform:translateX(-6vw)}}',
 '@keyframes r1033Shade{0%{opacity:0;transform:translateX(22vw)}26%{opacity:.62;transform:translateX(0)}74%{opacity:.55;transform:translateX(-2vw)}100%{opacity:0;transform:translateX(-7vw)}}',
 '@keyframes r1033Pop{0%{opacity:0;transform:scale(.55)}24%{opacity:1;transform:scale(1.06)}36%{transform:scale(1)}74%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}',
 '@keyframes r1033Fade{0%{opacity:0}20%{opacity:1}74%{opacity:1}100%{opacity:0}}',
 '@media (prefers-reduced-motion:reduce){#r1033Cutin.on .r1033f{animation-name:r1033Fade}}',
 '#awakeImage[data-r1033]{object-fit:cover!important;object-position:50% 12%;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 62%,transparent 100%);filter:drop-shadow(0 0 14px #b5a5d6aa)}',
 '#sw8Awakening[data-side="hero"] img[data-r1033]{width:min(34vw,300px);height:min(60vh,400px);object-fit:cover;object-position:50% 14%;opacity:.9;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 58%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 58%,transparent 100%)}',
 '@media (max-width:780px){#sw8Awakening[data-side="hero"] img[data-r1033]{width:min(52vw,210px);height:min(42vh,280px)}}',
 '@media (max-width:560px){#r1033Cutin .r1033boss{height:100%;margin:0 -19%}#r1033Cutin .r1033deco{margin:0 1%}}',
 // 영웅별 띠(고유색: R302 두 색 규칙 — 주색 + 보조색)
 '#r1033Cutin[data-hero="slayer"]{--b:rgba(34,4,8,.84);--c:repeating-linear-gradient(45deg,transparent 0 22px,rgba(200,20,34,.55) 22px 24px),repeating-linear-gradient(-45deg,transparent 0 22px,rgba(200,20,34,.55) 22px 24px)}',
 '#r1033Cutin[data-hero="michaela"]{--b:rgba(58,10,24,.80);--c:radial-gradient(ellipse at 50% 60%,rgba(178,26,62,.55),transparent 62%),linear-gradient(180deg,transparent 46%,rgba(226,232,242,.35) 49%,transparent 52%)}',
 '#r1033Cutin[data-hero="lauren"]{--b:rgba(22,10,38,.84);--c:radial-gradient(circle at 20% 40%,rgba(226,226,240,.9) 0 1px,transparent 2px) 0 0/38px 30px,radial-gradient(ellipse at 50% 55%,rgba(150,90,210,.5),transparent 64%)}',
 '#r1033Cutin[data-hero="neon"]{--b:rgba(6,26,24,.84);--c:repeating-linear-gradient(90deg,transparent 0 46px,rgba(232,196,96,.55) 46px 48px,transparent 48px 70px),linear-gradient(180deg,transparent 30%,rgba(95,240,200,.4) 31%,transparent 33%,transparent 66%,rgba(95,240,200,.4) 67%,transparent 69%)}',
 '#r1033Cutin[data-hero="seoha"]{--b:rgba(8,20,36,.84);--c:repeating-radial-gradient(circle at 50% 60%,transparent 0 26px,rgba(120,210,255,.5) 26px 28px),radial-gradient(ellipse at 50% 60%,rgba(232,206,140,.35),transparent 60%)}',
 '#r1033Cutin[data-hero="hunter"]{--b:rgba(74,24,18,.86);--c:linear-gradient(162deg,transparent 46%,rgba(241,217,160,.85) 47%,transparent 49%),linear-gradient(18deg,transparent 46%,rgba(241,217,160,.85) 47%,transparent 49%),radial-gradient(ellipse at 50% 70%,rgba(224,138,146,.35),transparent 60%)}',
 '#r1033Cutin[data-hero="gunner"]{--b:rgba(8,16,36,.86);--c:repeating-linear-gradient(180deg,transparent 0 5px,rgba(70,130,230,.28) 5px 6px),radial-gradient(ellipse at 50% 60%,rgba(200,215,240,.3),transparent 62%)}'
].join('\n');
function build(){if(el)return el;const d=G(()=>typeof document!=='undefined'?document:null,null);if(!d||typeof d.createElement!=='function'||!d.body)return null;
 const st=d.createElement('style');st.id='r1033CutinStyle';st.textContent=CSS;if(d.head)d.head.appendChild(st);
 const e=d.createElement('div');e.id='r1033Cutin';e.setAttribute('aria-hidden','true');d.body.appendChild(e);el=e;return e;}
function fig(d,kind,arg,i){const fx=kind==='deco'?SHEET[arg]:null;let n;
 if(fx){n=d.createElement('div');n.setAttribute('data-src',fx.path);n.setAttribute('data-sheet',arg);const c=fx.f%fx.cols,r=Math.floor(fx.f/fx.cols);
  n.style.backgroundImage='url("'+fx.path+'")';n.style.backgroundSize=(fx.cols*100)+'% '+(fx.rows*100)+'%';
  n.style.backgroundPosition=(fx.cols>1?c/(fx.cols-1)*100:0)+'% '+(fx.rows>1?r/(fx.rows-1)*100:0)+'%';n.style.aspectRatio=String(fx.ar);}
 else{n=d.createElement('img');const src=kind==='main'?BUST(hero0):kind==='ally'||kind==='shade'?BUST(arg):arg;n.setAttribute('src',src);n.setAttribute('alt','');G(()=>{n.decoding='async';});}
 n.className='r1033f r1033'+kind;n.setAttribute('data-fig',kind);n.style.setProperty?.('--d',(i*.07).toFixed(2)+'s');return n;}
let hero0='';
function show(hero,cast){const e=build();if(!e)return false;const d=e.ownerDocument||G(()=>document,null)||e.doc;
 while(e.firstChild)e.removeChild(e.firstChild);hero0=hero;e.setAttribute('data-hero',hero);
 cast.forEach(([k,a],i)=>{const n=fig(d||G(()=>document,null),k,a,i);if(n)e.appendChild(n);});
 e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(timer);timer=setTimeout(()=>{try{e.classList.remove('on');}catch(_){}},MS);return true;}
function fire(hero,kind,owner,extra){try{
  if(!on()){stats.skipped.off++;return false;}
  const H=HEROES[hero];if(!H){stats.skipped.hero++;return false;}
  if(!H.kinds.includes(kind)){stats.skipped.tier++;return false;}
  if(isBody(owner)){stats.skipped.body++;return false;}
  if(scene()){stats.skipped.scene++;return false;}
  const t=now();if(Number.isFinite(t)&&t-lastAt<gap()){stats.skipped.gap++;return false;}
  const cast=H.cast(extra||null);if(!show(hero,cast)){stats.skipped.dom++;return false;}
  if(Number.isFinite(t))lastAt=t;stats.shown++;last={hero,kind,cast:cast.map(c=>c.join(':'))};return true;
 }catch(e){fail(e);return false;}}
function allow(hero){return on();}
// ---- 조종 영웅 그림만 미리 읽기(영웅이 바뀔 때만) ----
const warmed=new Set();
function warm(){try{const h=G(()=>typeof player==='object'&&player&&!isBody(player)?player.hero:null,null);if(!h||!HEROES_ALL.includes(h)||warmed.has(h))return;warmed.add(h);
  const list=[BUST(h)];if(HEROES[h]&&on())for(const [k,a] of HEROES[h].cast({heroes:['slayer']}))if(k==='deco'&&SHEET[a])list.push(SHEET[a].path);else if(k==='ally'||k==='shade')list.push(BUST(a));
  if(typeof Image==='function')for(const p of new Set(list)){const im=new Image();im.decoding='async';im.src=p;stats.warmed++;}build();}catch(e){fail(e);}}
// ---- 설정 창 한 줄 ----
function row(){const d=G(()=>typeof document!=='undefined'?document:null,null);if(!d||!d.getElementById||d.getElementById('passiveCutinR1033'))return;
 const host=d.getElementById('combatScreenR1021')||d.getElementById('quickSettingsR114');if(!host)return;
 const r=d.createElement('div');r.id='passiveCutinR1033';r.className='r1021-row';
 const lab=d.createElement('label'),box=d.createElement('input');box.type='checkbox';box.id='passiveCutinR1033Toggle';box.checked=on();box.onchange=()=>set(!!box.checked);
 lab.appendChild(box);lab.appendChild(d.createTextNode?d.createTextNode(' 세 번째 특수 패시브 컷인'):Object.assign(d.createElement('span'),{textContent:' 세 번째 특수 패시브 컷인'}));
 const p=d.createElement('p');p.className='small muted';p.textContent='가장 드문 특수 패시브(환도 삼협묵희 등)가 터질 때 화면 위쪽에 1.2초 컷인. 게임은 멈추지 않습니다. 무한생존은 20초에 한 번까지.';
 r.appendChild(lab);r.appendChild(p);host.appendChild(r);}
const portraitOn=()=>G(()=>localStorage.getItem(KEY_P),null)!=='0';
// 사몽 각성: 도는 동안만 각성 그림 경로를 초상화로 바꿔 넘기고(#cutin·sw8 둘 다 이 경로를 읽음) 끝나면 되돌린다
function wrapAwake(){try{if(typeof showAwakening!=='function'||showAwakening.r1033)return;const base=showAwakening;
  const w=function(...a){let art=null,old;try{const h=G(()=>player.hero,null);art=G(()=>heroArt[h],null);if(art&&HEROES_ALL.includes(h)&&portraitOn()){old=art.awakening;art.awakening=BUST(h);}else art=null;}catch(e){fail(e);art=null;}
   try{return base.apply(this,a);}finally{if(art){art.awakening=old;try{mark(G(()=>player.hero,''));}catch(e){fail(e);}}}};
  w.r1033=true;showAwakening=w;}catch(e){fail(e);}}
const HEROES_ALL=['seoha','hunter','slayer','michaela','gunner','lauren','neon','hwando'];
// 마스크 표식: #awakeImage 는 지금 그림이 초상화일 때만(EGO 컷인 그림 등은 그대로). 가운데 sw8 그림은 영웅 쪽(data-side=hero)일 때만 CSS 가 먹고,
//  영웅 쪽은 언제나 각성 그림 경로(= 이 동안 초상화)를 쓰므로 표식을 붙여 둔다(줄 서 있다가 나중에 뜨는 경우도 같은 그림).
function mark(h){const d=G(()=>document,null);if(!d||!d.getElementById)return;
 const a=d.getElementById('awakeImage');if(a){const want=G(()=>urlFor(BUST(h)),BUST(h));const src=G(()=>a.getAttribute('src'),'')||'';if(src===want||src.endsWith(BUST(h)))a.setAttribute('data-r1033','1');else if(a.removeAttribute)a.removeAttribute('data-r1033');}
 const b=G(()=>d.querySelector('#sw8Awakening img'),null);if(b)b.setAttribute('data-r1033','1');}
function install(){wrapAwake();try{if(typeof showSettings==='function'&&!showSettings.r1033){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{row();}catch(e){fail(e);}return r;};showSettings.r1033=true;}}catch(e){fail(e);}
 G(()=>setInterval(warm,1500));warm();}
if(G(()=>document.readyState==='complete',false))install();else G(()=>window.addEventListener('load',install));
window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze({revision:REV,on,set,allow,fire,row,warm,gap,install,portraitOn,
 table:()=>Object.fromEntries(Object.entries(HEROES).map(([h,v])=>[h,[...v.kinds]])),
 inspect:()=>({revision:REV,on:on(),shown:stats.shown,skipped:{...stats.skipped},errors:stats.errors,lastError,warmed:stats.warmed,lastAt,gap:gap(),last:last&&{...last},
  visible:!!(el&&el.classList.contains('on')),hero:el?el.getAttribute('data-hero'):null}),
 qaNow:f=>{nowFn=typeof f==='function'?f:null;return !!nowFn;},qaReset:()=>{lastAt=-1e9;}});
})();
