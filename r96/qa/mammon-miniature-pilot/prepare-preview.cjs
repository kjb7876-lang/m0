'use strict';
// Copy + inject into an entirely NEW local directory. No build/registry edit.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..'),args=process.argv.slice(2);
function value(k){const i=args.indexOf(k);return i>=0?args[i+1]:null;}
const src=value('--site'),dest=value('--out');
if(!src||!dest){console.error('Usage: node r96/qa/mammon-miniature-pilot/prepare-preview.cjs --site <built-site> --out <new-local-directory>');process.exit(2);}
const site=fs.realpathSync(path.resolve(src)),out=path.resolve(dest),source=path.join(repo,'r96/client-source/mammon-miniature-pilot.js');
const os=require('os');const allowed=[os.tmpdir(),process.env.RUNNER_TEMP,'/workspace'].filter(Boolean).map(p=>path.resolve(p)+path.sep);if(!allowed.some(p=>out.startsWith(p)))throw Error('Preview must be in a scratch directory');
if(out===site||out.startsWith(site+path.sep)||fs.existsSync(out))throw Error('Destination must be a new directory outside the source site');
const protectedDirs=['r96/runtime-text','r96/client-source','r96/hospital-three-pc','docs'].map(p=>path.join(repo,p));
if(protectedDirs.some(p=>out===p||out.startsWith(p+path.sep)))throw Error('Use a separate local preview directory, not a product directory');
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');if(!html.includes('</body>'))throw Error('Source site has no body terminator');
if(html.includes('seven-sins-art.js'))throw Error('Refuse broad seven-map candidate; use clean native product');
if(html.includes('mammon-miniature-pilot.js'))throw Error('Source site already contains this candidate');
fs.cpSync(site,out,{recursive:true,errorOnExist:true,force:false});
const assets=path.join(repo,'r96/runtime-text/assets/mammon-v3'),assetDest=path.join(out,'assets/mammon-v3');
if(fs.existsSync(assetDest))throw Error('Base site already has Mammon V3 assets');
fs.mkdirSync(assetDest,{recursive:true});const index=JSON.parse(fs.readFileSync(path.join(assets,'index.json'),'utf8'));
for(const a of index.assets.filter(a=>a.status==='isolated-preview-only')){
 if(path.basename(a.file)!==a.file)throw Error('Unsafe asset path');const bytes=fs.readFileSync(path.join(assets,a.file));
 if(bytes.length!==a.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Asset mismatch '+a.id);
 fs.writeFileSync(path.join(assetDest,a.file),bytes,{flag:'wx'});
}
fs.copyFileSync(source,path.join(out,'mammon-miniature-pilot.js'));
const injected=html.replace('</body>','<!-- MAMMON EP1B06 LOCAL PREVIEW ONLY: unregistered art candidate; do not publish this copy. -->\n<script src="./mammon-miniature-pilot.js"></script>\n</body>');
fs.writeFileSync(path.join(out,'index.html'),injected);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const revision=fs.readFileSync(source,'utf8').match(/const REV='([^']+)'/)?.[1]||'unknown';
const evidence={revision,activeAssets:index.assets.filter(a=>a.status==='isolated-preview-only').map(a=>a.id),localOnly:true,sourceSite:site,output:out,overlaySHA256:sha(source),sourceIndexSHA256:crypto.createHash('sha256').update(html).digest('hex'),injectedIndexSHA256:sha(path.join(out,'index.html')),registered:false,browserLaunched:false};
fs.writeFileSync(path.join(out,'mammon-pilot-local-preview.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
