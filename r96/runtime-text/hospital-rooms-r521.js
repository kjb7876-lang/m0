// R521 병원 방 꾸미기 — 사용자 2026-11-09 22:52Z "전반적인 레벨업 … 특히 이미지부분 … 조형물 배치를 공간의 용도에 맞게 … 병실이라면 침대와 의료 설비".
//  원인(헤드리스 실측, main 81c1252): '피로 물든 병원'(ep1a08)은 86×112칸·방 20여 곳인데 보이는 가구가 11점뿐이었다(들것 4·휠체어 4·가림막 3).
//   · 지역 공용 조형물(짐수레·무너진 기둥·기억 석상)은 hospital-improvements-a5 가 '의료 소품이 아님'으로 모두 가린다(맞는 판단).
//   · 방 이름으로 가구를 놓는 R449 는 R171 방 자료가 있는 지역만 맡아, 병동 미로(hospitalDoorsB3)인 병원 본관은 빠져 있었다.
//   → 16×16칸 병실에 들것 한 대, 진료실·처치 준비실·로비는 빈 방. 벽과 바닥만 보여 방의 쓰임새가 읽히지 않았다.
//  고침(그리기 전용 — 충돌·길찾기·몹·저장·문·목표·서사·room.props 그대로):
//   방 쓰임새(병동 미로의 방 이름: 병실·진료실·처치 준비실·관찰실·로비·복도)에 맞춰 손으로 짠 배치표 한 장.
//   · 병실: 머리를 벽에 붙인 침대 줄 + 침대 곁 탁자·수액대·감시 모니터·식판 탁자·가림막. 방마다 줄 세운 벽과 대수를 달리한다.
//   · 진료실: 구석 약장, 진찰대(들것)+진찰등+둥근 의자, 기구 수레. (R521-3: 정면 3/4 시점 그림인 책상·의자·대기 의자·접수대·사물함·옛 약장은 각도가 안 맞아 뺐다)
//   · 처치 준비실: 구석부터 약장 줄, 기구 수레, 세워 둔 들것, 수액대.
//   · 로비·복도: 벽에 기댄 목발·휠체어, 벽에 붙여 세운 들것(통로 가운데는 비움).
//   · 모든 가구는 화면에 보이는 뒤쪽 두 벽(북·서)에서 2.4칸 안. 방 가운데(전투 공간)·문·출입구·시작 자리·보스방·길잡이 마디는 비운다.
//   · 그림은 이미 게임에 있던 병원 묶음(assets/hospital-maze — 드라이브 Isometric 84 파생, 지금까지 7점만 쓰임)·R415 병원 가구·병원 소품판(가림막)과
//     드라이브 Hospital_SmallProps8 파생 3점(assets/r521: 진찰등·식판 탁자·목발)·Dots 두 방향 가구 파생 2점(약장·기구 수레, R521-3). 모두 낡은 상아색+탁한 청록 한 계열. 불꽃 조명·외부 게임 자산 없음.
//   · 그림은 원래 그려진 방향(등각·광원)을 지킨다: 서쪽 벽용 그림을 북쪽 벽에 쓸 때만 좌우 거울(침대·탁자처럼 좌우가 같은 꼴만), 임의 회전·크기 흔들기 없음.
//  그리는 길: draw() 동안만 room.props 뒤에 덧붙인다(병원 소품판 visual-test 와 같은 방식) → 엔진 drawProp 사슬(시야 가림 SIGHT24·R329 그림자·R448 겹침·R451 빛)을 그대로 탄다.
//   a5 의 '의료 소품만' 거름은 r521Ward 표시로 지난다. 그림은 지역 유지 목록(regionById.ep1a08.paths)에 넣고, 그릴 때 없으면 1.5초 간격으로 다시 읽는다.
//  결정성: 표는 고정(난수 없음). 발 자리가 바닥 밖·벽 안이면 그 한 점만 뺀다(지도 판이 바뀌어도 벽에 박히지 않게).
//  끄기: localStorage['storyworld.r521.rooms']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HOSPITAL_ROOMS_R521__)return;
const REV='R521-hospital-rooms-3',KEY='storyworld.r521.rooms';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={builds:0,placed:0,dropped:0,pushed:0,frames:0,shown:0,reloads:0,contacts:0,lamps:0,errors:0};let lastError=null,dropLog=[];
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const fin=Number.isFinite;

