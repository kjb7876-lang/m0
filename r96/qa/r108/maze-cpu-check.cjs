// R108 CPU check: 사몽·사몽역행 손전등 미로가 더 넓고 덜 촘촘한가.
// R107 까지: 3x3 방을 폭 2 연결로 이은 5타일 간격 격자(14x14 등), 막다른 칸 ~44개·한 칸 곁가지 ~21개·되돌이 길 ~5개.
// R108: 8타일 간격 격자(8x8~11x11), 복도 폭 4, 교차로 광장(6)·막다른 방(6)·홀(8), 한 칸 곁가지 정리, 되돌이 길 확대,
//       출구까지 걷는 거리는 R107 과 같은 범위(R107 평균 182·최대 263 타일)로 유지한다.
// 모든 지표는 생성기의 자기 보고가 아니라 바닥 타일 지도에서 다시 잰다. 브라우저 없이 출하 모듈을 스텁 환경에서 실행한다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=path.join(__dirname,'..','..','client-source');
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail:String(detail).slice(0,300)});};
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:new Proxy({},{get:()=>({floorRect:[0,0,1,1],wallRect:[0,0,1,1]})})};
const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,Proxy,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
 StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:()=>null,setItem(){}},playScenes(){},escapeHTML:s=>String(s)};
