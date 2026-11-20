// R1267 헤드리스 공용 시작: 새 게임 → 777 → 지역 이동 → 미카엘라. (R1235 census 와 같은 순서)
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
export async function boot({url=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',zone='dist01',w=960,h=540,init=()=>{} ,initArg=null}={}){
 const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
 await ctx.addInitScript(init,initArg);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(url);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
 const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
 await p.evaluate(async(z)=>{await window.__STORYWORLD_CHEAT777__.go(z,'STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}},zone);
 await p.waitForFunction(z=>room?.id===z&&!loading,zone,{timeout:180000});await skip();
 await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('michaela'));player.hero='michaela';}finally{loading=false;}updateHUD();});
 return {b,p,errors,skip};
}
