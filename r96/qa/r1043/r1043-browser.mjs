// R1043 브라우저 검사(헤드리스 Chromium — 실기기·GPU·사파리 검증 아님): 성능 7단계 줄·설정 정리·적용 값.
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x).slice(0,500):''));};
const b=await chromium.launch();
async function game(ctx){const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.evaluate(()=>document.getElementById('campaignNew54').click());await p.waitForTimeout(300);
 await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/새 게임 시작/.test(x.textContent))?.click();});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});return {p,errs};}
const openS=async p=>{await p.evaluate(()=>{if(modal)closePanel(true);});await p.waitForTimeout(250);await p.evaluate(()=>showSettings());await p.waitForTimeout(700);};
const vis=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&(e.checkVisibility?e.checkVisibility():!!e.offsetParent);},s);
const st=p=>p.evaluate(()=>({step:window.__STORYWORLD_PERF7_R1043__?.step(),dpr,cw:canvas.width,W,lowFx:settings.lowFx,lite:document.documentElement.classList.contains('swLiteR150'),
 tier:window.__STORYWORLD_MOBILE_TIER_R1023__?.inspect().tier,r300:window.__STORYWORLD_LIGHT_ATMOS_R300__?.prefs().on,r450:window.__STORYWORLD_WEATHER_R450__?.prefs().on}));
// ---- PC ----
{const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const {p,errs}=await game(ctx);let s=await st(p);
 ok('PC default: step 5, nothing changed (dpr 1 on a 1x screen, lowFx off, R1023 tier 3)',s.step===5&&s.dpr===1&&s.lowFx===false&&s.tier===3,s);
 await openS(p);
 const row=await p.evaluate(()=>{const r=document.getElementById('perf7RowR1043');return r?{n:r.querySelectorAll('[data-r1043-step]').length,auto:!!r.querySelector('[data-r1043-step="auto"]'),on:r.querySelector('[aria-pressed="true"]')?.dataset.r1043Step,first:r.parentElement?.id}:null;});
 ok('7-step row in 간이설정 (7 buttons, no auto on PC, 5 pressed)',!!row&&row.n===7&&!row.auto&&row.on==='5'&&row.first==='quickSettingsR114',row);
 ok('7-step row visible',await vis(p,'#perf7RowR1043'));
 for(const [s1,name] of [['[data-r114-preset="low"]','R114 그래픽 품질'],['[data-r150-lite="auto"]','R150 렉 줄이기 단추'],['#mobileTierRowR1023','R1023 그래픽 단계'],['[data-setting="lowFx"]','간소화 VFX'],['[data-r118="perf"]','R118 렉 줄이기'],['#hitboxToggle','판정 진단'],['#voicePreroll','음성 준비 비교'],['#r98c-facing','바라보기 낱칸'],['#r92-mobMotion','잡몹 동작 낱칸']])
  ok('folded into the new rows / hidden: '+name,!(await vis(p,s1)));
 ok('FPS meter checkbox kept visible',await vis(p,'[data-r150-meter]'));
 ok('sound/music/narration/auto-move/subtitle rows kept',await p.evaluate(()=>['[data-setting="sound"]','[data-setting="music"]','[data-setting="narration"]','#autoMoveR1022Toggle','[data-r1021="subs"]','[data-r1037="story"]'].every(s=>document.querySelector(s))));
 ok('graphics detail fold holds R300/R450/R451/R453/R1030',await p.evaluate(()=>{const d=document.getElementById('gfxDetailR1043');return !!d&&['#lightAtmosR300','#weatherR450','#localLightR451','#actorToneR453','#heroHarmonyR1030'].every(s=>d.querySelector(s));}));
 // 묶음 칸: 끄면 다섯 칸 모두 꺼지고, 켜면 모두 켜진다
 const g=await p.evaluate(async()=>{const box=document.getElementById('faceAllR1043');if(!box)return null;const sel=['#r98c-facing','#r100-facing','[data-r114-api="p113"][data-r114-key="facing"]','[data-r114-api="p111"][data-r114-key="facing"]','[data-r137="faceAlways"]'];
  const before=box.checked;box.click();const off=sel.map(s=>document.querySelector(s)?.checked);box.click();const on=sel.map(s=>document.querySelector(s)?.checked);return {before,off,on};});
 ok('grouped "서로 바라보기" drives all five (off → all off, on → all on)',!!g&&g.before===true&&g.off.every(v=>v===false)&&g.on.every(v=>v===true),g);
 const g2=await p.evaluate(()=>{const box=document.getElementById('mobMotionR1043');if(!box)return null;box.click();const off=['#r92-mobMotion','#r98c-mobMotion','#r101-motion'].map(s=>document.querySelector(s)?.checked);box.click();return {off,on:['#r92-mobMotion','#r98c-mobMotion','#r101-motion'].map(s=>document.querySelector(s)?.checked)};});
 ok('grouped "잡몹 움직임" drives all three',!!g2&&g2.off.every(v=>v===false)&&g2.on.every(v=>v===true),g2);
 // 단계 적용
 await p.evaluate(()=>document.querySelector('[data-r1043-step="1"]').click());await p.waitForTimeout(400);s=await st(p);
 ok('step 1: dpr 0.75, canvas 0.75×, lowFx on, light screen on, R1023 tier 0, R300/R450 off',s.dpr===.75&&s.cw===Math.round(s.W*.75)&&s.lowFx===true&&s.lite===true&&s.tier===0&&s.r300===false&&s.r450===false,s);
 await p.evaluate(()=>{for(let i=0;i<60;i++)tick(1/60);});await p.waitForTimeout(500);s=await st(p);ok('step 1 survives play frames (dpr still 0.75)',s.dpr===.75,s);
 await p.evaluate(()=>document.querySelector('[data-r1043-step="7"]').click());await p.waitForTimeout(400);s=await st(p);
 ok('step 7: dpr 2, lowFx off, light screen off, tier 3, R300/R450 on',s.dpr===2&&s.cw===Math.round(s.W*2)&&s.lowFx===false&&s.lite===false&&s.tier===3&&s.r300===true&&s.r450===true,s);
 await p.evaluate(()=>document.querySelector('[data-r1043-step="3"]').click());await p.waitForTimeout(400);s=await st(p);
 ok('step 3: R1023 tier 1, dpr 1, lowFx on',s.tier===1&&s.dpr===1&&s.lowFx===true,s);
 await p.reload({timeout:180000});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted,null,{timeout:240000});await p.waitForTimeout(800);s=await st(p);
 ok('reload keeps step 3',s.step===3&&s.tier===1,s);
 await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(5));
 ok('PC: no page errors',errs.length===0,errs);await ctx.close();}
