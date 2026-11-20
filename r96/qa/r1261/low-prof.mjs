// R1261 성능 단계별 CPU 표본(헤드리스). node low-prof.mjs  env: SW_URL, STEP(1), MOBILE=1(휴대폰 흉내: 터치·coarse·DPR 2), EXTRA_LS='{"키":"값"}'(시작 전 localStorage), ZONE(dist01 꿈), SEC(6), OUT
//  꿈 층에서 영웅이 0.3초마다 가까운 몹을 치고, 중간에 사몽 각성. 그동안 CDP 프로파일 → 파일·함수별 자기 시간, rAF 프레임 간격(평균·p95·최대).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',STEP=+(process.env.STEP||1),MOB=process.env.MOBILE==='1',Z=process.env.ZONE||'dist01',SEC=+(process.env.SEC||6);
const b=await chromium.launch();const ctx=await b.newContext(MOB?{viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(([st,ex])=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r1043.perf7',JSON.stringify({step:st}));if(ex)for(const [k,v] of Object.entries(ex))localStorage.setItem(k,v);},[STEP,process.env.EXTRA_LS?JSON.parse(process.env.EXTRA_LS):null]);
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(z=>enterRegion(z,null,{layer:'DREAM',restore:true}),Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:150000});await skip();
const info=await p.evaluate(st=>{try{window.__STORYWORLD_PERF7_R1043__.setStep(st);}catch(_){}player.maxHp=player.hp=1e9;player.hero='hwando';return {step:window.__STORYWORLD_PERF7_R1043__.step(),lowFx:!!settings.lowFx,mobile:!!window.__STORYWORLD_MOBILE_R63__?.isMobile?.(),dpr:devicePixelRatio,canvas:[document.querySelector('canvas')?.width,document.querySelector('canvas')?.height]};},STEP);
await p.waitForTimeout(2500);
const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:250});
await p.evaluate(()=>{window.__F=[];let on=true;const L=t=>{window.__F.push(t);if(on)requestAnimationFrame(L);};requestAnimationFrame(L);window.__stopF=()=>{on=false;};});
await cdp.send('Profiler.start');
await p.evaluate(sec=>new Promise(res=>{const t0=time;let next=t0,aw=false;const f=()=>{if(modal)closePanel(true);if(storyScene)advanceScene();player.hp=player.maxHp;
 if(time>=next){next=time+.3;const e=(room.enemies||[]).filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(e){player.x=e.x-.8;player.y=e.y;player.attackAnim=.2;try{hitEnemy(e,1,{kind:'basic',sourceHero:player.hero});}catch(_){}}}
 if(!aw&&time>=t0+sec*.4){aw=true;player.samong=0;player.samongCD=0;try{awaken('key');}catch(_){}}
 time>=t0+sec?res():setTimeout(f,30);};f();}),SEC);
const {profile}=await cdp.send('Profiler.stop');const F=await p.evaluate(()=>{window.__stopF();const F=window.__F,d=[];for(let i=1;i<F.length;i++)d.push(F[i]-F[i-1]);return d;});
const byId=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map(),byFile=new Map();let tot=0;
for(let i=0;i<profile.samples.length;i++){const n=byId.get(profile.samples[i]);const d=(profile.timeDeltas[i]||0)/1000;tot+=d;const cf=n.callFrame;const file=(cf.url.split('/').pop().split('?')[0])||cf.functionName;const k=(cf.functionName||'(anon)')+' '+file+':'+(cf.lineNumber+1);self.set(k,(self.get(k)||0)+d);byFile.set(file,(byFile.get(file)||0)+d);}
const par=new Map();for(const n of profile.nodes)for(const c of (n.children||[]))par.set(c,n);const TG=/^(getImageData|texSubImage2D|texImage2D|putImageData|drawImage|getProgramInfoLog|linkProgram)$/;const agg=new Map();
for(let i=0;i<profile.samples.length;i++){const n=byId.get(profile.samples[i]);if(!TG.test(n.callFrame.functionName))continue;const ch=[];let q=par.get(n.id);for(let j=0;j<5&&q;j++){ch.push((q.callFrame.functionName||'anon')+'@'+q.callFrame.url.split('/').pop().split('?')[0]+':'+(q.callFrame.lineNumber+1));q=par.get(q.id);}const k=n.callFrame.functionName+' <- '+ch.join(' <- ');agg.set(k,(agg.get(k)||0)+(profile.timeDeltas[i]||0)/1000);}
const insp=await p.evaluate(()=>{const o={};for(const k of ['__STORYWORLD_COMBAT_READ_R409__','__STORYWORLD_HERO_PALETTE_R302__']){try{const v=window[k]?.inspect?.();o[k]=JSON.stringify(v?.stats||v).slice(0,600);}catch(e){o[k]=String(e);}}return o;});
const s=[...F].sort((a,b)=>a-b),avg=F.reduce((a,b)=>a+b,0)/Math.max(1,F.length);
const out={info,frames:F.length,avg:+avg.toFixed(1),p95:+(s[Math.floor(s.length*.95)]||0).toFixed(1),max:+(s.at(-1)||0).toFixed(1),totalMs:+tot.toFixed(0),
 native:[...agg].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>v.toFixed(0).padStart(5)+' '+k),insp,
 files:[...byFile].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+'='+v.toFixed(0)),fns:[...self].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,v])=>v.toFixed(0).padStart(5)+' '+k)};
console.log(JSON.stringify(out,null,1));if(process.env.OUT)(await import('node:fs')).writeFileSync(process.env.OUT,JSON.stringify(out,null,1));await b.close();
