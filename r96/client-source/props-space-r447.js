// R447 공간 기능별 조형물 배치 — 사용자 2026-11-09 06:12Z "조형물과 소품이 공간의 기능이나 이동 동선을 고려하지 않고 난잡하게 배치되는 문제 …
//  방·복도·출입구·전투 구역·보스방·상호작용 구역에 맞는 배치 기준 … 핵심 조형물과 보조 소품 … 같은 물건이 같은 간격으로 반복되는 현상은 줄이고".
//  원인(헤드리스 전수 측정, 본편 62개 지역, main 86c7b2f):
//   ① 배치 자체: R224 방 가구(cave-r204 furnish)가 R171 지도의 방 이름(주사실·약품 보관실·거실·갈림길·복도·길목 …)을 보지 않고
//      지역 계열 공용 4~8종에서 무작위로(같은 그림 중복 허용) 뒤쪽 두 벽을 따라 3.2칸 간격으로 방마다 1~4점씩 놓았다.
//      → 25개 지역에 11~68점, 한 지역에 같은 그림이 최대 27번, 갈림길·계단참·3칸 길목에도 가구, 바깥 거리에 소파·단말기 줄.
//   ② 보였다 안 보였다: 그 그림은 방이 꾸며질 때 한 번만 읽고 엔진 releaseImageMemory 가 지운다 → 측정한 25곳 중 10곳은 0점, 나머지도 일부만(방문마다 다름).
//   ③ 시야 가림: 엔진은 영웅을 가리는 조형물만 옅게(.36) 그린다 → 키 큰 조형물 뒤(화면 위쪽)의 몹·보스·문·제단·상자는 가려진 채였다.
//   (벽 박힘·발 기준점·방향은 R111·R303·R406·R412, 길 위 장식은 R169, 문·입구 곁은 R303 이 이미 맡는다 — 측정: 길 위 12점·출입구 곁 5점·겹침 2점뿐.)
//  고침(그리기 전용 — 충돌·길찾기·몹·저장·문·목표·서사·조형물 id 그대로, R224 가구는 원래 solid:false):
//   A. 방 이름 → 공간 종류 규칙표(출입·통로·교차로·쉼터·마당·보관·전실·생활·예배·작업·보스).
//      교차로(갈림길·순환로·계단)·마당은 가구를 두지 않고, 통로는 길고(12칸↑) 넓을(5칸↑) 때만 벽 소품 1점,
//      나머지 방은 그 공간을 말해 주는 핵심 가구 1점 + 딸린 소품 0~2점을 한 벽(뒤쪽 두 벽 중 문 틈이 적은 쪽)에 한 묶음으로 둔다
//      (진료실=침대+수액대+모니터, 대기실=의자 둘+휠체어, 약품 보관실=약장+사물함, 접수=탁자+의자, 거실=소파 …).
//      같은 종류 방이 한 지역에 여러 개면 묶음을 돌려 쓰고 사이사이 비운 방을 둔다(같은 그림·같은 간격 반복 줄이기, 군집 사이 여백).
//      묶음 자리는 벽 길이의 3할·7할 근처(가운데 대칭 피함), 문 틈·문·입구·제단·목표·R169 길·다른 조형물에서 떨어진 곳.
//      가구는 모두 벽에서 2칸 안(대부분 1칸 안)이라 방 가운데 전투 공간은 비고, 폭 5칸 미만 방은 벽 소품 1점만.
//      큰 방(380칸↑)만 맞은편 벽에 다른 그림 한 점을 더 둔다. (몹 자리는 쓰지 않는다 — 불러오기 때 몹 집 자리가 저장 위치로 바뀌어 배치가 달라졌다.)
//      R224 가 만든 소품 객체(id)를 그대로 다시 쓰고(그림·자리만 바꿈), 남는 것은 숨긴다(r303Hide='r447' — 그림자·R92·R412 도 따라 쉰다).
//      보스 전투실·중앙 전투실(보스방·모이는 방)은 보스방 작업(R438·sin-room-art) 몫이라 손대지 않는다. 칠죄 지역 그림 제한(R438)은 지킨다.
//      맘몬 지역(ep1b06)·사몽·꿈 층은 손대지 않는다.
//   B. 남긴 가구 그림은 바로 읽고, 그릴 때 아직 없으면 1.5초 간격으로 다시 읽는다 → 방문·저장 불러오기마다 같은 모습.
//   C. 키 큰 조형물(키 56px↑)이 그 뒤의 살아 있는 몹·보스, 문·제단·목표·상자를 화면에서 덮으면 엔진 영웅 규칙처럼 옅게(.4~.5) 그린다.
//  결정성: 계획은 방을 처음 볼 때 한 번(지도·방 이름·문·입구·목표·제단·R169 길·R224 소품 id·처음 본 조형물만 씀, 몹·난수 없음).
//   나중에 붙는 상자·상호작용·문 소품 곁(1.5~1.6칸)의 가구는 계획을 바꾸지 않고 그 점만 숨긴다 → 언제 붙든 같은 결과. 저장·불러오기·재입장 모두 같은 배치.
//  끄기: localStorage['storyworld.r447.space']='{"on":false}' (부분: {"furnish":false} 가구 규칙만, {"fade":false} 가림 완화만)
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_SPACE_R447__)return;
const REV='R447-props-space-2',KEY='storyworld.r447.space';
const prefs={on:true,furnish:true,fade:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={regions:0,rooms:0,kept:0,hidden:0,skippedBoss:0,emptyRooms:0,rhythmEmpty:0,lateHidden:0,reloads:0,faded:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const h32=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const fin=Number.isFinite;

// ---- 공간 종류 ------------------------------------------------------------------------------------
//  R171 방 이름 = 지역 자료 purposes(StoryWorldProfilesR74) + 일반 이름(입구·앞방·길목·복도·작은 마당·계단참·다음 구역 문) + R81 보스 전투실·중앙 전투실.
const SPACE=[
 ['boss',/보스 전투실|중앙 전투실/],
 ['entry',/다음 구역 문|출입문|입구|현관/],
 ['junction',/갈림길|순환로|계단/],
 ['corridor',/길목|복도|회랑|통로/],
 ['rest',/쉼길|대기실/],
 ['yard',/마당|다리 위/],
 ['storage',/보관실|창고|서가|기록실|서재/],
 ['ante',/전실|앞방/],
 ['living',/거실|작은 방|빈 방|닫힌 방|병실|병동/],
 ['worship',/예배|신랑|측랑|수확실/]];
function spaceOf(name){const n=String(name||'').trim();if(!n)return 'room';for(const[k,re]of SPACE)if(re.test(n))return k;return 'work';}

// ---- 가구 묶음 ------------------------------------------------------------------------------------
//  그림은 R224 가 그 지역 계열에 쓰던 world-r80 그림만(새 자산 없음, 실내 불꽃 화로 r80-039 는 뺌). P(그림, 벽을 따라 칸, 벽에서 칸) — 첫 줄이 핵심 가구.
//  벽에서: 벽 가구 .45~.7(R406 .5), 소파 .85(R406), 침대 .95(머리를 벽에), 의자 줄 1.15, 탁자 1.95 + 의자 .9(벽과 탁자 사이, 탁자를 봄).
//  한 공간 종류에 묶음이 여럿이면 지역 안에서 그 종류 방이 나올 때마다 차례로 돌려 쓴다. E = 일부러 비운 방(군집 사이 여백).
const P=(art,a,d)=>({art,a,d}),E=Object.freeze([]);
const T={
 clinic:{work:[[P('142',0,.95),P('141',1.3,.6),P('143',-1.25,.6)],[P('142',0,.95),P('144',1.35,.55)],[P('148',0,.55),P('146',2.3,1.2)]],
  living:[[P('142',0,.95),P('144',1.35,.55)],[P('142',0,.95),P('141',1.3,.6)]],
  rest:[[P('145',0,1.15),P('145',1,1.15),P('149',2.45,1.2)],[P('145',0,1.15),P('145',1,1.15)]],
  storage:[[P('148',0,.55),P('144',1.55,.55)],[P('148',0,.55)]],
  ante:[[P('146',0,1.95),P('145',0,.9)],[P('149',0,1.2)],E],entry:[[P('146',0,1.95),P('145',0,.9)],E],worship:[[P('146',0,1.95),P('145',0,.9)]],
  corridor:[[P('149',0,.8)],E],room:[[P('148',0,.55)],E]},
 home:{living:[[P('024',0,.85),P('025',2.1,.75)],[P('024',0,.85),P('026',-1.7,.6)],[P('024',0,.85)]],rest:[[P('024',0,.85)],[P('024',0,.85),P('026',-1.7,.6)]],
  entry:[[P('026',0,.6)],E],ante:[[P('026',0,.6)],E,[P('025',0,.75)]],storage:[[P('025',0,.75)],E],work:[[P('027',0,.55),P('025',1.7,.75)],[P('027',0,.55)]],
  corridor:[[P('026',0,.6)],E],worship:[[P('026',0,.6)]],room:[[P('024',0,.85)],E,[P('025',0,.75)]]},
 urban:{entry:[[P('054',0,.55),P('056',1.35,.45)],[P('056',0,.45)]],ante:[[P('054',0,.55),P('051',-1.5,.7)],[P('051',0,.7)],E],work:[[P('054',0,.55),P('051',-1.5,.7)],[P('051',0,.7)]],
  storage:[[P('051',0,.7)],E],living:[[P('024',0,.85),P('051',2.2,.7)],[P('024',0,.85)]],rest:[[P('024',0,.85)],[P('024',0,.85),P('056',1.6,.45)],E],
  corridor:[[P('056',0,.45)],E],worship:[[P('051',0,.7)]],room:[[P('051',0,.7)],E]},
 forge:{work:[[P('045',0,.65),P('027',1.75,.55)],[P('045',0,.65)]],ante:[[P('018',0,.6)],E],storage:[[P('045',0,.65)],E],entry:[[P('018',0,.6)],E],corridor:[[P('018',0,.6)],E],
  living:[[P('027',0,.55)],E],rest:[E],worship:[[P('018',0,.6)]],room:[[P('045',0,.65)],E]},
 machine:{work:[[P('152',0,.95),P('151',1.55,.6)],[P('002',0,.7),P('001',1.6,.6)]],ante:[[P('075',0,.7),P('001',1.6,.6)],[P('001',0,.6)],E],entry:[[P('075',0,.7)],E],
  storage:[[P('002',0,.7),P('001',1.6,.6)],[P('002',0,.7)]],living:[[P('151',0,.6)],E],rest:[[P('151',0,.6)],E],corridor:[[P('001',0,.6)],E],worship:[[P('075',0,.7)]],room:[[P('001',0,.6)],E]},
 cult:{worship:[[P('061',0,.75),P('064',1.6,.6)],[P('062',0,.7),P('069',1.7,.55)]],work:[[P('061',0,.75),P('062',1.75,.7)],[P('062',0,.7)]],storage:[[P('062',0,.7),P('069',1.7,.55)],[P('069',0,.55)]],
  ante:[[P('075',0,.7)],E],entry:[[P('075',0,.7)],E],corridor:[[P('069',0,.55)],E],living:[[P('064',0,.6)],E],rest:[[P('064',0,.6)]],room:[[P('069',0,.55)],E]}};
// 큰 방 맞은편 벽 한 점(묶음과 다른 그림)
const EXTRA={clinic:['148','144','149'],home:['026','025'],urban:['056','051'],forge:['018','045'],machine:['001','002','151'],cult:['069','062','064']};
const WALL_D={'024':.85,'025':.75,'026':.6,'027':.55,'051':.7,'056':.45};
// 계열 판별: 지역 R224 가구(처음 그림)에서 그 계열에만 있는 그림 수로
const KIND_ART={clinic:/r80-14[1-9]\.webp$/,home:/r80-02[567]\.webp$/,urban:/r80-05[146]\.webp$/,forge:/r80-(045|039|018)\.webp$/,machine:/r80-(001|002|151|152)\.webp$/,cult:/r80-(061|062|064|069)\.webp$/};
function kindOf(list){const n={};for(const p of list){const s=String(orig(p).path||'');for(const[k,re]of Object.entries(KIND_ART))if(re.test(s))n[k]=(n[k]||0)+1;}
 let best=null,bn=0;for(const k of Object.keys(KIND_ART))if((n[k]||0)>bn){bn=n[k];best=k;}return best;}
// 칠죄 지역(R438 과 같은 규칙): 보스방 틀+3칸 안 R224 가구와 지역 그림에 안 맞는 R224 가구는 R438 이 뺀다 → 처음부터 쓰지 않는다(먼저 돌든 나중 돌든 같은 결과)
const SIN=new Set(['ep1b02','ep1b03','ep1b04','ep1b05','ep1b07']),SIN_MARGIN=3;
const THEME={ep1b02:/^02[45]$/,ep1b03:/^026$/,ep1b04:/^02[57]$/};
const THEME_PATH={ep1b02:/r80-02[45]\.webp$/,ep1b03:/r80-026\.webp$/,ep1b04:/r80-02[57]\.webp$/};
// 그림 정면: 대부분의 R80 가구·의자·휠체어는 +y(화면 왼쪽 아래)를 본다. 소파 r80-024·쓰러진 기둥 r80-021(R412 NATIVE_X)과 침대 r80-142(긴 변·발치 +x)는 +x.
//  → 뒤쪽 벽에 등을 대고 방(탁자) 쪽을 보게: +y 정면은 -x 벽(w)에서, +x 정면은 -y 벽(n)에서 좌우를 뒤집는다(R303·R406·R412 와 같은 규칙). 탁자 r80-146 은 대칭.
const NATIVE_X=/^(021|024|142)$/,SYM=/^146$/;

// ---- 그림 ----------------------------------------------------------------------------------------
function asset(id){const A=window.__STORYWORLD_ASSETS_R80_DATA__?.assets;const a=A&&A['r80-'+id];return a&&a.path?a:null;}
const asked=new Map();
function ensure(paths,why){try{const want=paths.filter(p=>p&&!(typeof readyImage==='function'&&readyImage(p)));if(!want.length)return 0;const t=Date.now(),go=want.filter(p=>t-(asked.get(p)||0)>1500);if(!go.length)return 0;
 for(const p of go)asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages(go)).catch(()=>{});else if(typeof addImage==='function')for(const p of go)addImage(p,'R447 '+why);stats.reloads+=go.length;return go.length;}catch(e){fail(e);return 0;}}

// ---- 기하 ----------------------------------------------------------------------------------------
const SA=()=>window.StoryPhase1;
const floorMemo=new WeakMap();
function floorSet(L){let F=floorMemo.get(L);if(!F){F=new Set((L.floorCells||[]).map(c=>c[0]+','+c[1]));floorMemo.set(L,F);}return F;}
function blockedL(L,x,y,r){const a=SA();if(typeof a?.explorationBlocked==='function'){try{return !!a.explorationBlocked(L,x,y,r);}catch(_){return true;}}
 return !floorSet(L).has(Math.floor(x)+','+Math.floor(y));}
function r140Flips(p){try{const T4=window.__STORYWORLD_PROPS_TIDY_R412__;if(T4?.r140Flips)return !!T4.r140Flips(p);const V=window.__STORYWORLD_PROPS_VARIETY_R140__;return !!(V?.free?.(p)&&V?.flipOf?.(p)&&V?.inspect?.().prefs?.flip!==false);}catch(_){return false;}}
// R412 pivotShift 와 같은 셈: R80 그림의 발(pivot)이 가로 가운데가 아니면, 뒤집을 때 몸이 옆으로 가지 않게 발을 화면 가로로 옮긴다
function pivotShift(art){try{const a=asset(art),pv=a?.frame?.pivot;if(!a||!Array.isArray(pv)||!(a.width>0&&a.height>0))return 0;return (.5-pv[0]/a.width)*(+a.scale||1)*(a.width/a.height)*66*2/68;}catch(_){return 0;}}
// 지도에 박힌 피할 점(계획에 씀): 문(폭/2+1.4, 적어도 R303 의 1.6)·입구·관문(2.2)·목표·제단(2)
function layoutAvoid(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))out.push([d.x,d.y,Math.max(1.6,(+d.width||0)/2+1.4)]);
 for(const q of[L.entry,L.gate])if(q&&fin(q.x+q.y))out.push([q.x,q.y,2.2]);
 for(const q of[r.objective,r.altar,L.altar])if(q&&fin(q.x+q.y))out.push([q.x,q.y,2]);
 return out;}
