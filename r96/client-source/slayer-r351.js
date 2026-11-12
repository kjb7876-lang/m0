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
// R351 기존 경로의 판정·피해·범위·충돌·저장 형식은 유지한다. R377 남향 준비 변경은 아래 참조.
// 끄기(옛 그림으로): localStorage['storyworld.r351.slayer']='{"on":false}'
// R377: 승인된 남향 walk4/attack6만 추가. 남향 기본공격은 준비 320ms 뒤 native 전체 경로를 한 번 실행한다.
// CD 수치는 native 그대로이며 CD는 타격부터 시작하므로 남향 실효 공격 간격에는 준비 시간이 추가된다.
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_R351__)return;
const REV='R351-slayer-1',KEY='storyworld.r351.slayer',BASE='assets/r351/slayer/',HERO='slayer';
// R389: 남향은 R377 원화를 밝기만 맞춘 파생본(assets/r389/slayer, 원본 assets/r377 보존), 동향은 페르소나 W 원화 수평반전본(사용자 지시 '왼쪽은 좌우반전해서 본슬레이어영웅적용')을 쓴다.
//  동향 그림은 이미 오른쪽을 보므로 런타임에서 또 뒤집지 않는다(baked). 아직 안 받았으면 옛 W 뒤집기로 그린다. 피해·판정·쿨다운은 그대로.
const SOUTH_BASE='assets/r389/slayer/';
// R445(사용자 2026-11-09 "위로이동모션에 적용"): 북향(뒷모습) 걷기 4칸 = assets/r445/slayer(후보를 R389 남향과 밝기·대비·채도 맞춤). 화면 위 ±30도로 걸을 때만 쓰고, 공격·기술·대기·대각선은 그대로 좌·우.
//  끄기: localStorage['storyworld.r445.slayerNorth']='0'
const NORTH_BASE='assets/r445/slayer/';let northOn=true;try{if(localStorage.getItem('storyworld.r445.slayerNorth')==='0')northOn=false;}catch(_){}
let northIndex=null,northRequested=false;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,walk:0,idle:0,attack:0,skill:0,hurt:0,upDown:0,standIn:0,skipped:0,waiting:0,errors:0,dupRemoved:0,loads:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let IDX=null,idxReq=false;
let southIndex=null,southRequested=false,southCast=null,releasing=null,context=null;
const southStats={started:0,released:0,cancelled:0,lastCancel:null,lastAngle:null};
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.anims){IDX=j;preload(true);}else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
function loadSouth(){if(southRequested||typeof fetch!=='function')return;southRequested=true;fetch(SOUTH_BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j?.hero===HERO&&j.anims?.walk?.s&&j.anims?.attack?.s){southIndex=j;preload(true);}}).catch(fail);}
function loadNorth(){if(northRequested||!northOn||typeof fetch!=='function')return;northRequested=true;fetch(NORTH_BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j?.hero===HERO&&j.anims?.walk?.n?.file){northIndex=j;preload(true);}}).catch(fail);}
const northClip=()=>northIndex?.anims?.walk?.n||null;
const northReady=()=>{const c=northClip();return northOn&&!!(c&&ready(NORTH_BASE+c.file));};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const isHero=()=>typeof player==='object'&&player?.hero===HERO;
const asked=new Map();
function ready(p){try{const row=typeof readyImage==='function'?readyImage(p):null;return row?.image||null;}catch(_){return null;}}
function image(p){const im=ready(p);if(im)return im;try{const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);stats.loads++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
const rawClip=(a,d)=>d==='w'?IDX?.anims?.[a]?.w||null:southIndex?.anims?.[a]?.[d]||null;
const eReady=()=>!!southIndex&&['walk','attack'].every(a=>{const c=rawClip(a,'e');return !!(c&&ready(SOUTH_BASE+c.file));});
/* R425(사용자 2026-11-08 "우측 공격 이미지를 반전해서 좌측으로 쓰고 원래 좌측 공격 이미지는 보조 자세로만"): 공격은 좌·우 모두 E 원화(좌측 = 반전).
   옛 W 공격(v22)은 auxClip 으로 스킬·궁극기 보조 자세에만 쓴다. 걷기는 그대로(좌 = v5 W). */
const clip=(a,d='w')=>d==='s'?rawClip(a,'s'):(d==='e'||(a==='attack'&&d==='w'&&MIRROR_E))&&eReady()?rawClip(a,'e'):rawClip(a,'w');
const MIRROR_E=true,auxClip=()=>rawClip('attack','w');
/* R425: 대기 = 우측(E) 대기 칸, 좌측은 반전. 아래로 걷다 멈추면 남향 걷기 중 두 발이 땅에 붙은 칸(3번째, 실측 발 226px·옆 벌림 가장 좁음) */
const IDLE_S_FRAME=2;function idleClip(){if(S.walkDir==='n'&&northReady()){const A=northClip();return [A,'n',A.idle_frame??0];}if(S.walkDir==='s'&&southReady()){const A=rawClip('walk','s');if(A)return [A,'s',IDLE_S_FRAME];}if(eReady()){const A=rawClip('walk','e');if(A)return [A,S.h,A.idle_frame??1];}const A=clip('walk',S.h);return [A,S.h,A?.idle_frame??(A?A.n-1:0)];}
const baseFor=(d,A)=>A&&A===northClip()?NORTH_BASE:A?(A===rawClip('walk','w')||A===rawClip('attack','w')?BASE:SOUTH_BASE):d==='s'||(d==='e'&&eReady())?SOUTH_BASE:BASE;
let preloadedRoom=null;
function preload(force){if(!IDX||!isHero())return;loadSouth();let r=null;try{r=room;}catch(_){}if(!force&&preloadedRoom===r)return;preloadedRoom=r;loadNorth();{const N=northClip();if(N&&northOn)image(NORTH_BASE+N.file);}for(const a of ['walk','attack'])for(const d of ['w','s','e']){const A=rawClip(a,d);if(A?.file)image(baseFor(d,A)+A.file);}}
const S={x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,h:'w',walkDir:'w',swing:null,prevAtk:0};
// R336과 같은 화면 남향 ±30도. W/E 기억 S.h와 전역 R336 sticky 상태는 변경하지 않는다.
const screenSouth=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&y>1e-6&&Math.abs(x)<=y*Math.tan(Math.PI/6);
const screenNorth=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&y< -1e-6&&Math.abs(x)<=-y*Math.tan(Math.PI/6);
const angleSouth=a=>Number.isFinite(a)&&screenSouth(Math.cos(a)-Math.sin(a),(Math.cos(a)+Math.sin(a))*.5);
function cancelSouth(reason){if(southCast?.phase==='prepare'){southStats.cancelled++;southStats.lastCancel=reason;}southCast=null;}
function scope(){return {p:typeof player==='object'?player:null,r:typeof room==='object'?room:null,z:typeof zone==='string'?zone:null,l:typeof layer==='string'?layer:null,t:T()};}
function sameScope(a,b){return a.p===b.p&&a.r===b.r&&a.z===b.z&&a.l===b.l;}
function syncContext(){const n=scope();if(context&&(!sameScope(context,n)||n.t<context.t)){cancelSouth('context');Object.assign(S,{x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,walkDir:S.h,swing:null,prevAtk:0});}context=n;}
function southReady(){return !!southIndex&&['walk','attack'].every(a=>{const c=clip(a,'s');return !!(c&&ready(SOUTH_BASE+c.file));});}
function otherAction(){const p=player;return p.guard||p.skillAnim>0||p.dashAnim>0||p.ultimateAnim>0||p.hurtAnim>0||p.ego>0||p.samong>0||window.__STORYWORLD_SLAYER_R_TORNADO_R366__?.active?.()!=null;}
function canPrepare(){return on&&!!IDX&&southReady()&&solo()&&isHero()&&player.hp>0&&typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal)&&!(typeof loading!=='undefined'&&loading)&&!otherAction()&&!(player.attackCD>0);}
// Native index.html의 근접 표적 우선순위와 동일: 선택 표적, 그 다음 거리순. 상태는 쓰지 않는다.
function nativeAim(force){const h=typeof HEROES==='object'&&HEROES[player.hero];if(!h||!(h.melee||h.type==='blade'||h.type==='heavy')||typeof liveEnemies!=='function'||typeof clearLine!=='function'||typeof distance!=='function')return null;
 const candidates=liveEnemies().filter(e=>distance(e,player)<=h.range&&clearLine(player,e)),selected=typeof target!=='undefined'?target:null,e=candidates.find(v=>v.id===selected)||candidates.sort((a,b)=>distance(a,player)-distance(b,player))[0]||null;
 if(!e&&!force)return null;const angle=e?Math.atan2(e.y-player.y,e.x-player.x):typeof storyAim22==='function'?storyAim22():NaN;return {enemy:e,selected,angle};}
