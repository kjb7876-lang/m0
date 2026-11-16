// R1099 — 히든 영웅 EGO 수묵 그림. 사용자 2026-11-16 03:45Z "히든영웅에고 극한으로 이미지개선은? 코드만으로 수묵화개선" + 03:46Z "하면서 이미지 품질자체를 개선해줘".
//  EGO 고유색은 언주색(연지·주홍) + 먹 + 흰색(사용자 2026-11-16 지정). 페르소나 수묵(R1097, persona-ink-r1097.js)과 같은 구조를 EGO 3D 동작 시트(R1048)에 쓴다.
//  · 새 그림 파일은 없다. R1048 이 그리는 EGO 몸 시트(assets/r1048/ego/<동작>-<방향>.webp, 160칸)를 실행 중에 한 장씩 수묵화로 구워(캐시) 몸 그림 명령의 그림만 바꿔 끼운다.
//  · 품질 자체 개선: PC급에서는 원본을 1.5배로 고품질 확대한 뒤 밝기 언샤프(윤곽 되살리기)를 걸고 그 해상도로 그린다 → 고해상도 화면에서 뭉개지던 몸이 또렷하다.
//    시트 전체에서 쓰인 영역만 잘라 굽고(빈 칸 버림), 먹 농담 기준은 시트 전체로 한 번 정해 칸마다 깜빡이지 않는다.
//  · 수묵 변환(inkSheet → 칸마다 inkCell, 순수 계산):
//     ① 먹 농담 — 무채색(옷·갑주)은 먹(#12161c)과 종이(#f3eee2) 사이 농묵·중묵·담묵·여백 네 단, 단 사이는 물 고인 경계
//     ② 세로 농담 — 머리·어깨는 짙고 옷자락으로 갈수록 먹이 빠진다(발끝은 다시 눌러 선다) ③ 갈필(비백) ④ 한지 결
//     ⑤ 언주색 — 붉은 머리칼·붉은 장식만 물감: 짙은 언주 → 언주 → 주홍 → 옅은 빛(R1095·R1096·R1097 과 같은 값)
//        금빛 장식은 언주가 밴 흰빛(종이에 주홍 물이 스민 색)으로, 흰 머리칼은 종이 흰색으로 남긴다(EGO 는 언주+먹+흰 세 가지뿐)
//     ⑥ 윤곽 붓선 — 굵기가 변하고(오른쪽 아래가 굵다) 군데군데 끊기는 먹선. 붉은 머리칼은 몰골(선 없이 물감만)
//     ⑦ 바깥 — 어두운 먹 바탕에서 묻히지 않게 안개 같은 종이빛 여백(R409 테두리를 대신한다) + 발밑 먹 번짐
//  · 하는 법: 렌더러가 받는 프레임 명령 가운데 EGO 몸 그림(owner hero, 경로 assets/r1048/ego/ — R1048 섞어 넘기기·잔상 칸 포함)만 고른다.
//    R409 가 먼저 구운 테두리 캔버스(열쇠 r409:outline:hero:u:<주소>:sx,sy,sw,sh:…)든 원본이든 같은 칸을 찾아 바꾼다. 준비 전·받기 실패면 원본 그대로.
//    피격 번쩍임 같은 기존 필터는 남고, R1090 담묵 필터는 겹치지 않게 뗀다. 광륜·깃·검 궤적 이펙트(r1048/fx)는 건드리지 않는다(R1095 몫).
//  · 성능: 시트 한 장을 칸 단위로 나눠 프레임 사이에 굽는다(한 번에 약 6ms). 대기·걷기부터, 지금 방향부터. 모바일(PC급 아님)·성능 4단계 이하는 1배, 캐시 화소 상한.
//  · 맵 수묵화풍(R1055)이 꺼졌거나 쉬는 성능 단계(k=0)면 같이 쉰다. 설정 창 '전투 화면' 구역의 'EGO 수묵 그림' 체크로 따로 끌 수 있다(저장 storyworld.r1099.egoInk = '0' 이면 끔).
//  판정·피해·AI·저장·서사·이펙트·탄·동작 선택은 바꾸지 않는다(EGO 몸 그림만).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_INK_R1099__)return;
const REV='R1099-ego-ink-1',KEY='storyworld.r1099.egoInk';
const HEX=Object.freeze({deep:'#460e0a',yeonji:'#841e16',juhong:'#cc3428',pale:'#ffb08c',ink:'#12161c',white:'#f3eee2'});
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const PAL={ink:rgb(HEX.ink),paper:rgb(HEX.white),deep:rgb(HEX.deep),yeonji:rgb(HEX.yeonji),juhong:rgb(HEX.juhong),pale:rgb(HEX.pale)};
const stats={frames:0,swapped:0,baked:0,cells:0,failed:0,errors:0,rows:0,bakeMs:0,evicted:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const fin=(v,d)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a||1e-6),0,1);return t*t*(3-2*t);};
function hash2(x,y,s){let n=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967295;}
function vnoise(x,y,s){const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash2(x0,y0,s),b=hash2(x0+1,y0,s),c=hash2(x0,y0+1,s),d=hash2(x0+1,y0+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function soften(src,W,H,r){if(r<1)return src;const tmp=new Float32Array(W*H),out=new Float32Array(W*H),k=2*r+1;
 for(let y=0;y<H;y++){let acc=0;const o=y*W;for(let x=-r;x<=r;x++)acc+=src[o+clamp(x,0,W-1)];for(let x=0;x<W;x++){tmp[o+x]=acc/k;acc+=src[o+clamp(x+r+1,0,W-1)]-src[o+clamp(x-r,0,W-1)];}}
 for(let x=0;x<W;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=tmp[clamp(y,0,H-1)*W+x];for(let y=0;y<H;y++){out[y*W+x]=acc/k;acc+=tmp[clamp(y+r+1,0,H-1)*W+x]-tmp[clamp(y-r,0,H-1)*W+x];}}
 return out;}
function chamfer(on,W,H,cap){const d=new Float32Array(W*H),B=cap+2;for(let i=0;i<d.length;i++)d[i]=on[i]?0:B;const a=1,b=1.4142;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let v=d[i];if(!v)continue;if(x>0&&d[i-1]+a<v)v=d[i-1]+a;if(y>0){if(d[i-W]+a<v)v=d[i-W]+a;if(x>0&&d[i-W-1]+b<v)v=d[i-W-1]+b;if(x<W-1&&d[i-W+1]+b<v)v=d[i-W+1]+b;}d[i]=v;}
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let v=d[i];if(!v)continue;if(x<W-1&&d[i+1]+a<v)v=d[i+1]+a;if(y<H-1){if(d[i+W]+a<v)v=d[i+W]+a;if(x<W-1&&d[i+W+1]+b<v)v=d[i+W+1]+b;if(x>0&&d[i+W-1]+b<v)v=d[i+W-1]+b;}d[i]=v;}
 return d;}
