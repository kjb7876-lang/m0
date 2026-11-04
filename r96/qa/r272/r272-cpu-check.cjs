// R272 CPU check: 병원 길잡이(중앙 준비실·보스방 문) · 777 앞질러 가기(이전 대신 다음 포탈) 오버레이 연결과 판단.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('guide-r272.js'),idx=RT('index.html');
ok('runtime copy matches; loads after hwando-r271/r277/manual-bonus-r274 (after every guideStep wrapper)',RT('guide-r272.js')===src&&idx.indexOf('hwando-r271.js')<idx.indexOf('guide-r272.js')&&idx.indexOf('guide-r272.js')<idx.indexOf('combat-r118.js'));
ok('in verify list, CI and manifest',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'guide-r272.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r272-cpu-check.cjs')&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('guide-r272.js'));
// 샌드박스에서 오버레이를 실제로 실행해 판단 함수를 꺼낸다.
let base=0;const sb={window:{},guideStep:()=>{base++;},setTimeout,console};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);
const G=sb.__STORYWORLD_GUIDE_R272__;
ok('exports decide/forwardRole and wraps guideStep',G&&typeof G.decide==='function'&&typeof G.forwardRole==='function'&&sb.guideStep.toString().includes('base.apply'));
const ctx={guide:true,modal:false,loading:false,hp:100,enemyNear:false,px:31.5,py:49.5,merge:{x:20,y:30,radius:3}};
ok('route phase with no enemy near → walk to merge (stall at 31.5,49.5 repro)',G.decide('route',ctx)==='merge');
ok('route phase: fighting enemy near → leave to native guide',G.decide('route',{...ctx,enemyNear:true})===null);
ok('route phase inside merge → nothing (rally fires natively)',G.decide('route',{...ctx,px:20.5,py:30.5})===null);
ok('guide off / modal / dead → nothing',[{guide:false},{modal:true},{hp:0},{loading:true}].every(o=>G.decide('route',{...ctx,...o})===null));
ok('door phase → door; other phases untouched',G.decide('door',ctx)==='door'&&['rally','boss','exit','done','doorStory'].every(p=>G.decide(p,ctx)===null));
const f={cheat:true,completed:true,pendingIdx:1,zoneIdx:13,nextOpen:true};
ok('777 + cleared + earlier pending + next open → forward (dreamRest repro)',G.forwardRole(f)===true);
ok('no forward without 777, uncleared map, pending ahead, or closed next portal',[{cheat:false},{completed:false},{pendingIdx:20},{nextOpen:false},{pendingIdx:-1}].every(o=>G.forwardRole({...f,...o})===false));
ok('777 forward: next portal behind a closed R81 door → open/walk to the door nearest the portal (never the ante-room door-1)',/function doorToward\(goal\)/.test(src)&&/d\.id!=='door-1'&&!W\.isOpen\(room,d\)/.test(src)&&/return doorToward\(st\.point\)/.test(src));
ok('R75 objective behind a closed R81 door (hando02 castle-start) → door nearest the objective; hospital excluded; holds between replans',/function objectiveDoor\(dt\)/.test(src)&&/if\(phase\(\)\)return false/.test(src)&&/doorToward\(g\.point\)/.test(src)&&/return oHold/.test(src));
{let opened=0,toasts=[];const sb2={window:{},guideStep:()=>{},setTimeout,console,guide:true,zone:'last303',openPanel:()=>{opened++;},toast:m=>toasts.push(m)};sb2.window=sb2;vm.createContext(sb2);vm.runInContext(src,sb2);
 const villager='<h2>주민 · 보호 대상</h2><p>목표 안내 · …</p><button id="narrativeNPCBackR75">돌아가기</button>';
 for(let i=0;i<30;i++)sb2.openPanel(villager);const looped=opened===0&&toasts.length===1;
 sb2.openPanel('<h2>상자</h2><button id="a">열기</button><button id="b">닫기</button>');const other=opened===1;
 vm.runInContext('guide=false',sb2);sb2.openPanel(villager);const manual=opened===2;
 ok('guide on: R75 info-only NPC panel (last303 villager MODAL-LOOP repro, 30 presses) → one toast, no panel; other panels and guide-off E unchanged',looped&&other&&manual&&sb2.__STORYWORLD_GUIDE_R272__.npcInfoOnly(villager)===true,{opened,toasts});}
{const W=G.wardRole,b={guide:true,modal:false,loading:false,hp:777,phase:'route',goal:'objective',anchor:{x:16,y:33},px:20.5,py:20.5};
 ok('R285 ward maps: route phase + R75 goal is the locked altar → walk to the gather room (dist04 boss-door stall repro)',W(b)===true);
 ok('R285 ward maps: enemy goal / rally / already at the gather room / guide off → native guide',[{goal:'enemy'},{phase:'rally'},{phase:'boss'},{px:16,py:32},{guide:false},{modal:true}].every(o=>W({...b,...o})===false));}