// 소품으로 붙는 피할 것(나중에 붙어도 됨 — 계획은 그대로 두고 곁의 가구 한 점만 숨김): 문 소품 1.6, 상자·상호작용·NPC·단서·기록·조각 1.5
const DOORISH=p=>!!(p&&(p.r74Door||p.r81WardDoor||/portal|door/i.test(String(p.kind||''))));
const KEYISH=p=>!!(p&&(p.interactive||p.interact||p.npc||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.samongR103||p.r115Clue||p.r105Record||p.chestR103||p.growthR103||p.r162Frag||p.r169Note||p.r161Sculpture||p.passivePointDropR64||p.objective||/chest|note|memory|clue|altar/i.test(String(p.kind||'')+' '+String(p.id||''))));
function liveAvoid(r){const out=[];for(const p of r.props||[]){if(!p||p.r224Furniture||!fin(p.x+p.y))continue;if(DOORISH(p))out.push([p.x,p.y,1.6]);else if(KEYISH(p))out.push([p.x,p.y,1.5]);}return out;}
function pathOf(r){try{return window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null;}catch(e){fail(e);return null;}}
// R169 와 같은 셈(칸 가운데까지 1.15 안이면 R169 가 숨김) — 여기서는 1.3 으로 여유
const nearPath=(S,x,y,rad)=>{if(!S)return false;const cx=Math.floor(x),cy=Math.floor(y);for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(S.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-x,cy+dy+.5-y)<rad)return true;return false;};
// 방 사각형 뒤쪽 벽(n: y=y0 를 따라 x, w: x=x0 를 따라 y)의 문 틈(바깥 바닥으로 이어진 칸)
function openings(F,rc,side){const out=[];if(side==='n'){for(let x=rc.x0;x<rc.x1;x++)if(F.has(x+','+(rc.y0-1)))out.push(x+.5);}else{for(let y=rc.y0;y<rc.y1;y++)if(F.has((rc.x0-1)+','+y))out.push(y+.5);}return out;}
const inRect=(rc,x,y,m=0)=>x>=rc.x0-m&&x<=rc.x1+m&&y>=rc.y0-m&&y<=rc.y1+m;
const overlap=(rc,b)=>Array.isArray(b)&&b.length===4&&!(rc.x1<=b[0]||rc.x0>=b[2]||rc.y1<=b[1]||rc.y0>=b[3]);
// R224 가 처음 놓은 자리·그림(이 오버레이가 바꾼 뒤에도)
const orig=p=>p?.r447?.from||p;

