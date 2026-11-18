// R860 적 공격이 맞는 자리 — 사용자 2026-11-12 "적의 공격과 스킬이 영웅이나 정화의코어등 공격대상에 적중이펙트가 나오는게 아니라
//  적 자신이나 엉뚱한 곳에 이펙트를 만드는 문제 수정, 타격감 있도록".
//  전수 측정(헤드리스 소프트웨어 렌더링: dist01·dist02·ep1a08·ep1a10·ep1b03·u202, 일반 몹 근접·보스 장판·상태 도트·유성·이야기 문양)에서
//  영웅이 맞을 때 생기는 적중 그림(피·접촉·pxf·R83)은 모두 영웅 자리에 났다. 틀어진 곳은 두 군데였다.
//  ① 정화 코어(R600): 몹이 코어에 붙어 체력을 깎아도 코어 자리에 적중 그림도 피해 숫자도 없었다(코어 자신의 'hit' 포즈만 돌았다).
//     → 코어 구슬 높이에 적중 섬광·베기(몹 쪽에서 코어 쪽 방향)와 피해 숫자를 그린다.
//  ② R259 hit-center(hit-center-r259.js 에서 고침): 엔진 fx() 가 만든 burst·slash·text 를 '그 좌표 .15칸 안의 몹'에 붙여 그 몹 그림 가운데로
//     옮긴다 → 무한 생존처럼 몹이 영웅에게 겹쳐 몰리면 영웅이 맞는 숫자·그림이 겹친 몹(적 자신)에게 그려졌다. 영웅 피격(hurt 안·영웅 자리)은 붙이지 않는다.
//  이 파일은 ①만 맡는다(R600 코드를 건드리지 않고 코어 hitAt 이 바뀐 순간을 보고 그린다 — 무한 생존 PR 과 겹치지 않는다).
//  끄기: localStorage storyworld.r860.corehit {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_HIT_PLACE_R860__)return;
const REV='R860-enemy-hit-place-1',KEY='storyworld.r860.corehit',TYPE='r860-core-hit';
const stats={coreHits:0,drawn:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const Z=()=>window.__STORYWORLD_SURVIVAL_R600__;
let lastHitAt=-9,lastHp=null,lastRoom=null;
function spawn(c,e,dmg){
 const pc=project(c.x,c.y),pe=e?project(e.x,e.y):{x:pc.x-40,y:pc.y};
 const ang=Math.atan2(pc.y-pe.y,pc.x-pe.x);// 몹 → 코어 화면 방향(베기가 몹 쪽에서 들어온다)
 fx(TYPE,c.x,c.y,{life:.34,size:1,angle:ang,r259E:null,r860Core:true});
 floatText('-'+Math.ceil(dmg),c.x,c.y,'#ffb8a6');
 stats.coreHits++;}
function watch(){
 const z=Z();if(!on||!z||typeof z.active!=='function'||!z.active()||typeof z.here!=='function'||!z.here()){lastRoom=null;return;}
 const st=z.state();if(!st||!st.core)return;
 const c=room.survivalR600?.centre;if(!c)return;
 if(lastRoom!==room){lastRoom=room;lastHitAt=st.core.hitAt;lastHp=st.core.hp;return;}// 지역이 바뀌면 기준만 다시 잡는다(전환 직후 가짜 적중 방지)
 const hp=st.core.hp,hitAt=st.core.hitAt;
 if(hitAt>lastHitAt){
  const e=room.enemies.find(e=>e.r600CoreAt===hitAt&&e.hp>0)||room.enemies.filter(e=>e.hp>0&&e.r600Core).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0]||null;
  const delta=lastHp!=null?lastHp-hp:0,dmg=delta>=.5?delta:Math.max(1,((e&&e.damage)||8)*1.1);
  try{spawn(c,e,dmg);}catch(err){fail(err);}// 코어를 부수는 마지막 타도 맞은 자리에 남긴다
  lastHitAt=hitAt;}
 lastHp=hp;}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{watch();}catch(e){fail(e);}return r;};}
// 코어 적중 그림: 구슬·받침 몸 한가운데(발 위 .62 키)에 섬광, 몹 쪽에서 들어오는 베기. 코어 몸은 R600 이 prop 으로 그린다.
function drawHit(f){
 const q=project(f.x,f.y),t=Math.min(1,Math.max(0,f.age/f.life)),unit=TILE*zoom,ah=Math.max(64,typeof actorHeight==='function'?actorHeight():70);
 const a=Math.sin(Math.PI*Math.min(.999,t)),cy=q.y-ah*.62;
 const ease=1-Math.pow(1-t,2);
 texture(VFX.burst,q.x,cy,unit*(1.1+ease*1.0),unit*(1.1+ease*1.0),{alpha:Math.min(1,a*1.15),angle:f.angle});
 const run=unit*.9*(1-t*.3),dx=Math.cos(f.angle),dy=Math.sin(f.angle);
 texture(VFX.slash,q.x-dx*run*(.55-ease*.35),cy-dy*run*(.55-ease*.35),unit*1.55,unit*1.55,{alpha:Math.min(1,a*1.1),angle:f.angle});
 stats.drawn++;}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(f,...a){if(f&&f.type===TYPE){try{if(on)drawHit(f);}catch(e){fail(e);}return;}return base.apply(this,[f,...a]);};}
const set=v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;};
window.__STORYWORLD_ENEMY_HIT_PLACE_R860__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