const INTERRUPT_POSES=['skill','dash','ultimate','hit','guard'],INTERRUPT_CDS=['blinkCD','specialCD','egoCD','samongCD'];
const actionStamp=()=>({poses:INTERRUPT_POSES.map(k=>player.poseStarted5?.[k]),cds:INTERRUPT_CDS.map(k=>+player[k]||0)});
function validPrepare(c){if(!canPrepare()||!sameScope(c,scope())||T()<c.t0||player.hp<c.hp||Math.hypot(player.x-c.x,player.y-c.y)>.12)return false;
 if(INTERRUPT_POSES.some((k,i)=>player.poseStarted5?.[k]!==c.stamp.poses[i])||INTERRUPT_CDS.some((k,i)=>(+player[k]||0)>c.stamp.cds[i]+1e-6))return false;
 const a=nativeAim(c.args[0]);return !!a&&a.enemy===c.enemy&&a.selected===c.selected&&angleSouth(a.angle);}
// 준비에는 CD/combo/attackAnim을 올리지 않는다. FX/proc observer도 실제 native 승인 때만 작동한다.
if(typeof basicAttack==='function'&&typeof tick==='function'){
 const base=basicAttack;basicAttack=function(...args){if(releasing)return base.apply(this,args);syncContext();
  if(southCast?.phase==='prepare'){if(!validPrepare(southCast))cancelSouth('invalidated');return;}
  if(!canPrepare())return base.apply(this,args);const a=nativeAim(args[0]);if(!a||!angleSouth(a.angle)){southCast=null;return base.apply(this,args);}
  southCast={...scope(),t0:T(),x:player.x,y:player.y,hp:player.hp,stamp:actionStamp(),enemy:a.enemy,selected:a.selected,args,self:this,phase:'prepare',angle:a.angle};S.swing=null;southStats.started++;
 };
 const baseTick=tick;tick=function(...args){syncContext();if(southCast?.phase==='prepare'&&!validPrepare(southCast))cancelSouth('interrupted');const r=baseTick.apply(this,args);syncContext();const c=southCast;
  if(c?.phase==='prepare'){if(!validPrepare(c)){cancelSouth('interrupted');return r;}
   const A=clip('attack','s'),pre=A.ms.slice(0,A.contact).reduce((a,b)=>a+b,0);
   if((T()-c.t0)*1000+1e-6>=pre){c.phase='releasing';releasing=c;
    try{basicAttack.apply(c.self,c.args);if(sameScope(c,scope())&&player.attackCD>0&&Number.isFinite(c.nativeAngle)&&angleSouth(c.nativeAngle)){c.phase='recover';c.hitAt=T();southStats.released++;southStats.lastAngle=c.nativeAngle;S.prevAtk=+player.attackAnim||0;}
     else cancelSouth('native-rejected');}catch(e){cancelSouth('native-error');fail(e);}finally{releasing=null;}
   }
  }return r;
 };
}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){if(releasing&&type==='slash'&&opt?.asset===(typeof VFX==='object'?VFX.slash:null)&&Number.isFinite(opt?.angle))releasing.nativeAngle=opt.angle;return base.apply(this,arguments);};}
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
   if(Math.abs(v[0])>Math.abs(v[1])*.35&&Math.abs(v[0])>.3)S.h=v[0]>0?'e':'w';else stats.upDown++;S.walkDir=screenSouth(v[0],v[1])?'s':screenNorth(v[0],v[1])?'n':S.h;}}
 S.x=player.x;S.y=player.y;}
