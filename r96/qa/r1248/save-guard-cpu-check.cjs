'use strict';
// R1248: 저장 불러오기 실패가 진행(HP·위치·형상·활성 슬롯·원본 저장)을 바꾸지 않는지, 두 탭이 같은 슬롯을 쓸 때
// 오래된 탭이 최신 진행을 덮어쓰지 않는지(충돌 사본 보존) 확인한다. 출시 R73 인라인 슬롯 코드·B1 저장 어댑터·
// EGO(R1046)·페르소나(R1113) 실제 파일을 vm 안에서 돌리고, 엔진 restoreSave·serializeSave·saveGame 만 흉내 낸다.
// 헤드리스 CPU 검사다(브라우저·실기기 플레이 아님).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const sources = path.join(root, 'client-source');
const html = fs.readFileSync(path.join(root, 'runtime-text/index.html'), 'utf8');
const inline = id => {
  const m = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'));
  assert.ok(m, 'inline script ' + id);
  return m[1];
};
const b1 = inline('hospital-b1-test-storage');
const r73 = inline('save-slots-r73');
const guardFile = path.join(sources, 'save-guard-r1248.js');
const files = ['ego-sovereign-r1046-data.js', 'ego-sovereign-r1046.js', 'persona-hero-r1113.js'];

const SAVE = 'storyworld.cpu.r1248';
const PREFIX = 'storyworld.hospital-three-pc.maze.v11:' + SAVE + '.slot-r73.';
const slotKey = n => PREFIX + n;
const conflictKey = n => PREFIX + n + '.conflict-r1248';
const SCOPE = 'hapil.storyworld.depth-full.20261008';

function envelope({zone = 'dist01', layer = 'STORY', hero = 'hwando', hp, x, y, ego = false, persona = false, savedAt}) {
  return {
    version: 6, scope: SCOPE, layer, zone,
    player: {hero, hp, x, y, level: 3, egoSovereignR1046: ego, personaHeroR1113: persona},
    progress: {STORY: {}, DREAM: {}}, rooms: {},
    saveSlotR73: {version: 1, slot: 1, savedAt, transitionComplete: true}
  };
}

function makeTab(map, name) {
  // 탭마다 Storage 클래스를 따로 둔다(브라우저도 창마다 prototype 이 따로다). 값은 같은 map 을 공유한다.
  class Storage {
    getItem(k) { return map.has(k) ? map.get(k) : null; }
    setItem(k, v) { map.set(k, String(v)); }
    removeItem(k) { map.delete(k); }
  }
  const timers = new Map();
  const host = {
    console, name, Storage, localStorage: new Storage(), toasts: [], failMode: null, restores: 0,
    SAVE, started: false, booted: true, loading: false, storyScene: null, modal: false,
    zone: 'hub', layer: 'STORY', room: null, player: null, time: 10, cam: null, route: [], command: null,
    regionById: {hub: {title: '거점'}, dist01: {title: '첫 지역'}, dist02: {title: '둘째 지역'}},
    setInterval(run, period) { const id = Symbol(); timers.set(id, {run, period}); return id; },
    clearInterval(id) { timers.delete(id); },
    setTimeout(run) { return 0; }, clearTimeout() {},
    blocked() { return false; },
    toast(m) { host.toasts.push(String(m)); },
    $() { return null; }, openPanel(h) { host.panelHTML = h; }, closePanel() {}, button() {},
    escapeHTML: s => String(s), showTitle() {}, showMenu() {}, loadLocal() {}, normalizeSave3: x => x,
    warn() {}
  };
  host.window = host;
  host.normalSaveKeyR73 = (kind = 'save') => host.__STORYWORLD_SAVE_SLOTS_R73__?.key(kind) || SAVE;
  const enter = (zone, layer) => { host.zone = zone; host.layer = layer; host.room = {id: zone, layer, exploration: {floorCells: []}}; };
  host.serializeSave = function() {
    const p = host.player;
    return {version: 6, scope: SCOPE, layer: host.layer, zone: host.zone,
      player: {hero: p.hero, hp: p.hp, x: p.x, y: p.y, level: 3}, progress: {STORY: {}, DREAM: {}}, rooms: {}};
  };
  // 엔진 restoreSave 흉내: 정상이면 undefined 반환(엔진 원본과 같음).
  host.restoreSave = async function(raw) {
    host.restores++;
    // 실패는 한 번만 일어난다(실패한 슬롯을 읽은 그 복원). 이어서 이전 진행을 되돌리는 복원은 정상으로 둔다.
    const mode = host.failMode;
    host.failMode = null;
    if (mode === 'false') return false;
    if (mode === 'throw') throw new Error('controlled restore exception');
    host.player = {hero: raw.player.hero, hp: raw.player.hp, x: raw.player.x, y: raw.player.y};
    if (mode === 'change-then-false') return false;
    if (mode === 'change-then-throw') throw new Error('controlled late restore exception');
    enter(raw.zone, raw.layer);
    host.started = true;
    return undefined;
  };
  host.saveGame = function(notice = true) {
    if (!host.started || !host.player || host.player.hp <= 0 || host.loading) return false;
    try { host.__STORYWORLD_TEST_STORAGE_B1__.store.setItem(host.normalSaveKeyR73(), JSON.stringify(host.serializeSave())); return true; }
    catch (e) { host.lastSaveError = e.message; return false; }
  };
  host.enterRegion = async function(zone) { enter(zone, host.layer); return true; };
  vm.createContext(host);
  vm.runInContext(b1, host, {filename: 'b1-storage'});
  vm.runInContext(r73, host, {filename: 'save-slots-r73'});
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(sources, f), 'utf8'), host, {filename: f});
  if (fs.existsSync(guardFile)) vm.runInContext(fs.readFileSync(guardFile, 'utf8'), host, {filename: 'save-guard-r1248.js'});
  host.slots = host.__STORYWORLD_SAVE_SLOTS_R73__;
  host.ego = host.__STORYWORLD_EGO_SOVEREIGN_R1046__;
  host.persona = host.__STORYWORLD_PERSONA_HERO_R1113__;
  return host;
}

