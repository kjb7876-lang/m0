// R830 얇은 칸막이벽을 옆 메인벽과 같은 덩어리 벽으로 — 사용자 2026-11-12 "중간에 얇은 벽 나오는 거 구조를 옆에 붙은 메인벽들로 바꿔주고 모든맵"(첨부 화면: 피난 거점 hub 의 칸막이).
//  원인(헤드리스 실측 64지역): 메인벽은 '바닥이 아닌 칸' 덩어리다 — 그 칸 둘레에 벽판이 서고 칸 위를 대지·지붕 덮개가 덮어 두껍게 보인다.
//   칸막이(양쪽이 다 바닥인 두께 0.24 벽판)는 덮을 칸이 없어 종잇장처럼 보였다.
//  고침: 칸막이 한쪽 1칸 줄을 '바닥이 아닌 칸'으로 바꾸고 칸막이 벽판을 뺀 뒤, 새 경계에 그 지도의 경계 벽판을 세운다.
//   → 대지(R204)·지붕 덮개(A5 plan)·둘레 벽 두께(R713)·시야·길찾기가 모두 메인벽과 같은 길로 처리한다. 그림만 두껍게 하지 않는다(판정과 그림이 같은 지도).
//   · 어느 쪽 줄을 메울지는 넓은 쪽(줄 바깥으로 바닥이 더 깊은 쪽)을 고르고, 입구·문·길목(nodes) 둘레는 피한다. 바닥이 둘로 갈라지면 그 칸막이는 그대로 둔다.
//   · 방이 만들어질 때(makeRoom, 몹·조형물 배치 전) 한 번만 한다. 같은 원본 지도에는 늘 같은 결과 객체.
//  대상: ZONES 표(지역 id → 칸막이 고르는 기준). 병원 본관(ep1a08)·사몽·협동은 건드리지 않는다.
//  끄기: localStorage['storyworld.r830.walls']='{"on":false}' (다음 지도 짓기부터)
(()=>{'use strict';
if(window.__STORYWORLD_WALLS_SOLID_R830__)return;
const REV='R830-walls-solid-1',KEY='storyworld.r830.walls';
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={layouts:0,partitions:0,filled:0,skipped:0,rooms:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// 지역별 칸막이 기준: 벽 객체 → 칸막이인가
const BAFFLE=w=>/^ward-r81-baffle:/.test(String(w.id||''));
const ZONES={hub:w=>w.partition===true||/^refuge-r82-partition:/.test(String(w.id||'')),
 // 병동 미로 틀을 그대로 쓰는 7지역(R171 지도가 아닌 곳)의 가림벽 20개
 hando01:BAFFLE,hando02:BAFFLE,hando03:BAFFLE,kair02:BAFFLE,kair03:BAFFLE,last301:BAFFLE,cult04:BAFFLE};
// 병동 틀 가림벽에서 메울 쪽을 정해 둔 것(-1 = 위·왼쪽 줄, 1 = 아래·오른쪽 줄). 헤드리스 실측(qa/r830): 가림벽을 하나씩 양쪽으로 메워 보고
//  조형물·몹 자리가 끈 지도와 같게 남는 쪽을 골랐다(조형물은 벽에 붙는 규칙이라 벽이 옮겨지면 따라 움직인다). 표에 없는 가림벽은 넓은 쪽.
const WARD_SIDES=Object.freeze({'south-b-baffle':-1,'consult-a-north-baffle':-1,'consult-c-north-baffle':-1});
const SIDES={hando01:WARD_SIDES,hando02:WARD_SIDES,hando03:WARD_SIDES,kair02:WARD_SIDES,kair03:WARD_SIDES,last301:WARD_SIDES,cult04:WARD_SIDES};
const K=(x,y)=>x+':'+y,THIN=.7;
// 축에 나란하고 정수 줄 위에 선 얇은 벽판 → {hz,fixed,a,b}(a..b 는 정수 칸 범위). 아니면 null
function seg(w){if(!w||w.angle&&Math.abs(w.angle)>1e-6||!Number.isFinite(w.x+w.y+w.width+w.depth))return null;const hz=w.width>=w.depth,t=hz?w.depth:w.width,len=hz?w.width:w.depth;if(t>THIN||len<.5)return null;
 const fixed=hz?w.y:w.x,c=hz?w.x:w.y,a=c-len/2,b=c+len/2;if(Math.abs(fixed-Math.round(fixed))>.02||Math.abs(a-Math.round(a))>.02||Math.abs(b-Math.round(b))>.02)return null;return{hz,fixed:Math.round(fixed),a:Math.round(a),b:Math.round(b)};}
const cellsOf=(s,side)=>{const out=[];for(let i=s.a;i<s.b;i++)out.push(s.hz?[i,s.fixed+(side<0?-1:0)]:[s.fixed+(side<0?-1:0),i]);return out;};
function connected(S){const it=S.values().next();if(it.done)return true;const seen=new Set([it.value]),q=[it.value.split(':').map(Number)];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=K(x+dx,y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}return seen.size===S.size;}
function keepOut(L){const out=[],pt=(q,r)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,r]);};
 for(const d of L.worldR74?.doors||[])pt(d,Math.max(2.5,(Number(d.width)||0)/2+1.5));for(const q of[L.entry,L.entrance,L.gate,L.objective,...(L.starts||[])])pt(q,2);for(const n of L.nodes||[])pt(n,.8);return out;}
