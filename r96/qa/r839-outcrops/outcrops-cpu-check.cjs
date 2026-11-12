// R839 CPU check — 야외맵 길을 맵마다 다르게 하는 바위턱 오버레이(outcrops-r839.js).
//  사용자 2026-11-12 "이동구조를 맵마다 서사와 테마에 맞게 변형" · "건물등을 배치해서 길을 만든다던지 조형물을 배치해서 길을만든다던지". 브라우저 실측은 outcrops-browser.mjs, 표 굽기는 outcrops-bake.mjs.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');let bad=0,n=0;const ok=(m,c,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');}else console.log('ok  ',m);};
const F='outcrops-r839.js',PF='passages-r838.js';let src='',psrc='';try{src=rd('client-source/'+F);psrc=rd('client-source/'+PF);}catch(e){ok('client source exists: '+e.message,false);}
ok('runtime copies are identical to client-source',src&&rd('runtime-text/'+F)===src&&rd('runtime-text/'+PF)===psrc);
const inputs=JSON.parse(rd('runtime-inputs.json')),man=JSON.parse(rd('runtime-manifest.json'));
ok('listed in runtime-inputs textPaths and runtime-manifest',inputs.textPaths.includes(F)&&man.files.some(f=>f.path===F));
const html=rd('runtime-text/index.html');
ok('script tag once, right after passages-r838.js (it registers through the R838 hook, so no order-regex changes)',html.split('<script src="./'+F+'"></script>').length===2&&html.includes('<script src="./'+PF+'"></script><script src="./'+F+'"></script>'));
ok('listed in verify-r96-public.py',/'outcrops-r839\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r839-outcrops\/outcrops-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/[^\n]*\n/g,'\n').replace(/\/\*[\s\S]*?\*\//g,'');
ok('no combat/save-format/prop writes, no randomness, no drawing',!/\.hp\s*=[^=]|serializeSave|\.enemies\s*=[^=]|\.props\s*=[^=]|Math\.random|Date\.now|ctx\.|drawProp/.test(code));
ok('Mammon vault (ep1b06), Bulmyeongwi villages (last302·last303), hub, ward-template and room zones are not in the style table',(()=>{const m=/const STYLE=\{([\s\S]*?)\};/.exec(src);if(!m)return false;const ids=[...m[1].replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([A-Za-z0-9]+):'/g)].map(q=>q[1]);return ids.length===15&&!ids.some(id=>/^(ep1b06|last30[123]|hub|hando0\d|ep1a\d+b?|u20\d|murder0\d|cult0\d|ep1b0[1-579])$/.test(id));})());
function world(store={},extra={}){const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Int32Array,Promise,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},...extra};sb.window=sb;vm.createContext(sb);vm.runInContext(psrc,sb,{filename:PF});vm.runInContext(src,sb,{filename:F});return{sb,api:sb.__STORYWORLD_OUTCROPS_R839__,P:sb.__STORYWORLD_PASSAGES_R838__};}
// 시험 지도(야외 꼴): 가로 큰길(폭 12, x 2~81) + 세로 큰길(폭 12, y 22~75) + 끝의 빈터(32×28). 벽판은 엔진처럼 칸 경계 위(두께 .24).
function layout({doors=[],entry={x:4.5,y:16},nodes=null,extra=null}={}){const S=new Set(),add=(x0,y0,w,d)=>{for(let y=y0;y<y0+d;y++)for(let x=x0;x<x0+w;x++)S.add(x+':'+y);};
 add(2,10,80,12);add(40,22,12,54);add(30,76,32,28);if(extra)extra(add);const W=90,H=110,has=(x,y)=>S.has(x+':'+y),walls=[];let id=0;
 for(let y=0;y<=H;y++){let run=null;for(let x=0;x<=W;x++){const e=x<W&&has(x,y-1)!==has(x,y);if(e&&run==null)run=x;if(!e&&run!=null){walls.push({id:'wall:'+id++,x:(run+x)/2,y,width:x-run,depth:.24,height:2.85,annex:true,endpoints:[[run,y],[x,y]]});run=null;}}}
 for(let x=0;x<=W;x++){let run=null;for(let y=0;y<=H;y++){const e=y<H&&has(x-1,y)!==has(x,y);if(e&&run==null)run=y;if(!e&&run!=null){walls.push({id:'wall:'+id++,x,y:(run+y)/2,width:.24,depth:y-run,height:2.85,annex:true});run=null;}}}
 const cells=[...S].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 return{id:'t',type:'r171-story-outdoor',storyMapR171:{template:'road',mode:'STORY'},bounds:[0,0,W,H],floorCells:cells,floorRects:cells.map(c=>({x:c[0],y:c[1],width:1,depth:1})),walls,nodes:nodes||[{id:'n0',x:4.5,y:16},{id:'n1',x:46,y:16},{id:'n2',x:80,y:16},{id:'n3',x:46,y:60},{id:'n4',x:46,y:100}],worldR74:{doors},entry};}
const setOf=L=>new Set(L.floorCells.map(c=>c[0]+':'+c[1]));
const audit=L=>{const S=setOf(L),has=(x,y)=>S.has(x+':'+y),cover=new Map();let thin=0,buried=0;
 for(const w of L.walls){const hz=w.width>=w.depth,len=Math.max(w.width,w.depth);for(let s=.5;s<len;s+=1){const a=hz?[Math.floor(w.x-len/2+s),Math.round(w.y)-1]:[Math.round(w.x)-1,Math.floor(w.y-len/2+s)],b=hz?[a[0],Math.round(w.y)]:[Math.round(w.x),a[1]],fa=has(...a),fb=has(...b);if(fa&&fb)thin++;if(!fa&&!fb)buried++;const k=(hz?'h:':'v:')+b[0]+':'+b[1];cover.set(k,(cover.get(k)||0)+1);}}
 let missing=0,dup=0;for(const k of S){const[x,y]=k.split(':').map(Number);for(const[e,o]of[['h:'+x+':'+y,[x,y-1]],['h:'+x+':'+(y+1),[x,y+1]],['v:'+x+':'+y,[x-1,y]],['v:'+(x+1)+':'+y,[x+1,y]]]){if(has(...o))continue;const c=cover.get(e)||0;if(!c)missing++;if(c>1)dup++;}}
 const first=L.floorCells[0],seen=new Set([first[0]+':'+first[1]]),q=[first];for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}
 const rc=new Set();for(const r of L.floorRects)for(let y=r.y;y<r.y+r.depth;y++)for(let x=r.x;x<r.x+r.width;x++)rc.add(x+':'+y);
 return{thin,buried,missing,dup,connected:seen.size===S.size,rects:rc.size===S.size&&[...S].every(k=>rc.has(k))};};
// 턱의 열린 변마다 그 변에서 곧게 잰 바닥 폭(가장 좁은 줄)
const openWidth=(L,blocks)=>{const S=setOf(L),has=(x,y)=>S.has(x+':'+y);let worst=99;for(const b of blocks)for(const[x,y,w,d]of b.rects){
 for(let i=0;i<w;i++)for(const[sy,dy]of[[y-1,-1],[y+d,1]]){if(!has(x+i,sy))continue;let r=0;while(has(x+i,sy+dy*r))r++;worst=Math.min(worst,r);}
 for(let j=0;j<d;j++)for(const[sx,dx]of[[x-1,-1],[x+w,1]]){if(!has(sx,y+j))continue;let r=0;while(has(sx+dx*r,y+j))r++;worst=Math.min(worst,r);}}return worst;};
const sample={chicane:'dist03',pinch:'dist04',island:'dist00',scatter:'last304',notch:'dist02'};
if(src&&psrc){const{api:A,P,sb}=world();
 ok('API present, linked to the R838 hook (extend), revision R839-outcrops-*',!!A&&/^R839-outcrops-\d+$/.test(A.revision)&&A.inspect().linked===true&&typeof P.extend==='function');
 for(const[style,id]of Object.entries(sample)){const L=layout(),pl=A.plan(id,L);A.qa({[id]:{blocks:pl.blocks.map(b=>b.rects)}});const T=sb.__STORYWORLD_LAYOUT_HOOK_R204__(id,L);A.qa(null);const O=T.outcropsR839,a=audit(T),S0=setOf(L),S1=setOf(T),gone=[...S0].filter(k=>!S1.has(k));
  ok(style+' ('+id+'): candidates found on a straight 12-wide road / open yard and every one is built',A.STYLE[id]===style&&pl.blocks.length>=2&&!!O&&O.blocks.length===pl.blocks.length&&O.skipped===0,{n:pl.blocks.length,built:O?.blocks.length});
  ok(style+': only floor cells were turned into rock, nothing added; floor stays one piece; wall slabs wrap the new edge with no thin/buried/missing/double slab; floorRects match',!!O&&gone.length===O.cells&&[...S1].every(k=>S0.has(k))&&a.connected&&a.rects&&!a.thin&&!a.buried&&!a.missing&&!a.dup,a);
  ok(style+': the way past every outcrop is at least '+A.SHAPE[style].gap+' cells wide',!!O&&openWidth(T,O.blocks)>=A.SHAPE[style].gap,O&&openWidth(T,O.blocks));
  ok(style+': layout identity kept (bounds, nodes, entry, doors objects) and the source is carried for R171/R219 checks',!!O&&T.bounds===L.bounds&&JSON.stringify(T.nodes)===JSON.stringify(L.nodes)&&JSON.stringify(T.entry)===JSON.stringify(L.entry)&&T.r839Source===L&&T.r204Source===L);}
 {const L=layout({doors:[{id:'door-1',x:46,y:40,width:4,depth:1}],entry:{x:20,y:16},nodes:[{id:'n0',x:60,y:16},{id:'hall',x:46,y:90,width:20,depth:16,storyMapR171:'hall'}]}),G=A.guards(L);let bads=[];
  for(const id of Object.values(sample))for(const b of A.plan(id,L).blocks)for(const[x,y,w,d]of b.rects){const near=(px,py,r)=>Math.hypot(Math.max(x-px,0,px-x-w),Math.max(y-py,0,py-y-d))<r;if(near(46,40,7)||near(20,16,7)||near(60,16,1.5)||(x<58&&x+w>34&&y<100&&y+d>80))bads.push([id,x,y,w,d]);}
  ok('nothing is planned within 7 cells of a door or the entry, on a waypoint, or inside a hall/boss room (+2 margin)',G.pts.length>=3&&G.rects.length===1&&!bads.length,bads);}
 {const L=layout(),a=A.plan('dist03',L),b=A.plan('dist03',L),c=A.plan('ep1b06b',L),i1=A.plan('dist00',L),i2=A.plan('last305',L);
  ok('planning is deterministic, and two zones with the same shape get different placements (zone id seeds side/order)',JSON.stringify(a)===JSON.stringify(b)&&(JSON.stringify(a.blocks)!==JSON.stringify(c.blocks)||JSON.stringify(i1.blocks)!==JSON.stringify(i2.blocks)));
  const d=A.plan('dist03',L,{drop:[a.blocks[0].key]});ok('a dropped candidate (bake tool) is not planned again',!d.blocks.some(q=>q.key===a.blocks[0].key));
  ok('a road narrower than 8 or a zone outside the table gets no band candidates',A.plan('dist03',layout({extra:null,nodes:[]}),{style:'nope'}).blocks.length===0&&A.plan('hub',L).blocks.length===0);}
 {const L=layout();ok('default path uses only the baked table: a layout whose table cells are not floor comes back untouched, and zones without a table always do',['dist03','hub','u204','ep1b06'].every(id=>{const T=A.shape(id,L);return T===L||(!!T.outcropsR839&&id==='dist03');}));
  A.qa({dist03:{blocks:[[3,3,2,2],[20,10,5,12],[[30,10,3,3],[30,19,3,3]]]}});const T=A.shape('dist03',L);A.qa(null);
  ok('a block on non-floor cells and a block that would cut the road in two are skipped, the rest is applied',!!T.outcropsR839&&T.outcropsR839.blocks.length===1&&T.outcropsR839.skipped===2&&audit(T).connected,T.outcropsR839);
  A.qa({});ok('test override qa({}) hands back the source for every zone, also from an already shaped layout',A.shape('dist03',L)===L&&A.shape('dist03',T)===L);A.qa(null);
  const rooms={...layout(),r224Rooms:[{id:'r',x0:2,y0:10,x1:12,y1:20}]};A.qa({dist03:{plan:true}});ok('room-type layouts (R838 territory) and samong layouts are never touched',A.shape('dist03',rooms)===rooms&&A.shape('dist03',{...layout(),samongR103:true}).outcropsR839===undefined);A.qa(null);}
 {const st={'storyworld.r839.outcrops.qa':JSON.stringify({dist03:{plan:true}})};const w=world(st),L=layout();ok('hook chain: the R838 hook runs outcrops after its own shaping (stored test override)',!!w.sb.__STORYWORLD_LAYOUT_HOOK_R204__('dist03',L).outcropsR839&&!w.sb.__STORYWORLD_LAYOUT_HOOK_R204__('dist04',L).outcropsR839);
  const w2=world({},{__STORYWORLD_COOP_SIM_R62__:{mode:()=>'host'}});w2.api.qa({dist03:{plan:true}});const L2=layout();ok('co-op is left alone',w2.sb.__STORYWORLD_LAYOUT_HOOK_R204__('dist03',L2)===L2);
  const st3={};const w3=world(st3);w3.api.set({on:false});ok('off switch persists (storyworld.r839.outcrops {"on":false})',JSON.parse(st3['storyworld.r839.outcrops']).on===false&&world(st3).api.inspect().prefs.on===false);
  const w4=world();w4.P.extend(()=>{throw new Error('boom');});w4.api.qa({dist03:{plan:true}});ok('a later extension that throws does not undo the outcrops',!!w4.sb.__STORYWORLD_LAYOUT_HOOK_R204__('dist03',layout()).outcropsR839);}
 {const L=layout(),holder={L:null},w=world({},{__STORYWORLD_EXPLORATION__:{layout:()=>holder.L}});w.api.qa({dist03:{plan:true}});const T=w.sb.__STORYWORLD_LAYOUT_HOOK_R204__('dist03',L),b=T.outcropsR839.blocks[0].rects[0],raw={zone:'dist03',layer:'STORY',player:{x:b[0]+b[2]/2,y:b[1]+b[3]/2}},now=setOf(T);
  holder.L=T;const to=w.api.nudge(raw);ok('old save standing where an outcrop now is: moved to open floor within 5 cells',!!to&&now.has(Math.floor(to.x)+':'+Math.floor(to.y))&&Math.hypot(to.x-raw.player.x,to.y-raw.player.y)<5,to);
  ok('a save on untouched floor, another layer, or another zone is not moved',w.api.nudge({zone:'dist03',layer:'STORY',player:{x:4.5,y:16}})===null&&w.api.nudge({...raw,layer:'SAMONG'})===null&&w.api.nudge({...raw,zone:'hub'})===null);}
 const T=A.TABLE,zs=Object.keys(T),flat=r=>Array.isArray(r[0])?r:[r];
 ok('baked table: only zones in the style table, integer rectangles no bigger than 7×7, at most 14 outcrops per zone',zs.length>0&&zs.every(z=>A.STYLE[z]&&T[z].length>0&&T[z].length<=14&&T[z].every(r=>flat(r).every(q=>q.length===4&&q.every(Number.isInteger)&&q[2]>=2&&q[3]>=2&&q[2]<=7&&q[3]<=7))),zs);
 ok('inspect reports no errors',A.inspect().stats.errors===0&&P.inspect().stats.errors===0,A.inspect().lastError);
 // 실제 지도(빌드한 사이트): 표의 턱이 모두 입혀지고 길이 이어지는지
 (async()=>{let h=null;try{const{createHarness}=require(path.join(R,'qa','harness.cjs'));h=createHarness({timeoutMs:300000});await h.boot();}catch(e){ok('built site boots in the CPU harness: '+String(e).slice(0,200),false);}
  if(h){const rows=h.run(`(()=>{const A=__STORYWORLD_OUTCROPS_R839__,out=[];for(const id of Object.keys(A.TABLE)){const L=__STORYWORLD_EXPLORATION__.layout(id,'STORY'),O=L&&L.outcropsR839,S=new Set((L?.floorCells||[]).map(c=>c[0]+':'+c[1]));let conn=false;if(S.size){const f=L.floorCells[0],seen=new Set([f[0]+':'+f[1]]),q=[f];for(let i=0;i<q.length;i++){const[x,y]=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+':'+(y+dy);if(S.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy]);}}}conn=seen.size===S.size;}
    const pts=[L?.entry,...(L?.nodes||[]),...(L?.worldR74?.doors||[])].filter(p=>p&&Number.isFinite(p.x+p.y)),src=A.source(id,L),S0=new Set((src?.floorCells||[]).map(c=>c[0]+':'+c[1])),lost=pts.filter(p=>S0.has(Math.floor(p.x)+':'+Math.floor(p.y))&&!S.has(Math.floor(p.x)+':'+Math.floor(p.y))).length;
    out.push({id,want:A.TABLE[id].length,built:O?O.blocks.length:0,skipped:O?O.skipped:-1,conn,lost,rooms:(L?.r224Rooms||[]).length});}return{out,errors:A.inspect().stats.errors};})()`);
   ok('real layouts: every baked outcrop is applied (none skipped), the floor stays one piece, no entry/waypoint/door cell is lost',rows.out.length===zs.length&&rows.errors===0&&rows.out.every(r=>r.built===r.want&&r.skipped===0&&r.conn&&r.lost===0&&r.rooms===0),rows.out.filter(r=>!(r.built===r.want&&r.skipped===0&&r.conn&&r.lost===0)));}
  console.log(`\nR839 CPU: ${n-bad}/${n} passed`);process.exit(bad?1:0);})();
}else{console.log(`\nR839 CPU: ${n-bad}/${n} passed`);process.exit(1);}
