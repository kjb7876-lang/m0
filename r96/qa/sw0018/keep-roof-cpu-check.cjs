const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '../..');
const overlay = fs.readFileSync(path.join(root, 'client-source/cave-r204.js'), 'utf8');
const ThreeRenderer = function () {};
ThreeRenderer.prototype.render = function () {};
const box = vm.createContext({
  window: { StoryPhase1: { ThreeRenderer } },
  localStorage: { getItem: () => null },
  setInterval() {}
});
vm.runInContext(overlay.replace('window.__STORYWORLD_CAVE_R204__=Object.freeze',
  'globalThis.roofTest={keepRoof,keepVoid,keepVoidGLSL,keepDeckGLSL,keepRamparts,bakeGround};window.__STORYWORLD_CAVE_R204__=Object.freeze'), box);
const { keepRoof, keepVoid, keepVoidGLSL, keepDeckGLSL, keepRamparts } = box.roofTest;

function arena() {
  return {
    zone: 'last301', layer: 'STORY',
    exploration: {
      walls: [
        { id: 'north', x: 19, y: 6, width: 18, depth: .24 },
        { id: 'east', x: 28, y: 12, width: .24, depth: 12 }
      ],
      worldWardR81: { bossBounds: [10, 6, 28, 18] },
      worldR74: { doors: [{ id: 'door-0', x: 20, y: 20 }, { id: 'door-2', x: 5, y: 6 }] },
      floorCells: [[10, 6], [20, 20], [9, 12]],
    }
  };
}

test('the roof is scoped to the two continuous STORY boss walls and never edits room data', () => {
  const frame = arena();
  const before = JSON.stringify(frame);
  const p = keepRoof(frame);
  assert.deepEqual({ ...p }, { x0: 10, z0: 6, x1: 28, z1: 18 });
  assert.equal(JSON.stringify(frame), before);
  assert.equal(keepRoof({ ...frame, layer: 'DREAM' }), null);
  assert.equal(keepRoof({ ...frame, zone: 'last302' }), null);
  frame.exploration.walls[0].width = 9;
  assert.equal(keepRoof(frame), null);
});

test('the inland deck and both door approaches stay outside the sea opening', () => {
  const p = keepRoof(arena());
  assert.equal(!!keepVoid(p, 19, 11), false);
  assert.equal(!!keepVoid(p, 20, 20), false);
  assert.equal(!!keepVoid(p, 9, 12), false);
  assert.equal(!!keepVoid(p, 19, 5.8), true);
  assert.equal(!!keepVoid(p, 28.4, 10), true);
  assert.equal(!!keepVoid(p, 31, 10), false);
  const evalAt = (x, y) => Function('p', 'return ' + keepVoidGLSL(p, 'p'))({ x, y });
  for (let x = 4; x < 34; x += .25) {
    for (let y = -3; y < 23; y += .25) assert.equal(!!keepVoid(p, x, y), evalAt(x, y));
  }
  assert.equal(Function('w','return '+keepDeckGLSL(p,'w'))({x: 20, y: 10}), true);
});

test('ramparts and sea are a bounded pair of render resources with the sea beneath the native deck', () => {
  class Geometry {
    constructor() { this.data = {}; }
    setAttribute(name, value) { this.data[name] = value; }
    setIndex(value) { this.index = value; }
    computeBoundingSphere() {}
  }
  class PlaneGeometry {
    rotateX() {}
    rotateY() {}
    translate(x, y, z) { this.xyz = [x, y, z]; }
  }
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.userData = {};
      this.layers = { set: n => { this.layer = n; } };
    }
  }
  const T = {
    BufferGeometry: Geometry, PlaneGeometry, Mesh,
    Float32BufferAttribute: class { constructor(values) { this.values = values; } },
    MeshBasicMaterial: class { constructor(options) { Object.assign(this, options); } },
    Texture: class { constructor(image) { this.image = image; } },
  };
  const resources = { spatialResources: new Set() }, children = [];
  keepRamparts(T, resources, { add: mesh => children.push(mesh) }, keepRoof(arena()), {}, {});
  const [ramparts, sea] = children;
  assert.equal(children.length, 2);
  assert.equal(ramparts.layer, 2);
  assert.equal(sea.layer, 2);
  assert.equal(ramparts.userData.presentationOnly, true);
  assert.equal(sea.userData.presentationOnly, true);
  const v = ramparts.geometry.data.position.values;
  const ys = v.filter((_, index) => index % 3 === 1);
  assert.ok(ys.length < 720);
  assert.ok(Math.min(...ys) <= -4);
  assert.ok(Math.max(...ys) >= 1.5);
  assert.ok(sea.geometry.xyz[1] < Math.min(...ys));
  assert.equal(resources.spatialResources.size, 5);
});
