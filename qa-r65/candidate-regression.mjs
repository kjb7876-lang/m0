import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.env.STORYWORLD_URL || 'http://127.0.0.1:4375/';
const outDir = path.resolve('qa-r65');
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const pageErrors = [];
async function pageWith(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.locator('#campaignNew54').click();
  await page.waitForFunction(() => window.eval('started && !loading'), null, { timeout: 20_000 });
  await page.waitForTimeout(800);
  return { context, page };
}
async function enter(page, tier = 'normal') {
  const result = await page.evaluate(t => window.eval(`enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'${t}',position:{x:15,y:19}})`), tier);
  assert.equal(result, true, `dist00 entry failed for ${tier}`);
  await page.waitForFunction(() => window.eval("zone==='dist00' && !loading && !modal"), null, { timeout: 30_000 });
  await page.waitForTimeout(800);
}
async function layout(page) {
  return page.evaluate(() => {
    const rect = id => { const e=document.getElementById(id); if(!e)return null; const r=e.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(e).display}; };
    return {viewport:{width:innerWidth,height:innerHeight},stage:rect('stage'),shelf:rect('noticeShelfR63R2'),compatibility:rect('phase1-status'),footer:(()=>{const e=document.querySelector('footer');if(!e)return null;const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(e).display};})(),heroCard:rect('heroCard'),joystick:rect('joystick'),touchUse:rect('touchUse'),gear:rect('mobileSettingsR63'),hint:rect('hint'),toast:rect('toast')};
  });
}
async function triggerCompatibilityFallback(page){
  return page.evaluate(()=>{const controller=window.__STORYWORLD_PHASE1__?.controller;if(!controller)throw Error('Phase1 production controller unavailable');controller.state.requested='three';controller.state.failed=false;controller.state.three={supported:()=>true,render(){throw Error('QA forced renderer start failure');},dispose(){}};controller.draw();return{message:document.getElementById('phase1-status')?.textContent,parent:document.getElementById('phase1-status')?.parentElement?.id,failed:controller.inspect().failed,reason:controller.inspect().reason};});
}
const result = { browser:'Chromium 151 headless; emulated software renderer where WebGL is used', scenarios:{} };
let desktopDefaultSave;
try {
  const desktop = await pageWith({ viewport:{width:1365,height:888}, deviceScaleFactor:1 });
  const {page: desktopPage, context: desktopContext} = desktop;
  await enter(desktopPage, 'normal');
  const pointDropVisible=await desktopPage.evaluate(()=>{const c=window.__STORYWORLD_CAMPAIGN_R63R1__,r=room,id=`r64:${room.passivePointEpochR64}:drop:qa-visual-${crypto.randomUUID()}`;r.passivePointDropsR64.push({id,source:`r64:${r.passivePointEpochR64}:kill:qa-visual-enemy`,x:player.x+1,y:player.y,amount:5,kind:'enemy',createdAt:time});r.passivePointRevisionR64++;c.syncPointDrops(r);return{id,prop:r.props.find(p=>p.pointDropIdR64===id),points:player.points};});
  assert.ok(pointDropVisible.prop&&pointDropVisible.prop.path==='assets/vfx/v31315/spirit-orb.webp');
  await desktopPage.waitForTimeout(250);
  await desktopPage.screenshot({path:path.join(outDir,'candidate-point-drop.png')});
  const pointPickup=await desktopPage.evaluate(({id,before})=>{const c=window.__STORYWORLD_CAMPAIGN_R63R1__,after=player.points,repeat=c.collectPointDrops(),saved=serializeSave();return{before,after,delta:after-before,repeat,dropCount:room.passivePointDropsR64.length,claimed:room.passivePointClaimsR64.includes(id),savedClaim:!!saved.campaignPointDropsR64.rooms['STORY:dist00'].claims.includes(id)};},{id:pointDropVisible.id,before:pointDropVisible.points});
  assert.deepEqual({delta:pointPickup.delta,repeat:pointPickup.repeat,dropCount:pointPickup.dropCount,claimed:pointPickup.claimed,savedClaim:pointPickup.savedClaim},{delta:5,repeat:0,dropCount:0,claimed:true,savedClaim:true},'proximity auto-pickup awards once and persists room and player claims');
  const killOnce=await desktopPage.evaluate(()=>{const campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,epoch=room.passivePointEpochR64;let id='';for(let i=0;i<500;i++){const candidate='qa-r65-one-roll-'+i,source='r64:'+epoch+':kill:'+encodeURIComponent(candidate);if(campaign.rollPointForKill('normal',false,source).success){id=candidate;break;}}if(!id)throw Error('could not find a deterministic successful boss roll');const e={id,x:player.x+3,y:player.y,hp:0,maxHp:1,boss:false,deadRecorded:false,difficultyMapR63:'STORY:dist00'};room.enemies.push(e);const source='r64:'+epoch+':kill:'+encodeURIComponent(e.id);killEnemy(e);const first={drops:room.passivePointDropsR64.filter(d=>d.source===source).length,rolls:room.passivePointRollsR64.filter(v=>v===source).length};killEnemy(e);const second={drops:room.passivePointDropsR64.filter(d=>d.source===source).length,rolls:room.passivePointRollsR64.filter(v=>v===source).length};room.enemies.splice(room.enemies.indexOf(e),1);return{first,second,dead:e.deadRecorded};});
  assert.deepEqual(killOnce.first,{drops:1,rolls:1},'a successful kill roll emits one uniquely identified item');
  assert.deepEqual(killOnce.second,killOnce.first,'duplicate enemy death processing does not create another reward');
  assert.equal(killOnce.dead,true);
  const desktopSetup = await desktopPage.evaluate(() => ({
    presentation:window.__STORYWORLD_PRESENTATION_R58__?.inspect?.(),
    tier:window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.(),
    enemies:window.eval('room.enemies.map(e=>({id:e.id,hp:e.hp,maxHp:e.maxHp,factor:e.difficultyFactorR63,base:e.difficultyBaseHpR63}))'),
    noPassiveAura:window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player),
    factorChecks:{easy:window.__STORYWORLD_CAMPAIGN_R63R1__.scaleIncomingDamage(10,room.enemies[0],'easy'),normal:window.__STORYWORLD_CAMPAIGN_R63R1__.scaleIncomingDamage(10,room.enemies[0],'normal'),hard:window.__STORYWORLD_CAMPAIGN_R63R1__.scaleIncomingDamage(10,room.enemies[0],'hard'),environment:window.__STORYWORLD_CAMPAIGN_R63R1__.scaleIncomingDamage(10,{id:'floor-hazard'},'easy')}
  }));
  assert.equal(desktopSetup.presentation.deviceClass,'desktop');
  assert.equal(desktopSetup.presentation.defaultFlashlight,false);
  assert.equal(desktopSetup.presentation.flashlight,false);
  assert.equal(desktopSetup.noPassiveAura,false);
  assert.deepEqual(desktopSetup.factorChecks,{easy:4,normal:10,hard:12,environment:10});
  assert.equal(desktopSetup.enemies[0].maxHp,6421.5);
  assert.equal(desktopSetup.enemies[1].maxHp,285);
  const noAuraCommands=await desktopPage.evaluate(()=>window.__STORYWORLD_PHASE1__.captureVisual().filter(c=>c.owner?.id?.startsWith('thread-dance-aura-r63r2:')).length);
  assert.equal(noAuraCommands,0,'the unowned passive contributes no aura draw commands');
  const deskLayout = await layout(desktopPage);
  assert.ok(deskLayout.stage.bottom <= deskLayout.shelf.top + 1, 'desktop notice strip must start after the playfield');
  assert.ok(deskLayout.shelf.bottom <= deskLayout.footer.top + 1, 'desktop notice strip must finish before controls');

  const purchase = await desktopPage.evaluate(() => {
    const p=player,prog=window.__STORYWORLD_PROGRESSION_R62__,campaign=window.__STORYWORLD_CAMPAIGN_R63R1__;
    const bought=prog.purchase('threadDanceR63',p);
    const rank=prog.ranks('threadDanceR63',p),aura=campaign.drawThreadAura(p),limits=campaign.inspect();
    const livingA=(()=>{const old=p.hp;p.hp=0;const dead=campaign.drawThreadAura(p);p.hp=old;return dead;})();
    const visualA=prog.state(p).visuals;prog.state(p).visuals=false;const disabled=campaign.drawThreadAura(p);prog.state(p).visuals=visualA;
    return {bought,rank,aura,deadAura:livingA,visualsOffAura:disabled,hitLimit:limits.skillHitLimit,targetLimit:limits.skillTargetLimit};
  });
  assert.deepEqual(purchase,{bought:true,rank:1,aura:true,deadAura:false,visualsOffAura:false,hitLimit:3,targetLimit:2});
  const awakeningAuras=await desktopPage.evaluate(()=>{const p=player,prog=window.__STORYWORLD_PROGRESSION_R62__,ids=()=>window.__STORYWORLD_PHASE1__.captureVisual().filter(c=>c.owner?.id?.startsWith('r62:passive-aura:')).map(c=>c.owner.id),old={ego:p.ego,resonance:p.resonance,visuals:prog.state(p).visuals};prog.state(p).visuals=true;p.ego=1;p.resonance=0;const ego=ids();p.ego=0;p.resonance=30;const resonance=ids();p.resonance=0;const none=ids();p.ego=old.ego;p.resonance=old.resonance;prog.state(p).visuals=old.visuals;return{ego,resonance,none};});
  assert.deepEqual(awakeningAuras,{ego:['r62:passive-aura:hero:ego'],resonance:['r62:passive-aura:hero:resonance'],none:[]},'EGO and resonance states render their own aura only while active');
  const motifRuntime=await desktopPage.evaluate(async()=>{const c=window.__STORYWORLD_CAMPAIGN_R63R1__,prog=window.__STORYWORLD_PROGRESSION_R62__,p=player,originalPoints=p.points,originalEnemies=room.enemies,origin={x:p.x,y:p.y},ids=['threadCrossR64','threadFlowerR64','threadFractalR64','threadClawR64','threadTsubameR64','threadIchidanR64'],oldOwnerId=p.coopIdR62;p.coopIdR62='qa-thread-motif-owner';p.points+=ids.length;const bought=ids.map(id=>prog.purchase(id,p)),motifs=c.ownedMotifs(p),targets=originalEnemies.slice(0,2).map((e,i)=>({...e,id:'qa-thread-target-'+i,x:origin.x+1+i,y:origin.y,hp:1e7,maxHp:1e7,deadRecorded:false,spawnState:'active',invulnerableUntil:0,graceUntil:0,attack:null,nav:[],tell:0,cd:100}));room.enemies=targets;const captured=[],base=window.hitEnemy;window.hitEnemy=function(e,amount,source){if(source?.ability==='threadDanceR63')captured.push({id:source.eventId,damage:amount,subHit:source.subHit});return base.apply(this,arguments);};const cast=c.cast(true);// Software-rendered Chromium can advance the fixed-step queue slowly; let delayed sub-hits settle before asserting.
  await new Promise(resolve=>setTimeout(resolve,3500));window.hitEnemy=base;room.enemies=originalEnemies;p.x=origin.x;p.y=origin.y;p.coopIdR62=oldOwnerId;const sub=captured.filter(v=>Number.isInteger(v.subHit)),groups=new Map();for(const v of sub){const key=v.id.replace(/-\d+$/,'');groups.set(key,(groups.get(key)||0)+v.damage);}const sums=[...groups.values()].sort((a,b)=>a-b);return{bought,motifs,cast,last:c.inspect().lastCast,cooldown:c.inspect().activeSkillCooldown,subHits:sub.length,fractalHits:captured.filter(v=>String(v.id).endsWith('-fractal')).length,groupCount:groups.size,totalGroupSums:sums,ichidanRatio:sums.length>1?sums.at(-1)/sums[0]:0};});
  assert.deepEqual(motifRuntime.bought,[true,true,true,true,true,true]);
  assert.deepEqual(motifRuntime.motifs,['cross','flower','fractal','claw','tsubamegaeshi','decisive']);
  assert.equal(motifRuntime.cast,true,JSON.stringify(motifRuntime));
  assert.equal(motifRuntime.subHits,18,'two targets receive three sub-hits for each of three base hits');
  assert.equal(motifRuntime.fractalHits,1,'fractal chains to only one additional target per cast');
  assert.equal(motifRuntime.groupCount,6);
  assert.ok(Math.abs(motifRuntime.ichidanRatio-1.35)<1e-8,'the last per-target hit carries the explicit 35% increase');
  const auraCommands=await desktopPage.evaluate(()=>window.__STORYWORLD_PHASE1__.captureVisual().filter(c=>c.owner?.id?.startsWith('thread-dance-aura-r63r2:')).length);
  assert.ok(auraCommands>0,'owned passive contributes visible silver-thread aura draw commands');
  await desktopPage.waitForTimeout(300);
  await desktopPage.screenshot({path:path.join(outDir,'candidate-desktop-aura.png')});
  await desktopPage.evaluate(() => window.eval('showUpgrades()'));
  await desktopPage.waitForTimeout(150);
  await desktopPage.locator('[data-r62-passive="threadDanceR63"]').scrollIntoViewIfNeeded();
  await desktopPage.screenshot({path:path.join(outDir,'candidate-passive-menu.png')});
  await desktopPage.evaluate(() => window.eval('closePanel(true)'));

  const saved = await desktopPage.evaluate(() => {
    window.__qaSavedR63=serializeSave();
    return {hp:room.enemies[0].maxHp,patrol:room.enemies[1].maxHp,campaignHp:window.__qaSavedR63.campaignHpR63,rank:window.__qaSavedR63.progressionR62.progression.ranks.threadDanceR63};
  });
  desktopDefaultSave = await desktopPage.evaluate(() => serializeSave());
  assert.equal(desktopDefaultSave.settings.flashlight58,false);
  assert.equal(desktopDefaultSave.settings.flashlight58Explicit,false);
  assert.equal(saved.rank,1);
  assert.equal(saved.hp,6421.5);
  assert.ok(saved.campaignHp.rooms['STORY:dist00']);
  await desktopPage.evaluate(async () => await restoreSave(window.__qaSavedR63));
  await desktopPage.evaluate(async () => await restoreSave(window.__qaSavedR63));
  const afterRestore = await desktopPage.evaluate(() => ({
    boss:room.enemies.find(e=>e.boss)?.maxHp,
    patrol:room.enemies.find(e=>e.storyPatrol)?.maxHp,
    rank:window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63',player),
    aura:window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player),
    factor:window.__STORYWORLD_CAMPAIGN_R63R1__.inspect().hpMultiplier
  }));
  assert.deepEqual(afterRestore,{boss:6421.5,patrol:285,rank:1,aura:true,factor:0.25});
  const tierSwitch=await desktopPage.evaluate(async()=>{const c=window.__STORYWORLD_CAMPAIGN_R63R1__,read=()=>({tier:c.inspect().tier,boss:room.enemies.find(e=>e.boss)?.maxHp,patrol:room.enemies.find(e=>e.storyPatrol)?.maxHp});const rows={};for(const tier of ['easy','hard','normal']){c.choose('dist00','STORY',tier);c.reapplyRoom();rows[tier]=read();c.reapplyRoom();rows[tier+'Repeated']=read();}await restoreSave(window.__qaSavedR63);return{rows,restored:read()};});
  for(const[tier,boss,patrol]of[['easy',5137.2,228],['hard',10274.4,456],['normal',6421.5,285]]){const row=tierSwitch.rows[tier];assert.equal(row.tier,tier);assert.ok(Math.abs(row.boss-boss)<1e-8,`${tier} boss HP`);assert.equal(row.patrol,patrol);assert.deepEqual(tierSwitch.rows[tier+'Repeated'],row,`${tier} repeated application does not compound`);}
  assert.deepEqual(tierSwitch.restored,{tier:'normal',boss:6421.5,patrol:285},'save restore returns to the saved normal values');
  const resetAura=await desktopPage.evaluate(async()=>{const prog=window.__STORYWORLD_PROGRESSION_R62__,raw=prog.exportPlayer(player),ranks={...raw.progression.ranks,threadDanceR63:0};prog.importPlayer(player,{...raw,progression:{...raw.progression,ranks}});const reset={rank:prog.ranks('threadDanceR63',player),aura:window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player)};await restoreSave(window.__qaSavedR63);return{reset,restored:{rank:prog.ranks('threadDanceR63',player),aura:window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player)}};});
  assert.deepEqual(resetAura,{reset:{rank:0,aura:false},restored:{rank:1,aura:true}},'resetting skill ownership hides its aura and loading restores it');
  const mapChange=await desktopPage.evaluate(async () => {const target=regions.find(r=>r.id!==zone&&r.safe)||regions.find(r=>r.id!==zone);if(!target)return{id:null,result:false,zone};const result=await enterRegion(target.id,null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});return{id:target.id,result,zone,loading,modal};});
  assert.ok(mapChange.id&&mapChange.result&&mapChange.zone===mapChange.id,`map change failed: ${JSON.stringify(mapChange)}`);
  await desktopPage.waitForFunction(id => window.eval(`zone==='${id}' && !loading && !modal`), mapChange.id, {timeout:30000});
  const mapAura = await desktopPage.evaluate(() => ({rank:window.__STORYWORLD_PROGRESSION_R62__.ranks('threadDanceR63',player),visible:window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player)}));
  assert.deepEqual(mapAura,{rank:1,visible:true});

  await desktopPage.evaluate(() => window.eval('showSettings()'));
  const diag = await desktopPage.evaluate(() => ({exists:!!document.querySelector('#statusDiagnosticsR63R2'),text:document.querySelector('#statusDiagnosticsR63R2 .readout')?.textContent||'',panel:document.querySelector('#modal')?.style.display}));
  assert.ok(diag.exists && diag.text.includes('상태 및 진단')===false && diag.text.includes('난이도:'));
  await desktopPage.locator('#statusDiagnosticsR63R2').scrollIntoViewIfNeeded();
  await desktopPage.screenshot({path:path.join(outDir,'candidate-desktop-diagnostics.png')});
  await desktopPage.evaluate(() => window.eval('closePanel(true)'));
  await desktopPage.setViewportSize({width:1280,height:720});
  await desktopPage.waitForTimeout(300);
  const resized = await layout(desktopPage);
  assert.ok(resized.stage.bottom <= resized.shelf.top + 1);
  assert.ok(resized.shelf.bottom <= resized.footer.top + 1);
  result.scenarios.desktop={presentation:desktopSetup.presentation,tier:desktopSetup.tier.tier,enemies:desktopSetup.enemies,factors:desktopSetup.factorChecks,pointDrop:{visible:!!pointDropVisible.prop,pickup:pointPickup,killOnce},aura:{...purchase,egoAndResonance:awakeningAuras,unownedDrawCommands:noAuraCommands,ownedDrawCommands:auraCommands},threadMotifs:motifRuntime,tierSwitch,saveRestore:afterRestore,mapChange:mapAura,layout:{initial:deskLayout,resized},settingsDiagnostics:diag};
  await desktopContext.close();

  const none = await pageWith({viewport:{width:1100,height:800},deviceScaleFactor:1});
  await enter(none.page,'normal');
  assert.equal(await none.page.evaluate(() => window.__STORYWORLD_CAMPAIGN_R63R1__.drawThreadAura(player)),false,'unowned player must not display the skill aura');
  await none.context.close();

  const windowsTouch = await pageWith({viewport:{width:1280,height:800},deviceScaleFactor:1,hasTouch:true,isMobile:false,userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'});
  const pcTouch = await windowsTouch.page.evaluate(() => window.__STORYWORLD_PRESENTATION_R58__?.inspect?.());
  assert.equal(pcTouch.deviceClass,'desktop');
  assert.equal(pcTouch.desktopTouch,true);
  assert.equal(pcTouch.defaultFlashlight,false);
  result.scenarios.windowsTouch=pcTouch;
  await windowsTouch.context.close();

  const mobile = await pageWith({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
  const mobilePage=mobile.page;
  await enter(mobilePage,'normal');
  const mobileSetup=await mobilePage.evaluate(() => ({presentation:window.__STORYWORLD_PRESENTATION_R58__?.inspect?.(),mobile:window.__STORYWORLD_MOBILE_R63__?.inspect?.()}));
  assert.equal(mobileSetup.presentation.deviceClass,'mobile');
  assert.equal(mobileSetup.presentation.flashlight,true);
  assert.equal(mobileSetup.presentation.defaultFlashlight,true);
  await mobilePage.evaluate(() => window.__STORYWORLD_PROGRESSION_R62__.purchase('threadDanceR63',player));
  const mobileCompatibility=await triggerCompatibilityFallback(mobilePage);
  assert.equal(mobileCompatibility.message,'현재 기기에서는 호환 화면으로 실행합니다.');
  assert.equal(mobileCompatibility.parent,'noticeShelfR63R2');
  assert.equal(mobileCompatibility.failed,true,'the production renderer failure path raises the compatibility notice');
  await mobilePage.waitForTimeout(300);
  const mobileLayout=await layout(mobilePage);
  assert.ok(mobileLayout.stage.bottom <= mobileLayout.shelf.top + 1,'mobile notice strip must sit below the playfield');
  assert.ok(mobileLayout.compatibility.top>=mobileLayout.stage.bottom-1&&mobileLayout.compatibility.bottom<=mobileLayout.shelf.bottom+1,'the exact compatibility notice must occupy the reserved mobile shelf');
  for(const key of ['heroCard','joystick','touchUse']){const r=mobileLayout[key];if(r&&r.display!=='none'&&r.width>0&&r.height>0)assert.ok(r.bottom<=mobileLayout.shelf.top+1,`${key} must not overlap the mobile notice strip`);}
  await mobilePage.screenshot({path:path.join(outDir,'candidate-mobile-portrait-flashlight.png')});

  const gear=await mobilePage.locator('#mobileSettingsR63').boundingBox();
  assert.ok(gear && gear.width>=40 && gear.height>=40,'touch settings gear is present');
  await mobilePage.touchscreen.tap(gear.x+gear.width/2,gear.y+gear.height/2);
  await mobilePage.waitForSelector('#statusDiagnosticsR63R2',{timeout:10000});
  assert.ok(await mobilePage.locator('#mobileOptionsR63').count());
  await mobilePage.evaluate(() => window.eval('closePanel(true)'));
  await mobilePage.evaluate(() => {
    window.__qaPointerDowns=0;
    document.querySelector('#game').addEventListener('pointerdown',()=>window.__qaPointerDowns++,{once:true,capture:true});
  });
  await mobilePage.touchscreen.tap(190,520);
  const pointerDowns=await mobilePage.evaluate(()=>window.__qaPointerDowns);
  assert.equal(pointerDowns,1,'touch tap reaches the gameplay canvas');

  await mobilePage.setViewportSize({width:844,height:390});
  await mobilePage.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await mobilePage.waitForTimeout(500);
  const landscapeDefault=await mobilePage.evaluate(() => window.__STORYWORLD_PRESENTATION_R58__.inspect());
  assert.equal(landscapeDefault.flashlight,true,'orientation change preserves mobile default');
  const landscapeLayout=await layout(mobilePage);
  assert.ok(landscapeLayout.stage.bottom<=landscapeLayout.shelf.top+1);
  assert.ok(landscapeLayout.compatibility.top>=landscapeLayout.stage.bottom-1&&landscapeLayout.compatibility.bottom<=landscapeLayout.shelf.bottom+1,'the exact compatibility notice remains in the reserved landscape shelf');
  for(const key of ['heroCard','joystick','touchUse']){const r=landscapeLayout[key];if(r&&r.display!=='none'&&r.width>0&&r.height>0)assert.ok(r.bottom<=landscapeLayout.shelf.top+1,`${key} must not overlap landscape notice strip`);}
  await mobilePage.screenshot({path:path.join(outDir,'candidate-mobile-landscape-flashlight.png')});

  const legacyDesktopSave={...desktopDefaultSave,settings:{...desktopDefaultSave.settings}};
  delete legacyDesktopSave.settings.flashlight58Explicit;
  await mobilePage.evaluate(async raw=>{localStorage.setItem('hapil.storyworld.canonical-r54.20261016.save',JSON.stringify(raw));await loadLocal();},legacyDesktopSave);
  const legacyLoad=await mobilePage.evaluate(()=>({presentation:window.__STORYWORLD_PRESENTATION_R58__.inspect(),settings:serializeSave().settings,zone:window.eval('zone')}));
  assert.equal(legacyLoad.presentation.flashlight,true,'a desktop default must not override a mobile default');
  assert.equal(legacyLoad.presentation.settingOrigin,'device-default');
  assert.equal(legacyLoad.settings.flashlight58Explicit,false);

  await mobilePage.evaluate(() => window.eval('showSettings()'));
  assert.equal(await mobilePage.locator('#flashlightModeR58').isChecked(),true);
  await mobilePage.locator('#flashlightModeR58').uncheck();
  const selection=await mobilePage.evaluate(()=>({setting:window.__STORYWORLD_PRESENTATION_R58__.inspect(),saved:serializeSave().settings.flashlight58,explicit:serializeSave().settings.flashlight58Explicit}));
  assert.equal(selection.setting.flashlight,false);
  assert.equal(selection.setting.settingOrigin,'user-selected');
  assert.equal(selection.saved,false);
  assert.equal(selection.explicit,true,'manual selection intent is saved');
  await mobilePage.evaluate(() => window.eval('closePanel(true)'));
  await mobilePage.evaluate(() => window.dispatchEvent(new Event('blur')));
  await mobilePage.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  assert.equal((await mobilePage.evaluate(()=>window.__STORYWORLD_PRESENTATION_R58__.inspect())).flashlight,false,'background lifecycle events preserve explicit selection');

  await mobilePage.evaluate(() => window.__STORYWORLD_PRESENTATION_R58__.setFlashlight(false));
  await mobilePage.setViewportSize({width:390,height:844});
  await mobilePage.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await mobilePage.waitForTimeout(300);
  await mobilePage.screenshot({path:path.join(outDir,'candidate-mobile-portrait-full-view.png')});
  const explicitSave=await mobilePage.evaluate(()=>serializeSave());
  assert.equal(explicitSave.settings.flashlight58,false);
  assert.equal(explicitSave.settings.flashlight58Explicit,true);
  await mobilePage.evaluate(async raw=>{localStorage.setItem('hapil.storyworld.canonical-r54.20261016.save',JSON.stringify(raw));await loadLocal();},explicitSave);
  const lightRestore=await mobilePage.evaluate(() => window.__STORYWORLD_PRESENTATION_R58__.inspect());
  assert.equal(lightRestore.flashlight,false);
  assert.equal(lightRestore.settingOrigin,'saved-user-selection');
  assert.equal(lightRestore.explicitSelection,true);
  const mobileMap=await mobilePage.evaluate(async()=>{const to=zone==='dist00'?'hub':'dist00';const result=await enterRegion(to,null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}});return{result,zone,flashlight:window.__STORYWORLD_PRESENTATION_R58__.inspect()};});
  assert.equal(mobileMap.result,true);
  assert.equal(mobileMap.flashlight.flashlight,false);
  const deathReturn=await mobilePage.evaluate(async()=>{const prog=window.__STORYWORLD_PROGRESSION_R62__,campaign=window.__STORYWORLD_CAMPAIGN_R63R1__,rank=prog.ranks('threadDanceR63',player);player.hp=0;const deadAura=campaign.drawThreadAura(player);showDeath();await returnHome();return{hp:player.hp,rank,deadAura,aura:campaign.drawThreadAura(player),flashlight:window.__STORYWORLD_PRESENTATION_R58__.inspect()};});
  assert.ok(deathReturn.hp>0);
  assert.equal(deathReturn.rank,1);
  assert.equal(deathReturn.deadAura,false);
  assert.equal(deathReturn.aura,true,'revive restores the owned aura');
  assert.equal(deathReturn.flashlight.flashlight,false);
  const mobileCoop=await mobilePage.evaluate(async()=>{const sim=window.__STORYWORLD_COOP_SIM_R62__,before=window.__STORYWORLD_PRESENTATION_R58__.inspect();await sim.start({role:'host',selfId:'qa-mobile-host',room:'QA-MOBILE-FLASHLIGHT',hero:'hwando',members:[{id:'qa-mobile-host',nick:'Host',character:'hwando',isHost:true},{id:'qa-mobile-guest',nick:'Guest',character:'hwando'}]});const whileReceiving=window.__STORYWORLD_PRESENTATION_R58__.inspect();await sim.stop();return{before,whileReceiving,after:window.__STORYWORLD_PRESENTATION_R58__.inspect()};});
  assert.equal(mobileCoop.before.flashlight,false);
  assert.equal(mobileCoop.whileReceiving.flashlight,false);
  assert.equal(mobileCoop.after.flashlight,false);
  result.scenarios.mobile={...mobileSetup,layout:{portrait:mobileLayout,landscape:landscapeLayout},landscapeDefault,legacyDesktopDefaultLoad:legacyLoad,selection,lightRestore,mobileMap,deathReturn,mobileCoop,touch:{settingsGear:true,canvasPointerDowns:pointerDowns}};
  await mobile.context.close();

  const notice = await pageWith({viewport:{width:1365,height:888},deviceScaleFactor:1});
  await enter(notice.page,'normal');
  await notice.page.evaluate(() => {toast('상태 안내 확인',5);const f=document.getElementById('fatal');f.style.display='block';f.textContent='QA에서 만든 오류 상세';});
  await notice.page.waitForTimeout(150);
  const compatibility=await triggerCompatibilityFallback(notice.page);
  assert.equal(compatibility.message,'현재 기기에서는 호환 화면으로 실행합니다.');
  assert.equal(compatibility.parent,'noticeShelfR63R2');
  assert.equal(compatibility.failed,true);
  const errorNotice=await notice.page.evaluate(() => ({shelf:document.getElementById('noticeShelfR63R2').dataset.fatal,text:document.getElementById('fatal').textContent,details:'private campaign closure'}));
  assert.equal(errorNotice.shelf,'1');
  assert.ok(errorNotice.text.includes('설정'));
  await notice.page.evaluate(() => window.eval('showSettings()'));
  const details=await notice.page.locator('#statusDiagnosticsR63R2 .readout').textContent();
  assert.ok(details.includes('QA에서 만든 오류 상세'));
  const noticeLayout=await layout(notice.page);
  assert.ok(noticeLayout.stage.bottom<=noticeLayout.shelf.top+1);
  assert.ok(noticeLayout.compatibility.top>=noticeLayout.stage.bottom-1&&noticeLayout.compatibility.bottom<=noticeLayout.shelf.bottom+1,'the exact compatibility notice does not overlap the desktop playfield or controls');
  await notice.context.close();
  result.scenarios.noticeErrors={errorNotice,compatibility,detailsAccessibleInSettings:true,layout:noticeLayout,mobileCompatibility};
  result.pageErrors=pageErrors;
  assert.deepEqual(pageErrors,[],'browser pages have no uncaught errors');
  await fs.writeFile(path.join(outDir,'candidate-regression.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally {
  await browser.close();
}
