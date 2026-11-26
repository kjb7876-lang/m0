// R1321 뿌리의 문지기 R3 시범(Dots BOSS3D-00 R3, 11-26). R1312 첫 맵 3D 의 보스 모델(R2)을 설정으로 R3 로 바꿔 끼운다.
//  · 자산: Dots GLB 를 바이트 그대로 씀(assets/r1321/boss-dist00-root-gatekeeper-3d-r3.glb, 3.2m, 4.4만 삼각형, 2048 WebP, 클립 7개).
//  · 그리기·크기·재질 손질·동작은 R1312 를 그대로 탄다(R1312 load 가 glbOf('boss') 로 이 설정을 묻는다). R1312 가 꺼져 있으면 아무것도 안 함.
//  · 켜고 끄기: 설정 '뿌리의 문지기 R3 모델(시험)' / storyworld.r1321.boss00r3('on'|'off') / 주소 ?boss00r3=1·0. 기본 꺼짐(R2 그대로).
//    보스 모델을 이미 읽은 뒤에 바꾸면 다음 판(새로 고침)부터 바뀐다.
//  · 미검증: GPU 실기기·모바일 프레임, 실제 플레이 손맛.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_BOSS00_R1321__)return;
const REV='R1321-boss00r3-1',KEY='storyworld.r1321.boss00r3',GLB='assets/r1321/boss-dist00-root-gatekeeper-3d-r3.glb';
let on=false;
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const q=new URLSearchParams(location.search).get('boss00r3');if(q==='1')on=true;else if(q==='0')on=false;}catch(_){}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('boss00R1321Toggle');if(el)el.checked=on;return on;}
function row(){const doc=document;if(doc.getElementById('boss00R1321Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;
 const d=doc.createElement('div');d.id='boss00R1321Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="boss00R1321Toggle"> 뿌리의 문지기 R3 모델(시험)</label><p class="small muted">\'3D 첫 맵 몹\'이 켜져 있을 때 뿌리의 문지기를 새로 만든 R3 입체 모델로 그립니다(날개·후광·은 비늘 갑옷). 끄면 이전 모델입니다. 다음 판부터 바뀝니다.</p>';
 host.appendChild(d);const el=d.querySelector('#boss00R1321Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(_){}return result;};}
window.__STORYWORLD_BOSS00_R1321__=Object.freeze({revision:REV,glbPath:GLB,on:()=>on,glb:()=>on?GLB:null,set});
})();
