// R1064 공격 그림이 없는 몹의 임시 내딛기 — 사용자 2026-11-15 14:55Z 밤샘 지시 "몹들 모션 … 버그 개선".
//  실측(밤샘, 25구역 몹을 불사로 묶고 실제 공격시킴): 273종 중 11종(붉은 하이힐 칼날·립스틱 탄환·불길 속의 용·개와 늑대의 시간·
//  강철 턱의 사이보그 개·시간수문장 28·끊어진 통화의 인과 잔향·태엽 수집자·보랏빛 알집지기 등)은 공격하는 동안에도 걷기 그림만 그려져
//  제자리에서 걷는 시늉만 하다 피해가 들어갔다. R286 은 R109 표로 '공격 칸 있음'이라 보고(뒤에 붙은 R380 등 그림 공급자가 그림을 바꿈) 내딛기를 주지 않았다.
//  ① 판정(그리기에서 직접, R613 과 같은 방식): 몹마다 평소(공격·맞음·조준 아님)에 그린 몸 그림(원본 경로+칸)을 모으고,
//     그림 열쇠는 '원본 경로+칸의 줄(y·높이)' — 가로 한 줄 걷기 시트는 어느 칸이든 같은 열쇠, 아틀라스의 공격 줄은 다른 열쇠가 된다.
//     공격 하나 동안 그린 몸 그림이 모두 평소 그림 안에 있으면 '그림 없음' 1회. 2회면 'lunge', 공격에서 새 그림이 한 번이라도 나오면 'art'(손대지 않음).
//     → Dots CX-0112MA 공격 시트가 붙으면 공격 중 새 그림이 나오므로 저절로 'art' 가 되어 꺼진다.
//  ② 'lunge' 몹이 공격하는 동안만 그리는 자리를 R286 과 같은 '젖힘 → 옆걸음 → 영웅 쪽으로 내딛기 → 제자리' 로 옮긴다(R286 lungeOffset 을 그대로 씀).
//     판정·피해·시간·세이브는 엔진 그대로(공격 시작 때 찍힌 origin154·footprint154 로 맞힌다). 그린 뒤 위치는 바로 되돌린다.
//  손대지 않음: 보스·중간보스·페르소나(R620), 병원 ep1a08(R51~R53 전용 자세), 고정형, R286 이 이미 내딛기를 주는 move-only·static·idle-only.
//  임시 연출이며 최종 그림이 아니다(정식본 Dots CX-0112MA).
//  끄기: localStorage['storyworld.r1064.moblunge']='{"on":false}'. 점검: window.__STORYWORLD_MOB_LUNGE_R1064__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_LUNGE_R1064__)return;
const REV='R1064-mob-lunge-1',KEY='storyworld.r1064.moblunge',NEED=2,MIN_ATK=4,MIN_CALM=6,MAX_OFF=.6;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={draws:0,lunges:0,lungeDraws:0,decided:0,rejected:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame-fx|death|dissol|burn|original-actor-canvas/i;
const zoneId=()=>{try{return String((typeof room==='object'&&room?.id)||'');}catch(_){return '';}};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.wardChampionR81===true));
const fixed=e=>!!(e&&(e.stationary||e.prop||e.object||e.r193Doll||e.r193Tower||e.r170Tower||e.r75Tower||e.r251Circle||e.samongDollR193));
const R286=()=>{try{return window.__STORYWORLD_MOB_MOTION_R286__||null;}catch(_){return null;}};
function eligible(e){if(!e||!(e.hp>0)||e.spawnState==='dead'||major(e)||fixed(e))return false;if(zoneId()==='ep1a08')return false;
 try{const k=R286()?.kindOf?.(e);if(k==='move-only'||k==='static'||k==='idle-only'||k==='major')return false;}catch(_){}
 // R1064b: R380 승인 시트에 공격 칸이 2칸 넘게 있으면 진짜 공격 그림이 있다(같은 줄 시트라 열쇠로는 못 가름 — 보랏빛 알집지기) → 손대지 않음
 try{const m=window.__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e);if(m&&Array.isArray(m.attack)&&new Set(m.attack).size>1)return false;}catch(_){}
 return true;}
const realAtk=e=>!!(e.attack&&!e.attack.r286Fake&&Number.isFinite(e.attack.elapsed));
const calm=e=>!e.attack&&!(e.rangedWindup>0)&&!(e.hitTimer>0)&&!e.r286?.mode&&!e.charging&&!e.dashing;
// ---- 판정 기록 ----
const S=new WeakMap();
function rec(e){let r=S.get(e);if(!r)S.set(e,r={calm:new Map(),calmN:0,cur:null,none:0,art:0,verdict:null});return r;}
function close(r){const c=r.cur;r.cur=null;if(!c||c.n<MIN_ATK||r.verdict==='art')return;
 if(c.keys.size&&[...c.keys].some(k=>!r.calm.has(k))){r.art++;if(r.verdict!=='art'){r.verdict='art';stats.decided++;}return;}
 if(r.calmN>=MIN_CALM){r.none++;if(!r.verdict&&r.none>=NEED){r.verdict='lunge';stats.decided++;}}}