// ---- 대상 지역 -------------------------------------------------------------------------------------
function eligible(r){return !!(prefs.on&&prefs.furnish&&r&&r.exploration&&Array.isArray(r.props)&&Array.isArray(r.exploration.r224Rooms)&&r.exploration.r224Rooms.length&&
 (!r.layer||r.layer==='STORY')&&!r.exploration.samongR103&&!r.exploration.samongR115&&!r.samongR103&&r.id!=='ep1b06');}
// 방을 처음 볼 때 한 번 찍어 두는 것(이후 소품이 붙거나 옮겨져도 계획은 그대로). 몹은 쓰지 않는다(저장 불러오기 때 집 자리가 바뀜).
function snapshot(r){const others=[];for(const p of r.props)if(p&&!p.r224Furniture&&p.path&&fin(p.x+p.y)&&!DOORISH(p)&&!KEYISH(p))others.push([+p.x,+p.y]);
 return{others};}

// ---- 한 지역 계획 ---------------------------------------------------------------------------------
//  돌려주는 것: {kind, rooms:[{id,name,space,variant,why,pieces:[{id,art,x,y,wall,side,mirror}],hide:[id]}]}
function plan(r,snap=snapshot(r)){const L=r?.exploration,R=L?.r224Rooms;if(!L||!Array.isArray(R)||!R.length||!Array.isArray(r.props))return null;
 const W=L.worldWardR81||{},sinOn=SIN.has(r.id)&&!!L.sinRoomArt,B=sinOn&&Array.isArray(W.bossBounds)&&W.bossBounds.length===4?W.bossBounds:null,themeP=sinOn?THEME_PATH[r.id]:null;
 const inSin=(x,y,m)=>!!B&&x>=B[0]-m&&x<=B[2]+m&&y>=B[1]-m&&y<=B[3]+m;
 const all=r.props.filter(p=>p&&p.r224Furniture&&fin(orig(p).x+orig(p).y));if(!all.length)return null;
 // R438 이 뺄 것은 처음부터 제외(쓰지도 숨기지도 않음 — R438 몫)
 const pool=all.filter(p=>{const o=orig(p);return !inSin(o.x,o.y,SIN_MARGIN)&&!(themeP&&!themeP.test(String(o.path||'')));});
 const kind=kindOf(all);if(!kind)return null;const TT=T[kind],theme=sinOn?THEME[r.id]||null:null,F=floorSet(L);
 const info=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q])),avoid=layoutAvoid(r),path=pathOf(r),others=snap.others||[];
 const out={kind,rooms:[]},placed=[],nth={};
 const byRoom=new Map();for(const p of pool){const o=orig(p),rc=R.find(q=>inRect(q,o.x,o.y,.01));if(!rc)continue;if(!byRoom.has(rc))byRoom.set(rc,[]);byRoom.get(rc).push(p);}
 const order=[...byRoom.keys()].sort((a,b)=>(a.id??0)-(b.id??0));
 for(const rc of order){const props=byRoom.get(rc).sort((a,b)=>String(a.id).localeCompare(String(b.id)));const nm=info.get(rc.id)?.name||info.get(rc.id)?.purpose||'';
  const space=spaceOf(nm),room={id:rc.id,name:nm,space,variant:-1,pieces:[],hide:props.map(p=>p.id),why:''};out.rooms.push(room);
  if(space==='boss'||overlap(rc,W.bossBounds)||overlap(rc,W.gatherBounds)){room.why='boss';room.hide=[];room.keep=props.map(p=>p.id);continue;}/* 보스방 작업 몫: 그대로 둔다 */
  const w=rc.x1-rc.x0,d=rc.y1-rc.y0,area=w*d;
  if(space==='junction'||space==='yard'){room.why=space;continue;}
  if(space==='corridor'&&!(Math.max(w,d)>=12&&Math.min(w,d)>=5)){room.why='short-corridor';continue;}
  const list=TT[space]||TT.room||[E];const k=nth[space]=(nth[space]??-1)+1,vi=k%list.length;room.variant=vi;/* 그 종류 첫 방은 늘 온전한 묶음 */
  let tpl=list[vi].slice();
  if(!tpl.length){room.why='rhythm';continue;}/* 같은 종류 방 사이 일부러 비움 */
  if(theme){tpl=tpl.filter(q=>theme.test(q.art));if(!tpl.length&&['living','rest','storage','work','room'].includes(space)){const first=['024','025','026','027'].find(a=>theme.test(a));if(first)tpl=[P(first,0,WALL_D[first]||.6)];}}
  if(Math.min(w,d)<5)tpl=tpl.filter(q=>q.d<=.8).slice(0,1);
  tpl=tpl.slice(0,props.length);
  if(!tpl.length){room.why='none';continue;}
  const salt=h32(r.id+':'+rc.id);
  const free=(x,y,fx,fy,mine)=>{if(!inRect(rc,x,y,-.35))return false;if(blockedL(L,x,y,.3)||blockedL(L,fx,fy,.08))return false;
   if(inSin(x,y,SIN_MARGIN)||inSin(fx,fy,SIN_MARGIN))return false;
   for(const[ax,ay,ar]of avoid)if(Math.hypot(ax-x,ay-y)<ar||Math.hypot(ax-fx,ay-fy)<ar)return false;
   if(nearPath(path,x,y,1.3)||nearPath(path,fx,fy,1.3))return false;
   for(const[ox,oy]of others)if(Math.hypot(ox-x,oy-y)<.95||Math.hypot(ox-fx,oy-fy)<.95)return false;
   for(const o of placed)if(Math.hypot(o.x-x,o.y-y)<(mine.includes(o)?.9:2.2))return false;return true;};
  const tryGroup=(group,sides,avoidT)=>{
   for(const side of sides){const len=side==='n'?w:d,start=side==='n'?rc.x0:rc.y0,ops=openings(F,rc,side),mir=(salt>>>3)&1?-1:1;
    const pref=[.3,.7,.36,.64][salt%4];const cands=[];for(let t=start+1;t<=start+len-1+1e-6;t+=.25)cands.push(t);
    cands.sort((a,b)=>Math.abs((a-start)/len-pref)-Math.abs((b-start)/len-pref)||a-b);
    for(const t of cands){if(avoidT&&avoidT.side===side&&Math.abs(t-avoidT.t)<3)continue;const mine=[];let ok=true;
     for(const q of group){const along=t+q.a*mir;if(along<start+.45||along>start+len-.45){ok=false;break;}
      if(ops.some(o=>Math.abs(o-along)<(q.d<=1.0?1.4:.9))){ok=false;break;}/* 뒤쪽 벽 문 틈 앞은 비운다 */
      const x=side==='n'?along:rc.x0+q.d,y=side==='n'?rc.y0+q.d:along,sd=side==='n'?'-y':'-x';
      const mirror=SYM.test(q.art)?false:NATIVE_X.test(q.art)?sd==='-y':sd==='-x',k=mirror?pivotShift(q.art):0,fx=Math.abs(k)>.01?x+k:x,fy=Math.abs(k)>.01?y-k:y;
      if(!free(x,y,fx,fy,mine)){ok=false;break;}
      const pc={x:fx,y:fy,bx:x,by:y,art:q.art,wall:side,side:sd,mirror,d:q.d};mine.push(pc);placed.push(pc);}
     if(ok)return{side,t,pcs:mine};for(const m of mine)placed.splice(placed.indexOf(m),1);}}
   return null;};
  const ns=openings(F,rc,'n').length,ws=openings(F,rc,'w').length;
  const sides=ns<ws?['n','w']:ws<ns?['w','n']:(salt&1?['w','n']:['n','w']);
  let got=null;for(let k2=tpl.length;k2>=1&&!got;k2--)got=tryGroup(tpl.slice(0,k2),sides,null);
  const pieces=got?got.pcs.slice():[];
  // 큰 방: 맞은편 벽에 다른 그림 한 점
  if(got&&area>=380&&pieces.length<props.length){const usedArt=new Set(pieces.map(q=>q.art));const ex=(EXTRA[kind]||[]).find(a=>!usedArt.has(a)&&(!theme||theme.test(a)));
   if(ex){const other=got.side==='n'?'w':'n';const g2=tryGroup([P(ex,0,WALL_D[ex]||.55)],[other,got.side],got);if(g2)pieces.push(...g2.pcs);}}
  room.hide=[];
  for(let i=0;i<props.length;i++){const p=props[i],pc=pieces[i];if(!pc){room.hide.push(p.id);continue;}pc.id=p.id;room.pieces.push(pc);}
  if(!pieces.length)room.why='no-spot';}
 return out;}

