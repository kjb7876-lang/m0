// R1041 Dots CX-0099FX 시트 — 헤드리스 브라우저 검사(부팅은 R1039 와 같음). 게임 그래픽 검증 아님(헤드리스 소프트웨어 렌더).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=폴더] node r96/qa/r1041/r1041-browser.mjs [영웅…]
//  미카엘라: 후광 R106 halo 0·M1 칸 ≥6 / 슬레이어(EGO 로 열기): DARK 불꽃 R106 0·A5 칸 ≥6 / 모든 영웅: 발밑 C4 칸 ≥6, 피격(hurt) 때 C2 칸 ≥3·피격 선 줄기 0
//  환도: Q·스킬 키로 발도가 나오면 iai-cut R106 0·H6 칸 ≥3(안 나오면 '미실행'으로 기록). NaN 0, 페이지 오류 0, R1041 내부 오류 0.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const heroes=process.argv.slice(2).filter(a=>!a.startsWith('--'));const LIST=heroes.length?heroes:['michaela','slayer','hwando','neon'];
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 const z=process.env.SW_ZONE||'dist00';await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 await p.addScriptTag({content:HELPER});return {ctx,p,errs};}
const SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
const b=await chromium.launch();const results={};let allOk=true;
const check=(hero,c,m,d)=>{(results[hero].checks||=[]).push({ok:!!c,m,d});console.log((c?'ok  ':'FAIL')+' '+hero+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,220):''));if(!c)allOk=false;};
const note=(hero,m,d)=>{(results[hero].notes||=[]).push({m,d});console.log('note '+hero+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,220):''));};
const READ=()=>{const cs=window.__STORYWORLD_PHASE1__.captureVisual(),o={halo:0,dark:0,iai:0,sheets:{},nan:0,hurtStroke:0,egoOld:0,heartFill:0};
 for(const c of cs){const id=String(c.owner?.id||'');if((c.kind==='fill'||c.kind==='stroke')&&/^r948:.*:(mark|ground)$/.test(id))o.heartFill++;}
 const hurt=window.__STORYWORLD_HERO_DOTS_FX_R1041__;
 for(const c of cs){const id=String(c.owner?.id||''),sp=String(c.sourcePath||'');if(c.kind==='image'){if(!(c.points||[]).flat().every(Number.isFinite))o.nan++;
   if(id.startsWith('r101:aura-front:')&&sp.startsWith('r106fx:halo:'))o.halo++;if(id.startsWith('r101:aura-back:')&&/^r106fx:flame:(60\.8\.16:110\.30\.42|222\.22\.52:)/.test(sp))o.dark++;if(sp.startsWith('r106fx:iai-cut:'))o.iai++;
   const m=/assets\/r1041\/(fx-[a-z0-9-]+)\.webp/.exec(sp);if(m)(o.sheets[m[1]]||=[]).push(c.sourceRect[0]);
   if(/^r111:ego-/.test(id)&&/sig-(aura|gather)-magenta/.test(sp))o.egoOld=(o.egoOld||0)+1;}
  else if(c.kind==='stroke'&&/^r101:\d+$/.test(id))o.hurtStroke++;}
 void hurt;return o;};