function solidify(L,pick,force){const why={};
 const S=new Set(L.floorCells.map(c=>K(c[0],c[1]))),has=(x,y)=>S.has(K(x,y)),guard=keepOut(L),near=(x,y)=>guard.some(([gx,gy,r])=>Math.hypot(gx-Math.max(x,Math.min(x+1,gx)),gy-Math.max(y,Math.min(y+1,gy)))<r);/* 지킬 점에서 그 칸(사각형)까지 거리 */
 const parts=[],done=[];for(const w of L.walls||[]){if(!pick(w))continue;const s=seg(w);if(s)parts.push({w,s});}
 for(const p of parts){const cand=[];
  for(const side of[-1,1]){
   // 메울 칸은 '건너편도 바닥'인 칸만(이미 한쪽이 벽 덩어리인 구간은 그대로 메인벽이다)
   const real=[];for(let i=p.s.a;i<p.s.b;i++){const me=p.s.hz?[i,p.s.fixed+(side<0?-1:0)]:[p.s.fixed+(side<0?-1:0),i],ot=p.s.hz?[i,p.s.fixed+(side<0?0:-1)]:[p.s.fixed+(side<0?0:-1),i];if(has(me[0],me[1])&&has(ot[0],ot[1]))real.push(me);}
   if(real.some(([x,y])=>near(x,y)))continue;
   // 그 줄 바깥으로 바닥이 얼마나 깊은가(가장 얕은 곳)
   let depth=99;for(const[x,y]of real){let d=0;for(let k=1;k<=12;k++){const q=p.s.hz?[x,y+side*k]:[x+side*k,y];if(has(q[0],q[1]))d++;else break;}depth=Math.min(depth,d);}
   cand.push({side,real,depth});}
  cand.sort((a,b)=>b.depth-a.depth||a.side-b.side);let used=null;const name=String(p.w.id).replace(/^.*?:/,''),f=force?force[p.w.id]??force[name]:undefined;
  if(f===0){stats.skipped++;why[p.w.id]='forced-skip';continue;}
  const order=f?cand.filter(c=>c.side===f):cand;if(!order.length)why[p.w.id]='guarded';
  for(const c of order){if(!c.real.length){used=c;break;}if(c.depth<2){why[p.w.id]='shallow';continue;}const T=new Set(S);for(const[x,y]of c.real)T.delete(K(x,y));if(!connected(T)){why[p.w.id]='splits';continue;}for(const[x,y]of c.real)S.delete(K(x,y));used=c;break;}
  if(used){delete why[p.w.id];done.push({id:p.w.id,side:used.side,cells:used.real.length});stats.filled+=used.real.length;}else stats.skipped++;}
 if(!done.length)return null;
 const gone=new Set(done.map(d=>d.id)),need=new Set();// 필요한 단위 변: 'h:x:y'(칸 (x,y-1)|(x,y) 사이), 'v:x:y'(칸 (x-1,y)|(x,y) 사이)
 const [bx0,by0,bx1,by1]=L.bounds||[0,0,128,128];
 for(const k of S){const[x,y]=k.split(':').map(Number);if(!has(x,y-1))need.add('h:'+x+':'+y);if(!has(x,y+1))need.add('h:'+x+':'+(y+1));if(!has(x-1,y))need.add('v:'+x+':'+y);if(!has(x+1,y))need.add('v:'+(x+1)+':'+y);}
 const edgesOf=s=>{const out=[];for(let i=s.a;i<s.b;i++)out.push(s.hz?'h:'+i+':'+s.fixed:'v:'+s.fixed+':'+i);return out;};
 const covered=new Set(),walls=[];let tpl=null,serial=0;
 const mk=(src,hz,fixed,a,b)=>{const len=b-a,t=Math.min(src.width,src.depth),o={...src,id:String(src.id)+':r830:'+(serial++),x:hz?a+len/2:fixed,y:hz?fixed:a+len/2,width:hz?len:t,depth:hz?t:len,wallsSolidR830:true};
  if(src.endpoints)o.endpoints=hz?[[a,fixed],[b,fixed]]:[[fixed,a],[fixed,b]];if(src.analyticBounds12)o.analyticBounds12=hz?[a,fixed-t/2,b,fixed+t/2]:[fixed-t/2,a,fixed+t/2,b];delete o.partition;return o;};
 for(const w of L.walls||[]){if(gone.has(w.id))continue;const s=seg(w);if(!s){walls.push(w);continue;}if(!tpl&&!pick(w))tpl=w;const es=edgesOf(s),keep=es.map(e=>need.has(e));
  if(pick(w)||keep.every(Boolean)){walls.push(w);for(const e of es)covered.add(e);continue;}// 남은 칸막이(못 메운 것)·그대로 필요한 경계벽
  // 일부 구간이 벽 덩어리 속으로 들어간 경계벽 → 남은 구간만
  for(let i=0;i<es.length;){if(!keep[i]){i++;continue;}let j=i;while(j<es.length&&keep[j])j++;walls.push(mk(w,s.hz,s.fixed,s.a+i,s.a+j));for(let k=i;k<j;k++)covered.add(es[k]);i=j;}}
 if(!tpl)return null;
 // 새 경계 변(아직 벽판이 없는 것)을 이어 붙여 세운다
 const runs=new Map();for(const e of need){if(covered.has(e))continue;const[ax,p,q]=e.split(':'),hz=ax==='h',fixed=hz?+q:+p,at=hz?+p:+q,k=ax+':'+fixed;if(!runs.has(k))runs.set(k,[]);runs.get(k).push(at);}
 for(const[k,list]of runs){const[ax,f]=k.split(':'),hz=ax==='h',fixed=+f;list.sort((a,b)=>a-b);for(let i=0;i<list.length;){const a=list[i];let b=a+1;i++;while(i<list.length&&list[i]===b){b++;i++;}walls.push(mk(tpl,hz,fixed,a,b));}}
 // 바닥 사각형: 행 구간이 이어지는 행끼리 묶음(엔진과 같은 방식)
 const rects=[],open=new Map();for(let y=by0;y<=by1;y++){const next=new Map();let x=bx0;while(x<bx1){if(!has(x,y)){x++;continue;}const s0=x;while(x<bx1&&has(x,y))x++;const id=s0+':'+x,o=open.get(id);if(o&&o.y+o.depth===y){o.depth++;next.set(id,o);}else{const r={x:s0,y,width:x-s0,depth:1};rects.push(r);next.set(id,r);}}open.clear();for(const[k2,v]of next)open.set(k2,v);}
 const floorCells=[...S].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 stats.partitions+=done.length;
 return{...L,floorCells,floorRects:rects,walls,wallsSolidR830:{revision:REV,partitions:done,skipped:why,before:L.floorCells.length,after:floorCells.length}};}
