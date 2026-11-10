'use strict';// R615 무거운 에셋 외부 기준 주소(Cloudflare Pages 별도 프로젝트, 무료·결제수단 없음) + GitHub Pages 되돌림.
//  사용자 2026-11-10 "cloudfare무료로그럼하자". 코드·사이트는 GitHub Pages 그대로, 서사 음성 같은 무거운 에셋만 외부 주소에서 받는다.
//  · 외부 주소가 cdn-health.json 으로 살아 있음을 증명하기 전에는 언제나 Pages(상대 경로)를 쓴다.
//  · 외부에서 받다 실패하면 같은 파일을 Pages 에서 한 번 더 받고, 연속 실패가 쌓이면 이번 접속 동안 외부를 끈다.
//  · scripts/cdn-pack.py 는 site 에서 대상 접두어만 해시 검증해 옮기고 _headers(CORS)·cdn-health.json 을 만든다. 무료 한도(파일 20,000개·한 파일 25MiB)를 넘으면 실패.
const fs=require('fs'),path=require('path'),vm=require('vm'),os=require('os'),crypto=require('crypto'),cp=require('child_process'),{TextEncoder}=require('util');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const CFG=JSON.parse(fs.readFileSync(path.join(R,'asset-cdn.json'),'utf8'));
ok(CFG.schema==='storyworld-asset-cdn/v1','설정 스키마',CFG.schema);
ok(/^https:\/\/[a-z0-9-]+\.pages\.dev\/$/.test(CFG.base),'기준 주소 = Cloudflare Pages 무료 *.pages.dev, https, 끝 슬래시',CFG.base);
ok(CFG.base==='https://'+CFG.project+'.pages.dev/','기준 주소 = 프로젝트 이름',CFG);
ok(Array.isArray(CFG.prefixes)&&CFG.prefixes.includes('assets/r381/voice/'),'서사 음성 폴더가 대상',CFG.prefixes);
ok(CFG.prefixes.every(p=>p.endsWith('/')&&!p.startsWith('/')&&!p.includes('..')),'대상 접두어는 상대 폴더',CFG.prefixes);
ok(!CFG.prefixes.some(p=>/mammon/i.test(p)),'마몬 자산은 대상 아님(Codex 담당)');
for(const f of ['asset-cdn-r615.js','voice-r381.js']){const rt=path.join(R,'runtime-text',f);ok(fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===CS(f),f+' runtime-text 사본 = client-source');}
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
const iC=html.indexOf('<script src="./asset-cdn-r615.js"></script>'),iV=html.indexOf('<script src="./voice-r381.js"></script>');
ok(iC>0&&iV>iC,'index.html: asset-cdn-r615 가 voice-r381 보다 먼저',{iC,iV});
const verify=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ok(verify.includes('asset-cdn-r615.js'),'공개 검증 기대 목록에 들어감');
const wf=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');
ok(wf.includes('node r96/qa/r615/asset-cdn-cpu-check.cjs'),'pages.yml 에 이 검사 줄');
ok(/wrangler@\d+\.\d+\.\d+ pages deploy/.test(wf),'업로드는 버전을 고정한 wrangler pages deploy');
ok(/secrets\.CLOUDFLARE_API_TOKEN/.test(wf)&&/secrets\.CLOUDFLARE_ACCOUNT_ID/.test(wf),'토큰은 저장소 시크릿에서만 읽음');
ok(!/r2\b|R2 /.test(wf.split('R615')[1]||''),'R2(결제수단 필요)를 쓰지 않음');

