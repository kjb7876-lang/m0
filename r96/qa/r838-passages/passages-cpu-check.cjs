// R838 CPU check — 실내 문간(방 사이 통로) 벽 모양을 지역마다 다르게 하는 오버레이(passages-r838.js).
//  사용자 2026-11-12 "스토리모드 내부맵 방구조는 바꾸지말고 … 통로들에 있는 벽구조를 … 맵마다 차별성이 있게 … 가구배치하는거에 영향없게". 브라우저 실측은 passages-browser.mjs.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');}else console.log('ok  ',m);};
const F='passages-r838.js';let src='';try{src=rd('client-source/'+F);}catch(e){ok('client source exists: '+e.message,false);}
ok('runtime copy is identical to client-source',src&&rd('runtime-text/'+F)===src);
const inputs=JSON.parse(rd('runtime-inputs.json')),man=JSON.parse(rd('runtime-manifest.json'));
ok('listed in runtime-inputs textPaths and runtime-manifest',inputs.textPaths.includes(F)&&man.files.some(f=>f.path===F));
const html=rd('runtime-text/index.html');
ok('script tag once, right after walls-solid-r830.js (early; the hook slot is an accessor so every later layout overlay — cave-r204, maps-palace-slum-r317, mammon-bossroom, seven-sins-bossrooms, sin-room-art — still runs inside it)',html.split('<script src="./'+F+'"></script>').length===2&&html.includes('<script src="./walls-solid-r830.js"></script><script src="./'+F+'"></script>')&&html.indexOf('"./story-maps-r171.js"')<html.indexOf('"./'+F+'"'));
ok('listed in verify-r96-public.py',/'passages-r838\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r838-passages\/passages-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/[^\n]*\n/g,'\n').replace(/\/\*[\s\S]*?\*\//g,'');
ok('no combat/save-format/prop writes, no randomness, no drawing',!/\.hp\s*=[^=]|serializeSave|\.enemies\s*=[^=]|\.props\s*=[^=]|Math\.random|Date\.now|ctx\.|drawProp/.test(code));
ok('Mammon vault (ep1b06), hospital main building, ward-template zones, hub and rest rooms are not in the style table',(()=>{const m=/const STYLE=Object\.freeze\(\{([\s\S]*?)\}\);/.exec(src);return!!m&&!/ep1b06|ep1a08\b|hando0|kair0|last301|cult04|hub|dreamRest|restEp1b/.test(m[1].replace(/\/\*[\s\S]*?\*\//g,''));})());
function world(store={},extra={}){const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},...extra};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return{sb,api:sb.__STORYWORLD_PASSAGES_R838__};}
// 시험 지도: 방 cols×rows 개(각 10×8칸), 방 사이 1칸 벽, 벽마다 가운데 6칸(가로벽)·6칸(세로벽) 문간. 엔진과 같은 꼴(벽판은 칸 경계 위, 두께 .24)
function layout({cols=4,rows=3,gw=6,doors=[],nodes=null,entry=null,closed=[]}={}){const RW=10,RH=8,W=cols*(RW+1)+1,H=rows*(RH+1)+1,S=new Set(),rooms=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x0=1+c*(RW+1),y0=1+r*(RH+1);rooms.push({id:'room:'+r+':'+c,x0,y0,x1:x0+RW,y1:y0+RH});for(let y=y0;y<y0+RH;y++)for(let x=x0;x<x0+RW;x++)S.add(x+':'+y);
  if(c<cols-1&&!closed.includes('v:'+r+':'+c)){const a=y0+((RH-gw)>>1);for(let i=0;i<gw;i++)S.add((x0+RW)+':'+(a+i));}
  if(r<rows-1&&!closed.includes('h:'+r+':'+c)){const a=x0+((RW-gw)>>1);for(let i=0;i<gw;i++)S.add((a+i)+':'+(y0+RH));}}
 const has=(x,y)=>S.has(x+':'+y),walls=[];let id=0;
 for(let y=0;y<=H;y++){let run=null;for(let x=0;x<=W;x++){const e=x<W&&has(x,y-1)!==has(x,y);if(e&&run==null)run=x;if(!e&&run!=null){walls.push({id:'wall:'+id++,x:(run+x)/2,y,width:x-run,depth:.24,height:2.85,annex:true,endpoints:[[run,y],[x,y]]});run=null;}}}
 for(let x=0;x<=W;x++){let run=null;for(let y=0;y<=H;y++){const e=y<H&&has(x-1,y)!==has(x,y);if(e&&run==null)run=y;if(!e&&run!=null){walls.push({id:'wall:'+id++,x,y:(run+y)/2,width:.24,depth:y-run,height:2.85,annex:true});run=null;}}}
 const cells=[...S].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]),rects=[];for(const c of cells)rects.push({x:c[0],y:c[1],width:1,depth:1});
 return{id:'t',type:'r81-story-ward-maze',bounds:[0,0,W,H],floorCells:cells,floorRects:rects,walls,r224Rooms:rooms,nodes:nodes||rooms.map(q=>({id:q.id,x:(q.x0+q.x1)/2,y:(q.y0+q.y1)/2})),worldR74:{doors},entry:entry||{x:2.5,y:2.5}};}
const audit=L=>{const S=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),has=(x,y)=>S.has(x+':'+y),cover=new Map();let thin=0,buried=0;
 for(const w of L.walls){const hz=w.width>=w.depth,len=Math.max(w.width,w.depth);for(let s=.5;s<len;s+=1){const a=hz?[Math.floor(w.x-len/2+s),Math.round(w.y)-1]:[Math.round(w.x)-1,Math.floor(w.y-len/2+s)],b=hz?[a[0],Math.round(w.y)]:[Math.round(w.x),a[1]],fa=has(...a),fb=has(...b);if(fa&&fb)thin++;if(!fa&&!fb)buried++;const k=(hz?'h:':'v:')+b[0]+':'+b[1];cover.set(k,(cover.get(k)||0)+1);}}
 let missing=0,dup=0;for(const k of S){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(has(...o))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 const rc=new Set();let area=0;for(const r of L.floorRects){area+=r.width*r.depth;for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)rc.add(x+':'+y);}
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 const inRoom=(x,y)=>L.r224Rooms.some(r=>x>=r.x0&&x<r.x1&&y>=r.y0&&y<r.y1);let roomCells=0;for(const c of L.floorCells)if(inRoom(c[0],c[1]))roomCells++;
 return{thin,buried,missing,dup,rectsMatch:area===S.size&&rc.size===S.size&&[...S].every(k=>rc.has(k)),connected:seen.size===S.size,cells:S.size,roomCells};};