function percentile(hist,total,q){let acc=0;const want=total*q;for(let i=0;i<hist.length;i++){acc+=hist[i];if(acc>=want)return i/(hist.length-1);}return 1;}
// 화소 하나의 성질: 밝기 L, 붉음 R(언주로 칠할 곳), 금빛 Y(언주가 밴 흰빛으로), 가장 밝은 채널 V
function feel(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),gb=Math.max(g,b);
 const red=sstep(.12,.36,(r-gb)/(r+.02))*sstep(.16,.34,r)*(1-sstep(.55,.85,g/(r+.02))); // 붉음(주황·금은 g 가 커서 빠진다)
 const gold=(1-red)*sstep(.10,.30,(r-b)/(r+.02))*sstep(.45,.70,g/(r+.02))*sstep(.25,.5,mx)*sstep(.06,.16,mx-mn);
 return {L:.299*r+.587*g+.114*b,R:red,Y:gold,V:mx};}
// 시트 전체 먹 농담 기준(칸마다 따로 정하면 동작 중 농담이 깜빡인다): 붉지 않은 몸 화소 밝기 분포의 55·85·95%
function levelsOf(src,w,h){const hist=new Uint32Array(256);let cnt=0;
 if(src&&src.length>=w*h*4)for(let i=0,n=w*h;i<n;i++){const s=i*4;if(src[s+3]<102)continue;const f=feel(src[s]/255,src[s+1]/255,src[s+2]/255);if(f.R>=.35||f.Y>=.5)continue;hist[clamp(Math.round(f.L*255),0,255)]++;cnt++;}
 const q=p=>cnt?percentile(hist,cnt,p):p;const p1=q(.6),p2=Math.max(q(.86),p1+.03),p3=Math.max(q(.95),p2+.06,.30),p4=Math.max(p3+.14,.52);return [p1,p2,p3,p4];}
const LEV=[.98,.9,.52,.04];
// 붓·종이 결 무늬(칸 좌표 기준이라 같은 시트의 모든 칸이 같다 → 시트마다 한 번만 만든다)
// 격자 값 무늬(vnoise 와 같은 값)를 격자점 해시를 한 번씩만 구해 채운다
function field(w,h,sx,sy,seed){const out=new Float32Array(w*h),gw=Math.floor((w-1)/sx)+2,gh=Math.floor((h-1)/sy)+2,g=new Float32Array(gw*gh);
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)g[j*gw+i]=hash2(i,j,seed);
 for(let y=0;y<h;y++){const Y=y/sy,y0=Math.floor(Y),fy=Y-y0,v=fy*fy*(3-2*fy),r0=y0*gw,r1=r0+gw;
  for(let x=0;x<w;x++){const X=x/sx,x0=Math.floor(X),fx=X-x0,u=fx*fx*(3-2*fx),a=g[r0+x0],b=g[r0+x0+1],c=g[r1+x0],d=g[r1+x0+1];out[y*w+x]=a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}}
 return out;}