// ── 브라우저 흉내: 시계·fetch·Audio ──
function world({query='',health=null,healthDelayMs=0,fetchThrows=false,cdnFails=()=>false,localFails=()=>false,stallCdn=false,realReject=false}={}){
 let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};
 const flush=()=>new Promise(r=>setImmediate(r));
 const run=async s=>{const end=clock+s;await flush();for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();await flush();}clock=end;await flush();};
 const fetched=[];const audios=[];
 const fetch=(u,o={})=>{fetched.push(u);if(fetchThrows)return Promise.reject(new TypeError('network'));
  return new Promise((res,rej)=>{const t=setT(()=>{if(o.signal?.aborted)return;const h=typeof health==='function'?health(u):health;
   if(!h)res({ok:false,status:404,json:async()=>({})});else res({ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(h))});},healthDelayMs);
   o.signal?.addEventListener('abort',()=>{t.dead=true;rej(new Error('AbortError'));});});};
 function AbortController(){const ls=[];this.signal={aborted:false,addEventListener:(k,f)=>ls.push(f)};this.abort=()=>{this.signal.aborted=true;ls.forEach(f=>f());};}
 function Audio(){this.src='';this.currentTime=0;this.paused=true;this.duration=NaN;this.loads=[];audios.push(this);}
 Audio.prototype.play=function(){const a=this,src=a.src;a.paused=false;a.loads.push(src);const cdn=src.startsWith('https://');
  if(cdn&&stallCdn)return Promise.resolve();
  if(cdn?cdnFails(src):localFails(src)){setT(()=>{if(a.src===src)a.onerror&&a.onerror();},20);
   // 실제 Chromium: 실패한 소스의 play() 약속은 error 이벤트 뒤에 NotSupportedError, 그 사이 src 가 바뀌면 AbortError 로 거부된다.
   if(realReject)return new Promise((_,rej)=>setT(()=>rej({name:a.src===src?'NotSupportedError':'AbortError'}),25));return Promise.resolve();}
  a.duration=2;setT(()=>{if(a.src!==src)return;a.currentTime=.1;a.onplaying&&a.onplaying();},20);setT(()=>{if(a.src===src&&!a.paused){a.paused=true;a.onended&&a.onended();}},2000);return Promise.resolve();};
 Audio.prototype.pause=function(){this.paused=true;};Audio.prototype.load=function(){};Audio.prototype.removeAttribute=function(k){if(k==='src')this.src='';};
 const sb={location:{search:query,protocol:'https:',hostname:'kjb7876-lang.github.io'},fetch,AbortController,Audio,TextEncoder,setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},addEventListener(){},
  document:{hidden:false},console:{log(){},warn(){}},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise,Int32Array,Uint8Array,URLSearchParams,Error,TypeError};
 sb.window=sb;vm.createContext(sb);
 sb.__STORYWORLD_VOICE_R381_DATA__={base:'assets/r381/voice/',ids:S.map(sid)};
 vm.runInContext(CS('asset-cdn-r615.js'),sb);vm.runInContext(CS('voice-r381.js'),sb);
 const V=sb.__STORYWORLD_VOICE_R381__,A=sb.__STORYWORLD_ASSET_CDN__;
 return {sb,V,A,run,fetched,audios,get clock(){return clock;}};}
const GOOD={schema:'storyworld-asset-cdn/v1',prefixes:['assets/r381/voice/'],files:3297};
const HOST=CFG.base,LOCAL='assets/r381/voice/';
const sid=t=>crypto.createHash('sha1').update(String(t).trim()).digest('hex').slice(0,16);
const S=['첫 문장이다.','둘째 문장이다.','셋째 문장이다.','넷째 문장이다.','다섯째 문장이다.','여섯째 문장이다.'];
const mk=o=>world(o);

