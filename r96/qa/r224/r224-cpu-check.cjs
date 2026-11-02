// R224 CPU check: 실내 방형식 — 방 직사각형 키우기(방 사이 1칸 벽·원래 통로는 출입구), 문 닫힘 우회 없음, 낮은 벽, 방 가구.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('cave-r204.js');
ok('runtime copy matches; in the CI workflow',RT('cave-r204.js')===src&&/qa\/r224\/r224-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('rooms mode is the default for interiors and can be switched off',/rooms:true[,}]/.test(src)&&/rooms:prefs\.rooms!==false/.test(src)&&/prefs\.rooms=p\.rooms/.test(src));
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{__STORYWORLD_ASSETS_R80_DATA__:{assets:Object.fromEntries(['r80-141','r80-142','r80-143','r80-144','r80-145','r80-146','r80-148','r80-149'].map(id=>[id,{path:'assets/world-r80/'+id+'.webp',scale:1.2}]))},StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);vm.runInContext('var room=null,player={x:0,y:0};function blocked(){return false;}function makeRoom(id){return {id,layer:"STORY",props:[],enemies:[]};}async function enterRegion(){return true;}var ensureImages=()=>Promise.resolve();',sb);vm.runInContext(src,sb);
const API=sb.window.__STORYWORLD_CAVE_R204__;
// 가상 지도 48×36: 방 A(4..11,4..9) · 복도(12..21,y 6..7) · 방 B(22..29,4..9) · 방 B 아래 앞방 C(22..27,y 14..18) — 가로 문(door-1, y=12)이 있는 통로(24..25,y 10..13)로만 이어짐.
const cells=[];const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells.push([x,y]);};
rect(4,4,11,9);rect(12,6,21,7);rect(22,4,29,9);rect(24,10,25,13);rect(22,14,27,18);
const uniq=[...new Map(cells.map(c=>[c+'',c])).values()];
const rooms=[{id:0,x:8,y:7,width:8,depth:6},{id:1,x:26,y:7,width:8,depth:6},{id:2,x:25,y:16.5,width:6,depth:5}];
const L0={bounds:[0,0,48,36],floorCells:uniq,walls:[{id:'t',x:0,y:0,width:1,depth:.24,height:2.85,endpoints:[[4,4],[12,4]]}],entry:{x:5.5,y:5.5},worldR74:{doors:[{id:'door-1',x:25,y:12,width:2,depth:.24}],rooms}};
const out=API.inflate(L0,{depth:3,rooms:true,wallH:1.3}),F=new Set(out.floorCells.map(c=>c[0]+','+c[1])),O=new Set(uniq.map(c=>c[0]+','+c[1])),has=(x,y)=>F.has(x+','+y);
ok('rooms grow (more floor) and keep every original cell',out.floorCells.length>uniq.length*1.5&&[...O].every(k=>F.has(k)),{before:uniq.length,after:out.floorCells.length});
const RR=out.r224Rooms||[];
ok('grown room rectangles are reported and each is fully floor (rectangular rooms)',RR.length===3&&RR.every(r=>{for(let y=r.y0;y<r.y1;y++)for(let x=r.x0;x<r.x1;x++)if(!has(x,y))return false;return true;}),RR);
ok('rooms keep at least a 1-cell gap from each other (the gap is the wall)',RR.every((a,i)=>RR.every((b,j)=>i===j||a.x1+1<=b.x0||b.x1+1<=a.x0||a.y1+1<=b.y0||b.y1+1<=a.y0)),RR);
ok('the original corridor still crosses the gap between A and B (doorway)',has(12,6)&&has(21,7));
ok('the map edge stays a 1-cell outer wall',[...F].every(k=>{const [x,y]=k.split(',').map(Number);return x>=1&&y>=1&&x<=46&&y<=34;}));
const cut=(x,y,dx,dy)=>!dx&&x>=24&&x<=25&&(dy===1&&y===11||dy===-1&&y===12);
const reach=S=>{const seen=new Set(['5,5']),q=[[5,5]];for(let h=0;h<q.length;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(S.has(k)&&!seen.has(k)&&!cut(x,y,dx,dy)){seen.add(k);q.push([x+dx,y+dy]);}}}return seen;};
const a=reach(O),b=reach(F),leak=[...O].filter(k=>!a.has(k)&&b.has(k));
ok('fixture: with door-1 closed room C is unreachable before growing',!a.has('25,16')&&a.has('26,6'));
ok('no closed-door bypass after growing rooms',leak.length===0,leak.slice(0,5));
ok('room C does not grow into the door zone',!RR[2]||RR[2].y0>=13,RR[2]);
ok('new walls are low cutaway walls (1.3) marked r224Room',out.walls.filter(w=>w.r224Room).length>0&&out.walls.filter(w=>w.r224Room).every(w=>w.height===1.3));
// 가구
const rm={id:'ep1a09',props:[],exploration:out,objective:{x:8,y:7}};
const n=API.furnish(rm,{kind:'clinic',seed:7},'ep1a09');
const F2=rm.props.filter(q=>q.r224Furniture);
ok('furniture: pieces are placed (art from world-r80 clinic set), non-blocking',n>0&&F2.every(q=>q.solid===false&&/^r80-1(4[1-9]|5[0-2])$/.test(q.r80Art)),F2.slice(0,3));
ok('furniture: never within reach of a door, the entry or the objective',F2.every(q=>Math.hypot(q.x-25,q.y-12)>=3.2&&Math.hypot(q.x-5.5,q.y-5.5)>=3&&Math.hypot(q.x-8,q.y-7)>=3));
ok('furniture: only once per room object',API.furnish(rm,{kind:'clinic',seed:7},'ep1a09')===0);
ok('room labels: entering another room in an interior shows its name once (not in combat, not the first room on arrival)',/function roomLabelTick\(\)/.test(src)&&/if\(first\|\|room\.engaged\)return;/.test(src)&&/k===lastRoomKey\)return/.test(src));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,400)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
