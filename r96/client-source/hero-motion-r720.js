// R720 — 영웅 모션 법칙(사용자 2026-11-11 "영웅들 모션법칙을 추가해서 AAA급 참조해서 이동·공격 등 스위칭할 때 버그 없고 자연스럽게 이어지도록").
//  몸 그림을 고르는 덧씌우기가 여럿(R119 걷기·R143 공격/피격/R201 시트·R271 환도·R351 슬레이어·R440 스킬 휘두르기)이라, 각자 '바쁨'을 따로 판단해
//  전환 순간에 어긋났다(헤드리스 탐침 qa/r720/probe.mjs·rules.cjs 로 8영웅 전수 측정):
//   · 멈추자마자 친 공격이 걷기 꼬리(멈춘 뒤 0.15초 걷기 유지)에 가려 마지막 한 칸만 번쩍(서하·네온 등)
//   · 스킬 휘두르기·R201 스킬 시트·환도/슬레이어 공격이 움직이기 시작해도 0.3초 넘게 남아 미끄러짐(전 영웅)
//   · 대시가 대시 방향이 아니라 적 쪽(또는 늘 오른쪽 'move-right')을 봄(환도·서하·미카엘라·라우렌·헌터·슬레이어)
//   · 대시 뒤 끊긴 공격의 마지막 칸이 한 프레임 다시 튐(환도), 맞았는데 공격이 끝날 때까지 피격이 안 보이다 피격이 끝난 뒤 늦게 나옴(환도)
//   · 같은 시전 중 스킬 값이 다시 오르면 휘두르기가 첫 칸으로 되감김(기억사수)
//  이 파일은 모든 덧씌우기가 같은 기준을 쓰도록 '전환 규칙'을 한곳에 둔다(문서 docs/hero-motion-rules.md):
//   1) 우선순위: 사망 > 대시 > 피격(기본 공격 중에도 끊음) > 궁극기 > 스킬 > 기본 공격 > 이동 > 대기.
//   2) 최소 유지(커밋) 창: 기본 공격 0.12초·스킬/궁극기 0.18초 동안은 이동 입력으로 끊기지 않는다(예비 동작은 보여 준다). 그 뒤 이동 입력이 있으면 걷기로 캔슬.
//   3) 같은 시전 합치기: 스킬·궁극기 값이 0.25초 안에 다시 오르면 같은 시전으로 본다(휘두르기 되감기 금지).
//   4) 대시 방향: 대시가 실제로 옮긴 화면 방향(좌·우)을 본다. 대시는 진행 중인 기본 공격을 끊는다(대시 뒤 옛 공격 칸 재등장 금지).
//   5) 멈춘 직후 공격: 이동 입력을 뗀 뒤 시작한 공격은 걷기 꼬리보다 먼저 보인다.
//   6) 피격 반응은 맞은 순간 0.12초 안에 시작하지 못하면 버린다(늦은 피격 금지).
//  덧씌우기들은 window.__STORYWORLD_HERO_MOTION_R720__ 의 함수를 물어보고, 이 파일의 바깥 감싸기는 대시 방향만 마지막에 한 번 더 바로잡는다(안전망).
//  판정·피해·쿨다운·세이브는 바꾸지 않는다(그림 고르기만). 끄기: localStorage storyworld.r720.motion = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_MOTION_R720__)return;
const REV='R720-hero-motion-1',KEY='storyworld.r720.motion';
const RULES=Object.freeze({priority:Object.freeze(['dead','dash','hurt','ultimate','skill','attack','move','idle']),attackCommit:.12,skillCommit:.18,recastMerge:.25,hurtLate:.12,stopAttack:.4});
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={samples:0,dashes:0,dashFlips:0,moveCancels:{attack:0,skill:0},recastMerged:0,errors:0};let lastError=null;
const now=()=>typeof time==='number'?time:performance.now()/1000;
const P=()=>typeof player==='object'&&player?player:null;
const num=v=>Number.isFinite(+v)?+v:0;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
// 화면 방향: 세계 (dx,dy) → 화면 가로 sx=dx-dy, 세로 sy=(dx+dy)/2 (R336 과 같은 투영)
const screenOf=(dx,dy)=>({sx:dx-dy,sy:(dx+dy)*.5});
const DIR8=['e','se','s','sw','w','nw','n','ne'];
const S={t:null,x:null,y:null,hero:null,at:0,sk:0,ul:0,da:0,hu:0,mv:false,
 atkT0:-9,castT0:-9,castRiseT:-9,castKind:null,hurtT0:-9,moveT0:-9,moveEndT:-9,dash:null};
