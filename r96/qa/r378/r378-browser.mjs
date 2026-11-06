// R378 headless check (Playwright) — 미카엘라 쉼터(dreamRest) 발레리나 오르골: 자리·상호작용·곡 목록·재생/정지/이전/다음·맵 곡 페이드·맵 이탈 닫힘.
//   STORYWORLD_URL=http://127.0.0.1:4410/m0/ OUT=out/r378 node r96/qa/r378/r378-browser.mjs
// Headless Chromium: 판정·상태값·화면 구성만 본다. GPU·실기기 모바일·실제 청취는 검증하지 않는다.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'out/r378';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,400)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const A=p=>p.evaluate(()=>window.__STORYWORLD_MUSIC_BOX_R378__.inspect());
const R308=p=>p.evaluate(()=>window.__STORYWORLD_BGM_MAP_R308__.inspect().active);
async function boot(viewport,scene3d){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const mobile=viewport.width<500;const ctx=await b.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(o=>{try{if(!o)localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}},scene3d);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 return {b,p,errors};}
const go=async(p,z)=>{await p.evaluate(z=>{enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});await skip(p);await p.waitForTimeout(1200);};
const standBy=async(p,dx,dy)=>{await skip(p);return p.evaluate(([dx,dy])=>{const o=room.props.find(q=>q.r378Orgel);player.x=o.x+dx;player.y=o.y+dy;route=[];command=null;auto=false;},[dx,dy])};
async function run(tag,viewport,scene3d){const {b,p,errors}=await boot(viewport,scene3d);
 // 지나온 맵을 몇 곳 만든다(같은 곡을 쓰는 맵은 한 번만 나와야 함)
 await p.evaluate(()=>{for(const z of ['dist00','dist01','ep1a01'])visited.add('STORY:'+z);});
 await go(p,'dreamRest');await p.waitForTimeout(2500);
 const a0=await A(p);const env=await p.evaluate(()=>{const o=room.props.find(q=>q.r378Orgel),m=room.props.find(q=>/michaela/i.test(q.id||'')),L=room.exploration;
  return {n:room.props.filter(q=>q.r378Orgel).length,dm:m?Math.hypot(m.x-o.x,m.y-o.y):null,dObj:Math.hypot(room.objective.x-o.x,room.objective.y-o.y),dEntry:Math.hypot(L.entry.x-o.x,L.entry.y-o.y),
   blocked:window.StoryPhase1.explorationBlocked(L,o.x,o.y,.5),visible:o.visible!==false,pathMin:Math.min(99,...[...(window.__STORYWORLD_PLAY_R169__.pathCells(room)||[])].map(k=>{const[c,d]=k.split(',').map(Number);return Math.hypot(c+.5-o.x,d+.5-o.y);})),doors:room.props.filter(q=>/door/.test(q.id||'')).map(d=>Math.hypot(d.x-o.x,d.y-o.y)),visited:[...visited]};});
 check(tag+': 쉼터에 오르골 1개, 표현 전용',env.n===1&&a0.orgel&&a0.orgel.solid===false&&a0.orgel.presentationOnly,{env,orgel:a0.orgel});
 check(tag+': 보임(R169 길가 숨김에 안 걸림)',env.visible,env);
 check(tag+': 미카엘라 곁·제단/입구/문/길을 피함·막힌 칸 아님',env.dm>=1.6&&env.dm<=3.2&&env.dObj>=4.2&&env.dEntry>=2.6&&!env.blocked&&env.doors.every(d=>d>=3)&&env.pathMin>=1.6,env);
 // 멀리서 상호작용 → 원래 interact 로
 await standBy(p,3,0);const s0=a0.stats.passed;await p.evaluate(()=>interact());const a1=await A(p);
 check(tag+': 1.7칸 밖에서는 열리지 않음',!a1.open&&a1.stats.passed>s0,a1.stats);
 await standBy(p,-1.2,.3);await p.waitForTimeout(400);
 await p.screenshot({path:`${OUT}/${tag}-closed-near.jpg`,quality:78});
 const r0=await R308(p);
 if(tag==='pc')await p.keyboard.press('c');else await p.evaluate(()=>interact());
 await p.waitForTimeout(300);const a2=await A(p);
 check(tag+': 가까이서 C(상호작용)로 열림',a2.open&&a2.stats.opens===1,{open:a2.open,stats:a2.stats});
 const want=await p.evaluate(()=>{const M=window.__STORYWORLD_MUSIC_BOX_R378__;return ['hub','dist00','dist01','ep1a01','dreamRest'].map(z=>M.trackFor(z));});
 const uniq=[...new Set(want.filter(Boolean))];
 check(tag+': 목록 = 지나온 맵 곡, 중복 없음',a2.tracks.length===uniq.length&&uniq.every(t=>a2.tracks.includes(t))&&new Set(a2.tracks).size===a2.tracks.length,{tracks:a2.tracks,want});
 check(tag+': 처음 곡은 지금 쉼터 곡',a2.track===await p.evaluate(()=>window.__STORYWORLD_MUSIC_BOX_R378__.trackFor('dreamRest')),a2.track);
 await p.waitForTimeout(2600);const a3=await A(p),r1=await R308(p);
 check(tag+': 맵 곡이 페이드로 줄어 멈춤(자리 기억)',a3.bgmGain===0&&r1&&r1.paused,{gain:a3.bgmGain,r308:r1,before:r0});
 check(tag+': 오르골 곡 재생',a3.want&&!a3.elPaused&&a3.fade>0&&a3.elTime>0,{fade:a3.fade,g:a3.bgmGain,t:a3.elTime,vol:a3.orgelVolume,paused:a3.elPaused,err:a3.lastError,frames:a3.stats.frames,f0:a2.stats.frames});
 const ui=await p.evaluate(()=>{const e=document.getElementById('r378Orgel');if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,li:e.querySelectorAll('li').length,now:e.querySelector('.now').textContent,line:e.querySelector('.line').textContent};});
 check(tag+': 창이 화면 안·목록 표시·한 줄 글',ui&&ui.x>=0&&ui.x+ui.w<=viewport.width&&ui.y+ui.h<=viewport.height&&ui.li===a3.tracks.length&&ui.line==='…익숙한 선율.',ui);
 await p.screenshot({path:`${OUT}/${tag}-open-playing.jpg`,quality:78});
 const f1=await p.evaluate(()=>room.props.find(q=>q.r378Orgel).path);await p.waitForTimeout(250);const f2=await p.evaluate(()=>room.props.find(q=>q.r378Orgel).path);
 check(tag+': 재생 중 발레리나가 돈다(프레임 바뀜)',f1!==f2&&/orgel-\d\.webp$/.test(f2),[f1,f2]);
 // 다음/이전/정지
 if(a3.tracks.length>1){const t0=a3.track;if(tag==='pc')await p.keyboard.press('ArrowRight');else await p.locator('#r378Orgel [data-a=next]').tap();await p.waitForTimeout(200);const n1=await A(p);
  check(tag+': 다음 곡',n1.track!==t0&&n1.index===(a3.index+1)%n1.tracks.length,{t0,now:n1.track});
  if(tag==='pc')await p.keyboard.press('ArrowLeft');else await p.locator('#r378Orgel [data-a=prev]').tap();await p.waitForTimeout(200);const n2=await A(p);check(tag+': 이전 곡',n2.track===t0,n2.track);}
 else check(tag+': 다음/이전(곡 1개라 건너뜀)',false,a3.tracks);
 if(tag==='pc')await p.keyboard.press('Enter');else await p.locator('#r378Orgel [data-a=play]').tap();await p.waitForTimeout(2600);const a4=await A(p),r2=await R308(p);
 check(tag+': 정지하면 오르골 내리고 맵 곡 복귀(멈춘 자리부터)',!a4.want&&a4.elPaused&&a4.bgmGain===1&&r2&&!r2.paused&&r2.track===r1.track&&r2.time>=r1.time-0.05,{a4:{g:a4.bgmGain,p:a4.elPaused},r1,r2});
 if(tag==='pc')await p.keyboard.press('Enter');else await p.locator('#r378Orgel [data-a=play]').tap();await p.waitForTimeout(2200);
 const a5=await A(p);check(tag+': 다시 재생',a5.want&&!a5.elPaused,{p:a5.elPaused});
 // 음악 끔 존중
 await p.evaluate(()=>{settings.music=false;});await p.waitForTimeout(1600);const a6=await A(p);
 check(tag+': 음악 끄면 오르골 소리도 멈춤',!a6.want&&a6.elPaused&&a6.orgelVolume===0,{want:a6.want,p:a6.elPaused,v:a6.orgelVolume});
 await p.evaluate(()=>{settings.music=true;window.__STORYWORLD_MUSIC_BOX_R378__.play();});await p.waitForTimeout(2200);
 // 닫기
 if(tag==='pc')await p.keyboard.press('Escape');else await p.locator('#r378Orgel [data-a=close]').tap();await p.waitForTimeout(2400);const a7=await A(p),r3=await R308(p);
 check(tag+': 닫으면 창 사라지고 맵 곡 복귀',!a7.open&&!(await p.evaluate(()=>!!document.getElementById('r378Orgel')))&&a7.bgmGain===1&&r3&&!r3.paused,{a7:{open:a7.open,g:a7.bgmGain},r3});
 check(tag+': Esc 가 게임 메뉴를 열지 않음',!(await p.evaluate(()=>!!modal)),null);
 // 맵 이탈
 await standBy(p,-.8,-.5);await p.evaluate(()=>interact());await p.waitForTimeout(400);const a8=await A(p);
 await go(p,'hub');const a9=await A(p);check(tag+': 맵을 떠나면 저절로 닫힘',a8.open&&!a9.open&&a9.stats.autoClose>=1&&!a9.want,{before:a8.open,after:a9.open,st:a9.stats});
 await p.waitForTimeout(2400);const a10=await A(p);check(tag+': 떠난 뒤 맵 곡 배율 1',a10.bgmGain===1,a10.bgmGain);
 await go(p,'dreamRest');const a11=await A(p);check(tag+': 다시 와도 같은 자리에 1개',a11.orgel&&a11.orgel.x===a0.orgel.x&&a11.orgel.y===a0.orgel.y&&(await p.evaluate(()=>room.props.filter(q=>q.r378Orgel).length))===1,a11.orgel);
 check(tag+': 오버레이 오류 없음',!a11.lastError&&a11.stats.errors===0,a11.lastError);
 check(tag+': 페이지 오류 없음',!errors.length,errors);await b.close();}
const ONLY=process.env.ONLY||'';
if(!ONLY||ONLY==='pc')await run('pc',{width:1280,height:720},false);
if(!ONLY||ONLY==='mobile')await run('mobile',{width:412,height:915},false);
// 3D(기본 설정) 모습만 한 장
if(!ONLY||ONLY==='3d'){const {b,p,errors}=await boot({width:1280,height:720},true);await go(p,'dreamRest');await p.waitForTimeout(2000);await standBy(p,-1.2,.3);await p.waitForTimeout(500);
 await p.screenshot({path:`${OUT}/pc3d-closed-near.jpg`,quality:78});await p.evaluate(()=>interact());await p.waitForTimeout(2500);await p.screenshot({path:`${OUT}/pc3d-open-playing.jpg`,quality:78});
 const a=await A(p);check('3d: 열림·재생',a.open&&a.want,{open:a.open,want:a.want});check('3d: 페이지 오류 없음',!errors.length,errors);await b.close();}
fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({fails,results},null,1));console.log(fails?`FAIL ${fails}`:`ALL ${results.length} PASS`);process.exit(fails?1:0);
