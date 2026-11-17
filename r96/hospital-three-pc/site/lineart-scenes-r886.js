// R886 — 선화 컷씬 장면 여섯째 묶음(8부 사이비 합일몽세 cult01·02·05·06·03·04). 재생기 lineart-cine-r880.js, 도우미는 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게".
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다. 십자·육망성으로 읽히는 모양과 cult03 의 황금빛 탄막 문장은 쓰지 않는다.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R886__)return;window.__STORYWORLD_LINEART_SCENES_R886__='R886-scenes-6';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,flame,motes}=A.kit;
const {STAND,SHUF,RUN,vis,op,dipper,ground,scratches,actor,crouch,HWANDO,fogBand,spark,dark}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const AMB='#f2cf7a',BLU='#7fb4ff',REDV='#ff5a48',VIO='#b79cff',ROSE='#c2415a',NERVE='#030203';
const CULT={paper:'#170f14',ink:'#e8ddd8',sky:[[0,'#0c070a'],[0.55,'#261620'],[1,'#130b10']],line:'rgba(230,170,190,.42)'};
const HOOD=(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-5.6,5)}Q${P(c,-7,-5)} ${P(c,-1,-9.5)}Q${P(c,4,-8)} ${P(c,5,-2)}L${P(c,3.6,-1.4)}Q${P(c,0,-4.4)} ${P(c,-2.4,0)}L${P(c,-2,5.4)}Z`);line.setAttribute('d','');};
const BELIEVER=sd=>({robe:'long',robeFill:'#2a1a22',legs:'#1a1016',hat:HOOD,hatFill:'#2a1a22',seed:sd});
const EXB={robe:'long',robeFill:'#3d4450',legs:'#22272f',hat:HATS.doctor,sword:'#e6c36f',seed:4};
// 읽을 수 없는 글줄
function lines(p,x,y,w,n,R,col,gap=7,sw=1.1){const L=[];for(let i=0;i<n;i++){let d='',xx=x;const end=x+w*R(.6,1);while(xx<end){const l=R(4,13);d+=`M${f(xx)} ${f(y+i*gap)}l${f(l)} 0`;xx+=l+R(2.5,4);}L.push(el('path',{d,fill:'none',stroke:col,'stroke-width':sw,'stroke-linecap':'round'},p));}return L;}
const floorL=(p,GR,R,n=20)=>{ink(p,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(p,n,R,GR+10,356);};
const bez=(a,c,b,u)=>[(1-u)*(1-u)*a[0]+2*u*(1-u)*c[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*u*(1-u)*c[1]+u*u*b[1]];
// 검은 신경선(밝은 테를 두른 검은 줄) + 그 위를 타는 알갱이
function nerve(p,a,c,b,w=1.6){const d=`M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;el('path',{d,fill:'none',stroke:'#8a6a78','stroke-width':w+1,'stroke-linecap':'round',opacity:.7},p);el('path',{d,fill:'none',stroke:NERVE,'stroke-width':w,'stroke-linecap':'round'},p);return{a,c,b};}
function riders(p,ns,n,col,r=1.5){const arr=[];ns.forEach((q,i)=>{for(let j=0;j<n;j++)arr.push({q,ph:(i*.37+j/n)%1,n:el('circle',{r,fill:col},p)});});return(t,sp=.3,a=1)=>arr.forEach(o=>{const u=((t*sp+o.ph)%1+1)%1,pp=bez(o.q.a,o.q.c,o.q.b,u);setA(o.n,{cx:pp[0],cy:pp[1]});op(o.n,a*Math.sin(u*3.14));});}
// ───────── cult01 하나로 묶인 악몽 ─────────
A.add(Object.assign({zone:'cult01',D:16.5,
 subs:[[0.8,5.0,'끔찍한 순환의 고리를 빠져나온 뒤에도 나는 고리가 맞물려 있던 자리를 오래 살폈다.'],[5.8,9.8,'더 깊은 안쪽으로 들어가자 수많은 이의 몽세가 거미줄처럼 한데 묶여 있었다.'],[10.6,15.4,'신도들은 제 발로 찾아와 이마에 전자 칩을 심었고, 각자의 칩에서는 시꺼먼 신경망이 뻗어 나오고 있었다.']],
 build(k){const R=seeded(8101),GR=292,S=1.08,HUBX=360,HUBY=96;
  const cam=k.track([[0,306,256,1.7],[5.2,318,246,1.5],[5.5,350,150,1.02,'cut'],[10,360,156,1.12],[10.3,300,236,2.0,'cut'],[16.5,360,228,1.85]]),dip=dipper(k,[5.5,10.3]);
  floorL(k.root,GR,R,22);
  // 끊긴 고리
  const RG=grp(k.root);el('path',{d:`M250 ${GR+24}A70 15 0 0 1 380 ${GR+16}`,fill:'none',stroke:INK,'stroke-width':1.6},RG);el('path',{d:`M396 ${GR+20}A70 15 0 0 1 262 ${GR+31}`,fill:'none',stroke:INK,'stroke-width':1.6,'stroke-dasharray':'8 6',opacity:.7},RG);ink(RG,`M380 ${GR+16}l6 -5M396 ${GR+20}l7 3M384 ${GR+12}l4 -7`,.8);const rgl=k.glowAt(388,GR+16,40,'#58e0c0');
  // 거미줄처럼 묶인 몽세들
  const WB=grp(k.back),bub=[],ns=[];for(let i=0;i<26;i++){const a=R(0,6.283),rr=R(60,330),x=HUBX+Math.cos(a)*rr*1.1,y=HUBY+Math.sin(a)*rr*.5;if(y>GR-70||y<-30)continue;bub.push({x,y,r:R(7,15),ph:R(0,6)});}
  bub.forEach((b,i)=>{ns.push(nerve(WB,[b.x,b.y],[(b.x+HUBX)/2+R(-20,20),(b.y+HUBY)/2+R(-16,16)],[HUBX,HUBY],.9));const o=bub[(i+3)%bub.length];if(i%2)el('path',{d:`M${f(b.x)} ${f(b.y)}Q${f((b.x+o.x)/2)} ${f((b.y+o.y)/2+14)} ${f(o.x)} ${f(o.y)}`,fill:'none',stroke:INK,'stroke-width':.4,opacity:.5},WB);});
  bub.forEach(b=>{b.n=el('circle',{cx:f(b.x),cy:f(b.y),r:f(b.r),fill:'#22141c',stroke:INK,'stroke-width':.8},WB);b.e=el('path',{d:`M${f(b.x-b.r*.5)} ${f(b.y+b.r*.2)}Q${f(b.x)} ${f(b.y-b.r*.5)} ${f(b.x+b.r*.5)} ${f(b.y+b.r*.2)}`,fill:'none',stroke:INK,'stroke-width':.5,opacity:.7},WB);});
  dark(WB,ell(HUBX,HUBY,17,17),'#0a0508',1.2);const hg=k.glowAt(HUBX,HUBY,90,ROSE),run=riders(WB,ns,1,'#f0c4d0',1.2);
  // 잠든 신도들
  const BL=grp(k.root),bel=[];for(let i=0;i<7;i++){const x=150+i*62,fg=figure(BL,BELIEVER(i+2));place(fg.g,x,GR+2,i%2?1:-1,S*.92);const hx=x+(i%2?1:-1)*S*.92*2.6,hy=GR+2+S*.92*(31-120)+12;bel.push({fg,x,hx,hy,chip:el('circle',{cx:f(hx+(i%2?3:-3)),cy:f(hy-2),r:1.6,fill:VIO},k.glow),nv:nerve(BL,[hx,hy-6],[x+R(-30,30),GR-190],[x+R(-40,40),GR-330],1.4)});}
  const run2=riders(BL,bel.map(b=>b.nv),2,'#f0c4d0',1.3),hero=actor(k.root,HWANDO,300,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.5,c=t>=10.3;vis(RG,a);op(rgl,a?.3+.1*Math.sin(t*2):0);vis(BL,c);op(WB,a?.25:1);
   bub.forEach(b=>b.n.setAttribute('r',f(b.r*(1+.06*Math.sin(t*1.6+b.ph)))));op(hg,(a?.2:.5)+.1*Math.sin(t*2.4));run(t,.22,a?0:1);
   bel.forEach((b,i)=>{b.fg.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:crouch(30),drop:30,headDrop:3.4,lean:6});op(b.chip,c?.4+.6*Math.sin(t*3+i)**2:0);});run2(t,.3,c?1:0);
   hero.w.x=a?300:c?86:-300;hero.up(t,dt,0,{headDrop:a?2.4:1.4,lean:a?6*es(t,1,2.4):0,legPts:a?crouch(14*es(t,1,2.4)):null,drop:a?14*es(t,1,2.4):0,swordAng:18});}}},CULT));
