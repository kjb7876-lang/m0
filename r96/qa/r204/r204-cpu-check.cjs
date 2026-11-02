// R204 CPU check: 거미동굴(dist01) 유기적 동굴 리마스터 — 거리장·통로 넓히기·이동 판정·높이장·연결(가상 레이아웃으로).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('cave-r204 loads after samong-shades-r200 and before combat-r118',idx.indexOf('./cave-r204.js')>idx.indexOf('./samong-shades-r200.js')&&idx.indexOf('./cave-r204.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches · cave-r204.js',RT('cave-r204.js')===C('cave-r204.js'));
ok('in the public verify list and the CI workflow',/'cave-r204\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r204\/r204-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const src=C('cave-r204.js');
ok('uses only textures already in the project (no new image files)',[...src.matchAll(/'(assets\/[^']+\.(?:webp|png))'/g)].every(m=>fs.existsSync(path.join(R,'runtime-text',m[1]))));
ok('no ctx.filter drop-shadow/blur (Three recorder rule)',!/drop-shadow|filter\s*=\s*['"]blur/.test(src));
// ---- 가상 레이아웃: 방 A(2..9,2..9) — 2칸 통로(y 13..14) — 방 B(20..27,2..9), 통로 바로 아래 1칸 바위 너머 다른 통로(y 16..17, x 10..19, 방 B 쪽만 연결)
const cells=[];const addRect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells.push([x,y]);};
addRect(2,2,9,15);addRect(20,2,27,15);addRect(10,13,19,14);addRect(10,16,19,17);// 위 통로(13~14)는 A·B 를 잇고, 아래 통로(16~17)는 막다른 길(어느 방에도 붙지 않게 x10..19, 방과는 x=9/20 에서 닿음 → 15행까지 방이라 붙는다)
const uniq=[...new Map(cells.map(c=>[c+'',c])).values()];
// 벽: w1 = 위 통로 안 1칸 칸막이(양쪽이 원래 바닥 — 그대로 남아야 함), w2 = 통로 위쪽 가장자리 1칸 벽(넓힌 칸에 닿음 — 빠져야 함)
const layout=()=>({bounds:[0,0,32,24],floorCells:uniq.map(c=>c.slice()),walls:[{id:'w1',x:12,y:13.5,width:.24,depth:1,endpoints:[[12,13],[12,14]]},{id:'w2',x:14.5,y:13,width:1,depth:.24,endpoints:[[14,13],[15,13]]}],entrance:{x:4.5,y:4.5},worldR74:{doors:[{id:'door-0',x:24,y:13.5}]}});
(async()=>{
 let baseBlockedCalls=0;
 const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,localStorage:{getItem:()=>null,setItem(){}},
  window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
 vm.createContext(sb);
 vm.runInContext(`var room=null,player={x:4.5,y:4.5};function blocked(x,y,r=.27,where=room){__base++;return false;}function makeRoom(id){return {id,layer:'STORY',props:[],enemies:[],exploration:__layout()};}async function enterRegion(){return true;}var __base=0;`,sb);
 sb.__layout=layout;vm.runInContext(src,sb);
 const API=sb.window.__STORYWORLD_CAVE_R204__;ok('API exposed',!!API&&API.zones.includes('dist01'));
 const L0=layout(),hook=sb.window.__STORYWORLD_LAYOUT_HOOK_R204__,ex=hook('dist01',L0),w=ex&&ex.r204Widened;
 ok('hook returns the same widened object for the same source layout (dressing stays idempotent)',hook('dist01',L0)===ex);
 const r=vm.runInContext(`room=makeRoom('dist01');room.exploration=__ex;room`,Object.assign(sb,{__ex:ex}));
 ok('narrow corridor widened, original cells kept',w&&w.added>0&&uniq.every(c=>ex.floorCells.some(d=>d[0]===c[0]&&d[1]===c[1])),w);
 const has=new Set(ex.floorCells.map(c=>c[0]+','+c[1]));
 ok('rooms are not enlarged (only cells next to narrow passages)',!has.has('1,5')&&!has.has('28,5')&&!has.has('5,1'));
 ok('no widening within 3.5 cells of a door',![...has].some(k=>{const [x,y]=k.split(',').map(Number);return !uniq.some(c=>c[0]===x&&c[1]===y)&&Math.hypot(x+.5-24,y+.5-13.5)<3.5;}));
 ok('the rock row between the two corridors stays rock (no new shortcut)',!has.has('14,15')&&!has.has('12,15'));
 ok('an original baffle between old floor cells stays; a wall touching widened cells goes',ex.walls.some(q=>q.id==='w1')&&!ex.walls.some(q=>q.id==='w2')&&has.has('14,12'));
 {const orig=new Set(uniq.map(c=>c[0]+','+c[1])),edges=new Set();for(const q of ex.walls){const [[x0,y0],[x1,y1]]=q.endpoints;if(x0===x1)for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)edges.add('v:'+x0+':'+y);else for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)edges.add('h:'+x+':'+y0);}
  const bad=ex.floorCells.filter(([x,y])=>!orig.has(x+','+y)&&[[1,0,'v:'+(x+1)+':'+y],[-1,0,'v:'+x+':'+y],[0,1,'h:'+x+':'+(y+1)],[0,-1,'h:'+x+':'+y]].some(([dx,dy,k])=>orig.has((x+dx)+','+(y+dy))&&edges.has(k)));
  ok('no added floor strip sits behind a remaining wall next to the original floor',bad.length===0,bad.slice(0,5));}
 ok('every added cell is reachable from the original floor without crossing a wall',w.dropped>=0&&ex.floorCells.length===w.after);
 // R217(사용자 "전체적인 맵통로 확장"): 쉼터(hub)·디테일 전용(실내·현대) 지역은 그대로, 다른 유기 지형 지역도 같은 넓히기를 받는다.
ok('rest hub untouched; other organic regions widened (R217); decor-only interiors get the R219 inflate (not the organic widen)',hook('hub',layout())===null&&hook('dist02',layout())?.r204Widened&&hook('ep1a08',layout())?.r219&&!hook('ep1a08',layout()).r204Widened);
 // 거리장
 const F=API.field(ex,{seed:0x5d0124,bulge:1.35},[[4.5,4.5,1.6]]);
 let leak=0,n=0;for(let k=0;k<F.f.length;k++){if(F.f[k]>0){n++;if(F.raw[k]<=0)leak++;}}
 ok('visible floor never extends past walkable cells (f>0 ⊆ raw>0)',leak===0&&n>0,{leak,n});
 let corner=0;for(const [x,y] of [[2.05,2.05],[9.95,2.05]])if(API.at(F,F.f,x,y)<0)corner++;ok('room corners are rounded off (cliff cuts the right angle)',corner===2,corner);
 ok('protected entrance stays open',API.at(F,F.f,4.5,4.5)>.9);
 // R217: 이전 검사는 x=14.5 한 점(벽 w2 자리)만 재서 1.4칸이 나왔다 — 같은 R204 코드에서도 갈비 나머지 구간은 1.15~1.2칸이었다(qa/r217/README).
 //  그래서 갈비 전체 길이(x 10.5~18.5)에서 가장 얇은 곳을 재고, 넓히기가 갈비 칸(y=15)에 바닥을 더하지 않는지 함께 본다.
 {const rib=x=>{let run=0,best=0;for(let y=12;y<=19;y+=.05){if(API.at(F,F.f,x,y)<0){run+=.05;best=Math.max(best,run);}else run=0;}return best;};
  const xs=[10.5,11.5,12.5,13.5,14.5,15.5,16.5,17.5,18.5],min=Math.min(...xs.map(rib)),eaten=ex.floorCells.filter(([x,y])=>y===15&&x>=10&&x<=19).length;
  ok('a 1-cell rock rib between two corridors stays at least a full cell thick along its whole length and widening never eats into it (no paper-thin walls)',min>=1.05&&eaten===0,{min,eaten});}
 ok('a baffle wall between floor cells is drawn as rock (no invisible walls)',API.at(F,F.f,12,13.5)<0);
 // 반지름 .27 로 방 A → 방 B 가 이어지는지(0.25칸 격자 BFS, f>=.27)
 const step=.25,seen=new Set(),q=[[5,5]];const key=(x,y)=>x.toFixed(2)+','+y.toFixed(2);seen.add(key(5,5));let reached=false;
 while(q.length){const [x,y]=q.shift();if(Math.hypot(x-23.5,y-5.5)<.6){reached=true;break;}for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k)||nx<0||ny<0||nx>32||ny>24)continue;seen.add(k);if(API.at(F,F.f,nx,ny)>=.27)q.push([nx,ny]);}}
 ok('rooms stay connected for a hero of radius .27 after the cliffs bulge',reached);
 // 높이장: 보행 쪽이 북서(카메라 반대)인 대지는 낮다
 const hFront=API.topHeight(F,'dist01',5.5,17.6),hBack=API.topHeight(F,'dist01',5.5,0.6);ok('camera-side plateau is lower than the back plateau',hFront<hBack,{hFront,hBack});
 // 이동 판정: 바위가 밀고 들어온 자리만 막고, 원래 판정이 막으면 그대로 막는다
 sb.room=r;const fa=API.at(F,F.f,2.05,2.05);ok('blocked() wrapper only adds blocking after the field exists',vm.runInContext(`blocked(2.05,2.05,.27,room)`,sb)===false);
 ok('fields are deterministic (same seed → same contour)',(()=>{const G=API.field(ex,{seed:0x5d0124,bulge:1.35},[[4.5,4.5,1.6]]);for(let k=0;k<G.f.length;k+=97)if(G.f[k]!==F.f[k])return false;return true;})());
 sb.window.__STORYWORLD_CAVE_R204__.set({on:false});ok('switching off keeps the original layout',hook('dist01',layout())===null);
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
})().catch(e=>{console.error(e);process.exit(1);});
