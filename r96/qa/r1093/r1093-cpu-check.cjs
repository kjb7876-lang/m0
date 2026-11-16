// R1093 CPU 검사: 퀘스트(R840 곁일)가 있는 모든 맵에서 그 퀘스트를 마쳐야 보스방 입장·다음 맵 이동이 되는가.
//  사용자 2026-11-16 00:19Z "모든맵에 쿼스트가 있으면 그 퀘스트를 클리어해야 보스방입장이나 다음맵으로 넘어가게 해줘". 서사 글은 바꾸지 않는다(알림·목표 줄만).
//  정상: R78 문 단계 보스 문 E·출구 단계 출구 문(door-2) E·사몽 구역 열린 문(포탈) E·R78 밖 본편 맵(ep1a08)의 기억 표식 E 를 퀘스트 전엔 막고 다음 할 일을 알린다. 마치면 그대로 열린다.
//  경계: 문까지 거리 3.2칸·포탈 2.6칸·표식 2.7칸 경계, 다른 단계, R1060(불면귀 단서 관문)·R790(귀비탕 등) 관문이 먼저인 곳은 그쪽에 맡긴다.
//  회귀: 퀘스트 없는 지역·안 보이는 퀘스트(무한 생존·협동·이미 끝낸 지역)·다음 대상을 못 세운 경우(소프트락)·끄기 스위치는 그대로. 알림 1.5초 간격, 목표 줄 한 번.
//  길잡이·영화 모드: 막힐 지점에서는 R840 곁일 걸음(late)을 먼저, 그래도 30초 넘게 막히면 풀어 준다(소프트락 안전판).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const read=f=>fs.readFileSync(path.join(R,f),'utf8'),has=f=>fs.existsSync(path.join(R,f));
const F='quest-gate-r1093.js';ok(has('client-source/'+F),'overlay source exists');const src=has('client-source/'+F)?read('client-source/'+F):'';
ok(has('runtime-text/'+F)&&read('runtime-text/'+F)===src,'runtime copy matches client source');
const html=read('runtime-text/index.html');
ok(/<script src="\.\/clue-gate-r1060\.js"><\/script>\n<script src="\.\/quest-gate-r1093\.js"><\/script>\n/.test(html),'index.html tag right after clue-gate-r1060');
ok(html.indexOf('quest-r840.js')<html.indexOf(F)&&html.indexOf('npc-r790.js')<html.indexOf(F)&&html.indexOf('samong-r103.js')<html.indexOf(F)&&html.indexOf('world-combat-r78.js')<html.indexOf(F),'loads after quest-r840, npc-r790, samong-r103, world-combat-r78');
ok(read('../scripts/verify-r96-public.py').includes("'"+F+"'"),'verify-r96-public lists overlay');
ok(/r96\/qa\/r1093\/r1093-cpu-check\.cjs/.test(read('../.github/workflows/pages.yml')),'pages.yml runs this check');
ok(has('runtime-manifest.json')&&read('runtime-manifest.json').includes('"'+F+'"'),'runtime-manifest has overlay');
const canon=read('runtime-text/story-canon-r106-data.js');ok(!/퀘스트를 마쳐야/.test(canon),'canon text untouched');
// R840: 늦게 켠 길잡이(late)는 사몽 문이 열린 뒤·본편 맵 안쪽에서도 곁일로 되돌아가야 한다(이 관문이 막는 곳에서 길잡이가 멈추지 않게)
const q840=read('client-source/quest-r840.js');
ok(/bossUp&&!\(late&&r\.samongR103\?\.portal\)/.test(q840),'R840 late step: samong portal open → boss-up check skipped');
ok(/portal&&st==='new'&&!late/.test(q840),'R840 late step: samong portal open + new quest → still walks back');
ok(/d\.free\)\{const e=r\.exploration\?\.entry;if\(st==='new'&&!late&&/.test(q840),'R840 late step: free map (ep1a08) → still walks back');
ok(/const visible=\(r=here\(\)\)=>applies\(r\)&&\(stOf\(r\)!=='new'\|\|!doneFor\(r\)\)/.test(q840)&&/if\(!dream\(r\)\)return zoneDone\(r\)/.test(q840),'R840: samong zone finished during this visit keeps an untaken quest visible (portal gate stays solvable); story zones unchanged');
ok(/st==='on'&&d\.quest\.type==='kill'&&!late\)return false/.test(q840)&&/R1093 late: 관문 앞에서 처치 곁일이 남았으면/.test(q840),'R840 late step: kill quest on → walks toward remaining targets (guide not stuck at gate)');
ok(read('runtime-text/quest-r840.js')===q840,'R840 runtime copy matches');

