const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const code = name => fs.readFileSync(path.join(root, 'client-source', name), 'utf8');
const ThreeRenderer = function () {};
ThreeRenderer.prototype.render = function () {};

test('the sand follows connected narrow floor towards the central clearing without exposing other islands', () => {
  const sandbox = vm.createContext({
    window: { StoryPhase1: { ThreeRenderer } },
    localStorage: { getItem: () => null },
    setInterval() {}
  });
  vm.runInContext(code('cave-r204.js').replace('C.render=wrapFn(C.render);', 'globalThis.sandCells=timeSandCells;C.render=wrapFn(C.render);'), sandbox);
  const floorCells = [];
  for (let x = 1; x <= 35; x++) for (let y = 6; y <= 9; y++) floorCells.push([x, y]);
  for (let x = 40; x <= 57; x++) for (let y = 6; y <= 9; y++) floorCells.push([x, y]);
  const ex = { entry: { x: 1.5, y: 7.5 }, worldWardR81: { gatherAnchor: { x: 34.5, y: 7.5 } }, floorCells };
  const original = JSON.stringify(ex);
  const cells = sandbox.sandCells(ex);
  const keys = new Set(floorCells.map(([x, y]) => x + ',' + y));
  assert.ok(cells.length >= 60);
  assert.ok(cells.every(c => c.x < 35 && keys.has(c.x + ',' + c.y)));
  const y7 = cells.filter(c => c.y === 7).sort((a, b) => a.x - b.x);
  assert.ok(y7[0].corners[0][0] > y7.at(-1).corners[0][0]);
  assert.ok(cells.some(c => c.corners.some(([, a]) => a >= .9)));
  assert.ok(cells.some(c => c.corners.some(([, a]) => a <= .12)));
  assert.equal(JSON.stringify(ex), original);
});

function combatEnvironment() {
  const ids = Array.from({ length: 6 }, (_, i) => 'kair01:kair-academy-wave-' + (i + 1));
  const units = ids.map((id, i) => ({ id, x: 20 + i, y: 27, hp: 100, maxHp: 100, radius: .3, spawnState: i ? 'hidden' : 'active' }));
  const boss = { id: 'kair01:mb-kair01-v31231', nativeId: 'mb-kair01-v31231', x: 16, y: 12, boss: true, hp: 2000, spawnState: 'hidden' };
  const room = { id: 'kair01', layer: 'STORY', enemies: [...units, boss], props: [],
    exploration: { entry: { x: 88, y: 60.5 }, worldWardR81: {}, worldR74: { doors: [{ id: 'door-2', x: 5, y: 6, width: 8 }] } } };
  const player = { x: 87, y: 58, hp: 100 };
  const claims = {};
  const hurt = [];
  const sandbox = vm.createContext({
    window: {
      __STORYWORLD_CRATES_R108__: { scatterSpots: p => [{ x: p.x + 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x - 1, y: p.y }] },
      __STORYWORLD_PROGRESSION_R62__: { state: () => ({ pointDropClaimsR64: claims }) }
    },
    localStorage: { getItem: () => null }, room, player, time: 0,
    world: { 'STORY:kair01': room }, started: true, loading: false, modal: false, storyScene: false,
    VFX: { core: 'core' }, saveGame() {}, fx() {}, toast() {}, blocked: () => false, clearLine: () => true,
    completed: () => false, readyImage: () => ({ image: {} }), maxHP: () => 500,
    hurt: (damage, owner) => hurt.push([damage, owner]),
    moveActor(e, x, y) { e.x += x; e.y += y; }
  });
  vm.runInContext(code('combat-r170.js').replace('function set(p){prefs=',
    'globalThis.testAPI={academyState,academyStep,academyAfterKill,saveAcademyRows,sandRoom,sandPlan,stepBlackSand};function set(p){prefs='), sandbox);
  return { ids, units, boss, room, claims, player, hurt, sandbox, testAPI: sandbox.testAPI };
}

