// R1337 2D 보스 동작 일관성 — 사용자 2026-11-26 "맨처음 뿌리보스 2d로돌리고 일관성 극한으로강화해서 적용해주고 핓빛추격자도 일관성극한강화적용해줘"
//  · "발록보스도 일관성 2d극한으로 통일시켜서 2d개선해줘"(같은 날).
//  대상: 뿌리의 문지기(dist00 보스) · 핏빛 수호로 추격자(dist03 중간보스 mb-dist03) · 발록(dist06 보스).
//  헤드리스 실측(qa/r1337/census.mjs): 같은 보스가 상태마다 서로 다른 크기·무기 손·색으로 그려졌다.
//   예) 핏빛 추격자 p1 화면 키 88 · p4 108 · p2 120(같은 칸 크기인데 그릴 때 배율이 달라 몸이 줄었다 커졌다),
//       발록 p1 109 · 대기 126 · p2 136, 대기 시트는 칼이 오른손인데 p1 은 왼손, 피격 때 좌우가 뒤집힘.
//  고친 것(그리기만, 판정·피해·시간·세이브 불변):
//   1) 그림: scripts/r1337-boss-consistency.py 가 칸마다 몸통 크기·발 자리·색·무기 쪽을 기준(대기 p4)에 맞춘 사본(assets/r1337/)으로 바꿔 그린다.
//   2) 배율 고정: 그 보스의 기준 칸이 그려진 화면 배율(화면 키 ÷ 칸 키)을 기억해, 다른 칸도 같은 배율로 발밑 기준 다시 놓는다.
//   3) 좌우 고정: 모든 사본은 기준과 같은 쪽을 보도록 만들었으니, 좌우는 R444 left(e) 하나로 정한다(칸마다 다르게 뒤집히던 것 없앰).
//   4) 뿌리의 문지기 걷기: 쓰이지 않던 걷기 6칸(r281)을 색·크기·발 맞춰 걷는 동안 쓴다(전엔 대기 그림·떠서 이동 시트).
//  R1341 더함(사용자 2026-11-26 "천사의 가면과 의목사 후보생 보스몹 모션과 일관성 강화 … 검을든천사몹은 2d로 다시 일관성있게"):
//   · 루시퍼(a11-boss)·초천사의 웃는 가면(mb-ep1a11)을 같은 표에 더했다(scripts/r1337-boss-consistency.py --only lucifer,mask).
//     루시퍼 2·3단계 어두운 판(R1239)은 어두운 p4 색에 맞춰 단계 연출을 남긴다. 걷는 동안은 열쇠 자세(p4·p1·p2)를 번갈아 튀기지 않고 대기 6칸으로 떠서 간다.
//     가면의 떠서 이동 8칸(R1029, 칸 256 높이)은 구워진 검은 웅덩이를 지우고 기준 크기로 바꾼 사본을 쓴다(전엔 피격·이동 때 17% 커지고 웅덩이가 생겼다).
//   · 칸 크기가 기준과 다른 시트는 표의 cell 로 칸을 읽고, 화면 네 점은 '그림 한 픽셀의 화면 크기'로 다시 놓는다.
//   · 거짓천국 근위천사(a11-c1, 검 든 천사 일반 몹): 서 있을 때 걷기 두 칸을 번갈아(제자리걸음) 그리던 것을 첫 칸에 세우고 숨쉬기만 얹는다. 3D 는 R1326 이 이 지역에서 끈다.
//  끄기: localStorage['storyworld.r1337.boss2d']='{"on":false}' · 점검: window.__STORYWORLD_BOSS2D_R1337__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BOSS2D_R1337__)return;
const REV='R1337-boss2d-1',KEY='storyworld.r1337.boss2d';
let prefs={on:true,scale:true,face:true,walk:true,art:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,swapped:0,scaled:0,faced:0,walk:0,wraps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
window.__STORYWORLD_BOSS2D_R1337_DATA__={"revision":"R1337","bosses":{"root":{"name":"뿌리의 문지기","cell":[421,463],"out":[606,519],"pad":[0.22,0.12,0.22],"nativeLeft":false,"float":"assets/r1029/float/dist00-boss-p4.webp","refFoot":[0.4373,0.879],"refFrac":{"top":0.1214,"bot":0.8921,"cx":0.4566},"frames":[{"path":"assets/r104/bosses/dist00-boss-p4.webp","out":"assets/r1337/bosses/dist00-boss-p4.webp","ref":true,"state":"idle","foot":[[0.4373,0.879]]},{"path":"assets/r1147/bosses/dist00-idle6.webp","out":"assets/r1337/bosses/dist00-idle6.webp","n":6,"ref":true,"state":"idle","foot":[[0.4588,0.8812],[0.4641,0.8812],[0.4746,0.8812],[0.4583,0.8812],[0.4614,0.879],[0.4571,0.8812]]},{"path":"assets/r104/bosses/dist00-boss-p1.webp","out":"assets/r1337/bosses/dist00-boss-p1.webp","state":"attack","foot":[[0.5439,0.9611]]},{"path":"assets/r104/bosses/dist00-boss-p2.webp","out":"assets/r1337/bosses/dist00-boss-p2.webp","state":"attack","foot":[[0.4519,0.987]]},{"path":"assets/r104/bosses/dist00-boss-p3.webp","out":"assets/r1337/bosses/dist00-boss-p3.webp","state":"attack","foot":[[0.4911,0.905]]},{"path":"assets/r1147/bosses/dist00-hit4.webp","out":"assets/r1337/bosses/dist00-hit4.webp","n":4,"state":"hit","foot":[[0.4431,0.8812],[0.4498,0.8812],[0.4423,0.8812],[0.4278,0.879]]}],"walk":{"path":"assets/r1337/bosses/dist00-walk6.webp","n":6,"fps":8,"nativeLeft":false}},"blood":{"name":"핏빛 수호로 추격자","cell":[438,495],"out":[657,594],"pad":[0.25,0.2,0.25],"nativeLeft":false,"float":"assets/r1029/float/mb-dist03-p4.webp","refFoot":[0.528,0.899],"refFrac":{"top":0.2441,"bot":0.9158,"cx":0.5187},"frames":[{"path":"assets/r104/bosses/mb-dist03-p4.webp","out":"assets/r1337/bosses/mb-dist03-p4.webp","ref":true,"state":"idle","foot":[[0.528,0.899]]},{"path":"assets/r104/bosses/mb-dist03-p1.webp","out":"assets/r1337/bosses/mb-dist03-p1.webp","state":"attack","foot":[[0.5178,0.9879]]},{"path":"assets/r104/bosses/mb-dist03-p2.webp","out":"assets/r1337/bosses/mb-dist03-p2.webp","state":"attack","foot":[[0.4237,0.9838]]},{"path":"assets/r104/bosses/mb-dist03-p3.webp","out":"assets/r1337/bosses/mb-dist03-p3.webp","state":"attack","foot":[[0.6413,0.9313]]}]},"balrog":{"name":"발록","cell":[508,501],"out":[732,601],"pad":[0.22,0.2,0.22],"nativeLeft":false,"float":null,"refFoot":[0.4251,0.8743],"refFrac":{"top":0.2296,"bot":0.8952,"cx":0.4477},"frames":[{"path":"assets/r104/bosses/dist06-boss-p4.webp","out":"assets/r1337/bosses/dist06-boss-p4.webp","ref":true,"state":"idle","foot":[[0.4251,0.8743]]},{"path":"assets/r1147/bosses/dist06-idle6.webp","out":"assets/r1337/bosses/dist06-idle6.webp","n":6,"ref":true,"state":"idle","foot":[[0.4538,0.8743],[0.4699,0.8743],[0.4785,0.8743],[0.4651,0.8743],[0.4427,0.8743],[0.4492,0.8743]]},{"path":"assets/r104/bosses/dist06-boss-p1.webp","out":"assets/r1337/bosses/dist06-boss-p1.webp","state":"attack","foot":[[0.5489,0.9541]]},{"path":"assets/r104/bosses/dist06-boss-p2.webp","out":"assets/r1337/bosses/dist06-boss-p2.webp","state":"attack","foot":[[0.6053,0.986]]},{"path":"assets/r104/bosses/dist06-boss-p3.webp","out":"assets/r1337/bosses/dist06-boss-p3.webp","state":"attack","foot":[[0.6198,0.978]]},{"path":"assets/r1147/bosses/dist06-hit4.webp","out":"assets/r1337/bosses/dist06-hit4.webp","n":4,"state":"hit","foot":[[0.4647,0.8743],[0.4618,0.8743],[0.4738,0.8723],[0.4524,0.8723]]},{"path":"assets/generated-v31224/actors-normalized/bee76e221b69_balrog-hit.webp","out":"assets/r1337/bosses/dist06-hit4.webp","cell":1,"n":4,"state":"hit","alias":true,"foot":[[0.492,0.9167]]},{"path":"assets/generated-v31224/actors-normalized/80f5ab6bab50_balrog-idle.webp","out":"assets/r1337/bosses/dist06-idle6.webp","cell":0,"n":6,"state":"hit","alias":true,"foot":[[0.5202,0.9167]]}]},"lucifer":{"name":"루시퍼 · 가면 벗은 초천사","cell":[466,432],"out":[578,484],"pad":[0.12,0.12,0.12],"nativeLeft":false,"float":null,"refFoot":[0.502,0.956],"refFrac":{"top":0.1343,"bot":0.9607,"cx":0.5015},"frames":[{"path":"assets/r104/bosses/a11-boss-p4.webp","out":"assets/r1341/bosses/a11-boss-p4.webp","ref":true,"state":"idle","foot":[[0.502,0.956]]},{"path":"assets/r1147/bosses/a11-idle6.webp","out":"assets/r1341/bosses/a11-idle6.webp","n":6,"ref":true,"state":"idle","foot":[[0.4829,0.956],[0.4819,0.956],[0.4843,0.956],[0.4786,0.956],[0.4811,0.956],[0.4834,0.956]]},{"path":"assets/r104/bosses/a11-boss-p1.webp","out":"assets/r1341/bosses/a11-boss-p1.webp","state":"attack","foot":[[0.519,0.9815]]},{"path":"assets/r104/bosses/a11-boss-p2.webp","out":"assets/r1341/bosses/a11-boss-p2.webp","state":"attack","foot":[[0.4559,0.9861]]},{"path":"assets/r104/bosses/a11-boss-p3.webp","out":"assets/r1341/bosses/a11-boss-p3.webp","state":"attack","foot":[[0.4705,0.9468]]},{"path":"assets/r1147/bosses/a11-hit4.webp","out":"assets/r1341/bosses/a11-hit4.webp","n":4,"state":"hit","foot":[[0.4768,0.9537],[0.4702,0.9537],[0.4766,0.9537],[0.4802,0.9537]]},{"path":"assets/r1239/lucifer/a11-dark-p4.webp","out":"assets/r1341/bosses/a11-dark-p4.webp","ref":true,"state":"idle","dark":true,"foot":[[0.502,0.956]]},{"path":"assets/r1239/lucifer/a11-dark-idle6.webp","out":"assets/r1341/bosses/a11-dark-idle6.webp","n":6,"ref":true,"state":"idle","dark":true,"foot":[[0.4829,0.956],[0.4819,0.956],[0.4843,0.956],[0.4786,0.956],[0.4811,0.956],[0.4834,0.956]]},{"path":"assets/r1239/lucifer/a11-dark-p1.webp","out":"assets/r1341/bosses/a11-dark-p1.webp","state":"attack","dark":true,"foot":[[0.519,0.9815]]},{"path":"assets/r1239/lucifer/a11-dark-p2.webp","out":"assets/r1341/bosses/a11-dark-p2.webp","state":"attack","dark":true,"foot":[[0.4559,0.9861]]},{"path":"assets/r1239/lucifer/a11-dark-p3.webp","out":"assets/r1341/bosses/a11-dark-p3.webp","state":"attack","dark":true,"foot":[[0.4705,0.9468]]},{"path":"assets/r1239/lucifer/a11-dark-hit4.webp","out":"assets/r1341/bosses/a11-dark-hit4.webp","n":4,"state":"hit","dark":true,"foot":[[0.4768,0.9537],[0.4702,0.9537],[0.4766,0.9537],[0.4802,0.9537]]},{"path":"assets/r1029/float/a11-boss-p4.webp","out":"assets/r1341/bosses/a11-float8.webp","n":8,"state":"move","foot":[[0.5158,0.7852],[0.5123,0.7773],[0.5091,0.7734],[0.5102,0.7773],[0.5126,0.7656],[0.5115,0.7773],[0.5132,0.7812],[0.5127,0.7812]],"cell":[309,256]},{"path":"assets/r1239/lucifer/a11-dark-float8.webp","out":"assets/r1341/bosses/a11-dark-float8.webp","n":8,"state":"move","dark":true,"foot":[[0.4972,0.8594],[0.4962,0.8477],[0.4989,0.8438],[0.4997,0.8477],[0.4995,0.8594],[0.495,0.8711],[0.4928,0.875],[0.4918,0.8711]],"cell":[309,256]}],"walk":{"path":"assets/r1341/bosses/a11-walk6.webp","n":6,"fps":7,"nativeLeft":false,"dark":"assets/r1341/bosses/a11-dark-walk6.webp"}},"mask":{"name":"초천사의 웃는 가면","cell":[408,420],"out":[506,470],"pad":[0.12,0.12,0.12],"nativeLeft":false,"float":null,"refFoot":[0.479,0.9667],"refFrac":{"top":0.1213,"bot":0.9702,"cx":0.483},"frames":[{"path":"assets/r104/bosses/mb-ep1a11-p4.webp","out":"assets/r1341/bosses/mb-ep1a11-p4.webp","ref":true,"state":"idle","foot":[[0.479,0.9667]]},{"path":"assets/r104/bosses/mb-ep1a11-p1.webp","out":"assets/r1341/bosses/mb-ep1a11-p1.webp","state":"attack","foot":[[0.4861,0.9857]]},{"path":"assets/r104/bosses/mb-ep1a11-p2.webp","out":"assets/r1341/bosses/mb-ep1a11-p2.webp","state":"attack","foot":[[0.48,0.981]]},{"path":"assets/r104/bosses/mb-ep1a11-p3.webp","out":"assets/r1341/bosses/mb-ep1a11-p3.webp","state":"attack","foot":[[0.5037,0.9643]]},{"path":"assets/r1029/float/mb-ep1a11-p4.webp","out":"assets/r1341/bosses/mb-ep1a11-float8.webp","n":8,"state":"move","foot":[[0.4869,0.7969],[0.4847,0.793],[0.4827,0.7891],[0.4847,0.8008],[0.4851,0.8047],[0.4837,0.8086],[0.4835,0.793],[0.4838,0.8164]],"cell":[278,256]}],"walk":{"path":"assets/r1341/bosses/mb-ep1a11-walk8.webp","n":8,"fps":8,"nativeLeft":false}}}};// @@TABLE@@ scripts/r1337-boss-consistency.py 가 만든다
const BOSSES=window.__STORYWORLD_BOSS2D_R1337_DATA__?.bosses||{};
// R1341 일반 몹: 서 있을 때 고정할 칸(시트 cols 열 기준 칸 번호)과 숨쉬기 세기. 판정·걷기·공격 칸은 R380 그대로.
const MOBS=Object.freeze({'a11-c1':Object.freeze({name:'거짓천국 근위천사',path:'assets/r380/mobs/false-heaven-guard-v1.webp',cell:[256,256],cols:6,hold:0,breathe:.012})});
const PATH2={};// 원본 경로 → {boss, f(표 항목)}
for(const [b,B] of Object.entries(BOSSES))for(const f of B.frames)PATH2[f.path]={boss:b,f};
const FLOAT2={};for(const [b,B] of Object.entries(BOSSES))if(B.float)FLOAT2[B.float]=b;
const norm=s=>{s=String(s||'');const i=s.indexOf('assets/');return i>=0?s.slice(i):s;};
const asked=new Set();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;if(!asked.has(p)&&typeof addImage==='function'){asked.add(p);addImage(p,'R1337 boss 2D');}}catch(_){}return null;}
const floatPad=path=>{try{const A=window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts;if(!A)return null;for(const v of Object.values(A))if(v.path===path)return v.pad;}catch(_){}return null;};
const stOf=new WeakMap(),last={};
function st(e){let s=stOf.get(e);if(!s){s={k:0,wx:NaN,wy:NaN,lt:-1,move:0,vx:1};stOf.set(e,s);}return s;}
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const k=cmds[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}return best;}
const mirrored=P=>P[1][0]<P[0][0];
// 네 점(좌상·우상·우하·좌하, 그림 기준)에서 칸 안 (u,v) 비율 자리의 화면 좌표
const at=(P,u,v)=>[P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v,P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v];
const quad=(P,u0,v0,u1,v1)=>[at(P,u0,v0),at(P,u1,v0),at(P,u1,v1),at(P,u0,v1)];
const hgt=R=>Math.hypot(R[3][0]-R[0][0],R[3][1]-R[0][1]);
function setQuad(c,R){c.points=c.points.map((p,i)=>i<4?[R[i][0],R[i][1],...p.slice(2)]:p);}
function flipX(c){const P=c.points,fx=(P[2][0]+P[3][0])/2;c.points=P.map((p,i)=>i<4?[2*fx-p[0],p[1],...p.slice(2)]:p);}
function wantMirror(e,B){if(!prefs.face)return null;try{const L=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof L!=='boolean')return null;return L!==!!B.nativeLeft;}catch(_){return null;}}
const match=c=>{if(c?.kind!=='image'||!Array.isArray(c.points)||c.points.length<4)return null;const src=norm(c.sourcePath||c.image?.currentSrc||c.image?.src);const hit=PATH2[src],fb=hit?null:FLOAT2[src];return hit||fb?{src,hit,fb}:null;};
function process(e,cmds,st0){
 // 가장 큰 명령이 사본 대상이 아니어도(엔진 옛 그림·R409 테 등) 같은 보스 칸은 모두 손질한다 — R620 교차 보간의 옅은 원본 칸이 남으면
 //  R1229 가 그것을 '마지막 새 시트 칸'으로 배워 몸이 빠진 장면을 원본 크기로 메웠다(발록 피격 45%).
 const all=[];for(let i=st0;i<cmds.length;i++){const m=match(cmds[i]);if(m)all.push([cmds[i],m]);}if(!all.length)return;
 let body=null,mb=null,bh=0;for(const [c,m] of all){const h=Math.abs(c.points[3][1]-c.points[0][1])*(c.r620Ghost?.5:1);if(h>bh){bh=h;body=c;mb=m;}}
 const s=st(e),t=T(),dt=s.lt<0?0:Math.max(0,Math.min(.1,t-s.lt));s.lt=t;
 if(Number.isFinite(s.wx)&&dt>0){const dx=e.x-s.wx,dy=e.y-s.wy,sp=Math.hypot(dx,dy)/dt,sdx=dx-dy;if(Math.abs(sdx)>1e-4)s.vx=sdx>0?1:-1;s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*10);}
 s.wx=e.x;s.wy=e.y;stats.draws++;
 // R620 교차 보간이 앞 자세를 옅게 한 장 더 그린다 → 같은 보스 칸이면 모두 같은 손질(걷기 바꿔치기는 몸 한 장만)
 s.single=all.length===1&&bodyCmd(cmds,st0)===body;
 if(!s.pre){s.pre=true;const B=BOSSES[mb.hit?mb.hit.boss:mb.fb];for(const f of B.frames)img(f.out);if(B.walk){img(B.walk.path);if(B.walk.dark)img(B.walk.dark);}}
 for(const [c,m] of all)one(e,s,t,c,m,c===body);
}
function one(e,s,t,c,{src,hit,fb},isBody){
 const B=BOSSES[hit?hit.boss:fb],f=hit?.f||null,[cw,ch]=f?.cell||B.cell,[W0,H0]=B.cell,[OW,OH]=B.out,[pl,pt,pr]=B.pad;
 // 원래 칸(cw×ch)이 화면에 놓인 네 점 R 과 그 칸의 원래 발 자리
 let R=c.points.slice(0,4),foot=B.refFoot,cell=0;
 if(fb){const pad=floatPad(src);if(!pad)return;R=quad(R,pad[0],pad[1],1-pad[2],1-pad[3]);}
 else{const n=f.n||1;cell=f.alias?f.cell:(n>1&&Array.isArray(c.sourceRect)?Math.max(0,Math.min(n-1,Math.round(c.sourceRect[0]/cw))):0);foot=f.foot?.[f.alias?0:cell]||foot;}
 const k=hgt(R)/ch,G=at(R,foot[0],foot[1]);
 // 기준 배율은 대기 중(공격·피격·걷기·교차 보간 아님) 기준 칸 한 장만 그려질 때만 배운다 — R620 교차 보간은 옅은 앞 자세를 지금 자세 크기로 그려 배율을 흐린다.
 if(isBody&&f?.ref&&!f.alias&&s.single&&!e.attack&&!(e.hitTimer>0)&&s.move<.5){s.k=s.k?s.k+(k-s.k)*.15:k;}
 const walking=isBody&&!!B.walk&&prefs.walk&&s.move>.5&&!e.attack&&!(e.hitTimer>0)&&e.hp>0;
 let out=null,ocell=0;
 if(walking){out=f?.dark&&B.walk.dark?B.walk.dark:B.walk.path;ocell=Math.floor(t*B.walk.fps)%B.walk.n;}
 else if(!fb&&prefs.art){out=f.out;ocell=f.alias?f.cell:cell;}
 const im=out?img(out):null;
 if(!im){// 사본이 아직 안 읽혔거나 떠서 이동 칸: 배율만 맞춘다
  if(prefs.scale&&s.k&&!f?.ref&&Math.abs(s.k/k-1)>.005){const g=s.k/k;c.points=c.points.map((p,i)=>i<4?[G[0]+(p[0]-G[0])*g,G[1]+(p[1]-G[1])*g,...p.slice(2)]:p);stats.scaled++;}
  return;}
 // 배율 고정: 기준 배율 s.k 로 R 을 발 G 기준 다시 재고, 사본의 발(=기준 발 자리)이 G 에 오게 옮긴 뒤 pad 만큼 넓힌다
 const g=prefs.scale&&s.k?s.k/k:1;if(Math.abs(g-1)>.005)stats.scaled++;last[hit?hit.boss:fb]={k:+k.toFixed(4),sk:+(s.k||0).toFixed(4),g:+g.toFixed(3),src:src.split('/').pop(),body:isBody};
 // 그림 한 픽셀의 화면 벡터(ex·ey)를 g 배 한 뒤, 기준 칸(W0×H0)을 기준 발이 G 에 오게 놓는다(칸 크기가 기준과 같으면 R1337 전과 같은 결과).
 const ex=[(R[1][0]-R[0][0])/cw*g,(R[1][1]-R[0][1])/cw*g],ey=[(R[3][0]-R[0][0])/ch*g,(R[3][1]-R[0][1])/ch*g],fu=B.refFoot[0]*W0,fv=B.refFoot[1]*H0;
 const o0=[G[0]-ex[0]*fu-ey[0]*fv,G[1]-ex[1]*fu-ey[1]*fv];
 const R2=[o0,[o0[0]+ex[0]*W0,o0[1]+ex[1]*W0],[o0[0]+ex[0]*W0+ey[0]*H0,o0[1]+ex[1]*W0+ey[1]*H0],[o0[0]+ey[0]*H0,o0[1]+ey[1]*H0]];
 c.image=im;c.sourcePath=out;c.sourceRect=[ocell*OW,0,OW,OH];setQuad(c,quad(R2,-pl,-pt,1+pr,1));stats.swapped++;if(walking)stats.walk++;
 // 좌우: 걷기는 가는 쪽, 그 밖은 R444 left(e) 하나로(모든 사본이 같은 쪽을 보게 만들었다)
 const wm=walking?((s.vx<0)!==!!B.walk.nativeLeft):wantMirror(e,B);
 if(wm!=null&&mirrored(c.points)!==wm){const gx=G[0];c.points=c.points.map((p,i)=>i<4?[2*gx-p[0],p[1],...p.slice(2)]:p);stats.faced++;}
}
// R1341 일반 몹 서 있기 고정: 몸 그림 명령(R620 옅은 잔상 포함)의 칸을 hold 칸으로, 발 줄 기준 세로 숨쉬기.
const mobHash=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return (h%1000)/1000;};
function mobProcess(e,M,cmds,st0){const s=st(e),t=T(),dt=s.lt<0?0:Math.max(0,Math.min(.1,t-s.lt));s.lt=t;
 if(Number.isFinite(s.wx)&&dt>0){const sp=Math.hypot(e.x-s.wx,e.y-s.wy)/dt;s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*10);}s.wx=e.x;s.wy=e.y;
 const idle=e.hp>0&&!e.attack&&!(e.hitTimer>0)&&!(e.rangedWindup>0)&&!e.moving&&s.move<.3;if(!idle)return;
 const [cw,ch]=M.cell,sx=(M.hold%M.cols)*cw,sy=Math.floor(M.hold/M.cols)*ch,b=1+M.breathe*Math.sin(t*1.9+mobHash(e.id)*6.28);
 for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||!Array.isArray(c.points)||c.points.length<4||!Array.isArray(c.sourceRect))continue;if(norm(c.sourcePath||c.image?.currentSrc||c.image?.src)!==M.path)continue;
  if(c.sourceRect[2]!==cw||c.sourceRect[3]!==ch)continue;c.sourceRect=[sx,sy,cw,ch];if(Array.isArray(c.sourceAlphaCore))c.sourceAlphaCore=[sx,sy,cw,ch];
  const P=c.points,by=(P[2][1]+P[3][1])/2;c.points=P.map((p,j)=>j<4?[p[0],by+(p[1]-by)*b,...p.slice(2)]:p);stats.mobHold=(stats.mobHold||0)+1;}}
