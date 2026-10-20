import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const url = process.env.STORYWORLD_URL;
assert.ok(url, 'STORYWORLD_URL must name the exact candidate or public Pages site');
const publicSmoke = process.env.R77_PUBLIC_SMOKE === '1';
const marker = publicSmoke
  ? 'R77_GUIDE_NORMAL_PUBLIC_SMOKE_RESULT'
  : 'R77_GUIDE_NORMAL_BROWSER_RESULT';
const out = 'out/r77';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const commit = process.env.GITHUB_SHA ||
  execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const report = {
  schema: 'storyworld.r77-guide-normal-browser.v1',
  mode: publicSmoke ? 'public-natural-smoke' : 'candidate',
  url,
  commit,
  htmlSHA256: null,
  sandbox: true,
  softwareGPU: true,
  physicalGPU: false,
  physicalDevice: false,
  scope: publicSmoke
    ? 'One fresh native UI start. Natural guide route to the first STORY map, R77 readable scene auto-Continue, and real Normal proof only.'
    : 'Fresh native UI natural route plus isolated candidate-only authored-post portal and native save compatibility fixtures.',
  naturalEarly: null,
  assistedBossPortal: null,
  saveCompatibility: null,
  screenshots: [],
  errors: [],
  ok: false
};
const contexts = [];
let browser;
let activePage = null;

async function openFresh(label) {
  const context = await browser.newContext({viewport: {width: 1365, height: 850}});
  contexts.push(context);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push({context: label, message: error.message}));
  page.on('crash', () => report.errors.push({context: label, message: 'PAGE_CRASH'}));
  activePage = page;
  const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000});
  assert.equal(response?.status(), 200, label + ': page must return HTTP 200');
  const html = await response.body();
  const digest = sha256(html);
  if (report.htmlSHA256 === null) report.htmlSHA256 = digest;
  else assert.equal(digest, report.htmlSHA256, 'all isolated contexts must use identical HTML bytes');
  await page.waitForFunction(
    () => window.__STORYWORLD_GUIDE_R77__?.inspect?.().revision === 'R77-GUIDE-NORMAL',
    null,
    {timeout: 60000}
  );
  await page.waitForFunction(
    () => typeof booted !== 'undefined' && booted && !loading &&
      !!window.__STORYWORLD_STORY_PROFILE_R54__ && !!window.__STORYWORLD_SAVE_SLOTS_R73__,
    null,
    {timeout: 60000}
  );
  return page;
}

async function freshNativeGame(page) {
  await page.locator('#campaignNew54').click({timeout: 60000});
  await page.locator('#slotConfirmR73').click({timeout: 60000});
  await page.waitForFunction(
    () => started && zone === 'hub' && !loading &&
      window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy === false,
    null,
    {timeout: 60000}
  );
  const start = await page.evaluate(() => ({
    zone,
    layer,
    hero: player?.hero,
    part: storyScene?.part || null,
    guide,
    cheat777: window.__STORYWORLD_CHEAT777__?.active?.() === true,
    coopMode: window.__STORYWORLD_COOP_SIM_R62__?.mode?.() || 'off'
  }));
  assert.equal(start.zone, 'hub');
  assert.equal(start.layer, 'STORY');
  assert.equal(start.hero, 'hwando');
  assert.ok(start.part === null || start.part === 'body');
  assert.equal(start.guide, false);
  assert.equal(start.cheat777, false);
  assert.equal(start.coopMode, 'off');

  // Some builds may have a native hub body scene; if present, advance only
  // those body cards as a player because they are outside R77 auto scope.
  let hubContinues = 0;
  while (await page.evaluate(() => zone === 'hub' && storyScene?.part === 'body')) {
    assert.ok(hubContinues < 8, 'native hub body scene queue should be short');
    await page.locator('#storyNext').click({timeout: 10000});
    hubContinues++;
    await page.waitForTimeout(80);
  }
  await page.waitForFunction(
    () => started && zone === 'hub' && !loading && !storyScene && !modal,
    null,
    {timeout: 15000}
  );
  return {start, hubContinues};
}

async function enableGuideFromMenu(page) {
  await page.locator('#menuBtn').click({timeout: 10000});
  await page.locator('#menuGuide').click({timeout: 10000});
  await page.waitForFunction(() => guide === true && !modal, null, {timeout: 10000});
}

