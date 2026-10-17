import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const URL = 'http://127.0.0.1:4375/';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];
async function openGame({ enterFirstRegion = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 850 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.locator('#campaignNew54').click();
  await page.waitForFunction(() => window.eval('started&&!loading'), null, { timeout: 30_000 });
  if (enterFirstRegion) {
    await page.evaluate(() => window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
    await page.waitForFunction(() => window.eval("zone==='dist00'&&!loading&&!modal"), null, { timeout: 30_000 });
  }
  return page;
}

try {
  const hostPage = await openGame();
  const roster = [
    { id: 'qa-host', nick: 'Host', character: 'hwando', isHost: true },
    { id: 'qa-guest', nick: 'Guest', character: 'seoha' },
  ];
  const hostStart = await hostPage.evaluate(async members => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    await sim.start({ role: 'host', selfId: 'qa-host', hostId: 'qa-host', room: 'QA-R64', hero: 'hwando', members });
    const actors = sim.players(), owner = sim.hostPlayer(), guest = actors.find(p => p.coopIdR62 === 'qa-guest');
    owner.points = 12; guest.points = 20;
    window.__STORYWORLD_PROGRESSION_R62__.state(owner).ranks.threadDanceR63 = 1;
    window.__STORYWORLD_PROGRESSION_R62__.state(guest).ranks.threadDanceR63 = 0;
    const snapshot = sim.snapshot(), save = sim.exportSave();
    return {
      mode: sim.mode(),
      players: actors.map(p => ({ id: p.coopIdR62, points: p.points })),
      replicaCount: room.enemies.filter(e => e.coopReplicaR62).length,
      replicaHp: room.enemies.filter(e => e.coopReplicaR62).slice(0, 2).map(e => ({ maxHp: e.maxHp, factor: e.difficultyFactorR63 })),
      snapshotProtocol: { version: snapshot.version, build: snapshot.build, epoch: snapshot.epoch },
      saveKind: save.kind,
      saveParticipants: save.participants.map(p => ({ id: p.coopIdR62, points: p.points })),
      saveSize: JSON.stringify(save).length,
      rank: window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63', owner),
    };
  }, roster);
  assert.equal(hostStart.mode, 'host');
  assert.ok(hostStart.replicaCount > 0, 'host creates cooperative enemy replicas');
  assert.ok(hostStart.replicaHp.length === 2 && hostStart.replicaHp.every(e => e.factor === 0.25 && [6421.5, 285].includes(e.maxHp)), 'cooperative replicas retain current normal health scaling');
  assert.deepEqual(hostStart.snapshotProtocol, { version: 1, build: 'R62', epoch: 0 });
  assert.equal(hostStart.saveKind, 'storyworld-coop');
  assert.deepEqual(hostStart.saveParticipants.map(p => p.id), ['qa-host', 'qa-guest']);

  const guestPage = await openGame({ enterFirstRegion: false });
  const guestStart = await guestPage.evaluate(async members => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    await sim.start({ role: 'guest', selfId: 'qa-guest', hostId: 'qa-host', room: 'QA-R64', hero: 'seoha', members });
    const transition = await sim.receive({ type: 'transition', epoch: 0, regionId: 'dist00', layer: 'STORY' });
    return { mode: sim.mode(), transition, zone, layer };
  }, roster);
  assert.deepEqual(guestStart, { mode: 'guest', transition: true, zone: 'dist00', layer: 'STORY' });
  const guestView = await guestPage.evaluate(snapshot => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    const accepted = sim.applySnapshot(snapshot);
    return {
      accepted,
      hostId: sim.hostPlayer()?.coopIdR62,
      auraOwners: [...new Set(window.__STORYWORLD_PHASE1__.captureVisual().filter(c => c.owner?.id?.startsWith('thread-dance-aura-r63r2:')).map(c => c.owner.id.slice('thread-dance-aura-r63r2:'.length)))],
      replicaCount: room.enemies.filter(e => e.coopReplicaR62).length,
    };
  }, await hostPage.evaluate(() => window.__STORYWORLD_COOP_SIM_R62__.snapshot()));
  assert.equal(guestView.accepted, true, 'guest accepts the host snapshot');
  assert.equal(guestView.hostId, 'qa-host');
  assert.deepEqual(guestView.auraOwners, ['qa-host'], 'cooperative aura is drawn only for its owning player');
  assert.ok(guestView.replicaCount > 0, 'guest receives scaled cooperative enemy replicas');

  const hostLoad = await hostPage.evaluate(async () => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__, raw = sim.exportSave();
    const ok = await sim.importSave(raw), owner = sim.hostPlayer(), guest = sim.players().find(p => p.coopIdR62 === 'qa-guest');
    return {
      ok,
      mode: sim.mode(),
      hostPoints: owner.points,
      guestPoints: guest.points,
      hostRank: window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63', owner),
      guestRank: window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63', guest),
      replicaHp: room.enemies.filter(e => e.coopReplicaR62).slice(0, 2).map(e => ({ maxHp: e.maxHp, factor: e.difficultyFactorR63 })),
      epoch: sim.inspect().epoch,
      snapshot: sim.snapshot(),
    };
  });
  assert.equal(hostLoad.ok, true, 'host can load its cooperative save');
  assert.equal(hostLoad.mode, 'host');
  assert.equal(hostLoad.hostPoints, 12);
  assert.equal(hostLoad.guestPoints, 20);
  assert.equal(hostLoad.hostRank, 1);
  assert.equal(hostLoad.guestRank, 0);
  assert.ok(hostLoad.replicaHp.every(e => e.factor === 0.25 && [6421.5, 285].includes(e.maxHp)), 'cooperative save load does not reset replica health scaling');
  const guestAfterLoad = await guestPage.evaluate(async ({ epoch, snapshot }) => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    await sim.receive({ type: 'transition', epoch, regionId: 'dist00', layer: 'STORY' });
    return { accepted: sim.applySnapshot(snapshot), epoch: sim.inspect().epoch };
  }, { epoch: hostLoad.epoch, snapshot: hostLoad.snapshot });
  assert.equal(guestAfterLoad.accepted, true, 'guest accepts the post-load snapshot');
  assert.equal(guestAfterLoad.epoch, hostLoad.epoch);

  assert.deepEqual(errors, []);
  const result = {
    environment: 'local two-page client simulation only; no relay/server/network connection',
    hostStart,
    guestView,
    hostLoad: { ...hostLoad, snapshot: undefined },
    guestAfterLoad,
    errors,
  };
  const outDir = path.dirname(fileURLToPath(import.meta.url));
  await fs.writeFile(path.join(outDir, 'coop-regression.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  await hostPage.close();
  await guestPage.close();
} finally {
  await browser.close();
}
