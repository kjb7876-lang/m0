// R389 화면: 슬레이어 남·동 보행/공격, 사몽 S-07 페르소나 보스(영웅별). before = 공개 사이트, after = 로컬 빌드. 헤드리스(임시).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const [OUT,URL,TAG]=process.argv.slice(2);const b=await chromium.launch();const log={};
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]]){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 const shot=async n=>{await p.screenshot({path:`${OUT}/${n}-${vp}-${TAG}.jpg`,type:'jpeg',quality:82});};
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 const hero=h=>p.evaluate(async h=>{await ensureImages(heroPaths(h));player.hero=h;player.direction='front';},h);
 await hero('slayer');
 await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(2500);
 await p.evaluate(()=>{for(const e of room.enemies){e.hp=0;e.spawnState='dead';}});
 const walk=async(dx,dy,n)=>{for(let i=0;i<n;i++){await p.evaluate(([dx,dy])=>{if(!blocked(player.x+dx,player.y+dy)){player.x+=dx;player.y+=dy;}player.moveVX150=dx*10;player.moveVY150=dy*10;},[dx,dy]);await p.waitForTimeout(60);}};
 await walk(.04,.04,25);await shot('walk-s');log[vp+'-walk-s']=await p.evaluate(()=>window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.stats?.last);
 await walk(.04,-.04,25);await shot('walk-e');log[vp+'-walk-e']=await p.evaluate(()=>window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.stats?.last);
 await p.evaluate(()=>{player.moveVX150=0;player.moveVY150=0;});await p.waitForTimeout(400);
 const foe=(dx,dy)=>p.evaluate(([dx,dy])=>{const e=room.enemies[0];Object.assign(e,{hp:5000,maxHp:5000,spawnState:'active',x:player.x+dx,y:player.y+dy,attackCD:99});target=e.id;},[dx,dy]);
 await foe(.7,.7);await p.evaluate(()=>{player.attackCD=0;basicAttack();});await p.waitForTimeout(250);await shot('attack-s');log[vp+'-attack-s']=await p.evaluate(()=>window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.stats?.last);
 await p.waitForTimeout(1200);await foe(.7,-.7);await p.evaluate(()=>{player.attackCD=0;basicAttack();});await p.waitForTimeout(330);await shot('attack-e');log[vp+'-attack-e']=await p.evaluate(()=>window.__STORYWORLD_SLAYER_R351__?.inspect?.()?.stats?.last);
 for(const h of ['slayer','hwando']){await hero(h);
  await p.evaluate(()=>window.__STORYWORLD_SAMONG_MAPS_R105__.goStage(7,'ascent',{force:true}));await p.waitForTimeout(3000);await p.waitForFunction(()=>!loading&&room?.samongR115?.zone==='sz115-S07-3',null,{timeout:120000});await skip();await p.waitForTimeout(1500);
  log[vp+'-persona-'+h]=await p.evaluate(()=>{const e=room.enemies.find(x=>x.name==='페르소나');Object.assign(e,{spawnState:'active',x:player.x+1.6,y:player.y+.6});for(const x of room.enemies)if(x!==e)x.spawnState='hidden';return e.r380Mob||null;});
  await p.waitForTimeout(1500);log[vp+'-persona-'+h+'-after']=await p.evaluate(()=>room.enemies.find(x=>x.name==='페르소나').r380Mob||null);await shot('persona-'+h);}
 log[vp+'-errs']=errs.slice(0,5);await ctx.close();}
console.log(JSON.stringify(log));await b.close();
