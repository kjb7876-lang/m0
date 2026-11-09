// R521 병원 방 꾸미기 — 사용자 2026-11-09 22:52Z "전반적인 레벨업 … 특히 이미지부분 … 조형물 배치를 공간의 용도에 맞게 … 병실이라면 침대와 의료 설비".
//  원인(헤드리스 실측, main 81c1252): '피로 물든 병원'(ep1a08)은 86×112칸·방 20여 곳인데 보이는 가구가 11점뿐이었다(들것 4·휠체어 4·가림막 3).
//   · 지역 공용 조형물(짐수레·무너진 기둥·기억 석상)은 hospital-improvements-a5 가 '의료 소품이 아님'으로 모두 가린다(맞는 판단).
//   · 방 이름으로 가구를 놓는 R449 는 R171 방 자료가 있는 지역만 맡아, 병동 미로(hospitalDoorsB3)인 병원 본관은 빠져 있었다.
//   → 16×16칸 병실에 들것 한 대, 진료실·처치 준비실·로비는 빈 방. 벽과 바닥만 보여 방의 쓰임새가 읽히지 않았다.
//  고침(그리기 전용 — 충돌·길찾기·몹·저장·문·목표·서사·room.props 그대로):
//   방 쓰임새(병동 미로의 방 이름: 병실·진료실·처치 준비실·관찰실·로비·복도)에 맞춰 손으로 짠 배치표 한 장.
//   · 병실: 머리를 벽에 붙인 침대 줄 + 침대 곁 탁자·수액대·감시 모니터·식판 탁자·가림막. 방마다 줄 세운 벽과 대수를 달리한다.
//   · 진료실: 책상+의자(벽 쪽), 진찰대(들것)+진찰등+둥근 의자, 약장.
//   · 처치 준비실: 약장·사물함 줄, 기구 수레, 세워 둔 들것, 수액대.
//   · 로비·복도: 접수대, 대기 의자, 벽에 기댄 목발·휠체어, 벽에 붙여 세운 들것(통로 가운데는 비움).
//   · 모든 가구는 화면에 보이는 뒤쪽 두 벽(북·서)에서 2.4칸 안. 방 가운데(전투 공간)·문·출입구·시작 자리·보스방·길잡이 마디는 비운다.
//   · 그림은 이미 게임에 있던 병원 묶음(assets/hospital-maze — 드라이브 Isometric 84 파생, 지금까지 7점만 쓰임)·R415 병원 가구·병원 소품판(가림막)과
//     드라이브 Hospital_SmallProps8 파생 3점(assets/r521: 진찰등·식판 탁자·목발). 모두 낡은 상아색+탁한 청록 한 계열. 불꽃 조명·외부 게임 자산 없음.
//   · 그림은 원래 그려진 방향(등각·광원)을 지킨다: 서쪽 벽용 그림을 북쪽 벽에 쓸 때만 좌우 거울(침대·탁자처럼 좌우가 같은 꼴만), 임의 회전·크기 흔들기 없음.
//  그리는 길: draw() 동안만 room.props 뒤에 덧붙인다(병원 소품판 visual-test 와 같은 방식) → 엔진 drawProp 사슬(시야 가림 SIGHT24·R329 그림자·R448 겹침·R451 빛)을 그대로 탄다.
//   a5 의 '의료 소품만' 거름은 r521Ward 표시로 지난다. 그림은 지역 유지 목록(regionById.ep1a08.paths)에 넣고, 그릴 때 없으면 1.5초 간격으로 다시 읽는다.
//  결정성: 표는 고정(난수 없음). 발 자리가 바닥 밖·벽 안이면 그 한 점만 뺀다(지도 판이 바뀌어도 벽에 박히지 않게).
//  끄기: localStorage['storyworld.r521.rooms']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HOSPITAL_ROOMS_R521__)return;
const REV='R521-hospital-rooms-1',KEY='storyworld.r521.rooms';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={builds:0,placed:0,dropped:0,frames:0,shown:0,reloads:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const fin=Number.isFinite;

// ---- 그림 ------------------------------------------------------------------------------------------
//  h = 그림 높이(px, zoom 전 — 영웅 키 66). flat = 낮고 넓은 가구: 엔진 발밑 타원 그림자를 끈다(그림 아래 가운데가 가구 모서리라 타원이 가구 밖 바닥에 구멍처럼 떨어졌다 — 그림에 이미 바닥 닿는 음영이 있다).
//  face = 그림이 원래 등을 댄 벽('w' 서쪽 벽 / 'n' 북쪽 벽 / 's' 어느 벽이든). d = 발(그림 아래 가운데)과 벽 사이 칸.
//  크기 기준: 1칸 ≈ 1m. 침대 2.1×1.0m, 들것 2.0×.75m, 약장 1.5×.55m, 사물함 .5×.5×1.9m, 책상 1.5×.8m.
const ATLAS='assets/visual-test/hospital-prop-atlas-oriented.png';
const ART=Object.freeze({
 bed:{path:'assets/hospital-maze/bed.png',h:88,face:'w',d:1.6,flat:true},
 stretcher:{path:'assets/hospital-maze/stretcher.png',h:64,face:'n',d:.95,flat:true},
 cabinet:{path:'assets/hospital-maze/cabinet.png',h:62,face:'n',d:.75,flat:true},
 monitor:{path:'assets/hospital-maze/monitor.png',h:60,face:'s',d:.55},
 iv:{path:'assets/hospital-maze/iv.png',h:74,face:'s',d:.5},
 stool:{path:'assets/hospital-maze/stool.png',h:32,face:'s',d:1.5},
 wheelchair:{path:'assets/hospital-maze/chair.png',h:52,face:'w',d:.9,flat:true},
 table:{path:'assets/r415/props/care-table.webp',h:38,face:'n',d:.6,flat:true},
 locker:{path:'assets/r415/props/locker.webp',h:82,face:'n',d:.55},
 bench:{path:'assets/r415/props/waiting-bench.webp',h:58,face:'n',d:.8,flat:true},
 counter:{path:'assets/r415/props/lobby-counter.webp',h:80,face:'n',d:1.2,flat:true},
 desk:{path:'assets/r415/props/report-desk.webp',h:64,face:'n',d:.95,flat:true},
 chair:{path:'assets/r415/props/labcoat-chair.webp',h:52,face:'n',d:1.9},
 cart:{path:'assets/r299/cart.webp',h:48,face:'s',d:.8,flat:true},
 lamp:{path:'assets/r521/exam-lamp.webp',h:74,face:'s',d:.6},
 overbed:{path:'assets/r521/overbed-table.webp',h:48,face:'w',d:1.6,flat:true},
 crutches:{path:'assets/r521/crutches.webp',h:46,face:'s',d:.35},
 curtain:{path:ATLAS,h:84,face:'w',d:1.2,frame:'curtain'}
});
const PATHS=Object.freeze([...new Set(Object.values(ART).map(a=>a.path))]);

// ---- 배치표 ----------------------------------------------------------------------------------------
//  RUN(방, 쓰임새, 벽, 벽 안쪽 면 좌표, [[그림, 벽을 따라 좌표, (벽에서 칸)], …])
//   벽 'w' = 서쪽 벽(x 고정, 따라가는 좌표 y) · 'n' = 북쪽 벽(y 고정, 따라가는 좌표 x). 좌표는 병동 미로 지도(hospitalCoreLayoutB2) 칸.
const RUN=(room,use,wall,at,items)=>({room,use,wall,at,items});
const PLAN=Object.freeze([
 // 북쪽 병실 A — 정돈된 6인실: 서쪽 벽 침대 4대(머리 벽), 북쪽 벽 약장·사물함
 RUN('north-ward-a','ward','w',30.12,[['bed',6.2],['table',7.5],['bed',9.4],['iv',10.55],['curtain',11.2],['bed',12.6],['monitor',13.8],['bed',15.8],['table',17.1]]),
 RUN('north-ward-a','ward','n',4.12,[['cabinet',36.4],['locker',38.3],['locker',38.95],['overbed',42.2,1.4]]),
 // 북쪽 병실 B — 북쪽 벽 줄(서쪽은 A 와 통하는 틈)
 RUN('north-ward-b','ward','n',4.12,[['bed',51.2],['table',52.5],['bed',54.4],['monitor',55.6],['curtain',56.2],['bed',57.6],['iv',58.8],['bed',60.8],['table',62.1],['bed',64.0]]),
 RUN('north-ward-b','ward','w',48.12,[['crutches',17.2],['stool',18.3,1.0]]),
 // 북쪽 병실 C — 격리 병실: 침대마다 가림막
 RUN('north-ward-c','ward','w',68.12,[['bed',6.4],['curtain',8.0],['monitor',8.7],['bed',10.4],['curtain',12.0],['iv',12.7],['bed',14.4],['table',15.7]]),
 RUN('north-ward-c','ward','n',4.12,[['cabinet',74.2],['cart',76.4],['wheelchair',79.6,1.0]]),
 // 처치 준비실 — 약장·사물함 줄 + 기구 수레, 서쪽 벽에 들것
 RUN('preparation','prep','n',30.12,[['locker',11.2],['locker',11.85],['cabinet',13.9],['cabinet',24.6],['cart',26.6],['iv',27.8],['iv',28.4]]),
 RUN('preparation','prep','w',10.12,[['stretcher',33.4,.9],['lamp',35.2],['stool',36.3,1.1],['cabinet',39.2,.9]]),
 RUN('preparation-east','prep','n',30.12,[['cabinet',40.2],['locker',42.1],['stretcher',47.0],['cart',50.2],['cabinet',58.4],['locker',60.3],['locker',60.95]]),
 RUN('preparation-annex','prep','n',30.12,[['bed',70.4],['monitor',71.6],['lamp',72.3],['cabinet',80.4]]),
 // 진료실 a~d — 책상+의자, 진찰대+진찰등, 약장
 RUN('consult-a','consult','n',52.12,[['desk',12.6],['chair',13.0],['cabinet',15.8],['locker',26.0],['bench',28.6]]),
 RUN('consult-a','consult','w',10.12,[['stretcher',54.6,.9],['lamp',56.0]]),
 RUN('consult-b','consult','n',52.12,[['desk',35.6],['chair',36.0],['cabinet',45.4]]),
 RUN('consult-b','consult','w',34.12,[['stretcher',55.0,.9],['lamp',56.4],['stool',57.2,1.2]]),
 RUN('consult-c','consult','n',52.12,[['cabinet',50.9],['desk',60.2],['chair',60.6],['locker',65.4],['locker',66.05]]),
 RUN('consult-c','consult','w',50.12,[['iv',54.4],['table',55.4]]),
 RUN('consult-d','consult','n',52.12,[['desk',78.4],['chair',78.8]]),
 RUN('consult-d','consult','w',70.12,[['cabinet',54.2,.9],['bench',57.0,1.0],['crutches',59.0]]),
 // 남쪽 병실 a~d — 서쪽 벽 침대 줄(북쪽은 넓은 복도로 트임), b 는 북쪽 벽
 RUN('south-ward-a','ward','w',10.12,[['bed',92.2],['table',93.5],['bed',95.4],['iv',98.0],['bed',100.0],['monitor',101.2]]),
 RUN('south-ward-b','ward','n',92.12,[['bed',34.4],['table',35.7],['bed',37.6],['curtain',39.2],['bed',40.6]]),
 RUN('south-ward-b','ward','w',26.12,[['cabinet',96.4,.9],['overbed',99.4],['wheelchair',101.6]]),
 RUN('south-ward-c','ward','w',44.12,[['bed',92.2],['curtain',93.8],['bed',95.4],['table',96.7],['bed',100.2],['iv',101.4]]),
 RUN('south-ward-d','ward','w',64.12,[['bed',92.6],['monitor',93.8],['bed',95.8],['table',97.1],['crutches',98.2],['bed',100.4]]),
 // 로비 — 접수대·대기 의자
 RUN('entry-hall','lobby','n',106.12,[['bench',21.4],['bench',23.6],['wheelchair',26.4,1.0],['bench',35.6],['bench',37.8],['crutches',39.6],['counter',48.6],['bench',59.4],['bench',61.6],['locker',64.6],['bench',73.4],['stretcher',77.0]]),
 // 복도 — 벽에 붙여 세운 들것·대기 의자(통로 가운데는 비움)
 RUN('upper-cross','corridor','n',22.12,[['bench',25.4],['stretcher',30.6],['bench',44.2],['wheelchair',47.4,1.0],['stretcher',64.6],['iv',67.0],['bench',70.4]]),
 // 아래 복도 — 벽 덩어리 남쪽 면(= 그 아래 넓은 복도의 북쪽 벽)에 대기 의자·들것
 RUN('lower-cross','corridor','n',80.12,[['bench',37.0],['bench',39.0],['stretcher',47.6],['iv',49.4]])
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
function plan(r){const out=[],clear=keepClear(r),hit=typeof blocked==='function'?(x,y,rad)=>{try{return !!blocked(x,y,rad,r);}catch(_){return true;}}:()=>false;let n=0,dropped=0;
 for(const run of PLAN)for(const it of run.items){const a=ART[it[0]];n++;if(!a)continue;
  const along=+it[1],d=fin(+it[2])?+it[2]:a.d,x=run.wall==='w'?run.at+d:along,y=run.wall==='w'?along:run.at+d;
  const bad=!fin(x+y)||hit(x,y,.12)||(x>BOSS[0]&&x<BOSS[2]&&y>BOSS[1]&&y<BOSS[3])||clear.some(([cx,cy,cr])=>Math.hypot(cx-x,cy-y)<cr);
  if(bad){dropped++;continue;}
  const flip=a.face!=='s'&&a.face!==run.wall;
  const p={id:'r521:ward:'+run.room+':'+n,path:a.path,x:+x.toFixed(3),y:+y.toFixed(3),height:a.h,solid:false,visible:true,enabled:true,presentationOnly:true,autoTargetEligible6:false,
   r521Ward:true,r521Flat:!!a.flat,r521:Object.freeze({room:run.room,use:run.use,wall:run.wall,art:it[0],d})};
  if(a.frame){p.visualHospitalFrame=a.frame;p.hospitalDressingB3=true;p.hospitalZone13=true;p.visualFlipXB3=flip;}else if(flip)p.r303Flip=true;
  out.push(p);}
 stats.builds++;stats.placed=out.length;stats.dropped=dropped;return out;}
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
try{if(typeof drawProp==='function'&&typeof shadow==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||!p.r521Ward||!p.r521Flat)return base.apply(this,[p,...a]);
 const sh=shadow;shadow=function(){};try{return base.apply(this,[p,...a]);}finally{shadow=sh;}};}}catch(e){fail(e);}

function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_HOSPITAL_ROOMS_R521__=Object.freeze({revision:REV,ART,PLAN,PATHS,enabled,plan,list,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:typeof room!=='undefined'&&room&&enabled(room)?list(room).map(p=>({id:p.id,art:p.r521.art,x:p.x,y:p.y,flip:!!(p.r303Flip||p.visualFlipXB3)})):null})});
})();
