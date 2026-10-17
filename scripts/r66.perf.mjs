import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const url=process.env.STORYWORLD_URL||'http://127.0.0.1:4391/';
const duration=8000;
const originalHTML=await fs.readFile('docs/index.html','utf8'),originalModule=await fs.readFile('docs/dist/phase1.js','utf8');
await fs.mkdir('out/r66',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const summary={baseline:'170a60140f6ae10914550a7e254bb320764b0d30',candidate:process.env.GITHUB_SHA||'working',browser:await browser.version(),durationMs:duration,sandbox:true,physicalGPU:false,physicalPhone:false,scenario:'dist00/STORY normal, 1365x850 DPR1, flashlight on, automatic attacks disabled, same seeded initialization and real keyboard movement; headless software timings are not user PC FPS.',runs:[]};
const stats=values=>{const a=values.slice().sort((a,b)=>a-b);return{count:a.length,p50Ms:a[Math.floor((a.length-1)*.5)]??null,p95Ms:a[Math.floor((a.length-1)*.95)]??null,maxMs:a.at(-1)??null,meanMs:a.length?a.reduce((s,x)=>s+x,0)/a.length:null,over50ms:a.filter(x=>x>50).length};};
try{
 for(const [index,kind]of ['baseline','candidate','candidate','baseline'].entries()){
  const context=await browser.newContext({viewport:{width:1365,height:850},deviceScaleFactor:1});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=66017;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  if(kind==='baseline'){
   await page.route(url,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:originalHTML}));
   await page.route(new URL('dist/phase1.js',url).href,r=>r.fulfill({status:200,contentType:'text/javascript',body:originalModule}));
  }
  await page.goto(url,{waitUntil:'load',timeout:60000});await page.locator('#campaignNew54').click();
  await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});
  await page.evaluate(()=>enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}}));
  await page.waitForFunction(()=>window.eval('!loading&&!modal'));
  await page.evaluate(()=>{
   auto=false;settings.autoSkill=false;settings.sound=false;settings.music=false;settings.lowFx=false;settings.reducedMotion=false;
   room.engaged=true;player.x=15;player.y=19;player.hp=maxHP()*100;command=null;target=null;route=[];
   window.__STORYWORLD_PRESENTATION_R58__?.setFlashlight(true);
  });
  await page.waitForTimeout(1500);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.enable');await cdp.send('HeapProfiler.collectGarbage');
  const initial=await page.evaluate(()=>({enemies:room.enemies.length,props:room.props.length,effects:effects.length,projectiles:projectiles.length,renderer:window.__STORYWORLD_PHASE1__?.inspect?.()}));
  const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  await page.evaluate(()=>{
   window.__r66Perf={draw:[],tick:[],longTasks:[]};
   for(const key of ['draw','tick']){const original=window.eval(key);window.eval(key+'=('+function(name,base){return function(...args){const t=performance.now();try{return base.apply(this,args);}finally{window.__r66Perf[name].push(performance.now()-t);}};}.toString()+')('+JSON.stringify(key)+','+key+')');}
   if(PerformanceObserver.supportedEntryTypes.includes('longtask')){window.__r66Observer=new PerformanceObserver(list=>window.__r66Perf.longTasks.push(...list.getEntries().map(e=>e.duration)));window.__r66Observer.observe({type:'longtask'});}
  });
  const framePromise=page.evaluate(ms=>new Promise(resolve=>{let first=null,last=null;const values=[];const next=t=>{if(first===null)first=t;if(last!==null)values.push(t-last);last=t;if(t-first>=ms)resolve(values);else requestAnimationFrame(next);};requestAnimationFrame(next);}),duration);
  const movePromise=(async()=>{for(let i=0;i<8;i++){const key=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][i%4];await page.keyboard.down(key);await page.waitForTimeout(720);await page.keyboard.up(key);await page.waitForTimeout(180);}})();
  const [frames]=await Promise.all([framePromise,movePromise]);
  const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  const final=await page.evaluate(()=>{window.__r66Observer?.disconnect();return{zone,alive:room.enemies.filter(e=>e.hp>0).length,enemies:room.enemies.length,props:room.props.length,effects:effects.length,projectiles:projectiles.length,delayed:typeof delayed==='undefined'?null:delayed.length,phases:window.__r66Perf,renderer:window.__STORYWORLD_PHASE1__?.inspect?.()};});
  await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage');
  assert.deepEqual(errors,[]);assert.ok(frames.length>=10,'Game loop stopped or severely stalled');assert.equal(final.zone,'dist00');
  const row={kind,index,frames:stats(frames),draw:stats(final.phases.draw),tick:stats(final.phases.tick),longTasks:stats(final.phases.longTasks),scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,layoutCount:after.LayoutCount-before.LayoutCount,heapPostGC:heap.usedSize,initial,final:{...final,phases:undefined},errors};
  summary.runs.push(row);await fs.writeFile('out/r66/performance-comparison.json',JSON.stringify(summary,null,2));
  console.log('R66_PERF',JSON.stringify({kind,index,frames:row.frames,draw:row.draw,tick:row.tick,longTasks:row.longTasks,scriptMs:row.scriptMs,heapPostGC:row.heapPostGC,objects:{before:{enemies:initial.enemies,props:initial.props,effects:initial.effects},after:{enemies:final.enemies,props:final.props,effects:final.effects,delayed:final.delayed}},errors}));
  await cdp.detach();await context.close();
 }
 summary.status='completed';await fs.writeFile('out/r66/performance-comparison.json',JSON.stringify(summary,null,2)+'\n');
}finally{await browser.close();}
