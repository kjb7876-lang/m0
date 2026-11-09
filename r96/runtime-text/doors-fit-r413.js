// R413 문 위 상인방 — 사용자 2026-11-08 "벽문 벽지붕등 높이랑위치도 잘맞춰줘".
//  실측(헤드리스, 64개 STORY 지역): R83 문틀(문설주·상인방 띠)은 높이 2.7 에 고정인데, 문 양 끝 벽(문설주 벽)은 R115 가
//  들어온 뒤 첫 틱에 2.85(문 너비 6·8칸 문) ~ 3.15~3.31(문 곁 2.6칸 안 벽)로 올린다 → 문틀 위가 벽 윗선보다 0.15~0.6 낮게 비어
//  문 위로 뒤쪽 바닥이 들여다보이고, 문이 벽에 박힌 것이 아니라 벽 사이 낮은 칸막이처럼 보였다.
//  → 문 앞면(R83 과 같은 면)에 문틀 윗선(2.7)부터 양쪽 문설주 벽 중 낮은 쪽 윗선까지 벽 그림 띠(상인방)를 R83 벽 띠와 같은 방법으로 붙인다.
//  그림만(충돌·문 열림·상호작용·길찾기 그대로). 병원 진료문(ep1a08, 벽 2.705)·R204 유기 지형(동굴·늪 바위 벽, 벽 상자 높이와 그림 높이가 다름)·
//  사몽(R83 꺼짐)은 그대로. 끄기: localStorage['storyworld.r413.doors']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_DOORS_FIT_R413__)return;
const REV='R446-doors-6',KEY='storyworld.r413.doors',JAMB=.24,MIN_GAP=.04,MAX_TOP=4.2;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={lintels:0,skipped:0,culled:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const R83=()=>window.__STORYWORLD_WORLD_DOORS_R83__,R74=()=>window.__STORYWORLD_WORLD_R74__;
// 벽 서명(개수·높이 합): R115 가 같은 벽 객체 높이를 그 자리에서 올리면 다시 잰다
function wallSig(L){const W=L?.walls;if(!Array.isArray(W))return '0';let s=0;for(const w of W)if(w&&Number.isFinite(w.height))s+=w.height;return W.length+':'+Math.round(s*100);}
// 문 칸 양 끝(문설주 바깥)에 닿는 벽 상자 높이 — 장식·가구 상자(.2 미만) 제외. 양쪽 중 낮은 쪽(한쪽만 있으면 그쪽).
function ends(d){const ax=d.axis==='x',half=(ax?d.depth:d.width)/2+JAMB/2;return ax?[[d.x,d.y-half],[d.x,d.y+half]]:[[d.x-half,d.y],[d.x+half,d.y]];}
function wallAt(L,x,y){let best=null;for(const w of L.walls||[]){if(!w||w.decorative||!Number.isFinite(w.height)||w.height<.2||!Number.isFinite(w.x+w.y+w.width+w.depth))continue;
  const dx=Math.max(0,Math.abs(x-w.x)-w.width/2),dy=Math.max(0,Math.abs(y-w.y)-w.depth/2),dd=Math.hypot(dx,dy);if(dd<.35&&(!best||dd<best.d))best={d:dd,h:w.height};}return best?best.h:null;}
const memo=new WeakMap();
function jambTop(L,d){if(!L||!d)return null;const sig=wallSig(L);let m=memo.get(L);if(!m||m.sig!==sig){m={sig,tops:new Map()};memo.set(L,m);}
 const k=d.id||[d.x,d.y,d.width,d.depth].join(':');if(m.tops.has(k))return m.tops.get(k);const hs=ends(d).map(([x,y])=>wallAt(L,x,y)).filter(Number.isFinite);
 const t=hs.length?Math.min(...hs):null;m.tops.set(k,t);return t;}
// R204 유기 지형: 넓힌 배치(r204Widened)는 들어온 첫 프레임부터 안다 — R204 3D 상태(__r204)는 몇 프레임 뒤에 생기므로 그 전에 띠가 한 번 그려지지 않게.
const dark=r=>{try{if(r.exploration?.r204Widened)return true;const st=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.__r204;return !!(st&&st.zone===r.id&&!st.decorOnly&&!st.failed);}catch(_){return false;}};
function onScreen(ps){return Math.max(...ps.map(p=>p.x))>=-16&&Math.min(...ps.map(p=>p.x))<=W+16&&Math.max(...ps.map(p=>p.y))>=-16&&Math.min(...ps.map(p=>p.y))<=H+16;}
// R83 벽 띠와 같은 붙이기: 벽 그림을 띠 비율대로 잘라(R347 cropRect) 네 꼭짓점에 맞춘다
function patch(image,rect0,ps,key){const T=R83(),rect=typeof T?.cropRect==='function'?T.cropRect(rect0,ps,key):rect0,[sx,sy,sw,sh]=rect,[a,b,,d]=ps;ctx.save();try{ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);}finally{ctx.restore();}}
function lintel(p,r){const T=R83(),d=p?.r74Door,DOOR_H=Number(T?.doorHeight?.())||2.7;if(!T||!d||typeof T.geometry!=='function'||typeof T.point!=='function'||T.hospital?.(r,p))return false;
 const L=r.exploration;if(dark(r)){stats.skipped++;return false;}const top=jambTop(L,d);if(!(top>DOOR_H+MIN_GAP)||top>MAX_TOP){stats.skipped++;return false;}
 if(lintel3d(r,L,d,top,DOOR_H))return true;
 const open=!!R74()?.isOpen?.(r,d),metal=/forge|machine|clock|vault|chapel|cathedral/.test(L.worldR74?.style||''),g=T.geometry(d,open,false,metal),width=g.width,fo=g.faceOffset;
 const along=u=>d.axis==='x'?{x:d.x+fo,y:d.y+u}:{x:d.x+u,y:d.y+fo},a=along(-width/2-JAMB),b=along(width/2+JAMB);
 const ps=[T.point(a,top),T.point(b,top),T.point(b,DOOR_H),T.point(a,DOOR_H)];if(!onScreen(ps)){stats.culled++;return false;}
 const art=L.surface?.art,wall=art?.path&&typeof readyImage==='function'?readyImage(art.path)?.image:null;
 if(!wall||!Array.isArray(art.wallRect)){stats.skipped++;return false;}// 벽 그림이 아직 없으면 띠를 그리지 않는다(평평한 회색 판으로 뜨지 않게, 심사 지적)
 const owner={id:'r83-ward-door:'+p.id+':r413-lintel',kind:'prop',x:(a.x+b.x)/2,y:(a.y+b.y)/2,alive:true,bodyPath:art?.path,r83WardDoor:true,doorFaceOffsetR86:fo,doorId:d.id,doorOpen:open,r83DoorPart:'r413-lintel',
  r83DoorPlane:{ax:a.x,ay:a.y,bx:b.x,by:b.y},r83WallTint:art?.r81Palette?.wall,groundAligned:false,r413Lintel:true};
 const paint=()=>{ctx.save();try{patch(wall,art.wallRect,ps,'r413-lintel');}finally{ctx.restore();}};
 ctx.save();try{const m=ctx.getTransform();ctx.setTransform(m.a,m.b,m.c,m.d,0,0);if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();}finally{ctx.restore();}
 stats.lintels++;last={room:r.id,door:d.id,top,gap:+(top-DOOR_H).toFixed(3),width:+width.toFixed(2)};return true;}
