import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import * as T from '../site/vendor/three/build/three.module.js';
const out='out/hospital-b1/build-connected/audit/',site='out/hospital-b1/build-connected/site/';
const hash=b=>createHash('sha256').update(b).digest('hex'),source=fs.readFileSync(site+'dist/phase1.js','utf8');
const protectedPaths=[site+'dist/phase1.js',site+'index.html','client-source/hospital-visual-b1.js','scripts/apply-hospital-visual-b1.py','client-source/hospital-prototype-b1.js','scripts/apply-hospital-prototype-b1.py','client-source/hospital-sight-fix-b1.js','scripts/apply-hospital-sight-fix-b1.py'];
const before=Object.fromEntries(protectedPaths.map(p=>[p,hash(fs.readFileSync(p))]));assert.equal(before[site+'dist/phase1.js'],'a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d');
let role='off',enabled=true,serial=1;const canvasEvents={fill:0,draw:0,clear:0};
const fakeCanvas=()=>{const ctx={fillStyle:'',fillRect(){canvasEvents.fill++;},drawImage(){canvasEvents.draw++;},clearRect(){canvasEvents.clear++;}};return{width:128,height:128,getContext:()=>ctx};};
const box={window:{__STORYWORLD_VISUAL_OPTIONS__:{get enabled(){return enabled;}},__STORYWORLD_COOP_SIM_R62__:{mode:()=>role},__STORYWORLD_SIGHT24__:{mask:()=>({enabled:true,origin:[-40,-40],span:[128,128],serial,canvas:fakeCanvas()})}},document:{createElement:()=>fakeCanvas()},console,URL,performance,Float32Array};vm.createContext(box);vm.runInContext(source,box);const A=box.window.StoryPhase1;
// Verbatim private tone helper + its WeakMap are evaluated in an audit closure.
// Candidate bytes are never instrumented or written. This reproduces the native
// after-apply wrapper order; no WebGLRenderer or game tick is executed.
const sa=source.indexOf('const samongTerrainMaterialsR75='),sb=source.indexOf('class RenderBridge {',sa),samongSource=source.slice(sa,sb);assert.ok(sa>0&&sb>sa);
const tone=vm.runInContext('(function(){'+samongSource+';return samongTerrainToneR75;})()',box);
const layout=A.explorationLayout('ep1a08','hospital',false,{}),frame={zone:'ep1a08',exploration:layout};
const report={schema:'m0.mask-resource-audit/v1',startedAt:new Date().toISOString(),node:process.version,three:T.REVISION,rendererSHA256:hash(source),harnessSHA256:hash(fs.readFileSync(new URL(import.meta.url))),protectedBefore:before,privateHelper:{method:'verbatim extracted native tone function with fresh private WeakMap in audit closure',sha256:hash(samongSource)},substitutions:['2D canvas methods are no-op counters; no raster pixels','WebGLRenderer, AssetCache, ChunkManager and CommandScene endpoints are CPU ownership stubs; real ThreeRenderer.clearScene/dispose method bodies execute','Mode and visual-option accessors are controlled fixtures; real networking, controller rendering and UI are not executed'],cases:[],findings:[]};
function compileCPU(m,label){const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};m.onBeforeCompile(shader,{});const counts={vertexVarying:(shader.vertexShader.match(/varying vec2 sightGround24;/g)||[]).length,fragmentVarying:(shader.fragmentShader.match(/varying vec2 sightGround24;/g)||[]).length,maskUniform:(shader.fragmentShader.match(/uniform sampler2D sightMask24;/g)||[]).length,maskMultiplication:(shader.fragmentShader.match(/gl_FragColor\.rgb \*= mix\(1\.0, sightCover24, sightEnabled24\)/g)||[]).length,worldLocal:(shader.vertexShader.match(/vec4 sightWorld24 =/g)||[]).length};fs.writeFileSync(out+label+'.vertex.glsl',shader.vertexShader);fs.writeFileSync(out+label+'.fragment.glsl',shader.fragmentShader);return{shader,counts};}
const expectSingle=c=>{for(const v of Object.values(c))assert.equal(v,1);};
let nextResource=0;
function fixture(){
 const f={events:{},meta:{},seen:new WeakMap(),calls:{chunksClear:0,commandsClear:0,commandsDispose:0,assetsClear:0,rendererDispose:0,lightDispose:0,glowDispose:0,canvasRemove:0,leaseRelease:0},markerGeometries:[],markerMaterials:[],allOwned:[]};
 f.watch=(v,kind,label)=>{if(f.seen.has(v))return f.seen.get(v);const id=kind+':'+(++nextResource)+':'+label;f.seen.set(v,id);f.events[id]=0;f.meta[id]={kind,label};v.addEventListener('dispose',()=>f.events[id]++);return id;};
 const r=Object.create(A.ThreeRenderer.prototype);f.r=r;Object.assign(r,{T,disposed:false,sceneGeneration:0,spatialRoot:new T.Group(),spatialResources:new Set(),idleGeometry:new Map(),idleGeometryBytes:0,floorRows:new Map(),wallRows:new Map(),backdropRows:new Map(),fogRows:new Map(),bridgeRows:new Map(),chunks:{clear(){f.calls.chunksClear++;}},commands:{clear(){f.calls.commandsClear++;},dispose(){f.calls.commandsDispose++;},sightState24:null},assets:{clear(){f.calls.assetsClear++;f.assetTexture.dispose();}},renderer:{dispose(){f.calls.rendererDispose++;}},light:{dispose(){f.calls.lightDispose++;}},glows:[{until:0,light:{intensity:0,dispose(){f.calls.glowDispose++;}}}],canvas:{removeEventListener(){f.calls.canvasRemove++;}},onLost:()=>{}});
 f.assetTexture=new T.Texture();f.assetID=f.watch(f.assetTexture,'asset-texture','cache-owned-original');
 f.populate=()=>{
  const map=new T.Texture();f.wallTexture=map;f.wallTextureID=f.watch(map,'texture','scene-owned-shared-wall');r.spatialResources.add(map);f.allOwned.push(f.wallTextureID);
  r.sightState24=A.updateSight24(T,null,r.spatialResources,new A.Projection());r.commands.sightState24=r.sightState24;f.maskID=f.watch(r.sightState24.texture,'texture','scene-owned-mask');f.allOwned.push(f.maskID);
  const mat=label=>{const m=new T.MeshBasicMaterial({map,color:0x778899});A.attachSight24(m,r.sightState24);r.spatialResources.add(m);f.allOwned.push(f.watch(m,'base-material',label));return m;};
  for(const k of ['stoneMaterial','wallMaterial','backgroundMaterial','visualWardMaterial','hospitalWallMaterial','hospitalDoorDetailMaterial37'])r[k]=mat(k);
  r.visualFloorMaterials=[mat('visual-floor-0'),mat('visual-floor-1')];r.visualFloorMaterial=r.visualFloorMaterials[0];
  for(const [key,m,rows]of [['wall',r.hospitalWallMaterial,r.wallRows],['floor',r.visualFloorMaterial,r.floorRows]]){const g=new T.BoxGeometry(1,1,.24);f.allOwned.push(f.watch(g,'base-geometry',key));const mesh=new T.Mesh(g,m);r.spatialRoot.add(mesh);rows.set(key,key==='wall'?{mesh}:mesh);}
  r.spatialLease={release(){f.calls.leaseRelease++;}};f.baselineResources=r.spatialResources.size;
 };
 f.capture=()=>{for(const root of r.spatialRoot.children.filter(x=>x.name==='hospital-visual-b1-wall-markers'))root.traverse(o=>{if(!o.isMesh)return;const gid=f.watch(o.geometry,'marker-geometry',o.parent.name);if(!f.markerGeometries.includes(gid))f.markerGeometries.push(gid);const mid=f.watch(o.material,'marker-material',o.material===r.hospitalWallMaterial?'unexpected-original':'owned-clone');if(!f.markerMaterials.includes(mid))f.markerMaterials.push(mid);assert.equal(o.material.map,f.wallTexture);});};
 f.apply=target=>{const d=A.applyHospitalVisualB1(r,target||frame);f.capture();return d;};
 f.finish=()=>({events:f.events,resources:r.spatialResources.size,sceneChildren:r.spatialRoot.children.length,markerRoots:r.spatialRoot.children.filter(x=>x.name==='hospital-visual-b1-wall-markers').length,calls:f.calls,markerGeometryCount:f.markerGeometries.length,markerMaterialCount:f.markerMaterials.length});
 f.populate();return f;
}
async function test(name,fn){const t=performance.now();try{role='off';enabled=true;const detail=await fn();report.cases.push({name,ok:true,ms:performance.now()-t,detail});console.log('PASS',name);}catch(e){report.cases.push({name,ok:false,ms:performance.now()-t,error:e.stack});console.log('FAIL',name,e.stack);}}
await test('mask: pre-masked source clone and repeated same-state attach remain single',()=>{
 const f=fixture(),r=f.r,m=r.hospitalWallMaterial,state=r.sightState24,hook=m.onBeforeCompile,c=A.cloneSpatialMaterialR73(m);assert.equal(c.map,m.map);assert.equal(c.onBeforeCompile,hook);
 for(let i=0;i<20;i++)A.attachSight24(c,state);assert.equal(c.onBeforeCompile,hook);const d=compileCPU(c,'normal-masked-clone');expectSingle(d.counts);assert.equal(d.shader.uniforms.sightMask24,state.uniforms.sightMask24);assert.equal(d.shader.uniforms.sightEnabled24,state.uniforms.sightEnabled24);
 return{counts:d.counts,sameHook:true,mapShared:true,uniformReferences:'current same state',reachability:'normal marker clone path before later tone wrapping',GPUCompiled:false};
});
await test('mask: actual updateSight24 preserves state/uniform identity across ordinary mask updates',()=>{
 const f=fixture(),r=f.r,s=r.sightState24,uniforms=s.uniforms,mask=s.texture;serial++;const q=A.updateSight24(T,s,r.spatialResources,new A.Projection());assert.equal(q,s);assert.equal(q.uniforms,uniforms);assert.equal(q.texture,mask);assert.equal(q.serial,serial);const d=compileCPU(r.hospitalWallMaterial,'ordinary-state-update');expectSingle(d.counts);assert.equal(d.shader.uniforms.sightMask24,s.uniforms.sightMask24);return{stateReplaced:false,uniformReferencesRetained:true,counts:d.counts,reachability:'normal render update',canvas:'no-op CPU stub'};
});
await test('control: generic non-opted-in forced-state path stays unchanged outside hospital fix',()=>{
 const f=fixture(),m=f.r.hospitalWallMaterial,old=f.r.sightState24,resources=new Set(),next=A.updateSight24(T,null,resources,new A.Projection());assert.notEqual(next,old);A.attachSight24(m,next);const d=compileCPU(m,'forced-old-material-new-state');for(const v of Object.values(d.counts))assert.equal(v,2);assert.equal(d.shader.uniforms.sightMask24,next.uniforms.sightMask24);
 report.findings.push({id:'GENERIC-CONTROL',classification:'unrelated generic material path intentionally unchanged; not opted into hospital fix',counts:d.counts});return{counts:d.counts,lastUniformReferencesNewState:true,reachability:'assumed direct reuse; not a normal UI/state lifecycle reproduction',GPUCompiled:false};
});
await test('mask FIX: native tone then same-scene option OFF/ON keeps one marker mask and tone',()=>{
 const f=fixture(),r=f.r;f.apply();let clone=r.spatialRoot.children.find(o=>o.name==='hospital-visual-b1-wall-markers').children[0].children[0].material;expectSingle(compileCPU(clone,'marker-initial').counts);
 tone(r);assert.equal(r.hospitalWallMaterial.onBeforeCompile.__storySight24,undefined);expectSingle(compileCPU(r.hospitalWallMaterial,'source-after-native-tone').counts);
 enabled=false;f.apply();enabled=true;f.apply();clone=r.spatialRoot.children.find(o=>o.name==='hospital-visual-b1-wall-markers').children[0].children[0].material;const d=compileCPU(clone,'marker-after-tone-and-option-cycle');expectSingle(d.counts);assert.equal((d.shader.fragmentShader.match(/float r75Luma=/g)||[]).length,1);assert.equal((d.shader.fragmentShader.match(/uniform float samongToneR75;/g)||[]).length,1);assert.equal(d.shader.uniforms.sightMask24,r.sightState24.uniforms.sightMask24);
 return{counts:d.counts,currentUniformReferences:true,sequence:'masked source -> actual visual apply -> verbatim native tone -> OFF release -> ON apply -> clone callback',naturalUIReproduction:false,GPUCompiled:false};
});
await test('resources: helper-first release preserves shared textures then native clear/dispose owns them once',()=>{
 const f=fixture(),r=f.r;f.apply();const geo=[...f.markerGeometries],mat=[...f.markerMaterials],shared=f.wallTextureID,mask=f.maskID;assert.equal(geo.length,7);assert.equal(mat.length,2);
 enabled=false;f.apply();for(const id of [...geo,...mat])assert.equal(f.events[id],1);assert.equal(f.events[shared],0);assert.equal(f.events[mask],0);assert.equal(r.spatialResources.size,f.baselineResources);
 r.clearScene();for(const id of [...geo,...mat,...f.allOwned])assert.equal(f.events[id],1,id);assert.equal(r.spatialRoot.children.length,0);assert.equal(r.spatialResources.size,0);r.dispose();r.dispose();assert.equal(f.events[f.assetID],1);for(const id of [...geo,...mat,...f.allOwned])assert.equal(f.events[id],1,id);assert.equal(f.calls.rendererDispose,1);return f.finish();
});
await test('resources: native scene-first clear releases marker objects once; fresh state/materials remain single',()=>{
 const f=fixture(),r=f.r;f.apply();const geo=[...f.markerGeometries],mat=[...f.markerMaterials],oldState=r.sightState24;r.clearScene();for(const id of [...geo,...mat,...f.allOwned])assert.equal(f.events[id],1,id);assert.equal(r.spatialRoot.children.length,0);assert.equal(r.spatialResources.size,0);assert.equal(r.sightState24,null);
 assert.equal(r.hospitalVisualB1Diagnostic,null,'clearScene resets visual diagnostic immediately');
 f.populate();assert.notEqual(r.sightState24,oldState);f.apply();const clone=r.spatialRoot.children.find(o=>o.name==='hospital-visual-b1-wall-markers').children[0].children[0].material;const d=compileCPU(clone,'after-real-clear-fresh-state');expectSingle(d.counts);assert.equal(d.shader.uniforms.sightMask24,r.sightState24.uniforms.sightMask24);
 enabled=false;f.apply();r.dispose();for(const [id,n]of Object.entries(f.events))assert.equal(n,1,id);return{...f.finish(),freshStateCounts:d.counts,reachability:'native clearScene then reconstructed new scene materials; actual WebGL/loader omitted'};
});
await test('resources: actual renderer dispose is idempotent and post-dispose helper cleanup does not double-dispose',()=>{
 const f=fixture(),r=f.r;f.apply();r.dispose();const saved={...f.events};assert.equal(r.disposed,true);assert.equal(r.spatialResources.size,0);assert.equal(r.spatialRoot.children.length,0);r.dispose();enabled=false;f.apply();assert.deepEqual(f.events,saved);for(const n of Object.values(f.events))assert.equal(n,1);for(const k of ['assetsClear','commandsDispose','rendererDispose','lightDispose','glowDispose','canvasRemove'])assert.equal(f.calls[k],1,k);return{...f.finish(),postDisposeHelperCall:'synthetic robustness order; controller normally drops the renderer reference'};
});
await test('resources: repeated options/region/host/guest cycles retain no marker instances or shared-texture disposal',()=>{
 const f=fixture(),r=f.r,baseline=r.spatialResources.size;let creations=0;
 for(let i=0;i<6;i++){
  enabled=true;role='off';f.apply();creations++;const root=r.spatialRoot.children.find(o=>o.name==='hospital-visual-b1-wall-markers'),g=f.markerGeometries.length,m=f.markerMaterials.length;
  for(let j=0;j<10;j++)f.apply();assert.equal(r.spatialRoot.children.find(o=>o.name==='hospital-visual-b1-wall-markers'),root);assert.equal(f.markerGeometries.length,g);assert.equal(f.markerMaterials.length,m);
  if(i%3===0){enabled=false;f.apply();}else if(i%3===1){role=i%2?'host':'guest';f.apply();}else f.apply({zone:'ep1a09',exploration:layout});
  assert.equal(r.spatialRoot.children.filter(o=>o.name==='hospital-visual-b1-wall-markers').length,0);assert.equal(r.spatialResources.size,baseline);assert.equal(f.events[f.wallTextureID],0);assert.equal(f.events[f.maskID],0);
 }
 assert.equal(creations,6);assert.equal(f.markerGeometries.length,42);assert.equal(f.markerMaterials.length,12);for(const id of [...f.markerGeometries,...f.markerMaterials])assert.equal(f.events[id],1,id);r.dispose();for(const n of Object.values(f.events))assert.equal(n,1);return{...f.finish(),cycles:6,warmCalls:60,warmMeaning:'same root/geometry/material/resource counts only, NOT zero JS allocations',networkOrUIExecuted:false};
});

