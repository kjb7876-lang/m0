import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';

// Additional R88 FINAL42 acceptance only. Existing R75/R77 natural smokes stay separate.
// Combat positions, native hurt/hazard fixtures, quiet AI and sampled effect time
// are deliberate assistance, not a natural-play or physical-GPU benchmark.
const url = process.env.STORYWORLD_URL || 'http://127.0.0.1:4394/';
const out = 'out/r88';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  schema: 'storyworld.r88-painted-browser.v1', url,
  commit: process.env.GITHUB_SHA || 'working-tree',
  sandbox: true, softwareGPU: null, physicalGPU: false, physicalDevice: false,
  naturalPlayVerified: false, assisted: true,
  scope: 'Settings hospital start; all42 source PNG response hashes and decoded images; one nonblank sampled atlas frame per effect on dark/light actual WebGL framebuffer pairs; native medical hit/hazard and root hurt/DOT/blink. Scripted positions, quiet AI and sampled animation time assist these cases. This is not all680 GPU frames, physical-GPU proof or natural play, and does not replace the existing new-game/save/guide smokes.',
  cases: [], pageErrors: [], requestFailures: [], images: [], screenshots: [],
  htmlSHA256: null, browserVersion: null, playwrightVersion: null, ok: false
};
const images = [];
let browser, page;
const check = (name, data) => report.cases.push({name, ok: true, data});

async function screenshot(name) {
  const path = `${out}/${name}.png`;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({path, fullPage: true});
  report.screenshots.push({path, sha256: sha256(await fs.readFile(path))});
}

async function raster(kind) {
  const data = await page.evaluate(kind => {
    const api = window.__STORYWORLD_PHASE1__, controller = api.controller;
    const three = controller.state.three, gl = three.renderer.getContext();
    const frame = api.capture(), commands = api.captureVisual();
    const selected = commands.filter(command => command.owner?.r88SourceIndex === ({scalpel:215,poison:213,bind:99}[kind]));
    const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
    const take = commands => {
      frame.commands = commands;
      three.render(frame);
      gl.finish();
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    try {
      const without = take(commands.filter(command => command.owner?.r88SourceIndex !== ({scalpel:215,poison:213,bind:99}[kind])));
      const withEffect = take(commands);
      let changedPixels = 0, totalRGBDifference = 0;
      for (let i = 0; i < without.length; i += 4) {
        const delta = Math.abs(without[i]-withEffect[i]) + Math.abs(without[i+1]-withEffect[i+1]) + Math.abs(without[i+2]-withEffect[i+2]);
        totalRGBDifference += delta;
        if (delta > 3) changedPixels++;
      }
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        kind, width, height, changedPixels, totalRGBDifference,
        glError: gl.getError(),
        renderer: gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        commands: selected.map(command => ({
          sourcePath: command.sourcePath, frame: command.owner.r88Frame,
          composite: command.style?.globalCompositeOperation,
          finite: (command.points || []).flat().every(Number.isFinite)
        })),
        method: 'Actual synchronous Three/WebGL framebuffer pair at fixed simulation time; only this painted kind is removed from the first command list.'
      };
    } finally {
      delete frame.commands;
      controller.draw();
    }
  }, kind);
  assert.ok(data.commands.length > 0, `${kind}: a native painted command must exist`);
  assert.ok(data.commands.every(command => command.finite && command.composite === 'source-over'));
  assert.ok(data.changedPixels > 0, `${kind}: painted texture must change actual WebGL pixels`);
  assert.equal(data.glError, 0, `${kind}: WebGL must remain valid`);
  check(`${kind}-actual-painted-WebGL-pixels`, data);
  await screenshot(`painted-${kind}`);
  return data;
}

