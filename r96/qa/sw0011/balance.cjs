const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file, globals) {
  globals.window = globals;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../client-source', file), 'utf8'), globals);
  return globals;
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `expected ${expected}, got ${actual}`);
}

// Exercise the same two stat builders used when a swarm or boss spawns.
const survival = load('survival-r600.js', {
  document: {
    getElementById: () => null, createElement: () => ({}), querySelectorAll: () => [],
    addEventListener() {}, head: {appendChild() {}}, body: {appendChild() {}},
  },
  localStorage: {getItem: () => null},
}).__STORYWORLD_SURVIVAL_R600__.pure;
const stages = [[0, 1], [4, 1.06], [12, 1.38], [20, 1.7], [40, 2.2], [60, 2.7], [71, 2.7]];
for (const [stage, factor] of stages) {
  for (const [tier, settings] of Object.entries(survival.DIFFS)) {
    close(survival.mobDamage(100, false, stage, 0, tier), 70 * factor * settings.dmg);
    close(survival.mobDamage(100, true, stage, 0, tier), 100 * factor * settings.dmg);
    close(survival.bossStats(stage, 0, tier, 100, true, 100).dmg, 100 * factor * settings.dmg);
  }
}
close(survival.mobDamage(100, false, 0, 1, 'normal'), 70 * 2.7);
close(survival.mobDamage(100, false, 71, 9999, 'nightmare'), 70 * 3.5 * 1.6);
assert.equal(survival.cap(9999, 71, false, 'nightmare'), 48);
assert.equal(survival.cap(9999, 71, true, 'nightmare'), 30);

// Use the installed hurt interceptor. Preserve the save-facing enemy object,
// source identity and base return, including normal, co-op and survival play.
const enemy = Object.freeze({id: 'enemy'});
let cheat = true, mode = 'off', args;
const game = load('real-mode-r376.js', {
  room: {id: 'arena', enemies: [enemy], difficultyR63: 'normal', layer: 'STORY'},
  regionById: {arena: {chapterIndex: 0, safe: false}},
  __STORYWORLD_CHEAT777__: {active: () => cheat},
  __STORYWORLD_COOP_SIM_R62__: {mode: () => mode},
  __STORYWORLD_CINEMA_MODE_R370__: {prefs: () => ({on: true})},
  __STORYWORLD_GUIDE_R77__: {__r189: true, takeNextNormal: () => 'normal'},
  hurt(...a) { args = a; return 'hit'; },
  localStorage: {getItem: () => null}, setInterval() {}, addEventListener() {},
});
function hit(source, expected) {
  assert.equal(game.hurt(100, source, 'native'), 'hit');
  close(args[0], expected);
  assert.equal(args[1], source);
  assert.equal(args[2], 'native');
}
const campaign = [100, 108, 116, 124, 136, 148, 160, 172];
for (const [chapter, expected] of campaign.entries()) {
  game.regionById.arena.chapterIndex = chapter;
  hit(enemy, expected);
  hit({owner: enemy.id}, expected);
  hit({owner: enemy}, expected);
}
game.room.layer = 'DREAM';
hit(enemy, 172);
game.regionById.arena.chapterIndex = 31;
hit(enemy, 172);
hit({owner: 'scenery'}, 100);
hit({owner: enemy.id, friendly: true}, 100);
hit({owner: enemy.id, forcedStory: true}, 100);
hit({owner: enemy.id, kind: 'awakening-shock'}, 100);
game.regionById.arena.safe = true;
hit(enemy, 100);
game.regionById.arena.safe = false;
for (mode of ['host', 'guest']) hit(enemy, 100);
mode = 'off';
game.room.survivalR600 = {};
hit(enemy, 100);
delete game.room.survivalR600;
cheat = false;
hit(enemy, 100);
// The cinema guide records this actual difficulty choice. In 777 the chapter
// factor composes with half hard damage, including after leaving 777.
assert.equal(game.__STORYWORLD_GUIDE_R77__.takeNextNormal('arena', 'DREAM'), 'hard');
game.room.difficultyR63 = 'hard';
cheat = true;
hit(enemy, 86);
cheat = false;
hit(enemy, 50);
console.log('PASS survival stage/loop curve, difficulty and population limits, 777 chapters, mode isolation and cinema modifiers');
