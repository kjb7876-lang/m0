// R884 — 선화 컷씬 장면 넷째 묶음(5부 카이로노미콘 kair01~kair10). 재생기 lineart-cine-r880.js, 도우미는 lineart-scenes-r881.js 가 내준 __STORYWORLD_LINEART_SK_R881__.
// 사용자 2026-11-12 "시네마틱 없는구간에 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게".
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다. 십자로 읽히는 모양은 쓰지 않는다(비석은 둥근 돌판, 시곗바늘은 한 줄).
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__,SK=window.__STORYWORLD_LINEART_SK_R881__;if(!A||!SK||window.__STORYWORLD_LINEART_SCENES_R884__)return;window.__STORYWORLD_LINEART_SCENES_R884__='R884-scenes-4';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,flame,motes}=A.kit;
const {STAND,SHUF,RUN,ground,vis,op,dipper,scratches,actor,crouch,fogBand,spark,dark}=SK;
const P=(c,x,y)=>`${f(c[0]+x)} ${f(c[1]+y)}`;
const AMB='#f2cf7a',TEAL='#8ff0e0',VIO='#b79cff',REDV='#ff5a48',SANDC='#050505';
// 5부 바탕(놋쇠빛 종이 — 검은 모래가 보이게 중간 밝기)
const BRASS={paper:'#241d14',ink:'#ecdfc4',sky:[[0,'#15110b'],[0.55,'#352b1c'],[1,'#1d170f']],line:'rgba(240,205,130,.42)'};
// 윤서하: 아카데미움 제복, 청록 망토, 시간검
const BOB=(c,hair,hat,line)=>{hair.setAttribute('d',`M${P(c,3.8,-1.4)}Q${P(c,4.6,-5.8)} ${P(c,0,-6)}Q${P(c,-5.6,-5.8)} ${P(c,-5.2,1)}L${P(c,-4.8,5.4)}L${P(c,-2,5)}Q${P(c,-2.6,1)} ${P(c,-1.2,-1.4)}Q${P(c,1,-3.2)} ${P(c,3.8,-1.4)}Z`);hat.setAttribute('d','');line.setAttribute('d','');};
const HOOD=(c,hair,hat,line)=>{hair.setAttribute('d','');hat.setAttribute('d',`M${P(c,-5.6,5)}Q${P(c,-7,-5)} ${P(c,-1,-9.5)}Q${P(c,4,-8)} ${P(c,5,-2)}L${P(c,3.6,-1.4)}Q${P(c,0,-4.4)} ${P(c,-2.4,0)}L${P(c,-2,5.4)}Z`);line.setAttribute('d','');};
const SEOHA={robe:'uniform',robeFill:'#27405a',legs:'#1c2530',cape:'#2f8f86',hat:BOB,sword:TEAL,belt:1,seed:6};
const STUD={robe:'uniform',robeFill:'#3a3327',legs:'#221d15',hat:HATS.doctor};
const RAID={robe:'coat',robeFill:'#120e09',legs:'#0c0906',hat:HOOD,hatFill:'#120e09',sword:'#b9a27a',swordLen:30};
// 검은 모래 줄기: fn(u 0..1, 흩어짐 -1..1, t) → [x,y]
function sand(parent,n,R,fn,o={}){const g=grp(parent),arr=[];for(let i=0;i<n;i++)arr.push({n:el('circle',{r:f(R(o.r0||1,o.r1||2.1)),fill:'#000',stroke:'#e6d9b4','stroke-width':.3,'stroke-opacity':.75},g),ph:R(0,1),sp:R(.7,1.3),off:R(-1,1)});
 return(t,a=1,speed=.25)=>{op(g,a);if(a<=0)return;for(const q of arr){const u=((t*speed*q.sp+q.ph)%1+1)%1,p=fn(u,q.off,t);setA(q.n,{cx:p[0],cy:p[1]});}};}
const heap=(p,x,y,w,h)=>{const g=grp(p);el('path',{d:`M${f(x-w)} ${f(y)}Q${f(x-w*.3)} ${f(y-h*1.5)} ${f(x)} ${f(y-h)}Q${f(x+w*.4)} ${f(y-h*1.1)} ${f(x+w)} ${f(y)}Z`,fill:SANDC,stroke:'#cbbf9f','stroke-width':.4,'stroke-opacity':.5},g);return g;};
// 수문장(아르콘): 긴 옷, 두건, 바늘 하나짜리 시계 얼굴, 지팡이. 발밑이 원점.
function warden(p,x,y,s,o={}){const g=grp(p,{transform:`translate(${f(x)} ${f(y)}) scale(${f(s)})`}),F=o.fill||'#17130d';
 dark(g,'M-17 0L-13 -62Q-14 -74 -6 -78L6 -78Q14 -74 13 -62L17 0Z',F,1);ink(g,'M-9 -60L-11 0M9 -60L11 0M-12 -40L12 -40',.4,{opacity:.5});dark(g,'M-12 -74Q-13 -97 0 -99Q13 -97 12 -74Z',F,1);
 el('circle',{cx:0,cy:-85,r:7,fill:'#0a0806',stroke:INK,'stroke-width':.8},g);const hand=ink(g,'',.9),eye=el('circle',{cx:0,cy:-85,r:1.3,fill:o.eye||AMB},g),staff=grp(g);ink(staff,'M22 0L22 -106',1.4);el('circle',{cx:22,cy:-110,r:3.6,fill:'none',stroke:INK,'stroke-width':.9},staff);
 return{g,eye,staff,x,y,s,up(t,sp=1){const a=t*sp+(o.ph||0);hand.setAttribute('d',`M0 -85L${f(Math.sin(a)*5.6)} ${f(-85-Math.cos(a)*5.6)}`);}};}
// 명령문(읽을 수 없는 글줄)
function cmdText(p,x,y,w,n,R,col){const L=[];for(let i=0;i<n;i++){let d='',xx=x;const end=x+w*R(.6,1);while(xx<end){const l=R(4,13);d+=`M${f(xx)} ${f(y+i*7)}l${f(l)} 0`;xx+=l+R(2.5,4);}L.push(el('path',{d,fill:'none',stroke:col,'stroke-width':1.2,'stroke-linecap':'round'},p));}return L;}
// 최초명령 코어: 어두운 구, 도는 고리 셋, 안쪽 명령문
function core(p,k,cx,cy,r,col){const gl=k.glowAt(cx,cy,r*2.6,col),g=grp(p);dark(g,ell(cx,cy,r,r),'#0b0906',1.4);ink(g,ell(cx,cy,r*.74,r*.74),.5,{opacity:.55});
 const tx=grp(g);cmdText(tx,cx-r*.5,cy-r*.36,r,6,seeded(77),col);const rings=[0,1,2].map(i=>el('ellipse',{cx,cy,rx:f(r*1.34),ry:f(r*(.3+i*.12)),fill:'none',stroke:col,'stroke-width':1,opacity:.85},g));
 return{g,gl,tx,rings,up(t,sp=1){rings.forEach((n,i)=>n.setAttribute('transform',`rotate(${f(t*sp*(13+i*8)*(i%2?-1:1)+i*58)} ${cx} ${cy})`));}};}
