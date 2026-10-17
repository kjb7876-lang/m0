import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const vm = require('node:vm');
const campaign = fs.readFileSync(new URL('../client-source/campaign-combat-r63r1.js', import.meta.url), 'utf8');
const progression = fs.readFileSync(new URL('../client-source/progression-r62.js', import.meta.url), 'utf8');

const tierStart = campaign.indexOf('const PRIOR_HP=');
const tierEnd = campaign.indexOf('\n const roomKey', tierStart);
const scaleStart = campaign.indexOf(' function scaleEnemy(');
const scaleEnd = campaign.indexOf('\n function applyRoom', scaleStart);
assert.ok(tierStart >= 0 && tierEnd > tierStart && scaleStart >= 0 && scaleEnd > scaleStart, 'runtime tier and scaleEnemy definitions are present');
const runtime = {};
vm.runInNewContext(campaign.slice(tierStart, tierEnd) + campaign.slice(scaleStart, scaleEnd) + '\nthis.api={TIERS,scaleEnemy};', runtime);

test('tier health retention and incoming damage match the requested balance table', () => {
  const tiers = JSON.parse(JSON.stringify(runtime.api.TIERS));
  assert.deepEqual(
    Object.fromEntries(Object.entries(tiers).map(([id, row]) => [id, { hp: row.hp, incoming: row.incoming, reward: row.reward }])),
    {
      easy: { hp: 0.4, incoming: 0.4, reward: 1 },
      normal: { hp: 0.5, incoming: 1, reward: 3 },
      hard: { hp: 0.8, incoming: 1.2, reward: 7 },
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(tiers).map(([id, row]) => [id, { legacyConfiguredHp: row.legacyConfiguredHp, requestedRetention: row.hpRetained }])),
    {
      easy: { legacyConfiguredHp: 0.9, requestedRetention: 0.4 },
      normal: { legacyConfiguredHp: 1.4, requestedRetention: 0.5 },
      hard: { legacyConfiguredHp: 2.1, requestedRetention: 0.8 },
    },
  );
});

test('reapplying and switching tiers never stacks HP scaling and preserves the HP fraction', () => {
  const { scaleEnemy } = runtime.api;
  const base = 18_347.14285714286;
  const enemy = {
    maxHp: base * 1.4,
    hp: base * 1.4 * 0.35,
    difficultyBaseHpR63: base,
    difficultyFactorR63: 1.4,
  };
  assert.equal(scaleEnemy(enemy, 'normal'), true);
  assert.ok(Math.abs(enemy.maxHp - base * 0.5) < 1e-8);
  assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.35) < 1e-10);
  const normalMax = enemy.maxHp;
  assert.equal(scaleEnemy(enemy, 'normal'), false);
  assert.equal(enemy.maxHp, normalMax);
  assert.equal(scaleEnemy(enemy, 'easy'), true);
  assert.ok(Math.abs(enemy.maxHp - base * 0.4) < 1e-8);
  assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.35) < 1e-10);
  assert.equal(scaleEnemy(enemy, 'hard', true), true);
  assert.ok(Math.abs(enemy.maxHp - base * 0.8) < 1e-8);
  assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.35) < 1e-10);
  assert.equal(enemy.difficultyBaseHpR63, base);
});

test('R61/R40 HP normalization does not erase the difficulty multiplier', () => {
  const { scaleEnemy } = runtime.api;
  for (const [tier, runtimeHp, expectedHp] of [
    ['easy', 25_686, 10_274.4],
    ['normal', 25_686, 12_843],
    ['hard', 25_686, 20_548.8],
  ]) {
    const enemy = { maxHp: runtimeHp, hp: runtimeHp * 0.62, difficultyBaseHpR63: 2_039.4, difficultyFactorR63: 0.5 };
    assert.equal(scaleEnemy(enemy, tier), true);
    assert.ok(Math.abs(enemy.maxHp - expectedHp) < 0.001);
    assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.62) < 1e-10);
    const once = enemy.maxHp;
    assert.equal(scaleEnemy(enemy, tier), false);
    assert.equal(enemy.maxHp, once);
  }
});

test('the existing map-clear point award and duplicate guard stay intact', () => {
  assert.ok(progression.includes("if(!['STORY','DREAM'].includes(info.mode)||info.key!==info.mode+':'+info.regionId||s.clears[info.key])return false;"));
  assert.ok(progression.includes('p.points=Math.min(MAX,integer(p.points)+1);'));
  assert.ok(progression.includes("{id:'threadDanceR63'"));
});
