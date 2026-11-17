// R243 황금실·은색실 커스터마이징 적용·저장 + 은색실 기본 패턴 장착 켜기/끄기 — 사용자 2026-11-03
//  "황금실 은색실커스터마이징 적용및저장문제, 은색실기본패턴도 장착형식으로 켰다 끌 수 있도록".
// 코드 추적으로 찾은 원인과 고친 것:
//  ① 은색실을 하나라도 장착하면 T·자동 실검무가 그 은색실만 부르고, 그 은색실이 재사용 대기·막힘·대상 없음으로 실패해도 'true'(처리함)를 돌려
//     아무 일도 안 일어났다(기본 실검무로도 넘어가지 않음). 자동 사용을 꺼 두면 기본 자동 실검무까지 막혔다.
//     → 장착 은색실이 실제로 나갔을 때만 처리함. 못 나가면 '기본 실검무'가 장착돼 있을 때 기본 실검무로 넘어간다.
//  ② 기본 실검무는 데이터가 아니라 '기본 실검무 사용' 단추로 장착 목록을 통째로 비우는 방식이라, 기본으로 돌아가면 직접 만든 은색실 장착이 다 풀렸다.
//     → 은색실 관리 창에 '기본 실검무 · 장착됨/해제' 칸을 따로 둔다(장착 목록은 건드리지 않음). 꺼 두면 T 는 장착한 은색실만, 아무것도 없으면 안내만.
//     이 켜짐/꺼짐은 저장 파일(silverDefaultR243)에 남는다.
//  ③ 777 모드에서 만든·고친 도안은 777 을 나갈 때 일반 저장으로 되돌아가며 사라졌다 → 나갈 때 도안·장착(황금실·은색실)만 일반 영웅에 옮긴다
//     (777 로 올린 강화 단계·습득 여부는 옮기지 않음).
//  ④ 저장이 막힌 순간(대사·연출·전환 중)에도 '저장했습니다'라고 하고 실제로는 기록되지 않았다 → 도안 명령 뒤 저장이 될 때까지 몇 번 다시 시도한다.
// 판정·피해·도안 형식은 바꾸지 않는다. 끄기: localStorage['storyworld.r243.threads']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_THREADS_R243__)return;
const REV='R243-threads-1',KEY='storyworld.r243.threads';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={custom:0,fallback:0,blocked:0,saveRetry:0,carried:0,toggles:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const me=()=>typeof player==='object'?player:null;
const defOn=p=>!p||p.silverDefaultR243!==false;
function say(t){try{if(typeof toast==='function')toast(t,2.4);}catch(_){}}
// 저장 재시도
let retry=0;function saveSoon(){retry=6;tick();function tick(){if(retry<=0)return;let ok=false;try{ok=typeof saveGame==='function'&&saveGame(false)!==false;}catch(e){fail(e);}if(ok){retry=0;return;}retry--;stats.saveRetry++;if(typeof setTimeout==='function')setTimeout(tick,1500);}}
let wrapped=false;
function install(){const D=window.__STORYWORLD_DANCES_R74__;if(!D||wrapped||D.__r243)return !!D;wrapped=true;
 const baseDecorate=D.decorateManager,baseCommand=D.command;
 window.__STORYWORLD_DANCES_R74__=Object.freeze({...D,__r243:true,
  customSilver(manual){if(!on)return D.customSilver(manual);try{const p=me();if(!p||!solo())return D.customSilver(manual);const s=D.state('silver',p);const dflt=defOn(p);
    if(s?.learned&&s.equipped?.length){if(manual||s.autoUse){const ok=D.cast('silver',0,null,manual)===true;if(ok){stats.custom++;return true;}
      if(dflt){stats.fallback++;return false;}/* 기본 실검무로 넘어감 */if(manual)say('장착한 은색실이 재사용 대기 중입니다 · 기본 실검무는 해제되어 있습니다');stats.blocked++;return true;}
     return !dflt;/* 자동 사용을 꺼 둔 장착 은색실: 기본이 켜져 있으면 기본 자동 실검무는 그대로 */}
    if(!dflt){if(manual)say('기본 실검무가 해제되어 있습니다 · 은색실 관리에서 장착하세요');stats.blocked++;return true;}
    return false;}catch(e){fail(e);return D.customSilver(manual);}},
  command(k,p,cmd,...a){const r=baseCommand.call(this,k,p,cmd,...a);try{if(on)saveSoon();}catch(e){fail(e);}return r;},
  decorateManager(k,refresh,...a){const r=baseDecorate.call(this,k,refresh,...a);try{if(on&&k==='silver')decorateSilver(refresh);}catch(e){fail(e);}return r;}});
 return true;}
function decorateSilver(refresh){const p=me();if(!p)return;const old=document.getElementById('silverDefaultR74');if(!old)return;
 const b=document.createElement('button');b.type='button';b.id='silverDefaultR243';const set=()=>{b.textContent='기본 실검무 · '+(defOn(p)?'장착됨 (누르면 해제)':'해제됨 (누르면 장착)');b.setAttribute('aria-pressed',defOn(p)?'true':'false');};set();
 b.onclick=()=>{p.silverDefaultR243=!defOn(p);stats.toggles++;set();saveSoon();try{refresh?.();}catch(_){}};
 old.replaceWith(b);
 const note=b.parentElement?.nextElementSibling;if(note&&note.tagName==='P'&&/기본 실검무/.test(note.textContent))note.textContent='은색실은 황금실과 별도 도안 7개를 저장합니다. 기본 실검무도 하나의 장착 칸처럼 켜고 끌 수 있습니다 — 켜 두면 장착한 은색실이 재사용 대기일 때 기본 실검무가 나가고, 꺼 두면 장착한 은색실만 씁니다. 장착 목록은 그대로 남습니다.';}
// 저장 파일에 기본 실검무 켜짐/꺼짐 남기기
function wrapSave(){if(typeof serializeSave==='function'&&!serializeSave.__r243){const b=serializeSave;const w=function(...a){const raw=b.apply(this,a);try{const p=me();if(raw&&p&&solo())raw.silverDefaultR243=defOn(p);}catch(e){fail(e);}return raw;};w.__r243=true;serializeSave=w;}
 if(typeof restoreSave==='function'&&!restoreSave.__r243){const b=restoreSave;const w=async function(raw,...a){const r=await b.call(this,raw,...a);try{const p=me();if(p&&raw&&typeof raw==='object'&&'silverDefaultR243' in raw)p.silverDefaultR243=raw.silverDefaultR243!==false;}catch(e){fail(e);}return r;};w.__r243=true;restoreSave=w;}}
// 777 을 나갈 때 도안·장착만 일반 영웅에 옮기기
let cheatWrapped=false;
function wrapCheat(){const C=window.__STORYWORLD_CHEAT777__;if(!C||cheatWrapped||C.__r243||typeof C.leave!=='function')return;cheatWrapped=true;
 window.__STORYWORLD_CHEAT777__=Object.freeze({...C,__r243:true,async leave(...a){let keep=null;try{const p=me();if(on&&p&&C.active?.()){keep={};for(const k of ['goldenR72','silverR74'])if(p[k])keep[k]={designs:JSON.parse(JSON.stringify(p[k].designs||[])),equipped:[...(p[k].equipped||[])]};keep.def=defOn(p);}}catch(e){fail(e);}
  const r=await C.leave.apply(this,a);
  try{const p=me();if(keep&&p){for(const k of ['goldenR72','silverR74']){const s=p[k];if(!s||!keep[k])continue;const max=Math.max(1,(s.designs||[]).length,keep[k].designs.length);s.designs=keep[k].designs.slice(0,Math.max(7,max));const ids=new Set(s.designs.map(d=>d.id));s.equipped=keep[k].equipped.filter(id=>ids.has(id));}p.silverDefaultR243=keep.def;stats.carried++;saveSoon();}}catch(e){fail(e);}return r;}});}
let tries=0;(function arm(){try{install();wrapSave();wrapCheat();}catch(e){fail(e);}if(++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_THREADS_R243__=Object.freeze({revision:REV,defaultOn:()=>defOn(me()),setDefault:v=>{const p=me();if(p){p.silverDefaultR243=v!==false;saveSoon();}return defOn(p);},inspect:()=>({revision:REV,on,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
