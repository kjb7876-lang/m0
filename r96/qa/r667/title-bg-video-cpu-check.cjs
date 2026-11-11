// R667 CPU 검사: 타이틀 화면(메인 메뉴) 뒤 10초 이음매 없는 배경 루프 영상.  node r96/qa/r667/title-bg-video-cpu-check.cjs
//  사용자 2026-11-11 "타이틀 화면 배경 영상 (메인 메뉴 뒤에 천천히 움직이는 10초 루프)".
//  · 연결: 소스=런타임 사본, 스크립트 태그(독립 줄, combat-r118 앞), verify-r96-public 목록, pages.yml, 매니페스트(js·영상·포스터·목록)
//  · Cloudflare(R615): 영상 폴더 assets/r667/title-video/ 가 asset-cdn.json·asset-cdn-r615.js 대상이고 Pages 배포본에서는 뺌, 포스터는 Pages 에 남김
//  · 자산: index.json 크기·sha256·원본·처리·적용, mp4 faststart·960×540·10초·1MB 이하, 포스터 JPEG 150KB 이하
//  · 동작(가짜 브라우저): 타이틀일 때만 #modal 안 #panel 뒤에 깔림·음소거 반복 재생, 게임 시작·창 닫힘이면 치우고 디코더 풀어 줌,
//    다시 타이틀이면 다시, Cloudflare 실패 → GitHub 한 번 → 실패면 정지 이미지, 재생 거부(자동 재생 막힘)면 정지 이미지,
//    움직임 줄이기·데이터 절약 = 정지 이미지만, 끄기 = 아무것도 안 함, 자동 검사(webdriver)는 ?title667=1 일 때만,
//    탭 숨김이면 멈춤, 두 번 실행해도 하나, 게임 tick·draw 는 건드리지 않음
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='title-bg-video-r667.js',VID='assets/r667/title-video/loop.mp4',POSTER='assets/r667/title-poster.jpg',IDXP='assets/r667/index.json',PREFIX='assets/r667/title-video/';
let src='';try{src=C(F);}catch(_){}
ok(F+' exists',!!src);ok(F+' runtime copy matches source',!!src&&src===RT(F));
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html'),tag='"./'+F+'"';
ok('script tag once on its own line (outside the r176/r266 tag chains), before combat-r118',html.split(tag).length===2&&html.includes('\n<script src='+tag+'></script>\n')&&html.indexOf(tag)<html.lastIndexOf('"./combat-r118.js"'));
const ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');
ok('verify-r96-public.py lists js (no missing comma)',ver.includes("'"+F+"'")&&!/\.js''/.test(ver));
ok('pages.yml runs this check',/node r96\/qa\/r667\/title-bg-video-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}
ok('runtime-manifest has overlay, video, poster, index',[F,VID,POSTER,IDXP].every(p=>man.includes('"'+p+'"')));
// ---- Cloudflare(R615) ----
let CFG={};try{CFG=JSON.parse(fs.readFileSync(path.join(R,'asset-cdn.json'),'utf8'));}catch(_){}
let EX={};try{EX=JSON.parse(fs.readFileSync(path.join(R,'pages-exclude.json'),'utf8'));}catch(_){}
const cdnSrc=C('asset-cdn-r615.js');
ok('asset-cdn.json prefixes include title video folder (voice kept)',Array.isArray(CFG.prefixes)&&CFG.prefixes.includes(PREFIX)&&CFG.prefixes.includes('assets/r381/voice/'));
ok('asset-cdn-r615.js PREFIXES include title video folder',/PREFIXES=\[[^\]]*'assets\/r667\/title-video\/'/.test(cdnSrc)&&/PREFIXES=\[[^\]]*'assets\/r381\/voice\/'/.test(cdnSrc));
ok('asset-cdn-r615 runtime copy matches source',cdnSrc===RT('asset-cdn-r615.js'));
const ex=(EX.exclude||[]).find(x=>x.prefix===PREFIX);
ok('Pages 배포본에서 영상 폴더만 뺌(이유에 Cloudflare)',!!ex&&/Cloudflare/.test(ex.reason||''));
ok('poster stays on Pages (not excluded)',!(EX.exclude||[]).some(x=>POSTER.startsWith(x.prefix)));
// ---- 자산 ----
let IDX=null;try{IDX=JSON.parse(RT(IDXP));}catch(_){}
ok('index.json lists video and poster',!!IDX&&Array.isArray(IDX.files)&&[VID,POSTER].every(p=>IDX.files.some(f=>f.path===p)));
for(const f of IDX?.files||[]){let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(f.path+' size·sha256 match',!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256);
 ok(f.path+' table: source·use·process·applied',f.applied===true&&!!f.use&&!!f.process&&/opening-hapil\.mp4/.test(f.source||''));}
