// R887 — 선화 컷씬 장면 일곱째 묶음(쉼터 여섯 곳 dreamRest·restEp1b·restU2·restLast3·restKairo·restHando). 재생기 lineart-cine-r880.js, 도우미는 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게".
//  · 자막은 정본 그 쉼터 글 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다. 시곗바늘은 한 줄, 십자로 읽히는 모양은 쓰지 않는다.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R887__)return;window.__STORYWORLD_LINEART_SCENES_R887__='R887-scenes-7';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,flame,motes}=A.kit;
const {STAND,SHUF,RUN,vis,op,dipper,ground,scratches,actor,crouch,HWANDO,fogBand,spark,dark}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const AMB='#f2cf7a',TEAL='#8ff0e0',REDV='#ff5a48',CY='#7fe6ee',GOLD='#f0c860';
const REST={paper:'#1b1814',ink:'#ebe3d2',sky:[[0,'#0f0d0a'],[0.55,'#2a251d'],[1,'#17140f']],line:'rgba(240,210,150,.42)'};
const BOB=(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,3.8,-1.4)}Q${P(c,4.6,-5.8)} ${P(c,0,-6)}Q${P(c,-5.6,-5.8)} ${P(c,-5.2,1)}L${P(c,-4.8,5.4)}L${P(c,-2,5)}Q${P(c,-2.6,1)} ${P(c,-1.2,-1.4)}Q${P(c,1,-3.2)} ${P(c,3.8,-1.4)}Z`);hat.setAttribute('d','');line.setAttribute('d','');};
const LONGH=(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,4,-1.4)}Q${P(c,4.8,-6)} ${P(c,0,-6.2)}Q${P(c,-6,-6)} ${P(c,-5.6,2)}L${P(c,-6.4,13)}L${P(c,-2.4,12)}Q${P(c,-3,2)} ${P(c,-1.2,-1.4)}Q${P(c,1,-3.2)} ${P(c,4,-1.4)}Z`);hat.setAttribute('d','');line.setAttribute('d','');};
// 미카엘라(흰 옷), 의목사 A, 윤서하
const MIKA={robe:'long',robeFill:'#ece7df',legs:'#b8b0a2',hat:LONGH,seed:6},EXO0={robe:'long',robeFill:'#222b38',legs:'#171c24',hat:HATS.hero,seed:5},SEOHA={robe:'uniform',robeFill:'#27405a',legs:'#1c2530',cape:'#2f8f86',hat:BOB,sword:TEAL,belt:1,seed:6};
function lines(p,x,y,w,n,R,col,gap=7,sw=1.1){const L=[];for(let i=0;i<n;i++){let d='',xx=x;const end=x+w*R(.6,1);while(xx<end){const l=R(4,13);d+=`M${f(xx)} ${f(y+i*gap)}l${f(l)} 0`;xx+=l+R(2.5,4);}L.push(el('path',{d,fill:'none',stroke:col,'stroke-width':sw,'stroke-linecap':'round'},p));}return L;}
const floorL=(p,GR,R,n=20)=>{ink(p,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(p,n,R,GR+10,356);};
const board=(k,paper)=>{const g=grp(k.hud);el('rect',{x:-40,y:-40,width:720,height:460,fill:paper},g);return g;};
const seat=d=>{const hip=[40,74+d];return[[hip,[58,74+d+1],[58,118.4]],[hip,[55,74+d+2],[54,118.4]]];};
// 모니터 틀
function monitor(p,x,y,w,h){dark(p,Lp([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],true),'#0d1114',1.6);ink(p,`M${x+w/2-20} ${y+h}l-8 16l56 0l-8 -16`,1);const g=grp(p);return g;}
const wave=(x0,x1,y,amp,fq,ph,n=60)=>{let d='';for(let i=0;i<=n;i++){const u=i/n,x=lerp(x0,x1,u);d+=(i?'L':'M')+f(x)+' '+f(y+Math.sin(u*fq+ph)*amp*(.4+.6*Math.sin(u*3.14)));}return d;};
// 시계(바늘 하나)
function clock(p,x,y,r){dark(p,ell(x,y,r,r),'#14110d',1.2);for(let i=0;i<12;i++){const a=i*.5236;ink(p,`M${f(x+Math.cos(a)*r*.82)} ${f(y+Math.sin(a)*r*.82)}L${f(x+Math.cos(a)*r*.92)} ${f(y+Math.sin(a)*r*.92)}`,.5);}const h=ink(p,'',1.1);el('circle',{cx:x,cy:y,r:1.4,fill:INK},p);return a=>h.setAttribute('d',`M${x} ${y}L${f(x+Math.sin(a)*r*.7)} ${f(y-Math.cos(a)*r*.7)}`);}
// ───────── dreamRest 기억하지 못하는 사람 ─────────
A.add(Object.assign({zone:'dreamRest',D:16.6,
 subs:[[0.8,4.4,'상담실처럼 꾸며진 쉼터에 닿아서야 지나온 길을 되짚을 수 있었다.'],[5.2,8.8,'그녀는 맥을 짚은 뒤 눈꺼풀을 들어 동공 반응을 살폈다.'],[9.6,12.6,'처치를 마치고는 문득 제 손을 내려다보았다.'],[13.4,16.2,'내 이름도 아직 돌아오지 않았다.']],
 build(k){const R=seeded(9101),GR=292,S=1.1,CX=300,SP=STAND.speed*S;
  const cam=k.track([[0,330,196,1.15],[4.8,330,200,1.4],[9.2,330,206,1.8],[12.8,356,206,2.1],[13.2,300,214,2.5,'cut'],[16.6,300,214,2.7]]),dip=dipper(k,[13.2]);
  floorL(k.root,GR,R,18);ink(k.back,'M-90 70L730 70',.6,{opacity:.5});
  // 상담실: 책장·스탠드·의자
  const BK=grp(k.back,{opacity:.6});sh(BK,Lp([[60,GR+3],[60,96],[170,96],[170,GR+3]],true),.8);for(let i=0;i<5;i++){ink(BK,`M60 ${126+i*34}L170 ${126+i*34}`,.6);for(let j=0;j<9;j++)ink(BK,`M${68+j*11} ${126+i*34}l${R(-1,1)} ${-R(16,26)}`,R(1.5,3));}
  ink(k.root,`M520 ${GR+3}L520 150`,1.3);dark(k.root,'M498 150L506 118L534 118L542 150Z','#3a3020',1);const lg=k.glowAt(520,160,150,'#e8b860');
  sh(BK,Lp([[410,180],[470,180],[470,120],[410,120]],true),.8);ink(BK,'M418 132l44 0M418 144l30 0M418 156l40 0',.5);
  dark(k.root,`M${CX-30} ${GR+3}L${CX-30} ${GR-74}Q${CX-30} ${GR-84} ${CX-22} ${GR-84}L${CX-14} ${GR-84}L${CX-12} ${GR-30}L${CX+22} ${GR-30}L${CX+22} ${GR+3}L${CX+16} ${GR+3}L${CX+16} ${GR-22}L${CX-22} ${GR-22}L${CX-22} ${GR+3}Z`,'#2b2419',1.1);
  const pat=figure(k.root,EXO0);const mk=actor(k.root,MIKA,CX+62+SP*2,GR+2,-1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);op(lg,.4+.04*Math.sin(t*3));const pl=es(t,5.2,6)*(1-es(t,6.8,7.3)),ey=es(t,7.2,7.9)*(1-es(t,8.9,9.5)),own=es(t,9.8,10.8),ph=es(t,13.6,14.6);
   place(pat.g,CX-8,GR+2,1,S);pat.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:seat(24),drop:24,lean:-3,headDrop:lerp(.6,2.2,ph),nearHand:[lerp(lerp(56,66,pl),62,ph),lerp(lerp(96,84,pl),lerp(96,78,ph),ph)],farHand:[52,98]});
   mk.up(t,dt,t>=1.4&&t<3.4?1:0,{nearHand:[lerp(lerp(lerp(60,72,pl),76,ey),58,own),lerp(lerp(lerp(80,70,pl),40,ey),62,own)],lean:lerp(6*Math.max(pl,ey),0,own),headDrop:lerp(1*Math.max(pl,ey),2.6,own)});}}},REST));
