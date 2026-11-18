'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../client-source/mobile-memory-r980.js'), 'utf8');

function boot(mobile) {
  const copies = [];
  let mobileChecks = 0;
  class Image {
    constructor() {
      this.complete = true;
      this.src = 'assets/fixture.webp';
      this.naturalWidth = 1536;
      this.naturalHeight = 384;
    }
  }
  class Context {
    drawImage(...args) { this.draw = args; }
  }
  class Scene {
    constructor() { this.textures = new Map(); }
    texture(image, mutable) {
      const record = this.textures.get(image) || {refs: 0, image, mutable};
      record.refs++;
      this.textures.set(image, record);
      return record;
    }
    release(image) {
      const record = this.textures.get(image);
      assert.ok(record, 'release must return a reference previously handed out');
      if (!--record.refs) this.textures.delete(image);
    }
  }
  function canvas() {
    const context = new Context();
    const c = {
      getContext(kind, options) {
        assert.equal(kind, '2d');
        this.readHint = options?.willReadFrequently;
        return context;
      }
    };
    copies.push(c);
    return c;
  }
  const env = {
    localStorage: {getItem: () => null, setItem() {}},
    document: {readyState: 'complete', createElement: canvas},
    HTMLImageElement: Image, CanvasRenderingContext2D: Context,
    StoryPhase1: {CommandScene: Scene},
    __STORYWORLD_MOBILE_R63__: {isMobile() { mobileChecks++; return mobile; }},
    setInterval: () => 1, addEventListener() {}, performance: {now: () => 1}
  };
  env.window = env;
  vm.runInNewContext(source, env);
  return {copies, api: env.__STORYWORLD_MOBILE_MEMORY_R980__, image: new Image(),
    context: new Context(), scene: new Scene(), checks: () => mobileChecks};
}

{
  const {copies, api, image, context, scene, checks} = boot(true);
  const before = checks();
  context.drawImage(image, 96, 32, 384, 192, 4, 8, 40, 20);
  const sheet = copies[0];
  assert.equal(sheet.readHint, true, 'mobile half sheets feed CPU crop/mask readers');
  assert.deepEqual([sheet.width,sheet.height], [768,192]);
  assert.deepEqual(context.draw, [sheet,48,16,192,96,4,8,40,20]);
  assert.equal(scene.texture(image, false).image, sheet, 'WebGL uses same source as 2D');
  assert.equal(scene.texture(image, false).image, sheet);
  assert.equal(copies.length, 1);
  assert.equal(checks(), before, 'no per-draw or per-texture mobile detection');

  api.setTierHalf(false);
  assert.equal(scene.texture(image, false).image, image, 'PC-quality tier uses full source');
  scene.release(image);
  scene.release(image);
  scene.release(image);
  assert.equal(scene.textures.size, 0);
  assert.equal(api.inspect().stats.halfRefOut, 0);
  assert.equal(api.inspect().stats.halfRefMismatch, 0);

  api.setTierHalf(true, false);
  assert.equal(scene.texture(image, true).image, image, 'mutable textures use the original');
  scene.release(image);
  api.setHalf(false);
  context.drawImage(image, 0, 0);
  assert.equal(context.draw[0], image);
}
{
  const {copies, api, image, context, scene} = boot(false);
  context.drawImage(image, 0, 0);
  assert.equal(context.draw[0], image);
  assert.equal(copies.length, 0);
  api.setTierHalf(true, true);
  context.drawImage(image, 0, 0);
  assert.equal(copies.length, 1, 'forced low desktop keeps its half-size texture');
  assert.equal(copies[0].readHint, undefined, 'desktop keeps default canvas backing');
  assert.equal(scene.texture(image, false).image, copies[0]);
  scene.release(image);
  assert.equal(scene.textures.size, 0);
}
console.log('Mobile read hint, native crop coordinates, WebGL source/refcounts and desktop quality passed.');
