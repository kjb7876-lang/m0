import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
export async function boot(url,vw=1280,vh=720){const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:vw,height:vh}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(url);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 const go=async z=>{await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:180000});await p.waitForTimeout(1500);await skip();};
 const gameWait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t0,s])=>time>=t0+s,[t0,s],{timeout:600000,polling:200});};
 return {b,p,errs,skip,go,gameWait};}
