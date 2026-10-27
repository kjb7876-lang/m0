/* R106 플레이 보정 (사용자 요청 2026-10-27 07:40~07:44)
 * 1) 적이 바라보는 방향: 방향 정보가 없거나 틀린 적 그림 12종을 눈으로 분류해 표로 두고,
 *    그림 한 장뿐인 적은 좌우반전으로 영웅 쪽을 보게 한다(보스는 짧게 머뭇거린 뒤 돌아섬).
 * 2) 난이도 선택 창: 엔터로 확정·진행, 숫자 1·2·3으로 쉬움·보통·어려움 선택.
 * 3) D2 서바이버즈식 생존전 규칙 중 장점만(사몽 생존전, 혼자 할 때만):
 *    - 생명 구슬: 잡몹 3%·정예 35% 확률로 떨어지고, 3타일 안이면 영웅에게 끌려와 최대 체력 6%를 채운다(20초 뒤 사라짐).
 *    - 근접 밀쳐내기: 영웅 2.6타일 안에서 맞은 잡몹이 0.22타일 밀려나 숨 돌릴 틈을 만든다(벽·정예·보스 제외).
 * 저장 형식·서사·보스 패턴은 바꾸지 않는다. */
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_R106__)return;
const REV='R106-play-1';let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const stats={flips:0,bossFlips:0,enter:0,digit:0,orbsDropped:0,orbsTaken:0,healed:0,pushes:0};
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const finite=v=>Number.isFinite(v);

// ---- 1. facing ------------------------------------------------------------------------------
// 그림 원본이 바라보는 쪽(L/R). 2026-10-27 R106에서 199종 중 정보 없음·충돌 183종을 눈으로 다시 보고 측면이 뚜렷한 것만 적었다.
// 정면 그림은 넣지 않는다(기존 규칙 유지).
const FACE={
 'assets/dist/cult_mage.png':'L', // R100 표는 R, R93 표는 L — 지팡이를 앞세우고 왼쪽으로 기울어진 그림
 'assets/cult-v3123/black_robed_nightmare_demon.webp':'L','assets/cult-v3123/black_rose_demon_soldier.webp':'L',
 'assets/episode1b/generated-v394/seal_residual.webp':'L','assets/episode1b/generated-v394/blue_executor.webp':'L',
 'assets/u2/generated-v350/u2_suppression_knight.webp':'L','assets/murder/rooftop_echo.png':'L',
 'assets/generated-v31224/actors-normalized/693a5923c4c1_dist_blood_guardian_pursuer.webp':'L',
 'assets/generated-v31224/actors-normalized/cfb37917e7c0_dist_dying_messenger_shadow.webp':'L',
 'assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp':'L',
 'assets/generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp':'L',
 'assets/generated-v31224/actors-normalized/570df4477372_rooftop_echo.webp':'L',
 'assets/generated-v31224/actors-normalized/c386e08b76cf_ep1a_stabilization_supervisor.webp':'R'};
const pathOf=e=>String(e?.profile?.frames?.idle?.path||e?.path||'').replace(/^\.\//,'');
const known=new WeakMap();const faceOf=e=>{if(known.has(e))return known.get(e);const f=FACE[pathOf(e)]||null;known.set(e,f);return f;};
// 화면 가로축(u=x-y)으로 영웅이 어느 쪽인지. 붙어 있을 때 떨지 않게 작은 무감대, 보스는 0.35초 머뭇거림.
const side=new WeakMap();
function heroLeft(e,hold){let s=side.get(e);if(!s){s={left:null,pend:null,since:0};side.set(e,s);}
 const du=(player.x-player.y)-(e.x-e.y);if(Math.abs(du)<.3&&s.left!==null)return s.left;const want=du<0;const t=typeof time==='number'?time:0;
 if(s.left===null||!hold){s.left=want;return want;}
 if(want!==s.left){if(s.pend!==want){s.pend=want;s.since=t;}if(t-s.since>=.35||e.attack||e.rangedWindup>0){s.left=want;s.pend=null;}}else s.pend=null;return s.left;}
const motion=window.__STORYWORLD_ENEMY_MOTION_R51__;
if(motion&&typeof motion.flip==='function')window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...motion,flip(e,f,fallback){const out=motion.flip(e,f,fallback);
 try{if(!e||!live()||!(e.hp>0)||f?.r74Monster||f?.r51OrderlyPose||f?.r52RangedPose||f?.r53HospitalPose||f?.r54StoryPose)return out;const art=faceOf(e);if(!art)return out;
  const boss=!!(e.boss||e.midboss||e.persona),left=heroLeft(e,boss);if(boss)stats.bossFlips++;else stats.flips++;
  return art==='R'?left:!left;}catch(err){fail(err);}return out;}});