// ───────── restEp1b 사라진 귀환자 ─────────
A.add(Object.assign({zone:'restEp1b',D:16.6,
 subs:[[0.8,4.0,'귀환 경보가 울리자마자 나는 캡슐 앞으로 달려갔다.'],[4.8,8.0,'그러나 해치가 열린 캡슐 안은 텅 비어 있었다.'],[8.8,11.6,'화면에는 두 줄기 파형이 남아 있었다.'],[12.4,16.0,'나는 아이의 신호를 닫지 않고 화면 한쪽에 그대로 남겨 두었다.']],
 build(k){const R=seeded(9102),GR=292,S=1.1,PX=420,PY=GR-44,RS=RUN.speed*S;
  const MB=board(k,'#0b0e10'),dip=dipper(k,[8.4]);const cam=k.track([[0,330,200,1.15],[4.4,400,206,1.5],[8.2,420,206,1.8],[16.6,420,206,1.8]]);
  floorL(k.root,GR,R,20);ink(k.back,'M-90 60L730 60',.6,{opacity:.5});
  // 캡슐
  dark(k.root,Lp([[PX-120,GR+3],[PX-110,PY+24],[PX+110,PY+24],[PX+120,GR+3]],true),'#221d16',1.1);const ing=k.glowAt(PX,PY,90,CY);
  dark(k.root,`M${PX-104} ${PY+24}L${PX-104} ${PY}Q${PX-104} ${PY-8} ${PX-96} ${PY-8}L${PX+96} ${PY-8}Q${PX+104} ${PY-8} ${PX+104} ${PY}L${PX+104} ${PY+24}Z`,'#0e1418',1.3);ink(k.root,`M${PX-80} ${PY+14}Q${PX} ${PY+4} ${PX+80} ${PY+14}`,.6,{opacity:.6});
  const lid=grp(k.root);el('path',{d:`M${PX-104} ${PY-8}Q${PX-104} ${PY-52} ${PX-40} ${PY-56}L${PX+40} ${PY-56}Q${PX+104} ${PY-52} ${PX+104} ${PY-8}Z`,fill:'#1a2026','fill-opacity':.85,stroke:INK,'stroke-width':1.3},lid);ink(lid,`M${PX-70} ${PY-40}Q${PX} ${PY-52} ${PX+70} ${PY-40}`,.5,{opacity:.6});
  const lamp=el('circle',{cx:PX-150,cy:96,r:7,fill:REDV},k.root),lgw=k.glowAt(PX-150,96,90,REDV);ink(k.root,`M${PX-150} 60L${PX-150} 89`,1);
  const steam=fogBand(k,k.front,5,R,PY-70,PY+10,'#cfe6ea',.05,.12);
  const mk=actor(k.root,MIKA,0,GR+2,1,S,RUN);
  // 화면: 두 줄기 파형
  const mx=110,my=70,mw=420,mh=220,scn=monitor(MB,mx,my,mw,mh),wa=el('path',{d:'',fill:'none',stroke:CY,'stroke-width':1.8},scn),wb=el('path',{d:'',fill:'none',stroke:AMB,'stroke-width':1.8},scn);
  const bx=el('rect',{x:mx+mw-130,y:my+16,width:114,height:64,fill:'none',stroke:AMB,'stroke-width':1},scn);lines(scn,mx+16,my+18,70,2,R,'#9fb0b6',7,1);for(let y=my+6;y<my+mh;y+=5)el('path',{d:`M${mx+2} ${y}L${mx+mw-2} ${y}`,stroke:'#000',opacity:.2},MB);
  return(t,dt)=>{cam(t);dip(t);const run=clamp(t-.8,0,1.9),x0=PX-150-RS*1.9;mk.w.x=x0+RS*run;const b=t>=8.4;vis(MB,b);
   const al=t<4.6?.5+.5*Math.sin(t*10):.25;op(lamp,.3+.7*al);op(lgw,.5*al);const o=es(t,4.9,6.2);lid.setAttribute('transform',`rotate(${f(-68*o)} ${PX+104} ${PY-8})`);op(ing,.25+.35*o);steam(t,0,o*(1-es(t,7,8.4)));
   mk.up(t,dt,run>0&&run<1.9?1:0,{lean:run>0&&run<1.9?8:lerp(0,8,es(t,6.2,7)),headDrop:1.6*es(t,6.2,7),nearHand:t>=3?[lerp(60,68,es(t,3,3.6)),lerp(80,60,es(t,3,3.6))]:null});
   if(b){const kp=es(t,12.6,14);wa.setAttribute('d',wave(mx+20,mx+mw-20,my+mh*.55,34,22,t*2.4));wa.setAttribute('opacity',f(1-.75*es(t,12.4,13.4)));
    wb.setAttribute('d',wave(lerp(mx+20,mx+mw-124,kp),lerp(mx+mw-20,mx+mw-22,kp),lerp(my+mh*.55,my+48,kp),lerp(22,12,kp),31,t*3.1+1));op(bx,kp);}}}},REST));
