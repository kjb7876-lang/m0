// R1195 — 몹 그림이 잘린 곳(특히 발·아랫자락, 공격 동작 때 칸 밖으로 나간 팔·날개)을 먹 연기로 덮는다
//  (사용자 2026-11-19 02:11Z "몹들 이미지 잘린부분 특히 발쪽 모션이라던가 부분에 검은 연기같은 프레임이펙트로 수묵화풍으로 가려서
//   어색하거나 이상한부분을 시각적연출로 커버해줘").
//  · 무엇을 덮나: 엔진 drawEnemy 가 실제로 그린 몸 그림 명령(ctx.commands 의 image)의 원본 칸(sourceRect)을 한 번만 읽어
//    - 아래 잘림: 그림의 가장 아랫줄이 칸 바닥에 닿았거나(칸이 작아 잘림), 가장 아랫줄이 넓고 단단한 직선(그림 자체가 잘림)일 때.
//      발·다리처럼 가늘어지며 끝나는 자연스러운 아랫부분(부드러운 가장자리)은 건드리지 않는다.
//    - 옆 잘림: 그림이 칸 왼쪽·오른쪽 끝에 단단하게 닿을 때(공격 동작에서 팔·무기·날개가 칸 밖으로 나가 잘린 경우).
//  · 어떻게 덮나: 코드로 그린 원·선이 아니라 이미 게임에 있는 프레임 시트만 쓴다.
//    - R430 안개 고리(assets/r430/mist-loop.webp 20칸) — R1029 다리 안개 시트가 쓰는 것과 같은 바닥 안개를 먹빛으로 한 번 구워서.
//    - R108 연기 기둥(15세 사망 연출 R462·R1054 '검은 실루엣 → 어두운 연기·재'가 쓰는 시트)을 먹빛으로 구워 잘린 줄에서 가늘게 피어오르게(PC만).
//  · 판정·피해·AI·크기는 바꾸지 않는다(그림 덧칠만). 보스·중간보스도 같은 규칙(잘린 곳이 있을 때만).
//  · 렉: 칸마다 한 번만 픽셀을 읽고(캐시), 한 프레임에 읽는 칸 수를 제한한다(휴대폰 1, PC 3). 덮개는 몹 하나에 시트 1~2번 그리기.
//    휴대폰(넓이 900px 이하 또는 터치 위주)은 덮개 1겹.
//  · 끄기: localStorage storyworld.r1195.feetInk = '0'. 검사 qa/r1195/feet-ink-cpu-check.cjs.
(()=>{'use strict';
if(window.__STORYWORLD_FEET_INK_R1195__)return;
const REV='R1195-feet-ink-1';
const MIST={p:'assets/r430/mist-loop.webp',cell:192,cols:6,frames:20,cx:96,cy:108,vw:132,vh:62};
// R462 15세 사망 연기와 같은 R108 연기 기둥 시트(16칸) — 잘린 줄에서 먹 연기가 가늘게 피어오르는 겹(PC만)
const SMOKE={p:'assets/r108/eden/smoke.webp',cell:256,cols:4,frames:15,px:128,py:228,vh:200};
// 시트를 먹빛으로 한 번 구워 둔다(반 해상도). 매 프레임 ctx.filter 를 쓰지 않아 휴대폰 2D 그리기가 가볍고, 같은 시트를 다른 색으로 쓰는
// R430 바닥 안개·R462 연기·R302 영웅 색 입히기와 3D 텍스처가 섞이지 않게 고유 경로(r1195:…)로 표시한다.
// 먹빛: 밝기 l → 12+l*.22 (짙은 먹 ~ 옅은 먹 회색), 알파는 그대로 → 안개 결이 먹 번짐처럼 남는다.
const BAKE_K=.5,baked=new Map();
function inkTone(d){for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const l=(d[i]*.299+d[i+1]*.587+d[i+2]*.114),v=Math.round(12+l*.22);d[i]=v;d[i+1]=Math.round(v*.96);d[i+2]=Math.round(v*.92);}return d;}
function bake(S,src){let b=baked.get(S.p);if(b!==undefined)return b;b=null;
 try{const w=Math.max(1,Math.round((src.naturalWidth||src.width)*BAKE_K)),h=Math.max(1,Math.round((src.naturalHeight||src.height)*BAKE_K));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);
  const id=g.getImageData(0,0,w,h);inkTone(id.data);g.putImageData(id,0,0);
  cv.__storyworldStaticSource={path:'r1195:ink:'+S.p,round:'R1195'};b=cv;stats.baked=(stats.baked||0)+1;}catch(e){fail(e);b=null;}
 baked.set(S.p,b);return b;}
