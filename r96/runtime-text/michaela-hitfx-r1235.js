/* R1235 미카엘라 기본탄 적중 그림 정리 (사용자 2026-11-19 11:50Z "미카엘라적에게 공격적중시 … 일정공격이 나왔다가 사라지기를 빠르게 반복해 이거 이미지 번잡스럽지 않게 개선",
 *  11:34Z "미카엘라 영웅 이펙트중 아직 프레임애니메이션 아닌 이펙트는 프레임애니메이션으로 개선적용")
 * 헤드리스 측정(qa/r1235/hitlog.mjs, 기본공격 0.47초 간격): 도트 피해는 없었다. 기본탄 한 발 적중마다
 *  ① 엔진 burst(burst-impact 한 장, 0.2초) ② 엔진 e568HeroImpact(seraph-spark 한 장, 0.24초) ③ R912 하트 적중 시트(6칸, 0.43초)
 * 가 같은 자리에 겹쳐 생겨, 한 장짜리 둘이 0.2초 남짓 번쩍였다 사라지기를 공격마다 되풀이했다.
 * 고침: 미카엘라 기본탄(michaela-a, R160 기본 표시) 적중 동안 만들어지는 ①② 한 장짜리 그림만 만들지 않는다 → 적중은 Dots 하트 적중 프레임 시트 하나.
 * 하트 패시브(R948) 적중도 같다(하트 적중 시트를 따로 그림). 피해·판정·피해 숫자·연타·소리·다른 영웅·스킬 적중은 그대로. 설정 storyworld.r1235.michaelaHitFx {"on":false} 로 끄면 예전 그대로.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_MICHAELA_HITFX_R1235__)return;
const REV='R1235-michaela-hitfx-1',KEY='storyworld.r1235.michaelaHitFx',HERO='michaela',ASSET=/(?:^|\/)michaela-a\.webp(?:[?#]|$)/,DROP=new Set(['burst','e568HeroImpact']);
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hits:0,dropped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let inHit=0;
const basicShot=s=>(s.r160Basic===true||s.attackKind9==='basic')&&(!s.attackKind9||s.attackKind9==='basic')&&ASSET.test(String(s.asset||''));
/* R948 사랑의 처방(하트 세례·오르골탑·대개화) 적중도 같은 한 장짜리 둘이 붙는다 — 그 적중은 R948 이 하트 적중 시트(heart-hit6·heart-burst16)를 따로 그린다 */
const heartHit=s=>s.r948===true&&s.sourceHero===HERO&&typeof s.kind==='string'&&s.kind.startsWith('r948-');
const mine=s=>{try{return prefs.on!==false&&!!s&&typeof s==='object'&&s.friendly&&s.owner==='hero'&&(basicShot(s)||heartHit(s))&&typeof player==='object'&&!!player&&player.hero===HERO&&!(+player.samong>0);}catch(_){return false;}};
function wrapHit(){if(typeof hitEnemy!=='function'||hitEnemy.r1235)return;const base=hitEnemy;const w=function(e,v,s,...r){
  const m=mine(s);if(!m)return base.apply(this,arguments);stats.hits++;inHit++;try{return base.apply(this,arguments);}finally{inHit--;}};
 w.r1235=true;hitEnemy=w;}
function wrapFx(){if(typeof fx!=='function'||fx.r1235)return;const base=fx;const w=function(type,x,y,o,...r){
  if(inHit>0&&DROP.has(type)){stats.dropped++;/* 효과 목록에 넣지 않은 빈 효과(부른 쪽이 값을 만져도 무해) */return{type,x,y,life:0,age:1,dead:true,r1235Dropped:true};}
  return base.apply(this,arguments);};
 w.r1235=true;fx=w;}
function install(){try{wrapFx();wrapHit();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_MICHAELA_HITFX_R1235__=Object.freeze({revision:REV,DROP:[...DROP],set,install,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
