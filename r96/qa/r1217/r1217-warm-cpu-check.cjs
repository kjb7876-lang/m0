'use strict';
// R1217 ② — 첫 접속 첫 각성도 사몽 그림을 미리 올리기(사용자 2026-11-19 "1-4 개선적용").
//  R1199 warm 은 사몽 중 올라간 그림을 영웅별로 '배워' 두었다가 다음 준비 때 미리 올린다 → 첫 접속 첫 각성은 배운 것이 없어 첫 장면에 4~5백만 화소를 올렸다.
//  고침: 영웅·형상 10가지의 사몽 그림 기본 목록(samong-warm-r1217-data.js, 헤드리스 실측으로 뽑음)을 배운 목록과 합쳐 쓴다.
//   로딩 화면(loading)에 꿈 층으로 들어갈 때 그 목록 그림을 미리 읽고 디코드해 둔다(addImage) → 준비 때(대기 3초 이하) GPU 에 올리기만 한다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const FILE='samong-warm-r1199.js',DATA='samong-warm-r1217-data.js';
const src=fs.readFileSync(path.join(SRC,FILE),'utf8');ok(fs.readFileSync(path.join(RT,FILE),'utf8')===src,'runtime-text 사본 = client-source(warm)');
const hasData=fs.existsSync(path.join(SRC,DATA));ok(hasData,'기본 목록 파일 '+DATA+' 있음');
const dsrc=hasData?fs.readFileSync(path.join(SRC,DATA),'utf8'):'';ok(hasData&&fs.existsSync(path.join(RT,DATA))&&fs.readFileSync(path.join(RT,DATA),'utf8')===dsrc,'runtime-text 사본 = client-source(data)');
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');const iD=html.indexOf('src="./'+DATA+'"'),iW=html.indexOf('src="./'+FILE+'"');
ok(iD>0&&iW>iD,'index.html: 기본 목록이 warm 보다 먼저 실림');
ok(fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+DATA+"'"),'공개 확인 목록에 data');
ok(fs.readFileSync(path.join(ROOT,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1217/r1217-warm-cpu-check.cjs'),'pages.yml 이 이 검사를 돌림');
const D=(()=>{const sb={window:{}};sb.window=sb;vm.createContext(sb);if(dsrc)vm.runInContext(dsrc,sb);return sb.__STORYWORLD_SAMONG_WARM_DEFAULTS_R1217__||null;})();
const KEYS=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','hwando:ego','lauren:persona'];
ok(D&&KEYS.every(k=>Array.isArray(D[k])&&D[k].length>0&&D[k].length<=40&&D[k].every(p=>typeof p==='string'&&!/^https?:|^blob:|^data:/.test(p))),'영웅·형상 10가지 기본 목록(상대 경로, 각 1~40개): '+(D?KEYS.map(k=>k+' '+(D[k]||[]).length).join(', '):'없음'));
class Img{constructor(src,w,h){this.src=src;this.naturalWidth=w;this.naturalHeight=h;}}
function mk(opt={}){const store=new Map();if(opt.saved)store.set('storyworld.r1199.samongWarm',JSON.stringify(opt.saved));const uploads=[],asked=[],timers=[];
 class Scene{constructor(){this.textures=new Map();}texture(img){let r=this.textures.get(img);if(!r){r={texture:{img},refs:0};this.textures.set(img,r);}r.refs++;return r.texture;}release(img){const r=this.textures.get(img);if(r&&--r.refs===0)this.textures.delete(img);}}
 class Three{constructor(){this.commands=new Scene();this.renderer={initTexture:t=>uploads.push(t.img)};}render(frame){}}
 const three=new Three(),cache=new Map(),I=p=>new Img('https://h/m0/'+p,400,400);
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,setInterval:f=>{timers.push(f);return 1;},clearInterval(){},HTMLImageElement:Img,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>0},
  time:10,layer:opt.layer||'DREAM',loading:!!opt.loading,settings:{lowFx:false},player:{hero:opt.hero||'hwando',hp:50,samong:0,samongCD:opt.cd??0},
  readyImage:p=>{const im=cache.get(p);return im?{image:im,ready:true}:null;},addImage:p=>{asked.push(p);cache.set(p,I(p));return{promise:Promise.resolve()};},
  __STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 sb.window=sb;vm.createContext(sb);if(dsrc)vm.runInContext(dsrc,sb,{filename:DATA});vm.runInContext(src,sb,{filename:FILE});const W=sb.__STORYWORLD_SAMONG_WARM_R1199__;
 return{sb,W,three,uploads,asked,cache,tick:()=>{for(const f of timers)f();},frame:()=>three.render({commands:[]})};}
if(D){
 // 배운 것이 없어도(첫 접속) 기본 목록으로 미리 올림
 let m=mk({cd:0});for(const p of D.hwando)m.cache.set(p,{__proto__:Img.prototype,src:'https://h/m0/'+p,naturalWidth:400,naturalHeight:400});
 for(let i=0;i<40;i++)m.frame();ok(m.uploads.length===D.hwando.length,'첫 접속(배운 것 없음): 준비되면 기본 목록 '+D.hwando.length+'장을 미리 올림('+m.uploads.length+')');
 ok(m.W.list('hwando').length===D.hwando.length,'list(hwando) = 기본 목록');
 m=mk({cd:0,saved:{hwando:['x/learned.webp',D.hwando[0]]}});ok(m.W.list('hwando')[0]==='x/learned.webp'&&m.W.list('hwando').filter(p=>p===D.hwando[0]).length===1&&m.W.list('hwando').length<=40,'배운 목록이 먼저, 기본 목록과 겹치지 않게 합침(최대 40)');
 // 로딩 화면: 꿈 층으로 들어가는 로딩 중에 미리 읽기
 m=mk({cd:50,loading:true});m.tick();ok(D.hwando.every(p=>m.asked.includes(p))&&m.uploads.length===0,'로딩 화면(꿈 층): 목록 그림을 미리 읽음(읽기 '+m.asked.length+'·올림 0)');
 const a0=m.asked.length;m.tick();ok(m.asked.length===a0,'같은 그림은 한 번만 읽기 요청');
 m=mk({cd:50,loading:true,layer:'STORY'});m.tick();ok(m.asked.length===0,'꿈 층이 아니면 로딩 중 미리 읽지 않음');
 m=mk({cd:50,loading:false});m.tick();ok(m.asked.length===0,'로딩 화면이 아니면(대기 50초) 읽지 않음');
 m=mk({cd:50,loading:true,hero:'lauren'});m.sb.player.personaHeroR1113=true;m.tick();ok(D['lauren:persona'].every(p=>m.asked.includes(p)),'페르소나 형상은 lauren:persona 목록');
}
console.log(`\nR1217 warm CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
