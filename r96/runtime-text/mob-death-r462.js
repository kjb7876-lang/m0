// R462 — 사망 모션 없는 몹의 죽음 연출(사용자 2026-11-09 "사망모션 없는 몹들은 다른걸로 대체해서 적용하지말고 불타면서 소멸하거나
//  피터지면서 소멸하고 시체나 사체남기도록").
//  · 일반 몹(보스·중간보스·페르소나 제외)은 자기 사망 모션 그림이 없다. 엔진 죽음 불꽃(spawnBurnDeath3)은 몸 그림으로 profile.frames.death 를 쓰는데,
//    이 그림이 다른 몹 그림일 때가 있다(R188·R375·R380 이 일부만 고침). → 몸은 '살아 있을 때 마지막으로 화면에 그려진 그 몹의 그림'만 쓴다.
//  · 몹 성격으로 두 갈래:
//    불(악마·망령·해골·기계·마법·가면·천사 등 살이 없는 것): 몸이 빨갛게 달아오르며 검게 타 들어가고 그 자리에 쓰러진 뒤
//      드라이브 core24 '화염벽' 시트(R411, 적 쪽 그림)가 몸 위로 타오른다 → 숯이 된 사체가 남는다(불씨 몇 초).
//    피(짐승·벌레·좀비·사람 등 살이 있는 것): 몸이 하얗게 번쩍·떨리다 쓰러지며 '시체 폭발' 시트(R411, 적 쪽)로 피와 뼛조각이 터진다
//      → 피 웅덩이(R190 CC0 피 시트 한 칸) 위에 핏빛 시체가 남는다.
//  · 쓰러짐은 그 몹 자기 그림으로만 만든다(다른 몹 그림을 빌리지 않음). R532 부터 눕히기 대신 찢김 조각(아래).
//  · 시체는 바닥 층(제단 그리기 바로 뒤, 몸·영웅보다 아래)에 그린다. 한 방 최대 24구(저사양 10), 45초(저사양 15초) 뒤 4초에 걸쳐 사라진다. 지역을 옮기면 비운다.
//  · 3D 그리기에서는 사체마다 바닥 자리를 주인으로 달아(줄 열쇠 'r462:corpse:…') R451 국지 조명이 바닥과 같은 빛을 곱한다(R462-2).
//  · 판정·보상·처치 수·저장·AI 는 그대로(그림만). 보스·중간보스는 원래 연출 그대로.
//  · 끄기: localStorage['storyworld.r462.mobDeath']='{"on":false}' 뒤 새로고침. 시체만 끄기 {"corpses":false}. 사체 굽기만 끄기(R690) {"bake":false}.
//  R532(사용자 2026-11-10 02:52Z "몹들이 죽을때 종이처럼 눕혀서 죽는게 별로야 … 죽을때 찢기거나 터져서 죽는 느낌으로 그리고 죽을때 나오는 실루엣이미지도 본체이미지랑 일관성있도록"):
//  · 몸 그림 한 장을 통째로 기울이고 납작하게 눌러 '눕히던' 것(종이처럼 보임)을 없앴다. 대신 그 몹 자기 그림을 들쭉날쭉한 조각(가로 3~4 × 세로 3, 저사양 2×3)으로
//    찢어(clip 다각형) 피는 터져 흩어지고(포물선 → 바닥에 떨어져 미끄러지다 멈춤), 불은 붉게 달아오르며 금(빛나는 균열)이 간 뒤 그 자리에 부서져 내려앉는다.
//    조각은 돌며 포물선으로 날아 바닥에 떨어진다(깊이 띠 안 서로 다른 자리). 불은 금이 벌어진 틈으로 달아오른 몸(같은 그림)이 비친다.
//  · 사체 = 같은 그림·같은 좌우·같은 키의 조각들이 멈춘 자리 그대로(죽는 장면 끝 모습과 이어짐). 색은 검은 실루엣이 아니라 본체 색에 가깝게(피 밝기 .82, 불 .58).
//  · 조각 모양·움직임은 몹 id 로 정해진다(같은 몹은 늘 같은 모양). 판정·보상·AI 는 그대로(그림만).
//  · 원래 '눕히기'는 설정 '몹 죽음 연출 → 쓰러져 눕기'(prefs.style='lay')로 남겨 둠(연령 등급 대비, 사용자 2026-11-10 07:26Z).
//  R660(사용자 2026-11-10 14:16Z "광장에서 … 렉이심함", 14:18Z "몹죽을때 생기는버그쪽이 렉의심됨") — 렉 고침, 모양은 그대로:
//  · sprite(…,{filter}) 는 엔진 색 보정 캐시(spriteTintCache3, 32칸)에서 '그림|필터' 마다 시트 전체 캔버스를 새로 만들고 Three.js 가 새 텍스처로 올린다.
//    죽는 동안 밝기 값이 매 프레임 바뀌어 광장에서 게임 1초에 55장(3,900만 화소)을 새로 만들었다(헤드리스 프레임 426ms ↔ 연출 끔 154ms).
//  · 3D 기록기(ctx.scope)에서는 필터를 ctx.filter 로 건다(기록기가 셰이더 행렬로 처리, 캔버스·업로드 없음). 2D 캔버스용으로 죽는 동안의
//    색 변화는 0.12초 단위로 끊어(몹 하나당 필터 열쇠 10개 안) 같은 열쇠를 다시 쓴다. 검사 qa/r660/death-lag-cpu-check.cjs.
//  R690(사용자 2026-11-11 00:59Z "몹들죽을때 이미지여러개 겹치고왔다갔다혼란스럽게하면서 렉", 01:00Z "무한생존모드에서도 체크") — 모양은 그대로:
//  · 겹침: 같은 죽음을 R91(다른 몹 '가족' 공용 잔해 그림·공용 파편 시트)·R165(연기)가 따로 또 그렸다 → owns(e) 를 내보내
//    R462 가 맡는 몹이면 그 둘은 건너뛴다(보스·R462 가 못 맡은 몹은 그대로).
//  · 렉: 사체 조각을 몸 그림 한 장에서 clip 으로 잘라(사체 하나 9~12번) 매 프레임 그려 3D 기록기가 삼각형을 다시 자르고 지오메트리를 새로 만들었다
//    (무한 생존 8마리씩 동시 처치: 헤드리스 프레임 중앙값 259ms ↔ 사체 끔 181ms). → 조각이 멈춘 사체 모습을 사체마다 캔버스 한 장에 한 번 굽고
//    (정적 그림 표시 __storyworldStaticSource — 매 프레임 복사·업로드 없음) 이후엔 clip 없는 그림 한 장으로 그린다. 검사 qa/r690/r690-cpu-check.cjs.
//  R691(Codex #420 P2, 사용자 03:46Z "동시에 많은 사망 효과가 남을 때 렉"): 조각 모음이 공유 캐시(48칸)에만 있어 죽는 중인 몹이 48마리를 넘으면
//   매 프레임 서로 밀어내 다시 만들었다 → 그 죽음(fx.r462)이 직접 들고, 사체는 같은 것을 써서 구운 뒤 놓는다. 검사 qa/r691/r691-cpu-check.cjs.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DEATH_R462__)return;
const REV='R690-R691-mobdeath-6',KEY='storyworld.r462.mobDeath';
let prefs={on:true,corpses:true,style:'gore'};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={looks:0,fire:0,blood:0,noLook:0,corpses:0,corpseDraws:0,sheetDraws:0,cleared:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0,low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx),fin=v=>typeof v==='number'&&Number.isFinite(v);
const recorder=()=>typeof ctx!=='undefined'&&!!ctx&&typeof ctx.scope==='function',FQ=.12,qAge=a=>Math.round(a/FQ)*FQ;
// 자기 그림 한 장: 3D 기록기에서는 필터를 ctx.filter 로(저장 구간 안에서), sprite 에는 넘기지 않는다(R660).
let baking=false;
function own(look,x,y,hPx,opt){
 // R690 굽는 캔버스(2D)에서는 필터를 ctx.filter 로 건다(색 보정 캐시 안 탐). 이 브라우저 캔버스가 filter 를 모르면 아래 원래 길.
 if(baking&&opt.filter&&opt.filter!=='none'&&'filter' in ctx){const keep=ctx.filter,o={...opt,filter:undefined};ctx.filter=opt.filter;
  try{if(!(look.frame&&drawAssetFrame3(look.path,look.frame,x,y,hPx,o)))sprite(look.path,x,y,hPx,o);}finally{ctx.filter=keep;}return;}
 if(look.frame&&drawAssetFrame3(look.path,look.frame,x,y,hPx,opt))return;
 if(opt.filter&&opt.filter!=='none'&&recorder()){const keep=ctx.filter;ctx.filter=opt.filter;try{sprite(look.path,x,y,hPx,{...opt,filter:undefined});}finally{ctx.filter=keep;}return;}
 sprite(look.path,x,y,hPx,opt);}
