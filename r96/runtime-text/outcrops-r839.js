// R839 야외맵 길을 맵마다 다르게 — 길 옆 바위턱(메인 벽 덩어리)으로 굽은 길 만들기.
//  사용자 2026-11-12 "이동구조를 맵마다 서사와 테마에 맞게 변형" · "꼭 벽이 아니더라도 건물등을 배치해서 길을 만든다던지 조형물을 배치해서 길을 만든다던지".
//  실측(헤드리스, 방이 없는 야외 스토리 15지역): 길은 어디나 12칸 안팎 폭의 곧은 띠이고 길을 막는 것(solid 조형물)이 0개라, 지역이 달라도 같은 직선 길로 읽혔다.
//  고침: 곧은 길 구간의 바닥 칸 일부를 '바닥이 아닌 칸'으로 바꾼다. 야외에서는 그 칸이 길 옆과 같은 바위 둔덕(메인 벽 덩어리)으로 그려지고
//   판정·길찾기·몹 배치도 길 옆과 똑같이 다뤄진다(R838 fillCells — 벽판을 다시 두르고 그림과 판정이 같은 지도를 쓴다). 얇은 벽판은 새로 만들지 않는다.
//   · chicane — 한쪽에서 길 절반까지 내민 턱, 좌우가 번갈아 나옴(무너진 큰길·눈길·묘지 길: S자 동선)
//   · pinch   — 양쪽에서 내밀어 가운데만 남긴 목(굽잇길·광장 길목·다리: 좁은 관문)
//   · island  — 길 한가운데 선 바위섬, 양옆으로 갈라 지나감(숲 빈터·기둥 길·의식장)
//   · scatter — 작은 바위 여럿(열린 풀밭·갈라지는 숲길: 바위 사이로 누비는 길)
//   · notch   — 얕고 긴 턱(늪·물길·원형 길: 물결치는 길가)
//   어느 모양이든 지나갈 폭은 4칸 이상(턱·목은 5칸 이상) 남고, 바닥은 한 덩어리로 이어진다. 보스 전투실·광장(큰 방)·문·입구·길목 둘레는 그대로 둔다.
//  자리 고르기: plan() 이 지도에서 곧은 구간을 찾아 후보를 내고, qa/r839-outcrops/outcrops-bake.mjs 가 지역마다 켠·끈 지도로 새로 들어가
//   조형물·몹 자리를 비교해 자리를 바꾸는 턱을 뺀 뒤 TABLE 에 적었다. 실제 게임은 TABLE 의 사각형만 쓴다(표가 없는 지역은 그대로).
//   지도가 달라져 표의 칸이 바닥이 아니거나 바닥이 끊기면 그 턱은 건너뛴다. 표가 있는 지역의 고정 조형물·몹 자리는 끈 지도와 같다(outcrops-browser.mjs 가 확인).
//   야외 흩뿌림 장식(R81 장면 소품·R299 유품·R74 풍경·R99 나무 그림)은 바닥 칸 목록으로 뽑기 때문에 바닥이 한 칸만 달라도 지도 전체에서 같은 규칙으로 다시 뽑힌다 — 이들은 바닥 위·턱 밖인지만 확인한다.
//  대상 밖: 불면귀 마을(last302·last303 — 다른 스레드가 다듬는 중), 병동 틀 지역, 방형식 지도(R838), 맘몬, 동굴, 사몽, 생존 모드 무대, 협동.
//  끄기: localStorage['storyworld.r839.outcrops']='{"on":false}' 뒤 새로 고침
(()=>{'use strict';
if(window.__STORYWORLD_OUTCROPS_R839__)return;
const REV='R839-outcrops-1',KEY='storyworld.r839.outcrops',P=window.__STORYWORLD_PASSAGES_R838__;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={layouts:0,blocks:0,cells:0,skipped:0,nudged:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const K=(x,y)=>x+':'+y;
// 지역 → 모양. 지역 제목·지형 틀(R171 template)에 맞춘다.
const STYLE={
 dist00:'island',/* 악마화 나무의 정원 — 숲 빈터 */ dist02:'notch',/* 늪지대의 뿔악마 — 늪 둑길 */ dist03:'chicane',/* 무너진 성 — 무너진 큰길 */
 dist04:'pinch',/* 시체들이 되살아난 밤 — 굽잇길 */ dist05:'island',/* 일곱 기둥 — 모이는 길 */ dist06:'notch',/* 추락 — 원형 결투장 둘레 */
 ep1b06b:'chicane',/* 눈보라 속의 소년 — 얼어붙은 굽잇길 */ last304:'scatter',/* 중립 지역의 재각성 — 열린 풀밭 */ last305:'island',/* 고블린 두목과 장미 인장 — 숲 빈터 */
 kair04:'pinch',/* 예순여섯 수문장 — 부서진 광장 */ kair05:'scatter',/* 빼앗긴 시간 — 갈라지는 숲길 */ kair06:'notch',/* 닫힌 층의 명령 — 물길 */
 kair08:'pinch',/* 뉴런 게이트 — 다리 */ kair09:'chicane',/* 망각의 묘지 — 무덤 길 */ kair10:'island'/* 붕괴 의식장 — 깨진 눈금판 */
};
// 모양별 치수: len 길 방향 길이, gap 남기는 폭, space 턱 사이 거리(가운데끼리), frac 길 폭 대비 내미는 비율
const SHAPE={chicane:{len:5,gap:5,space:13,frac:.42},pinch:{len:3,gap:5,space:16},island:{gap:4,space:14,sizes:[[6,4],[4,6],[5,3],[3,5],[5,2],[2,5]],max:10},scatter:{gap:4,space:9,sizes:[[3,2],[2,3],[2,2]],max:14},notch:{len:7,gap:6,space:11,frac:.3}};
const MAXBLOCKS=10,WMIN=8,WMAX=18,LONG=20,STRAIGHT=2;
// 굽기 표 — outcrops-bake.mjs 가 만든다. 지역 → [[x,y,너비,깊이],…]
const TABLE={/*BAKED 2026-11-12 outcrops-bake.mjs — dist03·dist06·ep1b06b·kair08·kair09 는 조형물·몹 자리가 끈 지도와 완전히 같고, dist04·kair04·kair10 은 고정 조형물·몹은 같되 흩뿌림 장식(나무 그림·장면 소품)이 같은 규칙으로 다시 뽑힌다. 나머지 7지역은 턱을 넣으면 고정 조형물이 옮겨져 그대로 둔다. */
 dist03:[[40,75,5,5],[54,12,5,5],[89,32,5,5]],
 dist04:[[[4,54,3,2],[4,61,3,2]],[[46,73,3,6],[46,85,3,6]],[[47,9,2,3],[54,9,2,3]],[[32,55,2,3],[39,55,2,3]],[[56,56,2,3],[63,56,2,3]]],
 dist06:[[68,50,7,3],[18,41,3,7],[18,81,3,7]],
 ep1b06b:[[47,4,4,5],[56,63,4,5]],
 kair04:[[[40,68,3,3],[40,77,3,3]],[[51,27,3,3],[51,35,3,3]],[[58,5,3,3],[58,14,3,3]],[[9,43,4,3],[18,43,4,3]],[[53,55,3,3],[61,55,3,3]],[[10,59,3,3],[19,59,3,3]]],
 kair08:[[[41,74,3,3],[41,82,3,3]]],
 kair09:[[41,74,5,4],[53,11,5,4],[54,74,5,4],[68,11,5,4]],
 kair10:[[83,51,5,2],[42,33,5,2],[60,66,2,5]]
};
function setOf(L){return new Set((L.floorCells||[]).map(c=>K(c[0],c[1])));}
// 그대로 둘 곳: 큰 방(보스 전투실·광장·전투 방)의 사각형과, 문·입구·길목·집결 자리 둘레
function guards(L){const pts=[],rects=[],pt=(q,r)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))pts.push([q.x,q.y,r]);};
 const special=new Set([L.bossRoomNodeId,L.midbossRoomNodeId].filter(v=>v!=null));/* combatRoomNodeIds 는 길 토막까지 거의 모든 길목을 담고 있어 쓰지 않는다 */
 for(const n of L.nodes||[]){pt(n,1.5);const w=Number(n.width)||0,d=Number(n.depth)||0;if(n.bossCoreR78||n.storyMapR171==='hall'||special.has(n.id))rects.push([n.x-w/2-2,n.y-d/2-2,n.x+w/2+2,n.y+d/2+2]);}
 for(const d of L.worldR74?.doors||[])pt(d,7);pt(L.entry,7);pt(L.entrance,7);pt(L.worldWardR81?.gatherAnchor,5);for(const s of Array.isArray(L.starts)?L.starts:[])pt(s,4);
 const a=L.centralArena;if(a&&Number.isFinite(a.x+a.y+a.width+a.depth))rects.push([a.x-a.width/2-2,a.y-a.depth/2-2,a.x+a.width/2+2,a.y+a.depth/2+2]);
 return{pts,rects};}
