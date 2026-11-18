// R882 — 선화 컷씬 장면 둘째 묶음(2부 ep1b01~05·07~09). 재생기 lineart-cine-r880.js, 도우미는 lineart-scenes-r881.js 가 내준 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게". 맘몬(ep1b06·ep1b06b)은 다른 작업 몫이라 넣지 않는다.
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다.
//  · 십자·육망성 모양은 그리지 않는다(ep1b08 은 그 문장을 고르지 않음). 인물은 얼굴 없는 선 인형.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__;const SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R882__)return;window.__STORYWORLD_LINEART_SCENES_R882__='R882-scenes-2';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,hanok,lantern,featherWing,flame,motes,wolf}=A.kit;
const {STAND,SHUF,RUN,vis,op,dipper,ground,scratches,actor,crouch,PATIENT,fogBand,spark,archKnee,dark,whiten,FONT}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
// 의목사 A: 긴 검은 사제복, 청록 코등이 검(몽세 안에서만 든다)
const EXO0={robe:'long',robeFill:'#222b38',legs:'#171c24',hat:HATS.hero,seed:5};
const EXO=Object.assign({},EXO0,{sword:'#6fe0e6'});
const CY='#7fe6ee';
// 긴 머리(여자), 주방장 모자
const HAIRL=(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,3.6,-1.6)}Q${P(c,4.6,-5.6)} ${P(c,0,-5.8)}Q${P(c,-5.4,-5.6)} ${P(c,-5,1)}Q${P(c,-6.4,8)} ${P(c,-5.4,13)}L${P(c,-1.6,12)}Q${P(c,-2.6,5)} ${P(c,-1.4,-1)}Q${P(c,1,-3.2)} ${P(c,3.6,-1.6)}Z`);hat.setAttribute('d','');line.setAttribute('d','');};
const TOQUE=(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-4,-3.6)}L${P(c,-4.6,-10)}Q${P(c,-7,-15)} ${P(c,-2.4,-14.6)}Q${P(c,0,-17.6)} ${P(c,2.6,-14.6)}Q${P(c,7,-15)} ${P(c,4.6,-10)}L${P(c,4,-3.6)}Z`);line.setAttribute('d',`M${P(c,-4.3,-6)}L${P(c,4.3,-6)}`);};
// 쓰레기봉투
const bag=(p,x,y,s,R)=>{const g=grp(p);dark(g,smoothD([[x-12*s,y],[x-14*s,y-9*s],[x-7*s,y-18*s],[x-2*s,y-20*s]])+`L${f(x-4*s)} ${f(y-26*s)}L${f(x+4*s)} ${f(y-25*s)}L${f(x+2*s)} ${f(y-20*s)}`+smoothD([[x+2*s,y-20*s],[x+8*s,y-17*s],[x+14*s,y-9*s],[x+12*s,y]]).replace('M','L')+'Z','#0b0b09',.9);
 ink(g,`M${f(x-6*s)} ${f(y-13*s)}q${f(3*s)} ${f(-4*s)} ${f(7*s)} ${f(-3*s)}M${f(x+3*s)} ${f(y-8*s)}q${f(3*s)} ${f(2*s)} ${f(4*s)} ${f(5*s)}`,.4,{opacity:.6});return g;};
// 솟아오르는 악마 형상(검은 몸, 뿔, 불씨 눈). 발밑이 원점.
function fiend(p,R){const G=grp(p),w=R(14,24),h=R(58,98),hw=R(7,10),ty=Math.floor(R(0,3)),FL='#05060a';
 dark(G,smoothD([[-w,0],[-w*1.12,-h*.42],[-w*.82,-h*.7],[-hw,-h*.8],[-hw*.9,-h*.95],[0,-h],[hw*.9,-h*.95],[hw,-h*.8],[w*.82,-h*.7],[w*1.12,-h*.42],[w,0]])+'Z',FL,.8);
 [-1,1].forEach(s=>dark(G,band(ty===0?[[s*hw*.6,-h*.96],[s*(hw+7),-h-8],[s*(hw+4),-h-22]]:ty===1?[[s*hw*.7,-h*.93],[s*(hw+12),-h*.97],[s*(hw+19),-h-12]]:[[s*hw*.4,-h*.98],[s*hw*.7,-h-14],[s*hw*1.1,-h-28]],5,.6),FL,.7));
 ink(G,`M${f(-w*.55)} ${f(-h*.5)}q${f(w*.55)} 6 ${f(w*1.1)} 0M${f(-w*.5)} ${f(-h*.32)}q${f(w*.5)} 5 ${f(w)} 0`,.4,{opacity:.45});
 const eyes=[-1,1].map(s=>el('ellipse',{cx:f(s*hw*.42),cy:f(-h*.86),rx:1.9,ry:1.1,fill:'#ff6a3a'},G));return{G,h,eyes};}
// 가운데 줄 따라 두께가 바뀌는 띠의 테두리 점(부드러운 곡선용)
const band2=(Pp,w0,w1)=>{const n=Pp.length,L=[],Rr=[];for(let i=0;i<n;i++){const q=Pp[Math.min(n-1,i+1)],o=Pp[Math.max(0,i-1)],dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1,w=lerp(w0,w1,i/(n-1))/2;L.push([Pp[i][0]-dy/l*w,Pp[i][1]+dx/l*w]);Rr.push([Pp[i][0]+dy/l*w,Pp[i][1]-dx/l*w]);}return L.concat(Rr.reverse());};
// ───────── ep1b01 솔로몬의 봉인식 ─────────
A.add({zone:'ep1b01',paper:'#10161f',ink:'#d6e2ea',sky:[[0,'#070b12'],[0.55,'#121c2a'],[1,'#0a0f17']],line:'rgba(130,220,235,.42)',D:18,
 subs:[[0.9,4.9,'나는 두 이름을 흘려들으며 내가 누울 자리를 확인했다.'],[6.0,8.8,'자격시험이 시작되자 눈앞에 검은 바다가 펼쳐졌다.'],[9.3,12.5,'갈라진 수면 아래에서 악마의 형상이 차례로 솟아올랐다.'],[13.4,17.2,'가까워지는 형상과 거리를 재며 무기를 고쳐 쥐었다.']],
 build(k){const R=seeded(1201),GR=296,S=1.1,GX=478;
  const cam=k.track([[0,290,206,1.35],[3.2,330,200,1.4],[5.4,486,196,2.0],[5.6,330,196,1.0,'cut'],[9,340,200,1.1],[12.7,372,206,1.26],[13.1,262,222,1.9],[18,276,214,1.7]]),dip=dipper(k,[5.6]);
  const A1=grp(k.root),A2=grp(k.glow),B0=grp(k.back),B1=grp(k.root),B2=grp(k.glow);
  // A: 연결 장치 — 누울 자리
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(A1,'M-80 62L720 62',.5,{opacity:.6});for(let i=0;i<9;i++){const x=-40+i*90;ink(A1,`M${x} 62L${x} ${GR+3}`,.35,{opacity:.35});}scratches(A1,18,R,GR+10,354);
  sh(A1,Lp([[352,GR+3],[356,GR-40],[372,GR-40],[376,GR+3]],true),1);dark(A1,Lp([[338,GR-86],[390,GR-86],[390,GR-44],[338,GR-44]],true),'#07101a',1);
  const wave=el('path',{d:'',fill:'none',stroke:CY,'stroke-width':.9,'stroke-linejoin':'round'},A1);
  for(let i=0;i<6;i++){const x0=R(430,650);ink(A1,`M${f(x0)} 62Q${f((x0+560)/2+R(-24,24))} ${f(R(126,156))} ${f(R(538,584))} ${GR-128}`,.6,{opacity:.75});}
  ink(A1,`M530 ${GR-18}Q526 ${GR-118} 560 ${GR-120}Q594 ${GR-118} 590 ${GR-18}`,.7,{opacity:.8});
  sh(A1,Lp([[410,GR+3],[414,GR-18],[566,GR-18],[570,GR+3]],true),1.1);ink(A1,`M424 ${GR-8}L556 ${GR-8}`,.4,{opacity:.6});
  sh(A1,Lp([[402,GR-26],[556,GR-52],[574,GR-54],[578,GR-42],[566,GR-38],[406,GR-13]],true),1.1);sh(A1,`M546 ${GR-53}q13 -11 26 -2l2 9l-25 5Z`,.8);
  ink(A1,`M420 ${GR-24}L548 ${GR-45}`,.4,{opacity:.6});
  ink(A1,`M518 ${GR-18}Q512 ${GR-130} 560 ${GR-132}Q608 ${GR-130} 602 ${GR-18}`,1.7);
  const nodes=[0,1,2,3,4].map(i=>{const a=Math.PI*(1.12+i*.19);return el('circle',{cx:f(560+Math.cos(a)*45),cy:f(GR-78+Math.sin(a)*56),r:2,fill:CY},A1);}),rg=k.glowAt(560,GR-84,84,CY,A2),sg0=k.glowAt(364,GR-64,34,CY,A2);
  const h0=actor(A1,EXO0,300-STAND.speed*S*2.7,GR,1,S,STAND);
  // B: 검은 바다 — 줄마다 뒤에서 형상이 솟는다
  el('rect',{x:-90,y:150,width:820,height:270,fill:'#020409'},B0);ink(B0,'M-90 214L730 214',.5,{opacity:.5});
  const gapG=k.glowAt(GX,256,120,'#c0482c',B2);
  const RY=[226,246,270,298,330],FILL=['#0a1320','#0c1726','#0e1b2c','#101f32','#122338'],rows=[],dem=[];
  RY.forEach((y,i)=>{const dg=grp(B1);rows.push({y,i,dg,fill:el('path',{d:'',fill:FILL[i]},B1),line:el('path',{d:'',fill:'none',stroke:INK,'stroke-width':f(.6+i*.16),'stroke-linecap':'round',opacity:f(.5+i*.1)},B1)});});
  for(let i=0;i<13;i++){const r=i%4,fd=fiend(rows[r].dg,R);dem.push({fd,r,x:(i<3?GX+R(-26,26):R(350,650)),sc:.5+r*.2,t0:9.2+i*.26,ph:R(0,6)});}
  el('path',{d:Lp([[-90,GR],[300,GR],[290,420],[-90,420]],true),fill:'#0a0d13'},B1);ink(B1,`M-90 ${GR}L300 ${GR}L296 ${GR+44}`,1);scratches(B1,8,R,GR+10,350,-60,270);
  const hero=actor(B1,EXO,214,GR,1,S,STAND),tg=k.glowAt(0,0,16,CY,B2);
  const topY=(x,r,t,gap)=>r.y+(2+r.i*1.2)*Math.sin(x*.03*(1-r.i*.08)+t*(1.1+r.i*.2)+r.i*2)+gap*(24+r.i*12)*Math.exp(-Math.pow((x-GX)/(34+r.i*14+gap*26),2));
  return(t,dt)=>{cam(t);dip(t);const a=t<5.6;vis(A1,a);vis(A2,a);vis(B0,!a);vis(B1,!a);vis(B2,!a);
   if(a){h0.up(t,dt,smooth(.2,.5,t)*(1-smooth(2.6,3.2,t)),{headDrop:t>3.2?1.2:0,headTurn:.6*es(t,3.2,4)});
    let d='';for(let i=0;i<=44;i++){const x=341+i,ph=((i/44*2-t*.8)%1+1)%1;d+=(i?'L':'M')+x+' '+f(GR-64-(ph<.1?12*Math.sin(ph*31.4):0)+Math.sin(i*.9+t*5)*1.2);}wave.setAttribute('d',d);
    nodes.forEach((n,i)=>op(n,.4+.6*Math.max(0,Math.sin(t*3-i*.9))));op(rg,.35+.25*Math.sin(t*2.2));op(sg0,.5);}
   else{const gap=es(t,8.2,10.2);op(gapG,gap*(.55+.15*Math.sin(t*3)));
    rows.forEach(r=>{let d='';for(let x=-90;x<=738;x+=18)d+=(d?'L':'M')+x+' '+f(topY(x,r,t,gap));r.line.setAttribute('d',d);r.fill.setAttribute('d',d+'L738 430L-90 430Z');});
    dem.forEach(q=>{const u=es(t,q.t0,q.t0+1.7),x=q.x-Math.max(0,t-q.t0)*4*q.sc,H=q.fd.h*q.sc;q.fd.G.setAttribute('transform',`translate(${f(x)} ${f(RY[q.r]+10+(1-u)*(H+34)+Math.sin(t*1.3+q.ph)*2)}) scale(${f(q.sc)})`);q.fd.eyes.forEach((e,j)=>op(e,u*(.6+.4*Math.sin(t*7+q.ph+j))));});
    const grip=es(t,13.6,15),back=es(t,12.6,13.3)*8;hero.w.x=214-back;hero.up(t,dt,0,{swordAng:lerp(24,116,grip),nearHand:grip>.01?[lerp(48,57,grip),lerp(80,66,grip)]:null,farHand:grip>.5?[lerp(44,54,es(t,14.4,15.2)),lerp(78,68,es(t,14.4,15.2))]:null,lean:3*grip,headDrop:-.6*grip,legPts:grip>.2?crouch(5*grip):null,drop:5*grip*(grip>.2?1:0),wind:.6});
    const tp=hero.st.tip?hero.at(hero.st.tip[0],hero.st.tip[1]):[0,0];setA(tg,{cx:tp[0],cy:tp[1],r:10+16*grip});op(tg,.3+.6*grip);}};}});