// ───────── restU2 환도 자아의 탄생 ─────────
A.add(Object.assign({zone:'restU2',D:16.6,
 subs:[[0.8,3.6,'손안에서 서늘한 칼의 무게가 느껴졌다.'],[4.4,8.4,'접속 전, 미카엘라는 물컵 두 개를 꺼냈었다.'],[9.0,12.6,'그런데 그녀는 컵 하나를 더 탁자 위에 내려놓은 뒤에야 동작을 멈췄다.'],[13.4,16.2,'그때 허리춤의 환도가 짧게 세 번 울렸다.']],
 build(k){const R=seeded(9103),GR=292,S=1.1,TX=400,TY=GR-52,HX=210;
  const cam=k.track([[0,HX+16,214,2.3],[3.9,HX+20,214,2.1],[4.2,TX,214,1.8,'cut'],[12.8,TX+4,216,2.0],[13.2,HX+10,232,2.6,'cut'],[16.6,HX+12,232,2.8]]),dip=dipper(k,[4.2,13.2]);
  floorL(k.root,GR,R,18);ink(k.back,'M-90 70L730 70',.6,{opacity:.5});const lg=k.glowAt(TX,TY-60,150,'#e8b860');
  dark(k.root,Lp([[TX-74,TY],[TX+74,TY],[TX+74,TY+7],[TX-74,TY+7]],true),'#2b2419',1.1);ink(k.root,`M${TX-62} ${TY+7}L${TX-66} ${GR+3}M${TX+62} ${TY+7}L${TX+66} ${GR+3}`,1.3);
  const cups=[-40,-10,22].map(dx=>{const g=grp(k.root);dark(g,'M-7 -15L7 -15L5.5 0L-5.5 0Z','#31404a',.9);ink(g,'M-6 -10L6 -10',.4,{opacity:.7});return{g,x:TX+dx};});
  const mk=actor(k.root,MIKA,TX+104,GR+2,-1,S,STAND),hero=actor(k.root,HWANDO,HX,GR+2,1,S,STAND),rings=[0,1,2].map(()=>el('circle',{r:1,fill:'none',stroke:'#e9edf5','stroke-width':.9},k.glow)),sg=k.glowAt(0,0,40,'#dfe9ff');
  return(t,dt)=>{cam(t);dip(t);op(lg,.4);const T=[5,6.4,9.6];let hx=60,hy=80;
   cups.forEach((c,i)=>{const u=es(t,T[i],T[i]+.9),y=lerp(TY-34,TY,u);c.g.setAttribute('transform',`translate(${c.x} ${f(y)})`);op(c.g,t>=T[i]?1:0);if(t>=T[i]-.3&&t<T[i]+1.3){hx=lerp(60,72+ (2-i)*5,es(t,T[i]-.3,T[i]+.6)*(1-es(t,T[i]+.9,T[i]+1.3)));hy=lerp(80,60,es(t,T[i]-.3,T[i]+.6)*(1-es(t,T[i]+.9,T[i]+1.3)));}});
   const st=es(t,10.6,11.2);mk.up(t,dt,0,{nearHand:[lerp(hx,66,st),lerp(hy,62,st)],lean:lerp(5,0,st),headDrop:1.4+1.2*st});
   const w=es(t,.8,1.8),a=t<4.2;hero.up(t,dt,0,{swordAng:a?lerp(18,80,w):18,nearHand:a?[lerp(60,62,w),lerp(80,66,w)]:null,headDrop:a?2.2*w:2*es(t,13.6,14.2),headTurn:0});
   const hp=hero.at(52,82);sg.setAttribute('transform',`translate(${f(hp[0])} ${f(hp[1])})`);let any=0;rings.forEach((n,i)=>{const u=seg(t,13.6+i*.55,14.3+i*.55);setA(n,{cx:hp[0],cy:hp[1],r:3+u*26});const o=u>0&&u<1?1-u:0;op(n,o);any=Math.max(any,o);});op(sg,any*.7);}}},REST));
