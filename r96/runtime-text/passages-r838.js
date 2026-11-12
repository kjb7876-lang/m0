// R838 실내맵 문간(방 사이 통로) 벽 구조를 맵마다 다르게 — 사용자 2026-11-12 "스토리모드 내부맵 방구조는 바꾸지말고 중간 중간 통로들에 있는
//  벽구조를 여러 미로들 참고해서 조금 맵마다 차별성이 있게 … 모든요소랑 충돌하거나 버그 있으면 안됨 특히 지금 가구배치하는거에 영향없게".
//  실측(헤드리스, 방형식 실내 26지역): 방과 방 사이는 '1칸 두께 벽에 난 6칸·10칸 폭의 트인 문간'이다(지역마다 4~54곳).
//   어느 지역이나 같은 폭의 뻥 뚫린 문간이 같은 자리에 나 있어 맵이 서로 같은 격자로 읽혔다.
//  고침: 방(r224Rooms 사각형)은 한 칸도 건드리지 않고, 문간 줄의 칸 일부만 벽 덩어리로 메워 문간 모양과 길 흐름을 지역 테마에 맞춘다.
//   · gate   — 양 끝을 메운 가운데 문(병동·관리실·호텔처럼 정돈된 건물)
//   · offset — 한쪽으로 치우친 문, 문간마다 좌우가 바뀜(좁고 비뚤어진 집·주방·골목: 지그재그 동선)
//   · mirror — 줄마다 반대쪽으로 치우친 문(거울 복도·심판 격자: 엇갈려 꺾이는 미로)
//   · pier   — 가운데 기둥을 세운 아케이드(성당 회랑·궁정·무대 옆·열병 격자)
//   · ruin   — 문간마다 위 모양과 '그대로'가 섞임(폐허 도시·불탄 계단실·유기 배양 미로)
//   offset·mirror·ruin 은 문간 일부를 아예 막아 돌아가는 길을 만든다(미로의 막다른 벽). 막아도 바닥은 한 덩어리로 이어지고, 그 문간 양옆 사이
//   돌아가는 길이 DETOUR 칸을 넘으면 막지 않는다. 어느 모양이든 열린 문간에는 2칸 이상 트인 곳이 남고 그중 하나는 3칸 이상이다.
//   문(R74 doors)·입구·길목(nodes) 둘레 문간은 그대로 둔다.
//  메운 칸은 '바닥이 아닌 칸'이 되어 옆 벽과 같은 길(벽판·지붕 덮개·시야·길찾기)로 처리된다 — 그림과 판정이 같은 지도(R219 규칙: layoutFor 훅 안에서 한 번).
//  가구: 조형물 배치 규칙은 방 둘레 바닥 칸 수·벽 자리를 보므로 문간이 바뀌면 곁 조형물이 옮겨질 수 있다 → qa/r838-passages/passages-bake.mjs 가
//   지역마다 켠·끈 지도로 새로 들어가 조형물·몹 자리를 비교해, 자리를 바꾸는 문간을 KEEP_OPEN 표에 적었다(그 문간은 그대로 둔다).
//   차이가 0 이 되지 않는 지역은 문간을 모두 그대로 둔다. 표가 있는 한 조형물·몹 자리는 끈 지도와 같다(passages-browser.mjs 가 매번 확인).
//   (방을 원래 지도로 만든 뒤 지도만 갈아 끼우는 방식은 시험해 보고 버렸다: 지도가 바뀌면 조형물을 다시 놓는 손질들이 있어 들어간 뒤 자리가 달라진다.)
//  대상 밖: 맘몬의 금고(ep1b06 — 사용자 승인 필요 지역), 병원 본관, 병동 틀 7지역(R830), 야외 지도, 사몽, 협동.
//  끄기: localStorage['storyworld.r838.passages']='{"on":false}' 뒤 새로 고침
(()=>{'use strict';
if(window.__STORYWORLD_PASSAGES_R838__)return;
const REV='R838-passages-2',KEY='storyworld.r838.passages',DETOUR=46;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={layouts:0,gaps:0,shaped:0,blocked:0,cells:0,nudged:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// 지역 → 문간 모양 (지역 제목·원래 지형 이름은 story-maps-r171.js 머리말 표)
const STYLE=Object.freeze({
 ep1a09:'gate',/* 주사실 — 진료 구획 문 */ ep1a09b:'pier',/* 결전의 날 — 궁정 회랑 */ ep1a10:'ruin',/* 환자와 중독의 도시 — 폐허 격자 */ ep1a11:'pier',/* 천사의 가면 — 후광 경기장 아케이드 */
 ep1b02:'offset',/* 나태의 집 — 비좁고 비뚤어진 방들 */ ep1b03:'mirror',/* 금이 간 안경 — 거울 복도 */ ep1b04:'offset',/* 탐식의 주방 — 조리대 미로 */ ep1b05:'pier',/* 붉은 하이힐 — 무대 옆 기둥 */
 ep1b07:'ruin',/* 불을 지른 남자 — 불탄 계단실 */ ep1b09:'gate',/* 생체 부트로더 — 격실 문 */
 u201:'pier',/* 방어의 군단 — 열병 격자 */ u202:'ruin',/* 잔인한 구원 — 무너진 구획 */ u204:'gate',/* 시스템의 거부권 — 구획 관문 */ u205:'gate',/* 관리자 권한 — 집무실 */ u206:'pier',/* 중앙 코어 이주실 */ u203:'gate',/* 기억의 문 */
 murder01:'offset',/* 윤하람 — 골목 */ murder02:'gate',/* 새빛호텔 — 객실 문 */ murder04:'offset',/* 청록빌라 — 빌라 계단 */ murder03:'pier',/* 옥상의 순환 — 옥상 난간 기둥 */
 cult01:'pier',cult02:'pier',/* 교단 회랑·성가대 */ cult05:'ruin',/* 유기 배양 미로 */ cult06:'mirror',/* 심판 격자 */ cult03:'pier'/* 사몽의 문턱 — 삼중 금고 */});
// 문간을 아예 막는 비율(모양별)
const BLOCK=Object.freeze({gate:0,pier:0,offset:.12,mirror:.18,ruin:.2});
// 조형물·몹 자리가 달라져 그대로 두는 문간(qa/r838-passages/passages-bake.mjs 실측) — '지역':['h:y:x0'|'v:x:y0',…]
const KEEP_OPEN=Object.freeze({/*BAKE*/
 ep1a09:['h:14:78','h:27:79','h:40:18','h:46:18','h:53:18','v:29:29','v:51:50'],
 ep1a09b:['h:85:14'],
 ep1a10:['h:45:83','h:69:3','h:82:63','h:86:63','v:14:88','v:29:58','v:42:3','v:55:3','v:59:3','v:59:58','v:72:3'],
 ep1a11:['h:13:77','h:45:83','h:58:36','h:86:37','v:25:70','v:29:29','v:53:70','v:75:19'],
 ep1b02:['h:14:36','h:17:84','h:53:12','h:64:12','h:66:34','h:66:58','h:77:46','v:19:70','v:30:70','v:41:70','v:45:7','v:53:70'],
 ep1b03:['h:10:31','h:10:42','h:21:75','h:37:83','h:50:3','h:61:14','h:61:3','h:72:3','h:83:3','h:83:69','v:10:43','v:10:76','v:21:65','v:38:14','v:38:3','v:49:14','v:49:3','v:54:54','v:54:65','v:54:76','v:60:14','v:60:25','v:60:3','v:65:43','v:65:54','v:65:76','v:65:87','v:71:14','v:71:3','v:82:25'],
 ep1b04:['h:10:31','h:61:25','h:61:36','h:83:58','h:83:69','v:32:65','v:60:25','v:65:43','v:65:87'],
 ep1b05:['h:41:10','h:52:10','h:56:10','h:66:10','h:67:67','v:21:45','v:22:59','v:22:68','v:26:68','v:35:68','v:50:55','v:62:5','v:62:68','v:64:55','v:66:5','v:66:68','v:76:5'],
 ep1b07:['v:29:29','v:53:78'],
 ep1b09:['h:39:18','h:45:83','h:60:37','h:78:20','h:84:37','v:53:19','v:77:50'],
 u201:['h:67:3','h:71:3','h:71:33','v:31:88'],
 u202:['h:21:31','h:83:25','h:83:36','v:32:76','v:32:87','v:43:54','v:43:76','v:49:25'],
 u204:['h:14:50','h:66:34','h:77:23','h:77:46','v:19:70','v:30:70','v:41:70','v:45:7'],
 u205:['h:14:36','h:17:84','h:26:36','h:41:82','h:45:83','h:66:34','h:66:58','h:77:46','v:19:70','v:30:70','v:45:7','v:57:7','v:69:7','v:80:10'],
 u206:['h:66:56','v:25:70','v:36:51','v:53:19'],
 u203:['h:27:79','h:52:18','v:51:70'],
 murder01:['h:28:82','h:44:83'],
 murder02:['h:27:37','v:42:80'],
 murder04:['h:14:36','h:64:12','h:66:58','h:77:46','v:41:70','v:77:50','v:80:10'],
 murder03:['h:67:56'],
 cult01:['h:64:56','v:30:29'],
 cult02:['h:64:56'],
 cult05:['h:21:31','h:21:53','h:21:86','h:50:25','h:50:3','h:50:47','h:50:58','h:61:14','h:61:3','h:61:36','h:61:47','h:61:58','h:72:25','h:72:3','h:72:58','h:83:14','h:83:3','h:83:36','h:83:69','v:10:43','v:10:87','v:21:54','v:21:76','v:21:87','v:32:43','v:32:54','v:32:65','v:32:76','v:32:87','v:38:3','v:43:43','v:43:76','v:43:87','v:49:25','v:49:3','v:54:43','v:54:65','v:54:76','v:54:87','v:60:14','v:60:25','v:60:3','v:65:54','v:65:87','v:71:14','v:71:25','v:71:3'],
 cult06:['h:10:31','h:10:75','h:83:69','v:21:65','v:60:25','v:60:3','v:65:43','v:65:87'],
 cult03:['h:25:78','h:62:56','h:67:56','v:75:19','v:77:50']});
const K=(x,y)=>x+':'+y,THIN=.7;
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
// 문간 찾기: 방 사각형 밖 바닥 칸이 한 줄로 이어지고, 줄 양옆(수직 방향)은 둘 다 방 안 바닥, 줄 양 끝은 벽인 것
function gaps(L){const R=L.r224Rooms||[],S=new Set(L.floorCells.map(c=>K(c[0],c[1]))),has=(x,y)=>S.has(K(x,y)),inRoom=(x,y)=>R.some(r=>x>=r.x0&&x<r.x1&&y>=r.y0&&y<r.y1),cor=(x,y)=>has(x,y)&&!inRoom(x,y),side=(x,y)=>has(x,y)&&inRoom(x,y);
 const [bx0,by0,bx1,by1]=L.bounds,out=[];
 for(let y=by0;y<by1;y++)for(let x=bx0;x<bx1;x++){if(!cor(x,y)||cor(x-1,y))continue;let e=x;while(cor(e+1,y))e++;if(has(x-1,y)||has(e+1,y))continue;let ok=true;for(let i=x;i<=e;i++)if(!side(i,y-1)||!side(i,y+1)){ok=false;break;}if(ok)out.push({key:'h:'+y+':'+x,hz:true,fixed:y,a:x,n:e-x+1});}
 for(let x=bx0;x<bx1;x++)for(let y=by0;y<by1;y++){if(!cor(x,y)||cor(x,y-1))continue;let e=y;while(cor(x,e+1))e++;if(has(x,y-1)||has(x,e+1))continue;let ok=true;for(let i=y;i<=e;i++)if(!side(x-1,i)||!side(x+1,i)){ok=false;break;}if(ok)out.push({key:'v:'+x+':'+y,hz:false,fixed:x,a:y,n:e-y+1});}
 return out;}
const fillExcept=(n,a,keep)=>{const out=[];for(let i=0;i<n;i++)if(i<a||i>=a+keep)out.push(i);return out;};
// 문간 폭 n 에서 메울 자리(0..n-1)
function pattern(style,n,g,id){if(n<5)return[];const h=hash(id+':'+g.key),keep=n>=9?4:3;
 if(style==='ruin')style=['gate','offset','pier','open','offset','pier'][h%6];
 if(style==='mirror')return fillExcept(n,(g.fixed>>3)%2===0?0:n-keep,keep);
 if(style==='offset')return fillExcept(n,(h>>3)%2===0?0:n-keep,keep);
 if(style==='gate'){if(n<6)return[];const k=n>=9?4:n-2;return fillExcept(n,(n-k)>>1,k);}
 if(style==='pier'){if(n<6)return[];const out=[];if(n<=7)out.push(n>>1);else for(let i=3;i<n-3;i+=4)out.push(i);return out;}
 return[];}
function guards(L){const out=[],pt=(q,r)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,r]);};for(const d of L.worldR74?.doors||[])pt(d,Math.max(4,(Number(d.width)||0)/2+3));for(const q of[L.entry,L.entrance,L.gate,L.objective,...(L.starts||[])])pt(q,4);for(const n of L.nodes||[])pt(n,1.5);return out;}
// 두 칸 사이 걸음 수(4방향, 상한 max). 못 가거나 넘으면 Infinity
function steps(S,a,b,max){const ka=K(a[0],a[1]),kb=K(b[0],b[1]);if(!S.has(ka)||!S.has(kb))return Infinity;let cur=[a],d=0;const seen=new Set([ka]);while(cur.length&&d<max){const nx=[];d++;for(const[x,y]of cur)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=K(x+dx,y+dy);if(!S.has(k)||seen.has(k))continue;if(k===kb)return d;seen.add(k);nx.push([x+dx,y+dy]);}cur=nx;}return Infinity;}
function connected(S){const it=S.values().next();if(it.done)return true;const seen=new Set([it.value]),q=[it.value.split(':').map(Number)];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=K(x+dx,y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}return seen.size===S.size;}
const cellAt=(g,i,off=0)=>g.hz?[g.a+i,g.fixed+off]:[g.fixed+off,g.a+i];
function plan(id,L,opt){const style=opt?.style||STYLE[id];if(!style)return{cells:[],gaps:[]};const G=guards(L),keepOpen=new Set(opt?.keepOpen||KEEP_OPEN[id]||[]),cells=[],rows=[],S=new Set(L.floorCells.map(c=>K(c[0],c[1]))),cand=[];
 for(const g of gaps(L)){if(g.n<5)continue;stats.gaps++;if(keepOpen.has(g.key)){rows.push({key:g.key,n:g.n,fill:0,why:'keep-open'});continue;}
  const bx=g.hz?[g.a,g.fixed,g.a+g.n,g.fixed+1]:[g.fixed,g.a,g.fixed+1,g.a+g.n];/* 지킬 점에서 문간 줄(사각형)까지 거리 */if(G.some(([x,y,r])=>Math.hypot(x-Math.max(bx[0],Math.min(bx[2],x)),y-Math.max(bx[1],Math.min(bx[3],y)))<r)){rows.push({key:g.key,n:g.n,fill:0,why:'guard'});continue;}
  const idx=pattern(style,g.n,g,id),row={key:g.key,n:g.n,fill:idx.length};rows.push(row);for(const i of idx){const c=cellAt(g,i);cells.push(c);S.delete(K(c[0],c[1]));}
  if((hash('block:'+id+':'+g.key)%1000)/1000<(opt?.block??BLOCK[style]??0))cand.push([g,row,idx]);}
 // 막는 문간: 하나씩 막아 보고 바닥이 이어지고 돌아가는 길이 짧을 때만
 for(const[g,row,idx]of cand){const rest=[];for(let i=0;i<g.n;i++)if(!idx.includes(i))rest.push(cellAt(g,i));if(!rest.length)continue;for(const c of rest)S.delete(K(c[0],c[1]));
  const m=g.n>>1,ok=connected(S)&&steps(S,cellAt(g,m,-1),cellAt(g,m,1),DETOUR)<=DETOUR;
  if(ok){cells.push(...rest);row.fill=g.n;row.blocked=true;}else for(const c of rest)S.add(K(c[0],c[1]));}
 return{cells,gaps:rows,style};}
