import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {chromium} from 'playwright';

const seed = Number(process.env.R75_OVERNIGHT_SEED || 11);
const replicate = Number(process.env.R75_OVERNIGHT_REP || 1);
const label = process.env.R75_OVERNIGHT_LABEL || 'candidate';
const seedTargets = new Map([[11, 'dist02'], [29, 'last303'], [47, 'hando02']]);
const target = seedTargets.get(seed);
const output = path.join('out', 'r75', 'overnight', label, `seed-${seed}-rep-${replicate}.json`);
await fs.mkdir(path.dirname(output), {recursive: true});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  commit: null,
  seed,
  replicate,
  label,
  target,
  htmlSHA256: null,
  rendererSHA256: null,
  browserSandbox: true,
  softwareGPU: true,
  physicalGPU: false,
  physicalDevice: false,
  scope: 'Native UI new game, keyboard movement/attack, normal save/reload/Continue, 777 isolated trial save/reload/resume/leave, and one seed-specific real-map probe. Not full natural campaign completion.',
  checks: [],
  saveIsolation: {complete: false, passed: false, comparisons: [], storedComparisons: []},
  pageErrors: [],
  consoleErrors: [],
};

let browser = null;
let context = null;
let page;

function check(name, details, ok = true) {
  report.checks.push({name, ok: ok === true, details});
  console.log('R75_OVERNIGHT_CASE', JSON.stringify(report.checks.at(-1)));
}

async function ready() {
  await page.waitForFunction(() => started && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect?.().busy, null, {timeout: 90000});
  for (let i = 0; i < 100 && await page.evaluate(() => !!storyScene); i++) {
    await page.locator('#storyNext').click();
    await page.waitForTimeout(20);
  }
  await page.evaluate(() => {
    auto = false;
    guide = false;
    route = [];
    command = null;
    settings.autoSkill = false;
    settings.sound = false;
    settings.music = false;
    settings.narration = false;
    closePanel(true);
  });
  await page.waitForFunction(() => window.__STORYWORLD_PHASE1__.controller.inspect().active === 'three', null, {timeout: 30000});
}

async function travel(id) {
  await page.evaluate(() => {
    closePanel(true);
    window.__STORYWORLD_CHEAT777__.panel();
  });
  if (await page.locator('#story-code-input').count()) {
    await page.locator('#story-code-input').fill('777');
    await page.locator('#codeApply').click();
  }
  await page.locator('#codeMap').selectOption(id);
  await page.locator('#codeLayer').selectOption('STORY');
  await page.locator('#codeGo').click();
  await page.waitForFunction(id => document.getElementById('r71DifficultyConfirm') || zone === id && !loading, id, {timeout: 90000});
  if (await page.locator('#r71DifficultyConfirm').count()) await page.locator('#r71DifficultyConfirm').click();
  await page.waitForFunction(id => zone === id && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().transitionDepth, id, {timeout: 90000});
  await ready();
  assert.equal(await page.evaluate(() => zone), id);
}

function isEmptyCastleDefenseState(state) {
  return isDeepStrictEqual(state, {
    phase: 'idle', round: 0, remaining: 0, pressure: 0,
    selected: [], used: [], joined: false, retries: 0, guards: [],
  });
}

function normalizeEmptyCastleDefense(save) {
  const value = save.castleDefenseR75;
  const removed = [];
  if (value?.version !== 1 || !value.rooms || Array.isArray(value.rooms) || typeof value.rooms !== 'object') return removed;
  for (const [key, state] of Object.entries(value.rooms)) {
    if (['STORY:hando01', 'STORY:hando02'].includes(key) && isEmptyCastleDefenseState(state)) {
      delete value.rooms[key];
      removed.push(key);
    }
  }
  return removed;
}

function stableSave(save) {
  const persistent = structuredClone(save || {});
  const gameTime = persistent.time;
  delete persistent.time;
  const player = persistent.player && typeof persistent.player === 'object' ? persistent.player : null;
  const resonance = player?.resonance;
  const cooldowns = player?.combatCooldownRemaining26 || {};
  if (player) {
    delete player.resonance;
    delete player.combatCooldownRemaining26;
    player.upgrades = Object.fromEntries(Object.entries(player.upgrades || {}).filter(([, rank]) => rank !== 0));
  }
  const normalizeZeroRanks = ranks => {
    if (!ranks || typeof ranks !== 'object' || Array.isArray(ranks)) return;
    for (const [key, rank] of Object.entries(ranks)) if (rank === 0) delete ranks[key];
  };
  normalizeZeroRanks(persistent.progressionR62?.progression?.ranks);
  normalizeZeroRanks(persistent.player?.progressionR62?.ranks);

  const pointDropState = persistent.campaignPointDropsR64;
  const pointEpochCounter = Number.isSafeInteger(pointDropState?.epochCounter) ? pointDropState.epochCounter : null;
  const pointRoomRevisions = {};
  if (pointDropState?.version === 1 && pointDropState.rooms && typeof pointDropState.rooms === 'object' && !Array.isArray(pointDropState.rooms)) {
    for (const [key, row] of Object.entries(pointDropState.rooms)) {
      pointRoomRevisions[key] = Number.isSafeInteger(row?.revision) ? row.revision : null;
      if (row && typeof row === 'object' && !Array.isArray(row)) delete row.revision;
    }
    delete pointDropState.epochCounter;
  }
  const settings = {...(persistent.settings || {})};
  settings.enemyDirection51 = settings.enemyDirection51 !== false;
  settings.voicePreroll = settings.voicePreroll === 0 ? 0 : 500;
  persistent.settings = settings;
  if (persistent.saveSlotR73 && typeof persistent.saveSlotR73 === 'object') delete persistent.saveSlotR73.savedAt;

  const spawnNonces = {};
  persistent.rooms = structuredClone(persistent.rooms || {});
  for (const [key, room] of Object.entries(persistent.rooms)) {
    if (room && Number.isFinite(Number(room.spawnNonce))) {
      spawnNonces[key] = Number(room.spawnNonce);
      delete room.spawnNonce;
    }
  }
  const normalizedEmptyDefenseRooms = normalizeEmptyCastleDefense(persistent);
  return {
    persistent,
    dynamic: {resonance, cooldowns, gameTime, pointEpochCounter, pointRoomRevisions},
    spawnNonces,
    normalizedEmptyDefenseRooms,
  };
}