// R446(사용자 2026-11-09 "문위에 벽이조금 감싸는 형태로 해서 벽을뚫고 문을 만든느낌나게 문이랑 벽이랑 이어진느낌"): 문 위 상인방을 그림 띠 대신
//  옆 문설주 벽 3D 메시를 그대로 복제(같은 재질·두께·윗면)해 문 폭만큼 줄이고 문틀 위(2.4)~벽 윗선 높이로 눌러 문 위에 얹는다 → 벽이 문 위를 감싸
//  벽을 뚫고 낸 문처럼 이어진다. 옆 벽 메시가 아직 없으면(청크 미적재) 예전 그림 띠로 그린다. 그림만(충돌·문 열림·길찾기 그대로).
const L3=new Map();let L3room=null;stats.lintels3d=0;
function wallRowAt(t,L,x,y,spanX){let best=null;for(const w of L.walls||[]){if(!w||w.decorative||!Number.isFinite(w.height)||w.height<.2||!Number.isFinite(w.x+w.y+w.width+w.depth))continue;if(spanX?!(w.width>w.depth):!(w.depth>w.width))continue;/* 문과 나란한 벽만(직각으로 붙은 벽을 늘리면 가로지르는 막대가 된다) */
  const dx=Math.max(0,Math.abs(x-w.x)-w.width/2),dy=Math.max(0,Math.abs(y-w.y)-w.depth/2),dd=Math.hypot(dx,dy);if(dd<.35&&(!best||dd<best.d)){const row=t.wallRows?.get?.(w.id);if(row?.mesh?.geometry)best={d:dd,w,mesh:row.mesh};}}return best;}
