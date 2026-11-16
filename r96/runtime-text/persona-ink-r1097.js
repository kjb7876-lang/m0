// R1097 — 페르소나 보스 수묵 그림. 사용자 2026-11-16 "페르소나보스 동양풍 수묵풍 동양화느낌나게 극한으로 이미지개선해줘 코드만으로" + "페르소나 보스 및 영웅 - 언주색 이 고유색".
//  · 새 그림 파일은 없다. 원래 몸 그림(rc133 art 의 base·awake 8방향 16장)을 실행 중에 한 번씩 수묵화로 바꿔 구워 두고(캐시), 몸 그림 명령의 그림만 바꿔 끼운다.
//  · 수묵 변환(inkify, 순수 계산):
//     ① 먹 농담 — 붉지 않은 색은 모두 먹(#12161c)과 종이(#f3eee2) 사이 농묵·중묵·담묵·여백 네 단으로, 단 사이는 물 번지듯 흔들린 경계
//     ② 세로 농담 — 두건은 짙고 옷자락으로 내려갈수록 붓의 먹이 빠진다(발끝은 다시 짙게 눌러 선다)
//     ③ 갈필(비백) — 옷자락 결을 따라 세로로 긴 마른 붓 자국이 종이를 드러낸다 ④ 한지 결
//     ⑤ 언주색 담채 — 붉은 곳만 물감: 짙은 언주 → 언주 → 주홍 → 옅은 빛(R1095 공통 팔레트와 같은 값). 페르소나의 고유색은 언주색 하나다(푸른 눈빛 같은 다른 색은 먹이 된다)
//     ⑥ 윤곽 붓선 — 굵기가 변하고(오른쪽 아래가 굵다) 군데군데 끊기는 먹선, 붉은 불꽃 자락은 몰골(선 없이 물감만)
//     ⑦ 바깥 — 안개 같은 종이빛 여백(어두운 먹 바탕에서 형상이 묻히지 않게, R409 붉은 테두리를 대신한다) + 옷자락 아래 먹 번짐·튄 먹
//  · 하는 법: 렌더러가 받는 프레임 명령 가운데 페르소나 보스 몸 그림(owner enemy, 덮어 그리기)만 고른다. R409 가 먼저 구운 테두리 캔버스의 열쇠에서 원본 주소를 읽어
//    원본을 따로 받아(CORS) 굽고, 네 귀퉁이를 여백만큼 넓힌다. 준비 전·받기 실패·읽기 실패면 원본 그대로다. 피격 번쩍임 같은 기존 필터는 남고, R1090 담묵 필터는 겹치지 않게 뗀다.
//  · 성능: 한 장씩 차례로 굽고(프레임 사이), 모바일(PC급 아님)·성능 4단계 이하는 반 크기로 굽는다. 캐시는 16장. 화면 필터·추가 패스 없음.
//  · 맵 수묵화풍(R1055)이 꺼졌거나 쉬는 성능 단계(k=0)면 같이 쉰다. 설정 창 '전투 화면' 구역의 '페르소나 수묵 그림' 체크로 따로 끌 수 있다(저장 storyworld.r1097.personaInk = '0' 이면 끔).
//  판정·피해·AI·저장·서사·이펙트·탄은 바꾸지 않는다(보스 몸 그림만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_INK_R1097__)return;
const REV='R1097-persona-ink-1',KEY='storyworld.r1097.personaInk',PAD=26;
const HEX=Object.freeze({deep:'#460e0a',yeonji:'#841e16',juhong:'#cc3428',pale:'#ffb08c',ink:'#12161c',white:'#f3eee2'});
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const PAL={ink:rgb(HEX.ink),paper:rgb(HEX.white),deep:rgb(HEX.deep),yeonji:rgb(HEX.yeonji),juhong:rgb(HEX.juhong),pale:rgb(HEX.pale)};
const stats={frames:0,swapped:0,baked:0,failed:0,errors:0,rows:0,bakeMs:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
// ---------------- 수묵 변환(순수 계산: 화소 배열 → 화소 배열) ----------------
const fin=(v,d)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a||1e-6),0,1);return t*t*(3-2*t);};
function hash2(x,y,s){let n=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967295;}
function vnoise(x,y,s){const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash2(x0,y0,s),b=hash2(x0+1,y0,s),c=hash2(x0,y0+1,s),d=hash2(x0+1,y0+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
// 상자 뭉개기(가로·세로 한 번씩)
function soften(src,W,H,r){if(r<1)return src;const tmp=new Float32Array(W*H),out=new Float32Array(W*H),k=2*r+1;
 for(let y=0;y<H;y++){let acc=0;const o=y*W;for(let x=-r;x<=r;x++)acc+=src[o+clamp(x,0,W-1)];for(let x=0;x<W;x++){tmp[o+x]=acc/k;acc+=src[o+clamp(x+r+1,0,W-1)]-src[o+clamp(x-r,0,W-1)];}}
 for(let x=0;x<W;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=tmp[clamp(y,0,H-1)*W+x];for(let y=0;y<H;y++){out[y*W+x]=acc/k;acc+=tmp[clamp(y+r+1,0,H-1)*W+x]-tmp[clamp(y-r,0,H-1)*W+x];}}
 return out;}
// 챔퍼 거리(화소 단위, cap 까지). on[i]=1 인 곳은 0, 나머지는 가장 가까운 on 까지의 거리
function chamfer(on,W,H,cap){const d=new Float32Array(W*H),B=cap+2;for(let i=0;i<d.length;i++)d[i]=on[i]?0:B;const a=1,b=1.4142;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let v=d[i];if(!v)continue;if(x>0&&d[i-1]+a<v)v=d[i-1]+a;if(y>0){if(d[i-W]+a<v)v=d[i-W]+a;if(x>0&&d[i-W-1]+b<v)v=d[i-W-1]+b;if(x<W-1&&d[i-W+1]+b<v)v=d[i-W+1]+b;}d[i]=v;}
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let v=d[i];if(!v)continue;if(x<W-1&&d[i+1]+a<v)v=d[i+1]+a;if(y<H-1){if(d[i+W]+a<v)v=d[i+W]+a;if(x<W-1&&d[i+W+1]+b<v)v=d[i+W+1]+b;if(x>0&&d[i+W-1]+b<v)v=d[i+W-1]+b;}d[i]=v;}
 return d;}