// ---- 적용(소품 id 로) -------------------------------------------------------------------------------
const done=new WeakMap();let lastPlan=null;
const sigOf=r=>{let n=0;for(const p of r.props||[])if(p?.r224Furniture)n++;return r.props.length+':'+n;};
function place(p,pc){const a=asset(pc.art);if(!a)return false;const first=!p.r447;
 if(first)p.r447={from:{x:p.x,y:p.y,path:p.path,r80Art:p.r80Art,height:p.height}};
 Object.assign(p.r447,{art:pc.art,wall:pc.wall});
 p.path=a.path;p.r80Art='r80-'+pc.art;p.height=64*(+a.scale||1);p.x=+pc.x.toFixed(3);p.y=+pc.y.toFixed(3);
 if(first){delete p.r303Hide;delete p.r303Moved;delete p.r303Wall;try{delete p.r111To;}catch(_){}delete p.r406Moved;delete p.r406Wall;
  // R412 가 옛 자리에서 잰 벽 겹침은 버리고 새 자리에서 다시 재게(벽에 박히면 R412 가 살짝 뺀다)
  delete p.r412Wall;delete p.r412Foot;delete p.r412Tries;delete p.r412Emb;delete p.r412Pivot;
  if(p.r169Hidden){delete p.r169Hidden;p.visible=true;}}
 p.r406Seen=1;/* R406 은 다시 옮기지 않는다 */
 // 방향: R140(장식 반쪽 뒤집기)과 겹쳐 보이는 방향이 원하는 쪽이 되게 r303Flip 을 고르고, 벽(side)을 r412Face 에 적어 R412 face 가 다시 돌리지 않게 한다.
 if(pc.mirror!==r140Flips(p))p.r303Flip=true;else delete p.r303Flip;p.r412Face=pc.side;
 return true;}