// 축에 나란하고 정수 줄 위에 선 얇은 벽판 → {hz,fixed,a,b}. 아니면 null (R830 과 같은 기준)
function seg(w){if(!w||w.angle&&Math.abs(w.angle)>1e-6||!Number.isFinite(w.x+w.y+w.width+w.depth))return null;const hz=w.width>=w.depth,t=hz?w.depth:w.width,len=hz?w.width:w.depth;if(t>THIN||len<.5)return null;
 const fixed=hz?w.y:w.x,c=hz?w.x:w.y,a=c-len/2,b=c+len/2;if(Math.abs(fixed-Math.round(fixed))>.02||Math.abs(a-Math.round(a))>.02||Math.abs(b-Math.round(b))>.02)return null;return{hz,fixed:Math.round(fixed),a:Math.round(a),b:Math.round(b)};}
// 바닥 칸 몇 개를 '바닥이 아닌 칸'으로: 벽 덩어리 속으로 들어간 벽판은 빼고, 새 경계에 그 지도의 벽판을 세우고, 바닥 사각형을 다시 만든다. 새 지도 객체를 돌려준다.
function fillCells(L,cells){const S=new Set(L.floorCells.map(c=>K(c[0],c[1]))),has=(x,y)=>S.has(K(x,y));let n=0;for(const[x,y]of cells)if(S.delete(K(x,y)))n++;if(!n||!connected(S))return null;
 const need=new Set();for(const k of S){const[x,y]=k.split(':').map(Number);if(!has(x,y-1))need.add('h:'+x+':'+y);if(!has(x,y+1))need.add('h:'+x+':'+(y+1));if(!has(x-1,y))need.add('v:'+x+':'+y);if(!has(x+1,y))need.add('v:'+(x+1)+':'+y);}
 const edgesOf=s=>{const out=[];for(let i=s.a;i<s.b;i++)out.push(s.hz?'h:'+i+':'+s.fixed:'v:'+s.fixed+':'+i);return out;};
 const covered=new Set(),walls=[];let tpl=null,serial=0;
 const mk=(src,hz,fixed,a,b)=>{const len=b-a,t=Math.min(src.width,src.depth),o={...src,id:String(src.id)+':r838:'+(serial++),x:hz?a+len/2:fixed,y:hz?fixed:a+len/2,width:hz?len:t,depth:hz?t:len,passagesR838:true};
  if(src.endpoints)o.endpoints=hz?[[a,fixed],[b,fixed]]:[[fixed,a],[fixed,b]];if(src.analyticBounds12)o.analyticBounds12=hz?[a,fixed-t/2,b,fixed+t/2]:[fixed-t/2,a,fixed+t/2,b];return o;};
 for(const w of L.walls||[]){const s=seg(w);if(!s){walls.push(w);continue;}if(!tpl)tpl=w;const es=edgesOf(s),keep=es.map(e=>need.has(e)&&!covered.has(e));
  if(keep.every(Boolean)){walls.push(w);for(const e of es)covered.add(e);continue;}
  // 원래 지도에서 이미 필요 없던 변(다른 손질이 일부러 둔 벽판)은 건드리지 않는다: 이번에 메운 칸과 닿는 벽판만 다듬는다
  if(!es.some((e,i)=>!keep[i]&&touches(e))){walls.push(w);for(const e of es)covered.add(e);continue;}
  for(let i=0;i<es.length;){if(!keep[i]){i++;continue;}let j=i;while(j<es.length&&keep[j])j++;walls.push(mk(w,s.hz,s.fixed,s.a+i,s.a+j));for(let k=i;k<j;k++)covered.add(es[k]);i=j;}}
 function touches(e){const[ax,p,q]=e.split(':'),x=+p,y=+q,F=filled;return ax==='h'?F.has(K(x,y-1))||F.has(K(x,y)):F.has(K(x-1,y))||F.has(K(x,y));}
 if(!tpl)return null;
 const runs=new Map();for(const e of need){if(covered.has(e)||!touches(e))continue;const[ax,p,q]=e.split(':'),hz=ax==='h',fixed=hz?+q:+p,at=hz?+p:+q,k=ax+':'+fixed;if(!runs.has(k))runs.set(k,[]);runs.get(k).push(at);}
 for(const[k,list]of runs){const[ax,f]=k.split(':'),hz=ax==='h',fixed=+f;list.sort((a,b)=>a-b);for(let i=0;i<list.length;){const a=list[i];let b=a+1;i++;while(i<list.length&&list[i]===b){b++;i++;}walls.push(mk(tpl,hz,fixed,a,b));}}
 const [bx0,by0,bx1,by1]=L.bounds||[0,0,128,128],rects=[],open=new Map();for(let y=by0;y<=by1;y++){const next=new Map();let x=bx0;while(x<bx1){if(!has(x,y)){x++;continue;}const s0=x;while(x<bx1&&has(x,y))x++;const id=s0+':'+x,o=open.get(id);if(o&&o.y+o.depth===y){o.depth++;next.set(id,o);}else{const r={x:s0,y,width:x-s0,depth:1};rects.push(r);next.set(id,r);}}open.clear();for(const[k2,v]of next)open.set(k2,v);}
 const floorCells=[...S].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 return{...L,floorCells,floorRects:rects,walls};}
