import {createRequire} from 'node:module';const req=createRequire(import.meta.url);export const {chromium}=req('playwright');
export const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
export async function boot(b,{init=null,vp={width:1280,height:720}}={}){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});
 await ctx.addInitScript(([init])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(init)for(const [k,v] of Object.entries(init))localStorage.setItem(k,v);},[init]);
 const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);return {ctx,p};}
export const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
export async function go(p,z){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:150000});await skip(p);}