for(const hero of LIST){results[hero]={};let s;try{s=await boot(b,hero);const {p}=s;
 const adv=async n=>p.evaluate(n=>{for(let k=0;k<n;k++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},n);
 await p.evaluate(()=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);});await adv(60);
 // 슬레이어 피 불꽃은 열기(heat)가 있어야 나온다 — EGO 로 열기를 올린다(전투 중과 같은 상태).
 if(hero==='slayer')await p.evaluate(()=>{player.ego=Math.max(player.ego||0,30);});
 const acc={halo:0,dark:0,iai:0,nan:0,sheets:{},egoOld:0,heartFill:0};const add=r=>{acc.halo+=r.halo;acc.dark+=r.dark;acc.iai+=r.iai;acc.nan+=r.nan;acc.egoOld+=r.egoOld;acc.heartFill+=r.heartFill;for(const[k,v]of Object.entries(r.sheets)){acc.sheets[k]||=new Set();v.forEach(x=>acc.sheets[k].add(x));}};
 for(let i=0;i<30;i++){await adv(3);add(await p.evaluate(READ));}
 // 피격: 엔진 hurt() 를 불러 R101 heroHurt 를 만든다(체력은 adv 가 되돌림).
 let hurtStroke=0;const c2=new Set();
 for(let k=0;k<3;k++){await p.evaluate(()=>{try{const e=room.enemies?.find(e=>e.hp>0);hurt(1,e||null);}catch(_){}});for(let i=0;i<8;i++){await adv(2);const r=await p.evaluate(READ);hurtStroke+=r.hurtStroke;(r.sheets['fx-c2-hero-hurt']||[]).forEach(x=>c2.add(x));add(r);}await adv(30);}
 // 환도: 스킬 키로 발도를 불러 본다.
 // 미카엘라 r2: EGO(M3) 2초, 사랑의 처방 바닥 하트(M5)는 qaForce('bloom')로 불러 본다, 스킬 키로 적중(M4).
 if(hero==='michaela'){await p.evaluate(()=>{player.ego=0;});await adv(30);for(let i=0;i<30;i++){await p.evaluate(()=>{player.ego=Math.max(player.ego||0,3);});await adv(3);add(await p.evaluate(READ));}await p.evaluate(()=>{player.ego=0;});await adv(30);
  await p.evaluate(()=>{const H=window.__STORYWORLD_MICHAELA_HEART_R948__;try{H.qaForce('bloom');H.qaRandom(()=>0);H.qaReset();}catch(_){}});
  for(const key of ['q','a','s','d','f','q','a']){await p.keyboard.press(key);for(let i=0;i<10;i++){await adv(3);add(await p.evaluate(READ));}}}
 if(hero==='hwando'){for(const key of ['q','a','s','d','f']){await p.keyboard.press(key);for(let i=0;i<10;i++){await adv(2);add(await p.evaluate(READ));}}}
 const sz=k=>acc.sheets[k]?.size||0;
 if(hero==='michaela'){check(hero,acc.halo===0,'후광 R106 halo 0',acc.halo);check(hero,sz('fx-m1-michaela-halo')>=6,'M1 후광 칸 ≥6',sz('fx-m1-michaela-halo'));
  check(hero,acc.egoOld===0,'EGO 범위 R1039 magenta 오라 0(M3 로 바뀜)',acc.egoOld);check(hero,sz('fx-m3-michaela-ego-on')>=4&&sz('fx-m3-michaela-ego-loop')>=8,'M3 발동 칸 ≥4·반복 칸 ≥8',[sz('fx-m3-michaela-ego-on'),sz('fx-m3-michaela-ego-loop')]);
  if(sz('fx-m4-michaela-hit'))check(hero,sz('fx-m4-michaela-hit')>=3,'M4 적중 칸 ≥3',sz('fx-m4-michaela-hit'));else note(hero,'헤드리스에서 미카엘라 스킬 적중이 안 나옴 — M4 미실행');
  if(sz('fx-m5-michaela-ground-heart')||acc.heartFill){check(hero,acc.heartFill===0,'바닥 하트 코드 채우기·테두리 0',acc.heartFill);check(hero,sz('fx-m5-michaela-ground-heart')>=3,'M5 바닥 하트 칸 ≥3',sz('fx-m5-michaela-ground-heart'));}else note(hero,'헤드리스에서 사랑의 처방이 안 나옴 — M5 미실행');
  note(hero,'M7 하늘 빛기둥은 R(아직 배우지 않은 키)라 헤드리스 미실행 — CPU 검사로만 확인');}
 if(hero==='slayer'){check(hero,acc.dark===0,'검붉은 불꽃 R106 flame 0',acc.dark);check(hero,sz('fx-a5-slayer-flame')>=6,'A5 피 불꽃 칸 ≥6',sz('fx-a5-slayer-flame'));}
 check(hero,sz('fx-c4-ground-ring')>=6,'C4 발밑 고리 칸 ≥6',sz('fx-c4-ground-ring'));
 check(hero,c2.size>=3,'피격 C2 칸 ≥3',[...c2]);check(hero,hurtStroke===0,'피격 선 줄기 0',hurtStroke);
 if(hero==='hwando'){if(acc.iai+sz('fx-h6-hwando-iai')>0){check(hero,acc.iai===0,'발도 R106 iai-cut 0',acc.iai);check(hero,sz('fx-h6-hwando-iai')>=3,'H6 발도 칸 ≥3',sz('fx-h6-hwando-iai'));}else note(hero,'헤드리스에서 발도가 안 나옴 — H6 미실행');}
 check(hero,acc.nan===0,'그림 좌표 NaN 0',acc.nan);
 const ins=await p.evaluate(()=>window.__STORYWORLD_HERO_DOTS_FX_R1041__?.inspect?.());
 check(hero,ins&&ins.installed&&ins.stats.errors===0,'R1041 설치·내부 오류 0',ins&&{...ins.stats,last:ins.lastError});
 if(SH){await adv(4);await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:`${SH}/${hero}-after.jpg`,quality:82});
  await p.evaluate(()=>window.__STORYWORLD_HERO_DOTS_FX_R1041__.set(false));await adv(2);await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:`${SH}/${hero}-before.jpg`,quality:82});await p.evaluate(()=>window.__STORYWORLD_HERO_DOTS_FX_R1041__.set(true));}
 check(hero,s.errs.length===0,'페이지 오류 0',s.errs.slice(0,2));
}catch(e){results[hero].fail=String(e).slice(0,300);console.log('FAIL',hero,results[hero].fail);allOk=false;}try{await s?.ctx.close();}catch(_){}}
await b.close();
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({when:new Date().toISOString(),headless:true,GPUVerified:false,naturalPlayVerified:false,allOk,results},null,1)+'\n');
console.log(allOk?`\n모두 통과 (${LIST.length}영웅)`:'\n실패 있음');process.exitCode=allOk?0:1;