const clamp01=v=>v<0?0:v>1?1:v,ease=v=>{v=clamp01(v);return v*v*(3-2*v);};
const hash=s=>{let h=2166136261;for(const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const major=e=>!!(e&&(e.boss||e.midboss||e.miniBoss||e.r104Boss||e.persona||e.elite==='boss'));
// ---- 불 / 피 고르기 ---------------------------------------------------------------------------------------
// 살이 있는 것(짐승·벌레·좀비·점액·사람)은 피, 영혼·악마·뼈·기계·마법·물건(살이 없는 것)은 불. 162종 이름(본편·사몽 전 지역)을 보고 정한 낱말표.
//  ① 피 우선(불 낱말이 섞여도 피) → ② 불 → ③ 피 → ④ 나머지는 불(대부분 잔영·결정 같은 추상체).
const BLOOD_FIRST=/좀비|점액체|슬라임|개와 늑대|위장|소화액|식재료|피로 꿰맨|피냄새/;
const FIRE=/망령|혼령|잔영|잔향|잔재|잔류|환각|그림자|안개|파동|신호|공허|악마|천사|가고일|주문사|화염술사|흑마|마법|저주|십자가|가면|인장|봉인|공명|수문장|기계|로봇|드론|사이보그|보행기|태엽|연산|결정|핵|칩|수호기사|수호병|근위|전우|방패동료|호위병|파수|부활자|유리|칼날|지폐|동전|탄환|립스틱|요요|사탕|사진|문장|기록|연결|집행|검흔|모조체|구속자|불길|불면귀|재 나방|박수|하이힐|공포|관측|수집|형상|감시|안정화|쓰레기|오물|한탄|인과|그을|해골|뼈|유령|귀신|기억/;
const BLOOD=/거미|알집|짐승|늑대|사냥개|추적견|여우|뱀|고블린|의료인|환자|신도|수상한 자|갈망하는 자|추적자|전령|염소|포식|실험체|생체|용|쥐|박쥐|벌레|곰|개$|개 /;
function kindOf(look){const n=String(look?.name||'').replace(/^중간보스 · /,'');if(BLOOD_FIRST.test(n))return'blood';if(FIRE.test(n))return'fire';if(BLOOD.test(n))return'blood';return'fire';}
// ---- 살아 있을 때 마지막 그림 기억 -------------------------------------------------------------------------
// drawEnemy 가 실제로 그린 몸(sprite·drawAssetFrame3 중 가장 큰 그림)을 그대로 적어 둔다 → R385 빌리기·R380·R375 덧씌우기를 모두 탄 '화면에 보이던 그 몹'.
const looks=new Map();let capturing=null;
function remember(e,c){if(!e||!c)return;const prev=looks.get(e.id);if(!prev)stats.looks++;looks.delete(e.id);looks.set(e.id,c);
 if(looks.size>260){const it=looks.keys();for(let i=0;i<60;i++)looks.delete(it.next().value);}}
function wrapDraws(){
 if(typeof sprite==='function'&&!sprite.__r462){const base=sprite;const w=function(path,x,y,height,opt){const c=capturing;if(c&&fin(height)&&height>=c.h&&path&&!/assets\/(?:vfx|r190|r411|r438|rc144)\//.test(String(path)))
   {c.h=height;c.path=path;c.frame=null;c.flip=!!opt?.flip;c.x=x;c.y=y;}return base.apply(this,arguments);};w.__r462=true;try{sprite=w;}catch(_){}}
 if(typeof drawAssetFrame3==='function'&&!drawAssetFrame3.__r462){const base=drawAssetFrame3;const w=function(path,frame,x,y,height,opt){const c=capturing;if(c&&fin(height)&&height>=c.h&&path&&frame?.assetFrame)
   {c.h=height;c.path=path;c.frame=frame;c.flip=!!opt?.flip;c.x=x;c.y=y;}return base.apply(this,arguments);};w.__r462=true;try{drawAssetFrame3=w;}catch(_){}}
 if(typeof drawEnemy==='function'&&!drawEnemy.__r462){const base=drawEnemy;const w=function(e,...a){
   if(!prefs.on||!e||major(e)||!(e.hp>0)||e.spawnState==='dead')return base.apply(this,[e,...a]);
   // 엔진 drawEnemy 는 그림을 window.__STORYWORLD_STORY_COMBAT_R54__.frameFor / __STORYWORLD_PHASE1_ART__.enemy 로 고른다(R380 등은 ctx.drawImage 로 바로 그림).
   //  그리는 동안만 둘을 엿보는 껍데기로 바꿔 '이번에 고른 그림'을 받아 적는다(값은 그대로 돌려줌).
   const prior=capturing,c={h:0,path:null,frame:null,flip:false,picked:null};capturing=c;
   const S=window.__STORYWORLD_STORY_COMBAT_R54__,A=window.__STORYWORLD_PHASE1_ART__;
   try{if(S&&typeof S.frameFor==='function')window.__STORYWORLD_STORY_COMBAT_R54__={...S,frameFor(x,f){const r=S.frameFor(x,f);if(x===e&&r&&(r.path||r.assetFrame))c.picked=r;return r;}};}catch(_){}
   try{if(A&&typeof A.enemy==='function')window.__STORYWORLD_PHASE1_ART__={...A,enemy(x){const r=A.enemy(x);if(x===e&&r?.frame&&!c.picked)c.picked=r.frame.path?r.frame:{...r.frame,path:r.path};return r;}};}catch(_){}
   try{return base.apply(this,[e,...a]);}finally{capturing=prior;
    try{if(window.__STORYWORLD_STORY_COMBAT_R54__!==S)window.__STORYWORLD_STORY_COMBAT_R54__=S;}catch(_){}try{if(window.__STORYWORLD_PHASE1_ART__!==A)window.__STORYWORLD_PHASE1_ART__=A;}catch(_){}
    try{const z=typeof zoom==='number'&&zoom>0?zoom:1;let look=null;
     if(c.path&&c.h>4)look={path:c.path,frame:c.frame,flip:c.flip,h:c.h/z};
     else if(c.picked&&(c.picked.path||e.path)&&c.picked.assetFrame){const f=c.picked,b=f.assetFrame.bakedFacing,
       flip=typeof f.flip==='boolean'?f.flip:b==='left'?e.direction==='right':b==='right'?e.direction==='left':b==='front'||b==='back'||b==='eight-way'?false:e.direction==='left',
       hh=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1);
       look={path:f.path||e.path,frame:f,flip,h:hh/z};}
     if(look){look.asp=aspectOf(look);remember(e,{id:e.id,name:e.name,nativeId:e.nativeId,dir:e.direction,...look});}}catch(err){fail(err);}}};
  w.__r462=true;try{drawEnemy=w;}catch(_){}}
 return typeof drawEnemy==='function'&&!!drawEnemy.__r462;}
// ---- 시트 ----------------------------------------------------------------------------------------------
const SHEETS={fire:{p:'assets/r411/fx/boss-fire-wall.webp',cell:256,cols:6,frames:24,pivot:[128,175],vis:110},
 blood:{p:'assets/r411/fx/boss-corpse-explosion.webp',cell:256,cols:6,frames:24,pivot:[128,192],vis:150},
 pool:{p:'assets/r190/blood/blood-death.webp',cell:128,cols:4,frames:16,pivot:[64,64],vis:96}};
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();
 if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function sheet(name,fr,x,y,heightPx,alpha,o={}){const S=SHEETS[name],im=image(S.p);if(!im||alpha<=.01)return false;fr=Math.max(0,Math.min(S.frames-1,fr|0));
 const s=heightPx/S.vis;ctx.save();try{ctx.globalAlpha*=clamp01(alpha);if(o.filter)ctx.filter=o.filter;ctx.translate(x,y);if(o.squash)ctx.scale(1,o.squash);ctx.scale(o.flip?-s:s,s);
  ctx.drawImage(im,(fr%S.cols)*S.cell,Math.floor(fr/S.cols)*S.cell,S.cell,S.cell,-S.pivot[0],-S.pivot[1],S.cell,S.cell);stats.sheetDraws++;}finally{ctx.restore();}return true;}
// 그 몹 자기 그림을 발밑(x,y) 기준으로 그린다(돌리거나 누르지 않음).
function body(look,x,y,hPx,o){ctx.save();try{ctx.translate(x,y);const opt={alpha:o.alpha,flip:look.flip,filter:o.filter};
  own(look,0,0,hPx,opt);}finally{ctx.restore();}}
// ---- R532 찢김 조각 ----------------------------------------------------------------------------------------
// 단위: 몸 키 = 1. 몸 상자 x∈[-w/2,w/2](w = 그림 가로/세로), y∈[-1,0](0 = 발밑). 꼭짓점 격자를 흔들고 변마다 가운데 점을 수직으로 흔들어(이웃 조각과 같은 점 공유)
//  빈틈·겹침 없이 상자를 덮는 들쭉날쭉한 조각을 만든다. 상자 바깥 테두리 점은 그릴 때만 바깥으로 넓혀(clip) 상자 밖으로 삐져나온 그림(날개·꼬리)도 조각에 실린다.
function aspectOf(look){try{const r=look.frame?.assetFrame?.sourceRect,vh=look.frame?.assetFrame?.visibleHeight;let a=null;
 if(r&&r[2]>0&&r[3]>0)a=r[2]/Math.max(1,vh||r[3]);else{const row=typeof readyImage==='function'?readyImage(look.path):null,c=row?.crop;if(c&&c.w>0&&c.h>0)a=c.w/c.h;}
 return a&&Number.isFinite(a)?Math.max(.35,Math.min(2.4,a)):.8;}catch(_){return .8;}}
const rng=seed=>{let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r=(r+Math.imul(r^(r>>>7),61|r))^r;return((r^(r>>>14))>>>0)/4294967296;};};
const shardBox=asp=>{const w=Math.max(.35,Math.min(2.4,+asp||.8));return{x0:-w/2,y0:-1,w,h:1};};
const shardCache=new Map();
function shards(seed,asp,lowFx){const B=shardBox(asp),key=seed+'|'+B.w.toFixed(3)+'|'+(lowFx?1:0);if(shardCache.has(key))return shardCache.get(key);
 const R=rng(seed),cols=lowFx?2:B.w>1.2?4:3,rows=3,cw=B.w/cols,rh=B.h/rows,P=[];
 for(let i=0;i<=cols;i++){P[i]=[];for(let j=0;j<=rows;j++){const inX=i>0&&i<cols,inY=j>0&&j<rows;
  P[i][j]=[B.x0+i*cw+(inX?(R()-.5)*.56*cw:0),B.y0+j*rh+(inY?(R()-.5)*.56*rh:0)];}}
 // 변 가운데 점(이웃 조각과 공유): 가로변 H[i][j] = P[i][j]→P[i+1][j], 세로변 V[i][j] = P[i][j]→P[i][j+1]. 바깥 테두리는 곧게.
 const mid=(a,b,k)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[mx-dy/L*k,my+dx/L*k];},H=[],V=[];
 for(let i=0;i<cols;i++){H[i]=[];for(let j=0;j<=rows;j++)H[i][j]=j>0&&j<rows?mid(P[i][j],P[i+1][j],(R()-.5)*.44*rh):mid(P[i][j],P[i+1][j],0);}
 for(let i=0;i<=cols;i++){V[i]=[];for(let j=0;j<rows;j++)V[i][j]=i>0&&i<cols?mid(P[i][j],P[i][j+1],(R()-.5)*.44*cw):mid(P[i][j],P[i][j+1],0);}
 const out=[];
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const poly=[P[i][j],H[i][j],P[i+1][j],V[i+1][j],P[i+1][j+1],H[i][j+1],P[i][j+1],V[i][j]];
  let cx=0,cy=0;for(const v of poly){cx+=v[0];cy+=v[1];}cx/=poly.length;cy/=poly.length;
  const r=()=>R(),edge={l:i===0,r:i===cols-1,t:j===0,b:j===rows-1};
  out.push({poly,c:[cx,cy],edge,box:B,rnd:[r(),r(),r(),r(),r(),r()]});}
 if(shardCache.size>400)shardCache.clear();shardCache.set(key,out);return out;}
