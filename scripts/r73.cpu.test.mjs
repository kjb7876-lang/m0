import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from '../_pages/docs/vendor/three/build/three.core.js';
const renderer=fs.readFileSync('_pages/docs/dist/phase1.js','utf8'),context={window:{},console,URL,performance,Float32Array};vm.createContext(context);vm.runInContext(renderer,context);const api=context.window.StoryPhase1;
test('actual Three clones retain mask hooks and copied userData cannot suppress repair',()=>{
 const state={uniforms:{sightEnabled24:{value:1}}},original=new T.MeshBasicMaterial();api.attachSight24(original,state);
 const naive=original.clone();assert.ok(naive.userData.sight24);assert.ok(!String(naive.onBeforeCompile).includes('sightGround24'));
 api.attachSight24(naive,state);assert.ok(String(naive.onBeforeCompile).includes('sightGround24'));
 const safe=api.cloneSpatialMaterialR73(original);assert.equal(safe.onBeforeCompile,original.onBeforeCompile);assert.equal(safe.customProgramCacheKey(),original.customProgramCacheKey());
 const hook=safe.onBeforeCompile;api.attachSight24(safe,state);assert.equal(safe.onBeforeCompile,hook,'same-state reattach is idempotent');
 const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <dithering_fragment>'};safe.onBeforeCompile(shader,{});assert.equal(shader.uniforms.sightEnabled24,state.uniforms.sightEnabled24);assert.equal((shader.fragmentShader.match(/varying vec2 sightGround24/g)||[]).length,1);
});
test('occluding wall retains texture/mask, shares duplicate slots and reuses camera-invariant hulls',()=>{
 const state={uniforms:{}},materials=[0,1,2].map(()=>new T.MeshBasicMaterial());for(const m of materials)api.attachSight24(m,state);
 const slots=[materials[0],materials[0],materials[1],materials[1],materials[0],materials[0],materials[2]],mesh=new T.Mesh(new T.BoxGeometry(3,2,.5),slots),wall={x:10,y:10,width:3,depth:.5,height:2};mesh.userData.originalWall=wall;
 const projection=new api.Projection(),r={projection,wallRows:new Map([['test',{mesh}]]),spatialResources:new Set()},frame={zone:'ep1b09',time:1,viewport:{zoom:1},entities:[{x:9.7,y:9.7,height:66,alive:true,hero:true}]};
 api.contextualWallOcclusion54(r,frame);assert.ok(mesh.userData.occlusion54);assert.equal(new Set(mesh.material).size,3);assert.equal(r.spatialResources.size,3);assert.equal(r.occlusionStats54.hullsBuilt,1);
 const hull=mesh.userData.wallHullR73;projection.configure({...projection,camX:12,camY:13});for(let i=0;i<60;i++)api.contextualWallOcclusion54(r,{...frame,time:1+i*.1});assert.equal(mesh.userData.wallHullR73,hull);assert.equal(r.occlusionStats54.hullsBuilt,0);assert.equal(r.spatialResources.size,3);assert.ok(mesh.material.every(m=>m.opacity>=.42&&m.opacity<.5));assert.ok(mesh.material.every(m=>String(m.onBeforeCompile).includes('sightGround24')));
 projection.configure({...projection,zoom:1.3});api.contextualWallOcclusion54(r,{...frame,time:8,viewport:{zoom:1.3}});assert.notEqual(mesh.userData.wallHullR73,hull);assert.equal(r.occlusionStats54.hullsBuilt,1);
 for(let i=0;i<60;i++)api.contextualWallOcclusion54(r,{...frame,time:9+i*.1,entities:[]});assert.ok(mesh.material.every(m=>m.opacity===1&&m.depthWrite));assert.equal(wall.height,2);
});