// ───────── ep1b02 나태의 집 ─────────
A.add({zone:'ep1b02',paper:'#191a15',ink:'#dcd8c6',sky:[[0,'#0d0e0b'],[0.5,'#1d1e17'],[1,'#12130f']],line:'rgba(225,205,140,.42)',D:17,
 subs:[[0.8,3.6,'문이 열리자 썩은 냄새가 밖으로 밀려 나왔다.'],[4.4,7.4,'남자는 거실 한가운데 허물처럼 누워 있었다.'],[8.6,12.2,'접속하자 남자가 있던 자리에서 거대한 반인반요가 일어났다.'],[12.7,16.7,'날아오는 휴지 뭉치를 피하며 고개를 들자, 이번에는 녹슨 냉장고가 내 쪽으로 날아들고 있었다.']],
 build(k){const R=seeded(1202),GR=298,S=1.1,WARM='#f3e2b0',MAN={robe:'coat',robeFill:'#77766a',legs:'#44443c',hat:HATS.patient,seed:7,restN:3,restF:-3};
  const cam=k.track([[0,150,216,1.8],[3.6,226,210,1.5],[7.7,420,238,2.1],[8.0,330,190,1.06,'cut'],[12.2,352,180,1.16],[12.8,300,196,1.24],[17,262,214,1.6]]),dip=dipper(k,[8.0]);
  const RM=grp(k.root),A1=grp(k.root),A2=grp(k.glow),B1=grp(k.root),B2=grp(k.glow),F=grp(k.front);
  // 방: 바닥·창(검은 비닐)·널린 쓰레기
  ink(RM,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(RM,'M-80 70L720 70',.5,{opacity:.6});ink(RM,`M120 ${GR-8}L720 ${GR-8}`,.4,{opacity:.45});scratches(RM,20,R,GR+12,356);
  sh(RM,Lp([[498,102],[606,102],[606,198],[498,198]],true),1.1);dark(RM,Lp([[503,107],[601,107],[601,193],[512,193],[503,186]],true),'#050505',.7);
  ink(RM,'M510 120q20 8 44 -2q20 -6 40 4M508 150q30 10 60 0q16 -4 30 2M520 176q24 6 50 0',.4,{opacity:.45});
  const bottle=(p,x,y,a)=>{const g=grp(p,{transform:`translate(${f(x)} ${f(y)}) rotate(${f(a)})`});sh(g,'M-8 -3L4 -3Q7 -3 8 -1.4L11 -1.2L11 1.2L8 1.4Q7 3 4 3L-8 3Z',.6);ink(g,'M-3 -3L-3 3',.35,{opacity:.6});return g;};
  [[232,GR+2,1.1],[282,GR+3,.8],[330,GR+1,1.3],[548,GR+2,1.5],[590,GR+3,1.1],[636,GR+1,1.4]].forEach(([x,y,s])=>bag(RM,x,y,s,R));
  for(let i=0;i<12;i++)bottle(RM,R(170,660),GR+R(-1,8),R(-30,30));
  sh(RM,Lp([[296,GR+3],[294,GR-16],[328,GR-18],[330,GR+3]],true),.8);ink(RM,`M296 ${GR-8}L328 ${GR-9}`,.4,{opacity:.6});
  // A: 문, 냄새, 들어오는 나, 누운 남자, 닿지 못하는 빛
  sh(A1,Lp([[36,GR+3],[36,146],[108,146],[108,GR+3]],true),1.2);const doorN=sh(A1,'',1),knob=el('circle',{r:1.6,fill:INK},A1),dg=k.glowAt(72,224,110,WARM,A2);
  const stink=[0,1,2,3,4].map(i=>({n:ink(A1,'',.7,{opacity:.6}),ph:i*.2,y:170+i*22}));
  const beam=el('path',{d:Lp([[503,186],[512,193],[566,GR+10],[520,GR+10]],true),fill:WARM,opacity:.16},A2),bg0=k.glowAt(508,190,16,WARM,A2);
  const lieG=grp(A1,{transform:`translate(480 ${GR-7}) rotate(-90)`}),man=figure(lieG,MAN);place(man.g,0,0,1,S);
  const h0=actor(A1,EXO0,236-STAND.speed*S*2.4,GR,1,S,STAND);
  // B: 일어나는 반인반요(등에 쓰레기 산), 휴지 뭉치, 녹슨 냉장고
  el('rect',{x:-90,y:-40,width:820,height:470,fill:'#000',opacity:.28},B1);
  const GI=grp(B1),FL='#0a0a08';
  [[22,-172,1.7],[52,-150,1.5],[36,-204,1.4],[4,-196,1.2],[60,-186,1.1],[28,-232,1.0]].forEach(([x,y,s])=>bag(GI,x,y,s,R));
  sh(GI,Lp([[44,-214],[76,-222],[82,-196],[50,-188]],true),.8);sh(GI,Lp([[-8,-222],[14,-230],[20,-212],[-2,-204]],true),.7);ink(GI,'M70 -150l14 -18M10 -240l-4 -16M46 -236l8 -14',.9);
  dark(GI,smoothD([[-60,0],[-72,-60],[-66,-120],[-34,-166],[10,-176],[46,-150],[60,-118],[52,-94],[64,-48],[58,0]])+'Z',FL,1.2);
  ink(GI,'M-30 -150q20 10 44 2M-44 -100q30 14 70 4M-40 -56q30 10 64 2',.5,{opacity:.5});
  dark(GI,band([[-40,-134],[-74,-96],[-92,-52],[-96,-6]],16,10),FL,1);ink(GI,'M-102 -4l-6 6M-96 -2l-2 8M-90 -4l4 6',1);
  dark(GI,ell(-60,-128,17,20),FL,1);[-1,1].forEach(s=>dark(GI,band([[-60+s*10,-144],[-60+s*20,-154],[-60+s*22,-166]],5,.8),FL,.7));
  const gey=[-67,-56].map(x=>el('ellipse',{cx:x,cy:-130,rx:2.6,ry:1.3,fill:'#d8c35a'},GI));
  const wads=[0,1,2,3,4].map(i=>({n:pa(B1,'#e8e4d6','M-4 0Q-5 -4 -1 -4Q3 -6 4 -1Q6 3 1 4Q-3 5 -4 0Z',.5),t0:11.3+i*.36,y1:GR-96+i*9}));
  const FR=grp(B1);sh(FR,Lp([[-17,-62],[17,-62],[17,0],[-17,0]],true),1.1);ink(FR,'M-17 -40L17 -40M11 -56L11 -45M11 -34L11 -16',.9);
  [[-9,-52],[4,-22],[-11,-8],[8,-58]].forEach(([x,y])=>el('path',{d:`M${x} ${y}q4 -3 7 1q-1 5 -6 4Z`,fill:'#8a5a3a',opacity:.85},FR));
  const dust=[0,1,2,3,4,5].map(()=>el('circle',{r:3,fill:INK,opacity:0},B1));
  const hero=actor(B1,EXO,206,GR,1,S,STAND);
  bag(F,-6,GR+70,2.4,R);bag(F,652,GR+72,2.6,R);
  return(t,dt)=>{cam(t);dip(t);const a=t<8.0;vis(A1,a);vis(A2,a);vis(B1,!a);vis(B2,!a);
   if(a){const o=es(t,.2,1.3),w=66*(1-o*.82);doorN.setAttribute('d',Lp([[40,GR+3],[40,150],[40+w,150+o*7],[40+w,GR+3+o*5]],true));setA(knob,{cx:40+w-6,cy:230+o*5});op(dg,.5*o);
    stink.forEach(s=>{const u=((t*.3+s.ph)%1),x=114+u*70;s.n.setAttribute('d',`M${f(x)} ${f(s.y+20)}q7 -7 0 -14q-7 -7 0 -14q7 -7 0 -14`);op(s.n,o*Math.sin(Math.PI*u)*.7*(1-es(t,3.6,4.6)));});
    h0.up(t,dt,smooth(1.2,1.5,t)*(1-smooth(3.6,4.2,t)),{headDrop:1.2*es(t,4,5),farHand:t<4.4&&t>1.4?[46,37]:null});
    man.update({pose:STAND.pose(0,0),go:0,dt,t,nearHand:[46,78],farHand:[36,76]});op(beam,.13+.03*Math.sin(t*1.3));}
   else{const rise=minJerk(seg(t,8.5,11.4)),thr=es(t,13.1,13.5);GI.setAttribute('transform',`translate(${f(440+wobble(t*1.1,1)*2)} ${GR+3}) scale(1 ${f(lerp(.16,1,rise))}) rotate(${f(lerp(10,0,rise)-6*thr*(1-es(t,13.6,14.4)))})`);gey.forEach((e,i)=>op(e,rise*(.6+.4*Math.sin(t*5+i))));
    wads.forEach(q=>{const u=seg(t,q.t0,q.t0+.9);q.n.setAttribute('transform',`translate(${f(lerp(372,150,u))} ${f(lerp(GR-150,q.y1,u)-34*Math.sin(Math.PI*u))}) rotate(${f(u*500)})`);op(q.n,u>0&&u<1?1:0);});
    const duck=es(t,11.5,12.0)*(1-es(t,13.0,13.5)),fu=seg(t,13.4,15.5),fy=fu*fu,land=es(t,15.5,15.7),hop=es(t,14.5,15.3);
    FR.setAttribute('transform',`translate(${f(lerp(430,236,fu))} ${f(lerp(GR-214,GR-14,fy)-70*Math.sin(Math.PI*fu)*(1-fu*.4))}) rotate(${f(lerp(-40,-262,fu)-land*8)})`);op(FR,fu>0?1:0);
    dust.forEach((n,i)=>{const u=seg(t,15.5,16.6);setA(n,{cx:262+(i-2.5)*14*(1+u),cy:GR-2-u*10*(i%2+1),r:3+u*7});op(n,u>0?.35*(1-u):0);});
    hero.w.x=206-10*es(t,9.2,10.2)-44*hop;hero.up(t,dt,0,{legPts:duck>.05||hop>.05&&hop<.98?crouch(14*duck+8*Math.sin(Math.PI*hop)):null,drop:14*duck+8*Math.sin(Math.PI*hop),lean:14*duck-8*es(t,13.4,14.2)*(1-hop),headDrop:3*duck-2.2*es(t,13.2,13.8)*(1-es(t,15.4,16)),swordAng:lerp(24,100,es(t,9,10.4)),nearHand:t>9?[lerp(48,56,es(t,9,10.4)),lerp(80,66,es(t,9,10.4))]:null,capeKick:-8*hop});}};}});
// ───────── ep1b03 금이 간 안경 ─────────
A.add({zone:'ep1b03',paper:'#17171d',ink:'#dcdbe6',sky:[[0,'#0c0c12'],[0.5,'#1c1c26'],[1,'#111117']],line:'rgba(200,190,235,.42)',D:17,
 subs:[[1.0,5.2,'사진 속 여자의 얼굴에는 칼자국과 볼펜 자국이 어지럽게 겹쳐 있었다.'],[6.2,9.6,'몽세에 들어가자 유리 조각과 서늘한 칼날이 앞에서 쏟아졌다.'],[10.2,13.2,'얼굴을 가리며 물러나자 금 간 안경을 쓴 누나가 보였다.'],[13.8,16.4,'목에는 시꺼먼 뱀이 감겨 있었다.']],
 build(k){const R=seeded(1203),GR=298,S=1.1,SC=1.45,SX=474,SIS={robe:'dress',robeFill:'#3a3a4a',hat:HAIRL,seed:9,restN:2,restF:-2};
  const cam=k.track([[0,250,214,1.5],[2.4,330,190,1.7],[5.4,410,142,3.7],[5.7,300,200,1.12,'cut'],[9.6,300,200,1.22],[10.3,430,176,2.3],[13.4,462,158,3.5],[17,468,154,4.0]]),dip=dipper(k,[5.7]);
  const A1=grp(k.root),B1=grp(k.root),B2=grp(k.glow),BF=grp(k.front);
  // A: 먼지 없는 집, 벽의 사진
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(A1,'M-80 60L720 60',.5,{opacity:.6});ink(A1,`M-80 ${GR-10}L720 ${GR-10}`,.4,{opacity:.45});
  sh(A1,Lp([[110,GR+3],[110,GR-62],[250,GR-62],[250,GR+3]],true),1.1);ink(A1,`M110 ${GR-30}L250 ${GR-30}M180 ${GR-62}L180 ${GR+3}`,.6);
  [[122,10,22],[136,10,26],[150,10,22],[194,14,18],[212,14,18],[230,14,18]].forEach(([x,w,h])=>sh(A1,Lp([[x,GR-62],[x,GR-62-h],[x+w,GR-62-h],[x+w,GR-62]],true),.7));
  sh(A1,Lp([[520,GR+3],[524,GR-40],[600,GR-40],[604,GR+3]],true),1);sh(A1,`M548 ${GR-40}Q546 ${GR-70} 562 ${GR-72}Q578 ${GR-70} 576 ${GR-40}Z`,.8);ink(A1,`M562 ${GR-72}q-10 -22 -2 -40M562 ${GR-72}q8 -18 16 -28`,.7);
  sh(A1,Lp([[366,92],[454,92],[454,200],[366,200]],true),1.3);dark(A1,Lp([[373,99],[447,99],[447,193],[373,193]],true),'#0c0c13',.7);
  sh(A1,'M380 193Q382 166 398 160L422 160Q438 166 440 193Z',.9);el('ellipse',{cx:410,cy:138,rx:14,ry:17,fill:PAPER,stroke:INK,'stroke-width':1},A1);
  bl(A1,'M396 140Q392 114 410 116Q430 114 425 142Q428 160 424 170L419 168Q422 150 418 132Q410 124 400 130Q398 150 400 168L395 170Q393 156 396 140Z');
  const cuts=[];for(let i=0;i<8;i++){const x=R(397,412),y=R(124,140);cuts.push(el('path',{d:`M${f(x)} ${f(y)}l${f(R(8,20))} ${f(R(8,22))}`,fill:'none',stroke:'#f0e6e0','stroke-width':f(R(.8,1.5)),'stroke-linecap':'round',opacity:0},A1));}
  for(let i=0;i<6;i++){let d='M'+f(R(398,422))+' '+f(R(126,150));for(let j=0;j<7;j++)d+='l'+f(R(-12,12))+' '+f(R(-9,9));cuts.push(el('path',{d,fill:'none',stroke:'#6f8cdc','stroke-width':.7,'stroke-linecap':'round','stroke-linejoin':'round',opacity:0},A1));}
  cuts.sort(()=>R(-1,1));
  const h0=actor(A1,EXO0,306-STAND.speed*S*1.9,GR,1,S,STAND);
  // B: 쏟아지는 유리 조각과 칼날, 금 간 안경의 누나, 목의 뱀
  ink(B1,`M-80 ${GR+3}L720 ${GR+3}`,1);scratches(B1,22,R,GR+10,356);k.glowAt(SX,170,150,'#5a4a7a',B2);
  const sis=actor(B1,SIS,SX,GR,-1,SC,STAND),hero=actor(B1,EXO,196,GR,1,S,STAND);
  const SN=grp(B1),FLS='#050507',coil=[0,1].map(()=>dark(SN,'',FLS,.7)),neck=dark(SN,'',FLS,.7),shead=dark(SN,'',FLS,.7),seye=el('circle',{r:.7,fill:'#e04a3a'},SN),tongue=el('path',{d:'',fill:'none',stroke:'#e04a3a','stroke-width':.5,'stroke-linecap':'round'},SN),scl=ink(SN,'',.3,{opacity:.6});
  const GL=grp(B1),lens=[0,1].map(()=>el('circle',{r:3.4,fill:'rgba(200,220,240,.14)',stroke:INK,'stroke-width':.7},GL)),bridge=ink(GL,'',.6),crack=el('path',{d:'',fill:'none',stroke:'#ffffff','stroke-width':.55,'stroke-linecap':'round','stroke-linejoin':'round'},GL),glint=ink(GL,'',.5,{opacity:.8});
  const shards=[];for(let i=0;i<34;i++){const bladeQ=i%4===0,s=R(4,11),d=bladeQ?'M-16 0L0 -2.4L18 0L0 2.4Z':`M${f(-s)} ${f(R(-s,s)*.5)}L${f(R(-2,3))} ${f(-s*R(.5,1))}L${f(s)} ${f(R(-2,4))}L${f(R(-3,2))} ${f(s*R(.4,.9))}Z`;
   shards.push({n:el('path',{d,fill:bladeQ?'#eef2f6':'#bcd6e6','fill-opacity':bladeQ?.95:.5,stroke:INK,'stroke-width':.5,'stroke-linejoin':'round'},i%3?B1:BF),y:R(70,292),sp:R(150,260),ph:R(0,1),rs:bladeQ?0:R(-260,260),a0:bladeQ?R(170,190):R(0,360),bladeQ});}
  return(t,dt)=>{cam(t);dip(t);const a=t<5.7;vis(A1,a);vis(B1,!a);vis(B2,!a);vis(BF,!a);
   if(a){h0.up(t,dt,smooth(.2,.5,t)*(1-smooth(1.8,2.4,t)),{headDrop:-1.2*es(t,2.2,3),headTurn:.5*es(t,2.2,3)});cuts.forEach((n,i)=>op(n,es(t,2.4+i*.19,2.6+i*.19)*.95));}
   else{const cover=es(t,6.3,6.9),back=es(t,9.6,10.5),thin=1-.7*es(t,10,11.4);
    hero.w.x=196-34*back;hero.up(t,dt,0,{nearHand:[lerp(48,53,cover),lerp(80,33,cover)],farHand:[lerp(44,50,cover),lerp(80,38,cover)],lean:-6*cover,headDrop:1.6*cover,swordAng:lerp(24,150,cover),legPts:back>.02&&back<.98?crouch(7*Math.sin(Math.PI*back)):null,drop:7*Math.sin(Math.PI*back)});
    sis.up(t,dt,0,{headTurn:0,nearHand:[46+wobble(t*7,1)*.5,84],farHand:[36,84]});
    shards.forEach(q=>{const x=660-((t*q.sp+q.ph*760)%760),hit=clamp((x-230)/60,0,1);q.n.setAttribute('transform',`translate(${f(x)} ${f(q.y+Math.sin(t*2+q.ph*9)*4)}) rotate(${f(q.a0+t*q.rs)})`);op(q.n,(q.bladeQ?1:.9)*hit*thin*(x<SX-40||q.y<GR-150||q.n.parentNode===BF?1:.0));});
    const hc=sis.at(sis.st.head[0],sis.st.head[1]),u=SC,sw=Math.sin(t*1.7)*2.2,tight=es(t,13.8,15.4);
    coil.forEach((n,i)=>n.setAttribute('d',ell(hc[0]+2+i*.8,hc[1]+(8.2+i*3.4-tight*.6*i)*u*.92,(5.6-i*.3-tight*.5)*u,(1.9)*u)));
    const N=[[hc[0]+7*u,hc[1]+9*u],[hc[0]+11*u,hc[1]+1*u],[hc[0]+9.5*u,hc[1]-8*u],[hc[0]+3*u+sw,hc[1]-12.5*u],[hc[0]-5*u+sw*1.4,hc[1]-11*u]];neck.setAttribute('d',band(N,3.6*u,2.6*u));
    const hp=N[4];shead.setAttribute('d',`M${P(hp,2,-2.6)}L${P(hp,-7,-1.6)}L${P(hp,-10,1)}L${P(hp,-6,2.8)}L${P(hp,2,2.6)}Z`);setA(seye,{cx:hp[0]-5,cy:hp[1]-.2});
    tongue.setAttribute('d',Math.sin(t*6)>.2?`M${P(hp,-10,1)}l-5 1l-2.4 -1.6M${P(hp,-15,2)}l-2.4 1.6`:'');scl.setAttribute('d',N.slice(1,4).map(p=>`M${P(p,-2,0)}l4 1`).join(''));
    const e0=[hc[0]-3.9*u,hc[1]-.4*u],e1=[hc[0]+1.5*u,hc[1]-.6*u];setA(lens[0],{cx:e0[0],cy:e0[1],r:2.5*u});setA(lens[1],{cx:e1[0],cy:e1[1],r:2.3*u});
    bridge.setAttribute('d',`M${f(e0[0]+2.5*u)} ${f(e0[1])}L${f(e1[0]-2.3*u)} ${f(e1[1])}M${f(e1[0]+2.3*u)} ${f(e1[1])}L${f(hc[0]+4.6*u)} ${f(hc[1]-1.4*u)}`);
    crack.setAttribute('d',`M${P(e0,-3,-2.6)}l2 1.7l-.9 1.5l2.4 1.3l-.5 1.7l2 1.6M${P(e0,-1,.6)}l-2.4 1.6M${P(e0,1.5,1.9)}l2 -.9M${P(e0,-1.9,-.9)}l2.6 -1.9M${P(e1,-2,1.2)}l1.6 -1.4l.4 1.4l1.8 -1.2`);glint.setAttribute('d',`M${P(e1,-1.6,-1.6)}l1.4 -1`);
    op(GL,es(t,6,6.2));}};}});
// ───────── ep1b04 탐식의 주방 ─────────
A.add({zone:'ep1b04',paper:'#15191a',ink:'#dfe4dc',sky:[[0,'#0b0e0e'],[0.5,'#1a2120'],[1,'#101414']],line:'rgba(220,225,190,.42)',D:17,
 subs:[[0.9,4.4,'총주방장이 음식이 담긴 접시를 쓰레기통에 버리고 있었다.'],[5.0,7.6,'그는 곧바로 다음 접시를 집어 들었다.'],[8.6,11.8,'주방 바닥이 살점처럼 부풀어 올라 발밑이 흔들렸다.'],[12.4,16.4,'돼지와 두꺼비를 닮은 베엘제붑이 식칼과 프라이팬을 마구 던졌다.']],
 build(k){const R=seeded(1204),GR=298,S=1.1,CX=336,CT=GR-52,CHEF={robe:'coat',robeFill:'#e9ece6',legs:'#3b4140',hat:TOQUE,seed:6};
  const cam=k.track([[0,350,214,1.7],[4.4,372,232,2.5],[7.8,366,220,2.2],[8.2,320,200,1.08,'cut'],[11.8,290,212,1.3],[12.4,336,194,1.14],[17,300,204,1.4]]),dip=dipper(k,[8.2]);
  const A1=grp(k.root),A2=grp(k.glow),B1=grp(k.root),B2=grp(k.glow);
  const pan=(p,x,y,a,s=1)=>{const g=grp(p,{transform:`translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${s})`});sh(g,ell(0,12,9,9),1);ink(g,'M0 0L0 3M-5 12a5 5 0 0 0 10 0',.8);return g;};
  // A: 주방 — 조리대, 걸린 팬, 쓰레기통, 접시를 버리는 주방장
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);for(let y=74;y<GR-40;y+=30)ink(A1,`M-80 ${y}L720 ${y}`,.3,{opacity:.3});for(let x=-60;x<720;x+=44)ink(A1,`M${x} 74L${x} ${GR-58}`,.3,{opacity:.3});
  ink(A1,'M200 96L600 96',1.2);[250,300,470,520,566].forEach((x,i)=>{ink(A1,`M${x} 96q3 5 0 8`,.7);if(i<4)pan(A1,x,104,R(-6,6),i%2?1:.8);else ink(A1,`M${x} 104L${x} 132M${x-4} 132a4 5 0 0 0 8 0Z`,.9);});
  sh(A1,Lp([[350,CT],[614,CT],[614,CT+7],[350,CT+7]],true),1.1);ink(A1,`M360 ${CT+7}L360 ${GR+3}M604 ${CT+7}L604 ${GR+3}M360 ${GR-16}L604 ${GR-16}`,1);
  [0,1,2,3].forEach(i=>sh(A1,ell(560,CT-2-i*2.6,12,2.4),.6));sh(A1,`M470 ${CT}L470 ${CT-22}Q486 ${CT-28} 502 ${CT-22}L502 ${CT}Z`,.9);ink(A1,`M464 ${CT-22}L508 ${CT-22}M486 ${CT-26}l0 -5`,.9);
  const steam=[0,1,2].map(i=>ink(A1,'',.5,{opacity:.5}));
  const dish=(p)=>{const g=grp(p),food=grp(g);sh(g,ell(0,0,10,2.4),.8);pa(food,'#b9794a','M-6 -1Q-6 -8 0 -8Q6 -8 6 -1Z',.6);pa(food,'#7fae6a','M-1 -8q2 -5 5 -3q-1 3 -5 3Z',.4);g.appendChild(food);return{g,food};};
  const d3=dish(A1);d3.g.setAttribute('transform',`translate(430 ${CT-3})`);
  const chef=actor(A1,CHEF,CX,GR,1,S,STAND);
  const d1=dish(A1),d2=dish(A1);
  sh(A1,Lp([[358,GR+3],[354,GR-40],[396,GR-40],[392,GR+3]],true),1.1);dark(A1,ell(375,GR-40,21,4.6),'#040505',.9);ink(A1,`M357 ${GR-28}L393 ${GR-28}`,.4,{opacity:.6});
  k.glowAt(420,150,170,'#d9e6d0',A2).setAttribute('opacity','.25');
  // B: 살점처럼 부푼 바닥, 꿈틀거리는 조리대, 베엘제붑
  const flesh=el('path',{d:'',fill:'#3a1a1e'},B1),fl=ink(B1,'',1.1),veins=ink(B1,'',.45,{opacity:.5}),ct=[150,330].map(()=>dark(B1,'','#241316',1)),ctl=[0,1].map(()=>ink(B1,'',.6,{opacity:.7}));
  const BZ=grp(B1),BF='#18281c';dark(BZ,smoothD([[-72,0],[-88,-40],[-74,-90],[-34,-118],[18,-120],[62,-94],[82,-44],[70,0]])+'Z',BF,1.2);
  pa(BZ,'#3c5a3a',ell(-6,-44,46,34),.6).setAttribute('opacity','.7');ink(BZ,'M-40 -30q34 14 68 0M-36 -52q30 10 60 0',.4,{opacity:.5});
  [[-40,-118,11],[-8,-126,11]].forEach(([x,y,r])=>{pa(BZ,'#d9e0b0',ell(x,y,r,r),.9);bl(BZ,`M${x-7} ${y}q7 -3 14 0q-7 3 -14 0Z`).setAttribute('style','fill:#101410');});
  dark(BZ,'M-58 -112L-70 -128L-50 -120ZM12 -122L26 -138L28 -118Z',BF,.8);pa(BZ,'#c98f8a',ell(-70,-88,15,11),.9);bl(BZ,ell(-76,-88,2.2,3.4)).setAttribute('style','fill:#3a1a1e');bl(BZ,ell(-66,-88,2.2,3.4)).setAttribute('style','fill:#3a1a1e');
  const mouth=ink(BZ,'',1.3),drool=ink(BZ,'',.5,{opacity:.7});for(let i=0;i<9;i++)el('circle',{cx:f(R(-60,64)),cy:f(R(-100,-10)),r:f(R(1,2.4)),fill:'none',stroke:INK,'stroke-width':.4,opacity:.5},BZ);
  const arm=dark(BZ,'',BF,1),bzE=k.glowAt(0,0,60,'#9fc060',B2);
  const proj=[0,1,2,3,4,5,6].map(i=>{const knife=i%2===0,g=grp(B1);if(knife){sh(g,'M-3 0L-16 -1.4L-18 2.6L-3 3Z',.7);bl(g,'M-3 -.4L8 -.4L8 3.2L-3 3.2Z');}else{sh(g,ell(-8,0,9,9),.9);ink(g,'M1 0L16 0',1.6);ink(g,'M-13 0a5 5 0 0 1 10 0',.5,{opacity:.6});}
   return{g,knife,t0:12.5+i*.56,x1:[214,150,250,120,196,236,170][i],y1:knife?GR+1:GR-4};});
  const gas=fogBand(k,k.front,7,R,190,286,'#9fc060',.06,.13);
  const hero=actor(B1,EXO,170,GR,1,S,STAND),seal=k.glowAt(0,0,14,CY,B2);
  const fy=(x,t,amp)=>GR+3-(8*Math.sin(x*.022+t*1.3)+5*Math.sin(x*.047-t*2.1))*amp-amp*4;
  return(t,dt)=>{cam(t);dip(t);const a=t<8.2;vis(A1,a);vis(A2,a);vis(B1,!a);vis(B2,!a);gas(t,0,a?0:es(t,9.6,12.5));
   if(a){// 접시 두 번: 기울여 쏟고, 접시도 놓고, 다음 접시를 집는다
    const tilt1=es(t,1.6,2.6),drop1=seg(t,3.0,3.7),reach=es(t,4.5,5.4)*(1-es(t,5.6,6.5)),has2=t>=5.4,tilt2=es(t,6.7,7.6);
    const hl=has2?[lerp(72,60,es(t,5.6,6.5)),lerp(63,62,es(t,5.6,6.5))]:[lerp(60,72,reach),lerp(62,63,reach)];
    chef.up(t,dt,0,{nearHand:hl,headDrop:1.6,lean:4+5*reach,farHand:[50,70]});const hp=chef.at(chef.st.handN[0],chef.st.handN[1]);
    const putDish=(d,x,y,tilt,sl)=>{d.g.setAttribute('transform',`translate(${f(x)} ${f(y)}) rotate(${f(tilt*72)})`);d.food.setAttribute('transform',`translate(${f(sl*13)} ${f(sl*sl*30)})`);op(d.food,1-es(sl,.7,1));};
    const s1=es(t,2.1,3.0);putDish(d1,hp[0]+5+drop1*3,hp[1]-2+drop1*drop1*34,tilt1,s1);op(d1.g,t<5.4?1-es(drop1,.6,1):0);vis(d1.g,t<4);
    if(has2){putDish(d2,hp[0]+5,hp[1]-2,tilt2,es(t,7.1,7.9));op(d2.g,1);}else{d2.g.setAttribute('transform',`translate(${f(CX+S*32+5)} ${f(CT-3)})`);d2.food.setAttribute('transform','');op(d2.food,1);op(d2.g,1);}
    steam.forEach((n,i)=>{const u=((t*.35+i*.33)%1);n.setAttribute('d',`M${f(478+i*8)} ${f(CT-30-u*26)}q4 -5 0 -10q-4 -5 0 -10`);op(n,Math.sin(Math.PI*u)*.5);});}
   else{const amp=es(t,8.3,9.6);let d='';for(let x=-90;x<=738;x+=14)d+=(d?'L':'M')+x+' '+f(fy(x,t,amp));fl.setAttribute('d',d);flesh.setAttribute('d',d+'L738 430L-90 430Z');
    let v='';for(let i=0;i<9;i++){const x=-40+i*88+Math.sin(i*3)*20,y=fy(x,t,amp);v+=`M${f(x)} ${f(y+8)}q10 ${f(8+3*Math.sin(t*2+i))} 26 6q8 6 6 16`;}veins.setAttribute('d',v);
    ct.forEach((n,i)=>{const x0=[262,356][i],w=[78,60][i],b=fy(x0+w/2,t,amp)+2,wb=j=>Math.sin(t*2.4+i*2+j*1.7)*5*amp;n.setAttribute('d',smoothD([[x0,b],[x0-4+wb(0),b-30],[x0+2+wb(1),b-56+wb(4)],[x0+w/2,b-62+wb(2)],[x0+w-2+wb(3),b-56+wb(5)],[x0+w+4+wb(1),b-30],[x0+w,b]])+'Z');ctl[i].setAttribute('d',`M${f(x0+wb(0))} ${f(b-48)}Q${f(x0+w/2)} ${f(b-54+wb(2))} ${f(x0+w+wb(1))} ${f(b-48)}M${f(x0+w*.3)} ${f(b-36)}l${f(w*.4)} ${f(wb(4)*.4)}M${f(x0+w*.3)} ${f(b-16)}l${f(w*.4)} ${f(wb(5)*.4)}`);});
    const bx=496,by=fy(bx,t,amp)+3,br=1+.03*Math.sin(t*2.6);BZ.setAttribute('transform',`translate(${bx} ${f(by)}) scale(${f(br)} ${f(2-br)})`);setA(bzE,{cx:bx-40,cy:by-110});op(bzE,.3);
    const cyc=((t-12.5)/.56),thr=t>12.2?Math.max(0,Math.sin(Math.PI*((cyc%1+1)%1))):0;mouth.setAttribute('d',`M-90 -66Q-50 ${f(-52+thr*8)} -8 -66`);drool.setAttribute('d',`M-60 -58l0 ${f(8+3*Math.sin(t*3))}M-34 -58l0 ${f(5+2*Math.sin(t*4))}`);
    arm.setAttribute('d',smoothD(band2([[-50,-58],[-72,lerp(-40,-70,thr)],[-88,lerp(-26,-96,thr)],[-100,lerp(-12,-118,thr)]],16,7))+'Z');
    proj.forEach(q=>{const u=seg(t,q.t0,q.t0+1.0),x=lerp(402,q.x1,u),y=lerp(GR-112,q.y1,u)-74*Math.sin(Math.PI*u)*(1-u*.3),done=u>=1;q.g.setAttribute('transform',`translate(${f(x)} ${f(done?fy(q.x1,t,amp)-(q.knife?3:6):y)}) rotate(${f(done?(q.knife?-64:8):-u*(q.knife?760:420))})`);op(q.g,u>0?(done&&!q.knife?1-es(t,q.t0+1.4,q.t0+2.2)*.6:1):0);});
    const dodge=t>12.6?Math.sin((t-12.6)*5.6):0,hx=170+wobble(t*1.2,1)*5*amp+dodge*10,hy=fy(hx,t,amp)-3;hero.w.x=hx;hero.w.y=hy;
    const st=es(t,10.4,11.4);hero.up(t,dt,0,{lean:wobble(t*2.1,1)*7*amp+dodge*5,legPts:crouch(5*amp+4*Math.abs(dodge)),drop:5*amp+4*Math.abs(dodge),farHand:[lerp(44,56,st),lerp(80,60,st)],nearHand:[lerp(48,58,st),lerp(80,58,st)],swordAng:lerp(24,128,st),headDrop:.8});
    const fh=hero.at(hero.st.handF[0],hero.st.handF[1]);setA(seal,{cx:fh[0],cy:fh[1]});op(seal,st*(.6+.3*Math.sin(t*8)));}};}});
