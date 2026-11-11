// R790 CPU 검사: 서사 핵심 NPC 상호작용(npc-r790.js) — 사용자 2026-11-11 "서사마다 중요엔피시를 넣어서 상호작용해서 진행하는방식 너무많이는말고 중요포인트만,
//  특히 불면귀쪽은 귀비탕을 얻어야 불면귀 퇴치가 가능하도록유도".
//  정본 35장 "안개 속에서 앳된 남자가 한약 한 잔을 내밀었다 … 약을 마시자 … 달려들던 주민들도 멈춰 섰다" + 교단 약방 기록 영상 "귀비탕을 달여 마신 수련생 · 악몽저항 · 그 안쪽의 어두운 핵이 드러난다".
//  ① 정상: last303 들판을 정리(R78 phase 'door')하면 보스 문 앞 안개 속에 앳된 남자가 서고, 그에게서 귀비탕을 받아 마셔야 보스 문의 기억(doorStory)이 시작된다.
//  ② 경계: 닿는 거리(문 3.2 미만·NPC 2.4 이하), 단계(route·rally 에는 없음), 길잡이(창 없이 바로), 창 '아직'.
//  ③ 봉인: 귀비탕 없이 불면귀를 쓰러뜨릴 수 없다(핵 봉인) — 일반 몹·다른 지역·무한 생존·협동·EGO 재방문은 그대로.
//  ④ 회귀: 옛 세이브(이미 보스 단계·완료)는 마신 것으로, 깨진 저장값은 버리고 던지지 않음, 창·불러오기·쓰러짐 중엔 손대지 않음, 끄기 스위치.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;},J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v/* vm 안에서 만든 배열·객체는 원형이 달라 값으로 비교 */,eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const F=path.join(R,'client-source','npc-r790.js');ok(fs.existsSync(F),'npc-r790.js 가 있어야 한다');const src=fs.readFileSync(F,'utf8');
// ── 연결 ──
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.includes('<script src="./npc-r790.js"></script>'),'index.html 스크립트 태그');
ok(html.indexOf('./npc-r790.js')>html.indexOf('./bulmyeongwi-r760.js'),'R760 뒤에 불러온다');
ok(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'npc-r790.js'"),'공개 검증 기대 목록');
ok(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r790/r790-cpu-check.cjs'),'pages.yml CPU 검사 줄');
for(const f of ['runtime-inputs.json','runtime-manifest.json']){const p=[path.join(R,f),path.join(R,'..',f)].find(fs.existsSync);if(p){const t=fs.readFileSync(p,'utf8');ok(t.includes('npc-r790.js'),f+' 에 npc-r790.js');ok(t.includes('assets/r790/npc/youth.webp'),f+' 에 그림');}}
ok(fs.existsSync(path.join(R,'runtime-text','assets','r790','npc','youth.webp')),'앳된 남자 그림 파일');
ok(fs.existsSync(path.join(R,'runtime-text','assets','r790','npc','youth-bust.webp')),'앳된 남자 상반신 파일');
ok(fs.readFileSync(path.join(R,'runtime-text','npc-r790.js'),'utf8')===src,'runtime-text 사본이 client-source 와 같다');
// ── 가짜 엔진 ──
function world({store={},zoneId='last303',layerId='STORY',phase='door',controlled=true,survival=false,ego=false,guideOn=false,done=false,ready=true,noR78=false}={}){
 const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,Promise,performance:{now:()=>0},setTimeout:f=>0,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=10,started=true,modal=false,loading=false,storyScene=null,guide=${guideOn},zone=${JSON.stringify(zoneId)},layer=${JSON.stringify(layerId)},zoom=1;
  var __st={version:1,phase:${JSON.stringify(phase)},route:1,rallied:[],doorStoryDone:false,exitStoryDone:false},__ctl=${controlled},__done=${done},__ready=${ready};
  var room={id:zone,layer:layer,${ego?"egoVisitId151:'v1',":''}props:[{id:'lamp',x:17.8,y:23.5,solid:true,path:'assets/r92/lights/l.png'}],enemies:[
    {id:'last303:l303-boss',nativeId:'l303-boss',name:'불면귀',boss:true,hp:1000,maxHp:1000,spawnState:'active',x:16,y:12},{id:'m1',nativeId:'l302-e1',name:'주민',hp:10,maxHp:10,spawnState:'active',x:20,y:30}],
   objective:{x:15,y:13},exploration:{bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:20,y:20,width:6,depth:.24,axis:'y',reach:3},{id:'door-1',x:85.5,y:64,axis:'y'},{id:'door-2',x:5,y:6,axis:'y'}]},worldWardR81:{bossBounds:[6,6,26,20]}}};
  var player={x:20,y:22,hp:100,hero:'hwando'};var __log={base:0,panel:[],toast:[],save:0,closed:0,killBase:[],propBase:[],drawn:[],added:[],hud:0};var __btn={};var __el={questText:{textContent:''},hint:{textContent:''}};
  function $(id){return __el[id]||null;}function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function blocked(x,y,r){r=r||.27;if(y>20.12+r&&y<27&&x>17.5+r&&x<22.5-r)return false;if(y<20-.12-r&&y>6&&x>6&&x<26)return false;if(y>=27&&y<40)return false;return true;}
  function clearPath3(){return true;}function completed(id,l){return __done&&id==='last303'&&(l||layer)==='STORY';}
  function interact(){__log.base++;return 'base';}function openPanel(h){modal=true;__log.panel.push(String(h));}function closePanel(){modal=false;__log.closed++;}
  function button(id,fn){__btn[id]=fn;}function toast(t){__log.toast.push(String(t));}function saveGame(){__log.save++;return true;}function escapeHTML(s){return String(s);}
  function serializeSave(){return {version:5};}async function restoreSave(raw){return true;}async function newGame(){return true;}function makeRoom(){return room;}
  function tick(dt){time+=dt;}function updateHUD(){__log.hud++;__el.questText.textContent='보스 구역 문 앞 C · 기억 확인';}
  function drawProp(p){__log.propBase.push(p.id);}function killEnemy(e){__log.killBase.push(e.id);e.hp=0;e.deadRecorded=true;return true;}
  function project(x,y){return {x:x*10,y:y*10};}function actorHeight(){return 66*zoom;}
  function readyImage(p){return __ready?{ready:true,image:{src:'http://x/m0/'+p,naturalWidth:384,naturalHeight:384}}:null;}function addImage(p){__log.added.push(p);}
  function drawAssetFrame3(path,frame,x,y,h,opt){__log.drawn.push({path,x,y,h,alpha:opt&&opt.alpha,frame});return true;}
  var ctx={commands:[],scope:(o,f)=>f()};
  ${noR78?'':"window.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>r===room&&__st?JSON.parse(JSON.stringify(__st)):null,controlled:r=>r===room&&__ctl};"}
  window.__STORYWORLD_WORLD_R74__=Object.freeze({interactions:()=>[{id:'door-0',kind:'door',label:'문 열기',point:{x:20,y:20},reach:3}],canUse:()=>'baseCan',use:()=>'baseUse',isOpen:()=>false});
  window.__STORYWORLD_SURVIVAL_R600__={active:()=>${survival}};`,c);
 vm.runInContext(src,c,{filename:'npc-r790.js'});
 const run=s=>vm.runInContext(s,c);return {c,run,api:c.__STORYWORLD_NPC_R790__,log:()=>run('__log'),store};}
const NPCID='r790:npc:last303:youth';
// ── ① 정상 경로 ──
{const w=world();ok(w.api&&typeof w.api.inspect==='function','API');w.run('tick(.1)');
 const p=w.run(`room.props.find(p=>p.r790NPC)`);ok(p,'문 단계에서 앳된 남자가 선다');eq(p.id,NPCID,'id');eq(p.solid,false,'길을 막지 않는다');eq(p.autoTargetEligible6,false,'자동 조준 대상 아님');
 const dd=Math.hypot(p.x-20,p.y-20);ok(dd<3.2&&dd>1.2,'보스 문 3.2칸 안, 문턱에서는 떨어져: '+dd.toFixed(2));ok(p.y>20.5,'문 바깥(들어오는 쪽)에 선다');ok(Math.abs(p.x-20)>=1.2,'통로 가운데 줄을 비운다');
 ok(!w.run(`blocked(${p.x},${p.y},.34)`),'막힌 칸이 아니다');ok(Math.hypot(p.x-17.8,p.y-23.5)>1.5,'석등과 겹치지 않는다');
 ok(w.api.inspect().gate===true,'관문이 걸려 있다');ok(w.api.taken()===false,'아직 안 마심');
 // 문 앞에서 E → 창, 기억(doorStory)은 시작되지 않는다
 const r=w.run('interact()');eq(w.log().base,0,'귀비탕 전에는 문 처리기로 넘어가지 않는다');eq(w.log().panel.length,1,'창이 열린다');ok(r===true,'처리함');
 const h=w.log().panel[0];ok(h.includes('앳된 남자'),'이름');ok(h.includes('귀비탕'),'귀비탕 언급');ok(h.includes('id="npcTakeR790"')&&h.includes('id="npcWaitR790"'),'버튼 둘');ok(h.includes('assets/r790/npc/youth-bust.webp'),'상반신 그림');
 ok(!/<script|onerror=/i.test(h),'창 안에 스크립트 없음');
 // '아직' → 닫히고 그대로
 w.run('__btn.npcWaitR790()');eq(w.run('modal'),false,'닫힘');ok(w.api.taken()===false,'아직은 그대로');eq(w.log().base,0,'문 처리기 안 부름');
 w.run('interact()');eq(w.log().panel.length,2,'다시 말을 걸 수 있다');
 // 받아 마신다 → 기록·저장·알림 → 문 처리기(기억)로 이어짐
 w.run('__btn.npcTakeR790()');ok(w.api.taken()===true,'마심');eq(w.run('modal'),false,'창 닫힘');ok(w.log().save>=1,'저장');ok(w.log().toast.some(t=>/귀비탕/.test(t)&&/악몽저항/.test(t)),'귀비탕·악몽저항 알림');
 eq(w.log().base,1,'문 가까이면 바로 보스 문의 기억으로 이어진다');
 // 그 뒤에는 그대로 통과
 w.run('interact()');eq(w.log().base,2,'마신 뒤에는 원래 처리');eq(w.log().panel.length,2,'창 없음');ok(w.api.inspect().gate===false,'관문 풀림');
 // 저장에 실림
 const raw=w.run('serializeSave()');eq(JSON.parse(JSON.stringify(raw.npcR790)),{version:1,rooms:{'STORY:last303':{gwibitang:true}}},'세이브 기록');eq(raw.version,5,'원래 세이브 값 유지');}
// ── ② 경계: 거리 ──
{const w=world();w.run('tick(.1)');const p=w.run(`room.props.find(p=>p.r790NPC)`);
 // 문에서 정확히 3.2(미만 아님), NPC 에서 2.4 넘게 → 원래 처리
 w.run(`player.x=20;player.y=23.2`);const dn=Math.hypot(20-p.x,23.2-p.y);
 if(dn>2.4){w.run('interact()');eq(w.log().base,1,'문 3.2·NPC 2.4 밖이면 원래 처리');eq(w.log().panel.length,0,'창 없음');}
 // NPC 에서 정확히 2.4 이하, 문에서는 멀리 → 창. 마시면 문이 멀어 원래 처리기는 안 부르고 안내만.
 w.run(`player.x=${p.x};player.y=${p.y}+2.4`);ok(Math.hypot(p.x-20,p.y+2.4-20)>=3.2,'이 자리는 문에서 3.2 이상');w.run('interact()');eq(w.log().panel.length,1,'NPC 2.4 이하면 창');
 const b0=w.log().base;w.run('__btn.npcTakeR790()');eq(w.log().base,b0,'문이 멀면 문 처리기를 대신 누르지 않는다');ok(w.log().toast.some(t=>/보스 구역 문/.test(t)),'문으로 가라는 안내');
 w.run(`player.x=${p.x};player.y=${p.y}+2.41`);}
{const w=world();w.run('tick(.1)');const p=w.run(`room.props.find(p=>p.r790NPC)`);w.run(`player.x=${p.x}+2.45;player.y=${p.y}+3`);w.run('interact()');eq(w.log().panel.length,0,'NPC 2.4 밖·문 3.2 밖 → 창 없음');eq(w.log().base,1,'원래 처리');}
// ── ② 경계: 단계 ──
for(const ph of ['route','rally']){const w=world({phase:ph});w.run('tick(.1)');ok(!w.run(`room.props.some(p=>p.r790NPC)`),ph+' 단계에는 아직 서 있지 않다');w.run('interact()');eq(w.log().base,1,ph+': 원래 처리(먼저 들판 정리)');eq(w.log().panel.length,0,ph+': 창 없음');ok(w.api.inspect().gate===false,ph+': 관문 아님');}
for(const ph of ['doorStory','boss','exit','exitStory','done']){const w=world({phase:ph});w.run('tick(.1)');ok(w.api.taken()===true,ph+' 단계 세이브는 마신 것으로 본다(옛 세이브)');ok(w.run(`room.props.some(p=>p.r790NPC)`),ph+': 서 있다');w.run('interact()');eq(w.log().base,1,ph+': 원래 처리');eq(w.log().panel.length,0,ph+': 창 없음');
 w.run('killEnemy(room.enemies[0])');eq(w.run('room.enemies[0].hp'),0,ph+': 보스를 쓰러뜨릴 수 있다');}
{const w=world({phase:'route',done:true});ok(w.api.taken()===true,'완료한 지역은 마신 것으로');}
// 단계가 route → door 로 넘어가는 틱에 나타난다 + 안개 속에서 서서히
{const w=world({phase:'rally'});w.run('tick(.1)');ok(!w.run(`room.props.some(p=>p.r790NPC)`),'집결 중엔 없음');w.run(`__st.phase='door';tick(.1)`);const p=w.run(`room.props.find(p=>p.r790NPC)`);ok(p,'들판을 정리하면 나타난다');
 w.run(`drawProp(room.props.find(p=>p.r790NPC))`);const a0=w.log().drawn.at(-1).alpha;ok(a0<.35,'처음엔 흐리다: '+a0);w.run('tick(3)');w.run(`drawProp(room.props.find(p=>p.r790NPC))`);const a1=w.log().drawn.at(-1).alpha;ok(a1>.95&&a1<=1,'곧 또렷해진다: '+a1);
 eq(w.log().propBase.length,0,'엔진 조형물 그리기는 안 탄다');eq(w.log().drawn.at(-1).path,'assets/r790/npc/youth.webp','그림 경로');ok(Math.abs(w.log().drawn.at(-1).h-66*286/286)<8||w.log().drawn.at(-1).h>40,'키');
 w.run(`drawProp(room.props[0])`);eq(w.log().propBase,['lamp'],'다른 조형물은 엔진 그대로');}
// 그림이 아직 안 실렸으면 그리지 않고 청한다(검은 네모·엉뚱한 그림 금지)
{const w=world({ready:false});w.run('tick(.1)');const d0=w.log().drawn.length;w.run(`drawProp(room.props.find(p=>p.r790NPC))`);eq(w.log().drawn.length,d0,'안 실렸으면 안 그림');ok(w.log().added.includes('assets/r790/npc/youth.webp'),'그림을 청한다');}
// ── ② 길잡이: 창 없이 바로 ──
{const w=world({guideOn:true});w.run('tick(.1)');const r=w.run('interact()');eq(w.log().panel.length,0,'길잡이 중엔 창을 열지 않는다(멈춤 방지)');eq(w.run('modal'),false,'창 없음');ok(w.api.taken()===true,'바로 마심');eq(w.log().base,1,'문의 기억으로 이어짐');ok(w.log().toast.some(t=>/귀비탕/.test(t)),'알림');}
// ── ③ 핵 봉인 ──
{const w=world();w.run('tick(.1)');const r=w.run('killEnemy(room.enemies[0])');eq(r,false,'귀비탕 없이는 쓰러뜨릴 수 없다');ok(w.run('room.enemies[0].hp')>=1,'보스 체력이 남는다');ok(!w.run('room.enemies[0].deadRecorded'),'죽음 기록 없음');eq(w.log().killBase,[],'엔진 처치 안 탐');
 ok(w.log().toast.some(t=>/귀비탕/.test(t)),'이유 알림');const t0=w.log().toast.length;w.run('killEnemy(room.enemies[0])');eq(w.log().toast.length,t0,'알림은 잦지 않게(같은 순간 한 번)');
 w.run('killEnemy(room.enemies[1])');eq(w.log().killBase,['m1'],'일반 몹은 그대로 죽는다');
 w.run('interact();__btn.npcTakeR790();killEnemy(room.enemies[0])');eq(w.run('room.enemies[0].hp'),0,'마신 뒤에는 쓰러뜨릴 수 있다');}
// 제외: 다른 지역·사몽 층·협동(제어 아님)·무한 생존·EGO 재방문·R78 없음·끄기
for(const [name,o] of [['다른 지역',{zoneId:'last302'}],['사몽 층',{layerId:'DREAM'}],['협동/특수(제어 아님)',{controlled:false}],['무한 생존',{survival:true}],['EGO 재방문',{ego:true}],['R78 없음',{noR78:true}],['끄기',{store:{'storyworld.r790.npc':'{"on":false}'}}]]){
 const w=world(o);w.run('tick(.1)');ok(!w.run(`room.props.some(p=>p.r790NPC)`),name+': NPC 없음');w.run('interact()');eq(w.log().base,1,name+': 상호작용 그대로');eq(w.log().panel.length,0,name+': 창 없음');
 w.run('killEnemy(room.enemies[0])');eq(w.run('room.enemies[0].hp'),0,name+': 보스 처치 그대로');ok(w.api.inspect().gate===false,name+': 관문 아님');
 w.run('updateHUD()');eq(w.run('__el.questText.textContent'),'보스 구역 문 앞 C · 기억 확인',name+': HUD 그대로');}
// ── ④ 회귀: 창·불러오기·쓰러짐·시작 전 ──
for(const [name,s] of [['창',"modal=true"],['불러오기',"loading=true"],['쓰러짐',"player.hp=0"],['시작 전',"started=false"]]){const w=world();w.run('tick(.1)');w.run(s);w.run('interact()');eq(w.log().base,1,name+': 원래 처리기에 맡긴다');eq(w.log().panel.length,0,name+': 창 없음');ok(w.api.taken()===false,name+': 안 마심');}
// HUD
{const w=world();w.run('tick(.1);updateHUD()');const q=w.run('__el.questText.textContent');ok(/앳된 남자/.test(q)&&/귀비탕/.test(q),'문 단계 목표 글: '+q);
 w.run('interact();__btn.npcTakeR790();updateHUD()');eq(w.run('__el.questText.textContent'),'보스 구역 문 앞 C · 기억 확인','마신 뒤 목표 글은 원래대로');}
// 상호작용 목록(모바일 버튼·커서)
{const w=world();w.run('tick(.1)');const W=()=>w.run('window.__STORYWORLD_WORLD_R74__');const rows=W().interactions();eq(rows.length,2,'문 + NPC');const t=rows.find(t=>t.kind==='npc');ok(t&&t.id===NPCID&&/앳된 남자/.test(t.label),'NPC 대상');ok(t.reach<=2.6&&t.reach>=2,'닿는 거리');
 w.run(`player.x=${t.point.x};player.y=${t.point.y}+1`);eq(W().canUse(t),true,'가까우면 쓸 수 있다');w.run(`player.x=${t.point.x};player.y=${t.point.y}+2.6`);eq(W().canUse(t),false,'멀면 못 쓴다');
 eq(W().canUse({id:'door-0',kind:'door'}),'baseCan','문은 원래 판정');eq(W().use({id:'door-0',kind:'door'}),'baseUse','문은 원래 사용');
 w.run(`player.x=${t.point.x};player.y=${t.point.y}+1`);ok(W().use(t)===true,'쓰면 창');eq(w.log().panel.length,1,'창 열림');
 w.run('__btn.npcTakeR790()');eq(W().interactions().length,1,'마신 뒤에는 목록에서 빠진다');}
// 세이브 복원·새 게임
(async()=>{
 {const w=world();w.run('tick(.1)');await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last303':{gwibitang:true}}}})`);ok(w.api.taken()===true,'복원: 마심');w.run('interact()');eq(w.log().base,1,'복원 뒤 통과');
  await w.run('newGame()');ok(w.api.taken()===false,'새 게임: 지워짐');}
 for(const bad of ['{npcR790:{version:2,rooms:{"STORY:last303":{gwibitang:true}}}}','{npcR790:{version:1,rooms:[1]}}','{npcR790:{version:1,rooms:{"STORY:evil":{gwibitang:true},"__proto__":{gwibitang:true},"STORY:last303":{gwibitang:"yes",x:1}}}}','{npcR790:"x"}','{npcR790:null}','{}','null']){
  const w=world();w.run('tick(.1)');await w.run(`(async()=>{try{await restoreSave(${bad});}catch(e){__log.threw=String(e);}})()`);ok(!w.log().threw,'깨진 저장값에 던지지 않는다: '+bad);ok(w.api.taken()===false,'깨진 값은 버린다: '+bad);
  const raw=w.run('serializeSave()');eq(JSON.parse(JSON.stringify(raw.npcR790)),{version:1,rooms:{}},'다시 저장하면 깨끗');}
 // 배치 순수 함수: 문 방향이 달라도 들어오는 쪽·옆으로
 {const w=world(),P=w.api.pure;const open=()=>false;
  const a=P.spot({x:20,y:20,axis:'y'},[6,6,26,20],open);ok(a.y>20&&Math.abs(a.x-20)>=1.2,'보스방이 위면 아래에');
  const b=P.spot({x:20,y:20,axis:'y'},[6,20,26,34],open);ok(b.y<20,'보스방이 아래면 위에');
  const c=P.spot({x:20,y:20,axis:'x'},[6,6,20,34],open);ok(c.x>20&&Math.abs(c.y-20)>=1.2,'세로 문: 보스방이 왼쪽이면 오른쪽에');
  eq(P.spot({x:20,y:20,axis:'y'},[6,6,26,20],()=>true),null,'모두 막혔으면 없음(억지로 세우지 않음)');
  eq(P.clean({version:1,rooms:{'STORY:last303':{gwibitang:true}}}),{'STORY:last303':{gwibitang:true}},'clean 정상');eq(P.clean(undefined),{},'clean 없음');}
 console.log('R790 CPU 검사 통과: '+n+'개');
})().catch(e=>{console.error(e);process.exit(1);});
