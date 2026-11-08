// R413 문 위 상인방 — 사용자 2026-11-08 "벽문 벽지붕등 높이랑위치도 잘맞춰줘".
//  실측(헤드리스, 64개 STORY 지역): R83 문틀(문설주·상인방 띠)은 높이 2.7 에 고정인데, 문 양 끝 벽(문설주 벽)은 R115 가
//  들어온 뒤 첫 틱에 2.85(문 너비 6·8칸 문) ~ 3.15~3.31(문 곁 2.6칸 안 벽)로 올린다 → 문틀 위가 벽 윗선보다 0.15~0.6 낮게 비어
//  문 위로 뒤쪽 바닥이 들여다보이고, 문이 벽에 박힌 것이 아니라 벽 사이 낮은 칸막이처럼 보였다.
//  → 문 앞면(R83 과 같은 면)에 문틀 윗선(2.7)부터 양쪽 문설주 벽 중 낮은 쪽 윗선까지 벽 그림 띠(상인방)를 R83 벽 띠와 같은 방법으로 붙인다.
//  그림만(충돌·문 열림·상호작용·길찾기 그대로). 병원 진료문(ep1a08, 벽 2.705)·R204 유기 지형(동굴·늪 바위 벽, 벽 상자 높이와 그림 높이가 다름)·
//  사몽(R83 꺼짐)은 그대로. 끄기: localStorage['storyworld.r413.doors']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_DOORS_FIT_R413__)return;
const REV='R413-doors-3',KEY='storyworld.r413.doors',DOOR_H=2.7,JAMB=.24,MIN_GAP=.04,MAX_TOP=4.2;
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
function lintel(p,r){const T=R83(),d=p?.r74Door;if(!T||!d||typeof T.geometry!=='function'||typeof T.point!=='function'||T.hospital?.(r,p))return false;
 const L=r.exploration;if(dark(r)){stats.skipped++;return false;}const top=jambTop(L,d);if(!(top>DOOR_H+MIN_GAP)||top>MAX_TOP){stats.skipped++;return false;}
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
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){const out=base.apply(this,[p,...a]);try{if(on&&p?.r74Door&&typeof room!=='undefined'&&R83()?.enabled?.(room,p))lintel(p,room);}catch(e){fail(e);}return out;};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_DOORS_FIT_R413__=Object.freeze({revision:REV,set,jambTop,wallSig,inspect:()=>({revision:REV,on,stats:{...stats},last,lastError})});
})();
