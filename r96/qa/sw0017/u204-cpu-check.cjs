const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..', '..');
const load = (box, name) => vm.runInContext(fs.readFileSync(path.join(root, 'client-source', name), 'utf8'), box);
const storage = { getItem: () => null, setItem() {} };

function sentryFixture() {
  const gate = { id: 'door-0', r78BossDoor: true, axis: 'y', x: 20, y: 20, width: 6, closed: true };
  const room = {
    id: 'u204', layer: 'STORY', props: [], enemies: [{ nativeId: 'u204-e3', damage: 16 }],
    exploration: { bossDoorId: 'door-0', worldR74: { doors: [gate] } }
  };
  const player = { x: 20.15, y: 31.5, hp: 100 };
  const shots = [];
  const box = vm.createContext({
    window: {}, localStorage: storage, started: true, room, player, time: 0, loading: false, modal: null, storyScene: null,
    blocked: () => false, clearLine: () => true, ensureImages: () => Promise.resolve(), readyImage: () => ({}),
    tick(dt) { box.time += dt; },
    makeShot(x, y, a, speed, damage, opts) {
      const shot = { x, y, a, speed, damage, ...opts };
      shots.push({ ...shot, t: box.time });
      return shot;
    }
  });
  load(box, 'combat-r170.js');
  box.window.__STORYWORLD_COMBAT_R170__.set({ towers: false });
  const step = seconds => {
    for (let i = 0; i < Math.round(seconds / .02); i++) box.tick(.02);
  };
  return { box, player, room, gate, shots, step };
}

test('the gate sentry leaves the path and enemy roster open, acquires nearby heroes and fires a three-shot burst', () => {
  const { player, room, shots, step } = sentryFixture();
  step(1);
  assert.equal(room.props.length, 1);
  const turret = room.props[0];
  assert.equal(turret.solid, false);
  assert.ok(turret.y > 20 && Math.abs(turret.x - 20) >= 2);
  assert.equal(room.enemies.length, 1);
  assert.equal(shots.length, 0);

  room.engaged = true; // The native encounter can engage before its entrance door opens.
  player.y = 25;
  step(.42);
  assert.equal(shots.length, 0, 'spin-up runs before the first shot');
  const aim = turret.angle;
  player.x += .4;
  step(.56);
  assert.equal(shots.length, 3);
  assert.ok(shots.every(s => s.owner === turret.id && s.friendly === false && s.a === aim && s.damage > 0 && s.life < .5));
  for (let i = 1; i < shots.length; i++) assert.ok(shots[i].t - shots[i - 1].t >= .16 - 1e-5);
  step(1);
  assert.equal(shots.length, 3, 'the next burst waits for recovery');
});

test('cover, opening the door, pause and room scope prevent new fire', () => {
  const { box, player, room, gate, shots, step } = sentryFixture();
  player.y = 25;
  box.clearLine = () => false;
  step(1.2);
  assert.equal(shots.length, 0);
  box.clearLine = () => true;
  step(.32);
  gate.closed = false;
  step(1);
  assert.equal(shots.length, 0);
  gate.closed = true;
  box.storyScene = {};
  step(1);
  assert.equal(shots.length, 0);
  box.storyScene = null;
  box.room = { ...room, layer: 'DREAM', props: [] };
  step(3);
  assert.equal(shots.length, 0);
  assert.equal(box.room.props.length, 0);
});

test('shots expire before an obstruction along the fixed aim', () => {
  const { box, player, shots, step } = sentryFixture();
  player.y = 25;
  box.blocked = (_x, y, radius) => radius < .1 && y >= 24;
  step(.7);
  assert.equal(shots.length, 1);
  assert.ok(shots[0].life < .1);
});

function spiderFixture(layer = 'STORY') {
  const sources = {
    side: ['assets/r380/mobs/u204-mech-03-v1.webp', 256, [188, 187, 194, 193]],
    up: ['assets/r1018/move/u204-mech-03-up.webp', 384, [351, 351, 349, 342]],
    down: ['assets/r1018/move/u204-mech-03-down.webp', 384, [341, 347, 349, 342]]
  };
  const actor = { nativeId: 'u204-e3', id: 'u204:u204-e3', x: 20, y: 25, hp: 100 };
  const project = (x, y) => ({ x: (x - y) * 64, y: (x + y) * 32 });
  const ctx = { commands: [] };
  const box = vm.createContext({
    window: {}, localStorage: storage, room: { id: 'u204', layer }, time: 0, ctx, project,
    readyImage: () => ({ image: { naturalWidth: 1536, naturalHeight: 384 } }),
    drawEnemy(e) {
      const q = project(e.x, e.y);
      ctx.commands.push({
        kind: 'image', owner: { kind: 'enemy' }, sourcePath: sources.side[0],
        sourceRect: [e.attack ? 1024 : 0, 0, 256, 256], imageSize: [2048, 256],
        points: [[q.x - 40, q.y - 69], [q.x + 40, q.y - 69], [q.x + 40, q.y + 11], [q.x - 40, q.y + 11]]
      });
    }
  });
  load(box, 'move-dir-r974-data.js');
  load(box, 'move-dir-r1018-data.js');
  load(box, 'move-dir-r974.js');
  const draw = (x, y) => {
    actor.x += x;
    actor.y += y;
    box.time += .05;
    ctx.commands.length = 0;
    box.drawEnemy(actor);
    return ctx.commands[0];
  };
  return { actor, project, sources, draw };
}

for (const [heading, x, y] of [['side', .06, -.06], ['up', -.06, -.06], ['down', .06, .06]]) {
  test(`the ${heading} stride uses planted leg contacts and cycles through all four frames`, () => {
    const { actor, project, sources, draw } = spiderFixture();
    const [p, cell, feet] = sources[heading];
    const seen = new Set();
    for (let i = 0; i < 40; i++) {
      const result = draw(x, y);
      if (result.sourcePath !== p || i < 5) continue;
      const index = result.sourceRect[0] / cell;
      const [a, , , d] = result.points;
      const footY = a[1] + (d[1] - a[1]) * feet[index] / cell;
      assert.equal(result.r974Grounded, true);
      assert.ok(Math.abs(footY - project(actor.x, actor.y).y) < 1e-8);
      seen.add(index);
    }
    assert.equal(seen.size, 4);
  });
}

test('attack frames and the DREAM copy keep their existing render path', () => {
  const story = spiderFixture();
  story.actor.attack = {};
  assert.notEqual(story.draw(.06, -.06).r974Grounded, true);
  const dream = spiderFixture('DREAM');
  assert.notEqual(dream.draw(.06, -.06).r974Grounded, true);
});
