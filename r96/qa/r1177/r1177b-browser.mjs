// R1177b S-06 상대 초인·지휘 개체 Dots 동작 시트, 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] node r96/qa/r1177/r1177b-browser.mjs
//  S-06 에서 몹 셋을 상대 초인·지휘 개체·침공병으로 보이게 한 뒤(판정 그대로) 걷기 → 피격(번쩍임) → 공격 → 사망을 차례로 만들고
//  그 순간 R161 이 실제로 읽는(readyImage) 시트 경로를 본다. 페이지 오류 0, R161 오류 0.
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{window.__B={paths:new Set()};const base=readyImage;readyImage=function(q,...a){if(typeof q==='string')__B.paths.add(q);return base.call(this,q,...a);};});
await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-23'});});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,50);f();}),s);
const picked=await p.evaluate(()=>{player.invincible=1e9;const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!/조각/.test(e.name||''));const nm=['상대 초인','지휘 개체','외계 침공군'];
 window.__M=L.slice(0,3);__M.forEach((e,i)=>{e.name=nm[i];delete e.r200Shade;e.r200Checked=true;e.x=player.x+1.8*(i-1);e.y=player.y-1.3;e.speed=0;e.damage=0;});return __M.map(e=>e.name);});
ok(picked.length===3,'S-06 몹 셋',picked);
const seen=async(fn,s)=>{await p.evaluate(()=>__B.paths.clear());if(fn)await p.evaluate(fn);await waitGame(s);return p.evaluate(()=>[...__B.paths].filter(q=>/assets\/r1177\/s06-/.test(q)));};
// 사몽 여러 덧씌우기가 몹을 계속 움직이므로 상태는 tick 마다 다시 넣는다
await p.evaluate(()=>{window.__F=null;const base=tick;tick=function(...a){const r=base.apply(this,a);try{__F&&__F();}catch(_){}return r;};});
let s=await seen(null,.4);ok(s.includes('assets/r1177/s06-rival-dots-walk-right-8.webp')&&s.includes('assets/r1177/s06-commander-dots-walk-right-8.webp')&&s.includes('assets/r1177/s06-invader-walk-right-8.webp'),'걷기: 상대 초인·지휘 개체 Dots 걷기, 침공병 R1177',s);
if(SHOT)await p.screenshot({path:`${SHOT}/r1177b-walk.png`});
s=await seen(()=>{const [r,c]=__M;r.flash=0;c.flash=0;window.__F=()=>{};setTimeout(()=>{r.flash=.25;c.flash=.25;},0);},.12);
ok(s.includes('assets/r1177/s06-rival-dots-hit-4.webp')&&s.includes('assets/r1177/s06-commander-dots-hit-4.webp'),'피격: 두 시트 읽음',s);
if(SHOT)await p.screenshot({path:`${SHOT}/r1177b-hit.png`});
s=await seen(()=>{const [r,c]=__M;const t0=time;window.__F=()=>{for(const e of [r,c]){e.flash=0;e.attack={id:'b'+Math.floor(t0),elapsed:Math.min(.94,(time-t0)*.6),angle:0,shape154:{windup:.45,active:.15,recovery:.35}};}};},.5);
ok(s.includes('assets/r1177/s06-rival-dots-attack-8.webp')&&s.includes('assets/r1177/s06-commander-dots-attack-8.webp'),'공격: 두 시트 읽음',s);
if(SHOT)await p.screenshot({path:`${SHOT}/r1177b-attack.png`});
s=await seen(()=>{const [r]=__M;window.__F=null;r.attack=null;r.hp=0;r.deadAt=time;r.spawnState='dead';},.3);
ok(s.includes('assets/r1177/s06-rival-dots-death-8.webp'),'사망: 상대 초인 잿빛 사망 시트 읽음',s);
if(SHOT)await p.screenshot({path:`${SHOT}/r1177b-death.png`});
const ins=await p.evaluate(()=>{const R=window.__STORYWORLD_SAMONG_R161__;return R.inspect?R.inspect():null;});
ok(!ins||!(ins.stats?.errors>0),'R161 오류 0',ins&&{stats:ins.stats,lastError:ins.lastError});
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`R1177b browser ${n-bad}/${n}`);process.exit(bad?1:0);
