// R425 전투 연출 — 사용자 2026-11-08 "영웅들 및 보스 그리고 모든 몹 모션 자연스럽고 크기 거의 일정하게, 이펙트 타격도 알맞게 잘 들어가게 전투연출 개선",
//  "라우렌 창끝에 보라색 기운 같은 거 넣어서 창이 아니라 능력 막대기 느낌도 겸하게".
//  실측(헤드리스 23개 지역, 몹 731개체, 화면 불투명 키 ÷ 영웅 기준 키 actorHeight):
//   일반 몹 p10 1.26 · 중앙 1.39 · p90 1.65(최소 0.25 점액체 ~ 최대 3.17 '중간보스 · 복도 비명잔영'), 우두머리 중앙 1.53(0.6~2.09),
//   중간보스 1.59~2.06, 보스 1.68~2.32. 같은 몹 그림인데 개체마다 1.35~1.75 로 다르게 뽑히는 경우도 있었다(침식 근위 1·3·5).
//  ① 크기 고르게: 몹마다 '지금 그리는 시트의 대표 키'(시트 모든 칸 불투명 높이의 중앙값 × 그린 칸 높이)를 재서 등급별 띠 안으로 맞춘다.
//     일반 1.22~1.55 · 우두머리 1.45~1.75 · 중간보스·관문 챔피언 1.60~1.80 · 보스 1.90~2.30(영웅 키 배수). 띠 안이면 그대로.
//     한 칸이 아니라 시트 대표값으로 맞추므로 팔을 들거나 웅크리는 동작 폭은 그대로 남고, 대기↔공격 시트가 바뀔 때 몸이 튀는 것만 줄어든다.
//     배율은 ×0.55~×2.2 로 묶고, 발(지면 점)을 기준으로 그 몹의 그림 전체(몸·테두리·그림자·체력 막대)를 ctx 변환으로 키운다 —
//     hit-center-r259 가 getTransform 으로 재므로 적중 이펙트도 바뀐 몸 가운데에 맞는다. 시트가 바뀐 첫 프레임만 명령을 다시 고친다.
//  ② 타격감: 영웅 공격이 실제로 피해를 준 순간 그 몹이 0.12초 가로로 눌렸다 펴지고(최대 7%) 영웅 반대쪽으로 2px 밀린다(그림만).
//  ③ 라우렌 창끝 보라 기운·네온 창끝 청록 기운(09:53 "네온 창끝도 청록색 기운 … 능력 막대기 느낌 강하게", 1.3배): 몸 그림 칸의 가장 위 불투명 점(창끝, 칸마다 한 번 재어 기억)에 보라 빛·불꽃 혀·솟는 불티를 그린다.
//  맘몬 방(mammon*)·탑/인형(R193)·죽어 가는 몹은 크기를 새로 정하지 않는다. 판정·체력·피해·세이브는 바꾸지 않는다(그림만).
//  ④ 시선 3부류(X자·+자·둘 다) 이동·공격(거미류는 X자), ⑤ 이동 중 공격 때 발 딛기, ⑥ 헌터 공격 7프레임 좌·우 — 아래 설명.
//  ⑦ 체력바·이름표(광폭화 보스는 머리 위로)·적 공격 예고 표시(기본 꺼짐, 설정 창 체크) — 아래 설명.
//  ⑧ 사몽 레이저 십자가(사용자 11:49 "사몽 레이저에 닿아 소멸하는 적에게는 레이저 적중 시 플레이어 색에 맞는 십자가 이펙트가 적에게 생기고 소멸되게,
//     보스라 소멸되지 않더라도 십자가 이펙트가 생기고 데미지가 들어가도록") — 이 항목만 피해를 바꾼다(사용자 요청). 아래 설명.
//  ⑨ 이름(사용자 11:50 "실검무 츠바메가에시 네이밍을 바람베기로 수정"): 패시브 threadTsubameR64 '실검무 · 츠바메가에시' → '실검무 · 바람베기',
//     패시브 창 안내 문장의 '츠바메가에시'도 '바람베기'로(엔진 원문은 그대로 두고 덧씌움). 저장·효과는 id 로 묶여 있어 그대로.
//  ⑩ 적 공격 그림 방향(사용자 13:12·13:20): 전수조사로 영웅 반대쪽을 보고 그려진 공격 그림만 골라, 공격 중일 때 대상 쪽을 보게 좌우만 바로잡는다. 아래 설명.
//  끄기: localStorage['storyworld.r425.flow']='{"size":false}' / '{"punch":false}' / '{"laurenTip":false}' / '{"spiderX":false}' / '{"gaze":false}' / '{"gazeSlot":false}' / '{"plant":false}' / '{"hunter":false}' / '{"bossBar":false}' / '{"mobBar":false}' / '{"samongCross":false}' / '{"atkFace":false}', 예고 표시 켜기 '{"tele":true}'
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_FLOW_R425__)return;
const REV='R425-flow-8',KEY='storyworld.r425.flow';
const BANDS={normal:[1.22,1.55],leader:[1.45,1.75],mid:[1.60,1.80],boss:[1.90,2.30]},SMIN=.55,SMAX=2.2;
let prefs={face:true,size:true,punch:true,laurenTip:true,spiderX:true,gaze:true,gazeSlot:true,plant:true,hunter:true,bossBar:true,mobBar:true,tele:false,samongCross:true,atkFace:true,clean:true};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={scaled:0,kept:0,refixed:0,sheets:0,punches:0,tips:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const AH=()=>typeof actorHeight==='function'?actorHeight():54;
const FXSRC=/fx|effect|vfx|blood|pixel|glow|shadow|ring|halo|aura|mark|sigil|hexagram|telegraph|r411|r163|r292/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.__path||c?.image?.src||'');
// ---- 시트 대표 키: 같은 칸 크기로 자른 모든 칸의 불투명 높이(α>40) 중앙값 / 칸 높이, 머리 윗선(불투명 첫 줄)의 20% 분위 / 칸 높이 ----
const SHEET=new WeakMap();let scanCv=null,budget=4,budgetT=-1;
function sheetInfo(im,sr){if(!im)return null;let m=SHEET.get(im);if(!m){m=new Map();SHEET.set(im,m);}const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height;if(!W||!H)return null;
 const cw=sr?Math.round(sr[2]):W,ch=sr?Math.round(sr[3]):H,key=cw+'x'+ch;if(m.has(key))return m.get(key);if(budget<=0)return null;budget--;
 let v=null;try{const cols=Math.max(1,Math.floor(W/cw)),rows=Math.max(1,Math.floor(H/ch)),N=48;scanCv??=document.createElement('canvas');scanCv.width=N;scanCv.height=N;const g=scanCv.getContext('2d',{willReadFrequently:true});const hs=[],tops=[];
  for(let r=0;r<rows&&hs.length<48;r++)for(let c=0;c<cols&&hs.length<48;c++){g.clearRect(0,0,N,N);g.drawImage(im,c*cw,r*ch,cw,ch,0,0,N,N);const d=g.getImageData(0,0,N,N).data;let top=-1,bot=-1;
   for(let y=0;y<N;y++){let n=0;for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>40)n++;if(n>=1){if(top<0)top=y;bot=y;}}if(top>=0){hs.push((bot+1-top)/N);tops.push(top/N);}}
  hs.sort((a,b)=>a-b);tops.sort((a,b)=>a-b);if(hs.length)v={h:hs[hs.length>>1],top:tops[Math.floor((tops.length-1)*.2)]};stats.sheets++;}catch(e){fail(e);}
 m.set(key,v);return v;}
