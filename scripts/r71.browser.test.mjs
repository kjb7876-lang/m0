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
  caseResults: [],
  caseFailureDiagnostics: [],
  status: 'running',
};
const saveReport = () => fs.writeFile(path.join(OUT, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
let activeCase = null;
const closedContexts = new WeakSet();

async function closeTrackedContext(context) {
  if (!context || closedContexts.has(context)) return;
  closedContexts.add(context);
  await context.close();
}

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
  if (activeCase) activeCase.contexts.add(context);
  const page = await context.newPage();
  const errors = [];
  if (activeCase) {
    activeCase.pages.set(page, errors);
  }
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
  if (game?.ownContext) await closeTrackedContext(game.context);
  else if (game?.page && !game.page.isClosed()) await game.page.close();
}

async function runCase(name, fn) {
  const state = {name, contexts: new Set(), pages: new Map()};
  activeCase = state;
  const startedAt = Date.now();
  let failure = null;
  try { await fn(); } catch (error) { failure = error; }

  if (failure) {
    const pages = [];
    let pageIndex = 0;
    for (const [page, pageErrors] of state.pages) {
      let runtime = null;
      try {
        if (!page.isClosed()) runtime = await page.evaluate(() => {
          const safe = fn => { try { return fn(); } catch (error) { return {error: String(error)}; } };
          const panel = document.getElementById('panel'), box = document.getElementById('modal');
          const profile = safe(() => window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.());
          const health = safe(() => typeof player === 'undefined' ? null : window.__STORYWORLD_HEALTH_R71__?.inspect?.(player));
          const progression = safe(() => window.__STORYWORLD_PROGRESSION_R71__?.inspect?.());
          const coop = safe(() => window.__STORYWORLD_COOP_SIM_R62__?.inspect?.());
          return {
            zone: typeof zone === 'undefined' ? null : zone, layer: typeof layer === 'undefined' ? null : layer,
            room: typeof room === 'undefined' ? null : {id: room?.id, layer: room?.layer, engaged: room?.engaged, cleared: room?.cleared, sceneCheckpoint: room?.sceneCheckpoint || null},
            loading: typeof loading === 'undefined' ? null : loading, modal: typeof modal === 'undefined' ? null : modal,
            story: {current: typeof storyScene === 'undefined' ? null : storyScene && {key: storyScene.key, id: storyScene.id, part: storyScene.part}, queued: typeof storyQueue === 'undefined' ? null : storyQueue?.length, readCount: typeof readScenes === 'undefined' ? null : readScenes?.size},
            panel: panel ? {hidden: box?.classList.contains('hidden'), text: panel.innerText?.slice(0,1200), storyNext: !!document.getElementById('storyNext'), upClose: !!document.getElementById('upClose')} : null,
            profile, health, progression, coop, events: safe(() => typeof SW3 === 'undefined' ? null : SW3.events.slice(-16)),
            fatal: document.getElementById('fatal')?.textContent?.slice(0,1200) || null,
          };
        });
      } catch (diagnosticError) { runtime = {diagnosticError: diagnosticError.stack || String(diagnosticError)}; }
      let screenshot = null, screenshotError = null;
      try {
        if (!page.isClosed()) {
          screenshot = path.join(OUT, `case-failure-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}-${pageIndex}.png`);
          await page.screenshot({path: screenshot, fullPage: true, timeout: 15000});
          report.screenshots.push(path.basename(screenshot));
        }
      } catch (error) { screenshotError = error.message; screenshot = null; }
      pages.push({pageIndex, runtimeErrors: [...pageErrors], runtime, screenshot, screenshotError});
      pageIndex++;
    }
    report.caseFailureDiagnostics.push({name, error: failure.stack || String(failure), pages});
  }

  const cleanupErrors = [];
  for (const context of state.contexts) {
    try { await closeTrackedContext(context); } catch (error) { cleanupErrors.push(error.stack || String(error)); }
  }
  if (!failure && cleanupErrors.length) failure = new Error(`Case ${name} context cleanup failed: ${cleanupErrors.join('\n')}`);
  activeCase = null;
  const result = {name, status: failure ? 'failed' : 'passed', durationMs: Date.now() - startedAt, error: failure ? failure.stack || String(failure) : null, cleanupErrors};
  report.caseResults.push(result);
  console.log('R71_CASE', JSON.stringify(result));
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

async function restoreNativeSave(page, save, label) {
  assert.ok(save?.zone && save?.layer, `${label}: native save must include its location`);
  const upgradeClose = page.locator('#upClose');
  if (await upgradeClose.isVisible().catch(() => false)) await upgradeClose.click();
  const returned = await page.evaluate(async raw => {
    const snapshot = () => {
      const safe = fn => { try { return fn(); } catch (error) { return {error: String(error)}; } };
      const profile = safe(() => window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.());
      const health = safe(() => typeof player === 'undefined' ? null : window.__STORYWORLD_HEALTH_R71__?.inspect?.(player));
      const progression = safe(() => window.__STORYWORLD_PROGRESSION_R71__?.inspect?.());
      return {
        zone: typeof zone === 'undefined' ? null : zone,
        layer: typeof layer === 'undefined' ? null : layer,
        room: typeof room === 'undefined' ? null : {id: room?.id, layer: room?.layer, engaged: room?.engaged, cleared: room?.cleared},
        loading: typeof loading === 'undefined' ? null : loading,
        modal: typeof modal === 'undefined' ? null : modal,
        scene: typeof storyScene === 'undefined' ? null : storyScene && {key: storyScene.key, id: storyScene.id, part: storyScene.part},
        queuedScenes: typeof storyQueue === 'undefined' ? null : storyQueue?.length,
        readSceneCount: typeof readScenes === 'undefined' ? null : readScenes?.size,
        storyNextVisible: !!document.getElementById('storyNext') && getComputedStyle(document.getElementById('storyNext')).display !== 'none',
        upgradeCloseVisible: !!document.getElementById('upClose') && getComputedStyle(document.getElementById('upClose')).display !== 'none',
        profile: profile && {stage: profile.stage, busy: profile.busy, error: profile.error},
        health: health && health.player,
        progression: progression && {revision: progression.revision, tier: progression.tier},
        events: safe(() => typeof SW3 === 'undefined' ? null : SW3.events.slice(-12).map(event => ({at:event.at,type:event.type,zone:event.zone,layer:event.layer,part:event.part,key:event.key,playerId:event.playerId,reason:event.reason}))),
      };
    };
    try {
      const result = await restoreSave(raw);
      return {ok: true, result: typeof result === 'boolean' || typeof result === 'string' ? result : null, state: snapshot()};
    } catch (error) {
      return {ok: false, error: error?.stack || String(error), state: snapshot()};
    }
  }, save);
  console.log('R71_NATIVE_RESTORE_RETURN', JSON.stringify({label, requested: {zone: save.zone, layer: save.layer}, ...returned}));
  if (!returned.ok) throw new Error(`${label}: native restoreSave rejected: ${returned.error}`);

  const acknowledged = [];
  for (let step = 0; step < 32; step++) {
    const state = await page.evaluate(() => ({
      zone: typeof zone === 'undefined' ? null : zone,
      loading: typeof loading === 'undefined' ? null : loading,
      modal: typeof modal === 'undefined' ? null : modal,
      scene: typeof storyScene === 'undefined' ? null : storyScene && {key: storyScene.key, id: storyScene.id, part: storyScene.part},
      nextVisible: !!document.getElementById('storyNext') && getComputedStyle(document.getElementById('storyNext')).display !== 'none',
    }));
    if (!state.modal) break;
    if (state.zone !== save.zone || state.scene?.id !== save.zone || state.scene?.part !== 'pre' || !state.nextVisible) {
      throw new Error(`${label}: unexpected modal after native restore; only a matching current-map pre-scene may be acknowledged: ${JSON.stringify(state)}`);
    }
    acknowledged.push(state.scene.key);
    await page.locator('#storyNext').click();
    await page.waitForFunction(({key}) => !modal || storyScene?.key !== key, {key: state.scene.key}, {timeout: 10000});
  }
  const finalState = await page.evaluate(() => ({
    zone: typeof zone === 'undefined' ? null : zone,
    layer: typeof layer === 'undefined' ? null : layer,
    room: typeof room === 'undefined' ? null : {id: room?.id, layer: room?.layer, engaged: room?.engaged, cleared: room?.cleared},
    loading: typeof loading === 'undefined' ? null : loading,
    modal: typeof modal === 'undefined' ? null : modal,
    scene: typeof storyScene === 'undefined' ? null : storyScene && {key: storyScene.key, id: storyScene.id, part: storyScene.part},
    readSceneCount: typeof readScenes === 'undefined' ? null : readScenes?.size,
    profile: window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.() || null,
    events: typeof SW3 === 'undefined' ? null : SW3.events.slice(-16).map(event => ({at:event.at,type:event.type,zone:event.zone,layer:event.layer,part:event.part,key:event.key,playerId:event.playerId,reason:event.reason})),
  }));
  console.log('R71_NATIVE_RESTORE_FINAL', JSON.stringify({label, requested: {zone: save.zone, layer: save.layer}, acknowledged, state: finalState}));
  try {
    await page.waitForFunction(({zone: expectedZone, layer: expectedLayer}) => window.eval(`zone===${JSON.stringify(expectedZone)} && layer===${JSON.stringify(expectedLayer)} && !loading && !modal`),
      {zone: save.zone, layer: save.layer}, {timeout: 60000});
  } catch (error) {
    throw new Error(`${label}: native restore did not settle: ${JSON.stringify(finalState)}\n${error.stack || error}`);
  }
  assert.equal(finalState.zone, save.zone, `${label}: native restore returns to the saved map`);
  assert.equal(finalState.layer, save.layer, `${label}: native restore returns to the saved layer`);
  assert.equal(finalState.loading, false, `${label}: native restore finishes loading`);
  assert.equal(finalState.modal, false, `${label}: only expected pre-scenes were acknowledged`);
  return {returned, acknowledged, finalState};
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
  await runCase('native-difficulty-confirm-and-first-clear', async () => {
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
  });

  // Exercise real touch input and both mobile orientations on a mobile
  // context. The options and actions must remain inside the visual viewport.
  await runCase('mobile-touch-difficulty-portrait-landscape', async () => {
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
  });

  // Verify health balance through real enemy hit handling, a native upgrade,
  // R70 save migration, restore and the native return-to-hub respawn route.
  await runCase('health-cap-bosses-hit-save-upgrade-respawn', async () => {
    const base = await openGame({variant: 'baseline'});
    await enterRegion(base.page, 'dist00');
    const baselineHealth = await base.page.evaluate(() => ({
      max: maxHP(),
      bosses: (room.enemies || []).filter(e => e.boss || e.midboss || e.persona || e.cosmic || e.trial || e.cosmicGuardianR63)
        .map(e => ({id: e.id, maxHp: e.maxHp, hp: e.hp})),
    }));
    assert.ok(baselineHealth.bosses.length > 0, 'R70 dist00 fixture exposes its native midboss for comparison');
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
      const state = health.inspect(p);
      return {max: maxHP(), inspect: state.player, norm: health.normalization(p), bosses: state.bosses};
    });
    console.log('R71_HEALTH_INITIAL', JSON.stringify({
      baselineHealth,
      candidate: {
        playerMaxHp: initial.max,
        bosses: initial.bosses.map(row => ({
          id: row.id, maxHp: row.visibleMaxHp, base: row.baseMaxHp, factor: row.factor,
          canonicalMaxHp: row.canonicalMaxHp, visibleMaxHp: row.visibleMaxHp,
        })),
      },
    }));
    assert.equal(initial.max, 777, 'native PLAYER maxHP must be exactly 777');
    assert.equal(initial.inspect.maxHp, 777);
    assert.equal(initial.inspect.healthR71Applied, true);
    assert.ok(initial.bosses.length > 0, 'candidate dist00 fixture exposes its native midboss');
    const baselineBossById = new Map(baselineHealth.bosses.map(row => [row.id, row]));
    const suffixFor = canonical => Math.max(0, Math.round((canonical - 666) / 1000)) * 1000 + 666;
    for (const boss of initial.bosses) {
      const before = baselineBossById.get(boss.id);
      assert.ok(before, `R71 dist00 actor ${boss.id} has a matching R70 baseline`);
      assert.ok(Number.isFinite(boss.canonicalMaxHp) && boss.canonicalMaxHp > 0);
      assert.ok(Number.isSafeInteger(boss.visibleMaxHp));
      assert.equal(boss.canonicalMaxHp, before.maxHp, `${boss.id} canonical HP matches the native R70 maximum`);
      assert.equal(boss.visibleMaxHp % 1000, 666, `${boss.id} candidate midboss max HP ends in 666`);
      assert.equal(boss.visibleMaxHp, suffixFor(boss.canonicalMaxHp), `${boss.id} visible HP is the suffix transform of its canonical maximum`);
      assert.equal(boss.visibleMaxHp, suffixFor(before.maxHp), `${boss.id} receives the suffix transform from its R70 max HP`);
    }

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
        assert.ok(Number.isFinite(boss.canonicalMaxHp) && boss.canonicalMaxHp > 0,
          `${row.id}/${boss.id} canonical max HP must be finite and positive`);
        const expectedVisibleMaxHp = Math.max(0, Math.round((boss.canonicalMaxHp - 666) / 1000)) * 1000 + 666;
        assert.equal(boss.maxHp, expectedVisibleMaxHp,
          `${row.id}/${boss.id} visible max HP must apply the canonical suffix transform`);
        assert.equal(boss.visibleMaxHp, boss.maxHp);
        assert.ok(boss.hp > 0 && boss.hp <= boss.maxHp);
      }
    }
    await enterRegion(page, 'dist00', {layer: 'STORY'});

    const hit = await page.evaluate(() => {
      auto = false;
      const originalEnemies = room.enemies, originalEngaged = room.engaged;
      room.engaged = true;
      const p = player;
      p.hp = 700; p.invincible = 0; p.invReason = ''; p.guard = false; p.parry = 0;
      const fields = window.__STORYWORLD_FIELDS_R61__;
      const gap = .55;
      let enemy = null, spot = null;
      for (const candidate of room.enemies) {
        if (!(candidate.hp > 0 && !candidate.boss && !candidate.midboss && !candidate.persona && !candidate.cosmic && !candidate.trial && candidate.type !== 'ranged' && candidate.ai === 'melee' && !fields?.activeAction?.(candidate))) continue;
        const homeX=Number.isFinite(candidate.homeX)?candidate.homeX:candidate.x,homeY=Number.isFinite(candidate.homeY)?candidate.homeY:candidate.y;
        for (const radius of [0,.5,1,1.5,2]) {
          for (let i=0;i<16&&!spot;i++) {
            const angle=i*Math.PI/8,px=homeX+Math.cos(angle)*radius,py=homeY+Math.sin(angle)*radius,ex=px+gap,ey=py;
            if (!blocked(px,py,.23,room) && !blocked(ex,ey,.29,room) && clearLine({x:ex,y:ey},{x:px,y:py-.15},room)) {
              enemy=candidate;spot={x:px,y:py,ex,ey,homeX,homeY,homeDistance:Math.hypot(px-homeX,py-homeY)};
            }
          }
          if (spot) break;
        }
        if (spot) break;
      }
      if (!enemy) throw new Error('No native melee enemy is available for a real hit fixture');
      const originalEnemy = {...enemy, aim: enemy.aim && {...enemy.aim}};
      const motionState = fields?.state?.(enemy), originalMotionNext = motionState?.next;
      room.enemies = [enemy];
      if (spot) { p.x = spot.x; p.y = spot.y; enemy.x = spot.ex; enemy.y = spot.ey; cameraTick(1); }
      enemy.spawnState = 'active'; enemy.visible = true; enemy.deadRecorded = false;
      enemy.rest = 0; enemy.attack = null; enemy.rangedWindup = 0; enemy.cd = 0; enemy.graceUntil = time - 1;
      enemy.storyAttackUntil5 = 0; enemy.storyPatternCooldownUntil5 = 0; enemy.personaCooldownUntil150 = 0;
      enemy.invulnerableUntil = 0; enemy.r61Action = null; enemy.r61BusyUntil = 0;
      if (motionState) motionState.next = time + 120; // isolate the native melee lane from an unrelated R61 field cooldown.
      if (typeof tickEnemies !== 'function' || !enemy.combatProfile?.attackShape) throw new Error('Native enemy AI or attack geometry is unavailable');
      const nativeAdmissionBefore = {lineOfSight:!!spot&&clearLine({x:spot.ex,y:spot.ey},p),nativeCanPrepare:!!window.__STORYWORLD_HOSPITAL_MOTION_R53__?.canPrepare?.(enemy,'melee'),closeRange:window.__STORYWORLD_SCALE_MELEE_R61__?.closeRange?.(enemy)??null,closeDistance:spot?Math.hypot(spot.ex-p.x,spot.ey-.15-p.y):null,closeLine:!!spot&&clearLine({x:spot.ex,y:spot.ey},{x:p.x,y:p.y-.15},room)};
      const base = hurt;
      const admitted = [];
      hurt = function(value, source) {
        const before = p.hp, result = base.apply(this, arguments), after = p.hp;
        admitted.push({result, sourceId: source?.id || null, sourceIsRoomEnemy: source === enemy, value, before, after, attackId: source?.attack?.id || null});
        return result;
      };
      let prepared = null, committed = null, nativeAttackError = null, enemyAtEnd = null, playerAtEnd = null;
      const enemyAtStart = {
        ai: enemy.ai, type: enemy.type, tell: enemy.tell, rest: enemy.rest, cd: enemy.cd, graceUntil: enemy.graceUntil,
        attack: enemy.attack, rangedWindup: enemy.rangedWindup, phase: enemy.phase, phaseAge: enemy.phaseAge,
        phaseStage: enemy.phaseStage, invulnerableUntil: enemy.invulnerableUntil, r61Action: enemy.r61Action,
        hp: enemy.hp, maxHp: enemy.maxHp, damage: enemy.damage, attackShape: enemy.combatProfile?.attackShape,
      };
      try {
        if (spot) {
          tickEnemies(.02);
          prepared = enemy.attack ? {
            id: enemy.attack.id, elapsed: enemy.attack.elapsed, committed: enemy.attack.committed,
            windup: enemy.attack.castWindup150 ?? enemy.attack.shape154?.windup ?? enemy.combatProfile.attackShape.windup,
            shape: enemy.attack.shape154 || enemy.combatProfile.attackShape,
            footprint: enemy.attack.footprint154,
          } : null;
          if (prepared) {
            tickEnemies(Math.max(.03, Number(prepared.windup) + .03));
            committed = {id: enemy.attack?.id || prepared.id, elapsed: enemy.attack?.elapsed ?? null, committed: enemy.attack?.committed === true, lastAttackKind: enemy.lastAttackKind};
          }
        }
      } catch (error) { nativeAttackError = String(error?.stack || error); }
      finally {
        enemyAtEnd = {
          tell: enemy.tell, rest: enemy.rest, cd: enemy.cd, graceUntil: enemy.graceUntil,
          attack: enemy.attack && {id: enemy.attack.id, elapsed: enemy.attack.elapsed, committed: enemy.attack.committed},
          rangedWindup: enemy.rangedWindup, phase: enemy.phase, phaseAge: enemy.phaseAge, phaseStage: enemy.phaseStage,
          invulnerableUntil: enemy.invulnerableUntil, r61Action: enemy.r61Action && {kind: enemy.r61Action.kind, endAt: enemy.r61Action.endAt},
          hp: enemy.hp, maxHp: enemy.maxHp, damage: enemy.damage,
        };
        playerAtEnd = {hp: p.hp, invincible: p.invincible, invReason: p.invReason, guard: p.guard, parry: p.parry, shield: p.shield,
          attackCD: p.attackCD, position: {x: p.x, y: p.y}};
        hurt = base;
        Object.assign(enemy, originalEnemy);
        if (motionState && Number.isFinite(originalMotionNext)) motionState.next = originalMotionNext;
        room.enemies = originalEnemies;
        room.engaged = originalEngaged;
      }
      const health = window.__STORYWORLD_HEALTH_R71__;
      const rows = health.statusRows(p);
      const state = health.inspect(p);
      const native = {
        observed: admitted.find(row => row.sourceIsRoomEnemy && row.result === 'hit') || admitted.at(-1) || null,
        admitted, prepared, committed, nativeAttackError, spot, enemyId: enemy.id, enemyAtStart, enemyAtEnd,
        admission: {enemyDistance:spot?Math.hypot(spot.ex-p.x,spot.ey-p.y):null,homeDistance:Math.hypot(p.x-(Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x),p.y-(Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y)),home:{x:enemy.homeX,y:enemy.homeY},explorationGroup:enemy.explorationGroup||null,explorationLeash:enemy.explorationLeash??null,explorationLimit:7.15,aggro:enemy.combatProfile?.aggro??null,attackRange:enemy.combatProfile?.attackShape?.range??null,...nativeAdmissionBefore},
        playerAtEnd, player: {hp: p.hp, invincible: p.invincible, invReason: p.invReason, guard: p.guard, parry: p.parry, shield: p.shield,
          attackCD: p.attackCD, position: {x: p.x, y: p.y}, distance: spot ? Math.hypot(spot.ex-p.x, spot.ey-p.y) : null},
        room: {id: room.id, layer: room.layer, engaged: room.engaged, loading, modal},
        fields: fields?.inspect?.() || null,
      };
      return {observed: native.observed, native, state, rows, visuals: effects.filter(e => e.r71BleedVisualR71 === true).map(e => ({id: e.id, actor: e.r71ActorId, atlas: e.r52Blood === true, life: e.life, age: e.age}))};
    });
    console.log('R71_NATIVE_HIT', JSON.stringify(hit.native));
    assert.ok(hit.native.spot?.homeDistance<=2,'native hit fixture stages the player near the actor’s preserved authored home');
    assert.ok(hit.native.admission.enemyDistance<=hit.native.admission.aggro,'staged native target remains inside the enemy aggro radius');
    assert.ok(hit.native.admission.enemyDistance<=hit.native.admission.attackRange+.15,'staged native target remains inside the actual melee preparation range');
    assert.ok(!hit.native.admission.explorationGroup||(hit.native.admission.enemyDistance<=hit.native.admission.explorationLimit&&hit.native.admission.homeDistance<=hit.native.admission.explorationLeash),'staged patrol remains inside both native exploration leash guards');
    assert.equal(hit.native.admission.lineOfSight,true,'staged native attack retains clear line of sight');
    assert.equal(hit.native.admission.nativeCanPrepare,true,'native presentation admission must allow the actual melee preparation');
    assert.ok(hit.native.admission.closeDistance<=hit.native.admission.closeRange&&hit.native.admission.closeLine,'the native close-contact preparation guard admits the staged target');
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
    if (await page.locator('#upClose').isVisible().catch(() => false)) await page.locator('#upClose').click();

    const readBossHealth = () => page.evaluate(() => {
      const healthRows = window.__STORYWORLD_HEALTH_R71__.inspect(player).bosses;
      const actors = room.enemies || [];
      const bosses = healthRows.map(row => {
        const actor = actors.find(e => e.id === row.id);
        return {
          ...row,
          maxHp: actor?.maxHp,
          hp: actor?.hp,
          hpFraction: actor?.maxHp > 0 ? actor.hp / actor.maxHp : null,
          difficultyBaseHpR63: actor?.difficultyBaseHpR63,
          difficultyFactorR63: actor?.difficultyFactorR63,
          healthR71DifficultyFactor: actor?.healthR71DifficultyFactor,
        };
      }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
      return {engaged: room.engaged === true, tier: window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.().tier, bosses};
    });
    const bossesBeforeSave = await readBossHealth();
    assert.equal(bossesBeforeSave.engaged, false, 'the saved dist00 room is inactive, so its hidden bosses cannot take combat hits');
    assert.ok(bossesBeforeSave.bosses.length > 0, 'restored native room roster retains bosses before marked save');
    for (const row of bossesBeforeSave.bosses) {
      assert.ok(Number.isSafeInteger(row.maxHp) && row.maxHp % 1000 === 666, `${row.id} has an actual integer 666-suffix maximum before save`);
      assert.ok(Number.isFinite(row.baseMaxHp) && row.baseMaxHp > 0 && Number.isFinite(row.canonicalMaxHp) && row.canonicalMaxHp > 0);
      assert.ok(Number.isFinite(row.factor) && row.factor > 0 && Number.isFinite(row.difficultyBaseHpR63) && row.difficultyBaseHpR63 > 0);
      assert.ok(Number.isFinite(row.difficultyFactorR63) && row.difficultyFactorR63 > 0);
      assert.ok(Number.isFinite(row.healthR71DifficultyFactor) && row.healthR71DifficultyFactor > 0);
      assert.ok(Number.isFinite(row.hp) && row.hp >= 0 && row.hp <= row.maxHp);
      assert.ok(Number.isFinite(row.hpFraction) && row.hpFraction >= 0 && row.hpFraction <= 1);
      assert.equal(row.adjusted, true);
      assert.equal(row.visibleMaxHp, row.maxHp);
      assert.equal(row.maxHp, suffixFor(row.canonicalMaxHp));
    }
    const assertBossStateStable = (before, after, label) => {
      assert.equal(after.engaged, before.engaged, `${label}: native room engagement state is retained`);
      assert.equal(after.tier, before.tier, `${label}: native map difficulty tier is retained`);
      assert.deepEqual(after.bosses.map(row => row.id), before.bosses.map(row => row.id), `${label}: native boss roster is retained`);
      const afterById = new Map(after.bosses.map(row => [row.id, row]));
      for (const row of before.bosses) {
        const restored = afterById.get(row.id);
        assert.ok(restored, `${label}: ${row.id} is restored`);
        for (const field of ['maxHp', 'baseMaxHp', 'canonicalMaxHp', 'visibleMaxHp', 'factor', 'difficultyBaseHpR63', 'difficultyFactorR63', 'healthR71DifficultyFactor']) {
          assert.equal(restored[field], row[field], `${label}: ${row.id} ${field} is not compounded or changed`);
        }
        assert.ok(Number.isFinite(restored.hp) && restored.hp >= 0 && restored.hp <= restored.maxHp, `${label}: ${row.id} HP stays within its maximum`);
        assert.ok(Number.isFinite(restored.hpFraction) && Math.abs(restored.hpFraction - row.hpFraction) <= 1e-8,
          `${label}: ${row.id} HP fraction is stable through save restore`);
        assert.equal(restored.adjusted, true, `${label}: ${row.id} remains health-normalized`);
        assert.ok(Number.isSafeInteger(restored.maxHp) && restored.maxHp % 1000 === 666, `${label}: ${row.id} visible max HP keeps the integer 666 suffix`);
        assert.equal(restored.visibleMaxHp, restored.maxHp, `${label}: ${row.id} diagnostic and actual max HP agree`);
        assert.equal(restored.maxHp, suffixFor(restored.canonicalMaxHp), `${label}: ${row.id} max HP still derives from canonical HP`);
      }
    };

    const newSave = await page.evaluate(() => serializeSave());
    assert.equal(newSave.player.healthR71Applied, true, 'new save stores its health normalization marker');
    const firstMarkedRestore = await restoreNativeSave(page, newSave, 'first marked-save restore');
    const afterRestore = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    const bossesAfterRestore = await readBossHealth();
    assertBossStateStable(bossesBeforeSave, bossesAfterRestore, 'first marked-save restore');
    assert.equal(afterRestore.max, 777);
    assert.equal(afterRestore.inspect.maxHp, 777);

    const secondMarkedRestore = await restoreNativeSave(page, newSave, 'second marked-save restore');
    const afterRestoreAgain = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    const bossesAfterRestoreAgain = await readBossHealth();
    assertBossStateStable(bossesBeforeSave, bossesAfterRestoreAgain, 'second marked-save restore');
    assert.equal(afterRestoreAgain.max, 777);
    assert.equal(afterRestoreAgain.inspect.maxHp, 777);

    const oldRestore = await restoreNativeSave(page, oldSave, 'R70 old-save migration');
    const afterOldRestore = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(afterOldRestore.max, 777, 'R70 saves normalize into the R71 health cap');
    assert.equal(afterOldRestore.inspect.maxHp, 777);

    await page.evaluate(() => { player.hp = 0; showDeath(); });
    await page.locator('#reviveHome').click();
    await page.waitForFunction(() => window.eval("zone==='hub' && !loading && !modal"), null, {timeout: 60000});
    const respawn = await page.evaluate(() => ({max: maxHP(), hp: player.hp, inspect: window.__STORYWORLD_HEALTH_R71__.inspect(player).player}));
    assert.equal(respawn.max, 777);
    assert.equal(respawn.hp, 777, 'native death-to-hub respawn restores exactly the balanced cap');
    report.checks.push({name: 'health-cap-bosses-hit-save-upgrade-respawn', baselineHealth, initial, trustedHistoryFixture: unlockFixture, bosses: bossRows, hit, afterUpgrade, bossesBeforeSave, bossesAfterRestore, bossesAfterRestoreAgain, afterRestore, afterRestoreAgain, afterOldRestore, markedRestoreDiagnostics: [firstMarkedRestore, secondMarkedRestore, oldRestore], respawn});
    assertNoPageErrors(game);
    await closeGame(game);
  });

  // Guard cases use real native hurt() admission, but their attacker/source
  // semantics deliberately model dodge, self-cost, and existing wound ticks.
  await runCase('bleed-admission-guards-native-hurt', async () => {
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
  });

  // Run probability boundaries against the actual production roller. Existing
  // tier chance and 1..7 amount rules remain unchanged.
  await runCase('native-point-drop-probability-and-amount-boundaries', async () => {
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
  });

  // Test all authored material palettes plus actual hospital and ordinary map
  // assignment. Compare the unchanged hospital geometry against the R70 game.
  await runCase('map-material-palettes-and-hospital-geometry', async () => {
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
  });

  // A real native enemy kill creates a drop in the expanded hospital wing at
  // world coordinates above 32; the command capture must include icon + label,
  // pickup is one-shot, and its claim survives save/restore.
  await runCase('native-expanded-point-drop-pickup-and-flashlight', async () => {
    const game = await openGame();
    const {page} = game;
    const hospitalAdmission = await seedTrustedStoryHistory(page, {throughId: 'ep1a08'});
    await enterRegion(page, 'ep1a08', {position: {x: 27, y: 27}});
    await selectDifficulty(page, 'ep1a08', 'hard', {options: {position: {x: 27, y: 27}}});
    await confirmDifficulty(page, 'ep1a08', 'hard');
    const fixture = await page.evaluate(() => {
      const api = window.__STORYWORLD_PROGRESSION_R71__, r = room;
      const progression = window.__STORYWORLD_PROGRESSION_R62__;
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
      const oldInvincible = player.invincible, oldAuto = auto;
      player.hp = maxHP(); player.invincible = 1e6; auto = false; r.engaged = true;
      const wasCleared = progression.state(player).clears?.['STORY:ep1a08'] === true;
      const before = player.points, killed = hitEnemy(targetEnemy, 1);
      api.syncPointDrops(r);
      const drop = r.passivePointDropsR64.find(d => d.source === killId);
      const prop = drop && r.props.find(p => p.passivePointDropR64 && p.pointDropIdR64 === drop.id);
      if (!drop) throw new Error('Native kill did not persist its successful seeded point drop');
      const playerSpots = [];
      for (const radius of [2.45, 2.5, 2.55]) for (let i = 0; i < 32; i++) {
        const angle = i * Math.PI / 16;
        const spot = {x: drop.x + Math.cos(angle) * radius, y: drop.y + Math.sin(angle) * radius};
        if (spot.x - .2 < bounds[0] || spot.y - .2 < bounds[1] || spot.x + .2 > bounds[2] || spot.y + .2 > bounds[3]) continue;
        if (blocked(spot.x, spot.y, .2, r) || !clearLine(spot, drop, r)) continue;
        playerSpots.push({spot, radius});
      }
      const safeView = playerSpots.find(({spot}) => {
        cam.x = spot.x; cam.y = spot.y;
        const q = project(drop.x, drop.y);
        return q.x >= -36 && q.x <= W + 36 && q.y >= -40 && q.y <= H + 40;
      });
      if (!safeView) throw new Error('No clear, walkable, in-view player position about 2.5 tiles from the native drop');
      player.x = safeView.spot.x; player.y = safeView.spot.y; cam.x = player.x; cam.y = player.y;
      const clearNow = progression.state(player).clears?.['STORY:ep1a08'] === true && !wasCleared;
      const nativeClearAward = clearNow ? api.inspect().difficultyReward : 0;
      const pointClaimedAtKill = progression.state(player).pointDropClaimsR64?.[drop.id] === true || r.passivePointClaimsR64.includes(drop.id);
      return {bounds, target, playerSpot: safeView.spot, playerDropDistance: Math.hypot(player.x - drop.x, player.y - drop.y), clearLine: clearLine(player, drop, r), enemy: {id: targetEnemy.id, isBoss, killed, deadRecorded: targetEnemy.deadRecorded, hp: targetEnemy.hp}, killId, drop, prop, pointsBefore: before, pointsAfterKill: player.points, nativeClearAward, pointClaimedAtKill, oldInvincible, oldAuto};
    });
    assert.ok(fixture.target.x > 32 || fixture.target.y > 32, 'native enemy/drop coordinate must use expanded >32 bounds');
    assert.equal(fixture.enemy.killed, true); assert.equal(fixture.enemy.deadRecorded, true);
    assert.ok(fixture.drop && fixture.drop.source === fixture.killId);
    assert.ok(Number.isSafeInteger(fixture.drop.amount) && fixture.drop.amount >= 1 && fixture.drop.amount <= 7);
    assert.ok(fixture.drop.x > 32 || fixture.drop.y > 32, 'the actual drop must persist in expanded coordinates');
    assert.ok(fixture.prop?.visible && fixture.prop.enabled && fixture.prop.path === ASSET_ART && fixture.prop.amountR64 === fixture.drop.amount);
    assert.ok(fixture.playerDropDistance >= 2.4 && fixture.playerDropDistance <= 2.6, 'the player stays outside pickup range before the pickup assertion');
    assert.equal(fixture.clearLine, true, 'the drop remains in clear view from a walkable player position');
    assert.equal(fixture.pointClaimedAtKill, false, 'the native kill does not claim the drop');
    assert.equal(fixture.pointsAfterKill - fixture.pointsBefore, fixture.nativeClearAward,
      'the kill checkpoint includes only a native clear reward, if defeating the boss cleared the map');

    const visual = await page.evaluate(() => {
      cam.x = player.x; cam.y = player.y;
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

    const pickup = await page.evaluate(({dropId, oldInvincible, oldAuto}) => {
      const api = window.__STORYWORLD_PROGRESSION_R71__;
      const actual = room.passivePointDropsR64.find(d => d.id === dropId);
      if (!actual || !room.props.some(p => p.pointDropIdR64 === dropId)) throw new Error('The fixture native drop disappeared before pickup');
      const owner = player, before = owner.points, targetId = actual.id;
      owner.x = actual.x; owner.y = actual.y; owner.invincible = oldInvincible; auto = oldAuto;
      const first = api.collectPointDrops(), afterFirst = owner.points, second = api.collectPointDrops();
      const save = serializeSave();
      return {id: targetId, amount: actual.amount, before, first, afterFirst, second, afterSecond: owner.points, claimed: room.passivePointClaimsR64.includes(targetId), save: JSON.stringify(save)};
    }, {dropId: fixture.drop.id, oldInvincible: fixture.oldInvincible, oldAuto: fixture.oldAuto});
    assert.equal(pickup.id, fixture.drop.id, 'pickup targets the exact native kill drop');
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
  });

  // Two browser pages exercise native local coop simulation: host clear and
  // pickup ownership are authoritative; a guest cannot select difficulty or
  // claim drops. This is explicitly not a relay/network integration test.
  await runCase('two-page-local-coop-health-rewards-expanded-drops', async () => {
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

    const legacyReplicaImport = await host.page.evaluate(async () => {
      const c=window.__STORYWORLD_COOP_SIM_R62__,campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,health=window.__STORYWORLD_HEALTH_R71__,summons=window.__STORYWORLD_SUMMONS_R61__;
      campaign.choose('dist00','STORY','normal');campaign.reapplyRoom();
      const r=room,sourceBoss=r.enemies.find(e=>(e.boss||e.midboss||e.persona||e.cosmic||e.trial)&&!e.coopReplicaR62);
      const sourceMob=r.enemies.find(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.persona&&!e.cosmic&&!e.trial&&!e.coopReplicaR62&&e.ai==='melee');
      if(!sourceBoss||!sourceMob)throw new Error('Native dist00 boss and melee source are required for the legacy replica import fixture');
      if(sourceBoss.healthR71CanonicalMaxHp!==6421.5||sourceBoss.maxHp!==6666)throw new Error('The normal dist00 owner must be 6421.5 canonical / 6666 visible before legacy import');
      const raw=c.exportSave(),coopKey=Object.keys(raw.coopWorld||{}).find(k=>k===`${r.layer}:${r.id}`),hostRoom=raw.hostSave?.rooms?.[coopKey];
      if(!coopKey||!hostRoom)throw new Error(`Native coop save is missing ${r.layer}:${r.id} room rows; keys=${Object.keys(raw.hostSave?.rooms||{}).slice(0,8).join(',')}`);
      // This import fixture must exercise an active native encounter. Earlier
      // reward checks legitimately clear dist00; clear only the imported
      // fixture's campaign bit while retaining its claims and other progress.
      raw.hostSave.progress??={};raw.hostSave.progress.STORY??={};raw.hostSave.progress.STORY.dist00=false;
      const bossSaved=hostRoom.enemies?.find(row=>row.id===sourceBoss.id),mobSaved=hostRoom.enemies?.find(row=>row.id===sourceMob.id);
      if(!bossSaved||!mobSaved)throw new Error('Native host save omits the source boss or melee control actor');
      const bossReplicaId=`${sourceBoss.id}:coop:qa-r70-boss`,ordinaryReplicaId=`${sourceMob.id}:coop:qa-r70-mob`;
      const fraction=.5,cloneFraction=.4,oldCloneMax=6421.5*.06;
      raw.coopWorld[coopKey].replicas.push({id:bossReplicaId,source:sourceBoss.id,nativeId:sourceBoss.nativeId,
        maxHp:6421.5,hp:6421.5*fraction,damage:sourceBoss.damage,x:sourceBoss.x,y:sourceBoss.y,spawnState:sourceBoss.spawnState});
      raw.coopWorld[coopKey].replicas.push({id:ordinaryReplicaId,source:sourceMob.id,nativeId:sourceMob.nativeId,
        maxHp:sourceMob.maxHp,hp:sourceMob.hp,damage:sourceMob.damage,x:sourceMob.x,y:sourceMob.y,spawnState:sourceMob.spawnState});
      hostRoom.engaged=true;hostRoom.cleared=false;hostRoom.finalizing=false;bossSaved.spawnState='active';bossSaved.deadRecorded=false;bossSaved.hp=Math.max(1,Number(bossSaved.hp)||sourceBoss.hp);
      const oldCloneId=`${r.id}:r61-summon:qa-r70-clone`,clonePoint=summons.position({combatProfile:sourceBoss.combatProfile,radius:sourceBoss.radius},sourceBoss,0,[],r);
      if(!clonePoint)throw new Error('Native R61 safe clone restore point is unavailable for the marked legacy save');
      raw.hostSave.summonsR61={version:1,serial:990001,rooms:{[coopKey]:{version:1,owners:{[sourceBoss.id]:{used:1,waves:1,nextIn:8}},units:[{
        id:oldCloneId,owner:sourceBoss.id,kind:'clone',nativeId:sourceBoss.nativeId,maxHp:oldCloneMax,hp:oldCloneMax*cloneFraction,
        damage:sourceBoss.damage,x:clonePoint.x,y:clonePoint.y,cd:1.2,
      }]}}};
      // Model the native R63 metadata overwrite as well as R61 summon rows.
      // This explicit stale base is a synthetic regression input, not a user save.
      raw.hostSave.campaignHpR63??={version:1,rooms:{}};
      raw.hostSave.campaignHpR63.rooms??={};raw.hostSave.campaignHpR63.rooms[coopKey]??={};
      raw.hostSave.campaignHpR63.rooms[coopKey][oldCloneId]={base:48000,factor:.25};
      const ownerBefore={id:sourceBoss.id,maxHp:sourceBoss.maxHp,canonical:sourceBoss.healthR71CanonicalMaxHp,hpFraction:sourceBoss.hp/sourceBoss.maxHp,factor:sourceBoss.difficultyFactorR63};
      const mobBefore={id:sourceMob.id,maxHp:sourceMob.maxHp,hp:sourceMob.hp};
      const restoreAndRead=async()=>{
        await c.importSave(raw);const epoch=c.inspect().epoch;c.receive({type:'all_loaded',phase:'running',epoch});auto=false;settings.autoSkill=false;for(const actor of c.players()){actor.invincible=1e6;actor.invReason='QA marked-save fixture';}player.hp=777;
        const currentRoom=room,owner=currentRoom.enemies.find(e=>e.id===sourceBoss.id),bossReplica=currentRoom.enemies.find(e=>e.id===bossReplicaId),ordinaryReplica=currentRoom.enemies.find(e=>e.id===ordinaryReplicaId),clone=currentRoom.enemies.find(e=>e.id===oldCloneId),mob=currentRoom.enemies.find(e=>e.id===sourceMob.id);
        return{
          owner:owner&&{maxHp:owner.maxHp,canonical:owner.healthR71CanonicalMaxHp,hpFraction:owner.hp/owner.maxHp,factor:owner.difficultyFactorR63},
          bossReplica:bossReplica&&{maxHp:bossReplica.maxHp,hp:bossReplica.hp,hpFraction:bossReplica.hp/bossReplica.maxHp,canonical:bossReplica.healthR71CanonicalMaxHp,visible:bossReplica.healthR71VisibleMaxHp,adjusted:bossReplica.healthR71Adjusted},
          ordinaryReplica:ordinaryReplica&&{maxHp:ordinaryReplica.maxHp,hp:ordinaryReplica.hp},
          clone:clone&&{maxHp:clone.maxHp,hp:clone.hp,hpFraction:clone.hp/clone.maxHp,ownerMaxHp:owner?.maxHp,ownerId:clone.r61Summoned?.owner,kind:clone.r61Summoned?.kind,clone:clone.r61Clone===true},
          sourceMob:mob&&{maxHp:mob.maxHp,hp:mob.hp},
          cloneMetricRestored:summons.inspect().metrics.restored,
          healthBosses:health.inspect(player).bosses.map(row=>({id:row.id,maxHp:row.visibleMaxHp,canonical:row.canonicalMaxHp})),
        };
      };
      const first=await restoreAndRead(),second=await restoreAndRead();
      return {ownerBefore,mobBefore,expected:{bossReplicaId,ordinaryReplicaId,oldCloneId,fraction,cloneFraction,oldCloneMax},first,second};
    });
    console.log('R71_LEGACY_BOSS_REPLICA_IMPORT',JSON.stringify(legacyReplicaImport));
    assert.equal(legacyReplicaImport.ownerBefore.maxHp,6666);assert.equal(legacyReplicaImport.ownerBefore.canonical,6421.5);
    for(const round of [legacyReplicaImport.first,legacyReplicaImport.second]){
      assert.equal(round.owner.maxHp,6666);assert.equal(round.owner.canonical,6421.5);
      assert.ok(Math.abs(round.owner.hpFraction-legacyReplicaImport.ownerBefore.hpFraction)<1e-8,'marked native save restores the boss HP fraction without changing its tier canonical');
      assert.equal(round.owner.factor,legacyReplicaImport.ownerBefore.factor);
      assert.equal(round.bossReplica.maxHp,6666);assert.equal(round.bossReplica.hp,3333);assert.equal(round.bossReplica.hpFraction,.5);
      assert.equal(round.bossReplica.canonical,6421.5);assert.equal(round.bossReplica.visible,6666);assert.equal(round.bossReplica.adjusted,true);
      assert.equal(round.ordinaryReplica.maxHp,legacyReplicaImport.mobBefore.maxHp);assert.equal(round.ordinaryReplica.hp,legacyReplicaImport.mobBefore.hp,'the ordinary co-op replica retains its saved R70 health');
      assert.equal(round.clone.ownerId,legacyReplicaImport.ownerBefore.id);assert.equal(round.clone.kind,'clone');assert.equal(round.clone.clone,true);
      assert.ok(Math.abs(round.clone.maxHp-round.clone.ownerMaxHp*.06)<1e-9,'restored R61 clone remains exactly 6% of its normalized owner');
      assert.ok(Math.abs(round.clone.hpFraction-legacyReplicaImport.expected.cloneFraction)<1e-12,'restored R61 clone preserves its saved health fraction');
      assert.equal(round.sourceMob.maxHp,legacyReplicaImport.mobBefore.maxHp);assert.equal(round.sourceMob.hp,legacyReplicaImport.mobBefore.hp,'R61 clone health repair leaves the ordinary source mob unchanged');
    }
    const {cloneMetricRestored:firstCloneRestoreCount,...firstImportHealth}=legacyReplicaImport.first;
    const {cloneMetricRestored:secondCloneRestoreCount,...secondImportHealth}=legacyReplicaImport.second;
    assert.deepEqual(secondImportHealth,firstImportHealth,'reimporting the same R70 co-op save does not compound boss or clone health');
    assert.equal(secondCloneRestoreCount,firstCloneRestoreCount+1,'the native summon loader records one additional restored clone per import');

    const openReselect = async tier => {
      await host.page.evaluate(nextTier => {
        window.__STORYWORLD_PROGRESSION_R71__.openDifficulty('dist00',null,{restore:true,noStory:true,position:{x:15,y:19},layer:'STORY'});
        document.getElementById(nextTier==='hard'?'r71DifficultyHard':'r71DifficultyNormal').click();
        document.getElementById('r71DifficultyConfirm').click();
      },tier);
      await host.page.waitForFunction(()=>window.eval("zone==='dist00' && !loading && !modal"),null,{timeout:60000});
      return host.page.evaluate(({tier,ownerId,cloneId,mobId})=>{
        const campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,health=window.__STORYWORLD_HEALTH_R71__;
        const owner=room.enemies.find(e=>e.id===ownerId),clone=room.enemies.find(e=>e.id===cloneId),mob=room.enemies.find(e=>e.id===mobId);
        return{tier:campaign.mode('dist00','STORY'),owner:owner&&{id:owner.id,maxHp:owner.maxHp,canonical:owner.healthR71CanonicalMaxHp,visible:owner.healthR71VisibleMaxHp,hpFraction:owner.hp/owner.maxHp,factor:owner.difficultyFactorR63},clone:clone&&{maxHp:clone.maxHp,hpFraction:clone.hp/clone.maxHp,ownerId:clone.r61Summoned?.owner,isClone:clone.r61Clone===true},ordinary:mob&&{id:mob.id,maxHp:mob.maxHp,hp:mob.hp,isClone:mob.r61Clone===true,adjusted:mob.healthR71Adjusted===true},authority:health.inspect(player).authority};
      },{tier,ownerId:legacyReplicaImport.ownerBefore.id,cloneId:legacyReplicaImport.expected.oldCloneId,mobId:legacyReplicaImport.mobBefore.id});
    };
    const hardReselect=await openReselect('hard');
    assert.equal(hardReselect.tier,'hard');assert.ok(hardReselect.owner&&hardReselect.clone&&hardReselect.ordinary);
    assert.equal(hardReselect.owner.maxHp%1000,666);assert.equal(hardReselect.owner.maxHp,hardReselect.owner.visible);
    assert.ok(Math.abs(hardReselect.owner.hpFraction-legacyReplicaImport.ownerBefore.hpFraction)<1e-8,'hard reselect preserves the boss HP fraction');
    assert.equal(hardReselect.clone.ownerId,legacyReplicaImport.ownerBefore.id);assert.equal(hardReselect.clone.isClone,true);
    assert.ok(Math.abs(hardReselect.clone.maxHp-hardReselect.owner.maxHp*.06)<1e-9,'same-map hard-tier reselect keeps the native R61 clone at exactly 6% of its owner');
    assert.ok(Math.abs(hardReselect.clone.hpFraction-legacyReplicaImport.expected.cloneFraction)<1e-12,'same-map hard-tier reselect preserves the clone HP fraction');
    assert.equal(hardReselect.ordinary.isClone,false);assert.equal(hardReselect.ordinary.adjusted,false,'clone repair does not mark ordinary enemies as boss-normalized');
    const normalReselect=await openReselect('normal');
    assert.equal(normalReselect.tier,'normal');assert.equal(normalReselect.owner.maxHp,6666);assert.equal(normalReselect.owner.canonical,6421.5);
    assert.ok(Math.abs(normalReselect.owner.hpFraction-legacyReplicaImport.ownerBefore.hpFraction)<1e-8,'returning to normal preserves the boss HP fraction');
    assert.equal(normalReselect.clone.ownerId,legacyReplicaImport.ownerBefore.id);assert.equal(normalReselect.clone.isClone,true);
    assert.ok(Math.abs(normalReselect.clone.maxHp-normalReselect.owner.maxHp*.06)<1e-9,'returning to normal keeps the clone ratio stable');
    assert.ok(Math.abs(normalReselect.clone.hpFraction-legacyReplicaImport.expected.cloneFraction)<1e-12,'returning to normal keeps the clone HP fraction stable');
    assert.equal(normalReselect.ordinary.isClone,false);assert.equal(normalReselect.ordinary.adjusted,false);
    console.log('R71_BOSS_CLONE_TIER_RESELECT',JSON.stringify({hardReselect,normalReselect}));
    await host.page.evaluate(()=>{room.engaged=false;window.__STORYWORLD_SUMMONS_R61__.clear('qa-legacy-import-tier-reselect');for(const actor of window.__STORYWORLD_COOP_SIM_R62__.players()){actor.invincible=0;actor.invReason='';}});

    const firstHit = await host.page.evaluate(() => {
      const c=window.__STORYWORLD_COOP_SIM_R62__,health=window.__STORYWORLD_HEALTH_R71__,actors=c.players();
      const owner=actors.find(p=>p.coopIdR62==='qa-host'),peer=actors.find(p=>p.coopIdR62==='qa-peer'),r=room;
      const originalEnemies=r.enemies,originalEngaged=r.engaged,originalDefeated=r.coopDefeatedR62;
      owner.hp=peer.hp=777;owner.invincible=peer.invincible=0;owner.invReason=peer.invReason='';owner.guard=peer.guard=false;owner.parry=peer.parry=0;
      owner.x=7;owner.y=7;peer.x=18;peer.y=19;
      const baseEnemies=r.enemies;
      const gap=.55,fields=window.__STORYWORLD_FIELDS_R61__;let enemy=null,spot=null;
      for(const candidate of baseEnemies){
        if(!(candidate.hp>0&&!candidate.boss&&!candidate.midboss&&!candidate.persona&&!candidate.cosmic&&!candidate.trial&&candidate.type!=='ranged'&&!candidate.coopReplicaR62&&candidate.ai==='melee'&&!fields?.activeAction?.(candidate)))continue;
        const homeX=Number.isFinite(candidate.homeX)?candidate.homeX:candidate.x,homeY=Number.isFinite(candidate.homeY)?candidate.homeY:candidate.y;
        for(const radius of [0,.5,1,1.5,2]){
          for(let i=0;i<16&&!spot;i++){
            const angle=i*Math.PI/8,px=homeX+Math.cos(angle)*radius,py=homeY+Math.sin(angle)*radius,ex=px+gap,ey=py;
            if(!blocked(px,py,.23,r)&&!blocked(ex,ey,.29,r)&&clearLine({x:ex,y:ey},{x:px,y:py-.15},r)){
              enemy=candidate;spot={x:px,y:py,ex,ey,homeX,homeY,homeDistance:Math.hypot(px-homeX,py-homeY)};
            }
          }
          if(spot)break;
        }
        if(spot)break;
      }
      if(!enemy)throw new Error('No native melee enemy is available for the coop hit fixture');
      const originalEnemy={...enemy,aim:enemy.aim&&{...enemy.aim}},motionState=fields?.state?.(enemy),originalMotionNext=motionState?.next;
      r.enemies=[enemy];r.engaged=true;r.coopDefeatedR62=[...(originalDefeated||[]),enemy.id+':coop:1'];
      if(spot){peer.x=spot.x;peer.y=spot.y;enemy.x=spot.ex;enemy.y=spot.ey;}
      let ownerSpot=null;for(const radius of [3,4,5,6])for(let i=0;i<16&&!ownerSpot;i++){
        const angle=i*Math.PI/8,x=peer.x+Math.cos(angle)*radius,y=peer.y+Math.sin(angle)*radius;
        if(!blocked(x,y,.23,r)&&Math.hypot(x-enemy.x,y-enemy.y)>Math.max(2.5,(enemy.combatProfile?.attackShape?.range||1.5)+.5))ownerSpot={x,y};
      }
      if(ownerSpot){owner.x=ownerSpot.x;owner.y=ownerSpot.y;cameraTick(1);}
      enemy.spawnState='active';enemy.visible=true;enemy.deadRecorded=false;
      enemy.tell=0;enemy.rest=0;enemy.attack=null;enemy.rangedWindup=0;enemy.cd=0;enemy.graceUntil=time-1;
      enemy.aim={x:peer.x,y:peer.y,angle:Math.atan2(peer.y-.15-enemy.y,peer.x-enemy.x)};
      enemy.storyAttackUntil5=0;enemy.storyPatternCooldownUntil5=0;enemy.personaCooldownUntil150=0;enemy.invulnerableUntil=0;enemy.r61Action=null;enemy.r61BusyUntil=0;enemy.targetPlayerR62=null;
      if(motionState)motionState.next=time+120;
      const motionAPI=window.__STORYWORLD_HOSPITAL_MOTION_R53__,nativeCanPrepare=c.withPlayer(peer,()=>!!motionAPI?.canPrepare?.(enemy,'melee'));
      const beforeOwner=owner.hp,beforePeer=peer.hp,rawDamage=enemy.damage,attackMultiplier=enemy.weapon==='heavy'?1.25:1;
      const baseHurt=hurt,admitted=[];let prepared=null,committed=null,nativeAttackError=null;
      hurt=function(value,source){const before=peer.hp,result=baseHurt.apply(this,arguments);admitted.push({value,result,sourceId:source?.id||null,sourceIsRoomEnemy:source===enemy,before,after:peer.hp,attackId:source?.attack?.id||null});return result;};
      try{
        if(spot&&clearLine(enemy,peer)){
          tickEnemies(.02);
          prepared=enemy.attack?{id:enemy.attack.id,elapsed:enemy.attack.elapsed,windup:enemy.attack.castWindup150??enemy.attack.shape154?.windup??enemy.combatProfile.attackShape.windup,shape:enemy.attack.shape154||enemy.combatProfile.attackShape,footprint:enemy.attack.footprint154}:null;
          if(prepared){tickEnemies(Math.max(.03,Number(prepared.windup)+.03));committed={id:enemy.attack?.id||prepared.id,elapsed:enemy.attack?.elapsed??null,committed:enemy.attack?.committed===true,lastAttackKind:enemy.lastAttackKind};}
        }
      }catch(error){nativeAttackError=String(error?.stack||error);}
      finally{hurt=baseHurt;}
      const observed=admitted.find(row=>row.sourceIsRoomEnemy&&row.result==='hit')||null;
      const pressure=window.__STORYWORLD_HOSPITAL_PRESSURE_R54__?.incomingMultiplier(enemy)??1;
      const difficulty=window.__STORYWORLD_CAMPAIGN_R63R1__?.incomingDamageFactor?.(enemy)??1;
      const ward=window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('ward',peer)||0;
      const expected=health.normalizeIncoming(rawDamage*attackMultiplier,peer,enemy)*difficulty*.65*pressure*(1-.06*ward)*.2;
      const state=health.inspect(peer),visuals=effects.filter(e=>e.r71BleedVisualR71===true).map(e=>({owner:e.r71ActorId,atlas:e.r52Blood===true,life:e.life,age:e.age}));
      const commands=window.__STORYWORLD_PHASE1__.captureVisual(),bloodCommands=commands.filter(c=>c.owner?.id==='blood-contact-r52'&&c.kind==='image'&&String(c.sourcePath).includes('medical-impacts-r49.png'));
      const expectedImpact={x:peer.x,y:peer.y-.15},expectedScreen=project(expectedImpact.x,expectedImpact.y);expectedScreen.y-=actorHeight()*.40;
      const bloodCenters=bloodCommands.map(c=>({x:c.points.reduce((n,p)=>n+p[0],0)/c.points.length,y:c.points.reduce((n,p)=>n+p[1],0)/c.points.length,owner:c.owner}));
      const bleedDraws=health.inspect(peer).bleedVisuals.filter(v=>v.actorId==='qa-peer');
      const peerHomeDistance=Math.hypot(peer.x-(Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x),peer.y-(Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y)),peerCloseDistance=Math.hypot(enemy.x-peer.x,enemy.y-.15-peer.y),closeRange=window.__STORYWORLD_SCALE_MELEE_R61__?.closeRange?.(enemy)??null;
      const native={observed,admitted,prepared,committed,nativeAttackError,spot,ownerSpot,camera:cam&&{x:cam.x,y:cam.y},lineOfSight:clearLine(enemy,peer),distance:Math.hypot(enemy.x-peer.x,enemy.y-peer.y),admission:{enemyDistance:spot?Math.hypot(spot.ex-peer.x,spot.ey-peer.y):null,homeDistance:peerHomeDistance,enemyHomeDistance:Math.hypot(enemy.x-(Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x),enemy.y-(Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y)),home:{x:enemy.homeX,y:enemy.homeY},explorationGroup:enemy.explorationGroup||null,explorationLeash:enemy.explorationLeash??null,explorationLimit:7.15,aggro:enemy.combatProfile?.aggro??null,attackRange:enemy.combatProfile?.attackShape?.range??null,nativeCanPrepare,closeRange,closeDistance:peerCloseDistance,closeLine:clearLine(enemy,{x:peer.x,y:peer.y-.15},r)},enemy:{id:enemy.id,ai:enemy.ai,weapon:enemy.weapon,type:enemy.type,position:{x:enemy.x,y:enemy.y},hp:enemy.hp,maxHp:enemy.maxHp,tell:enemy.tell,aim:enemy.aim,graceUntil:enemy.graceUntil,rest:enemy.rest,cd:enemy.cd,attack:enemy.attack&&{id:enemy.attack.id,elapsed:enemy.attack.elapsed,committed:enemy.attack.committed},rangedWindup:enemy.rangedWindup,phase:enemy.phase,phaseAge:enemy.phaseAge,phaseStage:enemy.phaseStage,invulnerableUntil:enemy.invulnerableUntil,r61Action:enemy.r61Action,shape:enemy.combatProfile?.attackShape},player:{owner:{hp:owner.hp,x:owner.x,y:owner.y,invincible:owner.invincible,guard:owner.guard,parry:owner.parry},peer:{hp:peer.hp,x:peer.x,y:peer.y,invincible:peer.invincible,invReason:peer.invReason,guard:peer.guard,parry:peer.parry,attackCD:peer.attackCD,shield:peer.shield}},room:{id:r.id,layer:r.layer,engaged:r.engaged,loading,modal},fields:fields?.inspect?.()||null};
      enemy.tell=0;enemy.cd=999;Object.assign(enemy,originalEnemy);if(motionState&&Number.isFinite(originalMotionNext))motionState.next=originalMotionNext;
      r.enemies=originalEnemies;r.engaged=originalEngaged;r.coopDefeatedR62=originalDefeated;
      return{beforeOwner,afterOwner:owner.hp,beforePeer,afterPeer:observed?.after??peer.hp,rawDamage,expected,enemyId:enemy.id,native:r.enemies.includes(enemy),state,status:health.statusRows(peer),visuals,bloodCenters,bleedDraws,expectedImpact,expectedScreen,nativeDiagnostic:native};
    });
    console.log('R71_NATIVE_COOP_HIT',JSON.stringify(firstHit.nativeDiagnostic));
    assert.ok(firstHit.nativeDiagnostic.spot&&firstHit.nativeDiagnostic.lineOfSight,'the native hit fixture must use a clear, unblocked attacker/player pair');
    assert.ok(firstHit.nativeDiagnostic.spot.homeDistance<=2,'co-op fixture stages the target peer near the enemy’s preserved authored home');
    assert.ok(firstHit.nativeDiagnostic.ownerSpot,'move the non-target host near the peer so peer blood capture stays in the native viewport');
    assert.ok(firstHit.nativeDiagnostic.admission.enemyDistance<=firstHit.nativeDiagnostic.admission.aggro,'co-op native attack remains inside enemy aggro radius');
    assert.ok(firstHit.nativeDiagnostic.admission.enemyDistance<=firstHit.nativeDiagnostic.admission.attackRange+.15,'co-op native attack remains inside melee preparation range');
    assert.ok(!firstHit.nativeDiagnostic.admission.explorationGroup||(firstHit.nativeDiagnostic.admission.enemyDistance<=firstHit.nativeDiagnostic.admission.explorationLimit&&firstHit.nativeDiagnostic.admission.homeDistance<=firstHit.nativeDiagnostic.admission.explorationLeash),'co-op target remains inside native exploration and home-leash guards');
    assert.equal(firstHit.nativeDiagnostic.admission.nativeCanPrepare,true,'native co-op presentation admission allows the actual melee preparation');
    assert.ok(firstHit.nativeDiagnostic.admission.closeDistance<=firstHit.nativeDiagnostic.admission.closeRange&&firstHit.nativeDiagnostic.admission.closeLine,'the peer satisfies native close-contact admission');
    assert.ok(firstHit.nativeDiagnostic.prepared,'native tickEnemies must prepare a real melee attack before the strike');
    assert.ok(firstHit.nativeDiagnostic.committed?.committed===true||firstHit.nativeDiagnostic.observed,'native strike must reach the active strike phase');
    assert.ok(firstHit.nativeDiagnostic.observed?.sourceIsRoomEnemy&&firstHit.nativeDiagnostic.observed.result==='hit','native strike must reach the coop hurt admission path');
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

    // Preserve the live blood visual for the guest transfer. The independent
    // save/import below intentionally tests durable status and clears effects.
    const coopSnapshot=await host.page.evaluate(()=>window.__STORYWORLD_COOP_SIM_R62__.snapshot());
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
      const originalEnemies=r.enemies,originalEngaged=r.engaged,originalDefeated=r.coopDefeatedR62;
      const enemy=r.enemies.find(e=>e.id===enemyId);if(!enemy)throw new Error('Native attacker missing before lethal hit');
      const originalEnemy={...enemy,aim:enemy.aim&&{...enemy.aim}},fields=window.__STORYWORLD_FIELDS_R61__,motionState=fields?.state?.(enemy),originalMotionNext=motionState?.next;
      r.coopDefeatedR62=[...(originalDefeated||[]),enemy.id+':coop:1'];r.enemies=[enemy];r.engaged=true;
      owner.hp=777;peer.hp=2;owner.invincible=peer.invincible=0;owner.invReason=peer.invReason='';owner.guard=peer.guard=false;owner.parry=peer.parry=0;owner.x=8;owner.y=8;peer.x=18;peer.y=19;
      const gap=.55,homeX=Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x,homeY=Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y;let spot=null;
      for(const radius of [0,.5,1,1.5,2])for(let i=0;i<16&&!spot;i++){
        const angle=i*Math.PI/8,px=homeX+Math.cos(angle)*radius,py=homeY+Math.sin(angle)*radius,ex=px+gap,ey=py;
        if(!blocked(px,py,.23,r)&&!blocked(ex,ey,.29,r)&&clearLine({x:ex,y:ey},{x:px,y:py-.15},r))spot={x:px,y:py,ex,ey,homeDistance:Math.hypot(px-homeX,py-homeY)};
      }
      if(spot){peer.x=spot.x;peer.y=spot.y;enemy.x=spot.ex;enemy.y=spot.ey;}
      let ownerSpot=null;for(const radius of [3,4,5,6])for(let i=0;i<16&&!ownerSpot;i++){
        const angle=i*Math.PI/8,x=peer.x+Math.cos(angle)*radius,y=peer.y+Math.sin(angle)*radius;
        if(!blocked(x,y,.23,r)&&Math.hypot(x-enemy.x,y-enemy.y)>Math.max(2.5,(enemy.combatProfile?.attackShape?.range||1.5)+.5))ownerSpot={x,y};
      }
      if(ownerSpot){owner.x=ownerSpot.x;owner.y=ownerSpot.y;}
      enemy.spawnState='active';enemy.visible=true;enemy.deadRecorded=false;enemy.tell=0;enemy.rest=0;enemy.attack=null;enemy.rangedWindup=0;enemy.cd=0;enemy.graceUntil=time-1;
      enemy.aim={x:peer.x,y:peer.y,angle:Math.atan2(peer.y-.15-enemy.y,peer.x-enemy.x)};enemy.storyAttackUntil5=0;enemy.storyPatternCooldownUntil5=0;enemy.personaCooldownUntil150=0;enemy.invulnerableUntil=0;enemy.r61Action=null;enemy.r61BusyUntil=0;enemy.targetPlayerR62=null;
      if(motionState)motionState.next=time+120;
      const motionAPI=window.__STORYWORLD_HOSPITAL_MOTION_R53__,nativeCanPrepare=c.withPlayer(peer,()=>!!motionAPI?.canPrepare?.(enemy,'melee'));
      const baseHurt=hurt,admitted=[];let prepared=null,committed=null,nativeAttackError=null;
      hurt=function(value,source){const before=peer.hp,result=baseHurt.apply(this,arguments);admitted.push({value,result,sourceId:source?.id||null,sourceIsRoomEnemy:source===enemy,before,after:peer.hp,attackId:source?.attack?.id||null});return result;};
      try{
        if(spot&&clearLine(enemy,peer)){
          tickEnemies(.02);
          prepared=enemy.attack?{id:enemy.attack.id,elapsed:enemy.attack.elapsed,windup:enemy.attack.castWindup150??enemy.attack.shape154?.windup??enemy.combatProfile.attackShape.windup,shape:enemy.attack.shape154||enemy.combatProfile.attackShape,footprint:enemy.attack.footprint154}:null;
          if(prepared){tickEnemies(Math.max(.03,Number(prepared.windup)+.03));committed={id:enemy.attack?.id||prepared.id,elapsed:enemy.attack?.elapsed??null,committed:enemy.attack?.committed===true,lastAttackKind:enemy.lastAttackKind};}
        }
      }catch(error){nativeAttackError=String(error?.stack||error);}
      finally{hurt=baseHurt;}
      const observed=admitted.find(row=>row.sourceIsRoomEnemy&&row.result==='hit')||null;
      const down={hp:peer.hp,bleeding:health.inspect(peer).bleeding,visuals:effects.filter(e=>e.r71BleedVisualR71&&e.r71ActorId==='qa-peer'&&e.age<e.life).length};
      let revived=null;
      if(peer.hp===0){r.enemies=[];owner.x=peer.x+.3;owner.y=peer.y;owner.pendingInputR62={...(owner.pendingInputR62||{}),interact:true};c.tick(.2);revived={hp:peer.hp,maxHp:health.inspect(peer).player.maxHp,bleeding:health.inspect(peer).bleeding,status:health.statusRows(peer),invincible:peer.invincible};}
      const closeRange=window.__STORYWORLD_SCALE_MELEE_R61__?.closeRange?.(enemy)??null,closeDistance=Math.hypot(enemy.x-peer.x,enemy.y-.15-peer.y);
      const diagnostic={observed,admitted,prepared,committed,nativeAttackError,spot,ownerSpot,lineOfSight:clearLine(enemy,peer),distance:Math.hypot(enemy.x-peer.x,enemy.y-peer.y),admission:{enemyDistance:spot?Math.hypot(spot.ex-peer.x,spot.ey-peer.y):null,homeDistance:Math.hypot(peer.x-(Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x),peer.y-(Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y)),enemyHomeDistance:Math.hypot(enemy.x-(Number.isFinite(enemy.homeX)?enemy.homeX:enemy.x),enemy.y-(Number.isFinite(enemy.homeY)?enemy.homeY:enemy.y)),home:{x:enemy.homeX,y:enemy.homeY},explorationGroup:enemy.explorationGroup||null,explorationLeash:enemy.explorationLeash??null,explorationLimit:7.15,aggro:enemy.combatProfile?.aggro??null,attackRange:enemy.combatProfile?.attackShape?.range??null,nativeCanPrepare,closeRange,closeDistance,closeLine:clearLine(enemy,{x:peer.x,y:peer.y-.15},r)},enemy:{id:enemy.id,ai:enemy.ai,weapon:enemy.weapon,type:enemy.type,damage:enemy.damage,position:{x:enemy.x,y:enemy.y},tell:enemy.tell,aim:enemy.aim,rest:enemy.rest,cd:enemy.cd,graceUntil:enemy.graceUntil,attack:enemy.attack&&{id:enemy.attack.id,elapsed:enemy.attack.elapsed,committed:enemy.attack.committed},rangedWindup:enemy.rangedWindup,phase:enemy.phase,phaseAge:enemy.phaseAge,phaseStage:enemy.phaseStage,invulnerableUntil:enemy.invulnerableUntil,r61Action:enemy.r61Action,shape:enemy.combatProfile?.attackShape},player:{owner:{hp:owner.hp,invincible:owner.invincible},peer:{hp:peer.hp,invincible:peer.invincible,guard:peer.guard,parry:peer.parry,attackCD:peer.attackCD}},room:{id:r.id,layer:r.layer,engaged:r.engaged,loading,modal},fields:fields?.inspect?.()||null};
      Object.assign(enemy,originalEnemy);if(motionState&&Number.isFinite(originalMotionNext))motionState.next=originalMotionNext;
      r.enemies=originalEnemies;r.engaged=originalEngaged;r.coopDefeatedR62=originalDefeated;
      return{down,revived,diagnostic,reviveEvents:c.inspect().history.filter(row=>row.type==='player-revived'&&row.playerId==='qa-peer').length};
    },firstHit.enemyId);
    console.log('R71_NATIVE_LETHAL_COOP_HIT',JSON.stringify(deathAndRevive.diagnostic));
    assert.ok(deathAndRevive.diagnostic.spot&&deathAndRevive.diagnostic.lineOfSight,'the lethal fixture must use a clear, unblocked attacker/player pair');
    assert.ok(deathAndRevive.diagnostic.spot.homeDistance<=2,'lethal fixture stages the target peer near the enemy’s preserved authored home');
    assert.ok(deathAndRevive.diagnostic.ownerSpot,'lethal fixture keeps the non-target host farther from the native attacker');
    assert.ok(deathAndRevive.diagnostic.admission.enemyDistance<=deathAndRevive.diagnostic.admission.aggro,'lethal enemy remains inside enemy aggro radius');
    assert.ok(deathAndRevive.diagnostic.admission.enemyDistance<=deathAndRevive.diagnostic.admission.attackRange+.15,'lethal enemy remains inside melee preparation range');
    assert.ok(!deathAndRevive.diagnostic.admission.explorationGroup||(deathAndRevive.diagnostic.admission.enemyDistance<=deathAndRevive.diagnostic.admission.explorationLimit&&deathAndRevive.diagnostic.admission.homeDistance<=deathAndRevive.diagnostic.admission.explorationLeash),'lethal peer remains inside native exploration and home-leash guards');
    assert.equal(deathAndRevive.diagnostic.admission.nativeCanPrepare,true,'native lethal presentation admission allows the real melee preparation');
    assert.ok(deathAndRevive.diagnostic.admission.closeDistance<=deathAndRevive.diagnostic.admission.closeRange&&deathAndRevive.diagnostic.admission.closeLine,'the lethal target satisfies native close-contact admission');
    assert.ok(deathAndRevive.diagnostic.prepared,'native tickEnemies must prepare the real lethal melee attack');
    assert.ok(deathAndRevive.diagnostic.observed?.sourceIsRoomEnemy&&deathAndRevive.diagnostic.observed.result==='hit','lethal contact must use the native enemy hurt path');
    assert.ok(deathAndRevive.diagnostic.observed.after<deathAndRevive.diagnostic.observed.before);
    assert.ok(deathAndRevive.down.hp===0&&deathAndRevive.revived,'native lethal enemy contact must down the peer before revive');
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
    await closeGame(host); await closeGame(guest); await closeTrackedContext(context);
  });

  const passedCases = report.caseResults.filter(row => row.status === 'passed').length;
  const failedCases = report.caseResults.filter(row => row.status === 'failed').length;
  report.caseSummary = {attempted: report.caseResults.length, passed: passedCases, failed: failedCases};
  assert.equal(report.caseResults.length, 8, 'all eight independent browser regression cases must be attempted');
  if (failedCases) throw new Error(`R71 browser cases failed (${passedCases}/${report.caseResults.length} passed): ${report.caseResults.filter(row => row.status === 'failed').map(row => row.name).join(', ')}`);
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
