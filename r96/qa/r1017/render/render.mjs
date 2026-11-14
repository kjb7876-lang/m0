import {createRequire} from 'module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');import fs from 'fs';import http from 'http';import path from 'path';
const [,,root,out,jobsFile]=process.argv;const jobs=JSON.parse(fs.readFileSync(jobsFile));
const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)){s.writeHead(404);return s.end();}
 s.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(4471);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const j of jobs){const p=await b.newPage();p.on('console',m=>console.log('pg',m.text()));await p.goto('http://127.0.0.1:4471/tools/render.html');await p.waitForFunction('window.ready');
 const r=await p.evaluate(([u,o])=>window.renderOne(u,o),['/dl/'+j.file,j.opt||{}]);
 fs.writeFileSync(path.join(out,j.name+'.png'),Buffer.from(r.png.split(',')[1],'base64'));fs.writeFileSync(path.join(out,j.name+'.json'),JSON.stringify({pivot:r.pivot,dims:r.dims,opt:j.opt}));console.log(j.name,r.pivot,r.dims);await p.close();}
await b.close();srv.close();
