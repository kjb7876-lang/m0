'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const r96=path.resolve(__dirname,'../..');
const runtime=path.join(r96,'runtime-text');
const index=JSON.parse(fs.readFileSync(path.join(runtime,'assets/sw0014/legacy-attack/index.json'),'utf8'));
const src=fs.readFileSync(path.join(r96,'client-source/mob-attack-dots-r1065.js'),'utf8');

(async()=>{
 assert.equal(Object.keys(index.actors).length,14);
 assert.equal(index.frames,4);
 const loaded=new Set(),requests=[];
 let phase=null;
 const context={
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(index)}),
  ensureImages:paths=>{requests.push(...paths);return Promise.resolve()},
  readyImage:path=>loaded.has(path)?{image:{naturalWidth:1024,naturalHeight:224}}:null,
  setInterval:()=>0,time:1,
  localStorage:{getItem:()=>null,setItem(){}},
  __STORYWORLD_STORY_COMBAT_R54__:{frameFor:(_e,f)=>f},
  __STORYWORLD_MOB_MOTION_R1226__:{attackPhase:()=>phase}
 };
 context.window=context;
 vm.runInNewContext(src,context);
 await new Promise(resolve=>setImmediate(resolve));
 const attack=context.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
 const frame=(e,f)=>context.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,f);
 for(const [nativeId,sheet] of Object.entries(index.actors)){
  const raw=fs.readFileSync(path.join(runtime,sheet.path));
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),sheet.sha256);
  const actor={nativeId,hp:100,attack:null,profile:{}};
  const stance={path:sheet.stance.path,flip:false,assetFrame:{sourceRect:sheet.stance.rect}};
  const contact={path:sheet.contact.path,assetFrame:{sourceRect:sheet.contact.rect}};
  actor.profile.frames={idle:stance};
  const before=JSON.stringify(actor);
  phase=null;
  assert.equal(frame(actor,stance),stance);
  assert.ok(requests.includes(sheet.path));
  loaded.add(sheet.path);
  assert.equal(frame(actor,stance),stance);
  for(const kind of ['melee','ranged']){
   for(let cell=0;cell<4;cell++){
    phase={kind,cell,angle:cell%2?Math.PI:0};
    const f=frame(actor,cell===2?contact:stance);
    assert.equal(f.path,sheet.path);
    assert.equal(f.r1065LegacyAttack,true);
    assert.equal(f.assetFrame.sourceRect[0],cell*256);
    assert.equal(f.assetFrame.visibleHeight,sheet.height);
    assert.deepEqual(Array.from(f.assetFrame.pivot),[128,190]);
    assert.equal(f.flip,cell%2===1);
   }
  }
  assert.equal(JSON.stringify(actor),before);
  assert.equal(attack.covers(actor),false,'No AI reclassification from the newly drawn sheet');
  const other={path:'assets/r248/mobs/unrelated.webp'};
  assert.equal(frame(actor,other),other);
  const otherCrop={...contact,assetFrame:{sourceRect:[0,0,1,1]}};
  assert.equal(frame(actor,otherCrop),otherCrop);
  const dead={...actor,hp:0};
  assert.equal(frame(dead,stance),stance);
  loaded.delete(sheet.path);
  assert.equal(frame(actor,stance),stance);
  // Same-room eviction can request the same sheet again without issuing repeated requests.
  const beforeRetry=requests.length;
  context.time+=1.6;
  assert.equal(frame(actor,stance),stance);
  assert.equal(requests.length,beforeRetry+1);
  frame(actor,stance);
  assert.equal(requests.length,beforeRetry+1);
 }
 assert.equal(attack.inspect().stats.errors,0);
 console.log('PASS 14 legacy source families, melee and ranged four-phase routes, unchanged AI, flipped facing and eviction recovery.');
})().catch(err=>{console.error(err);process.exitCode=1});
