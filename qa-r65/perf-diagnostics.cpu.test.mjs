import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

globalThis.window = {};
const require = createRequire(import.meta.url);
require('../docs/dist/phase1.js');
const api = window.StoryPhase1;

assert.equal(api.needsScreenPosition24({kind: 'image', style: {}}), false);
assert.equal(api.needsScreenPosition24({kind: 'fill', style: {fillStyle: '#fff'}}), false);
assert.equal(api.needsScreenPosition24({kind: 'stroke', style: {strokeStyle: '#fff'}}), false);
assert.equal(api.needsScreenPosition24({kind: 'fill', style: {fillStyle: {kind: 'linear', stops: []}}}), true);
assert.equal(api.needsScreenPosition24({kind: 'stroke', style: {strokeStyle: {kind: 'radial', stops: []}}}), true);

assert.deepEqual(api.sightDiagnosticCounts24({
  segments: 18, boxes: 7, circles: 3,
  raySegments: 0, rayBoxes: 0, rayCircles: 0,
}), {
  obstacleSegments: 18, obstacleBoxes: 7, obstacleCircles: 3,
  raySegments: 0, rayObstacleBoxes: 0, rayObstacleCircles: 0,
});

assert.deepEqual(api.sightDiagnosticCounts24({segments: 2, boxes: 4, circles: 1}), {
  obstacleSegments: 2, obstacleBoxes: 4, obstacleCircles: 1,
  raySegments: 2, rayObstacleBoxes: 4, rayObstacleCircles: 1,
});

const projection = {width: 800, height: 600, zoom: 1, camX: 0, camY: 0, tile: 32};
const commandScene = new api.CommandScene({}, {projection, scene: {}, camera: {}});
const initialScreen = new Float32Array([
  200.25, 100.5, 250.75, 105.25, 203.125, 140.875,
]);
const attribute = {array: new Float32Array(initialScreen), needsUpdate: false};
const owner = {kind: 'scene', groundAligned: false, x: null, y: null, renderHeight: null, visualHospitalFrame: null};
const initialCommand = {
  kind: 'fill', lineWidth: 1, rule: 'nonzero', sourceRect: null, imageSize: null,
  points: null, paths: [{points: [[200.25, 100.5], [250.75, 105.25], [203.125, 140.875]], closed: true}],
  clips: [], owner,
};
const row = {
  mesh: {material: {isShaderMaterial: true}, geometry: {getAttribute: () => attribute}},
};
commandScene.keepCommand(row, initialCommand);
commandScene.rows.set('probe', row);

function shifted(value, dx, dy) {
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      return [value[0] + dx, value[1] + dy];
    }
    return value.map(child => shifted(child, dx, dy));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shifted(child, dx, dy)]));
  }
  return value;
}

const cameraStartX = projection.camX;
const cameraStartY = projection.camY;
const steps = 200_000;
for (let i = 1; i <= steps; i++) {
  if (i === steps / 2) projection.camX = cameraStartX;
  else projection.camX += 1e-7;
  const cx = projection.camX - row.projection.camX;
  const cy = projection.camY - row.projection.camY;
  const dx = (-cx + cy) * projection.tile * projection.zoom;
  const dy = (-cx - cy) * projection.tile * 0.5 * projection.zoom;
  const current = {
    ...initialCommand,
    paths: shifted(row.geometryState.paths, dx, dy),
    clips: shifted(row.geometryState.clips, dx, dy),
  };
  const delta = commandScene.cameraTranslation24(row, current);
  assert.ok(delta, `camera translation fast path rejected at step ${i}`);
  commandScene.applyCameraTranslation24(row, current, delta);
  assert.equal(attribute.needsUpdate, true);
  attribute.needsUpdate = false;
  if (i === steps / 2) {
    for (let n = 0; n < initialScreen.length; n++) {
      assert.ok(Math.abs(attribute.array[n] - initialScreen[n]) <= 1e-5, 'camera recenter must restore the original screen coordinates');
    }
  }
}

const totalX = projection.camX - cameraStartX;
const totalY = projection.camY - cameraStartY;
const expectedDx = (-totalX + totalY) * projection.tile * projection.zoom;
const expectedDy = (-totalX - totalY) * projection.tile * 0.5 * projection.zoom;
for (let i = 0; i < initialScreen.length; i += 2) {
  assert.ok(Math.abs(attribute.array[i] - (initialScreen[i] + expectedDx)) <= 1e-4, 'x screen position drifted after repeated panning');
  assert.ok(Math.abs(attribute.array[i + 1] - (initialScreen[i + 1] + expectedDy)) <= 1e-4, 'y screen position drifted after repeated panning');
}

const report = commandScene.inspect();
assert.equal(report.geometryComparisons, 0, 'fast-path comparisons must not be conflated with full geometry comparisons');
assert.equal(report.cameraTranslationComparisons, steps, 'each camera fast-path comparison must be counted exactly once');
assert.equal(report.screenPositionBaselineBytes, initialScreen.byteLength, 'baseline memory cost must be visible in diagnostics');
assert.equal(report.screenPositionAttributeBytes, initialScreen.byteLength, 'screen position attribute memory must be visible in diagnostics');
assert.equal(report.uvAttributeBytes, initialScreen.byteLength, 'shared vertex count diagnostic must be visible');

console.log(JSON.stringify({
  status: 'PERF_DIAGNOSTICS_CPU_PASSED',
  zeroFilteredObstacleCountsPreserved: true,
  repeatedCameraPans: steps,
  recenterCheckedAtStep: steps / 2,
  maxScreenCoordinateErrorPx: Math.max(...Array.from(attribute.array, (v, i) => Math.abs(v - (initialScreen[i] + (i % 2 ? expectedDy : expectedDx))))),
  geometryComparisons: report.geometryComparisons,
  cameraTranslationComparisons: report.cameraTranslationComparisons,
  screenPositionBaselineBytes: report.screenPositionBaselineBytes,
}));
