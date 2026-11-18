'use strict';

// Run against a built site (SW_URL). SHOTS optionally retains state, timings and screenshots.
// The browser emulates the display and touch input. Its timings depend on the host and GPU.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');
const timeout = 180000;

async function dismissScene(page) {
  await page.evaluate(() => {
    for (let i = 0; i < 200 && storyScene; i++) advanceScene();
    if (modal) closePanel(true);
  });
}

async function enterField(page, samong) {
  await page.locator('#campaignNew54').tap({ timeout });
  await page.locator('#slotConfirmR73').tap();
  await page.waitForFunction(() => started && !loading, null, { timeout });
  await dismissScene(page);
  // Supply a progressed normal save so both areas are reachable without enabling 777.
  const restored = await page.evaluate(async samong => {
    const save = serializeSave();
    for (const region of Object.values(regionById)) {
      if (samong || region.index < regionById.dist02.index) save.progress.STORY[region.id] = true;
      if (samong) save.progress.DREAM[region.id] = true;
    }
    if (samong) save.ending.STORY = true;
    return await restoreSave(save);
  }, samong);
  assert.notEqual(restored, false);
  await dismissScene(page);
  const entered = await page.evaluate(async samong => samong
    ? await __STORYWORLD_SAMONG_R103__.goZone('sz115-P-2')
    : await enterRegion('dist02', null, { layer: 'STORY', restore: true, noStory: true }), samong);
  assert.ok(entered);
  await page.waitForFunction(samong => !loading && (samong
    ? layer === 'DREAM' && __STORYWORLD_SAMONG_R103__.here() && room.samongR103?.zone === 'sz115-P-2'
    : layer === 'STORY' && room.id === 'dist02' && !__STORYWORLD_SAMONG_R103__.here()), samong, { timeout });
  await dismissScene(page);
  await page.evaluate(() => { auto = false; guide = false; });
}

async function tapAndMeasure(page, direction) {
  const point = await page.evaluate(direction => {
    const point = project(player.x + 2 * direction, player.y - direction);
    const bounds = canvas.getBoundingClientRect();
    const x = Math.round(bounds.left + point.x * bounds.width / W);
    const y = Math.round(bounds.top + point.y * bounds.height / H);
    return { x, y, interactive: document.elementFromPoint(x, y) === canvas };
  }, direction);
  assert.ok(point.interactive, 'movement tap must reach the game canvas');
  await page.touchscreen.tap(point.x, point.y);
  return await page.evaluate(() => new Promise(resolve => {
    const intervals = [];
    const start = time;
    let lastStamp, lastX = player.x, lastY = player.y, distance = 0, peakEnemies = 0;
    function sample(stamp) {
      if (lastStamp !== undefined) intervals.push(stamp - lastStamp);
      distance += Math.hypot(player.x - lastX, player.y - lastY);
      lastStamp = stamp;
      lastX = player.x;
      lastY = player.y;
      peakEnemies = Math.max(peakEnemies, room.enemies.filter(e => e.hp > 0).length);
      if (intervals.length < 36) return requestAnimationFrame(sample);
      intervals.sort((a,b) => a-b);
      resolve({ gameSeconds: time - start, distance, peakEnemies, health: player.hp,
        frameMedianMs: intervals[17], frameP95Ms: intervals[34] });
    }
    requestAnimationFrame(sample);
  }));
}

async function run(browser, mode) {
  const samong = mode === 'samong';
  const context = await browser.newContext({ ...devices['iPhone 13 Mini landscape'],
    viewport: {width:812, height:375}, screen: {width:812, height:375}, deviceScaleFactor:3 });
  try {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => undefined, configurable: true });
      let seed = 1807711;
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(timeout);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.SW_URL || 'http://127.0.0.1:4396/', { waitUntil: 'domcontentloaded', timeout });
    await enterField(page, samong);
    const env = await page.evaluate(() => ({
      renderer: __STORYWORLD_PHASE1__.controller.state.active, coarse: matchMedia('(pointer:coarse)').matches,
      devicePixelRatio, deviceMemory: typeof navigator.deviceMemory, layer, room: room.id,
      samong: room.samongR103?.zone || null, cheat: __STORYWORLD_CHEAT777__.active(),
      touch: navigator.maxTouchPoints, rendererDpr: dpr, canvas: [canvas.width, canvas.height]
    }));
    assert.equal(env.renderer, 'three');
    assert.ok(env.coarse && env.touch > 0 && env.devicePixelRatio === 3);
    assert.equal(env.deviceMemory, 'undefined');
    assert.equal(env.cheat, false);
    // Let camera/viewport and the first shader uploads settle before sampling movement.
    await page.evaluate(() => new Promise(resolve => {
      let frames = 0;
      const warm = () => ++frames >= 12 ? resolve() : requestAnimationFrame(warm);
      requestAnimationFrame(warm);
    }));
    const samples = [];
    for (const direction of [1, -1, 1]) samples.push(await tapAndMeasure(page, direction));
    assert.ok(samples.every(s => s.gameSeconds > 0 && s.peakEnemies > 0), 'combat simulation progresses');
    assert.ok(samples.some(s => s.distance > 0.1), 'hero moves in response to touch');
    assert.deepEqual(errors, []);
    if (process.env.SHOTS) {
      fs.mkdirSync(process.env.SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SHOTS, mode+'.png') });
      fs.writeFileSync(path.join(process.env.SHOTS, mode+'.json'), JSON.stringify({env, samples}, null, 2)+'\n');
    }
    console.log('PASS', mode, JSON.stringify({env, samples}));
  } finally { await context.close(); }
}

async function main() {
  const useWebKit = !!process.env.WEBKIT_EXECUTABLE_PATH;
  const browser = useWebKit ? await webkit.launch({executablePath: process.env.WEBKIT_EXECUTABLE_PATH})
    : await chromium.launch({executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_PATH,
      args: ['--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    for (const mode of ['story','samong']) await run(browser, mode);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
