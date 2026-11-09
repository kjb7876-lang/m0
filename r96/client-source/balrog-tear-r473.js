/* R473 발록의 검이 공간을 가르고, 불덩이가 쏟아진다 (2026-11-09 야간, 서사 디테일 전투 R450 개선안 표 dist06 줄).
 * 정본: "발록의 검이 공간을 가르고, 불덩이가 하늘을 뒤덮었다."
 * 지금까지 발록의 R241 운석 6개는 영웅 자리 하나 + 둘레에 흩어져 떨어져 '휘두름 → 운석'이 이어져 보이지 않았다.
 * R473 은 발록(dist06 dist06-boss)의 운석이 생기는 그 틱에 자리만 옮겨, 발록에서 영웅을 지나 그 너머까지 검이 가른 한 줄로 늘어세운다.
 * R241 이 이미 떨어지는 차례(k)마다 0.12초씩 어긋나 있으므로 발록 쪽부터 영웅 쪽으로 불덩이가 차례로 쏟아진다.
 * - 운석 수·예고 시간·피해·반지름은 그대로(R241 값). 자리만 바꾼다. 한 개는 늘 영웅 둘레 1.25칸 안(이전과 같은 위협).
 * - 막힌 칸에 걸리는 자리는 원래 자리 그대로 둔다. 이미 예고가 0.3초 넘게 지난 운석은 건드리지 않는다.
 * - 옆으로 비켜서면 피할 수 있는 줄 패턴(흩뿌림보다 읽기 쉬움).
 * 끄기: localStorage['storyworld.r473.tear']='{"on":false}'
 */
(()=>{'use strict';
const REV='R473',KEY='storyworld.r473.tear',ZONE='dist06',BOSS='dist06-boss';
const START=1.4,PAST=2.2,STEP_MIN=1.3,STEP_MAX=2.2,JITTER=.22,FRESH=.3;
const stats={casts:0,moved:0,keptBlocked:0,errors:0,lastError:null};
function on(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return !(v&&v.on===false);}catch(_){return true;}}
function isBlocked(x,y){try{return typeof blocked==='function'&&!!blocked(x,y);}catch(_){return false;}}
function scan(){
 if(typeof hazards==='undefined'||!Array.isArray(hazards)||typeof room==='undefined'||!room||room.id!==ZONE)return;
 const fresh=hazards.filter(h=>h&&h.r241Meteor&&!h.r473Tear&&!(Number(h.age)>FRESH));if(!fresh.length)return;
 const groups=new Map();for(const h of fresh){const k=h.owner+'|'+h.r241Meteor.cast;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(h);}
 const live=on();
 for(const list of groups.values()){
  const e=(room.enemies||[]).find(x=>x&&x.id===list[0].owner);
  if(!live||!e||e.nativeId!==BOSS||e.r61Clone||typeof player==='undefined'||!player){for(const h of list)h.r473Tear='skip';continue;}
  list.sort((a,b)=>(a.r241Meteor.k||0)-(b.r241Meteor.k||0));
  const dx=player.x-e.x,dy=player.y-e.y,D=Math.hypot(dx,dy)||1,ux=dx/D,uy=dy/D,n=list.length;
  const s0=Math.max(START,D+PAST-(n-1)*STEP_MAX),step=n>1?Math.min(STEP_MAX,Math.max(STEP_MIN,(D+PAST-s0)/(n-1))):0;
  list.forEach((h,i)=>{const a=s0+step*i,side=(i%2?1:-1)*JITTER*(i===0?0:1),x=e.x+ux*a-uy*side,y=e.y+uy*a+ux*side;
   if(isBlocked(x,y)){stats.keptBlocked++;h.r473Tear='kept';return;}
   h.x=x;h.y=y;h.r473Tear='line';stats.moved++;});
  stats.casts++;}
}
// R241 은 불러온 뒤 setTimeout 으로 tick 을 감싼다(바깥 감싸기). 그보다 바깥에서 돌아야 같은 틱에 생긴 운석을 그리기 전에 옮길 수 있으므로
// R241 이 생긴 뒤 1.2초쯤 기다렸다가 감싼다. 혹시 순서가 어긋나도 틱 앞뒤로 한 번씩 훑어 다음 틱 전에는 옮긴다.
let installed=false;
function install(){if(installed||typeof tick!=='function')return;installed=true;const base=tick;tick=function(...a){
 const go=()=>{try{if(typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading))scan();}catch(err){stats.errors++;stats.lastError=String(err&&err.message||err);}};
 go();const r=base.apply(this,a);go();return r;};}
if(typeof setTimeout!=='function')install();
else{let tries=0,seen=0;(function arm(){if(installed)return;tries++;if(window.__STORYWORLD_BOSS_METEOR_R241__)seen++;if(seen>=4||tries>=40){install();return;}setTimeout(arm,300);})();}
window.__STORYWORLD_BALROG_TEAR_R473__=Object.freeze({revision:REV,scan,inspect:()=>({revision:REV,on:on(),installed,constants:{START,PAST,STEP_MIN,STEP_MAX,JITTER,FRESH},stats:{...stats}})});
})();
