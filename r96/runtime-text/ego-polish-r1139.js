// R1139 EGO 각성 영웅(0번째 히든) 공격·이펙트 전수 조사 손질(사용자 2026-11-18 03:20Z "ego각성영웅 공격모션 및 이펙트 전수조사 디버깅및 개선").
//  헤드리스 전수 촬영(기본 공격 5타·Q 4순환·W·E·R·회피·막기·각성·이동·피격)에서 나온 네 가지를 그림만 고친다 — 판정·피해·시간·쿨다운·키는 그대로.
//   ① 협주 기술(R1094)의 페르소나 탄 9종이 화면에서 8~15px 로 그려져 거의 안 보였다(엔진 아군 탄 = 18px×scale, scale .6~1.2)
//      → 탄의 그림 배율(scale)만 한 번 키운다. 반지름(radius)·피해·속도·수명은 건드리지 않는다.
//   ② 삼협묵희 분신(R945)이 영웅 그리기를 다시 부를 때 오라(바닥 고리·보호막·기운 불꽃)까지 먹 필터로 다시 그려져 분신 발밑에 흰 원반·검은 얼룩이 생기고
//      분신마다 그리기 명령이 수백 개씩 늘었다 → EGO 형상일 때 분신 몫 오라는 그리지 않는다(분신 몸과 광륜 흰 겹은 남김).
//   ③ EGO 고유색은 언주색+먹+흰색인데 환도 고유색(은 214,222,234 · 금 255,198,72)으로 구운 절차 이펙트(R106 glow·flame·orb·slashline·spark·shard·ring)가 그대로 나왔다
//      → EGO 형상일 때 그 그림만 금 → 언주, 은 → 따뜻한 흰색으로 다시 칠한 사본으로 바꾼다(그림마다 한 번 굽고 기억).
//   ④ 협주 기술 이름 글자('악의의 관통'·'욕망의 일식' …)가 같은 자리에 겹쳐 읽을 수 없었다 → 0.6초 안에 잇달아 뜨면 위로 한 줄씩(3줄 상한).
//  끄기: localStorage storyworld.r1139.egoPolish = {"on":false}. 새 저장 필드·키 없음. tick 은 직접 감싸지 않고 __STORYWORLD_POST_HOOKS__.register 로.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_POLISH_R1139__)return;
const REV='R1139-ego-polish-1',KEY='storyworld.r1139.egoPolish';
const fin=Number.isFinite,clamp=(v,a,b)=>fin(v)?Math.min(b,Math.max(a,v)):a;
let on=true;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)on=false;}catch(_){}
const stats={shots:0,cloneAura:0,recolored:0,baked:0,textLift:0,frames:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const now=()=>G(()=>typeof time==='number'&&fin(time)?time:null,null);
// EGO 히든 형상(R1046)일 때만. RC151 변신 중이면 그쪽 그림.
function active(){if(!on)return false;return G(()=>{const S=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;return !!(S?.formActive?.()&&!S?.inspect?.().rc151);},false);}
// ---- ① 탄 그림 배율(순수 계산) ----
const VIS=Object.freeze({lance:2.4,'small-orb':2.4,star:2.3,vortex:2.4,eye:2.4,eclipse:2.6,diamond:2.4,clock:2.3,shield:2.3});
function shotScale(key){const k=typeof key==='string'?VIS[key]:undefined;return fin(k)&&k>0?k:1;}
function growShots(list){if(!Array.isArray(list))return 0;let n=0;for(const s of list){if(!s||typeof s!=='object'||s.egoPolishR1139||typeof s.egoKitR1094!=='string')continue;s.egoPolishR1139=true;
  const k=shotScale(s.egoKitR1094);if(k===1||!fin(s.scale)||!(s.scale>0))continue;s.scale=s.scale*k;n++;}return n;}
function tick(){try{if(!active())return;const L=G(()=>typeof projectiles!=='undefined'?projectiles:null,null);if(L)stats.shots+=growShots(L);}catch(e){fail(e);}}
// ---- ② 분신 몫 오라(순수 계산) ----
const INK=/grayscale\(1\) (?:brightness\(0?\.1\)|contrast\(1\.5\) brightness\(0?\.92\))/,INK_SHADOW=/grayscale\(1\) brightness\(0?\.1\)/;
const AURA=/\/sig-(?:aura|gather)-[a-z]+\.webp|\/r1027\/barrier\.webp|fx-c4-ground-ring\.webp|\/auras-r62\/|^r106fx:(?:glow|flame|orb):/,HALO=/\/r1048\/fx\/ego_halo\.webp/;
const isCloneInk=f=>typeof f==='string'&&INK.test(f);
const isAura=p=>typeof p==='string'&&AURA.test(p);
const srcOf=c=>G(()=>String(c.sourcePath||''),'');
function cleanClones(cmds){if(!Array.isArray(cmds))return 0;let n=0;for(const c of cmds){if(!c||c.kind!=='image'||c.egoCloneAuraR1139)continue;const f=c.style?.filter;if(!isCloneInk(f))continue;
  const s=srcOf(c);if(!(isAura(s)||(HALO.test(s)&&INK_SHADOW.test(f))))continue;if(!(+(c.style.globalAlpha??1)>0))continue;c.style={...c.style,globalAlpha:0};c.egoCloneAuraR1139=true;n++;}return n;}
// ---- ③ 환도 은·금 → EGO 언주·흰(순수 계산) ----
const HW_FX=/^r106fx:[a-z0-9-]+:(?:214\.222\.234:255\.198\.72|255\.198\.72:214\.222\.234)$/;
const isHwandoFx=p=>typeof p==='string'&&HW_FX.test(p);
const VERMILION=Object.freeze([222,58,42]),PAPER=Object.freeze([243,238,226]);
// 화소 하나: 채도가 높을수록(금) 언주, 낮을수록(은·흰) 종이 흰색. 명도 차례는 그대로.
function recolor(r,g,b){r=clamp(+r,0,255);g=clamp(+g,0,255);b=clamp(+b,0,255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(!(mx>0))return[0,0,0];
 const l=mx/255,s=(mx-mn)/mx,k=clamp((s-.15)/.4,0,1),hi=clamp((l-.86)/.14,0,1)*(1-k);
 const out=[0,0,0];for(let i=0;i<3;i++){const red=VERMILION[i]*l,white=PAPER[i]*l+(255-PAPER[i]*l)*hi;out[i]=Math.round(clamp(white+(red-white)*k,0,255));}return out;}
const baked=new WeakMap();
function bake(im){if(!im||typeof document==='undefined')return null;if(baked.has(im))return baked.get(im);let out=null;
 try{const w=im.naturalWidth||im.width|0,h=im.naturalHeight||im.height|0;if(w>0&&h>0&&w*h<=4194304){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
   const d=x.getImageData(0,0,w,h),a=d.data;for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const c=recolor(a[i],a[i+1],a[i+2]);a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2];}x.putImageData(d,0,0);
   cv.naturalWidth=w;cv.naturalHeight=h;const tag=G(()=>im.__storyworldStaticTint,null),p='r1139:ego:'+String(tag?.path||'fx');
   try{Object.defineProperty(cv,'__storyworldStaticTint',{value:Object.freeze({path:p,immutable:true,r106:true,r1139:true})});}catch(_){}out=cv;stats.baked++;}}catch(e){fail(e);out=null;}
 baked.set(im,out);return out;}
