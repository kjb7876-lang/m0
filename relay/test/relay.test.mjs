import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createRelay, PROTOCOL } from '../server.mjs';

class Client {
  constructor(ws) {
    this.ws = ws; this.queue = []; this.waiters = [];
    ws.on('message', bytes => {
      const m = JSON.parse(bytes.toString());
      const i = this.waiters.findIndex(w => w.match(m));
      if (i >= 0) { const [w] = this.waiters.splice(i, 1); clearTimeout(w.timer); w.resolve(m); }
      else this.queue.push(m);
    });
    ws.on('error', () => {});
  }
  static async open(url, options) { const c = new Client(new WebSocket(url, options)); await once(c.ws, 'open'); return c; }
  send(type, fields = {}) { this.ws.send(JSON.stringify({ type, ...fields })); }
  get(type, predicate = () => true, timeout = 6000) {
    const match = m => m.type === type && predicate(m);
    const i = this.queue.findIndex(match);
    if (i >= 0) return Promise.resolve(this.queue.splice(i, 1)[0]);
    return new Promise((resolve, reject) => {
      const w = { match, resolve, timer: null };
      w.timer = setTimeout(() => { this.waiters.splice(this.waiters.indexOf(w), 1); reject(new Error(`Timed out waiting for ${type}; queued message types ${this.queue.map(m=>m.type).join(',')}`)); }, timeout);
      this.waiters.push(w);
    });
  }
  clear(type) { this.queue = this.queue.filter(m => m.type !== type); }
  async close() { if (this.ws.readyState === WebSocket.CLOSED) return; const done = once(this.ws, 'close'); this.ws.close(); await done; }
}
async function fixture(t, options = {}) {
  const relay = createRelay({ ...options, limits: { heartbeatMs: 1000, loadMs: 5000, ...options.limits } });
  const address = await relay.listen();
  const clients = []; const url = `ws://127.0.0.1:${address.port}/ws`;
  t.after(async () => { await relay.close(); for (const c of clients) { c.ws.terminate(); for (const w of c.waiters) clearTimeout(w.timer); } });
  async function open(opts) { const c = await Client.open(url, opts); clients.push(c); return c; }
  async function create() { const c = await open(); c.send('create', { ...PROTOCOL, nick: '방장', character: 'hwando' }); const welcome = await c.get('welcome'); c.welcome = welcome; return c; }
  async function join(host, nick = '친구') { const c = await open(); c.send('join', { ...PROTOCOL, code: host.welcome.code, nick, character: 'seoha' }); c.welcome = await c.get('welcome'); return c; }
  async function start(host, guests, regionId = 'ep1a09') {
    for (const g of guests) g.send('profile', { ready: true });
    await host.get('lobby', m => m.players.length === guests.length + 1 && m.players.every(p => p.ready));
    host.send('start', { regionId });
    for (const c of [host, ...guests]) { const tr = await c.get('transition'); assert.equal(tr.epoch, 1); c.send('loaded', { epoch: 1 }); }
    for (const c of [host, ...guests]) await c.get('all_loaded');
  }
  return { relay, address, url, open, create, join, start };
}
const sampleState = (epoch, seq = 1) => ({ version: 1, epoch, seq, zone: 'ep1a09', layer: 'STORY', time: 1,
  players: [{ id: 'hero', x: 15, y: 15, hp: 100 }], enemies: [{ id: 'boss', hp: 6000 }], shots: [], hazards: [], effects: [], room: { cleared: false }, progress: { STORY: {}, DREAM: {} } });

test('2 to 4 players, readiness, distinct input identity, shared snapshots and single event relay', async t => {
  const f = await fixture(t), host = await f.create(), g1 = await f.join(host);
  host.send('start', { regionId: 'ep1a09' }); assert.equal((await host.get('error')).code, 'NOT_READY');
  const g2 = await f.join(host, '둘째'), g3 = await f.join(host, '셋째');
  const roster = await host.get('lobby', m => m.players.length === 4); assert.equal(new Set(roster.players.map(p => p.id)).size, 4);
  await f.start(host, [g1, g2, g3]);
  for (const [i, c] of [g1, g2, g3].entries()) c.send('input', { epoch: 1, seq: 1, input: { moveX: i / 3, moveY: 0, attack: true } });
  const inputs = await Promise.all([1,2,3].map(() => host.get('input')));
  assert.deepEqual(new Set(inputs.map(m => m.playerId)), new Set([g1,g2,g3].map(c => c.welcome.selfId)));
  host.send('snapshot', { epoch: 1, seq: 1, state: sampleState(1) });
  for (const c of [g1,g2,g3]) assert.equal((await c.get('snapshot')).state.enemies[0].hp, 6000);
  host.send('event', { epoch: 1, seq: 1, event: { id: 'defeat:boss:1', kind: 'death', entityId: 'boss' } });
  for (const c of [g1,g2,g3]) assert.equal((await c.get('event')).event.id, 'defeat:boss:1');
  host.send('event', { epoch: 1, seq: 1, event: { id: 'defeat:boss:1', kind: 'death' } });
  assert.equal((await host.get('error')).code, 'EVENT_INVALID');
  assert.equal(g1.queue.filter(m => m.type === 'event').length, 0);
});

