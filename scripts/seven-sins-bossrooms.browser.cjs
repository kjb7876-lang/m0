// Assisted STORY room capture; this is not natural-play or physical-device QA.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { chromium } = require('playwright');
const out = process.env.SINS_EVIDENCE_DIR || '/workspace/seven-sins-evidence';
const phase = process.argv[2] || 'after';
const detail = process.argv.includes('--detail');
const camera = detail ? { x: 21, y: 10 } : { x: 16, y: 11 };
assert(['before', 'after'].includes(phase), 'Use before or after');
fs.mkdirSync(out, { recursive: true });
const zones = ['ep1b02', 'ep1b03', 'ep1b04', 'ep1b05', 'ep1b06', 'ep1b07', 'ep1b08'];
(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 30000,
    executablePath: '/usr/bin/chromium', args: ['--disable-dev-shm-usage'] });
  try {
    for (const mobile of detail ? [true] : [false, true]) {
      const device = mobile ? 'mobile' : 'pc';
      const page = await browser.newPage(mobile
        ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
        : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      const pageErrors = [], failedResources = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) failedResources.push({ url: r.url(), status: r.status() }); });
      if (phase === 'before') await page.route('**/seven-sins-bossrooms.js', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
      await page.goto(process.env.SINS_TEST_URL || 'http://127.0.0.1:4398/');
      await page.locator('#campaignNew54').click({ timeout: 90000 });
      await page.locator('#slotConfirmR73').click();
      await page.waitForFunction(() => started && !loading, null, { timeout: 90000 });
      await page.evaluate(async () => {
        for (let i = 0; i < 80 && storyScene; i++) advanceScene();
        if (modal && !storyScene) closePanel(true);
        settings.sound = false; settings.music = false; settings.narration = false;
        auto = false; guide = false;
        await __STORYWORLD_CHEAT777__.activate('777');
      });
      for (const id of zones) {
        await page.evaluate(async target => {
          if (typeof closePanel === 'function') closePanel(true);
          storyScene = null;
          await __STORYWORLD_CHEAT777__.go(target, 'STORY');
          if (__STORYWORLD_PROGRESSION_R71__.difficultyState().open) {
            __STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal');
            await __STORYWORLD_PROGRESSION_R71__.confirmDifficulty();
          }
        }, id);
        await page.waitForFunction(target => zone === target && !loading, id, { timeout: 90000 });
        await page.evaluate(position => {
          if (typeof closePanel === 'function') closePanel(true);
          storyScene = null; player.x = position.x; player.y = position.y; cam = { ...position };
          auto = false; guide = false; route = []; command = null; modal = true; player.invincible = 99999;
        }, camera);
        // Let async texture loads and the actual render loop settle; state is paused.
        await page.waitForTimeout(2000);
        const state = await page.evaluate(() => ({
          zone, gameErrors: [...errors],
          sins: window.__STORYWORLD_SIN_BOSSROOMS__?.inspect(),
          mammon: window.__STORYWORLD_MAMMON_BOSSROOM__?.inspect(),
          renderer: window.__STORYWORLD_PHASE1__?.controller?.state?.reason,
          three: !!window.__STORYWORLD_PHASE1__?.controller?.state?.three,
          camera: { x: cam.x, y: cam.y, zoom, player: { x: player.x, y: player.y } },
          drawCalls: window.__STORYWORLD_PHASE1__?.controller?.state?.three?.renderer?.info?.render?.calls,
          bossPoints: room.exploration?.worldWardR81?.bossPoints,
          doors: room.exploration?.worldR74?.doors,
          furnitureWalls: room.exploration?.walls?.filter(w => w.sinFurniture).map(w => ({ id: w.id, height: w.height, r98BaseHeight: w.r98BaseHeight })),
          layoutMarkers: Object.keys(room.exploration || {}).filter(k => /sin|mammon|bossroom/i.test(k))
        }));
        state.pageErrors = [...pageErrors]; state.failedResources = [...failedResources];
        state.viewport = page.viewportSize(); state.deviceScaleFactor = mobile ? 3 : 1;
        state.method = `Chromium headless; 777-assisted normal STORY entry; paused camera fixture (${camera.x},${camera.y})`;
        const name = `${phase}-${id}-${device}${detail ? '-detail' : ''}`;
        await page.screenshot({ path: path.join(out, name + '.png') });
        fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(state, null, 2) + '\n');
        assert.equal(state.zone, id); assert(state.three, 'Three renderer required');
        assert.deepEqual(state.gameErrors, []); assert.deepEqual(pageErrors, []);
        assert.deepEqual(failedResources, [], 'Resources must load');
        if (phase === 'after') {
          assert(state.sins, 'Seven-sins overlay must load');
          assert.equal(state.sins.stats.errors, 0, 'Overlay errors');
          assert.equal(state.mammon.stats.errors, 0, 'Mammon regression');
          assert(state.furnitureWalls.every(w => w.height <= .011), 'Native furniture collision meshes must remain floor-height');
        }
        console.log(JSON.stringify({ capture: name, zone: state.zone, renderer: state.renderer,
          sins: state.sins, pageErrors, failedResources }));
      }
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