function apply(r,st){const keepPaths=[],live=liveAvoid(r),ids=st.assign,hideIds=st.hide;let kept=0,hidden=0,late=0;
 for(const p of r.props){if(!p||!p.r224Furniture)continue;const pc=ids.get(p.id);
  if(pc){if(p.r303Hide==='r447')delete p.r303Hide;
   if(!(p.r447&&p.r447.art===pc.art&&p.x===+pc.x.toFixed(3)&&p.y===+pc.y.toFixed(3))&&!place(p,pc)){p.r303Hide='r447';hidden++;continue;}
   // 나중에 붙은 문·상자·상호작용 곁이면 이 한 점만 쉰다(계획은 그대로)
   const near=live.some(([x,y,rr])=>Math.hypot(x-p.x,y-p.y)<rr);
   if(near){if(!p.r303Hide){p.r303Hide='r447x';late++;}}else if(p.r303Hide==='r447x')delete p.r303Hide;
   if(!p.r303Hide){keepPaths.push(p.path);kept++;}continue;}
  if(st.skip.has(p.id))continue;/* 보스방·R438 몫 */
  if(hideIds.has(p.id)||!st.known.has(p.id)){if(p.r303Hide!=='r447'){p.r303Hide='r447';hidden++;}}}
 if(late)stats.lateHidden+=late;ensure([...new Set(keepPaths)],'room furniture');return{kept,hidden,late};}
