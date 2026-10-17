import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const URL = process.env.STORYWORLD_URL || 'http://127.0.0.1:4375/';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const errors = [];
async function openGame({ enterFirstRegion = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 1365, height: 850 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.locator('#campaignNew54').click();
  await page.waitForFunction(() => window.eval('started&&booted&&!loading'), null, { timeout: 60_000 });
  await page.waitForTimeout(800);
  if (enterFirstRegion) {
    const zone = await page.evaluate(() => window.eval('zone'));
    if (zone !== 'dist00') {
      const entered = await page.evaluate(() => window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
      assert.equal(entered, true, 'dist00 entry failed after boot completed');
    }
    await page.waitForFunction(() => window.eval("zone==='dist00'&&!loading&&!modal"), null, { timeout: 60_000 });
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
    await sim.start({ role: 'host', selfId: 'qa-host', hostId: 'qa-host', room: 'QA-R66', hero: 'hwando', members });
    const actors = sim.players(), owner = sim.hostPlayer(), guest = actors.find(p => p.coopIdR62 === 'qa-guest');
    owner.points = 12; guest.points = 20;
    window.__STORYWORLD_PROGRESSION_R62__.state(owner).ranks.threadDanceR63 = 1;
    window.__STORYWORLD_PROGRESSION_R62__.state(guest).ranks.threadDanceR63 = 0;
    const epoch=room.passivePointEpochR64,dropId=`r64:${epoch}:drop:qa-coop-1`;
    owner.x=6;owner.y=6;guest.x=12;guest.y=12;
    room.passivePointDropsR64.push({id:dropId,source:`r64:${epoch}:kill:qa-coop-enemy`,x:guest.x,y:guest.y,amount:4,kind:'enemy',createdAt:time});
    room.passivePointRevisionR64++;window.__STORYWORLD_CAMPAIGN_R63R1__.syncPointDrops(room);
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
      dropId,hostDropProp:room.props.some(p=>p.pointDropIdR64===dropId),savedDrop:save.coopWorld['STORY:dist00'].pointDrops.drops.find(d=>d.id===dropId),snapshotDrop:snapshot.room.passivePointDropsR64.find(d=>d.id===dropId),
      rank: window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63', owner),
    };
  }, roster);
  assert.equal(hostStart.mode, 'host');
  assert.ok(hostStart.replicaCount > 0, 'host creates cooperative enemy replicas');
  assert.ok(hostStart.replicaHp.length === 2 && hostStart.replicaHp.every(e => e.factor === 0.25 && [6421.5, 285].includes(e.maxHp)), 'cooperative replicas retain current normal health scaling');
  assert.deepEqual(hostStart.snapshotProtocol, { version: 1, build: 'R62', epoch: 0 });
  assert.equal(hostStart.saveKind, 'storyworld-coop');
  assert.deepEqual(hostStart.saveParticipants.map(p => p.id), ['qa-host', 'qa-guest']);
  assert.ok(hostStart.hostDropProp&&hostStart.savedDrop?.amount===4&&hostStart.snapshotDrop?.id===hostStart.dropId,'host creates and persists one shared visible point drop');

  const guestPage = await openGame({ enterFirstRegion: false });
  const guestStart = await guestPage.evaluate(async members => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    await sim.start({ role: 'guest', selfId: 'qa-guest', hostId: 'qa-host', room: 'QA-R66', hero: 'seoha', members });
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
      sharedDrop:room.passivePointDropsR64.some(d=>d.id===`r64:${room.passivePointEpochR64}:drop:qa-coop-1`),dropProp:room.props.some(p=>p.pointDropIdR64===`r64:${room.passivePointEpochR64}:drop:qa-coop-1`),
    };
  }, await hostPage.evaluate(() => window.__STORYWORLD_COOP_SIM_R62__.snapshot()));
  assert.equal(guestView.accepted, true, 'guest accepts the host snapshot');
  assert.equal(guestView.hostId, 'qa-host');
  assert.deepEqual(guestView.auraOwners, ['qa-host'], 'cooperative aura is drawn only for its owning player');
  assert.ok(guestView.replicaCount > 0, 'guest receives scaled cooperative enemy replicas');
  assert.ok(guestView.sharedDrop&&guestView.dropProp,'guest snapshot creates the same rendered point drop');
  const guestAuthority=await guestPage.evaluate(()=>{const c=window.__STORYWORLD_COOP_SIM_R62__,p=window.__STORYWORLD_PROGRESSION_R62__,id=`r64:${room.passivePointEpochR64}:drop:qa-coop-1`,before=c.localPlayer().points;const collected=window.__STORYWORLD_CAMPAIGN_R63R1__.collectPointDrops(),awarded=p.awardPointDrop(4,id,c.localPlayer());return{collected,awarded,points:c.localPlayer().points,before,drops:room.passivePointDropsR64.length};});
  assert.deepEqual(guestAuthority,{collected:0,awarded:false,points:20,before:20,drops:1},'guest cannot collect or award host-owned point drops');

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
      dropAfterLoad:room.passivePointDropsR64.map(d=>({...d})),
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
  assert.equal(hostLoad.dropAfterLoad.length,1,'cooperative save reload preserves its unclaimed drop');
  const pickup=await hostPage.evaluate(async id=>{const sim=window.__STORYWORLD_COOP_SIM_R62__,campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,owner=sim.hostPlayer(),guest=sim.players().find(p=>p.coopIdR62==='qa-guest'),drop=room.passivePointDropsR64.find(d=>d.id===id);owner.x=drop.x+4;owner.y=drop.y+4;guest.x=drop.x;guest.y=drop.y;const before=guest.points,first=campaign.collectPointDrops(),after=guest.points,second=campaign.collectPointDrops(),saved=sim.exportSave();return{first,second,before,after,remaining:room.passivePointDropsR64.length,claim:room.passivePointClaimsR64.includes(id),ownerClaims:window.__STORYWORLD_PROGRESSION_R62__.state(owner).pointDropClaimsR64[id]===true,guestClaims:window.__STORYWORLD_PROGRESSION_R62__.state(guest).pointDropClaimsR64[id]===true,savedDrops:saved.coopWorld['STORY:dist00'].pointDrops.drops.length,savedClaims:saved.coopWorld['STORY:dist00'].pointDrops.claims.includes(id),snapshot:sim.snapshot()};},hostStart.dropId);
  assert.deepEqual({first:pickup.first,second:pickup.second,before:pickup.before,after:pickup.after,remaining:pickup.remaining,claim:pickup.claim,ownerClaims:pickup.ownerClaims,guestClaims:pickup.guestClaims,savedDrops:pickup.savedDrops,savedClaims:pickup.savedClaims},{first:1,second:0,before:20,after:24,remaining:0,claim:true,ownerClaims:false,guestClaims:true,savedDrops:0,savedClaims:true},'nearest host-authoritative pickup awards the guest once and persists one claim');
  const reloadAfterPickup=await hostPage.evaluate(async()=>{const sim=window.__STORYWORLD_COOP_SIM_R62__,raw=sim.exportSave();await sim.importSave(raw);return{owner:sim.hostPlayer().points,guest:sim.players().find(p=>p.coopIdR62==='qa-guest').points,drops:room.passivePointDropsR64.length,claims:room.passivePointClaimsR64.length,snapshot:sim.snapshot()};});
  assert.deepEqual({owner:reloadAfterPickup.owner,guest:reloadAfterPickup.guest,drops:reloadAfterPickup.drops},{owner:12,guest:24,drops:0},'reloading after pickup cannot duplicate a cooperative reward');
  const guestAfterLoad = await guestPage.evaluate(async ({ epoch, snapshot }) => {
    const sim = window.__STORYWORLD_COOP_SIM_R62__;
    await sim.receive({ type: 'transition', epoch, regionId: 'dist00', layer: 'STORY' });
    return { accepted: sim.applySnapshot(snapshot), epoch: sim.inspect().epoch };
  }, { epoch: reloadAfterPickup.snapshot.epoch, snapshot: reloadAfterPickup.snapshot });
  assert.equal(guestAfterLoad.accepted, true, 'guest accepts the post-load snapshot');
  assert.equal(guestAfterLoad.epoch, reloadAfterPickup.snapshot.epoch);

  assert.deepEqual(errors, []);
  const result = {
    environment: 'local two-page client simulation only; no relay/server/network connection',
    hostStart,
    guestView,
    hostLoad: { ...hostLoad, snapshot: undefined },
    guestAuthority,pickup,reloadAfterPickup:{...reloadAfterPickup,snapshot:undefined},
    guestAfterLoad,
    errors,
  };
  const outDir = path.resolve('qa-r66');
  await fs.writeFile(path.join(outDir, 'coop-regression.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  await hostPage.close();
  await guestPage.close();
} finally {
  await browser.close();
}
