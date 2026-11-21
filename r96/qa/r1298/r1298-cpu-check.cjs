// R1298 CPU 검사 — 망각의 묘지(kair09) 벽 구멍·문틀·묘지 조형물. 사용자 2026-11-21 "벽이 뚫려있는 버그 그리고 묘지조형물 더 많이 배치"
//  · "망각의묘지 보스입장에 있는 문도 문틀이 부자연스러운듯" · "보스방에 큰묘지 조형물도 하나" · "나가는 문 문틀도 이상하네".
//  ① 벽 구멍: R839 바위턱을 여러 개 입히면 R838 fillCells 가 턱마다 벽 이름을 ':r838:0' 부터 다시 매겨 같은 이름 벽판이 생기고,
//     3D 렌더러(wallRows, 벽 이름 키)는 그중 하나만 그린다 → 나머지 턱은 벽 없이 바닥이 새어 보였다. 모든 벽 이름이 하나뿐이어야 한다.
//  ② 문틀: kair09 문틀 띠는 옛 병동 밝은 회색 그림 대신 이 지역 벽(R930 kc-deck)과 같은 그림, 통로 벽이 이미 감싼 문설주는 그리지 않는다.
//  ③ 조형물: 길을 막지 않는(solid:false) 기존 묘지 그림을 뒷벽에 붙여 더 놓고, 보스 전투실 뒷벽에 큰 묘비 하나.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;
const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');}else console.log('ok  ',m);};
const F='cemetery-r1298.js';let src='',osrc='',psrc='',dsrc='';
try{osrc=rd('client-source/outcrops-r839.js');psrc=rd('client-source/passages-r838.js');dsrc=rd('client-source/world-doors-r83.js');}catch(e){ok('sources exist: '+e.message,false);}
try{src=rd('client-source/'+F);}catch(e){ok('client-source/'+F+' exists',false);}
// ---------- 빌드 연결 ----------
if(src){ok('runtime copy identical to client-source',(()=>{try{return rd('runtime-text/'+F)===src&&rd('runtime-text/outcrops-r839.js')===osrc&&rd('runtime-text/world-doors-r83.js')===dsrc;}catch(_){return false;}})());
 const html=rd('runtime-text/index.html');ok('index.html: 자기 줄 한 번, ego-auto-r1292 뒤(같은 자리를 쓰는 다른 오버레이가 사이에 들어와도 됨)·boot-lean-r1038 앞',html.split('"./'+F+'"').length===2&&/\n<script src="\.\/cemetery-r1298\.js"><\/script>\n/.test(html)&&html.indexOf('"./ego-auto-r1292.js"')>=0&&html.indexOf('"./ego-auto-r1292.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./boot-lean-r1038.js"'));
 ok('runtime-inputs·manifest 목록에 있음',JSON.parse(rd('runtime-inputs.json')).textPaths.includes(F)&&JSON.parse(rd('runtime-manifest.json')).files.some(f=>f.path===F));
 ok('verify-r96-public.py 기대 목록·CI(pages.yml) 검사 줄',/'cemetery-r1298\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8'))&&/node r96\/qa\/r1298\/r1298-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
 const code=src.replace(/\/\/[^\n]*\n/g,'\n').replace(/\/\*[\s\S]*?\*\//g,'');
 ok('전투·저장·포인트를 건드리지 않고 무작위 없음(조형물은 장식, 포인트 조형물 규칙 R1237 은 그대로)',!/\.hp\s*=[^=]|serializeSave|awardPointDrop|Math\.random|Date\.now|r108Orb/.test(code));}