(async()=>{
// 1) 외부 주소가 확인되기 전에는 Pages.
{const w=mk({health:GOOD,healthDelayMs:500});ok(!!w.A,'__STORYWORLD_ASSET_CDN__ 있음');
 ok(w.A&&w.A.url(LOCAL+'x.mp3')===LOCAL+'x.mp3','확인 전 = Pages 상대 경로',w.A&&w.A.url(LOCAL+'x.mp3'));
 ok(w.V.url(sid(S[0]))===LOCAL+sid(S[0])+'.mp3','확인 전 음성 주소 = Pages',w.V.url(sid(S[0])));
 ok(w.fetched.length===1&&w.fetched[0].startsWith(HOST+'cdn-health.json'),'health 를 한 번만 묻는다',w.fetched);
 await w.run(1);ok(w.A.inspect().state==='on','health 맞으면 켜짐',w.A.inspect());
 ok(w.A.url(LOCAL+'x.mp3')===HOST+LOCAL+'x.mp3','켜진 뒤 = 외부 주소',w.A.url(LOCAL+'x.mp3'));
 ok(w.A.url('./'+LOCAL+'x.mp3')===HOST+LOCAL+'x.mp3','./ 로 시작해도 같은 외부 주소');
 ok(w.A.url('assets/r381/voiceX/y.mp3')==='assets/r381/voiceX/y.mp3','대상 접두어 밖(비슷한 이름)은 Pages');
 ok(w.A.url('assets/r308/bgm/a.mp3')==='assets/r308/bgm/a.mp3','대상 아닌 폴더는 Pages');
 ok(w.A.url('../'+LOCAL+'x.mp3')==='../'+LOCAL+'x.mp3','.. 경로는 바꾸지 않음');
 ok(w.A.url('https://example.com/'+LOCAL+'x.mp3')==='https://example.com/'+LOCAL+'x.mp3','절대 주소는 바꾸지 않음');
 ok(w.A.local(HOST+LOCAL+'x.mp3')===LOCAL+'x.mp3','외부 주소 → Pages 주소로 되돌리기');
 ok(w.V.url(sid(S[0]))===HOST+LOCAL+sid(S[0])+'.mp3','켜진 뒤 음성 주소 = 외부',w.V.url(sid(S[0])));
 // 정상 재생: 외부에서 한 번, 되돌림 없음.
 let end=0,err=0;w.V.play(S[0],{onend:()=>end++,onerror:()=>err++});await w.run(3);
 const a=w.audios[w.audios.length-1];ok(end===1&&err===0&&a.loads.length===1&&a.loads[0]===HOST+LOCAL+sid(S[0])+'.mp3','외부에서 정상 재생',{end,err,loads:a.loads});}

// 2) health 가 없거나 틀리면 Pages 그대로.
for(const [name,h] of [['404',null],['스키마 다름',{schema:'x/v0',prefixes:['assets/r381/voice/']}],['접두어 없음',{schema:'storyworld-asset-cdn/v1',prefixes:[]}],['접두어 문자열 아님',{schema:'storyworld-asset-cdn/v1',prefixes:'assets/r381/voice/'}]]){
 const w=mk({health:h});await w.run(2);ok(w.A.inspect().state!=='on'&&w.A.url(LOCAL+'x.mp3')===LOCAL+'x.mp3','health '+name+' → Pages',w.A.inspect());}
{const w=mk({fetchThrows:true});await w.run(2);ok(w.A.inspect().state==='down'&&w.V.url(sid(S[1]))===LOCAL+sid(S[1])+'.mp3','fetch 예외 → Pages',w.A.inspect());}
{const w=mk({health:GOOD,healthDelayMs:60000});await w.run(10);ok(w.A.inspect().state==='down'&&w.A.url(LOCAL+'x.mp3')===LOCAL+'x.mp3','health 응답이 4초 넘게 없으면 Pages',w.A.inspect());
 await w.run(60);ok(w.A.inspect().state==='down','늦게 온 응답으로 다시 켜지지 않음',w.A.inspect());}
// health 가 대상 일부만 알리면 그 일부만.
{const w=mk({health:{schema:'storyworld-asset-cdn/v1',prefixes:['assets/other/']}});await w.run(2);ok(w.A.url(LOCAL+'x.mp3')===LOCAL+'x.mp3','외부에 없는 접두어는 Pages',w.A.inspect());}

// 3) 끄기·바꾸기(검사용 주소 쿼리).
{const w=mk({query:'?cdn=off',health:GOOD});await w.run(2);ok(w.fetched.length===0&&w.A.inspect().state==='off'&&w.A.url(LOCAL+'x.mp3')===LOCAL+'x.mp3','?cdn=off → 묻지도 않고 Pages',w.fetched);}
{const w=mk({query:'?cdn=https%3A%2F%2Fmy-test.pages.dev',health:GOOD});ok(w.fetched[0]==='https://my-test.pages.dev/cdn-health.json','?cdn=https://… 로 다른 주소 시험(끝 슬래시 보정)',w.fetched);}
{const w=mk({query:'?cdn=http%3A%2F%2Fevil.example',health:GOOD});await w.run(2);ok(!w.fetched.some(u=>u.startsWith('http://evil'))&&w.A.url(LOCAL+'x.mp3').indexOf('evil')<0,'https 아닌 주소는 거부',w.fetched);}
{const w=mk({query:'?cdn=javascript:alert(1)',health:GOOD});await w.run(2);ok(!w.fetched.some(u=>/javascript/.test(u)),'javascript: 주소 거부',w.fetched);}

// 4) 외부에서 받다 실패 → 같은 파일을 Pages 에서 한 번 더(재생은 끊기지 않음).
{const w=mk({health:GOOD,cdnFails:()=>true});await w.run(1);let end=0,err=0,start=0;
 w.V.play(S[0],{onend:()=>end++,onerror:()=>err++,onstart:()=>start++});await w.run(4);const a=w.audios[w.audios.length-1];
 ok(end===1&&err===0&&start===1,'외부 실패 → Pages 로 이어서 재생, 오류 알림 없음',{end,err,start,loads:a.loads});
 ok(a.loads.length===2&&a.loads[0].startsWith(HOST)&&a.loads[1]===LOCAL+sid(S[0])+'.mp3','되돌림은 같은 파일을 Pages 에서',a.loads);
 // 연속 실패 3번이면 이번 접속 동안 외부 끔.
 w.V.play(S[1],{});await w.run(4);w.V.play(S[2],{});await w.run(4);
 ok(w.A.inspect().state==='down','외부 연속 실패 3번 → 끔',w.A.inspect());
 const before=w.audios.length;w.V.play(S[3],{});await w.run(4);const b=w.audios[w.audios.length-1];
 ok(b.loads.length===1&&b.loads[0]===LOCAL+sid(S[3])+'.mp3','끈 뒤에는 처음부터 Pages',b.loads);}
// 한 번 실패 후 성공하면 연속 실패 수가 0으로.
{let k=0;const w=mk({health:GOOD,cdnFails:()=>(k++%2)===0});await w.run(1);for(let i=0;i<6;i++){w.V.play(S[i],{});await w.run(4);}
 ok(w.A.inspect().state==='on','실패·성공이 섞이면 끄지 않음',w.A.inspect());}
// 실제 브라우저처럼 실패한 외부 시도의 play() 약속이 되돌림 뒤에 늦게 거부돼도 되돌린 재생을 죽이지 않음(2026-11-10 헤드리스 Chromium 에서 찾음).
{const w=mk({health:GOOD,cdnFails:()=>true,realReject:true});await w.run(1);let end=0,err=0;
 w.V.play(S[0],{onend:()=>end++,onerror:()=>err++});await w.run(4);ok(end===1&&err===0,'늦은 play() 거부(이전 시도)는 무시',{end,err});}
{const w=mk({health:GOOD,cdnFails:()=>true,localFails:()=>true,realReject:true});await w.run(1);let end=0,err=0;
 w.V.play(S[0],{onend:()=>end++,onerror:()=>err++});await w.run(6);ok(end===0&&err===1,'늦은 거부가 섞여도 둘 다 실패면 오류 한 번',{end,err});}
// 외부·Pages 둘 다 실패 → 오류 한 번만(영화 모드가 브라우저 음성으로 돌아감).
{const w=mk({health:GOOD,cdnFails:()=>true,localFails:()=>true});await w.run(1);let end=0,err=0;
 w.V.play(S[0],{onend:()=>end++,onerror:()=>err++});await w.run(6);ok(end===0&&err===1,'둘 다 실패 → onerror 한 번',{end,err});}
// Pages 만 쓰는 중 실패는 되풀이하지 않음(무한 재시도 없음).
{const w=mk({health:null,localFails:()=>true});await w.run(1);let err=0;w.V.play(S[0],{onerror:()=>err++});await w.run(6);const a=w.audios[w.audios.length-1];
 ok(err===1&&a.loads.length===1,'Pages 실패는 한 번만 시도',{err,loads:a.loads});}
// 외부에서 받기가 멈추면(8초) Pages 로.
{const w=mk({health:GOOD,stallCdn:true});await w.run(1);let end=0,err=0;w.V.play(S[0],{onend:()=>end++,onerror:()=>err++});await w.run(14);const a=w.audios[w.audios.length-1];
 ok(end===1&&err===0&&a.loads[a.loads.length-1]===LOCAL+sid(S[0])+'.mp3','외부 멈춤 → Pages 로 이어서',{end,err,loads:a.loads});}
// 멈춘(stop) 소리는 되돌리지 않음.
{const w=mk({health:GOOD,cdnFails:()=>true});await w.run(1);let err=0;const h=w.V.play(S[0],{onerror:()=>err++});h.stop();await w.run(4);const a=w.audios[w.audios.length-1];
 ok(a.loads.length===1&&err===0,'멈춘 소리는 되돌리지 않음',{loads:a.loads,err});}
// 미리 받기도 외부 주소.
{const w=mk({health:GOOD});await w.run(1);w.V.preload(S[4]);const a=w.audios[w.audios.length-1];ok(a.src===HOST+LOCAL+sid(S[4])+'.mp3','미리 받기도 외부',a.src);}
// 모듈이 없을 때(옛 페이지) 음성은 예전대로 Pages.
{const sb={Audio:function(){},TextEncoder,setTimeout,clearTimeout,addEventListener(){},document:{},Math,JSON,String,Array,Set,Map,Object,Number,Promise,Int32Array,Uint8Array};sb.window=sb;vm.createContext(sb);
 sb.__STORYWORLD_VOICE_R381_DATA__={base:'assets/r381/voice/',ids:[sid(S[0])]};vm.runInContext(CS('voice-r381.js'),sb);
 ok(sb.__STORYWORLD_VOICE_R381__.url(sid(S[0]))===LOCAL+sid(S[0])+'.mp3','CDN 모듈 없으면 예전 경로');}

// ── 5) scripts/cdn-pack.py ──
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'r615-'));const site=path.join(tmp,'site');
const files={'assets/r381/voice/a1.mp3':Buffer.from('ID3 voice a1'),'assets/r381/voice/b2.mp3':Buffer.alloc(3000,7),'assets/r308/bgm/x.mp3':Buffer.from('bgm'),'index.html':Buffer.from('<html>'),'assets/r381/voiceX/z.mp3':Buffer.from('z')};
const rows=[];for(const [p,b] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(site,p)),{recursive:true});fs.writeFileSync(path.join(site,p),b);rows.push({path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}
const man=path.join(tmp,'manifest.json');fs.writeFileSync(man,JSON.stringify({files:rows}));
const cfgP=path.join(tmp,'cfg.json');fs.writeFileSync(cfgP,JSON.stringify({...CFG,prefixes:['assets/r381/voice/']}));
const pack=(extra=[],cfg=cfgP)=>cp.spawnSync('python3',[path.join(ROOT,'scripts','cdn-pack.py'),'--site',site,'--manifest',man,'--config',cfg,'--out',path.join(tmp,'out'),...extra],{encoding:'utf8'});
let r=pack();ok(r.status===0,'cdn-pack 성공',r.stderr||r.stdout);
const out=path.join(tmp,'out');const has=p=>fs.existsSync(path.join(out,p));
ok(has('assets/r381/voice/a1.mp3')&&has('assets/r381/voice/b2.mp3'),'대상 파일 옮김');
ok(!has('assets/r308/bgm/x.mp3')&&!has('index.html')&&!has('assets/r381/voiceX/z.mp3'),'대상 밖 파일은 안 옮김(비슷한 이름 포함)');
ok(has('assets/r381/voice/a1.mp3')&&fs.readFileSync(path.join(out,'assets/r381/voice/a1.mp3')).equals(files['assets/r381/voice/a1.mp3']),'바이트 같음');
const hd=has('_headers')?fs.readFileSync(path.join(out,'_headers'),'utf8'):'';
ok(/Access-Control-Allow-Origin: \*/.test(hd),'_headers CORS',hd);ok(/\/cdn-health\.json\n\s+! Cache-Control\n\s+Cache-Control: no-cache/.test(hd),'health 는 캐시 안 함',hd);
const H=has('cdn-health.json')?JSON.parse(fs.readFileSync(path.join(out,'cdn-health.json'),'utf8')):{};
ok(H.schema==='storyworld-asset-cdn/v1'&&H.files===2&&JSON.stringify(H.prefixes)==='["assets/r381/voice/"]'&&H.bytes===files['assets/r381/voice/a1.mp3'].length+3000,'health 내용',H);
ok(Array.isArray(H.sample)&&H.sample.length>=1&&H.sample.every(s=>s.path&&s.sha256),'health 에 표본 해시(공개 검증용)',H.sample);
// 해시가 다르면 거부.
fs.writeFileSync(path.join(site,'assets/r381/voice/a1.mp3'),'tampered!!!!');r=pack();ok(r.status!==0&&/differs/.test(r.stderr+r.stdout),'site 와 manifest 가 다르면 실패',r.stderr);
fs.writeFileSync(path.join(site,'assets/r381/voice/a1.mp3'),files['assets/r381/voice/a1.mp3']);
// 무료 한도: 한 파일 25MiB 초과·파일 수 초과면 실패.
r=pack(['--max-file-bytes','2999']);ok(r.status!==0&&/25MiB|max-file/.test(r.stderr+r.stdout),'한 파일 한도 넘으면 실패',r.stderr);
r=pack(['--max-files','3']);ok(r.status!==0&&/20,?000|max-files/.test(r.stderr+r.stdout),'파일 수 한도 넘으면 실패(health·_headers 포함)',r.stderr);
r=pack(['--max-files','4']);ok(r.status===0,'파일 수 = 한도면 통과',r.stderr);
// 위험한 접두어 거부.
for(const bp of ['../x/','/abs/','assets/mammon/','']){const p2=path.join(tmp,'bad.json');fs.writeFileSync(p2,JSON.stringify({...CFG,prefixes:[bp]}));r=pack([],p2);ok(r.status!==0,'잘못된 접두어 거부: '+JSON.stringify(bp),r.stdout);}
// ── 6) scripts/cdn-verify.py: 공개 주소의 health·CORS·표본 바이트 확인 ──
r=pack();ok(r.status===0,'다시 묶기',r.stderr);
const serve=async(dir,cors)=>{const code=`import http.server,socketserver,sys,os
os.chdir(sys.argv[1])
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        ${cors?"self.send_header('Access-Control-Allow-Origin','*')":"pass"}
        super().end_headers()
    def log_message(self,*a): pass
s=socketserver.TCPServer(('127.0.0.1',0),H);print(s.server_address[1],flush=True);s.serve_forever()`;
 const pr=cp.spawn('python3',['-c',code,dir]);const port=await new Promise(res=>pr.stdout.once('data',d=>res(String(d).trim())));return {pr,base:`http://127.0.0.1:${port}/`};};
const ver=(base,extra=[])=>new Promise(res=>{const c=cp.spawn('python3',[path.join(ROOT,'scripts','cdn-verify.py'),'--base',base,'--pack',out,'--tries','1',...extra]);let o='';c.stdout.on('data',d=>o+=d);c.stderr.on('data',d=>o+=d);c.on('close',st=>res({status:st,o}));});
const pub=path.join(tmp,'public');fs.cpSync(out,pub,{recursive:true});
{const s1=await serve(pub,true);let v=await ver(s1.base);ok(v.status===0&&/R615_CDN_PUBLIC_OK/.test(v.o),'공개 확인 통과',v.o);
 fs.writeFileSync(path.join(pub,'assets/r381/voice/a1.mp3'),'changed bytes');v=await ver(s1.base);ok(v.status!==0&&/sample differs/.test(v.o),'표본 바이트 다르면 실패',v.o);
 fs.copyFileSync(path.join(out,'assets/r381/voice/a1.mp3'),path.join(pub,'assets/r381/voice/a1.mp3'));
 const hp=path.join(pub,'cdn-health.json'),hj=JSON.parse(fs.readFileSync(hp,'utf8'));fs.writeFileSync(hp,JSON.stringify({...hj,runtimeManifestSHA256:'0'.repeat(64)}));
 v=await ver(s1.base);ok(v.status!==0&&/runtimeManifestSHA256/.test(v.o),'옛 묶음(manifest 해시 다름)이면 실패',v.o);s1.pr.kill();}
{fs.cpSync(out,pub,{recursive:true});const s2=await serve(pub,false);const v=await ver(s2.base);ok(v.status!==0&&/CORS/.test(v.o),'CORS 머리말 없으면 실패',v.o);s2.pr.kill();}
{const v=await ver('http://evil.example/');ok(v.status!==0&&/https/.test(v.o),'https 아닌 주소 거부',v.o);}
fs.rmSync(tmp,{recursive:true,force:true});
console.log(bad?`R615 asset-cdn: ${bad}/${n} FAIL`:`R615 asset-cdn: ${n}/${n} PASS`);process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL 예외',e&&e.stack||e);process.exit(1);});
