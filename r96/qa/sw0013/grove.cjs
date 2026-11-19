'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const T = require('../../../docs/vendor/three/build/three.module.js');
const code = fs.readFileSync(path.join(__dirname, '../../client-source/grove-r481.js'), 'utf8');
const zone = 'dist02', group = new T.Group(), trees = new T.Group();
trees.name = 'r204-trees'; group.add(trees);
let ticks, texturesDisposed = 0;
const textures = Array.from({length:3}, () => {
  const t = new T.Texture(); t.addEventListener('dispose', () => {texturesDisposed++;}); return t;
});
for (let i=0; i<12; i++) {
  const s = new T.Sprite(new T.SpriteMaterial({map:textures[i%3]}));
  s.position.set(4+(i%4)*5, 2, 4+Math.floor(i/4)*6); s.scale.set(3,4,1); trees.add(s);
}
const renderer = {T, camera:new T.PerspectiveCamera(), spatialResources:new Set(), sightState24:{},
  __r204:{group,zone,gen:1,F:{W:29,H:23,doors:[]}}};
const settings={lowFx:false};
const env = {__STORYWORLD_PHASE1__:{controller:{state:{three:renderer}}},
  __STORYWORLD_CAVE_R204__:{at:()=>-2,topHeight:()=>2}, StoryPhase1:{attachSight24(m,s){m.userData.sight=s;}}};
vm.runInNewContext(code, {window:env,performance,settings,localStorage:{getItem(){},setItem(){}},setInterval(fn){ticks=fn;}});
const api=env.__STORYWORLD_GROVE_R481__;
const grove=()=>group.getObjectByName('r481-groves');
ticks();const first=grove();assert.ok(first);const oldMeshes=[...first.children];
const original=oldMeshes.map(m=>({geo:m.geometry,mat:m.material,pos:m.geometry.getAttribute('position'),
  uv:[...m.geometry.getAttribute('uv').array],colors:[...m.geometry.getAttribute('color').array],index:[...m.geometry.index.array]}));
let seed=2166136261;for(const c of zone)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
const spots=api.plan({W:29,H:23,fv:()=>-2,top:()=>2,trees:trees.children.map(s=>({x:s.position.x,y:s.position.z})),seed,mats:3});
for(let i=1;i<=120;i++){
  renderer.camera.rotation.set(.13+i*.006,i*.031,i*-.015);
  ticks();assert.equal(grove(),first);assert.equal(renderer.spatialResources.size,oldMeshes.length*2);
  const e=renderer.camera.matrixWorld.elements;
  for(const [k,m] of first.children.entries()){
    const o=original[k],mapIndex=Number(m.name.split('-').pop()),expected=[];
    assert.equal(m.geometry,o.geo);assert.equal(m.material,o.mat);assert.equal(m.geometry.getAttribute('position'),o.pos);
    for(const p of spots.filter(p=>p.mat===mapIndex)){
      const jitter=.92+((p.x*7.31+p.y*3.17)%1+1)%1*.16,bush=p.s<.75;
      const full=4*(bush?p.s+.25:p.s)*jitter,w=full*.75,h=full*(bush?.55:1),y=p.h-(bush?.12:.05);
      for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){
        const du=(u-.5)*w,dv=(v-(bush?.06:.04))*h;
        expected.push(p.x+e[0]*du+e[4]*dv,y+e[1]*du+e[5]*dv,p.y+e[2]*du+e[6]*dv);
      }
    }
    assert.deepEqual(o.pos.array,new Float32Array(expected));
    assert.deepEqual([...m.geometry.getAttribute('uv').array],o.uv);assert.deepEqual([...m.geometry.index.array],o.index);
    assert.deepEqual([...m.geometry.getAttribute('color').array],o.colors);assert.equal(m.material.map,textures[mapIndex]);
  }
}
const version=original[0].pos.version;ticks();assert.equal(original[0].pos.version,version,'stationary buffers stay clean');
renderer.sightState24={};ticks();assert.equal(first.children[0].material.userData.sight,renderer.sightState24);
function replace(change){
  const old=grove(),owned=old.children.flatMap(m=>[m.geometry,m.material]),disposed=[];
  for(const resource of owned)resource.addEventListener('dispose',()=>disposed.push(resource));
  change();ticks();assert.notEqual(grove(),old);assert.deepEqual(new Set(disposed),new Set(owned));assert.equal(disposed.length,owned.length);
  assert.ok(owned.every(r=>!renderer.spatialResources.has(r)));assert.equal(texturesDisposed,0);return grove();
}
assert.equal(replace(()=>{settings.lowFx=true;}).userData.spots,Math.ceil(first.userData.spots/2));
replace(()=>{trees.children[2].material.map=textures[1];});
replace(()=>{trees.children[1].position.x+=2;});
replace(()=>{trees.children[3].material.color.r=.2;});
replace(()=>{renderer.__r204.F={...renderer.__r204.F,W:30};renderer.__r204.gen++;});
api.set({on:false});assert.equal(grove().visible,false);api.set({on:true});assert.equal(grove().visible,true);
assert.equal(replace(()=>{trees.clear();}),undefined);assert.equal(renderer.spatialResources.size,0);
assert.equal(api.inspect().stats.errors,0);
console.log('PASS R481 120 camera orientations: vertex buffers match planted quads, mesh/material/UV identity, bounded resources and shared texture ownership');
