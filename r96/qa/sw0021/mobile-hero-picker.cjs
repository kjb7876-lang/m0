const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, devices } = require(process.env.SW_PLAYWRIGHT || 'playwright');

const url = process.env.SW_URL || 'http://127.0.0.1:4451/hero21-new/';
const shots = process.env.SW_SHOT;
const baseline = process.env.SW_BASELINE === '1';
const pocket = { ...devices['iPhone 13'], viewport: { width: 375, height: 812 }, defaultBrowserType: undefined };
const landscape = { ...pocket, viewport: { width: 812, height: 375 } };
const cases = [
  ['landscape', landscape],
  ['portrait', pocket],
  ['unlocked', devices['iPhone 13 landscape']],
  ['desktop', { viewport: { width: 1280, height: 720 } }]
];

async function measure(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('#panel');
    const row = panel.querySelector('#heroRowR101');
    const strip = row.querySelector('.heroRowR101');
    const start = panel.querySelector('#slotConfirmR73');
    const cancel = panel.querySelector('#slotCancelR73');
    const stage = panel.querySelector('#r263Stage');
    const clip = panel.getBoundingClientRect();
    const fits = el => {
      const r = el.getBoundingClientRect();
      return r.top >= Math.max(0, clip.top) - 1 && r.bottom <= Math.min(innerHeight, clip.bottom) + 1;
    };
    return {
      title: fits(panel.querySelector('h2')),
      panelScroll: panel.scrollTop,
      start: fits(start),
      cancel: fits(cancel),
      startsBeforePreview: !!(start.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING),
      startsBelowRow: !!(row.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING),
      picked: strip.querySelector('.selected[data-hero]')?.dataset.hero,
      preview: stage.dataset.hero,
      count: strip.querySelectorAll('button[data-hero]').length,
      startHeight: start.getBoundingClientRect().height,
      stripIsScrollable: strip.scrollWidth <= strip.clientWidth || getComputedStyle(strip).overflowX === 'auto',
      overflowX: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
}

async function verifyMobile(page, label) {
  await page.waitForTimeout(430);
  const data = await measure(page);
  console.log(label, JSON.stringify(data));
  if (!baseline) {
    assert.ok(data.title && data.start && data.cancel, 'title and both actions must initially fit');
    assert.ok(data.startsBeforePreview && data.startsBelowRow && data.startHeight >= 44);
    assert.equal(data.panelScroll, 0, 'fitting must not scroll the panel on its own');
    assert.equal(data.count, 8);
    assert.ok(data.stripIsScrollable && !data.overflowX);
  }
  if (shots) await page.screenshot({ path: shots + '/' + label + '.png' });
}

async function main() {
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.SW_CHROMIUM, args: ['--no-sandbox', '--use-angle=swiftshader'] });
  try {
    for (const [label, profile] of cases) {
      if (baseline && label === 'unlocked') continue;
      const page = await b.newPage(profile);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(unlocked => {
        localStorage.setItem('storyworld.r183.scene3d', '{"on":false}');
        if (unlocked) localStorage.setItem('storyworld.r1046.ego', '{"on":true}');
      }, label === 'unlocked');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.locator('#campaignNew54').click({ timeout: 180000 });
      await page.locator('#r263Stage').waitFor();
      if (label === 'desktop') {
        const d = await measure(page);
        assert.equal(d.startsBeforePreview, false);
        assert.equal(d.count, 8);
        if (shots) await page.screenshot({ path: shots + '/desktop.png' });
      } else {
        if (label === 'unlocked') await page.locator('#heroRowR101 [data-r1176="3d"]').waitFor();
        await verifyMobile(page, label);
        if (label === 'unlocked') {
          const forms = await page.locator('#heroRowR101 [data-r1176]').evaluateAll(buttons => buttons.map(button => {
            const strip = button.parentElement.getBoundingClientRect();
            const box = button.getBoundingClientRect();
            return box.left >= strip.left && box.right <= strip.right;
          }));
          assert.deepEqual(forms, [true, true], 'both unlocked EGO forms must start in view');
        }
        if (!baseline && label === 'landscape') {
          const gunner = page.locator('#heroRowR101 [data-hero=gunner]');
          await gunner.scrollIntoViewIfNeeded();
          await gunner.tap();
          let d = await measure(page);
          assert.equal(d.picked, 'gunner');
          assert.equal(d.preview, 'gunner');

          await page.setViewportSize(pocket.viewport);
          await verifyMobile(page, 'rotated');
          d = await measure(page);
          assert.equal(d.picked, 'gunner');
          assert.equal(d.preview, 'gunner');

          await page.locator('#slotCancelR73').tap();
          await page.locator('[data-slot-new="1"]').tap();
          await verifyMobile(page, 'reopened');
          assert.equal((await measure(page)).picked, 'gunner');
          await page.locator('#slotConfirmR73').tap();
          await page.waitForFunction(() => started && !loading, null, { timeout: 180000 });
          assert.equal(await page.evaluate(() => player.hero), 'gunner');
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await b.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
