/* R89 QA (browser): cycle regions through the 777 test code (separate cheat777
 * save) and record resource counts after every arrival, plus one OFF/ON pair
 * per region at the same spot (R89 options off == R88 presentation path).
 * Assists: 777 travel, narrative skipped with advanceScene, difficulty picker
 * confirmed by clicking its native button. Not natural play. */
(()=>{'use strict';
 const Q=window.__R89QA__,R=window.__STORYWORLD_WORLD_RETRO_R89__,V=window.__STORYWORLD_VFX_RETRO_R89__;
 // One draw first: renderer.info only updates when a frame renders (pane may be hidden).
 const counts=()=>{window.__STORYWORLD_PHASE1__.controller.draw();const r=window.__R89_RENDERER__;let objects=0,lights=0,skirts=0;r?.scene?.traverse(o=>{if(o.isMesh||o.isSprite||o.isLine||o.isPoints)objects++;if(o.name==='r89-retro-light')lights++;if(o.name==='r89-wall-contact-skirt')skirts++;});const f=window.__STORYWORLD_FINAL42_R88__.inspect();
  return{zone,geometries:r?.renderer?.info?.memory?.geometries,textures:r?.renderer?.info?.memory?.textures,programs:r?.renderer?.info?.programs?.length,sceneObjects:objects,commandRows:r?.commands?.rows?.size,spatialChildren:r?.spatialRoot?.children?.length,r89Lights:lights,r89Skirts:skirts,final42Active:f.active.length,final42Resident:f.resident.length,effects:effects.length,hazards:hazards.length,projectiles:projectiles.length,domNodes:document.getElementsByTagName('*').length,heapMB:performance.memory&&+(performance.memory.usedJSHeapSize/1048576).toFixed(1)};};
 async function arrive(id){const C=window.__STORYWORLD_CHEAT777__;await C.go(id,'STORY');for(let i=0;i<40;i++){await Q.sleep(150);const b=document.getElementById('r71DifficultyConfirm');if(b&&!b.disabled){b.click();break;}if(zone===id&&!loading)break;}
  for(let i=0;i<120&&(loading||zone!==id);i++)await Q.sleep(250);let n=0;while(storyScene&&n<12){advanceScene();n++;await Q.sleep(200);}await Q.sleep(1200);return n;}
 // Wait for regional textures first; R89 shot first, then the same view with every R89 option off.
 async function pair(tag){const prefs=R.prefs(),fx=V.enabled();for(let i=0;i<8;i++){window.__STORYWORLD_PHASE1__.controller.draw();await Q.sleep(300);}await Q.shot('region-'+tag+'-r89.png');
  try{R.set({light:'off',grade:false,dither:false,contact:false});V.set(false);for(let i=0;i<3;i++){window.__STORYWORLD_PHASE1__.controller.draw();await Q.sleep(250);}await Q.shot('region-'+tag+'-r88path.png');}finally{R.set(prefs);V.set(fx);}}
 async function cycle(ids,{loops=2,pairs=true}={}){const log=[];for(let l=0;l<loops;l++)for(const id of ids){const t=performance.now();const skipped=await arrive(id);if(pairs&&l===0)await pair(id);if(typeof gc==='function')gc();log.push({loop:l,id,ms:Math.round(performance.now()-t),skipped,...counts()});}
  await Q.post('region-cycle.json',JSON.stringify({schema:'storyworld.r89.region-cycle/v1',at:new Date().toISOString(),ids,loops,assists:['777 travel','advanceScene narrative skip','difficulty picker native confirm click'],log},null,2));return log;}
 window.__R89CYCLE__=Object.freeze({cycle,counts,arrive,pair});
})();
