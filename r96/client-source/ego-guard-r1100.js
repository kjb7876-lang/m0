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
const REV='R1100-ego-guard-2',KEY='storyworld.r1100.egoGuard';
const MIN_H=1;// 크기와 상관없이 영웅 몫 환도 몸이면 숨긴다(삼협묵희 분신은 5px 까지 작게도 그려짐). 높이 0 인 퇴화 명령만 뺀다
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={heroCalls:0,hidden:0,ghostsSkipped:0,cutinBlocked:0,clones:0,smokeSoft:0,errors:0};let lastError=null,lastHidden=null;
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
// ── R1100b(7분야 심사 7.77: 미술·VFX 7.6, 조명색채 7.7) ──
// ⑤ 삼협묵희 분신: R945 가 분신마다 영웅 그리기를 다시 부르고 먹 필터(grayscale·brightness .1/.92)를 씌워 EGO 몸이 회색 얼룩이 되고 빈 연기 고리·광륜만 읽혔다
//    → 분신 몫(owner.r945Clone) R1048 EGO 몸 칸을 같은 방향 '대기(idle)' 시트 칸으로 바꾸고, 먹 필터 대신 EGO 색을 살린 반투명(.55)으로. 먹 그림자 겹은 .3 이하로.
const CLONE=Object.freeze({alpha:.55,min:.22,shadow:.3,fps:8,filter:'saturate(.9) contrast(1.06) brightness(.96)'});
const idleImgs=new Map();
function idleImg(path){let im=idleImgs.get(path);if(!im){try{im=new Image();im.decoding='async';im.src=path;}catch(_){im=null;}idleImgs.set(path,im);}return im&&im.complete&&(im.naturalWidth||im.width)>0?im:null;}
// 순수 계산: EGO 몸 칸 경로 → 같은 방향 대기 시트 경로(아니면 '')
function idlePath(path){const s=String(path||'');const m=/^(.*\/r1048\/ego\/)([a-z]+)-(n|ne|e|se|s|sw|w|nw)\.(webp|png)(\?.*)?$/.exec(s);return m?m[1]+'idle-'+m[3]+'.'+m[4]:'';}
// 순수 계산: 대기 칸 번호(시각 t, 칸 수 n)
function idleFrame(t,n){n=Math.max(1,n|0);if(!fin(t))return 0;return ((Math.floor(t*CLONE.fps)%n)+n)%n;}
const isShadowPass=c=>/brightness\(0?\.1\)/.test(String(c?.style?.filter||''));
// 기록 명령(st 이후) 중 분신 몫 EGO 몸 칸을 대기 칸·반투명으로. 바꾼 개수.
function cloneIn(cmds,st,t){if(!Array.isArray(cmds))return 0;let n=0;for(let i=Math.max(0,st|0);i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.owner?.kind!=='hero'||!c.owner?.r945Clone||c.egoCloneR1100)continue;
 const src=String(c.sourcePath||'');if(!/(?:^|\/)r1048\/ego\//.test(src))continue;const a0=+(c.style?.globalAlpha??1);if(!(a0>0))continue;
 const ip=idlePath(src),im=ip?idleImg(ip):null;
 if(im){const cell=Array.isArray(c.sourceRect)&&+c.sourceRect[2]>0?+c.sourceRect[2]:160,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,fr=idleFrame(t,Math.round(w/cell));
  c.image=im;c.sourcePath=ip;c.sourceRect=[fr*cell,0,cell,cell];c.imageSize=[w,h];c.r1048='idle';}
 const sh=isShadowPass(c),a=sh?Math.min(a0,CLONE.shadow):Math.max(CLONE.min,Math.min(CLONE.alpha,a0*CLONE.alpha/.86));
 c.style={...(c.style||{}),globalAlpha:fin(a)?a:CLONE.alpha,...(sh?{}:{filter:CLONE.filter})};c.egoCloneR1100=true;n++;}return n;}
// ⑥ 순간이동·분신 흰 연기(R108 eden smoke·R945 먹 증기·blink 잔상)가 3D 에서 EGO 몸을 덮었다 → 영웅 몸 중심 1칸 안의 연기 칸만 알파를 .35~1 로(가까울수록 옅게).
const SMOKE=/smoke|vapor|mist|afterimage/i;
function smokeAlpha(d,tile){if(!fin(d)||!fin(tile)||tile<=0)return 1;const k=Math.max(0,Math.min(1,d/tile));return .35+.65*k*k*(3-2*k);}
function heroPin(){try{const p=typeof player==='object'?player:null;if(!p||typeof project!=='function')return null;const a=project(p.x,p.y),b=project(p.x+1,p.y),ah=typeof actorHeight==='function'?+actorHeight():66;
 const tile=Math.hypot(b.x-a.x,b.y-a.y),lift=Math.max(0,Math.min(60,+p.visualLiftPx||0));const x=a.x,y=a.y-lift-(fin(ah)?ah:66)*.5;return fin(x)&&fin(y)&&fin(tile)&&tile>0?{x,y,tile}:null;}catch(_){return null;}}
