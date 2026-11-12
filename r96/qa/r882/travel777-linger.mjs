// 완료 조건: 영화모드 서사가 25초 넘게 남아 있어도 777 지역 이동(go)의 enterRegion 은 지연 없이(<12초) 실행되어야 한다.
import {createRequire} from 'node:module';const req=createRequire(new URL('../r444/lib.mjs',import.meta.url));const {chromium}=req('playwright');
const b=await chromium.launch({args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();await p.goto('http://127.0.0.1:4396/');
await p.locator('#cinemaStartR461').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await skip();await p.evaluate(async()=>{await __STORYWORLD_CHEAT777__.activate('777');});await p.waitForTimeout(1500);await skip();
await p.waitForFunction(()=>__STORYWORLD_CINEMA_MODE_R370__.inspect().backlogSecs>25&&guide,null,{timeout:240000});
const res=await p.evaluate(async()=>{const t0=performance.now();const r={bl:__STORYWORLD_CINEMA_MODE_R370__.inspect().backlogSecs};
 let done=null;__STORYWORLD_CHEAT777__.go('dist02','STORY');
 await new Promise(res=>{const w=()=>{if(__STORYWORLD_PROGRESSION_R71__.difficultyState().open||performance.now()-t0>60000)res();else setTimeout(w,200);};w();});
 r.secsToDifficultyWindow=(performance.now()-t0)/1000;return r;});
console.log(JSON.stringify(res));await b.close();process.exit(res.secsToDifficultyWindow<12?0:1);
