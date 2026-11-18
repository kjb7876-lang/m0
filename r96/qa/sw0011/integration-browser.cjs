'use strict';

// A controlled combat trial in the built game. One isolated browser context per death.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const url = process.env.SW_URL || 'http://127.0.0.1:4396/';
const shots = process.env.SHOTS;
const timeout = 180000;

async function enterSurvival(page, stage) {
  await page.locator('#survivalStartR600').click({ timeout });
  await page.locator('[data-r600diff="normal"]').click();
  await page.locator('[data-r600hero="hwando"]').click();
  await page.locator('#r600Go').click();
  const waitReady = i => page.waitForFunction(i => {
    const api = window.__STORYWORLD_SURVIVAL_R600__;
    return api.here() && !loading && api.state().ready && api.state().i === i;
  }, i, { timeout });
  await waitReady(0);
  if (stage) {
    assert.equal(await page.evaluate(i => __STORYWORLD_SURVIVAL_R600__.qaGo(i), stage), true);
    await waitReady(stage);
  }
}

function dismissScenes(page) {
  return page.evaluate(() => {
    for (let i = 0; i < 160 && storyScene; i++) advanceScene();
    if (modal) closePanel(true);
  });
}

async function enter777(page, chapter) {
  await page.locator('#campaignNew54').click({ timeout });
  await page.locator('#slotConfirmR73').click();
  await page.waitForFunction(() => started && !loading, null, { timeout });
  await dismissScenes(page);
  const activation = await page.evaluate(() => __STORYWORLD_CHEAT_LEVEL_R970__.activate('777', 1));
  assert.equal(activation.ok, true, JSON.stringify(activation));
  await page.waitForFunction(() => !loading && __STORYWORLD_CHEAT777__.active(), null, { timeout });
  await dismissScenes(page);
  const zone = await page.evaluate(chapter => {
    const regions = Object.values(regionById).filter(r => !r.safe && r.chapterIndex === chapter);
    return (regions.find(r => r.id === (chapter ? 'cult04' : 'dist02')) || regions[0]).id;
  }, chapter);
  await page.evaluate(z => enterRegion(z, null, { layer: 'STORY', restore: true }), zone);
  await page.waitForFunction(z => !loading && room.id === z, zone, { timeout });
  await dismissScenes(page);
}

async function checkBeam(page, requests) {
  await page.waitForFunction(() => {
    const paths = room.survivalR600.pagedBeam
      ? ['assets/sw0011/beam-0.webp', 'assets/sw0011/beam-1.webp']
      : ['assets/r600/dots/sv-beam-01.webp'];
    return paths.every(p => readyImage(p)?.image?.naturalWidth);
  }, null, { timeout });
  const result = await page.evaluate(() => {
    const api = __STORYWORLD_SURVIVAL_R600__;
    const centre = room.survivalR600.centre;
    const initial = api.inspect().stats.coreShots;
    // Put a live spawn in range and let the normal core attack create the effect.
    for (let i = 0; i < 150 && api.inspect().stats.coreShots === initial; i++) {
      api.finaleWave();
      const enemy = room.enemies.find(e => e.hp > 0 && e.survivalR600);
      if (enemy) {
        enemy.x = centre.x + 2;
        enemy.y = centre.y + 1;
        enemy.hp = Math.max(enemy.hp, 20000);
      }
      tick(1 / 30);
    }
    // Capture source rectangles from the real drawProp path at each animation phase.
    const core = room.props.find(p => p.r600CoreProp);
    const output = document.createElement('canvas');
    const scratch = output.getContext('2d');
    const nativeDraw = scratch.drawImage;
    const cells = [];
    scratch.drawImage = function (image, ...args) {
      if (/sv-beam-01|sw0011\/beam-/.test(image.src)) {
        cells.push({ path: new URL(image.src).pathname, rect: args.slice(0, 4),
          sheet: [image.naturalWidth, image.naturalHeight] });
      }
      return nativeDraw.call(this, image, ...args);
    };
    const saved = { ctx, time };
    try {
      ctx = scratch;
      for (let frame = 0; frame < 24; frame++) {
        time = (frame + 0.2) / 12.5;
        drawProp(core);
      }
    } finally {
      ctx = saved.ctx;
      time = saved.time;
    }
    draw();
    return { cap: __STORYWORLD_PHASE1__.controller.state.three.renderer.capabilities.maxTextureSize,
      fired: api.inspect().stats.coreShots - initial, cells };
  });
  assert.ok(result.fired > 0, 'core must actually fire');
  assert.ok(result.cap >= 2048);
  const paged = result.cap < 12288;
  const seen = new Set(result.cells.map(c => JSON.stringify(c)));
  assert.equal(seen.size, 24, '24 distinct beam frames must be drawn');
  const names = new Set();
  for (let i = 0; i < 24; i++) {
    const suffix = paged ? '/assets/sw0011/beam-' + Math.floor(i / 12) + '.webp'
      : '/assets/r600/dots/sv-beam-01.webp';
    const source = [...requests].find(p => p.endsWith(suffix));
    assert.ok(source, 'missing beam request ' + suffix);
    names.add(source);
    assert.ok(seen.has(JSON.stringify({ path: source,
      rect: [paged ? i % 4 * 512 : i * 512, paged ? Math.floor(i % 12 / 4) * 48 : 0, 512, 48],
      sheet: paged ? [2048, 144] : [12288, 48] })), 'wrong draw rectangle for frame ' + i);
  }
  assert.deepEqual(requests, names);
  return { maxTextureSize: result.cap, selectedSources: [...names], frames: seen.size };
}

