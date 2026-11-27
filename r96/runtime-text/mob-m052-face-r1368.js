// R1368 '공실 표기 잔재'(우두머리 포함) 그림 방향·걷기 — 사용자 2026-11-27 "공실표기 잔재 우두머리 왜케 떠다니는거 같고 이미지방향을 못잡냐".
//  헤드리스 실측(qa/r1367/walkprobe.mjs · qa/r1368):
//   · 2D(R248 시트 그리기, R290 ART m052)이고 발끝은 발밑과 1% 안으로 붙어 있었다 — 높이로 뜬 것은 아니다.
//   · 걷기 8칸(옛 r92 정면 그림)이 칸끼리 거의 같아(다리 영역 반 박자 화소 차 3.7~5.5) 다리가 안 움직인 채 미끄러져 '떠다니는' 듯했다.
//   · 공격 4칸(Dots 다시 그림)은 왼쪽을 보는데 R248 은 그림이 오른쪽을 본다고 가정(face +1 = 그대로)해 영웅이 오른쪽이면 왼쪽으로 할퀴었다(좌우 반대).
//     걷기(정면)와 공격(왼쪽)의 그림체·방향도 달라 동작이 바뀔 때마다 몸이 돌아섰다.
//  고친 것(그림만 — 판정·피해·이동·시간·저장 그대로): scripts/r1368-m052-sheet.py 가 만든 assets/r1368/m052.webp 로 R248 시트 줄 경로만 바꾼다.
//   같은 격자(4×3, 256×320)·발 줄(y≈297)·pivot(128,300)·body 179. 공격 줄은 pivot 기준 좌우 반전(오른쪽을 봄), 걷기 8칸은
//   같은 Dots 그림(공격 회수 칸)을 반전해 관절 메시로 다리를 번갈아 내딛게 했다. 원래 시트(assets/r290/mobs/m052.webp)는 지우지 않는다.
//  태그는 R176 순서 검사(audio-r98 뒤 고정 목록) 때문에 R248 표·R290 보다 앞(R1367 뒤)에 있다 → R248 표가 생기면(지금 또는 DOMContentLoaded)
//   m052.path 를 접근자로 바꿔 R290 이 넣는 옛 경로를 읽을 때만 새 경로로 돌려준다(R290 켜기·끄기도 그대로 따름).
//  끄기: localStorage['storyworld.r1368.m052']='{"on":false}' 뒤 새로고침.
(()=>{'use strict';if(window.__STORYWORLD_M052_R1368__)return;
 const OLD='assets/r290/mobs/m052.webp',NEW='assets/r1368/m052.webp';let on=true,hooked=false;
 try{const s=JSON.parse(localStorage.getItem('storyworld.r1368.m052')||'null');if(s&&s.on===false)on=false;}catch(_){}
 const mark=Symbol('r1368');
 function hook(){if(!on)return false;const s=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__?.sheets?.m052;if(!s)return false;
  hooked=!!Object.getOwnPropertyDescriptor(s,'path')?.get?.[mark];if(hooked)return true;
  try{const d=Object.getOwnPropertyDescriptor(s,'path');let v=d?d.value:undefined,has=!!d;
   Object.defineProperty(s,'path',{configurable:true,enumerable:true,get:Object.assign(function(){return has&&v===OLD?NEW:v;},{[mark]:1}),set(x){v=x;has=true;}});
   /* R290 끄기(delete s.path)는 접근자째 지운다 — R290 은 얼어 있어 못 감싼다. 다시 켠 뒤엔 hook() 또는 새로고침(R248 도 몹마다 경로를 캐시하므로 어차피 새로고침). */
   hooked=true;}catch(_){}return hooked;}
 if(!hook())try{document.addEventListener('DOMContentLoaded',hook,{once:true});}catch(_){}
 window.__STORYWORLD_M052_R1368__=Object.freeze({rev:'R1368-m052-2',on,get applied(){return hook()&&window.__STORYWORLD_MOB_UNIQUE_R248_DATA__?.sheets?.m052?.path===NEW;},hook,old:OLD,path:NEW});})();