function noiseOf(w,h,seed,U){const N=w*h,z={w,h,seed,U,low:field(w,h,21*U,21*U,seed+11),fine:new Float32Array(N),mid:field(w,h,6*U,6*U,seed+23),fib:field(w,h,4.5*U,4.5*U,seed+31),
 dry:field(w,h,4*U,34*U,seed+41),gap:field(w,h,15*U,15*U,seed+53),mist:field(w,h,30*U,30*U,seed+61)};const f2=field(w,h,30*U,30*U,seed+33);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;z.fine[i]=hash2(x,y,seed+5);z.fib[i]=z.fib[i]*.5+f2[i]*.5;}
 return z;} // 먹이 종이를 덮는 정도: 농묵·중묵·담묵·여백
// 품질: 밝기 언샤프(색은 그대로, 밝기 차이만 키운다). amount 0 이면 그대로
function sharpen(src,w,h,amount,r){if(!(amount>0))return src;const N=w*h,L=new Float32Array(N);for(let i=0;i<N;i++){const s=i*4;L[i]=(.299*src[s]+.587*src[s+1]+.114*src[s+2])*(src[s+3]/255);}
 const B=soften(L,w,h,Math.max(1,r|0)),A=new Float32Array(N);for(let i=0;i<N;i++)A[i]=src[i*4+3]/255;const BA=soften(A,w,h,Math.max(1,r|0));
 const out=new Uint8ClampedArray(src.length);for(let i=0;i<N;i++){const s=i*4,a=A[i];out[s+3]=src[s+3];if(!(a>0))continue;
  const base=BA[i]>.02?B[i]/BA[i]:L[i]/(a||1),cur=L[i]/(a||1),d=clamp((cur-base)*amount,-60,60);for(let k=0;k<3;k++)out[s+k]=clamp(src[s+k]+d,0,255);}
 return out;}
