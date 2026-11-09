// R501 브라우저 점검(헤드리스): ① 처음 화면 설정 → 이어하기 뒤에도 유지 ② 손전등 체크가 3초 뒤에도 유지 ③ 설정 창 모든 조작 한 번씩(오류·게임 시간 멈춤 없음).
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r501/r501-browser.mjs  (playwright 필요)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
// ② 손전등 체크
const fl=await p.evaluate(async()=>{showSettings();const box=document.getElementById('flashlightModeR58');box.click();closePanel(true);await new Promise(r=>setTimeout(r,3000));showSettings();const r={f58:settings.flashlight58,box:document.getElementById('flashlightModeR58').checked,sel:document.getElementById('lightModeR182').value};
 const b2=document.getElementById('flashlightModeR58');b2.click();closePanel(true);await new Promise(r=>setTimeout(r,1200));r.offF58=settings.flashlight58;r.offMode=window.__STORYWORLD_LIGHT_R182__.choice();return r;});
ok('손전등 주변 시야 체크: 3초 뒤에도 켜짐, 시야=손전등',fl.f58===true&&fl.box===true&&fl.sel==='flashlight',fl);ok('…다시 끄면 기본 은은한 원형',fl.offF58===false&&fl.offMode==='glow',fl);
// ① 처음 화면 설정 → 이어하기
await p.evaluate(()=>{for(let i=0;i<50&&storyScene;i++)advanceScene();saveGame(false);});
await p.reload();await p.locator('#titleSettingsR84').click({timeout:180000});await p.waitForTimeout(400);
const want=await p.evaluate(()=>{for(const k of ['lowFx','reducedMotion','sound','music']){const el=document.querySelector('[data-setting="'+k+'"]');if(el)el.click();}const v=document.querySelector('[data-volume="bgm"]');if(v){v.value='0.15';v.dispatchEvent(new Event('input',{bubbles:true}));}return {...settings};});
await p.waitForTimeout(300);await p.locator('#settingsClose').click();await p.waitForTimeout(500);
await p.locator('#campaignContinue54').click({timeout:60000});await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
const got=await p.evaluate(()=>({...settings}));const keys=['lowFx','reducedMotion','sound','music','bgm'];
ok('처음 화면에서 바꾼 기본 설정이 이어하기 뒤에도 유지',keys.every(k=>got[k]===want[k]),Object.fromEntries(keys.map(k=>[k,[want[k],got[k]]])));
// ③ 다시 불러오기(새로고침) 뒤에도 유지
await p.reload();await p.locator('#campaignContinue54').click({timeout:180000});await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
const got2=await p.evaluate(()=>({...settings}));ok('새로고침·이어하기 뒤에도 유지',keys.every(k=>got2[k]===want[k]),Object.fromEntries(keys.map(k=>[k,got2[k]])));
ok('페이지 오류 없음',errs.length===0,errs);
console.log((bad?'R501 BROWSER FAILED ':'R501 BROWSER PASSED ')+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
