// Exercise the same preload selection and drawCore source rectangle used during a stage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'client-source/survival-r600.js'), 'utf8');
const original = 'assets/r600/dots/sv-beam-01.webp';
const pages = ['assets/sw0011/beam-0.webp', 'assets/sw0011/beam-1.webp'];
const draws = [];
const noop = () => {};
const ctx = new Proxy({
  drawImage(image, ...rect) {
    if (image.path === original || pages.includes(image.path)) draws.push([image.path, ...rect.slice(0, 4)]);
  }
}, { get: (object, key) => object[key] ?? noop });
const game = {
  ctx, started: true, player: {}, TILE: 32,
  room: { survivalR600: { centre: { x: 0, y: 0 } } },
  project: (x, y) => ({ x, y }), readyImage: path => ({ image: { path, width: 2048 } })
};
game.window = game;

// Set up a single beam without waiting for random spawns or a combat timer.
const fixture = `
  window.beginBeam = limit => {
    S = fresh('hwando', 'normal');
    stageRoom = room;
    const sheets = survivalSheets(limit);
    room.survivalR600.pagedBeam = sheets.pagedBeam;
    beams = [{ x: 10, y: 0, at: 0 }];
    return sheets.paths;
  };
  window.drawBeam = drawCore;
`;
vm.runInNewContext(source.replace('try{install();}', fixture + 'try{install();}'), game);
for (const limit of [undefined, 2048, 4096, 8192, 12288, 16384]) {
  const limited = !(limit >= 12288);
  const preload = Array.from(game.beginBeam(limit));
  assert.equal(preload.includes(original), !limited);
  for (const p of pages) assert.equal(preload.includes(p), limited);
  for (let tick = 0; tick < 48; tick++) {
    const frame = tick % 24, local = frame % 12;
    game.time = (tick + 0.25) / 12.5;
    draws.length = 0;
    game.drawBeam();
    const expected = limited
      ? [pages[Math.floor(frame / 12)], local % 4 * 512, Math.floor(local / 4) * 48, 512, 48]
      : [original, frame * 512, 0, 512, 48];
    assert.deepEqual(draws, [expected], 'texture limit ' + limit + ', tick ' + tick);
    assert.ok(preload.includes(draws[0][0]), 'drawn image was preloaded');
  }
}
console.log('PASS survival beam preload and draw rectangles, 6 texture limits × 2 full loops');
