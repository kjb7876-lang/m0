// R1301 아르벨리아(kair02) 길잡이 '길 없음' 재탐색 멈칫(사용자 2026-11-21 "아르벨리아 유예의 수문장 맵으로 들어가니 렉이 심해지는건지
//  게임플레이를 오래할수록 렉이 심해지는건지 조사해서 개선").
//  측정(헤드리스, main fff42be, 777 → kair02 길잡이 켬, 30초): 영웅 자리에서 떠나는 '길 없음' findPath 20번이 1.7~2.3초.
//   한 장면에 목표 4곳(닫힌 보스방 제단 15,13 · 문턱 20,19.1 · 5,5.1 · 5,6.9)을 연달아 물어 약 0.8초 멈춤이 4~5초마다 났다.
//   kair04 는 같은 30초에 0.2초, 길잡이를 끄면 kair02 도 1.4ms. 여러 맵을 거쳐 와도(8.5분) 프레임 JS 시간·타이머·리스너는 늘지 않았다.
//  원인: R979 는 '길 없음'을 6초 기억하지만, 지난번 물은 자리에서 12칸 넘게 떨어지면(순간이동으로 보고) 버린다. 싸우는 동안은 묻지 않다가
//   그 사이 긴 회랑(kair02 세로 100칸 넘음)을 걸어 12칸을 넘기면 버려져 다시 미로 전체를 뒤졌다(R979 moved 4/stored 8).
//  고침: 영웅 위치를 매 프레임 보고 '한 프레임에 2.5칸 넘게 뛰었는가(순간이동)·방이 바뀌었는가'만 세대로 센다.
//   걸어서는 벽·닫힌 문을 못 넘으므로 같은 세대 안의 '길 없음'은 그대로다 → 열쇠(방 · 도착 칸 0.5 · 반지름 · R74 문 세대 · R78 단계 ·
//   병원 단계 · room.engaged · 탐색 레이아웃 객체 · 순간이동 세대)로 게임 시간 20초 기억한다(R360 병원과 같은 길이).
//   길이 있는 결과·몹 길 찾기·막힌 칸에서 떠난 결과는 기억하지 않는다(R979 와 같은 조건). 판정·충돌·진행·난이도·그림은 그대로.
//  끄기: localStorage['storyworld.r1301.perf']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R1301__)return;
const REV='R1301-perf-1',KEY='storyworld.r1301.perf',TTL=20000,JUMP=2.5;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={calls:0,held:0,stored:0,warps:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const memo=new WeakMap();// 방 → {layout,map}
let warp=0,last=null;// 순간이동 세대 · 지난 프레임 영웅 자리
const P=()=>{try{return typeof player!=='undefined'?player:null;}catch(_){return null;}};
const R=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
function sample(){try{const p=P(),r=R();if(!p||!Number.isFinite(p.x+p.y))return;
 if(!last||last.r!==r||Math.hypot(p.x-last.x,p.y-last.y)>JUMP){if(last){warp++;stats.warps++;}}
 last={x:p.x,y:p.y,r};}catch(e){fail(e);}}
function loop(){sample();try{requestAnimationFrame(loop);}catch(_){}}
try{if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);}catch(e){fail(e);}
function key(to,radius,gen,phase,engaged,w){return [Math.round(to.x*2),Math.round(to.y*2),Number(radius??.29).toFixed(2),gen,phase,engaged?1:0,w].join(':');}
function ctx(rr){let gen=0,phase='';try{gen=window.__STORYWORLD_WORLD_R74__?.generation?.()||0;}catch(_){}try{phase=String(window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(rr)?.phase||'');}catch(_){}try{phase+='/'+String(window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase||'');}catch(_){}return{gen,phase};}
// 게임 시간으로 잰다(멈춤·느린 기기에서도 같은 간격). 게임 시간이 없으면 실제 시간.
const now=()=>{try{if(typeof time==='number'&&Number.isFinite(time))return time*1000;}catch(_){}return performance.now();};
function heroFrom(from){const p=P();return !!p&&(from===p||Math.hypot(from.x-p.x,from.y-p.y)<.05);}
try{const base=findPath;findPath=function(from,to,r,radius){
 let rr=null,k=null,m=null;
 try{rr=r||R();
  if(on&&rr&&from&&to&&Number.isFinite(from.x+from.y+to.x+to.y)&&heroFrom(from)){stats.calls++;sample();const c=ctx(rr);k=key(to,radius,c.gen,c.phase,rr.engaged,warp);
   m=memo.get(rr);if(m&&m.layout!==(rr.exploration||null)){m=null;memo.delete(rr);}
   const t=m?m.map.get(k):undefined;if(t!==undefined){const n=now();if(n-t<TTL&&n>=t){stats.held++;return[];}m.map.delete(k);}}
  else k=null;}catch(e){fail(e);k=null;}
 const out=base.apply(this,arguments);
 try{if(k&&Array.isArray(out)&&!out.length&&typeof blocked==='function'){const rad=radius??.29;
   if(!blocked(from.x,from.y,rad,rr)&&!blocked(to.x,to.y,rad,rr)){if(!m){m={layout:rr.exploration||null,map:new Map()};memo.set(rr,m);}if(m.map.size>128)m.map.clear();m.map.set(k,now());stats.stored++;}}}catch(e){fail(e);}
 return out;};}catch(e){fail(e);}
window.__STORYWORLD_PERF_R1301__=Object.freeze({revision:REV,key,ttl:TTL,jump:JUMP,on:()=>on,
 set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,warp,stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
