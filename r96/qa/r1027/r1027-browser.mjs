// R1027 헤드리스 브라우저 검사 — 8영웅이 실제로 그린 명령(Three 기록기 captureVisual)에서
//  ① 영웅 쪽 PXF 픽셀 아틀라스(도트) 0, ② R163 영웅 픽셀 시트(heal-aoe·level-up·crit-hit) 0, ③ 정지 보호막·회복 문장(v300 sigil) 0,
//  ④ R1027 칠한 시트가 그려지고 시트마다 서로 다른 칸 ≥4(애니메이션), ⑤ 페이지 오류·R1027 내부 오류 0, 그린 좌표 유한.
//  상황: 몹 옆에서 기본공격·스킬 8키 순환 + 막기(guardStart)·레벨업(gainXP)·흡혈 회복을 실제 엔진 함수로 일으킨다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1027/r1027-browser.mjs [영웅…]  (게임 그래픽 검증 아님 — 헤드리스 소프트웨어 렌더)
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const LIST=process.argv.slice(2).filter(a=>!a.startsWith('--'));const HEROES=LIST.length?LIST:ALL;const SEC=+(process.env.SW_SEC||16);
const OUT=process.env.SW_OUT||path.join(HERE,'browser-results.json');
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MELEE=new Set(['hwando','neon','lauren','slayer']);
const PROBE=`(()=>{if(window.__T1027)return;const out={dots:{},r163:{},sigil:{},painted:{},nan:0,frames:0};const rects={};
function scan(){let cs=[];try{cs=window.__STORYWORLD_PHASE1__.captureVisual();}catch(e){out.captureErr=String(e).slice(0,160);return;}out.frames++;
 for(const c of cs){if(c.kind!=='image')continue;const p=String(c.sourcePath||'');const o=c.owner||{};
  if(o.pxf&&o.pxfSide!=='enemy'&&/pxf-baked/.test(p)){const k=(o.pxfKey||'?')+'|'+(o.pxfStage||'?');out.dots[k]=(out.dots[k]||0)+1;}
  const m=p.match(/r163\\/pixelfx\\/(heal-aoe|level-up|crit-hit)/);if(m)out.r163[m[1]]=(out.r163[m[1]]||0)+1;
  const s=p.match(/v300\\/(barrier-sigil|healing-sigil)/);if(s)out.sigil[s[1]]=(out.sigil[s[1]]||0)+1;
  const r=p.match(/assets\\/r1027\\/([\\w-]+)\\.webp/)||((o.pxf||o.r1027)&&p.match(/(r912\\/pj02-hit|r948\\/heart-hit6)\\.webp/));if(r){out.painted[r[1]]=(out.painted[r[1]]||0)+1;(rects[r[1]]=rects[r[1]]||new Set()).add(String(c.sourceRect));
   if(!(c.points||[]).every(q=>Number.isFinite(q[0])&&Number.isFinite(q[1])))out.nan++;}}}
window.__T1027={scan,dump(){const R={};for(const [k,v] of Object.entries(rects))R[k]=v.size;let ins=null;try{ins=window.__STORYWORLD_HERO_PAINT_R1027__?.inspect?.();}catch(_){}return {...out,rects:R,r1027:ins?{errors:ins.stats?.errors,lastError:ins.lastError,replaced:ins.stats?.replaced}:null};}};})();`;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(b,hero){const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await p.evaluate(async()=>{if(zone!=='dist00')await enterRegion('dist00',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:150000});await skip(p);
 await p.addScriptTag({content:HELPER});await p.addScriptTag({content:PROBE});return {ctx,p,errs};}
const run=(p,n)=>p.evaluate(n=>{for(let j=0;j<n;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}if(j%3===0)__T1027.scan();}},n);
const b=await chromium.launch();const rows=[];let fails=0;
for(const hero of HEROES){const t0=Date.now();let s,res={hero};
 try{s=await boot(b,hero);const {p}=s;const keys=['a','s','d','f','q','w','e','r'];let i=0;
  for(let t=0;t<SEC;t+=.5){if(t%4===0){await skip(p);await p.evaluate(m=>{const e=__HQ795.engage(m,[]);if(!e){const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);}},MELEE.has(hero));}
   await p.evaluate(()=>{for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number'&&player[k]>0)player[k]=0;if(typeof player.resonance==='number')player.resonance=Math.max(player.resonance,100);player.hp=Math.max(player.hp,maxHP()*.8);});
   const k=keys[i++%keys.length];await p.keyboard.down(k);await run(p,15);await p.keyboard.up(k);
   if(t%2===0)await p.evaluate(()=>{try{guardStart();}catch(_){}});await run(p,12);await p.evaluate(()=>{try{guardEnd();}catch(_){}});
   if(t%4===1)await p.evaluate(()=>{try{gainXP(levelCost(player.level));}catch(_){}try{player.hp=Math.max(1,player.hp-8);fx('sigil',player.x,player.y,{asset:VFX.heal,size:.55,life:.24});player.hp+=4;}catch(_){}});await run(p,6);}
  const d=await p.evaluate(()=>__T1027.dump());res={hero,...d,errs:s.errs.slice(0,6)};
 }catch(e){res.fail=String(e).slice(0,400);}
 const chk=[];const add=(c,m)=>{chk.push({pass:!!c,m});if(!c)fails++;};
 add(!res.fail,'실행: '+(res.fail||'ok'));
 add(res.frames>40,`그리기 표본 ${res.frames}장`);
 add(Object.keys(res.dots||{}).length===0,'영웅 쪽 PXF 도트 0: '+JSON.stringify(res.dots||{}));
 add(Object.keys(res.r163||{}).length===0,'R163 영웅 픽셀 시트 0: '+JSON.stringify(res.r163||{}));
 add(Object.keys(res.sigil||{}).length===0,'정지 보호막·회복 문장 0: '+JSON.stringify(res.sigil||{}));
 const pk=Object.keys(res.painted||{});add(pk.length>=2,'R1027 칠한 시트 그려짐: '+JSON.stringify(res.painted||{}));
 add(pk.every(k=>(res.rects?.[k]||0)>=4),'시트마다 다른 칸 ≥4: '+JSON.stringify(res.rects||{}));
 add((res.nan||0)===0,'칠한 그림 좌표 유한(NaN 0)');
 add((res.errs||[]).length===0,'페이지 오류 0: '+JSON.stringify(res.errs||[]));
 add(!!res.r1027&&res.r1027.errors===0,'R1027 내부 오류 0: '+JSON.stringify(res.r1027));
 for(const c of chk)console.log(`${c.pass?'ok  ':'FAIL'} ${hero} ${c.m}`.slice(0,330));
 rows.push({hero,secs:((Date.now()-t0)/1000|0),checks:chk,raw:res});try{await s?.ctx.close();}catch(_){}}
await b.close();fs.writeFileSync(OUT,JSON.stringify(rows,null,1));console.log(`\n${fails?'FAIL '+fails:'모두 통과'} (${HEROES.length}영웅)`);process.exit(fails?1:0);
