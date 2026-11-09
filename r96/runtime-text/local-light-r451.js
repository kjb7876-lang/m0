// R451 — 광원 둘레 국지 조명(사용자 2026-11-09 참고 화면 6장 "이런느낌들 거의 유사하게" → 제안 2번 "어두운 바탕 + 광원 둘레 국지 조명" 승인 "응").
//  참고 화면에서 따온 것은 규칙뿐(모양·배치·자산은 가져오지 않음): 바탕은 어둡게 깔고, 진짜 광원 둘레만 바닥·벽이 실제로 밝아지며 그 빛은 벽에 막힌다.
//  진단(헤드리스 실측, 같은 자리 6곳): 어둠 층이 모두 곱하기로만 겹쳐(R89 들고 다니는 빛 가장자리 .62 × R300 지역 어둡게 .84 × R123 비네트 × R335 원형 어둠)
//   화면 평균 밝기 .085~.135·채도 .04 — 참고 화면(평균 .21~.35, 밝은 곳 p90 .35~.5)과의 차이는 "더 어둡게"가 아니라 "빛 둘레가 확실히 밝고 그늘은 깊게"였다.
//   지금 등불(R92 세움 등·R91 벽 등)은 어둠을 덜 어둡게 할 뿐(최댓값) 바닥을 밝히지 못하고, R123·R300 은 벽 모서리 '가짜 불빛'(5칸마다)에 붉은 타원을 그렸다.
//  방법(그림 원본·판정·피해·저장은 그대로, 화면 표현만):
//   1) 진짜 광원만 모은다 — R92 세움 등(색 포함)·R91 벽 등·불 소품(R123 isLight)·제단. 종류별 색: 불꽃(따뜻·깜빡)·등잔·전구(고른 텅스텐)·형광등(임상, 차갑게)·
//      기계(파랑)·꿈(보라)·성소(금빛). 실내 규칙(사용자 2026-11-08 "실내엔 불(화염) 없게, 있어도 전구등") — 실내의 불꽃 광원은 전구 빛으로 바꾼다.
//   2) 지역마다 한 번 세계 좌표 조명맵(칸당 4텍셀)을 굽는다 — 걸을 수 있는 칸으로만 퍼지는 거리(다익스트라)라 벽 너머로 새지 않고, 모퉁이를 돌면 빨리 약해진다.
//   3) 지형 재질(바닥·벽·덩어리 지형·벽 장식·바닥 무늬)에 셰이더 몇 줄을 붙여 색 × (지역 바탕빛 + 조명맵 + 영웅 둘레 빛) — 1 을 넘어 실제로 밝힌다.
//      벽 옆면은 그 앞 바닥 칸의 빛을 받고(높을수록 약하게), 벽 윗면·지붕은 바탕빛 위주(검은 덩어리 → 길·방이 또렷). R89 색 보정 다음에 곱한다.
//   4) 바닥 소품(그림 명령)은 발밑 빛으로 색을 곱한다(R89 가 하던 소품 어둡게를 대신). 영웅·몹은 R453 이 같은 빛을 받아 맞춘다.
//   5) R451 이 켜져 있을 때만 R89 화면 빛 사각형·R300 지역 어둡게·빛 웅덩이·R123 가짜 불빛 타원을 쉰다(끄면 예전 그대로).
//      R335 원형 어둠(사용자가 고른 기본)은 그대로 두고, 먼 등불 자리만 구멍을 내 어둠 속 불빛이 보이게 한다.
//  본편(STORY)에서만 — 사몽(DREAM)·시야 제한(횃불·손전등) 모드는 예전 빛을 쓴다. 끄기: 설정 '국지 조명 (R451)' 또는 localStorage['storyworld.r451.localLight']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_LOCAL_LIGHT_R451__)return;
const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!A||!C)return;
const REV='R451-local-light-2',KEY='storyworld.r451.localLight';
const DEFAULTS=Object.freeze({on:true,flicker:true});
let prefs={...DEFAULTS};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k in DEFAULTS)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,owned:0,bakes:0,bakeMs:0,lights:0,lightsUsed:0,blockers:0,texels:0,patched:0,rowsLit:0,holes:0,stutters:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},finite=v=>Number.isFinite(v);

// ---- 지역 바탕빛(어둠 바탕) · 영웅 둘레 빛 ---------------------------------------------------------------------------
// k = 빛 없는 곳 밝기(곱), c = 바탕빛 색. 바깥(달빛)은 살짝 차게, 실내는 중성, 늪은 녹, 재는 붉게(색채심리 9절: 차가움=위협, 따뜻함=안전).
//  바깥(out)은 달빛처럼 살짝 차게, 건물 안(in)은 중성·따뜻하게(병원·기계는 차게), 동굴(cave)은 가장 어둡게 — 실내·실외는 R450 PLACE 표(정본·지역 이름 근거).
//  참고 화면(평균 밝기 .21~.35)은 '어둡게'보다 '빛 둘레가 확실히 밝고 바탕은 읽히게'였다 — 빛 없는 곳도 바닥 결이 보이는 밝기(실외 .76~.8, 실내 .7)로 두고,
//  어둠은 광원 둘레와의 차이(대비)·R335 원형 어둠(가볍게)으로 만든다. 보정(2026-11-09, 들어간 뒤 9초 화면): 실외 정원·늪·재·돌 .82~.86 → 화면 어두운 곳 78~86%(호러 규칙 70~85% 근처). 예전 화면(R89 들고 다니는 빛 가장자리 .62 × R300 .84)보다 바탕을 조금 올린다.
const AMB=Object.freeze({
 clinical:{k:.74,c:[.9,.96,1.03]},domestic:{k:.76,c:[.96,.96,.98]},garden:{k:.86,c:[.87,.95,1.04]},cave:{k:.68,c:[.86,.92,1.03]},swamp:{k:.82,c:[.88,.98,.93]},
 ash:{k:.82,c:[1,.93,.88]},stone:{k:.82,c:[.89,.94,1.04]},forge:{k:.74,c:[1,.92,.85]},snow:{k:.66,c:[.9,.95,1.05]},coast:{k:.8,c:[.86,.94,1.05]},
 memory:{k:.76,c:[.94,.92,1.04]},neural:{k:.74,c:[.88,.95,1.05]},regional:{k:.84,c:[.9,.95,1.03]}});