const sheetFrac=(im,sr)=>sheetInfo(im,sr)?.h??null;
// ---- 등급 ----
const major=e=>!!(e?.boss||e?.persona||e?.cosmic||e?.trial);
// 광폭화(R205: 보스 체력 30% 이하 → 그림 2배): ①의 띠에 그 배율을 곱해 광폭화 2배를 되돌리지 않는다(10:23 확인 — 고르기 전에는 2배가 ×1.18 로 줄었다).
const R205=()=>window.__STORYWORLD_BOSS_R205__;let enrOnAt=-1,enrOn=true;
function enr(e){if(!e?.r205Enraged||!(e.hp>0))return false;const t=T();if(t!==enrOnAt){enrOnAt=t;try{enrOn=R205()?.inspect?.()?.prefs?.enrage!==false;}catch(_){enrOn=true;}}return enrOn;}
function band(e){const K=enr(e)?(+R205()?.constants?.ENRAGE_SIZE||2):1,b=major(e)?BANDS.boss:(e.midboss||e.wardChampionR81===true||/^중간보스\s*·/.test(String(e.name||'')))?BANDS.mid:/우두머리/.test(String(e.name||''))?BANDS.leader:BANDS.normal;return K===1?b:[b[0]*K,b[1]*K];}
// R463(7대죄 보스 한 크기): sin-boss-art-r463 가 그 보스 그림 무리의 '보이는 키'(원본 px)와 한 점짜리 띠를 주면 시트 중앙값 대신 그것으로 맞춘다 — 대기·공격·자세가 바뀌어도 키가 튀지 않는다.
const lock463=(e,b)=>{try{return window.__STORYWORLD_SIN_BOSS_ART_R463__?.sizeLock?.(e,b,enr(e)?(+R205()?.constants?.ENRAGE_SIZE||2):1)||null;}catch(_){return null;}};
function excluded(e){try{const id=String(room?.id||'');if(/mammon/i.test(id)||e.mammon||e.mammonR||/mammon/i.test(String(e.nativeId||'')))return true;}catch(_){}return !!(e.samongDollR193||e.dollR193||e.towerR193||e.r193Doll||e.r193Tower||e.r170Tower||e.r75Tower||e.r251Circle||e.prop||e.object);}
const ST=new WeakMap();// e -> {s, nat, hitAt, kx, barOff, barAt}
function stOf(e){let s=ST.get(e);if(!s)ST.set(e,s={s:1,nat:0,hitAt:-9,kx:0});return s;}
function bodyCmd(cmds,st){let best=null,bh=0;for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!c.points)continue;if(FXSRC.test(srcOf(c)))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
function mapCmd(c,f){if(Array.isArray(c.points))c.points=c.points.map(p=>Array.isArray(p)?f(p):p);if(Array.isArray(c.paths))for(const pa of c.paths)if(Array.isArray(pa?.points))pa.points=pa.points.map(p=>Array.isArray(p)?f(p):p);}
function rescale(cmds,st,fx,fy,k){for(let i=st;i<cmds.length;i++){const c=cmds[i];if(!c||c.owner?.kind!=='enemy')continue;mapCmd(c,p=>[fx+(p[0]-fx)*k,fy+(p[1]-fy)*k]);}}
function punchK(s){const a=T()-s.hitAt;if(!prefs.punch||a<0||a>.12)return 0;return Math.sin(Math.PI*a/.12)*.07;}
// ---- ⑦ 체력바·이름표·예고 표시(같은 drawEnemy 안에서 그려진 것) ----
//  · ①은 몸만 키우고 줄인다: 체력바(R51 원래 막대 → R90 2px)는 배율을 되돌려 늘 같은 폭·같은 자리(발 아래), 글자(이름표)는 자리는 몸을 따라가되 글자 크기는 그대로.
//  · 광폭화한 보스(사용자 10:23 "보스 광폭화 시 크기 커지면서 체력바가 가운데 나오는 문제 개선"): 실측 — 2배 몸(발록·붉은 하이힐의 서윤·타락천사 기사)의 발치 막대가
//    다리·옷자락 사이(몸 아래쪽 가운데)에 겹쳐 보였다. → 체력바를 그 시트의 머리 윗선(모든 칸 불투명 첫 줄의 20% 분위) 8px 위로 올리고 이름표를 바로 그 위에 둔다.
//    광폭화 순간 발치에서 0.1초 남짓 미끄러져 올라간다. 화면 맨 위(56px)보다 위로는 안 올린다.
//  · 예고 표시(사용자 10:16 "적이 영웅을 공격하기 전, 돌진하기 전 나오는 직사각형 예고 표시, 검은색 선 등 예고 표시도 끌 수 있도록 — 기본 상태는 끄게"):
//    원래 R40/R41 읽기 쉬운 공격 신호(머리 위 '근접 공격 준비'·'원거리 조준' 상자와 테두리, 검은 조준선·점선, 표적 고리·눈금, 몸의 검은 방향 화살표)와
//    엔진 e.tell 표적 표식(target-mark), R116 돌진 표적 인장을 기본으로 지운다. 켜면 ①의 배율을 되돌려 조준선·표적 고리가 실제 표적을 가리키게 둔다.
//    장판(위험 지대) 예고·적 스킬 원화 연출(R98·FINAL42)은 그대로(R98 범위 선은 원래 기본 꺼짐 — 아래 설정이 함께 켜고 끈다). 판정·피해·시점은 그대로.
const TELE_WORLD=new Set(['rgba(12,10,12,.92)','rgba(16,12,14,.92)','#e2b17d','rgba(211,193,151,.72)'/* R440: R52 돌진 길 */]),TELE_BODY=new Set(['rgba(12,10,12,.95)','#e2c18b','#bd8065','#b89a71']),TELE_TEXT=new Set(['원거리 조준','근접 공격 준비']);
function teleKind(c){if(!c||c.owner?.kind==='enemy')return null;const y=c.style||{};
 if(c.kind==='stroke'){const k=y.strokeStyle;if(TELE_WORLD.has(k))return 'world';if(k==='#d79b70')return c.paths?.length===1&&c.paths[0]?.points?.length===2?'world':'body';return TELE_BODY.has(k)?'body':null;}
 if(c.kind==='fill'&&y.fillStyle==='rgba(14,13,15,.92)')return 'body';if(c.kind==='fill'&&y.fillStyle==='rgba(186,165,119,.075)')return 'world';/* R440: R52 돌진 길 속 */if(c.kind==='text'&&TELE_TEXT.has(c.text))return 'body';return null;}
function bboxOf(c){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,n=0;const add=p=>{if(Array.isArray(p)){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);n++;}};
 if(Array.isArray(c.points))c.points.forEach(add);if(Array.isArray(c.paths))for(const pa of c.paths)if(Array.isArray(pa?.points))pa.points.forEach(add);return n?[x0,y0,x1,y1]:null;}
function isBar(c,e,fx,fy,SX,SY){if(c.kind!=='fill'||c.owner?.kind!=='enemy'||!Array.isArray(c.paths)||c.paths.length!==1||typeof c.style?.fillStyle!=='string')return false;const P=c.paths[0]?.points;if(!Array.isArray(P)||P.length<4||P.length>5)return false;
 const b=bboxOf(c);if(!b)return false;const S=Math.max(1,SY),X=Math.max(1,SX),lift=Math.max(0,+e.visualLiftPx||0);return b[3]-b[1]<=6.5*S&&b[0]>=fx-75*X&&b[2]<=fx+75*X&&b[1]>=fy-(lift+12)*S&&b[1]<=fy+26*S;}
function unFont(c,X,Y){if(Array.isArray(c.matrix)&&(Math.abs(X-1)>.001||Math.abs(Y-1)>.001)){const m=c.matrix.slice();m[0]/=X;m[1]/=X;m[2]/=Y;m[3]/=Y;c.matrix=m;}}
function post(e,C,st,fx,fy,SXe,SYe,SXs,SYs,teleOff,headBar,s){
 const scaledE=Math.abs(SXe-1)>.001||Math.abs(SYe-1)>.001,scaledS=Math.abs(SXs-1)>.001||Math.abs(SYs-1)>.001;if(!scaledE&&!scaledS&&!teleOff&&!headBar)return;
 const bars=[];let w=st;
 for(let i=st;i<C.length;i++){const c=C[i];let keep=true;const tk=teleKind(c);
  if(tk){if(teleOff){keep=false;stats.teleHidden=(stats.teleHidden||0)+1;}else if(scaledS){if(c.kind==='text')unFont(c,SXs,SYs);else if(tk==='world')mapCmd(c,p=>[fx+(p[0]-fx)/SXs,fy+(p[1]-fy)/SYs]);else{const b=bboxOf(c);if(b){const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;mapCmd(c,p=>[cx+(p[0]-cx)/SXs,cy+(p[1]-cy)/SYs]);}}}}
  else if(teleOff&&c?.kind==='image'&&/target-mark/.test(srcOf(c))&&!(typeof target!=='undefined'&&e?.id===target)){keep=false;stats.teleHidden=(stats.teleHidden||0)+1;}
  else if(c?.kind==='text')unFont(c,SXs,SYs);
  else if(c&&isBar(c,e,fx,fy,SXe,SYe))bars.push(c);
  if(keep)C[w++]=c;}
 C.length=w;
 if(scaledE)for(const c of bars)mapCmd(c,p=>[fx+(p[0]-fx)/SXe,fy+(p[1]-fy)/SYe]);
 if(headBar&&bars.length){const b=bodyCmd(C,st);if(!b)return;const inf=sheetInfo(b.image,b.sourceRect),P=b.points,top=Math.min(P[0][1],P[1][1]),bot=Math.max(P[2][1],P[3][1]),head=top+(bot-top)*(inf?.top??.06);
  let y0=1e9,y1=-1e9;for(const c of bars){const bb=bboxOf(c);if(bb){y0=Math.min(y0,bb[1]);y1=Math.max(y1,bb[3]);}}if(!(y1>=y0))return;
  const want=Math.max(56,head-8-(y1-y0)),now=T();if(s.barOff==null||now-(s.barAt??-9)>1)s.barOff=y0-fy;s.barOff+=(want-fy-s.barOff)*Math.min(1,Math.max(0,now-(s.barAt??now))*9||.25);s.barAt=now;
  const dy=fy+s.barOff-y0;for(const c of bars)mapCmd(c,p=>[p[0],p[1]+dy]);const ny=fy+s.barOff-5;
  for(let i=st;i<C.length;i++){const c=C[i];if(c?.kind==='text'&&c.text===e.name&&Array.isArray(c.point))c.point=[c.point[0],ny];}stats.headBars=(stats.headBars||0)+1;}}
// R596(사용자 2026-11-10 "아래 이런 예고선이 아직도 나오는 문제"): 일반 몹 체력 줄(R90 '절제된 체력 표시' — 발밑에 2px 검붉은 가로 선)이 바닥 예고선처럼 읽혔다
//  → 광폭화 보스에만 쓰던 머리 위 체력 줄을 일반 몹·중간 보스에도 쓴다(큰 보스의 평소 줄·탑·인형·맘몬은 그대로). 끄기 '{"mobBar":false}'.
function wantHeadBar(e,ex){if(ex||!(e?.hp>0))return false;if(e.boss)return !!prefs.bossBar&&enr(e);return !!prefs.mobBar||!!prefs.bossBar&&enr(e);}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
 const rec=typeof ctx==='object'?ctx:null,cmds=Array.isArray(rec?.commands)?rec.commands:null;
 if(!e||!cmds||typeof project!=='function'){stats.skipped++;return base.apply(this,[e,...a]);}
 const ex=excluded(e),doSize=prefs.size&&!ex&&typeof rec.save==='function',teleOff=!prefs.tele,headBar=wantHeadBar(e,ex);
 const t=T();if(t!==budgetT){budgetT=t;budget=4;}
 const s=stOf(e),q=project(e.x,e.y),fx=q.x,fy=q.y,st0=cmds.length;let r,sx=1,sy=1,k=1;
 if(doSize){const pk=punchK(s),kx=pk>0?s.kx*pk/.07:0;sx=sy=s.s;/* R532: 맞는 순간 가로로 늘고 세로로 눌리던 것(종이 느낌)을 빼고 밀림(kx)만 */rec.save();try{rec.translate(fx+kx,fy);rec.scale(sx,sy);rec.translate(-fx,-fy);r=base.apply(this,[e,...a]);}finally{rec.restore();}}
 else{stats.skipped++;r=base.apply(this,[e,...a]);}
 if(cmds.length===st0)return r;
 try{if(e.hp>0){const bb=bodyCmd(cmds,st0);if(bb)s.art=artKey(bb);}}catch(err){fail(err);}
 try{if(doSize&&e.hp>0){const b=bodyCmd(cmds,st0);if(b){const L463=lock463(e,b),fr=L463?L463.frac:sheetFrac(b.image,b.sourceRect);if(fr){const box=Math.abs(b.points[3][1]-b.points[0][1]),nat=box*fr/Math.max(.01,sy),H=AH(),[lo,hi]=L463?L463.band:band(e);
   let want=Math.min(hi*H,Math.max(lo*H,nat));let ns=Math.min(SMAX,Math.max(SMIN,want/Math.max(1,nat)));
   if(Math.abs(ns-s.s)>.01){k=ns/s.s;rescale(cmds,st0,fx,fy,k);stats.refixed++;s.s=ns;}
   s.nat=nat;if(Math.abs(s.s-1)>.01)stats.scaled++;else stats.kept++;}}}}catch(err){fail(err);}
 try{if(prefs.atkFace&&e.hp>0)faceFix(e,cmds,st0,fx);}catch(err){fail(err);}
 try{post(e,cmds,st0,fx,fy,sx*k,sy*k,sx,sy,teleOff,headBar,s);}catch(err){fail(err);}
 try{if(XD.has(e)){const b=bodyCmd(cmds,st0);if(b)s.box=boxOf(b);}}catch(err){fail(err);}
 return r;};}
