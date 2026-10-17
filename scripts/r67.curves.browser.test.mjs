import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const site=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
const text=await fs.readFile('_pages/docs/dist/phase1.js','utf8');
const a=text.indexOf('const affinePoint='),b=text.indexOf('/* All compiled regions depth/shadow path.',a);assert.ok(a>=0&&b>a);
await fs.mkdir('out/r67',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),physicalGPU:false,scope:'Cubic centerline tessellation rasterized against native Canvas cubic curves. Existing WebGL sprite equality and live-game EGO gates run separately.',cases:[],status:'running'};
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=new URL('__r67_curve_fixture.html',site).href;
 await page.route(url,r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>R67 native cubic comparison</title><body></body>'}));await page.goto(url);
 report.cases=await page.evaluate(core=>{
  const C=new Function('finite',core+'\nreturn DrawCommands;')((v,d=0)=>Number.isFinite(v)?v:d);
  const cases=[];
  const shapes=[{name:'silver-blade',p:[[-130,90],[-86,-156],[96,-190],[146,68]],angle:.2,mirror:false},
   {name:'loop',p:[[0,0],[160,-140],[-160,-140],[0,0]],angle:1.1,mirror:false},
   {name:'reversal',p:[[-40,0],[160,0],[-160,0],[40,0]],angle:.6,mirror:true},
   {name:'mirror-rotation',p:[[-130,60],[-100,-170],[120,-160],[140,60]],angle:.8,mirror:true}];
  for(const dpr of [1,2])for(const item of shapes){
   const native=document.createElement('canvas'),poly=document.createElement('canvas');
   native.width=poly.width=640*dpr;native.height=poly.height=480*dpr;
   const n=native.getContext('2d',{willReadFrequently:true}),p=poly.getContext('2d',{willReadFrequently:true});
   const rec=new C({canvas:{},makeCanvas:()=>document.createElement('canvas')});rec.reset(dpr);
   n.scale(dpr,dpr);rec.setTransform(dpr,0,0,dpr,0,0);
   for(const ctx of [n,rec]){ctx.translate(320,240);ctx.rotate(item.angle);ctx.scale(item.mirror?-1:1,1);ctx.beginPath();ctx.moveTo(...item.p[0]);ctx.bezierCurveTo(...item.p[1],...item.p[2],...item.p[3]);}
   n.lineWidth=5;n.lineCap='round';n.lineJoin='round';n.strokeStyle='#fff';n.stroke();
   p.scale(dpr,dpr);p.lineWidth=5;p.lineCap='round';p.lineJoin='round';p.strokeStyle='#fff';p.beginPath();
   for(const path of rec.paths){p.moveTo(...path.points[0]);for(const point of path.points.slice(1))p.lineTo(...point);if(path.closed)p.closePath();}p.stroke();
   const x=n.getImageData(0,0,native.width,native.height).data,y=p.getImageData(0,0,poly.width,poly.height).data,w=native.width,h=native.height;
   let coverage=0,missing=0,extra=0,alphaError=0,alphaSum=0,maxChannelDelta=0;
   const nearby=(bytes,col,row)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=col+dx,yy=row+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&bytes[(yy*w+xx)*4+3]>8)return true;}return false;};
   for(let k=0;k<w*h;k++){const at=k*4+3,nv=x[at],pv=y[at],col=k%w,row=Math.floor(k/w);if(nv>8){coverage++;if(!nearby(y,col,row))missing++;}if(pv>8&&!nearby(x,col,row))extra++;const delta=Math.abs(nv-pv);alphaError+=delta;alphaSum+=nv;maxChannelDelta=Math.max(maxChannelDelta,delta);}
   cases.push({name:item.name,dpr,segments:rec.current.points.length-1,referenceCoveragePixels:coverage,missingBeyondOnePhysicalPixel:missing,extraBeyondOnePhysicalPixel:extra,relativeAlphaError:alphaError/Math.max(1,alphaSum),maxChannelDelta});
   if(dpr===1&&item.name==='silver-blade'){native.style.width=poly.style.width='640px';document.body.append(native,poly);}
   rec.dispose();
  }return cases;
 },text.slice(a,b));
 for(const row of report.cases){assert.ok(row.referenceCoveragePixels>100);assert.equal(row.missingBeyondOnePhysicalPixel,0,JSON.stringify(row));assert.equal(row.extraBeyondOnePhysicalPixel,0,JSON.stringify(row));assert.ok(row.relativeAlphaError<.03,JSON.stringify(row));}
 assert.deepEqual(errors,[]);report.errors=errors;await page.screenshot({path:'out/r67/cubic-native-comparison.png',fullPage:true});report.status='passed';
}catch(error){report.status='failed';report.error=error.stack||String(error);throw error;}finally{await fs.writeFile('out/r67/cubic-raster.json',JSON.stringify(report,null,2)+'\n');console.log('R67_CUBIC_RASTER',JSON.stringify(report));await browser.close();}
