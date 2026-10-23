'use strict';
// Portable, read-only loopback server. No packages, installation, credentials,
// elevated privileges, external requests or changes to security settings.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process');
const args=process.argv.slice(2);let root=__dirname,port=49328,open=true,checkOnly=false;
for(let i=0;i<args.length;i++){
 if(args[i]==='--root')root=path.resolve(args[++i]);
 else if(args[i]==='--port')port=Number(args[++i]);
 else if(args[i]==='--no-open')open=false;
 else if(args[i]==='--check-only')checkOnly=true;
 else throw Error('Unknown option: '+args[i]);
}
if(!Number.isSafeInteger(port)||port<1||port>65535)throw Error('Invalid port');
const site=path.resolve(root,'site');
function within(name){return name===site||name.startsWith(site+path.sep);}
function checkPackage(){
 for(const name of ['PART-1.txt','PART-2.txt'])if(!fs.existsSync(path.join(root,name)))throw Error('Extract ALL PC build ZIP parts into the SAME folder. Missing '+name);
 const m=JSON.parse(fs.readFileSync(path.join(site,'web-manifest-r62.json'),'utf8')),seen=new Set();
 if(!m.fileCount||m.fileCount!==m.files?.length)throw Error('Incomplete game manifest');
 for(const row of m.files){
  if(typeof row.path!=='string'||row.path.includes('\\')||row.path.split('/').some(p=>p===''||p==='.'||p==='..')||seen.has(row.path))throw Error('Invalid game path');
  const name=path.resolve(site,row.path);if(!within(name))throw Error('Game path leaves site');seen.add(row.path);
  let stat;try{stat=fs.statSync(name);}catch{}
  if(!stat?.isFile()||stat.size!==row.bytes)throw Error('Missing/incomplete game file: '+row.path+'; extract ALL PC build ZIP parts to the same folder.');
 }
 return m.files.length;
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.gif':'image/gif','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2','.woff':'font/woff','.wasm':'application/wasm'};
async function serve(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 let decoded;try{decoded=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
 if(decoded.includes('\0')||decoded.includes('\\')){res.writeHead(400);res.end();return;}
 const name=path.resolve(site,'.'+(decoded==='/'?'/index.html':decoded));
 if(!within(name)){res.writeHead(403);res.end();return;}
 let st;try{st=await fs.promises.stat(name);}catch{res.writeHead(404);res.end();return;}
 if(!st.isFile()){res.writeHead(404);res.end();return;}
 let start=0,end=st.size-1,status=200;
 if(req.headers.range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':'bytes */'+st.size});res.end();return;}
  if(!m[1]){const count=Number(m[2]);start=Math.max(0,st.size-count);}
  else{start=Number(m[1]);if(m[2])end=Math.min(st.size-1,Number(m[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=st.size||end<start){res.writeHead(416,{'Content-Range':'bytes */'+st.size});res.end();return;}
  status=206;
 }
 const headers={'Content-Type':mime[path.extname(name).toLowerCase()]||'application/octet-stream','Content-Length':Math.max(0,end-start+1),'Accept-Ranges':'bytes','Cache-Control':'no-store'};
 if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${st.size}`;
 res.writeHead(status,headers);
 if(req.method==='HEAD'||st.size===0){res.end();return;}
 const stream=fs.createReadStream(name,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
try{
 const files=checkPackage();
 if(checkOnly){console.log(JSON.stringify({complete:true,files}));}
 else{
  const server=http.createServer((req,res)=>serve(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();}));
  server.requestTimeout=30000;server.headersTimeout=10000;
  server.on('error',error=>{console.error('Cannot start local test:',error.message,'Close the previous test server and try again.');process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>{
   const url='http://127.0.0.1:'+port+'/';
   console.log('StoryWorld Hospital PC Three candidate - NOT visually verified');console.log('Open: '+url);console.log('Keep this window open. Ctrl+C stops the server.');
   if(open){
    const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
    const a=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
    const child=spawn(command,a,{stdio:'ignore',detached:true,windowsHide:true});child.on('error',()=>console.log('Open the address above manually.'));child.unref();
   }
  });
  process.once('SIGINT',()=>server.close(()=>process.exit(0)));
 }
}catch(error){console.error('Cannot start hospital test:',error.message);process.exitCode=1;}
