'use strict';
// The actual browser loader runs on the exact compact artifacts; this test
// confirms its output keeps all original BIN contents, non-attack tracks and rig.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
globalThis.crypto??=require('node:crypto').webcrypto;
const pathR=path.resolve(__dirname,'../..');
require(path.resolve(pathR,'runtime-text/hwando-3d-r1302.js'));
const api=globalThis.__STORYWORLD_HERO_ATTACK_R1306__;
const heroes={seoha:'Attack_EgoCast',neon:'Attack_EgoCast',lauren:'Attack_LanceThrust',michaela:'Attack_HealPulse',slayer:'Attack_DownCleave',hunter:'Attack_BowShot',gunner:'Attack_AimFire',persona:'Attack_EgoCast',ego:'Attack_AwakenedBurst'};
const stockDir=process.env.SW0025_STOCK||path.resolve(pathR,'runtime-text/assets/r1305');
const deltaDir=process.env.SW0025_DELTA||path.resolve(pathR,'runtime-text/assets/r1306');
function parse(buf){
 const b=Buffer.from(buf),l=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+l).toString());
 return [j,b.subarray(28+l)];
}
(async()=>{
 assert.equal(api.path('hwando'),null);
 let total=0;
 for(const [hero,clip] of Object.entries(heroes)){
  const old=fs.readFileSync(path.join(stockDir,`${hero}-3d.glb`));
  const source=old.buffer.slice(old.byteOffset,old.byteOffset+old.length);
  const bytes=fs.readFileSync(path.join(deltaDir,`${hero}-attack.json`));
  total+=bytes.length;assert.ok(bytes.length<=650000);assert.equal(bytes.includes(13),false);
  const delta=JSON.parse(bytes);
  const [base,baseBin]=parse(old),[New,newBin]=parse(await api.graft(source,delta,hero,clip));
  assert.ok(newBin.subarray(0,baseBin.length).equals(baseBin));
  for(const k of ['skins','textures','images','scene','scenes','extensionsUsed','extensionsRequired'])assert.deepEqual(New[k],base[k]);
  assert.deepEqual(New.materials.slice(0,base.materials.length),base.materials);
  assert.deepEqual(New.meshes.slice(0,base.meshes.length),base.meshes);
  assert.deepEqual(New.accessors.slice(0,base.accessors.length),base.accessors);
  assert.deepEqual(New.bufferViews.slice(0,base.bufferViews.length),base.bufferViews);
  for(const [i,n] of base.nodes.entries()){
   const copy={...New.nodes[i]};if(Object.hasOwn(n,'children'))copy.children=copy.children.slice(0,n.children.length);else delete copy.children;
   assert.deepEqual(copy,n);
  }
  const nonAttack=j=>j.animations.filter(a=>a.name!==clip);
  assert.deepEqual(nonAttack(New),nonAttack(base));
  const attack=j=>j.animations.find(a=>a.name===clip);
  assert.notDeepEqual(attack(New),attack(base));
  await assert.rejects(()=>api.graft(source,{...delta,sourceSha256:'0'.repeat(64)},hero,clip),/source version/);
  await assert.rejects(()=>api.graft(source,{...delta,animation:{...delta.animation,name:'Walk'}},hero,clip),/attack slot/);
  console.log('PASS',hero,`${bytes.length} bytes,`,attack(New).channels.length,'tracks,',New.meshes.length-base.meshes.length,'new rigid props');
 }
 assert.ok(total<1000000,'compact payload total');
 console.log('PASS total bytes',total);
})().catch(e=>{console.error(e);process.exitCode=1;});
