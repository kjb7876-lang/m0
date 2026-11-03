// R242 환도 최신 선택 자산 적용 — 사용자 2026-11-03 "환도 최신 자산을 받아 디테일을 개선한 뒤 현재 StoryWorld 프로젝트에 적용".
// 원천: Drive 'Hwando-Claude-Selected-Download-Index-v1' 의 10팩(SHA-256 확인) → scripts/r242-hwando-build.py → assets/r242/hwando/*.webp + index.json.
//  사용자의 4방향 8프레임 걷기·짧게 고친 정면 손잡이를 기준으로, 대기(12)·피격(12)·전투 준비(N·E 12)·공격(S·E 12, N 24)을 같은 키·같은 발 기준점으로 그린다.
//  W 는 원천도 E 의 표시 미러라 E 를 좌우로 뒤집어 그린다(같은 그림을 두 번 올리지 않음).
// 게임에 맞춘 것:
//  · 방향: 화면 이동 벡터(걷기) / 가까운 적(4칸 안, 공격·준비·피격) / 마지막 방향 → 가로가 세로 이상이면 E·W, 아니면 N·S.
//  · 걷기: 시간 대신 '화면에서 실제로 움직인 거리'로 칸을 넘긴다 — 원화 보폭(E 두 발 디딤 칸의 발 간격 43.5px, 칸당 10.9px)×그림 배율만큼
//    움직일 때 한 칸 → 디딘 발이 바닥에서 미끄러지지 않는다(속도가 바뀌어도). 멈추면 대기로.
//  · 발 기준점: 동작마다 잰 접지선·몸 중심(index.json anchor)을 영웅 발 위치(project(player))에 놓는다. 키는 방향별 걷기 몸 키로 통일(비율 유지).
//  · 공격: 엔진은 누르는 순간 바로 판정한다(basicAttack, 0.24초 자세·간격 0.48초×속도). 그래서 휘두르기 앞부분(준비 동작)을 접촉 90ms 전까지 건너뛰고,
//    남은 동작이 다음 공격 전에 끝나도록 빠르게(최대 2.8배) 재생한다 — 칼이 닿는 칸이 판정 순간과 맞는다. 판정·피해·범위는 바꾸지 않는다.
//  · 피격: 맞은 순간부터 원화 800ms 를 0.6배 시간(480ms)에. 걷거나 공격하면 그쪽이 이긴다.
//  · 대기 ↔ 전투 준비(N·E·W): 적이 7칸 안에 있거나 3초 안에 싸웠으면 준비, 아니면 대기. 원화에는 둘 사이 연결이 없어(README '미연결')
//    가장 가까운 칸 쌍 사이 3장 전환 칸(빌드 스크립트가 섞어 만든 새 칸, 120ms 씩)을 거친다. S 는 준비 동작이 없어 대기를 쓴다.
//  · 기술·대시·궁극기는 이전(R143)처럼 공격 칸·걷기 칸을 빌려 쓴다(새 그림으로). 죽음은 R151 그대로.
// 텍스처: 엔진 이미지 캐시(경로 키)로만 받는다 — 걷기·대기 3방향만 먼저, 나머지는 그 상태가 처음 필요할 때. 이 오버레이가 켜져 있으면
//  R143·R119 는 환도의 옛 시트를 그리거나 미리 받지 않는다(중복 로딩 방지). 판정·충돌·저장 형식은 바꾸지 않는다.
// 끄기(이전 그림으로): localStorage['storyworld.r242.hwando']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_R242__)return;
const REV='R242-hwando-1',KEY='storyworld.r242.hwando',BASE='assets/r242/hwando/';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,walk:0,idle:0,ready:0,attack:0,hit:0,trans:0,skill:0,waiting:0,errors:0,dupRemoved:0,loads:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let IDX=null,idxReq=false;
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.anims)IDX=j;else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);stats.loads++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
function want(list){for(const p of list)image(p);}
// 상태·방향
const S={x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,dir:'s',walkDir:'s',swing:null,hit:null,mode:'idle',trans:null,combatAt:-99,prevAtk:0,prevHurt:0};
function dirFromVec(vx,vy){if(Math.abs(vx)>=Math.abs(vy))return vx>=0?'e':'w';return vy>=0?'s':'n';}
function enemyDir(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false||e.spawnState==='hidden')continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);return dirFromVec(b.x-q.x,b.y-q.y);}}catch(_){}return null;}
function inCombat(){if(T()-S.combatAt<3)return true;try{if(room?.engaged)return true;for(const e of room?.enemies||[])if(e?.hp>0&&e.spawnState==='active'&&Math.hypot(e.x-player.x,e.y-player.y)<7)return true;}catch(_){}return false;}
function track(){const t=T();if(S.x!=null){const dx=player.x-S.x,dy=player.y-S.y,d=Math.hypot(dx,dy);
  if(d>1e-4&&d<1.2){const q0=project(S.x,S.y),q1=project(player.x,player.y),px=q1.x-q0.x,py=q1.y-q0.y;S.sx=S.sx*.6+px*.4;S.sy=S.sy*.6+py*.4;if(d>.004)S.movedAt=t;
   // 화면에서 움직인 거리(px)를 걷기 칸 넘김에 쓴다 — 줌이 바뀌어도 그림 배율(k)과 같은 단위
   S.dist+=Math.hypot(px,py);const mvx=+player.moveVX150||0,mvy=+player.moveVY150||0;let v=[S.sx,S.sy];if(Math.hypot(mvx,mvy)>.05){const a=project(player.x,player.y),b=project(player.x+mvx,player.y+mvy);v=[b.x-a.x,b.y-a.y];}
   const nd=dirFromVec(v[0],v[1]);if(nd!==S.walkDir){S.pend=(S.pendDir===nd?(S.pend||0)+1:1);S.pendDir=nd;if(S.pend>=2){S.walkDir=nd;S.pend=0;}}else S.pend=0;}}
 S.x=player.x;S.y=player.y;}
