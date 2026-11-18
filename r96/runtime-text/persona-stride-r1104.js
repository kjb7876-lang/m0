// R1104 — 페르소나 '순수악의' 임시 코드 걸음. 사용자 2026-11-16 06:36Z "페르소나 순수악의 왜 이동모션을 안함".
//  원인(헤드리스 실측 qa/r1104/probe.json): 페르소나 몸 그림은 rc133 art 의 방향별 정지 그림(base·awake 8장)뿐이라 걷는 동안에도 같은 한 장이
//  미끄러졌다(이동 154프레임 모두 base-1.png). 보스 공통 R620 걸음 출렁임은 걸려 있지만 키 변화 ±0.5px 라 보이지 않았다. R1097 수묵은 원인이 아니다.
//  정식본은 Dots 걷기 시트(CX-0106PB). 시트가 오기 전까지만 쓰는 코드 걸음이며 최종 그림이 아니다.
//  · 하는 법: 렌더러가 받는 프레임 명령에서(R1097 수묵 처리를 먼저 부른 뒤 — process 는 같은 명령을 두 번 바꾸지 않는다) 페르소나 몸 그림 한 장을
//    상체(엉덩이 줄 위) + 하체 왼쪽·오른쪽(가운데 4% 겹침)으로 나눈다. 같은 그림의 칸(sourceRect)만 나누므로 색·수묵·필터는 그대로다.
//  · 걸음: 위상은 '지나간 거리'(0.65칸에 한 걸음)로 정해 발이 미끄러지지 않는다. 다리 엇갈림(발끝 ±10% 폭), 드는 발만 키의 4.5% 들림,
//    디딤 출렁임(키의 3%), 가는 쪽으로 상체 숙임(키의 3.5%). 멈추면 0.15초 안에 0 으로 돌아온다.
//  · 걷는지 판단: 0.35초 동안의 순 이동이 초당 0.35칸 넘을 때만(제자리 떨림·밀림 왕복은 걷기 아님).
//  · R1097d: 렌더러는 명령을 key(owner.id+':'+순번)로 메시 하나에 묶는다 → 조각마다 key 뒤에 ':r1104u|l|r' 를 붙인다(같은 key 면 상체만 남고 하체가 사라졌다).
//  판정·피해·AI·저장·서사·이펙트·탄은 바꾸지 않는다(보스 몸 그림만). 끄기: localStorage['storyworld.r1104.personaStride']='0'.
// R1104b — Dots CX-0120PW 걷기 3방향 8칸 시트(아래·위·옆, 사용자 2026-11-16 08:53Z "이거 적용함?"·08:54Z "몸통이랑 다리 자연스럽게 연결").
//  · 시트는 qa/r1104b/build-walk-sheets.py 로 다듬은 webp(옆: 상체·다리 이음매 색 잇기·망토 그늘·틈 채우기, 아래·위: 칸마다 튀던 머리 높이 고르기).
//  · 걷는 동안(걸음 세기 w>.5) 기본형(base) 몸 그림 한 장을 방향에 맞는 시트 칸으로 바꿔 끼운다. 시트는 걷는 화면 방향으로 고른다(가로가 크면 옆, 오른쪽이면 뒤집기 / 아래로 가면 정면, 위로 가면 뒷모습). 방향을 아직 모를 때만 몸 그림 방향 표(0·1 아래, 7 아래 뒤집기, 2 옆, 6 옆 뒤집기, 3·4 위, 5 위 뒤집기).
//  · 칸 = 지나간 거리 위상(0.65칸에 한 걸음, 옆은 디딤발이 칸마다 시트 20px 씩 뒤로 가는 것을 화면 축척으로 재어 0.70칸, 8칸 = 두 걸음)이라 발이 미끄러지지 않는다. 시트가 향한 쪽과 반대로 움직이는 경우(방향 표를 쓸 때)는 칸을 거꾸로 돌린다.
//  · 보스 공통 R620 걸음 출렁임은 시트에서는 빼서(서 있을 때 잰 발 자리로 되돌림) 디딤발이 땅에서 뜨지 않게 한다.
//  · R409 테두리판(r409:outline:…, 사방 같은 여백)도 원래 그림으로 알아본다(게임에서 몸 그림은 대개 이 판으로 온다).
//  · 크기·자리: 시트 발선 가운데(ax, ground)를 원래 그림 발 자리(172, 385)에, 시트 키 424px 를 원래 키 357px 에 맞춘다.
//  · 수묵(R1097)이 이 몸 그림을 바꿨으면 시트 칸도 R1097 inkify 로 한 번씩 구워 쓴다(굽기 전엔 코드 걸음). 각성형(awake)·시트를 못 읽었을 때는 R1104 코드 걸음 그대로.
// R1119 — 구글 드라이브 11-16·11-17 Dots 검토본(사용자 2026-11-17 04:38Z "구글드라이브 페르소나 어제오늘 올라온거 기반으로 개선적용해서 페르소나영웅및 보스완성"),
//  드라이브 '01_먼저읽기_페르소나_보스_최신_지시' 그대로:
//  · 각성 중 걷기 = 이미 쓰는 기본형 걷기 시트(앞·뒤·옆, 뒤집기·발 자리·거리 위상 그대로) + 각성 중에만 붉은 구슬·망토 가장자리 국소 발광(lighter 명령 따로, 몸에 전신 필터 없음).
//  · 피격 = 방향별(정면·옆·뒤) 기본/각성 4칸(Dots 원화 변형, 발 픽셀 고정). 기존 피격 판정(hp 감소)을 읽는 그림만, 0.6초 안 연타는 다시 시작 안 함, 시전·걷기 중엔 안 씀.
//    정면 1칸째는 아래쪽 사각 띠 결함이 있어 2칸째로 대신(자산 칸 순서 [1,1,2,3], qa/r1119/build-assets.py).
//  · 시전 = 별도 시전 그림 없이 기존 시전 예고(rangedWindup·tell·attack) 동안 구슬 자리에 언주 발광 하나(얼굴 제외, 걷기 발광과 겹치면 하나만).
//  · 사망 = 결전이 끝났을 때(hp 0·room.persona.completed) 마지막 몸 자리에 빛 소멸 16칸(150ms, 마지막 칸 완전 투명) 한 번. 승리·해금·저장·판정은 그대로.
//  · 수묵(R1097)이 켜져 있으면 피격·소멸 칸도 inkify 로 구워 쓴다(굽기 전엔 그 칸을 쓰지 않음).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_STRIDE_R1104__)return;
const REV='R1104-persona-stride-3-r1119',KEY='storyworld.r1104.personaStride';
const HIP=.6,OV=.04,STEP=.65,SWING=.1,FOOT_LIFT=.045,BOB=.03,LEAN=.035,WIN=.35,WALK_V=.35,EASE=7;
const BODY=/rc133\/art\/(?:base|awake)-[0-7]\.(?:png|webp)/i;
const stats={frames:0,split:0,steps:0,errors:0,sheets:0,baked:0,sheetFrames:0,lastSheet:null,hits:0,hitFrames:0,casts:0,glows:0,deaths:0,deathFrames:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:null;}catch(_){return null;}};
function persona(){try{const rm=typeof room!=='undefined'?room:null;const list=rm&&Array.isArray(rm.enemies)?rm.enemies:[];for(const e of list)if(e&&e.persona&&e.hp>0&&Number.isFinite(e.x)&&Number.isFinite(e.y))return e;}catch(_){}return null;}
// ---------------- R1104b 걷기 시트 ----------------
const CELL=512,FRAMES=8,ART={ax:172,ground:385,height:357,sheetH:424};ART.k=ART.height/ART.sheetH;
const WALK=Object.freeze({front:Object.freeze({src:'assets/r1104b/persona-walk-front.webp',ax:256,ground:476,fwd:[0,1]}),
 rear:Object.freeze({src:'assets/r1104b/persona-walk-rear.webp',ax:256,ground:477,fwd:[0,-1]}),
 side:Object.freeze({src:'assets/r1104b/persona-walk-side.webp',ax:266,ground:476,fwd:[-1,0],step:.7})});
