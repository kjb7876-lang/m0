// R1180 CPU 검사: 바닥 가장자리 가림판(edges-r188 buildMask)의 벽 흐림을 벽마다 따로 하지 않는다.
//  원인(헤드리스 실측, 스토리 64지역): 흐림 필터를 켠 채 벽 사각형을 하나씩 fillRect 하면 그리기마다 흐림을 따로 계산한다.
//  ep1b04(벽 562개)에서 벽 판 되읽기 한 번이 약 0.7초, 64지역 합 약 16.9초. 지역에 처음 들어갈 때마다 이만큼 멈췄다.
//  고친 뒤: 벽을 흐림 없는 판 하나에 모아 그린 뒤, 그 판을 흐림 필터로 한 번만 그린다(흐림 반지름·판 크기·나머지 계산 그대로).
// 사용: node r96/qa/r1180/edge-wall-blur-cpu-check.cjs
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=fs.readFileSync(path.join(__dirname,'../../client-source/edges-r188.js'),'utf8');
let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));assert.ok(c,m);n++;console.log('PASS',m);};
function run(L){const log=[],canvases=[];
 const document={createElement(){const c={id:canvases.length,width:0,height:0};canvases.push(c);
  c.getContext=(t,o)=>{if(c.ctx)return c.ctx;let filter='none';const cx={canvas:c,opts:o||null,fillStyle:'#000',
   get filter(){return filter;},set filter(v){filter=v;},
   fillRect(x,y,w,h){log.push({c:c.id,op:'fillRect',filter,fill:cx.fillStyle,r:[x,y,w,h]});},
   drawImage(src,x,y){log.push({c:c.id,op:'drawImage',filter,src:src.id});},
   beginPath(){log.push({c:c.id,op:'beginPath',filter});},rect(x,y,w,h){log.push({c:c.id,op:'rect',filter,r:[x,y,w,h]});},fill(){log.push({c:c.id,op:'fill',filter,fill:cx.fillStyle});},
   getImageData(x,y,w,h){log.push({c:c.id,op:'get',filter});return{data:new Uint8ClampedArray(w*h*4)};},
   createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};c.ctx=cx;return cx;};return c;}};
 const sb={window:{},performance:{now:()=>0},document,Math,JSON,Object,Array,Map,Set,WeakSet,WeakMap,String,Number,Uint8ClampedArray,Error,console,localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0};
 vm.createContext(sb);vm.runInContext(SRC,sb,{filename:'edges-r188.js'});
 sb.window.__STORYWORLD_EDGES_R188__.buildMask(L);return {log,canvases};}
const wall=(x,y,w,d)=>({x,y,width:w,depth:d});
const walls=[];for(let i=0;i<120;i++)walls.push(wall(2+(i%30),2+Math.floor(i/30)*5,1,1));walls.push(wall(10,10,.4,.3),null,wall(3,3,0,2));
const L={bounds:[0,0,40,30],floorRects:[{x:2,y:2,width:30,depth:20}],backdropRects:[],connectorFloorRects:[],walls};
const {log,canvases}=run(L);
// 벽 판 = 흐림 반지름 PX*.9 = 3.6px 필터를 쓰는 문맥
const blurW=log.filter(e=>e.filter==='blur(3.6px)'),blurS=log.filter(e=>e.filter==='blur(8.8px)');
const wallDraws=blurW.filter(e=>e.op==='fillRect'||e.op==='drawImage'||e.op==='fill');
ok(wallDraws.length===1,'벽 흐림 필터를 켠 채 그리는 것은 한 번뿐 (지금 '+wallDraws.length+'번, 벽 122개)',wallDraws.length);
ok(blurS.filter(e=>e.op!=='get').length===1,'바닥 흐림(8.8px)도 그대로 한 번');
// 벽 사각형 모양·크기는 그대로(흐림 없이 모아 그린 판에 1.6칸 최소 크기 그대로)
const valid=walls.filter(w=>w&&w.width>0&&w.depth>0);
const PX=4,PAD=4,x0=-PAD,y0=-PAD;
const want=valid.map(w=>{const ww=Math.max(w.width,1.6),dd=Math.max(w.depth,1.6);return [(w.x-ww/2-x0)*PX,(w.y-dd/2-y0)*PX,ww*PX,dd*PX].join(',');}).sort();
const got=log.filter(e=>(e.op==='fillRect'||e.op==='rect')&&e.filter==='none'&&e.c!==0&&String(e.fill).toLowerCase()==='#fff').map(e=>e.r.join(',')).sort();
ok(JSON.stringify(got)===JSON.stringify(want),'흐림 없이 모은 벽 사각형이 원래 벽 사각형과 같음('+want.length+'개)',{got:got.length,want:want.length});
// 모은 판을 흐림 판에 그대로 한 장 그림
const d=wallDraws[0];ok(d&&d.op==='drawImage','모은 벽 판을 흐림 필터로 한 번 drawImage');
const stage=d&&canvases[d.src];ok(stage&&stage.ctx&&stage.ctx.opts&&stage.ctx.opts.willReadFrequently===true,'모은 판도 CPU 캔버스(willReadFrequently) — GPU 되읽기 없음');
ok(stage&&stage.width===canvases[0].width&&stage.height===canvases[0].height,'모은 판 크기 = 가림판 크기');
// 흐림 판의 검은 바탕은 흐림 없이 칠함(원래와 같음)
const wctx=canvases.find(c=>c.ctx&&log.some(e=>e.c===c.id&&e.filter==='blur(3.6px)'));
ok(log.some(e=>e.c===wctx.id&&e.op==='fillRect'&&e.filter==='none'&&e.fill==='#000'),'벽 판 검은 바탕은 흐림 없이');
ok(log.filter(e=>e.op==='get').length===3,'픽셀 되읽기는 그대로 3번(바닥·흐린 바닥·벽)');
// 경계: 벽이 없으면 모은 판을 만들지 않는다(캔버스 수 원래대로: 바닥·흐린 바닥·벽·결과 = 4)
{const r=run({...L,walls:[]});ok(r.canvases.length===4,'벽 0개면 캔버스 4장 그대로 ('+r.canvases.length+')');
 ok(!r.log.some(e=>e.filter==='blur(3.6px)'&&e.op!=='get'),'벽 0개면 흐림 그리기 없음');}
{const r=run({...L,walls:[null,wall(1,1,0,1)]});ok(r.canvases.length===4,'유효한 벽이 없으면(빈 값·폭 0) 모은 판 없음');}
// 회귀: 판이 너무 크면 그대로 null
{const r=run({...L,bounds:[0,0,900,900]});ok(r.canvases.length===0,'너무 큰 판은 그대로 만들지 않음');}
console.log('R1180 edge wall blur CPU check: '+n+' passed');
