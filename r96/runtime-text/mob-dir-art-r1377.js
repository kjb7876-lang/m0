// R1377 2D 몹·보스 상·하·옆 공격·이동 그림 — 사용자 2026-11-27 "2d몹들 상하옆(좌우반전)공격이동모션 크기및 동작일관성있게 어색함없게 닷츠랑상호작용해서 전수조사해서 적용 … 특히일관성부분".
//  전수조사(qa/r1377/census.mjs, 95지역): 2D 몸 272종 가운데 위·아래 공격 전용 그림은 없고(옆 그림을 그대로 씀), 위·아래 걷기는 R974·R1018 표 49종만.
//  Dots SW-2D-R1377 시트(512칸, 발 488, 같은 몹은 한 축척)를 표(mob-dir-art-r1377-data.js)로 받아
//  · 공격: 영웅이 화면에서 위·아래에 있으면(세로가 가로의 1.25배 넘음) atk_up/atk_down, 아니면 atk_side(영웅 쪽을 봄). 방향은 한 번 휘두르는 동안 고정.
//    칸은 공격 진행도로 고른다: 준비(windup) → 치기(가운데 칸, active) → 회수(recovery). 판정·피해·시간은 그대로(그림만).
//  · 걷기: 화면 진행 방향(R974 와 같은 1.25/.8 문턱)으로 walk_up/down/side, 칸은 걸은 거리로 넘긴다(미끄러짐 없음). 옆은 가는 쪽으로 뒤집는다.
//  · 대기·피격: 표에 idle_side/hit_side 가 있을 때만.
//  · 크기·발: 그 몹이 마지막으로 서 있던 엔진 대기 그림(표의 idle, 경로·칸이 같을 때)의 몸통 키·발 줄·가운데를 화면 한 칸 길이로 나눠 기억해 두고,
//    시트를 같은 몸통 키·같은 발 줄·같은 가운데에 놓는다(다른 덧씌우기가 키운 크기·화면 배율을 그대로 따른다). 대기를 아직 못 봤으면 바꾸지 않는다(크기 짐작 금지).
//  · R974 가 맨 바깥 drawEnemy 감싸기에서 moveArt 다음에 post() 를 부른다(감싸기를 새로 만들지 않음 — R1344 핑퐁 방지).
//  끄기: localStorage['storyworld.r1377.dirArt']='{"on":false}'. 점검: window.__STORYWORLD_MOB_DIR_ART_R1377__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOB_DIR_ART_R1377__)return;
const REV='R1377-dir-art-1',KEY='storyworld.r1377.dirArt';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={posts:0,swapped:0,atk:0,walk:0,idle:0,hit:0,noRef:0,waiting:0,errors:0};let last=null,lastError=null;
const DATA=()=>window.__STORYWORLD_MOB_DIR_ART_R1377_DATA__?.enemies||{};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|death|dissol|burn/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.currentSrc||c?.image?.src||'');
const Hq=c=>Math.abs(c.points[3][1]-c.points[0][1]);
function entry(e){if(!prefs.on||!e||!(e.hp>0)||e.persona||e.disabled)return null;const D=DATA(),id=String(e.nativeId||''),z=typeof room!=='undefined'&&room?.id?String(room.id):'';return (z&&D[id+'@'+z])||D[id]||null;}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}
 try{if(typeof addImage==='function')addImage(p,'R1377 방향 그림');}catch(_){}return null;}
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.r620Ghost||c.r760Ghost||!Array.isArray(c.points)||c.points.length<4)continue;
  if(FX.test(srcOf(c))&&!/assets\/r974\/|assets\/r1377\/|\/mobs\/hexagram-experiment|assets\/r\d+\/move\//.test(srcOf(c)))continue;const h=Hq(c);if(h>bh){bh=h;best=c;}}return best;}
function idleOf(D,c){const p=srcOf(c).split('?')[0],r=c.sourceRect;for(const I of D.idle){if(!p.endsWith(I.path))continue;if(!Array.isArray(r)||r.length<4)return I;
  if(I.rect.every((v,i)=>Math.abs(v-r[i])<=1.5))return I;}return null;}
const ST=new WeakMap();const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={wx:NaN,wy:NaN,lastT:-1,hx:0,hy:0,move:0,dir:'side',sideSg:1,stride:0,ref:null,akey:null,adir:null,asg:1,aT0:0,rwMax:0});return s;};
// 화면 한 칸 길이(배율이 바뀌어도 기억한 크기가 따라가게)
function unitAt(x,y){try{const a=project(x,y),b=project(x+1,y);const u=Math.hypot(b.x-a.x,b.y-a.y);return u>1e-6&&Number.isFinite(u)?u:null;}catch(_){return null;}}
function track(e,s){const t=T(),dt=s.lastT<0?0:Math.max(0,Math.min(.1,t-s.lastT));if(s.lastT>=0&&dt<=0)return;s.lastT=t;
 if(Number.isFinite(s.wx)&&dt>0){const d=Math.hypot(e.x-s.wx,e.y-s.wy),sp=d/dt,jump=d>.9;
  if(!jump){if(sp>.18)s.stride+=d;let sx,sy;try{const a=project(s.wx,s.wy),b=project(e.x,e.y);sx=(b.x-a.x)/dt;sy=(b.y-a.y)/dt;}catch(_){sx=sy=NaN;}
   if(Number.isFinite(sx)&&Number.isFinite(sy)&&sp>.18){const k=Math.min(1,dt*6);s.hx+=(sx-s.hx)*k;s.hy+=(sy-s.hy)*k;const ax=Math.abs(s.hx),ay=Math.abs(s.hy),v=s.dir==='up'||s.dir==='down';
    if(v?ay<ax*.8:!(ay>ax*1.25)){s.dir='side';if(ax>1e-6)s.sideSg=s.hx>0?1:-1;}else s.dir=s.hy<0?'up':'down';}}
  s.move+=(((!jump&&sp>.18)?1:0)-s.move)*Math.min(1,dt*8);}
 s.wx=e.x;s.wy=e.y;}