function clear3d(t){for(const m of L3.values()){try{m.parent?.remove(m);m.geometry?.dispose?.();}catch(_){}}L3.clear();}
function lintel3d(r,L,d,top,DH){try{const t=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!t?.spatialRoot||!t.wallRows||!t.T)return false;
 if(L3room!==L){clear3d(t);L3room=L;}const key=d.id||[d.x,d.y].join(':');const have=L3.get(key);
 const hs=have?.userData?.r446Src;if(have&&have.userData.r446Top===top&&have.parent===t.spatialRoot&&hs&&t.wallRows.get?.(have.userData.r446SrcId)?.mesh===hs){/* R446: 원본 문설주 벽이 다시 만들어지거나 가림 재질이 바뀌면 그대로 따라간다 */if(have.material!==hs.material)have.material=hs.material;have.visible=true;return true;}if(have){have.parent?.remove(have);have.geometry?.dispose?.();L3.delete(key);}
 const spanX=d.axis!=='x',jam=ends(d).map(([x,y])=>wallRowAt(t,L,x,y,spanX)).filter(Boolean);if(!jam.length)return false;const src=jam.sort((a,b)=>a.w.height-b.w.height)[0],m0=src.mesh,g0=m0.geometry;
 if(!g0.boundingBox)g0.computeBoundingBox();const bb=g0.boundingBox,sx=bb.max.x-bb.min.x,sz=bb.max.z-bb.min.z,sy=bb.max.y-bb.min.y;if(!(sy>.2))return false;
 const span=(d.axis==='x'?d.depth:d.width)+.04,hgt=top-DH;if(!(hgt>.04))return false;const alongX=sx>=sz;if(Math.abs(m0.rotation.y)>.01&&Math.abs(Math.abs(m0.rotation.y)-Math.PI)>.01)return false;if(alongX!==spanX)return false;
 const g=g0.clone();g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,-(bb.min.z+bb.max.z)/2);g.scale(alongX?span/sx:1,hgt/sy,alongX?1:span/sz);g.computeBoundingBox();g.computeBoundingSphere();
 const m=new t.T.Mesh(g,m0.material);m.position.set(d.x,DH+hgt/2,d.y);m.rotation.copy(m0.rotation);m.layers.mask=m0.layers.mask;m.renderOrder=m0.renderOrder;m.name='r446-lintel:'+key;m.userData={r446Top:top,r446Src:m0,r446SrcId:src.w.id,presentationOnly:true};
 t.spatialRoot.add(m);L3.set(key,m);stats.lintels3d++;return true;}catch(e){fail(e);return false;}}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){const out=base.apply(this,[p,...a]);try{if(L3.size&&typeof room!=='undefined'&&room?.exploration!==L3room){clear3d();L3room=room?.exploration||null;}if(on&&p?.r74Door&&typeof room!=='undefined'&&R83()?.enabled?.(room,p))lintel(p,room);}catch(e){fail(e);}return out;};}
function set(v){on=v!==false;if(!on){try{clear3d();L3room=null;}catch(_){}}try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_DOORS_FIT_R413__=Object.freeze({revision:REV,set,jambTop,wallSig,inspect:()=>({revision:REV,on,stats:{...stats},lintels3d:L3.size,last,lastError})});
})();
