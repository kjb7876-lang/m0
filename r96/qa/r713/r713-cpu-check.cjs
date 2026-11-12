// R713 CPU check — 첫 맵 돌담 두께(바깥 .64·안쪽 .48), 바닥 쪽 면 불변, 모서리 메움, 끄기 스위치, 연결(태그·검증 목록·워크플로).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='refuge-walls-r713.js',src=rd('client-source/'+F);
ok('runtime copy matches',rd('runtime-text/'+F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=rd('runtime-text/index.html');
ok('script tag once, last in the page (after world-tiles-r118; no pinned neighbour check breaks)',html.split('"./'+F+'"').length===2&&/<script src="\.\/world-tiles-r118\.js"><\/script>\s*<script src="\.\/refuge-walls-r713\.js"><\/script>\s*$/.test(html.slice(html.indexOf('world-tiles-r118.js')-20)));
ok('listed in verify-r96-public.py',/'refuge-walls-r713\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r713\/r713-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('runtime manifest lists the file',rd('runtime-manifest.json').includes('"'+F+'"')&&rd('runtime-inputs.json').includes('"'+F+'"'));
// 합성 피난 거점: 6x6 방(바닥 칸 2..7), 바깥 둘레 벽 .24 (칸 줄 2·8), 안쪽 칸막이 하나
function layout(){const cells=[];for(let x=2;x<8;x++)for(let y=2;y<8;y++)cells.push([x,y]);
 const w=(id,x,y,width,depth,extra={})=>({id,x,y,width,depth,height:2.7,refugeR82:true,...extra});
 return{refugeR82:{},floorCells:cells,walls:[w('t',5,2,6,.24),w('b',5,8,6,.24),w('l',2,5,.24,6),w('r',8,5,.24,6),w('p',5,5,3,.24,{partition:true}),w('free',5,9,2,.24)]};}
function run(off){const store={};if(off)store['storyworld.r713.walls']='{"on":false}';
 const sb={window:{},localStorage:{getItem:k=>store[k]??null},typeof:undefined,JSON,Math,Number,Array,Set,Map,WeakSet,Promise,console};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);return sb;}
const sb=run(false),A=sb.__STORYWORLD_REFUGE_WALLS_R713__;ok('module api',A&&A.revision==='R713-walls-1'&&A.constants.OUTER===.64&&A.constants.INNER===.48);
const L=layout();ok('dress returns true',A.dress(L)===true);const g=id=>L.walls.find(w=>w.id===id);
const near=(a,b)=>Math.abs(a-b)<1e-9;
ok('top wall (floor below): thick .64 and floor-side face stays at y=2.12, grows up',near(g('t').depth,.64)&&near(g('t').y-g('t').depth/2,1.48)&&near(g('t').y+g('t').depth/2,2.12));
ok('bottom wall (floor above): floor-side face stays at y=7.88, grows down',near(g('b').depth,.64)&&near(g('b').y-g('b').depth/2,7.88)&&near(g('b').y+g('b').depth/2,8.52));
ok('left wall: face stays x=2.12, grows left',near(g('l').width,.64)&&near(g('l').x+g('l').width/2,2.12));
ok('right wall: face stays x=7.88, grows right',near(g('r').width,.64)&&near(g('r').x-g('r').width/2,7.88));
ok('partition .48 centred on its old line',near(g('p').depth,.48)&&near(g('p').y,5));
ok('corners: top wall reaches the left wall outer face (x=1.48) and the right wall outer face (x=8.52), so the corner is not notched',near(g('t').x-g('t').width/2,1.48)&&near(g('t').x+g('t').width/2,8.52));
ok('free-standing wall end (touches nothing): length unchanged, only thicker',near(g('free').width,2)&&near(g('free').depth,.64));
const before=JSON.stringify(L.walls);A.dress(L);ok('idempotent',JSON.stringify(L.walls)===before);
ok('non-refuge layout untouched',A.dress({floorCells:[],walls:[{id:'z',x:1,y:1,width:3,depth:.24}]})===false);
const sb2=run(true),L2=layout(),before2=JSON.stringify(L2.walls);sb2.__STORYWORLD_REFUGE_WALLS_R713__.dress(L2);ok('switch off → walls stay .24',JSON.stringify(L2.walls)===before2);
ok('presentation/collision share one wall record: no extra mesh or collision array added',!/\.walls\.push|floorCells\s*=[^=]|new THREE|createElement/.test(src));
console.log(bad?bad+' failed':'all '+n+' passed');process.exit(bad?1:0);
