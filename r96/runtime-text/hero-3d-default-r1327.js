// R1327 영웅은 3D 를 기본으로 — 사용자 2026-11-26 07:25Z "영웅은 3d를 기본으로하고".
//  · hwando-3d-r1302.js(해시 고정 검사가 있어 건드리지 않음)는 localStorage storyworld.r1302.hwando3d 가 'on' 일 때만 3D 영웅을 켠다(기본 끔).
//    이 스크립트는 그보다 먼저 돌아, 그 값이 한 번도 정해진 적 없을 때만 'on' 으로 적어 둔다.
//  · 이미 고른 사람은 그대로: 'off'(설정에서 끈 사람)는 꺼진 채, 'on' 은 켜진 채. 설정 창에서 끄면 'off' 가 저장돼 다음부터도 꺼져 있다.
//  · 무한생존의 배치 2D 타워형 영웅은 R1302 가 원래 3D 로 그리지 않는다(조작 영웅만 3D) — 여기서 바꾸지 않는다.
//  · 저장소를 못 쓰는 환경(예외)에서는 아무것도 하지 않는다(R1302 기본 = 2D).
//  · 설정 창 설명의 "(시험)… 기본은 끔" 글을 지금 동작에 맞게 고쳐 보여 준다.
//  되돌리기(기본 끔으로): localStorage storyworld.r1327.default3d=off 를 먼저 적어 두면 이 스크립트는 값을 정하지 않는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO3D_DEFAULT_R1327__)return;
const REV='R1327-hero-3d-default',KEY='storyworld.r1302.hwando3d',OPT='storyworld.r1327.default3d';
const stats={revision:REV,applied:false,before:undefined,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
// 순수: 저장된 값(null = 정한 적 없음)과 끄기 값으로 적을 값을 정한다. null 이면 손대지 않음.
function decide(saved,opt){if(opt==='off')return null;return saved===null||saved===undefined?'on':null;}
try{const ls=window.localStorage,saved=ls.getItem(KEY);stats.before=saved;const v=decide(saved,ls.getItem(OPT));if(v){ls.setItem(KEY,v);stats.applied=true;}}catch(e){fail(e);}
const LABEL=' 3D 영웅',NOTE='환도·서하·네온·미카엘라·라우렌·헌터·슬레이어·거너·페르소나·EGO를 월드 깊이에 맞는 입체 모델로 그립니다. 기본은 켬이며, 영웅마다 처음 볼 때 모델 약 4MB를 받습니다. 끄면 2D 그림으로 돌아갑니다.';
function relabel(){const d=window.document?.getElementById?.('hwando3dR1302Row');if(!d||d.dataset.r1327)return false;
 const label=d.querySelector('label'),p=d.querySelector('p');if(label)for(const n of [...label.childNodes])if(n.nodeType===3)n.textContent=LABEL;if(p)p.textContent=NOTE;d.dataset.r1327='1';return true;}
try{window.setInterval?.(()=>{try{relabel();}catch(e){fail(e);}},500);}catch(e){fail(e);}
window.__STORYWORLD_HERO3D_DEFAULT_R1327__=Object.freeze({revision:REV,pure:Object.freeze({decide}),relabel,inspect:()=>({...stats,lastError})});
})();
