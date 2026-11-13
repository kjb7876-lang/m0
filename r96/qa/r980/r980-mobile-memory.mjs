// R980 모바일 무한생존 메모리 예산 검사 (헤드리스 모바일 뷰포트 에뮬레이션 — 실기기·GPU 검증 아님).
//  사용자 2026-11-13 "모바일로 무한생존모드 슬레이어로 플레이하던중 갑자기 꺼지는 문제".
//  R980 전 측정(844×390, DPR2, 슬레이어): 렌더러 프로세스 시작 약 1.2GB → 15분 약 1.65GB. 살아 있는 캔버스 픽셀 2700게임초 약 410MB,
//   효과음 디코딩 캐시 상한 없음(900게임초 51MB, 계속 증가). 이 검사는 빠른 감기로 여러 지역을 돌며 모바일 예산 안에 머무는지 본다.
//   소리를 실제로 디코딩하도록 autoplay 정책을 풀고 unlockAudio 를 부른다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · GAME(게임 초, 기본 600) · HERO(기본 slayer) · OUT(json)
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',HERO=E.HERO||'slayer',GAME=+E.GAME||600,EVERY=+E.EVERY||60;
const CANVAS_MB=+E.CANVAS_MB||230,AUDIO_MB=+E.AUDIO_MB||28;
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const initScript=()=>{const W=window.__R980QA={canv:[],nan:0,nanAt:[]};
 const oc=Document.prototype.createElement;Document.prototype.createElement=function(t,...a){const el=oc.call(this,t,...a);if(String(t).toLowerCase()==='canvas')W.canv.push(new WeakRef(el));return el;};
 for(const k of ['drawImage','fillRect','arc','moveTo','lineTo','translate','ellipse']){const f=CanvasRenderingContext2D.prototype[k];CanvasRenderingContext2D.prototype[k]=function(...a){for(const v of a)if(typeof v==='number'&&!Number.isFinite(v)){W.nan++;if(W.nanAt.length<5)W.nanAt.push(k+' '+String(new Error().stack).split('\n')[2]);break;}return f.apply(this,a);};}};
// 1) 데스크톱(마우스) 경계값: 예산이 원래 값 그대로여야 한다(데스크톱 동작 불변).
{const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 const r=await p.evaluate(()=>{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;if(!M)return null;return {mobile:M.mobile(),px:M.px('r163-tint',Infinity),px2:M.px('r106-tint',123),audioMB:M.audioBudgetMB()};});
 ok('desktop: R980 API present and inactive (budgets pass through unchanged)',!!r&&r.mobile===false&&r.px===Infinity&&r.px2===123&&r.audioMB===Infinity,r);
 await ctx.close();}
// 2) 모바일: 무한생존 슬레이어 장시간.
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(initScript);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');
const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
const api=await A(()=>{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;return M?{mobile:M.mobile(),px:M.px('r163-tint',Infinity),px2:M.px('r106-tint',Infinity),audioMB:M.audioBudgetMB()}:null;});
ok('mobile: R980 API present, active, finite budgets',!!api&&api.mobile===true&&Number.isFinite(api.px)&&Number.isFinite(api.px2)&&Number.isFinite(api.audioMB),api);
await p.mouse.click(5,5).catch(()=>{});await A(()=>{try{unlockAudio();}catch(_){}});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
const rows=[];
async function sample(tag){const au=await A(async()=>{let n=0,by=0;for(const [,pr] of buffers){const a=await Promise.race([pr,new Promise(r=>setTimeout(()=>r(null),30))]);if(!a)continue;n++;by+=a.length*a.numberOfChannels*4;}return {n,MB:+(by/1e6).toFixed(1),unlocked:audioUnlocked,played:audioStats.played,failed:audioStats.failed};});
 await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');
 const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
 const s=await A(()=>{const W=window.__R980QA;let px=0,n=0;for(const r of W.canv){const c=r.deref();if(c){n++;px+=(c.width|0)*(c.height|0);}}
  let ip=0,inn=0;for(const [,row] of imageCache){const im=row&&row.ready&&row.image;if(im){inn++;ip+=(im.naturalWidth||0)*(im.naturalHeight||0);}}
  const hp=heroPaths(player.hero).filter(Boolean),heroMissing=hp.filter(x=>!readyImage(x)).length;
  const Z=window.__STORYWORLD_SURVIVAL_R600__.state();
  return {t:+time.toFixed(0),stage:Z.i,canvN:n,canvasMB:Math.round(px*4/1e6),images:inn,imageMB:Math.round(ip*4/1e6),heroMissing,heroPaths:hp.length,tinted163:window.__STORYWORLD_PIXELFX_R163__.inspect().stats.tinted||0,builds106:window.__STORYWORLD_FX_SPRITES_R106__.inspect().builds||0,trim:window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.().stats||null,nan:W.nan,nanAt:W.nanAt};});
 const row={tag,audio:au,heapMB:+(m.JSHeapUsedSize/1e6).toFixed(1),...s};rows.push(row);console.log(JSON.stringify(row));}
