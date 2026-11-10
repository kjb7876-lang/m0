'use strict';
// Parse the actual delivered scripts without evaluating game code or stubbing errors.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
if (!vm.SourceTextModule) {
  const result = require('node:child_process').spawnSync(process.execPath,
    ['--experimental-vm-modules', __filename], {stdio: 'inherit'});
  process.exit(result.status ?? 1);
}
const site = path.resolve(__dirname, '../../hospital-three-pc/site');
const failures = [], references = [], counts = {scriptUnits: 0, modules: 0, html: 0};
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function parse(source, filename, module = false) {
  try {
    if (module) { new vm.SourceTextModule(source, {identifier: filename}); counts.modules++; }
    else new vm.Script(source, {filename});
    counts.scriptUnits++;
  } catch (error) { failures.push({filename, error: error.message}); }
}
for (const file of files(site)) {
  const extension = path.extname(file), name = path.relative(site, file);
  if (!['.js', '.mjs', '.html'].includes(extension)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (extension !== '.html') {
    parse(source, name, extension === '.mjs' || /(^|\n)\s*(?:import\s|export\s)/.test(source));
    continue;
  }
  counts.html++;
  for (const [index, match] of [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
    const attributes = match[1], src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attributes);
    if (src) {
      if (!/^(?:https?:|data:|\/\/)/.test(src[1])) {
        const target = path.resolve(path.dirname(file), src[1].split(/[?#]/)[0]);
        if (!fs.existsSync(target)) references.push({filename: name, src: src[1]});
      }
      continue;
    }
    if (/\btype\s*=\s*["'](?:application\/json|importmap)["']/i.test(attributes)) continue;
    parse(match[2], name + ':inline-' + index, /\btype\s*=\s*["']module["']/i.test(attributes));
  }
}
const report = {schema: 'storyworld.r95.syntax-audit/v1', generatedAt: new Date().toISOString(),
  method: 'VM parser only, including ES modules and HTML inline scripts; local HTML script target existence.',
  counts, checks: [
    {name: 'Every delivered JS and inline script parses', passed: failures.length === 0, detail: failures},
    {name: 'Every local HTML script target exists', passed: references.length === 0, detail: references}
  ], browserVerified: false, GPUVerified: false};
report.passed = report.checks.every(c => c.passed);
fs.writeFileSync(path.join(__dirname, 'assets-syntax-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
process.exitCode = report.passed ? 0 : 1;
