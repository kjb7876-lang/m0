// R1100 EGO 환도 그림 가드(사용자 2026-11-16 03:54Z "히든영웅에고 이미지전수검사해서 환도영웅 자꾸 나오는문제").
//  EGO(R1046 히든 형상, 몸은 환도의 계보)는 R1048 이 환도 몸 그림을 EGO 시트로 바꿔 그린다. 헤드리스 전수 측정(2D·3D·저사양 × 대기·8방향·공격·막기·
//  순간이동·Q·F·삼협묵희·피격·지역 이동)에서 그래도 환도 그림이 남는 길이 넷 있었다:
//   ① 엔진 잔상(drawEffect type 'ghost' — 순간이동·Q 정화 연참)이 환도 걷기/동작 아틀라스로 그려진다(저사양에서 가장 잦음).
//   ② R1048 보다 늦게 실린 환도 덧씌우기(R242·R283 피격 자세, R439 공격 자세 등)가 drawHero 를 바깥에서 감싸 R1048 이 바꾼 뒤에 환도 몸을 다시 얹는다.
//   ③ R1048 이 EGO 시트를 아직 못 받은 프레임(지역 이동 직후)엔 EGO 시작 3초가 지나면 환도 몸을 그대로 둔다.
//   ④ 삼협묵희 컷인(R945, 화면 위 DOM)이 환도 초상을 띄운다.
//  → 모든 스크립트가 실린 뒤(1초 주기 설치) drawHero 를 가장 바깥에서 감싸, EGO 형상일 때 영웅 몫 그림 명령 중 '환도 몸 그림'(R1048 bodyArt, r1048/ 제외)을 투명하게 한다.
//    잔상은 환도 그림이면 그리지 않는다(EGO 잔상은 R1048 이 따로 그림). 컷인은 EGO 형상일 때 환도 것만 막는다(R1033 allow).
//  RC151 변신(엔진 '마지막 수호자 EGO')은 따로 그림표가 있으므로 건드리지 않는다. 판정·피해·저장은 그대로. 끄기: localStorage storyworld.r1100.egoGuard = {"on":false}.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_GUARD_R1100__)return;
const REV='R1100-ego-guard-1',KEY='storyworld.r1100.egoGuard';
const MIN_H=1;// 크기와 상관없이 영웅 몫 환도 몸이면 숨긴다(삼협묵희 분신은 5px 까지 작게도 그려짐). 높이 0 인 퇴화 명령만 뺀다
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={heroCalls:0,hidden:0,ghostsSkipped:0,cutinBlocked:0,errors:0};let lastError=null,lastHidden=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=Number.isFinite;
// EGO 히든 형상일 때만(RC151 변신 중이면 아님)
// 게임 시작 첫 프레임: EGO 칸을 고르고 시작을 누른 뒤 R1046 이 형상을 켜기(ui 200ms 주기) 전까지 환도로 그려진다 → 고른 상태(commit)도 EGO 로 본다
function egoForm(){if(!on)return false;try{const S=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;if(!S)return false;if(S.formActive?.())return !S.inspect?.().rc151;const I=S.inspect?.();if(I?.commit!==true||I.rc151)return false;const p=typeof player==='object'?player:null;return !!(p&&p.hero==='hwando');}catch(_){return false;}}
const FALLBACK=/hero_direction|hero-authored|assets\/heroes\/|\/hwando\/|hwando-(?:walk|action|idle|attack|hit|run)/;
// 순수 계산: 이 경로가 환도 몸 그림인가(EGO 그림 r1048/ 은 아님)
function hwBody(path){const s=String(path||'');if(!s||/(?:^|\/)r1048\//.test(s))return false;try{const M=window.__STORYWORLD_EGO_MOTION_R1048__;if(M&&typeof M.bodyArt==='function')return !!M.bodyArt(s)&&!/^blob:/.test(s);}catch(_){}return FALLBACK.test(s);}
const srcOf=c=>{try{return String(c?.sourcePath||c?.image?.src||c?.image?.currentSrc||'');}catch(_){return'';}};
const height=c=>{const p=c?.points;if(!Array.isArray(p)||p.length<4)return 0;const h=Math.abs((+p[3]?.[1]||0)-(+p[0]?.[1]||0));return fin(h)?h:0;};
// 순수 계산: 기록 명령들(st 이후) 중 영웅 몫 환도 몸 그림을 투명하게. 바꾼 개수를 돌려준다.
function hideIn(cmds,st){if(!Array.isArray(cmds))return 0;let n=0;for(let i=Math.max(0,st|0);i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.owner?.kind!=='hero')continue;
 const s=srcOf(c);if(!hwBody(s))continue;if(Array.isArray(c.points)&&!(height(c)>=MIN_H))continue;/* 점 없는 명령(3D 분신 일부)도 몸으로 본다 */const a=+(c.style?.globalAlpha??1);if(!(a>0))continue;c.style={...(c.style||{}),globalAlpha:0};c.egoGuardR1100=true;lastHidden=s.replace(/^.*?assets\//,'assets/');n++;}return n;}
const done={};
function wrapHero(){if(done.hero||typeof drawHero!=='function')return;done.hero=true;const base=drawHero;
 drawHero=function(...a){let rec=null,st=-1;try{rec=typeof ctx==='object'?ctx:null;st=Array.isArray(rec?.commands)?rec.commands.length:-1;}catch(_){}const r=base.apply(this,a);
  try{if(st>=0&&egoForm()){stats.heroCalls++;stats.hidden+=hideIn(rec.commands,st);}}catch(e){fail(e);}return r;};}
function wrapEffect(){if(done.fx||typeof drawEffect!=='function')return;done.fx=true;const base=drawEffect;
 drawEffect=function(e,...a){try{if(e&&e.type==='ghost'&&hwBody(e.asset)&&egoForm()){stats.ghostsSkipped++;return;}}catch(err){fail(err);}return base.call(this,e,...a);};}
function wrapCutin(){if(done.cut)return;const R=window.__STORYWORLD_PASSIVE_CUTIN_R1033__;if(!R||typeof R.allow!=='function')return;done.cut=true;
 try{const allow0=R.allow;window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze({...R,allow(hero,...x){if(hero==='hwando'&&egoForm()){stats.cutinBlocked++;return false;}return allow0.call(R,hero,...x);}});}catch(e){fail(e);}}
// 모든 스크립트가 실린 뒤 가장 바깥에서 감싸야 늦게 실린 환도 덧씌우기까지 덮는다 → 첫 설치는 load 뒤, 그 뒤 1초마다 빠진 것만
function install(){try{wrapHero();wrapEffect();wrapCutin();}catch(e){fail(e);}}
const start=()=>{install();try{setInterval(install,1000);}catch(_){}};
try{if(document.readyState==='complete')setTimeout(start,0);else window.addEventListener('load',()=>setTimeout(start,0),{once:true});}catch(_){start();}
window.__STORYWORLD_EGO_GUARD_R1100__=Object.freeze({revision:REV,hwBody,hideIn,egoForm,installed:()=>({...done}),
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,form:egoForm(),installed:{...done},stats:{...stats},lastHidden,lastError})});
})();
