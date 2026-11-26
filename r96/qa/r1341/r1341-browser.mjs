// R1341 브라우저(헤드리스) 실측: ep1a11 보스를 쓰러뜨린 뒤 제단 곁 인물이 미카엘라(영웅 서 있기 그림·Dots 흉상)인지, 창·길잡이·세이브. R792 검사 틀을 그대로 씀.
// 사용: node r96/qa/r1341/r1341-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await chromium.launch();const errs=[];const ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitPh=(p,v)=>p.waitForFunction(v=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase===v,v,{timeout:180000});
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:240000}));
async function toExit(p,z){await go(p,z);await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await waitPh(p,'rally');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.x=e.y=-900;e.hp=0;killEnemy(e);}});await waitPh(p,'door');
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'door 단계: 아직 없음');
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='boss','보스 문의 기억 뒤 boss 단계');
 await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.some(e=>e.boss||e.midboss),null,{timeout:180000});
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'boss 단계: 없음');
 await p.evaluate(()=>{for(const e of [...room.enemies])if((e.boss||e.midboss)&&e.hp>0){e.spawnState='active';e.hp=0;killEnemy(e);}});await waitPh(p,'exit');await waitT(p,.3);}
for(const Z of [{id:'ep1a11',kind:'michaela',flag:'heardWorlds',name:'미카엘라',take:'이야기를 듣는다',word:/미카엘라/}/* R1341 사용자 지시: 남자 의목사 → 미카엘라 */]){console.log('── '+Z.id);
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toExit(p,Z.id);
 const i0=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect());ok(i0.gate&&i0.npc&&i0.npc.id.endsWith(':'+Z.kind),'exit 단계: 관문 + 인물 '+JSON.stringify(i0.npc));
 const geo=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2'),q=room.props.find(q=>q.r790NPC);return {dd:Math.hypot(q.x-room.objective.x,q.y-room.objective.y),bl:blocked(q.x,q.y,.3,room),doorBlocked:blocked(d.x,d.y,.27,room),done:completed(zone,'STORY')};});
 ok(geo.dd<=2.4&&!geo.bl,'인물은 제단 곁 빈 자리 '+geo.dd.toFixed(2));ok(geo.doorBlocked,'출구 문은 닫혀 있다');ok(!geo.done,'지역은 아직 완료 전');
 await p.evaluate(()=>{const q=room.props.find(q=>q.r790NPC);player.x=room.objective.x-1.2;player.y=room.objective.y+1.6;});await waitT(p,3);
 ok((await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats.draws))>0,'인물이 실제로 그려진다');
 {const im=await p.evaluate(()=>new Promise(r=>{const t0=performance.now(),k=()=>{const q=readyImage('assets/r710/michaela/idle-s.webp');if(q&&q.image)r([q.image.naturalWidth,q.image.naturalHeight]);else if(performance.now()-t0>30000)r(null);else setTimeout(k,200);};k();}));ok(im&&im[0]===1152&&im[1]===256,'미카엘라 서 있기 6칸 시트 '+im);}await p.screenshot({path:`${OUT}/${Z.id}-1-wide.png`});
 const q=await p.evaluate(()=>{const n=room.props.find(q=>q.r790NPC),s=project(n.x,n.y);return [s.x,s.y];});await p.screenshot({path:`${OUT}/${Z.id}-1-close.png`,clip:{x:Math.max(0,Math.min(1280-560,q[0]-280)),y:Math.max(0,Math.min(720-400,q[1]-280)),width:560,height:400}});
 ok(Z.word.test(await p.locator('#questText').textContent()),'목표 글');
 // 출구 문부터 눌러 보면: 기억은 시작되지 않고 먼저 받으라는 알림
 const atDoor=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2'),px=player.x,py=player.y;player.x=d.x+.5;player.y=d.y+2;interact();const out={modal,scene:!!storyScene,toast:document.getElementById('toast').textContent,ph:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase};player.x=px;player.y=py;return out;});
 ok(!atDoor.modal&&!atDoor.scene&&atDoor.ph==='exit'&&Z.word.test(atDoor.toast),'출구 문: 받기 전에는 기억이 시작되지 않고 알림 '+JSON.stringify(atDoor));
 // 제단 곁에서 E → 창
 await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true&&!storyScene),'제단 곁 E: 창이 열리고 뒷이야기는 아직');ok(await ph(p)==='exit','단계 그대로 exit');
 const txt=await p.locator('#panel').innerText();ok(txt.includes(Z.name)&&txt.includes(Z.take)&&!/남자/.test(txt),'창 글(남자 의목사 아님)');ok(await p.evaluate(()=>document.querySelector('#panel img')?.getAttribute('src')==='./assets/r1341/npc/michaela-bust.webp'),'창 흉상 = 미카엘라');await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});await p.screenshot({path:`${OUT}/${Z.id}-2-panel.png`});
 await p.locator('#npcWaitR790').click();ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken())),"'아직': 그대로");
 await p.evaluate(()=>interact());await p.locator('#npcTakeR790').click();ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'받음');
 const st=await p.evaluate(()=>({scene:!!storyScene,text:String(storyScene?.text||storyScene?.body||'').slice(0,40)}));ok(st.scene,'뒷이야기로 이어진다 '+JSON.stringify(st));
 for(let i=0;i<8&&await p.evaluate(()=>!!storyScene);i++){await skip(p);await p.waitForTimeout(400);}
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2');player.x=d.x+.5;player.y=d.y+2;interact();});
 for(let i=0;i<8&&await ph(p)!=='done';i++){await skip(p);await p.waitForTimeout(400);}ok(await ph(p)==='done','출구 문에서 done');ok(await p.evaluate(()=>completed(zone,'STORY')),'지역 완료');
 ok(!(await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-2');return blocked(d.x,d.y,.27,room);})),'출구 문이 열렸다');
 ok((await p.evaluate(()=>serializeSave().npcR790))?.rooms?.['STORY:'+Z.id]?.[Z.flag]===true,'세이브 기록');ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().lastError)),'모듈 오류 없음');await ctx.close();}
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toExit(p,Z.id);await p.evaluate(()=>{guide=true;});
 await p.waitForFunction(()=>['exitStory','done'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||!!storyScene,null,{timeout:420000});
 const r=await p.evaluate(()=>({taken:window.__STORYWORLD_NPC_R790__.taken(),st:window.__STORYWORLD_NPC_R790__.inspect().stats,modal}));ok(r.taken&&r.st.auto>=1,'길잡이: 스스로 걸어가 창 없이 받고 뒷이야기로 진행 '+JSON.stringify(r.st));await ctx.close();}

}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));console.log('R1341 브라우저(헤드리스) 검사 통과: '+n+'개');await b.close();