// R440(사용자 2026-11-09 "이런 아래에 빨간 예비표시 안생기도록 이거랑 하얀실선직사각형 돌진예비표시도"):
//  · 엔진 적 시전·장판·원거리의 바닥 예고 그림(drawNativeGroundArt154 를 'warning'·'flight' 단계로 부름 — 시전 그림을 발사 길·장판 모양으로 눕혀 옅게 깐 불꽃빛 띠·원)을
//    예고 표시를 끄면 그리지 않는다. 터지는 순간('active')·잔흔('recovery')·맞은 자리('confirmed-contact')는 그대로. 판정·피해·시간은 그대로.
//  · 엔진 R52 돌진 길(하얀 실선 직사각형 + 화살촉, 선 rgba(211,193,151,.72)·속 rgba(186,165,119,.075))은 위 teleKind 'world' 로 같이 지운다.
if(typeof drawNativeGroundArt154==='function'){const base=drawNativeGroundArt154;drawNativeGroundArt154=function(path,rect,g,alpha,stage,...a){try{if(!prefs.tele&&solo()&&(stage==='warning'||stage==='flight')){stats.groundTeleHidden=(stats.groundTeleHidden||0)+1;return false;}}catch(_){}return base.apply(this,[path,rect,g,alpha,stage,...a]);};}
// R116 돌진 표적 인장(fx 'sigil' + VFX.mark) — 예고 표시를 끄면 그리지 않는다
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(fe,...a){try{if(!prefs.tele&&fe?.type==='sigil'&&typeof VFX!=='undefined'&&VFX?.mark&&fe.asset===VFX.mark&&(+fe.size||1)>1.02){stats.teleHidden=(stats.teleHidden||0)+1;return;}}catch(_){}return base.apply(this,[fe,...a]);};}
// ---- 타격감: 영웅 쪽 공격이 실제로 피해를 준 순간 ----
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,amount,source,...a){const old=e?.hp;const r=base.apply(this,[e,amount,source,...a]);
 try{if(prefs.punch&&e&&old>e.hp&&!(source&&source.friendly===false)&&typeof project==='function'&&typeof player==='object'&&player){const s=stOf(e);if(T()-s.hitAt>.09){s.hitAt=T();const a=project(player.x,player.y),b=project(e.x,e.y);s.kx=Math.sign(b.x-a.x||1)*2;stats.punches++;}}}catch(err){fail(err);}return r;};}
// ---- 라우렌 창끝 보라 기운 ----
const TIP=new WeakMap();
function tipOf(im,sr){if(!im||!sr)return null;{const t=T();if(t!==budgetT){budgetT=t;budget=4;}}let m=TIP.get(im);if(!m){m=new Map();TIP.set(im,m);}const k=sr.map(Math.round).join(',');if(m.has(k))return m.get(k);if(budget<=0)return null;budget--;
 let v=null;try{const N=96,cw=sr[2],ch=sr[3],sc=N/Math.max(cw,ch),w=Math.max(1,Math.round(cw*sc)),h=Math.max(1,Math.round(ch*sc));scanCv??=document.createElement('canvas');scanCv.width=w;scanCv.height=h;const g=scanCv.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,w,h);g.drawImage(im,sr[0],sr[1],cw,ch,0,0,w,h);const d=g.getImageData(0,0,w,h).data;
  outer:for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>60){v=[(x+.5)/w,(y+.5)/h];break outer;}}catch(e){fail(e);}m.set(k,v);return v;}
const TIPS={lauren:{F:{a:[120,50,200],b:[214,170,255]},k:1},neon:{F:{a:[24,168,154],b:[184,255,240]},k:1.3,needR437:true}};/* R437: 네온은 칸마다 창끝 좌표가 있는 새 좌·우 공격 칸에서만(민트 #18A89A~#B8FFF0) */// 네온 창끝 기운은 창이 낮게 들린 칸에서 머리에 붙어 뺐다(R425 리뷰) — 칸마다 창끝 좌표가 생기면 다시 넣는다
function laurenTip(rec,st,TP){const LP=TP.F,KK=TP.k;const S=window.__STORYWORLD_FX_SPRITES_R106__;if(!S?.draw)return;let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;if(FXSRC.test(srcOf(c)))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return;const im=best.image,sr=best.sourceRect||[0,0,im?.naturalWidth||im?.width||1,im?.naturalHeight||im?.height||1],t437=window.__STORYWORLD_NEON_LAUREN_R437__?.tipFor?.(best.sourcePath,sr)||null,tp=t437||(TP.needR437?null:tipOf(im,sr));if(!tp)return;/* R437: 새 공격 칸은 칸마다 잰 창끝 */
 const P=best.points,x=P[0][0]+(P[1][0]-P[0][0])*tp[0]+(P[3][0]-P[0][0])*tp[1],y=P[0][1]+(P[1][1]-P[0][1])*tp[0]+(P[3][1]-P[0][1])*tp[1],h=AH()*KK,t=T(),pul=.85+.15*Math.sin(t*6.3),lo=!!(typeof settings==='object'&&settings?.lowFx);
 const run=()=>{S.draw('glow',LP,x,y,h*.42*pul,h*.42*pul,{alpha:.55,overHero:true});S.draw('glow',S.pal?S.pal(LP.b):LP,x,y,h*.16,h*.16,{alpha:.75,overHero:true});
  S.draw('flame',LP,x,y+h*.05,h*.2,h*.34*pul,{frame:Math.floor(t*14),alpha:.5,overHero:true});
  if(!lo)for(let i=0;i<4;i++){const ph=(t*.9+i*.25)%1;S.draw('spark',LP,x+Math.sin(i*2.1+t*3)*h*.05,y-h*.25*ph,h*.14,h*.035,{angle:-Math.PI/2,alpha:Math.sin(Math.PI*ph)*.8,overHero:true});}};
 try{if(typeof rec.scope==='function')rec.scope({id:'r425:spear-tip',kind:'effect',x:player.x,y:player.y,groundAligned:false},()=>{rec.save();try{run();}finally{rec.restore();}});else run();stats.tips++;}catch(e){fail(e);}}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{const TP=TIPS[player?.hero];if(prefs.laurenTip&&TP&&st>=0&&player.hp>0&&player.visible!==false)laurenTip(rec,st,TP);}catch(e){fail(e);}return r;};}