// ---- 그림 ------------------------------------------------------------------------------------------
//  h = 그림 높이(px, zoom 전 — 영웅 키 66). flat = 낮고 넓은 가구: 엔진 발밑 타원 그림자를 끈다(그림 아래 가운데가 가구 모서리라 타원이 가구 밖 바닥에 구멍처럼 떨어졌다 — 그림에 이미 바닥 닿는 음영이 있다).
//  up = 그림 아래 여백 때문에 발보다 내려가 그려지는 만큼(키에 대한 비, 실측) — 그리는 동안 그만큼 올린다.
//  face = 그림이 원래 등을 댄 벽('w' 서쪽 벽 / 'n' 북쪽 벽 / 's' 어느 벽이든). d = 발(그림 아래 가운데)과 벽 사이 칸.
//  크기 기준: 1칸 ≈ 1m. 침대 2.1×1.0m, 들것 2.0×.75m, 약장 1.5×.55m, 사물함 .5×.5×1.9m, 책상 1.5×.8m.
const ATLAS='assets/visual-test/hospital-prop-atlas-oriented.png';
// R521-3(사용자 2026-11-10 "각도가 안맞는 소품은 과감히 배치안하도록 각도맞을때만배치"): 그림마다 각도를 2:1 바닥 격자에 대어 쟀다(qa/r521/review.md).
//  ang 'iso' = 그림의 바닥 모서리가 게임 바닥 방향(기울기 .5)과 맞음 · 'pole' = 기둥·바퀴 달린 대처럼 방향이 없는 것. 정면 3/4 시점으로 그려진 옛 약장·곁탁자·사물함·대기 의자·접수대·책상·의자·수레는 뺐다.
//  ft = 바닥 자리 실측 [왼쪽 꼭짓점, 오른쪽 꼭짓점, 맨 아래 꼭짓점]의 가로 자리(SHAPE 와 같은 단위). 맨 아래 꼭짓점에서 -x 쪽 길이 = (아래-왼쪽)·√2, -y 쪽 길이 = (오른쪽-아래)·√2 칸.
//   이 자리로 ① 벽에서 띄울 거리(d)를 계산해 등·머리를 벽에 붙이고 ② 방 구석에 딱 맞추고 ③ 바닥 닿는 그림자를 그린다.
const ART=Object.freeze({
 bed:{path:'assets/hospital-maze/bed.png',h:88,face:'w',flat:true,ang:'iso',ft:[-1.016,1.011,.289]},
 stretcher:{path:'assets/hospital-maze/stretcher.png',h:64,face:'n',flat:true,ang:'iso',ft:[-.906,.906,.275]},
 overbed:{path:'assets/r521/overbed-table.webp',h:48,face:'w',flat:true,ang:'iso',ft:[-.511,.511,.157]},
 medcab:{path:'assets/r521/medicine-cabinet.webp',h:86,face:'n',flat:true,ang:'iso',ft:[-0.472,0.472,0.224]},
 trolley:{path:'assets/r521/surgical-cart.webp',h:50,face:'n',flat:true,ang:'iso',ft:[-.457,.457,.161]},
 wheelchair:{path:'assets/hospital-maze/chair.png',h:52,face:'w',d:.9,flat:true,up:.018,ang:'pole',ft:[-.439,.439,-.025]},
 monitor:{path:'assets/hospital-maze/monitor.png',h:60,face:'s',d:.55,up:.01,ang:'pole'},
 iv:{path:'assets/hospital-maze/iv.png',h:74,face:'s',d:.5,up:.008,ang:'pole'},
 stool:{path:'assets/hospital-maze/stool.png',h:32,face:'s',d:1.5,up:.017,ang:'pole'},
 lamp:{path:'assets/r521/exam-lamp.webp',h:74,face:'s',d:.6,ang:'pole'},
 crutches:{path:'assets/r521/crutches.webp',h:46,face:'s',d:.35,up:.01,ang:'pole'},
 curtain:{path:ATLAS,h:84,face:'w',d:1.2,frame:'curtain',up:.042,ang:'iso'}
});
const PATHS=Object.freeze([...new Set(Object.values(ART).map(a=>a.path))]);

