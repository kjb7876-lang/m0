// R1275 — 모든 스킬·확률 패시브 레벨 해금 + 확률 패시브 3개 개별 강화 (사용자 2026-11-20 09:50Z
//  "모든스킬일정레벨이상되면 해금되게 / 확률발동패시브스킬도 일정렙이상되어야 해금 qwer 확률발동 1 23순서임 /
//   그리고 확률발동패시브스킬도 스킬창에 3개각각 업가능하게").
//  ① 문턱 표(이 파일이 정본): Q → W → E → R → 확률 패시브 1 → 2 → 3, 엄격히 오름.
//     스토리(영화 모드·사몽 포함) 영웅 레벨 Q2 · W3 · E4 · R5 · 패시브1 7 · 패시브2 15 · 패시브3 30
//       (패시브 2·3 은 R1025 의 15·30 그대로, 패시브 1 만 R 다음이 되도록 5 → 7).
//     무한생존 생존 레벨 Q2 · W3 · E4 · R5 · 패시브1 6 · 패시브2 7 · 패시브3 8 (예전 패시브 2·4·7 보다 조금 늦지만 생존은 레벨이 빨리 오름).
//  ② QWER: R663(점수로 배우기)이 locked() 에서 이 표를 먼저 묻는다 — 배웠어도 문턱 전이면 잠김(키·단추·cast·HUD 숨김 모두 R663 길 그대로).
//     무한생존은 패시브 포인트가 없으므로 점수 없이 문턱만으로 열린다(예전엔 생존에서 W·E·R 이 끝까지 잠겨 있었음).
//     함께하기(R62 협동·R1149 멀티)도 문턱은 같고, 점수 규칙은 예전처럼 혼자만.
//  ③ 확률 패시브: R1025 가 갈래 1·2·3 문턱을 이 표에서 읽는다(R1025 패시브 모듈 8개 경로 그대로). EGO 천체 공명은 패시브1 문턱 뒤.
//  ④ 개별 강화: R971 이 패시브 1·2·3 카드 세 장을 R62 P 창(스킬창)에 넣는다. 이 파일은 P 창에서
//     문턱 전 칸(안 배운 QWER·잠긴 패시브 카드)을 '🔒 Lv.n 해금' 으로 막고, 예전 통합 카드(heroPassiveR971)를 숨기며 그 단계를 세 카드로 옮긴다(높은 쪽 유지).
//     자동 스킬레벨업(R237)은 문턱 전 칸 때문에 점수를 묶어 두지 않고, 문턱 전 패시브 카드는 사지 않는다.
//  ⑤ EGO R 소환 영웅 몸(R1157 r1157Summon)은 문턱을 묻지 않는다 — "소환 영웅은 고유 확률 패시브 사용"(사용자 11-18) 규칙과 7초 소환 동안 모든 스킬 0.7초 규칙을 그대로 지킴.
//     그 밖의 배치·소환 몸(R720·R949·R952)은 조종 영웅 레벨(R1025 캐시)을 따른다.
//  새 키·저장 필드·자산 없음(단계는 기존 R62 ranks). 끄기: localStorage storyworld.r1275.unlock = 0 (QWER 는 R663 점수 규칙만, 패시브는 R1025 예전 문턱).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SKILL_UNLOCK_R1275__)return;
const REV='R1275-skill-unlock-1',LS='storyworld.r1275.unlock';
const ORDER=Object.freeze(['q','w','e','r','p1','p2','p3']);
const LEVELS=Object.freeze({story:Object.freeze({q:2,w:3,e:4,r:5,p1:7,p2:15,p3:30}),survival:Object.freeze({q:2,w:3,e:4,r:5,p1:6,p2:7,p3:8})});
const OLD='heroPassiveR971',TIDS=Object.freeze(['heroPassiveT1R1275','heroPassiveT2R1275','heroPassiveT3R1275']);
const SKILL_ID=Object.freeze({skillQR663:'q',skillWR663:'w',skillER663:'e',skillRR663:'r',heroPassiveT1R1275:'p1',heroPassiveT2R1275:'p2',heroPassiveT3R1275:'p3'});
let on=true;try{const v=localStorage.getItem(LS);if(v==='0'||v==='false')on=false;}catch(_){}
const stats={queries:0,locked:0,migrated:0,cardsLocked:0,hidden:0,toasts:0,errors:0};let lastError=null,cachedLv=1,lastTick=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const P=()=>G(()=>typeof player==='object'&&player?player:null,null);
const isBody=p=>!!(p&&(p.r720Ally||p.r949Summon||p.r952Body||p.r952Unit));
const U=()=>window.__STORYWORLD_PASSIVE_UNLOCK_R1025__,P62=()=>window.__STORYWORLD_PROGRESSION_R62__;
const toLv=v=>{v=Math.floor(Number(v));return Number.isFinite(v)?Math.max(0,v):0;};
function mode(){const u=U();if(u&&typeof u.mode==='function')return G(()=>u.mode(),'story')==='survival'?'survival':'story';return G(()=>!!window.__STORYWORLD_SURVIVAL_R600__?.here?.(),false)?'survival':'story';}
function level(){const u=U();if(u&&typeof u.level==='function'){const v=G(()=>u.level(),NaN);if(Number.isFinite(v))return toLv(v);}
 if(mode()==='survival')return toLv(G(()=>window.__STORYWORLD_SURVIVAL_R600__.state().lv,1));const p=P();if(p&&!isBody(p))cachedLv=toLv(p.level);return cachedLv;}
