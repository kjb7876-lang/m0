/* Opt-in mask binding for the ep1a08 visual candidate's materials only.
 * The pre-existing attachSight24 path remains authoritative for other materials.
 * Before callbacks (including R75 tone) execute first. Existing mask code is
 * adopted once; uniform references are rebound to this material's current state.
 */
const hospitalSightBindingsB1=new WeakMap();
const hospitalSightHookB1=Symbol('hospital-sight-hook-b1');
function attachHospitalSightB1(material,state,projected=false){
 if(!state||!(material.isMeshBasicMaterial||material.isMeshStandardMaterial))return material;
 material.userData.hospitalSightB1=true;
 let binding=hospitalSightBindingsB1.get(material);
 if(!binding){
  binding={state,projected,shaders:new Set()};hospitalSightBindingsB1.set(material,binding);
  const onDispose=event=>{binding.shaders.clear();if(hospitalSightBindingsB1.get(event.target)===binding)hospitalSightBindingsB1.delete(event.target);event.target.removeEventListener('dispose',onDispose);};
  material.addEventListener('dispose',onDispose);
  const priorKey=material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey=()=>priorKey()+'|hospital-sight-b1-'+(binding.projected?'projection':'physical');
 }
 const changedProjection=binding.projected!==projected;binding.state=state;binding.projected=projected;
 for(const shader of binding.shaders)Object.assign(shader.uniforms,state.uniforms);
 material.userData.sight24={projected,CPUWiringOnly:true,GPUVerified:false};
 if(material.onBeforeCompile[hospitalSightHookB1]){if(changedProjection)material.needsUpdate=true;return material;}
 const before=material.onBeforeCompile,priorKey=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=function(shader,renderer){
  before.call(this,shader,renderer);
  const current=hospitalSightBindingsB1.get(this)||binding;
  current.shaders.add(shader);Object.assign(shader.uniforms,current.state.uniforms);
  // Per-shader guards survive clone/callback wrappers that do not copy tags.
  if(!shader.vertexShader.includes('varying vec2 sightGround24;')){
   shader.vertexShader='varying vec2 sightGround24;\n'+(current.projected?'uniform vec4 sightView24;\nuniform vec2 sightCam24;\n':'')+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+(current.projected?'vec2 sightPixel24 = vec2((gl_Position.x / gl_Position.w * 0.5 + 0.5) * sightView24.x, (0.5 - gl_Position.y / gl_Position.w * 0.5) * sightView24.y);\nfloat sightA24 = (sightPixel24.x - sightView24.x * 0.5) / (sightView24.z * sightView24.w) + sightCam24.x - sightCam24.y;\nfloat sightB24 = (sightPixel24.y - sightView24.y * 0.52) / (sightView24.z * 0.5 * sightView24.w) + sightCam24.x + sightCam24.y;\nsightGround24 = vec2((sightA24 + sightB24) * 0.5, (sightB24 - sightA24) * 0.5);':'vec4 sightWorld24 = modelMatrix * vec4(transformed, 1.0);\nsightGround24 = sightWorld24.xz;'));
  }
  if(!shader.fragmentShader.includes('uniform sampler2D sightMask24;'))shader.fragmentShader='varying vec2 sightGround24;\nuniform sampler2D sightMask24;\nuniform vec2 sightMin24;\nuniform vec2 sightSpan24;\nuniform float sightEnabled24;\n'+shader.fragmentShader;
  if(!shader.fragmentShader.includes('float sightCover24 ='))shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nvec2 sightUV24 = (sightGround24 - sightMin24) / sightSpan24;\nfloat sightInside24 = step(0.0, sightUV24.x) * step(0.0, sightUV24.y) * step(sightUV24.x, 1.0) * step(sightUV24.y, 1.0);\nfloat sightCover24 = texture2D(sightMask24, clamp(sightUV24, vec2(0.0), vec2(1.0))).r * sightInside24;\ngl_FragColor.rgb *= mix(1.0, sightCover24, sightEnabled24);');
 };
 material.onBeforeCompile[hospitalSightHookB1]=true;
 material.customProgramCacheKey=()=>priorKey()+'|hospital-sight-wrapper-b1';
 material.needsUpdate=true;return material;
}