// 그릴 때만: 상자 바깥 테두리 위 점을 바깥으로 넓힌다(조각 사이 경계는 그대로).
function wide(p){const B=p.box,e=1e-9;return p.poly.map(([x,y])=>[x<=B.x0+e?B.x0-.45-B.w*.35:x>=B.x0+B.w-e?B.x0+B.w+.45+B.w*.35:x,y<=B.y0+e?B.y0-.5:y>=-e?.18:y]);}
// 조각 하나의 움직임(닫힌 식, 몸 키 단위): 터짐/부서짐 시작 전에는 제자리, 그 뒤 포물선 → 바닥 띠(발밑 ±)에 닿으면 미끄러지다 멈춘다.
const BURST={blood:.06,fire:.34};
function pieceAt(kind,p,age){const [cx,cy]=p.c,r=p.rnd,t0=BURST[kind]??.06;if(!(age>t0))return{x:cx,y:cy,ang:0,flying:false,landed:false};const t=age-t0;
 let vx,vy,G,w;const gy=-.14+r[0]*.26;
 if(kind==='fire'){vx=cx*(.3+.6*r[1])+(r[2]-.5)*.3;vy=-(.1+.4*r[3]);G=5.2;w=(r[4]-.5)*4;}
 else{const dx=cx,dy=cy+.45,L=Math.hypot(dx,dy)||1,sp=1+r[1];vx=dx/L*sp*.85+(r[2]-.5)*.5;vy=dy/L*sp*.55-(.8+.8*r[3]);G=6.5;w=(r[4]-.5)*10;}
 const disc=vy*vy-2*G*(cy-gy),tl=disc>0?(-vy+Math.sqrt(disc))/G:.01;
 let x,y,ang;if(t<tl){x=cx+vx*t;y=cy+vy*t+.5*G*t*t;ang=w*t;}else{const k=1-Math.exp(-(t-tl)*8);x=cx+vx*tl+vx*.12*k;y=gy;ang=w*tl+w*.08*k;}
 const lim=kind==='fire'?.7:1.5;if(Math.abs(x)>lim)x=Math.sign(x)*lim;return{x,y,ang,flying:t<tl,landed:t>=tl};}
