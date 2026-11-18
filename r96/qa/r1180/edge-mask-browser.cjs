// R1180 브라우저 검사: 스토리 64지역 전부에서 가장자리 가림판(edges-r188 buildMask)을 원래 방식(R188-edges-2, 아래 OLD 사본)과 비교.
//  ① 빨라졌는가: 64지역 합이 원래의 15% 이하, 가장 무거운 지역도 원래의 25% 이하
//  ② 그림이 거의 같은가: 알파 차이 평균 1.0/255 이하, 8/255 넘게 다른 화소 3% 이하, 판이 있고 없음은 같음
//  SW_URL=http://127.0.0.1:4410/ node r96/qa/r1180/edge-mask-browser.cjs   (헤드리스 소프트웨어 렌더링, 시간은 비율만 본다)
'use strict';
const assert=require('node:assert/strict');const {chromium}=require('playwright');
let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,600));assert.ok(c,m);n++;console.log('PASS',m);};
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:960,height:540}});page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.SW_URL||'http://127.0.0.1:4410/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__STORYWORLD_EDGES_R188__&&window.__STORYWORLD_EXPLORATION__&&typeof regionById==='object');
 const r=await page.evaluate(()=>{const PX=4,PAD=4;
  const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295;};const sm=t=>t*t*(3-2*t);
  function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi);const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
  const fbm=(x,y)=>.6*vnoise(x*.28,y*.28)+.28*vnoise(x*.8+31,y*.8+17)+.12*vnoise(x*2.3+7,y*2.3+3);
  // OLD = R188-edges-2 buildMask 그대로(벽마다 흐림)
  function OLD(L){const b=L.bounds,x0=b[0]-PAD,y0=b[1]-PAD,W=Math.ceil((b[2]-b[0]+2*PAD)*PX),H=Math.ceil((b[3]-b[1]+2*PAD)*PX);if(W*H>2.6e6)return null;
   const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
   const area=mk(),ag=area.getContext('2d',{willReadFrequently:true});ag.fillStyle='#000';ag.fillRect(0,0,W,H);ag.fillStyle='#fff';
   for(const r of [...(L.floorRects||[]),...(L.backdropRects||[]),...(L.connectorFloorRects||[])])if(r&&r.width>0&&r.depth>0)ag.fillRect((r.x-x0)*PX,(r.y-y0)*PX,r.width*PX,r.depth*PX);
   const soft=mk(),sg=soft.getContext('2d',{willReadFrequently:true});sg.filter=`blur(${PX*2.2}px)`;sg.drawImage(area,0,0);
   const wall=mk(),wg=wall.getContext('2d',{willReadFrequently:true});wg.fillStyle='#000';wg.fillRect(0,0,W,H);wg.filter=`blur(${PX*.9}px)`;wg.fillStyle='#fff';
   for(const w of L.walls||[]){if(!w||!(w.width>0)||!(w.depth>0))continue;const ww=Math.max(w.width,1.6),dd=Math.max(w.depth,1.6);wg.fillRect((w.x-ww/2-x0)*PX,(w.y-dd/2-y0)*PX,ww*PX,dd*PX);}
   const A=ag.getImageData(0,0,W,H).data,S=sg.getImageData(0,0,W,H).data,Wl=wg.getImageData(0,0,W,H).data,out=new Uint8ClampedArray(W*H);let any=0;
   for(let j=0;j<H;j++){const wy=y0+(j+.5)/PX;for(let i=0;i<W;i++){const k=(j*W+i)*4,inside=A[k]>127,s=S[k]/255;let a=0;const edge=inside?s>.01&&s<.998:s>=.01;
     if(edge&&Wl[k]<255/1.4){const nn=fbm(x0+(i+.5)/PX,wy)-.5,v=s+nn*1.05,keep=v<=.38?0:v>=.62?1:sm((v-.38)/.24);a=1-keep;a*=1-Math.min(1,Wl[k]/255*1.4);}
     const g=Math.round(a*255);out[j*W+i]=g;if(g>8)any++;}}return any?{px:out,W,H}:null;}
  const rows=[];let tOld=0,tNew=0,sum=0,big=0,tot=0,nullMismatch=[];
  for(const id of Object.keys(regionById)){const L=__STORYWORLD_EXPLORATION__.layout(id);if(!L?.bounds)continue;
   let t=performance.now();const a=OLD(L);const to=performance.now()-t;t=performance.now();const b=__STORYWORLD_EDGES_R188__.buildMask(L);const tn=performance.now()-t;tOld+=to;tNew+=tn;
   if(!!a!==!!b){nullMismatch.push(id);continue;}if(!a)continue;
   const d=b.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,a.W,a.H).data;let s=0,bg=0;
   for(let i=0;i<a.px.length;i++){const dd=Math.abs(a.px[i]-d[i*4]);s+=dd;if(dd>8)bg++;}sum+=s;big+=bg;tot+=a.px.length;rows.push({id,old:Math.round(to),new:Math.round(tn),mean:+(s/a.px.length).toFixed(3),big:+(bg/a.px.length).toFixed(4)});}
  rows.sort((x,y)=>y.old-x.old);return {regions:rows.length,tOld:Math.round(tOld),tNew:Math.round(tNew),mean:sum/tot,bigFrac:big/tot,nullMismatch,heavy:rows[0],worst:[...rows].sort((x,y)=>y.mean-x.mean).slice(0,3),rev:__STORYWORLD_EDGES_R188__.revision};});
 console.log(JSON.stringify(r));
 ok(r.regions>=60,'스토리 지역 '+r.regions+'곳 비교');
 ok(r.tNew<=r.tOld*.15,`64지역 합 ${r.tOld}ms → ${r.tNew}ms (15% 이하)`);
 ok(r.heavy.new<=r.heavy.old*.25,`가장 무거운 ${r.heavy.id} ${r.heavy.old}ms → ${r.heavy.new}ms (25% 이하)`);
 ok(r.nullMismatch.length===0,'판이 생기고 안 생기는 지역은 그대로',r.nullMismatch);
 ok(r.mean<=1.0,`알파 차이 평균 ${r.mean.toFixed(3)}/255 (1.0 이하)`);
 ok(r.bigFrac<=.03,`8/255 넘게 다른 화소 ${(r.bigFrac*100).toFixed(2)}% (3% 이하)`);
 ok(errors.length===0,'페이지 오류 0',errors);
 console.log('R1180 edge mask browser check: '+n+' passed');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exit(1);});
