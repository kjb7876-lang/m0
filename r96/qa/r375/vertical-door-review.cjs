'use strict';
// Reproducer of the independent 4,410 vertical-door cases already reviewed.
// Usage: node vertical-door-review.cjs <world-scale-r375.js> <result.json>
const fs = require('fs'), vm = require('vm'), path = require('path'), crypto = require('crypto');
const sourcePath = path.resolve(process.argv[2] || path.join(__dirname, '../../client-source/world-scale-r375.js'));
const resultPath = path.resolve(process.argv[3] || path.join(process.env.OUT || __dirname, 'vertical-door-review-result.json'));
const source = fs.readFileSync(sourcePath, 'utf8'), s = { console };
s.window = s;
vm.createContext(s);
vm.runInContext(source, s, { filename: sourcePath });
const M = s.__STORYWORLD_WORLD_SCALE_R375__, point = (x, y) => ({ x, y });

function make(open) {
  const wall = (id, y0, y1, door = false) => ({
    id, x: 10, y: (y0 + y1) / 2, width: y1 - y0, depth: .24,
    angle: Math.PI / 2, endpoints: [[10, y0], [10, y1]], height: 2.7,
    annex: true, hospitalCoreB2: true, ...(door ? { hospitalDoorB3: 'vdoor' } : {})
  });
  const walls = [wall('lower', 0, 7), wall('upper', 13, 20), ...(open ? [] : [wall('leaf', 7, 13, true)])];
  const doors = [{ id: 'vdoor', x: 10, y: 10, width: .24, depth: 6, axis: 'x', reach: 3 }];
  return {
    id: 'vertical-fixture', bounds: [0, 0, 20, 20],
    floorCells: Array.from({ length: 400 }, (_, i) => [i % 20, Math.floor(i / 20)]),
    floorRects: [{ x: 0, y: 0, width: 20, depth: 20 }], walls,
    hospitalCoreB2: { rects: [['r', 0, 0, 20, 20]], wallDepth: .24, doors },
    hospitalDoorsB3: doors, hospitalBoundary12: walls, hospitalVisualWalls12: walls
  };
}

let comparisons = 0;
const configurations = [];
for (const open of [true, false]) {
  const L = make(open), Q = M.scaleLayout(L), N = M.hospitalPhysics(L), P = M.hospitalPhysics(Q);
  for (const r of [0, .1, .29, .5, .9]) {
    for (let i = -220; i <= 220; i++) {
      const offset = i * .02 + .003;
      const a = point(9, 10 + offset), b = point(11, 10 + offset);
      const aa = point(19, 20 + offset), bb = point(21, 20 + offset);
      if (P.blocked(20, 20 + offset, r) !== N.blocked(10, 10 + offset, r)
          || P.clear(aa, bb, r) !== N.clear(a, b, r)) {
        throw Error(JSON.stringify({ open, r, offset }));
      }
      comparisons++;
    }
  }
  for (const w of Q.walls.filter(w => w.r375Jamb)) {
    if (w.width !== 3 || w.depth !== .24 || w.angle !== Math.PI / 2
        || w.endpoints[0][0] !== 20 || w.endpoints[1][0] !== 20) {
      throw Error('bad vertical representation');
    }
  }
  configurations.push({
    open,
    jambs: Q.walls.filter(w => w.r375Jamb).map(w => ({ width: w.width, depth: w.depth, angle: w.angle, endpoints: w.endpoints })),
    leaves: Q.walls.filter(w => w.hospitalDoorB3).map(w => ({ endpoints: w.endpoints, bounds: w.analyticBounds12 }))
  });
}
const result = {
  mode: 'independent synthetic vertical-door point/sweep parity; no game runtime installation',
  sourcePath, sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  revision: M.revision, passed: true, comparisons,
  meaning: '4410 cases; each compares both blocked and clear against the original doorway',
  radii: [0, .1, .29, .5, .9], offsetSteps: [-220, 220], offsetIncrement: .02, offsetBias: .003,
  configurations
};
fs.mkdirSync(path.dirname(resultPath), { recursive: true });
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, comparisons, resultPath, sourceSha256: result.sourceSha256 }));