ok('R285: objective-door walk is skipped while the R78 boss door is sealed (route/rally), ward route runs before it',/\['route','rally'\]\.includes\(window\.__STORYWORLD_WORLD_COMBAT_R78__\?\.state\?\.\(room\)\?\.phase\)\)return false/.test(src)&&/if\(wardRoute\(dt\)\)return true;if\(objectiveDoor\(dt\)\)return true;/.test(src));
ok('no balance/progression writes (route/door/hp/difficulty untouched)',!/\.hp\s*=[^=]|difficultyR63\s*=|setMapMode|\.phase\s*=[^=]|progress\[/.test(src));
ok('base guide still runs when R272 has nothing to do',(sb.guideStep(.1),base===1));

// R272 렉: visual-r90 벽 테두리 outline() 칸 색인 — 결과는 원래 전수 비교와 같고 더 빠르다.
{const v90=C('visual-r90-world.js'),i0=v90.indexOf(' function outline(r,sources){'),i1=v90.indexOf(' function merged(');const body=v90.slice(i0,i1);
 const brute=body.replace("for(const f of near(e))","for(const f of raw)").replace("(triGrid.get(ck(Math.floor(x/CELL),Math.floor(z/CELL)))||[]).some(","tris.some(");
 class V{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}fromBufferAttribute(a,i){this.x=a.array[i*3];this.y=a.array[i*3+1];this.z=a.array[i*3+2];return this;}applyMatrix4(){return this;}clone(){return new V(this.x,this.y,this.z);}sub(o){this.x-=o.x;this.y-=o.y;this.z-=o.z;return this;}
  cross(o){const{x,y,z}=this;this.x=y*o.z-z*o.y;this.y=z*o.x-x*o.z;this.z=x*o.y-y*o.x;return this;}lengthSq(){return this.x**2+this.y**2+this.z**2;}normalize(){const l=Math.sqrt(this.lengthSq())||1;this.x/=l;this.y/=l;this.z/=l;return this;}lerp(o,t){this.x+=(o.x-this.x)*t;this.y+=(o.y-this.y)*t;this.z+=(o.z-this.z)*t;return this;}}
 const top=(x0,z0,x1,z1,h)=>{const a=[x0,h,z0, x0,h,z1, x1,h,z1, x0,h,z0, x1,h,z1, x1,h,z0];return{updateMatrixWorld(){},matrixWorld:null,material:{id:1},geometry:{attributes:{position:{array:a,count:6}},index:null}};};
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const walls=[];
 for(let k=0;k<160;k++){const x=Math.round(rnd()*60),z=Math.round(rnd()*60),hz=rnd()<.5,len=1+Math.round(rnd()*8);walls.push(hz?top(x,z-.12,x+len,z+.12,2.85):top(x-.12,z,x+.12,z+len,2.85));}
 const mk=src=>new Function('pointKey','cross',src+';return outline;')(p=>[p.x,p.y,p.z].map(n=>Math.round(n*10000)).join(':'),(ax,az,bx,bz)=>ax*bz-az*bx);
 const r={T:{Vector3:V}},key=o=>o.edges.map(e=>[e.a.x,e.a.z,e.b.x,e.b.z].map(n=>n.toFixed(4)).join()).join('|')+'#'+o.posts.length;
 let t=Date.now();const A=mk(brute)(r,walls);const tb=Date.now()-t;t=Date.now();const B=mk(body)(r,walls);const tg=Date.now()-t;
 ok('r90 outline grid index gives identical rims to brute force (160 random walls)',key(A)===key(B)&&A.edges.length>50,{a:A.edges.length,b:B.edges.length});
 ok('r90 outline grid index is faster ('+tb+'ms brute → '+tg+'ms grid)',tg<=tb,{tb,tg});}

