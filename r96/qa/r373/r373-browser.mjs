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
 // Codex P2: 난이도 다시 적용(R63)·R61 정규화 틱 뒤에도 우두머리 ×1.6, 복제는 원본 종류와 같은 수치
 const b2=await p.evaluate(async()=>{window.__STORYWORLD_CAMPAIGN_R63R1__?.reapplyRoom?.();await new Promise(r=>setTimeout(r,700));const rows=room.enemies.filter(e=>e.squadR373&&e.hp>0);
  const lead=rows.filter(e=>e.squadLeaderR373),plain=rows.filter(e=>!e.squadLeaderR373&&!e.r373Clone),clones=rows.filter(e=>e.r373Clone&&!e.squadLeaderR373);
  const ratio=lead.map(l=>{const m=plain.find(e=>e.nativeId===l.nativeId);return m?[l.maxHp/m.maxHp,l.damage/m.damage]:null;}).filter(Boolean);
  const cl=clones.map(c=>{const m=plain.find(e=>e.nativeId===c.nativeId);return m?[c.maxHp/m.maxHp,c.damage/m.damage]:null;}).filter(Boolean);return{ratio,cl};});
 check(z+': 난이도 다시 적용 뒤에도 우두머리 체력·공격 ×1.6',b2.ratio.length>0&&b2.ratio.every(([h,d])=>Math.abs(h-1.6)<.02&&Math.abs(d-1.6)<.02),b2.ratio);
 check(z+': 복제 몹 체력·공격 = 같은 종류 원래 몹',b2.cl.every(([h,d])=>Math.abs(h-1)<.02&&Math.abs(d-1)<.02),b2.cl);
 if(z==='dist03'){
  // Codex P2: 저장 불러오기 — R373 저장은 ×1.6 그대로(두 번 곱하지 않음), R373 이전 저장(표식 없음·우두머리 원래 수치)은 ×1.6 으로 옮김
  const sv=await p.evaluate(async()=>{const ratio=()=>{const rows=room.enemies.filter(e=>e.squadR373&&e.hp>0),plain=rows.filter(e=>!e.squadLeaderR373&&!e.r373Clone);return rows.filter(e=>e.squadLeaderR373).map(l=>{const m=plain.find(e=>e.nativeId===l.nativeId);return m?[+(l.maxHp/m.maxHp).toFixed(3),+(l.damage/m.damage).toFixed(3)]:null;}).filter(Boolean);};
   const d=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(JSON.parse(JSON.stringify(d)));await new Promise(r=>setTimeout(r,500));const a=ratio();
   const old=JSON.parse(JSON.stringify(d));delete old.squadsR373;const L=new Set(room.enemies.filter(e=>e.squadLeaderR373).map(e=>e.id));
   for(const rr of Object.values(old.rooms||{}))for(const row of rr.enemies||[])if(L.has(row.id)&&row.r61Scale){for(const k of ['maxHp','hp','damage','baseDamage'])if(Number.isFinite(row.r61Scale[k]))row.r61Scale[k]/=1.6;}
   await restoreSave(old);await new Promise(r=>setTimeout(r,500));const b=ratio();const reload=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(reload);await new Promise(r=>setTimeout(r,500));return{marker:!!d.squadsR373,a,b,c:ratio(),migrated:window.__STORYWORLD_MOB_SQUADS_R373__.inspect().stats.migrated};});
  check('저장 표식 있는 불러오기: 우두머리 ×1.6 그대로(두 번 곱하지 않음)',sv.marker&&sv.a.length>0&&sv.a.every(([h,d])=>Math.abs(h-1.6)<.02&&Math.abs(d-1.6)<.02),sv);
  check('R373 이전 저장 불러오기: 우두머리를 ×1.6 으로 옮김',sv.b.length>0&&[sv.b,sv.c].every(x=>x.every(([h,d])=>Math.abs(h-1.6)<.02&&Math.abs(d-1.6)<.02))&&sv.migrated>0,sv);}
 await p.screenshot({path:`${OUT}/${z}.jpg`,quality:70});}
check('페이지 오류 없음',!errs.length,errs);await b.close();fs.writeFileSync(`${OUT}/r373-browser.json`,JSON.stringify({fails,n,headless:true,gpu:false}));console.log(fails?`FAIL ${fails}`:`ALL ${n} PASS`);process.exit(fails?1:0);
