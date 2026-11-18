// 로컬 시험: D1 = node:sqlite, KV = 메모리, ChatGPT 콜백 = 가짜 수신기(Standard Webhooks 서명을 따로 검증).
// 실행: node --no-warnings test/worker.test.mjs
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const worker = (await import(path.join(here, '..', 'src', 'worker.js'))).default;

const checks = []; const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
// ---- D1·KV 흉내 ----
function d1() {
  const db = new DatabaseSync(':memory:'); db.exec(readFileSync(path.join(here, '..', 'schema.sql'), 'utf8'));
  return { prepare(sql) { const st = db.prepare(sql); let args = []; const o = { bind(...a) { args = a; return o; },
    async run() { st.run(...args); return { success: true }; }, async first() { return st.get(...args) ?? null; }, async all() { return { results: st.all(...args) }; } }; return o; } };
}
function kv() { const m = new Map(); return { async put(k, v, o) { m.set(k, { v: new Uint8Array(v), meta: o?.metadata }); }, async get(k, t) { const e = m.get(k); if (!e) return null; return t === 'arrayBuffer' ? e.v.buffer.slice(e.v.byteOffset, e.v.byteOffset + e.v.byteLength) : e.v; } }; }

// ---- 가짜 ChatGPT 콜백(서명 검증) ----
const SECRET = 'whsec_' + randomBytes(32).toString('base64');
function verifySig(secret, h, body) {
  const key = Buffer.from(secret.slice(6), 'base64');
  const want = createHmac('sha256', key).update(`${h['webhook-id']}.${h['webhook-timestamp']}.${body}`).digest('base64');
  return String(h['webhook-signature']).split(' ').some(s => { const [v, sig] = s.split(','); return v === 'v1' && sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want)); });
}
let receiverMode = 'ok'; const received = [];
async function fakeFetch(url, init) {
  if (String(url).startsWith('https://files.example.com/')) return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  const h = Object.fromEntries(Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v]));
  const body = init.body; const sigOk = verifySig(SECRET, h, body); const msg = JSON.parse(body);
  received.push({ url, h, msg, sigOk, redirect: init.redirect });
  if (receiverMode === 'fail') return new Response('nope', { status: 500 });
  if (receiverMode === 'wrongchallenge' && msg.type === 'verification') return new Response(JSON.stringify({ challenge: 'x' }), { status: 200 });
  if (msg.type === 'verification') return new Response(JSON.stringify({ challenge: msg.challenge }), { status: 200, headers: { 'content-type': 'application/json' } });
  return new Response(null, { status: 202 });
}
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

const env = { DB: d1(), IMAGES: kv(), ADMIN_TOKEN: 'adm-test-token', MCP_PATH_SECRET: 'mcp-path-secret-123', __fetch: fakeFetch };
const ctx = { waitUntil() {} };
const mcp = async (method, params, id = 1) => { const r = await worker.fetch(new Request('https://w.example/mcp/' + env.MCP_PATH_SECRET, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }), env, ctx); return r.status === 202 ? null : r.json(); };
const adminReq = (method, p, body, token = env.ADMIN_TOKEN) => worker.fetch(new Request('https://w.example' + p, { method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }), env, ctx);
const CB = 'https://receiver.example.com/mcp-events/callback_1';

