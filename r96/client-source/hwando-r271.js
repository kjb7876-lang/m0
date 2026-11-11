// R271 환도 통합 v2 정리판 적용 — 사용자 2026-11-03 "구글드라이브에 환도신자산올라오면 그걸로 모두교체 디테일이랑 너가 보정개선해서 적용".
// 원천: Drive 'Hwando Unified v2 polish' 8팩 + 변경 없는 walk-S v1 (SHA-256 확인) → scripts/r271-hwando-build.py → assets/r271/hwando/*.webp + index.json.
//  걷기 N/E/W 12키·S 8키, 대기 N/S/E/W(W 는 원천에서도 E 표시 미러), 공격 E 12키. 클립마다 몸 키를 180px 로 한 번 등비 축소(원천 212~242px 로 들쭉날쭉),
//  발 기준점 = 원천 고정 등록점 x · 접지선 중앙값 y.
// 게임에 맞춘 것(R242 방식을 그대로 이어 받음):
//  · 방향: 화면 이동 벡터(걷기) / 가까운 적(4칸 안, 공격·피격) / 마지막 방향. W 는 새 W 그림이 있으면 그것, 없으면 E 를 뒤집는다(공격).
//  · 걷기: 화면에서 움직인 거리로 칸을 넘긴다(보폭 index.stride, 미끄러짐 방지). 멈추면 대기.
//  · 공격: 판정은 누르는 순간(엔진) — 준비 동작을 접촉 90ms 전까지 건너뛰고 다음 공격 전에 끝나게 빠르게 재생. 판정·피해·범위는 바꾸지 않는다.
//  · 새 팩에 없는 것(N/S 공격, 피격)은 R242 그림을 같은 몸 키로 그린다. 전투 준비 자세는 새 대기와 겹치지 않게 쓰지 않는다(서 있으면 늘 새 대기).
// 이 오버레이가 켜져 있으면 R242 는 그리지 않는다(R242 index 만 대체 그림 목록으로 빌림). 판정·충돌·저장 형식은 바꾸지 않는다.
// 끄기(R242 그림으로): localStorage['storyworld.r271.hwando']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_R271__)return;
const REV='R271-hwando-1',KEY='storyworld.r271.hwando',BASE='assets/r271/hwando/',OLD='assets/r242/hwando/';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,walk:0,idle:0,attack:0,hit:0,skill:0,fallback:0,waiting:0,errors:0,dupRemoved:0,loads:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let IDX=null,idxReq=false;
/* R436: 아래 걷기 v2 — 별도 색인(assets/r436/hwando/index.json, R271 몸 키 180·발 기준점·R283 색 목표에 맞춘 6키) */
const WS_BASE='assets/r436/hwando/';let WS=null,wsReq=false;
function loadWalkS(){if(WS||wsReq||typeof fetch!=='function')return;wsReq=true;fetch(WS_BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j?.walk?.s?.file)WS=j.walk.s;else wsReq=false;}).catch(e=>{wsReq=false;fail(e);});}
const wsRes=()=>WS?{A:WS,base:WS_BASE,mir:false}:null;
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.anims)IDX=j;else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const asked=new Map();
/* R440(사용자 2026-11-09 "환도영웅에 옛 이미지 갑자기 등장 버그"): 지역에 들어서면 엔진 그림 캐시가 다시 채워지는 몇 프레임 동안 readyImage 가 비어
   R271 이 그리지 못하고 엔진 옛 그림(hero-authored v314 아틀라스)이 2~3프레임 튀었다 → 한 번 받은 환도 그림은 여기서 쥐고 있다가 그때 쓴다. */
const KEEP=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image){if(!KEEP.has(p))KEEP.set(p,row.image);return row.image;}{const k=KEEP.get(p);if(k&&(k.naturalWidth||k.width)){stats.kept=(stats.kept||0)+1;return k;}}const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);stats.loads++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
// 동작·방향 → 그림 (새 팩 → W 는 E 미러 → R242 대체)
function res(anim,dir){const N=IDX?.anims?.[anim];if(N?.[dir]?.file)return {A:N[dir],base:BASE,mir:false};if(dir==='w'&&N?.e?.file)return {A:N.e,base:BASE,mir:true};
 const O=window.__STORYWORLD_HWANDO_R242__?.index?.(),dk=dir==='w'?'e':dir,A=O?.anims?.[anim]?.[dk]||O?.anims?.[anim]?.s;if(!A)return null;return {A,base:OLD,mir:dir==='w',body:O.anims.walk?.[dk]?.body||A.body||180,old:true};}
