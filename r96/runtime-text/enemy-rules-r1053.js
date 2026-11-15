// R1053 적 전투 규칙 — 사용자 2026-11-15 "꼭두각시 실안개 등 보스들이 좌우를 번갈아서 보는 이유가 뭐야 전투중이니까 공격적으로 달려들어야지
//  그리고 몬스터가 피격당하면 피격모션도 있지만 피격만 계속당하지말고 공격도 해야해 너가 규칙정해서 일관성있게 해줘".
//  규칙 원문은 docs/enemy-combat-rules.md 하나. 이 파일은 그 규칙을 모든 적(스토리·무한생존·영화 모드 공유 코드)에 한 곳에서 건다.
//  헤드리스로 찾은 원인:
//   · 좌우 번갈아 보기: 꼭두각시 실안개(last302 중간보스)는 엔진 AI 가 'hybrid' 다. 엔진 tickEnemies 는 hybrid·ranged 적이 쿨다운 중이고 영웅이
//     3칸 안이면 영웅 반대쪽 2칸으로 물러서게 하고, 3칸 밖이면 다시 다가간다 → 3칸 언저리에서 물러섰다 다가오기를 되풀이했다(영웅이 가만히 있어도
//     평균 거리 3.03칸, 근접 거리 안으로 안 들어옴). R444 방향은 '걷는 쪽'을 보게 하므로 물러설 땐 등을 보이고 다가올 땐 영웅을 봐 좌우가 번갈았다
//     (영웅이 둘레를 돌며 때리면 10초에 3번 뒤집힘, 공격 밖 시간 28%는 영웅 반대쪽을 봄).
//   · 피격만 하는 몹: 엔진 hitEnemy 는 맞을 때마다 hitTimer=.14 를 다시 넣고, 그림 고르기는 hitTimer>0 이면 공격 중이어도 '피격' 자세를 먼저 고른다.
//     영웅이 0.1초마다 때리면 공격 자세를 그려야 할 순간의 81%가 피격 자세로 덮였다(AI 는 실제로 공격하는데 화면엔 맞기만 하는 것처럼 보임).
//  규칙(판정·피해·체력·쿨다운 수치·저장은 그대로):
//   ① 시선: 보스·중간보스는 전투 중(영웅이 6칸 안), 일반 몹은 4칸 안에서 걷는 동안에도 영웅 쪽을 본다(R444 가 이 파일의 faceHero 를 묻는다). 공격 중엔 R444 그대로 판정 각.
//      (사용자 11:12Z "몹들도 갈팡질팡안하게")
//   ② 접근: 보스·중간보스는 물러서지 않는다 — 쿨다운 중엔 그 틱 동안만 AI 를 'melee' 로 보고 엔진이 영웅 쪽으로 걷게 한다(근접 사거리×0.7 까지).
//      쿨다운이 끝나면 원래 AI(hybrid·ranged)로 돌아가 엔진이 근접/원거리 공격을 고른다.
//      일반 원거리 몹(hybrid·ranged)은 거리 두기는 남기되 3~6칸 띠에선 쿨다운 동안 제자리(3칸 경계 들락날락·맴돌기 없앰).
//   ③ 슈퍼아머: 모든 적은 공격 준비·타격·후딜 중 맞아도 피격 자세로 끊기지 않는다(흰 번쩍임 flash 는 그대로 — 맞은 느낌은 남김).
//   ④ 경직 상한: 일반 적은 피격 자세를 쌓아 0.45초까지 보이면 1.2초 '버팀'(피격 자세 없음)에 들어간다. 쌓인 값은 1.5초에 0.45초씩 빠진다.
//      보스·중간보스는 0.6초에 한 번만 움찔(0.14초)한다.
//   ⑤ 피격은 공격 쿨다운을 늘리지 않는다(엔진 원래대로 — 이 파일도 늘리지 않음). 영웅 스킬이 일부러 거는 기절(라우렌·미카엘라·서하 등 e.cd)은 스킬 설계라 그대로.
//  NaN·Infinity 는 모두 거른다. 맡지 않는 것: 페르소나, 움직이지 않는 구조물 적(R170 탑·R446 기둥 등), 맘몬 구역.
//  끄기: localStorage['storyworld.r1053.rules']='{"on":false}' (부분: face / approach / armor / cap). 점검: window.__STORYWORLD_ENEMY_RULES_R1053__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_RULES_R1053__)return;
const REV='R1053-rules-1+R1053b+R1053c',KEY='storyworld.r1053.rules';
const RULE=Object.freeze({faceRange:6,mobFaceRange:4,keepNear:3,keepFar:6,hitCap:.45,hitWindow:1.5,braceFor:1.2,majorFlinchGap:.6,bladeNear:4});
let prefs={on:true,face:true,approach:true,armor:true,cap:true,blade:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={ticks:0,approachHeld:0,bladeHeld:0,mobKept:0,armor:0,capped:0,braces:0,majorFlinch:0,majorHeld:0,faceAsked:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const num=(v,d)=>fin(Number(v))?Number(v):d;
const T=()=>{try{return typeof time==='number'&&fin(time)?time:0;}catch(_){return 0;}};
const P=()=>{try{return typeof player==='object'&&player?player:null;}catch(_){return null;}};
const R=()=>{try{return typeof room==='object'&&room?room:null;}catch(_){return null;}};
function structure(e){return !!(e.r170Tower||e.r446Pillar||e.r251Circle||e.towerR193||e.r193Tower||e.prop||e.object);}
function mammon(e){try{const id=String(R()?.id||'');return /mammon/i.test(id)||id==='ep1b06'||!!e.mammon||!!e.mammonR||/mammon/i.test(String(e.nativeId||''));}catch(_){return false;}}
const enemy=e=>!!e&&typeof e==='object'&&!e.hero&&!e.persona&&!structure(e)&&!mammon(e);
const major=e=>enemy(e)&&!!(e.boss||e.midboss);
const alive=e=>num(e.hp,0)>0&&!['dead','hidden','inactive','disabled','despawned'].includes(e.spawnState);
// 공격 중: 근접(e.attack, 엔진 그리기용 가짜 자세 storyWorldPose5 는 빼고)·원거리 준비·R61 동작
function attacking(e){const a=e.attack;if(a&&typeof a==='object'&&!a.storyWorldPose5)return true;if(num(e.rangedWindup,0)>0)return true;const r=e.r61Action;if(r&&T()<num(r.endAt,-1))return true;const m=e.r286&&e.r286.mode;return m==='charge'||m==='dash';}
// ① 시선
function faceHero(e,td){if(!prefs.on||!prefs.face||!enemy(e)||!fin(td)||td<0||td>=(major(e)?RULE.faceRange:RULE.mobFaceRange))return false;stats.faceAsked++;return true;}
// ③④ 피격 자세 거르기 — 맞은 순간(hitEnemy 뒤)과 매 틱 뒤에 hitTimer 를 정리한다(그림·방향·걸음 덧씌우기 모두 같은 값을 보게)
const H=new WeakMap();
function hs(e){let s=H.get(e);if(!s){s={acc:0,brace:-1e9,flinch:-1e9,hitAt:-1e9,last:T()};H.set(e,s);}return s;}
function settle(e,dt){if(!prefs.on||!enemy(e))return;const ht=num(e.hitTimer,0);if(!fin(e.hitTimer)&&e.hitTimer!==undefined)e.hitTimer=0;
 const s=hs(e),t=T(),fromHit=dt===0;if(dt==null){dt=t-s.last;s.last=t;}dt=Math.max(0,Math.min(.1,num(dt,0)));if(fromHit&&ht>0)s.hitAt=t;
 // 맞고 있는가: 엔진 hitTimer(.14) 또는 마지막 맞은 때로부터 .14초 — 공격 중 0 으로 정리한 뒤에도 '맞고 있는 시간'은 센다
 const under=ht>0||(t-s.hitAt>=0&&t-s.hitAt<.14);
 if(!under){s.acc=Math.max(0,s.acc-dt*RULE.hitCap/RULE.hitWindow);return;}
 if(!alive(e))return;
 // 쌓기: 공격 중이든 아니든 '맞고 있는 시간'을 쌓는다(연타 속 짧은 공격 틈마다 피격 자세가 다시 차오르지 않게) — 일반 적만
 const mj=major(e),bracing=t<s.brace&&s.brace-t<=RULE.braceFor;
 if(prefs.cap&&!mj&&!bracing&&!fromHit){s.acc+=dt;if(s.acc>=RULE.hitCap){s.acc=0;s.brace=t+RULE.braceFor;stats.braces++;}}
 if(!(ht>0))return;
 if(prefs.armor&&attacking(e)){e.hitTimer=0;stats.armor++;return;}
 if(!prefs.cap)return;
 if(mj){const since=t-s.flinch;if(since>=RULE.majorFlinchGap||since<0){s.flinch=t;stats.majorFlinch++;return;}if(since>.14){e.hitTimer=0;stats.majorHeld++;}else e.hitTimer=Math.min(ht,Math.max(0,.14-since));return;}
 if(t<s.brace&&s.brace-t<=RULE.braceFor){e.hitTimer=0;stats.capped++;}}
// ② 접근 + 틱 뒤 정리
let tickOn=false;
function installTick(){if(tickOn)return true;if(typeof tickEnemies!=='function')return false;if(tickEnemies.__r1053)return tickOn=true;const base=tickEnemies;
 const w=function(...a){const held=[],kept=[];
  try{const r=R(),p=P();if(prefs.on&&prefs.approach&&r&&Array.isArray(r.enemies)&&p)for(const e of r.enemies){
   if(!enemy(e)||!alive(e)||(e.ai!=='hybrid'&&e.ai!=='ranged')||attacking(e))continue;
   // ⑥ 칼(blade) 든 적은 근접 우선(R1053c): 영웅이 4칸 안이면 그 틱만 melee 로 봐 쏘지 않고 다가가 벤다. 4칸 밖에서는 엔진대로 쏘고, 쿨다운 중엔 거리 띠(②)에 서지 않고 다가온다.
   if(prefs.blade&&e.weapon==='blade'&&e.ai==='hybrid'){const d=Math.hypot(p.x-e.x,p.y-e.y);if(fin(d)&&d<=RULE.bladeNear){held.push([e,e.ai]);e.ai='melee';stats.bladeHeld++;}continue;}
   if(!(num(e.cd,0)>0))continue;
   if(major(e)){held.push([e,e.ai]);e.ai='melee';stats.approachHeld++;continue;}
   // ② 일반 원거리 몹: 쿨다운 중 3~6칸이면 그 자리에 선다(엔진의 3칸 경계 들락날락·4~6칸 맴돌기 대신 거리 띠). 3칸 안이면 엔진대로 물러서고 6칸 밖이면 다가간다.
   const d=Math.hypot(p.x-e.x,p.y-e.y);if(fin(d)&&d>=RULE.keepNear&&d<RULE.keepFar&&fin(e.x)&&fin(e.y))kept.push([e,e.x,e.y]);}}catch(err){fail(err);}
  let out;try{out=base.apply(this,a);}finally{for(const [e,ai] of held)if(e.ai==='melee')e.ai=ai;
   for(const [e,x,y] of kept){if(attacking(e)||!alive(e))continue;if(e.x!==x||e.y!==y){e.x=x;e.y=y;stats.mobKept++;}e.moving=false;e.moveDX=e.moveDY=0;}}
  try{stats.ticks++;const r=R();if(prefs.on&&r&&Array.isArray(r.enemies)){for(const e of r.enemies)settle(e,null);}}catch(err){fail(err);}
  return out;};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r1053=true;try{tickEnemies=w;}catch(_){}return tickOn=true;}
let hitOn=false;
function installHit(){if(hitOn)return true;if(typeof hitEnemy!=='function')return false;if(hitEnemy.__r1053)return hitOn=true;const base=hitEnemy;
 const w=function(e,...a){const out=base.call(this,e,...a);try{if(e&&num(e.hitTimer,0)>0)settle(e,0);}catch(err){fail(err);}return out;};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r1053=true;try{hitEnemy=w;}catch(_){}return hitOn=true;}
function install(){installTick();installHit();}
install();
let tries=0;const retry=()=>{install();if((!tickOn||!hitOn)&&tries++<40)setTimeout(retry,250);};if(!tickOn||!hitOn)setTimeout(retry,250);
function set(p={}){if(p&&typeof p==='object')for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ENEMY_RULES_R1053__=Object.freeze({revision:REV,RULE,faceHero,major,attacking,settle,set,
 inspect:()=>({revision:REV,prefs:{...prefs},installed:{tick:tickOn,hit:hitOn},stats:{...stats},lastError})});
})();
