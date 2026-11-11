// R702 CPU check — 영화 모드 보스 '도리도리'(사용자 2026-11-11 "영화모드에서 보스가 도리도리하면서 방향을 못잡는 버그").
//  헤드리스 실측(거미 동굴 보라검천사, 영화 모드 길잡이): 보스가 영웅을 쫓아 격자 길을 대각선 계단(+x 0.35초 → +y 0.35초 …)으로 걸을 때
//  R444 '걷기' 좌우가 계단 한 칸마다 바뀌어 0.35초마다 좌우로 뒤집혔다(8초에 16번). 화면 가로 = x−y 라서 +x 칸은 오른쪽, +y 칸은 왼쪽.
//  고친 뒤 기대: 계단 걷기는 지난 걸음 묶음(약 1.2칸)의 실제 진행 방향으로 보고 뒤집지 않는다. 진짜로 돌아설 때는 0.45초 안에 따라간다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='enemy-face-r444.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
ok('pages.yml runs this check',/r96\/qa\/r702\/r702-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function env(){const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:-60,y:60,hp:100},settings:{},read:[]};
 E.window=E;E.drawEnemy=function(e){E.read.push(e.direction);};E.shadow=function(){};vm.createContext(E);vm.runInContext(src,E);return E;}
const mob=o=>({id:1,name:'보스',x:16,y:12,hp:1e4,maxHp:1e4,speed:1.7,spawnState:'active',direction:'right',boss:true,combatProfile:{aggro:7,attackShape:{range:1.6}},...o});
function frames(E,e,n,step,dt=1/60){for(let i=0;i<n;i++){E.time+=dt;if(step)step(e,i,E.time);E.drawEnemy(e);}return E.read[E.read.length-1];}
const flipsIn=(arr)=>{let f=0;for(let i=1;i<arr.length;i++)if(arr[i]!==arr[i-1])f++;return f;};
// 1) 계단 대각선(실측과 같은 꼴): +x 0.35초, +y 0.35초 번갈아, 속도 1.4칸/초 — 화면에선 똑바로 아래로 걷는 것
for(const [leg,label] of [[.35,'0.35s legs (measured)'],[.25,'0.25s legs'],[.5,'0.5s legs']]){const E=env(),e=mob({});frames(E,e,1);E.read.length=0;
 frames(E,e,8*60,(e,i,t)=>{const ph=Math.floor(t/leg)%2;if(ph)e.y+=1.4/60;else e.x+=1.4/60;});
 const f=flipsIn(E.read.slice(30));ok(`staircase walk down-screen (${label}): side flips ≤ 1 in 8s (got ${f})`,f<=1);}
// 2) 계단이 화면 오른쪽 아래(+x 더 길게): 진행 방향이 오른쪽이면 오른쪽으로 고정
{const E=env(),e=mob({direction:'left'});frames(E,e,1);E.read.length=0;
 frames(E,e,8*60,(e,i,t)=>{const ph=Math.floor(t/.35)%3;if(ph<2)e.x+=1.4/60;else e.y+=1.4/60;});
 const tail=E.read.slice(120),f=flipsIn(tail);ok(`staircase with net right drift settles right and stays (flips ${f}, last ${tail[tail.length-1]})`,f===0&&tail[tail.length-1]==='right');}
// 3) 회귀: 진짜로 돌아서면 따라간다(오른쪽 1.5초 → 왼쪽): 0.45초 안에 왼쪽
{const E=env(),e=mob({});frames(E,e,1);const d1=frames(E,e,90,e=>{e.x+=1.7/60;});ok('walk right → right',d1==='right');
 let at=null;frames(E,e,90,(e,i)=>{e.x-=1.7/60;if(at===null&&e.direction==='left')at=i;});
 at=E.read.slice(-90).indexOf('left');ok(`real turn left followed within 0.45s (frame ${at})`,at>=0&&at<=27);}
// 4) 회귀: 긴 지그재그(1.2초마다 진짜 좌우 방향 바꿈)는 매번 따라간다
{const E=env(),e=mob({});frames(E,e,1);E.read.length=0;frames(E,e,6*60,(e,i,t)=>{const ph=Math.floor(t/1.2)%2;e.x+=(ph?-1:1)*1.7/60;e.y-=(ph?-1:1)*0.2/60;});
 const f=flipsIn(E.read);ok(`long zigzag (1.2s legs) still turns each leg (flips ${f} ≈ 4)`,f>=4&&f<=5);}
