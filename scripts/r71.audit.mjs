import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const baseDir = path.resolve(process.env.R71_BASE_DOCS || '_r70/docs');
const candidateDir = path.resolve(process.env.R71_DOCS || '_pages/docs');
const baseHTML = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
const candidateHTML = fs.readFileSync(path.join(candidateDir, 'index.html'), 'utf8');
const baseRenderer = fs.readFileSync(path.join(baseDir, 'dist/phase1.js'), 'utf8');
const candidateRenderer = fs.readFileSync(path.join(candidateDir, 'dist/phase1.js'), 'utf8');
const baseManifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'web-manifest-r62.json'), 'utf8'));
const candidateManifest = JSON.parse(fs.readFileSync(path.join(candidateDir, 'web-manifest-r62.json'), 'utf8'));

function inlineScript(html, id) {
  const match = html.match(new RegExp(`<script\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>([\\s\\S]*?)<\\/script>`, 'i'));
  assert.ok(match, `missing inline script ${id}`);
  return match[1];
}

assert.equal(
  crypto.createHash('sha256').update(candidateHTML).digest('hex'),
  candidateManifest.webHTMLSha256,
  'the manifest must describe the exact candidate HTML',
);

const oldFiles = new Map(baseManifest.files.map(row => [row.path, row]));
const nextFiles = new Map(candidateManifest.files.map(row => [row.path, row]));
assert.deepEqual([...nextFiles.keys()].sort(), [...oldFiles.keys()].sort(), 'R71 must keep the packaged runtime file set');
const changedFiles = [];
for (const [name, oldRow] of oldFiles) {
  const next = nextFiles.get(name);
  if (next.sha256 !== oldRow.sha256 || next.bytes !== oldRow.bytes) changedFiles.push(name);
  if (!['index.html', 'dist/phase1.js'].includes(name)) {
    assert.deepEqual(next, oldRow, `R71 must preserve original runtime asset ${name}`);
  }
}
assert.deepEqual(changedFiles.sort(), ['dist/phase1.js', 'index.html']);
assert.deepEqual(candidateManifest.r71?.changedFiles?.slice().sort(), changedFiles.sort(), 'R71 manifest changedFiles must match the package delta');
assert.equal(candidateManifest.r71?.mediaChanged, false, 'R71 is a code-only visual and gameplay update');

assert.equal(
  inlineScript(candidateHTML, 'story-campaign-data-r54'),
  inlineScript(baseHTML, 'story-campaign-data-r54'),
  'the existing story campaign data must remain byte-identical',
);

// R71 health deliberately modifies a few private R62 closure hooks because
// that closure captures `hurt` before the R71 helper loads. Compare the entire
// resulting closure against the output of that exact count-guarded transform
// over R70; this keeps every unrelated coop byte locked to baseline.
const healthTransform = [
  'import importlib.util,sys',
  "spec=importlib.util.spec_from_file_location('health_r71','scripts/health-r71.py')",
  'module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)',
  'sys.stdout.write(module.transform_html(sys.stdin.read()))',
].join('\n');
const expectedHealth = spawnSync('python3', ['-c', healthTransform], {
  cwd: process.cwd(), input: baseHTML, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
assert.equal(expectedHealth.status, 0, expectedHealth.stderr || 'health transform failed');
assert.equal(
  inlineScript(candidateHTML, 'coop-sim-r62'),
  inlineScript(expectedHealth.stdout, 'coop-sim-r62'),
  'the full coop runtime must contain only the exact approved R71 health substitutions',
);

// These are the existing chance and amount rules. R71 may repair drop rendering,
// pickup, position validation, and persistence, but these values stay identical.
assert.match(candidateHTML, /const POINT_DROP_BOSS_CHANCE=Object\.freeze\(\{easy:\.10,normal:\.50,hard:\.77\}\)/);
assert.match(candidateHTML, /function pointDropChance\(tier,isBoss\)\{const boss=POINT_DROP_BOSS_CHANCE\[validTier\(tier\)\];return isBoss\?boss:boss\/10;\}/);
assert.match(candidateHTML, /amount:1\+Math\.floor\(next\(\)\*7\)/);
assert.match(candidateHTML, /function pointRandom\(id\)/);
assert.match(candidateHTML, /function rollPointForKill\(tier,isBoss,killId\)/);

// Preserve the old attack/motif assertions while allowing the R71 HP balance.
for (const token of [
  "hitLimit=()=>Math.min(12,2+maxRank())",
  "targetLimit=()=>Math.min(8,1+maxRank())",
  "motifIdsR64=['threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64']",
  'base*.35',
  'perHit/3',
  'hitIndex===castState.hitCount-1?1.35:1',
]) assert.ok(candidateHTML.includes(token), `existing combat contract is missing: ${token}`);

for (const token of [
  '__STORYWORLD_HEALTH_R71__',
  'maxHP',
  '__STORYWORLD_PROGRESSION_R71__',
  'openDifficulty',
  'confirmDifficulty',
  'recordPointDrop',
  'collectPointDrops',
]) assert.ok(candidateHTML.includes(token), `R71 runtime integration is missing: ${token}`);
assert.ok(candidateRenderer.includes('mapReadabilityR71'), 'candidate renderer must publish map-role diagnostics');

console.log('R71_AUDIT', JSON.stringify({
  base: baseDir,
  candidate: candidateDir,
  runtimeFiles: candidateManifest.files.length,
  changedFiles: changedFiles.sort(),
  mediaChanged: candidateManifest.r71.mediaChanged,
  gameplayHooks: ['health', 'difficulty', 'drops'],
  mapDiagnostics: 'mapReadabilityR71',
  preservedAttackContract: true,
  preservedPointDropPolicy: true,
}));
