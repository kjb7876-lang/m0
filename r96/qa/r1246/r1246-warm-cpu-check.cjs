// R1246b CPU 검사 — 사몽 각성 첫 장면 그림 예열(awake-warm-r1246.js).
//  가짜 엔진 전역(imageCache·readyImage·addImage·ensureImages·player·loading)으로: 지금 형상 목록을 한 번에 한 장씩만 미리 읽는지,
//  불러오는 중·각성 중·끄기면 쉬는지, 같은 그림을 두 번 요청하지 않는지, 각성 4초 안에 처음 읽힌 그림을 형상별로 배워 저장하는지(40장 상한),
//  기본 표가 10형상 모두 있는지, 빌드 연결 다섯 곳을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='awake-warm-r1246.js',API='__STORYWORLD_AWAKE_WARM_R1246__';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'① 오버레이 파일 있음');
function mk(pre={}){const store={...pre};const timers=[];const asked=[];
 const ctx={Math,Number,Object,String,JSON,Array,Set,Map,Date,console,Promise,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  setInterval:(f)=>{timers.push(f);return timers.length;},addEventListener:()=>{},document:{readyState:'complete'},performance:{now:()=>ctx.__now}};
 ctx.window=ctx;ctx.__now=0;ctx.loading=false;ctx.modal=null;ctx.time=0;
 ctx.imageCache=new Map();ctx.readyImage=p=>{const r=ctx.imageCache.get(p);return r&&r.ready?r:null;};
 ctx.addImage=function(p){asked.push(p);if(!ctx.imageCache.has(p))ctx.imageCache.set(p,{path:p,ready:true});return ctx.imageCache.get(p);};
 ctx.ensureImages=ps=>Promise.all(ps.map(p=>ctx.addImage(p)));
 ctx.player={hero:'michaela',hp:100,samong:0,samongCD:20};
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 const tick=k=>{for(let i=0;i<k;i++){ctx.__now+=400;ctx.time+=.4;for(const f of timers)f();}};return {ctx,store,asked,tick,api:ctx[API]};}
if(src){
 {const {ctx,asked,tick,api}=mk();ok(!!api&&typeof api.inspect==='function','① API '+API);
  const forms=api.forms();ok(['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'].every(f=>(api.list(f)||[]).length>0),'① 기본 표 8영웅 모두 있음(EGO·페르소나는 측정상 첫 각성 새 그림 0장 → 배우기만) '+JSON.stringify(forms));
  ok(api.list('michaela').includes('assets/r948/mh03-heart24.webp'),'① 미카엘라 표에 연심 대개화 시트(mh03-heart24) 있음');
  ok(api.list('michaela').every(p=>/^assets\/[\w\-./]+\.(webp|png)$/.test(p)),'① 표 경로는 assets/ 그림만');
  asked.length=0;tick(1);ok(asked.length<=1,'② 한 틱에 한 장 이하('+asked.length+')');
  tick(80);const L=api.list('michaela');ok(L.every(p=>ctx.imageCache.has(p)),'② 지금 형상 목록을 모두 미리 읽음('+L.length+'장)');
  ok(new Set(asked).size===asked.length,'② 같은 그림을 두 번 요청하지 않음');
  const nAsk=asked.length;tick(20);ok(asked.length===nAsk,'② 다 읽은 뒤엔 더 요청 안 함');
  // 지역 이동으로 그림 기억이 비워져도(엔진 imageCache.clear) 테두리는 R154 가 기억하므로 다시 읽지 않는다
  ctx.imageCache.clear();tick(20);ok(asked.length===nAsk,'② 지역 이동 뒤 다시 읽지 않음(세션당 한 번)');}
 {const {ctx,asked,tick}=mk();ctx.loading=true;tick(10);ok(asked.length===0,'③ 불러오는 중엔 쉼');ctx.loading=false;
  ctx.player.samong=5;tick(10);ok(asked.length===0,'③ 각성 중엔 쉼(각성 장면에 얹지 않음)');ctx.player.samong=0;
  ctx.player.hp=0;tick(10);ok(asked.length===0,'③ 쓰러져 있으면 쉼');ctx.player.hp=100;tick(1);ok(asked.length===1,'③ 다시 움직이면 이어서');}
 {const {asked,tick}=mk({'storyworld.r1246.awakeWarm':'0'});tick(20);ok(asked.length===0,'③ 끄기(storyworld.r1246.awakeWarm=0) 면 아무것도 안 함');}
 {const {ctx,asked,tick,api}=mk();ctx.player.hero='lauren';ctx.player.personaHeroR1113=true;ok(api.form()==='persona','④ 페르소나 형상 = 라우렌+표식');tick(60);ok(!asked.some(p=>/lauren/.test(p)),'④ 페르소나는 라우렌 표를 읽지 않음(라우렌 흔적 금지)');
  ctx.player.personaHeroR1113=false;ctx.player.hero='hwando';ctx.player.egoSovereignR1046=true;ok(api.form()==='ego','④ EGO 형상 = 환도+표식');}
 {const {ctx,store,tick,api}=mk();tick(80);ctx.player.samong=8;tick(1);/* 각성 시작 */
  ctx.addImage('assets/r999/new-sheet.webp');ctx.addImage('assets/r999/new-sheet.webp');tick(1);
  let saved={};try{saved=JSON.parse(store['storyworld.r1246.awakeLearn']||'{}');}catch(_){}
  ok((saved.michaela||[]).filter(p=>p==='assets/r999/new-sheet.webp').length===1,'⑤ 각성 4초 안에 처음 읽힌 그림을 배워 저장(중복 없이) '+JSON.stringify(saved));
  ok(api.list('michaela').includes('assets/r999/new-sheet.webp'),'⑤ 배운 그림은 다음 예열 목록에 들어감');
  ctx.__now+=6000;ctx.time+=6;tick(1);ctx.addImage('assets/r999/late.webp');tick(1);try{saved=JSON.parse(store['storyworld.r1246.awakeLearn']||'{}');}catch(_){}
  ok(!(saved.michaela||[]).includes('assets/r999/late.webp'),'⑤ 각성 4초 뒤 그림은 배우지 않음');
  ctx.player.samong=0;tick(2);for(let i=0;i<60;i++){ctx.player.samong=8;tick(1);ctx.addImage('assets/r998/x'+i+'.webp');ctx.player.samong=0;tick(1);}
  try{saved=JSON.parse(store['storyworld.r1246.awakeLearn']||'{}');}catch(_){}ok((saved.michaela||[]).length<=40,'⑤ 형상별 40장 상한('+(saved.michaela||[]).length+')');
  const i=api.inspect();ok(i.errors===0&&i.gameplayChanged===false,'⑥ inspect '+JSON.stringify({w:i.warmed,l:i.learned,e:i.errors}));}
 {const {ctx,tick}=mk({'storyworld.r1246.awakeLearn':'{"michaela":["../../evil.js","assets/ok.webp"]}'});tick(80);ok(!ctx.imageCache.has('../../evil.js')&&ctx.imageCache.has('assets/ok.webp'),'⑥ 저장된 목록도 assets/ 그림만 받음');}}
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};const html=RT('index.html');
ok(html.split('"./'+F+'"').length===2&&html.includes('<script src="./attack-over-hurt-r1246.js"></script>\n<script src="./'+F+'"></script>'),'⑦ index.html 태그 한 번(attack-over-hurt-r1246 바로 뒤)');
ok(!!src&&RT(F)===src,'⑦ runtime-text 사본 = client-source');
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}ok(man.includes('"'+F+'"'),'⑦ runtime-manifest 에 실림');
let ver='';try{ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');}catch(_){}ok(ver.includes("'"+F+"'"),'⑦ 공개 확인 목록');
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}ok(ci.includes('r96/qa/r1246/r1246-warm-cpu-check.cjs'),'⑦ CI 검사 줄');
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake engine globals; real game run by crop-probe.mjs (headless)'}));process.exit(bad?1:0);
