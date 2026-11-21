'use strict';
// R1301 CPU 검사: 아르벨리아(kair02) 길잡이 '길 없음' 재탐색 멈칫(perf-r1301.js) — 사용자 2026-11-21 "아르벨리아 유예의 수문장 맵으로 들어가니 렉이 심해지는건지 … 조사해서 개선".
//  측정(헤드리스, main fff42be, 777 → kair02 길잡이 켬, 30초): 영웅 자리에서 떠나는 '길 없음' findPath 20번 1.7~2.3초.
//   한 장면에 목표 4곳(보스방 제단 15,13 · 문턱 20,19.1 · 5,5.1 · 5,6.9)을 연달아 물어 270+275+190+70ms ≈ 0.8초 멈춤이 4~5초마다.
//   R979 는 '길 없음'을 6초 기억하지만 지난번 물은 자리에서 12칸 넘게 떨어지면 버린다 — 순간이동이 없어도, 싸우느라 묻지 않는 동안
//   긴 회랑(kair02 는 세로 100칸 넘음)을 걸어 12칸을 넘기면 버려진다(R979 moved 4/8). 다른 맵(kair04)은 같은 30초에 0.2초.
//  고침: 영웅 위치를 매 프레임 보고 '한 프레임에 2.5칸 넘게 뛰었는가(순간이동)·방이 바뀌었는가'만 세대로 센다. 걸어서는 벽을 못 넘으므로
//   같은 세대 안의 '길 없음'은 그대로다 → 열쇠(방·도착 칸·반지름·문 세대·R78 단계·병원 단계·engaged·레이아웃·순간이동 세대)로 게임 시간 20초 기억.
//  ① 연결 5곳 ② 걷다 쉬다 다시 묻기(옛 코드 재현: 재탐색 반복) → 목표마다 1번 ③ 순간이동·문 세대·단계·engaged·레이아웃·방 바뀜 → 곧바로 다시
//  ④ 20초 경계(19.9 기억·20.1 다시) ⑤ 길이 있는 결과·몹 출발·막힌 출발은 기억 안 함 ⑥ 끄기·inspect·이상한 인자 ⑦ 엔진 함수 덮어쓰기 없음
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..','..'),ROOT=path.resolve(root,'..');const F='perf-r1301.js',FILE=path.join(root,'client-source',F);
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name+(ok||detail===''?'':' :: '+detail));};
const done=()=>{const failed=results.filter(r=>!r.ok).length;console.log(JSON.stringify({total:results.length,failed,method:'node vm (real R979/R272/R360 overlays + fake engine findPath); headless browser check separate'}));process.exit(failed?1:0);};
check(F+' exists',fs.existsSync(FILE));if(!fs.existsSync(FILE))done();
const src=fs.readFileSync(FILE,'utf8');const rd=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');
// ① 연결 5곳
const html=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');
check('① runtime-text 사본 같음',fs.existsSync(path.join(root,'runtime-text',F))&&fs.readFileSync(path.join(root,'runtime-text',F),'utf8')===src);
{const at=f=>html.indexOf('<script src="./'+f+'"></script>');check('① index.html 한 번, ego-auto-r1292 뒤·combat-guide-r1249 앞(바로 옆 자리는 묶지 않음)',html.split('"./'+F+'"').length===2&&at('ego-auto-r1292.js')>=0&&at('ego-auto-r1292.js')<at(F)&&at(F)<at('combat-guide-r1249.js'));}
check('① verify-r96-public.py 기대 목록',fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"));
check('① pages.yml CPU 검사 줄',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1301/r1301-cpu-check.cjs'));
check('① runtime-inputs.json',fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8').includes(F));
// 가짜 세계: 엔진 findPath(셈) + 실제 R979·R1301·R272·R360 (index.html 순서: r979 → r1301 → r272·r360)
const UNREACH=[{x:15,y:13,r:.31},{x:20,y:19.1,r:.29},{x:5,y:5.1,r:.29},{x:5,y:6.9,r:.29}];
function world(withNew,o={}){
 const S={calls:0,full:0,clock:0,gen:53,phase:'',hosp:'',rafs:[],fromBlocked:null};
 const room={id:o.zone||'kair02',engaged:false,exploration:{}};const player={x:52.7,y:103.4,hp:1};
 const ctx={console,Math,JSON,Number,String,Array,Object,Map,WeakMap,Set,WeakSet,Date,Error,isFinite,
  performance:{now:()=>S.clock},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0,clearInterval(){},
  requestAnimationFrame:f=>{S.rafs.push(f);return S.rafs.length;}};
 ctx.window=ctx;vm.createContext(ctx);
 ctx.__STORYWORLD_WORLD_R74__={generation:()=>S.gen};ctx.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:S.phase})};
 ctx.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__={inspect:()=>({state:{phase:S.hosp}})};
 ctx.__S=S;ctx.__room=room;ctx.__player=player;ctx.__UN=UNREACH;
 vm.runInContext(`var room=__room,player=__player,time=0;
  var blocked=function(x,y){return !!(__S.fromBlocked&&Math.abs(x-__S.fromBlocked.x)<.01&&Math.abs(y-__S.fromBlocked.y)<.01);};
  var findPath=function(from,to,r,radius){__S.calls++;if(!from||!to)return [];if(__UN.some(u=>u.x===to.x&&u.y===to.y)){__S.full++;return [];}return [{x:from.x,y:from.y},{x:to.x,y:to.y}];};`,ctx);
 for(const f of o.only?[F]:['perf-r979.js',...(withNew?[F]:[]),'perf-r272.js','perf-r360.js'])vm.runInContext(rd(f),ctx,{filename:f});
 const frame=(dt=1/60)=>{S.clock+=dt*1000;ctx.time+=dt;const fs=S.rafs.splice(0);for(const f of fs)f(S.clock);};
 const ask=()=>{for(const u of UNREACH)ctx.findPath(player,{x:u.x,y:u.y},room,u.r);};
 return {S,ctx,room,player,frame,ask,api:()=>ctx.__STORYWORLD_PERF_R1301__};}
