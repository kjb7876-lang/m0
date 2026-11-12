// R830 CPU check — 얇은 칸막이벽(양쪽이 다 바닥인 두께 0.24 벽판)을 옆 메인벽과 같은 '바닥 아닌 칸' 덩어리로 바꾸는 오버레이(walls-solid-r830.js).
//  사용자 2026-11-12 "중간에 얇은 벽 나오는 거 구조를 옆에 붙은 메인벽들로 바꿔주고 모든맵". 브라우저 실측은 r830-browser.mjs (CI 밖, 헤드리스).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x):'');}else console.log('ok  ',m);};
const F='walls-solid-r830.js';let src='';try{src=rd('client-source/'+F);}catch(e){ok('client source exists: '+e.message,false);}
let rt='';try{rt=rd('runtime-text/'+F);}catch(_){}
ok('runtime copy matches client source',!!src&&rt===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=rd('runtime-text/index.html');
ok('script tag once, right after story-maps-r171 and before the engine exploration adapter (so makeRoom is wrapped before the engine attaches its own layout)',html.split('"./'+F+'"').length===2&&/<script src="\.\/story-maps-r171\.js"><\/script>\s*<script src="\.\/walls-solid-r830\.js"><\/script>/.test(html)&&html.indexOf('"./'+F+'"')<html.indexOf('window.__STORYWORLD_EXPLORATION__=Object.freeze({layout:get,attach'));
ok('listed in verify-r96-public.py',/'walls-solid-r830\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r830\/r830-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/.*$/mg,'').replace(/\/\*[\s\S]*?\*\//g,'');
ok('no combat/save-format/prop writes, no randomness, no drawing',!/\.hp\s*=[^=]|serializeSave|\.enemies\s*=[^=]|\.props\s*=[^=]|Math\.random|ctx\.|drawProp/.test(code));
ok('hospital main building, safe rest rooms and R171 story maps are not in the zone table',(()=>{const m=/const ZONES=\{([\s\S]*?)\};/.exec(src);return!!m&&!/ep1a08|dreamRest|restEp1b|dist0|ep1b|murder|cult0[1-35-6]/.test(m[1])&&/hub:/.test(m[1])&&['hando01','hando02','hando03','kair02','kair03','last301','cult04'].every(z=>m[1].includes(z+':'));})());
function world(store={},extra={}){let made=0;const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},...extra};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return{sb,api:sb.__STORYWORLD_WALLS_SOLID_R830__,made:()=>made};}
// 시험 지도: 20×12 방 하나, 가운데 가로 칸막이(y=6, x 4..12) + 둘레 벽. 엔진과 같은 꼴(벽판은 칸 경계 위, 두께 .24)
function layout({part=[[4,6,12,6]],W=20,H=12,doors=[],nodes=[],hole=null}={}){const cells=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(!hole||!hole(x,y))cells.push([x,y]);const S=new Set(cells.map(c=>c[0]+':'+c[1])),has=(x,y)=>S.has(x+':'+y),walls=[];let id=0;
 for(let y=0;y<=H;y++){let run=null;for(let x=0;x<=W;x++){const e=x<W&&has(x,y-1)!==has(x,y);if(e&&run==null)run=x;if(!e&&run!=null){walls.push({id:'wall:'+id++,x:(run+x)/2,y,width:x-run,depth:.24,height:2.7,annex:true,endpoints:[[run,y],[x,y]]});run=null;}}}
 for(let x=0;x<=W;x++){let run=null;for(let y=0;y<=H;y++){const e=y<H&&has(x-1,y)!==has(x,y);if(e&&run==null)run=y;if(!e&&run!=null){walls.push({id:'wall:'+id++,x,y:(run+y)/2,width:.24,depth:y-run,height:2.7,annex:true});run=null;}}}
 for(const[x0,y0,x1,y1]of part){const hz=y0===y1;walls.push({id:'part:'+id++,x:(x0+x1)/2,y:(y0+y1)/2,width:hz?x1-x0:.24,depth:hz?.24:y1-y0,height:2.7,annex:true,partition:true});}
 return{id:'t',bounds:[0,0,W,H],floorCells:cells,floorRects:[{x:1,y:1,width:W-2,depth:H-2}],walls,nodes,worldR74:{doors},entry:{x:2.5,y:2.5}};}
