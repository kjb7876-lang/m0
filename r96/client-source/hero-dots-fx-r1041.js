/* R1041 영웅 스킬 이펙트 — Dots CX-0099FX 프레임 시트 1차분 적용 (사용자 2026-11-14 12:10Z "미카엘라같이 도트나 코드로 아직 스킬 구현해서
 * 어색한 것도 닷츠에게 명령해서 프레임애니메이션 이펙트로", 13:53Z "영웅들 스킬이펙트 프레임애니메이션으로 적용 … 가장 시급하게").
 * 그리기 기록기(DrawCommands)의 push 에서, 코드로 만든 R106 '1장 그림' 명령의 그림·칸만 Dots 시트 칸으로 바꾼다(자리·크기·알파·합성은 원래 호출 그대로).
 *  M1 미카엘라 후광   : r101:aura-front 의 R106 'halo'                       → fx-m1-michaela-halo (반복 8칸, 256×96 = 원래 후광과 같은 비율)
 *  A5 슬레이어 피 불꽃: r101:aura-back 의 R106 'flame'(검붉은 DARK·슬레이어색) → fx-a5-slayer-flame (반복 8칸, 발밑 기준) · 덧칠 불꽃 한 겹은 뺀다
 *  C4 성장 바닥 고리 : r101:aura-back 의 발밑 R106 'glow'(가로 2:1)          → fx-c4-ground-ring (반복 8칸)
 *  H6 환도 발도      : R106 'iai-cut'(along)                                → fx-h6-hwando-iai (1회 8칸) · 같은 범위의 'slashline' 덧줄은 뺀다
 *  C2 영웅 피격      : R101 heroHurt(r101:N, 영웅 자리) 의 손그림 sig-hit    → fx-c2-hero-hurt (1회 6칸) · 코드 선 줄기(stroke)는 뺀다
 * r2(11-15 Dots 심사 통과분):
 *  M3 미카엘라 EGO   : R1039 가 그리던 sig-aura/gather-magenta(r111:ego-*)  → fx-m3-michaela-ego-on(발동 6칸) → fx-m3-michaela-ego-loop(반복 10칸)
 *  M4 미카엘라 적중   : R101 heroHit 의 sig-hit                              → fx-m4-michaela-hit (1회 8칸)
 *  M5 바닥 하트      : R948 groundHeart 채우기·테두리(r948:…:mark/ground/blast) → fx-m5-michaela-ground-heart (그려짐 4칸 뒤 맥박)
 *  M7 하늘 빛기둥    : R563 코드 기둥 채우기(r563:pillar:…:beam)               → fx-m7-michaela-sky-pillar (1회 12칸, 칸 바닥 .98 = 기둥 발)
 * 시트 그림이 아직 안 받아졌으면 원래 그림 그대로(효과가 통째로 사라지지 않게). 끄기: localStorage storyworld.r1041.dotsfx = 'off'.
 * 판정·피해·시간은 바꾸지 않는다(그리기만). 십자가·뒤집기 없음. */
