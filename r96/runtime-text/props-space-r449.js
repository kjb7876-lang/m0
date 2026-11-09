// R449 공간 기능별 조형물 배치 — 사용자 2026-11-09 06:12Z "조형물과 소품이 공간의 기능이나 이동 동선을 고려하지 않고 난잡하게 배치되는 문제 …
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
//      가구는 모두 벽에서 2칸 안(대부분 1칸 안)이라 방 가운데 전투 공간은 비고, 방 크기별 상한은 R224 와 같다(45칸당 1점, 1~4점, 폭 5칸 미만 방은 없음).
//      큰 방(380칸↑)만 맞은편 벽에 다른 그림 한 점을 더 둔다. (몹 자리는 쓰지 않는다 — 불러오기 때 몹 집 자리가 저장 위치로 바뀌어 배치가 달라졌다.)
//      계획한 가구는 새 소품 객체(id r449:furn:지역:방:번호, solid:false)로 넣고, 보스방·모이는 방 밖의 R224 가구는 쉬게 한다
//      (r303Hide='r449' — 객체·id 는 배열에 그대로, 그림자·R92·R412 도 따라 쉰다). R224 객체를 다시 쓰지 않는 까닭: R224 는 그 순간 있던
//      소품에 따라 자리를 건너뛰어, 같은 지역도 불러오기 때 개수·자리가 달라졌다(질투 지역 측정).
//      보스 전투실·중앙 전투실(보스방·모이는 방)은 보스방 작업(R438·sin-room-art) 몫이라 손대지 않는다. 칠죄 지역 그림 제한(R438)은 지킨다.
//      맘몬 지역(ep1b06)·사몽·꿈 층은 손대지 않는다.
//   B. 남긴 가구 그림은 바로 읽고, 그릴 때 아직 없으면 1.5초 간격으로 다시 읽는다 → 방문·저장 불러오기마다 같은 모습.
//   C. 키 큰 조형물(키 56px↑)이 그 뒤의 살아 있는 몹·보스, 문·제단·목표·상자를 화면에서 덮으면 엔진 영웅 규칙처럼 옅게(.4~.5) 그린다.
//  결정성: 계획은 방을 처음 볼 때 한 번(지도·방 이름·바닥·문·입구·목표·제단·R169 길·처음 본 조형물 자리·지역 계열만 씀, 몹·난수·R224 자리 없음).
//   나중에 붙는 상자·상호작용·문 소품 곁(1.5~1.6칸)의 가구는 계획을 바꾸지 않고 그 점만 숨긴다 → 언제 붙든 같은 결과. 저장·불러오기·재입장 모두 같은 배치.
//  끄기: localStorage['storyworld.r449.space']='{"on":false}' (부분: {"furnish":false} 가구 규칙만, {"fade":false} 가림 완화만)
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_SPACE_R449__)return;
const REV='R449-props-space-9',KEY='storyworld.r449.space';
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
// 벽에서 띄울 최소 거리(R412 3D 벽 박힘 재기로 실측: 8개 지역 120점, 3% 넘게 벽에 든 그림을 R412 가 밀어낸 거리를 더한 값).
//  처음부터 그 자리에 두면 R412 가 옮기지 않는다 → 벽 높이(R115)가 올라가는 때와 상관없이 그리는 자리도 늘 같다(불러오기 전후 .4/.6 칸 차이 측정).
const WALL_MIN={'018':1.2,'045':1.05,'069':.9,'148':.8,'001':.9,'002':.85,'027':.9,'054':.8,'075':.85,'151':.9,'026':.85,'025':.85,'141':.75};
// 계열 판별: 지역 R224 가구(처음 그림)에서 그 계열에만 있는 그림 수로
const KIND_ART={clinic:/r80-14[1-9]\.webp$/,home:/r80-02[567]\.webp$/,urban:/r80-05[146]\.webp$/,forge:/r80-(045|039|018)\.webp$/,machine:/r80-(001|002|151|152)\.webp$/,cult:/r80-(061|062|064|069)\.webp$/};
function kindOf(list){const n={};for(const p of list){const s=String(p.path||'');for(const[k,re]of Object.entries(KIND_ART))if(re.test(s))n[k]=(n[k]||0)+1;}
 let best=null,bn=0;for(const k of Object.keys(KIND_ART))if((n[k]||0)>bn){bn=n[k];best=k;}return best;}