// 칸 하나(w×h RGBA) → 수묵 칸(같은 크기). opt: seed·unit(길이 배율)·halo(바깥 여백 화소)·levels·strength
function inkCell(src,w,h,opt){opt=opt||{};
 if(!src||!Number.isFinite(w)||!Number.isFinite(h))return null;w=Math.floor(w);h=Math.floor(h);if(!(w>0)||!(h>0)||!(src.length>=w*h*4))return null;
 const N=w*h,seed=Math.floor(fin(opt.seed,1))|0,U=clamp(fin(opt.unit,1),.25,3),S=clamp(fin(opt.strength,1),0,2),HR=clamp(fin(opt.halo,9*U),0,64);
 const lv=Array.isArray(opt.levels)&&opt.levels.length===4&&opt.levels.every(Number.isFinite)?opt.levels:levelsOf(src,w,h);const [p1,p2,p3,p4]=lv;
 const z=opt.noise&&opt.noise.w===w&&opt.noise.h===h&&opt.noise.seed===seed&&opt.noise.U===U?opt.noise:noiseOf(w,h,seed,U);
 const A=new Float32Array(N),L=new Float32Array(N),R=new Float32Array(N),Yg=new Float32Array(N),V=new Float32Array(N);let minY=h,maxY=-1,solid=0;
 for(let i=0;i<N;i++){const s=i*4,a=src[s+3]/255;if(!(a>0))continue;const f=feel(src[s]/255,src[s+1]/255,src[s+2]/255);A[i]=a;L[i]=f.L;R[i]=f.R;Yg[i]=f.Y;V[i]=f.V;
  if(a>.4){solid++;const y=(i/w)|0;if(y<minY)minY=y;if(y>maxY)maxY=y;}}
 const out=new Uint8ClampedArray(N*4);if(!solid)return {data:out,width:w,height:h,solid:0};
 const mask=new Uint8Array(N),inv=new Uint8Array(N);for(let i=0;i<N;i++){mask[i]=A[i]>.4?1:0;inv[i]=mask[i]?0:1;}
 const dOut=chamfer(mask,w,h,Math.ceil(HR)+2),dIn=chamfer(inv,w,h,Math.ceil(10*U));
 const LA=new Float32Array(N);for(let i=0;i<N;i++)LA[i]=L[i]*A[i];
 const rw=Math.max(1,Math.round(1.6*U)),bA=soften(A,w,h,rw),bL=soften(LA,w,h,rw),sA=soften(A,w,h,1),sL=soften(LA,w,h,1),bR=soften(R,w,h,1);
 const Lw=new Float32Array(N),Ls=new Float32Array(N);for(let i=0;i<N;i++){Lw[i]=bA[i]>.02?bL[i]/bA[i]:0;Ls[i]=sA[i]>.02?sL[i]/sA[i]:0;}
 const toneOf=l=>l<=p1?.5*l/(p1||1e-6):l<=p2?.5+(l-p1)/(p2-p1||1e-6):l<=p3?1.5+(l-p2)/(p3-p2||1e-6)*.8:2.3+clamp((l-p3)/(p4-p3||1e-6),0,1)*.7;
 const G=new Float32Array(N),gh=new Uint32Array(256);let gc=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!mask[i])continue;
  const gx=Ls[i-w+1]+2*Ls[i+1]+Ls[i+w+1]-Ls[i-w-1]-2*Ls[i-1]-Ls[i+w-1],gy=Ls[i+w-1]+2*Ls[i+w]+Ls[i+w+1]-Ls[i-w-1]-2*Ls[i-w]-Ls[i-w+1];
  const m=Math.sqrt(gx*gx+gy*gy);G[i]=m;gh[clamp(Math.round(m*255),0,255)]++;gc++;}
 const gT=Math.max(.07,gc?percentile(gh,gc,.84):.07),gT2=gT*1.8;
 const figH=Math.max(1,maxY-minY),footY=maxY,ink=PAL.ink,paper=PAL.paper;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,o=i*4;let cr=0,cg=0,cb=0,ca=0;
  const nLow=z.low[i],nFine=z.fine[i];
  if(A[i]>.004){const nMid=z.mid[i],fib=z.fib[i],vy=clamp((y-minY)/figH,0,1);
   // ① 먹 농담
   const lm=Lw[i]+(Ls[i]-Lw[i])*sstep(.18,.36,Ls[i]);let t=clamp(Math.max(toneOf(lm),3*sstep(.62,.86,lm))+(nLow-.5)*.28,0,3); /* 아주 밝은 곳(얼굴·흰 머리칼)은 시트 분포와 상관없이 종이로 */const k=Math.floor(t),f=sstep(.3,.7,t-k);
   let cov=LEV[Math.min(3,k)]+(LEV[Math.min(3,k+1)]-LEV[Math.min(3,k)])*f;if(f>0&&f<1)cov+=.05*(1-Math.abs(2*f-1));
   // ② 세로 농담
   const fall=1-.24*sstep(.35,.82,vy)*(1-.85*sstep(.88,.97,vy))*(.75+.5*nLow);if(cov>.2)cov=.2+(cov-.2)*fall;
   // ③ 갈필 ④ 한지 결
   const dry=sstep(.76,.9,z.dry[i])*sstep(.4,1,vy)*(cov>.4?1:.3);if(dry>0)cov-=dry*.5*S;
   cov=clamp(cov*(1-.06*fib-.03*nFine),0,1);
   cr=paper[0]+(ink[0]-paper[0])*cov;cg=paper[1]+(ink[1]-paper[1])*cov;cb=paper[2]+(ink[2]-paper[2])*cov;
   // 안쪽 먹선(밝은 얼굴·흰 머리칼 위에서는 가늘게)
   const gl=sstep(gT,gT2,G[i])*(.55+.45*nMid)*.9*(1-.5*sstep(.4,.65,Ls[i]));if(gl>.02){cr+=(ink[0]-cr)*gl;cg+=(ink[1]-cg)*gl;cb+=(ink[2]-cb)*gl;}
   // ⑤ 금빛 장식 → 언주가 밴 흰빛(옅은 빛과 종이 사이)
   const yk=Yg[i];if(yk>.02){const m=.35+.4*clamp(V[i],0,1),gr=[paper[0]+(PAL.pale[0]-paper[0])*m,paper[1]+(PAL.pale[1]-paper[1])*m,paper[2]+(PAL.pale[2]-paper[2])*m],kk=yk*.92;
    cr+=(gr[0]-cr)*kk;cg+=(gr[1]-cg)*kk;cb+=(gr[2]-cb)*kk;}
   // ⑤ 언주색
   const rk=clamp(Math.max(R[i],bR[i]*1.15),0,1);
   if(rk>.02){const v=clamp(V[i]+(nMid-.5)*.12,0,1);let a,b,m;
    if(v<.28){a=PAL.deep;b=PAL.yeonji;m=sstep(.10,.28,v);}else if(v<.72){a=PAL.yeonji;b=PAL.juhong;m=sstep(.28,.56,v);}else{a=PAL.juhong;b=PAL.pale;m=sstep(.80,1,v)*.7;}
    const wash=1-.07*fib-.035*nFine;cr+=((a[0]+(b[0]-a[0])*m)*wash-cr)*rk;cg+=((a[1]+(b[1]-a[1])*m)*wash-cg)*rk;cb+=((a[2]+(b[2]-a[2])*m)*wash-cb)*rk;}
   ca=A[i];
   // ⑥ 윤곽 붓선
   if(mask[i]){const dx=dIn[Math.min(N-1,i+1)]-dIn[Math.max(0,i-1)],dy=dIn[Math.min(N-1,i+w)]-dIn[Math.max(0,i-w)],len=Math.hypot(dx,dy)||1;
    const dir=clamp(-(dx*.55+dy*.83)/len,-1,1),th=(.8+1.1*nLow+1.2*Math.max(0,dir))*S*U,gap=sstep(.12,.28,z.gap[i]);
    const lk=(1-sstep(th-.8*U,th+.4*U,dIn[i]))*gap*(1-rk*.85)*(1-.45*sstep(.42,.68,Ls[i]))*.95;/* 흰 머리칼·흰빛 끝은 선을 거의 안 두른다(가는 가닥이 먹으로 뭉개지지 않게) */if(lk>.02){cr+=(ink[0]-cr)*lk;cg+=(ink[1]-cg)*lk;cb+=(ink[2]-cb)*lk;}}}
  // ⑦ 바깥: 종이빛 여백 + 발밑 먹 번짐. 칸 끝에서는 반드시 0(네모 판이 보이지 않게)
  if(A[i]<1&&HR>0&&dOut[i]>0&&dOut[i]<=HR){const d=dOut[i],u=1-d/HR,mist=z.mist[i],nMid=z.mid[i];
   const edge=Math.min(sstep(0,2,x),sstep(0,2,w-1-x),sstep(0,2,y),sstep(0,2,h-1-y));
   let ba=.8*Math.pow(u,1.2)*sstep(.15,.65,mist*.8+nLow*.25+u*.3)*(.9+.1*nFine)*edge;
   ba=Math.max(ba,.92*(1-sstep(1.6*U,3.6*U,d))*(.8+.2*nMid)*edge); /* 몸에 바짝 붙은 종이빛 테(어두운 바닥에서 형상을 읽히게 — R409 테두리 몫) */
   const ak=.5*(1-sstep(0,5*U,d))*(.6+.4*nMid),jh=PAL.juhong;let br=paper[0]+(jh[0]-paper[0])*ak,bg=paper[1]+(jh[1]-paper[1])*ak,bb=paper[2]+(jh[2]-paper[2])*ak;ba=Math.min(1,ba*(1+.8*ak));
   if(y>footY-figH*.12){const hk=sstep(footY-figH*.12,footY,y);let bl=.55*Math.exp(-d/((2.5+4*nLow)*U))*sstep(.32,.62,nMid+hk*.25)*hk*edge;
    if(bl>.02){const na=bl+ba*(1-bl);br=(ink[0]*bl+br*ba*(1-bl))/na;bg=(ink[1]*bl+bg*ba*(1-bl))/na;bb=(ink[2]*bl+bb*ba*(1-bl))/na;ba=na;}}
   const na=ca+ba*(1-ca);if(na>0){cr=(cr*ca+br*ba*(1-ca))/na;cg=(cg*ca+bg*ba*(1-ca))/na;cb=(cb*ca+bb*ba*(1-ca))/na;}ca=na;}
  out[o]=cr;out[o+1]=cg;out[o+2]=cb;out[o+3]=ca*255;} // Uint8ClampedArray: NaN→0, ±Infinity→0/255 로 묶인다
 return {data:out,width:w,height:h,solid};}
