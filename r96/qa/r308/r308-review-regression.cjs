'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'client-source/bgm-map-r308.js'), 'utf8');
const index = JSON.parse(fs.readFileSync(path.join(root, 'runtime-text/assets/r308/bgm/index.json'), 'utf8'));
async function boot() {
  const decks = [];
  class Audio {
    constructor() { this.currentTime = 0; this.duration = 200; this.paused = true; this.readyState = 4; decks.push(this); }
    set src(value) { this.url = value; this.currentTime = 0; }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    addEventListener() {}
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
test('A→B→A during map crossfade resumes the outgoing A position', async () => {
  const {c, decks, api, tick} = await boot();
  tick();
  const a = decks.find(d => !d.paused);
  a.currentTime = 77;
  c.zone = 'dist06'; tick(); tick(500);
  assert.equal(api.inspect().fading, true);
  a.currentTime = 77.5;
  c.zone = 'dist00'; tick();
  assert.equal(api.inspect().active.track, index.maps.dist00.track);
  assert.equal(api.inspect().active.time, 77.5);
  tick(2500);
  assert.equal(decks.filter(d => !d.paused).length, 1);
  assert.equal(api.inspect().active.time, 77.5);
  assert.equal(c.fallbackPlaying, false);
});
test('failed dist06 → dist00 → dist06 stops R308 before fallback playback', async () => {
  const {c, decks, api, tick} = await boot();
  c.zone = 'dist06'; tick();
  decks.find(d => !d.paused).onerror(); tick();
  assert.equal(c.fallbackPlaying, true);
  c.zone = 'dist00'; tick(); tick(2500);
  assert.equal(api.inspect().active.track, index.maps.dist00.track);
  assert.equal(c.fallbackPlaying, false);
  c.zone = 'dist06'; tick();
  assert.equal(decks.every(d => d.paused && d.volume === 0), true);
  assert.equal(api.inspect().active, null);
  assert.equal(c.fallbackPlaying, true);
  assert.equal(c.overlaps, 0);
  tick();
  assert.equal(decks.every(d => d.paused), true);
});