const arch=(p,x,GR,w,h,fill='#050403')=>dark(p,`M${f(x-w)} ${f(GR+3)}L${f(x-w)} ${f(GR-h+w)}Q${f(x-w)} ${f(GR-h)} ${f(x)} ${f(GR-h)}Q${f(x+w)} ${f(GR-h)} ${f(x+w)} ${f(GR-h+w)}L${f(x+w)} ${f(GR+3)}Z`,fill,1.3);
const bez=(a,c,b,u)=>[(1-u)*(1-u)*a[0]+2*u*(1-u)*c[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*u*(1-u)*c[1]+u*u*b[1]];
const floorL=(p,GR,R,n=20)=>{ink(p,`M-90 ${GR+3}L730 ${GR+3}`,1);scratches(p,n,R,GR+10,356);};
// ───────── kair01 최초명령의 세계 ─────────
A.add(Object.assign({zone:'kair01',D:17.5,
 subs:[[0.8,4.6,'한 가지 다른 점이 있다면 내 눈에만 ‘검은 모래’가 보인다는 사실이었다.'],[5.4,9.2,'입학식 날, 대학의 심장부인 최초명령 코어에 검은 모래가 끼어 있는 것을 발견했다.'],[9.9,12.6,'모래가 흘러드는 틈을 찾으려던 순간 적들의 기습이 시작되었다.'],[13.3,16.6,'침공은 무려 여섯 차례나 이어지고 있었다.']],
 build(k){const R=seeded(5101),GR=292,S=1.1,CX=236,CY=178,W0=10.5,WP=1.0;
  const cam=k.track([[0,262,200,1.25],[5,300,232,1.85],[5.3,290,196,1.3,'cut'],[9.5,300,214,1.75],[9.8,360,196,1.12,'cut'],[13,372,198,1.2],[17.5,366,196,1.32]]),dip=dipper(k,[5.3,9.8]);
  floorL(k.root,GR,R,24);
  // A 아카데미움 복도
  const SA=grp(k.root),BK=grp(SA,{opacity:.6});for(let i=0;i<7;i++){const x=-40+i*118;sh(BK,Lp([[x,GR+3],[x,70],[x+20,70],[x+20,GR+3]],true),.8);ink(BK,`M${x+20} 96Q${x+69} 44 ${x+118} 96`,.8);}
  const studs=[[-60,.86],[30,.9],[140,.84],[-150,.9],[410,.86]].map(([x,s],i)=>actor(BK,Object.assign({seed:i+1},STUD),x,GR-4,1,s,STAND));
  const hp=heap(SA,318,GR+3,26,9),tr=sand(SA,16,R,(u,o)=>[318+o*18+u*10,GR-2-Math.abs(o)*2-Math.sin(u*3.14)*5],{r0:.5,r1:1.1});
  const hero=actor(k.root,SEOHA,0,GR+2,1,S,STAND);hero.w.x=262-STAND.speed*S*1.6;
  // B 코어
  const SB=grp(k.root);dark(SB,Lp([[CX-46,GR+3],[CX-30,CY+64],[CX+30,CY+64],[CX+46,GR+3]],true),'#17130d',1.2);const co=core(SB,k,CX,CY,56,TEAL);
  el('path',{d:`M${CX+14} ${CY+54}Q${CX+52} ${CY+44} ${CX+56} ${CY}Q${CX+34} ${CY+22} ${CX+14} ${CY+54}Z`,fill:SANDC,stroke:'#d8ccab','stroke-width':.8},SB);
  const fl=sand(SB,40,R,(u,o)=>{const p=bez([700,60],[470,90],[CX+50,CY+26],u);return[p[0]+o*5*(1-u),p[1]+o*4*(1-u)];});
  const lamps=[0,1,2,3,4,5].map(i=>el('circle',{cx:CX-25+i*10,cy:GR-10,r:2.4,fill:'#0a0806',stroke:INK,'stroke-width':.6},SB));
  const raid=[0,1,2,3,4].map(i=>actor(SB,Object.assign({seed:i+4},RAID),760,GR+2+(i%2)*2,-1,S*(.96+.03*(i%3)),RUN)),sp=spark(SB,'#dffcf6',5);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.3,c=t>=9.8;vis(SA,a);vis(SB,!a);co.up(t,1);op(co.gl,a?0:.5+.08*Math.sin(t*3));
   if(a){studs.forEach(s=>s.up(t,dt,1,{}));tr(t,1,.2);hero.w.dir=1;hero.up(t,dt,t<1.6?1:0,{headDrop:2.6*es(t,1.6,2.6),lean:5*es(t,2.2,3.4)});}
   else{fl(t,1,.22);const w=Math.floor((t-W0)/WP),u=(t-W0)/WP-w,on=c&&t>=W0&&w<6;
    if(!c){hero.w.x=330;hero.w.dir=-1;hero.up(t,dt,0,{headDrop:1.4,lean:6,nearHand:[60,lerp(80,60,es(t,6.4,7.6))]});}
    else{hero.w.x=322;hero.w.dir=1;const dr=es(t,9.9,10.4),sl=on?es(u,.4,.52)*(1-es(u,.7,.95)):0;hero.up(t,dt,0,{swordAng:lerp(lerp(20,140,dr),52,sl),nearHand:[lerp(52,62,sl),lerp(lerp(80,44,dr),60,sl)],lean:8*sl-2,legPts:crouch(4),drop:4,capeKick:-5*sl});}
    raid.forEach((r,i)=>{const tx=392+i*34;if(!on){r.w.x=780;r.up(t,dt,0,{});r.g.setAttribute('opacity',0);return;}const run=es(u,0,.42),bk=es(u,.52,.9);r.w.x=lerp(760+i*20,tx,run)+bk*46;r.up(t,dt,u<.42?1:0,{swordAng:lerp(120,60,es(u,.3,.45)),lean:u<.42?10:-24*bk,headDrop:2*bk});r.g.setAttribute('opacity',f(1-es(u,.72,.95)));});
    sp(372,GR-58,on?seg(u,.46,.8):0,34);lamps.forEach((n,i)=>n.setAttribute('fill',c&&t>=W0+(i+.55)*WP?AMB:'#0a0806'));}};}},BRASS));
