// R1308 2단계 지역 순회(로컬 전용): 공개판 흉내(A=Pages, 옮긴 폴더 404 · B=CDN, 옮긴 폴더만 CORS)로 모든 지역(STORY·DREAM)을 돌며
//  옮긴 폴더 요청이 A 로 새는 일이 0건인지, B 에서 404 가 0건인지, CORS·오염 오류가 0건인지 센다.
//  SHOTS=1 이면 앞 6개 지역을 로컬(같은 서버)·CDN 두 방식으로 찍어 r96/qa/r1308/shots/ 에 남긴다(전후 비교).
// 사용: node r96/qa/r1308/asset-route-census.mjs  (먼저 python3 scripts/build-r96.py)
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../../..'),SITE=path.join(ROOT,'r96/hospital-three-pc/site');
const SRC=fs.readFileSync(path.join(ROOT,'r96/client-source/asset-route-r1308.js'),'utf8');
const ROUTED=JSON.parse(SRC.match(/const ROUTED=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.mp4':'video/mp4','.glb':'model/gltf-binary','.css':'text/css'};
const isR=p=>ROUTED.some(x=>p.startsWith(x));
function serve(port,mode,log){return new Promise(res=>{const s=http.createServer((q,r)=>{let p;try{p=decodeURIComponent(new URL(q.url,'http://x').pathname).replace(/^\/+/,'')||'index.html';}catch(_){r.writeHead(400);return r.end();}
 const routed=isR(p),hd={'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'};if(mode==='cdn')hd['Access-Control-Allow-Origin']='*';
 const deny=(mode==='cdn'&&!routed)||(mode==='pages'&&routed)||p.includes('..');const f=path.join(SITE,p);
 const exists=!deny&&fs.existsSync(f)&&fs.statSync(f).isFile();log.push({p,routed,status:exists?200:404});
 if(!exists){r.writeHead(404,hd);return r.end('404');}r.writeHead(200,{...hd,'Content-Length':fs.statSync(f).size});fs.createReadStream(f).pipe(r);});s.listen(port,'127.0.0.1',()=>res(s));});}
const logA=[],logB=[],logL=[];const A=await serve(4441,'pages',logA),B=await serve(4442,'cdn',logB),L=await serve(4443,'all',logL);
const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function open(url){const ctx=await browser.newContext({viewport:{width:960,height:540}});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e.message||e)));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text());});
 await p.goto(url,{timeout:180000});
 await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});
 await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});
 return {ctx,p};}
async function go(p,id,layer){await p.evaluate(async([id,layer])=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);await window.__STORYWORLD_CHEAT777__.go(id,layer);
  const P=window.__STORYWORLD_PROGRESSION_R71__;if(P&&P.difficultyState().open){P.selectDifficulty('normal');await P.confirmDifficulty();}},[id,layer]);
 await p.waitForFunction(id=>zone===id&&!loading,id,{timeout:120000});await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);guide=false;auto=false;});await p.waitForTimeout(2500);}
const {ctx,p}=await open('http://127.0.0.1:4441/index.html?cdn=http://127.0.0.1:4442/');
const regions=await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.inspect().regions);const visited=[],failed=[];
const shots=process.env.SHOTS==='1';const SH=path.join(HERE,'shots');if(shots)fs.mkdirSync(SH,{recursive:true});
for(const layer of ['STORY','DREAM'])for(const id of regions){try{await go(p,id,layer);visited.push(layer+':'+id);
  if(shots&&layer==='STORY'&&visited.length<=6)await p.screenshot({path:path.join(SH,`cdn-${id}.png`)});}catch(e){failed.push(layer+':'+id+' '+String(e.message||e).slice(0,80));}}
const st=await p.evaluate(()=>window.__STORYWORLD_ASSET_ROUTE__.inspect());
if(shots){const {ctx:c2,p:p2}=await open('http://127.0.0.1:4443/index.html');for(const v of visited.slice(0,6)){const id=v.split(':')[1];try{await go(p2,id,'STORY');await p2.screenshot({path:path.join(SH,`local-${id}.png`)});}catch(_){}}await c2.close();}
const leak=[...new Set(logA.filter(x=>x.routed).map(x=>x.p))],miss=[...new Set(logB.filter(x=>x.status!==200).map(x=>x.p))];
const sec=p.errs.filter(e=>/SecurityError|tainted|cross-origin|CORS/i.test(e));
const out={regions:regions.length,visited:visited.length,failed,route:st,routedFromCdn:new Set(logB.filter(x=>x.status===200).map(x=>x.p)).size,leakToPages:leak.length,leakSample:leak.slice(0,20),cdnMisses:miss.slice(0,20),securityErrors:sec.slice(0,10),pagesRequests:logA.length,pages404:[...new Set(logA.filter(x=>x.status!==200&&!x.routed).map(x=>x.p))].slice(0,10)};
fs.writeFileSync(path.join(HERE,'census-results.json'),JSON.stringify(out,null,1)+'\n');console.log(JSON.stringify(out,null,1));
await browser.close();A.close();B.close();L.close();
const pass=leak.length===0&&miss.length===0&&sec.length===0&&visited.length>=regions.length&&out.routedFromCdn>50;
console.log(pass?'R1308 census PASS':'R1308 census FAIL','(headless Chromium; 실기기·실제 Cloudflare 미검증)');process.exit(pass?0:1);