function inked(S){const src=image(S.p);return src?bake(S,src):null;}
const recent=[];const stats={wraps:0,draws:0,covered:0,analysed:0,skippedMutable:0,errors:0,bottom:0,side:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,300);};
const on=()=>{try{return localStorage.getItem('storyworld.r1195.feetInk')!=='0';}catch(_){return true;}};
const mobile=()=>{try{return Math.min(innerWidth,innerHeight)<=500||innerWidth<=900||matchMedia('(pointer:coarse)').matches;}catch(_){return false;}};

// ---- 판정(순수 함수, CPU 검사 대상) -------------------------------------------------------------------------
// alpha: 칸의 알파값(Uint8 길이 sw*sh), 반환: {bottom:{y,x0,x1,edge}|null, left:{y0,y1}|null, right:{y0,y1}|null}
const SOFT=40,HARD=200;
function classify(alpha,sw,sh){
 if(!alpha||sw<8||sh<8||alpha.length<sw*sh)return null;
 const soft=new Int32Array(sh),hard=new Int32Array(sh);let maxW=0,last=-1,first=-1;
 for(let y=0;y<sh;y++){let s=0,h=0;const o=y*sw;for(let x=0;x<sw;x++){const a=alpha[o+x];if(a>=SOFT){s++;if(a>=HARD)h++;}}soft[y]=s;hard[y]=h;if(s>maxW)maxW=s;if(s>0){last=y;if(first<0)first=y;}}
 if(last<0||maxW<6)return null;
 const out={bottom:null,left:null,right:null,maxW,last};
 // 발 둘레: 잘린 줄에서 몸 높이 10% 위까지의 그림 폭(덮개는 잘린 조각만이 아니라 발 전체를 감싼다)
 const foot=yb=>{let x0=sw,x1=-1;const top=Math.max(first,yb-Math.round(.22*(yb-first+1)));for(let y=top;y<=yb;y++){const o=y*sw;for(let x=0;x<sw;x++)if(alpha[o+x]>=SOFT){if(x<x0)x0=x;if(x>x1)x1=x;}}return x1<0?[0,sw]:[x0,x1+1];};
 const ext=y=>{let x0=-1,x1=-1;const o=y*sw;for(let x=0;x<sw;x++)if(alpha[o+x]>=HARD){if(x0<0)x0=x;x1=x;}return[x0,x1];};
 // 딱 맞게 오린 그림(테두리 상자 = 칸): 위·아래·왼·오른쪽 중 세 쪽 이상이 닿으면 칸 끝에 닿은 것은 잘림이 아니다(발·손이 상자에 닿았을 뿐).
 const touch=(x0,x1,y0,y1)=>{let n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(alpha[y*sw+x]>=SOFT&&++n>=2)return true;return false;};
 const tight=(touch(0,sw,0,1)+touch(0,sw,sh-1,sh)+touch(0,1,0,sh)+touch(sw-1,sw,0,sh))>=3;out.tight=tight;
 // (1) 칸 바닥에 닿음: 마지막 두 줄(끝 줄은 리샘플로 반투명일 수 있음) 중 하나에 단단한 픽셀이 여럿
 const ye=hard[sh-1]>=hard[sh-2]?sh-1:sh-2,edgeHard=hard[ye];
 if(!tight&&edgeHard>=Math.max(4,.06*maxW)&&soft[sh-1]>0){const [x0,x1]=foot(sh-1);out.bottom={y:sh,x0,x1,edge:true};}
 else{
  // (2) 그림 자체의 직선 잘림: 가장 아랫줄이 넓고, 대부분 단단하고, 몇 줄 위와 폭이 거의 같다(가늘어지며 끝나지 않음)
  const yl=last,y3=Math.max(0,last-3);
  if(hard[yl]>=Math.max(8,.22*maxW)&&hard[yl]>=.6*soft[yl]&&soft[y3]<=soft[yl]*1.35+3){const [x0,x1]=foot(yl);out.bottom={y:yl+1,x0,x1,edge:false};}
 }
 // (3) 옆 잘림: 칸 왼·오른쪽 끝 열에 단단한 픽셀이 이어서 여럿
 //     끝 열이 리샘플로 반투명이면 바로 안쪽 열이 단단하고 끝 열도 비어 있지 않을 때를 잘림으로 본다.
 const colRun=(x,xi)=>{let n=0,y0=-1,y1=-1;for(let y=0;y<sh;y++){const a=alpha[y*sw+x];if(a>=HARD||(a>=SOFT&&alpha[y*sw+xi]>=HARD)){n++;if(y0<0)y0=y;y1=y;}}return n>=Math.max(6,.04*sh)?{y0,y1:y1+1,n}:null;};
 if(!tight){out.left=colRun(0,1);out.right=colRun(sw-1,sw-2);}
 if(!out.bottom&&!out.left&&!out.right)return{none:true,maxW,last};
 return out;}