function percentile(hist,total,q){let acc=0;const want=total*q;for(let i=0;i<hist.length;i++){acc+=hist[i];if(acc>=want)return i/(hist.length-1);}return 1;}
const LEV=[.97,.86,.62,.05]; // 먹이 종이를 덮는 정도: 농묵·중묵·담묵·여백
// src: RGBA 화소(w×h). opt: pad(사방 여백, 0~48)·seed(붓 자국 씨앗)·unit(길이 배율 — 반 크기로 구울 때 .5)·halo·fall·bleed·strength
function inkify(src,w,h,opt){opt=opt||{};
 if(!src||!Number.isFinite(w)||!Number.isFinite(h))return null;w=Math.floor(w);h=Math.floor(h);if(!(w>0)||!(h>0)||!(src.length>=w*h*4))return null;
 const pad=clamp(Math.floor(fin(opt.pad,PAD)),0,48),seed=Math.floor(fin(opt.seed,1))|0,U=clamp(fin(opt.unit,1),.25,2),W=w+2*pad,H=h+2*pad,N=W*H;
 const A=new Float32Array(N),L=new Float32Array(N),R=new Float32Array(N),V=new Float32Array(N);
 let minY=H,maxY=-1,solid=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=(y*w+x)*4,i=(y+pad)*W+x+pad,a=src[s+3]/255;if(!(a>0))continue;
  const r=src[s]/255,g=src[s+1]/255,b=src[s+2]/255,gb=Math.max(g,b);
  A[i]=a;L[i]=.299*r+.587*g+.114*b;V[i]=Math.max(r,gb);
  R[i]=sstep(.16,.42,(r-gb)/(r+.02))*sstep(.16,.36,r);
  if(a>.4){solid++;if(y+pad<minY)minY=y+pad;if(y+pad>maxY)maxY=y+pad;}}
 const out=new Uint8ClampedArray(N*4);if(!solid)return {data:out,width:W,height:H,pad,solid:0};
 const mask=new Uint8Array(N),inv=new Uint8Array(N);for(let i=0;i<N;i++){mask[i]=A[i]>.4?1:0;inv[i]=mask[i]?0:1;}
 const dOut=chamfer(mask,W,H,pad+2),dIn=chamfer(inv,W,H,Math.ceil(12*U));
 // 붓질 덩어리용으로 뭉갠 밝기와 선용 밝기. 투명한 곳이 어둡게 끌어내리지 않게 알파로 나눈다
 const LA=new Float32Array(N);for(let i=0;i<N;i++)LA[i]=L[i]*A[i];
 const rw=Math.max(1,Math.round(2*U)),rs=1,bA=soften(A,W,H,rw),bL=soften(LA,W,H,rw),sA=soften(A,W,H,rs),sL=soften(LA,W,H,rs),bR=soften(R,W,H,1);
 const Lw=new Float32Array(N),Ls=new Float32Array(N);for(let i=0;i<N;i++){Lw[i]=bA[i]>.02?bL[i]/bA[i]:0;Ls[i]=sA[i]>.02?sL[i]/sA[i]:0;}
 // 먹 농담 기준: 붉지 않은 몸 화소의 밝기 분포(검은 옷도 농묵·중묵·담묵으로 갈리게)
 const hist=new Uint32Array(256);let cnt=0;for(let i=0;i<N;i++)if(mask[i]&&R[i]<.35){hist[clamp(Math.round(Lw[i]*255),0,255)]++;cnt++;}
 const q=p=>cnt?percentile(hist,cnt,p):p;const p1=q(.55),p2=q(.85),p3=Math.max(q(.95),p2+.06,.30),p4=Math.max(p3+.14,.52);
 const toneOf=l=>l<=p1?.5*l/(p1||1e-6):l<=p2?.5+(l-p1)/(p2-p1||1e-6):l<=p3?1.5+(l-p2)/(p3-p2||1e-6)*.8:2.3+clamp((l-p3)/(p4-p3||1e-6),0,1)*.7; // 0(농묵)..3(종이)
 // 안쪽 선: 밝기 기울기
 const G=new Float32Array(N),gh=new Uint32Array(256);let gc=0;
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!mask[i])continue;
  const gx=Ls[i-W+1]+2*Ls[i+1]+Ls[i+W+1]-Ls[i-W-1]-2*Ls[i-1]-Ls[i+W-1],gy=Ls[i+W-1]+2*Ls[i+W]+Ls[i+W+1]-Ls[i-W-1]-2*Ls[i-W]-Ls[i-W+1];
  const m=Math.sqrt(gx*gx+gy*gy);G[i]=m;gh[clamp(Math.round(m*255),0,255)]++;gc++;}
 const gT=Math.max(.06,gc?percentile(gh,gc,.86):.06),gT2=gT*1.9;
 const figH=Math.max(1,maxY-minY),hemY=minY+figH*.6,ink=PAL.ink,paper=PAL.paper,S=clamp(fin(opt.strength,1),0,2);
 const HALO=clamp(fin(opt.halo,.66),0,1),AURA=clamp(fin(opt.aura,.55),0,1),FALL=clamp(fin(opt.fall,.26),0,.9),BLEED=clamp(fin(opt.bleed,.62),0,1);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=i*4,X=x/U,Y=y/U;let cr=0,cg=0,cb=0,ca=0;
  const nLow=vnoise(X/23,Y/23,seed+11),nFine=hash2(x,y,seed+5);
  if(A[i]>.004){const nMid=vnoise(X/7,Y/7,seed+23),fib=vnoise(X/5,Y/5,seed+31)*.5+vnoise(X/38,Y/38,seed+33)*.5,vy=clamp((y-minY)/figH,0,1);
   // ① 먹 농담
   const lm=Lw[i]+(Ls[i]-Lw[i])*sstep(.2,.38,Ls[i]);let t=clamp(toneOf(lm)+(nLow-.5)*.3,0,3);const k=Math.floor(t),f=sstep(.3,.7,t-k);
   let cov=LEV[Math.min(3,k)]+(LEV[Math.min(3,k+1)]-LEV[Math.min(3,k)])*f;if(f>0&&f<1)cov+=.05*(1-Math.abs(2*f-1)); // 물 고인 경계
   // ② 세로 농담: 옷자락으로 갈수록 옅게, 발끝은 다시 짙게
   const fall=1-FALL*sstep(.3,.8,vy)*(1-.85*sstep(.87,.96,vy))*(.75+.5*nLow);if(cov>.2)cov=.2+(cov-.2)*fall;
   // ③ 갈필(비백)
   const dry=sstep(.74,.88,vnoise(X/4.6,Y/44,seed+41))*sstep(.35,1,vy)*(cov>.4?1:.3);if(dry>0)cov-=dry*.55*S;
   // ④ 한지 결
   cov=clamp(cov*(1-.07*fib-.035*nFine),0,1);
   cr=paper[0]+(ink[0]-paper[0])*cov;cg=paper[1]+(ink[1]-paper[1])*cov;cb=paper[2]+(ink[2]-paper[2])*cov;
   // 안쪽 먹선(밝은 얼굴 위에서는 가늘게)
   const gl=sstep(gT,gT2,G[i])*(.55+.45*nMid)*.9*(1-.55*sstep(.35,.6,Ls[i]));if(gl>.02){cr+=(ink[0]-cr)*gl;cg+=(ink[1]-cg)*gl;cb+=(ink[2]-cb)*gl;}
   // ⑤ 언주색 담채
   const rk=clamp(Math.max(R[i],bR[i]*1.4),0,1);
   if(rk>.02){const v=clamp(V[i]+(nMid-.5)*.12,0,1);let a,b,m;
    if(v<.28){a=PAL.deep;b=PAL.yeonji;m=sstep(.10,.28,v);}else if(v<.72){a=PAL.yeonji;b=PAL.juhong;m=sstep(.28,.56,v);}else{a=PAL.juhong;b=PAL.pale;m=sstep(.80,1,v)*.75;}
    const wash=1-.08*fib-.04*nFine;cr+=((a[0]+(b[0]-a[0])*m)*wash-cr)*rk;cg+=((a[1]+(b[1]-a[1])*m)*wash-cg)*rk;cb+=((a[2]+(b[2]-a[2])*m)*wash-cb)*rk;}
   ca=A[i];
   // ⑥ 윤곽 붓선
   if(mask[i]){const dx=dIn[Math.min(N-1,i+1)]-dIn[Math.max(0,i-1)],dy=dIn[Math.min(N-1,i+W)]-dIn[Math.max(0,i-W)],len=Math.hypot(dx,dy)||1;
    const dir=clamp(-(dx*.55+dy*.83)/len,-1,1),th=(1.6+2.6*nLow+2.2*Math.max(0,dir))*S*U,gap=sstep(.14,.30,vnoise(X/17,Y/17,seed+53));
    const lk=(1-sstep(th-.9*U,th+.4*U,dIn[i]))*gap*(1-rk*.85)*.95;if(lk>.02){cr+=(ink[0]-cr)*lk;cg+=(ink[1]-cg)*lk;cb+=(ink[2]-cb)*lk;}}}
  // ⑦ 바깥: 안개 같은 종이빛 여백 + 옷자락 아래 먹 번짐·튄 먹. 그림 끝에서는 반드시 0 으로 사라진다(네모 판이 보이지 않게)
  if(A[i]<1&&pad>0&&dOut[i]>0&&dOut[i]<=pad){const d=dOut[i],u=1-d/pad,edge=sstep(0,.25,u),nMid=vnoise(X/7,Y/7,seed+23),mist=vnoise(X/41,Y/41,seed+61);
   let ba=HALO*Math.pow(u,1.25)*sstep(.22,.72,mist*.8+nLow*.25+u*.22)*(.9+.1*nFine);
   // 몸 가까운 여백에는 언주색 기운이 옅게 밴다(붉은 물이 종이에 번진 자리)
   const ak=AURA*(1-sstep(0,7*U,d))*(.6+.4*nMid),jh=PAL.juhong;let br=paper[0]+(jh[0]-paper[0])*ak,bg=paper[1]+(jh[1]-paper[1])*ak,bb=paper[2]+(jh[2]-paper[2])*ak;ba=Math.min(1,ba*(1+.9*ak));
   if(y>hemY){const hk=sstep(hemY,maxY,y);let bl=BLEED*Math.exp(-d/((3+6*nLow)*U))*sstep(.32,.62,nMid+hk*.25)*hk*edge;
    if(d>3*U&&vnoise(X/4.5,Y/4.5,seed+71)>.84-hk*.05)bl=Math.max(bl,.72*edge*hk); // 튄 먹
    if(bl>.02){const na=bl+ba*(1-bl);br=(ink[0]*bl+br*ba*(1-bl))/na;bg=(ink[1]*bl+bg*ba*(1-bl))/na;bb=(ink[2]*bl+bb*ba*(1-bl))/na;ba=na;}}
   const na=ca+ba*(1-ca);if(na>0){cr=(cr*ca+br*ba*(1-ca))/na;cg=(cg*ca+bg*ba*(1-ca))/na;cb=(cb*ca+bb*ba*(1-ca))/na;}ca=na;}
  out[o]=fin(cr,0);out[o+1]=fin(cg,0);out[o+2]=fin(cb,0);out[o+3]=fin(ca,0)*255;}
 return {data:out,width:W,height:H,pad,solid};}