let filled=new Set();
// 바꾼 지도 → 원래 지도. 다른 손질이 바꾼 지도를 복사해 돌려주면(펼침 복사) 숨긴 속성이 떨어지므로 지역별 최근 원본도 함께 기억한다.
const byId=new Map();
function sourceOf(id,L){if(!L?.passagesR838)return null;if(L.r838Source)return L.r838Source;const s=byId.get(id);return s&&s.floorCells.length===L.passagesR838.before?s:null;}
const cache=new WeakMap();let qa=null;/* 검사용 덮어쓰기 {지역:{keepOpen:[…],style,block}} — 표에 없는 지역은 원래 지도 */try{const q=JSON.parse(localStorage.getItem(KEY+'.qa')||'null');if(q&&typeof q==='object')qa=q;}catch(_){}
function build(id,src,opt){const p=plan(id,src,opt);if(!p.cells.length)return null;filled=new Set(p.cells.map(c=>K(c[0],c[1])));let out=null;try{out=fillCells(src,p.cells);}finally{filled=new Set();}if(!out)return null;
 out.passagesR838={revision:REV,style:p.style,gaps:p.gaps,cells:p.cells.length,before:src.floorCells.length,after:out.floorCells.length};Object.defineProperty(out,'r838Source',{value:src});
 /* 다른 지도 손질과 같은 약속: 손질 전 원본을 r219Source·r204Source 로 이어 준다(없으면 지금 받은 지도가 원본). */
 if(src.r219Source)Object.defineProperty(out,'r219Source',{value:src.r219Source});if(src.r204Source||!src.r219Source)Object.defineProperty(out,'r204Source',{value:src.r204Source||src});byId.set(id,src);return out;}