// ───────── kair04 예순여섯 수문장 ─────────
A.add(Object.assign({zone:'kair04',D:16,
 subs:[[0.8,4.4,'학교 밖 금역의 관문에는 층마다 거대한 수문장이 서 있었다.'],[5.2,9.0,'첫 번째 관문 앞에서 나는 한 사람이 그 판정을 받는 광경을 목격했다.'],[9.8,15.0,'당사자가 놓지 않으려 발버둥 쳐도 시간은 검은 모래가 되어 관문 쪽으로 빨려 들어가고 있었다.']],
 build(k){const R=seeded(5104),GR=292,S=1.1,GX=520;
  const cam=k.track([[0,330,236,1.2],[4.8,330,60,1.2],[5.1,350,196,1.15,'cut'],[9.4,360,194,1.25],[15,372,198,1.4],[16,374,198,1.42]]),dip=dipper(k,[5.1]);
  const SA=grp(k.root),SB=grp(k.root),ws=[];
  for(let j=3;j>=0;j--){const y=GR-j*118,s=1-j*.1;ink(SA,`M${90+j*26} ${y+3}L${570-j*26} ${y+3}`,1.2);ink(SA,`M${90+j*26} ${y+3}L${90+j*26} ${y+12}M${570-j*26} ${y+3}L${570-j*26} ${y+12}`,.8);arch(SA,330,y,34*s,92*s);
   [-1,1].forEach(d=>ws.push(warden(SA,330+d*92*s-11*s,y+2,.86*s,{ph:j+d})));scratches(SA,6,R,y+6,y+14,110,550);}
  floorL(SB,GR,R,22);arch(SB,GX+40,GR,62,214);ink(SB,`M${GX-40} ${GR+3}L${GX-40} 50M${GX+120} ${GR+3}L${GX+120} 50`,1.6);
  const W=warden(SB,GX-2,GR+2,1.7,{}),st=sand(SB,70,R,(u,o)=>{const p=bez([388,GR-64],[450,GR-150],[GX+44,GR-96],u);return[p[0]+o*7*Math.sin(u*3.14),p[1]+o*6*Math.sin(u*3.14)];});
  const man=actor(SB,{robe:'coat',robeFill:'#8a8273',legs:'#4d473c',hat:HATS.villager,seed:2},372,GR+2,1,S,STAND),hero=actor(SB,SEOHA,176,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const b=t>=5.1;vis(SA,!b);vis(SB,b);ws.forEach(w=>w.up(t,.8));if(!b)return;
   const j=es(t,8.4,9.6),pull=es(t,9.6,10.6),fall=es(t,12.6,14);W.up(t,1+10*j);W.eye.setAttribute('fill',j>.5?REDV:AMB);W.staff.setAttribute('transform',`rotate(${f(-7*j)} 22 0)`);st(t,pull,.42);
   const wb=wobble(t*3,1.3)*pull*(1-fall);man.up(t,dt,0,{lean:lerp(0,-12,pull)*(1-fall)+wb*3+16*fall,nearHand:pull>0?[lerp(60,66,pull)+wb*2,lerp(80,58,pull)+18*fall]:null,farHand:pull>0?[lerp(30,58,pull)-wb*2,lerp(80,62,pull)+16*fall]:null,legPts:fall>0?crouch(30*fall):null,drop:30*fall,headDrop:3*fall});
   hero.up(t,dt,0,{swordAng:lerp(lerp(20,96,es(t,10.4,11.4)),64,es(t,13.6,15)),nearHand:[lerp(50,60,es(t,10.4,11.4)),lerp(80,56,es(t,10.4,11.4))],lean:4*pull,headTurn:0});}}},BRASS));
// ───────── kair05 빼앗긴 시간 ─────────
A.add(Object.assign({zone:'kair05',D:16,
 subs:[[0.8,3.8,'아래층을 지키는 일반 수문장은 마흔여덟이었다.'],[4.6,9.4,'관문마다 내리는 지시는 달랐으나 빠져나온 모래는 전부 같은 방향으로 흘러가고 있었다.'],[10.2,15.2,'나는 허공에 떠오르는 새 명령문을 읽으면서도 발아래의 모래 흐름을 번갈아 살폈다.']],
 build(k){const R=seeded(5105),GR=292,S=1.1,COL=[AMB,VIO,TEAL];
  const cam=k.track([[0,330,206,1.05],[4.2,330,188,1.5],[4.5,300,200,1.08,'cut'],[9.6,350,204,1.2],[10,232,214,2.0,'cut'],[16,240,210,2.2]]),dip=dipper(k,[4.5,10]);
  const SA=grp(k.root),SB=grp(k.root),ws=[];
  for(let i=11;i>=0;i--){const q=Math.pow(.8,i),y=150+190*q;ink(SA,`M${f(330-300*q)} ${f(y)}L${f(330+300*q)} ${f(y)}`,.5,{opacity:.5});[-1,1].forEach(d=>{const g=grp(SA,{opacity:f(.35+.65*q)});ws.push(warden(g,330+d*250*q-18*q*d,y,1.5*q,{ph:i*1.3+d}));});}
  ink(SA,'M30 340L330 150L630 340',.6,{opacity:.5});k.glowAt(330,150,120,'#5a4a2c',k.far);
  floorL(SB,GR,R,22);const gates=[120,330,540].map((x,i)=>{arch(SB,x,GR,30,150);const w=warden(SB,x+44,GR+2,.9,{ph:i*2,eye:COL[i]});ws.push(w);return{x,tx:cmdText(grp(SB,{opacity:.85}),x-26,96,56,3,R,COL[i])};});
  const tr=gates.map(g=>sand(SB,10,R,(u,o)=>[g.x+o*10+u*46,lerp(GR-40,GR+10,Math.sqrt(u))+o*2],{r0:.5,r1:1.2})),fl=sand(SB,90,R,(u,o)=>[lerp(-80,730,u),GR+7+o*4+Math.sin(u*20+o)*1.5]);
  const air=grp(k.root),lines=cmdText(air,196,146,78,5,R,AMB),hero=actor(k.root,SEOHA,0,GR+2,1,S,STAND);hero.w.x=226-STAND.speed*S*5.1;
  return(t,dt)=>{cam(t);dip(t);const a=t<4.5,c=t>=10;vis(SA,a);vis(SB,!a);vis(hero.g,!a);vis(air,c);ws.forEach(w=>w.up(t,.8));if(a)return;
   tr.forEach(f2=>f2(t,1,.5));fl(t,1,.11);lines.forEach((n,i)=>op(n,es(t,10.3+i*.5,10.9+i*.5)));
   const lk=c?.5+.5*Math.sin((t-10)*1.9-1.2):0;hero.up(t,dt,t>=4.5&&t<9.6?1:0,{headDrop:c?lerp(-1.6,2.8,lk):1.2,lean:c?lerp(-2,5,lk):0});}}},BRASS));