test('Academy starts six existing IDs in order, with no simultaneous wave and native save rows', () => {
  const { ids, units, room, sandbox, testAPI } = combatEnvironment();
  const s = testAPI.academyState(room);
  assert.equal(room.enemies.length, 1);
  assert.equal(room.props.length, 2);
  testAPI.academyStep(room, s);
  for (let i = 0; i < 6; i++) {
    sandbox.time += 1;
    testAPI.academyStep(room, s);
    assert.equal(s.active.id, ids[i]);
    assert.equal(room.enemies.filter(e => units.includes(e) && e.hp > 0).length, 1);
    s.active.deadRecorded = true;
    s.active.hp = 0;
    testAPI.academyAfterKill(room, s.active);
    testAPI.academyStep(room, s);
  }
  sandbox.time += 100;
  testAPI.academyStep(room, s);
  assert.equal(s.active, null);
  const raw = { rooms: { 'STORY:kair01': { enemies: [] } } };
  assert.equal(testAPI.saveAcademyRows(raw), raw);
  assert.deepEqual(Array.from(raw.rooms['STORY:kair01'].enemies, e => e.id), ids);
  assert.ok(raw.rooms['STORY:kair01'].enemies.every(e => e.hp === 0 && e.spawnState === 'dead'));
});

test('the pinned door actor pays three native orbs and skips already claimed IDs', () => {
  const { room, boss, claims, sandbox, testAPI } = combatEnvironment();
  const s = testAPI.academyState(room);
  assert.ok(boss.r75Tower);
  assert.ok(Math.hypot(s.gate.x - s.door.x, s.gate.y - s.door.y) < 5);
  claims['r64:sw0019:kair01:gate:1'] = true;
  sandbox.time = 20;
  boss.hp = 0;
  boss.deadRecorded = true;
  testAPI.academyAfterKill(room, boss);
  testAPI.academyAfterKill(room, boss);
  const drops = room.props.filter(p => p.r108Orb).map(p => p.r108Orb);
  assert.equal(s.freedAt, 20);
  assert.deepEqual(drops.map(d => d.id), ['r64:sw0019:kair01:gate:0', 'r64:sw0019:kair01:gate:2']);
  assert.ok(drops.every(d => d.amount === 1));
});

test('all ten chapter boss maps get a bounded plan and gravity only applies inside the telegraphed field', () => {
  const { room, boss, player, hurt, sandbox, testAPI } = combatEnvironment();
  for (let i = 1; i <= 10; i++) {
    const r = { id: 'kair' + String(i).padStart(2, '0'), layer: 'STORY' };
    assert.ok(testAPI.sandRoom(r));
    assert.ok(testAPI.sandPlan(r).length >= 2);
  }
  assert.equal(testAPI.sandRoom({ id: 'last301', layer: 'STORY' }), false);
  assert.equal(testAPI.sandRoom({ ...room, layer: 'DREAM' }), false);
  assert.equal(testAPI.sandRoom({ ...room, egoVisitId151: 1 }), false);

  room.id = 'kair05';
  room.engaged = true;
  boss.spawnState = 'active';
  player.x = boss.x + 2;
  player.y = boss.y + 2;
  testAPI.stepBlackSand(room, .04);
  sandbox.time = 3;
  testAPI.stepBlackSand(room, .04);
  const fx = sandbox.window.__STORYWORLD_COMBAT_R170__.sand();
  assert.equal(fx.field.row, 2);
  assert.equal(hurt.length, 0);
  sandbox.time = fx.field.go + .25;
  testAPI.stepBlackSand(room, .04);
  assert.deepEqual(hurt, [[500 * .048 * .25, boss.id]]);
  const x = player.x;
  sandbox.moveActor(player, .5, 0);
  assert.ok(Math.abs(player.x - x - .5 * .64) < .001);
  boss.hp = 0;
  sandbox.moveActor(player, .5, 0);
  assert.ok(Math.abs(player.x - x - .5 * (1 + .64)) < .001);
  testAPI.stepBlackSand(room, .04);
  assert.equal(sandbox.window.__STORYWORLD_COMBAT_R170__.sand().field, null);
  boss.hp = 2000;
  sandbox.time += 5;
  testAPI.stepBlackSand(room, .04);
  const vortex = sandbox.window.__STORYWORLD_COMBAT_R170__.sand().field;
  assert.equal(vortex.row, 0);
  sandbox.time = vortex.go + .1;
  testAPI.stepBlackSand(room, .2);
  const moved = sandbox.window.__STORYWORLD_COMBAT_R170__.sand().field;
  assert.ok(Math.abs(Math.hypot(moved.x - vortex.x, moved.y - vortex.y) - .52) < .001);
});
