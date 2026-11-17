// R885 — 선화 컷씬 장면 다섯째 묶음(6부 두 사람의 성 hando01~03, 7부 파란불 아래의 사람들 murder01·02·04·03). 재생기 lineart-cine-r880.js, 도우미는 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게".
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다. 7부는 사고·추락 순간을 그리지 않고 그 앞뒤의 사물(신호등·휴대전화·화면·종이)로 보여 준다.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R885__)return;window.__STORYWORLD_LINEART_SCENES_R885__='R885-scenes-5';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,flame,motes}=A.kit;
const {STAND,SHUF,RUN,vis,op,dipper,ground,scratches,actor,crouch,HWANDO,fogBand,spark,dark}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const AMB='#f2cf7a',BLU='#7fb4ff',OCH='#e6a15a',REDV='#ff5a48',GRN='#58e0c0';
const CASTLE={paper:'#1a1a22',ink:'#e2dfd6',sky:[[0,'#0d0d13'],[0.55,'#24242e'],[1,'#15151b']],line:'rgba(200,190,230,.42)'};
const NIGHT={paper:'#12161d',ink:'#dfe6ee',sky:[[0,'#090c11'],[0.55,'#1a212b'],[1,'#0f1319']],line:'rgba(150,200,230,.42)'};
const BOB=(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,3.8,-1.4)}Q${P(c,4.6,-5.8)} ${P(c,0,-6)}Q${P(c,-5.6,-5.8)} ${P(c,-5.2,1)}L${P(c,-4.8,5.4)}L${P(c,-2,5)}Q${P(c,-2.6,1)} ${P(c,-1.2,-1.4)}Q${P(c,1,-3.2)} ${P(c,3.8,-1.4)}Z`);hat.setAttribute('d','');line.setAttribute('d','');};
// 성의 두 주인: 서쪽(잔혹동화)·동쪽(무속) — 뒤에 창을 든다
const WEST={robe:'coat',robeFill:'#2c3f63',legs:'#1d2333',hat:HATS.hero,seed:4},EAST={robe:'long',robeFill:'#d9cdb4',legs:'#8d8370',hat:HATS.topknot,seed:7};
const SPEAR={sword:'#cfd6e2',swordLen:62};
// 악마 무리의 한 마리(검은 덩이, 뿔 둘, 붉은 눈)
function imp(p,fill){const g=grp(p);dark(g,'M-9 0L-11 -22Q-12 -34 -4 -36L-9 -47L-1 -39L4 -39L10 -48L8 -36Q14 -32 12 -20L10 0Z',fill||'#0a0707',.9);el('circle',{cx:-3,cy:-30,r:1.2,fill:REDV},g);el('circle',{cx:4,cy:-30,r:1.2,fill:REDV},g);
 return{g,set(x,y,s,t,ph,a=1){g.setAttribute('transform',`translate(${f(x)} ${f(y-Math.abs(Math.sin(t*6+ph))*4*s)}) scale(${f(s)})`);op(g,a);}};}
// 읽을 수 없는 글줄
function lines(p,x,y,w,n,R,col,gap=7,sw=1.1){const L=[];for(let i=0;i<n;i++){let d='',xx=x;const end=x+w*R(.6,1);while(xx<end){const l=R(4,13);d+=`M${f(xx)} ${f(y+i*gap)}l${f(l)} 0`;xx+=l+R(2.5,4);}L.push(el('path',{d,fill:'none',stroke:col,'stroke-width':sw,'stroke-linecap':'round'},p));}return L;}
const floorL=(p,GR,R,n=20)=>{ink(p,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(p,n,R,GR+10,356);};
const bez=(a,c,b,u)=>[(1-u)*(1-u)*a[0]+2*u*(1-u)*c[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*u*(1-u)*c[1]+u*u*b[1]];
// 화면에 붙는 가까운 그림판(휴대전화·모니터·종이): 바탕을 덮는 판 위에 그린다
const board=(k,paper)=>{const g=grp(k.hud);el('rect',{x:-40,y:-40,width:720,height:460,fill:paper},g);return g;};
// 도시 사람
const CIV=(fill,hat,seed)=>({robe:'coat',robeFill:fill,legs:'#20252d',hat:hat||HATS.hero,seed:seed||1});
// ───────── hando01 성 안에 소환된 의목사 ─────────
A.add(Object.assign({zone:'hando01',D:17,
 subs:[[0.8,4.2,'성 안으로 추락한 나는 차가운 바닥에서 몸을 일으켰다.'],[5.0,8.6,'두 창문 너머에 걸린 하늘이 서로 전혀 달랐다.'],[9.4,12.2,'성 밖에서는 악마 무리가 몰려오고 있었다.'],[12.9,16.6,'어느 쪽 성문을 먼저 막아야 할지 물으려다 돌아보니, 성의 두 주인 모두 내 입만 바라보며 결정을 기다리고 있었다.']],
 build(k){const R=seeded(6101),GR=292,S=1.1,HX=330,WX=210,EX=450;
  const cam=k.track([[0,HX,246,2.1],[4.4,HX,222,1.6],[4.8,330,116,1.55,'cut'],[9,330,120,1.66],[9.3,540,206,1.4,'cut'],[12.5,530,204,1.55],[12.8,250,206,1.4,'cut'],[17,240,204,1.6]]),dip=dipper(k,[4.8,9.3,12.8]);
  floorL(k.root,GR,R,24);const WL=grp(k.back,{opacity:.5});
  for(let y=70;y<GR;y+=22){let d='';for(let x=-80+((y/22)%2)*20;x<330;x+=40)d+=`M${x} ${y}l0 22`;ink(WL,d+`M-90 ${y}L330 ${y}`,.4);}
  for(let y=64;y<GR;y+=30)ink(WL,smoothD(wavy(332,y,730,y,3,14,R)),.4);for(let x=350;x<730;x+=54)ink(WL,`M${x} 64L${x+10} ${GR}`,.3);
  ink(k.back,'M330 40L326 86L335 120L324 168L334 214L327 260L331 '+GR,1.1);
  // 서쪽 창(뾰족 아치·초승달) / 동쪽 창(둥근 창·보름달과 솔가지)
  el('path',{d:`M${WX-30} 190L${WX-30} 118Q${WX-30} 84 ${WX} 62Q${WX+30} 84 ${WX+30} 118L${WX+30} 190Z`,fill:'#16264a',stroke:INK,'stroke-width':1.3},k.back);el('path',{d:`M${WX+6} 96A16 16 0 1 0 ${WX+12} 126A12 12 0 1 1 ${WX+6} 96Z`,fill:'#dfe9ff'},k.back);
  const stars=[0,1,2,3,4,5].map(()=>el('circle',{cx:f(WX+R(-22,22)),cy:f(R(104,180)),r:.9,fill:'#dfe9ff'},k.back));ink(k.back,`M${WX} 62L${WX} 190M${WX-30} 140L${WX+30} 140`,.6,{opacity:.7});
  el('circle',{cx:EX,cy:128,r:44,fill:'#3a1c14',stroke:INK,'stroke-width':1.3},k.back);el('circle',{cx:EX+8,cy:120,r:20,fill:'#f3d9a4'},k.back);
  el('path',{d:`M${EX-44} 150Q${EX-20} 138 ${EX+6} 146M${EX-30} 146l8 -12M${EX-16} 143l9 -11M${EX-4} 145l8 -9M${EX-36} 152l-4 9M${EX-22} 147l-2 10`,fill:'none',stroke:'#0a0707','stroke-width':2.2,'stroke-linecap':'round'},k.back);
  const gw=k.glowAt(WX,126,90,'#3f63b8'),ge=k.glowAt(EX,128,90,'#c0683a');
  // 오른쪽 성문과 몰려오는 무리
  dark(k.root,`M640 ${GR+3}L640 150Q640 96 700 96L760 96L760 ${GR+3}Z`,'#050405',1.5);const gg=k.glowAt(700,220,120,'#a2342a'),imps=[];for(let i=0;i<11;i++)imps.push({m:imp(k.root),i,ph:R(0,6),sc:R(.7,1.15)});
  const w=actor(k.root,WEST,104,GR+2,1,S*.95,STAND),e=actor(k.root,EAST,154,GR+2,1,S*.95,STAND),hero=actor(k.root,HWANDO,HX,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const up=es(t,1.2,3.8),d=t>=12.8;stars.forEach((n,i)=>op(n,.4+.6*Math.sin(t*2+i)**2));op(gw,.4);op(ge,.4);op(gg,.25+.3*es(t,9.3,11));
   imps.forEach(q=>{const u=es(t,9.4+q.i*.16,12.4+q.i*.2);q.m.set(lerp(760,668-q.i*13,u),GR+3+(q.i%3)*3,q.sc,t,q.ph,t>=9.3?1:0);});
   hero.w.dir=d?-1:1;hero.up(t,dt,0,{legPts:up<1?crouch(34*(1-up)):null,drop:34*(1-up),lean:d?0:56*(1-up),headDrop:d?0:3*(1-up),headTurn:.8*es(t,5,5.8)*(1-es(t,8.6,9.2)),swordAng:lerp(84,20,up)});
   [w,e].forEach((a,i)=>a.up(t,dt,0,{headDrop:-.6,lean:d?3:0,nearHand:d?[lerp(60,56,es(t,13.4,14.4)),lerp(80,72,es(t,13.4,14.4))]:null}));}}},CASTLE));
// ───────── hando02 두 주인의 각성 ─────────
A.add(Object.assign({zone:'hando02',D:16.5,
 subs:[[0.8,4.2,'잠시 후, 두 주인이 나에게서 시선을 거두어 무너진 주변을 살폈다.'],[5.0,9.6,'자신들의 성이 처참히 부서진 자리를 보며, 그 일에 대한 책임을 스스로 받아들이고 있었던 듯하였다.'],[10.4,13.0,'나는 다음에 해야 할 일을 설명하려다가 조용히 입을 다물었다.'],[13.6,16.2,'두 사람이 먼저 무엇을 할지 정할 때까지 그 자리에서 묵묵히 기다렸다.']],
 build(k){const R=seeded(6102),GR=288,S=1.08,GX=420,SP=STAND.speed*S*.95,WK=1.5;
  const cam=k.track([[0,300,204,1.35],[4.6,340,200,1.3],[5,GX-60,216,1.5,'cut'],[9.8,GX-64,222,1.68],[10.2,196,204,2.0,'cut'],[13.2,200,204,2.1],[13.5,310,200,1.2,'cut'],[16.5,316,198,1.28]]),dip=dipper(k,[5,10.2,13.5]);
  floorL(k.root,GR,R,22);
  // 부서진 성문과 무너진 돌
  ink(k.root,`M${GX-78} ${GR+3}L${GX-78} 64L${GX+78} 64L${GX+78} ${GR+3}`,2);dark(k.root,Lp([[GX-64,GR+3],[GX-64,78],[GX-3,82],[GX-6,GR+3]],true),'#15151b',1.3);dark(k.root,Lp([[GX+14,GR+3],[GX+30,150],[GX+70,130],[GX+64,GR+3]],true),'#15151b',1.3);
  ink(k.root,`M${GX-40} 80l6 60l-14 40l10 40M${GX+30} 150l8 50l-6 50M${GX-3} 82l5 10M${GX+2} 64l20 40l-12 30`,.6,{opacity:.7});
  [[GX-110,16,11],[GX-86,10,8],[GX+96,18,12],[GX+124,9,7],[GX+6,14,9],[GX-140,8,6],[GX+150,12,8]].forEach(([x,w,h])=>dark(k.root,`M${x-w} ${GR+3}L${x-w*.6} ${GR+3-h}L${x+w*.5} ${GR+3-h*.8}L${x+w} ${GR+3}Z`,'#15151b',.8));
  const dust=motes(grp(k.front),18,R,[GX-180,60,GX+180,GR],{vy0:3,vy1:8,r0:.4,r1:.9}),gl=k.glowAt(GX,170,150,'#4a4a70');
  const hero=actor(k.root,HWANDO,196,GR+2,1,S,STAND),w=actor(k.root,WEST,268-SP*0,GR+2,-1,S*.95,STAND),e=actor(k.root,EAST,318,GR+2,-1,S*.95,STAND);
  return(t,dt)=>{cam(t);dip(t);dust(t,0,.6);op(gl,.3);const tn=t>=1.4,go=t>=2&&t<2+WK?1:0,kn=es(t,6,7.4);
   w.w.dir=e.w.dir=tn?1:-1;w.up(t,dt,go,{headTurn:0,headDrop:tn?1.6*kn:-.4,legPts:kn>0?crouch(24*kn):null,drop:24*kn,lean:10*kn,nearHand:kn>0?[lerp(60,68,kn),lerp(80,92,kn)]:null});
   e.up(t,dt,go,{headDrop:tn?-1.2*es(t,5.4,6.6):-.4,nearHand:t>=7?[lerp(60,54,es(t,7,8)),lerp(80,58,es(t,7,8))]:null,lean:2*es(t,7,8)});
   const sp=es(t,10.5,11.2)*(1-es(t,12,12.8));hero.up(t,dt,0,{nearHand:[lerp(60,66,sp),lerp(80,56,sp)],lean:4*sp,headDrop:.8*es(t,12.2,13),swordAng:18});}}},CASTLE));
// ───────── hando03 함께 되찾은 코어 ─────────
A.add(Object.assign({zone:'hando03',D:17,
 subs:[[0.8,5.0,'두 주인의 권한이 환도의 공명에 맞물려 이어지자, 적에게 빼앗겼던 코어가 강하게 응답했다.'],[5.8,8.6,'나는 우두머리 쪽으로 파고들다가 힐끗 뒤를 확인했다.'],[9.2,11.6,'두 사람도 나와 함께 움직이고 있었다.'],[12.4,16.2,'두 사람은 제각기 싸워야 할 길목을 스스로 골라 뛰어들곤 하였다.']],
 build(k){const R=seeded(6103),GR=292,S=1.08,RS=RUN.speed*S,BX=600,LY=GR-84;
  const cam=k.track([[0,340,196,1.08],[5.2,360,192,1.2],[5.5,330,206,1.5,'cut'],[8.8,400,206,1.5],[9,300,206,1.4,'cut'],[11.8,340,204,1.4],[12.1,380,180,1.12,'cut'],[17,400,176,1.2]]),dip=dipper(k,[5.5,9,12.1]);
  floorL(k.root,GR,R,24);const BK=grp(k.back,{opacity:.45});for(let i=0;i<8;i++){const x=-60+i*110;sh(BK,Lp([[x,GR+3],[x,50],[x+24,50],[x+24,GR+3]],true),.8);}
  const boss=grp(k.root);dark(boss,`M${BX-40} ${GR+3}L${BX-52} ${GR-90}Q${BX-56} ${GR-140} ${BX-22} ${GR-150}L${BX-44} ${GR-196}L${BX-8} ${GR-162}L${BX+10} ${GR-162}L${BX+40} ${GR-200}L${BX+30} ${GR-150}Q${BX+60} ${GR-130} ${BX+52} ${GR-80}L${BX+44} ${GR+3}Z`,'#0a0707',1.3);el('circle',{cx:BX-14,cy:GR-128,r:2,fill:REDV},boss);el('circle',{cx:BX+10,cy:GR-128,r:2,fill:REDV},boss);ink(boss,`M${BX-48} ${GR-96}Q${BX-80} ${GR-92} ${BX-74} ${GR-112}`,2);
  const og=k.glowAt(0,0,70,AMB),orb=el('circle',{r:9,fill:'#fff1c4',stroke:AMB,'stroke-width':1.4},k.root),rings=[0,1,2].map(()=>el('circle',{r:1,fill:'none',stroke:'#e9edf5','stroke-width':.8},k.glow));
  const th=[BLU,OCH,'#e9edf5'].map(c=>el('path',{d:'',fill:'none',stroke:c,'stroke-width':1.3,'stroke-linecap':'round'},k.glow));
  // 두 길목: 위 난간길과 아랫길
  const LN=grp(k.root);ink(LN,`M250 ${GR+3}L330 ${LY+3}L520 ${LY+3}L520 ${LY+12}`,1.2);for(let x=344;x<520;x+=28)ink(LN,`M${x} ${LY+3}l0 10`,.5);
  const iu=[0,1,2].map(i=>({m:imp(k.root),x:430+i*30,y:LY+3,ph:i*2})),il=[0,1,2].map(i=>({m:imp(k.root),x:440+i*32,y:GR+3,ph:i*2+1})),spU=spark(k.root,BLU,5),spL=spark(k.root,OCH,5);
  const w=actor(k.root,Object.assign({},WEST,SPEAR),0,GR+2,1,S*.95,RUN),e=actor(k.root,Object.assign({},EAST,SPEAR),0,GR+2,1,S*.95,RUN),hero=actor(k.root,HWANDO,0,GR+2,1,S,RUN);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.5,b=t>=5.5&&t<9,c=t>=9&&t<12.1,d=t>=12.1;vis(LN,d);
   let ox=BX-76,oy=GR-116,os=1+.5*es(t,2.6,4)*(.6+.4*Math.sin(t*9));w.w.y=e.w.y=GR+2;
   if(a){w.w.x=120;e.w.x=176;hero.w.x=250;const r=es(t,.8,2);[w,e].forEach(q=>q.up(t,dt,0,{nearHand:[lerp(60,66,r),lerp(80,50,r)],swordAng:176}));hero.up(t,dt,0,{swordAng:lerp(20,150,r),nearHand:[lerp(52,56,r),lerp(80,42,r)]});
    const pt0=[266,GR-118],hw=w.at(66,50),he=e.at(66,50);th[0].setAttribute('d',`M${f(hw[0])} ${f(hw[1])}Q190 ${GR-150} ${pt0[0]} ${pt0[1]}`);th[1].setAttribute('d',`M${f(he[0])} ${f(he[1])}Q220 ${GR-100} ${pt0[0]} ${pt0[1]}`);th[2].setAttribute('d',`M${pt0[0]} ${pt0[1]}Q400 ${GR-190} ${ox} ${oy}`);
    th.forEach((n,i)=>{const u=es(t,i<2?1.4:2.4,i<2?2.4:3.6);n.setAttribute('stroke-dasharray',`${f(400*u)} 420`);op(n,u>0?.9:0);});rings.forEach((n,i)=>{const u=((t*.8+i/3)%1+1)%1;setA(n,{cx:pt0[0],cy:pt0[1],r:4+u*30});op(n,r*(1-u));});}
   else{th.forEach(n=>op(n,0));rings.forEach(n=>op(n,0));}
   if(b){const dx=Math.min(RS*clamp(t-5.7,0,3),170);hero.w.x=250+dx;hero.up(t,dt,dx<170?1:0,{lean:8,swordAng:70,headTurn:.9*es(t,7.2,7.7)*(1-es(t,8.3,8.7))});w.w.x=-200;e.w.x=-200;[w,e].forEach(q=>q.up(t,dt,0,{}));os=1.3;}
   if(c){const dx=RS*clamp(t-9,0,3)*.5;w.w.x=176+dx;e.w.x=236+dx;hero.w.x=330+dx;[w,e].forEach(q=>q.up(t,dt,1,{lean:8,swordAng:120,nearHand:[64,60]}));hero.up(t,dt,1,{lean:8,swordAng:70});os=1.3;}
   const up=es(t,12.5,13.6),cu=((t-13.8)/1.1)%1,on=t>=13.8,stb=on?es(cu,.2,.36)*(1-es(cu,.6,.9)):0;
   if(d){w.w.x=lerp(236,360,up);w.w.y=lerp(GR+2,LY+2,es(t,12.6,13.4));e.w.x=lerp(250,384,es(t,12.7,13.8));hero.w.x=lerp(286,312,es(t,12.3,13));
    w.up(t,dt,up<1?1:0,{swordAng:lerp(120,96,stb),nearHand:[lerp(60,70,stb),58],lean:6+6*stb,legPts:up<1?null:crouch(3)});e.up(t,dt,t<13.8?1:0,{swordAng:lerp(120,96,stb),nearHand:[lerp(60,70,stb),60],lean:6+6*stb,legPts:t<13.8?null:crouch(3)});hero.up(t,dt,t<13?1:0,{lean:t<13?8:0,swordAng:lerp(70,30,es(t,13,14)),headTurn:0});
    spU(416,LY-48,on?seg(cu,.3,.7):0,24);spL(428,GR-48,on?seg(cu,.3,.7):0,24);os=1.3;}
   iu.forEach((q,i)=>q.m.set(q.x+(on?stb*14:0),q.y,1,t,q.ph,d?1:0));il.forEach((q,i)=>q.m.set(q.x+(on?stb*14:0),q.y,1.05,t,q.ph,d?1:0));
   setA(orb,{cx:ox,cy:oy,r:9*os});og.setAttribute('transform',`translate(${f(ox)} ${f(oy)})`);op(og,.6);}}},CASTLE));
// ───────── murder01 윤하람 ─────────
A.add(Object.assign({zone:'murder01',D:17.5,
 subs:[[0.8,4.8,'비는 그쳤으나 아스팔트 도로에 고인 빗물은 아직 마르지 않고 있었다.'],[5.6,9.6,'횡단보도 앞에 서서 휴대전화를 내려다보는데 어머니의 이름이 화면에 떠올랐다.'],[10.4,13.4,'나는 통화 버튼 위에 엄지손가락을 올렸다가 슬며시 뗐다.'],[14.2,16.9,'마침내 파란불이 켜지고 옆에 서 있던 사람들이 앞으로 걸어 나갔다.']],
 build(k){const R=seeded(7101),GR=286,S=1.08,PX=372,G0=14.3;
  const PH=board(k,'#0d1016'),dip=dipper(k,[5.3,9.9,13.9]);
  const cam=k.track([[0,420,250,1.7],[5,330,214,1.25],[5.3,300,206,2.3,'cut'],[13.9,300,206,2.3],[13.95,340,206,1.25,'cut'],[17.5,356,206,1.35]]);
  // 거리
  const BK=grp(k.back,{opacity:.5});for(let i=0;i<9;i++){const x=-70+i*92,h=R(110,200);sh(BK,Lp([[x,GR+3],[x,GR-h],[x+70,GR-h],[x+70,GR+3]],true),.7);for(let j=0;j<6;j++)if(R(0,1)<.55)el('rect',{x:f(x+8+(j%3)*20),y:f(GR-h+14+Math.floor(j/3)*30+R(0,40)),width:9,height:12,fill:AMB,opacity:.5},BK);}
  ink(k.root,`M-90 ${GR+3}L${PX+14} ${GR+3}L${PX+20} ${GR+9}L730 ${GR+9}`,1.1);for(let i=0;i<7;i++){const x=PX+44+i*44;sh(k.root,Lp([[x,GR+16],[x+26,GR+16],[x+14,GR+52],[x-16,GR+52]],true),.7).setAttribute('fill-opacity','.16');}
  const pud=[[150,GR+22,46],[470,GR+30,60],[610,GR+20,36]].map(([x,y,w])=>{ink(k.root,ell(x,y,w,5),.6,{opacity:.7});return ink(k.root,'',.5,{opacity:.6});});
  ink(k.root,`M${PX} ${GR+3}L${PX} 130`,2);dark(k.root,Lp([[PX-11,96],[PX+11,96],[PX+11,146],[PX-11,146]],true),'#0b0d11',1.1);const red=el('circle',{cx:PX,cy:109,r:6.5,fill:REDV},k.root),grn=el('circle',{cx:PX,cy:133,r:6.5,fill:GRN},k.root),sg=k.glowAt(PX,120,70,REDV),rf=k.glowAt(470,GR+30,60,REDV);
  const ppl=[[250,'#3b4654',HATS.villager,2,.96],[318,'#5a4a44',BOB,5,.9],[214,'#2f3a35',HATS.hero,3,1]].map(([x,c,h,sd,sc])=>actor(k.root,CIV(c,h,sd),x,GR+2,1,S*sc,STAND));
  const hero=actor(k.root,CIV('#6d7482',BOB,8),286,GR+2,1,S,STAND),scr=el('rect',{width:5,height:8,rx:1,fill:'#cfe6ff'},k.root),pg=k.glowAt(0,0,22,'#9fc6ff');
  // 가까이: 휴대전화
  const cx=320,cy=186;dark(PH,`M${cx-58} ${cy-112}Q${cx-58} ${cy-124} ${cx-46} ${cy-124}L${cx+46} ${cy-124}Q${cx+58} ${cy-124} ${cx+58} ${cy-112}L${cx+58} ${cy+112}Q${cx+58} ${cy+124} ${cx+46} ${cy+124}L${cx-46} ${cy+124}Q${cx-58} ${cy+124} ${cx-58} ${cy+112}Z`,'#161b24',1.6);
  const lit=el('rect',{x:cx-50,y:cy-112,width:100,height:224,rx:6,fill:'#22324a'},PH);el('circle',{cx,cy:cy-58,r:20,fill:'none',stroke:'#dfe6ee','stroke-width':1.2},PH);el('path',{d:`M${cx-11} ${cy-48}Q${cx} ${cy-62} ${cx+11} ${cy-48}M${cx-5} ${cy-64}a5 5 0 1 0 10 0a5 5 0 1 0 -10 0`,fill:'none',stroke:'#dfe6ee','stroke-width':1.1},PH);
  lines(PH,cx-22,cy-24,44,1,R,'#eaf1fa',7,2);lines(PH,cx-16,cy-12,32,1,R,'#9fb0c6',7,1);const btn=el('circle',{cx:cx+22,cy:cy+70,r:15,fill:GRN},PH),ring=el('circle',{cx:cx+22,cy:cy+70,r:15,fill:'none',stroke:GRN,'stroke-width':1},PH);el('circle',{cx:cx-22,cy:cy+70,r:15,fill:REDV,opacity:.85},PH);
  const th=el('path',{d:'M-15 0Q-17 -44 0 -50Q17 -44 15 0L18 150L-18 150Z',fill:'#c9b3a2',stroke:'#12161d','stroke-width':1.4},PH);el('path',{d:'',fill:'none'},PH);
  return(t,dt)=>{cam(t);dip(t);const cl=t>=5.3&&t<13.9,g=t>=G0;vis(PH,cl);
   pud.forEach((n,i)=>n.setAttribute('d',smoothD(wavy([150,470,610][i]-24,[GR+22,GR+30,GR+20][i],[150,470,610][i]+24,[GR+22,GR+30,GR+20][i],1+.4*Math.sin(t*2+i),6,seeded(7+i)))));
   op(red,g?.12:1);op(grn,g?1:.12);sg.setAttribute('style','');op(sg,g?0:.5);op(rf,g?0:.35);
   ppl.forEach((p,i)=>p.up(t,dt,t>=G0+.4+i*.25?1:0,{headDrop:i===1?1.4:0}));
   hero.up(t,dt,t>=G0+1.3?1:0,{nearHand:t<G0+.8?[57,62]:null,headDrop:t<G0+.6?2.6:.4,lean:t<G0?3:0});const hp=hero.at(57,58);setA(scr,{x:hp[0]-1,y:hp[1]-6});op(scr,t<G0+.8?.6+.4*Math.sin(t*5)**2:0);pg.setAttribute('transform',`translate(${f(hp[0])} ${f(hp[1]-2)})`);op(pg,t<G0+.8?.5:0);
   if(cl){const b=.5+.5*Math.sin(t*5.2);lit.setAttribute('fill',b>.5?'#2a4062':'#22324a');setA(ring,{r:15+((t*1.2)%1)*14});op(ring,1-((t*1.2)%1));
    const on=es(t,10.5,11.5),off=es(t,12.1,13.2),ty=lerp(lerp(250,cy+96,on),270,off),tx=lerp(lerp(cx+90,cx+26,on),cx+96,off);th.setAttribute('transform',`translate(${f(tx)} ${f(ty)}) rotate(${f(lerp(-24,-8,on)-14*off)})`);}}}},NIGHT));
// ───────── murder02 장민재와 새빛호텔 ─────────
A.add(Object.assign({zone:'murder02',D:17,
 subs:[[0.8,5.0,'머리 위에서 시꺼먼 사람 형체가 떨어지는 것을 보고 나는 반사적으로 핸들을 꺾었다.'],[5.8,10.2,'그런데 경찰이 보여 준 CCTV 영상에는 떨어지는 사람이 전혀 찍혀 있지 않았다.'],[11.0,13.6,'내가 분명히 보았던 추락자의 자리는 텅 비어 있었다.'],[14.2,16.7,'세차를 하려다 차량 와이퍼 틈에서 접힌 종이 한 장을 발견했다.']],
 build(k){const R=seeded(7102),cx=320,cy=194;const cam=k.track([[0,330,200,1],[17,330,200,1]]);
  const B1=board(k,'#0d1016'),B2=board(k,'#0a0c10'),B3=board(k,'#0d1016'),dip=dipper(k,[5.4,13.9]);
  // 1 앞유리 너머
  const out=grp(B1);ink(out,`M-40 250L${cx} 150L680 250M${cx-200} 250L${cx-30} 150M${cx+200} 250L${cx+30} 150`,.8,{opacity:.6});for(let i=0;i<7;i++)sh(out,Lp([[cx+(i-3)*15-4,194],[cx+(i-3)*15+4,194],[cx+(i-3)*30+9,216],[cx+(i-3)*30-9,216]],true),.5).setAttribute('fill-opacity','.2');
  el('circle',{cx:cx+96,cy:118,r:5,fill:GRN},out);ink(out,`M${cx+96} 124L${cx+96} 180`,1);const fall=el('path',{d:'M-7 -12Q0 -18 6 -12L9 2Q10 12 3 16L-4 15Q-11 10 -9 0Z',fill:'#020203',stroke:'#3a4350','stroke-width':.6},out);
  const rain=motes(grp(B1),30,R,[-20,20,660,260],{fill:'#9fb6cc',vy0:60,vy1:110,vx0:-12,vx1:-6,r0:.4,r1:.9});
  const wp=[0,1].map(i=>el('path',{d:'',fill:'none',stroke:'#dfe6ee','stroke-width':2,'stroke-linecap':'round'},B1));
  el('path',{d:`M-40 400L-40 246Q${cx} 222 680 246L680 400Z`,fill:'#0a0c10',stroke:'#dfe6ee','stroke-width':1.4},B1);el('path',{d:'M-40 30L60 246M680 30L580 246',fill:'none',stroke:'#dfe6ee','stroke-width':3},B1);
  const wh=grp(B1);el('circle',{cx:0,cy:0,r:58,fill:'none',stroke:'#dfe6ee','stroke-width':7},wh);el('path',{d:'M-54 5L-16 4M54 5L16 4M0 20L0 54',fill:'none',stroke:'#dfe6ee','stroke-width':6,'stroke-linecap':'round'},wh);el('circle',{cx:0,cy:8,r:18,fill:'#161b24',stroke:'#dfe6ee','stroke-width':1.6},wh);
  [[-50,-28],[50,-28]].forEach(([x,y])=>el('path',{d:`M${x-12} ${y+10}Q${x-16} ${y-10} ${x} ${y-14}Q${x+16} ${y-10} ${x+12} ${y+10}Z`,fill:'#c9b3a2',stroke:'#12161d','stroke-width':1.2},wh));
  // 2 CCTV 화면
  dark(B2,Lp([[90,50],[550,50],[550,318],[90,318]],true),'#10151c',2);const scn=grp(B2);el('rect',{x:104,y:150,width:432,height:74,fill:'#1b222c'},scn);for(let i=0;i<7;i++)el('rect',{x:286+i*13,y:154,width:7,height:66,fill:'#8fa0b4',opacity:.5},scn);
  ink(scn,'M104 150L536 150M104 224L536 224',.8,{style:'color:#8fa0b4'});const ped=el('circle',{r:4.5,fill:'#eaf1fa'},scn),car=el('rect',{x:-17,y:-8,width:34,height:16,rx:3,fill:'#aab4c0',stroke:'#12161d','stroke-width':1},scn);
  const mark=el('circle',{cx:330,cy:112,r:20,fill:'none',stroke:AMB,'stroke-width':1.6,'stroke-dasharray':'5 4'},scn);for(let y=56;y<316;y+=5)el('path',{d:`M92 ${y}L548 ${y}`,stroke:'#000','stroke-width':1,opacity:.22},B2);
  el('circle',{cx:112,cy:70,r:4,fill:REDV},B2);lines(B2,124,70,60,1,R,'#dfe6ee',7,1.4);const bar=el('rect',{x:104,y:300,width:0,height:4,fill:'#dfe6ee'},B2);ink(B2,'M104 302L536 302',.5,{style:'color:#5a6676'});
  const fg=el('path',{d:'M-13 0Q-15 -40 0 -46Q15 -40 13 0L16 160L-16 160Z',fill:'#c9b3a2',stroke:'#0a0c10','stroke-width':1.4},B2);
  // 3 와이퍼 틈의 종이
  el('path',{d:'M-40 300Q320 250 680 300L680 400L-40 400Z',fill:'#161b24',stroke:'#dfe6ee','stroke-width':1.4},B3);ink(B3,'M-40 140Q320 96 680 140',.8,{style:'color:#5a6676'});
  const drops=motes(grp(B3),14,R,[0,110,640,290],{fill:'#9fb6cc',vy0:4,vy1:10,vx0:0,vx1:0,r0:.8,r1:1.8});
  const pp=grp(B3);el('path',{d:'M-40 -26L34 -32L40 22L-36 28Z',fill:'#e9e6dc',stroke:'#12161d','stroke-width':1.2},pp);el('path',{d:'M-2 -29L2 25',stroke:'#8d8a80','stroke-width':.8,fill:'none'},pp);lines(pp,-32,-18,26,5,R,'#3a3f48',7,1);lines(pp,6,-20,26,5,R,'#3a3f48',7,1);
  el('path',{d:'M120 300L470 246',stroke:'#dfe6ee','stroke-width':7,'stroke-linecap':'round',fill:'none'},B3);el('path',{d:'M150 304L520 246',stroke:'#0a0c10','stroke-width':3,'stroke-linecap':'round',fill:'none'},B3);
  const hd=el('path',{d:'M-13 0Q-15 -40 0 -46Q15 -40 13 0L16 160L-16 160Z',fill:'#c9b3a2',stroke:'#0a0c10','stroke-width':1.4},B3);
  return(t,dt)=>{cam(t);dip(t);const p1=t<5.4,p2=t>=5.4&&t<13.9,p3=t>=13.9;vis(B1,p1);vis(B2,p2);vis(B3,p3);
   if(p1){const sw=minJerk(seg(t,2.9,3.5)),u=seg(t,1.5,3.3);wh.setAttribute('transform',`translate(${cx-96} 268) rotate(${f(-118*sw+Math.sin(t*1.4)*2*(1-sw))})`);out.setAttribute('transform',`translate(${f(190*sw)} ${f(6*sw)}) rotate(${f(5*sw)} ${cx} 200)`);
    fall.setAttribute('transform',`translate(${cx+20} ${f(lerp(10,176,u*u))}) scale(${f(1+1.6*u)}) rotate(${f(t*40)})`);op(fall,u>0&&t<3.9?1:0);rain(t,0,.7);
    wp.forEach((n,i)=>{const a=-2.5+Math.sin(t*2.6)*.55+i*.5,bx=cx-80+i*200;n.setAttribute('d',`M${bx} 240L${f(bx+Math.cos(a)*150)} ${f(240+Math.sin(a)*150)}`);});}
   if(p2){const u=((t-5.4)%2.8)/2.8,py=lerp(246,150,clamp(u*1.5,0,1)),cu=clamp(u*1.5,0,1),sv=es(cu,.5,.9);setA(ped,{cx:330,cy:py});car.setAttribute('transform',`translate(${f(lerp(110,330,cu))} ${f(lerp(206,186,sv)-10*sv)}) rotate(${f(-26*sv)})`);setA(bar,{width:432*u});
    op(mark,t>=11?(.5+.5*Math.sin(t*7)**2):0);const fi=es(t,11.2,12);fg.setAttribute('transform',`translate(${f(lerp(430,352,fi))} ${f(lerp(420,180,fi))}) rotate(-16)`);scn.setAttribute('opacity',f(.85+.15*Math.sin(t*31)));}
   if(p3){const pu=es(t,15,16.4);drops(t,0,.8);pp.setAttribute('transform',`translate(${f(330+10*pu)} ${f(262-44*pu)}) rotate(${f(-9+14*pu)})`);hd.setAttribute('transform',`translate(${f(lerp(470,372,es(t,14.3,15))+8*pu)} ${f(lerp(420,270,es(t,14.3,15))-44*pu)}) rotate(-28)`);}}}},NIGHT));
// ───────── murder04 고서진과 청록빌라 ─────────
A.add(Object.assign({zone:'murder04',D:17,
 subs:[[0.8,4.6,'민재가 떨어뜨린 가방 안에는 네 사람의 이름을 적은 기록지가 들어 있었다.'],[5.4,8.6,'내 이름을 읽은 자리에서 시선이 딱 멎었다.'],[9.4,13.4,'칠 년 전 새빛호텔 화재 참사를 다룬 신문 스크랩도 함께 끼워져 있었다.'],[14.0,16.8,'굵은 숫자 아래에는 ‘예상하기 어려운 돌발 사고’라는 짧은 해설이 붙어 있었다.']],
 build(k){const R=seeded(7104),GR=292,S=1.1,BX=350;
  const PB=board(k,'#0d1016'),dip=dipper(k,[5,9.1]);const cam=k.track([[0,330,214,1.5],[4.8,344,236,2.2],[17,344,236,2.2]]);
  // 계단참
  ink(k.root,`M-90 ${GR+3}L470 ${GR+3}`,1.1);let d=`M470 ${GR+3}`;for(let i=0;i<9;i++)d+=`l0 -24l30 0`;ink(k.root,d,1.1);ink(k.root,`M462 ${GR-40}L740 ${GR-262}`,1.6);for(let i=0;i<8;i++)ink(k.root,`M${484+i*30} ${GR-22-i*24}l0 -36`,.7);
  ink(k.back,'M-90 60L730 60M120 60L120 '+GR,.5,{opacity:.5});k.glowAt(300,150,150,'#3a4656',k.far);scratches(k.root,14,R,GR+10,356);
  dark(k.root,`M${BX-26} ${GR+3}L${BX-22} ${GR-24}L${BX+24} ${GR-26}L${BX+28} ${GR+3}Z`,'#1b222c',1.1);ink(k.root,`M${BX-10} ${GR-25}Q${BX} ${GR-44} ${BX+12} ${GR-26}M${BX-22} ${GR-18}L${BX+24} ${GR-20}`,.8);
  const sheet=grp(k.root);sh(sheet,'M-8 -11L8 -11L8 11L-8 11Z',.8);ink(sheet,'M-5 -6L5 -6M-5 -2L5 -2M-5 2L5 2M-5 6L5 6',.4);
  const man=actor(k.root,CIV('#4a5361',HATS.hero,6),BX-44,GR+2,1,S,STAND);
  // 가까이: 기록지와 신문 스크랩
  const sx=250,sy=194,pg=grp(PB);el('path',{d:`M${sx-96} ${sy-128}L${sx+92} ${sy-132}L${sx+98} ${sy+130}L${sx-92} ${sy+134}Z`,fill:'#e9e6dc',stroke:'#12161d','stroke-width':1.4},pg);lines(pg,sx-70,sy-104,90,1,R,'#3a3f48',7,2.4);ink(pg,`M${sx-74} ${sy-90}L${sx+74} ${sy-92}`,.8,{style:'color:#3a3f48'});
  const nm=[0,1,2,3].map(i=>{const y=sy-58+i*40;el('circle',{cx:sx-64,cy:y,r:3,fill:'#3a3f48'},pg);lines(pg,sx-50,y,52,1,R,'#22262d',7,2.6);lines(pg,sx+14,y,54,1,R,'#6b7078',7,1);return y;}),hl=el('rect',{x:sx-78,y:nm[2]-14,width:160,height:28,fill:AMB,'fill-opacity':.22,stroke:AMB,'stroke-width':1.4},pg);
  const cl=grp(PB),nx=0,ny=0;el('path',{d:'M-104 -100L100 -106L106 104L-98 110Z',fill:'#cfc8b6',stroke:'#12161d','stroke-width':1.4},cl);el('path',{d:'M-90 -86L60 -90M-90 -70L20 -72',stroke:'#17191d','stroke-width':7,fill:'none'},cl);
  el('rect',{x:-90,y:-54,width:86,height:70,fill:'#8d8a80',stroke:'#17191d','stroke-width':1},cl);el('path',{d:'M-74 16L-74 -30L-22 -30L-22 16M-62 -20l8 0M-44 -20l8 0M-62 -6l8 0M-44 -6l8 0',fill:'none',stroke:'#17191d','stroke-width':1.3},cl);
  const fl=[0,1,2].map(i=>flame(cl,'#f0a24a',.8));lines(cl,6,-50,84,9,R,'#3a3f48',7,.9);const nums=[el('rect',{x:-90,y:30,width:44,height:22,fill:'#17191d'},cl),el('rect',{x:-36,y:30,width:44,height:22,fill:'#17191d'},cl)];lines(cl,-90,66,150,1,R,'#17191d',7,1.6);const ul=el('path',{d:'M-90 74L64 72',stroke:REDV,'stroke-width':2,fill:'none'},cl);lines(cl,-90,86,170,2,R,'#6b7078',7,.9);
  return(t,dt)=>{cam(t);dip(t);const kn=es(t,.6,1.6),pu=es(t,2,3.6);man.up(t,dt,0,{legPts:crouch(26*kn),drop:26*kn,lean:14*kn,headDrop:2*kn,nearHand:[lerp(60,66,kn),lerp(80,lerp(96,70,pu),kn)],farHand:pu>0?[60,lerp(86,72,pu)]:null});
   const hp=man.at(66,lerp(96,70,pu));sheet.setAttribute('transform',`translate(${f(lerp(BX,hp[0]+6,pu))} ${f(lerp(GR-20,hp[1]-8,pu))}) rotate(${f(-12*pu)})`);op(sheet,t>=1.9?1:0);
   const b=t>=5;vis(PB,b);if(!b)return;const sl=minJerk(seg(t,9.2,10.2)),zo=es(t,13.6,14.6);op(hl,es(t,5.8,6.2)*(.7+.3*Math.sin(t*4)));
   pg.setAttribute('transform',`translate(${f(70-140*sl)} ${f(6*Math.sin(t*.7))}) rotate(${f(-2-3*sl)} ${sx} ${sy})`);op(pg,1-.35*sl);
   cl.setAttribute('transform',`translate(${f(lerp(860,372,sl)-70*zo)} ${f(196-70*zo)}) rotate(${f(lerp(14,3,sl))}) scale(${f(1.12+.7*zo)})`);fl.forEach((q,i)=>q.draw(-66+i*18,-28,12,26+i%2*8,t,i*2));
   ul.setAttribute('stroke-dasharray',`${f(160*es(t,14.4,15.6))} 170`);}}},NIGHT));
// ───────── murder03 옥상의 순환 ─────────
A.add(Object.assign({zone:'murder03',D:17,
 subs:[[0.8,5.2,'청록빌라 옥상 난간에서 아래를 내려다보니 빗물에 젖은 횡단보도가 보였다.'],[6.0,10.4,'낡은 빌라와 도로가 빗줄기와 차량 전조등 사이로 둥근 고리처럼 이어져 있었다.'],[11.2,14.0,'그 순환의 고리 앞을 ‘파란불 집행체’가 가로막고 섰다.'],[14.4,16.8,'나는 끝내 누구의 이름도 고르지 않았다.']],
 build(k){const R=seeded(7103),GR=250,S=1.05,CX=400,CY=150,RX=210,RY=64,EX=420;
  const cam=k.track([[0,330,196,1.3],[5.4,380,250,1.5],[5.8,360,170,1.05,'cut'],[10.6,372,166,1.15],[11,400,180,1.3],[14.2,390,190,1.5],[17,330,196,1.6]]),dip=dipper(k,[5.8]);
  // 옥상
  const RF=grp(k.root);ink(RF,`M-90 ${GR+3}L372 ${GR+3}L372 ${GR+60}`,1.2);ink(RF,`M180 ${GR-34}L372 ${GR-34}`,1.6);for(let x=188;x<=372;x+=23)ink(RF,`M${x} ${GR+3}L${x} ${GR-34}`,.7);scratches(RF,10,R,GR+8,GR+40,-80,360);
  const DN=grp(k.root);for(let i=0;i<7;i++)sh(DN,Lp([[430+i*26,330],[446+i*26,330],[438+i*26,366],[420+i*26,366]],true),.5).setAttribute('fill-opacity','.18');ink(DN,'M380 322L730 322',.7);el('circle',{cx:412,cy:300,r:3.5,fill:GRN},DN);ink(DN,'M412 304L412 322',.8);ink(DN,ell(560,346,40,4),.4,{opacity:.6});
  const rain=motes(grp(k.front),40,R,[-60,-20,720,380],{fill:'#9fb6cc',vy0:150,vy1:230,vx0:-30,vx1:-20,r0:.3,r1:.7});
  // 둥근 고리로 이어진 길
  const RG=grp(k.root);ink(RG,ell(CX,CY,RX,RY),1.2);ink(RG,ell(CX,CY,RX-34,RY-17),1.2);el('ellipse',{cx:CX,cy:CY,rx:RX-17,ry:RY-8.5,fill:'none',stroke:INK,'stroke-width':.7,'stroke-dasharray':'9 8',opacity:.7},RG);
  for(let i=0;i<9;i++){const a=Math.PI+.25+i*.3,x=CX+Math.cos(a)*(RX+6),y=CY+Math.sin(a)*(RY+2),h=R(22,48);sh(RG,Lp([[x-9,y],[x-9,y-h],[x+9,y-h],[x+9,y]],true),.7);if(i%2)el('rect',{x:f(x-4),y:f(y-h+6),width:4,height:5,fill:AMB,opacity:.7},RG);}
  const cars=[0,1,2,3,4].map(i=>({n:el('circle',{r:2.2,fill:'#fff1c4'},RG),g:k.glowAt(0,0,14,'#fff1c4'),ph:i/5}));const zb=[0,1,2,3,4].map(i=>sh(RG,'',.4));
  // 파란불 집행체
  const EXE=grp(k.root);dark(EXE,`M${EX-20} ${CY+RY+40}L${EX-15} ${CY-36}Q${EX-15} ${CY-50} ${EX} ${CY-50}Q${EX+15} ${CY-50} ${EX+15} ${CY-36}L${EX+20} ${CY+RY+40}Z`,'#0b0d11',1.3);dark(EXE,Lp([[EX-13,CY-92],[EX+13,CY-92],[EX+13,CY-48],[EX-13,CY-48]],true),'#0b0d11',1.3);el('circle',{cx:EX,cy:CY-80,r:6,fill:'#141a22',stroke:INK,'stroke-width':.6},EXE);const lamp=el('circle',{cx:EX,cy:CY-61,r:6.5,fill:GRN},EXE),lg=k.glowAt(EX,CY-61,60,GRN);
  const cards=[0,1,2,3].map(i=>{const g=grp(EXE);sh(g,'M-13 -8L13 -8L13 8L-13 8Z',.8);lines(g,-9,0,18,1,R,INK,7,1.4);return g;});
  const hero=actor(k.root,HWANDO,300,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.8;vis(RF,true);vis(DN,a);vis(RG,!a);rain(t,0,.5);
   cars.forEach(c=>{const an=(t*.5+c.ph)*6.283,x=CX+Math.cos(an)*(RX-17),y=CY+Math.sin(an)*(RY-8.5);setA(c.n,{cx:x,cy:y});c.g.setAttribute('transform',`translate(${f(x)} ${f(y)})`);op(c.g,a?0:.5);});
   zb.forEach((n,i)=>{const an=1.2+i*.05;n.setAttribute('d',Lp([[CX+Math.cos(an)*RX,CY+Math.sin(an)*RY],[CX+Math.cos(an+.03)*RX,CY+Math.sin(an+.03)*RY],[CX+Math.cos(an+.03)*(RX-34),CY+Math.sin(an+.03)*(RY-17)],[CX+Math.cos(an)*(RX-34),CY+Math.sin(an)*(RY-17)]],true));});
   const ex=es(t,11,12.2);op(EXE,ex);op(lg,ex*(.45+.1*Math.sin(t*3)));op(lamp,.7+.3*Math.sin(t*3)**2);
   cards.forEach((g,i)=>{const u=es(t,12.2+i*.25,13.2+i*.25),bk=es(t,14.8,16.2);g.setAttribute('transform',`translate(${f(EX-30-u*(40+i*4)+bk*18)} ${f(CY-30+i*22+Math.sin(t*2+i)*2)}) rotate(${f(-6+i*4)})`);op(g,u*(1-.6*bk));});
   if(a){hero.w.x=300;}else hero.w.x=250;hero.up(t,dt,0,{headDrop:a?3*es(t,.8,2.2):1.6*es(t,14.6,15.6),lean:a?9*es(t,.8,2.2):0,nearHand:a?[62,lerp(80,62,es(t,.8,2.2))]:null,swordAng:18});}}},NIGHT));
})();