const AMB_IN=Object.freeze({clinical:{k:.7,c:[.93,.97,1]},neural:{k:.68,c:[.9,.96,1.03]},memory:{k:.7,c:[.97,.94,1.02]},default:{k:.7,c:[1,.96,.91]}});
const AMB_CAVE=Object.freeze({k:.6,c:[.88,.92,1]});
// 빛 곱의 어깨: .92 를 넘는 몫은 부드럽게 눌러 최대 1.5 — 밝은 바닥(병원 타일)이 광원 밑에서 하얗게 날아가 결을 잃지 않게.
const KNEE=.92,SHOULDER=.58,shoulder=v=>v<=KNEE?v:KNEE+SHOULDER*(1-Math.exp(-(v-KNEE)/SHOULDER));
function ambientFor(fam,kind){if(kind==='in')return AMB_IN[fam]||AMB_IN.default;if(kind==='cave')return AMB_CAVE;return AMB[fam]||AMB.regional;}
// 영웅이 들고 다니는 빛(R89 의 따뜻한 중심을 이어받음): 반지름(칸)·세기·색. 등불 웅덩이가 묻히지 않게 등불보다 약하게.
const HERO=Object.freeze({r:6.6,k:.36,c:[1,.92,.8]});
// ---- 광원 종류 -------------------------------------------------------------------------------------------------
// c 색, k 세기(바닥 한가운데 더해지는 밝기), r 반지름(칸), fl 깜빡임 폭.
const TYPE=Object.freeze({
 fire:{c:[1,.55,.22],k:1.1,r:5.6,fl:.1},lamp:{c:[1,.7,.4],k:1.0,r:5.4,fl:.04},bulb:{c:[1,.79,.52],k:1.0,r:5.6,fl:0},
 fluor:{c:[.8,.92,1],k:.92,r:5.8,fl:0,stutter:true},tech:{c:[.48,.76,1],k:.88,r:5,fl:.02},magic:{c:[.66,.6,1],k:.9,r:5,fl:.04},holy:{c:[1,.86,.54],k:1.05,r:6,fl:.02}});
const FIRE=/candle|torch|brazier|fire|flame|hearth|bonfire|campfire|pyre|ember|화로|횃불|촛불|모닥/i,BULB=/bulb|caged|chandelier|sconce|ceiling|전구|샹들리에/i,
 TECH=/monitor|screen|neon|server|machine|console|전극|기계/i,MAGIC=/crystal|rune|sigil|arcane|orb|수정|룬/i,LAMP=/lantern|lamp|oil|등잔|등불|랜턴/i;
function classify(label,fam,indoor,color,fireOk){const s=String(label||'');let t=FIRE.test(s)?'fire':BULB.test(s)?'bulb':TECH.test(s)?'tech':MAGIC.test(s)?'magic':LAMP.test(s)?'lamp':null;
 if(!t){// R92 세움 등은 이름에 지역만 있다(lights_ash_01 …): 지역으로 고른다.
  if(/_(ash|forge)_/.test(s))t='fire';else if(/_(hospital|domestic)_/.test(s))t='bulb';else if(/_dream_/.test(s))t=color&&color[2]>color[0]?'magic':'lamp';else t='lamp';}
 if(color&&(color[2]>color[0]+.1||color[1]>color[0]+.1))t='magic';              // 파란 수정·초록 가마솥 같은 색 있는 등은 제 색 그대로
 if(indoor&&t==='fire'&&!fireOk)t='bulb';                                      // 실내엔 불꽃 대신 전구(사용자 2026-11-08) — 화덕·불타는 호텔은 예외
 if(fam==='clinical'&&(t==='bulb'||t==='lamp'))t='fluor';                       // 병원: 차가운 형광등(정본 "차가운 형광등과 소독약 냄새")
 if(fam==='neural'&&(t==='bulb'||t==='lamp'))t='tech';
 return t;}