// ---- 2. difficulty: Enter / 1·2·3 -----------------------------------------------------------------
addEventListener('keydown',ev=>{try{const P=window.__STORYWORLD_PROGRESSION_R71__;if(!P?.difficultyState?.().open)return;
 const el=document.activeElement,tag=el?.tagName;if(tag==='INPUT'||tag==='TEXTAREA')return;
 if(ev.key==='Enter'||ev.key==='NumpadEnter'){if(tag==='BUTTON'&&el.id!=='r71DifficultyConfirm'&&!el.dataset?.r71Tier)return;if(ev.repeat){ev.preventDefault();return;}
  ev.preventDefault();ev.stopPropagation();stats.enter++;P.confirmDifficulty();return;}
 const tier={'1':'easy','2':'normal','3':'hard'}[ev.key];if(tier){ev.preventDefault();ev.stopPropagation();if(P.selectDifficulty(tier))stats.digit++;}}catch(err){fail(err);}},true);

// ---- 3. D2S survival rules ---------------------------------------------------------------------
const SURV=()=>live()&&room.samongR103?.stage==='survival'&&solo()&&!(typeof loading!=='undefined'&&loading);
const orbs=[];const seen=new WeakSet();const hpSeen=new WeakMap();let seed=1;
const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const FX=()=>window.__STORYWORLD_FX_SPRITES_R106__;const RED={a:[200,30,40],b:[255,170,150]};
const SENT={type:'r106-orbs',x:0,y:0,age:0,life:Infinity,r106Sentinel:true};
function dropFor(e){if(!e||seen.has(e)||e.boss||e.midboss||!finite(e.x+e.y))return;seen.add(e);stats.deaths=(stats.deaths||0)+1;
 const elite=!!(e.samongElite||e.elite||e.champion||e.wardChampionR81);if(rnd()<(elite?.35:.03))orbs.push({x:e.x,y:e.y,t:0,id:'r106orb'+(++stats.orbsDropped)});}
