// R414 — 사용자 2026-11-08 "구글드라이브자산 적절히 크기조절해서 배치 특히 건물자산의 경우 최소영웅2배높이이상".
//  드라이브 건물 후보(Dots StoryWorld-Resumed, scripts/r414-drive-buildings.py 로 만든 파생본, 원본 보존)를
//  원문 줄에 맞는 야외 꿈 지역(samong z.outdoor, worldR74.mode='outdoor')의 뒤쪽 바닥 끝(-x·-y) 너머 빈 땅에 세운다.
//  · 크기: 영웅은 줌 1 에서 66px(actorHeight) → 건물은 모두 132px 이상(index.json height, 136~300px).
//  · 자리: 조형물 그림은 발(x,y)을 지나 카메라를 향한 판으로 선다(R412 모형: 화면 오른쪽 s → 월드 (+s/√2,−s/√2)).
//    판의 가로 폭이 덮는 화면 범위(x−y 가 발 ±W/68, W=그린 너비 px) 안의 모든 바닥 칸이 판보다 1.5칸 이상 앞(x+y 가 더 큼)에 있어야
//    영웅·적·문·바닥 끝 낮은 벽이 건물에 가려지지 않는다 → 그 조건을 만족하는 가장 가까운 뒤쪽 자리를 고르고, 길(R169 길잡이·입구·목표)에서 가까운 곳을 먼저 쓴다.
//  · 바닥 위에는 놓지 않고 충돌·상호작용·자동 조준이 없다(solid 를 두지 않아 R111 간격 맞추기가 옮기지 않음, r412Wall·r412Face 로 R412 측정·방향 맞추기 제외).
//  · -x 끝 뒤에 설 때는 정면(그림 왼쪽 면)이 놀이 공간을 보도록 좌우를 뒤집는다(R303 r303Flip).
//  · 실내형 지역(지붕 덮개가 바닥 밖을 덮음)·이야기 지도·바닥 끝 뒤 빈 땅이 없는 곳에는 놓지 않는다.
//  · storyworld.r414.buildings = {"on":false} 이면 끈다(이미 놓인 건물은 다음 입장부터 빠짐).
(()=>{'use strict';
if(window.__STORYWORLD_DRIVE_BUILDINGS_R414__)return;
const REV='R414-buildings-3',KEY='storyworld.r414.buildings',IDX='./assets/r414/buildings/index.json';
const HERO_PX=66,MIN_PX=2*HERO_PX,PX_PER_UNIT=34,MARGIN=1.5,MAX_BACK=8,STEP=.25,MIN_COORD=-1.5;// project(): 화면 x = (x−y)·TILE(34)·zoom
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={rooms:0,placed:0,skipped:0,notOutdoor:0,noSpot:0,errors:0};let lastError=null,ROWS=null,idxState='idle';
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,400);};
const live=()=>typeof started!=='undefined'&&started&&typeof room!=='undefined'&&!!room&&!(typeof loading!=='undefined'&&loading);
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
async function loadIndex(){if(idxState!=='idle')return;idxState='loading';try{const res=await fetch(IDX,{cache:'force-cache'});if(!res.ok)throw new Error('index '+res.status);ROWS=(await res.json()).buildings||{};idxState='ready';}catch(e){idxState='failed';fail(e);}}