// ---- 지역 정보 -------------------------------------------------------------------------------------------------
function familyOf(r){try{const L=r?.exploration,z=typeof zone!=='undefined'?zone:null;
  const f=L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(z==='ep1a08'||L?.hospitalCoreB2&&!L?.worldWardR81?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[z]?.family;
  return AMB[f]?f:'regional';}catch(_){return'regional';}}
// 실내·실외·동굴·기억 공간: R450 PLACE 표(정본·지역 이름 근거) → 없으면 R406 indoorOf.
function placeKind(r){try{const f=window.__STORYWORLD_WEATHER_R450__?.placeOf;if(typeof f==='function')return f(r)?.kind||'out';}catch(_){}
 try{return window.__STORYWORLD_PROPS_PLACE_R406__?.indoorOf?.(r)?'in':'out';}catch(_){return'out';}}
// 실내라도 불꽃을 그대로 두는 곳: 검은 공방(화덕)·불타는 호텔(정본이 불길 속).
const FIRE_OK=new Set(['kair07','ep1b07']);
// 빛이 닿는 거리(장소별): 실외 등불은 탁 트인 땅에 넓고 옅게 퍼진다(반지름 ×1.25·세기 ×1.12), 동굴은 그 사이, 건물 안은 방 크기 그대로.
//  (보정 2026-11-09: 실외 화면이 89~92% 어두워 호러 규칙 70~85% 를 넘었다 → 등불 웅덩이를 넓혀 78~87%)
const REACH=Object.freeze({out:Object.freeze({k:1.12,r:1.25}),cave:Object.freeze({k:1.05,r:1.12}),in:Object.freeze({k:1,r:1}),void:Object.freeze({k:1,r:1})});
// 숨긴 소품(r303Hide: R303 문 곁·R412 벽 속·R449 공간 정리로 쉬는 R224 가구 — 화로 r80-039 포함)은 그려지지 않으니 빛도 내지 않는다.
const isLightProp=p=>{if(!p||p.r303Hide)return false;try{const f=window.__STORYWORLD_DARK_R123__?.isLight;return typeof f==='function'&&!!f(p);}catch(_){return false;}};

// 진짜 광원 목록(지역·소품 수·숨긴 소품 수가 바뀔 때만 다시 만든다 — R449 는 방을 처음 볼 때 R224 가구를 숨기고 제 가구를 붙인다)
let lightCache=null;
function collect(r){const L=r?.exploration;if(!L)return[];const r92=window.__STORYWORLD_VISUAL_R92__,r91=window.__STORYWORLD_VISUAL_R91__,T412=window.__STORYWORLD_PROPS_TIDY_R412__;
 let hid=0;for(const p of r.props||[])if(p&&p.r303Hide)hid++;
 const p92=r92?.lightPoints?.()||[],p91=r91?.lightPoints?.()||[],sig=[typeof zone!=='undefined'?zone:'',r.props?.length||0,hid,p92.length,p91.length,T412?.ver?.()||0,!!r.altar].join('|');
 if(lightCache&&lightCache.room===r&&lightCache.layout===L&&lightCache.sig===sig)return lightCache.list;
 const fam=familyOf(r),place=placeKind(r),indoor=place==='in',fireOk=FIRE_OK.has(r.id),G=REACH[place]||REACH.out,list=[];
 const add=(x,y,label,color,src)=>{if(!finite(x)||!finite(y))return;if(list.some(q=>Math.hypot(q.x-x,q.y-y)<.6))return;const type=classify(label,fam,indoor,color,fireOk),T=TYPE[type];
  const c=(type==='magic'||type==='lamp'&&color&&!indoor)&&Array.isArray(color)?color.slice(0,3):T.c;
  list.push({x,y,type,color:c,k:T.k*G.k,r:T.r*G.r,fl:T.fl,stutter:!!T.stutter,src,id:String(label||'').slice(0,48),ph:((Math.abs(x*12.9898+y*78.233)*43758.5453)%1)*6.283});};
 for(const p of p92)add(p.x,p.y,p.id,p.color,'r92');
 for(const p of p91)add(p.x,p.y,p.id,null,'r91');
 for(const p of r.props||[])if(isLightProp(p))add(p.x,p.y,[p.r74Prop,p.r105Prop,p.r115Prop,p.kind,p.id,p.path].join(' '),null,'prop');
 if(r.altar&&finite(r.altar.x+r.altar.y))add(r.altar.x,r.altar.y,'altar holy','','altar');
 for(const l of list)if(l.src==='altar'){l.type='holy';Object.assign(l,{color:TYPE.holy.c,k:TYPE.holy.k*G.k,r:TYPE.holy.r*G.r,fl:TYPE.holy.fl});}
 // 굽기 열쇠는 실제 빛 목록(자리·종류·세기·반지름) — R412 가 등과 상관없는 소품을 옮겨 판이 바뀌어도(들어간 뒤 10~13초) 빛이 그대로면 다시 굽지 않는다
 const lsig=list.map(l=>l.x.toFixed(2)+','+l.y.toFixed(2)+','+l.type+','+l.k.toFixed(3)+','+l.r.toFixed(2)+','+l.color.map(v=>(+v).toFixed(2)).join(':')).join('|');
 lightCache={room:r,layout:L,sig,lsig,list,fam,indoor,place};return list;}

// ---- 조명맵 굽기 -------------------------------------------------------------------------------------------------
// 칸(a,b) = [a,a+1)×[b,b+1) (explorationBlocked 와 같음). 텍셀 = 1/S 칸. 막힌 텍셀: 바닥 칸 밖 + 벽 자리.
//  벽은 충돌과 같은 축 정렬 상자(x,y 중심 · width=가로 폭 · depth=세로 폭)로 막는다 — R219 세로벽은 width .24·depth 10 이라
//  depth 를 '두께'로 읽으면 벽 둘레 5칸이 통째로 막혀 빛이 퍼지지 못한다(R451-1 실측: 벽 등 8개가 하나도 안 켜짐).
//  허리 아래 가구 충돌(높이 1.2 미만: 조리대·수레 등)은 빛을 막지 않는다. 반 텍셀 넓혀 .24 얇은 벽도 텍셀 두 줄로 막는다.
const LMAX=2,LOW_BLOCK=1.2;
function heapPush(h,d,i){h.push([d,i]);let k=h.length-1;while(k>0){const p=(k-1)>>1;if(h[p][0]<=h[k][0])break;[h[p],h[k]]=[h[k],h[p]];k=p;}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===k)break;[h[m],h[k]]=[h[k],h[m]];k=m;}}return top;}
function wallBox(w){if(!w||w.decorative)return null;if(finite(w.height)&&w.height<LOW_BLOCK)return null;
 if(finite(w.x+w.y+w.width+w.depth)&&w.width>0&&w.depth>0)return[w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2];
 if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const[a,b]=w.endpoints,t=(finite(w.thickness)?w.thickness:.24)/2;if(!finite(a[0]+a[1]+b[0]+b[1]))return null;
  return[Math.min(a[0],b[0])-t,Math.min(a[1],b[1])-t,Math.max(a[0],b[0])+t,Math.max(a[1],b[1])+t];}
 return null;}
