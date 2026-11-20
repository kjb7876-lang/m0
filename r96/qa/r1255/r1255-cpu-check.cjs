// R1255 CPU 검사 — 첫 사용 멈칫 세 가지(first-use-r1255.js).
//  가짜 엔진(imageCache·readyImage·CommandScene·renderer·final42·player)으로:
//  ① 에덴 경로 그림을 지우면 따로 쥐었다가 readyImage 로 다시 찾을 때 같은 객체를 돌려놓는지(다른 경로·src 빈 그림·20초 지난 것은 안 함),
//  ② F246 을 0.5초마다 ensure 하고 처음 만든 그림을 잡아 미리 올리는지, 보스가 있으면 F217 도, 그림이 버려지면 놓는지,
//  ③ 네온일 때 창 시트 3/4 사본을 텍스처로 바꿔 내고 release 도 짝 맞추는지, 모바일(R980 live)·다른 영웅·끄기면 원본 그대로인지, ④ 빌드 연결을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),F='first-use-r1255.js',API='__STORYWORLD_FIRST_USE_R1255__';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'① 오버레이 파일 있음');
function mk(o={}){const store={...(o.store||{})};const timers=[];let clock=0;const up=[],tex=[],rel=[];
 class Img{constructor(){this._src='';this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}get src(){return this._src;}set src(v){this._src=v;if(v){this.complete=true;this.naturalWidth=this._w||1280;this.naturalHeight=this._h||1280;}}getAttribute(k){return k==='src'?(this._src||null):null;}}
 const ctx={Math,Number,Object,String,JSON,Array,Set,Map,WeakMap,console,Promise,HTMLImageElement:Img,Image:Img,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:f=>{timers.push(f);return 1;},performance:{now:()=>clock},
  document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}})})},
  createImageBitmap:(im,opt)=>Promise.resolve({w:opt.resizeWidth,h:opt.resizeHeight,close(){}})};
 ctx.window=ctx;ctx.loading=false;ctx.player={hero:'hwando',hp:100};ctx.room={enemies:[{hp:5}]};
 ctx.imageCache=new Map();ctx.readyImage=function(p){const r=ctx.imageCache.get(p);return r&&r.ready?r:null;};
 const mkImg=(p,w,h)=>{const im=new Img();im._w=w;im._h=h;im.src='http://x/m0/'+p;return im;};ctx.__mkImg=mkImg;
 ctx.ensureImages=ps=>{for(const p of ps)if(!ctx.imageCache.has(p))ctx.imageCache.set(p,{ready:true,image:mkImg(p,1536,3072)});return Promise.resolve();};
 function CS(){this.textures=new Map();}CS.prototype.texture=function(im){tex.push(im);return {image:im};};CS.prototype.release=function(im){rel.push(im);};
 ctx.StoryPhase1={CommandScene:CS};const S=new CS();
 ctx.__STORYWORLD_PHASE1__={controller:{state:{three:{commands:S,renderer:{initTexture:t=>up.push(t.image)}}}}};
 const made={};ctx.__STORYWORLD_FINAL42_R88__={ensure(id){if(!made[id]){const im=new ctx.Image();im.src='http://x/m0/assets/final42-r88/effects/'+id+'/atlas.png';made[id]=im;}return Promise.resolve(true);}};ctx.__made=made;
 if(o.mobile)ctx.__STORYWORLD_MOBILE_MEMORY_R980__={inspect:()=>({live:true})};
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 const tick=(k,dt=500)=>{for(let i=0;i<k;i++){clock+=dt;for(const f of timers)f();}};
 return {ctx,S,up,tex,rel,tick,api:ctx[API],adv:ms=>{clock+=ms;},flush:()=>new Promise(r=>setImmediate(r))};}