function clear(G,b){const x0=b[0],y0=b[1],x1=b[0]+b[2],y1=b[1]+b[3];
 for(const[px,py,r]of G.pts){const dx=Math.max(x0-px,0,px-x1),dy=Math.max(y0-py,0,py-y1);if(Math.hypot(dx,dy)<r)return false;}
 for(const[rx0,ry0,rx1,ry1]of G.rects)if(x0<rx1&&x1>rx0&&y0<ry1&&y1>ry0)return false;return true;}
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
// 후보 찾기. 가로 길(x 방향으로 뻗음): 세로로 잰 폭이 WMIN~WMAX 이고 그 줄이 LONG 칸 넘게 이어지며, 턱 앞뒤 STRAIGHT 칸까지 폭·자리가 같은 곧은 구간.
function plan(id,L,opt){const style=opt?.style||STYLE[id],sh=SHAPE[style],S=setOf(L),has=(x,y)=>S.has(K(x,y)),out={style,blocks:[],bands:0};if(!sh||!S.size)return out;
 const G=guards(L),drop=new Set(opt?.drop||[]),B=L.bounds||[0,0,120,120],picks=[],seed=hash(id);
 if(sh.sizes){/* 바위섬·흩어진 바위: 둘레 gap 칸이 모두 바닥인 자리면 곧은 길이든 빈터든 어디나. 훑는 순서는 지역 이름으로 섞어 줄 맞춘 티가 나지 않게 한다. */
  const X0=Math.floor(B[0]),Y0=Math.floor(B[1]),W=Math.ceil(B[2])-X0+2,H=Math.ceil(B[3])-Y0+2,sum=new Int32Array((W+1)*(H+1));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)sum[(y+1)*(W+1)+x+1]=(has(x+X0,y+Y0)?1:0)+sum[y*(W+1)+x+1]+sum[(y+1)*(W+1)+x]-sum[y*(W+1)+x];
  const full=(x,y,w,d)=>{const a=x-X0,b=y-Y0;if(a<0||b<0||a+w>W||b+d>H)return false;return sum[(b+d)*(W+1)+a+w]-sum[b*(W+1)+a+w]-sum[(b+d)*(W+1)+a]+sum[b*(W+1)+a]===w*d;};
  const order=[];for(let y=Y0;y<Y0+H;y++)for(let x=X0;x<X0+W;x++)if(has(x,y))order.push([hash(id+':'+x+':'+y),x,y]);order.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  for(const[,x,y]of order){if(picks.length>=sh.max)break;const k0=(x+y+seed)%sh.sizes.length;
   for(let i=0;i<sh.sizes.length;i++){const[w,d]=sh.sizes[(k0+i)%sh.sizes.length],b=[x,y,w,d],key=b.join(',');if(drop.has(key))continue;
    if(!full(x-sh.gap,y-sh.gap,w+2*sh.gap,d+2*sh.gap)||!clear(G,b))continue;const c=[x+w/2,y+d/2];
    if(picks.some(p=>Math.max(Math.abs(p.c[0]-c[0]),Math.abs(p.c[1]-c[1]))<sh.space))continue;picks.push({key,c,rects:[b]});break;}}
  out.blocks=picks.map(p=>({key:p.key,rects:p.rects}));out.candidates=picks.length;return out;}
 const run=(x,y,dx,dy)=>{let a=0,b=0;while(has(x-dx*(a+1),y-dy*(a+1)))a++;while(has(x+dx*(b+1),y+dy*(b+1)))b++;return[a,b];};
 for(const hz of[true,false]){const seen=new Set(),bandCount=new Map();
  const U0=Math.floor(hz?B[0]:B[1]),U1=Math.ceil(hz?B[2]:B[3]),V0=Math.floor(hz?B[1]:B[0]),V1=Math.ceil(hz?B[3]:B[2]),at=(u,v)=>hz?[u,v]:[v,u];
  const span=u=>{/* 이 줄(u)의 가로지르는 바닥 구간들 */const r=[];let s=null;for(let v=V0;v<=V1+1;v++){const f=has(...at(u,v));if(f&&s==null)s=v;if(!f&&s!=null){r.push([s,v-1]);s=null;}}return r;};
  const spans=new Map();for(let u=U0-STRAIGHT-1;u<=U1+STRAIGHT+1;u++)spans.set(u,span(u));
  const same=(u,va,vb)=>(spans.get(u)||[]).some(r=>r[0]===va&&r[1]===vb);
  for(let u=U0;u<=U1;u++)for(const[va,vb]of spans.get(u)||[]){const w=vb-va+1;if(w<WMIN||w>WMAX)continue;const bk=(hz?'h:':'v:')+va+':'+vb;
   let ok=true;for(let k=-STRAIGHT;k<sh.len+STRAIGHT&&ok;k++)if(!same(u+k,va,vb))ok=false;if(!ok)continue;
   const mid=at(u,(va+vb)>>1),[la,lb]=run(mid[0],mid[1],hz?1:0,hz?0:1);if(la+lb+1<LONG)continue;
   const n=bandCount.get(bk)||0,flip=((seed>>>(hz?3:7))+n)&1;let rects=null,depth=0;
   if(style==='chicane'||style==='notch'){depth=Math.max(2,Math.min(Math.round(w*sh.frac),w-sh.gap));if(depth<2)continue;const top=[va,depth],bot=[vb-depth+1,depth];rects=[[flip?bot:top],[flip?top:bot]];}
   else if(style==='pinch'){depth=Math.floor((w-sh.gap)/2);if(depth<2)continue;rects=[[[va,depth],[vb-depth+1,depth]]];}
   else continue;
   for(const alt of rects){const bs=alt.map(([v,d])=>hz?[u,v,sh.len,d]:[v,u,d,sh.len]);const key=bs.map(b=>b.join(',')).join('|');if(drop.has(key)||seen.has(key))continue;
    if(!bs.every(b=>clear(G,b)))continue;const cu=u+sh.len/2,cv=(va+vb+1)/2,c=at(cu,cv);
    if(picks.some(p=>Math.max(Math.abs(p.c[0]-c[0]),Math.abs(p.c[1]-c[1]))<sh.space))continue;
    picks.push({key,c,rects:bs,band:bk});seen.add(key);bandCount.set(bk,n+1);break;}}
  out.bands+=bandCount.size;}
 // 지도 전체에 고르게: 순서를 섞지 않고 간격만으로 골랐으므로 많으면 고르게 솎는다
 let use=picks;if(use.length>MAXBLOCKS){const step=use.length/MAXBLOCKS;use=Array.from({length:MAXBLOCKS},(_,i)=>picks[Math.floor(i*step)]);}
 out.blocks=use.map(p=>({key:p.key,rects:p.rects}));out.candidates=picks.length;return out;}
