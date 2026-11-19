import {createRequire} from 'node:module';import fs from 'node:fs';const {chromium}=createRequire(import.meta.url)('playwright');
const T=JSON.parse(process.env.T),PORT=process.env.PORT||4411,OUT=process.env.OUT||'close';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(`http://127.0.0.1:${PORT}/m0/`);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+s||Date.now()-w0>20000)?r():setTimeout(f,40);f();}),s);
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const res=[];
for(const [z,re,tag] of T){
 if(/^sz115/.test(z))await p.evaluate(async id=>{await window.__STORYWORLD_SAMONG_R103__.goZone(id);},z);else await p.evaluate(async id=>{await enterRegion(id,null,{layer:'STORY',restore:true});},z);
 await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.4);await skip();
 const n=await p.evaluate(re=>{player.invincible=1e9;const R=new RegExp(re);let k=0;for(const e of room.enemies||[]){if(e.hp<=0)continue;if(R.test(e.name)&&k<1){k++;e.x=player.x+2.0;e.y=player.y-.2;e.__r1195t=1;}else{e.speed=0;e.x=player.x+30;e.y=player.y+30;}}return k;},re);
 for(let s=0;s<3;s++){await waitGame(.35);await skip();
  const r=await p.evaluate(()=>{const I=window.__STORYWORLD_FEET_INK_R1195__.inspect();const t=(room.enemies||[]).find(e=>e.__r1195t);return{rec:I.recent.filter(x=>t&&x.name===t.name).slice(-1)[0]||null,stats:{...I.stats,cached:window.__STORYWORLD_FEET_INK_R1195__.cached().length},name:t?.name,state:t?.state};});
  if(!r.rec)console.error(tag,s,r.name,r.state,JSON.stringify(r.stats));if(r.rec){const [x0,y0,x1,y1]=r.rec.box,pad=40;const clip={x:Math.max(0,x0-pad),y:Math.max(0,y0-pad),width:Math.min(960,x1+pad)-Math.max(0,x0-pad),height:Math.min(540,y1+pad)-Math.max(0,y0-pad)};
   await p.evaluate(()=>{window.__tk=window.__tk||null;});
   const cr=await p.evaluate(()=>{const c=[...document.querySelectorAll("canvas")].sort((a,b)=>b.width*b.height-a.width*a.height)[0].getBoundingClientRect();return{x:c.x,y:c.y,w:c.width,cw:[...document.querySelectorAll("canvas")].sort((a,b)=>b.width*b.height-a.width*a.height)[0].width};});const k=cr.w/(cr.cw/2);clip.x=cr.x+clip.x*1;clip.y=cr.y+clip.y*1;if(s==0)console.error("canvas",JSON.stringify(cr));await p.screenshot({path:`${OUT}/${tag}-${s}-on.png`,clip});await p.screenshot({path:`${OUT}/${tag}-${s}-fullon.png`});await p.evaluate(()=>localStorage.setItem('storyworld.r1195.feetInk','0'));await waitGame(.02);
   await p.screenshot({path:`${OUT}/${tag}-${s}-off.png`,clip});await p.screenshot({path:`${OUT}/${tag}-${s}-fulloff.png`});await p.evaluate(()=>localStorage.setItem('storyworld.r1195.feetInk','1'));res.push({z,tag,s,...r});console.error(tag,s,JSON.stringify(r.rec),r.state);}
 }
 console.error(z,'found',n);
}
fs.writeFileSync(`${OUT}/res.json`,JSON.stringify({res,errs},null,1));await b.close();
