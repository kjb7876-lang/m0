'use strict';// R1283 서사 음성 외부 주소(R615) 되살리기 — 사용자 2026-11-21 "서사음성이 그냥 스토리모드에서 잘나오지 않는문제 음성켰는데도".
//  점검: 서사 녹음(assets/r381/voice)은 R615b(11-10)부터 GitHub Pages 배포본에서 빠져 Cloudflare 에만 있다.
//   그런데 R615 는 health 응답이 4초 안에 안 오거나 외부 받기가 연속 3번 실패하면 이번 접속 내내 Pages(파일 없음, 404)로 돌린다 → 그 뒤 모든 서사 음성 무음.
//  고침: 외부가 꺼진(down) 뒤에도 health 를 15·30·60·120·240·480초 뒤 다시 묻고, 맞으면 다시 켠다(최대 6번, ?cdn=off 면 묻지 않음).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),{TextEncoder}=require('util');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}else console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const HOST=JSON.parse(fs.readFileSync(path.join(R,'asset-cdn.json'),'utf8')).base,LOCAL='assets/r381/voice/';
const sid=t=>crypto.createHash('sha1').update(String(t).trim()).digest('hex').slice(0,16);
const S=['첫 문장이다.','둘째 문장이다.','셋째 문장이다.','넷째 문장이다.','다섯째 문장이다.','여섯째 문장이다.'];
const GOOD={schema:'storyworld-asset-cdn/v1',prefixes:['assets/r381/voice/'],files:3297};
// 브라우저 흉내(R615 검사와 같은 틀, health 늦음·응답을 부를 때마다 고를 수 있게).
function world({query='',health=()=>GOOD,delay=()=>0,throws=()=>false,cdnFails=()=>false}={}){
 let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};
 const flush=()=>new Promise(r=>setImmediate(r));
 const run=async s=>{const end=clock+s;await flush();for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();await flush();}clock=end;await flush();};
 const fetched=[],audios=[];let k=0;
 const fetch=(u,o={})=>{const i=k++;fetched.push({u,at:clock});if(throws(i))return Promise.reject(new TypeError('network'));
  return new Promise((res,rej)=>{const t=setT(()=>{if(o.signal?.aborted)return;const h=health(i);
   if(!h)res({ok:false,status:404,json:async()=>({})});else res({ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(h))});},delay(i));
   o.signal?.addEventListener('abort',()=>{t.dead=true;rej(new Error('AbortError'));});});};
 function AbortController(){const ls=[];this.signal={aborted:false,addEventListener:(k,f)=>ls.push(f)};this.abort=()=>{this.signal.aborted=true;ls.forEach(f=>f());};}
 function Audio(){this.src='';this.currentTime=0;this.paused=true;this.duration=NaN;this.loads=[];audios.push(this);}
 Audio.prototype.play=function(){const a=this,src=a.src;a.paused=false;a.loads.push(src);const cdn=src.startsWith('https://');
  if(cdn?cdnFails(src):!cdn){setT(()=>{if(a.src===src)a.onerror&&a.onerror();},20);return Promise.resolve();}// Pages 에는 음성 파일이 없다(404)
  a.duration=2;setT(()=>{if(a.src!==src)return;a.currentTime=.1;a.onplaying&&a.onplaying();},20);setT(()=>{if(a.src===src&&!a.paused){a.paused=true;a.onended&&a.onended();}},2000);return Promise.resolve();};
 Audio.prototype.pause=function(){this.paused=true;};Audio.prototype.load=function(){};Audio.prototype.removeAttribute=function(k){if(k==='src')this.src='';};
 const sb={location:{search:query},fetch,AbortController,Audio,TextEncoder,setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},addEventListener(){},
  document:{hidden:false},console:{log(){},warn(){}},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise,Int32Array,Uint8Array,URLSearchParams,Error,TypeError};
 sb.window=sb;vm.createContext(sb);sb.__STORYWORLD_VOICE_R381_DATA__={base:LOCAL,ids:S.map(sid)};
 vm.runInContext(CS('asset-cdn-r615.js'),sb);vm.runInContext(CS('voice-r381.js'),sb);
 return {V:sb.__STORYWORLD_VOICE_R381__,A:sb.__STORYWORLD_ASSET_CDN__,run,fetched,audios};}
