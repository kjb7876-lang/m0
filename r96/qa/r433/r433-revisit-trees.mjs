// R433 헤드리스 재현: 사몽 봉합 정원(sz115-S01-2) 첫 입장 → 다른 지역 → 같은 구역 재입장 때 R99 나무 수(roomTrees/inProps). U=http://127.0.0.1:4396/ node r96/qa/r433/r433-revisit-trees.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.U||'http://127.0.0.1:4396/';const Z=process.env.Z||'sz115-S01-2';const OTHERS=(process.env.O||'dist00,dist03,ep1a10,ep1a09').split(',');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
const goZ=async(z)=>{await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.goZone(z),z);await p.waitForFunction(z=>!loading&&room?.exploration?.samongR115?.zone===z,z,{timeout:180000});await p.waitForTimeout(1500);await skip();await p.waitForTimeout(1500);};
const go=async(z,l)=>{await p.evaluate(([z,l])=>{enterRegion(z,null,{layer:l,restore:true});},[z,l]);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:180000});await p.waitForTimeout(1500);await skip();await p.waitForTimeout(1500);};
const probe=()=>p.evaluate(()=>{const R=window.__STORYWORLD_DRIVE_BUILDINGS_R414__.inspect();const bs=room.props.filter(q=>q.r414Building);
 return {r99:{roomTrees:room.r99Trees?.length??null,Lflag:room.exploration?.r99Outdoor?.treeCount??null,inProps:room.props.filter(q=>q.r99Tree).length,replanted:window.__STORYWORLD_WORLD_OUTDOOR_R99__?.inspect?.()?.stats?.replanted},sameL:window.__LA===room.exploration,sameR:window.__RA===room,zone,layer,room:room.id,sz:room.exploration?.samongR115?.zone,props:room.props.length,kinds:Object.entries(room.props.reduce((m,q)=>{const k=(q.id||q.path||'?').toString().split(/[:/]/)[0];m[k]=(m[k]||0)+1;return m},{})).slice(0,12),sameL:window.__L0===room.exploration,sameR:window.__R0===room,cache:imageCache.size,report:R.room&&{placed:R.room.placed.length},stats:R.stats,buildings:bs.map(q=>({n:q.r414Building,inCache:imageCache.has(q.path),ready:!!readyImage(q.path)})),missing:drawStats?.missing};});
await goZ(Z);await p.evaluate(()=>{window.__L0=room.exploration;window.__R0=room;});await p.evaluate(()=>{window.__LA=room.exploration;window.__RA=room;});const a=await probe();console.log('FIRST',JSON.stringify(a));await p.screenshot({path:'first.jpg',quality:70});

// A: 같은 구역 다시 들어가기(goZone 같은 구역)
for(const o of OTHERS.slice(0,2)){await go(o,'STORY');}
await goZ(Z);await p.evaluate(()=>{window.__L0=room.exploration;window.__R0=room;});console.log('REENTER',JSON.stringify(await probe()));
for(const t of [3]){await p.waitForTimeout(t*1000);console.log('REENTER+'+t,JSON.stringify(await probe()));}
await p.screenshot({path:'reenter.jpg',quality:70});
console.log('errors',errs);await b.close();
