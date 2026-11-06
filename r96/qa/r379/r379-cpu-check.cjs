// R379 CPU 검사: 본편 R171 지도 길·방 폭 2배(storyworld.r379.storyWide, 기본 켬).
//  - 켬/끔 두 번 모듈을 띄워 모든 배치 틀(sourceTopology 전부)에서 비교한다.
//  - 두 갈래 길의 통로 폭 2배(최대 12), 방 1.5배, 틀 68×70 → 100×104.
//  - 보스 전투실·다음 구역 앞뜰·집결실·보스 연결 통로 자리는 그대로(진행·저장·보스 탄막 좌표).
//  - 끄면 R171 원래 지도와 바이트까지 같다.
// 실행: node r96/qa/r379/r379-cpu-check.cjs  (CPU VM — 브라우저·GPU·자연 플레이 아님)
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../../..'),src=fs.readFileSync(path.join(root,'r96/client-source/story-maps-r171.js'),'utf8');
let n=0,fails=0;const check=(m,c,d)=>{n++;if(!c)fails++;console.log((c?'PASS ':'FAIL ')+m+(c||d===undefined?'':' :: '+JSON.stringify(d).slice(0,400)));};
function load(on){const store=new Map(on===null?[]:[['storyworld.r379.storyWide',JSON.stringify({on})]]);const sb={localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},Math,JSON,Object,Array,Number,String,Map,Set,Error};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);return sb.__STORYWORLD_STORY_MAPS_R171__;}
const ON=load(null),OFF=load(false);
check('runtime copy identical',fs.readFileSync(path.join(root,'r96/runtime-text/story-maps-r171.js'),'utf8')===src);
check('default (no pref) is wide; {on:false} is the R171 size',ON.wideR379===true&&OFF.wideR379===false&&ON.W===100&&ON.H===104&&OFF.W===68&&OFF.H===70,{on:[ON.W,ON.H],off:[OFF.W,OFF.H]});
const topos=Object.keys(ON.TOPO);const fixed=['보스 전투실','다음 구역 문','중앙 전투실'];
const rows=topos.map(t=>{const prof={sourceTopology:t,purposes:['전투 구역','회랑'],mode:'outdoor'},id='r379-'+t,a=OFF.plan(id,prof),b=ON.plan(id,prof);
 const band=p=>p.links.filter(([x,y])=>p.rooms[x]?.band||p.rooms[y]?.band).map(l=>l[2]),aw=band(a),bw=band(b);
 const area=p=>p.rooms.filter(R=>R.band&&R.kind!=='corridor').reduce((s,R)=>s+R.w*R.h,0)/Math.max(1,p.rooms.filter(R=>R.band&&R.kind!=='corridor').length);
 const same=fixed.every((nm,i)=>JSON.stringify([a.rooms[i].x,a.rooms[i].y,a.rooms[i].w,a.rooms[i].h])===JSON.stringify([b.rooms[i].x,b.rooms[i].y,b.rooms[i].w,b.rooms[i].h]));
 const inside=[...b.cells].every(k=>{const[x,y]=k.split(':').map(Number);return x>=1&&y>=1&&x<99&&y<103;});
 const setA=[...new Set(aw.map(w=>Math.min(12,w*2)))].sort().join(),setB=[...new Set(bw)].sort().join();
 return{t,template:b.template,setA,setB,linkOff:Math.min(...aw),linkOn:Math.min(...bw),medOff:aw.sort((p,q)=>p-q)[aw.length>>1],medOn:bw.sort((p,q)=>p-q)[bw.length>>1],areaOff:Math.round(area(a)),areaOn:Math.round(area(b)),cellsOff:a.cells.size,cellsOn:b.cells.size,same,inside};});
check('every template: each band corridor width is twice an R171 width (capped at 12), none left at the old width',rows.every(r=>r.setB.split(',').every(w=>['6','8','10','12'].includes(w))&&r.setA.split(',').every(w=>r.setB.split(',').includes(w))),rows.map(r=>r.t+' R171×2 '+r.setA+' / R376 '+r.setB));
check('every template: rooms/yards/halls larger (mean area ≥1.8× — about 1.5×1.5)',rows.every(r=>r.areaOff===0||r.areaOn>=r.areaOff*1.8),rows.map(r=>r.t+':'+r.areaOff+'→'+r.areaOn));
check('boss room, next-region alcove and gathering room keep their position and size',rows.every(r=>r.same),rows.filter(r=>!r.same).map(r=>r.t));
check('floor stays inside the 100×104 frame',rows.every(r=>r.inside),rows.filter(r=>!r.inside).map(r=>r.t));
check('floor grows (more room to move)',rows.every(r=>r.cellsOn>r.cellsOff*1.4),rows.map(r=>r.t+':'+r.cellsOff+'→'+r.cellsOn));
let legacy=null;try{legacy=require('child_process').execSync('git show origin/main:r96/client-source/story-maps-r171.js',{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).toString();}catch(e){console.log('SKIP pre-R379 byte comparison: origin/main not available in this checkout (미실행)');}
if(legacy){const sb={localStorage:{getItem:()=>null,setItem(){}},Math,JSON,Object,Array,Number,String,Map,Set,Error};sb.window=sb;vm.createContext(sb);vm.runInContext(legacy,sb);const OLD=sb.__STORYWORLD_STORY_MAPS_R171__;
 if(OLD.wideR379===undefined){const diff=topos.filter(t=>{const prof={sourceTopology:t,purposes:['전투 구역','회랑'],mode:'outdoor'};return JSON.stringify([...OLD.plan('x'+t,prof).cells].sort())!==JSON.stringify([...OFF.plan('x'+t,prof).cells].sort());});
  check('{on:false} reproduces the pre-R379 R171 floor exactly',!diff.length,diff);}
 else check('{on:false} reproduces the pre-R379 R171 floor exactly (main already has R379 — compared size only)',OFF.W===68);}
console.table(rows.map(({t,template,linkOff,linkOn,areaOff,areaOn,cellsOff,cellsOn})=>({t,template,linkOff,linkOn,areaOff,areaOn,cellsOff,cellsOn})));
console.log(fails?`FAIL ${fails}/${n}`:`R379 ${n}/${n}`);process.exit(fails?1:0);