const S={x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,dir:'s',walkDir:'s',swing:null,hit:null,prevAtk:0,prevHurt:0};
function dirFromVec(vx,vy){if(Math.abs(vx)>=Math.abs(vy))return vx>=0?'e':'w';return vy>=0?'s':'n';}
// R441(사용자 2026-11-09 "대각 이동 모션 없는 영웅은 대각선 이동 시 좌·우 이동 모션, 위아래가 확실할 때만 위아래"): 환도는 대각 걷기 그림이 없어
//  45° 경계에서 위·아래 걷기로 바뀌었다 → 화면 세로에서 ±30° 안(슬레이어 R351 screenSouth 와 같은 폭)일 때만 위·아래, 나머지는 좌·우. 끄기 storyworld.r441.diagWalk {"on":false}
const DIAG441=(()=>{try{return JSON.parse(localStorage.getItem('storyworld.r441.diagWalk')||'{}').on!==false;}catch(_){return true;}})(),VERT441=Math.tan(Math.PI/3);
function walkFromVec(vx,vy){if(!DIAG441)return dirFromVec(vx,vy);if(Math.abs(vy)>Math.abs(vx)*VERT441)return vy>=0?'s':'n';return vx>=0?'e':'w';}
function enemyDir(){const v=enemyVec();return v?dirFromVec(v[0],v[1]):null;}
function enemyVec(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false||e.spawnState==='hidden')continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);return [b.x-q.x,b.y-q.y];}}catch(_){}return null;}
const P277=()=>{const P=window.__STORYWORLD_HWANDO_R277__;return P?.on?.()?P:null;};
// R277: 공격 방향은 좌·우·아래만(위 → 가로 성분의 좌·우)
function aimDir(){const v=enemyVec(),d=v?dirFromVec(v[0],v[1]):S.dir,P=P277();return P?P.attackDir(d,v?v[0]:0):d;}
function track(){const t=T();if(S.x!=null){const dx=player.x-S.x,dy=player.y-S.y,d=Math.hypot(dx,dy);
  if(d>1e-4&&d<1.2){const q0=project(S.x,S.y),q1=project(player.x,player.y),px=q1.x-q0.x,py=q1.y-q0.y;S.sx=S.sx*.6+px*.4;S.sy=S.sy*.6+py*.4;if(d>.004)S.movedAt=t;
   S.dist+=Math.hypot(px,py);const mvx=+player.moveVX150||0,mvy=+player.moveVY150||0;let v=[S.sx,S.sy];if(Math.hypot(mvx,mvy)>.05){const a=project(player.x,player.y),b=project(player.x+mvx,player.y+mvy);v=[b.x-a.x,b.y-a.y];}
   const nd=walkFromVec(v[0],v[1]);if(nd!==S.walkDir){S.pend=(S.pendDir===nd?(S.pend||0)+1:1);S.pendDir=nd;if(S.pend>=2){S.walkDir=nd;S.pend=0;}}else S.pend=0;}}
 S.x=player.x;S.y=player.y;}
const want=()=>(typeof actorHeight==='function'?actorHeight():66)*((window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98);
function draw(rec,st,best,anim,dir,frame,opt={}){const ws=anim==='walk'&&dir==='s'&&opt.s?wsRes():null;/* R436: 아래 걷기만 새 v2 */if(dir==='s'&&!ws){const P=P277();if(P?.down)dir=P.down();}/* R349: 그 밖의 아래 그림은 쓰지 않는다(위·좌·우만) */const R=ws||res(anim,dir);if(!R)return false;const A=R.A,p=(window.__STORYWORLD_HWANDO_R283__?.path?.(R.base,A.file))||R.base+A.file,im=image(p);/* R283 색 맞춘 파생본 */if(!im){/* R345: 공격·피격 그림이 아직 안 받아졌으면 엔진 옛 그림 대신 이미 받은 같은 방향 걷기 선 자세로(옛 그림이 한 순간 튀지 않게) */if(!opt.fb&&anim!=='walk'){stats.standIn=(stats.standIn||0)+1;const w=res('walk',dir)?.A;if(w&&draw(rec,st,best,'walk',dir,Math.min(3,w.n-1),{fb:true}))return true;}return false;}
 const n=A.n,fr=((frame%n)+n)%n,cw=A.cell[0],ch=A.cell[1],col=fr%A.cols,row=Math.floor(fr/A.cols);
 const body=R.body||A.body||180,w=want(),k=w/body,ky=opt.breath?k*(1+.008*Math.sin(T()*2.2)):k;
 const q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),w*.65),fx=q.x,fy=q.y-lift,f=R.mir?-1:1,[ax,ay]=A.anchor;
 const X=v=>fx+f*(v-ax)*k,Y=v=>fy+(v-ay)*ky,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[col*cw,row*ch,cw,ch],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],r271:anim,r121Walk:anim==='walk',r277Hold:!!opt.hold});
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before){rec.commands.splice(i,1);stats.dupRemoved++;}}
 stats.frames++;stats[anim]=(stats[anim]||0)+1;if(R.old)stats.fallback++;stats.last={anim,dir,frame:fr,old:!!R.old};return true;}