const levels=m=>({...(LEVELS[m]||LEVELS.story)});
const at=(slot,m=mode())=>(LEVELS[m]||LEVELS.story)[slot];
function locked(slot,p=P()){stats.queries++;try{if(!on)return false;slot=String(slot||'').toLowerCase();if(!ORDER.includes(slot))return false;if(p&&p.r1157Summon)return false;
 const v=level()<at(slot);if(v)stats.locked++;return v;}catch(e){fail(e);return false;}}
function passiveLevels(m){if(!on)return null;const t=LEVELS[m];return t?[t.p1,t.p2,t.p3]:null;}
// 예전 통합 카드 단계 → 패시브 1·2·3 카드(높은 쪽), 예전 칸 0
function migrate(p=P()){try{const A=P62();if(!A||!p||isBody(p))return false;const st=A.state?.(p);if(!st||!st.ranks)return false;const old=toLv(st.ranks[OLD]);if(!(old>0))return false;
 for(const id of TIDS)st.ranks[id]=Math.max(toLv(st.ranks[id]),old);st.ranks[OLD]=0;stats.migrated++;return true;}catch(e){fail(e);return false;}}
// P 창: 문턱 전 칸 막기·예전 카드 숨기기
const KR=s=>{try{const k=typeof KR291!=='undefined'&&KR291;return s==='q'?'Q':(k&&k[s]||s.toUpperCase());}catch(_){return s.toUpperCase();}};
const label=s=>s.startsWith('p')?'특수 패시브 '+s.slice(1):KR(s)+' 스킬';
function decorate(){try{const pn=document.getElementById('panel');if(!pn)return;const p=P();
 for(const el of pn.querySelectorAll('[data-r62-passive]')){const id=el.dataset.r62Passive;
  if(id===OLD){el.remove();stats.hidden++;continue;}
  const s=SKILL_ID[id];if(!s||!locked(s,p))continue;
  // 이미 배운 QWER(1단계 이상)는 강화를 막지 않는다 — 문턱 전엔 쓸 수만 없음. 배우기(0단계)·패시브 카드는 문턱 전엔 못 삼
  const rk=G(()=>toLv(P62().ranks(id,p)),0);if(/^skill/.test(id)&&rk>0)continue;
  el.disabled=true;el.classList?.add('r1275lock');stats.cardsLocked++;
  if(!el.querySelector('.r1275lv')){const b=document.createElement('b');b.className='r1275lv';b.style.cssText='color:#b0472f';/* 설명 끝·'강화 비용' 줄 앞에 한 문장으로 — R222 가 '해금' 문장을 잠김 이유로 뽑아 단추 옆에 🔒 와 함께 보여 준다 */b.textContent=' 레벨 '+at(s)+' 해금 (지금 '+(mode()==='survival'?'생존 ':'')+'레벨 '+level()+').';const sm=el.querySelector('small');if(sm)sm.insertBefore(b,sm.querySelector('br'));else el.appendChild(b);}}}catch(e){fail(e);}}
// 막기는 openPanel 바로 뒤(=P 창 원래 그리기 직후, R115 '스킬 강화 모음'이 카드에서 줄을 만들기 전)에 한다. 옮기기는 그리기 전에.
function hook(){let n=0;try{if(typeof openPanel==='function'&&!openPanel.__r1275){const base=openPanel;const f=function(...a){const r=base.apply(this,a);decorate();return r;};f.__r1275=true;openPanel=f;n++;}}catch(e){fail(e);}
 try{if(typeof showUpgrades==='function'&&!showUpgrades.__r1275){const base=showUpgrades;const f=function(...a){try{migrate();}catch(e){fail(e);}const r=base.apply(this,a);decorate();return r;};f.__r1275=true;showUpgrades=f;n++;}}catch(e){fail(e);}return n>0;}
// 문턱을 넘으면 알림(Q·W·E·R — 스토리는 배울 수 있게 됨, 생존은 바로 열림). 패시브 알림은 R1025 가 같은 표로 띄운다
function tick(){try{migrate();const p=P();if(!p||isBody(p)||!on)return;const lv=level(),m=mode(),key=m+':'+p.hero;
 if(!lastTick||lastTick.key!==key){lastTick={key,lv};return;}
 for(const s of ['q','w','e','r']){const a=at(s,m);if(lastTick.lv<a&&lv>=a){stats.toasts++;const msg=KR(s)+' 스킬 해금 (Lv.'+a+')'+(m==='survival'?'':' · P 창에서 배우면 쓸 수 있습니다');try{if(typeof toast==='function')toast(msg,2.6);}catch(_){}}}
 lastTick.lv=lv;}catch(e){fail(e);}}
hook();try{window.addEventListener?.('load',hook);}catch(_){}
try{setInterval?.(tick,700);}catch(_){}
window.__STORYWORLD_SKILL_UNLOCK_R1275__=Object.freeze({revision:REV,order:()=>[...ORDER],levels,at,mode,level,locked,open:(s,p)=>!locked(s,p),passiveLevels,migrate,tierIds:TIDS,label,tick,
 set(v){on=!!v;return on;},
 table(){const m=mode(),lv=level();return ORDER.map(s=>({slot:s,label:label(s),at:at(s,m),open:!on||lv>=at(s,m)}));},
 inspect:()=>({revision:REV,on,mode:mode(),level:level(),stats:{...stats},lastError})});
})();