// ---- 그림 꼴(실측) ------------------------------------------------------------------------------------
//  3D 화면에서 조형물 그림은 발을 지나 카메라를 향해 서고 위로 갈수록 뒤(-x·-y)로 30° 눕는 판이다(R412 와 같은 식).
//  r = 그려지는 사각형 [왼쪽, 오른쪽, 아래, 위](발 기준, 단위 = 화면 칸 TILE·zoom·√2), m = 그림 알파 20×28 칸(16진수, 왼쪽 위부터) — 브라우저에서 R412 bodyOf 로 잰 값(qa/r521 참고).
const SHAPE=Object.freeze({
 bed:{r:[-1.084,1.084,0,1.83],m:'040001c0003d0007fc00ff200ffb00ffc80ffe40fff20fffd0fffe07fff03fffb3ffff7ffff6ffff67fff43fff02fff007fe003fc003fc001f4000c40008000080000c000080'},
 stretcher:{r:[-0.965,0.965,0,1.331],m:'02000010003c8007e200ff100ff880ffc607fe407ffc83ffc01ffe01fff037ff83fffe38fff2d7ff22bff237fe01bfe00ffc007f8003ec001cc0008c000c8000c0000c000080'},
 monitor:{r:[-0.286,0.286,0,1.247],m:'01c000ff800fff00fff81fff83fff83fff83fff039ff038ff038fc018f0038f801cf0018f0008f000ff0007f000770000f0000f0001fc07fffef0387e0187001c0003c000380'},
 iv:{r:[-0.314,0.314,0,1.539],m:'0040017e001867000430004f8004fc004fc004f8006fc0067c00430004300043000420006100041000510004800040000400184701f7f01df90ffffee0607e06070060000600'},
 stool:{r:[-0.265,0.265,0,0.665],m:'01fc00fff01fff81fff81fff81fff81fff81fff807fe001f8000680007c0006c000700007000270007f040fffe0fffe3ffc7ffff7e0cfef0c1ce0c0e60c0e01e0e00e0e00c00'},
 wheelchair:{r:[-0.468,0.468,0,1.082],m:'0180000c000040001c00c3c003fc001ff801ffc01fff01fff01ffe81fff87fff87fff8ffff8ffff8fffe8fffacffffc7fcfc6fe1c6761e37e1f3fe1f1ec3e00ff000fe000cc0'},
 lamp:{r:[-0.617,0.617,0,1.539],m:'002000078000dc0019fc030fe060ff0e0ff0e07f0401e04000040000400004000040000400004000040000400004000258007f8007f8003fe0076300c2300c20000300003000'},
 overbed:{r:[-0.54,0.54,0,0.999],m:'180007f000ffc00fff00fffc03fff00fffc03ffe00ffe003fc000f800038000180001c0001c01e1c03f1806dd81c078380383001f3001f1001f00071000e0000c0000c0000c0'},
 crutches:{r:[-0.224,0.224,0,0.957],m:'700007fe003ffc030dff309ff3091c21b0c21b0861b187fe106f610637f0634f0264203c4403c6c03c78038f0078f0078f0078e0031e0031e0070c0071800f38000380003800'},
 medcab:{r:[-0.506,0.506,0,1.789],m:'060001fc007ff80ffff0ffffefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff4ffff00ff8000f000020'},
 trolley:{r:[-0.483,0.483,0,1.040],m:'060001e000320004f8005fe007ff007ffc07ffe65ffff47fff43fff47fff4ffff7fff37ffe37ffc3fffe3cfffbc7fff01fff00fff003ff001f3000e300060000e0000e000040'},
 curtain:{r:[-0.665,0.665,0,1.824],m:'0000010000100001c0001f0001fc001ff001fd901fff01fff01fff81fff01fff01fff01fff01fff01fff077ff061ff0607f0003f0000f60007e0003e00060000600006000000'}
});
const SQ=Math.SQRT1_2,BACK=.5*Math.SQRT1_2,RISE=Math.sqrt(3)/2,MW=20,MH=28;
const sampMemo=new Map();
// 불투명 칸 → 발 기준 3D 점 [dx,dy,z]
function samplesOf(art,flip){const k=art+(flip?'|f':'');let S=sampMemo.get(k);if(S)return S;S=[];const s=SHAPE[art];if(s){const[x0,x1,y0,y1]=s.r;
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const u=flip?MW-1-i:i,n=j*MW+u;if(!((parseInt(s.m[n>>2],16)>>(3-(n&3)))&1))continue;const sx=x0+(i+.5)/MW*(x1-x0),h=y1-(j+.5)/MH*(y1-y0);if(h<0)continue;S.push([sx*SQ-BACK*h,-sx*SQ-BACK*h,RISE*h]);}}
 sampMemo.set(k,S);return S;}
