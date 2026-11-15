// R1080 — 시네마틱 영상 일곱 편을 선 그림 장면으로 대신 그린다.
// 사용자 2026-11-15 15:15Z: "모든시네마틱영상 실로그린영상그걸로 대체생성하고 그것돌도 수묵화풍으로 개선"
//  · 대상(영상 모듈 · 영상 파일): 오프닝 책(r309 opening-book) · 뿌리의 문지기 보스 문(r372 root-gate) · 중독의 도시(r369 poison-city) ·
//    결전의 날 배신(r368 betrayal) · 환도의 기억 세 편(r617 knight·fall·beach). 타이틀 배경 루프(r667)는 메뉴 배경이라 그대로 둔다.
//  · 하는 일: 영상 모듈이 화면에 올린 루트(#r309v 등) 안의 <video> 를 지우지 않고 보이지 않게만 한 뒤, 같은 자리에 선 그림(SVG)을 얹어
//    영상 시계(video.currentTime)를 따라 그린다. 그래서 언제 뜨는지·자막 문장과 시각·보스 이름 카드·건너뛰기·게임 멈춤·BGM·영상 소리·
//    멈춤 감시·세이브·진행은 영상 모듈 그대로다(영상 모듈 파일은 고치지 않았다). 그림은 원래 영상의 장면 순서와 시각을 따른다.
//  · 그림은 이 파일의 코드가 선으로 그린다(새 그림 파일·영상 파일 없음). 무대·인물·도구는 lineart-cine-r880 과 장면 도우미(r881)를 그대로 쓴다.
//    새 글·새 설정은 없다. 인물은 얼굴 없는 선 인형, 십자로 읽히는 모양은 쓰지 않는다(후광은 고리, 섬광은 홀수 갈래).
//  · 원본 영상 파일은 그대로 남는다. 끄면 원래 영상이 보인다: localStorage['storyworld.r1080.lineartVideo']='{"on":false}' 또는 API set({on:false}).
//  · 영상이 못 뜨면(파일·코덱 오류) 영상 모듈의 원래 대비책대로 간다. 그리다 오류가 나면 선 그림을 걷고 영상을 다시 보인다.
//  · '흔들림 줄이기'면 가벼운 방식(선 떨림·카메라 흔들림 없음). 느리면 선 떨림 필터를 스스로 끈다. 숫자는 모두 clamp.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||typeof A.stage!=='function'||window.__STORYWORLD_LINEART_VIDEO_R1080__)return;
const REV='R1080-lineart-video-1',KEY='storyworld.r1080.lineartVideo',NS='http://www.w3.org/2000/svg';
const {INK,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,featherWing,flame}=A.kit;
const {STAND,SHUF,vis,op,dipper,ground,scratches,actor,crouch,EGO,HWANDO,pillar,fogBand,spark,dark,whiten}=SK;
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&!Array.isArray(s)&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={attached:0,detached:0,frames:0,rebuilt:0,filterDropped:0,previews:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const num=(v,d=0)=>Number.isFinite(v)?v:d;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const mix=(a,b,u)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),x=p(a),y=p(b);u=clamp(num(u),0,1);return'#'+x.map((v,i)=>Math.round(clamp(lerp(v,y[i],u),0,255)).toString(16).padStart(2,'0')).join('');};
const INKOF=()=>window.__STORYWORLD_LINEART_INK_R1081__;
// ───────── 그리기 도우미 ─────────
// 자라는 선: 꺾은선 P 의 앞쪽 u 만큼
const part=(Q,u)=>{u=clamp(num(u),0,1);const n=Q.length-1,x=u*n,i=Math.min(n-1,Math.floor(x)),fr=x-i,out=Q.slice(0,i+1);out.push([lerp(Q[i][0],Q[i+1][0],fr),lerp(Q[i][1],Q[i+1][1],fr)]);return out;};
// 뒤틀린 나무: 줄기·가지·뿌리가 u(0~1)만큼 자란다
function tree(parent,x,y,h,R,o={}){const G=grp(parent),fill=o.fill||'#0a0709',parts=[];let last=-1;
 const add=(Q,w0,w1,u0)=>parts.push({n:dark(G,'',fill,o.w||1),Q,w0,w1,u0});
 const trunk=[[x,y+3],[x+R(-4,4),y-h*.2],[x+R(-7,7),y-h*.42],[x+R(-4,4),y-h*.6]];add(trunk,h*(o.thick||.24),h*.13,0);
 const br=(a,len,ang,dep,wd,u0)=>{const Q=[a];let c=a,an=ang;for(let i=0;i<4;i++){an+=R(-.38,.38);c=[c[0]+Math.sin(an)*len/4,c[1]-Math.cos(an)*len/4];Q.push(c);}add(Q,wd,Math.max(.5,wd*.3),u0);
  if(dep>0){const n=dep>1?3:2;for(let i=0;i<n;i++)br(Q[2+(i%3)],len*R(.5,.72),an+R(-1.05,1.05),dep-1,Math.max(.8,wd*.5),Math.min(.9,u0+.16));}};
 [-1.2,-.55,.05,.62,1.25].forEach((a,i)=>br(i%2?trunk[2]:trunk[3],h*R(.36,.52),a+R(-.12,.12),2,h*.06,.22+i*.02));
 [-1,1].forEach(s=>{for(let i=0;i<3;i++)add([[x+s*h*.06,y+1],[x+s*h*(.16+i*.1),y+3+R(-2,1)],[x+s*h*(.3+i*.13),y+5+R(-1,3)]],h*.05,1,.04+i*.05);});
 return{G,draw(u){u=clamp(num(u),0,1);if(Math.abs(u-last)<.002)return;last=u;for(const p of parts){const v=clamp((u-p.u0)/Math.max(.05,(1-p.u0)*.8),0,1);p.n.setAttribute('d',v>0?band(part(p.Q,v),p.w0,lerp(p.w0,p.w1,v)):'');}}};}
// 뾰족 아치 하나(두 기둥 + 아치)
const arch=(p,x,base,w,h,sw=.8,extra)=>ink(p,`M${f(x-w/2)} ${f(base)}L${f(x-w/2)} ${f(base-h)}Q${f(x-w/2)} ${f(base-h-w*.62)} ${f(x)} ${f(base-h-w*.86)}Q${f(x+w/2)} ${f(base-h-w*.62)} ${f(x+w/2)} ${f(base-h)}L${f(x+w/2)} ${f(base)}`,sw,extra);
// 박쥐 날개(open 0 접힘 → 1 펼침)
function batWing(parent,fill='#0b090d'){const m=el('path',{fill,stroke:INK,'stroke-width':1,'stroke-linejoin':'round'},parent),r=pen(parent,.5);
 return{draw(s0,sg,open,L0,t){open=clamp(num(open),0,1);const hip=[s0[0]+sg*2,s0[1]+L0*.5],fl=wobble(t*1.3+sg,1)*3*open,tips=[0,1,2,3].map(j=>{const a=lerp(lerp(1.35,1.15,j/3),lerp(-0.75,0.85,j/3),open),Ln=lerp(L0*.36,lerp(L0,L0*.64,j/3),open);return[s0[0]+sg*Math.cos(a)*Ln+sg*fl,s0[1]+Math.sin(a)*Ln+fl*.5];});
  let d='M'+pt(s0)+'L'+pt(tips[0]);for(let j=1;j<4;j++){const a=tips[j-1],b=tips[j];d+=`Q${f((a[0]+b[0])/2-sg*(4+6*open))} ${f((a[1]+b[1])/2-(3+7*open))} ${pt(b)}`;}
  d+=`Q${f((tips[3][0]+hip[0])/2-sg*5)} ${f((tips[3][1]+hip[1])/2-5)} ${pt(hip)}Z`;m.setAttribute('d',d);r.setAttribute('d',tips.map(q=>`M${pt(s0)}L${pt(q)}`).join(''));}};}