(async()=>{if(src){
 {const {ctx,tick,api}=mk();ok(!!api&&typeof api.inspect==='function','① API '+API);
  const P='assets/r108/eden/smoke.webp',im=ctx.__mkImg(P,1024,1024);ctx.imageCache.set(P,{ready:true,image:im});tick(1);
  ok(ctx.readyImage(P)?.image===im,'① 읽기는 그대로');ctx.imageCache.delete(P);ok(!ctx.imageCache.has(P),'① 에덴 정리의 지우기는 그대로 지움(에덴 계산 유지)');
  const back=ctx.readyImage(P);ok(back?.image===im&&ctx.imageCache.get(P)?.image===im,'① 다른 모듈이 다시 찾으면 같은 그림 객체를 돌려놓음(다시 디코드·업로드 없음)');
  ctx.imageCache.delete(P);for(let i=0;i<5;i++){ctx.readyImage('assets/x.webp');}tick(45);ok(!ctx.readyImage(P),'① 20초 넘게 아무도 안 찾으면 놓음');
  const Q='assets/r200/other.webp';ctx.imageCache.set(Q,{ready:true,image:ctx.__mkImg(Q,10,10)});ctx.imageCache.delete(Q);ok(!ctx.readyImage(Q),'① 에덴 경로가 아니면 손대지 않음');
  const Z='assets/r108/eden/fire.webp',zi=ctx.__mkImg(Z,10,10);ctx.imageCache.set(Z,{ready:true,image:zi});zi.src='';ctx.imageCache.delete(Z);ok(!ctx.readyImage(Z),'① 이미 비운 그림(src 없음)은 돌려놓지 않음');
  api.set({eden:false});const Y='assets/r108/eden/ice.webp';ctx.imageCache.set(Y,{ready:true,image:ctx.__mkImg(Y,10,10)});ctx.imageCache.delete(Y);ok(!ctx.readyImage(Y),'① 끄기(eden:false)면 그대로');}
 {const {ctx,up,rel,tick,api}=mk();tick(1);const im=ctx.__made.F246;ok(!!im&&up.includes(im),'② F246 을 ensure 하고 처음 만든 그림을 잡아 미리 올림');
  ok(!ctx.__made.F217,'② 보스가 없으면 F217 은 안 함');ctx.room.enemies.push({boss:true,hp:9});tick(1);ok(!!ctx.__made.F217&&up.includes(ctx.__made.F217),'② 보스가 살아 있으면 F217 도');
  const n0=up.length;tick(10);ok(up.length===n0,'② 같은 그림은 한 번만 올림');ok(api.inspect().f42Ensures>=20,'② 0.5초마다 ensure 해 5초 버림을 막음('+api.inspect().f42Ensures+')');
  im.src='';tick(1);ok(rel.includes(im),'② final42 가 그림을 버리면(src 비움) 쥔 텍스처도 놓음');
  ctx.loading=true;const e0=api.inspect().f42Ensures;tick(4);ok(api.inspect().f42Ensures===e0,'② 불러오는 중엔 쉼');}
 {const {ctx,S,up,tex,rel,tick,api,flush}=mk();ctx.player.hero='neon';tick(1);await flush();tick(1);await flush();tick(1);
  const row=ctx.readyImage('assets/r951/neon-lance.webp');ok(!!row&&api.inspect().lanceReady,'③ 네온이면 창 시트 3/4 사본을 만듦');
  const c=up.find(x=>x&&x.width===1152&&x.height===2304);ok(!!c,'③ 사본(1152×2304)을 미리 올림');
  tex.length=0;S.texture(row.image,false);ok(tex[0]===c,'③ 원본으로 텍스처를 달라 하면 사본을 냄');S.texture(row.image,true);ok(tex[1]===row.image,'③ 바뀌는(mutable) 텍스처 요청은 그대로');
  rel.length=0;S.release(row.image);ok(rel[0]===c,'③ 사본으로 낸 만큼 release 도 사본으로');S.release(row.image);S.release(row.image);ok(rel.length>=2,'③ 낸 수를 넘는 release 는 원본으로');
}
 {const {ctx,up,rel,tick,flush}=mk();ctx.player.hero='neon';tick(1);await flush();tick(1);await flush();tick(1);const c=up.find(x=>x&&x.width===1152);
  ctx.player.hero='hwando';rel.length=0;tick(1);ok(!!c&&rel.includes(c),'③ 다른 영웅으로 바꾸면 미리 올린 사본을 놓음');}
 {const {ctx,S,tex,tick,flush}=mk({mobile:true});ctx.player.hero='neon';tick(3);await flush();tick(2);const row=ctx.readyImage('assets/r951/neon-lance.webp');tex.length=0;if(row)S.texture(row.image,false);ok(!row||tex[0]===row.image,'③ 모바일(R980 절반 사본 켜짐)은 원본 그대로 넘김');}
 {const {ctx,S,tex,tick,flush}=mk({store:{'storyworld.r1255.firstUse':'0'}});ctx.player.hero='neon';tick(3);await flush();tick(2);const row=ctx.readyImage('assets/r951/neon-lance.webp');tex.length=0;if(row)S.texture(row.image,false);ok(!row||tex[0]===row.image,'③ 끄기면 원본 그대로');}
 {const {tick,api}=mk();tick(3);const i=api.inspect();ok(i.errors===0&&i.gameplayChanged===false,'④ inspect '+JSON.stringify({e:i.errors,f:i.f42Ensures}));}}
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};const html=RT('index.html');
ok(html.split('"./'+F+'"').length===2&&html.includes('<script src="./awake-warm-r1246.js"></script>\n<script src="./'+F+'"></script>'),'⑤ index.html 태그 한 번(awake-warm-r1246 바로 뒤)');
ok(!!src&&RT(F)===src,'⑤ runtime-text 사본 = client-source');
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}ok(man.includes('"'+F+'"'),'⑤ runtime-manifest 에 실림');
let ver='';try{ver=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');}catch(_){}ok(ver.includes("'"+F+"'"),'⑤ 공개 확인 목록');
let ci='';try{ci=fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8');}catch(_){}ok(ci.includes('r96/qa/r1255/r1255-cpu-check.cjs'),'⑤ CI 검사 줄');
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake engine; real game run by trace.mjs (headless)'}));process.exit(bad?1:0);})();
