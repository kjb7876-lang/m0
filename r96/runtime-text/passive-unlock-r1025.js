// R1025 — 영웅 특수 패시브(확률 발동) 레벨별 순차 해금 (사용자 2026-11-14 01:43Z
//  "영웅별 특수확률발동패시브 어느정도 레벨올랐을때 순차적 풀리도록 ... 아직 영웅서사가 진행되지 않은경우에는 그영웅이 소환안되도록
//   (무한생존모드는 서사진행안되도 풀려도됨 ... 비교적 빠른레벨에 풀리게)").
//  · 영웅마다 갈래 3단(흔한 것 → 드문 것). 문턱: 스토리(영화 모드 포함) 영웅 레벨 5·15·30 / 무한생존 생존 레벨 2·4·7.
//  · 8개 패시브 모듈(R945~R953)이 굴림·뽑기 때 이 API 를 묻는다(mask·share·weights·unlocked). 이 파일이 없거나 오류면 원래 동작.
//  · 소환되는 다른 영웅(서하 평행세계 소집·헌터 혈맹 호출의 슬레이어)은 스토리에서 그 영웅 서사 지역에 들어선 뒤에만(summonOpen).
//    서사 지역은 영화 모드 R461 의 화자→영웅 규칙(사용자 2026-11-09)과 같다: 의목사 A → 헌터·슬레이어(dreamRest), 미카엘라의 기억(restEp1b),
//    의목사 B → 기억사수(u201), 환도의 기억(restU2), 윤서하의 기억(kair01). 화자가 아닌 라우렌은 처음 이름이 나오는 hando03,
//    정본에 나오지 않는 네온은 스토리에서 소환되지 않는다. 무한생존은 서사와 무관하게 늘 열림.
//  · 공유 코드 하나, 모드별로 문턱만 다르다. 새 키·저장 필드·자산 없음. 끄기: localStorage storyworld.r1025.unlock = 0.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PASSIVE_UNLOCK_R1025__)return;
const REV='R1025-passive-unlock-1',LS='storyworld.r1025.unlock';
const LEVELS=Object.freeze({story:Object.freeze([5,15,30]),survival:Object.freeze([2,4,7])});
const T=(a,b,c)=>Object.freeze([Object.freeze(a),Object.freeze(b),Object.freeze(c)]);
const TIERS=Object.freeze({hwando:T(['moon'],['clones'],['trio']),lauren:T(['repulse'],['red','blue'],['meteor','violet']),slayer:T(['needle'],['swords'],['lattice']),
 michaela:T(['volley'],['tower'],['bloom']),seoha:T(['collapse'],['heroes'],['arbelia']),neon:T(['lance'],['fog'],['storm']),hunter:T(['call'],['shade'],['squad']),gunner:T(['cloak'],['barrage'],['summon'])});
// 각 모듈의 원래 비중(뽑기·확률) — 열린 몫 계산용(합 1 로 정규화)
const WEIGHT=Object.freeze({hwando:{moon:.18,clones:.06,trio:.03},lauren:{repulse:.28,red:.24,blue:.24,meteor:.24,violet:0},slayer:{needle:.2,swords:.08,lattice:.04},
 michaela:{volley:.55,tower:.30,bloom:.15},seoha:{collapse:.5,heroes:.3,arbelia:.2},neon:{lance:.55,fog:.33,storm:.12},hunter:{call:.6,shade:.28,squad:.12},gunner:{cloak:.10,barrage:.07,summon:.03}});
const NAMES=Object.freeze({moon:'묵월',clones:'칠묵영',trio:'삼협묵희',repulse:'항성 반발',red:'은빛 거성',blue:'심연 왜성',meteor:'유성 궤도',violet:'쌍성 소멸',
 needle:'혈침',swords:'성혈검우',lattice:'혈격자',volley:'하트 세례',tower:'쉼터 오르골탑',bloom:'연심 대개화',collapse:'시간 붕괴',heroes:'평행세계 소집',arbelia:'수문장 아르벨리아',
 lance:'쌍갈래 뇌창',fog:'생화학 경보',storm:'천공 낙뢰',call:'혈맹 호출',shade:'혈영 강습',squad:'기러기진 섬멸',cloak:'잔영 위장',barrage:'표적 소거 난사',summon:'귀환 전우'});