// ---------- ① R839 바위턱 여러 개 → 벽 이름이 모두 하나뿐 ----------
function world(store={},extra={}){const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Int32Array,Promise,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},...extra};sb.window=sb;vm.createContext(sb);vm.runInContext(psrc,sb,{filename:'passages-r838.js'});vm.runInContext(osrc,sb,{filename:'outcrops-r839.js'});return{sb,api:sb.__STORYWORLD_OUTCROPS_R839__};}
function layout(){const S=new Set(),add=(x0,y0,w,d)=>{for(let y=y0;y<y0+d;y++)for(let x=x0;x<x0+w;x++)S.add(x+':'+y);};
 add(2,10,80,12);add(40,22,12,54);add(30,76,32,28);const W=90,H=110,has=(x,y)=>S.has(x+':'+y),walls=[];let id=0;
 for(let y=0;y<=H;y++){let run=null;for(let x=0;x<=W;x++){const e=x<W&&has(x,y-1)!==has(x,y);if(e&&run==null)run=x;if(!e&&run!=null){walls.push({id:'story-r171-wall:'+id++,x:(run+x)/2,y,width:x-run,depth:.24,height:2.85});run=null;}}}
 for(let x=0;x<=W;x++){let run=null;for(let y=0;y<=H;y++){const e=y<H&&has(x-1,y)!==has(x,y);if(e&&run==null)run=y;if(!e&&run!=null){walls.push({id:'story-r171-wall:'+id++,x,y:(run+y)/2,width:.24,depth:y-run,height:2.85});run=null;}}}
 const cells=[...S].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 return{id:'t',storyMapR171:{template:'lanes'},bounds:[0,0,W,H],floorCells:cells,floorRects:cells.map(c=>({x:c[0],y:c[1],width:1,depth:1})),walls,nodes:[{id:'n0',x:4.5,y:16},{id:'n1',x:46,y:16},{id:'n2',x:80,y:16},{id:'n3',x:46,y:60},{id:'n4',x:46,y:100}],worldR74:{doors:[]},entry:{x:4.5,y:16}};}
const dupIds=L=>{const c=new Map();for(const w of L.walls)c.set(String(w.id),(c.get(String(w.id))||0)+1);return[...c].filter(([,v])=>v>1);};
if(osrc&&psrc){const{api:A,sb}=world();
 const cases={'턱 4개(망각의 묘지와 같은 수, 같은 쪽 가장자리 둘씩)':[[10,10,5,4],[24,10,5,4],[10,18,5,4],[24,18,5,4]],'턱 2개(가장 작은 여러 개)':[[10,10,5,4],[24,10,5,4]],'목 모양(한 턱에 사각형 둘) 2개':[[[10,10,3,3],[10,19,3,3]],[[30,10,3,3],[30,19,3,3]]]};
 for(const[name,blocks]of Object.entries(cases)){A.qa({kair09:{blocks}});const L=layout(),T=sb.__STORYWORLD_LAYOUT_HOOK_R204__('kair09',L);A.qa(null);const d=dupIds(T);
  ok('R839 '+name+': 모두 입혀지고 벽 이름이 모두 하나뿐(3D 벽 줄이 이름으로 묶여 하나만 그려지던 벽 구멍)',!!T.outcropsR839&&T.outcropsR839.blocks.length===blocks.length&&d.length===0,{built:T.outcropsR839?.blocks.length,dup:d.slice(0,4)});
  ok('R839 '+name+': 이름만 바뀌고 벽판 수·자리·크기는 그대로(그림·판정 같은 지도)',(()=>{const W=T.walls;return W.every(w=>Number.isFinite(w.x+w.y+w.width+w.depth))&&new Set(W).size===W.length;})());}
 {A.qa({kair09:{blocks:[[10,10,5,4]]}});const L=layout(),T=sb.__STORYWORLD_LAYOUT_HOOK_R204__('kair09',L);A.qa(null);
  ok('회귀: 턱 1개는 원래 이름 그대로(이름 바꾸기 없음)',!!T.outcropsR839&&dupIds(T).length===0&&!T.walls.some(w=>/:r839:/.test(String(w.id))));
  ok('회귀: 바뀌지 않은 원래 벽 객체는 같은 객체로 남는다',L.walls.filter(w=>T.walls.includes(w)).length>0);}
 {const L=layout();ok('회귀: 표가 없는 지역·바위턱 없는 지도는 그대로',sb.__STORYWORLD_LAYOUT_HOOK_R204__('hub',L)===L);}}