// 모든 퀘스트 지역 정의가 깰 수 있는 모양인가(정적): 부탁 종류·단서·처치 조건
{const c={console,Math,JSON,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Promise,RegExp,Error,isFinite,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>({}),head:{appendChild(){}}}};c.window=c;vm.createContext(c);
 vm.runInContext('var time=0;',c);try{vm.runInContext(q840,c);}catch(e){}
 const Q=c.__STORYWORLD_QUEST_R840__;ok(!!Q&&typeof Q.zones==='function','R840 loads in vm');
 const zones=Q?Q.zones():[];ok(zones.length===14,'R840 quest zones: '+zones.length);
 for(const z of zones){const d=Q.def(z),t=d?.quest?.type;let good=!!d&&!!d.clue&&!!d.npc?.name&&['purge','kill','talk'].includes(t);
  if(t==='purge')good=good&&d.quest.hits>0&&!!d.quest.prop?.path;if(t==='kill')good=good&&d.quest.count>0&&typeof d.quest.match==='function';
  ok(good,'quest clearable shape: '+z+' ('+t+')');}}

function world({zone='last304',layer='DREAM'===undefined?'STORY':'STORY',phase='door',st='new',npc=true,props=1,orb=false,visible=true,r790gate=false,dist=1,store={},
  kills=0,need=0,r1060=true,free=false,done=false,portal=null,engaged=false,kind='door',defZone=null,hosp=null}={}){
 const toasts=[],baseCalls=[];let clock=100;const q={textContent:'보스 구역 문 앞에서 기억을 확인하세요.'};
 const room={id:layer==='DREAM'?'host-x':zone,layer,props:[],engaged,objective:{x:40,y:40},
  exploration:{bossDoorId:'door-0',entry:{x:0,y:0},worldR74:{doors:[{id:'door-0',x:10,y:10},{id:'door-2',x:20,y:20}]}}};
 if(layer==='DREAM')room.samongR103={zone,portal,bossUp:false};
 if(hosp){room.exploration.hospitalDoorsB3=[{id:'door-0',x:10,y:10},{id:'door-2',x:20,y:20}];room.exploration.worldR74={doors:[{id:'door-0',x:90,y:90},{id:'door-2',x:95,y:95}]};}
 const at=kind==='door'?{x:10,y:10}:kind==='exit'?{x:20,y:20}:kind==='portal'?(portal||{x:30,y:30}):{x:40,y:40};
 const c={console,Math,JSON,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Promise,RegExp,Error,isFinite,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>clock*1000},
  started:true,modal:null,loading:false,room,player:{x:at.x+dist,y:at.y,hp:10},
  toast:(t,s)=>toasts.push(String(t)),$:id=>id==='questText'?q:null,completed:(id)=>done};
 c.window=c;
 c.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>free||layer==='DREAM'?null:{phase},controlled:()=>!free&&layer!=='DREAM'};
 const defs={last302:{npc:{name:'잠들지 못한 어부'},quest:{type:'purge',hud:'어부가 가리킨 붉은 부적 말뚝 부수기'},clue:{title:'a'}},
  last303:{npc:{name:'약방 아낙'},quest:{type:'purge',hud:'등롱대'},clue:{title:'b'}},
  last304:{npc:{name:'피난민 노인'},quest:{type:'kill',count:5,hud:'길 가의 늑대 쫓기'},clue:{title:'c'}},
  ep1a08:{free:true,npc:{name:'주사기를 든 간호사'},quest:{type:'kill',count:5,hud:'비명잔영'},clue:{title:'d'}},
  ep1a09:{npc:{name:'문밖의 의료진'},quest:{type:'kill',count:5,hud:'감시환각 걷어 내기'},clue:{title:'e'}},
  ep1a10:{npc:{name:'처음 약을 쓰던 나의 잔영'},quest:{type:'purge',hud:'주사기 더미 부수기'},clue:{title:'f'}},
  'sz115-S05-1':{layer:'DREAM',npc:{name:'지현의 잔영'},quest:{type:'purge',hud:'잔 깨뜨리기'},clue:{title:'g'}},
  'sz115-S06-2':{layer:'DREAM',npc:{name:'기다리던 그녀의 잔영'},quest:{type:'talk',hud:'이야기 듣기'},clue:{title:'h'}}};
 c.__STORYWORLD_QUEST_R840__={zones:()=>Object.keys(defs),def:z=>defs[z]||null,inspect:()=>({zone:room.id,visible,state:st,kills,need,npc:npc?{id:'n',x:1,y:1}:null,props:Array.from({length:props},(_,i)=>({id:'p'+i})),orb:orb?{x:2,y:2}:null})};
 if(hosp)c.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__={inspect:()=>({state:{phase:hosp}})};
 c.__STORYWORLD_NPC_R790__={inspect:()=>({zone:room.id,gate:r790gate})};
 c.__STORYWORLD_CLUE_GATE_R1060__={inspect:()=>({prefs:{on:r1060}})};
 vm.createContext(c);c.__guides=[];c.__r840step=true;c.__STORYWORLD_QUEST_R840__.guideStep=late=>{c.__guides.push(late);return c.__r840step;};
 vm.runInContext('var time=0,guide=false;function interact(){__base.push(1);return "base";} function updateHUD(){} function tick(){} function guideStep(){__gbase.push(1);}',c);c.__base=baseCalls;c.__gbase=[];vm.runInContext('time='+clock,c);
 vm.runInContext(src,c);vm.runInContext('tick()',c);
 return {c,toasts,baseCalls,q,adv:s=>{clock+=s;vm.runInContext('time='+clock,c);},set:o=>{if('st' in o)st=o.st;if('phase' in o)phase=o.phase;if('kills' in o)kills=o.kills;if('need' in o)need=o.need;}};}