const want=()=>(typeof actorHeight==='function'?actorHeight():66)*((window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98);
function draw(rec,st,best,anim,dir,frame,label,A0){let A=A0||clip(anim,dir),p=A&&baseFor(dir,A)+A.file,im=p&&image(p);
 if(!im&&dir!=='w'&&A!==rawClip(anim,'w')){if(dir==='s'||dir==='n')dir=S.h;A=rawClip(anim,'w');p=A&&BASE+A.file;im=p&&image(p);}
 if(!im&&anim!=='walk'){const W=clip('walk'),wp=W&&BASE+W.file,wi=wp&&ready(wp);if(wi){A=W;p=wp;im=wi;dir=S.h;frame=W.idle_frame??W.n-1;label='idle';stats.standIn++;}}
 label=label||anim;
 if(!im){stats.skipped++;return false;}
 const n=A.n,fr=((frame%n)+n)%n,cw=A.cell[0],ch=A.cell[1],col=fr%A.cols,row=Math.floor(fr/A.cols);
 const k=want()/(A.body||180),q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want()*.65),fx=q.x,fy=q.y-lift,f=dir==='s'||dir==='n'?1:((dir==='e')===!!A.baked?1:-1),/* R425: 원화가 보는 쪽(baked=오른쪽)과 그릴 쪽이 다르면 반전 */[ax,ay]=A.anchor;
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
 if(!southCast&&atk>S.prevAtk+1e-6&&A){const d=aimSide(),SA=clip('attack',d)||A,off=contactStart(SA),rest=SA.ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.69);S.swing={t0:t,dir:d,A:SA,off,scale:Math.max(.36,Math.min(1,cd*.95*1000/rest))};}
 S.prevAtk=atk;
 const M=window.__STORYWORLD_HERO_MOTION_R895__,moving=t-S.movedAt<.15&&!M?.attackOverTail?.()/* R895 규칙 5 */;
 const skillCut=!(player.dashAnim>0)&&!!M?.moveCancel?.('skill');/* R895 규칙 2 */
 if(busy&&!skillCut){stats.skill++;if(player.dashAnim>0){S.swing=null;/* R895 규칙 4: 대시가 공격을 끊고, 실제로 옮긴 쪽을 본다 */const dd=M?.dash?.()?.side,d=dd||(moving?S.h:aimSide());return draw(rec,st,best,'walk',d,3);}const d=aimSide(),BA=auxClip()||clip('attack',d)||A;stats.aux=(stats.aux||0)+1;return draw(rec,st,best,'attack',d,BA?.contact??3,undefined,BA);}
 if(southCast){const C=clip('attack','s'),pre=C.ms.slice(0,C.contact).reduce((a,b)=>a+b,0),tot=C.ms.reduce((a,b)=>a+b,0),el=southCast.phase==='prepare'?Math.min(pre-1,(t-southCast.t0)*1000):pre+(t-southCast.hitAt)*1000;
  if(el<tot)return draw(rec,st,best,'attack','s',frameAt(C.ms,el,false));southCast=null;}
 if(S.swing){const SA=S.swing.A||A,el=(t-S.swing.t0)*1000/S.swing.scale+S.swing.off,tot=SA.ms.reduce((x,y)=>x+y,0);
  /* R895 규칙 1 예외: 슬레이어는 피격 시트가 없고(옛 R143 피격 그림은 칼 없는 다른 화풍) 광전사라 기본 공격 중 피격에 밀리지 않는다(슈퍼아머) */
  if(el<tot&&!(moving&&(M?M.moveCancel('attack'):t-S.swing.t0>.35)))return draw(rec,st,best,'attack',S.swing.dir,frameAt(SA.ms,el,false),undefined,SA);S.swing=null;}
 if(moving){const d=S.walkDir==='s'&&southReady()&&!otherAction()?'s':S.walkDir==='n'&&northReady()&&!otherAction()?'n':S.h,W=(d==='n'?northClip():clip('walk',d))||Wk,k=want()/(W?.body||180),per=(W?.stride?.px_per_frame||18)*k;return draw(rec,st,best,'walk',d,Math.floor(S.dist/Math.max(1,per)),undefined,W);}
 if(hurt>0)stats.hurt++;
 const v=enemyVec();if(v)side(v[0],v[1]);
 const [Wi,di,fi]=idleClip();return draw(rec,st,best,'walk',di,fi,'idle',Wi||Wk);}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){syncContext();if(southCast&&(!on||!isHero()||!solo()||!(player.hp>0)||otherAction()))cancelSouth('draw-interrupted');const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&solo()&&isHero()&&player.hp>0){loadIndex();if(IDX)choose(rec,st);}}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_SLAYER_R351__=Object.freeze({revision:REV,active:()=>on&&!!IDX&&isHero()&&solo(),index:()=>IDX,state:()=>({...S,swing:S.swing&&{...S.swing}}),
 inspect:()=>({revision:REV,on,ready:!!IDX,south:{revision:southIndex?.revision||null,ready:southReady(),eastReady:eReady(),northReady:northReady(),northRevision:northIndex?.revision||null,phase:southCast?.phase||null,stats:{...southStats}},loaded:{walk:!!(clip('walk')&&ready(BASE+clip('walk').file)),attack:!!(clip('attack')&&ready(BASE+clip('attack').file))},stats:{...stats},lastError}),
 preload:()=>{preloadedRoom=null;preload(true);},
 set:v=>{on=v!==false;if(!on)cancelSouth('disabled');try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