// 시트(W×H, 칸 cell 정사각형이 가로로 n 개)에서 쓰인 영역(모든 칸 합집합 + 여백)을 칸 좌표로: [x0,y0,x1,y1)
function usedBox(src,W,H,cell,margin){const n=Math.max(1,Math.floor(W/cell));let x0=cell,y0=cell,x1=-1,y1=-1;
 for(let y=0;y<Math.min(H,cell);y++)for(let f=0;f<n;f++)for(let x=0;x<cell;x++){if(src[(y*W+f*cell+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
 if(x1<0)return null;const m=Math.max(0,margin|0);return [Math.max(0,x0-m),Math.max(0,y0-m),Math.min(cell,x1+1+m),Math.min(cell,y1+1+m)];}
// 시트 통째(순수 계산, 시험·도구용). 게임은 bakeJob 이 같은 일을 칸마다 나눠 한다
function inkSheet(src,W,H,cell,opt){opt=opt||{};if(!src||!(W>0)||!(H>0)||!(cell>0)||src.length<W*H*4)return null;const n=Math.max(1,Math.floor(W/cell)),U=clamp(fin(opt.unit,1),.25,3);
 const box=usedBox(src,W,H,cell,Math.ceil(11*U));if(!box)return null;const [x0,y0,x1,y1]=box,bw=x1-x0,bh=y1-y0,levels=levelsOf(src,W,H),out=new Uint8ClampedArray(bw*n*bh*4),noise=noiseOf(bw,bh,Math.floor(fin(opt.seed,1))|0,U);
 for(let f=0;f<n;f++){const c=new Uint8ClampedArray(bw*bh*4);for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const s=((y+y0)*W+f*cell+x+x0)*4,d=(y*bw+x)*4;for(let k=0;k<4;k++)c[d+k]=src[s+k];}
  const r=inkCell(c,bw,bh,{...opt,levels,noise});if(!r)continue;for(let y=0;y<bh;y++)out.set(r.data.subarray(y*bw*4,(y+1)*bw*4),(y*bw*n+f*bw)*4);}
 return {data:out,width:bw*n,height:bh,box,frames:n,levels};}
// ---------------- 켜고 끄기 ----------------
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
let inkLive=false;
function refresh(){let live=false;try{const M=window.__STORYWORLD_INK_WASH_R1055__;if(M&&typeof M.inspect==='function'){const i=M.inspect();live=!!i&&i.prefs?.mode!=='off'&&Number.isFinite(i.k)&&i.k>.5;}}catch(_){live=false;}inkLive=live;return live;}
const active=()=>on&&inkLive;
function set(v){if(typeof v!=='boolean')return on;on=v;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}label();return on;}
// ---------------- 시트 찾기 ----------------
const CLIPS=['idle','walk','run','attack','hit','discard'],DIRS=['s','se','e','ne','n','nw','w','sw'];
const RX=/(?:^|[\/:])assets\/r1048\/ego\/(idle|walk|run|attack|hit|discard)-(s|se|e|ne|n|nw|w|sw)\.(webp|png)(?:[?#][^:]*)?$/;
function match(v){if(typeof v!=='string'||!v)return null;const m=RX.exec(v);return m?{clip:m[1],dir:m[2]}:null;}
const R409=/^r409:outline:hero:u:(.+?):(\d+),(\d+),(\d+),(\d+):\d+(?::.*)?$/;
const sheetsMeta=()=>{const s=window.__STORYWORLD_EGO_MOTION_R1048_SHEETS__;return s&&Number.isFinite(+s.cell)&&+s.cell>0?s:null;};
// ---------------- 굽기·캐시 ----------------
const cache=new Map(),queue=[];let job=null,scaleMode=null,cachePx=0;
function pcScale(){try{const T=window.__STORYWORLD_MOBILE_TIER_R1023__;if(T&&typeof T.pcGrade==='function'&&T.pcGrade()===false)return 1;}catch(_){}
 try{const P=window.__STORYWORLD_PERF7_R1043__;if(P&&typeof P.step==='function'){const s=P.step();if(Number.isFinite(s)&&s<5)return 1;}}catch(_){}return 1.5;}
const capPx=()=>scaleMode>1?26e6:12e6;
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function absolute(u){try{if(/^[a-z][a-z0-9+.-]*:/i.test(u))return u;return new URL(u,document.baseURI||window.location?.href).href;}catch(_){return u;}}
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
function evict(keep){while(cachePx>capPx()&&cache.size>1){let k=null;for(const [u,r] of cache){if(u===keep||r.state!=='ready')continue;if(!k||r.used<cache.get(k).used)k=u;}if(!k)break;const r=cache.get(k);cachePx-=r.px||0;cache.delete(k);stats.evicted++;}}
// 한 장 굽기를 칸 단위로 나눈다: 읽기 → (칸마다) 확대·언샤프·수묵 → 다 되면 한 캔버스로
function startJob(url,m){const row=cache.get(url);if(!row)return;job={url,m,row,img:null,step:0};
 try{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  img.onload=()=>{if(job&&job.url===url){job.img=img;later(work);}};
  img.onerror=()=>{if(row.state==='wait'){row.state='failed';stats.failed++;}if(job&&job.url===url)job=null;later(pump);};img.src=url;}
 catch(e){row.state='failed';stats.failed++;fail(e);job=null;}}
function prepare(J){const img=J.img,W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,meta=sheetsMeta(),cell=+(meta?.cell)||H;if(!(W>0)||!(H>0)||!(cell>0))throw Error('empty image');
 const t=makeCanvas(W,H),g=t.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const src=g.getImageData(0,0,W,H).data;t.width=t.height=0;
 const sc=scaleMode,box=usedBox(src,W,H,cell,Math.ceil(11));if(!box)throw Error('nothing to paint');const [x0,y0,x1,y1]=box,bw=x1-x0,bh=y1-y0,ow=Math.max(1,Math.round(bw*sc)),oh=Math.max(1,Math.round(bh*sc)),n=Math.max(1,Math.floor(W/cell));
 Object.assign(J,{W,H,cell,src,box,bw,bh,ow,oh,n,sc,levels:levelsOf(src,W,H),out:makeCanvas(ow*n,oh),f:0,seed:DIRS.indexOf(J.m.dir)*7+CLIPS.indexOf(J.m.clip)*131+1});J.noise=noiseOf(ow,oh,J.seed,sc);}
function bakeCell(J){const f=J.f,[x0,y0]=J.box,tmp=makeCanvas(J.ow,J.oh),g=tmp.getContext('2d',{willReadFrequently:true});
 try{g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';}catch(_){}
 g.drawImage(J.img,f*J.cell+x0,y0,J.bw,J.bh,0,0,J.ow,J.oh);let px=g.getImageData(0,0,J.ow,J.oh).data;
 if(J.sc>1)px=sharpen(px,J.ow,J.oh,.55,Math.round(J.sc));
 const r=inkCell(px,J.ow,J.oh,{seed:J.seed,unit:J.sc,levels:J.levels,noise:J.noise});
 if(r&&r.solid){const im=g.createImageData(J.ow,J.oh);im.data.set(r.data);g.putImageData(im,0,0);J.out.getContext('2d').drawImage(tmp,f*J.ow,0);}
 tmp.width=tmp.height=0;stats.cells++;}
function work(){const J=job;if(!J)return;const t0=now();
 try{if(!active()){J.row.state='wait';J.step=0;J.f=0;J.src=null;J.noise=null;queue.unshift({url:J.url,m:J.m});job=null;return;}
  if(J.step===0){prepare(J);J.step=1;}
  while(J.f<J.n&&now()-t0<6){bakeCell(J);J.f++;}
  if(J.f>=J.n){const cv=J.out,path='r1099:ink:'+J.m.clip+'-'+J.m.dir+(J.sc>1?':x'+J.sc:'');cv.__storyworldStaticSource={path};
   Object.assign(J.row,{state:'ready',canvas:cv,cell:J.cell,box:J.box,ow:J.ow,oh:J.oh,frames:J.n,path,px:cv.width*cv.height,used:now()});J.src=null;J.noise=null;
   cachePx+=J.row.px;stats.baked++;stats.bakeMs+=now()-t0;job=null;evict(J.url);later(pump);return;}}
 catch(e){J.row.state='failed';stats.failed++;if(e?.name!=='SecurityError')fail(e);job=null;later(pump);return;}
 stats.bakeMs+=now()-t0;later(work);}
function later(f){try{setTimeout(f,16);}catch(_){}}
function pump(){if(job||!queue.length)return;if(!active())return; /* 쉬는 동안은 예약을 그대로 두고 멈춘다(다시 켜지면 tick 이 이어 굽는다) */
 const q=queue.shift();if(cache.get(q.url)?.state!=='wait')return later(pump);startJob(q.url,q.m);}
function want(url,m,first){if(cache.has(url))return;cache.set(url,{state:'wait',used:now()});const it={url,m};if(first)queue.unshift(it);else queue.push(it);}
// 하나를 보면 같은 방향의 모든 동작을 먼저, 그다음 같은 동작의 다른 방향을 예약한다(동작·방향을 바꿀 때 원본이 잠깐 비치지 않게)
function request(url,m){const s=pcScale();if(scaleMode!==s){scaleMode=s;cache.clear();queue.length=0;job=null;cachePx=0;}
 if(!cache.has(url)){want(url,m,true);const at=(c,d)=>url.replace(/(idle|walk|run|attack|hit|discard)-(s|se|e|ne|n|nw|w|sw)(?=\.(?:webp|png))/,c+'-'+d);
  for(const c of CLIPS)want(at(c,m.dir),{clip:c,dir:m.dir},false);for(const d of DIRS)want(at(m.clip,d),{clip:m.clip,dir:d},false);
  for(const c of CLIPS)for(const d of DIRS)want(at(c,d),{clip:c,dir:d},false);pump();}
 const r=cache.get(url);if(r)r.used=now();return r;}
// ---------------- 명령 고르기·바꿔 끼우기 ----------------
const LIFT='brightness(1.32) contrast(1.22)';
const okPt=p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
function process(commands){if(!active()||!Array.isArray(commands))return 0;let n=0;const meta=sheetsMeta();
 for(let i=0;i<commands.length;i++){const c=commands[i];if(!c||typeof c!=='object'||c.kind!=='image'||c.r1099)continue;
  const o=c.owner;if(!o||o.kind!=='hero'||o.r1048fx||o.groundAligned===true)continue;
  const sp=c.sourcePath;if(typeof sp!=='string')continue;
  const P=c.points,sr=c.sourceRect;if(!Array.isArray(P)||P.length!==4||!P.every(okPt)||!Array.isArray(sr)||sr.length<4||!sr.every(Number.isFinite))continue;
  let src=sp,fx,fy,fw,fh,pad=0;const k=R409.exec(sp);
  if(k){src=k[1];fx=+k[2];fy=+k[3];fw=+k[4];fh=+k[5];const cw=sr[2],ch=sr[3];pad=(cw-fw)/2;if(sr[0]!==0||sr[1]!==0||!(pad>=0)||Math.abs((ch-fh)/2-pad)>1e-6)continue;}
  else{[fx,fy,fw,fh]=sr;}
  const m=match(src);if(!m)continue;const s=c.style;if(!s||typeof s!=='object')continue;
  const op=s.globalCompositeOperation;if(op&&op!=='source-over'&&op!=='lighter')continue;
  const cell=+(meta?.cell)||fh;if(!(cell>0)||fw!==cell||fh!==cell||fy!==0||fx%cell!==0)continue;
  let row;try{row=request(absolute(src),m);}catch(e){fail(e);continue;}
  if(!row||row.state!=='ready'||row.cell!==cell)continue;const frame=fx/cell;if(!(frame>=0)||frame>=row.frames)continue;
  // 지금 명령의 네 귀퉁이 = 칸(cell×cell, R409 면 사방 pad 더) → 잘라 구운 영역(box)의 네 귀퉁이로
  const tot=cell+2*pad,a=P[0],b=P[1],d=P[3],ux=(b[0]-a[0])/tot,uy=(b[1]-a[1])/tot,vx=(d[0]-a[0])/tot,vy=(d[1]-a[1])/tot;
  const [x0,y0,x1,y1]=row.box,Q=(q,t)=>[a[0]+ux*(q+pad)+vx*(t+pad),a[1]+uy*(q+pad)+vy*(t+pad)],pts=[Q(x0,y0),Q(x1,y0),Q(x1,y1),Q(x0,y1)];if(!pts.every(okPt))continue;
  const cv=row.canvas;c.image=cv;c.mutable=false;c.sourcePath=row.path;c.immutableTint=cv.__storyworldStaticSource;c.sourceRect=[frame*row.ow,0,row.ow,row.oh];c.imageSize=[cv.width,cv.height];c.points=pts;
  let F='saturate(.5) contrast(1.08)';try{const v=window.__STORYWORLD_INK_CHARS_R1090__?.FILTER;if(typeof v==='string'&&v)F=v;}catch(_){}
  {let rest=typeof s.filter==='string'?s.filter.trim():'';if(rest==='none')rest='';if(rest.endsWith(F))rest=rest.slice(0,-F.length).trim();
   /* 결전장·밤 맵 조명이 곱해지면 종이 흰색도 바닥 밝기 근처로 눌린다 → 이 그림만 밝기·대비를 올려 먹은 검게, 종이는 희게 남긴다(렌더러가 받는 CSS 필터: brightness·contrast) */
   c.style={...s,filter:(rest?rest+' ':'')+LIFT};}
  if(!o.r409)c.owner={...o,r409:true}; // R409 가 아직이면 수묵 그림 위에 핏빛·은빛 테를 또 굽지 않게(종이빛 여백이 그 몫)
  c.r1090=true;c.r1099=true;n++;}
 stats.swapped+=n;return n;}
// ---------------- 렌더러 감싸기(프로토타입·인스턴스 둘 다, 한 render 에 한 번만) ----------------
let depth=0;
const wrapFn=fn=>{if(fn.__r1099)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands)){stats.frames++;process(frame.commands);}}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1099=true;
 for(const k of Object.keys(fn))try{w[k]=fn[k];}catch(_){}return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function tick(){wrapInst();refresh();if(queue.length&&!job)pump();}
try{setInterval(tick,500);}catch(e){fail(e);}tick();
// ---------------- 설정 창 줄: '전투 화면' 구역, 수묵 줄들 바로 뒤 ----------------
function label(){try{const b=document.getElementById('egoInkOnR1099');if(b)b.checked=on;}catch(e){fail(e);}}
function settingsRow(){try{const host=document.getElementById('combatScreenR1021')||document.getElementById('quickSettingsR114');if(!host)return;
  let row=document.getElementById('egoInkRowR1099');
  if(!row){row=document.createElement('div');row.id='egoInkRowR1099';row.className='r1021-row';
   const lab=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.id='egoInkOnR1099';
   const txt=document.createElement('span');txt.textContent=' EGO 수묵 그림 ';
   const note=document.createElement('p');note.className='small muted';note.textContent='히든 영웅 EGO 를 먹·언주색·흰빛의 수묵화로 또렷하게 보여 줍니다. 맵 수묵화풍이 켜져 있을 때만 작동합니다.';
   box.onchange=()=>{set(!!box.checked);};
   lab.appendChild(box);lab.appendChild(txt);row.appendChild(lab);row.appendChild(note);stats.rows++;}
  let anchor=null;for(const id of ['inkRowR1055','inkCharsRowR1090','inkFxRowR1095','personaInkRowR1097']){const e=document.getElementById(id);if(e&&e.parentNode===host)anchor=e;}
  if(anchor){if(anchor.nextElementSibling!==row){const next=anchor.nextElementSibling;if(next&&next!==row)host.insertBefore(row,next);else host.appendChild(row);}}
  else if(row.parentNode!==host)host.appendChild(row);
  label();}catch(e){fail(e);}}
function settingsLater(){settingsRow();try{queueMicrotask(settingsRow);}catch(_){}try{requestAnimationFrame(()=>{settingsRow();requestAnimationFrame(settingsRow);});}catch(_){}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsLater();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
window.__STORYWORLD_EGO_INK_R1099__=Object.freeze({revision:REV,storageKey:KEY,palette:HEX,inkCell,inkSheet,levelsOf,usedBox,sharpen,feel,match,process,active,refresh,enabled:()=>on,set,settingsRow,
 inspect:()=>{let ready=0,failed=0;for(const r of cache.values()){if(r.state==='ready')ready++;else if(r.state==='failed')failed++;}
  return {revision:REV,on,inkLive,active:active(),scale:scaleMode,frames:stats.frames,swapped:stats.swapped,cached:cache.size,ready,failed,queued:queue.length,baking:job?job.url.split('/').pop():null,baked:stats.baked,cells:stats.cells,bakeMs:Math.round(stats.bakeMs),cachePx,evicted:stats.evicted,errors:stats.errors,rows:stats.rows,lastError};}});
})();
