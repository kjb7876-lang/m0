// R1060 CPU 검사: 불면귀 지역(last302 잠들지 못하는 마을·last303 불면귀 결투)에서 그 지역 단서(R840 곁일 단서)를 다 모아야 보스 문의 기억(R78 doorStory)으로 넘어가는가.
//  사용자 2026-11-15 14:14Z "그맵 단서를 다모아야 게임지 진행되게". 서사 글은 바꾸지 않는다(알림·목표 줄만).
//  정상: 문 단계·단서 0/1 → 문에서 E 를 눌러도 기억이 시작되지 않고 남은 단서·다음 할 일을 알린다. 단서를 주우면 그대로 열린다.
//  경계: 문에서 먼 곳 E·문 단계가 아닐 때·R790 귀비탕 관문이 먼저일 때는 손대지 않는다. 곁일 대상을 못 세운 지역(소프트락 위험)은 막지 않는다.
//  회귀: 다른 지역·사몽 층·무한 생존(곁일 안 보임)·끄기 스위치는 그대로, 알림은 1.5초에 한 번, 목표 줄은 한 번만 붙인다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m);}};
const read=f=>fs.readFileSync(path.join(R,f),'utf8'),has=f=>fs.existsSync(path.join(R,f));
const F='clue-gate-r1060.js';ok(has('client-source/'+F),'overlay source exists');const src=has('client-source/'+F)?read('client-source/'+F):'';
ok(has('runtime-text/'+F)&&read('runtime-text/'+F)===src,'runtime copy matches client source');
const html=read('runtime-text/index.html');
ok(/<script src="\.\/bulmyeongwi-oldart-r1059\.js"><\/script>\n<script src="\.\/clue-gate-r1060\.js"><\/script>\n/.test(html),'index.html tag right after bulmyeongwi-oldart-r1059');
ok(html.indexOf('quest-r840.js')<html.indexOf(F)&&html.indexOf('npc-r790.js')<html.indexOf(F),'loads after quest-r840 and npc-r790');
ok(read('../scripts/verify-r96-public.py').includes("'"+F+"'"),'verify-r96-public lists overlay');
ok(/r96\/qa\/r1060\/r1060-cpu-check\.cjs/.test(read('../.github/workflows/pages.yml')),'pages.yml runs this check');
ok(has('runtime-manifest.json')&&read('runtime-manifest.json').includes('"'+F+'"'),'runtime-manifest has overlay');
const canon=read('runtime-text/story-canon-r106-data.js');ok(!/단서를 모두 모아야/.test(canon),'canon text untouched (no gate wording inside story data)');
function world({zone='last302',layer='STORY',phase='door',st='new',npc=true,props=1,orb=false,visible=true,r790gate=false,near=true,store={},hasClue=true}={}){
 const toasts=[],baseCalls=[];let clock=100;const q={textContent:'보스 구역 문 앞에서 기억을 확인하세요.'};
 const room={id:zone,layer,props:[],exploration:{bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:10,y:10}]}}};
 const c={console,Math,JSON,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Promise,RegExp,Error,isFinite,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>clock*1000},
  started:true,modal:null,loading:false,room,player:{x:near?11:30,y:10,hp:10},
  toast:(t,s)=>toasts.push(String(t)),$:id=>id==='questText'?q:null};
 c.window=c;
 c.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>({phase}),controlled:()=>true};
 const defs={last302:{npc:{name:'잠들지 못한 어부'},quest:{type:'purge',hud:'어부가 가리킨 붉은 부적 말뚝 부수기'},clue:hasClue?{title:'실 끊긴 붉은 부적'}:undefined},last303:{npc:{name:'약방 아낙'},quest:{type:'purge',hud:'아낙이 돌아본 꺼진 등롱대 부수기'},clue:{title:'안개 묻은 등롱 조각'}},last304:{npc:{name:'노인'},quest:{type:'kill',hud:'늑대'},clue:{title:'x'}}};
 c.__STORYWORLD_QUEST_R840__={def:z=>defs[z]||null,inspect:()=>({zone:room.id,visible,phase,state:st,npc:npc?{id:'n',x:1,y:1}:null,props:Array.from({length:props},(_,i)=>({id:'p'+i})),orb:orb?{x:2,y:2}:null})};
 c.__STORYWORLD_NPC_R790__={inspect:()=>({zone:room.id,gate:r790gate})};
 vm.createContext(c);c.__guides=[];c.__STORYWORLD_QUEST_R840__.guideStep=late=>{c.__guides.push(late);return true;};vm.runInContext('var time=0,guide=false;function interact(){__base.push(1);return "base";} function updateHUD(){} function tick(){} function guideStep(){__gbase.push(1);}',c);c.__base=baseCalls;c.__gbase=[];vm.runInContext('time='+clock,c);
 vm.runInContext(src,c);vm.runInContext('tick()',c);
 return {c,toasts,baseCalls,q,adv:s=>{clock+=s;vm.runInContext('time='+clock,c);},set:o=>{if('st' in o)st=o.st;if('phase' in o)phase=o.phase;}};}