if(typeof killEnemy==='function'){const kb=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=kb.apply(this,[e,...a]);try{if(first&&e?.deadRecorded&&SURV())dropFor(e);}catch(err){fail(err);}return r;};}
function tickRules(dt){if(!SURV()){if(orbs.length)orbs.length=0;return;}
 const hx=player.x,hy=player.y;
 for(const e of room.enemies||[]){if(!e||e.boss||e.midboss)continue;
  if(!(e.hp>0)){dropFor(e);continue;}
  const before=hpSeen.get(e);hpSeen.set(e,e.hp);
  if(before!==undefined&&e.hp<before&&!(e.elite||e.samongElite||e.champion)){const dx=e.x-hx,dy=e.y-hy,d=Math.hypot(dx,dy);
   if(d>.05&&d<2.6){const nx=e.x+dx/d*.22,ny=e.y+dy/d*.22;try{if(typeof blocked!=='function'||!blocked(nx,ny,.27,room)){e.x=nx;e.y=ny;stats.pushes++;}}catch(err){fail(err);}}}}
 for(let i=orbs.length-1;i>=0;i--){const o=orbs[i];o.t+=dt;const dx=hx-o.x,dy=hy-o.y,d=Math.hypot(dx,dy);
  if(d<3){const v=Math.min(d,(3.5+o.t*2)*dt*(1+(3-d)));o.x+=dx/(d||1)*v;o.y+=dy/(d||1)*v;}
  if(d<.45&&player.hp>0){const mx=typeof maxHP==='function'?maxHP():260,gain=Math.min(mx*.06,Math.max(0,mx-player.hp));player.hp+=gain;stats.orbsTaken++;stats.healed+=gain;
   try{if(gain>0&&typeof floatText==='function')floatText('+'+Math.ceil(gain),hx,hy,'#ff8f8f');}catch(err){fail(err);}orbs.splice(i,1);continue;}
  if(o.t>20)orbs.splice(i,1);}
 if(orbs.length&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}
function drawOrbs(){if(!orbs.length||typeof ctx==='undefined'||!ctx)return;const S=FX();const H=typeof actorHeight==='function'?actorHeight():64;
 for(const o of orbs){const q=project(o.x,o.y),bob=Math.sin((time||0)*5+o.t*3)*H*.04,fade=o.t>17?Math.max(0,(20-o.t)/3):1,run=()=>{
   ctx.save();try{if(!(S?.draw('orb',RED,q.x,q.y-H*.22+bob,H*.34,H*.34,{alpha:fade,overHero:true,blend:'source-over'})))
    {ctx.globalAlpha*=fade;ctx.fillStyle='#d8323c';ctx.beginPath();ctx.arc(q.x,q.y-H*.22+bob,H*.12,0,Math.PI*2);ctx.fill();}
    S?.draw('glow',RED,q.x,q.y-H*.22+bob,H*.7,H*.7,{alpha:.55*fade,overHero:true});}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:o.id,kind:'effect',x:o.x,y:o.y,r106:true},run);else run();}}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e){if(e&&e.type==='r106-orbs'){try{drawOrbs();}catch(err){fail(err);}return;}return base.apply(this,arguments);};}
if(typeof tick==='function'){const base=tick;tick=function(dt){const r=base.call(this,dt);try{if(live()&&finite(dt))tickRules(Math.min(Math.max(dt,0),.1));}catch(err){fail(err);}return r;};}
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);orbs.length=0;return r;};}

window.__STORYWORLD_PLAY_R106__=Object.freeze({revision:REV,face:FACE,faceOf,orbs:()=>orbs.map(o=>({...o})),
 test:{dropOrb:(x,y)=>{orbs.push({x,y,t:0,id:'r106orb-test'+(++stats.orbsDropped)});return orbs.length;}},
 inspect:()=>({revision:REV,...stats,orbs:orbs.length,failures,lastError,saveFormatChanged:false})});
})();

/* R107: returning to the shelter (death or 쉼터) left the hub's only portal pointing at an already-cleared
 * region; the order guard refused it ('현재 진행은 … 순서입니다') and the guide looped on the portal forever.
 * A 'next' portal into a region the player already completed is now a pass-through on the way to the current
 * memory: same saved difficulty, no first-clear reward (rewards are first-clear only), no new save fields. */
(()=>{'use strict';if(window.__STORYWORLD_PASS_R107__||typeof enterRegion!=='function')return;const stats={passes:0};
 const base=enterRegion;enterRegion=async function(id,from=null,options={}){try{const l=options?.layer||(typeof layer!=='undefined'?layer:'STORY'),r=typeof regionById!=='undefined'?regionById[id]:null;
  if(options&&options.r72Portal==='next'&&r&&id!==zone&&r.records?.length&&!r.safe&&typeof completed==='function'&&completed(id,l)&&typeof firstPending==='function'&&firstPending(l)?.id!==id&&!options.fastTravelR63){stats.passes++;return base.call(this,id,from,{...options,fastTravelR63:true,passR107:true});}}catch(_){}
  return base.apply(this,arguments);};
 window.__STORYWORLD_PASS_R107__=Object.freeze({inspect:()=>({revision:'R107-pass',...stats})});})();
