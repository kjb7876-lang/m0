// R1368 '공실 표기 잔재'(우두머리 포함) 그림 방향·걷기 — 사용자 2026-11-27 "공실표기 잔재 우두머리 왜케 떠다니는거 같고 이미지방향을 못잡냐".
//  헤드리스 실측(qa/r1367/walkprobe.mjs · qa/r1368):
//   · 2D(R248 시트 그리기, R290 ART m052)이고 발끝은 발밑과 1% 안으로 붙어 있었다 — 높이로 뜬 것은 아니다.
//   · 걷기 8칸(옛 r92 정면 그림)이 칸끼리 거의 같아(다리 영역 반 박자 화소 차 3.7~5.5) 다리가 안 움직인 채 미끄러져 '떠다니는' 듯했다.
//   · 공격 4칸(Dots 다시 그림)은 왼쪽을 보는데 R248 은 그림이 오른쪽을 본다고 가정(face +1 = 그대로)해 영웅이 오른쪽이면 왼쪽으로 할퀴었다(좌우 반대).
//     걷기(정면)와 공격(왼쪽)의 그림체·방향도 달라 동작이 바뀔 때마다 몸이 돌아섰다.
//  고친 것(그림만 — 판정·피해·이동·시간·저장 그대로): scripts/r1368-m052-sheet.py 가 만든 assets/r1368/m052.webp 로 R248 시트 줄 경로만 바꾼다.
//   같은 격자(4×3, 256×320)·발 줄(y≈297)·pivot(128,300)·body 179. 공격 줄은 pivot 기준 좌우 반전(오른쪽을 봄), 걷기 8칸은
//   같은 Dots 그림(공격 회수 칸)을 반전해 관절 메시로 다리를 번갈아 내딛게 했다. 원래 시트(assets/r290/mobs/m052.webp)는 지우지 않는다.
//  끄기: localStorage['storyworld.r1368.m052']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';if(window.__STORYWORLD_M052_R1368__)return;
 const OLD='assets/r290/mobs/m052.webp',NEW='assets/r1368/m052.webp';let on=true,applied=false;
 try{const s=JSON.parse(localStorage.getItem('storyworld.r1368.m052')||'null');if(s&&s.on===false)on=false;}catch(_){}
 const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;
 try{const s=D?.sheets?.m052;if(on&&s&&s.path===OLD){s.path=NEW;applied=true;}}catch(_){}
 window.__STORYWORLD_M052_R1368__=Object.freeze({rev:'R1368-m052-1',on,applied,old:OLD,path:NEW});})();