function recolorIn(cmds){if(!Array.isArray(cmds))return 0;let n=0;for(const c of cmds){if(!c||c.kind!=='image'||c.egoTintR1139)continue;const s=srcOf(c);if(!isHwandoFx(s))continue;if(isCloneInk(c.style?.filter))continue;
  const cv=bake(c.image);if(!cv)continue;c.image=cv;c.sourcePath='r1139:ego:'+s;if(c.immutableTint)c.immutableTint=cv.__storyworldStaticTint;c.egoTintR1139=true;n++;}return n;}
function process(cmds){if(!active()||!Array.isArray(cmds))return 0;stats.frames++;const a=cleanClones(cmds),b=recolorIn(cmds);stats.cloneAura+=a;stats.recolored+=b;return a+b;}
// ---- ④ 협주 기술 이름 글자(순수 계산) ----
const LIFT=.3,LIFT_MAX=3,LIFT_WINDOW=.6;
function textLift(k){k=Math.floor(+k);if(!(k>0))return 0;return Math.min(LIFT_MAX,k)*LIFT;}
let names=null;const nameSet=()=>{if(!names){const S=G(()=>window.__STORYWORLD_EGO_KIT_R1094__?.SKILL,null);if(S){names=new Set();for(const k in S)if(typeof S[k]?.name==='string')names.add(S[k].name);}}return names;};
let lastAt=-1e9,streak=0;const done={};
function wrapText(){if(done.text||typeof floatText!=='function')return;done.text=true;const base=floatText;
 floatText=function(text,x,y,...rest){try{const N=nameSet(),t=now();if(N&&t!=null&&typeof text==='string'&&N.has(text)&&fin(y)&&active()){if(t>=lastAt&&t-lastAt<=LIFT_WINDOW)streak++;else streak=0;lastAt=t;
    const up=textLift(streak);if(up>0){stats.textLift++;return base.call(this,text,x,y-up,...rest);}}}catch(e){fail(e);}return base.apply(this,arguments);};}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r1139)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1139=true;return w;};
const wrapped=typeof WeakSet==='function'?new WeakSet():null;
function wrapRender(){try{if(!done.proto){const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function'){C.render=wrapFn(C.render);done.proto=true;}}
  const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(wrapped&&r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function install(){try{wrapText();wrapRender();}catch(e){fail(e);}}
try{window.__STORYWORLD_POST_HOOKS__.register('__r1139',{tick},fail);}catch(e){fail(e);}
install();try{setInterval(install,500);}catch(_){}
window.__STORYWORLD_EGO_POLISH_R1139__=Object.freeze({revision:REV,VIS,shotScale,growShots,isCloneInk,isAura,cleanClones,isHwandoFx,recolor,recolorIn,textLift,process,active,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,active:active(),installed:{...done},stats:{...stats},lastError})});
})();