// 벽에 묻힌 비율: 그림 점 가운데 벽 덩어리(바닥 밖·벽 상자) 위에 선 점. 병원 벽은 2.85칸 이상이라 가구 키(1.6칸 이하)는 모두 벽 높이 안이다.
function embedOf(S,x,y,hit){if(!S.length)return 0;let n=0;for(const[a,b]of S)if(hit(x+a,y+b,0))n++;return n/S.length;}
// 앞벽(카메라 쪽 +x·+y)에 가린 비율: 점에서 카메라 쪽으로 가는 선(칸마다 높이 .816)이 벽 안을 지나면 가린 것.
const WALL_LOW=3.5/* 벽 상자는 2.85~3.19칸이지만 화면에서는 윗면 덮개까지 더 가린다 — 로비 실측(남쪽 바깥벽 3.19칸이 4.2칸 뒤 바닥까지 가림)으로 맞춘 값 */,VIEW_RISE=.816,VIEW_FAR=4.5;
function hiddenOf(S,x,y,hit){if(!S.length)return 0;let n=0;for(const[a,b,z]of S){for(let t=.25;t<=VIEW_FAR;t+=.25)if(z+VIEW_RISE*t<WALL_LOW&&hit(x+a+t,y+b+t,0)){n++;break;}}return n/S.length;}
const WALL_GAP=.06,EMBED_MAX=.01/* R412 기준 3% 보다 좁게 — 거친 20×28 칸으로 잰 값이라 여유를 둔다 */,HIDDEN_MAX=.2,PUSH_STEP=.1,PUSH_MAX=1.2;

// ---- 배치표 ----------------------------------------------------------------------------------------
//  RUN(방, 쓰임새, 벽, 벽 안쪽 면 좌표, [[그림, 벽을 따라 좌표, (벽에서 칸 | 'p')], …], 구석 벽 면 좌표)
//   벽 'w' = 서쪽 벽(x 고정, 따라가는 좌표 y) · 'n' = 북쪽 벽(y 고정, 따라가는 좌표 x). 좌표는 병동 미로 지도(hospitalCoreLayoutB2) 칸.
//   따라가는 좌표 'c' = 방 구석: 옆면을 구석 벽(RUN 마지막 값)에 붙인다(바닥 자리로 계산). 벽에서 칸은 바닥 자리(ft)가 있으면 계산값(등·머리가 벽에 닿게)이 기본.
//   'p' = 침대 발치에 벽과 나란히 세우는 가림막(입구 쪽에서 침대를 가린다) — 그림을 줄 가림막과 반대로 돌려 쓴다.
const RUN=(room,use,wall,at,items,corner)=>({room,use,wall,at,items,corner});
const SCREEN_D=3.5;
const PLAN=Object.freeze([
 // 북쪽 병실 A — 6인실: 서쪽 벽 침대 4대(머리 벽), 북서 구석 약장, 남쪽 문 쪽 줄 끝·발치에 가림막
 RUN('north-ward-a','ward','w',30.12,[['bed',6.4],['monitor',7.6],['bed',9.5],['iv',10.65],['curtain',11.3],['bed',12.7],['monitor',13.9],['bed',15.9],['curtain',13.2,'p'],['curtain',15.6,'p']]),
 RUN('north-ward-a','ward','n',4.12,[['medcab','c'],['trolley',33.4]],30.12),
 // 북쪽 병실 B — 북쪽 벽 줄. 서쪽(A 와 통하는 틈)·남쪽 문에서 침대가 바로 보이지 않게 줄 양 끝과 발치에 가림막
 RUN('north-ward-b','ward','n',4.12,[['medcab','c'],['curtain',50.5],['bed',52.0],['monitor',53.25],['bed',55.2],['iv',56.4],['curtain',57.0],['bed',58.4],['overbed',59.7],['bed',61.6],['curtain',52.4,'p'],['curtain',58.8,'p']],48.12),
 RUN('north-ward-b','ward','w',48.12,[['crutches',8.6]]),
 // 북쪽 병실 C — 격리 병실: 침대마다 가림막
 RUN('north-ward-c','ward','w',68.12,[['bed',6.4],['curtain',8.0],['monitor',8.7],['bed',10.4],['curtain',12.0],['iv',12.7],['bed',14.4],['curtain',16.0],['curtain',14.2,'p']]),
 RUN('north-ward-c','ward','n',4.12,[['medcab','c'],['trolley',71.4],['wheelchair',79.6,1.0]],68.12),
 // 처치 준비실 — 구석부터 약장 줄 + 기구 수레, 서쪽 벽에 들것
 RUN('preparation','prep','n',30.12,[['medcab','c'],['medcab',12.6],['trolley',14.6],['medcab',24.6],['trolley',26.6],['iv',27.8],['iv',28.4]],10.12),
 RUN('preparation','prep','w',10.12,[['stretcher',33.6],['lamp',35.2],['stool',36.3,1.1],['medcab',39.2]]),
 RUN('preparation-east','prep','n',30.12,[['medcab',40.2],['medcab',41.6],['stretcher',47.0],['trolley',50.2],['medcab',57.4],['medcab',58.8]]),
 RUN('preparation-annex','prep','n',30.12,[['bed',70.4],['monitor',71.6],['lamp',72.3]]),
 // 진료실 a~d — 구석 약장, 서쪽 벽 진찰대(들것)+진찰등+둥근 의자, 기구 수레 (책상·의자는 각도 맞는 그림이 올 때까지 비움)
 RUN('consult-a','consult','n',52.12,[['medcab','c'],['trolley',13.0]],10.12),
 RUN('consult-a','consult','w',10.12,[['stretcher',54.8],['lamp',56.2],['stool',55.6,2.0]]),
 RUN('consult-b','consult','n',52.12,[['medcab','c'],['trolley',37.0]],34.12),
 RUN('consult-b','consult','w',34.12,[['stretcher',55.0],['lamp',56.4],['stool',55.8,2.0]]),
 RUN('consult-c','consult','n',52.12,[['medcab','c'],['medcab',58.8]],50.12),
 RUN('consult-c','consult','w',50.12,[['stretcher',55.0],['iv',56.4],['stool',55.8,2.0]]),
 RUN('consult-d','consult','n',52.12,[['medcab','c']],70.12),
 RUN('consult-d','consult','w',70.12,[['stretcher',54.8],['lamp',56.1],['crutches',56.7]]),
 // 남쪽 병실 a~d — 서쪽 벽 침대 줄(북쪽은 넓은 복도로 트임 → 북쪽 줄 끝과 발치에 가림막), b 는 북쪽 벽
 RUN('south-ward-a','ward','w',10.12,[['bed',90.7],['iv',91.9],['curtain',92.3],['bed',93.65],['monitor',98.5],['bed',99.8],['curtain',90.6,'p']]),
 RUN('south-ward-b','ward','n',92.12,[['bed',32.6],['iv',33.85],['bed',35.6],['curtain',37.2],['bed',38.6],['curtain',33.0,'p'],['curtain',38.2,'p']]),
 RUN('south-ward-b','ward','w',26.12,[['overbed',99.4],['wheelchair',101.6]]),
 RUN('south-ward-c','ward','w',44.12,[['bed',92.2],['curtain',93.6],['bed',96.2],['iv',98.7],['bed',100.2],['curtain',92.4,'p']]),
 RUN('south-ward-d','ward','w',64.12,[['bed',92.6],['bed',97.0],['monitor',98.2],['bed',100.8],['curtain',99.2],['curtain',92.8,'p']]),
 // 로비 — 벽에 기댄 휠체어·목발·들것 (접수대·대기 의자는 각도 맞는 그림이 올 때까지 비움)
 RUN('entry-hall','lobby','n',106.12,[['wheelchair',26.4,1.0],['wheelchair',27.8,1.0],['crutches',39.6],['stretcher',48.6],['iv',50.2],['crutches',64.6],['stretcher',77.0]]),
 // 복도 — 벽에 붙여 세운 들것(통로 가운데는 비움)
 RUN('upper-cross','corridor','n',22.12,[['stretcher',30.6],['wheelchair',47.4,1.0],['stretcher',64.6],['iv',67.0]]),
 RUN('lower-cross','corridor','n',80.12,[['stretcher',47.6],['iv',49.4]])
]);

