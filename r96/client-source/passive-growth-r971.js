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
//  R1207(사용자 2026-11-19 07:17Z "특수확률발동패시브 최대확률 77.7프로까지 상향 … 11.1프로가 기본해서 7단계 77.7프로로 비례해서 데미지는 줄여줘(체력비례뎀은 유지)", "모든영웅임"):
//     한 굴림 합계 확률 = 0단계 11.1% → 7단계 77.7% 직선(단계마다 +9.514%p). 예전 값(위 ×1.07·단계, 40% 상한)이 곡선보다 높으면 낮추지 않는다(환도 27%·슬레이어 32%·기억사수 20% 초반).
//     갈래·개별 보정(근처 적 수, 페르소나 은빛 거성, EGO 천체 공명)은 영웅 기본 합계 대비 같은 비율로 오르고, 굴림 합계 77.7% 에서 자른다.
//     R1207-2(사용자 07:27Z "재발동대기 그것도 높여서 … 발동 자체가 더 자주 대신 데미지는 줄이는 방향"): 재발동 대기 ×(1−0.07·단계)(최대 ×0.51, 예전 ×(1−0.03·단계)).
//     damage(영웅) = 예전 초당 발동 수 ÷ 새 초당 발동 수(같은 단계, 0~1, 굴림 간격 0.35초·영웅 대표 대기로 계산) — 모듈이 고정 피해(공격력 배율)에 곱한다. 굴림당 기대 피해는 예전과 같다. 체력 비례 피해는 모듈이 곱하지 않는다.
//  새 키·저장 필드·자산 없음. 끄기: __STORYWORLD_PASSIVE_GROWTH_R971__.set(false) (단계 기록은 남음).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PASSIVE_GROWTH_R971__)return;
const REV='R1207-passive-chance-2',ID='heroPassiveR971',MAXR=7,CH_STEP=.07,HARD=.40,CD_OLD=.03,CD_STEP=.07,MIN=.111,MAX=.777,GAP=.35;
// R1207 영웅별 기본(0단계, 모든 갈래 해금) 굴림 합계. ego = EGO 천체 공명 갈래(라우렌 10% 틀). 페르소나는 라우렌.
const BASE={hwando:.27,lauren:.10,slayer:.32,michaela:.11,seoha:.05,neon:.09,hunter:.09,gunner:.20,ego:.10};
// R1207-2 영웅별 대표 재발동 대기(갈래가 여럿이면 확률 가중 평균, 초). 초당 발동 수 = 1/(대기 + 굴림 간격/확률).
const ICD={hwando:(.18*1.2+.06*7+.03*20)/.27,lauren:5,slayer:(.2*.9+.08*6+.04*14)/.32,michaela:5,seoha:14,neon:6,hunter:21,gunner:(.10*16+.07*10+.03*34)/.20,ego:5};
const NAMES={hwando:'수묵 의협(묵월·칠묵영·삼협묵희)',lauren:'천체 공명',slayer:'피 패시브(혈침·성혈검우·혈격자)',michaela:'사랑의 처방',seoha:'겹친 시간',neon:'독전 회로',hunter:'사냥 분대',gunner:'기억사수(잔영 위장·표적 소거 난사·귀환 전우)'};
let on=true,cached=0,lastError=null;const stats={queries:0,scaled:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const P62=()=>window.__STORYWORLD_PROGRESSION_R62__;
const G=()=>{try{return typeof player==='object'&&player?player:null;}catch(_){return null;}};
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const clampRank=v=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.max(0,Math.min(MAXR,v)):0;};
function rank(){const p=G();if(!p)return cached;if(isBody(p))return cached;try{cached=clampRank(P62()?.ranks?.(ID,p));}catch(e){fail(e);}return cached;}
const mult=r=>1+CH_STEP*r,cdMult=r=>1-CD_STEP*r,cdOld=r=>1-CD_OLD*r;
const fin=v=>Number.isFinite(v)&&v>0?v:0;
// R1207: 예전 합계(R971 ×1.07·단계, 40% 상한) · 새 곡선(11.1%→77.7%) · 새 합계 = max(예전, 곡선) ≤ 77.7%.
const curve=r=>MIN+(MAX-MIN)*r/MAXR;
const oldTotal=(b,r)=>Math.min(b*mult(r),Math.max(b,HARD));
const newTotal=(b,r)=>Math.min(Math.max(MAX,b),Math.max(oldTotal(b,r),curve(r)));
const rankNow=()=>{try{return on?rank():0;}catch(e){fail(e);return 0;}};
const baseOf=(hero,sum)=>fin(BASE[hero])||sum;
// 발동 확률 묶음(한 번의 굴림에 쓰는 갈래들) → 같은 길이의 새 배열. 꺼짐이면 같은 값 그대로.
function chances(hero,arr){stats.queries++;if(!Array.isArray(arr))return[];const base=arr.map(fin);
 try{if(!on)return base;const r=rankNow(),sum=base.reduce((a,b)=>a+b,0);if(!(sum>0))return base;const b=baseOf(hero,sum);
  let k=newTotal(b,r)/b;if(!(Number.isFinite(k)&&k>0))return base;const cap=Math.max(MAX,sum);if(sum*k>cap)k=cap/sum;stats.scaled++;return base.map(v=>v*k);}
 catch(e){fail(e);return base;}}