// ---------- ② 문틀 ----------
ok('R83: 문틀 띠는 R1298 문틀 훅(그림·생략)을 먼저 묻는다',/__STORYWORLD_DOOR_FRAME_R1298__/.test(dsrc));
let C=null;if(src){try{const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,localStorage:{getItem:()=>null,setItem(){}}};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});C=sb.__STORYWORLD_CEMETERY_R1298__;}catch(e){ok('overlay loads in a bare sandbox: '+e.message,false);}}
if(C){const r=id=>({id,layer:'STORY'});const fa=C.frameArt(r('kair09'));
 ok('kair09 문틀 그림 = 이 지역 벽과 같은 R930 kc-deck(벽 칠과 같은 자리 1024,0,1024,1024)',!!fa&&fa.path==='assets/r930/tiles/kc-deck.webp'&&JSON.stringify(fa.rect)==='[1024,0,1024,1024]'&&Number.isInteger(fa.tint),fa);
 ok('다른 지역·다른 층(사몽)은 원래 문틀 그대로(null)',['kair08','kair10','dist03','ep1a08','hub'].every(id=>C.frameArt(r(id))===null)&&C.frameArt({id:'kair09',layer:'DREAM'})===null&&C.frameArt(null)===null);
 ok('문틀 훅에 skip 함수가 없고 R83 에 문 조각을 건너뛰는 continue 가 없다',!/\bskip\s*\(/.test(src)&&!/FR\?\.skip/.test(dsrc)&&/const fa=part\.source==='wall'\?FR\?\.art\?\.\(r\)/.test(dsrc));
// ---------- ③ 조형물 배치 ----------
 const Lk=(()=>{const S=new Set(),add=(x0,y0,w,d)=>{for(let y=y0;y<y0+d;y++)for(let x=x0;x<x0+w;x++)S.add(x+':'+y);};
  add(6,6,20,14);add(1,6,8,5);add(17,20,6,10);add(4,27,24,12);add(30,5,60,10);add(80,15,10,30);add(14,42,60,12);add(14,30,4,14);
  const cells=[...S].map(k=>k.split(':').map(Number));return{floorCells:cells,worldR74:{doors:[{id:'door-0',x:20,y:20,width:6,depth:.24,axis:'y'},{id:'door-2',x:5,y:6,width:8,depth:.24,axis:'y'}]},entry:{x:85,y:40},nodes:[{id:'n',x:60,y:10,width:5,depth:5}],bounds:[0,0,100,104]};})();
 const S=new Set(Lk.floorCells.map(c=>c[0]+':'+c[1])),has=(x,y)=>S.has(Math.floor(x)+':'+Math.floor(y));
 const P=C.plan('kair09',Lk,{avoid:[{x:15,y:13},{x:60,y:12}]}),small=P.filter(p=>!p.big),big=P.filter(p=>p.big);
 ok('조형물이 더 많이(작은 묘지 조형물 16개 이상, 28개 이하)',small.length>=16&&small.length<=28,small.length);
 ok('큰 묘비는 정확히 1개, 보스 전투실(6..26×6..20) 안, 다른 것보다 2배 넘게 큼',big.length===1&&big[0].x>=6&&big[0].x<=26&&big[0].y>=6&&big[0].y<=20&&small.every(p=>big[0].height>2*p.height),big);
 ok('모두 길을 막지 않음(solid:false)·바닥 칸 위·카메라 쪽 세 칸(+x,+y,+xy)이 바닥(앞 벽 덩어리에 안 가려짐)',P.every(p=>p.solid===false&&has(p.x,p.y)&&has(p.x+1,p.y)&&has(p.x,p.y+1)&&has(p.x+1,p.y+1)));
 ok('모두 뒷벽에 붙음(-x 또는 -y 쪽 칸이 바닥 아님) — 길 가운데를 막지 않게',P.every(p=>!has(p.x-1,p.y)||!has(p.x,p.y-1)));
 ok('문·입구·피할 자리(보스·목표)에서 3.5칸 넘게, 작은 것끼리 4칸 넘게',P.every(p=>[...Lk.worldR74.doors,Lk.entry,{x:15,y:13},{x:60,y:12}].every(q=>Math.hypot(p.x-q.x,p.y-q.y)>3.5))&&small.every((p,i)=>small.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>4)));
 ok('작은 조형물은 보스 전투실 밖(보스방엔 큰 묘비 하나만)',small.every(p=>!(p.x>=6&&p.x<26&&p.y>=6&&p.y<20)));
 ok('그림은 기존 묘지 자산만(데이터 묘비 a·b, 기운 비석, 부서진 관, 쓰러진 석상) — 새 도형·새 그림 없음, 두 가지 넘게 섞임',P.every(p=>C.ART.includes(p.path))&&new Set(small.map(p=>p.path)).size>=3);
 ok('같은 지도면 같은 자리(결정적), 다른 지역은 빈 목록',JSON.stringify(P)===JSON.stringify(C.plan('kair09',Lk,{avoid:[{x:15,y:13},{x:60,y:12}]}))&&C.plan('kair08',Lk).length===0&&C.plan('dist03',Lk).length===0);
 ok('경계: 바닥이 없거나 깨진 지도는 빈 목록(오류 없음)',C.plan('kair09',{floorCells:[]}).length===0&&C.plan('kair09',null).length===0&&C.plan('kair09',{floorCells:[[1,1]]}).length===0);
 ok('id 는 r1298: 로 시작하고 모두 다름',P.every(p=>/^r1298:/.test(p.id))&&new Set(P.map(p=>p.id)).size===P.length);}
