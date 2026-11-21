// R1292 헤드리스 검사(소프트웨어 렌더 — GPU·실기기 터치·자연 플레이 미검증): 수동 조작에서도 EGO(F) 자동 발동, 설정에서 켜고 끄기, 기본 켜짐, 저장값 유지.
//  실행: 빌드한 site 를 정적 서버로 올린 뒤 SW_URL=http://127.0.0.1:4396/m0/ [SW_SHOT=폴더] node r96/qa/r1292/r1292-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';const SHOT=process.env.SW_SHOT||'';
let fails=0;const check=(n,ok,d)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(d===undefined?'':' :: '+JSON.stringify(d).slice(0,500)));};
const b=await chromium.launch();
const VIS=e=>{if(!e)return false;if(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true,opacityProperty:true}))return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
async function boot(p){await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 // 777(개발 시험)으로 지역 잠금을 푼 뒤 적이 있는 이야기 지역(dist02)으로
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.evaluate(()=>{if(room?.id!=='dist02')enterRegion('dist02',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dist02',null,{timeout:150000});
 await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});}
// 수동 조작 + EGO 준비 + 가까운 적 1마리(멈춤) — 실시간 1.6초 기다려 EGO 가 켜졌는지
const arm=p=>p.evaluate(()=>{auto=false;guide=false;player.ego=0;player.egoCD=0;player.samong=0;player.resonance=45;player.hp=Math.max(player.hp,50);
 let e=room.enemies.find(x=>x&&x.hp>0);if(!e)return {noEnemy:true};e.x=player.x+2;e.y=player.y;e.speed=0;return {auto,guide,res:player.resonance};});
const egoNow=p=>p.evaluate(()=>({ego:+player.ego||0,egoCD:+player.egoCD||0,res:+player.resonance,st:window.__STORYWORLD_EGO_AUTO_R1292__.inspect()}));
async function run(tag,vp,touch){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:!!touch,isMobile:!!touch});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await boot(p);
 const i0=await p.evaluate(()=>window.__STORYWORLD_EGO_AUTO_R1292__?.inspect());
 check(`${tag}: 모듈 읽힘·기본 켜짐`,!!i0&&i0.on===true,i0);
 const a=await arm(p);check(`${tag}: 수동 조작 상태(auto·guide 끔) + 적 2칸`,a&&!a.noEnemy&&a.auto===false&&a.guide===false,a);
 await p.waitForTimeout(1600);const e1=await egoNow(p);
 check(`${tag}: 수동 조작에서 F 저절로(EGO 켜짐·공명 30 씀)`,(e1.ego>0||e1.egoCD>0)&&(e1.st.stats.fired>0||e1.st.r1021Handles),e1);
 // 설정 줄
 await p.evaluate(()=>showSettings());await p.waitForTimeout(900);
 const row=await p.evaluate(f=>{const V=eval(f);const r=document.getElementById('egoAutoR1292'),box=document.getElementById('egoAutoR1292Toggle'),sec=document.getElementById('combatScreenR1021');
  const lab=r?.querySelector('label');const rb=lab?.getBoundingClientRect();return {row:!!r,inSec:!!sec&&sec.contains(r),vis:V(r),checked:box?.checked,text:r?.textContent.slice(0,40),labH:rb?Math.round(rb.height):0,
   sibs:sec?[...sec.children].map(c=>c.id||c.tagName).slice(0,8):[]};},'('+VIS+')');
 check(`${tag}: 설정 '전투 화면' 묶음에 'EGO(F) 자동 발동' 줄, 보임, 기본 체크`,row.row&&row.inSec&&row.vis&&row.checked===true&&/EGO\(F\) 자동 발동/.test(row.text),row);
 if(touch)check(`${tag}: 폰 터치 줄 높이 40px 이상(R1291 기준)`,row.labH>=40,row);
 if(SHOT){await p.locator('#egoAutoR1292').scrollIntoViewIfNeeded().catch(()=>{});await p.screenshot({path:`${SHOT}/r1292-${tag}-settings.png`});}
 // 끄기
 await p.evaluate(()=>{const b=document.getElementById('egoAutoR1292Toggle');b.click();});await p.waitForTimeout(200);
 const off=await p.evaluate(()=>({ls:localStorage.getItem('storyworld.r1292.egoAuto'),on:window.__STORYWORLD_EGO_AUTO_R1292__.enabled(),cls:document.body.classList.contains('r1292EgoOff')}));
 check(`${tag}: 체크 풀면 꺼짐·저장 '0'`,off.ls==='0'&&off.on===false&&off.cls,off);
 await p.evaluate(()=>closePanel(true));await p.waitForTimeout(300);
 await arm(p);await p.waitForTimeout(1600);const e2=await egoNow(p);
 check(`${tag}: 꺼지면 공명·적이 있어도 F 안 씀`,e2.ego===0&&e2.egoCD===0&&e2.res>=45,e2);
 if(touch){const fb=await p.evaluate(f=>{const V=eval(f);const b=document.querySelector('#touchActionsR100 button[data-r1021="ego"]');return {has:!!b,vis:V(b)};},'('+VIS+')');
  check(`${tag}: 꺼지면 폰 EGO 단추가 다시 보임`,fb.has&&fb.vis,fb);
  await p.evaluate(()=>{player.egoCD=0;player.ego=0;player.resonance=45;document.querySelector('#touchActionsR100 button[data-r1021="ego"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',isPrimary:true}));});await p.waitForTimeout(300);
  const e3=await egoNow(p);check(`${tag}: 그 단추로 직접 F 발동`,e3.ego>0||e3.egoCD>0,e3);}
 else{await p.evaluate(()=>{player.egoCD=0;player.ego=0;player.resonance=45;});await p.keyboard.press('f');await p.waitForTimeout(300);const e3=await egoNow(p);check(`${tag}: 꺼져도 F 키로 직접 발동`,e3.ego>0||e3.egoCD>0,e3);}
 // 저장값 유지: 다시 읽어도 꺼짐
 await boot(p);const i2=await p.evaluate(()=>{showSettings();return window.__STORYWORLD_EGO_AUTO_R1292__.inspect();});await p.waitForTimeout(900);
 const box2=await p.evaluate(()=>document.getElementById('egoAutoR1292Toggle')?.checked);
 check(`${tag}: 새로고침 뒤에도 꺼짐 유지(체크 풀림)`,i2.on===false&&box2===false,{i2,box2});
 await p.evaluate(()=>{document.getElementById('egoAutoR1292Toggle').click();closePanel(true);});await p.waitForTimeout(300);
 await arm(p);await p.waitForTimeout(1600);const e4=await egoNow(p);check(`${tag}: 다시 켜면 F 저절로`,(e4.ego>0||e4.egoCD>0),e4);
 check(`${tag}: 페이지 오류 0·모듈 오류 0`,errors.length===0&&e4.st.stats.errors===0,{errors,st:e4.st});
 await ctx.close();}
await run('PC',{width:1280,height:720},false);
await run('폰',{width:390,height:844},true);
await b.close();console.log(fails?`R1292 browser: ${fails} FAIL`:'R1292 browser: ALL PASS');process.exit(fails?1:0);
