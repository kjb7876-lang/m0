// R351 슬레이어 새 이동·공격 모션 — 사용자 2026-11-05 "슬레이어 신규자산 드라이브에 받아서 적용하는데 일단좌우이동및 공격신규모션은 적용하고
//  위아래모션은 일관성있는거 있으면 적용 없다면 좌우로만 나오게해줘" (요청서 CX-0028: 공격 v22·왼쪽 걷기 v5, 색감만 맞춰 적용).
// 원천: Drive 'Slayer_attack_v22_straight_sword.zip'(6칸) + 'Slayer_left-v5_candidate.zip'(8칸), 둘 다 왼쪽(W) 한 방향 320×256 → scripts/r351-slayer-build.py
//  → assets/r351/slayer/{walk-w,attack-w}.webp + index.json(색 맞춤·몸 키 180·발 기준점·보폭·대기 칸·접촉 칸·원천 sha256).
// 방향: 새 묶음에 위·아래 그림이 없다 → 슬레이어는 좌·우만 그린다(오른쪽 = 왼쪽 뒤집기).
//  · 이동: 화면 이동 벡터의 가로 성분으로 좌·우(거의 세로로만 걸으면 마지막 좌·우 그대로 걷기 칸을 넘긴다).
//  · 공격·기술: 엔진이 고른 방향(player.direction, R336)이 좌·우면 그대로, 위·아래면 가까운 적(4칸 안)의 화면 가로 차이 부호(|dx|≤2px 이면 마지막 좌·우).
//  · 대기·피격: 걷기 7번째 칸(두 발이 모인 선 자세)으로 마지막 좌·우. 피격·죽음 전용 새 그림은 없어 옛 그림을 섞지 않는다(죽음은 엔진 그대로).
// 게임에 맞춘 것(R271 환도 방식): 걷기는 화면에서 움직인 거리로 칸을 넘긴다(보폭 index.stride, 발 미끄러짐 방지),
//  공격은 판정이 누르는 순간(엔진)이므로 접촉 칸(index.contact, 검이 가장 멀리 뻗은 4번째 칸) 90ms 전부터 재생하고 다음 공격 전에 끝나게 빠르게 돌린다.
//  방에 들어갈 때 두 그림을 미리 받고, 아직 안 받은 그림은 받아 둔 걷기 선 자세로 대신 그린다(옛 슬레이어 그림이 번쩍 보이지 않게).
// 판정·피해·범위·충돌·저장 형식은 바꾸지 않는다. 끄기(옛 그림으로): localStorage['storyworld.r351.slayer']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_R351__)return;
const REV='R351-slayer-1',KEY='storyworld.r351.slayer',BASE='assets/r351/slayer/',HERO='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,walk:0,idle:0,attack:0,skill:0,hurt:0,upDown:0,standIn:0,skipped:0,waiting:0,errors:0,dupRemoved:0,loads:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let IDX=null,idxReq=false;
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.anims){IDX=j;preload(true);}else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const isHero=()=>typeof player==='object'&&player?.hero===HERO;
const asked=new Map();
function ready(p){try{const row=typeof readyImage==='function'?readyImage(p):null;return row?.image||null;}catch(_){return null;}}
function image(p){const im=ready(p);if(im)return im;try{const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);stats.loads++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
const clip=a=>IDX?.anims?.[a]?.w||null;
let preloadedRoom=null;
function preload(force){if(!IDX||!isHero())return;let r=null;try{r=room;}catch(_){}if(!force&&preloadedRoom===r)return;preloadedRoom=r;for(const a of ['walk','attack']){const A=clip(a);if(A?.file)image(BASE+A.file);}}
const S={x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,h:'w',swing:null,prevAtk:0};
function enemyVec(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of (typeof liveEnemies==='function'?liveEnemies():room?.enemies)||[]){if(!(e?.hp>0)||e.visible===false||e.spawnState==='hidden')continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);return [b.x-q.x,b.y-q.y];}}catch(_){}return null;}
// 좌·우만: 가로 성분 부호, 작으면 마지막 좌·우
function side(dx,dy){if(Math.abs(+dx||0)>2){if(dy!=null&&Math.abs(dy)>Math.abs(dx))stats.upDown++;S.h=dx>0?'e':'w';}else if(dy!=null&&Math.abs(dy)>2)stats.upDown++;return S.h;}
// 공격 방향: 엔진이 방금 정한 player.direction(R336 기준 좌·우 240°)이 left/right 면 그대로, front/back(위·아래)이면 가까운 적의 화면 가로 차이, 그것도 없으면 마지막 좌·우
function aimSide(){const d=player?.direction;if(d==='left'){S.h='w';return S.h;}if(d==='right'){S.h='e';return S.h;}if(d==='front'||d==='back')stats.upDown++;const v=enemyVec();if(v)return side(v[0],v[1]);return S.h;}
function track(){const t=T();if(S.x!=null){const dx=player.x-S.x,dy=player.y-S.y,d=Math.hypot(dx,dy);
  if(d>1e-4&&d<1.2){const q0=project(S.x,S.y),q1=project(player.x,player.y),px=q1.x-q0.x,py=q1.y-q0.y;S.sx=S.sx*.6+px*.4;S.sy=S.sy*.6+py*.4;if(d>.004)S.movedAt=t;
   S.dist+=Math.hypot(px,py);const mvx=+player.moveVX150||0,mvy=+player.moveVY150||0;let v=[S.sx,S.sy];if(Math.hypot(mvx,mvy)>.05){const a=project(player.x,player.y),b=project(player.x+mvx,player.y+mvy);v=[b.x-a.x,b.y-a.y];}
   // 가로 성분이 세로의 0.35배를 넘을 때만 좌·우를 바꾼다(거의 세로 이동은 마지막 좌·우 유지)
   if(Math.abs(v[0])>Math.abs(v[1])*.35&&Math.abs(v[0])>.3)S.h=v[0]>0?'e':'w';else stats.upDown++;}}
 S.x=player.x;S.y=player.y;}