// ---- 칸 읽기(캐시) ------------------------------------------------------------------------------------------
const cache=new Map();let budget=0,scratch=null;
function keyOf(c){const r=c.sourceRect;return String(c.sourcePath||'')+'|'+r.map(v=>Math.round(v)).join(',');}
function analyse(c){const r=c.sourceRect.map(v=>Math.round(v)),sw=r[2],sh=r[3];if(sw<8||sh<8||sw*sh>1200*1200)return{none:true};
 scratch=scratch||document.createElement('canvas');if(scratch.width<sw)scratch.width=sw;if(scratch.height<sh)scratch.height=sh;
 const g=scratch.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,sw,sh);g.drawImage(c.image,r[0],r[1],sw,sh,0,0,sw,sh);
 const d=g.getImageData(0,0,sw,sh).data,a=new Uint8Array(sw*sh);for(let i=0;i<a.length;i++)a[i]=d[i*4+3];stats.analysed++;
 return classify(a,sw,sh)||{none:true};}
function verdict(c){const k=keyOf(c);let v=cache.get(k);if(v!==undefined)return v;
 if(budget<=0)return null;budget--;
 try{v=analyse(c);}catch(e){v={none:true,err:true};fail(e);}
 if(cache.size>900)cache.delete(cache.keys().next().value);cache.set(k,v);
 if(v.bottom)stats.bottom++;if(v.left||v.right)stats.side++;return v;}

// ---- 그리기 -------------------------------------------------------------------------------------------------
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();
 if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;}catch(_){return performance.now()/1000;}};
// 칸 안 좌표(u,v: 픽셀) → 명령 점 공간
function mapper(c){const P=c.points,r=c.sourceRect,sw=r[2],sh=r[3];
 const ax=(P[1][0]-P[0][0])/sw,ay=(P[1][1]-P[0][1])/sw,bx=(P[3][0]-P[0][0])/sh,by=(P[3][1]-P[0][1])/sh;
 return(u,v)=>[P[0][0]+ax*u+bx*v,P[0][1]+ay*u+by*v];}
function mist(im,fr,cx,cy,w,h,rot,alpha,flip){if(!(w>2&&h>1)||![cx,cy,w,h].every(Number.isFinite))return;
 fr=((fr%MIST.frames)+MIST.frames)%MIST.frames;
 const k=BAKE_K,C=MIST.cell*k;ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.translate(cx,cy);if(rot)ctx.rotate(rot);ctx.scale((flip?-1:1)*w/(MIST.vw*k),h/(MIST.vh*k));
  ctx.drawImage(im,(fr%MIST.cols)*C,Math.floor(fr/MIST.cols)*C,C,C,-MIST.cx*k,-MIST.cy*k,C,C);stats.draws++;}finally{ctx.restore();}}
function wisp(im,fr,x,y,h,alpha,flip){if(!(h>2)||![x,y,h].every(Number.isFinite))return;fr=((fr%SMOKE.frames)+SMOKE.frames)%SMOKE.frames;const k=BAKE_K,C=SMOKE.cell*k,s=h/(SMOKE.vh*k);
 ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  ctx.drawImage(im,(fr%SMOKE.cols)*C,Math.floor(fr/SMOKE.cols)*C,C,C,-SMOKE.px*k,-SMOKE.py*k,C,C);stats.draws++;}finally{ctx.restore();}}