function softenSmoke(cmds,st,pin){if(!Array.isArray(cmds)||!pin)return 0;let n=0;for(let i=Math.max(0,st|0);i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.egoSmokeR1100)continue;
 if(!SMOKE.test(String(c.sourcePath||c.image?.src||'')))continue;const P=c.points;if(!Array.isArray(P)||P.length<4)continue;const cx=(+P[0][0]+ +P[2][0])/2,cy=(+P[0][1]+ +P[2][1])/2;
 const k=smokeAlpha(Math.hypot(cx-pin.x,cy-pin.y),pin.tile);if(!(k<1))continue;const a0=+(c.style?.globalAlpha??1);c.style={...(c.style||{}),globalAlpha:fin(a0)?a0*k:k};c.egoSmokeR1100=true;n++;}return n;}
const now=()=>{try{return typeof time==='number'&&fin(time)?time:performance.now()/1000;}catch(_){return 0;}};
let depth=0;
const done={};
function wrapHero(){if(done.hero||typeof drawHero!=='function')return;done.hero=true;const base=drawHero;
 drawHero=function(...a){let rec=null,st=-1;try{rec=typeof ctx==='object'?ctx:null;st=Array.isArray(rec?.commands)?rec.commands.length:-1;}catch(_){}depth++;let r;try{r=base.apply(this,a);}finally{depth--;}
  try{if(st>=0&&egoForm()){stats.heroCalls++;stats.hidden+=hideIn(rec.commands,st);/* 분신 표시는 R945 가 분신 그리기 뒤에 붙이므로 가장 바깥 호출에서 */if(depth===0){stats.clones+=cloneIn(rec.commands,st,now());stats.smokeSoft+=softenSmoke(rec.commands,st,heroPin());}}}catch(e){fail(e);}return r;};}
function wrapEffect(){if(done.fx||typeof drawEffect!=='function')return;done.fx=true;const base=drawEffect;
 drawEffect=function(e,...a){let ego=false,rec=null,st=-1;try{ego=egoForm();if(e&&e.type==='ghost'&&hwBody(e.asset)&&ego){stats.ghostsSkipped++;return;}if(ego){rec=typeof ctx==='object'?ctx:null;st=Array.isArray(rec?.commands)?rec.commands.length:-1;}}catch(err){fail(err);}
  const r=base.call(this,e,...a);try{if(ego&&st>=0)stats.smokeSoft+=softenSmoke(rec.commands,st,heroPin());}catch(err){fail(err);}return r;};}
function wrapCutin(){if(done.cut)return;const R=window.__STORYWORLD_PASSIVE_CUTIN_R1033__;if(!R||typeof R.allow!=='function')return;done.cut=true;
 try{const allow0=R.allow;window.__STORYWORLD_PASSIVE_CUTIN_R1033__=Object.freeze({...R,allow(hero,...x){if(hero==='hwando'&&egoForm()){stats.cutinBlocked++;return false;}return allow0.call(R,hero,...x);}});}catch(e){fail(e);}}
// 모든 스크립트가 실린 뒤 가장 바깥에서 감싸야 늦게 실린 환도 덧씌우기까지 덮는다 → 첫 설치는 load 뒤, 그 뒤 1초마다 빠진 것만
function install(){try{wrapHero();wrapEffect();wrapCutin();}catch(e){fail(e);}}
const start=()=>{install();try{setInterval(install,1000);}catch(_){}};
try{if(document.readyState==='complete')setTimeout(start,0);else window.addEventListener('load',()=>setTimeout(start,0),{once:true});}catch(_){start();}
window.__STORYWORLD_EGO_GUARD_R1100__=Object.freeze({revision:REV,hwBody,hideIn,egoForm,CLONE,idlePath,idleFrame,cloneIn,smokeAlpha,softenSmoke,installed:()=>({...done}),
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,form:egoForm(),installed:{...done},stats:{...stats},lastHidden,lastError})});
})();
