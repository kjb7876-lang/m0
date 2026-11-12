// R851 헤드리스(3D 켬) 실측: 잠들지 못하는 마을 → 한약과 불면귀로 들어갈 때 픽셀 되읽기가 GPU 캔버스에서 일어나는지(그래픽 스레드 동기화 = 멈춤).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r851/r851-entry-browser.mjs   (CI 아님, 헤드리스 시간 값은 참고만)
import {createRequire} from 'node:module';import assert from 'node:assert';
const req=createRequire(import.meta.url);let pw;try{pw=req('playwright');}catch(_){pw=createRequire('/opt/node22/lib/node_modules/')('playwright');}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await pw.chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:960,height:540}});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:true}));
 const R=window.__R850={sync:[],cpu:0};const gid=CanvasRenderingContext2D.prototype.getImageData;
 CanvasRenderingContext2D.prototype.getImageData=function(...a){const wr=!!this.getContextAttributes?.().willReadFrequently;if(wr)R.cpu++;else{const t=performance.now();const r=gid.apply(this,a);const st=(new Error().stack.split('\n')[2]||'').trim().replace(/^at /,'').replace(/https?:\/\/[^/]+\/m0\//,'');R.sync.push({at:st.slice(0,90),ms:+(performance.now()-t).toFixed(1),room:window.room?.id});return r;}return gid.apply(this,a);};});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click({timeout:180000});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const out={};
for(const z of ['last302','last303']){await p.evaluate(()=>{window.__R850.sync.length=0;window.__R850.max=0;const tb=window.tick;if(!tb.__r851){const w=function(...a){const t=performance.now();const r=tb.apply(this,a);window.__R850.max=Math.max(window.__R850.max,performance.now()-t);return r;};w.__r851=1;window.tick=w;}});
 await p.evaluate(z=>enterRegion(z,null,{layer:'STORY',restore:true}),z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:150000});
 const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+2,t0,{timeout:180000,polling:100});
 out[z]=await p.evaluate(()=>({sync:window.__R850.sync,maxTick:Math.round(window.__R850.max)}));
 const cave=out[z].sync.filter(s=>/cave-r204|edges-r188/.test(s.at));console.log(z,'GPU 동기 되읽기',out[z].sync.length,'곳, 최장 tick',out[z].maxTick,'ms', JSON.stringify(out[z].sync.slice(0,8)));
 ok(cave.length===0,`${z}: 바닥 장식판(cave-r204)·가장자리 가림판(edges-r188)이 GPU 캔버스를 되읽지 않음 (지금 ${cave.length}회 ${cave.map(s=>s.ms+'ms').join(',')})`);}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));
console.log('R851 진입 헤드리스 검사 통과: '+n+'개');await b.close();
