// R1301 헤드리스 측정: 777 → 지역(Z, 기본 kair02) 길잡이 켬, SECS 초 동안 영웅 출발 findPath 실패·5ms 넘는 탐색·R979 통계.
//  URL=http://127.0.0.1:4410/m0/ SECS=90 Z=kair02 node r96/qa/r1301/r1301-browser-probe.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const Z=process.env.Z||'kair02',GUIDE=process.env.GUIDE!=='0';
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:{width:640,height:360}});const p=await c.newPage();
await p.goto(''+(process.env.URL||'http://127.0.0.1:4410/m0/')+'');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async(z)=>{await window.__STORYWORLD_CHEAT777__.go(z,'STORY');},Z).catch(()=>{});
await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}}).catch(()=>{});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
await p.evaluate((g)=>{player.invincible=1e9;auto=true;guide=g;
 const S=window.__FP={n:0,fail:0,ms:0,goals:{}};const base=findPath;findPath=function(a,b,...r){const t=performance.now();const o=base.call(this,a,b,...r);S.ms+=performance.now()-t;S.n++;if(!o||!o.length){S.fail++;S.log=S.log||[];const rad=r[1]??.29;if(S.log.length<30&&performance.now()-t>5)S.log.push({ms:+(performance.now()-t).toFixed(1),t:+time.toFixed(2),to:[+b.x.toFixed(2),+b.y.toFixed(2)],rad,blkTo:blocked(b.x,b.y,rad,room),blkFrom:blocked(a.x,a.y,rad,room),eng:!!room.engaged,gen:window.__STORYWORLD_WORLD_R74__?.generation?.()});const k=Math.round(b?.x)+','+Math.round(b?.y);S.goals[k]=(S.goals[k]||0)+1;}return o;};},GUIDE);
const t0=await p.evaluate(()=>time);await p.waitForTimeout(+(process.env.SECS||30)*1000);
const r=await p.evaluate(()=>({...__FP,log:__FP.log,r979:window.__STORYWORLD_PERF_R979__.inspect().stats,obj:room.objective,goals:Object.entries(__FP.goals).sort((a,b)=>b[1]-a[1]).slice(0,5),gt:time,px:[player.x.toFixed(1),player.y.toFixed(1)],alive:room.enemies.filter(e=>e.hp>0).length,lr217:window.__STORYWORLD_LAG_R217__?.inspect?.().stats}));
console.log(Z,'guide',GUIDE,JSON.stringify({...r,gameSec:(r.gt-t0).toFixed(1)}));await b.close();
