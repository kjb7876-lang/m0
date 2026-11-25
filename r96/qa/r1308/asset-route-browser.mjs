// R1308 브라우저 통합 확인(로컬 전용, CI 에 넣지 않음): 공개판을 두 서버로 흉내 낸다.
//  A = GitHub Pages 흉내(site, 옮긴 폴더는 404) · B = Cloudflare 자산 프로젝트 흉내(옮긴 폴더만, CORS *).
//  index.html?cdn=http://127.0.0.1:B/ 로 띄워 옮긴 폴더의 소리·영상·포스터·json 이 B 에서 오고 A 에는 한 번도 안 가는지,
//  CDN 영상·그림을 캔버스·WebGL 에 그려도 오염(SecurityError)이 없는지, WebAudio 디코딩이 되는지 본다.
// 사용: node r96/qa/r1308/asset-route-browser.mjs   (먼저 python3 scripts/build-r96.py)
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),SITE=path.join(ROOT,'r96/hospital-three-pc/site');
const SRC=fs.readFileSync(path.join(ROOT,'r96/client-source/asset-route-r1308.js'),'utf8');
const ROUTED=JSON.parse(SRC.match(/const ROUTED=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.mp4':'video/mp4','.glb':'model/gltf-binary','.css':'text/css','.md':'text/markdown'};
const isR=p=>ROUTED.some(x=>p.startsWith(x));const logA=[],logB=[];
function serve(port,onlyRouted,log){return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/^\/+/,'')||'index.html';
 const routed=isR(p);log.push({p,routed});const hd={'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream','Accept-Ranges':'bytes'};
 if(onlyRouted)hd['Access-Control-Allow-Origin']='*';
 if((onlyRouted&&!routed)||(!onlyRouted&&routed)||p.includes('..')){r.writeHead(404,hd);return r.end('404');}
 const f=path.join(SITE,p);if(!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404,hd);return r.end('404');}
 const size=fs.statSync(f).size,rg=/bytes=(\d*)-(\d*)/.exec(q.headers.range||'');
 if(rg){const a=rg[1]?+rg[1]:0,b=rg[2]?+rg[2]:size-1;r.writeHead(206,{...hd,'Content-Range':`bytes ${a}-${b}/${size}`,'Content-Length':b-a+1});return fs.createReadStream(f,{start:a,end:b}).pipe(r);}
 r.writeHead(200,{...hd,'Content-Length':size});fs.createReadStream(f).pipe(r);});s.listen(port,'127.0.0.1',()=>res(s));});}
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?'  '+JSON.stringify(d).slice(0,300):''));};
const A=await serve(4431,false,logA),B=await serve(4432,true,logB);
const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});const errs=[];
page.on('pageerror',e=>errs.push(String(e.message||e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await page.goto('http://127.0.0.1:4431/index.html?cdn=http://127.0.0.1:4432/',{waitUntil:'load',timeout:120000});
await page.waitForFunction(()=>window.__STORYWORLD_ASSET_ROUTE__,null,{timeout:60000});
const st=await page.evaluate(()=>window.__STORYWORLD_ASSET_ROUTE__.inspect());
ok(st.on&&st.base==='http://127.0.0.1:4432/','경로 전환 켜짐',st);
await page.waitForTimeout(15000);
const r=await page.evaluate(async(ROUTED)=>{const out={};const T=(p,ms=20000)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms))]);
 try{const a=new Audio('assets/r308/bgm/beethoven-malinconia.ogg');await T(new Promise((res,rej)=>{a.oncanplay=res;a.onerror=()=>rej(new Error('audio error'));a.load();}));out.audio={ok:true,src:a.src,cors:a.crossOrigin};}catch(e){out.audio={ok:false,e:String(e)};}
 try{const b=await (await fetch('./assets/r955/sfx/atk-biomech-1.ogg')).arrayBuffer();const ac=new (window.AudioContext||window.webkitAudioContext)();const buf=await ac.decodeAudioData(b);out.webaudio={ok:buf.duration>0,dur:buf.duration};}catch(e){out.webaudio={ok:false,e:String(e)};}
 try{const a=new Audio('assets/r1056/bgm/gugak-hwando-climax.ogg');await T(new Promise((res,rej)=>{a.oncanplay=res;a.onerror=()=>rej(new Error('audio error'));a.load();}));const ac=new AudioContext();const s=ac.createMediaElementSource(a);s.connect(ac.destination);out.mediaSource={ok:true};}catch(e){out.mediaSource={ok:false,e:String(e)};}
 try{const v=document.createElement('video');v.muted=true;v.src='assets/r368/betrayal.mp4';v.poster='assets/r368/betrayal-poster.jpg';
  await T(new Promise((res,rej)=>{v.onloadeddata=res;v.onerror=()=>rej(new Error('video error '+(v.error&&v.error.code)));v.load();}));
  const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(v,0,0,32,32);x.getImageData(0,0,1,1);
  const g=document.createElement('canvas').getContext('webgl');let gl='no-webgl';if(g){const t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,v);gl=g.getError();}
  out.video={ok:true,src:v.src,poster:v.poster,gl};}catch(e){out.video={ok:false,e:String(e)};}
 try{const i=new Image();i.src='assets/r617/beach-poster.jpg';await T(i.decode());const c=document.createElement('canvas');c.width=8;c.height=8;const x=c.getContext('2d');x.drawImage(i,0,0,8,8);x.getImageData(0,0,1,1);out.img={ok:i.naturalWidth>0,src:i.src};}catch(e){out.img={ok:false,e:String(e)};}
 try{const j=await (await fetch('assets/r372/index.json')).json();out.json={ok:!!j};}catch(e){out.json={ok:false,e:String(e)};}
 try{const j=await new Promise((res,rej)=>{const x=new XMLHttpRequest();x.open('GET','assets/r369/index.json');x.onload=()=>res(x.status);x.onerror=rej;x.send();});out.xhr={ok:j===200};}catch(e){out.xhr={ok:false,e:String(e)};}
 out.inspect=window.__STORYWORLD_ASSET_ROUTE__.inspect();return out;},ROUTED);