// ───────── cult02 교주가 기다리는 전쟁 ─────────
A.add(Object.assign({zone:'cult02',D:16.5,
 subs:[[0.8,5.0,'생명공학으로 배양해 낸 거대한 육체 안으로 기계공학의 케이블들이 파고들고 있었다.'],[5.8,10.0,'수천 명의 자아가 그 검은 선을 타고 단 하나의 몸뚱이 안으로 모여들었다.'],[10.8,15.6,'내가 조금 전까지 분명히 읽을 수 있었던 신도의 이름이 연결망 안에서 흔적도 없이 지워졌다.']],
 build(k){const R=seeded(8102),GR=292,S=1.08,BX=420,BY=170;
  const cam=k.track([[0,360,210,1.05],[5.2,400,186,1.3],[10.2,410,176,1.45],[10.5,150,216,2.5,'cut'],[16.5,156,214,2.7]]),dip=dipper(k,[10.5]);
  floorL(k.root,GR,R,22);const gl=k.glowAt(BX,BY,220,ROSE);
  // 배양조와 거대한 육체(웅크린 몸)
  ink(k.root,`M${BX-130} ${GR+3}L${BX-130} 40M${BX+130} ${GR+3}L${BX+130} 40M${BX-130} 40L${BX+130} 40`,1.6);ink(k.root,`M${BX-130} 64L${BX+130} 64M${BX-130} ${GR-16}L${BX+130} ${GR-16}`,.6,{opacity:.6});
  const body=el('path',{d:`M${BX-96} ${GR-18}Q${BX-116} ${GR-90} ${BX-74} ${GR-140}Q${BX-70} ${GR-196} ${BX-22} ${GR-204}Q${BX+18} ${GR-206} ${BX+24} ${GR-168}Q${BX+84} ${GR-160} ${BX+100} ${GR-96}Q${BX+112} ${GR-40} ${BX+92} ${GR-18}Z`,fill:'#3a1f2a',stroke:INK,'stroke-width':1.6},k.root);
  ink(k.root,`M${BX-60} ${GR-120}Q${BX-20} ${GR-96} ${BX+10} ${GR-130}M${BX-40} ${GR-60}Q${BX+10} ${GR-50} ${BX+60} ${GR-84}M${BX-30} ${GR-180}q8 6 18 2M${BX-74} ${GR-140}Q${BX-50} ${GR-150} ${BX-36} ${GR-168}M${BX+24} ${GR-168}Q${BX+20} ${GR-140} ${BX+40} ${GR-120}`,.8,{opacity:.8});
  const bubs=motes(grp(k.root),16,R,[BX-120,70,BX+120,GR-20],{vy0:-14,vy1:-6,vx0:-1,vx1:1,r0:.6,r1:1.6});
  const src=[[-90,60],[-90,150],[-90,240],[60,-40],[200,-40],[730,80],[730,200],[640,-40]],ns=src.map(([x,y],i)=>nerve(k.root,[x,y],[(x+BX)/2+R(-30,30),(y+BY)/2+R(-50,30)],[BX+R(-70,70),BY+R(-40,50)],2.2)),run=riders(k.root,ns,7,'#f6d6de',1.6);
  ns.forEach(q=>dark(k.root,ell(q.b[0],q.b[1],4,4),'#1a0d13',.9));
  // 이름표(가까이)
  const tg=grp(k.root),tx=150,ty=206;nerve(tg,[80,150],[120,196],[tx-22,ty],2.2);dark(tg,Lp([[tx-22,ty-11],[tx+26,ty-11],[tx+26,ty+11],[tx-22,ty+11]],true),'#2a1a22',.9);const nm=lines(tg,tx-17,ty-4,38,2,R,'#f0e6dc',7,1.5),nmg=k.glowAt(tx,ty,30,ROSE);
  const hero=actor(k.root,HWANDO,96,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const c=t>=10.5;op(gl,.35+.12*Math.sin(t*2.2));body.setAttribute('transform',`translate(${BX} ${GR-18}) scale(${f(1+.012*Math.sin(t*2.2))}) translate(${-BX} ${-GR+18})`);bubs(t,0,.6);run(t,.16+.1*es(t,5.8,7),es(t,.6,2)*(.4+.6*es(t,5.8,7)));
   nm.forEach((n,i)=>{const u=es(t,12+i*.9,13.2+i*.9);n.setAttribute('stroke-dasharray',`${f(60*(1-u))} 70`);op(n,1-u*.9);});op(nmg,c?.5*(1-es(t,13.6,14.6)):0);
   hero.up(t,dt,0,{headDrop:c?.6:-1.6,headTurn:0,nearHand:c?[lerp(60,66,es(t,11,11.8)*(1-es(t,14.4,15.4))),lerp(80,58,es(t,11,11.8)*(1-es(t,14.4,15.4)))]:null,swordAng:18});}}},CULT));
