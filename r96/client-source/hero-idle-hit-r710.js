// R710 — 영웅 남쪽(정면) 대기 6칸·피격 4칸(사용자 2026-11-11 "대기·피격 초안 확인 후 개선 적용").
//  · 드라이브 결과 폴더의 HOLD 초안을 scripts/r710-idle-hit.py 가 발(x 96·맨 아래 줄 227/피격 R143 FOOT.s+1)·크기(지금 대기 몸 키)·
//    투명도(알파 1~16·떨어진 점)만 다듬었다. 그림은 초안 그대로. 시트 assets/r710/<영웅>/{idle,hit}-s.webp, 표 assets/r710/index.json.
//  · 적용: 헌터·라우렌·미카엘라·윤서하·기억사수(키 큰 원본 r2)·네온(사용자 06:19Z 선택: 대기 r4 짧은 창, 피격 r2 — 걷기·공격은 아직 긴 창).
//    보류: 환도(옛 황갈색 화풍, 지금 흰 망토와 다름)·슬레이어(얼굴·칼·붉은 빛이 지금 그림과 다름).
//  · 대기: visual-r119 __STORYWORLD_HERO_SHEETS__.idleItem 이 남쪽 시트(idle-s)를 줄 때만 6칸 시트로 바꾼다 — R93 이 0.42초마다 한 칸(2.5초 한 바퀴).
//    다른 방향(남동·동·북동·북, 왼쪽은 반전)은 기존 4칸 그대로. 그림이 아직 안 왔으면 기존 4칸(몸이 사라지지 않게).
//  · 피격: attack-anim-r143 이 남쪽 피격을 그릴 때 hitSheet() 로 4칸 시트·발·몸 키를 받는다(충격 → 젖힘 → 크게 젖힘 → 돌아옴). 안 왔으면 기존 2칸.
//  · storyworld.r710.idleHit {on:false} 로 끄면 예전 그림. 판정·피해·세이브는 바꾸지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_IDLE_HIT_R710__)return;
const REV='R710-idle-hit-1',KEY='storyworld.r710.idleHit';
// scripts/r710-idle-hit.py 결과(assets/r710/index.json) — refBody: 대기 몸 키(R93 배율), hitBody·hitFoot: 피격(R143 배율·발 줄)
const T={hunter:{refBody:183,hitBody:182,hitFoot:226},lauren:{refBody:205,hitBody:206,hitFoot:225},michaela:{refBody:183,hitBody:182,hitFoot:226},
 seoha:{refBody:182,hitBody:182,hitFoot:226},gunner:{refBody:182.5,hitBody:183,hitFoot:227},neon:{refBody:181.0,hitBody:182.0,hitFoot:225}};
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={idle:0,idleWaiting:0,hitAsked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const asked=new Map(),KEEP=new Map();
// 지역을 옮기면 게임 그림 기억이 비므로 한 번 받은 그림은 여기서 쥐고 있는다(R440 환도와 같은 대응).
function ready(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image){KEEP.set(p,row.image);return row.image;}const k=KEEP.get(p);if(k)return k;
 const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p,'R710 idle');}}catch(e){fail(e);}return null;}
const idlePath=h=>'assets/r710/'+h+'/idle-s.webp',hitPath=h=>'assets/r710/'+h+'/hit-s.webp';
const base=window.__STORYWORLD_HERO_SHEETS__;
if(base&&typeof base.idleItem==='function'){
 window.__STORYWORLD_HERO_SHEETS__=Object.freeze({...base,idleItem(h,dir,mirrored){const it=base.idleItem(h,dir,mirrored);
  try{if(!prefs.on||!it||!T[h]||!/\/idle-s\.webp$/.test(String(it.path||'')))return it;const p=idlePath(h),im=ready(p);if(!im){stats.idleWaiting++;return it;}
   stats.idle++;return{...it,path:p,frames:6,cellW:192,cellH:256,footX:96,footY:226,refBody:T[h].refBody,image:im,r710:true};}catch(e){fail(e);return it;}}});}
function hitSheet(h,d){if(!prefs.on||!T[h]||d!=='s')return null;stats.hitAsked++;return{path:hitPath(h),cell:[192,256],foot:[96,T[h].hitFoot],body:T[h].hitBody};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_IDLE_HIT_R710__=Object.freeze({revision:REV,heroes:Object.keys(T),hitSheet,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},wrapped:!!base,lastError,browser:false,GPU:false})});
})();