// ---------------- 켜고 끄기 ----------------
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
// 맵 수묵화풍이 실제로 켜져 있는가(R1055 의 지금 세기 k). 0.5초에 한 번 본다.
let inkLive=false;
function refresh(){let live=false;try{const M=window.__STORYWORLD_INK_WASH_R1055__;if(M&&typeof M.inspect==='function'){const i=M.inspect();live=!!i&&i.prefs?.mode!=='off'&&Number.isFinite(i.k)&&i.k>.5;}}catch(_){live=false;}inkLive=live;return live;}
const active=()=>on&&inkLive;
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}label();return on;}
// ---------------- 원본 받기·굽기·캐시 ----------------
const RX=/(?:^|[\/:])assets\/rc133\/art\/(base|awake)-([0-7])(\.png)(?:[?#][^:]*)?$/;
function match(v){if(typeof v!=='string'||!v)return null;const m=RX.exec(v);return m?{kind:m[1],dir:+m[2]}:null;}
const R409=/^r409:outline:[a-z]+:u:(.+):\d+,\d+,\d+,\d+:\d+:[a-z]+$/;
const cache=new Map(),queue=[];let busy=false,halfMode=null; // url → {state:'wait'|'ready'|'failed',canvas,w,h,px,py,path}
// 모바일(PC급 아님)·성능 4단계 이하는 반 크기로 굽는다(화면에서는 원본의 1/4 쯤으로 보이므로 충분하다)
function half(){try{const T=window.__STORYWORLD_MOBILE_TIER_R1023__;if(T&&typeof T.pcGrade==='function'&&T.pcGrade()===false)return true;}catch(_){}
 try{const P=window.__STORYWORLD_PERF7_R1043__;if(P&&typeof P.step==='function'){const s=P.step();if(Number.isFinite(s)&&s<5)return true;}}catch(_){}return false;}
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function absolute(u){try{if(/^[a-z][a-z0-9+.-]*:/i.test(u))return u;return new URL(u,document.baseURI||window.location?.href).href;}catch(_){return u;}}
function bake(url,img,m){const row=cache.get(url);if(!row)return;const t0=Date.now();
 try{const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!(w>0)||!(h>0))throw Error('empty image');
  const sc=halfMode?.5:1,cw=Math.max(1,Math.round(w*sc)),ch=Math.max(1,Math.round(h*sc)),pad=Math.max(8,Math.round(PAD*sc));
  const tmp=makeCanvas(cw,ch),g=tmp.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,cw,ch);
  const data=g.getImageData(0,0,cw,ch).data;tmp.width=tmp.height=0;
  const r=inkify(data,cw,ch,{pad,seed:(m.kind==='awake'?100:0)+m.dir*7+1,unit:sc});if(!r||!r.solid)throw Error('nothing to paint');
  const out=makeCanvas(r.width,r.height),og=out.getContext('2d'),im=og.createImageData(r.width,r.height);im.data.set(r.data);og.putImageData(im,0,0);
  const path='r1097:ink:'+m.kind+'-'+m.dir+(halfMode?':h':'');out.__storyworldStaticSource={path};
  Object.assign(row,{state:'ready',canvas:out,w,h,px:pad*w/cw,py:pad*h/ch,path});stats.baked++;stats.bakeMs+=Date.now()-t0;}
 catch(e){row.state='failed';stats.failed++;if(e?.name!=='SecurityError')fail(e);}}
