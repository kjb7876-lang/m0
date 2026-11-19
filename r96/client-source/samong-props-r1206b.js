// R1206b — 사몽 분위기 소품 실체화(사용자 2026-11-19 07:15Z "그림 없이 코드로 그린 임시 그림 다 Dots랑 협업해서 실체화").
//  R123(samong-mood-r123.js)이 코드로 그리던 소품 중 Dots CX-0166SM-A ROUGH r1 이 온 5종을 그림으로 바꾼다:
//   lantern(경성의 밤 빨간 초롱 기둥) · inkpost(먹 기둥) · shard(깨진 결정) · canvas(빈 화폭) · stone(떠 있는 돌, 원래처럼 띄움).
//  방법: R123 이 방에 들어설 때 만든 소품(room.props 의 r123Deco)에 원화가 없으면 path·height 를 얹는다 → R123 drawProp 이 원화 길(엔진 소품 그리기:
//   그림자·가림·접지)로 그린다. 그림이 아직 안 읽혔으면 R123 이 다시 요청하며 코드 그림으로 버틴다(R123 그대로).
//  자산: assets/r1206/props(index.json — 원본 파일 이름·해시, 투명 여백만 자름). ROUGH 단계라 최종 검수 전. 나머지 32종은 Dots 결과가 오면 아래 ART 에 줄만 더한다.
//  판정·충돌·저장·서사는 그대로(r123Deco 는 solid:false 표시용). 끄기: localStorage['storyworld.r1206b.props']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_PROPS_R1206B__)return;
const REV='R1206b-samong-props-1',KEY='storyworld.r1206b.props',DIR='assets/r1206/props/';
const ART=Object.freeze({
 lantern:Object.freeze({path:DIR+'lantern.webp',h:150}),
 inkpost:Object.freeze({path:DIR+'inkpost.webp',h:118}),
 shard:Object.freeze({path:DIR+'shard.webp',h:112}),
 canvas:Object.freeze({path:DIR+'canvas.webp',h:104}),
 stone:Object.freeze({path:DIR+'stone.webp',h:84,lift:46})});
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={rooms:0,dressed:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const seen=new WeakSet();
function dress(){if(!prefs.on)return;const r=typeof room==='object'?room:null;if(!r||!r.samongR103||!Array.isArray(r.props))return;
 let n=0;for(const p of r.props){if(!p||!p.r123Deco||seen.has(p))continue;seen.add(p);if(p.path)continue;const a=ART[p.r123Deco.kind];if(!a)continue;
  p.path=a.path;p.height=a.h;if(a.lift)p.visualLiftPx=a.lift;p.r1206bArt=true;n++;try{if(typeof addImage==='function')addImage(a.path);}catch(e){fail(e);}}
 if(n){stats.rooms++;stats.dressed+=n;}}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{dress();}catch(e){fail(e);}return r;};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_SAMONG_PROPS_R1206B__=Object.freeze({revision:REV,art:ART,set,dress,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
