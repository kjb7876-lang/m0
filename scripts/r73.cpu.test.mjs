import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from '../_pages/docs/vendor/three/build/three.core.js';
const renderer=fs.readFileSync('_pages/docs/dist/phase1.js','utf8'),context={window:{},console,URL,performance,Float32Array};vm.createContext(context);vm.runInContext(renderer,context);const api=context.window.StoryPhase1;
test('wall draw ranges merge without reordering any triangle or changing per-triangle material identity',()=>{
 const layout=api.explorationLayout('ep1b09','ruin',false,{}),art=layout.surface.art,wall=new T.MeshBasicMaterial(),cap=new T.MeshBasicMaterial(),trim=new T.MeshBasicMaterial(),materials=[wall,wall,cap,cap,wall,wall,trim];let before=0,after=0;
 for(const w of layout.regional55?.visualWalls||layout.walls){const data=api.terrainWallMeshData(w,art),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));g.setIndex(data.indices);for(const r of data.groups)g.addGroup(r.start,r.count,r.materialIndex);const mesh=new T.Mesh(g,materials),index=g.index,position=g.getAttribute('position'),uv=g.getAttribute('uv'),expand=()=>g.groups.flatMap(r=>Array.from({length:r.count/3},(_,n)=>({start:r.start+n*3,material:materials[r.materialIndex]}))),original=expand();before+=g.groups.length;api.coalesceMaterialGroupsR73(mesh);after+=g.groups.length;assert.equal(g.index,index);assert.equal(g.getAttribute('position'),position);assert.equal(g.getAttribute('uv'),uv);assert.deepEqual(expand(),original);assert.equal(api.coalesceMaterialGroupsR73(mesh),0,'geometry cache reuse is idempotent');g.dispose();}
 assert.ok(after<=before*.5,JSON.stringify({before,after}));
});
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
test('ordinary objective route from a portal arrival avoids immediately crossing the previous portal',()=>{
 vm.runInContext(fs.readFileSync('client-source/portal-arrival-r73.js','utf8'),context);
 const segment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};
 for(const id of ['dist04','dist06','ep1a09']){
  const layout=api.explorationLayout(id,api.REGIONAL_TERRAIN_ART[id].theme,false,{}),r={id,exploration:layout,objective:{x:15,y:13}},portal=layout.entry;
  const blocked=(x,y,v)=>api.explorationBlocked(layout,x,y,v),clear=(a,b,v)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.15));for(let i=0;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,v))return false;return true;};
  const path=(a,b,_r,v=.31)=>api.explorationPath(layout,a,b,v,blocked,clear);context.blocked=blocked;context.clearPath3=clear;context.findPath=path;
  const old={x:portal.x+2.5,y:portal.y},oldRoute=[old,...path(old,r.objective,r)],nearest=route=>Math.min(...route.slice(1).map((b,i)=>segment(portal,route[i],b)));
  assert.ok(nearest(oldRoute)<.85,id+' must reproduce the old automatic-return hazard');
  const next=context.window.__STORYWORLD_PORTAL_ARRIVAL_R73__.point(portal,r);assert.ok(next,id);assert.equal(blocked(next.x,next.y,.34),false);assert.ok(Math.hypot(next.x-portal.x,next.y-portal.y)>=1.9);const route=[next,...path(next,r.objective,r)];assert.ok(route.length>1);assert.ok(nearest(route)>.85,id+' objective walk must stay outside previous auto-travel radius');
 }
});
