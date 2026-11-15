// R1043 도달 판정(reach-r225) 한 번 비용(헤드리스): 무한 생존 시작 직후(적 ≤3) check() 를 처음(벽 판정 새로)·바로 다시(15초 캐시) 재어 비교한다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
const r=await p.evaluate(()=>{const A=window.__STORYWORLD_REACH_R225__;const act=()=>(room.enemies||[]).filter(e=>e&&e.hp>0&&e.spawnState!=='hidden');
 while(act().length>1){const e=act()[0];e.hp=0;}if(!act().length)return {skip:'no enemy'};
 let blk=0;const ob=window.blocked;window.blocked=function(){blk++;return ob.apply(this,arguments);};
 const out=[];for(let i=0;i<4;i++){if(i===0||i===3){room.exploration={...room.exploration};}blk=0;const t=performance.now();A.check();out.push({ms:Math.round((performance.now()-t)*10)/10,blocked:blk,fresh:i===0||i===3});}
 window.blocked=ob;return {zone:room.id,enemies:act().length,cells:A.reachOf(room.exploration)?.size,runs:out};});
console.log(JSON.stringify(r));await b.close();