(()=>{'use strict';
if(window.__STORYWORLD_HERO_DOTS_FX_R1041__)return;
const REV='R1293-michaela-play-fx+R1270-iai-hwando-only+R1235c-michaela-mk-sheets+R1235-michaela-skill-sheets+R1041-hero-dots-fx-1',KEY='storyworld.r1041.dotsfx',fin=Number.isFinite;
const stats={swapped:0,dropped:0,hurts:0,fallback:0,kept:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let on=true;try{const v=localStorage.getItem(KEY);if(v==='off'||v==='0'||v==='false')on=false;}catch(_){}
const DIR='assets/r1041/';
// cw·ch = 칸 크기, n = 칸 수, fps, once = 1회(발동부터 나이로) / 아니면 반복(시간으로), gain = 알파 배율(가는 손그림 선이 원래 뭉친 빛보다 옅어 보여서)
const SHEET=Object.freeze({
 M1:{path:DIR+'fx-m1-michaela-halo.webp',cw:256,ch:96,n:8,fps:12,gain:1.15},
 A5:{path:DIR+'fx-a5-slayer-flame.webp',cw:256,ch:256,n:8,fps:12},
 C4:{path:DIR+'fx-c4-ground-ring.webp',cw:256,ch:128,n:8,fps:10,gain:1.6},
 H6:{path:DIR+'fx-h6-hwando-iai.webp',cw:512,ch:128,n:8,fps:24,once:true},
 C2:{path:DIR+'fx-c2-hero-hurt.webp',cw:192,ch:192,n:6,fps:6/.42,once:true},
 // r2(11-15): 미카엘라 EGO 발동 6+반복 10 · Q 적중 · 바닥 하트 · R 하늘 빛기둥
 M3a:{path:DIR+'fx-m3-michaela-ego-on.webp',cw:384,ch:384,n:6,fps:12},
 M3:{path:DIR+'fx-m3-michaela-ego-loop.webp',cw:384,ch:384,n:10,fps:12},
 M4:{path:DIR+'fx-m4-michaela-hit.webp',cw:256,ch:256,n:8,fps:20,once:true},
 M5:{path:DIR+'fx-m5-michaela-ground-heart.webp',cw:256,ch:128,n:10,fps:12,gain:.9},
 M7:{path:DIR+'fx-m7-michaela-sky-pillar.webp',cw:256,ch:512,n:12,fps:12,once:true,gain:2},
 // R1235c(Dots CX-0173MK r1 ROUGH, 11-19): 작은 빛 표식 · 빛 리본(머리 = 오른쪽 끝) · 퍼진 빛(seq = 가운데 칸만 왕복해 맥박 작게, gain = 옅게)
 MK02:{path:'assets/r1235/fx-mk02-michaela-mark.webp',cw:128,ch:192,n:8,fps:10,gain:.8},
 MK03:{path:'assets/r1235/fx-mk03-michaela-ribbon.webp',cw:512,ch:96,n:8,fps:12},
 MK04:{path:'assets/r1235/fx-mk04-michaela-glow.webp',cw:256,ch:256,n:8,fps:6,seq:[2,3,4,5,4,3],gain:.7},
 // R1293: 깃털 → EGO 깃털 흩날림 손그림 8칸(흰 깃털·핏빛 끝, 미카엘라 핏빛 장미 색과 맞음, 1회)
 F1:{path:'assets/r1048/fx/ego_feathers.webp',cw:256,ch:256,n:8,fps:12,once:true}});
const DARK=':60.8.16:110.30.42',SLAYER='r106fx:flame:222.22.52:';
const asked=new Map();
function image(path){try{const r=typeof readyImage==='function'?readyImage(path):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(path)||0)>1500){asked.set(path,t);if(typeof addImage==='function')addImage(path,'R1041 Dots FX');else if(typeof ensureImages==='function')Promise.resolve(ensureImages([path])).catch(()=>{});}}catch(e){fail(e);}return null;}
const nowT=()=>{try{return typeof time==='number'&&fin(time)?time:0;}catch(_){return 0;}};
// 1회 시트의 시작 시각: 같은 열쇠가 .25초 넘게 안 보였다가 다시 보이면 새로 시작.
const born=new Map();
function ageOf(key,t){let b=born.get(key);if(!b||t-b.last>.25||t<b.last-.01){b={at:t,last:t};born.set(key,b);if(born.size>200)for(const k of born.keys()){born.delete(k);if(born.size<=120)break;}}b.last=t;return t-b.at;}
// 바닥 하트: 그려지는 4칸 뒤 4·5·6·5 칸으로 맥박(하트가 남아 있는 동안). 마지막 흩어짐 칸은 하트 표시가 끝날 때 원래 코드가 사라지므로 쓰지 않는다.
const pulseFrame=a=>{const r=Math.max(0,Math.floor((fin(a)?a:0)*12));return r<4?r:[4,5,6,5][(r-4)%4];};
function frameOf(S,key,t){if(!fin(t))return 0;if(S.seq){const q=S.seq,i=((Math.floor(t*S.fps)%q.length)+q.length)%q.length;return q[i];}if(S.once){const a=ageOf(key,t);return Math.max(0,Math.min(S.n-1,Math.floor(a*S.fps)));}return ((Math.floor(t*S.fps)%S.n)+S.n)%S.n;}
// 원래 사각(points: 좌상·우상·우하·좌하)의 정규 좌표 (u0,v0)-(u1,v1) 를 새 사각으로(아핀이라 그대로 맞음).
function remap(P,u0,v0,u1,v1){const [a,b,,d]=P,ex=[b[0]-a[0],b[1]-a[1]],ey=[d[0]-a[0],d[1]-a[1]],at=(u,v)=>[a[0]+ex[0]*u+ey[0]*v,a[1]+ex[1]*u+ey[1]*v];return [at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)];}
const side=P=>[Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1])];
const r106Name=p=>{const m=/^r106fx:([a-z0-9-]+):/.exec(p);return m?m[1]:null;};
// 같은 프레임(commands 배열)·같은 범위에서 덧줄을 뺄 표시
const marks=new WeakMap(),heartBox=new WeakMap();
const mark=(cmds,id,what)=>{let m=marks.get(cmds);if(!m){m=new Set();marks.set(cmds,m);}m.add(id+'|'+what);};
const marked=(cmds,id,what)=>!!marks.get(cmds)?.has(id+'|'+what);
// 같은 프레임·범위 안 몇 번째 명령인가(겹 고르기)
const counts=new WeakMap();
const nth=(cmds,id,what)=>{let m=counts.get(cmds);if(!m){m=new Map();counts.set(cmds,m);}const k=id+'|'+what,n=m.get(k)||0;m.set(k,n+1);return n;};
// 선·채우기 경로의 화면 상자(기록기 점은 이미 화면 좌표)
function bbox(data){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of data?.paths||[])for(const q of p?.points||[]){if(!fin(q[0])||!fin(q[1]))continue;if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];}return x1>x0&&y1>y0?{x0,y0,x1,y1}:null;}
const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const heroIs=h=>{try{return typeof player!=='undefined'&&player?.hero===h;}catch(_){return false;}};
// R101 피격(heroHurt) 판별: 처음 보는 r101:N 이 영웅 자리에서 시작했고 R101 목록에 막 생긴 heroHurt 가 있으면 피격.
const hurtIds=new Map();
function isHurt(owner){const id=owner.id;if(hurtIds.has(id))return hurtIds.get(id);let yes=false;
 try{const p=typeof player!=='undefined'?player:null,fx=window.__STORYWORLD_POLISH_R101__?.effects?.()||[];
  yes=!!p&&fin(owner.x)&&fin(owner.y)&&Math.hypot(owner.x-p.x,owner.y-p.y)<.35&&fx.some(e=>e&&e.kind==='heroHurt'&&e.age>=0&&e.age<.15);}catch(e){fail(e);}
 hurtIds.set(id,yes);if(hurtIds.size>120)for(const k of hurtIds.keys()){hurtIds.delete(k);if(hurtIds.size<=60)break;}if(yes)stats.hurts++;return yes;}