// ───────── kair06 닫힌 층의 명령 ─────────
A.add(Object.assign({zone:'kair06',D:16,
 subs:[[0.8,4.8,'다음 통로에서는 상급 수문장 열둘과 대수문장 여섯이 앞길을 가로막고 있었다.'],[5.6,9.6,'하나의 명령이 완전히 풀리기도 전에 다음 명령의 불이 들어오고 있었다.'],[10.4,14.8,'나는 그 교차점 사이에 남는 아주 짧은 공백을 기다려 단 한 발만 옮겼다.']],
 build(k){const R=seeded(5106),GR=292,S=1.1,COL=[AMB,VIO,REDV,TEAL],T0=12.2,HP=STAND.period/2;
  const cam=k.track([[0,330,190,1.05],[5,330,196,1.12],[5.4,330,270,2.3,'cut'],[9.8,318,272,2.5],[10.2,292,224,1.45,'cut'],[16,304,222,1.6]]),dip=dipper(k,[5.4,10.2]);
  floorL(k.root,GR,R,22);ink(k.back,'M-90 96L730 96',.6,{opacity:.5});
  const ws=[],FAR=grp(k.back,{opacity:.45}),MID=grp(k.back,{opacity:.8});for(let i=0;i<12;i++)ws.push(warden(FAR,40+i*52,GR-26,.82,{ph:i}));for(let i=0;i<6;i++)ws.push(warden(MID,70+i*100,GR-8,1.62,{ph:i*1.7,eye:COL[i%4]}));
  const zn=[];for(let i=0;i<8;i++){const x=110+i*62,c=COL[i%4];zn.push({i,x,e:el('ellipse',{cx:x,cy:GR+12,rx:54,ry:9,fill:c,stroke:c,'stroke-width':.8,'fill-opacity':.28},k.root),b:el('path',{d:`M${x-40} ${GR+10}L${x-22} ${GR-150}L${x+22} ${GR-150}L${x+40} ${GR+10}Z`,fill:c,opacity:0},k.glow)});}
  const hero=actor(k.root,SEOHA,270,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);ws.forEach(w=>w.up(t,1));
   zn.forEach(z=>{let b=clamp(.5+.9*Math.sin(t*1.5-z.i*1.9),0,1);const near=Math.abs(z.x-(hero.w.x+16))<70;if(near)b*=1-es(t,T0-.5,T0-.1)*(1-es(t,T0+HP+.2,T0+HP+.9));op(z.e,.12+.88*b);op(z.b,.16*b);});
   const go=t>=T0&&t<T0+HP?1:0;hero.up(t,dt,go,{headDrop:2.2*(1-es(t,T0+1.4,T0+2.4)),legPts:go?null:crouch(2.5),drop:go?0:2.5,swordAng:18});}}},BRASS));
// ───────── kair07 검은 공방 ─────────
A.add(Object.assign({zone:'kair07',D:17,
 subs:[[0.8,4.6,'공방 한가운데의 용광로 속으로 편지 한 통이 빨려 들어갔다.'],[5.2,7.6,'끝내 다 쓰지 못한 편지였다.'],[8.4,11.6,'그러나 그 불꽃에서는 어떠한 온기도 느껴지지 않았다.'],[12.4,16.2,'실패한 날과 가만히 쉬던 날이 똑같은 배관을 타고 용광로 속으로 흘러들고 있었다.']],
 build(k){const R=seeded(5107),GR=292,S=1.1,FX=478,COLD='#bfe9ef';
  const cam=k.track([[0,360,196,1.12],[4.8,400,200,1.3],[5,420,214,3.6,'cut'],[7.9,430,216,3.2],[8.1,420,214,1.7,'cut'],[11.8,432,216,1.9],[12.1,200,124,1.3,'cut'],[17,404,150,1.3]]),dip=dipper(k,[5,8.1,12.1]);
  floorL(k.root,GR,R,24);
  dark(k.root,`M${FX-100} ${GR+3}L${FX-108} 150Q${FX-108} 92 ${FX-48} 84L${FX+48} 84Q${FX+108} 92 ${FX+108} 150L${FX+100} ${GR+3}Z`,'#15110b',1.5);ink(k.root,`M${FX-104} 150L${FX+104} 150M${FX-90} 120l6 0M${FX+84} 120l6 0M${FX-60} 104l120 0`,.5,{opacity:.6});
  const gl=k.glowAt(FX,GR-50,130,COLD);dark(k.root,`M${FX-44} ${GR+3}L${FX-44} ${GR-70}Q${FX} ${GR-112} ${FX+44} ${GR-70}L${FX+44} ${GR+3}Z`,'#020303',1.3);
  const fls=[-26,-8,10,27,0].map((dx,i)=>({f:flame(k.root,i===4?'#eefcff':COLD,.8),dx,h:[46,62,54,40,30][i],w:[18,22,20,16,12][i],ph:i*1.7}));
  // 배관
  const PY=62,pipe=grp(k.root);dark(pipe,`M-90 ${PY-10}L${FX-14} ${PY-10}L${FX-14} 86L${FX+14} 86L${FX+14} ${PY+10}L-90 ${PY+10}Z`,'#1a150e',1.2);for(let x=-60;x<FX-30;x+=74)ink(pipe,`M${x} ${PY-13}L${x} ${PY+13}M${x+6} ${PY-13}L${x+6} ${PY+13}`,.8);
  const ps=sand(pipe,46,R,(u,o)=>[lerp(-90,FX-20,u),PY+o*6]);
  const snow=motes(grp(k.root),16,R,[FX-70,GR-120,FX+70,GR+2],{fill:'#eefcff',vy0:5,vy1:11,r0:.4,r1:.9});
  const LT=grp(k.root),lt=grp(LT);sh(lt,'M-13 -17L13 -17L13 17L-13 17Z',.9);[0,1,2,3].forEach(i=>ink(lt,`M-9 ${-12+i*5}L${i===3?-1:9} ${-12+i*5}`,.5));
  const hero=actor(k.root,SEOHA,0,GR+2,1,S,STAND);hero.w.x=392-STAND.speed*S*2;
  return(t,dt)=>{const u=es(t,.4,4.8),v=es(t,7.2,7.9),p=bez([236,150],[330,96],[FX-56,GR-76],u),lx=lerp(p[0],FX,v),ly=lerp(p[1],GR-40,v)+Math.sin(t*2)*2*(1-v);
   lt.setAttribute('transform',`translate(${f(lx)} ${f(ly)}) rotate(${f(lerp(-24,12,u)+wobble(t,1)*5+80*v)}) scale(${f(lerp(1,.62,u)*(1-.8*v))})`);op(LT,1-es(t,7.7,7.95));
   cam(t);dip(t);fls.forEach(q=>q.f.draw(FX+q.dx,GR+1,q.w,q.h*(1+.5*v*(1-es(t,8,9))),t,q.ph));op(gl,.42+.08*Math.sin(t*5));ps(t,1,.09);snow(t,0,es(t,8.4,9.4));
   vis(hero.g,t>=8.1);hero.up(t,dt,t>=8.1&&t<10.1?1:0,{nearHand:t>=10.1?[lerp(60,68,es(t,10.1,11)),lerp(80,54,es(t,10.1,11))]:null,headDrop:1.2*es(t,10.4,11.4),lean:3*es(t,10.1,11)});}}},BRASS));