// 조각들 그리기. (두께 한 겹은 뺐다: 3D 기록기 그리기 순서가 실행마다 달라 어두운 겹이 조각 위로 올라와 검은 실루엣처럼 보였음, 거미 촬영) 가장자리 선은 긋지 않는다(조각 다각형은 그림 밖 투명한 곳까지 덮어 선이 네모 테두리로 보였음, 첫 촬영).
//  o.gap(몸 키 단위): 조각을 몸 가운데에서 바깥으로 그만큼 벌린다 — 밑에 깐 달아오른 몸이 그림 모양 그대로 금 사이로 비친다(불).
function tracePoly(P,k){ctx.beginPath();P.forEach((v,i)=>i?ctx.lineTo(v[0]*k,v[1]*k):ctx.moveTo(v[0]*k,v[1]*k));ctx.closePath();}
// R690 조각 모음: 죽음 하나마다 2D 캔버스 한 장에 조각들을 칸으로 나눠 '정확히' 잘라 둔다(필터 없이). 3D 기록기의 clip 은 조각을 덜 잘라
//  조각마다 몸이 거의 통째로 겹쳐 보였고(같은 프레임 비교), 매 프레임 삼각형을 다시 잘랐다 → 날아가는 조각·사체 굽기는 이 칸을 clip 없이 그린다.
const atlasCache=new Map();
function atlasFor(look,seed,lowFx){if(!bakeable(look))return null;const key=seed+'|'+look.path+'|'+(look.frame?.assetFrame?.sourceRect||'')+'|'+(look.flip?1:0)+'|'+(lowFx?1:0)+'|'+(+look.asp||.8).toFixed(3);
 if(atlasCache.has(key)){const A=atlasCache.get(key);atlasCache.delete(key);atlasCache.set(key,A);return A;}
 const z=typeof zoom==='number'&&zoom>0?zoom:1,hb=Math.max(24,Math.min(128,Math.round((+look.h||60)*z))),S=shards(seed,look.asp||.8,lowFx),cells=[];let X=0,Hm=0;
 for(const p of S){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const W=wide(p);for(const [vx,vy] of W){x0=Math.min(x0,vx);x1=Math.max(x1,vx);y0=Math.min(y0,vy);y1=Math.max(y1,vy);}
  const sw=Math.ceil((x1-x0)*hb)+2,sh=Math.ceil((y1-y0)*hb)+2;cells.push({p,W,sx:X,sy:0,sw,sh,ox:(p.c[0]-x0)*hb+1,oy:(p.c[1]-y0)*hb+1,x0,y0});X+=sw+2;Hm=Math.max(Hm,sh);}
 let A=null;try{const cv=document.createElement('canvas');cv.width=Math.max(1,X);cv.height=Math.max(1,Hm);const g=cv.getContext&&cv.getContext('2d');
  if(g){const keep=ctx,kb=baking;baking=true;ctx=g;
   try{for(const c of cells){g.save();try{g.translate(c.sx+1-c.x0*hb,1-c.y0*hb);tracePoly(c.W,hb);g.clip();own(look,0,0,hb,{alpha:1,flip:look.flip});}finally{g.restore();}}}
   finally{ctx=keep;baking=kb;}
   try{cv.__storyworldStaticSource=Object.freeze({path:'r462:pieces:'+key,immutable:true});}catch(_){}
   A={cv,hb,cells};stats.atlases=(stats.atlases||0)+1;}}catch(e){fail(e);A=null;}
 atlasCache.set(key,A);while(atlasCache.size>48)atlasCache.delete(atlasCache.keys().next().value);return A;}
