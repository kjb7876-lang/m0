// R971 — 영웅 특수 패시브(확률 발동) 강화 (사용자 2026-11-13 00:47Z "영웅들 특수패시브스킬도 확률등 스킬포인트로 업그레이드 가능하도록").
//  · 기존 패시브 포인트(R62 P 창·저장·구매 규칙)에 카드 하나 'heroPassiveR971' 를 더한다. 이름·설명은 지금 영웅의 특수 패시브를 따른다.
//    1~7단계(사용자 01:24Z "7단계7프로씩"), 비용 = 다음 단계(1~7점, 모두 28점). 자동 스킬레벨업(R237)도 산다.
//  · 효과(보수적으로, 0단계는 지금과 똑같다):
//     발동 확률 단계마다 +7% — ×(1 + 0.07·단계), 최대 ×1.49. 한 번의 굴림 합계 절대 상한 40%(원래 40% 넘던 값은 그대로). 갈래가 여럿이면 비율을 지키며 늘린다. 각 모듈의 자체 상한(CHANCE_MAX)은 모듈이 그대로 자른다.
//     재발동 대기 ×(1 − 0.03·단계) — 최대 ×0.79.
//    피해·범위·지속·기술 내용은 바꾸지 않는다(환도 E 대시 등 일반 스킬도 무관).
//  · 패시브 8개 모듈(R945 환도·R946 라우렌·R947 슬레이어·R948 미카엘라·R949 서하·R951 네온·R952 헌터·R953 기억사수)이
//    굴림·대기를 정할 때 이 API(chances·cooldown)를 묻는다. 이 파일이 없거나 오류가 나면 원래 값 그대로.
//  · 배치·소환 영웅 몸(R720 r720Ally·R949 r949Summon·R952 r952Body)이 player 자리에 끼워져 있을 때는 조종 영웅의 단계를 쓴다.
//  새 키·저장 필드·자산 없음. 끄기: __STORYWORLD_PASSIVE_GROWTH_R971__.set(false) (단계 기록은 남음).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PASSIVE_GROWTH_R971__)return;
const REV='R971-passive-growth-2',ID='heroPassiveR971',MAXR=7,CH_STEP=.07,HARD=.40,CD_STEP=.03;
const NAMES={hwando:'수묵 의협(묵월·칠묵영·삼협묵희)',lauren:'천체 공명',slayer:'피 패시브(혈침·성혈검우·혈격자)',michaela:'사랑의 처방',seoha:'겹친 시간',neon:'독전 회로',hunter:'사냥 분대',gunner:'기억사수(잔영 위장·표적 소거 난사·귀환 전우)'};
let on=true,cached=0,lastError=null;const stats={queries:0,scaled:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__;
const G=()=>{try{return typeof player==='object'&&player?player:null;}catch(_){return null;}};
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const clampRank=v=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.max(0,Math.min(MAXR,v)):0;};
function rank(){const p=G();if(!p)return cached;if(isBody(p))return cached;try{cached=clampRank(P62()?.ranks?.(ID,p));}catch(e){fail(e);}return cached;}
const mult=r=>1+CH_STEP*r,cdMult=r=>1-CD_STEP*r;
const fin=v=>Number.isFinite(v)&&v>0?v:0;
// 발동 확률 묶음(한 번의 굴림에 쓰는 갈래들) → 같은 길이의 새 배열. 0단계·꺼짐이면 같은 값 그대로.
function chances(hero,arr){stats.queries++;if(!Array.isArray(arr))return[];const base=arr.map(fin);
 try{const r=on?rank():0;if(!(r>0))return base;const sum=base.reduce((a,b)=>a+b,0);if(!(sum>0))return base;
  const target=Math.min(sum*mult(r),Math.max(sum,HARD));if(!(target>sum))return base;const k=target/sum;stats.scaled++;return base.map(v=>v*k);}
 catch(e){fail(e);return base;}}
function cooldown(hero,sec){if(!Number.isFinite(sec)||sec<=0)return sec;try{const r=on?rank():0;return r>0?sec*cdMult(r):sec;}catch(e){fail(e);return sec;}}
const pct=v=>(v*100).toFixed(1).replace(/\.0$/,'')+'%';
function addDef(){const A=P62();if(!A||!Array.isArray(A.defs))return false;if(A.defs.some(d=>d&&d.id===ID))return true;
 A.defs.push({id:ID,icon:'ego',maxRank:MAXR,
  get name(){const h=G()?.hero;return '특수 패시브 · '+(NAMES[h]||'확률 발동');},
  get cost(){return Math.min(MAXR,rank()+1);},
  get text(){const r=rank(),nx=Math.min(MAXR,r+1);
   return '발동 확률 ×'+mult(r).toFixed(2)+(r<MAXR?' → ×'+mult(nx).toFixed(2):' (최대)')+
    ' · 재발동 대기 ×'+cdMult(r).toFixed(2)+(r<MAXR?' → ×'+cdMult(nx).toFixed(2):'')+
    '. 지금 영웅의 확률 발동 특수 패시브를 강화합니다. 단계마다 발동 확률 +7%(최대 7단계 ×1.49), 한 번의 굴림 합계 상한 40%, 각 패시브 자체 상한도 그대로. 피해·범위·지속은 바뀌지 않습니다. 비용 = 다음 단계(1~7점).';}});
 return true;}
function boot(){try{addDef();}catch(e){fail(e);}}
boot();
try{window.addEventListener?.('load',boot);}catch(_){}
window.__STORYWORLD_PASSIVE_GROWTH_R971__=Object.freeze({revision:REV,id:ID,chances,cooldown,rank,set(v){on=!!v;return on;},
 inspect:()=>({revision:REV,on,rank:rank(),maxRank:MAXR,chanceMult:mult(rank()),cooldownMult:cdMult(rank()),hard:HARD,stats:{...stats},lastError})});
})();
