// R355 사몽 맵 넓히기 + 학교 광장(처치 666) 얼굴 없는 학생 — 사용자 2026-11-05
//  "사몽맵 모든 복도길구간 넓이 2배로 넓혀주고 방이나 교실공간도 넓혀줘, (학교)광장처치666 등장하는 얼굴없는학생 제대로 적용해줘 지금은 스토리모드몹이나온다".
//
//  1) 넓히기 — 사몽의 모든 지도는 R115 구역(sz115-*·sz162-*·sz173-*, 16장 전부)이고, 그 구역 정의(rooms·links·entry·exit·단서·책상 격자·순찰길…)
//     하나에서 바닥 칸(carve)·벽·문틀·소품(dress)·길잡이 목표(navGoal)가 모두 나온다. 그래서 지형 결과(layout)를 따로 고치지 않고(R219 교훈: 판정과 그림이
//     어긋남) 구역 정의를 불러오는 순간 한 번만 바꾼다 → 엔진 바닥·벽 덩어리, explorationBlocked, findPath, 소품·단서 자리가 모두 같은 지도를 본다.
//     · 복도·길(kind corridor/street/stair 중 폭 4칸 이하이거나 길쭉한 것, 광장으로 드나드는 좁은 길, 세로 일자길 lane, 방과 방을 잇는 link): 지금 폭의 2배.
//     · 방·교실·홀·광장: 자리(좌표)를 S 배로 벌리고 크기도 S 배(넓이 S²배). S=1.5(넓이 2.25배), 이미 R139 로 1.5배 키운 생존 구역은 S=1.25(넓이 1.56배).
//     · 단서·책상 격자는 그 방 안의 상대 자리를 지키고, 입구·출구·저장 등불·상자·단상·코어·순찰길 점은 같은 배율로 옮긴 뒤 바닥 밖이면 가장 가까운 바닥 칸으로.
//     · 끄기: localStorage['storyworld.r355.samongWide']='{"on":false}' 뒤 새로고침(본편 STORY 지도는 처음부터 건드리지 않는다).
//  2) 얼굴 없는 학생 — 원인: 사몽 S-02(학교)의 몹은 STORY 몹(ep1a08 a08-s1·u204 u204-e2)을 기증자로 빌려 만들고, R105 가 그리는 동안만 프로필 프레임을
//     드라이브 원화(mob-student.webp)로 바꿔 끼운다. 그런데 엔진의 공격 시계 프레임(R54 frameFor: nativeId 기준 원래 공격 칸)과 중간보스 그리기는 프로필
//     프레임이 아니라 기증 몹의 원래 그림(corridor_scream_echo·u2_void_wraith)을 직접 고른다 → 광장 · 처치 666 에서 공격하는 학생과
//     '중간보스 · 얼굴 없는 학생' 이 본편 몹으로 보였다(헤드리스 실측). R161 꼭두각시도 '사몽 전용 그림이 있다'며 건너뛴다.
//     · 이름이 R105 원화의 몹 이름(얼굴 없는 학생 · 종이 형상)과 맞는 사몽 몹(보스 제외, 중간보스·준보스 포함)은 그리는 동안 기증 몹의 몸 그림만 칠하지 않고,
//       원화가 한 번도 칠해지지 않았으면 같은 자리·같은 키로 원화를 그린다(R105 drawStatic 과 같은 규칙). 판정·체력·피해·보상·저장은 그대로(보이는 것만).
//     · 끄기: localStorage['storyworld.r355.samongWide']='{"art":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_WIDE_R355__)return;
const REV='R355-samong-wide-2',KEY='storyworld.r355.samongWide';
let prefs={on:true,art:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={zones:0,rooms:0,paths:0,links:0,snapped:0,unsnapped:0,artDraws:0,hidden:0,waits:0,inside:0,after:0,pixel:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const Z=window.__STORYWORLD_SAMONG_ZONES_R115__;
const S_BASE=1.5,S_SCALED=1.25,PATH_K=2;
const PATH_KIND=new Set(['corridor','street','stair']);
const isLane=z=>z.tpl==='lane'||z.tpl==='laneUp'||z.mode==='D'||z.mode==='G';
const aspect=R=>Math.max(R.w,R.h)/Math.max(1,Math.min(R.w,R.h));
const isPath=(z,R)=>isLane(z)||(PATH_KIND.has(R.kind)&&(Math.min(R.w,R.h)<=4||aspect(R)>=2.5))||(R.kind==='yard'&&R.shape!=='disc'&&Math.min(R.w,R.h)<=5&&aspect(R)>=1.8)/* 광장 '들어오는 길'·'나가는 길' */;
// 지금(바꾸기 전) 실제로 바닥이 파이는 폭: carve 의 R116 규칙(미로가 아닌 구역은 3칸 이하 복도 +1, link 는 max(w+1,4)).
const carvedW=(z,R,w)=>w+(z.kind!=='maze'&&R.kind==='corridor'&&w<=3?1:0);
const linkW=(z,w0=3)=>z.kind==='maze'?w0:Math.max(w0+1,4);
function measure(z){const rooms=z.rooms||[],paths=[],areas=[];
 for(const R of rooms){if(R.r355Path??isPath(z,R))paths.push(isLane(z)?Math.min(R.w,R.h):carvedW(z,R,Math.min(R.w,R.h)));else areas.push(R.shape==='disc'?Math.round(Math.PI*R.w*R.h/4):R.w*R.h);}
 const links=(z.links||[]).map(l=>linkW(z,l[2]));
 return{paths,links,areas,minPath:Math.min(...paths,...links,Infinity),roomArea:areas.reduce((a,b)=>a+b,0)};}
function widen(z){if(!z||z.r355||!Array.isArray(z.rooms)||!z.rooms.length)return false;
 const before=measure(z),S=z.r139Scale?S_SCALED:S_BASE,lane=isLane(z);
 // 1. 방마다 새 사각형(가운데는 S 배 자리, 크기는 방이면 S 배, 길이면 짧은 쪽 2배·긴 쪽 S 배).
 const next=z.rooms.map(R=>{const cx=(R.x+R.w/2)*S,cy=(R.y+R.h/2)*S;let w,h;
  if(lane){w=Math.round(R.w*PATH_K);h=Math.round(R.h*PATH_K);}
  else if(isPath(z,R)){const tw=carvedW(z,R,Math.min(R.w,R.h))*PATH_K;if(aspect(R)<1.5){w=Math.max(tw,Math.round(R.w*PATH_K));h=Math.max(tw,Math.round(R.h*PATH_K));}/* 미로 칸(3×3)처럼 네모난 길 칸은 두 쪽 다 2배 */else if(R.w<=R.h){w=tw;h=Math.max(R.h,Math.round(R.h*S));}else{h=tw;w=Math.max(R.w,Math.round(R.w*S));}stats.paths++;}
  else{w=Math.max(R.w,Math.round(R.w*S));h=Math.max(R.h,Math.round(R.h*S));}
  return{R,x:Math.round(cx-w/2),y:Math.round(cy-h/2),w,h};});
 // 2. 전체를 왼쪽 위 3칸(벽 자리)에 맞춰 민다 — 0 아래로 나가지 않고, 대면 구역 단상이 엔진 보스 장판 범위(3..27) 가까이 남게.
 const ox=3-Math.min(...next.map(n=>n.x)),oy=3-Math.min(...next.map(n=>n.y));
 const G=p=>p&&Number.isFinite(p.x)?{...p,x:+(p.x*S+ox).toFixed(2),y:+(p.y*S+oy).toFixed(2)}:p;
 const rooms=next.map(n=>({...n.R,x:n.x+ox,y:n.y+oy,w:n.w,h:n.h,r355Path:isPath(z,n.R)}));
 const fx=i=>rooms[i].w/z.rooms[i].w,fy=i=>rooms[i].h/z.rooms[i].h;
 rooms.forEach((R,i)=>{const R0=z.rooms[i];if(R0.grid){const g=R0.grid;R.grid={...g,x:+(R.x+(g.x-R0.x)*fx(i)).toFixed(2),y:+(R.y+(g.y-R0.y)*fy(i)).toFixed(2),dx:+(g.dx*fx(i)).toFixed(2),dy:+(g.dy*fy(i)).toFixed(2)};}
  if(R0.along)R.along=R0.along.map(([k,side,step])=>[k,side,+(step*((side==='n'||side==='s')?fx(i):fy(i))).toFixed(2)]);stats.rooms++;});
 const out={rooms};
 out.links=(z.links||[]).map(([a,b,w0=3,via='hv'])=>{const w=linkW(z,w0)*PATH_K;stats.links++;return[a,b,z.kind==='maze'?w:w-1,via];});
 for(const k of['entry','exit','save','dais','core','top'])if(z[k])out[k]=G(z[k]);
 for(const k of['chests','landings'])if(Array.isArray(z[k]))out[k]=z[k].map(G);
 if(z.cuts)out.cuts=z.cuts.map(c=>{const w=Math.max(c.w,Math.round(c.w*S)),h=Math.max(c.h,Math.round(c.h*S)),cx=(c.x+c.w/2)*S+ox,cy=(c.y+c.h/2)*S+oy;return{...c,x:Math.round(cx-w/2),y:Math.round(cy-h/2),w,h};});
 if(z.clues)out.clues=z.clues.map(c=>c.room!=null&&Array.isArray(c.at)&&z.rooms[c.room]?{...c,at:[+(c.at[0]*fx(c.room)).toFixed(2),+(c.at[1]*fy(c.room)).toFixed(2)]}:c);
 if(z.patrol?.routes)out.patrol={...z.patrol,routes:z.patrol.routes.map(rt=>rt.map(p=>Array.isArray(p)?[+(p[0]*S+ox).toFixed(2),+(p[1]*S+oy).toFixed(2)]:G(p)))};
 Object.assign(z,out);
 // 3. 옮긴 점이 바닥 밖이면 가장 가까운 바닥 칸 가운데로(실제 carve 결과로 확인).
 try{const cells=Z.carve(z).cells,on=p=>cells.has(Math.floor(p.x)+':'+Math.floor(p.y));
  const snap=p=>{if(!p||!Number.isFinite(p.x)||on(p))return p;let best=null,bd=1e9;for(const k of cells){const[a,b]=k.split(':').map(Number),d=Math.hypot(a+.5-p.x,b+.5-p.y);if(d<bd){bd=d;best={x:a+.5,y:b+.5};}}stats.snapped++;return best?{...p,...best}:p;};
  for(const k of['entry','exit','save','dais','core','top'])if(z[k])z[k]=snap(z[k]);for(const k of['chests','landings'])if(Array.isArray(z[k]))z[k]=z[k].map(snap);
  if(z.patrol?.routes)z.patrol.routes=z.patrol.routes.map(rt=>rt.map(p=>{if(!Array.isArray(p))return snap(p);const q=snap({x:p[0],y:p[1]});return[q.x,q.y];}));}catch(e){fail(e);stats.unsnapped++;}
 z.r355={rev:REV,scale:S,lane,offset:[ox,oy],before,after:measure(z)};stats.zones++;return true;}
if(prefs.on!==false&&Z?.chapters)for(const list of Object.values(Z.chapters))for(const z of list||[])try{widen(z);}catch(e){fail(e);}

// ---- 2) 얼굴 없는 학생(그리고 같은 문제의 RF 종이 형상) -------------------------------------------------------
const DA=()=>window.__STORYWORLD_DRIVE_ART_R105__;
const ART_NAME={'mob-student.webp':'얼굴 없는 학생','mob-paper-figure.webp':'종이 형상'};
function artOf(e){if(prefs.art===false||!e||!e.samongR103||e.boss||e.persona||e.r170Tower||e.r251Circle)return null;let p=null;try{p=DA()?.artFor?.(e)||null;}catch(err){fail(err);}
 if(!p)return null;const want=ART_NAME[String(p).split('/').pop()];return want&&String(e.name||'').includes(want)?p:null;}
const srcPath=im=>{try{const s=String(im?.__path||im?.src||'');const i=s.indexOf('assets/');return i>=0?s.slice(i).split(/[?#]/)[0]:'';}catch(_){return '';}};
function bodyPaths(e){const out=new Set(),add=v=>{if(v?.path)out.add(String(v.path).replace(/^\.\//,''));};
 try{const fs=window.__STORYWORLD_STORY_COMBAT_R54__?.frameSet?.(e);if(fs)Object.values(fs).forEach(add);}catch(_){}
 try{Object.values(e.profile?.frames||{}).forEach(add);Object.values(e.profile?.actions||{}).forEach(add);if(e.profile?.path)out.add(e.profile.path);}catch(_){}
 if(e.path)out.add(String(e.path));return out;}
// 기증 몹의 몸 그림: 프로필·R54 프레임 묶음 경로 + 엔진이 직접 고르는 원래 그림 폴더(본편 생성 원화, 공격 자세 시트 rc137, 보스 자세 atlas).
// 헤드리스 실측에서 사몽 학생을 그리는 동안 칠해진 그림은 몸 그림뿐이었다(체력바·이름은 벡터) — 그래도 이펙트·그림자 그림은 막지 않는다.
const STORY_BODY=/(^|\/)(generated-v\d+\/|actors-normalized\/|actors\/v3\/|rc137\/mob-attacks|visual-test\/|episode1[ab]\/|r99\/clean\/assets\/)/,KEEP=/(^|\/)(fx|vfx|pixelfx|effects?|shadow|status|icons?|r341|r161\/sculpture)[-_/]/i;
const asked=new Map();function ready(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return true;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return false;}
function drawOwn(e,path){if(!ready(path)){stats.waits++;return;}const dead=e.spawnState==='dead'||e.hp<=0,age=(typeof time==='number'?time:0)-(Number.isFinite(e.deadAt)?e.deadAt:(typeof time==='number'?time:0));if(dead&&age>.7)return;
 const q=project(e.x,e.y),cp=e.combatProfile,h=actorHeight()*(cp?.spriteRect?.height||1)*(e.defScale||1),lift=Math.max(0,Math.min(h*.65,Number(e.visualLiftPx)||0));
 sprite(path,q.x,q.y-lift,h,{alpha:dead?Math.max(0,1-age/.7):1,flip:e.direction==='left',filter:e.flash>0?'brightness(1.7)':'saturate(.8)'});stats.artDraws++;}
// R355-2(Codex 검토 3건): 대신 그리는 원화는 ① 엔진 enemy 기록 범위(ctx.scope) 안에서 — 밖이면 owner 'scene' 으로 남아 phase1 visibleOwner 가림 판정을 건너뛰어 벽 너머로 보인다,
//  ② R259 몸 그림 측정(drawEnemy 안쪽 훅)이 끝나기 전에 — 기증 몹의 첫 몸 그림을 숨기는 그 자리에서 바깥 변환·투명도로 되돌려 그린다(그래서 centreOf 가 원화 사각형을 잰다),
//  ③ R306 픽셀 모드(assets/r306/pixel/…)가 이미 몸을 바꿔 그렸으면 그것을 '몸 그림 끝' 으로 친다(두 번째 몸 금지).
//  기증 몸 그림이 한 장도 없었으면(드묾) base 뒤에 그리되 R248 처럼 enemy scope(몹 id·월드 좌표)로 감싼다.
const PIXEL_R306=/(^|\/)assets\/r306\/pixel\//;
// R259 은 이 훅보다 바깥(먼저 불림)이라 숨긴 기증 몸도 후보로 잰다 → 원화를 그릴 때 bodyDrawn 으로 '실제 몸' 이라고 알려 후보를 갈아 끼운다(R306 과 같은 길).
function toR259(e,c,im,q){try{const H=window.__STORYWORLD_HIT_CENTER_R259__;if(!H?.bodyDrawn||typeof c.getTransform!=='function')return;const W=im?.naturalWidth||im?.width,Hh=im?.naturalHeight||im?.height;
 const q8=q.length===8?q:q.length===4&&W&&Hh?[0,0,W,Hh,...q]:null;if(q8)H.bodyDrawn(e,im,q8,c.getTransform());}catch(err){fail(err);}}
const scopeOwner=e=>({id:'r355:mob:'+(e.id??e.name??'?'),kind:'enemy',x:e.x,y:e.y,alive:e.hp>0,bodyPath:null});
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){const path=artOf(e);if(!path||typeof ctx==='undefined'||typeof ctx?.drawImage!=='function')return base.apply(this,[e,...a]);
 const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage,paths=bodyPaths(e);let drew=false,done=false,mine=false;ready(path);
 const outerT=typeof c.getTransform==='function'?c.getTransform():null,outerA=c.globalAlpha,outerOp=c.globalCompositeOperation,outerF=c.filter;
 const paintInside=self=>{done=true;mine=true;const save=typeof self.save==='function';try{if(save)self.save();try{if(outerT&&typeof self.setTransform==='function')self.setTransform(outerT);if(outerA!=null)self.globalAlpha=outerA;if(outerOp!=null)self.globalCompositeOperation=outerOp;if(outerF!=null)self.filter=outerF;drawOwn(e,path);stats.inside++;}finally{if(save)self.restore();}}catch(err){fail(err);}finally{mine=false;}};
 c.drawImage=function(im,...q){const p=srcPath(im);if(p){if(PIXEL_R306.test(p)){drew=true;stats.pixel++;}
   else if(p===path||p.endsWith(path)){if(done&&!mine){stats.hidden++;return;}drew=true;if(mine)toR259(e,this,im,q);}
   else{const lp=e.rc146BodyFrame?.path;if(!KEEP.test(p)&&(paths.has(p)||(lp&&p.endsWith(String(lp).replace(/^\.\//,'')))||STORY_BODY.test(p))){stats.hidden++;if(!drew&&!done)paintInside(this);return;}}}
  return prev.call(this,im,...q);};
 let r;try{r=base.apply(this,[e,...a]);}finally{if(own)c.drawImage=prev;else delete c.drawImage;}
 if(!drew&&!done)try{const f=()=>drawOwn(e,path);if(typeof c.scope==='function')c.scope(scopeOwner(e),f);else f();stats.after++;}catch(err){fail(err);}return r;};}

function zoneReport(){const rows=[];if(!Z?.chapters)return rows;for(const[k,list]of Object.entries(Z.chapters))for(const z of list||[])if(z.r355)rows.push({chapter:k,id:z.id,title:z.title,kind:z.kind,scale:z.r355.scale,before:z.r355.before,after:z.r355.after});return rows;}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_SAMONG_WIDE_R355__=Object.freeze({revision:REV,S_BASE,S_SCALED,PATH_K,widen,measure,isPath,artOf,zoneReport,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
