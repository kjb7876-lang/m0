'use strict';
// R1199 ③ — 사몽 이펙트 텍스처 예열·붙잡기(samong-warm-r1199.js).
//  측정: 지역을 옮겨 다시 각성해도 첫 장면에 사몽 전용 이펙트 그림(환도 r590 문양 앞·뒤 각 88만 화소, attack-e 74만, r100 문양 3장…)을 매번 GPU 에 다시 올렸다(4~5백만 화소).
//  까닭: R89 가 쓰지 않는 텍스처를 20초 뒤(지역을 옮기면 곧바로) 버리는데 사몽 대기는 46~77초라 다음 각성 때는 늘 버려져 있다.
//  고침: 사몽 중 처음 올라간 그림 경로를 영웅(형상)별로 배워 두고(최대 40개, 저장), 다시 사몽을 쓸 수 있게 되면(꿈 층·대기 3초 이하) 장면당 예산만큼 미리 올리고
//   사몽이 끝날 때까지 붙잡는다(참조 하나). 준비도 각성도 아니면 놓아 준다(R89 가 20초 뒤 정리). 화면에 보이는 것은 같다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('PASS',m);};
const FILE='samong-warm-r1199.js';
const exists=fs.existsSync(path.join(SRC,FILE));ok(exists,'오버레이 파일 있음');
const src=exists?fs.readFileSync(path.join(SRC,FILE),'utf8'):'';
ok(exists&&fs.existsSync(path.join(RT,FILE))&&fs.readFileSync(path.join(RT,FILE),'utf8')===src,'runtime-text 사본 = client-source');
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');ok(html.includes('src="'+FILE+'"')||html.includes("src='"+FILE+"'")||html.includes(FILE),'index.html 에 스크립트 태그');
ok(fs.readFileSync(path.join(ROOT,'..','scripts','verify-r96-public.py'),'utf8').includes(FILE),'verify-r96-public.py 기대 목록');
ok(fs.readFileSync(path.join(ROOT,'..','.github','workflows','pages.yml'),'utf8').includes('r1199-warm-cpu-check.cjs'),'pages.yml 이 이 검사를 돌림');
class Img{constructor(src,w,h){this.src=src;this.naturalWidth=w;this.naturalHeight=h;}}
function mk(opt={}){const store=new Map();if(opt.saved)store.set('storyworld.r1199.samongWarm',JSON.stringify(opt.saved));
 const uploads=[],released=[];
 class Scene{constructor(){this.textures=new Map();}texture(img,m){let r=this.textures.get(img);if(!r){r={texture:{img},refs:0};this.textures.set(img,r);}r.refs++;return r.texture;}release(img){const r=this.textures.get(img);if(!r)return;released.push(img);if(--r.refs===0)this.textures.delete(img);}}
 class Three{constructor(){this.commands=new Scene();this.renderer={initTexture:t=>uploads.push(t.img)};}render(frame){for(const c of frame.commands||[])if(c.kind==='image')this.commands.texture(c.image,!!c.mutable);}}
 const three=new Three();const cache=new Map();const imgs={};const I=(p,w=940,h=940)=>imgs[p]||(imgs[p]=new Img('https://h/m0/'+p,w,h));
 const sb={console,Math,JSON,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Error,Promise,setTimeout,setInterval:()=>0,clearInterval(){},HTMLImageElement:Img,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>0},
  time:10,layer:opt.layer||'DREAM',settings:{lowFx:!!opt.lowFx},player:{hero:'hwando',hp:50,samong:0,samongCD:opt.cd??0},
  readyImage:p=>{const im=cache.get(p);return im?{image:im,ready:true}:null;},addImage:p=>{cache.set(p,I(p));return{promise:Promise.resolve()};},
  __STORYWORLD_PHASE1__:{controller:{state:{three}}}};
 if(opt.step!=null)sb.__STORYWORLD_PERF7_R1043__={step:()=>opt.step};
 if(opt.ego)sb.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>true};
 sb.window=sb;vm.createContext(sb);if(exists)vm.runInContext(src,sb,{filename:FILE});const W=sb.__STORYWORLD_SAMONG_WARM_R1199__;
 const frame=list=>{three.render({commands:list.map(p=>({kind:'image',image:typeof p==='string'?I(p):p,mutable:false}))});};
 const step=(list=[])=>{W&&W.tick&&W.tick();frame(list);};
 return{sb,W,three,frame,step,I,cache,uploads,released,store};}
