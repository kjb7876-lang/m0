// R1060 헤드리스: 불면귀 지역(last302·last303)에서 단서 전 보스 문 E 가 막히고 '단서 0/1' 을 알리는가, 길잡이는 곁일로 단서를 모은 뒤 스스로 보스 단계까지 가는가(막힘 없음).
// node r1060-browser.mjs <outDir> [zones]
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});const zones=(process.argv[3]||'last302,last303').split(',');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('ok  ',m);}else{fail++;console.log('FAIL',m);}};
const ph=()=>p.evaluate(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase);const Q=()=>p.evaluate(()=>window.__STORYWORLD_QUEST_R840__.inspect());
await p.evaluate(()=>{window.__toasts=[];const t=toast;toast=function(m,...a){window.__toasts.push(String(m));return t.apply(this,[m,...a]);};});
for(const z of zones){await go(p,z);await p.waitForTimeout(1500);
 // 들머리 일반몹을 치워 문 단계로(R78 settle)
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;room.enemies=room.enemies.filter(e=>e&&(e.boss||e.midboss));});
 const t0=Date.now();while(Date.now()-t0<120000&&await ph()!=='door'){await p.evaluate(()=>{room.enemies=room.enemies.filter(e=>e&&(e.boss||e.midboss));for(let i=0;i<40&&storyScene;i++)advanceScene();try{window.__STORYWORLD_WORLD_COMBAT_R78__.settle();}catch(_){}});await p.waitForTimeout(1000);}
 ok(await ph()==='door',z+' reached door phase');const q0=await Q();ok(q0.state==='new','clue not yet collected: '+q0.state);
 // 귀비탕(R790) 관문이 있으면 먼저 받아 둔 것으로(그 관문은 R790 검사 몫) → 문 E
 const r=await p.evaluate(()=>{const n=window.__STORYWORLD_NPC_R790__;const g=n?.inspect?.();if(g?.gate){const d=room.exploration.worldR74.doors.find(x=>x.id===room.exploration.bossDoorId);player.x=d.x+(d.axis==='y'?0:2);player.y=d.y+(d.axis==='y'?2:0);interact();if(modal){const btn=[...document.querySelectorAll('#panel button')].find(b=>!/npcWaitR790/.test(b.id)&&/Take|받|마신|take/i.test(b.id+b.textContent));btn?.click();}}
  for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);
  const d=room.exploration.worldR74.doors.find(x=>x.id===room.exploration.bossDoorId);player.x=d.x+(d.axis==='y'?0:2);player.y=d.y+(d.axis==='y'?2:0);window.__toasts.length=0;
  const res=interact();updateHUD();return {res,scene:!!storyScene,toasts:[...window.__toasts],hud:document.getElementById('questText')?.textContent||'',r790:n?.inspect?.()?.gate,gate:window.__STORYWORLD_CLUE_GATE_R1060__.inspect()};});
 console.log(JSON.stringify(r));
 ok(!r.r790,z+' R790 gate not pending');ok(await ph()==='door'&&!r.scene,z+' door E blocked before clue (phase stays door, no story)');
 ok(r.toasts.some(t=>/단서 0\/1/.test(t)),z+' toast: '+r.toasts.join(' | '));ok(/단서 0\/1/.test(r.hud),z+' HUD: '+r.hud);
 await p.waitForTimeout(800);await p.screenshot({path:`${out}/${z}-blocked.png`});
 // 길잡이: 단서를 모으고 스스로 보스 단계로
 const order=[];const t1=Date.now();let cur=await ph(),st=(await Q()).state;
 while(Date.now()-t1<600000&&!['boss','exit','exitStory','done'].includes(cur)){await p.evaluate(()=>{player.hp=player.maxHp=1e9;if(!guide)guide=true;for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal&&!/questR840/.test(document.getElementById('panel')?.innerHTML||''))closePanel(true);});
  await p.waitForTimeout(1500);const c=await ph(),s=(await Q()).state;if(c!==cur||s!==st){order.push(c+'/'+s);console.log('   ['+z+'] '+((Date.now()-t1)/1000|0)+'s phase='+c+' clue='+s);cur=c;st=s;}}
 const q1=await Q();ok(['boss','exit','exitStory','done'].includes(cur),z+' guide reached boss phase: '+cur);ok(q1.state==='done',z+' clue collected by guide');
 ok(!order.some(o=>/^(doorStory|boss)\/(new|on|drop)$/.test(o)),z+' door story never before clue: '+order.join(','));
 await p.evaluate(()=>{guide=false;});}
console.log(`R1060 browser ${pass}/${pass+fail}`);await b.close();process.exit(fail?1:0);
