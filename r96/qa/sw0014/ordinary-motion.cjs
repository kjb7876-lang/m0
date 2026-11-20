const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = name => fs.readFileSync(path.join(__dirname, '../../client-source', name), 'utf8');
const uniquePath = 'assets/r410/mobs/m009.webp';
const collectorPath = 'assets/r410/mobs/m033.webp';
const collectorAttack = 'assets/r1065/mobs/ma-10-clockwork-collector-attack.webp';
const approvedId = 'hando-timeless-silver-scout-walk-d1';
const legsId = 'cult-mech-legs-walk-d1';
const frameSize = [320, 320];
const pivot = [151, 302];
function row(id, zone, name) {
  return { id, path: 'assets/r380/mobs/' + id + '.webp', cell: frameSize, pivot, visibleHeight: 212,
    cols: 9, idle: [0], move: [1, 2, 3, 4, 5, 6, 7, 8], attack: [0], facing: 'right',
    actor: { layer: 'STORY', zone, name } };
}
function scopedImage(path, naturalWidth, naturalHeight) {
  return { path, naturalWidth, naturalHeight };
}
async function makeGame({ recorder = false } = {}) {
  const draws = [];
  const images = new Map()
    .set(uniquePath, scopedImage(uniquePath, 1024, 960))
    .set(collectorPath, scopedImage(collectorPath, 1024, 960))
    .set('aim', scopedImage('aim', 512, 320))
    .set(row(approvedId).path, scopedImage(row(approvedId).path, 2880, 320));
  const requested = [];
  const ctx = Object.create({
    drawImage(image, ...args) { draws.push({ path: image.path, source: args.slice(0, 4), dest: args.slice(4) }); }
  });
  if (recorder) ctx.commands = [];
  const storage = { getItem: () => null, setItem() {} };
  let clock = null;
  const story = { clock: () => clock, frameFor(e, f) { return f; } };
  const approvedRows = [row(approvedId, 'hando01', '^악몽 정찰체'), row(legsId, 'cult05', '^설원 아래의 기계 다리')];
  const sandbox = vm.createContext({ window: null, ctx, room: { id: 'hando01' }, zone: 'hando01', layer: 'STORY',
    time: 20, player: { x: 5, y: 0 },
    localStorage: storage, readyImage: p => images.has(p) ? { image: images.get(p) } : null,
    ensureImages: paths => { requested.push(...paths); return Promise.resolve(); },
    setInterval() {}, setTimeout() {}, fetch: async () => ({ ok:true, json:async () => ({ mobs:approvedRows }) }),
    __STORYWORLD_STORY_COMBAT_R54__: story,
    drawEnemy(e) {
      const co = e.region === 'approved' ? this.window.__STORYWORLD_APPROVED_MOBS_R380__.frameOf(e, e.sheet) : null;
      const src = co ? [...co.assetFrame.sourceRect] : [e.column || 0, e.sourceRow || 0, e.aimArt ? 128 : 256, 320];
      const body = e.bodyPath || uniquePath;
      ctx.drawImage(images.get(e.aimArt ? 'aim' : co ? co.path : body), ...src, -151, -302, 320, 320);
      if(!co) e.r1206Look = Object.freeze({ path: body, frame: { assetFrame: { sourceRect: Object.freeze(src) } } });
      return true;
    },
  });
  sandbox.window = sandbox;
  sandbox.__STORYWORLD_MOB_UNIQUE_R248__ = { sheetFor: e => e.region === 'unique' ? { path: e.bodyPath || uniquePath } : null };
  vm.runInContext(source('approved-mobs-r380.js'), sandbox);
  vm.runInContext(source('mob-motion-r286.js'), sandbox);
  vm.runInContext(source('mob-attack-dots-r1065.js'), sandbox);
  vm.runInContext(source('mob-motion-consistency-r1226.js'), sandbox);
  await new Promise(setImmediate);
  return {
    sandbox, draws, images, requested,
    setClock: value => { clock = value; },
    paint(e) { assert.equal(sandbox.drawEnemy(e), true); return draws.at(-1); },
  };
}
const enemy = overrides => ({ hp: 85, x: 2, y: 0, spawnState: 'active', rangedAim: 0, cd: -.1, ...overrides });

for (const recorder of [false, true]) {
  test(`R248 rendered body follows the cast stages (${recorder ? 'recorder' : 'Canvas'} drawing)`, async () => {
    const game = await makeGame({ recorder });
    const e = enemy({ region: 'unique', rangedWindup: .65 });
    assert.deepEqual(game.paint(e).source, [0, 640, 256, 320]);
    game.sandbox.time += .36;
    e.rangedWindup = .29;
    assert.deepEqual(game.paint(e).source, [256, 640, 256, 320]);
    e.rangedWindup = 0;
    e.cd = 2.1;
    e.lastAttackKind = 'ranged';
    game.sandbox.time += .29;
    game.setClock({ kind: 'ranged', frame: 2, angle: 0 });
    assert.deepEqual(game.paint(e).source, [512, 640, 256, 320]);
    assert.deepEqual([...e.r1206Look.frame.assetFrame.sourceRect], [512, 640, 256, 320]);
    game.setClock({ kind: 'ranged', frame: 3, angle: 0 });
    assert.deepEqual(game.paint(e).source, [768, 640, 256, 320]);
    assert.equal(Object.hasOwn(game.sandbox.ctx, 'drawImage'), false);
    assert.equal(e.rangedWindup, 0);
    assert.equal(e.cd, 2.1);
    assert.equal(e.attack, undefined);
  });
}