function drawPieces(look,x,y,hPx,kind,age,o){const S=shards(o.seed,look.asp||.8,low()),gap=+o.gap||0;
 // R691: 그 죽음이 들고 있는 조각 모음을 먼저 쓴다(캐시에서 밀려나도 다시 만들지 않음)
 const H=o.holder;let A=null;if(prefs.bake!==false){if(H&&H.atlas&&H.atlasLow===low())A=H.atlas;else{A=atlasFor(look,o.seed,low());if(H&&A){H.atlas=A;H.atlasLow=low();}}}
 if(A&&A.cells.length===S.length){const k=hPx/A.hb;
  for(const c of A.cells){const p=c.p,q=pieceAt(kind,p,age);let gx=0,gy=0;
   if(gap>0){const dx=p.c[0],dy=p.c[1]+.45,L=Math.hypot(dx,dy)||1;gx=dx/L*gap*hPx;gy=dy/L*gap*hPx;}
   ctx.save();try{ctx.translate(x+q.x*hPx+gx,y+q.y*hPx+gy);if(q.ang)ctx.rotate(q.ang);ctx.globalAlpha*=clamp01(o.alpha??1);if(o.filter&&o.filter!=='none')ctx.filter=o.filter;
    ctx.drawImage(A.cv,c.sx,c.sy,c.sw,c.sh,-c.ox*k,-c.oy*k,c.sw*k,c.sh*k);}finally{ctx.restore();}}
  return;}
 for(const p of S){const q=pieceAt(kind,p,age),W=wide(p),opt={alpha:o.alpha,flip:look.flip,filter:o.filter};let gx=0,gy=0;
  if(gap>0){const dx=p.c[0],dy=p.c[1]+.45,L=Math.hypot(dx,dy)||1;gx=dx/L*gap*hPx;gy=dy/L*gap*hPx;}
  const one=(dy,filter)=>{ctx.save();try{ctx.translate(x+q.x*hPx+gx,y+q.y*hPx+gy+dy);if(q.ang)ctx.rotate(q.ang);ctx.translate(-p.c[0]*hPx,-p.c[1]*hPx);
    tracePoly(W,hPx);ctx.clip();own(look,0,0,hPx,filter?{...opt,filter}:opt);}finally{ctx.restore();}};
  one(0,null);}}