test('fifth player refused; game, protocol and build isolation', async t => {
  const f = await fixture(t), host = await f.create();
  await f.join(host); await f.join(host); await f.join(host);
  const fifth = await f.open(); fifth.send('join', { ...PROTOCOL, code: host.welcome.code, nick: '다섯', character: 'neon' });
  assert.equal((await fifth.get('error')).code, 'ROOM_FULL');
  for (const mismatch of [{ gameId: 'hapil' }, { build: 'R61' }, { protocol: 2 }]) {
    const c = await f.open(); c.send('join', { ...PROTOCOL, ...mismatch, code: host.welcome.code, nick: '다른게임', character: 'neon' });
    assert.equal((await c.get('error')).code, 'VERSION_MISMATCH');
  }
});

test('guest cannot author snapshots/events/transitions/start/pause; input names cannot impersonate', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host);
  for (const type of ['snapshot','event','transition','start','pause']) { guest.send(type, { epoch: 1, seq: 1, state: sampleState(1), regionId: 'ep1a09', paused: true, reason: 'manual', event: {} }); assert.equal((await guest.get('error')).code, 'HOST_ONLY'); }
  await f.start(host, [guest]);
  guest.send('input', { epoch: 1, seq: 1, playerId: host.welcome.selfId, input: { attack: true } });
  assert.equal((await host.get('input')).playerId, guest.welcome.selfId);
  guest.send('input', { epoch: 1, seq: 1, input: { attack: true } }); assert.equal((await guest.get('error')).code, 'STALE_SEQUENCE');
  guest.send('input', { epoch: 0, seq: 2, input: { attack: true } }); assert.equal((await guest.get('error')).code, 'STALE_EPOCH');
});

test('all-region transition barriers prevent combat input until everyone loaded', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host);
  await f.start(host, [guest]);
  const regions = ['ep1a10','dist06','memory_hall','final_region'];
  let epoch = 1, seq = 0;
  for (const regionId of regions) {
    host.send('transition', { epoch: ++epoch, regionId });
    assert.equal((await guest.get('transition')).regionId, regionId); await host.get('transition');
    host.send('loaded', { epoch });
    guest.send('input', { epoch, seq: ++seq, input: { moveX: 1 } }); assert.equal((await guest.get('error')).code, 'SESSION_PAUSED');
    guest.send('loaded', { epoch }); await guest.get('all_loaded'); await host.get('all_loaded');
    guest.send('input', { epoch, seq, input: { moveX: 1 } }); assert.equal((await host.get('input')).epoch, epoch);
  }
});

test('late join receives newest state, pauses all, and resync forwards to host', async t => {
  const f = await fixture(t), host = await f.create(), g1 = await f.join(host);
  await f.start(host, [g1]); host.send('snapshot', { epoch: 1, seq: 7, state: sampleState(1,7) }); await g1.get('snapshot');
  const late = await f.join(host, '늦은참가');
  assert.equal((await late.get('snapshot')).seq, 7);
  for (const c of [host,g1,late]) { assert.equal((await c.get('transition')).reason, 'late_join'); c.send('loaded', { epoch: 1 }); }
  for (const c of [host,g1,late]) await c.get('all_loaded');
  await host.get('resync', m => m.playerId === late.welcome.selfId);
  late.send('resync', { epoch: 1, lastSeq: 3 });
  assert.equal((await late.get('snapshot')).seq, 7); assert.equal((await host.get('resync')).lastSeq, 3);
});

