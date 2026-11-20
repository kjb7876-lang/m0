'use strict';

// SW_URL is a built game. QA_DURATION_MS sets the minimum play time per mode, in wall time.
// SW_MODE=story|samong and SW_PRESET=1|2|3 select a single scenario. SHOTS retains captures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, webkit, devices} = require('playwright');
const timeout = 180000;

function launch() {
  if (process.env.WEBKIT_EXECUTABLE_PATH) return webkit.launch({executablePath: process.env.WEBKIT_EXECUTABLE_PATH});
  return chromium.launch({executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_PATH,
    args: ['--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
}

async function dismiss(page) {
  await page.evaluate(() => {
    for (let i=0; storyScene && i<200; i++) advanceScene();
    if (modal) closePanel(true);
  });
}

async function selectPreset(page, step) {
  await page.locator('#mobileSettingsR63').tap();
  const button = page.locator(`[data-r1043-step="${step}"]`);
  await button.tap();
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  assert.match(await button.innerText(), new RegExp(['', '초저', '낮음', '보통'][step]));
  await dismiss(page);
}

async function enterField(page, mode, step) {
  await page.goto(process.env.SW_URL || 'http://127.0.0.1:4396/', {waitUntil:'domcontentloaded', timeout});
  await page.locator('#campaignNew54').tap();
  await page.locator('#slotConfirmR73').tap();
  await page.waitForFunction(() => started && !loading, null, {timeout});
  await dismiss(page);
  await selectPreset(page, step);
  await enterArea(page, mode);
}

async function enterArea(page, mode) {
  // Unlock the destinations through a progressed regular save. Enter the genuine Samong zone.
  const restored = await page.evaluate(async mode => {
    const data = serializeSave();
    for (const r of Object.values(regionById)) {
      if (mode === 'samong' || r.index < regionById.dist02.index) data.progress.STORY[r.id] = true;
      if (mode === 'samong') data.progress.DREAM[r.id] = true;
    }
    if (mode === 'samong') data.ending.STORY = true;
    return await restoreSave(data);
  }, mode);
  assert.notEqual(restored, false);
  await dismiss(page);
  const entered = await page.evaluate(async mode => mode === 'samong'
    ? await __STORYWORLD_SAMONG_R103__.goZone('sz115-P-2')
    : await enterRegion('dist02', null, {layer:'STORY', restore:true, noStory:true}), mode);
  assert.ok(entered);
  await page.waitForFunction(mode => !loading && (mode === 'samong'
    ? layer === 'DREAM' && room?.samongR103?.zone === 'sz115-P-2' && __STORYWORLD_SAMONG_R103__.here()
    : layer === 'STORY' && room?.id === 'dist02' && !__STORYWORLD_SAMONG_R103__.here()), mode, {timeout});
  await dismiss(page);
  await page.evaluate(() => { auto = false; guide = false; });
  await page.waitForFunction(() => {
    const state = __STORYWORLD_PHASE1__.controller.state;
    return state.active === 'three' || state.failed;
  }, null, {timeout});
}

function state() {
  const render = __STORYWORLD_PHASE1__.controller.state, gl = render.three;
  const tier = __STORYWORLD_MOBILE_TIER_R1023__.inspect();
  const lod = __STORYWORLD_RENDER_LOD_R287__.inspect();
  const mem = __STORYWORLD_MOBILE_MEMORY_R980__.inspect();
  const props = __STORYWORLD_PROPS_TIDY_R412__.inspect().stats;
  // Count the live Three material bindings only; the original bitmap and sampled texture can differ.
  const kinds = {}, heroRows = [];
  let texturedRows=0;
  for (const row of gl?.commands.rows.values() || []) {
    const source = row.image, texture = row.mesh.material.map?.image, owner = row.mesh.userData.owner || row.geometryState?.owner;
    if (!texture || !source || !row.mesh.visible) continue;
    texturedRows++;
    if (owner?.kind) kinds[owner.kind]=(kinds[owner.kind]||0)+1;
    if (owner?.kind === 'hero') heroRows.push({source: source.src || source.__path || owner.bodyPath,
      original:[source.width,source.height], texture:[texture.width,texture.height]});
  }
  return {step:__STORYWORLD_PERF7_R1043__.step(), pref:tier.pref, tier:tier.tier, lowFx:settings.lowFx,
    coarse:matchMedia('(pointer:coarse)').matches, deviceDpr:devicePixelRatio, deviceMemory:typeof navigator.deviceMemory,
    renderer:render.active, reason:render.reason, contextLost:gl?.renderer.getContext().isContextLost(),
    renderDpr:dpr, canvas:[canvas.width,canvas.height], layer, room:room?.id, samong:room?.samongR103?.zone || null,
    cheat:__STORYWORLD_CHEAT777__.active(), lod:lod.stats, props, half:mem.stats, textures:gl?.renderer.info.memory.textures,
    texturedRows, kinds, heroRows, effects:[__STORYWORLD_LIGHT_ATMOS_R300__,__STORYWORLD_WEATHER_R450__,
      __STORYWORLD_LOCAL_LIGHT_R451__,__STORYWORLD_ACTOR_TONE_R453__].map(module=>module.prefs().on), phaseSeconds:time};
}

async function playSample(page, direction) {
  const point = await page.evaluate(direction => {
    const bounds = canvas.getBoundingClientRect();
    // The previous-region portal is on the arrival tile in STORY. A reversing tap there
    // can quietly move the hero into a different encounter halfway through a sample.
    const portals = __STORYWORLD_ROUTES_R72__.inspect().portals.filter(p=>p.open && p.point);
    const offsets = [[2,-1],[2,1],[2,2],[1,-2],[2,-2],[3,0],[0,3],[-2,2],[-2,0],[0,-3]];
    for (const [dx,dy] of offsets) {
      const tx=player.x+dx*direction, ty=player.y+dy*direction;
      if (portals.some(({point:p}) => Math.hypot(tx-p.x,ty-p.y)<3)) continue;
      if (blocked(tx,ty,.44,room)) continue;
      const q=project(tx,ty);
      const x=Math.round(bounds.left+q.x*bounds.width/W), y=Math.round(bounds.top+q.y*bounds.height/H);
      if (document.elementFromPoint(x,y)===canvas) return {x,y};
    }
    return null;
  }, direction);
  assert.ok(point, 'no unobscured movement target on the game canvas');
  await page.touchscreen.tap(point.x, point.y);
  return page.evaluate(() => new Promise(resolve => {
    let count=0, previous, x=player.x, y=player.y, distance=0, peakEnemies=0, minHp=player.hp, enemyHp;
    const dt=[], start=time, startHp=room.enemies.reduce((v,e)=>v+Math.max(0,e.hp),0);
    function sample(t) {
      if (previous !== undefined) dt.push(t-previous);
      previous=t;
      distance+=Math.hypot(player.x-x,player.y-y); x=player.x; y=player.y;
      minHp=Math.min(minHp,player.hp); peakEnemies=Math.max(peakEnemies,room.enemies.filter(e=>e.hp>0).length);
      enemyHp=room.enemies.reduce((v,e)=>v+Math.max(0,e.hp),0);
      if (++count <= 24) return requestAnimationFrame(sample);
      dt.sort((a,b)=>a-b);
      resolve({seconds:time-start, distance, minHp, enemyHpChange:enemyHp-startHp, peakEnemies,
        medianMs:dt[Math.floor((dt.length-1)*.5)], p95Ms:dt[Math.ceil(dt.length*.95)-1],
        long250:dt.filter(n=>n>250).length, endRoom:room.id, pointer:window.qaQualityTouch});
    }
    requestAnimationFrame(sample);
  }));
}

// Exercise the published Samong rare meteor presentation after measuring ordinary gameplay.
// R103 normally calls this R162 pattern hook from a boss encounter. Use its real renderer
// and R976 P-zone replacement, without manufacturing damage or changing a gameplay timer.
async function sampleSamongCue(page) {
  await page.evaluate(async () => {
    const path=__STORYWORLD_PIXELFX_R163__.meta().meteor.r976Path;
    if (path!=='assets/r411/fx/boss-meteor.webp') throw Error('expected Samong P meteor atlas');
    await ensureImages([path]);
    __STORYWORLD_SAMONG_PLAY_R162__.pattern('meteor',{pts:[{x:player.x+1,y:player.y,warn:.9}]});
  });
  const binding=await page.waitForFunction(() => {
    const scene=__STORYWORLD_PHASE1__.controller.state.three.commands;
    for (const [key,row] of scene.rows) {
      if (!key.startsWith('r163:meteor:') || !row.mesh.visible) continue;
      const texture=row.mesh.material.map?.image;
      if (!texture) continue;
      return {key, path:row.image?.src || row.mesh.userData.sourcePath, texture:[texture.width,texture.height],
        source:[row.image?.width,row.image?.height], opacity:row.mesh.material.opacity};
    }
    return false;
  }, null, {timeout:30000});
  return binding.jsonValue();
}

async function run(mode, step, durationMs) {
  const browser = await launch();
  try {
    const context = await browser.newContext({...devices['iPhone 13 Mini landscape'],
      viewport:{width:812,height:375}, screen:{width:812,height:375}, deviceScaleFactor:3});
    await context.addInitScript(() => {
      Object.defineProperty(navigator,'deviceMemory',{configurable:true, get:()=>undefined});
      let seed=1807711;
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      document.addEventListener('pointerdown', e=>{if(e.isTrusted && e.target.id==='game')window.qaQualityTouch=e.pointerType;},true);
    });
    const page = await context.newPage(), errors=[];
    page.setDefaultTimeout(timeout);
    page.on('pageerror', error=>errors.push(error.message));
    await enterField(page,mode,step);
    const before = await page.evaluate(state);
    assert.equal(before.renderer,'three',JSON.stringify(before));
    assert.equal(before.contextLost,false);
    assert.deepEqual([before.step,before.pref,before.tier],[step,step===3?'mid':'low',step===3?1:0]);
    assert.ok(before.coarse && before.deviceDpr===3 && before.deviceMemory==='undefined' && !before.cheat);
    assert.equal(before.lowFx,true);
    if (step===1) assert.deepEqual(before.effects,[false,false,false,false]);
    const begin=Date.now(), samples=[];
    do {
      const s=await playSample(page, samples.length%2 ? -1 : 1); samples.push(s);
      assert.equal(s.endRoom,before.room);
      assert.equal(s.pointer,'touch');
      assert.ok(s.seconds>0,'combat simulation stalled: '+JSON.stringify(s));
    } while (samples.length<3 || Date.now()-begin<durationMs);
    assert.ok(samples.some(s=>s.distance>.1) && samples.some(s=>s.peakEnemies>0), 'expected real movement and live combat');
    const after=await page.evaluate(state);
    assert.equal(after.renderer,'three'); assert.equal(after.contextLost,false);
    // R1248: main R1201 이 2 낮음 화면 배율을 0.9 로 내렸다(사용자 11-19 '0.9배 그대로 유지'). 3 보통은 1 그대로.
    if (step===2) assert.equal(after.renderDpr,.9);
    if (step===3) assert.equal(after.renderDpr,1);
    assert.ok(after.lod.viewportStarts>0 && after.lod.warmMeshes===0, 'expected viewport-first terrain entry');
    assert.ok(after.lod.chunksResident>0 && after.lod.chunksResident<after.lod.chunksAll,
      'the visible zone must retain only a subset of its terrain');
    assert.deepEqual([after.layer,after.samong], mode==='samong'?['DREAM','sz115-P-2']:['STORY',null]);
    assert.ok(after.texturedRows>0 && (before.heroRows.length || after.heroRows.length), 'expected a visible textured hero');
    const wallMs=Date.now()-begin;
    const cue=mode==='samong'?await sampleSamongCue(page):null;
    if (cue) assert.ok(cue.opacity>0 && cue.texture.every(n=>n>0));
    assert.deepEqual(errors,[]);
    const report={mode,step,wallMs,before,after,samples,cue};
    if (process.env.SHOTS) {
      fs.mkdirSync(process.env.SHOTS,{recursive:true});
      const file=path.join(process.env.SHOTS,mode+'-'+step);
      fs.writeFileSync(file+'.json',JSON.stringify(report,null,2)+'\n');
      await page.screenshot({path:file+'.png',scale:'css'});
    }
    console.log('PASS',mode,'step',step,JSON.stringify({samples:samples.length,wallMs:report.wallMs,
      seconds:samples.reduce((v,s)=>v+s.seconds,0),maxEnemies:Math.max(...samples.map(s=>s.peakEnemies)),
      minHp:Math.min(...samples.map(s=>s.minHp)),renderer:after.renderer,warmMeshes:after.lod.warmMeshes,
      viewportStarts:after.lod.viewportStarts,texturedRows:after.texturedRows,heroTextures:after.heroRows.length,cue:cue?.texture}));
    return report;
  } finally { await browser.close(); }
}

async function main() {
  const modes=process.env.SW_MODE?[process.env.SW_MODE]:['story','samong'];
  const step=Number(process.env.SW_PRESET||3), duration=Number(process.env.QA_DURATION_MS||0);
  assert.ok([1,2,3].includes(step) && Number.isFinite(duration) && duration>=0);
  for (const mode of modes) {assert.ok(['story','samong'].includes(mode)); await run(mode,step,duration);}
}
module.exports={enterField,enterArea,selectPreset,playSample,sampleSamongCue,state,run};
if (require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