// R1119 피격·소멸 시트: k = 원래 그림 px / 시트 px. 피격 칸 512 = 원래 그림(344×400)을 (84,92)에 1:1, 소멸 칸 192×256 = 0.5배를 (10,26)에
const HIT_MS=[65,100,110,100],SIDE_MS=[60,90,100,100,110,120],SETTLE=.15,HIT_GAP=.8,DEATH_MS=150,DEATH_N=16;
const SH={};for(const k in WALK)SH[k]={...WALK[k],cw:CELL,ch:CELL,frames:FRAMES,k:ART.k};
const HIT_ASSETS=['assets/r1119/persona-hit-base-front.webp','assets/r1119/persona-hit-base-side.webp','assets/r1119/persona-hit-base-rear.webp','assets/r1119/persona-hit-awake-front.webp','assets/r1119/persona-hit-awake-side.webp','assets/r1119/persona-hit-awake-rear.webp'];
const DEATH_ASSETS=['assets/r1119/persona-death-base.webp','assets/r1119/persona-death-awake.webp'];
// 옆 = 사용자 확정(11-17 04:56Z) 한 발 후퇴 6컷: 몸 전체가 뒤(왼쪽 보기 기준 화면 오른쪽)로 약 8px 밀린 채 끝남 → 끝난 뒤 0.15초 동안 원래 그림을 그 자리에서 0 으로 되돌림(그림만, 실제 좌표·넉백 없음)
for(const src of HIT_ASSETS){const m=/persona-hit-(\w+)-(\w+)\.webp$/.exec(src),side=m[2]==='side';SH['hit-'+m[1]+'-'+m[2]]={src,ax:256,ground:477,cw:512,ch:512,frames:side?6:4,k:1,ms:side?SIDE_MS:HIT_MS,settle:side?8:0};}
// R1156 Dots CX-0136 A5 r2(사용자 2026-11-18 08:22Z "닷츠랑 상호작용해서 필요한 자산생성및 개선적용"): 기본형 뒤 피격 = 어깨·후드·망토 반동을 키운 새 그림(원본 6칸 중 2·3·5·6칸, 지지발 아랫단 맞춤 손질, scripts/r1156-persona-rear-hit.py).
// 칸 수·시간·피벗은 그대로. 새 그림을 못 읽으면 예전 R1119 그림(fallback)으로 다시 읽는다.
{const D=SH['hit-base-rear'];if(D){D.fallback=D.src;D.src='assets/r1156/persona-hit-base-rear-r2.webp';}}
for(const src of DEATH_ASSETS){const m=/persona-death-(\w+)\.webp$/.exec(src);SH['death-'+m[1]]={src,ax:96,ground:218.5,cw:192,ch:256,frames:DEATH_N,k:2};}
const HITDIR=[['front',1],['front',1],['side',1],['rear',1],['rear',1],['rear',-1],['side',-1],['front',-1]];
// 구슬 자리(원래 그림 344×400, 실측: 붉은 구슬 밀집 창): 0 정면·2 왼쪽·4 뒤(몸에 가림 — 손 쪽 뒤로 옅게)·6 오른쪽(=왼쪽 뒤집기)
const ORB_ART={0:[102,156],1:[102,156],2:[100,144],3:[242,156],4:[242,156],5:[102,156],6:[244,144],7:[242,156]},ORB_HIDDEN={3:1,4:1,5:1};
// 걷기 시트 칸의 구슬 자리(512 칸, R1113 영웅과 같은 실측)
const WORB={front:[[182,196],[182,195],[182,194],[182,196],[182,196],[184,194],[181,209],[183,196]],side:[[201,188],[201,188],[200,188],[200,188],[200,188],[200,188],[200,188],[200,188]],rear:Array.from({length:8},()=>[330,196])};
const EONJU=[[70,14,10],[204,52,40],[255,176,140]];
const DIRS=[['front',1],['front',1],['side',1],['rear',1],['rear',1],['rear',-1],['side',-1],['front',-1]]; // [시트, 1=그대로 -1=좌우 뒤집기]
const SS={};for(const k in SH)SS[k]={state:'idle',raw:null,ink:null,inkState:'idle',inkHalf:null,edge:null};
const R409=/^r409:outline:[a-z]+:u:(.+):\d+,\d+,\d+,\d+:\d+:[a-z]+$/,artOf=v=>{v=String(v||'');const k=R409.exec(v);return RX.exec(k?k[1]:v);};
const RAWQ=new WeakMap(),RX=/(?:^|[\/:])assets\/rc133\/art\/(base|awake)-([0-7])\.(?:png|webp)(?:[?#].*)?$/i;
const hasDom=()=>{try{return typeof document!=='undefined'&&document&&typeof document.createElement==='function'&&typeof Image==='function';}catch(_){return false;}};
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function abs(u){try{return new URL(u,document.baseURI||window.location?.href).href;}catch(_){return u;}}
const pathOf=(k,f,kind)=>WALK[k]?'r1104b:walk:'+k+':'+f+':'+kind:k.startsWith('hit-')?'r1119:hit:'+k.slice(4)+':'+f+':'+kind:'r1119:death:'+k.slice(6)+':'+f+':'+kind;
function loadSheet(k){const S=SS[k];if(S.state!=='idle'||!hasDom())return;S.state='wait';
 try{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  img.onload=()=>{try{const D=SH[k],raw=[];for(let f=0;f<D.frames;f++){const cv=canvas(D.cw,D.ch),g=cv.getContext('2d');g.drawImage(img,f*D.cw,0,D.cw,D.ch,0,0,D.cw,D.ch);
     const path=pathOf(k,f,'raw');cv.__storyworldStaticSource={path};raw.push({canvas:cv,w:D.cw,h:D.ch,pad:0,path});}
    S.raw=raw;S.state='ready';stats.sheets++;}catch(e){S.state='failed';fail(e);}};
  img.onerror=()=>{const F=SH[k].fallback;if(F&&!S.fellBack){S.fellBack=true;stats.fallbacks=(stats.fallbacks||0)+1;img.src=abs(F);return;}S.state='failed';};img.src=abs(SH[k].src);}catch(e){S.state='failed';fail(e);}}
// 수묵: R1097 inkify 로 칸마다 한 번 굽기(0.03초 간격으로 하나씩)
const inkQ=[];let inkBusy=false;
function inkMod(){try{const m=window.__STORYWORLD_PERSONA_INK_R1097__;return m&&typeof m.inkify==='function'?m:null;}catch(_){return null;}}
function wantInk(k){const S=SS[k],M=inkMod();if(!M||S.state!=='ready')return;let half=false;try{half=!!M.inspect?.().half;}catch(_){}
 if(S.inkState!=='idle'&&S.inkHalf===half)return;const n=SH[k].frames;S.inkHalf=half;S.inkState='wait';S.ink=new Array(n).fill(null);for(let f=0;f<n;f++)inkQ.push([k,f,half]);pumpInk();}
function pumpInk(){if(inkBusy||!inkQ.length)return;inkBusy=true;const [k,f,half]=inkQ.shift(),S=SS[k];
 try{const M=inkMod(),D=SH[k];if(M&&S.raw&&S.inkHalf===half){const sc=half?.5:1,cw=Math.round(D.cw*sc),chh=Math.round(D.ch*sc),src=canvas(cw,chh),g=src.getContext('2d',{willReadFrequently:true});g.drawImage(S.raw[f].canvas,0,0,cw,chh);
   const data=g.getImageData(0,0,cw,chh).data,r=M.inkify(data,cw,chh,{pad:Math.max(8,Math.round(26*sc/D.k)),seed:300+Object.keys(SH).indexOf(k)*11,unit:sc/D.k});
   if(r&&r.solid){const out=canvas(r.width,r.height),og=out.getContext('2d'),im=og.createImageData(r.width,r.height);im.data.set(r.data);og.putImageData(im,0,0);
    const path=pathOf(k,f,'ink');out.__storyworldStaticSource={path};S.ink[f]={canvas:out,w:r.width,h:r.height,pad:r.pad/sc,path};stats.baked++;}
   if(S.ink.every(Boolean))S.inkState='ready';}}catch(e){S.inkState='failed';fail(e);}
 inkBusy=false;if(inkQ.length){try{setTimeout(pumpInk,30);}catch(_){}}}
function prewarm(){for(const k in SH)loadSheet(k);}
// 시트 칸으로 바꿔 끼우기: 원래 그림 좌표(344×400) 사각형 P 위에 시트 칸을 발 자리·키 맞춰 올린다
// 시트 고르기: 걷는 화면 방향(가로가 세로보다 크면 옆, 아래로 가면 정면, 위로 가면 뒷모습). 오른쪽이면 좌우 뒤집기. 아직 방향을 모르면 몸 그림 방향 표.
function pick(q,s){const v=s.scr;if(v&&(v[0]||v[1])){if(Math.abs(v[0])>=Math.abs(v[1]))return ['side',v[0]>0?-1:1];return [v[1]>0?'front':'rear',v[0]>.45?-1:1];}return DIRS[q.dir];}
// 시트 칸 k:f 를 원래 그림 사각형 q 위에 올린다(시트 (ax,ground) → 원래 그림 발 자리, 시트 px × D.k = 원래 그림 px). m=-1 좌우 뒤집기
function placeSheet(c,q,s,k,f,m,ink,e){const D=SH[k],S=SS[k];const set=ink?(S.inkState==='ready'?S.ink:null):(S.state==='ready'?S.raw:null);if(!set)return null;
 const P=q.P,sr=q.sr,cw=sr[2],ch=sr[3],px=(cw-344)/2,py=(ch-400)/2;
 const ux=[(P[1][0]-P[0][0])/cw,(P[1][1]-P[0][1])/cw],vy=[(P[3][0]-P[0][0])/ch,(P[3][1]-P[0][1])/ch];
 const A0=(u,v)=>{const ax=ART.ax+m*(u-D.ax)*D.k+px,ay=ART.ground+(v-D.ground)*D.k+py;return [P[0][0]+ux[0]*ax+vy[0]*ay,P[0][1]+ux[1]*ax+vy[1]*ay];};
 // 보스 공통 R620 걸음 출렁임이 몸 그림 네 점을 들었다 놓는다 — 시트에는 이미 다리 디딤이 있으므로, 서 있을 때 잰 '발 자리 − 몸 위치'로 되돌려 발을 땅에 붙인다
 let sh=[0,0];try{if(s&&s.off0&&e&&typeof project==='function'){const g=project(e.x,e.y),ff=A0(D.ax,D.ground);if(Number.isFinite(g?.x)&&Number.isFinite(g?.y)){const d=[g.x+s.off0[0]-ff[0],g.y+s.off0[1]-ff[1]];if(Math.hypot(d[0],d[1])<12)sh=d;}}}catch(_){}
 const A=(u,v)=>{const p=A0(u,v);return [p[0]+sh[0],p[1]+sh[1]];};
 const fr=set[f];if(!fr)return null;const p=fr.pad,pts=[A(-p,-p),A(D.cw+p,-p),A(D.cw+p,D.ch+p),A(-p,D.ch+p)];if(!pts.every(okPt))return null;
 c.image=fr.canvas;c.mutable=false;c.sourcePath=fr.path;c.immutableTint=fr.canvas.__storyworldStaticSource;c.sourceRect=[0,0,fr.w,fr.h];c.imageSize=[fr.w,fr.h];c.points=pts;c.r1104b=true;c.r1104bPad=p;
 return {A,k,f,m};}
function swapSheet(c,q,s,ink,e){const [k,m]=pick(q,s),W=WALK[k];
 // 앞으로 걷는가: 시트가 향한 화면 방향(뒤집으면 좌우 반대)과 실제 움직임
 const fx=W.fwd[0]*m,fy=W.fwd[1],dot=fx*s.scr[0]+fy*s.scr[1];const f0=Math.floor(s.phase*(STEP/(W.step||STEP))/(Math.PI/4))%FRAMES,f=dot<-.2?(FRAMES-f0)%FRAMES:f0;
 const r=placeSheet(c,q,s,k,f,m,ink,e);if(!r)return null;stats.sheetFrames++;stats.lastSheet=k+':'+f+(m<0?':flip':'')+(ink?':ink':'');return r;}
// ---------------- R1119 발광(각성 걷기·시전) ----------------
let orbCv=null;const edgeCv={};
function grad(stops){const c=canvas(64,64),x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);for(const [o,col] of stops)g.addColorStop(o,col);x.fillStyle=g;x.fillRect(0,0,64,64);return c;}
function orbGlow(){if(orbCv)return orbCv;if(!hasDom())return null;const [d,m,l]=EONJU.map(v=>v.join(','));
 orbCv=grad([[0,'rgba(255,236,224,1)'],[.18,'rgba('+l+',.95)'],[.45,'rgba('+m+',.6)'],[.75,'rgba('+d+',.22)'],[1,'rgba('+d+',0)']]);orbCv.__storyworldStaticSource={path:'r1119:glow:orb-src'};return orbCv;}
// 망토 가장자리: 걷기 칸(512)을 1/4 로 줄여 몸 윤곽 중 아래 65%(망토)만 언주로, 흐리게(오프스크린 캔버스 blur 는 써도 됨)
function capeGlow(k,f){const id=k+':'+f;if(edgeCv[id]!==undefined)return edgeCv[id];edgeCv[id]=null;const S=SS[k];if(!S.raw||!S.raw[f]||!hasDom())return null;
 try{const N=128,a=canvas(N,N),g=a.getContext('2d',{willReadFrequently:true});g.drawImage(S.raw[f].canvas,0,0,N,N);const im=g.getImageData(0,0,N,N),A=im.data;
  let top=N,bot=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(A[(y*N+x)*4+3]>100){if(y<top)top=y;if(y>bot)bot=y;}
  const out=g.createImageData(N,N),O=out.data,y0=top+(bot-top)*.35,al=(x,y)=>x<0||y<0||x>=N||y>=N?0:A[(y*N+x)*4+3];
  if(bot>top)for(let y=Math.ceil(y0);y<=bot;y++)for(let x=0;x<N;x++){if(al(x,y)<=100)continue;if(al(x-1,y)<40||al(x+1,y)<40||al(x,y-1)<40||al(x,y+1)<40){const i=(y*N+x)*4;O[i]=204;O[i+1]=52;O[i+2]=40;O[i+3]=255;}}
  const b=canvas(N,N),bg=b.getContext('2d');bg.putImageData(out,0,0);const c=canvas(N,N),cg=c.getContext('2d');cg.filter='blur(1.5px)';cg.drawImage(b,0,0);cg.filter='none';cg.drawImage(b,0,0);
  c.__storyworldStaticSource={path:'r1119:glow:cape-src:'+id};edgeCv[id]=c;return c;}catch(err){fail(err);return null;}}
function glowCmd(body,tag,cv,pts,alpha,order){if(!cv||!pts.every(okPt)||!(alpha>0))return null;const w=cv.width||64,h=cv.height||64;
 return {...body,key:'r1119:glow:'+tag+':0',order:Number.isFinite(body.order)?body.order+(order||.5):body.order,kind:'image',owner:{id:'r1119:glow:'+tag,kind:'effect'},image:cv,mutable:false,
  sourcePath:'r1119:glow:'+tag,immutableTint:cv.__storyworldStaticSource,sourceRect:[0,0,w,h],imageSize:[w,h],points:pts,
  style:{...(body.style&&typeof body.style==='object'?body.style:{}),filter:'none',globalAlpha:Math.min(1,alpha),globalCompositeOperation:'lighter'},r1104:true,r1119:true};}
const casting=e=>e.rangedWindup>0||e.tell>0||e.state==='attack';
function addGlows(cmds,body,q,walk,awake,cast,t){let n=0;const at=cmds.indexOf(body);if(at<0)return 0;const pulse=.5+.5*Math.sin(t*(cast?12:5));
 // 원래 그림 좌표 → 화면(원래 사각형 q)
 const P=q.P,cw=q.sr[2],ch=q.sr[3],px=(cw-344)/2,py=(ch-400)/2,Q=(u,v)=>[P[0][0]+(P[1][0]-P[0][0])*(u+px)/cw+(P[3][0]-P[0][0])*(v+py)/ch,P[0][1]+(P[1][1]-P[0][1])*(u+px)/cw+(P[3][1]-P[0][1])*(v+py)/ch];
 const H=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1])*400/ch;
 let cape=null;if(walk&&awake){const cv=capeGlow(walk.k,walk.f);if(cv){const A=walk.A; // 뒤집으면 A 가 좌우를 바꿔 주므로 칸 네 귀를 그대로 쓴다
   cape=glowCmd(body,'cape',cv,[A(0,0),A(512,0),A(512,512),A(0,512)],.5+.2*pulse);}}
 // 구슬: 걷기면 걷기 칸 구슬 자리, 아니면 원래 그림 방향별 자리. 시전·각성 걷기가 겹치면 하나만(밝은 쪽)
 let a=0;if(walk&&awake)a=.45+.2*pulse;if(cast)a=Math.max(a,.7+.3*pulse);
 let orb=null;if(a>0){let c0=null;if(walk){const O=WORB[walk.k]?.[walk.f];if(O){c0=walk.A(O[0],O[1]);if(walk.k==='rear')a*=.55;}}else{const O=ORB_ART[q.dir]||ORB_ART[0];c0=Q(O[0],O[1]);if(ORB_HIDDEN[q.dir])a*=.45;}
  const cv=orbGlow();if(c0&&cv){const R=H*.085*(.9+.25*pulse);orb=glowCmd(body,cast?'cast':'orb',cv,[[c0[0]-R,c0[1]-R],[c0[0]+R,c0[1]-R],[c0[0]+R,c0[1]+R],[c0[0]-R,c0[1]+R]],a,.6);}}
 const add=[cape,orb].filter(Boolean);if(add.length){cmds.splice(cmds.indexOf(body)+1,0,...add);n=add.length;stats.glows+=n;if(cast)stats.casts++;}return n;}