// 칠죄 지역(R438 과 같은 규칙): 보스방 틀+3칸 안 R224 가구와 지역 그림에 안 맞는 R224 가구는 R438 이 뺀다 → 처음부터 쓰지 않는다(먼저 돌든 나중 돌든 같은 결과)
const SIN=new Set(['ep1b02','ep1b03','ep1b04','ep1b05','ep1b07']),SIN_MARGIN=3;
const THEME={ep1b02:/^02[45]$/,ep1b03:/^026$/,ep1b04:/^02[57]$/};
// 그림 정면: 대부분의 R80 가구·의자·휠체어는 +y(화면 왼쪽 아래)를 본다. 소파 r80-024·쓰러진 기둥 r80-021(R412 NATIVE_X)과 침대 r80-142(긴 변·발치 +x)는 +x.
//  → 뒤쪽 벽에 등을 대고 방(탁자) 쪽을 보게: +y 정면은 -x 벽(w)에서, +x 정면은 -y 벽(n)에서 좌우를 뒤집는다(R303·R406·R412 와 같은 규칙). 탁자 r80-146 은 대칭.
const NATIVE_X=/^(021|024|142)$/,SYM=/^146$/;
// 같은 그림 반복 상한: 한 지역에 같은 그림은 6점까지(같은 물건이 지역 전체에 줄지어 서는 것 줄이기).
//  이름 붙은 방(주사실·서재·거울 회랑 …)을 먼저, R171 일반 연결 방(입구·앞방·길목·복도·작은 마당·계단참·다음 구역 문)을 나중에 채워 상한 몫이 이야기 공간에 먼저 간다.
const ART_CAP=6,GENERIC=/^(입구|앞방|길목|복도|작은 마당|계단참|다음 구역 문)$/;

// ---- 그림 ----------------------------------------------------------------------------------------
function asset(id){const A=window.__STORYWORLD_ASSETS_R80_DATA__?.assets;const a=A&&A['r80-'+id];return a&&a.path?a:null;}
const asked=new Map();
function ensure(paths,why){try{const want=paths.filter(p=>p&&!(typeof readyImage==='function'&&readyImage(p)));if(!want.length)return 0;const t=Date.now(),go=want.filter(p=>t-(asked.get(p)||0)>1500);if(!go.length)return 0;
 for(const p of go)asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages(go)).catch(()=>{});else if(typeof addImage==='function')for(const p of go)addImage(p,'R449 '+why);stats.reloads+=go.length;return go.length;}catch(e){fail(e);return 0;}}

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
// ---- 대상 지역 -------------------------------------------------------------------------------------
function eligible(r){return !!(prefs.on&&prefs.furnish&&r&&r.exploration&&Array.isArray(r.props)&&Array.isArray(r.exploration.r224Rooms)&&r.exploration.r224Rooms.length&&
 (!r.layer||r.layer==='STORY')&&!r.exploration.samongR103&&!r.exploration.samongR115&&!r.samongR103&&r.id!=='ep1b06');}
const MINE=p=>!!p&&p.r449Furniture===true;
// 방을 처음 볼 때 한 번 찍어 두는 다른 조형물 자리(이후 소품이 붙거나 옮겨져도 계획은 그대로). 몹은 쓰지 않는다(저장 불러오기 때 집 자리가 바뀜).
function snapshot(r){const others=[];for(const p of r.props)if(p&&!p.r224Furniture&&!MINE(p)&&p.path&&fin(p.x+p.y)&&!DOORISH(p)&&!KEYISH(p))others.push([+p.x,+p.y]);
 return{others};}
// 지역 계열: R224 가 그 지역에 쓴 그림 계열. 처음 정한 답을 지역 id 로 기억한다(R438 이 일부를 빼도 같은 답).
const kindMemo=new Map();
function regionKind(r){if(kindMemo.has(r.id))return kindMemo.get(r.id);const k=kindOf(r.props.filter(p=>p&&p.r224Furniture));if(k)kindMemo.set(r.id,k);return k;}

