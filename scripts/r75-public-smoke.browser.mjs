import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const url = process.env.STORYWORLD_URL;
assert.ok(url, 'STORYWORLD_URL must name the exact candidate or public Pages site');
const report = {url, commit: process.env.GITHUB_SHA || 'working-tree', sandbox: true,
  softwareGPU: true, physicalGPU: false, physicalDevice: false,
  scope: 'Fresh browser: normal new game, native keyboard movement, native save/reload/Continue. Exact native source cards are explicitly opened as a missing-audio probe; no battle, progress, HP or warp fixtures.',
  cases: [], errors: [], voiceRequests: []};
const browser = await chromium.launch({headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage']});
const page = await browser.newPage({viewport: {width: 1200, height: 800}});
page.on('pageerror', e => report.errors.push(e.message));
page.on('request', r => {if (r.resourceType() === 'media' && /story-narration/.test(r.url())) report.voiceRequests.push(r.url());});
const check = (name, data) => report.cases.push({name, ok: true, data});
try {
  const response = await page.goto(url, {timeout: 90000});
  assert.equal(response.status(), 200);
  await page.locator('#campaignNew54').click({timeout: 90000});
  await page.locator('#slotConfirmR73').click();
  await page.waitForFunction(() => started && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy, null, {timeout: 90000});
  await page.waitForFunction(() => window.__STORYWORLD_PHASE1__.controller.inspect().active === 'three', null, {timeout: 30000});
  const initial = await page.evaluate(() => ({zone, hp: player.hp, hero: player.hero, source: window.__STORYWORLD_NARRATIVE_R75__.inspect(), blocked: blocked(player.x, player.y, .31)}));
  assert.equal(initial.zone, 'hub'); assert.equal(initial.blocked, false); assert.ok(initial.hp > 0);
  assert.equal(initial.source.sceneCount, 62); assert.equal(initial.source.audioScenes, 0);
  assert.equal(initial.source.sourceSha256, '47a09cda7444df1bc2a09063da0748b367029f5c1fdeffb5660c477e6c60bd7a');
  check('boot-new-game-and-actual-WebGL-renderer', initial);
  const origin = await page.evaluate(() => ({x: player.x, y: player.y}));
  for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
    await page.keyboard.down(key);
    try { await page.waitForFunction(q => Math.hypot(player.x-q.x, player.y-q.y) > .05, origin, {timeout: 3000}); }
    catch {} finally { await page.keyboard.up(key); }
    if (await page.evaluate(q => Math.hypot(player.x-q.x, player.y-q.y) > .05, origin)) break;
  }
  const movement = await page.evaluate(q => ({distance: Math.hypot(player.x-q.x, player.y-q.y), blocked: blocked(player.x, player.y, .31)}), origin);
  assert.ok(movement.distance > .05); assert.equal(movement.blocked, false);
  check('normal-keyboard-movement-without-position-fixture', movement);
  const saved = await page.evaluate(() => ({ok: saveGame(false), progress: JSON.stringify(progress), hero: player.hero, zone}));
  assert.equal(saved.ok, true);
  await page.reload();
  await page.locator('#campaignContinue54').click({timeout: 90000});
  await page.waitForFunction(() => started && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy, null, {timeout: 90000});
  const restored = await page.evaluate(() => ({progress: JSON.stringify(progress), hero: player.hero, zone, hp: player.hp}));
  assert.equal(restored.progress, saved.progress); assert.equal(restored.hero, saved.hero); assert.equal(restored.zone, saved.zone); assert.ok(restored.hp > 0);
  check('native-normal-save-page-reload-and-Continue', restored);
  await page.evaluate(() => { settings.narration = true; window.__r75AudioProbeDone = false; playScenes(nextScenes(regionById.dist00, 'pre'), () => {window.__r75AudioProbeDone = true;}); });
  let cards = 0;
  while (await page.evaluate(() => !!storyScene)) {
    assert.ok(cards++ < 8, 'native source queue must finish');
    await page.locator('#storyAudio').click();
    await page.waitForFunction(() => /텍스트/.test(document.getElementById('voiceStatus')?.textContent || '') && !voiceElement, null, {timeout: 10000});
    await page.locator('#storyNext').click();
  }
  assert.ok(cards > 0); assert.equal(await page.evaluate(() => window.__r75AudioProbeDone), true);
  assert.deepEqual(report.voiceRequests, []); assert.deepEqual(report.errors, []);
  check('missing-new-audio-falls-back-to-text-without-old-media-or-blocked-Continue', {cards, voiceRequests: report.voiceRequests});
  report.ok = true;
  console.log('R75_PUBLIC_SMOKE', JSON.stringify(report));
} catch (error) {
  report.ok = false; report.error = String(error.stack);
  report.debug = await page.evaluate(() => ({zone, loading, started, modal, scene: storyScene?.part, panel: document.getElementById('panel')?.innerText})).catch(() => null);
  console.error('R75_PUBLIC_SMOKE_FAILURE', JSON.stringify(report));
  throw error;
} finally {
  await fs.mkdir('out/r75', {recursive: true});
  await fs.writeFile('out/r75/public-smoke.json', JSON.stringify(report, null, 2));
  await browser.close();
}
