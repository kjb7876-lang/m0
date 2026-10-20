import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {distribution, estimateProfilerOverhead, summarizeCpuProfile, summarizeDecodeWaits} from './r75-function-profile.core.mjs';

const url = process.env.R75_FUNCTION_PROFILE_URL || 'http://127.0.0.1:4393/';
const seed = Number(process.env.R75_FUNCTION_PROFILE_SEED || 11);
const durationMs = 7500;
const outputDir = 'out/r75/overnight';
await fs.mkdir(outputDir, {recursive: true});

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch({
  headless: true,
  chromiumSandbox: true,
  args: ['--disable-dev-shm-usage'],
});

const report = {
  schema: 'storyworld.r75-function-profile/v1',
  candidateSHA: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  baselineSHA: '11975b5ded156750f8f63bdd7df33faaffd634d6',
  browser: await browser.version(),
  runner: {os: 'ubuntu-22.04', headless: true, chromiumSandbox: true, softwareGPU: null, physicalGPU: null, physicalDevice: false},
  viewport: {width: 1365, height: 850, dpr: 1},
  samplingIntervalUs: 1000,
  workload: {
    zone: 'dist02',
    seed,
    phases: ['field-idle', 'movement-ai', 'attack-and-awakening-effects'],
    durationMsPerPhase: durationMs,
    fixtures: ['fresh isolated browser context', 'native map transition', 'invincible observation player', 'engaged native enemy roster', 'Samong cooldown reset only to exercise its real awakening path'],
    comparison: 'This is a function-cost diagnosis, not an A/B improvement-rate test. Runtime source hashes are reported separately.',
  },
  windows: [],
};

function summarizeRuntimeIdentity() {
  return Promise.all([
    fs.readFile('_pages/docs/index.html'),
    fs.readFile('_pages/docs/dist/phase1.js'),
    fs.readFile('/tmp/m0-r75-baseline/_pages/docs/index.html'),
    fs.readFile('/tmp/m0-r75-baseline/_pages/docs/dist/phase1.js'),
  ]).then(([candidateHtml, candidateRenderer, baselineHtml, baselineRenderer]) => ({
    candidate: {htmlSHA256: digest(candidateHtml), rendererSHA256: digest(candidateRenderer)},
    baseline: {htmlSHA256: digest(baselineHtml), rendererSHA256: digest(baselineRenderer)},
    sameHtml: digest(candidateHtml) === digest(baselineHtml),
    sameRenderer: digest(candidateRenderer) === digest(baselineRenderer),
  }));
}

report.runtimeIdentity = await summarizeRuntimeIdentity();

async function ready(page) {
  await page.waitForFunction(
    () => started && !loading && !window.__STORYWORLD_SAVE_SLOTS_R73__?.inspect?.().busy,
    null,
    {timeout: 90000},
  );
  for (let index = 0; index < 100 && await page.locator('#storyNext').count(); index++) {
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
    if (!storyScene) closePanel(true);
  });
  await page.waitForFunction(
    () => window.__STORYWORLD_PHASE1__?.controller?.inspect?.().active === 'three',
    null,
    {timeout: 30000},
  );
}

async function enterObservationRegion(page, id) {
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
  await page.waitForFunction(
    target => document.getElementById('r71DifficultyConfirm') || zone === target && !loading,
    id,
    {timeout: 90000},
  );
  if (await page.locator('#r71DifficultyConfirm').count()) await page.locator('#r71DifficultyConfirm').click();
  await page.waitForFunction(
    target => zone === target
      && !loading
      && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy
      && !window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().transitionDepth,
    id,
    {timeout: 90000},
  );
  await ready(page);
  assert.equal(await page.evaluate(() => zone), id, 'native 777 travel must load the requested observation region');
}

