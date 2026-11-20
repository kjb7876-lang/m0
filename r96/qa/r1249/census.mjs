import {chromium,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:812,height:375},deviceScaleFactor:1});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto('http://127.0.0.1:4410/m0/?wrapcensus=1');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);await p.waitForTimeout(4000);
const C='__STORYWORLD_WRAP_CENSUS_R1249__';
const summary=()=>p.evaluate(C=>{const c=window[C],i=c.inspect();const o={};for(const n of c.NAMES){const t=c.table(n);o[n]={layers:t.length,maxDepth:i.names[n].maxDepth,late:i.names[n].lateChanges,lastOuter:i.names[n].lastOuter,calls:t[0]?.calls,top:c.top(n,6).map(r=>r.label+' '+r.selfMs+'ms/'+r.calls)};}return {phase:i.phase,err:i.lastError,o};},C);
await p.evaluate(C=>window[C].reset(),C);await p.waitForTimeout(10000);
const s1=await summary();console.log('PLAY10s',JSON.stringify(s1,null,0));
// 저장 → 복원 → 재입장 3회
const depth=[];
for(let k=0;k<3;k++){await p.evaluate(async C=>{saveGame?.();const raw=window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(normalSaveKeyR73());window[C].reset();await restoreSave(JSON.parse(raw));},C);
 await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.waitForTimeout(1500);
 depth.push(await p.evaluate(C=>{const i=window[C].inspect();const o={};for(const n of window[C].NAMES)o[n]={layers:i.names[n].layers.length,maxDepth:i.names[n].maxDepth,late:i.names[n].lateChanges};o.restoreOuter=i.names.restoreSave.lastOuter;return o;},C));}
console.log('RESTORE',JSON.stringify(depth));
const full=await p.evaluate(C=>({restoreSave:window[C].table('restoreSave'),tick:window[C].table('tick'),updateHUD:window[C].table('updateHUD'),drawEnemy:window[C].table('drawEnemy')}),C);
(await import('node:fs')).writeFileSync('census-out.json',JSON.stringify({play:s1,restore:depth,full},null,1));
await b.close();
