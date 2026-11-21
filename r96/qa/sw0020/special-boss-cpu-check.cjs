const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../client-source/combat-r170.js'), 'utf8');
function env() {
  const boss = { id: 'kair03:k103-boss', nativeId: 'k103-boss', name: '세이렌 모르', boss: true, hp: 400, maxHp: 1000,
    healthR71Adjusted: true, healthR71VisibleMaxHp: 1000, difficultyFactorR63: 1, x: 1, y: 2, spawnState: 'active' };
  const other = { ...boss, id: 'kair03:other', nativeId: 'other', midboss: true, boss: false };
  const room = { id: 'kair03', layer: 'STORY', enemies: [boss, other], engaged: true };
  const player = { x: 5, y: 2, hp: 777 };
  const hits = [];
  const box = vm.createContext({
    window: {}, room, player, time: 0, world: { 'STORY:kair03': room },
    localStorage: { getItem: () => null }, readyImage: () => ({ image: {} }),
    maxHP: () => 777, clearLine: () => true, blocked: () => false,
    hurt: (amount, owner) => hits.push({ amount, owner }),
    toast() {}
  });
  vm.runInContext(source.replace('function set(p){prefs=',
    'globalThis.testApi={CHAPTER_BOSSES,chapterBoss,boostChapterBoss,unboostChapterBoss,naturalSpecialHealth,serializeChapterHealth,sirenSpan,sandFieldAt,stepBlackSand,SAND_ACTIONS,sandPlan};function set(p){prefs='), box);
  return { ...box.testApi, box, room, boss, other, player, hits };
}

test('only the eight explicit story final actors are special', () => {
  const a = env();
  assert.deepEqual(Object.keys(a.CHAPTER_BOSSES), ['ep1a11','ep1b09','u203','last303','kair03','hando03','murder03','cult04']);
  assert.equal(a.chapterBoss(a.room), a.boss);
  for (const [id, nativeId] of Object.entries(a.CHAPTER_BOSSES)) {
    const final = { ...a.boss, id: id + ':' + nativeId, nativeId };
    assert.equal(a.chapterBoss({ ...a.room, id, enemies: [a.other, final] }), final);
  }
  const returned = { ...a.boss, id: 'cult04:final-boss', nativeId:'c104-boss' };
  const cult = { ...a.room, id:'cult04', activeEncounter:'finalBoss', enemies:[a.other, returned] };
  assert.equal(a.chapterBoss(cult), returned);
  a.boostChapterBoss(returned);
  assert.equal(a.naturalSpecialHealth(returned).maxHp, 1000);
  assert.equal(returned.maxHp, 2000);
  assert.equal(a.chapterBoss({ ...a.room, layer: 'DREAM' }), null);
  assert.equal(a.chapterBoss({ ...a.room, egoVisitId151: 1 }), null);
  assert.equal(a.chapterBoss({ ...a.room, enemies: [{ ...a.boss, id: a.boss.id + ':clone' }] }), null);
});

test('doubling preserves damaged HP fraction, is idempotent, and leaves native save values', () => {
  const { box, room, boss, other, boostChapterBoss, serializeChapterHealth, unboostChapterBoss } = env();
  assert.equal(boostChapterBoss(boss), true);
  assert.equal(boostChapterBoss(boss), false);
  assert.equal(boss.specialBossSW20, true);
  assert.equal(boss.maxHp, 2000);
  assert.equal(boss.hp, 800);
  assert.equal(other.maxHp, 1000);
  const saved = serializeChapterHealth(() => ({ maxHp: boss.maxHp, hp: boss.hp, visible: boss.healthR71VisibleMaxHp }), null, []);
  assert.deepEqual(saved, { maxHp: 1000, hp: 400, visible: 1000 });
  assert.equal(boss.maxHp, 2000);
  assert.equal(boss.hp, 800);
  assert.equal(unboostChapterBoss(boss), true);
  Object.assign(boss, { maxHp: 1500, hp: 600, healthR71VisibleMaxHp: 1500, difficultyFactorR63: 1.5 });
  assert.equal(boostChapterBoss(boss), true);
  assert.equal(boss.maxHp, 3000);
  assert.equal(boss.hp, 1200);
  assert.equal(box.room, room);
});

