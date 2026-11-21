// R1282 CPU 검사: 스토리·사몽 에피소드 맵의 구석(막다른) 방마다 보물상자 하나 — 열면 +1 구슬(R1237 규칙) 3~5개, 난이도와 상관없이 같다.
//  사용자 2026-11-21 01:23Z "스토리모드 및 사몽에피소드 모든 맵 구석에 방같은곳에는 보물상자하나씩 배치해서 스킬포인트 보다 쉽게 얻을 수 있게해줘 난이도 상관없이 맵탐험할 이유도 되도록".
//  실제 지도 자료(fixture-maps.json)는 헤드리스로 뽑은 것(qa/r1282/dump.mjs): ep1b02 나태의 집·dist01 거미동굴·사몽 DYS-03(미로)·S-01(한 줄 구역).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..'),F='corner-chests-r1282.js';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,300):''));};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok('client-source/'+F+' 있음',!!src);
const rect=(x0,y0,w,h)=>{const o=[];for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)o.push([x,y]);return o;};
const uniq=a=>{const m=new Map();for(const c of a)m.set(c+'',c);return[...m.values()];};
function boot(o={}){const store=new Map(Object.entries(o.store||{}));const claims={};const calls={interact:0,saves:0,toasts:[]};
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  started:true,modal:null,loading:false,time:5,player:{x:0,y:0,hp:10,points:0},room:o.room||null,
  regionById:{ep1b02:{title:'나태의 집'},hub:{title:'거점',safe:true},...(o.regions||{})},
  readyImage:()=>({ready:true}),addImage(){},toast:(t)=>calls.toasts.push(t),sound(){},fx(){},VFX:{cross:'x'},updateHUD(){},saveGame(){calls.saves++;},
  blocked:o.blocked||(()=>false)};
 sb.window=sb;sb.interact=function(){calls.interact++;return 'base';};sb.tick=function(){return 'tick';};
 sb.__STORYWORLD_PROGRESSION_R62__={state:()=>({pointDropClaimsR64:claims}),awardPointDrop:(a,id)=>{if(claims[id]||!/^r64:[A-Za-z0-9._:-]{1,220}$/.test(id)||a!==1)return false;claims[id]=true;sb.player.points+=a;return true;}};
 sb.__STORYWORLD_CRATES_R108__={scatterSpots:(p,k)=>Array.from({length:k},(_,i)=>({x:p.x+1+i*.1,y:p.y}))};
 if(o.r71)sb.__STORYWORLD_PROGRESSION_R71__={inspect:()=>({difficultyTier:o.r71})};
 if(o.survival)sb.__STORYWORLD_SURVIVAL_R600__={active:()=>true};
 if(o.cinema)sb.__STORYWORLD_CINEMA_RUN_R461__={active:()=>true};
 vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load error',e.message);}
 return{sb,claims,calls,A:sb.__STORYWORLD_CORNER_CHESTS_R1282__};}
