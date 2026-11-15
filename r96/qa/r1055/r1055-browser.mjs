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
// 화풍 다섯 가지를 같은 자리에서 찍고 대비(밝기 98%-2%)와 잔입자를 잰다
const stat=async()=>{const buf=await p.screenshot();return p.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  const y0=Math.round(im.height*.1),hh=Math.round(im.height*.7),d=g.getImageData(0,y0,im.width,hh).data,L=[];let hf=0,k=0;for(let y=0;y<hh;y+=2)for(let x=0;x<im.width-1;x+=2){const i=(y*im.width+x)*4,l=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255,l2=(d[i+4]*.2126+d[i+5]*.7152+d[i+6]*.0722)/255;L.push(l);hf+=Math.abs(l-l2);k++;}
  L.sort((a,b)=>a-b);return {contrast:+(L[Math.floor(L.length*.98)]-L[Math.floor(L.length*.02)]).toFixed(3),grain:+(hf/k*1000).toFixed(2)};},buf.toString('base64'));};
const styles=await p.evaluate(()=>Object.keys(window.__STORYWORLD_INK_WASH_R1055__.styles));const st={},offs=[];
// 측정 방법(2026-11-15 원인 조사): 이 화면의 잔입자 값은 끈 채로도 프레임마다 10.1~12.9 로 흔들린다(등불 깜빡임·입자). 한 번씩 순서대로 재면 순서가 결과를 정한다
//  → 화풍마다 끔·켬을 번갈아 여러 번 재서 평균을 견준다.
const mode=m=>p.evaluate(m=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:m}),m),avg=a=>a.reduce((x,y)=>x+y,0)/a.length,N=4;
for(const k of styles){await p.evaluate(k=>window.__STORYWORLD_INK_WASH_R1055__.set({style:k}),k);const on=[],ct=[];
 for(let i=0;i<N;i++){await mode('off');await p.waitForTimeout(1800);offs.push((await stat()).grain);await mode('east');await p.waitForTimeout(1800);const q=await stat();on.push(q.grain);ct.push(q.contrast);}
 st[k]={contrast:+avg(ct).toFixed(3),grain:+avg(on).toFixed(2)};await p.screenshot({path:`${out}/last302-${k}.png`});}
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({style:'jg'}));await p.waitForTimeout(1500);
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'off'}));await p.waitForTimeout(3000);const i2=await I(),sOff=await sat();await p.screenshot({path:`${out}/last302-off.png`});
ok('last302: off → k back to 0',i2.k===0,i2.k);
const stOff={contrast:(await stat()).contrast,grain:+avg(offs).toFixed(2),min:Math.min(...offs),max:Math.max(...offs),n:offs.length};console.log('STYLE-STATS',JSON.stringify({off:stOff,...st}));
ok('styles: pooled fine grain of all five styles is not above the unfiltered screen (alternating samples, +5%)',avg(styles.map(k=>st[k].grain))<=stOff.grain*1.05,{off:stOff,...st});
ok('styles: no single style is more than 15% grainier than the unfiltered screen',styles.every(k=>st[k].grain<=stOff.grain*1.15),{off:stOff,...st});
ok('styles: contrast stays within +15% of the unfiltered screen in every style (eye comfort)',styles.every(k=>st[k].contrast<=stOff.contrast*1.15),{off:stOff,...st});
ok('styles: no errors after switching all five',(await I()).stats.errors===0);
ok('last302: screen saturation clearly lower with ink on',sOn.sat<sOff.sat*.75,{on:sOn,off:sOff});
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'east'}));
await go('last303');await p.waitForTimeout(2500);const i3=await I();await p.screenshot({path:`${out}/last303-on.png`});ok('last303: filter on',i3.k>.95,i3.k);
await go('hub');await p.waitForTimeout(2500);const i4=await I();ok('hub: off in east mode',i4.k===0,i4.k);
await p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:'all'}));await p.waitForTimeout(3000);const i5=await I();await p.screenshot({path:`${out}/hub-all.png`});ok('hub: on in all mode',i5.k>.95&&i5.stats.errors===0,i5);
ok('renderer still Three (not Legacy fallback), no page errors',await p.evaluate(()=>!!window.__STORYWORLD_PHASE1__?.controller?.state?.three)&&errs.length===0,errs);
console.log(`\nR1055 browser: ${n-bad}/${n} pass`);await b.close();process.exit(bad?1:0);