function pump(){if(busy||!queue.length)return;if(!active()){queue.length=0;for(const [u,r] of cache)if(r.state==='wait')cache.delete(u);return;}
 const {url,m}=queue.shift();busy=true;const next=()=>{busy=false;try{setTimeout(pump,40);}catch(_){}};
 try{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  img.onload=()=>{try{bake(url,img,m);}catch(e){fail(e);}next();};
  img.onerror=()=>{const r=cache.get(url);if(r&&r.state==='wait'){r.state='failed';stats.failed++;}next();};
  img.src=url;}catch(e){const r=cache.get(url);if(r){r.state='failed';stats.failed++;}fail(e);next();}}
function want(url,m,first){if(cache.has(url))return;cache.set(url,{state:'wait'});if(first)queue.unshift({url,m});else queue.push({url,m});}
// 한 방향을 보면 같은 묶음(base 또는 awake)의 여덟 방향을 차례로 미리 굽는다(방향을 틀 때 원본이 잠깐 보이지 않게)
function request(url,m){const h=half();if(halfMode!==h){halfMode=h;cache.clear();queue.length=0;}
 if(!cache.has(url)){want(url,m,true);for(let i=0;i<8;i++){if(i===m.dir)continue;want(url.replace(RX,(all)=>all.replace(/(base|awake)-[0-7](?=\.)/,m.kind+'-'+i)),{kind:m.kind,dir:i},false);}pump();}
 return cache.get(url);}