// 그림 칸 하나를 몸 자리에 놓는다
function draw(rec,st,best,anim,dir,frame,opt={}){const set=IDX?.anims?.[anim];if(!set)return false;const mir=dir==='w',dk=mir?'e':dir,A=set[dk];if(!A)return false;const p=BASE+A.file,im=image(p);if(!im)return false;
 const n=A.n,fr=((frame%n)+n)%n,cw=A.cell[0],ch=A.cell[1],col=fr%A.cols,row=Math.floor(fr/A.cols);
 const body=IDX.anims.walk?.[dk]?.body||A.body||180,stand=(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98,want=(typeof actorHeight==='function'?actorHeight():66)*stand,k=want/body,ky=opt.breath?k*(1+.008*Math.sin(T()*2.2)):k;
 const q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want*.65),fx=q.x,fy=q.y-lift,f=mir?-1:1,[ax,ay]=A.anchor;
 const X=v=>fx+f*(v-ax)*k,Y=v=>fy+(v-ay)*ky,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[col*cw,row*ch,cw,ch],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],r242:anim,r121Walk:anim==='walk'});
 // 몸을 두 번 그리는 영웅(환도: 몸 + 겹친 사본)의 다른 사본은 지운다
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before){rec.commands.splice(i,1);stats.dupRemoved++;}}
 stats.frames++;stats[anim==='toReady'?'trans':anim]=(stats[anim==='toReady'?'trans':anim]||0)+1;stats.last={anim,dir,frame:fr};return true;}