function grid(L){const cells=L?.floorCells;if(!Array.isArray(cells)||!cells.length)return null;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const c of cells){const a=c[0],b=c[1];if(a<x0)x0=a;if(b<y0)y0=b;if(a>x1)x1=a;if(b>y1)y1=b;}
 const PAD=2,gx0=x0-PAD,gy0=y0-PAD,cw=x1-x0+1+2*PAD,ch=y1-y0+1+2*PAD,S=clamp(Math.floor(1024/Math.max(cw,ch)),2,4),W=cw*S,H=ch*S,open=new Uint8Array(W*H);
 for(const c of cells){const tx=(c[0]-gx0)*S,ty=(c[1]-gy0)*S;for(let j=0;j<S;j++){const row=(ty+j)*W;for(let i=0;i<S;i++)open[row+tx+i]=1;}}
 const half=.5/S+.01;let walls=0;
 for(const w of L.walls||[]){const b=wallBox(w);if(!b)continue;walls++;const ax=b[0]-half,ay=b[1]-half,bx=b[2]+half,by=b[3]+half;
  for(let y=Math.max(0,Math.floor((ay-gy0)*S));y<=Math.min(H-1,Math.ceil((by-gy0)*S));y++){const py=gy0+(y+.5)/S;if(py<ay||py>by)continue;
   for(let x=Math.max(0,Math.floor((ax-gx0)*S));x<=Math.min(W-1,Math.ceil((bx-gx0)*S));x++){const px=gx0+(x+.5)/S;if(px>=ax&&px<=bx)open[y*W+x]=0;}}}
 return{W,H,S,gx0,gy0,open,walls};}
// 씨앗 → 텍셀 직선이 열린 텍셀만 지나는지(반 텍셀 걸음). 벽은 늘 텍셀 두 줄 이상이라 대각선으로 새지 않는다.
function seen(open,W,sx,sy,tx,ty){const dx=tx-sx,dy=ty-sy,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))*2);for(let s=1;s<n;s++){const f=s/n;if(!open[Math.floor(sy+dy*f)*W+Math.floor(sx+dx*f)])return false;}return true;}
const bell=t=>t>=1?0:(1-t*t)*(1-t*t)*.72+(1-t)*(1-t)*(1-t)*.28;   // 종 모양 + 가까운 곳 조금 더 진하게
// 순수 계산(텍스처 없이) — qa/r451 이 직접 시험한다. L: {floorCells, walls}, lights: [{x,y,r,k,color}] → {G, acc(rgb), used}
function bakeAcc(L,lights){const G=grid(L);if(!G)return null;const{W,H,S,gx0,gy0,open}=G,acc=new Float32Array(W*H*3),dist=new Float64Array(W*H);/* 거리는 64비트 — 32비트로 반올림되면 꺼낸 값이 저장값보다 커져 'd>dist[k]' 로 건너뛴다 */
 const N8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];let used=0;
 for(const l of lights){const R=l.r*S,lx=(l.x-gx0)*S,ly=(l.y-gy0)*S,i0=Math.max(0,Math.floor(lx-R-2)),i1=Math.min(W-1,Math.ceil(lx+R+2)),j0=Math.max(0,Math.floor(ly-R-2)),j1=Math.min(H-1,Math.ceil(ly+R+2));
  for(let j=j0;j<=j1;j++)dist.fill(Infinity,j*W+i0,j*W+i1+1);
  // 씨앗: 광원 텍셀 하나. 막혔으면(벽 등·벽 붙은 소품) 1.5칸 안에서 가장 가까운 열린 텍셀 하나 — 여러 개를 심으면 얇은 벽 너머로 샌다.
  const h=[],seedR=1.5*S,li=Math.floor(lx),lj=Math.floor(ly);let sk=-1,sd=Infinity;
  if(li>=0&&lj>=0&&li<W&&lj<H&&open[lj*W+li]){sk=lj*W+li;sd=Math.hypot(li+.5-lx,lj+.5-ly);}
  else for(let j=Math.max(j0,Math.floor(ly-seedR));j<=Math.min(j1,Math.ceil(ly+seedR));j++)for(let i=Math.max(i0,Math.floor(lx-seedR));i<=Math.min(i1,Math.ceil(lx+seedR));i++){const k=j*W+i;if(!open[k])continue;
   const d=Math.hypot(i+.5-lx,j+.5-ly);if(d<=seedR&&d<sd){sd=d;sk=k;}}
  if(sk<0)continue;used++;dist[sk]=sd;heapPush(h,sd,sk);
  while(h.length){const[d,k]=heapPop(h);if(d>dist[k])continue;const i=k%W,j=(k-i)/W;
   for(const[di,dj,c]of N8){const ni=i+di,nj=j+dj;if(ni<i0||nj<j0||ni>i1||nj>j1)continue;const nk=nj*W+ni;if(!open[nk])continue;
    if(di&&dj&&(!open[j*W+ni]||!open[nj*W+i]))continue;                       // 대각선으로 벽 모서리를 깎아 지나가지 않는다
    const nd=d+c;if(nd<dist[nk]&&nd<=R){dist[nk]=nd;heapPush(h,nd,nk);}}}
  // 보이는 텍셀은 직선거리(둥근 웅덩이·빛 그림자 경계), 모퉁이 뒤는 돌아간 거리로 약하게(반사광 정도)만.
  const si=sk%W,sj=(sk-si)/W,sx=si+.5,sy=sj+.5,cr=l.color[0]*l.k,cg=l.color[1]*l.k,cb=l.color[2]*l.k;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*W+i,d=dist[k];if(!(d<=R))continue;const e=sd+Math.hypot(i+.5-sx,j+.5-sy);let f;
   if(e<=R&&seen(open,W,sx,sy,i+.5,j+.5))f=bell(e/R);else f=bell(d/R)*.3*Math.exp(-Math.max(0,d-e)/(S*.9));
   if(f>0){acc[k*3]+=cr*f;acc[k*3+1]+=cg*f;acc[k*3+2]+=cb*f;}}}
 // 한 번 부드럽게(열린 텍셀끼리만 [1,2,1]²) — 빛 그림자 경계가 계단처럼 보이지 않게, 벽 너머로는 섞지 않는다.
 const sm=new Float32Array(W*H*3),KW=[1,2,1];
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i;if(!open[k])continue;let ws=0,a0=0,a1=0,a2=0;
  for(let dj=-1;dj<=1;dj++){const y=j+dj;if(y<0||y>=H)continue;for(let di=-1;di<=1;di++){const x=i+di;if(x<0||x>=W)continue;const q=y*W+x;if(!open[q])continue;const w=KW[di+1]*KW[dj+1];ws+=w;a0+=acc[q*3]*w;a1+=acc[q*3+1]*w;a2+=acc[q*3+2]*w;}}
  sm[k*3]=a0/ws;sm[k*3+1]=a1/ws;sm[k*3+2]=a2/ws;}
 acc.set(sm);
 return{G,acc,used};}
