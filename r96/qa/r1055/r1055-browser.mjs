// R1055 브라우저(헤드리스) 확인: 첫 화면 단추 · 동양 지역에서 맵만 먹빛 · 끄면 원래대로 · 다른 지역은 그대로.
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node r1055-browser.mjs [outDir]   (헤드리스 소프트웨어 렌더링 — GPU·실기기 검증 아님)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);
let chromium;try{({chromium}=req('playwright'));}catch(_){({chromium}=req('/opt/node-tools/node_modules/playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',out=process.argv[2]||'.';const VP=process.env.MOBILE?{width:844,height:390}:{width:1280,height:720};
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:VP,deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const I=()=>p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.inspect());
await p.goto(URL);await p.locator('#campaignNew54').waitFor({timeout:180000});
const btn=p.locator('#inkTestR1055');ok('title: 수묵화풍 테스트 button visible',await btn.isVisible());
ok('title: starts off',/꺼짐/.test(await btn.textContent()),await btn.textContent());await p.screenshot({path:`${out}/title.png`});
await btn.click();ok('title: press → 동양 지역만',/동양/.test(await btn.textContent())&&(await I()).prefs.mode==='east');await p.screenshot({path:`${out}/title-on.png`});
await p.locator('#campaignNew54').click();await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async z=>{await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:150000});await skip();
 await p.evaluate(()=>{player.hp=9e8;player.invincible=999;window.__t0=time;});for(let T=Date.now();Date.now()-T<200000;){await skip();if(await p.evaluate(()=>time-window.__t0>=4))break;await p.waitForTimeout(400);}};
// 맵 색 표본: 화면 가운데 띠에서 캔버스 픽셀의 평균 채도
const sat=async()=>{const buf=await p.screenshot();return p.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  const d=g.getImageData(0,Math.round(im.height*.12),im.width,Math.round(im.height*.6)).data;let s=0,l=0,k=0;for(let i=0;i<d.length;i+=16){const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(mx<12)continue;s+=(mx-mn)/mx;l+=mx;k++;}return {sat:s/k,val:l/k/255,k};},buf.toString('base64'));};
const start=await p.evaluate(()=>room.id);const s0=await sat();const i0=await I();
ok('first region (not eastern): filter stays off in east mode',i0.k===0,{zone:start,k:i0.k});
await go('last302');await p.waitForTimeout(2500);const i1=await I(),sOn=await sat();await p.screenshot({path:`${out}/last302-on.png`});
ok('last302: filter on (k≈1), map materials patched, no errors',i1.k>.95&&i1.stats.patched>0&&i1.stats.errors===0,i1);
ok('last302: full level at PC default step',i1.level==='full',i1.level);
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(3000);const i2=await I(),sOff=await sat();await p.screenshot({path:`${out}/last302-off.png`});
ok('last302: off → k back to 0',i2.k===0,i2.k);
ok('last302: screen saturation clearly lower with ink on',sOn.sat<sOff.sat*.75,{on:sOn,off:sOff});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'east'}));
await go('last303');await p.waitForTimeout(2500);const i3=await I();await p.screenshot({path:`${out}/last303-on.png`});ok('last303: filter on',i3.k>.95,i3.k);
await go('hub');await p.waitForTimeout(2500);const i4=await I();ok('hub: off in east mode',i4.k===0,i4.k);
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(3000);const i5=await I();await p.screenshot({path:`${out}/hub-all.png`});ok('hub: on in all mode',i5.k>.95&&i5.stats.errors===0,i5);
ok('renderer still Three (not Legacy fallback), no page errors',await p.evaluate(()=>!!window.__STORYWORLD_PHASE1__?.controller?.state?.three)&&errs.length===0,errs);
console.log(`\nR1055 browser: ${n-bad}/${n} pass`);await b.close();process.exit(bad?1:0);