async function capture(page, name) {
  if (publicSmoke) return;
  const path = out + '/' + name;
  await page.screenshot({path, fullPage: true});
  report.screenshots.push({
    path,
    sha256: sha256(await fs.readFile(path)),
    commit,
    htmlSHA256: report.htmlSHA256
  });
}

async function naturalEarly() {
  const page = await openFresh('naturalEarly');
  const fresh = await freshNativeGame(page);
  await enableGuideFromMenu(page);
  await capture(page, '01-natural-guide-enabled-hub.png');
  const expected = await page.evaluate(() => ({
    destination: firstPending('STORY')?.id || null,
    guideVersion: window.__STORYWORLD_GUIDE_R77__.inspect().revision,
    policy: window.__STORYWORLD_GUIDE_R77__.policy
  }));
  const queueEventStart = 0;
  assert.ok(expected.destination, 'a first canonical STORY destination must be pending');
  assert.equal(expected.guideVersion, 'R77-GUIDE-NORMAL');

  await page.waitForFunction(
    destination => zone === destination && layer === 'STORY' && !loading,
    expected.destination,
    {timeout: 60000}
  );
  await page.waitForFunction(
    () => !!storyScene && ['pre', 'post', 'firstPost', 'awakenPre', 'prologue.pre', 'prologue.post'].includes(storyScene.part) &&
      window.__STORYWORLD_GUIDE_R77__.inspect().scene.scheduled,
    null,
    {timeout: 20000}
  );
  const entered = await page.evaluate(() => {
    const guideApi = window.__STORYWORLD_GUIDE_R77__;
    const guideState = guideApi.inspect();
    const campaign = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect();
    const routes = window.__STORYWORLD_ROUTES_R72__.inspect();
    const scene = storyScene;
    const timer = guideState.events.filter(e => e.kind === 'scene-timer-armed' && e.key === scene.key).at(-1);
    const armed = guideState.events.find(e => e.kind === 'normal-intent-armed' && e.destination === zone);
    const consumed = guideState.events.find(e => e.kind === 'normal-intent-consumed' && e.destination === zone);
    return {
      zone,
      layer,
      hero: player.hero,
      guide,
      guideVersion: guideState.revision,
      scene: {key: scene.key, part: scene.part, textLength: String(scene.text || '').trim().length},
      timer,
      policy: guideApi.policy,
      campaign: {tier: campaign.tier, hpMultiplier: campaign.hpMultiplier, roomTier: room?.difficultyR63},
      normalIntent: {armed: armed || null, consumed: consumed || null},
      cheat777: window.__STORYWORLD_CHEAT777__?.active?.() === true,
      coopMode: window.__STORYWORLD_COOP_SIM_R62__?.mode?.() || 'off',
      position: {x: player.x, y: player.y},
      renderer: window.__STORYWORLD_PHASE1__?.controller?.inspect?.().active || null,
      routeAudit: routes.events?.slice?.(-8) || []
    };
  });
  assert.equal(entered.zone, expected.destination);
  assert.equal(entered.layer, 'STORY');
  assert.equal(entered.guide, true);
  assert.equal(entered.guideVersion, 'R77-GUIDE-NORMAL');
  assert.equal(entered.campaign.tier, 'normal');
  assert.equal(entered.campaign.hpMultiplier, 0.25);
  assert.equal(entered.cheat777, false);
  assert.equal(entered.coopMode, 'off');
  assert.ok(entered.normalIntent.armed, 'the guide must arm a one-use intent at its actual next portal');
  assert.ok(entered.normalIntent.consumed, 'the normal intent must be consumed by canonical progression');
  assert.ok(entered.scene.textLength > 0);
  assert.ok(entered.timer?.delayMs >= entered.policy.minimumDelayMs);
  assert.ok(entered.timer?.delayMs <= entered.policy.maximumDelayMs);
  assert.equal(entered.timer.delayMs, Math.max(
    entered.policy.minimumDelayMs,
    Math.min(entered.policy.maximumDelayMs, Math.round(entered.scene.textLength * 72))
  ));
  await capture(page, '02-natural-first-map-scene.png');

  // No story click occurs here. Wait for the actual scheduled Continue, which
  // itself waits for voice playback when narration is active.
  const autoWait = Math.min(70000, entered.timer.delayMs + 22000);
  await page.waitForFunction(
    key => window.__STORYWORLD_GUIDE_R77__.inspect().events.some(
      e => e.kind === 'scene-auto-continue' && e.key === key
    ),
    entered.scene.key,
    {timeout: autoWait}
  );
  const continued = await page.evaluate(key => {
    const state = window.__STORYWORLD_GUIDE_R77__.inspect();
    return {
      guideVersion: state.revision,
      sceneKey: key,
      autoContinue: state.events.filter(e => e.kind === 'scene-auto-continue' && e.key === key).at(-1) || null,
      currentScene: storyScene ? {key: storyScene.key, part: storyScene.part} : null,
      scheduledNext: state.scene.scheduled,
      guide,
      zone,
      tier: window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().tier,
      narrationEnabled: settings.narration === true,
      narrationPlaying: state.scene.narrationPlaying
    };
  }, entered.scene.key);
  assert.ok(continued.autoContinue, 'R77 must advance the readable scene without a story-button click');
  assert.equal(continued.zone, expected.destination);
  assert.equal(continued.tier, 'normal');
  assert.equal(continued.guide, true);
  await page.waitForFunction(
    destination => zone === destination && layer === 'STORY' && !loading && !storyScene &&
      modal === false && guide === true && player.hp > 0,
    expected.destination,
    {timeout: 180000}
  );
  const queue = await page.evaluate(start => {
    const events = window.__STORYWORLD_GUIDE_R77__.inspect().events.slice(start);
    const timers = events.filter(e => e.kind === 'scene-timer-armed');
    const autoContinues = events.filter(e => e.kind === 'scene-auto-continue');
    const timerKeys = [...new Set(timers.map(e => e.key))];
    const autoKeys = [...new Set(autoContinues.map(e => e.key))];
    return {
      timers,
      autoContinues,
      missingAutoContinue: timerKeys.filter(key => !autoKeys.includes(key)),
      zone,
      guide,
      modal,
      scene: storyScene ? {key: storyScene.key, part: storyScene.part} : null
    };
  }, queueEventStart);
  assert.ok(queue.timers.length > 0, 'the first-map narrative queue must use R77 timers');
  assert.ok(queue.autoContinues.length > 0, 'the first-map narrative queue must auto-Continue');
  assert.deepEqual(queue.missingAutoContinue, [], 'every scheduled first-map scene must auto-Continue');
  assert.equal(queue.zone, expected.destination);
  assert.equal(queue.guide, true);
  assert.equal(queue.modal, false);
  assert.equal(queue.scene, null);

  const fieldOrigin = await page.evaluate(() => ({zone, x: player.x, y: player.y}));
  await page.waitForFunction(
    origin => zone === origin.zone && layer === 'STORY' && guide === true && player.hp > 0 &&
      (!!room?.engaged || Math.hypot(player.x - origin.x, player.y - origin.y) > 0.25),
    fieldOrigin,
    {timeout: 30000}
  );
  const fieldProgress = await page.evaluate(origin => ({
    zone,
    layer,
    guide,
    hp: player.hp,
    scene: storyScene ? {key: storyScene.key, part: storyScene.part} : null,
    engaged: !!room?.engaged,
    movementFromSceneEnd: Math.hypot(player.x - origin.x, player.y - origin.y)
  }), fieldOrigin);
  assert.equal(fieldProgress.zone, expected.destination);
  assert.equal(fieldProgress.layer, 'STORY');
  assert.equal(fieldProgress.guide, true);
  assert.ok(fieldProgress.engaged || fieldProgress.movementFromSceneEnd > 0.25);
  await capture(page, '03-natural-scene-auto-continued.png');
  report.naturalEarly = {
    ok: true,
    freshUI: fresh,
    firstCanonicalDestination: expected.destination,
    guideVersion: entered.guideVersion,
    actualNormal: entered.campaign,
    normalIntent: entered.normalIntent,
    readableScene: {
      ...entered.scene,
      scheduledDelayMs: entered.timer.delayMs,
      policy: entered.policy,
      autoContinue: continued.autoContinue,
      after: continued,
      completedQueue: queue
    },
    fieldProgress,
    noForcedEnemyHP: true,
    noForcedKills: true,
    noSyntheticProgression: true,
    noPositionFixture: true,
    no777OrWarp: true
  };
  return page;
}