// 5) 회귀: 처음 걷기 시작(멈춤 → 왼쪽)도 바로 따라간다
{const E=env(),e=mob({direction:'right'});frames(E,e,1);frames(E,e,20);let at=-1;frames(E,e,40,(e,i)=>{e.x-=1.7/60;if(at<0&&e.direction==='left')at=i;});ok(`start walking left from rest: left within 0.3s (frame ${at})`,at>=0&&at<=18);}
// 6) 회귀: 공격 준비는 판정 각으로 바로(계단 기억과 무관)
{const E=env(),e=mob({});frames(E,e,1);frames(E,e,60,(e,i,t)=>{if(Math.floor(t/.35)%2)e.y+=1.4/60;else e.x+=1.4/60;});
 e.attack={angle:Math.PI,elapsed:0};const d=frames(E,e,1);ok('attack lock: faces the attack angle immediately (left)',d==='left');e.attack=null;}

// ---- 렉: 영화 모드는 길잡이가 늘 켜져 있다. 헤드리스 실측(ep1b03 영화 모드 25초): R272 wardRoute 가 0.5초마다 전체 길찾기(findPath)를 다시 해
//  한 번에 최대 75ms(헤드리스 CPU) 끊김을 냈다. 같은 목표로 가는 길을 따라가는 중이면 다시 찾지 않는다(길이 끝나거나·바뀌거나·벗어나거나·3초 지나면 다시).
{const G2=C('guide-r272.js');ok('guide-r272 runtime copy matches client source',RT('guide-r272.js')===G2);
 function genv(){const sb={console,Math,JSON,Number,String,Object,Map,Set,Array,setTimeout,window:null,guideStep:()=>{},guide:true,modal:false,loading:false,storyScene:null,command:null,route:[],zone:'dist04',
  room:{id:'dist04',engaged:false,exploration:{worldWardR81:{gatherAnchor:{x:30,y:30}}}},player:{x:5,y:5,hp:100},nearestEnemy:()=>null,blocked:()=>false,calls:0};sb.window=sb;
  // 실제 findPath 는 꺾이는 길목만 돌려줘 첫 점이 20칸 넘게 멀 수 있다(실측 far:20.95) → 성긴 길(sparse)도 시험한다
  sb.findPath=(a,b)=>{sb.calls++;const out=[];if(sb.sparse){out.push({x:a.x+(b.x-a.x)*.6,y:a.y},{x:b.x,y:b.y});return out;}const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));for(let i=1;i<=n;i++)out.push({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n});return out;};
  sb.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:'route'})};sb.__STORYWORLD_GUIDE_R75__={currentGoal:()=>({kind:'objective'})};vm.createContext(sb);vm.runInContext(G2,sb);return sb;}
 // 엔진처럼 길을 따라 걷는다(초당 2칸, 길 첫 점에 닿으면 shift)
 const walk=(sb,dt)=>{const r=vm.runInContext('route',sb);if(!r.length)return;const q=r[0],P=sb.player,d=Math.hypot(q.x-P.x,q.y-P.y),s=2*dt;if(d<=s+.04){P.x=q.x;P.y=q.y;r.shift();}else{P.x+=(q.x-P.x)/d*s;P.y+=(q.y-P.y)/d*s;}};
 {const sb=genv();for(let i=0;i<300;i++){sb.guideStep(1/60);walk(sb,1/60);}ok(`ward route: following the same path for 5s re-plans ≤ 2 times (got ${sb.calls}, was every 0.5s = 10)`,sb.calls<=2);
  ok('ward route: still walking toward the gather anchor',sb.player.x>12&&vm.runInContext('route',sb).length>0);}
 {const sb=genv();sb.sparse=true;for(let i=0;i<300;i++){sb.guideStep(1/60);walk(sb,1/60);}ok(`ward route (sparse corner path, first corner ~15 tiles away): 5s re-plans ≤ 2 (got ${sb.calls})`,sb.calls<=2&&sb.player.x>12);}
 {const sb=genv();sb.sparse=true;for(let i=0;i<60;i++){sb.guideStep(1/60);walk(sb,1/60);}const c0=sb.calls;sb.player.x-=5;sb.player.y-=3;for(let i=0;i<36;i++)sb.guideStep(1/60);ok(`ward route (sparse): pushed away from the next corner → re-planned within 0.6s (calls ${c0}→${sb.calls})`,sb.calls>c0);}
 {const sb=genv();for(let i=0;i<60;i++){sb.guideStep(1/60);walk(sb,1/60);}const c0=sb.calls;vm.runInContext('route=[]',sb);for(let i=0;i<36;i++){sb.guideStep(1/60);walk(sb,1/60);}
  ok(`ward route: path cleared by someone else → re-planned within 0.6s (calls ${c0}→${sb.calls})`,sb.calls>c0&&vm.runInContext('route',sb).length>0);}
 {const sb=genv();for(let i=0;i<60;i++){sb.guideStep(1/60);walk(sb,1/60);}const c0=sb.calls;sb.player.x+=6;sb.player.y-=4;for(let i=0;i<36;i++)sb.guideStep(1/60);
  ok(`ward route: knocked/teleported off the path → re-planned within 0.6s (calls ${c0}→${sb.calls})`,sb.calls>c0);}
 {const sb=genv();for(let i=0;i<60;i++){sb.guideStep(1/60);walk(sb,1/60);}const c0=sb.calls;sb.room.exploration.worldWardR81.gatherAnchor={x:8,y:40};for(let i=0;i<36;i++)sb.guideStep(1/60);
  ok(`ward route: goal moved → re-planned within 0.6s (calls ${c0}→${sb.calls})`,sb.calls>c0);}
}