function seed(map, slots, active = 1) {
  map.set('storyworld.r1046.ego', JSON.stringify({on: true}));
  map.set('storyworld.r1113.personaHero', JSON.stringify({on: true}));
  for (const [n, raw] of Object.entries(slots)) map.set(slotKey(n), JSON.stringify(raw));
  map.set(PREFIX + 'active', String(active));
}
const hp = (map, n) => JSON.parse(map.get(slotKey(n))).player.hp;
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({name, passed: true}); console.log('PASS', name); }
  catch (e) { results.push({name, passed: false, error: e.message}); console.log('FAIL', name, '\n  ', e.message.split('\n').slice(0, 6).join('\n   ')); }
}

function failingLoadCase(label, mode, target) {
  return test(`복원 실패(${label}) — HP·위치·형상·활성 슬롯·원본 저장 유지`, async () => {
    const map = new Map();
    seed(map, {
      1: envelope({hp: 99, x: 5, y: 6, ego: true, savedAt: '2026-11-20T00:00:01.000Z'}),
      2: envelope({hp: 20, x: 9, y: 9, savedAt: '2026-11-20T00:00:02.000Z'}),
      3: envelope({zone: 'dist02', hp: 30, x: 4, y: 4, savedAt: '2026-11-20T00:00:03.000Z'})
    });
    const tab = makeTab(map, 'A');
    assert.equal(await tab.loadLocal(), true, '처음 슬롯 1 불러오기');
    assert.equal(tab.player.hp, 99);
    assert.equal(tab.ego.formActive(), true, '슬롯 1 은 EGO 형상');
    const before = new Map(map);
    tab.failMode = mode;
    const r = await tab.slots.confirm('load', target);
    tab.failMode = null;
    const s = tab.slots.inspect();
    assert.equal(r, false, '실패한 불러오기는 false 를 돌려줘야 함');
    assert.equal(s.active, 1, '활성 슬롯이 1 로 남아야 함 (지금 ' + s.active + ')');
    assert.equal(map.get(PREFIX + 'active'), '1', '저장된 활성 슬롯 포인터 유지');
    assert.equal(tab.player.hp, 99, 'HP 99 유지 (지금 ' + tab.player.hp + ')');
    assert.deepEqual([tab.player.x, tab.player.y], [5, 6], '위치 유지');
    assert.equal(tab.zone, 'dist01', '지역 유지');
    assert.equal(tab.ego.formActive(), true, 'EGO 형상 유지');
    assert.ok(!s.audit.some(a => a.kind === 'load' && a.slot === target), '불러오기 완료 기록이 없어야 함');
    assert.ok(!/불러오기 완료/.test(s.message), '메시지가 완료가 아니어야 함: ' + s.message);
    for (const n of [1, 2, 3]) assert.equal(map.get(slotKey(n)), before.get(slotKey(n)), `슬롯 ${n} 원본 저장 유지`);
    // 앱을 완전히 닫았다 다시 연 것처럼 새 탭으로 열면 마지막 정상 진행(슬롯 1)이 복구된다.
    const reopened = makeTab(map, 'A2');
    assert.equal(await reopened.loadLocal(), true);
    assert.equal(reopened.slots.inspect().active, 1);
    assert.equal(reopened.player.hp, 99);
    assert.equal(reopened.ego.formActive(), true);
  });
}

