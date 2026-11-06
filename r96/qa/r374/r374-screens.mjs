// R374 전후 비교 스크린샷(PC·모바일, 같은 카메라 자리). before = storyworld.r374.dots {on:false}.
// 사용: node r96/qa/r374/r374-screens.mjs <사이트 URL> <출력 폴더>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req(process.env.PW||'playwright');
const URL=process.argv[2]||'http://127.0.0.1:4436/m0/',OUT=process.argv[3]||'r96/qa/r374/screens';
const TARGETS=[['u203','이동문 공허잔영'],['u205','관리자 추적견'],['u205','역전기록 수집가'],['u205','학대기록 공허체']];
const b=await chromium.launch();
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]])for(const st of ['before','after']){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r374.dots',JSON.stringify({on}));},st==='after');
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 for(const [z,name] of TARGETS){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});await skip();await p.waitForTimeout(2500);
  await p.evaluate(n=>{const e=room.enemies.find(x=>x.name===n);if(!e)return;player.x=e.x-2.2;player.y=e.y-2.2;},name);await p.waitForTimeout(1200);
  await p.screenshot({path:`${OUT}/${z}-${name.replace(/\s+/g,'_')}-${vp}-${st}.jpg`,quality:72});}
 await ctx.close();}
await b.close();