let A0=boot().A;
ok('전역 API __STORYWORLD_CORNER_CHESTS_R1282__ (deadEnds·orbCount·claimIds·place·openChest·inspect·set)',!!A0&&['deadEnds','orbCount','claimIds','place','openChest','inspect','set','applies','mapKey'].every(k=>typeof A0?.[k]==='function'));
if(A0){
 // ① 방 그래프(nodes·edges)가 있는 지도: 이웃 하나뿐인 방만, 보스실·앞방 닫힌 칸·길목·다음 구역 문·입구 곁은 뺀다
 const cells=uniq([...rect(0,0,40,4),...rect(2,4,8,8),...rect(14,4,8,8),...rect(26,4,8,8),...rect(30,-8,8,8),...rect(0,-8,8,8),...rect(16,-6,4,6),...rect(14,-14,8,8)]);
 const nodes=[{id:0,name:'보스 전투실',x:4,y:-4,width:8,depth:8,bossCoreR78:true},{id:1,name:'복도',x:20,y:2,width:40,depth:4},{id:2,name:'작은 방',x:6,y:8,width:8,depth:8},{id:3,name:'거실',x:18,y:8,width:8,depth:8},
  {id:4,name:'앞방',x:30,y:8,width:8,depth:8,closetR179:true},{id:5,name:'다음 구역 문',x:34,y:-4,width:8,depth:8},{id:6,name:'길목',x:18,y:-3,width:4,depth:6,storyMapR171:'waypoint'},{id:7,name:'물품 보관실',x:18,y:-10,width:8,depth:8}];
 const edges=[[0,1,6],[1,2,6],[1,3,6],[1,4,6],[1,5,6],[1,6,6],[6,7,6],[3,7,9]];
 let d=A0.deadEnds(cells,{nodes,edges});
 ok('그래프: 이웃 하나뿐인 작은 방(2)만 — 보스실(0)·앞방 닫힌 칸(4)·다음 구역 문(5)·이웃 둘인 거실(3)·물품 보관실(7)은 아님',d.length===1&&d[0].node===2,d.map(s=>s.node));
 const s=d[0]||{};const inRoom=s.x>=2&&s.x<=10&&s.y>=4&&s.y<=12;
 ok('상자 자리는 그 방 안, 입구(위쪽 복도)에서 가장 먼 안쪽 줄(y≥10)이고 사방 8칸이 바닥',inRoom&&s.y>=10&&Number.isFinite(s.x)&&[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].every(([dx,dy])=>cells.some(c=>c[0]===Math.floor(s.x)+dx&&c[1]===Math.floor(s.y)+dy)),s);
 d=A0.deadEnds(cells,{nodes,edges,avoid:[{x:6,y:9}],fallback:false});
 ok('입구·목표·문 곁(avoid 3칸 안) 방은 뺀다',d.length===0,d);
 d=A0.deadEnds(cells,{nodes,edges,avoid:[{x:6,y:9}]});
 ok('그래프로 0곳이면 바닥 모양으로 한 번 더(입구 하나뿐인 물품 보관실 자리)',d.length===1&&d[0].x>=14&&d[0].x<=22&&d[0].y<-6,d.map(s=>[s.x,s.y]));
 // 고리 지도: 그래프·바닥 모양 모두 막다른 방 없음 → 입구에서 가장 먼 방 하나
 const ring=uniq([...rect(0,0,30,3),...rect(0,17,30,3),...rect(0,3,3,14),...rect(27,3,3,14),...rect(-6,6,6,8),...rect(30,6,6,8)]);
 const rn=[{id:0,name:'북쪽 길',x:15,y:1.5,width:30,depth:3},{id:1,name:'남쪽 길',x:15,y:18.5,width:30,depth:3},{id:2,name:'서쪽 방',x:-3,y:10,width:6,depth:8},{id:3,name:'동쪽 방',x:33,y:10,width:6,depth:8},{id:4,name:'중앙 전투실',x:15,y:10,width:4,depth:4}];
 const re=[[0,2,6],[2,1,6],[1,3,6],[3,0,6],[4,0,1],[4,1,1]];
 d=A0.deadEnds(ring,{nodes:rn,edges:re,entry:{x:-3,y:10},avoid:[{x:-20,y:-20}]});
 ok('막다른 곳 없는 고리 지도: 입구에서 가장 먼 방(동쪽 방) 하나, 전투실은 아님',d.length===1&&d[0].far===true&&d[0].x>=30&&d[0].node===3,d.map(s=>[s.x,s.y,s.node]));
 // ② 그래프 없는 지도: 바닥 모양으로 — 방 A(입구 하나)─복도─방 B(입구 둘)─복도─방 C(입구 하나), 복도 중간의 좁은 막다른 길
 const g=uniq([...rect(0,0,12,12),...rect(12,5,20,2),...rect(32,0,10,10),...rect(36,10,2,10),...rect(30,20,12,10),...rect(20,7,2,8)]);
 d=A0.deadEnds(g,{});
 const inA=s=>s.x<12&&s.y<12,inC=s=>s.x>=30&&s.y>=20;
 ok('그래프 없음: 입구 하나뿐인 방 A·C 만(입구 둘인 가운데 방 B 는 아님)',d.length===2&&d.some(inA)&&d.some(inC),d.map(s=>[s.x,s.y]));
 ok('상자 자리는 입구 반대쪽 안쪽(A 는 서쪽, C 는 남쪽)',d.filter(inA).every(s=>s.x<6)&&d.filter(inC).every(s=>s.y>=25),d.map(s=>[s.x,s.y]));
 ok('폭 2칸 복도·막다른 좁은 길은 방이 아니다(상자 자리가 복도 칸에 없음)',d.every(s=>inA(s)||inC(s)));
 ok('빈 바닥·잘못된 값은 빈 목록',A0.deadEnds([],{}).length===0&&A0.deadEnds(null,{}).length===0&&A0.deadEnds([[NaN,1],['a',2]],{}).length===0);
 // ③ 실제 지도
 let fx={};try{fx=JSON.parse(fs.readFileSync(path.join(__dirname,'fixture-maps.json'),'utf8'));}catch(_){}
 const run=m=>{const c=m.cells.split(' ').map(t=>t.split(',').map(Number));const nd=(m.nodes||[]).map(q=>({id:q.id,x:q.x,y:q.y,width:q.w,depth:q.d,name:q.name,storyMapR171:q.k,bossCoreR78:q.boss,closetR179:q.closet}));
  return{c,list:A0.deadEnds(c,{avoid:[m.entry,m.objective,m.altar,...(m.doors||[])].filter(Boolean),nodes:nd,edges:m.edges})};};
 if(fx.ep1b02){const {c,list}=run(fx.ep1b02);const S=new Set(c.map(q=>q+''));
  ok('나태의 집(ep1b02): 막다른 앞방 7곳(맵당 상한 7)',list.length===7,list.map(s=>[s.x,s.y,s.node]));
  ok('나태의 집: 모든 상자 자리가 바닥 칸 위, 서로 4칸 넘게 떨어짐',list.every(s=>S.has(Math.floor(s.x)+','+Math.floor(s.y)))&&list.every((a,i)=>list.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>4)));
  const e=fx.ep1b02.entry;ok('나태의 집: 입구에서 6칸 안에는 상자 없음',list.every(s=>Math.hypot(s.x-e.x,s.y-e.y)>6));}
 else ok('fixture ep1b02 있음',false);
 if(fx.dist01){const {list}=run(fx.dist01);ok('거미동굴(dist01): 다리 끝 섬 3곳',list.length===3,list.map(s=>[s.x,s.y,s.node]));}
 if(fx['DYS-03']){const {list}=run(fx['DYS-03']);const o=fx['DYS-03'].objective;ok('사몽 DYS-03(미로): 막다른 칸 1곳 이상, 목표(보스) 곁은 아님',list.length>=1&&list.every(s=>Math.hypot(s.x-o.x,s.y-o.y)>6),list.map(s=>[s.x,s.y]));}
 if(fx['S-01']){const {list}=run(fx['S-01']);const m=fx['S-01'],av=[m.entry,m.objective,...m.doors];ok('사몽 S-01 한 줄 구역(입구 방—계단—목표 방, 막다른 곁방 없음): 가장 먼 방 구석에 하나, 입구·목표·문에서 6칸 넘게',list.length===1&&list[0].far===true&&av.every(p=>Math.hypot(list[0].x-p.x,list[0].y-p.y)>6),list.map(s=>[s.x,s.y,s.node]));}
 // ④ 보상: 난이도와 상관없이 상자마다 3~5, claim id 형식
 const keys=Array.from({length:300},(_,i)=>'STORY:ep1b0'+(i%9)+':'+i+'_'+(i*7%50));const counts=keys.map(A0.orbCount);
 ok('구슬 수는 상자마다 3~5(평균 약 4), 같은 상자는 늘 같은 수',counts.every(c=>c>=3&&c<=5)&&counts.every((c,i)=>A0.orbCount(keys[i])===c)&&new Set(counts).size===3&&Math.abs(counts.reduce((a,b)=>a+b,0)/counts.length-4)<.3);
 const E=boot({r71:'easy'}).A,H=boot({r71:'hard'}).A;
 ok('난이도(이지·하드)와 상관없이 같은 수',keys.every(k=>E.orbCount(k)===H.orbCount(k)));
 ok('claim id 는 R62 awardPointDrop 형식(r64:…, 220자 안)이고 상자 안에서 서로 다름',keys.every(k=>{const c=A0.claimIds(k);return c.length===A0.orbCount(k)&&new Set(c).size===c.length&&c.every(id=>/^r64:[A-Za-z0-9._:-]{1,220}$/.test(id));})&&A0.claimIds('DREAM:sz115-S06-4:4_40')[0].startsWith('r64:r1282chest:'));
}
// ⑤ 게임 안: 배치·열기·구슬·한 번만·제외 모드
const mkRoom=(id='ep1b02',extra={})=>{const cells=uniq([...rect(0,0,30,4),...rect(2,4,8,8),...rect(14,4,8,8),...rect(26,4,4,8)]);
 return{id,layer:'STORY',props:[],exploration:{floorCells:cells,entry:{x:28,y:10},nodes:[{id:0,name:'복도',x:15,y:2,width:30,depth:4},{id:1,name:'작은 방',x:6,y:8,width:8,depth:8},{id:2,name:'거실',x:18,y:8,width:8,depth:8},{id:3,name:'입구',x:28,y:8,width:4,depth:8}],edges:[[0,1,6],[0,2,6],[0,3,6]]},...extra};};
{const room=mkRoom();const {sb,A,claims,calls}=boot({room});
 if(A){sb.tick(.016);const ch=room.props.filter(p=>p.cornerChestR1282);
  ok('지역에 들어오면(첫 tick) 막다른 방마다 상자 하나 — 작은 방·거실 2곳(입구 방은 아님)',ch.length===2,ch.map(p=>[p.x,p.y]));
  ok('상자 그림은 R712 보물상자(닫힘), 길을 막지 않음, 자동 조준 대상 아님',ch.every(p=>p.path==='assets/r712/chest-closed.png'&&p.height===54&&p.solid===false&&p.autoTargetEligible6===false&&p.label==='보물상자'));
  sb.tick(.016);ok('tick 을 다시 불러도 상자가 늘지 않음',room.props.filter(p=>p.cornerChestR1282).length===2);
  ok('R103 보물상자(growthR103)·R108 상자(crate)로 잡히지 않는 표식',ch.every(p=>!p.growthR103&&!p.chestR103&&!p.chest&&!/crate|barrel|box/i.test(String(p.kind||''))));
  sb.player.x=50;sb.player.y=50;ok('상자가 멀면 상호작용은 원래 interact 로',sb.interact()==='base'&&calls.interact===1);
  const c=ch[0];sb.player.x=c.x+.5;sb.player.y=c.y;const before=room.props.length;sb.interact();
  const orbs=room.props.filter(p=>p.r108Orb&&p.r108Orb.box==='r1282chest:'+c.cornerChestR1282.id);
  ok('가까이서 상호작용 → 상자가 열림(열린 그림)·원래 interact 는 안 불림',c.cornerChestR1282.open===true&&c.path==='assets/r712/chest-open.png'&&c.height===74&&calls.interact===1);
  ok('열면 +1 구슬(R108·R1237 구슬) 3~5개가 튀어나옴',orbs.length>=3&&orbs.length<=5&&orbs.length===A.orbCount(c.cornerChestR1282.id)&&orbs.every(o=>o.r108Orb.amount===1&&o.solid===false&&o.r108Orb.to)&&room.props.length===before+orbs.length,orbs.length);
  ok('아직 포인트는 주지 않음(걸어가 주워야 함)',sb.player.points===0&&Object.keys(claims).length===0);
  sb.interact();ok('열린 상자는 다시 열리지 않음(구슬이 더 나오지 않음, 원래 interact 로)',room.props.filter(p=>p.r108Orb).length===orbs.length&&calls.interact===2);
  // 구슬을 다 주운 뒤(=claim 다 있음) 다시 들어오면 열린 채
  for(const o of orbs)sb.__STORYWORLD_PROGRESSION_R62__.awardPointDrop(1,o.r108Orb.id);
  ok('구슬 claim 하나당 포인트 +1',sb.player.points===orbs.length);
  const room2=mkRoom();sb.room=room2;sb.tick(.016);const again=room2.props.filter(p=>p.cornerChestR1282&&p.cornerChestR1282.id===c.cornerChestR1282.id)[0];
  ok('다 주운 상자는 다시 들어와도 열린 그림이고 열 수 없음',!!again&&again.cornerChestR1282.open===true&&again.path==='assets/r712/chest-open.png');
  const other=room2.props.find(p=>p.cornerChestR1282&&p!==again);
  // 일부만 주운 상자: 남은 구슬만
  const oid=other.cornerChestR1282.id,all=A.claimIds(oid);sb.__STORYWORLD_PROGRESSION_R62__.awardPointDrop(1,all[0]);
  sb.player.x=other.x;sb.player.y=other.y;sb.interact();const rest=room2.props.filter(p=>p.r108Orb&&p.r108Orb.box==='r1282chest:'+oid);
  ok('일부만 주운 상자를 다시 열면 남은 구슬만 나옴',rest.length===all.length-1&&!rest.some(o=>o.r108Orb.id===all[0]),rest.length);
  ok('inspect 에 상자 목록',A.inspect().chests.length===2);}}
{const room=mkRoom();const {sb,A}=boot({room,blocked:(x,y)=>Math.floor(x)===5&&Math.floor(y)===10});
 if(A){sb.tick(.016);const ch=room.props.filter(p=>p.cornerChestR1282);ok('상자 자리가 조형물로 막혀 있으면 그 방의 다른 안쪽 칸으로',ch.length===2&&ch.every(p=>!(Math.floor(p.x)===5&&Math.floor(p.y)===10)),ch.map(p=>[p.x,p.y]));}}
{const room=mkRoom();const {sb,A}=boot({room});if(A){delete sb.__STORYWORLD_CRATES_R108__;sb.tick(.016);const c=room.props.find(p=>p.cornerChestR1282);sb.player.x=c.x;sb.player.y=c.y;sb.interact();
 ok('R108 구슬 모듈이 없으면 포인트를 바로 줌(구슬 수만큼)',sb.player.points===A.orbCount(c.cornerChestR1282.id));}}