function bake(o,r,rm,lights){const t0=performance.now(),B=bakeAcc(rm.exploration,lights);if(!B)return false;const{G,acc,used}=B,{W,H,S,gx0,gy0,open}=G;
 const data=new Uint8Array(W*H*4);for(let k=0;k<W*H;k++){data[k*4]=Math.min(255,acc[k*3]*255/LMAX);data[k*4+1]=Math.min(255,acc[k*3+1]*255/LMAX);data[k*4+2]=Math.min(255,acc[k*3+2]*255/LMAX);data[k*4+3]=open[k]?255:0;}
 const T=r.T;o.tex?.dispose?.();const tex=new T.DataTexture(data,W,H,T.RGBAFormat);tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearFilter;tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;tex.generateMipmaps=false;tex.needsUpdate=true;
 o.tex=tex;o.grid={W,H,S,gx0,gy0,open,acc};U.r451Map.value=tex;U.r451Box.value.set(gx0,gy0,S/W,S/H);
 stats.bakes++;stats.bakeMs=Math.round(performance.now()-t0);stats.lights=lights.length;stats.lightsUsed=used;stats.blockers=G.walls;stats.texels=W*H;return true;}
// CPU 쪽 같은 빛(소품 색·R453 영웅·몹 색·R450 먼지): 칸 좌표 → [r,g,b] (바탕빛 + 조명맵 + 영웅 빛, 깜빡임 제외).
function mapAt(x,y){const g=o451.grid;if(!g)return[0,0,0];const fx=(x-g.gx0)*g.S-.5,fy=(y-g.gy0)*g.S-.5,i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j,out=[0,0,0];let wsum=0;
 for(const[di,dj,w]of[[0,0,(1-u)*(1-v)],[1,0,u*(1-v)],[0,1,(1-u)*v],[1,1,u*v]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=g.W||b>=g.H)continue;const k=b*g.W+a;if(!g.open[k])continue;wsum+=w;for(let c=0;c<3;c++)out[c]+=g.acc[k*3+c]*w;}
 if(wsum>0&&wsum<1)for(let c=0;c<3;c++)out[c]/=wsum;                          // 벽에 붙은 발밑: 열린 쪽 빛만으로
 if(wsum===0){let best=null;for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const a=i+di,b=j+dj;if(a<0||b<0||a>=g.W||b>=g.H)continue;const k=b*g.W+a;if(!g.open[k])continue;const s=g.acc[k*3]+g.acc[k*3+1]+g.acc[k*3+2];if(!best||s>best[0])best=[s,k];}
  if(best)for(let c=0;c<3;c++)out[c]=g.acc[best[1]*3+c];}
 return out;}
function lightAt(x,y,opt={}){if(!o451.owned||!finite(x+y))return null;const m=mapAt(x,y),a=o451.amb,h=o451.hero,c=HERO.c;
 const hd=h?Math.hypot(x-h.x,y-h.y)/HERO.r:9,hk=opt.noHero?0:HERO.k*o451.heroK*(1-smooth(0,1,hd));
 return[shoulder(a.c[0]*a.k+m[0]+c[0]*hk),shoulder(a.c[1]*a.k+m[1]+c[1]*hk),shoulder(a.c[2]*a.k+m[2]+c[2]*hk)];}

// ---- 셰이더 덧붙이기 ----------------------------------------------------------------------------------------------
let U=null;
function uniforms(T){if(U)return U;U={r451On:{value:0},r451Map:{value:null},r451Box:{value:new T.Vector4(0,0,1,1)},r451Amb:{value:new T.Vector3(1,1,1)},
 r451Hero:{value:new T.Vector4(0,0,6,0)},r451HeroC:{value:new T.Vector3(1,.93,.82)},r451Fl:{value:Array.from({length:4},()=>new T.Vector4(0,0,1,0))},r451Top:{value:.28}};return U;}
