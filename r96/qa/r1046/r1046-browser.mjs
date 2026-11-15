// R1046 히든 영웅 EGO — 헤드리스 브라우저 검사(게임 그래픽 검증 아님 — 헤드리스 소프트웨어 렌더, GPU·실기기 미검증).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=폴더] node r96/qa/r1046/r1046-browser.mjs
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,240):''));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const adv=(p,k)=>p.evaluate(k=>{for(let i=0;i<k;i++){if(loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},k);
const b=await chromium.launch();
async function open(ls){const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await ctx.addInitScript(ls=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));for(const[k,v]of Object.entries(ls))localStorage.setItem(k,v);},ls);
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);return {ctx,p,errs};}
// 1) 잠긴 상태: 시작 영웅 줄에 EGO 칸 없음
{const {ctx,p,errs}=await open({});ok(await p.locator('.heroRowR101 [data-ego-r1046]').count()===0,'잠김: 시작 영웅 줄에 EGO 칸 없음');ok(errs.length===0,'페이지 오류 0(잠김)',errs);await ctx.close();}
// 2) 해금 상태: 칸 → 골라 시작 → 형상 켜짐
const {ctx,p,errs}=await open({'storyworld.r1046.ego':'{"on":true}'});
ok(await p.locator('.heroRowR101 [data-ego-r1046]').count()===1,'해금: 시작 영웅 줄에 EGO 칸 1개');
await p.locator('.heroRowR101 [data-ego-r1046]').click();await p.waitForTimeout(500);
const st=await p.evaluate(()=>({sel:!!document.querySelector('.heroRowR101 [data-ego-r1046].selected'),nm:document.querySelector('#r263Stage .nm')?.textContent,img:document.querySelector('#r263Stage .pt img')?.getAttribute('src')||''}));
ok(st.sel&&st.nm==='EGO'&&/r1046\/ego-portrait/.test(st.img),'EGO 칸 선택·무대(이름·초상) 바뀜',st);
if(SH)await p.screenshot({path:SH+'/start-stage.jpg',quality:82});
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(800);await skip(p);await adv(p,30);await p.waitForTimeout(600);await adv(p,5);
ok(await p.evaluate(()=>player.hero==='hwando'&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()),'시작: 환도 몸 + EGO 형상 켜짐',await p.evaluate(()=>({hero:player.hero,ins:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.inspect()})));
// 3) 관측 폐기
await p.evaluate(()=>{player.storyStatus150={key:'slow',label:'시험',until:time+6};player.heroSlowUntil150=time+6;});
await adv(p,30);ok(await p.evaluate(()=>!!player.storyStatus150),'0.5초: 아직 그대로');
await adv(p,20);ok(await p.evaluate(()=>!player.storyStatus150&&!(player.heroSlowUntil150>time)),'0.83초: 둔화 걷힘(관측 폐기)');
const draws=await p.evaluate(()=>{const cs=window.__STORYWORLD_PHASE1__.captureVisual();let aura=0,gather=0,nan=0;for(const c of cs){const sp=String(c.sourcePath||'');if(/sig-aura-red/.test(sp))aura++;if(/sig-gather-red/.test(sp))gather++;if(c.points&&!(c.points||[]).flat().every(Number.isFinite))nan++;}return{aura,gather,nan};});
ok(draws.aura>0,'형상 중 붉은 오라(R100 손그림 시트) 그려짐',draws);ok(draws.gather>0,'폐기 순간 바닥 소용돌이 시트',draws);ok(draws.nan===0,'좌표 NaN 0',draws);
if(SH){await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:SH+'/field-discard.jpg',quality:82});}
// 4) 영웅 변경 창: EGO 칸·무대, 다른 영웅 고르면 형상 꺼짐
await p.evaluate(()=>showHeroes(false));await p.waitForTimeout(700);
ok(await p.locator('#panel .cards [data-ego-r1046]').count()===1,'영웅 변경 창에 EGO 칸');
await p.locator('#panel .cards [data-hero="seoha"]').click();await p.waitForTimeout(300);await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:60000});await p.waitForTimeout(500);await adv(p,5);
ok(await p.evaluate(()=>player.hero==='seoha'&&!window.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()),'서하로 바꾸면 형상 꺼짐');
await p.evaluate(()=>showHeroes(false));await p.waitForTimeout(700);await p.locator('#panel .cards [data-ego-r1046]').click();await p.waitForTimeout(600);
if(SH)await p.screenshot({path:SH+'/change-stage.jpg',quality:82});
await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:60000});await p.waitForTimeout(700);await adv(p,5);
ok(await p.evaluate(()=>player.hero==='hwando'&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()),'영웅 변경 창에서 EGO 고르면 환도+형상');
// 5) 일반 환도는 형상 아님
await p.evaluate(()=>showHeroes(false));await p.waitForTimeout(700);await p.locator('#panel .cards [data-hero="hwando"]').click();await p.waitForTimeout(300);await p.locator('#chooseHero').click();await p.waitForFunction(()=>!loading&&!modal,null,{timeout:60000});await p.waitForTimeout(700);await adv(p,5);
ok(await p.evaluate(()=>player.hero==='hwando'&&!window.__STORYWORLD_EGO_SOVEREIGN_R1046__.active()),'일반 환도 칸은 형상 아님');
// 6) 저장·불러오기 왕복
await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true));
ok(await p.evaluate(async()=>{const d=serializeSave();await restoreSave(JSON.parse(JSON.stringify(d)));return window.__STORYWORLD_EGO_SOVEREIGN_R1046__.active();}),'저장→불러오기 형상 유지');
// 7) 해금 컷인: 잠그고 S-07 클리어 표시 → 컷인
await p.evaluate(()=>{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.lock();const A=window.__STORYWORLD_SAMONG_R103__;const i=A.episodes.findIndex(e=>e.key==='S-07');const c=A.state().cleared;if(!c.includes(i))c.push(i);});
await adv(p,40);await p.waitForTimeout(600);await adv(p,2);
ok(await p.locator('#r1046Cutin').count()===1,'S-07 클리어 → 해금 컷인');if(SH)await p.screenshot({path:SH+'/cutin.jpg',quality:82});
ok(await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlocked()),'해금 기억');
const ins=await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.inspect());ok(ins.stats.errors===0,'내부 오류 0',ins.lastError);
ok(errs.length===0,'페이지 오류 0',errs);
await ctx.close();await b.close();
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({when:new Date().toISOString(),headless:true,GPUVerified:false,naturalPlayVerified:false,passed:n-bad,total:n},null,1)+'\n');
console.log(`\n${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