// ---- 자리 계산(순수 함수 — qa/r414 가 직접 시험한다) ----------------------------------------------------
// floorCells: [[x,y],…] 칸(바닥은 [x,x+1]×[y,y+1]), rows: [{name,height,aspect,zone}], route: [{x,y},…] 길 점, avoid: [{x,y,r}]
function plan(floorCells,rows,route,avoid=[]){const F=new Set(),minSum=new Map();let x0=1e9,y0=1e9;
 for(const[x,y]of floorCells){F.add(x+','+y);const k=x-y,s=x+y;if(!(minSum.get(k)<=s))minSum.set(k,s);if(x<x0)x0=x;if(y<y0)y0=y;}
 const has=(x,y)=>F.has(x+','+y);
 // 판(x+y=c)이 화면 범위 [s0-D,s0+D] 안 모든 바닥 칸보다 MARGIN 이상 뒤인가 — 칸의 x−y 는 [k−1,k+1], 가장 앞쪽 아닌 모서리 x+y 는 k 칸의 minSum
 const clear=(fx,fy,D)=>{const c=fx+fy,s0=fx-fy;for(let k=Math.floor(s0-D-1);k<=Math.ceil(s0+D+1);k++){const m=minSum.get(k);if(m!=null&&m<c+MARGIN)return false;}return true;};
 const edges=[];for(const[x,y]of floorCells){if(!has(x,y-1))edges.push({x,y,side:'-y'});if(!has(x-1,y))edges.push({x,y,side:'-x'});}
 const routeDist=(px,py)=>{let b=1e9;for(const q of route){const d=Math.hypot(q.x-px,q.y-py);if(d<b)b=d;}return route.length?b:0;};
 const placed=[];
 for(const row of rows){const W=row.height*row.aspect,D=W/2/PX_PER_UNIT;let best=null;
  for(const e of edges){let fx=0,fy=0,d=.6,ok=false;
   for(;d<=MAX_BACK;d+=STEP){if(e.side==='-y'){fx=e.x+.5;fy=e.y-d;}else{fx=e.x-d;fy=e.y+.5;}if(fx<MIN_COORD||fy<MIN_COORD)break;if(has(Math.floor(fx),Math.floor(fy)))continue;if(clear(fx,fy,D)){ok=true;break;}}
   if(!ok)continue;
   const s0=fx-fy;if(placed.some(p=>Math.abs(p.s0-s0)<p.D+D+.8))continue;// 다른 건물과 화면에서 겹치지 않게
   if(avoid.some(a=>Math.hypot(a.x-fx,a.y-fy)<(a.r||0)+D))continue;
   const k=routeDist(fx,fy)+d*.6+(h32(row.zone+':'+row.name+':'+e.x+','+e.y+e.side)%1000)/1000*1.5;
   if(!best||k<best.k)best={k,x:+fx.toFixed(3),y:+fy.toFixed(3),side:e.side,s0,D,back:+d.toFixed(2),name:row.name};}
  if(best)placed.push(best);else placed.push({name:row.name,none:true});}
 return placed;}

// ---- 방에 붙이기 ------------------------------------------------------------------------------------------
const done=new WeakMap(),reports=new WeakMap();
function aspectOf(v){const s=v.size;return Array.isArray(s)&&s[0]>0&&s[1]>0?s[0]/s[1]:1;}
function routeOf(r){const L=r.exploration,out=[];try{const s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r);if(s&&typeof s.forEach==='function'){let i=0;s.forEach(k=>{if(i++%3)return;const[x,y]=String(k).split(',').map(Number);if(Number.isFinite(x+y))out.push({x:x+.5,y:y+.5});});}}catch(e){fail(e);}
 for(const q of[L.entry,r.objective,L.samongR103?.centre,L.samongR103?.dais,r.altar])if(q&&Number.isFinite(q.x+q.y))out.push({x:q.x,y:q.y});return out;}