if(src){
 // ── 정상: R78 보스 문 ──
 let w=world();let r=w.c.interact();ok(r===true&&w.baseCalls.length===0,'last304 door phase + quest new: boss door blocked');
 ok(w.toasts.length===1&&/퀘스트 0\/1/.test(w.toasts[0])&&/피난민 노인/.test(w.toasts[0])&&/보스/.test(w.toasts[0]),'toast: 퀘스트 0/1 + next = NPC + 보스: '+w.toasts[0]);
 w.c.interact();ok(w.toasts.length===1&&w.baseCalls.length===0,'second press within 1.5s: blocked, no spam');w.adv(1.6);w.c.interact();ok(w.toasts.length===2,'toast again after 1.5s');
 w.set({st:'done'});r=w.c.interact();ok(r==='base'&&w.baseCalls.length===1,'quest done → boss door works');
 w=world({st:'on',kills:2,need:5});w.c.interact();ok(w.baseCalls.length===0&&/늑대/.test(w.toasts[0]||'')&&/2\/5/.test(w.toasts[0]||''),'kill quest on 2/5: blocked, hint shows count: '+w.toasts[0]);
 w=world({st:'on',kills:5,need:5});w.c.interact();ok(w.baseCalls.length===1,'kill quest on but kills>=need (drop pending): not blocked');
 w=world({st:'on',kills:0,need:0});w.c.interact();ok(w.baseCalls.length===1,'kill quest on with no matching mobs left (need 0): not blocked (no softlock)');
 w=world({st:'drop',orb:true});w.c.interact();ok(w.baseCalls.length===0&&/떨어진 단서/.test(w.toasts[0]||''),'drop: blocked, hint pick up');
 // ── 정상: 출구 문(다음 맵) ──
 w=world({zone:'ep1a10',phase:'exit',kind:'exit',st:'on',props:2});w.c.interact();ok(w.baseCalls.length===0&&/주사기 더미/.test(w.toasts[0]||'')&&/다음/.test(w.toasts[0]||''),'ep1a10 exit phase near door-2: next map blocked: '+w.toasts[0]);
 w=world({zone:'ep1a10',phase:'exit',kind:'door',st:'on',props:2});w.c.interact();ok(w.baseCalls.length===1,'exit phase near boss door (not exit): untouched');
 w=world({zone:'ep1a10',phase:'door',kind:'exit',st:'on',props:2});w.c.interact();ok(w.baseCalls.length===1,'door phase near exit door: untouched');
 // ── 정상: 사몽 구역 문(포탈) ──
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:{x:30,y:30}});w.c.interact();ok(w.baseCalls.length===0&&/지현의 잔영/.test(w.toasts[0]||'')&&/다음 기억/.test(w.toasts[0]||''),'samong S05-1 portal open: blocked: '+w.toasts[0]);
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:null});w.c.interact();ok(w.baseCalls.length===1,'samong portal not open: untouched');
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:{x:30,y:30},st:'done'});w.c.interact();ok(w.baseCalls.length===1,'samong quest done: portal works');
 // ── 정상: R78 밖 본편 맵(ep1a08) 기억 표식 ──
 w=world({zone:'ep1a08',free:true,kind:'obj',st:'on',kills:1,need:5});w.c.interact();ok(w.baseCalls.length===0&&/1\/5/.test(w.toasts[0]||''),'ep1a08 objective before quest: blocked: '+w.toasts[0]);
 w=world({zone:'ep1a08',free:true,kind:'obj',done:true,st:'on',kills:1,need:5});w.c.interact();ok(w.baseCalls.length===1,'ep1a08 region already completed: journal untouched');
 w=world({zone:'ep1a08',free:true,kind:'obj',engaged:true,st:'on',kills:1,need:5});w.c.interact();ok(w.baseCalls.length===1,'ep1a08 boss already engaged: untouched');
 // ── 정상: ep1a08 병원 미로(자체 진행 단계 · 문은 hospitalDoorsB3) ──
 w=world({zone:'ep1a08',free:true,hosp:'door',kind:'door'});w.c.interact();ok(w.baseCalls.length===0&&/보스/.test(w.toasts[0]||''),'ep1a08 hospital door phase: boss door blocked: '+w.toasts[0]);
 w=world({zone:'ep1a08',free:true,hosp:'exit',kind:'exit'});w.c.interact();ok(w.baseCalls.length===0&&/다음 지역/.test(w.toasts[0]||''),'ep1a08 hospital exit phase: exit door blocked');
 w=world({zone:'ep1a08',free:true,hosp:'rally',kind:'obj'});w.c.interact();ok(w.baseCalls.length===1,'ep1a08 hospital rally phase: objective not gated (maze phases rule)');
 w=world({zone:'ep1a08',free:true,hosp:'door',kind:'door',st:'done'});w.c.interact();ok(w.baseCalls.length===1,'ep1a08 hospital quest done: door works');
 w=world({zone:'ep1a08',free:true,hosp:'rally',kind:'door',dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'ep1a08 hospital rally: guide untouched (R840 own chain)');
 w=world({zone:'ep1a08',free:true,hosp:'door',kind:'door',dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides[0]===true,'ep1a08 hospital door phase: late quest step');
 // ── 경계: 거리 ──
 w=world({dist:3.19});w.c.interact();ok(w.baseCalls.length===0,'door 3.19 tiles: blocked');
 w=world({dist:3.21});w.c.interact();ok(w.baseCalls.length===1,'door 3.21 tiles: untouched');
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:{x:30,y:30},dist:2.59});w.c.interact();ok(w.baseCalls.length===0,'portal 2.59: blocked');
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:{x:30,y:30},dist:2.61});w.c.interact();ok(w.baseCalls.length===1,'portal 2.61: untouched');
 w=world({zone:'ep1a08',free:true,kind:'obj',dist:2.69});w.c.interact();ok(w.baseCalls.length===0,'objective 2.69: blocked');
 w=world({zone:'ep1a08',free:true,kind:'obj',dist:2.71});w.c.interact();ok(w.baseCalls.length===1,'objective 2.71: untouched');
 for(const ph of ['route','rally','doorStory','boss','exitStory','done']){w=world({phase:ph});w.c.interact();ok(w.baseCalls.length===1,'phase '+ph+' at boss door: untouched');}
 // ── 다른 관문이 먼저 ──
 w=world({zone:'last302'});w.c.interact();ok(w.baseCalls.length===1,'last302 boss door: R1060 clue gate handles it (deferred)');
 w=world({zone:'last302',r1060:false});w.c.interact();ok(w.baseCalls.length===0,'last302 with R1060 off: R1093 blocks');
 w=world({zone:'last302',phase:'exit',kind:'exit'});w.c.interact();ok(w.baseCalls.length===0,'last302 exit door: R1093 blocks (R1060 only covers boss door)');
 w=world({zone:'ep1a10',r790gate:true});w.c.interact();ok(w.baseCalls.length===1,'R790 gate pending: R790 first');
 // ── 회귀·소프트락 ──
 w=world({zone:'ep1b01'});w.c.interact();ok(w.baseCalls.length===1,'zone without quest: untouched');
 w=world({visible:false});w.c.interact();ok(w.baseCalls.length===1,'quest not visible (survival/coop/finished): untouched');
 w=world({npc:false});w.c.interact();ok(w.baseCalls.length===1,'new but NPC not placed: no softlock');
 w=world({zone:'ep1a10',st:'on',props:0});w.c.interact();ok(w.baseCalls.length===1,'purge on but no props: no softlock');
 w=world({st:'drop',orb:false});w.c.interact();ok(w.baseCalls.length===1,'drop but no orb: no softlock');
 w=world({store:{'storyworld.r1093.questGate':'{"on":false}'}});w.c.interact();ok(w.baseCalls.length===1,'off switch');
 w=world();vm.runInContext('modal={}',w.c);w.c.interact();ok(w.baseCalls.length===1,'modal open: untouched');
 // ── 목표 줄 ──
 w=world({phase:'route'});w.c.updateHUD();ok(/퀘스트 0\/1/.test(w.q.textContent),'HUD shows 퀘스트 0/1 during route: '+w.q.textContent);w.c.updateHUD();ok((w.q.textContent.match(/퀘스트 0\/1/g)||[]).length===1,'HUD appended once');
 w=world({st:'done'});w.c.updateHUD();ok(!/퀘스트 0\/1/.test(w.q.textContent),'HUD quiet when done');
 w=world({phase:'boss'});w.c.updateHUD();ok(!/퀘스트 0\/1/.test(w.q.textContent),'HUD quiet after door');
 w=world({zone:'last302'});w.c.updateHUD();ok(!/퀘스트 0\/1/.test(w.q.textContent),'last302 HUD left to R1060 (no double line)');
 // ── 길잡이·영화 모드 ──
 w=world({dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===1&&w.c.__guides[0]===true&&w.c.__gbase.length===0,'guide at door phase with quest pending → R840 late step first');
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:{x:30,y:30},dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides[0]===true&&w.c.__gbase.length===0,'guide in samong with portal open + quest pending → late step');
 w=world({zone:'sz115-S05-1',layer:'DREAM',kind:'portal',portal:null,dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'samong portal not open: R840 normal chain');
 w=world({zone:'ep1a08',free:true,kind:'obj',dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides[0]===true,'guide on free map with quest pending → late step');
 w=world({phase:'route'});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'guide in route: untouched');
 w=world({st:'done'});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'guide after quest: untouched');
 w=world({zone:'last302',dist:9});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'last302 door guide: left to R1060');
 w=world();vm.runInContext('guide=false;guideStep()',w.c);ok(w.c.__gbase.length===1&&w.c.__guides.length===0,'manual play: guide untouched');
 // 안전판: 길잡이가 30초 넘게 같은 관문에 막히면(곁일 걸음도 못 함) 풀어 준다
 w=world();w.c.__r840step=false;vm.runInContext('guide=true',w.c);w.c.interact();ok(w.baseCalls.length===0,'guide blocked at first');
 w.adv(20);w.c.interact();ok(w.baseCalls.length===0,'guide still blocked at 20s');
 w.adv(11);r=w.c.interact();ok(w.baseCalls.length===1,'guide blocked >30s → released (no softlock)');
 ok(w.c.__STORYWORLD_QUEST_GATE_R1093__.inspect().stats.released===1,'release counted');
 w=world();vm.runInContext('guide=false',w.c);w.c.interact();w.adv(40);w.c.interact();ok(w.baseCalls.length===0,'manual play: never auto-released');
}
console.log(`R1093 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