// ───────── restLast3 끼어든 시간 ─────────
A.add(Object.assign({zone:'restLast3',D:17,
 subs:[[0.8,4.0,'예배당 벽시계에서 규칙적으로 나던 소리가 딱 멎었다.'],[4.8,8.8,'환도가 통과하려던 문이 예정된 다음 구역과 이어지지 않고 있었다.'],[9.6,13.0,'화면 속 장면들의 순서가 뒤죽박죽으로 바뀌고 있었다.'],[13.8,16.6,'환도가 사라진 문 반대편에서, 전혀 다른 사람의 몽세가 열리고 있었다.']],
 build(k){const R=seeded(9104),GR=292,S=1.1,KX=400,KY=120,TS=2.6;
  const MB=board(k,'#0b0e10'),dip=dipper(k,[4.5]);const cam=k.track([[0,360,180,1.4],[4.4,380,160,1.9],[17,380,160,1.9]]);
  floorL(k.root,GR,R,18);const BK=grp(k.back,{opacity:.5});for(let i=0;i<6;i++){const x=-40+i*140;ink(BK,`M${x} ${GR+3}L${x} 110Q${x+70} 30 ${x+140} 110`,.8);}
  const hand=clock(k.root,KX,KY,30),pen=ink(k.root,'',1.2),bob=el('circle',{r:5,fill:'#3a3020',stroke:INK,'stroke-width':1},k.root),tick=[0,1].map(()=>ink(k.root,'',.7));
  const mk=actor(k.root,MIKA,300,GR+2,1,S,STAND);
  // 화면
  const mx=110,my=66,mw=420,mh=226,scn=monitor(MB,mx,my,mw,mh),P1=grp(scn),P2=grp(scn),P3=grp(scn);
  const pts=[[150,230],[210,200],[270,214],[330,180]];el('path',{d:'M'+pts.map(p=>p.join(' ')).join('L'),fill:'none',stroke:CY,'stroke-width':1.6},P1);pts.forEach(p=>el('circle',{cx:p[0],cy:p[1],r:3.4,fill:CY},P1));
  dark(P1,Lp([[340,196],[340,150],[368,150],[368,196]],true),'#0d1114',1.3);const brk=el('path',{d:'M368 172L400 172L406 162L414 182L420 172L452 172',fill:'none',stroke:'#7a8a92','stroke-width':1.4,'stroke-dasharray':'5 5'},P1);dark(P1,Lp([[452,196],[452,150],[480,150],[480,196]],true),'#0d1114',1).setAttribute('opacity','.5');const sig=el('circle',{r:4.5,fill:'#e9edf5'},P1);
  const crack=el('path',{d:'M396 120L404 144L396 160L410 176L400 198L408 222',fill:'none',stroke:'#000','stroke-width':5},P1),crk2=el('path',{d:'M396 120L404 144L396 160L410 176L400 198L408 222',fill:'none',stroke:REDV,'stroke-width':1},P1);
  const fr=[0,1,2,3].map(i=>{const g=grp(P2);dark(g,'M-40 -27L40 -27L40 27L-40 27Z','#141a1e',1.1);if(i===0)ink(g,'M-28 16L-10 -8L4 8L16 -4L30 16',.9);if(i===1)ink(g,ell(0,0,13,13),.9);if(i===2)ink(g,'M-26 14L-26 -12L26 -12L26 14M-8 14L-8 -2L8 -2L8 14',.9);if(i===3)ink(g,'M-30 8Q-10 -18 6 2Q18 16 30 -10',.9);el('circle',{cx:-33,cy:-20,r:2.4,fill:AMB},g);return g;});
  const slot=i=>[mx+70+i*94,my+mh/2],ord=[[0,1,2,3],[2,0,3,1],[3,2,1,0],[1,3,0,2]];
  dark(P3,Lp([[mx+mw/2-34,my+mh-34],[mx+mw/2-34,my+40],[mx+mw/2+34,my+40],[mx+mw/2+34,my+mh-34]],true),'#06090a',1.4);const leaf=sh(P3,'',1.2),dgl=el('rect',{x:mx+mw/2-34,y:my+40,width:0,height:mh-74,fill:TEAL,opacity:.5},P3),gr=motes(grp(P3),14,R,[mx+mw/2-30,my+44,mx+mw/2+30,my+mh-38],{fill:'#000',vy0:8,vy1:20,r0:1,r1:2});
  for(let y=my+6;y<my+mh;y+=5)el('path',{d:`M${mx+2} ${y}L${mx+mw-2} ${y}`,stroke:'#000',opacity:.2},MB);
  return(t,dt)=>{cam(t);dip(t);const b=t>=4.5;vis(MB,b);const tt=Math.min(t,TS),sw=Math.sin(tt*5.2)*.5*(t<TS?1:Math.exp(-(t-TS)*3)),px=KX+Math.sin(sw)*46,py=KY+30+Math.cos(sw)*46;pen.setAttribute('d',`M${KX} ${KY+30}L${f(px)} ${f(py)}`);setA(bob,{cx:px,cy:py});hand(Math.floor(tt*2.6)*.105);
   tick.forEach((n,i)=>{const u=((tt*2.6)%1);n.setAttribute('d',`M${KX+(i?40:-40)} ${KY-8}l${i?8:-8} -5`);op(n,t<TS?1-u:0);});mk.up(t,dt,0,{headDrop:-2.4*es(t,2.7,3.4),lean:-3*es(t,2.7,3.4)});
   if(b){const p1=t<9.2,p2=t>=9.2&&t<13.4,p3=t>=13.4;vis(P1,p1);vis(P2,p2);vis(P3,p3);const u=clamp((t-5)/2.2,0,1),i=Math.min(2,Math.floor(u*3)),q=u*3-i,a=pts[i],c=pts[i+1],sx=lerp(a[0],c[0],q),sy=lerp(a[1],c[1],q),bl=t>7.4?.5+.5*Math.sin(t*9):1;setA(sig,{cx:sx,cy:sy});op(sig,bl*(1-es(t,8.4,9)));op(brk,.5+.5*Math.sin(t*6)**2);op(crack,es(t,7.2,7.6));op(crk2,es(t,7.2,7.6));
    const ph=clamp((t-9.6)/1.1,0,2.999),pi=Math.floor(ph),pq=minJerk(ph-pi);fr.forEach((g,j)=>{const s0=slot(ord[pi].indexOf(j)),s1=slot(ord[pi+1].indexOf(j));g.setAttribute('transform',`translate(${f(lerp(s0[0],s1[0],pq))} ${f(lerp(s0[1],s1[1],pq)-Math.sin(pq*3.14)*(j%2?26:-26))})`);});
    const o=es(t,14,15.6);leaf.setAttribute('d',Lp([[mx+mw/2-34,my+mh-34],[mx+mw/2-34,my+40],[mx+mw/2-34+68*(1-o*.8),my+40+o*6],[mx+mw/2-34+68*(1-o*.8),my+mh-34+o*4]],true));setA(dgl,{x:mx+mw/2-34+68*(1-o*.8),width:68*o*.8});gr(t,0,o);}}}},REST));
