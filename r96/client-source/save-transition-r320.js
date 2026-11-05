// R320 — finish native save/region restoration before running combat again.
// R73 can release loading/modal while later asynchronous restore wrappers still
// replace the player's position. Starting a native thread dance in that window
// anchors its return point to a temporary position. Keep rendering/loading alive;
// only simulation waits for the existing transaction/transition to finish.
(()=>{'use strict';
if(window.__STORYWORLD_SAVE_TRANSITION_R320__)return;
const stats={installed:false,held:0};
function pending(){const s=window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect?.();return !!(s&&(s.transitionDepth>0||s.busy&&(s.operation==='load'||s.operation==='new')));}
function install(){if(stats.installed||typeof tick!=='function')return;const base=tick;tick=function(...a){if(pending()){stats.held++;return;}return base.apply(this,a);};stats.installed=true;}
window.__STORYWORLD_SAVE_TRANSITION_R320__=Object.freeze({inspect:()=>({...stats,pending:pending()})});
// All shipped overlays have installed their tick wrappers by DOMContentLoaded.
// Register once; no repeated wrapping or timer installer chain.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
