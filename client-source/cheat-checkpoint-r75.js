/* Capture the current normal journey before any namespace restoration starts.
 * The native 777 loader otherwise serializes incoming namespace data into its
 * normalReturn backup. The native loader still owns validation and authority. */
(()=>{'use strict';
 let pending=null;const copy=x=>JSON.parse(JSON.stringify(x)),base=restoreSave;
 restoreSave=async function(raw,...a){const prior=pending;if(raw?.cheat777?.active===true&&window.__STORYWORLD_CHEAT777__?.active()!==true&&started&&player)pending=copy(serializeSave());try{return await base.call(this,raw,...a);}finally{pending=prior;}};
 window.__STORYWORLD_CHEAT_CHECKPOINT_R75__=Object.freeze({normalReturn:()=>pending?copy(pending):null});
})();