// ───────── ep1b05 붉은 하이힐 ─────────
A.add({zone:'ep1b05',paper:'#1a1014',ink:'#ecdcdc',sky:[[0,'#0c0709'],[0.5,'#22121a'],[1,'#120a0d']],line:'rgba(240,150,150,.42)',D:18,
 subs:[[0.9,4.0,'붉은 조명이 켜지며 끝없는 무대가 드러났다.'],[5.2,8.2,'막이 올라간 뒤에도 객석에는 아무도 없었다.'],[9.6,12.6,'서윤이 몸을 돌릴 때 등 뒤로 가늘게 빛나는 선이 보였다.'],[13.2,16.6,'가까이 살펴보니 장식이 아니라 수백 가닥의 실이었다.']],
 build(k){const R=seeded(1205),GR=290,S=1.1,RED='#e0453c',SX=300,SY={robe:'long',robeFill:'#7a2630',hat:HAIRL,seed:8,restN:2,restF:-2};
  const cam=k.track([[0,230,204,1.35],[4.4,430,200,1.12],[4.7,320,214,1.25,'cut'],[9.0,320,176,1.5],[9.3,290,204,1.5,'cut'],[12.6,300,196,1.7],[13.3,322,172,3.0],[18,362,138,2.2]]),dip=dipper(k,[4.7,9.3]);
  const A1=grp(k.root),A2=grp(k.glow),B1=grp(k.root),BF=grp(k.front),C1=grp(k.root),C2=grp(k.glow);
  const stage=p=>{el('path',{d:`M-420 ${GR+3}L1060 ${GR+3}L1060 ${GR+40}L-420 ${GR+40}Z`,fill:'#120a0d'},p);ink(p,`M-420 ${GR+3}L1060 ${GR+3}`,1);ink(p,`M-420 ${GR+40}L1060 ${GR+40}`,1.5);el('rect',{x:-420,y:GR+41,width:1480,height:90,fill:'#060304'},p);
   for(let x=-400;x<1050;x+=46)ink(p,`M${x} ${GR+3}L${f(x+(x-320)*.05)} ${GR+40}`,.35,{opacity:.4});};
  // A: 차례로 켜지는 붉은 조명, 끝이 보이지 않는 무대
  stage(A1);ink(A1,'M-420 64L1060 64',1.2);ink(A1,'M-420 55L1060 55',.5,{opacity:.7});for(let x=-410;x<1050;x+=18)ink(A1,`M${x} 64l9 -9l9 9`,.3,{opacity:.5});
  const lamps=[];for(let x=-366;x<1040;x+=68){sh(A1,Lp([[x-6,64],[x+6,64],[x+9,80],[x-9,80]],true),.8);
   lamps.push({on:.5+Math.abs(x-246)/68*.2,cone:el('path',{d:Lp([[x-7,80],[x+7,80],[x+40,GR+3],[x-40,GR+3]],true),fill:RED,opacity:0},A2),pool:el('ellipse',{cx:x,cy:GR+6,rx:44,ry:6,fill:RED,opacity:0},A2),bulb:el('circle',{cx:x,cy:81,r:3.4,fill:'#ffd0c0',opacity:0},A2)});}
  const sy0=actor(A1,SY,372,GR,-1,.96,STAND),h0=actor(A1,EXO0,176,GR,1,S,STAND);
  // B: 올라가는 막, 빈 객석
  el('rect',{x:-90,y:-40,width:820,height:470,fill:'#0b0608'},B1);
  for(let i=0;i<6;i++){const y=132+i*31,w=24+i*9,h=22+i*8,gap=w*.22,n=Math.ceil(900/(w+gap)),g=grp(B1,{opacity:f(.32+i*.13)});
   for(let j=0;j<n;j++){const x=320-(n/2)*(w+gap)+j*(w+gap)+(i%2?(w+gap)/2:0),r=w*.28;dark(g,`M${f(x)} ${f(y+h)}L${f(x)} ${f(y+r)}Q${f(x)} ${f(y)} ${f(x+r)} ${f(y)}L${f(x+w-r)} ${f(y)}Q${f(x+w)} ${f(y)} ${f(x+w)} ${f(y+r)}L${f(x+w)} ${f(y+h)}Z`,'#170b10',.5+i*.13);}
   ink(g,`M-90 ${f(y+h)}L730 ${f(y+h)}`,.4,{opacity:.6});}
  const val=el('path',{d:'',fill:'#4a1820',stroke:INK,'stroke-width':1,'stroke-linejoin':'round'},B1),folds=ink(B1,'',.45,{opacity:.55});
  [[-1,-70],[1,710]].forEach(([sg,x])=>{dark(BF,smoothD([[x,-60],[x+sg*-58,-60],[x+sg*-64,120],[x+sg*-50,250],[x+sg*-70,420],[x,420]])+'Z','#3a1218',1);for(let i=1;i<4;i++)ink(BF,`M${f(x+sg*-i*15)} -60Q${f(x+sg*(-i*15-6))} 200 ${f(x+sg*(-i*17))} 420`,.4,{opacity:.5});});
  const dustB=motes(B1,22,R,[60,40,580,300],{vy0:-4,vy1:4,vx0:-3,vx1:3,fill:'#f0c0b8',r0:.4,r1:.9});
  // C: 돌아서는 서윤, 등 뒤의 실
  stage(C1);const spot=el('path',{d:Lp([[SX-10,-60],[SX+14,-60],[SX+62,GR+3],[SX-58,GR+3]],true),fill:RED,opacity:.13},C2),pool=el('ellipse',{cx:SX,cy:GR+7,rx:66,ry:8,fill:RED,opacity:.2},C2);
  const TH=[0,1,2,3].map(i=>el('path',{d:'',fill:'none',stroke:'#ffe6cc','stroke-width':.34,'stroke-linecap':'round'},C1)),thr=[];for(let i=0;i<72;i++)thr.push({tx:R(360,780),sag:R(8,54),dx:R(-10,10),ph:R(0,6)});
  const tg=k.glowAt(0,0,12,'#ffe6cc',C2);
  const hero=actor(C1,EXO0,150,GR,1,S,STAND),sy=actor(C1,SY,SX,GR,1,S,STAND);
  const heels=[-5,5].map(dx=>{const g=grp(C1);el('path',{d:'M-6 0L-6 -5.4Q-2 -6.4 2 -3L7.4 -.6L7.4 0L1 0L-1 -2L-4.6 -2.4L-4.8 0Z',fill:RED,stroke:'#ffd0c0','stroke-width':.4},g);return{g,dx};});
  return(t,dt)=>{cam(t);dip(t);const a=t<4.7,b=t>=4.7&&t<9.3,c=t>=9.3;vis(A1,a);vis(A2,a);vis(B1,b);vis(BF,b);vis(C1,c);vis(C2,c);
   if(a){lamps.forEach((l,i)=>{const o=es(t,l.on,l.on+.25)*(.85+.15*Math.sin(t*23+i*2)*(t<l.on+.5?1:0));op(l.cone,.13*o);op(l.pool,.2*o);op(l.bulb,o);});
    sy0.up(t,dt,0,{});h0.up(t,dt,0,{headTurn:.8*Math.sin(clamp((t-1.6)/2.6,0,1)*Math.PI*2),headDrop:-.6});}
   if(b){const Y=lerp(310,34,minJerk(seg(t,4.8,6.7)));let d=`M-90 -80L730 -80L730 ${f(Y)}`,fd='';for(let x=730;x>-90;x-=58){d+=`Q${x-29} ${f(Y+20)} ${x-58} ${f(Y)}`;fd+=`M${x} -80L${x} ${f(Y)}`;}val.setAttribute('d',d+'Z');folds.setAttribute('d',fd);dustB(t,0,.7);}
   if(c){const dir=t<10.5?1:-1,sq=1-.86*(1-Math.abs(clamp((t-10.5)/.45,-1,1))),tens=es(t,16.2,17.6);sy.w.dir=dir;sy.up(t,dt,0,{headTurn:-1.4*es(t,10,10.5)*(t<10.5?1:0),headDrop:1.2*tens,lean:-3*tens});
    sy.g.setAttribute('transform',sy.g.getAttribute('transform')+` translate(40 0) scale(${f(sq)} 1) translate(-40 0)`);
    heels.forEach(h=>h.g.setAttribute('transform',`translate(${f(SX+h.dx*sq)} ${GR}) scale(${f(dir*sq)} 1)`));
    hero.up(t,dt,0,{headDrop:-.8*es(t,11,12)});
    const bp=sy.at(34.5,50),show=es(t,10.6,11.8),D=['','','',''];thr.forEach((q,i)=>{const sag=q.sag*(1-tens*.92)+Math.sin(t*1.4+q.ph)*2.5*(1-tens);D[i%4]+=`M${f(bp[0])} ${f(bp[1])}Q${f((bp[0]+q.tx)/2+q.dx)} ${f((bp[1]-70)/2+sag)} ${f(q.tx)} -70`;});
    TH.forEach((n,i)=>{n.setAttribute('d',D[i]);op(n,show*(.38+.3*Math.sin(t*3.1+i*1.6)+.25*tens));});setA(tg,{cx:bp[0],cy:bp[1],r:10+8*tens});op(tg,show*.7);}};}});
