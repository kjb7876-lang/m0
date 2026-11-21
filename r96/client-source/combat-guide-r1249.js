// R1249 — 외부 제안 검토 ①(사용자 2026-11-19 23:56Z "/검토": "큰 이펙트가 겹쳐도 위험 경계가 보이게. 첫 전투에서는 키보드 안내를
//  `바닥을 눌러 이동`과 `회피 버튼으로 피하기`로").
//  헤드리스 확인(같은 빌드, 스토리 첫 전투 dist00): PC 는 아래 기술 칸에 A/J/1·S/2 같은 키가 적혀 있어 맞다. 휴대폰은 R421 이 'C' 를 '버튼'으로
//   이미 바꿔 키 글자는 없지만, 어떻게 움직이고 피하는지 알려 주는 말이 설정 창 안('탭: 목적지 이동 · 두 손가락: 회피')에만 있었다.
//  (위험 경계 옅게 하기는 사용자 11-20 00:44Z '바닥예고는 빼셈 예고 안쓰니까'로 넣지 않음.)
//  ② 첫 전투 안내: 터치 기기에서 처음으로 살아 있는 적이 9칸 안에 오면 '바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기'를 한 번(5초) 띄운다.
//     PC 는 키보드 안내가 맞으므로 아무것도 바꾸지 않는다. 본 기록 storyworld.r1249.guide {touch:true}.
//  판정·피해·AI·저장·자산 원본은 그대로(그림 알파·안내 글만). 끄기: localStorage['storyworld.r1249.guide']='{"hint":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_GUIDE_R1249__)return;
const REV='R1249-combat-guide-5',KEY='storyworld.r1249.guide',HINT='바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기';
let prefs={hint:true,touch:false};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s==='object')prefs={...prefs,...s};}catch(_){}
const stats={hints:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
// ② 첫 전투 안내(터치)
function touch(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
// ③ 2차 리뷰(사용자 11-20 00:34Z 첨부): 공개판 터치 첫 화면 아래 줄(#hint)이 9px '방향키 이동 · A/J/1 공격 · S/2 블링크…'.
//    헤드리스(812×375 터치)로 같은 글을 확인 → 터치 기기에서만 키보드 안내 줄을 터치 안내로 바꾸고, 도움말(조작과 진행) 맨 위에 터치 줄 하나를 더한다(키 표는 그대로).
const KB_HINT=/^(WASD\/)?방향키 이동/;
function fixHint(){try{if(!prefs.hint||!touch())return false;const el=document.getElementById('hint');if(!el)return false;const t=String(el.textContent||'');
 if(KB_HINT.test(t)){el.textContent=HINT;stats.hintFixes=(stats.hintFixes||0)+1;return true;}}catch(e){fail(e);}return false;}
function helpRow(){try{if(!touch())return false;const g=document.querySelector('#panel .keygrid');if(!g||g.firstChild?.className==='r1249Touch')return false;
 const b=document.createElement('b');b.className='r1249Touch';b.textContent='터치';const sp=document.createElement('span');sp.textContent=HINT;g.insertBefore(sp,g.firstChild);g.insertBefore(b,sp);return true;}catch(e){fail(e);return false;}}
function wrapHud(){try{if(typeof setHudTextR63R2!=='function'||setHudTextR63R2.__r1249)return;const hb=setHudTextR63R2;
 const w=function(id,text,...rest){if(id==='hint'&&typeof text==='string'&&prefs.hint&&KB_HINT.test(text)&&touch()){text=HINT;stats.hintFixes=(stats.hintFixes||0)+1;}return hb.call(this,id,text,...rest);};/* R1290: 아래 감싸기 표식을 옮겨 단다 — 안 옮기면 R1113·R1249 가 setHudTextR63R2 를 서로 다시 감싸 끝없이 쌓였다(qa/r1290) */for(const j of Object.keys(hb))if(/^_*r\d+/i.test(j))try{w[j]=hb[j];}catch(_){}w.__r1249=true;setHudTextR63R2=w;}catch(e){fail(e);}}
wrapHud();
if(typeof showHelp==='function'){const hb=showHelp;showHelp=function(...a){const r=hb.apply(this,a);helpRow();return r;};}
function tick(){fixHint();try{if(!prefs.hint||prefs.touch||!touch())return false;
 if(typeof started==='undefined'||!started||(typeof loading!=='undefined'&&loading)||(typeof modal!=='undefined'&&modal)||(typeof storyScene!=='undefined'&&storyScene))return false;
 if(typeof player==='undefined'||!player||!(player.hp>0)||typeof room==='undefined'||!Array.isArray(room?.enemies))return false;
 let near=false;for(const e of room.enemies){if(!e||!(e.hp>0)||e.hero||e.ally)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<9){near=true;break;}}
 if(!near||typeof toast!=='function')return false;toast(HINT,5);prefs.touch=true;save();stats.hints++;return true;}catch(e){fail(e);return false;}}
setInterval(()=>{wrapHud();tick();},500);
function set(p){for(const k of ['hint'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];save();return {...prefs};}
window.__STORYWORLD_COMBAT_GUIDE_R1249__=Object.freeze({revision:REV,HINT,tick,fixHint,helpRow,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