test('guest reconnect keeps identity, rotates token, reserves slot, denies token replay', async t => {
  const f = await fixture(t, { limits: { graceMs: 2000 } }), host = await f.create(), guest = await f.join(host);
  await f.start(host, [guest]);
  const previous = guest.welcome;
  guest.send('input', { epoch: 1, seq: 9, input: { attack: true } }); await host.get('input');
  await guest.close(); await host.get('peer_disconnected');
  const resumed = await f.open(); resumed.send('reconnect', { ...PROTOCOL, code: previous.code, playerId: previous.selfId, token: previous.resumeToken });
  const next = await resumed.get('welcome'); assert.equal(next.selfId, previous.selfId); assert.notEqual(next.resumeToken, previous.resumeToken);
  for (const c of [host,resumed]) { assert.equal((await c.get('transition')).reason, 'reconnect'); c.send('loaded', { epoch: 1 }); }
  await host.get('all_loaded'); await resumed.get('all_loaded');
  resumed.send('input', { epoch: 1, seq: 9, input: { attack: true } }); assert.equal((await resumed.get('error')).code, 'STALE_SEQUENCE');
  resumed.send('input', { epoch: 1, seq: 10, input: { attack: true } }); assert.equal((await host.get('input')).seq, 10);
  const replay = await f.open(); replay.send('reconnect', { ...PROTOCOL, code: previous.code, playerId: previous.selfId, token: previous.resumeToken });
  assert.equal((await replay.get('error')).code, 'RECONNECT_DENIED');
  const other1 = await f.join(host), other2 = await f.join(host); await resumed.close(); await host.get('peer_disconnected');
  const fifth = await f.open(); fifth.send('join', { ...PROTOCOL, code: previous.code, nick: '예약좌석', character: 'neon' });
  assert.equal((await fifth.get('error')).code, 'ROOM_FULL'); assert.ok(other1 && other2);
});

test('expired reconnect seat removed; explicit leave removes immediately', async t => {
  const f = await fixture(t, { limits: { graceMs: 80 } }), host = await f.create(), guest = await f.join(host);
  const previous = guest.welcome; await guest.close(); assert.equal((await host.get('peer_left')).reason, 'reconnect_expired');
  const resumed = await f.open(); resumed.send('reconnect', { ...PROTOCOL, code: previous.code, playerId: previous.selfId, token: previous.resumeToken });
  assert.equal((await resumed.get('error')).code, 'RECONNECT_DENIED');
  const next = await f.join(host); next.send('leave'); assert.equal((await host.get('peer_left')).reason, 'left');
  assert.equal(f.relay.inspect().players, 1);
});

test('host disconnect ends room and denies host migration and stale room join', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host), old = host.welcome;
  await host.close(); assert.equal((await guest.get('room_closed')).reason, 'host_left');
  assert.equal(f.relay.inspect().rooms, 0);
  const c = await f.open(); c.send('join', { ...PROTOCOL, code: old.code, nick: '친구', character: 'hwando' }); assert.equal((await c.get('error')).code, 'ROOM_NOT_FOUND');
});

test('background pause blocks inputs/events and resumes without changing epoch', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host); await f.start(host, [guest]);
  host.send('pause', { paused: true, reason: 'background' }); assert.equal((await guest.get('paused')).paused, true);
  guest.send('input', { epoch: 1, seq: 1, input: { attack: true } }); assert.equal((await guest.get('error')).code, 'SESSION_PAUSED');
  host.send('pause', { paused: false, reason: 'background' }); assert.equal((await guest.get('paused')).epoch, 1);
  guest.send('input', { epoch: 1, seq: 1, input: { attack: true } }); assert.equal((await host.get('input')).seq, 1);
});

test('malformed, binary, prototype keys, oversized and deeply nested messages are refused', async t => {
  const f = await fixture(t);
  for (const [payload, code, binary] of [['{broken', 'JSON_INVALID'], ['{"type":"create","__proto__":{}}', 'SHAPE_INVALID'], [JSON.stringify({ type: 'create', a: Array.from({length: 5000}, () => 1) }), 'SHAPE_INVALID'], ['hello', 'TEXT_REQUIRED', true]]) {
    const c = await f.open(); c.ws.send(payload, { binary: !!binary }); assert.equal((await c.get('error')).code, code);
  }
  const huge = await f.open(); const closed = once(huge.ws, 'close'); huge.ws.send('x'.repeat(524289)); const [status] = await closed; assert.equal(status, 1009);
  const nested = await f.open(); let value = {}; for(let i=0;i<20;i++) value={value}; nested.send('create', { ...PROTOCOL, nick: '친구', character: 'hwando', value }); assert.equal((await nested.get('error')).code, 'SHAPE_INVALID');
});

