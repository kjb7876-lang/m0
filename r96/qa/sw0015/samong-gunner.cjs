const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const engine = fs.readFileSync(path.join(root, 'runtime-text/index.html'), 'utf8');
const trigger = engine.split('\n').filter(line => /^function (awaken|ego)\(/.test(line)).join('\n');
const nativeAwakening = engine.slice(engine.indexOf('const e568AwakenBase=awaken;'), engine.indexOf('const e568DrawEffectBase=drawEffect;'));
const pulse = fs.readFileSync(path.join(root, 'client-source/samong-ult-r139.js'), 'utf8');
const orb = 'gunner-samong-ultimate.webp';
const impact = 'gunner-samong-impact.webp';

function fixture({ layer = 'DREAM', mode = 'off', safe = false } = {}) {
  const mob = { id: 'mob', hp: 100, maxHp: 100, x: 3, y: 0, spawnState: 'active' };
  const boss = { id: 'boss', boss: true, hp: 2_000, x: 4, y: 0, spawnState: 'active' };
  const startedEffects = [];
  const hits = [];
  const box = {
    started: true, modal: false, loading: false, layer, time: 10, rank: () => 0,
    player: { hero: 'gunner', hp: 100, x: 0, y: 0, ego: 0, egoCount: 0, egoCD: 0, samong: 0, samongCD: 0, resonance: 300, invincible: 0 },
    room: { enemies: [mob, boss] }, effects: [],
    safeRegion: () => safe, attackPower: () => 100,
    __STORYWORLD_COOP_SIM_R62__: { mode: () => mode },
    localStorage: { getItem: () => null }, VFX: { aura: 'ego-aura' },
    showAwakening() {}, sound() {}, toast() {}, e568PushAudit() {},
    E568_HERO_VFX: { gunner: { ultimate: orb } },
    E568_HERO_VFX_FILES: { [orb]: { sha256: 'test-sha' } }, e568HeroVfxAudit: { ultimates: [] },
    StoryPhase1: { CURRENT_PUBLIC_HERO_DATA: { heroActions: { gunner: { r: impact } } } },
    fx(type, x, y, options) {
      const effect = { type, x, y, age: 0, life: .45, ...options };
      startedEffects.push(effect);
      box.effects.push(effect);
    },
    hitEnemy(enemy, damage, source) {
      enemy.hp = Math.max(0, enemy.hp - damage);
      hits.push([enemy.id, damage, source.kind]);
      return true;
    },
    tick(dt) {
      box.time += dt;
      for (const effect of box.effects) effect.age += dt;
      box.effects = box.effects.filter(effect => effect.age < effect.life);
    },
  };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(`${trigger}\n${nativeAwakening}\n${pulse}`, box);
  return { box, mob, boss, hits, orbs: () => startedEffects.filter(effect => effect.type === 'e568HeroUltimate'), impacts: () => startedEffects.filter(effect => effect.asset === impact) };
}

test('seventh Dream EGO emits one opening orb and keeps each pulse and target impact', () => {
  const { box, mob, boss, hits, orbs, impacts } = fixture();
  for (let count = 1; count <= 6; count++) {
    box.player.ego = box.player.egoCD = 0;
    box.ego();
    box.tick(1 / 60);
    assert.equal(box.player.egoCount, count);
    assert.equal(orbs().length, 0);
  }
  box.player.ego = box.player.egoCD = 0;
  box.ego();
  assert.equal(box.player.egoCount, 0);
  assert.equal(box.player.samong, 7);
  assert.equal(orbs().length, 1);
  box.player.x = .2;
  box.tick(1 / 60);
  assert.equal(orbs().length, 1);
  assert.equal(mob.hp, 0);
  assert.equal(boss.hp, 1760);
  assert.equal(impacts().length, 2);
  assert.equal(hits.length, 2);
  box.tick(1.39);
  assert.equal(orbs().length, 1);
  box.tick(.02);
  assert.equal(orbs().length, 2);
  assert.equal(boss.hp, 1520);
});

test('restored or scripted activation without an opening orb still emits a pulse visual', () => {
  const { box, orbs, hits } = fixture();
  box.player.samong = 7;
  // A recent effect for a distant caster must not suppress the controlled hero's cue.
  box.fx('e568HeroUltimate', 2, 0, { heroIdE568: 'gunner', asset: orb });
  box.tick(1 / 60);
  assert.equal(orbs().length, 2);
  assert.equal(orbs().at(-1).x, box.player.x);
  assert.equal(hits.length, 2);
});

test('Story EGO retains its aura and leaves radius damage to scripted awakening', () => {
  const { box, orbs, hits } = fixture({ layer: 'STORY' });
  box.ego();
  box.tick(1 / 60);
  assert.equal(box.player.ego, 3);
  assert.equal(box.player.resonance, 270);
  assert.equal(box.player.samong, 0);
  assert.equal(hits.length, 0);
  assert.equal(box.effects[0].asset, 'ego-aura');
  assert.equal(box.awaken('story'), true);
  box.tick(1 / 60);
  assert.equal(orbs().length, 1);
  assert.equal(hits.length, 2);
});

test('safe zones and co-op preserve native orb while leaving R139 damage off', () => {
  for (const options of [{ safe: true }, { mode: 'guest' }]) {
    const { box, orbs, hits } = fixture(options);
    box.player.egoCount = 6;
    box.ego();
    box.tick(1 / 60);
    assert.equal(orbs().length, 1);
    assert.equal(hits.length, 0);
  }
});
