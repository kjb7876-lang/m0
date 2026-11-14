// R1035 CPU 검사: 곁일(R840) '악에 물든 조형물 부수기'를 맵 왼쪽·오른쪽 두 곳에 나눠 세워 맵 전역을 돌게 한다.
//  사용자 2026-11-14 "npc 상호작용 제거하는거 미션 맵 왼쪽 오른쪽 둘다 가도록 유도 배치해서 맵전역을 돌아다니게 개선적용해줘 특히 불면귀쪽 맵이 이쁘네".
//  ① 정상: 넓은 맵에서 받으면 화면 왼쪽(x−y 가 작은 쪽)과 오른쪽(x−y 가 큰 쪽)에 조형물이 하나씩 선다. 둘 다 부숴야 단서가 떨어진다(어느 쪽 먼저든).
//  ② 경계: 좁은 맵·끔 설정·이어지지 않은 섬·보스 구역·문턱은 피하고, 좁으면 예전처럼 하나만 세운다.
//  ③ 길잡이·영화 모드: 창 없이 가까운 쪽부터 두 곳을 다 부수고 단서를 줍는다(대신 처리 0).
//  ④ 회귀: 세이브 왕복(한쪽만 부순 채)·깨진 세이브·보상 한 번·HUD 에 남은 곳과 방향.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const J=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v,ok=(c,m)=>{assert.ok(c,m);n++;},eq=(a,b,m)=>{assert.deepStrictEqual(J(a),J(b),m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','quest-r840.js'),'utf8');
ok(fs.readFileSync(path.join(R,'runtime-text','quest-r840.js'),'utf8')===src,'runtime-text 사본이 같다');
{const yml=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok(yml.includes('node r96/qa/r1035/r1035-cpu-check.cjs'),'pages.yml CPU 검사 줄');}
const ENTRY={x:88,y:60.5},GATHER={x:16,y:33};
// 맵: 본 땅 x 10~95 · y 2~80 + 왼쪽 아래 끝의 이어지지 않은 섬(x 0~6 · y 90~99, x−y 가 본 땅보다 더 작다). 가운데(60,50)에 기둥.
const WIDE={rects:[[10,2,95,80],[0,90,6,99]]},NARROW={rects:[[74,52,92,66]]};
function world({map=WIDE,zoneId='last302',guideOn=false,store={},boss=[6,6,26,20],pillar=true}={}){
 const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,RegExp,Promise,performance:{now:()=>0},setTimeout:f=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 const cells=[];for(const [x0,y0,x1,y1] of map.rects)for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)cells.push([x,y]);
 vm.runInContext(`var time=10,started=true,modal=false,loading=false,storyScene=null,guide=${guideOn},zone=${JSON.stringify(zoneId)},layer='STORY',zoom=1,route=[],command=null,target=null;
  var __cells=${JSON.stringify(cells)},__set=new Set(__cells.map(c=>c[0]+','+c[1])),__pillar=${pillar};
  var room={id:zone,layer:layer,props:[{id:'deco-1',x:60,y:50,path:'assets/props/v290/dead_tree.webp',height:110,solid:true}],enemies:[],
   objective:{x:15,y:13},exploration:{floorCells:__cells,entry:{id:'r171-entry',x:${ENTRY.x},y:${ENTRY.y},dx:-1,dy:-1},bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:20,y:20,axis:'y'},{id:'door-1',x:85.5,y:64,axis:'y'},{id:'door-2',x:5,y:6,axis:'y'}]},worldWardR81:{bossBounds:${JSON.stringify(boss)},gatherAnchor:{x:${GATHER.x},y:${GATHER.y}}}}};
  var player={x:${ENTRY.x},y:${ENTRY.y},hp:100};var __log={base:0,guideBase:0,panel:[],toast:[],save:0,killBase:[],propBase:[],drawn:[],added:[],collect:[],award:[],atk:0,blocked:0};var __btn={};var __el={questText:{textContent:''}};
  function $(id){return __el[id]||null;}
  function blocked(x,y,r){__log.blocked++;r=r||.27;for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r]])if(!__set.has(Math.floor(x+dx)+','+Math.floor(y+dy)))return true;if(__pillar&&Math.hypot(x-60,y-50)<.8+r)return true;return false;}
  function findPath(a,b){if(blocked(b.x,b.y,.2))return [];var out=[],d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d));for(var i=1;i<=k;i++)out.push({x:a.x+(b.x-a.x)*i/k,y:a.y+(b.y-a.y)*i/k});return out;}
  window.__STORYWORLD_POLISH_R100__={navPath:function(a,b){var r=findPath(a,b);return r.length?[{x:a.x,y:a.y}].concat(r):null;}};
  function nearestEnemy(){return null;}function completed(){return false;}function interact(){__log.base++;return 'base';}function basicAttack(){__log.atk++;return 'atk';}function special(){__log.atk++;return 'sp';}
  function openPanel(h){modal=true;__log.panel.push(String(h));}function closePanel(){modal=false;}function button(id,fn){__btn[id]=fn;}function toast(t){__log.toast.push(String(t));}function saveGame(){__log.save++;return true;}function escapeHTML(s){return String(s).replace(/</g,'&lt;');}
  function serializeSave(){return {version:5};}async function restoreSave(raw){return true;}async function newGame(){return true;}function tick(dt){time+=dt;}function guideStep(dt){__log.guideBase++;return 'gbase';}
  function updateHUD(){__el.questText.textContent='중앙 집결실로';}function drawProp(p){__log.propBase.push(p.id);return 'pbase';}function killEnemy(e){e.hp=0;return true;}
  function project(x,y){return {x:(x-y)*10,y:(x+y)*5};}function actorHeight(){return 66;}function fx(){}function sound(){}
  function readyImage(p){return {ready:true,image:{src:p}};}function addImage(p){__log.added.push(p);}function drawAssetFrame3(){return true;}
  var ctx={commands:[],scope:(o,f)=>f(),save(){},restore(){},fillText(){},fillRect(){},createRadialGradient(){return {addColorStop(){}};}};
  window.__STORYWORLD_WORLD_COMBAT_R78__={state:r=>r===room?{version:2,phase:'route'}:null,controlled:r=>r===room};
  window.__STORYWORLD_WORLD_R74__=Object.freeze({interactions:()=>[],canUse:()=>'baseCan',use:()=>'baseUse',isOpen:()=>false});
  window.__STORYWORLD_PROGRESSION_R62__={awardPointDrop:(a,id)=>{if(__log.award.some(x=>x[1]===id))return false;__log.award.push([a,id]);return true;}};
  window.__STORYWORLD_PLAY_R169__={collect:n=>{if(__log.collect.some(b=>b.key===n.key))return false;__log.collect.push(n);return true;}};`,c);
 vm.runInContext(src,c,{filename:'quest-r840.js'});const run=s=>vm.runInContext(s,c);const api=c.__STORYWORLD_QUEST_R840__;
 const props=()=>J(run('room.props.filter(p=>p.r840Prop)')),orb=()=>run('room.props.find(p=>p.r840Clue)'),npc=()=>run('room.props.find(p=>p.r840NPC)');
 const at=(p,dx=.9,dy=.3)=>run(`player.x=${p.x+dx};player.y=${p.y+dy};`);
 const take=()=>{run('tick(.1)');at(npc());run('interact()');run('__btn.questTakeR840()');run('tick(.1)');};
 const smash=p=>{at(p,1.1,0);for(let i=0;i<3;i++){run('time+=1');run('interact()');}};
 return {run,api,log:()=>run('__log'),props,orb,npc,at,take,smash,st:()=>api.inspect().state};}
