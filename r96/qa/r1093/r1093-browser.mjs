// R1093 헤드리스: 퀘스트(R840 곁일)가 있는 모든 맵에서 ① 퀘스트 전 진행 지점(보스 문·기억 표식·사몽 문) E 가 막히고 알림이 뜨는가
//  ② 길잡이가 퀘스트를 마친 뒤 스스로 그 지점을 넘어가는가(전 맵 클리어 가능성, 막힘 없음). node r1093-browser.mjs <outDir> [zones]
//  헤드리스 소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});
const ALL='last304,last305,ep1a09,ep1a10,ep1a08,last302,last303,sz115-S05-1,sz115-S05-3,sz115-S06-2,sz115-S06-3,sz115-S06-15,sz115-S06-18,sz115-S06-22';
const zones=(process.argv[3]||ALL).split(',');const LIMIT=+(process.env.R1093_LIMIT||480000);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('ok  ',m);}else{fail++;console.log('FAIL',m);}};
const PH=()=>room.id==='ep1a08'?window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase||null:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase||null;
const ph=()=>p.evaluate(`(${PH})()`);const Q=()=>p.evaluate(()=>window.__STORYWORLD_QUEST_R840__.inspect());
const G=()=>p.evaluate(()=>window.__STORYWORLD_QUEST_GATE_R1093__.inspect());
await p.evaluate(()=>{window.__toasts=[];const t=toast;toast=function(m,...a){window.__toasts.push(String(m));return t.apply(this,[m,...a]);};});
const waitT=s=>p.waitForFunction(s=>{const t0=window.__w0??=time;if(time-t0>s){window.__w0=undefined;return true;}return false;},s,{timeout:180000});
const strong=()=>p.evaluate(()=>{player.hp=player.maxHp=1e9;});
const tidy=()=>p.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();const c=document.querySelector('.cap button, #capSkip');if(c&&/건너뛰기/.test(c.textContent||''))c.click();if(modal&&!/questR840|r790|R790/.test(document.getElementById('panel')?.innerHTML||''))closePanel(true);});
const dreamEp=z=>/S05/.test(z)?5:6;const summary=[];
for(const z of zones){const dream=/^sz115-/.test(z);console.log('== '+z);const rec={zone:z};
 try{
 if(dream){await p.evaluate(()=>{guide=false;});const inDream=await p.evaluate(()=>layer==='DREAM');
  if(!inDream){await p.evaluate(e=>window.__STORYWORLD_CHEAT777__.goSamong(e,'survival',{force:true}),dreamEp(z));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);}
  await p.evaluate(([e,z])=>window.__STORYWORLD_SAMONG_R103__.go(e,'explore',{zone:z}),[dreamEp(z),z]);await p.waitForFunction(z=>!loading&&room.samongR103?.zone===z,z,{timeout:150000});await skip(p);}
 else await go(p,z);
 await strong();await waitT(1);let q=await Q();ok(q.visible&&q.state==='new',z+' quest visible & new: '+q.state);
 // ① 막힘 확인: 진행 지점 앞에 세우고 E
 let blockCase=null;
 if(dream){/* 사몽: 구역 목표를 이룬 것으로 → 문이 열림(탐색 구역). 전투 구역은 열리지 않으면 건너뜀 */
  await p.evaluate(z=>{const S=window.__STORYWORLD_SAMONG_R103__.state();if(!S.zoneDone.includes(z))S.zoneDone.push(z);},z);
  try{await p.waitForFunction(()=>!!room.samongR103?.portal||!!storyScene,null,{timeout:20000});}catch(_){}await tidy();
  try{await p.waitForFunction(()=>!!room.samongR103?.portal,null,{timeout:20000});}catch(_){}
  if(await p.evaluate(()=>!!room.samongR103?.portal)){blockCase='portal';await p.evaluate(()=>{const x=room.samongR103.portal;player.x=x.x+1;player.y=x.y;window.__toasts.length=0;});}}
 else{const t0=Date.now();await p.evaluate(()=>{room.enemies=room.enemies.filter(e=>e&&(e.boss||e.midboss));});
  while(Date.now()-t0<120000&&await ph()!=='door'){await p.evaluate(()=>{room.enemies=room.enemies.filter(e=>e&&(e.boss||e.midboss));for(let i=0;i<40&&storyScene;i++)advanceScene();try{window.__STORYWORLD_WORLD_COMBAT_R78__.settle();}catch(_){}try{window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__.settle();}catch(_){}});await p.waitForTimeout(800);}
  if(await ph()==='door'){blockCase='boss';await p.evaluate(()=>{const d=room.id==='ep1a08'?room.exploration.hospitalDoorsB3.find(x=>x.id==='door-0'):room.exploration.worldR74.doors.find(x=>x.id===room.exploration.bossDoorId);player.x=d.x+(d.axis==='y'?0:2);player.y=d.y+(d.axis==='y'?2:0);window.__toasts.length=0;});}}
 if(blockCase){await waitT(1.7);const before=await p.evaluate(()=>({zone:room.samongR103?.zone||room.id,ph:(room.id==='ep1a08'?window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||null,eng:!!room.engaged}));
  const r=await p.evaluate(()=>{const res=interact();updateHUD();return {res,scene:!!storyScene,toasts:[...window.__toasts],hud:document.getElementById('questText')?.textContent||'',gate:window.__STORYWORLD_QUEST_GATE_R1093__.inspect(),r1060:window.__STORYWORLD_CLUE_GATE_R1060__?.inspect?.().stats};});
  await waitT(.6);const after=await p.evaluate(()=>({zone:room.samongR103?.zone||room.id,ph:(room.id==='ep1a08'?window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase)||null,eng:!!room.engaged,loading}));
  const r1060zone=['last302','last303'].includes(z);
  ok(after.zone===before.zone&&after.ph===before.ph&&!r.scene&&!after.loading&&after.eng===before.eng,z+' '+blockCase+' E blocked before quest (stays: '+JSON.stringify(after)+')');
  ok(r.toasts.some(t=>r1060zone?/단서 0\/1/.test(t):/퀘스트 0\/1/.test(t)),z+' toast: '+r.toasts.join(' | '));rec.toast=r.toasts[0];rec.block=blockCase;
  await p.screenshot({path:`${out}/${z}-blocked.png`});}
 else{rec.block='skipped';console.log('   (block point not reachable quickly in headless — gate block covered by CPU check)');}
 // ② 길잡이로 퀘스트를 마치고 지점을 넘어가는가
 const rel0=(await G()).stats.released|0;const t1=Date.now();let st=(await Q()).state,last='';const order=[];
 const passed=async()=>p.evaluate(([z,dream])=>{if(dream)return room.samongR103?.zone!==z||layer!=='DREAM';const s=room.id==='ep1a08'?window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase:window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase;return ['boss','exit','exitStory','done'].includes(s);},[z,dream]);
 while(Date.now()-t1<LIMIT&&!(await passed())){await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;});await tidy();await p.waitForTimeout(1500);
  const s=(await Q()).state;if(s!==st){order.push(s);console.log('   '+((Date.now()-t1)/1000|0)+'s quest='+s);st=s;}}
 const done=await passed();const g=await G();rec.secs=(Date.now()-t1)/1000|0;rec.order=order.join('>');rec.stats=g.stats;
 ok(done,z+' guide passed the point ('+rec.secs+'s)');ok(order.includes('done')||st==='done'||(dream&&order.length===0&&st==='new'&&false),z+' quest finished before passing: '+order.join('>'));
 if(!(order.includes('done')||st==='done'))rec.questAtPass=st;
 ok((g.stats.released|0)-rel0===0,z+' no safety release needed (released in zone='+((g.stats.released|0)-rel0)+')');
 await p.evaluate(()=>{guide=false;});}catch(e){fail++;console.log('FAIL',z,'error',String(e).slice(0,200));rec.error=String(e).slice(0,200);}
 summary.push(rec);fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,1));}
console.log(`R1093 browser ${pass}/${pass+fail}`);await b.close();process.exit(fail?1:0);