function apply(r){if(!prefs.on||!ROWS||!r?.exploration||!Array.isArray(r.props))return;const L=r.exploration;if(done.get(r)===L)return;done.set(r,L);
 const zone=L.samongR115?.zone;if(!zone)return;const rows=Object.entries(ROWS).filter(([,v])=>v&&v.zone===zone&&Number(v.height)>=MIN_PX).map(([name,v])=>({name,zone,height:Number(v.height),aspect:aspectOf(v),v}));if(!rows.length)return;
 stats.rooms++;const rep={zone,placed:[],none:[],rev:REV};reports.set(r,rep);
 if(L.worldR74?.mode!=='outdoor'){stats.notOutdoor++;rep.notOutdoor=true;return;}
 const avoid=[];for(const d of L.worldR74?.doors||[])if(Number.isFinite(d?.x+d?.y))avoid.push({x:d.x,y:d.y,r:2});
 for(const p of r.props)if(p&&!p.r414Building&&p.visible!==false&&Number(p.height)>=100&&Number.isFinite(p.x+p.y))avoid.push({x:p.x,y:p.y,r:0});// 큰 고목·조형물 바로 앞뒤는 피한다
 rows.sort((a,b)=>b.height*b.aspect-a.height*a.aspect||a.name.localeCompare(b.name));// 넓은 건물 먼저 자리를 잡는다
 const spots=plan(L.floorCells||[],rows,routeOf(r),avoid);
 for(const s of spots){const row=rows.find(q=>q.name===s.name);if(s.none){stats.noSpot++;rep.none.push(s.name);continue;}const id='r414:'+zone+':'+s.name;if(r.props.some(q=>q?.id===id))continue;
  const q={id,x:s.x,y:s.y,path:row.v.path,height:row.height,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r414Building:s.name,r414Side:s.side,r412Wall:1,r412Face:1};
  if(s.side==='-x')q.r303Flip=true;// 정면(그림 왼쪽 면)이 +x 쪽 놀이 공간을 보게
  r.props.push(q);try{if(typeof addImage==='function')addImage(row.v.path,'R414 drive building');}catch(_){}stats.placed++;rep.placed.push({name:s.name,x:s.x,y:s.y,side:s.side,back:s.back,height:row.height});}}
function tick(){if(!live())return;if(idxState==='idle')loadIndex();if(idxState==='ready')apply(room);}

// R414-2: R123 코드 그림 장식(원화 없는 승강기 문·액자 등)은 main 화면에서 보이지 않는다(3D 기록기 깊이 아래로 묻힘, 원인 미검증).
//  건물을 세운 지역에서만 그것이 드러나 회색 판·금빛 액자가 영웅 곁에 떠 보였다(7분야 심사 R414-2) → 건물을 세운 방에서는 main 과 같게 그리지 않는다.
const hidePlaceholder=p=>!!(p&&p.r123Deco&&!p.path&&typeof room!=='undefined'&&room&&reports.get(room)?.placed?.length);
function install(){if(typeof draw!=='function')return false;const db=draw;draw=function(...a){try{tick();}catch(e){fail(e);}return db.apply(this,a);};
 if(typeof drawProp==='function'){const dp=drawProp;drawProp=function(p,...a){try{if(hidePlaceholder(p)){stats.placeholdersKept=(stats.placeholdersKept||0)+1;return;}
  // R433: 지역 진입 때 releaseImageMemory 가 건물 그림을 지워도(지역 keep 목록에 없음) 그릴 때 다시 요청한다 — 방·레이아웃이 그대로면 apply 가 다시 돌지 않아 영영 안 그려지던 틈.
  if(p?.r414Building&&typeof readyImage==='function'&&!readyImage(p.path)&&typeof addImage==='function'&&!(typeof imageCache!=='undefined'&&imageCache.get(p.path)?.error)){addImage(p.path,'R414 drive building');stats.rerequested=(stats.rerequested||0)+1;}}catch(e){fail(e);}return dp.apply(this,[p,...a]);};}
 return true;}
let installed=false;const tryInstall=()=>{if(!installed)installed=install();return installed;};
if(!tryInstall()){let n=0;const t=setInterval(()=>{if(tryInstall()||++n>200)clearInterval(t);},100);}
function set(o={}){if(typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
function inspect(){const r=typeof room!=='undefined'?room:null;return{revision:REV,prefs:{...prefs},index:idxState,rows:ROWS?Object.keys(ROWS).length:0,stats:{...stats},room:r?reports.get(r)||null:null,lastError};}
window.__STORYWORLD_DRIVE_BUILDINGS_R414__=Object.freeze({revision:REV,plan,apply,inspect,set,hidePlaceholder,HERO_PX,MIN_PX});
})();