const GATE=Object.freeze({hunter:'dreamRest',slayer:'dreamRest',michaela:'restEp1b',gunner:'u201',hwando:'restU2',seoha:'kair01',lauren:'hando03',neon:null});
let on=true;try{const v=localStorage.getItem(LS);if(v==='0'||v==='false')on=false;}catch(_){}
const stats={queries:0,masked:0,summonBlocked:0,toasts:0,errors:0};let lastError=null,cachedLv=1,cachedHero=null,lastTick=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const P=()=>G(()=>typeof player==='object'&&player?player:null,null);
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const SV=()=>G(()=>window.__STORYWORLD_SURVIVAL_R600__,null);
function mode(){return G(()=>!!SV()?.here?.(),false)?'survival':'story';}
const toLv=v=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.max(0,v):0;};
function level(){if(mode()==='survival')return toLv(G(()=>SV().state().lv,1));const p=P();if(p&&!isBody(p)){cachedLv=toLv(p.level);cachedHero=p.hero;}return cachedLv;}
function tierOf(hero,kind){const t=TIERS[hero];if(!t)return -1;for(let i=0;i<3;i++)if(t[i].includes(kind))return i;return -1;}
function unlocked(hero,kind){stats.queries++;if(!on)return true;try{const i=tierOf(hero,kind);if(i<0)return true;return level()>=LEVELS[mode()][i];}catch(e){fail(e);return true;}}
// 갈래별 확률 배열 → 잠긴 갈래 0(길이·순서 유지, 이상값 0)
function mask(hero,arr,kinds){if(!Array.isArray(arr))return[];return arr.map((v,i)=>{v=Number(v);if(!(Number.isFinite(v)&&v>0))return 0;if(!unlocked(hero,kinds&&kinds[i])){stats.masked++;return 0;}return v;});}
// 한 확률 + 비중 뽑기 모듈: 확률에 곱할 열린 몫(0~1)
function share(hero){if(!on)return 1;const w=WEIGHT[hero];if(!w)return 1;let a=0,s=0;for(const[k,v]of Object.entries(w)){s+=v;if(unlocked(hero,k))a+=v;}return s>0?Math.max(0,Math.min(1,a/s)):1;}
// [[k,w]...] 또는 {k:w} → 열린 갈래만(형식 유지)
function weights(hero,ws){if(Array.isArray(ws))return ws.filter(x=>x&&unlocked(hero,x[0]));const o={};for(const k of Object.keys(ws||{}))if(unlocked(hero,k))o[k]=ws[k];return o;}
function storyOpen(id){const z=GATE[id];if(z===undefined)return true;if(z===null)return false;
 const vs=G(()=>visited,null);if(vs&&typeof vs.has==='function'&&(vs.has('STORY:'+z)||vs.has('DREAM:'+z)))return true;
 const pr=G(()=>progress,null);return !!(pr&&((pr.STORY&&pr.STORY[z])||(pr.DREAM&&pr.DREAM[z])));}
function summonOpen(id){if(!on||mode()==='survival')return true;try{const o=storyOpen(id);if(!o)stats.summonBlocked++;return o;}catch(e){fail(e);return true;}}
// 레벨이 문턱을 넘으면 조종 영웅 갈래 이름으로 알림(한 번씩)
function tick(){try{const p=P();if(!p||isBody(p)||!on)return;const h=p.hero,t=TIERS[h];if(!t)return;const lv=level(),m=mode(),key=m+':'+h;
 if(!lastTick||lastTick.key!==key){lastTick={key,lv};return;}const L=LEVELS[m];
 for(let i=0;i<3;i++)if(lastTick.lv<L[i]&&lv>=L[i]){const msg='특수 패시브 해금 · '+t[i].map(k=>NAMES[k]).join('·')+' (Lv.'+L[i]+')';stats.toasts++;try{if(typeof toast==='function')toast(msg);}catch(_){}}
 lastTick.lv=lv;}catch(e){fail(e);}}
try{setInterval?.(tick,500);}catch(_){}
window.__STORYWORLD_PASSIVE_UNLOCK_R1025__=Object.freeze({revision:REV,mode,level,unlocked,mask,share,weights,summonOpen,tick,tierOf,
 levels:m=>[...(LEVELS[m]||[])],tiers:h=>(TIERS[h]||[]).map(x=>[...x]),storyGate:()=>({...GATE}),names:()=>({...NAMES}),
 set(v){on=!!v;return on;},
 table(){const m=mode(),L=LEVELS[m],lv=level();const out={};for(const h of Object.keys(TIERS))out[h]=TIERS[h].map((ks,i)=>({kinds:[...ks],at:L[i],open:on?lv>=L[i]:true,summon:summonOpen(h)}));return out;},
 inspect:()=>({revision:REV,on,mode:mode(),level:level(),stats:{...stats},lastError})});
})();
