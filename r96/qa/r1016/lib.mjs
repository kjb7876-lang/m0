import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
export const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/';
export async function boot({viewport={width:960,height:540},mobile=false,c777=true,init=null}={}){
 const b=await chromium.launch({headless:true});
 const ctx=await b.newContext(mobile?{viewport:{width:375,height:667},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'}:{viewport});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
 if(init)await ctx.addInitScript(init);
 const p=await ctx.newPage();const errors=[];p.errors=errors;
 p.on('pageerror',e=>errors.push('PAGEERR '+String(e.stack||e).slice(0,400)));
 p.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,300));});
 await p.goto(URL);
 return {b,ctx,p};
}
export async function startStory(p,c777=true){
 await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:120000});await p.waitForTimeout(800);await skip(p);
 if(c777){await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);}
}
export const skip=p=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
export async function gameWait(p,secs,max=60000){const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t,t0+secs,{timeout:max,polling:100});}
export async function goZone(p,id){
 await p.evaluate(async id=>{if(modal&&!storyScene)closePanel(true);await window.__STORYWORLD_CHEAT777__.go(id,'STORY');if(window.__STORYWORLD_PROGRESSION_R71__.difficultyState().open){window.__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal');await window.__STORYWORLD_PROGRESSION_R71__.confirmDifficulty();}},id);
 await p.waitForFunction(id=>zone===id&&!loading,id,{timeout:90000});await p.waitForTimeout(500);await skip(p);await p.evaluate(()=>{guide=false;auto=false;});
}