const HEAD=`#define R451_KNEE ${KNEE}
#define R451_SH ${SHOULDER}
uniform float r451On;uniform sampler2D r451Map;uniform vec4 r451Box;uniform vec3 r451Amb;uniform vec4 r451Hero;uniform vec3 r451HeroC;uniform vec4 r451Fl[4];uniform float r451Top;
varying vec3 r451P;varying vec3 r451N;
vec3 r451Light(){vec3 n=r451N;bool vert=abs(n.y)<.6;vec2 q=r451P.xz;
 if(vert){vec2 h=n.xz;float hl=length(h);if(hl>1e-4)q+=h/hl*.42;}
 vec2 uv=(q-r451Box.xy)*r451Box.zw;vec3 lm=vec3(0.);
 if(uv.x>0.&&uv.y>0.&&uv.x<1.&&uv.y<1.){vec4 s=texture2D(r451Map,uv);lm=s.a>.004?s.rgb/s.a*${LMAX}.:vec3(0.);}
 float f=1.;for(int i=0;i<4;i++){vec4 F=r451Fl[i];f+=F.w*(1.-smoothstep(0.,F.z,length(r451P.xz-F.xy)));}lm*=max(f,0.);
 float up=1.;if(vert)up=mix(1.,.5,smoothstep(1.1,3.,r451P.y));else if(r451P.y>.3)up=r451Top;lm*=up;
 float hd=length(r451P.xz-r451Hero.xy)/max(r451Hero.z,.1);float hk=r451Hero.w*(1.-smoothstep(0.,1.,hd))*(vert?.82:(r451P.y>.3?.4:1.));
 vec3 L=r451Amb+lm+r451HeroC*hk;L=mix(L,R451_KNEE+R451_SH*(1.-exp(-(L-R451_KNEE)/R451_SH)),step(vec3(R451_KNEE),L));
 return mix(vec3(1.),L,r451On);}
`;
// 맵 텍셀 알파 = 열린 칸(255)/막힌 칸(0). 선형 보간에서 막힌 텍셀(빛 0)이 섞여 벽가 바닥이 검게 번지지 않도록 rgb/a 로 되돌린다.
const patched=new WeakMap();
const SKIP_NAME=/^r(89-retro|300|450|451|453)|halo|fog|pool|-dim$|mote|haze|sky|decor-lit|glow|surgeon|marker|guidance|warn|telegraph|target|select|cursor|shadow-blob/i;
function eligible(o,rowMeshes){if(o?.isSprite){const m=o.material,name=String(o.name||o.parent?.name||'');   // R204 풀 포기(Sprite) — 예전엔 R89 화면 빛이 함께 어둡게 했다
  if(!m?.isSpriteMaterial||!m.map||m.blending!==undefined&&m.blending!==1||o.userData?.r450||o.userData?.r451||SKIP_NAME.test(name))return null;return[m];}
 if(!o?.isMesh||o.isInstancedMesh&&!o.instanceMatrix)return null;if(rowMeshes.has(o))return null;const name=String(o.name||'');
 if(o.userData?.r450||o.userData?.r451||SKIP_NAME.test(name))return null;
 const mats=Array.isArray(o.material)?o.material:[o.material];const ok=[];
 for(const m of mats){if(!m||!(m.isMeshBasicMaterial||m.isMeshStandardMaterial||m.isMeshLambertMaterial))continue;
  if(m.transparent&&!m.map&&!m.vertexColors)continue;                          // 맨 색 반투명(표시·안내 판)은 그대로
  if(m.blending!==undefined&&m.blending!==1)continue;                           // 더하기·곱하기 섞기(빛·그림자 효과)는 그대로
  ok.push(m);}
 return ok.length?ok:null;}
function patch(m,T){if(patched.has(m))return;const u=uniforms(T),before=m.onBeforeCompile,key=m.customProgramCacheKey;
 if(m.isSpriteMaterial){// 판 그림: 판 중심(발) 위치의 빛을 받는다. 세운 판이라 벽 옆면처럼(앞 바닥 빛) — 법선은 카메라 쪽 수평.
  const sw=function(shader,...args){if(typeof before==='function')before.call(this,shader,...args);Object.assign(shader.uniforms,u);
   if(!shader.vertexShader.includes('varying vec3 r451P;'))shader.vertexShader='varying vec3 r451P;varying vec3 r451N;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n'+
    '{r451P=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;vec3 r451V=-(transpose(mat3(viewMatrix))*vec3(0.,0.,-1.));r451V.y=0.;r451N=dot(r451V,r451V)>1e-6?normalize(r451V):vec3(0.,0.,1.);}');
   if(!shader.fragmentShader.includes('uniform float r451On;'))shader.fragmentShader=HEAD+shader.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\ngl_FragColor.rgb*=r451Light();');};
  if(typeof before==='function')for(const k of Object.keys(before))sw[k]=before[k];
  m.onBeforeCompile=sw;m.customProgramCacheKey=function(){return(typeof key==='function'?key.call(this):'')+'|r451s';};m.needsUpdate=true;patched.set(m,true);stats.patched++;stats.sprites=(stats.sprites||0)+1;return;}
 const wrapper=function(shader,...args){if(typeof before==='function')before.call(this,shader,...args);Object.assign(shader.uniforms,u);
  if(!shader.vertexShader.includes('varying vec3 r451P;'))shader.vertexShader='varying vec3 r451P;varying vec3 r451N;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+
   '{vec4 r451W=vec4(transformed,1.);vec3 r451Nn=normal;\n#ifdef USE_INSTANCING\nr451W=instanceMatrix*r451W;r451Nn=mat3(instanceMatrix)*r451Nn;\n#endif\nr451W=modelMatrix*r451W;r451P=r451W.xyz;vec3 r451M=mat3(modelMatrix)*r451Nn;r451N=dot(r451M,r451M)>1e-8?normalize(r451M):vec3(0.,1.,0.);}');
  if(!shader.fragmentShader.includes('uniform float r451On;')){shader.fragmentShader=HEAD+shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.rgb*=r451Light();');}};
 if(typeof before==='function')for(const k of Object.keys(before))wrapper[k]=before[k];
 m.onBeforeCompile=wrapper;m.customProgramCacheKey=function(){return(typeof key==='function'?key.call(this):'')+'|r451';};m.needsUpdate=true;patched.set(m,true);stats.patched++;}
function patchScene(r){const T=r.T,rows=new WeakSet();for(const row of r.commands?.rows?.values?.()||[])if(row?.mesh)rows.add(row.mesh);
 r.scene.traverse(o=>{if(!(o.layers.mask&4))return;const ms=eligible(o,rows);if(ms)for(const m of ms)patch(m,T);});}

// ---- 한 프레임 ------------------------------------------------------------------------------------------------
const o451={owned:false,tex:null,grid:null,key:null,amb:AMB.regional,hero:null,heroK:1,lights:[],nextScan:0,scanSig:'',stutterAt:0,stutterIdx:-1,stutterUntil:0};
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode;return !m||m()==='off';}catch(_){return true;}};
const sightOn=()=>window.__STORYWORLD_SIGHT24__?.enabled===true;
const reduced=f=>!!(f?.settings?.reducedMotion||typeof settings!=='undefined'&&settings?.reducedMotion);
function wantFor(frame){return !disposed&&prefs.on&&!!frame&&frame.layer==='STORY'&&solo()&&!sightOn()&&typeof room!=='undefined'&&!!room?.exploration?.floorCells?.length;}
function update(r,frame){const want=wantFor(frame);const u=uniforms(r.T);
 if(!want){o451.owned=false;u.r451On.value=0;return;}
 const lights=collect(room),key=[room.exploration?.floorCells?.length,lightCache?.lsig].join('#');
 if(o451.key!==key||o451.layout!==room.exploration||!o451.tex){o451.key=key;o451.layout=room.exploration;o451.lights=lights;if(!bake(o451,r,room,lights)){o451.owned=false;u.r451On.value=0;return;}}
 else o451.lights=lights;/* 같은 빛(굽기 그대로)이어도 목록은 새것으로 — 깜빡임·먼 등불 구멍·R453 이 쓰는 목록 */
 const t=performance.now();if(t>=o451.nextScan){o451.nextScan=t+500;try{patchScene(r);}catch(e){fail(e);}}
 const fam=lightCache?.fam||'regional',a=ambientFor(fam,lightCache?.place||'out');o451.amb=a;u.r451Amb.value.set(a.c[0]*a.k,a.c[1]*a.k,a.c[2]*a.k);
 const hero=frame.entities?.find?.(e=>e.hero&&finite(e.x+e.y))||(typeof player!=='undefined'&&player&&finite(player.x+player.y)?player:null);o451.hero=hero?{x:hero.x,y:hero.y}:null;
 o451.heroK=fam==='snow'?.6:lightCache?.place==='cave'?1.1:1;
 if(hero){u.r451Hero.value.set(hero.x,hero.y,HERO.r,HERO.k*o451.heroK);u.r451HeroC.value.set(...HERO.c);}else u.r451Hero.value.w=0;
 // 깜빡임: 영웅에 가까운 불꽃·등잔 4개(화면 안 쪽). 형광등은 가끔 한 번 '툭' 꺼질 듯 떨린다(6~14초에 90ms, 공포 연출 — 움직임 줄이기에서는 없음).
 const tm=(frame.time??performance.now()/1000),calm=!prefs.flicker||reduced(frame);let n=0;
 if(hero){const near=o451.lights.filter(l=>(l.fl>0||l.stutter)&&Math.hypot(l.x-hero.x,l.y-hero.y)<16).sort((p,q)=>Math.hypot(p.x-hero.x,p.y-hero.y)-Math.hypot(q.x-hero.x,q.y-hero.y)).slice(0,4);
  for(const l of near){let w=0;if(!calm){if(l.fl>0)w=l.fl*(Math.sin(tm*7.3+l.ph)*.55+Math.sin(tm*13.1+l.ph*2.3)*.3+Math.sin(tm*2.1+l.ph*.7)*.15);
    else if(l.stutter){if(t>o451.stutterAt){o451.stutterAt=t+6000+((l.ph*1000)%8000);o451.stutterUntil=t+90;o451.stutterIdx=Math.round(l.x*31+l.y*17);stats.stutters++;}
     if(t<o451.stutterUntil&&o451.stutterIdx===Math.round(l.x*31+l.y*17))w=-.45;}}
   u.r451Fl.value[n++].set(l.x,l.y,l.r*.85,w);}}
 for(;n<4;n++)u.r451Fl.value[n].set(0,0,1,0);
 u.r451On.value=1;o451.owned=true;stats.owned++;}