test('clock and cord stop at the first wall and use the same lane for damage', () => {
  const { room, boss, box, player, SAND_ACTIONS, sirenSpan, sandFieldAt } = env();
  box.blocked = x => x >= 4;
  const clock = SAND_ACTIONS[3];
  const f = { ...sirenSpan(room, boss, clock), spec: clock };
  assert.ok(f.length < 3);
  assert.equal(sandFieldAt({ x: 3.3, y: 2.3 }, f, room), true);
  assert.equal(sandFieldAt({ x: 3.3, y: 2.9 }, f, room), false);
  assert.equal(sandFieldAt(player, f, room), false);
  assert.equal(sandFieldAt({ x: 0.5, y: 2 }, f, room), false);
});

test('Siren cycles her three authored rows and a clock-hand hit is admitted exactly once', () => {
  const { box, room, boss, hits, stepBlackSand, sandPlan } = env();
  const current = () => box.window.__STORYWORLD_COMBAT_R170__.sand().field;
  assert.deepEqual(Array.from(sandPlan(room)), [3, 4, 5]);
  stepBlackSand(room, .04);
  box.time = 3;
  stepBlackSand(room, .04);
  const clock = current();
  assert.equal(clock.row, 3);
  box.time = clock.go - .1;
  stepBlackSand(room, .04);
  assert.equal(hits.length, 0);
  box.time = clock.go + .2;
  stepBlackSand(room, .04);
  box.time += .3;
  stepBlackSand(room, .04);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].owner, boss);
  assert.ok(Math.abs(hits[0].amount - 777 * .16) < .00001);
  for (const row of [4, 5]) {
    box.time = current().end + .1;
    stepBlackSand(room, .04);
    box.time += 5;
    stepBlackSand(room, .04);
    assert.equal(current().row, row);
  }
  boss.hp = 0;
  stepBlackSand(room, .04);
  assert.equal(current(), null);
});


test('the revived cult leader is constructed before native restore receives its preserved actor ID', async () => {
  const finale = fs.readFileSync(path.join(__dirname, '../../client-source/finale-r950.js'), 'utf8');
  const canon = { id:'c104-boss' };
  const layerKeys = [];
  const box = vm.createContext({
    localStorage: { getItem: () => null }, window: {},
    regionById: { cult04: { bosses: [canon] } },
    makeRoom(id, layer) {
      layerKeys.push([id, layer]);
      return { enemies: [{ id:id+':c104-boss', nativeId:'c104-boss' }, { id:id+':minion' }] };
    },
    actor3(profile,id,x,y,boss) { return { nativeId:profile.id,id,x,y,boss }; },
    restoreSave(raw) {
      return [
        box.makeRoom('cult04','DREAM'),
        box.makeRoom('cult04','STORY')
      ];
    }
  });
  vm.runInContext(finale, box);
  const raw = { rooms: { 'STORY:cult04': {
    activeEncounter:'finalBoss', defeatedActorIds:['cult04:c104-boss'],
    enemies:[{ id:'cult04:final-boss', nativeId:'c104-boss', hp:225 }]
  } } };
  const [dream, story] = await box.restoreSave(raw);
  assert.deepEqual(layerKeys, [['cult04','DREAM'],['cult04','STORY']]);
  assert.deepEqual(dream.enemies.map(e=>e.id), ['cult04:c104-boss','cult04:minion']);
  assert.deepEqual(story.enemies.map(e=>e.id), ['cult04:minion','cult04:final-boss']);
  assert.equal(box.makeRoom('cult04','STORY').enemies[0].id, 'cult04:c104-boss');
});