function shape(id,L){try{if(!L?.r224Rooms?.length||!STYLE[id])return L;const src=sourceOf(id,L)||L;
 if(qa)return qa[id]?build(id,src,qa[id])||src:src;
 if(!prefs.on)return src;if(L.passagesR838)return L;if(cache.has(L))return cache.get(L);
 const out=build(id,L)||L;if(out!==L){stats.layouts++;stats.shaped+=out.passagesR838.gaps.filter(g=>g.fill).length;stats.blocked+=out.passagesR838.gaps.filter(g=>g.blocked).length;stats.cells+=out.passagesR838.cells;}
 cache.set(L,out);return out;}catch(e){fail(e);return L;}}
const solo=()=>(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off';
// 지도 손질 사슬의 맨 바깥에 선다. 스크립트 태그는 앞쪽(walls-solid-r830 뒤)에 두고, 뒤에 오는 손질(동굴·궁전·보스방·죄의 방)이 훅을 갈아 끼워도
// 늘 그 결과를 마지막에 다듬도록 훅 자리를 접근자로 바꾼다. 읽을 때마다 '그때의 안쪽 훅'을 감싼 함수를 주고, 안쪽에서 다시 불리면(뒤 손질이 previous 로 부를 때) 그대로 넘긴다.
const HOOK='__STORYWORLD_LAYOUT_HOOK_R204__';let inner=window[HOOK],depth=0;
const wrap=r=>function(id,L){if(depth)return r?.call(this,id,L);let out;depth++;try{out=r?.call(this,id,L)||L;}finally{depth--;}return solo()?shape(id,out):out;};
try{Object.defineProperty(window,HOOK,{configurable:true,enumerable:true,get(){return wrap(inner);},set(f){inner=f;}});}catch(e){fail(e);const previous=inner;window[HOOK]=function(id,L){const out=previous?.(id,L)||L;return solo()?shape(id,out):out;};}
// 예전 저장: 영웅이 이제 벽 덩어리가 된 문간 칸에 서 있으면 엔진 복원이 엉뚱한 곳으로 옮긴다 → 복원이 끝난 바로 뒤 가장 가까운 바닥 칸 한가운데에 세운다(R830 과 같은 방식). 저장 객체는 고치지 않는다.
function nudge(raw){try{const id=raw?.zone,P=raw?.player;if(!prefs.on||raw?.layer!=='STORY'||!STYLE[id]||!P||!Number.isFinite(P.x+P.y)||!solo())return null;
 let L=window.__STORYWORLD_EXPLORATION__?.layout?.(id,'STORY'),L0=sourceOf(id,L);
 /* 지도 보관함에 다듬기 전 지도가 남아 있을 수 있다(검사용 끔/켬을 오간 뒤) — 그럴 땐 여기서 다시 다듬어 비교한다. */if(!L0&&L&&!L.passagesR838){const S=shape(id,L);if(S&&S!==L&&S.passagesR838){L0=L;L=S;}}if(!L0)return null;
 const now=new Set(L.floorCells.map(c=>K(c[0],c[1]))),was=new Set(L0.floorCells.map(c=>K(c[0],c[1]))),cx=Math.floor(P.x),cy=Math.floor(P.y);
 const gone=(x,y)=>was.has(K(x,y))&&!now.has(K(x,y)),R=.3;let hit=false;for(const[dx,dy]of[[0,0],[R,0],[-R,0],[0,R],[0,-R]])if(gone(Math.floor(P.x+dx),Math.floor(P.y+dy)))hit=true;if(!hit)return null;
 let best=null;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy;if(!now.has(K(x,y))||![[1,0],[-1,0],[0,1],[0,-1]].every(([ax,ay])=>now.has(K(x+ax,y+ay))))continue;const d=Math.hypot(x+.5-P.x,y+.5-P.y);if(!best||d<best[0])best=[d,x+.5,y+.5];}
 return best?{zone:id,x:best[1],y:best[2]}:null;}catch(e){fail(e);return null;}}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const to=nudge(raw),out=await base.call(this,raw,...a);
 try{if(to&&out!==false&&typeof player!=='undefined'&&player&&typeof zone!=='undefined'&&zone===to.zone&&typeof room!=='undefined'&&room?.exploration?.passagesR838&&!blocked(to.x,to.y,.29,room)){player.x=to.x;player.y=to.y;cam={x:to.x,y:to.y};route=[];command=null;target=null;stats.nudged++;}}catch(e){fail(e);}return out;};}
function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PASSAGES_R838__=Object.freeze({revision:REV,STYLE,BLOCK,KEEP_OPEN,DETOUR,gaps,pattern,plan,fillCells:(L,cells)=>{filled=new Set(cells.map(c=>K(c[0],c[1])));try{return fillCells(L,cells);}finally{filled=new Set();}},shape,source:sourceOf,nudge,set,qa:o=>{qa=o||null;},inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,collisionChanged:true})});
})();
