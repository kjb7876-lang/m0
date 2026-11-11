#!/usr/bin/env node
'use strict';
// Compare every supplied original file; never rewrite the baseline.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),baseline=path.resolve(process.argv[2]||'');
assert(process.argv[2]&&baseline!==root,'Pass the preserved five-part project directory');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function files(dir,prefix=''){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){assert(!e.isSymbolicLink(),'No symlinks accepted');const n=prefix+e.name;if(e.isDirectory())out.push(...files(path.join(dir,e.name),n+'/'));else if(e.isFile())out.push(n);}return out.sort();}
const original=files(baseline),changed=[],missing=[],assets=[];
for(const p of original){const current=path.join(root,p);if(!fs.existsSync(current)){missing.push(p);continue;}if(hash(current)!==hash(path.join(baseline,p)))changed.push(p);if(p.startsWith('hospital-three-pc/site/assets/'))assets.push(p);}
const core='hospital-three-pc/site/index.html';
const stripped=fs.readFileSync(path.join(root,core),'utf8').replace('\n<script src="./visual-r90.js"></script>\n<script src="./visual-r90-world.js"></script>','');
const checks=[
 {name:'Five-part original contains 4698 project files',passed:original.length===4698},
 {name:'No original file deleted',passed:missing.length===0},
 {name:'Only original index tags and web manifest modified',passed:changed.every(p=>[core,'hospital-three-pc/site/web-manifest-r62.json'].includes(p))},
 {name:'Native index bytes equal after removing two R90 tags',passed:stripped===fs.readFileSync(path.join(baseline,core),'utf8')},
 {name:'Every original runtime asset byte preserved',passed:assets.every(p=>!changed.includes(p)&&!missing.includes(p))},
 {name:'Both canonical overlays match applied site bytes',passed:['visual-r90.js','visual-r90-world.js'].every(p=>hash(path.join(root,'client-source',p))===hash(path.join(root,'hospital-three-pc/site',p)))}
];
const m=JSON.parse(fs.readFileSync(path.join(root,'hospital-three-pc/site/web-manifest-r62.json'))),bad=m.files.filter(row=>{const p=path.join(root,'hospital-three-pc/site',row.path);return !fs.existsSync(p)||fs.statSync(p).size!==row.bytes||hash(p)!==row.sha256;}).map(r=>r.path);
checks.push({name:'Every runtime manifest size and SHA256 matches actual disk',passed:bad.length===0&&m.fileCount===m.files.length});
const result={schema:'storyworld.r90.source-audit/v1',method:'Byte comparison against newly verified five-part original; no browser/GPU inference',originalFiles:original.length,originalAssetFiles:assets.length,changedOriginalFiles:changed,missingOriginalFiles:missing,manifestRows:m.files.length,invalidManifestRows:bad,checks,passed:checks.every(c=>c.passed)};
fs.writeFileSync(path.join(__dirname,'source-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
