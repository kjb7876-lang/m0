'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repo = path.resolve(__dirname, '../../..');
const args = process.argv.slice(2);
function value(flag) {
  const index = args.indexOf(flag);
  return index < 0 ? null : args[index + 1];
}
const sourceDir = value('--site');
const destination = value('--out');
if (!sourceDir || !destination) {
  console.error('Usage: prepare-preview.cjs --site <built-site> --out <new-local-directory>');
  process.exit(2);
}
const site = fs.realpathSync(path.resolve(sourceDir));
const out = path.resolve(destination);
const scratch = [os.tmpdir(), process.env.RUNNER_TEMP, '/workspace'].filter(Boolean);
const isInside = (root, name) => name === root || name.startsWith(root + path.sep);
if (!scratch.some(root => isInside(path.resolve(root), out))) throw Error('Preview must be in a scratch directory');
if (isInside(site, out) || fs.existsSync(out)) throw Error('Destination must be a new directory outside the source site');
const protectedPaths = ['r96/runtime-text', 'r96/client-source', 'r96/hospital-three-pc', 'docs'];
if (protectedPaths.some(dir => isInside(path.join(repo, dir), out))) throw Error('Use a separate preview directory');

const overlay = 'mammon-miniature-pilot.js';
const source = path.join(repo, 'r96/client-source', overlay);
const assetRoot = 'assets/mammon-v3';
const assets = path.join(repo, 'r96/runtime-text', assetRoot);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
if (!html.includes('</body>')) throw Error('Source site has no body terminator');
if (html.includes('seven-sins-art.js')) throw Error('Refuse broad seven-map candidate');
const tag = '<script src="./mammon-miniature-pilot.js" data-mammon-release></script>';
const registered = html.includes(tag);
if (html.includes(overlay) && (!registered || html.split(overlay).length !== 2)) {
  throw Error('Ambiguous or duplicated Mammon registration');
}
const sourceBytes = fs.readFileSync(source);
const index = JSON.parse(fs.readFileSync(path.join(assets, 'index.json')));
const active = index.assets.filter(asset => asset.status === 'registered');
if (active.length !== 7) throw Error('Expected seven Mammon derivatives');
for (const asset of active) {
  if (path.basename(asset.file) !== asset.file) throw Error('Unsafe asset path');
  const bytes = fs.readFileSync(path.join(registered ? path.join(site, assetRoot) : assets, asset.file));
  if (bytes.length !== asset.bytes || sha(bytes) !== asset.sha256) throw Error('Asset mismatch ' + asset.id);
}
if (registered) {
  if (sha(fs.readFileSync(path.join(site, overlay))) !== sha(sourceBytes)) throw Error('Registered script mismatch');
} else if (fs.existsSync(path.join(site, overlay)) || fs.existsSync(path.join(site, assetRoot))) {
  throw Error('Baseline already has Mammon files');
}

fs.cpSync(site, out, {recursive:true, errorOnExist:true, force:false});
if (!registered) {
  const assetDest = path.join(out, assetRoot);
  fs.mkdirSync(assetDest, {recursive:true});
  for (const asset of active) fs.copyFileSync(path.join(assets, asset.file), path.join(assetDest, asset.file));
  fs.writeFileSync(path.join(out, overlay), sourceBytes, {flag:'wx'});
  fs.writeFileSync(path.join(out, 'index.html'), html.replace('</body>', '<script src="./' + overlay + '"></script>\n</body>'));
}
const evidence = {
  revision: sourceBytes.toString().match(/const REV='([^']+)'/)?.[1] || 'unknown',
  activeAssets: active.map(asset => asset.id), localOnly:true, sourceSite:site, output:out,
  overlaySHA256: sha(sourceBytes), sourceIndexSHA256: sha(html),
  injectedIndexSHA256: sha(fs.readFileSync(path.join(out, 'index.html'))), registered, browserLaunched:false
};
fs.writeFileSync(path.join(out, 'mammon-pilot-local-preview.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