// ---------------- R1119 피격 ----------------
function hitTrack(e,s,t){if(!Number.isFinite(e.hp))return;if(s.hp==null){s.hp=e.hp;return;}if(e.hp<s.hp-1e-6&&(s.hitT0==null||t-s.hitT0>=HIT_GAP||t<s.hitT0)){s.hitT0=t;stats.hits++;}s.hp=e.hp;}
function hitFrame(s,t,ms){if(s.hitT0==null)return -1;let el=(t-s.hitT0)*1000;if(el<0)return -1;for(let i=0;i<ms.length;i++){if(el<ms[i])return i;el-=ms[i];}return -1;}
// 끝 자세 오프셋을 되돌리는 남은 비율(1→0), 아니면 0
function settleK(s,t,ms){if(s.hitT0==null)return 0;const el=t-s.hitT0-ms.reduce((a,b)=>a+b,0)/1000;return el>=0&&el<SETTLE?1-el/SETTLE:0;}
// ---------------- R1119 사망 빛 소멸 ----------------
const W=()=>{try{if(typeof performance!=='undefined'&&performance&&typeof performance.now==='function')return performance.now()/1000;}catch(_){}return T()??0;};
let last=null,wasAlive=false,death=null;
function ended(){try{const rm=typeof room!=='undefined'?room:null;if(!rm)return false;if(rm.persona&&rm.persona.completed===true)return true;return Array.isArray(rm.enemies)&&rm.enemies.some(e=>e&&e.persona&&!(e.hp>0));}catch(_){return false;}}
function isBody(c){if(!c||c.kind!=='image'||c.r1119)return false;const sp=String(c.sourcePath||'');return c.owner?.kind==='enemy'&&(c.r1097||c.r1104||c.r1104b||!!artOf(sp));}
// 수묵 소멸 칸을 아직 못 구웠으면 원본 칸으로 그린다
function deathTick(cmds,alive){if(alive){wasAlive=true;death=null;return;}
 if(!death&&wasAlive&&last&&ended()){death={t0:W(),last};stats.deaths++;}wasAlive=false;if(!death)return;
 const f=Math.floor((W()-death.t0)*1000/DEATH_MS);if(f<0||f>=DEATH_N){death=null;return;}
 for(let i=cmds.length-1;i>=0;i--)if(isBody(cmds[i]))cmds.splice(i,1);
 const L=death.last,k='death-'+L.q.kind;loadSheet(k);const c={...L.snap};if(placeSheet(c,L.q,null,k,f,1,L.ink,null)||(L.ink&&placeSheet(c,L.q,null,k,f,1,false,null))){c.key=String(L.snap.key)+':r1119d';c.r1119=true;cmds.push(c);stats.deathFrames++;}}
