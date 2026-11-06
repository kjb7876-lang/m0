// R268 모든 몹(보스 포함)이 영웅을 바라보는 방향 맞추기 — 사용자 2026-11-03 "모든 몹보스몹포함해서 항상 영웅을 바라보게 만약 그방향스프라이트가없다면
//  주기적으로 영웅을 자기가 바라보기좋은위치로 소환+자신이 영웅을 바라보기 좋은위치로 블링크및 빠른돌진해서 시선방향성 꼭 맞추기".
//  몹 그림은 옆모습 한 장(좌우 뒤집기)이라 좌우는 엔진이 영웅 쪽으로 뒤집지만(drawEnemy flip), 영웅이 화면에서 몹의 바로 위·아래에 있으면
//  옆을 본 채로 서 있게 된다. R230 은 잡몹 근접 공격 직전에만 옆자리로 옮겼고 보스·중간보스·원거리 몹·공격 사이에는 그대로였다.
//  · 0.1초마다 영웅 9칸 안의 살아 있는 몹을 본다. 영웅이 화면에서 위·아래 쪽(가로 차이 < 세로 차이×0.8)으로 0.6초 넘게 있으면
//    영웅과 같은 화면 높이의 왼쪽/오른쪽 자리(지금 거리 유지, 몹이 있던 쪽 먼저)로 옮긴다.
//    잡몹·원거리 몹 = 짧은 블링크(어둠 수축), 보스·중간보스·페르소나 = 0.22초 빠른 돌진(지나간 자리에 연기).
//  · 몹이 움직일 수 없거나(고정형·탑) 옆자리가 막혔으면, 보스·중간보스일 때만 영웅을 그 보스 옆 같은 높이 자리로 끌어온다(소환, 8초에 한 번).
//  · 공격 예고·공격 중(attack·tell·windup·cast)에는 옮기지 않는다(판정 어긋남 방지). 같은 몹은 3초(보스 4.5초)에 한 번, 전체 0.5초에 2번까지.
//  · 옮긴 뒤 e.direction 을 영웅 쪽 left/right 로 맞춘다. 판정·피해·쿨다운은 그대로(자리만).
//  끄기: localStorage['storyworld.r268.gaze']='{"on":false}'  (영웅 소환만 끄기: '{"summon":false}')
(()=>{'use strict';
if(window.__STORYWORLD_MOB_GAZE_R268__)return;
const REV='R268-gaze-1',KEY='storyworld.r268.gaze',RAD=.3,NEAR=9,HOLD=.6,GAP=3,GAP_BOSS=4.5,SUMMON_GAP=8,DASH=.22;
let pref={on:true,summon:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')pref={...pref,...s};}catch(_){}
const stats={checks:0,blinks:0,dashes:0,summons:0,blocked:0,errors:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const scr=(ax,ay,bx,by)=>({sx:(bx-by)-(ax-ay),sy:((bx+by)-(ax+ay))*.5});
const big=e=>!!(e.boss||e.midboss||e.persona||e.elite==='boss');
const fixed=e=>!!(e.stationary||e.r170Tower||e.turret||e.rooted||e.immobile);
const busy=e=>!!(e.attack||e.tell>0||e.windup>0||e.rangedWindup>0||e.casting||e.cast||e.r268Dash||e.spawnState==='spawning');
function bad(e){const {sx,sy}=scr(e.x,e.y,player.x,player.y);return Math.abs(sx)<Math.abs(sy)*.8&&Math.hypot(sx,sy)>.2;}
function free(x,y,who){try{if(typeof blocked==='function'&&blocked(x,y,RAD,room))return false;if(typeof clearLine==='function'&&!clearLine({x,y},who))return false;return true;}catch(_){return false;}}
function puff(x,y,o={}){try{const P=window.__STORYWORLD_PIXELFX_R163__;if(P?.has?.('pvfx-void-implosion'))P.play('pvfx-void-implosion',x,y,{k:o.k||.55,delay:o.delay||0,tint:o.tint||{a:[40,10,30],b:[150,90,170]}});}catch(_){}}
const smoke=(x,y)=>puff(x,y,{k:.32,tint:{a:[30,12,22],b:[110,60,80]}});// 돌진 자국
const face=e=>{try{if(typeof facing==='function'){const d=facing(player.x-e.x,player.y-e.y);e.direction=d==='front'||d==='back'?((player.x-player.y)<(e.x-e.y)?'left':'right'):d;}}catch(_){}};
// 영웅과 같은 화면 높이(화면 가로축 = 월드 (1,-1)/√2) 의 좌우 자리
function spots(cx,cy,d,first){const k=d/Math.SQRT2;return [first,-first].map(s=>({x:cx+s*k,y:cy-s*k,side:s}));}
function relocate(e){const dist=Math.hypot(e.x-player.x,e.y-player.y),B=big(e);
 const range=Number(e.combatProfile?.attackShape?.range)||Number(e.range)||1.4,ranged=range>2.6||/ranged|caster|archer|shoot/i.test(String(e.combatProfile?.kind||e.kind||''));
 const d=Math.max(B?2:.9,Math.min(ranged?5:Math.max(1,range*.85),dist)),{sx}=scr(e.x,e.y,player.x,player.y),first=sx>0?-1:1,maxMove=B?6:3.6;
 if(!fixed(e))for(const s of spots(player.x,player.y,d,first)){if(Math.hypot(s.x-e.x,s.y-e.y)>maxMove||!free(s.x,s.y,player)||(window.__STORYWORLD_MOB_SHADOW_R374__?.canRelocate(e,s)===false))continue;
  const from=[+e.x.toFixed(2),+e.y.toFixed(2)];e.nav=[];e.moving=false;
  if(B){e.r268Dash={fx:e.x,fy:e.y,tx:s.x,ty:s.y,t0:T()};stats.dashes++;puff(e.x,e.y,{k:.7});}
  else{puff(e.x,e.y);e.x=s.x;e.y=s.y;puff(s.x,s.y,{delay:.06});face(e);stats.blinks++;}
  e.r268Moves=(e.r268Moves||0)+1;stats.last={id:e.nativeId||e.id,kind:B?'dash':'blink',from,to:[+s.x.toFixed(2),+s.y.toFixed(2)]};return true;}
 if(B&&pref.summon!==false&&T()-(window.__r268SummonAt||-1e9)>SUMMON_GAP&&!(player.skillAnim>0)&&!(player.hp<=0)){
  for(const s of spots(e.x,e.y,Math.max(1.8,Math.min(4,dist)),-first)){if(Math.hypot(s.x-player.x,s.y-player.y)>7||!free(s.x,s.y,e))continue;
   const from=[+player.x.toFixed(2),+player.y.toFixed(2)];puff(player.x,player.y,{tint:{a:[60,8,8],b:[190,40,40]}});player.x=s.x;player.y=s.y;
   for(const k of ['nav','path','route'])if(Array.isArray(player[k]))player[k]=[];puff(s.x,s.y,{delay:.06,tint:{a:[60,8,8],b:[190,40,40]}});
   window.__r268SummonAt=T();face(e);stats.summons++;stats.last={id:e.nativeId||e.id,kind:'summon',from,to:[+s.x.toFixed(2),+s.y.toFixed(2)]};return true;}}
 stats.blocked++;return false;}
function dashStep(e){const D=e.r268Dash;if(!D)return;const u=Math.min(1,(T()-D.t0)/DASH),k=1-(1-u)*(1-u);const px=e.x,py=e.y;
 const next={x:D.fx+(D.tx-D.fx)*k,y:D.fy+(D.ty-D.fy)*k};if(window.__STORYWORLD_MOB_SHADOW_R374__?.canRelocate(e,next)===false){e.r268Dash=null;stats.blocked++;return;}
 e.x=next.x;e.y=next.y;if(Math.hypot(e.x-px,e.y-py)>.35)smoke(px,py);
 if(u>=1||T()<D.t0){e.x=D.tx;e.y=D.ty;e.r268Dash=null;face(e);puff(e.x,e.y,{k:.6});}}
let budget=[],lastT=0;
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||typeof player!=='object'||!player||typeof room!=='object'||!room;}
function tick(){if(!pref.on||paused())return;const now=T();const enemies=room.enemies||[];
 for(const e of enemies)if(e?.r268Dash)try{dashStep(e);}catch(err){e.r268Dash=null;fail(err);}
 if(now-lastT<.1&&now>=lastT)return;const dt=Math.min(.3,Math.max(0,now-lastT));lastT=now;budget=budget.filter(t=>now-t<.5&&t<=now);
 for(const e of enemies){if(!e||!(e.hp>0)||e.visible===false||e.disabled||['hidden','inactive','disabled','despawned'].includes(e.spawnState))continue;
  if(Math.hypot(e.x-player.x,e.y-player.y)>NEAR){e.r268Bad=0;continue;}stats.checks++;
  if(!bad(e)){e.r268Bad=0;continue;}e.r268Bad=(e.r268Bad||0)+dt;if(e.r268Bad<HOLD||busy(e))continue;
  const gap=big(e)?GAP_BOSS:GAP;if(e.r268At!=null&&now-e.r268At<gap&&now>=e.r268At)continue;if(e.r230At!=null&&now-e.r230At<2.4&&now>=e.r230At)continue;
  if(budget.length>=2)break;e.r268At=now;e.r268Bad=0;try{if(relocate(e))budget.push(now);}catch(err){fail(err);}}}
let tid=0;function loop(){try{tick();}catch(err){fail(err);}tid=typeof requestAnimationFrame==='function'?requestAnimationFrame(loop):setTimeout(loop,33);}loop();
function set(v){if(typeof v==='boolean')pref.on=v;else if(v&&typeof v==='object')pref={...pref,...v};try{localStorage.setItem(KEY,JSON.stringify(pref));}catch(_){}return {...pref};}
window.__STORYWORLD_MOB_GAZE_R268__=Object.freeze({revision:REV,set,bad:e=>bad(e),relocate:e=>relocate(e),inspect:()=>({revision:REV,pref:{...pref},stats:{...stats},lastError})});
})();
