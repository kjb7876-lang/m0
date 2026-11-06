// R375 사몽 S-06 변이된 사냥개 괴수 전후 스크린샷(PC·모바일) + 죽음 장면. before = storyworld.r375.dots {on:false}.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req(process.env.PW||'playwright');
const URL=process.argv[2]||'http://127.0.0.1:4436/m0/',OUT=process.argv[3]||'r96/qa/r375/screens';const log=[];
const b=await chromium.launch();
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]])for(const st of ['before','after']){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r375.dots',JSON.stringify({on}));},st==='after');
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 const sec=await p.evaluate(()=>{const M=window.__STORYWORLD_SAMONG_MAPS_R105__;const s=M.sections();const hit=s.find(x=>/S-06/.test(x.key));return hit?{key:hit.key,ok:M.goSection(hit.key)}:{keys:s.map(x=>x.key).slice(0,40)};});
 log.push({vp,st,sec});
 await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:120000}).catch(()=>{});await skip();await p.waitForTimeout(3000);
 for(let k=0;k<20;k++){const f=await p.evaluate(()=>!!room.enemies.find(e=>e.r200Shade==='plague-hound'&&e.hp>0));if(f)break;await p.waitForTimeout(1000);}
 const info=await p.evaluate(()=>{const e=room.enemies.find(x=>x.r200Shade==='plague-hound'&&x.hp>0);if(!e)return {zone:room.samongR103?.zone,names:[...new Set(room.enemies.map(x=>x.name+'|'+x.r200Shade))].slice(0,12)};
  player.x=e.x-2.2;player.y=e.y-2.2;window.__r375e=e;return {name:e.name,mob:e.r375Mob||null};});
 await p.waitForTimeout(1200);log.push({vp,st,info});await p.screenshot({path:`${OUT}/s06-hound-${vp}-${st}.jpg`,quality:72});
 if(vp==='pc'&&st==='after'&&info?.name){const d=await p.evaluate(()=>{const e=window.__r375e;e.hp=0;killEnemy(e);const f=effects.filter(x=>x.type==='enemyBurnDeath'&&x.sourceId===e.id).at(-1);return {fx:!!f,mob:f?.bodyFrame?.r375Mob||null,stats:window.__STORYWORLD_MOB_DOTS_R375__.inspect().stats};});
  await p.waitForTimeout(150);log.push({death:d});await p.screenshot({path:`${OUT}/s06-hound-pc-after-death.jpg`,quality:72});}
 await ctx.close();}
await b.close();console.log(JSON.stringify(log));