// 걸음 상태(페르소나 몸마다)
const ST=new WeakMap();
function track(e,t){let s=ST.get(e);if(!s){s={hist:[],w:0,phase:0,lastT:t,sdx:1,half:0,scr:[0,0]};ST.set(e,s);}
 if(t<s.lastT||t-s.lastT>1){s.hist.length=0;s.w=0;s.lastT=t;}
 const dt=t-s.lastT;if(dt<=0&&s.hist.length)return s;s.lastT=t;
 s.hist.push({t,x:e.x,y:e.y});while(s.hist.length>2&&t-s.hist[0].t>WIN)s.hist.shift();
 const a=s.hist[0],span=t-a.t,dx=e.x-a.x,dy=e.y-a.y,v=span>.12?Math.hypot(dx,dy)/span:0;
 const walking=v>WALK_V;s.w+=((walking?1:0)-s.w)*Math.min(1,dt*EASE);if(s.w<1e-3)s.w=0;
 if(walking){const sd=dx-dy,sv=dx+dy,sl=Math.hypot(sd,sv)||1;{const X=sd,Y=sv*.5,L=Math.hypot(X,Y)||1;s.scr=[X/L,Y/L];}if(Math.abs(sd)>1e-4)s.sdx=sd>0?1:-1;s.phase+=v*dt/STEP*Math.PI;const half=Math.floor(s.phase/Math.PI);if(half>s.half){stats.steps+=half-s.half;}s.half=half;}
 return s;}
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const lerp=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
function split(cmds,i,s){const c=cmds[i],P=c.points,sr=c.sourceRect;
 const Q=(u,v)=>lerp(lerp(P[0],P[1],u),lerp(P[3],P[2],u),v);
 const W=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),H=Math.hypot(P[3][0]-P[0][0],P[3][1]-P[0][1]);if(!(W>1)||!(H>1))return false;
 const w=s.w,sn=Math.sin(s.phase),lift=H*BOB*w*Math.abs(sn),lean=s.sdx*H*LEAN*w;
 const up=(p,dxk)=>[p[0]+dxk,p[1]-lift];
 const piece=(u0,u1,v0,v1,pts,tag)=>({...c,key:c.key!=null?String(c.key)+':r1104'+tag:c.key,sourceRect:[sr[0]+sr[2]*u0,sr[1]+sr[3]*v0,sr[2]*(u1-u0),sr[3]*(v1-v0)],points:pts,r1104:true});
 const upper=piece(0,1,0,HIP,[up(Q(0,0),lean),up(Q(1,0),lean),up(Q(1,HIP),0),up(Q(0,HIP),0)],'u');
 const leg=(u0,u1,sw,tag)=>{const fl=H*FOOT_LIFT*w*Math.max(0,sw>0?Math.abs(sn):0),dxs=sw*W*SWING*w;
  return piece(u0,u1,HIP,1,[up(Q(u0,HIP),0),up(Q(u1,HIP),0),[Q(u1,1)[0]+dxs,Q(u1,1)[1]-fl],[Q(u0,1)[0]+dxs,Q(u0,1)[1]-fl]],tag);};
 // 앞으로 내딛는 다리(sw>0 쪽 위상)를 나중에 그려 겹침 가운데에서 위로 오게
 const L=leg(0,.5+OV,sn*s.sdx,'l'),R=leg(.5-OV,1,-sn*s.sdx,'r');
 const all=[upper.points,L.points,R.points].flat();if(!all.every(okPt))return false;
 const order=sn*s.sdx>0?[R,L,upper]:[L,R,upper];cmds.splice(i,1,...order);return true;}