// ───────── restKairo 최초명령 재작성 ─────────
A.add(Object.assign({zone:'restKairo',D:17,
 subs:[[0.8,3.8,'세이렌을 쓰러뜨리고 최초명령 코어 앞에 섰다.'],[4.6,8.6,'검은 모래가 따뜻한 금빛으로 물들고, 멎어 있던 시계들이 다시 움직이기 시작했다.'],[9.4,13.0,'그러나 자유의지와 미래 예지가 정면으로 맞닿은 자리에서 시간 특이점이 폭발했다.'],[13.8,16.6,'모니터 위의 파형이 두 갈래로 찢어졌다.']],
 build(k){const R=seeded(9105),GR=292,S=1.1,CX=420,CY0=176,r=56;
  const MB=board(k,'#0b0e10'),dip=dipper(k,[13.4]);const cam=k.track([[0,360,200,1.3],[4.2,380,196,1.45],[9,330,190,1.12],[13.2,340,186,1.0],[17,340,186,1]]);
  floorL(k.root,GR,R,20);dark(k.root,Lp([[CX-46,GR+3],[CX-30,CY0+64],[CX+30,CY0+64],[CX+46,GR+3]],true),'#17130d',1.2);
  const gl=k.glowAt(CX,CY0,150,TEAL),gg=k.glowAt(CX,CY0,210,GOLD);dark(k.root,ell(CX,CY0,r,r),'#0b0906',1.4);const tx=lines(k.root,CX-28,CY0-22,56,6,R,TEAL,7,1.2),rg=[0,1,2].map(i=>el('ellipse',{cx:CX,cy:CY0,rx:f(r*1.34),ry:f(r*(.3+i*.12)),fill:'none',stroke:TEAL,'stroke-width':1,opacity:.85},k.root));
  const sand=[];for(let i=0;i<60;i++)sand.push({n:el('circle',{cx:f(R(-40,700)),cy:f(GR+6+R(0,14)-(R(0,1)<.3?R(0,30):0)),r:f(R(1,2.2)),fill:'#000',stroke:'#e6d9b4','stroke-width':.3},k.root),d:R(0,1)});
  const cl=[[110,110,24,1.3],[196,84,18,2.4],[250,140,14,.7]].map(([x,y,rr,sp])=>({h:clock(k.root,x,y,rr),sp}));
  const bl=[0,1,2,3].map(()=>el('circle',{cx:330,cy:150,r:1,fill:'none',stroke:'#fff','stroke-width':2},k.front)),fl=el('rect',{x:-40,y:-40,width:720,height:460,fill:'#fff',opacity:0},k.hud);
  const hero=actor(k.root,SEOHA,CX-104,GR+2,1,S,STAND);
  const mx=110,my=70,mw=420,mh=220,scn=monitor(MB,mx,my,mw,mh),w0=el('path',{d:'',fill:'none',stroke:CY,'stroke-width':1.8},scn),w1=el('path',{d:'',fill:'none',stroke:CY,'stroke-width':1.8},scn),w2=el('path',{d:'',fill:'none',stroke:AMB,'stroke-width':1.8},scn);for(let y=my+6;y<my+mh;y+=5)el('path',{d:`M${mx+2} ${y}L${mx+mw-2} ${y}`,stroke:'#000',opacity:.2},MB);
  return(t,dt)=>{cam(t);dip(t);const b=t>=13.4;vis(MB,b);const wr=es(t,1.4,3.8),gd=es(t,4.8,7.2),ex=t>=10;
   tx.forEach((n,i)=>{op(n,es(t,1.2+i*.4,1.8+i*.4));n.setAttribute('stroke',gd>.5?GOLD:TEAL);});rg.forEach((n,i)=>{n.setAttribute('transform',`rotate(${f(t*(13+i*8)*(i%2?-1:1)+i*58)} ${CX} ${CY0})`);n.setAttribute('stroke',gd>.5?GOLD:TEAL);});op(gl,.5*(1-gd));op(gg,.5*gd+.05*Math.sin(t*3));
   sand.forEach(q=>{const u=es(t,4.8+q.d*1.6,5.6+q.d*1.6);q.n.setAttribute('fill',u>.5?GOLD:'#000');q.n.setAttribute('stroke-opacity',f(1-u));});
   cl.forEach(c=>c.h(Math.max(0,t-5.4)*c.sp));
   bl.forEach((n,i)=>{const u=seg(t,10+i*.35,11.6+i*.35);setA(n,{r:4+u*380});op(n,u>0&&u<1?1-u:0);});op(fl,ex?Math.max(0,.9-Math.abs(t-10.15)*5)*(k.lite?.25:1):0);/* 흔들림·강한 점멸 줄이기에서는 섬광을 약하게 */
   const sh2=ex?Math.exp(-(t-10)*1.2)*5:0;k.root.setAttribute('transform',`translate(${f(Math.sin(t*47)*sh2)} ${f(Math.cos(t*39)*sh2)})`);
   hero.up(t,dt,0,{nearHand:[lerp(60,70,wr*(1-es(t,4,4.6))),lerp(80,54,wr*(1-es(t,4,4.6)))],headDrop:ex?0:-.8*es(t,5.4,6.4),lean:ex?-10*es(t,10,10.4)*(1-es(t,12,13)):0,farHand:ex?[lerp(30,22,es(t,10,10.4)),lerp(80,50,es(t,10,10.4))]:null,capeKick:ex?-10*es(t,10,10.4):0});
   if(b){const sp=es(t,14,15.6),xm=mx+mw*.45;w0.setAttribute('d',wave(mx+20,xm,my+mh/2,26,14,t*2.6));const tail=(dy,ph)=>{let d='';for(let i=0;i<=40;i++){const u=i/40,x=lerp(xm,mx+mw-20,u);d+=(i?'L':'M')+f(x)+' '+f(my+mh/2+dy*sp*u+Math.sin(14*.45+u*12+ph)*20*(1-u*.4));}return d;};w1.setAttribute('d',tail(-56,t*2.6+6.3));w2.setAttribute('d',tail(56,t*2.6+6.3));op(w2,sp);}}}},REST));