// ---- 죽는 순간(엔진 enemyBurnDeath 효과를 그대로 쓰되, 그리기만 바꿈) -----------------------------------------
const LIFE={fire:1.7,blood:1.15};
// ---- 설정으로 남긴 '눕히기' 죽음(R462 원래 연출, 사용자 2026-11-10 07:26Z "그림눕히는 효과는 연령나중에 통과위해서 설정으로 남겨둬") ----
//  prefs.style='lay': 몸 그림을 기울여 주저앉히고(회전+납작) 눕힌 몸을 사체로 남긴다(찢김 조각 없음). 기본은 'gore'(찢김·터짐).
const FALL={fire:[.3,.78],blood:[0,.24]},lay=()=>prefs.style==='lay';
function bodyLay(look,x,y,hPx,o){const side=o.side||1,fall=ease(o.fall||0),ang=side*fall*.52,squash=1-fall*.5;
 ctx.save();try{ctx.translate(x-side*fall*hPx*.1,y);if(squash<1)ctx.scale(1,squash);
  own(look,0,0,hPx,{alpha:o.alpha,flip:look.flip,angle:ang,filter:o.filter});}finally{ctx.restore();}}
function drawDyingLay(fx,base){const R=fx.r462,look=R.look,q=project(fx.x,fx.y),z=typeof zoom==='number'&&zoom>0?zoom:1,hPx=Math.max(14,look.h*z),age=fx.age,[f0,f1]=FALL[R.kind],fall=clamp01((age-f0)/(f1-f0));
 if(R.kind==='fire'){const keep=fx.bodyPath;fx.bodyPath=null;try{base(fx);}finally{fx.bodyPath=keep;}
  if(age<f1){const fa=qAge(age),heat=clamp01(fa/.3),char=clamp01((fa-.12)/.6),b=(1.45-heat*.25)*(1-char)+.3*char;
   bodyLay(look,q.x,q.y,hPx,{side:R.side,fall,alpha:1,filter:`brightness(${b.toFixed(3)}) saturate(${(1.5-char*1.1).toFixed(3)}) contrast(${(1+char*.2).toFixed(3)})`});}
  const t=clamp01((age-.08)/(fx.life-.08));sheet('fire',Math.floor(t*24),q.x-R.side*hPx*.05,q.y+hPx*.04,hPx*(.34+.14*fall),(age<.2?age/.2:1)*(t>.8?(1-t)/.2:1),{flip:R.side<0});
 }else{if(age<f1){const flash=age<.1?1.55:1.2,shake=Math.sin(age*95)*hPx*.03*(1-fall);
   bodyLay(look,q.x+shake,q.y,hPx,{side:R.side,fall,alpha:1,filter:`brightness(${flash}) saturate(.7)`});}
  const t=clamp01((age-.05)/(fx.life-.05));sheet('blood',Math.floor(t*24),q.x-R.side*hPx*.08,q.y+hPx*.02,hPx*.9,1,{flip:R.side<0});}}
function adopt(fx){if(fx.r462!==undefined)return fx.r462;fx.r462=null;if(!prefs.on||fx.boss||fx.midboss)return null;
 const look=looks.get(fx.sourceId);if(!look){stats.noLook++;return null;}
 const kind=kindOf(look),h=hash(fx.sourceId);fx.r462={kind,look,side:(look.flip?-1:1)*((h>>>3)&1?1:-1),seed:h,lay:lay()};fx.life=Math.max(fx.life||0,LIFE[kind]);stats[kind]++;
 if(prefs.corpses)addCorpse(fx);return fx.r462;}
function drawDying(fx,base){if(fx.r462.lay){drawDyingLay(fx,base);return;}const R=fx.r462,look=R.look,q=project(fx.x,fx.y),z=typeof zoom==='number'&&zoom>0?zoom:1,hPx=Math.max(14,look.h*z),age=fx.age,fa=qAge(age);
 if(R.kind==='fire'){
  // 엔진 불꽃·불티는 살리되 엔진 몸 그림(다른 몹일 수 있음)은 빼고 그린다
  const keep=fx.bodyPath;fx.bodyPath=null;try{base(fx);}finally{fx.bodyPath=keep;}
  // 0~.34초: 붉게 달아오르며 몸에 빛나는 금이 번진다 → 금을 따라 부서져 내려앉으며 숯이 된다(사체 색 .58 로 이어짐)
  const heat=clamp01(fa/.3),char=clamp01((fa-.18)/.6),b=(1.45-heat*.2)*(1-char)+.58*char,crack=clamp01((age-.06)/.26),glow=crack*(1-clamp01((age-BURST.fire)/.3));
  if(glow>.01)body(look,q.x,q.y,hPx,{alpha:glow,filter:'brightness(2.6) saturate(1.8) contrast(1.2)'});
  drawPieces(look,q.x,q.y,hPx,'fire',age,{holder:R,seed:R.seed,alpha:1,thick:true,gap:.018*glow,filter:`brightness(${b.toFixed(3)}) saturate(${(1.5-char*.9).toFixed(3)}) contrast(${(1+char*.12).toFixed(3)})`});
  const t=clamp01((age-.08)/(fx.life-.08));sheet('fire',Math.floor(t*24),q.x-R.side*hPx*.05,q.y+hPx*.04,hPx*.42,(age<.2?age/.2:1)*(t>.8?(1-t)/.2:1),{flip:R.side<0});
 }else{
  // 맞는 순간 .06초 번쩍·떨림(통째) → 조각으로 터져 흩어지고 피 시트가 터진다
  if(age<=BURST.blood){const shake=Math.sin(age*95)*hPx*.03;body(look,q.x+shake,q.y,hPx,{alpha:1,filter:'brightness(1.55) saturate(.7)'});}
  else{const cool=clamp01((fa-BURST.blood)/.35),b=1.3*(1-cool)+.82*cool;
   drawPieces(look,q.x,q.y,hPx,'blood',age,{holder:R,seed:R.seed,alpha:1,thick:true,filter:`brightness(${b.toFixed(3)}) saturate(${(.8+.15*cool).toFixed(3)}) contrast(1.05)`});}
  const t=clamp01((age-.03)/(fx.life-.03));sheet('blood',Math.floor(t*24),q.x-R.side*hPx*.08,q.y+hPx*.02,hPx*.9,1,{flip:R.side<0});
 }}
