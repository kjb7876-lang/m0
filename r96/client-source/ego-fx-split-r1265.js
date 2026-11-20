// R1265 히든 영웅 EGO — 공격·스킬에 섞여 나오던 환도 이펙트 떼기(사용자 2026-11-20 05:08Z "히든영웅 에고 기본공격시 왜 흰색 환도영웅 공격이페트도 나가는지 전수조사 개선").
//  까닭: EGO(R1046)는 몸이 환도 계보라 player.hero 가 'hwando' 다. 환도 이펙트 모듈들(R1041 발도 시트·R302 환도 띠·R349 호·엔진 hwando-a·R590 연계·R945 수묵 패시브·
//   R100/R101 환도 고유색 시트 은 pale·금 gold)이 영웅 이름만 보고 그대로 그려, EGO 자기 이펙트(R1139b 가로 붓 궤적·먹 튐, R1048 궤적, 붉은 sig-*-red, 페르소나 탄) 위에
//   흰·은·금 베기가 한 겹 더 나갔다. 헤드리스 전수 측정(2D·3D EGO × A·Q·W·E·R·F, 환도→EGO 전환): 기본 공격 2.5초에 환도 그림 보이는 명령 약 1,500개(R1094 가 옅게만 했음).
//  고침(그림만 — 판정·피해·시간·쿨다운·키·저장은 그대로, 환도 기술 틀·확률 패시브 판정도 그대로):
//   ① 환도 베기·발도 그림(EGO 에게는 자기 베기 그림이 따로 있음)과 환도 금빛 R100 시트 → EGO 형상일 때 안 보이게(알파 0).
//      환도 은빛(pale) R100 시트는 다른 영웅의 보조색과 같은 시트라, EGO R 소환 영웅(R1157, 환도는 소환 안 됨)이 있는 동안은 남긴다.
//   ② 환도 계보 수묵·검풍 그림(R945 묵월·칠묵영·삼협묵희, R590 검풍·발도 고리·일섬·종섬, R945 코드 붓 조각) — EGO 도 쓰는 기술이라 지우지 않고
//      EGO 색(먹 → 언주 → 옅은 언주, 가장 밝은 속만 흰)으로 다시 칠한 사본으로 바꿔 그린다(그림마다 한 번 굽고 기억, 새 그림 파일 없음).
//   ③ 손대지 않음: EGO 자기 그림(r1048·r1139·r1176·sig-*-red·페르소나 탄 r1119), 몸 그림(R1100·R1176 몫), 컷인(R1100 몫), 모든 영웅 공통 그림(final42 F246 등), 적 그림.
//  렌더러가 받는 프레임 명령을 고친다(프로토타입·인스턴스 render 둘 다, 한 render 에 한 번). 환도→EGO(777) 전환 순간 남아 있던 환도 이펙트도 같은 프레임부터 바뀐다.
//  RC151 변신(엔진 '마지막 수호자 EGO') 중이면 쉰다. 끄기: localStorage storyworld.r1265.egoFxSplit = {"on":false}. 새 저장 필드·키 없음.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_FX_SPLIT_R1265__)return;
const REV='R1265-ego-fx-split-2',KEY='storyworld.r1265.egoFxSplit',TAG='r1265:ego:';
const fin=Number.isFinite,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const G=(f,d)=>{try{return f();}catch(_){return d;}};
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={frames:0,hidden:0,tinted:0,baked:0,noImage:0,errors:0};let lastError=null,lastHidden=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
// ---- 분류(순수) ----
const HIDE=/(?:^|\/)assets\/(?:r1041\/fx-[a-z0-9]+-hwando-[a-z0-9-]+\.webp|r302\/fx\/hwando\/|r349\/hwando-[a-z0-9-]+\.webp|vfx\/heroes\/hwando-[a-z0-9-]+\.webp|r590\/hwando-a-draw-cut\.webp|r100\/sig-[a-z]+-gold\.webp)/;
const PALE=/(?:^|\/)assets\/r100\/sig-[a-z]+-pale\.webp/;
const TINT=/^(?:(?:\.?\/)?assets\/r945\/hwando-(?!cutin)[a-z0-9-]+\.webp|(?:\.?\/)?assets\/r590\/hwando-(?!a-draw-cut)[a-z0-9-]+\.webp|r945:[a-z0-9:_-]+)/;
function classify(path){if(typeof path!=='string'||!path||path.startsWith(TAG))return null;const s=path.replace(/[?#].*$/,'');if(HIDE.test(s))return'hide';if(PALE.test(s))return'pale';if(TINT.test(s))return'tint';return null;}
// ---- EGO 색(순수): 명도 차례는 그대로, 먹 → 짙은 언주 → 언주·주홍 → 옅은 언주, 가장 밝은 속(.93↑)만 종이 흰 ----
const STOPS=Object.freeze([[0,[18,22,28]],[.3,[70,14,10]],[.55,[132,30,22]],[.75,[204,52,40]],[.93,[255,176,140]],[1,[248,242,232]]]);
// R1265b(7분야 심사 조명색채 지적: 칠묵영 먹 안개·구름까지 언주로 칠하면 화면이 붉은 연기로 덮여 '빨강=위협' 신호가 흐려짐) → 안개·구름·먹 조각은 따뜻한 먹빛(살짝 언주가 밴 회색)으로만.
const SOFT=Object.freeze([[0,[18,22,28]],[.5,[92,74,70]],[.85,[196,178,170]],[1,[243,236,228]]]);
const SOFT_SRC=/hwando-ink-vapor|^r945:(?:cloud|ink)/;
function ramp(S,r,g,b){r=clamp(fin(+r)?+r:0,0,255);g=clamp(fin(+g)?+g:0,0,255);b=clamp(fin(+b)?+b:0,0,255);const l=Math.max(r,g,b)/255;
 for(let i=1;i<S.length;i++){const[a0,c0]=S[i-1],[a1,c1]=S[i];if(l<=a1){const k=(l-a0)/(a1-a0||1);return[0,1,2].map(j=>Math.round(clamp(c0[j]+(c1[j]-c0[j])*k,0,255)));}}return S[S.length-1][1].slice();}
const tint=(r,g,b)=>ramp(STOPS,r,g,b),softTint=(r,g,b)=>ramp(SOFT,r,g,b);
// ---- 사본 굽기(그림마다 한 번) ----
const baked=new WeakMap();
function bakeDefault(im,soft){const f=soft?softTint:tint;if(!im||typeof document==='undefined')return null;const w=im.naturalWidth||im.width|0,h=im.naturalHeight||im.height|0;if(!(w>0&&h>0&&w*h<=4194304))return null;
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});if(!x)return null;x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h),a=d.data;
 for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const c=f(a[i],a[i+1],a[i+2]);a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2];}x.putImageData(d,0,0);cv.naturalWidth=w;cv.naturalHeight=h;return cv;}
