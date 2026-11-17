// R713 첫 맵(마수궁 피난 거점 hub) 돌담 윗면 두껍게 — 사용자 2026-11-11 06:03Z "첫맵에서 돌담벼락 위쪽에 있는거 너무얇아서 어색한느낌".
//  원인(실측): 피난 거점(R82 refugeLayoutR82)의 바깥 둘레 벽 36개·안쪽 칸막이 8개가 모두 두께 0.24 칸(높이 2.85)이라, 등각 카메라에서 윗면이 실처럼 가늘어
//   벽이 '종잇장'처럼 서 있다. 같은 두께가 병동 틀·다른 지역에도 쓰이므로 엔진 표는 건드리지 않고, 첫 맵 지도 자료(room.exploration)만 이 오버레이가 손본다.
//  고침(그림과 충돌이 같은 벽 자료를 쓰므로 자료를 한 번만 바꾼다):
//   · 바깥 둘레 벽: 두께 0.24 → 0.64. 바닥 쪽 면(안쪽 면)은 옛 줄(칸 줄 ±0.12) 그대로 두고 바닥 밖(바깥)으로만 두꺼워진다 → 걸을 수 있는 자리·길찾기 그대로.
//   · 안쪽 칸막이: 두께 0.24 → 0.48(가운데 기준 양쪽으로 0.12씩).
//   · 벽 끝이 다른 벽에 닿는 모서리(ㄱ·ㅏ 자)는 끝을 닿은 벽의 바깥 면까지 늘려 모서리가 파이지 않게 한다. 열린 끝(문 자리·틈)은 그대로라 통로 폭 불변.
//  몹·전투 수치·문·길잡이 마디·저장은 그대로. 다른 지역은 건드리지 않는다.
//  끄기: localStorage['storyworld.r713.walls']='{"on":false}' (다음 지도 짓기부터)
(()=>{'use strict';
if(window.__STORYWORLD_REFUGE_WALLS_R713__)return;
const REV='R713-walls-1',KEY='storyworld.r713.walls',OUTER=.64,INNER=.48,OLD=.24,EDGE=OLD/2;
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={rooms:0,outer:0,inner:0,extended:0,staleGeometry:0,errors:0};let lastError=null;const done=new WeakSet();
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const near=(a,b,t=.13)=>Math.abs(a-b)<t;
function dress(L){
 if(!prefs.on||!L||!L.refugeR82||!Array.isArray(L.walls)||done.has(L))return false;done.add(L);
 const floor=new Set((L.floorCells||[]).map(c=>c[0]+':'+c[1])),has=(x,y)=>floor.has(Math.floor(x)+':'+Math.floor(y));
 const ws=L.walls.filter(w=>w&&w.refugeR82&&Number.isFinite(w.x+w.y+w.width+w.depth)&&Math.abs((w.width>w.depth?w.depth:w.width)-OLD)<1e-6);
 if(!ws.length)return false;
 // 1) 두께: 가로 벽(width>depth)은 depth, 세로 벽은 width 가 얇은 쪽.
 const band=new Map();
 for(const w of ws){const horiz=w.width>w.depth,c0=horiz?w.y:w.x,mid=horiz?w.x:w.y,line=Math.round(c0);let lo=c0-EDGE,hi=c0+EDGE;
  if(!w.partition){// 바닥이 어느 쪽인가: 줄 바로 앞(-1)·뒤(0) 칸. 한쪽만 바닥이면 그 쪽 면을 두고 반대로 자란다.
   const a=horiz?has(mid,line-1):has(line-1,mid),b=horiz?has(mid,line):has(line,mid);
   if(a&&!b){lo=c0-EDGE;hi=lo+OUTER;}else if(b&&!a){hi=c0+EDGE;lo=hi-OUTER;}else{lo=c0-OUTER/2;hi=c0+OUTER/2;}}
  else{lo=c0-INNER/2;hi=c0+INNER/2;}
  band.set(w,{horiz,lo,hi,c0});}
 // 2) 끝 늘리기: 이 벽의 끝이 수직으로 닿는 다른 벽(줄이 끝점 ±.13, 구간이 이 벽 줄을 덮음)이 있으면 그 벽의 바깥 면까지.
 for(const w of ws){const A=band.get(w),mid=A.horiz?w.x:w.y,len=A.horiz?w.width:w.depth;let s=mid-len/2,e=mid+len/2;
  for(const o of ws){if(o===w)continue;const B=band.get(o);if(B.horiz===A.horiz)continue;const oc=B.horiz?o.y:o.x,om=B.horiz?o.x:o.y,ol=B.horiz?o.width:o.depth;
   if(A.c0<om-ol/2-.13||A.c0>om+ol/2+.13)continue;// 이 벽의 줄(A.c0)이 o 의 구간 안에 있어야 한다
   if(near(oc,mid-len/2))s=Math.min(s,B.lo);else if(near(oc,mid+len/2))e=Math.max(e,B.hi);}
  if(s!==mid-len/2||e!==mid+len/2)stats.extended++;
  const nm=(s+e)/2,nl=e-s,nc=(A.lo+A.hi)/2,nt=A.hi-A.lo;
  if(A.horiz){w.x=nm;w.width=nl;w.y=nc;w.depth=nt;}else{w.y=nm;w.depth=nl;w.x=nc;w.width=nt;}
  if(w.partition)stats.inner++;else stats.outer++;}
 stats.rooms++;dropStale(ws);return true;}
// 이미 만들어진 3D 벽 모양(엔진 idleGeometry 'wall:id')이 옛 두께면 버려서 새로 짓게 한다.
function dropStale(ws){try{const t=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!t?.idleGeometry)return;
 for(const w of ws){const key='wall:'+w.id,g=t.idleGeometry.get(key);if(!g)continue;t.idleGeometry.delete(key);try{g.dispose?.();}catch(_){}stats.staleGeometry++;}}catch(e){fail(e);}}
const live=()=>{try{return typeof room==='object'&&room?room.exploration:null;}catch(_){return null;}};
const sweep=()=>{try{if(typeof world==='object'&&world)for(const r of Object.values(world))dress(r?.exploration);dress(live());}catch(e){fail(e);}};
if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){const r=base.apply(this,a);try{dress(r?.exploration);}catch(e){fail(e);}return r;};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const out=await base.apply(this,a);try{if(out!==false)sweep();}catch(e){fail(e);}return out;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(...a){const out=await base.apply(this,a);try{if(out!==false)sweep();}catch(e){fail(e);}return out;};}
window.__STORYWORLD_REFUGE_WALLS_R713__=Object.freeze({revision:REV,constants:Object.freeze({OUTER,INNER,OLD}),dress,sweep,
 prefs:()=>({...prefs}),inspect:()=>({revision:REV,on:prefs.on,stats:{...stats},lastError,thickness:{outer:OUTER,inner:INNER}})});
sweep();
})();