const cellsOf=rects=>{const c=[];for(const[x,y,w,d]of rects)for(let j=0;j<d;j++)for(let i=0;i<w;i++)c.push([x+i,y+j]);return c;};
const byId=new Map();
function sourceOf(id,L){if(!L?.outcropsR839)return null;if(L.r839Source)return L.r839Source;const s=byId.get(id);return s&&s.floorCells.length===L.outcropsR839.before?s:null;}
// 표(또는 검사용 목록)의 턱을 차례로 입힌다. 칸이 모두 바닥이어야 하고, 입힌 뒤에도 바닥이 한 덩어리여야 한다(fillCells 가 확인) — 아니면 그 턱만 건너뛴다.
function build(id,src,blocks,style){let cur=src;const done=[];let skipped=0;
 for(const b of blocks||[]){const rects=b.rects||[b],S=setOf(cur),cells=cellsOf(rects);if(!cells.length||!cells.every(c=>S.has(K(c[0],c[1])))){skipped++;continue;}
  const next=P.fillCells(cur,cells);if(!next){skipped++;continue;}cur=next;done.push({key:b.key||rects.map(r=>r.join(',')).join('|'),rects,cells:cells.length});}
 stats.skipped+=skipped;if(cur===src)return null;const out=cur;
 out.outcropsR839={revision:REV,style:style||STYLE[id]||null,blocks:done,skipped,cells:done.reduce((n,b)=>n+b.cells,0),before:src.floorCells.length,after:out.floorCells.length};
 Object.defineProperty(out,'r839Source',{value:src});if(src.r219Source)Object.defineProperty(out,'r219Source',{value:src.r219Source});
 if(src.r204Source||!src.r219Source)Object.defineProperty(out,'r204Source',{value:src.r204Source||src});byId.set(id,src);return out;}