const want=()=>(typeof actorHeight==='function'?actorHeight():66)*((window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98);
function draw(rec,st,best,anim,dir,frame,label){let A=clip(anim),p=A&&BASE+A.file,im=p&&image(p);
 if(!im&&anim!=='walk'){const W=clip('walk'),wp=W&&BASE+W.file,wi=wp&&ready(wp);if(wi){A=W;p=wp;im=wi;frame=W.idle_frame??W.n-1;label='idle';stats.standIn++;}}
 label=label||anim;
 if(!im){stats.skipped++;return false;}
 const n=A.n,fr=((frame%n)+n)%n,cw=A.cell[0],ch=A.cell[1],col=fr%A.cols,row=Math.floor(fr/A.cols);
 const k=want()/(A.body||180),q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want()*.65),fx=q.x,fy=q.y-lift,f=dir==='e'?-1:1,[ax,ay]=A.anchor;
 const X=v=>fx+f*(v-ax)*k,Y=v=>fy+(v-ay)*k,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[col*cw,row*ch,cw,ch],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],r351:label,r121Walk:label==='walk'});
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before){rec.commands.splice(i,1);stats.dupRemoved++;}}
 stats.frames++;stats[label]=(stats[label]||0)+1;stats.last={anim:label,dir,frame:fr};return true;}
function frameAt(ms,tms,loop){const tot=ms.reduce((a,b)=>a+b,0);let t=loop?((tms%tot)+tot)%tot:Math.min(tms,tot-1);for(let i=0;i<ms.length;i++){if(t<ms[i])return i;t-=ms[i];}return ms.length-1;}
function contactStart(A){const c=Number.isInteger(A.contact)?A.contact:Math.floor(A.n*.5);let pre=0;for(let i=0;i<c;i++)pre+=A.ms[i];return Math.max(0,pre-90);}
// 영웅 몸 그림 명령: R271 과 같은 몸 그림 경로 + 슬레이어 이름이 든 옛 몸 그림(이펙트·실·기술 띠는 뺀다). 가장 키 큰 것.
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r130\/[a-z]+\/|r143\/(?:attack|hit)\/|r351\/slayer\/|^blob:/;
const NOT_BODY=/fx|effect|thread|pixel|r292|r302|r163|skill|ultimate|death/;
function pickBody(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const s=String(c.sourcePath||c.image?.src||'');
  if(!(BODY_ART.test(s)||(/slayer/.test(s)&&!NOT_BODY.test(s))))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
function choose(rec,st){const best=pickBody(rec,st);if(!best)return;const t=T();
 track();preload(false);
 const atk=+player.attackAnim||0,hurt=+player.hurtAnim||0,busy=player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0,A=clip('attack'),Wk=clip('walk');
 if(atk>S.prevAtk+1e-6&&A){const d=aimSide(),off=contactStart(A),rest=A.ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.69);S.swing={t0:t,dir:d,off,scale:Math.max(.36,Math.min(1,cd*.95*1000/rest))};}
 S.prevAtk=atk;
 const moving=t-S.movedAt<.15;
 if(busy){stats.skill++;if(player.dashAnim>0){const d=moving?S.h:aimSide();return draw(rec,st,best,'walk',d,3);}const d=aimSide();return draw(rec,st,best,'attack',d,A?.contact??3);}
 if(S.swing){const el=(t-S.swing.t0)*1000/S.swing.scale+S.swing.off,tot=A.ms.reduce((x,y)=>x+y,0);
  if(el<tot&&!(moving&&t-S.swing.t0>.35))return draw(rec,st,best,'attack',S.swing.dir,frameAt(A.ms,el,false));S.swing=null;}
 if(moving){const k=want()/(Wk?.body||180),per=(Wk?.stride?.px_per_frame||18)*k;return draw(rec,st,best,'walk',S.h,Math.floor(S.dist/Math.max(1,per)));}
 if(hurt>0)stats.hurt++;
 const v=enemyVec();if(v)side(v[0],v[1]);
 return draw(rec,st,best,'walk',S.h,Wk?.idle_frame??(Wk?Wk.n-1:0),'idle');}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&solo()&&isHero()&&player.hp>0){loadIndex();if(IDX)choose(rec,st);}}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_SLAYER_R351__=Object.freeze({revision:REV,active:()=>on&&!!IDX&&isHero()&&solo(),index:()=>IDX,state:()=>({...S,swing:S.swing&&{...S.swing}}),
 inspect:()=>({revision:REV,on,ready:!!IDX,loaded:{walk:!!(clip('walk')&&ready(BASE+clip('walk').file)),attack:!!(clip('attack')&&ready(BASE+clip('attack').file))},stats:{...stats},lastError}),
 preload:()=>{preloadedRoom=null;preload(true);},
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
