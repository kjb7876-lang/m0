/* Install before cooperative adapter captures save entry points. */
(()=>{'use strict';const C=StoryGoldenCoreR72;
 const freshBase=freshPlayer;freshPlayer=function(...a){const p=freshBase.apply(this,a);p.goldenR72=C.fresh();p.goldenReadyAtR72=0;return p;};
 const exportBase=serializeSave;serializeSave=function(...a){const raw=exportBase.apply(this,a);if(player){raw.goldenR72=C.sanitize(player.goldenR72);raw.goldenR72.readyIn=Math.max(0,Math.min(24,(player.goldenReadyAtR72||0)-time));}return raw;};
 function attach(raw,p){if(p){p.goldenR72=C.sanitize(raw?.goldenR72);p.goldenReadyAtR72=time+p.goldenR72.readyIn;}return p;}
 const validateBase=validateSave;validateSave=function(raw,...a){const v=validateBase.call(this,raw,...a);attach(raw,v.player);return v;};
 const normalizeBase=normalizeSave3;normalizeSave3=function(raw,...a){const v=normalizeBase.call(this,raw,...a);attach(raw,v?.valid?.player);return v;};
 const restoreBase=restoreSave;restoreSave=async function(raw,...a){const v=await restoreBase.call(this,raw,...a);if(v!==false)attach(raw,player);return v;};
})();
