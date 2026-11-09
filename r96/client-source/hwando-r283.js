// R283 환도 대기자세·색감 — 사용자 2026-11-03 "환도기본 대기자세 좌혹은우 이동모션중 대기자세로 가장 적절한걸로 적용 환도영웅 색감일관성있게개선".
//  ① 대기: R277 은 방향마다 걷기 마지막 칸(E11·W11 은 두 발이 벌어진 큰 걸음)이었다. 좌·우 걷기 12칸의 발밑 띠 폭을 재서
//     두 발이 가장 모인 선 자세를 고른다: 오른쪽 = walk-E 3칸(발 띠 28px, 가장 좁음), 왼쪽 = walk-W 4칸(38px, 두 발 모두 땅에 닿음 — W2 는 뒷발이 들림).
//     대기는 늘 이 좌·우 자세로 서고, 위·아래로 걷다 멈추면 마지막으로 바라본 좌·우(R277 lastH)로 선다.
//  ② 색감: 지금 쓰는 환도 그림(R271 걷기 4·공격 E, R242 공격 S·N·피격 E·N·S)이 묶음마다 채도 0.23~0.35·밝기 범위가 달라
//     피격(우)이 주황빛, 공격 E 가 흐릿, 좌우 걷기가 서로 다른 색이었다 → scripts/r283-hwando-color.py 가 R271 걷기 4방향 평균
//     (밝기 p10/p50/p90 = .264/.582/.867, 채도 .266, 채널 평균 비)에 맞춘 파생본 assets/r283/hwando/<r271|r242>/ 를 만들고, 그릴 때 그 경로를 쓴다.
//     칸 크기·발 기준점·알파·원본 파일은 그대로(색만). 판정·피해·저장 그대로.
//  끄기: localStorage['storyworld.r283.hwando']='{"on":false}'  (R277 대기·원래 색으로)
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_R283__)return;
const REV='R283-hwando-1',KEY='storyworld.r283.hwando',IDLE=Object.freeze({e:3,w:4});
const RECOLOR=Object.freeze({'assets/r271/hwando/':['walk-e','walk-w','walk-n','walk-s','attack-e'],'assets/r242/hwando/':['attack-s','attack-n','hit-e','hit-n','hit-s']});
const OUT={'assets/r271/hwando/':'assets/r283/hwando/r271/','assets/r242/hwando/':'assets/r283/hwando/r242/'};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={idle:0,recolored:0};
// 그림 경로: 색 맞춘 파생본이 있으면 그 경로
// R439(사용자 2026-11-09 "환도 공격모션 중에 검끝에 점 묻어 보이는 거 개선"): 공격 E(좌는 미러)는 칼끝 색 번짐·떨어진 칼끝 조각을 지운 파생본
//  assets/r439/hwando/attack-e.webp(scripts/r439-hwando-blade-tip.py, 칼날 픽셀만 바뀜·칸 수/크기/발 기준점 그대로)을 쓴다. 끄기: localStorage['storyworld.r439.hwandoTip']='{"on":false}'
let tip=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r439.hwandoTip')||'null');if(s&&s.on===false)tip=false;}catch(_){}
const TIP=Object.freeze({'assets/r283/hwando/r271/attack-e.webp':'assets/r439/hwando/attack-e.webp'});
function path(base,file){const name=String(file||'').replace(/\.webp$/,'');if(on&&RECOLOR[base]?.includes(name)){stats.recolored++;const p=OUT[base]+file;if(tip&&TIP[p]){stats.tip=(stats.tip||0)+1;return TIP[p];}return p;}return base+file;}
// 대기: 마지막으로 바라본 좌·우의 선 자세 칸
function idle(P){if(!on)return null;stats.idle++;let h='e';try{h=P?.inspect?.()?.lastH||'e';}catch(_){}if(h!=='w')h='e';return {dir:h,frame:IDLE[h]};}
window.__STORYWORLD_HWANDO_R283__=Object.freeze({revision:REV,IDLE,RECOLOR,TIP,tip:()=>tip,on:()=>on,path,idle,inspect:()=>({revision:REV,on,stats:{...stats}}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