// 날개 달린 이: 선 인형 + 깃털 날개 한 쌍(dk 0 흰 날개 → 1 검게 물든 날개)
function winged(parent,o={}){const wg=grp(parent),wl=featherWing(wg,.9),wr=featherWing(wg,.9),fig=figure(parent,Object.assign({robe:'long',robeFill:'#ece7df',hat:HATS.angel,seed:5,restF:-6,restN:5},o.fig||{}));let tint=-1;
 const col=d=>{if(Math.abs(d-tint)<.012)return;tint=d;const a=mix(o.w0||'#ece7f5',o.w1||'#1b1722',d),b=mix(o.l0||'#6d6585',o.l1||'#a39ab8',d);whiten(wl,a,b);whiten(wr,a,b);};col(o.dark||0);
 return{fig,wg,st:fig.st,draw(x,y,dir,S,t,dt,s={}){place(fig.g,x,y,dir,S);fig.update(Object.assign({pose:STAND.pose(s.ph||0,s.go||0),go:s.go||0,dt,t},s.ex||{}));
  const wb=toScene(x,y,dir,38,47+(s.ex&&s.ex.drop||0),S),wa=num(s.wing,30)+Math.sin(t*1.3+(o.seed||0))*3,len=(o.len||66)*S;wl.draw([wb[0]-3*S,wb[1]],-1,wa,len);wr.draw([wb[0]+5*S,wb[1]],1,wa+4,len);col(clamp(num(s.dark),0,1));return wb;}};}
// 구름 덩이(위가 올록볼록한 닫힌 선)
function cloud(p,cx,cy,w,h,R,fill,sw=.7){const n=6+Math.round(w/44),Q=[];for(let i=0;i<=n;i++){const a=Math.PI*(1-i/n);Q.push([cx+Math.cos(a)*w/2,cy-Math.sin(a)*h*R(.6,1.05)-2]);}
 let d='M'+pt(Q[0]);for(let i=1;i<Q.length;i++){const a=Q[i-1],b=Q[i];d+=`Q${f((a[0]+b[0])/2+R(-3,3))} ${f(Math.min(a[1],b[1])-R(7,15))} ${pt(b)}`;}
 d+=`Q${f(cx)} ${f(cy+h*.34)} ${pt(Q[0])}Z`;return dark(p,d,fill,sw);}
// 성가퀴(성벽 위 요철)
const merlons=(x0,x1,y,w=26,h=13)=>{let d=`M${f(x0)} ${f(y+90)}L${f(x0)} ${f(y)}`;for(let x=x0;x<x1;x+=w*2)d+=`L${f(x)} ${f(y-h)}L${f(x+w)} ${f(y-h)}L${f(x+w)} ${f(y)}L${f(Math.min(x1,x+w*2))} ${f(y)}`;return d+`L${f(x1)} ${f(y+90)}Z`;};
// 두건
const HOOD=(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-5.6,5)}Q${P(c,-7.6,-7)} ${P(c,-.4,-7.8)}Q${P(c,6.4,-7.2)} ${P(c,5.2,-1.4)}Q${P(c,1.6,-3.4)} ${P(c,-.6,-.6)}Q${P(c,-2.2,2)} ${P(c,-1.6,5.4)}Z`);line.setAttribute('d',`M${P(c,-5.6,5)}Q${P(c,-3,7)} ${P(c,-1.6,5.4)}`);};
// 관(뾰족한 띠)과 웃는 입 한 줄
const CROWN=(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-4.8,-3)}L${P(c,-5.8,-9)}L${P(c,-2.8,-5.6)}L${P(c,-1.2,-11.6)}L${P(c,.6,-5.8)}L${P(c,3.2,-10)}L${P(c,4.6,-3.4)}Q${P(c,0,-5)} ${P(c,-4.8,-3)}Z`);
 line.setAttribute('d',`M${P(c,.8,2)}Q${P(c,2.4,3.5)} ${P(c,3.8,1.7)}M${P(c,-4.4,1)}Q${P(c,-6,8)} ${P(c,-5,14)}`);};
// 누운·기운 인형을 위한 자리 계산: 발끝 (X0,Y0) 둘레로 A 도 돌린 인형의 안쪽 좌표
const local=(gx,gy,X0,Y0,A,S)=>{const r=A*Math.PI/180,dx=(gx-X0)/S,dy=(gy-Y0)/S;return[40+dx*Math.cos(r)+dy*Math.sin(r),120-dx*Math.sin(r)+dy*Math.cos(r)];};
const spin=(g,x,y,a)=>g.setAttribute('transform',`translate(${f(x)} ${f(y)}) rotate(${f(a)})`);
// 누운 칼(환도): 손잡이에서 날 끝으로
function blade(p,col='#c9a24a'){const g=grp(p);sh(g,'M4 -1.2L58 -.3L4 1.2Z',.7);pa(g,col,'M2 -4L4 -4L4 4L2 4Z',.6);bl(g,'M-9 -1.1L2 -1.1L2 1.1L-9 1.1Z');return g;}
const tri=(x,y,r,a)=>`M${f(x+Math.cos(a)*r)} ${f(y+Math.sin(a)*r)}L${f(x+Math.cos(a+2.3)*r*.8)} ${f(y+Math.sin(a+2.3)*r*.8)}L${f(x+Math.cos(a-2.0)*r*.6)} ${f(y+Math.sin(a-2.0)*r*.6)}Z`;
const zig=(a,b,n,amp,R)=>{const Q=[a];for(let i=1;i<n;i++){const u=i/n;Q.push([lerp(a[0],b[0],u)+R(-amp,amp),lerp(a[1],b[1],u)+R(-amp,amp)]);}Q.push(b);return Lp(Q);};
// 떠다니는 알갱이(자리·속도만 정해 두고 장면이 직접 움직인다)
const dots=(parent,n,R,box,o={})=>{const arr=[];for(let i=0;i<n;i++)arr.push({n:el('circle',{r:f(R(o.r0||0.5,o.r1||1.3)),fill:o.fill||INK},parent),x:R(box[0],box[2]),y:R(box[1],box[3]),vx:R(o.vx0??-4,o.vx1??4),vy:R(o.vy0??6,o.vy1??16),ph:R(0,6.28)});return arr;};
const GUARD={robe:'long',robeFill:'#2c3138',legs:'#1c2026',hat:HATS.helm,seed:7};