// ---- 계획 ------------------------------------------------------------------------------------------
const enabled=r=>!!(prefs.on&&r&&r.id==='ep1a08'&&r.exploration?.hospitalDoorsB3&&Array.isArray(r.props));
// 비워 둘 자리(반지름 칸): 문·출입구·시작 자리·목표·길잡이 마디
function keepClear(r){const L=r.exploration||{},out=[];
 for(const d of L.hospitalDoorsB3||[])if(fin(d.x+d.y))out.push([d.x,d.y,Math.max(2.6,(+d.width||6)/2+.6)]);
 for(const s of L.starts||[])if(fin(s.x+s.y))out.push([s.x,s.y,3]);
 for(const q of[L.entry,L.entrance,L.gate,r.objective,r.altar])if(q&&fin(q.x+q.y))out.push([q.x,q.y,2.6]);
 for(const n of L.nodes||[])if(fin(n.x+n.y))out.push([n.x,n.y,1.25]);
 return out;}
const BOSS=Object.freeze([9.5,5.5,28.5,18.5]);/* 보스 전투실(원래 전투 좌표) — 손대지 않는다 */
function plan(r){const out=[],clear=keepClear(r),hit=typeof blocked==='function'?(x,y,rad)=>{try{return !!blocked(x,y,rad,r);}catch(_){return true;}}:()=>false;const log=[];let n=0,dropped=0,pushed=0;
 for(const run of PLAN)for(const it of run.items){const a=ART[it[0]];n++;if(!a)continue;
  const scr=it[2]==='p',flip=a.face!=='s'&&((a.face!==run.wall)!==scr),S=samplesOf(it[0],flip),ft=a.ft&&a.ang==='iso'?a.ft:null;
  // 바닥 자리로 계산: 벽에서 띄울 거리(등·머리가 벽에서 WALL_GAP) · 구석이면 옆면이 구석 벽에서 WALL_GAP
  const dep=ft?(a.face==='n'?(ft[1]-ft[2])*Math.SQRT2+ft[2]*SQ:(ft[2]-ft[0])*Math.SQRT2-ft[2]*SQ):0,side=ft?(a.face==='n'?(ft[2]-ft[0])*Math.SQRT2-ft[2]*SQ:(ft[1]-ft[2])*Math.SQRT2+ft[2]*SQ):0;
  const along=it[1]==='c'?(fin(+run.corner)&&ft?+run.corner+WALL_GAP+side:NaN):+it[1],d0=scr?SCREEN_D:fin(+it[2])?+it[2]:ft?WALL_GAP+dep:a.d;let d=d0,x=0,y=0,ok=false;
  // R521-2 벽에 묻힘: 그림 점의 1% 넘게 벽 덩어리 안이면 벽에서 .1칸씩 더 띄운다. 그래도 묻히거나 앞벽에 20% 넘게 가리면 그 점은 놓지 않는다.
  //  R521-3: 바닥 자리로 붙인 낮은 가구는 .2칸까지만(벽에서 떨어지느니 놓지 않는다). 키 큰 약장은 뒤로 30° 누운 그림 판의 윗부분이 벽에 잘리므로 .8칸까지 — 바닥의 틈은 약장 몸에 가려 보이지 않는다.
  //  구석('c')은 옆 벽에서도 같은 식으로 .1칸씩 뗀다(두 방향 합이 가장 작은 자리).
  const lim=ft?(a.h>80?.8:.2):PUSH_MAX,steps=Math.round(lim/PUSH_STEP),cs=it[1]==='c'?steps:0;
  search:for(let sum=0;sum<=steps+cs;sum++)for(let j=Math.min(sum,cs);j>=0;j--){const i=sum-j;if(i>steps)continue;d=d0+i*PUSH_STEP;const al=along+j*PUSH_STEP;x=run.wall==='w'?run.at+d:al;y=run.wall==='w'?al:run.at+d;if(!fin(x+y))break search;if(embedOf(S,x,y,hit)<=EMBED_MAX){ok=true;break search;}}
  const why=!ok?'wall':hit(x,y,.12)?'foot':(x>BOSS[0]&&x<BOSS[2]&&y>BOSS[1]&&y<BOSS[3])?'boss':clear.some(([cx,cy,cr])=>Math.hypot(cx-x,cy-y)<cr)?'clear':hiddenOf(S,x,y,hit)>HIDDEN_MAX?'hidden':'';
  if(why){dropped++;log.push(run.room+':'+n+' '+it[0]+'/'+run.wall+' '+it[1]+' '+why);continue;}if(d>d0+1e-9)pushed++;d=+d.toFixed(2);
  let fr=null;if(a.ft){let[sL,sR,sB]=a.ft;if(flip)[sL,sR,sB]=[-sR,-sL,-sB];const bx=x+sB*SQ,by=y-sB*SQ;fr=Object.freeze([+(bx-(sB-sL)*Math.SQRT2).toFixed(3),+(by-(sR-sB)*Math.SQRT2).toFixed(3),+bx.toFixed(3),+by.toFixed(3)]);}
  const p={id:'r521:ward:'+run.room+':'+n,path:a.path,x:+x.toFixed(3),y:+y.toFixed(3),height:a.h,solid:false,visible:true,enabled:true,presentationOnly:true,autoTargetEligible6:false,
   r521Ward:true,r521Flat:!!a.flat,r521Foot:a.flat?fr:null,r521Up:a.up||0,r521:Object.freeze({room:run.room,use:run.use,wall:run.wall,art:it[0],d,screen:scr})};
  if(a.frame){p.visualHospitalFrame=a.frame;p.hospitalDressingB3=true;p.hospitalZone13=true;p.visualFlipXB3=flip;}else if(flip)p.r303Flip=true;
  out.push(p);}
 stats.builds++;stats.placed=out.length;stats.dropped=dropped;stats.pushed=pushed;dropLog=log;return out;}
