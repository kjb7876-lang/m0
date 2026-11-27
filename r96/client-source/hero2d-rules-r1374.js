// R1374 2D 영웅 규칙 — 사용자 2026-11-27 07:16~07:17Z
//  "이제부터 영웅은 3d가 기본이고 다 3d기준으로 하는거야 2d는 안쓴다고 봐야해", "2d랑 3d영웅을 별도 개별로 취급하고",
//  "2d영웅은 좌우공격모션만 하도록 어떤상황에서던지 이동은 블링크로만".
//  2D 영웅 = 엔진 drawHero 로 2D 그림이 나가는 영웅 몸 전부:
//   · r720Ally 몸(서하 평행세계 소집 R949, EGO R 소환 R1157, 헌터 사냥 분대 R952, 무한생존 배치 타워 R720)
//   · 협동 동료 몸(내 몸이 아닌 플레이어) · 3D 를 끄거나 3D 모델이 없는 조종 영웅.
//   3D 로 그려지는 조종 영웅(R1302 켬 + 모델 있음)은 손대지 않는다(3D 와 2D 는 따로).
//  규칙(그리는 동안만, 판정·이동 계산·세이브는 그대로):
//   ① 방향은 좌·우만: 앞·뒤면 공격 중엔 표적의 화면 쪽, 아니면 마지막 좌·우.
//   ② 걷는 자세·걸음 흔들림 없음(moving=false, 이동 벡터 0) → 서기·공격·스킬 그림만.
//   ③ 그림 자리는 블링크로만 바뀐다: 걷는 동안엔 떠난 자리에 서 있고, 멈추면(0.12초)·공격을 시작하면·2칸 넘게 벌어지면
//      엔진 블링크와 같은 연출(떠난 자리 돌진 잔상 + 도착 자리 블링크 문양)로 한 번에 옮긴다. 0.05칸 이하 밀림·8칸 넘는 순간이동(방 바뀜)은 연출 없이 맞춘다.
//  분신(R767·R945)처럼 drawHero 안에서 자리만 옮겨 다시 부르는 겹친 그리기는 바깥 자리를 그대로 따른다.
//  끄기: localStorage['storyworld.r1374.hero2d']='{"on":false}' (조종 영웅만 빼기: {"player":false})
//  점검: window.__STORYWORLD_HERO2D_RULES_R1374__.inspect()
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO2D_RULES_R1374__)return;
const REV='R1374-hero2d-rules-1',KEY='storyworld.r1374.hero2d';
const CFG=Object.freeze({maxDrift:2,stopHold:.12,quiet:.05,far:8,sideEps:.05});
let prefs={on:true,player:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(typeof s.on==='boolean')prefs.on=s.on;if(typeof s.player==='boolean')prefs.player=s.player;}}catch(_){}
const stats={draws:0,passed:0,nested:0,sided:0,stilled:0,blinks:0,quiet:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
const fin=Number.isFinite;
const T=()=>{try{return typeof time==='number'&&fin(time)?time:0;}catch(_){return 0;}};
const snapLog=[];
const state=new WeakMap();let depth=0,probe=null;/* 검사용 관찰자(그리기 직전·직후 몸 상태를 본다, 아무것도 바꾸지 않음) */

function coopLocal(){try{const C=window.__STORYWORLD_COOP_SIM_R62__,m=C&&typeof C.mode==='function'?C.mode():null;if(!m||m==='off')return null;return typeof C.localPlayer==='function'?C.localPlayer()||null:null;}catch(_){return null;}}
function shown3D(p){try{const H=window.__STORYWORLD_HWANDO3D_R1302__;if(!H||typeof H.on!=='function'||!H.on())return false;const ids=typeof H.heroes==='function'?H.heroes():[];return Array.isArray(ids)&&ids.includes(p.hero);}catch(_){return false;}}
// 이 몸이 2D 로 그려지는가
function is2D(p){if(!p||typeof p!=='object'||!fin(p.x)||!fin(p.y))return false;
 if(p.r720Ally)return true;
 const local=coopLocal();if(local&&p!==local)return true;/* 협동 동료 */
 if(!prefs.player)return false;return !shown3D(p);}
function aimTarget(p){let t=null;try{t=typeof target!=='undefined'?target:null;}catch(_){t=null;}if(!(t&&fin(t.x)&&fin(t.y)))t=p.targetR720;return t&&fin(t.x)&&fin(t.y)?t:null;}
// ① 좌·우 고르기(화면 가로 = x-y, 엔진 facing 과 같은 축)
function pickSide(p,s,ax,ay){const d=p.direction;if(d==='left'||d==='right')return d;
 const acting=p.attackAnim>0||p.skillAnim>0||p.ultimateAnim>0;
 if(acting){const t=aimTarget(p);if(t){const sx=(t.x-ax)-(t.y-ay);if(Math.abs(sx)>CFG.sideEps)return sx>0?'right':'left';}}
 return s.side==='left'?'left':'right';}
function blinkFx(p,from,to,side){try{if(typeof fx!=='function')return;
 const art=typeof heroArt!=='undefined'&&heroArt?heroArt[p.hero]:null,dash=art&&art.dash?(art.dash[side]||art.dash.right):null;
 if(dash)fx('ghost',from.x,from.y,{asset:dash,life:.45,size:1,r1374:true});
 const blink=typeof VFX!=='undefined'&&VFX?VFX.blink:null;if(blink)fx('sigil',to.x,to.y,{asset:blink,size:1.3,life:.4,r1374:true});}catch(e){fail(e);}}
// 화면 소음 줄이기(QA 7분야 심사 11-27): 연출은 몸 하나당 0.6초에 한 번, 같은 순간(같은 게임 시간)에는 모든 몸 합쳐 2개까지. 자리 옮김 자체는 그대로.
const FX_GAP=.6,FX_PER_FRAME=2;let fxFrameT=NaN,fxFrameN=0;
function fxAllowed(s,now){if(fin(s.fxAt)&&now-s.fxAt<FX_GAP-1e-9&&now>=s.fxAt)return false;if(now!==fxFrameT){fxFrameT=now;fxFrameN=0;}if(fxFrameN>=FX_PER_FRAME)return false;fxFrameN++;s.fxAt=now;return true;}
function snap(p,s,now,kind,side){const from={x:s.ax,y:s.ay};s.ax=p.x;s.ay=p.y;s.primed=false;
 if(kind==='blink'){stats.blinks++;if(fxAllowed(s,now))blinkFx(p,from,{x:p.x,y:p.y},side);else stats.fxQuiet=(stats.fxQuiet||0)+1;}else stats.quiet++;
 snapLog.push({t:now,x:p.x,y:p.y,kind,hero:p.hero});if(snapLog.length>400)snapLog.shift();}
// ③ 그림 자리 정하기
function plan(p,now){let s=state.get(p);
 if(!s||now<s.t-1e-9){s={ax:p.x,ay:p.y,lx:p.x,ly:p.y,movedAt:now,t:now,acting:false,side:p.direction==='left'?'left':'right'};state.set(p,s);}
 if(Math.hypot(p.x-s.lx,p.y-s.ly)>1e-3){s.movedAt=now;s.lx=p.x;s.ly=p.y;}
 const acting=p.attackAnim>0||p.skillAnim>0||p.ultimateAnim>0,start=acting&&!s.acting;s.acting=acting;s.t=now;
 const side=pickSide(p,s,p.x,p.y),drift=Math.hypot(p.x-s.ax,p.y-s.ay);
 if(drift>1e-9){
  if(drift>CFG.far)snap(p,s,now,'quiet',side);
  else if(drift>=CFG.maxDrift||start||now-s.movedAt>=CFG.stopHold-1e-9)snap(p,s,now,drift<=CFG.quiet?'quiet':'blink',side);}
 s.side=side;return s;}
// 블링크로 자리가 바뀐 그 그림에서, 위치 변화로 걷기를 짐작하는 그리기(R119 걷기 주기 등: 1.2칸 안 변화 = 걸음)가
//  블링크를 걸음으로 읽지 않게, 아주 먼 자리에서 한 번 보이지 않게 그려 두고(기록 명령은 바로 지움) 새 자리에서 그린다 → 그들에겐 순간이동(무시)으로 보인다.
//  그림 기록기(ctx.commands)가 없는 캔버스에서는 하지 않는다(보이는 그림이 남으므로).
const FAR=1e4;
function prime(p,s,base,self,a){let rec=null;try{rec=typeof ctx==='object'&&ctx?ctx:null;}catch(_){rec=null;}if(!rec||!Array.isArray(rec.commands))return false;
 const st=rec.commands.length,fx0=(()=>{try{return typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:-1;}catch(_){return -1;}})();
 p.x=s.ax+FAR;p.y=s.ay+FAR;try{base.apply(self,a);stats.primed=(stats.primed||0)+1;}catch(e){fail(e);}finally{if(rec.commands.length>st)rec.commands.length=st;p.x=s.ax;p.y=s.ay;
  try{if(fx0>=0&&effects.length>fx0)effects.length=fx0;}catch(_){}}return true;}
// ① 공격 그림 좌·우: 공격 시트 방향을 '겨눈 적'(R1295 유지 표적 foe)으로 고르는 그리기(R143 기본 공격 8방향 시트)가
//  2D 몸을 그리는 동안에는 몸의 정확히 왼쪽·오른쪽(화면 가로)에 선 가상의 표적을 보게 한다 → e·w 시트만 나온다. 그 한 번이 끝나면 원래 객체로 되돌린다.
const HOLD='__STORYWORLD_TARGET_HOLD_R1295__';
function withSideFoe(p,side,fn){let had=false,orig;try{had=Object.prototype.hasOwnProperty.call(window,HOLD);orig=window[HOLD];
  const k=side==='left'?-1.5:1.5,foe=Object.freeze({x:p.x+k,y:p.y-k,hp:1,maxHp:1,visible:true,r1374Side:true});
  window[HOLD]=Object.freeze({...(orig&&typeof orig==='object'?orig:{}),foe:()=>foe,r1374Side:side});stats.sideFoe=(stats.sideFoe||0)+1;}catch(e){fail(e);return fn();}
 try{return fn();}finally{try{if(had)window[HOLD]=orig;else delete window[HOLD];}catch(_){}}}
// R991 기억사수는 쏘는 순간(틱)에 공격 칸을 골라 둔다 → 2D 몸이 player 자리에 있는 동안(소환 몸이 쏠 때·2D 조종 영웅)도 좌·우 칸만.
const sideOnly=()=>{if(!prefs.on)return false;if(depth>0)return true;try{return is2D(typeof player!=='undefined'?player:null);}catch(_){return false;}};
// 같은 영웅의 2D 몸이 둘 이상이면(서하 소집 + EGO R 등) 영웅 하나에 상태 하나인 그리기(환도 R271·R242 걷기 추적)가 몸 사이 거리를
//  걸음으로 읽는다 → 그 영웅을 직전에 그린 몸이 다르면 먼 자리 숨은 그리기로 순간이동처럼 보이게 한 뒤 그린다.
const lastBody=new Map();
function wrap(){if(typeof drawHero!=='function'||drawHero.__r1374)return false;const base=drawHero;
 const w=function(...a){let p=null;try{p=typeof player!=='undefined'?player:null;}catch(_){p=null;}
  if(!prefs.on||!p)return base.apply(this,a);
  if(depth>0){stats.nested++;return base.apply(this,a);}
  let two=false;try{two=is2D(p);}catch(e){fail(e);}
  if(!two){stats.passed++;try{lastBody.set(p.hero,p);}catch(_){}return base.apply(this,a);}
  const keep={x:p.x,y:p.y,direction:p.direction,moving:p.moving,vx:p.moveVX150,vy:p.moveVY150};let s=null;
  try{s=plan(p,T());}catch(e){fail(e);}
  if(!s)return base.apply(this,a);
  depth++;stats.draws++;
  try{p.x=s.ax;p.y=s.ay;if(p.direction!==s.side){stats.sided++;p.direction=s.side;}if(p.moving)stats.stilled++;p.moving=false;
   if('moveVX150' in p)p.moveVX150=0;if('moveVY150' in p)p.moveVY150=0;
   {const lb=lastBody.get(p.hero);lastBody.set(p.hero,p);if(lb&&lb!==p&&s.primed!==false){s.primed=false;stats.swapPrimed=(stats.swapPrimed||0)+1;}}
   if(s.primed===false){s.primed=true;withSideFoe(p,s.side,()=>prime(p,s,base,this,a));}
   if(probe&&probe.pre)try{probe.pre(p);}catch(_){}
   const r=withSideFoe(p,s.side,()=>base.apply(this,a));if(probe&&probe.post)try{probe.post(p);}catch(_){}return r;}
  finally{depth--;p.x=keep.x;p.y=keep.y;p.direction=keep.direction;p.moving=keep.moving;if(keep.vx!==undefined)p.moveVX150=keep.vx;if(keep.vy!==undefined)p.moveVY150=keep.vy;}};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}
 if(base.__r1304)w.__r1304=true;/* R1302 가 다시 감싸며 핑퐁하지 않게 감싼 표시를 이어받는다 */
 w.__r1374=true;try{drawHero=w;}catch(_){return false;}try{if(window.drawHero!==w)window.drawHero=w;}catch(_){}return true;}
