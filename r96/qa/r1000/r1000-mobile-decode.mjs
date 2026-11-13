// R1000 모바일: 미리 읽은 그림을 억지로 해독(img.decode())하지 않기 (헤드리스 Chromium 모바일 뷰포트 — 아이폰·사파리 검증 아님).
//  엔진 addImage 는 그림을 받을 때마다 im.decode() 로 픽셀까지 풀어 둔다. 생존 15단계 측정에서 엔진 캐시 그림 중
//  한 번도 그려지지 않은 그림이 165장(해독 크기 약 210MB)이었다. 크롬은 해독 메모리를 스스로 약 530MB 로 묶어 차이가 안 보이지만,
//  아이폰 사파리(WebKit)는 decode() 로 푼 픽셀을 메모리가 모자랄 때까지 들고 있을 수 있다(사용자 기기 아이폰 13 미니, 첫 보스 즈음 꺼짐).
//  모바일에서는 decode() 가 '받기 끝'만 기다리고 픽셀은 처음 그릴 때 풀리게 한다. 이 검사는 그 연결과 회귀(그림 빠짐·끊김·오류)를 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
// 데스크톱: decode 는 원래 것 그대로
{const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 const r=await p.evaluate(()=>({native:/\[native code\]/.test(String(HTMLImageElement.prototype.decode)),skipped:window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.().stats?.decodeSkipped??null}));
 ok('desktop: HTMLImageElement.decode untouched',r.native===true&&!r.skipped,r);await ctx.close();}
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
const title=await p.evaluate(()=>({skipped:window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.().stats?.decodeSkipped??0,native:/\[native code\]/.test(String(HTMLImageElement.prototype.decode)),failed:[...imageCache.values()].filter(r=>r.error).length,ready:[...imageCache.values()].filter(r=>r.ready).length}));
ok('mobile: engine image loads no longer force decode (decode() waits for load only)',title.skipped>=50&&title.native===false,title);
ok('mobile: title images still become ready, none failed',title.ready>=200&&title.failed===0,title);
await p.mouse.click(5,5).catch(()=>{});await p.evaluate(()=>{try{unlockAudio();}catch(_){}});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
const t0=await p.evaluate(()=>time);let worst=0;
for(;;){const r=await p.evaluate(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;let w=0;const T=performance.now();while(performance.now()-T<300){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();if(st.phase==='pre'&&time>40&&!window.__QB){window.__QB=1;room.enemies.filter(e=>!e.boss&&!e.r600Boss).forEach(e=>e.hp=0);}const a=performance.now();tick(1/30);w=Math.max(w,performance.now()-a);}return {w,t:time};});
 worst=Math.max(worst,r.w);if(r.t-t0>120)break;}
const st=await p.evaluate(()=>({heroMissing:heroPaths(player.hero).filter(Boolean).filter(x=>!readyImage(x)).length,bosses:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.bosses,errors:window.__STORYWORLD_SURVIVAL_R600__.inspect().stats.errors}));
ok('mobile: hero sprites present, first boss reached, no survival errors',st.heroMissing===0&&st.bosses>=1&&st.errors===0,st);
ok('mobile: no long first-draw hitch (worst tick ≤ 600ms headless; R992 기준 약 420ms)',worst<=600,{worstMs:Math.round(worst)});
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