const memo=new WeakMap();
function list(r){if(!enabled(r))return[];const L=r.exploration;let m=memo.get(r);if(!m||m.L!==L){try{m={L,rows:plan(r)};}catch(e){fail(e);m={L,rows:[]};}memo.set(r,m);}return m.rows;}

// ---- 그림 읽기 --------------------------------------------------------------------------------------
let asked=0;
function prime(){try{const reg=typeof regionById!=='undefined'?regionById?.ep1a08:null;if(reg?.paths)for(const p of PATHS)if(!reg.paths.includes(p))reg.paths.push(p);
 if(typeof readyImage!=='function')return;const want=PATHS.filter(p=>!readyImage(p));if(!want.length)return;const t=Date.now();if(t-asked<1500)return;asked=t;stats.reloads+=want.length;
 if(typeof ensureImages==='function')Promise.resolve(ensureImages(want)).catch(()=>{});else if(typeof addImage==='function')for(const p of want)addImage(p,'R521 hospital rooms');}catch(e){fail(e);}}

// ---- 그리기 ----------------------------------------------------------------------------------------
//  화면 밖 가구는 덧붙이지 않는다(실측: 132점을 모두 넘기면 조형물마다 drawProp 감싸기 40여 겹을 지나 헤드리스 draw 가 6.0 → 9.3ms).
//  여유: 좌우 110px·위 40px·아래 130px(가장 큰 그림 침대 = 너비 약 105px·키 88px × zoom, 발은 그림 아래 가운데) — 가장자리에서 튀어나오지 않는다.
const near=[];
function onScreen(rows){if(typeof project!=='function'||typeof W!=='number'||typeof H!=='number')return rows;near.length=0;
 for(let i=0;i<rows.length;i++){const p=rows[i],q=project(p.x,p.y);if(q.x>-110&&q.x<W+110&&q.y>-40&&q.y<H+130)near.push(p);}return near;}
