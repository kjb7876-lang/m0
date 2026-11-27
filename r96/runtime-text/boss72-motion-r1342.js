// R1342 제72문 보스(교만의 잔향 · 제72문, ep1b01 mb-ep1b01) 2D 고품질 모션 — 사용자 2026-11-26 "보스그러면 일관성있게 모션다양하고 고품질로".
//  전: 열쇠 자세 4장(r104 p1~p4, 376×435)만 있어 대기·이동·피격·시전이 모두 같은 p4 한 장이었다.
//  후: Dots SW-R1342 R3 시트 8종(칸 752×870 = p4 의 2배·같은 원점, 같은 인물·색·인장 26개)을 상태마다 고른다.
//   대기8(8fps)·이동8(12)·공격A8(12, 원안 p1~p3 흐름)·공격B8(12, 인장 펼쳐 쏘기)·시전10(11, R1241 '72 그림자' 주문 0.9초)·피격4(14)·사망10(10)·등장8(10).
//  그리기만 바꾼다(판정·피해·시간·세이브 불변). 엔진이 놓은 그림 자리(네 점·좌우)는 그대로 두고, 화면 배율만 대기 때 배운 값으로 고정(칸마다 96~100px 로 흔들리던 것).
//  공격 A/B: lastAttackKind 가 원거리면 B, 아니면 공격 번호 홀짝으로 A·B 를 번갈아(모션 다양).
//  끄기: localStorage['storyworld.r1342.boss72']='off' · 주소 ?boss72m=0(1 로 켬) · 점검 window.__STORYWORLD_BOSS72_MOTION_R1342__.inspect()
//  미검증: GPU 실기기·모바일 메모리(시트 8장 약 12MB WebP)·실제 플레이.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_BOSS72_MOTION_R1342__)return;
const REV='R1342-boss72-motion-1',KEY='storyworld.r1342.boss72',DIR='assets/r1342/boss72/';
const FRAMES={idle:8,move:8,atkA:8,atkB:8,cast:10,hit:4,death:10,reveal:8};
const FPS={idle:8,move:12,atkA:12,atkB:12,cast:11,hit:14,death:10,reveal:10};
const CW=752,CH=870,OH=435,PIV=[167/376,406/435];// r104 pivot(발 자리) — 시트는 p4 의 정확히 2배라 같은 비율
const SRC=/assets\/r104\/bosses\/mb-ep1b01-p[1-4]\.webp|gate72_pride_echo|assets\/r1342\/boss72\//;
let on=true;
try{if(localStorage.getItem(KEY)==='off')on=false;}catch(_){}
try{const m=/[?&]boss72m=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}
const stats={draws:0,swapped:0,scaled:0,wraps:0,errors:0,byMotion:{}};let lastError=null,lastPick=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const isBoss=e=>!!e&&(e.nativeId==='mb-ep1b01'||/제72문/.test(String(e.name||'')));
const norm=s=>{s=String(s||'');const i=s.indexOf('assets/');return i>=0?s.slice(i):s;};
const asked=new Set();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;if(!asked.has(p)&&typeof addImage==='function'){asked.add(p);addImage(p,'R1342 boss72 motion');}}catch(_){}return null;}
function preload(){for(const m of Object.keys(FRAMES))img(DIR+m+'.webp');}
const S=new WeakMap();
const st=e=>{let s=S.get(e);if(!s){s={k:0,spawn:e.spawnState,reveal:-1,hit0:-1,hitPrev:0,cast0:-1,dead0:-1,atkId:null,atkMax:1};S.set(e,s);}return s;};
// R1241 시전 상태: casting 과 casts(시전 횟수) — 시전이 끝나기 전에 새 시전이 시작돼도(casts 증가) 주문 동작을 처음부터 다시 튼다.
const castInfo=()=>{try{const i=window.__STORYWORLD_BOSS72_SHADOWS_R1241__?.inspect?.();return i?{on:!!i.casting,n:Number(i.casts)||0}:{on:false,n:0};}catch(_){return {on:false,n:0};}};
const chant=()=>{try{return Number(window.__STORYWORLD_BOSS72_SHADOWS_R1241__?.tune?.chant)||.9;}catch(_){return .9;}};
function pick(e,s,t){
 const loop=(m,t0)=>[m,Math.floor(Math.max(0,t-t0)*FPS[m])%FRAMES[m]];
 const once=(m,t0)=>[m,Math.min(FRAMES[m]-1,Math.floor(Math.max(0,t-t0)*FPS[m]))];
 if(!(e.hp>0)){if(s.dead0<0)s.dead0=t;return once('death',s.dead0);}
 s.dead0=-1;
 if(s.reveal>=0&&t-s.reveal<FRAMES.reveal/FPS.reveal)return once('reveal',s.reveal);
 const c=castInfo();if(c.on){if(s.cast0<0||c.n!==s.castN)s.cast0=t;s.castN=c.n;if(t-s.cast0<chant())return once('cast',s.cast0);}else s.cast0=-1;
 const ht=Number(e.hitTimer)||0;if(ht>0&&!(s.hitPrev>0))s.hit0=t;s.hitPrev=ht;
 if(ht>0&&s.hit0>=0&&t-s.hit0<FRAMES.hit/FPS.hit)return once('hit',s.hit0);
 const a=e.attack;
 if(a&&e.state==='attack'){
  if(s.atkId!==a.id){s.atkId=a.id;s.atkB=/range|proj|bolt|shot|ranged|cast/i.test(String(e.lastAttackKind||''))||((Number(a.id)||0)%2===1);}
  const el=Math.max(0,Number(a.elapsed)||0);if(el>s.atkMax)s.atkMax=Math.min(2.5,el);
  const m=s.atkB?'atkB':'atkA',dur=Math.max(.6,s.atkMax);return [m,Math.min(FRAMES[m]-1,Math.floor(el/dur*FRAMES[m]))];}
 const moving=e.state==='move'&&Math.hypot(Number(e.moveDX)||0,Number(e.moveDY)||0)>1e-3;
 return moving?loop('move',0):loop('idle',0);
}
const at=(P,u,v)=>[P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v,P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v];
const hgt=P=>Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]);
function process(e,cmds,st0){
 const mine=[];for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind==='image'&&Array.isArray(c.points)&&c.points.length>=4&&SRC.test(norm(c.sourcePath||c.image?.currentSrc||c.image?.src)))mine.push(c);}
 if(!mine.length)return;
 const s=st(e),t=T();stats.draws++;
 if(s.spawn==='hidden'&&e.spawnState==='active')s.reveal=t;s.spawn=e.spawnState;
 const [m,f]=pick(e,s,t);lastPick={m,f,state:e.state,hp:e.hp>0};
 const im=img(DIR+m+'.webp');if(!im){preload();return;}
 // 배율: 대기 중 한 장만 그려질 때의 화면 배율을 배워 모든 상태에 쓴다(엔진은 칸마다 96~100px 로 흔들렸다)
 const body=mine[mine.length-1],k=hgt(body.points)/OH;
 if((m==='idle'||m==='move')&&mine.length===1&&Number.isFinite(k)&&k>0)s.k=s.k?s.k+(k-s.k)*.2:k;
 for(const c of mine){
  const P=c.points.slice(0,4),kk=hgt(P)/OH,g=s.k&&kk>0?s.k/kk:1;
  if(Math.abs(g-1)>.004){const G=at(P,PIV[0],PIV[1]);c.points=c.points.map((p,i)=>i<4?[G[0]+(p[0]-G[0])*g,G[1]+(p[1]-G[1])*g,...p.slice(2)]:p);stats.scaled++;}
  c.image=im;c.sourcePath=DIR+m+'.webp';c.sourceRect=[f*CW,0,CW,CH];c.imageSize=[im.naturalWidth||im.width||CW*FRAMES[m],im.naturalHeight||im.height||CH];stats.swapped++;}
 stats.byMotion[m]=(stats.byMotion[m]||0)+1;
 lastPick.h=+hgt(body.points).toFixed(2);lastPick.src=body.sourcePath;lastPick.t=+t.toFixed(3);// 점검용: 실제로 바뀐 몸 그림·화면 키
}
let mineFn=null,rewraps=0,depth=0;
function wrap(){if(typeof drawEnemy!=='function')return;const base=drawEnemy;
 const me=function(e,...a){const rec=typeof ctx==='object'?ctx:null,cmds=Array.isArray(rec?.commands)?rec.commands:null,st0=cmds?.length??0;let r;depth++;try{r=base.apply(this,[e,...a]);}finally{depth--;}
  if(depth===0&&on&&cmds&&cmds.length>st0&&isBoss(e))try{process(e,cmds,st0);}catch(err){fail(err);}return r;};
 try{Object.assign(me,base);}catch(_){}me.__r1342=true;mineFn=me;drawEnemy=me;stats.wraps++;}
wrap();
// R974·R1226·R1337 등이 게임 시작 뒤 다시 바깥을 감싼다 → 바깥 자리를 되찾는다(최대 40번).
try{setInterval(()=>{try{if(typeof drawEnemy==='function'&&drawEnemy!==mineFn&&rewraps<40){rewraps++;wrap();}}catch(err){fail(err);}},700);}catch(_){}
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_BOSS72_MOTION_R1342__=Object.freeze({revision:REV,set,on:()=>on,frames:FRAMES,fps:FPS,isBoss,preload,pick:(e,t)=>pick(e,st(e),Number.isFinite(t)?t:T()),
 inspect:()=>({revision:REV,on,outermost:typeof drawEnemy==='function'&&drawEnemy===mineFn,stats:JSON.parse(JSON.stringify(stats)),lastPick,lastError})});
})();
