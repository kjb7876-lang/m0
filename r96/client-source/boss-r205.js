/* R205 보스·중간보스 조정 — 사용자 2026-11-01 "중간보스 크기 절반으로 축소, 중간보스들이 환영 스킬을 사용하지 않고 오직 보스들만 가끔 환영 스킬 사용하도록,
 * 그리고 그 환영 쪽으로 보스가 이동하도록 / 보스들은 광폭화 스킬을 사용하여 체력이 낮아지면 크기 2배 증가하고 스킬 범위도 2배 증가하고 공격력은 6% 증가하도록".
 *  R137(중간보스 70%·중간보스급 환영)·R114(환영 돌진 2.4칸) 위에 덧씌운다 — 그 파일들의 동작·검사는 그대로 두고 여기서 바꾼다.
 *  ① 중간보스(보스 아님: midboss·결계 챔피언) 그림 크기 50%: R137 의 70% 위에 5/7 를 더 곱한다. 판정 반지름은 그대로.
 *  ② 환영(R61 echo)은 보스급(boss·persona·cosmic·trial)만. 중간보스·잡몹은 R61 차례를 멈추고 시작된 환영도 풀리기 전에 거둔다.
 *     보스도 "가끔": 환영이 끝나면 다음 환영까지 최소 26초(R114 의 20~30초 위에).
 *  ③ 보스 환영이 풀리면 보스가 환영이 날아간 자리(준비 때 겨눈 지점) 쪽으로 이동한다(최대 7칸, 영웅 1칸 앞에서, 벽에 막히면 멈춤, 0.5초).
 *  ④ 광폭화: 보스 체력이 30% 이하가 되면 한 번 — 그림 크기 2배, 그 보스가 새로 만드는 장판·투사체·패턴 범위 2배, 공격력 6% 증가. 붉은 기운과 알림.
 *  협동 중에는 판정 부분(②③④)을 쓰지 않는다. storyworld.r205.boss {midHalf,echoBossOnly,echoMove,enrage} 로 끈다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_R205__)return;
const REV='R217-boss-3',KEY='storyworld.r205.boss';
const DEFAULTS={midHalf:true,echoBossOnly:true,echoMove:true,enrage:true,minSize:true};
const prefs={...DEFAULTS};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={midDraws:0,echoStopped:0,echoCancelled:0,echoGaps:0,moves:0,moveDist:0,enraged:0,scaledHazards:0,enragedDraws:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';};
const live=()=>typeof started!=='undefined'&&started&&!loading&&!modal&&typeof player==='object'&&player&&player.hp>0&&typeof room==='object'&&room;
const T=()=>typeof time==='number'?time:0;
const F=()=>window.__STORYWORLD_FIELDS_R61__;
const bossClass=e=>!!(e&&(e.boss||e.persona||e.cosmic||e.trial));
const R137=()=>window.__STORYWORLD_COMBAT_R137__;
const midClass=e=>!!e&&!e.boss&&(e.midboss===true||e.wardChampionR81===true||!!R137()?.midClass?.(e));
const ENRAGE_AT=.3,ENRAGE_DMG=1.06,ENRAGE_SIZE=2,ENRAGE_RANGE=2,ECHO_GAP=26,MOVE_MAX=7;
// R217(사용자 2026-11-02 "뿌리보스 분신사용쿨타임 증가 현재의 66프로이상너프", "보스들 크기 플레이어 최소1.6배이상은되도록 보라검천사보스 지금 너무 작게나옴"):
//  · 뿌리의 문지기(dist00 보스) 환영 간격 ×3(26초 → 78초) — 사용 빈도 약 67% 줄임.  · 보스·중간보스는 그림 키가 영웅의 1.6배 아래로 내려가지 않게(중간보스 절반 규칙 뒤에 적용).
const ROOT_GAP_MUL=3,MIN_BOSS_H=1.6;
const rootBoss=e=>!!(e&&e.boss&&(String(e.nativeId||'').startsWith('dist00')||/뿌리의 문지기/.test(String(e.name||''))));
const gapOf=e=>rootBoss(e)?ECHO_GAP*ROOT_GAP_MUL:ECHO_GAP;

// ---- ② 환영은 보스만, 가끔 ----------------------------------------------------------------------
const gap=new WeakMap();// e -> 다음 환영 허용 시각
function gateEcho(){const api=F();if(!api?.state||!room?.enemies)return;const t=T();
 for(const e of room.enemies){if(!e||e.hp<=0)continue;const a=e.r61Action;let s=null;try{s=api.state(e);}catch(_){}
  if(!bossClass(e)){// 중간보스·잡몹: 환영 차례 멈춤, 시작된 환영은 풀리기 전에 거둠
   if(midClass(e)&&s&&s.next!==Infinity){s.next=Infinity;stats.echoStopped++;}
   if(midClass(e)&&a&&!a.cancelled&&a.kind==='echo'&&t<(a.releaseAt??0)){a.cancelled=true;e.r61BusyUntil=0;stats.echoCancelled++;}continue;}
  // 보스: 환영이 끝난 뒤 ECHO_GAP 초 동안은 R61 차례 중 환영 칸(보스급 ['field','echo','prop'][step%3])만 건너뛴다 — 장판·던지기는 그대로.
  const g=gap.get(e);
  if(a&&a.kind==='echo'&&!a.r205Seen){a.r205Seen=true;if(g&&t<g&&t<(a.releaseAt??0)){a.cancelled=true;e.r61BusyUntil=0;stats.echoCancelled++;}else gap.set(e,(a.endAt||t)+gapOf(e));}
  const g2=gap.get(e);if(g2&&t<g2&&s&&Number.isFinite(s.step)&&s.step%3===1){s.step++;stats.echoGaps++;}}}

// ---- ③ 보스가 환영 쪽으로 이동 --------------------------------------------------------------------
const moving=new Set();
function watchEcho(){const t=T();for(const e of room.enemies||[]){const a=e?.r61Action;if(!a||a.kind!=='echo'||a.cancelled||a.r205Move||!bossClass(e)||e.hp<=0)continue;if(t<(a.releaseAt??Infinity))continue;
  a.r205Move=true;const tg=a.target||{x:e.x+Math.cos(a.angle)*4,y:e.y+Math.sin(a.angle)*4};const dx=tg.x-e.x,dy=tg.y-e.y,d=Math.hypot(dx,dy)||1;
  const toHero=Math.hypot(player.x-e.x,player.y-e.y),len=Math.min(MOVE_MAX,d,Math.max(0,toHero-1.0));if(len<.3)continue;
  moving.add({e,ux:dx/d,uy:dy/d,left:len,until:t+.5});stats.moves++;}}
function stepMoves(dt){const t=T();for(const m of [...moving]){const e=m.e;if(!e||e.hp<=0||m.left<=0||t>m.until+.2){moving.delete(m);continue;}
  const sp=m.left/Math.max(.05,m.until-t+dt),step=Math.min(m.left,sp*dt),ox=e.x,oy=e.y;
  try{if(typeof moveActor==='function')moveActor(e,m.ux*step,m.uy*step,Number.isFinite(e.radius)?e.radius:.5);}catch(err){fail(err);}
  const moved=Math.hypot(e.x-ox,e.y-oy);stats.moveDist+=moved;m.left-=step;if(moved<step*.3)m.left=0;}}

// ---- ④ 광폭화 ------------------------------------------------------------------------------------
const RANGE_KEYS=['radius','r','range','width','length','size','reach','spread','outer','inner'];
function scaleRanges(o,k){if(!o||typeof o!=='object')return 0;let n=0;for(const key of RANGE_KEYS)if(typeof o[key]==='number'&&Number.isFinite(o[key])&&o[key]>0){o[key]*=k;n++;}return n;}
function enrage(e){if(e.r205Enraged)return;e.r205Enraged={at:T(),dmgBefore:e.damage};
 if(Number.isFinite(e.damage))e.damage*=ENRAGE_DMG;
 const sh=e.combatProfile?.attackShape;if(sh&&!sh.r205)scaleRanges(sh,ENRAGE_RANGE)&&(sh.r205=true);
 stats.enraged++;try{if(typeof toast==='function')toast((e.name||'보스')+' — 광폭화',2.2);}catch(_){}}
function enrageTick(){const list=typeof hazards!=='undefined'&&Array.isArray(hazards)?hazards:null;
 for(const e of room.enemies||[]){if(!e||e.hp<=0||!bossClass(e))continue;if(!e.r205Enraged&&Number.isFinite(e.maxHp)&&e.maxHp>0&&e.hp/e.maxHp<=ENRAGE_AT)enrage(e);
  // 광폭화한 보스의 새 R61 행동: 범위 2배
  const a=e.r61Action;if(e.r205Enraged&&a&&!a.r205Range){a.r205Range=true;scaleRanges(a,ENRAGE_RANGE);}}
 if(list)for(const h of list){if(!h||h.r205Scaled)continue;const owner=h.owner??h.ownerId??h.r61Owner;if(owner==null)continue;const e=room.enemies?.find(q=>q.id===owner);
  h.r205Scaled=true;if(e?.r205Enraged&&(h.age==null||h.age<.05)){if(scaleRanges(h,ENRAGE_RANGE))stats.scaledHazards++;}}}

// ---- 연결 ----------------------------------------------------------------------------------------
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){
 try{if(solo()&&live()){if(prefs.echoBossOnly)gateEcho();if(prefs.echoMove)watchEcho();if(prefs.enrage)enrageTick();}}catch(e){fail(e);}
 const r=base.call(this,dt,...a);try{if(moving.size&&live())stepMoves(Number.isFinite(dt)?dt:1/60);}catch(e){fail(e);}return r;};}
// R217: 보스·중간보스의 "그려진 몸"(기록기 그림 명령 높이 × 불투명 세로 비율)이 영웅 몸(actorHeight × .98, R114 맞춤 기준)의 1.6배보다 작으면 발밑 기준으로 키운다.
//  그림마다 투명 여백·가로로 넓은 날개 때문에 정해진 배율(defScale)만으로는 실제 크기가 영웅과 비슷하게 나왔다(보라검천사 ≈1.07배 실측).
const HERO_BODY=.98,MAX_FIT=3;const recOK=()=>typeof ctx==='object'&&!!ctx&&Array.isArray(ctx.commands)&&typeof actorHeight==='function';
const fracCache=new WeakMap();
function bodyFrac(image,rect){if(!image||!rect)return null;let m=fracCache.get(image);if(!m){m=new Map();fracCache.set(image,m);}const key=rect.map(v=>Math.round(v)).join(',');if(m.has(key))return m.get(key);
 let out=null;try{const [sx,sy,sw,sh]=rect,H=64,W=Math.max(8,Math.round(64*sw/sh)),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,sx,sy,sw,sh,0,0,W,H);
  const d=g.getImageData(0,0,W,H).data,rows=[];for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>100)n++;rows.push(n);}const mx=Math.max(...rows);if(mx>0){const th=mx*.12;let a=-1,b=-1;for(let y=0;y<H;y++)if(rows[y]>=th){if(a<0)a=y;b=y;}out=(b-a+1)/H;}
  c.width=c.height=1;}catch(_){out=null;}m.set(key,out);stats.fracScans=(stats.fracScans||0)+1;return out;}
function fitMin(st){const C=ctx.commands;let best=null,bh=0;for(let i=st;i<C.length;i++){const c=C[i];if(c?.kind!=='image'||!c.points)continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 if(!best||bh<6)return;const f=bodyFrac(best.image,best.sourceRect)||1,now=bh*f,want=actorHeight()*HERO_BODY*MIN_BOSS_H;stats.lastBodyRatio=Math.round(now/(actorHeight()*HERO_BODY)*100)/100;if(now>=want*.98)return;
 const k=Math.min(MAX_FIT,want/now),P=best.points,fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2,own=best.owner;
 for(let i=st;i<C.length;i++){const c=C[i];if(c?.kind!=='image'||!c.points||(c!==best&&(!own||c.owner!==own)))continue;c.points=c.points.map(([x,y])=>[fx+(x-fx)*k,fy+(y-fy)*k]);}
 stats.minSized=(stats.minSized||0)+1;stats.lastFitK=Math.round(k*100)/100;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(!e)return base.apply(this,arguments);const ds=e.defScale;let k=1;
 try{if(Number.isFinite(ds)){if(prefs.midHalf&&midClass(e)){k*=R137()?.prefs?.().midbossScale?5/7:.5;stats.midDraws++;}if(prefs.enrage&&e.r205Enraged&&e.hp>0){k*=ENRAGE_SIZE;stats.enragedDraws++;}
  if(prefs.minSize&&!recOK()&&(bossClass(e)||midClass(e)||e.midboss)){const sr=Number(e.combatProfile?.spriteRect?.height)||1,h=sr*ds*k;if(h>0&&h<MIN_BOSS_H){k*=MIN_BOSS_H/h;stats.minSized=(stats.minSized||0)+1;}}}}catch(err){fail(err);}
 if(k!==1)e.defScale=ds*k;
 try{if(k!==1&&e.r205Enraged&&typeof ctx==='object'&&ctx&&typeof project==='function'){/* 붉은 기운: 그림 뒤 바닥 타원(기록기 호환 — filter 없음) */const q=project(e.x,e.y),z=typeof zoom==='number'?zoom:1,R0=34*z*(1.1+.12*Math.sin(T()*6));
   ctx.save();const g=ctx.createRadialGradient(q.x,q.y,R0*.15,q.x,q.y,R0);g.addColorStop(0,'rgba(190,20,24,.42)');g.addColorStop(1,'rgba(120,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(q.x,q.y,R0,R0*.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}}catch(err){fail(err);}
 const big=prefs.minSize&&recOK()&&e.hp>0&&(bossClass(e)||midClass(e)||e.midboss),st=big?ctx.commands.length:0;
 try{return base.apply(this,arguments);}finally{if(k!==1)e.defScale=ds;if(big)try{fitMin(st);}catch(err){fail(err);}}};}
function set(p={}){for(const k of Object.keys(DEFAULTS))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_BOSS_R205__=Object.freeze({revision:REV,set,bossClass,midClass,enrage,scaleRanges,constants:{ENRAGE_AT,ENRAGE_DMG,ENRAGE_SIZE,ENRAGE_RANGE,ECHO_GAP,MOVE_MAX,ROOT_GAP_MUL,MIN_BOSS_H},rootBoss,gapOf,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},moving:moving.size,lastError})});
})();
