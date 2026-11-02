// R219 CPU check: 실내(디테일 전용) 지역 넓히기 — 바닥을 둘레로 넓히되 길로 먼 곳 사이 이음매 벽·문 둘레·외벽 1칸을 지키고,
//  벽·바닥 사각형을 새 경계로 다시 만들며, R171 layoutFor 가 같은 손질을 입혀 엔진 바닥·벽 덩어리와 판정이 같은 지도를 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('cave-r204.js'),sm=C('story-maps-r171.js');
ok('runtime copies match',RT('cave-r204.js')===src&&RT('story-maps-r171.js')===sm);
ok('in the CI workflow',/qa\/r219\/r219-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('R171 layoutFor applies the R204/R219 hook once, so engine chunks (loadDescriptor reads this layout) and collision share one map',/const H=window\.__STORYWORLD_LAYOUT_HOOK_R204__\?\.\(id,L\);if\(H\)L=H;/.test(sm));
ok('hook is idempotent (already widened/inflated layouts are left alone) and can be switched off',/L\.r204Widened\|\|L\.r219\)return null/.test(src)&&/if\(!prefs\.inflate\)return null/.test(src)&&/inflate:true/.test(src));
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);vm.runInContext('var room=null,player={x:0,y:0};function blocked(){return false;}function makeRoom(id){return {id,layer:"STORY",props:[],enemies:[]};}async function enterRegion(){return true;}',sb);vm.runInContext(src,sb);
const API=sb.window.__STORYWORLD_CAVE_R204__,hook=sb.window.__STORYWORLD_LAYOUT_HOOK_R204__;
// 가상 지도 40×30: 방 A(3..12,3..10) — 복도(13..26, y 6..7) — 방 B(27..36,3..10). 방 B 아래 앞방(27..30, y 11..14)은 가로 문(door-1, y=11)으로만 이어지고,
//  복도 아래 3칸 바위 너머 다른 복도(13..26, y 11..12)는 그 앞방에만 붙는다 → 문이 닫혀 있으면 입구에서 못 간다.
const cells=[];const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells.push([x,y]);};
rect(3,3,12,10);rect(27,3,36,10);rect(13,6,26,7);rect(13,11,26,12);rect(27,11,30,14);
const uniq=[...new Map(cells.map(c=>[c+'',c])).values()];
const L0={bounds:[0,0,40,30],floorCells:uniq,walls:[{id:'t',x:0,y:0,width:1,depth:.24,height:2.85,endpoints:[[3,3],[13,3]],storyMapR171:true}],entry:{x:5.5,y:5.5},
 worldR74:{doors:[{id:'door-1',x:29,y:11,width:4,depth:.24}]}};
const out=API.inflate(L0,{depth:3}),F=new Set(out.floorCells.map(c=>c[0]+','+c[1])),O=new Set(uniq.map(c=>c[0]+','+c[1]));
ok('floor grows (more walkable space) and keeps every original cell',out.floorCells.length>uniq.length*1.3&&[...O].every(k=>F.has(k)),{before:uniq.length,after:out.floorCells.length});
ok('the map edge stays a 1-cell outer wall',[...F].every(k=>{const [x,y]=k.split(',').map(Number);return x>=1&&y>=1&&x<=38&&y<=28;}));
// 문 닫힘 BFS: 원래 지도에서 입구로부터 못 가던 원래 칸은 넓힌 뒤에도 못 간다
const cut=(x,y,dx,dy)=>!dx&&x>=27&&x<=30&&(dy===1&&y===10||dy===-1&&y===11);
const reach=S=>{const seen=new Set(['5,5']),q=[[5,5]];for(let h=0;h<q.length;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(S.has(k)&&!seen.has(k)&&!cut(x,y,dx,dy)){seen.add(k);q.push([x+dx,y+dy]);}}}return seen;};
const a=reach(O),b=reach(F),leak=[...O].filter(k=>!a.has(k)&&b.has(k));
ok('fixture: with the door closed the lower corridor is unreachable before inflating',!a.has('20,11')&&a.has('20,6'));
ok('a closed door is never bypassed through new floor (cells unreachable before stay unreachable)',leak.length===0,leak.slice(0,5));
ok('two corridors that are far apart by path keep a wall seam between them (away from where they really meet near room B)',(()=>{for(let x=14;x<=24;x++){if(F.has(x+',8')&&F.has(x+',9')&&F.has(x+',10'))return false;}return true;})());
// 벽: 새 바닥 경계의 모든 변이 벽으로 덮인다
let missing=0;const covered=(k,x,y)=>out.walls.some(w=>{const [[x0,y0],[x1,y1]]=w.endpoints;return k==='h'?(y0===y&&y1===y&&x>=Math.min(x0,x1)&&x<Math.max(x0,x1)):(x0===x&&x1===x&&y>=Math.min(y0,y1)&&y<Math.max(y0,y1));});
for(const k of F){const [x,y]=k.split(',').map(Number);if(!F.has(x+','+(y-1))&&!covered('h',x,y))missing++;if(!F.has(x+','+(y+1))&&!covered('h',x,y+1))missing++;if(!F.has((x-1)+','+y)&&!covered('v',x,y))missing++;if(!F.has((x+1)+','+y)&&!covered('v',x+1,y))missing++;}
ok('every edge between new floor and solid is covered by a regenerated wall (copied wall fields, AABB set)',missing===0&&out.walls.every(w=>Array.isArray(w.analyticBounds12)&&w.height>=2.8),{missing});
// floorRects 가 새 바닥과 정확히 같다
const RS=new Set();for(const r of out.floorRects)for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)RS.add(x+','+y);
ok('floorRects cover exactly the new floor (engine floor chunks draw the same map)',RS.size===F.size&&[...F].every(k=>RS.has(k)));
ok('the original layout stays reachable as r219Source (not enumerable)',out.r219Source===L0&&!Object.keys(out).includes('r219Source'));
// 훅: 실내는 R219, 같은 원본에는 같은 결과, 이미 손질된 것은 그대로
const L1={...L0,floorCells:uniq.map(c=>c.slice())},h1=hook('murder03',L1);
ok('hook: interior zone gets the inflate, same object for the same source, and an inflated layout is not inflated again',!!h1?.r219&&hook('murder03',L1)===h1&&hook('murder03',h1)===null);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
