// R1051 영웅 날개 없애고 천사링만 — 헤드리스 브라우저 검사(부팅은 R1041 과 같음). 게임 그래픽 검증 아님(헤드리스 소프트웨어 렌더).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SW_SHOT=폴더] node r96/qa/r1051/r1051-browser.mjs [영웅…]
//  영웅마다 평소(777 = 성장 7단계) → EGO → 사몽 각성 → 스킬 키를 돌며 화면에 실제로 나간 그림 명령을 읽는다.
//   날개 그림(r106fx:wing*) 0 · 오라 범위의 코드 날개(채우기·선) 0 · 후광(R106 halo 또는 Dots M1 시트)은 미카엘라 늘·다른 영웅은 사몽 때 나옴 · NaN 0 · 페이지 오류 0.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const heroes=process.argv.slice(2).filter(a=>!a.startsWith('--'));const LIST=heroes.length?heroes:['michaela','hwando','slayer'];
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
const check=(hero,c,m,d)=>{(results[hero].checks||=[]).push({ok:!!c,m,d});console.log((c?'ok  ':'FAIL')+' '+hero+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,260):''));if(!c)allOk=false;};
const READ=()=>{const cs=window.__STORYWORLD_PHASE1__.captureVisual(),o={wing:0,wingNames:[],halo:0,auraShape:0,nan:0,feather:0};
 for(const c of cs){const id=String(c.owner?.id||''),sp=String(c.sourcePath||'');
  if(c.kind==='image'){if(!(c.points||[]).flat().every(Number.isFinite))o.nan++;
   const m=/^r106fx:(wing[a-z-]*):/.exec(sp);if(m){o.wing++;if(!o.wingNames.includes(m[1]))o.wingNames.push(m[1]);}
   if(sp.startsWith('r106fx:feather:')&&id.startsWith('r101:aura-'))o.feather++;
   if(id.startsWith('r101:aura-front:')&&(sp.startsWith('r106fx:halo:')||/fx-m1-michaela-halo/.test(sp)))o.halo++;}
  else if((c.kind==='fill'||c.kind==='stroke')&&id.startsWith('r101:aura-'))o.auraShape++;}// 코드로 그린 날개·후광 도형(그림이 받아진 뒤에는 0 이어야 함)
 return o;};
for(const hero of LIST){results[hero]={};let s;try{s=await boot(b,hero);const {p}=s;
 const adv=async n=>p.evaluate(n=>{for(let k=0;k<n;k++){if(modal||loading)break;try{tick(1/60);}catch(_){}}if(player)player.hp=Math.max(player.hp,maxHP()*.9);},n);
 await p.evaluate(()=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);});await adv(90);
 const phase=async(name,set,rounds=24)=>{const a={wing:0,wingNames:[],halo:0,auraShape:0,nan:0,feather:0,frames:0};
  for(let i=0;i<rounds;i++){if(set)await p.evaluate(set);await adv(3);const r=await p.evaluate(READ);a.frames++;for(const k of ['wing','halo','auraShape','nan','feather'])a[k]+=r[k];for(const w of r.wingNames)if(!a.wingNames.includes(w))a.wingNames.push(w);}
  results[hero][name]=a;return a;};
 const shot=async tag=>{if(!SH)return;await p.evaluate(()=>{try{tick(1e-4);}catch(_){}});await p.screenshot({path:`${SH}/${hero}-${tag}.jpg`,quality:85});};
 const tier=await p.evaluate(()=>window.__STORYWORLD_HERO_FX_R102__?.tier?.(player));results[hero].tier=tier;
 const idle=await phase('idle',null);await shot('idle');
 const walk=await phase('walk',()=>{player.moving=true;});
 const ego=await phase('ego',()=>{player.ego=Math.max(player.ego||0,3);});await shot('ego');await p.evaluate(()=>{player.ego=0;});await adv(30);
 const sam=await phase('samong',()=>{player.samong=Math.max(player.samong||0,3);});await shot('samong');await p.evaluate(()=>{player.samong=0;});await adv(30);
 const sk={wing:0,wingNames:[],halo:0,auraShape:0,nan:0,feather:0,frames:0};
 for(const key of ['q','a','s','d','f','q','a','s']){await p.keyboard.press(key);for(let i=0;i<10;i++){await adv(3);const r=await p.evaluate(READ);sk.frames++;for(const k of ['wing','halo','auraShape','nan','feather'])sk[k]+=r[k];for(const w of r.wingNames)if(!sk.wingNames.includes(w))sk.wingNames.push(w);}if(key==='q')await shot('skill');}
 results[hero].skills=sk;
 const all=[idle,walk,ego,sam,sk],sum=k=>all.reduce((t,a)=>t+a[k],0),names=[...new Set(all.flatMap(a=>a.wingNames))];
 check(hero,sum('wing')===0,'날개 그림 0 (평소·걷기·EGO·사몽·스킬)',{idle:idle.wing,walk:walk.wing,ego:ego.wing,samong:sam.wing,skills:sk.wing,names});
 check(hero,sum('auraShape')===0,'오라 범위 코드 도형(도형 날개 대체) 0',sum('auraShape'));
 check(hero,sum('feather')===0,'오라 날개에 딸린 깃털 0',sum('feather'));
 if(hero==='michaela'){check(hero,idle.halo>=idle.frames*.9,'평소에 천사링이 프레임마다 보임',[idle.halo,idle.frames]);check(hero,ego.halo>=ego.frames*.9&&sk.halo>=sk.frames*.8,'EGO·스킬 중에도 천사링',[ego.halo,ego.frames,sk.halo,sk.frames]);}
 else check(hero,idle.halo===0,'천사 형태가 아닌 영웅은 평소 천사링 없음(전과 같음)',idle.halo);
 check(hero,sam.halo>=sam.frames*.9,'사몽 각성 때 천사링',[sam.halo,sam.frames]);
 check(hero,sum('nan')===0,'그림 좌표 NaN 0',sum('nan'));
 const ins=await p.evaluate(()=>({w:window.__STORYWORLD_FX_SPRITES_R106__?.heroWings,e101:window.__STORYWORLD_POLISH_R101__?.inspect?.()?.stats?.errors??null}));
 check(hero,ins.w===false,'R106 날개 스위치 꺼짐',ins);
 check(hero,s.errs.length===0,'페이지 오류 0',s.errs.slice(0,2));
}catch(e){results[hero].fail=String(e).slice(0,300);console.log('FAIL',hero,results[hero].fail);allOk=false;}try{await s?.ctx.close();}catch(_){}}
await b.close();
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({when:new Date().toISOString(),headless:true,GPUVerified:false,naturalPlayVerified:false,allOk,results},null,1)+'\n');
console.log(allOk?`\n모두 통과 (${LIST.length}영웅)`:'\n실패 있음');process.exitCode=allOk?0:1;
