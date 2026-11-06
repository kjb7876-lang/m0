// R372 headless check (Playwright) — 오프닝은 책 영상만, dist00 뿌리의 문지기 보스 문 상호작용 때 실사 보스 입장 영상 → 끝나면 원래 문 처리(서사 → 문 열림).
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=out/r372 node r96/qa/r372/r372-browser.mjs
// Headless Chromium: 판정·호출·화면 구성만 본다. GPU·실기기 모바일·소리는 검증하지 않는다(임시).
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r372';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,300)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const G=p=>p.evaluate(()=>window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.inspect());
async function boot(viewport){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const mobile=viewport.width<500;const ctx=await b.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 return {b,p,errors};}
// dist00 STORY 로 가서 들판 적을 정리해 보스 문 단계('door')로 만들고 문 앞에 선다.
async function toGate(p){await p.evaluate(()=>{enterRegion('dist00',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:120000});
 await p.waitForTimeout(800);await skip(p);
 return p.evaluate(()=>{const W=window.__STORYWORLD_WORLD_COMBAT_R78__;for(const e of room.enemies){if(!(e.boss||e.midboss)||e.wardChampionR81){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}else if(e.midboss){e.hp=0;e.deadRecorded=true;e.spawnState='dead';}}
  W.settle();const s=W.state(room);const id=room.exploration.bossDoorId,d=room.exploration.worldR74.doors.find(v=>v.id===id);let spot=null;
  for(let r=1.2;r<=3&&!spot;r+=.2)for(let k=0;k<24&&!spot;k++){const a=k*Math.PI/12,x=d.x+Math.cos(a)*r,y=d.y+Math.sin(a)*r;if(!blocked(x,y,.3))spot={x,y};}
  if(spot){player.x=spot.x;player.y=spot.y;}return {phase:s?.phase,door:id,d:{x:d.x,y:d.y},spot,boss:room.enemies.filter(e=>e.boss).map(e=>e.name)};});}
async function run(tag,viewport){const {b,p,errors}=await boot(viewport);
 const op=await p.evaluate(()=>{const a=window.__STORYWORLD_INTRO_VIDEO_R309__;return {src:a.src,cut:a.cut};});
 check(tag+': 오프닝은 책 영상만(9.4초 컷)',op.src==='assets/r372/opening-book.mp4'&&op.cut===9.4,op);
 const g=await toGate(p);check(tag+': dist00 보스 문 단계·문 앞',g.phase==='door'&&!!g.spot,g);
 const pre=await p.evaluate(()=>window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.atGate());check(tag+': 문 앞에서 영상 차례로 판정',pre===true,pre);
 await p.evaluate(()=>interact());await p.waitForTimeout(300);
 const a1=await G(p);const ph1=await p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room).phase);
 check(tag+': 문 상호작용 → 영상 시작, 문 처리는 아직(door 단계 그대로)',a1.open&&a1.stats.plays===1&&ph1==='door',{s:a1.stats,ph1});
 const shots=[];for(const t of [1.5,7.2]){await p.waitForFunction(t=>{const a=window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.inspect();return a.open&&a.time>=t;},t,{timeout:20000}).catch(()=>{});
  shots.push(await p.evaluate(()=>{const n=document.querySelector('#r372v .name');return {t:window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.inspect().time,bgm:window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.bgmGain(),name:n?.textContent,nameOn:n?.classList.contains('on'),bar:document.querySelector('#r372v .bar.t')?.getBoundingClientRect().height,nr:n?.getBoundingClientRect().toJSON(),chap:document.querySelector('#r372v .chap')?.textContent};}));
  await p.screenshot({path:`${OUT}/${tag}-gate-${t}.jpg`,quality:72});}
 check(tag+': 보스 입장 연출(검은 띠·끝 무렵 보스 이름 카드)',shots[0].bar>10&&!shots[0].nameOn&&shots[1].nameOn&&/뿌리의 문지기/.test(shots[1].name||''),shots);
 check(tag+': 이름 카드가 화면 안',shots[1].nr&&shots[1].nr.bottom<=viewport.height&&shots[1].nr.left>=0&&shots[1].nr.right<=viewport.width,shots[1].nr);
 check(tag+': 재생 중 BGM 0',shots.every(s=>s.bgm===0));
 const kb=await p.evaluate(()=>{let got=0;const probe=()=>got++;addEventListener('keydown',probe,true);const ev=new KeyboardEvent('keydown',{key:'x',bubbles:true,cancelable:true});document.body.dispatchEvent(ev);removeEventListener('keydown',probe,true);return {got,prevented:ev.defaultPrevented};});
 check(tag+': 재생 중 게임 키 막힘',kb.got===0&&kb.prevented,kb);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('r372v'),null,{timeout:5000}).catch(()=>{});await p.waitForTimeout(300);
 const after=await p.evaluate(()=>({ph:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room).phase,story:!!storyScene,a:window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.inspect()}));
 check(tag+': 건너뛰면 원래 문 처리 이어짐(보스 앞 서사/문 열림)',['doorStory','boss'].includes(after.ph)&&after.a.stats.continued===1&&after.a.prefs.seen,{ph:after.ph,story:after.story,s:after.a.stats});
 await skip(p);await p.waitForTimeout(500);const ph2=await p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room).phase);
 check(tag+': 서사 뒤 보스 단계',ph2==='boss',ph2);
 const again=await p.evaluate(()=>{const s=window.__STORYWORLD_WORLD_COMBAT_R78__.state(room);return window.__STORYWORLD_ROOT_GATE_VIDEO_R372__.inspect().stats.plays;});
 check(tag+': 한 번만',again===1,again);
 check(tag+': 페이지 오류 없음',!errors.length,errors);await b.close();}
await run('pc',{width:1280,height:720});await run('mobile',{width:390,height:844});
fs.writeFileSync(`${OUT}/r372-browser.json`,JSON.stringify({fails,results,headless:true,gpu:false},null,1));
console.log(JSON.stringify({ok:!fails,checks:results.length,fails}));process.exit(fails?1:0);