if(src){
 let w=world();let r=w.c.interact();ok(r===true&&w.baseCalls.length===0,'door phase + clue missing: door story blocked');ok(w.toasts.length===1&&/단서 0\/1/.test(w.toasts[0])&&/잠들지 못한 어부/.test(w.toasts[0]),'toast says 단서 0/1 and next step (NPC): '+w.toasts[0]);
 w.c.interact();ok(w.toasts.length===1&&w.baseCalls.length===0,'second press within 1.5s: still blocked, no toast spam');w.adv(2);w.c.interact();ok(w.toasts.length===2,'toast again after 1.5s');
 w.set({st:'done'});r=w.c.interact();ok(r==='base'&&w.baseCalls.length===1,'clue collected → door works (base interact)');
 w=world({st:'on'});w.c.interact();ok(w.baseCalls.length===0&&/부적 말뚝/.test(w.toasts[0]||''),'state on: blocked, hint = quest hud');
 w=world({st:'drop',orb:true});w.c.interact();ok(w.baseCalls.length===0&&/떨어진 단서/.test(w.toasts[0]||''),'state drop: blocked, hint = pick up clue');
 w=world({near:false});w.c.interact();ok(w.baseCalls.length===1&&w.toasts.length===0,'far from door: untouched');
 for(const ph of ['route','rally','doorStory','boss','exit','done']){w=world({phase:ph});w.c.interact();ok(w.baseCalls.length===1,'phase '+ph+': untouched');}
 w=world({zone:'last303',r790gate:true});w.c.interact();ok(w.baseCalls.length===1,'R790 귀비탕 gate active: let R790 handle first');
 w=world({zone:'last303'});w.c.interact();ok(w.baseCalls.length===0&&/약방 아낙/.test(w.toasts[0]||''),'last303 after 귀비탕: blocked until clue');
 w=world({zone:'last304'});w.c.interact();ok(w.baseCalls.length===1,'other zone untouched');
 w=world({layer:'DREAM'});w.c.interact();ok(w.baseCalls.length===1,'samong layer untouched');
 w=world({visible:false});w.c.interact();ok(w.baseCalls.length===1,'quest not visible (survival/coop/finished zone): untouched');
 w=world({npc:false});w.c.interact();ok(w.baseCalls.length===1,'state new but NPC not placed: no softlock');
 w=world({st:'on',props:0});w.c.interact();ok(w.baseCalls.length===1,'state on but no props: no softlock');
 w=world({st:'drop',orb:false});w.c.interact();ok(w.baseCalls.length===1,'state drop but no orb: no softlock');
 w=world({hasClue:false});w.c.interact();ok(w.baseCalls.length===1,'zone without clue def: untouched');
 w=world({store:{'storyworld.r1060.clueGate':'{"on":false}'}});w.c.interact();ok(w.baseCalls.length===1,'off switch');
 w=world();w.c.updateHUD();ok(/단서 0\/1/.test(w.q.textContent),'HUD shows 단서 0/1: '+w.q.textContent);w.c.updateHUD();ok((w.q.textContent.match(/단서 0\/1/g)||[]).length===1,'HUD appended once');
 w=world({phase:'route'});w.c.updateHUD();ok(/단서 0\/1/.test(w.q.textContent),'HUD shows clue count already during route');
 w=world({st:'done'});w.c.updateHUD();ok(!/단서 \d\/1/.test(w.q.textContent)||/단서 1\/1/.test(w.q.textContent),'HUD no missing-clue line when done');
 w=world({phase:'boss'});w.c.updateHUD();ok(!/단서 0\/1/.test(w.q.textContent),'HUD quiet after door');
 // 길잡이: 곁일을 받지 않고 문 단계까지 온 경우(R840 은 들머리로 되돌아가지 않음) → 문 단계에서 단서가 남았으면 R840 곁일 걸음을 '늦게라도'(late) 먼저 한다
 w=world({near:false});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===1&&w.c.__guides[0]===true&&w.c.__gbase.length===0,'guide at door phase with clue missing → R840 late guide step first');
 w=world({phase:'route'});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'guide in route: R840 normal chain (untouched)');
 w=world({st:'done'});vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'guide after clue: untouched');
 w=world();vm.runInContext('guide=false;guideStep()',w.c);ok(w.c.__guides.length===0&&w.c.__gbase.length===1,'manual play: guide step untouched');
 w=world();w.c.__STORYWORLD_QUEST_R840__.guideStep=()=>false;vm.runInContext('guide=true;guideStep()',w.c);ok(w.c.__gbase.length===1,'R840 step declines → normal guide');
 const s840=read('client-source/quest-r840.js');ok(/guideStep:\s*late\s*=>/.test(s840)&&/function guideStepR840\(late\)/.test(s840)&&/st==='new'&&ph!=='route'&&!late/.test(s840),'R840 exposes late guide step (only skips the no-backtrack rule)');
 ok(read('runtime-text/quest-r840.js')===s840,'R840 runtime copy matches');
 const api=w.c.__STORYWORLD_CLUE_GATE_R1060__;ok(!!api&&typeof api.inspect==='function'&&typeof api.pure?.need==='function','inspect api');
 ok(api.pure.need({zone:'last302',visible:true,state:'new',npc:{},props:[],orb:null},{clue:{}})===1&&api.pure.need({zone:'last302',visible:true,state:'done'},{clue:{}})===0,'pure need');}
console.log(`\nR1060 ${n-bad}/${n}`);if(bad)process.exit(1);