let mp4=null;try{mp4=fs.readFileSync(path.join(R,'runtime-text',VID));}catch(_){}
function box(b,name,from=0){const i=b.indexOf(name,from);return i<0?-1:i;}
if(mp4){ok('mp4 faststart ≤1MB ('+mp4.length+')',mp4.slice(4,8).toString()==='ftyp'&&mp4.length<=1000000&&box(mp4,'moov')>0&&box(mp4,'moov')<box(mp4,'mdat'));
 const mv=box(mp4,'mvhd');const ver0=mp4[mv+4];const ts=ver0?mp4.readUInt32BE(mv+24):mp4.readUInt32BE(mv+16),du=ver0?Number(mp4.readBigUInt64BE(mv+28)):mp4.readUInt32BE(mv+20);
 const sec=du/ts;ok('mp4 is about 10 s ('+sec.toFixed(3)+')',sec>9.9&&sec<10.1);
 const tk=box(mp4,'tkhd');const tv=mp4[tk+4];const wo=tk+(tv?92:80);const w=mp4.readUInt32BE(wo)/65536,h=mp4.readUInt32BE(wo+4)/65536;
 ok('mp4 is 960×540 ('+w+'×'+h+')',w===960&&h===540);
 ok('mp4 has no audio track',!mp4.includes(Buffer.from('soun')));}
