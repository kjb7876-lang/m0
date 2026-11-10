'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const engine = require('./runtime.js');
const catalog = require('./catalog.json');
const at = (id, p, patch = {}) => { const e = {...catalog.find(e => e.id === id), ...patch}; return engine.sample(e, e.duration * p, e.seed); };
const checks = [];
function test(name, fn) { fn(); checks.push(name); }
test('Harvest halo and collection motes contract; no outward hit ring', () => {
  const early = at('procedural-harvest', .25, {source:'test'}), late = at('procedural-harvest', .6, {source:'test'});
  assert(late.primitives.find(q => q.type === 'ring').radius < early.primitives.find(q => q.type === 'ring').radius);
  for(const frame of [early,late]) assert.equal(frame.primitives.filter(q => q.type === 'ring').length, 1);
  const radius = f => f.primitives.filter(q => q.type === 'particle').map(q => Math.hypot(q.x,q.y));
  const a = radius(early), b = radius(late); assert.equal(a.length,14); assert.equal(b.length,14);
  assert(b.every((r,i) => r < a[i]));
});
test('Binding eight links tighten around a stationary lock', () => {
  const links = p => at('procedural-binding',p).primitives.filter(q => q.type === 'ring' && q.radius === .11);
  const a = links(.2), b = links(.6); assert.equal(a.length,8); assert.equal(b.length,8);
  assert(b.every((q,i) => Math.hypot(q.x,q.y) < Math.hypot(a[i].x,a[i].y)));
  const lock = p => at('procedural-binding',p).primitives.filter(q => q.type === 'line' && q.width === .03).map(({x,y,x2,y2})=>({x,y,x2,y2}));
  assert.deepEqual(lock(.2),lock(.6));
});
test('Flame tips face up and recycled embers fade in at birth', () => {
  for(let i=1;i<1000;i++) {
    const particles = at('procedural-burn',i/1000).primitives.filter(q => q.type === 'particle' && q.shape === 'droplet');
    assert(particles.every(q => q.rotation === 0));
    assert(particles.filter(q => q.y > .245).every(q => q.alpha < .02));
  }
});
test('Harvest grain and woven-thread knot wraps are invisible at seam', () => {
  for(let i=1;i<1000;i++) for(const id of ['procedural-harvest','procedural-gold-thread','procedural-silver-thread']) {
    const motes = at(id,i/1000).primitives.filter(q => q.type === 'particle' && q.shape === 'diamond');
    for(const q of motes) {
      if(id === 'procedural-harvest' && q.radius > .0727) assert(q.alpha < .06);
      if(id !== 'procedural-harvest' && q.radius === .045 && Math.abs(q.x - (-.92 + 1.64 * ((u => u*u*(3-2*u))(Math.max(0,Math.min(1,(i/1000-.08)/.65)))))) > .594) assert(q.alpha < .02);
    }
  }
});
test('Delayed generic particles do not preappear before their own birth', () => {
  const e={source:'test',role:'impact',duration:1};
  const early=engine.sample(e,.001,42).primitives.filter(q=>q.type==='particle');
  assert.equal(early.length,0);
  assert.equal(engine.sample(e,.3,42).primitives.filter(q=>q.type==='particle').length,14);
});
test('All 80 real recipes have finite bounded continuous activation and deterministic replay', () => {
  for(const e of catalog) {
    for(const p of [-.001,0,.00001,.025,.1,.25,.5,.75,.9,.99999,1,1.001]) {
      const a=engine.sample(e,e.duration*p,e.seed);
      assert.deepEqual(a,engine.sample(e,e.duration*p,e.seed));
      assert(a.primitives.length<=96);
      if(p<0||p>=1) assert.equal(a.primitives.length,0);
      if(p===.00001||p===.99999) assert(a.primitives.every(q=>q.alpha<.001));
      for(const q of a.primitives) for(const v of Object.values(q)) if(typeof v==='number') assert(Number.isFinite(v));
    }
  }
});
const report={status:'PASS',version:engine.version,recipeCoverage:catalog.length,checks,limitations:['CPU numeric/semantic assertions only; no browser playback, visual quality, GPU or game integration verified.'],runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/runtime.js')).digest('hex')};
fs.writeFileSync(__dirname+'/refinement-test-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
