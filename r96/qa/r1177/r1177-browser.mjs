// R1177 사몽 에피소드 픽셀 잔존 → 칠한 그림, 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] node r96/qa/r1177/r1177-browser.mjs
//  ① S-06·RA 에피소드 구역에서 도트 시트(r163 pixelfx 기억 조각 파괴·손·균열 문·나방·열린 끝의 문, r184 S-06 픽셀 몹)를 읽지 않고 r1177 칠한 시트를 읽는다
//  ② R161 S-06 표: 상대 초인·지휘 개체·침공병 → assets/r1177  ③ 본편으로 나오면 pixelfx 표가 원래대로  ④ 페이지 오류 0, R1177 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{window.__R1177={paths:new Set()};const base=readyImage;readyImage=function(q,...a){if(typeof q==='string')__R1177.paths.add(q);return base.call(this,q,...a);};});
const before=await p.evaluate(K=>{const meta=window.__STORYWORLD_PIXELFX_R163__.meta();return Object.fromEntries(K.map(k=>[k,meta[k]?.file]));},['pvfx-void-implosion','hands-blood','pvfx-rift-portal','pvfx-choir-moths','portal-teal','meteor','dark-explosion-blood','tendrils-blood','collect-burst']);
const go=async(key,zone)=>{await p.evaluate(async([key,zone])=>{const SM=__STORYWORLD_SAMONG_R103__,i=SM.episodes.findIndex(e=>e.key===key);await SM.go(i,null,{zone});},[key,zone]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();};
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,50);f();}),s);
const KEYS=['pvfx-void-implosion','hands-blood','pvfx-rift-portal','pvfx-choir-moths','portal-teal','meteor','dark-explosion-blood','tendrils-blood','collect-burst'];
for(const [key,zone] of [['S-06','sz115-S06-23'],['RA','sz115-RA-5']]){
 await go(key,zone);await p.evaluate(()=>{__R1177.paths.clear();player.invincible=1e9;});
 const st=await p.evaluate(K=>{const X=window.__STORYWORLD_PIXELFX_R163__,o={};for(const k of K){try{X.play(k,player.x+1,player.y,{k:.8});}catch(e){o[k]='ERR '+e;}}return o;},KEYS);
 // 사몽 몹 두 마리를 상대 초인·지휘 개체로 보이게(그림 확인용; 판정은 그대로) — S-06 에서만
 if(key==='S-06')await p.evaluate(()=>{const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!/조각/.test(e.name||''));const nm=['상대 초인','지휘 개체','외계 침공군'];
  L.slice(0,3).forEach((e,i)=>{e.name=nm[i];delete e.r200Shade;e.r200Checked=true;e.x=player.x+1.6*(i-1);e.y=player.y-1.4;e.speed=0;});});
 await waitGame(1.0);
 const r=await p.evaluate(K=>{const meta=window.__STORYWORLD_PIXELFX_R163__.meta(),A=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__,B=window.__STORYWORLD_SAMONG_P_ART_R976__,P=[...__R1177.paths].map(q=>A?.resolve(q)||B?.resolve(q)||q);/* 별칭(r163/pixelfx/r1177·r976/…)은 실제 읽는 경로로 */return {zone:room.samongR103?.zone,
   pixel:P.filter(q=>/r163\/pixelfx\/(pvfx-void|hands-blood|pvfx-rift|pvfx-choir|portal-teal|meteor|dark-explosion|tendrils|collect-burst)|assets\/r184\//.test(q)),
   r1177:P.filter(q=>/assets\/r1177\//.test(q)),files:Object.fromEntries(K.map(k=>[k,meta[k]?.file])),
   insp:window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__.inspect()};},KEYS);
 ok(r.pixel.length===0,key+' '+zone+': no pixel sheets requested',r.pixel);
 ok(r.r1177.some(q=>/void-implosion-blood/.test(q))&&r.r1177.some(q=>/hands-blood/.test(q)),key+': painted r1177 sheets requested',r.r1177);
 ok(KEYS.every(k=>/^r1177\/|^r976\//.test(r.files[k]||'')||(before[k]||'').includes('/')&&r.files[k]===before[k]),key+': pixel pixelfx rows are r1177/r976 aliases (rows another overlay already painted stay)',{now:r.files,before});
 ok(r.insp.stats.errors===0,key+': R1177 no errors',r.insp);
 if(SHOT)await p.screenshot({path:`${SHOT}/r1177-${key}.png`});
}
const sh=await p.evaluate(async()=>{await (async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-1'});})();return 0;});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
const t=await p.evaluate(()=>{const R=window.__STORYWORLD_SAMONG_R161__;return [R.sheetFor({name:'상대 초인'}),R.sheetFor({name:'지휘 개체 7'}),R.sheetFor({name:'외계 침공군'}),R.S06ART];});
ok(/assets\/r1177\/s06-rival/.test(t[0])&&/assets\/r1177\/s06-commander/.test(t[1])&&/assets\/r1177\/s06-invader/.test(t[2]),'R161 S-06 sheets are r1177 painted sheets',t);
await p.evaluate(async()=>{await enterRegion('dist05',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.3);
const back=await p.evaluate(K=>{const meta=window.__STORYWORLD_PIXELFX_R163__.meta();return Object.fromEntries(K.map(k=>[k,meta[k]?.file]));},KEYS);
ok(KEYS.every(k=>back[k]===before[k]),'story dist05: pixelfx table back to the rows it had before the episode',{back,before});
ok(errs.length===0,'page errors 0',errs.slice(0,4));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