async function catalogRaster(sourceIndex) {
  const result = await page.evaluate(async sourceIndex => {
    const api = window.__STORYWORLD_FINAL42_R88__, data = window.__STORYWORLD_FINAL42_DATA_R88__;
    const spec = Object.values(data.effects).find(row => row.sourceIndex === sourceIndex);
    if (!spec) throw Error('Missing supplied effect '+sourceIndex);
    modal = true;
    // A new assisted fixture per effect keeps the real loader's bounded pool;
    // no atlas dimensions, artwork, native abilities or damage are changed.
    api.clear('browser-catalog-fixture');
    if (!await api.ensure(sourceIndex)) throw Error('Actual atlas decode failed '+sourceIndex);
    const phase = window.__STORYWORLD_PHASE1__, three = phase.controller.state.three;
    const T = three.T, A = window.StoryPhase1, gl = three.renderer.getContext();
    const projection = new A.Projection().configure(phase.capture().projection);
    const scene = new T.Scene(), camera = new T.OrthographicCamera();
    projection.configureCamera(camera);
    const commandScene = new A.CommandScene(T, {projection, scene, camera, spatial:true});
    const recorder = new A.DrawCommands({canvas:three.canvas});
    const renderer = three.renderer, originalClear = renderer.getClearColor(new T.Color()).clone();
    const originalAlpha = renderer.getClearAlpha(), shadowUpdate = renderer.shadowMap.needsUpdate;
    const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
    const clip = spec.defaultClip || (spec.clips.emerge ? 'emerge' : spec.clips.main ? 'main' : Object.keys(spec.clips)[0]);
    const duration = spec.clips[clip].duration;
    const take = (commands, background) => {
      commandScene.render(commands);
      renderer.setClearColor(background, 1); renderer.clear(true, true, true);
      renderer.shadowMap.needsUpdate = false;
      camera.layers.set(1); renderer.render(scene, camera); renderer.clearDepth();
      camera.layers.set(2); renderer.render(scene, camera);
      camera.layers.set(3); renderer.render(scene, camera);
      gl.finish();
      const pixels = new Uint8Array(width*height*4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    const difference = (a,b) => {
      let changedPixels=0,totalRGBDifference=0;
      for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);totalRGBDifference+=d;if(d>3)changedPixels++;}
      return {changedPixels,totalRGBDifference};
    };
    try {
      let chosen = null;
      // Some supplied clips explicitly start/end transparent. Probe an authored
      // nonblank instant, and report the exact age/frame instead of calling it
      // a test of every stored frame or a native combat admission.
      for (const progress of [.5,.25,.75,.125,.875]) {
        const age = Math.max(1e-5, duration*progress), frame = api.sample(sourceIndex,age,{clip});
        if (!frame || frame.alpha<=0) continue;
        recorder.reset(1);
        const rendered = api.render(sourceIndex,{ctx:recorder,x:player.x,y:player.y,height:190,age,clip,layer:spec.layer,sourceKey:'browser-catalog:'+sourceIndex});
        if (!rendered) continue;
        const commands = recorder.commands.filter(row => row.owner?.r88SourceIndex===sourceIndex);
        if (commands.length!==1) throw Error('Expected exactly one FINAL42 owner '+sourceIndex);
        if(commands[0].owner.r87Painted)throw Error('Duplicate historical painted owner '+sourceIndex);
        const backgrounds=[];
        for(const [name,color]of [['dark',0x101720],['light',0xe8e5df]]){
          const blank=take([],color),painted=take(commands,color);
          backgrounds.push({name,...difference(blank,painted)});
        }
        if(backgrounds.every(row=>row.changedPixels>0)){
          const rows=[...commandScene.rows.values()];
          chosen={sourceIndex,id:frame.id,clip:frame.clip,frame:frame.index,age,layer:spec.layer,pivot:frame.pivot,alpha:frame.alpha,path:frame.path,
            width,height,backgrounds,glError:gl.getError(),commands:commands.length,
            textures:rows.map(row=>({minFilter:row.mesh.material.map?.minFilter,magFilter:row.mesh.material.map?.magFilter,mipmaps:row.mesh.material.map?.generateMipmaps,premultiplyAlpha:row.mesh.material.map?.premultiplyAlpha,layers:row.mesh.layers.mask})),
            expectedLinearFilter:T.LinearFilter,scope:'One authored nonblank frame, two backgrounds; actual loader, DrawCommands, CommandScene, texture/material and existing WebGL renderer; scripted catalog admission.'};
          break;
        }
      }
      if(!chosen)throw Error('No supplied painted pixels on both backgrounds '+sourceIndex);
      const ext=gl.getExtension('WEBGL_debug_renderer_info');
      chosen.renderer=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);
      chosen.runtime=api.inspect();
      return chosen;
    } finally {
      commandScene.dispose();recorder.dispose();
      renderer.setClearColor(originalClear,originalAlpha);renderer.shadowMap.needsUpdate=shadowUpdate;
      phase.controller.draw();
    }
  }, sourceIndex);
  assert.equal(result.glError,0,`${sourceIndex}: catalog rendering must preserve WebGL`);
  assert.equal(result.commands,1);
  assert.ok(result.backgrounds.every(row=>row.changedPixels>0));
  assert.ok(result.textures.length>0 && result.textures.every(row=>row.minFilter===result.expectedLinearFilter && row.magFilter===result.expectedLinearFilter && row.mipmaps===false && row.premultiplyAlpha===false));
  assert.ok(result.runtime.residentBytes<=result.runtime.budgetBytes && result.runtime.resident.length<=result.runtime.maxAtlases);
  if(report.softwareGPU===null)report.softwareGPU=/swiftshader|llvmpipe|software|lavapipe/i.test(result.renderer);
  check(`catalog-${sourceIndex}-actual-painted-dark-light-WebGL-pixels`,{id:result.id,frame:result.frame,backgrounds:result.backgrounds});
  return result;
}