// ───────── ep1b07 불을 지른 남자 ─────────
A.add({zone:'ep1b07',paper:'#1a1210',ink:'#eadfd2',sky:[[0,'#0d0908'],[0.6,'#231510'],[1,'#3a1c10']],line:'rgba(255,170,100,.42)',D:18,
 subs:[[0.8,3.8,'비밀 통로로 들어서던 중 호텔에 불이 났다.'],[4.4,8.0,'돌아서서 입구 쪽을 확인하니 계단 앞에 늙은 청소부가 서 있었다.'],[8.9,11.4,'그 안에서는 여전히 시뻘건 불길이 치솟고 있었다.'],[11.9,17.4,'분노의 귀가 거대한 곰의 모습으로 달려들었다가 늑대 무리로 흩어졌고, 다시 엉겨 붙어 용의 형상을 취하곤 하였다.']],
 build(k){const R=seeded(1207),GR=296,S=1.1,FIRE='#ff8a3c',EMB='#ffb070',BODY='#0d0605',JAN={robe:'uniform',robeFill:'#5b5f66',legs:'#33363b',hat:HATS.villager,seed:11,restN:4,restF:-2};
  const cam=k.track([[0,176,212,1.7],[1.5,188,210,1.6],[3.3,404,198,1.05],[4.6,372,200,1.14],[8.2,436,212,1.9],[8.5,320,196,1.08,'cut'],[11.6,330,196,1.14],[15,356,186,1.1],[18,392,168,1.25]]),dip=dipper(k,[8.5]);
  const A1=grp(k.root),A2=grp(k.glow),AF=grp(k.front),B0=grp(k.back),B1=grp(k.root),B2=grp(k.glow),BF=grp(k.front);
  // A: 복도 — 비밀 통로, 계단, 번지는 불, 계단 앞의 청소부
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(A1,'M-80 66L720 66',.5,{opacity:.6});ink(A1,`M112 ${GR-70}L460 ${GR-70}`,.4,{opacity:.45});for(let x=150;x<460;x+=62)ink(A1,`M${x} ${GR-70}L${x} ${GR+3}`,.3,{opacity:.35});scratches(A1,16,R,GR+10,354);
  dark(A1,Lp([[30,GR+3],[30,142],[98,142],[98,GR+3]],true),'#050403',1.1);sh(A1,Lp([[98,GR+3],[98,138],[114,134],[114,GR+7]],true),1);ink(A1,`M102 170l8 -2M102 200l8 -2M102 230l8 -2M102 260l8 -2`,.6);
  [250,390].forEach(x=>{sh(A1,`M${x-5} 150L${x+5} 150L${x+3} 162L${x-3} 162Z`,.7);k.glowAt(x,150,34,'#f3d9a0',A2).setAttribute('opacity','.45');});
  let sd=`M470 ${GR+3}`;for(let i=0;i<7;i++)sd+=`l0 -14l24 0`;sh(A1,sd+`L720 ${GR+3}Z`,1.1);ink(A1,`M470 ${GR-40}L640 ${GR-140}M470 ${GR-40}L470 ${GR-12}M556 ${GR-90}L556 ${GR-50}`,1);
  const fl=[[540,GR-42,34,60],[590,GR-70,40,84],[646,GR-98,50,110],[700,GR-80,44,90],[618,GR-54,30,56],[676,GR-30,38,70],[512,GR-22,22,34],[566,GR-58,26,44],[726,GR-110,46,120],[660,GR-120,30,60]].map(([x,y,w,h],i)=>({f:flame(A1,i%2?'#d8501e':FIRE,.8),x,y,w,h,ph:i*1.7}));
  const fg=k.glowAt(630,190,230,FIRE,A2),smoke=fogBand(k,AF,7,R,62,112,'#9a8a80',.08,.16),emb=motes(AF,26,R,[380,30,720,300],{vy0:-34,vy1:-12,vx0:-16,vx1:-2,fill:EMB,r0:.5,r1:1.2});
  const jan=actor(A1,JAN,438,GR,-1,S,STAND),h0=actor(A1,EXO0,128+STAND.speed*S*1.5,GR,-1,S,STAND);
  const soot=el('path',{d:'',fill:'none',stroke:'#0d0605','stroke-width':1.1,'stroke-linecap':'round',opacity:.9},A1);
  // B: 몽세의 불길 — 곰 → 늑대 무리 → 용
  const fb=[];for(let i=0;i<17;i++)fb.push({f:flame(B0,i%3?'#b8381a':FIRE,.7),x:-70+i*50+R(-10,10),w:R(44,76),h:R(90,200),ph:R(0,9)});B0.setAttribute('opacity','.55');
  const bg=k.glowAt(330,310,430,'#ff5a1e',B2);ink(B1,`M-80 ${GR+3}L720 ${GR+3}`,1);scratches(B1,20,R,GR+10,356);
  const BE0=grp(B1,{style:'color:'+EMB}),legs=[0,1,2,3].map(()=>dark(BE0,'',BODY,1)),BE=grp(BE0,{transform:'translate(0 -24)'});
  dark(BE,smoothD([[-72,-22],[-80,-54],[-62,-84],[-24,-100],[22,-104],[58,-90],[74,-60],[72,-24],[40,-14],[-40,-12]])+'Z',BODY,1.2);
  dark(BE,ell(-84,-92,5.5,6),BODY,1);dark(BE,ell(-70,-96,5.5,6),BODY,1);
  dark(BE,smoothD([[-58,-88],[-86,-90],[-108,-74],[-122,-58],[-118,-49],[-100,-47],[-102,-36],[-80,-36],[-62,-50]])+'Z',BODY,1.2);ink(BE,'M-118 -49l4 5l3 -5l4 5l3 -5l4 4M-70 -76q10 6 12 18M-20 -92q8 8 6 20M24 -94q8 10 4 24',.7);
  const beye=el('ellipse',{cx:-100,cy:-68,rx:2.6,ry:1.5,fill:'#ffd070'},BE);
  const WG=grp(B1,{style:'color:'+EMB}),wv=[[-1,.95,0],[-1,1.1,.3],[-1,.85,.6],[1,1,.2],[1,.9,.7]].map(([dir,s,ph],i)=>({w:wolf(WG,{x:404+i*6,y:GR+2,dir,s,phase:ph}),dir,flip:false}));
  const DR=grp(B1,{style:'color:'+EMB}),dbody=dark(DR,'',BODY,1.8),dsp=ink(DR,'',.7),dhead=dark(DR,'',BODY,1.2),dhorn=dark(DR,'',BODY,.8),deye=el('ellipse',{rx:2.4,ry:1.4,fill:'#ffd070'},DR),dg=k.glowAt(0,0,60,FIRE,B2);
  const emb2=motes(BF,34,R,[-60,-10,720,330],{vy0:-30,vy1:-10,vx0:-8,vx1:8,fill:EMB,r0:.5,r1:1.3});
  const hero=actor(B1,EXO,150,GR,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<8.5;vis(A1,a);vis(A2,a);vis(AF,a);vis(B0,!a);vis(B1,!a);vis(B2,!a);vis(BF,!a);
   if(a){const burn=es(t,1.5,4.2);fl.forEach(q=>q.f.draw(q.x,q.y,q.w*burn,q.h*burn*(1+.12*Math.sin(t*5+q.ph)),t,q.ph));op(fg,burn*(.6+.08*Math.sin(t*7)));smoke(t,-1,burn);emb(t,0,burn);
    const turn=t>=3.7;h0.w.dir=turn?1:-1;h0.up(t,dt,smooth(.2,.4,t)*(1-smooth(1.5,1.9,t)),{headTurn:turn?0:-1.2*es(t,2,2.6),headDrop:turn?-.4:0});
    jan.up(t,dt,0,{lean:9,headDrop:2.2,nearHand:[45,84+wobble(t*3,1)*.6],farHand:[37,84]});const hc=jan.at(jan.st.head[0],jan.st.head[1]);soot.setAttribute('d',`M${P(hc,-3.4,-1)}l2.4 1.6M${P(hc,-2.6,2)}l2 .6M${P(hc,-.6,-2.4)}l1.6 1`);}
   else{fb.forEach(q=>q.f.draw(q.x,GR+3,q.w,q.h*(1+.16*Math.sin(t*3.3+q.ph)),t,q.ph));op(bg,.5+.08*Math.sin(t*6));emb2(t,0,1);
    hero.w.x=150-18*es(t,12.2,13.2);hero.up(t,dt,0,{swordAng:lerp(24,112,es(t,9.4,10.6)),nearHand:[lerp(48,57,es(t,9.4,10.6)),lerp(80,64,es(t,9.4,10.6))],lean:-4*es(t,12.2,13.2),legPts:crouch(4),drop:4,capeKick:-6});
    // 곰
    const bu=ease(seg(t,11.6,13.2)),bx=lerp(760,420,bu),gal=Math.abs(Math.sin(t*8.5))*10*(1-bu*.5);BE0.setAttribute('transform',`translate(${f(bx)} ${f(GR+3-gal)}) rotate(${f(Math.sin(t*8.5)*4)})`);op(BE0,t<11.5?0:1-es(t,13.1,13.5));
    legs.forEach((n,i)=>{const hx=i<2?-52:48,sw=Math.sin(t*8.5+(i%2?Math.PI:0)+(i<2?0:1.2))*20;n.setAttribute('d',smoothD(band2([[hx,-56],[hx+sw*.4,-28],[hx+sw,gal]],24,14))+'Z');});op(beye,.7+.3*Math.sin(t*11));
    // 늑대 무리: 흩어졌다가 돌아온다
    op(WG,es(t,13.1,13.4)*(1-es(t,15,15.5)));wv.forEach((q,i)=>{if(t>14.3&&!q.flip){q.flip=true;q.w.dir=-q.dir;}if(t<14.3&&q.flip){q.flip=false;q.w.dir=q.dir;q.w.x=404+i*6;}q.w.step(dt,t>13.15?1:0,t,2);});
    // 용
    const g=es(t,14.9,16.7),pts=[];for(let i=0;i<=14;i++){const u=i/14*g;pts.push([470+78*Math.sin(u*5.4+t*1.1)*(.25+u*.75)-u*30,GR+3-u*236]);}
    dbody.setAttribute('d',g>.02?smoothD(band2(pts,34,13))+'Z':'');let sp='';for(let i=2;i<14;i+=1){const p=pts[i],q=pts[i+1],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1,w=lerp(34,13,i/14)/2;sp+=`M${f(p[0]+dy/l*w)} ${f(p[1]-dx/l*w)}l${f(dy/l*7+dx/l*3)} ${f(-dx/l*7+dy/l*3)}`;}dsp.setAttribute('d',g>.1?sp:'');
    const hp=pts[14],nod=Math.sin(t*2.2)*4;dhead.setAttribute('d',g>.1?`M${P(hp,10,-10)}L${P(hp,-14,-16+nod*.3)}L${P(hp,-44,-4+nod)}L${P(hp,-46,3+nod)}L${P(hp,-22,4+nod*.4)}L${P(hp,-40,13+nod)}L${P(hp,-14,17)}L${P(hp,8,12)}Z`:'');
    dhorn.setAttribute('d',g>.1?`M${P(hp,-2,-14)}L${P(hp,22,-34)}L${P(hp,8,-11)}ZM${P(hp,-12,-15)}L${P(hp,4,-40)}L${P(hp,-4,-14)}Z`:'');setA(deye,{cx:hp[0]-18,cy:hp[1]-7+nod*.3});op(deye,g>.1?1:0);setA(dg,{cx:hp[0]-20,cy:hp[1]});op(dg,g*.6);}};}});
