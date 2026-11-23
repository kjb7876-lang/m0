import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const url=process.env.SW25_PROOF_URL||process.env.STORYWORLD_URL;
assert.ok(url,'SW25_PROOF_URL (or STORYWORLD_URL) required: serve exact approved candidate locally');
const out=path.resolve(process.env.SW25_PROOF_OUTPUT||'sw0025-visual-pairs');
await fs.mkdir(out,{recursive:true});
const isPatch=u=>new URL(u).pathname.endsWith('/assets/r1306/slayer-attack.json');
const isGLB=u=>new URL(u).pathname.endsWith('/assets/r1305/slayer-3d.glb');
const ctl=['desktop','touch-portrait'];
const cache={desktop:{width:1280,height:800,deviceScaleFactor:1,hasTouch:false,isMobile:false},
 'touch-portrait':{width:390,height:730,deviceScaleFactor:2,hasTouch:true,isMobile:true}};
const report={schema:'sw0025-same-camera-webgl-visual-pair/v1',url,physicalDevice:false,
 capture:'sandboxed headless Chromium WebGL; explicit disposable fixture; not real device or play',
 renderControls:{sameExactStockGLB:true,stockExperiment:'Abort only Slayer attack delta; native runtime falls back to stock',timing:'native basicAttack until measured blended mixer progress; no forced pose or body commands'},
 viewports:{},errors:[],passed:false};
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const snap=async(page,file)=>createHash('sha256').update(await page.locator('#phase1-webgl').screenshot({path:path.join(out,file),scale:'device',timeout:30000})).digest('hex');
const raf=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const visualState=page=>page.evaluate(()=>{
 const P=window.__STORYWORLD_PHASE1__,S=P.capture(),t=P.controller.state.three;
 const m=window.__STORYWORLD_HWANDO3D_R1302__,c=document.getElementById('phase1-webgl'),gl=t.renderer?.getContext?.();
 return {zone,layer,room:room.id,world:[player.x,player.y],view:S.viewport,gameTime:time,paused:modal,
  projected:project(player.x,player.y),resolved:S.projection,
  camera:{position:t.camera.position.toArray(),quaternion:t.camera.quaternion.toArray(),zoom:t.camera.zoom,
   world:t.camera.matrixWorld.elements.slice(),projection:t.camera.projectionMatrix.elements.slice()},
  device:{devicePixelRatio,navigatorTouch:navigator.maxTouchPoints,innerWidth,innerHeight,canvasWidth:c.width,canvasHeight:c.height},
  renderer:P.controller.inspect().active,webgl:!!gl&&typeof gl.isContextLost==='function'&&!gl.isContextLost(),model:m.inspect(),
  enemies:room.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,nativeId:e.nativeId,spawnState:e.spawnState,visible:e.visible}))};
});
const cropShot=(a,b,why)=>{assert.equal(a.zone,b.zone,why+' zone');assert.equal(a.layer,b.layer);assert.equal(a.room,b.room);
 for(const k of ['world','projected','resolved','camera','view','device'])
  assert.deepEqual(b[k],a[k],why+' changed '+k);};

async function boot(page,coords){
 const response=await page.goto(url,{timeout:120000});assert.equal(response.status(),200);
 await page.locator('#campaignNew54').click({timeout:120000});await page.locator('#slotConfirmR73').click();
 await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:120000});
 await page.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.controller?.inspect().active==='three',null,{timeout:120000});
 assert.equal(await page.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.on()),false);
 await page.evaluate(()=>{if(room?.id!=='dist00')return enterRegion('dist00',null,{layer:'STORY',restore:true});});
 await page.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:150000});
 return page.evaluate(coords=>{
  for(let i=0;i<160&&storyScene;i++)advanceScene();
  if(modal)closePanel(true);
  if(storyScene||modal)throw Error('Could not leave opening panel');
  auto=false;guide=false;settings.autoSkill=false;clearControls();route=[];command=null;
  player.hp=player.maxHp=99999;player.moving=false;
  settings.reducedMotion=true;
  if(coords){player.x=coords.x;player.y=coords.y;zoom=coords.zoom;}else coords={x:player.x,y:player.y,zoom};
  cam.x=coords.x;cam.y=coords.y;shake=0;
  return coords;
 },coords);
}