function curate(r,opt={}){if(!eligible(r))return null;
 let st=done.get(r);const sig=sigOf(r);
 if(st&&st.L===r.exploration&&!opt.force){if(st.sig!==sig){st.sig=sig;try{apply(r,st);}catch(e){fail(e);}}return st.rep;}
 const snap=st&&st.L===r.exploration&&st.snap?st.snap:snapshot(r);let pl=null;try{pl=plan(r,snap);}catch(e){fail(e);}
 const assign=new Map(),hide=new Set(),skip=new Set(),known=new Set();
 if(pl)for(const rm of pl.rooms){for(const pc of rm.pieces){assign.set(pc.id,pc);known.add(pc.id);}for(const id of rm.hide){hide.add(id);known.add(id);}for(const id of rm.keep||[]){skip.add(id);known.add(id);}}
 // 계획 밖 R224 가구(칠죄 보스방 둘레·지역 그림 밖 — R438 몫, 방 사각형 밖)는 손대지 않는다
 for(const p of r.props)if(p&&p.r224Furniture&&!known.has(p.id)){skip.add(p.id);known.add(p.id);}
 st={L:r.exploration,sig,snap,assign,hide,skip,known,rep:null};done.set(r,st);
 if(!pl)return null;
 let res={kept:0,hidden:0,late:0};try{res=apply(r,st);}catch(e){fail(e);}
 stats.regions++;for(const rm of pl.rooms){if(rm.why==='boss'){stats.skippedBoss++;continue;}stats.rooms++;if(!rm.pieces.length)stats.emptyRooms++;if(rm.why==='rhythm')stats.rhythmEmpty++;}stats.kept+=res.kept;stats.hidden+=res.hidden;
 const rep={room:r.id,kind:pl.kind,kept:res.kept,hidden:res.hidden,late:res.late,rooms:pl.rooms.map(q=>({id:q.id,name:q.name,space:q.space,variant:q.variant,why:q.why||undefined,
  pieces:q.pieces.map(c=>c.art+'@'+c.wall+':'+c.x.toFixed(2)+','+c.y.toFixed(2)+(c.mirror?'~':'')),hidden:q.hide.length}))};
 st.rep=rep;lastPlan=rep;return rep;}

