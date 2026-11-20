// 영웅 전환 반복 계측: 전환 순간 멈칫(ms) + 전환 뒤 프레임 시간 + 자원 수
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4396/m0/';const N=+(process.env.N||10);const PROF=process.env.PROF==='1';const LOWQ=process.env.LOWQ==='1';
const b=await chromium.launch({headless:true,args:['--enable-precise-memory-info','--js-flags=--expose-gc']});const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript((off)=>{if(off)try{localStorage.setItem('storyworld.r1264.heroArt','{"on":false}')}catch(_){}
 const L=window.__lk={add:0,rm:0,iv:0,ivc:0,raf:0,to:0};
 const ae=EventTarget.prototype.addEventListener,re=EventTarget.prototype.removeEventListener;
 L.tg={};EventTarget.prototype.addEventListener=function(...a){L.add++;if(this===window||this===document||this===document.body||this===document.documentElement){const k=(this===window?'win':this===document?'doc':'body')+':'+a[0];L.tg[k]=(L.tg[k]||0)+1;if(window.__lkStack&&k)(L.st=L.st||{})[k+'@'+(new Error().stack.split('\n')[2]||'').trim().slice(0,140)]=1;}return ae.apply(this,a)};EventTarget.prototype.removeEventListener=function(...a){L.rm++;return re.apply(this,a)};
 const si=window.setInterval,ci=window.clearInterval;window.setInterval=function(...a){L.iv++;return si.apply(this,a)};window.clearInterval=function(...a){L.ivc++;return ci.apply(this,a)};
 const ce=Document.prototype.createElement;L.cv=0;Document.prototype.createElement=function(t,...a){if(String(t).toLowerCase()==='canvas')L.cv++;return ce.call(this,t,...a)};const ra=window.requestAnimationFrame;window.requestAnimationFrame=function(f){L.raf++;return ra.call(this,f)};
 const fr=window.__fr={t:[],last:0};(function loop(t){if(fr.last)fr.t.push(t-fr.last);fr.last=t;if(fr.t.length>4000)fr.t.splice(0,2000);ra(loop)})(0);
},process.env.R1264OFF==='1');
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
if(LOWQ)await p.evaluate(()=>{try{settings.lowFx=true;}catch(_){}try{window.__STORYWORLD_MOBILE_TIER_R1023__.setPref('low');}catch(_){}});
let t0=Date.now();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});console.log('777 activate ms',Date.now()-t0);await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{guide=false;auto=false;player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}try{window.__STORYWORLD_PERSONA_HERO_R1113__.unlock?.('secret-777')}catch(_){};window.__lkStack=1;});
const snap=()=>p.evaluate(()=>{const L=window.__lk;let tex=null,geo=null,prog=null;try{const r=window.__STORYWORLD_THREE_RENDERER__||window.__STORYWORLD_R183__?.renderer;}catch(_){}
 for(const k of Object.keys(window)){try{const v=window[k];if(v&&v.info&&v.info.memory&&v.render){tex=v.info.memory.textures;geo=v.info.memory.geometries;prog=v.info.programs?.length;break;}}catch(_){}}
 let mb=0;for(const r of imageCache.values()){const im=r.image;if(r.ready&&im&&im.naturalWidth)mb+=im.naturalWidth*im.naturalHeight*4;}const T=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const mi=T?.renderer?.info?.memory;return{decMB:Math.round(mb/1e6),tex:mi?.textures,geo:mi?.geometries,cst:T?.commands?.textures?.size,cv:L.cv,img:imageCache.size,ivLive:L.iv-L.ivc,heap:Math.round(performance.memory.usedJSHeapSize/1e6),dom:document.getElementsByTagName('*').length,effects:effects.length,cmds:ctx?.commands?.length};});
async function frames(ms){await p.evaluate(()=>{window.__fr.t=[];window.__lk.raf0=window.__lk.raf;window.__gt0=time});await p.waitForTimeout(ms);return p.evaluate(()=>{const a=window.__fr.t.slice().sort((x,y)=>x-y);const m=a.reduce((s,v)=>s+v,0)/a.length;return{n:a.length,avg:+m.toFixed(1),p95:+a[Math.floor(a.length*.95)]?.toFixed(1),max:+a[a.length-1]?.toFixed(1),rafPerFrame:+((window.__lk.raf-window.__lk.raf0)/a.length).toFixed(1),gt:+(time-window.__gt0).toFixed(2)}});}
const out={base:{...(await frames(4000)),...(await snap())},sw:[]};if(PROF){const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});await cdp.send('Profiler.start');await frames(5000);fs.writeFileSync('prof0.cpuprofile',JSON.stringify((await cdp.send('Profiler.stop')).profile));}console.log('base',JSON.stringify(out.base));
const order=['lauren','neon','slayer','hunter','seoha','gunner','michaela','ego','persona','hwando'];
let prof=null;
for(let i=0;i<N;i++){const h=order[i%order.length];
 const r=await p.evaluate(async(id0)=>{const t=performance.now();
  // 실제 영웅창 길: 영웅창 열고 칸 클릭 → 확정 단추
  showHeroes(false);await new Promise(r=>setTimeout(r,50));
  const pick=()=>(id0==='ego'?document.querySelector('#panel [data-ego-r1046]'):id0==='persona'?document.querySelector('#panel [data-persona-r1113]'):null)||document.querySelector(`#panel [data-hero="${id0}"]:not(#r263Stage)`)||document.querySelector(`#panel button[data-hero="${id0}"]`);
  let el=pick();for(let k=0;k<100&&!el;k++){await new Promise(r=>setTimeout(r,50));el=pick();}
  if(!el)return{err:'no card '+id0,cards:[...document.querySelectorAll('#panel [data-hero]')].map(e=>e.dataset.hero)};
  el.click();await new Promise(r=>setTimeout(r,80));const c=document.getElementById('chooseHero');if(!c)return{err:'no choose'};
  const t1=performance.now();c.click();
  for(let k=0;k<400&&(loading||modal);k++)await new Promise(r=>setTimeout(r,25));
  return{ms:Math.round(performance.now()-t1),total:Math.round(performance.now()-t),hero:player.hero,ego:!!player.egoSovereignR1046,persona:!!player.personaHeroR1113,modal:!!modal};},h);
 if(PROF&&i===N-1){const cdp=await ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});await cdp.send('Profiler.start');const f=await frames(5000);prof=(await cdp.send('Profiler.stop')).profile;fs.writeFileSync('prof.cpuprofile',JSON.stringify(prof));r.f=f;}
 else r.f=await frames(3000);
 r.s=await snap();out.sw.push(r);console.log('sw',i,h,JSON.stringify({ms:r.ms,err:r.err,hero:r.hero,ego:r.ego,persona:r.persona,avg:r.f.avg,p95:r.f.p95,...r.s,tg:undefined}));}
await p.evaluate(()=>{try{gc()}catch(_){}});out.end=await snap();console.log('end',JSON.stringify(out.end),'errors',errors.slice(0,3));
fs.writeFileSync(process.env.OUT||'sw.json',JSON.stringify(out,null,1));await b.close();