const CLIPS=new Map();
const add=def=>CLIPS.set(def.id,Object.freeze(def));
// ───────── 오프닝(책 속 그림): 빛의 회랑과 두 천사 → 바닥이 터짐 → 뒤틀린 나무 → 날개가 물듦 → 웃는 나무와 불타는 폐허 ─────────
add({id:'opening',root:'r309v',match:'opening-book.mp4',D:9.46,paper:'#1a1612',ink:'#eae1cf',sky:[[0,'#0d0b09'],[0.6,'#221c15'],[1,'#15110d']],
 build(k){const R=seeded(3091),GR=292,S=1,TX=330,RED='#d8452e';
  const cam=k.track([[0,292,190,1.12],[2.0,318,192,1.28],[3.2,330,184,1.38],[5.2,330,174,1.24],[6.1,330,170,1.32],[6.2,320,172,1,'cut'],[9.46,320,160,1.15]]),dip=dipper(k,[6.2]);
  const hall=grp(k.back);for(let i=0;i<7;i++)arch(hall,-8+i*112,GR+3,80,146,.8,{opacity:.75});for(let i=0;i<6;i++)arch(hall,48+i*112,GR+3,40,96,.45,{opacity:.4});
  const rays=grp(k.far);[[470,-30,150,GR],[520,-30,250,GR],[590,-30,360,GR]].forEach(([a,b,c,d])=>el('path',{d:Lp([[a,b],[a+34,b],[c+60,d],[c,d]],true),fill:'#efe2bd',opacity:.1},rays));
  const warm=k.glowAt(470,60,260,'#e8cf8a'),red=k.glowAt(TX,GR-70,300,RED);op(red,0);
  ground(k.root,GR+3,R);scratches(k.root,26,R,GR+9,352);
  const ruin=grp(k.back);[[58,150,22],[146,196,18],[236,170,20],[420,176,20],[512,150,24],[596,204,18]].forEach(([x,top,w])=>pillar(ruin,x,top,GR+3,w,R,{broken:true}));
  dark(ruin,Lp([[-60,GR+3],[-40,236],[10,244],[24,214],[70,228],[96,GR+3]],true),'#0c0a0b',.8);dark(ruin,Lp([[540,GR+3],[566,232],[610,222],[640,246],[700,238],[720,GR+3]],true),'#0c0a0b',.8);
  const TG=grp(k.root),tr=tree(TG,TX,GR+2,150,R,{thick:.36});
  const face=grp(TG,{opacity:0});pa(face,'#ff8a4a','M-15 -5Q-8 -15 -2 -3Q-9 -7 -15 -5Z',.6);pa(face,'#ff8a4a','M15 -5Q8 -15 2 -3Q9 -7 15 -5Z',.6);pa(face,'#ff8a4a','M-16 7L-11 13L-7 8L-3 15L1 8L5 14L9 8L16 7Q0 27 -16 7Z',.6);
  const crack=[0,1,2,3,4,5].map(i=>{const a=-Math.PI*(.08+i*.168),Q=[[TX,GR+3]];let c=[TX,GR+3];for(let j=0;j<4;j++){c=[c[0]+Math.cos(a)*R(13,22)+R(-4,4),c[1]+Math.abs(Math.sin(a))*R(1,5)+R(0,3)];Q.push(c);}return{n:ink(k.root,'',.9),Q};});
  const shards=[];for(let i=0;i<10;i++)shards.push({n:bl(k.front,''),a:R(-2.6,-.5),v:R(60,130),r:R(3,7),sp:R(-4,4)});
  const fl=[[96,GR-2,16,34],[196,GR,12,24],[450,GR,14,30],[560,GR-2,18,40],[262,GR,9,18],[396,GR,10,20]].map(([x,y,w,h],i)=>({f:flame(k.front,i%2?'#f08a3c':'#ffb060',.8),x,y,w,h}));const flG=k.front;
  const a1=winged(k.root,{seed:1}),a2=winged(k.root,{seed:4});let x1=120,ph1=0;
  const ash=dots(k.near,20,R,[-40,-20,700,300],{vy0:-14,vy1:-5,vx0:-6,vx1:6,r0:.5,r1:1.2,fill:'#ffb478'});
  return(t,dt)=>{cam(t);dip(t);const wide=t>=6.2,grow=es(t,2.9,4.4),dk=es(t,4.5,5.7);
   vis(hall,!wide);vis(rays,!wide);vis(ruin,wide);op(warm,(1-es(t,2.0,3.4))*.5);op(red,wide?.55+.06*Math.sin(t*5):es(t,2.0,3.0)*.4);
   tr.draw(wide?1:grow);TG.setAttribute('transform',wide?`translate(${TX} ${GR+2}) scale(1.62) translate(${-TX} ${-(GR+2)})`:'');
   face.setAttribute('transform',`translate(${TX+1} ${GR-58}) scale(.9)`);op(face,wide?es(t,6.5,7.2)*(.82+.18*Math.sin(t*7)):0);
   const cu=es(t,1.9,2.5);crack.forEach(c=>{c.n.setAttribute('d',cu>0?Lp(part(c.Q,cu)):'');op(c.n,wide?0:1);});
   shards.forEach(s=>{const u=t-2.0;if(u<0||u>1.5){s.n.setAttribute('d','');return;}const x=TX+Math.cos(s.a)*s.v*u,y=GR-Math.sin(-s.a)*s.v*u+110*u*u;s.n.setAttribute('d',tri(x,y,s.r,s.sp*u));});
   const go=t<1.7?1:0;if(go){x1+=STAND.speed*S*dt;ph1+=dt/STAND.period;}
   const reach=es(t,4.2,4.9),pull=es(t,4.6,5.6);
   a1.draw(x1,GR+2,1,S,t,dt,{ph:ph1,go,wing:lerp(34,58,es(t,2.0,2.4))-pull*26,dark:dk,ex:{lean:lerp(0,-7,es(t,2.0,2.5))+pull*13,nearHand:reach>.01?[lerp(52,68,reach),lerp(78,52,reach)]:null,headDrop:pull*2}});
   a2.draw(lerp(450,424,es(t,4.0,4.8)),GR+2,-1,S,t,dt,{wing:lerp(30,56,es(t,2.0,2.4))-pull*24,dark:dk,ex:{lean:lerp(0,-6,es(t,2.0,2.5))+pull*12,nearHand:reach>.01?[lerp(52,66,reach),lerp(78,50,reach)]:null,headDrop:pull*2}});
   op(a1.fig.g,wide?0:1);op(a2.fig.g,wide?0:1);op(a1.wg,wide?0:1);op(a2.wg,wide?0:1);
   fl.forEach((o,i)=>{o.f.draw(o.x,o.y,o.w,o.h*(wide?.8+.2*Math.sin(t*6+i):0),t,i);});op(flG,wide?1:0);
   ash.forEach(m=>{const y=((m.y+m.vy*t)%320+320)%320-20,x=m.x+Math.sin(t*.8+m.ph)*8;setA(m.n,{cx:x,cy:y});op(m.n,wide?.7:es(t,2.2,3.2)*.5);});}}});
// ───────── 뿌리의 문지기(보스 문): 금빛 회랑의 검은 나무 → 붉은 덩굴이 덮침 → 뿔이 돋고 날개가 물듦 → 박쥐 날개를 편 문지기 ─────────
add({id:'rootgate',root:'r372v',match:'root-gate.mp4',D:9.46,paper:'#1b1711',ink:'#efe6d2',sky:[[0,'#100d08'],[0.55,'#2a2216'],[1,'#17130d']],
 build(k){const R=seeded(3721),GR=296,S=1,TX=320,RED='#d8382c';
  const cam=k.track([[0,320,190,1],[2.7,320,186,1.26],[3.0,328,176,2.5,'cut'],[6.2,328,170,3.0],[6.4,320,184,1,'cut'],[9.46,322,170,1.22]]),dip=dipper(k,[3.0,6.4]);
  const gold=k.glowAt(320,80,330,'#e8c878'),red=k.glowAt(320,120,360,RED);op(red,0);
  for(let i=0;i<8;i++)arch(k.far,-30+i*100,GR-6,58,110,.5,{opacity:.45});for(let i=0;i<5;i++)arch(k.back,10+i*155,GR+3,112,150,.9,{opacity:.8});
  ink(k.back,`M-90 ${GR-170}L730 ${GR-170}`,.5,{opacity:.4});ground(k.root,GR+3,R);scratches(k.root,22,R,GR+9,354);
  for(let i=0;i<7;i++)ink(k.root,`M${f(TX+(i-3)*46)} ${GR+6}Q${f(TX+(i-3)*80)} ${GR+20} ${f(TX+(i-3)*150)} 356`,.35,{opacity:.5});
  const tr=tree(k.root,TX,GR+2,196,R,{thick:.27});tr.draw(1);
  const vines=[[-1,130,GR-56],[1,524,GR-50],[-1,214,GR-30],[1,440,GR-34],[1,330,GR-70]].map(([s,tx,ty],i)=>{const a=[TX+s*R(20,50),GR-150-R(0,30)],m=[(a[0]+tx)/2+s*R(30,60),Math.min(a[1],ty)-R(20,46)],Q=[];for(let j=0;j<=9;j++){const u=j/9;Q.push([(1-u)*(1-u)*a[0]+2*u*(1-u)*m[0]+u*u*tx,(1-u)*(1-u)*a[1]+2*u*(1-u)*m[1]+u*u*ty]);}
   return{n:dark(k.root,'','#0a0709',.9),c:el('path',{fill:'none',stroke:RED,'stroke-width':1.3,'stroke-linecap':'round'},k.root),Q,t0:1.0+i*.3};});
  const side=[[130,1,1],[214,1,2],[440,-1,3],[524,-1,6]].map(([x,d,seed])=>({w:winged(k.root,{seed,len:46}),x,d}));
  const C=winged(k.front,{seed:9,len:60}),CX=326,CS=1.3;
  const horns=[-1,1].map(()=>dark(k.front,'','#0c0a0d',.8));const eyeG=k.glowAt(CX,GR-90,14,'#ff4a36');op(eyeG,0);
  const bats=grp(k.front),bw=[batWing(bats),batWing(bats)];const smoke=dots(k.front,18,R,[250,GR-150,400,GR],{vy0:-22,vy1:-8,vx0:-8,vx1:8,r0:1,r1:2.6,fill:'#0c0a0d'});
  const fl=[[120,GR,10,20],[540,GR,12,24],[250,GR+4,7,14]].map(([x,y,w,h],i)=>({f:flame(k.front,'#f08a3c',.8),x,y,w,h}));
  const bolt=el('path',{fill:'none',stroke:'#ff7a5c','stroke-width':1.4,'stroke-linejoin':'round',d:zig([560,-30],[470,150],7,14,R)},k.far);
  return(t,dt)=>{cam(t);dip(t);const late=t>=6.4,dk=es(t,3.4,5.6),hn=es(t,3.6,5.4);
   op(gold,(1-es(t,5.0,6.4))*.5);op(red,es(t,4.6,6.6)*(.5+.05*Math.sin(t*5)));
   vines.forEach(v=>{const u=es(t,v.t0,v.t0+1.5);const Q=part(v.Q,u);v.n.setAttribute('d',u>0?band(Q,4.2,.8):'');v.c.setAttribute('d',u>0?Lp(Q):'');});
   smoke.forEach(m=>{const u=((t*.5+m.ph)%1+1)%1;setA(m.n,{cx:m.x+Math.sin(t+m.ph)*6+m.vx*u*2,cy:m.y+m.vy*u*5});op(m.n,(1-u)*.6*(1-es(t,2.6,3.4)));});
   side.forEach((a,i)=>{const hit=es(t,1.6+i*.3,2.6+i*.3);a.w.draw(a.x,GR+2,a.d,S,t,dt,{wing:lerp(28,50,hit)-hit*18*es(t,3,5),dark:late?1:hit*.5*es(t,2.4,6),ex:{lean:-hit*8,headDrop:hit*2+(late?2:0),nearHand:hit>.01&&!late?[lerp(52,60,hit),lerp(78,50,hit)]:null}});});
   const kneel=late?es(t,6.4,6.5):0,wb=C.draw(CX,GR+3,1,CS,t,dt,{wing:lerp(40,22,dk),dark:dk,ex:{lean:lerp(0,-5,es(t,1.4,2.4))+Math.sin(t*9)*es(t,3.2,5.6)*1.2*(1-kneel),headDrop:lerp(0,-2.4,es(t,7.0,8.0))+es(t,3.2,4)*2.4*(1-es(t,5.2,6)),nearHand:late?[lerp(56,66,es(t,7,8)),lerp(78,60,es(t,7,8))]:null,farHand:late?[lerp(30,18,es(t,7,8)),lerp(78,60,es(t,7,8))]:null}});
   const hc=C.st.head;horns.forEach((n,i)=>{const s=i?1:-1,Q=[[hc[0]+s*3,hc[1]-4],[hc[0]+s*7.6,hc[1]-6.4],[hc[0]+s*10,hc[1]-11.6],[hc[0]+s*8.4,hc[1]-17]].map(q=>toScene(CX,GR+3,1,q[0],q[1],CS));n.setAttribute('d',hn>0?band(part(Q,hn),3.4,.6):'');});
   const hs=toScene(CX,GR+3,1,hc[0],hc[1],CS);setA(eyeG,{cx:hs[0],cy:hs[1],r:10+8*hn});op(eyeG,hn*.8);
   const bo=late?es(t,6.5,7.7):0;op(C.wg,late?0:1);op(bats,late?1:0);bw[0].draw([wb[0]-4,wb[1]],-1,bo,128,t);bw[1].draw([wb[0]+6,wb[1]],1,bo,128,t);
   fl.forEach((o,i)=>o.f.draw(o.x,o.y,o.w,o.h*(late?.8+.2*Math.sin(t*6+i):0),t,i));
   op(bolt,late?clamp(1-Math.abs(t-8.15)/.14,0,1):0);}}});