async function plays(w,t){let end=0,err=0;w.V.play(t,{onend:()=>end++,onerror:()=>err++});await w.run(4);return {end,err,src:w.audios[w.audios.length-1]?.loads?.[0]};}
(async()=>{
// ① 첫 health 가 4초 넘게 늦으면(무거운 첫 로딩) 꺼지지만, 다시 물어 켜지고 음성이 외부에서 나온다.
{const w=world({delay:i=>i===0?6000:200});await w.run(5);ok(w.A.inspect().state==='down','① 첫 health 늦음 → 잠시 꺼짐(예전과 같음)',w.A.inspect());
 await w.run(20);ok(w.A.inspect().state==='on','① 다시 물어 20초 안에 켜짐',{s:w.A.inspect(),f:w.fetched});
 const p=await plays(w,S[0]);ok(p.end===1&&p.err===0&&p.src===HOST+LOCAL+sid(S[0])+'.mp3','① 켜진 뒤 서사 음성이 외부에서 끝까지',p);}
// ② 첫 health 가 네트워크 오류여도 다시 물어 켜진다.
{const w=world({throws:i=>i===0});await w.run(2);ok(w.A.inspect().state==='down','② 첫 fetch 예외 → 꺼짐');await w.run(20);ok(w.A.inspect().state==='on','② 다시 물어 켜짐',w.A.inspect());}
// ③ 외부 받기가 잠깐 3번 연속 실패해 꺼져도, health 가 살아 있으면 다시 켜져 다음 문장은 외부에서 나온다(예전: 이번 접속 내내 무음).
{let bad3=true;const w=world({cdnFails:()=>bad3});await w.run(1);for(const t of S.slice(0,3))await plays(w,t);
 ok(w.A.inspect().state==='down','③ 연속 실패 3번 → 꺼짐(예전과 같음)',w.A.inspect());bad3=false;
 await w.run(20);ok(w.A.inspect().state==='on','③ 다시 물어 켜짐',w.A.inspect());
 const p=await plays(w,S[3]);ok(p.end===1&&p.err===0&&p.src===HOST+LOCAL+sid(S[3])+'.mp3','③ 다음 문장은 외부에서 끝까지',p);}
// ④ 켜져 있는 동안은 다시 묻지 않는다(health 한 번).
{const w=world();await w.run(600);ok(w.fetched.length===1,'④ 켜진 동안 health 한 번만',w.fetched.length);}
// ⑤ ?cdn=off 면 처음에도 나중에도 묻지 않는다.
{const w=world({query:'?cdn=off'});await w.run(600);ok(w.fetched.length===0&&w.A.inspect().state==='off','⑤ ?cdn=off → 묻지 않음',w.fetched.length);}
// ⑥ health 가 계속 틀리면 다시 묻기는 최대 6번(첫 물음 포함 7번), 무한 반복 없음.
{const w=world({health:()=>null});await w.run(3600);ok(w.fetched.length===7&&w.A.inspect().state==='down','⑥ 계속 실패면 다시 묻기 6번에서 멈춤',w.fetched.map(x=>x.at));}
// ⑦ 다시 묻는 간격은 15·30·60·120·240·480초로 늘어난다.
{const w=world({health:()=>null});await w.run(3600);const gaps=w.fetched.slice(1).map((x,i)=>Math.round(x.at-w.fetched[i].at));
 ok(JSON.stringify(gaps)===JSON.stringify([15,30,60,120,240,480]),'⑦ 간격 15·30·60·120·240·480초',gaps);}
// ⑧ 다시 켜진 뒤 또 꺼지면 처음 간격(15초)부터 다시 묻는다.
{let bad=true;const w=world({cdnFails:()=>bad});await w.run(1);for(const t of S.slice(0,3))await plays(w,t);bad=false;await w.run(20);
 bad=true;for(const t of S.slice(3,6))await plays(w,t);const f0=w.fetched.length;ok(w.A.inspect().state==='down','⑧ 다시 꺼짐');bad=false;await w.run(20);
 ok(w.A.inspect().state==='on'&&w.fetched.length===f0+1,'⑧ 15초 간격부터 다시 물어 켜짐',{s:w.A.inspect().state,f:w.fetched.length-f0});}
// ⑩ '🔊 음성 켜기'(R1223 set(true))는 지금 떠 있는 서사 창(R1044 start)과 영상 자막(V.last 초기화)을 바로 다시 읽는다 — 실제 소리는 r1283-browser.mjs (B)(D).
{const m=CS('memory-voice-r1223.js');const i=m.indexOf('function set(v)'),j=m.indexOf('sync();return on;}',i);const body=m.slice(i,j);
 ok(/storyScene&&N&&!N\.inspect\?\.\(\)\.playing\)\{N\.start\?\.\(\)/.test(body),'⑩ 켜면 지금 서사 창 음성 다시 시작');ok(/V\.last=''/.test(body),'⑩ 켜면 지금 영상 자막 다시 읽기');
 ok(fs.readFileSync(path.join(R,'runtime-text','memory-voice-r1223.js'),'utf8')===m&&fs.readFileSync(path.join(R,'runtime-text','asset-cdn-r615.js'),'utf8')===CS('asset-cdn-r615.js'),'⑩ runtime-text 사본 = client-source');}
// ⑨ 이 검사는 CI(pages.yml)에 걸려 있다.
ok(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1283/r1283-cpu-check.cjs'),'⑨ pages.yml 에 이 검사 줄');
console.log(JSON.stringify({total:n,failed:bad}));process.exit(bad?1:0);})();