async function hitTrial(page, survival) {
  return page.evaluate(survival => {
    // Same melee source and 100 HP at every location. Advance past damage cooldowns
    // between attacks, with no healing, defense inputs or simulated NPC variation.
    const origin = Object.values(regionById).find(r => r.roster?.some(e => e.ai === 'melee'));
    const profile = origin.roster.find(e => e.ai === 'melee');
    const source = actor3(profile, 'qa-melee', player.x + 1, player.y, false, layer, regionById[room.id]);
    const roster = room.enemies;
    roster.push(source);
    player.hp = 100;
    player.shield = 0;
    player.guard = false;
    player.ego = 0;
    player.samong = 0;
    auto = false;
    guide = false;
    const oldRandom = Math.random;
    let seed = 20261118;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const stage = survival ? __STORYWORLD_SURVIVAL_R600__.state().i : regionById[room.id].chapterIndex;
    const damage = survival ? __STORYWORLD_SURVIVAL_R600__.pure.mobDamage(20, false, stage, 0, 'normal') : 20;
    let hits = 0;
    let firstDamage;
    try {
      while (hits < 100 && player.hp > 0 && !modal) {
        time += 2;
        player.invincible = 0;
        hurt(damage, source);
        if (!hits) firstDamage = 100 - player.hp;
        hits++;
      }
      return { room: room.id, stage, rawDamage: damage, firstDamage, hits, endHp: player.hp };
    } finally {
      Math.random = oldRandom;
      const index = roster.indexOf(source);
      if (index >= 0) roster.splice(index, 1);
    }
  }, survival);
}

async function run() {
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_PATH;
  const browser = await chromium.launch({ executablePath,
    args: ['--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const results = { survival: [], test777: [] };
  if (shots) fs.mkdirSync(shots, { recursive: true });
  try {
    for (const [mode, stage] of [['survival', 0], ['survival', 20], ['test777', 0], ['test777', 7]]) {
      const context = await browser.newContext({ viewport: { width: 720, height: 405 }, deviceScaleFactor: 1 });
      try {
        await context.addInitScript(() => localStorage.setItem('storyworld.r183.scene3d', '{"on":false}'));
        const page = await context.newPage();
        const requests = new Set();
        page.on('pageerror', error => errors.push(String(error)));
        page.on('request', req => {
          const p = new URL(req.url()).pathname;
          if (/\/sv-beam-01\.webp$|\/sw0011\/beam-\d+\.webp$/.test(p)) requests.add(p);
        });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        const survival = mode === 'survival';
        if (survival) await enterSurvival(page, stage);
        else await enter777(page, stage);
        if (survival && stage === 0) {
          results.beam = await checkBeam(page, requests);
          if (shots) await page.screenshot({ path: path.join(shots, 'core-beam.png') });
        }
        const trial = await hitTrial(page, survival);
        assert.equal(trial.stage, stage);
        assert.equal(trial.endHp, 0, JSON.stringify(trial));
        results[mode].push(trial);
        console.log(mode, JSON.stringify(trial));
      } finally { await context.close(); }
    }
    for (const mode of ['survival', 'test777']) {
      const [early, late] = results[mode];
      assert.ok(late.firstDamage > early.firstDamage && late.hits < early.hits, JSON.stringify(results[mode]));
    }
    assert.deepEqual(errors, []);
    console.log('PASS', JSON.stringify(results));
    if (shots) fs.writeFileSync(path.join(shots, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