const cache=new WeakMap();
let qaForce=null;// 검사용: {지역:{가림벽 이름:쪽(-1|1|0)}} — 켜면 캐시를 쓰지 않는다
function layoutFor(id,L){try{if(!prefs.on||!L?.floorCells?.length||L.wallsSolidR830)return L;const pick=ZONES[id];if(!pick)return L;
 if(qaForce)return qaForce[id]?solidify(L,pick,qaForce[id])||L:L;
 if(cache.has(L))return cache.get(L);const out=solidify(L,pick,SIDES[id]||null)||L;cache.set(L,out);if(out!==L)stats.layouts++;return out;}catch(e){fail(e);return L;}}
const coop=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
// makeRoom 을 엔진의 지도 붙이기(attach)보다 먼저 감싼다: 방이 처음부터 고친 지도를 가지면 몹·조형물 배치가 그 지도를 본다(R171 과 같은 방식).
if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(id,l,...a){const r=base.call(this,id,l,...a);
 try{const lay=r?.layer||l;if(r&&!r.exploration&&prefs.on&&ZONES[r.id]&&lay==='STORY'&&!window.__STORYWORLD_R81_EGO_BUILD__&&coop()==='off'){const L0=window.__STORYWORLD_EXPLORATION__?.layout?.(r.id,lay),L=L0&&layoutFor(r.id,L0);if(L&&L!==L0){r.exploration=L;stats.rooms++;}}}catch(e){fail(e);}return r;};}
