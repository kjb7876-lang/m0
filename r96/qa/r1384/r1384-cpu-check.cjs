// R1384 3D 헌터 활 손(오른손이 시위까지 가서 잡고 당겨 쏘기, 왼손이 활대를 쥠) — CPU 정적 검사
//  ① 연결: 두 원본 = runtime-text 사본, CI 줄
//  ② 순서: 활(왼손 주먹·활 자리)을 먼저 놓고 그 뒤에 오른손 목표를 잡음 → 걸기 목표 = 실제 시위 가운데(nockW)
//  ③ IK: 주먹(palm)을 끝점으로 두 뼈 길이(어깨-팔꿈치, 팔꿈치-주먹)를 잼 — 손목 소켓 기준이면 어깨 가까운 목표에서 수렴 안 함
//  ④ 놓기 반동 목표는 오른 어깨 기준(가슴 회전 뒤에도 닿는 거리), 화살 걸 때 활 손을 몸 쪽으로(BOW_IN 뒤쪽·작은 양)
//  ⑥ 2차(7분야 1차 8.30 뒤): 닻점 턱·뺨(POSE.draw y>0, 오른쪽 x<0), 활대 휨·시위 굵기·놓은 뒤 진동 표(FLEX), 대기 때 되돌림(unbend 가 활대도 원래대로)
//  ⑦ 3차(7분야 2차 8.83 뒤): 시위에 걸린 화살은 게임 화살 그림(R912 pj02-fly) 재사용·수묵/조명 제외·그린 뒤 숨김, 활 끝 휨 ≥ .12 표, 시위 상아색
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
console.log(fail?`\nR1384 CPU 실패 ${fail}`:'\nR1384 CPU 통과');process.exit(fail?1:0);
