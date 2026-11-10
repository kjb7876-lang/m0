// R522 CPU check — 병원(ep1a08) 얇은 벽(미로 가림벽) 가운데 양 끝이 다 떠 있던 2곳을 굵은 벽에 붙인다(사용자 2026-11-10 "얇은벽은 항상 굵은 벽과 붙어있도록").
//  병원 본관에만 적용(같은 미로 틀을 쓰는 다른 지역·엔진 직접 호출은 원래 끝점), 길이 그대로 옮김, 길 연결 유지, 끄기 스위치.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='hospital-walls-r522.js';let src='';try{src=rd('client-source/'+F);}catch(e){ok('client source exists: '+e.message,false);}
let rt='';try{rt=rd('runtime-text/'+F);}catch(_){}
ok('runtime copy matches client source',!!src&&rt===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=rd('runtime-text/index.html');
ok('script tag once, right after hospital-rooms-r521 (before boss-r205); after the engine page defines __STORYWORLD_MAZE_R73__',html.split('"./'+F+'"').length===2&&/<script src="\.\/hospital-rooms-r521\.js"><\/script><script src="\.\/hospital-walls-r522\.js"><\/script>\s*<script src="\.\/boss-r205\.js">/.test(html)&&html.indexOf('__STORYWORLD_MAZE_R73__=Object.freeze')>0&&html.indexOf('__STORYWORLD_MAZE_R73__=Object.freeze')<html.indexOf('"./'+F+'"'));
ok('listed in verify-r96-public.py',/'hospital-walls-r522\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',/node r96\/qa\/r522\/r522-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const code=src.replace(/\/\/.*$/mg,'').replace(/\/\*[\s\S]*?\*\//g,'');
ok('touches only the two barrier entries: no hp/save/enemy/props/floor writes, no randomness, no draw wrappers',!/\.hp\s*=[^=]|saveGame|serializeSave|floorCells\s*=|\.enemies\s*=[^=]|\.props\s*=[^=]|Math\.random|drawProp|ctx\./.test(code));
// 엔진 묶음의 실제 가림벽 표
const eng=rd('runtime-text/dist/phase1.js'),mm=/"mazeBarriers":(\[.*?\]\}\])\}\)/.exec(eng);let TABLE=[];try{TABLE=JSON.parse(mm[1]);}catch(e){}
ok('engine barrier table read from the bundle: 20 entries incl. south-c-baffle [[48,97],[57,97]] and route-divider-middle [[31,68],[31,74]]',TABLE.length===20&&JSON.stringify(TABLE.find(b=>b.id==='south-c-baffle')?.endpoints)==='[[48,97],[57,97]]'&&JSON.stringify(TABLE.find(b=>b.id==='route-divider-middle')?.endpoints)==='[[31,68],[31,74]]');
const ORIG=JSON.stringify(TABLE);
function world(store={},{maze=true}={}){const H=Object.freeze({mazeBarriers:JSON.parse(ORIG)});let seeds=0,vers=0;
 const sb={console,Math,JSON,Object,Array,Number,String,Set,Map,WeakMap,Promise,Date,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
  StoryPhase1:Object.freeze({HOSPITAL_CORE_B2:H}),__STORYWORLD_MAZE_R73__:maze?Object.freeze({seed:(id,l)=>{seeds++;return 7;},run:()=>3,keep:1}):undefined,__STORYWORLD_WORLD_R74__:Object.freeze({version:(id,l)=>{vers++;return 2;},openedFor:()=>['door-0'],keep:2})};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:F});return{sb,H,api:sb.__STORYWORLD_HOSPITAL_WALLS_R522__,ep:()=>JSON.stringify(H.mazeBarriers.map(b=>({id:b.id,endpoints:b.endpoints}))),get:id=>JSON.stringify(H.mazeBarriers.find(b=>b.id===id).endpoints),counts:()=>[seeds,vers]};}
