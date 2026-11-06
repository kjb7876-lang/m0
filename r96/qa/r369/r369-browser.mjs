// R369 headless check (Playwright) — 환자와 중독의 도시(ep1a10) 첫 입장 서사 영상: 서사창 뒤에 한 번, 정본 자막, 가짜 HUD 글자 없음, 건너뛰기, 다시 안 나옴.
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=out/r369 node r96/qa/r369/r369-browser.mjs
// Headless Chromium: 판정·호출·화면 구성만 본다. GPU·실기기 모바일·소리는 검증하지 않는다(임시).
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r369';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,300)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const A=p=>p.evaluate(()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect());
async function boot(viewport,init){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const mobile=viewport.width<500;const ctx=await b.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(o=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));for(const [k,v] of Object.entries(o||{}))localStorage.setItem(k,v);}catch(_){}},init||{});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 return {b,p,errors};}
const enter=async p=>{await p.evaluate(()=>{enterRegion('ep1a10',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='ep1a10',null,{timeout:120000});};
const waitT=(p,t)=>p.waitForFunction(t=>{const a=window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect();return a.open&&a.time>=t;},t,{timeout:20000});
async function run(tag,viewport){const {b,p,errors}=await boot(viewport);
 // 다른 장면(R368 배신 영상)이 열린 채 도착 → 그동안 기다렸다가 닫히면 튼다(입장 서사창과 같은 busy 경로).
 await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.play({paused:true}));
 await enter(p);await p.waitForTimeout(1600);
 const s0=await p.evaluate(()=>({story:!!storyScene,r368:window.__STORYWORLD_BETRAYAL_VIDEO_R368__.inspect().open,a:window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect()}));
 check(tag+': 다른 장면(R368)이 열린 동안은 안 나옴',s0.r368&&!s0.a.open&&s0.a.stats.plays===0,{r368:s0.r368,pending:s0.a.pending,open:s0.a.open,w:s0.a.stats.waitedStory});
 await p.evaluate(()=>window.__STORYWORLD_BETRAYAL_VIDEO_R368__.skip());await skip(p);
 await p.waitForFunction(()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect().open,null,{timeout:8000}).catch(()=>{});
 const a1=await A(p);check(tag+': 그 장면이 닫힌 뒤 영상 시작',a1.open&&a1.stats.plays===1,a1.stats);
 const caps=[];for(const t of [1.6,5,8.4]){await waitT(p,t).catch(()=>{});const r=await p.evaluate(()=>{const a=window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect();const v=document.querySelector('#r369v video');
  return {cap:a.caption,time:a.time,chap:document.querySelector('#r369v .chap')?.textContent,bgm:window.__STORYWORLD_POISON_CITY_VIDEO_R369__.bgmGain(),inv:player.invincible,vw:v?.videoWidth,cr:document.querySelector('#r369v .cap')?.getBoundingClientRect().toJSON(),vr:v?.getBoundingClientRect().toJSON()};});
  caps.push(r);await p.screenshot({path:`${OUT}/${tag}-video-${t}.jpg`,quality:72});}
 const C=await p.evaluate(()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.CUES.map(c=>c[2]));
 const kb=await p.evaluate(()=>{let got=0;const probe=()=>got++;addEventListener('keydown',probe,true);const ev=new KeyboardEvent('keydown',{key:'x',bubbles:true,cancelable:true});document.body.dispatchEvent(ev);removeEventListener('keydown',probe,true);return {got,prevented:ev.defaultPrevented};});
 check(tag+': 재생 중 스킬 키 막힘(Codex P2)',kb.got===0&&kb.prevented,kb);
 check(tag+': 자막 3줄이 장면 시점에 정본 문장',caps.every((c,i)=>c.cap===C[i]),caps.map(c=>[c.time?.toFixed(2),c.cap]));
 check(tag+': 장 제목 · 기억',/중독의 도시 · 기억/.test(caps[0].chap||''),caps[0].chap);
 check(tag+': 재생 중 BGM 0·게임 멈춤',caps.every(c=>c.bgm===0)&&caps[0].inv===caps[2].inv,caps.map(c=>c.inv));
 check(tag+': 자막이 화면 안·영상 아래쪽',caps.every(c=>c.cr&&c.cr.bottom<=viewport.height&&c.cr.top>c.vr.top+c.vr.height*.5&&c.cr.width>=Math.min(300,viewport.width*.6)),caps[1].cr);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect().open&&!document.getElementById('r369v'),null,{timeout:5000}).catch(()=>{});
 const a2=await A(p);const inv0=await p.evaluate(()=>player.invincible);await p.waitForTimeout(600);const inv1=await p.evaluate(()=>player.invincible);
 check(tag+': Esc 로 건너뛰고 게임 재개',!a2.open&&a2.stats.skips===1&&a2.prefs.seen&&inv1<inv0,{skips:a2.stats.skips,inv0,inv1});
 await p.evaluate(async()=>{await enterRegion('ep1a09',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);
 await enter(p);await skip(p);await p.waitForTimeout(1500);const a3=await A(p);check(tag+': 다시 들어와도 또 나오지 않음',!a3.open&&a3.stats.plays===1,a3.stats);
 check(tag+': 페이지 오류 없음',!errors.length,errors);await b.close();}
await run('pc',{width:1280,height:720});
await run('mobile',{width:390,height:844});
{const {b,p,errors}=await boot({width:1280,height:720},{'storyworld.r369.poison':JSON.stringify({on:false})});await enter(p);await skip(p);await p.waitForTimeout(1600);
 const a=await A(p);check('off: 끄면 나오지 않음',!a.open&&a.stats.plays===0,a.stats);
 await p.evaluate(()=>window.__STORYWORLD_POISON_CITY_VIDEO_R369__.play());await p.waitForTimeout(500);check('off: API play() 로 다시 보기',(await A(p)).open);
 await p.waitForTimeout(400);await p.mouse.click(640,300);await p.waitForFunction(()=>!window.__STORYWORLD_POISON_CITY_VIDEO_R369__.inspect().open,null,{timeout:4000}).catch(()=>{});check('off: 화면 누르면 닫힘',!(await A(p)).open,(await A(p)).stats);check('off: 페이지 오류 없음',!errors.length,errors);await b.close();}
fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({fails,results},null,1));console.log(fails?`FAIL ${fails}`:`ALL ${results.length} PASS`);process.exit(fails?1:0);