// ---- ④ 시선 3부류 이동·공격(사용자 10:06 "이미지의 시선 방향에 따라 x자 이동 및 공격 / +자 이동 공격 / x+ 둘 다 이동 공격 3부류로 나와서
//  모든 움직이는 자산들의 이동 및 공격 방향성에 맞게"; 09:54·09:55 거미 X자 이동·공격) ----
//  몹 몸 그림(시트·아틀라스 칸)을 사람 눈으로 보고 나눈 표 assets/r425/gaze.json(헤드리스로 지역마다 실제로 그려지는 몸 그림을 모은 대조표를 보고 분류):
//   x    = 몸·머리가 비스듬히(3/4) 보는 그림(거미·네발짐승·비스듬히 선 인형) → 바닥 칸 모서리 4방향 = 화면 2:1 대각선(약 27°, 아이소 바닥 줄눈 방향) X자
//   plus = 옆모습(시선 가로)이나 정면·뒷모습(시선 세로) 그림 → 화면 가로·세로 4방향 +자
//   both = 구체·점액·떠 있는 영체처럼 시선이 뚜렷하지 않거나 두 쪽 다 자연스러운 그림 → 8방향
//  표에 없는 그림은 같은 몹의 다른 동작 시트(-move·-idle·-attack 등) 부류 → 그 몹이 앞서 알아본 부류 → both 순. 거미류(이름·원본 id)는 표와 상관없이 x.
//  방향은 칸(세계) 각도로 계산한다: x = 0·90·180·270°, plus = 45·135·225·315°(칸 대각선이 화면 가로·세로). 두 부류 모두 칸 기준 90° 간격이라
//   아이소 화면 어느 쪽으로 가도 같은 비율로 지그재그한다(화면 45°로 잡아 보니 가로로 갈 때만 목표 쪽 진행이 45%로 떨어졌다).
//  걷기 한 틱(초당 6칸 이하, 돌진·블링크·밀려남·환영 이동 제외)을 허용 방향 중 하나로 바꿔 옮긴다.
//  목표 방향이 허용 방향과 16°(8방향은 8°) 안이면 그 방향, 두 허용 방향 사이면 한 방향을 0.35초 이상 걷고 목표 선을 넘으면 다른 방향으로 — X·+ 모양 지그재그.
//   평균 진행 방향은 엔진 경로 그대로. 지그재그는 목표 쪽 진행이 줄어드니(4방향 최대 29%) 두 다리를 같은 비율로 늘려 도착 시간을 엔진과 맞춘다(최대 ×1.35).
//  벽에 막히면(30% 미만 이동) 다른 쪽 → 그래도 막히면 엔진 이동 그대로.
//  공격 자리: 영웅 3.2칸 안으로 다가오는 중이면 영웅에서 뻗은 가장 가까운 허용 방향 줄 위, 지금 거리(공격 거리 0.8배·0.55~1.4칸보다 가까우면 그 거리) 점으로 향해
//   먼저 줄에 올라선 뒤 줄을 따라 다가온다 → 마지막 접근·공격 방향이 허용 방향(줄은 한 번 고르면 반 칸 넘게 돌아가야 바꿈).
//   CPU 시뮬레이션(출발 1.6~3.1칸·36방위·정지 0.85/1.15칸, 부류마다 216경우): 마지막 방위 오차 중앙 1.5~1.8°·최대 10°, 도착 늦어짐 중앙 0.15~0.27초·최대 0.55초.
//  공격 시작 자리: x 부류가 X자 줄에서 22.5° 넘게 벗어난 자리에서 근접 공격을 시작하면(R53 canPrepare) R230 의 가로 옆자리 블링크 대신
//   가장 가까운 X자 자리(R230 과 같은 거리·어둠 수축·2.4초 간격)로 옮긴다. 막히면 R230 원래대로. +·둘 다 부류는 R230 그대로(가로 옆자리도 허용 방향).
//  멈춰 서서 칠 때 미끄러지지 않게 걷는 중 자리 맞춤은 걷는 동안만(거미만 09:55 요청대로 멈춘 자리에서 X자 자리로 천천히 기어감).
//  영웅은 키·클릭 입력대로 움직이므로 바꾸지 않는다. 판정·체력·피해·경로 목표는 그대로(그 틱의 걸음 방향과 지그재그 보정 길이만).
const SPIDER=/거미|spider|arachn/i;const isSpider=e=>!!e&&!major(e)&&(SPIDER.test(String(e.name||''))||SPIDER.test(String(e.nativeId||''))||SPIDER.test(String(e.path||'')));
const famOf=k=>/#/.test(k)?null:String(k).replace(/\.(webp|png|jpe?g)$/i,'').replace(/[-_](idle|move|walk|run|attack|atk|hit|hurt|death|die|cast|poses?|motion)(?:[-_]?\d+)?$/i,'');
let GZ=null,FAM=null,gzReq=false,gzNext=0,gzTries=0;const backoff=()=>{gzNext=T()+Math.min(30,2**gzTries++);};function gzLoad(){if(GZ||gzReq||typeof fetch!=='function'||T()<gzNext||gzTries>6)return;gzReq=true;fetch('assets/r425/gaze.json').then(r=>r.ok?r.json():null).then(j=>{if(!j?.classes){gzReq=false;backoff();return;}
 const F={};for(const [k,v] of Object.entries(j.classes)){const f=famOf(k);if(f&&(!F[f]||/[-_]move/i.test(k)))F[f]=v;}FAM=F;GZ=j;}).catch(e=>{gzReq=false;backoff();fail(e);});}