try{if(typeof draw==='function'){const base=draw;draw=function(...a){let r=null,rows=null;try{r=typeof room!=='undefined'?room:null;rows=r?list(r):null;if(rows&&rows.length){prime();rows=onScreen(rows);stats.shown=rows.length;}}catch(e){fail(e);rows=null;}
 if(!rows||!rows.length)return base.apply(this,a);
 const original=r.props;r.props=original.concat(rows);stats.frames++;try{return base.apply(this,a);}finally{r.props=original;}};}}catch(e){fail(e);}

// 낮고 넓은 가구: 엔진 발밑 타원만 끈다(R329 실루엣 그림자·그림 자체는 그대로). 다른 조형물은 그대로 지나간다.
// R521-2 바닥에 묻힘: R111 밑동 맞춤(play-r111 footOf)은 그림 가운데 줄 밑동을 발에 맞추려고 그림을 키의 22%까지 내린다. 등각 가구는 가운데 아래가 비고
//  좌우 모서리가 가장 낮아서, 내려간 만큼(침대 13px·약장·책상 등 9종) 3D 판이 바닥 밑으로 들어가 잘렸다 → 그리는 동안만 같은 만큼 들어 올려(visualLiftPx) 그림 밑변을 발에 맞춘다.
function liftOf(p){try{const P=window.__STORYWORLD_PLAY_R111__;if(!P||typeof P.foot!=='function'||P.prefs?.().props===false)return 0;const f=P.foot(p.path);if(!(f<.97))return 0;
 return Math.min(.22,1-f)*p.height*(typeof zoom==='number'&&zoom>0?zoom:1);}catch(e){fail(e);return 0;}}