// ---- 가림 완화 ------------------------------------------------------------------------------------
//  정적 표적(문·제단·목표·상자·상호작용)은 방마다 한 번 모으고(소품 수가 바뀌면 다시), 몹은 그릴 때 본다(살아 있고 5칸 안·조형물보다 뒤인 것만).
const targetMemo=new WeakMap();
function targets(r){let m=targetMemo.get(r);if(m&&m.L===r.exploration&&m.n===r.props.length)return m.list;const L=r.exploration||{},list=[];
 for(const d of L.worldR74?.doors||[])if(fin(d.x+d.y))list.push({x:d.x,y:d.y,h:1.1});
 for(const q of[r.objective,r.altar])if(q&&fin(q.x+q.y))list.push({x:q.x,y:q.y,h:.8});
 for(const p of r.props||[])if(p&&p.visible!==false&&!p.r303Hide&&(p.interactive||p.chestR103||/chest/i.test(String(p.id||'')))&&fin(p.x+p.y))list.push({x:p.x,y:p.y,h:.7});
 targetMemo.set(r,{L:r.exploration,n:r.props.length,list});return list;}
function spotOf(p){const t=p.r111To;let on=true;try{on=window.__STORYWORLD_PLAY_R111__?.prefs?.().props!==false;}catch(_){}return on&&t&&fin(t.x+t.y)&&!(p.r299||p.r317||p.r138Lift)?t:p;}
function coverAlpha(p){if(!prefs.on||!prefs.fade||!p||p.r303Hide||!(+p.height>=56)||typeof project!=='function'||typeof room==='undefined'||!room)return 1;
 const s=spotOf(p);if(!fin(s.x+s.y))return 1;const z=typeof zoom==='number'?zoom:1,hp=+p.height*z;let row=null;try{row=typeof readyImage==='function'?readyImage(p.path):null;}catch(_){}
 const cw=row?(row.crop?.w||row.image?.naturalWidth||0):0,ch=row?(row.crop?.h||row.image?.naturalHeight||0):0,wp=ch>0?hp*cw/ch:hp*.8;
 const q=project(s.x,s.y),left=q.x-wp*.42,right=q.x+wp*.42,top=q.y-hp*.92,depth=s.x+s.y,ah=typeof actorHeight==='function'?actorHeight():60;
 const hit=(x,y,h)=>{if(x+y>=depth-.15||Math.abs(x-s.x)>5||Math.abs(y-s.y)>5)return false;const e=project(x,y);if(e.x<left||e.x>right)return false;const mid=e.y-h*.5;return mid>top&&mid<q.y-4;};
 for(const e of room.enemies||[]){if(!e||!(e.hp>0)||e.visible===false||e.spawnState==='hidden'||!fin(e.x+e.y))continue;if(hit(e.x,e.y,ah*(e.boss?2.05:1)))return .4;}
 for(const t of targets(room))if(hit(t.x,t.y,ah*t.h))return .5;
 return 1;}