// 지금 단계 영웅 기본 굴림 합계(설명·검사용)
function total(hero){const b=fin(BASE[hero])||.10;return on?newTotal(b,rankNow()):b;}
// 고정 피해 배율 = 예전 초당 발동 수 ÷ 새 초당 발동 수(0~1, R1207-2: 대기도 ×(1−.07·단계)로 줄어 더 자주 발동). 체력 비례 피해에는 쓰지 않는다.
const rate=(p,icd)=>p>0?1/(icd+GAP/p):0;
function damage(hero){try{if(!on)return 1;const b=fin(BASE[hero])||.10,icd=fin(ICD[hero])||5,r=rankNow(),v=rate(oldTotal(b,r),icd*cdOld(r))/rate(newTotal(b,r),icd*cdMult(r));return Number.isFinite(v)&&v>0?Math.min(1,v):1;}catch(e){fail(e);return 1;}}
function cooldown(hero,sec){if(!Number.isFinite(sec)||sec<=0)return sec;try{const r=on?rank():0;return r>0?sec*cdMult(r):sec;}catch(e){fail(e);return sec;}}
const pct=v=>(v*100).toFixed(1).replace(/\.0$/,'')+'%';
function addDef(){const A=P62();if(!A||!Array.isArray(A.defs))return false;if(A.defs.some(d=>d&&d.id===ID))return true;
 A.defs.push({id:ID,icon:'ego',maxRank:MAXR,
  get name(){const h=G()?.hero;return '특수 패시브 · '+(NAMES[h]||'확률 발동');},
  get cost(){return Math.min(MAXR,rank()+1);},
  get text(){const r=rank(),nx=Math.min(MAXR,r+1),h=G()?.hero,hk=BASE[h]?h:'lauren';
   return '발동 확률 '+pct(curve(r))+(r<MAXR?' → '+pct(curve(nx)):' (최대)')+
    ' · 고정 피해 ×'+damage(hk).toFixed(2)+' · 재발동 대기 ×'+cdMult(r).toFixed(2)+(r<MAXR?' → ×'+cdMult(nx).toFixed(2):'')+
    '. 지금 영웅의 확률 발동 특수 패시브를 강화합니다. 기본 11.1%에서 7단계 77.7%까지 오르고(원래 더 높던 패시브는 낮추지 않음), 재발동 대기도 단계마다 7%씩 줄어(최대 ×0.51) 더 자주 발동하고, 그만큼 고정 피해는 줄어 초당 기대 피해는 예전과 비슷합니다. 체력 비례 피해는 그대로. 비용 = 다음 단계(1~7점).';}});
 return true;}
function boot(){try{addDef();}catch(e){fail(e);}}
boot();
try{window.addEventListener?.('load',boot);}catch(_){}
window.__STORYWORLD_PASSIVE_GROWTH_R971__=Object.freeze({revision:REV,id:ID,chances,cooldown,rank,total,damage,curve,set(v){on=!!v;return on;},
 inspect:()=>({revision:REV,on,rank:rank(),maxRank:MAXR,curve:curve(rankNow()),min:MIN,max:MAX,chanceMult:mult(rank()),cooldownMult:cdMult(rank()),hard:HARD,stats:{...stats},lastError})});
})();