await test('mask FIX: opted hospital source/clone current states rebind existing shaders independently',()=>{
 const f=fixture(),r=f.r;f.apply();const source=r.hospitalWallMaterial,sA=r.sightState24;
 const src=compileCPU(source,'hospital-source-A');expectSingle(src.counts);
 const clone=A.cloneSpatialMaterialR73(source),hook=clone.onBeforeCompile;A.attachSight24(clone,sA);assert.equal(clone.onBeforeCompile,hook);const old=compileCPU(clone,'hospital-clone-A');expectSingle(old.counts);
 const sB=A.updateSight24(T,null,new Set(),new A.Projection());for(let i=0;i<30;i++)A.attachSight24(clone,sB);assert.equal(clone.onBeforeCompile,hook);assert.equal(old.shader.uniforms.sightMask24,sB.uniforms.sightMask24);assert.equal(src.shader.uniforms.sightMask24,sA.uniforms.sightMask24);
 const fresh=compileCPU(clone,'hospital-clone-B');expectSingle(fresh.counts);assert.equal(fresh.shader.uniforms.sightMask24,sB.uniforms.sightMask24);
 A.attachSight24(source,sB);assert.equal(src.shader.uniforms.sightMask24,sB.uniforms.sightMask24);expectSingle(compileCPU(source,'hospital-source-B').counts);
 return{sourceAndCloneBindingsIndependent:true,preExistingShaderUniformsRebound:true,repeatedAttach:30,counts:fresh.counts,reachability:'state-only reassignment is controlled/forced; normal clear/new-material path tested separately',GPUCompiled:false};
});
await test('mask FIX: original callback effects and R75 tone uniform survive clone/state replacement',()=>{
 const f=fixture(),r=f.r;let effectCalls=0;const base=r.hospitalWallMaterial.onBeforeCompile;r.hospitalWallMaterial.onBeforeCompile=function(shader,...args){base.call(this,shader,...args);effectCalls++;shader.uniforms.auditExistingEffect={value:7};shader.fragmentShader+='\n// audit-original-effect';};
 f.apply();tone(r);const src=compileCPU(r.hospitalWallMaterial,'effect-source');const toneUniform=src.shader.uniforms.samongToneR75;assert.ok(toneUniform);expectSingle(src.counts);
 const c=A.cloneSpatialMaterialR73(r.hospitalWallMaterial),sB=A.updateSight24(T,null,new Set(),new A.Projection());A.attachSight24(c,sB);const d=compileCPU(c,'effect-clone');expectSingle(d.counts);assert.equal((d.shader.fragmentShader.match(/float r75Luma=/g)||[]).length,1);assert.equal((d.shader.fragmentShader.match(/audit-original-effect/g)||[]).length,1);assert.equal(d.shader.uniforms.samongToneR75,toneUniform);assert.equal(d.shader.uniforms.auditExistingEffect.value,7);assert.equal(d.shader.uniforms.sightMask24,sB.uniforms.sightMask24);assert.equal(effectCalls,2);
 return{counts:d.counts,originalCallbackCalledOncePerShader:true,toneCodeCount:1,toneUniformReferencePreserved:true,currentMaskUniformReference:true,GPUCompiled:false};
});

report.finishedAt=new Date().toISOString();report.passed=report.cases.filter(x=>x.ok).length;report.failed=report.cases.filter(x=>!x.ok).length;report.protectedAfter=Object.fromEntries(protectedPaths.map(p=>[p,hash(fs.readFileSync(p))]));assert.deepEqual(report.protectedAfter,report.protectedBefore);report.gameInputsUnchanged=true;report.interpretation='Hospital scoped fix regression. Generic non-opt-in control intentionally preserves old behavior. CPU callback strings/dispose events only; not GPU/GLSL compilation or VRAM acceptance.';fs.writeFileSync(out+'results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,findings:report.findings,gameInputsUnchanged:true}));if(report.failed)process.exitCode=1;
