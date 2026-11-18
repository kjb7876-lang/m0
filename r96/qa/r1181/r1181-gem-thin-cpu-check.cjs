// R1181 모바일 무한생존 경험치 조각 그리기 줄이기 CPU 검사.
//  사용자 2026-11-18 "렉개선및 모바일최적화는?" — 헤드리스 휴대폰(844×390, 터치) 무한생존 측정에서 프레임당 그리기 호출 약 400번 중
//  186번이 바닥에 쌓인 경험치 조각(sv-gem-01) 한 장씩이었다(조각 하나 = 메시 하나 = 그리기 한 번). 휴대폰 GPU 는 그리기 호출 수에 약하다.
//  고침: 저사양(휴대폰·lowFx)에서 화면 안 조각이 40개를 넘으면, 화면 칸(조각 폭의 절반)마다 처음 조각 한 장만 그린다.
//  거의 겹친 조각만 빠지므로 무더기 모양은 그대로이고, 줍기·경험치·저장(게임 규칙)은 전혀 바뀌지 않는다. PC 기본(lowFx 꺼짐)은 그대로.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const src=CS('survival-r600.js');assert.strictEqual(src,RT('survival-r600.js'));ok('client-source and runtime copies agree');
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1181/r1181-gem-thin-cpu-check.cjs'));ok('Pages CPU step');
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
new Function('window','document','localStorage',src)(win,doc,{getItem:()=>null,setItem(){}});
const P=win.__STORYWORLD_SURVIVAL_R600__.pure;
assert.strictEqual(typeof P.gemThin,'function');assert.strictEqual(P.GEM_THIN_MIN,40);ok('pure gemThin exported, threshold 40');
const T=P.gemThin;
// 경계값: 빈 목록·null·문턱 이하(40개)는 하나도 빼지 않는다(작은 무더기는 지금과 픽셀까지 같게).
assert.deepStrictEqual(T([],8),[]);assert.deepStrictEqual(T(null,8),[]);assert.deepStrictEqual(T(undefined,8),[]);
{const pts=Array.from({length:40},()=>({x:100,y:100}));assert.strictEqual(T(pts,8).length,40);ok('≤ 40 on screen: all drawn even if fully overlapped');}
{const pts=Array.from({length:41},()=>({x:100,y:100}));assert.deepStrictEqual(T(pts,8),[0]);ok('41 fully overlapped: one drawn (the first)');}
// 촘촘한 무더기 200개(지름 6px) → 몇 장만. 흩어진 조각(칸보다 멀리)은 하나도 안 빠진다.
{let s=1;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;const pts=Array.from({length:200},()=>({x:300+rnd()*6,y:200+rnd()*6}));const k=T(pts,8);
 assert(k.length>=1&&k.length<=4,'dense pile kept '+k.length);
 // 덮기: 빠진 조각마다 칸 한 변(8px) 안에 그려지는 조각이 있다
 const kept=k.map(i=>pts[i]);for(const p of pts)assert(kept.some(q=>Math.abs(q.x-p.x)<=8&&Math.abs(q.y-p.y)<=8));ok('200 in a 6 px pile → '+k.length+' drawn, every gem within one cell of a drawn one');}
{const pts=[];for(let i=0;i<20;i++)for(let j=0;j<10;j++)pts.push({x:i*9,y:j*9});assert.strictEqual(T(pts,8).length,200);ok('200 spread ≥ 1 cell apart: none dropped');}
// 순서: 남는 번호는 오름차순(원래 그리기 순서 = 겹침 순서 유지), 칸마다 첫 조각.
{const pts=[{x:5,y:5},{x:50,y:50},{x:6,y:6},{x:51,y:51}].concat(Array.from({length:40},(_,i)=>({x:500+i*20,y:5})));const k=T(pts,8);
 assert.deepStrictEqual(k.slice(0,2),[0,1]);assert(!k.includes(2)&&!k.includes(3));for(let i=1;i<k.length;i++)assert(k[i]>k[i-1]);ok('kept indices ascending, first gem of each cell wins');}
// 이상값: NaN·Infinity 좌표는 그리지 않고, 잘못된 칸 크기는 4px 로.
{const pts=[{x:NaN,y:1},{x:Infinity,y:1},{x:1,y:-Infinity}].concat(Array.from({length:45},()=>({x:10,y:10})));const k=T(pts,NaN);assert.deepStrictEqual(k,[3]);
 const k2=T(Array.from({length:45},(_,i)=>({x:i*5,y:0})),0);assert.strictEqual(k2.length,45);ok('NaN/Infinity points skipped; bad cell size falls back to 4 px');}
// 그리기 연결: 조각 그리기 루프가 저사양일 때만 gemThin 을 거친다(PC 기본은 그대로).
assert(/gk=Math\.max[\s\S]{0,600}const gi=low\(\)&&gemThinOn\(\)\?gemThin\(gp,/.test(src.slice(src.indexOf('// 경험치 조각'),src.indexOf('// 경험치 조각')+1600)));ok('draw loop thins only when low() (mobile / lowFx)');
assert(/qaGems:/.test(src));ok('qaGems test hook present');
// 두 번 그리기 막기: R266 은 '배우 먼저'를 위해 조형물을 drawObjective 뒤에 먼저 한 번 그리고, 깊이순 차례의 drawProp 은 건너뛴다.
//  R600 은 R266 뒤에 drawProp 을 감싸 정화 구슬 조형물을 직접 그리고 돌아가므로 R266 의 건너뛰기를 못 타 한 프레임에 두 번 그렸다.
//  → R266 이 지금 '먼저 그리기' 중인지(prePassing) 알려 주고, R600 은 그때는 그리지 않는다(깊이순 한 번만 = 지금 보이는 모습의 위층과 같음).
{const r266=CS('perf-groups-r266.js');assert.strictEqual(r266,RT('perf-groups-r266.js'));assert(/prePassing:\(\)=>passing/.test(r266));ok('R266 exports prePassing()');
 assert(/r600CoreProp\)\{if\(prePass\(\)\)return;/.test(src));ok('R600 core prop wrapper skips R266 pre-pass');
 // 가짜 엔진으로 실제 동작: R266 → R600 순서로 감싸고 한 프레임을 흉내 낸다.
 let painted=[];const ctxStub={};const win2={};const core={x:5,y:5,r600CoreProp:true},rock={x:1,y:1};
 const env={drawObjective(){},drawProp(q){painted.push(q===core?'core-base':'rock');},room:{props:[rock,core]},localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>0};
 const run=new Function('window','env',`with(env){${r266}\n;return {drawObjective,drawProp};}`);const g=run(win2,env);env.drawObjective=g.drawObjective;env.drawProp=g.drawProp;
 assert(win2.__STORYWORLD_PERF_GROUPS_R266__.prePassing()===false);
 // R600 감싸기(소스의 감싸기 줄과 같은 규칙) — 실제 소스 함수 대신 같은 판정만 흉내
 let coreDraws=0;const prePass=()=>!!win2.__STORYWORLD_PERF_GROUPS_R266__?.prePassing?.();const base=env.drawProp;env.drawProp=function(p,...a){if(p&&p.r600CoreProp){if(prePass())return;coreDraws++;return;}return base.apply(this,[p,...a]);};
 env.drawObjective();for(const q of [rock,core].sort((a,b)=>(a.x+a.y)-(b.x+b.y)))env.drawProp(q);
 assert.strictEqual(coreDraws,1);assert.deepStrictEqual(painted,['rock']);ok('fake frame: other props drawn once (pre-pass), core drawn once (depth pass)');}
console.log('ALL PASS',n);
