// R1255b CPU 검사 — final42 아틀라스(F246·F217) 쥐기 누수(first-use-r1255.js keepF42).
//  가짜 엔진으로: final42 가 지역 이동마다 새 아틀라스 그림을 만들 때(이전 그림 src 는 그대로) 이전 그림을 놓는지,
//  보스가 죽어 F217 이 빠지면 F217 도 놓는지, 10회 왕복해도 쥔 수가 id 당 1장을 넘지 않는지 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),F='first-use-r1255.js',API='__STORYWORLD_FIRST_USE_R1255__';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok(!!src,'오버레이 파일 있음');
function mk(){const timers=[];let clock=0;const up=[],tex=[],rel=[];
 class Img{constructor(){this._src='';this.complete=false;this.naturalWidth=0;}get src(){return this._src;}set src(v){this._src=v;if(v){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1024;}}getAttribute(k){return k==='src'?(this._src||null):null;}}
 const ctx={Math,Number,Object,String,JSON,Array,Set,Map,WeakMap,console,Promise,HTMLImageElement:Img,Image:Img,
  localStorage:{getItem:()=>null,setItem(){}},setInterval:f=>{timers.push(f);return 1;},performance:{now:()=>clock},document:{createElement:()=>({getContext:()=>({drawImage(){}})})}};
 ctx.window=ctx;ctx.loading=false;ctx.player={hero:'hwando',hp:100};ctx.room={enemies:[{hp:5}]};ctx.imageCache=new Map();ctx.readyImage=p=>{const r=ctx.imageCache.get(p);return r&&r.ready?r:null;};
 function CS(){}CS.prototype.texture=function(im){tex.push(im);return {image:im};};CS.prototype.release=function(im){rel.push(im);};
 ctx.StoryPhase1={CommandScene:CS};const S=new CS();ctx.__STORYWORLD_PHASE1__={controller:{state:{three:{commands:S,renderer:{initTexture:t=>up.push(t.image)}}}}};
 const made={};ctx.__STORYWORLD_FINAL42_R88__={ensure(id){if(!made[id]){const im=new ctx.Image();im.src='http://x/m0/assets/final42-r88/effects/'+id+'/atlas.png';made[id]=im;}return Promise.resolve(true);}};ctx.__made=made;
 vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 const tick=k=>{for(let i=0;i<k;i++){clock+=500;for(const f of timers)f();}};
 // 쥔 수 = 미리 올리며 texture 로 얻은 수 − release 수(그림별)
 const heldCount=pre=>{const m=new Map();for(const im of tex)if(im&&String(im.src).includes(pre))m.set(im,(m.get(im)||0)+1);for(const im of rel)if(m.has(im))m.set(im,m.get(im)-1);let c=0;for(const v of m.values())if(v>0)c++;return c;};
 return {ctx,up,tex,rel,tick,heldCount,api:ctx[API]};}
if(src){
 {const {ctx,rel,tick,heldCount}=mk();tick(1);const first=ctx.__made.F246;ok(!!first&&heldCount('F246')===1,'처음 F246 1장 쥠');
  delete ctx.__made.F246;tick(1);const second=ctx.__made.F246;ok(second&&second!==first,'final42 가 새 아틀라스를 만듦(이전 src 는 그대로)');
  ok(rel.includes(first),'새 그림으로 바뀌면 이전 F246 을 놓음');ok(heldCount('F246')===1,'바뀐 뒤 F246 쥔 수 1 ('+heldCount('F246')+')');
  for(let i=0;i<10;i++){delete ctx.__made.F246;tick(1);ctx.room.enemies.push({boss:true,hp:9});delete ctx.__made.F217;tick(1);ctx.room.enemies=[{hp:5}];tick(1);}
  ok(heldCount('F246')<=1,'10회 왕복 뒤 F246 쥔 수 ≤1 ('+heldCount('F246')+')');ok(heldCount('F217')===0,'10회 왕복 뒤 보스 없는 방에서 F217 쥔 수 0 ('+heldCount('F217')+')');}
 {const {ctx,rel,tick,heldCount}=mk();ctx.room.enemies.push({boss:true,hp:9});tick(1);const b=ctx.__made.F217;ok(!!b&&heldCount('F217')===1,'보스방에서 F217 1장 쥠');
  ctx.room.enemies[1].hp=0;tick(1);ok(rel.includes(b)&&heldCount('F217')===0,'보스가 죽으면 F217 을 놓음');
  ctx.room.enemies[1].hp=9;tick(1);ok(heldCount('F217')===1,'보스가 다시 살면 F217 을 다시 쥠');}
 {const {ctx,tick,heldCount}=mk();tick(1);for(let i=0;i<5;i++)tick(1);ok(heldCount('F246')===1,'같은 그림이면 놓지 않고 계속 쥠');}
 {const {tick,api}=mk();tick(3);ok(api.inspect().errors===0,'inspect 오류 0');}}
console.log(JSON.stringify({total:n,failed:bad,method:'node vm + fake engine'}));process.exit(bad?1:0);
