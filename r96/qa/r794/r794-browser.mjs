// R794 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): murder04 한이경에게 사실을 밝히자고 전하기. 사용: node r96/qa/r794/r794-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await chromium.launch();const errs=[];const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
const clip=q=>({x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-250)),width:560,height:400});
async function toDoor(p){await go(p,'murder04');await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');await waitT(p,.3);}
// 전(끔) 장면
{const {ctx,p}=await boot(b,{init:{'storyworld.r790.npc':'{"on":false}'}});await toDoor(p);await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-1.2;player.y=d.y+3.6;});await waitT(p,6);
 const q=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0'),s=project(d.x+1,d.y+2.4);return [s.x,s.y];});await p.screenshot({path:`${OUT}/before-close.png`,clip:clip(q)});await ctx.close();}
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toDoor(p);
 const i0=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect());ok(i0.gate&&i0.npc&&i0.npc.id.endsWith(':yigyeong'),'door 단계: 관문 + 한이경 '+JSON.stringify(i0.npc));
 const geo=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0'),q=room.props.find(q=>q.r790NPC);return {dd:Math.hypot(q.x-d.x,q.y-d.y),bl:blocked(q.x,q.y,.3,room),doorBlocked:blocked(d.x,d.y,.27,room)};});
 ok(geo.dd<3.2&&!geo.bl,'보스 문 곁 빈 자리 '+geo.dd.toFixed(2));ok(geo.doorBlocked,'보스 문은 닫혀 있다');
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-1.2;player.y=d.y+3.6;});await waitT(p,6);
 ok((await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats.draws))>0,'한이경이 실제로 그려진다');await p.screenshot({path:`${OUT}/after-wide.png`});
 const q=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0'),s=project(d.x+1,d.y+2.4);return [s.x,s.y];});await p.screenshot({path:`${OUT}/after-close.png`,clip:clip(q)});
 ok(/한이경/.test(await p.locator('#questText').textContent()),'목표 글');
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-.6;player.y=d.y+2.9;interact();});
 ok(await p.evaluate(()=>modal===true&&!storyScene),'문 앞 E: 창이 열리고 기억은 아직');ok(await ph(p)==='door','단계 그대로 door');
 const txt=await p.locator('#panel').innerText();ok(txt.includes('한이경')&&txt.includes('사실을 밝히자고 전한다'),'창 글');await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:`${OUT}/panel.png`});
 await p.locator('#npcWaitR790').click();ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()))&&await ph(p)==='door',"'아직': 그대로");
 await p.evaluate(()=>interact());await p.locator('#npcTakeR790').click();ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'뜻을 전함');
 ok(await p.evaluate(()=>!!storyScene)||['doorStory','boss'].includes(await ph(p)),'보스 문의 기억으로 이어진다 '+await ph(p));
 for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='boss','boss 단계');
 ok((await p.evaluate(()=>serializeSave().npcR790))?.rooms?.['STORY:murder04']?.toldTruth===true,'세이브 기록');ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().lastError)),'모듈 오류 없음');await ctx.close();}
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toDoor(p);await p.evaluate(()=>{guide=true;});
 await p.waitForFunction(()=>['doorStory','boss'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||!!storyScene,null,{timeout:420000});
 const r=await p.evaluate(()=>({taken:window.__STORYWORLD_NPC_R790__.taken(),st:window.__STORYWORLD_NPC_R790__.inspect().stats}));ok(r.taken&&r.st.auto>=1,'길잡이: 창 없이 전하고 진행 '+JSON.stringify(r.st));await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R794 브라우저(헤드리스) 검사 통과: '+n+'개');await b.close();