// 지금 공격 중인가 + 진행 단계. 반환 {key, ph:'windup'|'active'|'recovery', p:0..1}
function attackOf(e,s,t){const A=e.attack;
 if(A&&typeof A==='object'){const sh=A.shape154||e.combatProfile?.attackShape||{},W=Number(A.castWindup150??sh.windup)||0,Ac=Number(sh.active)||0,Rc=Number(sh.recovery)||0,el=Number(A.elapsed)||0;
  if(W+Ac+Rc<=0)return {key:A,ph:'windup',p:Math.min(1,el/.6)};
  if(el<W)return {key:A,ph:'windup',p:W>0?el/W:1};if(el<W+Ac)return {key:A,ph:'active',p:0};return {key:A,ph:'recovery',p:Rc>0?Math.min(1,(el-W-Ac)/Rc):1};}
 if(e.storyAttackState5&&t<e.storyAttackUntil5){const key='s'+e.storyAttackStart5+'|'+e.storyAttackUntil5,st=e.storyAttackStart5,tail=e.storyAttackUntil5-.12;
  if(s.akey!==key)s.aT0=t;
  if(t<st)return {key,ph:'windup',p:st>s.aT0?(t-s.aT0)/(st-s.aT0):1};if(t<tail)return {key,ph:'active',p:0};return {key,ph:'recovery',p:Math.min(1,(t-tail)/.12)};}
 if(s.artAtk){const el=T()-s.artT0;return {key:'art'+s.artT0,ph:el<.32?'windup':el<.46?'active':'recovery',p:el<.32?el/.32:el<.46?0:Math.min(1,(el-.46)/.3)};}
 if(e.rangedWindup>0){const key='rw';if(s.akey!==key||e.rangedWindup>s.rwMax)s.rwMax=e.rangedWindup;return {key,ph:'windup',p:s.rwMax>0?1-e.rangedWindup/s.rwMax:0};}
 return null;}
function atkCell(n,a){const k=Math.floor(n/2);if(a.ph==='active')return k;if(a.ph==='windup')return Math.max(0,Math.min(k-1,Math.floor(a.p*k)));
 return Math.max(k+1,Math.min(n-1,k+1+Math.floor(a.p*(n-k-1))));}
function heroDir(e){try{const pl=typeof player==='object'&&player?player:null;if(!pl)return null;const a=project(e.x,e.y),b=project(pl.x,pl.y),dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dy)>Math.abs(dx)*1.25)return {dir:dy<0?'up':'down',sg:1};
  let sg=dx<0?-1:1;try{const F=window.__STORYWORLD_ENEMY_FACE_R444__;if(F&&typeof F.left==='function'){const l=F.left(e);if(typeof l==='boolean')sg=l?-1:1;}}catch(_){}
  return {dir:'side',sg};}catch(_){return null;}}