else ok('mp4 present',false);
let pst=null;try{pst=fs.readFileSync(path.join(R,'runtime-text',POSTER));}catch(_){}
ok('poster JPEG ≤150KB',!!pst&&pst[0]===0xff&&pst[1]===0xd8&&pst.length<=150000);
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');const code=strip(src);
ok('does not touch tick, draw, game state, ctx.filter',!/\btick\s*=|\bdraw\s*=|\.hp\s*=|saveGame\(|ctx\.filter/.test(code));
ok('title panel keeps its warm brown colours, only more transparent (no blue panel)',/rgba\(39,33,27,\.8/.test(src)&&!/#273740/.test(src));
ok('no backdrop blur on the title while video shows (perf)',/backdrop-filter:none/.test(src));
// ---- 가짜 브라우저 ----
class El{constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.style={};this._id='';this._cls=new Set();this.attrs={};this.ls={};
  const self=this;this.classList={add:c=>{self._cls.add(c);doc.__mut();},remove:c=>{self._cls.delete(c);doc.__mut();},contains:c=>self._cls.has(c),toggle:(c,on)=>{if(on===undefined)on=!self._cls.has(c);on?self._cls.add(c):self._cls.delete(c);doc.__mut();return on;}};
  if(this.tagName==='VIDEO'){this.paused=true;this.muted=false;this.loop=false;this.playsInline=false;this.src='';this.plays=0;this.pauses=0;this.loads=0;}}
 get id(){return this._id;}set id(v){this._id=String(v);}
 get className(){return [...this._cls].join(' ');}set className(v){this._cls=new Set(String(v).split(/\s+/).filter(Boolean));}
 get isConnected(){let n=this;while(n){if(n===this.doc.body||n===this.doc.head)return true;n=n.parentNode;}return false;}
 get firstChild(){return this.children[0]||null;}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v;if(k==='src')this.src=String(v);}
 getAttribute(k){return k in this.attrs?this.attrs[k]:null;}
 removeAttribute(k){delete this.attrs[k];if(k==='src')this.src='';}
 appendChild(c){return this.insertBefore(c,null);}
 insertBefore(c,ref){if(c.parentNode)c.remove();const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(c);else this.children.splice(i,0,c);c.parentNode=this;this.doc.__mut();return c;}
 remove(){if(!this.parentNode)return;const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null;this.doc.__mut();}
 set innerHTML(v){for(const c of this.children)c.parentNode=null;this.children=[];this._html=String(v);
  for(const m of String(v).matchAll(/id="([^"]+)"/g)){const e=new El('button',this.doc);e.id=m[1];e.parentNode=this;this.children.push(e);}this.doc.__mut();}
 get innerHTML(){return this._html||'';}
 set textContent(v){this._text=String(v);}get textContent(){return this._text||'';}
 walk(f){for(const c of this.children){if(f(c))return c;const r=c.walk(f);if(r)return r;}return null;}
 querySelector(s){if(s[0]==='#')return this.walk(e=>e.id===s.slice(1));const t=s.toUpperCase();return this.walk(e=>e.tagName===t);}
 addEventListener(t,f){(this.ls[t]=this.ls[t]||[]).push(f);}removeEventListener(t,f){this.ls[t]=(this.ls[t]||[]).filter(x=>x!==f);}
 fire(t){for(const f of (this.ls[t]||[]).slice())f({type:t,target:this});const on=this['on'+t];if(typeof on==='function')on({type:t,target:this});}
 play(){this.plays++;if(this.doc.__g.__playReject)return Promise.reject(new Error('NotAllowedError'));this.paused=false;
  if(this.doc.__g.__playPending)return new Promise((res,rej)=>{this._pend={res,rej};});return Promise.resolve();}
 pause(){this.pauses++;this.paused=true;if(this._pend){const p=this._pend;this._pend=null;const e=new Error('The play() request was interrupted by a call to pause()');e.name='AbortError';p.rej(e);}}load(){this.loads++;}}
function env(o={}){const store=new Map(Object.entries(o.store||{}));const g={console,__timers:[],__mos:[],__fails:[],__playReject:!!o.playReject,__playPending:!!o.playPending};
 const doc={__g:g,hidden:false,ls:{},__mut(){g.__dirty=true;},addEventListener(t,f){(this.ls[t]=this.ls[t]||[]).push(f);},
  createElement:t=>new El(t,doc),getElementById:id=>doc.body.walk(e=>e.id===id)||doc.head.walk(e=>e.id===id),querySelector:s=>doc.body.querySelector(s)};
 doc.body=new El('body',doc);doc.head=new El('head',doc);doc.documentElement=doc.body;
 const modal=new El('div',doc);modal.id='modal';const panel=new El('section',doc);panel.id='panel';modal.appendChild(panel);doc.body.appendChild(modal);
 const cdn=o.cdn||null;
 Object.assign(g,{document:doc,localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  navigator:{webdriver:!!o.webdriver,connection:o.saveData?{saveData:true}:{}},location:{search:o.search||''},
  matchMedia:q=>({matches:!!o.reduced&&/prefers-reduced-motion:\s*reduce/.test(q),addEventListener(){}}),
  setTimeout:(f,ms)=>{g.__timers.push(f);return g.__timers.length;},clearTimeout:()=>{},
  MutationObserver:class{constructor(f){this.f=f;g.__mos.push(this);}observe(){this.on=true;}disconnect(){this.on=false;}},
  Promise,URLSearchParams,addEventListener(){}});
 if(cdn)g.__STORYWORLD_ASSET_CDN__={ready:Promise.resolve(cdn.on),url:p=>cdn.on&&p.startsWith(PREFIX)?'https://cdn.example/'+p:p,local:u=>String(u).replace('https://cdn.example/',''),
  isCdn:u=>String(u).startsWith('https://cdn.example/'),fail:(u,w)=>g.__fails.push(u),ok(){} ,inspect:()=>({state:cdn.on?'on':'down'})};
 g.window=g;vm.createContext(g);
 vm.runInContext(`var started=false,modal=false;function showTitle(){modal=true;document.getElementById('panel').innerHTML='<h1>합일몽세</h1><button id="newBtn"></button><button id="continueBtn"></button>';document.getElementById('modal').classList.remove('hidden');}
 function openPanel(h){modal=true;document.getElementById('panel').innerHTML=h;document.getElementById('modal').classList.remove('hidden');}
 function closePanel(){modal=false;document.getElementById('modal').classList.add('hidden');}`,g);
 vm.runInContext(src,g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
async function flush(g,n=4){for(let k=0;k<n;k++){if(g.__dirty){g.__dirty=false;for(const m of g.__mos)if(m.on)m.f([]);}const t=g.__timers.splice(0);for(const f of t)f();await new Promise(r=>setImmediate(r));}}
const root=g=>g.document.getElementById('r667t'),vid=g=>root(g)?.querySelector('video')||null,modalEl=g=>g.document.getElementById('modal');
const api=g=>g.__STORYWORLD_TITLE_BG_R667__;
(async()=>{
{const g=env();ok('API exposed',!!api(g)&&typeof api(g).inspect==='function'&&typeof api(g).sync==='function');
 ok('style injected once',g.document.head.children.filter(e=>e.id==='r667style').length===1);
 run(g,'showTitle()');await flush(g);
 const r=root(g),v=vid(g),m=modalEl(g);
 ok('title: root inside #modal, before #panel',!!r&&r.parentNode===m&&m.children.indexOf(r)<m.children.indexOf(g.document.getElementById('panel')));
 ok('title: #modal gets r667on class',m.classList.contains('r667on'));
 ok('title: video muted, loop, playsInline, no controls, playing',!!v&&v.muted===true&&v.loop===true&&v.playsInline===true&&!v.controls&&v.plays>=1&&v.paused===false);
 ok('no CDN API: plays the local copy',!!v&&v.src===VID);
 ok('poster shown underneath while loading',/r667\/title-poster\.jpg/.test(String(r?.style?.backgroundImage||'')));
 v.fire('playing');await flush(g);ok('video fades in when playing',r.classList.contains('playing'));
 // 게임 시작(다른 창) → 치움
 run(g,"openPanel('<h2>영웅 선택</h2><button id=\"heroPick\"></button>')");await flush(g);
 ok('other panel: root removed, class removed',!root(g)&&!m.classList.contains('r667on'));
 ok('other panel: video paused and decoder released (src cleared + load)',v.paused===true&&v.src===''&&v.loads>=1);
 run(g,'showTitle()');await flush(g);ok('back to title: shown again',!!root(g)&&!!vid(g)&&vid(g).plays>=1&&m.classList.contains('r667on'));
 run(g,'closePanel()');await flush(g);ok('modal hidden: removed',!root(g)&&!m.classList.contains('r667on'));
 run(g,'showTitle()');await flush(g);
 g.document.hidden=true;for(const f of g.document.ls.visibilitychange||[])f();ok('tab hidden: paused',vid(g).paused===true);
 g.document.hidden=false;for(const f of g.document.ls.visibilitychange||[])f();await flush(g);ok('tab visible: plays again',vid(g).paused===false);
 const before=g.document.getElementById('modal').children.length;run(g,'showTitle();showTitle();');await flush(g);
 ok('repeated showTitle keeps one root',g.document.getElementById('modal').children.filter(e=>e.id==='r667t').length===1&&g.document.getElementById('modal').children.length===before);
 ok('campaignNew54 title variant also counts',(run(g,"openPanel('<button id=\"campaignNew54\"></button>')"),await flush(g),!!root(g)));
 const n=g.document.head.children.length;vm.runInContext(src,g);ok('second load is a no-op',g.document.head.children.length===n&&!!api(g));}
// Cloudflare 켜짐 → 외부 주소, 실패하면 GitHub 한 번, 또 실패면 정지 이미지
{const g=env({cdn:{on:true}});run(g,'showTitle()');await flush(g,6);const v=vid(g);
 ok('CDN on: video from Cloudflare',!!v&&v.src==='https://cdn.example/'+VID);
 v.fire('error');await flush(g);const v2=vid(g);
 ok('CDN error: reported to R615 and retried once from GitHub Pages',g.__fails.length===1&&!!v2&&v2.src===VID);
 v2.fire('error');await flush(g);
 ok('local error too: video gone, poster stays',!vid(g)&&!!root(g)&&/title-poster/.test(String(root(g).style.backgroundImage||'')));
 run(g,"openPanel('<b id=\"x\"></b>')");await flush(g);run(g,'showTitle()');await flush(g,6);
 ok('after both failed this session: no more video tries (poster only)',!!root(g)&&!vid(g));
 ok('inspect reports fallback',api(g).inspect().mode==='poster'&&api(g).inspect().errors>=2);}
{const g=env({cdn:{on:true}});const A=g.__STORYWORLD_ASSET_CDN__;delete g.__STORYWORLD_ASSET_CDN__;run(g,'showTitle()');g.__STORYWORLD_ASSET_CDN__=A;await flush(g,6);
 ok('R615 API loaded after this script (tag order): still used',vid(g)?.src==='https://cdn.example/'+VID);}
// Codex P2(#414): 첫 재생이 Cloudflare 로 잘 됐으면, 다른 창 갔다 타이틀로 돌아와도 다시 Cloudflare 주소(Pages 에는 영상이 없다)
{const g=env({cdn:{on:true}});run(g,'showTitle()');await flush(g,6);vid(g).fire('playing');await flush(g);
 run(g,"openPanel('<b id=\"slots\"></b>')");await flush(g);run(g,'showTitle()');await flush(g,6);
 ok('back to title after CDN success: CDN URL again (not the Pages-excluded local path)',vid(g)?.src==='https://cdn.example/'+VID&&api(g).inspect().mode!=='poster');
 run(g,"openPanel('<b id=\"slots\"></b>')");await flush(g);run(g,'showTitle()');await flush(g,6);
 ok('third visit: still CDN',vid(g)?.src==='https://cdn.example/'+VID);}
// Codex P2(#414): 첫 play() 가 끝나기 전에 탭을 숨기면 pause() 가 AbortError 로 끊는다 — 영구 실패로 치지 않고 돌아오면 다시 재생
{const g=env({playPending:true});run(g,'showTitle()');await flush(g,6);const v=vid(g);
 g.document.hidden=true;for(const f of g.document.ls.visibilitychange||[])f();await flush(g);
 ok('tab hidden during pending play(): video kept (AbortError is not a failure)',!!vid(g)&&vid(g)===v&&api(g).inspect().mode!=='poster');
 g.__playPending=false;g.document.hidden=false;for(const f of g.document.ls.visibilitychange||[])f();await flush(g);
 ok('tab visible again: plays',!!vid(g)&&vid(g).paused===false&&vid(g).plays>=2);}
{const g=env({cdn:{on:false}});run(g,'showTitle()');await flush(g,6);ok('CDN down: local copy',vid(g)?.src===VID);}
// 자동 재생 거부
{const g=env({playReject:true});run(g,'showTitle()');await flush(g,6);
 ok('autoplay rejected: poster stays, no throw, video removed',!!root(g)&&!vid(g)&&/title-poster/.test(String(root(g).style.backgroundImage||'')));}
// 정지 이미지만
{const g=env({reduced:true});run(g,'showTitle()');await flush(g);ok('reduced motion: poster only',!!root(g)&&!vid(g)&&modalEl(g).classList.contains('r667on'));}
{const g=env({saveData:true});run(g,'showTitle()');await flush(g);ok('save-data: poster only',!!root(g)&&!vid(g));}
// 끄기
{const g=env({store:{'storyworld.r667.titlebg':JSON.stringify({on:false})}});run(g,'showTitle()');await flush(g);ok('setting off: nothing',!root(g)&&!modalEl(g).classList.contains('r667on'));
 api(g).set({on:true});run(g,'showTitle()');await flush(g);ok('set({on:true}) turns it back on',!!root(g));
 api(g).set({on:false});await flush(g);ok('set({on:false}) removes it right away',!root(g));}
// 자동 검사
{const g=env({webdriver:true});run(g,'showTitle()');await flush(g);ok('webdriver: off by default (CI title baselines unchanged)',!root(g));}
{const g=env({webdriver:true,search:'?title667=1'});run(g,'showTitle()');await flush(g);ok('webdriver + ?title667=1: on',!!root(g)&&!!vid(g));}
// 시작 화면이 열린 채로 로드된 경우(스크립트가 늦게 붙음)
{const g=env();run(g,"document.getElementById('panel').innerHTML='<button id=\"newBtn\"></button>'");g.__dirty=false;
 const g2=g;vm.runInContext('delete window.__STORYWORLD_TITLE_BG_R667__',g2);vm.runInContext(src,g2);await flush(g2);ok('title already open at load: picked up',!!root(g2));}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL crash',e&&e.stack||e);process.exit(1);});