// ---- 휴대폰 ----
{const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const {p,errs}=await game(ctx);let s=await st(p);
 ok('phone default: auto, current public lowest (R1023 tier 0, lowFx on, dpr 1)',s.step==='auto'&&s.tier===0&&s.lowFx===true&&s.dpr===1,s);
 await openS(p);
 const row=await p.evaluate(()=>{const r=document.getElementById('perf7RowR1043');return r?{n:r.querySelectorAll('[data-r1043-step]').length,on:r.querySelector('[aria-pressed="true"]')?.dataset.r1043Step}:null;});
 ok('phone row: auto + 7 steps, auto pressed, visible',!!row&&row.n===8&&row.on==='auto'&&await vis(p,'#perf7RowR1043'),row);
 await p.evaluate(()=>document.querySelector('[data-r1043-step="1"]').click());await p.waitForTimeout(400);s=await st(p);ok('phone step 1: dpr 0.75',s.dpr===.75&&s.cw===Math.round(s.W*.75),s);
 await p.evaluate(()=>document.querySelector('[data-r1043-step="auto"]').click());await p.waitForTimeout(400);s=await st(p);ok('phone back to auto: tier 0, dpr 1',s.step==='auto'&&s.tier===0&&s.dpr===1,s);
 ok('phone: no page errors',errs.length===0,errs);await ctx.close();}
console.log((bad?'R1043 BROWSER FAILED ':'R1043 BROWSER PASSED ')+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