function process(cmds){if(!on||!Array.isArray(cmds))return 0;const t=T();if(t==null)return 0;const e=persona();try{deathTick(cmds,!!e);}catch(err){fail(err);}if(!e)return 0;prewarm();const s=track(e,t);try{hitTrack(e,s,t);standFoot(cmds,e,s);}catch(err){fail(err);}
 let best=-1,bh=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.r1104||c.r620Ghost)continue;const o=c.owner;if(!o||o.kind!=='enemy'||o.groundAligned===true)continue;
  const sp=String(c.sourcePath||'');if(!(BODY.test(sp)||c.r1097||artOf(sp)))continue;const P=c.points,sr=c.sourceRect;if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||!sr.every(Number.isFinite)||!(sr[2]>0)||!(sr[3]>0))continue;
  const h=Math.abs(P[3][1]-P[0][1]);if(h>bh){bh=h;best=i;}}
 if(best<0)return 0;
 const c=cmds[best];let q=RAWQ.get(c);if(!q){const m=artOf(c.sourcePath);if(m&&!c.r1097)q={P:c.points.map(p=>[...p]),sr:[...c.sourceRect],kind:m[1].toLowerCase(),dir:+m[2]};}
 const whole=q&&q.sr[0]===0&&q.sr[1]===0,ink=!!c.r1097,cast=casting(e);
 if(q)last={snap:{...c},q,ink};
 if(whole&&ink){for(const kk in WALK)wantInk(kk);for(const d of ['front','side','rear'])wantInk('hit-'+q.kind+'-'+d);wantInk('death-'+q.kind);}
 let walk=null,done=0;
 if(s.w>.02){let skip=false;
  if(whole){const k=pick(q,s)[0],ready=ink?SS[k].inkState==='ready':SS[k].state==='ready';
   if(ready){if(s.w>.5){try{walk=swapSheet(c,q,s,ink,e);if(walk)done=1;}catch(err){fail(err);}}else skip=true;}}
  if(!done&&!skip){try{if(split(cmds,best,s)){stats.split++;done=1;}}catch(err){fail(err);}}}
 else if(whole&&!cast){const [d,m]=HITDIR[q.dir]||HITDIR[0],hk='hit-'+q.kind+'-'+d,D=SH[hk],f=hitFrame(s,t,D.ms);
  if(f>=0){try{if(placeSheet(c,q,s,hk,f,m,ink,e)){done=1;stats.hitFrames++;stats.lastSheet=hk+':'+f;}}catch(err){fail(err);}}
  else if(D.settle){const r=settleK(s,t,D.ms);if(r>0){const P=c.points,ux=[(q.P[1][0]-q.P[0][0])/q.sr[2],(q.P[1][1]-q.P[0][1])/q.sr[2]],dx=m*D.settle*r;c.points=P.map(p=>[p[0]+ux[0]*dx,p[1]+ux[1]*dx]);stats.settle=(stats.settle||0)+1;}}}
 if(q&&(cast||(walk&&q.kind==='awake'))){const body=cmds.includes(c)?c:cmds.find(x=>x&&x.r1104&&x.owner===c.owner&&!x.r1119)||c;try{done+=addGlows(cmds,body,q,walk,q.kind==='awake',cast,t);}catch(err){fail(err);}}
 return done;}