test('input and state finite bounds plus entity caps', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host); await f.start(host, [guest]);
  for (const input of [{ moveX: 2 }, { attack: 1 }, { route: { x: -1, y: 2 } }, { damage: 999 }, { target: 'x'.repeat(129) }]) {
    guest.send('input', { epoch: 1, seq: 1, input }); assert.equal((await guest.get('error')).code, 'INPUT_INVALID');
  }
  for (const state of [{...sampleState(1),enemies:Array.from({length:129},()=>({id:'x'}))}, {...sampleState(1),epoch:0}, {...sampleState(1),version:2}]) {
    host.send('snapshot', { epoch: 1, seq: 1, state }); assert.equal((await host.get('error')).code, 'STATE_INVALID');
  }
  host.send('snapshot', { epoch: 1, seq: 10, state: sampleState(1) }); await guest.get('snapshot');
  host.send('snapshot', { epoch: 1, seq: 9, state: sampleState(1) }); assert.equal((await host.get('error')).code, 'STALE_SEQUENCE');
});

test('production enforces exact HTTPS origin and secure proxy transport; health omits rooms/tokens', async t => {
  assert.throws(() => createRelay({ production: true, allowedOrigins: [] }), /ALLOWED_ORIGINS/);
  const f = await fixture(t, { production: true, trustProxy: true, allowedOrigins: ['https://example.github.io'] });
  async function reject(options, expected) {
    const ws = new WebSocket(f.url, options); ws.on('error', () => {});
    const [error] = await once(ws, 'error'); assert.match(error.message, new RegExp(String(expected)));
  }
  await reject({ origin: 'https://evil.example', headers: { 'X-Forwarded-Proto': 'https' } }, 403);
  await reject({ origin: 'https://example.github.io' }, 426);
  const c = await f.open({ origin: 'https://example.github.io', headers: { 'X-Forwarded-Proto': 'https' } });
  c.send('create', { ...PROTOCOL, nick: '방장', character: 'hwando' }); const welcome = await c.get('welcome'); assert.equal(welcome.resumeToken, null);
  const response = await fetch(`http://127.0.0.1:${f.address.port}/health`); assert.deepEqual(await response.json(), { ok:true,...PROTOCOL });
  const notFound = await fetch(`http://127.0.0.1:${f.address.port}/rooms`); assert.equal(notFound.status,404);
});

test('entry attempts and message flood are rate limited without crashing server', async t => {
  const f = await fixture(t);
  const flood = await f.open(); for (let i=0; i<175; i++) flood.send('profile');
  // Missing handshake closes on the first packet; other sockets remain functional.
  assert.equal((await flood.get('error')).code, 'HANDSHAKE_REQUIRED');
  const host = await f.create();
  for(let i=0;i<170;i++) host.send('profile', { ready: true });
  assert.equal((await host.get('error', m => m.code === 'MESSAGE_RATE')).code, 'MESSAGE_RATE');
  assert.equal((await f.create()).welcome.build, PROTOCOL.build);
});

test('host loading timeout closes room; shutdown explicitly terminates current room', async t => {
  const f = await fixture(t, { limits: { heartbeatMs: 20, loadMs: 60 } });
  const host = await f.create(), guest = await f.join(host);
  guest.send('profile', { ready:true }); await host.get('lobby', m => m.players.every(p => p.ready));
  host.send('start', { regionId:'ep1a09' }); await guest.get('transition'); guest.send('loaded', {epoch:1});
  assert.equal((await guest.get('room_closed')).reason, 'host_load_timeout');
  const h2 = await f.create(), g2 = await f.join(h2); const closed = g2.get('room_closed'); await f.relay.close();
  assert.equal((await closed).reason, 'server_shutdown');
});

test('DREAM and STORY layer survive transition, late join and loading barrier', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host);
  await f.start(host, [guest]);
  host.send('transition', { epoch:2, regionId:'ep1a09', layer:'DREAM' });
  for(const c of [host,guest]) { assert.equal((await c.get('transition')).layer,'DREAM'); c.send('loaded',{epoch:2}); }
  for(const c of [host,guest]) assert.equal((await c.get('all_loaded')).layer,'DREAM');
  const late = await f.join(host);
  assert.equal(late.welcome.layer,'DREAM');
  for(const c of [host,guest,late]) { assert.equal((await c.get('transition')).layer,'DREAM'); c.send('loaded',{epoch:2}); }
  for(const c of [host,guest,late]) await c.get('all_loaded');
  host.send('transition',{epoch:3,regionId:'ep1a09',layer:'invalid'}); assert.equal((await host.get('error')).code,'LAYER_INVALID');
  host.send('transition',{epoch:3,regionId:'ep1a09',layer:'STORY'}); assert.equal((await late.get('transition')).layer,'STORY');
});