// ───────── cult05 돌아오는 현실의 기억 ─────────
A.add(Object.assign({zone:'cult05',D:17.2,
 subs:[[0.8,4.4,'문득 서로 다른 하늘이 내다보이던 두 개의 창문이 떠올랐다.'],[5.2,8.6,'나는 손에 쥐고 있던 환도를 내려다보았다.'],[9.4,13.8,'첫째 아이의 간절한 의지가 이 한 자루의 칼이 되었고, 의목사 B였던 몸과 전투의 기억은 칼을 쥔 내게로 남았다.'],[14.4,16.9,'나는 칼집 위에 가만히 손을 얹었다가 천천히 거두었다.']],
 build(k){const R=seeded(8105),GR=292,S=1.1,HX=330,WX=250,EX=412,WY=110;
  const cam=k.track([[0,330,186,1.3],[4.8,330,176,1.45],[5,340,222,2.5,'cut'],[9,346,224,2.7],[9.3,330,206,1.7,'cut'],[14,330,204,1.85],[14.3,336,226,2.5,'cut'],[17.2,338,228,2.6]]),dip=dipper(k,[5,9.3,14.3]);
  floorL(k.root,GR,R,20);const fog=fogBand(k,k.back,7,R,60,260,'#a48a98',.05,.11);
  // 떠오르는 두 창문
  const MW=grp(k.root);el('path',{d:`M${WX-26} ${WY+60}L${WX-26} ${WY-4}Q${WX-26} ${WY-34} ${WX} ${WY-54}Q${WX+26} ${WY-34} ${WX+26} ${WY-4}L${WX+26} ${WY+60}Z`,fill:'#16264a',stroke:INK,'stroke-width':1.2},MW);el('path',{d:`M${WX+5} ${WY-24}A14 14 0 1 0 ${WX+10} ${WY+2}A10.5 10.5 0 1 1 ${WX+5} ${WY-24}Z`,fill:'#dfe9ff'},MW);
  el('circle',{cx:EX,cy:WY,r:38,fill:'#3a1c14',stroke:INK,'stroke-width':1.2},MW);el('circle',{cx:EX+7,cy:WY-7,r:17,fill:'#f3d9a4'},MW);el('path',{d:`M${EX-38} ${WY+18}Q${EX-16} ${WY+8} ${EX+6} ${WY+15}M${EX-26} ${WY+14}l7 -10M${EX-12} ${WY+12}l8 -9`,fill:'none',stroke:'#0a0707','stroke-width':2,'stroke-linecap':'round'},MW);
  const gw=k.glowAt(WX,WY,80,'#3f63b8'),ge=k.glowAt(EX,WY,80,'#c0683a');
  // 겹쳐 보이는 두 사람: 아이(칼 쪽)·의목사 B(몸 쪽)
  const GH=grp(k.root,{opacity:0}),kid=figure(GH,{robe:'coat',robeFill:'#cfe0ff',legs:'#9fb4dc',hat:HATS.patient,seed:2}),exb=figure(GH,EXB),sg=k.glowAt(HX+40,GR-60,70,'#dfe9ff');
  const hero=actor(k.root,HWANDO,HX,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);fog(t,1,1);const a=t<5,w=es(t,.6,2)*(1-es(t,4.2,4.9));op(MW,a?w:0);op(gw,a?.5*w:0);op(ge,a?.5*w:0);MW.setAttribute('transform',`translate(0 ${f(8*(1-w))})`);
   const lk=es(t,5.1,6),c=t>=9.3&&t<14.3,gh=c?es(t,9.6,10.8)*(1-es(t,13.2,14.1)):0,hd=es(t,14.6,15.4)*(1-es(t,15.9,16.7));
   hero.up(t,dt,0,{headDrop:a?-1.4*w:2.6*lk*(t<14.3?1:.6),headTurn:0,swordAng:lerp(18,88,lk)*(1-es(t,14.2,14.4))+18*es(t,14.2,14.4),nearHand:t<14.3?[lerp(60,62,lk),lerp(80,66,lk)]:[lerp(60,50,hd),lerp(80,72,hd)],farHand:t<14.3&&lk>0?[lerp(30,74,lk),lerp(80,62,lk)]:null});
   op(GH,gh*.75);op(sg,gh*.6+.15*lk*(t<14.3?1:0));place(kid.g,HX+66,GR-28,-1,S*.56);kid.update({pose:STAND.pose(0,0),go:0,dt,t,nearHand:[62,60],headDrop:-.6});place(exb.g,HX-30,GR+2,1,S);exb.update({pose:STAND.pose(0,0),go:0,dt,t,swordAng:88,nearHand:[62,66]});}}},CULT));