async function contactPair(page,mode){
 const target=await page.evaluate(()=>{
  modal=true;shake=0;effects.length=0;hazards.length=0;projectiles.length=0;
  const target=room.enemies.find(e=>e.nativeId==='dist00-boss'&&e.hp>0)||room.enemies.find(e=>e.hp>0);
  if(!target)throw Error('No native contact actor');
  // Keep exactly one existing native actor, not a constructed body frame.
  room.enemies.splice(0,room.enemies.length,target);
  Object.assign(target,{visible:true,disabled:false,spawnState:'active',deadRecorded:false,x:player.x+1.2,y:player.y,visualLiftPx:0,speed:0,damage:0});
  return {id:String(target.id),nativeId:target.nativeId,x:target.x,y:target.y};
 });
 const pairs={target};
 for(const [name,on] of [['before',false],['after',true]]){
  await page.evaluate(on=>window.__STORYWORLD_MOB_GROUND_R206__.set({contact:on}),on);
  await raf(page);
  const found=await page.evaluate(target=>{
   const rows=window.__STORYWORLD_PHASE1__.captureVisual();
   const key='enemy:'+target.id;
   const close=c=>Math.abs(c.owner?.x-target.x)<.002&&Math.abs(c.owner?.y-target.y)<.002;
   return {bodies:rows.filter(c=>c.kind==='image'&&c.owner?.kind==='enemy'&&c.owner.id===key&&close(c)).map(c=>({path:c.sourcePath,rect:c.sourceRect,points:c.points})),
    contacts:rows.filter(c=>c.kind==='fill'&&c.owner?.kind==='contact'&&c.owner.id===key&&close(c)&&c.style?.fillStyle==='#0b0d0e').map(c=>({points:c.paths[0].points,alpha:c.style.globalAlpha}))};
  },target);
  assert.ok(found.bodies.length,'actual native body recorded for '+target.nativeId);
  assert.equal(found.contacts.length,on?1:0,'only the scoped compact contact');
  await raf(page);
  const state=await visualState(page), png=mode+'-contact-'+name+'.png';
  assert.equal(state.renderer,'three');assert.equal(state.paused,true);
  const sha256=await snap(page,png);pairs[name]={png,sha256,...state,found};
 }
 cropShot(pairs.before,pairs.after,'contact');
 assert.equal(pairs.after.gameTime,pairs.before.gameTime,'contact frame frozen');
 assert.notEqual(pairs.after.sha256,pairs.before.sha256,'capture must show a pixel change for contact');
 assert.deepEqual(pairs.after.enemies,pairs.before.enemies,'one unchanged enemy');
 assert.deepEqual(pairs.after.found.bodies,pairs.before.found.bodies,'native art/crop/body pose fixed');
 return pairs;
}

async function readySlayer(page,expected,coords){
 await page.evaluate(async coords=>{
  // Remove hostile context: native boss shock changes attack time even with zero ordinary damage.
  room.enemies.length=0;effects.length=0;hazards.length=0;projectiles.length=0;
  window.__STORYWORLD_HWANDO3D_R1302__.set(false);
  await ensureImages(heroPaths('slayer'));
  player.hero='slayer';player.direction='right';player.moving=false;player.attackAnim=0;player.attackCD=0;
  window.__STORYWORLD_PERSONA_HERO_R1113__.setForm(false);window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false);
  window.__STORYWORLD_MOB_GROUND_R206__.set({contact:true});
  player.x=coords.x;player.y=coords.y;cam.x=coords.x;cam.y=coords.y;zoom=coords.zoom;modal=false;
  clearControls();route=[];command=null;shake=0;
 },coords);
 await page.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().hero==='slayer',null,{timeout:30000});
 await page.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
 await page.waitForFunction(expected=>{
  const m=window.__STORYWORLD_HWANDO3D_R1302__,v=m.inspect();
  return v.hero==='slayer'&&v.attackVariant===expected&&v.action==='idle'&&v.shown&&v.lastBodies>0&&v.sharedScene&&m.measure()?.ink>100&&!modal&&room.enemies.length===0;
 },expected,{timeout:90000});
}