function artKey(c){let s=srcOf(c).replace(/^[a-z]+:\/\/[^/]+/i,'').replace(/[?#].*$/,'');const i=s.indexOf('assets/');s=i>=0?s.slice(i+7):s.replace(/^\.?\//,'');s=s.replace(/^r425\/clean\/assets\//,'');if(/monsters|atlas/i.test(s)&&Array.isArray(c.sourceRect))s+='#'+c.sourceRect.map(v=>Math.round(v)).join(',');return s;}
const CLS=new Set(['x','plus','both']);
function gazeOf(e){if(isSpider(e))return 'x';const s=ST.get(e),a=s?.art;if(!a||!GZ)return s?.gz||'both';
 let v=GZ.classes[a];if(!CLS.has(v)){const f=famOf(a);v=f&&FAM?.[f];}if(CLS.has(v)){if(s)s.gz=v;return v;}return s?.gz||'both';}/* 지금 그리는 그림 → 같은 몹 다른 동작 시트(-move/-idle/-attack) → 이 몹이 마지막으로 알아본 부류 → both */
const ALLOW=Object.freeze({x:[0,90,180,270],plus:[45,135,225,315],both:[0,45,90,135,180,225,270,315]}),DEG=Math.PI/180,DWELL=.35,SLOT_IN=0,COMP=1.35;
const angD=(a,b)=>{const d=Math.abs((((a-b)%360)+360)%360);return d>180?360-d:d;};
const wAng=(dx,dy)=>(((Math.atan2(dy,dx)/DEG)%360)+360)%360;/* 칸 각도 */
const wDir=a=>[Math.cos(a*DEG),Math.sin(a*DEG)];
const scrAng=(dx,dy)=>{const sx=dx-dy,sy=(dx+dy)*.5;return (((Math.atan2(sy,sx)/DEG)%360)+360)%360;};/* 화면 각도(보고용) */
const latOf=(a,dx,dy)=>Math.cos(a*DEG)*dy-Math.sin(a*DEG)*dx;/* 목표 선 옆 거리(+면 반시계 쪽) */
const GS=new WeakMap();
function bracket(cls,ang){const A=ALLOW[cls];let a1=A[0],d1=999,a2=A[1],d2=999;for(const a of A){const d=angD(ang,a);if(d<d1){a2=a1;d2=d1;a1=a;d1=d;}else if(d<d2){a2=a;d2=d;}}return [a1,d1,a2];}
function pick(g,cls,ang,t){const [a1,d1,a2]=bracket(cls,ang),step=360/ALLOW[cls].length;
 if(g.want==null||angD(ang,g.want)>50)g.lat=0;g.want=ang;
 if(d1<=step*.18){if(g.cur!==a1){g.cur=a1;g.since=t;}g.lat=0;return a1;}
 if(g.cur===a1||g.cur===a2){const sc=Math.sin((g.cur-ang)*DEG);if(t-g.since<DWELL||!((g.lat||0)*sc>0))return g.cur;}
 const s1=Math.sin((a1-ang)*DEG);const c=Math.abs(g.lat||0)<1e-6?a1:((g.lat>0)===(s1<0)?a1:a2);if(c!==g.cur){g.cur=c;g.since=t;}return c;}
function radius(e){return e.combatProfile?.bodyBlock?.r||(Number.isFinite(e.radius)?e.radius:.27);}
function steer(e,x0,y0,dt,t){const dx=e.x-x0,dy=e.y-y0,d=Math.hypot(dx,dy);if(!(d>1e-4)||d>.25||d/Math.max(.004,+dt||1/60)>6)return false;
 let g=GS.get(e);if(!g)GS.set(e,g={cur:null,since:-9,lat:0,want:null,slotB:null,slotC:null});const cls=gazeOf(e),eng=wAng(dx,dy),step=360/ALLOW[cls].length;let ang=eng;
 const p=typeof player==='object'?player:null;
 if(p&&prefs.gazeSlot){const ox=x0-p.x,oy=y0-p.y,od=Math.hypot(ox,oy);if(od<3.2&&od>.35&&(dx*-ox+dy*-oy)>0){/* 다가오는 중 */
   const rng=Math.max(.55,Math.min(1.4,(+e.combatProfile?.attackShape?.range||+e.combatProfile?.range||+e.attackRange||1)*.8)),mb=wAng(ox,oy);
   let ba=g.slotB;if(ba==null||g.slotC!==cls||angD(mb,ba)>step*.62){[ba]=bracket(cls,mb);g.slotB=ba;g.slotC=cls;}
   const [wx,wy]=wDir(ba),sd=Math.max(Math.min(rng,.55),od-SLOT_IN),gx=p.x+wx*sd-x0,gy=p.y+wy*sd-y0;
   const cl=typeof clearLine==='function'?clearLine:null,sx=x0+gx,sy=y0+gy;if(Math.hypot(gx,gy)>.08&&(!cl||(cl({x:x0,y:y0},p)&&cl({x:x0,y:y0},{x:sx,y:sy})))){ang=wAng(gx,gy);stats.gazeSlots=(stats.gazeSlots||0)+1;}}else g.slotB=null;}
 const c=pick(g,cls,ang,t);if(angD(c,eng)<2){g.lat+=latOf(ang,dx,dy);stats.gazeKept=(stats.gazeKept||0)+1;return true;}
 const [a1,d1,a2]=bracket(cls,ang),d2=angD(ang,a2),L=d*(d1<=step*.18?1:Math.min(COMP,(Math.sin(d1*DEG)+Math.sin(d2*DEG))/Math.max(.2,Math.sin((d1+d2)*DEG))));
 const r=radius(e),ex=e.x,ey=e.y,go=a=>{const [wx,wy]=wDir(a);e.x=x0;e.y=y0;moveActor(e,wx*L,wy*L,r);return Math.hypot(e.x-x0,e.y-y0);};
 let moved=go(c);if(moved<L*.3){const alt=c===a1?a2:a1;moved=go(alt);if(moved<L*.3){e.x=ex;e.y=ey;g.cur=null;stats.gazeBlocked=(stats.gazeBlocked||0)+1;return false;}g.cur=alt;g.since=t;}
 g.lat+=latOf(ang,e.x-x0,e.y-y0);faceStep(e,e.x-x0,e.y-y0);stats.gazeSteps=(stats.gazeSteps||0)+1;stats['gaze_'+cls]=(stats['gaze_'+cls]||0)+1;return true;}
// R441(사용자 2026-11-09 거미가 왼쪽 아래를 보고 오른쪽 아래로 감): 지그재그 다리는 엔진이 정한 평균 방향과 좌우가 다를 수 있다 →
//  실제 걸음이 화면 좌·우로 뚜렷하면(엔진 facing 이 left/right) 그 쪽을 보게 한다. 위·아래(front/back)는 엔진 그대로. 끄기 '{"face":false}'.
function faceStep(e,dx,dy){if(!prefs.face||typeof facing!=='function')return;const f=facing(dx,dy);if(f==='left'||f==='right'){if(e.direction!==f)stats.faceFixed=(stats.faceFixed||0)+1;e.direction=f;}}
function spiderSlot(e,dt){/* 09:55 "거미 공격도 x자로": 영웅 곁에 멈춰 칠 때 영웅 기준 X자 자리로 천천히 기어가 X자 방향에서 문다 */
 const p=typeof player==='object'?player:null,ox=p&&e.x-p.x,oy=p&&e.y-p.y,od=p?Math.hypot(ox,oy):9;if(!p||od>2.6||od<.2||!(p.hp>0)||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading)||e.attack||e.rangedWindup>0||e.rest>0||(e.spawnState&&e.spawnState!=='active'))return;
 const [ba]=bracket('x',wAng(ox,oy)),[wx,wy]=wDir(ba),gx=p.x+wx*od-e.x,gy=p.y+wy*od-e.y,g=Math.hypot(gx,gy);
 if(g>.04){const k=Math.min(1,1.6*Math.max(0,+dt||0)/g);moveActor(e,gx*k,gy*k,radius(e));stats.spiderAtk=(stats.spiderAtk||0)+1;}}
// 공격 시작 자리(x 부류): R230 이 위·아래에서 치려는 몹을 가로 옆자리로 옮기던 것을 X자 자리로 — 같은 거리·같은 어둠 수축·같은 2.4초 간격
const X_TOL=22.5;
function wantX(e){const p=typeof player==='object'?player:null;if(!p||!prefs.gaze||!prefs.gazeSlot||!solo()||!e||!(e.hp>0)||gazeOf(e)!=='x')return false;
 if(e.boss||e.midboss||e.persona||e.stationary||e.r170Tower||e.turret||e.spawnState==='hidden'||major(e)||excluded(e))return false;
 if(e.r230At!=null&&T()-e.r230At<2.4)return false;const ox=e.x-p.x,oy=e.y-p.y;return Math.hypot(ox,oy)<=3.2&&bracket('x',wAng(ox,oy))[1]>X_TOL;}
function freeAt(x,y){try{if(typeof blocked==='function'&&blocked(x,y,.3,room))return false;if(typeof clearLine==='function'&&!clearLine({x,y},player))return false;return true;}catch(_){return false;}}
function puffAt(x,y,delay){try{const P=window.__STORYWORLD_PIXELFX_R163__;if(P?.has?.('pvfx-void-implosion'))P.play('pvfx-void-implosion',x,y,{k:.55,delay:delay||0,tint:{a:[40,10,30],b:[150,90,170]}});}catch(_){}}
function flankX(e){const p=player,[a1,,a2]=bracket('x',wAng(e.x-p.x,e.y-p.y)),range=Number(e.combatProfile?.attackShape?.range)||1.4,r=Math.max(.8,range*.75);
 for(const b of [a1,a2]){const [wx,wy]=wDir(b),tx=p.x+wx*r,ty=p.y+wy*r;if(Math.hypot(tx-e.x,ty-e.y)>3.2||!freeAt(tx,ty))continue;
  puffAt(e.x,e.y,0);e.x=tx;e.y=ty;e.nav=[];e.moving=false;puffAt(tx,ty,.06);if(typeof facing==='function')e.direction=facing(p.x-e.x,p.y-e.y);
  e.r230At=T();const g=GS.get(e);if(g){g.cur=null;g.lat=0;g.slotB=b;g.slotC='x';}stats.flankX=(stats.flankX||0)+1;return true;}
 stats.flankXBlocked=(stats.flankXBlocked||0)+1;return false;}
let r53Tries=0;
function wrapR53(){const M=window.__STORYWORLD_HOSPITAL_MOTION_R53__;if(!M||typeof M.canPrepare!=='function')return false;if(M.__r425)return true;
 if(window.__STORYWORLD_MOB_FLANK_R230__&&!M.__r230)return false;/* R230 이 먼저 감싼 뒤 그 바깥에 선다 */
 window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({...M,__r425:true,canPrepare(e,kind,...a){let hold=false,pre;
  try{hold=kind==='melee'&&!e?.attack&&wantX(e);if(hold){pre=e.r230At;e.r230At=T();}}catch(err){hold=false;fail(err);}/* R230 가로 블링크를 이번만 쉬게 */
  let ok;try{ok=M.canPrepare.call(this,e,kind,...a);}finally{if(hold)e.r230At=pre;}
  try{if(hold&&ok!==false&&!e?.attack&&!flankX(e))window.__STORYWORLD_MOB_FLANK_R230__?.flank?.(e);}catch(err){fail(err);}
  return ok;}});return true;}
(function arm(){try{if(wrapR53())return;}catch(err){fail(err);}if(++r53Tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
if(typeof tick==='function'&&typeof moveActor==='function'){const base=tick;tick=function(dt,...a){let pre=null;
 try{if((prefs.gaze||prefs.spiderX)&&typeof room==='object'&&Array.isArray(room?.enemies)&&solo()){gzLoad();pre=[];for(const e of room.enemies)if(e&&e.hp>0&&e.visible!==false&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState)&&!e.frozenR380&&!excluded(e))pre.push([e,e.x,e.y]);}}catch(err){fail(err);}
 const r=base.apply(this,[dt,...a]);
 try{if(pre){const t=T();for(const [e,x0,y0] of pre){if(!(e.hp>0))continue;const spider=isSpider(e);
   if(Math.hypot(e.x-x0,e.y-y0)<=1e-4){if(spider&&prefs.spiderX)spiderSlot(e,dt);continue;}
   if(prefs.gaze||(spider&&prefs.spiderX))steer(e,x0,y0,dt,t);}}}catch(err){fail(err);}
 return r;};}
// ---- ⑤ 이동 중 공격: 미끄러짐 대신 발을 딛고 친다(사용자 09:57 "이동 중에 공격한다면 이동 모션 나가고 방향 맞게 공격 모션으로 전환했을 때 공격이 그 방향으로
//  나가도록 — 지금은 공격 모션으로 이동하는 게 있어서 그냥 미끄러져서 이동하는 느낌, 특히 영웅들"). 실측: 환도(R271)·슬레이어(R351)는 이동 중에도
//  휘두르기 0.35초를 공격 칸으로 그려 그동안 몸이 미끄러졌다. → 영웅 기본 공격이 새로 나간 순간부터 근접 0.24초·원거리 0.16초 동안
//  걷기 이동(한 틱 0.3칸 미만, 돌진·블링크 제외)을 멈춰 그 자리에서 공격 칸이 나오게 한다. 공격 방향은 엔진이 겨눈 적 방향 그대로, 그 뒤 다시 걷기 모션.
const RANGED=new Set(['seoha','michaela','hunter','gunner','lauren','neon']);let plantUntil=-9,prevAtk=0;
if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const p=typeof player==='object'?player:null,x0=p?.x,y0=p?.y,a0=+p?.attackAnim||0;const r=base.apply(this,[dt,...a]);
 try{if(plantUntil-T()>.3)plantUntil=-9;if(prefs.plant&&p&&p.hp>0){const a1=+p.attackAnim||0;if(a1>a0+1e-6&&a1>prevAtk+1e-6){plantUntil=T()+(p.hero==='hunter'?.12:RANGED.has(p.hero)?.08:.1);stats.plants=(stats.plants||0)+1;}prevAtk=a1;
   const d=Math.hypot(p.x-x0,p.y-y0);if(T()<plantUntil&&d>1e-5&&d<.3&&!(p.dashAnim>0)&&!(p.blinkAnim>0)){p.x=x0;p.y=y0;stats.planted=(stats.planted||0)+1;}}}catch(err){fail(err);}return r;};}
// ---- ⑥ 헌터 공격 7프레임 좌·우(사용자 09:58 드라이브 hunter_attack7_lr_v001 — "헌터는 항상 공격 시 방향에 맞게 이거 사용") ----
//  assets/r425/hunter/attack-{l,r}.webp(scripts/r425-hunter-attack.py, 우 = 좌 정확 반전 원화). 적이 화면 왼쪽이면 l, 오른쪽이면 r(가로 차이가 작으면 마지막 쪽).
//  화살은 엔진이 누르는 순간 쏘므로 R351 과 같이 '놓기'(5번째 칸) 90ms 전부터 재생하고 다음 발사 전에 끝나도록 빠르게 돌린다. 키 = 서 있기 키(칸 몸 201px 기준), 발 = 시트 발 기준점.
let HUNT=null,huntReq=false;const huntSwing={t0:-9,side:'r',prev:0,scale:1};
let huNext=0,huTries=0;function huntIndex(){if(HUNT||huntReq||typeof fetch!=='function'||T()<huNext||huTries>6)return;huntReq=true;fetch('assets/r425/hunter/index.json').then(r=>r.ok?r.json():null).then(j=>{if(j?.anims)HUNT=j;else{huntReq=false;huNext=T()+Math.min(30,2**huTries++);}}).catch(e=>{huntReq=false;huNext=T()+Math.min(30,2**huTries++);fail(e);});}
function huntImg(f){try{const row=typeof readyImage==='function'?readyImage('assets/r425/hunter/'+f):null;if(row?.image)return row.image;if(typeof ensureImages==='function')Promise.resolve(ensureImages(['assets/r425/hunter/'+f])).catch(()=>{});}catch(_){}return null;}
function huntSide(){try{const q=project(player.x,player.y);let best=null,bd=9;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);if(Math.abs(b.x-q.x)>2)return b.x<q.x?'l':'r';}}catch(_){}const d=player?.direction;return d==='left'?'l':d==='right'?'r':huntSwing.side;}
function hunter(rec,st){huntIndex();if(!HUNT)return;const a=+player.attackAnim||0,t=T(),busy=player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard||player.hurtAnim>0;
 if(a>huntSwing.prev+1e-6){huntSwing.t0=t;huntSwing.side=huntSide();const ms=HUNT.ms,pre=ms.slice(0,HUNT.release).reduce((x,y)=>x+y,0),off=Math.max(0,pre-90),rest=ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.39);huntSwing.off=off;huntSwing.scale=Math.max(.3,Math.min(1,cd*.95*1000/rest));}
 huntSwing.prev=a;const mv=Math.hypot(player.x-(huntSwing.px??player.x),player.y-(huntSwing.py??player.y));huntSwing.px=player.x;huntSwing.py=player.y;if(mv>1e-3){huntSwing.movedAt=t;}if(busy||t-(huntSwing.movedAt??-9)<.08)return;/* 걷는 중엔 걷기 그림(미끄러짐 방지) */const ms=HUNT.ms,tot=ms.reduce((x,y)=>x+y,0),el=(t-huntSwing.t0)*1000/huntSwing.scale+(huntSwing.off||0);if(!(el<tot))return;
 let fr=0,acc=el;for(let i=0;i<ms.length;i++){if(acc<ms[i]){fr=i;break;}acc-=ms[i];fr=i;}
 const A=HUNT.anims[huntSwing.side],im=A&&huntImg(A.file);if(!im)return;let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;if(FXSRC.test(srcOf(c)))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}if(!best)return;
 const want=AH()*((window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98),k=want/(A.body||201),q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want*.65),fx=q.x,fy=q.y-lift,[ax,ay]=A.anchor,[cw,ch]=HUNT.cell,col=fr%HUNT.cols,row=Math.floor(fr/HUNT.cols);
 const X=v=>fx+(v-ax)*k,Y=v=>fy+(v-ay)*k,before=best.image;
 Object.assign(best,{image:im,sourcePath:'assets/r425/hunter/'+A.file,immutableTint:null,sourceRect:[col*cw,row*ch,cw,ch],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],r425Hunter:fr});
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before)rec.commands.splice(i,1);}
 stats.hunterFrames=(stats.hunterFrames||0)+1;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(prefs.hunter&&st>=0&&player?.hero==='hunter'&&player.hp>0&&solo())hunter(rec,st);else huntSwing.prev=+player?.attackAnim||0;}catch(e){fail(e);}return r;};}