// ---- drawEnemy 맨 바깥 감싸기(R1226 과 같은 방식, 다른 오버레이가 나중에 감싸면 다시 바깥으로, 최대 8번) ----
let mine=null,rewraps=0,depth=0;
function wrap(){if(typeof drawEnemy!=='function')return;const base=drawEnemy;
 const me=function(e,...a){const rec=typeof ctx==='object'?ctx:null,cmds=Array.isArray(rec?.commands)?rec.commands:null,st0=cmds?.length??0;let r;depth++;try{r=base.apply(this,[e,...a]);}finally{depth--;}
  // 다시 감쌀 때 옛 감싸개가 안쪽에 남고, 다른 오버레이가 옛 감싸개를 직접 부르기도 한다 → 호출 줄에서 가장 바깥에 있는 이 감싸개 한 번만 손질한다.
  if(depth===0&&prefs.on&&cmds&&cmds.length>st0&&e&&!e.boss&&MOBS[e.nativeId])try{mobProcess(e,MOBS[e.nativeId],cmds,st0);}catch(err){fail(err);}
  else if(depth===0&&prefs.on&&cmds&&cmds.length>st0&&e&&(e.boss||e.midboss||e.wardChampionR81===true||/^mb-|-boss$/.test(String(e.nativeId||''))))try{process(e,cmds,st0);}catch(err){fail(err);}return r;};
 // 안쪽 감싸개들의 표식(__r974·__r1230 등)을 옮겨 준다(표식이 없으면 그 오버레이가 자기가 빠졌다고 보고 다시 감싼다).
 try{Object.assign(me,base);}catch(_){}me.__r1337=true;mine=me;drawEnemy=me;stats.wraps++;}
