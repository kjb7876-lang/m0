// R796 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): NPC 와 주고받는 한두 마디. 틀린 답 → 꾸짖음 + 몹 셋 → 물리치고 다시 대화 → 맞는 답 → 원래 서사.
//  사용: node r96/qa/r796/r796-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await chromium.launch();const errs=[];const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
const N=p=>p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect());
async function toDoor(p,z){await go(p,z);await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');await waitT(p,.3);}
async function toExit(p,z){await toDoor(p,z);await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}
 await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.some(e=>e.boss||e.midboss),null,{timeout:180000});
 await p.evaluate(()=>{for(const e of [...room.enemies])if((e.boss||e.midboss)&&e.hp>0){e.spawnState='active';e.hp=0;killEnemy(e);}});await waitPh(p,'exit');await waitT(p,.3);}
const nearNpc=p=>p.evaluate(()=>{const q=room.props.find(q=>q.r790NPC);player.x=q.x+(q.side>0?-1:1)*1.1;player.y=q.y+.9;});
const summons=p=>p.evaluate(()=>room.enemies.filter(e=>e.r796Summon&&e.hp>0&&!e.deadRecorded).map(e=>({id:e.id,name:e.name,hp:e.hp,maxHp:e.maxHp,d:Math.hypot(e.x-player.x,e.y-player.y),bl:blocked(e.x,e.y,.3,room)})));
async function flow(z,phase,first){const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(z+' '+String(e).slice(0,200)));await (phase==='door'?toDoor:toExit)(p,z);
 const i0=await N(p);ok(i0.gate&&i0.npc,z+': 관문 + 인물');ok(i0.rev.startsWith('R796'),z+': '+i0.rev);const talk=await p.evaluate(z=>window.__STORYWORLD_NPC_R790__.talk(z),z);
 await nearNpc(p);await waitT(p,1.2);await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true&&!storyScene),z+': 창');
 const txt=await p.locator('#panel').innerText();ok(txt.includes(talk.ask),z+': 인물의 한마디');for(const c of talk.choices)ok(txt.includes(c.t),z+': 답 "'+c.t+'"');ok(await p.locator('#panel .actions button').count()===4,z+': 단추 넷(답 셋 + 아직)');
 await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});if(first)await p.screenshot({path:`${OUT}/${z}-panel.png`});
 const fit=await p.evaluate(()=>{const pn=document.querySelector('#panel').getBoundingClientRect();return [...document.querySelectorAll('#panel .actions button')].every(b=>{const r=b.getBoundingClientRect();return r.left>=pn.left&&r.right<=pn.right+1&&r.bottom<=innerHeight;});});ok(fit,z+': 단추가 창 안에 들어온다');
 const before=await p.evaluate(()=>room.enemies.length);await p.locator('#npcWrongR796a').click();
 ok(await p.evaluate(()=>modal===false),z+': 틀린 답 → 창 닫힘');ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()))&&await ph(p)===phase,z+': 받지 않음, 단계 그대로 '+phase);
 let S=await summons(p);ok(S.length===3,z+': 몹 셋 소환 '+JSON.stringify(S.map(e=>[e.name,Math.round(e.hp),+e.d.toFixed(1)])));{const sp=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().events.filter(e=>e.kind==='scold').at(-1).spots.map(q=>({...q,bl:blocked(q.x,q.y,.3,room),d:Math.hypot(q.x-player.x,q.y-player.y)})));ok(sp.length===3&&sp.every(q=>!q.bl&&q.d<=5.4),z+': 나타난 자리가 비어 있고 영웅 둘레 '+JSON.stringify(sp)+' 지금 '+JSON.stringify(S.map(e=>[e.bl,+e.d.toFixed(1)])));}ok(await p.evaluate(n=>room.enemies.length===n+3,before),z+': 기존 몹 목록은 그대로 + 3');
 const wrong=talk.choices.find(c=>c.id==='npcWrongR796a');ok((await p.locator('#toast').innerText().catch(()=>''))?.includes(wrong.scold)||(await p.evaluate(s=>document.body.innerText.includes(s),wrong.scold)),z+': 꾸짖는 말이 화면에 "'+wrong.scold+'"');
 await waitT(p,.25);if(first)await p.screenshot({path:`${OUT}/${z}-scold.png`});
 // 몰려온다: 게임 시간 4초 뒤 영웅과의 거리가 줄거나 이미 붙었다
 const d0=S.map(e=>e.d);await waitT(p,4);S=await summons(p);ok(S.length===3,z+': 4초 뒤에도 셋(영웅 무적)');ok(S.every((e,i)=>e.d<d0[i]-.2||e.d<2.2)&&S.some((e,i)=>e.d<d0[i]-.5||e.d<2.2),z+': 영웅에게 다가온다(원거리 몹은 사거리에서 멈춤) '+JSON.stringify(S.map((e,i)=>[+d0[i].toFixed(1),+e.d.toFixed(1)])));
 if(first)await p.screenshot({path:`${OUT}/${z}-mobs.png`});
 ok(/물리치고 다시 말/.test(await p.locator('#questText').textContent()),z+': 목표 글');
 await nearNpc(p);await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===false&&!storyScene),z+': 몹이 남으면 다시 말 못 검');ok(await ph(p)===phase,z+': 단계 그대로');
 // 엔진 처치 길로 잡는다
 await p.evaluate(()=>{for(const e of room.enemies.filter(e=>e.r796Summon&&e.hp>0)){e.hp=0;killEnemy(e);}});await waitT(p,.3);ok((await summons(p)).length===0,z+': 불러낸 몹을 잡을 수 있다');ok(await ph(p)===phase,z+': 잡아도 단계 그대로');
 await nearNpc(p);await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true),z+': 다 잡으면 다시 창');await p.locator('#npcTakeR790').click();ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),z+': 맞는 답 → 받음');
 const i1=await N(p);ok(i1.stats.wrong===1&&i1.stats.summoned===3&&!i1.lastError,z+': 통계·오류 없음 '+JSON.stringify(i1.stats)+' '+i1.lastError);
 ok(Object.keys((await p.evaluate(()=>serializeSave().npcR790)).rooms['STORY:'+z]).length===1,z+': 세이브 낱말 하나(갈래 없음)');
 if(phase==='door'){await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;if(!storyScene&&window.__STORYWORLD_WORLD_COMBAT_R78__.state(room).phase==='door')interact();});
  for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='boss',z+': 원래대로 보스 문의 기억 → boss');}
 await ctx.close();}
await flow('last303','door',true);await flow('murder04','door',true);await flow('ep1a10','exit',true);
// 길잡이: 창·소환 없이 맞는 답
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toDoor(p,'last303');await p.evaluate(()=>{guide=true;});
 await p.waitForFunction(()=>['doorStory','boss'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||!!storyScene,null,{timeout:420000});
 const r=await N(p);ok(r.taken&&r.stats.auto>=1&&r.stats.wrong===0&&r.stats.summoned===0,'길잡이: 창·소환 없이 진행 '+JSON.stringify(r.stats));await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R796 브라우저(헤드리스) 검사 통과: '+n+'개');await b.close();
