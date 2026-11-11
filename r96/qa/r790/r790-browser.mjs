// R790 브라우저(헤드리스) 실측: last303 에서 귀비탕 관문이 실제 엔진 위에서 도는지.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r790/r790-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const b=await chromium.launch();const errs=[];
const API='window.__STORYWORLD_NPC_R790__',ph=p=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d,[t0,dt],{timeout:120000}));
async function toDoorPhase(p){await go(p,'last303');await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;});
 ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().applies),'last303: 적용 대상');ok(await ph(p)==='route','처음 단계 route');
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'route 단계엔 NPC 없음');
 await p.evaluate(()=>{const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await p.waitForFunction(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase==='rally',null,{timeout:120000});
 ok(!(await p.evaluate(()=>room.props.some(q=>q.r790NPC))),'rally 단계엔 NPC 없음');
 await p.evaluate(()=>{for(const e of [...room.enemies])if(!e.boss&&!(e.midboss&&!e.wardChampionR81)&&e.hp>0){e.hp=0;killEnemy(e);}});
 await p.waitForFunction(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase==='door',null,{timeout:120000});await waitT(p,.2);}
// ── 1: 손으로 누르는 플레이 ──
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toDoorPhase(p);
 const i0=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect());ok(i0.gate&&i0.npc,'door 단계: 관문 + NPC '+JSON.stringify(i0.npc));
 const geo=await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0'),q=room.props.find(q=>q.r790NPC);return {dd:Math.hypot(q.x-d.x,q.y-d.y),bl:blocked(q.x,q.y,.3,room),doorBlocked:blocked(d.x,d.y,.27,room),boss:room.enemies.find(e=>e.boss).spawnState};});
 ok(geo.dd<3.2&&!geo.bl,'NPC 는 문 3.2칸 안 빈 자리 '+geo.dd.toFixed(2));ok(geo.doorBlocked,'보스 문은 닫혀 있다');ok(geo.boss==='hidden','불면귀는 아직 숨어 있다');
 // 문 앞으로 가서 장면 찍기(카메라가 따라올 때까지 게임 시간으로 기다림)
 await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');player.x=d.x-.6;player.y=d.y+2.9;});await waitT(p,2.5);
 const drew=await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().stats.draws);ok(drew>0,'NPC 가 실제로 그려진다(draws '+drew+')');
 const im=await p.evaluate(()=>{const r=readyImage('assets/r790/npc/youth-idle6.webp');return r&&r.image?[r.image.naturalWidth,r.image.naturalHeight]:null;});ok(im&&im[0]===2304&&im[1]===384,'그림(R792: Dots 6칸 시트)이 실렸다 '+im);
 await p.screenshot({path:`${OUT}/1-npc-at-door.png`});
 const q=await p.evaluate(()=>{const n=room.props.find(q=>q.r790NPC),s=project(n.x,n.y);return [s.x,s.y];});await p.screenshot({path:`${OUT}/1-npc-close.png`,clip:{x:Math.max(0,Math.min(1280-520,q[0]-260)),y:Math.max(0,Math.min(720-420,q[1]-300)),width:520,height:420}});
 ok(/앳된 남자/.test(await p.locator('#questText').textContent()),'목표 글에 앳된 남자·귀비탕');
 // 핵 봉인
 const sealed=await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss);const hp0=B.hp;B.hp=0;const r=killEnemy(B);const out={r,hp:B.hp,dead:!!B.deadRecorded};B.hp=hp0;return out;});ok(sealed.r===false&&sealed.hp>=1&&!sealed.dead,'귀비탕 없이는 불면귀가 쓰러지지 않는다 '+JSON.stringify(sealed));
 // E → 창
 await p.evaluate(()=>interact());ok(await p.evaluate(()=>modal===true&&!storyScene),'E: 창이 열리고 기억은 아직');ok(await ph(p)==='door','단계 그대로 door');
 const txt=await p.locator('#panel').innerText();ok(/앳된 남자/.test(txt)&&/귀비탕/.test(txt),'창 글');await p.waitForFunction(()=>{const i=document.querySelector('#panel img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:30000});ok(true,'상반신 그림이 실렸다');
 await p.screenshot({path:`${OUT}/2-panel.png`});
 await p.locator('#npcWaitR790').click();ok(await p.evaluate(()=>!modal),"'아직': 닫힘");ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken())),'아직 안 마심');
 await p.evaluate(()=>interact());await p.locator('#npcTakeR790').click();
 ok(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.taken()),'받아 마심');
 const st=await p.evaluate(()=>({ph:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase,scene:!!storyScene}));ok(st.ph==='doorStory'||st.ph==='boss','보스 문의 기억으로 이어진다 '+JSON.stringify(st));
 if(st.scene){const t=await p.evaluate(()=>String(storyScene?.text||storyScene?.body||document.querySelector('#story,#storyText,.story')?.textContent||''));console.log('  (scene text head) '+t.slice(0,60));await p.screenshot({path:`${OUT}/3-door-story.png`});}
 for(let i=0;i<6&&await ph(p)!=='boss';i++){await skip(p);await p.waitForTimeout(400);}
 ok(await ph(p)==='boss','기억 뒤 boss 단계');ok(!(await p.evaluate(()=>{const d=room.exploration.worldR74.doors.find(d=>d.id==='door-0');return blocked(d.x,d.y,.27,room);})),'보스 문이 열렸다');
 const sv=await p.evaluate(()=>serializeSave().npcR790);ok(sv?.rooms?.['STORY:last303']?.gwibitang===true,'세이브에 기록');
 // 보스 구역으로 들어가 불면귀가 나오고, 이제는 쓰러진다
 await p.evaluate(()=>{player.x=16;player.y=15;});await p.waitForFunction(()=>room.enemies.find(e=>e.boss)?.spawnState!=='hidden',null,{timeout:120000});ok(true,'불면귀 등장');
 const dead=await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss);B.spawnState='active';B.hp=0;killEnemy(B);return {hp:B.hp,dead:!!B.deadRecorded||B.spawnState==='dead'};});ok(dead.hp<=0&&dead.dead,'귀비탕 뒤에는 불면귀를 쓰러뜨릴 수 있다 '+JSON.stringify(dead));
 // 세이브 왕복
 const rt=await p.evaluate(async()=>{const raw=JSON.parse(JSON.stringify(serializeSave()));const r=await restoreSave(raw);return {r,taken:window.__STORYWORLD_NPC_R790__.taken(),err:window.__STORYWORLD_NPC_R790__.inspect().lastError};});ok(rt.r!==false&&rt.taken,'세이브 복원 뒤에도 마신 상태 '+JSON.stringify(rt));
 ok(!(await p.evaluate(()=>window.__STORYWORLD_NPC_R790__.inspect().lastError)),'모듈 오류 없음');await ctx.close();}
// ── 2: 길잡이가 스스로 걸어가 진행(창에 멈추지 않음) ──
{const {ctx,p}=await boot(b);p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await toDoorPhase(p);
 await p.evaluate(()=>{guide=true;});const t0=Date.now();
 await p.waitForFunction(()=>['doorStory','boss'].includes(window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||!!storyScene,null,{timeout:420000});
 const r=await p.evaluate(()=>({taken:window.__STORYWORLD_NPC_R790__.taken(),st:window.__STORYWORLD_NPC_R790__.inspect().stats,modal,scene:!!storyScene}));
 ok(r.taken&&r.st.auto>=1,'길잡이: 집결실에서 문까지 걸어가 창 없이 귀비탕을 받고 진행 '+JSON.stringify(r.st)+' '+((Date.now()-t0)/1000|0)+'s');await ctx.close();}
ok(errs.length===0,'페이지 오류 없음 '+errs.join(' | '));
console.log('R790 브라우저(헤드리스) 검사 통과: '+n+'개');await b.close();
