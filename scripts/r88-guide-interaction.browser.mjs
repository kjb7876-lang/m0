import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const url = process.env.STORYWORLD_URL;
assert.ok(url, 'STORYWORLD_URL must name the exact candidate or public Pages site');
const publicSmoke = process.env.R88_PUBLIC_SMOKE === '1';
const marker = publicSmoke
  ? 'R88_GUIDE_INTERACTION_PUBLIC_SMOKE_RESULT'
  : 'R88_GUIDE_INTERACTION_BROWSER_RESULT';
const out = 'out/r88/guide-interaction';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const commit = process.env.GITHUB_SHA ||
  execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const report = {
  schema: 'storyworld.r88-guide-interaction-browser.v1',
  mode: publicSmoke ? 'public-natural-input-smoke' : 'candidate-natural-input-smoke',
  url,
  commit,
  htmlSHA256: null,
  sandbox: true,
  softwareGPU: null,
  physicalGPU: false,
  physicalDevice: false,
  gpuScope: 'GPU identity is not queried by this input smoke; physicalGPU and physicalDevice are unverified, not observed hardware classifications.',
  scope: 'Fresh isolated browser context and native UI start. Guide walks to the first portal and waits for a real E key; native Normal difficulty UI enters the first STORY ward. Verify its original route phase, deferred boss-door narrative, locked boss door and resumed guide walking. This early smoke does not clear the field, open boss-door narrative or test narrative auto-Continue; no battle completion, forced HP, progress, warp or position fixtures.',
  naturalEarly: null,
  portalInteraction: null,
  naturalBattleVerified: false,
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
    () => window.__STORYWORLD_GUIDE_R77__?.inspect?.().revision === 'R77-GUIDE-NORMAL' &&
      window.__STORYWORLD_PORTAL_INTERACTION_R83__?.revision === 'R83-EXPLICIT-PORTALS',
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
  // those body cards as a player while guidance is still OFF during setup.
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
  const hubOrigin = await page.evaluate(() => ({zone, x: player.x, y: player.y}));
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

  // R83 deliberately preserves guide walking while stopping every crossing.
  // Observe the native route; never teleport the player or call travel directly.
  await page.waitForFunction(
    origin => zone === origin.zone && guide === true && player.hp > 0 &&
      Math.hypot(player.x - origin.x, player.y - origin.y) > 0.25,
    hubOrigin,
    {timeout: 30000}
  );
  await page.waitForFunction(
    destination => {
      const portalApi = window.__STORYWORLD_PORTAL_INTERACTION_R83__;
      const portal = portalApi?.nearby?.();
      return zone === 'hub' && layer === 'STORY' && guide === true && !loading && !modal &&
        portalApi.inspect().waitingForKey && portal?.open === true && portal.destination === destination;
    },
    expected.destination,
    {timeout: 60000}
  );
  const stopped = await page.evaluate(origin => ({
    zone, layer, guide, loading, modal,
    position: {x: player.x, y: player.y},
    movementFromFreshStart: Math.hypot(player.x - origin.x, player.y - origin.y),
    routeLength: route.length,
    command,
    blocked: blocked(player.x, player.y, .31),
    policy: window.__STORYWORLD_PORTAL_INTERACTION_R83__.inspect(),
    nearby: window.__STORYWORLD_PORTAL_INTERACTION_R83__.nearby(),
    intent: window.__STORYWORLD_GUIDE_R77__.inspect().intent,
    difficulty: window.__STORYWORLD_PROGRESSION_R71__.difficultyState(),
    hint: document.getElementById('hint')?.textContent || ''
  }), hubOrigin);
  assert.equal(stopped.zone, 'hub');
  assert.equal(stopped.guide, true);
  assert.ok(stopped.movementFromFreshStart > 0.25, 'guide must walk automatically from the native spawn');
  assert.equal(stopped.blocked, false);
  assert.equal(stopped.routeLength, 0);
  assert.equal(stopped.command, null);
  assert.equal(stopped.policy.requiresInteraction, true);
  assert.equal(stopped.policy.guideWalks, true);
  assert.equal(stopped.policy.guideCrossesPortals, false);
  assert.equal(stopped.policy.waitingForKey, true);
  assert.equal(stopped.intent, null, 'idle guidance must not arm the old automatic Normal portal dispatch');
  assert.equal(stopped.difficulty.open, false);
  assert.match(stopped.hint, /E/);
  const idleMs = 3000;
  await page.waitForTimeout(idleMs);
  const idle = await page.evaluate(position => ({
    zone, layer, guide, loading, modal,
    displacement: Math.hypot(player.x - position.x, player.y - position.y),
    policy: window.__STORYWORLD_PORTAL_INTERACTION_R83__.inspect(),
    intent: window.__STORYWORLD_GUIDE_R77__.inspect().intent,
    difficulty: window.__STORYWORLD_PROGRESSION_R71__.difficultyState()
  }), stopped.position);
  assert.equal(idle.zone, 'hub', 'waiting at the portal must not auto-cross');
  assert.equal(idle.layer, 'STORY');
  assert.equal(idle.guide, true);
  assert.equal(idle.loading, false);
  assert.equal(idle.modal, false);
  assert.ok(idle.displacement < 0.05, 'guide must remain stopped at the portal');
  assert.equal(idle.policy.waitingForKey, true);
  assert.equal(idle.intent, null);
  assert.equal(idle.difficulty.open, false);
  await capture(page, '02-guide-stopped-until-E.png');

  // A browser keyboard event goes through the real keydown/interact chain.
  // R83 no longer arms R77's automatic Normal intent. Choose Normal through
  // the existing difficulty UI instead of manufacturing that old intent.
  await page.keyboard.press('KeyE');
  await page.waitForFunction(
    () => window.__STORYWORLD_PROGRESSION_R71__.difficultyState().open === true,
    null,
    {timeout: 15000}
  );
  const afterE = await page.evaluate(() => ({
    zone, guide,
    difficulty: window.__STORYWORLD_PROGRESSION_R71__.difficultyState()
  }));
  assert.equal(afterE.zone, 'hub', 'E admits native difficulty selection before map entry');
  assert.equal(afterE.guide, true);
  assert.equal(afterE.difficulty.mapId, expected.destination);
  await page.locator('#r71DifficultyNormal').click({timeout: 10000});
  await page.locator('#r71DifficultyConfirm').click({timeout: 10000});
  await page.waitForFunction(
    destination => zone === destination && layer === 'STORY' && !loading && !modal &&
      room?.difficultyR63 === 'normal',
    expected.destination,
    {timeout: 60000}
  );
  report.portalInteraction = {
    ok: true, stopped, idle: {...idle, observedMs: idleMs}, afterE,
    crossingInput: 'Playwright keyboard.press(KeyE)',
    difficultyInput: 'native Normal card and Confirm clicks',
    automaticWalkingPreserved: true,
    automaticCrossing: false,
    noPositionOrProgressFixture: true
  };
  // Current wards keep the original pre-boss narrative behind the boss door.
  // First entry must preserve that native route gate, not open a scene early.
  const entered = await page.evaluate(() => {
    const guideState = window.__STORYWORLD_GUIDE_R77__.inspect();
    const campaign = window.__STORYWORLD_CAMPAIGN_R63R1__.inspect();
    const ward = window.__STORYWORLD_WORLD_COMBAT_R78__;
    const state = ward.state(room);
    const doorId = room.exploration?.bossDoorId;
    const door = room.exploration?.worldR74?.doors?.find(row => row.id === doorId);
    return {
      zone, layer, guide, modal, hero: player.hero,
      guideVersion: guideState.revision,
      campaign: {tier: campaign.tier, hpMultiplier: campaign.hpMultiplier, roomTier: room?.difficultyR63},
      ward: {present: !!room.exploration?.worldWardR81, controlled: ward.controlled(room), state},
      bossDoor: door ? {id: door.id, open: window.__STORYWORLD_WORLD_R74__.isOpen(room, door)} : null,
      scene: storyScene ? {key: storyScene.key, part: storyScene.part} : null,
      guideSceneScheduled: guideState.scene.scheduled,
      normalIntent: guideState.intent,
      cheat777: window.__STORYWORLD_CHEAT777__?.active?.() === true,
      coopMode: window.__STORYWORLD_COOP_SIM_R62__?.mode?.() || 'off',
      position: {x: player.x, y: player.y},
      renderer: window.__STORYWORLD_PHASE1__?.controller?.inspect?.().active || null
    };
  });
  assert.equal(entered.zone, expected.destination);
  assert.equal(entered.layer, 'STORY');
  assert.equal(entered.guide, true);
  assert.equal(entered.modal, false);
  assert.equal(entered.guideVersion, 'R77-GUIDE-NORMAL');
  assert.equal(entered.campaign.tier, 'normal');
  assert.equal(entered.campaign.hpMultiplier, 0.25);
  assert.equal(entered.campaign.roomTier, 'normal');
  assert.equal(entered.cheat777, false);
  assert.equal(entered.coopMode, 'off');
  assert.equal(entered.ward.present, true);
  assert.equal(entered.ward.controlled, true);
  assert.equal(entered.ward.state.phase, 'route');
  assert.equal(entered.ward.state.doorStoryDone, false);
  assert.ok(entered.bossDoor, 'first ward must retain its native boss door');
  assert.equal(entered.bossDoor.open, false, 'field-clear and boss-door interaction still own narrative admission');
  assert.equal(entered.scene, null, 'the route phase defers pre-boss narrative to its original boss door');
  assert.equal(entered.guideSceneScheduled, false);
  assert.equal(entered.normalIntent, null, 'explicit E uses native difficulty selection');
  await capture(page, '03-natural-first-map-ward.png');

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
  await capture(page, '04-natural-ward-guide-walking.png');
  report.naturalEarly = {
    ok: true,
    freshUI: fresh,
    firstCanonicalDestination: expected.destination,
    guideVersion: entered.guideVersion,
    actualNormal: entered.campaign,
    nativeWardEntry: entered,
    narrativeScope: 'Native pre-boss narrative belongs to the original locked boss-door interaction after field clear. This early route smoke leaves that gate intact and does not claim to exercise its narrative timer.',
    narrativeAutoContinueVerified: false,
    fieldProgress,
    noForcedEnemyHP: true,
    noForcedKills: true,
    noSyntheticProgression: true,
    noPositionFixture: true,
    no777OrWarp: true
  };
  return page;
}

try {
  await fs.mkdir(out, {recursive: true});
  browser = await chromium.launch({
    headless: true,
    chromiumSandbox: true,
    args: ['--disable-dev-shm-usage']
  });
  await naturalEarly();
  assert.deepEqual(report.errors, []);
  report.ok = true;
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
    portalState: window.__STORYWORLD_PORTAL_INTERACTION_R83__?.inspect?.() || null,
    guideState: window.__STORYWORLD_GUIDE_R77__?.inspect?.() || null,
    campaign: window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.() || null
  })).catch(() => null);
} finally {
  for (const context of contexts.reverse()) await context.close().catch(() => {});
  await browser?.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  const reportPath = out + (publicSmoke ? '/public-browser.json' : '/browser.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(marker + ' ' + JSON.stringify(report));
}

if (!report.ok) process.exitCode = 1;
