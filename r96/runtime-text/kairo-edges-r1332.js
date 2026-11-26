/* R1332 카이로노미콘 맵 전수조사 — 벽 자리에 바닥 타일이 보이던 그리기 오류 두 가지(사용자 2026-11-26 "카이로노미콘맵 전수조사해서 타일이 벽에나오는 버그같은거 개선디버깅").
 *  전수조사(헤드리스, 10지역): 지도 자료(바닥 칸·벽판·바닥 사각형·충돌·길)는 10지역 모두 어긋남 0. 그림에서 두 가지를 찾았다.
 *  ① 맵 가장자리: 야외형 카이로 지역(kair03 세이렌 모르·kair06 수로·kair08 뉴런 게이트·kair09 망각의 묘지·kair10 붕괴 의식장)은 길 밖 둔덕 뚜껑(R100 hedge-top)이
 *     지도 경계(bounds) 안에만 깔리고, 그 아래 땅 판(R98 이 바닥 그림을 입힌 R82 backing)은 경계 밖 최대 28칸까지 뻗는다(x 100→128 등).
 *     그래서 바깥 벽 너머에 검은 띠(R188 가장자리 판, 경계+4칸) 다음 회로 바닥 타일이 그대로 깔려 보였다(뉴런 게이트 동쪽이 가장 뚜렷).
 *     → 경계 둘레(여백 MARGIN 칸)에 R100 뚜껑과 같은 재질·같은 높이·같은 UV 의 바깥 고리 뚜껑을 덧깐다. 경계 안은 하나도 덮지 않는다(원래 뚜껑·바닥 그대로).
 *  ② 문틀: R930 이 벽만 kc-deck/kc-forge 로 칠한 카이로 지역의 문틀 띠는 R83 이 옛 병동 벽 그림(밝은 회색)으로 그려 흰 기둥처럼 떴다.
 *     → R1298 문틀 훅(__STORYWORLD_DOOR_FRAME_R1298__)을 감싸 그 지역 벽 그림을 준다. 망각의 묘지(kair09)는 R1298 이 먼저 답하고,
 *     R204 유기 지형 지역(kair01·04·05)은 R264 어두운 바위 문틀 그대로. 문 조각 수(R83 문 그리기 계약)는 그대로, 그림만.
 *  충돌·길찾기·바닥 칸·벽판·몹·조형물·저장·서사는 그대로. 끄기: localStorage['storyworld.r1332.kairoEdges']='0'. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_KAIRO_EDGES_R1332__)return;
const REV='R1332-kairo-edges-1',KEY='storyworld.r1332.kairoEdges',MARGIN=40;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={rings:0,reused:0,hidden:0,frames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const ZONES=Object.freeze(['kair01','kair02','kair03','kair04','kair05','kair06','kair07','kair08','kair09','kair10']);const ZSET=new Set(ZONES);
const FRAMES=Object.freeze({kair02:'kc-deck',kair03:'kc-deck',kair06:'kc-deck',kair07:'kc-forge',kair08:'kc-deck',kair10:'kc-deck'});
const DIR='assets/r930/tiles/',RECT=Object.freeze([1024,0,1024,1024]),TINT=0xf0eeec;
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const story=r=>!!r&&typeof r==='object'&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&!r.exploration?.samongR115;
// 순수(QA): 경계 [x0,y0,x1,y1] 둘레 여백 m 칸의 고리 — 서로 겹치지 않는 사각형 4개(위·아래 띠는 모서리까지, 좌·우 띠는 경계 높이만). 깨진 입력은 [].
function ring(b,m=MARGIN){if(!Array.isArray(b)||b.length<4)return[];const[x0,y0,x1,y1]=b;if(![x0,y0,x1,y1,m].every(fin)||m<=0||!(x1>x0&&y1>y0))return[];
 const W=x1-x0+2*m;return[{x:x0-m,y:y0-m,width:W,depth:m},{x:x0-m,y:y1,width:W,depth:m},{x:x0-m,y:y0,width:m,depth:y1-y0},{x:x1,y:y0,width:m,depth:y1-y0}];}
const ringZone=r=>on&&story(r)&&ZSET.has(String(r.id||''));
function frameArt(r){if(!on||!story(r))return null;const f=FRAMES[String(r.id||'')];return f?{path:DIR+f+'.webp',rect:[...RECT],tint:TINT}:null;}
// ---------- ① 바깥 고리 뚜껑 ----------
function zoneOf(frame){const L=frame?.exploration;if(frame?.id!=null)return frame;try{if(typeof room==='object'&&room&&room.exploration===L)return room;}catch(_){}return null;}
function syncRing(R,frame){const old=R.r1332Ring,cap=R.r100Cap,r=zoneOf(frame),L=frame?.exploration;
 if(!ringZone(r)||!L||!cap||!cap.visible||cap.parent!==R.spatialRoot||!R.spatialRoot||!R.T){if(old&&old.visible){old.visible=false;stats.hidden++;}return;}
 const pa=cap.geometry?.attributes?.position,h=pa&&pa.count?pa.getY(0):NaN;if(!fin(h)){if(old)old.visible=false;return;}
 if(old&&old.userData.layout===L&&old.userData.h===h&&old.material===cap.material&&old.parent===R.spatialRoot){old.visible=true;stats.reused++;return;}
 if(old){old.parent?.remove(old);old.geometry?.dispose?.();R.r1332Ring=null;}
 const rects=ring(L.bounds);if(!rects.length)return;const T=R.T,pos=[],uv=[],idx=[],tile=3;
 for(const q of rects){const i=pos.length/3,c=[[q.x,q.y],[q.x+q.width,q.y],[q.x+q.width,q.y+q.depth],[q.x,q.y+q.depth]];for(const[x,y]of c){pos.push(x,h,y);uv.push(x/tile,-y/tile);}idx.push(i,i+2,i+1,i,i+3,i+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new T.Mesh(g,cap.material);mesh.name='r1332-outer-cap';mesh.layers.mask=cap.layers.mask;mesh.renderOrder=cap.renderOrder;
 mesh.userData={presentationOnly:true,collisionChanged:false,r1332OuterCap:true,layout:L,h};R.spatialRoot.add(mesh);R.r1332Ring=mesh;stats.rings++;}
const C=window.StoryPhase1?.ThreeRenderer?.prototype;
if(C?.ensureHospitalRoofsR2){const base=C.ensureHospitalRoofsR2;C.ensureHospitalRoofsR2=function(frame){const out=base.call(this,frame);try{syncRing(this,frame);}catch(e){fail(e);}return out;};}
if(C?.clearScene){const base=C.clearScene;C.clearScene=function(...a){try{this.r1332Ring?.geometry?.dispose?.();}catch(_){}this.r1332Ring=null;return base.apply(this,a);};}
// ---------- ② 문틀 훅 감싸기 ----------
const images=new Map();
function look(p){let row=images.get(p);if(!row){row={image:null,ready:false};images.set(p,row);try{if(typeof Image!=='undefined'){const im=new Image();row.image=im;im.decoding='async';im.onload=()=>{row.ready=true;};im.onerror=()=>fail(Error('R1332 frame art failed: '+p));im.src=p;}}catch(e){fail(e);}}return row;}
const prev=window.__STORYWORLD_DOOR_FRAME_R1298__;
window.__STORYWORLD_DOOR_FRAME_R1298__=Object.freeze({
 art(r){let a=null;try{a=prev?.art?.(r)||null;}catch(e){fail(e);}if(a)return a;
  try{const f=frameArt(r);if(!f)return null;const row=look(f.path);if(!row.ready||!row.image)return null;stats.frames++;return{...f,image:row.image};}catch(e){fail(e);return null;}}});
window.__STORYWORLD_KAIRO_EDGES_R1332__=Object.freeze({revision:REV,ZONES,FRAMES,MARGIN,ring,ringZone,frameArt,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,chained:!!prev})});
})();