// 서 있을 때(걸음 세기 .05 아래) 원래 그림 발 자리(172,385)가 몸 위치 project(e) 에서 얼마나 떨어져 있는지 잰다(천천히 따라감)
function standFoot(cmds,e,s){if(s.w>=.05||typeof project!=='function')return;let best=null,bh=0;for(const c of cmds){const q=c&&RAWQ.get(c);if(!q||q.kind!=='base'||c.owner?.kind!=='enemy')continue;const h=Math.abs(q.P[3][1]-q.P[0][1]);if(h>bh){bh=h;best=q;}}
 if(!best)return;const P=best.P,cw=best.sr[2],ch=best.sr[3],ax=ART.ax+(cw-344)/2,ay=ART.ground+(ch-400)/2,f=[P[0][0]+(P[1][0]-P[0][0])*ax/cw+(P[3][0]-P[0][0])*ay/ch,P[0][1]+(P[1][1]-P[0][1])*ax/cw+(P[3][1]-P[0][1])*ay/ch],g=project(e.x,e.y);
 if(!f.every(Number.isFinite)||!Number.isFinite(g?.x)||!Number.isFinite(g?.y))return;const o=[f[0]-g.x,f[1]-g.y];s.off0=s.off0?[s.off0[0]+(o[0]-s.off0[0])*.3,s.off0[1]+(o[1]-s.off0[1])*.3]:o;}
