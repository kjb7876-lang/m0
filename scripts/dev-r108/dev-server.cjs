'use strict';
// Loopback-only dev server for StoryWorld work in progress.
//  --base   frozen built site (read-only fallback for every file)
//  --src    working copy of r96/client-source   (top-level *.js overlays)
//  --assets working copy of r96/runtime-text    (assets/** and other files)
//  --own    comma list: overlay js names taken from --src (everything else JS comes from --base)
//  --inject comma list: overlay js names added as <script> tags before audio-r98.js (must exist in --src)
//  --assets-own comma list of path prefixes (relative to site) taken from --assets, e.g. assets/r108/mazes/
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const a = {}; for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const base = path.resolve(a.base), src = a.src && path.resolve(a.src), assets = a.assets && path.resolve(a.assets);
const own = new Set((a.own || '').split(',').filter(Boolean)), inject = (a.inject || '').split(',').filter(Boolean);
const aown = (a['assets-own'] || '').split(',').filter(Boolean), port = Number(a.port || 49400);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
const within = (root, f) => f === root || f.startsWith(root + path.sep);
function resolveFile(rel) {
  const cands = [];
  if (src && !rel.includes('/') && rel.endsWith('.js') && own.has(rel)) cands.push(path.join(src, rel));
  if (assets && aown.some(p => rel.startsWith(p))) cands.push(path.join(assets, rel));
  if (assets && inject.includes(rel)) cands.push(path.join(src, rel));
  cands.push(path.join(base, rel));
  for (const f of cands) { const root = f.startsWith(base) ? base : f.startsWith(src || '\0') ? src : assets; if (!within(root, f)) continue; try { if (fs.statSync(f).isFile()) return f; } catch (_) {} }
  return null;
}
http.createServer((req, res) => {
  let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''); } catch (_) { res.writeHead(400); return res.end(); }
  if (rel === '') rel = 'index.html'; if (rel.includes('..') || rel.includes('\\')) { res.writeHead(403); return res.end(); }
  const f = resolveFile(rel); if (!f) { res.writeHead(404); return res.end(); }
  const H = { 'Content-Type': mime[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' };
  if (rel === 'index.html' && inject.length) {
    let t = fs.readFileSync(f, 'utf8'); const tags = inject.map(n => '<script src="./' + n + '"></script>').join('\n'), key = '<script src="./audio-r98.js"></script>';
    t = t.includes(key) ? t.replace(key, tags + '\n' + key) : t.replace('</body>', tags + '\n</body>'); const b = Buffer.from(t, 'utf8'); res.writeHead(200, { ...H, 'Content-Length': b.length }); return res.end(b);
  }
  const st = fs.statSync(f); let start = 0, end = st.size - 1, status = 200;
  const m = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (m) { if (!m[1]) start = Math.max(0, st.size - Number(m[2])); else { start = Number(m[1]); if (m[2]) end = Math.min(st.size - 1, Number(m[2])); } if (start >= st.size || end < start) { res.writeHead(416); return res.end(); } status = 206; H['Content-Range'] = `bytes ${start}-${end}/${st.size}`; }
  H['Content-Length'] = end - start + 1; H['Accept-Ranges'] = 'bytes'; res.writeHead(status, H);
  if (req.method === 'HEAD') return res.end(); fs.createReadStream(f, { start, end }).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('dev-server on', port, 'own=', [...own].join('|'), 'inject=', inject.join('|')));