function canonicalStoredSave(raw) {
  const value = JSON.parse(raw);
  if (value.saveSlotR73) delete value.saveSlotR73.savedAt;
  if (value.player) {
    value.player.upgrades = Object.fromEntries(Object.entries(value.player.upgrades || {}).filter(([, rank]) => rank !== 0));
  }
  const settings = {...(value.settings || {})};
  settings.enemyDirection51 = settings.enemyDirection51 !== false;
  settings.voicePreroll = settings.voicePreroll === 0 ? 0 : 500;
  value.settings = settings;
  normalizeEmptyCastleDefense(value);
  return value;
}

function changedPaths(a, b, path = '$', out = []) {
  if (isDeepStrictEqual(a, b) || out.length >= 40) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      if (!Object.hasOwn(a, key) || !Object.hasOwn(b, key)) out.push(`${path}.${key}`);
      else changedPaths(a[key], b[key], `${path}.${key}`, out);
      if (out.length >= 40) break;
    }
  } else out.push(path);
  return out;
}

function compareSaveDynamics(before, after, restoreCount) {
  const gameTimeValid = Number.isFinite(before.dynamic.gameTime)
    && Number.isFinite(after.dynamic.gameTime)
    && after.dynamic.gameTime + 1e-6 >= before.dynamic.gameTime;
  const restoreCountValid = Number.isSafeInteger(restoreCount) && restoreCount >= 0;
  const pointEpochCounterValid = Number.isSafeInteger(before.dynamic.pointEpochCounter)
    && Number.isSafeInteger(after.dynamic.pointEpochCounter)
    && after.dynamic.pointEpochCounter >= before.dynamic.pointEpochCounter;
  const pointRooms = before.persistent.campaignPointDropsR64?.rooms || {};
  const pointRoomKeys = new Set([
    ...Object.keys(before.dynamic.pointRoomRevisions),
    ...Object.keys(after.dynamic.pointRoomRevisions),
  ]);
  const pointRoomRevisionDifferences = [...pointRoomKeys].filter(key => {
    const oldValue = before.dynamic.pointRoomRevisions[key];
    const newValue = after.dynamic.pointRoomRevisions[key];
    const expected = oldValue + (Object.hasOwn(pointRooms, key) ? restoreCount : 0);
    return !Number.isSafeInteger(oldValue) || !Number.isSafeInteger(newValue) || newValue !== expected;
  });
  return {
    gameTimeValid,
    pointEpochCounterValid,
    pointRoomRevisionDifferences,
    pointDropCountersValid: restoreCountValid && pointEpochCounterValid && pointRoomRevisionDifferences.length === 0,
  };
}

function integritySnapshots(value) {
  const {persistent: p} = value;
  const namedBossRewardState = Object.fromEntries(Object.entries(p).filter(([key]) => /boss|reward|loot|drop/i.test(key)));
  return {
    progressFlags: {progress: p.progress, visited: p.visited, readScenes: p.readScenes, ending: p.ending, lastHub: p.lastHub},
    worldAndDoors: {worldR74: p.worldR74, worldR75: p.worldR75, mazeR73: p.mazeR73, routeEntriesR72: p.routeEntriesR72, narrativeObjectivesR75: p.narrativeObjectivesR75},
    bossesAndRewards: {rooms: p.rooms, player: p.player, goldenR72: p.goldenR72, named: namedBossRewardState},
  };
}

