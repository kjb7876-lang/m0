import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const site=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/',out='out/r69';await fs.mkdir(out,{recursive:true});
const sources={baseline:{html:await fs.readFile('_r68/docs/index.html','utf8'),js:await fs.readFile('_r68/docs/dist/phase1.js','utf8')},candidate:{html:await fs.readFile('_pages/docs/index.html','utf8'),js:await fs.readFile('_pages/docs/dist/phase1.js','utf8')}};
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const report={browser:await browser.version(),physicalGPU:false,physicalMobile:false,sandbox:true,baseline:'9002bfd3d4cc536f799eee77caaad87467623ee9',candidate:process.env.GITHUB_SHA||'local',status:'running',native:[]};
const stats=v=>{const s=v.slice().sort((a,b)=>a-b),at=p=>s[Math.floor((s.length-1)*p)]??null;return{count:s.length,p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),meanMs:s.length?s.reduce((a,b)=>a+b,0)/s.length:null,over50ms:s.filter(x=>x>50).length}};
function core(s){const a=s.indexOf('const affinePoint='),b=s.indexOf('/* All compiled regions depth/shadow path.',a);assert.ok(a>=0&&b>a);return s.slice(a,b)}
try{
 const cx=await browser.newContext({viewport:{width:660,height:500}}),page=await cx.newPage(),url=new URL('__r69_fixture.html',site).href;await page.route(url,r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0"></body>'}));await page.goto(url);
 report.fixture=await page.evaluate(async({a,b,threeURL})=>{
  const T=await import(threeURL),finite=(v,d=0)=>Number.isFinite(v)?v:d,A=new Function('finite',a+';return{DrawCommands,CommandScene}')(finite),B=new Function('finite',b+';return{DrawCommands,CommandScene}')(finite);
  const renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});renderer.setSize(640,480);renderer.setClearColor(0x142638,1);document.body.appendChild(renderer.domElement);
  const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),device=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  const camera=new T.OrthographicCamera(-4,4,3,-3,.1,100);camera.position.set(0,0,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const projection={width:640,height:480,zoom:1,tile:40,camX:0,camY:0,pixelsPerUnit:80,screenToWorld:(x,y)=>({x:(x-320)/80,y:(240-y)/80}),worldToScreen:(x,y)=>({x:320+x*80,y:240-y*80})};
  const create=P=>({r:new P.DrawCommands({canvas:{},makeCanvas:()=>document.createElement('canvas')}),s:new P.CommandScene(T,{projection,camera})}),x=create(A),y=create(B),target=new T.WebGLRenderTarget(640,480),cases=[];
  function commands(r,n){r.reset();for(let i=0;i<8;i++)r.scope({id:'gradient-'+i,kind:'effect',x:0,y:0},()=>{r.save();r.translate(40+i%4*150+n,55+Math.floor(i/4)*190+n*.4);const g=i%2?r.createRadialGradient(40,40,0,40,40,70+n):r.createLinearGradient(0,0,90+n,100);g.addColorStop(0,'rgba(120,10,60,.25)');g.addColorStop(.5,'rgba(100,170,250,.7)');g.addColorStop(1,'#fff');r.fillStyle=g;r.globalAlpha=.65;r.fillRect(0,0,110,120);r.restore()});return r.finish()}
  function draw(row,n){row.s.render(commands(row.r,n));renderer.setRenderTarget(target);renderer.clear();renderer.render(row.s.scene,camera);const p=new Uint8Array(640*480*4);renderer.readRenderTargetPixels(target,0,0,640,480,p);return p}
  for(const n of [0,1,7,19,2,0]){draw(x,n);draw(y,n);const u=draw(x,n),v=draw(y,n);let maxDelta=0,changed=0,visible=0;for(let i=0;i<u.length;i++){const d=Math.abs(u[i]-v[i]);maxDelta=Math.max(maxDelta,d);if(d)changed++;if(i%4===0&&v[i]!==v[0])visible++}cases.push({n,maxDelta,changed,visible})}
  const reuse={baseline:x.s.inspect(),candidate:y.s.inspect()};renderer.setRenderTarget(null);renderer.clear();renderer.render(y.s.scene,camera);
  window.__r69Fixture={renderer,x,y,target};return{device,cases,reuse};
 },{a:core(sources.baseline.js),b:core(sources.candidate.js),threeURL:new URL('vendor/three/build/three.module.js',site).href});
 for(const c of report.fixture.cases){assert.equal(c.maxDelta,0,'Gradient uniform reuse must preserve WebGL pixels');assert.ok(c.visible>1000)}assert.equal(report.fixture.reuse.candidate.styleReplacements,0);assert.ok(report.fixture.reuse.baseline.styleReplacements>0);await page.screenshot({path:out+'/gradient-webgl.png'});await cx.close();
 for(const kind of ['baseline','candidate']){
  const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{let seed=69018;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}});
  await p.route(site,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:sources[kind].html}));await p.route('**/dist/phase1.js*',r=>r.fulfill({contentType:'text/javascript',body:sources[kind].js}));
  try{
   await p.goto(site,{waitUntil:'load',timeout:60000});await p.locator('#campaignNew54').click({timeout:60000});await p.waitForFunction(()=>{const s=window.__STORYWORLD_STORY_PROFILE_R54__?.inspect?.();return s?.busy===false&&s.stage==='playing'&&!s.error&&window.eval('started&&booted&&!loading')},null,{timeout:60000});
   assert.equal(await p.evaluate(()=>{auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;return enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})}),true);
   await p.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});
   assert.equal(await p.evaluate(()=>window.__STORYWORLD_PHASE1__.inspect().active),'three');
   const setup=await p.evaluate(()=>{auto=false;settings.autoSkill=false;settings.lowFx=false;settings.reducedMotion=false;settings.sound=false;settings.music=false;room.engaged=true;player.hp=maxHP()*100;player.points+=200;const prog=window.__STORYWORLD_PROGRESSION_R62__;for(const id of ['threadDanceR63','threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'])prog.purchase(id,player);prog.state(player).ranks.threadDanceR63=4;player.ego=1000;room.enemies.forEach((e,i)=>{e.x=player.x+2+(i%3)*.6;e.y=player.y+(Math.floor(i/3)-.5)*1.1;e.hp=e.maxHp=1e8;e.difficultyBaseHpR63=1e8/(e.difficultyFactorR63||1);e.spawnState='active';e.deadRecorded=false});window.__r69Hits=0;window.__r69Motifs=new Set();const hit=hitEnemy;hitEnemy=function(e,value,s){if(s?.ability==='threadDanceR63')window.__r69Hits++;return hit.apply(this,arguments)};const draw=drawEffect;drawEffect=function(e,...a){if(e?.threadR63)window.__r69Motifs.add(e.threadR63.motif);return draw.call(this,e,...a)};const ok=window.__STORYWORLD_CAMPAIGN_R63R1__.cast(true);return{ok,time,rank:prog.ranks('threadDanceR63',player),cooldown:window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().activeSkillCooldown}});
   assert.equal(setup.ok,true);assert.ok(setup.cooldown<=4&&setup.cooldown>0);
   await p.waitForFunction(()=>window.__r69Hits>0,null,{timeout:60000});
   if(kind==='baseline')await p.waitForFunction(()=>window.__STORYWORLD_PHASE1__.inspect().active==='legacy',null,{timeout:60000});
   else await p.waitForFunction(()=>window.__r69Motifs.size===6,null,{timeout:120000});
   const before=await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.inspect();return {active:r.active,reason:r.reason,events:r.events,time,hits:window.__r69Hits,motifs:[...window.__r69Motifs]}});
   if(kind==='candidate'){assert.equal(before.active,'three',JSON.stringify(before));assert.equal(before.motifs.length,6)}else{assert.equal(before.active,'legacy');assert.match(JSON.stringify(before),/bezierCurveTo/)}
   const frames=await p.evaluate(ms=>new Promise(resolve=>{let start=null,last=null;const rows=[];function frame(t){if(start===null)start=t;if(last!==null)rows.push(t-last);last=t;if(t-start>=ms)resolve(rows);else requestAnimationFrame(frame)}requestAnimationFrame(frame)}),10000);
   const after=await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.inspect();return{active:r.active,reason:r.reason,events:r.events,time,hits:window.__r69Hits,motifs:[...window.__r69Motifs],commandScene:r.commandScene,counts:{effects:effects.length,projectiles:projectiles.length,enemies:room.enemies.length}}});
   if(kind==='candidate')assert.equal(after.active,'three',JSON.stringify(after));assert.ok(frames.length>=10);assert.deepEqual(errors,[]);await p.screenshot({path:out+'/ego-'+kind+'.png'});report.native.push({kind,setup,before,after,frames:stats(frames),errors});
   console.log('R69_NATIVE_EGO',JSON.stringify(report.native.at(-1)));
  }finally{await context.close();await fs.writeFile(out+'/browser.json',JSON.stringify(report,null,2))}
 }
 report.status='passed';report.caveat='Staged genuine EGO skill with six owned motifs, high-HP enemies and rank 4. Software/headless browser; not a real PC/mobile GPU benchmark. Baseline and candidate renderer paths differ, so timings cannot isolate an optimization percentage.';
}catch(e){report.status='failed';report.error=e.stack||String(e);throw e}finally{await fs.writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');console.log('R69_BROWSER',JSON.stringify(report));await browser.close()}