const S=p=>p.x-p.y;
// ── ① 정상 ──
let wideSpots;
{const w=world();w.take();eq(w.st(),'on','받음');const ps=w.props();eq(ps.length,2,'넓은 맵: 조형물 두 곳 '+JSON.stringify(ps.map(p=>[p.x,p.y])));
 const L=ps.reduce((a,b)=>S(a)<S(b)?a:b),Rr=ps.reduce((a,b)=>S(a)>S(b)?a:b);wideSpots={L,R:Rr};
 ok(S(L)<S(ENTRY)-30&&S(L)<S(GATHER)-20,'한 곳은 화면 왼쪽 끝 쪽(x−y '+S(L).toFixed(1)+')');ok(S(Rr)>S(ENTRY)+20,'다른 곳은 화면 오른쪽 끝 쪽(x−y '+S(Rr).toFixed(1)+')');
 ok(Math.hypot(L.x-Rr.x,L.y-Rr.y)>=40,'두 곳은 멀리 떨어져 있다');ok(L.x>=10,'이어지지 않은 섬에는 세우지 않는다');
 for(const p of ps){ok(!w.run(`blocked(${p.x},${p.y},.34)`),'빈 칸 '+p.id);ok(!(p.x>=6-3&&p.x<=26+3&&p.y>=6-3&&p.y<=20+3),'보스 구역(+3칸)에는 세우지 않는다');ok(Math.hypot(p.x-85.5,p.y-64)>=3.2,'문턱 곁 아님');ok(Math.hypot(p.x-60,p.y-50)>=2.6,'다른 조형물에서 2.6칸 넘게(끝자리 석등·나무에 붙지 않게)');eq(p.solid,false,'길을 막지 않는다');ok(p.path===undefined,'평소 그림 경로 없음(등불 오인 방지)');}
 ok(new Set(ps.map(p=>p.id)).size===2,'id 가 서로 다르다');
 const hud=(w.run('updateHUD()'),w.run('__el.questText.textContent'));ok(/남은 2곳/.test(hud)&&/왼쪽/.test(hud)&&/오른쪽/.test(hud),'HUD: 남은 곳과 방향 '+hud);
 ok(w.log().toast.some(t=>/왼쪽/.test(t)&&/오른쪽/.test(t)),'받을 때 왼쪽·오른쪽 두 곳이라고 알린다');
 const rows=J(w.run('window.__STORYWORLD_WORLD_R74__.interactions()'));eq(rows.filter(r=>/^r840:prop:/.test(r.id)).length,2,'상호작용 목록에 두 곳 모두');
 // 왼쪽 먼저
 w.smash(L);eq(w.st(),'on','한 곳만 부수면 아직 on');eq(w.props().length,1,'남은 한 곳');ok(!w.orb(),'단서는 아직');ok(w.log().toast.some(t=>/남은 1곳/.test(t)),'남은 곳을 알린다');
 const hud2=(w.run('updateHUD()'),w.run('__el.questText.textContent'));ok(/남은 1곳/.test(hud2)&&/오른쪽/.test(hud2)&&!/왼쪽/.test(hud2),'HUD: 남은 오른쪽 '+hud2);
 w.smash(Rr);eq(w.st(),'drop','둘 다 부수면 단서');const o=w.orb();ok(o&&Math.hypot(o.x-Rr.x,o.y-Rr.y)<.01,'마지막 조형물 자리에 떨어진다');
 w.run('time+=2');w.at(o,.2,.2);w.run('tick(.1)');eq(w.st(),'done','줍기 → 끝');eq(w.log().collect.length,1,'단서 한 장');eq(w.log().award.length,1,'보상 한 번');}