// 한 화면에 한 번만 상태를 읽는다(누가 먼저 묻든 같은 값). 이 파일의 바깥 감싸기가 drawHero 맨 앞에서 읽어 두므로,
//  R440 이 그리는 동안 잠깐 바꿔 보이는 공격 값(가짜 attackAnim)이 '새 공격'으로 잘못 읽히지 않는다.
function sample(){const p=P();if(!p)return S;const t=now();if(S.t===t&&S.hero===p.hero)return S;stats.samples++;
 const at=num(p.attackAnim),sk=num(p.skillAnim),ul=num(p.ultimateAnim),da=num(p.dashAnim),hu=num(p.hurtAnim),mv=!!p.moving;
 if(S.hero!==p.hero){Object.assign(S,{atkT0:-9,castT0:-9,castRiseT:-9,hurtT0:-9,dash:null});}
 if(at>S.at+1e-6)S.atkT0=t;
 const riseSk=sk>S.sk+1e-6,riseUl=ul>S.ul+1e-6;
 if(riseSk||riseUl){/* 규칙 3: 같은 종류(스킬/궁극기) 값이 0.25초 안에 다시 오르면 같은 시전 */const kind=riseUl?'ul':'sk';if(kind===S.castKind&&t-S.castRiseT<RULES.recastMerge&&(S.sk>0||S.ul>0))stats.recastMerged++;else S.castT0=t;S.castRiseT=t;S.castKind=kind;}
 if(hu>S.hu+1e-6)S.hurtT0=t;
 if(mv&&!S.mv)S.moveT0=t;if(!mv&&S.mv)S.moveEndT=t;
 if(da>S.da+1e-6&&S.x!=null){const dx=num(p.x)-S.x,dy=num(p.y)-S.y,q=screenOf(dx,dy);let side=null,dir8=null;
  if(Math.hypot(dx,dy)>.05){side=Math.abs(q.sx)>1e-3?(q.sx>0?'e':'w'):null;dir8=DIR8[((Math.round(Math.atan2(q.sy,q.sx)/(Math.PI/4))%8)+8)%8];}
  else{/* 막혀서 거의 못 움직였으면 입력 방향 */const vx=num(p.moveVX150),vy=num(p.moveVY150);if(Math.hypot(vx,vy)>.05){const r=screenOf(vx,vy);side=Math.abs(r.sx)>1e-3?(r.sx>0?'e':'w'):null;}}
  S.dash={t0:t,side,dir8};stats.dashes++;}
 if(!(da>0))S.dash=null;
 Object.assign(S,{t,x:num(p.x),y:num(p.y),hero:p.hero,at,sk,ul,da,hu,mv});return S;}
const on=()=>prefs.on&&solo();
// 규칙 2: 이동 캔슬 — kind 'attack' | 'skill'. 커밋 창이 지났고 이동 입력이 있으면 true.
function moveCancel(kind){try{if(!on())return false;const s=sample(),p=P();if(!p||!s.mv||s.da>0)return false;const t=s.t;
  if(kind==='skill'){if(!(s.sk>0||s.ul>0))return false;if(t-s.castT0<RULES.skillCommit)return false;stats.moveCancels.skill++;return true;}
  if((s.sk>0||s.ul>0)&&!(s.at>0))return moveCancel('skill');/* R440 이 스킬을 공격 휘두르기로 보일 때는 스킬 커밋을 따른다 */
  if(!(s.at>0)&&t-s.atkT0>1.5)return false;if(t-s.atkT0<RULES.attackCommit)return false;stats.moveCancels.attack++;return true;}catch(e){fail(e);return false;}}