// 바닥 소품(그림 명령 줄): 발밑 빛으로 색을 곱하고 그리기 뒤 되돌린다(R89 소품 어둡게와 같은 자리·방식).
const GL_TOKEN={};
function wrapGL(r){const gl=r.renderer;if(!gl||gl.r451Wrapped===GL_TOKEN)return;const base=gl.render;
 gl.render=function(scene,camera){const restore=[];
  try{const pass=camera?.layers?.mask;if(o451.owned&&scene===r.scene&&camera===r.camera&&(pass===4||pass===8)){// 세계 층(2)·덧그림 층(3) 모두 — 그 층에 있는 소품 줄만
    for(const row of r.commands?.rows?.values?.()||[]){const ow=row.geometryState?.owner,m=row.mesh?.material;if(!ow||ow.kind!=='prop'||!m?.color||!row.mesh.visible||!(row.mesh.layers.mask&pass)||!finite(ow.x+ow.y))continue;
     const L=lightAt(ow.x,ow.y);if(!L)continue;const k=[clamp(L[0],.3,1.5),clamp(L[1],.3,1.5),clamp(L[2],.3,1.5)];const rr=m.color.r,gg=m.color.g,bb=m.color.b;restore.push(()=>m.color.setRGB(rr,gg,bb));
     m.color.setRGB(rr*k[0],gg*k[1],bb*k[2]);stats.rowsLit++;}}}catch(e){fail(e);}
  try{return base.call(this,scene,camera);}finally{for(let i=restore.length-1;i>=0;i--)restore[i]();}};
 gl.r451Wrapped=GL_TOKEN;}

// ---- 렌더러 감싸기(프로토타입 + 인스턴스 — perf-r97 이 인스턴스에 render 를 복사해 둔다) ------------------------------
const wrappedTargets=new WeakSet();
function wrapFn(fn){const w=function(frame){try{if(!disposed&&this?.T&&this.scene&&this.__r451Frame!==frame){this.__r451Frame=frame;stats.frames++;update(this,frame);if(this.renderer)wrapGL(this);}}catch(e){fail(e);try{uniforms(this.T).r451On.value=0;o451.owned=false;}catch(_){}}
  try{return fn.apply(this,arguments);}finally{if(this)this.__r451Frame=undefined;}};w.__r451=true;return w;}