// R1293(사용자 2026-11-21 11:30Z 미카엘라 플레이 이펙트 전수조사): 실제 W·E(R247 성흔 광시·성광주, owner r247:fx)·Q·R 덧그림(R102, owner r102:N)도 R1235 시트 규칙을 타게,
//  평타 적중 R160 코드 섬광·옛 푸른 베기 F246·스킬 적중 옛 R100 sig-slash 덧겹은 미카엘라일 때 뺀다(하트 적중 시트가 이미 그 자리). 끄기 storyworld.r1293.michaelaFx = off.
const fxOn=()=>{try{const v=localStorage.getItem('storyworld.r1293.michaelaFx');return v!=='off'&&v!=='0'&&v!=='false';}catch(_){return true;}};
const PLAY1293=/^(?:r247:|r102:)/;
const skillOn=()=>{try{const v=localStorage.getItem('storyworld.r1235.skillSheets');return v!=='off'&&v!=='0'&&v!=='false';}catch(_){return true;}};
const actorH=()=>{try{const h=typeof actorHeight==='function'?actorHeight():60;return fin(h)&&h>0?h:60;}catch(_){return 60;}};
// M4 하트 적중 칸: 칸 .85 높이 = 바닥 물결(발), 한 변 = 영웅 키 1.7배
const m4At=(bx,by)=>{const s=actorH()*1.7;return rect(bx-s/2,by-s*.85,bx+s/2,by+s*.15);};
function skillRule(name,id,cmds,data){
 if(fxOn()){
  // R1293: 깃털 → F1 깃털 흩날림(3장에 1번, 나머지는 뺌 — 한 장 한 장 다 바꾸면 화면이 깃털로 덮임). 칸 가운데 = 깃털 가운데, 한 변 = 깃털 긴 변 2.2배.
  if(name==='feather'&&image(SHEET.F1.path)){/* R1293: D2S(천국의 주먹) 깃털도 — 사용자 2026-11-21 12:27Z 결정(R1235 'D2S 깃털 그대로' 검사 기대값 변경 승인) */const k=nth(cmds,id,'feather');if(k%3)return 'drop';
   return {S:SHEET.F1,key:id+'|fe|'+(k/3|0),make:P=>{if(!Array.isArray(P)||P.length!==4)return null;const [w,h]=side(P),s=Math.max(w,h)*1.1,cxp=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,cyp=(P[0][1]+P[1][1]+P[2][1]+P[3][1])/4;return rect(cxp-s,cyp-s,cxp+s,cyp+s);}};}
  // R1293: R102 덧그림(Q·R)은 빛살·베기선을 한 프레임 수십 장 뿌린다 — 한 장씩 빛 리본(MK03, 빛살보다 훨씬 넓음)으로 바꾸면 화면이 분홍빛으로 덮여(헤드리스 Q 평균 밝기 +.12) 3장에 1장만 바꾸고 나머지는 뺀다.
  if(/^r102:/.test(id)&&(name==='spark'||name==='slashline'||name==='line')&&nth(cmds,id,'thin-rb')%3)return 'drop';
  // R1293: 파편 → MK02 빛 표식(2장에 1번)
  if(name==='shard'&&image(SHEET.MK02.path)){const k=nth(cmds,id,'shard');if(k%2)return 'drop';
   return {S:SHEET.MK02,key:id+'|sh|'+(k/2|0),make:P=>{if(!Array.isArray(P)||P.length!==4)return null;const [w,h]=side(P),hh=Math.max(w,h)*1.4,ww=hh*128/192,cxp=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,cyp=(P[0][1]+P[1][1]+P[2][1]+P[3][1])/4;return rect(cxp-ww/2,cyp-hh/2,cxp+ww/2,cyp+hh/2);}};}
  // R1293: R247 성광주 기둥은 금빛·핏빛 두 겹 → M7 한 장(핏빛 겹은 같은 자리 두 번째 시트라 밝기만 키움)
  if(name==='pillar'&&id.startsWith('r247:')&&/^r106fx:pillar:150\.22\.34:/.test(String(data?.sourcePath||'')))return 'drop';
  // R1293: 성흔 광시 빛줄도 금빛·핏빛(1.7배 넓은) 두 겹 → 핏빛 겹은 넓은 분홍 안개가 되어 빛줄을 흐림 → 금빛 한 겹만 리본으로
  if(name==='slashline'&&id.startsWith('r247:')&&/^r106fx:slashline:150\.22\.34:/.test(String(data?.sourcePath||'')))return 'drop';}
 if(name==='halo'&&image(SHEET.M1.path))return {S:SHEET.M1,key:id+'|halo',box:P=>remap(P,.5-.725,.5-.725,.5+.725,.5+.725)};
 // 빛기둥: 피벗(.5,.99) = 기둥 발. M7 칸(256×512) 바닥 .98 = 기둥 발, 높이 같게, 너비 = 높이/2.
 if(name==='pillar'&&image(SHEET.M7.path)){const k=nth(cmds,id,'pillar');return {S:SHEET.M7,key:id+'|pillar|'+k,box:P=>{const [w,h]=side(P);if(!(w>0&&h>0))return null;const u=h/2/w;return remap(P,.5-u/2,.99-.98,.5+u/2,.99+.02);}};}
 if(name==='ring'&&image(SHEET.C4.path))return {S:SHEET.C4,key:id+'|ring',box:P=>P};
 // R1235c: 작은 십자(키 .5 미만: 방벽 둘레·주먹 빛살 끝) → MK02 빛 표식. 칸 안 표식이 칸 높이의 .36 → 1.7배 칸이면 표식 높이 ≈ 십자의 .6(속이 찬 물방울이라 가는 십자보다 무거워 보여 작게, 헤드리스 확대 비교). 늘 똑바로, 회전 없음.
 if(name==='cross'&&image(SHEET.MK02.path)){const P0=data?.points;const h0=Array.isArray(P0)&&P0.length===4?side(P0)[1]:NaN;
  if(fin(h0)&&h0>0&&h0<actorH()*.5){const k=nth(cmds,id,'small');
   return {S:SHEET.MK02,key:id+'|mk|'+k,box:P=>{const [w,h]=side(P),cxp=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,cyp=(P[0][1]+P[1][1]+P[2][1]+P[3][1])/4,s=.85;return rect(cxp-w*s,cyp-h*s,cxp+w*s,cyp+h*s);}};}}
 // R1235c: 불꽃줄·베기선·빛줄 → MK03 빛 리본. 리본은 칸 가로 .06~.94·세로 .3~.7 → 원래 줄 축 그대로 맞춘다(머리 = 끝점). line 은 그림 가운데 절반이 실제 선.
 if((name==='spark'||name==='slashline'||name==='line')&&image(SHEET.MK03.path)){const u0=name==='line'?.25:0,u1=name==='line'?.75:1,L=u1-u0;
  return {S:SHEET.MK03,key:id+'|rb',box:P=>remap(P,u0-.07*L,.5-1.25*(name==='line'?.5:1),u1+.07*L,.5+1.25*(name==='line'?.5:1))};}
 // R1235c: 빛 → MK04 퍼진 빛(같은 자리·크기, 옅게·작은 맥박)
 if(name==='glow'&&image(SHEET.MK04.path))return {S:SHEET.MK04,key:id+'|glow',box:P=>P};
 if((name==='cross'||name==='flare')&&image(SHEET.M4.path)){
  if(name==='cross'){/* 표적 위 큰 십자(키 .5 이상)만 — 방벽 둘레·빛살 끝 작은 십자는 그대로 */return {S:SHEET.M4,key:id+'|m4|'+nth(cmds,id,'cross4'),needBig:true,make:P=>{if(!Array.isArray(P)||P.length!==4)return null;const [w,h]=side(P);if(!(h>=actorH()*.5))return null;mark(cmds,id,'m4');const bx=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,by=(P[2][1]+P[3][1])/2;return m4At(bx,by);}};}
  if(marked(cmds,id,'m4'))return 'drop';
  return {S:SHEET.M4,key:id+'|flare',make:P=>{if(!Array.isArray(P)||P.length!==4)return null;const bx=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4,by=(P[0][1]+P[1][1]+P[2][1]+P[3][1])/4+actorH()*.4;return m4At(bx,by);}};}
 return null;}