sb.window=sb;vm.createContext(sb);
for(const f of['samong-text-r103.js','samong-r103.js','growth-r103.js','samong-maps-r105.js','props-static-r105.js','art-drive-r105.js','fx-boss-r105.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),sb,{filename:f});
const SM=sb.__STORYWORLD_SAMONG_R103__,M=sb.__STORYWORLD_SAMONG_MAPS_R105__,EP=SM.episodes,S=SM.state(),BP=M.blueprints;
check('modules load and expose the shared maze core',SM&&M&&typeof SM.mazeCore==='function'&&typeof SM.mazeLayout==='function'&&M.inspect().failures===0,M&&M.inspect().lastError);
// ---- measuring tools (tile map only) ------------------------------------------------------------------------
const key=(x,y)=>x+':'+y;
const floorSet=L=>{if(!L.__set)Object.defineProperty(L,'__set',{value:new Set(L.floorCells.map(([x,y])=>key(x,y)))});return L.__set;};
function bfsFrom(L,from){const F=floorSet(L),s=key(Math.floor(from.x),Math.floor(from.y));if(!F.has(s))return null;const d=new Map([[s,0]]),q=[s];for(let h=0;h<q.length;h++){const c=q[h],[x,y]=c.split(':').map(Number);for(const[a,b]of[[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const k=key(a,b);if(F.has(k)&&!d.has(k)){d.set(k,d.get(c)+1);q.push(k);}}}return d;}
function wallClear(L,px,py){const F=floorSet(L),x0=Math.floor(px),y0=Math.floor(py);if(!F.has(key(x0,y0)))return 0;let d=4;for(let b=y0-4;b<=y0+4;b++)for(let a=x0-4;a<=x0+4;a++){if(F.has(key(a,b)))continue;const h=Math.hypot(Math.max(a-px,0,px-a-1),Math.max(b-py,0,py-b-1));if(h<d)d=h;}return d;}
// local width of every floor tile = the narrower of its row run and its column run; also the share of tiles with a fully open 3x3 neighbourhood
function openness(L){const F=floorSet(L),rr=new Map(),cr=new Map(),w=[];let inner=0;
 for(const[x,y]of L.floorCells){if(!rr.has(key(x,y))){let a=x;while(F.has(key(a-1,y)))a--;let e=x;while(F.has(key(e+1,y)))e++;for(let t=a;t<=e;t++)rr.set(key(t,y),e-a+1);}
  if(!cr.has(key(x,y))){let a=y;while(F.has(key(x,a-1)))a--;let e=y;while(F.has(key(x,e+1)))e++;for(let t=a;t<=e;t++)cr.set(key(x,t),e-a+1);}}
 for(const[x,y]of L.floorCells){w.push(Math.min(rr.get(key(x,y)),cr.get(key(x,y))));let full=true;for(let dy=-1;dy<=1&&full;dy++)for(let dx=-1;dx<=1;dx++)if(!F.has(key(x+dx,y+dy))){full=false;break;}if(full)inner++;}
 w.sort((a,b)=>a-b);return{median:w[w.length>>1],narrow:w.filter(v=>v<=2).length/w.length,inner:inner/w.length};}
// cross-section of every link at the midpoint between the two cell centres
function linkWidths(L){const F=floorSet(L),x=L.samongR103,at=new Map(L.nodes.map(n=>[key(...n.cell),n])),out=[];
 for(const[ax,ay,bx,by]of x.links){const a=at.get(key(ax,ay)),b=at.get(key(bx,by)),mx=Math.floor((a.x+b.x)/2),my=Math.floor((a.y+b.y)/2),horiz=ay===by;if(!F.has(key(mx,my))){out.push(0);continue;}let n=1;
  if(horiz){for(let t=my-1;F.has(key(mx,t));t--)n++;for(let t=my+1;F.has(key(mx,t));t++)n++;}else{for(let t=mx-1;F.has(key(t,my));t--)n++;for(let t=mx+1;F.has(key(t,my));t++)n++;}out.push(n);}
 return out;}
// cells that are neighbours in the grid but not linked must stay walled: somewhere along the line between their centres a tile is void
// (a hall that touches the next hall would leave no void tile on that line)
function leaks(L){const F=floorSet(L),x=L.samongR103,at=new Map(L.nodes.map(n=>[key(...n.cell),n])),linked=new Set(x.links.flatMap(([a,b,c,d])=>[key(a,b)+'|'+key(c,d),key(c,d)+'|'+key(a,b)])),bad=[];
 const open=(n,m)=>{const horiz=n.y===m.y;for(const off of[-1,0]){let all=true;for(let t=horiz?n.x:n.y;t<(horiz?m.x:m.y);t++)if(!F.has(horiz?key(t,n.y+off):key(n.x+off,t))){all=false;break;}if(all)return true;}return false;};
 for(const n of L.nodes)for(const[dx,dy]of[[1,0],[0,1]]){const m=at.get(key(n.cell[0]+dx,n.cell[1]+dy));if(!m||linked.has(key(...n.cell)+'|'+key(...m.cell)))continue;if(open(n,m))bad.push(n.cell.join(',')+'>'+m.cell.join(','));}
 return bad;}
// ---- every blueprint maze, 8 seeds -----------------------------------------------------------------------------
const seedsOf=i=>[1,7,99,12345,0xdeadbeef,(i*2654435761)>>>0,3,4];
const rows=[],bad={island:[],place:[],walk:[],link:[],open:[],shape:[],leak:[],det:[],nodes:[]};let made=0,genMs=0,genMax=0;
for(let i=1;i<EP.length;i++)for(const seed of seedsOf(i)){S.ep=i;S.seed=seed;S.stage='maze';const g0=process.hrtime.bigint(),L=SM.layoutFor(i,'maze'),g1=Number(process.hrtime.bigint()-g0)/1e6,x=L.samongR103,tag=EP[i].key+'/'+seed;made++;genMs+=g1;genMax=Math.max(genMax,g1);
 const d=bfsFrom(L,L.entry),F=floorSet(L);
 if(!d||d.size!==F.size)bad.island.push(tag+' reach '+(d&&d.size)+'/'+F.size);
 const goals=[['entry',L.entry],['exit',x.exit],['lamp',x.save],...x.chests.map((c,n)=>['chest'+n,c])];
 for(const[nm,p]of goals)if(!(wallClear(L,p.x,p.y)>=1.9&&d&&d.has(key(Math.floor(p.x),Math.floor(p.y)))))bad.place.push(tag+' '+nm+' clear '+wallClear(L,p.x,p.y).toFixed(2));
 if(x.chests.length!==3)bad.place.push(tag+' chests '+x.chests.length);
 const walk=d?d.get(key(Math.floor(x.exit.x),Math.floor(x.exit.y))):-1,beeline=Math.hypot(x.exit.x-L.entry.x,x.exit.y-L.entry.y);
 if(!(walk>=110&&walk<=270&&beeline>=35))bad.walk.push(tag+' walk '+walk+' beeline '+beeline.toFixed(0));
 const lw=linkWidths(L);if(!lw.length||Math.min(...lw)<4||x.corridor!==4)bad.link.push(tag+' min link '+Math.min(...lw));
 const o=openness(L);if(!(o.median>=4&&o.narrow<=.02&&o.inner>=.45))bad.open.push(tag+' median '+o.median+' narrow '+o.narrow.toFixed(3)+' inner '+o.inner.toFixed(2));
 const lk=leaks(L);if(lk.length)bad.leak.push(tag+' '+lk.slice(0,3).join(' '));
 const shape=L.floorCells.length>=2600&&L.bounds[2]>=66&&L.bounds[3]>=66&&L.walls.length<=600&&L.floorRects.length<=200&&x.loops>=5&&x.stubs<=8&&x.deadEnds.length>=3&&x.halls>=3;
 if(!shape)bad.shape.push(tag+' floor '+L.floorCells.length+' walls '+L.walls.length+' rects '+L.floorRects.length+' loops '+x.loops+' stubs '+x.stubs+' dead '+x.deadEnds.length+' halls '+x.halls);
 const off=L.nodes.filter(n=>!(wallClear(L,n.x,n.y)>=2&&F.has(key(Math.floor(n.x),Math.floor(n.y)))));if(off.length)bad.nodes.push(tag+' nodes off-centre '+off.length);
 rows.push({i,seed,floor:L.floorCells.length,walk,link:Math.min(...lw),inner:o.inner,narrow:o.narrow,dead:x.deadEnds.length,stubs:x.stubs,loops:x.loops,cells:x.cols*x.rows,walls:L.walls.length});
 if(seed===1){const b=BP[EP[i].key].maze,fresh=SM.mazeCore(L.id,EP[i],{C:x.cols,R:x.rows,straight:b.straight,braid:b.braid,rooms:b.rooms,wallHeight:L.walls[0].height},seed);
  if(JSON.stringify(fresh.floorCells)!==JSON.stringify(L.floorCells)||fresh.samongR103.exit.x!==x.exit.x||fresh.samongR103.exit.y!==x.exit.y)bad.det.push(tag);}}
S.ep=0;S.seed=0;S.stage='ascent';
check('every maze floor is one connected area reachable from the entry ('+made+' mazes)',!bad.island.length,bad.island.slice(0,3).join(' | '));
check('entry, exit, lamp and 3 chests stand on reachable floor at least 1.9 tiles from any wall',!bad.place.length,bad.place.slice(0,3).join(' | '));
check('walk entry to exit stays near R107 (110-270 tiles; R107 111-263, mean 182) and the exit is far from the start (>=35)',!bad.walk.length,bad.walk.slice(0,3).join(' | '));
check('every corridor link is 4 tiles wide (R107: 2)',!bad.link.length,bad.link.slice(0,3).join(' | '));
check('open floor: median width >=4, <=2% narrow tiles (R107: 30%), >=45% of tiles with an open 3x3 (R107: 8%)',!bad.open.length,bad.open.slice(0,3).join(' | '));
check('cells that are not linked stay walled off (no accidental openings between plazas and halls)',!bad.leak.length,bad.leak.slice(0,3).join(' | '));
check('maze size and shape: >=2600 floor tiles, >=66x66, <=600 walls, >=5 loops, <=8 one-cell stubs, >=3 dead ends, >=3 halls',!bad.shape.length,bad.shape.slice(0,3).join(' | '));
check('every cell centre (spawn site) is open floor at least 2 tiles from a wall',!bad.nodes.length,bad.nodes.slice(0,3).join(' | '));
check('the same seed rebuilds the identical maze (saved seeds stay valid)',!bad.det.length,bad.det.slice(0,3).join(' | '));
const avg=f=>rows.reduce((s,r)=>s+f(r),0)/rows.length;
check('averages: floor >=3500 (R107 2805), loops >=10 (R107 5), one-cell stubs <=3.5 (R107 21), dead ends <=12 (R107 44)',avg(r=>r.floor)>=3500&&avg(r=>r.loops)>=10&&avg(r=>r.stubs)<=3.5&&avg(r=>r.dead)<=12,JSON.stringify({floor:avg(r=>r.floor)|0,loops:+avg(r=>r.loops).toFixed(1),stubs:+avg(r=>r.stubs).toFixed(1),dead:+avg(r=>r.dead).toFixed(1)}));
// (a sanity bound only: a quiet machine builds a maze in ~10 ms, a loaded one in 10x that; R107's 14x14 generator was in the same range)
check('generation stays cheap (mean '+(genMs/made).toFixed(1)+' ms, max '+genMax.toFixed(1)+' ms per maze)',genMs/made<=150&&genMax<=2000,genMs.toFixed(0)+' ms for '+made);
// ---- the R103 default maze (no blueprint) uses the same core --------------------------------------------------
{const bad2=[];for(let i=1;i<16;i++)for(const seed of[1,42,12345]){const L=SM.mazeLayout(i,EP[i],seed),x=L.samongR103,d=bfsFrom(L,L.entry),F=floorSet(L),lw=linkWidths(L);
  const walk=d?d.get(key(Math.floor(x.exit.x),Math.floor(x.exit.y))):-1;if(!(d&&d.size===F.size&&walk>=60&&Math.min(...lw)>=4&&x.chests.length===3&&wallClear(L,x.save.x,x.save.y)>=1.9&&!leaks(L).length))bad2.push(i+'/'+seed+' walk '+walk);}
 check('R103 default maze (mazeLayout) shares the wide core: connected, 4-wide links, 3 chests, lamp clear of walls',!bad2.length,bad2.slice(0,3).join(' | '));}
// ---- dress: markers, chests, props stay off the walls on every stage -----------------------------------------------
const STAGES=i=>i===0?['ascent']:['survival','maze','ascent'];
const dress={marker:[],prop:[],reach:[],count:[],avoid:[],art:0,props:0,markers:0};
for(let i=0;i<EP.length;i++)for(const stage of STAGES(i)){const seeds=stage==='maze'?[1,99,12345]:[0];for(const seed of seeds){if(stage==='maze'){S.ep=i;S.seed=seed;S.stage='maze';}
 const L=SM.layoutFor(i,stage),x=L.samongR103,tag=EP[i].key+'/'+stage+'/'+seed,d=bfsFrom(L,L.entry),r={id:EP[i].host,layer:'DREAM',exploration:L,props:[],objective:{x:0,y:0},samongR103:{ep:i,stage},r99Trees:true};
 M.dress(r,i,stage,EP[i],{});const recs=r.props.filter(p=>p.r105Record),want=(BP[EP[i].key][stage].records||[]).reduce((n,rec)=>n+(rec.objects?rec.objects.length:1),0);
 if(recs.length!==want)dress.count.push(tag+' markers '+recs.length+'/'+want);dress.markers+=recs.length;
 for(const p of r.props){const c=wallClear(L,p.x,p.y);if(p.r105Record){if(c<1.9)dress.marker.push(tag+' '+p.id+' '+c.toFixed(2));if(!d||!d.has(key(Math.floor(p.x),Math.floor(p.y))))dress.reach.push(tag+' '+p.id);}else{dress.props++;if(c<1.4)dress.prop.push(tag+' '+p.id+' '+c.toFixed(2));}if(p.r105Art)dress.art++;}
 // props keep clear of the lamp, the exit and the chests (and markers of each other)
 const goals=[x.exit,x.save,...(x.chests||[])].filter(Boolean);for(const p of r.props)for(const g of goals)if(Math.hypot(p.x-g.x,p.y-g.y)<2)dress.avoid.push(tag+' '+p.id);
 for(let a=0;a<r.props.length;a++)for(let b=a+1;b<r.props.length;b++)if(r.props[a].r105Record&&r.props[b].r105Record&&Math.hypot(r.props[a].x-r.props[b].x,r.props[a].y-r.props[b].y)<2)dress.avoid.push(tag+' markers touch '+r.props[a].id);}}
S.ep=0;S.seed=0;S.stage='ascent';
check('every record marker keeps >=1.9 tiles from walls on reachable floor and the blueprint marker count is exact ('+dress.markers+' markers, all stages)',!dress.marker.length&&!dress.reach.length&&!dress.count.length,[...dress.marker,...dress.reach,...dress.count].slice(0,3).join(' | '));
check('every decor prop and drive-art prop keeps >=1.4 tiles from walls ('+dress.props+' props; R107 put them 0.5 from the wall)',!dress.prop.length,dress.prop.slice(0,3).join(' | '));
check('decor and markers keep >=2 tiles from the lamp, the exit and the chests, markers from each other',!dress.avoid.length,dress.avoid.slice(0,3).join(' | '));
check('narrative drive art still gets its places (reserved before generic props): >=130 art props',dress.art>=130,'art '+dress.art);
// ---- source guards ----------------------------------------------------------------------------------------------
const src=fs.readFileSync(path.join(SRC,'samong-r103.js'),'utf8'),src5=fs.readFileSync(path.join(SRC,'samong-maps-r105.js'),'utf8');
check('R107 flashlight (beam, graded ambient, story-style sight) is untouched',/function beamR107\(/.test(src)&&/rgba\(255,236,200,\.34\)/.test(src)&&/settings\.flashlight58!==true/.test(src));
check('R105 blueprint mazes delegate to mazeCore with the blueprint values',/api\.mazeCore\(id,ep,\{C,R,straight:bp\.straight,braid:bp\.braid,rooms:bp\.rooms/.test(src5)&&/MAZE_SCALE=1\.2/.test(src5));
check('spawn caps and save schema untouched',/maze:low\|\|mobile\?12:18/.test(src)&&/const REV='R103-samong-1\+R105',PREFIX='sm103-',VERSION=1,GOAL=666/.test(src));
const failed=results.filter(r=>!r.ok);
for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.name+(r.ok||!r.detail?'':' :: '+r.detail));
console.log(JSON.stringify({checks:results.length,failed:failed.length}));
process.exit(failed.length?1:0);