// 예전 저장: 영웅이 이제 벽 덩어리가 된 칸에 서 있으면 엔진 복원이 (15,19) 근처(병동 틀에선 보스 전투실 안)로 옮겨 버린다 →
//  안쪽 복원이 끝난 바로 뒤에 그 칸에서 가장 가까운 바닥 칸 한가운데에 세운다. 바깥쪽 복원 감싸기(엔진 넓은 지도 복원)는 저장 좌표가 막혀 있으면
//  영웅을 그대로 두므로(막힌 자리일 때만 (15,19)로 옮김) 이 자리가 남는다. 저장 객체는 고치지 않는다.
function nudge(raw){try{const id=raw?.zone,P=raw?.player;if(!prefs.on||raw?.layer!=='STORY'||!ZONES[id]||!P||!Number.isFinite(P.x+P.y)||coop()!=='off')return null;
 const L0=window.__STORYWORLD_EXPLORATION__?.layout?.(id,'STORY'),L=L0&&layoutFor(id,L0);if(!L||L===L0)return null;
 const now=new Set(L.floorCells.map(c=>K(c[0],c[1]))),was=new Set(L0.floorCells.map(c=>K(c[0],c[1]))),cx=Math.floor(P.x),cy=Math.floor(P.y);
 // 몸 반지름(.3)이 닿는 칸까지: 서 있던 칸이 메워졌거나, 몸이 메워진 이웃 칸에 걸쳐 있으면
 const filled=(x,y)=>was.has(K(x,y))&&!now.has(K(x,y)),R=.3;let hit=false;for(const[dx,dy]of[[0,0],[R,0],[-R,0],[0,R],[0,-R]])if(filled(Math.floor(P.x+dx),Math.floor(P.y+dy)))hit=true;if(!hit)return null;
 let best=null;/* 네 이웃도 바닥인 칸(벽에 붙지 않은 자리)만 */for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy;if(!now.has(K(x,y))||![[1,0],[-1,0],[0,1],[0,-1]].every(([ax,ay])=>now.has(K(x+ax,y+ay))))continue;const d=Math.hypot(x+.5-P.x,y+.5-P.y);if(!best||d<best[0])best=[d,x+.5,y+.5];}
 return best?{zone:id,x:best[1],y:best[2]}:null;}catch(e){fail(e);return null;}}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const to=nudge(raw),out=await base.call(this,raw,...a);
 try{if(to&&out!==false&&typeof player!=='undefined'&&player&&typeof zone!=='undefined'&&zone===to.zone&&typeof room!=='undefined'&&room?.exploration?.wallsSolidR830&&!blocked(to.x,to.y,.29,room)){player.x=to.x;player.y=to.y;cam={x:to.x,y:to.y};route=[];command=null;target=null;stats.nudged=(stats.nudged||0)+1;}}catch(e){fail(e);}return out;};}
function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_WALLS_SOLID_R830__=Object.freeze({revision:REV,zones:Object.freeze(Object.keys(ZONES)),solidify,layoutFor,set,qa:o=>{qaForce=o||null;},inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,collisionChanged:true})});
})();
