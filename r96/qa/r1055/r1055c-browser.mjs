// R1055c 헤드리스 확인: 기본 켜짐(모든 지역·무한생존), 설정 줄 켜고 끄기, 성능 1·2단계는 쉼, 켬·끔 프레임 수 비교.
// 실행: node r1055c-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('/opt/node-tools/node_modules/playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',out=process.argv[2]||'.';let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const open=async()=>{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await p.goto(URL);return p;};
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const I=p=>p.evaluate(()=>window.__STORYWORLD_INK_WASH_R1055__.inspect());
// 1) 이야기: 저장값 없이 시작 → 첫 지역에서 바로 켜짐
const p=await open();await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});for(let i=0;i<5;i++){await skip(p);await p.waitForTimeout(700);}
await p.waitForTimeout(2500);const i1=await I(p),z1=await p.evaluate(()=>room.id);
ok('story: default on in the first region with nothing stored',i1.prefs.mode==='all'&&i1.k>.95&&i1.stats.patched>0&&i1.stats.errors===0,{zone:z1,k:i1.k,patched:i1.stats.patched,level:i1.level});
await p.screenshot({path:`${out}/c-story-on.png`});
// 2) 설정 줄
await p.evaluate(()=>showSettings());await p.waitForTimeout(900);
const row=await p.evaluate(()=>{const r=document.getElementById('inkRowR1055');return r&&{parent:r.parentNode?.id,checked:document.getElementById('inkOnR1055').checked,style:document.getElementById('inkSelR1055').value,opts:document.getElementById('inkSelR1055').options.length,vis:!!r.offsetParent,text:r.textContent.slice(0,40)};});
ok('settings: 맵 수묵화풍 row in the 전투 화면 section (always visible), checked, five styles',!!row&&row.parent==='combatScreenR1021'&&row.checked&&row.opts===5&&row.vis,row);
await p.evaluate(()=>document.getElementById('inkRowR1055').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:`${out}/c-settings.png`});
await p.evaluate(()=>{const c=document.getElementById('inkOnR1055');c.scrollIntoView({block:'center'});c.click();});await p.waitForTimeout(300);await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(3000);const i2=await I(p);
ok('settings: unchecking turns the filter off (k → 0) and saves',i2.prefs.mode==='off'&&i2.k===0&&/"mode":"off"/.test(await p.evaluate(()=>localStorage.getItem('storyworld.r1055.inkWash'))),{k:i2.k});
await p.screenshot({path:`${out}/c-story-off.png`});
await p.evaluate(()=>showSettings());await p.waitForTimeout(900);ok('settings: reopened row shows unchecked',await p.evaluate(()=>document.getElementById('inkOnR1055')?.checked===false));
await p.evaluate(()=>{const c=document.getElementById('inkOnR1055');c.scrollIntoView({block:'center'});c.click();});await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(3000);const i3=await I(p);ok('settings: checking turns it back on',i3.prefs.mode==='all'&&i3.k>.95,{k:i3.k});
// 3) 성능 1·2단계는 쉼
const P=s=>p.evaluate(s=>window.__STORYWORLD_PERF7_R1043__.setStep(s),s);
await P(2);await p.waitForTimeout(3500);const lo=await I(p);ok('perf step 2: filter rests (k = 0)',lo.k===0,{k:lo.k});
await P(1);await p.waitForTimeout(1500);ok('perf step 1: filter rests',(await I(p)).k===0);
await P(3);await p.waitForTimeout(3000);const mid=await I(p);ok('perf step 3: paper level only',mid.k>.95&&mid.level==='paper',{k:mid.k,level:mid.level});
await P(5);await p.waitForTimeout(3000);const hi=await I(p);ok('perf step 5: full again',hi.k>.95&&hi.level==='full',{k:hi.k,level:hi.level});
// 4) 켬·끔 프레임 수(같은 장면, 번갈아 3번씩, 실제 6초 동안 그린 프레임)
const frames=async()=>{const a=(await I(p)).stats.frames;await p.waitForTimeout(6000);return (await I(p)).stats.frames-a;};
const set=m=>p.evaluate(m=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:m}),m);const on=[],off=[];
for(let i=0;i<3;i++){await set('off');await p.waitForTimeout(1500);off.push(await frames());await set('all');await p.waitForTimeout(1500);on.push(await frames());}
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;console.log('FRAMES',JSON.stringify({on,off,ratio:+(avg(on)/avg(off)).toFixed(3)}));
ok('frames drawn with the filter on are within 10% of off (software rendering, step 5)',avg(on)>=avg(off)*.9,{on,off});
// 5) 무한 생존
const q=await open();await q.locator('#survivalStartR600').waitFor({timeout:180000});await q.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.start('hwando'));
await q.waitForFunction(()=>{const A=window.__STORYWORLD_SURVIVAL_R600__;return A.here()&&!loading&&A.state().ready;},null,{timeout:240000});
await q.waitForTimeout(3000);const s1=await I(q),sz=await q.evaluate(()=>({zone:room?.id,active:!!window.__STORYWORLD_SURVIVAL_R600__?.active?.()}));
ok('infinite survival: filter on by default',sz.active&&s1.prefs.mode==='all'&&s1.k>.95&&s1.stats.patched>0&&s1.stats.errors===0,{...sz,k:s1.k,patched:s1.stats.patched});
await q.screenshot({path:`${out}/c-survival-on.png`});
ok('renderer still Three, no page errors',await p.evaluate(()=>!!window.__STORYWORLD_PHASE1__?.controller?.state?.three)&&errs.length===0,errs);
console.log(`\nR1055c browser: ${n-bad}/${n} pass`);await b.close();process.exit(bad?1:0);
