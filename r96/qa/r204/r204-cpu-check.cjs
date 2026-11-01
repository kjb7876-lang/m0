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
const layout=()=>({bounds:[0,0,32,24],floorCells:uniq.map(c=>c.slice()),walls:[{id:'w1',x:12,y:13.5,width:.24,depth:1,endpoints:[[12,13],[12,14]]}],entrance:{x:4.5,y:4.5}});
(async()=>{
 let baseBlockedCalls=0;
 const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,localStorage:{getItem:()=>null,setItem(){}},
  window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}},__STORYWORLD_WORLD_R74__:{doors:[{x:24,y:13.5}]}}};
 vm.createContext(sb);
 vm.runInContext(`var room=null,player={x:4.5,y:4.5};function blocked(x,y,r=.27,where=room){__base++;return false;}function makeRoom(id){return {id,layer:'STORY',props:[],enemies:[],exploration:__layout()};}async function enterRegion(){return true;}var __base=0;`,sb);
 sb.__layout=layout;vm.runInContext(src,sb);
 const API=sb.window.__STORYWORLD_CAVE_R204__;ok('API exposed',!!API&&API.zones.includes('dist01'));
 const r=vm.runInContext(`room=makeRoom('dist01');room`,sb);const ex=r.exploration,w=ex.r204Widened;
 ok('narrow corridor widened, original cells kept',w&&w.added>0&&uniq.every(c=>ex.floorCells.some(d=>d[0]===c[0]&&d[1]===c[1])),w);
 const has=new Set(ex.floorCells.map(c=>c[0]+','+c[1]));
 ok('rooms are not enlarged (only cells next to narrow passages)',!has.has('1,5')&&!has.has('28,5')&&!has.has('5,1'));
 ok('no widening within 3.5 cells of a door',![...has].some(k=>{const [x,y]=k.split(',').map(Number);return !uniq.some(c=>c[0]===x&&c[1]===y)&&Math.hypot(x+.5-24,y+.5-13.5)<3.5;}));
 ok('the rock row between the two corridors stays rock (no new shortcut)',!has.has('14,15')&&!has.has('12,15'));
 ok('a wall with floor on both sides is removed, layout object replaced',ex!==layout()&&!ex.walls.some(q=>q.id==='w1')===has.has('11,13')&&has.has('12,13'));
 const r2=vm.runInContext(`makeRoom('dist02')`,sb);ok('other regions untouched',!r2.exploration.r204Widened);
 // 거리장
 const F=API.field(ex,{seed:0x5d0124,bulge:1.6},[[4.5,4.5,1.6]]);
 let leak=0,n=0;for(let k=0;k<F.f.length;k++){if(F.f[k]>0){n++;if(F.raw[k]<=0)leak++;}}
 ok('visible floor never extends past walkable cells (f>0 ⊆ raw>0)',leak===0&&n>0,{leak,n});
 let corner=0;for(const [x,y] of [[2.05,2.05],[9.95,2.05]])if(API.at(F,F.f,x,y)<0)corner++;ok('room corners are rounded off (cliff cuts the right angle)',corner===2,corner);
 ok('protected entrance stays open',API.at(F,F.f,4.5,4.5)>.9);
 // 반지름 .27 로 방 A → 방 B 가 이어지는지(0.25칸 격자 BFS, f>=.27)
 const step=.25,seen=new Set(),q=[[5,5]];const key=(x,y)=>x.toFixed(2)+','+y.toFixed(2);seen.add(key(5,5));let reached=false;
 while(q.length){const [x,y]=q.shift();if(Math.hypot(x-23.5,y-5.5)<.6){reached=true;break;}for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k)||nx<0||ny<0||nx>32||ny>24)continue;seen.add(k);if(API.at(F,F.f,nx,ny)>=.27)q.push([nx,ny]);}}
 ok('rooms stay connected for a hero of radius .27 after the cliffs bulge',reached);
 // 높이장: 보행 쪽이 북서(카메라 반대)인 대지는 낮다
 const hFront=API.topHeight(F,'dist01',5.5,17.6),hBack=API.topHeight(F,'dist01',5.5,0.6);ok('camera-side plateau is lower than the back plateau',hFront<hBack,{hFront,hBack});
 // 이동 판정: 바위가 밀고 들어온 자리만 막고, 원래 판정이 막으면 그대로 막는다
 sb.room=r;const fa=API.at(F,F.f,2.05,2.05);ok('blocked() wrapper only adds blocking after the field exists',vm.runInContext(`blocked(2.05,2.05,.27,room)`,sb)===false);
 ok('fields are deterministic (same seed → same contour)',(()=>{const G=API.field(ex,{seed:0x5d0124,bulge:1.6},[[4.5,4.5,1.6]]);for(let k=0;k<G.f.length;k+=97)if(G.f[k]!==F.f[k])return false;return true;})());
 sb.window.__STORYWORLD_CAVE_R204__.set({on:false});const r3=vm.runInContext(`makeRoom('dist01')`,sb);ok('switching off keeps the original layout',!r3.exploration.r204Widened);
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
})().catch(e=>{console.error(e);process.exit(1);});
