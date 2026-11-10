#!/usr/bin/env node
'use strict';
// Filesystem fixtures only: this is not a browser or the actual full runtime.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const {apply, patchHTML, NAMES, digest} = require('../../scripts/apply-r90.cjs');
const {changedFiles} = require('../../scripts/r90-changed-files.cjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'storyworld-r90-apply-'));
const checks = [];
const tag = name => `<script src="./${name}"></script>`;
const original = '<!doctype html>\n<script>const nativeDamage=7;</script>\n' + tag('world-retro-r89.js') + '\n' + tag('vfx-retro-r89.js') + '\n';
function check(name, fn) {try {fn(); checks.push({name, passed:true});} catch(error) {checks.push({name, passed:false, error:String(error.stack || error)});}}
function fixture(name) {
  const root = path.join(temp, name), site = path.join(root, 'hospital-three-pc', 'site');
  fs.mkdirSync(site, {recursive:true}); fs.mkdirSync(path.join(root, 'client-source'));
  fs.writeFileSync(path.join(site, 'index.html'), original);
  for (const file of ['world-retro-r89.js','vfx-retro-r89.js']) fs.writeFileSync(path.join(site,file),'(()=>{})();\n');
  for (const file of NAMES) fs.writeFileSync(path.join(root,'client-source',file),`(()=>{ const fixture = ${JSON.stringify(file)}; })();\n`);
  fs.mkdirSync(path.join(site,'assets'));fs.writeFileSync(path.join(site,'assets','existing.bin'), Buffer.from([0,1,12,255]));
  const files=['index.html','world-retro-r89.js','vfx-retro-r89.js','assets/existing.bin'].map(p=>{const b=fs.readFileSync(path.join(site,p));return {path:p,bytes:b.length,sha256:digest(b)};});
  fs.writeFileSync(path.join(site,'web-manifest-r62.json'), JSON.stringify({schema:'fixture',files,r89:{preserved:true}}));
  return {root,site};
}
function snapshots(site) {return Object.fromEntries(fs.readdirSync(site).filter(n=>fs.statSync(path.join(site,n)).isFile()).map(n=>[n,digest(fs.readFileSync(path.join(site,n)))]));}
try {
  check('Two tags are inserted directly after R89 without changing any native HTML bytes',()=>{
    const out=patchHTML(original),extra='\n'+NAMES.map(tag).join('\n');
    assert.equal(out.replace(extra,''),original);assert.ok(out.includes(tag('vfx-retro-r89.js')+extra));
  });
  check('Canonical repeated application is byte-idempotent',()=>{
    const f=fixture('repeat');apply({root:f.root});const first=snapshots(f.site);const report=fs.readFileSync(path.join(f.root,'qa/r90/integration.json'));
    apply({root:f.root});assert.deepEqual(snapshots(f.site),first);assert.deepEqual(fs.readFileSync(path.join(f.root,'qa/r90/integration.json')),report);
  });
  check('Complete manifest hashes actual file bytes, preserves R89 metadata and excludes itself',()=>{
    const f=fixture('manifest'),r=apply({root:f.root}),m=JSON.parse(fs.readFileSync(path.join(f.site,'web-manifest-r62.json')));
    assert.equal(m.fileCount,6);assert.deepEqual(m.r89,{preserved:true});assert.equal(m.r90.presentationPrefsOutsideSlots,true);
    for(const row of m.files){const bytes=fs.readFileSync(path.join(f.site,row.path));assert.equal(row.bytes,bytes.length);assert.equal(row.sha256,digest(bytes));}
    assert.equal(r.manifestSha256,digest(fs.readFileSync(path.join(f.site,'web-manifest-r62.json'))));
    assert.ok(!m.files.some(row=>row.path==='web-manifest-r62.json'));
  });
  check('Canonical overlay source is copied byte-for-byte',()=>{
    const f=fixture('source');apply({root:f.root});for(const name of NAMES)assert.deepEqual(fs.readFileSync(path.join(f.root,'client-source',name)),fs.readFileSync(path.join(f.site,name)));
  });
  check('Missing, duplicate and reversed R89 tags are rejected',()=>{
    assert.throws(()=>patchHTML(original.replace(tag('world-retro-r89.js'),'')));
    assert.throws(()=>patchHTML(original+tag('vfx-retro-r89.js')));
    assert.throws(()=>patchHTML(tag('vfx-retro-r89.js')+'\n'+tag('world-retro-r89.js')));
  });
  check('Partial, duplicated, relocated and noncanonical R90 tags are rejected',()=>{
    assert.throws(()=>patchHTML(original+tag(NAMES[0])));
    assert.throws(()=>patchHTML(patchHTML(original)+tag(NAMES[0])));
    assert.throws(()=>patchHTML(NAMES.map(tag).join('\n')+original));
    assert.throws(()=>patchHTML(original+`<script src='${NAMES[0]}'></script>`+tag(NAMES[1])));
  });
  check('Missing asset aborts before any site file changes',()=>{
    const f=fixture('missing');fs.rmSync(path.join(f.site,'assets/existing.bin'));const before=snapshots(f.site);
    assert.throws(()=>apply({root:f.root}),/ENOENT/);assert.deepEqual(snapshots(f.site),before);assert.ok(!fs.existsSync(path.join(f.root,'qa/r90/integration.json')));
  });
  check('Overlay syntax error aborts before writes',()=>{
    const f=fixture('syntax');fs.writeFileSync(path.join(f.root,'client-source',NAMES[0]),'function {');const before=snapshots(f.site);
    assert.throws(()=>apply({root:f.root}),SyntaxError);assert.deepEqual(snapshots(f.site),before);
  });
  check('Unsafe and duplicate manifest paths are rejected without writes',()=>{
    for(const [label,entry] of [['unsafe',{path:'../outside'}],['duplicate',{path:'index.html'}]]){
      const f=fixture(label),p=path.join(f.site,'web-manifest-r62.json'),m=JSON.parse(fs.readFileSync(p));m.files.push(entry);fs.writeFileSync(p,JSON.stringify(m));const before=snapshots(f.site);
      assert.throws(()=>apply({root:f.root}));assert.deepEqual(snapshots(f.site),before);
    }
  });
  check('Changed-files includes only added and modified source/runtime evidence with valid SHA256',()=>{
    const f=fixture('comparison'),baseline=path.join(temp,'comparison-original');fs.cpSync(f.root,baseline,{recursive:true});apply({root:f.root});
    const list=changedFiles(baseline,f.root);assert.equal(list.deletedOriginalFiles,0);assert.ok(list.files.some(row=>row.path==='hospital-three-pc/site/index.html'));
    assert.ok(list.files.some(row=>row.path==='hospital-three-pc/site/web-manifest-r62.json'));
    assert.ok(!list.files.some(row=>row.path.includes('existing.bin')));
    for(const row of list.files)assert.equal(row.sha256,digest(fs.readFileSync(path.join(f.root,row.path))));
    assert.deepEqual(changedFiles(baseline,f.root).files,list.files);
  });
  check('Changed-files refuses deletion of an original file',()=>{
    const f=fixture('deletion'),baseline=path.join(temp,'deletion-original');fs.cpSync(f.root,baseline,{recursive:true});fs.rmSync(path.join(f.site,'assets/existing.bin'));assert.throws(()=>changedFiles(baseline,f.root),/Original files are missing/);
  });
} finally {fs.rmSync(temp,{recursive:true,force:true});}
const report={schema:'storyworld.r90.apply-check/v1',method:'Node filesystem fixtures, not the full game, headless browser or GPU',fixtureAssistance:true,passed:checks.every(x=>x.passed),passedChecks:checks.filter(x=>x.passed).length,totalChecks:checks.length,checks};
fs.writeFileSync(path.join(__dirname,'apply-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
