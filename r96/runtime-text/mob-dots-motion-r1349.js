// R1349 Dots 잡몹 모자란 동작 칸 — 사용자 2026-11-26 "2d몹들 모션및 일관성 … 전수조사해서 품질업 … 향후 고품질3d몹이랑 괴리 별로 안 나게".
//  전수조사(qa/r1349/census.mjs)에서 자주 나오는 2D 잡몹은 크기 튐보다 동작 칸이 모자란 것이 문제였다:
//   R380 시트는 피격 = 걷기 첫 칸, 대기 = 한 장, 신경 케이블 포식체·EGO 구속 연결자는 공격도 한 장(SW-0014 4칸 보조 시트), R208 피로 꿰맨 전령은 대기·피격 칸이 없음.
//  Dots SW-2D-R1349 r1(11-27 수령)을 칸 크기·발 자리 그대로 assets/r1349/dots 에 두고(scripts/r1349-dots-apply.py, 검사 qa/r1349/r1349-dots-check.py),
//  엔진 frameFor 사슬에서 R380·R208 이 고른 프레임의 그림 칸만 바꾼다. 발 기준점(pivot)·보이는 키(visibleHeight)·좌우(flip)는 그 프레임 값을 그대로 쓴다
//  (Dots 칸은 원본과 같은 칸·발 줄, 오른쪽을 봄 = 원본 시트 facing 과 같음). 판정·피해·시간·이동·세이브는 그대로.
//   · 대기: 서 있을 때 대기 칸을 6fps 로 돈다(몹마다 시작 칸을 흩음).
//   · 피격: hitTimer 가 켜진 순간부터 12fps 로 한 번 돌고 마지막 칸에 머문다.
//   · 공격(attack 표가 있는 몹): 근접은 공격 진행도 × 칸 수, 원거리 준비는 R1226 공격 단계(0~3)를 칸에 나눠 쓴다.
//  피로 꿰맨 전령(R208)은 Dots 그림이 게임 속 몸과 다른 체형이라 넣지 않았다(재요청). 사슬 자리는 R208 몹도 받을 수 있게 둔다.
//  픽셀 그림 모드 시트(-pixel)·사몽 그림자 등 다른 시트 id 는 건드리지 않는다. 그림이 아직 안 읽혔으면 원래 프레임.
//  끄기: localStorage['storyworld.r1349.dots']='{"on":false}'. 점검: window.__STORYWORLD_MOB_DOTS_R1349__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DOTS_R1349__)return;
const REV='R1349-dots-1',KEY='storyworld.r1349.dots';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={installs:0,idle:0,hit:0,attack:0,waiting:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 키 = R380 r380Sheet(시트 id) 또는 R208 r208Mob. cell = Dots 칸(원본 칸과 같음). 칸 번호는 Dots 시트 안 번호.
const TABLE=Object.freeze({
 'web-bound-guardian-v4':{path:'assets/r1349/dots/webguard-idle4-hit3.webp',cell:[128,256],idle:[0,1,2,3],hit:[4,5,6]},
 'swamp-spirit-v1':{path:'assets/r1349/dots/swampspirit-idle4-hit3.webp',cell:[256,256],idle:[0,1,2,3],hit:[4,5,6]},
 'reborn-shieldmate-v4':{path:'assets/r1349/dots/shieldmate-idle4-hit3.webp',cell:[256,256],idle:[0,1,2,3],hit:[4,5,6]},
 'cult-nerve-cable-devourer-walk-d1':{path:'assets/r1349/dots/nervecable-atk6-hit3.webp',cell:[320,320],attack:[0,1,2,3,4,5],hit:[6,7,8]},
 'cult-ego-binder-walk-d1':{path:'assets/r1349/dots/egobinder-atk6-hit3.webp',cell:[320,320],attack:[0,1,2,3,4,5],hit:[6,7,8]}});
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const fin=Number.isFinite;
const asked=new Map();
function ready(p){try{const im=typeof readyImage==='function'?readyImage(p)?.image:null;if(im&&im.naturalWidth>0)return true;const t=T(),l=asked.get(p);
  if((l===undefined||t<l||t-l>=1.5)&&typeof ensureImages==='function'){asked.set(p,t);Promise.resolve(ensureImages([p])).catch(fail);}}catch(err){fail(err);}stats.waiting++;return false;}
const HIT=new WeakMap();
function hitIndex(e,n){const t=T();let h=HIT.get(e);if(!(e.hitTimer>0)){if(h)h.on=false;return -1;}
 if(!h||!h.on||t<h.at){h={on:true,at:t};HIT.set(e,h);}return Math.min(n-1,Math.max(0,Math.floor((t-h.at)*12)));}
function progress(e){const a=e.attack,sh=a.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(a.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));return Math.min(.999,Math.max(0,a.elapsed/tot));}
function pick(e,X){
 const attacking=!!(e.attack&&fin(e.attack.elapsed));
 let phase=null;try{phase=window.__STORYWORLD_MOB_MOTION_R1226__?.attackPhase?.(e)||null;}catch(_){}
 if(X.attack&&(attacking||phase||e.rangedWindup>0)){const n=X.attack.length;stats.attack++;
  if(attacking)return X.attack[Math.floor(progress(e)*n)];
  const c=fin(phase?.cell)?Math.max(0,Math.min(3,phase.cell)):Math.floor(T()*6)%2;return X.attack[Math.round(c*(n-1)/3)];}
 if(attacking||phase||e.rangedWindup>0)return null;// 공격 그림이 없는 몹의 공격은 원래대로
 if(X.hit){const i=hitIndex(e,X.hit.length);if(i>=0){stats.hit++;return X.hit[i];}}
 if(X.idle&&!e.moving){stats.idle++;return X.idle[Math.floor(T()*6+hash(e.id||e.name)*X.idle.length)%X.idle.length];}
 return null;}
function frame(e,f){
 if(!prefs.on||!f||!e||!(e.hp>0))return f;
 const X=TABLE[f.r380Sheet]||TABLE[f.r208Mob];if(!X||!f.assetFrame)return f;
 const k=pick(e,X);if(k==null)return f;
 if(!ready(X.path))return f;
 const [cw,ch]=X.cell,r=[k*cw,0,cw,ch];
 return {...f,path:X.path,assetFrame:{...f.assetFrame,sourceRect:r},sourceAlphaCore:r.slice(),r1349Dots:true};}
let mine=null;
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;
 if(!S.__r380||!S.__r208)return false;// R380·R208 이 먼저 서야 그 위에 선다
 if(S.__r1349)return true;// 이미 사슬 안(바깥에 다른 덧씌우기가 서도 나를 부른다)
 const inner=S.frameFor;mine=function(e,f){const b=inner.call(this,e,f);try{return frame(e,b);}catch(err){fail(err);return b;}};
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r1349:true,frameFor:mine});stats.installs++;return true;}
let tries=0;(function arm(){try{install();}catch(err){fail(err);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_MOB_DOTS_R1349__=Object.freeze({revision:REV,table:TABLE,frame,
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},installed:!!mine,stats:{...stats},lastError})});
})();