// 바꿀 규칙: {S, box(P)→새 points} 또는 'drop' 또는 null(그대로)
function rule(kind,owner,data,cmds){const id=String(owner?.id||'');
 if(kind==='fill'||kind==='stroke'){
  // M5 바닥 하트: 사랑의 처방 groundHeart(채우기+테두리 같은 하트 경로) → 하트 시트 한 장. 같은 범위의 고리(ring)는 그대로.
  if(/^r948:.*:(mark|ground|blast)$/.test(id)){if(!image(SHEET.M5.path))return null;const b=bbox(data);if(!b)return null;
   const prev=heartBox.get(cmds)?.get(id);if(prev&&Math.abs(prev.x0-b.x0)<2&&Math.abs(prev.x1-b.x1)<2&&Math.abs(prev.y0-b.y0)<2)return 'drop';
   if(prev)return null;let hb=heartBox.get(cmds);if(!hb){hb=new Map();heartBox.set(cmds,hb);}hb.set(id,b);
   // 하트가 칸의 가로 70%·세로 70% 쯤 → 상자를 1/0.7 로 넓힌다.
   const cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,w=(b.x1-b.x0)/.7,h=Math.max((b.y1-b.y0)/.7,w/2*.9);
   return {S:SHEET.M5,key:id,pulse:true,make:()=>rect(cx-w/2,cy-h/2,cx+w/2,cy+h/2)};}
  // M7 하늘 빛기둥: R 세라핌 대정화 뒤 코드 기둥(그라데이션 채우기 3겹 + 빛 알갱이) → 빛기둥 시트 한 장(칸 바닥 .98 = 기둥 발).
  if(/^r563:pillar:.*:beam$/.test(id)&&kind==='fill'&&image(SHEET.M7.path)){if(nth(cmds,id,'beam')>0)return 'drop';const b=bbox(data);if(!b)return null;
   const w=b.x1-b.x0,foot=b.y1-w*.18,H=Math.max(w*2,foot-b.y0),cx=(b.x0+b.x1)/2;
   return {S:SHEET.M7,key:id,make:()=>rect(cx-H/4,foot-H*.98,cx+H/4,foot+H*.02)};}
  if(kind==='stroke'&&/^r101:\d+$/.test(id)&&hurtIds.get(id)===true)return 'drop';
  return null;}
 if(kind!=='image')return null;const path=String(data?.sourcePath||''),name=r106Name(path);
 if(heroIs('michaela')&&fxOn()){
  if(name&&/^r160:/.test(id))return 'drop';
  if(/^final42-r88:/.test(id)&&path.includes('/effects/246/'))return 'drop';
  if(/^r101:\d+$/.test(id)&&path.includes('/sig-slash-')&&!isHurt(owner))return 'drop';}
 // R1293: 천국의 주먹(D2S) 위 R108 성광 폭발 캔버스(코드 그림 아님, 덧셈)는 옅게 — Q 한 번에 화면 평균 밝기 +.11 중 약 .07 이 D2S 몫(헤드리스 가려 재기)
 // R1293: R 제네시스(R563 하늘 후광·굵은 기둥 시트, 덧셈)는 .8배 — R 한 번에 화면 평균 밝기 +.06~.07
 if(/^r563:/.test(id)&&/^assets\/r563\//.test(path.replace(/^.*?(assets\/)/,'$1'))&&heroIs('michaela')&&fxOn())return {dimOnly:.8};
 if(!name&&owner?.r106&&heroIs('michaela')&&fxOn()&&!/^assets\//.test(path.replace(/^.*?(assets\/)/,'$1')))return {dimOnly:.5};
 if(name){
  // R1235(사용자 2026-11-19 11:34Z "미카엘라 영웅 이펙트중 아직 프레임애니메이션 아닌 이펙트는 프레임애니메이션으로"): R106 D2S 미카엘라 기술(Q 천국의 주먹·W 성역 방벽·E 날개 돌진·R 세라핌 강림)의
  //  코드 한 장 그림 중 맞는 Dots 시트가 있는 것만 바꾼다. 깃털·불꽃줄·파편·베기선·빛·작은 십자는 맞는 시트가 없어 그대로(Dots 요청 대상). 끄기 storyworld.r1235.skillSheets = off.
  if((owner?.r106||PLAY1293.test(id)&&fxOn())&&heroIs('michaela')&&skillOn()){const r=skillRule(name,id,cmds,data);if(r&&r!=='drop'&&/^r102:/.test(id)&&fxOn())r.dim=.55;/* R1293: R247 W·E 는 시트가 코드 한 장보다 가늘고 옅어 거의 안 보임(헤드리스) → 2.2배(알파 상한 1) */if(r&&r!=='drop'&&/^r247:/.test(id)&&fxOn())r.dim=2.2;/* R1293: Q·R 덧그림 시트는 옅게(Q 화면 밝기) */if(r)return r;}
  // 후광: 칸 안 고리가 칸 너비의 ~65% 라 1.45배로 키워 원래 후광 너비에 맞춘다(비율 256:96 그대로).
  if(name==='halo'&&id.startsWith('r101:aura-front:'))return {S:SHEET.M1,key:id,box:P=>remap(P,.5-.725,.5-.725,.5+.725,.5+.725)};
  if(name==='flame'&&id.startsWith('r101:aura-back:')){
   // 슬레이어 불꽃 = 검붉은 DARK 한 겹 + 슬레이어색(222.22.52) 한 겹. 실기록에선 DARK 겹이 안 남는 때가 많아 둘 중 먼저 온 것을 A5 로, 나머지는 뺀다.
   if(marked(cmds,id,'flame'))return 'drop';
   if(path.endsWith(DARK)||path.startsWith(SLAYER)){mark(cmds,id,'flame');
    // 원래 불꽃: 피벗(.5,.97)=발밑. A5 칸은 가로 1.25배 정사각, 칸 안 불꽃 바닥(.5,.78)을 발밑에.
    return {S:SHEET.A5,key:id,box:P=>{const [w,h]=side(P);if(!(w>0&&h>0))return null;const su=1.25,sv=su*w/h;return remap(P,.5-.5*su,.97-.78*sv,.5+.5*su,.97+.22*sv);}};}
   return null;}
  if(name==='glow'&&id.startsWith('r101:aura-back:')){return {S:SHEET.C4,key:id,box:P=>{const [w,h]=side(P);return w>0&&h>0&&w/h>1.6?P:null;}};}
  // R1270: 환도 발도 시트는 환도 기술 그림에만. 실검무 베기(R111 threadSlash, 범위 r111:thread-slash:*)의 iai-cut 은 누구 실검무든 원래 은빛 그림 그대로(전엔 서하·미카엘라 평타에도 환도 발도가 그려졌다).
  if(name==='iai-cut'&&!id.startsWith('r111:thread-slash')){mark(cmds,id,'iai');
   // 한 범위에서 여러 번 벤다(R107 연참) — 베기마다 방향이 달라 방향으로 1회 시작을 따로 잰다.
   const P0=data?.points,ang=Array.isArray(P0)&&P0.length===4?Math.round(Math.atan2(P0[1][1]-P0[0][1],P0[1][0]-P0[0][0])*8):0;
   return {S:SHEET.H6,key:id+'|iai|'+(fin(ang)?ang:0),box:P=>remap(P,0,.5-.95,1,.5+.95)};}
  if(name==='slashline'&&marked(cmds,id,'iai'))return 'drop';
  return null;}
 // M3 미카엘라 EGO: R1039 가 그리던 영웅색 sig-aura(뒤 3겹)·sig-gather(발동)·앞 겹 → 발동 6칸(.5초) 뒤 반복 10칸. 뒤 3겹 모두 같은 칸으로(밝은 바닥·영웅 가림막에서도 보이게, 헤드리스 캡처로 확인).
 if(/^r111:ego-(back|front)$/.test(id)&&/sig-(aura|gather)-magenta\./.test(path)&&image(SHEET.M3a.path)&&image(SHEET.M3.path)){
  if(id.endsWith('front')||path.includes('sig-gather'))return 'drop';
  const a=ageOf('m3-ego',nowT());const S=a<.5?SHEET.M3a:SHEET.M3,fr=a<.5?Math.min(5,Math.floor(a*12)):((Math.floor((a-.5)*12)%10)+10)%10;
  // R1039 오라 사각: 가운데 = 발 위 키 .36, 한 변 = 키 2.6배 → 발 = 사각 v .63. M3 칸(피벗 .5,.9) 한 변 .96배.
  return {S,key:'m3-ego',fr,box:P=>remap(P,.5-.48,.63-.9*.96,.5+.48,.63+.1*.96)};}
 // M4 미카엘라 스킬 적중: R101 heroHit 의 손그림 sig-hit(첫 겹) → 하트·깃털 적중 1회 8칸, 덧겹은 뺀다.
 if(/^r101:\d+$/.test(id)&&path.includes('/sig-hit-')&&heroIs('michaela')&&image(SHEET.M4.path)&&!isHurt(owner)){if(nth(cmds,id,'hit')>0)return 'drop';
  return {S:SHEET.M4,key:id,dim:fxOn()?.5:1/* R1293: 한 번에 적 여럿 맞히면 하트 적중이 겹쳐 하얗게 — 옅게 */,box:P=>remap(P,.5-.8,.5-1.6*.6,.5+.8,.5+1.6*.4)};}
 if(/^r101:\d+$/.test(id)&&path.includes('/sig-hit-')&&isHurt(owner))
  // 원래 sig-hit: 몸 가운데 정사각. C2 는 1.35배, 칸 피벗(.5,.6)을 그 가운데에.
  return {S:SHEET.C2,key:id,box:P=>remap(P,.5-.675,.5-1.35*.6,.5+.675,.5+1.35*.4)};
 return null;}
function wrapPush(){const DC=window.StoryPhase1?.DrawCommands,P=DC?.prototype;if(!P||typeof P.push!=='function')return false;if(P.push.__r1041)return true;const base=P.push;
 const w=function(kind,data){if(!on)return base.call(this,kind,data);let r=null;try{r=rule(kind,this.owner||{},data,this.commands);}catch(e){fail(e);r=null;}
  if(!r)return base.call(this,kind,data);
  if(r==='drop'){stats.dropped++;return;}
  if(r.dimOnly){const ga=this.globalAlpha;if(fin(ga))this.globalAlpha=ga*r.dimOnly;stats.dimmed=(stats.dimmed|0)+1;try{return base.call(this,kind,data);}finally{this.globalAlpha=ga;}}
  try{const im=image(r.S.path),pts=data?.points;if(im&&(r.make||Array.isArray(pts)&&pts.length===4)){const np=r.make?r.make(pts):r.box(pts);
    if(np&&np.flat().every(fin)){const t=nowT(),fr=fin(r.fr)?r.fr:r.pulse?pulseFrame(ageOf(r.key,t)):frameOf(r.S,r.key,t);stats.swapped++;if(r.make)kind='image';
     const ga=this.globalAlpha,g=(r.S.gain||1)*(fin(r.dim)?r.dim:1);if(g!==1&&fin(ga))this.globalAlpha=Math.min(1,ga*g);
     const sw={image:im,mutable:false,sourcePath:r.S.path,immutableTint:null,sourceRect:[fr*r.S.cw,0,r.S.cw,r.S.ch],imageSize:[r.S.cw*r.S.n,r.S.ch],points:np};
     try{return base.call(this,kind,r.make?sw:{...data,...sw});}finally{this.globalAlpha=ga;}}}
   if(!im)stats.fallback++;else stats.kept++;}catch(e){fail(e);}
  // 시트가 없거나 자리가 이상하면 원래 그림 그대로. 덧줄 표시는 지운다(원래 두 겹 다 그려지게).
  try{const m=marks.get(this.commands);if(m)for(const k of [...m])if(k.startsWith(String(this.owner?.id||'')+'|'))m.delete(k);}catch(_){}
  return base.call(this,kind,data);};
 /* R1290: 아래 감싸기 표식을 옮겨 단다(R1286 과 번갈아 다시 감싸 끝없이 쌓이지 않게, qa/r1290) */for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))try{w[k]=base[k];}catch(_){}w.__r1041=true;P.push=w;return true;}
function wrapInst(){try{const c=typeof ctx!=='undefined'?ctx:null,P=window.StoryPhase1?.DrawCommands?.prototype;if(c&&Object.prototype.hasOwnProperty.call(c,'push')&&!c.push.__r1041&&P?.push?.__r1041)c.push=P.push;}catch(_){}}
function warm(){for(const S of Object.values(SHEET))image(S.path);}
let nextWarm=0;
function wrapTick(){if(typeof tick!=='function'||tick.__r1041)return;const base=tick;const w=function(...a){const r=base.apply(this,a);try{if(on&&Date.now()>nextWarm){nextWarm=Date.now()+2000;wrapPush();wrapInst();warm();}}catch(e){fail(e);}return r;};w.__r1041=true;tick=w;}
try{wrapPush();wrapTick();if(on)warm();}catch(e){fail(e);}
window.__STORYWORLD_HERO_DOTS_FX_R1041__=Object.freeze({revision:REV,sheet:SHEET,rule,frameOf,remap,
 set(v){on=v!==false&&v!=='off';try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,installed:!!window.StoryPhase1?.DrawCommands?.prototype?.push?.__r1041})});
})();