await sample('start');const t0=await A(()=>time);let next=EVERY;const W0=Date.now();
while(true){
 const r=await A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T=performance.now();const tb=time;
  while(performance.now()-T<300){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}return 'modal';}if(loading)return 'loading';
   player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();
   const en=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);let best=null,bd=1e9;for(const e of en){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
   if(best&&bd>1.3){const s=Math.min(bd-1.2,4.5/30),nx=player.x+(best.x-player.x)/bd*s,ny=player.y+(best.y-player.y)/bd*s;if(!blocked(nx,ny,.3,room)){player.x=nx;player.y=ny;}}
   tick(1/30);}
  return time===tb?'frozen':'ok';});
 await p.waitForTimeout(r==='ok'?60:200);
 const t=await A(()=>time)-t0;if(t>=next){await sample('t'+Math.round(t));next+=EVERY;}if(t>=GAME)break;
 if(Date.now()-W0>1500e3){ok('run finished within 25 wall minutes',false,{t});break;}}
const ins=await A(()=>window.__STORYWORLD_SURVIVAL_R600__.inspect().stats);
if(E.OUT)fs.writeFileSync(E.OUT,JSON.stringify({rows,errs,ins},null,1));
const warm=rows.filter(r=>r.t>=120);
const cMax=Math.max(...warm.map(r=>r.canvasMB));const last0=()=>rows[rows.length-1];
ok(`mobile: live canvas pixels stay within ${CANVAS_MB}MB after warm-up (peak)`,cMax<=CANVAS_MB,{peak:cMax,series:warm.map(r=>r.canvasMB)});
const aMax=Math.max(...rows.map(r=>r.audio.MB));
ok('audio really decodes in this run (unlocked, ≥ 60 sounds played)',last0().audio.unlocked===true&&last0().audio.played>=60,last0().audio);
ok(`mobile: decoded sound cache stays within ${AUDIO_MB}MB (peak over the run)`,aMax<=AUDIO_MB,{peak:aMax,series:rows.map(r=>r.audio.MB)});
ok('sounds still play after trimming (played keeps rising in the last third, decode failures ≤ 2)',last0().audio.played>rows[Math.floor(rows.length*2/3)].audio.played&&last0().audio.failed<=2,{mid:rows[Math.floor(rows.length*2/3)].audio,last:last0().audio});
ok('mobile: current hero sprites never evicted (all heroPaths ready at every sample)',rows.every(r=>r.heroMissing===0),rows.map(r=>r.heroMissing));
const last=rows[rows.length-1];
ok('no tint-cache thrash: R163 tinted sheet builds ≤ 160 and R106 tint builds ≤ 900 over the run',last.tinted163<=160&&last.builds106<=900,{tinted163:last.tinted163,builds106:last.builds106});
ok('survival keeps advancing (≥ 6 stages) with no survival errors',last.stage>=6&&ins.errors===0,{stage:last.stage,errors:ins.errors});
ok('no NaN/Infinity reaches 2D draw calls',last.nan===0,last.nanAt);
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
