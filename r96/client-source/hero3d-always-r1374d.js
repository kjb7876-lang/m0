// R1374d 조종 영웅은 언제나 3D — 사용자 2026-11-27 08:30Z "이제부터는 3d영웅을 기본으로 사용해 모든경우, 스킬이펙트용이나 소환용으로만 2d영웅사용",
//  08:31Z "무한생존도 플레이어는 3d임", "배치영웅만 2d".
//  · R1327 은 정한 적 없을 때만 3D 키를 'on' 으로 적었다(설정에서 끈 사람은 2D). 이제는 끈 사람도 3D: 키가 'on' 이 아니면 'on' 으로 적는다.
//    hwando-3d-r1302.js(해시 고정 검사)는 고치지 않는다 — 이 스크립트가 그보다 먼저 돌아 키를 맞추고, 뒤에도 R1302 가 꺼져 있으면 set(true) 로 다시 켠다.
//  · 설정 창 3D 체크 상자는 켜진 채 잠그고 "항상 켬" 으로 보인다.
//  · 2D 영웅은 소환·스킬 이펙트·무한생존 배치 영웅만: R1302 active() 가 r720Ally(배치·소환 몸)·r949Summon 을 3D 에서 빼므로 그대로 2D(R1374 좌우 공격·블링크 규칙).
//  · 3D 모델을 못 받았을 때(네트워크 실패)는 R1302 가 2D 몸을 남긴다 — 그때도 R1374 2D 규칙이 걸린다.
//  · 개발 검사용으로만 2D 조종 영웅: localStorage storyworld.r1374d.qa2d=on (설정 창에는 없음).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO3D_ALWAYS_R1374D__)return;
const REV='R1374d-hero-3d-always',KEY='storyworld.r1302.hwando3d',QA='storyworld.r1374d.qa2d';
const stats={revision:REV,before:undefined,applied:false,qa2d:false,reenabled:0,relabeled:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
function ls(){try{return window.localStorage||null;}catch(e){fail(e);return null;}}
function qa2d(){const s=ls();if(!s)return false;try{return s.getItem(QA)==='on';}catch(e){fail(e);return false;}}
try{const s=ls();if(s){stats.qa2d=qa2d();if(!stats.qa2d){const v=s.getItem(KEY);stats.before=v;if(v!=='on'){s.setItem(KEY,'on');stats.applied=true;}}}}catch(e){fail(e);}
const LABEL=' 3D 영웅(항상 켬)',NOTE='조종 영웅은 언제나 입체 모델로 그립니다(무한생존 포함). 2D 영웅 그림은 소환·스킬 이펙트와 무한생존 배치 영웅에만 씁니다. 영웅마다 처음 볼 때 모델 약 4MB를 받습니다.';
function api(){return window.__STORYWORLD_HWANDO3D_R1302__||null;}
function keepOn(){if(stats.qa2d)return false;const a=api();if(!a||typeof a.on!=='function'||typeof a.set!=='function')return false;if(a.on()===true)return false;a.set(true);stats.reenabled++;return true;}
function relabel(){if(stats.qa2d)return false;const doc=window.document,d=doc?.getElementById?.('hwando3dR1302Row');if(!d)return false;
 const label=d.querySelector('label'),p=d.querySelector('p'),el=doc.getElementById?.('hwando3dR1302Toggle')||d.querySelector('input');let changed=false;
 if(label)for(const n of [...label.childNodes])if(n.nodeType===3&&n.textContent!==LABEL){n.textContent=LABEL;changed=true;}
 if(p&&p.textContent!==NOTE){p.textContent=NOTE;changed=true;}
 if(el){if(el.checked!==true){el.checked=true;changed=true;}if(el.disabled!==true){el.disabled=true;changed=true;}
  if(!el.__r1374d){el.__r1374d=true;el.onchange=()=>{el.checked=true;try{keepOn();}catch(e){fail(e);}};}}
 if(changed)stats.relabeled++;return changed;}
function step(){try{keepOn();}catch(e){fail(e);}try{relabel();}catch(e){fail(e);}}
try{window.setInterval?.(step,500);}catch(e){fail(e);}
window.__STORYWORLD_HERO3D_ALWAYS_R1374D__=Object.freeze({revision:REV,keepOn,relabel,step,inspect:()=>({...stats,lastError})});
})();