// ───────── ep1b08 하늘에 서려는 자 ─────────
A.add({zone:'ep1b08',paper:'#14131a',ink:'#e4e2ee',sky:[[0,'#09080d'],[0.5,'#1a1824'],[1,'#0f0e14']],line:'rgba(190,180,255,.42)',D:16,
 subs:[[1.0,4.8,'나는 가까운 전극에서부터 선이 이어진 쪽으로 시선을 옮겼다.'],[5.8,9.6,'일곱 갈래의 검은 신호 앞에 백색 정장을 입은 회장이 서 있었다.'],[10.2,14.6,'호텔에서 쫓아온 모든 신호가 그의 몸 안으로 흘러들고 있었던 듯하였다.']],
 build(k){const R=seeded(1208),GR=298,S=1.1,VIO='#a78cff',CH={robe:'coat',robeFill:'#f2f0ea',legs:'#dedcd4',hat:HATS.doctor,seed:12};
  const cam=k.track([[0,176,238,2.0],[1.8,196,228,1.8],[5.2,480,238,1.8],[5.4,330,196,1.08,'cut'],[9.8,356,190,1.3],[14.6,398,176,2.2],[16,400,172,2.35]]),dip=dipper(k,[5.4]);
  const A1=grp(k.root),A2=grp(k.glow),B0=grp(k.back),B1=grp(k.root),B2=grp(k.glow);
  // A: 전극과 거기서 이어진 선
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);scratches(A1,22,R,GR+12,356);const cables=[],tips=[];
  [246,338,428,522,612,700].forEach((x,i)=>{const h=R(13,18),L=R(64,80);sh(A1,smoothD([[x-L/2,GR+3],[x-L*.36,GR+3-h*.8],[x-L*.1,GR+3-h],[x+L*.2,GR+3-h*.7],[x+L/2,GR+3]])+'Z',.9);ink(A1,`M${f(x-L*.2)} ${f(GR-h*.5)}q6 4 4 ${f(h*.5)}M${f(x+L*.1)} ${f(GR-h*.5)}q5 4 2 ${f(h*.4)}`,.4,{opacity:.6});
   const tx=x+7,ty=GR-h-36;ink(A1,`M${x} ${f(GR+3-h)}L${tx} ${ty}`,2.4);sh(A1,ell(tx,ty,4.4,2.6),.8);tips.push(el('circle',{cx:tx,cy:ty-1,r:1.6,fill:VIO},A1));
   const cy0=GR+8+i*2.6,d=`M${tx} ${ty}C${f(tx+32)} ${f(ty-2)} ${f(tx+24)} ${f(cy0)} ${f(tx+62)} ${f(cy0)}L760 ${f(cy0)}`;ink(A1,d,1.5);cables.push(el('path',{d,fill:'none',stroke:VIO,'stroke-width':1.1,'stroke-linecap':'round','stroke-dasharray':'3 34'},A1));});
  const ag=k.glowAt(640,GR+20,150,VIO,A2),h0=actor(A1,EXO,150,GR,1,S,STAND);
  // B: 일곱 갈래의 검은 신호와 흰 정장의 회장
  k.glowAt(400,200,300,'#3a2a66',B0).setAttribute('opacity','.55');
  ink(B1,`M-80 ${GR+3}L720 ${GR+3}`,1);scratches(B1,18,R,GR+12,356);sh(B1,Lp([[322,GR+3],[330,GR-9],[470,GR-9],[478,GR+3]],true),1);
  const SRC=[[-70,52],[-90,196],[110,-50],[330,-64],[560,-54],[724,88],[736,236]],ST=SRC.map((s,i)=>({s,body:dark(B1,'','#020203',.6),flow:el('path',{d:'',fill:'none',stroke:VIO,'stroke-width':1,'stroke-linecap':'round','stroke-dasharray':'3 24'},B1),ph:R(0,6),w:R(22,30)}));
  const cg=k.glowAt(0,0,40,VIO,B2),ch=actor(B1,CH,400,GR-9,-1,1.25,STAND),hero=actor(B1,EXO,140,GR,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.4;vis(A1,a);vis(A2,a);vis(B0,!a);vis(B1,!a);vis(B2,!a);
   if(a){const up=minJerk(seg(t,.3,2.2)),cr=30*(1-up);h0.up(t,dt,0,{legPts:cr>1?crouch(cr):null,drop:cr,lean:26*(1-up),headDrop:3*(1-up)+.8*es(t,2.2,3)*(1-es(t,3.4,4.4)),farHand:up<1?[lerp(56,44,up),lerp(100,80,up)]:null,swordAng:lerp(80,22,up),headTurn:.8*es(t,3.2,4.4)});
    cables.forEach((n,i)=>n.setAttribute('stroke-dashoffset',f(-t*70-i*9)));tips.forEach((n,i)=>op(n,.5+.5*Math.sin(t*5+i*1.3)));op(ag,.3+.3*es(t,3,5));}
   else{const chest=ch.at(41,54),inn=es(t,10,13.6);
    ST.forEach((q,i)=>{const s=q.s,m=[(s[0]+chest[0])/2+Math.sin(t*.9+q.ph)*22,(s[1]+chest[1])/2-30+Math.cos(t*.7+q.ph)*18],P2=[];for(let j=0;j<=9;j++){const u=j/9,v=1-u;P2.push([v*v*s[0]+2*v*u*m[0]+u*u*chest[0],v*v*s[1]+2*v*u*m[1]+u*u*chest[1]]);}
     q.body.setAttribute('d',smoothD(band2(P2,q.w*(1+.2*inn),4))+'Z');q.flow.setAttribute('d',smoothD(P2));q.flow.setAttribute('stroke-dashoffset',f(-t*(60+40*inn)-i*7));op(q.flow,.5+.4*inn);});
    setA(cg,{cx:chest[0],cy:chest[1],r:30+50*inn+4*Math.sin(t*5)});op(cg,.35+.45*inn);
    ch.up(t,dt,0,{nearHand:[lerp(46,58,inn),lerp(84,62,inn)],farHand:[lerp(36,24,inn),lerp(84,62,inn)],headDrop:-1*inn,lean:-2*inn});
    hero.up(t,dt,0,{headDrop:-.5,swordAng:28,wind:-.8,capeKick:4});}};}});
