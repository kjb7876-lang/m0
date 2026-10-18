import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();
const URL = process.env.STORYWORLD_URL || 'http://127.0.0.1:4391/';
const OUT = path.resolve('out/r71/native');
const LEGACY = path.join(ROOT, 'scripts/r66.browser.test.mjs');
const GENERATED = path.join(OUT, 'r71-native-generated.mjs');
const PREPARE_ONLY = process.argv.includes('--prepare-only');

const R70_HASHES = {
  'docs/index.html': '76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5',
  'docs/dist/phase1.js': 'b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4',
};
const NATIVE_FUNCTIONS = [
  {
    name: 'openGame',
    start: 'async function openGame({baseline=false,mobile=false}={}){',
    end: 'async function damageCase(baseline){',
    sha256: 'e7196a474604266598306e34440bea3e3909efec723e2f2a21d93bcfe99aba9b',
  },
  {
    name: 'damageCase',
    start: 'async function damageCase(baseline){',
    end: 'async function hudCase(mobile){',
    sha256: '6d056ca3759a99a2ef0363c2721a08caf67dc6e88541caa3a86b7e5630fce041',
  },
  {
    name: 'hudCase',
    start: 'async function hudCase(mobile){',
    end: 'async function lifecycleCase(){',
    sha256: 'f73863bec5119268f266dde28dff3685eb5bfd6f697b23131dbdede1cad78ace',
  },
  {
    name: 'lifecycleCase',
    start: 'async function lifecycleCase(){',
    end: 'async function runLegacy(){',
    sha256: '5477fee767b73431cd2328591cbef66cbf0059ad38a5a92cef2c372ea0be9253',
  },
];
const NATIVE_DRIVER = {
  start: "try{\n const old=await damageCase(true),next=await damageCase(false);",
  end: '}finally{await browser.close();}',
  sha256: 'e725ab177e49d8584ccc97f7d143e4d1f02c72df1e875af682ccb798af6b4ed5',
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requireOnce(source, oldValue, newValue, label) {
  const count = source.split(oldValue).length - 1;
  assert.equal(count, 1, `R71 native source guard failed for ${label}: found ${count}`);
  return source.replace(oldValue, newValue);
}

function requireNativeFunctions(source) {
  for (const row of NATIVE_FUNCTIONS) {
    const start = source.indexOf(row.start);
    const end = source.indexOf(row.end, start + row.start.length);
    assert.ok(start >= 0 && end > start, `R66 native function boundary changed: ${row.name}`);
    assert.equal(sha256(source.slice(start, end)), row.sha256,
      `R66 native assertion body changed: ${row.name}`);
  }
  const start = source.indexOf(NATIVE_DRIVER.start);
  const end = source.indexOf(NATIVE_DRIVER.end, start + NATIVE_DRIVER.start.length);
  assert.ok(start >= 0 && end > start, 'R66 native test driver boundary changed');
  assert.equal(sha256(source.slice(start, end + NATIVE_DRIVER.end.length)), NATIVE_DRIVER.sha256,
    'R66 native assertion driver changed');
}

async function main() {
  await fs.mkdir(OUT, {recursive: true});
  for (const [relative, expected] of Object.entries(R70_HASHES)) {
    const actual = sha256(await fs.readFile(path.join(ROOT, '_r70', relative)));
    assert.equal(actual, expected, `R71 native runner requires the pinned R70 ${relative}`);
  }

  let source = await fs.readFile(LEGACY, 'utf8');
  requireNativeFunctions(source);

  source = requireOnce(source, "OUT=path.resolve('out/r66')", "OUT=path.resolve('out/r71/native')", 'native artifact directory');
  source = requireOnce(source,
    "const baselineHTML=await fs.readFile('docs/index.html','utf8'),baselineModule=await fs.readFile('docs/dist/phase1.js','utf8'),helperSource=await fs.readFile('client-source/review-r66.js','utf8');",
    "const baselineHTML=await fs.readFile('_r70/docs/index.html','utf8'),baselineModule=await fs.readFile('_r70/docs/dist/phase1.js','utf8'),helperSource=await fs.readFile('client-source/review-r66.js','utf8');",
    'R70 baseline source');
  source = requireOnce(source,
    "await page.route(new globalThis.URL('dist/phase1.js',URL).href,r=>r.fulfill({status:200,contentType:'text/javascript',body:baselineModule}));",
    "await page.route('**/dist/phase1.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:baselineModule}));",
    'R70 renderer cache-key route');
  source = requireOnce(source, "revision:'R66-EGO-PERF'", "revision:'R71-NATIVE-REGRESSION'", 'report revision');
  source = requireOnce(source, 'R66_BOOT_STATE', 'R71_NATIVE_BOOT_STATE', 'boot report label');
  source = requireOnce(source, 'R66_CAMPAIGN_READY', 'R71_NATIVE_CAMPAIGN_READY', 'campaign report label');
  source = requireOnce(source, 'R66_HUD_ACTIVE_STATE', 'R71_NATIVE_HUD_ACTIVE_STATE', 'HUD report label');
  source = requireOnce(source, 'R66_HUD_ATOMIC_LIVE', 'R71_NATIVE_HUD_ATOMIC_LIVE', 'live HUD report label');

  // The native fixture remains pinned to R66's implementation, but its
  // synthetic boss now uses R71's suffix contract (666) and corresponding HUD.
  source = requireOnce(source, 'boss.maxHp=6421.5;boss.hp=3210.5;',
    'boss.maxHp=666;boss.hp=333;', 'R71 HUD boss fixture');
  source = requireOnce(source,
    "assert.equal(expected.hp,3210.5);assert.equal(expected.text,'3,211 / 6,422','Fixed-value formatting must be exact');",
    "assert.equal(expected.hp,333);assert.equal(expected.text,'333 / 666','R71 fixed-value boss formatting must be exact');",
    'R71 HUD suffix expectation');
  source = requireOnce(source, 'assert.ok(Math.abs(next.power/old.power-2)<1e-9);',
    'assert.ok(Math.abs(next.power/old.power-1)<1e-9);', 'R71 versus R70 power preservation');
  source = requireOnce(source,
    'next.damage.forEach((h,i)=>assert.ok(Math.abs(h.amount/old.damage[i].amount-4)<1e-9));',
    'next.damage.forEach((h,i)=>assert.ok(Math.abs(h.amount/old.damage[i].amount-1)<1e-9));',
    'R71 versus R70 hit preservation');
  source = requireOnce(source,
    "result.checks.push({name:'native-damage-and-ego-cooldown',baseline:old,candidate:next});await save();",
    "result.checks.push({name:'native-damage-and-ego-cooldown',baseline:old,candidate:next,comparison:'R71/R70; expected power and per-hit damage ratios are 1.0',legacyR66TwoAndFourXCoveredByR70Gate:true});await save();",
    'damage comparison provenance');

  // Keep the exact R66 damage/cooldown, HUD, and six-cycle save/restore cases.
  // The old runLegacy() exercises hard-coded pre-R71 HP values; the unchanged
  // R70 gate still runs it, while R71 QA owns the migrated HP/save contract.
  source = requireOnce(source,
    "result.checks.push({name:'existing-native-regressions',...await runLegacy()});result.status='passed';await save();console.log('R66_BROWSER_RESULT',JSON.stringify(result));",
    "result.checks.push({name:'legacy-runner-excluded-for-r71-health-contract',scope:'runLegacy remains covered by the unchanged R70 gate; R71 browser QA owns migrated HP and save expectations'});result.status='passed';await save();console.log('R71_NATIVE_BROWSER_RESULT',JSON.stringify(result));",
    'explicit legacy runner exclusion');
  source = source.replaceAll('R66_BROWSER_RESULT', 'R71_NATIVE_BROWSER_RESULT');

  await fs.writeFile(GENERATED, source);
  console.log('R71_NATIVE_SOURCE_GUARD', JSON.stringify({
    source: 'scripts/r66.browser.test.mjs',
    reused: NATIVE_FUNCTIONS.map(({name, sha256}) => ({name, sha256})),
    driverSha256: NATIVE_DRIVER.sha256,
    excluded: 'runLegacy(); covered by unchanged R70 gate and R71 health QA',
    generated: path.relative(ROOT, GENERATED),
  }));

  if (PREPARE_ONLY) return;
  const run = spawnSync(process.execPath, [GENERATED], {
    cwd: ROOT,
    env: {...process.env, STORYWORLD_URL: URL},
    stdio: 'inherit',
  });
  if (run.error) throw run.error;
  assert.equal(run.status, 0, `R71 native browser regression exited with status ${run.status}`);
}

main().catch(error => {
  console.error('R71_NATIVE_RUNNER_FAILED', error.stack || String(error));
  process.exitCode = 1;
});
