// R1239 — 천사의 가면과 의목사 후보생(ep1a11) '수천 개의 얼굴' 가면 스킬 + 루시퍼 그림 일관성.
//  사용자 2026-11-19 12:06Z "천사의가면과의목사 후보생 보스전 할때 수천개의가면이 나와서 서사텍스트에 맞는 프레임애니메이션 이펙트 스킬을
//   루시퍼랑 보스가 사용하도록 연출 … 루시퍼보스 관련 전수조사해서 디버깅해줘 특히 일관성과 이미지 출력부분"
//  정본 ep1a11(서사 문장은 바꾸지 않음): "가면이 갈라지자 수천 개의 내 얼굴이 나타났다. 그 얼굴들은 저마다 다른 표정을 짓고도 하나의 입을 함께 쓰고 있었다."
//  ① 스킬 '수천 개의 얼굴' — 시전자: 루시퍼(a11-boss, 핏빛판)·초천사의 웃는 가면(mb-ep1a11, 상아판).
//     예고(1.2초): 시전자 가슴 앞 큰 가면이 떨다가 갈라지고(crack8) 영웅 둘레에 가면 무리 고리(swarm12 × ring)와 화면 군중(swarm12 × crowd)이 차오른다.
//     모임(0.75초): 고리가 예고 자리 한 점(하나의 입)으로 조여든다 → 그 자리(반지름 hitR)에 남아 있으면 한 번 맞음 → 깨짐(burst10).
//     시트당 가면 72개 × (고리 14 + 군중 20) = 화면에 약 2,400개 + 고리 사이 큰 가면 7개(얼굴이 읽히게). 그림 = 드라이브 HAPIL 가면(prop-mask-1·2·3, 표정 가면 판넬)을 scripts/r1239-mask-sheets.py 로 합성한 프레임 시트.
//     피해 = 시전자 e.damage × 0.85 한 번(보스 근접 1대 이하), 쿨다운 12.5초, 만난 뒤 3.5~6초 첫 지연. 예고는 먹선 + 시전자 색(주황 금지 #712).
//  ② 루시퍼 그림 일관성(헤드리스 실측 qa/r1239/lucifer-census.mjs):
//     · 2·3단계(mark-reveal·false-light-collapse)에 R104 열쇠 자세 표가 1단계만 덮어(PHASES a11-boss:[0]) 옛 actors-normalized 회색 저화질 그림으로 바뀌던 것
//       → bosses-r104.js PHASES 를 [0,1,2] 로, 2·3단계는 같은 그림을 '흰 날개가 검게 물든' 색으로 다시 칠한 판(scripts/r1239-lucifer-dark.py, 칸·발 자리 동일)으로 바꾼다.
//     · 대기·걷기 때 엔진이 옛 그림 칸(visibleHeight 337.5)으로 R104 그림(400 기준)을 그려 공격 자세보다 18.5% 컸다 작았다 튀던 것
//       → 루시퍼 몸 명령의 픽셀 배율을 337.5 기준(플레이어가 대기 때 늘 보던 크기)으로 맞춘다. 광폭화 등 다른 배율은 비율로 남긴다. 발 자리 고정.
//  모든 스크립트가 실린 뒤(R620 이 setTimeout 0 으로 맨 바깥을 감싼 다음) 한 번 더 바깥에서 drawEnemy 를 감싼다(R620 의 대기 시트·교차 보간 명령까지 함께 처리).
//  끄기: localStorage['storyworld.r1239.masks']='{"on":false}'(스킬) · '{"art":false}'(그림 손질). 점검: window.__STORYWORLD_MASKS_R1239__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MASKS_R1239__)return;
const REV='R1239-masks-1',KEY='storyworld.r1239.masks';
let prefs={on:true,art:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={casts:0,hits:0,drawn:0,dark:0,fixed:0,kept:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'&&Number.isFinite(t)?t:0;};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
// ---- 표 ----
const TUNE=Object.freeze({first:[3.5,6],cd:12.5,windup:1.2,converge:.75,burst:.62,range:12,ringR:3.3,hitR:1.25,dmgK:.85,ring:14,crowd:20,perSheet:72});
const CASTERS=Object.freeze({'a11-boss':Object.freeze({tone:'crimson',col:'#8e1626'}),'mb-ep1a11':Object.freeze({tone:'ivory',col:'#e9e1d6'})});
const SH=Object.freeze({ivory:Object.freeze({crack:'assets/r1239/fx/mask-crack8.webp',swarm:'assets/r1239/fx/mask-swarm12.webp',burst:'assets/r1239/fx/mask-burst10.webp'}),
 crimson:Object.freeze({crack:'assets/r1239/fx/mask-crack8-crimson.webp',swarm:'assets/r1239/fx/mask-swarm12-crimson.webp',burst:'assets/r1239/fx/mask-burst10-crimson.webp'})});
const NF=Object.freeze({crack:8,swarm:12,burst:10}),CELL=256;
// 루시퍼 2·3단계 그림(같은 칸·같은 발 자리, 흰 날개가 검게 물든 판)
const DARK=Object.freeze({'assets/r104/bosses/a11-boss-p1.webp':'assets/r1239/lucifer/a11-dark-p1.webp','assets/r104/bosses/a11-boss-p2.webp':'assets/r1239/lucifer/a11-dark-p2.webp',
 'assets/r104/bosses/a11-boss-p3.webp':'assets/r1239/lucifer/a11-dark-p3.webp','assets/r104/bosses/a11-boss-p4.webp':'assets/r1239/lucifer/a11-dark-p4.webp',
 'assets/r1147/bosses/a11-idle6.webp':'assets/r1239/lucifer/a11-dark-idle6.webp','assets/r1147/bosses/a11-hit4.webp':'assets/r1239/lucifer/a11-dark-hit4.webp',
 'assets/r1029/float/a11-boss-p4.webp':'assets/r1239/lucifer/a11-dark-float8.webp'});
const rel=s=>{s=String(s||'');const i=s.indexOf('assets/');return i>=0?s.slice(i).split('?')[0]:s;};
function darkFor(src,phase){if(!(Number(phase)>=1))return null;return DARK[rel(src)]||null;}
// 크기 고정: 루시퍼 몸(R104·R1147·R1239, 466×432 칸, 발 피벗 231,413) — 픽셀 배율을 엔진 높이 H / 337.5 로
const BODY=/assets\/(?:r104\/bosses\/a11-boss-p[1-4]|r1147\/bosses\/a11-(?:idle6|hit4)|r1239\/lucifer\/a11-dark-(?:p[1-4]|idle6|hit4))\.webp/;
const CW=466,CH=432,PIV=Object.freeze([231,413]),VIS_NEW=400,VIS_SEEN=337.5,GAP=1.12;
function fixScale(P,sr,piv,H){
 if(!Array.isArray(P)||P.length<4||!Array.isArray(sr)||sr.length<4||!(H>0))return null;
 for(const q of P)if(!Array.isArray(q)||!Number.isFinite(q[0])||!Number.isFinite(q[1]))return null;
 const [sx,sy,sw,sh]=sr.map(Number);if(!(sw>0&&sh>0))return null;
 const ex=P[3][0]-P[0][0],ey=P[3][1]-P[0][1],s=Math.hypot(ex,ey)/sh;if(!(s>0))return null;
 const m=s*VIS_NEW/H,k=m<GAP?VIS_NEW/VIS_SEEN:1;
 const full=Math.abs(sw-CW)<1.5&&Math.abs(sh-CH)<1.5,u=(full?piv[0]:piv[0]-sx)/sw,v=(full?piv[1]:piv[1]-sy)/sh;
 const fx=P[0][0]+(P[1][0]-P[0][0])*u+ex*v,fy=P[0][1]+(P[1][1]-P[0][1])*u+ey*v;
 return P.map(q=>[fx+(q[0]-fx)*k,fy+(q[1]-fy)*k,...q.slice(2)]);}
// R1029 떠서 이동 시트(R974 가 몸 사각형을 pad 만큼 넓혀 놓음): 안쪽 몸 사각형으로 되돌려 같은 배율로 맞춘 뒤 다시 넓힌다.
function fixFloat(P,pad,H){
 if(!Array.isArray(P)||P.length<4||!Array.isArray(pad)||pad.length<4)return null;const [l,t,r,b]=pad.map(Number);if(![l,t,r,b].every(Number.isFinite))return null;
 for(const q of P)if(!Array.isArray(q)||!Number.isFinite(q[0])||!Number.isFinite(q[1]))return null;
 const ux=(P[1][0]-P[0][0])/(1+l+r),uy=(P[1][1]-P[0][1])/(1+l+r),vx=(P[3][0]-P[0][0])/(1+t+b),vy=(P[3][1]-P[0][1])/(1+t+b);
 const o=[P[0][0]+ux*l+vx*t,P[0][1]+uy*l+vy*t],inner=[o,[o[0]+ux,o[1]+uy],[o[0]+ux+vx,o[1]+uy+vy],[o[0]+vx,o[1]+vy]];
 const fixed=fixScale(inner,[0,0,CW,CH],PIV,H);if(!fixed)return null;const k=Math.hypot(fixed[3][0]-fixed[0][0],fixed[3][1]-fixed[0][1])/Math.max(1e-9,Math.hypot(vx,vy));
 const fx=o[0]+ux*PIV[0]/CW+vx*PIV[1]/CH,fy=o[1]+uy*PIV[0]/CW+vy*PIV[1]/CH;return P.map(q=>[fx+(q[0]-fx)*k,fy+(q[1]-fy)*k,...q.slice(2)]);}
const FLOAT=/assets\/(?:r1029\/float\/a11-boss-p4|r1239\/lucifer\/a11-dark-float8)\.webp/;
function floatPad(){try{return window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts?.['r104/bosses/a11-boss-p4.webp|0,0,466,432']?.pad||null;}catch(_){return null;}}
// ---- 판정(순수) ----
function hits(cx,cy,r,px,py){const d=Math.hypot(px-cx,py-cy);return Number.isFinite(d)&&d<=r+1e-9;}
// ---- 상태 ----
const P=()=>G('player');
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function coopGuest(){try{return window.__STORYWORLD_COOP_SIM_R62__?.mode?.()==='guest';}catch(_){return false;}}
function sees(e){try{const cl=G('clearLine');return typeof cl!=='function'||!!cl(e,P());}catch(_){return true;}}
const casterOf=e=>e&&CASTERS[e.nativeId]?CASTERS[e.nativeId]:null;
function eligible(e){return !!(casterOf(e)&&e.hp>0&&e.spawnState==='active'&&!e.hidden&&!e.disabled);}
const S=e=>e.r1239||(e.r1239={mode:null,t0:0,next:null,count:0,aim:null,seed:hash(e.id||e.nativeId)});
function hurtP(d,src){try{const h=G('hurt');if(typeof h==='function'&&d>0)h(d,src);}catch(err){fail(err);}}
function begin(e,s,now){const p=P();s.mode='windup';s.t0=now;s.hx=e.x;s.hy=e.y;s.aim={x:p.x,y:p.y};s.cast=(s.cast||0)+1;s.count++;stats.casts++;try{e.nav=[];}catch(_){}}
function step(dt){
 const room=G('room');if(!room||!Array.isArray(room.enemies))return;
 const now=T(),stop=paused()||!prefs.on||coopGuest();
 for(const e of room.enemies){if(!casterOf(e))continue;const s=S(e);
  if(!eligible(e)){s.mode=null;continue;}
  if(stop){if(s.mode)s.t0+=Math.max(0,Number(dt)||0);if(s.next!=null)s.next+=Math.max(0,Number(dt)||0);continue;}
  const p=P(),d=Math.hypot(p.x-e.x,p.y-e.y);
  if(!s.mode){
   if(s.next==null){if(d<=TUNE.range)s.next=now+TUNE.first[0]+s.seed*(TUNE.first[1]-TUNE.first[0]);continue;}
   if(now>=s.next&&d<=TUNE.range&&!e.attack&&!(e.rangedWindup>0)&&sees(e))begin(e,s,now);continue;}
  const age=now-s.t0;
  if(s.mode==='windup'){e.x=s.hx;e.y=s.hy;try{e.nav=[];}catch(_){}
   if(age>=TUNE.windup){s.mode='converge';s.t0+=TUNE.windup;}}
  else if(s.mode==='converge'){if(age>=TUNE.converge){s.mode='burst';s.t0+=TUNE.converge;
    if(hits(s.aim.x,s.aim.y,TUNE.hitR,p.x,p.y)){stats.hits++;hurtP((Number(e.damage)||0)*TUNE.dmgK,{type:'r1239-masks',r1239:true,enemySource:e,owner:e.id});}}}
  else if(s.mode==='burst'){if(age>=TUNE.burst){s.mode=null;s.next=now+TUNE.cd;}}}
}
// ---- 그림 ----
function want(p){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(p);}catch(err){fail(err);}}
function img(p){try{const r=G('readyImage')?.(p),im=r?.image;if(!r)want(p);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
let warmAt=-9;function warm(){const now=T();if(now-warmAt<2&&now>=warmAt)return;warmAt=now;const rd=G('readyImage');
 for(const t of Object.values(SH))for(const q of Object.values(t))if(!rd?.(q))want(q);for(const q of Object.values(DARK))if(!rd?.(q))want(q);}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
function cell(c,path,n,f,x,y,w,h,alpha){const im=img(path);if(!im)return false;const i=((Math.floor(f)%n)+n)%n;c.save();c.globalAlpha=Math.max(0,Math.min(1,alpha));c.drawImage(im,i*CELL,0,CELL,CELL,x-w/2,y-h/2,w,h);c.restore();stats.drawn++;return true;}
function ell(c,q,rx,ry,col,alpha,lw){c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.ellipse?.(q.x,q.y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);c.stroke();c.restore();}
function drawCast(c,e,s,now){
 const cs=casterOf(e),sh=SH[cs.tone],pr=G('project'),U=unit(),ah=AH(),age=now-s.t0,q=pr(s.aim.x,s.aim.y),me=pr(e.x,e.y),chest={x:me.x,y:me.y-ah*.62};
 const W=Number(G('W'))||960,Hh=Number(G('H'))||540,seed=s.seed*997+s.cast*31;
 // 고리 반지름(화면): 예고 동안 살짝 조여 오고, 모임 동안 한 점으로
 let g=0,R=TUNE.ringR,alpha=1,ringK=1;
 if(s.mode==='windup'){g=Math.min(1,age/TUNE.windup);R=TUNE.ringR*(1.18-.18*g);alpha=.25+.75*g;}
 else if(s.mode==='converge'){g=Math.min(1,age/TUNE.converge);const ease=g*g*(3-2*g);R=TUNE.ringR*(1-ease*.94);ringK=1-.45*ease;}
 if(s.mode==='windup'||s.mode==='converge'){
  // 시전자 가슴 앞: 갈라지는 가면(예고 동안 8장, 모임 땐 마지막 장이 흩어짐)
  const cf=s.mode==='windup'?g*7.99:7,ca=(s.mode==='windup'?.92:Math.max(0,1-g*1.6)),hy=me.y-ah*1.55;cell(c,sh.crack,NF.crack,cf,chest.x,hy,ah*1.15,ah*1.15,ca); /* 머리 위 — 몸을 가리지 않게 */
  // 하나의 입: 모여들 자리(먹선 + 시전자 색)
  const rr=TUNE.hitR*U;ell(c,q,rr*1.41,rr*.71,'rgba(10,8,12,.62)',.35+.4*g,4);ell(c,q,rr*1.41,rr*.71,cs.col,.25+.55*g,1.6);
  // 화면 군중(뒤): 화면 곳곳에서 떠오른 얼굴 무리가 예고 자리로 쏠린다
  for(let i=0;i<TUNE.crowd;i++){const a=hash(seed+':c'+i),b=hash(seed+':d'+i),sx=W*(.04+.92*a),sy=Hh*(.06+.88*b);
   const pull=s.mode==='converge'?g*g:g*.12,x=sx+(q.x-sx)*pull,y=sy+(q.y-ah*.3-sy)*pull,sz=(170+110*hash(seed+':s'+i))*(s.mode==='converge'?1-.5*g:1);
   cell(c,sh.swarm,NF.swarm,now*9+i*5,x,y,sz,sz*.62,(s.mode==='windup'?.14+.3*g:.44*(1-g*.6)));}
  // 고리(앞): 영웅 둘레를 도는 가면 무리
  const n=TUNE.ring,spin=now*.55*(s.seed>.5?1:-1);
  for(let i=0;i<n;i++){const a=spin+i/n*Math.PI*2,wx=s.aim.x+Math.cos(a)*R,wy=s.aim.y+Math.sin(a)*R,p=pr(wx,wy),sz=U*3.3*ringK*(1+.12*Math.sin(now*3+i));
   cell(c,sh.swarm,NF.swarm,now*10+i*7,p.x,p.y-ah*.32,sz*1.2,sz*.78,alpha);}
  /* 읽히는 얼굴: 무리 사이로 큰 가면 몇 개(온 가면·갈라진 가면을 번갈아) — 작은 가면 무리만으로는 꽃잎·핏물처럼 보여서 */
  const big=Math.round(n/2);for(let i=0;i<big;i++){const a=-spin*1.3+(i+.5)/big*Math.PI*2,rr=R*(.82+.1*Math.sin(now*2+i)),p=pr(s.aim.x+Math.cos(a)*rr,s.aim.y+Math.sin(a)*rr),bz=U*1.25*ringK;
   cell(c,sh.crack,NF.crack,i%2?3:0,p.x,p.y-ah*.55-Math.sin(now*4+i)*3,bz,bz,alpha*.95);}}
 else if(s.mode==='burst'){g=Math.min(1,age/TUNE.burst);const sz=TUNE.hitR*U*3.4;cell(c,sh.burst,NF.burst,4+g*5.99,q.x,q.y-ah*.25,sz,sz*.72,1);}
}
function drawFx(){const c=G('ctx'),room=G('room');if(!c||!room||typeof G('project')!=='function')return;const now=T();
 for(const e of room.enemies||[]){const s=e?.r1239;if(!s?.mode||!s.aim||!eligible(e))continue;try{drawCast(c,e,s,now);}catch(err){fail(err);}}}
const SENT={type:'r1239-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1239-fx'){try{if(prefs.on)drawFx();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(dt,...a){const r=base.apply(this,[dt,...a]);try{const room=G('room');const has=room?.enemies?.some(e=>casterOf(e));if(has){warm();step(dt);if(room.enemies.some(e=>e?.r1239?.mode))arm();}}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
// ---- 루시퍼 몸 명령 손질(그림 바꾸기·크기 고정) + 시전 동안 공격 자세 ----
function bodyH(e){const h=Number(e.rc146BodyHeight);if(h>0)return h;try{return AH()*Number(e.combatProfile?.spriteRect?.height||1.65)*Number(e.defScale||1);}catch(_){return 0;}}
function retouch(e,cmds,st0){const H=bodyH(e),ph=Number(e.phase)||0;
 for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image')continue;const src=rel(c.sourcePath||c.image?.currentSrc||c.image?.src);
  const d=darkFor(src,ph);if(d){const im=img(d);if(im){c.image=im;c.sourcePath=d;stats.dark++;}}
  const cur=rel(c.sourcePath||src),fl=FLOAT.test(cur);
  if((fl||BODY.test(cur))&&Array.isArray(c.points)){const np=fl?fixFloat(c.points,floatPad(),H):fixScale(c.points,c.sourceRect||[0,0,CW,CH],PIV,H);if(np){const moved=np.some((q,j)=>Math.abs(q[1]-c.points[j][1])>.01);c.points=np;if(moved)stats.fixed++;else stats.kept++;}}}}
let installed=false;function install(){if(installed||typeof G('drawEnemy')!=='function')return;installed=true;const base=G('drawEnemy');
 try{Function('f','drawEnemy=f')(function(e,...a){
  if(!e||!casterOf(e))return base.apply(this,[e,...a]);
  let saved=null;const s=e.r1239;
  try{if(prefs.on&&s&&(s.mode==='windup'||s.mode==='converge')&&!e.attack&&e.hp>0){const sh=e.combatProfile?.attackShape||{},w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.12),age=Math.max(0,T()-s.t0);
   const el=s.mode==='windup'?Math.min(.98,age/TUNE.windup)*w:w+Math.min(.98,age/TUNE.converge)*act;saved={attack:e.attack,moving:e.moving};
   e.attack={elapsed:el,angle:Math.atan2((s.aim?.y??e.y)-e.y,(s.aim?.x??e.x)-e.x),committed:s.mode!=='windup',struckQuality:true,id:-1239,shape154:sh,origin154:{x:e.x,y:e.y},r1239Fake:true};e.moving=false;}}catch(err){fail(err);saved=null;}
  const c=G('ctx'),cm=Array.isArray(c?.commands)?c.commands:null,st0=cm?cm.length:-1;
  try{return base.apply(this,[e,...a]);}
  finally{if(saved){e.attack=saved.attack;e.moving=saved.moving;}if(prefs.art&&cm&&st0>=0&&e.nativeId==='a11-boss')try{retouch(e,cm,st0);}catch(err){fail(err);}}});}catch(err){fail(err);}}
// R620 은 setTimeout 0 으로 맨 바깥을 감싼다 → 그 다음 차례에 감싼다.
if(typeof setTimeout==='function')setTimeout(()=>setTimeout(install,0),0);else install();
// 방을 옮기면 시전을 지운다
let lastRoom=null;if(typeof setInterval==='function')setInterval(()=>{try{const r=G('room');if(r!==lastRoom){lastRoom=r;for(const e of r?.enemies||[])if(e?.r1239)e.r1239.mode=null;}}catch(_){}},500);
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)for(const e of G('room')?.enemies||[])if(e?.r1239)e.r1239.mode=null;return {...prefs};}
window.__STORYWORLD_MASKS_R1239__=Object.freeze({revision:REV,casters:Object.keys(CASTERS),tune:TUNE,sheets:SH,dark:DARK,hits,fixScale,fixFloat,darkFor,set,
 inspect:()=>({revision:REV,installed,prefs:{...prefs},stats:{...stats},lastError,live:(G('room')?.enemies||[]).filter(e=>e?.r1239).map(e=>({id:e.nativeId,mode:e.r1239.mode,count:e.r1239.count,next:e.r1239.next}))})});
})();
