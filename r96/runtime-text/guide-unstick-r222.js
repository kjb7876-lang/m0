// R222 길잡이 멈춤 풀기 — 사용자 2026-11-02 "실플레이해서 총개선", "길잡이가 못지나가서 걸리지 않게".
// 처음부터 미카엘라 엔딩까지 길잡이 실플레이(헤드리스)에서 본 멈춤 두 가지:
//  A) dist01 (19.5,58.1): 길(route) 168점이 있는데 제자리. 재현하면 다음 길점(13.88,55.5)이 영웅 반지름(.27)으로는 막혀 있었다.
//     길찾기는 칸 중심을 반지름 .29 로만 묻고(CLAUDE.md 학습 메모), 매끄럽게 편 길점은 벽 끝에 걸칠 수 있다.
//  B) dist00 앞방(52,61.9): 20분 넘게 제자리, 가까운 적 0, 앞방 문(door-1)이 닫힘.
// 고친 것(길잡이 켜짐일 때만, 손으로 움직일 때는 그대로):
//  1) 0.6초(게임 시간) 넘게 0.05칸도 못 움직였고 길이 있으면: 영웅 반지름에서 막힌 앞쪽 길점을 건너뛴다.
//  2) 1.5초: 다음 길점 쪽으로 옆걸음(왼·오른쪽 직각 0.3칸, 막히지 않은 쪽).
//  3) 3초: 길을 비워 다시 찾게 한다.
//  4) 3초: 손 닿는 닫힌 문이 있으면 연다(문은 원래 E 로 여는 것).
//  5) 6초: 마지막 수단으로 길 앞쪽 2칸 안의 막히지 않은 길점으로 옮긴다(짧은 순간이동, stats.hops 로 센다).
// 길잡이의 E 는 열린 문을 닫지 않는다(그 순간만 열린 문을 손 닿는 거리 밖으로 뺀다).
// 끄기: localStorage['storyworld.r222.guideUnstick']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_UNSTICK_R222__)return;
const REV='R222-guide-unstick-1',KEY='storyworld.r222.guideUnstick',RAD=.27;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={stalls:0,skipped:0,sidesteps:0,replans:0,doors:0,hops:0,closeSkipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const W=()=>window.__STORYWORLD_WORLD_R74__;
const guiding=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
const doorsHere=()=>{try{return room?.exploration?.hospitalDoorsB3||room?.exploration?.worldR74?.doors||[];}catch(_){return [];}};
const blk=(x,y)=>{try{return blocked(x,y,RAD);}catch(_){return true;}};
if(typeof interact==='function'){const base=interact;interact=function(...a){
 if(!on||!guiding())return base.apply(this,a);
 const w=W(),hidden=[];
 try{if(w&&typeof room==='object'&&room)for(const d of doorsHere())if(w.isOpen(room,d)&&typeof d.reach==='number'&&Math.hypot(player.x-d.x,player.y-d.y)<=d.reach){hidden.push([d,d.reach]);d.reach=-1;}}catch(e){fail(e);}
 if(hidden.length)stats.closeSkipped++;
 // 사몽 구역 입구의 '이전 구역' 표지(samongR103:'back')는 길잡이 E 로 고르지 않는다 — 도착 직후 단서를 줍다 앞 구역으로 되돌아가던 일(사몽 실플레이 S01-3→S01-2→S01-3).
 let backs=null;try{if(Array.isArray(room?.props)&&room.props.some(q=>q&&q.samongR103==='back')){backs=room.props.filter(q=>q&&q.samongR103==='back');room.props=room.props.filter(q=>!(q&&q.samongR103==='back'));stats.backSkipped=(stats.backSkipped||0)+1;}}catch(e){fail(e);}
 try{return base.apply(this,a);}finally{for(const [d,r] of hidden)d.reach=r;if(backs)try{room.props.push(...backs.filter(q=>!room.props.includes(q)));}catch(e){fail(e);}}};}
let anchor=null,stage=0;
// 제자리에서 싸우는 중(3칸 안에 살아 있는 적)이면 건드리지 않는다. room.engaged 는 '집결한 생존 적' 같은 필드 전투 내내 켜져 있어 기준으로 쓰지 않는다(dist01 실측).
const fighting=()=>{try{return (room.enemies||[]).some(e=>e&&e.hp>0&&e.spawnState!=='hidden'&&Math.hypot(e.x-player.x,e.y-player.y)<3);}catch(_){return false;}};
function openNearDoor(){const w=W();if(!w)return false;
 const near=doorsHere().filter(d=>!w.isOpen(room,d)).map(d=>({d,dist:Math.hypot(player.x-d.x,player.y-d.y)})).filter(o=>o.dist<=(o.d.reach||3)).sort((a,b)=>a.dist-b.dist);
 for(const {d} of near){const tg={kind:'door',id:d.id};if(w.canUse(tg)&&w.use(tg)){stats.doors++;return true;}}return false;}
function watch(){
 if(!on||!guiding()||typeof player!=='object'||!player||player.hp<=0||typeof room!=='object'||!room||fighting())return void(anchor=null);
 const t=typeof time==='number'?time:0;
 if(!anchor||anchor.zone!==room.id||Math.hypot(player.x-anchor.x,player.y-anchor.y)>.05){anchor={x:player.x,y:player.y,t,zone:room.id};stage=0;return;}
 const still=t-anchor.t,R=Array.isArray(route)?route:null;
 if(still>=.6&&stage<1){stage=1;stats.stalls++;
  if(R&&R.length>1){let n=0;while(R.length>1&&blk(R[0].x,R[0].y)&&n<6){R.shift();n++;}stats.skipped+=n;}}
 if(still>=1.5&&stage<2){stage=2;const q=R&&R[0];if(q){const dx=q.x-player.x,dy=q.y-player.y,l=Math.hypot(dx,dy)||1;
   for(const s of [1,-1]){const nx=player.x-dy/l*.3*s,ny=player.y+dx/l*.3*s;if(!blk(nx,ny)){player.x=nx;player.y=ny;stats.sidesteps++;break;}}}}
 if(still>=3&&stage<3){stage=3;if(!openNearDoor()&&R&&R.length){route=[];stats.replans++;}}
 if(still>=6&&stage<4){stage=4;const R2=Array.isArray(route)?route:[];
  const cand=R2.slice(0,12).find(q=>Math.hypot(q.x-player.x,q.y-player.y)<=2&&Math.hypot(q.x-player.x,q.y-player.y)>.4&&!blk(q.x,q.y));
  if(cand){player.x=cand.x;player.y=cand.y;stats.hops++;anchor=null;}}
}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(!modal&&!loading)watch();}catch(e){fail(e);}return r;};}
window.__STORYWORLD_GUIDE_UNSTICK_R222__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
