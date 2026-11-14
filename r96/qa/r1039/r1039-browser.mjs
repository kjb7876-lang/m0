// R1039 EGO 오라 손그림 프레임 시트 — 헤드리스 브라우저 검사(부팅은 R1027 census 와 같음).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=폴더] node r96/qa/r1039/r1039-browser.mjs [영웅…]  (게임 그래픽 검증 아님 — 헤드리스 소프트웨어 렌더)
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const heroes=process.argv.slice(2).filter(a=>!a.startsWith('--'));const LIST=heroes.length?heroes:ALL;

const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const KEYS=['a','s','d','f','q','w','e','r'];
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 const z=process.env.SW_ZONE||'dist00';await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 await p.addScriptTag({content:HELPER});return {ctx,p,errs};}
async function sample(p,sec,every=6){await p.evaluate(()=>__CEN1027.start());const n=Math.round(sec*60/every);for(let i=0;i<n;i++){await p.evaluate(e=>{for(let k=0;k<e;k++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},every);await p.evaluate(()=>__CEN1027.frame());}return p.evaluate(()=>__CEN1027.dump());}

// R1039 헤드리스 검사: 8영웅마다 EGO 를 켜고 2초(게임 시간) 동안 captureVisual 명령을 모아
//  EGO 범위(r111:ego-back/front)의 R106 1장 그림 0, 영웅색 R100 sig-aura 칸 ≥8종, sig-gather 발동, NaN 0, 페이지 오류 0 을 본다.
//  전후 장면: SW_SHOT 폴더에 끔(storyworld.r1039.paint=off)·켬 두 장. 게임 그래픽 검증 아님(헤드리스 소프트웨어 렌더).
const COL={hwando:'pale',seoha:'cyan',neon:'teal',michaela:'pink',lauren:'violet',hunter:'orange',slayer:'red',gunner:'blue'};
const SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
const b=await chromium.launch();const results={};let allOk=true;
const check=(hero,c,m,d)=>{(results[hero].checks||=[]).push({ok:!!c,m,d});console.log((c?'ok  ':'FAIL')+' '+hero+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,200):''));if(!c)allOk=false;};
for(const hero of LIST){results[hero]={};let s;try{s=await boot(b,hero);const {p}=s;
 const adv=async n=>p.evaluate(n=>{for(let k=0;k<n;k++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},n);
 await p.evaluate(m=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);},MELEE.has(hero));
 const egoOn=()=>p.evaluate(()=>{try{player.ego=Math.max(player.ego||0,3);window.__STORYWORLD_EGO151__?.activate?.();}catch(_){}return player.ego>0;});
 const sample=async(n)=>{const acc={egoR106:0,aura:new Set(),gather:new Set(),nan:0,wrongCol:0,egoCmds:0};for(let i=0;i<n;i++){await egoOn();await adv(3);
   const r=await p.evaluate(col=>{const cs=window.__STORYWORLD_PHASE1__.captureVisual();const o={egoR106:0,aura:[],gather:[],nan:0,wrong:0,ego:0};
    for(const c of cs){const id=String(c.owner?.id||'');if(!/^r111:ego-/.test(id))continue;o.ego++;if(c.kind!=='image')continue;const sp=String(c.sourcePath||'');
     if(/^r106fx/.test(sp))o.egoR106++;if(/sig-aura-/.test(sp)){o.aura.push(JSON.stringify(c.sourceRect));if(!sp.includes('sig-aura-'+col))o.wrong++;}if(/sig-gather-/.test(sp))o.gather.push(JSON.stringify(c.sourceRect));
     if(!(c.points||[]).flat().every(Number.isFinite))o.nan++;}return o;},await p.evaluate(()=>window.__STORYWORLD_EGO_PAINT_R1039__.colourOf(player.hero)));
   acc.egoR106+=r.egoR106;r.aura.forEach(x=>acc.aura.add(x));r.gather.forEach(x=>acc.gather.add(x));acc.nan+=r.nan;acc.wrongCol+=r.wrong;acc.egoCmds+=r.ego;}return acc;};
 await adv(60);
 // 처음 EGO 직전에 오라를 한 번 끊어 '발동' 순간을 만든다
 await p.evaluate(()=>{player.ego=0;});await adv(40);
 const a=await sample(40);
 check(hero,a.egoCmds>0,'EGO 오라가 그려짐(명령 수)',a.egoCmds);
 check(hero,a.egoR106===0,'EGO 범위 R106 코드 1장 그림 0',a.egoR106);
 check(hero,a.aura.size>=8,'영웅색 sig-aura 서로 다른 칸 ≥8',a.aura.size);
 check(hero,a.gather.size>=3,'발동 sig-gather 소용돌이 칸 ≥3',a.gather.size);
 check(hero,a.wrongCol===0,'다른 영웅 색 시트 0',a.wrongCol);
 check(hero,a.nan===0,'그림 좌표 NaN 0',a.nan);
 const ins=await p.evaluate(()=>window.__STORYWORLD_EGO_PAINT_R1039__?.inspect?.());
 check(hero,ins&&ins.installed&&ins.stats.errors===0,'R1039 설치·내부 오류 0',ins&&{errors:ins.stats.errors,painted:ins.stats.egoPainted,cut:ins.stats.strokesCut,last:ins.lastError});
 if(SH){await p.evaluate(()=>{player.ego=3;});await adv(20);await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:`${SH}/${hero}-after.jpg`,quality:80});
  await p.evaluate(()=>window.__STORYWORLD_EGO_PAINT_R1039__.set(false));await adv(2);await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:`${SH}/${hero}-before.jpg`,quality:80});await p.evaluate(()=>window.__STORYWORLD_EGO_PAINT_R1039__.set(true));}
 check(hero,s.errs.length===0,'페이지 오류 0',s.errs.slice(0,2));
}catch(e){results[hero].fail=String(e).slice(0,300);console.log('FAIL',hero,results[hero].fail);allOk=false;}try{await s?.ctx.close();}catch(_){}}
await b.close();
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({when:new Date().toISOString(),headless:true,GPUVerified:false,naturalPlayVerified:false,allOk,results},null,1)+'\n');
console.log(allOk?`\n모두 통과 (${LIST.length}영웅)`:'\n실패 있음');process.exitCode=allOk?0:1;