function assertSaveComparisonContract() {
  const baseline = {
    zone: 'hub', layer: 'STORY', progress: {STORY: {hando01: false}}, visited: [], readScenes: [], ending: null,
    player: {hero: 'hwando', level: 1, points: 1, gold: 0, upgrades: {}, resonance: 50, combatCooldownRemaining26: {attack: 0, special: 0}},
    rooms: {}, settings: {enemyDirection51: true, voicePreroll: 500},
    worldR74: {doors: [{id: 'door-0', open: false}]}, worldR75: {entries: {}},
    narrativeObjectivesR75: {version: 1, rooms: {'STORY:hando02': {gateMask: 0}}},
    castleDefenseR75: {version: 1, rooms: {}}, bossRewardsR75: {hando02: {claimed: false}},
    time: 10,
    progressionR62: {version: 1, progression: {version: 1, ranks: {}}},
    campaignPointDropsR64: {version: 1, epochCounter: 2, rooms: {'STORY:hub': {epoch: 1, spawnSeq: 0, revision: 0, drops: [], rolls: [], claims: []}}},
  };
  const withEmptyDefense = structuredClone(baseline);
  withEmptyDefense.castleDefenseR75.rooms['STORY:hando02'] = {
    phase: 'idle', round: 0, remaining: 0, pressure: 0, selected: [], used: [], joined: false, retries: 0, guards: [],
  };
  assert.deepEqual(stableSave(baseline).persistent, stableSave(withEmptyDefense).persistent, 'the exact fresh castle-defense state is semantically empty');
  assert.deepEqual(canonicalStoredSave(JSON.stringify(baseline)), canonicalStoredSave(JSON.stringify(withEmptyDefense)), 'stored-save comparison also ignores only the exact fresh castle-defense state');

  const mutations = [
    ['progress flag', value => { value.progress.STORY.hando01 = true; }],
    ['door state', value => { value.worldR74.doors[0].open = true; }],
    ['boss state', value => { value.rooms['STORY:hando02'] = {bossDefeated: true}; }],
    ['reward state', value => { value.bossRewardsR75.hando02.claimed = true; }],
    ['player reward', value => { value.player.gold = 1; }],
    ['castle-defense progress', value => { value.castleDefenseR75.rooms['STORY:hando02'].round = 1; }],
    ['noncanonical defense field', value => { value.castleDefenseR75.rooms['STORY:hando02'].extra = true; }],
    ['nonzero progression rank', value => { value.progressionR62.progression.ranks.threadDanceR63 = 1; }],
    ['claimed point-drop reward', value => { value.campaignPointDropsR64.rooms['STORY:hub'].claims.push('r64:1:drop:test'); }],
  ];
  for (const [label, mutate] of mutations) {
    const changed = structuredClone(withEmptyDefense);
    mutate(changed);
    assert.notDeepEqual(stableSave(baseline).persistent, stableSave(changed).persistent, label + ' remains strict');
  }

  const expectedRestore = structuredClone(baseline);
  expectedRestore.time = 18;
  expectedRestore.progressionR62.progression.ranks = {dreamAura: 0, threadDanceR63: 0};
  expectedRestore.campaignPointDropsR64.epochCounter = 3;
  expectedRestore.campaignPointDropsR64.rooms['STORY:hub'].revision = 1;
  const before = stableSave(baseline);
  const after = stableSave(expectedRestore);
  assert.deepEqual(after.persistent, before.persistent, 'time, zero-rank defaults, and restore counters are separated from saved progress');
  assert.ok(compareSaveDynamics(before, after, 1).gameTimeValid, 'game time may advance while the saved journey is restored');
  assert.ok(compareSaveDynamics(before, after, 1).pointDropCountersValid, 'one restore increments only the exact expected point-drop counters');

  const expectedMultipleRestores = structuredClone(baseline);
  expectedMultipleRestores.time = 22;
  expectedMultipleRestores.progressionR62.progression.ranks = {dreamAura: 0, threadDanceR63: 0};
  expectedMultipleRestores.campaignPointDropsR64.epochCounter = 4;
  expectedMultipleRestores.campaignPointDropsR64.rooms['STORY:hub'].revision = 2;
  assert.ok(compareSaveDynamics(before, stableSave(expectedMultipleRestores), 2).pointDropCountersValid, 'a stored snapshot records only restores that happened before its last explicit save');
  assert.equal(compareSaveDynamics(before, stableSave(expectedMultipleRestores), 3).pointDropCountersValid, false, 'a later Continue restore must not be counted in bytes saved before that Continue');

  const normalSlotBeforeTrial = JSON.stringify(baseline);
  const normalSlotAfterLeave = JSON.stringify(baseline);
  assert.deepEqual(canonicalStoredSave(normalSlotAfterLeave), canonicalStoredSave(normalSlotBeforeTrial), 'leaving the 777 trial restores the live journey without rewriting the normal slot');
  const accidentallyRewrittenSlot = structuredClone(baseline);
  accidentallyRewrittenSlot.campaignPointDropsR64.rooms['STORY:hub'].revision = 1;
  assert.notDeepEqual(canonicalStoredSave(JSON.stringify(accidentallyRewrittenSlot)), canonicalStoredSave(normalSlotBeforeTrial), 'an unexpected normal-slot rewrite remains visible');

  const wrongRevision = stableSave(expectedRestore);
  wrongRevision.dynamic.pointRoomRevisions['STORY:hub'] += 1;
  assert.equal(compareSaveDynamics(before, wrongRevision, 1).pointDropCountersValid, false, 'point-drop revisions must match the exact restore count');
  const wrongTime = stableSave(expectedRestore);
  wrongTime.dynamic.gameTime = 1;
  assert.equal(compareSaveDynamics(before, wrongTime, 1).gameTimeValid, false, 'game time cannot move backwards');
  const wrongEpoch = stableSave(expectedRestore);
  wrongEpoch.dynamic.pointEpochCounter = 0;
  assert.equal(compareSaveDynamics(before, wrongEpoch, 1).pointDropCountersValid, false, 'point-drop epoch allocation cannot move backwards');
}

