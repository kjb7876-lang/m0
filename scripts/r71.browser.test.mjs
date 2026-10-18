import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const SITE = process.env.STORYWORLD_URL || 'http://127.0.0.1:4391/';
const BASE = path.resolve(process.env.R71_BASE_DOCS || '_r70/docs');
const CANDIDATE = path.resolve(process.env.R71_DOCS || '_pages/docs');
const OUT = path.resolve(process.env.R71_OUT || 'out/r71');
const APP_URL = new URL(SITE).href;
const ASSET_ART = 'assets/vfx/v31315/spirit-orb.webp';
await fs.mkdir(OUT, {recursive: true});

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function readDocuments(root) {
  const htmlPath = path.join(root, 'index.html'), rendererPath = path.join(root, 'dist/phase1.js');
  const [htmlBytes, rendererBytes] = await Promise.all([fs.readFile(htmlPath), fs.readFile(rendererPath)]);
  return {
    html: htmlBytes.toString('utf8'),
    renderer: rendererBytes.toString('utf8'),
    files: {
      html: {path: htmlPath, sha256: sha256(htmlBytes)},
      renderer: {path: rendererPath, sha256: sha256(rendererBytes)},
    },
  };
}

const sources = {
  baseline: await readDocuments(BASE),
  candidate: await readDocuments(CANDIDATE),
};

const launch = {headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage']};
if (process.env.CHROMIUM_EXECUTABLE) launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(launch);
const report = {
  revision: 'R71-GAMEPLAY-READABILITY',
  browser: await browser.version(),
  sandbox: true,
  candidateHTML: sources.candidate.html.length,
  baselineHTML: sources.baseline.html.length,
  sourceFiles: {baseline: sources.baseline.files, candidate: sources.candidate.files},
  physicalGPU: false,
  physicalMobile: false,
  actualRelay: false,
  checks: [],
  screenshots: [],
  status: 'running',
};
const saveReport = () => fs.writeFile(path.join(OUT, 'browser.json'), JSON.stringify(report, null, 2) + '\n');

function seedMath() {
  let seed = 71018;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

async function openGame({variant = 'candidate', mobile = false, viewport, context} = {}) {
  const ownContext = !context;
  context ||= await browser.newContext({
    viewport: viewport || (mobile ? {width: 390, height: 844} : {width: 1365, height: 850}),
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(seedMath);
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.href === APP_URL) {
      return route.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: sources[variant].html});
    }
    if (url.pathname.endsWith('/dist/phase1.js')) {
      return route.fulfill({status: 200, contentType: 'text/javascript; charset=utf-8', body: sources[variant].renderer});
    }
    return route.continue();
  });
  await page.goto(APP_URL, {waitUntil: 'load', timeout: 60000});
  await page.locator('#campaignNew54').click({timeout: 60000});
  await page.waitForFunction(() => {
    const s = window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.();
    return s?.busy === false && s.stage === 'playing' && !s.error && window.eval('started && booted && !loading');
  }, null, {timeout: 60000});
  return {context, page, errors, ownContext};
}

async function closeGame(game) {
  if (game?.ownContext) await game.context.close();
  else await game?.page?.close();
}

async function entryFailure(page, id, layer, phase, entered, error) {
  let diagnostic;
  try {
    diagnostic = await page.evaluate(({id, layer: requestedLayer, phase, entered}) => {
      const safe = fn => { try { return fn(); } catch (error) { return {error: String(error)}; } };
      const profile = safe(() => window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.());
      const coop = safe(() => window.__STORYWORLD_COOP_SIM_R62__?.inspect?.());
      const progression4 = safe(() => window.__STORYWORLD4__?.inspect?.()?.progression);
      const fatal = document.getElementById('fatal');
      const region = typeof regionById === 'undefined' ? null : regionById[id];
      const health = safe(() => typeof player === 'undefined' ? null : window.__STORYWORLD_HEALTH_R71__?.inspect?.(player));
      return {
        phase, requested: {id, layer: requestedLayer}, entered,
        nativeEntryTrace: window.__R71_NATIVE_ENTRY_TRACE__ || null,
        current: {
          zone: typeof zone === 'undefined' ? null : zone,
          layer: typeof layer === 'undefined' ? null : layer,
          roomId: typeof room === 'undefined' ? null : room?.id,
          roomLayer: typeof room === 'undefined' ? null : room?.layer,
          loading: typeof loading === 'undefined' ? null : loading,
          modal: typeof modal === 'undefined' ? null : modal,
          hp: typeof player === 'undefined' ? null : player?.hp,
          position: typeof player === 'undefined' ? null : {x: player?.x, y: player?.y},
          transitionCD: typeof transitionCD === 'undefined' ? null : transitionCD,
          maxHp: health?.player?.maxHp ?? null,
          simulationTime: typeof time === 'undefined' ? null : time,
          documentHidden: document.hidden,
        },
        portals: safe(() => window.__STORYWORLD_PORTALS_R61__?.inspect?.() || null),
        progression4,
        storyEvents: typeof SW3 === 'undefined' ? null : safe(() => SW3.events.slice(-24).map(event => ({
          at: event.at, type: event.type, layer: event.layer, zone: event.zone,
          recoveredTo: event.recoveredTo, unlocked: event.unlocked,
        }))),
        coopTransitions: coop?.history?.slice(-16) || null,
        nativeRegion: region ? {id: region.id, safe: region.safe, bossCount: region.bosses?.length || 0} : null,
        profile: profile ? {busy: profile.busy, stage: profile.stage, error: profile.error, audit: profile.audit?.slice(-8)} : null,
        campaign: safe(() => window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.() || null),
        ego: safe(() => window.__STORYWORLD_EGO151__?.inspect?.() || null),
        health: health ? {
          player: health.player,
          authority: health.authority,
          bleeding: health.bleeding,
        } : null,
        warnings: typeof warnings === 'undefined' ? [] : safe(() => warnings.slice(-12)),
        runtimeErrors: typeof errors === 'undefined' ? [] : safe(() => errors.slice(-12)),
        fatal: fatal ? {display: getComputedStyle(fatal).display, text: fatal.textContent?.slice(0, 1200)} : null,
        retryPanel: document.getElementById('retryRegion')?.parentElement?.textContent?.slice(0, 1200) || null,
        loadStatus: document.getElementById('loadStatus')?.textContent || null,
      };
    }, {id, layer, phase, entered});
  } catch (diagnosticError) {
    diagnostic = {phase, requested: {id, layer}, entered, diagnosticError: diagnosticError.message};
  }
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const screenshot = path.join(OUT, `entry-failure-${safeId}-${Date.now()}.png`);
  try {
    await page.screenshot({path: screenshot, fullPage: true, timeout: 15000});
  } catch (screenshotError) {
    diagnostic.screenshotError = screenshotError.message;
  }
  const failure = {requested: {id, layer}, phase, entered, diagnostic, screenshot: diagnostic.screenshotError ? null : screenshot, error: error?.stack || String(error)};
  report.entryFailures ||= [];
  report.entryFailures.push(failure);
  if (failure.screenshot) report.failureScreenshots = [...(report.failureScreenshots || []), failure.screenshot];
  return new Error(`Native region entry failed: ${JSON.stringify(failure)}`, {cause: error});
}