// ---------------- 명령 고르기·바꿔 끼우기 ----------------
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
function process(commands){if(!active()||!Array.isArray(commands))return 0;let n=0;
 for(let i=0;i<commands.length;i++){const c=commands[i];if(!c||typeof c!=='object'||c.kind!=='image'||c.r1097)continue;
  const o=c.owner;if(!o||o.kind!=='enemy'||o.groundAligned===true||o.r350)continue;
  const sp=c.sourcePath;if(typeof sp!=='string')continue;const k=R409.exec(sp),src=k?k[1]:sp,m=match(src);if(!m)continue;
  const s=c.style;if(!s||typeof s!=='object')continue;const op=s.globalCompositeOperation;if(op&&op!=='source-over')continue;
  const P=c.points,sr=c.sourceRect;if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||sr[0]!==0||sr[1]!==0)continue;
  let row;try{row=request(absolute(src),m);}catch(e){fail(e);continue;}
  if(!row||row.state!=='ready')continue;
  // 지금 명령의 그림 = 원본(w×h) 또는 R409 테두리판(사방 같은 여백). 그 밖의 크기면 손대지 않는다
  const cw=sr[2],ch=sr[3],rx=(cw-row.w)/2,ry=(ch-row.h)/2;if(!(cw>0)||!(ch>0)||rx<0||Math.abs(rx-ry)>1e-6)continue;
  const gx=row.px-rx,gy=row.py-ry,a=P[0],b=P[1],d=P[3],ux=(b[0]-a[0])/cw,uy=(b[1]-a[1])/cw,vx=(d[0]-a[0])/ch,vy=(d[1]-a[1])/ch;
  const Q=(q,t)=>[a[0]+ux*q+vx*t,a[1]+uy*q+vy*t],pts=[Q(-gx,-gy),Q(cw+gx,-gy),Q(cw+gx,ch+gy),Q(-gx,ch+gy)];if(!pts.every(okPt))continue;
  const cv=row.canvas;c.image=cv;c.mutable=false;c.sourcePath=row.path;c.immutableTint=cv.__storyworldStaticSource;c.sourceRect=[0,0,cv.width,cv.height];c.imageSize=[cv.width,cv.height];c.points=pts;
  // 수묵으로 그린 그림을 R1090 담묵 필터가 또 탈색하지 않게: 이미 붙었으면 그 조각만 떼고, 아직이면 표시해 건너뛰게 한다
  let F='saturate(.5) contrast(1.08)';try{const v=window.__STORYWORLD_INK_CHARS_R1090__?.FILTER;if(typeof v==='string'&&v)F=v;}catch(_){}
  if(typeof s.filter==='string'&&s.filter.endsWith(F)){const rest=s.filter.slice(0,-F.length).trim();c.style={...s,filter:rest||'none'};}
  c.r1090=true;c.r1097=true;n++;}
 stats.swapped+=n;return n;}
