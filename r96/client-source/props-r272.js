// R272 조형물 규칙(사용자 2026-11-03 "기념비와 계단은 실제로 쓰이거나 의미 있는 곳에만 — 장식으로 겹친 것은 빼라. 충돌·진행은 그대로").
//  조사(포터블 데이터 488개 지역 조형물): 빈 기념비(blank_memorial, key 'memorial')가 13개 지역 23곳에 '지역 장면 소품' 대체물로 놓였다
//   (예: ep1a09 의 원래 소품은 labelled-vial-cabinet). 정본 서사 어느 지역에도 기념비·추모비 사건이 없다 → 모두 뺀다.
//  무너진 계단(collapsed_stairs, key 'stairs')은 8개 지역 16곳 — R189 가 벽에 붙였지만 대부분 지도 이동 지점과 상관없는 장식이다.
//   → 실제 이동 지점(서사 포탈 R72 next/previous·지역 출구 exitPoint) 3.5칸 안의 계단만 남기고 나머지는 뺀다.
//  둘 다 solid:false 라 충돌·길찾기·진행에 영향이 없다. 석상(archive)·시간 오벨리스크(kairo 시간 주제)는 그대로 둔다.
//  끄기: localStorage['storyworld.r272.props']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_R272__)return;
const REV='R272-props-1',KEY='storyworld.r272.props',NEAR=3.5;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={rooms:0,memorials:0,stairsDropped:0,stairsKept:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const isMemorial=p=>/(^|\/)blank_memorial\.webp$/.test(String(p?.path||''))||p?.key==='memorial';
const isStairs=p=>/(^|\/)collapsed_stairs\.webp$/.test(String(p?.path||''))||p?.key==='stairs';
// 순수(QA): 남길지
function keep(p,points){if(isMemorial(p))return false;if(isStairs(p))return points.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=NEAR);return true;}
function transitionPoints(r){const out=[];try{const P=window.__STORYWORLD_ROUTES_R72__?.points?.(r);for(const k of ['next','previous'])if(P?.[k]&&Number.isFinite(P[k].x+P[k].y))out.push(P[k]);}catch(_){}
 try{for(const d of Object.keys(regionById?.[r.id]?.exits||{})){const q=exitPoint(d);if(q&&q.x>0&&q.y>0)out.push(q);}}catch(_){}return out;}
function apply(r){if(!on||!r||!Array.isArray(r.props)||r.__r272props)return;try{const pts=transitionPoints(r);const before=r.props.length;let mem=0,sd=0,sk=0;
 r.props=r.props.filter(p=>{const k=keep(p,pts);if(isMemorial(p))mem++;else if(isStairs(p)){if(k)sk++;else sd++;}return k;});
 r.__r272props=true;stats.rooms++;stats.memorials+=mem;stats.stairsDropped+=sd;stats.stairsKept+=sk;last={zone:r.id,before,after:r.props.length,memorials:mem,stairsDropped:sd,stairsKept:sk,points:pts.length};}catch(e){fail(e);}}
try{const base=getRoom;getRoom=function(...a){const r=base.apply(this,a);try{if(r&&r.id===zone)setTimeout(()=>apply(r),0);}catch(_){}return r;};}catch(e){fail(e);}
setInterval(()=>{try{if(typeof room!=='undefined'&&room&&!loading)apply(room);}catch(e){fail(e);}},300);
window.__STORYWORLD_PROPS_R272__=Object.freeze({revision:REV,keep,inspect:()=>({revision:REV,on,stats:{...stats},last,lastError,browserVerified:false,GPUVerified:false})});
})();
