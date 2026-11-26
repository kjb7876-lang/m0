/* R1335 야외 스토리 지역 맵 가장자리 — 바깥 벽 너머 바닥 타일·검은 띠(사용자 2026-11-26 R1332 보고 뒤 "응고쳐": 카이로 밖 다른 야외 지역도).
 *  원인은 R1332 와 같다: 길 밖 둔덕 뚜껑(R100 hedge-top)은 지도 경계(bounds) 안에만 깔리고, 그 아래 땅 판(R98 이 바닥 그림을 입힌 R82 backing)은
 *  경계 밖으로 20칸(동쪽 x 100→120, 세로형 지도는 서·북 -16)까지 뻗어, 바깥 벽 너머에 검은 띠(R188 가장자리 판)와 바닥 타일이 그대로 보였다.
 *  고침: R1332 바깥 고리(같은 ring 함수)를 카이로 밖 스토리 지역에도 깐다 — R100 뚜껑과 같은 재질·같은 높이·같은 UV, 경계 안은 하나도 덮지 않는다.
 *   · R204 유기 지형 지역은 R204 바위 판(plateau)이 경계 밖 8칸까지 덮으므로, 고리 안쪽 상자를 그 판 끝까지 넓혀 판과 겹치지 않게 한다.
 *   · 실내(뚜껑 없음) 지역·사몽 층·카이로(R1332 몫)는 그대로.
 *  충돌·길·바닥 칸·벽판·몹·조형물·저장·서사는 그대로. 끄기: localStorage['storyworld.r1335.outdoorEdges']='0'. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_OUTDOOR_EDGES_R1335__)return;
const REV='R1335-outdoor-edges-1',KEY='storyworld.r1335.outdoorEdges',K=window.__STORYWORLD_KAIRO_EDGES_R1332__;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={rings:0,reused:0,hidden:0,widened:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const KAIRO=new Set(K?.ZONES||[]);
const story=r=>!!r&&typeof r==='object'&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&!r.exploration?.samongR115;
const ringZone=r=>on&&!!K&&story(r)&&!!String(r.id||'')&&!KAIRO.has(String(r.id));
// 순수(QA): 고리 안쪽 상자 = 경계 ∪ (있으면) R204 바위 판 바닥 상자 [x0,y0,x1,y1]. 판 상자가 깨졌으면 경계 그대로. 경계가 깨졌으면 null.
function inner(b,plate){if(!Array.isArray(b)||b.length<4||!b.slice(0,4).every(fin)||!(b[2]>b[0]&&b[3]>b[1]))return null;const out=b.slice(0,4);
 if(Array.isArray(plate)&&plate.length>=4&&plate.slice(0,4).every(fin)&&plate[2]>plate[0]&&plate[3]>plate[1]){out[0]=Math.min(out[0],plate[0]);out[1]=Math.min(out[1],plate[1]);out[2]=Math.max(out[2],plate[2]);out[3]=Math.max(out[3],plate[3]);}
 return out;}
const rects=(b,plate)=>{const i=inner(b,plate);return i&&K?K.ring(i):[];};
function zoneOf(frame){const L=frame?.exploration;if(frame?.id!=null)return frame;try{if(typeof room==='object'&&room&&room.exploration===L)return room;}catch(_){}return null;}
function plateBox(R){const p=R.spatialRoot?.getObjectByName?.('r204-plateau');if(!p||!p.visible||!R.T)return null;try{const bb=new R.T.Box3().setFromObject(p);return[bb.min.x,bb.min.z,bb.max.x,bb.max.z];}catch(e){fail(e);return null;}}
function syncRing(R,frame){const old=R.r1335Ring,cap=R.r100Cap,r=zoneOf(frame),L=frame?.exploration;
 if(!ringZone(r)||!L||!cap||!cap.visible||cap.parent!==R.spatialRoot||!R.spatialRoot||!R.T){if(old&&old.visible){old.visible=false;stats.hidden++;}return;}
 const pa=cap.geometry?.attributes?.position,h=pa&&pa.count?pa.getY(0):NaN;if(!fin(h)){if(old)old.visible=false;return;}
 const plate=plateBox(R),sig=plate?plate.map(v=>Math.round(v*100)).join(','):'';
 if(old&&old.userData.layout===L&&old.userData.h===h&&old.userData.sig===sig&&old.material===cap.material&&old.parent===R.spatialRoot){old.visible=true;stats.reused++;return;}
 if(old){old.parent?.remove(old);old.geometry?.dispose?.();R.r1335Ring=null;}
 const rs=rects(L.bounds,plate);if(!rs.length)return;if(plate)stats.widened++;const T=R.T,pos=[],uv=[],idx=[],tile=3;
 for(const q of rs){const i=pos.length/3,c=[[q.x,q.y],[q.x+q.width,q.y],[q.x+q.width,q.y+q.depth],[q.x,q.y+q.depth]];for(const[x,y]of c){pos.push(x,h,y);uv.push(x/tile,-y/tile);}idx.push(i,i+2,i+1,i,i+3,i+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new T.Mesh(g,cap.material);mesh.name='r1335-outer-cap';mesh.layers.mask=cap.layers.mask;mesh.renderOrder=cap.renderOrder;
 mesh.userData={presentationOnly:true,collisionChanged:false,r1335OuterCap:true,layout:L,h,sig};R.spatialRoot.add(mesh);R.r1335Ring=mesh;stats.rings++;}
const C=window.StoryPhase1?.ThreeRenderer?.prototype;
if(K&&C?.ensureHospitalRoofsR2){const base=C.ensureHospitalRoofsR2;C.ensureHospitalRoofsR2=function(frame){const out=base.call(this,frame);try{syncRing(this,frame);}catch(e){fail(e);}return out;};}
if(C?.clearScene){const base=C.clearScene;C.clearScene=function(...a){try{this.r1335Ring?.geometry?.dispose?.();}catch(_){}this.r1335Ring=null;return base.apply(this,a);};}
window.__STORYWORLD_OUTDOOR_EDGES_R1335__=Object.freeze({revision:REV,ringZone,inner,rects,inspect:()=>({revision:REV,on,linked:!!K,stats:{...stats},lastError})});
})();
