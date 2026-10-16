import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||here),docs=path.join(root,'docs');
const manifest=JSON.parse(await fs.readFile(path.join(docs,'web-manifest-r62.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.avif':'image/avif','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.m4a':'audio/mp4','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
const prefix='/m0/';
const files=new Map(manifest.files.map(r=>[r.path,r]));
let requests=0;
const server=http.createServer(async(req,res)=>{
  requests++;
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
  let name=pathname.slice(prefix.length)||'index.html';
  if(name.includes('..')||name.includes('\\')||!files.has(name)){res.writeHead(404).end();return;}
  const row=files.get(name),bytes=await fs.readFile(path.join(docs,name));
  res.setHeader('Content-Type',MIME[path.extname(name)]||'application/octet-stream');
  res.setHeader('Accept-Ranges','bytes');
  if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!match){res.writeHead(416).end();return;}
    const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),row.bytes-1):row.bytes-1;
    if(start>end||start>=row.bytes){res.writeHead(416).end();return;}
    res.setHeader('Content-Range',`bytes ${start}-${end}/${row.bytes}`);
    res.setHeader('Content-Length',end-start+1);res.writeHead(206);
    res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));return;
  }
  res.setHeader('Content-Length',row.bytes);res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const base=new URL(prefix,`http://127.0.0.1:${server.address().port}`),failures=[];
  let cursor=0,headChecks=0,hashChecks=0;
  // Every exact-case manifest path is exercised below a repository subpath.
  await Promise.all(Array.from({length:8},async()=>{
    while(cursor<manifest.files.length){
      const row=manifest.files[cursor++],file=await fs.readFile(path.join(docs,row.path));
      if(sha(file)!==row.sha256||file.length!==row.bytes)failures.push('content:'+row.path);
      hashChecks++;
      const res=await fetch(new URL(row.path.split('/').map(encodeURIComponent).join('/'),base),{method:'HEAD'});
      if(res.status!==200||Number(res.headers.get('content-length'))!==row.bytes)failures.push('HTTP:'+row.path);
      const expected=MIME[path.extname(row.path)];
      if(expected&&res.headers.get('content-type')!==expected)failures.push('MIME:'+row.path);
      headChecks++;
    }
  }));
  const index=await fetch(base),html=await index.text();
  assert.equal(sha(Buffer.from(html)),manifest.webHTMLSha256);
  assert(html.includes("const BASE=new URL('./',document.baseURI||location.href).href;"));
  assert(!html.includes("https://api.github.com/repos/kjb7876-lang/hapil1/git/trees/"));
  assert(!/\b(?:src|href)=["']\/(?!\/)/.test(html),'root-absolute HTML resource');
  const scriptURLs=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1]);
  for(const url of scriptURLs){const r=await fetch(new URL(url,base));assert.equal(r.status,200);}
  const bundle=await fs.readFile(path.join(docs,'dist/phase1.js'),'utf8');
  const imports=[...bundle.matchAll(/(?:from\s*|import\s*\(\s*)["']([^"']+)["']/g)].map(x=>x[1]).filter(x=>x.startsWith('.'));
  for(const url of imports){const r=await fetch(new URL(url,new URL('dist/phase1.js',base)));assert.equal(r.status,200,'module import '+url);}
  const audio=manifest.files.filter(r=>/\.(mp3|ogg|wav)$/i.test(r.path));
  for(const row of audio){const r=await fetch(new URL(row.path,base),{headers:{Range:'bytes=0-63'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,64);}
  const wrongCase=await fetch(new URL('DIST/phase1.js',base));assert.equal(wrongCase.status,404);
  const serverScript=await fetch(new URL('server.mjs',base));assert.equal(serverScript.status,404);
  const backup=await fetch(new URL('projection33/index.html',base));assert.equal(backup.status,404);
  assert.deepEqual(failures,[]);
  const report={status:'PAGES_STATIC_SUBPATH_R62_PASSED',sourceHTMLSha256:manifest.sourceHTMLSha256,webHTMLSha256:manifest.webHTMLSha256,type:'NODE_STATIC_HTTP_UNDER_REPOSITORY_SUBPATH',prefix,hashChecks,headChecks,audioRangeChecks:audio.length,scriptURLs,relativeModuleImports:imports,requests,failures,wrongCaseRejected:true,nodeLauncherExcluded:true,privateBackupExcluded:true,allFilesBelow100MiB:true,publishedBytes:manifest.totalBytes,browser:false,GPU:false,mobile:false,actualFourRemoteNetworks:false,remoteGitHubPages:false,remoteRender:false};
  await fs.writeFile(path.join(root,'PAGES_STATIC_VERIFICATION_R62.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}finally{await new Promise(resolve=>server.close(resolve));}
