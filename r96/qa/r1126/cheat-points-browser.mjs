// R1126 헤드리스 브라우저: 실제 코드 창에서 777 → 패시브 포인트 칸, 지정한 값 적용, 경계값, 레벨 적용과 함께 쓰기, 저장·불러오기·복귀.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node cheat-points-browser.mjs <출력폴더> <URL>
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL]=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const log={checks:[]};
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const ok=(c,m,d)=>{log.checks.push({ok:!!c,m,d});console.log(c?'PASS':'FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));};
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const P=()=>p.evaluate(()=>({level:player.level,points:player.points,active:__STORYWORLD_CHEAT777__.active()}));
const open=async()=>{await p.evaluate(()=>{if(modal)closePanel(true);document.getElementById('story-code-button').click();});await p.waitForFunction(()=>!!document.getElementById('r1126PointsRow'),null,{timeout:60000});};
const field=async(v,how)=>{await p.locator('#r1126Points').fill(v);if(how==='enter')await p.locator('#r1126Points').press('Enter');else await p.locator('#r1126PointsApply').click();await p.waitForTimeout(150);return P();};
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();
const before=await P();
await open();
ok(await p.locator('#r1126PointsRow').isHidden(),'777 을 적기 전에는 패시브 포인트 칸이 숨어 있음');
await p.locator('#story-code-input').fill('777');
ok(await p.locator('#r1126PointsRow').isVisible()&&await p.locator('#r970LevelRow').isVisible(),'777 을 적으면 레벨 칸과 패시브 포인트 칸이 함께 나옴');
await p.screenshot({path:OUT+'/r1126-fields.png'});
// 켜면서 레벨 30 + 패시브 포인트 500 을 한 번에
await p.locator('#r970Level').fill('30');await p.locator('#r1126Points').fill('500');await p.locator('#codeApply').click();
await p.waitForFunction(()=>__STORYWORLD_CHEAT777__.active()&&player.points===500,null,{timeout:20000}).catch(()=>{});
let a=await P();ok(a.active&&a.level===30&&a.points===500,'켜면서 레벨 30 · 패시브 포인트 500 그대로',a);
await p.waitForFunction(()=>!!document.getElementById('r1126PointsApply'),null,{timeout:10000}).catch(()=>{});
ok(await p.locator('#r1126PointsApply').isVisible()&&await p.locator('#r1126Points').inputValue()==='500','켜진 뒤 창에 포인트 적용 단추 · 칸에 500',await p.locator('#r1126Points').inputValue());
await p.screenshot({path:OUT+'/r1126-active.png'});
a=await field('0');ok(a.points===0,'0 적용',a);
a=await field('-5');ok(a.points===0,'음수 → 0',a);
a=await field('99999999','enter');ok(a.points===999999,'큰 수 → 999999 (Enter)',a);
a=await field('');ok(a.points===999999&&/숫자로 적어/.test(await p.locator('#codeMessage').textContent()),'빈칸 거절·안내 글',a);
a=await field('42');ok(a.points===42&&/패시브 포인트 42점/.test(await p.locator('#codeMessage').textContent()),'42 적용·상태 글',a);
// 레벨 적용은 레벨 규칙대로 더하고, 칸은 바뀐 값을 보여 줌
await p.locator('#r970Level').fill('40');await p.locator('#r970LevelApply').click();await p.waitForTimeout(200);
a=await P();ok(a.level===40&&a.points===52,'레벨 30→40 적용은 +10(42→52)',a);
await open();ok(await p.locator('#r1126Points').inputValue()==='52','창을 다시 열면 칸에 지금 포인트 52');
// 777 저장·불러오기·복귀
await p.evaluate(()=>closePanel(true));
// 넣은 포인트는 실제 강화에 쓰인다: 자동 스킬레벨업(R237, 기본 켜짐)이 창을 닫으면 알아서 산다
{const u0=await p.evaluate(()=>JSON.stringify(player.upgrades));await p.evaluate(()=>window.__STORYWORLD_CHEAT_POINTS_R1126__.setPoints(30));
 await p.waitForFunction(()=>player.points<30,null,{timeout:60000}).catch(()=>{});const u1=await p.evaluate(()=>JSON.stringify(player.upgrades));a=await P();
 ok(a.points<30&&u1!==u0,'넣은 30점으로 자동 스킬레벨업이 강화를 삼(포인트가 실제로 쓰임)',{a,changed:u1!==u0});}
// 저장·불러오기 비교 동안만 자동 스킬레벨업을 끈다(검사 도구 안에서만, 끝나면 다시 켬)
await p.evaluate(()=>window.__STORYWORLD_AUTOLEVEL_R237__?.set(false));
await p.evaluate(()=>{player.points=0;});const s0=await p.evaluate(()=>window.__STORYWORLD_CHEAT_POINTS_R1126__.setPoints(9));
const saved=await p.evaluate(()=>saveGame(false));await p.evaluate(()=>{player.points=1;});
await p.evaluate(async()=>__STORYWORLD_CHEAT777__.load());await p.waitForFunction(()=>!loading,null,{timeout:120000}).catch(()=>{});
a=await P();ok(s0.ok&&saved&&a.points===9,'777 저장·불러오기 뒤 9 유지',a);
await p.evaluate(()=>window.__STORYWORLD_AUTOLEVEL_R237__?.set(true));
await p.evaluate(async()=>__STORYWORLD_CHEAT777__.leave());await p.waitForFunction(()=>!loading,null,{timeout:120000}).catch(()=>{});
a=await P();ok(!a.active&&a.points===before.points&&a.level===before.level,'일반 진행 복귀 → 원래 포인트',{a,before});
const r=await p.evaluate(()=>window.__STORYWORLD_CHEAT_POINTS_R1126__.setPoints(77));a=await P();ok(!r.ok&&a.points===before.points,'일반 진행에서는 거절',r);
ok(errs.length===0,'페이지 오류 없음',errs);
log.errs=errs;fs.writeFileSync(OUT+'/r1126-browser.json',JSON.stringify(log,null,2));await b.close();
const bad=log.checks.filter(x=>!x.ok).length;console.log(bad?'R1126 브라우저 '+bad+'개 실패':'R1126 브라우저 '+log.checks.length+'개 통과');process.exit(bad?1:0);
