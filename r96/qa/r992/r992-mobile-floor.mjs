// R992 모바일 무한생존 메모리 바닥값 검사 (헤드리스 모바일 뷰포트 에뮬레이션 — 실기기·GPU 검증 아님).
//  R980(#551) 뒤 30분 측정: Blink 내부 partition_alloc(그림 원본 바이트 등) 129→457MB, malloc(캔버스 포함) 78→365MB, v8 111→188MB.
//  partition 은 지역을 불러올 때마다 뛴다(출처 미상 — 그림 캐시 382장을 강제로 비워도 13MB 만 줄어 그림 원본 바이트는 아님).
//  JS 힙은 R61 포탈 계산이 지나간 지역마다 방 전체를 Map(otherRooms)에 보관해 늘었다.
//  이 검사는 빠른 감기로 GAME 게임 초를 돈 뒤 렌더러의 '버릴 수 없는' 메모리(partition+malloc+v8+blink_gc, Chrome 메모리 덤프)와
//  안 쓰는 그림·지난 방 보관 수를 본다. 디코딩 그림 캐시(cc/image_memory, discardable)는 브라우저가 스스로 묶으므로 따로 적기만 한다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/) · GAME(기본 900) · FLOOR_MB(기본 760) · OUT(json)
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',HERO=E.HERO||'slayer',GAME=+E.GAME||900,FLOOR_MB=+E.FLOOR_MB||760;
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const bc=await b.newBrowserCDPSession();
async function dump(){const evs=[];const h=d=>evs.push(...d.value);bc.on('Tracing.dataCollected',h);
 await bc.send('Tracing.start',{traceConfig:{includedCategories:['disabled-by-default-memory-infra'],memoryDumpConfig:{triggers:[]}},transferMode:'ReportEvents'});
 await bc.send('Tracing.requestMemoryDump',{deterministic:true,levelOfDetail:'detailed'});const done=new Promise(r=>bc.once('Tracing.tracingComplete',r));await bc.send('Tracing.end');await done;bc.off('Tracing.dataCollected',h);
 let out=null;for(const e of evs){const A=e.ph==='v'&&e.args?.dumps?.allocators;if(!A||!(A['canvas']||A['blink_gc']))continue;const g=k=>A[k]?.attrs?.size?Math.round(parseInt(A[k].attrs.size.value,16)/1e6):0;
  const r={partition:g('partition_alloc/partitions'),buffer:g('partition_alloc/partitions/buffer'),malloc:g('malloc'),canvas:g('canvas'),v8:g('v8'),gc:g('blink_gc'),imageDecodeDiscardable:g('cc/image_memory'),web:g('web_cache')};r.floor=r.partition+r.malloc+r.v8+r.gc;if(!out||r.floor>out.floor)out=r;}return out;}
// 데스크톱 경계: R992 기능 꺼짐
{const ctx=await b.newContext({viewport:{width:1280,height:720}});const p=await ctx.newPage();await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
 const r=await p.evaluate(()=>{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;return M?{active:M.active(),r992:typeof M.roomsCleared==='function',hook:typeof window.__STORYWORLD_R61_OTHER_ROOMS__?.size==='function'}:null;});
 ok('desktop: overlay present, inactive; R992 API and R61 otherRooms hook exist',!!r&&r.active===false&&r.r992&&r.hook,r);await ctx.close();}
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{const D=window.__R992QA={drawn:new WeakSet(),protos:new WeakSet()};D.patch=proto=>{if(!proto||D.protos.has(proto)||typeof proto.drawImage!=='function')return;D.protos.add(proto);const o=proto.drawImage;proto.drawImage=function(im){if(im&&typeof im==='object')D.drawn.add(im);return o.apply(this,arguments);};};D.patch(CanvasRenderingContext2D.prototype);});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e).slice(0,300)));p.on('crash',()=>errs.push('PAGE CRASH'));
const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.mouse.click(5,5).catch(()=>{});await A(()=>{try{unlockAudio();}catch(_){}});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${HERO}"]`).click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await A(()=>window.__R992QA.patch(Object.getPrototypeOf(ctx)));
const t0=await A(()=>time);const W0=Date.now();let missRows=[];
while(true){
 await A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const T=performance.now();
  while(performance.now()-T<300){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}return;}if(loading)return;
   player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();
   const en=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);let best=null,bd=1e9;for(const e of en){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
   if(best&&bd>1.3){const s=Math.min(bd-1.2,4.5/30),nx=player.x+(best.x-player.x)/bd*s,ny=player.y+(best.y-player.y)/bd*s;if(!blocked(nx,ny,.3,room)){player.x=nx;player.y=ny;}}
   tick(1/30);}});
 await p.waitForTimeout(60);const t=await A(()=>time)-t0;if(t>=GAME)break;if(Date.now()-W0>1500e3){ok('run finished within 25 wall minutes',false,{t});break;}}
await A(()=>new Promise(r=>setTimeout(r,4000)));/* 정리 주기 한 번 */
const cdp=await ctx.newCDPSession(p);await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');
const st=await A(()=>{const keep=new Set([...regionById[zone].paths,...(window.__STORYWORLD_WORLD_R74__?.assetPaths(zone,layer)||[]),...heroPaths(player.hero),...Object.values(VFX),...Object.values(PROPS),...Object.keys(HEROES).map(id=>heroArt[id].idle.front)]);
 let n=0,mb=0,idleN=0,idleMB=0;const now=performance.now();for(const [k,row] of imageCache){if(!row?.ready||!row.image)continue;const im=row.image,m=((im.naturalWidth||im.width||0)*(im.naturalHeight||im.height||0))*4/1e6;n++;mb+=m;if(!keep.has(k)&&!window.__R992QA.drawn.has(im)){idleN++;idleMB+=m;}}
 const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;const Z=window.__STORYWORLD_SURVIVAL_R600__;
 return {stage:Z.state().i,errors:Z.inspect().stats.errors,images:n,imageMB:Math.round(mb),idleN,idleMB:Math.round(idleMB),otherRooms:window.__STORYWORLD_R61_OTHER_ROOMS__?.size?.()??null,heroMissing:heroPaths(player.hero).filter(Boolean).filter(x=>!readyImage(x)).length,r980:M?.inspect?.().stats||null,played:audioStats.played};});
const mem=await dump();
console.log(JSON.stringify({st,mem}));if(E.OUT)fs.writeFileSync(E.OUT,JSON.stringify({st,mem,errs},null,1));
ok(`mobile: renderer non-discardable memory (partition+malloc+v8+blink_gc) ≤ ${FLOOR_MB}MB after ${GAME} game s`,mem&&mem.floor<=FLOOR_MB,mem);
ok('mobile: JS heap (v8) ≤ 140MB after the run (R992 전 15분 162MB — R61 지난 방 보관)',mem&&mem.v8<=140,{v8:mem?.v8,never_drawn_images:{n:st.idleN,MB:st.idleMB}});
ok('mobile: R61 portal room cache does not keep past survival stages (≤ 2 rooms)',st.otherRooms!==null&&st.otherRooms<=2,{otherRooms:st.otherRooms});
ok('mobile: current hero sprites present',st.heroMissing===0,st.heroMissing);
ok('regression: survival keeps advancing (≥ 8 stages), no survival errors, sounds still play',st.stage>=8&&st.errors===0&&st.played>=60,{stage:st.stage,errors:st.errors,played:st.played});
ok('no page errors / crash',errs.length===0,errs.slice(0,5));
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);
