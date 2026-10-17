import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import * as THREE from '../_pages/docs/vendor/three/build/three.module.js';
const original=fs.readFileSync('docs/dist/phase1.js','utf8'),candidate=fs.readFileSync('_pages/docs/dist/phase1.js','utf8');
let allocations=0;
class Vector3 extends THREE.Vector3{constructor(...args){super(...args);allocations++;}}
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
function read(source){const a=source.indexOf('  worldPoint(p,owner){'),b=source.indexOf('\n  geometry(command)',a);assert.ok(a>=0&&b>a);return vm.runInNewContext('({'+source.slice(a,b)+'}).worldPoint',{finite,Number});}
const old=read(original),next=read(candidate);
function scene(){return{T:{Vector3},camera:{quaternion:new THREE.Quaternion()},projection:{width:1365,height:850,pixelsPerUnit:35,screenToWorld:(x,y)=>({x:(x-y)/42,y:(x+y)/63}),worldToScreen:(x,y)=>({x:600+(x-y)*35,y:400+(x+y)*17.5})}};}
test('actual Three.js vertex coordinates remain exact across rotations, zooms, ground and actor forms',()=>{
 const a=scene(),b=scene();let seed=17;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let round=0;round<50;round++){
  const q=new THREE.Quaternion(rnd()-.5,rnd()-.5,rnd()-.5,rnd()-.5).normalize();a.camera.quaternion.copy(q);b.camera.quaternion.copy(q);a.projection.pixelsPerUnit=b.projection.pixelsPerUnit=5+rnd()*100;
  for(let i=0;i<100;i++){
   const p=[rnd()*1600-100,rnd()*1000-100],owner=i%4===0?undefined:i%4===1?{groundAligned:true}:{x:rnd()*30,y:rnd()*30,renderHeight:i%3?rnd()*6:undefined};
   const x=old.call(a,p,owner),y=next.call(b,p,owner);assert.deepEqual(y.toArray(),x.toArray());
  }
 }
});
test('stable camera reuses two basis vectors and invalidates on quaternion mutation',()=>{
 const a=scene(),p=[500,200],owner={x:10,y:12,renderHeight:1};allocations=0;
 for(let i=0;i<10000;i++)old.call(a,p,owner);const oldCount=allocations;
 const b=scene();allocations=0;for(let i=0;i<10000;i++)next.call(b,p,owner);const nextCount=allocations;
 assert.equal(oldCount,30000);assert.equal(nextCount,10002);
 const cached=b.vertexBasisR66;b.camera.quaternion.y=.2;next.call(b,p,owner);assert.notEqual(b.vertexBasisR66,cached);
 console.log('R66_VERTEX_ALLOCATIONS',JSON.stringify({vertices:10000,before:oldCount,after:nextCount,reduction:1-nextCount/oldCount}));
});