// 오른쪽 먼저도 된다 + 같은 맵은 같은 자리
{const w=world();w.take();const ps=w.props();const Rr=ps.reduce((a,b)=>S(a)>S(b)?a:b),L=ps.reduce((a,b)=>S(a)<S(b)?a:b);ok(Math.hypot(L.x-wideSpots.L.x,L.y-wideSpots.L.y)<.01&&Math.hypot(Rr.x-wideSpots.R.x,Rr.y-wideSpots.R.y)<.01,'같은 맵이면 같은 자리');
 w.smash(Rr);eq(w.st(),'on','오른쪽만: on');w.smash(L);eq(w.st(),'drop','왼쪽까지: 단서');}
// 한 곳의 세 대는 섞이지 않는다(왼쪽 두 대 + 오른쪽 한 대 ≠ 부숨)
{const w=world();w.take();const ps=w.props();const L=ps.reduce((a,b)=>S(a)<S(b)?a:b),Rr=ps.reduce((a,b)=>S(a)>S(b)?a:b);
 w.at(L,1.1,0);for(let i=0;i<2;i++){w.run('time+=1');w.run('interact()');}w.at(Rr,1.1,0);w.run('time+=1');w.run('interact()');eq(w.props().length,2,'세 대를 다 채운 곳이 없으면 그대로');}
