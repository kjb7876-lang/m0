// R390 길잡이 헤맴 탐색(헤드리스): 새 게임 → 영화 모드 → 2초마다 지역·위치·단계·목표·근처 적 기록.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const SECS=+process.env.SECS||240,OUT=process.env.OUT||'out';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/');await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);window.__STORYWORLD_CINEMA_MODE_R370__.set({on:true});});
const rows=[];const t0=Date.now();
while((Date.now()-t0)/1000<SECS){await p.waitForTimeout(2000);
 rows.push(await p.evaluate(()=>{const g=window.__STORYWORLD_GUIDE_R75__?.inspect?.()||{};const en=(room?.enemies||[]).filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden');
  const near=en.reduce((m,e)=>Math.min(m,Math.hypot(e.x-player.x,e.y-player.y)),1e9);
  return{t:+(typeof time==='number'?time:0).toFixed(1),room:room?.id,x:+player.x.toFixed(1),y:+player.y.toFixed(1),ph:window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(room)?.phase||null,
   loading,modal:!!modal,guide:!!guide,auto:!!auto,alive:en.length,near:+near.toFixed(1),target:g.target||g.goal||g.mode||null,unstick:window.__STORYWORLD_GUIDE_UNSTICK_R222__?.inspect?.().stats||null};}));}
fs.writeFileSync(OUT+'/guide-trace.json',JSON.stringify({rows,errors},null,0));
await p.screenshot({path:OUT+'/guide-end.jpg',quality:70});
console.log(rows.map(r=>`${r.t}s ${r.room} (${r.x},${r.y}) ${r.ph} alive=${r.alive} near=${r.near} tgt=${JSON.stringify(r.target).slice(0,60)}`).join('\n'));
console.log('errors',errors.length);await b.close();