// ---- 한 지역 계획 ---------------------------------------------------------------------------------
//  지도 자료(방 사각형·이름·바닥·문·입구·목표·제단·R169 길)와 처음 본 조형물 자리만 본다. R224 가 무엇을 어디에 몇 점 놓았는지는 보지 않는다
//  (R224 는 그 순간 있던 소품에 따라 자리를 건너뛰어 불러오기 때 개수·자리가 달라졌다 — 질투 지역 측정).
//  돌려주는 것: {kind, rooms:[{id,name,space,variant,why,boss,rect,pieces:[{id,art,x,y,wall,side,mirror}]}]}
function plan(r,snap=snapshot(r)){const L=r?.exploration,R=L?.r224Rooms;if(!L||!Array.isArray(R)||!R.length||!Array.isArray(r.props))return null;
 const kind=regionKind(r);if(!kind)return null;
 const W=L.worldWardR81||{},sinOn=SIN.has(r.id)&&!!L.sinRoomArt,B=sinOn&&Array.isArray(W.bossBounds)&&W.bossBounds.length===4?W.bossBounds:null;
 const inSin=(x,y,m)=>!!B&&x>=B[0]-m&&x<=B[2]+m&&y>=B[1]-m&&y<=B[3]+m;
 const TT=T[kind],theme=sinOn?THEME[r.id]||null:null,F=floorSet(L);
 const info=new Map((L.worldR74?.rooms||[]).map(q=>[q.id,q])),avoid=layoutAvoid(r),path=pathOf(r),others=snap.others||[];
 const out={kind,rooms:[]},placed=[],nth={},used={};
 const gen=q=>GENERIC.test(String(info.get(q.id)?.name||info.get(q.id)?.purpose||'').trim())?1:0;
 const order=R.filter(q=>q&&fin(q.x0+q.y0+q.x1+q.y1)).sort((a,b)=>gen(a)-gen(b)||(a.id??0)-(b.id??0));
 for(const rc of order){const nm=info.get(rc.id)?.name||info.get(rc.id)?.purpose||'',space=spaceOf(nm),w=rc.x1-rc.x0,d=rc.y1-rc.y0,area=w*d;
  const room={id:rc.id,name:nm,space,variant:-1,pieces:[],why:'',rect:[rc.x0,rc.y0,rc.x1,rc.y1]};out.rooms.push(room);
  if(space==='boss'||overlap(rc,W.bossBounds)||overlap(rc,W.gatherBounds)){room.why='boss';room.boss=true;continue;}/* 보스방 작업 몫: R224 가구 그대로 */
  if(w<5||d<5){room.why='small';continue;}/* R224 도 두지 않던 좁은 칸 */
  if(B&&inSin(rc.x0,rc.y0,SIN_MARGIN)&&inSin(rc.x1,rc.y1,SIN_MARGIN)){room.why='sin-boss';continue;}/* 칠죄 보스방 둘레 — R438 몫 */
  if(space==='junction'||space==='yard'){room.why=space;continue;}
  if(space==='corridor'&&!(Math.max(w,d)>=12&&Math.min(w,d)>=5)){room.why='short-corridor';continue;}
  const list=TT[space]||TT.room||[E];const k=nth[space]=(nth[space]??-1)+1,vi=k%list.length;room.variant=vi;/* 그 종류 첫 방은 늘 온전한 묶음 */
  let tpl=list[vi].slice();
  if(!tpl.length){room.why='rhythm';continue;}/* 같은 종류 방 사이 일부러 비움 */
  if(theme){tpl=tpl.filter(q=>theme.test(q.art));if(!tpl.length&&['living','rest','work','room'].includes(space)){const first=['024','025','026','027'].find(a=>theme.test(a));if(first)tpl=[P(first,0,WALL_D[first]||.6)];}}
  const cap=Math.max(1,Math.min(4,Math.round(area/45)));/* R224 와 같은 방 크기별 상한(작은 방은 적게) */
  tpl=tpl.slice(0,cap);
  if(tpl.length&&(used[tpl[0].art]||0)>=ART_CAP){room.why='repeat';continue;}/* 핵심 그림이 이미 지역 상한 — 이 방은 비운다 */
  {const c={};tpl=tpl.filter((q,i)=>{const n=(used[q.art]||0)+(c[q.art]||0);if(i>0&&n>=ART_CAP)return false;c[q.art]=(c[q.art]||0)+1;return true;});}
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
     for(const q0 of group){const q={...q0,d:Math.max(q0.d,WALL_MIN[q0.art]||0)},along=t+q.a*mir;if(along<start+.45||along>start+len-.45){ok=false;break;}
      if(ops.some(o=>Math.abs(o-along)<(q0.d<=1.0?1.4:.9))){ok=false;break;}/* 뒤쪽 벽 문 틈 앞은 비운다(벽 가구는 1.4, 탁자처럼 떨어져 선 것은 .9) */
      const x=side==='n'?along:rc.x0+q.d,y=side==='n'?rc.y0+q.d:along,sd=side==='n'?'-y':'-x';
      const mirror=SYM.test(q.art)?false:NATIVE_X.test(q.art)?sd==='-y':sd==='-x',kk=mirror?pivotShift(q.art):0,fx=Math.abs(kk)>.01?x+kk:x,fy=Math.abs(kk)>.01?y-kk:y;
      if(!free(x,y,fx,fy,mine)){ok=false;break;}
      const pc={x:fx,y:fy,bx:x,by:y,art:q.art,wall:side,side:sd,mirror,d:q.d};mine.push(pc);placed.push(pc);}
     if(ok)return{side,t,pcs:mine};for(const m of mine)placed.splice(placed.indexOf(m),1);}}
   return null;};
  const ns=openings(F,rc,'n').length,ws=openings(F,rc,'w').length;
  const sides=ns<ws?['n','w']:ws<ns?['w','n']:(salt&1?['w','n']:['n','w']);
  let got=null;for(let k2=tpl.length;k2>=1&&!got;k2--)got=tryGroup(tpl.slice(0,k2),sides,null);
  const pieces=got?got.pcs.slice():[];
  // 큰 방: 맞은편 벽에 다른 그림 한 점
  if(got&&area>=380&&pieces.length<cap){const usedArt=new Set(pieces.map(q=>q.art));const ex=(EXTRA[kind]||[]).find(a=>!usedArt.has(a)&&(!theme||theme.test(a))&&(used[a]||0)<ART_CAP);
   if(ex){const other=got.side==='n'?'w':'n';const g2=tryGroup([P(ex,0,WALL_D[ex]||.55)],[other,got.side],got);if(g2)pieces.push(...g2.pcs);}}
  pieces.forEach((pc,i)=>{pc.id='r449:furn:'+r.id+':'+rc.id+':'+i;room.pieces.push(pc);used[pc.art]=(used[pc.art]||0)+1;});
  if(!pieces.length)room.why='no-spot';}
 return out;}