function frameAt(ms,tms,loop){const tot=ms.reduce((a,b)=>a+b,0);let t=loop?((tms%tot)+tot)%tot:Math.min(tms,tot-1);for(let i=0;i<ms.length;i++){if(t<ms[i])return i;t-=ms[i];}return ms.length-1;}
function contactStart(ms){let c=ms.findIndex((m,i)=>i>1&&m<=40);if(c<0)c=Math.floor(ms.length*.4);let pre=0;for(let i=0;i<c;i++)pre+=ms[i];return Math.max(0,pre-90);}
const BODY_ART=/r436\/hwando\/|hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/attack\/|r242\/hwando\/|r271\/hwando\/|awakening|^blob:/;
function pickBody(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
let preloaded=null;
function preload(){if(!IDX||preloaded===room)return;preloaded=room;for(const a of (P277()?['walk']:['walk','idle']))for(const d of ['n','s','e','w']){const A=IDX.anims[a]?.[d];if(A?.file)image((window.__STORYWORLD_HWANDO_R283__?.path?.(BASE,A.file))||BASE+A.file);}
 if(WS)image(WS_BASE+WS.file);/* R436 */
 /* R345: 공격·피격(새 팩 → R242 대체 포함)도 미리 받는다 — 처음 휘두르거나 맞는 순간 옛 그림이 튀던 원인 */for(const a of ['attack','hit'])for(const d of ['n','s','e','w']){const R=res(a,d);if(R?.A?.file)image((window.__STORYWORLD_HWANDO_R283__?.path?.(R.base,R.A.file))||R.base+R.A.file);}}
const atkOf=d=>res('attack',d)?.A;
function choose(rec,st){const best=pickBody(rec,st);if(!best)return;const t=T(),ms=1000;
 track();preload();
 const atk=+player.attackAnim||0,hurt=+player.hurtAnim||0,busy=player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0;
 if(atk>S.prevAtk+1e-6){const d=aimDir(),a=atkOf(d);if(a){const off=contactStart(a.ms),rest=a.ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.48);S.swing={t0:t,dir:d,off,scale:Math.max(.36,Math.min(1,cd*.95*1000/rest))};}}
 S.prevAtk=atk;
 if(hurt>S.prevHurt+1e-6)S.hit={t0:t,dir:enemyDir()||S.dir};S.prevHurt=hurt;
 const moving=t-S.movedAt<.15;
 if(busy){const d=player.dashAnim>0?(enemyDir()||S.dir):aimDir();S.dir=d;stats.skill++;if(player.dashAnim>0)return draw(rec,st,best,'walk',d,3);const a=atkOf(d);return a&&draw(rec,st,best,'attack',d,Math.floor(a.n*(player.ultimateAnim>0?.55:.45)));}
 if(S.swing){const a=atkOf(S.swing.dir),el=(t-S.swing.t0)*ms/S.swing.scale+S.swing.off,tot=a.ms.reduce((x,y)=>x+y,0);
  if(el<tot&&!(moving&&t-S.swing.t0>.35)){S.dir=S.swing.dir;return draw(rec,st,best,'attack',S.swing.dir,frameAt(a.ms,el,false));}S.swing=null;}
 if(S.hit&&!moving){const d=S.hit.dir,h=res('hit',d)?.A,el=(t-S.hit.t0)*ms/.6;if(h&&el<h.ms.reduce((x,y)=>x+y,0)){S.dir=d;return draw(rec,st,best,'hit',d,frameAt(h.ms,el,false));}S.hit=null;}
 if(moving){const P=P277();S.dir=P?.walkDir?P.walkDir(S.walkDir,S.sx):S.walkDir;P?.face(S.dir);const ws=S.dir==='s'?wsRes():null,R=ws||res('walk',S.dir),k=want()/(R?.A?.body||180),fps=R?.A?.frames_per_stride,per=(IDX.anims.walk?.stride?.px_per_frame||12.8)*k*(fps?(IDX.anims.walk?.stride?.frames_per_stride||12)/fps:1);/* R436: 6키 = 두 걸음 → 칸당 거리 2배(보폭 같게) */return draw(rec,st,best,'walk',S.dir,Math.floor(S.dist/Math.max(1,per)),{s:!!ws});}
 const fd=enemyDir()||S.dir;S.dir=fd;const P=P277();if(P){P.face(fd);const I=window.__STORYWORLD_HWANDO_R283__?.idle?.(P),dd=I?I.dir:fd;S.dir=dd;/* R354: 날개(R101) 등이 실제로 그린 선 자세 방향을 보게 */const w=res('walk',dd)?.A;if(!w)return;P.idle(dd);return draw(rec,st,best,'walk',dd,I?Math.min(I.frame,w.n-1):w.n-1);}/* R283: 좌·우 걷기의 선 자세 칸 *//* R277: 걷기 마지막 칸으로 멈춘 대기 */const a=res('idle',fd)?.A;if(!a)return;
 return draw(rec,st,best,'idle',fd,frameAt(a.ms,t*ms,true),{breath:true});}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&solo()&&player?.hero==='hwando'&&player.hp>0){loadIndex();if(P277()?.walkS?.())loadWalkS();if(IDX)choose(rec,st);}}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_HWANDO_R271__=Object.freeze({revision:REV,active:()=>on&&!!IDX&&typeof player==='object'&&player?.hero==='hwando'&&solo(),index:()=>IDX,state:()=>({...S,swing:S.swing&&{...S.swing},hit:S.hit&&{...S.hit}}),
 inspect:()=>({revision:REV,on,ready:!!IDX,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
