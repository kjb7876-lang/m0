// R883 — 선화 컷씬 장면 셋째 묶음(3부 u201~u206). 재생기 lineart-cine-r880.js, 도우미는 lineart-scenes-r881.js 가 내준 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게".
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다. 십자로 읽히는 모양은 쓰지 않는다.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R883__)return;window.__STORYWORLD_LINEART_SCENES_R883__='R883-scenes-3';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,motes}=A.kit;
const {STAND,vis,op,dipper,scratches,actor,crouch,fogBand,spark,dark}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
// 의목사 B: 회색 긴 옷, 금빛 코등이 검
const EXB={robe:'long',robeFill:'#3d4450',legs:'#22272f',hat:HATS.doctor,sword:'#e6c36f',seed:4};
const AMB='#f2d27a',REDV='#ff5a48';
// 강철 군단의 기계 병사: 인형 + 붉은 눈빛
const MECH={robe:'uniform',robeFill:'#39424c',legs:'#2a3138',sleeve:'#39424c',hat:HATS.helm,hatFill:'#4a5560'};
function mech(parent,x,y,dir,s,seed){const a=actor(parent,Object.assign({seed},MECH),x,y,dir,s,STAND),eye=el('circle',{r:f(1.1*s),fill:REDV},parent);
 return{a,eye,up(t,dt,go,ex){a.up(t,dt,go,ex);const h=a.at(a.st.head[0]+2.8,a.st.head[1]-.6);setA(eye,{cx:h[0],cy:h[1]});},show(v){op(a.g,v);op(eye,v);}};}
