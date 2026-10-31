/* R123 사몽 구역 분위기 (지시서 docs/r123-night.md A항, 2026-10-29 밤)
 * 원문 장면에 맞춰 구역마다 '분위기 층'을 덧입힌다. 지형·충돌·길·몹·목표·저장은 건드리지 않는다. 새 그림 파일 없이 코드로 그린다.
 *  ① S-04 감정의 탑: 구역마다 층(공터·1F~16F). 들어서면 층 표시와 16칸 높이 눈금, 층이 바뀌면 승강기 연출(빛줄기가 흐르고 숫자가 넘어감),
 *     바닥에 칠한 층 번호, 벽가의 층 표지판·창(높을수록 하늘이 어둡고 구름이 발아래), 출구의 승강기 문. 위층일수록 화면 양옆이 좁아지고 어두워진다.
 *  ② S-06 (R180: 디스토피아 DYS-01~13 — 연도 없는 구간은 구간 제목만 띄운다. 이전 네오 서울 NS-01~10 설명:) 들어서면 원문 제목의 연도(2189·2174·2196·연도 없음…)가 숫자를 굴리다 멈춘다. 시대가 바뀌면 화면 일그러짐·
 *     초록 데이터 비·시계 째깍. 구역마다 기계 폐허 도시 / 초록 글자 데이터 세계 / 따뜻한 빛의 거대 나무 숲을 번갈아 입힌다.
 *  ③ S-01 꿰맨 장미의 집: 뒤틀린 동화(거대 찻잔·바늘과 실·실패·단추 눈 인형·기운 액자, 체스판 바닥, 장미 꽃잎·실 보풀, 실내는 방이 살짝 기운다).
 *  ④ S-02 밤의 출석부(학교)·S-03·S-05·M(현실): 꺼졌다 켜지는 복도등, 문 너머에 섰다 사라지는 그림자, 바닥의 소용돌이 낙서, 학교는 손전등 원뿔 시야.
 *  ⑤ 화가 구역 R-00~R-17: 원문의 여섯 화가(고흐 R-02·달리 R-03/R-13·마네 R-04·피카소 R-05·클림트 R-06·모네 R-07)별 색·바닥 붓결·조형물,
 *     그 밖의 장은 공통 초현실(녹는 시계·떠 있는 돌·끝없는 회랑 액자·교정 부호).
 * 조형물은 표현 전용 소품(충돌·피해·잡기 없음)이고, 바닥 무늬는 색별로 한 번에 그려 그리기 명령 수를 아낀다. 설정 키 r123.mood.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_MOOD_R123__)return;
 const REV='R123-mood-1';
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r123.mood';
 const prefs={mood:true,deco:true,floor:true,overlay:true,banner:true,tick:true,tilt:true,art:true};
 // R126: Drive 2026-10-29 원화(assets/r126/props, scripts/r126-drive-props.py). 그림이 준비되면 게임 소품 그리기로, 그 전에는 코드 그림으로.
 const ART={teacup:{path:'assets/r126/props/teacup.webp',h:110},needle:{path:'assets/r126/props/needle.webp',h:70},locker:{path:'assets/r126/props/locker.webp',h:150},noticeboard:{path:'assets/r126/props/noticeboard.webp',h:80,lift:56},badge:{path:'assets/r126/props/badge.webp',h:22},
  // R129: Drive 2026-10-30 원화(scripts/r129-drive-assets.py) — 숲 나무·데이터 비석·기계 철탑, 화가 소품 3점, 녹는 시계 4키(가까이 가면 K1→K4 한 번)
  tree:{path:'assets/r129/props/tree.webp',h:230},monolith:{path:'assets/r129/props/monolith.webp',h:130},pylon:{path:'assets/r129/props/pylon.webp',h:210},
  brush:{path:'assets/r129/props/brush.webp',h:40},tweezers:{path:'assets/r129/props/tweezers.webp',h:40},vase:{path:'assets/r129/props/vase.webp',h:64},
  clock:{path:'assets/r129/props/clock-k1.webp',h:92,frames:[1,2,3,4].map(i=>'assets/r129/props/clock-k'+i+'.webp')}};
 const clockPlay=new Map();
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
 function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}last=null;try{window.__STORYWORLD_CINEMA_R114__?.applyGrade?.(true);}catch(_){}return{...prefs};}
 const stats={rooms:0,deco:0,decals:0,frames:0,banners:0,warps:0,lifts:0,drawnDeco:0,drawnDecals:0,ghosts:0,cmdsMax:0};
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const now=()=>typeof time==='number'?time:performance.now()/1000,wall=()=>performance.now()/1000;
 const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
 const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
 const ZN=()=>window.__STORYWORLD_SAMONG_ZONES_R115__,SM=()=>window.__STORYWORLD_SAMONG_R103__,TXT=()=>window.__STORYWORLD_SAMONG_TEXT_R103__?.sections||{};
 const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
 const zoneIdOf=r=>r?.exploration?.samongR115?.zone||null;
 const dream=()=>typeof layer==='undefined'||layer==='DREAM';
 const busy=()=>(typeof modal!=='undefined'&&!!modal)||(typeof storyScene!=='undefined'&&!!storyScene)||(typeof loading!=='undefined'&&!!loading);
 const U=()=>(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1);

 // ---- 구역 → 분위기 ------------------------------------------------------------------------------------
 function sectionOf(z){if(!z)return null;let out=null;const walk=o=>{if(out||!o||typeof o!=='object')return;if(typeof o.key==='string'&&/^(NS-|DYS-|R-|S-|M\d|epilogue)/.test(o.key)){out=o.key;return;}for(const v of Object.values(o))walk(v);};
  walk([z.cue,z.clues,z.solve,z.after]);return out;}
 // R180: S-06 디스토피아(DYS-01~13) — 구역마다 결을 입힌다(전장·기지=기계 폐허 / 기밀·AI·도약 기록=데이터 / 스무 살의 원룸=따뜻한 빛).
 const ERA={'sz115-S06-1':'machine','sz115-S06-2':'machine','sz115-S06-3':'machine','sz115-S06-4':'machine','sz115-S06-5':'machine','sz115-S06-6':'data','sz115-S06-7':'data','sz115-S06-8':'machine','sz115-S06-9':'machine','sz115-S06-10':'machine','sz115-S06-11':'data','sz115-S06-12':'machine','sz115-S06-13':'machine','sz115-S06-14':'machine','sz115-S06-15':'machine','sz115-S06-16':'data','sz115-S06-17':'machine','sz115-S06-18':'machine','sz115-S06-19':'machine','sz115-S06-20':'data','sz115-S06-21':'data','sz115-S06-22':'forest','sz115-S06-23':'data'};
 // 화가 구역: 원문 R-xx 장에서 그 화가의 이름·화풍이 중심인 장(고흐 R-02, 달리 R-03·R-13, 마네 R-04, 피카소 R-05, 클림트 R-06, 모네 R-07).
 const PAINTER={'R-00':'gallery','R-01':'gallery','R-02':'gogh','R-03':'dali','R-04':'manet','R-05':'picasso','R-06':'klimt','R-07':'monet','R-08':'lesson',
  'R-09':'surreal','R-10':'surreal','R-11':'surreal','R-12':'blank','R-13':'dali','R-14':'gallery','R-15':'surreal','R-16':'surreal','R-17':'garden'};
 function towerFloors(z){if(!z)return null;if(z.id==='sz115-S04-1')return{list:['G'],ground:true};if(z.id==='sz115-S04-2')return{list:[1]};
  const m=/(\d+)(?:~(\d+))?층/.exec(z.title||'');if(!m)return null;const a=+m[1],b=m[2]?+m[2]:a,list=[];for(let f=a;f<=b;f++)list.push(f);return{list};}
 function nsInfo(sec){const t=String(TXT()[sec]?.title||'').replace(/^\[[^\]]*\]\s*/,''),y=/(\d{4})년/.exec(t);
  return{year:y?y[1]:null,label:(y?t.replace(/\d{4}년\s*·?\s*/,''):t).trim()||sec,noYear:!y};}
 function themeOf(zid){const m=/^sz115-([A-Z0-9]+)-(\d+)$/.exec(String(zid||''))||/^sz162-([A-Z0-9-]+)-[BD]$/.exec(String(zid||''))||/^sz173-([A-Z0-9-]+)-G$/.exec(String(zid||''));/* R173: G(코어 호위) 구역도 그 장의 분위기 */if(!m)return null;const ch=m[1].replace('-',''),/* R162: 새 B·D 구역(sz162-<장>-B/D)도 그 장의 분위기 */z=ZN()?.zone?.(zid)||null,sec=sectionOf(z);
  if(ch==='S04')return{key:'tower',zone:zid,sec:'S-04',floors:towerFloors(z),z};
  if(ch==='S06')return{key:ERA[zid]||'machine',zone:zid,sec,ns:sec&&/^(NS-|DYS-)/.test(sec)?nsInfo(sec):null,z};
  if(ch==='S01')return{key:'rose',zone:zid,sec:'S-01',z};
  if(ch==='S02')return{key:'school',zone:zid,sec:'S-02',z};
  if(ch==='S03')return{key:'ink',zone:zid,sec,z};      // R124: 흑과 백 — 먹·검은 고리, 화면을 흑백 쪽으로
  if(ch==='S05')return{key:'gyeong',zone:zid,sec,z};   // R124: 경성의 밤 — 함박눈·등롱
  if(ch==='M')return{key:'manga',zone:zid,sec,z};
  if(ch==='P')return{key:'root',zone:zid,sec:sec||'threshold',z};     // R124: 문턱 — 코어 아래 검은 뿌리
  if(ch==='S07')return{key:'persona',zone:zid,sec:'S-07',z};          // R124: 페르소나 — 가면·손님 의자 하나뿐인 식탁
  if(/^R[A-G]$/.test(ch))return{key:PAINTER[sec]||'surreal',zone:zid,sec,painter:true,z};
  return null;}

 // tint: [색, 섞는 방식] · shade: 곱하기로 어둡게 · fog: 안개 그라데이션 · parts: 떠다니는 입자 · floor: 바닥 무늬 · deco: 조형물 [종류, 수, 자리(wall=뒷벽 곁)]
 const THEMES={
  rose:{tint:['rgba(200,90,130,.14)','soft-light'],shade:'rgba(40,20,36,.10)',fog:'radial-gradient(ellipse 90% 60% at 50% 115%,rgba(120,36,70,.30),rgba(0,0,0,0) 70%)',
   parts:[['petal',22],['thread',8]],floor:['checker','petals','stitch'],deco:[['teacup',2],['needle',2],['spool',2],['doll',2],['frame',2,'wall']]},
  tower:{tint:['rgba(80,90,120,.12)','multiply'],shade:'rgba(10,12,20,.10)',fog:null,parts:[['dust',16]],floor:['number','scuff'],deco:[['window',3,'wall'],['sign',1,'wall']]},
  machine:{tint:['rgba(255,120,60,.08)','overlay'],shade:'rgba(36,46,64,.22)',fog:'linear-gradient(to top,rgba(80,64,56,.30),rgba(0,0,0,0) 48%)',
   parts:[['spark',14],['ash',22]],floor:['oil','crack','hazard'],deco:[['pylon',2],['gear',2],['beacon',2]]},
  data:{tint:['rgba(40,255,140,.10)','screen'],shade:'rgba(0,28,14,.26)',fog:'linear-gradient(to bottom,rgba(0,40,20,.30),rgba(0,0,0,0) 40%)',
   parts:[],rain:.42,floor:['grid','glyph'],deco:[['monolith',3]]},
  forest:{tint:['rgba(255,190,110,.15)','soft-light'],shade:null,fog:'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(255,210,140,.22),rgba(0,0,0,0) 65%)',
   parts:[['mote',26]],floor:['sunpool','leaf','roots'],deco:[['tree',3]]},
  school:{tint:['rgba(130,180,170,.12)','soft-light'],shade:'rgba(8,16,26,.24)',fog:null,parts:[['dust',12]],floor:['lamps','spiral','chalk'],deco:[['locker',2,'wall'],['noticeboard',2,'wall'],['badge',1]],ghosts:true,cone:true},
  manga:{tint:['rgba(255,255,255,.05)','soft-light'],shade:'rgba(16,10,16,.20)',fog:null,parts:[['dust',10]],floor:['lamps','spiral'],deco:[],ghosts:true},
  ink:{tint:null,filter:'grayscale(.78) contrast(1.12)',shade:'rgba(10,10,12,.10)',fog:null,parts:[['dust',10]],floor:['lamps','ring','splat','spiral'],deco:[['inkpost',2]],ghosts:true},
  gyeong:{tint:['rgba(220,170,110,.12)','soft-light'],shade:'rgba(14,12,22,.20)',fog:'linear-gradient(to bottom,rgba(200,210,230,.10),rgba(0,0,0,0) 45%)',parts:[['snow',34]],floor:['lamps','spiral'],deco:[['lantern',3]],ghosts:true},
  root:{tint:['rgba(150,20,30,.10)','soft-light'],shade:'rgba(30,6,8,.07)',fog:'linear-gradient(to top,rgba(110,14,20,.22),rgba(0,0,0,0) 45%)',parts:[['ash',16]],floor:['veins','core'],deco:[['tendril',3]]},
  persona:{tint:['rgba(200,210,235,.10)','soft-light'],shade:'rgba(12,10,22,.18)',fog:'radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 45%,rgba(20,16,36,.28) 100%)',parts:[['dust',8]],floor:['glint'],deco:[['mask',3,'wall'],['mirror',1],['chair',1]]},
  gallery:{tint:['rgba(200,170,120,.10)','soft-light'],shade:'rgba(20,14,10,.12)',fog:null,parts:[['dust',10]],floor:['drip'],deco:[['easel',2],['endless',1,'wall'],['frame',2,'wall'],['stone',1]]},
  lesson:{tint:['rgba(200,150,120,.10)','soft-light'],shade:'rgba(24,10,10,.14)',fog:null,parts:[['dust',10]],floor:['drip','redmark'],deco:[['easel',2],['frame',2,'wall']]},
  gogh:{tint:['rgba(60,90,210,.13)','soft-light'],shade:'rgba(8,14,40,.14)',fog:'radial-gradient(ellipse 70% 50% at 50% 0%,rgba(255,220,90,.16),rgba(0,0,0,0) 60%)',
   parts:[['paint',18]],floor:['swirl'],deco:[['sunflower',3],['cypress',2]]},
  dali:{tint:['rgba(230,170,90,.12)','soft-light'],shade:null,fog:'linear-gradient(to bottom,rgba(70,110,170,.20),rgba(0,0,0,0) 42%)',parts:[['dust',8]],floor:['sand'],deco:[['clock',3],['stone',3]]},
  manet:{tint:['rgba(240,225,190,.08)','soft-light'],shade:'rgba(18,16,14,.30)',fog:null,parts:[],floor:['cream'],deco:[['bottle',3],['frame',2,'wall'],['vase',2]]},
  picasso:{tint:['rgba(40,90,200,.20)','soft-light'],shade:'rgba(8,18,48,.20)',fog:null,parts:[],floor:['facet'],deco:[['shard',3]]},
  klimt:{tint:['rgba(255,200,60,.14)','soft-light'],shade:'rgba(30,20,4,.10)',fog:null,parts:[['gold',26]],floor:['mosaic'],deco:[['goldpillar',3],['tweezers',2]]},
  monet:{tint:['rgba(170,150,225,.15)','soft-light'],shade:null,fog:'linear-gradient(to top,rgba(150,190,200,.16),rgba(0,0,0,0) 50%)',parts:[['pollen',14]],floor:['lily'],deco:[['willow',2],['brush',2]]},
  surreal:{tint:['rgba(200,150,110,.10)','soft-light'],shade:'rgba(20,14,24,.10)',fog:null,parts:[['dust',8]],floor:['sand'],deco:[['clock',2],['stone',3],['endless',1,'wall']]},
  blank:{tint:['rgba(255,255,255,.10)','soft-light'],shade:null,fog:'radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0) 40%,rgba(230,230,225,.16) 100%)',parts:[['dust',6]],floor:['blank'],deco:[['canvas',3]]},
  garden:{tint:['rgba(255,200,130,.12)','soft-light'],shade:null,fog:'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(255,220,160,.18),rgba(0,0,0,0) 65%)',parts:[['mote',14]],floor:['sunpool','leaf'],deco:[['frame',2],['tree',1]]}};

 // ---- 방 단위 상태(구역에 처음 들어설 때 한 번 만든다) -------------------------------------------------
 const rooms=new WeakMap();
 const K=(x,y)=>x+':'+y;
 function inRect(R,x,y){return R&&x>=R.x&&x<R.x+R.w&&y>=R.y&&y<R.y+R.h;}
 function floorAt(T,x,y){const f=T.floors;if(!f)return null;if(f.ground)return'G';const rs=T.z?.rooms||[];if(f.list.length>1&&T.z?.tpl==='tower'){const i=rs.findIndex(R=>inRect(R,x,y));if(i>=0)return f.list[Math.min(i,f.list.length-1)];}return f.list[0];}
 function heightOf(f){return f==='G'?0:clamp((+f||1)/16,0,1);}
 function build(r,T){const L=r.exploration,cells=(L?.floorCells||[]).map(c=>[c[0],c[1]]),set=new Set(cells.map(([a,b])=>K(a,b))),X=L?.samongR103||{},R=rng(hash(T.zone+':r123'));
  const st={zone:T.zone,theme:T,decals:[],ghosts:[],lamps:[],deco:[],built:now()};
  const has=(a,b)=>set.has(K(a,b)),inner=(a,b)=>[[0,0],[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>has(a+dx,b+dy));
  const keep=[L?.entry&&{...L.entry,r:3.2},X.exit&&{...X.exit,r:3.2},X.dais&&{...X.dais,r:6.5},X.save&&{...X.save,r:2.4},...(X.chests||[]).map(c=>({...c,r:2})),...(X.landings||[]).map(c=>({...c,r:2})),
   ...(r.props||[]).filter(p=>p&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,r:p.r115Clue||p.r115Stmt!=null||p.samongR103?2.6:1.5}))].filter(Boolean);
  const pool=cells.map(([a,b])=>({x:a+.5,y:b+.5,a,b,k:R(),wall:(!has(a-1,b)||!has(a,b-1))&&has(a+1,b)&&has(a,b+1)&&has(a+1,b+1),inner:inner(a,b)})).sort((a,b)=>a.k-b.k);
  const blockedAt=(x,y,rad=.45)=>{const A=window.StoryPhase1;return typeof A?.explorationBlocked==='function'?A.explorationBlocked(L,x,y,rad):false;};
  const used=[];const spot=(wall,gap=3)=>{for(const q of pool){if(wall?!q.wall:!q.inner)continue;if(keep.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<p.r)||used.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<gap))continue;if(blockedAt(q.x,q.y,wall?.12:.45))continue;used.push(q);return q;}return null;};// 벽가 칸은 가운데만 비어 있으면 된다
  const D=THEMES[T.key];
  // 조형물
  const decoList=[...(D.deco||[])];if(T.key==='tower'&&X.exit&&T.z?.kind!=='confront')st.lift={x:X.exit.x,y:X.exit.y};
  if(T.key==='tower'&&L?.entry){let best=null,bk=1e9;for(const q of pool){if(!q.wall)continue;const de=Math.hypot(q.x-L.entry.x,q.y-L.entry.y);if(de<3.4||de>9)continue;if(keep.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<Math.min(p.r,2.4)&&!(p.x===L.entry.x&&p.y===L.entry.y)))continue;if(blockedAt(q.x,q.y,.12))continue;if(de<bk){bk=de;best=q;}}
   if(best){used.push(best);const d={id:'r123:'+T.zone+':stairs',kind:'stairs',x:best.x,y:best.y,seed:3};if(!has(best.a,best.b-1)){d.y=best.b+.15;d.dir=[0,-1];d.perp=[1,0];}else{d.x=best.a+.15;d.dir=[-1,0];d.perp=[0,1];}st.deco.push(d);}}// 아래층에서 올라온 계단
  for(const[kind,n,where]of decoList)for(let i=0;i<n;i++){const q=spot(where==='wall',kind==='tree'?5:3.2)||(where==='wall'?spot(false,3.2):null);if(!q)continue;
   const d={id:'r123:'+T.zone+':'+kind+':'+i,kind,x:q.x,y:q.y,seed:hash(T.zone+kind+i),tilt:T.key==='rose'&&where!=='wall'?(R()*2-1)*.2:0};
   if(where==='wall'&&q.wall){if(!has(q.a,q.b-1)){d.y=q.b+.12;d.face='x';}else{d.x=q.a+.12;d.face='y';}}// 뒷벽에 붙이고 벽면 기울기에 맞춰 그린다
   if(kind==='sign'||kind==='window'){d.floor=floorAt(T,q.x,q.y);}st.deco.push(d);}
  // 바닥 무늬
  const add=(g,shape)=>{st.decals.push({g,...shape});};
  const fl=D.floor||[];const pick=(n,f=()=>true)=>{const out=[];for(const q of pool){if(out.length>=n)break;if(!q.inner||!f(q))continue;if(keep.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<Math.min(p.r,2.2)))continue;out.push(q);}return out;};
  const area=cells.length;
  for(const f of fl){
   if(f==='checker'){if(T.z?.outdoor||window.__STORYWORLD_TILES_R118__?.regions?.[T.zone])continue;for(const[a,b]of cells)if(((a+b)&1)===0)add('checker',{quad:[a,b,1,1]});}
   else if(f==='petals'){for(const q of pick(Math.min(60,area/10|0)))for(let k=0;k<3;k++)add('petal',{el:[q.x+(R()-.5)*1.6,q.y+(R()-.5)*1.6,.09+R()*.07,R()*3]});}
   else if(f==='stitch'){for(const q of pick(Math.min(10,area/40|0))){const ang=R()*TAU,len=3+R()*4;for(let s=0;s<len;s+=.45){const x=q.x+Math.cos(ang)*s,y=q.y+Math.sin(ang)*s;if(!has(Math.floor(x),Math.floor(y)))break;add('stitch',{x:[x,y,.16,ang]});}}}
   else if(f==='number'){const rs=T.z?.rooms||[],spots=[];
    if(T.floors?.list?.length>1&&T.z?.tpl==='tower')rs.forEach((Rm,i)=>{if(i<T.floors.list.length)spots.push({x:Rm.x+Rm.w/2-1.2,y:Rm.y+Rm.h/2+.8,f:T.floors.list[i]});});
    else if(L?.entry){const e=L.entry,dx=X.exit?Math.sign(X.exit.x-e.x):1,dy=X.exit?Math.sign(X.exit.y-e.y):-1;spots.push({x:e.x+dx*2.2-1,y:e.y+dy*2.2+.8,f:T.floors?.list?.[0]??'G'});}
    for(const s of spots)digits(st,String(s.f==='G'?'G':s.f+'F'),s.x,s.y,1.5);}
   else if(f==='scuff'){for(const q of pick(Math.min(24,area/14|0)))add('scuff',{el:[q.x+(R()-.5),q.y+(R()-.5),.25+R()*.35,R()*3]});}
   else if(f==='oil'){for(const q of pick(Math.min(26,area/12|0)))add('oil',{el:[q.x+(R()-.5),q.y+(R()-.5),.35+R()*.8,R()*3]});}
   else if(f==='crack'){for(const q of pick(Math.min(16,area/20|0))){let x=q.x,y=q.y,a=R()*TAU;const pts=[[x,y]];for(let s=0;s<6;s++){a+=(R()-.5)*1.4;x+=Math.cos(a)*.55;y+=Math.sin(a)*.55;pts.push([x,y]);}add('crack',{line:pts});}}
   else if(f==='hazard'){if(X.exit)for(let i=-2;i<=2;i++)add(i&1?'hazardB':'hazardY',{quad:[X.exit.x-2.6+i*.5+2.5,X.exit.y+1.8,.5,.35]});}
   else if(f==='grid'){for(const[a,b]of cells){if(a%2===0)add('grid',{line:[[a,b],[a,b+1]]});if(b%2===0)add('grid',{line:[[a,b],[a+1,b]]});}}
   else if(f==='glyph'){st.glyph=cells.filter(()=>R()<.25).slice(0,400);}
   else if(f==='sunpool'){for(const q of pick(Math.min(22,area/16|0)))add('sun',{glow:[q.x+(R()-.5),q.y+(R()-.5),.9+R()*1.2]});}
   else if(f==='leaf'){for(const q of pick(Math.min(40,area/10|0)))for(let k=0;k<2;k++)add(R()<.5?'leafA':'leafB',{el:[q.x+(R()-.5)*1.5,q.y+(R()-.5)*1.5,.12+R()*.08,R()*3]});}
   else if(f==='roots'){for(const q of pick(Math.min(10,area/30|0))){let x=q.x,y=q.y,a=R()*TAU;const pts=[[x,y]];for(let s=0;s<7;s++){a+=(R()-.5)*.8;x+=Math.cos(a)*.6;y+=Math.sin(a)*.6;pts.push([x,y]);}add('root',{line:pts});}}
   else if(f==='lamps'){const sp=lowFx()?9:7;for(const q of pool){if(!q.inner)continue;if(st.lamps.some(l=>Math.hypot(l.x-q.x,l.y-q.y)<sp))continue;if(st.lamps.length>=24)break;const r0=R();st.lamps.push({x:q.x,y:q.y,mode:r0<.38?'dead':r0<.78?'dim':'flicker',seed:R()*100});}}
   else if(f==='spiral'){for(const q of pick(T.key==='manga'?3:2,q=>Math.hypot(q.x-(L?.entry?.x||0),q.y-(L?.entry?.y||0))>5)){const pts=[],r0=1.4+R()*1.2,turns=3.2,a0=R()*TAU;for(let s=0;s<=64;s++){const u=s/64,a=a0+u*turns*TAU,rr=r0*u;pts.push([q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr]);}add(T.key==='school'?'chalkS':'ink',{line:pts});}}
   else if(f==='chalk'){for(const q of pick(6))for(let k=0;k<5;k++){const x=q.x+k*.18-.4;add('chalk',{line:[[x,q.y-.3],[x,q.y+.3]]});}}
   else if(f==='drip'){const C=['dripR','dripB','dripY','dripG'];for(const q of pick(Math.min(90,area/5|0)))add(C[(R()*4)|0],{el:[q.x+(R()-.5),q.y+(R()-.5),.12+R()*.22,R()*3]});}
   else if(f==='redmark'){for(const q of pick(Math.min(10,area/30|0))){const k=(R()*3)|0;if(k===0)add('red',{line:[[q.x-.9,q.y],[q.x+.9,q.y]]});else if(k===1)add('red',{line:[[q.x-.4,q.y+.4],[q.x,q.y-.4],[q.x+.4,q.y+.4]]});else{const pts=[];for(let s=0;s<=16;s++){const a=s/16*TAU;pts.push([q.x+Math.cos(a)*.6,q.y+Math.sin(a)*.6]);}add('red',{line:pts});}}}
   else if(f==='swirl'){for(const q of pick(Math.min(260,area/2|0)))for(let k=0;k<2;k++){const x0=q.x+(R()-.5)*.8,y0=q.y+(R()-.5)*.8,a=Math.sin(x0*.35)*1.6+Math.cos(y0*.3)*1.6+R()*.3,len=.8+R()*.6;q.x2=x0;q.y2=y0;add(R()<.6?'swirlB':R()<.6?'swirlY':'swirlK',{line:[[x0,y0],[x0+Math.cos(a)*len*.5,y0+Math.sin(a)*len*.5],[x0+Math.cos(a+.6)*len,y0+Math.sin(a+.6)*len]]});}}
   else if(f==='sand'){for(const q of pick(Math.min(40,area/8|0)))add('sand',{el:[q.x+(R()-.5),q.y+(R()-.5),.4+R()*.7,R()*3]});for(const q of pick(Math.min(24,area/12|0))){const L=2.5+R()*3;add('streak',{poly:[[q.x,q.y],[q.x+.25,q.y-.1],[q.x+L+.4,q.y-L*.35],[q.x+L,q.y-L*.35+.15]]});}}
   else if(f==='cream'){for(const q of pick(Math.min(16,area/18|0)))add(R()<.5?'creamA':'blackPool',{el:[q.x,q.y,.5+R()*.9,R()*3]});}
   else if(f==='facet'){for(const q of pick(Math.min(140,area/3|0))){const pts=[];for(let k=0;k<3;k++){const a=R()*TAU,rr=.6+R()*1.1;pts.push([q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr]);}add(['facetA','facetB','facetC'][(R()*3)|0],{poly:pts});}}
   else if(f==='mosaic'){for(const q of pick(Math.min(40,area/8|0)))for(let k=0;k<4;k++)add(R()<.7?'goldSq':'goldDk',{quad:[q.x+(R()-.5)*1.4,q.y+(R()-.5)*1.4,.18+R()*.12,.18+R()*.12]});}
   else if(f==='lily'){for(const q of pick(Math.min(30,area/10|0))){add('water',{el:[q.x,q.y,.9+R()*.7,R()*3]});for(let k=0;k<2;k++)add('pad',{el:[q.x+(R()-.5)*1.2,q.y+(R()-.5)*1.2,.22+R()*.12,R()*3]});if(R()<.4)add('bloom',{el:[q.x+(R()-.5),q.y+(R()-.5),.08,0]});}}
   else if(f==='ring'){for(const q of pick(Math.min(6,area/40|0))){const pts=[],r0=1.2+R()*1.4;for(let k=0;k<=40;k++){const a=k/40*TAU*1.04;pts.push([q.x+Math.cos(a)*r0,q.y+Math.sin(a)*r0]);}add('ink2',{line:pts});}}
   else if(f==='splat'){for(const q of pick(Math.min(24,area/14|0)))for(let k=0;k<3;k++)add('blackPool',{el:[q.x+(R()-.5)*1.2,q.y+(R()-.5)*1.2,.1+R()*.35,R()*3]});}
   else if(f==='veins'){for(const q of pick(Math.min(14,area/20|0))){let x=q.x,y=q.y,a=R()*TAU;const pts=[[x,y]];for(let k=0;k<9;k++){a+=(R()-.5)*.9;x+=Math.cos(a)*.7;y+=Math.sin(a)*.7;pts.push([x,y]);if(k===4){let bx=x,by=y,ba=a+(R()<.5?1:-1);const br=[[bx,by]];for(let j=0;j<4;j++){ba+=(R()-.5)*.7;bx+=Math.cos(ba)*.55;by+=Math.sin(ba)*.55;br.push([bx,by]);}add('vein',{line:br});}}add('vein',{line:pts});}}
   else if(f==='core'){for(const q of pick(Math.min(6,area/50|0)))add('coreG',{glow:[q.x,q.y,1.4+R()]});}
   else if(f==='glint'){for(const q of pick(Math.min(30,area/12|0))){const s0=.08+R()*.1;add('glint',{poly:[[q.x,q.y-s0*2],[q.x+s0,q.y],[q.x,q.y+s0*2],[q.x-s0,q.y]]});}}
   else if(f==='blank'){for(const q of pick(Math.min(16,area/18|0)))add('blank',{quad:[q.x-.5,q.y-.4,.9+R()*.6,.7+R()*.4]});}
  }
  // 문 너머 그림자: 문(구역 배치의 문 목록)에서 3곳까지
  if(D.ghosts){const ds=(X.doors||[]).filter(d=>!(L?.entry&&Math.hypot(d.x-L.entry.x,d.y-L.entry.y)<4)).slice(0,6);for(const d of ds.slice(0,3))st.ghosts.push({x:d.x,y:d.y,next:now()+3+R()*6,until:0,seed:R()});}
  stats.rooms++;stats.decals+=st.decals.length;stats.deco+=st.deco.length;return st;}
 // 일곱 칸 숫자(바닥에 칠한 층 번호). 글자 가로는 세계 +x, 위쪽은 세계 -y.
 const SEG={a:[.08,.88,.44,.12],b:[.48,.52,.12,.40],c:[.48,.08,.12,.40],d:[.08,0,.44,.12],e:[0,.08,.12,.40],f:[0,.52,.12,.40],g:[.08,.44,.44,.12]};
 const GLY={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','F':'afeg','G':'afedcg'};
 function digits(st,text,x0,y0,S){let x=x0;for(const ch of text){const segs=GLY[ch]||'';for(const s of segs){const[sx,sy,w,h]=SEG[s];st.decals.push({g:'stencil',poly:[[x+sx*S,y0-sy*S],[x+(sx+w)*S,y0-sy*S],[x+(sx+w)*S,y0-(sy+h)*S],[x+sx*S,y0-(sy+h)*S]]});}x+=S*.78;}}

 // ---- 바닥 무늬 그리기(색별로 묶어 한 번에) --------------------------------------------------------------
 const GROUP={checker:{fill:'rgba(14,6,12,.30)'},petal:{fill:'rgba(170,30,60,.55)'},stitch:{stroke:'rgba(230,210,200,.42)',lw:.05},stencil:{fill:'rgba(226,180,56,.42)'},scuff:{fill:'rgba(0,0,0,.16)'},
  oil:{fill:'rgba(6,6,8,.34)'},crack:{stroke:'rgba(0,0,0,.45)',lw:.035},hazardY:{fill:'rgba(220,170,30,.40)'},hazardB:{fill:'rgba(10,10,10,.45)'},grid:{stroke:'rgba(60,255,150,.20)',lw:.025,pulse:1},
  sun:{glow:'255,200,120',a:.20},leafA:{fill:'rgba(150,120,40,.45)'},leafB:{fill:'rgba(90,110,40,.40)'},root:{stroke:'rgba(40,24,12,.55)',lw:.09},
  ink:{stroke:'rgba(6,4,8,.50)',lw:.05},chalkS:{stroke:'rgba(230,236,240,.20)',lw:.04},chalk:{stroke:'rgba(230,236,240,.22)',lw:.035},
  dripR:{fill:'rgba(160,30,30,.40)'},dripB:{fill:'rgba(40,70,160,.38)'},dripY:{fill:'rgba(210,170,40,.38)'},dripG:{fill:'rgba(40,120,80,.36)'},red:{stroke:'rgba(200,20,24,.62)',lw:.07},
  swirlB:{stroke:'rgba(56,96,210,.50)',lw:.13},swirlY:{stroke:'rgba(246,206,64,.46)',lw:.12},swirlK:{stroke:'rgba(20,30,70,.45)',lw:.11},sand:{fill:'rgba(200,150,80,.12)'},streak:{fill:'rgba(10,6,4,.30)'},creamA:{fill:'rgba(240,226,190,.14)'},blackPool:{fill:'rgba(0,0,0,.30)'},
  facetA:{fill:'rgba(46,90,200,.30)'},facetB:{fill:'rgba(206,156,86,.24)'},facetC:{fill:'rgba(8,16,46,.34)'},goldSq:{fill:'rgba(230,180,50,.42)'},goldDk:{fill:'rgba(60,40,10,.36)'},
  water:{fill:'rgba(110,150,190,.16)'},pad:{fill:'rgba(70,130,70,.48)'},bloom:{fill:'rgba(240,150,190,.70)'},blank:{fill:'rgba(245,244,236,.26)'},ink2:{stroke:'rgba(4,4,6,.62)',lw:.16},vein:{stroke:'rgba(170,20,30,.62)',lw:.11,pulse:1},coreG:{glow:'190,30,40',a:.22},glint:{fill:'rgba(230,236,255,.5)',pulse:1}};
 function P(x,y){return project(x,y);}
 function onScreen(q,m=120){const w=typeof W==='number'?W:1280,h=typeof H==='number'?H:800;return q.x>-m&&q.x<w+m&&q.y>-m&&q.y<h+m;}
 function isoEllipse(g,cx,cy,r,first){const q=P(cx,cy),u=U(),rx=r*u*1.414,ry=rx*.5;g.moveTo(q.x+rx,q.y);g.ellipse(q.x,q.y,rx,ry,0,0,TAU);return q;}
 function drawDecals(st){const g=ctx,u=U(),groups=new Map(),t=now();let n=0;
  for(const d of st.decals){const c=d.quad?P(d.quad[0]+d.quad[2]/2,d.quad[1]+d.quad[3]/2):d.el?P(d.el[0],d.el[1]):d.glow?P(d.glow[0],d.glow[1]):d.x?P(d.x[0],d.x[1]):P((d.line||d.poly)[0][0],(d.line||d.poly)[0][1]);
   if(!onScreen(c,d.line?220:120))continue;let a=groups.get(d.g);if(!a){a=[];groups.set(d.g,a);}a.push(d);n++;}
  for(const[k,list]of groups){const S=GROUP[k];if(!S)continue;g.save();try{
   if(S.glow){for(const d of list){const q=P(d.glow[0],d.glow[1]),rx=d.glow[2]*u*1.414;const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,rx);gr.addColorStop(0,'rgba('+S.glow+','+S.a+')');gr.addColorStop(1,'rgba('+S.glow+',0)');g.fillStyle=gr;g.beginPath();g.ellipse(q.x,q.y,rx,rx*.5,0,0,TAU);g.fill();}continue;}
   if(S.pulse)g.globalAlpha*=.65+.35*Math.sin(t*1.7);
   g.beginPath();
   for(const d of list){
    if(d.quad){const[x,y,w,h]=d.quad,a=P(x,y),b=P(x+w,y),c=P(x+w,y+h),e=P(x,y+h);g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(e.x,e.y);g.closePath();}
    else if(d.poly){const p0=P(d.poly[0][0],d.poly[0][1]);g.moveTo(p0.x,p0.y);for(let i=1;i<d.poly.length;i++){const p=P(d.poly[i][0],d.poly[i][1]);g.lineTo(p.x,p.y);}g.closePath();}
    else if(d.el){const q=P(d.el[0],d.el[1]),rx=d.el[2]*u*1.414,ry=rx*.5;g.moveTo(q.x+rx,q.y);g.ellipse(q.x,q.y,rx,ry,0,0,TAU);}
    else if(d.x){const[x,y,s,a]=d.x,c1=Math.cos(a+.8)*s,s1=Math.sin(a+.8)*s,c2=Math.cos(a-.8)*s,s2=Math.sin(a-.8)*s,p1=P(x-c1,y-s1),p2=P(x+c1,y+s1),p3=P(x-c2,y-s2),p4=P(x+c2,y+s2);g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.moveTo(p3.x,p3.y);g.lineTo(p4.x,p4.y);}
    else if(d.line){const p0=P(d.line[0][0],d.line[0][1]);g.moveTo(p0.x,p0.y);for(let i=1;i<d.line.length;i++){const p=P(d.line[i][0],d.line[i][1]);g.lineTo(p.x,p.y);}}}
   if(S.fill){g.fillStyle=S.fill;g.fill();}if(S.stroke){g.strokeStyle=S.stroke;g.lineWidth=Math.max(1,S.lw*u);g.lineCap='round';g.lineJoin='round';g.stroke();}
  }finally{g.restore();}}
  // 데이터 바닥: 무작위 칸이 잠깐 초록으로 켜진다
  if(st.glyph?.length){g.save();try{g.beginPath();const k=Math.floor(t*6);let m=0;for(let i=0;i<st.glyph.length&&m<40;i++){if(((i*7919+k*104729)%23)!==0)continue;const[a,b]=st.glyph[i],c0=P(a+.15,b+.15),c1=P(a+.85,b+.15),c2=P(a+.85,b+.85),c3=P(a+.15,b+.85);if(!onScreen(c0))continue;g.moveTo(c0.x,c0.y);g.lineTo(c1.x,c1.y);g.lineTo(c2.x,c2.y);g.lineTo(c3.x,c3.y);g.closePath();m++;}
   g.fillStyle='rgba(70,255,160,.16)';g.fill();}finally{g.restore();}}
  // 복도등: 꺼진 등은 그대로 어둡고, 몇 개는 떨린다
  for(const l of st.lamps){if(l.mode==='dead')continue;const q=P(l.x,l.y);if(!onScreen(q))continue;let a=l.mode==='dim'?.13:.2;
   if(l.mode==='flicker'){const s=Math.sin(t*23+l.seed)+Math.sin(t*7.3+l.seed*2),off=((t+l.seed)%4.3)<.5;a=off?0:s>1.2?.04:.22;}if(a<=0)continue;
   const rx=2.6*u;g.save();try{const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,rx);gr.addColorStop(0,'rgba(215,235,255,'+a.toFixed(3)+')');gr.addColorStop(1,'rgba(215,235,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(q.x,q.y,rx,rx*.5,0,0,TAU);g.fill();}finally{g.restore();}}
  stats.drawnDecals+=n;}

 // ---- 문 너머 그림자 -----------------------------------------------------------------------------------
 function drawGhosts(st){const t=now(),u=U();for(const h of st.ghosts){const d=Math.hypot(player.x-h.x,player.y-h.y);
   if(d<4.2&&h.until>t)h.until=t+.25;// 다가가면 사라진다
   if(t>h.next&&h.until<t&&d>5&&d<15){h.until=t+2.2+h.seed*1.6;h.next=h.until+6+h.seed*9;stats.ghosts++;}
   if(h.until<=t)continue;const q=P(h.x,h.y);if(!onScreen(q))continue;const life=h.until-t,a=clamp(Math.min(life/.5,1),0,1)*.62,H=u*1.95,g=ctx;
   g.save();try{g.globalAlpha*=a;g.fillStyle='rgba(2,2,4,1)';g.beginPath();g.ellipse(q.x,q.y-H*.86,u*.2,u*.24,0,0,TAU);g.fill();
    g.beginPath();g.moveTo(q.x-u*.32,q.y);g.quadraticCurveTo(q.x-u*.36,q.y-H*.55,q.x-u*.16,q.y-H*.74);g.lineTo(q.x+u*.16,q.y-H*.74);g.quadraticCurveTo(q.x+u*.36,q.y-H*.55,q.x+u*.32,q.y);g.closePath();g.fill();
    if(((t*1.3+h.seed*7)%3)<1.6){g.fillStyle='rgba(235,230,215,.85)';g.beginPath();g.moveTo(q.x-u*.07+u*.03,q.y-H*.87);g.ellipse(q.x-u*.07,q.y-H*.87,u*.03,u*.018,0,0,TAU);g.moveTo(q.x+u*.07+u*.03,q.y-H*.87);g.ellipse(q.x+u*.07,q.y-H*.87,u*.03,u*.018,0,0,TAU);g.fill();}
   }finally{g.restore();}}}

 // ---- 조형물(표현 전용 소품) ------------------------------------------------------------------------------
 function decoProps(r,st){if(!prefs.deco)return;if(st.decoPlaced)return;st.decoPlaced=true;const all=[...st.deco];if(st.lift)all.push({id:'r123:'+st.zone+':lift',kind:'lift',x:st.lift.x,y:st.lift.y,seed:1,floor:st.theme.floors?.list?.slice(-1)[0]});
  for(const d of all){const q={id:d.id,x:d.x,y:d.y,height:60,solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r123Deco:d},a=ART[d.kind];
   if(a&&prefs.art){q.path=a.path;q.height=a.h;if(a.lift)q.visualLiftPx=a.lift;if(a.frames)q.r129Frames=a.frames;try{if(typeof addImage==='function')for(const f of a.frames||[a.path])addImage(f);}catch(e){fail(e);}stats.art=(stats.art||0)+1;}r.props.push(q);}}
 const DRAW={
  teacup(g,q,u,t,d){const w=u*1.25,h=u*.95;g.fillStyle='rgba(30,10,20,.35)';g.beginPath();g.ellipse(q.x,q.y+2,w*1.05,w*.36,0,0,TAU);g.fill();g.fillStyle='#d8cec3';g.beginPath();g.ellipse(q.x,q.y,w*.95,w*.32,0,0,TAU);g.fill();
   g.fillStyle='#efe5da';g.beginPath();g.moveTo(q.x-w*.62,q.y-h);g.bezierCurveTo(q.x-w*.6,q.y-h*.35,q.x-w*.42,q.y-h*.06,q.x,q.y-h*.04);g.bezierCurveTo(q.x+w*.42,q.y-h*.06,q.x+w*.6,q.y-h*.35,q.x+w*.62,q.y-h);g.closePath();g.fill();
   g.fillStyle='#7c1e32';g.beginPath();g.moveTo(q.x-w*.6,q.y-h*.72);g.bezierCurveTo(q.x-w*.3,q.y-h*.6,q.x+w*.3,q.y-h*.6,q.x+w*.6,q.y-h*.72);g.lineTo(q.x+w*.58,q.y-h*.58);g.bezierCurveTo(q.x+w*.3,q.y-h*.46,q.x-w*.3,q.y-h*.46,q.x-w*.58,q.y-h*.58);g.closePath();g.fill();
   g.fillStyle='#f7efe6';g.beginPath();g.ellipse(q.x,q.y-h,w*.62,w*.2,0,0,TAU);g.fill();g.fillStyle='#2a0c12';g.beginPath();g.ellipse(q.x,q.y-h+1,w*.54,w*.15,0,0,TAU);g.fill();
   g.strokeStyle='#e6dccf';g.lineWidth=Math.max(2,u*.11);g.beginPath();g.arc(q.x+w*.66,q.y-h*.58,w*.2,-1.3,1.3);g.stroke();
   g.strokeStyle='rgba(230,220,230,.22)';g.lineWidth=Math.max(1,u*.05);g.beginPath();const s=Math.sin(t*1.4+d.seed);g.moveTo(q.x-w*.1,q.y-h*1.05);g.bezierCurveTo(q.x-w*.3+s*6,q.y-h*1.5,q.x+w*.2-s*6,q.y-h*1.8,q.x-w*.05,q.y-h*2.2);g.stroke();},
  needle(g,q,u,t,d){const H=u*3.2,lean=u*.55;g.fillStyle='#c9ccd2';g.beginPath();g.moveTo(q.x-u*.05,q.y);g.lineTo(q.x+lean-u*.09,q.y-H);g.lineTo(q.x+lean+u*.09,q.y-H);g.lineTo(q.x+u*.05,q.y);g.closePath();g.fill();
   g.fillStyle='#1a1418';g.beginPath();g.ellipse(q.x+lean*.95,q.y-H*.9,u*.035,u*.12,.17,0,TAU);g.fill();
   g.strokeStyle='#9a1730';g.lineWidth=Math.max(1.5,u*.06);g.beginPath();g.moveTo(q.x+lean*.95,q.y-H*.9);const sw=Math.sin(t*.9+d.seed)*u*.3;g.bezierCurveTo(q.x+lean*2+sw,q.y-H*.6,q.x+u*1.8,q.y-u*.4,q.x+u*2.4+sw,q.y+u*.2);g.stroke();},
  spool(g,q,u,t,d){const w=u*.55,h=u*.9;g.fillStyle='#5a3a24';g.beginPath();g.ellipse(q.x,q.y,w*1.1,w*.4,0,0,TAU);g.fill();g.fillStyle='#8f1d32';g.fillRect(q.x-w*.8,q.y-h,w*1.6,h);
   g.strokeStyle='rgba(255,200,210,.25)';g.lineWidth=1;g.beginPath();for(let i=1;i<6;i++){g.moveTo(q.x-w*.8,q.y-h*i/6);g.lineTo(q.x+w*.8,q.y-h*i/6+2);}g.stroke();
   g.fillStyle='#6a4630';g.beginPath();g.ellipse(q.x,q.y-h,w*1.1,w*.4,0,0,TAU);g.fill();g.fillStyle='#2a1a10';g.beginPath();g.ellipse(q.x,q.y-h,w*.25,w*.1,0,0,TAU);g.fill();},
  doll(g,q,u,t,d){const s=u*.9;g.fillStyle='#8b7468';g.beginPath();g.ellipse(q.x,q.y-s*.45,s*.42,s*.5,0,0,TAU);g.fill();g.fillStyle='#7a6358';g.beginPath();g.ellipse(q.x-s*.3,q.y-s*.05,s*.14,s*.24,.6,0,TAU);g.ellipse(q.x+s*.3,q.y-s*.05,s*.14,s*.24,-.6,0,TAU);g.fill();
   g.fillStyle='#d8c6b4';g.beginPath();g.arc(q.x,q.y-s*1.15,s*.36,0,TAU);g.fill();g.fillStyle='#1b1418';const tilt=Math.sin(t*.5+d.seed)*.05;
   for(const sx of[-1,1]){g.beginPath();g.arc(q.x+sx*s*.13,q.y-s*(1.2+tilt*sx),s*.085,0,TAU);g.fill();}
   g.strokeStyle='#5a1020';g.lineWidth=Math.max(1,u*.03);g.beginPath();g.moveTo(q.x-s*.14,q.y-s*.98);g.lineTo(q.x+s*.14,q.y-s*.98);for(let i=-2;i<=2;i++){g.moveTo(q.x+i*s*.06,q.y-s*1.02);g.lineTo(q.x+i*s*.06,q.y-s*.94);}g.stroke();
   g.strokeStyle='rgba(30,10,10,.6)';g.beginPath();g.moveTo(q.x,q.y-s*.85);g.lineTo(q.x,q.y-s*.2);g.stroke();},
  frame(g,q,u,t,d){const w=u*1.1,h=u*1.4,y0=q.y-u*.9-(d.float?Math.sin(t+d.seed)*u*.2:0);g.save();g.translate(q.x,y0);g.rotate(d.tilt||((d.seed%7)-3)*.04);
   g.fillStyle='#6b4a22';g.fillRect(-w/2,-h,w,h);g.fillStyle='#14100c';g.fillRect(-w/2+u*.12,-h+u*.12,w-u*.24,h-u*.24);g.fillStyle='rgba(200,170,140,.14)';g.beginPath();g.ellipse(0,-h*.55,w*.2,h*.22,0,0,TAU);g.fill();g.restore();},
  window(g,q,u,t,d){const hgt=heightOf(d.floor),w=u*1.15,h=u*1.7,y0=q.y-u*.7;const top=hgt>.6?'#04060d':hgt>.3?'#0b1222':'#1d2740',bot=hgt>.6?'#141a2c':hgt>.3?'#2c3450':'#5a4a4a';
   g.fillStyle='#1a1612';g.fillRect(q.x-w/2-u*.1,y0-h-u*.1,w+u*.2,h+u*.2);const gr=g.createLinearGradient(0,y0-h,0,y0);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(q.x-w/2,y0-h,w,h);
   if(hgt<.35){g.fillStyle='#0c0d12';for(let i=0;i<5;i++){const bw=w*.18,bh=h*(.15+((d.seed>>i)&3)*.08);g.fillRect(q.x-w/2+i*w*.2,y0-bh,bw,bh);}}
   else{g.fillStyle='rgba(220,225,235,'+(.18+hgt*.15).toFixed(2)+')';const cy=y0-h*(.12+.5*(1-hgt)),dx=(t*4+d.seed)%w;g.beginPath();g.moveTo(q.x-w/2+dx,cy);g.ellipse(q.x-w/2+dx,cy,w*.3,h*.05,0,0,TAU);g.moveTo(q.x-w/2+(dx+w*.5)%w,cy+h*.06);g.ellipse(q.x-w/2+(dx+w*.5)%w,cy+h*.06,w*.25,h*.04,0,0,TAU);g.fill();
    if(hgt>.5){g.fillStyle='rgba(255,255,240,.7)';for(let i=0;i<6;i++){const sx=q.x-w/2+((d.seed*(i+3))%97)/97*w,sy=y0-h+((d.seed*(i+7))%89)/89*h*.45;g.fillRect(sx,sy,1.5,1.5);}}}
   g.strokeStyle='#1a1612';g.lineWidth=Math.max(2,u*.07);g.beginPath();g.moveTo(q.x,y0-h);g.lineTo(q.x,y0);g.moveTo(q.x-w/2,y0-h*.5);g.lineTo(q.x+w/2,y0-h*.5);g.stroke();
   g.fillStyle='rgba(255,255,255,.06)';g.beginPath();g.moveTo(q.x-w/2,y0-h*.2);g.lineTo(q.x-w/2+w*.35,y0-h);g.lineTo(q.x-w/2+w*.5,y0-h);g.lineTo(q.x-w/2,y0-h*.05);g.closePath();g.fill();},
  sign(g,q,u,t,d){const w=u*.9,h=u*.5,y0=q.y-u*1.1;g.fillStyle='#2a2622';g.fillRect(q.x-u*.04,y0,u*.08,u*1.1);g.fillStyle='#14120f';g.fillRect(q.x-w/2,y0-h,w,h);g.strokeStyle='#8a7a5a';g.lineWidth=1.5;g.beginPath();g.rect(q.x-w/2+2,y0-h+2,w-4,h-4);g.stroke();
   g.fillStyle='#e8dcc0';g.font='bold '+Math.round(u*.34)+'px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(d.floor==='G'?'G':d.floor+'F',q.x,y0-h/2);},
  noticeboard(g,q,u,t,d){const w=u*1.2,h=u*.9,y0=q.y-u*1.2;g.fillStyle='#4a3020';g.fillRect(q.x-w/2,y0-h,w,h);g.fillStyle='#7a5a3a';g.fillRect(q.x-w/2+u*.08,y0-h+u*.08,w-u*.16,h-u*.16);
   g.fillStyle='#e8dcc0';for(const[dx,dy,pw,ph]of[[-.4,-.75,.32,.4],[.1,-.78,.3,.22],[-.38,-.3,.3,.2],[.1,-.48,.3,.38]])g.fillRect(q.x+dx*w,y0+dy*h,pw*w,ph*h);},
  // R133: 은재 명찰(Drive 원화 준비 전·끄기 시) — 바닥에 떨어진 흰 플라스틱 명찰, 글자는 원화에만
  badge(g,q,u,t,d){const w=u*.62,h=u*.24;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(q.x,q.y+1,w*.62,h*.5,0,0,TAU);g.fill();
   g.fillStyle='#d9d4c8';g.beginPath();g.roundRect(q.x-w/2,q.y-h,w,h,h*.25);g.fill();g.fillStyle='#2a2622';g.fillRect(q.x-w*.28,q.y-h*.62,w*.56,h*.2);},
  brush(g,q,u,t,d){g.strokeStyle='#6a4022';g.lineWidth=Math.max(2,u*.09);g.lineCap='round';g.beginPath();g.moveTo(q.x+u*.7,q.y-u*.35);g.lineTo(q.x-u*.25,q.y-u*.05);g.stroke();
   g.fillStyle='#a0a4a8';g.fillRect(q.x-u*.38,q.y-u*.08,u*.16,u*.1);g.fillStyle='#7aa0b8';g.beginPath();g.ellipse(q.x-u*.55,q.y,u*.2,u*.09,-.3,0,TAU);g.fill();},
  tweezers(g,q,u,t,d){g.strokeStyle='#b0b4b8';g.lineWidth=Math.max(1.5,u*.05);g.beginPath();g.moveTo(q.x+u*.6,q.y-u*.5);g.lineTo(q.x-u*.25,q.y-u*.08);g.moveTo(q.x+u*.6,q.y-u*.42);g.lineTo(q.x-u*.25,q.y-u*.08);g.stroke();
   g.fillStyle='#e0b030';g.beginPath();g.moveTo(q.x-u*.25,q.y-u*.12);g.lineTo(q.x-u*.5,q.y-u*.02);g.lineTo(q.x-u*.32,q.y+u*.12);g.lineTo(q.x-u*.1,q.y+u*.02);g.closePath();g.fill();},
  vase(g,q,u,t,d){g.fillStyle='rgba(200,220,230,.55)';g.fillRect(q.x-u*.16,q.y-u*.55,u*.32,u*.55);g.strokeStyle='#3a6a30';g.lineWidth=Math.max(1,u*.04);g.beginPath();g.moveTo(q.x,q.y-u*.5);g.lineTo(q.x-u*.1,q.y-u*1.1);g.moveTo(q.x,q.y-u*.5);g.lineTo(q.x+u*.15,q.y-u*1.05);g.stroke();
   g.fillStyle='#a07ac8';for(const[dx,dy]of[[-.12,-1.15],[.17,-1.1],[0,-1.25],[-.25,-1]]){g.beginPath();g.ellipse(q.x+dx*u,q.y+dy*u,u*.12,u*.18,0,0,TAU);g.fill();}},
  stairs(g,q,u,t,d){const[dx,dy]=d.dir||[0,-1],[px,py]=d.perp||[1,0],W=.75,step=.32,hp=u*.42,bx=d.x-dx*1.6,by=d.y-dy*1.6;
   // 벽 쪽으로 오르는 다섯 칸: 영웅 쪽(앞)이 낮고 벽 쪽이 높다. 세계 좌표로 그려 바닥과 맞고, 뒤 칸부터 그린다.
   for(let k=4;k>=0;k--){const s0=k*step,s1=s0+step,hh=(k+1)*hp,a=P(bx+dx*s0-px*W,by+dy*s0-py*W),b=P(bx+dx*s0+px*W,by+dy*s0+py*W),c=P(bx+dx*s1+px*W,by+dy*s1+py*W),e=P(bx+dx*s1-px*W,by+dy*s1-py*W);
    g.fillStyle='#2a2522';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b.x,b.y-hh);g.lineTo(a.x,a.y-hh);g.closePath();g.fill();
    g.fillStyle='#5a524a';g.beginPath();g.moveTo(a.x,a.y-hh);g.lineTo(b.x,b.y-hh);g.lineTo(c.x,c.y-hh);g.lineTo(e.x,e.y-hh);g.closePath();g.fill();
    g.strokeStyle='rgba(226,180,56,.35)';g.lineWidth=Math.max(1,u*.03);g.beginPath();g.moveTo(a.x,a.y-hh);g.lineTo(b.x,b.y-hh);g.stroke();}},
  inkpost(g,q,u,t,d){const H=u*2.6;g.fillStyle='#0c0b0c';g.beginPath();g.moveTo(q.x-u*.18,q.y);g.bezierCurveTo(q.x-u*.3,q.y-H*.5,q.x+u*.1,q.y-H*.8,q.x+Math.sin(t*.6+d.seed)*u*.1,q.y-H);g.bezierCurveTo(q.x+u*.2,q.y-H*.7,q.x+u*.3,q.y-H*.3,q.x+u*.2,q.y);g.closePath();g.fill();// 붓으로 세운 먹 기둥
   g.strokeStyle='rgba(240,240,236,.55)';g.lineWidth=Math.max(1.5,u*.05);g.beginPath();g.arc(q.x,q.y-H*.55,u*.42,.3,TAU-.3);g.stroke();
   g.fillStyle='rgba(0,0,0,.6)';for(let i=0;i<4;i++){const dy=((t*.6+i*.25+d.seed*.01)%1)*H*.5;g.beginPath();g.ellipse(q.x+(i-1.5)*u*.08,q.y-H*.5+dy,u*.04,u*.07,0,0,TAU);g.fill();}},
  lantern(g,q,u,t,d){const H=u*2.4,sw=Math.sin(t*1.1+d.seed)*u*.06;g.strokeStyle='#2a2018';g.lineWidth=Math.max(2,u*.07);g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x,q.y-H);g.lineTo(q.x+u*.5,q.y-H);g.stroke();
   const cx=q.x+u*.5+sw,cy=q.y-H+u*.5,fl=.75+.2*Math.sin(t*7+d.seed)+.05*Math.sin(t*17);const gr=g.createRadialGradient(cx,cy,0,cx,cy,u*1.4);gr.addColorStop(0,'rgba(255,140,60,'+(.35*fl).toFixed(3)+')');gr.addColorStop(1,'rgba(255,90,40,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,u*1.4,0,TAU);g.fill();
   g.strokeStyle='#2a2018';g.lineWidth=1;g.beginPath();g.moveTo(q.x+u*.5,q.y-H);g.lineTo(cx,cy-u*.32);g.stroke();g.fillStyle='rgba(200,40,30,'+(.8+.15*fl).toFixed(2)+')';g.beginPath();g.ellipse(cx,cy,u*.26,u*.34,0,0,TAU);g.fill();
   g.strokeStyle='rgba(60,10,10,.6)';g.beginPath();for(let i=-1;i<=1;i++){g.moveTo(cx-u*.25,cy+i*u*.12);g.lineTo(cx+u*.25,cy+i*u*.12);}g.stroke();g.fillStyle='#1a1410';g.fillRect(cx-u*.14,cy-u*.38,u*.28,u*.06);g.fillRect(cx-u*.14,cy+u*.32,u*.28,u*.06);},
  tendril(g,q,u,t,d){const H=u*(2.6+(d.seed%3)*.4),sw=Math.sin(t*.5+d.seed)*u*.15;g.fillStyle='#1a0a0c';g.beginPath();g.moveTo(q.x-u*.45,q.y);g.bezierCurveTo(q.x-u*.5,q.y-H*.4,q.x+u*.4+sw,q.y-H*.6,q.x+sw*2,q.y-H);g.bezierCurveTo(q.x+u*.6+sw,q.y-H*.55,q.x+u*.1,q.y-H*.35,q.x+u*.4,q.y);g.closePath();g.fill();
   const pulse=.5+.5*Math.sin(t*2.2+d.seed);g.strokeStyle='rgba(200,30,40,'+(.35+.4*pulse).toFixed(2)+')';g.lineWidth=Math.max(1,u*.04);g.beginPath();g.moveTo(q.x,q.y-u*.1);g.bezierCurveTo(q.x-u*.1,q.y-H*.4,q.x+u*.35+sw,q.y-H*.6,q.x+sw*2,q.y-H*.95);g.stroke();},
  mask(g,q,u,t,d){const w=u*.62,h=u*.82,cy=q.y-u*1.55;g.fillStyle='#e8e4dc';g.beginPath();g.moveTo(q.x,cy-h*.55);g.bezierCurveTo(q.x+w*.62,cy-h*.55,q.x+w*.6,cy+h*.2,q.x,cy+h*.5);g.bezierCurveTo(q.x-w*.6,cy+h*.2,q.x-w*.62,cy-h*.55,q.x,cy-h*.55);g.fill();// 선량한 표정을 빚은 하얀 가면
   g.fillStyle='#0a0810';for(const sx of[-1,1]){g.beginPath();g.ellipse(q.x+sx*w*.2,cy-h*.12,w*.11,h*.06,sx*.15,0,TAU);g.fill();}
   g.strokeStyle='rgba(120,30,40,.8)';g.lineWidth=Math.max(1,u*.03);g.beginPath();g.moveTo(q.x-w*.16,cy+h*.2);g.quadraticCurveTo(q.x,cy+h*.3,q.x+w*.16,cy+h*.2);g.stroke();
   if(((t*.4+d.seed)%7)<.35){g.fillStyle='rgba(200,10,20,.8)';for(const sx of[-1,1]){g.beginPath();g.arc(q.x+sx*w*.2,cy-h*.12,u*.025,0,TAU);g.fill();}}},
  mirror(g,q,u,t,d){const w=u*.75,h=u*1.3,cy=q.y-u*1.25;g.fillStyle='#3a2a1a';g.fillRect(q.x-u*.06,q.y-u*.6,u*.12,u*.6);g.beginPath();g.ellipse(q.x,cy,w*.62,h*.6,0,0,TAU);g.fill();
   const gr=g.createLinearGradient(q.x-w,cy-h,q.x+w,cy+h);gr.addColorStop(0,'#7a8494');gr.addColorStop(.5,'#c8d0dc');gr.addColorStop(1,'#4a5260');g.fillStyle=gr;g.beginPath();g.ellipse(q.x,cy,w*.54,h*.52,0,0,TAU);g.fill();
   g.fillStyle='rgba(20,16,30,.55)';g.beginPath();g.ellipse(q.x,cy+h*.05,w*.18,h*.3,0,0,TAU);g.fill();g.fillStyle='rgba(235,232,225,.75)';g.beginPath();g.ellipse(q.x,cy-h*.18,w*.1,h*.11,0,0,TAU);g.fill();// 거울 속에서 가면을 쓴 나
   g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(q.x-w*.3,cy-h*.2);g.lineTo(q.x-w*.1,cy+h*.1);g.lineTo(q.x+w*.05,cy-h*.05);g.stroke();},
  chair(g,q,u,t,d){const s=u*.75;g.fillStyle='#3a1e18';g.fillRect(q.x-s*.45,q.y-s*1.6,s*.12,s*1.6);g.fillRect(q.x+s*.33,q.y-s*1.6,s*.12,s*1.6);g.fillRect(q.x-s*.45,q.y-s*1.6,s*.9,s*.14);g.fillRect(q.x-s*.45,q.y-s*1.15,s*.9,s*.1);
   g.fillStyle='#5a2a24';g.beginPath();g.moveTo(q.x-s*.55,q.y-s*.75);g.lineTo(q.x+s*.55,q.y-s*.75);g.lineTo(q.x+s*.7,q.y-s*.55);g.lineTo(q.x-s*.4,q.y-s*.55);g.closePath();g.fill();
   g.fillStyle='#2a1612';g.fillRect(q.x-s*.4,q.y-s*.55,s*.1,s*.55);g.fillRect(q.x+s*.55,q.y-s*.55,s*.1,s*.55);},
  lift(g,q,u,t,d){const w=u*1.3,h=u*2.1;g.fillStyle='#262a2e';g.fillRect(q.x-w/2-u*.12,q.y-h-u*.3,w+u*.24,h+u*.3);const open=.08+.04*Math.sin(t*2);
   g.fillStyle='#4a5056';g.fillRect(q.x-w/2,q.y-h,w*(.5-open),h);g.fillRect(q.x+w*open,q.y-h,w*(.5-open),h);const gr=g.createLinearGradient(q.x-w*open,0,q.x+w*open,0);gr.addColorStop(0,'rgba(255,230,170,.1)');gr.addColorStop(.5,'rgba(255,230,170,.75)');gr.addColorStop(1,'rgba(255,230,170,.1)');g.fillStyle=gr;g.fillRect(q.x-w*open,q.y-h,w*open*2,h);
   g.fillStyle='#0b0c0e';g.fillRect(q.x-w*.3,q.y-h-u*.28,w*.6,u*.22);g.fillStyle='rgba(255,120,60,.95)';g.font='bold '+Math.round(u*.18)+'px monospace';g.textAlign='center';g.textBaseline='middle';
   g.fillText('▲ '+(d.floor==null?'':(d.floor==='G'?'1':(+d.floor+1>16?'16':+d.floor+1))),q.x,q.y-h-u*.17);},
  pylon(g,q,u,t,d){const H=u*3.4,b=u*.7;g.strokeStyle='#3a3a3e';g.lineWidth=Math.max(2,u*.08);g.beginPath();g.moveTo(q.x-b,q.y);g.lineTo(q.x-b*.25,q.y-H);g.moveTo(q.x+b,q.y);g.lineTo(q.x+b*.25,q.y-H*.82);
   for(let i=0;i<5;i++){const y1=q.y-H*i/5,y2=q.y-H*(i+1)/5,k1=1-.75*i/5,k2=1-.75*(i+1)/5;g.moveTo(q.x-b*k1,y1);g.lineTo(q.x+b*k2,y2);g.moveTo(q.x+b*k1,y1);g.lineTo(q.x-b*k2,y2);}g.stroke();
   g.strokeStyle='#4a2e20';g.beginPath();g.moveTo(q.x+b*.25,q.y-H*.82);g.lineTo(q.x+b*1.2,q.y-H*.7);g.lineTo(q.x+b*1.5,q.y-H*.45);g.stroke();
   const on=Math.sin(t*3+d.seed)>.2;if(on){g.fillStyle='rgba(255,40,30,.95)';g.beginPath();g.arc(q.x-b*.25,q.y-H,u*.08,0,TAU);g.fill();g.fillStyle='rgba(255,40,30,.18)';g.beginPath();g.arc(q.x-b*.25,q.y-H,u*.4,0,TAU);g.fill();}},
  gear(g,q,u,t,d){const R=u*1.1,cx=q.x,cy=q.y-R*.55;g.fillStyle='#7a4a2c';g.beginPath();const n=12;for(let i=0;i<n*2;i++){const a=i/(n*2)*TAU+t*.05,rr=i&1?R*.84:R;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.95);}g.closePath();g.fill();g.strokeStyle='rgba(230,150,90,.35)';g.lineWidth=Math.max(1,u*.04);g.stroke();
   g.fillStyle='#2a1a12';g.beginPath();g.arc(cx,cy,R*.32,0,TAU);g.fill();g.fillStyle='rgba(0,0,0,.45)';g.fillRect(cx-R*1.1,q.y-R*.05,R*2.2,R*.5);},
  beacon(g,q,u,t,d){g.fillStyle='#2a2c30';g.fillRect(q.x-u*.12,q.y-u*1.6,u*.24,u*1.6);const a=.5+.5*Math.sin(t*5+d.seed);g.fillStyle='rgba(255,50,30,'+(.4+.6*a).toFixed(2)+')';g.beginPath();g.arc(q.x,q.y-u*1.7,u*.13,0,TAU);g.fill();
   const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,u*1.6);gr.addColorStop(0,'rgba(255,40,20,'+(.16*a).toFixed(3)+')');gr.addColorStop(1,'rgba(255,40,20,0)');g.fillStyle=gr;g.beginPath();g.ellipse(q.x,q.y,u*1.6*1.4,u*.8*1.4,0,0,TAU);g.fill();},
  monolith(g,q,u,t,d){const w=u*.8,H=u*2.8;g.fillStyle='rgba(20,255,140,.10)';g.beginPath();g.moveTo(q.x-w,q.y);g.lineTo(q.x-w*.8,q.y-H);g.lineTo(q.x+w*.8,q.y-H-u*.2);g.lineTo(q.x+w,q.y);g.closePath();g.fill();
   g.strokeStyle='rgba(90,255,170,.55)';g.lineWidth=1.5;g.stroke();g.fillStyle='rgba(120,255,190,.75)';const off=(t*18+d.seed)%(u*.3);
   for(let r=0;r<9;r++){const y=q.y-H+u*.2+r*u*.3+off;if(y>q.y-u*.1)continue;for(let c=0;c<4;c++){if(((d.seed+r*5+c*3+Math.floor(t*3))%5)<2)continue;g.fillRect(q.x-w*.6+c*w*.32,y,w*.2,u*.08);}}},
  tree(g,q,u,t,d){const H=u*4.6,b=u*.55;g.fillStyle='#2e1e12';g.beginPath();g.moveTo(q.x-b*1.4,q.y);g.bezierCurveTo(q.x-b*.6,q.y-H*.3,q.x-b*.8,q.y-H*.6,q.x-b*.4,q.y-H*.8);g.lineTo(q.x+b*.4,q.y-H*.8);g.bezierCurveTo(q.x+b*.8,q.y-H*.6,q.x+b*.6,q.y-H*.3,q.x+b*1.4,q.y);g.closePath();g.fill();
   for(let i=0;i<4;i++){const a=(i/4)*TAU+d.seed,cx=q.x+Math.cos(a)*u*1.1,cy=q.y-H*.9+Math.sin(a)*u*.5,R=u*(1.3+.3*((d.seed>>i)&1));const gr=g.createRadialGradient(cx,cy,0,cx,cy,R);gr.addColorStop(0,'rgba(255,214,130,.42)');gr.addColorStop(.6,'rgba(170,140,60,.25)');gr.addColorStop(1,'rgba(80,70,30,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R,0,TAU);g.fill();}
   g.strokeStyle='rgba(255,220,150,.35)';g.lineWidth=1;g.beginPath();for(let i=0;i<4;i++){const x=q.x-u*.9+i*u*.6,s=Math.sin(t*.8+i+d.seed)*3;g.moveTo(x,q.y-H*.85);g.quadraticCurveTo(x+s,q.y-H*.6,x,q.y-H*(.45+.08*i));}g.stroke();},
  locker(g,q,u,t,d){const w=u*.75,H=u*2.1;g.fillStyle='#3c4a46';g.fillRect(q.x-w,q.y-H,w*2,H);g.strokeStyle='#1e2624';g.lineWidth=1.5;g.beginPath();g.moveTo(q.x,q.y-H);g.lineTo(q.x,q.y);g.stroke();
   g.fillStyle='#202826';for(let i=0;i<3;i++){g.fillRect(q.x-w*.8,q.y-H+u*.2+i*u*.12,w*.6,u*.05);g.fillRect(q.x+w*.2,q.y-H+u*.2+i*u*.12,w*.6,u*.05);}
   g.fillStyle='#050606';g.fillRect(q.x+w*.92,q.y-H,w*.12,H);const peek=((t*.7+d.seed)%9)<2.4;if(peek){g.fillStyle='rgba(240,236,220,.9)';g.fillRect(q.x+w*.95,q.y-H*.62,2,2);g.fillRect(q.x+w*.95,q.y-H*.62+6,2,2);}},
  easel(g,q,u,t,d){const H=u*2.1;g.strokeStyle='#5a3c22';g.lineWidth=Math.max(2,u*.07);g.beginPath();g.moveTo(q.x-u*.5,q.y);g.lineTo(q.x,q.y-H);g.lineTo(q.x+u*.5,q.y);g.moveTo(q.x,q.y-H);g.lineTo(q.x+u*.15,q.y+u*.1);g.stroke();
   const w=u*1.2,h=u*.95,y0=q.y-H*.42;g.fillStyle='#ece4d4';g.fillRect(q.x-w/2,y0-h,w,h);const C=['#2c4aa0','#d0a028','#a02a2a','#2a6a48','#7a2a7a'];g.lineWidth=Math.max(2,u*.08);g.lineCap='round';
   for(let i=0;i<5;i++){g.strokeStyle=C[(d.seed+i)%5];g.beginPath();const y=y0-h*.2-i*h*.15;g.moveTo(q.x-w*.4,y);g.quadraticCurveTo(q.x,y-h*.2*Math.sin(t*.3+i),q.x+w*.4,y);g.stroke();}},
  canvas(g,q,u,t,d){const H=u*2.1;g.strokeStyle='#5a3c22';g.lineWidth=Math.max(2,u*.07);g.beginPath();g.moveTo(q.x-u*.5,q.y);g.lineTo(q.x,q.y-H);g.lineTo(q.x+u*.5,q.y);g.stroke();g.fillStyle='#f6f4ee';g.fillRect(q.x-u*.65,q.y-H*.42-u*1.05,u*1.3,u*1.05);},
  endless(g,q,u,t,d){const w=u*1.5,h=u*2.2,y0=q.y-u*.2;for(let i=0;i<7;i++){const k=Math.pow(.74,i),ww=w*k,hh=h*k,cy=y0-h*.5+(h*.5-hh*.5)*.15;g.fillStyle=i&1?'#1a120c':'#6b4a22';g.fillRect(q.x-ww/2,cy-hh/2,ww,hh);}
   const k=Math.pow(.74,7);g.fillStyle='rgba(255,236,190,'+(.25+.15*Math.sin(t*1.5)).toFixed(2)+')';g.fillRect(q.x-w*k/2,y0-h*.5-h*k/2,w*k,h*k);},
  sunflower(g,q,u,t,d){const H=u*(2+(d.seed%3)*.3),sw=Math.sin(t*.7+d.seed)*u*.12;g.strokeStyle='#4a6a24';g.lineWidth=Math.max(2,u*.08);g.beginPath();g.moveTo(q.x,q.y);g.quadraticCurveTo(q.x+sw,q.y-H*.6,q.x+u*.3+sw,q.y-H);g.stroke();
   const cx=q.x+u*.3+sw,cy=q.y-H;g.fillStyle='#e0a820';g.beginPath();for(let i=0;i<14;i++){const a=i/14*TAU;g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a-.2)*u*.55,cy+Math.sin(a-.2)*u*.5);g.lineTo(cx+Math.cos(a+.2)*u*.55,cy+Math.sin(a+.2)*u*.5);g.closePath();}g.fill();
   g.fillStyle='#4a2a10';g.beginPath();g.arc(cx,cy,u*.26,0,TAU);g.fill();},
  cypress(g,q,u,t,d){const H=u*3.6;g.fillStyle='#16301e';g.beginPath();g.moveTo(q.x-u*.5,q.y);g.bezierCurveTo(q.x-u*.8,q.y-H*.5,q.x-u*.2,q.y-H*.8,q.x+Math.sin(t*.6+d.seed)*u*.15,q.y-H);g.bezierCurveTo(q.x+u*.3,q.y-H*.75,q.x+u*.8,q.y-H*.45,q.x+u*.5,q.y);g.closePath();g.fill();
   g.strokeStyle='rgba(60,110,70,.7)';g.lineWidth=Math.max(1.5,u*.05);g.beginPath();for(let i=1;i<7;i++){const y=q.y-H*i/7.5,w=u*.45*(1-i/8);g.moveTo(q.x-w,y);g.quadraticCurveTo(q.x,y-u*.25,q.x+w,y-u*.05);}g.stroke();},
  clock(g,q,u,t,d){const H=u*1.5;g.strokeStyle='#2a1c10';g.lineWidth=Math.max(2,u*.09);g.lineCap='round';g.beginPath();g.moveTo(q.x-u*.1,q.y);g.quadraticCurveTo(q.x+u*.05,q.y-H*.6,q.x-u*.05,q.y-H);g.quadraticCurveTo(q.x+u*.3,q.y-H*1.08,q.x+u*.75,q.y-H*1.02);g.stroke();
   // 가지에 걸쳐 녹아내리는 시계: 위는 가지 위에 눕고, 앞자락이 아래로 흘러내린다
   const cx=q.x+u*.12,cy=q.y-H*1.02,R=u*.62,drip=u*(.75+.12*Math.sin(t*.5+d.seed));g.fillStyle='#a8822a';g.beginPath();g.moveTo(cx-R*1.05,cy-R*.05);g.bezierCurveTo(cx-R*.9,cy-R*.75,cx+R*.9,cy-R*.75,cx+R*1.05,cy-R*.05);
   g.bezierCurveTo(cx+R*.95,cy+drip*.45,cx+R*.35,cy+drip*.5,cx+R*.18,cy+drip*1.05);g.bezierCurveTo(cx+R*.05,cy+drip*1.3,cx-R*.28,cy+drip*.6,cx-R*.62,cy+drip*.55);g.bezierCurveTo(cx-R*.9,cy+drip*.5,cx-R*1.05,cy+R*.2,cx-R*1.05,cy-R*.05);g.closePath();g.fill();
   g.fillStyle='#ecdcae';g.beginPath();g.moveTo(cx-R*.9,cy-R*.05);g.bezierCurveTo(cx-R*.78,cy-R*.62,cx+R*.78,cy-R*.62,cx+R*.9,cy-R*.05);g.bezierCurveTo(cx+R*.8,cy+drip*.36,cx+R*.3,cy+drip*.42,cx+R*.16,cy+drip*.92);g.bezierCurveTo(cx+R*.04,cy+drip*1.12,cx-R*.24,cy+drip*.5,cx-R*.55,cy+drip*.46);g.bezierCurveTo(cx-R*.8,cy+drip*.42,cx-R*.9,cy+R*.15,cx-R*.9,cy-R*.05);g.closePath();g.fill();
   g.fillStyle='#2a2016';for(let i=0;i<12;i++){const a=i/12*TAU,sag=Math.max(0,Math.sin(a))*drip*.35;g.fillRect(cx+Math.cos(a)*R*.66-1,cy-R*.12+Math.sin(a)*R*.4+sag-1,2.2,2.2);}
   g.strokeStyle='#1a1410';g.lineWidth=Math.max(1.2,u*.04);g.beginPath();const a=t*.15+d.seed;g.moveTo(cx,cy-R*.12);g.lineTo(cx+Math.cos(a)*R*.42,cy-R*.12+Math.sin(a)*R*.26+drip*.08);g.moveTo(cx,cy-R*.12);g.lineTo(cx+Math.cos(a*12)*R*.3,cy-R*.12+Math.sin(a*12)*R*.18);g.stroke();
   g.fillStyle='rgba(20,14,8,.5)';g.beginPath();g.ellipse(cx+R*.16,cy+drip*1.05,R*.08,R*.05,0,0,TAU);g.fill();},
  stone(g,q,u,t,d){const lift=u*(2.1+.3*Math.sin(t*.9+d.seed)),s=u*(.6+((d.seed%5)*.08)),k=clamp(1-(lift/u-1.8)*.6,.6,1);g.fillStyle='rgba(0,0,0,'+(.26*k).toFixed(3)+')';g.beginPath();g.ellipse(q.x,q.y,s*.95*k,s*.32*k,0,0,TAU);g.fill();
   const cy=q.y-lift;g.fillStyle='#4a443e';g.beginPath();g.moveTo(q.x-s,cy);g.lineTo(q.x+s,cy-s*.2);g.lineTo(q.x+s*.35,cy+s*1.1);g.lineTo(q.x-s*.25,cy+s*1.35);g.closePath();g.fill();
   g.fillStyle='#6e665c';g.beginPath();g.moveTo(q.x-s,cy);g.lineTo(q.x-s*.6,cy-s*.7);g.lineTo(q.x+s*.4,cy-s*.8);g.lineTo(q.x+s,cy-s*.2);g.closePath();g.fill();
   g.fillStyle='#8f877b';g.beginPath();g.moveTo(q.x-s*.6,cy-s*.7);g.lineTo(q.x+s*.4,cy-s*.8);g.lineTo(q.x+s*.15,cy-s*.3);g.lineTo(q.x-s*.45,cy-s*.25);g.closePath();g.fill();
   g.fillStyle='#3a342e';for(let i=0;i<3;i++){const px=q.x+(i-1)*s*.5,py=cy+s*(1.6+i*.35)+Math.sin(t*1.3+i+d.seed)*u*.08;g.beginPath();g.moveTo(px-s*.12,py);g.lineTo(px,py-s*.14);g.lineTo(px+s*.13,py);g.lineTo(px,py+s*.1);g.closePath();g.fill();}},
  bottle(g,q,u,t,d){g.fillStyle='#1c140e';g.beginPath();g.ellipse(q.x,q.y-u*.9,u*.85,u*.3,0,0,TAU);g.fill();g.fillRect(q.x-u*.06,q.y-u*.9,u*.12,u*.9);
   const C=['#24402a','#4a2410','#e8dcc0'];for(let i=0;i<3;i++){const x=q.x-u*.4+i*u*.4,y=q.y-u*.95;g.fillStyle=C[(d.seed+i)%3];g.fillRect(x-u*.09,y-u*.5,u*.18,u*.5);g.fillRect(x-u*.04,y-u*.75,u*.08,u*.25);g.fillStyle='rgba(255,240,210,.5)';g.fillRect(x-u*.05,y-u*.45,u*.03,u*.3);}},
  shard(g,q,u,t,d){const H=u*2.4,C=['#2a4a9a','#c8904a','#1a2a5a','#7a9ad0'];for(let i=0;i<4;i++){g.fillStyle=C[(d.seed+i)%4];g.beginPath();const a=i*1.3+d.seed;g.moveTo(q.x+Math.cos(a)*u*.5,q.y-Math.abs(Math.sin(a))*u*.2);g.lineTo(q.x+Math.cos(a+2)*u*.6,q.y-H*(.4+.15*i));g.lineTo(q.x+Math.cos(a+4)*u*.4,q.y-H*(.7+.1*i));g.closePath();g.fill();}
   g.fillStyle='#f0e8d8';g.beginPath();g.ellipse(q.x+u*.1,q.y-H*.75,u*.16,u*.08,.4,0,TAU);g.fill();g.fillStyle='#111';g.beginPath();g.arc(q.x+u*.12,q.y-H*.75,u*.05,0,TAU);g.fill();},
  goldpillar(g,q,u,t,d){const w=u*.6,H=u*3;g.fillStyle='#3a2a0a';g.fillRect(q.x-w,q.y-H,w*2,H);for(let r=0;r<10;r++)for(let c=0;c<4;c++){const k=(d.seed+r*7+c*13)%9;g.fillStyle=k<5?'#d8a830':k<7?'#f0d070':'#7a1e20';g.fillRect(q.x-w+c*w*.5+2,q.y-H+r*H/10+2,w*.5-4,H/10-4);}
   g.strokeStyle='rgba(255,220,120,.7)';g.lineWidth=1.5;g.beginPath();for(let i=0;i<3;i++){const cy=q.y-H*(.2+.3*i);g.arc(q.x,cy,w*.4,0,TAU*.85);}g.stroke();const gl=.12+.08*Math.sin(t*2+d.seed);g.fillStyle='rgba(255,220,120,'+gl.toFixed(3)+')';g.fillRect(q.x-w*1.4,q.y-H,w*2.8,H);},
  willow(g,q,u,t,d){const H=u*3;g.fillStyle='#3a3a2a';g.fillRect(q.x-u*.12,q.y-H*.6,u*.24,H*.6);const C=['rgba(150,180,140,.55)','rgba(170,150,210,.5)','rgba(120,160,170,.5)','rgba(220,200,160,.45)'];
   for(let k=0;k<4;k++){g.fillStyle=C[k];g.beginPath();for(let i=k;i<28;i+=4){const a=(i*2.39+d.seed)%TAU,rr=u*(.35+((i*37)%10)/10*1.0),x=q.x+Math.cos(a)*rr,y=q.y-H*.72+Math.sin(a)*rr*.55+i*u*.03+Math.sin(t*.8+i)*1.5;g.moveTo(x+u*.16,y);g.ellipse(x,y,u*.16,u*.08,(i%3-1)*.4,0,TAU);}g.fill();}}// 모네식 둥근 붓점
 };
 const SCALE={stairs:1,lantern:1.1,tendril:1.2,mirror:1.2,chair:1.2,clock:1.6,stone:1.35,sunflower:1.45,cypress:1.3,shard:1.45,bottle:1.35,willow:1.45,easel:1.35,canvas:1.35,monolith:1.25,pylon:1.25,gear:1.2,goldpillar:1.2,endless:1.2,frame:1.2,window:1.15,locker:1.1};
 function drawDeco(p){const d=p.r123Deco,fn=DRAW[d.kind];if(!fn||!prefs.deco||!prefs.mood)return;const q=P(p.x,p.y);if(!onScreen(q,200))return;const u=U(),t=now(),g=ctx;
  const hp=P(player.x,player.y),occ=q.y>hp.y-3&&q.y-u*2.4<hp.y-12&&Math.abs(q.x-hp.x)<u*1.1;
  g.save();try{if(typeof shadow==='function'&&!['frame','window','sign','endless','stone','lift','stairs'].includes(d.kind))shadow(q.x,q.y,u*.55,{alpha:.7});
   if(occ)g.globalAlpha*=.38;if(d.tilt){g.translate(q.x,q.y);g.rotate(d.tilt);g.translate(-q.x,-q.y);}
   if(d.face){g.translate(q.x,q.y);g.transform(1,d.face==='x'?.5:-.5,0,1,0,0);g.translate(-q.x,-q.y);}
   fn(g,q,u*(SCALE[d.kind]||1),t,d);stats.drawnDeco++;}catch(e){fail(e);}finally{g.restore();}}

 // ---- 화면 위 층(색·안개·입자·데이터 비·손전등·연출) --------------------------------------------------------
 let host=null,cv=null,parts=[],last=null,cur=null,banner=null,pendingBanner=null,pendingFx=null,fx=null,lastEra=null,lastYear=null,lastFloor=null,lastFloorZone=null,ac=null,tilted=null;
 function stageEl(){return typeof document!=='undefined'?document.getElementById('stage'):null;}
 function ensureHost(){if(host?.isConnected)return host;const s=stageEl();if(!s)return null;host=document.createElement('div');host.id='moodR123';host.setAttribute('aria-hidden','true');
  host.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden;display:none';
  host.innerHTML='<div data-m="shade" style="position:absolute;inset:0;mix-blend-mode:multiply"></div><div data-m="tint" style="position:absolute;inset:0"></div><div data-m="fog" style="position:absolute;inset:0"></div><div data-m="narrow" style="position:absolute;inset:0"></div><canvas data-m="cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>';
  if(getComputedStyle(s).position==='static')s.style.position='relative';s.appendChild(host);cv=host.querySelector('canvas');return host;}
 const part=n=>host?.querySelector('[data-m="'+n+'"]');
 // R124: 화면 색을 통째로 바꾸는 분위기(흑과 백의 흑백)는 투명한 바깥까지 물들지 않게 R114 필터 사슬에 붙인다(cinema-r114 가 읽음).
 function filter(){const D=cur&&prefs.mood&&prefs.overlay?THEMES[cur.theme.key]:null;return D?.filter?' '+D.filter:'';}
 function regrade(){try{window.__STORYWORLD_CINEMA_R114__?.applyGrade?.(true);}catch(e){fail(e);}}
 function hideLayer(){if(host)host.style.display='none';untilt();regrade();}
 function applyLayer(st){if(!ensureHost())return;const T=st.theme,D=THEMES[T.key];host.style.display=prefs.overlay?'block':'none';
  part('shade').style.background=D.shade||'transparent';const tn=part('tint');tn.style.background=D.tint?D.tint[0]:'transparent';tn.style.mixBlendMode=D.tint?D.tint[1]:'normal';part('fog').style.background=D.fog||'none';
  const nr=part('narrow');if(T.key==='tower'){const h=heightOf(floorAt(T,player.x,player.y)),w=(4+18*h).toFixed(1),a=(.25+.5*h).toFixed(2);
   nr.style.background='linear-gradient(to right,rgba(0,0,0,'+a+') 0,rgba(0,0,0,0) '+w+'%,rgba(0,0,0,0) '+(100-w)+'%,rgba(0,0,0,'+a+') 100%),linear-gradient(rgba(0,0,0,'+(.04+.22*h).toFixed(2)+'),rgba(0,0,0,'+(.04+.22*h).toFixed(2)+'))';}else nr.style.background='none';
  parts=[];const R=rng(hash(T.zone+':parts')),k=lowFx()?.4:1;for(const[kind,n]of D.parts||[])for(let i=0;i<Math.round(n*k);i++)parts.push(newPart(kind,R,true));
  st.rain=D.rain?{cols:[],level:D.rain}:null;}
 function newPart(kind,R,spread){const w=host?.clientWidth||1280,h=host?.clientHeight||800;
  const p={kind,x:0,y:0,vx:0,vy:0,r:R()*TAU,vr:(R()-.5)*2,s:1+R()*2,life:0,a:.4+R()*.5,R};
  if(kind==='petal'){p.vx=12+R()*20;p.vy=18+R()*24;p.s=3+R()*3;}else if(kind==='thread'){p.vx=14+R()*12;p.vy=6+R()*10;p.s=8+R()*10;}else if(kind==='spark'){p.vx=(R()-.5)*30;p.vy=60+R()*80;p.s=1.5+R()*1.5;}
  else if(kind==='ash'){p.vx=(R()-.5)*14;p.vy=8+R()*16;p.s=1+R()*2;p.a=.25+R()*.3;}else if(kind==='mote'){p.vx=(R()-.5)*10;p.vy=-4-R()*8;p.s=1.5+R()*2.5;}else if(kind==='dust'){p.vx=(R()-.5)*6;p.vy=(R()-.5)*6;p.s=.8+R()*1.4;p.a=.15+R()*.25;}
  else if(kind==='gold'){p.vx=(R()-.5)*14;p.vy=14+R()*18;p.s=2+R()*3;}else if(kind==='paint'){p.vx=10+R()*14;p.vy=4+R()*8;p.s=6+R()*8;}else if(kind==='pollen'){p.vx=(R()-.5)*8;p.vy=-2-R()*5;p.s=1.5+R()*2;p.a=.25+R()*.3;}else if(kind==='snow'){p.vx=-4-R()*8;p.vy=22+R()*26;p.s=1.2+R()*2.2;p.a=.45+R()*.4;}
  p.x=R()*w;p.y=R()*h;// 처음에는 화면 전체에, 다시 나올 때는 움직이는 방향의 반대쪽 가장자리에서
  if(!spread&&!['dust','mote','pollen'].includes(kind)){if(Math.abs(p.vy)>=Math.abs(p.vx))p.y=p.vy>0?-10:h+10;else p.x=p.vx>0?-10:w+10;}
  return p;}
 const PCOL={petal:'rgba(176,32,62,A)',thread:'rgba(230,200,205,A)',spark:'rgba(255,170,60,A)',ash:'rgba(160,160,160,A)',mote:'rgba(255,214,130,A)',dust:'rgba(220,226,230,A)',gold:'rgba(240,200,80,A)',paint:'rgba(60,100,210,A)',pollen:'rgba(250,240,210,A)',snow:'rgba(236,240,248,A)'};
 const GL='01ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ가나다라마바사2189217421962345678';
 function frame(dt){const g=cv?.getContext?.('2d');if(!g||!host||host.style.display==='none')return 0;const b=host.getBoundingClientRect(),dp=Math.min(1.5,devicePixelRatio||1);
  if(cv.width!==Math.round(b.width*dp)||cv.height!==Math.round(b.height*dp)){cv.width=Math.round(b.width*dp);cv.height=Math.round(b.height*dp);}
  g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);const st=cur,t=now(),slow=reduced()?.35:1;let n=0;
  // 입자
  for(const p of parts){p.x+=p.vx*dt*slow;p.y+=p.vy*dt*slow;p.r+=p.vr*dt*slow;if(p.kind==='mote'||p.kind==='dust'||p.kind==='pollen'){p.vx+=(p.R()-.5)*6*dt;p.vy+=(p.R()-.5)*6*dt;}
   if(p.x<-30||p.x>b.width+30||p.y<-30||p.y>b.height+30)Object.assign(p,newPart(p.kind,p.R,false));
   const col=PCOL[p.kind].replace('A',(p.a*(p.kind==='mote'?.6+.4*Math.sin(t*3+p.s):1)).toFixed(3));g.fillStyle=col;g.strokeStyle=col;
   if(p.kind==='petal'){g.save();g.translate(p.x,p.y);g.rotate(p.r);g.beginPath();g.ellipse(0,0,p.s,p.s*.55,0,0,TAU);g.fill();g.restore();}
   else if(p.kind==='thread'||p.kind==='paint'){g.lineWidth=p.kind==='paint'?3:1;g.beginPath();g.moveTo(p.x,p.y);g.quadraticCurveTo(p.x+p.s*.5,p.y-p.s*.4*Math.sin(p.r),p.x+p.s,p.y);g.stroke();}
   else if(p.kind==='spark'){g.lineWidth=p.s;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.05,p.y-p.vy*.05);g.stroke();}
   else if(p.kind==='gold'){g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillRect(-p.s/2,-p.s/2,p.s,p.s);g.restore();}
   else{g.beginPath();g.arc(p.x,p.y,p.s,0,TAU);g.fill();}n++;}
  // 데이터 비(데이터 시대는 늘 옅게, 시대가 바뀌는 순간에는 굵게)
  const warp=fx&&fx.kind==='warp'?clamp(1-(wall()-fx.t0)/fx.dur,0,1):0,rainLevel=Math.max(st?.rain?.level||0,warp>0?.9*warp:0);
  if(rainLevel>0){const R=st?.rain||(st.rain={cols:[]}),fs=15,cols=Math.ceil(b.width/(fs*1.6)),want=Math.round(cols*(lowFx()?.35:.6)*rainLevel);while(R.cols.length<want)R.cols.push({x:Math.floor(Math.random()*cols)*fs*1.6,y:-Math.random()*b.height,v:90+Math.random()*160,s:Math.floor(Math.random()*1e6)});
   if(R.cols.length>want)R.cols.length=want;g.font=fs+'px monospace';g.textAlign='center';for(const c of R.cols){c.y+=c.v*dt*slow;if(c.y-fs*12>b.height){c.y=-Math.random()*200;c.x=Math.floor(Math.random()*cols)*fs*1.6;}
    for(let i=0;i<12;i++){const y=c.y-i*fs;if(y<-fs||y>b.height+fs)continue;const k=(c.s+i*31+Math.floor((c.y/fs)))%GL.length;g.fillStyle=i===0?'rgba(210,255,225,'+(.85*rainLevel).toFixed(3)+')':'rgba(40,255,140,'+((1-i/12)*.55*rainLevel).toFixed(3)+')';g.fillText(GL[k],c.x,y);n++;}}}
  // 학교 손전등 원뿔(R103 손전등 미로가 아닐 때만)
  if(st&&THEMES[st.theme.key].cone&&!SM()?.flashlightActive&&typeof project==='function'){const o=project(player.x,player.y),mv={x:player.moveVX150||0,y:player.moveVY150||0};
   if(Math.hypot(mv.x,mv.y)>.05){const l=Math.hypot(mv.x,mv.y);st.dir={x:mv.x/l,y:mv.y/l};}const dir=st.dir||{x:-.707,y:-.707},a0=Math.atan2(dir.y,dir.x),reach=10;
   g.fillStyle='rgba(2,4,8,.48)';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';const rr=reach*U();
   const gr=g.createRadialGradient(o.x,o.y-U()*.6,6,o.x,o.y-U()*.6,rr);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.7,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.moveTo(o.x,o.y-U()*.6);
   for(let k=0;k<=16;k++){const a=a0-.62+1.24*k/16,q=project(player.x+Math.cos(a)*reach,player.y+Math.sin(a)*reach);g.lineTo(q.x,q.y);}g.closePath();g.fill();
   const g2=g.createRadialGradient(o.x,o.y-U()*.6,0,o.x,o.y-U()*.6,U()*2.4);g2.addColorStop(0,'rgba(0,0,0,.9)');g2.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=g2;g.beginPath();g.arc(o.x,o.y-U()*.6,U()*2.4,0,TAU);g.fill();g.globalCompositeOperation='source-over';}
  // 연출: 시대 전환(일그러짐·시계) / 승강기(빛줄기)
  if(fx){const age=wall()-fx.t0,k=clamp(age/fx.dur,0,1);if(k>=1){fx=null;resetCanvasFx();}
   else if(fx.kind==='warp'){const amp=Math.sin(k*Math.PI);for(let i=0;i<8;i++){const y=(Math.random()*b.height)|0,h=2+Math.random()*10;g.fillStyle=i&1?'rgba(255,0,140,'+(.10*amp).toFixed(3)+')':'rgba(0,255,200,'+(.10*amp).toFixed(3)+')';g.fillRect(0,y,b.width,h);}
    const cx=b.width/2,cy=b.height*.45,R0=Math.min(b.width,b.height)*.22;g.strokeStyle='rgba(220,255,230,'+(.35*amp).toFixed(3)+')';g.lineWidth=2;g.beginPath();g.arc(cx,cy,R0,0,TAU);for(let i=0;i<12;i++){const a=i/12*TAU;g.moveTo(cx+Math.cos(a)*R0*.86,cy+Math.sin(a)*R0*.86);g.lineTo(cx+Math.cos(a)*R0,cy+Math.sin(a)*R0);}g.stroke();
    const dirn=fx.back?-1:1,ha=-Math.PI/2+dirn*age*7,ma=-Math.PI/2+dirn*age*28;g.lineWidth=3;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(ha)*R0*.5,cy+Math.sin(ha)*R0*.5);g.moveTo(cx,cy);g.lineTo(cx+Math.cos(ma)*R0*.8,cy+Math.sin(ma)*R0*.8);g.stroke();
    const tk=Math.floor(age*5);if(tk!==fx.tk){fx.tk=tk;tickSound(tk%2===0);}canvasFx('skewX('+((Math.random()-.5)*6*amp).toFixed(2)+'deg) translateX('+((Math.random()-.5)*14*amp).toFixed(1)+'px)');}
   else if(fx.kind==='lift'){const amp=Math.sin(k*Math.PI),dir=fx.up?1:-1;g.fillStyle='rgba(0,0,0,'+(.35*amp).toFixed(3)+')';g.fillRect(0,0,b.width,b.height);for(let i=0;i<9;i++){const y=((i/9+age*1.6*dir)%1+1)%1*b.height;g.fillStyle='rgba(255,226,170,'+(.10*amp).toFixed(3)+')';g.fillRect(0,y,b.width,3+i%3*2);}
    canvasFx('translateY('+(Math.sin(age*40)*1.5*amp).toFixed(2)+'px)');}}
  return n;}
 function webgl(){return typeof document!=='undefined'?document.getElementById('phase1-webgl'):null;}
 let fxApplied=false;function canvasFx(tf){const c=webgl();if(!c||reduced())return;c.style.transform=tf;fxApplied=true;}
 function resetCanvasFx(){const c=webgl();if(c&&fxApplied){c.style.transform=tilted?tilted.tf:'';}fxApplied=false;}
 // 꿰맨 장미의 집 실내: 방이 살짝 기운다(영웅을 중심으로; 입력 캔버스는 그대로라 영웅 근처의 클릭 위치는 거의 같다).
 function tilt(st){const c=webgl();if(!c)return;const want=prefs.tilt&&!reduced()&&st?.theme.key==='rose'&&!st.theme.z?.outdoor&&!SM()?.flashlightActive;
  if(!want){untilt();return;}const q=project(player.x,player.y),deg=(-1.8+.25*Math.sin(now()*.35)).toFixed(2);tilted={tf:'rotate('+deg+'deg)'};c.style.transformOrigin=Math.round(q.x)+'px '+Math.round(q.y)+'px';if(!fx)c.style.transform=tilted.tf;}
 function untilt(){if(!tilted)return;tilted=null;const c=webgl();if(c&&!fx){c.style.transform='';c.style.transformOrigin='';}}
 function tickSound(hi){if(!prefs.tick)return;try{if(typeof settings!=='undefined'&&(settings.sound===false||settings.volume<=0))return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=ac||new A();if(ac.state==='suspended')ac.resume?.();
  const t0=ac.currentTime,o=ac.createOscillator(),gn=ac.createGain(),v=.05*clamp(typeof settings!=='undefined'&&Number.isFinite(+settings.volume)?+settings.volume:1,0,1);o.type='square';o.frequency.value=hi?2300:1700;
  gn.gain.setValueAtTime(.0001,t0);gn.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t0+.004);gn.gain.exponentialRampToValueAtTime(.0001,t0+.05);o.connect(gn);gn.connect(ac.destination);o.start(t0);o.stop(t0+.06);}catch(_){}}

 // ---- 들어설 때 표시(층·연도) -----------------------------------------------------------------------------
 function bannerEl(){let el=typeof document!=='undefined'?document.getElementById('moodBannerR123'):null;if(el)return el;const s=stageEl();if(!s)return null;el=document.createElement('div');el.id='moodBannerR123';el.setAttribute('aria-live','polite');
  el.style.cssText='position:absolute;left:50%;top:16%;transform:translateX(-50%);z-index:7;pointer-events:none;text-align:center;opacity:0;transition:opacity .5s ease;font-family:serif;color:#eadfc6;text-shadow:0 2px 8px #000,0 0 2px #000';s.appendChild(el);return el;}
 function showBanner(b){const el=bannerEl();if(!el)return;stats.banners++;const id=++bannerSerial;const narrow=(stageEl()?.clientWidth||1280)<720,BIG=narrow?40:64,BIG2=narrow?36:58;el.style.top=narrow?'12%':'16%';
  if(b.kind==='tower'){const lit=b.floor==='G'?0:+b.floor;let gauge='<div style="display:flex;gap:3px;justify-content:center;margin-top:8px">';for(let i=1;i<=16;i++)gauge+='<i style="display:block;width:9px;height:'+(6+i*.6).toFixed(1)+'px;align-self:flex-end;background:'+(i===lit?'#e8c070':i<lit?'rgba(232,192,112,.38)':'rgba(255,255,255,.12)')+'"></i>';gauge+='</div>';
   el.innerHTML='<div data-b="big" style="font-size:'+BIG+'px;letter-spacing:.08em;font-weight:bold;line-height:1">'+(b.from!=null&&b.from!==b.floor?esc(lab(b.from)):esc(lab(b.floor)))+'</div><div style="font-size:15px;letter-spacing:.2em;margin-top:6px">감정의 탑 · '+esc(b.sub)+'</div>'+gauge;
   if(b.from!=null&&b.from!==b.floor&&b.from!=='G'&&b.floor!=='G'){const a=+b.from,z=+b.floor,step=a<z?1:-1;let v=a;const big=el.querySelector('[data-b="big"]');const tm=setInterval(()=>{if(id!==bannerSerial){clearInterval(tm);return;}v+=step;big.textContent=v+'F';if(v===z)clearInterval(tm);},Math.max(70,900/Math.max(1,Math.abs(z-a))));}}
  else if(b.kind==='era'){const col=b.era==='data'?'#6dffb0':b.era==='forest'?'#ffd590':'#ff9a6a';el.innerHTML='<div data-b="big" style="font-family:monospace;font-size:'+BIG2+'px;letter-spacing:.14em;color:'+col+';text-shadow:0 0 12px '+col+',0 2px 6px #000">----</div><div style="font-size:15px;letter-spacing:.18em;margin-top:6px">'+(b.dys?'디스토피아':'네오 서울')+' · '+esc(b.label)+'</div>';
   const big=el.querySelector('[data-b="big"]'),target=b.year||(b.dys?b.dys:'연도 없음');/* R180: 디스토피아(DYS-xx)는 연도가 없어 구간 번호로 멈춘다 */let n=0;const tm=setInterval(()=>{if(id!==bannerSerial){clearInterval(tm);return;}n++;if(n<14){big.textContent=Array.from({length:4},()=>String(Math.floor(Math.random()*10))).join('');}else{big.textContent=b.year?target+'년':target;clearInterval(tm);}},60);}
  el.style.opacity='1';clearTimeout(showBanner.tm);showBanner.tm=setTimeout(()=>{if(id===bannerSerial)el.style.opacity='0';},3600);}
 let bannerSerial=0;const lab=f=>f==='G'?'G':f+'F';const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function floorName(T,f){if(f==='G')return'탑 밖 공터';const names=T.z?.p?.names;if(T.z?.tpl==='tower'&&Array.isArray(names)){const i=T.floors.list.indexOf(f);if(i>=0&&names[i])return names[i];}return T.z?.title||f+'층';}

 // ---- 들어섬·매 프레임 -------------------------------------------------------------------------------------
 function stateFor(r){const zid=zoneIdOf(r);if(!zid)return null;let st=rooms.get(r);if(st&&st.zone===zid)return st;const T=themeOf(zid);if(!T)return null;st=build(r,T);rooms.set(r,st);return st;}
 function enter(st){cur=st;applyLayer(st);decoProps(room,st);regrade();const T=st.theme;
  if(T.key==='tower'){const f=floorAt(T,player.x,player.y);pendingBanner={kind:'tower',floor:f,from:lastFloor,sub:floorName(T,f)};if(lastFloor!=null&&lastFloor!==f){pendingFx={kind:'lift',dur:1.3,up:heightOf(f)>=heightOf(lastFloor)};stats.lifts++;}lastFloor=f;lastFloorZone=T.zone;}
  else lastFloor=null;
  if(T.ns){pendingBanner={kind:'era',era:T.key,year:T.ns.year,label:T.ns.label,dys:/^DYS-/.test(T.sec||'')?T.sec:null};if(lastEra!==T.sec){pendingFx={kind:'warp',dur:1.4,back:!!(lastYear&&T.ns.year&&+T.ns.year<+lastYear)};stats.warps++;}lastEra=T.sec;if(T.ns.year)lastYear=T.ns.year;}
  else{lastEra=null;lastYear=null;}}
 let lastT=0;
 function loop(){try{stats.frames++;const t=performance.now(),dt=clamp((t-(lastT||t))/1000,0,.1);lastT=t;
  const zid=prefs.mood&&live()&&dream()?zoneIdOf(room):null,st=zid?stateFor(room):null;
  if(fx&&wall()-fx.t0>fx.dur+.2){fx=null;resetCanvasFx();}
  if(!st){if(cur){cur=null;hideLayer();}if(!zid){lastEra=null;lastYear=null;lastFloor=null;}}
  else{if(st!==last){last=st;enter(st);}
   if(st.theme.key==='tower'){const f=floorAt(st.theme,player.x,player.y);if(f!==lastFloor&&lastFloorZone===st.zone){pendingBanner={kind:'tower',floor:f,from:lastFloor,sub:floorName(st.theme,f)};pendingFx={kind:'lift',dur:1.1,up:heightOf(f)>=heightOf(lastFloor)};stats.lifts++;lastFloor=f;applyLayer(st);}}
   if(!busy()){if(pendingFx){fx={...pendingFx,t0:wall()};pendingFx=null;}if(pendingBanner){if(prefs.banner)showBanner(pendingBanner);pendingBanner=null;}}
   if(prefs.overlay&&host){host.style.display=busy()?'none':'block';if(!busy())frame(dt);}
   if(!busy())tilt(st);else untilt();}
 }catch(e){fail(e);}if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);}

 // ---- 그리기 연결 -------------------------------------------------------------------------------------------
 const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
 function ground(){if(!prefs.mood||!live()||!dream())return;const st=cur&&rooms.get(room)===cur?cur:null;if(!st)return;const before=ctx?.commands?.length||0;
  scope({id:'r123:ground',kind:'effect',x:player.x,y:player.y},()=>{ctx.save();try{if(prefs.floor)drawDecals(st);if(st.ghosts.length)drawGhosts(st);}finally{ctx.restore();}});
  const used=(ctx?.commands?.length||0)-before;if(used>stats.cmdsMax)stats.cmdsMax=used;}
 function install(){
  if(typeof drawExits==='function'){const b=drawExits;drawExits=function(...a){const r=b.apply(this,a);try{ground();}catch(e){fail(e);}return r;};}
  if(typeof drawProp==='function'){const b=drawProp;drawProp=function(p,...a){if(p?.r123Deco){if(!prefs.deco||!prefs.mood)return;
    // 원화가 있고 준비됐으면 게임의 소품 그리기(그림자·가림·접지 그대로), 아직이면 다시 요청하고 코드 그림으로 버틴다(지역 이동 때 그림 캐시가 비워진다)
    if(p.r129Frames&&prefs.art){try{const n=p.r129Frames.length;let st=clockPlay.get(p.id);// 녹는 시계: 영웅이 가까이 오면 K1→K4 를 한 번, K4 에서 멈춘다(되감기 없음)
     if(!st&&typeof player!=='undefined'&&player&&Math.hypot(player.x-p.x,player.y-p.y)<3.6){st={t0:performance.now()};clockPlay.set(p.id,st);stats.clockPlays=(stats.clockPlays||0)+1;}
     p.path=p.r129Frames[st?Math.min(n-1,Math.floor((performance.now()-st.t0)/520)):0];}catch(e){fail(e);}}
    if(p.path&&prefs.art){let ok=false;try{ok=typeof readyImage==='function'&&!!readyImage(p.path);if(!ok&&typeof addImage==='function')addImage(p.path);}catch(e){fail(e);}if(ok){stats.drawnArt=(stats.drawnArt||0)+1;return b.call(this,p,...a);}}
    try{if(live())drawDeco(p);}catch(e){fail(e);}return;}return b.call(this,p,...a);};}
  if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(loop);}
 function settingsSection(){if(typeof document==='undefined'||document.getElementById('moodSettingsR123'))return;const host=document.getElementById('detailSettingsR114')||document.getElementById('panel');if(!host)return;
  const d=document.createElement('details');d.id='moodSettingsR123';d.className='r114-group';
  const rows=[['mood','사몽 구역 분위기(감정의 탑 층·디스토피아 구간·장미의 집·밤의 학교·화가 화풍)'],['deco','분위기 조형물(찻잔·바늘·창·기계 탑·나무·이젤·녹는 시계 등)'],['floor','바닥 무늬(체스판·층 번호·데이터 격자·붓결·소용돌이)'],['overlay','화면 색·안개·떠다니는 입자·데이터 비·손전등 원뿔'],['banner','들어설 때 층·연도 표시'],['tick','시대 전환 시계 째깍 소리'],['tilt','장미의 집 기울어진 방'],['art','Drive 원화 소품(찻잔·바늘과 실·사물함·게시판)']];
  d.innerHTML='<summary>사몽 구역 분위기(R123)</summary><div class="settings">'+rows.map(([k,l])=>'<label><input type="checkbox" data-r123="'+k+'" '+(prefs[k]?'checked':'')+'> '+l+'</label>').join('')+'</div>';
  d.querySelectorAll('[data-r123]').forEach(el=>el.onchange=()=>set({[el.dataset.r123]:el.checked}));host.appendChild(d);
  const q=document.getElementById('quickSettingsR114');if(q&&!document.getElementById('r123QuickMood')){const l=document.createElement('label');l.id='r123QuickMood';l.innerHTML='<input type="checkbox" '+(prefs.mood?'checked':'')+'> 사몽 구역 분위기(층·연도·화풍)';q.appendChild(l);l.querySelector('input').onchange=e=>{set({mood:e.target.checked});const m=d.querySelector('[data-r123="mood"]');if(m)m.checked=e.target.checked;};}}
 try{install();}catch(e){fail(e);}
 window.__STORYWORLD_MOOD_R123__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,filter,themes:THEMES,themeOf,sectionOf,floorAt,heightOf,build,stateFor,drawDecals,drawDeco,draw:DRAW,frame,enter,
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},failures,lastError,zone:cur?.zone||null,theme:cur?.theme.key||null,floor:cur?.theme.key==='tower'?lastFloor:null,era:lastEra,fx:fx?.kind||null,
   decals:cur?.decals.length||0,deco:cur?.deco.length||0,lamps:cur?.lamps.length||0,ghosts:cur?.ghosts.length||0,collisionChanged:false,savesTouched:false})});
})();
