// R1251 브라우저 검사(헤드리스 Chromium 812×375 터치 — 실기기 아님). SW_URL=http://127.0.0.1:4396/ SW_SHOT=/tmp/r1251 node r96/qa/r1251/r1251-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SHOT=process.env.SW_SHOT||'';
let n=0,bad=0;const check=(m,c,d='')=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==''?' :: '+JSON.stringify(d).slice(0,300):''));};
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:812,height:375},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof newGame==='function'&&!loading&&window.__STORYWORLD_NOTE_FOLD_R1251__,null,{timeout:180000});await p.waitForTimeout(1500);
await p.evaluate(async()=>{await newGame('hwando');});await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();});
await p.evaluate(()=>enterRegion('dist00',null,{restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist00',null,{timeout:240000});
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();hurt=()=>'ignored';});
const gw=s=>p.evaluate(s=>new Promise(r=>{const t=time;const w=()=>time>t+s?r():setTimeout(w,100);w();}),s).catch(()=>{});
// 적 하나를 영웅 옆에 두고 걸음을 멈춘다(전투 상태)
await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0);e.x=player.x+2;e.y=player.y;e.speed=0;e.damage=0;for(const o of room.enemies)if(o!==e){o.x=o.x+40;}});
const show=key=>p.evaluate(k=>window.__STORYWORLD_STORY_COLLECT_R177__.show({key:k,form:'shard',title:'시험 기억 '+k,narr:'',text:'첫 문단입니다.\n\n'+'둘째 문단입니다. '.repeat(30),place:'x'},{force:true}),key);
await show('a');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const e=document.getElementById('r177Doc');const b=e.getBoundingClientRect();return {fold:e.classList.contains('r1251Fold'),h:b.height,x:b.x,y:b.y,w:b.width};});
check('전투 중 쪽지가 한 줄로 접힘(높이 60px 이하)',r.fold&&r.h<=60,r);if(SHOT)await p.screenshot({path:SHOT+'-folded.png'});
const pos=()=>p.evaluate(()=>({x:player.x,y:player.y}));const d=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
let p0=await pos();await p.touchscreen.tap(r.x+r.w/2,r.y+r.h/2);await gw(1.2);let p1=await pos();
const r2=await p.evaluate(()=>{const e=document.getElementById('r177Doc');const b=e.getBoundingClientRect();return {fold:e.classList.contains('r1251Fold'),hidden:e.hidden,h:b.height,x:b.x,y:b.y,w:b.width};});
check('접힌 줄을 탭하면 펼쳐짐(닫히지 않음)',!r2.fold&&!r2.hidden&&r2.h>80,r2);check('펼치는 탭으로 영웅이 움직이지 않음',d(p0,p1)<.05,d(p0,p1));
if(SHOT)await p.screenshot({path:SHOT+'-opened.png'});
await p.waitForTimeout(700);check('사람이 펼친 쪽지는 전투 중 다시 접지 않음',!(await p.evaluate(()=>document.getElementById('r177Doc').classList.contains('r1251Fold'))));
// 펼친 쪽지의 ✕ 를 탭해 닫기 → 이동 없음
p0=await pos();const x=await p.evaluate(()=>{const b=document.querySelector('#r177Doc [data-r182="close"]')?.getBoundingClientRect();return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null;});
if(x){await p.touchscreen.tap(x.x,x.y);await gw(1.2);p1=await pos();check('쪽지를 닫는 탭으로 영웅이 움직이지 않음',d(p0,p1)<.05&&await p.evaluate(()=>document.getElementById('r177Doc').hidden),d(p0,p1));}else check('닫기 단추 찾음',false);
// 쪽지 밖 탭은 그대로 이동
p0=await pos();await p.touchscreen.tap(600,200);await gw(1.5);p1=await pos();check('쪽지 밖 바닥 탭은 그대로 이동',d(p0,p1)>.2,d(p0,p1));
// 전투 끝 → 펼침
await show('b');await p.waitForTimeout(900);const f1=await p.evaluate(()=>document.getElementById('r177Doc').classList.contains('r1251Fold'));
await p.evaluate(()=>{window.__r1251keep=room.enemies.slice();room.enemies.length=0;});await p.waitForTimeout(900);const near=await p.evaluate(()=>room.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<9).length);const f2=await p.evaluate(()=>document.getElementById('r177Doc').classList.contains('r1251Fold'));
check('새 쪽지는 전투 중 다시 접히고, 전투가 끝나면(적 없음) 펼쳐짐',f1&&!f2,{f1,f2,near});
check('오류 0',errs.length===0&&(await p.evaluate(()=>window.__STORYWORLD_NOTE_FOLD_R1251__.inspect().stats.errors))===0,errs);
await b.close();console.log(`R1251 browser ${bad?'FAILED':'PASSED'} ${n-bad}/${n}`);process.exit(bad?1:0);
