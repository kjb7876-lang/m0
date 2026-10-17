import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const site=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
const text=await fs.readFile('_pages/docs/dist/phase1.js','utf8');
const a=text.indexOf('const affinePoint='),b=text.indexOf('/* All compiled regions depth/shadow path.',a);assert.ok(a>=0&&b>a);
await fs.mkdir('out/r67',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),physicalGPU:false,scope:'Cubic centerline raster comparison against native Canvas AND a 2048-segment analytic control. Native curve and polyline rasterizers need not produce identical antialiasing. The independent CPU suite still requires a 1/8-physical-pixel centerline error bound.',cases:[],status:'running'};
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=new URL('__r67_curve_fixture.html',site).href;
 await page.route(url,r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>R67 native and analytic cubic comparison</title><body></body>'}));await page.goto(url);
 report.cases=await page.evaluate(core=>{
  const C=new Function('finite',core+'\nreturn DrawCommands;')((v,d=0)=>Number.isFinite(v)?v:d);
  const cases=[];
  const shapes=[{name:'silver-blade',p:[[-130,90],[-86,-156],[96,-190],[146,68]],angle:.2,mirror:false},
   {name:'loop',p:[[0,0],[160,-140],[-160,-140],[0,0]],angle:1.1,mirror:false},
   {name:'reversal',p:[[-40,0],[160,0],[-160,0],[40,0]],angle:.6,mirror:true},
   {name:'mirror-rotation',p:[[-130,60],[-100,-170],[120,-160],[140,60]],angle:.8,mirror:true}];
  const compare=(x,y,w,h)=>{
   let coverage=0,missing=0,extra=0,alphaError=0,alphaSum=0,maxChannelDelta=0;
   const nearby=(bytes,col,row)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=col+dx,yy=row+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&bytes[(yy*w+xx)*4+3]>8)return true;}return false;};
   for(let k=0;k<w*h;k++){const at=k*4+3,nv=x[at],pv=y[at],col=k%w,row=Math.floor(k/w);if(nv>8){coverage++;if(!nearby(y,col,row))missing++;}if(pv>8&&!nearby(x,col,row))extra++;const delta=Math.abs(nv-pv);alphaError+=delta;alphaSum+=nv;maxChannelDelta=Math.max(maxChannelDelta,delta);}
   return{referenceCoveragePixels:coverage,missingBeyondOnePhysicalPixel:missing,extraBeyondOnePhysicalPixel:extra,relativeAlphaError:alphaError/Math.max(1,alphaSum),maxChannelDelta};
  };
  for(const dpr of [1,2])for(const item of shapes){
   const canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=640*dpr;c.height=480*dpr;return c;});
   const [native,poly,dense]=canvases,[n,p,q]=canvases.map(c=>c.getContext('2d',{willReadFrequently:true}));
   const rec=new C({canvas:{},makeCanvas:()=>document.createElement('canvas')});rec.reset(dpr);
   n.scale(dpr,dpr);rec.setTransform(dpr,0,0,dpr,0,0);
   for(const ctx of [n,rec]){ctx.translate(320,240);ctx.rotate(item.angle);ctx.scale(item.mirror?-1:1,1);ctx.beginPath();ctx.moveTo(...item.p[0]);ctx.bezierCurveTo(...item.p[1],...item.p[2],...item.p[3]);}
   n.lineWidth=5;n.lineCap='round';n.lineJoin='round';n.strokeStyle='#fff';n.stroke();
   const drawPolyline=(ctx,points)=>{ctx.scale(dpr,dpr);ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.stroke();};
   drawPolyline(p,rec.current.points);
   const control=[];
   for(let i=0;i<=2048;i++){const t=i/2048,s=1-t,xy=[0,1].map(k=>s*s*s*item.p[0][k]+3*s*s*t*item.p[1][k]+3*s*t*t*item.p[2][k]+t*t*t*item.p[3][k]);control.push(rec.point(...xy));}
   drawPolyline(q,control);
   const [x,y,z]=[n,p,q].map(ctx=>ctx.getImageData(0,0,native.width,native.height).data),w=native.width,h=native.height;
   cases.push({name:item.name,dpr,segments:rec.current.points.length-1,denseControlSegments:2048,nativeVsCandidate:compare(x,y,w,h),nativeVsDenseControl:compare(x,z,w,h),denseControlVsCandidate:compare(z,y,w,h)});
   if(dpr===1&&item.name==='silver-blade')for(const c of canvases){c.style.width='640px';document.body.appendChild(c);}
   rec.dispose();
  }return cases;
 },text.slice(a,b));
 for(const row of report.cases){
  for(const values of [row.nativeVsCandidate,row.nativeVsDenseControl,row.denseControlVsCandidate]){assert.ok(values.referenceCoveragePixels>100);assert.equal(values.missingBeyondOnePhysicalPixel,0,JSON.stringify(row));assert.equal(values.extraBeyondOnePhysicalPixel,0,JSON.stringify(row));}
  // Calibrate the rasterizer's own difference using a denser independent curve,
  // not a looser geometric tolerance or an edited expected gameplay screenshot.
  assert.ok(row.denseControlVsCandidate.relativeAlphaError<.025,JSON.stringify(row));
  assert.ok(row.nativeVsCandidate.relativeAlphaError<=row.nativeVsDenseControl.relativeAlphaError+.01,JSON.stringify(row));
 }
 assert.deepEqual(errors,[]);report.errors=errors;await page.screenshot({path:'out/r67/cubic-native-comparison.png',fullPage:true});report.status='passed';
}catch(error){report.status='failed';report.error=error.stack||String(error);throw error;}finally{await fs.writeFile('out/r67/cubic-raster.json',JSON.stringify(report,null,2)+'\n');console.log('R67_CUBIC_RASTER',JSON.stringify(report));await browser.close();}