function wrapBurn(){if(typeof drawBurnDeath3!=='function'||drawBurnDeath3.__r462)return typeof drawBurnDeath3==='function';const base=drawBurnDeath3;
 const w=function(fx,...a){try{if(fx&&adopt(fx)){drawDying(fx,base);return;}}catch(err){fail(err);}return base.apply(this,[fx,...a]);};w.__r462=true;try{drawBurnDeath3=w;}catch(_){}return true;}
// ---- 시체 ----------------------------------------------------------------------------------------------
let corpses=[],corpseRoom=null,corpseSerial=0;
// 3D 기록기(ctx.scope 가 있을 때 = Three.js 그리기)에서는 사체마다 주인을 그 바닥 자리(x·y)로 달고 줄 열쇠를 'r462:corpse:<번호>:…' 로 한다
//  → R451 국지 조명이 사체(웅덩이·그을음·몸)에도 바닥과 같은 빛을 곱한다. 주인이 없으면(기본 'scene') 빛 밖이라 등 밑에선 바닥보다 어둡고
//  어두운 곳에선 바닥보다 밝게 뜬다. 주인 종류는 그대로 'scene' 이라 그리는 층·순서·화면 자리는 같다. 2D 캔버스는 그대로.
const CORPSE_OWNER='r462:corpse:';
function addCorpse(fx){if(typeof room==='undefined'||!room)return;if(corpseRoom!==room){corpses=[];corpseRoom=room;}const R=fx.r462,max=low()?10:24;
 const born=T()-(+fx.age||0);corpses.push({holder:R,x:fx.x,y:fx.y,kind:R.kind,look:R.look,side:R.side,seed:R.seed,lay:!!R.lay,uid:++corpseSerial,born,t0:born+(R.lay?FALL[R.kind][1]:(+fx.life||LIFE[R.kind]))});stats.corpses++;
 while(corpses.length>max)corpses.shift();}
// R690 사체 굽기: 조각이 다 멈춘 모습(SETTLED 초)을 캔버스 한 장에 한 번 그린다. 발밑 = (ox,oy), 굽는 키 hb 픽셀.
const SETTLED=30,CORPSE_FILTER={blood:'brightness(.82) saturate(.95) contrast(1.05)',fire:'brightness(.58) saturate(.6) contrast(1.12)'};
function bakeable(look){try{if(typeof document==='undefined'||typeof document?.createElement!=='function')return false;const row=typeof readyImage==='function'?readyImage(look.path):null;return !!row?.image;}catch(_){return false;}}
// 경계: 조각마다 그 clip 다각형(그림은 이 안에서만 찍힘)을 멈춘 자리로 옮긴 꼭짓점들 → 잘림 없이 넉넉하다.
function bakeCorpse(c,hPx){const look=c.look,S=shards(c.seed,look.asp||.8,low());
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const p of S){const q=pieceAt(c.kind,p,SETTLED),co=Math.cos(q.ang||0),si=Math.sin(q.ang||0);
  for(const [vx,vy] of wide(p)){const dx=vx-p.c[0],dy=vy-p.c[1],X=q.x+dx*co-dy*si,Y=q.y+dx*si+dy*co;x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);}}
 if(!(x1>x0&&y1>y0))return null;let hb=Math.max(14,Math.min(160,Math.round(hPx)));const area=(x1-x0)*(y1-y0);if(area*hb*hb>1.2e6)hb=Math.max(14,Math.floor(Math.sqrt(1.2e6/area)));
 const cv=document.createElement('canvas'),W=Math.ceil((x1-x0)*hb)+4,H=Math.ceil((y1-y0)*hb)+4;cv.width=W;cv.height=H;const g=cv.getContext&&cv.getContext('2d');if(!g)return null;
 const ox=-x0*hb+2,oy=-y0*hb+2,keep=ctx;baking=true;ctx=g;
 try{g.save();try{g.translate(ox,oy);drawPieces(look,0,0,hb,c.kind,SETTLED,{seed:c.seed,alpha:1,filter:CORPSE_FILTER[c.kind],holder:c.holder});}finally{g.restore();}}
 finally{ctx=keep;baking=false;}
 // 3D 기록기: 정적 그림으로 표시 → 매 프레임 복사(스냅숏)·텍스처 재업로드 없이 한 번만 올린다
 try{cv.__storyworldStaticSource=Object.freeze({path:'r462:corpse-bake:'+c.uid,immutable:true});}catch(_){}
 stats.bakes=(stats.bakes||0)+1;if(c.holder){c.holder.atlas=null;}c.holder=null;return{cv,ox,oy,hb,W,H};}
