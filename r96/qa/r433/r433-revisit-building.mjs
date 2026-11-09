// R433 헤드리스 재현: 재입장·같은 구역·저장 불러오기 뒤 R414 건물 그림, 그리고 releaseImageMemory() 직후 5초 안에 다시 불러오는지. U=http://127.0.0.1:4396/ node r96/qa/r433/r433-revisit-building.mjs
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
 return {zone,layer,room:room.id,sz:room.exploration?.samongR115?.zone,props:room.props.length,kindsX:0&&Object.entries(room.props.reduce((m,q)=>{const k=(q.id||q.path||'?').toString().split(/[:/]/)[0];m[k]=(m[k]||0)+1;return m},{})).slice(0,12),sameL:window.__L0===room.exploration,sameR:window.__R0===room,cache:imageCache.size,report:R.room&&{placed:R.room.placed.length},stats:R.stats,buildings:bs.map(q=>({n:q.r414Building,inCache:imageCache.has(q.path),ready:!!readyImage(q.path)})),missing:drawStats?.missing};});
await goZ(Z);await p.evaluate(()=>{window.__L0=room.exploration;window.__R0=room;});const a=await probe();console.log('FIRST',JSON.stringify(a));await p.screenshot({path:'first.jpg',quality:70});

// A: 같은 구역 다시 들어가기(goZone 같은 구역)
for(const o of OTHERS.slice(0,2)){await go(o,'STORY');}
await goZ(Z);await p.evaluate(()=>{window.__L0=room.exploration;window.__R0=room;});console.log('REENTER',JSON.stringify(await probe()));
await goZ(Z);console.log('REENTER-SAME',JSON.stringify(await probe()));
// B: 저장 불러오기
await p.evaluate(async()=>{const d=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(d);});await p.waitForTimeout(3000);await skip();console.log('RESTORE',JSON.stringify(await probe()));
// C: 기제 직접 확인 — 엔진 releaseImageMemory 를 그 자리에서 한 번 부름(지역 진입 때와 같은 함수)
await p.evaluate(()=>releaseImageMemory());console.log('AFTER-RELEASE',JSON.stringify(await probe()));
await p.waitForTimeout(5000);console.log('AFTER-RELEASE+5s',JSON.stringify(await probe()));await p.screenshot({path:'after-release.jpg',quality:70});
console.log('errors',errs);await b.close();
