// R1052 헤드리스 검사(소프트웨어 렌더링 — 실기기 GPU 아님): 성능 7단계 최고 사양 점검.
//  2560×1440 창 PC 에서 무한 생존(몹 모은 뒤) 1→7 단계를 돌며
//   ① 캔버스 화소 예산(6·7단계 ≤ 4K) ② 오류·NaN 없음(게임 30초 + 그리기) ③ 단계 오가기 10회 뒤 힙·캔버스 수 늘지 않음 ④ 단계별 실제 차이(배율·lowFx·빛) 표.
//  SW_URL(기본 http://127.0.0.1:4410/m0/), SW_W/SW_H(기본 2560×1440)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',VW=+(E.SW_W||2560),VH=+(E.SW_H||1440);
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required','--enable-precise-memory-info','--js-flags=--expose-gc']});
const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
const play=(sec,drawEvery)=>p.evaluate(([sec,de])=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const t0=time,T0=performance.now();let i=0,bad=[];
 while(time-t0<sec&&performance.now()-T0<60000){if(modal){const b=document.getElementById('r600Pick0');if(b){b.click();continue;}break;}if(loading)break;player.hp=maxHP();const st=Z.state();if(st.core&&st.core.hp<st.core.stats.max*.5)Z.qaCoreHp(st.core.stats.max*.6);if(Z.narr().playing)Z.skipNarration();
  tick(1/30);if(de&&++i%de===0)draw();
  if(![player.x,player.y,cam.x,cam.y,dpr,canvas.width,canvas.height].every(Number.isFinite))bad.push('hero/cam/dpr');for(const e of room.enemies)if(!Number.isFinite(e.x)||!Number.isFinite(e.y)){bad.push('enemy '+e.name);break;}if(bad.length>3)break;}
 return {gameSec:+(time-t0).toFixed(1),enemies:room.enemies.filter(e=>e.hp>0).length,bad};},[sec,drawEvery]);
await play(25,0);
const look=()=>p.evaluate(()=>{const P=window.__STORYWORLD_PERF7_R1043__.inspect();const on=n=>{try{return window[n]?.prefs?.().on}catch(_){return 'err'}};
 const gl=document.getElementById('phase1-webgl');
 return {step:P.step,dpr,game:[canvas.width,canvas.height],px:canvas.width*canvas.height,gl:gl?[gl.width,gl.height]:null,lowFx:!!settings.lowFx,light:[on('__STORYWORLD_LIGHT_ATMOS_R300__'),on('__STORYWORLD_WEATHER_R450__'),on('__STORYWORLD_LOCAL_LIGHT_R451__'),on('__STORYWORLD_ACTOR_TONE_R453__')].map(v=>v?1:0).join(''),
  errors:P.stats.errors,lastError:P.lastError,canvases:document.querySelectorAll('canvas').length,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null};});
const BUDGET=3840*2160,rows=[];
for(const s of [1,2,3,4,5,6,7]){await p.evaluate(s=>window.__STORYWORLD_PERF7_R1043__.setStep(s),s);await p.waitForTimeout(800);
 const g=await play(3,6);const L=await look();
 const t=await p.evaluate(()=>{const a=[];for(let i=0;i<6;i++){const t0=performance.now();draw();a.push(performance.now()-t0);}a.sort((x,y)=>x-y);return Math.round(a[3]);});
 rows.push({...L,drawMs:t,gameSec:g.gameSec,enemies:g.enemies});
 ok(`step ${s}: no NaN in hero/camera/enemies/dpr after play+draw`,g.bad.length===0,g.bad);
 ok(`step ${s}: perf7 recorded no error`,L.errors===0,L.lastError);
 if(s>=6)ok(`step ${s}: game canvas ≤ 4K pixels at ${VW}×${VH}`,L.px<=BUDGET*1.01,L.game);}
console.log('\n| 단계 | 배율 | 게임 캔버스 | 3D 캔버스 | lowFx | 빛·날씨·조명·맞춤 | draw() ms(헤드리스) |\n|---|---|---|---|---|---|---|');
for(const r of rows)console.log(`| ${r.step} | ${r.dpr} | ${r.game.join('×')} | ${r.gl?.join('×')} | ${r.lowFx?'켬':'끔'} | ${r.light} | ${r.drawMs} |`);
ok('steps differ: 1 < 2 in canvas pixels, 7 > 5',rows[0].px<rows[1].px&&rows[6].px>rows[4].px,rows.map(r=>r.px));
ok('step 7 still sharper than step 5 (dpr > 1)',rows[6].dpr>rows[4].dpr,[rows[4].dpr,rows[6].dpr]);
// 오가기 10회 → 힙·캔버스 수
await p.evaluate(()=>window.gc?.());const h0=await look();
for(let i=0;i<10;i++)for(const s of [7,1,6,2,5])await p.evaluate(s=>window.__STORYWORLD_PERF7_R1043__.setStep(s),s);
await play(3,6);await p.waitForTimeout(800);await p.evaluate(()=>window.gc?.());const h1=await look();
ok('switching 50 times: canvas count unchanged',h1.canvases===h0.canvases,[h0.canvases,h1.canvases]);
ok('switching 50 times: heap grows < 25%',h1.heap<=h0.heap*1.25+5,[h0.heap,h1.heap]);
ok('back at step 5 after switching: same canvas as first step-5 visit',h1.dpr===rows[4].dpr&&h1.game.join()===rows[4].game.join(),[h1.game,rows[4].game]);
// 7단계 긴 플레이(게임 30초, 3틱마다 그리기)
await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(7));const long=await play(30,3);
ok('step 7 long play (30 game s, drawing): no NaN',long.bad.length===0,long);
ok('no page errors',errs.length===0,errs.slice(0,5));
console.log(`\nR1052 browser: ${n-bad}/${n} pass`);await b.close();process.exit(bad?1:0);
