'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const engine = vm.createContext({window: {}, console, performance});
vm.runInContext(read('runtime-text/dist/phase1.js'), engine);
const {ChunkManager} = engine.window.StoryPhase1;
const overlay = read('client-source/render-lod-r287.js');

function scene(mobile, tier, resident = false) {
  const mesh = x => ({isMesh: true, layers: {mask: 4}, frustumCulled: true,
    matrixWorld: {elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]},
    geometry: {boundingBox: {min: {x, y: 0, z: 0}, max: {x: x + 1, y: 2, z: 1}}}});
  const objects = [mesh(5), mesh(14), mesh(70)];
  const masks = [], warmCounts = [], activeAssets = new Map();
  const assets = {lease(p) {
    activeAssets.set(p, (activeAssets.get(p) || 0) + 1);
    return {promise: Promise.resolve(), release() {
      const n = activeAssets.get(p) - 1;
      if (n) activeAssets.set(p, n);
      else activeAssets.delete(p);
    }};
  }};
  const chunks = new ChunkManager({assets, loadDescriptor(x, y, {zone}) {
    return {assets: [zone + '/' + x + ',' + y]};
  }});
  const gl = {target: null, shadowMap: {}, getRenderTarget() { return this.target; },
    setRenderTarget(t) { this.target = t; }, render() {
      if (this.target) warmCounts.push(chunks.rows.size);
      else masks.push(objects.map(o => o.layers.mask));
    }};
  const grid = {columns: 10, rows: 11};
  const renderer = {assets, chunks, renderer: gl, T: {WebGLRenderTarget: class { texture = {}; }},
    camera: {layers: {mask: 4, enableAll() { this.mask = -1; }}}, visibleTerrainBounds: [0, 0, 10, 10],
    spatialBuilt: true, spatialRoot: {children: objects}, scene: {traverse(fn) { objects.forEach(fn); }},
    render(frame) {
      this.pending = chunks.update(this.x, 5, frame.layer + ':' + frame.zone,
        {...grid, visibleBounds: this.visibleTerrainBounds});
      gl.render(this.scene, this.camera);
    }};
  const game = {console, performance, setInterval() {}, matchMedia: () => ({matches: mobile}), innerWidth: 812,
    __STORYWORLD_PHASE1__: {controller: {state: {three: renderer}}},
    __STORYWORLD_MOBILE_TIER_R1023__: {active: () => mobile, tier: () => tier},
    localStorage: {getItem: () => JSON.stringify({resident})}};
  game.window = game;
  vm.runInNewContext(overlay, game);
  return {chunks, masks, warmCounts, objects, activeAssets, stats: () => game.__STORYWORLD_RENDER_LOD_R287__.inspect().stats,
    async frame(layer = 'STORY', zone = 'dist02', x = 5, bounds = [0, 0, 10, 10]) {
      renderer.x = x;
      renderer.visibleTerrainBounds = bounds;
      renderer.render({layer, zone, commands: []});
      await renderer.pending;
    }};
}

(async () => {
  const low = scene(true, 0);
  await low.frame();
  assert.deepEqual([...low.chunks.rows.keys()].sort(), ['0,0', '0,1', '1,0', '1,1']);
  assert.deepEqual(low.masks[0], [4, 4, 0], 'first visible object and ring edge remain visible');
  assert.ok([...low.chunks.rows.values()].every(r => r.status === 'active'));
  await low.frame('STORY', 'dist02', 45, [40, 10, 50, 20]);
  assert.ok(low.chunks.rows.has('3,1') && low.chunks.rows.has('5,2'), 'hero ring plus viewport edge');
  await low.frame();
  assert.deepEqual([...low.chunks.desired].sort(), ['0,0', '0,1', '1,0', '1,1']);
  await low.frame('DREAM', 'dist05');
  await low.frame('DREAM', 'dist05');
  assert.deepEqual([...low.activeAssets.keys()].sort(), [...low.chunks.desired].map(k => 'DREAM:dist05/' + k).sort());
  assert.ok(low.objects.every(o => o.layers.mask === 4), 'masks restored after the render');
  assert.equal(low.warmCounts.length, 0);
  assert.equal(low.stats().viewportStarts, 2);
  for (const [mobile, tier, resident] of [[false, 0, false], [true, 2, false], [true, 0, true]]) {
    const w = scene(mobile, tier, resident);
    await w.frame();
    await w.frame();
    assert.deepEqual(w.warmCounts, [110]);
    assert.equal(w.chunks.rows.size, resident ? 110 : 4);
  }
  console.log('PASS tier 0 touch viewport, real chunk leases on travel/return and STORY→DREAM, mesh masks, desktop/high/resident warm');
})().catch(e => { console.error(e); process.exitCode = 1; });
