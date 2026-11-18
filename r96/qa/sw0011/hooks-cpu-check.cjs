'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sources = path.resolve(__dirname, '../../client-source');
const owner = 'ego-sovereign-r1046.js';
const names = ['tick', 'serializeSave', 'restoreSave'];
function load(host, filename, directory = sources) {
  vm.runInContext(fs.readFileSync(path.join(directory, filename), 'utf8'), host, {filename});
}
function hostWithTimers(properties = {}) {
  const timers = new Map();
  const host = {
    ...properties,
    timers,
    setInterval(run, period) { const id = Symbol(); timers.set(id, {run, period}); return id; },
    clearInterval(id) { timers.delete(id); }
  };
  host.window = host;
  return vm.createContext(host);
}

async function dispatchContract() {
  const order = [], receiver = {}, originalError = new Error('engine'), saved = {player: {}};
  const host = hostWithTimers({
    tick(first, second) {
      assert.equal(this, receiver);
      assert.equal(second, 'extra');
      if (first < 0) throw originalError;
      order.push('engine');
      return saved;
    },
    serializeSave() { return saved; },
    async restoreSave(raw) { if (raw === 'bad') throw originalError; return false; }
  });
  load(host, owner);
  const hub = host.__STORYWORLD_POST_HOOKS__;
  const add = (id, handlers) => hub.register(id, handlers, err => order.push(err.message));
  add('__r1', {
    tick(dt) { order.push(dt); throw new Error('first hook'); },
    serializeSave(result) { assert.equal(result, saved); result.edited = true; },
    restoreSave(raw) { order.push(raw); }
  });
  const first = host.tick;
  add('__r2', {tick() { order.push('second'); }});
  assert.equal(host.tick, first);
  assert.equal(host.serializeSave(), saved);
  assert.equal(saved.edited, true);
  const beforeLegacy = host.tick;
  host.tick = function(dt) {
    if (dt === 0) return 'paused';
    const result = beforeLegacy.apply(this, arguments);
    order.push('legacy');
    return result;
  };
  add('__r3', {tick() { order.push('third'); }});
  add('__r1', {tick() { order.push('duplicate'); }});
  assert.equal(host.tick.call(receiver, 1, 'extra'), saved);
  assert.deepEqual(order.splice(0), ['engine', 1, 'first hook', 'second', 'legacy', 'third']);
  assert.equal(host.tick.call(receiver, 0, 'extra'), 'paused');
  assert.deepEqual(order.splice(0), ['third']);
  assert.throws(() => host.tick.call(receiver, -1, 'extra'), err => err === originalError);
  assert.equal(await host.restoreSave(saved), false);
  assert.deepEqual(order.splice(0), [saved]);
  await assert.rejects(host.restoreSave('bad'), err => err === originalError);
  assert.deepEqual(order, []);

  const late = hostWithTimers();
  load(late, owner);
  late.__STORYWORLD_POST_HOOKS__.register('__r1', {tick: dt => order.push(dt)}, assert.fail);
  assert.equal(late.timers.size, 1);
  late.tick = dt => dt * 2;
  // The second subscriber can arrive before the scheduled retry for the first.
  late.__STORYWORLD_POST_HOOKS__.register('__r2', {tick: dt => order.push(dt + 1)}, assert.fail);
  for (const timer of late.timers.values()) timer.run();
  assert.equal(late.timers.size, 0);
  assert.equal(late.tick(3), 6);
  assert.deepEqual(order, [3, 4]);
}

async function longGame(directory) {
  const writes = new Map(), reads = new Map();
  const host = hostWithTimers({
    time: 1, room: {}, started: true, localStorage: {getItem() { return null; }},
    player: {hero: 'hwando', hp: 100, x: 1, y: 1, storyWER: {ready: {}}},
    tick(dt) { host.time += dt; },
    serializeSave() {
      return {player: new Proxy({}, {set(data, key, value) {
        writes.set(key, (writes.get(key) || 0) + 1);
        return Reflect.set(data, key, value);
      }})};
    },
    async restoreSave() { return true; }
  });
  const files = ['ego-sovereign-r1046-data.js', owner, 'ego-kit-r1094.js', 'persona-hero-r1113.js'];
  const html = fs.readFileSync(path.resolve(directory, '../runtime-text/index.html'), 'utf8');
  let position = -1;
  for (const filename of files) {
    const index = html.indexOf('src="./' + filename + '"', position + 1);
    assert.ok(index > position, 'Production script order: ' + filename);
    position = index;
    load(host, filename, directory);
  }
  for (const name of names) {
    const captured = host[name];
    let outer = function() { return captured.apply(this, arguments); };
    Object.defineProperty(host, name, {
      configurable: true,
      get() { reads.set(name, (reads.get(name) || 0) + 1); return outer; },
      set(replacement) { outer = replacement; }
    });
  }
  // Advance the real installers at their declared intervals past the original 40–80 minute failure.
  for (let elapsed = 250; elapsed <= 80 * 60 * 1000; elapsed += 250) {
    for (const {run, period} of host.timers.values()) if (elapsed % period === 0) run();
  }
  const installerReads = Object.fromEntries(reads);
  const formReads = {egoSovereignR1046: 0, personaHeroR1113: 0};
  const player = host.player;
  host.player = new Proxy(player, {get(target, key) {
    if (Object.hasOwn(formReads, key)) formReads[key]++;
    return Reflect.get(target, key);
  }});
  host.tick(1 / 60);
  host.player = player;
  assert.equal(host.time, 1 + 1 / 60);
  const save = host.serializeSave();
  assert.equal(await host.restoreSave(save), true);
  for (const name of ['__STORYWORLD_EGO_SOVEREIGN_R1046__', '__STORYWORLD_EGO_KIT_R1094__', '__STORYWORLD_PERSONA_HERO_R1113__']) {
    assert.equal(host[name].inspect().stats.errors, 0, name);
  }
  return {installerReads, formReadsPerTick: formReads, fieldWritesPerSave: Object.fromEntries(writes)};
}

(async () => {
  // Run this same probe against an unmodified checkout: --measure /path/to/baseline
  if (process.argv[2] === '--measure') {
    console.log(JSON.stringify(await longGame(path.resolve(process.argv[3], 'r96/client-source'))));
    return;
  }
  await dispatchContract();
  const measured = await longGame(sources);
  assert.deepEqual(measured.installerReads, {}, 'No polling for installed tick/save functions');
  assert.deepEqual(measured.fieldWritesPerSave, {egoSovereignR1046: 1, personaHeroR1113: 1});
  assert.deepEqual(measured.formReadsPerTick, {egoSovereignR1046: 2, personaHeroR1113: 2});
  console.log('PASS shared tick/save dispatch, legacy wrapper ordering, async restore and 80-minute timer simulation');
})().catch(error => { console.error(error); process.exitCode = 1; });