// 시간 → 칸
function frameAt(ms,tms,loop){const tot=ms.reduce((a,b)=>a+b,0);let t=loop?((tms%tot)+tot)%tot:Math.min(tms,tot-1);for(let i=0;i<ms.length;i++){if(t<ms[i])return i;t-=ms[i];}return ms.length-1;}
function contactStart(ms){let c=ms.findIndex((m,i)=>i>1&&m<=40);if(c<0)c=Math.floor(ms.length*.4);let pre=0;for(let i=0;i<c;i++)pre+=ms[i];return Math.max(0,pre-90);}
function pickBody(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
let preloaded=null;
function preload(){if(!IDX||preloaded===room)return;preloaded=room;const A=IDX.anims;want(['n','s','e'].flatMap(d=>[A.walk?.[d],A.idle?.[d]]).filter(Boolean).map(a=>BASE+a.file));}
function choose(rec,st){const best=pickBody(rec,st);if(!best)return;const A=IDX.anims,t=T(),ms=1000;
 track();preload();
 const atk=+player.attackAnim||0,hurt=+player.hurtAnim||0,busy=player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0;
 if(atk>S.prevAtk+1e-6){const d=enemyDir()||S.dir;const a=A.attack[d==='w'?'e':d]||A.attack.s;const off=contactStart(a.ms),rest=a.ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.48);S.swing={t0:t,dir:d,off,scale:Math.max(.36,Math.min(1,cd*.95*1000/rest))};S.combatAt=t;}
 S.prevAtk=atk;
 if(hurt>S.prevHurt+1e-6){S.hit={t0:t,dir:enemyDir()||S.dir};S.combatAt=t;}S.prevHurt=hurt;
 const moving=t-S.movedAt<.15;
 // 기술·궁극기·대시: 이전처럼 공격·걷기 칸을 빌림
 if(busy){const d=enemyDir()||S.dir;S.dir=d;stats.skill++;if(player.dashAnim>0)return draw(rec,st,best,'walk',d,3);return draw(rec,st,best,'attack',d,player.ultimateAnim>0?Math.floor((A.attack[d==='w'?'e':d]||A.attack.s).n*.55):Math.floor((A.attack[d==='w'?'e':d]||A.attack.s).n*.4));}
 // 공격(이동 중에도 휘두르는 동안은 공격 그림 — 판정 순간과 맞춘다)
 if(S.swing){const a=A.attack[S.swing.dir==='w'?'e':S.swing.dir]||A.attack.s,el=(t-S.swing.t0)*ms/S.swing.scale+S.swing.off,tot=a.ms.reduce((x,y)=>x+y,0);
  if(el<tot&&!(moving&&t-S.swing.t0>.35)){S.dir=S.swing.dir;S.mode='ready';return draw(rec,st,best,'attack',S.swing.dir,frameAt(a.ms,el,false));}S.swing=null;}
 // 피격
 if(S.hit&&!moving){const d=S.hit.dir,h=A.hit[d==='w'?'e':d]||A.hit.s,el=(t-S.hit.t0)*ms/.6;if(el<h.ms.reduce((x,y)=>x+y,0)){S.dir=d;return draw(rec,st,best,'hit',d,frameAt(h.ms,el,false));}S.hit=null;}
 // 걷기 — 화면 이동 거리로 칸 넘김(보폭 동기)
 if(moving){S.dir=S.walkDir;S.trans=null;const w=A.walk,dk=S.walkDir==='w'?'e':S.walkDir,k=((typeof actorHeight==='function'?actorHeight():66)*.98)/(w[dk]?.body||180),per=(w.stride?.px_per_frame||10.9)*k;S.mode=inCombat()?'ready':'idle';return draw(rec,st,best,'walk',S.walkDir,Math.floor(S.dist/Math.max(1,per)));}
 // 서 있음: 대기 / 전투 준비 (+ 전환)
 const fd=enemyDir()||S.dir;S.dir=fd;const dk=fd==='w'?'e':fd,hasReady=!!A.ready[dk],mode=(player.guard||inCombat())&&hasReady?'ready':'idle';
 if(mode!==S.mode){const tr=A.toReady?.[dk];if(tr&&(S.mode==='idle'||S.mode==='ready'))S.trans={t0:t,to:mode,dir:fd,tr};S.mode=mode;S.modeAt=t;}
 if(S.trans){const el=(t-S.trans.t0)*ms,tot=S.trans.tr.ms.reduce((x,y)=>x+y,0);if(el<tot&&S.trans.dir===fd){let i=frameAt(S.trans.tr.ms,el,false);if(S.trans.to==='idle')i=S.trans.tr.n-1-i;return draw(rec,st,best,'toReady',fd,i);}
  S.startFrame=S.trans.to==='ready'?S.trans.tr.to_ready:S.trans.tr.from_idle;S.loopAt=t;S.trans=null;}
 const a=A[mode][dk];let off=0;if(S.loopAt!=null&&S.startFrame!=null){let c=0;for(let i=0;i<S.startFrame&&i<a.ms.length;i++)c+=a.ms[i];off=c-(S.loopAt*ms%a.ms.reduce((x,y)=>x+y,0));}
 return draw(rec,st,best,mode,fd,frameAt(a.ms,t*ms+off,true),{breath:mode==='idle'});}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&solo()&&player?.hero==='hwando'&&player.hp>0){loadIndex();if(IDX)choose(rec,st);}}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_HWANDO_R242__=Object.freeze({revision:REV,active:()=>on&&!!IDX&&typeof player==='object'&&player?.hero==='hwando'&&solo(),index:()=>IDX,state:()=>({...S,swing:S.swing&&{...S.swing},hit:S.hit&&{...S.hit},trans:S.trans&&{to:S.trans.to,dir:S.trans.dir}}),
 inspect:()=>({revision:REV,on,ready:!!IDX,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