// 다른 덧씌우기보다 바깥(가장 먼저 player 를 읽음)이어야 하므로, 모든 태그가 돈 뒤(load) 감싸고 첫 몇 초 동안 바깥이 바뀌면 다시 감싼다.
let tries=0;const install=()=>{try{wrap();}catch(e){fail(e);}};
try{if(typeof document!=='undefined'&&document.readyState!=='complete'&&typeof window.addEventListener==='function')window.addEventListener('load',install,{once:true});else install();}catch(e){fail(e);}
if(typeof setTimeout==='function'){const again=()=>{if(++tries>8)return;try{if(typeof drawHero==='function'&&!drawHero.__r1374)install();}catch(_){}setTimeout(again,1500);};setTimeout(again,1500);}
window.__STORYWORLD_HERO2D_RULES_R1374__=Object.freeze({revision:REV,CFG,is2D,depth:()=>depth,sideOnly,qaProbe:v=>{probe=v&&typeof v==='object'?v:null;return !!probe;},snaps:()=>snapLog.slice(),
 set(v={}){if(typeof v.on==='boolean')prefs.on=v.on;if(typeof v.player==='boolean')prefs.player=v.player;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},wrapped:!!(typeof drawHero==='function'&&drawHero.__r1374),stats:{...stats},lastError})});
})();
