'use strict';
// Starts/stops the original loopback server. This is not a browser test.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),http=require('http');
const {spawn}=require('child_process');
const site=path.resolve(__dirname,'../hospital-three-pc/site');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const get=(name,headers={})=>new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port:49328,path:'/'+name,headers},res=>{const parts=[];res.on('data',b=>parts.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(parts)}));});req.setTimeout(5000,()=>req.destroy(Error('HTTP timeout')));req.on('error',reject);});
(async()=>{
 const checks=[],check=(name,passed,details)=>checks.push({name,passed:!!passed,details});
 const manifest=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json')));
 const mismatches=manifest.files.filter(r=>{const b=fs.readFileSync(path.join(site,r.path));return b.length!==r.bytes||hash(b)!==r.sha256;});
 check('Manifest byte sizes and SHA256 match every listed game file',manifest.fileCount===manifest.files.length&&!mismatches.length,{files:manifest.fileCount,mismatches});
 const html=fs.readFileSync(path.join(site,'index.html'),'utf8');let count=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/application\/json/.test(m[1]))continue;
  const src=m[1].match(/\bsrc=["']([^"']+)["']/)?.[1];
  const code=src?fs.readFileSync(path.join(site,src.split('?')[0]),'utf8'):m[2];new vm.Script(code,{filename:src||'inline-'+count});count++;
 }
 check('All executable HTML script tags parse',true,{scripts:count});
 const runtimeTags=['hospital-improvements-a5.js','world-visual-r78.js','world-combat-v4-compat.js','world-combat-r78.js','ego-restore-health-r79.js','world-assets-r80-data.js','world-assets-r80.js','world-environment-r81.js','world-presentation-r81.js'].map(name=>({name,count:html.split(`<script src="./${name}"></script>`).length-1+html.split(`<script src="${name}"></script>`).length-1}));
 check('All V5 integration runtimes load once in compatibility order',runtimeTags.every(row=>row.count===1)&&html.indexOf('src="./world-combat-v4-compat.js"')<html.indexOf('src="world-combat-r78.js"'),runtimeTags);
 const server=spawn(process.execPath,[path.resolve(site,'../LOCAL-SERVER.cjs'),'--no-open'],{stdio:['ignore','pipe','pipe']});
 try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server start timeout')),5000);server.stdout.on('data',b=>{if(String(b).includes('Open:')){clearTimeout(timer);resolve();}});server.stderr.on('data',b=>{clearTimeout(timer);reject(Error(String(b)));});server.on('error',e=>{clearTimeout(timer);reject(e);});});
 const scriptPaths=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0].replace(/^\.\//,''));
 const paths=[...new Set(['index.html',...scriptPaths,...manifest.files.filter(r=>(r.path.startsWith('assets/hospital-maze/')||r.path.startsWith('assets/world-r80/')||r.path.startsWith('assets/vfx-r83/')||r.path.startsWith('assets/refined-r85/')||r.path.startsWith('assets/painted-vfx-r87/')||r.path.startsWith('assets/final42-r88/'))).map(r=>r.path)])];
 const responses=await Promise.all(paths.map(async p=>{const r=await get(p),b=fs.readFileSync(path.join(site,p));return{path:p,status:r.status,bytes:r.body.length,sha256Matches:hash(r.body)===hash(b)};}));
 check('Local HTTP delivers current page, runtime, and all selected assets exactly',responses.every(r=>r.status===200&&r.sha256Matches),responses);
 const audio=manifest.files.find(r=>/\.(mp3|ogg|wav)$/.test(r.path)&&r.bytes>64),r=await get(audio.path,{Range:'bytes=0-63'});
 check('Preserved audio supports HTTP byte range delivery',r.status===206&&r.body.equals(fs.readFileSync(path.join(site,audio.path)).subarray(0,64)),{path:audio.path,status:r.status,contentRange:r.headers['content-range']});
 }finally{server.kill('SIGINT');}
 const result={method:'Node syntax, complete manifest SHA256 verification, actual loopback HTTP. No browser/GPU/audio playback or natural input.',checks,passed:checks.every(c=>c.passed),browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
 fs.writeFileSync(path.join(__dirname,'package-results.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,total:checks.length}));if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
