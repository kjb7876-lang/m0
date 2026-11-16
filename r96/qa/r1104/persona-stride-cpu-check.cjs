// R1104 실패 먼저: 페르소나 '순수악의'는 걷기 그림이 없어(rc133 art 방향별 정지 그림뿐) 이동해도 같은 그림이 미끄러졌다(헤드리스 실측 qa/r1104/probe.json:
//  이동 154프레임 모두 base-1.png, 키 변화 ±0.5px). Dots 걷기 시트(CX-0106PB)가 오기 전 임시 코드 걸음: 렌더 단계에서 R1097 수묵 처리 뒤,
//  몸 그림을 상체 + 하체 왼쪽·오른쪽으로 나눠 다리를 엇갈리게 하고 디딤 출렁임을 준다.
// 검사: ① 서 있으면 그대로 ② 걸으면 조각으로 나뉘고 조각들이 원래 그림을 빈틈없이 덮음(상체 아래 = 하체 위, 붙어 있음) ③ 반 걸음 차이로 다리 엇갈림 방향이 바뀜(보폭 > 폭 2%)
//       ④ 제자리 떨림(앞뒤 0.03칸 왕복)은 걷기로 안 봄 ⑤ 다른 적 그림은 그대로 ⑥ R1097 수묵 처리를 먼저 거친 그림도 나눔 ⑦ 끄기 ⑧ NaN 점은 그대로·오류 없음 ⑨ 빌드 연결.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),FILE=path.join(ROOT,'client-source/persona-stride-r1104.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
if(!fs.existsSync(FILE)){ok(false,'persona-stride-r1104.js 가 있음');console.log('R1104 persona-stride FAILED '+fails);process.exit(1);}
const SRC=fs.readFileSync(FILE,'utf8');
function world(o={}){
 const persona={id:'cult04:inner-evil-rc133',persona:true,boss:true,hp:100,x:10,y:10,spawnState:'active'};
 let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>Array.isArray(p)?[...p]:p),sourceRect:c.sourceRect&&[...c.sourceRect]}));}};
 const store={};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,console,time:0,room:{id:'cult04',enemies:[persona]},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 if(o.r1097)C.__STORYWORLD_PERSONA_INK_R1097__={process:cmds=>{for(const c of cmds)if(/rc133\/art\/base/.test(c.sourcePath)&&!c.r1097){c.r1097=true;c.sourcePath='blob:ink/'+c.sourcePath;c.sourceRect=[0,0,396,452];c.imageSize=[396,452];}}};
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const body=(extra={})=>({kind:'image',key:'enemy:p1:7',owner:{kind:'enemy',id:'enemy:p1'},sourcePath:'assets/rc133/art/base-1.png',image:{},sourceRect:[0,0,344,400],imageSize:[344,400],style:{globalAlpha:1},
  points:[[500,150],[586,150],[586,250],[500,250]],...extra});
 const other=()=>({kind:'image',owner:{kind:'enemy'},sourcePath:'assets/x/mob.png',image:{},sourceRect:[0,0,100,100],points:[[0,0],[50,0],[50,50],[0,50]],style:{}});
 const frame=cmds=>{proto.render.call({}, {commands:cmds});return seen;};
 // 걷기: 게임 시간 dt 마다 persona 를 v 칸/초로 옮기며 그린다
 const walk=(sec,v=2.4,dt=1/30,each)=>{let out=null;for(let t=0;t<sec;t+=dt){C.time+=dt;persona.x+=v*dt*Math.SQRT1_2;persona.y-=v*dt*Math.SQRT1_2;out=frame([body(),other()]);if(each)each(out);}return out;};
 return {C,persona,body,other,frame,walk,api:()=>C.__STORYWORLD_PERSONA_STRIDE_R1104__,store};}
const pieces=cmds=>cmds.filter(c=>/rc133\/art\/base|blob:ink/.test(String(c.sourcePath)));
// 0
{const w=world();ok(w.api()&&typeof w.api().inspect==='function'&&typeof w.api().set==='function','0) API(inspect·set)');}
// ① 서 있음
{const w=world();let out;for(let i=0;i<30;i++){w.C.time+=1/30;out=w.frame([w.body()]);}const p=pieces(out);ok(p.length===1&&JSON.stringify(p[0].points)===JSON.stringify(w.body().points),'① 서 있으면 몸 그림 그대로(조각 '+p.length+')');}
// ② 걷기 → 조각
{const w=world();const out=w.walk(1);const p=pieces(out);ok(p.length>=3,'② 걸으면 몸 그림이 조각으로 나뉨('+p.length+'개)');
 const up=p.find(c=>c.sourceRect[1]===0),lows=p.filter(c=>c.sourceRect[1]>0);
 ok(up&&lows.length>=2,'② 상체 1 + 하체 2 이상');
 if(up&&lows.length){const hip=up.sourceRect[3];ok(lows.every(c=>Math.abs(c.sourceRect[1]-hip)<1e-6&&Math.abs(c.sourceRect[1]+c.sourceRect[3]-400)<1e-6),'② 하체 조각은 상체 아래(엉덩이 줄 '+hip.toFixed(1)+')부터 발끝(400)까지');
  const xs=lows.map(c=>[c.sourceRect[0],c.sourceRect[0]+c.sourceRect[2]]).sort((a,b)=>a[0]-b[0]);ok(xs[0][0]<=0&&xs[xs.length-1][1]>=344&&xs.every((r,i)=>i===0||r[0]<=xs[i-1][1]),'② 하체 조각이 가로로 빈틈없이 덮음 '+JSON.stringify(xs.map(r=>r.map(v=>Math.round(v)))));
  const upBot=[up.points[3],up.points[2]],lowTops=lows.map(c=>[c.points[0],c.points[1]]);
  const onLine=(q)=>{const [a,b]=upBot,t=(q[0]-a[0])/((b[0]-a[0])||1e-9),yy=a[1]+(b[1]-a[1])*t;return Math.abs(q[1]-yy)<.6;};
  ok(lowTops.every(([a,b])=>onLine(a)&&onLine(b)),'② 하체 위쪽 모서리가 상체 아래 모서리 줄 위에 붙어 있음');}}
