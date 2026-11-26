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
//  끄기: localStorage['storyworld.r1337.boss2d']='{"on":false}' · 점검: window.__STORYWORLD_BOSS2D_R1337__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BOSS2D_R1337__)return;
const REV='R1337-boss2d-1',KEY='storyworld.r1337.boss2d';
let prefs={on:true,scale:true,face:true,walk:true,art:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,swapped:0,scaled:0,faced:0,walk:0,wraps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
window.__STORYWORLD_BOSS2D_R1337_DATA__={"revision":"R1337","bosses":{"root":{"name":"뿌리의 문지기","cell":[421,463],"out":[606,519],"pad":[0.22,0.12,0.22],"nativeLeft":false,"float":"assets/r1029/float/dist00-boss-p4.webp","refFoot":[0.4373,0.879],"refFrac":{"top":0.1214,"bot":0.8921,"cx":0.4566},"frames":[{"path":"assets/r104/bosses/dist00-boss-p4.webp","out":"assets/r1337/bosses/dist00-boss-p4.webp","ref":true,"state":"idle","foot":[[0.4373,0.879]],"sc":[1.0],"cw":421,"ch":463},{"path":"assets/r1147/bosses/dist00-idle6.webp","out":"assets/r1337/bosses/dist00-idle6.webp","n":6,"ref":true,"state":"idle","foot":[[0.4588,0.8812],[0.4641,0.8812],[0.4746,0.8812],[0.4583,0.8812],[0.4614,0.879],[0.4571,0.8812]],"sc":[0.9438,0.9316,0.9184,0.9326,0.9392,0.9431],"cw":421,"ch":463},{"path":"assets/r104/bosses/dist00-boss-p1.webp","out":"assets/r1337/bosses/dist00-boss-p1.webp","state":"attack","foot":[[0.5439,0.9611]],"sc":[0.9742],"cw":421,"ch":463},{"path":"assets/r104/bosses/dist00-boss-p2.webp","out":"assets/r1337/bosses/dist00-boss-p2.webp","state":"attack","foot":[[0.4519,0.987]],"sc":[1.015],"cw":421,"ch":463},{"path":"assets/r104/bosses/dist00-boss-p3.webp","out":"assets/r1337/bosses/dist00-boss-p3.webp","state":"attack","foot":[[0.4911,0.905]],"sc":[1.0839],"cw":421,"ch":463},{"path":"assets/r1147/bosses/dist00-hit4.webp","out":"assets/r1337/bosses/dist00-hit4.webp","n":4,"state":"hit","foot":[[0.4431,0.8812],[0.4498,0.8812],[0.4423,0.8812],[0.4278,0.879]],"sc":[0.925,0.9326,0.9334,1.0],"cw":421,"ch":463}],"walk":{"path":"assets/r1337/bosses/dist00-walk6.webp","n":6,"fps":8,"nativeLeft":false}},"blood":{"name":"핏빛 수호로 추격자","cell":[438,495],"out":[657,594],"pad":[0.25,0.2,0.25],"nativeLeft":false,"float":"assets/r1029/float/mb-dist03-p4.webp","refFoot":[0.528,0.899],"refFrac":{"top":0.2441,"bot":0.9158,"cx":0.5187},"frames":[{"path":"assets/r104/bosses/mb-dist03-p4.webp","out":"assets/r1337/bosses/mb-dist03-p4.webp","ref":true,"state":"idle","foot":[[0.528,0.899]],"sc":[1.0],"cw":438,"ch":495},{"path":"assets/r104/bosses/mb-dist03-p1.webp","out":"assets/r1337/bosses/mb-dist03-p1.webp","state":"attack","foot":[[0.5178,0.9879]],"sc":[1.0],"cw":438,"ch":495},{"path":"assets/r104/bosses/mb-dist03-p2.webp","out":"assets/r1337/bosses/mb-dist03-p2.webp","state":"attack","foot":[[0.4237,0.9838]],"sc":[1.0315],"cw":438,"ch":495},{"path":"assets/r104/bosses/mb-dist03-p3.webp","out":"assets/r1337/bosses/mb-dist03-p3.webp","state":"attack","foot":[[0.6413,0.9313]],"sc":[1.0],"cw":438,"ch":495}]},"balrog":{"name":"발록","cell":[508,501],"out":[732,601],"pad":[0.22,0.2,0.22],"nativeLeft":false,"float":null,"refFoot":[0.4251,0.8743],"refFrac":{"top":0.2296,"bot":0.8952,"cx":0.4477},"frames":[{"path":"assets/r104/bosses/dist06-boss-p4.webp","out":"assets/r1337/bosses/dist06-boss-p4.webp","ref":true,"state":"idle","foot":[[0.4251,0.8743]],"sc":[1.0],"cw":508,"ch":501},{"path":"assets/r1147/bosses/dist06-idle6.webp","out":"assets/r1337/bosses/dist06-idle6.webp","n":6,"ref":true,"state":"idle","foot":[[0.4538,0.8743],[0.4699,0.8743],[0.4785,0.8743],[0.4651,0.8743],[0.4427,0.8743],[0.4492,0.8743]],"sc":[0.9412,0.9398,0.9327,0.9287,0.941,0.9463],"cw":508,"ch":501},{"path":"assets/r104/bosses/dist06-boss-p1.webp","out":"assets/r1337/bosses/dist06-boss-p1.webp","state":"attack","foot":[[0.5489,0.9541]],"sc":[1.0323],"cw":508,"ch":501},{"path":"assets/r104/bosses/dist06-boss-p2.webp","out":"assets/r1337/bosses/dist06-boss-p2.webp","state":"attack","foot":[[0.6053,0.986]],"sc":[1.0644],"cw":508,"ch":501},{"path":"assets/r104/bosses/dist06-boss-p3.webp","out":"assets/r1337/bosses/dist06-boss-p3.webp","state":"attack","foot":[[0.6198,0.978]],"sc":[1.0343],"cw":508,"ch":501},{"path":"assets/r1147/bosses/dist06-hit4.webp","out":"assets/r1337/bosses/dist06-hit4.webp","n":4,"state":"hit","foot":[[0.4647,0.8743],[0.4618,0.8743],[0.4738,0.8723],[0.4524,0.8723]],"sc":[0.9673,0.9578,0.9798,0.98],"cw":508,"ch":501},{"path":"assets/generated-v31224/actors-normalized/bee76e221b69_balrog-hit.webp","out":"assets/r1337/bosses/dist06-hit4.webp","cell":1,"n":4,"state":"hit","alias":true,"cw":672,"ch":384,"foot":[[0.492,0.9167]]},{"path":"assets/generated-v31224/actors-normalized/80f5ab6bab50_balrog-idle.webp","out":"assets/r1337/bosses/dist06-idle6.webp","cell":0,"n":6,"state":"hit","alias":true,"cw":672,"ch":384,"foot":[[0.5202,0.9167]]}]},"scream":{"name":"복도 비명잔영","cell":[350,368],"out":[504,412],"pad":[0.22,0.12,0.22],"nativeLeft":false,"float":null,"refFoot":[0.464,0.9321],"refFrac":{"top":0.1189,"bot":0.9393,"cx":0.475},"frames":[{"path":"assets/r118/clean/assets/visual-test/hospital-ranged-motion-r52.png","out":"assets/r1337/mobs/scream-r52.webp","ref":true,"state":"idle","rects":[[0,718,350,368],[350,718,380,368],[730,718,405,368]],"foot":[[0.464,0.9321],[0.4797,0.962],[0.3504,0.9457]],"sc":[1.0,1.0,1.0]},{"path":"assets/r1001/move/corridor-scream-echo-up.webp","out":"assets/r1337/mobs/scream-up.webp","n":4,"state":"walk","foot":[[0.5109,0.8906],[0.5063,0.8255],[0.5124,0.849],[0.5127,0.8906]],"sc":[1.25,1.25,1.25,1.25],"cw":384,"ch":384},{"path":"assets/r1001/move/corridor-scream-echo-down.webp","out":"assets/r1337/mobs/scream-down.webp","n":4,"state":"walk","foot":[[0.512,0.8984],[0.5142,0.8281],[0.5147,0.8594],[0.511,0.9167]],"sc":[1.25,1.25,1.25,1.25],"cw":384,"ch":384},{"path":"assets/episode1a/generated-v392/corridor_scream_echo.webp","out":"assets/r1337/mobs/scream-r52.webp","cell":0,"n":3,"state":"walk","alias":true,"cw":418,"ch":418,"foot":[[0.4712,0.9809]]}],"ids":["a08-s1"]},"surgeon":{"name":"병원 심부의 집도의","cell":[314,314],"out":[502,392],"pad":[0.3,0.25,0.3],"nativeLeft":false,"float":null,"refFoot":[0.5106,0.9777],"refFrac":{"top":0.4337,"bot":0.9847,"cx":0.5071},"frames":[{"path":"assets/r118/clean/assets/visual-test/hospital-boss-motion-r53.png","out":"assets/r1337/mobs/surgeon-r53.webp","ref":true,"state":"idle","rects":[[0,0,314,314],[314,0,313,314],[627,0,313,314],[940,0,314,314],[0,314,314,313],[314,314,313,313],[627,314,313,313],[940,314,314,313],[0,627,314,313],[314,627,313,313],[627,627,313,313],[940,627,314,313],[0,940,314,314],[314,940,313,314],[627,940,313,314],[940,940,314,314]],"foot":[[0.5106,0.9777],[0.5485,0.9745],[0.4206,0.9682],[0.4895,0.9777],[0.5306,0.9137],[0.5746,0.9137],[0.4122,0.9233],[0.4998,0.9169],[0.4843,0.869],[0.5948,0.869],[0.4865,0.869],[0.5058,0.869],[0.5173,0.7643],[0.5553,0.7611],[0.4693,0.7611],[0.5086,0.7771]],"sc":[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0]},{"path":"assets/r104/bosses/mb-ep1a08-p1.webp","out":"assets/r1337/mobs/surgeon-p1.webp","state":"attack","foot":[[0.4885,0.9875]],"sc":[0.5755],"cw":359,"ch":480},{"path":"assets/r104/bosses/mb-ep1a08-p2.webp","out":"assets/r1337/mobs/surgeon-p2.webp","state":"attack","foot":[[0.4106,0.9875]],"sc":[0.5755],"cw":359,"ch":480},{"path":"assets/r104/bosses/mb-ep1a08-p3.webp","out":"assets/r1337/mobs/surgeon-p3.webp","state":"attack","foot":[[0.5089,0.8896]],"sc":[0.5755],"cw":359,"ch":480},{"path":"assets/r104/bosses/mb-ep1a08-p4.webp","out":"assets/r1337/mobs/surgeon-p4.webp","state":"idle","foot":[[0.4364,0.8958]],"sc":[0.5755],"cw":359,"ch":480},{"path":"assets/r974/move/mb-ep1a08-side.webp","out":"assets/r1337/mobs/surgeon-side.webp","n":4,"state":"walk","foot":[[0.4595,0.9167],[0.4138,0.9167],[0.4177,0.9167],[0.3902,0.9141]],"sc":[0.766,0.75,0.7397,0.75],"cw":384,"ch":384},{"path":"assets/r974/move/mb-ep1a08-up.webp","out":"assets/r1337/mobs/surgeon-up.webp","n":4,"state":"walk","foot":[[0.543,0.9167],[0.5279,0.9141],[0.5188,0.9167],[0.5036,0.9141]],"sc":[0.6923,0.6923,0.6968,0.7152],"cw":384,"ch":384},{"path":"assets/r974/move/mb-ep1a08-down.webp","out":"assets/r1337/mobs/surgeon-down.webp","n":4,"state":"walk","foot":[[0.5012,0.9167],[0.4939,0.9167],[0.4708,0.9167],[0.4329,0.9167]],"sc":[0.7176,0.7105,0.7082,0.7059],"cw":384,"ch":384}],"ids":["mb-ep1a08"]},"blackmarket":{"name":"암시장의 수상한 자(옛 오만의 흰 가면)","cell":[256,320],"out":[422,352],"pad":[0.25,0.1,0.4],"nativeLeft":false,"float":null,"refFoot":[0.4108,0.9406],"refFrac":{"top":0.2727,"bot":0.946,"cx":0.4008},"frames":[{"path":"assets/r380/mobs/blackmarket-suspect-v1.webp","out":"assets/r1337/mobs/blackmarket-v1.webp","n":8,"ref":true,"state":"idle","foot":[[0.4108,0.9406],[0.3743,0.9406],[0.4209,0.9406],[0.3701,0.9406],[0.3628,0.9406],[0.321,0.9406],[0.3638,0.9406],[0.3684,0.9406]],"sc":[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0],"cw":256,"ch":320},{"path":"assets/r1018/move/blackmarket-suspect-up.webp","out":"assets/r1337/mobs/blackmarket-up.webp","n":4,"state":"walk","foot":[[0.5046,0.9193],[0.5041,0.9036],[0.5029,0.9193],[0.4825,0.9036]],"sc":[0.8925,0.9301,0.9039,0.9198],"cw":384,"ch":384},{"path":"assets/r1018/move/blackmarket-suspect-down.webp","out":"assets/r1337/mobs/blackmarket-down.webp","n":4,"state":"walk","foot":[[0.5073,0.9167],[0.478,0.901],[0.5066,0.9167],[0.51,0.8984]],"sc":[0.892,0.9149,0.8918,0.9116],"cw":384,"ch":384}],"ids":["a10-o1"]},"superego":{"name":"초자아 잠식체","cell":[418,418],"out":[585,481],"pad":[0.2,0.15,0.2],"nativeLeft":false,"float":null,"refFoot":[0.445,0.9402],"refFrac":{"top":0.1414,"bot":0.948,"cx":0.4609},"frames":[{"path":"assets/episode1a/generated-v392/ego_corrosion_vessel.webp","out":"assets/r1337/mobs/superego-base.webp","ref":true,"state":"idle","foot":[[0.445,0.9402]],"sc":[1.0],"cw":418,"ch":418},{"path":"assets/r1226/mobs/superego-attack.webp","out":"assets/r1337/mobs/superego-attack.webp","n":4,"state":"attack","foot":[[0.403,0.9062],[0.4041,0.9031],[0.3987,0.9062],[0.403,0.9062]],"sc":[2,2,2,2],"cw":320,"ch":320},{"path":"assets/r1029/float/ego-corrosion-vessel.webp","srcN":8,"out":"assets/r1337/mobs/superego-base.webp","cell":0,"n":1,"state":"walk","alias":true,"cw":287,"ch":256,"foot":[[0.454,0.9219]]}],"ids":["a11-d1"]}}};// @@TABLE@@ scripts/r1337-boss-consistency.py 가 만든다
// R1349: 2D 몹·보스 전수 손질 표(mob-2d-consistency-r1349-data.js, 이 파일보다 먼저 실림)를 합친다 — 같은 이름이면 R1337 이 이긴다.
const BOSSES=Object.assign({},window.__STORYWORLD_BOSS2D_R1349_DATA__?.bosses||{},window.__STORYWORLD_BOSS2D_R1337_DATA__?.bosses||{});
// R1337b: 일반 몹·아틀라스(가변 칸) 대상 — 표 항목 ids(몹 nativeId)로 그 몹만 손질하고, 같은 그림을 다른 몹이 써도 건드리지 않는다.
const PB={},PATH2={},IDS={};// PB[보스][원본 경로]=[표 항목…] · PATH2: ids 없는 보스만 경로로 주인 찾기
for(const [b,B] of Object.entries(BOSSES)){PB[b]={};for(const f of B.frames)(PB[b][f.path]||(PB[b][f.path]=[])).push(f);
 if(Array.isArray(B.ids))for(const id of B.ids)IDS[id]=b;else for(const f of B.frames)PATH2[f.path]=b;}
const FLOAT2={};for(const [b,B] of Object.entries(BOSSES))if(B.float)FLOAT2[B.float]=b;
const ownerOf=e=>IDS[String(e?.nativeId||'')]||null;
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
const pickF=(L,c)=>{const SR=c.sourceRect;for(const f of L){if(!f.rects)return {f,ri:-1};if(!Array.isArray(SR))continue;const i=f.rects.findIndex(r=>Math.abs(r[0]-SR[0])<2&&Math.abs(r[1]-SR[1])<2&&Math.abs(r[2]-SR[2])<3&&Math.abs(r[3]-SR[3])<3);if(i>=0)return {f,ri:i};}return null;};
const match=(c,b)=>{if(c?.kind!=='image'||!Array.isArray(c.points)||c.points.length<4)return null;const src=norm(c.sourcePath||c.image?.currentSrc||c.image?.src);
 const ob=b||PATH2[src]||null;if(ob){const L=PB[ob]?.[src];const pf=L?pickF(L,c):null;if(pf)return {src,hit:{boss:ob,f:pf.f,ri:pf.ri}};}
 const fb=FLOAT2[src];return fb&&(!b||fb===b)?{src,hit:null,fb}:null;};
function process(e,cmds,st0){
 // 가장 큰 명령이 사본 대상이 아니어도(엔진 옛 그림·R409 테 등) 같은 보스 칸은 모두 손질한다 — R620 교차 보간의 옅은 원본 칸이 남으면
 //  R1229 가 그것을 '마지막 새 시트 칸'으로 배워 몸이 빠진 장면을 원본 크기로 메웠다(발록 피격 45%).
 let own=ownerOf(e);if(!own)for(let i=st0;i<cmds.length&&!own;i++){const m=match(cmds[i]);if(m)own=m.hit?m.hit.boss:m.fb;}if(!own)return;
 const all=[];for(let i=st0;i<cmds.length;i++){const m=match(cmds[i],own);if(m)all.push([cmds[i],m]);}if(!all.length)return;
 let body=null,mb=null,bh=0;for(const [c,m] of all){const h=Math.abs(c.points[3][1]-c.points[0][1])*(c.r620Ghost?.5:1);if(h>bh){bh=h;body=c;mb=m;}}
 const s=st(e),t=T(),dt=s.lt<0?0:Math.max(0,Math.min(.1,t-s.lt));s.lt=t;
 if(Number.isFinite(s.wx)&&dt>0){const dx=e.x-s.wx,dy=e.y-s.wy,sp=Math.hypot(dx,dy)/dt,sdx=dx-dy;if(Math.abs(sdx)>1e-4)s.vx=sdx>0?1:-1;s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*10);}
 s.wx=e.x;s.wy=e.y;stats.draws++;
 // R620 교차 보간이 앞 자세를 옅게 한 장 더 그린다 → 같은 보스 칸이면 모두 같은 손질(걷기 바꿔치기는 몸 한 장만)
 s.single=all.length===1&&bodyCmd(cmds,st0)===body;
 if(!s.pre){s.pre=true;const B=BOSSES[mb.hit?mb.hit.boss:mb.fb];for(const f of B.frames)img(f.out);if(B.walk)img(B.walk.path);}
 for(const [c,m] of all)one(e,s,t,c,m,c===body);
}
function one(e,s,t,c,{src,hit,fb},isBody){
 const B=BOSSES[hit?hit.boss:fb],f=hit?.f||null,ri=hit?.ri??-1,[OW,OH]=B.out,[pl,pt,pr]=B.pad;
 const [cw,ch]=ri>=0?f.rects[ri].slice(2,4):(f?.cw?[f.cw,f.ch]:B.cell);
 // 원래 칸(cw×ch)이 화면에 놓인 네 점 R 과 그 칸의 원래 발 자리
 let R=c.points.slice(0,4),foot=B.refFoot,cell=0;
 if(fb){const pad=floatPad(src);if(!pad)return;R=quad(R,pad[0],pad[1],1-pad[2],1-pad[3]);}
 else{const n=f.n||1;cell=f.alias?f.cell:ri>=0?ri:(n>1&&Array.isArray(c.sourceRect)?Math.max(0,Math.min(n-1,Math.round(c.sourceRect[0]/cw))):0);foot=f.foot?.[f.alias?0:cell]||foot;}
 const k=hgt(R)/ch,G=at(R,foot[0],foot[1]);
 // 기준 배율은 대기 중(공격·피격·걷기·교차 보간 아님) 기준 칸 한 장만 그려질 때만 배운다 — R620 교차 보간은 옅은 앞 자세를 지금 자세 크기로 그려 배율을 흐린다.
 if(isBody&&f?.ref&&!f.alias&&s.single&&!e.attack&&!(e.hitTimer>0)&&s.move<.5){s.k=s.k?s.k+(k-s.k)*.15:k;}
 const walking=isBody&&!!B.walk&&prefs.walk&&s.move>.5&&!e.attack&&!(e.hitTimer>0)&&e.hp>0;
 let out=null,ocell=0;
 if(walking){out=B.walk.path;ocell=Math.floor(t*B.walk.fps)%B.walk.n;}
 else if(!fb&&prefs.art){out=f.out;ocell=f.alias?f.cell:cell;}
 const im=out?img(out):null;
 if(!im){// 사본이 아직 안 읽혔거나 떠서 이동 칸: 배율만 맞춘다
  if(prefs.scale&&s.k&&!f?.ref&&Math.abs(s.k/k-1)>.005){const g=s.k/k;c.points=c.points.map((p,i)=>i<4?[G[0]+(p[0]-G[0])*g,G[1]+(p[1]-G[1])*g,...p.slice(2)]:p);stats.scaled++;}
  return;}
 // 배율 고정: 기준 배율 s.k 로 R 을 발 G 기준 다시 재고, 사본의 발(=기준 발 자리)이 G 에 오게 옮긴 뒤 pad 만큼 넓힌다
 const g=prefs.scale&&s.k?s.k/k:1;if(Math.abs(g-1)>.005)stats.scaled++;last[hit?hit.boss:fb]={k:+k.toFixed(4),sk:+(s.k||0).toFixed(4),g:+g.toFixed(3),src:src.split('/').pop(),body:isBody};
 // (기준 배율을 아직 못 배웠으면 이 칸의 원본 배율 ÷ 손질 배율 sc 로 — 첫 장면에 작게 튀던 집도의 p4)
 // 사본 칸은 기준 칸(W×H)에 pad 를 더한 캔버스 → 화면에서 기준 칸 상자는 '기준 칸 px × 배율(s.k)'. 원본 칸 크기가 기준과 달라도(R1337b 아틀라스·다른 해상도 시트) 같은 크기로 놓인다.
 const [W0,H0]=B.cell,sc=prefs.scale&&s.k?s.k:k/(f?.sc?.[f.alias?0:cell]||1),wx=R[1][0]-R[0][0],wy=R[1][1]-R[0][1],hx=R[3][0]-R[0][0],hy=R[3][1]-R[0][1],lw=Math.hypot(wx,wy)||1,lh=Math.hypot(hx,hy)||1;
 const ux=[wx/lw*W0*sc,wy/lw*W0*sc],uy=[hx/lh*H0*sc,hy/lh*H0*sc],O=[G[0]-ux[0]*B.refFoot[0]-uy[0]*B.refFoot[1],G[1]-ux[1]*B.refFoot[0]-uy[1]*B.refFoot[1]];
 let R2=[O,[O[0]+ux[0],O[1]+ux[1]],[O[0]+ux[0]+uy[0],O[1]+ux[1]+uy[1]],[O[0]+uy[0],O[1]+uy[1]]];
 c.image=im;c.sourcePath=out;c.sourceRect=[ocell*OW,0,OW,OH];setQuad(c,quad(R2,-pl,-pt,1+pr,1));stats.swapped++;if(walking)stats.walk++;
 // 좌우: 걷기는 가는 쪽, 그 밖은 R444 left(e) 하나로(모든 사본이 같은 쪽을 보게 만들었다)
 const wm=walking?((s.vx<0)!==!!B.walk.nativeLeft):wantMirror(e,B);
 if(wm!=null&&mirrored(c.points)!==wm){const gx=G[0];c.points=c.points.map((p,i)=>i<4?[2*gx-p[0],p[1],...p.slice(2)]:p);stats.faced++;}
}
// ---- drawEnemy 맨 바깥 감싸기(R1226 과 같은 방식, 다른 오버레이가 나중에 감싸면 다시 바깥으로, 최대 8번) ----
let mine=null,rewraps=0,depth=0;
function wrap(){if(typeof drawEnemy!=='function')return;const base=drawEnemy;
 const me=function(e,...a){const rec=typeof ctx==='object'?ctx:null,cmds=Array.isArray(rec?.commands)?rec.commands:null,st0=cmds?.length??0;let r;depth++;try{r=base.apply(this,[e,...a]);}finally{depth--;}
  // 다시 감쌀 때 옛 감싸개가 안쪽에 남고, 다른 오버레이가 옛 감싸개를 직접 부르기도 한다 → 호출 줄에서 가장 바깥에 있는 이 감싸개 한 번만 손질한다.
  if(depth===0&&prefs.on&&cmds&&cmds.length>st0&&e&&(e.boss||e.midboss||e.wardChampionR81===true||/^mb-|-boss$/.test(String(e.nativeId||''))||ownerOf(e)))try{process(e,cmds,st0);}catch(err){fail(err);}return r;};
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
window.__STORYWORLD_BOSS2D_R1337__=Object.freeze({revision:REV,set,frac,prefs:()=>({...prefs}),inspect:()=>({rev:REV,outermost:typeof drawEnemy==='function'&&drawEnemy===mine,inChain:typeof drawEnemy==='function'&&!!drawEnemy.__r1337,prefs:{...prefs},stats:{...stats},lastError,last:JSON.parse(JSON.stringify(last)),bosses:Object.keys(BOSSES)}),table:()=>JSON.parse(JSON.stringify(BOSSES))});
})();