function remember(e,s,D,c){const I=idleOf(D,c);if(!I)return;const G=project(e.x,e.y),u=unitAt(e.x,e.y);if(!u||!G)return;
 const P=c.points,px=I.pad?.[0]||0,py=I.pad?.[1]||0,W=(P[1][0]-P[0][0])/(1+2*px),H=Hq(c)/(1+2*py),top=Math.min(P[0][1],P[3][1])+py*H,[,,rw,rh]=I.rect,B=I.bbox;
 const vis=H*I.body/rh,foot=top+H*B[3]/rh,cx=P[0][0]+W*(px+(B[0]+B[2])/2/rw);if(![vis,foot,cx].every(Number.isFinite)||vis<=0)return;
 /* 엔진 대기 그림이 출렁이거나(대기 애니) 대기 변형 그림이 번갈아 나와도 기준 키·발 줄이 흔들리지 않게 천천히 따라간다(R1377b QA 발 줄 폭) */
 const n={visU:vis/u,footU:(foot-G.y)/u,cxU:(cx-G.x)/u*(W<0?-1:1)},o=s.ref,q=o?.08:1;
 s.ref={visU:o?o.visU+(n.visU-o.visU)*q:n.visU,footU:o?o.footU+(n.footU-o.footU)*q:n.footU,cxU:o?o.cxU+(n.cxU-o.cxU)*q:n.cxU,flip:W<0?-1:1};
 s.art={image:c.image,path:c.sourcePath,rect:Array.isArray(c.sourceRect)?c.sourceRect.slice():null,size:Array.isArray(c.imageSize)?c.imageSize.slice():null,rel:P.map(([x,y])=>[(x-G.x)/u,(y-G.y)/u]),flip:W<0?-1:1,h:Hq(c)/u};}
// 막은 그림(표 block: 다른 인물·다른 결로 그려진 걷기·공격·피격 그림) 대신 마지막 대기 그림을 같은 자리에 — 걸을 때 출렁임, 칠 때 영웅 쪽으로 살짝 숙임, 맞을 때 뒤로.
//  Dots 가 같은 인물로 그린 시트가 표에 들어오면 그 시트가 먼저다(이건 그 전까지의 일관성 지킴이).
function blocked(D,c){const B=D.block;if(!Array.isArray(B)||!B.length)return false;const p=srcOf(c);return B.some(b=>p.includes(b));}
function holdIdle(e,s,c,cmds,st0,mode,a){const A=s.art;if(!A||!A.image)return false;const G=project(e.x,e.y),u=unitAt(e.x,e.y);if(!u||!G)return false;
 let sg=A.flip,dx=0,dy=0,sq=1;const h=A.h*u;
 if(mode==='atk'){if(s.adir==='side')sg=s.asg;const k=a?.ph==='active'?1:a?.ph==='windup'?-.35*(a.p||0):Math.max(0,1-(a?.p||0));
  if(s.adir==='side')dx=sg*h*.05*k;else dy=(s.adir==='down'?1:-1)*h*.035*k;sq=1-.03*Math.max(0,-k);}
 else if(mode==='walk'){if(s.dir==='side')sg=s.sideSg;const st=Math.sin((s.stride/.72)*Math.PI*2);dy=-Math.abs(st)*h*.02;dx=st*h*.012;}
 else if(mode==='hit'){const q=Math.min(1,e.hitTimer/.15);dx=-A.flip*h*.04*q;}
 const m=sg*A.flip;
 for(let i=cmds.length-1;i>=st0;i--){const k=cmds[i];if(k!==c&&k?.kind==='image'&&k.r620Ghost&&k.owner?.kind==='enemy')cmds.splice(i,1);}
 c.points=A.rel.map(([x,y])=>[G.x+x*u*m+dx,G.y+(y*u)*(y<0?sq:1)+dy]);c.image=A.image;c.sourcePath=A.path;if(A.rect)c.sourceRect=A.rect.slice();if(A.size)c.imageSize=A.size.slice();c.r1377=true;c.r1377Hold=mode;
 stats.held=(stats.held||0)+1;return true;}
