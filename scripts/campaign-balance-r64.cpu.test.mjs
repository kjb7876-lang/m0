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
const scaleEnd = campaign.indexOf('\n const POINT_DROP_BOSS_CHANCE', scaleStart);
assert.ok(tierStart >= 0 && tierEnd > tierStart && scaleStart >= 0 && scaleEnd > scaleStart, 'runtime tier, scaleEnemy, and applyRoom definitions are present');
const runtime = {};
vm.runInNewContext(
  campaign.slice(tierStart, tierEnd) +
    "\n const COOP_KEY='difficultyR63';function resolveRoomTier(r){return r?.[COOP_KEY]||'normal';}function ensurePointState(){}function syncPointDrops(){}\n" +
    campaign.slice(scaleStart, scaleEnd) +
    '\nthis.api={TIERS,scaleEnemy,applyRoom};',
  runtime,
);
test('R64 health retention and incoming damage use the measured R63 runtime values as the starting point', () => {
  const tiers = JSON.parse(JSON.stringify(runtime.api.TIERS));
  assert.deepEqual(
    Object.fromEntries(Object.entries(tiers).map(([id, row]) => [id, { hp: row.hp, incoming: row.incoming, reward: row.reward }])),
    {
      easy: { hp: 0.2, incoming: 0.4, reward: 1 },
      normal: { hp: 0.25, incoming: 1, reward: 3 },
      hard: { hp: 0.4, incoming: 1.2, reward: 7 },
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(tiers).map(([id, row]) => [id, { previouslyAppliedR63: row.hpRetained * 2, legacyConfigured: row.legacyConfiguredHp }])),
    {
      easy: { previouslyAppliedR63: 0.4, legacyConfigured: 0.9 },
      normal: { previouslyAppliedR63: 0.5, legacyConfigured: 1.4 },
      hard: { previouslyAppliedR63: 0.8, legacyConfigured: 2.1 },
    },
  );
});

test('reapplying, switching tiers, and restoring metadata never compound HP scaling', () => {
  const { scaleEnemy } = runtime.api;
  const base = 25_686;
  const enemy = { maxHp: base * 0.5, hp: base * 0.5 * 0.35, difficultyBaseHpR63: base, difficultyFactorR63: 0.5 };
  assert.equal(scaleEnemy(enemy, 'normal'), true);
  assert.equal(enemy.maxHp, base * 0.25);
  assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.35) < 1e-10);
  assert.equal(scaleEnemy(enemy, 'normal'), false);
  assert.equal(enemy.maxHp, base * 0.25);
  assert.equal(scaleEnemy(enemy, 'easy', true), true);
  assert.equal(enemy.maxHp, base * 0.2);
  assert.ok(Math.abs(enemy.hp / enemy.maxHp - 0.35) < 1e-10);
  assert.equal(scaleEnemy(enemy, 'hard', true), true);
  assert.equal(enemy.maxHp, base * 0.4);
  assert.equal(scaleEnemy(enemy, 'hard'), false);
  assert.equal(enemy.maxHp, base * 0.4);
});

test('common, boss, summon, and cooperative replica actors are all rescaled from their stored base HP', () => {
  const rows = [
    { id: 'boss', base: 25_686, boss: true },
    { id: 'common', base: 1_140 },
    { id: 'summon', base: 700, r61Summoned: { kind: 'echo' } },
    { id: 'replica', base: 1_140, coopReplicaR62: true },
    { id: 'trial', base: 3_000, trial: true },
  ].map(({ base, ...meta }) => ({ ...meta, maxHp: base * 0.5, hp: base * 0.25, difficultyBaseHpR63: base, difficultyFactorR63: 0.5 }));
  const room = { difficultyR63: 'normal', enemies: rows };
  assert.equal(runtime.api.applyRoom(room, 'normal'), rows.length);
  for (const enemy of rows) assert.equal(enemy.maxHp, enemy.difficultyBaseHpR63 * 0.25, enemy.id);
  const values = Object.fromEntries(rows.map(enemy => [enemy.id, enemy.maxHp]));
  assert.deepEqual(JSON.parse(JSON.stringify(values)), { boss: 6421.5, common: 285, summon: 175, replica: 285, trial: 750 });
  assert.equal(runtime.api.applyRoom(room, 'normal'), rows.length);
  assert.deepEqual(Object.fromEntries(rows.map(enemy => [enemy.id, enemy.maxHp])), values);
});

