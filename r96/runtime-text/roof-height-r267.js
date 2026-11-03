// R267 실내 지붕 덮개 높이를 벽 윗면에 맞추기 — 사용자 2026-11-03 "나태의집등,벽지붕위치 높이 잘못적용된문제개선".
//  실측(헤드리스 ep1b02·ep1b04·ep1b05): R219 실내 벽은 높이 2.85 인데, 벽 밖을 덮는 지붕 덮개(R80 이 병원 덮개를 빌려 쓰는 'hospital-r2-solid-roof-caps')와
//  맵 둘레 테두리(r83 masonry 경사면)는 병원 벽 높이 2.705 에 고정돼 있었다 → 덮개가 벽 윗면보다 0.145 낮아 벽 윗선이 덮개 위로 한 줄 더 튀어나오고
//  덮개 가장자리가 벽과 어긋나 보였다.
//  · 그 지역 벽(장식 벽 제외)의 가장 흔한 높이가 2.705 보다 높으면 지붕 덮개·둘레 테두리를 세로로 늘려(scale.y) 윗면을 그 높이에 맞춘다.
//    발밑 판정·벽·문·바닥은 건드리지 않는다(그림만). 진짜 병원(ep1a08, 벽 2.705)은 그대로다.
//  끄기: localStorage['storyworld.r267.roofHeight']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_ROOF_HEIGHT_R267__)return;
const REV='R267-roof-1',KEY='storyworld.r267.roofHeight',BASE=2.705;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={fitted:0,layouts:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const H=new WeakMap();
function wallTop(L){if(!L||typeof L!=='object')return BASE;if(H.has(L))return H.get(L);const n=new Map();
 for(const w of L.walls||[]){if(!w||w.decorative||!Number.isFinite(w.height))continue;const k=Math.round(w.height*1000)/1000;n.set(k,(n.get(k)||0)+1);}
 let best=BASE,c=0;for(const [k,v] of n)if(v>c){c=v;best=k;}if(!(best>BASE+.01&&best<BASE*1.6))best=BASE;H.set(L,best);stats.layouts++;return best;}
function fit(mesh,s){if(!mesh?.scale)return;const want=on?s:1;if(Math.abs(mesh.scale.y-want)>1e-4){mesh.scale.y=want;mesh.updateMatrix?.();stats.fitted++;}}
const C=window.StoryPhase1?.ThreeRenderer?.prototype,base=C?.ensureHospitalRoofsR2;
if(base)C.ensureHospitalRoofsR2=function(frame,...a){const r=base.call(this,frame,...a);
 try{const L=frame?.exploration,top=wallTop(L),s=top/BASE,world=!!this.hospitalRoofMeshR2?.userData?.r80WorldRoof;const k=world?s:1;
  fit(this.hospitalRoofMeshR2,k);fit(this.perimeterMeshR83,k);last={zone:frame?.zone,wallTop:top,scale:+k.toFixed(4),world};}catch(e){fail(e);}return r;};
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_ROOF_HEIGHT_R267__=Object.freeze({revision:REV,set,wallTop,inspect:()=>({revision:REV,on,hooked:!!base,stats:{...stats},last,lastError})});
})();
