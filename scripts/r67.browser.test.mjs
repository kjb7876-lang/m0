import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const site=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
const out='out/r67';await fs.mkdir(out,{recursive:true});
const sourceA=await fs.readFile('_baseline/docs/dist/phase1.js','utf8'),sourceB=await fs.readFile('_pages/docs/dist/phase1.js','utf8');
function core(s){const a=s.indexOf('const affinePoint='),b=s.indexOf('/* All compiled regions depth/shadow path.',a);assert.ok(a>=0&&b>a);return s.slice(a,b);}
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),sandbox:true,physicalGPU:false,physicalMobile:false,scope:'Real vendored Three.js/WebGL with deterministic planar sprite fixtures, not full-game or physical-device FPS.',cases:[],status:'running'};
try{
 const context=await browser.newContext({viewport:{width:680,height:540},deviceScaleFactor:1});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixtureURL=new URL('__r67_fixture.html',site).href;
 await page.route(fixtureURL,r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><title>R67 WebGL differential fixture</title><body style="margin:0;background:#222"></body>'}));
 await page.goto(fixtureURL);
 const result=await page.evaluate(async({a,b,threeURL})=>{
  const T=await import(threeURL),finite=(v,d=0)=>Number.isFinite(v)?v:d;
  const A=new Function('finite',a+'\nreturn{DrawCommands,CommandScene};')(finite),B=new Function('finite',b+'\nreturn{DrawCommands,CommandScene};')(finite);
  const renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});renderer.setSize(640,480);renderer.setPixelRatio(1);renderer.info.autoReset=false;renderer.setClearColor(0x112233,1);document.body.appendChild(renderer.domElement);
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),device={version:gl.getParameter(gl.VERSION),vendor:debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):null,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
  const camera=new T.OrthographicCamera(-4,4,3,-3,.1,100);camera.position.set(0,0,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const projection={width:640,height:480,zoom:1,tile:40,camX:0,camY:0,pixelsPerUnit:80,screenToWorld:(x,y)=>({x:(x-320)/80,y:(240-y)/80}),worldToScreen:(x,y)=>({x:320+x*80,y:240-y*80})};
  const makeCanvas=()=>document.createElement('canvas'),texture=makeCanvas();texture.width=texture.height=64;
  function paint(variant){const c=texture.getContext('2d');c.clearRect(0,0,64,64);const g=c.createRadialGradient(30,30,0,30,30,31);g.addColorStop(0,variant?'rgba(255,30,80,1)':'rgba(190,220,255,1)');g.addColorStop(.6,'rgba(80,140,255,.65)');g.addColorStop(1,'rgba(20,40,90,0)');c.fillStyle=g;c.fillRect(0,0,64,64);c.fillStyle='rgba(255,255,255,.8)';c.fillRect(7,24,49,4);}
  function create(C){return{rec:new C.DrawCommands({canvas:{},makeCanvas}),scene:new C.CommandScene(T,{projection,camera,makeCanvas})};}
  const x=create(A),y=create(B),target=new T.WebGLRenderTarget(640,480,{depthBuffer:true});
  function commands(rec,variant){rec.reset();for(let i=0;i<48;i++){rec.scope({id:'sprite-'+i,kind:i%2?'hero':'effect',x:0,y:0},()=>{const px=35+(i%8)*74,py=40+Math.floor(i/8)*72;rec.save();rec.globalAlpha=.35+(i%4)*.2;if(i%5===0)rec.globalCompositeOperation='screen';if(i%3===0)rec.filter='brightness(115%) saturate(90%)';if(i%7===0){rec.beginPath();rec.rect(px-20,py-20,65,58);rec.clip();}if(variant===1){rec.translate(px,py);rec.rotate((i%5)*.12);rec.drawImage(texture,30,-25,-60,60);}else rec.drawImage(texture,px-25,py-25,60,60);rec.restore();});}return rec.finish();}
  function render(row,variant){row.scene.render(commands(row.rec,variant));renderer.setRenderTarget(target);renderer.info.reset();renderer.clear();renderer.render(row.scene.scene,camera);const calls=renderer.info.render.calls,triangles=renderer.info.render.triangles,pixels=new Uint8Array(640*480*4);renderer.readRenderTargetPixels(target,0,0,640,480,pixels);return{calls,triangles,pixels,images:[...row.scene.rows.values()].filter(r=>r.geometryState.kind==='image'&&r.mesh.material.isMeshBasicMaterial).length};}
  const cases=[];let firstPixels=null;
  for(const [name,variant,repaint] of [['alpha-filter-blend-clip',0,0],['mirrored-rotated-sprites',1,0],['mutable-animation-frame-updated',1,1]]){
   paint(repaint);render(x,variant);render(y,variant);const old=render(x,variant),next=render(y,variant);let changedChannels=0,maxDelta=0,nonBackground=0;for(let i=0;i<old.pixels.length;i++){const d=Math.abs(old.pixels[i]-next.pixels[i]);if(d)changedChannels++;maxDelta=Math.max(maxDelta,d);if(i%4===0&&old.pixels[i]!==old.pixels[0])nonBackground++;}
   let changedFromPrior=null;if(firstPixels){changedFromPrior=0;for(let i=0;i<next.pixels.length;i++)if(next.pixels[i]!==firstPixels[i])changedFromPrior++;}if(name==='mirrored-rotated-sprites')firstPixels=next.pixels.slice();
   const geometryIdentical=[...x.scene.rows].every(([key,r])=>{const s=y.scene.rows.get(key);return s&&['position','uv'].every(k=>{const u=r.mesh.geometry.getAttribute(k).array,v=s.mesh.geometry.getAttribute(k).array;return u.length===v.length&&u.every((n,i)=>n===v[i]);});});
   cases.push({name,baselineDrawCalls:old.calls,candidateDrawCalls:next.calls,eligibleImageMeshes:next.images,baselineTriangles:old.triangles,candidateTriangles:next.triangles,changedChannels,maxDelta,nonBackground,changedFromPrior,geometryIdentical});
  }
  renderer.setRenderTarget(null);renderer.clear();renderer.render(y.scene.scene,camera);
  window.__r67FixtureResources={renderer,x,y,target};return{device,cases};
 },{a:core(sourceA),b:core(sourceB),threeURL:new URL('vendor/three/build/three.module.js',site).href});
 for(const row of result.cases){
  assert.equal(row.geometryIdentical,true,row.name);assert.ok(row.nonBackground>1000,'Fixture must draw visible sprites');
  assert.equal(row.maxDelta,0,'Baseline and candidate WebGL pixels must be byte-identical: '+row.name);
  assert.equal(row.eligibleImageMeshes,48);assert.equal(row.baselineDrawCalls-row.candidateDrawCalls,48,'Exactly one redundant pass removed per eligible image mesh');
  if(row.name==='mutable-animation-frame-updated')assert.ok(row.changedFromPrior>1000,'Mutable animation must actually change pixels');
 }
 report.device=result.device;report.cases=result.cases;assert.deepEqual(errors,[]);report.errors=errors;
 await page.screenshot({path:out+'/webgl-fixture.png'});
 await page.evaluate(()=>{const r=window.__r67FixtureResources;r.x.scene.dispose();r.y.scene.dispose();r.x.rec.dispose();r.y.rec.dispose();r.target.dispose();r.renderer.dispose();});
 await context.close();report.status='passed';
}catch(e){report.status='failed';report.error=e.stack||String(e);throw e;}finally{await fs.writeFile(out+'/webgl-differential.json',JSON.stringify(report,null,2)+'\n');console.log('R67_WEBGL_DIFFERENTIAL',JSON.stringify(report));await browser.close();}