// ───────── kair08 뉴런 게이트 ─────────
A.add(Object.assign({zone:'kair08',D:17,
 subs:[[0.8,4.2,'‘뉴런 게이트’, 또는 ‘노이론 게이트’라 불리는 거대한 관문을 넘었다.'],[5.0,9.2,'문턱을 넘는 순간, 어디로 갈지 생각하기도 전에 내 발이 먼저 앞으로 나갔다.'],[10.0,12.8,'다행히 다음 지시가 내려오기 직전에 아주 짧은 공백이 생겼다.'],[13.6,16.2,'이번에도 똑같은 틈이 벌어지고 있었다.']],
 build(k){const R=seeded(5108),GR=292,S=1.1,GX=250,SP=SHUF.speed*S,G1=[10.4,12.2],G2=[14,17.2];
  const walkT=t=>Math.min(t,G1[0])+clamp(t-G1[1],0,G2[0]-G1[1]),X0=GX-SP*3.6;
  const cam=k.track([[0,250,180,1.02],[4.4,270,190,1.18],[9.6,X0+SP*9.6+30,206,1.6],[12.4,X0+SP*10.6+30,208,1.9],[17,X0+SP*12.3+30,208,2.0]]);
  floorL(k.root,GR,R,24);const gl=k.glowAt(GX,120,230,'#3a2c66',k.far);
  // 신경 가지로 엮인 관문
  const tips=[],G=grp(k.root);function dend(x,y,a,L,d){const x2=x+Math.cos(a)*L,y2=y+Math.sin(a)*L,mx=(x+x2)/2+R(-L,L)*.16,my=(y+y2)/2+R(-L,L)*.16;ink(G,`M${f(x)} ${f(y)}Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`,.5+d*.55);if(d<=0){tips.push([x2,y2]);return;}const n=d>2?2:R(0,1)<.3?3:2;for(let i=0;i<n;i++)dend(x2,y2,a+R(-.75,.75),L*R(.62,.8),d-1);}
  [-1,1].forEach(sg=>{const bx=GX+sg*92;ink(G,`M${bx-sg*8} ${GR+3}Q${bx-sg*3} ${GR-70} ${bx} ${GR-120}M${bx+sg*10} ${GR+3}Q${bx+sg*6} ${GR-70} ${bx} ${GR-120}`,1.6);dend(bx,GR-120,-Math.PI/2-sg*.25,54,4);dend(bx,GR-120,-Math.PI/2+sg*.2,46,3);dend(bx,GR-150,-Math.PI/2-sg*.9,40,3);});
  const nodes=tips.filter((_,i)=>i%2===0).map(p=>el('circle',{cx:f(p[0]),cy:f(p[1]),r:1.5,fill:VIO},k.glow));
  const hero=actor(k.root,SEOHA,X0,GR+2,1,S,SHUF),LN=grp(k.glow),PT=[[42,30],[62,80],[28,80],[48,116],[33,116]],cb=PT.map((q,i)=>({l:el('path',{d:'',fill:'none',stroke:VIO,'stroke-width':.8},LN),p:[0,1].map(()=>el('circle',{r:1.7,fill:'#efe8ff'},LN)),ox:(i-2)*34,q}));
  return(t,dt)=>{cam(t);const gap=(t>=G1[0]&&t<G1[1])||t>=G2[0],on=t>=4.6,act=on&&!gap,gi=t>=G2[0]?es(t,G2[0],G2[0]+.5):t>=G1[0]&&t<G1[1]?es(t,G1[0],G1[0]+.4)*(1-es(t,G1[1]-.3,G1[1])):0;
   hero.up(t,dt,gap?0:1,{lean:act?7:0,headDrop:act?-1.4:0,headTurn:.8*gi,nearHand:act?[60+Math.sin(t*5)*3,70]:null,legPts:gap?crouch(2):null,drop:gap?2:0});
   nodes.forEach((n,i)=>op(n,.3+.7*Math.sin(t*2.4+i*1.3)**2));op(gl,.5);op(LN,on?es(t,4.6,5.4)*(gap?.28:1):0);
   cb.forEach((c,i)=>{const b=hero.at(c.q[0],c.q[1]),a=[b[0]+c.ox-30,-40],m=[(a[0]+b[0])/2+14,(a[1]+b[1])/2-20];c.l.setAttribute('d',`M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`);
    c.p.forEach((n,j)=>{const u=((t*1.6+i*.21+j*.5)%1+1)%1,p=bez(a,m,b,u);setA(n,{cx:p[0],cy:p[1]});op(n,act?1:0);});});}}},BRASS));