// 수묵 처리 전에 원래 몸 그림 사각형을 적어 둔다(수묵은 여백을 붙여 점을 바꾸므로)
function remember(cmds){for(const c of cmds){if(!c||c.kind!=='image'||c.r1097)continue;const m=artOf(c.sourcePath);if(!m)continue;const P=c.points,sr=c.sourceRect;
 if(Array.isArray(P)&&P.length===4&&P.every(okPt)&&Array.isArray(sr)&&sr.length>=4&&sr.every(Number.isFinite))RAWQ.set(c,{P:P.map(p=>[...p]),sr:[...sr],kind:m[1].toLowerCase(),dir:+m[2]});}}
// 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만)
let depth=0;
const wrapFn=fn=>{if(fn.__r1104)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;
   try{if(on)remember(frame.commands);}catch(err){fail(err);}
   try{const ink=window.__STORYWORLD_PERSONA_INK_R1097__;if(ink&&typeof ink.process==='function')ink.process(frame.commands);}catch(err){fail(err);}
   process(frame.commands);
   try{const fx=window.__STORYWORLD_PERSONA_SKILL_FX_R1119__;if(fx&&typeof fx.process==='function')fx.process(frame.commands);}catch(err){fail(err);}}}catch(err){fail(err);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1104=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
try{setInterval(wrapInst,500);}catch(e){fail(e);}wrapInst();
window.__STORYWORLD_PERSONA_STRIDE_R1104__=Object.freeze({revision:REV,storageKey:KEY,set,enabled:()=>on,process,walkSheets:WALK,dirs:DIRS,art:Object.freeze({...ART}),
 sheets:()=>{const o={};for(const k in SS)o[k]={state:SS[k].state,ink:SS[k].inkState,half:SS[k].inkHalf};return o;},
 inspect:()=>{const e=persona(),s=e?ST.get(e):null;return {revision:REV,on,walk:s?+s.w.toFixed(3):0,phase:s?+s.phase.toFixed(3):0,tuning:{HIP,OV,STEP,SWING,FOOT_LIFT,BOB,LEAN,WIN,WALK_V},sheets:Object.fromEntries(Object.entries(SS).map(([k,v])=>[k,v.state+'/'+v.inkState])),stats:{...stats},lastError};}});
})();
