'use strict';
// Portable Windows Node restoration only. Mirrors RESTORE-HANDOFF.cmd's
// per-part and final SHA256 contract; does not execute the restored binary.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'RESTORE-MANIFEST.json'),'utf8').replace(/^\uFEFF/,''));
const prefix='hospital-refinement-v12/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const local=p=>{if(!p.startsWith(prefix))throw Error('Unexpected manifest prefix');const q=path.resolve(root,p.slice(prefix.length));if(!q.startsWith(root+path.sep))throw Error('Path escaped root');return q;};
const target=local(manifest.nodeTarget),expected=manifest.files[manifest.nodeTarget];
const rows=manifest.nodeParts.map(row=>{const bytes=fs.readFileSync(local(row.path)),actual=sha(bytes);if(actual!==row.sha256||bytes.length!==row.bytes)throw Error('Node part mismatch: '+row.path);return{...row,actualSHA256:actual,data:bytes};});
const restored=Buffer.concat(rows.map(row=>row.data));
if(sha(restored)!==expected.sha256||restored.length!==expected.bytes)throw Error('Restored Node SHA256 or size mismatch');
if(fs.existsSync(target)){if(sha(fs.readFileSync(target))!==expected.sha256)throw Error('Refusing to overwrite different Node bytes');}
else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,restored,{flag:'wx'});}
const report={method:'RESTORE-HANDOFF.cmd-equivalent byte restoration from this five-part handoff, no Windows binary execution',target:path.relative(root,target).split(path.sep).join('/'),bytes:restored.length,sha256:sha(restored),parts:rows.map(({data,...row})=>row),matched:true,executed:false,includeInChangeZIP:false};
fs.writeFileSync(path.join(__dirname,'cpu-restore-node.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
