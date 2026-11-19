// Local-only integration fixture. Inject candidate source plus three admission
// hooks into a byte-verified baseline; never rewrite shared runtime registration.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),OUT=process.env.OUT||path.join(require('os').tmpdir(),'storyworld-r374-proof'),URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/';
const mobile=process.env.MOBILE==='1',tag=mobile?'mobile':'pc';fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 let browser;const results=[],errors=[],sourceHashes={};
 const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info??null).slice(0,500));};
 try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1920,height:1080},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{
  localStorage.setItem('storyworld.r183.scene3d','{"on":false}');
  const raf=window.requestAnimationFrame;window.requestAnimationFrame=cb=>raf.call(window,t=>{if(!window.__freezeR374)cb(t)});
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));
 for(const file of ['mob-shadow-r374.js','mob-flank-r230.js','mob-gaze-r268.js','mob-motion-r286.js']){
  const body=fs.readFileSync(path.join(ROOT,'r96/client-source',file),'utf8');sourceHashes[file]=crypto.createHash('sha256').update(body).digest('hex');await p.route('**/'+file,r=>r.fulfill({contentType:'application/javascript',body}));
 }
 await p.route(URL,async route=>{const r=await route.fetch();const html=(await r.text()).replace('<script src="./combat-r118.js"></script>','<script src="./mob-shadow-r374.js"></script>\n<script src="./combat-r118.js"></script>');await route.fulfill({response:r,body:html});});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);guide=false;auto=false;});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();
 await p.evaluate(async()=>await window.__STORYWORLD_CHEAT777__.activate('777'));
 await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(()=>enterRegion('dist02',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist02',null,{timeout:120000});await skip();
 await p.waitForFunction(()=>window.__STORYWORLD_MOBS_R109__.inspect().state==='ready');
 const integration=await p.evaluate(()=>{
  const M=window.__STORYWORLD_MOB_SHADOW_R374__;
  const rows=room.enemies.filter(e=>e.spawnState==='active').map(e=>({id:e.nativeId,name:e.name,kind:M.kindOf(e)}));
  return {rows,inspect:M.inspect(),frameErrors:typeof errors==='undefined'?null:errors.slice(-3)};
 });
 check('actual asset precedence: two target families, spider/mage preserved',integration.rows.filter(r=>r.kind).every(r=>['dist02-h1','dist02-g1'].includes(r.id))&&integration.rows.some(r=>r.kind==='attack-only'),integration);
 // Freeze scheduling, then advance actual moveAI3 at fixed simulation dt. This
 // removes random battle interruption from the paired visual test, not from play.
 const fixture=await p.evaluate(async()=>{
  window.__freezeR374=true;
  const M=window.__STORYWORLD_MOB_SHADOW_R374__,e=room.enemies.find(e=>e.nativeId==='dist02-h1'&&e.spawnState==='active');
  const p0={x:player.x,y:player.y},heroScreen=project(p0.x,p0.y);let from=null,goal=null;
  for(let radius=3;radius<12&&!from;radius+=.5)for(let i=0;i<32&&!from;i++){
   const a=i*Math.PI/16,q={x:p0.x+Math.cos(a)*radius,y:p0.y+Math.sin(a)*radius};
   for(let j=0;j<8;j++){
    const b=j*Math.PI/4,g={x:q.x+Math.cos(b)*1.8,y:q.y+Math.sin(b)*1.8};
    const visible=[0,.25,.5,.75,1].every(u=>{const s=project(q.x+(g.x-q.x)*u,q.y+(g.y-q.y)*u);return s.x>35&&s.x<innerWidth-65&&s.y>180&&s.y<innerHeight-180&&Math.hypot(s.x-heroScreen.x,s.y-heroScreen.y)>85;});
    if(visible&&M.pathSafe(e,q,g)&&clearLine(q,p0)){from=q;goal=g;break;}
   }
  }
  if(!from)throw Error('No safe visible fixture segment');
  window.__fixtureR374={e,from,goal};e.x=from.x;e.y=from.y;e.homeX=e.x;e.homeY=e.y;e.nav=[];e.navAt=-1;e.cd=99;e.rest=0;e.attack=null;e.rangedWindup=0;e.hitTimer=0;e.graceUntil=0;e.r286=null;e.r268Dash=null;
  await ensureImages(Object.values(window.__STORYWORLD_MOBS_R109__.trackFor(e)).filter(v=>v?.path).map(v=>v.path));
  M.set(true);draw();
  return {nativeId:e.nativeId,name:e.name,from,goal,player:p0,speed:e.speed};
 });
 const poses=[];
 for(let frame=1;frame<=44;frame++){
  const info=await p.evaluate(()=>{const f=window.__fixtureR374;time+=1/60;moveAI3(f.e,f.goal,1/60);draw();return{x:f.e.x,y:f.e.y,moving:f.e.moving,motion:window.__STORYWORLD_MOB_SHADOW_R374__.motion(f.e),frame:f.e.rc146BodyFrame?.path,sourceRect:f.e.rc146BodyFrame?.assetFrame?.sourceRect,attackRestored:!f.e.attack};});
  poses.push(info);
  if([5,11,16,22,27,33,38,44].includes(frame))await p.screenshot({path:path.join(OUT,`${tag}-motion-${frame}.png`)});
 }
 check('gather and burst both reached',poses.some(p=>p.motion?.phase==='gather')&&poses.some(p=>p.motion?.phase==='burst'),poses.filter((p,i)=>[4,15,21,37,43].includes(i)));
 check('body pose never creates gameplay attack',poses.every(p=>p.attackRestored));
 check('safe path makes progress without teleport',Math.hypot(poses.at(-1).x-fixture.from.x,poses.at(-1).y-fixture.from.y)>.1&&poses.every((p,i)=>!i||Math.hypot(p.x-poses[i-1].x,p.y-poses[i-1].y)<.2));
 const samePosition=await p.evaluate(()=>{const f=window.__fixtureR374;return{x:f.e.x,y:f.e.y,player:{x:player.x,y:player.y},time,project:project(f.e.x,f.e.y)};});
 await p.screenshot({path:path.join(OUT,`${tag}-after.png`)});
 await p.evaluate(()=>{window.__STORYWORLD_MOB_SHADOW_R374__.set(false);draw()});await p.screenshot({path:path.join(OUT,`${tag}-before.png`)});
 const afterDisable=await p.evaluate(()=>{const f=window.__fixtureR374;return{x:f.e.x,y:f.e.y,player:{x:player.x,y:player.y},time,project:project(f.e.x,f.e.y)};});
 check('paired images retain exact position/time/projection',JSON.stringify(samePosition)===JSON.stringify(afterDisable),samePosition);
 const door=await p.evaluate(()=>{
  const M=window.__STORYWORLD_MOB_SHADOW_R374__,W=window.__STORYWORLD_WORLD_R74__,e=window.__fixtureR374.e,old={x:e.x,y:e.y};M.set(true);
  try{for(const d of room.exploration?.worldR74?.doors||[]){if(W.isOpen(room,d))continue;
   for(const pad of [.5,.8,1.2,1.6]){
    const alongY=d.width>=d.depth,offset=(alongY?d.depth:d.width)/2+pad;
    const a={x:d.x-(alongY?0:offset),y:d.y-(alongY?offset:0)},b={x:d.x+(alongY?0:offset),y:d.y+(alongY?offset:0)};
    if(blocked(a.x,a.y,.3,room)||blocked(b.x,b.y,.3,room))continue;
    e.x=a.x;e.y=a.y;return{id:d.id,from:a,to:b,endpointFree:true,pathClear:M.pathSafe(e,a,b),admitted:M.canRelocate(e,b)};
   }
  }}finally{e.x=old.x;e.y=old.y}
  return null;
 });
 check('actual closed map door rejects relocation between free endpoints',door&&door.endpointFree&&!door.pathClear&&!door.admitted,door);
 // Exercise the real schema and restore path in this isolated browser profile.
 const save=await p.evaluate(async()=>{
  const M=window.__STORYWORLD_MOB_SHADOW_R374__;M.set(true);const data=serializeSave();
  const keys=Object.keys(data).sort(),enemyFields=[...new Set(Object.values(data.rooms||{}).flatMap(r=>(r.enemies||[]).flatMap(e=>Object.keys(e))))].sort();
  const expected={zone,layer,hero:player.hero,hp:player.hp,x:player.x,y:player.y};
  await restoreSave(data);
  const restored={zone,layer,hero:player.hero,hp:player.hp,x:player.x,y:player.y};
  M.set(false);await restoreSave(data);
  const control={zone,layer,hero:player.hero,hp:player.hp,x:player.x,y:player.y};M.set(true);
  return{keys,enemyFields,noMotionFields:!JSON.stringify(data).includes('r374'),expected,restored,control,candidate:M.inspect()};
 });
 check('real save schema contains no new movement state',save.noMotionFields,save.enemyFields);
 // Initial mobile test found entry-point relocation. Preserve that evidence and
 // compare the exact same save with fallback disabled: compatibility means the
 // candidate must not introduce a different schema or restoration result.
 check('real save round-trip matches disabled control exactly',JSON.stringify(save.control)===JSON.stringify(save.restored),save);
 check('real save restores hero, region and HP', ['zone','layer','hero','hp'].every(k=>save.expected[k]===save.restored[k]),{expected:save.expected,restored:save.restored});
 if(JSON.stringify(save.expected)!==JSON.stringify(save.restored))console.log('BASELINE_POSITION_RELOCATION '+JSON.stringify({expected:save.expected,control:save.control,restored:save.restored}));
 check('no page errors',errors.length===0,errors);
 if(!mobile){
  const audit=await p.evaluate(()=>{
   const old={room,zone,layer},counts={},rows=[];
   try{for(const l of ['STORY','DREAM'])for(const region of regions){
    zone=region.id;layer=l;room=makeRoom(region.id,l);
    for(const e of room.enemies){const k=window.__STORYWORLD_MOB_SHADOW_R374__.kindOf(e);counts[k||'preserved']=(counts[k||'preserved']||0)+1;
     if(k)rows.push({zone,layer,nativeId:e.nativeId,name:e.name,kind:k,speed:e.speed});}
   }}finally{room=old.room;zone=old.zone;layer=old.layer}
   return{counts,rows};
  });
  fs.writeFileSync(path.join(OUT,'audit-all.json'),JSON.stringify({sourceHashes,mode:'generated room classification; not full campaign traversal',...audit},null,2));console.log('AUDIT '+JSON.stringify(audit.counts));
 }
 fs.writeFileSync(path.join(OUT,`${tag}-result.json`),JSON.stringify({sourceHashes,mode:'headless placed-actor actual-moveAI3 fixture; not natural play or physical GPU',viewport:await p.viewportSize(),dpr:mobile?3:1,fixture,poses,results,errors},null,2));
 assert(results.every(r=>r.ok),'Browser checks failed');
 }finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