for(const k of ['audio','webaudio','mediaSource','video','img','json','xhr'])ok(r[k]&&r[k].ok,k+' (옮긴 폴더에서 받아 씀)',r[k]);
ok(r.video&&r.video.gl===0,'CDN 영상을 WebGL 텍스처로 올려도 오류 없음',r.video&&r.video.gl);
ok(String(r.audio&&r.audio.src).startsWith('http://127.0.0.1:4432/')&&r.audio.cors==='anonymous','Audio 는 B 에서 crossOrigin 으로',r.audio);
const aRouted=logA.filter(x=>x.routed).map(x=>x.p),bRouted=logB.filter(x=>x.routed).map(x=>x.p);
ok(aRouted.length===0,'Pages 흉내(A)에는 옮긴 폴더 요청이 한 번도 안 감',aRouted.slice(0,8));
ok(bRouted.length>=7,'CDN 흉내(B)에서 옮긴 폴더를 받음',{count:bRouted.length,sample:[...new Set(bRouted)].slice(0,8)});
ok(logA.length>100,'게임 자체(코드·그림)는 A 에서 받음',logA.length);
const sec=errs.filter(e=>/SecurityError|tainted|CORS|cross-origin/i.test(e));ok(!sec.length,'CORS·오염 오류 없음',sec.slice(0,5));
// 대조: ?cdn=off 이면 옮긴 폴더를 A 에 묻는다(이 검사가 진짜로 경로를 본다는 증거).
logA.length=0;const p2=await browser.newPage();await p2.goto('http://127.0.0.1:4431/index.html?cdn=off',{waitUntil:'load',timeout:120000});
await p2.evaluate(()=>{const a=new Audio('assets/r308/bgm/beethoven-malinconia.ogg');a.load();return fetch('assets/r372/index.json').then(r=>r.status);});await p2.waitForTimeout(1500);
ok(logA.some(x=>x.routed),'대조(?cdn=off): 옮긴 폴더를 A 에 물음',logA.filter(x=>x.routed).map(x=>x.p).slice(0,3));
await browser.close();A.close();B.close();
console.log(`\nR1308 asset route browser: ${n-bad}/${n} PASS (headless Chromium, software GL; 실기기·실제 Cloudflare 미검증)`);process.exit(bad?1:0);