// ───────── 중독의 도시: 골목의 두건 쓴 사내와 주사기 → 떨어져 깨지며 보랏빛이 번짐 → 연기 속을 걸어 나감 ─────────
add({id:'poison',root:'r369v',match:'poison-city.mp4',D:10,paper:'#16161b',ink:'#dcdce6',sky:[[0,'#0b0b10'],[0.6,'#1c1c25'],[1,'#121217']],
 build(k){const R=seeded(3691),GR=298,S=1.22,VIO='#b77cf2',MX=246;
  const cam=k.track([[0,300,200,1.45],[1.0,292,196,1.8],[1.1,286,196,2.5,'cut'],[3.5,290,198,2.75],[3.7,292,276,2.9,'cut'],[6.6,300,274,3.1],[10,324,270,2.8]]),dip=dipper(k,[1.1,3.7]);
  const shut=(x,w,h)=>{sh(k.back,Lp([[x,GR+3],[x,GR+3-h],[x+w,GR+3-h],[x+w,GR+3]],true),.8);for(let y=GR-h+10;y<GR;y+=8)ink(k.back,`M${x+3} ${y}L${x+w-3} ${y}`,.35,{opacity:.6});};
  shut(60,96,120);shut(330,110,128);shut(470,90,116);ink(k.back,`M-90 ${GR-150}L730 ${GR-150}M-90 ${GR-158}L730 ${GR-158}`,.5,{opacity:.5});
  dark(k.back,Lp([[176,GR-126],[296,GR-126],[310,GR-100],[162,GR-100]],true),'#1d2a2a',.9);for(let i=0;i<6;i++)ink(k.back,`M${186+i*20} ${GR-126}L${178+i*23} ${GR-100}`,.4,{opacity:.6});ink(k.back,`M172 ${GR-100}L172 ${GR+3}M300 ${GR-100}L300 ${GR+3}`,.8);
  sh(k.back,Lp([[196,GR+3],[196,GR-26],[236,GR-26],[236,GR+3]],true),.8);sh(k.back,Lp([[240,GR+3],[240,GR-20],[272,GR-20],[272,GR+3]],true),.8);
  dark(k.root,Lp([[548,GR+3],[544,GR-30],[578,GR-30],[574,GR+3]],true),'#17171d',1);ink(k.root,`M545 ${GR-20}L577 ${GR-20}M546 ${GR-8}L576 ${GR-8}`,.5);
  const bf=flame(k.root,'#f0a04a',.9),bg=k.glowAt(561,GR-44,90,'#e89a48');
  ground(k.root,GR+3,R);scratches(k.root,30,R,GR+8,354);for(let i=0;i<14;i++){const x=R(-40,680),y=R(GR+8,350);ink(k.root,`M${f(x)} ${f(y)}q${f(R(6,16))} ${f(R(-1.5,1.5))} ${f(R(14,30))} 0`,.3,{opacity:.5});}
  const man=actor(k.root,{robe:'coat',robeFill:'#23232b',legs:'#1a1a21',hat:HOOD,hatFill:'#23232b',sleeve:'#23232b',seed:4,restN:4},MX,GR+2,1,S,SHUF);
  const pud=el('ellipse',{fill:VIO,opacity:.75,stroke:INK,'stroke-width':.5},k.front),pg=k.glowAt(0,0,10,VIO);
  const SY=grp(k.front);pa(SY,VIO,'M-1.7 -8L1.7 -8L1.7 7L-1.7 7Z',.6);ink(SY,'M0 -8L0 -17M-3.4 7L3.4 7M0 7L0 12M-2.6 12L2.6 12',.6);ink(SY,'M-1.7 -3L1.7 -3M-1.7 1L1.7 1',.3);const sg=k.glowAt(0,0,16,VIO);
  const shards=[];for(let i=0;i<12;i++)shards.push({n:sh(k.front,'',.5),a:R(-2.9,-.25),v:R(26,64),r:R(1.4,3.2),sp:R(-6,6)});
  const wisps=[0,1,2,3,4,5].map(i=>({n:el('path',{fill:'none',stroke:'#c79af7','stroke-width':R(.9,1.6),'stroke-linecap':'round'},k.front),x:R(-26,30),ph:R(0,6),h:R(34,62),t0:4.7+i*.34}));
  let hx=MX+26,hy=GR-70,fx=0,vy=0,fy=0,ang=0;const TI=4.38;
  return(t,dt)=>{cam(t);dip(t);bf.draw(561,GR-28,20,30+3*Math.sin(t*7),t,1);op(bg,.42+.05*Math.sin(t*6));
   const hold=1-es(t,3.45,3.7),walk=t>=6.5?es(t,6.5,7.0):0;
   man.up(t,dt,walk,{nearHand:hold>.01?[lerp(52,61,hold)+Math.sin(t*2.2)*.8*hold,lerp(80,53,hold)+Math.sin(t*3.1)*.6*hold]:null,lean:lerp(0,2.4,hold)*Math.sin(t*1.3)+walk*3,headDrop:lerp(.6,-.8,hold)});
   const hand=man.at(man.st.handN[0],man.st.handN[1]);
   if(t<3.6){hx=hand[0]+2;hy=hand[1]-12;fx=hx;fy=hy;ang=12+Math.sin(t*2.2)*4;}
   else if(t<TI){const u=t-3.6;hx=fx+u*8;hy=Math.min(GR-3,fy+250*u*u);ang=12+u*150;}
   else{hx=fx+(TI-3.6)*8+6;hy=GR-2.4;ang=96;}
   SY.setAttribute('transform',`translate(${f(hx)} ${f(hy)}) rotate(${f(ang)})`);setA(sg,{cx:hx,cy:hy,r:t<TI?13+3*Math.sin(t*5):26});op(sg,t<TI?.75:.5);
   const sp=es(t,TI,6.6),px=fx+(TI-3.6)*8+4;setA(pud,{cx:px,cy:GR+4,rx:sp*52,ry:sp*5.4});op(pud,t>=TI?.72:0);setA(pg,{cx:px,cy:GR-6,r:20+sp*80});op(pg,t>=TI?.3+.3*sp:0);
   shards.forEach(s=>{const u=t-TI;if(u<0||u>1.3){s.n.setAttribute('d','');return;}const x=px+Math.cos(s.a)*s.v*u,y=Math.min(GR+2,GR-2-Math.sin(-s.a)*s.v*u+150*u*u);s.n.setAttribute('d',tri(x,y,s.r,s.sp*u));});
   wisps.forEach(w=>{const u=es(t,w.t0,w.t0+2.4);if(u<=0){w.n.setAttribute('d','');return;}const Q=[];for(let j=0;j<=10;j++){const q=j/10*u;Q.push([px+w.x+Math.sin(q*5+t*1.4+w.ph)*(4+q*14),GR+2-q*w.h]);}w.n.setAttribute('d',smoothD(Q));op(w.n,.85-.35*es(t,8.6,10));});}}});
