// Assert the captured real renderer frames belong to this candidate, and that
// ordinary locomotion never borrows the attack-only fixture's strike cell.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const out=process.env.OUT||path.join(require('os').tmpdir(),'storyworld-r374-proof');
for(const tag of ['pc','mobile']){
 const r=JSON.parse(fs.readFileSync(path.join(out,tag+'-result.json'),'utf8'));
 for(const [file,hash]of Object.entries(r.sourceHashes)){
  const current=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../../client-source',file))).digest('hex');
  assert.equal(hash,current,tag+': source mismatch '+file);
 }
 assert(r.results.every(x=>x.ok),tag+': browser assertion failure');
 assert.equal(r.fixture.nativeId,'dist02-h1');
 const bursts=r.poses.filter(x=>x.motion?.phase==='burst');assert(bursts.length>0);
 for(const pose of bursts){
  assert.equal(pose.frame,'assets/r92/mobs/M005-attack.png');
  assert.deepEqual(pose.sourceRect,[127,0,127,163],tag+': locomotion used strike or wrong art');
  assert(pose.attackRestored);
 }
 console.log('PASS '+tag+': exact source hashes, browser checks and preparation-only burst cells');
}
