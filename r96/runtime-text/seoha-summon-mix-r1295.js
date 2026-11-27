// R1295b — 윤서하 '평행세계 소집'(R949)에 환도가 안 나옴(사용자 2026-11-21 12:01Z "윤서하가 스킬로 환도영웅 소환시 환도영웅 안나오는문제").
//  헤드리스 원인(qa/r1295/summon-mix-browser.mjs, 모든 영웅 서사 연 뒤 소환 1명 레벨에서 24번 강제 → 헌터 24/24):
//   R1025 summonList 가 열린 영웅을 늘 서사 순(헌터→슬레이어→미카엘라→기억사수→환도→라우렌→네온) 앞에서부터 소환 수만큼 고른다.
//   소환 수는 문턱 레벨에서 1명, 10레벨마다 +1 → 환도는 소환 5명(문턱+40레벨)이 되기 전엔 절대 안 뽑혔다. 환도 몸 그림 자체는 정상(LIST 강제 시 그려짐).
//  고침: 서하가 부를 때만, 서사로 열린 영웅(조종 영웅·서하 빼고) 가운데서 소환 수만큼 무작위로 고른다. 수·서사 문(R1025)·레벨 문턱은 그대로.
//   R949 는 굴림(0.35초)마다 목록을 물어 그 영웅 그림을 미리 받으므로, 고른 묶음은 실제 소집이 한 번 끝날 때까지 같게 둔다(미리 받은 그림 = 소환할 그림).
//  R1025 파일·검사는 그대로(다른 호출에는 원래 서사 순 목록). 끄기: localStorage storyworld.r1295.summonMix = {"on":false}
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SEOHA_SUMMON_MIX_R1295__)return;
const REV='R1373-seoha-summon-mix-2',KEY='storyworld.r1295.summonMix',HERO='seoha';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={lists:0,draws:0,kept:0,errors:0,picks:{}};let lastError=null,pick=null,used=false,pickAt=0,rng=Math.random;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const epoch=()=>window.__STORYWORLD_SEOHA_EPOCH_R949__||null;
const procs=()=>{try{const v=+epoch()?.inspect?.()?.stats?.procs?.heroes;return Number.isFinite(v)?v:0;}catch(_){return 0;}};
// R1373(사용자 2026-11-27): 환도·기억사수·미카엘라가 더 자주 — 비중 뽑기(겹침 없이). 나머지는 1.
const WEIGHTS=Object.freeze({hwando:4,gunner:4,michaela:4});const wOf=id=>WEIGHTS[id]||1;
function weighted(a,n){const pool=a.slice(),out=[];while(out.length<n&&pool.length){let t=0;for(const id of pool)t+=wOf(id);let r=rng()*t,k=pool.length-1;for(let i=0;i<pool.length;i++){r-=wOf(pool[i]);if(r<0){k=i;break;}}out.push(pool.splice(k,1)[0]);}return out;}
function same(a,b){return a.length===b.length&&a.every(x=>b.includes(x));}
// base: 원래 R1025 API. n = 원래 목록 길이(소환 수), 후보 = 서사 순 전체 중 열린 영웅
function mixed(base,hero,exclude){const orig=base.summonList(hero,exclude);if(!prefs.on||hero!==HERO||!Array.isArray(orig))return orig;stats.lists++;
 const n=orig.length;if(n<=0){pick=null;return orig;}
 const ex=new Set(exclude||[]);let order=[];try{order=typeof base.storyOrder==='function'?base.storyOrder():[];}catch(_){}if(!order.length)return orig;
 const open=order.filter(id=>!ex.has(id)&&(typeof base.summonOpen!=='function'||base.summonOpen(id)));if(open.length<=n){pick=null;return orig;}
 // 지난 묶음이 실제로 소집되면(R949 소집 횟수가 늘면) 다음 물음에서 새로 뽑는다
 const done=procs();if(pick&&done>pickAt)used=true;
 if(pick&&!used&&pick.length===n&&pick.every(id=>open.includes(id))){stats.kept++;return pick.slice();}
 pick=weighted(open,n);used=false;pickAt=done;stats.draws++;for(const id of pick)stats.picks[id]=(stats.picks[id]||0)+1;return pick.slice();}
let installed=false;
function install(){try{if(installed)return true;const base=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;if(!base||typeof base.summonList!=='function')return false;
 const api=Object.freeze({...base,summonList:(hero,exclude)=>{try{return mixed(base,hero,exclude);}catch(e){fail(e);return base.summonList(hero,exclude);}},r1295Base:base});
 window.__STORYWORLD_PASSIVE_UNLOCK_R1025__=api;installed=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__===api;return installed;}catch(e){fail(e);return false;}}
if(!install()&&typeof window.addEventListener==='function')window.addEventListener('load',install);
window.__STORYWORLD_SEOHA_SUMMON_MIX_R1295__=Object.freeze({revision:REV,
 setPrefs:v=>{prefs={...prefs,...(v||{})};pick=null;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({rng:f=>{rng=typeof f==='function'?f:Math.random;return true;},reset:()=>{pick=null;used=false;pickAt=0;},same}),
 inspect:()=>({revision:REV,weights:{...WEIGHTS},prefs:{...prefs},installed,pick:pick?pick.slice():null,used,...stats,picks:{...stats.picks},lastError})});
})();