// ---- ⑧ 사몽 레이저 십자가 -------------------------------------------------------------------------------------
//  · 판정은 엔진 그대로: R75 사몽 폭풍 선(0.12초마다 2줄)·R114 추가 선이 몹에 닿는 순간(선 나이 0.18초, R160 이 영웅 색 레이저를 밝히는 순간) hitEnemy 를 부른다.
//    그 부름(kind hero-samong-storm-r75 / -r114)을 가장 바깥에서 받아 그 몹 몸 가운데에 영웅 색(R102 팔레트 — R160 레이저와 같은 색) 정십자가를 세운다.
//  · 0.18초 뒤 십자가가 번쩍이는 순간: 일반 몹은 소멸(남은 체력 이상 피해 — R114 '사몽선 즉사'와 같은 규칙), 보스급(보스·중간보스·페르소나·관문 챔피언…)은
//    공격력 × 0.55 피해(같은 적 0.6초에 한 번). 예전 선 피해(R75 공격력×0.055 — R139 가 막음, R114 즉사·보스 ×0.055)는 이 길 하나로 바뀐다.
//    R139 궁극기 파동(9칸 즉사·보스 ×2.4)은 그대로 — 다만 십자가가 선 일반 몹은 파동이 먼저 지우지 않고 십자가가 지운다.
//  · 십자가: fx-sprites 'cross'(위 짧고 아래 긴 정십자가, 교차점 피벗) 바깥 영웅 색 + 안쪽 밝은 심 + 뒤 번짐, 번쩍일 때 교차점 반짝임(돌리지 않음).
//    0.09초에 1.28배→1배로 박히고, 번쩍인 뒤 0.44초 동안 위로 조금 떠오르며 사라진다. 회전·뒤집기 없음. 혼자 할 때만(협동은 예전 그대로).
//    뭉친 몹은 십자가가 겹치면 가로대가 둘인 것처럼 보여서, 겹치는 자리에는 앞선 십자가 하나만 세우고 나머지 몹은 같은 색 번짐만 둔다(보스급은 늘 제 십자가).
//  · 그림은 코드로 조립한 임시본이다 — Dots 프레임 시트(십자가 낙인)가 오면 바꾼다.
const LASER=new Set(['hero-samong-storm-r75','hero-samong-storm-r114']),SC=Object.freeze({hold:.18,life:.62,cool:.6,bossK:.55,cap:48,capLow:20});
const bigFoe=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.wardChampionR81||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
const liveFoe=e=>!!(e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&room?.enemies?.includes(e));
const FXS=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s?.on?.()?s:null;};
const SILVER=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([244,248,255])});
const heroPal=h=>window.__STORYWORLD_HERO_FX_R102__?.PALETTE?.[h]||SILVER;
const lowFxX=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const smoothX=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
const crosses=[],XL=new WeakMap(),XD=new WeakMap(),XLAST=new WeakMap();let xSerial=0;// XL: e → 아직 번쩍이지 않은 십자가, XD: e → 그려지는 십자가(그동안 몸 상자를 잰다)
function boxOf(b){const P=b.points;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of P){if(!Array.isArray(p))continue;x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
 const cellH=y1-y0,info=sheetInfo(b.image,b.sourceRect),top=y0+cellH*(info?.top??.12),h=cellH*(info?.h??.8);return {cx:(x0+x1)/2,cy:top+h/2,h:Math.max(8,h),t:T()};}
function crossBox(c){const e=c.e,s=ST.get(e),b=s?.box;if(b&&T()-b.t<.25&&b.t>=c.t0-.25&&(e.hp>0||!c.box))c.box={...b};if(c.box)return c.box;
 const q=typeof project==='function'?project(e.x,e.y):null;if(!q)return null;const h=Math.max(20,(s?.nat||AH()*1.35)*(s?.s||1));return {cx:q.x,cy:q.y-h*.5,h,t:T()};}
const SENTX={type:'r425-samong-cross',x:0,y:0,age:0,life:Infinity,r425Sentinel:true};
function armX(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENTX)){SENTX.age=0;effects.push(SENTX);}}catch(_){}}
function disarmX(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENTX);if(i>=0)effects.splice(i,1);}}catch(_){}}
function markCross(e,src){if(!liveFoe(e))return false;if(XL.has(e))return true;const t=T(),last=XLAST.get(e);if(last!=null&&t-last<SC.cool&&t>=last)return true;
 if(typeof damageable3==='function'&&!damageable3(e))return false;if(e.boss&&!room?.engaged)return false;
 const hero=String(src?.hero||player?.hero||''),c={id:++xSerial,e,t0:t,hero,F:heroPal(hero),big:bigFoe(e),room,done:false,draw:crosses.length<(lowFxX()?SC.capLow:SC.cap),box:null};
 crosses.push(c);XL.set(e,c);XD.set(e,c);XLAST.set(e,t);stats.xMarks=(stats.xMarks||0)+1;armX();return true;}
function strikeCross(c){const e=c.e;if(XL.get(e)===c)XL.delete(e);if(!liveFoe(e)||!solo()||typeof hitEnemy!=='function'){stats.xMissed=(stats.xMissed||0)+1;return;}
 const old=e.hp,big=bigFoe(e),value=big?(typeof attackPower==='function'?attackPower():1)*SC.bossK:e.hp+Math.max(1,Number(e.maxHp)||0);if(!(value>0))return;let ok=false;
 try{ok=hitEnemy(e,value,{kind:'hero-samong-cross-r425',friendly:true,owner:'hero',ability:'samong',hero:c.hero,eventId:'r425-cross:'+c.id+':'+e.id,r425Cross:true});}catch(err){fail(err);}
 if(ok!==false&&old>e.hp){c.dealt=old-e.hp;if(big){stats.xBoss=(stats.xBoss||0)+1;stats.xBossDamage=(stats.xBossDamage||0)+c.dealt;if(!e.boss)try{if(typeof floatText==='function')floatText(Math.round(c.dealt),e.x,e.y);}catch(_){}}else if(!(e.hp>0))stats.xKills=(stats.xKills||0)+1;}}
function crossTick(){if(!crosses.length)return;const t=T();
 for(let i=crosses.length-1;i>=0;i--){const c=crosses[i];if(c.room!==room||t-c.t0>SC.life+.05||t<c.t0-1){if(XL.get(c.e)===c)XL.delete(c.e);if(XD.get(c.e)===c)XD.delete(c.e);crosses.splice(i,1);continue;}if(!c.done&&t-c.t0>=SC.hold){c.done=true;strikeCross(c);}}
 if(crosses.length)armX();else disarmX();}
// 크기·때: 몸 키만큼(영웅 키 0.9~3.2배), 0.09초에 1.28배→1배로 박힌 뒤 번쩍(0.18초), 0.44초 동안 위로 조금 떠오르며 사라진다.
function xGeom(c){const b=crossBox(c);if(!b)return null;const a=T()-c.t0,A=SC.life,hold=SC.hold;if(a<0||a>A)return null;
 const inK=smoothX(a/.09),out=a<hold?1:1-smoothX((a-hold)/(A-hold)),al=inK*out;if(!(al>.01))return null;
 const H=Math.min(AH()*3.2,Math.max(AH()*.9,b.h)),W=H*256/384,rise=a>hold?H*.1*smoothX((a-hold)/(A-hold)):0;
 return {c,b,al,H,W,sc:1.28-.28*inK,rise,py:b.cy-H*.1615-rise,fl:a>=hold-.02&&a<hold+.16?1-smoothX(Math.abs(a-hold-.03)/.13):0,lead:true};}