function sample(e,r,key){if(!key)return;if(realAtk(e)){const id=e.attack.id??e.attack;if(!r.cur||r.cur.id!==id){close(r);r.cur={id,keys:new Set(),n:0};}r.cur.keys.add(key);r.cur.n++;}
 else{if(r.cur)close(r);if(calm(e)){r.calm.set(key,(r.calm.get(key)||0)+1);r.calmN++;}}}
function bodyKey(C,st){if(!Array.isArray(C)||!(st>=0))return null;let best=null;for(let i=st;i<C.length;i++){const k=C[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;
 const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(!src||FX.test(src))continue;const P=k.points;
 const ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!best||ar>best.ar){const SR=Array.isArray(k.sourceRect)?k.sourceRect:null;best={ar,key:src+'|'+(SR?Math.round(+SR[1]||0)+','+Math.round(+SR[3]||0):'')};}}return best?best.key:null;}
// ---- 내딛기 모양: R286 과 같은 함수(없으면 같은 모양의 사본) ----
function ownLunge(t,sh,a,side){const SIDE=.3,REACH=.42,ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.15),rec=Math.max(.1,Number(sh.recovery)||.35);
 let f=0,p=0;if(t<w){const u=t/w;p=SIDE*side*Math.sin(Math.PI*u);f=-.12*ease(u);}else if(t<w+act){f=-.12+(REACH+.12)*ease((t-w)/act);}else f=REACH*(1-ease((t-w-act)/rec));
 const cx=Math.cos(a),cy=Math.sin(a);return [cx*f-cy*p,cy*f+cx*p];}
function offset(e){const A=e.attack,sh=A.shape154||e.combatProfile?.attackShape||{},side=((Number(A.id)||0)%2)?1:-1;
 const ang=Number.isFinite(A.angle)?A.angle:(()=>{try{return Math.atan2(player.y-e.y,player.x-e.x);}catch(_){return 0;}})();
 let o=null;const L=R286()?.lungeOffset;try{o=typeof L==='function'?L(A.elapsed,sh,ang,side):ownLunge(A.elapsed,sh,ang,side);}catch(err){fail(err);return null;}
 if(!Array.isArray(o)||!Number.isFinite(o[0])||!Number.isFinite(o[1])){stats.rejected++;return null;}
 const m=Math.hypot(o[0],o[1]);if(m>MAX_OFF){o=[o[0]*MAX_OFF/m,o[1]*MAX_OFF/m];}return o;}
// ---- 사슬 연결 ----
let depth=0;
function draw(base,self,e,a){let r=null,saved=null,C=null,st=-1;
 try{stats.draws++;r=rec(e);
  if(prefs.on&&r.verdict==='lunge'&&realAtk(e)){const o=offset(e);if(o){saved={x:e.x,y:e.y};e.x+=o[0];e.y+=o[1];stats.lungeDraws++;if(e.attack.r1064!==true){e.attack.r1064=true;stats.lunges++;}}}
  C=(typeof ctx!=='undefined'&&ctx&&Array.isArray(ctx.commands))?ctx.commands:null;st=C?C.length:-1;}catch(err){fail(err);}
 try{return base.call(self,e,...a);}
 finally{if(saved){e.x=saved.x;e.y=saved.y;}try{if(r&&C)sample(e,r,bodyKey(C,st));}catch(err){fail(err);}}}
function install(){if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r1064)return true;const base=drawEnemy;
 const w=function(e,...a){if(depth>0||!eligible(e))return base.call(this,e,...a);depth++;try{return draw(base,this,e,a);}finally{depth--;}};
 w.__r1064=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}return true;}
install();
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
function verdictsNow(){const out={};try{for(const e of (typeof room==='object'&&room?.enemies)||[]){const r=e&&S.get(e);if(r?.verdict){const k=String(e.nativeId||e.name||'?');out[k]=r.verdict;}}}catch(_){}return out;}
window.__STORYWORLD_MOB_LUNGE_R1064__=Object.freeze({revision:REV,set,verdict:e=>{const r=e&&S.get(e);return r?r.verdict:null;},eligible:e=>eligible(e),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},verdicts:verdictsNow(),lastError})});
})();