// 시트가 없는 방향은 엔진 그림을 그대로 두되, 그 그림 파일(같은 인물)의 실제 몸 키 중앙값·발 줄을 기억한 대기 몸통 키·발 줄에 맞춘다
//  (엔진이 상태마다 다른 배율로 그려 몸이 커졌다 작아졌다 하던 것 — 칸마다 배우지 않아 자세 차이는 그대로 남는다).
const ABOX=new Map(),PATHB=new Map();
function abox(c){const r=Array.isArray(c.sourceRect)&&c.sourceRect.length>=4?c.sourceRect:null,p=srcOf(c).split('?')[0],k=p+'|'+(r?r.join(','):'');
 if(ABOX.has(k))return ABOX.get(k);let v=null;
 try{const im=c.image;if(im&&im.complete!==false&&r&&r[2]>0&&r[3]>0&&typeof document!=='undefined'&&document.createElement){
  const Hh=64,Ww=Math.max(4,Math.min(128,Math.round(Hh*r[2]/r[3]))),cv=document.createElement('canvas');cv.width=Ww;cv.height=Hh;const g=cv.getContext('2d',{willReadFrequently:true});
  g.drawImage(im,r[0],r[1],r[2],r[3],0,0,Ww,Hh);const d=g.getImageData(0,0,Ww,Hh).data,rows=[];let m=0;
  for(let y=0;y<Hh;y++){let n=0;for(let x=0;x<Ww;x++)if(d[(y*Ww+x)*4+3]>24)n++;rows.push(n);if(n>m)m=n;}
  if(m>0){let t=-1,b=-1;for(let y=0;y<Hh;y++)if(rows[y]>=m*.12){if(t<0)t=y;b=y;}if(t>=0)v={h:(b-t+1)/Hh,b:(b+1)/Hh};}}}catch(_){v=null;}
 ABOX.set(k,v);if(v){let L=PATHB.get(p);if(!L)PATHB.set(p,L=[]);if(L.length<24)L.push(v);}return v;}
const med=a=>{const q=a.slice().sort((x,y)=>x-y);return q[q.length>>1];};
function fitEngine(e,s,c){if(c.r1377||c.r1377Fit||!s.ref)return false;const v=abox(c);if(!v)return false;const L=PATHB.get(srcOf(c).split('?')[0]);if(!L||!L.length)return false;
 const G=project(e.x,e.y),u=unitAt(e.x,e.y);if(!u||!G)return false;const h=Hq(c),mh=med(L.map(q=>q.h)),mb=med(L.map(q=>q.b));if(!(h>0&&mh>0))return false;
 const g=s.ref.visU*u/(mh*h),P=c.points,top=Math.min(P[0][1],P[1][1]),fy=top+h*mb,cx=(P[0][0]+P[1][0])/2,dy=G.y+s.ref.footU*u-fy;
 if(!Number.isFinite(g)||g<.4||g>2.5||!Number.isFinite(dy))return false;
 c.points=P.map(([x,y,...r])=>[cx+(x-cx)*g,fy+(y-fy)*g+dy,...r]);c.r1377Fit=true;stats.fit=(stats.fit||0)+1;return true;}
function place(e,s,D,c,S,f,sg,cmds,st0){const im=img(S.path);if(!im){stats.waiting++;return false;}
 const G=project(e.x,e.y),u=unitAt(e.x,e.y),R=s.ref;if(!u||!G)return false;
 const vis=R.visU*u,kk=vis/(S.vis||D.vis),foot=G.y+R.footU*u,cx=G.x+R.cxU*u*sg,cell=D.cell,w=cell*kk,x0=cx-sg*D.cx*kk;
 /* 칸마다 실제 몸 아래 끝(표 feet)을 대기 발 줄에 — Dots 칸끼리 발이 12~15px 오르내리던 것(R1377b QA) */const fr=Array.isArray(S.feet)?Number(S.feet[f]):NaN,y0=foot-(fr>0&&fr<=cell?fr:D.foot)*kk;
 if(![kk,x0,y0,w].every(Number.isFinite)||kk<=0)return false;
 for(let i=cmds.length-1;i>=st0;i--){const k=cmds[i];if(k!==c&&k?.kind==='image'&&k.r620Ghost&&k.owner?.kind==='enemy')cmds.splice(i,1);}
 c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+w],[x0,y0+w]];c.image=im;c.sourcePath=S.path;c.imageSize=[cell*S.n,cell];c.sourceRect=[f*cell,0,cell,cell];c.r1377=true;
 /* 뒤 단계(R1229 발록 크기 고정)가 이 칸을 몸으로 알아보고 한 배율로 맞추게 몸 키·발 자리를 남긴다 */c.r1377Vis=vis;c.r1377Foot=[cx,foot];
 stats.swapped++;return true;}