test('passive commands use server player identity, explicit operation, epoch and duplicate guard', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host);
  await f.start(host,[guest]);
  const command={kind:'upgrade',passiveId:'tempo'};
  guest.send('command',{epoch:1,seq:1,playerId:host.welcome.selfId,command});
  const forwarded=await host.get('command'); assert.equal(forwarded.playerId,guest.welcome.selfId); assert.deepEqual(forwarded.command,command);
  guest.send('command',{epoch:1,seq:1,command}); assert.equal((await guest.get('error')).code,'STALE_SEQUENCE');
  guest.send('command',{epoch:0,seq:2,command}); assert.equal((await guest.get('error')).code,'STALE_EPOCH');
  for(const invalid of [{kind:'hp',passiveId:'tempo'},{kind:'upgrade',passiveId:'tempo',hp:1000},{kind:'upgrade',passiveId:'../tempo'}]) {
    guest.send('command',{epoch:1,seq:2,command:invalid}); assert.equal((await guest.get('error')).code,'COMMAND_INVALID');
  }
  host.send('pause',{paused:true,reason:'manual'}); await guest.get('paused');
  guest.send('command',{epoch:1,seq:2,command}); assert.equal((await host.get('command')).seq,2);
});

test('authored skill slots w/e/r reach host once and malformed slots are refused', async t => {
  const f = await fixture(t), host = await f.create(), guest = await f.join(host);
  await f.start(host,[guest]);
  let seq=0;
  for(const skillSlot of ['w','e','r']) {
    guest.send('input',{epoch:1,seq:++seq,input:{skillSlot}});
    const forwarded=await host.get('input'); assert.equal(forwarded.input.skillSlot,skillSlot); assert.equal(forwarded.playerId,guest.welcome.selfId);
  }
  for(const skillSlot of ['q','W','',null,1,{},['w']]) {
    guest.send('input',{epoch:1,seq:seq+1,input:{skillSlot}}); assert.equal((await guest.get('error')).code,'INPUT_INVALID');
  }
  guest.send('input',{epoch:1,seq, input:{skillSlot:'r'}}); assert.equal((await guest.get('error')).code,'STALE_SEQUENCE');
});

test('automatic basic and skill flags are strict booleans and forwarded with sequence authority', async t => {
 const f=await fixture(t),host=await f.create(),guest=await f.join(host);await f.start(host,[guest]);let seq=0;
 for(const key of ['autoBasic','autoSkill','threadDance','goldenCast','goldenSecond']){
  for(const value of [true,false]){guest.send('input',{epoch:1,seq:++seq,input:{[key]:value}});const got=await host.get('input');assert.equal(got.input[key],value);assert.equal(got.playerId,guest.welcome.selfId);}
  for(const value of ['true',1,null]){guest.send('input',{epoch:1,seq:seq+1,input:{[key]:value}});assert.equal((await guest.get('error')).code,'INPUT_INVALID');}
 }
 guest.send('input',{epoch:1,seq,input:{autoSkill:true}});assert.equal((await guest.get('error')).code,'STALE_SEQUENCE');
});

test('golden design commands preserve actor authority and reject arbitrary state writes',async t=>{
 const f=await fixture(t),host=await f.create(),guest=await f.join(host);await f.start(host,[guest]);
 const action={op:'save',id:null,name:'황금선',strokes:[[{x:-1,y:0},{x:1,y:0}]]};
 guest.send('command',{epoch:1,seq:1,command:{kind:'golden',action}});const forwarded=await host.get('command');assert.equal(forwarded.playerId,guest.welcome.selfId);assert.deepEqual(forwarded.command.action,action);
 for(const bad of [{...action,hp:100},{op:'upgrade',key:'points'},{...action,strokes:[Array.from({length:193},()=>({x:0,y:0}))]},{...action,strokes:[[{x:0,y:0},{x:2,y:0}]]},{op:'learn',points:0},{op:'__proto__'},{op:'constructor'},{op:{toString:null}}]){guest.send('command',{epoch:1,seq:2,command:{kind:'golden',action:bad}});assert.equal((await guest.get('error')).code,'COMMAND_INVALID');}
 guest.send('command',{epoch:1,seq:1,command:{kind:'golden',action:{op:'learn'}}});assert.equal((await guest.get('error')).code,'STALE_SEQUENCE');
 guest.send('input',{epoch:1,seq:1,input:{goldenCast:true,goldenAim:{x:15.5,y:19}}});const aim=await host.get('input');assert.deepEqual(aim.input.goldenAim,{x:15.5,y:19});assert.equal(aim.playerId,guest.welcome.selfId);
 for(const goldenAim of [{x:Infinity,y:0},{x:101,y:0},{x:0,y:0,damage:100},{x:'15',y:0}]){guest.send('input',{epoch:1,seq:2,input:{goldenCast:true,goldenAim}});assert.equal((await guest.get('error')).code,'INPUT_INVALID');}
});