wrap();
// R974(최대 6번)·R1226(최대 6번) 등이 게임 시작 뒤 다시 바깥을 감싼다 → 이 오버레이는 더 오래(최대 40번) 바깥 자리를 되찾는다.
const keepOuter=()=>{try{if(typeof drawEnemy==='function'&&drawEnemy!==mine&&rewraps<40){rewraps++;wrap();}}catch(err){fail(err);}};
try{setInterval(keepOuter,700);}catch(_){}
function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
// R1229(발록 렌더 맞춤)는 칸마다 보이는 키로 크기를 다시 맞춘다 → 손질 사본이면 그 보스 기준 칸의 알파 테두리 비율을 돌려줘 모든 칸이 같은 배율로 놓이게 한다.
const OUT2={};for(const B of Object.values(BOSSES)){for(const f of B.frames)OUT2[f.out]=B;if(B.walk)OUT2[B.walk.path]=B;}
function frac(src){if(!prefs.on||!prefs.scale)return null;const B=OUT2[norm(src)];return B&&B.refFrac?{...B.refFrac}:null;}
window.__STORYWORLD_BOSS2D_R1337__=Object.freeze({revision:REV,set,frac,prefs:()=>({...prefs}),inspect:()=>({rev:REV,outermost:typeof drawEnemy==='function'&&drawEnemy===mine,inChain:typeof drawEnemy==='function'&&!!drawEnemy.__r1337,prefs:{...prefs},stats:{...stats},lastError,last:JSON.parse(JSON.stringify(last)),bosses:Object.keys(BOSSES),mobs:Object.keys(MOBS)}),table:()=>JSON.parse(JSON.stringify(BOSSES))});
})();
