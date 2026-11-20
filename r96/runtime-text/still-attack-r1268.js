// R1268 이동 중엔 기본 공격을 시작하지 않고, 멈추면 공격이 나간다 — 사용자 2026-11-20 05:21Z
//  "모든 몹과 영웅은 이동중에는 공격 안하고 멈춘상태가 되면 공격이 나가게" + 05:21Z "이미시전된공격은 나감".
//  범위(모든 모드 공유 코드):
//   · 영웅 — 기본 공격(basicAttack: 공격키·버튼·A 자동·반자동·명령 공격·EGO 소환 영웅 몸)이 걷는 틱(player.moving)엔 시작하지 않는다.
//     걷는 중 누른 버튼 한 번은 0.6초 동안 기억했다가 멈추는 틱에 나간다. 공격키를 누르고 있으면 멈추는 틱에 바로 나간다.
//   · 몹·중간보스·보스(지금은 기본 끔 — {"enemy":true} 로 켬) — 근접·원거리 기본 공격 시작(엔진 tickEnemies 가 묻는 R53 canPrepare)을, 걸은 뒤 0.12초 서 있기 전에는 막는다.
//     이미 공격할 자리(쿨다운 끝·사거리 안·원래 관문 허락)에 서 있는데 엔진이 또 걸리면 그 걸음은 되돌려 멈춰 세운다 → 0.12초 서 있다가 공격 시작.
//     원래 관문이 막는 적(패턴 중 보스 등)은 멈춰 세우지 않는다(걸음 끊김 없음).
//   · 이미 시작한 공격(준비·타격·후딜, 원거리 윈드업, 나간 투사체)은 걷기와 상관없이 그대로 끝까지 나간다 — 이 파일은 '시작'만 본다.
//   · 공격 중 고정(기본 켬): 일반 몹·중간보스가 근접 준비~후딜·원거리 윈드업 중일 때 다른 규칙(R425 자리 잡기·R115 간격·몸 겹침)이
//     미는 걸음을 되돌려 제자리에서 공격한다(헤드리스 전수: 시간수문장 원거리 탄 21/35발이 윈드업 중 미끄러지며 나갔음). 영웅 넉백은 그대로.
//   · 스킬(Q·W·E·R·블링크·공명)·보스 고유 패턴·돌진 공격(R52·R286)은 기본 공격이 아니라 그대로 둔다.
//  끄기: localStorage storyworld.r1268.still = {"on":false}
(()=>{'use strict';
const KEY='storyworld.r1268.still',VER='still-attack-r1268';
const cfg={on:true,pin:true,enemy:false,enemyStill:.12,buffer:.6,minSpeed:.6};/* enemy: 몹·보스 규칙은 원인 조사 중이라 기본 끔(사용자 결정 대기, 2026-11-20) */
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'){if(v.on===false)cfg.on=false;if(v.enemy===true)cfg.enemy=true;if(v.pin===false)cfg.pin=false;if(Number.isFinite(+v.enemyStill))cfg.enemyStill=Math.max(0,Math.min(1,+v.enemyStill));}}catch(_){}
const stats={heroBlocked:0,heroBuffered:0,heroBufferedFired:0,heroBufferDropped:0,heroPassed:0,pinned:0,enemyHeld:0,enemyStopped:0,enemyReleased:0,enemyPassed:0,wraps:{basic:0,tick:0,enemies:0,r53:0},errors:0,lastError:''};
const fin=v=>Number.isFinite(+v);const now=()=>{try{return fin(time)?+time:0;}catch(_){return 0;}};
function fail(e){stats.errors++;stats.lastError=String(e&&e.message||e).slice(0,160);}
function P(){try{return player;}catch(_){return null;}}
// ── 영웅 ──
let pendingAt=-9,pendingP=null,pendingHero=null;const mine={basic:null,enemies:null,tick:null,r53:null,hit:null};
function heroMoving(){const p=P();return !!(p&&p.moving);}
function wrapBasic(){try{if(typeof basicAttack!=='function'||basicAttack===mine.basic)return false;const base=basicAttack;
 const f=function(force){if(cfg.on&&heroMoving()){stats.heroBlocked++;if(force){pendingAt=now();pendingP=P();pendingHero=pendingP&&pendingP.hero;stats.heroBuffered++;}return;}stats.heroPassed++;return base.apply(this,arguments);};
 f.__r1268=true;f.__r1268Base=base;for(const k of Object.keys(base))if(!(k in f))try{f[k]=base[k];}catch(_){}
 mine.basic=f;window.basicAttack=f;try{basicAttack=f;}catch(_){}stats.wraps.basic++;return true;}catch(e){fail(e);return false;}}
// ── 적 ──
function enemyMovedRecently(e){return !!e&&now()-(fin(e.__r1268MoveAt)?+e.__r1268MoveAt:-9)<cfg.enemyStill;}
let dry=false;
function wrapR53(){try{const M=window.__STORYWORLD_HOSPITAL_MOTION_R53__;if(!M||M===mine.r53||typeof M.canPrepare!=='function')return false;const base=M.canPrepare;
 const W=Object.freeze({...M,__r1268:true,canPrepare(e,kind,...a){
  // 걸은 직후(0.12초 안)엔 공격 시작을 막는다. 이미 공격 중인 적은 묻지 않고 통과(시작한 공격은 그대로).
  if(!dry&&cfg.on&&cfg.enemy&&e&&!e.attack&&!(+e.rangedWindup>0)&&e.hp>0&&enemyMovedRecently(e)){stats.enemyHeld++;return false;}
  const ok=base.call(this,e,kind,...a);if(ok&&!dry)stats.enemyPassed++;return ok;}});
 mine.r53=W;window.__STORYWORLD_HOSPITAL_MOTION_R53__=W;stats.wraps.r53++;return true;}catch(e){fail(e);return false;}}
// 엔진 tickEnemies 가 이번 틱에 공격을 시작했을 자리(쿨다운 끝·사거리 안·시야 트임)인지 + 원래 관문(R53 체인)이 허락하는지 미리 묻는다.
//  묻는 동안 R230·R425 옆자리 블링크는 쉬게 한다(두 파일 모두 e.r230At 이 방금이면 건너뜀) — 블링크는 진짜 공격 시작 때 한 번만.
//  원래 관문이 막는 적(패턴 중 보스 등)은 멈춰 세우지 않는다 → 걸음이 끊기지 않음.
function wouldAttack(e){try{if(!(e.hp>0)||e.attack||+e.rangedWindup>0||e.rest>0||e.spawnState==='hidden'||e.spawnState==='summoning'||now()<(+e.graceUntil||0)||!(e.cd<=0))return null;
 const p=P();if(!p)return null;const d=Math.hypot(p.x-e.x,p.y-e.y),range=+e.combatProfile?.attackShape?.range;if(!fin(range))return null;
 const kind=d<=range+.15?'melee':(d>range+.5&&d<8&&(e.ai==='hybrid'||e.ai==='ranged'))?'ranged':null;if(!kind)return null;
 if(typeof clearLine==='function'&&!clearLine(e,p))return null;
 const M=window.__STORYWORLD_HOSPITAL_MOTION_R53__;if(!M||typeof M.canPrepare!=='function')return kind;
 const pre=e.r230At;let ok=false;dry=true;try{e.r230At=now();ok=M.canPrepare(e,kind);}finally{dry=false;e.r230At=pre;}return ok?kind:null;}catch(err){dry=false;fail(err);return null;}}
function wrapEnemies(){try{if(typeof tickEnemies!=='function'||tickEnemies===mine.enemies)return false;const base=tickEnemies;
 const f=function(){wrapR53();let snap=null;
  if(cfg.on&&cfg.enemy)try{snap=new Map();for(const e of room.enemies||[])if(e&&e.hp>0)snap.set(e,{x:e.x,y:e.y,atk:!!e.attack||+e.rangedWindup>0});}catch(e){fail(e);snap=null;}
  const r=base.apply(this,arguments);
  const dt=Math.max(1e-3,+arguments[0]||1/60);
  if(snap)try{const t=now();for(const [e,s] of snap){if(!(e.hp>0))continue;if(e.attack||+e.rangedWindup>0)e.__r1268StopSince=0;
    const moved=Math.hypot((+e.x||0)-s.x,(+e.y||0)-s.y),spd=moved/dt;if(!(spd>cfg.minSpeed&&(e.moving||!s.atk&&!e.attack&&!(+e.rangedWindup>0))))continue;/* 자리 다툼으로 제자리에서 꼼지락(초당 0.6칸 미만)은 걷기로 안 봄 */
    // 걸었는데 바로 공격할 자리라면 이번 걸음은 되돌려 멈춰 세운다(서 있는 시간이 쌓이다 0.12초 뒤 공격 시작).
    // 안전판: 멈춰 세웠는데 0.45초 안에 공격이 시작되지 않으면(다른 규칙이 공격 조건을 바꾼 적) 1초 동안은 세우지 않는다 → 얼어붙지 않음.
    // 걷기 전 자리에서 이미 공격할 수 있었으면(사거리 안에 와 있었음) 이번 걸음을 되돌린다. 걸어서 막 사거리에 닿은 걸음은 그대로 둔다(도착).
    const nx=e.x,ny=e.y;let ready=false;if(fin(s.x)&&fin(s.y)&&t>=(+e.__r1268FreeUntil||0)){e.x=s.x;e.y=s.y;ready=!!wouldAttack(e);if(!ready){e.x=nx;e.y=ny;}}
    if(ready){if(!(e.__r1268StopSince>0))e.__r1268StopSince=t||1e-6;
     if(t-e.__r1268StopSince<=.45){e.moving=false;e.moveDX=e.moveDY=0;stats.enemyStopped++;continue;}
     e.x=nx;e.y=ny;e.__r1268FreeUntil=t+1;stats.enemyReleased++;}
    e.__r1268StopSince=0;
    // 무리에 밀렸다(틱 밖 몸 겹침 밀기·넉백) 제자리로 걸어 돌아오는 꼼지락은 걷기로 안 본다: 지난 틱 끝 자리에서 실제로 옮겨 간 만큼으로 판정.
    const L=e.__r1268Last;if(!L||Math.hypot(e.x-L.x,e.y-L.y)/dt>cfg.minSpeed)e.__r1268MoveAt=t;}}catch(e){fail(e);}
  if(snap)try{for(const e of snap.keys())if(e.hp>0)e.__r1268Last={x:+e.x,y:+e.y};}catch(e){fail(e);}
  return r;};
 f.__r1268=true;f.__r1268Base=base;for(const k of Object.keys(base))if(!(k in f))try{f[k]=base[k];}catch(_){}
 mine.enemies=f;window.tickEnemies=f;try{tickEnemies=f;}catch(_){}stats.wraps.enemies++;return true;}catch(e){fail(e);return false;}}
// ── 공격 중 고정 대상: 일반 몹·중간보스의 근접 준비~후딜·원거리 윈드업. 보스·페르소나(고유 패턴 이동)·R52 돌진·R286 돌진은 뺀다. ──
function pinnable(e){try{if(!e||!(e.hp>0)||e.boss||e.persona)return false;if(!(e.attack||+e.rangedWindup>0))return false;if(e.r286&&e.r286.mode)return false;
 const C=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(C&&typeof C.action==='function'&&C.action(e))return false;if(e.attack&&(e.attack.dash||e.attack.charge))return false;return true;}catch(_){return false;}}
function wrapHit(){try{if(typeof hitEnemy!=='function'||hitEnemy===mine.hit)return false;const base=hitEnemy;
 const f=function(e){try{if(e&&typeof e==='object')e.__r1268HitAt=now();}catch(_){}return base.apply(this,arguments);};
 f.__r1268=true;f.__r1268Base=base;for(const k of Object.keys(base))if(!(k in f))try{f[k]=base[k];}catch(_){}
 mine.hit=f;window.hitEnemy=f;try{hitEnemy=f;}catch(_){}return true;}catch(e){fail(e);return false;}}
// ── 틱: 버튼 기억 → 멈추면 발사, 감싸기 맨 바깥 유지 ──
function wrapTick(){try{if(typeof tick!=='function'||tick===mine.tick)return false;const base=tick;
 const f=function(){let pins=null;
  if(cfg.on&&cfg.pin)try{for(const e of room.enemies||[])if(pinnable(e))(pins||(pins=new Map())).set(e,{x:e.x,y:e.y});}catch(e){fail(e);pins=null;}
  const r=base.apply(this,arguments);
  // 공격 중 고정(워3: 공격 동작 동안 유닛은 제자리): 이 틱 동안 다른 규칙(R425 자리 잡기·R115 간격·몸 겹침 밀기)이 민 걸음은 되돌린다.
  //  영웅 타격 넉백(hitEnemy)은 그대로 두고, 그 자리에서 다시 고정한다. 공격이 이 틱에 끝난(발사) 몹도 이 틱 걸음은 되돌림.
  if(pins)try{const t=now();for(const [e,s] of pins){if(!(e.hp>0)||e.__r1268HitAt===t)continue;if(!fin(s.x)||!fin(s.y))continue;
    if(Math.hypot(e.x-s.x,e.y-s.y)>1e-6){e.x=s.x;e.y=s.y;e.moving=false;e.moveDX=e.moveDY=0;stats.pinned++;}}}catch(e){fail(e);}
  try{if(cfg.on&&pendingAt>-9){const t=now(),p=P(),age=t-pendingAt;
   // 남은 입력은 0.6초 안·시간이 앞으로만 흐름·같은 플레이어 몸·같은 영웅일 때만 쓴다(새 여정·영웅 바꿈에 남은 입력이 새지 않게 — Dots 검수 #914).
   if(age<0||age>cfg.buffer||!p||p!==pendingP||p.hero!==pendingHero||p.hp<=0){pendingAt=-9;pendingP=null;stats.heroBufferDropped++;}
   else if(!p.moving&&!(p.attackCD>0)){pendingAt=-9;pendingP=null;stats.heroBufferedFired++;basicAttack(true);}}}catch(e){fail(e);}
  return r;};
 f.__r1268=true;f.__r1268Base=base;for(const k of Object.keys(base))if(!(k in f))try{f[k]=base[k];}catch(_){}
 mine.tick=f;window.tick=f;try{tick=f;}catch(_){}stats.wraps.tick++;return true;}catch(e){fail(e);return false;}}
function install(){wrapBasic();wrapEnemies();wrapR53();wrapHit();wrapTick();}
window.__STORYWORLD_STILL_ATTACK_R1268__=Object.freeze({
 heroMoving,enemyMovedRecently,install,
 set(o){if(o&&typeof o==='object'){if('on' in o)cfg.on=!!o.on;if('enemy' in o)cfg.enemy=!!o.enemy;if('pin' in o)cfg.pin=!!o.pin;if(fin(o.enemyStill))cfg.enemyStill=Math.max(0,Math.min(1,+o.enemyStill));if(fin(o.buffer))cfg.buffer=Math.max(0,Math.min(2,+o.buffer));}
  try{localStorage.setItem(KEY,JSON.stringify({on:cfg.on,pin:cfg.pin,enemy:cfg.enemy,enemyStill:cfg.enemyStill}));}catch(_){}return {...cfg};},
 inspect:()=>({revision:VER,cfg:{...cfg},stats:JSON.parse(JSON.stringify(stats)),pending:pendingAt>-9})});
install();
if(document.readyState!=='complete')addEventListener('load',install);
// 뒤에 실리는 오버레이가 다시 감싸면 맨 바깥을 되찾는다(몇 번만).
let checks=0;const iv=setInterval(()=>{install();if(++checks>40)clearInterval(iv);},500);
})();
