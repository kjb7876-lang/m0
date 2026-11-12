// R791 브라우저(헤드리스) 실측: last305 고블린 두목의 장미 인장 관문. 사용: node r96/qa/r791/r791-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await chromium.launch();const errs=[];const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
async function toExit(p){await go(p,'last305');await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'door 단계: 두목은 아직 싸우기 전이라 없음');
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='boss','보스 문의 기억 뒤 boss 단계(R790 관문 없이 그대로)');
 await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.some(e=>e.boss&&e.spawnState!=='hidden'),null,{timeout:180000});
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'boss 단계: 없음');
 await p.evaluate(()=>{for(const e of [...room.enemies])if((e.boss||e.midboss)&&e.hp>0){e.spawnState='active';e.hp=0;killEnemy(e);}});await waitPh(p,'exit');await waitT(p,.3);}
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toExit(p);
 const i0=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect());ok(i0.gate&&i0.npc&&/chief/.test(i0.npc.id),'exit 단계: 관문 + 두목 '+JSON.stringify(i0.npc));
 const geo=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2'),q=room.props.find(q=>q.r790NPC);return {dd:Math.hypot(q.x-room.objective.x,q.y-room.objective.y),bl:blocked(q.x,q.y,.3,room),doorBlocked:blocked(d.x,d.y,.27,room),done:completed('last305','STORY')};});
 ok(geo.dd<=2.4&&!geo.bl,'두목은 쓰러진 자리(제단 곁) 빈 자리 '+geo.dd.toFixed(2));ok(geo.doorBlocked,'출구 문은 닫혀 있다');ok(!geo.done,'지역은 아직 완료 전');
 await p.evaluate(()=>{const q=room.props.find(q=>q.r790NPC);player.x=room.objective.x-1.2;player.y=room.objective.y+1.6;});await waitT(p,3);
 ok((await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats.draws))>0,'두목이 실제로 그려진다');await p.screenshot({path:`${OUT}/1-chief-wide.png`});
 const q=await p.evaluate(()=>{const n=room.props.find(q=>q.r790NPC),s=project(n.x,n.y);return [s.x,s.y];});await p.screenshot({path:`${OUT}/1-chief-close.png`,clip:{x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-280)),width:560,height:400}});
 ok(/장미 인장/.test(await p.locator('#questText').textContent()),'목표 글');
 // 출구 문부터 눌러 보면: 기억은 시작되지 않고 먼저 받으라는 알림
 const atDoor=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2'),px=player.x,py=player.y;player.x=d.x+.5;player.y=d.y+2;interact();const out={modal,scene:!!storyScene,toast:document.getElementById('toast').textContent,ph:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase};player.x=px;player.y=py;return out;});
 ok(!atDoor.modal&&!atDoor.scene&&atDoor.ph==='exit'&&/장미 인장/.test(atDoor.toast),'출구 문: 인장 전에는 기억이 시작되지 않고 알림 '+JSON.stringify(atDoor));
 // 제단 곁에서 E → 창
 await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true&&!storyScene),'제단 곁 E: 창이 열리고 뒷이야기는 아직');ok(await ph(p)==='exit','단계 그대로 exit');
 const txt=await p.locator('#panel').innerText();ok(/고블린 두목/.test(txt)&&/장미 인장/.test(txt),'창 글');await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:`${OUT}/2-panel.png`});
 await p.locator('#npcWaitR790').click();ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken())),"'아직': 그대로");
 await p.evaluate(()=>interact());await p.locator('#npcTakeR790').click();ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'인장을 받음');
 const st=await p.evaluate(()=>({scene:!!storyScene,text:String(storyScene?.text||storyScene?.body||'').slice(0,40)}));ok(st.scene,'뒷이야기(정본 32장 뒷부분)로 이어진다 '+JSON.stringify(st));
 for(let i=0;i<8&&await p.evaluate(()=>!!storyScene);i++){await skip(p);await p.waitForTimeout(400);}
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2');player.x=d.x+.5;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='done';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='done','출구 문에서 done');ok(await p.evaluate(()=>completed('last305','STORY')),'지역 완료');
 ok(!(await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2');return blocked(d.x,d.y,.27,room);})),'출구 문이 열렸다');
 ok((await p.evaluate(()=>serializeSave().npcR790))?.rooms?.['STORY:last305']?.roseSeal===true,'세이브 기록');ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().lastError)),'모듈 오류 없음');await ctx.close();}
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toExit(p);await p.evaluate(()=>{guide=true;});
 await p.waitForFunction(()=>['exitStory','done'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||!!storyScene,null,{timeout:420000});
 const r=await p.evaluate(()=>({taken:window.__STORYWORLD_NPC_R790__.taken(),st:window.__STORYWORLD_NPC_R790__.inspect().stats,modal}));ok(r.taken&&r.st.auto>=1,'길잡이: 스스로 걸어가 창 없이 인장을 받고 뒷이야기로 진행 '+JSON.stringify(r.st));await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R791 브라우저(헤드리스) 검사 통과: '+n+'개');await b.close();