if(!exists){console.log(`\nR1199 warm CPU ${n-bad}/${n} FAIL`);process.exit(1);}
// 배우기: 사몽 중 새로 올라간 그림만
let m=mk({cd:50});m.step(['world/floor.webp']);m.sb.player.samong=7;m.step(['world/floor.webp','r590/hwando-sigil-back.webp','r590/hwando-sigil-front.webp']);m.step(['r100/sig-hit-gold.webp']);
let L=m.W.learned('hwando');ok(L.length===3&&L.includes('r590/hwando-sigil-back.webp')&&!L.includes('world/floor.webp'),'사몽 중 처음 올라간 그림 경로만 배움('+L.join(',')+')');
ok(JSON.parse(m.store.get('storyworld.r1199.samongWarm')||'{}').hwando?.length===3,'배운 목록 저장');
m.sb.player.samong=0;m.step(['world/floor.webp']);m.sb.player.samong=7;m.step(['r100/sig-hit-gold.webp','vfx/new.webp']);ok(m.W.learned('hwando').length===4,'다음 사몽에서 새로 본 그림만 더함');
// 예열: 준비되면 미리 올리고 붙잡음
const saved={hwando:['r590/hwando-sigil-back.webp','r590/hwando-sigil-front.webp','hwando/attack-e.webp']};
m=mk({saved,cd:50});m.step();m.step();ok(m.uploads.length===0,'사몽 대기 50초면 예열 안 함');
m.sb.player.samongCD=3;m.step();ok(m.uploads.length===0,'준비 첫 장면: 그림 읽기 요청(아직 안 읽힘)');
for(let i=0;i<4;i++)m.step();ok(m.uploads.length===3,'준비되면 배운 그림 3장을 미리 올림('+m.uploads.length+')');
ok([...m.three.commands.textures.values()].every(r=>r.refs>=1)&&m.three.commands.textures.size===3,'올린 텍스처를 붙잡음(참조 1)');
// 예산: PC 장면당 150만 화소(94만 그림 → 장면당 1장)
m=mk({saved,cd:0});for(const p of saved.hwando)m.cache.set(p,m.I(p));m.step();ok(m.uploads.length===1,'장면당 예산 150만 화소: 94만 화소 그림은 장면당 1장('+m.uploads.length+')');m.step();m.step();ok(m.uploads.length===3,'세 장면에 걸쳐 다 올림');
m.step();m.step();ok(m.uploads.length===3,'이미 올린 것은 다시 올리지 않음');
// 각성 중에도 붙잡고, 준비도 각성도 아니면 놓아 줌
m.sb.player.samong=7;m.sb.player.samongCD=77;m.step();ok(m.released.length===0,'각성 중에는 놓지 않음');
m.sb.player.samong=0;m.step();ok(m.released.length===3,'각성이 끝나고 대기가 길면 놓아 줌(R89 가 정리)');
m.sb.player.samongCD=2;for(let i=0;i<4;i++)m.step();ok(m.uploads.length===6,'다시 준비되면 또 미리 올림');
// 조건
m=mk({saved,cd:0,layer:'STORY'});for(const p of saved.hwando)m.cache.set(p,m.I(p));m.step();m.step();ok(m.uploads.length===0,'꿈 층이 아니면 예열 안 함');
m=mk({saved,cd:0,step:1});for(const p of saved.hwando)m.cache.set(p,m.I(p));m.step();m.step();ok(m.uploads.length===0,'성능 7단계 1(초저)은 예열 안 함');
m=mk({saved,cd:0,lowFx:true});for(const p of saved.hwando)m.cache.set(p,m.I(p));m.step();ok(m.uploads.length===1,'저사양도 장면당 최소 1장');
m=mk({saved:{...saved,'hwando:ego':['ego/x.webp']},cd:0,ego:true});m.cache.set('ego/x.webp',m.I('ego/x.webp'));m.step();ok(m.uploads.length===1&&m.uploads[0].src.endsWith('ego/x.webp'),'EGO 형상은 따로 배운 목록(hwando:ego)');
// 상한: 40개·한 장 400만 화소 넘으면 배우지 않음
m=mk({cd:50});m.sb.player.samong=7;const many=[];for(let i=0;i<50;i++)many.push('fx/a'+i+'.webp');m.step(many);ok(m.W.learned('hwando').length===40,'영웅별 최대 40개('+m.W.learned('hwando').length+')');
m=mk({cd:50});m.sb.player.samong=7;m.step([m.I('big/huge.webp',2100,2100)]);ok(m.W.learned('hwando').length===0,'한 장 400만 화소 넘는 그림은 배우지 않음');
// 장면이 바뀌면(지역 이동으로 CommandScene 새로) 붙잡은 것을 잊고 다시 올림
m=mk({saved,cd:0});for(const p of saved.hwando)m.cache.set(p,m.I(p));for(let i=0;i<3;i++)m.step();const u0=m.uploads.length;m.three.commands=new (m.three.commands.constructor)();for(let i=0;i<3;i++)m.step();
ok(u0===3&&m.uploads.length===6,'새 장면에서 다시 올림('+u0+'→'+m.uploads.length+')');
// 끄기
m=mk({saved,cd:0});m.W.set({on:false});for(const p of saved.hwando)m.cache.set(p,m.I(p));m.step();m.step();ok(m.uploads.length===0,'끄기 {on:false}');
console.log(`\nR1199 warm CPU ${n-bad}/${n} ${bad?'FAIL':'PASS'}`);process.exit(bad?1:0);