// ---------- 실제 지도(빌드한 사이트) ----------
(async()=>{let h=null;try{const{createHarness}=require(path.join(R,'qa','harness.cjs'));h=createHarness({timeoutMs:300000});await h.boot();}catch(e){ok('built site boots in the CPU harness: '+String(e).slice(0,200),false);}
 if(h){const rows=h.run(`(()=>{const out=[];for(const id of Object.keys(__STORYWORLD_OUTCROPS_R839__.TABLE)){const L=__STORYWORLD_EXPLORATION__.layout(id,'STORY');const c=new Map();for(const w of L?.walls||[])c.set(String(w.id),(c.get(String(w.id))||0)+1);out.push({id,blocks:L?.outcropsR839?.blocks?.length||0,dup:[...c].filter(([,v])=>v>1).length});}return out;})()`);
  ok('실제 바위턱 지역 '+rows.length+'곳 모두 벽 이름 겹침 0(망각의 묘지 포함)',rows.length>=8&&rows.every(r=>r.dup===0)&&rows.some(r=>r.id==='kair09'&&r.blocks===4),rows.filter(r=>r.dup));
  const k=h.run(`(()=>{const L=__STORYWORLD_EXPLORATION__.layout('kair09','STORY'),C=window.__STORYWORLD_CEMETERY_R1298__;if(!C)return null;const P=C.plan('kair09',L,{avoid:[{x:15,y:13}]});return{n:P.length,big:P.filter(p=>p.big).length,blocked:P.filter(p=>typeof explorationBlocked==='function'&&explorationBlocked(L,p.x,p.y,.25)).length};})()`);
  ok('실제 망각의 묘지: 조형물 17개 이상(큰 묘비 1개 포함), 모두 막히지 않은 바닥 위',!!k&&k.n>=17&&k.big===1&&k.blocked===0,k);}
 console.log(`\nR1298 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})();
