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
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.anims)IDX=j;else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);stats.loads++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
// 동작·방향 → 그림 (새 팩 → W 는 E 미러 → R242 대체)
function res(anim,dir){const N=IDX?.anims?.[anim];if(N?.[dir]?.file)return {A:N[dir],base:BASE,mir:false};if(dir==='w'&&N?.e?.file)return {A:N.e,base:BASE,mir:true};
 const O=window.__STORYWORLD_HWANDO_R242__?.index?.(),dk=dir==='w'?'e':dir,A=O?.anims?.[anim]?.[dk]||O?.anims?.[anim]?.s;if(!A)return null;return {A,base:OLD,mir:dir==='w',body:O.anims.walk?.[dk]?.body||A.body||180,old:true};}
const S={x:null,y:null,movedAt:-9,sx:0,sy:0,dist:0,dir:'s',walkDir:'s',swing:null,hit:null,prevAtk:0,prevHurt:0};
function dirFromVec(vx,vy){if(Math.abs(vx)>=Math.abs(vy))return vx>=0?'e':'w';return vy>=0?'s':'n';}
function enemyDir(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false||e.spawnState==='hidden')continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);return dirFromVec(b.x-q.x,b.y-q.y);}}catch(_){}return null;}
function track(){const t=T();if(S.x!=null){const dx=player.x-S.x,dy=player.y-S.y,d=Math.hypot(dx,dy);
  if(d>1e-4&&d<1.2){const q0=project(S.x,S.y),q1=project(player.x,player.y),px=q1.x-q0.x,py=q1.y-q0.y;S.sx=S.sx*.6+px*.4;S.sy=S.sy*.6+py*.4;if(d>.004)S.movedAt=t;
   S.dist+=Math.hypot(px,py);const mvx=+player.moveVX150||0,mvy=+player.moveVY150||0;let v=[S.sx,S.sy];if(Math.hypot(mvx,mvy)>.05){const a=project(player.x,player.y),b=project(player.x+mvx,player.y+mvy);v=[b.x-a.x,b.y-a.y];}
   const nd=dirFromVec(v[0],v[1]);if(nd!==S.walkDir){S.pend=(S.pendDir===nd?(S.pend||0)+1:1);S.pendDir=nd;if(S.pend>=2){S.walkDir=nd;S.pend=0;}}else S.pend=0;}}
 S.x=player.x;S.y=player.y;}
const want=()=>(typeof actorHeight==='function'?actorHeight():66)*((window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio)||.98);
function draw(rec,st,best,anim,dir,frame,opt={}){const R=res(anim,dir);if(!R)return false;const A=R.A,p=R.base+A.file,im=image(p);if(!im)return false;
 const n=A.n,fr=((frame%n)+n)%n,cw=A.cell[0],ch=A.cell[1],col=fr%A.cols,row=Math.floor(fr/A.cols);
 const body=R.body||A.body||180,w=want(),k=w/body,ky=opt.breath?k*(1+.008*Math.sin(T()*2.2)):k;
 const q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),w*.65),fx=q.x,fy=q.y-lift,f=R.mir?-1:1,[ax,ay]=A.anchor;
 const X=v=>fx+f*(v-ax)*k,Y=v=>fy+(v-ay)*ky,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[col*cw,row*ch,cw,ch],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],r271:anim,r121Walk:anim==='walk'});
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before){rec.commands.splice(i,1);stats.dupRemoved++;}}
 stats.frames++;stats[anim]=(stats[anim]||0)+1;if(R.old)stats.fallback++;stats.last={anim,dir,frame:fr,old:!!R.old};return true;}
function frameAt(ms,tms,loop){const tot=ms.reduce((a,b)=>a+b,0);let t=loop?((tms%tot)+tot)%tot:Math.min(tms,tot-1);for(let i=0;i<ms.length;i++){if(t<ms[i])return i;t-=ms[i];}return ms.length-1;}
function contactStart(ms){let c=ms.findIndex((m,i)=>i>1&&m<=40);if(c<0)c=Math.floor(ms.length*.4);let pre=0;for(let i=0;i<c;i++)pre+=ms[i];return Math.max(0,pre-90);}
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/attack\/|r242\/hwando\/|r271\/hwando\/|awakening|^blob:/;
function pickBody(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
let preloaded=null;
function preload(){if(!IDX||preloaded===room)return;preloaded=room;for(const a of ['walk','idle'])for(const d of ['n','s','e','w']){const A=IDX.anims[a]?.[d];if(A?.file)image(BASE+A.file);}}
const atkOf=d=>res('attack',d)?.A;
function choose(rec,st){const best=pickBody(rec,st);if(!best)return;const t=T(),ms=1000;
 track();preload();
 const atk=+player.attackAnim||0,hurt=+player.hurtAnim||0,busy=player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0;
 if(atk>S.prevAtk+1e-6){const d=enemyDir()||S.dir,a=atkOf(d);if(a){const off=contactStart(a.ms),rest=a.ms.reduce((x,y)=>x+y,0)-off,cd=Math.max(.2,+player.attackCD||.48);S.swing={t0:t,dir:d,off,scale:Math.max(.36,Math.min(1,cd*.95*1000/rest))};}}
 S.prevAtk=atk;
 if(hurt>S.prevHurt+1e-6)S.hit={t0:t,dir:enemyDir()||S.dir};S.prevHurt=hurt;
 const moving=t-S.movedAt<.15;
 if(busy){const d=enemyDir()||S.dir;S.dir=d;stats.skill++;if(player.dashAnim>0)return draw(rec,st,best,'walk',d,3);const a=atkOf(d);return a&&draw(rec,st,best,'attack',d,Math.floor(a.n*(player.ultimateAnim>0?.55:.45)));}
 if(S.swing){const a=atkOf(S.swing.dir),el=(t-S.swing.t0)*ms/S.swing.scale+S.swing.off,tot=a.ms.reduce((x,y)=>x+y,0);
  if(el<tot&&!(moving&&t-S.swing.t0>.35)){S.dir=S.swing.dir;return draw(rec,st,best,'attack',S.swing.dir,frameAt(a.ms,el,false));}S.swing=null;}
 if(S.hit&&!moving){const d=S.hit.dir,h=res('hit',d)?.A,el=(t-S.hit.t0)*ms/.6;if(h&&el<h.ms.reduce((x,y)=>x+y,0)){S.dir=d;return draw(rec,st,best,'hit',d,frameAt(h.ms,el,false));}S.hit=null;}
 if(moving){S.dir=S.walkDir;const R=res('walk',S.walkDir),k=want()/(R?.A?.body||180),per=(IDX.anims.walk?.stride?.px_per_frame||12.8)*k;return draw(rec,st,best,'walk',S.walkDir,Math.floor(S.dist/Math.max(1,per)));}
 const fd=enemyDir()||S.dir;S.dir=fd;const a=res('idle',fd)?.A;if(!a)return;
 return draw(rec,st,best,'idle',fd,frameAt(a.ms,t*ms,true),{breath:true});}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&solo()&&player?.hero==='hwando'&&player.hp>0){loadIndex();if(IDX)choose(rec,st);}}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_HWANDO_R271__=Object.freeze({revision:REV,active:()=>on&&!!IDX&&typeof player==='object'&&player?.hero==='hwando'&&solo(),index:()=>IDX,state:()=>({...S,swing:S.swing&&{...S.swing},hit:S.hit&&{...S.hit}}),
 inspect:()=>({revision:REV,on,ready:!!IDX,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