let bakeFn=bakeDefault;
function bake(im,path){if(!im||typeof im!=='object')return null;if(baked.has(im))return baked.get(im);let out=null;try{out=bakeFn(im,SOFT_SRC.test(path));if(out){stats.baked++;try{Object.defineProperty(out,'__storyworldStaticTint',{value:Object.freeze({path:TAG+path,immutable:true,r1265:true})});}catch(_){}}}catch(e){fail(e);out=null;}
 if(out||(im.complete!==false&&(im.naturalWidth||im.width)>0))baked.set(im,out);return out;}
// ---- 상태 ----
function active(){if(!on)return false;return G(()=>{const S=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;return !!(S?.formActive?.()&&!S?.inspect?.()?.rc151);},false);}
const summonLive=()=>G(()=>(window.__STORYWORLD_EGO_SUMMON_R1157__?.bodies?.()||[]).length>0,false);
// ---- 명령 처리 ----
const srcOf=c=>{const s=G(()=>String(c.sourcePath||c.image?.src||''),'');return s.startsWith(TAG)?s:s.replace(/^.*?(assets\/)/,'assets/');};
function process(cmds){const r={hidden:0,tinted:0};if(!Array.isArray(cmds)||!active())return r;stats.frames++;const keepPale=summonLive();
 for(const c of cmds){try{if(!c||c.kind!=='image'||c.r1265)continue;const s=srcOf(c),k=classify(s);if(!k)continue;const st=c.style||{};if(!(+(st.globalAlpha??1)>0))continue;
  if(k==='hide'||(k==='pale'&&!keepPale)){c.style={...st,globalAlpha:0};c.r1265='hide';r.hidden++;lastHidden=s;continue;}
  if(k==='tint'){const cv=bake(c.image,s);if(!cv){stats.noImage++;continue;}c.image=cv;c.r1265From=String(c.sourcePath||s);c.sourcePath=TAG+s;if(c.immutableTint)c.immutableTint=cv.__storyworldStaticTint||null;if(c.imageSize)c.imageSize=[cv.naturalWidth||cv.width,cv.naturalHeight||cv.height];c.r1265='tint';r.tinted++;}}catch(e){fail(e);}}
 stats.hidden+=r.hidden;stats.tinted+=r.tinted;return r;}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사하므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번) ----
let depth=0;const done={};
const wrapFn=fn=>{if(fn.__r1265)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1265=true;return w;};
const wrapped=typeof WeakSet==='function'?new WeakSet():null;
function install(){try{if(!done.proto){const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function'){C.render=wrapFn(C.render);done.proto=true;}}
  const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(wrapped&&r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);done.inst=true;}}catch(e){fail(e);}}
install();try{setInterval(install,500);}catch(_){}
window.__STORYWORLD_EGO_FX_SPLIT_R1265__=Object.freeze({revision:REV,storageKey:KEY,classify,tint,softTint,process,active,
 __setBake:f=>{bakeFn=typeof f==='function'?f:bakeDefault;return true;},
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,active:active(),installed:{...done},stats:{...stats},lastHidden,lastError})});
})();