function post(e,cmds,st0){const D=entry(e);if(!D)return;stats.posts++;const s=stOf(e),t=T();track(e,s);
 /* 처음 본 몹이면 시트를 모두 미리 불러 둔다(첫 위 공격이 엔진 그림으로 새지 않게) */if(!s.pre){s.pre=1;for(const S of Object.values(D.sheets||{}))img(S.path);}
 const c=bodyCmd(cmds,st0);if(!c)return;
 // 엔진이 e.attack 없이 공격 그림만 바꾸는 몹(표 atkArt) — 그 그림이 보이는 동안을 한 번의 공격으로 읽는다
 const src=srcOf(c),aa=Array.isArray(D.atkArt)&&D.atkArt.some(b=>src.includes(b));if(aa&&!s.artAtk)s.artT0=t;s.artAtk=aa;
 const a=attackOf(e,s,t),hurt=!a&&e.hitTimer>0;
 if(!a){s.akey=null;if(!c.r974&&!c.r1029)remember(e,s,D,c);}
 if(!s.ref){stats.noRef++;last={id:e.nativeId,why:'no-ref'};return;}
 let S=null,f=0,sg=1,k='';
 if(a){if(s.akey!==a.key){s.akey=a.key;const h=heroDir(e);s.adir=h?.dir||'side';s.asg=h?.sg||1;}
  k='atk_'+s.adir;S=D.sheets[k];if(S){f=atkCell(S.n,a);sg=s.adir==='side'?s.asg:1;}}
 else if(hurt){k='hit_side';S=D.sheets[k];if(S){f=Math.max(0,Math.min(S.n-1,Math.floor((1-Math.min(1,e.hitTimer/.15))*S.n)));sg=s.ref.flip;}
  /* 피격 시트가 없으면 엔진 피격 그림(크기·발 자리가 다른 그림) 대신 같은 대기 시트로 — 한 모습 유지 */else if(D.sheets.idle_side){k='idle_side';S=D.sheets[k];f=Math.floor(t*(S.fps||6))%S.n;sg=s.ref.flip;}}
 else if(s.move>.5&&!(e.stunned>0||e.frozen>0)){k='walk_'+s.dir;S=D.sheets[k];if(S){const per=(S.stride||.18*S.n);f=Math.floor(((s.stride/per)%1)*S.n)%S.n;sg=s.dir==='side'?s.sideSg:1;}}
 else{k='idle_side';S=D.sheets[k];if(S){f=Math.floor(t*(S.fps||6))%S.n;sg=s.ref.flip;}}
 /* 대기 시트가 없는 보스가 서 있는데 엔진이 대기 그림이 아닌 그림(패턴 연출 그림 — 분노의 귀 p2 연기 손 같은 다른 형체)을 몸으로 그리면 마지막 대기 그림 유지(R1377b QA) */
 const odd=!a&&!hurt&&k==='idle_side'&&!idleOf(D,c);
 if(!S){if((odd||blocked(D,c))&&holdIdle(e,s,c,cmds,st0,k.split('_')[0],a)){last={id:e.nativeId,k,hold:true};return;}const fit=!idleOf(D,c)&&fitEngine(e,s,c);last={id:e.nativeId,why:'no-sheet',k,fit};return;}
 if(place(e,s,D,c,S,f,sg,cmds,st0)){stats[k.split('_')[0]]++;last={id:e.nativeId,k,f,flip:sg<0};}}
function wants(e){return !!entry(e);}
window.__STORYWORLD_MOB_DIR_ART_R1377__=Object.freeze({rev:REV,wants,post:(e,cm,st0)=>{try{post(e,cm,st0);}catch(err){stats.errors++;lastError=String(err?.message||err).slice(0,160);}},
 inspect:()=>({rev:REV,installed:!!window.__STORYWORLD_MOVE_DIR_R974__,enemies:Object.keys(DATA()).length,prefs:{...prefs},stats:{...stats},last,lastError}),
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
