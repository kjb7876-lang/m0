// R320 — finish native save/region restoration before running combat again.
// R73 can release loading/modal while later asynchronous restore wrappers still
// replace the player's position. Starting a native thread dance in that window
// anchors its return point to a temporary position. Keep rendering/loading alive;
// only simulation waits for the existing transaction/transition to finish.
(()=>{'use strict';
if(window.__STORYWORLD_SAVE_TRANSITION_R320__)return;
const stats={installed:false,held:0,orphanStory:0};
// PLAY-08(Dots, 2026-11-06): 사몽 777 저장을 불러온 뒤 서사창(storyScene)은 남았는데 창(modal)이 닫혀
// 메뉴·Esc·패시브가 먹지 않다가 Enter 한 번에 풀렸다. 보이지 않는 서사가 0.6초 넘게 남아 있으면 Enter 와 같이 한 번 넘긴다
// (다음 장면이 있으면 창이 다시 열려 보이고, 마지막이면 닫히며 원래 끝 처리 storyDone 이 돈다).
let orphanAt=0;const nowMs=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
function orphanStory(){try{return typeof started!=='undefined'&&started&&typeof storyScene!=='undefined'&&!!storyScene&&typeof modal!=='undefined'&&!modal&&!(typeof loading!=='undefined'&&loading)&&!pending();}catch(_){return false;}}
function watchStory(){if(!orphanStory()){orphanAt=0;return;}const t=nowMs();if(!orphanAt){orphanAt=t;return;}if(t-orphanAt<600)return;orphanAt=0;stats.orphanStory++;try{if(typeof advanceScene==='function')advanceScene();}catch(_){}}
function pending(){const s=window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect?.();return !!(s&&(s.transitionDepth>0||s.busy&&(s.operation==='load'||s.operation==='new')));}
function install(){if(stats.installed||typeof tick!=='function')return;const base=tick;tick=function(...a){watchStory();if(pending()){stats.held++;return;}return base.apply(this,a);};
 // Native desktop restore omits autoSkill from its settings allowlist. Apply a
 // saved boolean only after validation and the existing async wrappers succeed.
 // Missing legacy fields keep the current/default value; mobile retains its
 // existing device-preference precedence. Auto basic and guide are independent.
 if(typeof restoreSave==='function'){const restoreBase=restoreSave;restoreSave=async function(raw,...a){const result=await restoreBase.call(this,raw,...a);if(result!==false&&!window.__STORYWORLD_MOBILE_R63__?.isMobile?.()&&typeof raw?.settings?.autoSkill==='boolean')settings.autoSkill=raw.settings.autoSkill;return result;};}
 stats.installed=true;}
window.__STORYWORLD_SAVE_TRANSITION_R320__=Object.freeze({inspect:()=>({...stats,pending:pending()})});
// All shipped overlays have installed their tick wrappers by DOMContentLoaded.
// Register once; no repeated wrapping or timer installer chain.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