// ───────── 결전의 날: 뒤틀린 나무 앞의 수호자들 → 내려오는 초천사 → 웃는 얼굴과 펼치는 권능 → 붉은 빛에 사라지는 수호자들 → 홀로 남아 무릎 꿇음 ─────────
add({id:'betrayal',root:'r368v',match:'betrayal.mp4',D:10,vb:'0 43 640 274',paper:'#131619',ink:'#dfe3e6',sky:[[0,'#090b0d'],[0.6,'#1a2023'],[1,'#101315']],
 build(k){const R=seeded(3681),GR=288,S=1.02,AX=336,AS=1.2,REDB='#ff4a3c',HX=262;
  const cam=k.track([[0,296,206,1.28],[1.8,316,194,1.2],[3.3,326,180,1.3],[3.4,338,150,2.6,'cut'],[6.2,338,146,2.95],[6.3,318,186,1.1,'cut'],[8.1,318,188,1.17],[8.2,292,214,1.7,'cut'],[10,286,212,1.86]]),dip=dipper(k,[3.4,6.3,8.2]);
  const tr=tree(k.back,330,GR+2,206,R,{thick:.22,fill:'#0d1112',w:.8});tr.draw(1);tr.G.setAttribute('opacity','.75');
  ground(k.root,GR+3,R);scratches(k.root,24,R,GR+8,330);
  [[92,58],[168,44],[486,50],[566,62]].forEach(([x,h],i)=>{dark(k.back,`M${x-12} ${GR+3}Q${x-14} ${GR-h*.7} ${x-6} ${GR-h}Q${x} ${GR-h-5} ${x+7} ${GR-h}Q${x+14} ${GR-h*.6} ${x+12} ${GR+3}Z`,'#14181a',.9);
   el('path',{d:`M${x-4} ${GR-h*.78}l7 5M${x+3} ${GR-h*.56}l-7 6l7 5M${x-3} ${GR-h*.3}l6 0`,fill:'none',stroke:'#f09a48','stroke-width':1,'stroke-linecap':'round',opacity:.85},k.back);});
  const tfl=[[124,GR-2],[528,GR-2]].map(([x,y],i)=>{ink(k.root,`M${x} ${GR+3}L${x} ${y-16}`,1.1);k.glowAt(x,y-26,60,'#e89a48');return{f:flame(k.root,'#f0a04a',.8),x,y:y-16};});
  const gl=k.glowAt(AX,GR-120,150,'#f0e0a8'),rg=[k.glowAt(0,0,20,REDB),k.glowAt(0,0,20,REDB)],rbig=k.glowAt(320,GR-90,330,'#c8302c');op(rbig,0);
  const gs=[[150,1],[200,1],[438,-1]].map(([x,d],i)=>({fig:figure(k.root,Object.assign({},GUARD,{seed:7+i})),x,d,ash:dots(k.root,7,R,[x-12,GR-90,x+12,GR-10],{vy0:-26,vy1:-10,vx0:-6,vx1:6,r0:.6,r1:1.4})}));
  const hero=figure(k.root,EGO);
  const WG=grp(k.root),W6=[[58,74],[24,66],[-12,52]].map(([a,len])=>[-1,1].map(()=>whiten(featherWing(WG,.9),'#cfc3ee','#5d4f8a')).concat([a,len]));
  const ang=figure(k.root,{robe:'long',robeFill:'#e9e6f2',hat:CROWN,hatFill:'#d8dbe6',seed:5,shadow:false});
  const burst=spark(k.front,'#fff3d6',5);
  const beams=gs.map(()=>({a:el('path',{fill:'none',stroke:REDB,'stroke-width':3.2,'stroke-linejoin':'round','stroke-linecap':'round'},k.front),b:el('path',{fill:'none',stroke:'#ffd0c0','stroke-width':.7,'stroke-linejoin':'round'},k.front)}));let bz=-1;
  return(t,dt)=>{cam(t);dip(t);tfl.forEach((o,i)=>o.f.draw(o.x,o.y,9,18+2*Math.sin(t*7+i),t,i));
   const land=minJerk(seg(t,1.7,3.2)),ay=lerp(-70,GR-62,land)+Math.sin(t*1.5)*2.4*land,spread=es(t,4.6,5.8),cast=t>=6.3&&t<8.15?1:0,end=t>=8.2;
   place(ang.g,AX,ay,-1,AS);ang.update({pose:STAND.pose(0,0),go:0,dt,t,headDrop:lerp(1.2,-.6,spread),nearHand:spread>.01?[lerp(52,60,spread),lerp(80,60,spread)]:null,farHand:spread>.01?[lerp(30,22,spread),lerp(80,60,spread)]:null});
   const wb=toScene(AX,ay,-1,38,48,AS);W6.forEach(([l,r,a,len],i)=>{const wa=a+Math.sin(t*1.2+i)*3+spread*8*(i===0?1:.4);l.draw([wb[0]-3,wb[1]+i*5],-1,wa,len*AS*.8);r.draw([wb[0]+5,wb[1]+i*5],1,wa+3,len*AS*.8);});
   const show=t>1.6;op(ang.g,show?(end?.85:1):0);op(WG,show?(end?.8:1):0);
   setA(gl,{cx:AX,cy:ay-70});op(gl,show?(.55-.3*es(t,5,6.4))*(end?.5:1):0);burst(AX,ay-60,seg(t,2.9,3.5),70);
   const hN=toScene(AX,ay,-1,ang.st.handN[0],ang.st.handN[1],AS),hF=toScene(AX,ay,-1,ang.st.handF[0],ang.st.handF[1],AS);
   [hN,hF].forEach((h,i)=>{setA(rg[i],{cx:h[0],cy:h[1],r:8+26*es(t,5.0,6.3)+(cast?6*Math.sin(t*20+i):0)});op(rg[i],es(t,5.0,6.0)*(end?.25:.9));});
   op(rbig,cast?.5+.08*Math.sin(t*14):(end?.12:0));
   const z=Math.floor(t*14);gs.forEach((g,i)=>{const gone=es(t,6.7+i*.2,7.9+i*.1);place(g.fig.g,g.x,GR+2,g.d,S);g.fig.update({pose:STAND.pose(0,0),go:0,dt,t,lean:-gone*10,headDrop:t>2.2&&t<6.3?-1.6:gone*3,nearHand:cast?[50,60]:null});op(g.fig.g,1-gone);
    const c=toScene(g.x,GR+2,g.d,41,58,S),from=i===2?hN:hF;if(cast&&gone<1){if(z!==bz){const d=zig(from,c,7,9,R);beams[i].a.setAttribute('d',d);beams[i].b.setAttribute('d',d);}op(beams[i].a,.9*(1-gone*.5));op(beams[i].b,.9);}else{op(beams[i].a,0);op(beams[i].b,0);}
    g.ash.forEach(m=>{const u=clamp((t-6.9-i*.2)/1.5+m.ph/20,0,1);setA(m.n,{cx:m.x+m.vx*u*3,cy:m.y+m.vy*u*2.4});op(m.n,gone>0&&u<1?(1-u)*.9:0);});});bz=z;
   const kn=end?es(t,8.2,8.9):0,rec=es(t,6.3,6.9)*(1-kn);place(hero.g,HX,GR+2,1,S);
   hero.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:kn>.02?crouch(22*kn):null,drop:22*kn,lean:-7*rec+6*kn,headDrop:lerp(t>2.2&&t<6.3?-1.8:0,3.4,kn),headTurn:0,nearHand:kn>.02?[lerp(52,58,kn),lerp(80,74,kn)]:(rec>.02?[56,52]:null),swordAng:lerp(22,2,kn),capeKick:rec*9});}}});
