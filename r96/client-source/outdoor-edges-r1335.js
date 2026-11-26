/* R1335 야외 스토리 지역 맵 가장자리 — 바깥 벽 너머 바닥 타일(사용자 2026-11-26 R1332 보고 뒤 "응고쳐": 카이로 밖 다른 야외 지역도).
 *  원인은 R1332 와 같다: 그 아래 땅 판(R98 이 바닥 그림을 입힌 R82 backing)이 지도 경계(bounds) 밖으로 20칸(동 x 100→120, 세로형 서·북 -16)까지 뻗는다.
 *  다만 카이로 밖 야외·혼합 지역은 길 밖 덩어리가 이끼 뚜껑이 아니라 어두운 벽 덩어리로 읽혀, R1332 처럼 이끼 뚜껑 고리를 깔면
 *  맵 밖이 거대한 이끼 평원처럼 떠 보였다(헤드리스 비교 1차안, 버림). 실내 지도의 맵 밖은 검은 빈 공간이다.
 *  고침: 경계 둘레(R1332 ring, 여백 40칸)를 R188 가장자리 판과 같은 빈 색(0x08070b) 판으로 땅 판 바로 위에 덮는다 → 맵 밖은 어둠, 경계 안은 하나도 덮지 않는다.
 *   · R204 유기 지형 지역(바위 판이 R100 뚜껑을 대신함)·실내(뚜껑 없음) 지역·사몽 층·카이로(R1332 몫)는 그대로.
 *  충돌·길·바닥 칸·벽판·몹·조형물·저장·서사는 그대로. 끄기: localStorage['storyworld.r1335.outdoorEdges']='0'. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_OUTDOOR_EDGES_R1335__)return;
const REV='R1335-outdoor-edges-2',KEY='storyworld.r1335.outdoorEdges',K=window.__STORYWORLD_KAIRO_EDGES_R1332__;
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={rings:0,reused:0,hidden:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const KAIRO=new Set(K?.ZONES||[]);
const story=r=>!!r&&typeof r==='object'&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&!r.exploration?.samongR115;
const ringZone=r=>on&&!!K&&story(r)&&!!String(r.id||'')&&!KAIRO.has(String(r.id));
const VOID=0x08070b,LIFT=.03;
const rects=b=>K?K.ring(b):[];
function zoneOf(frame){const L=frame?.exploration;if(frame?.id!=null)return frame;try{if(typeof room==='object'&&room&&room.exploration===L)return room;}catch(_){}return null;}
// 뚜껑(R100)이 있는 야외 장면이면 뚜껑을 다른 오버레이가 숨겼어도(layers 0) 맵 밖 땅 판은 보인다 → 뚜껑 보임 여부는 묻지 않는다.
// R204 바위 판이 보이면(유기 지형 지역) 이 지역은 R204 가 맵 밖까지 그린다 → 덮지 않는다.
const r204On=R=>{const p=R.spatialRoot?.getObjectByName?.('r204-plateau');return !!(p&&p.visible&&p.layers?.mask!==0);};
function voidMat(R){if(R.r1335VoidMat)return R.r1335VoidMat;const T=R.T,m=new T.MeshBasicMaterial({color:VOID,side:T.DoubleSide,depthTest:true,depthWrite:true,toneMapped:false});m.name='r1335-outer-void';R.spatialResources?.add?.(m);return R.r1335VoidMat=m;}
function syncRing(R,frame){const old=R.r1335Ring,cap=R.r100Cap,r=zoneOf(frame),L=frame?.exploration;
 if(!ringZone(r)||!L||!cap||!cap.visible||cap.parent!==R.spatialRoot||!R.spatialRoot||!R.T||r204On(R)){if(old&&old.visible){old.visible=false;stats.hidden++;}return;}
 if(old&&old.userData.layout===L&&old.parent===R.spatialRoot){old.visible=true;stats.reused++;return;}
 if(old){old.parent?.remove(old);old.geometry?.dispose?.();R.r1335Ring=null;}
 const rs=rects(L.bounds);if(!rs.length)return;const T=R.T,pos=[],idx=[];
 for(const q of rs){const i=pos.length/3;for(const[x,y]of[[q.x,q.y],[q.x+q.width,q.y],[q.x+q.width,q.y+q.depth],[q.x,q.y+q.depth]])pos.push(x,LIFT,y);idx.push(i,i+2,i+1,i,i+3,i+2);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new T.Mesh(g,voidMat(R));mesh.name='r1335-outer-void';mesh.layers.set(2);
 mesh.userData={presentationOnly:true,collisionChanged:false,r1335OuterVoid:true,layout:L};R.spatialRoot.add(mesh);R.r1335Ring=mesh;stats.rings++;}
const C=window.StoryPhase1?.ThreeRenderer?.prototype;
if(K&&C?.ensureHospitalRoofsR2){const base=C.ensureHospitalRoofsR2;C.ensureHospitalRoofsR2=function(frame){const out=base.call(this,frame);try{syncRing(this,frame);}catch(e){fail(e);}return out;};}
if(C?.clearScene){const base=C.clearScene;C.clearScene=function(...a){try{this.r1335Ring?.geometry?.dispose?.();}catch(_){}this.r1335Ring=null;this.r1335VoidMat=null;return base.apply(this,a);};}
window.__STORYWORLD_OUTDOOR_EDGES_R1335__=Object.freeze({revision:REV,VOID,ringZone,rects,inspect:()=>({revision:REV,on,linked:!!K,stats:{...stats},lastError})});
})();
