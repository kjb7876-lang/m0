// R992 모바일 무한생존: 지역(단계)을 바꿀 때마다 쌓이는 메모리 검사 (헤드리스 모바일 뷰포트 — 실기기·GPU 검증 아님).
//  원인(2026-11-13 측정): 엔진 releaseImageMemory 가 지역에 들어갈 때마다 그림 캐시를 비우고, 오버레이들이 같은 그림을 곧바로 다시 받는다
//  (3지역에 361종 1360번). 다시 받을 때마다 Blink buffer 영역(그림 원본 바이트 등)이 늘고 줄지 않아 지역 8곳에 212→340MB.
//  지면 캐시(groundCache3, 지역 그림 크기 캔버스 6장 약 41MB)와 R409 외곽선 캐시(약 28MB)도 지난 지역 것을 들고 있다.
//  qaGo 로 지역을 5번 바꾸며 (그림을 다시 받은 수, buffer 증가, 지면 캐시 수, 캔버스 메모리)를 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · HERO(기본 slayer)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',HERO=E.HERO||'slayer';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const bc=await b.newBrowserCDPSession();
async function dump(){const evs=[];const h=d=>evs.push(...d.value);bc.on('Tracing.dataCollected',h);
 await bc.send('Tracing.start',{traceConfig:{includedCategories:['disabled-by-default-memory-infra'],memoryDumpConfig:{triggers:[]}},transferMode:'ReportEvents'});
 await bc.send('Tracing.requestMemoryDump',{deterministic:true,levelOfDetail:'detailed'});const done=new Promise(r=>bc.once('Tracing.tracingComplete',r));await bc.send('Tracing.end');await done;bc.off('Tracing.dataCollected',h);
 for(const e of evs){const A=e.ph==='v'&&e.args?.dumps?.allocators;if(!A||!A['blink_gc'])continue;const g=k=>A[k]?.attrs?.size?Math.round(parseInt(A[k].attrs.size.value,16)/1e6):0;return {buffer:g('partition_alloc/partitions/buffer'),canvas:g('canvas'),malloc:g('malloc'),v8:g('v8')};}return null;}
// 데스크톱 경계: 엔진 그림 캐시 비우기는 그대로
{const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 const r=await p.evaluate(()=>{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;return {active:M?.active?.(),skipped:M?.inspect?.().stats.releaseSkipped};});
 ok('desktop: overlay inactive (engine image release untouched)',r.active===false,r);await ctx.close();}
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
// 같은 주소의 그림을 '새 그림 객체'로 다시 받는 횟수(엔진 addImage 등). 같은 <img> 에 같은 주소를 다시 넣는 HUD 아이콘 갱신은 세지 않는다.
await ctx.addInitScript(()=>{const seen=new Map();const Q=window.__R992C={re:0,on:false};const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:true,get(){return d.get.call(this);},set(v){try{const u=String(v);if(!/^(data|blob):/.test(u)){const els=seen.get(u)||new WeakSet();if(!seen.has(u))seen.set(u,els);else if(!els.has(this)&&Q.on)Q.re++;els.add(this);}}catch(_){}d.set.call(this,v);}});});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
const cdp=await ctx.newCDPSession(p);const gc=async()=>{await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');};
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.mouse.click(5,5).catch(()=>{});await p.evaluate(()=>{try{unlockAudio();}catch(_){}});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
const play=sec=>p.evaluate(sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T=performance.now();while(time-t0<sec&&performance.now()-T<20000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();tick(1/30);}},sec);
await ready();await play(3);await p.waitForTimeout(3000);await gc();const m0=await dump();
await p.evaluate(()=>{window.__R992C.on=true;});
for(const i of [1,2,3,4,5]){await p.evaluate(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await p.waitForTimeout(500);await ready();await play(2);await p.waitForTimeout(3000);}
await p.waitForTimeout(2500);/* 정리 주기 */await gc();const m1=await dump();
const st=await p.evaluate(()=>({re:window.__R992C.re,ground:typeof groundCache3!=='undefined'?groundCache3.size:null,id:room?.id,heroMissing:heroPaths(player.hero).filter(Boolean).filter(x=>!readyImage(x)).length,errors:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.errors,r980:window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.()}));
console.log(JSON.stringify({m0,m1,st:{...st,r980:st.r980?.stats}}));
ok('mobile: images re-downloaded over 5 stage changes ≤ 40 (R992 전 약 450번/지역)',st.re<=40,{re:st.re});
ok('mobile: Blink buffer partition growth over 5 stage changes ≤ 75MB (R992 전 약 108MB)',m1.buffer-m0.buffer<=75,{from:m0.buffer,to:m1.buffer});
ok('mobile: ground cache keeps only the current stage (≤ 2, R992 전 6)',st.ground!==null&&st.ground<=2,{ground:st.ground});
ok('mobile: canvas memory after 5 stage changes ≤ 160MB (R992 전 약 185MB)',m1.canvas<=160,{canvas:m1.canvas});
ok('mobile: current hero sprites present, survival without errors, reached stage 5',st.heroMissing===0&&st.errors===0&&/dist05/.test(st.id),{heroMissing:st.heroMissing,errors:st.errors,id:st.id});
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