// ───────── restHando 잘못 이어진 기록 ─────────
A.add(Object.assign({zone:'restHando',D:17,
 subs:[[0.8,4.6,'교단의 입단 기록을 넘기던 나는 방금 스쳐 지나간 종이를 다시 펼쳐 들었다.'],[5.4,8.6,'나란히 적힌 두 이름 사이에 시꺼먼 줄이 그어져 있었다.'],[9.4,13.4,'누군가 먼저 적은 글자 위에 먹물로 덧그은 흔적이었던 듯하였다.'],[14.0,16.6,'나는 검은 줄을 긁어내려다가 종이를 그대로 내려놓았다.']],
 build(k){const R=seeded(9106),GR=292,S=1.1,DX=380,DY=GR-56;
  const PB=board(k,'#14110d'),dip=dipper(k,[5]);const cam=k.track([[0,340,206,1.5],[4.8,350,210,1.9],[17,350,210,1.9]]);
  floorL(k.root,GR,R,18);ink(k.back,'M-90 70L730 70',.6,{opacity:.5});const lg=k.glowAt(DX+40,DY-60,150,'#e8b860');
  dark(k.root,Lp([[DX-80,DY],[DX+90,DY],[DX+90,DY+7],[DX-80,DY+7]],true),'#2b2419',1.1);ink(k.root,`M${DX-68} ${DY+7}L${DX-70} ${GR+3}M${DX+78} ${DY+7}L${DX+80} ${GR+3}`,1.3);
  sh(k.root,Lp([[DX-30,DY],[DX-30,DY-10],[DX+8,DY-10],[DX+8,DY]],true),.8);ink(k.root,`M${DX-30} ${DY-3}L${DX+8} ${DY-3}M${DX-30} ${DY-6}L${DX+8} ${DY-6}`,.4);ink(k.root,`M${DX+70} ${DY}L${DX+70} ${DY-40}`,1);dark(k.root,`M${DX+58} ${DY-40}L${DX+62} ${DY-56}L${DX+78} ${DY-56}L${DX+82} ${DY-40}Z`,'#3a3020',.9);
  const pg=grp(k.root);sh(pg,'M-9 -12L9 -12L9 12L-9 12Z',.8);ink(pg,'M-6 -6L6 -6M-6 5L6 5',.4);el('path',{d:'M-6 -.5L6 -.5',stroke:'#000','stroke-width':2.2},pg);
  const mk=actor(k.root,MIKA,DX-64,GR+2,1,S,STAND);
  // 가까이: 종이
  const cx=320,cy=190,pp=grp(PB),bk=el('circle',{cx:cx,cy:cy,r:10,fill:'#ffe9b0',opacity:0,filter:'url(#r880soft)'},pp);el('path',{d:`M${cx-150} ${cy-120}L${cx+146} ${cy-126}L${cx+152} ${cy+122}L${cx-144} ${cy+128}Z`,fill:'#e4dcc8','fill-opacity':.94,stroke:'#14110d','stroke-width':1.4},pp);
  lines(pp,cx-120,cy-96,120,1,R,'#3a342a',7,2.4);ink(pp,`M${cx-124} ${cy-80}L${cx+124} ${cy-83}`,.8,{style:'color:#3a342a'});
  lines(pp,cx-110,cy-40,90,1,R,'#221d16',7,3);lines(pp,cx+6,cy-40,90,1,R,'#6b6455',7,1.1);lines(pp,cx-110,cy+44,90,1,R,'#221d16',7,3);lines(pp,cx+6,cy+44,90,1,R,'#6b6455',7,1.1);
  const under=lines(pp,cx-104,cy+2,88,1,R,'#7a2f2a',7,2.6)[0],bar=el('path',{d:`M${cx-116} ${cy+1}L${cx-60} ${cy+4}L${cx-10} ${cy}L${cx+40} ${cy+3}L${cx+96} ${cy+1}`,fill:'none',stroke:'#050403','stroke-width':13,'stroke-linecap':'round','stroke-linejoin':'round'},pp);
  const lt=el('circle',{cx:cx,cy:cy+2,r:60,fill:'#ffe9b0',opacity:0,filter:'url(#r880soft)'},pp),fg=el('path',{d:'M-13 0Q-15 -40 0 -46Q15 -40 13 0L16 170L-16 170Z',fill:'#d9c4b2',stroke:'#14110d','stroke-width':1.4},PB);
  return(t,dt)=>{cam(t);dip(t);op(lg,.42);const b=t>=5;vis(PB,b);const fp=es(t,1,2)*(1-es(t,2.2,2.8)),up=es(t,3,4.2);
   mk.up(t,dt,0,{nearHand:[lerp(lerp(64,72,fp),66,up),lerp(lerp(74,66,fp),58,up)],farHand:[lerp(50,58,up),lerp(78,62,up)],headDrop:lerp(2.4,1.2,up),lean:lerp(6,2,up)});const hp=mk.at(66,lerp(72,56,up));pg.setAttribute('transform',`translate(${f(lerp(DX-10,hp[0]+5,up))} ${f(lerp(DY-14,hp[1]-6,up))}) rotate(${f(-14*up)})`);
   if(!b)return;const lit=es(t,9.6,10.8)*(1-.3*es(t,13.4,14)),sc=es(t,14.2,14.9)*(1-es(t,15.2,16)),dn=es(t,15.6,16.6);
   pp.setAttribute('transform',`translate(0 ${f(Math.sin(t*.8)*3+26*dn)}) rotate(${f(-2+3*dn)} ${cx} ${cy})`);op(lt,.55*lit);bar.setAttribute('stroke-opacity',f(1-.45*lit));op(under,.25+.75*lit);
   fg.setAttribute('transform',`translate(${f(lerp(470,cx+52,sc))} ${f(lerp(430,cy+12,sc))}) rotate(-24)`);}}},REST));
})();
