/* R1174 페르소나 영웅 전용 확률 패시브 발동 컷인 + 사몽 각성 컷신 (사용자 2026-11-18 14:33Z "페르소나 전용 확률전용패시브 발동컷신과 사몽발동 컷신도 생성적용 닷츠와협업",
 *  14:34Z "페르소나 전용 확률발동패시브 잘작동되는지도 검토개선적용").
 *  고치기 전: 페르소나 형상(라우렌 몸 + player.personaHeroR1113)에서 (진) 천체 공명의 3단((진) 유성 궤도·(진) 쌍성 소멸)이 터지면 R1033 이 라우렌 초상·보라 별무리 띠로
 *   컷인을 띄웠고, 사몽 각성도 왼쪽 위(#cutin)·가운데(RC149 sw8) 모두 라우렌 초상과 '라우렌 · N초' 였다 — 페르소나에서 라우렌 흔적이 나오지 않게 하라는 규칙(11-18)에 어긋남.
 *  틀: 기존 영웅 컷인과 같은 R1033 틀을 그대로 따른다 — 같은 위치·크기(화면 위쪽 1/3 띠, 1.25초, 게임 멈추지 않음, DOM 이라 렌더러 필터와 안 얽힘),
 *   같은 끄기(storyworld.r1033.cutin)·같은 빈도 시계(스토리 8초·무한생존 20초)·같은 거름(1·2단, 배치·소환 몸, 대화창·서사 장면). R1033 fire 가 거른 뒤
 *   페르소나 형상이면 이 모듈의 show 로 넘긴다(R1033 에 두 줄). 사몽 각성은 R1046 EGO 와 같은 '형상' 방식: 도는 동안만 각성 그림 경로를 페르소나 그림으로 바꾸고 이름 줄을 고친다.
 *  연출(페르소나 고유색 언주 + 흑 + 검빨, R1143 규칙 '척력=언주·인력=흑·합친 것=검빨'):
 *   · (진) 유성 궤도: 언주 별(척력) — 페르소나 — 흑 별(인력), 띠에 언주 궤도선 / (진) 쌍성 소멸: 언주 별 — 페르소나 — 검빨 월식(두 별이 합쳐진 칸), 띠에 흑적 광선 7줄.
 *   · 이름 줄 '(진) 유성 궤도' 등(이미 게임 P 창에 있는 이름, 서사 불변). 라우렌 그림·보라·은빛은 쓰지 않는다.
 *   · 사몽 각성: 가운데 큰 컷인 뒤에 언주 고리·흑 월식 막(#r1174Awake)이 1.6초 퍼지고 '페르소나 · 순수악의' 이름.
 *  그림: Dots CX-0153PC(상반신·각성 일러스트·구 8칸·고리 12칸)가 오기 전 임시 = 게임 속 rc133 페르소나 그림(awake-0)과 R1107 페르소나 Dots 시트(붉은 거울별·자아 월식).
 *   ART 의 dots 경로가 runtime 목록에 들어오면(파일을 sync 로 넣으면) 그쪽을 쓴다 — 지금은 null.
 *  판정·확률·피해·키는 건드리지 않는다(R946 그대로). 렉: DOM 노드 6개, 그리기 루프 없음, 형상일 때만 그림 3장 미리 읽음. */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_CUTIN_R1174__)return;
const REV='R1174-persona-cutin-1',FIELD='personaHeroR1113',BASE='lauren',MS=1250,AWAKE_MS=1650;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
// Dots CX-0153PC 가 오면 dots 경로를 채운다(그림만 교체). 임시: rc133 페르소나 각성 그림(344×400 투명) + R1107 페르소나 시트(6×4, 192칸).
const ART=Object.freeze({bust:Object.freeze({temp:'assets/rc133/art/awake-0.png',dots:null}),awake:Object.freeze({temp:'assets/rc133/art/awake-0.png',dots:null}),
 star:Object.freeze({path:'assets/r1107/persona-red-star.webp',cols:6,rows:4,f:0}),eclipse:Object.freeze({path:'assets/r1107/persona-eclipse.webp',cols:6,rows:4,f:6})});