function drawCrossOne(S,g){const {c,b,al,H,W,sc,rise,py,fl}=g,lo=lowFxX();
 /* 영웅 주색(F.a — 라우렌 바이올렛·네온 민트·슬레이어 크림슨…)이 주인공: 바깥·번짐은 주색, 심은 주색을 밝힌 색, 번쩍임만 보조색(대개 실버) */
 const F=c.F,lift=(v,k)=>v.map(x=>Math.round(x+(255-x)*k)),M=S.pal?.(F.a)||F,P=S.pal?.(lift(F.a,.5))||F,Q=S.pal?.(F.b)||F;
 if(!g.lead){/* 뭉친 몹: 십자가가 겹치면 가로대 둘(이중 십자)처럼 보이므로 앞선 십자가 하나만 세우고 나머지는 같은 색 번짐만 */
  S.draw('glow',M,b.cx,b.cy-rise,H*.7,H*.7,{alpha:(.28+.45*fl)*al,blend:'screen'});stats.xMerged=(stats.xMerged||0)+1;return;}
 if(!lo)S.draw('glow',M,b.cx,b.cy-rise,H*.95,H*.95,{alpha:(.32+.4*fl)*al,blend:'screen'});
 S.draw('cross',M,b.cx,py,W*sc,H*sc,{alpha:.88*al,blend:'screen'});
 if(!lo)S.draw('cross',P,b.cx,py,W*.6*sc,H*.6*sc,{alpha:(.45+.45*fl)*al,blend:'screen'});
 if(fl>.01)S.draw('flare',Q,b.cx,py,H*.8*(.6+.4*fl),H*.8*(.6+.4*fl),{alpha:fl*al,blend:'screen',overHero:true});
 stats.xDraws=(stats.xDraws||0)+1;}
function drawCrosses(){const S=FXS();if(!S||typeof ctx==='undefined'||!ctx)return;const G=[];
 for(const c of crosses){if(!c.draw)continue;const g=xGeom(c);if(g)G.push(g);}
 // 겹침 정리: 보스급 먼저, 먼저 선 것, 큰 것, 앞(화면 아래)의 것이 십자가를 갖는다
 G.sort((p,q)=>(q.c.big-p.c.big)||(p.c.t0-q.c.t0)||(q.H-p.H)||(q.b.cy-p.b.cy));const kept=[];
 for(const g of G){g.lead=g.c.big||!kept.some(k=>Math.abs(k.b.cx-g.b.cx)<Math.max(k.W,g.W)*.55&&Math.abs(k.py-g.py)<Math.max(k.H,g.H)*.6);if(g.lead)kept.push(g);}
 for(const g of G){const e=g.c.e;ctx.save();try{const run=()=>drawCrossOne(S,g);if(typeof ctx.scope==='function')ctx.scope({id:'r425:xcross:'+g.c.id,kind:'effect',x:e.x+.06,y:e.y+.06,r425:true},run);else run();}catch(err){fail(err);}finally{ctx.restore();}}}
