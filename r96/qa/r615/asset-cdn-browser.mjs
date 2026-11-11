// R615 headless check (Playwright): 실제 브라우저에서 외부 기준 주소(Cloudflare Pages 에셋 프로젝트)로 서사 음성을 받고,
//  외부가 없거나 실패하면 GitHub Pages(같은 사이트)에서 받는지. 외부 주소는 page.route 로 흉내 낸다(cdn-pack.py 결과 폴더를 그대로 응답, CORS 머리말 포함).
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ CDN_DIR=/tmp/r615-cdn OUT=out/r615 node r96/qa/r615/asset-cdn-browser.mjs
// 헤드리스: 소리 장치 없이 받기·재생 이벤트(onplaying/onended)만 본다. 실제 청취·실기기·Cloudflare 실서버는 별도 항목.
import fs from 'fs';import path from 'path';import {createRequire} from 'module';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',CDN_DIR=process.env.CDN_DIR,OUT=process.env.OUT||'out/r615';fs.mkdirSync(OUT,{recursive:true});
const CFG=JSON.parse(fs.readFileSync(new globalThis.URL('../../asset-cdn.json',import.meta.url),'utf8'));
let n=0,bad=0;const rows=[];const ok=(c,m,d)=>{n++;rows.push({ok:!!c,m,d});if(!c){bad++;console.log('FAIL',m,JSON.stringify(d??''));}else console.log('PASS',m);};
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
async function run(name,mode){const ctx=await b.newContext({viewport:{width:960,height:540}});const p=await ctx.newPage();const reqs=[];
 p.on('request',r=>{const u=r.url();if(/cdn-health\.json|r381\/voice\//.test(u))reqs.push(u);});
 await p.route(CFG.base+'**',async r=>{const rel=r.request().url().slice(CFG.base.length).split('?')[0];
  if(mode==='down')return r.abort('connectionrefused');
  if(mode==='mp3fail'&&rel.endsWith('.mp3'))return r.fulfill({status:503,body:'busy',headers:{'access-control-allow-origin':'*'}});
  const f=path.join(CDN_DIR,rel);if(!rel||!fs.existsSync(f))return r.fulfill({status:404,body:'nf'});
  return r.fulfill({status:200,body:fs.readFileSync(f),headers:{'access-control-allow-origin':'*','content-type':rel.endsWith('.json')?'application/json':'audio/mpeg'}});});
 await p.goto(URL+(mode==='off'?'?cdn=off':''));
 await p.waitForFunction(()=>window.__STORYWORLD_ASSET_CDN__&&window.__STORYWORLD_VOICE_R381__,null,{timeout:120000});
 await p.waitForFunction(()=>window.__STORYWORLD_ASSET_CDN__.inspect().state!=='pending',null,{timeout:15000});
 const st=await p.evaluate(()=>window.__STORYWORLD_ASSET_CDN__.inspect());
 const res=await p.evaluate(()=>new Promise(res=>{const V=window.__STORYWORLD_VOICE_R381__,t=V.sample;const ev=[];const h=V.play(t,{rate:1.2,volume:0,onstart:()=>ev.push('start'),onend:()=>{ev.push('end');res({ev,src:h&&h.id})},onerror:()=>{ev.push('error');res({ev})}});
  setTimeout(()=>res({ev,timeout:true}),30000);}));
 const shot=path.join(OUT,`r615-${name}.png`);await p.screenshot({path:shot});await ctx.close();return {st,res,reqs};}
const ON=await run('on','ok');
ok(ON.st.state==='on'&&ON.st.prefixes.includes('assets/r381/voice/'),'외부 health 맞음 → 켜짐',ON.st);
ok(ON.res.ev.join()==='start,end','외부에서 음성 받아 재생 끝까지',ON.res);
ok(ON.reqs.some(u=>u.startsWith(CFG.base+'assets/r381/voice/'))&&!ON.reqs.some(u=>u.startsWith(URL)&&u.includes('r381/voice/')),'음성 요청이 외부 주소로만',ON.reqs);
const F=await run('mp3fail','mp3fail');
ok(F.st.state==='on','health 는 맞고 mp3 만 실패',F.st);
ok(F.res.ev.join()==='start,end','외부 mp3 실패 → GitHub Pages 에서 이어서 재생',F.res);
ok(F.reqs.some(u=>u.startsWith(CFG.base)&&u.endsWith('.mp3'))&&F.reqs.some(u=>u.startsWith(URL)&&u.endsWith('.mp3')),'외부 시도 뒤 같은 파일을 Pages 에서',F.reqs);
const D=await run('down','down');
ok(D.st.state==='down','외부 주소 연결 안 됨 → 끔',D.st);ok(D.res.ev.join()==='start,end','외부 없이 GitHub Pages 로 재생',D.res);
ok(!D.reqs.some(u=>u.startsWith(CFG.base)&&u.endsWith('.mp3')),'끈 뒤에는 외부 mp3 요청 없음',D.reqs);
const O=await run('off','off');
ok(O.st.state==='off'&&!O.reqs.some(u=>u.startsWith(CFG.base)),'?cdn=off → 외부에 묻지 않음',{st:O.st,reqs:O.reqs});ok(O.res.ev.join()==='start,end','?cdn=off 재생',O.res);
await b.close();fs.writeFileSync(path.join(OUT,'r615-browser.json'),JSON.stringify({n,bad,rows},null,1));
console.log(bad?`R615 browser: ${bad}/${n} FAIL`:`R615 browser: ${n}/${n} PASS (headless)`);process.exit(bad?1:0);