// ---------------- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, 한 render 에 한 번만) ----------------
let depth=0;
const wrapFn=fn=>{if(fn.__r1097)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;process(frame.commands);}}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1097=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function tick(){wrapInst();refresh();if(queue.length&&!busy)pump();}
try{setInterval(tick,500);}catch(e){fail(e);}tick();
// ---------------- 설정 창 줄: '전투 화면' 구역, 수묵 줄들(맵 수묵화풍·캐릭터 담묵·이펙트 수묵) 바로 뒤 ----------------
function label(){try{const b=document.getElementById('personaInkOnR1097');if(b)b.checked=on;}catch(e){fail(e);}}
function settingsRow(){try{const host=document.getElementById('combatScreenR1021')||document.getElementById('quickSettingsR114');if(!host)return;
  let row=document.getElementById('personaInkRowR1097');
  if(!row){row=document.createElement('div');row.id='personaInkRowR1097';row.className='r1021-row';
   const lab=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.id='personaInkOnR1097';
   const txt=document.createElement('span');txt.textContent=' 페르소나 수묵 그림 ';
   const note=document.createElement('p');note.className='small muted';note.textContent='페르소나 보스를 먹과 언주색으로 그린 수묵화로 보여 줍니다. 맵 수묵화풍이 켜져 있을 때만 작동합니다.';
   box.onchange=()=>{set(!!box.checked);};
   lab.appendChild(box);lab.appendChild(txt);row.appendChild(lab);row.appendChild(note);stats.rows++;}
  let anchor=null;for(const id of ['inkRowR1055','inkCharsRowR1090','inkFxRowR1095']){const e=document.getElementById(id);if(e&&e.parentNode===host)anchor=e;}
  if(anchor){if(anchor.nextElementSibling!==row){const next=anchor.nextElementSibling;if(next&&next!==row)host.insertBefore(row,next);else host.appendChild(row);}}
  else if(row.parentNode!==host)host.appendChild(row);
  label();}catch(e){fail(e);}}
function settingsLater(){settingsRow();try{queueMicrotask(settingsRow);}catch(_){}try{requestAnimationFrame(()=>{settingsRow();requestAnimationFrame(settingsRow);});}catch(_){}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsLater();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_PERSONA_INK_R1097__=Object.freeze({revision:REV,storageKey:KEY,palette:HEX,inkify,match,process,active,refresh,enabled:()=>on,set,settingsRow,
 inspect:()=>{let ready=0,failed=0;for(const r of cache.values()){if(r.state==='ready')ready++;else if(r.state==='failed')failed++;}
  return {revision:REV,on,inkLive,active:active(),half:halfMode,frames:stats.frames,swapped:stats.swapped,cached:cache.size,ready,failed,queued:queue.length,baked:stats.baked,bakeMs:stats.bakeMs,errors:stats.errors,rows:stats.rows,lastError};}});
})();
