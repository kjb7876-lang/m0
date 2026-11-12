// R905 CPU check — 보스 앞 집결 구간 나눠 생성(사용자 2026-11-12 "스토리모드 적들 몰리는 보스앞구간 한번에 다 생성하지말고 절반씩나눠서 두번생성해"
//  → "꼭 두번말고 2-6번 사이에서 너가 변칙도 주면서 적용해줘 스토리모드 모든맵 서사에 맞추면 더 좋고").
//  고치기 전(main dcde9f1 헤드리스 전수): 중앙 전투실에 들어서면 R78 rally() 가 살아 있는 필드 적 전부(지역마다 33~52마리)를 한 번에 집결 자리로 옮겨 깨운다.
//  고친 뒤 기대: 지역마다 정한 2~6묶음으로 나눠 차례로 깨운다. 총 적 수·처치 목표·체력은 그대로, 멈춤 없음, 영화 모드·맘몬 금고는 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),ROOT=f=>fs.readFileSync(path.join(R,'..',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='rally-waves-r905.js',has=fs.existsSync(path.join(R,'client-source',F)),src=has?C(F):'';
ok('module exists',has);
ok('runtime copy matches client source',has&&fs.existsSync(path.join(R,'runtime-text',F))&&RT(F)===src);
ok('index.html loads the module once',(RT('index.html').match(/<script src="\.\/rally-waves-r905\.js"><\/script>/g)||[]).length===1);
ok('pages.yml runs this check',/r96\/qa\/r905\/r905-cpu-check\.cjs/.test(ROOT('.github/workflows/pages.yml')));
ok('public verify expects the module',/rally-waves-r905\.js/.test(ROOT('scripts/verify-r96-public.py')));
ok('runtime manifest lists the module',/rally-waves-r905\.js/.test(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
const W=C('world-combat-r78.js');
ok('world-combat runtime copy matches client source',RT('world-combat-r78.js')===W);
ok('R78 rally() hands the gathered rows to R905 before saving',/s\.rallied=rows\.map\(e=>e\.id\);[^\n]{0,80}__STORYWORLD_RALLY_WAVES_R905__\?\.onRally\?\.\(room,rows,s\);[\s\S]{0,420}saveGame\(false\);settle\(\);return true;/.test(W));
ok('R78 regather leaves held waves alone',/room\.enemies\.filter\(e=>field\(e\)&&!window\.__STORYWORLD_RALLY_WAVES_R905__\?\.held\?\.\(e\)&&stray\(e,g,player,time\)\)/.test(W));
ok('R78 rally still moves every survivor and keeps the count/label (no enemy removed)',/const rows=room\.enemies\.filter\(field\)/.test(W)&&/s\.rallied=rows\.map\(e=>e\.id\)/.test(W)&&/rally:'집결한 생존 적과 중간보스 제압 · '\+count/.test(W));
if(!has){console.log(`R905 ${n-bad}/${n} pass`);process.exit(1);}

const CEN=JSON.parse(fs.readFileSync(path.join(__dirname,'census.json'),'utf8')).rows;
function env(o={}){const E={console,Math,JSON,Number,String,Object,WeakMap,WeakSet,Map,Set,Array,store:{},toasts:[],time:0,started:true,modal:false,loading:false,player:{x:16,y:33,hp:100},room:null,phase:'rally',cinema:false,ctl:true,blockedAt:null,ticks:0,...o};
 E.localStorage={getItem:k=>E.store[k]??null,setItem:(k,v)=>{E.store[k]=String(v);}};E.window=E;E.toast=(t)=>{E.toasts.push(t);};E.blocked=(x,y)=>E.blockedAt?E.blockedAt(x,y):false;
 E.tick=function(dt){E.time+=dt;E.ticks++;};E.__STORYWORLD_WORLD_COMBAT_R78__={controlled:()=>E.ctl,state:()=>E.phase?{phase:E.phase,route:1}:null};E.__STORYWORLD_CINEMA_RUN_R461__={active:()=>E.cinema};
 vm.createContext(E);vm.runInContext(src,E);E.M=E.__STORYWORLD_RALLY_WAVES_R905__;return E;}
// 집결 자리: 8×6 격자(가운데 16,33) — 실제 rallySpots 45개와 비슷한 크기
function mobs(zone,total,champ){const a=[];for(let i=0;i<total;i++)a.push({id:zone+':e'+i,name:'m'+i,nativeId:'k'+(i%3),x:6+(i%8)*2.6,y:28+Math.floor(i/8)*1.8,hp:100,maxHp:100,spawnState:'active',wardRouteR81:i%2+1,wardChampionR81:i>=total-champ,midboss:false,cd:0});return a;}
const mkRoom=(zone,rows)=>({id:zone,layer:'STORY',enemies:rows,exploration:{worldWardR81:{gatherAnchor:{x:16,y:33},gatherBounds:[4,27,28,39]}}});
const active=r=>r.enemies.filter(e=>e.hp>0&&e.spawnState==='active').length,hidden=r=>r.enemies.filter(e=>e.hp>0&&e.spawnState==='hidden').length;
const run=(E,sec,each)=>{const k=Math.round(sec*30);for(let i=0;i<k;i++){E.tick(1/30);if(each)each(i);}};
const kill=e=>{e.hp=0;e.spawnState='dead';e.deadRecorded=true;};

// ── 1) 전 지역 계획: 2~6묶음, 변칙, 총수 보존 ──
{const E=env(),ns=new Map(),shapes=new Set(),uneven=[],bads=[];let det=true,table=0;
 for(const [zone,total,champ] of CEN){const rows=mobs(zone,total,champ),p=E.M.plan(zone,rows,{player:{x:16,y:33},anchor:{x:16,y:33},route:1});
  if(zone==='ep1b06'){ok('맘몬의 금고(ep1b06)는 손대지 않는다 — 한 묶음 그대로',p.waves.length===1&&p.waves[0].length===total);continue;}
  const flat=p.waves.flat(),sz=p.waves.map(w=>w.length);
  if(p.waves.length<2||p.waves.length>6)bads.push(zone+' n='+p.waves.length);
  if(flat.length!==total||new Set(flat).size!==total||!rows.every(e=>flat.includes(e)))bads.push(zone+' 총수/중복');
  if(Math.min(...sz)<2)bads.push(zone+' 묶음<2 '+sz);
  if(Math.max(...sz)>Math.ceil(total*.55)+champ)bads.push(zone+' 한 묶음이 절반(55%)+중간보스보다 큼 '+sz);
  ns.set(p.waves.length,(ns.get(p.waves.length)||0)+1);shapes.add(p.style.shape+'/'+p.style.order+'/'+p.style.champ);if(new Set(sz).size>1)uneven.push(zone);if(p.style.table)table++;
  const q=E.M.plan(zone,mobs(zone,total,champ),{player:{x:16,y:33},anchor:{x:16,y:33},route:1});if(JSON.stringify(q.waves.map(w=>w.map(e=>e.id)))!==JSON.stringify(p.waves.map(w=>w.map(e=>e.id))))det=false;}
 ok(`집결 지역 ${CEN.length}곳(맘몬 제외 ${CEN.length-1}) 모두 2~6묶음·총수 보존·묶음 ≥2·한 묶음 ≤55% (${bads.slice(0,4).join('; ')||'위반 없음'})`,CEN.length===48&&bads.length===0);
 ok(`묶음 수가 지역마다 다르다 — 2,3,4,5,6 이 모두 쓰임 (${[...ns].sort().map(a=>a.join('×')).join(' ')})`,[2,3,4,5,6].every(k=>ns.get(k)>=3));
 ok(`변칙: 묶음 모양·차례·중간보스 자리 조합 ≥ 10가지 (${shapes.size}), 묶음 크기가 고르지 않은 지역 ≥ 24곳 (${uneven.length})`,shapes.size>=10&&uneven.length>=24);
 ok('같은 입력이면 같은 계획(다시 불러와도 같음)',det);
 ok(`집결 지역 47곳 모두 지역별 표에 있다(서사 맞춤, 표 없는 기본값 0곳) — ${table}`,table===47);
 const adj=CEN.filter(([z])=>z!=='ep1b06').map(([z,t,c])=>E.M.plan(z,mobs(z,t,c),{player:{x:16,y:33},anchor:{x:16,y:33},route:1}).waves.length);let same=0;for(let i=1;i<adj.length;i++)if(adj[i]===adj[i-1])same++;
 ok(`이어지는 지역끼리 묶음 수가 같은 경우 ≤ 6 (${same})`,same<=6);
}
// ── 2) 경계값 ──
{const E=env();const P=(t,c=0)=>E.M.plan('dist01',mobs('dist01',t,c),{player:{x:16,y:33},anchor:{x:16,y:33},route:1}).waves.map(w=>w.length);
 ok('0·1·2·3마리는 나누지 않는다',[0,1,2,3].every(t=>{const s=P(t);return s.length===1&&s[0]===t;}));
 ok('4·5마리는 두 묶음(각 ≥2) '+JSON.stringify([P(4),P(5)]),P(4).length===2&&P(5).length===2&&Math.min(...P(4),...P(5))>=2);
 ok('6~17마리는 묶음 수가 줄어든다(묶음당 평균 ≥3) '+JSON.stringify([P(6),P(9),P(12),P(17)]),[6,9,12,17].every(t=>{const s=P(t);return s.length>=2&&s.length<=Math.floor(t/3)&&s.reduce((a,b)=>a+b,0)===t;}));
 ok('64마리(저장 상한)도 총수 보존·6묶음 이하',(s=>s.length<=6&&s.reduce((a,b)=>a+b,0)===64)(P(64,4)));
 ok('표에 없는 지역도 2~6묶음(기본값)',(s=>s.length>=2&&s.length<=6&&s.reduce((a,b)=>a+b,0)===40)(E.M.plan('zz99',mobs('zz99',40,2),{player:{x:16,y:33},anchor:{x:16,y:33},route:1}).waves.map(w=>w.length)));
}
// ── 3) 집결 때: 첫 묶음만 깨어 있고 나머지는 숨김(held), 적 수·체력 그대로 ──
function start(zone,total,champ,o){const E=env(o),rows=mobs(zone,total,champ);E.room=mkRoom(zone,rows);E.M.onRally(E.room,rows,{route:1});return {E,rows};}
{const {E,rows}=start('last302',41,2),p=E.M.plan('last302',mobs('last302',41,2),{player:{x:16,y:33},anchor:{x:16,y:33},route:1});
 ok(`last302 집결 직후: 깨어 있는 적 = 첫 묶음 ${p.waves[0].length} (전 41), 나머지는 숨김`,active(E.room)===p.waves[0].length&&hidden(E.room)===41-p.waves[0].length&&active(E.room)<=23);
 ok('숨긴 적은 held()=true, 깨어 있는 적은 false',rows.every(e=>E.M.held(e)===(e.spawnState==='hidden')));
 ok('적 수·체력·id 그대로(총 적 수·처치 목표 불변)',E.room.enemies.length===41&&rows.every(e=>e.hp===100&&e.maxHp===100)&&new Set(rows.map(e=>e.id)).size===41);
 // 처치로 다음 묶음: 깨어 있는 적을 다 잡으면 1초 안에 다음 묶음
 let rel=1;const N=p.waves.length;for(let w=1;w<N;w++){rows.filter(e=>e.spawnState==='active').forEach(kill);run(E,1);const a=active(E.room);ok(`  깨어 있는 적 전멸 → 1초 안에 ${w+1}번째 묶음 (${a}마리)`,a===p.waves[w].length);rel++;}
 rows.filter(e=>e.spawnState==='active').forEach(kill);run(E,1);
 ok(`모든 묶음이 나오고 전부 처치됨 — 깨운 횟수 ${E.M.inspect().stats.releases+1} = 묶음 수 ${N}, 남은 숨김 0`,rel===N&&E.M.inspect().stats.releases===N-1&&hidden(E.room)===0&&rows.every(e=>e.hp===0));
 ok('나중 묶음마다 알림 한 번(서사 글 아님)',E.toasts.length===N-1&&E.toasts.every(t=>/\d\/\d/.test(t)));
}
// ── 4) 아무도 안 잡을 때: 시간으로 나오되 동시에 깨어 있는 적은 상한(절반) 이하, 멈춤 없음 ──
for(const [zone,total,champ] of [['dist02',52,4],['last303',44,1],['kair01',36,1],['ep1b02',44,3]]){const {E,rows}=start(zone,total,champ);const cap=Math.max(8,Math.ceil(total/2));let peak=active(E.room);run(E,120,()=>{peak=Math.max(peak,active(E.room));});
 ok(`${zone}: 2분 동안 아무도 안 잡아도 동시에 깨어 있는 적 ≤ ${cap+champ} (최대 ${peak}, 전 ${total})`,peak<=cap+champ&&peak<total);
 // 조금씩 잡으면 결국 전부 나온다
 let guard=0;while(rows.some(e=>e.hp>0)&&guard++<400){const a=rows.filter(e=>e.spawnState==='active'&&e.hp>0);a.slice(0,3).forEach(kill);run(E,1);}
 ok(`${zone}: 3마리씩 잡아 나가면 전부 나와서 끝난다(멈춤 없음, ${guard}초)`,rows.every(e=>e.hp===0)&&guard<200);}
// 시간으로 나오는 것 자체도 확인: 첫 묶음을 상한 아래로만 줄여 두면(need 보다는 많게) 간격 뒤에 다음 묶음
{const {E,rows}=start('kair04',38,4);const a0=active(E.room);run(E,40);const a1=active(E.room);ok(`kair04: 안 잡아도 40초 안에 다음 묶음이 시간으로 나온다 (${a0}→${a1})`,a1>a0);}
// ── 5) 영화 모드·끄기·비대상은 그대로(전부 한 번에) ──
{const {E}=start('dist01',44,3,{cinema:true});ok('영화 모드: 나누지 않는다(전부 깨어 있음)',active(E.room)===44&&hidden(E.room)===0);}
{const {E}=start('dist01',44,3,{store:{'storyworld.r905.rallyWaves':'{"on":false}'}});ok('끄기 스위치: 나누지 않는다',active(E.room)===44);}
{const {E}=start('dist01',44,3,{ctl:false});ok('R78 관리 지역이 아니면(협동·특수 지역) 나누지 않는다',active(E.room)===44);}
{const {E}=start('ep1b06',44,3);ok('맘몬의 금고: 집결 때도 전부 한 번에',active(E.room)===44);}
{const {E,rows}=start('dist01',44,3);E.M.set(false);ok('도중에 끄면 숨긴 적을 모두 바로 깨운다',active(E.room)===44&&rows.every(e=>!E.M.held(e)));}
// ── 6) 회귀: 단계가 rally 가 아니게 되면(불러오기·완료) 숨긴 적을 남기지 않는다 ──
{const {E}=start('dist03',52,4);E.phase='door';run(E,2);ok('단계가 바뀌면 2초 안에 숨긴 적 0',hidden(E.room)===0);}
// 지역을 다시 들어가 time 이 0 으로 돌아가도 멈추지 않는다
{const {E,rows}=start('dist03',52,4);run(E,3);E.time=0;rows.filter(e=>e.spawnState==='active').forEach(kill);run(E,1.5);ok('time 이 0 으로 돌아가도 다음 묶음이 나온다',active(E.room)>0);}
// 숨긴 적이 다른 이유로 죽거나(없어야 하지만) 방에서 빠져도 멈추지 않는다
{const {E,rows}=start('dist03',52,4);rows.filter(e=>e.spawnState==='hidden').slice(0,5).forEach(kill);let g=0;while(rows.some(e=>e.hp>0)&&g++<100){rows.filter(e=>e.spawnState==='active'&&e.hp>0).forEach(kill);run(E,1);}ok('숨긴 적 일부가 이미 죽어 있어도 끝까지 진행',rows.every(e=>e.hp===0)&&g<20);}
// ── 7) 불러오기 뒤(R78 이 전부 active 로 되돌림): 영웅 곁·다친 적은 그대로, 먼 적만 다시 나눈다 ──
{const E=env(),rows=mobs('dist04',52,4);E.room=mkRoom('dist04',rows);rows[0].x=16.5;rows[0].y=33;rows[1].hp=40;rows[2].x=17;rows[2].y=34;run(E,1.2);
 ok(`불러온 집결 단계: 곁(9칸)·다친 적은 깨어 있고 나머지는 다시 나뉜다 (깨어 있음 ${active(E.room)}/52)`,rows[0].spawnState==='active'&&rows[1].spawnState==='active'&&rows[2].spawnState==='active'&&hidden(E.room)>=20&&active(E.room)<=30);
 let g=0;while(rows.some(e=>e.hp>0)&&g++<100){rows.filter(e=>e.spawnState==='active'&&e.hp>0).forEach(kill);run(E,1);}ok('불러온 뒤에도 끝까지 진행',rows.every(e=>e.hp===0)&&g<20);}
// 회귀(헤드리스 dist04 불러오기에서 발견): 저장에 숨김으로 남은 표식 중간보스 4마리는 계획 밖이라 R78 이 1초 뒤 깨워 절반을 넘겼다 → 숨김 상태로 불러온 적도 계획에 넣는다
{const E=env(),rows=mobs('dist04',52,4);E.room=mkRoom('dist04',rows);rows.filter(e=>e.wardChampionR81).forEach(e=>{e.spawnState='hidden';});run(E,1.2);
 ok(`불러온 집결 단계: 숨김으로 불러온 적도 held 로 잡아 둔다(깨어 있음 ${active(E.room)} ≤ 26)`,rows.filter(e=>e.wardChampionR81).every(e=>E.M.held(e))&&active(E.room)<=26&&active(E.room)+hidden(E.room)===52);
 let g=0;while(rows.some(e=>e.hp>0)&&g++<100){rows.filter(e=>e.spawnState==='active'&&e.hp>0).forEach(kill);run(E,1);}ok('  그리고 끝까지 진행',rows.every(e=>e.hp===0)&&g<20);}
{const E=env({phase:'route'}),rows=mobs('dist04',52,4);E.room=mkRoom('dist04',rows);run(E,3);ok('길 단계(route)에서는 아무도 숨기지 않는다',hidden(E.room)===0);}
{const E=env({cinema:true}),rows=mobs('dist04',52,4);E.room=mkRoom('dist04',rows);run(E,3);ok('영화 모드로 불러온 집결 단계도 그대로',hidden(E.room)===0);}
// ── 8) 깨울 자리: 영웅 발밑·막힌 자리는 비킨다 ──
{const {E,rows}=start('dist05',52,4);const h=rows.find(e=>e.spawnState==='hidden');E.player.x=h.x;E.player.y=h.y;const bx=rows.filter(e=>e.spawnState==='hidden')[1],b0={x:bx.x,y:bx.y};E.blockedAt=(x,y)=>Math.hypot(x-b0.x,y-b0.y)<.5;
 let g=0;while(rows.some(e=>e.spawnState==='hidden')&&g++<60){rows.filter(e=>e.spawnState==='active'&&e!==h&&e!==bx&&e.hp>0).forEach(kill);run(E,1);}
 ok(`영웅 발밑에 깨어날 적은 1.5칸 넘게 비켜 선다 (${Math.hypot(h.x-E.player.x,h.y-E.player.y).toFixed(2)})`,h.spawnState==='active'&&Math.hypot(h.x-E.player.x,h.y-E.player.y)>=1.5);
 ok('막힌 자리에 깨어날 적은 빈 자리로 옮긴다',bx.spawnState==='active'&&Math.hypot(bx.x-b0.x,bx.y-b0.y)>=.5);
 ok('깨어난 적은 0.5초 넘는 유예와 첫 공격 대기(엔진 웨이브와 같은 방식)',rows.filter(e=>e.r905Wave>0&&e.hp>0).every(e=>e.cd>=.8&&e.state==='idle'));}
// ── 8b) 회귀(헤드리스 last302·last303 에서 발견): R352 '남겨진 웨이브 몹 깨우기'가 R905 가 숨긴 적(웨이브 번호가 남은 추격대 3마리)을 0.5초 뒤 깨웠다 ──
{const O=C('wave-orphans-r352.js');ok('wave-orphans runtime copy matches client source',RT('wave-orphans-r352.js')===O);
 const {E,rows}=start('last302',41,2);E.room.fieldWaves6=[1,2];E.room.fieldWaveIndex6=2;E.room.fieldWaveCleared6=false;const hs=rows.filter(e=>e.spawnState==='hidden');hs.forEach((e,i)=>{e.fieldWaveIndex6=i%2;e.x=E.player.x+2;e.y=E.player.y+1;});
 const a0=active(E.room);vm.runInContext(O,E);const R352=E.__STORYWORLD_WAVE_ORPHANS_R352__;run(E,.9);
 ok(`R352 는 R905 가 숨긴 적을 깨우지 않는다 (깨어 있는 적 ${a0}→${active(E.room)}, R352 woken ${R352.inspect().stats.woken})`,active(E.room)===a0&&R352.inspect().stats.woken===0&&hs.every(e=>E.M.held(e)));
 const o={id:'x',hp:10,spawnState:'hidden',fieldWaveIndex6:0,x:E.player.x+1,y:E.player.y};E.room.enemies.push(o);run(E,.9);ok('회귀: R905 와 무관한 남겨진 웨이브 몹은 R352 가 그대로 깨운다',o.spawnState==='active'&&o.r352Woken===true);}
// ── 9) 오류 없이 돈다 ──
{const {E}=start('cult03',44,3);run(E,30);const i=E.M.inspect();ok('오류 0 · 개정 표기 '+i.revision,i.stats.errors===0&&/^R905/.test(i.revision));}
console.log(`R905 ${n-bad}/${n} pass`);process.exit(bad?1:0);