const pick=a=>a.dots||a.temp;
const LOOK=Object.freeze({meteor:'orbit',violet:'twin'}); // CSS 이름표(궤도·쌍성)
const NAMES=Object.freeze({meteor:'(진) 유성 궤도',violet:'(진) 쌍성 소멸'});
const CAST=Object.freeze({meteor:Object.freeze([['star','eonju'],['main'],['star','black']]),violet:Object.freeze([['star','eonju'],['main'],['eclipse','darkred']])});
const U=p=>{try{const u=typeof urlFor==='function'?urlFor(p):p;return typeof u==='string'&&u&&!/["\\]/.test(u)?u:p;}catch(_){return p;}};
const stats={shown:0,awake:0,skipped:0,errors:0,warmed:0};let lastError=null,last=null,el=null,ov=null,timer=0,timer2=0;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
function persona(o){return !!(o&&typeof o==='object'&&o.hero===BASE&&o[FIELD]===true&&!isBody(o));}
const pl=()=>G(()=>typeof player==='object'&&player?player:null,null);
const doc=()=>G(()=>typeof document!=='undefined'&&document&&typeof document.createElement==='function'&&document.body?document:null,null);
// 색: 언주 #cc3428(204,52,40) · 흑 #0b0606 · 검빨 #5a0c12(90,12,18)
const CSS=[
 '#r1174Cutin{position:fixed;left:0;right:0;top:13vh;height:min(30vh,250px,31vw);pointer-events:none;z-index:45;display:flex;justify-content:center;align-items:flex-end;opacity:0;visibility:hidden;contain:layout paint}',
 '#r1174Cutin::before{content:"";position:absolute;left:-6%;right:-6%;top:8%;bottom:3%;background:linear-gradient(90deg,transparent 0%,rgba(11,6,6,.95) 20%,rgba(11,6,6,.95) 80%,transparent 100%);transform:skewY(-2.5deg);-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 24%,#000 80%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0%,#000 24%,#000 80%,transparent 100%)}',
 '#r1174Cutin::after{content:"";position:absolute;left:8%;right:8%;top:20%;bottom:9%;transform:skewY(-2.5deg);opacity:.9;-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}',
 '#r1174Cutin[data-look="orbit"]::after{background:radial-gradient(ellipse 46% 34% at 50% 58%,transparent 0 92%,rgba(204,52,40,.75) 93% 95%,transparent 96%),radial-gradient(ellipse 30% 22% at 50% 58%,transparent 0 90%,rgba(204,52,40,.45) 91% 94%,transparent 95%),radial-gradient(ellipse at 50% 62%,rgba(90,12,18,.6),transparent 64%)}',
 '#r1174Cutin[data-look="twin"]::after{opacity:.6;background:repeating-linear-gradient(177deg,transparent 0 12px,rgba(90,12,18,.85) 12px 13px,rgba(204,52,40,.8) 13px 14px,rgba(90,12,18,.85) 14px 15px,transparent 15px 19px),radial-gradient(ellipse at 50% 62%,rgba(90,12,18,.7),transparent 66%)}',
 '#r1174Cutin .r1174f{position:relative;flex:none;height:100%;width:auto;margin:0 -2.2%;opacity:0;transform:translateX(18vw);z-index:3}',
 '#r1174Cutin img.r1174main{height:170%;align-self:flex-start;aspect-ratio:.86;object-fit:cover;object-position:50% 0;margin:-2% -1% 0;filter:brightness(1.1) contrast(1.08);-webkit-mask-image:radial-gradient(ellipse 50% 38% at 50% 26%,#000 64%,transparent 100%);mask-image:radial-gradient(ellipse 50% 38% at 50% 26%,#000 64%,transparent 100%)}',
 '#r1174Cutin .r1174orb{height:58%;align-self:center;aspect-ratio:1;margin:0 3%;background-repeat:no-repeat;z-index:4}',
 '#r1174Cutin .r1174orb[data-tone="black"]{filter:grayscale(1) brightness(.42) contrast(1.7) drop-shadow(0 0 3px rgba(204,52,40,.95)) drop-shadow(0 0 9px rgba(204,52,40,.6))}',
 '#r1174Cutin .r1174orb[data-tone="darkred"]{height:70%;filter:saturate(1.3) brightness(.3) contrast(1.8) drop-shadow(0 0 2px #cc3428) drop-shadow(0 0 12px rgba(204,52,40,.7))}',
 '#r1174Cutin .r1174name{position:absolute;left:50%;bottom:-3%;transform:translateX(-50%) skewY(-2.5deg);z-index:6;font:700 clamp(13px,2.1vw,22px)/1.1 serif;letter-spacing:.14em;color:#f2d6cf;text-shadow:0 0 6px #cc3428,0 0 2px #0b0606,0 2px 0 #0b0606;white-space:nowrap;opacity:0;padding:.3em 1.6em;background:linear-gradient(90deg,transparent,rgba(11,6,6,.95) 12%,rgba(11,6,6,.95) 88%,transparent)}',
 '#r1174Cutin.on{visibility:visible;animation:r1174Band 1.15s linear forwards}',
 '#r1174Cutin.on .r1174f{animation:r1174In 1.05s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--d,0s)}',
 '#r1174Cutin.on .r1174orb{animation:r1174Pop 1.05s cubic-bezier(.2,.8,.2,1) forwards,r1174Sheet .6s steps(6,jump-none) infinite;animation-delay:var(--d,0s),0s}',
 '@keyframes r1174Sheet{0%{background-position-x:0%}100%{background-position-x:100%}}',
 '#r1174Cutin.on .r1174name{animation:r1174Name 1.1s ease-out forwards}',
 '@keyframes r1174Band{0%{opacity:0}10%{opacity:1}70%{opacity:1}96%{opacity:0}100%{opacity:0}}',
 '@keyframes r1174In{0%{opacity:0;transform:translateX(18vw)}22%{opacity:1;transform:translateX(0)}74%{opacity:1;transform:translateX(-1.5vw)}100%{opacity:0;transform:translateX(-6vw)}}',
 '@keyframes r1174Pop{0%{opacity:0;transform:scale(.55) rotate(-40deg)}24%{opacity:1;transform:scale(1.08) rotate(0)}36%{transform:scale(1)}74%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.14)}}',
 '@keyframes r1174Name{0%{opacity:0;letter-spacing:.5em}24%{opacity:1;letter-spacing:.14em}74%{opacity:1}100%{opacity:0}}',
 '@keyframes r1174Fade{0%{opacity:0}20%{opacity:1}74%{opacity:1}100%{opacity:0}}',
 '@media (prefers-reduced-motion:reduce){#r1174Cutin.on .r1174f,#r1174Cutin.on .r1174name{animation-name:r1174Fade}}',
 // 사몽 각성 막: 가운데 큰 컷인(z 12) 바로 뒤
 '#r1174Awake{position:absolute;inset:0;z-index:11;pointer-events:none;display:none;place-items:center;overflow:hidden}',
 '#r1174Awake.on{display:grid;animation:r1174AwBg 1.6s ease-out forwards;background:radial-gradient(ellipse at 50% 50%,rgba(90,12,18,.5),rgba(11,6,6,.6) 72%)}',
 '#r1174Awake .r1174ring{grid-area:1/1;width:min(64vh,62vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(11,6,6,.92) 0 38%,rgba(90,12,18,.85) 40%,transparent 43%,transparent 60%,rgba(204,52,40,.8) 61% 62.5%,transparent 63.5%,transparent 70%,rgba(204,52,40,.45) 71% 72%,transparent 73%);opacity:0}',
 '#r1174Awake.on .r1174ring{animation:r1174Ring 1.6s cubic-bezier(.2,.8,.2,1) forwards}',
 '#r1174Awake .r1174title{grid-area:1/1;align-self:start;margin-top:13vh;padding:.15em 1em;background:linear-gradient(90deg,transparent,rgba(11,6,6,.8) 18%,rgba(11,6,6,.8) 82%,transparent);z-index:2;font:700 clamp(15px,2.6vw,28px)/1.1 serif;letter-spacing:.2em;color:#f2d6cf;text-shadow:0 0 8px #cc3428,0 2px 0 #0b0606;opacity:0}',
 '#r1174Awake.on .r1174title{animation:r1174Name 1.6s ease-out forwards}',
 '@keyframes r1174AwBg{0%{opacity:0}12%{opacity:1}72%{opacity:1}100%{opacity:0}}',
 '@keyframes r1174Ring{0%{opacity:0;transform:scale(.4) rotate(-30deg)}18%{opacity:1;transform:scale(1) rotate(0)}70%{opacity:.85;transform:scale(1.06) rotate(12deg)}100%{opacity:0;transform:scale(1.25) rotate(20deg)}}',
 '@media (prefers-reduced-motion:reduce){#r1174Awake.on .r1174ring{animation-name:r1174Fade}}',
 '#awakeImage[data-r1174]{object-fit:cover!important;object-position:50% 6%;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 46%,#000 62%,transparent 100%);filter:drop-shadow(0 0 14px rgba(204,52,40,.75))}',
 '#sw8Awakening[data-side="hero"] img[data-r1174]{filter:drop-shadow(0 0 20px rgba(204,52,40,.6))}'
].join('\n');
function style(d){if(d.getElementById&&d.getElementById('r1174Style'))return;const st=d.createElement('style');st.id='r1174Style';st.textContent=CSS;(d.head||d.body).appendChild(st);}
function build(){if(el)return el;const d=doc();if(!d)return null;style(d);const e=d.createElement('div');e.id='r1174Cutin';e.setAttribute('aria-hidden','true');d.body.appendChild(e);el=e;return e;}
function orb(d,kind,tone,i){const s=ART[kind];const n=d.createElement('div');n.className='r1174f r1174orb';n.setAttribute('data-fig',kind);n.setAttribute('data-tone',tone);n.setAttribute('data-src',s.path);
 const c=s.f%s.cols,r=Math.floor(s.f/s.cols);n.style.backgroundImage='url("'+U(s.path)+'")';n.style.backgroundSize=(s.cols*100)+'% '+(s.rows*100)+'%';
 n.style.backgroundPosition=(c/(s.cols-1)*100)+'% '+(r/(s.rows-1)*100)+'%';n.style.setProperty('--d',(i*.07).toFixed(2)+'s');return n;}
function show(kind){try{const cast=CAST[kind];if(!cast){stats.skipped++;return false;}const e=build();if(!e){stats.skipped++;return false;}const d=e.ownerDocument||doc()||e.doc;
  while(e.firstChild)e.removeChild(e.firstChild);e.setAttribute('data-kind',kind);e.setAttribute('data-look',LOOK[kind]);e.setAttribute('data-hero','persona');
  cast.forEach(([k,tone],i)=>{if(k==='main'){const n=d.createElement('img');n.className='r1174f r1174main';n.setAttribute('data-fig','main');n.setAttribute('alt','');n.setAttribute('src',U(pick(ART.bust)));G(()=>{n.decoding='async';});n.style.setProperty('--d',(i*.07).toFixed(2)+'s');e.appendChild(n);}else e.appendChild(orb(d,k,tone,i));});
  const nm=d.createElement('div');nm.className='r1174name';nm.textContent=NAMES[kind];e.appendChild(nm);
  e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(timer);timer=setTimeout(()=>{try{e.classList.remove('on');}catch(_){}},MS);
  stats.shown++;last={kind,at:G(()=>time,null)};return true;}catch(err){fail(err);return false;}}
// ---- 사몽 각성 ----
function overlay(){if(ov)return ov;const d=doc();if(!d)return null;style(d);const host=G(()=>d.getElementById('stage'),null)||d.body;const o=d.createElement('div');o.id='r1174Awake';o.setAttribute('aria-hidden','true');
 const r=d.createElement('div');r.className='r1174ring';const t=d.createElement('div');t.className='r1174title';t.textContent='페르소나 · 순수악의';o.appendChild(r);o.appendChild(t);host.appendChild(o);ov=o;return o;}
function awakeFx(){const o=overlay();if(!o)return;o.classList.remove('on');void o.offsetWidth;o.classList.add('on');clearTimeout(timer2);timer2=setTimeout(()=>{try{o.classList.remove('on');}catch(_){}},AWAKE_MS);}
function wrapAwake(){try{if(typeof showAwakening!=='function'||showAwakening.__r1174)return;const base=showAwakening;
  const w=function(...a){const p=pl(),on=persona(p);let art=null,old;
   if(on){try{art=heroArt[BASE];if(art&&typeof art==='object'){old=art.awakening;art.awakening=pick(ART.awake);}else art=null;}catch(e){art=null;}}
   try{return base.apply(this,a);}
   finally{if(art)art.awakening=old;
    if(on){try{stats.awake++;const d=doc();if(d){const want=U(pick(ART.awake)),im=d.getElementById('awakeImage');if(im){if(im.getAttribute('src')!==want)im.src=want;im.removeAttribute&&im.removeAttribute('data-r1033');im.setAttribute('data-r1174','1');}
      const h=d.getElementById('awakeHero');if(h&&!/^페르소나/.test(h.textContent))h.textContent=h.textContent.replace(/^[^·]*/,'페르소나 ');
      const b=G(()=>d.querySelector('#sw8Awakening img'),null);if(b){b.removeAttribute&&b.removeAttribute('data-r1033');b.setAttribute('data-r1174','1');}}awakeFx();}catch(e){fail(e);}}}};
  w.__r1174=true;showAwakening=w;}catch(e){fail(e);}}
// ---- 형상일 때만 그림 미리 읽기 ----
let warmedOnce=false;
function warm(){try{if(warmedOnce||!persona(pl())||typeof Image!=='function')return;warmedOnce=true;for(const p of [pick(ART.bust),pick(ART.awake),ART.star.path,ART.eclipse.path]){const im=new Image();im.decoding='async';im.src=U(p);stats.warmed++;}build();}catch(e){fail(e);}}
function install(){wrapAwake();G(()=>setInterval(warm,2000));warm();}
if(G(()=>document.readyState==='complete',false))install();else G(()=>window.addEventListener('load',install));
window.__STORYWORLD_PERSONA_CUTIN_R1174__=Object.freeze({revision:REV,persona,show,kinds:Object.freeze(Object.keys(CAST)),names:NAMES,art:ART,install,warm,
 inspect:()=>({revision:REV,shown:stats.shown,awake:stats.awake,skipped:stats.skipped,errors:stats.errors,lastError,warmed:stats.warmed,last:last&&{...last},
  visible:!!(el&&el.classList.contains('on')),awakeVisible:!!(ov&&ov.classList.contains('on')),bust:pick(ART.bust),awakeArt:pick(ART.awake)}),
 qaNow:()=>false});
})();