// R272 렉: 못 찾은 길 기억(perf-r272)
{const ps=C('perf-r272.js');ok('perf-r272 loads right after guide-r272, in verify list',idx.indexOf('guide-r272.js')<idx.indexOf('perf-r272.js')&&idx.indexOf('perf-r272.js')<idx.indexOf('combat-r118.js')&&RT('perf-r272.js')===ps&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r272.js'"));
 let calls=0,gen=0;const roomA={id:'x'};const sb={window:{},performance:{now:()=>sb.__t},__t:0,localStorage:{getItem:()=>null,setItem(){}},setInterval(){},room:roomA,findPath:(f,t)=>{calls++;return t.x<0?[]:[t];},console};sb.window=sb;sb.__STORYWORLD_WORLD_R74__={generation:()=>gen};vm.createContext(sb);vm.runInContext(ps,sb);
 const fp=sb.findPath,P={x:1,y:1};fp(P,{x:-5,y:3},roomA,.31);fp(P,{x:-5,y:3},roomA,.31);const cachedFail=calls===1;fp(P,{x:5,y:3},roomA,.31);fp(P,{x:5,y:3},roomA,.31);const okNotCached=calls===3;
 sb.__t=2000;fp(P,{x:-5,y:3},roomA,.31);const expired=calls===4;gen=1;fp(P,{x:-5,y:3},roomA,.31);const doorBust=calls===5;
 ok('failed path remembered 1.5 s; found paths never cached; door generation change re-searches',cachedFail&&okNotCached&&expired&&doorBust,{calls});
 ok('ground command drop only when 3D floor rows exist; off switch',/floorRows\?\.size>0/.test(ps)&&/storyworld\.r272\.perf/.test(ps)&&/owner\?\.id==='ground'/.test(ps));}

// R272 조형물: 빈 기념비는 빼고, 무너진 계단은 실제 이동 지점 3.5칸 안만 남김(충돌 없는 소품만)
{const pr=C('props-r272.js');ok('props-r272 wired (index after perf-r272, verify list, runtime copy)',RT('props-r272.js')===pr&&idx.indexOf('perf-r272.js')<idx.indexOf('props-r272.js')&&idx.indexOf('props-r272.js')<idx.indexOf('combat-r118.js')&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'props-r272.js'"));
 const sb={window:{},localStorage:{getItem:()=>null},setInterval(){},setTimeout(){},getRoom:()=>null,console};sb.window=sb;vm.createContext(sb);vm.runInContext(pr,sb);const K=sb.__STORYWORLD_PROPS_R272__.keep;
 const pts=[{x:10,y:10}];
 ok('blank memorial always dropped; stairs kept only near a transition point',K({key:'memorial',path:'assets/props/v290/blank_memorial.webp',x:10,y:10},pts)===false&&K({key:'stairs',path:'assets/props/v290/collapsed_stairs.webp',x:12,y:12},pts)===true&&K({key:'stairs',path:'assets/props/v290/collapsed_stairs.webp',x:30,y:30},pts)===false);
 ok('statues, obelisks and other props untouched',['memory_archivist_statue.webp','time_obelisk.webp','broken_gate.webp','blood_altar.webp'].every(f=>K({key:'x',path:'assets/props/v290/'+f,x:50,y:50},pts)===true));
 const data=RT('index.html');const solid=[...data.matchAll(/"key":"(memorial|stairs)","path":"[^"]+"[^{}]*?"solid":(true|false)/g)].map(m=>m[2]);ok('every memorial/stairs prop in data is non-solid (collision unchanged)',solid.length>=30&&solid.every(v=>v==='false'),{n:solid.length});}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R272 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
