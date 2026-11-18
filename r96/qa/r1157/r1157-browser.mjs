// R1157 헤드리스 확인: EGO 로 R 키 → 영웅 하나 소환, 7초 동안 스킬 0.7초 쿨로 싸우고 사라짐, R1145 은빛 거성·심연 왜성 그대로.
//  (헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1157/r1157-browser.mjs [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
const W=960,H=540;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<6000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));},s);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{enterRegion('dist02',null,{restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist02',null,{timeout:200000});await skip();await waitG(1.5);
ok(await p.evaluate(()=>!safeRegion()&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()&&window.__STORYWORLD_EGO_KIT_R1094__.active()),'전투 지역 · EGO 형상');
// 적을 가까이 모으고 오래 버티게
await p.evaluate(()=>{player.maxHp=player.hp=1e6;player.invincible=1e6;const es=room.enemies.filter(e=>e.hp>0).slice(0,8);es.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.x=player.x+2.5+(i%3)*.8;e.y=player.y+(i/3|0)*.8-.8;});
 for(const e of room.enemies)if(!es.includes(e)){e.x=player.x+40;e.y=player.y+40;}for(const k in player)if(/CD$/.test(k))player[k]=0;const R=player.storyWER?.ready;if(R)for(const k in R)if(R[k]-time<100)R[k]=0;});
await waitG(.3);
const c0=await p.evaluate(()=>({cel:window.__STORYWORLD_EGO_CELESTIAL_R1145__.inspect().stats.rCasts,kit:window.__STORYWORLD_EGO_KIT_R1094__.inspect().stats.r}));
await p.keyboard.press('r');await waitG(.25);
const s1=await p.evaluate(()=>({i:window.__STORYWORLD_EGO_SUMMON_R1157__.inspect(),bodies:window.__STORYWORLD_EGO_SUMMON_R1157__.bodies().map(b=>({hero:b.hero,ego:b.egoSovereignR1046,persona:b.personaHeroR1113})),t:time,rdy:player.storyWER?.ready?.['hwando:r']-time}));
ok(s1.i.live===1&&s1.bodies.length===1,'R 키 → 영웅 1명 소환',s1);
ok(s1.bodies.every(b=>b.hero!=='hwando'&&b.ego!==true&&b.persona!==true),'소환 영웅은 기본 영웅(환도·EGO·페르소나 아님)',s1.bodies);
if(SH)await p.screenshot({path:SH+'/summon-0.3s.png'});
await waitG(1.4);if(SH)await p.screenshot({path:SH+'/summon-1.7s.png'});
await waitG(2.5);if(SH)await p.screenshot({path:SH+'/summon-4.2s.png'});
const s2=await p.evaluate(()=>window.__STORYWORLD_EGO_SUMMON_R1157__.inspect());
const cast=s2.stats.casts;ok(cast.q+cast.w+cast.e+cast.r>=6,'4초 동안 스킬(Q·W·E·R) 여러 번 — 0.7초 쿨',cast);
ok(s2.stats.hits>0,'소환 영웅 타격이 엔진 hitEnemy 로 들어감',s2.stats.hits);
const c1=await p.evaluate(()=>({cel:window.__STORYWORLD_EGO_CELESTIAL_R1145__.inspect().stats.rCasts,kit:window.__STORYWORLD_EGO_KIT_R1094__.inspect().stats.r}));
ok(c1.kit>c0.kit&&c1.cel>c0.cel,'R 원래 효과 유지: 협주 기술 R(R1094) + 은빛 거성·심연 왜성(R1145)',{c0,c1});
ok(await p.evaluate(()=>player.hero==='hwando'&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()),'조종은 계속 EGO');
await waitG(3.4);
const s3=await p.evaluate(()=>({i:window.__STORYWORLD_EGO_SUMMON_R1157__.inspect(),props:room.props.filter(p=>p&&p.r1157Prop).length}));
ok(s3.i.live===0&&s3.props===0,'7초 뒤 사라짐(소품도 걷힘)',s3);
ok(s3.i.stats.errors===0,'R1157 오류 0',s3.i.lastError);
ok(errs.length===0,'페이지 오류 없음',errs.slice(0,3));
if(SH)fs.writeFileSync(SH+'/inspect.json',JSON.stringify({s1,s2,s3,c0,c1},null,1));
console.log(`\nR1157 브라우저(헤드리스): ${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
