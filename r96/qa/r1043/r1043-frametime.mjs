// R1043 프레임 시간 측정(헤드리스 소프트웨어 렌더링 — 실기기·GPU 수치 아님, 전후 비교용).
//  무한 생존 슬레이어로 몹을 모은 뒤(게임 시간 40초), 단계마다 실제 장면 간격(rAF)과 R150 '한 장면 일 시간'을 6초씩 잰다.
//  SW_URL, SW_MOBILE=1(844×390 DPR3), SW_STEPS="r1023:low,r1023:pc" 또는 "1,2,...,7"(R1043 단계)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',MOB=E.SW_MOBILE==='1';
const STEPS=(E.SW_STEPS||'r1023:low,r1023:pc').split(',');const SEC=+(E.SW_SEC||6);
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=MOB?await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true}):await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await p.evaluate(sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T0=performance.now();while(time-t0<sec&&performance.now()-T0<20000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();tick(1/30);}},40);
await p.evaluate(()=>window.__STORYWORLD_PERF_R150__?.set({meter:true}));
const out=[];
for(const s of STEPS){
 await p.evaluate(s=>{if(s.startsWith('r1023:'))window.__STORYWORLD_MOBILE_TIER_R1023__.setPref(s.slice(6));else window.__STORYWORLD_PERF7_R1043__?.setStep(+s);},s);
 await p.waitForTimeout(1500);
 const r=await p.evaluate(async sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const g=[];let last=0;let run=true;
  const keep=setInterval(()=>{player.hp=maxHP();if(modal){document.getElementById('r600Pick0')?.click();}const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);},250);
  await new Promise(res=>{const f=t=>{if(last)g.push(t-last);last=t;if(run)requestAnimationFrame(f);};requestAnimationFrame(f);setTimeout(()=>{run=false;res();},sec*1000);});clearInterval(keep);
  const s=g.slice().sort((a,b)=>a-b),q=x=>s.length?Math.round(s[Math.min(s.length-1,Math.floor((s.length-1)*x))]*10)/10:null;const P=window.__STORYWORLD_PERF_R150__?.inspect();
  return {frames:g.length,median:q(.5),p90:q(.9),max:q(1),work:P?.work??null,dpr,cw:canvas.width,ch:canvas.height,lowFx:settings.lowFx,mobs:(room.enemies||[]).filter(e=>e.hp>0).length,lite:document.documentElement.classList.contains('swLiteR150')};},SEC);
 out.push({step:s,...r});console.log(JSON.stringify({step:s,...r}));}
console.log('ERRORS',JSON.stringify(errs));await b.close();