// ---- 적용 ----------------------------------------------------------------------------------------
//  계획한 가구는 새 소품 객체로 한 번 넣고(id r449:furn:지역:방:번호), 보스방·모이는 방 밖의 R224 가구는 쉬게 한다(객체·id 는 배열에 그대로).
const done=new WeakMap();let lastPlan=null;
const sigOf=r=>{let a=0,b=0;for(const p of r.props||[]){if(p?.r224Furniture)a++;else if(MINE(p))b++;}return r.props.length+':'+a+':'+b;};
function make(pc,rm){const a=asset(pc.art);if(!a)return null;
 const p={id:pc.id,path:a.path,x:+pc.x.toFixed(3),y:+pc.y.toFixed(3),height:64*(+a.scale||1),solid:false,visible:true,enabled:true,
  r80Dressing:true,r80Art:'r80-'+pc.art,r80PresentationOnly:true,r449Furniture:true,r449:{room:rm.id,space:rm.space,wall:pc.wall,art:pc.art},
  r406Seen:1/* R406 은 옮기지 않는다 */,r412Face:pc.side/* R412 face 가 다시 돌리지 않게 벽을 적는다 */};
 // 방향: R140(장식 반쪽 뒤집기)과 겹쳐 보이는 방향이 원하는 쪽(벽에 등, 방 쪽 정면)이 되게 r303Flip 을 고른다
 if(pc.mirror!==r140Flips(p))p.r303Flip=true;return p;}
const inBoss=(st,p)=>st.bossRects.some(b=>p.x>=b[0]-.01&&p.x<=b[2]+.01&&p.y>=b[1]-.01&&p.y<=b[3]+.01);
function apply(r,st){const keepPaths=[],live=liveAvoid(r),have=new Set();let kept=0,rested=0,late=0;
 if(!st.planned)return{kept,rested,late};/* 계열을 모르는 지역(R224 그림이 공용 소파뿐 등)은 R224 가구를 그대로 둔다 */
 for(const p of r.props){if(!p)continue;if(MINE(p)){have.add(p.id);continue;}
  if(p.r224Furniture&&!p.r303Hide&&!inBoss(st,p)){p.r303Hide='r449';rested++;}}
 for(const p of st.objs){if(!have.has(p.id))r.props.push(p);/* 처음, 또는 다른 모듈이 소품 배열을 새로 만들었을 때 */
  // 나중에 붙은 문·상자·상호작용 곁이면 이 한 점만 쉰다(계획은 그대로)
  const near=live.some(([x,y,rr])=>Math.hypot(x-p.x,y-p.y)<rr);
  if(near){if(!p.r303Hide){p.r303Hide='r449x';late++;}}else if(p.r303Hide==='r449x')delete p.r303Hide;
  if(!p.r303Hide){keepPaths.push(p.path);kept++;}}
 if(late)stats.lateHidden+=late;ensure([...new Set(keepPaths)],'room furniture');return{kept,rested,late};}
