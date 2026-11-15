// R1043 CPU 프로파일(헤드리스): 무한 생존 슬레이어 장면을 SW_SEC 초 동안 CDP 프로파일러로 재고, 함수·파일별 자기 시간 상위를 적는다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',MOB=E.SW_MOBILE==='1',SEC=+(E.SW_SEC||6),PLAY=+(E.SW_PLAY||40);
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=MOB?await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true}):await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const p=await ctx.newPage();
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
if(E.SW_PRE)await p.evaluate(E.SW_PRE);
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await p.evaluate(sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T0=performance.now();while(time-t0<sec&&performance.now()-T0<30000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();tick(1/30);}},PLAY);
if(E.SW_POST)await p.evaluate(E.SW_POST);
console.log('mobs',await p.evaluate(()=>(room.enemies||[]).filter(e=>e.hp>0).length));
const c=await ctx.newCDPSession(p);await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:500});await c.send('Profiler.start');
const fr=await p.evaluate(async sec=>{let n=0,run=true;await new Promise(r=>{const f=()=>{n++;if(run)requestAnimationFrame(f);};requestAnimationFrame(f);setTimeout(()=>{run=false;r();},sec*1000);});return n;},SEC);
const {profile}=await c.send('Profiler.stop');
const byId=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();const dt=profile.timeDeltas;let total=0;
profile.samples.forEach((id,i)=>{const n=byId.get(id);const d=(dt[i]||0)/1000;total+=d;const cf=n.callFrame;const k=(cf.functionName||'(anon)')+' '+(cf.url||'').split('/').pop()+':'+cf.lineNumber;self.set(k,(self.get(k)||0)+d);});
const byFile=new Map();for(const [k,v] of self){const f=k.split(' ')[1]?.split(':')[0]||'?';byFile.set(f,(byFile.get(f)||0)+v);}
console.log('frames',fr,'total ms',Math.round(total));
console.log('TOP FUNCS');[...self].sort((a,b)=>b[1]-a[1]).slice(0,+(E.SW_TOP||30)).forEach(([k,v])=>console.log(Math.round(v)+'ms',(v/fr).toFixed(1)+'ms/f',k));
const parent=new Map();for(const n of profile.nodes)for(const ch of (n.children||[]))parent.set(ch,n.id);
const WANT=(E.SW_CALLERS||'getImageData,texSubImage2D,reachOf,remapF').split(',');const cs=new Map();
profile.samples.forEach((id,i)=>{const n=byId.get(id);if(!WANT.includes(n.callFrame.functionName))return;let chain=[];let q=parent.get(id);for(let k=0;k<4&&q;k++){const m=byId.get(q);chain.push(m.callFrame.functionName+'@'+(m.callFrame.url||'').split('/').pop()+':'+m.callFrame.lineNumber);q=parent.get(q);}const key=n.callFrame.functionName+' <- '+chain.join(' <- ');cs.set(key,(cs.get(key)||0)+(dt[i]||0)/1000);});
console.log('CALLERS');[...cs].sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>console.log(Math.round(v)+'ms',k));
console.log('TOP FILES');[...byFile].sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v])=>console.log(Math.round(v)+'ms',(v/fr).toFixed(1)+'ms/f',k));
await b.close();