// 구운 사체 한 장 그리기(없으면 굽는다). 그림이 아직 안 읽혔거나 캔버스를 못 만들면 false → 예전처럼 조각으로 그린다.
function baked(c,q,hPx,alpha){if(prefs.bake===false)return false;if(!c.bake&&!c.noBake&&bakeable(c.look)){c.bake=bakeCorpse(c,hPx);if(!c.bake)c.noBake=true;}const B=c.bake;if(!B)return false;
 const k=hPx/B.hb;ctx.save();try{ctx.globalAlpha*=alpha;ctx.drawImage(B.cv,q.x-B.ox*k,q.y-B.oy*k,B.W*k,B.H*k);stats.bakeDraws=(stats.bakeDraws||0)+1;}finally{ctx.restore();}return true;}
function drawCorpses(){if(!prefs.on||!prefs.corpses||!corpses.length)return;if(typeof room==='undefined'||room!==corpseRoom){corpses=[];stats.cleared++;return;}
 const now=T(),stay=low()?15:45,z=typeof zoom==='number'&&zoom>0?zoom:1;
 corpses=corpses.filter(c=>now-c.t0<stay+4);const scope=typeof ctx.scope==='function'?ctx.scope.bind(ctx):null;
 for(const c of corpses){const age=now-c.t0;if(age<0)continue;const q=project(c.x,c.y),hPx=Math.max(14,c.look.h*z),fade=age>stay?1-(age-stay)/4:1;if(fade<=0)continue;
  const one=()=>{ctx.save();try{
   if(c.kind==='blood'){const grow=clamp01(age/.9);sheet('pool',Math.round(3+grow*4),q.x-c.side*hPx*.1,q.y,hPx*(.55+.35*grow),.78*fade,{squash:.42,flip:(c.seed&1)===1});
    if(c.lay)bodyLay(c.look,q.x,q.y,hPx,{side:c.side,fall:1,alpha:.95*fade,filter:'brightness(.68) saturate(1.2) contrast(1.06)'});
    else if(!baked(c,q,hPx,.97*fade))drawPieces(c.look,q.x,q.y,hPx,'blood',now-c.born,{holder:c.holder,seed:c.seed,alpha:.97*fade,filter:CORPSE_FILTER.blood});}
   else{/* 그을린 바닥 자국: 피 웅덩이 칸을 검게(몬스터 그림자는 R444 가 없앴으므로 shadow() 는 쓰지 않음) */
    sheet('pool',7,q.x-c.side*hPx*.1,q.y,hPx*.75,.6*fade,{squash:.4,flip:(c.seed&1)===1,filter:'brightness(.12) saturate(0)'});
    if(c.lay)bodyLay(c.look,q.x,q.y,hPx,{side:c.side,fall:1,alpha:.96*fade,filter:'brightness(.42) saturate(.35) contrast(1.12)'});
    else if(!baked(c,q,hPx,.97*fade))drawPieces(c.look,q.x,q.y,hPx,'fire',now-c.born,{holder:c.holder,seed:c.seed,alpha:.97*fade,filter:CORPSE_FILTER.fire});
    const glow=clamp01(1-age/4.5);if(glow>0&&typeof texture==='function'&&typeof VFX!=='undefined'&&VFX.burnFlame){const fl=.75+.25*Math.sin(now*9+c.seed%7);
     texture(VFX.burnFlame,q.x-c.side*hPx*.12,q.y-hPx*.12,hPx*.5,hPx*.22,{alpha:.22*glow*fl*fade});}}
   stats.corpseDraws++;}catch(err){fail(err);}finally{ctx.restore();}};
  if(scope)scope({...ctx.owner,id:CORPSE_OWNER+c.uid,kind:'scene',x:c.x,y:c.y},one);else one();}}
function wrapObjective(){if(typeof drawObjective!=='function'||drawObjective.__r462)return typeof drawObjective==='function';const base=drawObjective;
 const w=function(...a){const r=base.apply(this,a);try{drawCorpses();}catch(err){fail(err);}return r;};w.__r462=true;try{drawObjective=w;}catch(_){}return true;}
// ---- 설치 ----------------------------------------------------------------------------------------------
let tries=0,ok=false;
function install(){try{const a=wrapDraws(),b=wrapBurn(),c=wrapObjective();ok=a&&b&&c;}catch(e){fail(e);}return ok;}
install();(function arm(){if(!ok&&++tries<80&&typeof setTimeout==='function')setTimeout(()=>{install();arm();},250);})();
try{if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){corpses=[];corpseRoom=null;return base.apply(this,a);};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
// 설정 창: '몹 죽음 연출' — 찢김·터짐(기본) / 쓰러져 눕기(R462 원래). 다음 죽음부터 바뀐다(이미 남은 사체는 그대로).
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');
 if(grid&&!document.getElementById('r532DeathStyle')){const l=document.createElement('label'),s=document.createElement('select');s.id='r532DeathStyle';
  for(const [v,t] of [['gore','찢기고 터짐'],['lay','쓰러져 눕기']]){const o=document.createElement('option');o.value=v;o.textContent=t;s.appendChild(o);}
  s.value=prefs.style==='lay'?'lay':'gore';s.onchange=()=>set({style:s.value==='lay'?'lay':'gore'});l.appendChild(document.createTextNode('몹 죽음 연출 '));l.appendChild(s);grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
// R690: 이 몹의 죽음을 R462 가 맡는가(그렇다면 R91 공용 잔해·파편, R165 연기는 겹치지 않게 건너뜀)
function owns(e){try{return !!(prefs.on&&e&&typeof e==='object'&&!major(e)&&looks.has(e.id));}catch(_){return false;}}
window.__STORYWORLD_MOB_DEATH_R462__=Object.freeze({revision:REV,set,kindOf,owns,corpseOwner:CORPSE_OWNER,shards,shardBox,pieceAt,
 inspect:()=>({revision:REV,installed:ok,prefs:{...prefs},corpses:corpses.length,atlasCache:atlasCache.size,stats:{...stats},lastError})});
})();
