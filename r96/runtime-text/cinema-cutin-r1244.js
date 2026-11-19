// R1244 극장판 컷인 — 사용자 2026-11-19 14:37Z "사몽각성스킬및특수확률패시브 연출씬강화해줘 보다 간지나게 영화극장판애니 같은
//  역동적인연출과 영웅특성살아나게 필요한자산은 닷츠랑협업" (참고: Threads @rlaope 영상 14.7초).
//  참고 영상의 연출 문법(프레임 분석): ① 이름판·무기 → ② 사선 베기 한 줄이 화면을 가르는 스매시 컷 → ③ 베인 틈(사선 슬릿) 속 눈 클로즈업, 천천히 밀고 들어감
//   → ④ 눈동자가 문양으로 바뀌는 매치 컷 → ⑤ 흑백 반전 임팩트 프레임 → ⑥ 정적인 마무리. 두 색 제한 팔레트, 컷은 짧고 단단하게.
//  이 파일은 그 문법을 기존 컷인 위에 한 겹 얹는다(기존 R1033 띠·R945 환도 3인·R1174 페르소나·엔진 사몽 컷인은 그대로):
//   · 특수 확률 패시브(R1033 fire 가 통과시킨 3단, 환도 삼협묵희, EGO 삼협묵희): 화면 가운데 아래쪽 사선 슬릿에 눈 클로즈업 → 시그니처 시트 매치 컷, 1.1초.
//     R1033 띠(화면 위쪽 1/3)와 겹치지 않는 자리라 한 장면이 만화 칸처럼 두 칸으로 읽힌다. 빈도는 R1033 시계(스토리 8초·무한생존 20초) 그대로.
//   · 사몽 각성(showAwakening): 위아래 시네마 띠 → 베기(환도·EGO 는 먹 붓 시트) → 눈 슬릿 → 문양 매치 컷 → 임팩트 프레임 1번, 1.6초.
//  영웅 특성: 눈 초점(영웅 선택 창 초상화의 실제 눈 위치), 슬릿 기울기, 시그니처 프레임 시트(그 영웅 스킬에 실제로 쓰는 Dots 시트), 두 색 팔레트.
//   고유색: 환도 = 먹+흰, EGO = 언주+먹+흰, 페르소나 = 언주·흑·검빨(보라 없음).
//  그림: 이미 있는 초상화·Dots 프레임 시트만 쓴다(도형 이펙트·코드로 그린 선 0). 눈 클로즈업 전용 원화·영웅별 베기 시트는 Dots 요청(CX-0178CN) — 오면 EYE·SLASH 경로만 채움.
//  렉(사몽 각성 R1199·R1217 회귀 금지): 게임 캔버스·3D 기록기를 건드리지 않는 DOM 한 겹(노드 10개), 그림은 형상이 바뀔 때만 미리 읽음(≤4장),
//   칸 넘기기는 재생 중에만 도는 setTimeout 사슬(1/24초, 끝나면 멈춤), blur·drop-shadow 없음. 성능 7단계 1~2·모션 줄이기면 lite(칸 넘기기·임팩트·베기 없음).
//  끄기: localStorage 'storyworld.r1244.cine'='0' 또는 set(false). 서사·판정·쿨타임·스킬 키는 건드리지 않는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_CINEMA_CUTIN_R1244__)return;
const REV='R1244-cinema-cutin-2',KEY='storyworld.r1244.cine',DUR=Object.freeze({passive:1100,awake:1600}),FPS=24;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const U=p=>{try{const u=typeof urlFor==='function'?urlFor(p):p;return typeof u==='string'&&u&&!/["\\]/.test(u)?u:p;}catch(_){return p;}};
const BUST=h=>'assets/r108/heroes/'+h+'.webp';
const sheet=(path,cols,rows,frames,ar=1)=>Object.freeze({path,cols,rows,frames,ar});
/* R1244b: Dots CX-0178CN 눈 클로즈업 4칸(2×2, 칸 1280×320): 0 평상 · 1 결의 · 2 발동 문양 · 3 반쯤 감김 — scripts/r1244-eye-dots.py. R1244c 에서 헌터·기억사수도 도착(10형상 모두). */
const EYE=f=>Object.freeze({path:'assets/r1244/eye-'+f+'.webp',cols:2,rows:2,ar:4});
/* R1244c: Dots CX-0178CN 2차분 — 베기 4×3(12칸, 칸 512×128: 0~5 길어짐·6~11 잔광 줄어듦), 임팩트 정지 그림(1280×720, 반전 흑백으로 구움) — scripts/r1244-dots-r2.py. 서하 베기는 R1244c-2 에서 r2 도착. 베기 요소는 120vw×30vw 로 칸 4:1 그대로 */
const SLASH=f=>sheet('assets/r1244/slash-'+f+'.webp',4,3,12,4);
const IMP=f=>'assets/r1244/impact-'+f+'.webp';
const INK_SWEEP=sheet('assets/r945/hwando-ink-sweep.webp',4,4,16,4);/* 환도 먹 붓 16칸(512×128) — 베기 한 줄 */
// 형상 표: eye = 초상화와 눈 초점(가로·세로 비율, 그림 가로/세로 비, z = 화면 폭 대비 확대 — 헤드리스 장면으로 눈이 슬릿 가운데 오게 맞춤), sig = 매치 컷 시그니처 시트, slash = 여는 베기 시트(없으면 슬릿만), tilt = 슬릿 기울기(도)
const PROFILES=Object.freeze({
 seoha:{eye:{path:BUST('seoha'),fx:0.55,fy:0.245,ar:.75,z:1.3,sheet:EYE('seoha')},sig:sheet('assets/r564/seoha-time-blink.webp',6,4,24),slash:SLASH('seoha'),impact:IMP('seoha'),tilt:-9,passive:'수문장 아르벨리아',colors:{key:'#78d2ff',ink:'#08142a',light:'#e8ce8c'}},
 hunter:{eye:{path:BUST('hunter'),fx:0.5,fy:0.2,ar:.75,z:1.3,sheet:EYE('hunter')},sig:sheet('assets/r535/hunter-fire-arrowhead.webp',6,4,24),slash:SLASH('hunter'),impact:IMP('hunter'),tilt:8,passive:'기러기진 섬멸',colors:{key:'#f1d9a0',ink:'#4a1812',light:'#e08a92'}},
 slayer:{eye:{path:BUST('slayer'),fx:0.62,fy:0.15,ar:.75,z:1.3,sheet:EYE('slayer')},sig:sheet('assets/r585/slayer-r-cross.webp',6,4,24),slash:SLASH('slayer'),impact:IMP('slayer'),tilt:-7,passive:'혈격자',colors:{key:'#c81422',ink:'#220408',light:'#f0e6e0'}},
 michaela:{eye:{path:BUST('michaela'),fx:0.48,fy:0.245,ar:.75,z:1.3,sheet:EYE('michaela')},sig:sheet('assets/r948/mh03-heart24.webp',6,4,24),slash:SLASH('michaela'),impact:IMP('michaela'),tilt:6,passive:'연심 대개화',colors:{key:'#b21a3e',ink:'#3a0a18',light:'#e2e8f2'}},
 gunner:{eye:{path:BUST('gunner'),fx:0.48,fy:0.19,ar:.75,z:1.3,sheet:EYE('gunner')},sig:sheet('assets/r561/gunner-q-muzzle.webp',6,4,24),slash:SLASH('gunner'),impact:IMP('gunner'),tilt:-5,passive:'귀환 전우',colors:{key:'#4682e6',ink:'#081024',light:'#c8d7f0'}},
 lauren:{eye:{path:BUST('lauren'),fx:0.47,fy:0.2,ar:.75,z:1.3,sheet:EYE('lauren')},sig:sheet('assets/r946/lauren-blue.webp',6,4,24),slash:SLASH('lauren'),impact:IMP('lauren'),tilt:9,passive:'유성 궤도',names:{meteor:'유성 궤도',violet:'쌍성 소멸'},colors:{key:'#9a5ad2',ink:'#160a26',light:'#e2e2f0'}},
 neon:{eye:{path:BUST('neon'),fx:0.56,fy:0.215,ar:.75,z:1.3,sheet:EYE('neon')},sig:sheet('assets/r951/neon-skybeam.webp',6,2,12,.25),slash:SLASH('neon'),impact:IMP('neon'),tilt:-11,passive:'천공 낙뢰',colors:{key:'#5ff0c8',ink:'#061a18',light:'#e8c460'}},
 hwando:{eye:{path:BUST('hwando'),fx:0.47,fy:0.25,ar:.75,z:1.4,sheet:EYE('hwando')},sig:sheet('assets/r945/hwando-ink-burst.webp',6,2,12),slash:INK_SWEEP,impact:IMP('hwando'),tilt:-8,passive:'삼협묵희',colors:{key:'#f2eee2',ink:'#0e0e0e',light:'#b8b4aa'}},
 ego:{eye:{path:'assets/r1046/ego-portrait.webp',fx:0.51,fy:0.275,ar:.75,z:1.9,sheet:EYE('ego')},sig:sheet('assets/r1174/persona-sigil12.webp',6,2,12),slash:INK_SWEEP,impact:IMP('ego'),tilt:-8,passive:'삼협묵희',name:'EGO',colors:{key:'#cc3428',ink:'#0e0b0b',light:'#f2eee8'}},
 persona:{eye:{path:'assets/r1174/persona-bust.webp',fx:0.5,fy:0.235,ar:.75,z:1.3,sheet:EYE('persona')},sig:sheet('assets/r1174/persona-sigil12.webp',6,2,12),slash:SLASH('persona'),impact:IMP('persona'),tilt:7,passive:'(진) 유성 궤도',names:{meteor:'(진) 유성 궤도',violet:'(진) 쌍성 소멸'},name:'페르소나',colors:{key:'#cc3428',ink:'#0b0606',light:'#f2d6cf',deep:'#5a0c12'}}});
const FORMS=Object.freeze(Object.keys(PROFILES));
const stats={shown:0,awake:0,passive:0,skipped:{off:0,form:0,body:0,scene:0,dom:0,gap:0},errors:0,warmed:0,frames:0,wraps:0};let lastError=null,last=null,el=null,parts=null,offTimer=0,tickTimer=0,token=0,nowFn=null,hwAt=-1e9;
function fail(e){stats.errors++;lastError=String(e&&e.message||e).slice(0,200);}
function on(){return G(()=>localStorage.getItem(KEY),null)!=='0';}
function set(v){G(()=>localStorage.setItem(KEY,v?'1':'0'));return on();}
const now=()=>{const v=nowFn?nowFn():G(()=>performance.now()/1000,NaN);return Number.isFinite(v)?v:G(()=>Date.now()/1000,0);};
const scene=()=>!!(G(()=>typeof modal!=='undefined'&&modal,null)||G(()=>typeof storyScene!=='undefined'&&storyScene,null));
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const egoForm=()=>G(()=>!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.()&&!(typeof ego151!=='undefined'&&ego151?.active),false);
function formOf(p){if(!p||typeof p!=='object')return null;if(p.hero==='lauren'&&p.personaHeroR1113===true)return 'persona';if(egoForm())return 'ego';return PROFILES[p.hero]?p.hero:null;}
function lite(){const step=G(()=>{const s=localStorage.getItem('storyworld.r1043.perf7');return s?Number(JSON.parse(s).step):NaN;},NaN);
 if(Number.isFinite(step)&&step<=2)return true;return !!G(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,false)||!!G(()=>settings.reducedMotion,false);}
function nameOf(form){const P=PROFILES[form];return P.name||G(()=>HEROES[form].name,null)||form;}
// ---- DOM ----
const CSS=[
 '#r1244Cine{position:fixed;inset:0;pointer-events:none;z-index:46;visibility:hidden;contain:strict;--k:#fff;--i:#000;--l:#ccc;--t:-8deg}',
 '#r1244Cine.on{visibility:visible}',
 '#r1244Cine .r1244bar{position:absolute;left:0;right:0;height:11vh;background:var(--i);opacity:0;transform:scaleY(0)}',
 '#r1244Cine .r1244bar.t{top:0;transform-origin:50% 0}#r1244Cine .r1244bar.b{bottom:0;transform-origin:50% 100%}',
 '#r1244Cine .r1244slit{position:absolute;left:-8vw;right:-8vw;top:var(--sy,47vh);height:var(--sh,20vh);transform:rotate(var(--t)) scaleY(0);overflow:hidden;background:var(--d,var(--i));will-change:transform}',
 '#r1244Cine .r1244eye{position:absolute;inset:0;background-repeat:no-repeat;transform-origin:var(--ex,50%) 50%;filter:contrast(1.12) brightness(1.08)}',
 '#r1244Cine .r1244slash{position:absolute;left:-10vw;top:calc(var(--sy,47vh) + var(--sh,20vh)/2 - 15vw);width:120vw;height:30vw;transform:rotate(var(--t));background-repeat:no-repeat;opacity:0}',
 '#r1244Cine .r1244sig{position:absolute;left:50%;top:calc(var(--sy,47vh) + var(--sh,20vh)/2);height:min(44vh,46vw);transform:translate(-50%,-50%) scale(.6);background-repeat:no-repeat;opacity:0}',
 '#r1244Cine .r1244impact{position:absolute;inset:0;background-repeat:no-repeat;background-position:50% 22%;background-size:cover;opacity:0;visibility:hidden;filter:grayscale(1) contrast(3.2) invert(1)}',
 '#r1244Cine .r1244plate{position:absolute;left:6vw;top:calc(var(--sy,47vh) + var(--sh,20vh) + 1.2vh);color:var(--l);font:700 clamp(15px,2.6vw,28px)/1.1 Georgia,"Nanum Myeongjo",serif;letter-spacing:.32em;text-shadow:0 0 6px var(--i),0 0 2px var(--i);opacity:0;white-space:nowrap}',
 '#r1244Cine .r1244plate b{color:var(--k);font-weight:700}#r1244Cine .r1244plate span{font-size:.62em;letter-spacing:.5em;margin-left:.8em;opacity:.9}',
 // 패시브(1.1초): 슬릿 열림 → 눈 밀고 들어감 → 닫히며 문양 매치 컷
 '#r1244Cine.on[data-mode="passive"] .r1244slit{animation:r1244Slit 1.1s cubic-bezier(.2,.9,.2,1) forwards}',
 '#r1244Cine.on[data-mode="passive"] .r1244eye{animation:r1244Dolly 1.1s linear forwards}',
 '#r1244Cine.on[data-mode="passive"] .r1244sig{animation:r1244Sig 1.1s ease-out forwards}',
 '#r1244Cine.on[data-mode="passive"] .r1244slash{animation:r1244Slash 1.1s linear forwards}',
 '#r1244Cine.on[data-mode="passive"] .r1244plate{animation:r1244Plate 1.1s cubic-bezier(.2,.8,.2,1) forwards}',
 '@keyframes r1244Slit{0%{transform:rotate(var(--t)) scaleY(0)}7%{transform:rotate(var(--t)) scaleY(.08)}18%{transform:rotate(var(--t)) scaleY(1)}62%{transform:rotate(var(--t)) scaleY(1)}76%{transform:rotate(var(--t)) scaleY(.02);visibility:visible}77%,100%{transform:rotate(var(--t)) scaleY(0);visibility:hidden}}',
 '@keyframes r1244Dolly{0%{transform:scale(1.18) translateX(2vw)}18%{transform:scale(1.04)}62%{transform:scale(1.13)}100%{transform:scale(1.2)}}',
 '@keyframes r1244Sig{0%,57%{visibility:hidden}0%,58%{opacity:0;transform:translate(-50%,-50%) scale(.55)}68%{opacity:1;transform:translate(-50%,-50%) scale(1)}88%{opacity:1;transform:translate(-50%,-50%) scale(1.18)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}}',
 '@keyframes r1244Slash{0%{opacity:1}16%{opacity:1}24%{opacity:0;visibility:visible}25%,100%{opacity:0;visibility:hidden}}',
 '@keyframes r1244Plate{0%,6%{opacity:0;transform:translateX(-4vw)}20%{opacity:1;transform:translateX(0)}82%{opacity:1;transform:translateX(1vw)}100%{opacity:0;transform:translateX(2vw)}}',
 // 사몽 각성(1.6초): 시네마 띠 → 베기 → 눈 슬릿 → 문양 매치 컷 → 임팩트 프레임 1번
 '#r1244Cine.on[data-mode="awake"] .r1244bar{animation:r1244Bar 1.6s cubic-bezier(.2,.9,.2,1) forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244slit{animation:r1244SlitA 1.6s cubic-bezier(.2,.9,.2,1) forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244eye{animation:r1244DollyA 1.6s linear forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244sig{animation:r1244SigA 1.6s ease-out forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244slash{animation:r1244SlashA 1.6s linear forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244impact{animation:r1244Impact 1.6s steps(1,end) forwards}',
 '#r1244Cine .r1244impact[data-baked="1"]{filter:none}',
 '#r1244Cine.on[data-mode="awake"] .r1244impact[data-baked="1"]{animation:r1244ImpactD 1.6s steps(1,end) forwards}',
 '#r1244Cine.on[data-mode="awake"] .r1244plate{animation:r1244PlateA 1.6s cubic-bezier(.2,.8,.2,1) forwards}',
 '@keyframes r1244Bar{0%{opacity:0;transform:scaleY(0)}9%{opacity:.88;transform:scaleY(1)}86%{opacity:.88;transform:scaleY(1)}100%{opacity:0;transform:scaleY(0)}}',
 '@keyframes r1244SlitA{0%,7%{transform:rotate(var(--t)) scaleY(0)}12%{transform:rotate(var(--t)) scaleY(.1)}20%{transform:rotate(var(--t)) scaleY(1)}53%{transform:rotate(var(--t)) scaleY(1)}60%{transform:rotate(var(--t)) scaleY(.02);visibility:visible}61%,100%{transform:rotate(var(--t)) scaleY(0);visibility:hidden}}',
 '@keyframes r1244DollyA{0%{transform:scale(1.22) translateX(2.5vw)}20%{transform:scale(1.05)}53%{transform:scale(1.16)}100%{transform:scale(1.22)}}',
 '@keyframes r1244SigA{0%,51%{visibility:hidden}0%,52%{opacity:0;transform:translate(-50%,-50%) scale(.5)}62%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}86%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.4)}}',
 '@keyframes r1244SlashA{0%{opacity:1}12%{opacity:1}18%{opacity:0;visibility:visible}19%,100%{opacity:0;visibility:hidden}}',
 '@keyframes r1244ImpactD{0%,57%{opacity:0;visibility:hidden}58%{opacity:.62;visibility:visible}62%,100%{opacity:0;visibility:hidden}}',
 '@keyframes r1244Impact{0%,57%{opacity:0;visibility:hidden}58%{opacity:.42;visibility:visible}62%,100%{opacity:0;visibility:hidden}}',
 '@keyframes r1244PlateA{0%,9%{opacity:0;transform:translateX(-5vw)}22%{opacity:1;transform:translateX(0)}84%{opacity:1;transform:translateX(1.2vw)}100%{opacity:0;transform:translateX(2.4vw)}}',
 // lite: 칸 넘기기·임팩트·베기 없이 슬릿·이름판만 부드럽게
 '#r1244Cine[data-lite="1"] .r1244impact,#r1244Cine[data-lite="1"] .r1244slash{display:none}',
 '#r1244Cine.on[data-lite="1"] .r1244eye{animation:none}',
 // 형상별 보정(어두운 두건 얼굴은 밝게)
 '#r1244Cine[data-form="hwando"] .r1244eye,#r1244Cine[data-form="ego"] .r1244eye{filter:grayscale(.85) contrast(1.3) brightness(1.35)}',
 '#r1244Cine[data-form="ego"] .r1244eye{filter:contrast(1.25) brightness(1.3)}'
].join('\n');
function build(){if(el)return el;const d=G(()=>typeof document!=='undefined'?document:null,null);if(!d||typeof d.createElement!=='function'||!d.body)return null;
 const st=d.createElement('style');st.id='r1244CineStyle';st.textContent=CSS;if(d.head)d.head.appendChild(st);
 const e=d.createElement('div');e.id='r1244Cine';e.setAttribute('aria-hidden','true');
 const mk=(cls,parent=e,tag='div')=>{const n=d.createElement(tag);n.className=cls;parent.appendChild(n);return n;};
 const bt=mk('r1244bar t'),bb=mk('r1244bar b'),slit=mk('r1244slit'),eye=mk('r1244eye',slit),slash=mk('r1244slash'),sig=mk('r1244sig'),impact=mk('r1244impact'),plate=mk('r1244plate'),pb=mk('',plate,'b'),ps=mk('',plate,'span');
 d.body.appendChild(e);el=e;parts={bt,bb,slit,eye,slash,sig,impact,plate,pb,ps};return e;}
const cell=(s,f)=>{f=Math.max(0,Math.min(s.frames-1,Math.floor(f)));const c=f%s.cols,r=Math.floor(f/s.cols);return (s.cols>1?c/(s.cols-1)*100:0).toFixed(2)+'% '+(s.rows>1?r/(s.rows-1)*100:0).toFixed(2)+'%';};
function paintSheet(n,s){n.setAttribute('data-src',s.path);n.style.backgroundImage='url("'+U(s.path)+'")';n.style.backgroundSize=(s.cols*100)+'% '+(s.rows*100)+'%';n.style.aspectRatio=String(s.ar);n.style.backgroundPosition=cell(s,0);}
// 눈 초점: 초상화를 화면 폭의 k 배로 키우고, 초점이 슬릿 가운데 오도록 배경 위치(%)를 계산
// 시트 한 칸을 상자(bw×bh)에 덮기(cover): px 크기·위치 — 화면 비율이 달라도 칸 가운데(눈)가 상자 가운데
function coverCell(n,sh,bw,bh,f){const cw=Math.max(bw,bh*sh.ar),ch=cw/sh.ar,c=f%sh.cols,r=Math.floor(f/sh.cols);
 n.style.backgroundSize=(cw*sh.cols).toFixed(1)+'px '+(ch*sh.rows).toFixed(1)+'px';
 n.style.backgroundPosition=(-(c*cw)-(cw-bw)/2).toFixed(1)+'px '+(-(r*ch)-(ch-bh)/2).toFixed(1)+'px';n.setAttribute('data-frame',String(f));}
const box=()=>{const vw=G(()=>innerWidth,1280)||1280,vh=G(()=>innerHeight,720)||720;return {vw,vh,sw:vw*1.16,sh:.24*vh};};
function placeEye(n,P,mode){if(P.eye.sheet){const S=P.eye.sheet,b=box();n.setAttribute('data-src',S.path);n.style.backgroundImage='url("'+U(S.path)+'")';coverCell(n,S,b.sw,b.sh,0);return;}
 n.removeAttribute('data-frame');const vw=G(()=>innerWidth,1280)||1280,vh=G(()=>innerHeight,720)||720,k=(P.eye.z||1.3)*(mode==='awake'?1.08:1),sh=.24*vh,sw=vw*1.16;
 const pw=sw*k,ph=pw/P.eye.ar;const x=(P.eye.fx*pw-sw/2)/(pw-sw)*100,y=(P.eye.fy*ph-sh/2)/(ph-sh)*100;
 n.setAttribute('data-src',P.eye.path);n.style.backgroundImage='url("'+U(P.eye.path)+'")';n.style.backgroundSize=(k*100).toFixed(0)+'% auto';
 n.style.backgroundPosition=Math.max(0,Math.min(100,x)).toFixed(1)+'% '+Math.max(0,Math.min(100,y)).toFixed(1)+'%';}
// 칸 넘기기: 재생 중에만 1/24초 setTimeout 사슬(끝나면 멈춤). 시트 칸 = 시간 창 안 진행률.
const WIN=Object.freeze({passive:{slash:[0,.16],sig:[.58,1],eye:[.30,.48,.62]},awake:{slash:[0,.13],sig:[.52,1],eye:[.26,.40,.52]}});
const eyeFrame=(mode,u)=>{const e=WIN[mode].eye;return u<e[0]?0:u<e[1]?1:u<e[2]?2:3;};
function tick(tk,t0,mode,P,isLite){if(tk!==token)return;tickTimer=0;const dur=DUR[mode]/1000,t=now()-t0;if(!(t<dur))return;
 const w=WIN[mode];const prog=([a,b])=>(t/dur-a)/(b-a);
 if(P.eye.sheet&&!isLite){const f=eyeFrame(mode,t/dur);if(parts.eye.getAttribute('data-frame')!==String(f)){const b=box();coverCell(parts.eye,P.eye.sheet,b.sw,b.sh,f);}}
 const ps=prog(w.sig);if(ps>=0&&ps<=1){parts.sig.style.backgroundPosition=cell(P.sig,ps*P.sig.frames);stats.frames++;}
 if(P.slash){const pl=prog(w.slash);if(pl>=0&&pl<=1)parts.slash.style.backgroundPosition=cell(P.slash,pl*P.slash.frames);}
 if(!isLite)tickTimer=setTimeout(()=>tick(tk,t0,mode,P,isLite),1000/FPS);}
function play(form,mode,kind,owner){try{
  if(!on()){stats.skipped.off++;return false;}
  const P=PROFILES[form];if(!P||!DUR[mode]){stats.skipped.form++;return false;}
  if(isBody(owner)){stats.skipped.body++;return false;}
  if(scene()){stats.skipped.scene++;return false;}
  const e=build();if(!e){stats.skipped.dom++;return false;}
  const isLite=lite(),C=P.colors;token++;clearTimeout(tickTimer);clearTimeout(offTimer);
  e.setAttribute('data-form',form);e.setAttribute('data-mode',mode);e.setAttribute('data-lite',isLite?'1':'0');
  e.style.setProperty('--k',C.key);e.style.setProperty('--i',C.ink);e.style.setProperty('--l',C.light);e.style.setProperty('--d',C.deep||C.ink);e.style.setProperty('--t',P.tilt+'deg');
  e.style.setProperty('--sy',mode==='awake'?'38vh':'46vh');e.style.setProperty('--sh','24vh');
  placeEye(parts.eye,P,mode);paintSheet(parts.sig,P.sig);parts.sig.style.backgroundPosition=cell(P.sig,isLite?P.sig.frames*.45:0);
  if(P.slash)paintSheet(parts.slash,P.slash);else{parts.slash.removeAttribute('data-src');parts.slash.style.backgroundImage='none';}
  if(P.eye.sheet&&isLite){const b=box();coverCell(parts.eye,P.eye.sheet,b.sw,b.sh,2);}
  const ip=P.impact||(P.eye.sheet?P.eye.sheet.path:P.eye.path);parts.impact.setAttribute('data-src',ip);parts.impact.style.backgroundImage=isLite?'none':'url("'+U(ip)+'")';
  /* R1244c: Dots 임팩트 정지 그림(반전 흑백으로 구움) → 필터 없이 화면 가득(머리 위 여백은 구울 때 넣음) */
  if(P.impact){parts.impact.setAttribute('data-baked','1');parts.impact.style.backgroundSize='cover';parts.impact.style.backgroundPosition='50% 0%';/* 넓은 화면(1366×640 등)에서 cover 가 위아래를 자르므로 위에 붙여 머리를 지킴 */parts.impact.removeAttribute('data-frame');}
  else if(P.eye.sheet&&!isLite){parts.impact.removeAttribute('data-baked');const b=box();coverCell(parts.impact,P.eye.sheet,b.vw,b.vh,1);}else{parts.impact.removeAttribute('data-baked');parts.impact.style.backgroundSize='cover';parts.impact.style.backgroundPosition='50% 22%';parts.impact.removeAttribute('data-frame');}
  const nm=nameOf(form),pass=(P.names&&P.names[kind])||P.passive;
  parts.pb.textContent=mode==='awake'?'사몽 각성':nm;parts.ps.textContent=mode==='awake'?nm:pass;
  e.classList.remove('on');void e.offsetWidth;e.classList.add('on');
  const tk=token,t0=now();tickTimer=setTimeout(()=>tick(tk,t0,mode,P,isLite),isLite?0:1000/FPS);
  offTimer=setTimeout(()=>{if(tk!==token)return;try{e.classList.remove('on');clearTimeout(tickTimer);tickTimer=0;}catch(_){}},DUR[mode]);
  stats.shown++;stats[mode]++;last={form,mode,kind:kind||null,lite:isLite};return true;
 }catch(x){fail(x);return false;}}
// ---- 이어 붙이기 ----
const gap=()=>G(()=>window.__STORYWORLD_PASSIVE_CUTIN_R1033__.gap(),8)||8;
function hwandoHook(allowed){try{const ego=egoForm();if(!ego&&allowed===false)return;const t=now();if(t-hwAt<gap()){stats.skipped.gap++;return;}
  if(play(ego?'ego':'hwando','passive','trio',G(()=>player,null)))hwAt=t;}catch(e){fail(e);}}
function wrap1033(){const R=G(()=>window.__STORYWORLD_PASSIVE_CUTIN_R1033__,null);if(!R||typeof R.fire!=='function')return false;
 const fireOk=R.fire.__r1244,allowOk=typeof R.allow!=='function'||R.allow.__r1244;if(fireOk&&allowOk)return true;
 const next={...R};
 if(!fireOk){const f0=R.fire;next.fire=function(h,k,o,x){const r=f0.call(this,h,k,o,x);try{if(r===true){const L=G(()=>R.inspect().last,null);play(L&&L.hero==='persona'?'persona':h,'passive',k,o);}}catch(e){fail(e);}return r;};next.fire.__r1244=true;}
 if(!allowOk){const a0=R.allow;next.allow=function(h,...a){const r=a0.call(this,h,...a);if(h==='hwando')hwandoHook(r);return r;};next.allow.__r1244=true;}
 window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze(next);return true;}
let depth=0;
function wrapAwake(){try{if(typeof showAwakening!=='function'||showAwakening.__r1244)return;const base=showAwakening;
  const w=function(...a){depth++;let r;try{r=base.apply(this,a);}finally{depth--;}if(depth===0){try{const p=G(()=>player,null);const f=formOf(p);if(f)play(f,'awake',null,p);else stats.skipped.form++;}catch(e){fail(e);}}return r;};
  /* 다른 감싸기의 표식(__r1112·__r1174·r1033·__r1217 등)을 그대로 옮겨 단다 — 표식이 없으면 R1046 이 0.5초마다 다시 감싸 서로 끝없이 겹친다 */
  for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))G(()=>{w[k]=base[k];});
  w.__r1244=true;showAwakening=w;stats.wraps++;}catch(e){fail(e);}}
// ---- 지금 형상 그림만 미리 읽기(형상이 바뀔 때만) ----
const warmed=new Set();
function warm(){try{const f=formOf(G(()=>player,null));if(!f||warmed.has(f)||typeof Image!=='function'||!on())return;warmed.add(f);const P=PROFILES[f];
  for(const p of new Set([P.eye.sheet?P.eye.sheet.path:P.eye.path,P.sig.path,P.slash&&P.slash.path,P.impact].filter(Boolean))){const im=new Image();G(()=>{im.decoding='async';});im.src=U(p);stats.warmed++;}build();}catch(e){fail(e);}}
let installs=0;
function install(){installs++;wrap1033();wrapAwake();warm();}
G(()=>setInterval(()=>{if(installs<400)install();else warm();},1500));
if(G(()=>document.readyState==='complete',false))install();else G(()=>window.addEventListener('load',install));
window.__STORYWORLD_CINEMA_CUTIN_R1244__=Object.freeze({revision:REV,forms:FORMS,on,set,play,formOf,lite,install,warm,
 profile:f=>{const P=PROFILES[f];return P?JSON.parse(JSON.stringify(P)):null;},
 inspect:()=>({revision:REV,shown:stats.shown,awake:stats.awake,passive:stats.passive,frames:stats.frames,skipped:{...stats.skipped},errors:stats.errors,lastError,warmed:stats.warmed,wraps:stats.wraps,
  last:last&&{...last},visible:!!(el&&el.classList.contains('on')),form:el?el.getAttribute('data-form'):null}),
 /* 헤드리스 캡처용: 정지한 시각 u(0~1)의 눈 칸을 놓음 */qaPose:u=>{try{const P=last&&PROFILES[last.form];if(!P||!P.eye.sheet||!parts)return null;const f=eyeFrame(last.mode,u),b=box();coverCell(parts.eye,P.eye.sheet,b.sw,b.sh,f);return f;}catch(e){fail(e);return null;}},
 qaNow:f=>{nowFn=typeof f==='function'?f:null;return !!nowFn;},qaReset:()=>{hwAt=-1e9;}});
})();
