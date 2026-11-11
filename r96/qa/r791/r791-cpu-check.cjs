// R791 CPU 검사: 서사 핵심 NPC 둘째 — 고블린 두목과 장미 인장(last305). 사용자 2026-11-11 "서사마다 중요엔피시를 넣어서 상호작용해서 진행하는방식 너무많이는말고 중요포인트만".
//  정본 32장 "싸움이 끝난 뒤, 패배한 두목을 통해 … 그가 남긴 장미 인장을 칼 가까이 가져가자 공명이 일었다. 공간에 균열이 열리면서".
//  ① 정상: 보스(고블린 추장)를 쓰러뜨리면(R78 phase 'exit') 쓰러진 자리(기억 제단 곁)에 패배한 두목이 서고, 그에게서 장미 인장을 받아야 뒷이야기(제단 서사·출구 문의 기억)가 시작된다.
//     (헤드리스 실측으로 바뀐 요구: 출구 단계에는 제단에서도 뒷이야기를 읽을 수 있고 길잡이는 제단부터 누른다 → 제단과 출구 문을 함께 건다.)
//  ② 경계: 거리, 단계(boss 이전엔 없음), 길잡이 자동, '아직'.
//  ③ 회귀: R790 불면귀 관문은 그대로(따로 r790 검사), 옛 세이브(exitStory·done·완료)는 받은 것으로, 두 지역 기록이 섞이지 않음, 핵 봉인 같은 처치 막기는 last305 에 없음.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','npc-r790.js'),'utf8');
// 회귀(R790 첫 푸시 CI): 단계 이름에 ': ' 가 있으면 pages.yml 전체가 YAML 오류로 한 번도 안 돈다.
{const y=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').split('\n'),i=y.findIndex(l=>l.includes('node r96/qa/r791/r791-cpu-check.cjs'));ok(i>0&&/^\s+- name: /.test(y[i-1])&&!y[i-1].replace(/^\s+- name: /,'').includes(': '),'pages.yml 단계 이름에 콜론+빈칸 없음');}
ok(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r791/r791-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(fs.readFileSync(path.join(R,'runtime-text','npc-r790.js'),'utf8')===src,'runtime-text 사본이 같다');
const CHIEF='assets/r99/clean/assets/generated-v31224/actors-normalized/a43f2c5d3855_Monster_GoblinFluteKing.webp';/* 게임이 실제로 그리는 R99 손질본 */
ok(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes(CHIEF)||fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes('generated-v31224'),'두목 그림은 이미 게임에 있는 보스 그림');
function world({store={},zoneId='last305',phase='exit',controlled=true,survival=false,ego=false,guideOn=false,done=false,ready=true}={}){
 const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,Promise,performance:{now:()=>0},setTimeout:f=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=10,started=true,modal=false,loading=false,storyScene=null,guide=${guideOn},zone=${JSON.stringify(zoneId)},layer='STORY',zoom=1;
  var __st={version:1,phase:${JSON.stringify(phase)},route:1,rallied:[],doorStoryDone:true,exitStoryDone:false},__ctl=${controlled},__done=${done},__ready=${ready};
  var room={id:zone,layer:layer,${ego?"egoVisitId151:'v1',":''}props:[],enemies:[{id:zone+':boss',nativeId:zone==='last303'?'l303-boss':'l305-boss',name:zone==='last303'?'불면귀':'고블린 추장',boss:true,hp:1000,maxHp:1000,spawnState:'active',x:16,y:12}],
   objective:{x:15,y:13},exploration:{bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:20,y:20,width:6,depth:.24,axis:'y',reach:3},{id:'door-1',x:85.5,y:64,axis:'y'},{id:'door-2',x:5,y:6,width:6,depth:.24,axis:'y',reach:3}]},worldWardR81:{bossBounds:[6,6,26,20]}}};
  var player={x:15,y:14.5,hp:100};var __log={base:0,panel:[],toast:[],save:0,killBase:[],propBase:[],drawn:[],added:[]};var __btn={};var __el={questText:{textContent:''}};
  function $(id){return __el[id]||null;}function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function blocked(x,y,r){r=r||.27;if(y>6.12+r&&y<20-.12-r&&x>2+r&&x<26-r)return false;if(y>20.12+r&&y<27&&x>17.5+r&&x<22.5-r)return false;return true;}
  function completed(id,l){return __done&&id===zone;}function interact(){__log.base++;return 'base';}function openPanel(h){modal=true;__log.panel.push(String(h));}function closePanel(){modal=false;}
  function button(id,fn){__btn[id]=fn;}function toast(t){__log.toast.push(String(t));}function saveGame(){__log.save++;return true;}function escapeHTML(s){return String(s);}
  function serializeSave(){return {version:5};}async function restoreSave(raw){return true;}async function newGame(){return true;}function tick(dt){time+=dt;}function updateHUD(){__el.questText.textContent='출구 문 앞 C · 다음 기억';}
  function drawProp(p){__log.propBase.push(p.id);}function killEnemy(e){__log.killBase.push(e.id);e.hp=0;return true;}function project(x,y){return {x:x*10,y:y*10};}function actorHeight(){return 66;}
  function readyImage(p){return __ready?{ready:true,image:{src:'http://x/m0/'+p,naturalWidth:672,naturalHeight:384}}:null;}function addImage(p){__log.added.push(p);}
  function drawAssetFrame3(path,frame,x,y,h,opt){__log.drawn.push({path,x,y,h,alpha:opt&&opt.alpha,frame});return true;}var ctx={commands:[],scope:(o,f)=>f()};
  window.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>r===room&&__st?JSON.parse(JSON.stringify(__st)):null,controlled:r=>r===room&&__ctl};
  window.__STORYWORLD_WORLD_R74__=Object.freeze({interactions:()=>[{id:'door-2',kind:'door',label:'문 열기',point:{x:5,y:6},reach:3}],canUse:()=>'baseCan',use:()=>'baseUse',isOpen:()=>false});
  window.__STORYWORLD_SURVIVAL_R600__={active:()=>${survival}};`,c);
 vm.runInContext(src,c,{filename:'npc-r790.js'});const run=s=>vm.runInContext(s,c);return {run,api:c.__STORYWORLD_NPC_R790__,log:()=>run('__log')};}
const ID='r790:npc:last305:chief';
// ── ① 정상 ──
{const w=world();ok(w.api.zones().includes('last305')&&w.api.zones().includes('last303'),'두 지역이 등록');w.run('tick(.1)');const p=w.run('room.props.find(p=>p.r790NPC)');ok(p,'보스를 쓰러뜨린 뒤 두목이 선다');eq(p.id,ID,'id');eq(p.solid,false,'길 안 막음');
 const dd=Math.hypot(p.x-15,p.y-13);ok(dd<=2.4&&dd>=1.5,'쓰러진 자리 = 기억 제단 곁: '+dd.toFixed(2));ok(!w.run(`blocked(${p.x},${p.y},.34)`),'빈 자리');
 ok(w.api.inspect().gate===true,'관문');const r=w.run('interact()');ok(r===true,'처리');eq(w.log().base,0,'인장 전에는 제단의 뒷이야기로 넘어가지 않는다');eq(w.log().panel.length,1,'창');
 const h=w.log().panel[0];ok(h.includes('고블린 두목')&&h.includes('장미 인장'),'창 글');ok(h.includes('id="npcTakeR790"')&&h.includes('id="npcWaitR790"'),'버튼');ok(!h.includes('귀비탕'),'불면귀 글이 섞이지 않는다');ok(!/<script|onerror=/i.test(h),'스크립트 없음');
 w.run('__btn.npcWaitR790()');ok(!w.api.taken(),'아직');w.run('interact()');w.run('__btn.npcTakeR790()');ok(w.api.taken(),'받음');eq(w.log().base,1,'제단 곁이면 바로 뒷이야기로 이어진다');ok(w.log().toast.some(t=>/장미 인장/.test(t)),'알림');ok(w.log().save>=1,'저장');
 eq(w.run('serializeSave()').npcR790,{version:1,rooms:{'STORY:last305':{roseSeal:true}}},'세이브 기록');w.run('interact()');eq(w.log().base,2,'그 뒤엔 원래 처리');}
// 그림: 이미 있는 보스 그림(672x384) 한 칸, 엔진 조형물 길은 안 탐
{const w=world();w.run('tick(3)');w.run('drawProp(room.props.find(p=>p.r790NPC))');const d=w.log().drawn.at(-1);eq(d.path,CHIEF,'두목 그림');eq(d.frame.assetFrame.sourceRect,[0,0,672,384],'칸');ok(d.h>66,'영웅보다 큰 보스 체구: '+d.h);eq(w.log().propBase.length,0,'엔진 길 안 탐');}
// ── ② 단계 ──
for(const ph of ['route','rally','door','doorStory','boss']){const w=world({phase:ph});w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),ph+': 아직 싸우기 전·싸우는 중이라 없다');w.run('interact()');eq(w.log().base,1,ph+': 원래 처리');eq(w.log().panel.length,0,ph+': 창 없음');ok(!w.api.taken(),ph+': 안 받음');
 w.run('killEnemy(room.enemies[0])');eq(w.run('room.enemies[0].hp'),0,ph+': last305 보스 처치는 막지 않는다(봉인 없음)');}
for(const ph of ['exitStory','done']){const w=world({phase:ph});w.run('tick(.1)');ok(w.api.taken(),ph+': 받은 것으로(옛 세이브)');w.run('interact()');eq(w.log().base,1,ph+': 원래 처리');eq(w.log().panel.length,0,ph+': 창 없음');}
{const w=world({phase:'exit',done:true});ok(w.api.taken(),'완료한 지역은 받은 것으로');}
// 화면 확인으로 더한 요구: 창 그림은 두목 윗몸 파생본(작게 보이던 전신 대신), 이름표는 제단 안내 글과 겹치지 않게 발밑에.
ok(fs.existsSync(path.join(R,'runtime-text','assets','r790','npc','chief-bust.webp')),'두목 창 그림 파일');ok(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('assets/r790/npc/chief-bust.webp'),'두목 창 그림이 목록에');
{const w=world();w.run('tick(.1);interact()');const h=w.log().panel[0];ok(h.includes('./assets/r790/npc/chief-bust.webp')&&h.includes('object-fit:cover'),'창에 윗몸 그림');}
{const w=world();w.run('var __txt=[];ctx.fillText=(t,x,y)=>__txt.push({t,x,y});tick(.1);tick(3);drawProp(room.props.find(p=>p.r790NPC))');const t=w.run('__txt[0]'),p=w.run('room.props.find(p=>p.r790NPC)');eq(t.t,'고블린 두목','이름표');ok(t.y>p.y*10,'이름표는 발밑(제단 안내 글과 안 겹침): '+t.y);}
{const w=world({zoneId:'last303',phase:'door'});w.run('var __txt=[];ctx.fillText=(t,x,y)=>__txt.push({t,x,y});tick(.1);tick(3);drawProp(room.props.find(p=>p.r790NPC))');const t=w.run('__txt[0]'),p=w.run('room.props.find(p=>p.r790NPC)');ok(t&&t.y<p.y*10,'회귀: 앳된 남자 이름표는 그대로 머리 위');}
// 보스가 쓰러지는 틱에 나타남
{const w=world({phase:'boss'});w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),'boss 중 없음');w.run("__st.phase='exit';tick(.1)");ok(w.run('room.props.some(p=>p.r790NPC)'),'쓰러뜨리면 나타남');}
// ── ② 거리·출구 문 ──
{const w=world();w.run('tick(.1)');const p=w.run('room.props.find(p=>p.r790NPC)');
 w.run('player.x=22;player.y=17;interact()');eq(w.log().panel.length,0,'제단·두목·출구 문 모두 멀면 창 없음');eq(w.log().base,1,'원래 처리');
 w.run('player.x=15;player.y=13+2.71;interact()');/* 13+2.7-13 은 부동소수로 2.6999… → 경계 바로 바깥 */eq(w.log().base,2,'제단 2.7 밖·두목 2.4 밖 → 원래 처리: '+Math.hypot(15-p.x,15.71-p.y).toFixed(2));
 // 출구 문에서 누르면: 기억으로 넘어가지 않고 먼저 받으라고 알림
 w.run('player.x=5.5;player.y=8;interact()');eq(w.log().base,2,'출구 문: 인장 전에는 출구 문의 기억으로 넘어가지 않는다');eq(w.log().panel.length,0,'멀리 있는 두목의 창을 띄우지 않는다');ok(w.log().toast.some(t=>/먼저/.test(t)&&/장미 인장/.test(t)),'먼저 받으라는 알림');ok(!w.api.taken(),'안 받음');
 // 두목 곁(제단 2.7 밖일 수 있는 자리)에서 받으면 창 → 받기
 w.run(`player.x=${p.x}+1;player.y=${p.y}+1;interact()`);eq(w.log().panel.length,1,'두목 곁이면 창');w.run('__btn.npcTakeR790()');ok(w.api.taken(),'받음');
 w.run('player.x=5.5;player.y=8;interact()');eq(w.log().base>=3,true,'받은 뒤 출구 문은 원래 처리');}
{const w=world({guideOn:true});w.run('tick(.1);player.x=5.5;player.y=8;interact()');eq(w.log().panel.length,0,'길잡이가 출구 문부터 눌러도 창 없음');ok(w.api.taken(),'멈추지 않게 바로 받음');eq(w.log().base,1,'출구 문의 기억으로');}
// ── 길잡이 ──
{const w=world({guideOn:true});w.run('tick(.1);interact()');eq(w.log().panel.length,0,'길잡이: 창 없음');ok(w.api.taken(),'바로 받음');eq(w.log().base,1,'제단의 뒷이야기로');}
// ── 제외 ──
for(const [name,o] of [['제어 아님',{controlled:false}],['무한 생존',{survival:true}],['EGO 재방문',{ego:true}],['끄기',{store:{'storyworld.r790.npc':'{"on":false}'}}],['다른 지역',{zoneId:'last304'}]]){const w=world(o);w.run('tick(.1)');ok(!w.run('room.props.some(p=>p.r790NPC)'),name+': 없음');w.run('interact()');eq(w.log().base,1,name+': 그대로');eq(w.log().panel.length,0,name+': 창 없음');}
// HUD·상호작용 목록
{const w=world();w.run('tick(.1);updateHUD()');ok(/장미 인장/.test(w.run('__el.questText.textContent')),'목표 글');const rows=w.run('window.__STORYWORLD_WORLD_R74__.interactions()');eq(rows.length,2,'문 + 두목');ok(Math.hypot(rows[1].point.x-15,rows[1].point.y-13)<=2.4,'두목 자리');ok(/고블린 두목/.test(rows[1].label),'라벨');}
// ── ③ 두 지역 기록이 섞이지 않는다 ──
(async()=>{
 {const w=world();await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last303':{gwibitang:true}}}})`);ok(!w.api.taken(),'불면귀 기록으로 장미 인장이 켜지지 않는다');
  await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last305':{gwibitang:true}}}})`);ok(!w.api.taken(),'다른 지역 낱말은 버린다');
  await w.run(`restoreSave({npcR790:{version:1,rooms:{'STORY:last305':{roseSeal:true},'STORY:last303':{gwibitang:true}}}})`);ok(w.api.taken(),'제 기록은 복원');eq(w.run('serializeSave()').npcR790.rooms,{'STORY:last305':{roseSeal:true},'STORY:last303':{gwibitang:true}},'두 지역 모두 보존');}
 // 불면귀 쪽은 exit 단계에서 관문이 아니다(문 단계 관문만)
 {const w=world({zoneId:'last303',phase:'exit'});w.run('tick(.1)');ok(w.api.inspect().gate===false,'last303 exit 단계는 관문 아님');w.run('player.x=20;player.y=22;interact()');eq(w.log().panel.length,0,'창 없음');}
 {const w=world({zoneId:'last303',phase:'door'});w.run('tick(.1);player.x=20;player.y=22;interact()');ok(w.log().panel[0].includes('귀비탕')&&!w.log().panel[0].includes('장미'),'last303 은 여전히 귀비탕');}
 const P=world().api.pure;const q=P.around({x:15,y:13},()=>false);ok(Math.abs(Math.hypot(q.x-15,q.y-13)-1.9)<1e-9,'제단 둘레 1.9칸');eq(P.around({x:15,y:13},()=>true),null,'모두 막혔으면 없음');
 const q2=P.around({x:15,y:13},()=>false,[q]);ok(Math.hypot(q2.x-q.x,q2.y-q.y)>=1.5,'단단한 조형물과 1.5칸 이상');
 console.log('R791 CPU 검사 통과: '+n+'개');
})().catch(e=>{console.error(e);process.exit(1);});