// ---- 렉 2: 목표(제단)가 닫힌 문 너머일 때 R272 objectiveDoor 가 0.6초마다 '실패하는' 전체 길찾기(+문 앞 길찾기 최대 4번)를 되풀이했다
//  (헤드리스 ep1b03 실측: 한 번 397~405ms). 목표·문 상태가 그대로면 3초에 한 번만 다시 묻고, 문이 열리거나 목표가 바뀌면 바로 다시 묻는다.
{const G2=C('guide-r272.js');
 function oenv(){const sb={console,Math,JSON,Number,String,Object,Map,Set,Array,setTimeout,window:null,guideStep:()=>{},guide:true,modal:false,loading:false,storyScene:null,command:null,route:[],zone:'ep1b03',
  room:{id:'ep1b03',engaged:false,exploration:{worldR74:{doors:[{id:'door-2',x:20,y:20,axis:'x'}]}}},player:{x:5,y:5,hp:100},nearestEnemy:()=>null,blocked:()=>false,goalCalls:0,doorCalls:0,open:false};sb.window=sb;
  sb.findPath=(a,b)=>{if(b.x===40&&b.y===40){sb.goalCalls++;return sb.open?[{x:40,y:40}]:[];}sb.doorCalls++;return [{x:b.x,y:b.y}];};
  sb.__STORYWORLD_WORLD_R74__={isOpen:()=>sb.open,canUse:()=>false,use:()=>false};
  sb.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:'exit'})};sb.__STORYWORLD_GUIDE_R75__={currentGoal:()=>({kind:'objective',point:{x:40,y:40}})};vm.createContext(sb);vm.runInContext(G2,sb);return sb;}
 {const sb=oenv();for(let i=0;i<300;i++)sb.guideStep(1/60);
  ok(`objective behind a shut door: unreachable re-check ≤ 3 times in 5s (got ${sb.goalCalls} goal + ${sb.doorCalls} door searches; was every 0.6s)`,sb.goalCalls<=3&&sb.doorCalls<=6);
  ok('objective behind a shut door: still walks to the door',vm.runInContext('route',sb).length>0&&sb.__STORYWORLD_GUIDE_R272__.inspect().stats.doorWalk>0);}
 {const sb=oenv();for(let i=0;i<60;i++)sb.guideStep(1/60);const c0=sb.doorCalls;vm.runInContext('route=[]',sb);for(let i=0;i<42;i++)sb.guideStep(1/60);
  ok(`reached the door (path used up) → door step runs again within 0.7s, no 3s idle (door calls ${c0}→${sb.doorCalls})`,sb.doorCalls>c0);}
 {const sb=oenv();for(let i=0;i<60;i++)sb.guideStep(1/60);const c0=sb.goalCalls;sb.open=true;for(let i=0;i<42;i++)sb.guideStep(1/60);
  ok(`door opens → goal re-checked within 0.7s (goal calls ${c0}→${sb.goalCalls})`,sb.goalCalls>c0);}
 {const sb=oenv();for(let i=0;i<60;i++)sb.guideStep(1/60);const c0=sb.goalCalls;sb.__STORYWORLD_GUIDE_R75__={currentGoal:()=>({kind:'objective',point:{x:40,y:40.5}})};sb.findPath=(a,b)=>{sb.goalCalls++;return [];};for(let i=0;i<42;i++)sb.guideStep(1/60);
  ok(`goal moves → re-checked within 0.7s (calls ${c0}→${sb.goalCalls})`,sb.goalCalls>c0);}
}
console.log(`R702 ${n-bad}/${n} pass`);process.exit(bad?1:0);