function cover(e,c,v,low){const im=inked(MIST);if(!im)return false;const M=mapper(c),dpr=+ctx.dpr||1,r=c.sourceRect,sw=r[2],sh=r[3];
 const seed=(typeof e.id==='number'?e.id:String(e.id||e.name||'').length*7)|0,t=T(),fr=Math.floor(t*9+seed*3);
  // enemy:true — 몹 쪽 그림으로 표시해 R350(영웅 가림)·R409(몹 가림) 옅게에서 빠진다(안 그러면 몹 곁에서 1/3 로 옅어져 안 보임).
 const owner={id:'r1195-'+String(e.id??seed),kind:'effect',sourcePath:'r1195:ink:'+MIST.p,x:e.x,y:e.y,groundAligned:false,lightShadowApproved:true,enemy:true};
 const paint=()=>{ctx.save();try{ctx.setTransform(dpr,0,0,dpr,0,0);
  if(v.bottom){const b=v.bottom,x0=Math.max(0,b.x0),x1=Math.min(sw,b.x1),mid=(x0+x1)/2;
   const A=M(x0,b.y),B=M(x1,b.y),C=M(mid,b.y),H=M(mid,b.y-sh);const wpx=Math.hypot(B[0]-A[0],B[1]-A[1]),hpx=Math.hypot(H[0]-C[0],H[1]-C[1]);
   // 아래 겹: 잘린 줄을 가운데보다 조금 위에 두고 발 둘레보다 넓게. 위 겹: 옅게 피어올라 잘린 선 위 몸 아랫부분으로 번진다.
   const w=Math.max(wpx*1.3,hpx*.42),h=Math.max(w*.42,hpx*.22);
   mist(im,fr,C[0],C[1]-h*.28,w,h,0,1,false);
   if(!low){mist(im,fr+10,C[0]-w*.04,C[1]-h*.72,w*.8,h*.8,0,.55,true);
    const sm=inked(SMOKE);if(sm){const ph=(t*.55+seed*.37)%1,sfr=4+Math.floor(ph*8);wisp(sm,sfr,C[0]+w*.18,C[1]+h*.1,hpx*.42,.38*Math.sin(Math.PI*ph),false);
     const ph2=(ph+.5)%1;wisp(sm,4+Math.floor(ph2*8),C[0]-w*.2,C[1]+h*.1,hpx*.36,.32*Math.sin(Math.PI*ph2),true);}}}
  for(const side of['left','right']){const s=v[side];if(!s)continue;const x=side==='left'?0:sw,ym=(s.y0+s.y1)/2;
   const A=M(x,s.y0),B=M(x,s.y1),C=M(x,ym);const len=Math.hypot(B[0]-A[0],B[1]-A[1]);if(len<3)continue;
   const rot=Math.atan2(B[1]-A[1],B[0]-A[0]);
   mist(im,fr+5,C[0],C[1],len*1.45,Math.max(len*.42,8),rot,.88,side==='left');}
 }finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();stats.covered++;
 if(recent.length>=24)recent.shift();const P=c.points;recent.push({name:e.name,box:[Math.min(P[0][0],P[1][0],P[2][0],P[3][0]),Math.min(P[0][1],P[3][1]),Math.max(P[0][0],P[1][0],P[2][0],P[3][0]),Math.max(P[2][1],P[3][1])].map(v=>Math.round(v)),bottom:!!v.bottom,side:!!(v.left||v.right)});return true;}

// ---- 몸 그림 명령 찾기 ---------------------------------------------------------------------------------------
function bodyOf(C,n0){let best=null,bs=0;for(let i=n0;i<C.length;i++){const q=C[i];if(!q||q.kind!=='image'||!q.points||!q.sourceRect)continue;
 const P=q.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!(ar>0))continue;
 const s=ar*(q.spatialRole==='body'?100:1);if(s>bs){bs=s;best=q;}}return best;}
let depth=0;
function wrap(base){const w=function(e,...a){if(depth>0)return base.call(this,e,...a);depth++;try{return inner.call(this,e,a);}finally{depth--;}};
 const inner=function(e,a){const C=(typeof ctx!=='undefined'&&ctx&&Array.isArray(ctx.commands))?ctx.commands:null,n0=C?C.length:0;
  const r=base.call(this,e,...a);
  try{if(C&&e&&e.hp>0&&!e.hidden&&on()&&C.length>n0){const c=bodyOf(C,n0);
    if(c){if(c.mutable){stats.skippedMutable++;}else{const v=verdict(c);if(v&&!v.none)cover(e,c,v,mobile());}}}}catch(err){fail(err);}
  return r;};
 // 다른 오버레이의 '이미 감쌌음' 표시(__rNNN)를 그대로 옮겨, 서로 표시를 못 보고 번갈아 다시 감싸는 일을 막는다.
 try{for(const k of Object.keys(base))if(/^__/.test(k)&&!/^__r1195/.test(k)&&!(k in w))w[k]=base[k];}catch(_){}
 w.__r1195=true;w.__r1195Base=base;return w;}
function install(){try{if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r1195)return true;drawEnemy=wrap(drawEnemy);stats.wraps++;return true;}catch(e){fail(e);return false;}}
// 다른 오버레이가 나중에 drawEnemy 를 감싸도 맨 바깥에 오도록(공격 좌우 바로잡기 R425 뒤의 점을 읽기 위해) 가끔 다시 확인한다.
let frames=0;function pump(){frames++;budget=mobile()?1:3;install();requestAnimationFrame(pump);}
if(typeof requestAnimationFrame==='function')requestAnimationFrame(pump);install();
window.__STORYWORLD_FEET_INK_R1195__=Object.freeze({revision:REV,classify,inkTone,
 inspect:()=>({revision:REV,installed:typeof drawEnemy==='function'&&!!drawEnemy.__r1195,on:on(),mobile:mobile(),cache:cache.size,stats:{...stats},recent:recent.slice(),lastError}),
 cached:()=>[...cache.entries()].filter(([,v])=>v&&!v.none).map(([k,v])=>({k,bottom:v.bottom||null,left:v.left||null,right:v.right||null}))});
})();