// ───────── 타락천사 기사 강림: 성벽 위의 폭풍 → 구름을 가르고 내려오는 검은 날개의 기사 ─────────
add({id:'knight',root:'r617v',match:'knight.mp4',D:8,paper:'#14161b',ink:'#dfe2ea',sky:[[0,'#0a0b0f'],[0.55,'#1d2028'],[1,'#12141a']],
 build(k){const R=seeded(6171),GR=304,S=1,HX=150;
  const cam=k.track([[0,300,176,1],[3.9,318,180,1.1],[4.1,300,206,1.22,'cut'],[8,318,214,1.42]]),dip=dipper(k,[4.1]);
  const shaft=el('path',{d:Lp([[322,-40],[356,-40],[470,250],[250,250]],true),fill:'#d6dcec',opacity:.1},k.far),sg=k.glowAt(340,-10,230,'#c8d0e4');
  const cf=grp(k.far),cb=grp(k.back);for(let i=0;i<7;i++)cloud(cf,R(-60,700),R(40,150),R(150,260),R(30,56),R,'#1b1e26',.5);for(let i=0;i<6;i++)cloud(cb,R(-80,720),R(70,210),R(170,300),R(36,64),R,'#11141a',.7);
  const bolt=el('path',{fill:'none',stroke:'#eef2ff','stroke-width':1.3,'stroke-linejoin':'round'},k.far),flash=el('rect',{x:-40,y:-40,width:720,height:450,fill:'#e6ecff',opacity:0},k.far);
  dark(k.root,merlons(-60,720,GR+3),'#0d0f14',1.1);for(let i=0;i<12;i++)ink(k.root,`M${f(R(-40,700))} ${f(R(GR+12,352))}l${f(R(14,30))} 0`,.35,{opacity:.5});
  const hero=actor(k.root,HWANDO,HX,GR+2,1,S,SHUF);hero.w.dir=1;
  const KG=grp(k.root),kw=[featherWing(KG,1),featherWing(KG,1)].map(w=>whiten(w,'#1b1a22','#8f8aa6'));
  const kn=figure(KG,{robe:'long',robeFill:'#17161c',legs:'#101014',sleeve:'#17161c',hat:HOOD,hatFill:'#17161c',sword:'#c8362c',swordLen:58,seed:8,shadow:false,restF:-10,restN:8});
  const halo=el('ellipse',{fill:'none',stroke:'#e8dcb0','stroke-width':1.1},KG),tg=k.glowAt(0,0,20,'#e0402c');
  const streaks=[];for(let i=0;i<18;i++)streaks.push({n:ink(k.near,'',R(.4,.9),{opacity:R(.25,.6)}),x:R(0,760),y:R(20,330),l:R(26,70),v:R(260,420)});
  return(t,dt)=>{cam(t);dip(t);const w=k.wind.step(t),gust=.7+.3*Math.sin(t*2.3)+.2*Math.sin(t*5.1);
   cf.setAttribute('transform',`translate(${f(-t*9)} 0)`);cb.setAttribute('transform',`translate(${f(-t*17)} 0)`);op(sg,.4+.05*Math.sin(t*3));
   let fo=0;[[1.3,[420,-30],[470,120]],[3.4,[180,-30],[150,110]],[5.3,[560,-30],[520,130]]].forEach(([tk,a,b])=>{const u=1-Math.abs(t-tk)/.16;if(u>0){fo=Math.max(fo,u);bolt.setAttribute('d',zig(a,b,6,12,seeded(Math.round(tk*10))));}});op(bolt,fo);op(flash,fo*.2);
   streaks.forEach(s=>{const x=((s.x-t*s.v)%800+800)%800-80;s.n.setAttribute('d',`M${f(x)} ${f(s.y)}l${f(s.l)} ${f(-s.l*.06)}`);});
   const back=t<3.2?es(t,.5,1.1)*(1-es(t,2.4,3.2)):0;hero.w.dir=-1;hero.w.x=HX+0;
   const pose=hero.w.step(dt,0);hero.w.dir=1;place(hero.g,HX-10*es(t,.5,3),GR+2,1,S);
   hero.fig.update({pose:SHUF.pose(t*.9*back,back*.6),go:0,dt,t,wind:-gust*2.2,lean:-9*gust*(1-es(t,5.6,6.6)*.5),capeKick:-14*gust,headDrop:1.2-es(t,4.4,5.4)*2.6,nearHand:[lerp(56,60,gust*.3),lerp(52,46,es(t,4.4,5.4))],farHand:[26,70],swordAng:lerp(20,128,es(t,6.2,7.2))});
   const d=minJerk(seg(t,.6,6.3)),ks=lerp(.34,1.32,d),kx=lerp(404,446,d),ky=lerp(74,GR+2,d)+Math.sin(t*1.7)*3*(1-d);
   place(kn.g,kx,ky,-1,ks);kn.update({pose:STAND.pose(0,0),go:0,dt,t,headDrop:1.6,swordAng:lerp(26,112,es(t,6.4,7.5)),nearHand:[lerp(54,60,es(t,6.4,7.5)),lerp(82,62,es(t,6.4,7.5))]});
   const wb=toScene(kx,ky,-1,38,47,ks),wa=lerp(56,24,d)+Math.sin(t*2.4)*9*(1-d*.6);kw[0].draw([wb[0]-3*ks,wb[1]],-1,wa,72*ks);kw[1].draw([wb[0]+5*ks,wb[1]],1,wa+4,72*ks);
   const hd=toScene(kx,ky,-1,kn.st.head[0],kn.st.head[1]-9.5,ks);setA(halo,{cx:hd[0],cy:hd[1],rx:6.4*ks,ry:1.9*ks,'stroke-width':clamp(1.1*ks,.5,1.6)});
   const tip=kn.st.tip?toScene(kx,ky,-1,kn.st.tip[0],kn.st.tip[1],ks):[kx,ky];setA(tg,{cx:tip[0],cy:tip[1],r:(12+10*es(t,5.4,7))*ks});op(tg,.4+.5*es(t,4.4,7));op(KG,es(t,.5,1.2));}}});
