// R1253 CPU 검사 — 사몽 첫 장면 GPU 텍스처 남은 몫(samong-gpu-warm-r1253.js).
//  가짜 엔진(R1199 목록 API·CommandScene texture/release·renderer.initTexture·readyImage·addImage·room·player)으로:
//  ① R1217 기본 목록에 측정 그림을 더하고(40장 상한·겹침 없음·원래 목록 유지), ② 스토리 층 보스방에서만 0.5초에 50만 화소씩 올려 쥐고,
//  ③ 꿈 층·보스 없음·불러오는 중·쓰러짐·성능 1단계·끄기면 안 하며, 각성 중엔 쥔 채로, 보스가 없어지면 놓는지, ④ 빌드 연결 다섯 곳을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='samong-gpu-warm-r1253.js',API='__STORYWORLD_SAMONG_GPU_WARM_R1253__';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'① 오버레이 파일 있음');
class Img{constructor(p,w,h){this.src='http://x/m0/'+p;this.naturalWidth=w;this.naturalHeight=h;}}
function mk(o={}){const store={...(o.store||{})};const timers=[];const up=[],rel=[];
 const lists={michaela:['assets/a.webp','assets/b.webp','assets/c.webp','assets/d.webp']};
 const S={texture(im){return {im};},release(im){rel.push(im);}};
 const ctx={Math,Number,Object,String,JSON,Array,Set,Map,WeakMap,console,Promise,HTMLImageElement:Img,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:f=>{timers.push(f);return 1;},performance:{now:()=>0}};
 ctx.window=ctx;ctx.layer=o.layer||'STORY';ctx.loading=false;ctx.settings={lowFx:false};
 ctx.player={hero:'michaela',hp:100,samong:0,samongCD:30};ctx.room={enemies:[{boss:true,hp:100},{hp:5}]};
 const cache=new Map();for(const p of ['assets/r1027/barrier.webp'])cache.set(p,{image:new Img(p,1000,400)});for(const p of lists.michaela)cache.set(p,{image:new Img(p,1000,400)});/* 40만 화소씩 */
 ctx.readyImage=p=>cache.get(p)||null;ctx.addImage=p=>{cache.set(p,{image:new Img(p,500,500)});return {};};
 ctx.__STORYWORLD_PHASE1__={controller:{state:{three:{commands:S,renderer:{initTexture:t=>up.push(t.im)}}}}};
 ctx.__STORYWORLD_SAMONG_WARM_R1199__={heroKey:()=>ctx.player.hero,list:k=>lists[k]||[]};
 if(o.step!=null)ctx.__STORYWORLD_PERF7_R1043__={step:()=>o.step};
 ctx.__STORYWORLD_SAMONG_WARM_DEFAULTS_R1217__=Object.freeze({lauren:Object.freeze(['assets/r1153/sigil-lauren.webp']),michaela:Object.freeze(Array.from({length:39},(_,i)=>'assets/m'+i+'.webp')),hwando:Object.freeze(['assets/h.webp'])});
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 const tick=k=>{for(let i=0;i<k;i++)for(const f of timers)f();};return {ctx,S,up,rel,tick,api:ctx[API]};}
if(src){
 {const {ctx,api}=mk();ok(!!api&&typeof api.inspect==='function','① API '+API);const D=ctx.__STORYWORLD_SAMONG_WARM_DEFAULTS_R1217__;
  ok(D.lauren[0]==='assets/r1153/sigil-lauren.webp'&&D.lauren.includes('assets/r561/lauren/lauren-crush-vortex.webp')&&D.lauren.includes('assets/r946/lauren-repulse.webp'),'① 라우렌 기본 목록 유지 + 측정 그림 더함 '+JSON.stringify(D.lauren));
  ok(D.michaela.length===40&&D.michaela.includes('assets/r1027/barrier.webp')&&!D.michaela.includes('assets/r948/heart-hit6.webp'),'① 형상별 40장 상한('+D.michaela.length+')');
  ok(Array.isArray(D.neon)&&D.neon.includes('assets/vfx/generated/v300/burst-impact.webp'),'① 목록이 없던 형상(네온)도 만듦');
  ok(D.hwando.length===1&&Object.isFrozen(D)&&Object.isFrozen(D.lauren),'① 측정 안 한 형상은 그대로, 얼려 둠');
  api.tick();ok(ctx.__STORYWORLD_SAMONG_WARM_DEFAULTS_R1217__===D,'① 두 번 합치지 않음');}
 {const {ctx,up,rel,tick,api}=mk();tick(1);ok(up.length===1,'② 보스방: 한 틱에 50만 화소까지(40만 화소 한 장) '+up.length);
  ok(/r1027\/barrier/.test(up[0].src),'② 대본 각성 공통 그림(보호막)부터 올림');tick(4);ok(up.length===5&&new Set(up).size===5,'② 영웅 목록 + 공통 1장을 모두 올림, 같은 그림 두 번 안 올림('+up.length+')');tick(3);ok(up.length===5,'② 다 올린 뒤엔 더 안 올림');
  ctx.player.samong=7;ctx.room.enemies[0].hp=0;tick(2);ok(rel.length===0,'③ 각성 중엔 쥔 채로(보스가 쓰러져도)');
  ctx.player.samong=0;tick(1);ok(rel.length===5&&api.inspect().held===0,'③ 각성이 끝나고 보스가 없으면 놓음('+rel.length+')');
  ctx.room.enemies[0].hp=50;tick(1);ok(up.length===6,'③ 다시 보스가 있으면 다시 올림');}
 {const {up,tick}=mk({layer:'DREAM'});tick(5);ok(up.length===0,'③ 꿈 층은 R1199 몫이라 안 함');}
 {const {ctx,up,tick}=mk();ctx.room.enemies[0].boss=false;tick(5);ok(up.length===0,'③ 보스 없는 방은 안 함');}
 {const {ctx,up,tick}=mk();ctx.loading=true;tick(3);ok(up.length===0,'③ 불러오는 중엔 안 함');ctx.loading=false;ctx.player.hp=0;tick(3);ok(up.length===0,'③ 쓰러져 있으면 안 함');}
 {const {up,tick}=mk({step:1});tick(5);ok(up.length===0,'③ 성능 1단계(초저)는 안 함');}
 {const {up,tick}=mk({store:{'storyworld.r1253.gpuWarm':'0'}});tick(5);ok(up.length===0,'③ 끄기(storyworld.r1253.gpuWarm=0)');}
 {const {ctx,up,tick,rel}=mk();tick(9);ctx.player.hero='hwando';tick(1);ok(rel.length===5,'③ 영웅을 바꾸면 앞 영웅 그림을 놓음');
  ctx.__STORYWORLD_PHASE1__.controller.state.three.commands={texture(im){return {im};},release(){}};tick(1);ok(up.length>=5,'③ 장면이 바뀌어도 오류 없음');}
 {const {tick,api}=mk();tick(3);const i=api.inspect();ok(i.errors===0&&i.gameplayChanged===false,'④ inspect '+JSON.stringify({u:i.uploads,h:i.held,e:i.errors}));}}
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};const html=RT('index.html');
ok(html.split('"./'+F+'"').length===2&&html.includes('<script src="./samong-warm-r1199.js"></script>')&&html.indexOf('"./'+F+'"')>html.indexOf('"./samong-warm-r1217-data.js"')&&html.indexOf('"./'+F+'"')>html.indexOf('"./samong-warm-r1199.js"'),'⑤ index.html 태그 한 번(R1217 목록·R1199 뒤)');
ok(!!src&&RT(F)===src,'⑤ runtime-text 사본 = client-source');
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}ok(man.includes('"'+F+'"'),'⑤ runtime-manifest 에 실림');
let ver='';try{ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');}catch(_){}ok(ver.includes("'"+F+"'"),'⑤ 공개 확인 목록');
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}ok(ci.includes('r96/qa/r1253/r1253-cpu-check.cjs'),'⑤ CI 검사 줄');
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake engine; real game run by gpu-probe.mjs (headless)'}));process.exit(bad?1:0);