function assertNormalEquivalent(before, after, restoreCount, labelName) {
  const a = stableSave(before);
  const b = stableSave(after);
  const saveDynamics = compareSaveDynamics(a, b, restoreCount);
  const beforeIntegrity = integritySnapshots(a);
  const afterIntegrity = integritySnapshots(b);
  const integrity = Object.fromEntries(Object.keys(beforeIntegrity).map(key => [key, isDeepStrictEqual(beforeIntegrity[key], afterIntegrity[key])]));
  const row = {
    label: labelName,
    restoreCount,
    beforeResonance: a.dynamic.resonance,
    afterResonance: b.dynamic.resonance,
    beforeCooldowns: a.dynamic.cooldowns,
    afterCooldowns: b.dynamic.cooldowns,
    beforeSpawnNonces: a.spawnNonces,
    afterSpawnNonces: b.spawnNonces,
    beforeGameTime: a.dynamic.gameTime,
    afterGameTime: b.dynamic.gameTime,
    beforePointEpochCounter: a.dynamic.pointEpochCounter,
    afterPointEpochCounter: b.dynamic.pointEpochCounter,
    beforePointRoomRevisions: a.dynamic.pointRoomRevisions,
    afterPointRoomRevisions: b.dynamic.pointRoomRevisions,
    normalizedEmptyDefenseRoomsBefore: a.normalizedEmptyDefenseRooms,
    normalizedEmptyDefenseRoomsAfter: b.normalizedEmptyDefenseRooms,
    persistentEqual: isDeepStrictEqual(b.persistent, a.persistent),
    persistentDifferencePaths: changedPaths(a.persistent, b.persistent),
    integrity,
    dynamicsValid: saveDynamics.gameTimeValid,
    spawnNoncesValid: true,
    pointEpochCounterValid: saveDynamics.pointEpochCounterValid,
    pointRoomRevisionDifferences: saveDynamics.pointRoomRevisionDifferences,
    pointDropCountersValid: saveDynamics.pointDropCountersValid,
    ok: false,
  };
  report.saveIsolation.comparisons.push(row);

  const beforeResonance = Number(a.dynamic.resonance);
  const afterResonance = Number(b.dynamic.resonance);
  row.dynamicsValid = Number.isFinite(beforeResonance) && Number.isFinite(afterResonance)
    && afterResonance + 1e-6 >= beforeResonance && afterResonance <= 100 + 1e-6;
  for (const key of ['attack', 'special']) {
    const oldValue = Number(a.dynamic.cooldowns[key] || 0);
    const newValue = Number(b.dynamic.cooldowns[key] || 0);
    row.dynamicsValid &&= newValue <= oldValue + 1e-6;
  }

  const keys = new Set([
    ...Object.keys(a.persistent.rooms),
    ...Object.keys(b.persistent.rooms),
    ...Object.keys(a.spawnNonces),
    ...Object.keys(b.spawnNonces),
  ]);
  for (const key of keys) {
    const oldValue = Number(a.spawnNonces[key] || 0);
    const newValue = Number(b.spawnNonces[key] || 0);
    const expected = oldValue + (Object.hasOwn(a.persistent.rooms, key) ? restoreCount : 0);
    if (newValue !== expected) row.spawnNoncesValid = false;
  }
  row.spawnNonceDifferences = [...keys].filter(key => {
    const oldValue = Number(a.spawnNonces[key] || 0);
    const newValue = Number(b.spawnNonces[key] || 0);
    return newValue !== oldValue + (Object.hasOwn(a.persistent.rooms, key) ? restoreCount : 0);
  });
  row.ok = row.persistentEqual && Object.values(integrity).every(Boolean)
    && row.dynamicsValid && row.spawnNoncesValid && row.pointDropCountersValid;
  if (!row.ok) console.error('R75_OVERNIGHT_SAVE_COMPARISON_FAILURE', JSON.stringify(row));
  return row;
}

async function readStorage(key) {
  return page.evaluate(storageKey => localStorage.getItem(storageKey), key);
}

function assertTrialSlot(raw, expectedZone) {
  assert.ok(typeof raw === 'string', 'the independent 777 trial slot is missing');
  const value = JSON.parse(raw);
  assert.equal(value.cheat777?.active, true, 'the 777 slot must contain an active trial');
  assert.equal(value.cheat777.version, 1, 'the 777 slot must use the supported save version');
  if (expectedZone !== null) assert.equal(value.zone, expectedZone, 'the 777 slot must contain the selected target map');
  assert.equal(value.layer, 'STORY');
  return {zone: value.zone, layer: value.layer, active: value.cheat777.active, version: value.cheat777.version, bytes: Buffer.byteLength(raw)};
}

function assertNormalSlotPreserved(beforeRaw, afterRaw, labelName) {
  const row = {
    label: labelName,
    beforeSHA256: typeof beforeRaw === 'string' ? digest(Buffer.from(beforeRaw)) : null,
    afterSHA256: typeof afterRaw === 'string' ? digest(Buffer.from(afterRaw)) : null,
    semanticEqual: false,
    ok: false,
  };
  report.saveIsolation.storedComparisons.push(row);
  if (typeof beforeRaw !== 'string' || typeof afterRaw !== 'string') {
    row.error = 'normal save slot is missing';
    console.error('R75_OVERNIGHT_SLOT_COMPARISON_FAILURE', JSON.stringify(row));
    return row;
  }
  try {
    const before = canonicalStoredSave(beforeRaw);
    const after = canonicalStoredSave(afterRaw);
    row.semanticEqual = isDeepStrictEqual(after, before);
    row.differencePaths = changedPaths(before, after);
    row.ok = row.semanticEqual;
  } catch (error) {
    row.error = String(error.stack || error);
  }
  if (!row.ok) console.error('R75_OVERNIGHT_SLOT_COMPARISON_FAILURE', JSON.stringify(row));
  return row;
}