// ───────── 성벽에서 검은 바다로: 멀어지는 성벽·가까워지는 바다 → 물기둥 → 물속으로 가라앉음 ─────────
add({id:'fall',root:'r617v',match:'fall.mp4',D:5,paper:'#12151b',ink:'#dfe4ec',sky:[[0,'#0a0c10'],[0.5,'#1b1f27'],[1,'#0e1116']],
 build(k){const R=seeded(6172),S=1.05,FX=326,TS=2.55;
  const cam=k.track([[0,320,180,1.04],[2.5,320,196,1.16],[2.6,320,182,1.2,'cut'],[5,320,196,1.36]]);
  const cf=grp(k.far);for(let i=0;i<6;i++)cloud(cf,R(-40,680),R(40,190),R(160,280),R(34,60),R,'#181c24',.5);
  const wall=grp(k.back);dark(wall,merlons(-170,170,0,24,12),'#0c0e13',1);for(let i=0;i<8;i++)ink(wall,`M${f(R(-150,140))} ${f(R(12,80))}l${f(R(12,26))} 0`,.35,{opacity:.5});
  const sea=grp(k.root),seaFill=dark(sea,'','#0a0f16',.01),waves=[0,1,2,3,4,5].map(i=>ink(sea,'',lerp(.5,1.1,i/5),{opacity:lerp(.4,.9,i/5)}));
  const lines=[];for(let i=0;i<16;i++)lines.push({n:ink(k.root,'',R(.4,.8),{opacity:R(.25,.55)}),x:R(40,600),y:R(0,360),l:R(24,60),v:R(300,460)});
  const deep=el('rect',{x:-60,y:-60,width:760,height:480,fill:'#0b131d',opacity:0},k.front);
  const beamsU=grp(k.front);[[250,60],[330,90],[420,50]].forEach(([x,w])=>el('path',{d:Lp([[x,-40],[x+w,-40],[x+w+50,330],[x-40,330]],true),fill:'#c8dcf0',opacity:.07},beamsU));
  const SW=blade(k.near),OG=grp(k.near),hero=figure(OG,Object.assign({},HWANDO,{sword:null,shadow:false}));
  const bub=[];for(let i=0;i<18;i++)bub.push({n:el('circle',{fill:'none',stroke:INK,'stroke-width':.5,r:f(R(1,3.2))},k.near),x:R(-34,34),ph:R(0,1),v:R(40,90)});
  const sp=spark(k.near,'#f4f8ff',5),ring=el('ellipse',{fill:'none',stroke:INK,'stroke-width':1},k.near),drops=[];for(let i=0;i<9;i++)drops.push({n:ink(k.near,'',1),a:R(-2.7,-.45),v:R(90,170)});
  const blk=el('rect',{x:-60,y:-60,width:760,height:480,fill:'#000',opacity:0},k.hud);
  return(t,dt)=>{cam(t);const air=t<TS,u=ease(seg(t,0,TS)),seaY=lerp(430,236,ease(seg(t,.2,TS)));
   cf.setAttribute('transform',`translate(0 ${f(-u*70)})`);wall.setAttribute('transform',`translate(${f(lerp(300,250,u))} ${f(lerp(36,-66,u))}) scale(${f(lerp(1.5,.5,u))})`);op(wall,air?1:0);
   const W=[];for(let x=-60;x<=700;x+=40)W.push([x,seaY+Math.sin(x*.03+t*2.2)*3]);seaFill.setAttribute('d',smoothD(W)+'L700 440L-60 440Z');
   waves.forEach((n,i)=>{const y=seaY+6+i*i*4.2,Q=[];for(let x=-60;x<=700;x+=36)Q.push([x+((t*20*(i+1))%36),y+Math.sin(x*.05+t*2+i)*(1.5+i*.6)]);n.setAttribute('d',smoothD(Q));});
   lines.forEach(s=>{const y=((s.y-t*s.v)%420+420)%420-30;s.n.setAttribute('d',`M${f(s.x)} ${f(y)}l0 ${f(s.l)}`);op(s.n,air?.45:0);});
   const dv=es(t,TS,TS+.22);op(deep,dv*.93);op(beamsU,dv*(1-es(t,3.6,5)));op(sea,1-dv);
   const fy=air?lerp(92,seaY-8,u*u):lerp(150,222,ease(seg(t,TS,5))),rot=air?-64+t*52:lerp(96,128,seg(t,TS,5))+Math.sin(t*1.1)*5,fl=Math.sin(t*(air?11:1.6));
   spin(OG,FX+(air?0:Math.sin(t*.9)*6),fy,rot);place(hero.g,0,46*S,1,S);
   hero.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:[[[40,74],[48+fl*3,96],[44+fl*5,118]],[[40,74],[33-fl*3,95],[30-fl*4,117]]],footPitch:30,nearHand:[60+fl*3,air?38:50+fl*4],farHand:[22-fl*3,air?42:56-fl*4],capeKick:air?-16:-6,wind:air?2:.4,headDrop:air?-1:1.4});
   spin(SW,FX+(air?34:52+Math.sin(t)*4),air?fy-30:lerp(170,262,ease(seg(t,TS,5))),air?-110+t*60:lerp(40,96,seg(t,TS,5)));
   const su=seg(t,TS-.02,TS+.6);sp(FX,seaY-4,dv<1?su:1,58);setA(ring,{cx:FX,cy:seaY+2,rx:10+su*90,ry:2+su*9});op(ring,su>0&&su<1?(1-su)*(1-dv):0);
   drops.forEach(d=>{const q=t-TS;if(q<0||q>.9||dv>=1){d.n.setAttribute('d','');return;}const x=FX+Math.cos(d.a)*d.v*q,y=seaY-Math.sin(-d.a)*d.v*q+260*q*q;d.n.setAttribute('d',`M${f(x)} ${f(y)}l${f(Math.cos(d.a)*5)} ${f(-Math.sin(-d.a)*5+q*14)}`);});
   bub.forEach(b=>{const q=((t*.5+b.ph)%1+1)%1;setA(b.n,{cx:FX+b.x+Math.sin(t*3+b.ph*9)*3,cy:fy+10-q*b.v*1.6});op(b.n,air?0:dv*(1-q)*.8);});
   op(blk,es(t,4.1,5)*.9);}}});
// ───────── 낯선 해안: 밀려왔다 빠지는 파도 → 젖은 모래 위에 엎드린 몸 → 팔을 짚고 일어남 ─────────
add({id:'beach',root:'r617v',match:'beach.mp4',D:8,paper:'#181a1c',ink:'#e2e2dc',sky:[[0,'#0e1012'],[0.4,'#22262a'],[1,'#17191a']],
 build(k){const R=seeded(6173),S=1.2,HZ=132,X0=268,Y0=292;
  const cam=k.track([[0,330,232,1.42],[3.8,320,240,1.66],[4.0,334,262,2.2,'cut'],[8,326,250,1.95]]),dip=dipper(k,[4.0]);
  for(let i=0;i<4;i++)cloud(k.far,R(-40,680),R(40,104),R(170,280),R(18,30),R,'#1e2226',.4);ink(k.back,`M-90 ${HZ}L730 ${HZ}`,.7);
  const far=[0,1,2,3,4].map(i=>ink(k.back,'',lerp(.35,.8,i/4),{opacity:lerp(.35,.8,i/4)}));
  const water=dark(k.root,'','#232a30',.01),foam=ink(k.root,'',1.3),foam2=ink(k.root,'',.6,{opacity:.6}),wet=ink(k.root,'',.4,{opacity:.45});
  for(let i=0;i<70;i++){const x=R(-60,700),y=R(238,352);el('circle',{cx:f(x),cy:f(y),r:f(R(.3,.8)),fill:INK,opacity:f(R(.2,.5))},k.root);}
  [[196,318],[232,330],[402,322],[448,306],[378,338],[158,300]].forEach(([x,y],i)=>{const r=R(2.6,4.4);sh(k.root,`M${f(x-r)} ${f(y)}Q${f(x)} ${f(y-r*1.5)} ${f(x+r)} ${f(y)}Z`,.6);ink(k.root,`M${f(x)} ${f(y)}L${f(x)} ${f(y-r*.9)}M${f(x-r*.5)} ${f(y)}L${f(x-r*.3)} ${f(y-r*.7)}M${f(x+r*.5)} ${f(y)}L${f(x+r*.3)} ${f(y-r*.7)}`,.3);});
  [[128,312],[470,330],[330,344],[520,300]].forEach(([x,y])=>ink(k.root,`M${f(x)} ${f(y)}q4 -5 8 0t8 0t8 0M${f(x+6)} ${f(y+3)}q3 -4 6 0t6 0`,.5,{opacity:.7}));
  const SW=blade(k.root);spin(SW,300,312,-4);el('ellipse',{cx:322,cy:Y0+7,rx:62,ry:3.2,fill:'#000',opacity:.26},k.root);
  const OG=grp(k.root),hero=figure(OG,Object.assign({},HWANDO,{sword:null,shadow:false}));
  return(t,dt)=>{cam(t);dip(t);
   far.forEach((n,i)=>{const y=HZ+8+i*i*4.4,Q=[];for(let x=-80;x<=720;x+=40)Q.push([x+((t*6*(i+1))%40),y+Math.sin(x*.04+t*1.4+i)*(1+i*.5)]);n.setAttribute('d',smoothD(Q));});
   const wv=t<3.8?lerp(292,226,ease(seg(t,.9,3.8)))+(t<.9?-8*(1-t/.9):0):228+10*Math.sin((t-3.8)*1.15)+3*Math.sin(t*2.7),F=[];for(let x=-80;x<=720;x+=32)F.push([x,wv+Math.sin(x*.021+t*1.3)*5+Math.sin(x*.05-t*.9)*2.4]);
   foam.setAttribute('d',smoothD(F));foam2.setAttribute('d',smoothD(F.map(q=>[q[0]+9,q[1]-7-2*Math.sin(q[0]*.03+t)])));water.setAttribute('d',smoothD(F)+`L720 ${HZ}L-80 ${HZ}Z`);op(water,.5);
   const mark=Math.max(wv,lerp(292,250,es(t,3.8,8)));wet.setAttribute('d',smoothD(F.map(q=>[q[0],mark+10+Math.sin(q[0]*.03)*4])));
   const rise=minJerk(seg(t,4.5,7.4)),Aa=lerp(90,77,rise)-Math.sin(t*1.4)*.8*(1-rise),stir=es(t,3.9,4.6);
   spin(OG,X0,Y0,Aa);place(hero.g,0,0,1,S);
   const gN=local(X0+lerp(126,104,rise),Y0+6,X0,Y0,Aa,S),gF=local(X0+lerp(118,92,rise),Y0+7,X0,Y0,Aa,S);
   hero.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:[[[40,74],[42,96],[38,118.4]],[[40,74],[45+rise*5,96+rise*2],[43,118.4]]],footPitch:38,nearHand:[lerp(47,gN[0],Math.max(rise,stir*.3)),lerp(14,gN[1],Math.max(rise,stir*.3))],farHand:[lerp(36,gF[0],rise),lerp(12,gF[1],rise)],headDrop:lerp(2.2,-2.6,rise),headTurn:lerp(-1.4,1,rise),capeKick:-4,wind:0});}}});

