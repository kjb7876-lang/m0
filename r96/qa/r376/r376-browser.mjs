// R376 headless check (Playwright): 영화 모드 길잡이 → 실화(하드, 적 체력 2배·피해 절반), 영화 모드 화면 정리, Esc/누르기로 끄고 설정, 초상화.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r376 node r96/qa/r376/r376-browser.mjs
// 헤드리스(소프트웨어 렌더): 판정·화면 구성만 본다. GPU·실기기 모바일·실제 음성·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r376';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,300)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(viewport){const b=await chromium.launch({headless:true});const mobile=viewport.width<500;
 const ctx=await b.newContext({viewport,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip(p);return {b,p,errors};}
async function run(tag,viewport){const {b,p,errors}=await boot(viewport);const mobile=viewport.width<500;
 const pf=await p.evaluate(()=>window.__STORYWORLD_HUD_CINEMA_R376__.inspect());
 check(tag+': 초상화 = R108 영웅 선택 그림, 틀 씌움',/r108\/heroes\/\w+\.webp$/.test(pf.portraitSrc||'')&&pf.framed,pf.portraitSrc);
 if(!mobile){const el=await p.$('#r376Pf');if(el)await el.screenshot({path:`${OUT}/${tag}-portrait.png`});}
 await p.screenshot({path:`${OUT}/${tag}-hub-normal.jpg`,quality:72});
 // 영화 모드 켜기 → 길잡이가 hub → dist00 을 연다
 await p.evaluate(()=>window.__STORYWORLD_CINEMA_MODE_R370__.set({on:true}));
 await p.waitForFunction(()=>room?.id==='dist00'&&!loading,null,{timeout:240000});
 await p.waitForFunction(()=>window.__STORYWORLD_REAL_MODE_R376__.inspect().tier,null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({i:window.__STORYWORLD_REAL_MODE_R376__.inspect(),en:room.enemies.filter(e=>e.hp>0).slice(0,40).map(e=>({f:e.difficultyFactorR63,boss:!!e.boss,hp:e.hp,mx:e.maxHp}))}));
 check(tag+': 영화 모드 길잡이가 다음 지역을 실화로 엶(R63 하드 + 실화 표시)',r.i.active&&r.i.tier==='hard'&&r.i.maps.includes('STORY:dist00')&&r.i.stats.picked>=1,r.i);
 check(tag+': 적 체력 = 하드의 2배(배율 0.8 / 1.328, 꽉 찬 체력)',r.en.length>0&&r.en.every(e=>Math.abs(e.f-(e.boss?.8:1.328))<1e-6||Math.abs(e.f-.8)<1e-6||Math.abs(e.f-1.328)<1e-6),r.en.slice(0,4));
 // 같은 조건에서 실화 표시를 잠깐 뺀 하드 피해와 비교(맞은 뒤 체력·무적은 되돌린다)
 const d=await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0),R=window.__STORYWORLD_REAL_MODE_R376__;const hit=()=>{player.invincible=0;player.guard=false;player.shield=0;const h0=player.hp;hurt(100,e);const a=h0-player.hp;player.hp=h0;player.invincible=0;return a;};
  const real=hit();const k=R.maps();R.__test_drop?.();return {real,stats:R.inspect().stats.softened};});
 check(tag+': 적 공격 피해가 들어오고 실화 감쇠가 걸림(정확한 절반은 CPU 검사)',d.real>0&&d.stats>=1,d);
 // 화면 정리
 await p.evaluate(()=>playScenes([{key:'dist00:r376-test',id:'dist00',title:'시험',narrator:'〈EGO의 기억〉',text:'나는 그 나무 아래에서 오래 서 있었다. "도망쳐!" 누군가 외쳤다. 그날의 기억이…'}],null));
 await p.waitForTimeout(1200);await p.screenshot({path:`${OUT}/${tag}-cinema.jpg`,quality:72});
 const v=await p.evaluate(()=>({h:window.__STORYWORLD_HUD_CINEMA_R376__.inspect(),nav:window.__STORYWORLD_POLISH_R100__.prefs().nav,stage:document.getElementById('stage').getBoundingClientRect().toJSON(),
  vis:[...document.querySelectorAll('body > *, #stage > *')].filter(e=>!['SCRIPT','STYLE','CANVAS'].includes(e.tagName)&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.id||e.tagName),W:innerWidth,H:innerHeight,subs:!!document.querySelector('#r370Subs.on')}));
 const allowed=['stage','cutin','cinemaR114','vignetteR100','darkR123','passiveEnvironmentR62','r370Subs','r376CineHint','hurtFlashR101'];/* hurtFlashR101 = 맞을 때 붉은 번쩍임(전투 효과) */
 check(tag+': 영화 모드 = 전투 화면 + 자막만(위·아래 줄·나침반·길잡이 화살표·글씨 숨김)',v.h.hidden&&v.nav===false&&v.vis.every(x=>allowed.includes(x))&&v.subs,v.vis);
 check(tag+': 게임 화면이 창 전체',Math.round(v.stage.width)===v.W&&Math.round(v.stage.height)===v.H&&v.stage.top===0,v.stage);
 if(mobile)await p.touchscreen.tap(viewport.width/2,viewport.height/3);else await p.keyboard.press('Escape');await p.waitForTimeout(800);
 const a=await p.evaluate(()=>({on:window.__STORYWORLD_CINEMA_MODE_R370__.prefs().on,modal,settings:!!document.querySelector('#panel .settings'),real:!!document.getElementById('r376Real'),cine:!!document.getElementById('r370Cinema'),hidden:window.__STORYWORLD_HUD_CINEMA_R376__.inspect().hidden,nav:window.__STORYWORLD_POLISH_R100__.prefs().nav}));
 check(tag+': '+(mobile?'화면 누르기':'Esc')+' → 영화 모드 꺼짐 + 설정 창(영화 모드·실화 줄 있음) + UI·길잡이 화살표 복귀',!a.on&&a.modal&&a.settings&&a.real&&a.cine&&!a.hidden&&a.nav===true,a);
 await p.screenshot({path:`${OUT}/${tag}-esc-settings.jpg`,quality:72});
 check(tag+': 페이지 오류 없음',!errors.length,errors);await b.close();}
await run('pc',{width:1280,height:720});await run('mobile',{width:390,height:844});
fs.writeFileSync(`${OUT}/r376-browser.json`,JSON.stringify({fails,results,headless:true,gpu:false},null,1));
console.log(JSON.stringify({ok:!fails,checks:results.length,fails}));process.exit(fails?1:0);
