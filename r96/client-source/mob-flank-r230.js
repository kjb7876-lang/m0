// R230 몹 공격 방향 어색함 줄이기 — 사용자 2026-11-02 "모든 몹들 모션과 방향성 개선 방향성개선에 한계가있다면 가장자연스러운 위치로 블링크,돌진스킬사용한다음 공격하여 공격어색함 줄이기".
// 몹 그림은 대부분 옆모습 한 장(좌우 뒤집기)이라, 영웅이 화면에서 몹의 바로 위·아래에 있을 때 근접 공격을 하면 옆을 보고 허공을 치는 것처럼 보였다
//  (facing() 은 화면 가로 차이가 세로 차이의 1.35배보다 작으면 front/back 을 고르지만 몹 그림에는 앞·뒤 모습이 없다).
// 고친 것: 근접 공격을 시작하는 순간(R53 canPrepare(e,'melee')) 영웅이 화면에서 몹의 위·아래 쪽(가로 차이 < 세로 차이×0.8)이면
//  영웅의 왼쪽 또는 오른쪽(몹이 있던 쪽 먼저) 같은 높이 자리, 공격 거리의 0.75배 지점으로 짧게 블링크한 뒤 공격한다.
//  · 그 자리가 막혔거나 영웅까지 시야가 막혔거나 3.2칸보다 멀면 반대쪽을 보고, 둘 다 안 되면 원래대로 공격한다.
//  · 보스·중간보스·페르소나·고정형(움직이지 않는 몹)은 건드리지 않는다. 같은 몹은 2.4초에 한 번만.
//  · 사라지는 자리와 나타나는 자리에 작은 어둠 수축(pvfx-void-implosion) — 다크 판타지 톤.
//  판정·피해·쿨다운은 그대로(자리만, 공격 시작 직전에).
// 끄기: localStorage['storyworld.r230.flank']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MOB_FLANK_R230__)return;
const REV='R230-flank-1',KEY='storyworld.r230.flank',RAD=.3,GAP=2.4,MAXD=3.2;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={checks:0,flanks:0,blocked:0,skipped:0,errors:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
// 화면 좌표 차이(엔진 project 와 같은 꼴): 가로 = x-y, 세로 = (x+y)/2
const scr=(ax,ay,bx,by)=>({sx:(bx-by)-(ax-ay),sy:((bx+by)-(ax+ay))*.5});
function eligible(e){return e&&!e.boss&&!e.midboss&&!e.persona&&!e.stationary&&!e.r170Tower&&!e.turret&&e.hp>0&&e.spawnState!=='hidden';}
function free(x,y){try{if(typeof blocked==='function'&&blocked(x,y,RAD,room))return false;if(typeof clearLine==='function'&&!clearLine({x,y},player))return false;return true;}catch(_){return false;}}
function puff(x,y,delay){try{const P=window.__STORYWORLD_PIXELFX_R163__;if(P?.has?.('pvfx-void-implosion'))P.play('pvfx-void-implosion',x,y,{k:.55,delay:delay||0,tint:{a:[40,10,30],b:[150,90,170]}});}catch(_){}}
// 공격 시작 직전: 필요하면 자리를 옮기고 true(옮김)/false 를 돌려준다
function flank(e){if(!on||!eligible(e)||typeof player!=='object'||!player)return false;stats.checks++;
 const {sx,sy}=scr(e.x,e.y,player.x,player.y);if(Math.abs(sx)>=Math.abs(sy)*.8)return false;
 if(e.r230At!=null&&T()-e.r230At<GAP){stats.skipped++;return false;}e.r230At=T();
 const range=Number(e.combatProfile?.attackShape?.range)||1.4,r=Math.max(.8,range*.75),k=r/Math.SQRT2;
 const first=sx>0?-1:1;/* 몹이 영웅의 화면 왼쪽(sx>0 → 영웅이 오른쪽)이면 영웅 왼쪽 자리부터 */
 for(const side of [first,-first]){const tx=player.x+side*k,ty=player.y-side*k;if(Math.hypot(tx-e.x,ty-e.y)>MAXD||!free(tx,ty)||(window.__STORYWORLD_MOB_SHADOW_R374__?.canRelocate(e,{x:tx,y:ty})===false))continue;
  const from=[+e.x.toFixed(2),+e.y.toFixed(2)];puff(e.x,e.y,0);e.x=tx;e.y=ty;e.nav=[];e.moving=false;puff(tx,ty,.06);
  if(typeof facing==='function')e.direction=facing(player.x-e.x,player.y-e.y);e.r230Flanks=(e.r230Flanks||0)+1;stats.flanks++;stats.last={id:e.nativeId||e.id,from,to:[+tx.toFixed(2),+ty.toFixed(2)]};return true;}
 stats.blocked++;return false;}
let tries=0;
function wrap(){const M=window.__STORYWORLD_HOSPITAL_MOTION_R53__;if(!M||typeof M.canPrepare!=='function')return false;if(M.__r230)return true;
 window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({...M,__r230:true,canPrepare(e,kind,...a){const ok=M.canPrepare.call(this,e,kind,...a);try{if(ok!==false&&kind==='melee'&&!e?.attack)flank(e);}catch(err){fail(err);}return ok;}});return true;}
// 뒤에 다시 감싸는 오버레이가 있어도 바깥에 서도록 몇 번 다시 본다
(function arm(){try{wrap();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_MOB_FLANK_R230__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),flank,set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