const tableBlocks=id=>(TABLE[id]||[]).map(r=>Array.isArray(r[0])?{rects:r}:{rects:[r]});
const cache=new WeakMap();let qa=null;/* 검사용 덮어쓰기 {지역:{blocks:[[x,y,w,d]|[[…],[…]],…]} | {plan:true,drop:[키…],style}} — 표에 없는 지역은 원래 지도 */
try{const q=JSON.parse(localStorage.getItem(KEY+'.qa')||'null');if(q&&typeof q==='object')qa=q;}catch(_){}
const eligible=(id,L)=>!!STYLE[id]&&!!L?.floorCells?.length&&!!L.storyMapR171&&!L.r224Rooms?.length&&!L.samongR103&&!L.samongR115;
function shape(id,L){try{if(!eligible(id,L))return L;const src=sourceOf(id,L)||L;
 if(qa){const q=qa[id];if(!q)return src;const blocks=q.plan?plan(id,src,q).blocks:(q.blocks||[]).map(r=>Array.isArray(r[0])?{rects:r}:{rects:[r]});return build(id,src,blocks,q.style)||src;}
 if(!prefs.on)return src;if(L.outcropsR839)return L;if(cache.has(L))return cache.get(L);
 const out=build(id,L,tableBlocks(id))||L;if(out!==L){stats.layouts++;stats.blocks+=out.outcropsR839.blocks.length;stats.cells+=out.outcropsR839.cells;}
 cache.set(L,out);return out;}catch(e){fail(e);return L;}}