function assertNormalSlotProgressAfterReturn(beforeRaw, afterRaw, restoreCount, labelName) {
  const row = {
    label: labelName,
    restoreCount,
    beforeSHA256: typeof beforeRaw === 'string' ? digest(Buffer.from(beforeRaw)) : null,
    afterSHA256: typeof afterRaw === 'string' ? digest(Buffer.from(afterRaw)) : null,
    semanticEqual: false,
    integrity: null,
    ok: false,
  };
  report.saveIsolation.storedComparisons.push(row);
  if (typeof beforeRaw !== 'string' || typeof afterRaw !== 'string') {
    row.error = 'normal save slot is missing';
    console.error('R75_OVERNIGHT_SLOT_COMPARISON_FAILURE', JSON.stringify(row));
    return row;
  }
  try {
    const before = stableSave(JSON.parse(beforeRaw));
    const after = stableSave(JSON.parse(afterRaw));
    const saveDynamics = compareSaveDynamics(before, after, restoreCount);
    const beforeIntegrity = integritySnapshots(before);
    const afterIntegrity = integritySnapshots(after);
    row.semanticEqual = isDeepStrictEqual(before.persistent, after.persistent);
    row.differencePaths = changedPaths(before.persistent, after.persistent);
    row.normalizedEmptyDefenseRoomsBefore = before.normalizedEmptyDefenseRooms;
    row.normalizedEmptyDefenseRoomsAfter = after.normalizedEmptyDefenseRooms;
    row.beforeGameTime = before.dynamic.gameTime;
    row.afterGameTime = after.dynamic.gameTime;
    row.beforePointEpochCounter = before.dynamic.pointEpochCounter;
    row.afterPointEpochCounter = after.dynamic.pointEpochCounter;
    row.beforePointRoomRevisions = before.dynamic.pointRoomRevisions;
    row.afterPointRoomRevisions = after.dynamic.pointRoomRevisions;
    row.dynamicsValid = saveDynamics.gameTimeValid;
    row.pointEpochCounterValid = saveDynamics.pointEpochCounterValid;
    row.pointRoomRevisionDifferences = saveDynamics.pointRoomRevisionDifferences;
    row.pointDropCountersValid = saveDynamics.pointDropCountersValid;
    row.integrity = Object.fromEntries(Object.keys(beforeIntegrity).map(key => [key, isDeepStrictEqual(beforeIntegrity[key], afterIntegrity[key])]));
    row.ok = row.semanticEqual && Object.values(row.integrity).every(Boolean)
      && row.dynamicsValid && row.pointDropCountersValid;
  } catch (error) {
    row.error = String(error.stack || error);
  }
  if (!row.ok) console.error('R75_OVERNIGHT_SLOT_COMPARISON_FAILURE', JSON.stringify(row));
  return row;
}