const pick=w=>w.partition===true;
const audit=L=>{const S=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),has=(x,y)=>S.has(x+':'+y),cover=new Map();let thin=0,buried=0;
 for(const w of L.walls){const hz=w.width>=w.depth,len=Math.max(w.width,w.depth);for(let s=.5;s<len;s+=1){const a=hz?[Math.floor(w.x-len/2+s),Math.round(w.y)-1]:[Math.round(w.x)-1,Math.floor(w.y-len/2+s)],b=hz?[a[0],Math.round(w.y)]:[Math.round(w.x),a[1]],fa=has(...a),fb=has(...b);if(fa&&fb)thin++;if(!fa&&!fb)buried++;const k=(hz?'h:':'v:')+b[0]+':'+b[1];cover.set(k,(cover.get(k)||0)+1);}}
 let missing=0,dup=0;for(const k of S){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(has(...o))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 let area=0;for(const r of L.floorRects)area+=r.width*r.depth;const rectCells=new Set();for(const r of L.floorRects)for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)rectCells.add(x+':'+y);
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 return{thin,buried,missing,dup,rectsMatch:area===S.size&&rectCells.size===S.size&&[...S].every(k=>rectCells.has(k)),connected:seen.size===S.size,cells:S.size};};
let W=null;try{W=world();}catch(e){ok('overlay runs: '+e.message,false);}
const A=W?.api;ok('API frozen with revision/zones/solidify/layoutFor/set/qa/inspect',!!A&&Object.isFrozen(A)&&/^R830-walls-solid-\d+$/.test(A.revision||'')&&['solidify','layoutFor','set','qa','inspect'].every(k=>typeof A[k]==='function'));
if(A){
 // 정상 경로
 const L0=layout(),a0=audit(L0),L=A.solidify(L0,pick),a=L&&audit(L);
 ok('test layout before: the partition is a thin slab with floor on both sides (8 unit edges)',a0.thin===8&&a0.buried===0&&a0.missing===0);
 ok('after: no slab with floor on both sides, none buried, every floor|solid edge has exactly one wall slab',!!a&&a.thin===0&&a.buried===0&&a.missing===0&&a.dup===0,a);
 ok('after: exactly the 8 cells along one side became solid; floorRects cover exactly the floor cells; floor still one piece',!!a&&a.cells===a0.cells-8&&a.rectsMatch&&a.connected,a);
 ok('the source layout object and its arrays are left untouched (new object returned)',L!==L0&&L0.floorCells.length===a0.cells&&L0.walls.some(pick)&&!L0.wallsSolidR830&&!!L.wallsSolidR830);
 ok('the partition slab is gone and new slabs copy the boundary-wall template (height, annex, thickness; endpoints rebuilt), never the partition flag',!L.walls.some(pick)&&L.walls.filter(w=>w.wallsSolidR830).length>=3&&L.walls.filter(w=>w.wallsSolidR830).every(w=>w.height===2.7&&w.annex===true&&Math.min(w.width,w.depth)===.24&&!w.partition&&(!w.endpoints||w.endpoints.length===2)));
 ok('untouched boundary walls keep their identity (same objects)',L0.walls.filter(w=>!pick(w)).every(w=>L.walls.includes(w)));
 ok('record: which side, how many cells, before/after counts',L.wallsSolidR830.partitions.length===1&&L.wallsSolidR830.partitions[0].cells===8&&L.wallsSolidR830.before===a0.cells&&L.wallsSolidR830.after===a0.cells-8);
 ok('deterministic: same input → same cells and walls',JSON.stringify(A.solidify(layout(),pick).floorCells)===JSON.stringify(L.floorCells));
 // 쪽 고르기: 넓은 쪽(y=6 위는 5칸, 아래는 5칸 → 같으면 -1) / 한쪽이 좁으면 넓은 쪽
 ok('side choice: fills the deeper side (partition at y=4 → the lower side, 7 deep vs 3)',A.solidify(layout({part:[[4,4,12,4]]}),pick).wallsSolidR830.partitions[0].side===1);
 ok('forced side is honoured, forced 0 leaves the slab (returns null when nothing changes)',A.solidify(layout(),pick,{['part:'+layout().walls.find(pick).id.split(':')[1]]:1})?.wallsSolidR830.partitions[0].side===1&&A.solidify(layout(),pick,{[layout().walls.find(pick).id]:0})===null);
 // 경계: 문·입구·길목 곁은 메우지 않는다
 // 문 지킴 반경 = max(2.5, 폭/2+1.5). 문 (8,8.9)·폭 2 → 아래 줄(y6~7)까지 1.9(지킴), 위 줄(y5~6)까지 2.9(밖)
 const Ld=A.solidify(layout({doors:[{id:'door-1',x:8,y:8.9,width:2,depth:.24}]}),pick,{[layout().walls.find(pick).id]:undefined});
 ok('guard: a door within reach of one side → the other side is filled (here the upper side), even though the lower side is as deep',!!Ld&&Ld.wallsSolidR830.partitions[0].side===-1&&audit(Ld).thin===0,Ld&&Ld.wallsSolidR830);
 const Ld2=A.solidify(layout({doors:[{id:'door-1',x:8,y:6,width:4,depth:.24}]}),pick);
 ok('guard: a door right on the partition → the slab is left alone',Ld2===null||Ld2.walls.some(pick));
 const Ln=A.solidify(layout({nodes:[{id:0,x:8,y:5.5},{id:1,x:8,y:6.5}]}),pick);
 ok('guard: waypoints on both sides → the slab is left alone, with the reason recorded (nothing is filled over a waypoint)',Ln===null||(Ln.walls.some(pick)&&Object.keys(Ln.wallsSolidR830.skipped).length===1));
 // 경계: 메우면 바닥이 둘로 갈라지는 칸막이는 그대로
 const narrow=layout({part:[[1,3,19,3]],H:6});// 방 깊이 4(y1..4), 칸막이 y=3 전체 폭: 위 2줄·아래 1줄 → 어느 쪽을 메워도 얕거나 갈라짐
 const Lx=A.solidify(narrow,pick);ok('boundary: a full-width partition in a shallow room (filling would leave <2 deep or split the floor) is left as it is',Lx===null,Lx&&Lx.wallsSolidR830);
 // 경계: 이미 한쪽이 벽 덩어리인 구간은 건드리지 않는다(겹친 칸막이)
 const Lh=A.solidify(layout({hole:(x,y)=>y===5&&x>=4&&x<8}),pick),ah=Lh&&audit(Lh);
 ok('boundary: where the partition already borders solid cells only the open part is filled; no duplicate or buried slabs remain',!!ah&&ah.thin===0&&ah.buried===0&&ah.missing===0&&ah.dup===0&&Lh.wallsSolidR830.partitions[0].cells===4,ah);
 // 세로 칸막이·여러 칸막이
 const Lv=A.solidify(layout({part:[[10,1,10,6],[4,8,9,8]]}),pick),av=Lv&&audit(Lv);
 ok('vertical and multiple partitions: all become solid, edges consistent, floor connected',!!av&&av.thin===0&&av.buried===0&&av.missing===0&&av.dup===0&&av.connected&&av.rectsMatch&&Lv.wallsSolidR830.partitions.length===2,av);
 // 회전·두꺼운 벽은 대상 아님
 const Lr=layout();Lr.walls.find(pick).angle=.5;ok('rotated or thick walls are never treated as partitions',A.solidify(Lr,pick)===null&&(()=>{const t=layout();t.walls.find(pick).depth=1.2;return A.solidify(t,pick)===null;})());
 // layoutFor: 대상 지역만, 같은 원본엔 같은 결과, 끄기
 const hubL=layout();
 ok('layoutFor: only zones in the table (hub → changed, dist00/ep1a08 → same object)',A.layoutFor('hub',hubL)!==hubL&&A.layoutFor('dist00',hubL)===hubL&&A.layoutFor('ep1a08',hubL)===hubL);
 ok('layoutFor: the same source layout always yields the same result object; an already-solid layout is returned as is',A.layoutFor('hub',hubL)===A.layoutFor('hub',hubL)&&A.layoutFor('hub',A.layoutFor('hub',hubL))===A.layoutFor('hub',hubL));
 ok('no errors recorded',A.inspect().stats.errors===0,A.inspect().lastError);
}
// 끄기 스위치
{const w=world({'storyworld.r830.walls':'{"on":false}'}),L=layout();ok('off switch (storyworld.r830.walls {"on":false}): layoutFor returns the source layout',w.api.layoutFor('hub',L)===L&&w.api.inspect().prefs.on===false);
 const store={};const w2=world(store);w2.api.set({on:false});ok('set({on:false}) persists and applies from the next layout',JSON.parse(store['storyworld.r830.walls']).on===false&&w2.api.layoutFor('hub',layout()).wallsSolidR830===undefined);}
// makeRoom·restoreSave 감싸기
{let L0=layout();const calls=[];const sb={makeRoom:function(id,l){calls.push([id,l]);return{id,layer:l,props:[],enemies:[]};},__STORYWORLD_EXPLORATION__:{layout:(id,l)=>L0}};
 const w=world({},sb);const mk=vm.runInContext('makeRoom',w.sb);
 const r=mk('hub','STORY');ok('makeRoom wrap: a STORY hub room gets the solid layout before the engine attaches its own',!!r.exploration?.wallsSolidR830&&calls.length===1);
 ok('makeRoom wrap: DREAM layer, other zones and rooms that already have a layout are left alone',!mk('hub','DREAM').exploration&&!mk('dist00','STORY').exploration);
 w.sb.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};ok('makeRoom wrap: co-op is left alone',!mk('hub','STORY').exploration);}
console.log(`\nR830 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);
