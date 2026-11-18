// R280 봉인된 문 너머에 갇힌 필수 적 데려오기 — 사용자 2026-11-03 "계속실플레이검증개선".
//  증거(2회차 실플레이 kair01, 이지·길잡이): '집결한 생존 적과 중간보스 제압 · 1' 단계에서 마지막 중간보스(최초명령 훈련파동 1)가
//   보스 구역 안(7.99,4.83)에 있었고 영웅은 보스방 문(door-0, 20,20) 앞(20.5,20.5)에 멈췄다. 보스방 문은 집결 적을 다 잡아야 열리므로
//   그 적은 영웅이 갈 수 없고(findPath 0칸) 스스로 나오지도 않는다 → 손으로 해도 진행 불가(교착). 하네스가 적을 강제로 지워서야 넘어갔다.
//   1회차 사몽 S06-4·S06-22 의 '닿을 수 없는 적' 멈춤도 같은 모양.
//  · 게임이 지금 잡으라고 가리키는 적(R75 currentGoal kind 'enemy')까지 영웅에게서 길이 없는 상태가 2초 간격 3번(약 6초) 이어지면,
//    그 적을 영웅 둘레 2.5~5칸의 막히지 않고 길이 닿는 자리로 블링크시킨다(R268 과 같은 어둠 수축 연출). 체력·공격·보상은 그대로(자리만).
//  · 고정형(탑·포탑)·소환 중·공격 중인 적, 창·장면·로딩 중, 영웅 사망 중에는 하지 않는다. 길 검사는 2초에 한 번, 한 마리만(실패 길찾기 비용 때문).
//  끄기: localStorage['storyworld.r280.stranded']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_STRANDED_R280__)return;
const REV='R280-stranded-1',KEY='storyworld.r280.stranded',EVERY=2,NEED=3,RAD=.35;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={checks:0,unreachable:0,rescued:0,noSpot:0,errors:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const fixed=e=>!!(e.stationary||e.r170Tower||e.turret||e.rooted||e.immobile);
const busy=e=>!!(e.attack||e.tell>0||e.windup>0||e.cast||e.casting||e.r268Dash||e.spawnState!=='active');
// 순수(QA): 이번 검사 결과로 갇힘 횟수를 갱신하고 데려올지 정한다
function judge(count,reachable){const c=reachable?0:count+1;return {count:c,rescue:c>=NEED};}
function pathLen(a,b){try{if(Math.hypot(a.x-b.x,a.y-b.y)<1.2)return 1;return findPath(a,b,room,.31)?.length||0;}catch(_){return 0;}}
function spot(){const p=player;for(const r of [3,4,2.5,5])for(let k=0;k<16;k++){const a=k/16*Math.PI*2+r,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
  try{if(blocked(x,y,RAD,room))continue;}catch(_){continue;}if(pathLen(p,{x,y})>0)return {x,y};}return null;}
function puff(x,y,o={}){try{const P=window.__STORYWORLD_PIXELFX_R163__;if(P?.has?.('pvfx-void-implosion'))P.play('pvfx-void-implosion',x,y,{k:o.k||.6,delay:o.delay||0,tint:{a:[40,10,30],b:[150,90,170]}});}catch(_){}}
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||typeof player!=='object'||!player||!(player.hp>0)||typeof room!=='object'||!room;}
let lastT=-1e9,watch=null;
function tick(){if(!on||paused())return;const now=T();if(now-lastT<EVERY&&now>=lastT)return;lastT=now;
 const g=window.__STORYWORLD_GUIDE_R75__?.currentGoal?.();const id=g&&g.kind==='enemy'?(g.id||g.point?.id):null;
 const e=id&&(room.enemies||[]).find(v=>v&&v.id===id&&v.hp>0);if(!e||fixed(e)){watch=null;return;}
 if(!watch||watch.id!==e.id||watch.room!==room)watch={id:e.id,room,count:0};
 stats.checks++;const reach=pathLen(player,e)>0;if(!reach)stats.unreachable++;
 const j=judge(watch.count,reach);watch.count=j.count;if(!j.rescue||busy(e))return;
 const s=spot();if(!s){stats.noSpot++;return;}
 const from=[+e.x.toFixed(2),+e.y.toFixed(2)];puff(e.x,e.y);e.x=s.x;e.y=s.y;for(const k of ['nav','path','route'])if(Array.isArray(e[k]))e[k]=[];e.moving=false;
 puff(s.x,s.y,{delay:.06});stats.rescued++;watch.count=0;last={zone:G('zone'),id:e.nativeId||e.id,from,to:[+s.x.toFixed(2),+s.y.toFixed(2)]};}
function loop(){try{tick();}catch(err){fail(err);}typeof requestAnimationFrame==='function'?requestAnimationFrame(loop):setTimeout(loop,100);}loop();
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_STRANDED_R280__=Object.freeze({revision:REV,set,judge,tick:()=>{lastT=-1e9;tick();},inspect:()=>({revision:REV,on,watch:watch&&{id:watch.id,count:watch.count},stats:{...stats},last,lastError})});
})();