(async () => {
  await failingLoadCase('같은 지역 · 명시적 false', 'false', 2);
  await failingLoadCase('같은 지역 · 예외', 'throw', 2);
  await failingLoadCase('다른 지역 · 명시적 false', 'false', 3);
  await failingLoadCase('다른 지역 · 예외', 'throw', 3);
  await failingLoadCase('같은 지역 · 상태를 바꾼 뒤 false', 'change-then-false', 2);
  await failingLoadCase('다른 지역 · 상태를 바꾼 뒤 예외', 'change-then-throw', 3);

  await test('정상 복원(undefined 반환) 호환 — 활성 슬롯·HP·형상 갱신', async () => {
    const map = new Map();
    seed(map, {
      1: envelope({hp: 99, x: 5, y: 6, ego: true, savedAt: '2026-11-20T00:00:01.000Z'}),
      2: envelope({hp: 20, x: 9, y: 9, savedAt: '2026-11-20T00:00:02.000Z'})
    });
    const tab = makeTab(map, 'A');
    assert.equal(await tab.loadLocal(), true);
    assert.equal(await tab.slots.confirm('load', 2), true);
    assert.equal(tab.slots.inspect().active, 2);
    assert.equal(map.get(PREFIX + 'active'), '2');
    assert.equal(tab.player.hp, 20);
    assert.equal(tab.ego.formActive(), false, '슬롯 2 는 형상 꺼짐');
  });

  await test('슬롯 밖 직접 복원이 false 면 EGO·페르소나 형상을 건드리지 않음', async () => {
    const map = new Map();
    seed(map, {1: envelope({hp: 99, x: 5, y: 6, ego: true, savedAt: '2026-11-20T00:00:01.000Z'}),
      2: envelope({hero: 'lauren', hp: 50, x: 5, y: 6, persona: true, savedAt: '2026-11-20T00:00:02.000Z'})});
    const tab = makeTab(map, 'A');
    assert.equal(await tab.loadLocal(), true);
    tab.failMode = 'false';
    assert.equal(await tab.restoreSave(envelope({hp: 20, x: 1, y: 1, ego: false})), false);
    assert.equal(tab.ego.formActive(), true, 'EGO 형상 유지');
    tab.failMode = null;
    assert.equal(await tab.slots.confirm('load', 2), true);
    assert.equal(tab.persona.formActive(), true, '페르소나 형상 켜짐');
    tab.failMode = 'false';
    assert.equal(await tab.restoreSave(envelope({hero: 'lauren', hp: 20, x: 1, y: 1, persona: false})), false);
    assert.equal(tab.persona.formActive(), true, '페르소나 형상 유지');
    // 정상 복원(undefined)은 그대로 형상을 저장값으로 맞춘다(회귀 방지).
    assert.equal(await tab.restoreSave(envelope({hero: 'lauren', hp: 20, x: 1, y: 1, persona: false})), undefined);
    assert.equal(tab.persona.formActive(), false, '정상 복원은 형상 갱신');
  });

  await test('두 탭 — 오래된 탭은 최신 진행을 덮어쓰지 않고 충돌 사본으로 보존', async () => {
    const map = new Map();
    seed(map, {1: envelope({hp: 50, x: 5, y: 6, savedAt: '2026-11-20T00:00:01.000Z'})});
    const A = makeTab(map, 'A'), B = makeTab(map, 'B');
    assert.equal(await A.loadLocal(), true);
    assert.equal(await B.loadLocal(), true);
    A.player.hp = 88;
    assert.equal(A.saveGame(false), true, 'A 저장');
    assert.equal(hp(map, 1), 88);
    B.player.hp = 11;
    assert.equal(B.saveGame(false), false, '오래된 탭 B 의 저장은 슬롯을 덮지 않아야 함');
    assert.equal(hp(map, 1), 88, '슬롯 1 은 A 의 HP 88 유지 (지금 ' + hp(map, 1) + ')');
    assert.ok(map.has(conflictKey(1)), '충돌 사본 키가 있어야 함');
    assert.equal(JSON.parse(map.get(conflictKey(1))).player.hp, 11, 'B 의 진행(HP 11)은 충돌 사본으로 보존');
    assert.ok(B.toasts.some(t => /다른 창/.test(t)), 'B 에 충돌 안내가 떠야 함');
    // 새 탭이 슬롯을 계속 쓰는 것은 막지 않는다.
    A.player.hp = 77;
    assert.equal(A.saveGame(false), true, 'A 는 계속 저장 가능');
    assert.equal(hp(map, 1), 77);
    // 오래된 탭이 슬롯을 다시 불러오면 그 뒤로는 정상 저장.
    assert.equal(await B.slots.confirm('load', 1), true);
    assert.equal(B.player.hp, 77);
    B.player.hp = 12;
    assert.equal(B.saveGame(false), true, '다시 불러온 B 는 저장 가능');
    assert.equal(hp(map, 1), 12);
    // 이제 A 가 오래된 쪽.
    A.player.hp = 70;
    assert.equal(A.saveGame(false), false);
    assert.equal(hp(map, 1), 12);
    assert.equal(JSON.parse(map.get(conflictKey(1))).player.hp, 70);
  });

  await test('충돌 사본 적용 — 슬롯과 사본을 맞바꿔 두 진행을 모두 보존하고 불러옴', async () => {
    const map = new Map();
    seed(map, {1: envelope({hp: 50, x: 5, y: 6, savedAt: '2026-11-20T00:00:01.000Z'})});
    const A = makeTab(map, 'A'), B = makeTab(map, 'B');
    await A.loadLocal(); await B.loadLocal();
    A.player.hp = 88; assert.equal(A.saveGame(false), true);
    B.player.hp = 11; assert.equal(B.saveGame(false), false);
    const G = B.__STORYWORLD_SAVE_GUARD_R1248__;
    assert.ok(G, '가드 API');
    assert.deepEqual([...G.conflicts()], [1]);
    assert.equal(await G.adoptConflict(1), true);
    assert.equal(hp(map, 1), 11, '슬롯 1 = B 진행');
    assert.equal(JSON.parse(map.get(conflictKey(1))).player.hp, 88, 'A 진행은 사본으로 보존');
    assert.equal(B.player.hp, 11, 'B 는 사본을 불러온 상태');
    B.player.hp = 13; assert.equal(B.saveGame(false), true);
  });

  await test('한 탭만 쓸 때는 저장·불러오기·새 슬롯 첫 저장이 그대로', async () => {
    const map = new Map();
    seed(map, {1: envelope({hp: 50, x: 5, y: 6, savedAt: '2026-11-20T00:00:01.000Z'})});
    const A = makeTab(map, 'A');
    await A.loadLocal();
    for (const v of [40, 30, 20]) { A.player.hp = v; assert.equal(A.saveGame(false), true); assert.equal(hp(map, 1), v); }
    assert.ok(!map.has(conflictKey(1)), '충돌 사본이 생기지 않음');
    assert.ok(!A.toasts.some(t => /다른 창/.test(t)));
  });

  const passed = results.filter(r => r.passed).length;
  console.log(`\nR1248 save guard: ${passed}/${results.length} passed`);
  if (passed !== results.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