// ───────── kair09 망각의 묘지 ─────────
A.add(Object.assign({zone:'kair09',D:16.5,
 subs:[[0.8,5.0,'스산한 묘지에 들어서자 비석의 이름보다 기록문들이 먼저 눈에 들어왔다.'],[5.8,10.6,'가까운 봉인석에 다가가 살펴보니 고통을 남긴 기억은 전부 지우라는 명령이 걸려 있었다.'],[11.4,15.6,'봉인을 풀자 실패했던 일과 쓰라리게 아팠던 날들의 기록이 흘러나오고 있었다.']],
 build(k){const R=seeded(5109),GR=292,S=1.1,SX=430,SP=STAND.speed*S;
  const cam=k.track([[0,250,206,1.2],[5.2,330,212,1.4],[5.6,410,236,1.9,'cut'],[10.8,418,242,2.15],[11.2,410,190,1.5,'cut'],[16.5,416,170,1.6]]),dip=dipper(k,[5.6,11.2]);
  ground(k.root,GR+3,R);scratches(k.root,24,R,GR+10,356);
  const slab=(p,x,y,w,h,n)=>{dark(p,`M${f(x-w)} ${f(y)}L${f(x-w)} ${f(y-h+w)}Q${f(x-w)} ${f(y-h)} ${f(x)} ${f(y-h)}Q${f(x+w)} ${f(y-h)} ${f(x+w)} ${f(y-h+w)}L${f(x+w)} ${f(y)}Z`,'#1c1811',1);cmdText(p,x-w+4,y-h+w+2,w*2-8,n,R,'#cbbf9f');};
  const FAR=grp(k.back,{opacity:.45});for(let i=0;i<9;i++)slab(FAR,-40+i*86+R(-14,14),GR-10,12,R(34,50),3);
  [[60,16,62],[168,18,74],[286,15,58],[590,18,70],[676,15,60]].forEach(([x,w,h])=>slab(k.root,x,GR+3,w,h,5));
  const fog=fogBand(k,k.front,8,R,250,320,'#b8ad92',.05,.12);
  // 봉인석
  dark(k.root,`M${SX-34} ${GR+3}Q${SX-44} ${GR-40} ${SX-20} ${GR-62}Q${SX+4} ${GR-76} ${SX+26} ${GR-58}Q${SX+46} ${GR-34} ${SX+36} ${GR+3}Z`,'#17130d',1.3);
  const seal=grp(k.root),sg=k.glowAt(SX,GR-34,60,REDV);cmdText(seal,SX-30,GR-44,62,3,R,REDV);el('path',{d:`M${SX-40} ${GR-28}Q${SX} ${GR-18} ${SX+41} ${GR-30}`,fill:'none',stroke:REDV,'stroke-width':1.6},seal);
  const sp=spark(k.root,'#ffe3d6',5),recs=[];for(let i=0;i<11;i++){const g=grp(k.root);sh(g,'M-9 -6L9 -6L9 6L-9 6Z',.7);ink(g,'M-6 -2L6 -2M-6 2L2 2',.4);recs.push({g,a:R(-1.1,1.1),sp:R(.7,1.2),ph:i*.3,rot:R(-40,40)});}
  const hero=actor(k.root,SEOHA,SX-70-SP*8.2,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);fog(t,1,1);const kn=es(t,8.2,9.2)*(1-es(t,13.2,14.4)),cut=es(t,11.5,11.8),br=es(t,11.75,12.1);
   hero.up(t,dt,t<8.2?1:0,{headDrop:1+1.6*kn,legPts:kn>0?crouch(22*kn):null,drop:22*kn,lean:10*kn,swordAng:lerp(18,lerp(60,96,cut),es(t,11.3,11.6))*(1-es(t,12.6,13.6))+18*es(t,12.6,13.6),nearHand:kn>0?[lerp(60,66,cut),lerp(80,70,kn)]:null});
   op(seal,1-br);op(sg,(.4+.1*Math.sin(t*4))*(1-br));sp(SX-18,GR-30,seg(t,11.72,12.2),30);
   recs.forEach(r=>{const u=clamp((t-11.9-r.ph)*.24*r.sp,0,1);r.g.setAttribute('transform',`translate(${f(SX+Math.sin(r.a)*150*u+Math.sin(t*1.3+r.ph)*6)} ${f(GR-50-190*u)}) rotate(${f(r.rot*u+wobble(t+r.ph,1)*8)}) scale(${f(.8+.9*u)})`);op(r.g,u>0?1-es(u,.8,1):0);});}}},BRASS));
// ───────── kair10 붕괴 의식장 ─────────
A.add(Object.assign({zone:'kair10',D:17,
 subs:[[0.8,5.0,'마지막 ‘붕괴 의식장’에 들어서자 검은 모래가 거대한 기둥처럼 하늘로 솟구치고 있었다.'],[5.8,10.4,'봉인 회랑으로 통하는 문 앞에는 여섯 개의 명령 고리가 쇠사슬처럼 걸려 있었다.'],[11.2,16.2,'나는 굳게 잠긴 문에서 한 걸음 물러나, 그 앞을 가로막은 여섯 고리에 시간검을 겨누었다.']],
 build(k){const R=seeded(5110),GR=292,S=1.1,PX=330,DX=470,HP=STAND.period/2;
  const cam=k.track([[0,330,250,1.3],[5.2,330,90,1.05],[5.6,DX,186,1.5,'cut'],[10.6,DX-6,190,1.75],[11,400,204,1.5,'cut'],[17,410,202,1.7]]),dip=dipper(k,[5.6,11]);
  const SA=grp(k.root),SB=grp(k.root);floorL(k.root,GR,R,22);
  el('path',{d:`M${PX-70} ${GR+3}Q${PX-30} ${GR-60} ${PX-26} -80L${PX+26} -80Q${PX+30} ${GR-60} ${PX+70} ${GR+3}Z`,fill:SANDC,stroke:'#cbbf9f','stroke-width':.5,'stroke-opacity':.6},SA);
  const up1=sand(SA,90,R,(u,o,t)=>{const y=lerp(GR,-80,u),w=26+44*Math.pow(1-u,3);return[PX+Math.sin(u*9+o*3.14+t*.8)*w+o*5,y];},{r0:.8,r1:2}),st=sand(k.front,50,R,(u,o)=>[lerp(760,-100,u),lerp(-20,380,(o+1)/2)+Math.sin(u*8+o*5)*20],{r0:.6,r1:1.4});
  const hA=actor(SA,SEOHA,PX-176-STAND.speed*S*1.8,GR+2,1,S,STAND);
  // 문과 여섯 고리
  ink(SB,`M${DX-80} ${GR+3}L${DX-80} 70L${DX+80} 70L${DX+80} ${GR+3}`,1.8);dark(SB,Lp([[DX-66,GR+3],[DX-66,84],[DX+66,84],[DX+66,GR+3]],true),'#17130d',1.3);ink(SB,`M${DX} 84L${DX} ${GR+3}M${DX-8} 196l0 16M${DX+8} 196l0 16`,.8);cmdText(SB,DX-44,96,88,2,R,AMB);
  const rg=[0,1,2,3,4,5].map(i=>el('ellipse',{cx:DX-65+i*26,cy:186+Math.sin(i/5*3.14)*12,rx:17,ry:9,fill:'none',stroke:AMB,'stroke-width':2.2,transform:`rotate(${i%2?24:-24} ${DX-65+i*26} ${186+Math.sin(i/5*3.14)*12})`},SB)),rgl=k.glowAt(DX,190,110,AMB);
  const hB=actor(SB,SEOHA,DX-104,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.6;vis(SA,a);vis(SB,!a);st(t,a?1:.5,.3);
   if(a){up1(t,1,.3);hA.up(t,dt,t<1.8?1:0,{headDrop:-2.2*es(t,2,3.4),lean:-4*es(t,2,3.4),capeKick:-5,wind:-1});op(rgl,0);return;}
   op(rgl,.35+.1*Math.sin(t*3));rg.forEach((n,i)=>n.setAttribute('stroke-opacity',f(.65+.35*Math.sin(t*2.2-i*.8))));
   const bk=t>=11.6&&t<11.6+HP,aim=es(t,12.8,14);if(t<11)hB.w.x=DX-104;hB.w.dir=1;
   if(bk){hB.w.dir=-1;hB.up(t,dt,1,{});hB.w.dir=1;place(hB.g,hB.w.x,hB.w.y,1,S);}
   else hB.up(t,dt,0,{nearHand:t<11?[lerp(60,70,es(t,8.6,9.4)*(1-es(t,10,10.5))),lerp(80,62,es(t,8.6,9.4)*(1-es(t,10,10.5)))]:[lerp(60,64,aim),lerp(80,54,aim)],swordAng:lerp(18,92,aim),legPts:aim>0?crouch(4*aim):null,drop:4*aim,lean:3*aim});}}},BRASS));
