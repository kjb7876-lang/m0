// R323: separate walkable terrain from walls without increasing the render budget.
// Apply the value/temperature grade after existing sight and samong shader hooks.
// Original art, geometry, collision, fog and adaptive DPR budgets remain owned by
// their existing modules. This adds no mesh, texture, pass or per-pixel sample.
(()=>{'use strict';
if(window.__STORYWORLD_TERRAIN_READABILITY_R323__)return;
const REV='R323-terrain-readability-1',KEY='storyworld.r323.terrainReadability';
let on=true,lastError=null,preservedTheme=null;try{on=JSON.parse(localStorage.getItem(KEY)||'null')?.on!==false;}catch(_){}
// Output-space grade: floor detail remains continuous; walls are cooler and
// darker, their existing top/trim materials keep the upper value step.
const ROLES=Object.freeze({floor:[1.34,1.31,1.27],wall:[.86,.89,.94],cap:[1.02,1.02,1.03],path:[1.34,1.31,1.27]});
const stats={frames:0,materials:0,compiles:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const states=new WeakMap(),wrapped=new WeakSet();
function roleMaterials(r){
 const roles=new Map(),add=(m,role)=>{for(const x of Array.isArray(m)?m:[m])if(x)roles.set(x,role);};
 add(r.stoneMaterial,'floor');add(r.visualFloorMaterials,'floor');add(r.visualFloorMaterial,'floor');
 add(r.bridgeMaterial,'path');add(r.wallMaterial,'wall');add(r.hospitalWallMaterial,'wall');
 add(r.wallCapMaterial61,'cap');add(r.hospitalRoofMaterialR2,'cap');add(r.regionalTrimMaterial55,'wall');
 // Some wall occlusion materials are clones; grade the actual displayed rows.
 for(const e of r.wallRows?.values?.()||[]){const m=e.mesh?.material;if(m)add(m,'wall');}
 // R204 replaces native terrain (whose layer mask is then zero), so changing
 // only stoneMaterial/floorRows would leave caves and outdoor ground unchanged.
 const organic={'r204-ground':'floor','r204-cliff-faces':'wall','r204-stalagmites':'wall','r204-plateau':'cap','r218-skeleton':'wall'};
 for(const o of r.__r204?.group?.children||[])if(organic[o.name])add(o.material,organic[o.name]);
 // Restore the cap role if a wall row shares its cap material.
 add(r.wallCapMaterial61,'cap');
 return roles;
}
function installMaterial(m,role,enabled=on){
 if(!m||!ROLES[role]||m.isShaderMaterial||m.isRawShaderMaterial)return;
 let state=states.get(m);
 if(!state&&!enabled)return;
 if(!state){
  const previous=m.onBeforeCompile,previousKey=m.customProgramCacheKey;
  state={gain:{value:[1,1,1]},role,enabled};states.set(m,state);stats.materials++;
  m.onBeforeCompile=function(shader,...a){
   previous?.call(this,shader,...a);
   if(!state.enabled)return;
   const end='#include <dithering_fragment>';
   if(!shader.fragmentShader.includes(end)){fail(Error('Terrain shader has no final grade hook'));return;}
   shader.uniforms.r323Gain=state.gain;
   // Occlusion clones can inherit another material's compile callback. Keep
   // one grade operation and bind this displayed material's own uniform state.
   if(!shader.fragmentShader.includes('uniform vec3 r323Gain;'))shader.fragmentShader='uniform vec3 r323Gain;\n'+shader.fragmentShader.replace(end,
    // Multiplication preserves exact black from the existing sight shader and
    // needs only one vector multiply: no additive lift, branch or smoothstep.
    'gl_FragColor.rgb=clamp(gl_FragColor.rgb*r323Gain,0.,1.);\n'+end);
   stats.compiles++;
  };
  m.customProgramCacheKey=function(){return(previousKey?.call(this)||'')+(state.enabled?'|terrain-readability-r323':'');};
  m.needsUpdate=true;
 }
 if(state.enabled!==enabled){state.enabled=enabled;m.needsUpdate=true;}
 state.role=role;const v=ROLES[role];
 state.gain.value[0]=enabled?v[0]:1;state.gain.value[1]=enabled?v[1]:1;state.gain.value[2]=enabled?v[2]:1;
}
function sync(r){try{stats.frames++;
 // The rose-house checkerboard already has strong inverse value separation.
 // Preserve its black tiles and pale walls instead of lifting a healthy theme.
 const preserve=r.r118TileLook==='rosehouse'||r.terrainArt?.r118Tiles?.file==='rosehouse';preservedTheme=preserve?'rosehouse':null;
 for(const[m,role]of roleMaterials(r))installMaterial(m,role,on&&!preserve);
 }catch(e){fail(e);}}
function attach(){
 const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,gl=r?.renderer;
 if(!r||typeof gl?.render!=='function'||wrapped.has(gl))return false;
 wrapped.add(gl);const base=gl.render;
 // The engine's own terrain/sight setup and asynchronous tile replacements have
 // completed here. Run once at the world pass, including lowFx and adaptive DPR.
 gl.render=function(scene,camera){if(scene===r.scene&&camera===r.camera&&camera.layers.mask===4)sync(r);return base.apply(this,arguments);};
 return true;
}
if(typeof setInterval==='function')setInterval(attach,500);attach();
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_TERRAIN_READABILITY_R323__=Object.freeze({revision:REV,roles:ROLES,set,attach,
 inspect:()=>({revision:REV,on,preservedTheme,stats:{...stats},lastError,extraDraws:0,extraTextures:0,DPRChanged:false,geometryChanged:false,collisionChanged:false,assetsChanged:false,GPUVerified:false})});
})();