// ───────── ep1b09 생체 부트로더 ─────────
A.add({zone:'ep1b09',paper:'#1c2228',ink:'#e8eef2',sky:[[0,'#0b0e12'],[0.55,'#2a333c'],[1,'#5a6772']],line:'rgba(200,225,240,.42)',D:18,
 subs:[[0.9,5.6,'고개를 드니 하늘엔 검은 태양이 떠 있었고, 그 아래 펼쳐진 설원은 기이할 만큼 창백하게 빛나고 있었다.'],[6.5,9.9,'사냥개의 모습을 한 사이보그들이 떼를 지어 달려오고 있었다.'],[10.7,13.1,'몸을 피하는 순간 발밑의 설원이 갈라졌다.'],[13.6,17.4,'그 아래에서 수십 개의 기계 다리가 거미처럼 뻗어 나왔다.']],
 build(k){const R=seeded(1209),GR=298,S=1.1,SNOW='#7f8d99',COLD='#e6f0f6',CX=356,MET='#0c0f13';
  const cam=k.track([[0,200,272,2.2],[2.0,214,252,1.9],[5.8,336,164,1.1],[6.1,300,214,1.3,'cut'],[10.1,262,216,1.45],[10.4,330,228,1.5,'cut'],[13.2,344,206,1.2],[18,352,184,1.0]]),dip=dipper(k,[6.1,10.4]);
  // 검은 태양, 먼 능선, 눈보라(세 컷 공통)
  k.glowAt(424,84,150,COLD,k.far).setAttribute('opacity','.5');el('circle',{cx:424,cy:84,r:34,fill:'#020304',stroke:COLD,'stroke-width':.9},k.far);const corona=el('circle',{cx:424,cy:84,r:39,fill:'none',stroke:COLD,'stroke-width':.5,opacity:.5},k.far);
  el('path',{d:'M-120 262Q40 226 190 250Q330 270 470 236Q610 214 780 256L780 330L-120 330Z',fill:'#465360'},k.back);ink(k.back,'M-120 262Q40 226 190 250Q330 270 470 236Q610 214 780 256',.6,{opacity:.6});
  const snow=motes(k.front,64,R,[-60,-20,720,350],{vy0:26,vy1:52,vx0:-70,vx1:-26,fill:COLD,r0:.5,r1:1.4});
  const G1=grp(k.root),G2=grp(k.glow),A1=grp(k.root),B1=grp(k.root),B2=grp(k.glow),C1=grp(k.root),C2=grp(k.glow);
  const gp=wavy(-90,GR+3,740,GR+3,1.6,22,R);el('path',{d:smoothD(gp)+'L740 430L-90 430Z',fill:SNOW},G1);ink(G1,smoothD(gp),1);k.glowAt(320,GR+70,360,COLD,G2).setAttribute('opacity','.3');
  for(let i=0;i<26;i++)ink(G1,`M${f(R(-60,700))} ${f(R(GR+12,358))}q${f(R(6,14))} -3 ${f(R(14,26))} 0`,.4,{opacity:.5});
  // A: 설원을 걷다 고개를 든다
  for(let i=0;i<9;i++)el('ellipse',{cx:f(60+i*17),cy:f(GR+5+(i%2)*2.4),rx:3.2,ry:1.1,fill:'#4a5661'},A1);
  const h0=actor(A1,EXO,206,GR,1,S,STAND),shA=el('ellipse',{rx:16,ry:2.6,fill:'#39434d',opacity:.6},A1);
  // B: 달려오는 사이보그 사냥개 떼
  const HG=grp(B1,{style:'color:#c3cfd8'}),hounds=[[560,1.15,0],[640,.95,.35],[716,1.2,.6],[800,1,.15],[880,1.1,.8],[956,.9,.45]].map(([x,s,ph])=>({w:wolf(HG,{x,y:GR+2+R(-1,6),dir:-1,s,phase:ph,period:.46}),s,eye:el('circle',{r:1.5,fill:'#ff4a3a'},B1),eg:k.glowAt(0,0,9,'#ff4a3a',B2),spine:el('path',{d:'',fill:'none',stroke:'#ff4a3a','stroke-width':.6,'stroke-dasharray':'2 3',opacity:.8},B1)}));
  const hB=actor(B1,EXO,176,GR,1,S,STAND);
  // C: 갈라지는 설원, 뻗어 나오는 기계 다리
  el('rect',{x:-90,y:GR+3.5,width:830,height:140,fill:'#030405'},C1);const core=dark(C1,'',MET,1.1),ceye=el('circle',{r:3,fill:'#ff4a3a'},C1),ceg=k.glowAt(0,0,30,'#ff4a3a',C2);
  const LEG=[];for(let i=0;i<16;i++){const sg=i<5?-1:1,j=i<5?i:i-5;LEG.push({sg,j,rx:R(-.7,.7),fx:CX+sg*(70+j*(sg<0?22:26)+R(-5,5)),out:el('path',{d:'',fill:'none',stroke:INK,'stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round'},C1),inn:el('path',{d:'',fill:'none',stroke:MET,'stroke-width':3.4,'stroke-linecap':'round','stroke-linejoin':'round'},C1),kn:el('circle',{r:3,fill:MET,stroke:INK,'stroke-width':.8},C1)});}
  const zig=[0,1,2,3,4,5,6,7,8].map(i=>R(-9,9)),halves=[-1,1].map(()=>({fill:el('path',{d:'',fill:SNOW},C1),line:ink(C1,'',1)}));
  for(let i=0;i<14;i++)ink(C1,`M${f(R(-60,700))} ${f(R(GR+14,358))}q${f(R(6,14))} -3 ${f(R(14,26))} 0`,.4,{opacity:.5});
  const chips=[0,1,2,3,4,5,6,7].map(i=>({n:pa(C1,COLD,'M-3 0L0 -3L3 0L0 2Z',.4),vx:R(-60,60),vy:R(-120,-60)}));
  const hC=actor(C1,EXO,CX-6,GR,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<6.1,b=t>=6.1&&t<10.4,c=t>=10.4;vis(G1,!c);vis(G2,!c);vis(A1,a);vis(B1,b);vis(B2,b);vis(C1,c);vis(C2,c);snow(t,-3,1);setA(corona,{r:39+1.6*Math.sin(t*2.3)});
   if(a){h0.up(t,dt,smooth(.2,.5,t)*(1-smooth(2.2,2.8,t)),{headDrop:1.4-3.2*es(t,2.8,4),wind:-1.2,capeKick:5});setA(shA,{cx:h0.w.x-8,cy:GR+5});}
   if(b){hounds.forEach(q=>{const hc=q.w.step(dt,1,t,1),ex=q.w.x-q.s*(hc[0]+3),ey=q.w.y+q.s*(hc[1]-.5);setA(q.eye,{cx:ex,cy:ey});setA(q.eg,{cx:ex,cy:ey});q.spine.setAttribute('d',`M${f(q.w.x+q.s*18)} ${f(q.w.y-q.s*29)}L${f(q.w.x-q.s*18)} ${f(q.w.y-q.s*30)}`);});
    const st=es(t,7.2,8.2);hB.w.x=176-20*es(t,8.6,9.8);hB.up(t,dt,0,{swordAng:lerp(24,110,st),nearHand:[lerp(48,57,st),lerp(80,64,st)],legPts:crouch(5*st),drop:5*st,wind:-1.4,capeKick:6,lean:-3*st});}
   if(c){const g=es(t,11.0,12.8)*72,ju=seg(t,10.75,11.55),jx=CX-6-174*minJerk(ju),jy=GR-46*Math.sin(Math.PI*ju);
    halves.forEach((h,i)=>{const sg=i?1:-1;let d='';for(let j=0;j<9;j++)d+=(j?'L':'M')+f(CX+sg*(g+3)+zig[j]*(j?1:0))+' '+f(GR+3+j*16);const top=sg<0?`M-90 ${GR+3}L${f(CX-g-3)} ${GR+3}`:`M740 ${GR+3}L${f(CX+g+3)} ${GR+3}`;h.line.setAttribute('d',top+d.replace('M','L'));h.fill.setAttribute('d',top+d.replace('M','L')+`L${sg<0?-90:740} 440Z`);});
    chips.forEach((q,i)=>{const u=seg(t,11.0+i*.05,12.0+i*.05);q.n.setAttribute('transform',`translate(${f(CX+q.vx*u)} ${f(GR+3+q.vy*u+150*u*u)}) rotate(${f(u*400)})`);op(q.n,u>0&&u<1?1:0);});
    const rise=es(t,15.2,17.8),cy=GR+70-rise*76;core.setAttribute('d',smoothD([[CX-56,cy+40],[CX-52,cy+6],[CX-30,cy-14],[CX,cy-20],[CX+30,cy-14],[CX+52,cy+6],[CX+56,cy+40]])+'Z');setA(ceye,{cx:CX,cy:cy+2});setA(ceg,{cx:CX,cy:cy+2});op(ceye,rise);op(ceg,rise*(.6+.3*Math.sin(t*6)));
    LEG.forEach(L=>{const e=minJerk(seg(t,13.3+L.j*.2+(L.sg>0?.1:0),14.3+L.j*.2+(L.sg>0?.1:0))),r0=[CX+L.rx*g*.6,GR+26-rise*26],st0=[CX+L.sg*g*.5,GR+14],ft=[lerp(st0[0],L.fx,e),lerp(st0[1],GR+3,e)-(50+L.j*9)*Math.sin(Math.PI*e)],kn=archKnee(r0,ft,(58+L.j*12)*(.45+.55*e),(70+L.j*16)*(.45+.55*e)),d=`M${pt(r0)}L${pt(kn)}L${pt(ft)}`;
     L.out.setAttribute('d',e>0?d:'');L.inn.setAttribute('d',e>0?d:'');setA(L.kn,{cx:kn[0],cy:kn[1]});op(L.kn,e>0?1:0);});
    hC.w.x=jx;hC.w.y=jy;const duck=es(t,13.6,14.6);hC.up(t,dt,0,{legPts:ju>0&&ju<1?crouch(10*Math.sin(Math.PI*ju)):duck>.02?crouch(13*duck):null,drop:ju>0&&ju<1?0:13*duck,lean:-10*Math.sin(Math.PI*ju)+8*duck,capeKick:-12*Math.sin(Math.PI*ju),swordAng:lerp(24,120,duck),nearHand:duck>.02?[lerp(48,56,duck),lerp(80,62,duck)]:null,headDrop:-1*duck,wind:-1});}};}});
})();
