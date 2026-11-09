// R482 CPU 검사: 밟아 다져진 길(입구 → 문·제단). 바닥 칸만 지나는지, 넓은 곳에서 가운데로 가는지, 부드러운지, 띠 가장자리가 흐린지,
//  결정적인지, 목표 상한·지역 제한·끄기, 게임 데이터 쓰기 없음을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='trail-r482.js';let src='';try{src=C(F);}catch(e){}
ok('source exists',!!src);try{ok('runtime copy matches source',src===RT(F));}catch(e){ok('runtime copy matches source',false);}
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after grove-r481 (after cave-r204)',html.split('"./'+F+'"').length===2&&/<script src="\.\/cave-r204\.js"><\/script>\s*<script src="\.\/grove-r481\.js"><\/script>\s*<script src="\.\/trail-r482\.js"><\/script>/.test(html));
ok('listed in verify-r96-public.py',/'trail-r482\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r482/trail-r482-cpu-check.cjs'));
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok('no gameplay writes',!!src&&!/floorCells\s*=|walls\s*=|\.hp\s*=[^=]|saveGame|exploration\s*=|route\s*=/.test(code));
ok('no drop-shadow/blur filter',!/drop-shadow|blur\(/.test(code));
function load(o={}){const g={console,Math,JSON,Object,Array,Set,Map,Number,String,Error,Infinity,performance:{now:()=>0},
 localStorage:{getItem:k=>k==='storyworld.r482.trail'&&o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setInterval(){},settings:{}};g.window=g;vm.createContext(g);vm.runInContext(src||'',g);return g;}
const API=load().__STORYWORLD_TRAIL_R482__;ok('API exported',!!API&&typeof API.plan==='function'&&typeof API.ribbon==='function');
// 바닥: 넓은 방 (0..19)×(0..9) + 좁은 복도 (20..29)×(4..5) + 방2 (30..39)×(0..9). 벽까지 거리 = 칸 경계까지.
const cells=new Set();const add=(x0,x1,y0,y1)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)cells.add(x+','+y);};add(0,19,0,9);add(20,29,4,5);add(30,39,0,9);
const on=(x,y)=>cells.has(Math.floor(x)+','+Math.floor(y));
const clear=(x,y)=>{if(!on(x,y))return -1;let d=0;for(;d<12;d++){const r=d+.5;if(!on(x+r,y)||!on(x-r,y)||!on(x,y+r)||!on(x,y-r))break;}return d+.5;};
const start={x:1.5,y:1.5},goals=[{x:38.5,y:8.5},{x:10.5,y:9.2}];
const P=API?API.plan({cells,clear,start,goals}):[];
ok('one path per reachable goal',P.length===2);
ok('paths start at entry and end at goal',P.length===2&&Math.hypot(P[0][0].x-1.5,P[0][0].y-1.5)<.01&&Math.hypot(P[0].at(-1).x-38.5,P[0].at(-1).y-8.5)<.01);
ok('every point stays on floor cells (incl. through the narrow corridor)',P.length>0&&P.every(p=>p.every(q=>on(q.x,q.y))));
ok('passes the corridor (some point with 20<x<30)',P[0]&&P[0].some(q=>q.x>20&&q.x<30));
const mid=P[0]?P[0].filter(q=>q.x>4&&q.x<16):[];ok('prefers room centre over hugging the wall (mean distance to wall ≥ 2)',mid.length>0&&mid.reduce((a,q)=>a+clear(q.x,q.y),0)/mid.length>=2);
ok('smooth: no turn sharper than 60° between successive .5 steps',P.length>0&&P.every(p=>{for(let i=2;i<p.length;i++){const a=p[i-2],b=p[i-1],c=p[i];const u=[b.x-a.x,b.y-a.y],v=[c.x-b.x,c.y-b.y],L=Math.hypot(...u)*Math.hypot(...v);if(L>1e-6&&(u[0]*v[0]+u[1]*v[1])/L<Math.cos(Math.PI/3))return false;}return true;}));
ok('deterministic',JSON.stringify(P)===JSON.stringify(API.plan({cells,clear,start,goals})));
ok('unreachable / off-floor goal → no path, no crash',API&&API.plan({cells,clear,start,goals:[{x:25.5,y:0.5}]}).length===0);
ok('goal too close to entry skipped',API&&API.plan({cells,clear,start,goals:[{x:2.5,y:2.5}]}).length===0);
ok('at most 6 goals',API&&API.plan({cells,clear,start,goals:Array.from({length:10},(_,i)=>({x:5.5+i,y:8.5}))}).length<=6);
const Rb=API?API.ribbon(P,7):{alpha:[],pos:[],idx:[]};
ok('ribbon: 3 vertices across, edges fully transparent, centre opaque-ish',Rb.alpha.length===Rb.pos.length/3&&Rb.alpha.every((a,i)=>i%3===1?a>=0:a===0)&&Math.max(...Rb.alpha)>=.7);
ok('ribbon ends fade in/out (first & last centre alpha 0)',P.length>0&&Rb.alpha[1]===0);
ok('ribbon flat on ground (y=0)',Rb.pos.length>0&&Rb.pos.every((v,i)=>i%3!==1||v===0));
ok('valid triangle indices',Rb.idx.length>0&&Rb.idx.length%3===0&&Rb.idx.every(i=>i>=0&&i<Rb.pos.length/3));
ok('zones: outdoor only, Mammon & cave & indoor excluded',API&&API.zoneOk('dist00')&&API.zoneOk('hub')&&!API.zoneOk('ep1b06')&&!API.zoneOk('dist01')&&!API.zoneOk('ep1a08')&&!API.zoneOk(undefined));
ok('pref off disables',load({prefs:{on:false}}).__STORYWORLD_TRAIL_R482__?.enabled()===false&&API?.enabled()===true);
// Codex #358: 바닥 칸 사이에 벽이 서 있는 지도(cave-r204 가 벽을 장에 그려 넣음)에서는 벽을 지나는 길을 내면 안 된다 — 벽 틈으로 돌아가야 한다
{const cellsW=new Set();for(let y=0;y<10;y++)for(let x=0;x<20;x++)cellsW.add(x+','+y);
 const clearW=(x,y)=>{const inWall=y<8;const dx=Math.abs(x-10.5)-.5;const dw=inWall?dx:Math.hypot(Math.max(dx,0),y-8);const de=Math.min(x,20-x,y,10-y);return Math.min(de,dw);};
 const pw=API?API.findTrail(cellsW,clearW,{x:3.5,y:2.5},{x:17.5,y:2.5}):[];
 const segOk=pw.length>1&&pw.every((q,i)=>{if(clearW(q.x,q.y)<=0)return false;if(!i)return true;const a=pw[i-1];for(let t=.25;t<1;t+=.25)if(clearW(a.x+(q.x-a.x)*t,a.y+(q.y-a.y)*t)<=0)return false;return true;});
 ok('trail never crosses a wall between floor cells (goes round through the gap)',segOk&&pw.some(q=>q.y>=8));}
const W2=P[0]?P[0].filter(q=>q.x>4&&q.x<16):[];ok('meanders in the open room (not a ruler-straight line: lateral spread ≥ .5)',W2.length>4&&(Math.max(...W2.map(q=>q.y))-Math.min(...W2.map(q=>q.y)))>=.5);
console.log(`\nR482 trail: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
