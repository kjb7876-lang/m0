// R277 환도 모션 정리 — 사용자 2026-11-03 "대기자세 … 기존대기자세 모두없애주고 위아래좌우이동만남겨주고 공격은 좌우아래만 남겨줘 일관성생각해서 … 모션개선"
//  + 정정 "대기는 이동(걷기) 동작의 마지막 칸으로".
//  · 대기: 방향(N/S/E/W)마다 R271 걷기 클립의 마지막 칸을 숨쉬기 없이 그대로 멈춰 보인다. R271 대기 클립·R242 대기/전투 준비·옛 대기 그림은 그리지도 미리 받지도 않는다.
//  · 이동: R271 걷기 4방향만(대각선은 화면 이동 벡터의 큰 축 → 가장 가까운 4방향, 기존 2프레임 히스테리시스 그대로).
//  · 공격: 좌(E 미러)·우(E)·아래(R242 공격 S — 같은 흰 두건 정면 그림, 몸 키 180 으로 같은 발 기준점) 셋만.
//    위 공격은 따로 그리지 않고 겨눈 방향의 가로 성분(가까운 적의 화면 x 차이, 거의 0 이면 마지막 가로 방향)에 맞는 좌·우 공격으로 대신한다
//    — 실제 칼 휘두르기 원화라 판정 순간(접촉 칸)이 맞고, 걷기 칸에 대시를 덧씌우는 가짜 공격보다 다른 공격과 일관된다. 기술·궁극기 자세도 같은 규칙.
//  판정·피해·범위·충돌·저장 형식은 바꾸지 않는다. R271 이 그릴 때 이 정책을 묻는다(window.__STORYWORLD_HWANDO_R277__).
// 끄기(R271 그대로): localStorage['storyworld.r277.hwando']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_R277__)return;
const REV='R277-hwando-4',KEY='storyworld.r277.hwando';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={idleHold:0,upAttack:0,attack:0};let lastH='e';
// 대기: 걷기 클립 마지막 칸
function idle(dir){stats.idleHold++;return {anim:'walk',dir,frame:-1};}
// R349(사용자 2026-11-05 "환도영웅 이동및 공격모션을 위,좌,우로만"): 이동·공격·피격 모두 위(n)·좌(w)·우(e) 세 방향.
//  아래(s) → 가로 성분(dx 화면 px) 부호, 작으면 마지막 가로 방향(좌·우). 위 공격은 R242 공격 N 원화(R283 색 맞춤)를 그대로 쓴다.
const side=(dx,th)=>{const d=Math.abs(+dx||0)>th?(dx>0?'e':'w'):lastH;lastH=d;return d;};
// R425(사용자 2026-11-08 "환도영웅 멈춰서 위나 아래 공격할 때 예전 모션 나오는 문제 — 공격 시에는 항상 좌나 우 공격 모션이 나가도록"):
//  위 공격도 옛 R242 공격 N 원화 대신 아래와 같은 규칙(겨눈 적의 화면 가로 차이 부호, 작으면 마지막 좌·우)으로 좌·우 공격을 쓴다. 이동·피격의 위(n) 그림은 그대로.
function attackDir(dir,dx){stats.attack++;if(dir==='e'||dir==='w'){lastH=dir;return dir;}if(dir==='n'){stats.upAttack++;return side(dx,2);}stats.downAttack=(stats.downAttack||0)+1;return side(dx,2);}
// R436(사용자 2026-11-09 "환도영웅 아래이동모션으로 적용해줘"): 아래 걷기만 새 남향 걷기 v2(assets/r436/hwando/walk-s.webp)로 그린다.
//  가로 성분으로 마지막 좌·우(lastH)는 계속 갱신 — 멈추면 R283 좌·우 선 자세로 서고, 공격·피격·대시는 R349/R425 그대로 좌·우. 끄기: localStorage['storyworld.r436.hwandoWalkS']='{"on":false}'
let walkS=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r436.hwandoWalkS')||'null');if(s&&s.on===false)walkS=false;}catch(_){}
function walkDir(dir,vx){if(dir==='e'||dir==='w'){lastH=dir;return dir;}if(dir==='n')return 'n';stats.downWalk=(stats.downWalk||0)+1;const h=side(vx,.6);return walkS?'s':h;}
const down=()=>lastH;
function face(dir){if(dir==='e'||dir==='w')lastH=dir;}
window.__STORYWORLD_HWANDO_R277__=Object.freeze({revision:REV,on:()=>on,idle,attackDir,walkDir,down,face,walkS:()=>walkS,inspect:()=>({revision:REV,on,walkS,lastH,stats:{...stats}}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