// ②는 실제 R979·R272·R360 과 함께(통합), ③④⑥은 R1301 혼자(R979 6초·R272 1.5초 기억이 겹치면 R1301 의 경계를 볼 수 없음)
const U={only:true};
// 걷다(묻기) 쉬다(싸움, 안 묻지만 계속 걸음) 반복: 3칸/초로 18초, 1초 묻고 3초 쉬기
function walkFight(W,secs=18){const {S,player,frame,ask}=W;let fulls=[];for(let i=0;i<secs*60;i++){frame();player.y-=3/60;const ph=(i/60)%4;if(ph<1)ask();}return S.full;}
{const W=world(false);const n=walkFight(W);check('② 옛 코드 재현: 걷다 싸우다 다시 물으면 같은 4곳을 거듭 전체 탐색(>4)',n>4,'full='+n);}
{const W=world(true);const n=walkFight(W);check('② R1301: 18초 동안 4곳 전체 탐색은 처음 4번뿐',n===4,'full='+n);check('② 영웅 54칸 걸음 동안 기억 유지',W.player.y<52.7+103.4&&W.api()?.inspect?.().stats.held>0);}
{const W=world(true,U);const n0=walkFight(W,2);W.player.x+=6;W.frame();W.ask();check('③ 한 프레임에 6칸 순간이동 → 곧바로 다시 탐색',W.S.full===n0+4,'full='+W.S.full);}
{const W=world(true,U);W.ask();W.player.x+=2;W.frame();W.ask();check('③ 한 프레임 2칸(빠른 걸음·짧은 밀림)은 그대로',W.S.full===4,'full='+W.S.full);}
{const W=world(true,U);W.ask();W.player.x+=4;W.ask();check('③ 프레임 사이 묻는 자리가 지난 자리에서 2.5칸 넘게 뛰어도 다시 탐색',W.S.full===8,'full='+W.S.full);}
for(const [nm,fn] of [['R74 문 세대',W=>{W.S.gen++;}],['R78 단계',W=>{W.S.phase='door';}],['병원 단계',W=>{W.S.hosp='boss';}],['room.engaged',W=>{W.room.engaged=true;}],['탐색 레이아웃 객체',W=>{W.room.exploration={};}]]){
 const W=world(true,U);W.ask();W.frame();fn(W);W.S.clock+=2000;W.frame();W.ask();check('③ '+nm+' 바뀜 → 곧바로 다시 탐색',W.S.full===8,'full='+W.S.full);}
{const W=world(true,U);W.ask();const other={id:'kair10',engaged:false,exploration:{}};W.ctx.room=other;W.S.clock+=2000;W.frame();for(const u of UNREACH)W.ctx.findPath(W.player,{x:u.x,y:u.y},other,u.r);check('③ 방이 바뀌면 따로(다시 탐색)',W.S.full===8,'full='+W.S.full);}
{const W=world(true,U);W.ask();for(let i=0;i<Math.round(19.9*60);i++)W.frame();W.ask();const a=W.S.full;for(let i=0;i<12;i++)W.frame();W.ask();check('④ 게임 시간 19.9초는 기억, 20.1초면 다시 탐색',a===4&&W.S.full===8,'a='+a+' b='+W.S.full);}
{const W=world(true,U);W.ctx.time=100;W.ask();W.ctx.time=3;W.S.clock+=2000;W.frame();W.ask();check('④ 게임 시간이 되감기면(새 판) 다시 탐색',W.S.full===8,'full='+W.S.full);}
{const W=world(true,U);const t={x:40,y:40};const a=W.ctx.findPath(W.player,t,W.room,.29);W.S.clock+=2000;const b=W.ctx.findPath(W.player,t,W.room,.29);check('⑤ 길이 있는 결과는 기억 안 함(늘 새로)',W.S.calls===2&&a.length===2&&b.length===2,'calls='+W.S.calls);}
{const W=world(true,U);const mob={x:22,y:40};for(let i=0;i<3;i++){W.S.clock+=2000;W.frame();W.ctx.findPath(mob,{x:15,y:13},W.room,.31);}check('⑤ 몹 자리에서 떠나는 길 찾기는 기억 안 함',W.S.full===3,'full='+W.S.full);}
{const W=world(true,U);W.S.fromBlocked={x:W.player.x,y:W.player.y};W.ask();W.S.clock+=2000;W.frame();W.ask();check('⑤ 막힌 칸에서 떠난 실패는 기억 안 함',W.S.full===8,'full='+W.S.full);}
{const W=world(true,U);const A=W.api();check('⑥ API·inspect',!!A&&/R1301/.test(A.inspect().revision)&&A.inspect().lastError===null);W.ask();check('⑥ inspect 통계(stored 4)',A.inspect().stats.stored===4,JSON.stringify(A.inspect().stats));
 A.set(false);W.S.clock+=2000;W.frame();W.ask();check('⑥ 끄면 옛 동작(다시 탐색)',W.S.full===8,'full='+W.S.full);A.set(true);
 const r1=W.ctx.findPath(W.player,{x:NaN,y:1},W.room,.29),r2=W.ctx.findPath(null,{x:1,y:1},W.room,.29);check('⑥ 이상한 인자는 엔진으로 그대로',Array.isArray(r1)&&Array.isArray(r2)&&A.inspect().lastError===null);}
check('⑦ 엔진 함수 덮어쓰기는 findPath 감싸기뿐(tick·draw·blocked·clearPath3 안 건드림)',!/\b(tick|draw|blocked|clearPath3|guideStep)\s*=\s*function/.test(src)&&/findPath=function/.test(src));
check('⑦ 한 번만 실행(가드)',/if\(window\.__STORYWORLD_PERF_R1301__\)return;/.test(src));
done();