async function enterRegion(page, id, {layer = 'STORY', tier, position = {x: 15, y: 19}, safeSpawn = false} = {}) {
  let entryTrace;
  try {
    entryTrace = await page.evaluate(async ({id, layer: requestedLayer, tier, position, safeSpawn}) => {
      const snapshot = phase => {
        const safe = fn => { try { return fn(); } catch (error) { return {error: String(error)}; } };
        const portals = safe(() => window.__STORYWORLD_PORTALS_R61__?.inspect?.() || null);
        const p = typeof player === 'undefined' ? null : player;
        const points = Array.isArray(portals?.points) ? portals.points.map(row => ({
          direction: row.direction, destination: row.destination, point: row.point,
          open: row.status?.open === true, distance: p && row.point ? Math.hypot(p.x - row.point.x, p.y - row.point.y) : null,
        })) : [];
        const coop = safe(() => window.__STORYWORLD_COOP_SIM_R62__?.inspect?.());
        return {
          phase, at: performance.now(), zone: typeof zone === 'undefined' ? null : zone,
          layer: typeof layer === 'undefined' ? null : layer,
          roomId: typeof room === 'undefined' ? null : room?.id,
          roomLayer: typeof room === 'undefined' ? null : room?.layer,
          loading: typeof loading === 'undefined' ? null : loading,
          modal: typeof modal === 'undefined' ? null : modal,
          player: p ? {x: p.x, y: p.y, hp: p.hp} : null,
          transitionCD: typeof transitionCD === 'undefined' ? null : transitionCD,
          portalDistances: points, portals,
          progression4: safe(() => window.__STORYWORLD4__?.inspect?.()?.progression),
          storyEvents: typeof SW3 === 'undefined' ? null : safe(() => SW3.events.slice(-12).map(event => ({
            at: event.at, type: event.type, layer: event.layer, zone: event.zone, recoveredTo: event.recoveredTo,
          }))),
          coopHistory: coop?.history?.slice(-8) || null,
        };
      };
      auto = false;
      guide = false;
      settings.autoSkill = false;
      settings.sound = false;
      settings.music = false;
      window.__R71_NATIVE_ENTRY_TRACE__ = null;
      const options = {restore: true, noStory: true, layer: requestedLayer};
      if (!safeSpawn && position) options.position = position;
      if (tier) options.difficultyR63 = tier;
      const result = await enterRegion(id, safeSpawn ? 'n' : null, options);
      const afterReturn = snapshot('awaited-enterRegion-return');
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
      const nextFrame = snapshot('next-animation-frame');
      const trace = {requested: {id, layer: requestedLayer, safeSpawn}, result, afterReturn, nextFrame, samples: []};
      window.__R71_NATIVE_ENTRY_TRACE__ = trace;
      const startedAt = performance.now();
      let frame = 0;
      const observe = () => {
        if (window.__R71_NATIVE_ENTRY_TRACE__ !== trace || frame >= 180 || performance.now() - startedAt >= 3500) return;
        if (frame++ % 6 === 0) trace.samples.push(snapshot('post-entry-observation'));
        requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
      return trace;
    }, {id, layer, tier, position, safeSpawn});
  } catch (error) {
    throw await entryFailure(page, id, layer, 'native-enterRegion-call', entryTrace, error);
  }
  if (entryTrace?.result === false) throw await entryFailure(page, id, layer, 'native-enterRegion-rejected', entryTrace, new Error(`native entry to ${id} was rejected`));
  if (entryTrace?.afterReturn?.zone !== id || entryTrace?.afterReturn?.roomId !== id) {
    throw await entryFailure(page, id, layer, 'native-entry-resolved-to-other-zone', entryTrace, new Error(`native entry to ${id} resolved to ${entryTrace?.afterReturn?.zone}/${entryTrace?.afterReturn?.roomId}`));
  }
  if (entryTrace?.nextFrame?.zone !== id || entryTrace?.nextFrame?.roomId !== id) {
    throw await entryFailure(page, id, layer, 'native-entry-changed-by-next-frame', entryTrace, new Error(`native entry to ${id} changed to ${entryTrace?.nextFrame?.zone}/${entryTrace?.nextFrame?.roomId} on the next frame`));
  }
  try {
    await page.waitForFunction(({id, layer}) => window.eval(`zone===${JSON.stringify(id)} && layer===${JSON.stringify(layer)} && !loading && !modal`), {id, layer}, {timeout: 60000});
  } catch (error) {
    throw await entryFailure(page, id, layer, 'native-entry-state-wait', entryTrace, error);
  }
}

async function seedTrustedStoryHistory(page, {throughId = null, requireAllBossMaps = false} = {}) {
  const fixture = await page.evaluate(async ({throughId, requireAllBossMaps}) => {
    const api = window.__STORYWORLD4__;
    if (!api || api.version !== 4) throw Error('The native version-4 save API is unavailable');
    const raw = api.save();
    if (raw?.version !== 6 || raw?.scope !== 'hapil.storyworld.depth-full.20261008' || !raw.progress || !raw.rooms || !raw.unlockedRegions) {
      throw Error('Trusted-history fixture requires the current native version-6 envelope and full progress/room/unlock data');
    }
    const bossMaps = Object.keys(regionById || {}).filter(id => Array.isArray(regionById[id]?.bosses) && regionById[id].bosses.length > 0);
    const order = api.campaignOrder().map(row => row.id);
    const missingFromTrustedRoute = bossMaps.filter(id => !order.includes(id));
    if (requireAllBossMaps && missingFromTrustedRoute.length) {
      throw Error('Boss maps absent from native trusted route: ' + missingFromTrustedRoute.join(', '));
    }
    const targetIndex = throughId === null ? order.length - 1 : order.indexOf(throughId);
    if (targetIndex < 0) throw Error(`Requested trusted-history target is not on the native campaign route: ${throughId}`);
    const history = order.slice(0, targetIndex + 1);
    const originalProgress = JSON.stringify(raw.progress);
    const originalRoomKeys = Object.keys(raw.rooms).sort();
    const originalLocation = {zone: raw.zone, layer: raw.layer, x: raw.player?.x, y: raw.player?.y};
    if (!originalLocation.zone || !['STORY', 'DREAM'].includes(originalLocation.layer)) {
      throw Error('Native save must retain its current map and layer for the trusted-history fixture');
    }
    raw.unlockedRegions = {
      ...(raw.unlockedRegions || {}),
      STORY: [...new Set(['hub', ...history])],
    };
    await api.restore(raw);
    const restored = api.save();
    const progression = api.inspect()?.progression;
    const lockedBossMaps = bossMaps.filter(id => !api.isUnlocked(id, 'STORY'));
    return {
      apiVersion: api.version, nativeVersion: raw.version, nativeScope: raw.scope,
      nativeKeys: Object.keys(raw).sort(), restoredNativeKeys: Object.keys(restored).sort(),
      routeIds: order.length, historyCount: history.length, throughId: history.at(-1),
      bossMaps, missingFromTrustedRoute,
      originalLocation,
      zone: typeof zone === 'undefined' ? null : zone,
      roomId: typeof room === 'undefined' ? null : room?.id,
      layer: typeof layer === 'undefined' ? null : layer,
      progressPreserved: JSON.stringify(restored.progress) === originalProgress,
      existingRoomKeysPreserved: originalRoomKeys.every(key => Object.hasOwn(restored.rooms, key)),
      targetUnlocked: throughId === null || api.isUnlocked(throughId, 'STORY'),
      lockedBossMaps, unlockedRegions: progression?.unlockedRegions?.STORY || [],
    };
  }, {throughId, requireAllBossMaps});
  assert.equal(fixture.apiVersion, 4, 'trusted history is exposed by the native R4 API');
  assert.equal(fixture.nativeVersion, 6, 'the current serialized save uses the native version-6 envelope');
  assert.equal(fixture.nativeScope, 'hapil.storyworld.depth-full.20261008');
  assert.ok(fixture.routeIds > 0, 'the native campaign route must be present');
  assert.equal(fixture.originalLocation.layer, 'STORY');
  assert.equal(fixture.zone, fixture.originalLocation.zone, 'native save import retains its actual current map');
  assert.equal(fixture.roomId, fixture.originalLocation.zone);
  assert.equal(fixture.layer, 'STORY');
  assert.equal(fixture.progressPreserved, true, 'the trusted-history fixture must preserve actual clear progress');
  assert.equal(fixture.existingRoomKeysPreserved, true, 'the trusted-history fixture must preserve every previously saved room definition');
  assert.equal(fixture.targetUnlocked, true, 'the native trusted-history validator must unlock the requested map');
  if (throughId !== null) assert.equal(fixture.throughId, throughId);
  if (requireAllBossMaps) {
    assert.ok(fixture.bossMaps.length > 0, 'the native region registry must expose boss maps before fixture import');
    assert.deepEqual(fixture.missingFromTrustedRoute, [], 'every authored boss map must belong to the native sequential trusted route');
    assert.equal(fixture.lockedBossMaps.length, 0, 'the native trusted-history validator must unlock every authored boss map');
  }
  return fixture;
}

async function selectDifficulty(page, id, tier, {mobile = false, options = {}} = {}) {
  const layer = options.layer || 'STORY';
  const before = await page.evaluate(({id, layer}) => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode(id, layer), {id, layer});
  await page.evaluate(({id, options}) => window.__STORYWORLD_PROGRESSION_R71__.openDifficulty(id, null, {
    restore: true, noStory: true, position: {x: 15, y: 19}, ...options,
  }), {id, options});
  const modal = page.locator('#r71DifficultyOptions');
  await modal.waitFor({state: 'visible', timeout: 15000});
  const selected = page.locator(`#r71Difficulty${tier[0].toUpperCase()}${tier.slice(1)}`);
  if (mobile) await selected.tap(); else await selected.click();
  assert.equal(await selected.getAttribute('aria-checked'), 'true', `${tier} must be selected in the native dialog`);
  assert.equal(await page.evaluate(({id, layer}) => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode(id, layer), {id, layer}), before, 'selecting a tier must not apply it before confirmation');
  return {before, layer};
}

async function confirmDifficulty(page, id, tier, {mobile = false, layer = 'STORY'} = {}) {
  const button = page.locator('#r71DifficultyConfirm');
  if (mobile) await button.tap(); else await button.click();
  await page.waitForFunction(({id}) => window.eval(`zone===${JSON.stringify(id)} && !loading && !modal`), {id}, {timeout: 60000});
  assert.equal(await page.evaluate(({id, layer}) => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode(id, layer), {id, layer}), tier, 'confirmed difficulty must become the native map tier');
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(n => {
    const c = n / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

function assertNoPageErrors(game) {
  assert.deepEqual(game.errors, [], 'the gameplay page must not raise uncaught JavaScript errors');
}

try {
  // The actual native tier picker is used to enter each map. Selection alone
  // must not mutate map state; confirmation applies exactly once.
  {
    const game = await openGame();
    const {page} = game;
    await page.evaluate(() => { auto = false; settings.autoSkill = false; });
    const originalTier = await page.evaluate(() => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode('dist00', 'STORY'));
    await page.evaluate(() => window.__STORYWORLD_PROGRESSION_R71__.openDifficulty('dist00', null, {
      restore: true, noStory: true, position: {x: 15, y: 19}, layer: 'STORY',
    }));
    await page.locator('#r71DifficultyOptions').waitFor({state: 'visible'});
    await page.locator('#r71DifficultyHard').click();
    assert.equal(await page.locator('#r71DifficultyHard').getAttribute('aria-checked'), 'true');
    assert.equal(await page.evaluate(() => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode('dist00', 'STORY')), originalTier);
    await page.locator('#r71DifficultyCancel').click();
    assert.equal(await page.evaluate(() => window.__STORYWORLD_CAMPAIGN_R63R1__?.mode('dist00', 'STORY')), originalTier);
    assert.equal((await page.evaluate(() => window.__STORYWORLD_PROGRESSION_R71__.difficultyState())).transitions, 0);

    await selectDifficulty(page, 'dist00', 'easy');
    await confirmDifficulty(page, 'dist00', 'easy');

    const rewards = [];
    for (const [id, tier, expected] of [['dist00', 'easy', 1], ['dist01', 'normal', 3], ['dist02', 'hard', 7]]) {
      if (id !== 'dist00') {
        await selectDifficulty(page, id, tier);
        await confirmDifficulty(page, id, tier);
      }
      const result = await page.evaluate(({id, expected}) => {
        player.points = 0;
        const before = player.points;
        window.completeRegion(id);
        const once = player.points - before;
        window.completeRegion(id);
        return {once, afterRepeat: player.points, state: window.__STORYWORLD_PROGRESSION_R71__.inspect()};
      }, {id, expected});
      assert.equal(result.once, expected, `${id}/${tier} first clear must award ${expected}`);
      assert.equal(result.afterRepeat, expected, `${id}/${tier} repeated clear must not award again`);
      rewards.push({id, tier, expected, actual: result.once, noDuplicate: true});
    }
    const pc = await page.evaluate(() => ({
      revision: window.__STORYWORLD_PROGRESSION_R71__.inspect().revision,
      transitions: window.__STORYWORLD_PROGRESSION_R71__.difficultyState().transitions,
      cancelPreservedTier: true,
      modalText: document.body.innerText.includes('첫 클리어 +7점'),
    }));
    assert.equal(pc.revision, 'R71-DIFFICULTY-DROPS');
    assert.ok(pc.transitions >= 3);
    report.checks.push({name: 'native-difficulty-confirm-and-first-clear', rewards, dialog: pc});
    assertNoPageErrors(game);
    await closeGame(game);
  }

  // Exercise real touch input and both mobile orientations on a mobile
  // context. The options and actions must remain inside the visual viewport.
  {
    const mobile = await openGame({mobile: true});
    const {page} = mobile;
    const fits = async () => page.evaluate(() => {
      const ids = ['r71DifficultyOptions', 'r71DifficultyConfirm', 'r71DifficultyCancel'];
      const boxes = Object.fromEntries(ids.map(id => [id, document.getElementById(id).getBoundingClientRect().toJSON()]));
      return {viewport: {width: innerWidth, height: innerHeight}, boxes};
    });
    await selectDifficulty(page, 'dist00', 'hard', {mobile: true});
    const portrait = await fits();
    for (const box of Object.values(portrait.boxes)) {
      assert.ok(box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0);
      assert.ok(box.x + box.width <= portrait.viewport.width + 1 && box.y + box.height <= portrait.viewport.height + 1);
    }
    await page.locator('#r71DifficultyCancel').tap();
    await page.setViewportSize({width: 844, height: 390});
    await selectDifficulty(page, 'dist00', 'normal', {mobile: true});
    const landscape = await fits();
    for (const box of Object.values(landscape.boxes)) {
      assert.ok(box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0);
      assert.ok(box.x + box.width <= landscape.viewport.width + 1 && box.y + box.height <= landscape.viewport.height + 1);
    }
    await page.screenshot({path: path.join(OUT, 'difficulty-mobile.png')});
    report.screenshots.push('difficulty-mobile.png');
    await confirmDifficulty(page, 'dist00', 'normal', {mobile: true});
    const state = await page.evaluate(() => window.__STORYWORLD_PROGRESSION_R71__.difficultyState());
    assert.equal(state.confirmed, 'normal');
    assert.equal(state.cancelled, false);
    report.checks.push({name: 'mobile-touch-difficulty-portrait-landscape', portrait, landscape, state});
    assertNoPageErrors(mobile);
    await closeGame(mobile);
  }

  // Verify health balance through real enemy hit handling, a native upgrade,
  // R70 save migration, restore and the native return-to-hub respawn route.
  {
    const base = await openGame({variant: 'baseline'});
    await enterRegion(base.page, 'dist00');
    const oldSave = await base.page.evaluate(() => serializeSave());
    assertNoPageErrors(base);
    await closeGame(base);

    const game = await openGame();
    const {page} = game;
    await enterRegion(page, 'dist00');
    const initial = await page.evaluate(() => {
      const health = window.__STORYWORLD_HEALTH_R71__;
      const p = player;
      p.hp = 700;
      return {max: maxHP(), inspect: health.inspect(p).player, norm: health.normalization(p)};
    });
    assert.equal(initial.max, 777, 'native PLAYER maxHP must be exactly 777');
    assert.equal(initial.inspect.maxHp, 777);
    assert.equal(initial.inspect.healthR71Applied, true);

    await page.evaluate(() => {
      player.hp = maxHP();
      player.invincible = 1e6;
      player.invReason = 'R71 native boss scan';
      auto = false; guide = false; command = null; route = [];
      settings.autoSkill = false;
    });

    // Import a version-4 native save whose trusted route history covers every
    // authored campaign map. Only the saved unlock-history list changes.
    const unlockFixture = await seedTrustedStoryHistory(page, {requireAllBossMaps: true});
    await page.evaluate(() => {
      player.hp = maxHP();
      player.invincible = 1e6;
      player.invReason = 'R71 native boss scan';
      auto = false; guide = false; command = null; route = [];
      settings.autoSkill = false;
    });

    const bossMaps = await page.evaluate(() => {
      return Object.keys(regionById || {}).flatMap(id => {
        const bosses = regionById[id]?.bosses;
        return Array.isArray(bosses) && bosses.length > 0 ? [{id, expectedBossCount: bosses.length}] : [];
      });
    });
    const expectedBossTotal = bossMaps.reduce((total, row) => total + row.expectedBossCount, 0);
    assert.ok(bossMaps.length > 0, 'native region registry must expose maps with authored bosses');
    assert.ok(expectedBossTotal > 0, 'native region registry must expose at least one authored boss');
    const bossRows = [];
    for (const expected of bossMaps) {
      const unlocked = await page.evaluate(id => window.__STORYWORLD4__?.isUnlocked(id, 'STORY') === true, expected.id);
      assert.equal(unlocked, true, `${expected.id} must be admitted by the imported native trusted route before entry`);
      await enterRegion(page, expected.id, {layer: 'STORY', safeSpawn: true});
      const row = await page.evaluate(() => {
        const actors = (room.enemies || []).filter(e => e.boss || e.midboss || e.persona || e.cosmic || e.trial || e.cosmicGuardianR63);
        const portals = window.__STORYWORLD_PORTALS_R61__?.inspect?.();
        const portalDistances = (portals?.points || []).map(p => ({
          direction: p.direction, destination: p.destination, point: p.point, open: p.status?.open === true,
          distance: Math.hypot(player.x - p.point.x, player.y - p.point.y),
        }));
        return {id: room.id, layer: room.layer, position: {x: player.x, y: player.y}, portalDistances, actors: actors.map(e => ({
          id: e.id, name: e.name, maxHp: e.maxHp, hp: e.hp,
          canonicalMaxHp: e.healthR71CanonicalMaxHp, visibleMaxHp: e.healthR71VisibleMaxHp,
        }))};
      });
      assert.equal(row.id, expected.id, 'native region entry reaches the requested boss map');
      assert.equal(row.layer, 'STORY');
      assert.ok(row.position.x >= 11.5 && row.position.x <= 20.5 && row.position.y >= 11.5 && row.position.y <= 20.5, `${row.id} uses the native R61 safe spawn region`);
      assert.ok(row.portalDistances.every(p => p.distance >= 2.1 - 1e-6), `${row.id} spawns clear of every native R61 portal marker`);
      assert.ok(row.actors.length >= expected.expectedBossCount, `${row.id} must instantiate all source-declared native major actors`);
      bossRows.push({...row, expectedDefinitions: expected.expectedBossCount});
    }
    assert.equal(bossRows.length, bossMaps.length, 'every source-declared native boss map must be entered and inspected');
    assert.ok(bossRows.reduce((total, row) => total + row.actors.length, 0) >= expectedBossTotal, 'native map entry must instantiate every authored boss definition');
    for (const row of bossRows) {
      assert.ok(row.actors.length >= row.expectedDefinitions, `${row.id} must instantiate all authored boss actors`);
      for (const boss of row.actors) {
        assert.ok(Number.isSafeInteger(boss.maxHp), `${row.id}/${boss.id} visible boss max HP is integer`);
        assert.equal(boss.maxHp % 1000, 666, `${row.id}/${boss.id} max HP must end with 666`);
        assert.equal(boss.canonicalMaxHp % 1000, 666, `${row.id}/${boss.id} canonical max HP must end with 666`);
        assert.equal(boss.visibleMaxHp, boss.maxHp);
        assert.ok(boss.hp > 0 && boss.hp <= boss.maxHp);
      }
    }
    await enterRegion(page, 'dist00', {layer: 'STORY'});

    const hit = await page.evaluate(() => {
      auto = false;
      room.engaged = true;
      const p = player;
      p.hp = 700; p.invincible = 0; p.guard = false; p.parry = 0;
      const enemy = room.enemies.find(e => e.hp > 0 && !e.boss && !e.midboss && e.type !== 'ranged');
      if (!enemy) throw new Error('No native melee enemy is available for a real hit fixture');
      room.enemies = [enemy];
      enemy.x = p.x + .4; enemy.y = p.y; enemy.spawnState = 'active'; enemy.tell = .1;
      enemy.aim = {x: p.x, y: p.y, angle: Math.PI}; enemy.cd = 20;
      const base = hurt;
      let observed = null;
      hurt = function(value, source) {
        const before = p.hp, result = base.apply(this, arguments), after = p.hp;
        observed = {result, sourceIsRoomEnemy: source === enemy, before, after};
        return result;
      };
      try { tickEnemies(.2); } finally { hurt = base; }
      const health = window.__STORYWORLD_HEALTH_R71__;
      const rows = health.statusRows(p);
      const state = health.inspect(p);
      return {observed, state, rows, visuals: effects.filter(e => e.r71BleedVisualR71 === true).map(e => ({id: e.id, actor: e.r71ActorId, atlas: e.r52Blood === true, life: e.life, age: e.age}))};
    });
    assert.ok(hit.observed && hit.observed.sourceIsRoomEnemy && hit.observed.result === 'hit');
    assert.ok(hit.observed.after < hit.observed.before, 'the native enemy attack must actually reduce HP');
    assert.equal(hit.state.player.maxHp, 777);
    assert.equal(hit.state.bleeding.active, true);
    assert.equal(hit.state.dotAdded, false, 'bleed is a status/visual only; no new damage-over-time was added');
    assert.ok(hit.state.bleeding.remaining > 0 && hit.state.bleeding.remaining <= 30);
    assert.ok(hit.state.bleeding.activeVisuals > 0 && hit.state.bleeding.activeVisuals <= 1);
    assert.ok(hit.rows.some(row => row.key === 'health-r71-bleed' && row.label === '출혈'));
    assert.ok(hit.visuals.length > 0 && hit.visuals.length <= 1 && hit.visuals.every(row => row.atlas && row.life > 0));
    await page.screenshot({path: path.join(OUT, 'bleed-desktop.png')});
    report.screenshots.push('bleed-desktop.png');

    await page.evaluate(() => {
      player.points = Math.max(1, player.points);
      player.hp = 700;
      showUpgrades();
    });
    await page.locator('#r62NativeTalents').click();
    await page.locator('[data-up="vital"]').click();
    const afterUpgrade = await page.evaluate(() => ({max: maxHP(), hp: player.hp, rank: rank('vital'), inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(afterUpgrade.rank, 1, 'native vitality upgrade must be purchased');
    assert.equal(afterUpgrade.max, 777, 'vitality cannot inflate the fixed player max HP');
    assert.equal(afterUpgrade.inspect.maxHp, 777);

    const newSave = await page.evaluate(() => serializeSave());
    assert.equal(newSave.player.healthR71Applied, true, 'new save stores its health normalization marker');
    await page.evaluate(async save => restoreSave(save), newSave);
    await page.waitForFunction(() => window.eval("zone==='dist00' && !loading && !modal"), null, {timeout: 60000});
    const afterRestore = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(afterRestore.max, 777);
    assert.equal(afterRestore.inspect.maxHp, 777);

    await page.evaluate(async save => restoreSave(save), oldSave);
    await page.waitForFunction(() => window.eval("zone==='dist00' && !loading && !modal"), null, {timeout: 60000});
    const afterOldRestore = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(afterOldRestore.max, 777, 'R70 saves normalize into the R71 health cap');
    assert.equal(afterOldRestore.inspect.maxHp, 777);

    await page.evaluate(() => { player.hp = 0; showDeath(); });
    await page.locator('#reviveHome').click();
    await page.waitForFunction(() => window.eval("zone==='hub' && !loading && !modal"), null, {timeout: 60000});
    const respawn = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(respawn.max, 777);
    assert.equal(respawn.hp, 777, 'native death-to-hub respawn restores exactly the balanced cap');
    report.checks.push({name: 'health-cap-bosses-hit-save-upgrade-respawn', initial, trustedHistoryFixture: unlockFixture, bosses: bossRows, hit, afterUpgrade, afterRestore, afterOldRestore, respawn});
    assertNoPageErrors(game);
    await closeGame(game);
  }

  // Guard cases use real native hurt() admission, but their attacker/source
  // semantics deliberately model dodge, self-cost, and existing wound ticks.
  {
    const game = await openGame();
    const {page} = game;
    await enterRegion(page, 'dist00');
    const guards = await page.evaluate(() => {
      const health = window.__STORYWORLD_HEALTH_R71__, p = player;
      const enemy = room.enemies.find(e => e.hp > 0 && !e.boss) || room.enemies[0];
      const read = () => ({hp: p.hp, bleed: health.isBleeding(p), visuals: effects.filter(e => e.r71BleedVisualR71).length});
      p.hp = 700; p.invincible = 1; p.invReason = '회피';
      const dodgeBefore = read(), dodgeResult = hurt(8, enemy), dodgeAfter = read();
      p.invincible = 0;
      const selfBefore = read(), selfResult = hurt(8, {owner: 'hero', friendly: true, selfCost: true}), selfAfter = read();
      // Native admitted damage grants .30s of hit protection; keep the separate
      // DoT guard case independent of that intended post-hit window.
      p.invincible = 0;
      const dotBefore = read(), dotResult = hurt(8, {owner: 'existing-wound', r53WoundTick: true}), dotAfter = read();
      return {dodgeBefore, dodgeResult, dodgeAfter, selfBefore, selfResult, selfAfter, dotBefore, dotResult, dotAfter};
    });
    assert.equal(guards.dodgeResult, 'invulnerable');
    assert.equal(guards.dodgeAfter.hp, guards.dodgeBefore.hp);
    assert.equal(guards.dodgeAfter.bleed, false);
    assert.equal(guards.selfResult, 'hit');
    assert.ok(guards.selfAfter.hp < guards.selfBefore.hp);
    assert.equal(guards.selfAfter.bleed, false, 'self-cost damage must not create bleed');
    assert.equal(guards.dotResult, 'hit');
    assert.ok(guards.dotAfter.hp < guards.dotBefore.hp);
    assert.equal(guards.dotAfter.bleed, false, 'pre-existing wound DoT must not recursively create bleed');
    assert.equal(guards.dotAfter.visuals, 0);
    report.checks.push({name: 'bleed-dodge-self-dot-guards', guards});
    assertNoPageErrors(game);
    await closeGame(game);
  }

  // Run probability boundaries against the actual production roller. Existing
  // tier chance and 1..7 amount rules remain unchanged.
  {
    const game = await openGame();
    const values = await game.page.evaluate(() => {
      const p = window.__STORYWORLD_PROGRESSION_R71__, rows = [];
      for (const tier of ['easy', 'normal', 'hard']) {
        const bossChance = p.pointDropChance(tier, true), mobChance = p.pointDropChance(tier, false);
        const belowBoss = p.rollPointDrop(tier, true, (() => { let i = 0; return () => [Math.max(0, bossChance - 1e-6), .999999][i++] ?? .999999; })());
        const atBoss = p.rollPointDrop(tier, true, () => bossChance);
        const belowMob = p.rollPointDrop(tier, false, (() => { let i = 0; return () => [Math.max(0, mobChance - 1e-6), .0][i++] ?? 0; })());
        const atMob = p.rollPointDrop(tier, false, () => mobChance);
        const minAmount = p.rollPointDrop(tier, true, (() => { let i = 0; return () => [0, 0][i++] ?? 0; })());
        const maxAmount = p.rollPointDrop(tier, true, (() => { let i = 0; return () => [0, .999999][i++] ?? .999999; })());
        rows.push({tier, bossChance, mobChance, belowBoss, atBoss, belowMob, atMob, minAmount, maxAmount});
      }
      return rows;
    });
    const expected = {easy: [.10, .01], normal: [.50, .05], hard: [.77, .077]};
    for (const row of values) {
      assert.deepEqual([row.bossChance, row.mobChance], expected[row.tier]);
      assert.equal(row.belowBoss.success, true); assert.equal(row.atBoss.success, false);
      assert.equal(row.belowMob.success, true); assert.equal(row.atMob.success, false);
      assert.equal(row.minAmount.amount, 1); assert.equal(row.maxAmount.amount, 7);
    }
    report.checks.push({name: 'production-drop-chance-and-amount-boundaries', values});
    assertNoPageErrors(game);
    await closeGame(game);
  }

  // Test all authored material palettes plus actual hospital and ordinary map
  // assignment. Compare the unchanged hospital geometry against the R70 game.
  {
    const paletteGame = await openGame();
    const palettes = await paletteGame.page.evaluate(() => {
      const art = window.StoryPhase1.REGIONAL_TERRAIN_ART;
      const themes = [...new Set(Object.values(art).map(v => v.theme))].sort();
      const rgb = n => [(n >>> 16) & 255, (n >>> 8) & 255, n & 255];
      return themes.map(theme => {
        const p = window.StoryPhase1.mapPaletteR71(theme);
        return {theme, colors: Object.fromEntries(['floor', 'wall', 'cap', 'edge', 'background'].map(key => [key, rgb(p[key])]))};
      });
    });
    assert.ok(palettes.length >= 10, 'all ten regional profile palettes must be present');
    for (const row of palettes) {
      const c = row.colors;
      assert.ok(contrast(c.floor, c.wall) >= 1.6, `${row.theme} floor/wall contrast`);
      assert.ok(contrast(c.floor, c.background) >= 1.8, `${row.theme} floor/background contrast`);
      assert.ok(luminance(c.cap) > luminance(c.wall) + .08, `${row.theme} cap must read lighter than wall face`);
      assert.ok(luminance(c.edge) < luminance(c.wall) - .025, `${row.theme} edge must read darker than wall face`);
      assert.equal(new Set(Object.values(c).map(v => v.join(','))).size, 5, `${row.theme} uses five distinct role colors`);
    }
    await enterRegion(paletteGame.page, 'dist00');
    const activeMap = await paletteGame.page.evaluate(() => {
      const phase = window.__STORYWORLD_PHASE1__.inspect();
      return {active: phase.active, readability: phase.spatial?.mapReadabilityR71 || null};
    });
    assert.equal(activeMap.active, 'three', 'the active-map readability check must exercise the Three renderer');
    assert.ok(activeMap.readability?.threeOnly && activeMap.readability.theme === 'forest' && activeMap.readability.materialsOnly && !activeMap.readability.geometryChanged && activeMap.readability.flashlightMaskPreserved);
    assert.ok(activeMap.readability.contrast.floorToWall >= 1.6 && activeMap.readability.contrast.floorToBackground >= 1.8);
    const paletteHospitalAdmission = await seedTrustedStoryHistory(paletteGame.page, {throughId: 'ep1a08'});
    await enterRegion(paletteGame.page, 'ep1a08', {position: {x: 27, y: 27}});
    const hospital = await paletteGame.page.evaluate(() => {
      const phase = window.__STORYWORLD_PHASE1__.inspect(), s = phase.spatial;
      const layout = room.exploration;
      const native = {
        revision: layout?.hospitalLayoutRevision,
        bounds: layout?.bounds,
        doorUV: layout?.doorUV,
        floorRows: layout?.floorRects?.map(r => ({x:r.x,y:r.y,width:r.width,depth:r.depth,polygon:r.polygon})),
        boundary: layout?.hospitalBoundary12?.map(w => w.endpoints),
        walls: layout?.walls?.map(w => ({id:w.id,x:w.x,y:w.y,width:w.width,depth:w.depth,height:w.height,analyticBounds12:w.analyticBounds12})),
      };
      const spatial = s ? Object.fromEntries(['hospitalVisualRevision','hospitalDoorDetails37','hospitalLightAnchor37','hospitalJunctions34','doorWallCut34','hospitalFloorReady','hospitalRoomsReady','hospitalRoomPieces','hospitalCutWalls','terrainMeshes','bridgeMeshes'].map(k => [k, s[k]])) : null;
      return {active: phase.active, spatial, readability: s?.mapReadabilityR71 || null, native};
    });
    const baseline = await openGame({variant: 'baseline'});
    const baselineHospitalAdmission = await seedTrustedStoryHistory(baseline.page, {throughId: 'ep1a08'});
    await enterRegion(baseline.page, 'ep1a08', {position: {x: 27, y: 27}});
    const hospitalBase = await baseline.page.evaluate(() => {
      const phase = window.__STORYWORLD_PHASE1__.inspect(), layout = room.exploration, s = phase.spatial;
      return {
        active: phase.active,
        spatial: s ? Object.fromEntries(['hospitalVisualRevision','hospitalDoorDetails37','hospitalLightAnchor37','hospitalJunctions34','doorWallCut34','hospitalFloorReady','hospitalRoomsReady','hospitalRoomPieces','hospitalCutWalls','terrainMeshes','bridgeMeshes'].map(k => [k, s[k]])) : null,
        native: {
          revision: layout?.hospitalLayoutRevision,
          bounds: layout?.bounds,
          doorUV: layout?.doorUV,
          floorRows: layout?.floorRects?.map(r => ({x:r.x,y:r.y,width:r.width,depth:r.depth,polygon:r.polygon})),
          boundary: layout?.hospitalBoundary12?.map(w => w.endpoints),
          walls: layout?.walls?.map(w => ({id:w.id,x:w.x,y:w.y,width:w.width,depth:w.depth,height:w.height,analyticBounds12:w.analyticBounds12})),
        },
      };
    });
    assert.deepEqual(hospital.native, hospitalBase.native, 'hospital floor/wall/door layout must remain byte-identical to R70');
    if (hospital.spatial && hospitalBase.spatial) assert.deepEqual(hospital.spatial, hospitalBase.spatial, 'hospital native geometry and readiness counters must not change');
    assert.equal(hospital.active, 'three', 'hospital readability must be checked through the Three renderer');
    assert.ok(hospital.readability?.threeOnly && hospital.readability.theme === 'hospital');
    assert.equal(hospital.readability.geometryChanged, false);
    assert.equal(hospital.readability.assetsChanged, false);
    assert.equal(hospital.readability.flashlightMaskPreserved, true);
    await paletteGame.page.screenshot({path: path.join(OUT, 'hospital-desktop.png')});
    report.screenshots.push('hospital-desktop.png');
    report.checks.push({name: 'all-map-palettes-and-hospital-geometry', themes: palettes, activeMap, hospitalAdmission: paletteHospitalAdmission, hospital, baselineHospitalAdmission, hospitalBase});
    assertNoPageErrors(paletteGame); assertNoPageErrors(baseline);
    await closeGame(paletteGame); await closeGame(baseline);
  }

  // A real native boss kill creates a drop in the expanded hospital wing at
  // world coordinates above 32; the command capture must include icon + label,
  // pickup is one-shot, and its claim survives save/restore.
  {
    const game = await openGame();
    const {page} = game;
    const hospitalAdmission = await seedTrustedStoryHistory(page, {throughId: 'ep1a08'});
    await enterRegion(page, 'ep1a08', {position: {x: 27, y: 27}});
    await selectDifficulty(page, 'ep1a08', 'hard', {options: {position: {x: 27, y: 27}}});
    await confirmDifficulty(page, 'ep1a08', 'hard');
    const fixture = await page.evaluate(() => {
      const api = window.__STORYWORLD_PROGRESSION_R71__, r = room;
      const bounds = r.exploration?.bounds;
      if (!r.exploration?.expanded || !bounds || bounds[2] <= 32 || bounds[3] <= 32) throw new Error('Hospital expanded coordinates are unavailable');
      api.syncPointDrops(r);
      const walk = [];
      for (let x = Math.max(33, Math.ceil(bounds[0])); x < bounds[2] - .5 && walk.length < 30; x += .5) {
        for (let y = Math.max(1, Math.ceil(bounds[1])); y < bounds[3] - .5 && walk.length < 30; y += .5) {
          if (!blocked(x, y, .2, r)) walk.push({x, y});
        }
      }
      const target = walk[0];
      if (!target) throw new Error('No safe expanded hospital floor point above world x=32');
      const candidates = r.enemies.filter(e => e.hp > 0 && !e.deadRecorded);
      const targetEnemy = candidates.find(e => {
        const boss = !!(e.boss || e.midboss || e.persona || e.cosmic || e.trial || e.cosmicGuardianR63);
        const id = `r64:${r.passivePointEpochR64}:kill:${encodeURIComponent(String(e.id || 'enemy')).slice(0,720)}`;
        return api.rollPointForKill('hard', boss, id).success;
      });
      if (!targetEnemy) throw new Error('No native hospital enemy has a successful preserved seeded drop roll');
      const isBoss = !!(targetEnemy.boss || targetEnemy.midboss || targetEnemy.persona || targetEnemy.cosmic || targetEnemy.trial || targetEnemy.cosmicGuardianR63);
      const killId = `r64:${r.passivePointEpochR64}:kill:${encodeURIComponent(String(targetEnemy.id || 'enemy')).slice(0,720)}`;
      targetEnemy.x = target.x; targetEnemy.y = target.y; targetEnemy.hp = 1; targetEnemy.maxHp = Math.max(1, targetEnemy.maxHp); targetEnemy.deadRecorded = false; targetEnemy.deadAt = null; targetEnemy.visible = true; targetEnemy.disabled = false; targetEnemy.spawnState = 'active';
      r.engaged = true; player.x = target.x; player.y = target.y; player.hp = maxHP(); player.invincible = 0;
      const before = player.points, killed = hitEnemy(targetEnemy, 1);
      api.syncPointDrops(r);
      const drop = r.passivePointDropsR64.find(d => d.source === killId);
      const prop = drop && r.props.find(p => p.passivePointDropR64 && p.pointDropIdR64 === drop.id);
      return {bounds, target, enemy: {id: targetEnemy.id, isBoss, killed, deadRecorded: targetEnemy.deadRecorded, hp: targetEnemy.hp}, killId, drop, prop, pointsBefore: before, pointsAfterKill: player.points};
    });
    assert.ok(fixture.target.x > 32 || fixture.target.y > 32, 'native enemy/drop coordinate must use expanded >32 bounds');
    assert.equal(fixture.enemy.killed, true); assert.equal(fixture.enemy.deadRecorded, true);
    assert.ok(fixture.drop && fixture.drop.source === fixture.killId);
    assert.ok(Number.isSafeInteger(fixture.drop.amount) && fixture.drop.amount >= 1 && fixture.drop.amount <= 7);
    assert.ok(fixture.drop.x > 32 || fixture.drop.y > 32, 'the actual drop must persist in expanded coordinates');
    assert.ok(fixture.prop?.visible && fixture.prop.enabled && fixture.prop.path === ASSET_ART && fixture.prop.amountR64 === fixture.drop.amount);
    assert.equal(fixture.pointsAfterKill, fixture.pointsBefore, 'drop amount is granted on pickup, not kill');

    const visual = await page.evaluate(() => {
      const commands = window.__STORYWORLD_PHASE1__.captureVisual();
      const rows = commands.filter(c => String(c.owner?.id || '').startsWith('r71:point-drop:'));
      return {count: rows.length, kinds: rows.map(c => c.kind), images: rows.filter(c => c.kind === 'image').map(c => c.sourcePath), labels: rows.filter(c => c.kind === 'text').map(c => c.text), diagnostics: window.__STORYWORLD_PROGRESSION_R71__.inspect().pointDrops.rendering};
    });
    assert.ok(visual.count >= 2 && visual.images.some(path => path?.includes('v31315/spirit-orb.webp')) && visual.labels.includes('+' + fixture.drop.amount), 'Three capture must contain the real point beacon icon and amount label');
    assert.ok(visual.diagnostics?.beaconsCaptured > 0 && visual.diagnostics.lastCaptureBeaconCommands >= 2);
    await page.screenshot({path: path.join(OUT, 'point-drop-desktop.png')});
    report.screenshots.push('point-drop-desktop.png');

    const flashlight = await page.evaluate(() => {
      window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);
      const sight = window.__STORYWORLD_SIGHT24__, state = sight.mask();
      if (!state.enabled) throw new Error('Flashlight mask failed to enable');
      const hidden = [];
      const b = room.exploration.bounds;
      const geometry = sight.geometry();
      for (let x = Math.max(b[0] + 1, player.x + 1); x < b[2] - 1 && hidden.length < 40; x += .5) {
        for (let y = b[1] + 1; y < b[3] - 1 && hidden.length < 40; y += .5) {
          if (!blocked(x, y, .2, room) && !window.__STORYWORLD_SIGHT24__?.pointVisible(x, y)) {
            const dx = x - player.x, dy = y - player.y, d = Math.hypot(dx, dy);
            const rayLimit = d > 0 ? geometry.ray(dx / d, dy / d) : 0;
            if (d >= geometry.radius - .5 || rayLimit >= d - .1) continue;
            const q = project(x, y);
            if (q.x >= -36 && q.x <= W + 36 && q.y >= -40 && q.y <= H + 40) hidden.push({x, y, q, distance: d, rayLimit});
          }
        }
      }
      const spot = hidden[0];
      if (!spot) throw new Error('No in-view hospital point behind a nearby wall and inside flashlight radius');
      const hiddenEnemy = {id: 'r71-hidden-visibility-fixture', x: spot.x, y: spot.y};
      const fake = window.__STORYWORLD_PROGRESSION_R71__.recordPointDrop(hiddenEnemy, room, () => 0);
      window.__STORYWORLD_PROGRESSION_R71__.syncPointDrops(room);
      const commands = window.__STORYWORLD_PHASE1__.captureVisual();
      const beaconOwners = [...new Set(commands.filter(c => String(c.owner?.id || '').startsWith('r71:point-drop:')).map(c => c.owner.id))];
      const ctx = state.canvas.getContext('2d');
      const px = Math.max(0, Math.min(127, Math.round((player.x - state.origin[0]) / state.span[0] * 128)));
      const py = Math.max(0, Math.min(127, Math.round((1 - (player.y - state.origin[1]) / state.span[1]) * 128)));
      const center = ctx.getImageData(px, py, 1, 1).data;
      const corner = ctx.getImageData(0, 0, 1, 1).data;
      return {enabled: state.enabled, visible: window.__STORYWORLD_SIGHT24__?.pointVisible(player.x, player.y), hidden: window.__STORYWORLD_SIGHT24__?.pointVisible(spot.x, spot.y), centerPixel: [...center], cornerPixel: [...corner], spot, hiddenDrop: fake, beaconOwners, culls: window.__STORYWORLD_PROGRESSION_R71__.inspect().pointDrops.rendering?.lastCaptureSightCulled};
    });
    assert.equal(flashlight.enabled, true); assert.equal(flashlight.visible, true); assert.equal(flashlight.hidden, false);
    assert.ok(flashlight.spot.distance < flashlight.spot.rayLimit + 1, 'hidden fixture must be inside flashlight radius but behind an occluding wall');
    assert.ok(flashlight.centerPixel[0] > 180, 'the player remains inside the white flashlight mask');
    assert.ok(flashlight.cornerPixel[0] < 20, 'the outside of the flashlight mask stays black');
    assert.ok(flashlight.hiddenDrop?.id);
    assert.equal(flashlight.beaconOwners.length, 1, 'beacons outside the black flashlight mask must be excluded from the captured frame');
    assert.ok(flashlight.culls > 0, 'a hidden beacon must be culled by visibility geometry');

    const pickup = await page.evaluate(() => {
      const api = window.__STORYWORLD_PROGRESSION_R71__, id = room.passivePointDropsR64.find(d => d.source?.includes(encodeURIComponent('r71-hidden-visibility-fixture')) === false)?.id;
      const actual = room.passivePointDropsR64.find(d => d.id && room.props.some(p => p.pointDropIdR64 === d.id));
      if (!actual) throw new Error('Visible native drop disappeared before pickup');
      const owner = player, before = owner.points, targetId = actual.id;
      owner.x = actual.x; owner.y = actual.y;
      const first = api.collectPointDrops(), afterFirst = owner.points, second = api.collectPointDrops();
      const save = serializeSave();
      return {id: targetId, amount: actual.amount, before, first, afterFirst, second, afterSecond: owner.points, claimed: room.passivePointClaimsR64.includes(targetId), save: JSON.stringify(save)};
    });
    assert.equal(pickup.first, 1); assert.equal(pickup.afterFirst - pickup.before, pickup.amount);
    assert.equal(pickup.second, 0); assert.equal(pickup.afterSecond, pickup.afterFirst); assert.equal(pickup.claimed, true);
    assert.ok(pickup.save.includes(pickup.id), 'new save contains the point-drop claim');
    await page.evaluate(async raw => restoreSave(JSON.parse(raw)), pickup.save);
    await page.waitForFunction(() => window.eval("zone==='ep1a08' && !loading && !modal"), null, {timeout: 60000});
    const afterReload = await page.evaluate(id => {
      const api = window.__STORYWORLD_PROGRESSION_R71__;
      const before = player.points, drops = room.passivePointDropsR64.filter(d => d.id === id).length;
      const second = api.collectPointDrops();
      return {before, after: player.points, drops, claimed: room.passivePointClaimsR64.includes(id), second};
    }, pickup.id);
    assert.equal(afterReload.drops, 0); assert.equal(afterReload.claimed, true); assert.equal(afterReload.second, 0); assert.equal(afterReload.after, afterReload.before);
    report.checks.push({name: 'native-point-drop-capture-pickup-persistence-flashlight', hospitalAdmission, fixture, visual, flashlight, pickup: {...pickup, save: '[serialized JSON omitted]'}, afterReload});
    assertNoPageErrors(game);
    await closeGame(game);
  }

  // Two browser pages exercise native local coop simulation: host clear and
  // pickup ownership are authoritative; a guest cannot select difficulty or
  // claim drops. This is explicitly not a relay/network integration test.
  {
    const context = await browser.newContext({viewport: {width: 1280, height: 800}, deviceScaleFactor: 1});
    const host = await openGame({context});
    const hospitalAdmission = await seedTrustedStoryHistory(host.page, {throughId: 'ep1a08'});
    await host.page.evaluate(async () => {
      const c = window.__STORYWORLD_COOP_SIM_R62__;
      await c.start({role: 'host', selfId: 'qa-host', members: [{id:'qa-host',nick:'Host',character:'hwando'}, {id:'qa-peer',nick:'Peer',character:'hwando'}]});
    });
    const peerResult = await host.page.evaluate(() => {
      const c = window.__STORYWORLD_COOP_SIM_R62__, actors = c.players();
      const owner = actors.find(p => p.coopIdR62 === 'qa-host'), down = actors.find(p => p.coopIdR62 === 'qa-peer');
      down.hp = 0; down.connectedR62 = true; owner.points = down.points = 0;
      window.__STORYWORLD_PROGRESSION_R71__.openDifficulty('dist00', null, {restore:true,noStory:true,position:{x:15,y:19},layer:'STORY'});
      document.getElementById('r71DifficultyHard').click();
      document.getElementById('r71DifficultyConfirm').click();
      return {mode:c.mode(), count:actors.length, actors:actors.map(p=>({id:p.coopIdR62,hp:p.hp,maxHp:window.__STORYWORLD_HEALTH_R71__.inspect(p).player.maxHp,points:p.points,connected:p.connectedR62})), tier:window.__STORYWORLD_CAMPAIGN_R63R1__?.mode('dist00','STORY')};
    });
    await host.page.waitForFunction(() => window.eval("zone==='dist00' && !loading && !modal"), null, {timeout: 60000});
    assert.equal(peerResult.mode, 'host'); assert.equal(peerResult.count, 2); assert.equal(peerResult.tier, 'hard');
    for (const actor of peerResult.actors) assert.equal(actor.maxHp, 777);
    const clear = await host.page.evaluate(() => {
      const c = window.__STORYWORLD_COOP_SIM_R62__, actors = c.players();
      const before = actors.map(p => p.points);
      window.completeRegion('dist00');
      const once = actors.map(p => p.points);
      const save = c.exportSave();
      window.completeRegion('dist00');
      const repeat = actors.map(p => p.points);
      return {before, once, repeat, savedParticipants:save.participants.map(p=>({id:p.coopIdR62,points:p.points,hp:p.hp})), save};
    });
    assert.deepEqual(clear.once, [7, 7], 'connected host and downed connected peer both receive the exact 1/3/7 hard-clear reward');
    assert.deepEqual(clear.repeat, clear.once); assert.equal(clear.savedParticipants.length, 2);
    assert.equal(clear.savedParticipants.find(p=>p.id==='qa-peer').hp, 0, 'the connected peer is downed at the saved first clear');

    const firstHit = await host.page.evaluate(() => {
      const c=window.__STORYWORLD_COOP_SIM_R62__,health=window.__STORYWORLD_HEALTH_R71__,actors=c.players();
      const owner=actors.find(p=>p.coopIdR62==='qa-host'),peer=actors.find(p=>p.coopIdR62==='qa-peer'),r=room;
      owner.hp=peer.hp=777;owner.invincible=peer.invincible=0;owner.guard=peer.guard=false;
      owner.x=7;owner.y=7;peer.x=18;peer.y=19;
      const enemy=r.enemies.find(e=>e.hp>0&&!e.boss&&!e.midboss&&e.type!=='ranged'&&!e.coopReplicaR62);
      if(!enemy)throw new Error('No native melee enemy is available for the coop hit fixture');
      r.enemies=[enemy];r.engaged=true;enemy.x=peer.x+.6;enemy.y=peer.y;enemy.spawnState='active';enemy.tell=.1;enemy.aim={x:peer.x,y:peer.y,angle:Math.PI};enemy.cd=20;
      const beforeOwner=owner.hp,beforePeer=peer.hp,rawDamage=enemy.damage;
      tickEnemies(.2);
      const state=health.inspect(peer),pressure=window.__STORYWORLD_HOSPITAL_PRESSURE_R54__?.incomingMultiplier(enemy)??1;
      const difficulty=window.__STORYWORLD_CAMPAIGN_R63R1__?.incomingDamageFactor?.(enemy)??1;
      const ward=window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('ward',peer)||0;
      const expected=health.normalizeIncoming(rawDamage,peer,enemy)*difficulty*.65*pressure*(1-.06*ward)*.2;
      const visuals=effects.filter(e=>e.r71BleedVisualR71===true).map(e=>({owner:e.r71ActorId,atlas:e.r52Blood===true,life:e.life,age:e.age}));
      const commands=window.__STORYWORLD_PHASE1__.captureVisual(),bloodCommands=commands.filter(c=>c.owner?.id==='blood-contact-r52'&&c.kind==='image'&&String(c.sourcePath).includes('medical-impacts-r49.png'));
      const expectedScreen=project(peer.x,peer.y-.15);expectedScreen.y-=actorHeight()*.40;
      const bloodCenters=bloodCommands.map(c=>({x:c.points.reduce((n,p)=>n+p[0],0)/c.points.length,y:c.points.reduce((n,p)=>n+p[1],0)/c.points.length,owner:c.owner}));
      const bleedDraws=health.inspect(peer).bleedVisuals.filter(v=>v.actorId==='qa-peer');
      enemy.tell=0;enemy.cd=999;
      return{beforeOwner,afterOwner:owner.hp,beforePeer,afterPeer:peer.hp,rawDamage,expected,enemyId:enemy.id,native:r.enemies.includes(enemy),state,status:health.statusRows(peer),visuals,bloodCenters,bleedDraws,expectedImpact:{x:peer.x,y:peer.y-.15},expectedScreen};
    });
    assert.equal(firstHit.native,true);
    assert.equal(firstHit.afterOwner,firstHit.beforeOwner,'host must not receive the peer-targeted native attack');
    assert.ok(firstHit.afterPeer<firstHit.beforePeer&&firstHit.afterPeer>0,'peer takes native damage instead of blanket invulnerability');
    assert.ok(Math.abs((firstHit.beforePeer-firstHit.afterPeer)-firstHit.expected)<.1,'peer damage follows normalization and existing defense/difficulty factors');
    assert.equal(firstHit.state.player.maxHp,777);assert.equal(firstHit.state.bleeding.active,true);
    assert.equal(firstHit.state.bleeding.ownerId,firstHit.enemyId);assert.equal(firstHit.state.dotAdded,false);
    assert.ok(firstHit.status.some(row=>row.key==='health-r71-bleed'));
    assert.ok(firstHit.visuals.some(row=>row.owner==='qa-peer'&&row.atlas&&row.life>0));
    assert.ok(firstHit.visuals.every(row=>row.owner!=='qa-host'),'bleed imagery is peer scoped');
    assert.ok(firstHit.bloodCenters.length>0,'Three capture must include the admitted peer blood image');
    assert.ok(firstHit.bloodCenters.some(q=>Math.hypot(q.x-firstHit.expectedScreen.x,q.y-firstHit.expectedScreen.y)<3),'captured blood pixels are positioned at the peer actor, not the host facade');
    assert.ok(firstHit.bleedDraws.some(row=>row.world?.x===firstHit.expectedImpact.x&&row.world?.y===firstHit.expectedImpact.y), 'R71 diagnostic records the actual peer impact world coordinate');
    assert.ok(firstHit.bleedDraws.some(row=>row.drawActorId==='qa-peer'&&row.drawCount>0), 'R52 atlas paint is scoped to the actual peer actor');
    assert.ok(firstHit.bleedDraws.some(row=>row.screen&&Math.hypot(row.screen.x-firstHit.expectedScreen.x,row.screen.y-firstHit.expectedScreen.y)<.01), 'R71 diagnostic screen position matches the captured peer blood image');

    const saveRoundTrip = await host.page.evaluate(async () => {
      const c=window.__STORYWORLD_COOP_SIM_R62__,health=window.__STORYWORLD_HEALTH_R71__,peer=c.players().find(p=>p.coopIdR62==='qa-peer');
      const save=c.exportSave(),participant=save.participants.find(p=>p.coopIdR62==='qa-peer');
      const before={hp:peer.hp,bleed:participant.healthBleedR71,applied:participant.healthR71Applied,points:peer.points};
      await c.importSave(save);const epoch=c.inspect().epoch;c.receive({type:'all_loaded',phase:'running',epoch});
      const restored=c.players().find(p=>p.coopIdR62==='qa-peer'),state=health.inspect(restored),beforeRepeat=restored.points;
      window.completeRegion('dist00');
      return{before,restored:{hp:restored.hp,applied:restored.healthR71Applied,bleeding:state.bleeding,status:health.statusRows(restored)},beforeRepeat,afterRepeat:restored.points,mode:c.mode(),epoch};
    });
    assert.equal(saveRoundTrip.before.applied,true,'co-op save includes R71 health marker');
    assert.equal(saveRoundTrip.before.bleed?.ownerId,firstHit.enemyId,'co-op save includes peer bleed state');
    assert.equal(saveRoundTrip.restored.applied,true);assert.equal(saveRoundTrip.restored.bleeding.active,true,'co-op import restores peer bleed');
    assert.ok(saveRoundTrip.restored.status.some(row=>row.key==='health-r71-bleed'));
    assert.equal(saveRoundTrip.afterRepeat,saveRoundTrip.beforeRepeat,'imported first-clear state does not award again');
    const coopSnapshot=await host.page.evaluate(()=>window.__STORYWORLD_COOP_SIM_R62__.snapshot());
    const snapPeer=coopSnapshot.players.find(p=>p.coopIdR62==='qa-peer');
    assert.equal(snapPeer.healthR71Applied,true);assert.equal(snapPeer.healthBleedR71?.ownerId,firstHit.enemyId,'host snapshot carries peer bleed state');

    const guest=await openGame({context});
    const guestSnapshot=await guest.page.evaluate(async snap=>{
      const c=window.__STORYWORLD_COOP_SIM_R62__;
      await c.start({role:'guest',selfId:'qa-guest',hostId:'qa-host',members:[{id:'qa-host',nick:'Host',character:'hwando'},{id:'qa-peer',nick:'Peer',character:'hwando'},{id:'qa-guest',nick:'Guest',character:'hwando'}]});
      const transitioned=await c.receive({type:'transition',epoch:snap.epoch,regionId:snap.zone,layer:snap.layer});
      c.receive({type:'all_loaded',phase:'running',epoch:snap.epoch});const accepted=c.applySnapshot(snap),peer=c.players().find(p=>p.coopIdR62==='qa-peer'),health=window.__STORYWORLD_HEALTH_R71__;
      const commands=window.__STORYWORLD_PHASE1__.captureVisual(),bloodCommands=commands.filter(command=>command.owner?.id==='blood-contact-r52'&&command.kind==='image'&&String(command.sourcePath).includes('medical-impacts-r49.png'));
      const expectedScreen=project(peer.x,peer.y-.15);expectedScreen.y-=actorHeight()*.40;
      const bloodCenters=bloodCommands.map(command=>({x:command.points.reduce((n,p)=>n+p[0],0)/command.points.length,y:command.points.reduce((n,p)=>n+p[1],0)/command.points.length}));
      const bleedDraws=health.inspect(peer).bleedVisuals.filter(row=>row.actorId==='qa-peer');
      return{transitioned,accepted,selfId:'qa-guest',peer:{id:peer.coopIdR62,x:peer.x,y:peer.y,hp:peer.hp,applied:peer.healthR71Applied,bleeding:health.inspect(peer).bleeding,status:health.statusRows(peer)},visuals:effects.filter(e=>e.r71BleedVisualR71===true).map(e=>e.r71ActorId),bleedDraws,bloodCenters,expectedScreen};
    },coopSnapshot);
    assert.equal(guestSnapshot.transitioned,true);assert.equal(guestSnapshot.accepted,true,'guest accepts current host snapshot');
    assert.equal(guestSnapshot.peer.applied,true);assert.equal(guestSnapshot.peer.bleeding.active,true,'bleed survives host→guest snapshot');
    assert.ok(guestSnapshot.peer.status.some(row=>row.key==='health-r71-bleed'));
    assert.ok(guestSnapshot.visuals.includes('qa-peer'),'peer blood imagery is included in guest snapshot');
    assert.notEqual(guestSnapshot.selfId,guestSnapshot.peer.id,'guest snapshot recipient is not the peer owner');
    assert.ok(guestSnapshot.bloodCenters.length>0,'guest Three capture draws the received peer blood atlas');
    assert.ok(guestSnapshot.bloodCenters.some(q=>Math.hypot(q.x-guestSnapshot.expectedScreen.x,q.y-guestSnapshot.expectedScreen.y)<3),'guest captured blood image is positioned at the peer');
    assert.ok(guestSnapshot.bleedDraws.some(row=>row.world?.x===guestSnapshot.peer.x&&row.world?.y===guestSnapshot.peer.y-.15),'guest diagnostics retain the peer impact world coordinate');
    assert.ok(guestSnapshot.bleedDraws.some(row=>row.drawActorId==='qa-peer'&&row.drawCount>0),'guest capture resolves the received effect owner to qa-peer, not its own player');
    assert.ok(guestSnapshot.bleedDraws.some(row=>row.screen&&Math.hypot(row.screen.x-guestSnapshot.expectedScreen.x,row.screen.y-guestSnapshot.expectedScreen.y)<.01),'guest peer draw screen coordinate agrees with its captured blood image');

    const deathAndRevive=await host.page.evaluate(async enemyId=>{
      const c=window.__STORYWORLD_COOP_SIM_R62__,health=window.__STORYWORLD_HEALTH_R71__,actors=c.players();
      const owner=actors.find(p=>p.coopIdR62==='qa-host'),peer=actors.find(p=>p.coopIdR62==='qa-peer'),r=room;
      const enemy=r.enemies.find(e=>e.id===enemyId);if(!enemy)throw new Error('Native attacker missing before lethal hit');
      enemy.id+=':lethal';r.coopDefeatedR62=[...(r.coopDefeatedR62||[]),enemy.id+':coop:1'];r.enemies=[enemy];
      owner.hp=777;peer.hp=2;owner.invincible=peer.invincible=0;owner.x=8;owner.y=8;peer.x=18;peer.y=19;
      enemy.x=peer.x+.6;enemy.y=peer.y;enemy.tell=.01;enemy.aim={x:peer.x,y:peer.y,angle:Math.PI};enemy.cd=20;tickEnemies(.02);
      const down={hp:peer.hp,bleeding:health.inspect(peer).bleeding,visuals:effects.filter(e=>e.r71BleedVisualR71&&e.r71ActorId==='qa-peer'&&e.age<e.life).length};
      if(peer.hp!==0||down.bleeding.active)throw new Error('Lethal enemy contact must down the peer and clear bleed');
      r.enemies=[];owner.x=peer.x+.3;owner.y=peer.y;owner.pendingInputR62={...(owner.pendingInputR62||{}),interact:true};c.tick(.2);
      const revived={hp:peer.hp,maxHp:health.inspect(peer).player.maxHp,bleeding:health.inspect(peer).bleeding,status:health.statusRows(peer),invincible:peer.invincible};
      return{down,revived,reviveEvents:c.inspect().history.filter(row=>row.type==='player-revived'&&row.playerId==='qa-peer').length};
    },firstHit.enemyId);
    assert.equal(deathAndRevive.down.hp,0);assert.equal(deathAndRevive.down.bleeding.active,false,'death clears peer bleed');
    assert.ok(deathAndRevive.down.visuals<=1,'lethal splash is bounded');
    assert.ok(deathAndRevive.revived.hp>0&&deathAndRevive.revived.hp<777,'native coop revive restores partial balanced HP');
    assert.equal(deathAndRevive.revived.maxHp,777);assert.equal(deathAndRevive.revived.bleeding.active,false,'revive clears stale bleed');
    assert.equal(deathAndRevive.reviveEvents,1);

    await host.page.evaluate(()=>{
      const api=window.__STORYWORLD_PROGRESSION_R71__;
      api.openDifficulty('ep1a08',null,{restore:true,noStory:true,position:{x:27,y:27},layer:'STORY'});
      document.getElementById('r71DifficultyHard').click();document.getElementById('r71DifficultyConfirm').click();
    });
    await host.page.waitForFunction(()=>window.eval("zone==='ep1a08' && !loading && !modal"),null,{timeout:60000});
    const hospitalDrop=await host.page.evaluate(()=>{
      const c=window.__STORYWORLD_COOP_SIM_R62__,api=window.__STORYWORLD_PROGRESSION_R71__,epoch=c.inspect().epoch;
      c.receive({type:'all_loaded',phase:'running',epoch});const r=room,b=r.exploration?.bounds;
      if(!r.exploration?.expanded||!b||b[2]<=32||b[3]<=32)throw new Error('Expanded hospital bounds unavailable in coop');
      let target=null;for(let x=Math.max(33,Math.ceil(b[0]));x<b[2]-.5&&!target;x+=.5)for(let y=Math.max(1,Math.ceil(b[1]));y<b[3]-.5&&!target;y+=.5)if(!blocked(x,y,.2,r))target={x,y};
      if(!target)throw new Error('No safe expanded hospital floor point');
      const enemy=r.enemies.find(e=>e.hp>0&&!e.coopReplicaR62);if(!enemy)throw new Error('No native hospital enemy');
      enemy.x=target.x;enemy.y=target.y;const recorded=api.recordPointDrop(enemy,r,()=>0);api.syncPointDrops(r);
      if(!recorded?.success||!(recorded.x>32||recorded.y>32))throw new Error('Host drop did not keep expanded coordinates');
      const snapshot=c.snapshot(),save=c.exportSave(),world=Object.values(save.coopWorld).find(row=>row.pointDrops?.drops?.some(d=>d.id===recorded.id));
      return{epoch:c.inspect().epoch,drop:recorded,roomSnapshot:snapshot.room.passivePointDropsR64?.find(d=>d.id===recorded.id),saved:world?.pointDrops?.drops?.find(d=>d.id===recorded.id),snapshot};
    });
    assert.ok(hospitalDrop.drop.x>32||hospitalDrop.drop.y>32);
    assert.ok(hospitalDrop.roomSnapshot&&(hospitalDrop.roomSnapshot.x>32||hospitalDrop.roomSnapshot.y>32),'host snapshot preserves expanded point coordinates');
    assert.ok(hospitalDrop.saved&&(hospitalDrop.saved.x>32||hospitalDrop.saved.y>32),'co-op export preserves expanded point coordinates');
    const guestHospital=await guest.page.evaluate(async ({snap,dropId})=>{
      const c=window.__STORYWORLD_COOP_SIM_R62__,api=window.__STORYWORLD_PROGRESSION_R71__;
      const transitioned=await c.receive({type:'transition',epoch:snap.epoch,regionId:snap.zone,layer:snap.layer});
      c.receive({type:'all_loaded',phase:'running',epoch:snap.epoch});const accepted=c.applySnapshot(snap),drop=room.passivePointDropsR64.find(d=>d.id===dropId),before=player.points;
      if(drop){player.x=drop.x;player.y=drop.y;}const collect=api.collectPointDrops(),opened=api.openDifficulty('dist01',null,{restore:true,noStory:true,layer:'STORY'}),confirmed=api.confirmDifficulty();
      return{transitioned,accepted,zone,roomId:room.id,drop,collect,before,after:player.points,count:room.passivePointDropsR64.filter(d=>d.id===dropId).length,opened,confirmed,canApply:window.__STORYWORLD_HEALTH_R71__.inspect(player).authority.canApply};
    },{snap:hospitalDrop.snapshot,dropId:hospitalDrop.drop.id});
    assert.equal(guestHospital.transitioned,true);assert.equal(guestHospital.accepted,true);
    assert.equal(guestHospital.zone,'ep1a08');assert.equal(guestHospital.roomId,'ep1a08');
    assert.ok(guestHospital.drop&&(guestHospital.drop.x>32||guestHospital.drop.y>32),'guest snapshot preserves expanded point coordinates');
    assert.equal(guestHospital.collect,0);assert.equal(guestHospital.after,guestHospital.before);assert.equal(guestHospital.count,1);
    assert.equal(guestHospital.opened,false);assert.equal(guestHospital.confirmed,false);assert.equal(guestHospital.canApply,false);
    const guestState=await guest.page.evaluate(()=>({mode:window.__STORYWORLD_COOP_SIM_R62__.mode(),host:window.__STORYWORLD_COOP_SIM_R62__.isHost(),roomId:room.id,currentZone:zone,canApply:window.__STORYWORLD_HEALTH_R71__.inspect(player).authority.canApply}));
    assert.equal(guestState.mode,'guest');assert.equal(guestState.host,false);assert.equal(guestState.roomId,guestState.currentZone);
    assert.equal(guestState.canApply,false,'guest health presentation is not authoritative');
    report.checks.push({name:'two-page-local-coop-health-rewards-expanded-drops',hospitalAdmission,host:peerResult,clear:{...clear,save:'[coop save omitted]'},firstHit,saveRoundTrip,guestSnapshot:{transitioned:guestSnapshot.transitioned,accepted:guestSnapshot.accepted,peer:guestSnapshot.peer},deathAndRevive,hospitalDrop:{...hospitalDrop,snapshot:'[snapshot omitted]'},guestHospital,guest:guestState});
    report.actualRelay = false;
    assertNoPageErrors(host); assertNoPageErrors(guest);
    await closeGame(host); await closeGame(guest); await context.close();
  }

  report.status = 'passed';
  report.caveats = [
    'Headless sandboxed Chromium and emulated mobile; not a physical phone, GPU, or relay test.',
    'Browser screenshots and command capture verify scene/UI records, not final display pixels on a physical GPU.',
  ];
} catch (error) {
  report.status = 'failed';
  report.error = error.stack || String(error);
  throw error;
} finally {
  await saveReport();
  console.log('R71_BROWSER', JSON.stringify(report));
  await browser.close();
}
