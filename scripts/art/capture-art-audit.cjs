/* CX-0027: read-only product audit. All positioning happens in a disposable
 * browser context; no runtime files, original saves or assets are changed. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const output=path.resolve(process.env.ART_AUDIT_OUT||'/tmp/cx-0027-evidence');
const report={schema:'storyworld.art-audit/v1',baseSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),scope:'fixture; headless Chromium/SwiftShader; physical GPU/mobile and natural campaign unverified',captures:[],errors:[],failures:[]};
fs.mkdirSync(output,{recursive:true});
const persist=()=>fs.writeFileSync(path.join(output,'capture-manifest.json'),JSON.stringify(report,null,2)+'\n');
if(process.env.ART_AUDIT_RESUME==='1'&&fs.existsSync(path.join(output,'capture-manifest.json'))){
 const prior=JSON.parse(fs.readFileSync(path.join(output,'capture-manifest.json'),'utf8'));
 if(prior.baseSHA!==report.baseSHA)throw Error('Cannot resume captures from a different SHA');
 const redo=new Set(process.env.ART_AUDIT_RECAPTURE?.split(',')||[]);
 report.captures=prior.captures.filter(r=>!redo.has(r.id.replace(/^(pc|mobile)-/,'')));report.resumedFrom=prior.startedAt;
 report.priorFailures=prior.failures;report.priorFatal=prior.fatal;
}
const captured=(device,name)=>report.captures.some(r=>r.id===device+'-'+name);
const sceneFilter=process.env.ART_AUDIT_SCENES?.split(',');
const wanted=name=>!sceneFilter||sceneFilter.includes(name);
async function wait(p,fn,arg,{timeout=180000}={}){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){if(await p.evaluate(fn,arg))return;await new Promise(resolve=>setTimeout(resolve,100));}
 throw Error('Audit condition timed out: '+String(fn));
}
let browser;
const clocked=new WeakSet();
async function quiet(p){await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;settings.sound=false;settings.music=false;settings.narration=false;route=[];command=null;});}
async function capture(p,device,name,fixture){
 if(!wanted(name)||captured(device,name))return;
 if(clocked.has(p)){await p.clock.runFor(100);fixture.clock='Playwright paused clock; 100ms render step; not real-time performance';}
 const state=await p.evaluate(()=>({zone,layer,title:regionById[zone]?.title,hero:player.hero,position:{x:player.x,y:player.y},camera:{...cam},heroState:__STORYWORLD5__.inspect().hero.state,renderer:__STORYWORLD_PHASE1__.controller.inspect().active,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},coarse:matchMedia('(pointer:coarse)').matches,profile:typeof StoryWorldProfilesR74!=='undefined'?StoryWorldProfilesR74.profiles[zone]:null,enemies:room.enemies.map(e=>({id:e.id,nativeId:e.nativeId,name:e.name,path:e.path,boss:e.boss,persona:e.persona,hp:e.hp,spawnState:e.spawnState,x:e.x,y:e.y,presentation:(()=>{const f=window.__STORYWORLD_PHASE1_ART__?.enemy?.(e);return{path:f?.path,framePath:f?.frame?.path,state:f?.state,flip:f?.flip,assetFrame:f?.frame?.assetFrame};})(),uniqueSheet:(()=>{const s=window.__STORYWORLD_MOB_UNIQUE_R248__?.sheetFor?.(e);return s?{id:s.id,path:s.path,body:s.body,name:s.name}:null;})()})),props:room.props?.map(e=>({id:e.id,path:e.path,height:e.height,x:e.x,y:e.y})),hazards:hazards.map(e=>({kind:e.kind,type:e.type,samongPattern:e.samongPattern})),effects:effects.map(e=>({type:e.type})),palette:__STORYWORLD_HERO_PALETTE_R302__.palette,legacyHeroColors:Object.fromEntries(Object.entries(HEROES).map(([k,v])=>[k,v.color]))}));
 if(captured(device,name))return;
 const file=device+'-'+name+'.jpg';await p.screenshot({path:path.join(output,file),type:'jpeg',quality:88,timeout:60000});
 report.captures.push({id:device+'-'+name,file,fixture,state});persist();console.log('CAPTURE',device,name,state.renderer);
}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=await browser.version();
 for(const device of (process.env.ART_AUDIT_DEVICE?[process.env.ART_AUDIT_DEVICE]:['pc','mobile'])){
 const mobile=device==='mobile';const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1920,height:1080},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,locale:'ko-KR',...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'}:{})});
 const p=await context.newPage();p.on('pageerror',e=>{report.errors.push({device,message:e.message});persist();});
 await p.addInitScript(()=>{let s=27;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);});
 await p.goto(process.env.ART_AUDIT_URL||'http://127.0.0.1:4396',{timeout:120000});
 await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await wait(p,()=>started&&!loading&&!__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:180000});await quiet(p);
 await wait(p,()=>__STORYWORLD_PHASE1__.controller.inspect().active==='three',null,{timeout:60000});
 await capture(p,device,'hub',{kind:'UI new journey; scenes advanced; automation off; no full natural play'});
 const heroes=['hwando','michaela','gunner'].filter(h=>['idle','move','attack','hit'].some(s=>wanted('hero-'+h+'-'+s)&&!captured(device,'hero-'+h+'-'+s)));
 for(const hero of heroes){
  await p.evaluate(async hero=>{player=freshPlayer(hero);await ensureImages(heroPaths(hero));refreshIcons();updateHUD();},hero);
  // Pose timers are held by a temporary, audit-only tick wrapper. Native render
  // and native pose resolver stay intact; this is explicitly a fixture.
  for(const pose of ['idle','move','attack','hit']){
   if(!wanted('hero-'+hero+'-'+pose)||captured(device,'hero-'+hero+'-'+pose))continue;
   if(pose==='move'){
    await p.keyboard.down('ArrowRight');await wait(p,()=>player.moving,null,{timeout:10000});
    await capture(p,device,'hero-'+hero+'-'+pose,{kind:'native held ArrowRight movement; screenshot during real tick',hero,pose});
    await p.keyboard.up('ArrowRight');await quiet(p);continue;
   }
   await p.evaluate(pose=>{window.__auditTick=tick;tick=function(dt){player.moving=pose==='move';player.hurtAnim=pose==='hit'?.2:0;player.attackAnim=pose==='attack'?.2:0;player.skillAnim=0;player.dashAnim=0;player.ultimateAnim=0;player.direction='front';};player.moving=pose==='move';player.hurtAnim=pose==='hit'?.2:0;player.attackAnim=pose==='attack'?.2:0;time=77;modal=false;},pose);
   await p.waitForTimeout(150);await capture(p,device,'hero-'+hero+'-'+pose,{kind:'native pose renderer; tick held; front direction',hero,pose});
   await p.evaluate(()=>{tick=window.__auditTick;delete window.__auditTick;player.hurtAnim=0;player.attackAnim=0;player.moving=false;});
  }
 }
 await p.evaluate(async()=>{player=freshPlayer('hwando');await ensureImages(heroPaths('hwando'));});
 // Restore deliberately sanitizes unopened destinations back to a safe hub.
 // Use the product's separate 777 sandbox instead of weakening that gate.
 const admission=await p.evaluate(async()=>__STORYWORLD_CHEAT777__.activate('777'));
 if(!admission.ok)throw Error('777 audit admission: '+admission.message);
 if(process.env.ART_AUDIT_FACTORY==='1'&&process.env.ART_AUDIT_STATIC_CLOCK==='1'){
  const now=Date.now();await p.clock.install({time:now});await p.clock.pauseAt(Date.now()+60000);clocked.add(p);
 }
 await p.evaluate(()=>{window.__auditRegionTick=tick;tick=function(){};modal=true;});
 const ids=await p.evaluate(()=>Object.keys(regionById));
 for(const id of ids.filter(id=>id!=='hub'&&wanted('region-'+id))){
  if(captured(device,'region-'+id))continue;
  try{
   console.log('ENTER',device,id);
   await quiet(p);
   if(process.env.ART_AUDIT_FACTORY==='1'){
    await p.evaluate(async id=>{modal=true;player.hp=maxHP();zone=id;layer='STORY';room=makeRoom(id,layer);world[layerKey()]=room;window.__STORYWORLD_WORLD_COMBAT_R78__?.placeRoom?.(room);const def=regionById[id];await ensureImages([...def.paths,...(window.__STORYWORLD_WORLD_R74__?.assetPaths(id,layer)||[]),...heroPaths(player.hero),...(room.props||[]).map(p=>p.path)].filter(Boolean));loading=false;window.__auditTransitionDone=true;},id);
   }else{
    await p.evaluate(id=>{modal=true;player.hp=maxHP();window.__auditTransitionDone=false;window.__auditTransitionError=null;enterRegion(id,null,{restore:true,noStory:true}).then(result=>{window.__auditTransitionResult=result;window.__auditTransitionDone=true;},e=>{window.__auditTransitionError=String(e);});},id);
    await wait(p,id=>zone===id&&!loading&&window.__auditTransitionDone,id,{timeout:180000,polling:100});
   }
   await quiet(p);
   const fixture=await p.evaluate(()=>{
    const roster=room.enemies.filter(e=>e.hp>0),bosses=roster.filter(e=>e.boss||e.persona),ordinary=roster.filter(e=>!e.boss&&!e.persona);
    const unique=[...bosses,...new Map(ordinary.map(e=>[e.path||e.nativeId||e.id,e])).values()];
    let origin=regionById[zone].safe?{x:15,y:19}:(room.exploration?.worldWardR81?.gatherAnchor||{x:16,y:32});
    if(blocked(origin.x,origin.y,.34,room)){
     const open=(room.exploration?.floorCells||[]).map(c=>({x:c[0]+.5,y:c[1]+.5})).filter(q=>!blocked(q.x,q.y,.34,room));
     open.sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));
     origin=open[0]||{x:player.x,y:player.y};
    }
    player.x=origin.x;player.y=origin.y;cam={x:origin.x,y:origin.y};
    // All roster entries are retained in metadata; at most eight representatives
    // are placed near the hero. Hidden is requested for others; later render overlays may still show them.
    for(const e of roster)e.spawnState='hidden';const selected=unique.slice(0,8);
    for(let i=0;i<selected.length;i++){const e=selected[i];e.x=origin.x+(i%4-1.5)*2.7;e.y=origin.y-3-Math.floor(i/4)*3;e.spawnState='active';e.visible=true;e.disabled=false;e.cd=999;e.attack=null;}
    modal=true;time=77;player.hp=maxHP();player.invincible=0;updateHUD();
    return{kind:'region roster fixture; bosses/persona first then distinct ordinary paths, max8; positioned; tick held during transition and capture',selected:selected.map(e=>e.nativeId||e.id),total:unique.length,bossCount:bosses.length,omitted:unique.slice(8).map(e=>e.nativeId||e.id)};
   });
   fixture.entry=process.env.ART_AUDIT_FACTORY==='1'?'native makeRoom factory; transition wrappers untested':'native enterRegion restore/777';
   await p.evaluate(async()=>{const paths=[];for(const e of room.enemies.filter(e=>e.spawnState==='active')){const body=window.__STORYWORLD_PHASE1_ART__?.enemy?.(e),sheet=window.__STORYWORLD_MOB_UNIQUE_R248__?.sheetFor?.(e);paths.push(body?.path,body?.frame?.path,sheet?.path,...Object.values(e.profile?.frames||{}).map(f=>f?.path));}await ensureImages(paths.filter(Boolean));});await p.waitForTimeout(350);await capture(p,device,'region-'+id,fixture);
  }catch(e){report.failures.push({device,id,message:String(e.stack)});persist();console.log('FAIL',device,id,String(e));}
 }
 if(clocked.has(p)){await p.clock.resume();clocked.delete(p);}
 await p.evaluate(()=>{tick=window.__auditRegionTick;delete window.__auditRegionTick;});
 if(!['native-skill-hit','hazard','settings','note','samong'].some(wanted)){await context.close();continue;}
 // Effects: use real native admission functions, not fabricated rendered art.
 await quiet(p);await p.evaluate(async()=>{await enterRegion('dist00',null,{restore:true,noStory:true});});await quiet(p);
 if(wanted('native-skill-hit')){
  await p.evaluate(()=>{player.x=16;player.y=32;cam={x:16,y:32};player.hp=maxHP();player.invincible=0;const e=room.enemies.find(e=>e.hp>0);if(e){e.x=17;e.y=32;e.spawnState='active';target=e.id;}basicAttack(true);});
  await p.keyboard.press('w');
 }
 const fxAdmission=await p.evaluate(()=>{window.__auditFxTick=tick;tick=function(){};time+=.12;modal=true;return{nativeKey:'w',types:effects.map(e=>e.type)};});
 await capture(p,device,'native-skill-hit',{kind:'native basicAttack and W keyboard; time+0.12 and held tick; not natural battle',fxAdmission});
 await p.evaluate(async()=>{await ensureImages([VFX.cross,VFX.clock]);time+=10;effects=[];projectiles=[];delayed=[];room.props=[];for(const e of room.enemies){e.x=-100;e.y=-100;}player.x=13;player.y=32;cam={x:16,y:32};player.attackAnim=0;player.skillAnim=0;player.hurtAnim=0;hazards=[{id:++uid,owner:room.enemies.find(e=>e.hp>0)?.id,x:18,y:32,radius:2.2,age:3.1,warning:3,life:6,damage:6,lastHit:-99,asset:VFX.cross,samongPattern:'tentacles',type:'field'}];modal=true;});
 await capture(p,device,'hazard',{kind:'isolated synthetic native drawHazard: actors moved away, transient effects/props removed, active age3.1; damage not tested'});
 await p.evaluate(()=>{tick=window.__auditFxTick;delete window.__auditFxTick;hazards=[];});
 await p.evaluate(()=>{showSettings();});await capture(p,device,'settings',{kind:'native showSettings menu fixture'});await quiet(p);
 await p.evaluate(()=>{const r=__STORYWORLD5__.inspect().storyCoverage.find(r=>r.zone===zone);__STORYWORLD_STORY_COLLECT_R177__.show({form:'note',title:regionById[zone].title,text:'미술 감사용 UI 표본입니다.\n\n쪽지의 글자와 배경 대비, 줄 간격, 화면 경계를 확인합니다.',place:regionById[zone].title});});
 await capture(p,device,'note',{kind:'native note component; explicitly synthetic audit text'});
 await quiet(p);
 if(!wanted('samong')){await context.close();continue;}
 try{
  const samong=await p.evaluate(async()=>{const a=await __STORYWORLD_CHEAT777__.activate('777');if(!a.ok)throw Error(a.message);await enterRegion('dist05',null,{restore:true,noStory:true,layer:'DREAM'});for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);const r=await __STORYWORLD_SAMONG_R103__.go(0);return{result:r,inspect:__STORYWORLD_SAMONG_R103__.inspect()};});
  await quiet(p);await p.evaluate(()=>{modal=true;});await capture(p,device,'samong',{kind:'native 777 DREAM samong entry fixture',samong});
 }catch(e){report.failures.push({device,id:'samong',message:String(e.stack)});persist();}
 await context.close();
 }
 report.finishedAt=new Date().toISOString();persist();await browser.close();console.log('DONE',report.captures.length,report.failures.length,report.errors.length);
})().catch(async e=>{report.fatal=String(e.stack);persist();console.error(e);if(browser)await browser.close();process.exitCode=1;});
