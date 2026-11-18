'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const measure = process.argv[2] === '--measure';
const r96 = measure ? path.resolve(process.argv[3], 'r96') : path.resolve(__dirname, '../..');
const smokePath = 'assets/r108/eden/smoke.webp';
const frame = [256, 256, 256, 256, -128, -228, 256, 256];
const smokeFilter = 'brightness(.14) saturate(0) contrast(1.1)';

function probe(room, hero) {
  const images = new Map(), drawn = [], reads = [];
  let throwOnSmoke = false;
  const host = {
    player: {hero}, time: 1, zoom: 1, room, zone: room.id, layer: room.layer,
    effects: [], settings: {lowFx: true},
    performance: {now: () => 600}, localStorage: {getItem: () => null}, setTimeout() {},
    project: (x, y) => ({x, y}), drawObjective() {}, drawBurnDeath3() {}, tick() {},
    drawAssetFrame3() {}, sprite() {}, drawEnemy(e) { host.sprite(e.drawn, 0, 0, 60, {}); },
    __STORYWORLD_SKILL_FX_R292__: {inspect: () => ({active: [{key: hero + ':w'}]})},
    readyImage(name) {
      if (!images.has(name)) images.set(name, {src: name, naturalWidth: 1024, naturalHeight: 1024});
      return {image: images.get(name)};
    },
    ctx: {
      globalAlpha: 1, filter: 'none', stack: [],
      save() { this.stack.push([this.globalAlpha, this.filter]); },
      restore() { [this.globalAlpha, this.filter] = this.stack.pop(); },
      translate() {}, scale() {},
      drawImage(im, ...args) {
        if (throwOnSmoke && im === images.get(smokePath)) throw Error('draw failed');
        drawn.push({im, args, filter: this.filter, alpha: this.globalAlpha});
      }
    },
    document: {createElement(tag) {
      assert.equal(tag, 'canvas');
      const canvas = {getContext: () => ({
        drawImage(im) { canvas.source = im; },
        getImageData(x, y, w, h) {
          reads.push(w * h);
          return {data: new Uint8ClampedArray(w * h * 4)};
        },
        putImageData() {}
      })};
      return canvas;
    }}
  };
  host.drawEffect = () => host.ctx.drawImage(images.get(smokePath), 0, 0);
  host.window = host;
  vm.createContext(host);
  for (const name of ['hero-palette-r302.js', 'age15-r1054.js', 'mob-death-r462.js']) {
    vm.runInContext(fs.readFileSync(path.join(r96, 'client-source', name), 'utf8'), host, {filename: name});
  }
  host.tick();
  host.drawEnemy({id: 'test-mob', hp: 2, name: 'enemy', drawn: 'assets/native.webp'});
  const fx = {type: 'enemyBurnDeath', sourceId: 'test-mob', x: 4, y: 3, age: .5, life: 1.25};
  host.drawBurnDeath3(fx);
  assert.ok(fx.r462.ash);
  const source = images.get(smokePath);
  const ash = drawn.find(row => row.im === source || row.im.source === source);
  assert.deepEqual(ash.args, frame);
  assert.equal(ash.filter, smokeFilter);
  const metrics = {
    zone: room.samongR103?.zone || room.id,
    readbackPixels: reads.reduce((a, b) => a + b, 0),
    usesOriginal: ash.im === source,
    alpha: ash.alpha
  };
  if (measure) return metrics;

  assert.equal(metrics.readbackPixels, 0);
  assert.equal(metrics.usesOriginal, true);
  assert.equal(metrics.alpha, .82);
  // Exercise the original-image marker across a renderer failure, then use the exact
  // same decoded sheet for an actual hero-owned effect with an active W skill strip.
  const prior = {};
  host.ctx.r462DeathSmoke = prior;
  throwOnSmoke = true;
  host.drawBurnDeath3(fx);
  assert.equal(host.ctx.r462DeathSmoke, prior);
  assert.equal(host.__STORYWORLD_MOB_DEATH_R462__.inspect().stats.errors, 1);
  throwOnSmoke = false;
  host.drawEffect({r302: hero});
  const action = drawn.at(-1);
  assert.equal(action.im.source, source);
  assert.equal(action.alpha, .35);
  host.drawEffect({r302: hero});
  assert.equal(drawn.at(-1).im, action.im);
  assert.deepEqual(reads, [1024 * 1024], 'Only the hero creates a tint; its second draw reuses it');
  return metrics;
}

for (const [room, hero] of [
  [{id: 'dist01', layer: 'STORY'}, 'hwando'],
  [{id: 'ep1a09', layer: 'DREAM', encounterStage: 'samongR103', samongR103: {zone: 'sz115-S02-1'}}, 'neon']
]) console.log(probe(room, hero));