// ───────── 재생: 영상 루트를 찾아 선 그림을 얹고 영상 시계를 따라간다 ─────────
const ROOTS=Object.freeze([...new Set([...CLIPS.values()].map(c=>c.root))]);
const active=new Map();/* root → o */
const tagOf=n=>String(n?.tagName||'').toLowerCase();
const connected=n=>!!n&&(typeof n.isConnected==='boolean'?n.isConnected:!!n.parentNode);
const reduced=()=>{try{if(typeof settings!=='undefined'&&settings&&'reducedMotion' in settings)return !!settings.reducedMotion;}catch(_){}try{return !!matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}};
function css(){try{if(document.getElementById('r1080Css'))return;const s=document.createElement('style');s.id='r1080Css';
 s.textContent='.r1080on>video{opacity:0!important}svg.r1080{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none}svg.r1080 .pp{fill:var(--paper)}'
 +'#r1080p{position:fixed;inset:0;z-index:2147482000;background:#030304;overflow:hidden}';(document.head||document.body).appendChild(s);}catch(e){fail(e);}}
function clipFor(root,video){const src=String(video?.currentSrc||video?.src||video?.getAttribute?.('src')||'');for(const c of CLIPS.values())if(c.root===root.id&&src.includes(c.match))return c;return null;}
function build(o){o.k=A.stage(o.svg,o.def,o.lite);o.draw=o.def.build(o.k);o.simT=0;o.draw(0,1/60);o.k.applyCam(0);o.k.fade.setAttribute('opacity','1');try{INKOF()?.dress?.(o.svg,o.root);}catch(_){}}
function advance(o,t){t=clamp(num(t),0,o.def.D);if(t<o.simT-1e-6){build(o);stats.rebuilt++;}let guard=0;
 while(o.simT<t-1e-6&&guard++<2000){const dt=Math.min(1/30,t-o.simT);o.simT+=dt;o.draw(o.simT,dt);}
 o.k.applyCam(o.simT,o.wall);o.k.fade.setAttribute('opacity',f(clamp(1-es(o.simT,0.04,0.7),0,1)));try{INKOF()?.frame?.(o.svg);}catch(_){}}
function mount(root,def,before){css();const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','r1080');svg.setAttribute('viewBox',def.vb||'0 0 640 360');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');
 root.insertBefore(svg,before||null);const o={def,root,svg,video:null,lite:reduced(),simT:0,wall:0,t0:0,raf:0,done:false,n:0,last:0,slow:0,dropped:false};build(o);return o;}
function detach(o,showVideo){if(!o||o.done)return;o.done=true;active.delete(o.root);stats.detached++;try{cancelAnimationFrame(o.raf);}catch(_){}
 try{o.svg.remove();}catch(_){}try{if(showVideo!==false)o.root.classList.remove('r1080on');}catch(_){}}
function loop(o){const step=now=>{if(o.done)return;try{if(!prefs.on||!connected(o.root)||!connected(o.video)){detach(o);return;}
   if(!o.t0)o.t0=now;o.wall=(now-o.t0)/1000;stats.frames++;advance(o,num(Number(o.video.currentTime)));
   if(!o.lite&&o.n<45){if(o.last)o.slow+=now-o.last;o.last=now;++o.n;if(!o.dropped&&((o.n===12&&o.slow/11>50)||(o.n===45&&o.slow/44>30))){o.dropped=true;o.k.dropFilter();stats.filterDropped++;}}
  }catch(e){fail(e);detach(o);return;}o.raf=requestAnimationFrame(step);};o.raf=requestAnimationFrame(step);}
function attach(root){if(!prefs.on||!root||active.has(root)||!connected(root))return false;const kids=root.children||[];let video=null,vi=-1;for(let i=0;i<kids.length;i++)if(tagOf(kids[i])==='video'){video=kids[i];vi=i;break;}
 if(!video)return false;const def=clipFor(root,video);if(!def)return false;
 try{const o=mount(root,def,kids[vi+1]||null);o.video=video;root.classList.add('r1080on');active.set(root,o);stats.attached++;advance(o,num(Number(video.currentTime)));loop(o);return true;}
 catch(e){fail(e);try{root.classList.remove('r1080on');for(const c of [...(root.children||[])])if(tagOf(c)==='svg'&&c.getAttribute('class')==='r1080')c.remove();}catch(_){}active.delete(root);return false;}}
function scan(){let n=0;if(!prefs.on||typeof document==='undefined')return 0;for(const id of ROOTS){try{const r=document.getElementById(id);if(r&&attach(r))n++;}catch(e){fail(e);}}return n;}
// 영상 없이 한 장면(확인·심사용): 화면 전체에 정지 화면(at 초) 또는 실시간 재생
function preview(id,opt={}){const def=CLIPS.get(id);if(!def||typeof document==='undefined')return null;try{document.getElementById('r1080p')?.remove();css();const root=document.createElement('div');root.id='r1080p';(opt.parent||document.body).appendChild(root);
  const o=mount(root,def,null);stats.previews++;if(Number.isFinite(opt.at)){advance(o,opt.at);}else{const step=now=>{if(!connected(root))return;if(!o.t0)o.t0=now;o.wall=(now-o.t0)/1000;try{advance(o,o.wall%(def.D+.6));}catch(e){fail(e);return;}requestAnimationFrame(step);};requestAnimationFrame(step);}
  return root;}catch(e){fail(e);return null;}}
function set(p){if(p&&typeof p.on==='boolean'&&p.on!==prefs.on){prefs.on=p.on;save();if(!prefs.on)for(const o of [...active.values()])detach(o);}return{on:prefs.on};}
try{if(typeof MutationObserver==='function'&&typeof document!=='undefined'){const start=()=>{try{new MutationObserver(()=>{try{scan();}catch(e){fail(e);}}).observe(document.body,{childList:true});scan();}catch(e){fail(e);}};
 if(document.body)start();else if(typeof addEventListener==='function')addEventListener('DOMContentLoaded',start,{once:true});}}catch(e){fail(e);}
window.__STORYWORLD_LINEART_VIDEO_R1080__=Object.freeze({revision:REV,KEY,clips:()=>[...CLIPS.values()].map(c=>({id:c.id,root:c.root,match:c.match,D:c.D})),scan,preview,set,
 inspect:()=>{const t={};let lite=null;for(const o of active.values()){t[o.def.id]=o.simT;lite=o.lite;}return{revision:REV,on:prefs.on,active:[...active.values()].map(o=>o.def.id),t,lite,stats:{...stats},lastError};}});
})();
