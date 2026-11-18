// R1172 — 사몽 적 피격 위치(그림 가운데) 재기의 픽셀 판독 지연 줄이기. 사용자 2026-11-18 12:22Z "사몽 적의 피격 위치를 찾을 때 발생하는 픽셀 판독 지연".
//  실측(헤드리스 960×540, 사몽 광장 ep1a09, 몹 40~56): R259·R115 가 같은 40×40 판독을 따로 하고, 판독 비용은 거의 전부 '색 사본 캔버스'(spriteTintCache3 의
//  brightness·saturate 사본, 460×420)에서 나왔다(한 번 5~28ms, 그림 파일은 0~0.1ms). 색 사본은 32칸 캐시라 밀려나면 새 캔버스로 다시 만들어지고, 그때마다 다시 판독했다.
//  완료 조건: ① 알파를 바꾸지 않는 필터의 색 사본은 경로로 묶어 한 번만 잰다 ② 잴 때는 사본 대신 원본 그림을 읽는다(캔버스 되읽기 0)
//  ③ R115·R259 가 한 캐시를 같이 쓴다 ④ 결과(가운데 값)는 그대로 ⑤ 알파를 바꾸는 필터·표시 없는 캔버스·크기가 다른 사본은 묶지 않는다(경계·회귀).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const src=C('hit-center-r259.js'),p115=C('play-r115.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copies match',RT('hit-center-r259.js')===src&&RT('play-r115.js')===p115);
const block=s=>{const m=/\/\*R1172\{\*\/([\s\S]*?)\/\*\}R1172\*\//.exec(s);return m?m[1]:null;};
ok('R115 and R259 carry the same shared alpha-box block',block(src)&&block(src)===block(p115));
ok('R115 opaqueBox asks the shared cache (no private 40×40 scan left)',/function opaqueBox\([^)]*\)\{[^\n]*__STORYWORLD_ALPHA_BOX_R1172__|function opaqueBox\([^)]*\)\{[^\n]*\bAB\.box\(/.test(p115)&&!/scanCanvas\.width=N/.test(p115));
// 세계: 40×40 판독은 그려진 그림의 '불투명 사각형'을 돌려준다(그림마다 다르게).
const ALPHA={'mob/a.webp':[.25,.1,.75,1],'mob/b.webp':[.1,.3,.9,.95]};
function make(pre){const scans=[];const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,String,Array,Set,WeakMap,Map,Object,Number,Promise,RegExp,performance:{now:()=>1000}};ctx.window=ctx;
 let T={a:1,b:0,c:0,d:1,e:0,f:0};const c2d={getTransform:()=>({...T}),drawImage(){},translate(){},save(){},restore(){}};
 const imgs={};for(const p of Object.keys(ALPHA))imgs[p]={tagName:'IMG',complete:true,width:100,height:100,naturalWidth:100,naturalHeight:100,src:'http://x/'+p,__path:p};
 let cur=null;
 Object.assign(ctx,{ctx:c2d,time:1,effects:[],room:{enemies:[]},actorHeight:()=>50,project:(x,y)=>({x:x*10,y:y*10}),readyImage:p=>imgs[p]?{image:imgs[p]}:null,
  drawEnemy:e=>{const r=e.rect||[0,0,100,100];c2d.drawImage(e.img,r[0],r[1],r[2],r[3],e.x*10-30,e.y*10-120,60,120);},drawEffect:()=>{},fx:()=>{}});
 ctx.document={createElement:()=>{const cv={width:0,height:0,getContext:()=>({clearRect(){},drawImage(im){cur=im;scans.push(im);},getImageData:(x,y,w,h)=>{const d=new Uint8ClampedArray(w*h*4);const key=cur.__path||cur.__storyworldStaticTint?.path||cur.__dyn;const a=ALPHA[key]||[0,0,1,1];
   for(let j=0;j<h;j++)for(let i=0;i<w;i++){if(i>=a[0]*w&&i<a[2]*w&&j>=a[1]*h&&j<a[3]*h)d[(j*w+i)*4+3]=255;}return{data:d};}})};return cv;}};
 vm.createContext(ctx);if(pre)vm.runInContext(pre,ctx);vm.runInContext(src,ctx);
 const tint=(p,filter,w=100,h=100)=>{const c={width:w,height:h,naturalWidth:w,naturalHeight:h,getContext(){return{};}};Object.defineProperty(c,'__storyworldStaticTint',{value:Object.freeze({path:p,filter})});return c;};
 return {ctx,scans,imgs,tint,H:()=>ctx.__STORYWORLD_HIT_CENTER_R259__};}
const draw=(w,e,t)=>{w.ctx.time=t;w.ctx.drawEnemy(e);return w.H().centreOf(e);};
// ① 같은 경로의 색 사본 다섯 장(필터만 다름) → 판독 1번, 가운데 값은 원본과 같다
{const w=make();const e={id:'a',hp:1,x:5,y:5,img:w.imgs['mob/a.webp']};const ref=draw(w,e,1);const n0=w.scans.length;const got=[];
 for(const [i,f] of ['brightness(1.7)','saturate(.9) contrast(1.05)','grayscale(1)','hue-rotate(30deg) brightness(.8)','none'].entries()){e.img=w.tint('mob/a.webp',f);got.push(draw(w,e,2+i));}
 ok('alpha-safe tint copies of one path are measured once (by path), not once per canvas',w.scans.length===n0,{before:n0,after:w.scans.length});
 ok('their centre equals the original picture centre',got.every(v=>v&&Math.abs(v.cy-ref.cy)<1e-9&&Math.abs(v.top-ref.top)<1e-9&&Math.abs(v.w-ref.w)<1e-9),{ref,got});}
// ② 사본을 처음 잴 때는 원본 그림을 읽는다(캔버스 되읽기 없음)
{const w=make();const e={id:'a',hp:1,x:5,y:5,img:w.tint('mob/b.webp','brightness(1.7)')};const v=draw(w,e,1);
 ok('a tint copy is measured from its loaded original image, never read back from the canvas',w.scans.length===1&&w.scans[0]===w.imgs['mob/b.webp'],w.scans.map(s=>s.__path||'canvas'));
 ok('…and the box is the picture\'s opaque box (b: top 30%, bottom 95%)',v&&Math.abs(v.top-(-120+120*.3+50))<1e-6&&Math.abs(v.bottom-(-120+120*.95+50))<1e-6,v);}
// ③ 32칸 캐시에서 밀려 다시 만들어진 사본(새 객체)도 다시 재지 않는다
{const w=make();const e={id:'a',hp:1,x:5,y:5};for(let i=0;i<40;i++){e.img=w.tint('mob/a.webp','brightness(1.7)');draw(w,e,1+i);}
 ok('re-created tint canvases (cache eviction) are not re-scanned',w.scans.length===1,w.scans.length);}
// ④ 경계: 알파를 바꾸는 필터·표시 없는 캔버스·크기 다른 사본은 묶지 않는다
{const w=make();const e={id:'a',hp:1,x:5,y:5,img:w.imgs['mob/a.webp']};draw(w,e,1);const n0=w.scans.length;
 for(const [i,f] of ['opacity(.5)','drop-shadow(0 0 4px red)','blur(2px)'].entries()){e.img=w.tint('mob/a.webp',f);draw(w,e,2+i);}
 ok('alpha-changing filters (opacity, drop-shadow, blur) are measured on their own canvas',w.scans.length===n0+3&&w.scans.slice(n0).every(s=>s.__storyworldStaticTint),w.scans.length-n0);
 const dyn1={width:100,height:100,getContext(){return{};},__dyn:'mob/b.webp'},dyn2={width:100,height:100,getContext(){return{};},__dyn:'mob/b.webp'};
 e.img=dyn1;draw(w,e,10);e.img=dyn1;draw(w,e,11);e.img=dyn2;draw(w,e,12);
 ok('unmarked (dynamic) canvases keep per-object caching: same object once, a new object again',w.scans.length===n0+3+2,w.scans.length-n0-3);
 e.img=w.tint('mob/a.webp','brightness(2)',200,100);draw(w,e,13);
 ok('a marked copy whose size differs from the original is not pooled with it',w.scans.length===n0+3+2+1);}
// ⑤ 다른 칸(rect)은 따로 잰다
{const w=make();const im=w.imgs['mob/a.webp'];const e={id:'a',hp:1,x:5,y:5,img:im};draw(w,e,1);
 e.rect=[0,0,50,100];draw(w,e,2);e.rect=null;draw(w,e,3);
 ok('different frame rects of one sheet are separate entries',w.scans.length===2);}
// ⑥ R115 와 R259 가 한 캐시를 같이 쓴다: R115 블록이 먼저 만든 캐시에 잰 칸은 R259 가 다시 재지 않는다
{const pre=block(p115);const w=make(pre);const AB=w.ctx.__STORYWORLD_ALPHA_BOX_R1172__;
 ok('the shared cache object is created once (R259 reuses R115\'s)',!!AB&&typeof AB.box==='function'&&w.ctx.__STORYWORLD_ALPHA_BOX_R1172__===AB);
 const im=w.imgs['mob/a.webp'];AB&&AB.box(im,0,0,100,100,()=>true);const n0=w.scans.length;draw(w,{id:'z',hp:1,x:5,y:5,img:im},1);
 ok('a rect R115 already measured is a cache hit for R259',n0===1&&w.scans.length===1,{n0,n:w.scans.length});}
// ⑦ 측정 기준(모의 장면): 몹 40마리·경로 8개·필터 6개, 색 사본 32칸 캐시가 계속 밀려 다시 만들어지는 600장면
{const w=make();const paths=Object.keys(ALPHA);const filters=['none','brightness(1.7)','brightness(1.3)','saturate(.9) contrast(1.05)','grayscale(1)','hue-rotate(20deg)'];
 const cache=new Map(),get=(p,f)=>{const k=p+'|'+f;let c=cache.get(k);if(!c){c=w.tint(p,f);cache.set(k,c);if(cache.size>4)cache.delete(cache.keys().next().value);}return c;};
 const es=Array.from({length:40},(_,i)=>({id:'m'+i,hp:1,x:i%8,y:i>>3}));let readBack=0;
 for(let t=0;t<600;t++)for(const [i,e] of es.entries()){e.img=get(paths[i%paths.length],filters[(t+i)%filters.length]);w.ctx.time=t;w.ctx.drawEnemy(e);}
 for(const s of w.scans)if(s.__storyworldStaticTint)readBack++;
 ok('600-frame churn scene: total 40×40 reads ≤ distinct (path, rect) = 2, canvas read-backs 0',w.scans.length<=2&&readBack===0,{reads:w.scans.length,readBack});}
try{new vm.Script(src);new vm.Script(p115);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R1172 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