async function timedAttack(page,target){
 // Observe the actual model mixer. Native mixer is delegated unchanged; pause after
 // crossing the desired sample so screenshots cannot expose the next animation.
 const result=await page.evaluate(async target=>{
  const api=window.__STORYWORLD_HWANDO3D_R1302__,T=window.__STORYWORLD_PHASE1__.controller.state.three.T;
  const mixerProto=T.AnimationMixer.prototype,original=mixerProto.update,trace=[];
  let frozen=null,crossing=null,armed=true;
  const start=performance.now(),drawBefore=api.inspect().drawn,gameStart=time;
  function finish(_mixer,row){
   armed=false;
   crossing={...row};
   frozen={...row};
   modal=true;shake=0;
  }
  const observe=function(...args){
   const result=original.apply(this,args);
   if(armed&&this.getRoot()?.name==='r1305-slayer-3d-model'){
    const a=this._actions?.find(a=>a.getClip()?.name==='Attack_DownCleave');
    const duration=a?.getClip()?.duration,weight=a?.getEffectiveWeight(),progress=duration>0?a.time/duration:null;
    if(Number.isFinite(progress)&&Number.isFinite(weight)){
     const row={gameTime:time,progress,mixerTime:a.time,clipSeconds:duration,weight,attackAnim:player.attackAnim,cd:player.attackCD,hero:player.hero};
     if(trace.length<180)trace.push(row);
     if(weight>.55&&progress>=target-.0001)finish(this,row);
    }
   }
   return result;
  };
  mixerProto.update=observe;
  try{
   basicAttack(true);
   const trigger={anim:player.attackAnim,cd:player.attackCD,direction:player.direction};
   if(!(trigger.anim>0||trigger.cd>0))throw Error('Native basic attack was not admitted');
   while(!frozen&&performance.now()-start<45000)await new Promise(r=>requestAnimationFrame(r));
   const visible=api.inspect();
   if(!frozen||!visible.shown||visible.action!=='attack'||visible.drawn<=drawBefore||frozen.gameTime<=gameStart)throw Error('Missing actual attack pose: '+JSON.stringify({trigger,trace,visible}));
   return {pose:frozen,crossing,trigger,trace,drawBefore,visible};
  }finally{if(mixerProto.update===observe)mixerProto.update=original;}
 },target);
 return result;
}

async function heroPairShot(page,mode,variant,coords,target){
 const expected=variant==='stock'?'stock-fallback':'r1306';
 await readySlayer(page,expected,coords);
 const attack=await timedAttack(page,target);
 await raf(page);
 const state=await visualState(page),png=mode+'-slayer-'+variant+'.png';
 assert.equal(state.renderer,'three');assert.equal(state.paused,true);
 assert.equal(state.gameTime,attack.pose.gameTime,'still frozen at measured pose');
 assert.equal(state.model.attackVariant,expected);assert.equal(state.model.shown,true);
 assert.ok(state.model.lastBodies>0&&state.model.action==='attack');
 const sha256=await snap(page,png);
 assert.equal((await visualState(page)).gameTime,state.gameTime);
 return {png,sha256,...state,attack};
}

try{
 for(const mode of ctl){
  const spec=cache[mode],{width,height,...b}=spec;
  const rows=report.viewports[mode]={profile:spec};
  let coords=null,matchTarget=.56;
  for(const variant of ['candidate','stock']){
   const context=await browser.newContext({viewport:{width,height},...b});
   const calls={patchRequests:0,rejectedPatch:0,glb:[],errors:[]},page=await context.newPage();
   const glb=[];
   page.on('pageerror',x=>calls.errors.push(String(x.message||x)));
   page.on('request',r=>{if(isPatch(r.url()))calls.patchRequests++;});
   page.on('response',r=>{if(isGLB(r.url())&&r.ok())glb.push(r.body().then(b=>({path:new URL(r.url()).pathname,sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length})));});
   if(variant==='stock')await context.route(u=>isPatch(u.href),route=>{calls.rejectedPatch++;return route.abort('failed');});
   try{
    coords=await boot(page,coords);
    if(variant==='candidate')rows.contact=await contactPair(page,mode);
    const shot=await heroPairShot(page,mode,variant,coords,matchTarget);
    if(variant==='candidate')matchTarget=shot.attack.crossing.progress;
    calls.glb=await Promise.all(glb);
    rows[variant]={...shot,calls};
    assert.equal(shot.device.devicePixelRatio,spec.deviceScaleFactor);
    if(spec.hasTouch)assert.ok(shot.device.navigatorTouch>0);
    assert.ok(shot.webgl);assert.deepEqual(calls.errors,[]);
    assert.ok(calls.patchRequests>0&&(variant==='stock'?calls.rejectedPatch>0:calls.rejectedPatch===0));
    assert.ok(calls.glb.length===1,'expected exact one stock model fetch');
   }finally{await context.close();}
  }
  const {candidate,stock}=rows;
  cropShot(candidate,stock,'Slayer '+mode);
  assert.notEqual(candidate.sha256,stock.sha256,'capture must show a pixel change for attack');
  assert.deepEqual(candidate.calls.glb,stock.calls.glb,'exact same original GLB, verified over response bytes');
  assert.equal(candidate.attack.trigger.direction,stock.attack.trigger.direction,'native attack facing');
  assert.ok(Math.abs(candidate.model.yaw-stock.model.yaw)<.10,'model orientations diverged');
  assert.ok(Math.abs(candidate.attack.pose.progress-stock.attack.pose.progress)<=.10,'normalized action samples not comparable');
  assert.ok(Math.abs(candidate.attack.pose.clipSeconds-stock.attack.pose.clipSeconds)<.01,'source clip domains diverged');
 }
 report.passed=true;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}
finally{await fs.writeFile(path.join(out,'same-camera-visual-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
