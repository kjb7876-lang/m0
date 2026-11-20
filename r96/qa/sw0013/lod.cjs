'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const engine = vm.createContext({window: {}});
vm.runInContext(read('runtime-text/dist/phase1.js'), engine);
const {ChunkManager} = engine.window.StoryPhase1;
const tierSource = read('client-source/mobile-tier-r1023.js');
const lodSource = read('client-source/render-lod-r287.js');
const entry = {layer: 'STORY', zone: 'dist02', columns: 10, rows: 11, x: 85, y: 55, bounds: [65, 44, 99, 67]};
const dream = {layer: 'DREAM', zone: 'dist05', columns: 8, rows: 8, x: 34, y: 45, bounds: [14, 34, 54, 57]};

function fixture({mobile = true} = {}) {
  const activeAssets = new Map(), offscreen = [];
  let gate = null;
  const assets = {lease(id) {
    activeAssets.set(id, (activeAssets.get(id) || 0) + 1);
    return {promise: Promise.resolve(), release() {
      const n = activeAssets.get(id) - 1;
      if (n) activeAssets.set(id, n); else activeAssets.delete(id);
    }};
  }};
  const chunks = new ChunkManager({assets, async loadDescriptor(x, y, {zone}) {
    if (gate) await gate;
    return {assets: [zone + '/' + x + ',' + y]};
  }});
  const gl = {target: null, shadowMap: {}, getRenderTarget() { return this.target; },
    setRenderTarget(t) { this.target = t; }, render() {
      if (this.target) offscreen.push(chunks.rows.size);
    }};
  const renderer = {chunks, assets, renderer: gl, T: {WebGLRenderTarget: class {texture = {};}},
    scene: {traverse() {}}, camera: {layers: {mask: 4, enableAll() { this.mask = -1; }}},
    spatialBuilt: true, lastChunkPosition: null, render(frame) {
      const {layer, zone, x, y, columns, rows, bounds} = frame;
      this.visibleTerrainBounds = bounds;
      // Like the engine, a stationary hero normally makes no new chunk request.
      const key = [layer, zone, x, y, ...bounds].join(':');
      if (key !== this.lastChunkPosition) {
        this.lastChunkPosition = key;
        this.pending = chunks.update(x, y, layer + ':' + zone, {columns, rows, visibleBounds: bounds});
      }
      gl.render(this.scene, this.camera);
    }};
  const game = vm.createContext({console, performance, innerWidth: 812, setInterval() {}, addEventListener() {},
    document: {readyState: 'loading', getElementById() { return null; }}, matchMedia: () => ({matches: mobile}),
    localStorage: {getItem() { return null; }, setItem() {}}, __STORYWORLD_PHASE1__: {controller: {state: {three: renderer}}}});
  game.window = game;
  vm.runInContext(tierSource, game);
  vm.runInContext(lodSource, game);
  const tier = game.__STORYWORLD_MOBILE_TIER_R1023__, lod = game.__STORYWORLD_RENDER_LOD_R287__;
  return {tier, lod, chunks, offscreen, activeAssets, gl,
    frame(scene = entry) { renderer.render(scene); return renderer.pending; },
    delayLoads() {
      let resolve;
      gate = new Promise(done => { resolve = done; });
      return () => { gate = null; resolve(); };
    }};
}

// Every viewport chunk, including those outside the hero's ring, must be active.
function assertView(w, scene) {
  const {bounds, columns, rows} = scene;
  for (let y = Math.max(0, Math.floor(bounds[1] / 10)); y <= Math.min(rows - 1, Math.floor(bounds[3] / 10)); y++) {
    for (let x = Math.max(0, Math.floor(bounds[0] / 10)); x <= Math.min(columns - 1, Math.floor(bounds[2] / 10)); x++) {
      assert.equal(w.chunks.rows.get(x + ',' + y)?.status, 'active', scene.zone + ' at ' + x + ',' + y);
    }
  }
}