// ③ 다리 엇갈림
{const w=world();const samples=[];w.walk(2,2.4,1/30,out=>{const lows=pieces(out).filter(c=>c.sourceRect[1]>0).sort((a,b)=>a.sourceRect[0]-b.sourceRect[0]);if(lows.length>=2){const sk=c=>((c.points[3][0]+c.points[2][0])/2-(c.points[0][0]+c.points[1][0])/2);samples.push(sk(lows[0])-sk(lows[lows.length-1]));}});
 const mx=Math.max(...samples),mn=Math.min(...samples);ok(samples.length>20&&mx>86*.02&&mn<-86*.02,'③ 왼·오른 다리 엇갈림이 양쪽으로 번갈아(최대 '+mx.toFixed(1)+'px, 최소 '+mn.toFixed(1)+'px, 폭 86px)');
 const ins=w.api().inspect();ok(ins.stats.steps>=2,'③ 2초 동안 걸음 수 '+ins.stats.steps+' ≥ 2');}
// ④ 제자리 떨림
{const w=world();let out,split=0;for(let i=0;i<90;i++){w.C.time+=1/20;w.persona.x+=(i%2?-1:1)*.028;out=w.frame([w.body()]);if(pieces(out).length>1)split++;}ok(split===0,'④ 제자리 떨림(0.028칸 왕복)은 걷기로 안 봄(나뉜 프레임 '+split+')');}
// ⑤ 다른 적
{const w=world();const out=w.walk(1);const o=out.find(c=>c.sourcePath==='assets/x/mob.png');ok(o&&JSON.stringify(o.points)===JSON.stringify(w.other().points)&&out.filter(c=>c.sourcePath==='assets/x/mob.png').length===1,'⑤ 다른 적 그림은 그대로');}
// ⑥ R1097 먼저
{const w=world({r1097:true});const out=w.walk(1);const p=pieces(out);ok(p.length>=3&&p.every(c=>c.r1097&&/blob:ink/.test(c.sourcePath)),'⑥ R1097 수묵 그림도 나눔(조각 '+p.length+', 모두 수묵)');
 const lows=p.filter(c=>c.sourceRect[1]>0);ok(lows.length&&lows.every(c=>Math.abs(c.sourceRect[1]+c.sourceRect[3]-452)<1e-6),'⑥ 수묵 캔버스 크기(452) 기준으로 나눔');}
// ⑦ 끄기
{const w=world();w.api().set(false);const out=w.walk(1);ok(pieces(out).length===1,'⑦ 끄면 나누지 않음');}
// ⑧ NaN
{const w=world();let threw=null,out;try{for(let i=0;i<30;i++){w.C.time+=1/30;w.persona.x+=.08;out=w.frame([w.body({points:[[NaN,1],[2,1],[2,3],[1,3]]})]);}}catch(e){threw=e;}ok(!threw&&pieces(out).length===1,'⑧ NaN 점은 그대로·오류 없음');}
// ⑩ 렌더러는 명령을 key(owner.id+':'+순번)로 한 메시에 묶는다 → 나눈 조각이 같은 key 면 마지막(상체)만 남고 하체가 사라진다(공개본 R1097 화면 검사·QA 실측)
{const w=world();let out,got=null;for(let i=0;i<40;i++){w.C.time+=1/20;w.persona.x+=.06;out=w.frame([w.body()]);const ps=pieces(out);if(ps.length===3){got=ps;break;}}
 ok(!!got,'⑩ 걷는 중 3조각으로 나뉨');const ks=(got||[]).map(c=>c.key);ok(got&&ks.every(k=>typeof k==='string'&&k.startsWith('enemy:p1:7'))&&new Set(ks).size===ks.length,'⑩ 조각마다 key 가 다름(원래 key 를 앞에 둠) '+JSON.stringify(ks));}
// ⑨ 빌드 연결
{const html=fs.readFileSync(path.join(ROOT,'runtime-text/index.html'),'utf8');const i=html.indexOf('<script src="./persona-stride-r1104.js"></script>'),j=html.indexOf('<script src="./persona-ink-r1097.js"></script>');
 ok(i>0&&j>0,'⑨ index.html 에 스크립트 태그(R1097 도 있음)');ok(fs.readFileSync(path.join(ROOT,'runtime-text/persona-stride-r1104.js'),'utf8')===SRC,'⑨ runtime-text 사본 같음');
 ok(fs.readFileSync(path.join(ROOT,'..','scripts/verify-r96-public.py'),'utf8').includes("'persona-stride-r1104.js'"),'⑨ 공개 확인 목록');}
console.log(fails?'R1104 persona-stride FAILED '+fails:'R1104 persona-stride PASSED');process.exit(fails?1:0);
