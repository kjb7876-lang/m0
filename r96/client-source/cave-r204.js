/* R204 유기적 동굴 지형 — 시범 지역: 거미동굴(dist01). 사용자 2026-11-01 "스토리월드 유기적 2.5D 맵 리마스터 … 기존 자산 최우선 …
 * 거미동굴 맵 하나부터 시범 적용 … 영상의 맵 같은 형식이 목표".
 *  보이는 것만 바꾼다. 충돌(exploration.walls·floorCells)·문·몹·보스·저장·카메라·캐릭터 크기는 그대로다.
 *  · 바닥 칸(floorCells)에서 부호 거리장을 만들고(칸당 4점) 부드럽게 한 뒤 고정 시드 노이즈를 ±0.28칸 섞는다.
 *    그 0 등고선이 동굴 경계다 — 직각·계단 외곽선이 생기지 않고, 실제 보행 칸 경계에서 0.4칸 넘게 벗어나지 않는다.
 *  · 바닥: 기존 질감 3종(r118 거미동굴 바닥·r118 검은 모래·r99 갈라진 암반)을 거리장 텍스처의 노이즈 채널로 섞어
 *    한 장의 지면 메시로 그린다(셰이더 혼합 — 큰 베이크 텍스처 없이 512px 질감 3장 + 320px 거리장 1장). 절벽 밑은 접촉 그림자.
 *  · 암반 대지: 같은 거리장으로 잘라낸 높이장 메시(칸당 1점). 카메라 쪽(남동) 대지는 낮게(0.45), 뒤쪽은 높게(1.6) — 통로를 가리지 않게.
 *    절벽면: 0 등고선(마칭 스퀘어)을 위로 세운 면. 질감은 r99 이끼 암벽면(오른쪽 반), 아래로 갈수록 어둡게.
 *  · 장식(고정 시드): 대지 가장자리의 종유석·바위 기둥(낮은 다각 원뿔, 암벽 질감), 바닥 데칼(기존 균열·뼈·뿌리 그림 + 직접 그린 거미줄·잔돌).
 *  · 영웅 앞을 가리는 대지·절벽·기둥은 영웅 둘레만 성글게 비춰 보인다(디더). 시야(횃불) 마스크는 엔진 attachSight24 로 그대로 붙인다.
 *  · 원래 벽판·벽 장식·바닥 청크는 숨기기만 한다(지우지 않음). storyworld.r204.cave {on:false} 로 원래 모습.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
if(!A||!C||window.__STORYWORLD_CAVE_R204__)return;
const REV='R204-cave-1',KEY='storyworld.r204.cave';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={blocks:0,builds:0,buildMs:0,hidden:0,segments:0,pillars:0,decals:0,frames:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// 지역별 설정. 확장할 때 여기에 한 줄씩 더한다.
const ZONES={
 // 거미동굴: 흙·암반 동굴, 종유석, 거미줄
 dist01:{seed:0x5d0124,tint:[1.0,.78,.55],hiTop:1.6,loTop:.45,bulge:1.35,widen:true,web:true,pillars:true,
  // R207 Drive 「첫 정원 → 거미동굴」 512 패치: 절벽 밑 흙·자갈·접지 그림자(바닥 평면), 뒤쪽 대지 가장자리 암벽 조각(세운 그림)
  patches:[['soil_rock_transition_01','base',.3,1/90,.5],['soil_rock_transition_02','base',.3,1/90,.5],['cliff_contact_shadow_01','base',.42,1/110,1]],
  uprights:[['cliff_straight_01',.36],['cliff_inner_join_01',.34],['cliff_outer_join_01',.34]],uprightRate:1/95},
 // 악마화 나무의 정원: 정원 돌길·이끼 흙·마른 풀, 이끼 낀 둔덕, 둔덕 위 마른 나무(r99 원화 12장). 거미줄 없음.
 dist00:{seed:0x5d0077,tint:[.86,.92,.76],hiTop:1.3,loTop:.4,bulge:1.35,widen:true,web:false,pillars:false,trees:'dead',
  tex:{floorA:['assets/r118/tiles/garden.webp',0],floorB:['assets/r99/outdoor/ground-moss.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]},
  patches:[['garden_root_paving_break_01','floor',.36,1/260,.8],['garden_soil_paving_transition_01','floor',.38,1/220,.8],['soil_rock_transition_02','base',.3,1/120,.5]],
  uprights:[['garden_low_border_01',.34]],uprightRate:1/110}};
const R=4,M=8;                       // 칸당 거리장 점 수, 맵 바깥 여백(칸)
const TEX={floorA:['assets/r118/tiles/cave.webp',0],floorB:['assets/r118/tiles/sandblack.webp',0],rock:['assets/r99/outdoor/ground-cliff.webp',0],
 face:['assets/r99/outdoor/ground-moss.webp',1],crack:['assets/r106/fx/crack.webp',-1],bones:['assets/r138/props/bones.webp',-1],root:['assets/r138/props/root.webp',-1]};
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';};

// ---- 결정적 난수·노이즈 -------------------------------------------------------------------------
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hash2(x,y,s){let h=(x*374761393+y*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const fbm=(x,y,s,o=4)=>{let t=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){t+=a*vnoise(x*f,y*f,s+i*101);n+=a;a*=.5;f*=2.03;}return t/n*2-1;};

// ---- 거리장 ------------------------------------------------------------------------------------
// 노드 (i,j) 의 월드 좌표 = ((i+.5)/R - M, (j+.5)/R - M) — 칸 경계에 걸치지 않는 점. 보행 칸 (cx,cy) 는 [cx,cx+1)×[cy,cy+1).
function field(ex,cfg,protect){
 const W=ex.bounds[2],H=ex.bounds[3],GW=(W+2*M)*R,GH=(H+2*M)*R,N=GW*GH;
 const walk=new Uint8Array((W+2*M)*(H+2*M)),CW=W+2*M;
 for(const c of ex.floorCells||[]){const x=(c.x??c[0])+M,y=(c.y??c[1])+M;if(x>=0&&y>=0&&x<CW&&y<H+2*M)walk[y*CW+x]=1;}
 const inside=new Uint8Array(N);
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)inside[j*GW+i]=walk[Math.floor(j/R)*CW+Math.floor(i/R)];
 // 바닥 칸 사이에 선 벽판(미로 칸막이 등)도 바위로 본다 — 원래 벽 그림을 숨기므로 보이지 않는 벽이 생기지 않게. 문 벽은 제외.
 for(const w of ex.walls||[]){const e=w.endpoints;if(!e||e.length!==2||/door/i.test(String(w.id||'')))continue;const [[x0,y0],[x1,y1]]=e,len=Math.hypot(x1-x0,y1-y0);if(!(len>0))continue;
  const ux=(x1-x0)/len,uy=(y1-y0)/len,minx=Math.min(x0,x1)-.4,maxx=Math.max(x0,x1)+.4,miny=Math.min(y0,y1)-.4,maxy=Math.max(y0,y1)+.4;
  for(let j=Math.max(0,Math.floor((miny+M)*R));j<=Math.min(GH-1,Math.ceil((maxy+M)*R));j++)for(let i=Math.max(0,Math.floor((minx+M)*R));i<=Math.min(GW-1,Math.ceil((maxx+M)*R));i++){
   const px=(i+.5)/R-M-x0,py=(j+.5)/R-M-y0,t=px*ux+py*uy;if(t<-.05||t>len+.05)continue;if(Math.abs(px*uy-py*ux)<.3)inside[j*GW+i]=0;}}
 // 두 방향 챔퍼 거리(점 단위) — 안쪽은 바깥까지, 바깥은 안쪽까지
 const INF=1e9,dIn=new Float32Array(N).fill(INF),dOut=new Float32Array(N).fill(INF);
 for(let k=0;k<N;k++){if(inside[k])dOut[k]=0;else dIn[k]=0;}
 const pass=d=>{const a=1,b=Math.SQRT2;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;let v=d[k];if(!v)continue;
   if(i>0)v=Math.min(v,d[k-1]+a);if(j>0){v=Math.min(v,d[k-GW]+a);if(i>0)v=Math.min(v,d[k-GW-1]+b);if(i<GW-1)v=Math.min(v,d[k-GW+1]+b);}d[k]=v;}
  for(let j=GH-1;j>=0;j--)for(let i=GW-1;i>=0;i--){const k=j*GW+i;let v=d[k];if(!v)continue;
   if(i<GW-1)v=Math.min(v,d[k+1]+a);if(j<GH-1){v=Math.min(v,d[k+GW]+a);if(i<GW-1)v=Math.min(v,d[k+GW+1]+b);if(i>0)v=Math.min(v,d[k+GW-1]+b);}d[k]=v;}};
 pass(dIn);pass(dOut);
 const raw=new Float32Array(N);for(let k=0;k<N;k++)raw[k]=(inside[k]?(dIn[k]-.5):-(dOut[k]-.5))/R;// 칸 단위 부호 거리(+ = 보행)
 const blur=src=>{const o=new Float32Array(N);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let s=0,n=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=GW||jj>=GH)continue;s+=src[jj*GW+ii];n++;}o[j*GW+i]=s/n;}return o;};
 const sm=blur(blur(blur(raw))),f=new Float32Array(N),s=cfg.seed,prot=protect||[];
 // 통로 반폭: 각 점에서 거리장 기울기(벽 → 안쪽) 방향으로 가운데선(값이 더 오르지 않는 곳)까지 걸어가 그 값을 쓴다.
 //  이웃 최댓값으로 재면 통로 입구에서 옆방 안쪽 값이 섞여 좁은 통로를 넓다고 보고 양쪽 절벽이 통로를 막을 수 있다.
 const hw=new Float32Array(N);const S=(x,y)=>{const i=Math.max(0,Math.min(GW-1,Math.round(x))),j=Math.max(0,Math.min(GH-1,Math.round(y)));return sm[j*GW+i];};
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;if(raw[k]<=0||raw[k]>cfg.bulge+1.4){hw[k]=raw[k]>0?9:0;continue;}let x=i,y=j,v=sm[k],best=raw[k];
  for(let t=0;t<28;t++){const gx=S(x+1,y)-S(x-1,y),gy=S(x,y+1)-S(x,y-1),gl=Math.hypot(gx,gy);if(gl<1e-4)break;const nx=x+gx/gl*.75,ny=y+gy/gl*.75,nv=S(nx,ny);if(nv<=v+1e-4)break;x=nx;y=ny;v=nv;best=Math.max(best,nv);}
  hw[k]=best;}
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,x=(i+.5)/R-M,y=(j+.5)/R-M;
  // 절벽 불룩: 벽에서 보행 쪽으로만(최대 cfg.bulge 칸). 통로는 2.3칸 이상 남기고, 지켜야 할 자리(입구·문·조형물·몹) 둘레 2.6칸은 건드리지 않는다.
  let allow=Math.min(cfg.bulge,Math.max(0,hw[k]-1.15));
  if(allow>0)for(const q of prot){const dd=Math.hypot(q[0]-x,q[1]-y)-q[2];if(dd<1){allow*=Math.max(0,dd);if(allow<=0)break;}}
  const n1=fbm(x*.2,y*.2,s,3)*.5+.5,n2=fbm(x*.62,y*.62,s+33,2)*.67;// 잔물결 ±0.2칸
  const bulge=allow*Math.min(1,Math.max(0,(n1-.2)/.42));
  f[k]=Math.min(sm[k]-bulge+.3*n2,raw[k]);}

 // 얇게 튀어나온 바위 두껍게(사용자 "뜬금없이 얇게 튀어나온 건 일정 두께 이상"): 바위 쪽으로 기울기를 따라 걸어 바위 한가운데 깊이(r)를 재고,
 //  r<THICK/2 이면 둘레를 (THICK/2-r)만큼 바닥 쪽으로 키운다 → 바위 두께가 THICK(1.4칸) 이상. 키운 자리는 이동 판정도 막는다(f<raw).
 {const TH=(cfg.thick??1.4)/2,g=f.slice(),SF=(x,y)=>{const i=Math.max(0,Math.min(GW-1,Math.round(x))),j=Math.max(0,Math.min(GH-1,Math.round(y)));return g[j*GW+i];};
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,v=g[k];if(v>TH+.15||v<-TH)continue;let x=i,y=j,cur=v,deep=-v;
   for(let t=0;t<16;t++){const gx=SF(x+1,y)-SF(x-1,y),gy=SF(x,y+1)-SF(x,y-1),gl=Math.hypot(gx,gy);if(gl<1e-4)break;const nx=x-gx/gl*.75,ny=y-gy/gl*.75,nv=SF(nx,ny);if(nv>=cur-1e-4)break;x=nx;y=ny;cur=nv;deep=Math.max(deep,-nv);}
   if(deep>0&&deep<TH){let add=(TH-deep)*Math.min(1,Math.max(0,(TH+.15-v)/(TH+.15)));
    if(v>0)add=Math.min(add,Math.max(0,hw[k]-1.15-(raw[k]-v)));// 바닥 쪽으로 키울 땐 통로 반폭 1.15칸(폭 2.3칸)은 남긴다
    f[k]=Math.min(f[k],v-add);}}}
 let mod=0;for(let k=0;k<N;k++)if(raw[k]>0&&raw[k]-f[k]>.3)mod++;
 return {W,H,GW,GH,f,raw,inside,walk,CW,G:blur(blur(blur(blur(f)))),bulgedCells:Math.round(mod/(R*R)),protect:prot.length};
}
const at=(F,a,x,y)=>{const gx=(x+M)*R-.5,gy=(y+M)*R-.5,i=Math.max(0,Math.min(F.GW-2,Math.floor(gx))),j=Math.max(0,Math.min(F.GH-2,Math.floor(gy))),u=Math.min(1,Math.max(0,gx-i)),v=Math.min(1,Math.max(0,gy-j)),k=j*F.GW+i;
 return a[k]*(1-u)*(1-v)+a[k+1]*u*(1-v)+a[k+F.GW]*(1-u)*v+a[k+F.GW+1]*u*v;};
function topHeight(F,cfg,x,y){const g=at(F,F.G,x,y),gx=at(F,F.G,x+.5,y)-at(F,F.G,x-.5,y),gy=at(F,F.G,x,y+.5)-at(F,F.G,x,y-.5),L=Math.hypot(gx,gy)||1;
 // 기울기는 보행 쪽을 가리킨다. 보행 쪽이 (-x,-y)(카메라에서 먼 쪽)이면 이 대지는 카메라와 통로 사이 → 낮게.
 const front=Math.max(0,(-gx-gy)/(L*Math.SQRT2)),deep=Math.min(1,Math.max(0,(-g-2.5)/2.5));
 const s=Math.max(1-Math.min(1,Math.max(0,(front-.15)/.55)),deep);
 // 윗선이 들쭉날쭉하게: 높이에 비례한 잔물결(대지 윗면과 절벽 윗선이 같은 함수를 써서 이어진다)
 let hh=cfg.loTop+(cfg.hiTop-cfg.loTop)*s;
 // 문 둘레: 문틀(약 2.6) 높이까지 절벽을 올려 문이 바위 사이에 박혀 보이게(1.6칸 안은 문틀 높이, 3.6칸까지 서서히)
 for(const d of F.doors||[]){const dd=Math.hypot(d[0]-x,d[1]-y);if(dd<3.6){const w=dd<1.6?1:1-(dd-1.6)/2;hh=Math.max(hh,hh+(2.55-hh)*w*w);}}
 return hh*(1+.22*fbm(x*1.7,y*1.7,cfg.seed+71,2))+.06*fbm(x*4.1,y*4.1,cfg.seed+5,1);}

// ---- 통로 넓히기(사용자 "모든 맵 통로 지금보다 2~3배 넓게" — 이 시범 지역부터) -----------------------------------
// 엔진 충돌은 floorCells(바닥 칸)와 얇은 벽 AABB(walls)뿐이다. 좁은 통로 칸 옆에 바닥 칸을 더하고, 양쪽이 다 바닥이 된 벽판을 빼서
// 새 레이아웃 객체로 바꿔 끼운다(엔진 충돌 색인은 레이아웃 객체마다 새로 만든다) → 충돌·길찾기·몹 배치가 모두 같은 바닥을 쓴다.
//  · 폭 4칸 이하 통로만, 반지름 1.5칸. 문 둘레 3.5칸·맵 가장자리 2칸은 넓히지 않는다(닫힌 문을 돌아가지 못하게).
//  · 다른 통로·방과 새로 이어지는 지름길은 만들지 않는다: 새 칸 둘레 2.3칸 안의 원래 바닥 칸이 모두, 넓히는 칸에서 원래 바닥으로 8걸음 안이어야 한다.
function widen(ex,cfg,doorPts){const W=ex.bounds[2],H=ex.bounds[3],key=(x,y)=>x+','+y,S=new Set((ex.floorCells||[]).map(c=>key(c[0],c[1])));
 const has=(x,y)=>S.has(key(x,y));const dist=new Map();// 칸 단위 체비쇼프 거리(바닥 안쪽 깊이)
 const q=[];for(const c of ex.floorCells){const [x,y]=c;let edge=false;for(let dy=-1;dy<=1&&!edge;dy++)for(let dx=-1;dx<=1;dx++)if(!has(x+dx,y+dy)){edge=true;break;}if(edge){dist.set(key(x,y),1);q.push([x,y]);}}
 for(let h=0;h<q.length;h++){const [x,y]=q[h],d=dist.get(key(x,y));for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=key(x+dx,y+dy);if(S.has(k)&&!dist.has(k)){dist.set(k,d+1);q.push([x+dx,y+dy]);}}}
 const hwOf=(x,y)=>{let m=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)m=Math.max(m,dist.get(key(x+dx,y+dy))||0);return m;};
 const nearDoor=(x,y)=>doorPts.some(p=>Math.hypot(p[0]-x-.5,p[1]-y-.5)<(p[2]||3.5));// 문 폭의 절반 + 3칸(넓은 문 끝을 돌아가는 길이 생기지 않게)
 const reach=(sx,sy,lim)=>{const seen=new Map([[key(sx,sy),0]]),qq=[[sx,sy]];for(let h=0;h<qq.length;h++){const [x,y]=qq[h],d=seen.get(key(x,y));if(d>=lim)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(S.has(k)&&!seen.has(k)){seen.set(k,d+1);qq.push([x+dx,y+dy]);}}}return seen;};
 // 4칸 이상 긴 벽은 그대로 둔다(원래 지도의 큰 벽 — 그 목록·순서를 바꾸지 않는다). 그 바로 뒤 칸은 넓히지 않는다(벽 뒤 1칸 바닥 띠 방지).
 const longEdge=new Set();for(const w of ex.walls||[]){const e=w.endpoints;if(!e||e.length!==2)continue;const [[x0,y0],[x1,y1]]=e;
  if(x0===x1&&Math.abs(y1-y0)>=4)for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)longEdge.add('v:'+x0+':'+y);else if(y0===y1&&Math.abs(x1-x0)>=4)for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)longEdge.add('h:'+x+':'+y0);}
 const behindLong=(x,y)=>(has(x-1,y)&&longEdge.has('v:'+x+':'+y))||(has(x+1,y)&&longEdge.has('v:'+(x+1)+':'+y))||(has(x,y-1)&&longEdge.has('h:'+x+':'+y))||(has(x,y+1)&&longEdge.has('h:'+x+':'+(y+1)));
 const add=new Set();
 for(const c of ex.floorCells){const [x,y]=c;if(hwOf(x,y)>2||nearDoor(x,y))continue;let R8=null;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(Math.hypot(dx,dy)>1.5)continue;const nx=x+dx,ny=y+dy,k=key(nx,ny);if(S.has(k)||add.has(k))continue;
   if(nx<2||ny<2||nx>W-3||ny>H-3||nearDoor(nx,ny)||behindLong(nx,ny))continue;R8=R8||reach(x,y,8);let ok=true;
   for(let yy=-2;yy<=2&&ok;yy++)for(let xx=-2;xx<=2;xx++){if(Math.hypot(xx,yy)>2.3)continue;const kk=key(nx+xx,ny+yy);if(S.has(kk)&&!R8.has(kk)){ok=false;break;}}
   if(ok)add.add(k);}}
 if(!add.size)return null;
 // 벽: 각 벽이 덮는 칸 경계(세로 'v:x:y' = (x-1,y)|(x,y), 가로 'h:x:y' = (x,y-1)|(x,y))를 구한다.
 //  넓힌 칸에 닿는 경계이고 양쪽이 다 바닥이 되면 그 벽을 뺀다 — 원래부터 양쪽이 바닥이던 미로 칸막이는 그대로 둔다. 긴 벽은 덮는 경계가 모두 해당될 때만 뺀다.
 const S2=new Set([...S,...add]),has2=(x,y)=>S2.has(key(x,y)),isAdd=(x,y)=>add.has(key(x,y));
 const edgesOf=w=>{const e=w.endpoints;if(!e||e.length!==2)return null;const [[x0,y0],[x1,y1]]=e,out=[];
  if(x0===x1&&Number.isInteger(x0)&&Number.isInteger(y0)&&Number.isInteger(y1))for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)out.push(['v',x0,y,[x0-1,y],[x0,y]]);
  else if(y0===y1&&Number.isInteger(y0)&&Number.isInteger(x0)&&Number.isInteger(x1))for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)out.push(['h',x,y0,[x,y0-1],[x,y0]]);
  else return null;return out;};
 let removed=0;const blockedEdge=new Set();
 // 긴 벽은 넓힌 칸에 닿아 열린 경계만 1칸 단위로 잘라 낸다(나머지 구간은 1칸 벽판으로 남김) — 긴 벽 뒤에 1칸짜리 바닥 띠가 생기지 않게.
 const unit=(w,[k,x,y],n)=>k==='v'?{...w,id:w.id+'#'+n,x,y:y+.5,width:w.width??.24,depth:1,endpoints:[[x,y],[x,y+1]],analyticBounds12:[x-.12,y,x+.12,y+1],r204Split:true}
  :{...w,id:w.id+'#'+n,x:x+.5,y,width:1,depth:w.depth??.24,endpoints:[[x,y],[x+1,y]],analyticBounds12:[x,y-.12,x+1,y+.12],r204Split:true};
 const walls=[];for(const w of ex.walls||[]){const es=edgesOf(w);if(!es||!es.length||/door/i.test(String(w.id||''))){walls.push(w);continue;}
  if(es.length>=4){walls.push(w);for(const [k,x,y] of es)blockedEdge.add(k+':'+x+':'+y);continue;}
  const open=es.map(([,, ,a,b])=>has2(...a)&&has2(...b)&&(isAdd(...a)||isAdd(...b)));
  if(open.every(Boolean)){removed++;continue;}
  if(!open.some(Boolean)){walls.push(w);for(const [k,x,y] of es)blockedEdge.add(k+':'+x+':'+y);continue;}
  removed++;es.forEach((e,n)=>{if(open[n])return;walls.push(unit(w,e,n));blockedEdge.add(e[0]+':'+e[1]+':'+e[2]);});}
 // 원래 바닥에서 4방향(남은 벽을 넘지 않고)으로 닿는 추가 칸만 남긴다 — 벽 뒤에 갇힌 조각을 만들지 않는다.
 const edgeKey=(x,y,nx,ny)=>nx!==x?'v:'+Math.max(x,nx)+':'+y:'h:'+x+':'+Math.max(y,ny);
 const reachAdd=new Set(),qq=[...S].map(k=>k.split(',').map(Number)),seenB=new Set(S);
 for(let h=0;h<qq.length;h++){const [x,y]=qq[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seenB.has(k)||!add.has(k)||blockedEdge.has(edgeKey(x,y,nx,ny)))continue;seenB.add(k);reachAdd.add(k);qq.push([nx,ny]);}}
 const dropped=add.size-reachAdd.size;
 // 버린 칸에 닿아 뺐던 벽은 되살린다
 // 버린 칸이 있으면 그 칸에 닿는 열린 경계에 1칸 벽판을 되살린다
 const keepWalls=walls.slice();if(dropped){const dropSet=new Set([...add].filter(k=>!reachAdd.has(k)));let n=0;
  for(const w of ex.walls||[]){const es=edgesOf(w);if(!es||/door/i.test(String(w.id||'')))continue;for(const e of es){const [k,x,y,a,b]=e,ek=k+':'+x+':'+y;if(blockedEdge.has(ek))continue;
    if(dropSet.has(key(...a))||dropSet.has(key(...b))){keepWalls.push(unit(w,e,'r'+(n++)));blockedEdge.add(ek);}}}}
 const floorCells=[...ex.floorCells,...[...reachAdd].map(k=>k.split(',').map(Number))];
 return {...ex,floorCells,walls:keepWalls,r204Widened:{added:reachAdd.size,dropped,wallsRemoved:removed,before:S.size,after:S.size+reachAdd.size}};}
// 문·입구 자리: 레이아웃 안의 R74 문(worldR74.doors)·입구·관문, 이름에 door 가 든 벽.
const layoutDoorPoints=L=>{const out=[],pt=(q,rad)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,rad||3.5]);};
 for(const d of L.worldR74?.doors||[])pt(d,Math.max(3.5,(Number(d.width)||0)/2+3));for(const q of [L.gate,L.entrance,L.entry])pt(q);for(const w of L.walls||[])if(/door/i.test(String(w.id||'')))pt(w);return out;};
// R171 지도 레이아웃이 처음 방에 붙을 때(꾸미기 전에) 부른다 — 같은 원본 레이아웃에는 늘 같은 결과 객체를 돌려준다(꾸미기·색인이 한 번만).
const widened=new WeakMap();
window.__STORYWORLD_LAYOUT_HOOK_R204__=(id,L)=>{try{if(!prefs.on||!solo()||!ZONES[id]?.widen||!L?.floorCells?.length)return null;if(widened.has(L))return widened.get(L);
 const nx=widen(L,ZONES[id],layoutDoorPoints(L));widened.set(L,nx);if(nx)stats.widened=nx.r204Widened;return nx;}catch(e){fail(e);return null;}};

// ---- 게임 쪽 거리장: 이동 판정(blocked)과 렌더러가 같은 것을 쓴다 ------------------------------------
// 첫 렌더 때(몹·조형물이 다 놓인 뒤) 만든다. 만들기 전에는 막는 것도 그리는 것도 없다(Legacy 렌더러도 그대로).
const cache=new WeakMap();
const roomOn=r=>!!(prefs.on&&solo()&&r&&r.layer==='STORY'&&ZONES[r.id]&&r.exploration?.floorCells?.length);
// [x,y,반지름]: 입구·문·상자·영웅 2.4칸, 조형물 1.3칸(+자기 반지름), 몹 1.0칸
function protectPoints(r){const out=[],ex=r.exploration,pt=(q,rad)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,rad]);};
 for(const q of [ex.entrance,ex.entry,ex.gate])pt(q,1.6);for(const q of r.props||[])pt(q,/door|chest|altar|gate|portal/i.test(String(q.kind||q.id||''))?2.2:.9+(Number(q.radius)||0));
 for(const q of r.enemies||[])pt(q,1.0);for(const d of window.__STORYWORLD_WORLD_R74__?.doors||[])pt(d,2.4);if(typeof player==='object'&&player&&typeof room!=='undefined'&&r===room)pt(player,1.2);return out;}
function fieldFor(r,make=false){const ex=r?.exploration;if(!ex)return null;let F=cache.get(ex);if(F||!make||!roomOn(r))return F||null;
 const t0=performance.now();F=field(ex,ZONES[r.id],protectPoints(r));F.zone=r.id;F.doors=layoutDoorPoints(ex);F.ms=Math.round(performance.now()-t0);cache.set(ex,F);return F;}
if(typeof blocked==='function'){const base=blocked;
 blocked=function(x,y,rad=.27,where=(typeof room!=='undefined'?room:null)){if(base.call(this,x,y,rad,where))return true;
  try{if(prefs.on&&where?.exploration){const F=cache.get(where.exploration);if(F&&roomOn(where)){const fv=at(F,F.f,x,y);
   // 길찾기(findPath·R100·R101)는 칸 중심을 반지름 .29 로 묻고 대각선 모서리 깎기는 보지 않는다 → 새 바위 둘레에선 .32칸 여유를 더해 경로가 바위 가장자리를 스치지 않게 한다(실제 이동 .27 은 그대로).
   const need=rad>=.285&&rad<=.3?rad+.32:rad;if(fv<need&&at(F,F.raw,x,y)-fv>.02){stats.blocks++;return true;}}}}catch(e){fail(e);}return false;};}

// ---- 텍스처 -------------------------------------------------------------------------------------
const imgs=new Map();
function loadImg(p){let r=imgs.get(p);if(!r){r=new Promise((res,rej)=>{const im=new Image();im.decoding='async';im.onload=()=>res(im);im.onerror=()=>rej(Error('image failed '+p));im.src=p;});imgs.set(p,r);}return r;}
function tileTex(T,r,im,half,size=512){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingQuality='high';
 const w=im.naturalWidth,h=im.naturalHeight,sx=half===1?w/2:0,sw=half>=0&&w>h?w/2:w;g.drawImage(im,sx,0,sw,h,0,0,size,size);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=Math.min(4,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);r.spatialResources.add(t);return t;}
function fieldTex(T,r,F){const w=F.GW,h=F.GH,data=new Uint8Array(w*h*4),s=ZONES_SEED(F);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,x=(i+.5)/R-M,y=(j+.5)/R-M;data[k*4]=Math.max(0,Math.min(255,Math.round((.5+F.f[k]/6)*255)));
  data[k*4+1]=Math.round((fbm(x*.11,y*.11,s+7,4)*.5+.5)*255);data[k*4+2]=Math.round((fbm(x*.31+9,y*.31,s+19,3)*.5+.5)*255);data[k*4+3]=255;}
 const t=new T.DataTexture(data,w,h,T.RGBAFormat);t.colorSpace=T.NoColorSpace;t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.flipY=false;t.needsUpdate=true;r.spatialResources.add(t);return t;}
let SEED=1;const ZONES_SEED=()=>SEED;

// 거미줄·잔돌 데칼(직접 그린 보조 자산) + 기존 균열·뼈·뿌리 그림을 한 장(1024×512, 4×2 칸)에 모은다.
function decalAtlas(T,r,ims,cfg){const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');const rnd=rng(cfg.seed^0x77);
 const put=(im,k)=>{const x=(k%4)*256,y=Math.floor(k/4)*256;const w=im.naturalWidth,h=im.naturalHeight,s=Math.min(236/w,236/h);g.drawImage(im,x+128-w*s/2,y+128-h*s/2,w*s,h*s);};
 put(ims.crack,0);put(ims.bones,1);put(ims.root,2);
 // 3: 거미줄(모서리형) 4: 거미줄(둥근형)
 const web=(ox,oy,corner)=>{g.save();g.translate(ox,oy);g.strokeStyle='rgba(222,214,200,.55)';g.lineWidth=1.1;const n=corner?7:11,ang=corner?Math.PI/2:Math.PI*2,R0=corner?236:118,cx=corner?6:128,cy=corner?6:128;
  const spokes=[];for(let i=0;i<n;i++){const a=(corner?0:0)+ang*(i+(corner?.0:.0))/(corner?n-1:n)+(rnd()-.5)*.12;spokes.push(a);g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*R0,cy+Math.sin(a)*R0);g.stroke();}
  for(let ring=1;ring<=9;ring++){const rr=R0*ring/10*(0.95+rnd()*.1);g.beginPath();spokes.forEach((a,i)=>{const q=rr*(0.92+rnd()*.12),x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;if(!i)g.moveTo(x,y);else g.quadraticCurveTo(cx+Math.cos(a-.06)*q*.93,cy+Math.sin(a-.06)*q*.93,x,y);});if(!corner)g.closePath();g.stroke();}
  g.restore();};
 web(768,0,true);web(0,256,false);
 // 5,6,7: 잔돌 무더기(크기 다르게) — 어두운 흙색 작은 돌
 for(const [k,n,sz] of [[5,22,16],[6,40,10],[7,9,30]]){const ox=(k%4)*256,oy=Math.floor(k/4)*256;for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*90,x=ox+128+Math.cos(a)*d,y=oy+128+Math.sin(a)*d*.8,s=sz*(.5+rnd());
   const gr=g.createRadialGradient(x-s*.25,y-s*.3,s*.1,x,y,s);gr.addColorStop(0,'rgba(150,132,110,1)');gr.addColorStop(.7,'rgba(78,66,54,1)');gr.addColorStop(1,'rgba(30,24,20,0)');
   g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x+s*.25,y+s*.3,s*.9,s*.5,0,0,Math.PI*2);g.fill();
   g.fillStyle=gr;g.beginPath();const m=6+Math.floor(rnd()*3);for(let q=0;q<m;q++){const aa=q/m*Math.PI*2,rr=s*(.7+rnd()*.35);const px=x+Math.cos(aa)*rr,py=y+Math.sin(aa)*rr*.75;q?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;r.spatialResources.add(t);return t;}

// ---- 셰이더 조각 --------------------------------------------------------------------------------
const NOISE_GLSL=`
float r204h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 r204tex(sampler2D t,vec2 w,float sc,float rot,vec2 off){float c=cos(rot),s=sin(rot);vec2 q=mat2(c,-s,s,c)*w*sc+off;return texture2D(t,q);}
`;
function cutaway(shader,uniforms){// 영웅 앞의 조각만 성글게 지운다(화면 거리 + 카메라 쪽 깊이)
 shader.uniforms.r204Hero=uniforms.r204Hero;shader.uniforms.r204Aspect=uniforms.r204Aspect;
 shader.vertexShader='varying vec4 r204Clip;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204Clip=gl_Position;');
 shader.fragmentShader='varying vec4 r204Clip;\nuniform vec4 r204Hero;\nuniform float r204Aspect;\n'+shader.fragmentShader.replace('void main() {','void main() {\n{vec2 nd=r204Clip.xy/r204Clip.w-r204Hero.xy;nd.x*=r204Aspect;float dz=r204Clip.z/r204Clip.w;float dd=length(nd);\n if(r204Hero.w>0.5&&dz<r204Hero.z-0.002&&dd<0.2){float k=smoothstep(0.2,0.11,dd);float pat=mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y),2.0);float pat2=mod(floor(gl_FragCoord.x*0.5)+floor(gl_FragCoord.y*0.5),2.0);if(k>0.66||(k>0.33&&pat>0.5)||(pat>0.5&&pat2>0.5))discard;}}');}

function groundMaterial(T,r,F,tx,cfg,U){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204Field:{value:tx.field},r204A:{value:tx.floorA},r204B:{value:tx.floorB},r204C:{value:tx.rock},r204Min:{value:new T.Vector2(-M,-M)},r204Span:{value:new T.Vector2(F.W+2*M,F.H+2*M)},r204Tint:{value:new T.Vector3(...cfg.tint)}});
  sh.vertexShader='varying vec2 r204W;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204W=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh.fragmentShader='varying vec2 r204W;\nuniform sampler2D r204Field,r204A,r204B,r204C;uniform vec2 r204Min,r204Span;uniform vec3 r204Tint;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 fu=(r204W-r204Min)/r204Span;vec4 fd=texture2D(r204Field,fu);float fv=(fd.r-0.5)*6.0;
   vec4 a1=r204tex(r204A,r204W,0.21,0.0,vec2(0.0)),a2=r204tex(r204A,r204W,0.137,1.1,vec2(0.37,0.11));vec3 ta=mix(a1.rgb,a2.rgb,smoothstep(0.35,0.65,fd.b));
   vec3 tb=r204tex(r204B,r204W,0.17+0.05*fd.b,0.6,vec2(0.0)).rgb*2.2;
   vec3 tc=r204tex(r204C,r204W,0.12+0.07*fd.g,1.9,vec2(0.2,0.7)).rgb;float lc=dot(tc,vec3(0.3,0.59,0.11));tc=vec3(lc)*1.25;
   float wB=smoothstep(0.42,0.62,fd.g),wC=smoothstep(0.55,0.75,fd.b)*(1.0-wB*0.5);
   vec3 col=mix(mix(ta,tb,wB),tc,wC*0.75);float lum=dot(col,vec3(0.3,0.59,0.11));col=mix(vec3(lum)*r204Tint,col*r204Tint,0.35)*0.92;
   float fl=(texture2D(r204Field,fu+vec2(-0.55,-0.55)/r204Span).r-0.5)*6.0;
   float ao=mix(0.3,1.0,smoothstep(-0.05,1.4,fv))*mix(0.62,1.0,smoothstep(0.0,1.8,fl));col*=ao;
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-ground-v1';return m;}

function topMaterial(T,r,F,tx,cfg,U){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204Field:{value:tx.field},r204C:{value:tx.rock},r204Min:{value:new T.Vector2(-M,-M)},r204Span:{value:new T.Vector2(F.W+2*M,F.H+2*M)},r204Tint:{value:new T.Vector3(...cfg.tint)}});
  sh.vertexShader='varying vec2 r204W;varying float r204Y;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 r204wp=modelMatrix*vec4(transformed,1.0);r204W=r204wp.xz;r204Y=r204wp.y;');
  sh.fragmentShader='varying vec2 r204W;varying float r204Y;\nuniform sampler2D r204Field,r204C;uniform vec2 r204Min,r204Span;uniform vec3 r204Tint;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 fu=(r204W-r204Min)/r204Span;vec4 fd=texture2D(r204Field,fu);float fv=(fd.r-0.5)*6.0;if(fv>0.0)discard;
   vec4 c1=r204tex(r204C,r204W,0.16,0.4,vec2(0.0)),c2=r204tex(r204C,r204W,0.27,2.0,vec2(0.3,0.6));vec3 tc=mix(c1.rgb,c2.rgb,fd.g);float lc=dot(tc,vec3(0.3,0.59,0.11));
   vec3 col=vec3(lc)*r204Tint*3.1;float rim=smoothstep(-0.32,-0.04,fv);col*=mix(0.62,1.0,smoothstep(0.3,1.6,r204Y))*(1.0+rim*0.45);col*=mix(0.55,1.0,fd.b);
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-top-v1';return m;}

function faceMaterial(T,r,tx,cfg){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,vertexColors:true});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204F:{value:tx.face},r204Tint:{value:new T.Vector3(...cfg.tint)}});
  sh.vertexShader='varying vec3 r204P;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204P=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader='varying vec3 r204P;\nuniform sampler2D r204F;uniform vec3 r204Tint;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 q=vec2((r204P.x-r204P.z)*0.19,r204P.y*0.26+(r204P.x+r204P.z)*0.03);vec3 t1=texture2D(r204F,q).rgb,t2=texture2D(r204F,q*0.61+vec2(0.31,0.17)).rgb;vec3 tc=mix(t1,t2,0.4);
   float lc=dot(tc,vec3(0.3,0.59,0.11));float st=0.82+0.3*fract(sin(floor((r204P.x-r204P.z)*3.1)*12.9898)*43758.5);vec3 col=vec3(lc)*r204Tint*2.1*st;col*=mix(0.3,1.0,smoothstep(0.0,1.3,r204P.y));
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-face-v1';return m;}

// ---- 바닥 굽기: 질감 3종 혼합·접촉 그림자를 진입할 때 한 번만 렌더 타깃(칸당 16px)에 굽는다 ----------------------
// 매 프레임은 구운 그림 1장 + 잔결(거미동굴 바닥 질감) 1장만 읽는다 — 모바일 채움 비용을 줄인다.
const BAKE_PPU=16;
function bakeGround(T,r,F,bakeMat,detail,cfg){const sw=F.W+2*M,sh=F.H+2*M,rt=new T.WebGLRenderTarget(sw*BAKE_PPU,sh*BAKE_PPU,{depthBuffer:false,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter,magFilter:T.LinearFilter,colorSpace:T.SRGBColorSpace});
 const geo=groundMesh(T,F),scene=new T.Scene(),cam=new T.OrthographicCamera(-sw/2,sw/2,sh/2,-sh/2,-10,10);scene.add(new T.Mesh(geo,bakeMat));
 cam.up.set(0,0,-1);cam.position.set(F.W/2,5,F.H/2);cam.lookAt(F.W/2,0,F.H/2);cam.updateMatrixWorld();cam.updateProjectionMatrix();
 const prev=r.renderer.getRenderTarget();r.renderer.setRenderTarget(rt);r.renderer.render(scene,cam);r.renderer.setRenderTarget(prev);geo.dispose();bakeMat.dispose();
 r.spatialResources.add(rt);
 const m=new T.MeshBasicMaterial({map:rt.texture,toneMapped:false});
 m.onBeforeCompile=sh2=>{sh2.uniforms.r204D={value:detail};sh2.vertexShader='varying vec2 r204W;\n'+sh2.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204W=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh2.fragmentShader='varying vec2 r204W;\nuniform sampler2D r204D;\n'+sh2.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat r204d=dot(texture2D(r204D,r204W*0.47).rgb,vec3(0.33));diffuseColor.rgb*=clamp(0.55+r204d*1.05,0.6,1.35);');};
 m.customProgramCacheKey=()=>'r204-ground-baked-v1';return m;}

// ---- 기하 ---------------------------------------------------------------------------------------
function groundMesh(T,F){const g=new T.PlaneGeometry(F.W+2*M,F.H+2*M,1,1);g.rotateX(-Math.PI/2);g.translate(F.W/2,0,F.H/2);return g;}
function topMesh(T,F,cfg){// 칸당 1점 격자, 보행 쪽(f>0)은 셰이더가 버린다. 경계 근처는 거리장 0 근방이라 높이가 이어진다.
 const nx=F.W+2*M+1,ny=F.H+2*M+1,pos=new Float32Array(nx*ny*3),idx=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i-M,y=j-M,k=(j*nx+i)*3;pos[k]=x;pos[k+1]=topHeight(F,cfg,x,y);pos[k+2]=y;}
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
  // 전부 보행 칸 한가운데면(네 점 모두 f>0.6) 삼각형을 만들지 않는다
  // 이 칸 안 거리장 점이 모두 보행 쪽으로 넉넉하면(>0.25) 삼각형을 만들지 않는다 — 작은 바위섬 윗면이 빠지지 않게 칸 안 모든 점을 본다
  let mn=1e9;for(let q=0;q<R&&mn>.25;q++)for(let w=0;w<R;w++){const v=F.f[(j*R+q)*F.GW+i*R+w];if(v<mn)mn=v;}if(mn>.25)continue;idx.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(idx);g.computeBoundingSphere();return g;}
function faceMesh(T,F,cfg){// 마칭 스퀘어: 노드 값 f, 0 등고선 조각마다 세로 면. 법선은 보행 쪽(앞면) — 뒤쪽 면은 컬링.
 const pos=[],col=[],idx=[];let n=0;const f=F.f,GW=F.GW,GH=F.GH;
 const P=(i,j)=>[(i+.5)/R-M,(j+.5)/R-M];const L=[-.55,.62,-.56];// 빛: 왼쪽 위 앞
 const edge=(i0,j0,i1,j1)=>{const v0=f[j0*GW+i0],v1=f[j1*GW+i1],t=v0/(v0-v1),a=P(i0,j0),b=P(i1,j1);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];};
 for(let j=0;j<GH-1;j++)for(let i=0;i<GW-1;i++){const a=f[j*GW+i],b=f[j*GW+i+1],c=f[(j+1)*GW+i+1],d=f[(j+1)*GW+i];
  const code=(a>0?1:0)|(b>0?2:0)|(c>0?4:0)|(d>0?8:0);if(code===0||code===15)continue;
  const eT=()=>edge(i,j,i+1,j),eR=()=>edge(i+1,j,i+1,j+1),eB=()=>edge(i,j+1,i+1,j+1),eL=()=>edge(i,j,i,j+1);
  const segs={1:[[eL,eT]],2:[[eT,eR]],3:[[eL,eR]],4:[[eR,eB]],5:[[eL,eT],[eR,eB]],6:[[eT,eB]],7:[[eL,eB]],8:[[eB,eL]],9:[[eB,eT]],10:[[eT,eR],[eB,eL]],11:[[eB,eR]],12:[[eR,eL]],13:[[eR,eT]],14:[[eT,eL]]}[code];
  for(const [s0,s1] of segs){const p=s0(),q=s1();
   // 보행 쪽을 향하는 법선: 조각 가운데에서 f 의 기울기
   const mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,gx=at(F,f,mx+.1,my)-at(F,f,mx-.1,my),gy=at(F,f,mx,my+.1)-at(F,f,mx,my-.1);
   let nx=-(q[1]-p[1]),ny=q[0]-p[0];if(nx*gx+ny*gy<0){nx=-nx;ny=-ny;}const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
   const h0=topHeight(F,cfg,p[0],p[1]),h1=topHeight(F,cfg,q[0],q[1]);
   const sh=.5+.5*Math.max(0,nx*L[0]+ny*L[2])+.12;const cA=Math.min(1.15,sh);
   pos.push(p[0],-.03,p[1], q[0],-.03,q[1], p[0],h0,p[1], q[0],h1,q[1]);for(let k=0;k<4;k++)col.push(cA,cA,cA);
   // 앞면(반시계, 바깥=보행 쪽)이 되도록 감는 방향을 법선으로 고른다
   const cross=(q[0]-p[0])*ny-(q[1]-p[1])*nx;if(cross<0)idx.push(n,n+2,n+1,n+1,n+2,n+3);else idx.push(n,n+1,n+2,n+1,n+3,n+2);n+=4;}}
 stats.segments=n/4;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();return g;}
function pillarMesh(T,F,cfg){// 종유석·바위 기둥: 대지 가장자리(f -0.6~-2.6)에 고정 시드로. 6~8각 뿔, 꼭짓점을 흔든다.
 const rnd=rng(cfg.seed^0x3141),pos=[],col=[],idx=[];let n=0,count=0;const want=Math.round((F.W*F.H)/55);
 for(let t=0;t<want*30&&count<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>-.6||fv<-2.6)continue;
  const base=topHeight(F,cfg,x,y),tall=(.9+rnd()*2.2)*(fv<-1.5?1.25:.85)*Math.min(1,Math.max(.35,base/cfg.hiTop)),rad=.18+rnd()*.32,sides=6+Math.floor(rnd()*3),lean=[(rnd()-.5)*.25,(rnd()-.5)*.25];
  const rings=[[0,1],[.45,.72],[.8,.38],[1,.04]];const start=n;
  for(const [hv,rv] of rings)for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2+rnd()*.15,rr=rad*rv*(.8+rnd()*.35);pos.push(x+Math.cos(a)*rr+lean[0]*hv*tall,base-.05+hv*tall,y+Math.sin(a)*rr+lean[1]*hv*tall);const lit=.55+.45*Math.max(0,Math.cos(a+2.4));const c=Math.min(1.1,lit*(0.7+hv*.4));col.push(c,c,c);n++;}
  for(let ri=0;ri<rings.length-1;ri++)for(let s=0;s<sides;s++){const a=start+ri*(sides+1)+s,b=a+1,c=a+sides+1,d=c+1;idx.push(a,b,c,b,d,c);}
  count++;}
 stats.pillars=count;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;}
function decalMesh(T,F,cfg){// 바닥 데칼: 보행 영역(f>0.15) — 균열·잔돌·뼈는 아무 데나, 뿌리·거미줄은 절벽 가까이(f<1.2)
 const rnd=rng(cfg.seed^0x2718),pos=[],uv=[],idx=[];let n=0,count=0;const want=Math.round((F.W*F.H)/14);
 for(let t=0;t<want*20&&count<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv<.15)continue;
  const near=fv<1.2;let k;const r0=rnd();
  if(near)k=r0<.32&&cfg.web?(r0<.16?3:4):r0<.55?2:r0<.8?5:6;else k=r0<.3?0:r0<.55?5:r0<.75?6:r0<.88?7:1;
  const size=(k===3||k===4?1.6:k===1?1.1:k===2?1.5:k===0?1.8:k===7?.9:1.0)*(.65+rnd()*.7),rot=rnd()*Math.PI*2,u0=(k%4)/4,v0=Math.floor(k/4)/2;
  const cs=Math.cos(rot)*size/2,sn=Math.sin(rot)*size/2;const yy=.012+count*1e-5;
  pos.push(x-cs+sn,yy,y-sn-cs, x+cs+sn,yy,y+sn-cs, x+cs-sn,yy,y+sn+cs, x-cs-sn,yy,y-sn+cs);
  uv.push(u0,1-v0, u0+.25,1-v0, u0+.25,1-v0-.5, u0,1-v0-.5);idx.push(n,n+2,n+1,n,n+3,n+2);n+=4;count++;}
 stats.decals=count;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();return g;}

function blobTex(T,r){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.55,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.NoColorSpace;r.spatialResources.add(t);return t;}
// 바닥에 놓인 조형물(문·상자·빛 소품 포함, 공중 장식 제외) 아래 타원. 반지름은 소품 반지름의 1.25배(최소 0.45칸), 화면 세로로 눌린 모양은 바닥 평면이라 저절로 생긴다.
function propShadowMesh(T,F,rm){const props=(rm?.props||[]).filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&!q.flying&&!q.r204NoShadow&&at(F,F.f,q.x,q.y)>-.2);if(!props.length)return null;
 const pos=[],uv=[],idx=[];let n=0;for(const q of props){const rad=Math.max(.45,(Number(q.radius)||.4)*1.25),y=.011;
  pos.push(q.x-rad,y,q.y-rad, q.x+rad,y,q.y-rad, q.x+rad,y,q.y+rad, q.x-rad,y,q.y+rad);uv.push(0,0,1,0,1,1,0,1);idx.push(n,n+2,n+1,n,n+3,n+2);n+=4;}
 stats.propShadows=props.length;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();return g;}
// 둔덕 위 나무: 뒤쪽(높은) 둔덕에만 — 카메라 쪽 낮은 둔덕엔 세우지 않아 영웅을 가리지 않는다. 원화 12장 중 고정 시드로 고르고 좌우 반전·크기만 바꾼다.
function treeSprites(T,r,F,cfg,ims){const rnd=rng(cfg.seed^0x7ee5),g=new T.Group(),mats=[];let n=0;const want=Math.round((F.W*F.H)/120);
 for(let i=0;i<12;i++){const im=ims['tree'+i];if(!im)continue;const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);
  const m=new T.SpriteMaterial({map:t,alphaTest:.45,depthWrite:true,toneMapped:false,color:new T.Color(cfg.tint[0]*.9,cfg.tint[1]*.9,cfg.tint[2]*.9)});r.spatialResources.add(m);mats.push(m);}
 if(!mats.length)return null;const placed=[];
 for(let t=0;t<want*40&&n<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>-.9||fv<-4)continue;const h=topHeight(F,cfg,x,y);if(h<1.05)continue;
  if(placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<2.2))continue;placed.push([x,y]);
  const s=new T.Sprite(mats[Math.floor(rnd()*mats.length)]);const hgt=3.4+rnd()*1.8;s.scale.set(hgt*.95,hgt,1);s.center.set(.5,.04);s.position.set(x,h-.05,y);s.layers.set(2);s.renderOrder=-27;s.userData.r204=true;g.add(s);n++;}
 stats.trees=n;return n?g:null;}

// ---- R207 Drive 유기 지형 패치 ---------------------------------------------------------------------
// 그림 자체가 이 게임의 2:1 아이소 시점으로 그려져 있다 → 화면 픽셀을 바닥 좌표로 되돌린 평면 사각형에 붙이면 그린 모양 그대로 바닥에 눕는다.
//  화면 (dpx,dpy) px(줌 1) → 바닥 x−y = dpx/34, x+y = dpy/17 (엔진 Projection tile=34). 늘이기·회전·반전 없음(조명 방향 보존). 비충돌.
const ISO_T=34;
function isoQuad(cx,cy,box,s,yOff){const P=(px,py)=>{const dx=(px-box.cx)*s,dy=(py-box.cy)*s;return[cx+(dx/ISO_T+dy/(ISO_T/2))/2,yOff,cy+(dy/(ISO_T/2)-dx/ISO_T)/2];};
 return[P(box.x0,box.y0),P(box.x1,box.y0),P(box.x1,box.y1),P(box.x0,box.y1)];}
function bboxOf(im){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;
 let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>24){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
 return{x0,y0,x1:x1+2,y1:y1+2,cx:(x0+x1)/2,cy:(y0+y1)/2,w:c.width,h:c.height};}
// 바위 조각은 회보라 암석이라 지역 색(tint)으로 다시 칠한다(밝기만 살림) — 화풍·색 일관
function tintedCanvas(im,tint){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const id=g.getImageData(0,0,c.width,c.height),d=id.data;
 for(let i=0;i<d.length;i+=4){const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255,k=Math.pow(l,1.1)*1.05;d[i]=Math.min(255,k*255*tint[0]);d[i+1]=Math.min(255,k*255*tint[1]);d[i+2]=Math.min(255,k*255*tint[2]);}g.putImageData(id,0,0);return c;}
function organicDecor(T,r,F,cfg,ims,rm){const rnd=rng(cfg.seed^0x0207),g=new T.Group();let np=0,nu=0;
 const avoid=[...(F.doors||[]).map(d=>[d[0],d[1],Math.max(3,(d[2]||3.5)-.5)]),...(rm?.props||[]).filter(q=>Number.isFinite(q.x)).map(q=>[q.x,q.y,1.4+(Number(q.radius)||0)])];
 const clear=(x,y)=>!avoid.some(a=>Math.hypot(a[0]-x,a[1]-y)<a[2]);
 for(const [name,where,sc,rate,bright=1] of cfg.patches||[]){const im=ims['org:'+name];if(!im)continue;const box=bboxOf(im),t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);
  const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(cfg.tint[0]*.92*bright,cfg.tint[1]*.92*bright,cfg.tint[2]*.92*bright),polygonOffset:true,polygonOffsetFactor:-4});r.spatialResources.add(m);if(r.sightState24)A.attachSight24?.(m,r.sightState24);
  const pos=[],uv=[],idx=[];let k=0;const want=Math.max(1,Math.round(F.W*F.H*rate)),placed=[];
  for(let t2=0;t2<want*40&&k<want;t2++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(where==='base'?(fv<.25||fv>1.1):fv<1.3)continue;if(!clear(x,y)||placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<3.2))continue;placed.push([x,y]);
   const q=isoQuad(x,y,box,sc*(.85+rnd()*.3),.013+np*1e-5);for(const v of q)pos.push(...v);uv.push(box.x0/box.w,1-box.y0/box.h,box.x1/box.w,1-box.y0/box.h,box.x1/box.w,1-box.y1/box.h,box.x0/box.w,1-box.y1/box.h);
   const b=k*4;idx.push(b,b+2,b+1,b,b+3,b+2);k++;np++;}
  if(!k)continue;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeBoundingSphere();r.spatialResources.add(geo);
  const mesh=new T.Mesh(geo,m);mesh.layers.set(2);mesh.renderOrder=-17;mesh.userData.r204=true;mesh.name='r207-patch:'+name;g.add(mesh);}
 // 세운 그림(암벽 조각·낮은 돌 경계): 뒤쪽 높은 대지 가장자리만(카메라 쪽 낮은 대지·바닥엔 두지 않아 영웅·길을 가리지 않음). 바닥 기준점 = 그림 아래 끝 가운데.
 const ups=(cfg.uprights||[]).map(([name,sc])=>{const im=ims['org:'+name];if(!im)return null;const box=bboxOf(im),src=/garden/.test(name)?im:tintedCanvas(im,cfg.tint),t=new (src instanceof HTMLCanvasElement?T.CanvasTexture:T.Texture)(src);
  t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);const m=new T.SpriteMaterial({map:t,alphaTest:.4,depthWrite:true,toneMapped:false});r.spatialResources.add(m);return{m,box,sc};}).filter(Boolean);
 if(ups.length){const want=Math.round(F.W*F.H*(cfg.uprightRate||1/100)),placed=[];
  for(let t2=0;t2<want*40&&nu<want;t2++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>-.35||fv<-1.4)continue;const h=topHeight(F,cfg,x,y);if(h<1.0)continue;if(!clear(x,y)||placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<2.6))continue;placed.push([x,y]);
   const u=ups[Math.floor(rnd()*ups.length)],sp=new T.Sprite(u.m),wpx=u.box.w*u.sc,hpx=u.box.h*u.sc,ppu=ISO_T*Math.SQRT2;// 화면 px → 월드 크기(정사영: 화면 1px ≈ 1/(34·√2) 단위)
   sp.scale.set(wpx/ppu,hpx/ppu*1.15,1);sp.center.set(u.box.cx/u.box.w,1-(u.box.y1-6)/u.box.h);sp.position.set(x,h-.05,y);sp.layers.set(2);sp.renderOrder=-26;sp.userData.r204=true;g.add(sp);nu++;}}
 stats.organicPatches=np;stats.organicUprights=nu;return(np||nu)?g:null;}

// ---- 장면 연결 ----------------------------------------------------------------------------------
const FLOOR_CMD=/^r9[02]:floor:/;
const HIDE=/wall|masonry|roof-caps|cap-rims|cap-trim|contact-skirt|nonwalkable|-edge|decor|halo|annex-ground|jamb|threshold|door-contact|door-apertures/i;
const roomOf=frame=>typeof room!=='undefined'&&room?.exploration===frame?.exploration?room:null;
function eligible(r,frame){const rm=roomOf(frame);return !!(rm&&roomOn(rm)&&frame?.layer==='STORY'&&r.spatialBuilt);}
function build(r,frame){const t0=performance.now(),T=r.T,cfg=ZONES[frame.zone],ex=frame.exploration;SEED=cfg.seed;
 const gen=r.sceneGeneration;r.__r204={gen,pending:true,zone:frame.zone};
 const TX={...TEX,...(cfg.tex||{})},want=Object.fromEntries(Object.entries(TX).map(([k,[p]])=>[k,loadImg(p)]));
 for(const [n] of [...(cfg.patches||[]),...(cfg.uprights||[])])want['org:'+n]=loadImg('assets/r207/organic/'+n+'.png');
 if(cfg.trees)for(let i=0;i<12;i++)want['tree'+i]=loadImg('assets/r99/outdoor/tree-'+cfg.trees+'-'+String(i).padStart(2,'0')+'.webp');
 Promise.all(Object.values(want)).then(list=>{if(r.disposed||r.sceneGeneration!==gen)return;const ims={};Object.keys(want).forEach((k,i)=>ims[k]=list[i]);
  const F=fieldFor(roomOf(frame),true);if(!F)throw Error('no field');const tx={field:fieldTex(T,r,F),floorA:tileTex(T,r,ims.floorA,0),floorB:tileTex(T,r,ims.floorB,0),rock:tileTex(T,r,ims.rock,TX.rock[1]),face:tileTex(T,r,ims.face,TX.face[1])};
  const U=r.__r204U||(r.__r204U={r204Hero:{value:new T.Vector4(0,0,0,0)},r204Aspect:{value:1}});
  const mats={ground:bakeGround(T,r,F,groundMaterial(T,r,F,tx,cfg,U),tx.floorA,cfg),top:topMaterial(T,r,F,tx,cfg,U),face:faceMaterial(T,r,tx,cfg),pillar:faceMaterial(T,r,tx,cfg),
   decal:new T.MeshBasicMaterial({map:decalAtlas(T,r,ims,cfg),transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(cfg.tint[0]*.82,cfg.tint[1]*.82,cfg.tint[2]*.82),polygonOffset:true,polygonOffsetFactor:-2})};
  for(const k of ['top','face','pillar']){const m=mats[k],before=m.onBeforeCompile;m.onBeforeCompile=function(sh,re){before.call(this,sh,re);cutaway(sh,U);};const key=m.customProgramCacheKey;m.customProgramCacheKey=()=>key()+'|cut';}
  for(const m of Object.values(mats)){r.spatialResources.add(m);if(r.sightState24&&A.attachSight24)A.attachSight24(m,r.sightState24);}
  const group=new T.Group();group.name='r204-cave';
  const add=(geo,mat,name,order)=>{const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.layers.set(2);mesh.renderOrder=order;mesh.userData.presentationOnly=true;mesh.userData.r204=true;mesh.frustumCulled=true;r.spatialResources.add(geo);group.add(mesh);return mesh;};
  // 앞에서 뒤로 그린다: 대지·절벽·기둥이 먼저 깊이를 채우면 그 뒤 바닥 조각은 깊이 검사에서 일찍 버려진다(덧그리기 감소)
  add(faceMesh(T,F,cfg),mats.face,'r204-cliff-faces',-30);if(cfg.pillars!==false)add(pillarMesh(T,F,cfg),mats.pillar,'r204-stalagmites',-29);add(topMesh(T,F,cfg),mats.top,'r204-plateau',-28);
  add(groundMesh(T,F),mats.ground,'r204-ground',-20);add(decalMesh(T,F,cfg),mats.decal,'r204-decals',-19);
  // 조형물 발밑 그늘(사용자 "조형물도 자연스럽게"): 바닥에 붙은 부드러운 어두운 타원 — 소품이 바닥에 놓여 있게 보이도록
  {const rm=roomOf(frame),pg=propShadowMesh(T,F,rm);if(pg){const m=new T.MeshBasicMaterial({map:blobTex(T,r),transparent:true,depthWrite:false,toneMapped:false,color:0x000000,opacity:.62,polygonOffset:true,polygonOffsetFactor:-3});r.spatialResources.add(m);if(r.sightState24)A.attachSight24?.(m,r.sightState24);add(pg,m,'r204-prop-shadows',-18);}}
  if(cfg.trees){const tg=treeSprites(T,r,F,cfg,ims);if(tg){tg.name='r204-trees';group.add(tg);}}
  if(cfg.patches||cfg.uprights){const og=organicDecor(T,r,F,cfg,ims,roomOf(frame));if(og){og.name='r207-organic';group.add(og);}}
  r.spatialRoot.add(group);r.__r204={gen,pending:false,zone:frame.zone,group,F,sightState:r.sightState24};stats.builds++;stats.buildMs=Math.round(performance.now()-t0);
 }).catch(e=>{fail(e);if(r.__r204?.gen===gen)r.__r204.failed=true;});}
// 엔진이 매 프레임 visible 을 다시 켜는 메시가 있어(벽 가림·R188) 레이어를 비워 숨긴다(원래 레이어는 기억했다가 되돌린다).
function hideNative(r){let n=0;r.spatialRoot.traverse(o=>{if(o===r.spatialRoot||o.userData?.r204||o.name==='r204-cave'||o.parent?.name==='r204-cave')return;
 if(HIDE.test(o.name||'')&&o.userData.r204Mask==null){o.userData.r204Mask=o.layers.mask;o.layers.mask=0;n++;}});stats.hidden+=n;}
function restoreNative(r){r.spatialRoot.traverse(o=>{if(o.userData?.r204Mask!=null){o.layers.mask=o.userData.r204Mask;delete o.userData.r204Mask;}});}
function heroUniform(r,frame){const U=r.__r204U;if(!U)return;const h=frame.entities?.find(e=>e.hero);if(!h){U.r204Hero.value.w=0;return;}
 const v=new r.T.Vector3(h.x,.9,h.y).project(r.camera);U.r204Hero.value.set(v.x,v.y,v.z,1);const el=r.renderer.domElement;U.r204Aspect.value=el.width/Math.max(1,el.height);}
function before(r,frame){try{
 const st=r.__r204;if(!eligible(r,frame)){if(st?.group){st.group.visible=false;restoreNative(r);}return;}
 if(!st||st.gen!==r.sceneGeneration||st.zone!==frame.zone){build(r,frame);return;}
 if(st.pending||st.failed)return;st.group.visible=true;
 if(r.sightState24&&st.sightState!==r.sightState24){for(const o of st.group.children)A.attachSight24?.(o.material,r.sightState24);st.sightState=r.sightState24;}
 hideNative(r);heroUniform(r,frame);stats.frames++;
 // 사각 방에 맞춰 그린 옛 바닥 무늬(R90·R92 floor 명령)는 새 바닥과 어긋나므로 이 지역에서만 뺀다
 if(Array.isArray(frame.commands)){const n0=frame.commands.length;frame.commands=frame.commands.filter(c=>!FLOOR_CMD.test(String(c?.owner?.id||'')));stats.floorCmdsDropped=n0-frame.commands.length;}}catch(e){fail(e);}}
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다.
const wrapFn=fn=>{if(fn.__r204)return fn;const w=function(frame){before(this,frame);return fn.apply(this,arguments);};w.__r204=true;return w;};
C.render=wrapFn(C.render);
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.__r204)r.render=wrapFn(r.render);}catch(e){fail(e);}}
setInterval(wrapInst,500);wrapInst();
function set(p){if(typeof p?.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_CAVE_R204__=Object.freeze({revision:REV,set,zones:Object.keys(ZONES),field,topHeight:(F,z,x,y)=>topHeight(F,ZONES[z],x,y),at,
 inspect:()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,st=r?.__r204,F=st?.F;return{revision:REV,prefs:{...prefs},active:!!st?.group?.visible,zone:st?.zone||null,field:F?{ms:F.ms,bulgedCells:F.bulgedCells,protect:F.protect,size:[F.W,F.H]}:null,stats:{...stats},lastError};}});
})();
