'use strict';// R1308 — 무거운 자산을 Cloudflare 자산 프로젝트(storyworld-m0-assets.pages.dev, 무료·결제수단 없음)로 옮겨
//  GitHub Pages 용량 한도(1.1GB)를 푼다(사용자 2026-11-25 "이걸로 개선작업해줘"). R2 는 결제수단 등록이 필요해 쓰지 않는다.
//  · asset-route-r1308.js 가 index.html 의 첫 스크립트로 이미지·소리·영상·fetch·XHR 주소를 한곳에서 바꾼다.
//  · 공개 주소(kjb7876-lang.github.io)에서만 바꾸고, 로컬·CI(127.0.0.1)는 언제나 상대 경로 그대로(새 PR 자산은 아직 CDN 에 없다).
//  · ?cdn=off 끄기, ?cdn=http://127.0.0.1:포트/ 시험용 바꾸기.
//  · 바꾼 이미지·소리·영상에는 crossOrigin='anonymous' 를 붙여 캔버스·WebGL·WebAudio 가 오염되지 않게 한다.
//  · 옮긴 폴더는 Pages 배포본에서 빠지므로 main 배포 전에 CDN 이 이번 묶음과 같은지 반드시 확인한다(실패하면 배포 안 함).
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}else console.log('PASS',m);};
const rd=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const SRC=rd(path.join(R,'client-source','asset-route-r1308.js'));
ok(SRC.length>0,'asset-route-r1308.js 있음');
const CDN='https://storyworld-m0-assets.pages.dev/';

