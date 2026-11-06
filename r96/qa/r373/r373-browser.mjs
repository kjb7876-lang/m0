// R373 headless — 지역에 들어서면 같은 종류 몹이 분대(최대 6)로 모이고 분대마다 '<종류> 우두머리' 한 마리(체력 ×1.6). 입장 시간이 늘지 않는지도 본다.
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=out/r373 node r96/qa/r373/r373-browser.mjs
// Headless Chromium: 판정·배치·이름표만 본다. GPU·실기기·자연 플레이 미검증(임시).
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r373';fs.mkdirSync(OUT,{recursive:true});
let fails=0,n=0;const check=(m,c,i)=>{n++;if(!c)fails++;console.log((c?'PASS ':'FAIL ')+m+(i===undefined?'':' '+JSON.stringify(i).slice(0,260)));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
for(const z of ['dist00','dist03','ep1a10']){const t=Date.now();await p.evaluate(z=>{enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});const ms=Date.now()-t;
 await p.waitForTimeout(600);await skip();await p.waitForTimeout(900);
 const a=await p.evaluate(()=>{const A=window.__STORYWORLD_MOB_SQUADS_R373__.inspect();const plain=room.enemies.filter(e=>e.squadR373&&!e.squadLeaderR373);return {A,plainHp:plain[0]?.maxHp};});
 const sq={};for(const r of a.A.room)(sq[r.squad]=sq[r.squad]||[]).push(r);const S=Object.values(sq);
 const leaders=S.map(v=>v.filter(r=>r.leader));const spread=S.map(v=>{const L=v.find(r=>r.leader);return Math.max(...v.map(r=>Math.hypot(r.x-L.x,r.y-L.y)));});
 check(z+': 분대마다 정확히 6마리',S.every(v=>v.length===6),S.map(v=>v.length));
 check(z+': 분대 3개 이상·분대마다 우두머리 1마리',S.length>=3&&leaders.every(l=>l.length===1),S.map(v=>v.length));
 check(z+': 이름 = 종류 + 우두머리',leaders.flat().every(l=>/ 우두머리$/.test(l.name)&&!/\d 우두머리$/.test(l.name)),leaders.flat().map(l=>l.name));
 check(z+': 우두머리 최대 체력 ≈ 분대원 ×1.6',leaders.flat().every(l=>Math.abs(l.maxHp/a.plainHp-1.6)<.02),{lead:leaders.flat()[0]?.maxHp,plain:a.plainHp});
 check(z+': 분대원이 우두머리 둘레(3칸 안)에 모임',spread.every(s=>s<=3),spread.map(s=>s.toFixed(1)));
 check(z+': 입장 25초 안(분대 정리가 무거운 미리 만들기에서 돌지 않음)',ms<25000,ms);
 await p.screenshot({path:`${OUT}/${z}.jpg`,quality:70});}
check('페이지 오류 없음',!errs.length,errs);await b.close();fs.writeFileSync(`${OUT}/r373-browser.json`,JSON.stringify({fails,n,headless:true,gpu:false}));console.log(fails?`FAIL ${fails}`:`ALL ${n} PASS`);process.exit(fails?1:0);