function wrapOnce(target){if(!target||wrappedTargets.has(target)||typeof target.render!=='function')return;wrappedTargets.add(target);target.render=wrapFn(target.render);}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const proto=r?Object.getPrototypeOf(r):C;
 wrapOnce(proto);if(r&&Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();
try{const d=C.dispose;if(d&&!d.__r451){C.dispose=function(...a){try{o451.tex?.dispose?.();o451.tex=null;o451.grid=null;o451.key=null;}catch(_){}return d.apply(this,a);};C.dispose.__r451=true;}}catch(e){fail(e);}

// ---- 다른 층이 묻는 것 -------------------------------------------------------------------------------------------
// owns(): R89 화면 빛·R300 어둡게·웅덩이·R123 가짜 불빛이 쉴지. 그리기 루프(R123·R182) 쪽에서도 부르므로 전역으로 판단한다.
function owns(){return o451.owned&&!disposed&&prefs.on&&typeof layer!=='undefined'&&layer==='STORY'&&!sightOn();}
// R335 원형 어둠 캔버스에 먼 등불 자리 구멍(destination-out). 영웅 둘레(이미 밝음)는 건너뛴다.
function glowHoles(g){if(!owns()||typeof project!=='function'||typeof player==='undefined'||!player)return 0;const U0=(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1);let n=0;
 const w=typeof W==='number'?W:1280,h=typeof H==='number'?H:800,prev=g.globalCompositeOperation;g.globalCompositeOperation='destination-out';
 try{for(const l of o451.lights){if(n>=14)break;const d=Math.hypot(l.x-player.x,l.y-player.y);if(d<3.5)continue;const q=project(l.x,l.y),rx=l.r*U0*1.15;
   if(q.x<-rx||q.x>w+rx||q.y<-rx||q.y>h+rx)continue;const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,rx),a=.78*l.k;gr.addColorStop(0,'rgba(0,0,0,'+a.toFixed(3)+')');gr.addColorStop(.45,'rgba(0,0,0,'+(a*.55).toFixed(3)+')');gr.addColorStop(1,'rgba(0,0,0,0)');
   g.fillStyle=gr;g.save();g.translate(q.x,q.y);g.scale(1,.58);g.translate(-q.x,-q.y);g.beginPath();g.arc(q.x,q.y,rx,0,Math.PI*2);g.fill();g.restore();n++;}}
 finally{g.globalCompositeOperation=prev;}stats.holes=n;return n;}
// R335 원형 어둠(사용자가 고른 기본) 가장자리 세기: 국지 조명이 빛을 맡을 때는 6할로 — 원 모양·반경은 그대로 두고, 먼 곳 등불·바닥 결이 읽히게.
// 눈밭(snow)은 바닥이 희어 원형 어둠을 거의 그대로(9할) 둔다 — 덜어내면 눈보라 숲·설원이 우윳빛으로 떠서 '빛이 닿는 반경'이 사라진다.
const GLOW_SCALE=.6,GLOW_FAM=Object.freeze({snow:.9});function glowEdge(base){const b=finite(base)?base:.6;return owns()?+(b*(GLOW_FAM[lightCache?.fam]??GLOW_SCALE)).toFixed(3):b;}
// R450 먼지·R453 몸 색이 쓰는 광원 목록(칸 좌표).
function lights(){return o451.owned?o451.lights.map(l=>({x:l.x,y:l.y,r:l.r,k:l.k,color:l.color.slice(),type:l.type})):[];}

// ---- 설정 ----------------------------------------------------------------------------------------------------
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){for(const k in DEFAULTS)if(typeof p[k]==='boolean')prefs[k]=p[k];save();if(!prefs.on){o451.owned=false;if(U)U.r451On.value=0;}return{...prefs};}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('localLightR451'))return;
 const s=document.createElement('section');s.id='localLightR451';
 s.innerHTML='<h3>국지 조명 (R451)</h3><p class="small muted">등불·촛불·전구 둘레만 바닥과 벽이 실제로 밝아지고, 빛은 벽에 막힙니다. 끄면 예전 빛으로 돌아갑니다. 화면 표현만 바꿉니다.</p>'+
  [['on','광원 둘레 국지 조명'],['flicker','불꽃 깜빡임·형광등 떨림']].map(([k,l])=>'<label><input type="checkbox" data-r451="'+k+'"> '+l+'</label>').join(' ');
 panel.appendChild(s);s.querySelectorAll('[data-r451]').forEach(el=>{el.checked=!!prefs[el.dataset.r451];el.onchange=()=>set({[el.dataset.r451]:el.checked});});}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!disposed)settingsSection();}catch(e){fail(e);}return r;};}

function dispose(){disposed=true;if(timer)clearInterval(timer);o451.owned=false;if(U)U.r451On.value=0;try{o451.tex?.dispose?.();}catch(_){}o451.tex=null;o451.grid=null;}
window.__STORYWORLD_LOCAL_LIGHT_R451__=Object.freeze({revision:REV,storageKey:KEY,types:TYPE,ambient:AMB,ambientIn:AMB_IN,ambientCave:AMB_CAVE,prefs:()=>({...prefs}),set,owns,lightAt,lights,glowHoles,glowEdge,classify,ambientFor,dispose,
 pure:Object.freeze({wallBox,grid,seen,bell,shoulder,bakeAcc,LMAX,KNEE,SHOULDER,FIRE_OK:[...FIRE_OK],REACH,GLOW_SCALE,GLOW_FAM}),
 inspect:()=>({revision:REV,prefs:{...prefs},owned:o451.owned,stats:{...stats},lastError,family:lightCache?.fam||null,indoor:lightCache?.indoor??null,place:lightCache?.place||null,ambient:o451.amb,
  lights:o451.lights.map(l=>({x:+l.x.toFixed(2),y:+l.y.toFixed(2),type:l.type,src:l.src,id:l.id})),grid:o451.grid?{W:o451.grid.W,H:o451.grid.H,S:o451.grid.S}:null,
  collisionChanged:false,gameplayChanged:false,GPUVerified:false})});
})();
