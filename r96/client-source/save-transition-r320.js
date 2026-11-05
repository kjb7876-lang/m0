// R320 — finish native save/region restoration before running combat again.
// R73 can release loading/modal while later asynchronous restore wrappers still
// replace the player's position. Starting a native thread dance in that window
// anchors its return point to a temporary position. Keep rendering/loading alive;
// only simulation waits for the existing transaction/transition to finish.
(()=>{'use strict';
if(window.__STORYWORLD_SAVE_TRANSITION_R320__)return;
const stats={installed:false,held:0};
function pending(){const s=window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect?.();return !!(s&&(s.transitionDepth>0||s.busy&&(s.operation==='load'||s.operation==='new')));}
function install(){if(stats.installed||typeof tick!=='function')return;const base=tick;tick=function(...a){if(pending()){stats.held++;return;}return base.apply(this,a);};
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