async function performanceMatrix() {
  const before = await page.evaluate(() => {
    auto = false;
    guide = false;
    booted = true;
    player.invincible = Math.max(player.invincible || 0, 1e7);
    const coordinate = value => Math.round(value * 1000) / 1000;
    const actors = room.enemies.filter(e => e.hp > 0 && e.spawnState === 'active').map(e => ({
      id: e.id,
      hp: Math.round(e.hp * 1000) / 1000,
      x: coordinate(e.x),
      y: coordinate(e.y),
    }));
    const position = point => ({x: coordinate(point.x), y: coordinate(point.y)});
    return {zone, layer, seed: room.exploration?.seedR73 ?? null, family: room.exploration?.worldR75?.family || null, enemyRoster: room.enemies.length, active: actors.length, actors, camera: position(cam), player: position(player), renderer: window.__STORYWORLD_PHASE1__.controller.inspect().active, fixture: 'native dist02 field at deterministic seed; environment compares stable actor identity/HP and bounds free-running actor, player, and camera position drift to 0.75 map units; player invincibility is an observation fixture; renderer resolution/density unchanged'};
  });
  assert.equal(before.zone, 'dist02');
  assert.equal(before.renderer, 'three');
  const duration = Number(process.env.R75_OVERNIGHT_SAMPLE_MS || 90000);
  assert.ok(Number.isFinite(duration) && duration >= 30000 && duration <= 120000);
  const measure = page.evaluate(duration => new Promise(resolve => {
    const phases = [[], [], []];
    const start = performance.now();
    const gameStart = time;
    const heapStart = performance.memory?.usedJSHeapSize ?? null;
    const metricsStart = {
      world: window.__STORYWORLD_WORLD_R75__?.inspect?.().metrics || null,
      guide: window.__STORYWORLD_GUIDE_R75__?.inspect?.().metrics || null,
      objectives: window.__STORYWORLD_OBJECTIVES_R75__?.inspect?.().metrics || null,
    };
    let previous = null;
    function frame(now) {
      if (previous !== null) {
        const index = Math.min(2, Math.floor((now - start) / (duration / 3)));
        phases[index].push(now - previous);
      }
      previous = now;
      if (now - start < duration) requestAnimationFrame(frame);
      else {
        const stats = samples => {
          const sorted = samples.slice().sort((a, b) => a - b);
          const q = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : null;
          return {frames: sorted.length, p50ms: q(.50), p95ms: q(.95), p99ms: q(.99), maxms: sorted.at(-1) || null, stallsOver100ms: sorted.filter(n => n > 100).length, stallsOver250ms: sorted.filter(n => n > 250).length, stallsOver500ms: sorted.filter(n => n > 500).length, stallsOver1000ms: sorted.filter(n => n > 1000).length};
        };
        const world = window.__STORYWORLD_WORLD_R75__?.inspect?.();
        const guide = window.__STORYWORLD_GUIDE_R75__?.inspect?.();
        const objectives = window.__STORYWORLD_OBJECTIVES_R75__?.inspect?.();
        const controller = window.__STORYWORLD_PHASE1__?.controller?.inspect?.();
        const counterDelta = (before, after) => before && after ? Object.fromEntries(Object.keys(after).filter(k => Number.isFinite(before[k]) && Number.isFinite(after[k])).map(k => [k, after[k] - before[k]])) : null;
        const effectTypes = {};
        for (const effect of effects || []) effectTypes[effect.type || 'unknown'] = (effectTypes[effect.type || 'unknown'] || 0) + 1;
        resolve({
          wallMS: performance.now() - start,
          gameSeconds: time - gameStart,
          phaseWallMS: duration / 3,
          phases: [{name: 'field-idle', ...stats(phases[0])}, {name: 'field-native-input-and-attack', ...stats(phases[1])}, {name: 'field-samong-effects', ...stats(phases[2])}],
          stalls: {over100ms: phases.flat().filter(n => n > 100).length, over250ms: phases.flat().filter(n => n > 250).length, over500ms: phases.flat().filter(n => n > 500).length, over1000ms: phases.flat().filter(n => n > 1000).length},
          heapUsedJSBytes: {start: heapStart, end: performance.memory?.usedJSHeapSize ?? null},
          activeEnemies: room.enemies.filter(e => e.hp > 0 && e.spawnState === 'active').length,
          ordinaryEnemies: room.enemies.filter(e => e.hp > 0 && e.spawnState === 'active' && !e.boss && !e.midboss).length,
          enemyRoster: room.enemies.length,
          player: {x: player.x, y: player.y, hp: player.hp, hero: player.hero, samong: player.samong},
          camera: {...cam},
          worldMetrics: world?.metrics || null,
          guideMetrics: guide?.metrics || null,
          objectiveMetrics: objectives?.metrics || null,
          metricStarts: metricsStart,
          metricDeltas: {world: counterDelta(metricsStart.world, world?.metrics), guide: counterDelta(metricsStart.guide, guide?.metrics), objectives: counterDelta(metricsStart.objectives, objectives?.metrics)},
          activeEffects: effects?.length ?? null,
          effectsByType: effectTypes,
          render: {mode: controller?.active || null, cpuFrameMetrics: controller?.metrics || null, last: controller?.metrics?.last || null, lastDrawCalls: controller?.metrics?.last?.drawCalls ?? null},
        });
      }
    }
    requestAnimationFrame(frame);
  }), duration);
  const startWall = Date.now();
  const drive = (async () => {
    const schedule = [];
    const phaseMS = duration / 3;
    await page.waitForTimeout(phaseMS);
    const moves = ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'];
    for (const move of moves) {
      await page.keyboard.down(move);
      await page.waitForTimeout(450);
      await page.keyboard.up(move);
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(120);
      await page.keyboard.up('KeyA');
      schedule.push({move, moveMS: 450, attackMS: 120});
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(Math.max(0, 2 * phaseMS - (Date.now() - startWall)));
    const awakened = await page.evaluate(() => awaken('story'));
    await page.waitForTimeout(Math.max(0, duration - (Date.now() - startWall)));
    return {schedule, awakened, startDelayMS: phaseMS, awakeningTargetMS: 2 * phaseMS};
  })();
  const [sample, actions] = await Promise.all([measure, drive]);
  assert.equal(actions.awakened, true, 'native Samong awakening begins for the effects/render sample');
  return {replicate, durationMs: duration, seed, viewport: {width: 1365, height: 850, dpr: 1}, before, actions, sample};
}

let failure = null;
try {
  assertSaveComparisonContract();
  assert.ok(target, `Unexpected matrix seed ${seed}`);
  report.commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  report.htmlSHA256 = digest(await fs.readFile('_pages/docs/index.html'));
  report.rendererSHA256 = digest(await fs.readFile('_pages/docs/dist/phase1.js'));
  browser = await chromium.launch({headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage']});
  context = await browser.newContext({viewport: {width: 1365, height: 850}, deviceScaleFactor: 1});
  await context.addInitScript(value => {
    let state = value >>> 0;
    Math.random = () => {
      let n = state += 0x6D2B79F5;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }, seed);
  page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await page.goto(process.env.R75_OVERNIGHT_URL || 'http://127.0.0.1:4391/', {timeout: 90000});
  await page.locator('#campaignNew54').click({timeout: 90000});
  await page.locator('#slotConfirmR73').click();
  await ready();

  const start = await page.evaluate(() => ({zone, layer, hero: player.hero, position: {x: player.x, y: player.y}, hp: player.hp, blocked: blocked(player.x, player.y, .31)}));
  assert.equal(start.blocked, false);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('KeyA');
  await page.waitForTimeout(250);
  const nativeInput = await page.evaluate(() => ({zone, x: player.x, y: player.y, hero: player.hero, hp: player.hp, attackAnim: player.attackAnim, blocked: blocked(player.x, player.y, .31)}));
  assert.equal(nativeInput.blocked, false);
  assert.ok(Math.hypot(nativeInput.x - start.position.x, nativeInput.y - start.position.y) > .01, 'real keyboard input moves the hero');
  assert.equal(await page.evaluate(() => saveGame(false)), true);
  const normal = await page.evaluate(() => serializeSave());
  const slotKeys = await page.evaluate(() => ({
    normal: window.__STORYWORLD_SAVE_SLOTS_R73__.key(),
    trial: window.__STORYWORLD_CHEAT777__.inspect().saveSlot,
  }));
  assert.ok(slotKeys.normal && slotKeys.trial && slotKeys.normal !== slotKeys.trial, 'normal and 777 saves must use separate keys');
  report.saveIsolation.normalSlotKey = slotKeys.normal;
  report.saveIsolation.trialSlotKey = slotKeys.trial;
  const normalStoredBeforeTrial = await readStorage(slotKeys.normal);
  assert.ok(typeof normalStoredBeforeTrial === 'string', 'normal save slot must exist before the 777 trial');
  report.saveIsolation.normalStoredSHA256 = digest(Buffer.from(normalStoredBeforeTrial));
  check('natural-new-game-native-keyboard-save', {start, nativeInput, hero: normal.player.hero, level: normal.player.level, points: normal.player.points, zone: normal.zone});

  await travel(target);
  const trialAfterTravel = await readStorage(slotKeys.trial);
  assert.ok(typeof trialAfterTravel === 'string', '777 trial save slot must exist after activation');
  const trialTravelSummary = assertTrialSlot(trialAfterTravel, null);
  report.saveIsolation.trialAfterTravel = trialTravelSummary;
  assertNormalSlotPreserved(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 'after-777-travel');
  if (target === 'dist02' && process.env.R75_OVERNIGHT_BENCH === '1') report.performance = await performanceMatrix();
  let targetProbe;
  if (target === 'dist02') {
    targetProbe = await page.evaluate(() => {
      const world = window.__STORYWORLD_WORLD_R75__.inspect();
      return {zone, enemies: room.enemies.length, activeOrdinary: room.enemies.filter(e => e.hp > 0 && e.spawnState === 'active' && !e.boss && !e.midboss).length, world: world.activeRoom, limits: world.limits, renderer: window.__STORYWORLD_PHASE1__.controller.inspect().active};
    });
    assert.ok(targetProbe.activeOrdinary > 0 && targetProbe.activeOrdinary <= targetProbe.limits.ordinary);
  } else if (target === 'last303') {
    targetProbe = await page.evaluate(() => ({zone, actors: window.__STORYWORLD_OBJECTIVES_R75__.inspect().actors.map(p => ({id: p.id, kind: p.kind})), civiliansInEnemyRoster: room.enemies.some(e => String(e.r75NarrativeNPC || '').startsWith('villager'))}));
    assert.equal(targetProbe.actors.filter(p => String(p.kind).startsWith('villager')).length, 3);
    assert.equal(targetProbe.civiliansInEnemyRoster, false);
    const actor = await page.evaluate(() => window.__STORYWORLD_OBJECTIVES_R75__.actors()[0]);
    await page.evaluate(actor => { player.x = actor.x; player.y = actor.y; cam = {x: actor.x, y: actor.y}; route = []; command = null; }, actor);
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => modal && document.getElementById('narrativeNPCBackR75'), null, {timeout: 10000});
    await page.locator('#narrativeNPCBackR75').click();
  } else {
    const actors = await page.evaluate(() => window.__STORYWORLD_OBJECTIVES_R75__.inspect().actors);
    const doors = await page.evaluate(() => window.__STORYWORLD_WORLD_R74__.inspect().doors);
    assert.equal(actors.length, 2);
    assert.equal(doors.length, 2);
    for (const owner of actors) {
      await page.evaluate(id => { const n = window.__STORYWORLD_OBJECTIVES_R75__.actors().find(p => p.id === id); player.x = n.x; player.y = n.y; cam = {x: n.x, y: n.y}; route = []; command = null; }, owner.id);
      await page.keyboard.press('KeyE');
      await page.waitForFunction(id => window.__STORYWORLD_OBJECTIVES_R75__.inspect().events.some(e => e.kind === 'owner-authority' && e.id === id), owner.id, {timeout: 10000});
    }
    targetProbe = await page.evaluate(() => ({zone, gateMask: window.__STORYWORLD_OBJECTIVES_R75__.gateMask(), doors: window.__STORYWORLD_WORLD_R74__.inspect().doors}));
    assert.equal(targetProbe.gateMask, 3);
    assert.ok(targetProbe.doors.filter(d => d.open).length >= 2);
  }
  assert.equal(await page.evaluate(() => saveGame(false)), true);
  const trialAtTarget = await readStorage(slotKeys.trial);
  report.saveIsolation.trial = assertTrialSlot(trialAtTarget, target);
  assertNormalSlotPreserved(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 'after-777-target-save');
  check('seed-specific-native-map-and-interaction-probe', targetProbe);

  await page.reload({waitUntil: 'domcontentloaded'});
  await page.locator('#campaignContinue54').click({timeout: 90000});
  await ready();
  const normalAfterReload = await page.evaluate(() => serializeSave());
  const reloadComparison = assertNormalEquivalent(normal, normalAfterReload, 1, 'normal-continue-after-browser-reload');
  const reloadSlotComparison = assertNormalSlotPreserved(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 'after-normal-continue');
  assert.equal(await page.evaluate(() => window.__STORYWORLD_CHEAT777__.active()), false);
  check('browser-reload-native-continue-preserves-normal-progress', {zone: normalAfterReload.zone, progress: normalAfterReload.progress, hero: normalAfterReload.player.hero, level: normalAfterReload.player.level}, reloadComparison.ok && reloadSlotComparison.ok);

  await page.locator('#story-code-button').click();
  await page.locator('#codeResumeR75').click();
  await page.waitForFunction(id => zone === id && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().transitionDepth, target, {timeout: 90000});
  await ready();
  const resumedTrial = await page.evaluate(() => ({zone, active: window.__STORYWORLD_CHEAT777__.active(), save: serializeSave()}));
  assert.equal(resumedTrial.zone, target);
  assert.equal(resumedTrial.active, true);
  const resumeSlotComparison = assertNormalSlotPreserved(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 'after-777-resume');
  check('saved-777-trial-resumes-after-normal-continue', {zone: resumedTrial.zone, active: resumedTrial.active, seed, targetProbe}, resumeSlotComparison.ok);

  assert.equal(await page.evaluate(() => window.__STORYWORLD_CHEAT777__.leave()), true);
  await ready();
  const returned = await page.evaluate(() => serializeSave());
  const leaveComparison = assertNormalEquivalent(normalAfterReload, returned, 1, 'leave-777-restores-normal-journey');
  const leaveSlotComparison = assertNormalSlotPreserved(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 'normal-slot-after-777-leave');
  check('native-777-leave-restores-normal-journey', {zone: returned.zone, progress: returned.progress, hero: returned.player.hero, level: returned.player.level, points: returned.player.points}, leaveComparison.ok && leaveSlotComparison.ok);

  assert.equal(await page.evaluate(() => saveGame(false)), true);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.locator('#campaignContinue54').click({timeout: 90000});
  await ready();
  const final = await page.evaluate(() => serializeSave());
  const finalComparison = assertNormalEquivalent(returned, final, 1, 'normal-save-after-777-return-round-trip');
  // The slot is written immediately after leaving 777, before this final Continue
  // restore. The persisted hub revision therefore reflects two restores, not three.
  const finalStoredComparison = assertNormalSlotProgressAfterReturn(normalStoredBeforeTrial, await readStorage(slotKeys.normal), 2, 'normal-slot-after-777-return-round-trip');
  check('normal-save-after-777-return-round-trip', {zone: final.zone, progress: final.progress, hero: final.player.hero, level: final.player.level, points: final.player.points}, finalComparison.ok && finalStoredComparison.ok);
  assert.deepEqual(report.pageErrors, []);
  report.saveIsolation.complete = report.saveIsolation.comparisons.length === 3 && report.saveIsolation.storedComparisons.length === 6;
  report.saveIsolation.passed = report.saveIsolation.complete
    && report.saveIsolation.comparisons.every(item => item.ok === true)
    && report.saveIsolation.storedComparisons.every(item => item.ok === true);
  report.roundTrips = 2;
  report.normalReturnedSemanticallyEquivalent = report.saveIsolation.passed;
  if (!report.saveIsolation.passed) {
    const failedComparisons = [
      ...report.saveIsolation.comparisons.filter(item => !item.ok),
      ...report.saveIsolation.storedComparisons.filter(item => !item.ok),
    ].map(item => ({label: item.label, persistentDifferencePaths: item.persistentDifferencePaths, differencePaths: item.differencePaths, integrity: item.integrity, dynamicsValid: item.dynamicsValid, spawnNoncesValid: item.spawnNoncesValid}));
    throw new Error('R75 save comparisons failed after collecting all checkpoints: ' + JSON.stringify(failedComparisons));
  }
  report.result = 'passed';
} catch (error) {
  failure = error;
  report.result = 'failed';
  report.error = String(error.stack || error);
  if (page) report.debug = await page.evaluate(() => ({zone, layer, loading, modal, scene: storyScene?.part, panel: document.getElementById('panel')?.innerText, player: player && {x: player.x, y: player.y, hp: player.hp}, warnings: warnings.slice(-8), trial: window.__STORYWORLD_CHEAT777__?.active(), slots: window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect()})).catch(() => null);
} finally {
  report.cleanupErrors = [];
  for (const [name, resource] of [['context', context], ['browser', browser]]) {
    if (!resource) continue;
    try { await resource.close(); } catch (error) { report.cleanupErrors.push(`${name}: ${error.message}`); failure ||= error; }
  }
  if (report.cleanupErrors.length) {
    report.result = 'failed';
    report.error ||= report.cleanupErrors.join('; ');
  }
  try {
    await fs.mkdir(path.dirname(output), {recursive: true});
    await fs.writeFile(output, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('R75_OVERNIGHT_RESULT_WRITE_FAILURE', error.stack || error);
    failure ||= error;
  }
}

if (failure) {
  console.error('R75_OVERNIGHT_FAILURE', JSON.stringify(report));
  process.exitCode = 1;
} else {
  console.log('R75_OVERNIGHT_RESULT', JSON.stringify({seed, target, result: report.result, checks: report.checks.length, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length}));
}