// R521-3 바닥 닿는 그림자(사용자 2026-11-10 "침대 땅에서 떠보이지 않도록"): 낮은 가구는 발밑 타원을 껐기 때문에 다리 사이로 밝은 바닥이 그대로 보여 떠 보였다.
//  → 그리기 직전에 그 가구의 바닥 자리(네모, 뒤 .08칸·앞 .3칸 넓힘)를 바닥에 누운 범위로 옅게 칠한다. 손전등 시야에서 안 보이는 가구는 그림자도 안 그린다(R329 와 같게).
const CONTACT_A=.42,CONTACT_GROW=.08,CONTACT_FRONT=.3;/* 앞(카메라 쪽 +x·+y)으로는 .3칸 내민다 — 바닥 자리 그대로면 가구 몸에 다 가려 보이지 않았다(브라우저 확인) */
function contact(p){const f=p.r521Foot;if(!f||typeof ctx==='undefined'||!ctx||typeof ctx.beginPath!=='function'||typeof project!=='function')return;
 try{const SG=window.__STORYWORLD_SIGHT24__;if(SG?.enabled&&typeof SG.pointVisible==='function'&&!SG.pointVisible(p.x,p.y))return;}catch(e){fail(e);}
 const g=CONTACT_GROW,k=CONTACT_FRONT,q=[project(f[0]-g,f[1]-g),project(f[2]+k,f[1]-g),project(f[2]+k,f[3]+k),project(f[0]-g,f[3]+k)];
 const paint=()=>{ctx.save();try{ctx.globalAlpha*=CONTACT_A;ctx.fillStyle='rgba(0,0,0,1)';ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);for(let i=1;i<4;i++)ctx.lineTo(q[i].x,q[i].y);ctx.closePath();ctx.fill();stats.contacts++;}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r521:contact:'+p.id,kind:'effect',x:p.x,y:p.y,groundAligned:true,r521Contact:true,presentationOnly:true},paint);else paint();}
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||!p.r521Ward)return base.apply(this,[p,...a]);
 const z=typeof zoom==='number'&&zoom>0?zoom:1,frame=!!p.visualHospitalFrame;
 /* R111 은 그 그림을 처음 그릴 때에야 밑동을 잰다 → 아직 안 쟀으면 보이지 않게 한 번 그려 재게 한 뒤 본 그리기를 한다(처음 한 장이 내려앉아 보이지 않게) */
 if(!frame&&typeof ctx!=='undefined'&&ctx&&typeof ctx.save==='function'){let cold=false;try{const P=window.__STORYWORLD_PLAY_R111__;cold=!!P&&typeof P.foot==='function'&&P.prefs?.().props!==false&&P.foot(p.path)===undefined&&typeof readyImage==='function'&&!!readyImage(p.path);}catch(_){}
  if(cold){ctx.save();try{ctx.globalAlpha=0;base.apply(this,[p,...a]);}catch(e){fail(e);}finally{ctx.restore();}}}
 const lift=frame?0:liftOf(p)+p.r521Up*p.height*z,flat=p.r521Flat&&typeof shadow==='function',sh=flat?shadow:null;
 /* 병원 소품판 그림(가림막)은 엔진 drawProp 이 아니라 a5 가 그려 visualLiftPx 를 타지 않는다 → 그 그리기만 위로 옮긴다 */
 const nudge=frame&&p.r521Up>0&&typeof ctx!=='undefined'&&ctx&&typeof ctx.translate==='function';try{contact(p);}catch(e){fail(e);}if(lift>0)p.visualLiftPx=lift;if(flat)shadow=function(){};if(nudge){ctx.save();ctx.translate(0,-p.r521Up*p.height*z);}
 try{return base.apply(this,[p,...a]);}finally{if(nudge)ctx.restore();if(flat)shadow=sh;if(lift>0)delete p.visualLiftPx;}};}}catch(e){fail(e);}

// R521-3 실내 불꽃 조명(사용자 2026-11-10 "내부에 화로가 있는문제"): 원인 — R406 의 '실내엔 전구등' 바꿈은 사몽 지역 표(R115)로 실내를 알아봐 병원 본관(ep1a08)이 빠져 있었고,
//  R92 가 병원 묶음 4종 가운데 촛대(01)·화로(02)를 골라 세웠다(실측 12곳). → R92 가 등불 종류를 묻는 R102.lamps 에 병원 본관에서는 전등형 등롱대(03) 하나만 돌려준다. 자리·개수·빛 웅덩이는 그대로.
const LAMP='lights_hospital_03';
try{const P=window.__STORYWORLD_PROPS_R102__;if(P&&typeof P.lamps==='function'){const base=P.lamps;
 window.__STORYWORLD_PROPS_R102__=Object.freeze({...P,lamps:function(z,reg,items,list,fam){try{const r=typeof room!=='undefined'?room:null;if(enabled(r)&&Array.isArray(items)){const out=items.filter(i=>i&&i.kind==='light'&&i.id===LAMP);if(out.length){stats.lamps++;return out;}}}catch(e){fail(e);}
  return base.apply(this,arguments);}});}}catch(e){fail(e);}

function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_HOSPITAL_ROOMS_R521__=Object.freeze({revision:REV,ART,SHAPE,PLAN,PATHS,samplesOf,embedOf,hiddenOf,enabled,plan,list,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,dropLog:dropLog.slice(),room:typeof room!=='undefined'&&room&&enabled(room)?list(room).map(p=>({id:p.id,art:p.r521.art,x:p.x,y:p.y,flip:!!(p.r303Flip||p.visualFlipXB3)})):null})});
})();