// ---- 그리기 감싸기 ---------------------------------------------------------------------------------
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){
 if(!prefs.on||!p)return base.call(this,p,...a);
 if(p.r224Furniture&&typeof room!=='undefined'&&room){const st=done.get(room);
  if(!st||st.L!==room.exploration){try{curate(room);}catch(e){fail(e);}}/* R224 가구가 처음 그려질 때(R406·R412 가 손대기 전) 바로 정리 */
  else if(!st.known.has(p.id)){st.known.add(p.id);if(st.rep&&!p.r303Hide)p.r303Hide='r447';}/* 계획 뒤에 새로 붙은 R224 가구는 쉰다(계획은 그대로) */
  if(p.r303Hide==='r447'||p.r303Hide==='r447x')return;
  if(p.r447&&p.path&&typeof readyImage==='function'&&!readyImage(p.path))ensure([p.path],'redraw');}
 let k=1;try{k=coverAlpha(p);}catch(e){fail(e);}
 if(k<1&&typeof sprite==='function'){const sp=sprite;stats.faded++;sprite=function(path,x,y,h,o,...rest){return sp.call(this,path,x,y,h,{...(o||{}),alpha:Math.min(o?.alpha??1,k)},...rest);};
  try{return base.call(this,p,...a);}finally{sprite=sp;}}
 return base.call(this,p,...a);};}}catch(e){fail(e);}
// 처음 본 순간 찍기 + 소품 수가 바뀌면 다시 적용(0.4초마다, 계획은 방마다 한 번)
(function poll(){try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading)&&eligible(room)&&room.props.some(p=>p?.r224Furniture))curate(room);}catch(e){fail(e);}setTimeout(poll,400);})();
function set(o={}){for(const k of Object.keys(prefs))if(typeof o[k]==='boolean')prefs[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PROPS_SPACE_R447__=Object.freeze({revision:REV,set,plan,curate,eligible,snapshot,spaceOf,kindOf,coverAlpha,TEMPLATES:T,EXTRA,SPACE:SPACE.map(([k,re])=>[k,String(re)]),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},room:typeof room!=='undefined'&&room?(done.get(room)?.rep||null):null,last:lastPlan,lastError,collisionChanged:false,savesTouched:false})});
})();
