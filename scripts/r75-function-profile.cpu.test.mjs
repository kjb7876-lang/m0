import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyProfileFrame,
  estimateProfilerOverhead,
  summarizeCpuProfile,
  summarizeDecodeWaits,
} from './r75-function-profile.core.mjs';

test('profile categories attribute nested path and collision samples once to the nearest matching frame', () => {
  const profile = {
    nodes: [
      {id: 1, callFrame: {functionName: 'tick', url: 'phase1.js', lineNumber: 9}, children: [2]},
      {id: 2, callFrame: {functionName: 'tickEnemies', url: 'phase1.js', lineNumber: 10}, children: [3]},
      {id: 3, callFrame: {functionName: 'findPath', url: 'phase1.js', lineNumber: 11}, children: [4]},
      {id: 4, callFrame: {functionName: 'blocked', url: 'phase1.js', lineNumber: 12}, children: []},
      {id: 5, callFrame: {functionName: 'drawEffect', url: 'phase1.js', lineNumber: 13}, children: [6]},
      {id: 6, callFrame: {functionName: 'drawImage', url: 'phase1.js', lineNumber: 14}, children: []},
    ],
    samples: [4, 3, 2, 1, 6],
    timeDeltas: [1000, 1000, 1000, 1000, 2000],
  };
  const summary = summarizeCpuProfile(profile);
  const categoryMs = Object.fromEntries(summary.categories.map(row => [row.name, row.sampledMs]));
  assert.deepEqual(categoryMs, {
    'image-decoding': 0,
    pathfinding: 1,
    collision: 1,
    'enemy-ai': 1,
    effects: 0,
    rendering: 2,
    'game-update': 1,
    other: 0,
  });
  assert.equal(summary.sampledMainThreadMs, 6);
  const tick = summary.topFunctions.find(row => row.functionName === 'tick');
  assert.equal(tick.inclusiveMs, 4);
  assert.equal(tick.selfMs, 1);
});

test('classification separates explicit image decode and frame/render code', () => {
  assert.equal(classifyProfileFrame({functionName: 'decode', url: 'HTMLImageElement'}), 'image-decoding');
  assert.equal(classifyProfileFrame({functionName: 'clearLine', url: 'phase1.js'}), 'collision');
  assert.equal(classifyProfileFrame({functionName: 'draw', url: 'phase1.js'}), 'rendering');
  assert.equal(classifyProfileFrame({functionName: 'frame', url: 'phase1.js'}), 'game-update');
});

test('profiler overhead is estimated against the midpoint of bracketing controls', () => {
  assert.deepEqual(estimateProfilerOverhead(20, 24, 22), {
    controlMedianP95Ms: 21,
    profiledP95Ms: 24,
    estimatedAddedP95Ms: 3,
    estimatedAddedPercent: 14.29,
  });
  assert.deepEqual(estimateProfilerOverhead(null, 20, null), {
    controlMedianP95Ms: null,
    profiledP95Ms: null,
    estimatedAddedP95Ms: null,
    estimatedAddedPercent: null,
  });
});

test('image decode waits are grouped by phase and clearly labeled as latency', () => {
  const summary = summarizeDecodeWaits([
    {method: 'HTMLImageElement.decode', phase: 'boot', durationMs: 10, ok: true},
    {method: 'HTMLImageElement.decode', phase: 'boot', durationMs: 30, ok: false},
    {method: 'createImageBitmap', phase: 'region', durationMs: 5, ok: true},
  ]);
  assert.equal(summary.byPhase.boot['HTMLImageElement.decode'].count, 2);
  assert.equal(summary.byPhase.boot['HTMLImageElement.decode'].failures, 1);
  assert.equal(summary.byPhase.region.createImageBitmap.waitMs.p50Ms, 5);
  assert.match(summary.note, /not summed CPU time/);
});