let W=null;try{W=world();}catch(e){ok('overlay runs: '+e.message,false);}
const A=W?.api;
ok('API frozen with revision/MOVES/set/inspect',!!A&&Object.isFrozen(A)&&/^R522-hospital-walls-\d+$/.test(A.revision||'')&&typeof A.set==='function'&&typeof A.inspect==='function');
ok('at rest (no layout being built) the table reads exactly as the engine wrote it — direct engine calls and layout-validation see the original 20',!!W&&W.ep()===ORIG);
if(W){const S=W.sb;
 ok('the seed/version hooks keep the rest of their objects and results (frozen, same values, base called once each)',S.__STORYWORLD_MAZE_R73__.seed('dist01','STORY')===7&&S.__STORYWORLD_MAZE_R73__.run()===3&&S.__STORYWORLD_MAZE_R73__.keep===1&&Object.isFrozen(S.__STORYWORLD_MAZE_R73__)&&S.__STORYWORLD_WORLD_R74__.version('dist01','STORY')===2&&S.__STORYWORLD_WORLD_R74__.keep===2&&String(S.__STORYWORLD_WORLD_R74__.openedFor())==='door-0'&&String(W.counts())==='1,1');
 ok('while another region is being built (same ward-maze template): original endpoints',W.ep()===ORIG);
 S.__STORYWORLD_MAZE_R73__.seed('ep1a08','STORY');
 ok('while the hospital (ep1a08) is being built: south-c-baffle → [[53,97],[62,97]], route-divider-middle → [[33,68],[33,74]]',W.get('south-c-baffle')==='[[53,97],[62,97]]'&&W.get('route-divider-middle')==='[[33,68],[33,74]]');
 ok('…and the other 18 barriers are untouched',JSON.stringify(JSON.parse(W.ep()).filter(b=>!/^(south-c-baffle|route-divider-middle)$/.test(b.id)))===JSON.stringify(JSON.parse(ORIG).filter(b=>!/^(south-c-baffle|route-divider-middle)$/.test(b.id))));
 ok('moved endpoints are handed out as fresh copies (engine code cannot corrupt the table)',(()=>{const b=W.H.mazeBarriers.find(b=>b.id==='south-c-baffle'),e=b.endpoints;e[0][0]=999;return W.get('south-c-baffle')==='[[53,97],[62,97]]';})());
 S.__STORYWORLD_MAZE_R73__.seed('dist02','STORY');ok('next region build switches back to the original',W.ep()===ORIG);
 S.__STORYWORLD_WORLD_R74__.version('ep1a08','STORY');ok('the version hook marks the hospital too (seed is skipped in some modes)',W.get('south-c-baffle')==='[[53,97],[62,97]]');
}
(async()=>{
 if(W){await Promise.resolve();await Promise.resolve();ok('the mark clears itself after the synchronous build (microtask) — later direct engine calls read the original',W.ep()===ORIG);
  ok('stats count hospital builds',W.api.inspect().stats.hospital>=2);}
 {const o=world({'storyworld.r522.walls':'{"on":false}'});o.sb.__STORYWORLD_MAZE_R73__.seed('ep1a08','STORY');ok('off switch: hospital keeps the original walls',o.ep()===ORIG);
  const t=world();t.api.set({on:false});t.sb.__STORYWORLD_MAZE_R73__.seed('ep1a08','STORY');ok('set({on:false}) at runtime turns it off and persists',t.ep()===ORIG&&JSON.parse(t.sb.localStorage.getItem('storyworld.r522.walls')).on===false);
  const b=world({'storyworld.r522.walls':'{{'});b.sb.__STORYWORLD_MAZE_R73__.seed('ep1a08','STORY');ok('broken setting JSON falls back to on',b.get('south-c-baffle')==='[[53,97],[62,97]]');
  let threw=false;try{const m=world({}, {maze:false});m.sb.__STORYWORLD_WORLD_R74__.version('ep1a08','S');threw=m.get('south-c-baffle')!=='[[53,97],[62,97]]';}catch(e){threw=true;}ok('missing R73 seed object does not break loading (version hook still works)',!threw);
  let ok2=true;try{const sb={console,Math,JSON,Object,Array,Number,String,Promise,localStorage:{getItem:()=>null,setItem(){}}};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);ok2=!!sb.__STORYWORLD_HOSPITAL_WALLS_R522__&&sb.__STORYWORLD_HOSPITAL_WALLS_R522__.inspect().installed===false;}catch(e){ok2=false;}ok('no engine table at all → installs nothing, no throw',ok2);}
 // ---- 실측 지도에서의 결과 -------------------------------------------------------------------------
 const FX=JSON.parse(fs.readFileSync(path.join(__dirname,'..','r521','hospital-layout.json'),'utf8'));
 const floor=new Set();for(const r of FX.floorRects)for(let x=r.x;x<r.x+r.width;x++)for(let y=r.y;y<r.y+r.depth;y++)floor.add(x+','+y);
 const onFloor=(x,y)=>floor.has(Math.floor(x)+','+Math.floor(y));
 const MOVES=A?.MOVES||{},moved=TABLE.map(b=>({id:b.id,endpoints:MOVES[b.id]||b.endpoints}));
 const boxOf=([a,z])=>[Math.min(a[0],z[0])-.12,Math.min(a[1],z[1])-.12,Math.max(a[0],z[0])+.12,Math.max(a[1],z[1])+.12];
 const isB=w=>{const[x0,y0,x1,y1]=w.ab;return TABLE.some(b=>{const q=boxOf(b.endpoints);return Math.abs(q[0]-x0)<.01&&Math.abs(q[1]-y0)<.01&&Math.abs(q[2]-x1)<.01&&Math.abs(q[3]-y1)<.01;});};
 const shell=FX.walls.filter(w=>!isB(w)).map(w=>w.ab);
 ok('fixture: 193 walls = 173 shell walls + 20 barriers',FX.walls.length===193&&shell.length===173);
 const touch=(p,o)=>{/* 끝점에서 벽이 뻗는 방향으로 .4칸 더 간 자리가 바닥 밖(굵은 벽 덩어리)인가 */const d=Math.hypot(p[0]-o[0],p[1]-o[1]),ux=(p[0]-o[0])/d,uy=(p[1]-o[1])/d;return !onFloor(p[0]+ux*.4,p[1]+uy*.4);};
 const ends=b=>{const[a,z]=b.endpoints;return[touch(a,z),touch(z,a)];};
 ok('before: exactly these two barriers had both ends free',JSON.stringify(TABLE.filter(b=>!ends(b).some(Boolean)).map(b=>b.id).sort())==='["route-divider-middle","south-c-baffle"]');
 ok('after: every one of the 20 thin walls has at least one end on a thick wall',moved.every(b=>ends(b).some(Boolean)));
 const len=e=>Math.hypot(e[1][0]-e[0][0],e[1][1]-e[0][1]);
 ok('moved, not stretched: same length, same direction, integer endpoints, shifted 5 and 2 tiles',Object.keys(MOVES).length===2&&Object.entries(MOVES).every(([id,e])=>{const o=TABLE.find(b=>b.id===id).endpoints;return len(e)===len(o)&&(e[0][0]===e[1][0])===(o[0][0]===o[1][0])&&e.flat().every(Number.isInteger);})&&MOVES['south-c-baffle'][0][0]-48===5&&MOVES['route-divider-middle'][0][0]-31===2);
 ok('moved walls lie on floor for their whole length (not inside wall mass)',Object.values(MOVES).every(([a,z])=>{for(let t=.05;t<1;t+=.05){const x=a[0]+(z[0]-a[0])*t,y=a[1]+(z[1]-a[1])*t;if(!onFloor(x-.2,y-.2)||!onFloor(x+.2,y+.2))return false;}return true;}));
 // 길 연결: 반 칸 격자, 몸 반지름 .29 로 벽 상자를 부풀려 막고, 시작 자리에서 번져 나간다
 const reach=bars=>{const boxes=shell.concat(bars.map(b=>boxOf(b.endpoints))),R=.29,free=(x,y)=>onFloor(x,y)&&!boxes.some(q=>x>q[0]-R&&x<q[2]+R&&y>q[1]-R&&y<q[3]+R),k=(i,j)=>i+','+j,seen=new Set(),st=[[Math.round(FX.entry.x*2),Math.round(FX.entry.y*2)]];
  while(st.length){const[i,j]=st.pop(),t=k(i,j);if(seen.has(t)||!free(i/2+.01,j/2+.01))continue;seen.add(t);st.push([i+1,j],[i-1,j],[i,j+1],[i,j-1]);}
  const near=p=>{for(let di=-3;di<=3;di++)for(let dj=-3;dj<=3;dj++)if(seen.has(k(Math.round(p.x*2)+di,Math.round(p.y*2)+dj)))return true;return false;};
  return{cells:seen.size,nodes:FX.nodes.filter(near).map(q=>q.id).join(','),starts:FX.starts.filter(near).length,obj:near(FX.objective),gate:near(FX.gate)};};
 const r0=reach(TABLE),r1=reach(moved);console.log('     reach before',JSON.stringify({s:r0.starts,o:r0.obj,g:r0.gate}),'after',JSON.stringify({s:r1.starts,o:r1.obj,g:r1.gate}));
 ok('routes stay connected: the same nodes ('+r1.nodes.split(',').length+'/60 — the other 4 are behind the closed boss door in the fixture, before and after), 3 starts, gate and objective are reachable as before; walkable area changes by less than 1% ('+r0.cells+' → '+r1.cells+')',r0.nodes===r1.nodes&&r1.nodes.split(',').length===56/* 나머지 4곳(combat·observation·observation-link·exit-vestibule)은 실측 지도에서 닫힌 보스실 문 뒤 — 옮기기 전에도 같다 */&&r1.starts===3&&r0.starts===3&&r1.obj===r0.obj/* 목표는 닫힌 보스실 문 뒤(실측 지도) — 전후 같음 */&&r1.gate&&r0.gate&&Math.abs(r1.cells-r0.cells)/r0.cells<.01);
 const dseg=(p,[a,z])=>{const vx=z[0]-a[0],vy=z[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*vx+(p.y-a[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(p.x-a[0]-vx*t,p.y-a[1]-vy*t);};
 const hit=(e)=>[...FX.nodes.map(q=>q.name),...FX.starts.map(s=>s.id)].filter((nm,i)=>dseg(i<FX.nodes.length?FX.nodes[i]:FX.starts[i-FX.nodes.length],e)<.6);
 ok('no route node or start spot ends up inside a moved wall that was not already on the old one (south-ward-c sat on its baffle before and still sits at its end)',String(hit(MOVES['route-divider-middle']||[[0,0],[1,0]]))===''&&String(hit(MOVES['south-c-baffle']||[[0,0],[1,0]]))==='south-ward-c'&&String(hit([[48,97],[57,97]]))==='south-ward-c');
 ok('doors and the boss room are not near the moved walls',Object.values(MOVES).every(e=>FX.doors.every(d=>dseg({x:d.x+d.width/2,y:d.y},e)>6)&&!(e[0][0]>9&&e[0][0]<29&&e[0][1]>5&&e[0][1]<19)));
 console.log('\nR522 '+(n-bad)+'/'+n+(bad?' FAILED':' passed'));process.exit(bad?1:0);
})();