function curate(r,opt={}){if(!eligible(r))return null;
 let st=done.get(r);
 if(st&&st.L===r.exploration&&!opt.force){const sig=sigOf(r);if(st.sig!==sig){try{apply(r,st);}catch(e){fail(e);}st.sig=sigOf(r);}return st.rep;}
 if(st&&st.objs?.length){const ids=new Set(st.objs.map(p=>p.id));for(let i=r.props.length-1;i>=0;i--)if(ids.has(r.props[i]?.id))r.props.splice(i,1);}/* 지도가 바뀌면 다시 계획 */
 const snap=snapshot(r);let pl=null;try{pl=plan(r,snap);}catch(e){fail(e);}
 const objs=[];if(pl)for(const rm of pl.rooms)for(const pc of rm.pieces){const p=make(pc,rm);if(p)objs.push(p);}
 st={L:r.exploration,sig:'',objs,bossRects:pl?pl.rooms.filter(q=>q.boss).map(q=>q.rect):[],planned:!!pl,rep:null};done.set(r,st);
 if(!pl){st.sig=sigOf(r);return null;}
 let res={kept:0,rested:0,late:0};try{res=apply(r,st);}catch(e){fail(e);}st.sig=sigOf(r);
 stats.regions++;for(const rm of pl.rooms){if(rm.boss){stats.skippedBoss++;continue;}stats.rooms++;if(!rm.pieces.length)stats.emptyRooms++;if(rm.why==='rhythm')stats.rhythmEmpty++;}stats.kept+=res.kept;stats.hidden+=res.rested;
 const rep={room:r.id,kind:pl.kind,kept:res.kept,rested:res.rested,late:res.late,placed:objs.length,rooms:pl.rooms.map(q=>({id:q.id,name:q.name,space:q.space,variant:q.variant,why:q.why||undefined,
  pieces:q.pieces.map(c=>c.art+'@'+c.wall+':'+c.x.toFixed(2)+','+c.y.toFixed(2)+(c.mirror?'~':''))}))};
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
function coverAlpha(p){if(!prefs.on||!prefs.fade||!p||p.r303Hide||!(+p.height>=56)||typeof project!=='function'||typeof room==='undefined'||!room||!eligible(room))return 1;
 const st=done.get(room);if(!st||!st.planned||st.L!==room.exploration)return 1;
 const s=spotOf(p),sx=+s.x,sy=+s.y,depth=sx+sy-.15;if(!fin(depth))return 1;
 if(inBoss(st,{x:sx,y:sy}))return 1;/* 배치를 맡은 방에서만 옅게 — 보스방·모이는 방(보스방 스레드 몫, 색욕 고정 배치 포함)·맘몬·사몽·꿈은 그대로 */
 // 먼저 세계 좌표로 거른다(뒤쪽·5칸 안) — 후보가 없으면 그림 크기·투영을 셈하지 않는다(매 프레임 키 큰 소품마다 도는 곳이라 할당·투영을 줄임)
 let cand=null;
 for(const e of room.enemies||[]){if(!e||!(e.hp>0)||e.visible===false||e.spawnState==='hidden')continue;const x=+e.x,y=+e.y;if(!(x+y<depth)||Math.abs(x-sx)>5||Math.abs(y-sy)>5)continue;(cand||(cand=[])).push(x,y,e.boss?2.05:1,.4);}
 for(const t of targets(room)){if(!(t.x+t.y<depth)||Math.abs(t.x-sx)>5||Math.abs(t.y-sy)>5)continue;(cand||(cand=[])).push(t.x,t.y,t.h,.5);}
 if(!cand)return 1;
 const z=typeof zoom==='number'?zoom:1,hp=+p.height*z;let row=null;try{row=typeof readyImage==='function'?readyImage(p.path):null;}catch(_){}
 const cw=row?(row.crop?.w||row.image?.naturalWidth||0):0,ch=row?(row.crop?.h||row.image?.naturalHeight||0):0,wp=ch>0?hp*cw/ch:hp*.8;
 const q=project(sx,sy),left=q.x-wp*.42,right=q.x+wp*.42,top=q.y-hp*.92,ah=typeof actorHeight==='function'?actorHeight():60;let k=1;
 for(let i=0;i<cand.length;i+=4){const e=project(cand[i],cand[i+1]);if(e.x<left||e.x>right)continue;const mid=e.y-ah*cand[i+2]*.5;if(mid>top&&mid<q.y-4&&cand[i+3]<k){k=cand[i+3];if(k<=.4)break;}}/* 몹·보스 .4, 문·제단·목표·상자 .5 */
 return k;}

// 옅어짐을 툭 바꾸지 않고 짧게 이어 준다(옅어질 때 약 .15초, 돌아올 때 약 .25초) — 몹이 경계를 오가도 깜빡이지 않게
const fadeMemo=new WeakMap(),clock=()=>{try{return performance.now();}catch(_){return Date.now();}};
function easeCover(p,k,now){now=fin(now)?now:clock();let s=fadeMemo.get(p);
 if(!s){if(!(k<1))return 1;s={a:1,t:now};fadeMemo.set(p,s);}
 const dt=Math.min(.25,Math.max(0,(now-s.t)/1000));s.t=now;
 s.a=k<s.a?Math.max(k,s.a-4*dt):Math.min(k,s.a+2.5*dt);
 if(!(k<1)&&s.a>=1){fadeMemo.delete(p);return 1;}
 return s.a;}

// ---- 그리기 감싸기 ---------------------------------------------------------------------------------
try{if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){
 if(!prefs.on||!p)return base.call(this,p,...a);
 if((p.r224Furniture||MINE(p))&&typeof room!=='undefined'&&room){let st=done.get(room);
  if(!st||st.L!==room.exploration){try{curate(room);}catch(e){fail(e);}st=done.get(room);}/* R224 가구가 처음 그려질 때(R406·R412 가 손대기 전) 바로 정리 */
  if(st&&st.planned&&p.r224Furniture&&!p.r303Hide&&!inBoss(st,p))p.r303Hide='r449';/* 계획 뒤에 새로 붙은 R224 가구도 쉰다 */
  if(p.r303Hide==='r449'||p.r303Hide==='r449x')return;
  if(MINE(p)&&p.path&&typeof readyImage==='function'&&!readyImage(p.path))ensure([p.path],'redraw');}
 let k=1;try{k=easeCover(p,coverAlpha(p));}catch(e){fail(e);}
 if(k<1){/* 엔진 조형물은 sprite, R80 그림 가구(우리 가구 포함)는 drawAssetFrame3 로 그린다 → 둘 다 그 한 번만 알파를 낮춘다(브라우저 실측: sprite 만 바꾸면 R80 가구엔 안 먹었음) */
  const sp=typeof sprite==='function'?sprite:null,df=typeof drawAssetFrame3==='function'?drawAssetFrame3:null,dim=o=>({...(o||{}),alpha:Math.min(o?.alpha??1,k)});
  stats.faded++;
  if(sp)sprite=function(path,x,y,h,o,...rest){return sp.call(this,path,x,y,h,dim(o),...rest);};
  if(df)drawAssetFrame3=function(path,frame,x,y,h,o,...rest){return df.call(this,path,frame,x,y,h,dim(o),...rest);};
  try{return base.call(this,p,...a);}finally{if(sp)sprite=sp;if(df)drawAssetFrame3=df;}}
 return base.call(this,p,...a);};}}catch(e){fail(e);}
// 처음 본 순간 계획 + 소품 수가 바뀌면 다시 적용(0.4초마다, 계획은 방마다 한 번)
(function poll(){try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading)&&eligible(room)&&room.props.some(p=>p?.r224Furniture))curate(room);}catch(e){fail(e);}setTimeout(poll,400);})();
function set(o={}){for(const k of Object.keys(prefs))if(typeof o[k]==='boolean')prefs[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PROPS_SPACE_R449__=Object.freeze({revision:REV,set,plan,curate,eligible,snapshot,spaceOf,kindOf,coverAlpha,easeCover,TEMPLATES:T,EXTRA,SPACE:SPACE.map(([k,re])=>[k,String(re)]),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},room:typeof room!=='undefined'&&room?(done.get(room)?.rep||null):null,last:lastPlan,lastError,collisionChanged:false,savesTouched:false})});
})();
