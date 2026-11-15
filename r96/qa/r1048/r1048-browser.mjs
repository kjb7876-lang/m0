// R1048 EGO 3D 동작 시트 — 헤드리스 브라우저 검사(그래픽 검증 아님 — 헤드리스 소프트웨어 렌더, GPU·실기기 미검증).
//  실행: SW_URL=http://127.0.0.1:4396/ [SW_SHOT=폴더] node r96/qa/r1048/r1048-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
const m0=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__?.inspect());ok(m0&&m0.ready===true&&m0.on===true,'동작 시트 데이터 준비',m0&&{ready:m0.ready,on:m0.on,ego:m0.ego});
// 해금(S-07 대신 저장값) 뒤 창 다시 그리기 → EGO 칸이 줄의 맨 앞(0번째)
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
let row=await p.evaluate(()=>{const r=document.querySelector('#panel .heroRowR101');if(!r)return null;const k=[...r.children].filter(x=>x.matches?.('[data-hero],[data-ego-r1046]'));return{first:k[0]?.getAttribute('data-ego-r1046')!=null?'EGO':k[0]?.getAttribute('data-hero'),n:k.length,ego:k.findIndex(x=>x.hasAttribute('data-ego-r1046'))};});
if(!row||row.ego<0){await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.keyboard.press('Digit7');await p.waitForTimeout(800);
 row=await p.evaluate(()=>{const r=document.querySelector('#panel .heroRowR101');const k=[...r.children].filter(x=>x.matches?.('[data-hero],[data-ego-r1046]'));return{first:k[0]?.getAttribute('data-ego-r1046')!=null?'EGO':k[0]?.getAttribute('data-hero'),n:k.length,ego:k.findIndex(x=>x.hasAttribute('data-ego-r1046')),via777:true};});}
ok(row&&row.ego===0&&row.first==='EGO','EGO 칸이 영웅 줄 맨 앞(0번째)',row);
if(SH)await p.screenshot({path:SH+'/select-row.jpg',quality:82});
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await p.waitForTimeout(1500);
const g=await p.evaluate(()=>({hero:player.hero,form:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()}));ok(g.form===true,'시작 뒤 EGO 형상',g);
// 그림이 늦게 읽혀도 되도록 게임 시간으로 기다림
await p.waitForFunction(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect().stats.frames>20,null,{timeout:120000}).catch(()=>{});
const m1=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect());
ok(m1.stats.frames>20&&m1.stats.errors===0,'EGO 3D 시트 칸이 영웅 몸 대신 그려짐(오류 0)',{stats:m1.stats,err:m1.lastError,clip:m1.state?.clip});
const art=await p.evaluate(()=>{const s=window.__STORYWORLD_EGO_MOTION_R1048__.inspect().lastSrc;const im=s&&typeof readyImage==='function'?readyImage(s.split('#')[0])?.image:null;return{src:s,loaded:!!im&&(im.naturalWidth||im.width)>0,w:im?.naturalWidth||im?.width||0};});
ok(/assets\/r1048\/ego\/idle-/.test(art.src||'')&&art.loaded,'그린 칸 = r1048 대기 시트, 그림 읽힘',art);
if(SH)await p.screenshot({path:SH+'/in-game.jpg',quality:82});
// 걷기: 영웅을 옮겨 걷기/달리기 칸으로 바뀌는지
await p.evaluate(()=>{window.__r1048walk=setInterval(()=>{player.x+=.06;},16);});await p.waitForTimeout(2500);
const m2=await p.evaluate(()=>{clearInterval(window.__r1048walk);return window.__STORYWORLD_EGO_MOTION_R1048__.inspect();});
ok(['walk','run'].includes(m2.state?.clip)||['walk','run'].includes(m2.state?.state),'움직이면 걷기·달리기 칸',{clip:m2.state?.clip,state:m2.state?.state,speed:m2.input?.speed});
if(SH)await p.screenshot({path:SH+'/walk.jpg',quality:82});
// 기본 공격 → 검 궤적(CX-0110EG) 칸이 가산 합성으로 겹침
const s0=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect().stats.slash);
for(let i=0;i<5;i++){await p.keyboard.press('KeyA');await p.evaluate(()=>{if(!(player.attackAnim>0))player.attackAnim=.35;});/* 거점엔 적이 없어 공격이 안 나갈 수 있음 → 공격 진행값만 넣어 그림 사슬 확인 */await p.waitForTimeout(700);}
const s1=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect());
ok(s1.stats.slash>s0&&s1.stats.errors===0,'기본 공격 때 검 궤적 그려짐',{slash:s1.stats.slash,s0,err:s1.lastError});
if(SH)await p.screenshot({path:SH+'/attack.jpg',quality:82});
// 끄기 설정
await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.set(false));const f0=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect().stats.frames);await p.waitForTimeout(1500);
const f1=await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.inspect().stats.frames);ok(f1===f0,'끄면 옛 그림으로(시트 칸 안 그림)',{f0,f1});
await p.evaluate(()=>window.__STORYWORLD_EGO_MOTION_R1048__.set(true));
ok(errs.length===0,'페이지 오류 0',errs);
await ctx.close();await b.close();
console.log(`\nR1048 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