test('thread-dance caps stay unchanged and six separately purchased motifs have distinct effects', () => {
  assert.ok(campaign.includes('hitLimit=()=>Math.min(12,2+maxRank())'));
  assert.ok(campaign.includes('targetLimit=()=>Math.min(8,1+maxRank())'));
  assert.match(campaign, /attackPower\(\)\*\(\.22\+Math\.min\(\.08,skillRank\*\.006\)\)/);
  for (const [id, motif] of [['threadCrossR64','cross'],['threadFlowerR64','flower'],['threadFractalR64','fractal'],['threadClawR64','claw'],['threadTsubameR64','tsubamegaeshi'],['threadIchidanR64','decisive']]) {
    assert.ok(progression.includes("id:'" + id + "'"), 'missing purchasable passive: ' + id);
    assert.ok(campaign.includes("'" + motif + "'"), 'missing motif effect: ' + motif);
  }
  assert.match(campaign, /base\*\.35/,'fractal passive links once to another enemy for its declared fraction');
  assert.match(campaign, /perHit\/3/,'Tsubame-gaeshi splits the existing hit total across three strikes');
  assert.match(campaign, /hitIndex===castState\.hitCount-1\?1\.35:1/,'Ichidan applies the requested last-hit increase only');
  assert.match(campaign, /motifIdsR64=\['threadCrossR64'/,'motifs are selected from owned passive ranks, not core skill ranks');
  assert.match(progression, /window\.__STORYWORLD_CAMPAIGN_R63R1__\?\.drawThreadAura\?\.\(p\)/);
  assert.match(campaign, /rank<=0\|\|!p\|\|p\.hp<=0/);
});

test('point-drop rates follow tier boss chance and the one-tenth minion rule; each seeded kill roll is stable', () => {
  const start=campaign.indexOf('const POINT_DROP_BOSS_CHANCE='),end=campaign.indexOf('\n const validPointId',start);
  assert.ok(start>=0&&end>start,'point drop rate and roll helpers exist');
  const context={};
  vm.runInNewContext("const TIERS={easy:1,normal:1,hard:1};const validTier=k=>Object.prototype.hasOwnProperty.call(TIERS,k)?k:'normal';\n"+campaign.slice(start,end)+"\nthis.api={pointDropChance,rollPointDrop};",context);
  assert.deepEqual(JSON.parse(JSON.stringify(Object.fromEntries(['easy','normal','hard'].map(t=>[t,{boss:context.api.pointDropChance(t,true),minion:context.api.pointDropChance(t,false)}])))),{
    easy:{boss:.1,minion:.01},normal:{boss:.5,minion:.05},hard:{boss:.77,minion:.077},
  });
  const draws=[.1,.999],roll=context.api.rollPointDrop('normal',true,()=>draws.shift());
  assert.deepEqual(JSON.parse(JSON.stringify(roll)),{success:true,chance:.5,amount:7});
  const seedStart=campaign.indexOf(' function pointRandom('),seedEnd=campaign.indexOf('\n function recordPointDrop',seedStart);
  const seeded={};vm.runInNewContext(campaign.slice(seedStart,seedEnd)+'\nthis.api=pointRandom;',seeded);
  const a=Array.from({length:3},seeded.api('r64:8:kill:enemy-a'));
  const b=Array.from({length:3},seeded.api('r64:8:kill:enemy-a'));
  assert.deepEqual(a,b,'a restored kill ID repeats the same chance and amount roll');
});

test('the map-clear point contract and duplicate-reward guard remain unchanged', () => {
  assert.ok(progression.includes("if(!['STORY','DREAM'].includes(info.mode)||info.key!==info.mode+':'+info.regionId||s.clears[info.key])return false;"));
  assert.ok(progression.includes('p.points=Math.min(MAX,integer(p.points)+1);'));
  assert.ok(progression.includes('one level + one passive point per first map clear in each layer and each EGO visit'));
});
