'use strict';
// R1137 — 그림 투명 테두리 재기(imageCrop) 빠른 길 검사.
//  A(노드): perf-r154 의 scan 이 본편 imageCrop 의 두 겹 반복과 같은 상자를 내는지(빈 그림·모서리 한 점·문턱 18/19·1줄 그림·무작위),
//           그리고 성긴 384×384 그림에서 3배 넘게 빠른지.
//  B(브라우저, SW_URL 있을 때): 실제 게임 그림 전부에서 R154 빠른 길과 본편 imageCrop 결과가 똑같은지 — PC 와 아이폰 13 미니 가로(R980 반 크기 사본 길).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.join(__dirname,'../../client-source/perf-r154.js');
function load(){const win={},store={};
 const sb={window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},performance,console};
 sb.imageCrop=function(){return{x:0,y:0,w:1,h:1};};vm.createContext(sb);vm.runInContext(fs.readFileSync(SRC,'utf8'),sb);return {api:win.__STORYWORLD_PERF_R154__,sb};}
// 본편 imageCrop 의 반복 그대로
function ref(d,w,h){let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>18){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return x1<x0?null:[x0,y0,x1,y1];}
const img=(w,h,pts)=>{const d=new Uint8ClampedArray(w*h*4);for(const [x,y,a] of pts)d[(y*w+x)*4+3]=a;return d;};
let fails=0;const check=(name,fn)=>{try{fn();console.log('PASS',name);}catch(e){fails++;console.log('FAIL',name,'—',e.message);}};
const {api}=load();
check('scan 노출',()=>assert.equal(typeof api?.scan,'function','__STORYWORLD_PERF_R154__.scan 이 없다'));
const cases=[['빈 그림',7,5,[]],['문턱 18 은 투명',4,4,[[1,1,18]]],['문턱 19 는 보임',4,4,[[1,1,19]]],['왼쪽 위 한 점',9,6,[[0,0,255]]],['오른쪽 아래 한 점',9,6,[[8,5,200]]],
 ['1×1',1,1,[[0,0,99]]],['한 줄 가로',13,1,[[3,0,40],[9,0,40]]],['한 줄 세로',1,13,[[0,2,40],[0,11,40]]],['꽉 참',5,4,[...Array(20)].map((_,i)=>[i%5,i/5|0,255])],
 ['ㄱ자(가장 왼쪽·오른쪽이 다른 줄)',10,8,[[7,1,255],[2,6,255],[5,3,30]]]];
for(const [n,w,h,p] of cases)check('같은 상자: '+n,()=>{const d=img(w,h,p);assert.deepEqual(JSON.stringify(api.scan(d,w,h)),JSON.stringify(ref(d,w,h)));});
check('같은 상자: 무작위 400장',()=>{let s=12345;const r=()=>(s=(Math.imul(s,1103515245)+12345)>>>0)/4294967296;
 for(let t=0;t<400;t++){const w=1+(r()*40|0),h=1+(r()*40|0),k=r()*r()*.2,p=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(r()<k)p.push([x,y,r()*256|0]);const d=img(w,h,p);assert.equal(JSON.stringify(api.scan(d,w,h)),JSON.stringify(ref(d,w,h)),'case '+t);}});
const bench=(d,w,h)=>{const t=f=>{f();const a=performance.now();for(let i=0;i<40;i++)f();return performance.now()-a;};return [t(()=>ref(d,w,h)),t(()=>api.scan(d,w,h))];};
check('384×384 보통 그림(가운데 타원 몸통)에서 3배 넘게 빠름',()=>{const w=384,h=384,p=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x-190)/120)**2+((y-200)/160)**2<1)p.push([x,y,255]);const d=img(w,h,p);
 assert.equal(JSON.stringify(api.scan(d,w,h)),JSON.stringify(ref(d,w,h)));const [tr,tf]=bench(d,w,h);console.log('   ref',tr.toFixed(1),'ms / fast',tf.toFixed(1),'ms (40회)');assert.ok(tf*3<tr,'fast '+tf.toFixed(1)+' ref '+tr.toFixed(1));});
check('384×384 가장 나쁜 경우(성긴 점 3개)에도 1.5배보다 느리지 않음',()=>{const w=384,h=384,d=img(w,h,[[150,40,255],[230,300,255],[190,170,255]]);const [tr,tf]=bench(d,w,h);
 console.log('   ref',tr.toFixed(1),'ms / fast',tf.toFixed(1),'ms (40회)');assert.ok(tf<tr*1.5,'fast '+tf.toFixed(1)+' ref '+tr.toFixed(1));});
async function browser(){const url=process.env.SW_URL;if(!url){console.log('SKIP 브라우저(SW_URL 없음)');return;}
 const {chromium,devices}=require('playwright');const b=await chromium.launch({args:['--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{for(const [name,opt] of [['PC',{viewport:{width:1280,height:720}}],['iPhone 13 mini 가로',{...devices['iPhone 13 Mini landscape'],viewport:{width:812,height:375},screen:{width:812,height:375},deviceScaleFactor:3}]]){
  const ctx=await b.newContext(opt);const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>typeof imageCache!=='undefined'&&window.__STORYWORLD_PERF_R154__&&[...imageCache.values()].filter(r=>r.ready).length>40,null,{timeout:180000});
  const r=await page.evaluate(async()=>{const api=__STORYWORLD_PERF_R154__;const rows=[...imageCache.values()].filter(r=>r.ready&&r.image instanceof HTMLImageElement);
   let n=0,diff=[],tb=0,tf=0;for(const row of rows){api.base(row.image);/* 데우기: 해독·반 크기 사본을 미리 만들어 두 길을 같은 조건에서 잰다 */const first=n%2;let a,f,t;if(first){t=performance.now();f=api.fast?.(row.image);tf+=performance.now()-t;t=performance.now();a=api.base(row.image);tb+=performance.now()-t;}else{t=performance.now();a=api.base(row.image);tb+=performance.now()-t;t=performance.now();f=api.fast?.(row.image);tf+=performance.now()-t;}n++;if(JSON.stringify(a)!==JSON.stringify(f))diff.push([row.path,a,f]);}
   return{n,diff:diff.slice(0,5),diffs:diff.length,base:Math.round(tb),fast:Math.round(tf),stats:api.inspect().stats};});
  console.log('   '+name+': 본편 '+r.base+'ms / 빠른 길 '+r.fast+'ms ('+r.n+'장, 데운 뒤 순서 번갈아), stats '+JSON.stringify(r.stats));
  check(name+': 게임 그림 '+r.n+'장 빠른 길 = 본편 imageCrop',()=>{assert.ok(r.n>40);assert.equal(r.diffs,0,JSON.stringify(r.diff));});
  check(name+': 페이지 오류 없음',()=>assert.deepEqual(errors,[]));await ctx.close();}}finally{await b.close();}}
browser().then(()=>{console.log(fails?'FAILED '+fails:'ALL PASS');process.exitCode=fails?1:0;},e=>{console.error(e);process.exitCode=1;});
