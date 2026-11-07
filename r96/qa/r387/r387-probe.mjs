import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req('playwright');
const OUT=process.argv[2];const b=await chromium.launch();const res={};
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]].slice(0,process.env.PCONLY?1:2)){
const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));if(process.env.OFF)await ctx.addInitScript(()=>localStorage.setItem('storyworld.r380.mobs',JSON.stringify({on:false})));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto('http://127.0.0.1:4436/m0/');await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
await p.evaluate(()=>enterRegion('ep1a09',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='ep1a09',null,{timeout:120000});await skip();await p.waitForTimeout(2500);
const info=await p.evaluate(()=>{const e=room.enemies.find(x=>x.r387Syringe);if(!e)return null;for(const o of room.enemies)if(o!==e)o.frozenR380=true;player.x=e.x-2.4;player.y=e.y-2.4;return {id:e.id,hp:e.hp,maxHp:e.maxHp,x:e.x,y:e.y,midboss:e.midboss,boss:e.boss,count:room.enemies.length};});
await p.waitForTimeout(1500);await p.screenshot({path:`${OUT}/ep1a09-syringe-${vp}-after.jpg`,quality:72});
const cache=await p.evaluate(()=>{const e=room.enemies.find(x=>x.r387Syringe);return {r380:e?.r380Mob,stats:window.__STORYWORLD_APPROVED_MOBS_R380__?.inspect?.()};});
let clear=null;if(vp==='pc'){await p.waitForTimeout(1);clear=await p.evaluate(async()=>{const before={cleared:room.cleared,stage:room.encounterStage,final:room.finalStage};for(const e of [...room.enemies])if(e.hp>0&&!e.hero)try{hitEnemy(e,1e9);}catch(x){return "hitErr "+x.message;}
 await new Promise(r=>setTimeout(r,4000));return {before,after:{cleared:room.cleared,stage:room.encounterStage,final:room.finalStage,alive:room.enemies.filter(e=>e.hp>0).map(e=>[e.id,e.spawnState,e.hp|0]),objective:room.objective,doors:(room.worldR74?.doors||[]).map(d=>[d.id,d.open??d.opened??d.state])}};});}
res[vp]={info,cache:{r380:cache.r380,err:cache.stats?.lastError,errors:cache.stats?.stats?.errors},clear,errs};await ctx.close();}
console.log(JSON.stringify(res,null,1));await b.close();