const solo=()=>(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off';
// 예전 저장: 영웅이 이제 바위턱이 된 칸에 서 있으면 복원 뒤 가장 가까운 바닥 칸 한가운데에 세운다(R838 과 같은 방식). 저장 객체는 고치지 않는다.
function nudge(raw){try{const id=raw?.zone,pl=raw?.player;if(!prefs.on||raw?.layer!=='STORY'||!STYLE[id]||!pl||!Number.isFinite(pl.x+pl.y)||!solo())return null;
 let L=window.__STORYWORLD_EXPLORATION__?.layout?.(id,'STORY'),L0=sourceOf(id,L);if(!L0&&L&&!L.outcropsR839){const T=shape(id,L);if(T&&T!==L&&T.outcropsR839){L0=L;L=T;}}if(!L0)return null;
 const now=setOf(L),was=setOf(L0),cx=Math.floor(pl.x),cy=Math.floor(pl.y),gone=(x,y)=>was.has(K(x,y))&&!now.has(K(x,y)),R=.3;
 let hit=false;for(const[dx,dy]of[[0,0],[R,0],[-R,0],[0,R],[0,-R]])if(gone(Math.floor(pl.x+dx),Math.floor(pl.y+dy)))hit=true;if(!hit)return null;
 let best=null;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=cx+dx,y=cy+dy;if(!now.has(K(x,y))||![[1,0],[-1,0],[0,1],[0,-1]].every(([ax,ay])=>now.has(K(x+ax,y+ay))))continue;const d=Math.hypot(x+.5-pl.x,y+.5-pl.y);if(!best||d<best[0])best=[d,x+.5,y+.5];}
 return best?{zone:id,x:best[1],y:best[2]}:null;}catch(e){fail(e);return null;}}
function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
const API=Object.freeze({revision:REV,STYLE,SHAPE,TABLE,plan,guards,shape,source:sourceOf,nudge,set,qa:o=>{qa=o||null;},inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,linked:!!P?.extend,collisionChanged:true})});
window.__STORYWORLD_OUTCROPS_R839__=API;
if(!P?.fillCells||typeof P.extend!=='function'){fail('R838 passages API missing');return;}
P.extend(shape);
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const to=nudge(raw),out=await base.call(this,raw,...a);
 try{if(to&&out!==false&&typeof player!=='undefined'&&player&&typeof zone!=='undefined'&&zone===to.zone&&typeof room!=='undefined'&&room?.exploration?.outcropsR839){/* 고른 칸에 조형물이 서 있을 수 있다 → 저장 자리에서 가장 가까운, 실제로 설 수 있는 칸을 다시 찾는다(없으면 엔진이 옮긴 자리 그대로) */const sx=raw.player.x,sy=raw.player.y;let best=blocked(to.x,to.y,.29,room)?null:[Math.hypot(to.x-sx,to.y-sy),to.x,to.y];
  if(!best)for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=Math.floor(sx)+dx+.5,y=Math.floor(sy)+dy+.5,d=Math.hypot(x-sx,y-sy);if((!best||d<best[0])&&!blocked(x,y,.29,room))best=[d,x,y];}
  if(best){to.x=best[1];to.y=best[2];player.x=to.x;player.y=to.y;cam={x:to.x,y:to.y};route=[];command=null;target=null;stats.nudged++;}}}catch(e){fail(e);}return out;};}
})();
