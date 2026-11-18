'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../client-source/edges-r188.js'), 'utf8');
const width = 512, height = 256;
const bytes = () => new Uint8ClampedArray(width * height * 4);
const area = bytes(), soft = bytes(), wall = bytes();
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    area[i] = x < 256 ? 127 : 128;
    soft[i] = x % 256;
    wall[i] = y;
  }
}

// Supply every combination of the three readback inputs to the production mask builder.
const inputs = [area, soft, wall];
let pixels;
const document = {createElement() {
  const data = inputs.shift();
  return {getContext: () => ({
    fillRect() {}, drawImage() {}, getImageData: () => ({data}),
    createImageData: () => ({data: bytes()}), putImageData: image => { pixels = image.data; }
  })};
}};
const game = {window: {}, performance, document};
vm.runInNewContext(source, game);
const mask = game.window.__STORYWORLD_EDGES_R188__.buildMask({bounds: [0, 0, width / 4 - 8, height / 4 - 8]});
assert.ok(mask && mask.canvas.width === width && mask.canvas.height === height);
// SHA-256 of the original R188 RGBA output for these same 131,072 inputs/world coordinates.
assert.equal(crypto.createHash('sha256').update(pixels).digest('hex'), '79101d3f8fe52b8dbedd33735e523f76eef55211241a215a59f315cf54a8dff6');
console.log('PASS edge mask RGBA across both area states and all 256 × 256 soft/wall byte values');
