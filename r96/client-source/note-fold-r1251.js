// R1251 — 2차 리뷰 ③(사용자 2026-11-20 00:34Z 첨부 "/검토"): "전투 중 긴 기억 쪽지는 한 줄로 접되 다시 열어 읽을 수 있게 하세요.
//  쪽지를 닫은 탭이 영웅 이동으로 이어지는 사례가 없어야 합니다."
//  · 전투 중(살아 있는 적이 9칸 안)에 R177 펼친 종이(#r177Doc)가 뜨면 제목 한 줄로 접는다(CSS 만, 글·순서·쪽지 모음은 그대로).
//    접힌 줄을 탭하면 펼친다. 사람이 펼친 그 쪽지는 전투 중에도 다시 접지 않는다. 전투가 끝나면 저절로 펼친다.
//  · 탭 새기: 헤드리스 812×375 터치에서 쪽지를 탭해 닫았을 때 영웅 이동 0(재현 안 됨). 접힌 줄을 펼치는 탭은 문서 캡처 단계에서 멈춰
//    게임 이동·R177 넘기기/닫기로 넘어가지 않게 한다. 펼친 쪽지 탭과 쪽지 밖 탭은 그대로.
//  판정·피해·저장·서사 문장은 그대로. 끄기: localStorage['storyworld.r1251.fold']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_NOTE_FOLD_R1251__)return;
const REV='R1251-note-fold-1',KEY='storyworld.r1251.fold',CLS='r1251Fold',NEAR=9;
let prefs={on:true};try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');if(p&&typeof p==='object')prefs={...prefs,...p};}catch(_){}
const stats={folds:0,unfolds:0,tapsHeld:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let manualKey=null;
function css(){try{if(document.getElementById('r1251Css'))return;const s=document.createElement('style');s.id='r1251Css';
 s.textContent='#r177Doc.'+CLS+'{max-height:2.6em!important;overflow:hidden!important;padding-top:6px!important;padding-bottom:6px!important}'
  +'#r177Doc.'+CLS+' .pg,#r177Doc.'+CLS+' p,#r177Doc.'+CLS+' .foot{display:none!important}#r177Doc.'+CLS+' .h{margin:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'#r177Doc.'+CLS+' .h::before{content:"▼ ";opacity:.8}';document.head.appendChild(s);}catch(e){fail(e);}}
const doc=()=>{try{return document.getElementById('r177Doc');}catch(_){return null;}};
const keyOf=el=>{try{return String(el.querySelector('.h')?.textContent||'');}catch(_){return '';}};
function combat(){try{if(typeof player==='undefined'||!player||typeof room==='undefined'||!Array.isArray(room?.enemies))return false;
 for(const e of room.enemies){if(!e||!(e.hp>0)||e.hero||e.ally)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<NEAR)return true;}}catch(_){}return false;}
function tick(){try{const el=doc();if(!el||el.hidden){manualKey=null;return;}const k=keyOf(el),folded=el.classList.contains(CLS);
 if(manualKey!==null&&manualKey!==k)manualKey=null;/* 다른 쪽지가 떴다 */
 const want=prefs.on&&combat()&&manualKey!==k;
 if(want&&!folded){css();el.classList.add(CLS);stats.folds++;}else if(!want&&folded){el.classList.remove(CLS);stats.unfolds++;}}catch(e){fail(e);}}
function onTap(ev){try{const el=doc();if(!el||el.hidden||!el.classList.contains(CLS))return;const hit=ev?.target?.closest?.('#r177Doc');if(!hit)return;
 ev.stopImmediatePropagation?.();ev.stopPropagation?.();stats.tapsHeld++;/* 터치 시작에 preventDefault 하면 click 이 안 생겨 펼치지 못한다 → click 에서만 */
 if(ev.type==='click'){ev.preventDefault?.();el.classList.remove(CLS);manualKey=keyOf(el);stats.unfolds++;}}catch(e){fail(e);}}
for(const t of ['pointerdown','pointerup','touchstart','touchend','mousedown','click'])try{document.addEventListener(t,onTap,true);}catch(_){}
setInterval(tick,300);
function set(p){if(typeof p?.on==='boolean'){prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}tick();return {...prefs};}
window.__STORYWORLD_NOTE_FOLD_R1251__=Object.freeze({revision:REV,tick,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},manualKey,lastError,gameplayChanged:false,savesTouched:false})});
})();