for(const [name,o] of [['무한생존(R600)',{survival:true}],['영화 모드 기록(R461)',{cinema:true}],['끄기(storyworld.r1282.cornerChests on:false)',{store:{'storyworld.r1282.cornerChests':'{"on":false}'}}]]){
 const room=mkRoom();const {sb,A}=boot({room,...o});if(A){sb.tick(.016);ok(name+': 상자 없음',room.props.filter(p=>p.cornerChestR1282).length===0);}}
{const room=mkRoom('hub');const {sb,A}=boot({room});if(A){sb.tick(.016);ok('쉼터(safe) 지역: 상자 없음',room.props.filter(p=>p.cornerChestR1282).length===0);}}
{const room=mkRoom('last302',{layer:'DREAM',samongR103:{zone:'sz115-S05-1'}});const {sb,A}=boot({room});if(A){sb.tick(.016);const ch=room.props.filter(p=>p.cornerChestR1282);
 ok('사몽 구역(DREAM): 상자 있음, id 는 구역 열쇠(DREAM:sz115-S05-1:…)',ch.length===2&&ch.every(p=>p.cornerChestR1282.id.startsWith('DREAM:sz115-S05-1:')),ch.map(p=>p.cornerChestR1282.id));}}
// ⑥ 커서·더블클릭(R780 → R1279): 닫힌 상자는 '사용', 열린 상자는 아님
{const cs=fs.readFileSync(path.join(R,'client-source','cursor-r780.js'),'utf8');
 ok('cursor-r780 이 닫힌 R1282 상자를 사용(use) 대상으로 읽음(더블클릭 상호작용)',/cornerChestR1282[^;]*open[^;]*take\('use'/.test(cs));}
// ⑦ 빌드 연결
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
ok('index.html: 자기 줄, note-fold-r1251 바로 뒤·sloth-throw-r1258 앞, 한 번만',/\n<script src="\.\/note-fold-r1251\.js"><\/script>\n<script src="\.\/corner-chests-r1282\.js"><\/script>\n<script src="\.\/sloth-throw-r1258\.js"><\/script>/.test(html)&&tags.filter(t=>t===F).length===1);
ok('growth-r103·crates-r108·cursor-r780 보다 뒤(상호작용을 먼저 받음)',['growth-r103.js','crates-r108.js'].every(t=>tags.indexOf(t)>=0&&tags.indexOf(t)<tags.indexOf(F)));
ok('runtime-text 사본이 같음',(()=>{try{return fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src;}catch(_){return false;}})());
ok('runtime-inputs·manifest 목록에 있음',['runtime-inputs.json','runtime-manifest.json'].every(f=>fs.readFileSync(path.join(R,f),'utf8').includes('"'+F+'"')));
ok('verify-r96-public.py 기대 목록에 있음',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml 에 이 검사 줄',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r1282/r1282-cpu-check.cjs'));
console.log((bad?'FAIL':'PASS')+' '+(n-bad)+'/'+n);process.exit(bad?1:0);