// ───────── cult06 처음 세웠던 목표 ─────────
A.add(Object.assign({zone:'cult06',D:16.5,
 subs:[[0.8,4.0,'우리가 침투 전에 세웠던 목표는 분명 두 가지였다.'],[4.8,10.4,'적그리스도의 소환이 끝나기 전에 합일 회로를 끊어 내는 일, 그리고 붙잡힌 신도들의 몽세를 정화해 각자에게 온전한 자아를 돌려주는 일이었다.'],[11.2,15.4,'나는 두 가지 목표를 입속으로 다시 되뇌며 손안의 환도를 고쳐 쥐었다.']],
 build(k){const R=seeded(8106),GR=292,S=1.1,HX=300,AX=214,BX=396,VY=120;
  const cam=k.track([[0,HX,200,1.4],[4.4,HX+4,194,1.33],[10.6,HX+6,176,1.3],[11,HX+20,216,2.0],[16.5,HX+40,214,1.8]]);
  floorL(k.root,GR,R,20);const fog=fogBand(k,k.back,6,R,80,260,'#a48a98',.04,.1),cg=k.glowAt(640,GR-80,150,ROSE);
  // 목표 하나: 합일 회로를 끊는다
  const V1=grp(k.root);ink(V1,ell(AX,VY,36,36),.6,{opacity:.6});const loop=el('path',{d:`M${AX+24} ${VY}A24 24 0 1 1 ${AX+23.9} ${VY-1}`,fill:'none',stroke:ROSE,'stroke-width':2.4},V1);[0,1,2,3,4].forEach(i=>{const a=i*1.256+.4;dark(V1,ell(AX+Math.cos(a)*24,VY+Math.sin(a)*24,3,3),'#1a0d13',.8);});
  const cut=el('path',{d:`M${AX+8} ${VY-40}L${AX+34} ${VY-8}`,fill:'none',stroke:'#f4f0e8','stroke-width':2,'stroke-linecap':'round'},V1),sp1=spark(V1,'#fff3d6',5);
  // 목표 둘: 자아를 돌려준다
  const V2=grp(k.root);ink(V2,ell(BX,VY,36,36),.6,{opacity:.6});const sl=figure(V2,BELIEVER(3));place(sl.g,BX-8,VY+30,1,.56);const mote=el('circle',{r:3,fill:'#fff1c4'},V2),mg=k.glowAt(0,0,22,AMB);
  const hero=actor(k.root,HWANDO,HX,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);fog(t,1,1);op(cg,.25+.2*es(t,11,13)+.05*Math.sin(t*3));
   const a1=es(t,1.2,2.2),a2=es(t,2,3),c1=es(t,5.6,6),br=es(t,5.9,6.4),rt=es(t,7.6,9.6),out=1-es(t,10.6,11.4);op(V1,a1*out);op(V2,a2*out);
   cut.setAttribute('stroke-dasharray',`${f(44*c1)} 50`);loop.setAttribute('stroke-dasharray',br>0?`${f(150-10*br)} ${f(10*br+1)}`:'');loop.setAttribute('opacity',f(1-.5*br));sp1(AX+22,VY-22,seg(t,5.9,6.5),20);
   sl.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:crouch(28*(1-rt)),drop:28*(1-rt),headDrop:3.2*(1-rt),lean:6*(1-rt)});const mp=bez([BX+30,VY-34],[BX+16,VY-10],[BX-7,VY+30-.56*62],rt);setA(mote,{cx:mp[0],cy:mp[1]});op(mote,a2*(1-es(t,9.5,10)));mg.setAttribute('transform',`translate(${f(mp[0])} ${f(mp[1])})`);op(mg,a2*out*.6);
   const rg=es(t,12.2,13.2),lip=t>=11.2&&t<12.6?Math.sin(t*9)*.4:0;hero.up(t,dt,0,{headDrop:t<10.8?-1.6*a1:.6+lip,swordAng:lerp(18,lerp(60,34,es(t,13.2,14.2)),rg),nearHand:[lerp(60,62,rg),lerp(80,66,rg)],farHand:rg>0?[lerp(30,56,rg*(1-es(t,13.4,14.4))),lerp(80,70,rg)]:null,legPts:crouch(3*rg),drop:3*rg});}}},CULT));