// 1) 능력·목록
const init = await mcp('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't' } });
ok('initialize advertises tools + events and echoes a supported protocol', init.result.capabilities.events && init.result.capabilities.tools && init.result.protocolVersion === '2025-03-26', init);
const evs = await mcp('events/list', {});
ok('events/list returns asset.requested with webhook delivery, input and payload schemas', evs.result.events[0].name === 'asset.requested' && evs.result.events[0].delivery[0] === 'webhook' && evs.result.events[0].payloadSchema.required.includes('asset_id'));
const tl = await mcp('tools/list', {});
ok('tools/list has list/get/submit', ['list_pending_assets', 'get_asset_request', 'submit_asset'].every(n => tl.result.tools.some(t => t.name === n)));

// 2) 구독 거절
const sub = (args, delivery, extra = {}) => mcp('events/subscribe', { name: 'asset.requested', arguments: args, delivery, cursor: null, ...extra });
let r = await sub({}, { mode: 'webhook', url: CB, secret: 'whsec_' + Buffer.from('short').toString('base64') });
ok('secret shorter than 24 bytes is rejected', r.error && r.error.code === -32602);
r = await sub({}, { mode: 'webhook', url: 'http://receiver.example.com/x', secret: SECRET });
ok('non-https callback rejected with -32015 not_https', r.error?.code === -32015 && r.error.data.reason === 'not_https');
for (const u of ['https://127.0.0.1/x', 'https://10.2.3.4/x', 'https://[::1]/x', 'https://localhost/x', 'https://192.168.1.9/x', 'https://169.254.169.254/x']) {
  r = await sub({}, { mode: 'webhook', url: u, secret: SECRET }); if (!(r.error?.code === -32015 && r.error.data.reason === 'blocked_address')) ok('private address blocked ' + u, false, r);
}
ok('private / local callback addresses are blocked', true);
r = await sub({ colour: 'red' }, { mode: 'webhook', url: CB, secret: SECRET });
ok('unknown filter argument rejected', r.error?.code === -32602);
receiverMode = 'wrongchallenge'; r = await sub({ category: 'mob' }, { mode: 'webhook', url: 'https://receiver.example.com/other', secret: SECRET });
ok('wrong echoed challenge → -32015 challenge_failed, no subscription', r.error?.code === -32015 && r.error.data.reason === 'challenge_failed'); receiverMode = 'ok';

// 3) 구독 성공 + 검증 요청
received.length = 0;
const s1 = await sub({ category: 'mob' }, { mode: 'webhook', url: CB, secret: SECRET });
const ver = received.find(x => x.msg.type === 'verification');
ok('subscribe verifies the callback with a signed single-use challenge', ver && ver.sigOk && /^msg_verification_/.test(ver.h['webhook-id']) && ver.h['x-mcp-subscription-id'] === s1.result.id && ver.redirect === 'manual', ver?.h);
ok('subscribe returns deterministic id, finite refreshBefore, cursor null', /^sub_[0-9a-f]{32}$/.test(s1.result.id) && Date.parse(s1.result.refreshBefore) > Date.now() && s1.result.cursor === null && s1.result.truncated === false, s1);
received.length = 0;
const s1b = await mcp('events/subscribe', { name: 'asset.requested', arguments: { category: 'mob' }, delivery: { mode: 'webhook', url: CB, secret: SECRET }, ttlMs: 3600e3 });
ok('re-subscribe (refresh) is idempotent: same id, no new challenge (cached), ttl honoured', s1b.result.id === s1.result.id && received.length === 0 && Math.abs(Date.parse(s1b.result.refreshBefore) - Date.now() - 3600e3) < 5000);

// 4) 요청 넣기 → 웹훅
ok('admin without token → 401', (await adminReq('GET', '/admin/status', null, 'bad')).status === 401);
received.length = 0;
const put = await (await adminReq('POST', '/admin/requests', [
  { asset_id: 'm001', category: 'mob', name: '뿌리에 묶인 근위의 기억', spec: '256x320 칸, 걷기 8 + 공격 4, 발 (128,300), 오른쪽 옆모습, 투명', brief: '뿌리에 감긴 근위병 망령, 검', prompt: 'dark fantasy ...', avoid: '글씨, 워터마크, 그림자' },
  { asset_id: 'r251-circle', category: 'prop', name: '발록의 소환진', spec: '384x256 x4', brief: '피의 마법진' }])).json();
const evts = received.filter(x => x.msg.name === 'asset.requested');
ok('enqueue delivers only matching events (category filter mob)', evts.length === 1 && evts[0].msg.data.asset_id === 'm001', received.map(x => x.msg.data?.asset_id));
const e = evts[0];
ok('event is signed (Standard Webhooks), webhook-id == eventId, subscription header set', e.sigOk && e.h['webhook-id'] === e.msg.eventId && e.h['x-mcp-subscription-id'] === s1.result.id && e.h['content-type'] === 'application/json');
ok('event body: eventId, name, ISO timestamp, data matches payload schema, cursor null, no top-level type', e.msg.name === 'asset.requested' && /Z$/.test(e.msg.timestamp) && e.msg.cursor === null && !('type' in e.msg) && ['asset_id', 'category', 'name', 'spec', 'brief'].every(k => typeof e.msg.data[k] === 'string'));

// 5) dots 쪽 도구: 조회·제출
const lp = await mcp('tools/call', { name: 'list_pending_assets', arguments: { category: 'mob' } });
ok('list_pending_assets shows m001', lp.result.structuredContent.pending.some(x => x.asset_id === 'm001'));
const ga = await mcp('tools/call', { name: 'get_asset_request', arguments: { asset_id: 'm001' } });
ok('get_asset_request returns full prompt/avoid', ga.result.structuredContent.prompt === 'dark fantasy ...' && ga.result.structuredContent.avoid);
const bad = await mcp('tools/call', { name: 'submit_asset', arguments: { asset_id: 'm001', image_base64: Buffer.from('not an image').toString('base64') } });
ok('submit rejects non-PNG/WebP bytes', bad.result.isError === true);
const sb = await mcp('tools/call', { name: 'submit_asset', arguments: { asset_id: 'm001', image_base64: Buffer.from(PNG).toString('base64'), notes: 'v1' } });
ok('submit_asset (base64) stores rev 1', sb.result.structuredContent.ok && sb.result.structuredContent.rev === 1, sb);
const sb2 = await mcp('tools/call', { name: 'submit_asset', arguments: { asset_id: 'm001', image: { download_url: 'https://files.example.com/a.png' } } });
ok('submit_asset (file download_url) stores rev 2', sb2.result.structuredContent?.rev === 2, sb2);
const ssrf = await mcp('tools/call', { name: 'submit_asset', arguments: { asset_id: 'm001', image: { download_url: 'https://127.0.0.1/a.png' } } });
ok('file url to a private address is refused', ssrf.result.isError === true);

// 6) 저장소 쪽: 받아 가기
const list = await (await adminReq('GET', '/admin/submissions')).json();
ok('admin lists 2 unfetched submissions', list.submissions.length === 2);
const dl = await adminReq('GET', '/admin/submissions/m001/1'); const bytes = new Uint8Array(await dl.arrayBuffer());
ok('admin download returns exact PNG bytes', dl.headers.get('content-type') === 'image/png' && bytes.length === PNG.length && bytes.every((b, i) => b === PNG[i]));
await adminReq('POST', '/admin/submissions/m001/1/ack');
ok('ack hides it from the unfetched list', (await (await adminReq('GET', '/admin/submissions')).json()).submissions.length === 1);
const st = await (await adminReq('GET', '/admin/status')).json();
ok('status counts', st.subscriptions === 1 && st.submitted === 1 && st.pending === 1, st);

// 7) 실패 → 다시 보내기
receiverMode = 'fail'; received.length = 0;
await adminReq('POST', '/admin/requests', [{ asset_id: 'm002', category: 'mob', name: '재 나방', spec: '256x320', brief: 'x' }]);
ok('failed delivery recorded for retry', (await (await adminReq('GET', '/admin/status')).json()).retrying === 1);
receiverMode = 'ok'; const realNow = Date.now; Date.now = () => realNow() + 120e3;
await worker.scheduled({}, env, { waitUntil: p => p }); await new Promise(r => setTimeout(r, 50)); Date.now = realNow;
const re = received.filter(x => x.msg.data?.asset_id === 'm002');
ok('cron retry re-sends with the same eventId and a fresh valid signature', re.length === 2 && re[0].msg.eventId === re[1].msg.eventId && re[1].sigOk && (await (await adminReq('GET', '/admin/status')).json()).retrying === 0);

// 7b) 키 바꾸기: 새 secret 으로 다시 구독하면 잠시 옛 키·새 키로 함께 서명
const SECRET2 = 'whsec_' + randomBytes(32).toString('base64');
await mcp('events/subscribe', { name: 'asset.requested', arguments: { category: 'mob' }, delivery: { mode: 'webhook', url: CB, secret: SECRET2 } });
received.length = 0; await adminReq('POST', '/admin/requests', [{ asset_id: 'm010', category: 'mob', name: '마지막 길의 호위병', spec: '256x320', brief: 'x' }]);
const rot = received.find(x => x.msg.data?.asset_id === 'm010');
ok('after secret rotation both old and new keys sign during the window', rot && rot.h['webhook-signature'].split(' ').length === 2 && verifySig(SECRET2, rot.h, JSON.stringify(rot.msg)) && rot.sigOk);
// 8) 구독 끊기
const un = await mcp('events/unsubscribe', { name: 'asset.requested', arguments: { category: 'mob' }, delivery: { mode: 'webhook', url: CB } });
received.length = 0; await adminReq('POST', '/admin/requests', [{ asset_id: 'm003', category: 'mob', name: '진흙등 거미', spec: '256x320', brief: 'x' }]);
ok('unsubscribe returns {} and stops delivery; repeating it is harmless', JSON.stringify(un.result) === '{}' && received.length === 0 && (await mcp('events/unsubscribe', { name: 'asset.requested', arguments: { category: 'mob' }, delivery: { mode: 'webhook', url: CB } })).result);

// 9) 경로 비밀
const wrong = await worker.fetch(new Request('https://w.example/mcp/guess', { method: 'POST', body: '{}' }), env, ctx);
ok('wrong MCP path secret → 404', wrong.status === 404);
const note = await worker.fetch(new Request('https://w.example/mcp/' + env.MCP_PATH_SECRET, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }), env, ctx);
ok('notifications get 202 with no body', note.status === 202);

const fail = checks.filter(c => !c.pass); for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' ' + JSON.stringify(c.detail ?? '').slice(0, 400)));
console.log(`dots-asset-events ${checks.length - fail.length}/${checks.length}`); process.exit(fail.length ? 1 : 0);