async function createObservationWindow(label, profileCpu) {
  const context = await browser.newContext({
    viewport: {width: 1365, height: 850},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await context.addInitScript(({initialSeed}) => {
    let state = initialSeed >>> 0;
    Math.random = () => {
      let value = state += 0x6D2B79F5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };

    const meter = window.__r75ProfileDecode = {phase: 'boot', rows: []};
    const record = (method, started, ok, source = '') => {
      let asset = '';
      try {
        const parsed = new URL(source, location.href);
        asset = parsed.pathname;
      } catch {}
      meter.rows.push({
        method,
        phase: meter.phase,
        durationMs: performance.now() - started,
        ok,
        asset,
      });
    };

    if (typeof HTMLImageElement !== 'undefined' && typeof HTMLImageElement.prototype.decode === 'function') {
      const decode = HTMLImageElement.prototype.decode;
      HTMLImageElement.prototype.decode = function(...args) {
        const started = performance.now();
        const source = this.currentSrc || this.src || '';
        let promise;
        try {
          promise = decode.apply(this, args);
        } catch (error) {
          record('HTMLImageElement.decode', started, false, source);
          throw error;
        }
        return Promise.resolve(promise).then(
          value => {
            record('HTMLImageElement.decode', started, true, source);
            return value;
          },
          error => {
            record('HTMLImageElement.decode', started, false, source);
            throw error;
          },
        );
      };
    }

    if (typeof window.createImageBitmap === 'function') {
      const create = window.createImageBitmap.bind(window);
      window.createImageBitmap = function(source, ...args) {
        const started = performance.now();
        let sourceName = '';
        try { sourceName = source?.src || source?.constructor?.name || ''; } catch {}
        return create(source, ...args).then(
          value => {
            record('createImageBitmap', started, true, sourceName);
            return value;
          },
          error => {
            record('createImageBitmap', started, false, sourceName);
            throw error;
          },
        );
      };
    }
  }, {initialSeed: seed});

  let cdp = null;
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90000});
    await page.locator('#campaignNew54').click({timeout: 90000});
    if (await page.locator('#slotConfirmR73').count()) await page.locator('#slotConfirmR73').click();
    await ready(page);

    await page.evaluate(() => { window.__r75ProfileDecode.phase = 'region-entry-dist02'; });
    await enterObservationRegion(page, 'dist02');

    const setup = await page.evaluate(() => {
      auto = false;
      guide = false;
      route = [];
      command = null;
      settings.autoSkill = false;
      settings.lowFx = false;
      settings.reducedMotion = false;
      settings.sound = false;
      settings.music = false;
      player.hp = maxHP() * 100;
      player.invincible = 1000000;
      player.invReason = 'r75-function-profile-observation';
      player.ego = 1000;
      player.samong = 0;
      player.samongCD = 0;
      room.engaged = true;
      const controller = window.__STORYWORLD_PHASE1__?.controller;
      const renderer = controller?.inspect?.();
      let webgl = null;
      try {
        const gl = controller?.state?.three?.renderer?.getContext?.();
        if (gl) {
          const extension = gl.getExtension('WEBGL_debug_renderer_info');
          webgl = {
            renderer: gl.getParameter(gl.RENDERER),
            vendor: gl.getParameter(gl.VENDOR),
            unmaskedRenderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null,
          };
        }
      } catch {}
      const active = room.enemies.filter(enemy => enemy.hp > 0 && enemy.spawnState === 'active');
      return {
        zone,
        layer,
        renderer: renderer?.active,
        rendererReason: renderer?.reason || null,
        webgl,
        gameTime: time,
        enemyRoster: room.enemies.length,
        activeEnemies: active.length,
        activeOrdinary: active.filter(enemy => !enemy.boss && !enemy.midboss).length,
        effects: effects.length,
        projectiles: projectiles.length,
        player: {hero: player.hero, x: player.x, y: player.y, hp: player.hp, samong: player.samong},
      };
    });
    assert.equal(setup.zone, 'dist02');
    assert.equal(setup.renderer, 'three');
    assert.ok(setup.activeOrdinary > 0, 'the native field must contain active ordinary enemies');

    if (profileCpu) {
      cdp = await context.newCDPSession(page);
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', {interval: 1000});
    }

    const phases = [];
    for (const phase of ['field-idle', 'movement-ai', 'attack-and-awakening-effects']) {
      let awakening = null;
      if (phase === 'attack-and-awakening-effects') {
        awakening = await page.evaluate(() => ({
          samongBefore: player.samong,
          accepted: awaken('story'),
          samongAfter: player.samong,
        }));
        assert.equal(awakening.accepted, true, 'native Samong awakening observation fixture must run');
      }

      if (profileCpu) await cdp.send('Profiler.start');
      const framePromise = page.evaluate(ms => new Promise(resolve => {
        const intervals = [];
        let first = null;
        let previous = null;
        function next(timestamp) {
          if (first === null) first = timestamp;
          if (previous !== null) intervals.push(timestamp - previous);
          previous = timestamp;
          if (timestamp - first >= ms) resolve({elapsedMs: timestamp - first, intervals});
          else requestAnimationFrame(next);
        }
        requestAnimationFrame(next);
      }), durationMs);

      const actionPromise = (async () => {
        if (phase === 'field-idle') return {inputEvents: 0};
        const until = Date.now() + durationMs;
        const directions = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        const held = new Set();
        let index = 0;
        let inputEvents = 0;
        try {
          while (Date.now() < until) {
            const key = directions[index++ % directions.length];
            await page.keyboard.down(key);
            held.add(key);
            await page.waitForTimeout(300);
            await page.keyboard.up(key);
            held.delete(key);
            if (phase === 'attack-and-awakening-effects' || index % 2 === 0) {
              await page.keyboard.press('a');
              inputEvents++;
            }
            await page.waitForTimeout(200);
          }
        } finally {
          for (const key of held) await page.keyboard.up(key).catch(() => {});
        }
        return {inputEvents};
      })();

      const [frameSample, actions] = await Promise.all([framePromise, actionPromise]);
      let cpu = null;
      if (profileCpu) {
        const stopped = await cdp.send('Profiler.stop');
        cpu = summarizeCpuProfile(stopped.profile, 1000);
      }
      const runtime = await page.evaluate(() => {
        const controller = window.__STORYWORLD_PHASE1__?.controller;
        const active = window.__STORYWORLD_WORLD_R75__?.inspect?.()
          || window.__STORYWORLD_WORLD_R74__?.inspect?.()
          || null;
        return {
          zone,
          gameTime: time,
          renderer: controller?.inspect?.().active,
          enemyRoster: room.enemies.length,
          activeEnemies: room.enemies.filter(enemy => enemy.hp > 0 && enemy.spawnState === 'active').length,
          effects: effects.length,
          projectiles: projectiles.length,
          drawStats: typeof drawStats === 'object' ? {...drawStats} : null,
          worldMetrics: active?.metrics || null,
        };
      });
      phases.push({
        name: phase,
        durationMs: round(frameSample.elapsedMs),
        frameIntervalsMs: distribution(frameSample.intervals),
        actions,
        awakening,
        runtime,
        cpu,
      });
    }

    return {
      label,
      setup,
      phases,
      decodeRows: await page.evaluate(() => [...(window.__r75ProfileDecode?.rows || [])]),
      pageErrors,
      consoleErrors,
    };
  } finally {
    if (cdp) await cdp.detach().catch(() => {});
    await context.close();
  }
}