// ── ② 경계 ──
{const w=world({map:NARROW});w.take();const ps=w.props();ok(ps.length<=1,'좁은 맵은 예전처럼 하나(또는 바로 단서) '+ps.length);}
{const w=world({store:{'storyworld.r840.quest':JSON.stringify({on:true,spread:false})}});w.take();eq(w.props().length,1,'spread 끔: 예전처럼 하나');}
{const w=world();ok(w.api.set({spread:false}).spread===false,'set({spread:false})');ok(w.api.set({spread:true}).spread===true,'set({spread:true})');}
{const w=world({boss:[78,2,95,22]});w.take();const ps=w.props();eq(ps.length,2,'보스 구역이 오른쪽 끝이어도 두 곳');for(const p of ps)ok(!(p.x>=75&&p.y<=25),'보스 구역(+3칸) 밖 '+JSON.stringify([p.x,p.y]));}
// 계산은 방마다 한 번(무겁지 않게)
{const w=world();w.take();const b0=w.log().blocked;for(let i=0;i<20;i++)w.run('tick(.1)');ok(w.log().blocked-b0<400,'틱마다 다시 계산하지 않는다 '+(w.log().blocked-b0));}
// ── ③ 길잡이·영화 모드 ──
function drive(w,max=600){let i=0;for(;i<max&&w.st()!=='done';i++){w.run('guideStep(.25)');w.run('if(route.length){var e=route[route.length-1];player.x=e.x;player.y=e.y;route=[];}tick(.25)');}return i;}
{const w=world({guideOn:true});w.run('tick(.1)');const steps=drive(w);eq(w.st(),'done','길잡이: 두 곳을 다 부수고 단서까지('+steps+'걸음)');const s=w.api.inspect().stats;eq(s.fallback||0,0,'대신 처리 0');eq(s.broken,2,'두 곳 부숨');eq(w.log().panel.length,0,'창 없음');eq(w.log().award.length,1,'보상 한 번');}
// ── ④ 회귀: 세이브 ──
(async()=>{
 {const w=world();w.take();const L=w.props().reduce((a,b)=>S(a)<S(b)?a:b);w.smash(L);const raw=J(w.run('serializeSave()'));eq(raw.questR840.rooms['STORY:last302'].s,'on','세이브: on');ok(raw.questR840.rooms['STORY:last302'].k===1,'부순 곳은 k 비트로 남는다 '+JSON.stringify(raw.questR840));
  const w2=world();w2.run('var __raw='+JSON.stringify(raw));await w2.run('restoreSave(__raw)');w2.run('tick(.1)');const ps=w2.props();eq(ps.length,1,'불러오기: 남은 한 곳만');ok(S(ps[0])>S(ENTRY),'남은 건 오른쪽');
  w2.smash(ps[0]);eq(w2.st(),'drop','이어서 부수면 단서');}
 {const w=world();w.run('var __raw={questR840:{version:1,rooms:{"STORY:last302":{s:"on",k:"x"}}}}');await w.run('restoreSave(__raw)');w.run('tick(.1)');eq(w.props().length,2,'깨진 k 는 0 으로');}
 console.log('R1035 quest spread CPU check: '+n+' assertions passed');
})().catch(e=>{console.error(e);process.exit(1);});