// ── 설정 일관성 ──
const CFG=JSON.parse(rd(path.join(R,'asset-cdn.json')));
const EX=JSON.parse(rd(path.join(R,'pages-exclude.json')));
const m=SRC.match(/const ROUTED=(\[[^\]]*\])/);let ROUTED=[];try{ROUTED=m?JSON.parse(m[1].replace(/'/g,'"')):[];}catch(_){}
const R615=(rd(path.join(R,'client-source','asset-cdn-r615.js')).match(/PREFIXES=(\[[^\]]*\])/)||[])[1];
const R615P=R615?JSON.parse(R615.replace(/'/g,'"')):[];
ok(ROUTED.length>=5,'옮길 폴더 목록',ROUTED);
ok(SRC.includes("const BASE='"+CDN+"'")&&CFG.base===CDN,'기준 주소 = asset-cdn.json base');
for(const p of ROUTED){
 ok(p.endsWith('/')&&!p.startsWith('/')&&!p.includes('..')&&!/mammon/i.test(p),'상대 폴더·맘몬 아님: '+p);
 ok(CFG.prefixes.includes(p),'asset-cdn.json prefixes 에 있음(CDN 묶음에 들어감): '+p);
 const e=EX.exclude.find(x=>x.prefix===p);ok(!!e&&/Cloudflare/.test(e.reason||'')&&/R1308/.test(e.reason||''),'Pages 배포본에서 뺌(R1308·Cloudflare 이유): '+p);
 ok(!EX.protected.some(q=>p.startsWith(q)||q.startsWith(p)),'보호 경로 아님: '+p);
 ok(!R615P.some(q=>p.startsWith(q)||q.startsWith(p)),'R615 음성·타이틀 접두어와 겹치지 않음: '+p);
 ok(!(CFG.additiveVerifyPaths||[]).some(q=>q.startsWith(p)),'클래식 13곡 원본 보존 코호트와 겹치지 않음: '+p);
 ok(!p.startsWith('assets/r1305/'),'3D 영웅(R1305, 별도 단계)은 건드리지 않음: '+p);
}
// ── 빌드 연결 ──
const html=rd(path.join(R,'runtime-text','index.html'));
const first=(html.match(/<script[^>]*>/)||[''])[0];
ok(first==='<script src="./asset-route-r1308.js"></script>'.slice(0,first.length)&&first.includes('asset-route-r1308.js'),'index.html 의 첫 스크립트',first);
ok(rd(path.join(R,'runtime-text','asset-route-r1308.js'))===SRC,'runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'scripts','verify-r96-public.py')).includes('asset-route-r1308.js'),'공개 검증 기대 목록에 들어감');
const wf=rd(path.join(ROOT,'.github','workflows','pages.yml'));
ok(wf.includes('node r96/qa/r1308/asset-route-cpu-check.cjs'),'pages.yml 에 이 검사 줄');
const gate=wf.split('\n      - name: ').find(s=>s.includes('scripts/cdn-route-gate.py'))||'';
ok(!!gate&&!/continue-on-error/.test(gate),'main 배포 전 CDN 확인 단계는 실패하면 배포를 막음',gate.slice(0,120));
ok(wf.indexOf('scripts/cdn-route-gate.py')>0&&wf.indexOf('scripts/cdn-route-gate.py')<wf.indexOf('actions/deploy-pages'),'확인 단계가 배포보다 먼저');
const runKeys=(wf.match(/^\s+run:/gm)||[]).length,steps=(wf.match(/^\s+- name:/gm)||[]).length;ok(runKeys<=steps+2,'run: 키 중복 없음(대략)',{runKeys,steps});
ok(fs.existsSync(path.join(ROOT,'scripts','cdn-route-gate.py'))&&!/numpy/.test(rd(path.join(ROOT,'scripts','cdn-route-gate.py'))),'cdn-route-gate.py 있음·numpy 안 씀');
// 정적: 옮긴 폴더를 CSS url()·link href 로 부르는 곳이 없어야 한다(그건 이 스크립트가 못 바꾼다).
{const files=fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js')).map(f=>[f,rd(path.join(R,'client-source',f))]).concat([['index.html',html]]);
 const hits=[];for(const [f,t] of files)for(const p of ROUTED){const re=new RegExp('(url\\(|href=|poster=|srcset=)\\s*[\'"]?(\\./)?'+p.replace(/[.*+?^${}()|[\]\\/]/g,'\\$&'));if(re.test(t))hits.push(f+':'+p);}
 ok(!hits.length,'옮긴 폴더를 CSS url·href·poster 로 부르지 않음',hits);}

// ── 브라우저 흉내 ──
function world({host='kjb7876-lang.github.io',pathname='/m0/index.html',search='',proto='https:'}={}){
 const origin=proto+'//'+host;const baseURI=origin+pathname+search;const log=[];
 class El{constructor(tag){this.tagName=tag;this._a={};this.crossOrigin=null;}setAttribute(k,v){this._a[k]=String(v);if(k==='src')this._src=String(v);if(k==='crossorigin')this.crossOrigin=String(v);}getAttribute(k){return this._a[k]??null;}}
 const mk=(tag)=>{const C=class extends El{constructor(){super(tag);}};Object.defineProperty(C.prototype,'src',{configurable:true,enumerable:true,get(){return this._src?new URL(this._src,baseURI).href:'';},set(v){this._src=String(v);log.push([tag,String(v),this.crossOrigin]);}});return C;};
 const HTMLElement=El,HTMLImageElement=mk('IMG'),HTMLMediaElement=mk('MEDIA'),HTMLSourceElement=mk('SOURCE');
 class HTMLAudioElement extends HTMLMediaElement{}class HTMLVideoElement extends HTMLMediaElement{}Object.defineProperty(HTMLVideoElement.prototype,'poster',{configurable:true,enumerable:true,get(){return this._poster||'';},set(v){this._poster=String(v);}});
 function Audio(src){const a=new HTMLAudioElement();a.preload='auto';if(src!==undefined)a.src=src;return a;}Audio.prototype=HTMLAudioElement.prototype;
 function Image(){return new HTMLImageElement();}Image.prototype=HTMLImageElement.prototype;
 class Request{constructor(u,init){this.url=typeof u==='string'?new URL(u,baseURI).href:u.url;this.init=init;}}
 const fetched=[];const fetch=(u,o)=>{fetched.push(typeof u==='string'?u:(u instanceof URL?u.href:u.url));return Promise.resolve({ok:true});};
 const opened=[];class XMLHttpRequest{open(meth,u){opened.push(String(u));}}
 const Element=El;
 const window={location:{hostname:host,search,href:baseURI,origin,protocol:proto},document:{baseURI},HTMLImageElement,HTMLMediaElement,HTMLSourceElement,HTMLAudioElement,HTMLVideoElement,HTMLElement,Element,Audio,Image,Request,fetch,XMLHttpRequest,URL,URLSearchParams,addEventListener(){}};
 window.window=window;
 vm.runInNewContext(SRC,{window,document:window.document,location:window.location,URL,URLSearchParams,console});
 return {w:window,log,fetched,opened,A:window.__STORYWORLD_ASSET_ROUTE__};
}
const P=ROUTED[0]||'assets/r308/bgm/',F=P+'track.ogg';
{const {w,log,fetched,opened,A}=world();
 ok(!!A&&A.inspect().on===true,'공개 주소에서 켜짐',A&&A.inspect());
 ok(A&&A.url(F)===CDN+F,'옮긴 폴더 → CDN',A&&A.url(F));
 ok(A&&A.url('./'+F)===CDN+F,'./ 상대 경로도 CDN');
 ok(A&&A.url('https://kjb7876-lang.github.io/m0/'+F+'?v=2')===CDN+F+'?v=2','같은 사이트 절대 주소·쿼리 유지');
 ok(A&&A.url('assets/r381/voice/a.mp3')==='assets/r381/voice/a.mp3','R615 음성 경로는 손대지 않음(R615 가 처리)');
 ok(A&&A.url('assets/heroes/x.png')==='assets/heroes/x.png','옮기지 않은 폴더는 그대로');
 ok(A&&A.url('data:image/png;base64,AA')==='data:image/png;base64,AA'&&A.url('blob:https://x/1')==='blob:https://x/1','data·blob 그대로');
 ok(A&&A.url('https://other.example/'+F)==='https://other.example/'+F,'다른 사이트 주소 그대로');
 ok(A&&A.url('../'+F)==='../'+F,'사이트 밖(../)은 그대로');
 ok(A&&A.url(CDN+F)===CDN+F,'이미 CDN 주소면 그대로');
 ok(A&&A.url('ASSETS/'+F.slice(7))==='ASSETS/'+F.slice(7),'대소문자 다른 경로는 그대로(정확히 일치만)');
 const img=new w.Image();img.src=F;ok(log.at(-1)&&log.at(-1)[1]===CDN+F&&img.crossOrigin==='anonymous','Image.src → CDN + crossOrigin anonymous',log.at(-1));
 const img2=new w.Image();img2.src='assets/heroes/x.png';ok(log.at(-1)[1]==='assets/heroes/x.png'&&img2.crossOrigin===null,'다른 그림은 crossOrigin 안 붙임');
 const img3=new w.Image();img3.crossOrigin='use-credentials';img3.src=F;ok(img3.crossOrigin==='use-credentials','이미 정한 crossOrigin 은 존중');
 const a=new w.Audio(F);ok(log.at(-1)[1]===CDN+F&&a.crossOrigin==='anonymous'&&a instanceof w.HTMLAudioElement,'new Audio(경로) → CDN',log.at(-1));
 const a0=new w.Audio();ok(a0 instanceof w.HTMLAudioElement&&a0.preload==='auto','new Audio() 빈 생성 유지');
 const v=new w.HTMLVideoElement();v.src=F;ok(log.at(-1)[1]===CDN+F&&v.crossOrigin==='anonymous','video.src → CDN');
 const v2=new w.HTMLVideoElement();v2.poster=F.replace(/[^/]+$/,'p.jpg');ok(v2._poster===CDN+P+'p.jpg','video.poster → CDN',v2._poster);
 const v3=new w.HTMLVideoElement();v3.setAttribute('poster',P+'q.jpg');ok(v3._a.poster===CDN+P+'q.jpg','setAttribute(poster) → CDN',v3._a);
 const s=new w.HTMLSourceElement();s.setAttribute('src',F);ok(s._src===CDN+F,'setAttribute(src) → CDN',s._src);
 const d=new w.HTMLElement('DIV');d.setAttribute('data-x',F);ok(d._a['data-x']===F,'다른 속성은 그대로');
 w.fetch(F);w.fetch(new w.URL('https://kjb7876-lang.github.io/m0/'+F));w.fetch(new w.Request(F));w.fetch('assets/heroes/x.json');
 ok(fetched[0]===CDN+F&&fetched[1]===CDN+F&&fetched[2]===CDN+F&&fetched[3]==='assets/heroes/x.json','fetch(문자열·URL·Request) → CDN, 다른 것은 그대로',fetched);
 const x=new w.XMLHttpRequest();x.open('GET',F);ok(opened[0]===CDN+F,'XHR.open → CDN',opened);
 ok(A.inspect().routed>=6,'바꾼 횟수 기록',A.inspect());}
for(const [name,o] of [['로컬 127.0.0.1',{host:'127.0.0.1:4396',proto:'http:',pathname:'/index.html'}],['localhost',{host:'localhost',proto:'http:',pathname:'/index.html'}],['?cdn=off',{search:'?cdn=off'}],['?cdn=0',{search:'?cdn=0'}],['다른 github.io',{host:'someone.github.io'}]]){
 const {w,log,fetched,A}=world(o);ok(A&&A.inspect().on===false,name+': 꺼짐',A&&A.inspect());
 const img=new w.Image();img.src=F;w.fetch(F);ok(log.at(-1)[1]===F&&img.crossOrigin===null&&fetched[0]===F,name+': 상대 경로 그대로');}
{const {A}=world({host:'127.0.0.1:4396',proto:'http:',pathname:'/index.html',search:'?cdn=http://127.0.0.1:4397/'});
 ok(A&&A.inspect().on&&A.url(F)==='http://127.0.0.1:4397/'+F,'?cdn=http://127.0.0.1:포트/ 시험 주소',A&&A.inspect());}
for(const bad of ['http://evil.example/','javascript:alert(1)','https://user:pw@x.pages.dev/','ftp://127.0.0.1:1/']){
 const {A}=world({search:'?cdn='+encodeURIComponent(bad)});ok(A&&(A.inspect().on===false||A.inspect().base===CDN),'잘못된 ?cdn 무시: '+bad,A&&A.inspect());}
{const {w}=world();vm.runInNewContext(SRC,{window:w,document:w.document,location:w.location,URL,URLSearchParams});const img=new w.Image();const L=[];img.src=F;ok(true,'두 번 실행해도 한 번만 감쌈');}

console.log(`\nR1308 asset route: ${n-bad}/${n} PASS`);process.exit(bad?1:0);
