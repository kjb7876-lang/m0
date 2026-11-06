// Local candidate injection only. Shared runtime registration remains owned by
// other open PRs. This is a placed-actor test, not a natural-play certification.
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),SRC=path.join(ROOT,'r96/client-source'),URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4397/',OUT=process.env.OUT||'/tmp/r375-browser',mobile=process.env.MOBILE==='1',tag=mobile?'mobile':'pc';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{let browser;const results=[],errors=[],hashes={};const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info??null).slice(0,700));};
try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1920,height:1080},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d','{"on":false}');const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf.call(window,t=>{if(!window.__freezeR375)cb(t)});});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));
 for(const f of ['enemy-facing-r375.js','mob-unique-r248.js','mobs-r109.js','world-scale-r375.js']){const body=fs.readFileSync(path.join(SRC,f),'utf8');hashes[f]=crypto.createHash('sha256').update(body).digest('hex');await p.route('**/'+f,r=>r.fulfill({contentType:'application/javascript',body}));}
 await p.route(URL,async r=>{const response=await r.fetch();const body=(await response.text()).replace('<script src="./combat-r118.js"></script>','<script src="./world-scale-r375.js"></script><script src="./enemy-facing-r375.js"></script><script src="./combat-r118.js"></script>');await r.fulfill({response,body});});
 await p.goto(URL,{waitUntil:'domcontentloaded',timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);guide=false;auto=false;});await skip();
 await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.activate('777'));await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(()=>enterRegion('dist03',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist03',null,{timeout:120000});await skip();
 const fixture=await p.evaluate(async()=>{
  window.__freezeR375=true;const S=window.__STORYWORLD_STORY_MOBS_R208__,e=room.enemies.find(e=>S.assign(e)?.id==='ember-hound');if(!e)throw Error('No actual R208 actor');
  const art=S.assign(e);await ensureImages([art.path]);
  // Use a visible clear patch close to the hero. The committed ray faces left;
  // the player has crossed to the right while the same attack is in progress.
  const start={x:player.x,y:player.y};let at=null;
  for(let radius=2;radius<8&&!at;radius+=.5)for(let j=0;j<16&&!at;j++){const a=j*Math.PI/8,q={x:start.x+Math.cos(a)*radius,y:start.y+Math.sin(a)*radius},h={x:q.x+1.7,y:q.y};if(!blocked(q.x,q.y,.4)&&!blocked(h.x,h.y,.4))at={q,h};}
  if(!at)throw Error('No collision-free fixture');for(const v of room.enemies)v.visible=v===e;
  Object.assign(e,{x:at.q.x,y:at.q.y,hp:e.maxHp,visible:true,spawnState:'active',hitTimer:0,flash:0,moving:false,rangedWindup:0,attack:{angle:Math.PI,elapsed:.52,shape154:{windup:.45,active:.16,recovery:.6,range:2},origin154:{...at.q}}});
  player.x=at.h.x;player.y=at.h.y;cam={x:(e.x+player.x)/2,y:(e.y+player.y)/2};zoom=1.4;route=[];command=null;target=e;
  window.__fixtureR375=e;const f=window.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,e.profile?.frames?.idle);
  return {id:e.nativeId,name:e.name,art:art.path,authored:art.facing||'right',r248:window.__STORYWORLD_MOB_UNIQUE_R248__?.sheetFor(e)?.path||null,frame:f,enemy:{x:e.x,y:e.y},player:{x:player.x,y:player.y}};
 });
 check('fixture uses actual R208 sheet with no R248 replacement',!!fixture.frame?.r208Mob&&!fixture.r248,fixture);
 const shots=[];for(const on of [false,true]){const info=await p.evaluate(on=>{const M=window.__STORYWORLD_ENEMY_FACING_R375__,e=window.__fixtureR375;M.set(on);draw();const f=window.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,e.profile?.frames?.idle);return{flip:window.__STORYWORLD_ENEMY_MOTION_R51__.flip(e,f),angle:e.attack.angle,origin:e.attack.origin154,position:[e.x,e.y,player.x,player.y],path:e.rc146BodyFrame?.path,rect:e.rc146BodyFrame?.assetFrame?.sourceRect,saveKeys:Object.keys(serializeSave()).sort(),inspect:M.inspect()};},on);shots.push(info);await p.screenshot({path:path.join(OUT,tag+(on?'-after':'-before')+'.png')});}
 check('actual body flips to committed attack direction after player crosses',shots[0].flip!==shots[1].flip&&shots[1].flip===(fixture.authored!=='left'),shots);
 check('position, origin, frame crop, attack angle and save schema unchanged',JSON.stringify({...shots[0],flip:0,inspect:0})===JSON.stringify({...shots[1],flip:0,inspect:0}));
 const geometry=await p.evaluate(()=>{const M=window.__STORYWORLD_WORLD_SCALE_R375__,E=window.__STORYWORLD_EXPLORATION__,rows=[];for(const l of ['STORY','DREAM'])for(const r of regions){try{const L=E.layout(r.id,l),Q=M.scaleLayout(L);rows.push({id:r.id,layer:l,before:L.floorCells.length,after:Q.floorCells.length,bounds:Q.bounds,ok:Q.floorCells.length===L.floorCells.length*4&&Q.bounds.every((v,i)=>v===L.bounds[i]*2)});}catch(e){rows.push({id:r.id,layer:l,ok:false,error:String(e)})}}return{rows,inspect:M.inspect()};});
 check('all 64 native region IDs in STORY and DREAM transform without source mutation',geometry.rows.length===128&&geometry.rows.every(r=>r.ok),{rows:geometry.rows.length,failures:geometry.rows.filter(r=>!r.ok),autoInstalled:geometry.inspect.autoInstalled});
 check('geometry remains inactive until runtime integration is complete',geometry.inspect.autoInstalled===false);
 const save=await p.evaluate(async()=>{const M=window.__STORYWORLD_ENEMY_FACING_R375__,data=serializeSave(),get=()=>({zone,layer,hero:player.hero,hp:player.hp,x:player.x,y:player.y});const expected=get();M.set(true);await restoreSave(data);const candidate=get();M.set(false);await restoreSave(data);const control=get();M.set(true);return{expected,candidate,control,noNewFields:!JSON.stringify(data).includes('r375')};});
 check('actual save restore matches disabled control; no R375 save fields',save.noNewFields&&JSON.stringify(save.candidate)===JSON.stringify(save.control),save);
 check('no page errors',errors.length===0,errors);
 fs.writeFileSync(path.join(OUT,tag+'-result.json'),JSON.stringify({mode:'headless controlled placed-actor scene; geometry transformed offline only',viewport:await p.viewportSize(),hashes,fixture,shots,geometry,results,errors},null,2));assert(results.every(r=>r.ok),'Browser check failed');
}finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1});