(async () => {
  const w = fixture();
  w.tier.setPref('mid');
  assert.equal(w.tier.tier(), 1);
  await w.frame(); await w.frame();
  assertView(w, entry);
  const visible = w.chunks.rows.size, firstRow = w.chunks.rows.get('8,5');
  assert.ok(visible < entry.columns * entry.rows);
  w.tier.setPref('low');
  await w.frame();
  w.tier.setPref('mid');
  await w.frame();
  assert.equal(w.lod.inspect().stats.viewportStarts, 1, 'low and medium share the current terrain');
  assert.equal(w.chunks.rows.get('8,5'), firstRow);
  assert.deepEqual(w.offscreen, []);

  // Cancel an outstanding high-quality load, while already-visible rows stay active.
  const finish = w.delayLoads();
  w.tier.setPref('high');
  const pending = w.frame();
  assert.equal(w.chunks.rows.size, 110);
  w.tier.setPref('mid');
  await w.frame();
  assertView(w, entry);
  finish();
  await pending;
  await w.frame();
  assert.deepEqual(w.offscreen, [], 'an obsolete full-map load may never start a shader warm');
  assert.equal(w.chunks.rows.get('8,5'), firstRow);
  assert.equal(w.activeAssets.size, w.chunks.rows.size);

  w.lod.set({resident: true});
  await w.frame(); await w.frame();
  assert.deepEqual(w.offscreen, [110], 'explicit resident mode warms every chunk once');
  assert.equal(w.chunks.rows.size, 110);
  w.tier.setPref('high');
  await w.frame();
  w.tier.setPref('mid');
  await w.frame();
  assert.deepEqual(w.offscreen, [110], 'quality switches respect explicit residency');
  w.lod.set({resident: false});
  await w.frame();
  assertView(w, entry);
  assert.equal(w.lod.inspect().stats.leases, 0);
  assert.equal(w.activeAssets.size, w.chunks.rows.size);
  assert.equal(w.chunks.rows.get('8,5'), firstRow);

  // Ready-to-warm high quality can be cancelled on a stationary frame, too.
  w.tier.setPref('high');
  await w.frame();
  assert.equal(w.lod.inspect().warmState, 'ready');
  w.tier.setPref('mid');
  await w.frame();
  assert.deepEqual(w.offscreen, [110]);
  const moved = {...entry, x: 25, y: 24, bounds: [5, 12, 52, 36]};
  await w.frame(moved); assertView(w, moved);
  await w.frame(); assertView(w, entry);
  await w.frame(dream); await w.frame(dream); assertView(w, dream);
  const dreamVisible = w.chunks.rows.size;
  assert.ok([...w.activeAssets.keys()].every(k => k.startsWith('DREAM:dist05/')));
  assert.equal(w.lod.inspect().stats.zones, 2, 'changing quality in place is not a zone entry');

  w.tier.setPref('pc');
  await w.frame(dream); await w.frame(dream);
  assert.deepEqual(w.offscreen, [110, 64]);
  assert.ok(w.chunks.rows.size < 64);
  assertView(w, dream);
  w.lod.set({resident: true, warm: false});
  await w.frame(dream); await w.frame(dream);
  assert.equal(w.chunks.rows.size, 64);
  assert.deepEqual(w.offscreen, [110, 64], 'explicit resident mode can disable the shader pass');
  w.lod.set({on: false});
  await w.frame(dream);
  assertView(w, dream);
  assert.ok(w.chunks.rows.size < 64);
  assert.equal(w.lod.inspect().stats.errors, 0);

  const pc = fixture({mobile: false});
  pc.tier.setPref('mid');
  await pc.frame(); await pc.frame();
  assertView(pc, entry);
  assert.deepEqual(pc.offscreen, [110], 'desktop medium retains its existing warm pass');
  console.log('PASS mobile medium, stationary quality, asynchronous cancellation, viewport edges, resident and desktop shader behavior');
  console.log('Fixture medium entry chunks: STORY ' + visible + '/110, Samong ' + dreamVisible + '/64; offscreen passes 0');
})().catch(error => { console.error(error); process.exitCode = 1; });