// ───────── cult03 사몽의 문턱 ─────────
A.add(Object.assign({zone:'cult03',D:17,
 subs:[[0.8,4.4,'‘삼중자아 수확실’ 안에 한리안과 백이온이 나란히 서 있었다.'],[5.2,8.4,'두 사람은 내가 가까이 다가가도 길을 비켜서지 않았다.'],[9.2,13.0,'나는 그들의 등에서 시꺼먼 회로로 이어진 신경 다발을 바라보았다.'],[13.8,16.6,'그러나 공허한 눈을 한 둘은 내 앞에서 한 치도 물러설 기색이 없었다.']],
 build(k){const R=seeded(8103),GR=292,S=1.1,PX=388,CX=600,SP=STAND.speed*S;
  const cam=k.track([[0,400,186,1.15],[4.8,400,190,1.3],[8.8,360,204,1.5],[9.1,500,190,1.5,'cut'],[13.2,520,186,1.65],[13.5,414,190,2.9,'cut'],[17,416,190,3.1]]),dip=dipper(k,[9.1,13.5]);
  floorL(k.root,GR,R,22);
  // 세 겹 수확 고리(위·가운데·아래 층)
  const T=grp(k.back);[0,1,2].forEach(i=>{const y=74+i*62;el('ellipse',{cx:330,cy:y,rx:300-i*20,ry:17,fill:'none',stroke:INK,'stroke-width':.9,opacity:.6},T);for(let j=0;j<9;j++){const x=80+j*62+i*14;ink(T,`M${x} ${y+10}l0 16`,.5,{opacity:.5});el('circle',{cx:x,cy:y+30,r:3.2,fill:'#22141c',stroke:INK,'stroke-width':.5,opacity:.8},T);}});
  // 회로 벽
  dark(k.root,Lp([[CX-26,GR+3],[CX-26,40],[CX+140,40],[CX+140,GR+3]],true),'#0d070a',1.4);const cir=[];for(let i=0;i<7;i++){const y=64+i*32;cir.push(el('path',{d:`M${CX-26} ${y}l28 0l10 ${i%2?10:-10}l40 0l8 ${i%2?-8:8}l60 0`,fill:'none',stroke:ROSE,'stroke-width':1.3},k.root));dark(k.root,ell(CX+12+(i%3)*30,y+(i%2?10:-10),3,3),'#1a0d13',.7);}
  const cg=k.glowAt(CX+30,170,170,ROSE);
  const ex=[[PX,{robe:'long',robeFill:'#4a4f5c',legs:'#262a33',hat:HATS.doctor,seed:5}],[PX+44,{robe:'long',robeFill:'#5c4a52',legs:'#2f2228',hat:HATS.nurse,seed:8}]].map(([x,o])=>actor(k.root,o,x,GR+2,-1,S,STAND));
  const ns=[];ex.forEach((a,i)=>{for(let j=0;j<4;j++)ns.push(nerve(k.root,[a.w.x+9,GR-66+j*5],[a.w.x+70+j*10,GR-110-j*16+i*20],[CX-26,70+j*40+i*20],1.5));});const run=riders(k.root,ns,2,'#f0c4d0',1.3);
  const eyes=ex.map(a=>el('circle',{r:1.5,fill:'#0a0508',stroke:'#f4f0e8','stroke-width':.6},k.root));
  const hero=actor(k.root,HWANDO,PX-58-SP*2.6,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);op(cg,.35+.12*Math.sin(t*2.6));cir.forEach((n,i)=>op(n,.5+.5*Math.sin(t*2.6-i*.6)**2));run(t,.28,1);
   ex.forEach((a,i)=>{a.up(t,dt,0,{nearHand:[lerp(60,66,es(t,6.4,7.4)),lerp(80,62,es(t,6.4,7.4))],headDrop:0});const h=a.at(40.4,31);setA(eyes[i],{cx:h[0],cy:h[1]});});
   hero.up(t,dt,t>=5.2&&t<7.8?1:0,{swordAng:lerp(18,70,es(t,8,8.8)),nearHand:t>=8?[60,lerp(80,64,es(t,8,8.8))]:null,headDrop:-.6*es(t,9.2,10)});}}},CULT));