// 규칙 1: 피격이 기본 공격을 끊는가 — 대시·스킬·궁극기 중(슈퍼아머)이 아니면 true.
function hurtFirst(){try{if(!on())return false;const s=sample();return s.hu>0&&!(s.da>0||s.sk>0||s.ul>0);}catch(e){fail(e);return false;}}
// 규칙 6: 피격 반응을 지금 시작해도 되는가(맞은 지 0.12초 안).
function hurtFresh(t0){const s=sample();return s.t-(t0??s.hurtT0)<=RULES.hurtLate+1e-6;}
// 규칙 5: 멈춘 직후 시작한 공격이 걷기 꼬리를 이긴다.
function attackOverTail(){try{if(!on())return false;const s=sample();return s.at>0&&!s.mv&&s.atkT0>=s.moveEndT-1e-6&&s.t-s.moveEndT<RULES.stopAttack;}catch(e){fail(e);return false;}}
// 규칙 4: 대시 방향(화면 좌·우). 대시 중이 아니면 null.
function dash(){try{if(!on())return null;const s=sample();return s.da>0&&s.dash?{...s.dash}:null;}catch(e){fail(e);return null;}}
// 규칙 3: 지금 시전의 시작 시각(합친 값).
function castStart(){return sample().castT0;}
function fail(e){stats.errors++;lastError=String(e?.message||e).slice(0,160);}
// 안전망: 대시 중 몸 그림이 대시 반대쪽(좌·우)을 보면 발밑 세로선을 축으로 좌우를 뒤집는다(엔진 'move-right' 대시 그림·적 쪽을 보던 덧씌우기).
const BODY=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/(?:attack|hit|skill|ultimate|guard|dash)\/|r164\/|r242\/hwando\/|r271\/hwando\/|r283\/hwando\/|r351\/slayer\/|r389\/slayer\/|r436\/hwando\/|r437\/|r439\/|r445\/slayer\/|r425\/hunter\/|^blob:/;
const NOT_BODY=/fx|effect|thread|pixel|sigil|aura|ring|barrier|shadow/i;
function faceOf(c){const name=String(c.sourcePath||c.image?.src||'').split('?')[0].split('/').pop();const m=/(?:^|[-_])(e|w|ne|se|nw|sw|right|left|r|l)(?=[-_.])/i.exec(name);if(!m)return 0;const d=m[1].toLowerCase();const f=/^(e|ne|se|right|r)$/.test(d)?1:-1;const mir=(c.points[1][0]-c.points[0][0])<0;return mir?-f:f;}
function fixDash(rec,st){const d=dash();if(!d||!d.side)return;let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!Array.isArray(c.points)||c.points.length<4)continue;const s=String(c.sourcePath||c.image?.src||'');if(!BODY.test(s)||NOT_BODY.test(s.split('/').pop()))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 if(!best)return;const f=faceOf(best),want=d.side==='e'?1:-1;if(!f||f===want)return;const q=typeof project==='function'?project(player.x,player.y):null,ax=q?q.x:(best.points[2][0]+best.points[3][0])/2;
 best.points=best.points.map(([x,y])=>[2*ax-x,y]);best.r720DashFlip=true;stats.dashFlips++;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;try{sample();}catch(e){fail(e);}const r=base.apply(this,a);
 try{if(st>=0&&on()&&P()?.hp>0)fixDash(rec,st);}catch(e){fail(e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return prefs[k];}
window.__STORYWORLD_HERO_MOTION_R720__=Object.freeze({revision:REV,RULES,moveCancel,hurtFirst,hurtFresh,attackOverTail,dash,castStart,sample:()=>({...sample(),dash:S.dash&&{...S.dash}}),faceOf,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats,moveCancels:{...stats.moveCancels}},lastError,browser:false,GPU:false})});
})();