const band2=(Pp,w0,w1)=>{const n=Pp.length,L=[],Rr=[];for(let i=0;i<n;i++){const q=Pp[Math.min(n-1,i+1)],o=Pp[Math.max(0,i-1)],dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1,w=lerp(w0,w1,i/(n-1))/2;L.push([Pp[i][0]-dy/l*w,Pp[i][1]+dx/l*w]);Rr.push([Pp[i][0]+dy/l*w,Pp[i][1]-dx/l*w]);}return L.concat(Rr.reverse());};
// ───────── u201 방어의 군단 ─────────
A.add({zone:'u201',paper:'#15191e',ink:'#d9e0e6',sky:[[0,'#0a0d11'],[0.55,'#1b222a'],[1,'#10141a']],line:'rgba(170,200,225,.42)',D:18,
 subs:[[0.8,4.6,'몽세에 닿자 아직 풍경이 드러나기도 전에 묵직한 군화 소리부터 들려오고 있었다.'],[5.5,8.6,'곧이어 차가운 강철 군단이 내 눈앞을 행진하기 시작했다.'],[9.3,12.5,'앞선 기계가 밟아 갈라진 땅을 뒤따르는 기계가 다시 밟았다.'],[13.6,17.2,'그러자 부서진 자리에서 두 구의 기계가 새로 일어나고 있었다.']],
 build(k){const R=seeded(2201),GR=292,S=1.1,KX=396,PD=STAND.period;
  const cam=k.track([[0,300,270,2.6],[5.2,330,264,2.3],[5.4,320,200,1.08,'cut'],[9,330,204,1.15],[10,KX,284,2.6],[12.8,KX+4,286,2.9],[13,300,206,1.5,'cut'],[18,318,196,1.7]]),dip=dipper(k,[5.4,13]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(k.root,26,R,GR+10,356);k.glowAt(330,150,300,'#3a4a5c',k.far).setAttribute('opacity','.5');
  const BK=grp(k.back,{opacity:.5}),FRG=grp(k.root),bk=[],fr=[];
  for(let i=0;i<11;i++)bk.push(mech(BK,-90+i*80,GR-8,1,.74,i));
  const crack=grp(k.root),cw=el('path',{d:`M${KX-5} ${GR+3}L${KX+3} ${GR+13}L${KX-6} ${GR+22}L${KX+2} ${GR+30}L${KX+7} ${GR+20}L${KX} ${GR+12}L${KX+6} ${GR+3}Z`,fill:'#030405',stroke:INK,'stroke-width':.7},crack);
  ink(crack,`M${KX-4} ${GR+6}l-20 5l-14 11M${KX+5} ${GR+6}l18 7l10 12M${KX-4} ${GR+18}l-12 10M${KX+5} ${GR+16}l22 4M${KX-5} ${GR+4}l-34 1M${KX+6} ${GR+4}l32 0`,.9);
  for(let i=0;i<9;i++)fr.push(mech(FRG,-100+i*98,GR,1,1,i+20));
  const puffs=[0,1,2,3,4,5,6,7].map(i=>el('ellipse',{cx:-60+i*98+40,cy:GR+4,rx:8,ry:2,fill:INK,opacity:0},k.root));
  const hero=actor(k.root,EXB,92,GR+2,1,S,STAND);
  // C: 하나를 베자 둘이 일어난다
  const C1=grp(k.root),tgt=mech(C1,352,GR+2,-1,1.12,61),pieces=[0,1,2,3,4,5].map(i=>({n:dark(C1,'M-5 -4L5 -5L6 4L-4 5Z','#39424c',.7),vx:R(-50,70),vy:R(-110,-50),r:R(-300,300)})),n1=mech(C1,338,GR+2,-1,1.12,62),n2=mech(C1,384,GR+2,-1,1.12,63),sp=spark(C1,'#fff3d6',5),hero2=actor(C1,EXB,268,GR+2,1,S,STAND);
  const DK=el('rect',{x:-90,y:-60,width:830,height:520,fill:'#000',opacity:1},k.front);
  return(t,dt)=>{cam(t);dip(t);const c=t>=13;vis(C1,c);vis(hero.g,!c&&t>=5.4);
   op(DK,t<5.4?.93-.55*es(t,2.6,5.3):0);
   bk.forEach(m=>{m.up(t,dt,1,{});if(m.a.w.x>770)m.a.w.x-=880;});fr.forEach(m=>{m.up(t,dt,1,{});if(m.a.w.x>780)m.a.w.x-=882;m.show(c?.35:1);});op(FRG,c?.5:1);
   const cyc=((t*2/PD)%1+1)%1,beat=Math.exp(-cyc*7);puffs.forEach((n,i)=>{setA(n,{rx:8+cyc*22,ry:2+cyc*4});op(n,(t<5.4?.5:.22)*beat);});
   const co=es(cyc,0,.1)*(1-es(cyc,.62,.96));op(crack,t>=5.4&&!c?co:0);crack.setAttribute('transform',`translate(${KX} ${GR+3}) scale(${f(.4+.6*co)}) translate(${-KX} ${-GR-3})`);
   if(!c)hero.up(t,dt,0,{headDrop:.6,headTurn:.6*es(t,9,10),swordAng:24});
   else{const sl=es(t,13.15,13.45),brk=es(t,13.4,13.9);hero2.w.x=268-16*es(t,16,17.2);hero2.up(t,dt,0,{swordAng:lerp(lerp(150,62,sl),30,es(t,15.6,16.6)),nearHand:[lerp(50,62,sl),lerp(40,62,sl)],lean:lerp(-6,10,sl)*(1-es(t,15.6,16.6)),legPts:crouch(5),drop:5,capeKick:-6*sl});
    tgt.up(t,dt,0,{lean:-14*brk});tgt.show(1-brk);sp(322,GR-56,seg(t,13.38,13.8),30);
    pieces.forEach(q=>{const u=seg(t,13.42,14.5);q.n.setAttribute('transform',`translate(${f(346+q.vx*u)} ${f(GR-50+q.vy*u+190*u*u)}) rotate(${f(q.r*u)})`);op(q.n,u>0&&u<1?1:0);});
    [n1,n2].forEach((m,i)=>{const u=minJerk(seg(t,14.3+i*.35,15.8+i*.35)),cr=34*(1-u);m.up(t,dt,0,{legPts:cr>1?crouch(cr):null,drop:cr,lean:20*(1-u),headDrop:3*(1-u)});m.show(es(t,14.2+i*.35,14.6+i*.35));});}};}});
// ───────── u202 잔인한 구원 ─────────
A.add({zone:'u202',paper:'#161a1f',ink:'#dbe1e6',sky:[[0,'#0a0d11'],[0.55,'#1c232b'],[1,'#11151a']],line:'rgba(175,200,225,.42)',D:17,
 subs:[[0.9,4.9,'반박하려던 나는 입을 다물고 아이가 숨어 있는 안쪽으로 시선을 옮겼다.'],[6.0,11.2,'눈앞의 기계를 힘껏 베어 넘기자 성벽이 더 높이 솟구쳤고, 조금 전에 열렸던 틈마저 굳게 닫히고 있었다.'],[12.2,15.6,'나는 그 앞에서 거친 숨을 고르며 멈춰 섰다.']],
 build(k){const R=seeded(2202),GR=296,S=1.1,WX=330,CW=30,GAP=3;
  const cam=k.track([[0,290,204,1.3],[4.9,440,236,2.5],[5.4,300,200,1.2,'cut'],[8,326,184,1.12],[11.5,344,150,1.0],[12,244,214,1.9,'cut'],[17,256,204,1.65]]),dip=dipper(k,[5.4,12]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(k.root,24,R,GR+10,356);
  // 틈 안쪽의 아이(웅크림)
  const B0=grp(k.root),cg=k.glowAt(WX+GAP*CW+15,GR-22,46,AMB),kid=figure(B0,{robe:'coat',robeFill:'#8d8a80',legs:'#55524b',hat:HATS.patient,seed:3,restN:2,restF:-2});place(kid.g,WX+GAP*CW+15,GR+1,-1,.5);
  const cols=[];for(let i=0;i<14;i++)cols.push({x:WX+i*CW,hb:R(96,132),ex:R(70,124),body:dark(k.root,'','#232b33',1),ln:ink(k.root,'',.4,{opacity:.55})});
  const mc=mech(k.root,286,GR+2,-1,1.1,7),sp=spark(k.root,'#fff3d6',5),hero=actor(k.root,EXB,196,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const rise=es(t,7.2,9.6),shut=es(t,8.4,10.6);
   cols.forEach((c,i)=>{const h=c.hb+c.ex*es(t,7.2+i*.05,9.4+i*.05),top=GR+3-h,bot=i===GAP?GR+3-62*(1-shut):GR+3;c.body.setAttribute('d',Lp([[c.x,bot],[c.x,top],[c.x+CW,top],[c.x+CW,bot]],true));
    let d='';for(let y=top+22;y<bot-4;y+=26)d+=`M${c.x} ${f(y)}L${c.x+CW} ${f(y)}M${c.x+5} ${f(y-8)}l2 0M${c.x+CW-7} ${f(y-8)}l2 0`;c.ln.setAttribute('d',d);});
   kid.update({pose:STAND.pose(0,0),go:0,dt,t,legPts:crouch(30),drop:30,lean:24,headDrop:4,nearHand:[52,84],farHand:[50,88]});op(cg,(.5+.1*Math.sin(t*2))*(1-shut));
   const sl=es(t,6.2,6.5),fall=es(t,6.45,7.3),calm=es(t,12.2,13.4),br=Math.sin(t*4.2)*(t>11?1:0);
   hero.up(t,dt,0,{swordAng:lerp(lerp(lerp(24,150,es(t,5.5,6.1)),58,sl),14,calm),nearHand:calm<1?[lerp(lerp(50,52,es(t,5.5,6.1)),62,sl),lerp(lerp(80,40,es(t,5.5,6.1)),62,sl)]:null,lean:lerp(0,10,sl)*(1-calm)+5*calm+br*1.6,drop:1.2+br*1.2,legPts:crouch(3+br*1.2),headDrop:1.6*calm+br*.8,headTurn:.7*es(t,1.2,2.4)*(t<5.4?1:0)});
   mc.up(t,dt,0,{lean:-70*fall});mc.a.g.setAttribute('opacity',f(1-es(t,7,7.5)));op(mc.eye,1-fall);sp(262,GR-54,seg(t,6.42,6.85),30);}}});
// ───────── u204 시스템의 거부권 ─────────
A.add({zone:'u204',paper:'#17191d',ink:'#dde0e4',sky:[[0,'#0b0c0f'],[0.55,'#1e2228'],[1,'#121418']],line:'rgba(230,190,160,.42)',D:17,
 subs:[[0.9,4.9,'첫 번째 기억의 문이 열리자 안에서 찢어지는 비명과 화약 냄새가 밀려왔다.'],[5.8,9.8,'문턱에 발을 올리는 순간 방어 장치들이 일제히 내 쪽으로 총구를 돌리고 있었다.'],[10.6,13.4,'발을 빼자 기계들의 움직임이 잦아들었다.'],[14.0,16.6,'나는 아이를 끌어내려고 뻗었던 팔을 조용히 거두었다.']],
 build(k){const R=seeded(2204),GR=296,S=1.1,DX=470,FIRE='#ff7a3c';
  const cam=k.track([[0,430,196,1.3],[4.9,446,192,1.5],[5.8,350,190,1.08],[10,340,190,1.18],[13.6,372,208,2.0],[17,366,210,2.2]]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);ink(k.root,'M-90 58L730 58',.5,{opacity:.6});scratches(k.root,22,R,GR+10,356);
  // 기억의 문
  dark(k.root,Lp([[DX-64,GR+3],[DX-64,96],[DX+64,96],[DX+64,GR+3]],true),'#050405',1.4);const dgl=k.glowAt(DX,200,150,FIRE),leaves=[-1,1].map(()=>sh(k.root,'',1.2)),lk=[-1,1].map(()=>ink(k.root,'',.5,{opacity:.6}));
  ink(k.root,`M${DX-74} ${GR+3}L${DX-74} 86L${DX+74} 86L${DX+74} ${GR+3}`,1.6);
  const scr=[];for(let i=0;i<9;i++)scr.push({n:ink(k.root,'',.8),a:Math.PI*(.72+i*.07),ph:R(0,6),L:R(70,150)});
  const smoke=fogBand(k,k.front,7,R,150,290,'#9a8f88',.06,.14);
  // 방어 장치
  const TP=[[250,58,1],[338,58,1],[610,58,1],[150,GR+3,-1],[300,GR+3,-1],[640,GR+3,-1],[560,58,1]],tur=TP.map(([x,y,dn],i)=>{sh(k.root,dn>0?Lp([[x-10,y],[x+10,y],[x+6,y+12],[x-6,y+12]],true):Lp([[x-12,y],[x+12,y],[x+7,y-14],[x-7,y-14]],true),1);
   const px=x,py=y+dn*16;return{px,py,idle:dn>0?Math.PI/2+R(-.5,.5):-Math.PI/2+R(-.6,.6),head:dark(k.root,ell(px,py,6.5,6.5),'#232b33',1),bar:ink(k.root,'',2.6),las:el('path',{d:'',fill:'none',stroke:REDV,'stroke-width':.6,'stroke-dasharray':'5 3'},k.glow),dot:el('circle',{r:1.3,fill:REDV},k.root),i};});
  const hero=actor(k.root,EXB,0,GR+2,1,S,STAND);hero.w.x=384-STAND.speed*S*2.2;
  return(t,dt)=>{cam(t);const o=es(t,.4,2.4);leaves.forEach((n,i)=>{const sg=i?1:-1,w=64*(1-o*.86),x0=DX+sg*64,x1=x0-sg*w;n.setAttribute('d',Lp([[x0,GR+3],[x0,96],[x1,96+o*9],[x1,GR+3+o*6]],true));lk[i].setAttribute('d',`M${f(x0-sg*w*.5)} ${f(110)}L${f(x0-sg*w*.5)} ${f(GR-8)}M${f(x1+sg*5)} 196l0 14`);});
   op(dgl,o*(.5+.1*Math.sin(t*9)));smoke(t,-2,o*.9);
   scr.forEach((q,i)=>{const u=((t*.9+q.ph)%1),r0=30+u*q.L,jit=6;let d='';for(let j=0;j<6;j++){const r=r0+j*9,a=q.a+(j%2?.05:-.05)+Math.sin(t*13+i+j)*.012;d+=(j?'L':'M')+f(DX+Math.cos(a)*r)+' '+f(200-Math.sin(a)*r*.7+(j%2?jit:-jit)*.5);}q.n.setAttribute('d',d);op(q.n,o*Math.sin(Math.PI*u)*.8*(1-.6*es(t,10.6,12)));});
   const back=es(t,10.5,11.3),reachA=es(t,12.6,13.6)*(1-es(t,14.2,15.8));hero.up(t,dt,smooth(3.1,3.4,t)*(1-smooth(5.3,5.8,t)),{farHand:reachA>.01?[lerp(44,66,reachA),lerp(80,58,reachA)]:null,headDrop:1.4*es(t,14.4,16),lean:3*reachA,swordAng:20});
   if(t>=5.8)hero.w.x=384-38*back;const ch=hero.at(41,56),aim=1-es(t,10.7,12.4);
   tur.forEach(q=>{const on=es(t,5.9+q.i*.07,6.7+q.i*.07)*aim,ta=Math.atan2(ch[1]-q.py,ch[0]-q.px);let da=ta-q.idle;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;const a=q.idle+da*on+Math.sin(t*1.3+q.i)*.06*(1-on),mx=q.px+Math.cos(a)*17,my=q.py+Math.sin(a)*17;
    q.bar.setAttribute('d',`M${f(q.px)} ${f(q.py)}L${f(mx)} ${f(my)}`);q.las.setAttribute('d',`M${f(mx)} ${f(my)}L${pt(ch)}`);op(q.las,on*.8);setA(q.dot,{cx:q.px,cy:q.py});op(q.dot,.3+.7*on);});}}});
// ───────── u205 관리자 권한 ─────────
A.add({zone:'u205',paper:'#14181d',ink:'#d8e0e8',sky:[[0,'#090c10'],[0.55,'#192129'],[1,'#0f1318']],line:'rgba(240,210,130,.42)',D:16,
 subs:[[0.9,5.0,'축귀 시스템의 출력을 높이자 통제자의 윤곽이 오히려 더 또렷해졌다.'],[5.8,10.0,'기도와 묵상으로 모은 힘까지 고스란히 그의 쪽으로 흘러들고 있었던 듯하였다.'],[10.8,15.4,'출력을 더 높이지 않고 파장의 흐름을 따라가, 어느 회로를 통해 그에게 힘이 닿고 있는지 확인했다.']],
 build(k){const R=seeded(2205),GR=298,S=1.1,TX=474,CORE=[TX,GR-152];
  const cam=k.track([[0,250,206,1.4],[5.0,360,186,1.12],[10.4,340,190,1.15],[10.9,200,292,2.7],[12.6,TX-20,296,2.7],[15.4,TX,GR-150,2.3],[16,TX,GR-152,2.4]]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(k.root,16,R,GR+26,356);
  // 통제자의 윤곽(각진 선, 속의 회로)
  const OUT=[[TX-30,GR+3],[TX-34,GR-90],[TX-58,GR-96],[TX-70,GR-180],[TX-52,GR-206],[TX-22,GR-212],[TX-20,GR-232],[TX-12,GR-250],[TX+12,GR-250],[TX+20,GR-232],[TX+22,GR-212],[TX+52,GR-206],[TX+70,GR-180],[TX+58,GR-96],[TX+34,GR-90],[TX+30,GR+3]];
  const og=grp(k.back),outline=ink(og,Lp(OUT)+`M${TX-6} ${GR+3}L${TX-4} ${GR-86}L${TX+4} ${GR-86}L${TX+6} ${GR+3}`,1.4),inner=ink(og,'',.5);
  let ind='';for(let i=0;i<14;i++){const x=TX+R(-44,44),y=GR-R(100,200),dx=R(8,24)*(R(0,1)<.5?-1:1),dy=R(8,22)*(R(0,1)<.5?-1:1);ind+=`M${f(x)} ${f(y)}l${f(dx)} 0l0 ${f(dy)}`;}inner.setAttribute('d',ind+`M${TX-8} ${GR-238}L${TX+8} ${GR-238}`);
  const core=el('circle',{cx:CORE[0],cy:CORE[1],r:5,fill:'none',stroke:AMB,'stroke-width':1},k.root),cgl=k.glowAt(CORE[0],CORE[1],50,AMB),ogl=k.glowAt(TX,GR-130,170,'#6f8fb0',k.far);
  // 바닥에서 통제자 속으로 이어지는 회로
  const TR=[0,1,2,3,4].map(i=>{const y=GR+9+i*5,x1=TX-26+i*13,y1=GR-96-i*8,d=`M176 ${y}L${x1} ${y}L${x1} ${f(y1)}L${f(lerp(x1,CORE[0],.6))} ${f(y1)}L${f(lerp(x1,CORE[0],.6))} ${f(lerp(y1,CORE[1],.8))}L${CORE[0]} ${CORE[1]}`;
   return{base:ink(k.root,d,i===2?1.1:.6,{opacity:.6}),flow:el('path',{d,fill:'none',stroke:AMB,'stroke-width':i===2?1.6:1,'stroke-linecap':'round','stroke-dasharray':'4 20'},k.root),i};});
  const hero=actor(k.root,EXB,150,GR+2,1,S,STAND),sg=k.glowAt(0,0,20,AMB),ring=el('circle',{r:8,fill:'none',stroke:AMB,'stroke-width':.8},k.root);
  return(t,dt)=>{cam(t);const pw=es(t,.8,4.4)*(1-.35*es(t,9.6,10.8)),clear=es(t,1.4,4.8),flow=es(t,5.6,7.2),fol=es(t,10.8,12);
   op(og,.1+.85*clear);outline.setAttribute('stroke-width',f(.8+1.1*clear));op(ogl,.15+.4*clear);
   hero.up(t,dt,0,{farHand:[lerp(44,58,pw),lerp(80,50,pw)],swordAng:16,headDrop:-.6*pw+1.4*fol,lean:-2*pw+4*fol});const hp=hero.at(hero.st.handF[0],hero.st.handF[1]);
   setA(sg,{cx:hp[0],cy:hp[1],r:14+26*pw+2*Math.sin(t*7)});op(sg,.3+.6*pw);setA(ring,{cx:hp[0],cy:hp[1],r:6+((t*1.4)%1)*22*pw});op(ring,pw*(1-((t*1.4)%1)));
   TR.forEach(q=>{q.flow.setAttribute('stroke-dashoffset',f(-t*(50+30*pw)-q.i*11));const hi=q.i===2?1:1-.75*fol;op(q.flow,flow*hi);op(q.base,(.25+.4*flow)*hi);});
   setA(core,{r:5+3*flow+Math.sin(t*5)});op(cgl,.2+.6*flow);}}});
// ───────── u206 중앙 코어 이주실 ─────────
A.add({zone:'u206',paper:'#15181c',ink:'#dce1e6',sky:[[0,'#0a0c0f'],[0.55,'#1b2027'],[1,'#101317']],line:'rgba(190,215,235,.42)',D:17,
 subs:[[0.9,4.6,'이주실 중앙에는 아무도 들어 있지 않은 기계 육체가 놓여 있었다.'],[5.6,8.8,'나는 기계 몸통을 부수려다가 쥐고 있던 검을 내렸다.'],[9.8,14.0,'기계 육체로 이어지는 통로만 열려 있었고, 그 밖의 방향은 모두 강철 벽으로 막혀 있었다.'],[14.6,16.8,'나는 다시 중앙의 텅 빈 기계 몸 앞에 섰다.']],
 build(k){const R=seeded(2206),GR=296,S=1.1,BX=420,COLD='#cfe6f2';
  const cam=k.track([[0,330,204,1.3],[4.8,BX,186,2.2],[5.3,318,206,1.9,'cut'],[9.2,326,204,2.0],[9.6,330,190,1.0,'cut'],[14.2,340,194,1.08],[14.6,372,200,1.6],[17,392,196,1.9]]),dip=dipper(k,[5.3,9.6]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);ink(k.root,'M-90 50L730 50',.5,{opacity:.6});scratches(k.root,18,R,GR+12,356);
  for(let i=0;i<8;i++){const x=-60+i*104;ink(k.back,`M${x} 50L${x} ${GR+3}`,.4,{opacity:.4});}
  const path=el('path',{d:Lp([[150,GR+5],[BX-40,GR+5],[BX-40,GR+13],[150,GR+13]],true),fill:AMB,opacity:0},k.glow);
  // 받침과 빈 기계 육체
  sh(k.root,Lp([[BX-52,GR+3],[BX-44,GR-8],[BX+44,GR-8],[BX+52,GR+3]],true),1);sh(k.root,Lp([[BX-34,GR-8],[BX-28,GR-16],[BX+28,GR-16],[BX+34,GR-8]],true),.9);
  for(let i=0;i<5;i++){const x0=BX+R(-90,90);ink(k.root,`M${f(x0)} 50Q${f((x0+BX)/2+R(-20,20))} ${f(R(96,130))} ${f(BX+R(-14,14))} ${GR-104}`,.6,{opacity:.7});}
  ink(k.root,`M${BX-38} ${GR-16}Q${BX-50} ${GR-70} ${BX-30} ${GR-112}M${BX+38} ${GR-16}Q${BX+50} ${GR-70} ${BX+30} ${GR-112}`,1.3);
  const body=grp(k.root,{transform:`translate(${BX} ${GR-16})`});
  [-1,1].forEach(s=>{sh(body,Lp([[s*4,-40],[s*13,-40],[s*12,-2],[s*5,-2]],true),.9);ink(body,`M${s*4.6} -20L${s*12.4} -20`,.5);sh(body,Lp([[s*16,-76],[s*23,-74],[s*22,-44],[s*17,-44]],true),.8);});
  sh(body,Lp([[-16,-80],[16,-80],[14,-40],[-14,-40]],true),1.1);dark(body,Lp([[-9,-73],[9,-73],[8,-50],[-8,-50]],true),'#040506',.7);ink(body,'M-9 -66L-3 -66M3 -58L9 -58M0 -73L0 -68',.4,{opacity:.6});
  sh(body,'M-10 -102Q-10 -108 -4 -108L4 -108Q10 -108 10 -102L10 -88Q10 -84 5 -84L-5 -84Q-10 -84 -10 -88Z',1);dark(body,Lp([[-7,-100],[7,-100],[7,-94],[-7,-94]],true),'#040506',.5);ink(body,'M-3 -84L-3 -80M3 -84L3 -80',.8);
  const bgl=k.glowAt(BX,GR-80,70,COLD);
  // 내려와 막는 강철 벽
  const walls=[[-90,150,9.9],[590,730,10.5]].map(([x0,x1,t0])=>({x0,x1,t0,body:dark(k.root,'','#262e36',1.2),ln:ink(k.root,'',.4,{opacity:.55})})),shut=[190,270,350,510].map((x,i)=>({x,t0:11.1+i*.22,n:dark(k.back,'','#1f262d',.8)}));
  const hero=actor(k.root,EXB,0,GR+2,1,S,STAND);hero.w.x=300-STAND.speed*S*1.9;
  return(t,dt)=>{cam(t);dip(t);const raise=es(t,5.7,6.5),low=es(t,7.2,8.5),w2=smooth(14.5,14.8,t)*(1-smooth(15.5,16,t));
   hero.up(t,dt,smooth(.3,.6,t)*(1-smooth(2.1,2.6,t))+w2*.75,{swordAng:lerp(lerp(22,160,raise),18,low),nearHand:raise>.01&&low<1?[lerp(lerp(48,54,raise),48,low),lerp(lerp(80,38,raise),80,low)]:null,farHand:raise>.01&&low<1?[lerp(lerp(44,50,raise),44,low),lerp(lerp(80,42,raise),80,low)]:null,lean:-5*raise*(1-low),headDrop:1.6*low+.8*es(t,15.8,16.6),headTurn:t>9.6&&t<14.4?Math.sin((t-9.6)*1.3)*1.2:0});
   op(bgl,.3+.1*Math.sin(t*2.4));op(path,.22*es(t,11.6,13));
   walls.forEach(w=>{const u=minJerk(seg(t,w.t0,w.t0+.7)),bot=lerp(40,GR+3,u);w.body.setAttribute('d',u>0?Lp([[w.x0,40],[w.x1,40],[w.x1,bot],[w.x0,bot]],true):'');let d='';if(u>0)for(let y=bot-24;y>50;y-=34)d+=`M${w.x0} ${f(y)}L${w.x1} ${f(y)}`;w.ln.setAttribute('d',d);});
   shut.forEach(q=>{const u=minJerk(seg(t,q.t0,q.t0+.6)),bot=lerp(50,GR+3,u);q.n.setAttribute('d',u>0?Lp([[q.x,50],[q.x+72,50],[q.x+72,bot],[q.x,bot]],true):'');});}}});
// ───────── u203 기억의 문 ─────────
A.add({zone:'u203',paper:'#17171c',ink:'#dedde6',sky:[[0,'#0b0b0f'],[0.55,'#1f1e28'],[1,'#121117']],line:'rgba(215,190,240,.42)',D:16.5,
 subs:[[0.9,3.5,'통제자가 기억의 문에 직접 빙의했다.'],[4.1,9.3,'거대한 문이 몸을 일으켜 기계 괴물로 변했고, 아이가 받았던 상처가 그 몸을 감싼 두꺼운 갑옷이 되었다.'],[9.9,13.3,'구하려는 마음으로 검에 힘을 줄 때마다 갑옷이 한 겹씩 더 덧대어지곤 하였다.'],[13.7,16.0,'나는 검 자루를 세게 쥐었다가 천천히 힘을 풀었다.']],
 build(k){const R=seeded(2203),GR=298,S=1.1,MX=452,VIO='#b79cff',ST='#262b34';
  const cam=k.track([[0,430,196,1.3],[3.6,MX,188,1.55],[4.1,400,194,1.18],[9.3,380,166,1.03],[9.8,232,216,2.1,'cut'],[11.4,310,194,1.25],[13.4,332,186,1.16],[16.5,256,208,1.8]]),dip=dipper(k,[9.8]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(k.root,22,R,GR+10,356);const vg=k.glowAt(MX,GR-110,120,VIO);
  const M=grp(k.root),legs=[-1,1].map(()=>dark(M,'',ST,1.1)),arms=[-1,1].map(()=>dark(M,'',ST,1.1)),layers=[3,2,1].map(i=>({i,n:ink(M,'',1)}));
  const slab=dark(M,Lp([[-52,0],[-52,-190],[52,-190],[52,0]],true),'#1b2028',1.5);ink(M,'M0 -190L0 0M-44 -180L-8 -180L-8 -10L-44 -10ZM8 -180L44 -180L44 -10L8 -10Z',.6,{opacity:.7});ink(M,'M-4 -96l-6 0M4 -96l6 0',1.4);
  const visor=el('path',{d:'M-30 -206L30 -206L24 -194L-24 -194Z',fill:'#07080b',stroke:INK,'stroke-width':1},M),eye=el('path',{d:'M-18 -200L18 -200',fill:'none',stroke:VIO,'stroke-width':2.2,'stroke-linecap':'round'},M);
  const PL=[[-38,-160,26,34],[14,-166,30,30],[-42,-116,34,40],[10,-124,34,44],[-36,-66,30,46],[12,-70,32,50],[-16,-188,32,16],[-50,-30,24,26],[28,-22,24,22]].map(([x,y,w,h],i)=>{const g=grp(M);dark(g,Lp([[x,y],[x+w,y+R(-2,2)],[x+w+R(-2,2),y+h],[x+R(-2,2),y+h]],true),'#343b47',1);
   let d='';for(let j=0;j<3;j++){const sx=x+R(3,w-8),sy=y+R(4,h-10);d+=`M${f(sx)} ${f(sy)}l${f(R(4,10))} ${f(R(4,12))}`;}ink(g,d,.6,{opacity:.85});return{g,fx:R(-240,240),fy:R(-260,-120),t0:5.6+i*.36};});
  const hero=actor(k.root,EXB,186,GR+2,1,S,STAND),hg=k.glowAt(0,0,14,AMB);
  return(t,dt)=>{cam(t);dip(t);const poss=es(t,.8,3.2),up=minJerk(seg(t,4.2,6.4)),lift=58*up,arm=es(t,5,7);
   M.setAttribute('transform',`translate(${f(MX+wobble(t*1.3,1)*2*up)} ${f(GR+3-lift)})`);op(vg,.15+.5*poss+.1*Math.sin(t*5));op(eye,poss*(.7+.3*Math.sin(t*8)));op(visor,poss);
   legs.forEach((n,i)=>{const sg=i?1:-1,hip=[sg*30,-6],foot=[sg*(34+26*up),lift],kn=[sg*(52+10*up),lift*.45-10*up];n.setAttribute('d',up>.02?Lp(band2([hip,kn,foot],20,13),true)+`M${f(foot[0]-12)} ${f(lift)}L${f(foot[0]+12)} ${f(lift)}L${f(foot[0]+8)} ${f(lift-7)}L${f(foot[0]-8)} ${f(lift-7)}Z`:'');});
   arms.forEach((n,i)=>{const sg=i?1:-1,sh0=[sg*52,-150],sw=Math.sin(t*1.6+i*2)*6*arm,el0=[sg*(52+38*arm),-150+44*arm],hd=[sg*(52+46*arm)+sw,-150+112*arm];n.setAttribute('d',arm>.02?Lp(band2([sh0,el0,hd],16,22),true)+`M${P(hd,-8,8)}l-3 12M${P(hd,0,10)}l0 13M${P(hd,8,8)}l3 12`:'');});
   PL.forEach(q=>{const u=minJerk(seg(t,q.t0,q.t0+.7));q.g.setAttribute('transform',`translate(${f(q.fx*(1-u))} ${f(q.fy*(1-u))}) rotate(${f((1-u)*90)})`);op(q.g,u>0?1:0);});
   layers.forEach(L=>{const o=es(t,9.4+L.i*1.0,9.9+L.i*1.0),e=5*L.i;L.n.setAttribute('d',Lp([[-52-e,0],[-52-e,-190-e],[52+e,-190-e],[52+e,0]],true));op(L.n,o*.8);L.n.setAttribute('stroke-width',f(1+.5*(1-es(t,10.2+L.i,11+L.i))*o*3));});
   const pulse=t>10&&t<13.4?Math.max(0,Math.sin((t-10.15)*Math.PI))**4:0,grip=es(t,10,10.5)*(1-es(t,14,15.6));
   hero.w.x=186-22*es(t,6,8);hero.up(t,dt,0,{swordAng:lerp(24,112,grip),nearHand:[lerp(48,57,grip),lerp(80,64,grip)],farHand:grip>.3?[lerp(44,54,grip),lerp(80,67,grip)]:null,legPts:crouch(5*grip),drop:5*grip,lean:3*grip,headDrop:1.2*es(t,14,15.6)});
   const hp=hero.at(hero.st.handN[0],hero.st.handN[1]);setA(hg,{cx:hp[0],cy:hp[1],r:10+22*pulse});op(hg,.2*grip+.7*pulse);}}});
})();