try {
  await fs.mkdir(out, {recursive: true});
  report.playwrightVersion = createRequire(import.meta.url)('playwright/package.json').version;
  assert.match(report.playwrightVersion, /^1\.56\./, 'This acceptance uses the existing pinned Playwright 1.56 line');
  // Keep the existing security policy: no fallback flags or sandbox retry.
  browser = await chromium.launch({headless: true, chromiumSandbox: true, args: ['--disable-dev-shm-usage']});
  report.browserVersion = browser.version();
  page = await browser.newPage({viewport: {width: 1365, height: 850}, deviceScaleFactor: 1});
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('crash', () => report.pageErrors.push('PAGE_CRASH'));
  page.on('requestfailed', request => {
    if (request.url().includes('/final42-r88/')) report.requestFailures.push({path: new URL(request.url()).pathname, error: request.failure()?.errorText});
  });
  page.on('response', response => {
    if (!/\/final42-r88\/.*\.png(?:\?|$)/.test(response.url())) return;
    images.push((async () => {
      try {
        const bytes = await response.body();
        return {path: decodeURIComponent(new URL(response.url()).pathname), status: response.status(), bytes: bytes.length, sha256: sha256(bytes)};
      } catch (error) {
        return {path: new URL(response.url()).pathname, status: response.status(), error: String(error)};
      }
    })());
  });

  const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 90000});
  assert.equal(response?.status(), 200);
  report.htmlSHA256 = sha256(await response.body());
  await page.waitForFunction(() => booted && !loading && window.__STORYWORLD_FINAL42_R88__ && window.__STORYWORLD_FINAL42_HOOKS_R88__ && window.__STORYWORLD_PHASE1__?.controller?.state.three && !window.__STORYWORLD_PHASE1__.controller.state.failed, null, {timeout: 90000});
  const originalScope = await page.evaluate(() => ({
    procedural80: !!window.StoryVFX || !!window.__STORYWORLD_DYNAMIC_VFX_R84__,
    floatingHospitalButton: !!document.getElementById('hospitalDirectStart'),
    data: window.__STORYWORLD_FINAL42_DATA_R88__
  }));
  assert.equal(originalScope.procedural80, false);
  assert.equal(originalScope.floatingHospitalButton, false);
  await page.locator('#titleSettingsR84').click({timeout: 30000});
  await page.locator('#hospitalDirectStart').click({timeout: 30000});
  await page.waitForFunction(() => started && zone === 'ep1a08' && !loading, null, {timeout: 90000});
  await page.waitForFunction(() => window.__STORYWORLD_PHASE1__.controller.inspect().active === 'three', null, {timeout: 30000});
  await page.evaluate(async () => {
    for (let i = 0; i < 80 && storyScene; i++) advanceScene();
    if (modal && !storyScene) closePanel(true);
    auto = guide = false;
    settings.autoSkill = false;
    route = []; command = null; keys.clear();
    // Isolate the native damage lifecycle from unrelated enemy attacks.
    window.__r87BrowserFixture = {tickEnemies, tickShots, hurt, dots: []};
    tickEnemies = tickShots = () => {};
    hazards = []; projectiles = []; effects = [];
    hurt = function(value, source) {
      const before = player.hp;
      const result = window.__r87BrowserFixture.hurt.apply(this, arguments);
      if (source?.r87ThornDot) window.__r87BrowserFixture.dots.push({value, result, hpLoss: before-player.hp});
      return result;
    };
    await window.__STORYWORLD_FINAL42_HOOKS_R88__.ready();
  });
  const hospital = await page.evaluate(() => ({
    zone, room: room.id, doors: room.exploration.hospitalDoorsB3.length,
    floatingHospitalButton: !!document.getElementById('hospitalDirectStart'),
    resident: window.__STORYWORLD_FINAL42_R88__.inspect().resident,
    replaced: window.__STORYWORLD_PAINTED_VFX_R87__.inspect(),
    renderer: window.__STORYWORLD_PHASE1__.controller.inspect().active
  }));
  assert.equal(hospital.doors, 3);
  assert.equal(hospital.floatingHospitalButton, false);
  assert.equal(hospital.renderer, 'three');
  assert.equal(hospital.replaced.final42Replacement, true);
  assert.deepEqual(hospital.replaced.resident, []);
  assert.ok([213,214,215].every(id => hospital.resident.some(row => row.path.includes('/'+id+'/') && row.state === 'ready')));
  assert.ok(hospital.resident.every(row => row.state === 'ready'));
  check('native-settings-hospital-start-and-final42-single-owner-medical-textures', hospital);

  const scalpel = await page.evaluate(() => {
    const owner = room.enemies.find(enemy => enemy.nativeId === 'a08-o1');
    if (!owner) throw Error('Native hospital tool owner a08-o1 missing');
    owner.hp = owner.maxHp; owner.spawnState = 'active'; owner.deadRecorded = false;
    owner.x = player.x-2; owner.y = player.y;
    player.hp = maxHP(); player.invincible = 0; player.shield = 0; player.guard = false;
    cam.x = player.x; cam.y = player.y;
    const before = player.hp;
    const result = hurt(8, {owner: owner.id, vx: 1, vy: 0, medical20: {
      kind: 'tool', frame: 'scalpel', epoch: window.__STORYWORLD_MEDICAL20__.inspect().epoch,
      room, owner, phase: 'flight', budget: 8
    }});
    time += .25; modal = true;
    return {result, hpLoss: before-player.hp, active: window.__STORYWORLD_FINAL42_R88__.inspect().active};
  });
  assert.equal(scalpel.result, 'hit'); assert.ok(scalpel.hpLoss > 0);
  assert.equal(scalpel.active.filter(row => row.sourceIndex === 215).length, 1);
  check('confirmed-native-medical-scalpel-hit', scalpel);
  const scalpelRaster = await raster('scalpel');
  assert.ok(scalpelRaster.commands.some(command => command.frame === 6));

  const poison = await page.evaluate(() => {
    modal = false; time += 1;
    const owner = room.enemies.find(enemy => enemy.nativeId === 'a08-o1');
    const target = {x: player.x, y: player.y}, start = time;
    const medical20 = {
      kind: 'poison', owner, room, epoch: window.__STORYWORLD_MEDICAL20__.inspect().epoch,
      start, releaseAt: start-.2, impactAt: start, endAt: start+1.3,
      active: .9, budget: 0, spent: 0, released: true, attempted: new Set(),
      origin: {x: owner.x, y: owner.y}, target, cancelled: false
    };
    hazards.push({id: 'r87-browser-native-poison-fixture', type: 'medical20', owner: owner.id,
      ...target, age: 0, warning: 0, life: 1.3, damage: 0, medical20,
      footprint154: {shape: 'circle', ...target, radius: 1.1}, asset: 'assets/visual-test/hospital-medical-tools-r20.png'});
    tickHazards(.01); tickHazards(.01);
    time += .35; modal = true;
    return {target, active: window.__STORYWORLD_FINAL42_R88__.inspect().active.filter(row => row.sourceIndex === 213)};
  });
  assert.equal(poison.active.length, 1);
  assert.equal(poison.active[0].x, poison.target.x); assert.equal(poison.active[0].y, poison.target.y);
  check('native-poison-hazard-impact-deduplicates-at-committed-target', poison);
  await raster('poison');

  const root = await page.evaluate(async () => {
    modal = false; hazards = []; projectiles = []; effects = [];
    await enterRegion('dist00', null, {restore: true, noStory: true, layer: 'STORY', difficultyR63: 'normal'});
    for (let i = 0; i < 80 && storyScene; i++) advanceScene();
    if (modal && !storyScene) closePanel(true);
    zone = 'dist00'; layer = 'STORY'; room = makeRoom(zone, layer); world[layerKey()] = room;
    window.__STORYWORLD_WORLD_COMBAT_R78__.placeRoom(room); room.engaged = true;
    const point = room.exploration.nodes?.find(point => !blocked(point.x, point.y, .4)) || room.exploration.entry;
    if (!point || blocked(point.x, point.y, .4)) throw Error('Root fixture needs a native body-clear point');
    player.x = point.x; player.y = point.y; cam.x = point.x; cam.y = point.y;
    player.hp = maxHP(); player.invincible = 0; player.shield = 0; player.guard = false;
    route = []; command = null; keys.clear(); auto = guide = false;
    modal = loading = false; storyScene = null; hazards = []; projectiles = []; effects = [];
    const owner = room.enemies.find(enemy => enemy.nativeId === 'dist00-boss');
    if (!owner) throw Error('Native first root boss is missing');
    owner.hp = owner.maxHp; owner.spawnState = 'active'; owner.deadRecorded = false;
    owner.x = player.x+1; owner.y = player.y;
    await window.__STORYWORLD_FINAL42_HOOKS_R88__.ready();
    return {zone, boss: owner.nativeId, damage: owner.damage,
      resident: window.__STORYWORLD_FINAL42_R88__.inspect().resident};
  });
  assert.ok(root.resident.some(row => row.path.includes('/099/') && row.state === 'ready'));
  assert.ok(root.resident.every(row => !/\/(213|214|215)\//.test(row.path)));
  check('root-region-releases-hospital-textures-and-decodes-final42-thorn', root);

  const bind = await page.evaluate(() => {
    const owner = room.enemies.find(enemy => enemy.nativeId === 'dist00-boss');
    window.__STORYWORLD_HOSPITAL_WOUNDS_R53__.clear();
    const before = {x: player.x, y: player.y};
    player.invincible = 0;
    const result = hurt(1, {owner: owner.id, vx: 1, vy: 0, kind: 'r87-browser-root-contact'});
    moveActor(player, .3, 0);
    const blockedWalk = player.x === before.x && player.y === before.y;
    time += .68; modal = true;
    return {result, blockedWalk, binding: window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding};
  });
  assert.equal(bind.result, 'hit'); assert.ok(bind.binding); assert.equal(bind.blockedWalk, true);
  check('confirmed-first-root-hit-blocks-ordinary-walking', bind);
  const bindRaster = await raster('bind');
  assert.ok(bindRaster.commands.some(command => command.frame === 8));
  await page.evaluate(() => { modal = false; });
  await page.waitForFunction(() => window.__r87BrowserFixture.dots.length >= 4 && !window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding, null, {timeout: 20000});
  const dots = await page.evaluate(() => ({
    attempts: window.__r87BrowserFixture.dots,
    expected: room.enemies.find(enemy => enemy.nativeId === 'dist00-boss').damage*.6,
    hp: player.hp
  }));
  assert.equal(dots.attempts.length, 4);
  assert.ok(dots.attempts.every(row => Number.isFinite(row.value) && row.result === 'hit' && row.hpLoss > 0));
  assert.ok(Math.abs(dots.attempts.reduce((sum, row) => sum+row.value, 0)-dots.expected) < 1e-7);
  assert.ok(dots.hp > 0);
  check('four-native-root-DOT-pulses-retain-the-authored-budget', dots);

  const escapeStart = await page.evaluate(() => {
    const owner = room.enemies.find(enemy => enemy.nativeId === 'dist00-boss');
    player.hp = maxHP(); player.invincible = 0; player.blinkCD = 0;
    window.__STORYWORLD_HOSPITAL_WOUNDS_R53__.clear();
    const result = hurt(1, {owner: owner.id, vx: 1, vy: 0, kind: 'r87-browser-root-contact'});
    return {result, binding: !!window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding, x: player.x, y: player.y};
  });
  assert.equal(escapeStart.result, 'hit'); assert.equal(escapeStart.binding, true);
  await page.keyboard.press('s');
  await page.waitForFunction(before => !window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding && Math.hypot(player.x-before.x, player.y-before.y) > .05, escapeStart, {timeout: 5000});
  check('real-S-key-native-blink-escapes-root-bind', await page.evaluate(before => ({
    distance: Math.hypot(player.x-before.x, player.y-before.y),
    binding: window.__STORYWORLD_PAINTED_VFX_R87__.inspect().binding,
    active: window.__STORYWORLD_FINAL42_R88__.inspect().active
  }), escapeStart));

  // all42: catalog probes are explicit assisted render fixtures, not new game abilities.
  // The preserved native three cases above exercise real admission and damage hooks.
  for (const spec of Object.values(originalScope.data.effects)) {
    const value = await catalogRaster(spec.sourceIndex);
    report.catalogFrames ??= [];
    report.catalogFrames.push(value);
  }
  assert.equal(report.catalogFrames.length, 42);
  report.images = await Promise.all(images);
  for (const spec of Object.values(originalScope.data.effects)) {
    for (const atlas of spec.atlases) {
      const matching = report.images.filter(row => row.path.endsWith('/'+atlas.path));
      assert.ok(matching.length > 0, `${spec.id}: a real browser PNG response must be recorded`);
      assert.ok(matching.every(row => row.status === 200 && row.sha256 === atlas.sha256 && !row.error), `${spec.id}: response bytes must match the supplied atlas`);
    }
  }
  check('all42-source-PNG-responses-match-original-atlases', {count:42, images:report.images});
  assert.deepEqual(report.requestFailures, []);
  assert.deepEqual(report.pageErrors, []);
  const final = await page.evaluate(() => ({
    errors: [...errors], renderer: window.__STORYWORLD_PHASE1__.controller.inspect().active,
    failed: window.__STORYWORLD_PHASE1__.controller.state.failed,
    procedural80: !!window.StoryVFX || !!window.__STORYWORLD_DYNAMIC_VFX_R84__
  }));
  assert.deepEqual(final.errors, []); assert.equal(final.renderer, 'three');
  assert.equal(final.failed, false); assert.equal(final.procedural80, false);
  check('final42-runtime-and-native-error-ledger', {images: report.images, final});
  report.ok = true;
} catch (error) {
  report.error = String(error?.stack || error);
  report.debug = await page?.evaluate(() => ({
    started: typeof started === 'undefined' ? null : started,
    zone: typeof zone === 'undefined' ? null : zone,
    loading: typeof loading === 'undefined' ? null : loading,
    modal: typeof modal === 'undefined' ? null : modal,
    panel: document.getElementById('panel')?.innerText,
    nativeErrors: typeof errors === 'undefined' ? null : [...errors],
    painted: window.__STORYWORLD_FINAL42_R88__?.inspect(),
    nativeRoot: window.__STORYWORLD_PAINTED_VFX_R87__?.inspect(),
    hooks: window.__STORYWORLD_FINAL42_HOOKS_R88__?.inspect(),
    renderer: window.__STORYWORLD_PHASE1__?.controller?.inspect()
  })).catch(() => null);
  if (page) await screenshot('painted-failure').catch(() => {});
  process.exitCode = 1;
} finally {
  if (page) await page.evaluate(() => {
    const fixture = window.__r87BrowserFixture;
    if (fixture) { tickEnemies = fixture.tickEnemies; tickShots = fixture.tickShots; hurt = fixture.hurt; }
    keys?.clear();
  }).catch(() => {});
  await fs.mkdir(out, {recursive: true});
  await fs.writeFile(`${out}/painted-browser.json`, JSON.stringify(report, null, 2)+'\n');
  console.log('R88_PAINTED_BROWSER_RESULT', JSON.stringify(report));
  await browser?.close();
}
