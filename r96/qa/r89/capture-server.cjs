'use strict';
// R89 QA helper: loopback-only sink for canvas captures taken in the browser.
// Writes PNG/JSON evidence under qa/r89/evidence. Not part of the game build.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});
const port=Number(process.argv[2]||49330),origin='http://127.0.0.1:49328';
const safe=n=>/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(n)&&!n.includes('..');
http.createServer((req,res)=>{
 const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
 if(req.method==='OPTIONS'){res.writeHead(204,cors);res.end();return;}
 const u=new URL(req.url,'http://127.0.0.1'),name=u.searchParams.get('name')||'';
 // Read-only preview of overlay sources for in-browser iteration before apply.
 const src=/^\/(src|qa)\/([a-z0-9-]+\.js)$/i.exec(u.pathname);
 if(req.method==='GET'&&src){const file=src[1]==='qa'?path.join(__dirname,src[2]):path.join(__dirname,'../../client-source',src[2]);if(!fs.existsSync(file)){res.writeHead(404,cors);res.end();return;}
  res.writeHead(200,{...cors,'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(file));return;}
 if(req.method!=='POST'||u.pathname!=='/save'||!safe(name)){res.writeHead(400,cors);res.end('bad request');return;}
 const chunks=[];let size=0;
 req.on('data',c=>{size+=c.length;if(size>40*1024*1024){res.writeHead(413,cors);res.end();req.destroy();return;}chunks.push(c);});
 req.on('end',()=>{
  let body=Buffer.concat(chunks);const text=body.toString('latin1',0,40);
  if(text.startsWith('data:image/png;base64,'))body=Buffer.from(body.toString('latin1').slice(22),'base64');
  const file=path.join(out,name);fs.writeFileSync(file,body);
  console.log('saved',name,body.length);res.writeHead(200,{...cors,'Content-Type':'text/plain'});res.end('ok '+body.length);
 });
}).listen(port,'127.0.0.1',()=>console.log('capture sink on',port,'->',out));
