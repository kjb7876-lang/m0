import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const seed = Number(process.env.R75_OVERNIGHT_SEED || 11);
const replicate = Number(process.env.R75_OVERNIGHT_REP || 1);
const label = process.env.R75_OVERNIGHT_LABEL || 'candidate';
const seedTargets = new Map([[11, 'dist02'], [29, 'last303'], [47, 'hando02']]);
const target = seedTargets.get(seed);
assert.ok(target, `Unexpected matrix seed ${seed}`);
const output = `out/r75/overnight/${label}/seed-${seed}-rep-${replicate}.json`;
await fs.mkdir('out/r75/overnight', {recursive: true});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  seed,
  replicate,
  label,
  target,
  htmlSHA256: digest(await fs.readFile('_pages/docs/index.html')),
  rendererSHA256: digest(await fs.readFile('_pages/docs/dist/phase1.js')),
  browserSandbox: true,
  softwareGPU: true,
  physicalGPU: false,
  physicalDevice: false,
  scope: 'Native UI new game, keyboard movement/attack, normal save/reload/Continue, 777 isolated trial save/reload/resume/leave, and one seed-specific real-map probe. Not full natural campaign completion.',
  checks: [],
  pageErrors: [],
  consoleErrors: [],
};

const browser = await chromium.launch({headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage']});
const context = await browser.newContext({viewport: {width: 1365, height: 850}, deviceScaleFactor: 1});
await context.addInitScript(value => {
  let state = value >>> 0;
  Math.random = () => {
    let n = state += 0x6D2B79F5;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}, seed);
let page;

function check(name, details) {
  report.checks.push({name, ok: true, details});
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

function stableSave(save) {
  return {
    zone: save.zone,
    layer: save.layer,
    progress: save.progress,
    player: save.player,
    visited: save.visited,
    readScenes: save.readScenes,
    ending: save.ending,
    lastHub: save.lastHub,
    rooms: save.rooms,
    settings: save.settings,
    zoom: save.zoom,
    auto: save.auto,
    worldR74: save.worldR74,
    worldR75: save.worldR75,
    mazeR73: save.mazeR73,
    routeEntriesR72: save.routeEntriesR72,
    narrativeObjectivesR75: save.narrativeObjectivesR75,
    castleDefenseR75: save.castleDefenseR75,
    goldenR72: save.goldenR72,
    dancePolicyR75: save.dancePolicyR75,
  };
}

async function performanceMatrix() {
  const before = await page.evaluate(() => {
    auto = false;
    guide = false;
    booted = true;
    player.invincible = Math.max(player.invincible || 0, 1e7);
    const actors = room.enemies.filter(e => e.hp > 0 && e.spawnState === 'active').map(e => ({id: e.id, x: Math.round(e.x * 1000) / 1000, y: Math.round(e.y * 1000) / 1000, hp: Math.round(e.hp * 1000) / 1000}));
    return {zone, layer, seed: room.exploration?.seedR73 ?? null, family: room.exploration?.worldR75?.family || null, enemyRoster: room.enemies.length, active: actors.length, actors, camera: {...cam}, player: {x: player.x, y: player.y}, renderer: window.__STORYWORLD_PHASE1__.controller.inspect().active, fixture: 'native dist02 field at deterministic seed; player invincibility is an observation fixture; renderer resolution/density unchanged'};
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

try {
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
  check('natural-new-game-native-keyboard-save', {start, nativeInput, hero: normal.player.hero, level: normal.player.level, points: normal.player.points, zone: normal.zone});

  await travel(target);
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
  check('seed-specific-native-map-and-interaction-probe', targetProbe);

  await page.reload({waitUntil: 'domcontentloaded'});
  await page.locator('#campaignContinue54').click({timeout: 90000});
  await ready();
  const normalAfterReload = await page.evaluate(() => serializeSave());
  assert.deepEqual(stableSave(normalAfterReload), stableSave(normal), 'ordinary save and story remain stable across trial visits');
  assert.equal(await page.evaluate(() => window.__STORYWORLD_CHEAT777__.active()), false);
  check('browser-reload-native-continue-preserves-normal-progress', {zone: normalAfterReload.zone, progress: normalAfterReload.progress, hero: normalAfterReload.player.hero, level: normalAfterReload.player.level});

  await page.locator('#story-code-button').click();
  await page.locator('#codeResumeR75').click();
  await page.waitForFunction(id => zone === id && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().transitionDepth, target, {timeout: 90000});
  await ready();
  const resumedTrial = await page.evaluate(() => ({zone, active: window.__STORYWORLD_CHEAT777__.active(), save: serializeSave()}));
  assert.equal(resumedTrial.zone, target);
  assert.equal(resumedTrial.active, true);
  check('saved-777-trial-resumes-after-normal-continue', {zone: resumedTrial.zone, active: resumedTrial.active, seed, targetProbe});

  assert.equal(await page.evaluate(() => window.__STORYWORLD_CHEAT777__.leave()), true);
  await ready();
  const returned = await page.evaluate(() => serializeSave());
  assert.deepEqual(stableSave(returned), stableSave(normal), 'leaving a saved 777 trial restores the original normal journey');
  check('native-777-leave-restores-normal-journey', {zone: returned.zone, progress: returned.progress, hero: returned.player.hero, level: returned.player.level, points: returned.player.points});

  assert.equal(await page.evaluate(() => saveGame(false)), true);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.locator('#campaignContinue54').click({timeout: 90000});
  await ready();
  const final = await page.evaluate(() => serializeSave());
  assert.deepEqual(stableSave(final), stableSave(normal), 'normal save survives a second browser round trip after 777 return');
  assert.deepEqual(report.pageErrors, []);
  report.result = 'passed';
  report.roundTrips = 2;
  report.normalReturnedByteComparable = true;
  console.log('R75_OVERNIGHT_RESULT', JSON.stringify({seed, target, result: report.result, checks: report.checks.length, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length}));
} catch (error) {
  report.result = 'failed';
  report.error = String(error.stack || error);
  if (page) report.debug = await page.evaluate(() => ({zone, layer, loading, modal, scene: storyScene?.part, panel: document.getElementById('panel')?.innerText, player: player && {x: player.x, y: player.y, hp: player.hp}, warnings: warnings.slice(-8), trial: window.__STORYWORLD_CHEAT777__?.active(), slots: window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect()})).catch(() => null);
  console.error('R75_OVERNIGHT_FAILURE', JSON.stringify(report));
  throw error;
} finally {
  await fs.writeFile(output, JSON.stringify(report, null, 2));
  await context.close();
  await browser.close();
}