// ───────── kair02 아르벨리아, 유예의 수문장 ─────────
A.add(Object.assign({zone:'kair02',D:16.5,
 subs:[[0.8,3.4,'회랑 안에 아르벨리아가 서 있었다.'],[4.0,8.0,'한 발을 내딛던 그림자마저 움직임 중간에 그대로 멈춰 있었다.'],[8.8,12.4,'나는 그 그림자를 밟지 않도록 돌아서 그녀에게 다가갔다.'],[13.0,16.0,'그녀 앞에 놓인 기록에 손을 대자 삭제 명령이 곧바로 반응했다.']],
 build(k){const R=seeded(5102),GR=286,S=1.1,AX=450,SP=STAND.speed*S,ARB={robe:'long',robeFill:'#e9e2cf',legs:'#b9b09a',hat:BOB,seed:5};
  const cam=k.track([[0,410,190,1.15],[3.6,440,196,1.5],[4,400,262,2.2,'cut'],[8.2,390,264,2.4],[8.6,330,204,1.25,'cut'],[12.6,400,200,1.5],[13,436,198,1.85,'cut'],[16.5,440,198,2.0]]),dip=dipper(k,[4,8.6,13]);
  ink(k.root,`M-90 ${GR+3}L730 ${GR+3}`,1);ink(k.root,`M-90 ${GR+44}L730 ${GR+44}`,.5,{opacity:.5});scratches(k.root,18,R,GR+48,356);
  const BK=grp(k.back,{opacity:.55});for(let i=0;i<8;i++){const x=-60+i*112;sh(BK,Lp([[x,GR+3],[x,40],[x+22,40],[x+22,GR+3]],true),.8);ink(BK,`M${x+22} 78Q${x+67} 30 ${x+112} 78`,.8);}
  const hl=k.glowAt(AX,GR-70,120,'#d9cfae');
  // 멈춘 그림자(걷던 자세 그대로 바닥에 누운 꼴)
  const shd=grp(k.root,{opacity:.8});el('path',{d:`M${AX-6} ${GR+5}L${AX-70} ${GR+24}L${AX-128} ${GR+30}L${AX-150} ${GR+26}L${AX-128} ${GR+22}L${AX-84} ${GR+16}L${AX-150} ${GR+12}L${AX-176} ${GR+13}L${AX-150} ${GR+7}L${AX-60} ${GR+9}L${AX+8} ${GR+4}Z`,fill:'#080604'},shd);el('ellipse',{cx:AX-186,cy:GR+12,rx:9,ry:3.4,fill:'#080604'},shd);
  const arb=figure(k.root,ARB),ps=STAND.pose(.31,1);place(arb.g,AX,GR+2,-1,S*1.12);
  el('circle',{cx:AX-3,cy:GR-104,r:13,fill:'none',stroke:AMB,'stroke-width':.8,opacity:.8},k.root);
  // 기록판
  const PN=grp(k.root),px=AX-58,py=GR-92;dark(PN,Lp([[px-22,py],[px+22,py],[px+22,py+44],[px-22,py+44]],true),'#1a160f',.9);const tl=cmdText(PN,px-17,py+7,34,5,R,'#e9dfc4'),del=[0,1,2,3,4].map(i=>el('path',{d:`M${px-19} ${py+7+i*7}L${px+19} ${py+7+i*7}`,stroke:REDV,'stroke-width':1.6,fill:'none'},PN)),dg=k.glowAt(px,py+22,50,REDV);
  const hero=actor(k.root,SEOHA,AX-104-SP*3.2,GR+2,1,S,STAND);
  return(t,dt)=>{cam(t);dip(t);arb.update({pose:ps,go:0,dt:0,t:0,headDrop:.8});op(hl,.4);
   const go=t>=8.8&&t<12?1:0,rd=es(t,8.8,9.6)*(1-.4*es(t,11,12)),hx0=hero.w.x;hero.w.y=GR+2+40*rd;hero.w.s=S*(1+.1*rd);
   hero.up(t,dt,go,{headDrop:t<8.6?1.6:0,nearHand:t>=13?[lerp(60,70,es(t,13.2,13.9)),lerp(80,52,es(t,13.2,13.9))]:null,swordAng:18});
   del.forEach((n,i)=>{const u=es(t,14+i*.32,14.25+i*.32);n.setAttribute('stroke-dasharray',`${f(38*u)} 40`);op(n,u>0?1:0);op(tl[i],1-.7*u);});op(dg,es(t,14,14.4)*(.5+.15*Math.sin(t*9)));}}},BRASS));