const openRuns=(L,g)=>{const S=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),[ax,a,b]=g.key.split(':'),hz=ax==='h',fx=+a,st=+b,runs=[];let run=0;for(let i=0;i<=g.n;i++){const c=hz?[st+i,fx]:[fx,st+i];if(i<g.n&&S.has(c[0]+':'+c[1]))run++;else{if(run)runs.push(run);run=0;}}return runs;};
let W=null;try{W=world();}catch(e){ok('overlay runs: '+e.message,false);}
const A=W?.api;ok('API frozen with revision/STYLE/KEEP_OPEN/gaps/pattern/plan/fillCells/shape/set/qa/inspect',!!A&&Object.isFrozen(A)&&/^R838-passages-\d+$/.test(A.revision||'')&&['gaps','pattern','plan','fillCells','shape','set','qa','inspect'].every(k=>typeof A[k]==='function'));
if(A){const ids=Object.keys(A.STYLE),byStyle=s=>ids.find(i=>A.STYLE[i]===s);
 ok('25 indoor zones, five styles all in use',ids.length===25&&['gate','offset','mirror','pier','ruin'].every(s=>byStyle(s)));
 const L0=layout(),a0=audit(L0),G=A.gaps(L0);
 ok('gap finder: a 4×3 room grid has 17 doorways (9 vertical walls + 8 horizontal), each 6 wide',G.length===17&&G.every(g=>g.n===6),G.length);
 ok('test layout before: consistent walls',a0.thin===0&&a0.buried===0&&a0.missing===0&&a0.dup===0&&a0.connected);
 const sigs={};
 for(const st of['gate','offset','mirror','pier','ruin']){const id=byStyle(st),L=A.shape(id,layout()),a=L&&audit(L),P=L?.passagesR838;
  ok(st+' ('+id+'): layout reshaped, record kept (style, gaps, cells, before/after)',!!P&&P.style===st&&P.cells>0&&P.before===a0.cells&&P.after===a0.cells-P.cells&&a.cells===P.after,P&&[P.style,P.cells]);
  ok(st+': room floor untouched (only doorway cells became solid), floor in one piece, rects = floor',!!a&&a.roomCells===a0.roomCells&&a.connected&&a.rectsMatch,a);
  ok(st+': every floor|solid edge has exactly one wall slab, none thin, none buried',!!a&&a.thin===0&&a.buried===0&&a.missing===0&&a.dup===0,a);
  ok(st+': each open doorway keeps runs ≥2 wide and one ≥3; blocked ones are fully closed',!!P&&P.gaps.every(g=>{const r=openRuns(L,g);return g.blocked?r.length===0:(r.length>0&&Math.min(...r)>=2&&Math.max(...r)>=3);}),P&&P.gaps.map(g=>openRuns(L,g).join('+')));
  ok(st+': source layout object untouched, rooms/doors/nodes/entry carried over by reference',L.r838Source&&L.r224Rooms===L.r838Source.r224Rooms&&L.nodes===L.r838Source.nodes&&L.worldR74===L.r838Source.worldR74&&L.entry===L.r838Source.entry&&!L.r838Source.passagesR838);
  ok(st+': new slabs copy the map wall template (height 2.85, thickness .24)',L.walls.filter(w=>w.passagesR838).length>0&&L.walls.filter(w=>w.passagesR838).every(w=>w.height===2.85&&Math.min(w.width,w.depth)===.24));
  sigs[st]=P.gaps.map(g=>openRuns(L,g).join('+')).join('|');}
 ok('the five styles give five different doorway arrangements on the same room grid',new Set(Object.values(sigs)).size===5,sigs);
 ok('two zones with the same style still differ where the style is per-doorway (offset: ep1b02 vs ep1b04)',(()=>{const f=id=>{const L=A.shape(id,layout());return L.passagesR838.gaps.map(g=>openRuns(L,g).join('+')+(g.blocked?'x':'')).join('|')+JSON.stringify(L.floorCells.length)+L.walls.length;};const p=id=>A.plan(id,layout()).cells.map(c=>c.join(':')).join(' ');return p('ep1b02')!==p('ep1b04');})());
 ok('same input → same output object (cached), second hook pass over a shaped layout returns it unchanged',(()=>{const L=layout(),a=A.shape('ep1b03',L);return a===A.shape('ep1b03',L)&&A.shape('ep1b03',a)===a;})());
 ok('deterministic across page loads (fresh world gives the same cells)',(()=>{const w2=world();return JSON.stringify(w2.api.plan('u202',layout()).cells)===JSON.stringify(A.plan('u202',layout()).cells);})());
 // 지킴
 {const g0=G.find(g=>g.hz),door={id:'door-1',x:g0.a+g0.n/2,y:g0.fixed+2.5,width:4};const P=A.plan('u204',layout({doors:[door]}));
  ok('guard: a doorway within reach of an R74 door stays as it is',P.gaps.find(g=>g.key===g0.key).why==='guard'&&P.gaps.filter(g=>g.fill).length>0,P.gaps.find(g=>g.key===g0.key));
  const P2=A.plan('u204',layout({entry:{x:g0.a+1,y:g0.fixed+3}}));ok('guard: a doorway next to the entry stays as it is',P2.gaps.find(g=>g.key===g0.key).why==='guard');
  const base=layout();const P3=A.plan('u204',{...base,nodes:[...base.nodes,{id:'n',x:g0.a+2.5,y:g0.fixed+.5}]});ok('guard: a doorway with a route node standing in it stays as it is',P3.gaps.find(g=>g.key===g0.key).why==='guard');
  ok('room-centre nodes do not guard their doorways (only what is on the doorway)',A.plan('u204',layout()).gaps.every(g=>g.why!=='guard'));
  const P4=A.plan('u204',layout(),{keepOpen:[g0.key]});ok('keep-open table: a listed doorway is left alone, the rest are shaped',P4.gaps.find(g=>g.key===g0.key).why==='keep-open'&&P4.gaps.filter(g=>g.fill).length===16);}
 // 막기
 {const Lb=layout(),P=A.plan('u202',Lb,{style:'offset',block:1});const nb=P.gaps.filter(g=>g.blocked).length,out=A.fillCells(Lb,P.cells),a=out&&audit(out);
  ok('block ratio 1: doorways close only while the floor stays in one piece (some stay open) and walls stay consistent',nb>0&&nb<17&&!!a&&a.connected&&a.thin===0&&a.buried===0&&a.missing===0&&a.dup===0,[nb,a]);
  // 돌아가는 길 상한: 방 1×4 한 줄(가로로 3개 문간)은 하나라도 막으면 끊기므로 하나도 못 막는다
  const P1=A.plan('u202',layout({cols:4,rows:1}),{style:'offset',block:1});ok('block: in a single row of rooms nothing can be closed (it would cut the floor)',P1.gaps.length===3&&P1.gaps.every(g=>!g.blocked&&g.fill>0&&g.fill<g.n),P1.gaps);
  // 2×N 고리: 한 곳을 막으면 먼 길로 돌아가야 하는 경우 DETOUR 로 걸러짐 — 고리 둘레가 DETOUR 보다 길 때
  const ring=layout({cols:8,rows:2,closed:['h:0:1','h:0:2','h:0:3','h:0:4','h:0:5','h:0:6']});const Pr=A.plan('u202',ring,{style:'offset',block:1});
  ok('block: a doorway is not closed when the way round would exceed the detour limit ('+A.DETOUR+' steps)',Pr.gaps.filter(g=>g.blocked).every(g=>true)&&(()=>{const out=A.fillCells(ring,Pr.cells);if(!out)return false;const S=new Set(out.floorCells.map(c=>c[0]+':'+c[1]));const dist=(a,b)=>{let cur=[a],d=0;const seen=new Set([a.join(':')]);while(cur.length&&d<400){const nx=[];d++;for(const[x,y]of cur)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(!S.has(k)||seen.has(k))continue;if(x+dx===b[0]&&y+dy===b[1])return d;seen.add(k);nx.push([x+dx,y+dy]);}cur=nx;}return Infinity;};
   return Pr.gaps.filter(g=>g.blocked).every(g=>{const[ax,a,b]=g.key.split(':'),hz=ax==='h',m=g.n>>1,p=hz?[+b+m,+a-1]:[+a-1,+b+m],q=hz?[+b+m,+a+1]:[+a+1,+b+m];return dist(p,q)<=A.DETOUR;});})(),Pr.gaps.filter(g=>g.blocked).map(g=>g.key));
  ok('gate and pier styles never close a doorway',A.BLOCK.gate===0&&A.BLOCK.pier===0&&['gate','pier'].every(s=>A.plan(byStyle(s),layout()).gaps.every(g=>!g.blocked)));}
 ok('narrow doorways (<5 wide) and layouts without rooms are left alone',A.plan('u204',layout({gw:4})).cells.length===0&&(()=>{const L=layout();delete L.r224Rooms;return A.shape('u204',L)===L;})());
 ok('zones outside the table (ep1b06 Mammon, hub, hando02, ep1a08) are returned untouched',['ep1b06','hub','hando02','ep1a08','dist01'].every(id=>{const L=layout();return A.shape(id,L)===L;}));
 ok('fillCells refuses a fill that would cut the floor in two',(()=>{const L=layout({cols:2,rows:1}),g=A.gaps(L)[0],cells=[];for(let i=0;i<g.n;i++)cells.push([g.fixed,g.a+i]);return A.fillCells(L,cells)===null;})());
 // 훅 사슬·끄기·협동
 {let called=0;const w=world({},{__STORYWORLD_LAYOUT_HOOK_R204__:(id,L)=>{called++;return{...L,prevMark:true};}});const out=w.sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',layout());ok('layout hook: the previous hook runs first and its result is what gets shaped',called===1&&out.prevMark===true&&!!out.passagesR838);
  const w2=world({'storyworld.r838.passages':'{"on":false}'}),L=layout();ok('off switch (storyworld.r838.passages {"on":false}): hook returns the layout as it came',w2.sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',L)===L);
  const st={};const w3=world(st);w3.api.set({on:false});ok('set({on:false}) persists',JSON.parse(st['storyworld.r838.passages']).on===false);
  const w4=world({},{__STORYWORLD_COOP_SIM_R62__:{mode:()=>'host'}}),L4=layout();ok('co-op is left alone',w4.sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',L4)===L4);
  const w5=world({'storyworld.r838.passages.qa':JSON.stringify({u204:{keepOpen:[]}})});ok('test override (storyworld.r838.passages.qa): listed zone shaped with the given table, unlisted zone returns the source',!!w5.sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',layout()).passagesR838&&!w5.sb.__STORYWORLD_LAYOUT_HOOK_R204__('u205',layout()).passagesR838);}
  {const w=world({}),sb=w.sb,order=[];/* 뒤에 오는 손질 둘이 previous 를 잡고 훅을 갈아 끼운다 */
   for(const tag of['A','B']){const previous=sb.__STORYWORLD_LAYOUT_HOOK_R204__;sb.__STORYWORLD_LAYOUT_HOOK_R204__=function(id,L){const base=previous?.(id,L)||L;order.push(tag+(base.passagesR838?':shaped':':plain'));return{...base,['mark'+tag]:true,r224Rooms:base.r224Rooms};};}
   const out=sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',layout());
   ok('later overlays that replace the hook still run inside R838: each runs once on the unshaped layout, R838 shapes last',order.join(',')==='A:plain,B:plain'&&out.markA&&out.markB&&!!out.passagesR838,order.join(','));
   const src=out.r838Source;ok('the shaped layout carries the pre-edit source as r204Source (R171 determinism check reads it)',!!src&&out.r204Source===src&&src.markB===true);
   sb.__STORYWORLD_LAYOUT_HOOK_R204__=()=>{throw new Error('boom');};let threw=false;try{sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',layout());}catch(_){threw=true;}
   sb.__STORYWORLD_LAYOUT_HOOK_R204__=null;ok('an inner hook that throws does not leave R838 stuck in pass-through',threw&&!!sb.__STORYWORLD_LAYOUT_HOOK_R204__('u204',layout()).passagesR838);}
 ok('keep-open table only names zones in the style table and well-formed doorway keys',Object.entries(A.KEEP_OPEN).every(([z,l])=>A.STYLE[z]&&Array.isArray(l)&&l.every(k=>/^[hv]:\d+:\d+$/.test(k))));
 ok('inspect reports no errors',A.inspect().stats.errors===0,A.inspect().lastError);}
console.log(`\nR838 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);
