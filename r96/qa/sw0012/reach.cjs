const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../client-source/reach-r225.js'), 'utf8');
// Pass a previous reach-r225.js to compare every fixture against that revision.
// Without it, CI still checks the expected outcomes and allocation count.
const baseline = process.argv[2] && fs.readFileSync(process.argv[2], 'utf8');
function make(script, params = {}) {
  let clock = 100000, calls = 0, stringWrites = 0;
  class MeasuredMap extends Map {
    set(key, value) { if (typeof key === 'string') stringWrites++; return super.set(key, value); }
  }
  const bounds = params.bounds || [0, 0, 100, 100];
  const layout = {
    bounds,
    entry: params.entry || {x: 50.5, y: 50.5},
    floorCells: [[50, 50]], worldR74: {doors: params.doors || []},
  };
  const ctx = {
    started: true, loading: false, time: 1,
    Date: {now: () => clock}, Map: MeasuredMap, player: {...layout.entry},
    localStorage: {getItem: () => null},
    room: {id: 'area', exploration: layout, enemies: []},
    blocked(x, y) {
      calls++;
      return x >= bounds[2] || y >= bounds[3] || !!params.wall?.(x, y);
    },
  };
  ctx.window = ctx;
  vm.runInNewContext(script, ctx);
  const api = ctx.__STORYWORLD_REACH_R225__;
  return {
    ctx, api, layout,
    check(ms = 0, seconds = 0) {
      clock += ms;
      ctx.time += seconds;
      calls = 0;
      stringWrites = 0;
      api.check();
      return {calls, stringWrites};
    },
  };
}
function pair(params) {
  const before = baseline && make(baseline, params);
  const after = make(source, params);
  return {
    before, after,
    both(fn) { if (before) fn(before); fn(after); },
    check(ms, secs) {
      const result = after.check(ms, secs);
      if (before) {
        const reference = before.check(ms, secs);
        assert.equal(result.calls, reference.calls);
        assert.deepEqual(structuredClone(after.ctx.room.enemies), structuredClone(before.ctx.room.enemies));
        result.referenceStringWrites = reference.stringWrites;
      }
      return result;
    },
  };
}
function enemy(x, y) {
  return {hp: 10, x, y, homeX: x, homeY: y, nav: [], r234Since: -1};
}
{
  const p = pair();
  p.both(w => { w.ctx.room.enemies = [enemy(62.5, 52.5)]; });
  const cold = p.check(0, 1);
  assert.equal(p.after.ctx.room.enemies[0].r234Since, null);
  assert.equal(p.check(3000, 3).calls, 0);
  const refresh = p.check(16000, 3);
  assert.equal(refresh.calls, 20000);
  if (baseline) assert.equal(refresh.referenceStringWrites, 20000);
  assert.equal(refresh.stringWrites, 1);
  // From this moment exact nearest-cell tie breaking matters, even though a strict path exists.
  p.check(1000, 21);
  assert.equal(p.after.ctx.room.enemies[0].r234Regroup, 1);
  p.both(w => {
    w.ctx.player.x += 4;
    w.ctx.room.enemies.push(enemy(51.5, 55.5), enemy(47.5, 55.5));
  });
  p.check(1000, 3);
  assert.equal(p.after.ctx.room.enemies[2].r234Since, -1, 'three targets use entrance checks only');
  console.log('100×100 arena, per-window native collision calls and string Map inserts', {cold, refresh});
}
{
  const p = pair({wall: (x, y) => x === 50.5 && y === 50.5});
  p.both(w => { w.ctx.player.x = 52.5; w.ctx.room.enemies = [enemy(56.5, 52.5)]; });
  p.check();
  assert.equal(p.after.ctx.room.enemies[0].r234Since, null);
}
{
  let closed = true;
  const p = pair({
    bounds: [0, 0, 40, 40], entry: {x: 16.5, y: 20.5},
    doors: [{x: 20, y: 20.5, width: .24, depth: 4}],
    wall: (x, y) => x === 20 && (closed || y < 19 || y > 22),
  });
  p.both(w => { w.ctx.room.enemies = [enemy(17.5, 20.5)]; });
  p.check(0, 0);
  closed = false;
  p.both(w => { w.ctx.room.enemies[0].x = 22.5; });
  p.check(3000, 1);
  assert.equal(p.after.ctx.room.enemies[0].r234Since, 2, 'closed door starts strict timer');
  p.check(11000, 11);
  assert.equal(p.after.ctx.room.enemies[0].r234Moved, 1);
  p.both(w => { w.ctx.room.enemies[0].x = 22.5; w.ctx.room.enemies[0].r234Since = 1; });
  p.check(16000, 1);
  assert.equal(p.after.ctx.room.enemies[0].r234Since, null);
}
{
  let wall = false;
  const p = pair({wall: (x) => wall && x === 80});
  p.both(w => { w.ctx.room.enemies = [enemy(54.5, 55.5)]; });
  p.check();
  assert.equal(p.after.api.reachOf(p.after.layout).size, 10000, 'public result covers the whole map');
  wall = true;
  p.check(16000, 1);
  assert.equal(p.after.api.reachOf(p.after.layout).size, 8000, 'public non-fresh lookup drops old geometry');
}
{
  const p = pair({bounds: [0, 0, 300, 300], wall: (x, y) => x < 40 || x > 65 || y < 40 || y > 65});
  p.both(w => { w.ctx.room.enemies = [enemy(55.5, 50.5)]; });
  p.check();
  assert.equal(p.after.api.inspect().stats.layouts, 1, 'oversize map uses the same full traversal');
}
{
  const p = pair({wall: (x, y) => x < 48 || x > 53 || y < 48 || y > 53});
  p.both(w => { w.ctx.room.enemies = [enemy(51.5, 51.5)]; });
  p.check();
  assert.equal(p.after.ctx.room.enemies[0].r234Since, -1, 'component below 40 retains old timer');
}
console.log('PASS reach membership, two/three-target timers, regroup, door refresh, public cache and traversal bounds');
