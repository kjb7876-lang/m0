// R750 타격감·적중 자리 — 사용자 2026-11-11 "전반적인 스킬 및 공격등 타격감 및 타격이펙트 위치 개선 · 특히 무기 동작등이랑 잘어울리게".
//  헤드리스 실측(dist02, 8영웅 기본공격):
//   · 엔진은 누르는 순간(attackAnim=.24 첫 순간) 피해·적중 그림·소리를 낸다. 환도(R271)·슬레이어(R351)는 시트를 '타격 칸'부터 돌려 이미 맞지만,
//     나머지 6영웅(R143 6칸 시트: 예비 2 · 타격 2 · 회수 2, R437 네온·라우렌 새 시트도 같은 6칸)은 예비 칸부터 그려 적중 그림이 무기보다 약 0.08초 앞섰다.
//   · 영웅 고유 큰 적중 그림(e568HeroImpact, 112~156px)은 '영웅 키×0.36' 높이에 그려져 키 작은 적(높이 51px)은 머리 위 31px 에 떴다.
//   · 엔진 화면 흔들림(shake)은 R63 카메라가 그리기 동안 0 으로 두어 지금 아무 효과가 없다(R47: 시뮬레이션 정지·충돌 밀기 안 함 원칙).
//  고침(판정·피해·쿨다운·시간·위치값은 그대로, 그림만):
//   ① 무기 타격 칸 = 적중 순간: 위 6영웅 기본공격은 그리는 동안만 attackAnim 을 바꿔 보여 준다 — 휘두름 첫 칸은 그대로(R143 이 시작값을 잡게),
//      둘째 칸부터 타격 칸(2·3)을 휘두름의 앞 절반(0.12초) 동안 보여 주고(맞는 순간 무기가 멈칫 머무는 느낌) 뒤 절반에 회수 칸(4·5).
//      스킬·궁극기·대시·막기·맞음 중(R440 이 공격 자세를 맡음)·협동·환도·슬레이어는 그대로. 그린 뒤 실제 값으로 되돌린다(finally).
//   ② 적중 자리: e568HeroImpact 를 R259 가 잰 그 적 몸 그림의 가운데 높이, 가로는 몸 너비 15% 만큼 때린 쪽으로 옮겨 그린다(잰 값이 없으면 그대로).
//      옮길 양은 그 그림이 실제로 그려진 자리를 재어 정한다(아래 ② 설명).
//      엔진 burst·slash·숫자는 R259 가 이미 옮긴다.
//   ③ 적중 방향 화면 반동: 영웅이 적에게 피해를 준 순간 게임 화면(2D·3D 캔버스·전투 HUD)을 영웅→적 쪽으로 25ms 밀었다가 90ms 에 제자리.
//      보통 1.4px, 처치 +1.0, 보스·중간보스 +.5, 슬레이어·스킬 중 +.8, 상한 3.5px. 여러 번 맞아도 쌓이지 않고 큰 값 하나만(군중·연타에서 덜덜 떨지 않게).
//      CSS translate 속성만 쓴다(그리기 기록기·Three.js·카메라 값·입자 수와 무관). 동작 줄이기 설정·협동·창/로딩 중에는 하지 않는다.
//  끄기: localStorage['storyworld.r750.hitFeel']='{"on":false}' (부분: sync·impact·kick 을 false)
(()=>{'use strict';
if(window.__STORYWORLD_HIT_FEEL_R750__)return;
const REV='R750-hit-feel-1',KEY='storyworld.r750.hitFeel';
let prefs={on:true,sync:true,impact:true,kick:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={synced:0,impacts:0,kicks:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
const P=()=>typeof player==='object'&&player?player:null;
const nowMs=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const reduced=()=>{try{return !!(typeof settings==='object'&&settings?.reducedMotion);}catch(_){return false;}};
// ① 무기 타격 칸 맞춤 -----------------------------------------------------------------------------------
const SYNC=new Set(['lauren','seoha','neon','michaela','hunter','gunner']),CONTACT=2/6;
const sw={start:0,prev:0,first:false};
function shown(p,a){if(a>sw.prev+1e-9||sw.start<=0){sw.start=a;sw.first=true;}else sw.first=false;sw.prev=a;
 if(sw.first)return a;const q=Math.max(0,Math.min(1,1-a/sw.start)),q2=Math.min(.9999,CONTACT+q*(1-CONTACT));return sw.start*(1-q2);}
function busy(p){return p.skillAnim>0||p.ultimateAnim>0||p.dashAnim>0||p.hurtAnim>0||!!p.guard;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...args){const p=P();
 if(!p||!prefs.on||!prefs.sync||!SYNC.has(p.hero)||!solo())return base.apply(this,args);
 const a=+p.attackAnim||0;if(!(a>0)){sw.prev=0;return base.apply(this,args);}
 if(busy(p)){sw.prev=a;return base.apply(this,args);}
 let v=a;try{v=shown(p,a);}catch(e){fail(e);}if(v===a)return base.apply(this,args);
 p.attackAnim=v;stats.synced++;try{return base.apply(this,args);}finally{p.attackAnim=a;}};}
// ② 적중 자리 -------------------------------------------------------------------------------------------
//  e568 그림은 여러 덧씌우기(R259 등)를 거쳐 그려져 '어디에 그려지는지'를 공식으로 짐작하면 틀린다(헤드리스: 이미 옮겨진 것을 또 옮겨 위로 감).
//  → 그 그림이 실제로 그려진 가운데를 재어(가장 큰 그림 한 장) 종류(그림 경로)마다 '발 기준 → 그려진 가운데' 차이를 배워 두고, 다음부터 그 차이를 빼서 몸 가운데로 옮긴다.
//    배우는 값은 확대 배율로 나눠 두어 줌이 바뀌어도 맞는다. 처음 한 번(종류마다 1회)은 원래 자리에 그려진다.
const TARGET=new WeakMap(),LEARN=new Map();
function enemyOf(f){let e=TARGET.get(f);if(e!==undefined)return e;e=null;try{const id=String(f.targetIdE568||'');if(id)for(const v of (typeof room==='object'&&room?.enemies)||[])if(v&&String(v.id)===id){e=v;break;}}catch(_){}TARGET.set(f,e);return e;}
function measureDraw(c,run){if(typeof c.getTransform!=='function'||typeof c.drawImage!=='function')return {r:run(),at:null};
 const own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage;let best=null,area=0;
 c.drawImage=function(im,...q){try{const n=q.length;if(n===4||n===8){const dx=n===8?q[4]:q[0],dy=n===8?q[5]:q[1],dw=n===8?q[6]:q[2],dh=n===8?q[7]:q[3],T=c.getTransform(),A=Math.abs(dw*dh*T.a*T.d);
   if(A>area){area=A;const x=dx+dw/2,y=dy+dh/2;best={x:T.a*x+T.c*y+T.e,y:T.b*x+T.d*y+T.f};}}}catch(_){}return prev.call(this,im,...q);};
 try{return {r:run(),at:best};}finally{if(own)c.drawImage=prev;else delete c.drawImage;}}
function toLocal(M,p){const det=M.a*M.d-M.b*M.c;if(!det)return null;const x=p.x-M.e,y=p.y-M.f;return {x:(M.d*x-M.c*y)/det,y:(M.a*y-M.b*x)/det};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...args){
 try{if(prefs.on&&prefs.impact&&f&&f.type==='e568HeroImpact'&&typeof project==='function'&&typeof ctx==='object'&&ctx&&typeof ctx.translate==='function'){
  const e=enemyOf(f),v=e&&window.__STORYWORLD_HIT_CENTER_R259__?.centreOf?.(e);
  if(v&&fin(v.cx)&&fin(v.cy)){const c=ctx,q=project(f.x,f.y),z=typeof zoom==='number'&&zoom>0?zoom:1,key=String(f.asset||'')+'|'+String(f.sourceActionE568||''),L=LEARN.get(key),p=P();
   const hx=p?project(p.x,p.y).x:v.cx,side=Math.sign(hx-v.cx),wantX=v.cx+side*(fin(v.w)?v.w:0)*.15,wantY=v.cy;
   let dx=0,dy=0;if(L){dx=wantX-(q.x+L.x*z);dy=wantY-(q.y+L.y*z);if(!fin(dx)||!fin(dy)){dx=0;dy=0;}}
   const M=typeof c.getTransform==='function'?c.getTransform():null;// 이 그림의 좌표계(project 좌표) ← 재는 값(장치 좌표)
   c.save();try{if(dx||dy){c.translate(dx,dy);stats.impacts++;}const m=measureDraw(c,()=>base.apply(this,[f,...args]));
    const loc=m.at&&M?toLocal(M,m.at):null;if(loc&&fin(loc.x)&&fin(loc.y)){const nx=(loc.x-dx-q.x)/z,ny=(loc.y-dy-q.y)/z;if(LEARN.size>64&&!L)LEARN.clear();LEARN.set(key,{x:nx,y:ny});}
    return m.r;}finally{c.restore();}}}}catch(err){fail(err);}
 return base.apply(this,[f,...args]);};}
// ③ 적중 방향 화면 반동 ----------------------------------------------------------------------------------
const RISE=25,FALL=90,CAP=3.5,LAYERS=['game','phase1-webgl','combat-hud-r51'];
const kick={t0:-1e9,amp:0,dx:0,dy:0,applied:false};
function envelope(ms){if(ms<0)return 0;if(ms<RISE)return ms/RISE;const u=(ms-RISE)/FALL;return u>=1?0:.5+.5*Math.cos(Math.PI*u);}
function current(t){return kick.amp*envelope(t-kick.t0);}
function addKick(e,killed){if(!prefs.on||!prefs.kick||reduced()||!solo())return;const p=P();if(!p||typeof project!=='function')return;
 const a=project(p.x,p.y),b=project(e.x,e.y);let dx=b.x-a.x,dy=b.y-a.y;const n=Math.hypot(dx,dy);if(!(n>1e-6))return;dx/=n;dy/=n;
 let amp=1.4+(killed?1:0)+(e.boss||e.midboss||e.miniBoss?.5:0)+(p.hero==='slayer'||p.skillAnim>0||p.ultimateAnim>0?.8:0);amp=Math.min(CAP,amp);
 const t=nowMs();if(current(t)>=amp)return;kick.t0=t;kick.amp=amp;kick.dx=dx;kick.dy=dy;stats.kicks++;}
function layers(){const out=[];if(typeof document==='undefined'||!document.getElementById)return out;for(const id of LAYERS){const el=document.getElementById(id);if(el&&el.style)out.push(el);}return out;}
function applyKick(){let s='';try{const idle=!(typeof started==='undefined'||started)||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading);
  const k=idle||!prefs.kick||reduced()?0:current(nowMs());if(k>.05)s=(kick.dx*k).toFixed(2)+'px '+(kick.dy*k).toFixed(2)+'px';else{if(idle)kick.amp=0;if(!kick.applied)return;}}catch(e){fail(e);}
 for(const el of layers())el.style.translate=s;kick.applied=!!s;}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...rest){const before=e?.hp;const r=base.call(this,e,value,source,...rest);
 try{if(r&&e&&fin(before)&&fin(e.hp)&&e.hp<before&&!(source&&source.friendly===false))addKick(e,e.hp<=0);}catch(err){fail(err);}return r;};}
if(typeof draw==='function'){const base=draw;draw=function(...args){try{return base.apply(this,args);}finally{applyKick();}};}
function set(v){prefs={...prefs,...(typeof v==='boolean'?{on:v}:v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on||!prefs.kick){kick.amp=0;applyKick();}return {...prefs};}
window.__STORYWORLD_HIT_FEEL_R750__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},swing:{...sw},kick:{...kick},lastError})});
})();
