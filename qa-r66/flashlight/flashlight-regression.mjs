import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const pixelmatch=require('pixelmatch').default;
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4383/';
const OUT=path.resolve('qa-r66/flashlight');
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-breakpad','--disable-crash-reporter']});
const pageErrors=[];
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
  const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(URL,{waitUntil:'load',timeout:60000});await page.waitForTimeout(500);
  await page.locator('#campaignNew54').click();await page.waitForFunction(()=>window.eval('started&&!loading'),null,{timeout:30000});
  const entered=await page.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})"));
  assert.equal(entered,true);await page.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});await page.waitForTimeout(1500);
  const setup=await page.evaluate(()=>({ua:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},renderer:window.__STORYWORLD_PHASE1__?.inspect?.(),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight,classes:c.className})),gear:(()=>{const e=document.querySelector('#mobileSettingsR63'),r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null})(),zone,layer,player:{x:player.x,y:player.y},cam:{...cam},light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),stageClass:document.querySelector('#stage')?.classList.contains('flashlight-black-r58')}));
  assert.equal(setup.light.deviceClass,'mobile');assert.equal(setup.light.flashlight,true,'mobile default is surrounding sight');
  await page.evaluate(()=>{room.engaged=false;player.x=15;player.y=19;player.moving=false;cam={x:15,y:19};route=[];command=null;target=null;effects.length=0;projectiles.length=0;hazards.length=0;});
  await page.evaluate(()=>window.__STORYWORLD_PRESENTATION_R58__.setFlashlight(true));await page.waitForTimeout(500);
  const onState=await page.evaluate(()=>({setting:window.__STORYWORLD_PRESENTATION_R58__.inspect(),sight:window.__STORYWORLD_SIGHT24__.inspect(),geometry:window.__STORYWORLD_SIGHT24__.geometry(),stageBlack:document.querySelector('#stage')?.classList.contains('flashlight-black-r58'),ctx:window.eval('canvas.getContext("2d")!==null'),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height}))}));
  assert.equal(onState.setting.flashlight,true);assert.equal(onState.sight.enabled,true);assert.equal(onState.geometry.enabled,true);assert.equal(onState.stageBlack,true,'flashlight mode sets a black stage backdrop');
  await page.screenshot({path:path.join(OUT,'flashlight-on-mobile-portrait.png')});

  await page.evaluate(()=>window.__STORYWORLD_PRESENTATION_R58__.setFlashlight(false));await page.waitForTimeout(500);
  const offState=await page.evaluate(()=>({setting:window.__STORYWORLD_PRESENTATION_R58__.inspect(),sight:window.__STORYWORLD_SIGHT24__.inspect(),geometry:window.__STORYWORLD_SIGHT24__.geometry(),stageBlack:document.querySelector('#stage')?.classList.contains('flashlight-black-r58')}));
  assert.equal(offState.setting.flashlight,false);assert.equal(offState.setting.maskEnabled,false);assert.equal(offState.sight.enabled,false);assert.equal(offState.geometry.enabled,false);assert.equal(offState.stageBlack,false,'full-vision mode restores the regular stage background');
  await page.screenshot({path:path.join(OUT,'flashlight-off-mobile-portrait.png')});

  // Exercise actual touch input in the Settings checkbox, not a synthetic DOM
  // property change. The game canvas must not receive this menu tap.
  await page.evaluate(()=>{window.__flashlightCanvasPointerDowns=0;document.querySelector('#game').addEventListener('pointerdown',()=>window.__flashlightCanvasPointerDowns++,{capture:true,once:true});window.__flashlightToggleEvents=[];const box=document.querySelector('#flashlightModeR58');});
  const gear=setup.gear;assert.ok(gear&&gear.w>=40&&gear.h>=40);
  await page.touchscreen.tap(gear.x+gear.w/2,gear.y+gear.h/2);await page.waitForSelector('#flashlightModeR58',{timeout:10000});
  await page.evaluate(()=>{const b=document.querySelector('#flashlightModeR58');for(const type of ['pointerdown','touchstart','click','input','change'])b.addEventListener(type,()=>window.__flashlightToggleEvents.push(type));});
  const boxRect=await page.locator('#flashlightModeR58').boundingBox();assert.ok(boxRect);
  await page.touchscreen.tap(boxRect.x+boxRect.width/2,boxRect.y+boxRect.height/2);
  await page.waitForFunction(()=>window.__STORYWORLD_PRESENTATION_R58__.inspect().flashlight===true&&document.querySelector('#flashlightModeR58')?.checked===true,null,{timeout:5000});
  const touchedOn=await page.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),saved:serializeSave().settings,checked:document.querySelector('#flashlightModeR58').checked,events:window.__flashlightToggleEvents,canvasPointerDowns:window.__flashlightCanvasPointerDowns}));
  assert.equal(touchedOn.saved.flashlight58,true);assert.equal(touchedOn.saved.flashlight58Explicit,true);assert.equal(touchedOn.light.settingOrigin,'user-selected');assert.equal(touchedOn.light.flashlightStatus,'켜짐 · 주변 시야');assert.equal(await page.locator('#flashlightStateR58').textContent(),'켜짐 · 주변 시야');assert.equal(touchedOn.canvasPointerDowns,0);
  await page.locator('#flashlightModeR58').scrollIntoViewIfNeeded();const boxRect2=await page.locator('#flashlightModeR58').boundingBox();
  await page.touchscreen.tap(boxRect2.x+boxRect2.width/2,boxRect2.y+boxRect2.height/2);
  await page.waitForFunction(()=>window.__STORYWORLD_PRESENTATION_R58__.inspect().flashlight===false&&document.querySelector('#flashlightModeR58')?.checked===false,null,{timeout:5000});
  const touchedOff=await page.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),saved:serializeSave().settings,checked:document.querySelector('#flashlightModeR58').checked,events:window.__flashlightToggleEvents,canvasPointerDowns:window.__flashlightCanvasPointerDowns}));
  assert.equal(touchedOff.saved.flashlight58,false);assert.equal(touchedOff.saved.flashlight58Explicit,true);assert.equal(touchedOff.light.flashlightStatus,'꺼짐 · 전체 시야');assert.equal(await page.locator('#flashlightStateR58').textContent(),'꺼짐 · 전체 시야');assert.equal(touchedOff.canvasPointerDowns,0);
  const saveOn=await page.evaluate(()=>{const raw=serializeSave();raw.settings.flashlight58=true;raw.settings.flashlight58Explicit=true;return raw;});
  await page.evaluate(async raw=>await restoreSave(raw),saveOn);
  await page.evaluate(()=>window.eval('showSettings()'));await page.waitForSelector('#flashlightModeR58',{timeout:10000});
  const afterLoadedOn=await page.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),checked:document.querySelector('#flashlightModeR58').checked,state:document.querySelector('#flashlightStateR58').textContent}));
  assert.equal(afterLoadedOn.light.flashlight,true);assert.equal(afterLoadedOn.checked,true);assert.equal(afterLoadedOn.state,'켜짐 · 주변 시야','loading a save refreshes the open switch');
  const rapidTapStates=[];
  for(const expected of [false,true,false]){const r=await page.locator('#flashlightModeR58').boundingBox();await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);await page.waitForFunction(value=>window.__STORYWORLD_PRESENTATION_R58__.inspect().flashlight===value&&document.querySelector('#flashlightModeR58')?.checked===value,expected,{timeout:5000});rapidTapStates.push(await page.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect().flashlight,checked:document.querySelector('#flashlightModeR58').checked,state:document.querySelector('#flashlightStateR58').textContent})));}
  assert.deepEqual(rapidTapStates.map(x=>x.light),[false,true,false]);assert.ok(rapidTapStates.every(x=>x.light===x.checked));
  await page.screenshot({path:path.join(OUT,'flashlight-settings-mobile.png')});

  await page.evaluate(()=>window.eval('closePanel(true)'));await page.waitForTimeout(300);
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));await page.waitForTimeout(400);
  assert.equal((await page.evaluate(()=>window.__STORYWORLD_PRESENTATION_R58__.inspect())).flashlight,false);
  await page.screenshot({path:path.join(OUT,'flashlight-off-mobile-landscape.png')});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));await page.waitForTimeout(300);
  const roundTrip=await page.evaluate(async()=>{const d=serializeSave();await restoreSave(d);return{setting:window.__STORYWORLD_PRESENTATION_R58__.inspect(),saved:serializeSave().settings};});
  assert.equal(roundTrip.setting.flashlight,false);assert.equal(roundTrip.setting.settingOrigin,'saved-user-selection');assert.equal(roundTrip.saved.flashlight58Explicit,true);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForTimeout(100);
  assert.equal((await page.evaluate(()=>window.__STORYWORLD_PRESENTATION_R58__.inspect())).flashlight,false);
  const pageErrorList=[...pageErrors];assert.deepEqual(pageErrorList,[]);
  const onPng=PNG.sync.read(await fs.readFile(path.join(OUT,'flashlight-on-mobile-portrait.png'))),offPng=PNG.sync.read(await fs.readFile(path.join(OUT,'flashlight-off-mobile-portrait.png'))),blackSamples=[[10,100],[10,300],[769,300]].map(([x,y])=>({x,y,rgb:[...onPng.data.slice((y*onPng.width+x)*4,(y*onPng.width+x)*4+3)]}));assert.ok(blackSamples.every(p=>p.rgb.every(v=>v<=12)),`flashlight outside-mask pixels must be black: ${JSON.stringify(blackSamples)}`);assert.equal(onPng.width,offPng.width);assert.equal(onPng.height,offPng.height);const diff=Buffer.alloc(onPng.width*onPng.height*4),differentPixels=pixelmatch(onPng.data,offPng.data,diff,onPng.width,onPng.height,{threshold:.08}),visualDifference={width:onPng.width,height:onPng.height,differentPixels,fraction:differentPixels/(onPng.width*onPng.height),meanRgbOn:onPng.data.reduce((n,v,i)=>n+(i%4===3?0:v),0)/(onPng.width*onPng.height*3),meanRgbOff:offPng.data.reduce((n,v,i)=>n+(i%4===3?0:v),0)/(offPng.width*offPng.height*3)};assert.ok(visualDifference.fraction>.05,'ON and OFF must produce materially different same-scene pixels');await fs.writeFile(path.join(OUT,'flashlight-on-off-diff.png'),PNG.sync.write({width:onPng.width,height:onPng.height,data:diff}));
  const result={base:'51490741b5786f59fb3fce2cf36f03343cd3e65c candidate',browser:`Chromium ${await browser.version()} headless, iPhone UA/touch emulation; not a physical device`,URL,setup,onState:{setting:onState.setting,sight:onState.sight,geometry:{enabled:onState.geometry.enabled,radius:onState.geometry.radius,rays:onState.geometry.rays,serial:onState.geometry.serial},stageBlack:onState.stageBlack},offState:{setting:offState.setting,sight:offState.sight,geometry:{enabled:offState.geometry.enabled,radius:offState.geometry.radius,rays:offState.geometry.rays,serial:offState.geometry.serial},stageBlack:offState.stageBlack},blackSamples,touchedOn,touchedOff,afterLoadedOn,rapidTapStates,roundTrip,visualDifference,pageErrorList,screenshots:['flashlight-on-mobile-portrait.png','flashlight-off-mobile-portrait.png','flashlight-settings-mobile.png','flashlight-off-mobile-landscape.png']};
  await fs.writeFile(path.join(OUT,'flashlight-regression.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({mobilePassed:true,blackSamples,visualDifference,pageErrorList,screenshots:result.screenshots},null,2));await context.close();
  const desktopContext=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});
  const desktop=await desktopContext.newPage();desktop.on('pageerror',e=>pageErrors.push(e.message));
  await desktop.goto(URL,{waitUntil:'load',timeout:60000});await desktop.waitForTimeout(500);await desktop.locator('#campaignNew54').click();await desktop.waitForFunction(()=>window.eval('started&&!loading'),null,{timeout:30000});
  assert.equal(await desktop.evaluate(()=>window.eval("enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}})")),true);await desktop.waitForFunction(()=>window.eval("zone==='dist00'&&!loading&&!modal"),null,{timeout:30000});await desktop.waitForTimeout(1500);
  const desktopBefore=await desktop.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),renderer:window.__STORYWORLD_PHASE1__?.inspect?.(),stageBlack:document.querySelector('#stage')?.classList.contains('flashlight-black-r58')}));
  assert.equal(desktopBefore.light.flashlight,false,'desktop starts in full-vision mode');assert.equal(desktopBefore.stageBlack,false);assert.equal(desktopBefore.renderer?.active,'three');
  await desktop.evaluate(()=>{room.engaged=false;player.x=15;player.y=19;player.moving=false;cam={x:15,y:19};route=[];command=null;target=null;effects.length=0;projectiles.length=0;hazards.length=0;window.__STORYWORLD_PRESENTATION_R58__.setFlashlight(true);});await desktop.waitForTimeout(700);
  const desktopAfter=await desktop.evaluate(()=>({light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),sight:window.__STORYWORLD_SIGHT24__.inspect(),stageBlack:document.querySelector('#stage')?.classList.contains('flashlight-black-r58'),renderer:window.__STORYWORLD_PHASE1__?.inspect?.()}));
  assert.equal(desktopAfter.light.flashlight,true);assert.equal(desktopAfter.sight.enabled,true);assert.equal(desktopAfter.stageBlack,true);await desktop.screenshot({path:path.join(OUT,'flashlight-on-desktop-after-toggle.png')});
  const desktopOutside=await desktop.evaluate(()=>{const rect=document.querySelector('#phase1-webgl').getBoundingClientRect(),projection=window.__STORYWORLD_PHASE1__.controller.state.three.projection,points=[[10,120],[1300,120],[10,300],[1350,300],[682,70],[682,680]];return points.filter(([x,y])=>x>=rect.left&&x<rect.right&&y>=rect.top&&y<rect.bottom).map(([x,y])=>{const w=projection.screenToWorld(x-rect.left,y-rect.top);return{x,y,visible:window.__STORYWORLD_SIGHT24__.pointVisible(w.x,w.y)};}).filter(p=>!p.visible);});assert.ok(desktopOutside.length>=2,'desktop test must include multiple pixels outside the sight polygon');const desktopPng=PNG.sync.read(await fs.readFile(path.join(OUT,'flashlight-on-desktop-after-toggle.png'))),desktopBlackSamples=desktopOutside.map(({x,y})=>({x,y,rgb:[...desktopPng.data.slice((y*desktopPng.width+x)*4,(y*desktopPng.width+x)*4+3)]}));assert.ok(desktopBlackSamples.every(p=>p.rgb.every(v=>v<=12)),`desktop initial-off -> on outside-mask pixels must be black: ${JSON.stringify(desktopBlackSamples)}`);assert.deepEqual(pageErrors,[]);
  result.desktopToggle={before:{light:desktopBefore.light,activeRenderer:desktopBefore.renderer.active,stageBlack:desktopBefore.stageBlack},after:{light:desktopAfter.light,sightEnabled:desktopAfter.sight.enabled,activeRenderer:desktopAfter.renderer.active,stageBlack:desktopAfter.stageBlack},outsidePoints:desktopOutside,blackSamples:desktopBlackSamples};result.screenshots.push('flashlight-on-desktop-after-toggle.png');
  await fs.writeFile(path.join(OUT,'flashlight-regression.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({desktopToggle:result.desktopToggle,allPageErrors:pageErrors,screenshots:result.screenshots},null,2));await desktopContext.close();
}finally{await browser.close();}
