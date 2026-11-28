// R1384 3D 헌터 활 손(오른손이 시위까지 가서 잡고 당겨 쏘기, 왼손이 활대를 쥠) — CPU 정적 검사
//  ① 연결: 두 원본 = runtime-text 사본, CI 줄
//  ② 순서: 활(왼손 주먹·활 자리)을 먼저 놓고 그 뒤에 오른손 목표를 잡음 → 걸기 목표 = 실제 시위 가운데(nockW)
//  ③ IK: 주먹(palm)을 끝점으로 두 뼈 길이(어깨-팔꿈치, 팔꿈치-주먹)를 잼 — 손목 소켓 기준이면 어깨 가까운 목표에서 수렴 안 함
//  ④ 놓기 반동 목표는 오른 어깨 기준(가슴 회전 뒤에도 닿는 거리), 화살 걸 때 활 손을 몸 쪽으로(BOW_IN 뒤쪽·작은 양)
//  ⑥ 2차(7분야 1차 8.30 뒤): 닻점 턱·뺨(POSE.draw y>0, 오른쪽 x<0), 활대 휨·시위 굵기·놓은 뒤 진동 표(FLEX), 대기 때 되돌림(unbend 가 활대도 원래대로)
//  ⑦ 3차(7분야 2차 8.83 뒤): 시위에 걸린 화살은 게임 화살 그림(R912 pj02-fly) 재사용·수묵/조명 제외·그린 뒤 숨김, 활 끝 휨 ≥ .12 표, 시위 상아색
//  ⑧ R1384b(사용자 11-28 '장전된 후 놓으면 화살이 나가게'): timeline() — 누른 뒤 걸기→당기기→정지, 놓은 뒤 놓기→반동→되돌림→걸기에서 멈춤(다시 당기지 않음),
//     당기기 시간 = 공격 간격 절반(.05~.2), 3D 헌터 기본 화살은 projectiles 밖에 들고 있다가 놓는 순간 넣음(방 바뀌면 버림)
//  ⑨ R1384c(7분야 9.04 감점 뒤): 놓기를 게임 틱 안에서, 스킬 화살이 생기는 순간 놓기, 일제 사격 중 다시 당기기
//  ⑤ R1364 pin(u): 숫자면 고정, 아니면 풀림(검사·장면 고정용), 평소 상태엔 영향 없음
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return null;}};
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const D='hunter-draw-3d-r1336.js',Cy='hunter-cycle-3d-r1364.js',d=rd('client-source/'+D)||'',c=rd('client-source/'+Cy)||'';
ok(!!d&&d===rd('runtime-text/'+D),'① R1336 원본 = 사본');ok(!!c&&c===rd('runtime-text/'+Cy),'① R1364 원본 = 사본');
ok((rd('../.github/workflows/pages.yml')||'').includes('r96/qa/r1384/r1384-cpu-check.cjs'),'① CI 검사 줄');
const iMount=d.indexOf('s.mount.updateMatrixWorld(true);',d.indexOf('function pose(')),iRight=d.indexOf('const errR=reach(s.R');
ok(iMount>0&&iRight>iMount,'② 활 자리를 먼저 놓고 오른손 IK');
ok(/function nockW\(s\)\{[^}]*st\.mesh\.localToWorld\(st\.center\.clone\(\)\)/.test(d)&&/nT=nockW\(s\)\|\|/.test(d),'② 걸기 목표 = 시위 가운데(쉬는 자리) 세계 좌표');
const rs=d.slice(d.indexOf('function reach('),d.indexOf('function build('));
ok(/b\.distanceTo\(pw\)/.test(rs)&&/aim\(B,pw\.clone\(\)\.sub\(b\),target\.clone\(\)\.sub\(b\)\)/.test(rs)&&!/C\.getWorldPosition/.test(rs),'③ IK 끝점 = 주먹');
ok(/const fT=s\.R\.A\.getWorldPosition\(new T\.Vector3\(\)\)\.add\(dirW\(CYCLE\.follow\)/.test(d),'④ 놓기 반동 목표 = 오른 어깨 기준');
const m=d.match(/const CYCLE=\{follow:\[([^\]]+)\]/),f=m?m[1].split(',').map(Number):[];const fl=Math.hypot(...f);
ok(f.length===3&&f[2]<0&&fl>.2&&fl<.4,'④ 반동 자리: 뒤쪽, 어깨에서 .2~.4(팔 길이 안) ('+fl.toFixed(3)+')');
const b=d.match(/const BOW_IN=\[([^\]]+)\]/),bi=b?b[1].split(',').map(Number):[];
ok(bi.length===3&&bi[2]<0&&Math.hypot(...bi)<=.16&&/dirW\(BOW_IN\)\.multiplyScalar\(scale\*wnB\)/.test(d),'④ 걸 때 활 손을 몸 쪽으로(걸기 가중치만큼, ≤ .16)');
const pd=d.match(/const ANCHOR=\[([^\]]+)\]/),dr=pd?pd[1].split(',').map(Number):[];ok(dr.length===3&&dr[1]>0&&dr[0]<0,'⑥ 닻점이 머리 뼈 위·오른쪽(턱·뺨) ('+dr+')');
const fx=d.match(/const FLEX=(\{[^}]+\})/);let F=null;try{F=fx&&Function('return '+fx[1])();}catch(_){}
ok(!!F&&F.k>0&&F.k<=.16&&F.thick>=1.3&&F.thick<=1.6&&F.vibA>0&&F.vibTau<=.08&&F.vibHz>=10,'⑥ 활대 휨·시위 굵기·진동 표 범위');
ok(/function unbend\(s\)\{if\(s\?\.flexed\)\{for\(const l of s\.limbs/.test(d)&&/flex\(s,drawK>\.001\?drawK:over\)/.test(d)&&/stringFx\(s,drawK>\.001\?drawK:over,vib\)/.test(d),'⑥ 그린 뒤 활대·시위 되돌림, 당김 비례 휨·진동 연결');
const na=d.match(/const NOCK_ARROW=(\{[^}]+\})/);let NA=null;try{NA=na&&Function('return '+na[1])();}catch(_){}
ok(!!NA&&NA.src==='assets/r912/pj02-fly.webp'&&fs.existsSync(path.join(R,'runtime-text',NA.src))&&NA.len>0&&NA.len<1.2,'⑦ 걸린 화살 = 게임 화살 그림 재사용(파일 있음)');
ok(/m\.userData\.r1055Skip=true;m\.userData\.r451=true/.test(d)&&/function restore\(s\)\{if\(s\?\.arrow\)s\.arrow\.visible=false;/.test(d),'⑦ 걸린 화살: 수묵·조명 덧칠 제외, 그린 뒤 숨김');
ok(!!F&&F.k*1>=.12&&F.over>0&&F.over<=.5,'⑦ 활 끝 휨 ≥ .12, 놓은 뒤 넘침 표');
ok(/const STRING_IVORY=0x([0-9a-f]{6})/.test(d)&&parseInt(d.match(/const STRING_IVORY=0x([0-9a-f]{6})/)[1].slice(0,2),16)>=0xc0,'⑦ 시위 상아색');
const win={};const sb={window:win,localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading'},performance:{now:()=>0},Number,Math,Object,String,Array,JSON,console};win.addEventListener=()=>{};
vm.createContext(sb);let err=null;try{vm.runInContext(c,sb);}catch(e){err=e;}const A=win.__STORYWORLD_HUNTER_CYCLE_R1364__;
ok(!err&&typeof A?.pin==='function','⑤ pin() 있음'+(err?' '+err:''));
if(A?.pin){const base=JSON.stringify(A.state());A.pin(.39);const s=A.state();ok(s.on&&s.stage==='nock'&&s.wn===1,'⑤ pin(.39) → 걸기');A.pin(.95);ok(A.state().stage==='hold','⑤ pin(.95) → 정지');
 A.pin(NaN);ok(JSON.stringify(A.state())===base,'⑤ pin(NaN) → 풀림, 평소 상태 그대로');}
if(A?.timeline){const T=A.timeline,L={req:1,rel:1.2},st=x=>T(x,L,-9).stage;
 ok(st(1.01)==='nock'&&st(1.08)==='draw'&&st(1.15)==='hold','⑧ 누른 뒤: 걸기 → 당기기 → 조준 정지 ('+[st(1.01),st(1.08),st(1.15)]+')');
 const a=T(1.19,L,-9).wa,b=T(1.02,L,-9).wa;ok(a===1&&b===0,'⑧ 정지 때 다 당김(wa 1), 걸기 땐 0');
 const post=[.01,.08,.15,.3,.4,.5].map(x=>T(2+x,null,2).stage);ok(post.join()==='release,follow,return,nock,nock,hold','⑧ 놓은 뒤: 놓기 → 반동 → 되돌림 → 걸기에서 멈춤, .45초 넘게 안 쏘면 조준 정지 ('+post+')');
 ok(T(1.1,{req:1,rel:1.06,aimed:true},-9).stage==='hold'&&T(1.03,{req:1,rel:1.06,aimed:true},-9).stage==='hold','⑧ 이미 조준 정지면 다시 걸지 않고 정지 그대로 놓음');
 ok(T(2.4,null,2).wa===0&&T(2.4,null,2).str===1,'⑧ 놓은 뒤 저절로 다시 당기지 않음');
 ok(T(2.05,null,2,.25).stage!=='release'&&T(2.01,null,2,.25).stage==='release','⑧ 빠른 연사면 놓은 뒤 동작이 짧아짐(배율 .25)');
 ok(Math.abs(A.leadFor(.2)-.1)<1e-9&&A.leadFor(.05)===.05&&A.leadFor(2)===.12,'⑧ 당기기 시간 = 공격 간격 절반(.05~.12)');
 // ⑫ R1384d(SW-0027 hero-summon 헌터 적중 흔들림): 누른 뒤 놓기 지연 + 4.1칸 비행(약 .25초)이 공격 뒤 .43초 안에 맞도록 놓기 지연 ≤ .12
 ok(A.leadFor(.46)<=.12&&A.leadFor(9)<=.12,'⑫ R1384d 처음 한 발 놓기 지연 ≤ .12초 (공격 간격 .46 → '+A.leadFor(.46)+')');
 ok(T(NaN,L,2).stage==='nock'&&T(5,null,NaN).stage==='hold','⑧ 경계: 시각 NaN → 걸기, 쏜 적 없음 → 조준 정지');}
ok(/function hold\(s,t\)[\s\S]{0,500}P\.splice\(i,1\)/.test(c)&&/function flush\(force\)[\s\S]{0,500}curRoom\(\)!==L\.room\)\{stats\.dropped/.test(c)&&/P\.push\(it\.s\)/.test(c),'⑧ 기본 화살은 들고 있다가 놓는 순간 projectiles 에 넣음, 방 바뀌면 버림');
ok(/if\(on3d&&hold\(s,t\)\)return s;/.test(c)&&/player===mainBody/.test(c)&&!/hold\(s,t,true\)/.test(c)&&/function state\(\)\{[^\n]{0,120}pollSkill\(\);flush\(false\);/.test(c),'⑧ 3D 조종 헌터(분대 분신 제외)일 때 기본 화살만 들고 있음(스킬 화살은 다른 오버레이가 찾으므로 안 듦), 그릴 때마다 놓을 때 확인');
if(A?.timeline){const T=A.timeline,st=x=>T(2+x,null,2,1,true).stage;ok(st(.08)==='follow'&&st(.21)==='nock'&&st(.27)==='draw'&&st(.4)==='hold'&&T(2.4,null,2,1,false).stage==='nock','⑨ R1384c 일제 사격 중(again)엔 되돌린 뒤 다시 당겨 조준 정지, 아니면 걸기에서 대기 ('+[st(.08),st(.21),st(.27),st(.4)]+')');}
ok(/function skillShot\(t\)[\s\S]{0,200}if\(lead&&lead\.skill\)\{flush\(true\);return;\}/.test(c)&&/skillShot\(now\(\)\)/.test(c),'⑨ R1384c 스킬 화살이 생기는 순간 놓기(첫 스킬 화살이 놓기보다 앞서지 않음)');
ok(/function wrapTick\(\)[\s\S]{0,200}flush\(false\)/.test(c)&&/wrapAttack\(\);wrapShot\(\);wrapTick\(\);/.test(c),'⑨ R1384c 놓기는 게임 틱 안에서(그리기 전에 화살이 들어감)');
// ⑩ R1384c 수평 비행(그리기만): 출발 u=0 은 그대로, 표적에 닿을 때(u=1) 시위 높이(h)만큼 들어 올림, 표지 없는 탄은 손대지 않음
if(A?.flyLift){const zm=1,TL=64,f={x0:0,y0:0,tx:4,ty:0,h:80},b0={x:0,y:0,vx:8,vy:0,r1384Fly:f},b1={x:4,y:0,vx:8,vy:0,r1384Fly:f},L0=A.flyLift(b0,zm),L1=A.flyLift(b1,zm),pj=(x,y)=>[(x-y)*TL*zm,(x+y)*TL*.5*zm];
 const dy=L1?pj(L1.gx*L1.u,L1.gy*L1.u)[1]:NaN,dx=L1?pj(L1.gx*L1.u,L1.gy*L1.u)[0]:NaN;ok(L0&&L0.u===0&&L1&&L1.u===1&&Math.abs(dy+(80-18))<1e-6&&Math.abs(dx)<1e-6&&A.flyLift({x:1,y:1,vx:1,vy:0},1)===null,'⑩ R1384c 화살 수평 비행: 출발 그대로, 표적에서 시위 높이까지 들림 (u '+(L0&&L0.u)+'→'+(L1&&L1.u)+', 화면 위로 '+(-dy).toFixed(2)+'px)');}
else ok(false,'⑩ R1384c flyLift 없음');
ok(/wrapTick\(\);wrapDraw\(\);/.test(c),'⑩ R1384c 탄 그리기 감싸기 설치');
// ⑪ R1384c 3차(병합 #1125 Codex 리뷰 P2): 당기는 동안 표적이 움직여 놓는 순간 다시 place 하면, 처음 퍼짐만 더하고 새 표적 방향으로 난다
if(A?.launch3d){const foot={x:0,y:0},off={dx:-3,dy:-45},geo={zoom:1,TILE:64,half:13},s={x:0,y:0,vx:8,vy:0,life:1},t1={x:4,y:0},t2={x:4,y:1};
 const L1=A.launch3d(foot,off,geo,s,t1);const s2={...s,x:L1.x,y:L1.y,vx:L1.vx,vy:L1.vy,life:L1.life};const L2=A.launch3d(foot,off,{...geo,spread:L1.spread},s2,t2);
 const got=L2?Math.atan2(L2.vy,L2.vx):NaN,want=L2?Math.atan2(t2.y-L2.y,t2.x-L2.x):NaN,d=Math.abs(Math.atan2(Math.sin(got-want),Math.cos(got-want)));
 const s3={...s,vx:8*Math.cos(.1),vy:8*Math.sin(.1)},L3=A.launch3d(foot,off,geo,s3,t1),L4=L3&&A.launch3d(foot,off,{...geo,spread:L3.spread},{...s3,x:L3.x,y:L3.y,vx:L3.vx,vy:L3.vy},t2),d4=L4?Math.atan2(L4.vy,L4.vx)-Math.atan2(t2.y-L4.y,t2.x-L4.x):NaN;
 ok(Number.isFinite(L1?.spread)&&d<1e-6&&Math.abs(d4-.1)<1e-6,'⑪ R1384c 움직인 표적: 놓는 순간 새 표적 방향 + 처음 퍼짐 (각 차 '+d.toFixed(3)+', 퍼짐 '+(Number.isFinite(d4)?d4.toFixed(3):'-')+' = .1)');}
ok(/s\.r1384Spread/.test(c),'⑪ R1384c 처음 퍼짐을 탄에 저장해 다시 place 할 때 씀');
console.log(fail?`\nR1384 CPU 실패 ${fail}`:'\nR1384 CPU 통과');process.exit(fail?1:0);
