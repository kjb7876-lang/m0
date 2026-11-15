// R1047 실패 먼저: R225(못 닿는 적 → 닿는 자리로)가 레이아웃 bounds 를 [x,y,너비,높이]로 읽어
//  bounds 가 [minX,minY,maxX,maxY] 이고 min 이 음수인 지역(사몽 층 cult04: [-28,-28,81,81])에서 입구 쪽 66칸만 '닿는다'고 보고,
//  영웅 곁의 히든 페르소나(보스)를 영웅이 못 가는 주머니(48.5,46.5)로 계속 옮겨 결투가 시작되지 않던 것(헤드리스 재현).
// 검사: ① min 음수 bounds 에서 영웅 곁 보스는 옮기지 않는다 ② 벽으로 막힌 상자 안 적은 여전히 닿는 칸으로 옮긴다(R225 원래 동작)
//       ③ min 0 bounds(대부분 지역)에서는 예전과 같다 ④ 옮긴 자리는 bounds 밖이 아니다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'../../client-source/reach-r225.js'),'utf8');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
function world({bounds,wall,enemies,player,entry}){
 const [x0,y0,x1,y1]=bounds;const inB=(x,y)=>x>=x0&&y>=y0&&x<x1&&y<y1;
 const isWall=(cx,cy)=>!inB(cx,cy)||wall(cx,cy);
 const floorCells=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(!isWall(x,y))floorCells.push([x,y]);
 const L={bounds,floorCells,entry,worldR74:null};
 const room={id:'t',exploration:L,enemies};
 const ctx={room,player,loading:false,started:true,time:100,Date,Math,Number,Set,Map,WeakMap,JSON,String,localStorage:{getItem:()=>null,setItem(){}},
  blocked:(x,y)=>isWall(Math.floor(x),Math.floor(y))};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(SRC,ctx);return {api:ctx.__STORYWORLD_REACH_R225__,room,inB};}
const E=(x,y,name='보스')=>({x,y,homeX:x,homeY:y,hp:100,spawnState:'active',name,nav:[]});
// ① 사몽 층 cult04 모양: bounds [-28,-28,81,81], y=45 가로벽이 x<55 를 막아 입구(50,50) → 영웅(15,19)은 x≥55 로 돌아가야 이어진다.
{const boss=E(19.5,17.5,'페르소나 · 순수악의');const w=world({bounds:[-28,-28,81,81],wall:(x,y)=>y===45&&x<55,enemies:[boss],player:{x:15.5,y:19.5},entry:{x:50.5,y:50.5}});
 w.api.check();ok(boss.x===19.5&&boss.y===17.5,'① min 음수 bounds: 영웅 곁 보스를 옮기지 않음 (지금 '+boss.x+','+boss.y+')');
 const R=w.api.reachOf(w.room.exploration,true);ok(R&&R.seen.has('15,19')&&R.seen.has('70,70'),'① 입구에서 닿는 칸이 bounds 끝(maxX·maxY)까지 이어짐 (크기 '+(R&&R.size)+')');}
// ② 막힌 상자 안 적(R225 원래 목적)은 여전히 옮긴다
{const lone=E(30.5,10.5,'상자 안 적');const box=(x,y)=>(x>=28&&x<=33&&(y===8||y===13))||(y>=8&&y<=13&&(x===28||x===33));
 const w=world({bounds:[-28,-28,81,81],wall:box,enemies:[lone],player:{x:15.5,y:19.5},entry:{x:50.5,y:50.5}});w.api.check();
 ok(!(lone.x===30.5&&lone.y===10.5),'② 막힌 상자 안 적은 닿는 칸으로 옮김 (→ '+lone.x+','+lone.y+')');ok(w.inB(Math.floor(lone.x),Math.floor(lone.y))&&!box(Math.floor(lone.x),Math.floor(lone.y)),'② 옮긴 자리는 bounds 안 바닥');}
// ③ min 0 bounds(대부분 지역): 예전과 같음 — 닿는 적 그대로, 상자 안 적은 옮김
{const a=E(10.5,10.5,'닿는 적'),b=E(41.5,41.5,'상자 안');const box=(x,y)=>(x>=39&&x<=44&&(y===39||y===44))||(y>=39&&y<=44&&(x===39||x===44));
 const w=world({bounds:[0,0,60,60],wall:box,enemies:[a,b],player:{x:5.5,y:5.5},entry:{x:2.5,y:2.5}});w.api.check();
 ok(a.x===10.5&&a.y===10.5,'③ min 0 bounds: 닿는 적 그대로');ok(!(b.x===41.5&&b.y===41.5),'③ min 0 bounds: 상자 안 적은 옮김');}
// ④ 경계값: bounds 마지막 칸(maxX-1)은 닿고, maxX 칸은 넘지 않는다
{const edge=E(80.5,80.5,'끝 칸 적');const w=world({bounds:[-28,-28,81,81],wall:()=>false,enemies:[edge],player:{x:0.5,y:0.5},entry:{x:50.5,y:50.5}});
 const R=w.api.reachOf(w.room.exploration,true);ok(R.seen.has('80,80')&&!R.seen.has('81,80'),'④ 끝 칸 80 포함·81 제외');w.api.check();ok(edge.x===80.5,'④ 끝 칸 적은 옮기지 않음');}
console.log(fails?'R1047 reach-bounds FAILED '+fails:'R1047 reach-bounds PASSED');process.exit(fails?1:0);
