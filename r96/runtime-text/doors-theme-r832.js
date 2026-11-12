// R832 지역 양식별 문짝 — 사용자 2026-11-12 00:17Z "이런 문들도 닷츠에게 지시해서 주변에 맞게, 꼭 문 아니더라도, 여러 일관성 7전문가 모드로 알맞게 제작 및 적용".
//  전에는 62개 지역 진행 문(R81 door-0·1·2, R83 이 그림)이 모두 같은 참나무 문짝(또는 청동 문짝)을 2~4장 이어 붙여 그렸다(헤드리스 전수 qa/r832/door-census.mjs).
//  Dots CX-0075DR: 지역 양식 묶음(A 조선 판문 … L 실 장막)마다 정면 입면도 쌍문 그림 2장(r1a·r1b, 1024x704, 가운데 512 가 이음매).
//  이 오버레이는 지역 → 묶음 표와 그림 읽기만 맡는다. 붙이기는 world-doors-r83.js 의 R832 훅(themeLeaf)이 한다:
//   닫힌 칸은 칸마다 a·b 번갈아, 열린 문은 경첩 쪽 반쪽. 칸 수는 그림 가로:세로로 정한다(쌍문 1장 ≈ 3.1칸).
//  그림만 바꾼다 — 충돌·문 폭·열림·상인방(R413/R452)·길찾기 그대로. 그림이 아직 안 읽혔거나 표에 없는 지역은 원래 참나무·청동 문짝.
//  맘몬(ep1b06·ep1b06b, 사용자 승인 예외)·무대(ep1b05, R443 커튼)·병원 진료문(ep1a08)은 다루지 않는다.
//  끄기: localStorage storyworld.r832.doors {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_DOOR_THEME_R832__)return;
const REV='R832-doors-1',KEY='storyworld.r832.doors',DIR='assets/r832/doors/',Z_PER_U=Math.sqrt(1.5)/Math.sqrt(1.25);
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
// 지역 → 묶음(요청서 CX-0075DR 와 같은 글자). 지역 id 로만 정한다(지역 이름·서사를 만들지 않음).
const ZONE={
 last302:'A',last303:'A',
 ep1a09:'B',ep1a11:'B',dreamRest:'B',restEp1b:'B',
 ep1b01:'C',ep1b08:'C',dist05:'C',cult06:'C',
 ep1b02:'D',ep1b03:'D',ep1b04:'D',murder04:'D',u205:'D',ep1b07:'D2',murder02:'D2',
 hando01:'E',hando02:'E',hando03:'E',cult04:'E',dist00:'E',ep1a09b:'E',kair01:'E',
 cult03:'F',kair07:'F',u206:'F',kair02:'F',u201:'F',u203:'F',u204:'F',/* 3부 기계·디스토피아(props-era-audit-r830) */
 u202:'G',
 dist01:'H',cult05:'H',cult01:'H',cult02:'H',ep1b09:'H',kair08:'H',dist02:'H',
 dist03:'I',last301:'I',dist04:'I',kair04:'I',kair09:'I',kair10:'I',dist06:'I',
 ep1a10:'J',murder01:'J',murder03:'J',
 last305:'K',kair05:'K',last304:'K',kair06:'K',
 kair03:'L'};
// 검수(7분야 평균 7.77 초과)를 통과해 assets/r832/doors 에 들어온 묶음만. 파일: <묶음>-a.webp, <묶음>-b.webp
const READY=new Set(['A']);// A: 11-12 Dots 조선 판문 r1a·r1b(미리보기에서 1024x704 로 잘라 불투명·밝기 1.3·대비 1.45·채도 1.35 — 밤 화면에서 쇠 띠·문고리가 읽히게, qa/r832)
const stats={leaves:0,pending:0,fallback:0};
function leaf(r){if(!on||!r||r.layer!=='STORY')return null;const fam=ZONE[r.id];if(!fam||!READY.has(fam)){stats.fallback++;return null;}
 const paths=[DIR+fam+'-a.webp',DIR+fam+'-b.webp'],ims=[];
 for(const p of paths){const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)ims.push(row.image);else{try{addImage(p,'R832 door '+fam);}catch(_){}}}
 if(!ims.length){stats.pending++;return null;}const im=ims[0],w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!(w>0&&h>0))return null;
 stats.leaves++;return{family:fam,images:ims,aspect:(w/h)/Z_PER_U};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_DOOR_THEME_R832__=Object.freeze({revision:REV,ZONE,READY,leaf,set,inspect:()=>({revision:REV,on,ready:[...READY],stats:{...stats}})});
})();
