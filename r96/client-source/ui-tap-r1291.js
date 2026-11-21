// R1291 UI 최종 점검(간격·정렬·터치 영역) — 사용자 2026-11-21 06:22Z "응 점검해보고"(impeccable 방식 점검 승인).
//  헤드리스 측정(PC 1366×768·폰 가로 844×390·세로 390×844, 화면 8개): 겹침·화면 밖 단추 0, 잘림 1·작은 터치 영역 다수.
//  ① 폰(터치): 설정 체크 칸 13px·그 줄 높이 19~29px, 화풍 고르기 19px, 메뉴 '◀ 닫기' 25px, 진단 창 접기 줄 18px → 손가락으로 누르기 어려움.
//     고침: 터치 화면(pointer:coarse)에서만 체크 칸 22px·체크 줄 최소 40px·고르기 40px·닫기 40px·접기 줄 40px. 마우스 PC 는 그대로.
//  ② 모든 크기: 나침반 아래 지역 이름이 한 줄 말줄임으로 잘림('악마화 나무의 …'). 고침: 두 줄까지 줄바꿈(그래도 넘치면 두 줄째 말줄임).
//  CSS 만 덧붙인다 — 단추 id·동작·저장 값·색·글꼴은 그대로. 끄기: localStorage['storyworld.r1291.uiTap']='0'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_UI_TAP_R1291__)return;
const REV='R1291-ui-tap-1',KEY='storyworld.r1291.uiTap',ID='r1291Css';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const CSS=[
 '@media (pointer:coarse){',
 ' #panel label:has(> input[type=checkbox]){display:flex;flex-wrap:wrap;align-items:center;column-gap:6px;min-height:40px;box-sizing:border-box}',
 ' #panel input[type=checkbox]{width:22px;height:22px;flex:0 0 22px;margin:0 6px 0 2px}',
 ' #panel select{min-height:40px}',
 ' #panel button[data-r176="back"]{min-height:40px;padding-top:8px;padding-bottom:8px}',
 ' #panel summary{padding-top:11px;padding-bottom:11px}',
 '}',
 '#navCompassR100 .label{white-space:normal!important;display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;line-height:1.2;text-align:center;overflow:hidden;word-break:keep-all;overflow-wrap:anywhere}'
].join('\n');
function apply(){try{if(typeof document!=='object'||!document.head)return false;let s=document.getElementById(ID);
 if(!on){if(s)s.remove();return false;}if(!s){s=document.createElement('style');s.id=ID;s.textContent=CSS;document.head.appendChild(s);}return true;}catch(_){return false;}}
apply();try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});}catch(_){}
window.__STORYWORLD_UI_TAP_R1291__=Object.freeze({revision:REV,storageKey:KEY,CSS,
 set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}apply();return on;},
 inspect:()=>({revision:REV,on,installed:!!document.getElementById(ID),coarse:!!window.matchMedia?.('(pointer:coarse)').matches})});
})();