const round = value => Math.round(value * 100) / 100;
const windows = [];
try {
  windows.push(await createObservationWindow('control-before', false));
  const rendererName = windows[0].setup.webgl?.unmaskedRenderer || windows[0].setup.webgl?.renderer || '';
  const softwareRenderer = /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(rendererName);
  const hardwareRenderer = /\b(nvidia|geforce|radeon|amd|intel|apple|adreno|mali)\b/i.test(rendererName)
    && !softwareRenderer;
  report.runner.softwareGPU = softwareRenderer ? true : hardwareRenderer ? false : null;
  report.runner.physicalGPU = hardwareRenderer ? true : softwareRenderer ? false : null;
  report.runner.rendererEvidence = rendererName || null;
  windows.push(await createObservationWindow('cpu-profile', true));
  windows.push(await createObservationWindow('control-after', false));

  const [before, profiled, after] = windows;
  for (const window of windows) {
    assert.deepEqual(window.pageErrors, [], window.label + ' page errors');
    assert.ok(window.phases.every(phase => phase.frameIntervalsMs.count >= 20), window.label + ' frame capture too short');
    assert.ok(window.phases.every(phase => phase.runtime.renderer === 'three'), window.label + ' renderer fallback invalidates profile');
  }

  const phases = ['field-idle', 'movement-ai', 'attack-and-awakening-effects'].map(name => {
    const pick = window => window.phases.find(phase => phase.name === name);
    const controlBefore = pick(before);
    const measured = pick(profiled);
    const controlAfter = pick(after);
    return {
      name,
      controls: {
        before: controlBefore.frameIntervalsMs,
        after: controlAfter.frameIntervalsMs,
      },
      profiledFrameIntervalsMs: measured.frameIntervalsMs,
      profilerOverheadEstimate: estimateProfilerOverhead(
        controlBefore.frameIntervalsMs.p95Ms,
        measured.frameIntervalsMs.p95Ms,
        controlAfter.frameIntervalsMs.p95Ms,
      ),
      sampledMainThreadMs: measured.cpu.sampledMainThreadMs,
      cpuSampleCount: measured.cpu.sampleCount,
      categories: measured.cpu.categories,
      topFunctions: measured.cpu.topFunctions.slice(0, 20),
      workloadState: measured.runtime,
      awakening: measured.awakening,
    };
  });

  const decode = summarizeDecodeWaits(before.decodeRows);
  const result = {
    ...report,
    result: 'passed',
    phases,
    imageDecoding: decode,
    decodeInstrumentation: {
      observed: ['HTMLImageElement.decode', 'createImageBitmap'],
      note: 'Decode wrappers are active only around asynchronous image decode APIs. Promise durations are latency and can overlap; they are not CPU-time sums.',
    },
    measurementOverhead: {
      method: 'One control run before and after each profiled phase; incremental p95 RAF change estimates CDP CPU-profiler overhead. RAF observation ran in every window, so its shared overhead is not removed.',
      interpretation: 'This estimates profiler overhead only. It is not a baseline-versus-candidate speedup and not a runtime improvement rate.',
    },
    cpuProfileScope: 'CDP Profiler samples the page JavaScript isolate. Native image-decoder/raster-thread CPU and GPU shader time are not attributed to JavaScript functions; image decode APIs are reported as overlapping promise latency, and WebGL renderer identity records the observed GPU class when recognizable.',
    errors: {pageErrors: windows.flatMap(window => window.pageErrors), consoleErrors: windows.flatMap(window => window.consoleErrors)},
  };

  await fs.writeFile(outputDir + '/function-profile.json', JSON.stringify(result, null, 2) + '\n');
  console.log('R75_FUNCTION_PROFILE_RESULT', JSON.stringify(result));
} catch (error) {
  report.result = 'failed';
  report.error = error.stack || String(error);
  await fs.writeFile(outputDir + '/function-profile.json', JSON.stringify(report, null, 2) + '\n').catch(() => {});
  console.error('R75_FUNCTION_PROFILE_FAILURE', JSON.stringify(report));
  throw error;
} finally {
  await browser.close();
}
