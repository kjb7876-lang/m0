'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'client-source/bgm-map-r308.js'), 'utf8');
const index = JSON.parse(fs.readFileSync(path.join(root, 'runtime-text/assets/r308/bgm/index.json'), 'utf8'));
async function boot(delayed = false) {
  const decks = [];
  class Audio {
    constructor() { this.currentTime = 0; this.duration = 200; this.paused = true; this.readyState = 1; this.events = {}; decks.push(this); }
    set src(value) { this.url = value; this.currentTime = 0; this.readyState = delayed && value === index.tracks[index.maps.dist06.track].path ? 0 : 4; }
    play() { this.paused = false; if (!this.readyState) return new Promise(resolve => { this.resolvePlay = resolve; }); this.emit("playing"); return Promise.resolve(); }
    pause() { this.paused = true; }
    addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
    emit(name) { for (const fn of this.events[name] || []) fn(); }
  }
  const c = { Audio, now: 0, started: true, zone: 'dist00', settings: {music: true, bgm: .8},
    room: {}, localStorage: {getItem: () => null}, document: {hidden: false, addEventListener() {}},
    fetch: async () => ({ok: true, json: async () => index}), addEventListener() {}, fallbackPlaying: false };
  c.window = c;
  c.performance = {now: () => c.now};
  c.Date = {now: () => c.now};
  // Model the lower R195/engine chain and record overlap at the handoff itself.
  c.overlaps = 0;
  c.musicTick = () => { c.fallbackPlaying = c.settings.music; if (c.fallbackPlaying && decks.some(d => !d.paused)) c.overlaps++; };
  vm.runInNewContext(source, c);
  await new Promise(resolve => setImmediate(resolve));
  return {c, decks, api: c.__STORYWORLD_BGM_MAP_R308__, tick(ms = 100) { c.now += ms; c.musicTick(); }};
}

test('two completed loops then off/on retain active 42-second position', async () => {
  const {decks, api, tick} = await boot();
  tick();
  for (let i = 0; i < 2; i++) {
    decks.find(d => !d.paused).currentTime = 198;
    tick(); tick(3100);
  }
  assert.equal(api.inspect().stats.loops, 2);
  decks.find(d => !d.paused).currentTime = 42;
  api.set({on:false}); tick();
  assert.equal(decks.every(d => d.paused), true);
  api.set({on:true}); tick();
  assert.equal(api.inspect().active.time, 42);
  assert.equal(decks.filter(d => !d.paused).length, 1);
});
test('slow incoming track preserves outgoing deck until playing starts', async () => {
  const {c, decks, api, tick} = await boot(true);
  tick(); const outgoing = decks.find(d => !d.paused);
  c.zone = 'dist06'; tick();
  const incoming = decks.find(d => d !== outgoing);
  assert.equal(incoming.readyState, 0);
  tick(2500);
  assert.equal(outgoing.paused, false);
  assert.ok(outgoing.volume > 0);
  assert.equal(incoming.volume, 0);
  incoming.readyState = 4; incoming.emit('playing'); incoming.resolvePlay();
  await Promise.resolve(); tick(100);
  assert.equal(outgoing.paused, false);
  assert.ok(incoming.volume > 0 && incoming.volume < outgoing.volume);
  tick(2500);
  assert.equal(outgoing.paused, true);
  assert.equal(incoming.paused, false);
  assert.equal(api.inspect().fading, false);
  assert.equal(c.fallbackPlaying, false);
});
test('slow incoming track failure stops R308 before fallback', async () => {
  const {c, decks, tick} = await boot(true);
  tick(); c.zone = 'dist06'; tick();
  decks.find(d => d.readyState === 0).onerror(); tick();
  assert.equal(decks.every(d => d.paused && d.volume === 0), true);
  assert.equal(c.fallbackPlaying, true);
  assert.equal(c.overlaps, 0);
});
