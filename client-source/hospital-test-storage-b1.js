/* Test build storage adapter. Values and save schema are unchanged.
 * All existing game keys stay untouched; no automatic import or deletion. */
(()=>{'use strict';
 const prefix='storyworld.hospital-b1.test.v1:';
 function create(storage){
  const source=typeof storage==='function'?storage:()=>storage;
  return Object.freeze({
   getItem(key){return source().getItem(prefix+String(key));},
   setItem(key,value){return source().setItem(prefix+String(key),String(value));},
   removeItem(key){return source().removeItem(prefix+String(key));}
  });
 }
 window.__STORYWORLD_TEST_STORAGE_B1__=Object.freeze({prefix,create,store:create(()=>window.localStorage),originalSaveImported:false});
})();
