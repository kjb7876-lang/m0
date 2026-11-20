import {chromium,skip,go} from '../r444/lib.mjs';
const mode=process.argv[2]||'on',zone=process.argv[3]||'dist02',SECS=+(process.argv[4]||12.16);
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:812,height:375},deviceScaleFactor:1,hasTouch:true});
await ctx.addInitScript(([mode])=>{localStorage.setItem('storyworld.r1249.staticpause',JSON.stringify({on:mode==='on'}));
 window.__gl={calls:0,frames:0,cur:0};for(const P of [window.WebGL2RenderingContext?.prototype,window.WebGLRenderingContext?.prototype])if(P)for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const f=P[k];if(f)P[k]=function(){window.__gl.calls++;window.__gl.cur++;return f.apply(this,arguments);};}
 const loop=()=>{if(window.__gl.cur>0)window.__gl.frames++;window.__gl.cur=0;requestAnimationFrame(loop);};requestAnimationFrame(loop);},[mode]);
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto('http://127.0.0.1:4410/m0/');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
if(zone!=="start")await go(p,zone);await p.waitForTimeout(8000);
const shot=async n=>{await p.evaluate(()=>{document.getElementById('modal').style.visibility='hidden';});await p.screenshot({path:n});await p.evaluate(()=>{document.getElementById('modal').style.visibility='';});};
const stat=async n=>{const {data}=await import('node:fs').then(fs=>({data:fs.readFileSync(n)}));return data.length;};
await shot(`shot-${mode}-before.png`);
const g0=await p.evaluate(()=>({...window.__gl,t:performance.now(),time}));
await p.evaluate(()=>showSettings());
await p.waitForTimeout(SECS*1000);
const g1=await p.evaluate(()=>({...window.__gl,t:performance.now(),time,r:window.__STORYWORLD_STATIC_PAUSE_R1249__?.inspect()}));
await shot(`shot-${mode}-open.png`);
// 입력: 설정창 체크 상자 하나 바꿨다 되돌림 → 다시 그렸는지
const g2a=await p.evaluate(()=>window.__gl.frames);
await p.evaluate(()=>{const i=document.querySelector('#panel input[type=checkbox]');if(i){i.click();i.click();}});await p.waitForTimeout(600);
const g2=await p.evaluate(()=>window.__gl.frames);
// 회전(크기 변경)
await p.setViewportSize({width:375,height:812});await p.waitForTimeout(1200);await shot(`shot-${mode}-rotated.png`);await p.setViewportSize({width:812,height:375});await p.waitForTimeout(1200);
const g3=await p.evaluate(()=>window.__gl.frames);
await shot(`shot-${mode}-rotback.png`);
await p.evaluate(()=>closePanel());const c0=await p.evaluate(()=>({f:window.__gl.frames,t:performance.now()}));await p.waitForTimeout(3000);const c1=await p.evaluate(()=>({f:window.__gl.frames,t:performance.now()}));
console.log(JSON.stringify({mode,zone,secs:+((g1.t-g0.t)/1000).toFixed(2),timeMoved:+(g1.time-g0.time).toFixed(4),worldFrames:g1.frames-g0.frames,glDrawCalls:g1.calls-g0.calls,afterInputFrames:g2-g2a,afterRotateFrames:g3-g2,closedFps:+((c1.f-c0.f)/((c1.t-c0.t)/1000)).toFixed(2),r1249:g1.r?.stats}));
await b.close();