// ───────── cult04 교주의 사몽 ─────────
A.add(Object.assign({zone:'cult04',D:17,
 subs:[[0.8,5.2,'최종 제단에 선 교주가 가볍게 손끝을 움직이자, 내가 디디고 서 있는 바닥의 방향부터 통째로 뒤집혔다.'],[6.0,9.6,'쓰러지지 않으려고 발을 고쳐 디디는 순간 주변의 시간이 거짓말처럼 멎었다.'],[10.4,13.4,'간신히 붙들고 있던 내 기억도 안개처럼 다시 흐려지기 시작했다.'],[14.0,16.6,'이미 ‘사몽’의 경지로 완전히 각성한 교만의 사이보그 교주였다.']],
 build(k){const R=seeded(8104),GR=292,S=1.1,HX=220,LX=500,LY=GR-66,T1=6.6;
  const cam=k.track([[0,360,196,1.1],[5.4,340,196,1.2],[9.8,300,200,1.35],[10.2,HX+10,214,2.1,'cut'],[13.6,HX+14,214,2.3],[13.9,LX-6,150,2.1,'cut'],[17,LX-6,144,2.5]]),dip=dipper(k,[10.2,13.9]);
  // 뒤집히는 바닥·제단(영웅과 교주는 그대로)
  const ST=grp(k.root);ink(ST,`M-400 ${GR+3}L1100 ${GR+3}`,1);scratches(ST,24,R,GR+10,356);for(let i=0;i<4;i++)dark(ST,Lp([[LX-120+i*24,GR+3-i*22],[LX+140,GR+3-i*22],[LX+140,GR+3-(i+1)*22],[LX-96+i*24,GR+3-(i+1)*22]],true),'#1c1218',1);
  for(let i=0;i<6;i++){const x=-40+i*120;sh(ST,Lp([[x,GR+3],[x,60],[x+22,60],[x+22,GR+3]],true),.8).setAttribute('opacity','.45');}ink(ST,'M-400 60L1100 60',.6,{opacity:.5});
  const deb=[];for(let i=0;i<22;i++)deb.push({n:dark(k.root,'M-3 -2L3 -3L4 2L-2 3Z','#2a1a22',.6),x:R(40,620),y:R(40,GR-10),vx:R(-30,30),vy:R(20,70),r:R(-200,200)});
  const lg=k.glowAt(LX,LY-60,150,ROSE);
  // 교주: 사람 반쪽 + 기계 반쪽, 등 뒤 신경선, 머리 위 둥근 고리
  const LD=grp(k.root),ns=[0,1,2,3,4].map(i=>nerve(LD,[LX+8,LY-58+i*6],[LX+70+i*14,LY-120-i*10],[LX+150+i*10,-40],1.6)),run=riders(LD,ns,2,'#f0c4d0',1.3);
  const ld=figure(LD,{robe:'long',robeFill:'#120b0f',legs:'#0b0709',hat:HATS.helm,hatFill:'#3a3f4a',seed:9,restN:2,restF:-2});const halo=el('ellipse',{cx:LX-2,cy:LY-116,rx:15,ry:4.5,fill:'none',stroke:AMB,'stroke-width':1.2},LD);
  const plate=el('path',{d:'',fill:'#3a3f4a',stroke:INK,'stroke-width':.7},LD),eye=el('circle',{r:1.7,fill:REDV},LD),eg=k.glowAt(0,0,26,REDV);
  const fog=fogBand(k,k.front,8,R,150,300,'#b9a3ae',.1,.2),hero=actor(k.root,HWANDO,HX,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const fl=minJerk(seg(t,2.6,5)),frz=Math.min(t,T1),stp=es(t,3,3.5)*(1-es(t,5.6,6.4));
   ST.setAttribute('transform',`rotate(${f(-180*fl)} 330 ${GR-90})`);op(ST,1-.25*Math.sin(fl*3.14));
   deb.forEach(q=>{const u=Math.max(0,frz-2.4);q.n.setAttribute('transform',`translate(${f(q.x+q.vx*u)} ${f(q.y+q.vy*u-(q.vy*4.2*.5))}) rotate(${f(q.r*u)})`);op(q.n,t>=2.4?1:0);});
   place(ld.g,LX,LY,-1,S*1.06);const fg=es(t,1,2.2);ld.update({pose:STAND.pose(0,0),go:0,dt,t:frz,nearHand:[lerp(60,70,fg),lerp(80,46,fg)+Math.sin(frz*3)*1.2],headDrop:-.4});
   const hh=toScene(LX,LY,-1,42.6,31.6,S*1.06);plate.setAttribute('d',`M${f(hh[0]-6)} ${f(hh[1]-5)}L${f(hh[0])} ${f(hh[1]-6)}L${f(hh[0]+1)} ${f(hh[1]+6)}L${f(hh[0]-5)} ${f(hh[1]+5)}Z`);setA(eye,{cx:hh[0]-3.4,cy:hh[1]-.6});eg.setAttribute('transform',`translate(${f(hh[0]-3.4)} ${f(hh[1])})`);op(eg,.5+.3*Math.sin(t*4)**2+.4*es(t,14,15));op(lg,.3+.1*Math.sin(t*2));run(frz,.3,1);
   const mem=es(t,10.4,13.2);fog(t,1,.25+.75*mem);hero.g.setAttribute('opacity',f(1-.5*mem*(t<13.9?1:0)));
   hero.up(frz,t<T1?dt:0,0,{lean:-16*Math.sin(fl*3.14)+wobble(frz*3,1.2)*6*stp,legPts:crouch(8*stp+3),drop:8*stp+3,nearHand:[lerp(60,70,stp),lerp(80,60,stp)],farHand:stp>0?[lerp(30,14,stp),lerp(80,62,stp)]:null,swordAng:lerp(18,70,stp),headDrop:0,capeKick:-8*stp});}}},CULT));
})();