test('R248 leaves authored aim art, melee art and interrupted casts intact', async () => {
  const game = await makeGame();
  const e = enemy({ region: 'unique', rangedWindup: .22, aimArt: true });
  assert.equal(game.paint(e).path, 'aim');
  e.aimArt = false;
  e.rangedWindup = 0;
  assert.deepEqual(game.paint(e).source, [0, 0, 256, 320]);
  e.attack = { elapsed: .50, castWindup150: .4, angle: Math.PI };
  e.sourceRow = 640;
  e.column = 256;
  assert.deepEqual(game.paint(e).source, [256, 640, 256, 320]);
  assert.equal(e.attack.elapsed, .50);
  e.attack = null;
  e.boss = true;
  e.rangedWindup = .35;
  e.sourceRow = 0;
  assert.deepEqual(game.paint(e).source, [256, 0, 256, 320]);
});

test('R248 without a story clock uses confirmed release cooldown, then returns to walking', async () => {
  const game = await makeGame();
  const e = enemy({ region: 'unique', rangedWindup: .35 });
  game.paint(e);
  e.rangedWindup = 0;
  e.cd = 2.1;
  e.lastAttackKind = 'ranged';
  game.sandbox.time += .35;
  assert.deepEqual(game.paint(e).source, [512, 640, 256, 320]);
  game.sandbox.time += .20;
  assert.deepEqual(game.paint(e).source, [768, 640, 256, 320]);
  game.sandbox.time += .15;
  assert.deepEqual(game.paint(e).source, [0, 0, 256, 320]);
});

test('R248 prefers the collector’s mapped attack strip while preserving the native melee row', async () => {
  const game = await makeGame();
  const e = enemy({ region: 'unique', name: '태엽 수집자', bodyPath: collectorPath, rangedWindup: .45 });
  const cold = game.paint(e);
  assert.equal(cold.path, collectorPath);
  assert.deepEqual(cold.source, [0, 640, 256, 320]);
  assert.equal(game.requested.filter(p=>p===collectorAttack).length, 1);
  game.images.set(collectorAttack, scopedImage(collectorAttack, 1038, 268));
  assert.equal(game.paint(e).path, collectorAttack);
  assert.deepEqual(game.paint(e).source, [0, 0, 173, 268]);
  e.rangedWindup = 0;
  game.setClock({ kind: 'ranged', frame: 2, angle: 0 });
  assert.deepEqual(game.paint(e).source, [519, 0, 173, 268]);
  e.attack = { elapsed: .50, angle: 0 };
  e.sourceRow = 640;
  e.column = 256;
  assert.equal(game.paint(e).path, collectorPath);
  assert.deepEqual(game.paint(e).source, [256, 640, 256, 320]);
});

test('R380 requests its four-frame attack strip, keeps the cold body and retains the pivot', async () => {
  const game = await makeGame();
  const fallback = row(approvedId);
  const id = 'assets/sw0014/' + approvedId + '-attack.webp';
  const e = enemy({ region: 'approved', sheet: fallback, name: '악몽 정찰체', attack: { elapsed: .31, angle: 0, castWindup150: .4 } });
  const motion = game.sandbox.__STORYWORLD_MOB_MOTION_R286__;
  const approved = game.sandbox.__STORYWORLD_APPROVED_MOBS_R380__;
  assert.deepEqual([...approved.assign(e).attack], [0]);
  assert.equal(motion.kindOf(e), 'move-only');
  const cold = game.paint(e);
  assert.equal(cold.path, fallback.path);
  assert.notEqual(cold.dest[3], 320);
  assert.ok(Math.abs(cold.dest[1] + cold.dest[3] * 302/320)<1e-9);
  assert.equal(game.requested.filter(p=>p===id).length, 1);
  game.images.set(id, scopedImage(id, 1280, 320));
  assert.deepEqual(game.paint(e).source, [320, 0, 320, 320]);
  assert.equal(game.paint(e).path, id);
  assert.equal(e.attack.elapsed, .31);
  assert.equal(e.x, 2);
  game.sandbox.time += 3.2; // Re-evaluate R286 after its cached classification expires.
  assert.equal(motion.kindOf(e), 'move-only');
  const frame = approved.frameOf(e, fallback);
  assert.deepEqual([...frame.assetFrame.pivot], pivot);
  assert.equal(frame.assetFrame.visibleHeight, 212);
  assert.deepEqual(fallback.attack, [0]);
  e.attack.elapsed = .42;
  assert.deepEqual(game.paint(e).source, [640, 0, 320, 320]);
  e.attack.elapsed = .62;
  assert.deepEqual(game.paint(e).source, [960, 0, 320, 320]);
});

test('R380 lets the mechanical legs use dedicated aim first and attack on release', async () => {
  const game = await makeGame();
  const fallback = row(legsId);
  const id = 'assets/sw0014/' + legsId + '-attack.webp';
  game.images.set(fallback.path, scopedImage(fallback.path, 2880, 320));
  game.images.set(id, scopedImage(id, 1280, 320));
  game.sandbox.room = { id: 'cult05' };
  game.sandbox.zone = 'cult05';
  const e = enemy({ region: 'approved', sheet: fallback, name: '설원 아래의 기계 다리', rangedWindup: .55 });
  assert.equal(game.paint(e).path, fallback.path);
  e.rangedWindup = 0;
  game.setClock({ kind: 'ranged', frame: 2, angle: 0 });
  assert.equal(game.paint(e).path, id);
  assert.deepEqual(game.paint(e).source, [640, 0, 320, 320]);
});
