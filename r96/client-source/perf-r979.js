// R979 영웅 길잡이 '길 없음' 재탐색 끊김(사용자 2026-11-13 "렉개선 및 디버깅등은 수시로해주고").
//  측정(헤드리스, main 9ebd9de): ep1b01 에서 10.7초 동안 영웅 자리에서 떠나는 '길 없음' 길 찾기 6번이 423ms(한 번 최대 160ms),
//  앞선 측정에서 ep1a11 1,102ms/15초 · u206 912ms/20초. 부르는 곳은 R101 guideDoorStep·objectiveBlocked(닫힌 보스방 제단 쪽).
//  R272 가 '못 찾음'을 1.5초만 기억해 1.5초마다 미로 전체를 다시 뒤진다. R360 은 같은 문제를 ep1a08 에서만 20초 기억으로 고쳤다.
//  고침: 모든 지역에서, 영웅 자리에서 떠나고 출발·도착 칸이 막히지 않았는데(= 미로를 다 뒤진 진짜 '길 없음') 길이 없으면 게임 시간 6초 동안 기억한다.
//   열쇠 = 방 · 도착 칸(0.5) · 반지름 · R74 문 세대 · R78 단계 · 병원 단계 · room.engaged · 탐색 레이아웃 객체.
//   영웅이 지난번 물은 자리에서 한 번에 12칸 넘게 뛰면(순간이동) 버린다. 걷기는 R272 의 1.5초 간격 사이에 12칸을 못 가므로 기억이 유지된다
//   (처음엔 기억한 자리에서 8칸으로 했더니 집결 단계에서 달리는 영웅 때문에 실플레이에서 20번 중 11번이 버려졌다).
//   길이 있는 결과·몹 길 찾기(R74 예산 미룸이 빈 길을 돌려줌)·막힌 칸에서 떠난 결과는 기억하지 않는다.
//  판정·충돌·진행·난이도·그림은 그대로. 끄기: localStorage['storyworld.r979.perf']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R979__)return;
const REV='R979-perf-1',KEY='storyworld.r979.perf',TTL=6000,FAR=12;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={calls:0,held:0,stored:0,moved:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const memo=new WeakMap();// 방 → {layout,map}
function key(to,radius,gen,phase,engaged){return [Math.round(to.x*2),Math.round(to.y*2),Number(radius??.29).toFixed(2),gen,phase,engaged?1:0].join(':');}
function ctx(rr){let gen=0,phase='';try{gen=window.__STORYWORLD_WORLD_R74__?.generation?.()||0;}catch(_){}try{phase=String(window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(rr)?.phase||'');}catch(_){}try{phase+='/'+String(window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase||'');}catch(_){}return{gen,phase};}
// 게임 시간으로 잰다(멈춤·느린 기기에서도 같은 간격). 게임 시간이 없으면 실제 시간.
const now=()=>{try{if(typeof time==='number'&&Number.isFinite(time))return time*1000;}catch(_){}return performance.now();};
function heroFrom(from){try{const p=typeof player!=='undefined'?player:null;return !!p&&(from===p||Math.hypot(from.x-p.x,from.y-p.y)<.05);}catch(_){return false;}}
try{const base=findPath;findPath=function(from,to,r,radius){
 let rr=null,k=null,m=null;
 try{rr=r||(typeof room!=='undefined'?room:null);
  if(on&&rr&&from&&to&&Number.isFinite(from.x+from.y+to.x+to.y)&&heroFrom(from)){stats.calls++;const c=ctx(rr);k=key(to,radius,c.gen,c.phase,rr.engaged);
   m=memo.get(rr);if(m&&m.layout!==(rr.exploration||null)){m=null;memo.delete(rr);}
   const h=m&&m.map.get(k);
   if(h){if(Math.hypot(from.x-h.x,from.y-h.y)>FAR){m.map.delete(k);stats.moved++;}else if(now()-h.t<TTL&&now()>=h.t){h.x=from.x;h.y=from.y;stats.held++;return[];}}}
  else k=null;}catch(e){fail(e);k=null;}
 const out=base.apply(this,arguments);
 try{if(k&&Array.isArray(out)&&!out.length&&typeof blocked==='function'){const rad=radius??.29;
   if(!blocked(from.x,from.y,rad,rr)&&!blocked(to.x,to.y,rad,rr)){if(!m){m={layout:rr.exploration||null,map:new Map()};memo.set(rr,m);}if(m.map.size>128)m.map.clear();m.map.set(k,{t:now(),x:from.x,y:from.y});stats.stored++;}}}catch(e){fail(e);}
 return out;};}catch(e){fail(e);}
window.__STORYWORLD_PERF_R979__=Object.freeze({revision:REV,key,ttl:TTL,far:FAR,on:()=>on,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
