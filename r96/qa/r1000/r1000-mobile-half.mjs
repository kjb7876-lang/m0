// R1000 모바일 저해상도 그림(사용자 2026-11-13 결정 카드 "모바일만 저해상도"): 50만 화소 이상 그림을 모바일에서는 절반 해상도 사본으로 그린다.
//  (헤드리스 Chromium 모바일 뷰포트 — 아이폰·사파리 실기기 검증 아님.)
//  큰 그림이 원본 그대로 그리기 함수(브라우저 2D drawImage)에 닿지 않고, 절반 사본(가로·세로 1/2 = 픽셀 1/4)이 대신 그려지는지 본다.
//  사본은 '바뀌지 않는 그림' 표식(__storyworldStaticSource)을 달아 3D 기록기가 매 프레임 복사하지 않게 한다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · SHOT(스크린샷 폴더, 선택)
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',BIG=5e5;
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
// 브라우저 2D drawImage 바로 위(오버레이보다 아래)에서 큰 원본 그림이 닿는 횟수를 센다.
const probe=()=>{const P=CanvasRenderingContext2D.prototype,o=P.drawImage;const Q=window.__R1000Q={big:0,on:false,ex:[]};P.drawImage=function(im){try{if(Q.on&&im instanceof HTMLImageElement&&im.naturalWidth*im.naturalHeight>=5e5){Q.big++;if(Q.ex.length<6)Q.ex.push(String(im.src).replace(/^.*?\/assets\//,''));}}catch(_){}return o.apply(this,arguments);};};
const play=(p,sec)=>p.evaluate(sec=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T=performance.now();while(time-t0<sec&&performance.now()-T<20000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();if(st.phase==='pre'&&time>45&&!window.__QB){window.__QB=1;room.enemies.filter(e=>!e.boss&&!e.r600Boss).forEach(e=>e.hp=0);}tick(1/30);}return time-t0;},sec);
async function survival(p,hero){await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${hero}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});}
// 데스크톱: 그대로
{const ctx=await b.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(probe);const p=await ctx.newPage();await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 await survival(p,'slayer');await p.evaluate(()=>{window.__R1000Q.on=true;});let d=0;while(d<20){d+=await play(p,20-d);await p.waitForTimeout(50);}
 const r=await p.evaluate(()=>({big:window.__R1000Q.big,half:window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.().stats?.halfMade??null}));
 ok('desktop: big images drawn at full resolution, no half copies',r.big>0&&!r.half,r);await ctx.close();}
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});await ctx.addInitScript(probe);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.mouse.click(5,5).catch(()=>{});await p.evaluate(()=>{try{unlockAudio();}catch(_){}});
await survival(p,'slayer');await p.waitForTimeout(2500);await p.evaluate(()=>{window.__R1000Q.on=true;});
const t0=await p.evaluate(()=>time);let shot=0;
for(;;){await play(p,10);await p.waitForTimeout(50);const s=await p.evaluate(()=>({t:time,b:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.bosses}));
 if(E.SHOT&&(s.t-t0>20&&shot===0||s.b>=1&&shot===1)){fs.mkdirSync(E.SHOT,{recursive:true});await p.screenshot({path:`${E.SHOT}/mobile-${shot?'boss':'play'}.png`});shot++;}
 if(s.b>=1&&s.t-t0>90||s.t-t0>200)break;}
const st=await p.evaluate(()=>{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.()||{};return {big:window.__R1000Q.big,ex:window.__R1000Q.ex,s:M.stats||{},peakMB:M.halfPeakMB,budgetMB:M.halfBudgetMB,heroMissing:heroPaths(player.hero).filter(Boolean).filter(x=>!readyImage(x)).length,bosses:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.bosses,errors:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.errors};});
console.log(JSON.stringify(st));
ok('mobile: half-resolution copies made for big images and used for drawing',st.s.halfMade>=5&&st.s.halfDraws>=200,{made:st.s.halfMade,draws:st.s.halfDraws,MB:st.s.halfMB});
ok('mobile: big originals reach the browser 2D drawImage only to make their half copy',st.big<=(st.s.halfMade||0),{bigNative:st.big,made:st.s.halfMade,ex:st.ex});
ok('mobile: half copies held within their budget (≤ 48MB, 첫 구현은 215MB 쌓임)',st.peakMB>0&&st.peakMB<=st.budgetMB+8&&st.budgetMB<=48,{peakMB:st.peakMB,budgetMB:st.budgetMB,evicted:st.s.halfEvicted});
ok('mobile: hero sprites present, first boss reached, no survival or overlay errors',st.heroMissing===0&&st.bosses>=1&&st.errors===0&&!(st.s.errors>0),{heroMissing:st.heroMissing,bosses:st.bosses,errors:st.errors,overlayErrors:st.s.errors});
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