async function nativeSaveCompatibility() {
  const page = await openFresh('nativeSaveCompatibility');
  await freshNativeGame(page);
  await enableGuideFromMenu(page);
  const saved = await page.evaluate(() => {
    const ok = saveGame(false);
    const active = window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().active;
    const raw = window.__STORYWORLD_SAVE_SLOTS_R73__.read(active);
    const normalizeUpgrades = upgrades => Object.fromEntries(
      Object.entries(upgrades || {}).map(([key, rank]) => {
        if (typeof rank !== 'number' || !Number.isFinite(rank) || rank < 0) {
          throw Error('Native saved upgrade rank must be a finite nonnegative number: ' + key);
        }
        return [key, rank];
      }).filter(([, rank]) => rank !== 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    );
    return {
      ok,
      active,
      raw,
      snapshot: {
        progress: JSON.stringify(raw?.progress),
        player: JSON.stringify({
          level: raw?.player?.level,
          xp: raw?.player?.xp,
          points: raw?.player?.points,
          upgrades: normalizeUpgrades(raw?.player?.upgrades)
        }),
        pointDrops: JSON.stringify((() => {
          const drops = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().pointDrops;
          return {active: drops.active, rolled: drops.rolled, claimed: drops.claimed};
        })())
      }
    };
  });
  assert.equal(saved.ok, true, 'native normal-slot save must succeed in a fresh guide-on run');
  assert.equal(saved.raw?.guide, true);
  assert.ok(saved.raw?.version || saved.raw?.schemaVersion, 'the native save must retain its existing schema identifier');
  await page.reload({waitUntil: 'domcontentloaded', timeout: 60000});
  await page.waitForFunction(
    () => typeof booted !== 'undefined' && booted && !loading && !!document.getElementById('campaignContinue54'),
    null,
    {timeout: 60000}
  );
  await page.locator('#campaignContinue54').click({timeout: 60000});
  await page.waitForFunction(
    () => started && !loading && !storyScene &&
      window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy === false,
    null,
    {timeout: 60000}
  );
  const restored = await page.evaluate(() => {
    const active = window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().active;
    const raw = window.__STORYWORLD_SAVE_SLOTS_R73__.read(active);
    const current = serializeSave();
    const normalizeUpgrades = upgrades => Object.fromEntries(
      Object.entries(upgrades || {}).map(([key, rank]) => {
        if (typeof rank !== 'number' || !Number.isFinite(rank) || rank < 0) {
          throw Error('Restored upgrade rank must be a finite nonnegative number: ' + key);
        }
        return [key, rank];
      }).filter(([, rank]) => rank !== 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    );
    return {
      guide,
      zone,
      layer,
      progress: JSON.stringify(current.progress),
      player: JSON.stringify({
        level: current.player.level,
        xp: current.player.xp,
        points: current.player.points,
        upgrades: normalizeUpgrades(current.player.upgrades)
      }),
      pointDrops: JSON.stringify((() => {
        const drops = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().pointDrops;
        return {active: drops.active, rolled: drops.rolled, claimed: drops.claimed};
      })()),
      version: raw?.version,
      schemaVersion: raw?.schemaVersion,
      scope: raw?.scope
    };
  });
  assert.equal(restored.guide, true, 'guide-on state must survive native Continue');
  assert.equal(restored.progress, saved.snapshot.progress);
  assert.equal(restored.player, saved.snapshot.player);
  assert.equal(restored.pointDrops, saved.snapshot.pointDrops);

  const legacyRaw = await page.evaluate(() => {
    const raw = serializeSave();
    delete raw.guide;
    return raw;
  });
  assert.equal(Object.hasOwn(legacyRaw, 'guide'), false);
  const legacy = await page.evaluate(async raw => {
    await restoreSave(raw);
    const current = serializeSave();
    const normalizeUpgrades = upgrades => Object.fromEntries(
      Object.entries(upgrades || {}).map(([key, rank]) => {
        if (typeof rank !== 'number' || !Number.isFinite(rank) || rank < 0) {
          throw Error('Legacy restored upgrade rank must be a finite nonnegative number: ' + key);
        }
        return [key, rank];
      }).filter(([, rank]) => rank !== 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    );
    return {
      guide,
      zone,
      layer,
      progress: JSON.stringify(current.progress),
      player: JSON.stringify({
        level: current.player.level,
        xp: current.player.xp,
        points: current.player.points,
        upgrades: normalizeUpgrades(current.player.upgrades)
      }),
      pointDrops: JSON.stringify((() => {
        const drops = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().pointDrops;
        return {active: drops.active, rolled: drops.rolled, claimed: drops.claimed};
      })())
    };
  }, legacyRaw);
  assert.equal(legacy.guide, false, 'a legacy save without guide must keep guidance OFF');
  assert.equal(legacy.progress, restored.progress);
  assert.equal(legacy.player, restored.player);
  assert.equal(legacy.pointDrops, restored.pointDrops);
  report.saveCompatibility = {
    ok: true,
    scope: 'Candidate-only isolated browser context; native slot save, title Continue and native legacy restore.',
    validSaveGuide: saved.raw.guide,
    continueGuide: restored.guide,
    legacyGuide: legacy.guide,
    nativeSchema: {version: restored.version, schemaVersion: restored.schemaVersion, scope: restored.scope},
    progressionUnchanged: restored.progress === saved.snapshot.progress && legacy.progress === restored.progress,
    growthUnchanged: restored.player === saved.snapshot.player && legacy.player === restored.player,
    pointDropStateUnchanged: restored.pointDrops === saved.snapshot.pointDrops &&
      legacy.pointDrops === restored.pointDrops
  };
}

async function assistedBossPortalFixture() {
  const page = await openFresh('assistedBossPortal');
  await freshNativeGame(page);
  const fixture = await page.evaluate(async () => {
    const order = window.__STORYWORLD_STORY_PROFILE_R54__.campaignOrder;
    const routes = window.__STORYWORLD_ROUTES_R72__;
    const nextPending = index => order.slice(index + 1).find(id => regionById[id]?.records?.length) || null;
    const firstLateIndex = Math.floor(order.length * 0.68);
    const candidates = order.map((id, index) => {
      const def = regionById[id];
      const next = routes.destination('next', id);
      const post = def?.records?.some(record => String(record.post || '').trim());
      return {id, index, next, def, post, nextPending: nextPending(index)};
    }).filter(row => row.index >= firstLateIndex && row.next && row.id !== 'cult04' &&
      row.def?.bosses?.length && row.post && row.next === row.nextPending &&
      regionById[row.next]?.records?.length && regionById[row.next]?.safe !== true &&
      Object.values(row.def.exits || {}).includes(row.next));
    const chosen = candidates[0] || order.map((id, index) => {
      const def = regionById[id];
      const next = routes.destination('next', id);
      return {
        id,
        index,
        next,
        def,
        nextPending: nextPending(index),
        post: def?.records?.some(record => String(record.post || '').trim())
      };
    }).filter(row => row.next && row.id !== 'cult04' && row.def?.bosses?.length && row.post &&
      row.next === row.nextPending && regionById[row.next]?.records?.length &&
      regionById[row.next]?.safe !== true &&
      Object.values(row.def.exits || {}).includes(row.next)).at(-1);
    if (!chosen) throw Error('No canonical late boss map with authored post and next exit was found');
    const debug = window.__r77AssistedFixture = {
      phase: 'canonical-frontier-refresh',
      error: null,
      result: null,
      target: chosen.id,
      entry: null,
      unlockCheck: null,
      canonicalUnlockRefresh: false
    };
    for (let i = 0; i < chosen.index; i++) progress.STORY[order[i]] = true;
    serializeSave();
    const isUnlocked = window.__STORYWORLD4__?.isUnlocked?.(chosen.id, 'STORY') === true;
    const frontier = firstPending('STORY')?.id || null;
    debug.canonicalUnlockRefresh = true;
    debug.unlockCheck = {isUnlocked, frontier, expected: chosen.id};
    if (!isUnlocked || frontier !== chosen.id) {
      debug.error = 'Canonical unlock refresh did not expose the chosen map as the STORY frontier';
      throw Error(debug.error + ': ' + JSON.stringify(debug.unlockCheck));
    }
    let entered;
    try {
      entered = await enterRegion(chosen.id, null, {
        restore: true,
        noStory: true,
        layer: 'STORY',
        difficultyR63: 'normal'
      });
    } catch (error) {
      debug.phase = 'native-map-entry';
      debug.error = 'Native late-map fixture entry threw';
      debug.entry = {
        result: 'throw',
        message: String(error?.stack || error),
        zone,
        layer,
        loading,
        frontier: firstPending('STORY')?.id || null
      };
      throw Error(debug.error + ': ' + JSON.stringify(debug.entry));
    }
    debug.phase = 'native-map-entry';
    debug.entry = {result: entered, zone, layer, loading, frontier: firstPending('STORY')?.id || null};
    if (entered !== true || zone !== chosen.id || loading) {
      debug.error = 'Native late-map fixture entry failed';
      throw Error(debug.error + ': ' + JSON.stringify(debug.entry));
    }
    return {
      target: chosen.id,
      index: chosen.index,
      orderLength: order.length,
      next: chosen.next,
      priorProgressMarks: chosen.index,
      canonicalUnlockRefresh: debug.canonicalUnlockRefresh,
      unlockCheck: debug.unlockCheck,
      entry: debug.entry,
      tier: window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().tier,
      enemyHPUntouched: true,
      enemiesKilled: false
    };
  });
  assert.equal(fixture.tier, 'normal');
  await enableGuideFromMenu(page);
  const opened = await page.evaluate(targetId => {
    const scenes = nextScenes(regionById[targetId], 'post').filter(scene => !readScenes.has(scene.key));
    if (!scenes.length) throw Error('Fixture target has no unread native post scene');
    const priorFixture = window.__r77AssistedFixture;
    window.__r77AssistedFixture = {
      error: null,
      result: null,
      target: targetId,
      phase: 'native-post-queue',
      canonicalUnlockRefresh: priorFixture?.canonicalUnlockRefresh === true,
      unlockCheck: priorFixture?.unlockCheck || null,
      entry: priorFixture?.entry || null
    };
    playScenes(scenes, () => {
      try {
        completeRegion(targetId);
        const destination = firstPending('STORY')?.id || null;
        const direction = Object.keys(regionById[targetId].exits || {}).find(
          d => regionById[targetId].exits[d] === destination
        );
        const portal = direction && window.__STORYWORLD_ROUTES_R72__.status(direction);
        if (!destination || !portal?.open || !portal.point) throw Error('Native post completion did not open the canonical next portal');
        player.x = portal.point.x;
        player.y = portal.point.y;
        cam = {x: player.x, y: player.y};
        route = [];
        command = null;
        const nextPlanThrottle = window.__r77AssistedFixture.nextPlanThrottle = {
          label: 'one-frame nextPlan-throttle simulation',
          installed: false,
          pending: true,
          used: false,
          restoredImmediately: false,
          restoredOnCleanup: false
        };
        const originalGuideStep = guideStep;
        const throttledGuideStep = function(...args) {
          if (nextPlanThrottle.pending) {
            nextPlanThrottle.pending = false;
            guideStep = originalGuideStep;
            nextPlanThrottle.used = true;
            nextPlanThrottle.restoredImmediately = guideStep === originalGuideStep;
            return;
          }
          return originalGuideStep.apply(this, args);
        };
        window.__r77GuideStepThrottleOriginal = originalGuideStep;
        window.__r77GuideStepThrottleWrapper = throttledGuideStep;
        guideStep = throttledGuideStep;
        nextPlanThrottle.installed = guideStep === throttledGuideStep;
        window.__r77AssistedFixture.result = {
          target: targetId,
          destination,
          direction,
          part: 'post',
          sceneCount: scenes.length,
          open: portal.open,
          portalPositionFixture: true,
          nextPlanThrottleFixture: nextPlanThrottle.label,
          nextPlanThrottleInstalled: nextPlanThrottle.installed
        };
      } catch (error) {
        const nextPlanThrottle = window.__r77AssistedFixture?.nextPlanThrottle;
        if (nextPlanThrottle?.pending && guideStep === window.__r77GuideStepThrottleWrapper) {
          guideStep = window.__r77GuideStepThrottleOriginal;
          nextPlanThrottle.pending = false;
          nextPlanThrottle.restoredOnCleanup = guideStep === window.__r77GuideStepThrottleOriginal;
        }
        window.__r77AssistedFixture.error = String(error?.stack || error);
      }
    });
    return {
      scenes: scenes.map(scene => ({
        key: scene.key,
        part: scene.part,
        title: scene.title,
        textLength: String(scene.text || '').trim().length
      })),
      current: storyScene ? {key: storyScene.key, part: storyScene.part} : null,
      guideVersion: window.__STORYWORLD_GUIDE_R77__.inspect().revision,
      policy: window.__STORYWORLD_GUIDE_R77__.policy,
      scheduled: window.__STORYWORLD_GUIDE_R77__.inspect().scene.scheduled
    };
  }, fixture.target);
  assert.ok(opened.scenes.length > 0);
  assert.ok(opened.scenes.length <= 4, 'assisted authored post queue must stay within the bounded timer test');
  assert.ok(opened.scenes.every(scene => scene.part === 'post'));
  assert.equal(opened.current?.part, 'post');
  assert.equal(opened.scheduled, true);
  await capture(page, '04-fixture-late-boss-post.png');

  const pauseResume = await page.evaluate(() => {
    const guideApi = window.__STORYWORLD_GUIDE_R77__;
    guide = false;
    guideApi.syncGuide();
    const off = guideApi.inspect();
    guide = true;
    guideApi.syncGuide();
    const on = guideApi.inspect();
    return {
      offScheduled: off.scene.scheduled,
      offCancelled: off.events.some(e => e.kind === 'timer-cancel' && e.reason === 'guide-off'),
      onScheduled: on.scene.scheduled,
      rearmed: on.events.some(e => e.kind === 'scene-timer-armed' && e.key === storyScene?.key)
    };
  });
  assert.equal(pauseResume.offScheduled, false);
  assert.equal(pauseResume.offCancelled, true);
  assert.equal(pauseResume.onScheduled, true);
  assert.equal(pauseResume.rearmed, true);

  const completed = await page.waitForFunction(
    () => {
      const state = window.__r77AssistedFixture;
      return state && (state.error || state.result) ? state : null;
    },
    null,
    {timeout: 240000}
  );
  const completionValue = await completed.jsonValue();
  if (completionValue.error) throw Error(completionValue.error);
  assert.equal(completionValue.result.target, fixture.target);
  assert.equal(completionValue.result.destination, fixture.next);
  assert.equal(completionValue.result.open, true);
  const postAutoContinue = await page.evaluate(keys => {
    const events = window.__STORYWORLD_GUIDE_R77__.inspect().events;
    const autoContinues = events.filter(e => e.kind === 'scene-auto-continue' && keys.includes(e.key));
    return {
      autoContinues,
      missing: keys.filter(key => !autoContinues.some(e => e.key === key)),
      scene: storyScene ? {key: storyScene.key, part: storyScene.part} : null
    };
  }, opened.scenes.map(scene => scene.key));
  assert.deepEqual(postAutoContinue.missing, [], 'R77 must auto-Continue every assisted native post scene');
  assert.equal(postAutoContinue.autoContinues.length, opened.scenes.length);

  await page.waitForFunction(
    expected => zone === expected.next && layer === 'STORY' && !loading &&
      window.__STORYWORLD_GUIDE_R77__.inspect().events.some(
        e => e.kind === 'normal-intent-consumed' && e.from === expected.target && e.destination === expected.next
      ),
    {target: fixture.target, next: fixture.next},
    {timeout: 60000}
  );
  const reached = await page.evaluate(() => {
    const guideState = window.__STORYWORLD_GUIDE_R77__.inspect();
    const campaign = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect();
    return {
      zone,
      layer,
      guide: guideState.revision,
      tier: campaign.tier,
      hpMultiplier: campaign.hpMultiplier,
      roomTier: room?.difficultyR63,
      cheat777: window.__STORYWORLD_CHEAT777__?.active?.() === true,
      coopMode: window.__STORYWORLD_COOP_SIM_R62__?.mode?.() || 'off',
      intent: guideState.events.filter(e =>
        ['normal-intent-armed', 'normal-intent-consumed'].includes(e.kind) && e.from === window.__r77AssistedFixture.result.target
      ),
      nextPlanThrottle: window.__r77AssistedFixture.nextPlanThrottle || null,
      fixture: window.__r77AssistedFixture.result,
      scene: storyScene ? {key: storyScene.key, part: storyScene.part} : null
    };
  });
  assert.equal(reached.zone, fixture.next);
  assert.equal(reached.layer, 'STORY');
  assert.equal(reached.guide, 'R77-GUIDE-NORMAL');
  assert.equal(reached.tier, 'normal');
  assert.equal(reached.hpMultiplier, 0.25);
  assert.equal(reached.cheat777, false);
  assert.equal(reached.coopMode, 'off');
  assert.ok(reached.intent.some(e => e.kind === 'normal-intent-armed' &&
    e.destination === fixture.next && e.dispatch === 'native-proximity'));
  assert.ok(reached.intent.some(e => e.kind === 'normal-intent-consumed' && e.destination === fixture.next));
  assert.equal(reached.nextPlanThrottle.label, 'one-frame nextPlan-throttle simulation');
  assert.equal(reached.nextPlanThrottle.installed, true);
  assert.equal(reached.nextPlanThrottle.used, true);
  assert.equal(reached.nextPlanThrottle.restoredImmediately, true);
  assert.equal(reached.nextPlanThrottle.pending, false);
  await capture(page, '05-fixture-next-portal-normal.png');
  report.assistedBossPortal = {
    ok: true,
    guideVersion: reached.guide,
    sourceMap: fixture.target,
    targetCampaignIndex: fixture.index,
    campaignLength: fixture.orderLength,
    destination: reached.zone,
    tier: reached.tier,
    hpMultiplier: reached.hpMultiplier,
    normalIntent: reached.intent,
    nativePostScenes: opened.scenes,
    nativePostUIContinues: 0,
    nativePostAutoContinues: postAutoContinue.autoContinues,
    guideOFFReenableSceneFixture: pauseResume,
    fixtureOnly: {
      syntheticPriorCanonicalProgress: fixture.priorProgressMarks,
      canonicalUnlockRefresh: fixture.canonicalUnlockRefresh,
      unlockCheck: fixture.unlockCheck,
      entry: fixture.entry,
      nativeAuthoredPostAndCompleteCallback: true,
      portalPositionFixture: true,
      nextPlanThrottle: reached.nextPlanThrottle,
      enemyHPChanges: false,
      enemyKills: false,
      cheat777: false,
      warpEntry: false
    }
  };
}

try {
  await fs.mkdir(out, {recursive: true});
  browser = await chromium.launch({
    headless: true,
    chromiumSandbox: true,
    args: ['--disable-dev-shm-usage']
  });
  const naturalPage = await naturalEarly();
  if (publicSmoke) {
    assert.deepEqual(report.errors, []);
    report.ok = true;
  } else {
    await naturalPage.context().close();
    await nativeSaveCompatibility();
    await assistedBossPortalFixture();
    assert.deepEqual(report.errors, []);
    report.ok = true;
  }
} catch (error) {
  report.ok = false;
  report.error = String(error?.stack || error);
  report.debug = await activePage?.evaluate(() => ({
    zone: typeof zone === 'undefined' ? null : zone,
    layer: typeof layer === 'undefined' ? null : layer,
    loading: typeof loading === 'undefined' ? null : loading,
    started: typeof started === 'undefined' ? null : started,
    modal: typeof modal === 'undefined' ? null : modal,
    guide: typeof guide === 'undefined' ? null : guide,
    scene: typeof storyScene === 'undefined' ? null : storyScene && {key: storyScene.key, part: storyScene.part},
    panel: document.getElementById('panel')?.innerText || '',
    guideState: window.__STORYWORLD_GUIDE_R77__?.inspect?.() || null,
    campaign: window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.() || null,
    fixture: window.__r77AssistedFixture || null
  })).catch(() => null);
} finally {
  for (const context of contexts.reverse()) {
    for (const page of context.pages()) {
      await page.evaluate(() => {
        const fixture = window.__r77AssistedFixture;
        const throttle = fixture?.nextPlanThrottle;
        const original = window.__r77GuideStepThrottleOriginal;
        if (throttle?.pending && typeof original === 'function' &&
            guideStep === window.__r77GuideStepThrottleWrapper) {
          guideStep = original;
          throttle.pending = false;
          throttle.restoredOnCleanup = guideStep === original;
        }
      }).catch(() => {});
    }
    await context.close().catch(() => {});
  }
  await browser?.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  const reportPath = out + (publicSmoke ? '/public-browser.json' : '/browser.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(marker + ' ' + JSON.stringify(report));
}

if (!report.ok) process.exitCode = 1;
