import http from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

export const PROTOCOL = Object.freeze({ gameId: 'storyworld', build: 'R73R1', protocol: 1 });
export const WORLD_COORD_LIMIT_R73 = 128;
export const CHARACTERS = Object.freeze(['hwando', 'seoha', 'neon', 'michaela', 'lauren', 'hunter', 'slayer', 'gunner']);
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LIMITS = Object.freeze({ players: 4, rooms: 32, connections: 160, payload: 524288, buffer: 2097152,
  graceMs: 45000, handshakeMs: 8000, heartbeatMs: 25000, loadMs: 90000 });
const now = () => Date.now();
const record = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(v) && v >= min && v <= max;
const string = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
const validMazeR73 = v => v === undefined || record(v) && Object.keys(v).length === 2 &&
  Object.hasOwn(v, 'version') && Object.hasOwn(v, 'seed') && v.version === 1 && integer(v.seed, 0, 0xffffffff);
const hash = (v) => createHash('sha256').update(v).digest();
const token = () => randomBytes(32).toString('base64url');
function safeJSON(value, maxNodes = 50000, maxDepth = 16) {
  let count = 0;
  function walk(v, depth) {
    if (++count > maxNodes || depth > maxDepth) return false;
    if (v === null || typeof v === 'boolean') return true;
    if (typeof v === 'number') return Number.isFinite(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER;
    if (typeof v === 'string') return v.length <= 32768;
    if (!v || typeof v !== 'object') return false;
    if (Array.isArray(v)) return v.length <= 4096 && v.every(x => walk(x, depth + 1));
    const keys = Object.keys(v);
    return keys.length <= 128 && keys.every(k => k.length <= 128 && !['__proto__', 'prototype', 'constructor'].includes(k) && walk(v[k], depth + 1));
  }
  return walk(value, 0);
}
function bucket(rate, burst) { return { rate, burst, value: burst, at: now() }; }
function take(b, cost = 1) {
  const t = now(); b.value = Math.min(b.burst, b.value + (t - b.at) * b.rate / 1000); b.at = t;
  if (b.value < cost) return false;
  b.value -= cost; return true;
}
function validProfile(m, partial = false) {
  if ((!partial || m.nick !== undefined) && !(string(m.nick, 24) && m.nick.trim().length && !/[\x00-\x1f\x7f<>]/u.test(m.nick))) return false;
  if ((!partial || m.character !== undefined) && !CHARACTERS.includes(m.character)) return false;
  return m.ready === undefined || typeof m.ready === 'boolean';
}
function validInput(input) {
  if (!record(input)) return false;
  const flags = ['attack', 'guard', 'blink', 'special', 'ego', 'interact', 'autoBasic', 'autoSkill', 'threadDance', 'goldenCast', 'goldenSecond'];
  if (!Object.keys(input).every(k => ['moveX', 'moveY', 'target', 'route', 'skillSlot', 'goldenAim', ...flags].includes(k))) return false;
  if (input.skillSlot !== undefined && !['w', 'e', 'r'].includes(input.skillSlot)) return false;
  for (const axis of ['moveX', 'moveY']) if (input[axis] !== undefined && !(typeof input[axis] === 'number' && Number.isFinite(input[axis]) && Math.abs(input[axis]) <= 1)) return false;
  for (const key of flags) if (input[key] !== undefined && typeof input[key] !== 'boolean') return false;
  if (input.target !== undefined && input.target !== null && !string(input.target, 128)) return false;
  if(input.goldenAim!==undefined&&!(record(input.goldenAim)&&Object.keys(input.goldenAim).length===2&&['x','y'].every(k=>Number.isFinite(input.goldenAim[k])&&Math.abs(input.goldenAim[k])<=WORLD_COORD_LIMIT_R73)))return false;
  if (input.route !== undefined && input.route !== null && !(record(input.route) && Object.keys(input.route).every(k => ['x','y'].includes(k)) && ['x','y'].every(k => typeof input.route[k] === 'number' && Number.isFinite(input.route[k]) && Math.abs(input.route[k]) <= WORLD_COORD_LIMIT_R73))) return false;
  return safeJSON(input, 64, 3);
}
function validGolden(command) {
  if(!record(command)||command.kind!=='golden'||Object.keys(command).some(k=>!['kind','action'].includes(k))||!record(command.action))return false;
  const a=command.action;if(typeof a.op!=='string')return false;
  const schemas={save:['op','id','name','strokes'],rename:['op','id','name'],clone:['op','id'],delete:['op','id'],equip:['op','id'],learn:['op'],upgrade:['op','key'],auto:['op','enabled']},fields=Object.hasOwn(schemas,a.op)?schemas[a.op]:null;
  if(!fields||Object.keys(a).some(k=>!fields.includes(k)))return false;
  if(['rename','clone','delete','equip'].includes(a.op)&&!(string(a.id,48)&&/^[A-Za-z0-9_-]+$/.test(a.id)))return false;
  if(['save','rename'].includes(a.op)&&!(typeof a.name==='string'&&a.name.length<=24&&!/[\x00-\x1f<>]/.test(a.name)))return false;
  if(a.op==='save'){
    if(a.id!=null&&!(string(a.id,48)&&/^[A-Za-z0-9_-]+$/.test(a.id)))return false;
    if(!Array.isArray(a.strokes)||!a.strokes.length||a.strokes.length>12||a.strokes.reduce((n,s)=>n+(Array.isArray(s)?s.length:1000),0)>192)return false;
    if(!a.strokes.every(s=>Array.isArray(s)&&s.length>=2&&s.every(p=>record(p)&&Object.keys(p).length===2&&['x','y'].every(k=>Number.isFinite(p[k])&&Math.abs(p[k])<=1.001))))return false;
  }
  if(a.op==='upgrade'&&!['cooldown','damage','size','speed','slots','equip'].includes(a.key))return false;
  if(a.op==='auto'&&typeof a.enabled!=='boolean')return false;
  return safeJSON(command,800,7);
}
function validState(state, epoch) {
  if (!record(state) || !safeJSON(state)) return false;
  if (state.version !== 1 || state.epoch !== epoch) return false;
  const counts = { players: 4, enemies: 128, shots: 512, hazards: 256, effects: 256, events: 256 };
  for (const [key, cap] of Object.entries(counts)) if (state[key] !== undefined && !(Array.isArray(state[key]) && state[key].length <= cap)) return false;
  return true;
}
function code() { return Array.from(randomBytes(6), b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(''); }

/** Stateless relay: rooms, token hashes, and newest snapshots live only in RAM. */
export function createRelay(options = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const trustProxy = options.trustProxy ?? process.env.TRUST_PROXY === '1';
  const allowedOrigins = new Set(options.allowedOrigins ?? (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
  if (production && !allowedOrigins.size) throw new Error('ALLOWED_ORIGINS must contain the exact HTTPS game origin in production.');
  for (const origin of allowedOrigins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (production && parsed.protocol !== 'https:')) throw new Error('ALLOWED_ORIGINS entries must be exact origins; HTTPS is required in production.');
  }
  const limits = { ...LIMITS, ...options.limits };
  const rooms = new Map(), peers = new Set(), ipRates = new Map();
  const metrics = { accepted: 0, rejected: 0, roomCreates: 0, messages: 0 };
  let stopping = false;
  function ip(req) {
    if (trustProxy) return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').at(-1).trim();
    return req.socket.remoteAddress || 'unknown';
  }
  function rates(address) {
    let r = ipRates.get(address);
    if (!r) { r = { connect: bucket(1, 30), join: bucket(.2, 12), at: now() }; ipRates.set(address, r); }
    r.at = now(); return r;
  }
  function send(peer, message) {
    if (!peer || peer.ws.readyState !== WebSocket.OPEN) return false;
    if (peer.ws.bufferedAmount > limits.buffer) { peer.ws.close(1013, 'Slow connection; reconnect'); return false; }
    peer.ws.send(JSON.stringify(message)); return true;
  }
  function fail(peer, code, message, fatal = false) {
    metrics.rejected++; send(peer, { type: 'error', code, message });
    if (fatal) peer.ws.close(1008, code);
  }
  function broadcast(room, message, except) { for (const p of room.players.values()) if (p.peer && p.id !== except) send(p.peer, message); }
  function roster(room) { return [...room.players.values()].map(p => ({ id: p.id, nick: p.nick, character: p.character, ready: p.ready, connected: !!p.peer, loaded: p.loaded })); }
  function lobby(room) { broadcast(room, { type: 'lobby', code: room.code, hostId: room.hostId, epoch: room.epoch, phase: room.phase, regionId: room.regionId, layer: room.layer, players: roster(room) }); }
  function closeRoom(room, reason) {
    if (!rooms.has(room.code)) return;
    rooms.delete(room.code);
    for (const p of room.players.values()) {
      clearTimeout(p.expiry);
      if (p.peer) { p.peer.room = null; p.peer.player = null; send(p.peer, { type: 'room_closed', reason }); p.peer.ws.close(1000, reason); }
    }
    room.players.clear(); room.snapshot = null;
  }
  function allLoaded(room) {
    if (room.phase !== 'loading') return;
    const connected = [...room.players.values()].filter(p => p.peer);
    if (!connected.length || !connected.every(p => p.loaded)) return;
    room.phase = room.paused ? 'paused' : 'playing'; room.loadStarted = 0;
    broadcast(room, { type: 'all_loaded', epoch: room.epoch, phase: room.phase, regionId: room.regionId, layer: room.layer });
    lobby(room);
  }
  function barrier(room, regionId, reason, newEpoch = false, layer = room.layer) {
    if (newEpoch) { room.epoch++; room.snapshot = null; }
    room.regionId = regionId; room.layer = layer; room.phase = 'loading'; room.loadStarted = now();
    for (const p of room.players.values()) p.loaded = false;
    broadcast(room, { type: 'transition', epoch: room.epoch, regionId, layer: room.layer, mazeR73: room.mazeR73 || { version: 1, seed: 0 }, reason });
    lobby(room);
  }
  function attach(peer, room, player, reconnecting = false) {
    clearTimeout(peer.handshake); clearTimeout(player.expiry); player.expiry = null;
    peer.room = room; peer.player = player; player.peer = peer;
    player.loaded = room.phase === 'lobby';
    let resumeToken = null;
    if (player.id !== room.hostId) { resumeToken = token(); player.tokenHash = hash(resumeToken); }
    send(peer, { type: 'welcome', ...PROTOCOL, code: room.code, selfId: player.id, hostId: room.hostId,
      resumeToken, graceMs: limits.graceMs, epoch: room.epoch, phase: room.phase, regionId: room.regionId, layer: room.layer, mazeR73: room.mazeR73 || { version: 1, seed: 0 }, players: roster(room) });
    if (room.phase !== 'lobby') {
      barrier(room, room.regionId, reconnecting ? 'reconnect' : 'late_join');
      if (room.snapshot) send(peer, room.snapshot);
      send(room.players.get(room.hostId)?.peer, { type: 'resync', playerId: player.id, epoch: room.epoch, lastSeq: -1 });
    }
    lobby(room);
  }
  function removePlayer(room, player, reason) {
    if (!room.players.has(player.id)) return;
    clearTimeout(player.expiry); room.players.delete(player.id);
    broadcast(room, { type: 'peer_left', playerId: player.id, reason }); lobby(room); allLoaded(room);
  }
  function detach(peer) {
    peers.delete(peer); clearTimeout(peer.handshake);
    const { room, player } = peer; peer.room = null; peer.player = null;
    if (!room || !player || !rooms.has(room.code) || player.peer !== peer) return;
    player.peer = null; player.loaded = false;
    if (player.id === room.hostId) return closeRoom(room, stopping ? 'server_shutdown' : 'host_left');
    if (peer.explicitLeave) return removePlayer(room, player, 'left');
    player.expiry = setTimeout(() => removePlayer(room, player, 'reconnect_expired'), limits.graceMs);
    player.expiry.unref?.();
    broadcast(room, { type: 'peer_disconnected', playerId: player.id, graceMs: limits.graceMs }); lobby(room); allLoaded(room);
  }
  function newPlayer(m, host = false) {
    return { id: randomBytes(8).toString('hex'), nick: m.nick.trim(), character: m.character, ready: host,
      peer: null, tokenHash: null, expiry: null, loaded: false, inputSeq: -1, commandSeq: -1 };
  }
  function handshake(peer, m) {
    if (!['create', 'join', 'reconnect'].includes(m.type)) return fail(peer, 'HANDSHAKE_REQUIRED', 'Create or join a room first.', true);
    if (!take(rates(peer.address).join)) return fail(peer, 'JOIN_RATE', 'Too many entry attempts; wait before trying again.', true);
    if (m.gameId !== PROTOCOL.gameId || m.build !== PROTOCOL.build || m.protocol !== PROTOCOL.protocol) return fail(peer, 'VERSION_MISMATCH', 'Game, build, or protocol does not match.', true);
    if (m.type === 'create') {
      if (!validProfile(m)) return fail(peer, 'PROFILE_INVALID', 'Choose a valid nickname and character.', true);
      if (rooms.size >= limits.rooms) return fail(peer, 'SERVER_FULL', 'Relay room limit reached.', true);
      let id; do { id = code(); } while (rooms.has(id));
      const host = newPlayer(m, true);
      const room = { code: id, hostId: host.id, players: new Map([[host.id, host]]), epoch: 0, phase: 'lobby', regionId: null, layer: 'STORY',
        paused: false, snapshot: null, snapshotSeq: -1, eventSeq: -1, loadStarted: 0 };
      rooms.set(id, room); metrics.roomCreates++; attach(peer, room, host); return;
    }
    if (!string(m.code, 6) || !/^[A-Z2-9]{6}$/.test(m.code)) return fail(peer, 'ROOM_NOT_FOUND', 'Room code was not found.', true);
    const room = rooms.get(m.code);
    if (!room) return fail(peer, 'ROOM_NOT_FOUND', 'Room code expired or was not found.', true);
    if (m.type === 'reconnect') {
      const p = room.players.get(m.playerId);
      if (!p || p.id === room.hostId || p.peer || !string(m.token, 64) || !p.tokenHash || !timingSafeEqual(hash(m.token), p.tokenHash)) return fail(peer, 'RECONNECT_DENIED', 'Reconnect token is invalid, expired, or already connected.', true);
      attach(peer, room, p, true); return;
    }
    if (!validProfile(m)) return fail(peer, 'PROFILE_INVALID', 'Choose a valid nickname and character.', true);
    if (room.players.size >= limits.players) return fail(peer, 'ROOM_FULL', 'This room already has 4 players, including reserved reconnect seats.', true);
    const p = newPlayer(m); room.players.set(p.id, p); attach(peer, room, p);
  }
  function message(peer, m) {
    if (!peer.room) return handshake(peer, m);
    const { room, player } = peer; const host = player.id === room.hostId;
    const hostOnly = () => { if (host) return true; fail(peer, 'HOST_ONLY', 'Only the host can decide this action.'); return false; };
    const epochOK = () => { if (integer(m.epoch) && m.epoch === room.epoch) return true; fail(peer, 'STALE_EPOCH', 'Map epoch does not match; request a resync.'); return false; };
    switch (m.type) {
      case 'profile':
        if (!validProfile(m, true)) return fail(peer, 'PROFILE_INVALID', 'Invalid profile.');
        if (room.phase !== 'lobby') return fail(peer, 'LOBBY_ONLY', 'Character and nickname are locked after starting.');
        if (m.nick !== undefined) player.nick = m.nick.trim(); if (m.character !== undefined) player.character = m.character;
        if (m.ready !== undefined) player.ready = host || m.ready; lobby(room); return;
      case 'start':
        if (!hostOnly()) return;
        if (room.phase !== 'lobby') return fail(peer, 'ALREADY_STARTED', 'Session is already running.');
        if (!string(m.regionId, 128) || !/^[A-Za-z0-9_-]+$/.test(m.regionId)) return fail(peer, 'REGION_INVALID', 'A valid starting region is required.');
        if (![...room.players.values()].every(p => p.peer && p.ready)) return fail(peer, 'NOT_READY', 'Every player must be connected and ready.');
        if (m.layer !== undefined && !['STORY','DREAM'].includes(m.layer)) return fail(peer, 'LAYER_INVALID', 'Invalid story layer.');
        if (!validMazeR73(m.mazeR73)) return fail(peer, 'MAZE_INVALID', 'Invalid host maze seed.');
        room.mazeR73 = m.mazeR73 ? { version: 1, seed: m.mazeR73.seed } : { version: 1, seed: 0 };
        barrier(room, m.regionId, 'start', true, m.layer || 'STORY'); return;
      case 'transition':
        if (!hostOnly()) return;
        if (!['playing', 'paused'].includes(room.phase) || m.epoch !== room.epoch + 1 || !string(m.regionId, 128) || !/^[A-Za-z0-9_-]+$/.test(m.regionId)) return fail(peer, 'TRANSITION_INVALID', 'Invalid transition, epoch, or room phase.');
        if (m.layer !== undefined && !['STORY','DREAM'].includes(m.layer)) return fail(peer, 'LAYER_INVALID', 'Invalid story layer.');
        if (!validMazeR73(m.mazeR73)) return fail(peer, 'MAZE_INVALID', 'Invalid host maze seed.');
        room.mazeR73 = m.mazeR73 ? { version: 1, seed: m.mazeR73.seed } : { version: 1, seed: 0 };
        barrier(room, m.regionId, 'map', true, m.layer || room.layer); return;
      case 'loaded':
        if (!epochOK()) return;
        if (room.phase !== 'loading') return fail(peer, 'LOAD_PHASE', 'The room is not loading.');
        player.loaded = true; broadcast(room, { type: 'peer_loaded', playerId: player.id, epoch: room.epoch }); allLoaded(room); return;
      case 'input':
        if (!epochOK()) return;
        if (!take(peer.inputRate)) return fail(peer, 'INPUT_RATE', 'Input rate exceeded.');
        if (!integer(m.seq) || m.seq <= player.inputSeq) return fail(peer, 'STALE_SEQUENCE', 'Input sequence must increase.');
        if (!validInput(m.input)) return fail(peer, 'INPUT_INVALID', 'Invalid player input.');
        if (room.phase !== 'playing') return fail(peer, 'SESSION_PAUSED', 'Wait for all players to finish loading or for the host to resume.');
        player.inputSeq = m.seq; send(room.players.get(room.hostId)?.peer, { type: 'input', playerId: player.id, seq: m.seq, epoch: room.epoch, input: m.input }); return;
      case 'command':
        if (!epochOK()) return;
        if (!take(peer.commandRate)) return fail(peer, 'COMMAND_RATE', 'Command rate exceeded.');
        if (!integer(m.seq) || m.seq <= player.commandSeq) return fail(peer, 'STALE_SEQUENCE', 'Command sequence must increase.');
        if (!validGolden(m.command) && (!record(m.command) || m.command.kind !== 'upgrade' || !string(m.command.passiveId, 64) || !/^[A-Za-z0-9_-]+$/.test(m.command.passiveId) || Object.keys(m.command).some(k => !['kind','passiveId'].includes(k)))) return fail(peer, 'COMMAND_INVALID', 'Invalid upgrade or golden design command.');
        if (!['playing','paused'].includes(room.phase)) return fail(peer, 'SESSION_PAUSED', 'Wait until loading completes before upgrading.');
        player.commandSeq = m.seq; send(room.players.get(room.hostId)?.peer, { type: 'command', playerId: player.id, seq: m.seq, epoch: room.epoch, command: m.command }); return;
      case 'snapshot':
        if (!hostOnly() || !epochOK()) return;
        if (!take(peer.snapshotRate)) return fail(peer, 'SNAPSHOT_RATE', 'Snapshot rate exceeded.');
        if (!integer(m.seq) || m.seq <= room.snapshotSeq) return fail(peer, 'STALE_SEQUENCE', 'Snapshot sequence must increase.');
        if (!validState(m.state, room.epoch)) return fail(peer, 'STATE_INVALID', 'Invalid or oversized state shape.');
        if (room.phase === 'lobby') return fail(peer, 'NOT_STARTED', 'Start the session before sending state.');
        room.snapshotSeq = m.seq; room.snapshot = { type: 'snapshot', epoch: room.epoch, seq: m.seq, state: m.state };
        broadcast(room, room.snapshot, player.id); return;
      case 'event':
        if (!hostOnly() || !epochOK()) return;
        if (!take(peer.eventRate)) return fail(peer, 'EVENT_RATE', 'Event rate exceeded.');
        if (!integer(m.seq) || m.seq <= room.eventSeq || !record(m.event) || !safeJSON(m.event, 2048, 10) || JSON.stringify(m.event).length > 32768) return fail(peer, 'EVENT_INVALID', 'Invalid event or sequence.');
        if (room.phase !== 'playing') return fail(peer, 'SESSION_PAUSED', 'Events are paused during loading or host suspension.');
        room.eventSeq = m.seq; broadcast(room, { type: 'event', seq: m.seq, epoch: room.epoch, event: m.event }, player.id); return;
      case 'pause':
        if (!hostOnly()) return;
        if (typeof m.paused !== 'boolean' || !['background', 'manual', 'connection'].includes(m.reason)) return fail(peer, 'PAUSE_INVALID', 'Invalid pause request.');
        room.paused = m.paused; if (room.phase === 'playing' || room.phase === 'paused') room.phase = m.paused ? 'paused' : 'playing';
        broadcast(room, { type: 'paused', paused: room.paused, reason: m.reason, epoch: room.epoch, phase: room.phase }); return;
      case 'resync':
        if (!epochOK()) return;
        if (!take(peer.resyncRate) || !integer(m.lastSeq, -1)) return fail(peer, 'RESYNC_RATE', 'Resync request limit or invalid sequence.');
        if (room.snapshot) send(peer, room.snapshot);
        if (!host) send(room.players.get(room.hostId)?.peer, { type: 'resync', playerId: player.id, epoch: room.epoch, lastSeq: m.lastSeq }); return;
      case 'leave':
        peer.explicitLeave = true;
        if (host) closeRoom(room, 'host_left'); else { removePlayer(room, player, 'left'); peer.room = null; peer.player = null; peer.ws.close(1000, 'left'); }
        return;
      default: fail(peer, 'TYPE_INVALID', 'Unsupported message type.');
    }
  }
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && req.url === '/health') { res.writeHead(200); res.end(JSON.stringify({ ok: true, ...PROTOCOL })); }
    else { res.writeHead(404); res.end('{"error":"not_found"}'); }
  });
  const wss = new WebSocketServer({ noServer: true, clientTracking: false, perMessageDeflate: false,
    maxPayload: limits.payload, maxFragments: 64, maxBufferedChunks: 1024, allowSynchronousEvents: false });
  server.on('upgrade', (req, socket, head) => {
    const deny = (status) => { metrics.rejected++; socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`); };
    if (stopping || peers.size >= limits.connections) return deny('503 Service Unavailable');
    if (req.url !== '/ws' || req.method !== 'GET') return deny('404 Not Found');
    const origin = req.headers.origin;
    if (allowedOrigins.size ? !allowedOrigins.has(origin) : production || (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) return deny('403 Forbidden');
    if (production && !(req.socket.encrypted || (trustProxy && req.headers['x-forwarded-proto'] === 'https'))) return deny('426 Upgrade Required');
    const address = ip(req);
    if (!take(rates(address).connect)) return deny('429 Too Many Requests');
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req, address));
  });
  wss.on('connection', (ws, req, address) => {
    const peer = { ws, address, room: null, player: null, alive: true, explicitLeave: false,
      rate: bucket(80, 160), bytes: bucket(2097152, 4194304), inputRate: bucket(40, 70), snapshotRate: bucket(15, 20), eventRate: bucket(30, 40), resyncRate: bucket(.5, 3), commandRate: bucket(10, 20) };
    peers.add(peer); metrics.accepted++;
    peer.handshake = setTimeout(() => fail(peer, 'HANDSHAKE_TIMEOUT', 'Room entry timed out.', true), limits.handshakeMs); peer.handshake.unref?.();
    ws.on('pong', () => { peer.alive = true; });
    ws.on('error', () => {}); // No payloads, token values, or private state are logged.
    ws.on('close', () => detach(peer));
    ws.on('message', (data, binary) => {
      if (binary) return fail(peer, 'TEXT_REQUIRED', 'Only JSON text messages are accepted.', true);
      if (!take(peer.rate) || !take(peer.bytes, data.length)) return fail(peer, 'MESSAGE_RATE', 'Message rate exceeded.', true);
      let parsed;
      try { parsed = JSON.parse(data.toString()); } catch { return fail(peer, 'JSON_INVALID', 'Malformed JSON.', true); }
      if (!record(parsed) || !string(parsed.type, 24) || !safeJSON(parsed)) return fail(peer, 'SHAPE_INVALID', 'Invalid message shape.', true);
      metrics.messages++;
      try { message(peer, parsed); } catch { fail(peer, 'MESSAGE_INVALID', 'Message could not be processed.', true); }
    });
  });
  const heartbeat = setInterval(() => {
    for (const p of peers) {
      if (!p.alive) { p.ws.terminate(); continue; }
      p.alive = false; if (p.ws.readyState === WebSocket.OPEN) p.ws.ping();
    }
    for (const room of rooms.values()) if (room.phase === 'loading' && now() - room.loadStarted > limits.loadMs) {
      const host = room.players.get(room.hostId);
      if (!host?.loaded) { closeRoom(room, 'host_load_timeout'); continue; }
      for (const p of [...room.players.values()]) if (p.peer && !p.loaded) { const peer = p.peer; removePlayer(room, p, 'load_timeout'); peer.room = null; peer.player = null; fail(peer, 'LOAD_TIMEOUT', 'Map loading timed out; join again.', true); }
      allLoaded(room);
    }
    for (const [address, r] of ipRates) if (now() - r.at > 120000) ipRates.delete(address);
  }, limits.heartbeatMs); heartbeat.unref?.();
  return { server, protocol: PROTOCOL, metrics,
    listen: (port = 0, host = '127.0.0.1') => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(server.address()); }); }),
    close: async () => { stopping = true; clearInterval(heartbeat); for (const r of [...rooms.values()]) closeRoom(r, 'server_shutdown'); for (const p of [...peers]) { clearTimeout(p.handshake); p.ws.terminate(); } await new Promise(resolve => wss.close(resolve)); if (server.listening) await new Promise(resolve => server.close(resolve)); },
    inspect: () => ({ rooms: rooms.size, connections: peers.size, players: [...rooms.values()].reduce((n, r) => n + r.players.size, 0), metrics: { ...metrics } }) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const relay = createRelay();
  const port = Number(process.env.PORT || 10000);
  if (!integer(port, 1, 65535)) throw new Error('PORT must be 1..65535.');
  await relay.listen(port, '0.0.0.0');
  console.log(`StoryWorld relay ${PROTOCOL.build}/${PROTOCOL.protocol} listening on port ${port}`);
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => relay.close().then(() => process.exit(0)));
}
