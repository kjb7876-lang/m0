/* Terrain-only grayscale shader preserves hazard and projectile colors. All
 * existing sight/occlusion shader hooks and resource ownership are retained. */
const samongTerrainMaterialsR75=new WeakMap();
function samongTerrainToneR75(renderer){
 const active=window.__STORYWORLD_SAMONG_R75__?.active?.()===true,materials=new Set();
 for(const map of [renderer.floorRows,renderer.wallRows,renderer.backdropRows])for(const row of map?.values()||[]){const mesh=row.mesh||row;for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(m)materials.add(m);}
 let count=0;for(const m of materials){if(count++>=768)break;let state=samongTerrainMaterialsR75.get(m);if(!state){const old=m.onBeforeCompile,key=m.customProgramCacheKey;state={value:active?1:0};m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.uniforms.samongToneR75=state;if(!shader.fragmentShader.includes('uniform float samongToneR75;'))shader.fragmentShader='uniform float samongToneR75;\n'+shader.fragmentShader;if(!shader.fragmentShader.includes('float r75Luma='))shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','float r75Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(r75Luma),samongToneR75*.88);\n#include <dithering_fragment>');};m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|samong-terrain-r75';};m.needsUpdate=true;samongTerrainMaterialsR75.set(m,state);}state.value=active?1:0;}
}