// ───────── kair03 세이렌 모르 ─────────
A.add(Object.assign({zone:'kair03',D:17.5,paper:'#1d1612',sky:[[0,'#120c0a'],[0.55,'#2e1f1a'],[1,'#180f0d']],
 subs:[[0.8,4.2,'오염된 코어가 열리면서 세이렌이 모습을 드러냈다.'],[5.0,8.8,'검은 모래가 발등을 덮쳐 나는 급히 옆으로 자리를 옮겼다.'],[9.4,12.6,'그러자 노이론 케이블이 그 길목을 가로질러 막아섰다.'],[13.2,16.8,'반대쪽으로 몸을 돌리자 거대한 시곗바늘이 먼저 그 길에 들어와 있었다.']],
 build(k){const R=seeded(5103),GR=292,S=1.1,CX=500,CY=170,HX=250;
  const cam=k.track([[0,CX-30,190,1.25],[4.4,CX-20,186,1.55],[4.8,300,236,1.7,'cut'],[9,320,226,1.6],[12.8,330,206,1.35],[17.5,300,196,1.25]]),dip=dipper(k,[4.8]);
  floorL(k.root,GR,R,24);dark(k.root,Lp([[CX-50,GR+3],[CX-32,CY+66],[CX+32,CY+66],[CX+50,GR+3]],true),'#17100d',1.2);
  const gl=k.glowAt(CX,CY,170,'#a2342a'),inner=grp(k.root);el('circle',{cx:CX,cy:CY,r:50,fill:'#050303'},inner);
  const sei=figure(inner,{robe:'long',robeFill:'#0b0707',legs:'#0b0707',hat:HOOD,hatFill:'#0b0707',seed:9});place(sei.g,CX,CY+52,-1,.84);const eye=el('circle',{cx:CX-3,cy:CY-21,r:1.3,fill:REDV},inner);
  const hv=[-1,1].map(sg=>{const g=grp(k.root);dark(g,`M${CX} ${CY-58}A58 58 0 0 ${sg>0?1:0} ${CX} ${CY+58}Z`,'#0e0a08',1.4);ink(g,`M${CX+sg*14} ${CY-30}L${CX+sg*40} ${CY-30}M${CX+sg*12} ${CY-12}L${CX+sg*46} ${CY-12}M${CX+sg*12} ${CY+6}L${CX+sg*38} ${CY+6}M${CX+sg*14} ${CY+24}L${CX+sg*34} ${CY+24}`,1.1,{style:'color:'+REDV});return g;});
  const rings=[0,1].map(i=>el('ellipse',{cx:CX,cy:CY,rx:80,ry:20+i*12,fill:'none',stroke:REDV,'stroke-width':1,opacity:.7},k.root));
  // 덮쳐 오는 검은 모래
  const wave=el('path',{d:'',fill:SANDC,stroke:'#cbbf9f','stroke-width':.5,'stroke-opacity':.6},k.root),gr=sand(k.root,40,R,(u,o,t)=>[lerp(CX-40,120,u)+o*12,GR+4-Math.abs(Math.sin(u*14+o*4))*10*(1-u)-2],{r0:.6,r1:1.5});
  // 케이블·시곗바늘
  const cbl=[0,1,2,3,4].map(i=>({n:el('path',{d:'',fill:'none',stroke:VIO,'stroke-width':1.5,'stroke-linecap':'round'},k.root),x:372+i*13,d:i*.09})),cg=k.glowAt(398,200,90,VIO),sp=spark(k.root,'#efe8ff',5);
  const hand=grp(k.root);dark(hand,'M-5 0L-2 -330L0 -352L2 -330L5 0L0 14Z','#0c0806',1.2);ink(hand,'M0 -8L0 -320',.5,{opacity:.6});el('circle',{cx:0,cy:0,r:6,fill:'#0c0806',stroke:INK,'stroke-width':1},hand);
  const hero=actor(k.root,SEOHA,HX,GR+2,1,S,RUN);
  return(t,dt)=>{cam(t);dip(t);sei.update({pose:STAND.pose(0,0),go:0,dt,t});const o=es(t,.6,3.2);hv.forEach((g,i)=>g.setAttribute('transform',`translate(${f((i?1:-1)*46*o)} 0)`));op(inner,es(t,.9,2.6));op(eye,.5+.5*Math.sin(t*3)**2);op(gl,.3+.3*o+.06*Math.sin(t*4));rings.forEach((n,i)=>n.setAttribute('transform',`rotate(${f(t*(18+i*12)*(i?-1:1))} ${CX} ${CY})`));
   const wv=es(t,5,6.6),wx=lerp(CX-40,HX-40,wv);wave.setAttribute('d',`M${CX-30} ${GR+4}L${f(wx)} ${GR+4}Q${f(wx+10)} ${f(GR-16*Math.sin(wv*3.14)-4)} ${f(wx+44)} ${f(GR-8)}Q${f((wx+CX)/2)} ${GR-12} ${CX-30} ${GR-6}Z`);op(wave,t>=5?1:0);gr(t,t>=5.4?1:0,.3);
   // 영웅: 오른쪽으로 비킴 → 케이블에 막힘 → 왼쪽으로 돎 → 시곗바늘
   const m1=es(t,6.3,7.4),tn=t>=13.3;hero.w.x=HX+92*m1-34*es(t,13.5,14.4);hero.w.dir=tn?-1:1;const mv=(t>=6.3&&t<7.4)||(t>=13.5&&t<14.4);
   hero.up(t,dt,mv?1:0,{swordAng:lerp(lerp(18,60,es(t,7.4,8)),74,es(t,15,16)),nearHand:t>=7.4?[60,lerp(80,62,es(t,7.4,8))]:null,legPts:mv?null:crouch(4+3*es(t,15,16)),drop:mv?0:4+3*es(t,15,16),headDrop:t<6.3?2.4*es(t,5.4,6):1.2,lean:-8*es(t,10.2,10.6)*(1-es(t,11,12))-6*es(t,14.8,15.2)*(1-es(t,16,17))});
   cbl.forEach(c=>{const u=minJerk(seg(t,9.8+c.d,10.3+c.d)),y=lerp(-60,GR+3,u);c.n.setAttribute('d',`M${c.x+30} -70Q${c.x+18+Math.sin(t*3+c.d*20)*3} ${f(y*.5)} ${c.x} ${f(y)}`);});op(cg,es(t,10.2,10.6)*.5);sp(398,GR,seg(t,10.25,10.8),30);
   const hd=minJerk(seg(t,14.2,15.2)),ang=lerp(-64,-8,hd)+Math.sin(t*2)*1.2*hd;hand.setAttribute('transform',`translate(170 ${GR+40}) rotate(${f(ang)})`);op(hand,t>=13.9?1:0);}}},BRASS));
})();