if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,amount,source,...a){
 try{const k=source?.kind;if(prefs.samongCross&&solo()&&e){if(LASER.has(k))return markCross(e,source);if(k==='hero-samong-ultimate-r139'&&XL.has(e)&&!bigFoe(e)){stats.xPulseYield=(stats.xPulseYield||0)+1;return false;}}}catch(err){fail(err);}
 return base.apply(this,[e,amount,source,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{crossTick();}catch(err){fail(err);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(fe,...a){if(fe===SENTX){try{if(prefs.samongCross)drawCrosses();}catch(err){fail(err);}return;}return base.apply(this,[fe,...a]);};}
try{FXS()?.warm?.(heroPal(player?.hero),['cross','glow']);}catch(_){}
// ---- ⑨ 이름: 실검무 · 츠바메가에시 → 실검무 · 바람베기 ----
function renameDefs(){try{const D=window.__STORYWORLD_PROGRESSION_R62__?.defs;if(!Array.isArray(D))return false;const d=D.find(x=>x?.id==='threadTsubameR64');
 if(d&&typeof d.name==='string'&&d.name.indexOf('츠바메가에시')>=0){d.name=d.name.replace(/츠바메가에시/g,'바람베기');stats.renamed=(stats.renamed||0)+1;}return !!d;}catch(e){fail(e);return false;}}
renameDefs();
// ---- ⑩ 적 공격 그림 방향(사용자 13:12 "병원 몹들 의사 빼고 왜 다 뒤를 보고 공격함 — 모든 적들 공격 이미지 방향 제대로 나오게",
//  13:20 "비정상적인 것만 검토 후 수정하면 됨, 근데 검토를 전수조사 수준으로") ----
//  전수조사: 모든 지역의 모든 적(보스·중간보스 포함)을 영웅 화면 왼쪽/오른쪽에 두고 대기·근접 준비·타격·회복·원거리 조준 때 실제 그려진 몸 그림을
//   모아(헤드리스) 한 장씩 눈으로 판정했다. 영웅 반대쪽을 보고 그려진 공격 그림만 아래 표에 원본이 보는 쪽(L = 원본이 왼쪽, R = 오른쪽)을 적는다.
//   정면·좌우 대칭 그림, 이미 맞게 그려진 그림은 적지 않는다(그대로).
//  공격 중(근접 e.attack · 원거리 조준 · 준비된 시전)에 표의 그림이 그려지면: 원하는 쪽 = 공격 각도의 화면 좌우(없으면 영웅 쪽),
//   그려진 쪽 = 원본 쪽 ⊕ 좌우 뒤집힘. 둘이 다를 때만 그 몸 그림(같은 그림·같은 칸을 쓴 겹 포함)을 발 세로선 기준으로 좌우 반전한다.
//  판정·피해·위치·시간은 그대로(그림만). 끄기: '{"atkFace":false}'.
//  병원(ep1a08) R53 동작 아틀라스(백의 구속자·복도 비명잔영·백의 안정화 감독)의 뒷모습 줄: R53 은 공격 방향이 화면에서 조금만 위(-0.04)여도
//   뒷모습 칸을 골라, 같은 높이에 선 영웅을 칠 때도 등을 돌리고 공격했다. 공격 방향(없으면 영웅 쪽)이 화면에서 뚜렷이 위(30° 넘게)일 때만
//   뒷모습을 두고, 그 밖엔 같은 동작의 앞모습 칸으로 바꿔 그린다(발 기준점·배율·좌우·기울기 그대로, 아틀라스 칸 정보 R51·R52·R53 그대로 씀).
//  표 열쇠는 정리본 주소(r99·r118·r425 clean)와 색 입힘 경로 차이를 없앤 원래 경로(faceKey). 이 아틀라스들은 공격·투척 때만 그려지므로 공격 중 확인 없이 고친다.
const ATK_FACE=Object.freeze({'generated-story10-cycle-20261005/ep1a10/mb-ep1a10-pride-ruin-core-atlas.png':'L','generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp':'L','r104/bosses/b07-boss-p1.webp':'L','r104/bosses/mb-dist05-p2.webp':'L','r104/bosses/u201-mid-p1.webp':'L','r375/mobs/kair-44.webp':'L','r375/mobs/kair-45.webp':'L','r380/mobs/legacy-m134-nightmare-v4.webp':'L','r410/mobs/m027.webp':'L','r92/mobs/M007-attack.png':'L','r92/mobs/M051-attack.png':'L','r92/mobs/M055-attack.png':'L','r92/mobs/M057-attack.png':'L','r92/mobs/M058-attack.png':'L','r92/mobs/M060-attack.png':'L','r92/mobs/M063-attack.png':'L','r92/mobs/M064-attack.png':'L','r92/mobs/M068-attack.png':'L','r92/mobs/M095-attack.png':'L','r92/mobs/M099-attack.png':'L','visual-test/hospital-orderly-motion-r51-v2.png':'R','r74/monsters.png':'R','r92/mobs/M017-attack.png':'R','r92/mobs/M020-attack.png':'R','r92/mobs/M032-attack.png':'R','r92/mobs/M033-attack.png':'R','r92/mobs/M037-attack.png':'R','r92/mobs/M047-attack.png':'R','r92/mobs/M052-attack.png':'R','r92/mobs/M066-attack.png':'R','r92/mobs/M086-attack.png':'R','r92/mobs/M087-attack.png':'R','r92/mobs/M089-attack.png':'R','r92/mobs/M090-attack.png':'R','r92/mobs/M107-attack.png':'R','r92/mobs/M113-attack.png':'R','r92/mobs/M117-attack.png':'R','r92/mobs/M121-attack.png':'R','r92/mobs/M122-attack.png':'R','r92/mobs/M130-attack.png':'R','r92/mobs/M132-attack.png':'R'});
const BACK53=Object.freeze({'visual-test/hospital-orderly-motion-r51-v2.png':{meta:'__STORYWORLD_ORDERLY_ATLAS_R51__',map:{4:0,5:1,6:2,7:3}},
 'visual-test/hospital-boss-motion-r53.png':{meta:'__STORYWORLD_BOSS_ATLAS_R53__',map:{4:0,5:1,6:2,7:3,12:8,13:9,14:10,15:11}},
 'visual-test/hospital-ranged-back-r53.png':{meta:'__STORYWORLD_RANGED_BACK_ATLAS_R53__',to:'assets/visual-test/hospital-ranged-motion-r52.png',toMeta:'__STORYWORLD_RANGED_ATLAS_R52__',map:'same'}});
const ATK_ONLY=new Set(['visual-test/hospital-orderly-motion-r51-v2.png','visual-test/hospital-boss-motion-r53.png','visual-test/hospital-ranged-back-r53.png','visual-test/hospital-ranged-motion-r52.png']);
function faceKey(c){let s=artKey(c);for(let t=s;;s=t){t=s.replace(/^r(?:99|118|425)\/clean\/assets\//,'');if(t===s)break;}return s;}
function faceOf(c){const k=faceKey(c);return ATK_FACE[k]||ATK_FACE[k.replace(/#.*$/,'')]||null;}
function atkBusy(e){return !!((e.attack&&Number.isFinite(e.attack.elapsed))||e.rangedWindup>0||e.storyPreparedCast150||e.personaPreparedCast150);}
function atkVec(e){const a=e.attack;let g=null;if(a&&Number.isFinite(a.angle))g=a.angle;else if(e.rangedWindup>0&&Number.isFinite(e.rangedAim))g=e.rangedAim;
 const p0=project(e.x,e.y);let p1;if(g!=null)p1=project(e.x+Math.cos(g),e.y+Math.sin(g));else{const p=typeof player==='object'?player:null;if(!p)return null;p1=project(p.x,p.y);}
 const vx=p1.x-p0.x,vy=p1.y-p0.y,n=Math.hypot(vx,vy);return n>1e-6?{x:vx/n,y:vy/n}:null;}
function atkLeft(e){const a=e.attack;let sd=null;if(a&&Number.isFinite(a.angle))sd=Math.cos(a.angle)-Math.sin(a.angle);else if(e.rangedWindup>0&&Number.isFinite(e.rangedAim))sd=Math.cos(e.rangedAim)-Math.sin(e.rangedAim);
 if(sd==null||Math.abs(sd)<.05){const r444=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof r444==='boolean')return r444;const p=typeof player==='object'?player:null;if(!p)return null;sd=(p.x-p.y)-(e.x-e.y);if(Math.abs(sd)<.02)return null;}return sd<0;}
function sameArt(c,b){return c?.kind==='image'&&c.owner?.kind==='enemy'&&Array.isArray(c.points)&&(c===b||(c.image&&c.image===b.image&&String(c.sourceRect||'')===String(b.sourceRect||'')));}
function swapCell(c,A,B,img){const P=c.points,W=A.sourceRect[2],H=A.sourceRect[3],ex=[(P[1][0]-P[0][0])/W,(P[1][1]-P[0][1])/W],ey=[(P[3][0]-P[0][0])/H,(P[3][1]-P[0][1])/H];
 const F=[P[0][0]+A.pivot[0]*ex[0]+A.pivot[1]*ey[0],P[0][1]+A.pivot[0]*ex[1]+A.pivot[1]*ey[1]],at=(u,v)=>[F[0]+(u-B.pivot[0])*ex[0]+(v-B.pivot[1])*ey[0],F[1]+(u-B.pivot[0])*ex[1]+(v-B.pivot[1])*ey[1]];
 const W2=B.sourceRect[2],H2=B.sourceRect[3];c.points=[at(0,0),at(W2,0),at(W2,H2),at(0,H2)];c.sourceRect=B.sourceRect.slice();
 if(img){c.image=img;c.sourcePath=String(img.src||'');c.imageSize=[img.naturalWidth||img.width,img.naturalHeight||img.height];}}
function unback(e,cmds,st){let b=null,bh=0,R=null;for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!Array.isArray(c.points)||!Array.isArray(c.sourceRect))continue;const r=BACK53[faceKey(c).replace(/#.*$/,'')];if(!r)continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;b=c;R=r;}}
 if(!b)return;const M=window[R.meta];if(!Array.isArray(M?.cells))return;const sr=b.sourceRect.map(v=>Math.round(v)).join(','),i=M.cells.findIndex(c=>c.sourceRect.join(',')===sr);if(i<0)return;
 const j=R.map==='same'?i:R.map[i];if(j==null)return;const v=atkVec(e);if(!v||v.y<-.5)return;// 영웅·공격이 뚜렷이 위쪽이면 뒷모습 그대로
 const TM=R.toMeta?window[R.toMeta]:M,A=M.cells[i],B=TM?.cells?.[j];if(!A||!B)return;let img=null;
 if(R.to){if(b.immutableTint||b.mutable)return;img=typeof readyImage==='function'?readyImage(R.to)?.image:null;if(!img||(TM.size&&(img.naturalWidth!==TM.size[0]||img.naturalHeight!==TM.size[1])))return;}
 const hit=[];for(let q=st;q<cmds.length;q++)if(sameArt(cmds[q],b))hit.push(cmds[q]);for(const c of hit)swapCell(c,A,B,img);stats.unback=(stats.unback||0)+1;}
function faceFix(e,cmds,st,fx){try{unback(e,cmds,st);}catch(err){fail(err);}
 const busy=atkBusy(e);let b=null,bh=0,f=null;// 표에 있는 그림 가운데 가장 큰 것 = 몸(경로에 ring·mark 같은 낱말이 든 몸 그림도 놓치지 않게 일반 효과 거르기를 쓰지 않는다)
 for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!Array.isArray(c.points))continue;const g=faceOf(c);if(!g)continue;if(!busy&&!ATK_ONLY.has(faceKey(c).replace(/#.*$/,'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;b=c;f=g;}}
 if(!b)return;const want=atkLeft(e);if(want==null)return;
 const mir=b.points[1][0]<b.points[0][0],left=(f==='L')!==mir;if(left===want){stats.faceOk=(stats.faceOk||0)+1;return;}
 const hit=[];for(let i=st;i<cmds.length;i++)if(sameArt(cmds[i],b))hit.push(cmds[i]);for(const c of hit)mapCmd(c,p=>[2*fx-p[0],p[1]]);
 stats.faceFixed=(stats.faceFixed||0)+1;}
// ---- ⑪ 배경처리 정리본(사용자 14:01 "전수조사하는 김에 배경처리 등 디테일 퀄리티업도 함께") ----
//  전수조사 대조표에서 눈으로 고른 몹 그림만: 타락천사 기사(대기·이동·방어)에 남은 베이지 구름 배경을 지우고, 몸에서 떨어진 점·조각을 지운 사본
//  assets/r425/clean/<원래 경로>(scripts/r425-mob-clean.py, 목록·해시 r96/r425-mob-clean.json). 원본은 그대로, 이미지 주소만 돌린다(R99·R118 과 같은 방식, 캐시 키는 원래 경로).
const CLEAN425=new Set(["assets/generated-v31224/actors-normalized/363f780dbb5a_Monster_FallenAngelKnight_Base.webp", "assets/generated-v31224/actors-normalized/353a813314bc_Monster_FallenAngelKnight_MoveSide.webp", "assets/generated-v31224/actors-normalized/9756e6d5958a_Monster_FallenAngelKnight_Guard.webp", "assets/generated-v31224/actors-normalized/692e4ae01c29_bulmyeongwi_idle.webp", "assets/generated-v31224/actors-normalized/80f5ab6bab50_balrog-idle.webp", "assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp"]);
if(typeof urlFor==='function'){const ub=urlFor;urlFor=function(path,...a){try{const p=typeof cleanPath==='function'?cleanPath(path):path;if(prefs.clean!==false&&CLEAN425.has(p)){stats.cleanRedirects=(stats.cleanRedirects||0)+1;return ub.call(this,'assets/r425/clean/'+p,...a);}}catch(err){fail(err);}return ub.call(this,path,...a);};}
// ---- 설정 창(빠른 설정 '설정' 패널, R420 보기 편의 묶음 끝): 적 공격·돌진 예고 표시 — 기본 꺼짐. R98 '적 공격 범위 미리보기(선)'도 같이 켜고 끈다 ----
function teleSet(v){set('tele',!!v);try{window.__STORYWORLD_VFX_R98__?.set?.({telegraph:!!v});}catch(_){}try{window.__STORYWORLD_COMBAT_R170__?.set?.({quietTells:!v});}catch(_){}return prefs.tele;}
function injectTele(n){try{const panel=document.getElementById('panel');if(!panel)return false;if(panel.querySelector('#r425Tele'))return true;
 const host=panel.querySelector('#accessR420')||(n>=3?panel.querySelector('#quickSettingsR114'):null);if(!host)return false;
 const lab=document.createElement('label');lab.className='r420-row';lab.id='r425TeleRow';lab.innerHTML='<input type="checkbox" id="r425Tele"'+(prefs.tele?' checked':'')+'> 적 공격·돌진 예고 표시(머리 위 상자·검은 조준선·표적 고리·바닥 예고 띠·돌진 길, 기본 꺼짐)';
 host.appendChild(lab);lab.querySelector('input').onchange=ev=>teleSet(!!ev.target.checked);stats.teleUi=(stats.teleUi||0)+1;return true;}catch(e){fail(e);return true;}}
if(typeof openPanel==='function'){const opBase=openPanel;openPanel=function(html,...a){try{if(typeof html==='string'&&html.indexOf('츠바메가에시')>=0){renameDefs();html=html.replace(/츠바메가에시/g,'바람베기');stats.renamedHtml=(stats.renamedHtml||0)+1;}}catch(e){fail(e);}const res=opBase.call(this,html,...a);try{if(typeof html==='string'&&/설정/.test(html)){let n=0;const go=()=>{if(!injectTele(n)&&++n<24)requestAnimationFrame(go);};requestAnimationFrame(go);}}catch(e){fail(e);}return res;};}
function set(k,v){prefs[k]=v!==false;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return prefs[k];}
window.__STORYWORLD_COMBAT_FLOW_R425__=Object.freeze({revision:REV,BANDS,set,teleSet,gazeOf,samongCross:Object.freeze({config:SC,live:()=>crosses.map(c=>({id:c.id,enemy:c.e?.id,big:c.big,age:+(T()-c.t0).toFixed(3),done:c.done,dealt:c.dealt||0,box:c.box?{cx:Math.round(c.box.cx),cy:Math.round(c.box.cy),h:Math.round(c.box.h)}:null}))}),artOf:e=>ST.get(e)?.art??null,gazeTable:()=>GZ,ALLOW,screenAngle:scrAng,scaleOf:e=>ST.get(e)?.s??1,naturalOf:e=>ST.get(e)?.nat??null,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();
