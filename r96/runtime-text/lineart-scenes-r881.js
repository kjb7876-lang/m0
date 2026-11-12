// R881 — 선화 컷씬 장면 첫 묶음(1부 dist01~06·ep1a08·ep1a09, 4부 last303~305). 재생기는 lineart-cine-r880.js.
// 사용자 2026-11-12 "시네마틱 없는구간에 저런거 서사에맞게 생성해서 넣어서 … 맵당하나씩" · "퀄리티업하고 몇초정도 더길게"(장면 16~18초, 카메라 이동·컷 3~4개).
//  · 자막은 정본 그 지역 '보스 앞 서사' 문장 그대로(지어낸 글 없음, 검사 r880 이 대조). 그림은 그 문장에 나온 것만 그린다.
//  · 십자로 읽히는 모양은 쓰지 않는다(섬광은 3·5갈래, 병원 표지 없음). 인물은 얼굴 없는 선 인형.
(()=>{'use strict';
const A=window.__STORYWORLD_LINEART_R880__;if(!A||window.__STORYWORLD_LINEART_SCENES_R881__)return;window.__STORYWORLD_LINEART_SCENES_R881__='R881-scenes-1';
const {INK,PAPER,PEN,el,f,pt,pen,shape,blot,paint,joint,place,toScene,clamp,lerp,smooth,ease,minJerk,seeded,wobble,spring,pendulum,gait,
 seg,es,setA,grp,Lp,smoothD,band,ink,sh,bl,pa,ell,wavy,hatch,figure,walker,HATS,hanok,lantern,featherWing,flame,motes,wolf}=A.kit;
const STAND=gait({kind:'walk'}),SHUF=gait({kind:'shuffle'}),RUN=gait({kind:'run',thigh:23,shin:23,stride:34,lift:9,period:0.66,ankleY:118.4});
const vis=(g,on)=>g.setAttribute('display',on?'inline':'none');
const op=(n,v)=>n.setAttribute('opacity',f(clamp(v,0,1)));
// 컷 사이 짧은 암전
const dipper=(k,times)=>{const r=el('rect',{x:-40,y:-40,width:720,height:450,fill:'#000',opacity:0},k.hud);return t=>{let o=0;for(const c of times)o=Math.max(o,1-Math.abs(t-c)/0.34);op(r,o);};};
const ground=(p,y,R,x0=-90,x1=730)=>ink(p,smoothD(wavy(x0,y,x1,y,1.4,18,R)),1);
const scratches=(p,n,R,y0,y1,x0=-80,x1=720)=>{for(let i=0;i<n;i++){const x=R(x0,x1),y=R(y0,y1);ink(p,`M${f(x)} ${f(y)}l${f(R(4,12))} 0`,0.4);}};
// 배우: 인형 + 걸음(발이 미끄러지지 않게 걸음 속도 그대로 이동)
function actor(parent,o,x,y,dir,s,g){const fig=figure(parent,o),w=walker(fig,{x,y,dir,s,gait:g||STAND});
 return{fig,w,st:fig.st,g:fig.g,up(t,dt,go,ex){const pose=w.step(dt,go||0);fig.update(Object.assign({pose,go:go||0,dt,t},ex||{}));},at:(lx,ly)=>w.at(lx,ly)};}
// 웅크린 다리(무릎 굽힘 d)
const crouch=d=>{const hip=[40,74+d],a=[34,118.4],b=[47,118.4];return[[hip,joint(hip,a,23.6,23.6,1),a],[hip,joint(hip,b,23.6,23.6,1),b]];};
// 영웅(1부 수호자 EGO: 붉은 망토·금빛 코등이 / 4부 환도 자아: 은회색 망토)
const EGO={robe:'coat',legs:'#2a2630',cape:'#7a2f2a',hat:HATS.hero,sword:'#c9a24a',belt:1,seed:3};
const HWANDO={robe:'coat',legs:'#2b2f3a',cape:'#7d8494',hat:HATS.hero,sword:'#c9a24a',seed:3};
const PATIENT={robe:'dress',robeFill:'#c9d6d6',hat:HATS.patient,seed:2,restN:3,restF:-3};
// 돌기둥(검은 몸, 밝은 테두리)
function pillar(p,x,top,base,w,R,o={}){const G=grp(p),fill=o.fill||'#07060a';
 el('path',{d:Lp([[x-w/2,base],[x-w/2+1,top+8],[x+w/2-1,top+8],[x+w/2,base]],true),fill,stroke:INK,'stroke-width':1.1,'stroke-linejoin':'round'},G);
 if(!o.broken)el('path',{d:Lp([[x-w/2-4,top+8],[x-w/2-5,top],[x+w/2+5,top],[x+w/2+4,top+8]],true),fill,stroke:INK,'stroke-width':1.1,'stroke-linejoin':'round'},G);
 else el('path',{d:Lp([[x-w/2+1,top+8],[x-w/2+4,top-R(2,8)],[x-2,top+3],[x+3,top-R(4,12)],[x+w/2-1,top+8]],true),fill,stroke:INK,'stroke-width':1.1,'stroke-linejoin':'round'},G);
 el('path',{d:Lp([[x-w/2-5,base],[x-w/2-6,base+7],[x+w/2+6,base+7],[x+w/2+5,base]],true),fill,stroke:INK,'stroke-width':1.1,'stroke-linejoin':'round'},G);
 for(let i=1;i<4;i++){const xx=x-w/2+w*i/4;ink(G,`M${f(xx)} ${f(top+12)}L${f(xx+R(-.6,.6))} ${f(base-3)}`,0.4,{opacity:.55});}
 for(let i=0;i<3;i++){const yy=R(top+20,base-14),xx=x+R(-w/2+2,w/2-8);ink(G,`M${f(xx)} ${f(yy)}l${f(R(3,7))} ${f(R(-3,3))}l${f(R(-2,3))} ${f(R(3,7))}`,0.4,{opacity:.7});}
 return G;}
const dark0=(p,d)=>el('path',{d,fill:'#040306'},p);
// 발록: 큰 검은 몸, 황소 뿔, 박쥐 날개(open 0 접힘 → 1 펼침). 발밑이 원점.
function balrog(parent,o={}){const fill=o.fill||'#060508',ST=o.stroke||INK,G=grp(parent),W=[-1,1].map(()=>({m:el('path',{fill,stroke:ST,'stroke-width':1,'stroke-linejoin':'round'},G),r:pen(G,0.55)}));
 const body=el('path',{fill,stroke:ST,'stroke-width':1.2,'stroke-linejoin':'round'},G);
 body.setAttribute('d',smoothD([[0,-162],[12,-158],[18,-144],[40,-132],[52,-104],[44,-70],[34,-52],[40,-22],[46,0],[14,0],[6,-26],[-6,-26],[-14,0],[-46,0],[-40,-22],[-34,-52],[-44,-70],[-52,-104],[-40,-132],[-18,-144],[-12,-158]],true));
 const mane=ink(G,'M-30 -128q6 10 2 22M-18 -134q4 12 0 26M30 -128q-6 10 -2 22M18 -134q-4 12 0 26M-8 -120q8 8 16 0M-22 -80q22 12 44 0M-18 -56q18 8 36 0',0.6,{opacity:.6});
 const horns=[-1,1].map(s=>(o.stroke?dark0:sh)(G,band([[s*9,-156],[s*26,-160],[s*40,-172],[s*44,-190],[s*40,-204]],8,0.8),1.1));
 const eyes=[-1,1].map(s=>el('ellipse',{cx:s*5.5,cy:-148,rx:2.4,ry:1.3,fill:o.eye||'#ff7a3c'},G));
 if(o.stroke){mane.setAttribute('opacity','0');W.forEach(w=>w.r.setAttribute('opacity','0'));}
 return{G,body,horns,eyes,mane,draw(x,y,s,open,t,flip=1){G.setAttribute('transform',`translate(${f(x)} ${f(y)}) scale(${f(s*flip)} ${f(s)})`);
  W.forEach((w,i)=>{const sg=i?1:-1,sh0=[sg*30,-128],hipP=[sg*26,-66],fl=wobble(t*1.3+i*3,1)*4*open,tips=[0,1,2,3].map(j=>{const a=lerp(lerp(1.35,1.15,j/3),lerp(-0.75,0.85,j/3),open),L=lerp(54,lerp(150,96,j/3),open);return[sh0[0]+sg*Math.cos(a)*L+sg*fl,sh0[1]+Math.sin(a)*L+fl*.5];});
   let d='M'+pt(sh0)+'L'+pt(tips[0]);for(let j=1;j<4;j++){const a=tips[j-1],b=tips[j];d+=`Q${f((a[0]+b[0])/2-sg*(8+10*open))} ${f((a[1]+b[1])/2-(6+12*open))} ${pt(b)}`;}
   d+=`Q${f((tips[3][0]+hipP[0])/2-sg*10)} ${f((tips[3][1]+hipP[1])/2-10)} ${pt(hipP)}Z`;w.m.setAttribute('d',d);w.r.setAttribute('d',tips.map(q=>`M${pt(sh0)}L${pt(q)}`).join(''));});
  eyes.forEach((e,i)=>e.setAttribute('opacity',f(0.7+0.3*Math.sin(t*9+i))));}};}
// 앙상한 나무(정적)
function deadTree(p,x,y,h,R,w=1){const G=grp(p),br=(a,len,ang,dep,wd)=>{const b=[a[0]+Math.sin(ang)*len,a[1]-Math.cos(ang)*len],m=[(a[0]+b[0])/2+R(-len,len)*.12,(a[1]+b[1])/2];ink(G,`M${pt(a)}Q${pt(m)} ${pt(b)}`,wd);
  if(dep>0){const n=dep>2?3:2;for(let i=0;i<n;i++)br(b,len*R(.55,.75),ang+R(-.9,.9),dep-1,Math.max(.4,wd*.7));}};
 sh(G,band([[x,y+2],[x+R(-2,2),y-h*.25],[x+R(-3,3),y-h*.5]],7*w,3.5*w),1);br([x,y-h*.48],h*.3,R(-.3,.3),3,1*w);br([x,y-h*.3],h*.22,R(.6,1.1)*(R(0,1)<.5?-1:1),2,.8*w);return G;}
// 침엽수(정적)
function pine(p,x,y,h,R,wd=1){const G=grp(p);ink(G,`M${f(x)} ${f(y)}L${f(x+R(-1,1))} ${f(y-h)}`,wd);const n=Math.round(h/9);
 for(let i=0;i<n;i++){const u=i/n,yy=y-h*0.16-u*h*0.84,w=lerp(h*0.26,3,u);ink(G,`M${f(x-w)} ${f(yy+R(2,5))}Q${f(x-w*.4)} ${f(yy+1)} ${f(x)} ${f(yy-4)}Q${f(x+w*.4)} ${f(yy+1)} ${f(x+w)} ${f(yy+R(2,5))}`,wd*.7);}return G;}
// 풀포기: 바람 용수철로 기운다
function grass(p,n,R,x0,x1,y,h0=6,h1=14){const arr=[];for(let i=0;i<n;i++){const x=R(x0,x1);arr.push({n:ink(p,'',R(.45,.8)),x,y:y+R(-1,3),h:R(h0,h1),ph:R(0,6),k:R(.6,1.3)});}
 return(t,w)=>{for(const b of arr){const lean=(w*5+Math.sin(t*1.6+b.ph)*1.6)*b.k;b.n.setAttribute('d',`M${f(b.x)} ${f(b.y)}Q${f(b.x+lean*.3)} ${f(b.y-b.h*.6)} ${f(b.x+lean)} ${f(b.y-b.h)}`);}};}
// 안개 띠
function fogBand(k,p,n,R,y0,y1,col,o0=.07,o1=.15){const g=grp(p,{filter:'url(#r880soft)'}),arr=[];for(let i=0;i<n;i++)arr.push([el('ellipse',{rx:f(R(70,130)),ry:f(R(9,18)),fill:col,opacity:f(R(o0,o1))},g),R(-120,760),R(y0,y1),R(3,9)]);
 return(t,w=0,a=1)=>{op(g,a);for(const [n1,x,y,sp] of arr){const xx=((x-t*sp+w*t*2.5)%900+900)%900-130;setA(n1,{cx:xx,cy:y});}};}
// 3·5갈래 섬광(십자 모양이 되지 않게 홀수 갈래, 고르지 않은 각)
function spark(parent,col='#fff3d6',n=5){const g=grp(parent),L=[];for(let i=0;i<n;i++)L.push(el('path',{d:'',fill:'none',stroke:col,'stroke-width':1.8,'stroke-linecap':'round'},g));
 return(x,y,u,r=26)=>{op(g,u>0&&u<1?1-u:0);L.forEach((p,i)=>{const a=i*(6.283/n)+0.5+i*0.23,r0=4+u*8,r1=(r*(0.6+0.4*((i*7)%3)/2))*(0.4+u);p.setAttribute('d',`M${f(x+Math.cos(a)*r0)} ${f(y+Math.sin(a)*r0)}L${f(x+Math.cos(a)*r1)} ${f(y+Math.sin(a)*r1)}`);});};}
// 두 마디 다리의 무릎(위로 솟는 쪽) — 거미 다리
const archKnee=(a,b,l1,l2)=>{const dx=b[0]-a[0],dy=b[1]-a[1],D0=Math.hypot(dx,dy)||1,d=Math.min(D0,l1+l2-.01),q=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-q*q)),ux=dx/D0,uy=dy/D0;
 const k1=[a[0]+ux*q-uy*h,a[1]+uy*q+ux*h],k2=[a[0]+ux*q+uy*h,a[1]+uy*q-ux*h];return k1[1]<k2[1]?k1:k2;};
const web=(p,cx,cy,r,a0,a1,n=6)=>{const g=grp(p,{opacity:.5}),A2=[];for(let i=0;i<=n;i++)A2.push(lerp(a0,a1,i/n));A2.forEach(a=>ink(g,`M${f(cx)} ${f(cy)}L${f(cx+Math.cos(a)*r)} ${f(cy+Math.sin(a)*r)}`,.35));
 for(let q=.28;q<1;q+=.18){let d='';for(let i=0;i<n;i++){const a=A2[i],b=A2[i+1],m=(a+b)/2;d+=`M${f(cx+Math.cos(a)*r*q)} ${f(cy+Math.sin(a)*r*q)}Q${f(cx+Math.cos(m)*r*q*.84)} ${f(cy+Math.sin(m)*r*q*.84)} ${f(cx+Math.cos(b)*r*q)} ${f(cy+Math.sin(b)*r*q)}`;}ink(g,d,.3);}return g;};
const dark=(p,d,fill,w=1)=>el('path',{d,fill,stroke:INK,'stroke-width':w,'stroke-linejoin':'round','stroke-linecap':'round'},p);
const whiten=(w,fill='#ece7f5',line='#6d6585')=>{const c=w.g.children;for(let i=0;i<c.length;i++)c[i].setAttribute('style',i?'stroke:'+line:'fill:'+fill);return w;};
// ───────── dist01 거미동굴 ─────────
A.add({zone:'dist01',paper:'#15121d',ink:'#d9d4e6',sky:[[0,'#0a0810'],[0.6,'#191426'],[1,'#110e19']],line:'rgba(170,140,220,.45)',D:18,
 subs:[[1.0,5.4,'흩어진 기억이 어느 정도 이어지는 것은 동굴에 들어선 뒤부터였다.'],[6.0,10.4,'흰 날개 사이로 여덟 개의 거미 다리를 뻗은 여인이 나타났다.'],[10.8,13.4,'한때 천사였던 보라검 천사였다.'],[13.9,17.3,'나는 인간에게 선을 선택할 여지가 남아 있다고 믿으며 무기를 들었다.']],
 build(k){const R=seeded(101),GR=300,S=1.1,VIO='#9a78e0',DK='#08060d';
  const cam=k.track([[0,236,196,1.3],[5.2,300,190,1.22],[5.7,468,146,1.45,'cut'],[8.8,460,196,1.3],[10.6,440,190,1.5],[13.6,438,186,1.62],[13.9,318,184,1.0,'cut'],[18,300,190,1.16]]),dip=dipper(k,[5.7,13.9]);
  k.glowAt(20,210,200,'#4b3d7a',k.far);
  for(let i=0;i<8;i++){const x=R(-40,700),w=R(18,40),h=R(60,150);el('path',{d:Lp([[x-w,330],[x-w*.3,330-h],[x+w*.2,330-h*.8],[x+w,330]],true),fill:'#0e0b16',stroke:INK,'stroke-width':.5,opacity:.45},k.far);}
  const ceil=[[-110,-30]];for(let x=-110;x<=750;x+=R(16,30)){ceil.push([x,R(40,56)]);if(R(0,1)<.4){const h=R(26,78);ceil.push([x+R(4,7),56+h]);ceil.push([x+R(9,13),R(42,54)]);}}ceil.push([750,-30]);
  dark(k.back,Lp(ceil,true),'#0d0a15');web(k.back,650,44,170,Math.PI*.5,Math.PI,7);web(k.back,330,46,96,Math.PI*.12,Math.PI*.88,7);web(k.back,-20,50,120,0,Math.PI*.5,5);
  for(let i=0;i<4;i++){const x=[92,402,520,610][i],y=R(96,130);ink(k.back,`M${x} 50L${x} ${f(y-14)}`,.4);sh(k.back,ell(x,y,7,14),.8);hatch(k.back,x-6,y-11,x+6,y+11,3.2,5,.3,null,{opacity:.6});}
  ground(k.root,GR+3,R);scratches(k.root,34,R,GR+8,356);
  for(let i=0;i<7;i++){const x=R(-40,700),w=R(10,26),h=R(6,16);sh(k.root,`M${f(x-w)} ${GR+4}Q${f(x-w*.4)} ${f(GR+4-h)} ${f(x)} ${f(GR+3-h*.8)}Q${f(x+w*.6)} ${f(GR+4-h*.6)} ${f(x+w)} ${GR+4}Z`,.9);}
  // 천장에 매달린 뼈
  const BONE='M-1.5 2L-1.5 16Q-4 17 -3 20Q0 22 3 20Q4 17 1.5 16L1.5 2Q4 1 3 -2Q0 -4 -3 -2Q-4 1 -1.5 2Z',SKULL='M-5 4Q-6 -5 0 -5Q6 -5 5 4L3 5L3 8L-3 8L-3 5Z';
  const bones=[118,170,238,296,372,538,596,62].map((x,i)=>{const th=ink(k.root,'',.4,{opacity:.8}),g=grp(k.root),sk=i%3===1;sh(g,sk?SKULL:BONE,.9);if(sk)bl(g,ell(-2,0,1.1,1.4)+ell(2,0,1.1,1.4));return{x,len:R(46,104)+(i===4?30:0),th,g,p:pendulum(7,.45,R(-.1,.1)),i};});
  // 보라검 천사: 실에 매달려 내려와 여덟 다리로 선다
  const AX=455,thread=ink(k.root,'',.5,{opacity:.7}),legsG=grp(k.root),SL=[];for(let i=0;i<8;i++)SL.push({n:dark(legsG,'',DK,.9),claw:ink(legsG,'',.7),sg:i<4?-1:1,j:i%4});
  const wingsG=grp(k.root),wl=whiten(featherWing(wingsG,.9)),wr=whiten(featherWing(wingsG,.9)),ang=figure(k.root,{robe:'long',robeFill:'#e4def0',hat:HATS.angel,sword:VIO,swordLen:54,seed:5,restF:-8,restN:4});
  const vg=k.glowAt(AX,200,10,VIO),tg=k.glowAt(AX,200,10,VIO);
  const hero=actor(k.root,EGO,0,GR,1,S);hero.w.x=196-STAND.speed*S*4.72;
  const dust=motes(k.front,28,R,[-60,40,720,300],{vy0:-3,vy1:3,vx0:-3,vx1:3,r0:.4,r1:.9});
  dark(k.near,Lp([[-140,-40],[-60,150],[-20,60],[30,120],[70,-40]],true),'#050409',.8);dark(k.near,Lp([[560,-40],[600,96],[640,30],[700,170],[760,-40]],true),'#050409',.8);
  dark(k.near,`M430 372Q470 318 540 326Q600 316 660 372Z`,'#050409',.8);
  let pT=-1;
  return(t,dt)=>{cam(t);dip(t);const w=k.wind.step(t);
   [2.1,3.5,7.8,12.2,15.6].forEach(tk=>{if(pT<tk&&t>=tk)bones.forEach(b=>b.p.kick((b.i%2?1:-1)*(tk===7.8?2.2:1.3)*(0.6+b.i%3*.3)));});pT=t;
   bones.forEach(b=>{const a=b.p.step(w*.25,dt),c=[b.x+Math.sin(a)*b.len,50+Math.cos(a)*b.len];b.th.setAttribute('d',`M${b.x} 50L${pt(c)}`);b.g.setAttribute('transform',`translate(${pt(c)}) rotate(${f(-a*57.3)})`);});
   const go=1-smooth(4.2,4.8,t),raise=es(t,14.3,15.4);
   hero.up(t,dt,go,{wind:w,nearHand:raise>.01?[lerp(54,61,raise),lerp(82,54,raise)]:null,swordAng:lerp(22,132,raise),lean:-3*raise,capeKick:raise*8,headDrop:-raise});
   const land=minJerk(seg(t,5.6,7.7)),ay=lerp(GR-350,GR-30,land)+Math.sin(t*1.2)*2.2*land,show=t>5.5;
   place(ang.g,AX,ay,-1,S);const lift=es(t,11.0,12.4);
   ang.update({pose:STAND.pose(0,0),go:0,dt,t,headDrop:1.4,nearHand:lift>.01?[lerp(52,58,lift),lerp(80,60,lift)]:null,swordAng:lerp(8,104,lift)});
   const root=toScene(AX,ay,-1,35,58,S);thread.setAttribute('d',`M${AX+6} 44L${pt(root)}`);op(thread,show?.7:0);
   SL.forEach((L,i)=>{const pl=es(t,6.2+L.j*.22+(L.sg>0?.12:0),7.3+L.j*.22+(L.sg>0?.12:0)),r0=[root[0]+L.sg*2,root[1]+L.j*2-3],cur=[r0[0]+L.sg*(12+7*L.j),r0[1]+26+9*L.j];
    let ft=[AX+4+L.sg*(44+L.j*31),GR+1];if(L.sg<0&&L.j===1){const u=seg(t,11.4,12.0);ft=[ft[0]-10*ease(u),ft[1]-16*Math.sin(Math.PI*u)];}
    const foot=[lerp(cur[0],ft[0],pl),lerp(cur[1],ft[1],pl)],kn=archKnee(r0,foot,56+L.j*11,70+L.j*15);
    L.n.setAttribute('d',band([r0,[lerp(r0[0],kn[0],.6),lerp(r0[1],kn[1],.6)-4],kn,[lerp(kn[0],foot[0],.5)+L.sg*3,lerp(kn[1],foot[1],.5)],foot],4.6,1.1));L.claw.setAttribute('d',`M${pt(foot)}l${f(L.sg*3.5)} 1.5`);});
   op(legsG,show?1:0);op(wingsG,show?1:0);op(ang.g,show?1:0);
   const wa=lerp(72,20,es(t,7.2,9.2))+Math.sin(t*1.3)*3,wb=toScene(AX,ay,-1,38,47,S);wl.draw([wb[0]-3,wb[1]],-1,wa,80);wr.draw([wb[0]+5,wb[1]],1,wa+4,80);
   setA(vg,{cx:AX,cy:ay-70,r:show?70+6*Math.sin(t*2):0});op(vg,.5*land);
   const tip=ang.st.tip?toScene(AX,ay,-1,ang.st.tip[0],ang.st.tip[1],S):[AX,ay];setA(tg,{cx:tip[0],cy:tip[1],r:10+26*lift});op(tg,show?.5+.5*lift:0);
   dust(t,w,.5);};}});
// ───────── dist02 늪지대의 뿔악마 ─────────
A.add({zone:'dist02',paper:'#101a18',ink:'#d3e0d8',sky:[[0,'#070d0c'],[0.55,'#14221f'],[1,'#0c1513']],line:'rgba(140,200,170,.4)',D:18,
 subs:[[0.9,4.7,'포털을 벗어나자 발이 검은 물속으로 빠져들었다.'],[5.4,9.3,'이내 물밑에서 올라온 손들이 내 발목을 붙잡았다.'],[10.2,13.5,'뿔 끝마다 둥근 것이 매달려 흔들리고 있었다.'],[14.2,17.3,'그것들은 죽은 수호자들의 머리였다.']],
 build(k){const R=seeded(202),WL=262,S=1.1,DK='#060b0a',HY=WL+25;
  const cam=k.track([[0,196,214,1.36],[5,236,224,1.46],[6.2,232,262,2.35],[9.4,236,262,2.5],[9.8,330,196,1.0,'cut'],[13.2,470,170,1.36],[14.2,556,122,2.5],[18,560,116,2.95]]),dip=dipper(k,[9.8]);
  k.glowAt(470,150,230,'#2f5a4a',k.far);for(let i=0;i<7;i++)deadTree(k.far,R(-20,680),WL-R(0,14),R(70,130),R,.7).setAttribute('opacity','.35');
  ink(k.back,`M-100 ${WL-8}Q200 ${WL-12} 420 ${WL-9}T760 ${WL-10}`,.6,{opacity:.6});
  [70,306,402].forEach(x=>deadTree(k.back,x,WL-4,R(120,170),R));
  for(let i=0;i<16;i++){const x=R(-40,690),y=R(40,110);ink(k.back,`M${f(x)} ${f(y)}q${f(R(-3,3))} ${f(R(14,34))} ${f(R(-2,2))} ${f(R(30,60))}`,.35,{opacity:.5});}
  // 건너편 둑과 뿔악마
  dark(k.root,`M452 ${WL+8}Q486 ${WL-12} 540 ${WL-8}Q620 ${WL-14} 760 ${WL-6}L760 ${WL+12}Z`,'#0b1412');hatch(k.root,470,WL-6,740,WL+4,7,-5,.35,R,{opacity:.6});
  const DX=560,DY=WL-8,dg=grp(k.root);
  dark(dg,smoothD([[DX,DY-150],[DX+8,DY-146],[DX+10,DY-134],[DX+22,DY-126],[DX+26,DY-92],[DX+18,DY-60],[DX+22,DY-30],[DX+26,DY],[DX+8,DY],[DX+4,DY-36],[DX-4,DY-36],[DX-8,DY],[DX-26,DY],[DX-22,DY-30],[DX-18,DY-60],[DX-26,DY-92],[DX-22,DY-126],[DX-10,DY-134],[DX-8,DY-146]],true),DK,1.1);
  ink(dg,`M${DX-22} ${DY-122}Q${DX-40} ${DY-90} ${DX-36} ${DY-46}l-4 8m4 -8l1 9m-1 -9l5 7M${DX+22} ${DY-122}Q${DX+42} ${DY-92} ${DX+38} ${DY-50}l-4 8m4 -8l1 9m-1 -9l5 7`,1);
  ink(dg,`M${DX-12} ${DY-104}q12 8 24 0M${DX-10} ${DY-84}q10 6 20 0M${DX-8} ${DY-66}q8 5 16 0`,.5,{opacity:.6});
  const eyes=[-1,1].map(s=>el('ellipse',{cx:DX+s*4,cy:DY-142,rx:1.7,ry:1,fill:'#d8f06a'},dg));
  // 뿔: 가지처럼 갈라지고 끝마다 둥근 것이 매달린다
  const tips=[];[-1,1].forEach(sg=>{const b0=[DX+sg*6,DY-150],m=[DX+sg*26,DY-176],e=[DX+sg*34,DY-206];sh(dg,band([b0,[DX+sg*16,DY-160],m,[DX+sg*31,DY-190],e],6,1.2),1);tips.push(e);
   [[m,[sg*28,-6],[sg*46,-22]],[[DX+sg*17,DY-162],[sg*20,4],[sg*36,6]],[[DX+sg*31,DY-190],[sg*-10,-16],[sg*-12,-34]]].forEach(([a,c,d])=>{const e2=[a[0]+d[0],a[1]+d[1]];sh(dg,band([a,[a[0]+c[0],a[1]+c[1]],e2],3.6,.9),.9);tips.push(e2);});});
  const heads=tips.map((tp,i)=>{const th=ink(k.root,'',.4),g=grp(k.root);sh(g,ell(0,0,4.6,5.6),.9);bl(g,'M-4.6 -1Q-5 -6.4 0 -6.2Q5 -6.2 4.6 -1.4Q0 -3.6 -4.6 -1Z');ink(g,'M-2 5.4l-.6 3M1.6 5.4l.4 3.4',.4);return{tp,len:R(16,34),th,g,p:pendulum(8,.35,R(-.3,.3)),i};});
  // 포털(지나온 문)
  const portal=grp(k.root);el('ellipse',{cx:26,cy:206,rx:24,ry:62,fill:'none',stroke:'#9fd8ff','stroke-width':1.4},portal);el('ellipse',{cx:26,cy:206,rx:17,ry:50,fill:'none',stroke:'#9fd8ff','stroke-width':.6,opacity:.6},portal);const pg=k.glowAt(26,206,90,'#6fb8ff');
  const hero=actor(k.root,EGO,60,HY,1,S,SHUF);
  // 물: 다리를 덮는 면 + 잔물결
  el('rect',{x:-120,y:WL,width:880,height:160,fill:'#0b1513',opacity:.84},k.front);ink(k.front,`M-120 ${WL}Q100 ${WL-1.6} 330 ${WL}T760 ${WL-.6}`,.8);
  const rip=[];for(let i=0;i<30;i++)rip.push([ink(k.front,'',.45,{opacity:.6}),R(-80,720),R(WL+6,352),R(8,26),R(.3,1)]);
  const rings=[0,1,2].map(()=>el('ellipse',{fill:'none',stroke:INK,'stroke-width':.6},k.front));
  const arms=[-26,-12,4,18,34].map((off,i)=>({off,n:sh(k.front,'',.9),fin:ink(k.front,'',.6),i}));
  const fog=fogBand(k,k.front,9,R,176,268,'#b8d0c4');
  for(let i=0;i<9;i++){const x=i<5?R(-70,90):R(560,720),h=R(70,150);ink(k.near,`M${f(x)} 372Q${f(x+R(-6,6))} ${f(372-h*.5)} ${f(x+R(-14,14))} ${f(372-h)}`,1.6,{opacity:.9});}
  return(t,dt)=>{cam(t);dip(t);const w=k.wind.step(t);
   const go=1-smooth(4.3,5.0,t),pry=es(t,6.6,7.6)*(1-es(t,9.6,10.6));
   hero.up(t,dt,go*.9,{wind:w,headDrop:3.2*es(t,5.2,6)*(1-es(t,10,11)),lean:14*pry,nearHand:pry>.01?[lerp(50,56,pry),lerp(84,78,pry)]:null,swordAng:18});
   op(portal,1-es(t,2.2,4.2));op(pg,.8*(1-es(t,2.2,4.2)));
   rip.forEach(([n,x,y,len,sp])=>{const xx=((x+t*sp*5+w*t)%860+860)%860-90;n.setAttribute('d',`M${f(xx)} ${f(y)}q${f(len/2)} -1.6 ${f(len)} 0`);});
   const hx=hero.w.x;rings.forEach((r,i)=>{const u=((t*.5+i/3)%1);setA(r,{cx:hx,cy:WL+2,rx:10+u*34,ry:2+u*5});op(r,(1-u)*.7);});
   arms.forEach(a=>{const u=es(t,5.5+a.i*.28,6.7+a.i*.28)*(1-es(t,9.5,10.2)),bx=hx+a.off*.6,hand=[hx+a.off*.36+Math.sin(t*2.3+a.i)*1.2,lerp(WL+8,WL-13-(a.i%2)*5,u)];
    a.n.setAttribute('d',u>.02?band([[bx,WL+12],[lerp(bx,hand[0],.45)+a.off*.08,lerp(WL+12,hand[1],.5)],hand],3,2.2):'');
    a.fin.setAttribute('d',u>.02?[-1,0,1].map(q=>`M${pt(hand)}l${f(q*2.6-Math.sign(a.off||1)*1.6)} ${f(-4.6+Math.abs(q))}`).join(''):'');});
   heads.forEach(h=>{const a=h.p.step(w*.5+Math.sin(t*.9+h.i)*.25,dt),c=[h.tp[0]+Math.sin(a)*h.len,h.tp[1]+Math.cos(a)*h.len];h.th.setAttribute('d',`M${pt(h.tp)}L${f(c[0])} ${f(c[1]-5)}`);h.g.setAttribute('transform',`translate(${pt(c)}) rotate(${f(-a*40)})`);});
   eyes.forEach((e,i)=>op(e,.6+.4*Math.sin(t*5+i)));fog(t,w,1);};}});
// ───────── dist03 무너진 성 ─────────
A.add({zone:'dist03',paper:'#1a1512',ink:'#e2d8cc',sky:[[0,'#0d0907'],[0.6,'#241914'],[1,'#17110d']],line:'rgba(230,150,90,.42)',D:18,
 subs:[[0.9,4.7,'북쪽으로 걸어갈수록 발밑의 재가 두꺼워져 갔다.'],[6.0,8.6,'성 안에는 검은 기둥 일곱 개가 서 있었다.'],[8.9,13.7,'기둥 사이에서 불길이 솟아오르자 그 뒤로 박쥐 날개가 펴졌고, 불길이 조금 잠잠해진 뒤에는 황소의 뿔이 드러났다.'],[14.1,17.3,'뿔을 보자 발록이라는 이름이 입안에 맴돌았다.']],
 build(k){const R=seeded(303),GR=298,S=1.08,FIRE='#f0823c';
  const cam=k.track([[0,190,204,1.32],[5.4,372,196,1.26],[5.8,320,186,1.0,'cut'],[8.6,320,182,1.07],[12.4,340,166,1.28],[13.8,362,110,1.9],[18,362,100,2.3]]),dip=dipper(k,[5.8]);
  const A1=grp(k.root),B0=grp(k.back),B1=grp(k.root),Bg=grp(k.glow);
  // A: 재 덮인 길, 무너진 성벽
  k.glowAt(560,210,200,'#7a3a1e',k.far);
  const wall=[[400,GR+3],[400,190],[416,186],[420,150],[446,154],[450,120],[480,126],[486,168],[500,172],[506,GR+3]],wall2=[[556,GR+3],[560,176],[580,160],[584,112],[612,108],[618,84],[650,90],[656,60],[760,60],[760,GR+3]];
  dark(A1,Lp(wall,true),'#0c0908');dark(A1,Lp(wall2,true),'#0c0908');
  for(let i=0;i<26;i++){const x=R(404,750),y=R(100,GR-6);if(x>500&&x<560)continue;ink(A1,`M${f(x)} ${f(y)}l${f(R(8,16))} 0m${f(-R(4,10))} 0l0 ${f(R(5,8))}`,.35,{opacity:.6});}
  for(let i=0;i<6;i++){const x=R(506,556),w=R(6,14);sh(A1,`M${f(x-w)} ${GR+4}L${f(x-w*.4)} ${f(GR-R(4,12))}L${f(x+w*.6)} ${f(GR-R(2,9))}L${f(x+w)} ${GR+4}Z`,.8);}
  [[60,150,60],[150,190,40],[250,170,52]].forEach(([x,y,w])=>el('path',{d:Lp([[x-w,330],[x-w,y+20],[x-w*.6,y+20],[x-w*.6,y],[x-w*.1,y+6],[x,y-30],[x+w*.4,y-24],[x+w*.5,y+14],[x+w,y+18],[x+w,330]],true),fill:'#120c0a',stroke:INK,'stroke-width':.5,opacity:.5},k.far));
  for(let x=404;x<500;x+=16)dark(A1,Lp([[x,190-(x>416?36:0)-(x>446?30:0)],[x,182-(x>416?36:0)-(x>446?30:0)],[x+7,182-(x>416?36:0)-(x>446?30:0)],[x+7,190-(x>416?36:0)-(x>446?30:0)]],false),'none',.7);
  ink(A1,'M430 200l6 30l-8 26l10 30M470 150l-6 40l8 30M600 130l-8 46l10 40l-6 50M690 80l-10 60l8 70',.5,{opacity:.7});
  ground(A1,GR+3,R);for(let i=0;i<40;i++){const x=R(-80,720),y=R(GR+6,356);ink(A1,`M${f(x)} ${f(y)}q${f(R(4,9))} ${f(-R(1,3))} ${f(R(10,18))} 0`,.4,{opacity:.7});}
  const chainP=[[150,GR+6],[210,GR+9],[290,GR+5],[370,GR+8],[450,GR+4],[530,GR+2],[590,GR-4]],chain=ink(A1,'',.7);
  const hero=actor(A1,EGO,40,GR,1,S);
  // B: 성 안, 검은 기둥 일곱 개와 불길
  k.glowAt(320,200,260,'#5a2412',B0);
  const bal=balrog(B0,{eye:'#ffb04a'});
  const circ=grp(B1,{opacity:.7});[[250,26],[190,19],[120,11]].forEach(([rx,ry])=>el('ellipse',{cx:320,cy:GR+22,rx,ry,fill:'none',stroke:INK,'stroke-width':.6},circ));
  for(let i=0;i<18;i++){const a=i/18*6.283;ink(circ,`M${f(320+Math.cos(a)*190)} ${f(GR+22+Math.sin(a)*19)}L${f(320+Math.cos(a)*250)} ${f(GR+22+Math.sin(a)*26)}`,.4);}
  ground(B1,GR+2,R);scratches(B1,26,R,GR+34,358);
  const fl=[];for(let i=0;i<11;i++)fl.push({f:flame(B1,i%3?null:FIRE,.9),x:298+i*12.8+R(-3,3),h:R(.6,1.15),w:R(16,26),ph:R(0,9)});
  for(let i=0;i<7;i++)pillar(B1,68+i*84,56,GR-2,28,R);
  const hero2=actor(B1,EGO,118,GR+26,1,.92);const shadowB=el('path',{d:'',fill:'#000',opacity:.5},B1);
  const fg=k.glowAt(362,GR-20,10,FIRE,Bg),eg=k.glowAt(362,96,10,'#ff9a4a',Bg);
  const ash=motes(k.front,46,R,[-60,-10,720,330],{vy0:9,vy1:22,vx0:-8,vx1:2,r0:.5,r1:1.4}),emb=motes(k.front,24,R,[200,40,440,300],{vy0:-34,vy1:-14,vx0:-6,vx1:6,fill:FIRE,r0:.5,r1:1.2});
  return(t,dt)=>{cam(t);dip(t);const w=k.wind.step(t),inB=t>=5.8;vis(A1,!inB);vis(B0,inB);vis(B1,inB);vis(Bg,inB);
   const trip=es(t,2.0,2.4)*(1-es(t,2.6,3.3)),go=(1-.75*trip)*(1-smooth(5.5,5.8,t));
   hero.up(t,dt,go,{wind:w,lean:9*trip,headDrop:2.4*es(t,2.2,2.8)*(1-es(t,4,4.8)),swordAng:20});
   const lift=es(t,2.2,3.2);let cd='';for(let i=0;i<chainP.length-1;i++){const a=chainP[i],b=chainP[i+1],n=9;for(let j=0;j<n;j++){const u=j/n,x=lerp(a[0],b[0],u),y=lerp(a[1],b[1],u)-lift*5*Math.sin(Math.PI*((i+u)/(chainP.length-1)))-Math.sin(Math.PI*u)*-2;cd+=j%2?`M${f(x-3)} ${f(y)}L${f(x+3)} ${f(y)}`:ell(x,y,3.4,1.7);}}chain.setAttribute('d',cd);op(chain,.25+.75*lift);
   const up=es(t,8.7,9.8),down=es(t,12.3,13.6),open=es(t,9.6,11.6);
   fl.forEach((q,i)=>{const mid=1-Math.abs(i-5)/7,h=(12+150*up*mid-104*down*mid)*q.h;q.f.draw(q.x,GR+4,q.w,Math.max(6,h),t,q.ph);});
   bal.draw(362,GR-4,1.24,open,t);op(bal.G,es(t,9.2,10.4));
   setA(fg,{r:60+170*up-90*down+8*Math.sin(t*9)});setA(eg,{r:20+40*down});op(eg,down);
   hero2.up(t,dt,0,{wind:w,headDrop:-1.6*up,swordAng:lerp(20,40,es(t,16,17.4)),nearHand:t>16?[lerp(54,58,es(t,16,17.4)),lerp(84,74,es(t,16,17.4))]:null});
   const hp=hero2.at(40,120);shadowB.setAttribute('d',`M${f(hp[0]-8)} ${f(hp[1])}L${f(hp[0]+8)} ${f(hp[1])}L${f(hp[0]-70-20*up)} ${f(hp[1]+16)}L${f(hp[0]-96-20*up)} ${f(hp[1]+12)}Z`);op(shadowB,.5*up);
   ash(t,w,inB?.45:.9);emb(t,0,inB?up*(1-.6*down):0);};}});
// ───────── dist04 시체들이 되살아난 밤 ─────────
A.add({zone:'dist04',paper:'#19130f',ink:'#e4d9cb',sky:[[0,'#120806'],[0.5,'#2a150d'],[1,'#150f0b']],line:'rgba(230,150,90,.42)',D:17,
 subs:[[0.9,4.5,'불타는 성 안쪽에 묘지처럼 보이는 언덕이 있었다.'],[5.0,8.5,'흙이 무너지려는 줄 알았는데 벌어진 틈에서 팔이 불쑥 솟았다.'],[8.9,13.0,'시체가 쌓인 자리에서 다시 살아난 몸들이 하나씩 일어났다.'],[14.0,16.4,'그들은 곧장 달려들었다.']],
 build(k){const R=seeded(404),GR=300,S=1.08,FIRE='#f0823c';
  const prof=x=>x<380?GR:GR-96*Math.pow(Math.sin(Math.PI*clamp((x-380)/340,0,1)),0.8);
  const cam=k.track([[0,196,202,1.3],[4.4,256,202,1.24],[5.2,468,238,1.75],[8.4,474,232,1.95],[9.2,504,214,1.36],[13.6,480,208,1.24],[14.8,330,196,1.02],[17,300,200,1.14]]);
  // 불타는 성(먼 곳)
  const rp=[[-60,330]];for(let x=-60;x<=720;x+=26){const y=96+((x/26|0)%2?0:14)+R(-3,3)+(x>300&&x<420?-46:0);rp.push([x,y],[x+26,y]);}rp.push([720,330]);
  el('path',{d:Lp(rp,true),fill:'#100907',stroke:INK,'stroke-width':.6,opacity:.6},k.far);k.glowAt(330,90,300,'#8a3416',k.far);
  const ff=[];for(let i=0;i<10;i++)ff.push({f:flame(k.far,i%2?FIRE:'#c8501e',.7),x:R(-20,680),w:R(14,30),h:R(24,60),ph:R(0,9)});
  for(let i=0;i<5;i++){const x=R(-40,360);ink(k.back,`M${f(x)} ${GR-2}l${f(R(-4,4))} ${f(-R(30,60))}m-6 12l12 -3`,.7,{opacity:.55});}
  ground(k.root,GR+3,R);scratches(k.root,30,R,GR+8,356);
  // 언덕: 흙이 아니라 쌓인 몸들
  const mp=[];for(let x=332;x<=724;x+=8)mp.push([x,prof(x)+R(-1.5,1.5)]);el('path',{d:smoothD(mp)+`L724 ${GR+4}L332 ${GR+4}Z`,fill:'#0f0b09'},k.root);ink(k.root,smoothD(mp),1.1);
  for(let i=0;i<34;i++){const x=R(396,706),y=lerp(prof(x)+8,GR+26,R(0,1)**1.4),w=R(9,17);ink(k.root,`M${f(x-w)} ${f(y+3)}Q${f(x-w*.4)} ${f(y-R(4,8))} ${f(x)} ${f(y-2)}Q${f(x+w*.5)} ${f(y-R(3,7))} ${f(x+w)} ${f(y+3)}`,.5,{opacity:.75});
   if(i%4===0)sh(k.root,`M${f(x-4)} ${f(y-3)}Q${f(x)} ${f(y-10)} ${f(x+4)} ${f(y-3)}Z`,.6);if(i%5===1)ink(k.root,`M${f(x)} ${f(y)}l${f(R(-8,8))} ${f(-R(8,16))}`,.7);}
  [[430,-.2],[584,.25],[650,.1]].forEach(([x,a])=>ink(k.root,`M${x} ${f(prof(x)+4)}l${f(Math.sin(a)*46)} ${f(-Math.cos(a)*46)}`,.9));
  const bulge=dark(k.root,'','#0f0b09',1),arm=sh(k.root,'',1),fin=ink(k.root,'',.7),dirt=[0,1,2,3,4,5,6].map(()=>ink(k.root,'',.6));
  const DEAD={robe:'uniform',robeFill:'#3a322c',hat:HATS.helm,hatFill:'#4a4038',legs:'#2a2420',sword:'#8a8478',swordLen:36};
  const risen=[[452,0],[502,.7],[560,1.5],[618,2.2],[676,2.9]].map(([x,d],i)=>{const a=actor(k.root,Object.assign({seed:i*1.7},DEAD),x,prof(x)+3,-1,S*R(.94,1.04),RUN);return{a,d,i};});
  const hero=actor(k.root,EGO,0,GR,1,S);hero.w.x=176-STAND.speed*S*3.9;
  const fg=k.glowAt(470,250,10,FIRE);const emb=motes(k.front,30,R,[-60,-10,720,320],{vy0:-22,vy1:-8,vx0:-10,vx1:4,fill:FIRE,r0:.5,r1:1.2});
  dark(k.near,'M-120 372Q-60 300 20 320Q70 310 120 372Z','#070504',.8);
  return(t,dt)=>{cam(t);const w=k.wind.step(t);
   ff.forEach(q=>q.f.draw(q.x,104,q.w,q.h*(.8+.2*Math.sin(t*2+q.ph))*(1-.45*es(t,4.2,5.6)*(1-es(t,8,9.5))),t,q.ph));
   const hv=es(t,4.9,5.6)*(1-es(t,8.6,9.6)),br=es(t,6.3,6.75),bx=468,by=prof(468);
   bulge.setAttribute('d',`M${bx-30} ${f(by+10)}Q${bx-12} ${f(by-10*hv+wobble(t*7,1)*2*hv)} ${bx} ${f(by-14*hv)}Q${bx+14} ${f(by-10*hv)} ${bx+30} ${f(by+12)}`);
   const hand=[bx+3+Math.sin(t*3)*1.5*br,by-6-40*br];arm.setAttribute('d',br>.02?band([[bx,by+4],[bx-3,lerp(by,hand[1],.5)],hand],5.4,3.6):'');
   fin.setAttribute('d',br>.02?[-2,-1,0,1,2].map(q=>`M${pt(hand)}l${f(q*2.4)} ${f(-6.5+Math.abs(q)*1.2)}`).join(''):'');
   dirt.forEach((n,i)=>{const u=seg(t,6.3,7.1),a=-1.57+(i-3)*.42;n.setAttribute('d',u>0&&u<1?`M${f(bx+Math.cos(a)*(8+u*26))} ${f(by-4+Math.sin(a)*(8+u*26)+u*u*20)}l${f(Math.cos(a)*5)} ${f(Math.sin(a)*5)}`:'');});
   const rush=smooth(13.9,14.3,t);
   risen.forEach(({a,d,i})=>{const u=es(t,8.8+d*.8,10.2+d*.8),stand=u>=.999;a.w.y=prof(a.w.x)+3;
    a.up(t,dt,rush*(stand?1:0),{legPts:stand?null:crouch(30*(1-u)),drop:stand?0:30*(1-u),lean:lerp(38,6,u)+10*rush,headDrop:lerp(7,2,u),swordAng:lerp(10,60,rush),nearHand:rush>.01?[lerp(52,58,rush),lerp(84,66,rush)]:null});op(a.g,es(t,8.7+d*.8,9.1+d*.8));});
   const go=1-smooth(3.5,4.1,t),guard=es(t,13.6,14.6);
   hero.up(t,dt,go,{wind:w,nearHand:guard>.01?[lerp(54,60,guard),lerp(82,52,guard)]:null,swordAng:lerp(22,150,guard),lean:-4*guard,capeKick:guard*6,legPts:guard>.5?crouch(6):null,drop:guard>.5?6:0});
   setA(fg,{r:30+50*br});op(fg,.5*br*(1-es(t,8,9)));emb(t,w,.8);};}});
// ───────── dist05 일곱 기둥 ─────────
A.add({zone:'dist05',paper:'#17141c',ink:'#e6dfd2',sky:[[0,'#0b0a10'],[0.6,'#1d1922'],[1,'#141118']],line:'rgba(240,220,160,.42)',D:16,
 subs:[[0.9,4.9,'소환진 쪽으로 들어갈수록 기둥에서 나오는 빛이 짙어졌다.'],[5.4,8.5,'빛 너머에서는 커다란 그림자만이 움직였다.'],[9.2,13.0,'깊게 팬 채찍 자국이 있었고, 그 자국이 지나간 기둥 틈에는 불씨가 남아 있었다.'],[13.3,15.7,'움직이는 그림자 대신 바닥의 흔적을 따라 나갔다.']],
 build(k){const R=seeded(505),GR=286,S=1.08,LIGHT='#ffe9b0',FIRE='#f0823c';
  const cam=k.track([[0,200,196,1.3],[5,270,190,1.22],[5.6,400,170,1.3],[9,380,172,1.34],[9.9,300,318,2.0],[13,410,316,2.1],[13.8,350,226,1.16],[16,380,220,1.22]]);
  const lg=k.glowAt(470,170,300,LIGHT,k.back);lg.setAttribute('opacity','.5');const shG=grp(k.back,{filter:'url(#r880soft2)',opacity:.0}),bal=balrog(shG,{fill:'#040306',eye:'#040306',stroke:'#040306'});
  // 기둥과 빛
  const PX=[252,320,388,456,524,592,660],beams=PX.map(x=>{const c=k.glowAt(0,0,60,LIGHT);return{c,x};});
  // 바닥(원근): 채찍 자국
  for(let i=0;i<9;i++){const y=GR+8+i*i*1.1+i*3;ink(k.root,`M-90 ${f(y)}L730 ${f(y+R(-1,1))}`,.35,{opacity:.4});}
  for(let i=0;i<14;i++){const x=-60+i*60;ink(k.root,`M${f(lerp(320,x,.86))} ${GR+8}L${f(lerp(320,x,1.3))} 372`,.3,{opacity:.3});}
  const G1=[[40,348],[120,330],[210,326],[300,334],[380,322],[470,316],[560,322],[650,312],[730,306]];
  dark(k.root,band(G1,7,4),'#050407',.9);ink(k.root,smoothD(G1.map(p=>[p[0],p[1]-6])),.4,{opacity:.6});
  for(let i=0;i<G1.length-1;i++)for(let j=0;j<5;j++){const u=j/5,x=lerp(G1[i][0],G1[i+1][0],u),y=lerp(G1[i][1],G1[i+1][1],u);ink(k.root,`M${f(x)} ${f(y+4)}l${f(R(3,6))} ${f(R(3,7))}`,.35,{opacity:.6});}
  ground(k.root,GR+3,R);
  PX.forEach(x=>pillar(k.root,x,40,GR,24,R));
  const embers=[];PX.slice(0,6).forEach((x,i)=>{for(let j=0;j<3;j++){const ex=x+22+R(0,22),ey=GR+R(6,40);embers.push({n:el('circle',{cx:f(ex),cy:f(ey),r:f(R(1,2.2)),fill:FIRE},k.root),g:k.glowAt(ex,ey,9,FIRE),ph:R(0,9)});}});
  const hero=actor(k.root,EGO,10,GR,1,S);
  const haze=el('rect',{x:-80,y:-40,width:820,height:440,fill:LIGHT,opacity:0,style:'mix-blend-mode:screen'},k.front);
  const dust=motes(k.front,36,R,[160,20,720,290],{vy0:-6,vy1:2,vx0:-3,vx1:3,fill:LIGHT,r0:.4,r1:1});
  return(t,dt)=>{cam(t);const w=k.wind.step(t),grow=es(t,.5,6);
   beams.forEach((b,i)=>{const pulse=1+.08*Math.sin(t*3+i);b.c.setAttribute('transform',`translate(${b.x} ${GR-120}) scale(${f((.55+.5*grow)*pulse)} ${f(3.4)})`);op(b.c,.35+.6*grow);});
   op(haze,.05+.12*grow*(1-es(t,9.2,10)*.7)+.05*es(t,14,16));
   const sx=lerp(560,404,es(t,5.2,9.4))+wobble(t*.8,1)*6;bal.draw(sx,GR+26,1.34,.35+.25*Math.sin(t*.9),t);op(shG,.8*es(t,4.6,5.8)*(1-es(t,13,14.5)*.6));
   embers.forEach(e=>{const v=.5+.5*Math.sin(t*4+e.ph)**2;op(e.n,v);op(e.g,v*.8);});
   const sh1=es(t,2,3)*(1-es(t,9.2,10.2)),look=es(t,9,9.8),go=(1-smooth(4.6,5.2,t))+smooth(13.4,13.9,t);
   hero.up(t,dt,go*(t>13?1:.8),{wind:w,farHand:sh1>.01?[lerp(46,52,sh1),lerp(80,33,sh1)]:null,headDrop:3.4*look-1*sh1,lean:2*look,swordAng:20});
   dust(t,w,.4+.4*grow);};}});
// ───────── dist06 추락 ─────────
A.add({zone:'dist06',paper:'#1a1210',ink:'#ead9c8',sky:[[0,'#1c0806'],[0.5,'#2c130c'],[1,'#140c0a']],line:'rgba(240,160,90,.45)',D:18,
 subs:[[0.9,5.2,'마침내 궁전의 중심부에 닿자 마지막 봉인 너머로 발록이 모습을 드러냈다.'],[5.7,10.0,'발록이 검을 휘두르자 공간이 갈라지고, 하늘을 뒤덮은 불덩이가 쏟아졌다.'],[10.5,13.4,'나는 무너진 기둥 뒤에서 숨을 고르며 간신히 버텼다.'],[14.0,17.2,'그때 천사가 따뜻한 기운으로 나를 감쌌다.']],
 build(k){const R=seeded(606),GR=304,S=1.0,FIRE='#f0823c',WARM='#ffd98a',BX=474,BY=336,BS=1.62;
  const cam=k.track([[0,372,196,1.28],[5.2,384,176,1.04],[5.7,400,170,1.12],[7.2,392,166,1.2],[10.2,380,172,1.1],[10.4,300,252,2.1,'cut'],[13.6,306,244,2.3],[14.2,300,224,1.7],[18,340,212,1.44]]),dip=dipper(k,[10.4]);
  k.glowAt(430,150,330,'#8a2c14',k.far);
  const bal=balrog(k.back,{eye:'#ffc060'}),armG=grp(k.back);dark(armG,band([[0,0],[34,6],[66,0]],16,10),'#060508',1.1);dark(armG,Lp([[62,-7],[212,-3],[226,0],[212,4],[62,8]],true),'#1a0d0a',1.1);ink(armG,'M70 0L206 0',.5,{opacity:.7});dark(armG,Lp([[58,-14],[66,-14],[66,15],[58,15]],true),'#060508',1);
  const trail=el('path',{d:'',fill:'none',stroke:'#ffe2b0','stroke-width':3,'stroke-linecap':'round',opacity:0},k.glow),tear=el('path',{d:'',fill:'#fff0d0',stroke:FIRE,'stroke-width':.8,opacity:0},k.glow),tg=k.glowAt(330,84,10,'#ffb060');
  // 마지막 봉인
  const seal=grp(k.root),sr=grp(seal);[126,112,74].forEach((r,i)=>el('circle',{cx:0,cy:0,r,fill:'none',stroke:WARM,'stroke-width':i?0.7:1.4},sr));
  for(let i=0;i<28;i++){const a=i/28*6.283;el('path',{d:`M${f(Math.cos(a)*112)} ${f(Math.sin(a)*112)}L${f(Math.cos(a)*126)} ${f(Math.sin(a)*126)}`,stroke:WARM,'stroke-width':.7,fill:'none'},sr);if(i%4===0)el('circle',{cx:f(Math.cos(a)*93),cy:f(Math.sin(a)*93),r:5,fill:'none',stroke:WARM,'stroke-width':.7},sr);}
  const crack=el('path',{d:'M-90 -70L-40 -44L-52 -10L-6 8L-20 44L30 66L22 100M-6 8L44 -20L70 -64M30 66L84 60',fill:'none',stroke:'#fff','stroke-width':1.3,opacity:0},seal),sg=k.glowAt(BX-20,170,150,WARM);
  ground(k.root,GR+3,R);scratches(k.root,30,R,GR+8,358);
  [[150,170],[600,150],[668,96]].forEach(([x,top])=>pillar(k.root,x,top,GR,30,R,{broken:1}));
  for(let i=0;i<8;i++){const x=R(180,700),w=R(6,16);sh(k.root,`M${f(x-w)} ${GR+4}L${f(x-w*.3)} ${f(GR-R(3,10))}L${f(x+w*.5)} ${f(GR-R(2,8))}L${f(x+w)} ${GR+4}Z`,.8);}
  // 천사(빛)·영웅·무너진 기둥
  const angG=grp(k.root),wl=whiten(featherWing(angG,.8),'#fff3d6','#b89a6a'),wr=whiten(featherWing(angG,.8),'#fff3d6','#b89a6a'),ag=k.glowAt(120,250,10,WARM);
  const angel=figure(angG,{robe:'long',robeFill:'#fff3d6',hat:HATS.angel,seed:7});
  const hero=actor(k.root,EGO,0,GR,1,S);hero.w.x=284-STAND.speed*S*4.7;pillar(k.root,330,214,GR,34,R,{broken:1});sh(k.root,`M350 ${GR+3}L360 ${GR-16}L388 ${GR-12}L400 ${GR+3}Z`,.9);
  const balls=[];for(let i=0;i<18;i++)balls.push({n:el('circle',{r:f(R(3,6.5)),fill:FIRE},k.glow),tr:el('path',{d:'',fill:'none',stroke:'#ffc27a','stroke-width':f(R(1,2.2)),'stroke-linecap':'round'},k.glow),x:R(60,760),t0:7.7+R(0,2.6),sp:R(150,230),ph:R(0,1)});
  const emb=motes(k.front,34,R,[-60,-10,720,330],{vy0:-26,vy1:-8,vx0:-8,vx1:8,fill:FIRE,r0:.5,r1:1.3});
  return(t,dt)=>{cam(t);dip(t);const w=k.wind.step(t),shake=es(t,6.9,7.3)*(1-es(t,9.6,10.4));k.cam.x+=wobble(t*31,1)*4*shake;k.cam.y+=wobble(t*27+3,1)*3*shake;
   bal.draw(BX,BY,BS,.45+.4*es(t,3,5),t);op(bal.G,.15+.85*es(t,1.4,4));
   const sw=minJerk(seg(t,6.5,7.15)),a=lerp(-118,34,sw)-10*es(t,5.7,6.5),sx=BX-46*BS,sy=BY-124*BS;armG.setAttribute('transform',`translate(${f(sx)} ${f(sy)}) scale(-${BS} ${BS}) rotate(${f(a)})`);op(armG,es(t,1.4,4));
   const a0=(180+118)*Math.PI/180,a1=(180-a)*Math.PI/180,rr=215*BS*.9;trail.setAttribute('d',sw>.02?`M${f(sx+Math.cos(a0)*rr)} ${f(sy-Math.sin(a0)*rr)}A${f(rr)} ${f(rr)} 0 0 0 ${f(sx+Math.cos(a1)*rr)} ${f(sy-Math.sin(a1)*rr)}`:'');op(trail,sw*(1-es(t,7.2,8)));
   const tu=es(t,7.05,7.6);let top='',bot='';const TP=[[70,30],[130,62],[170,48],[236,92],[280,76],[340,118],[400,100],[470,150],[540,136]];TP.forEach((p,i)=>{const wd=Math.sin(Math.PI*i/(TP.length-1))*13*tu;top+=(i?'L':'M')+f(p[0])+' '+f(p[1]-wd);bot=`L${f(p[0])} ${f(p[1]+wd)}`+bot;});tear.setAttribute('d',top+bot+'Z');op(tear,tu*(1-.35*es(t,9,10.4)));setA(tg,{cx:300,cy:92,r:60+120*tu});op(tg,.7*tu);
   op(seal,1-es(t,2.9,4.3));seal.setAttribute('transform',`translate(${BX-20} 170) scale(${f(1+.25*es(t,2.9,4.3))})`);sr.setAttribute('transform',`rotate(${f(t*9)})`);op(crack,es(t,1.5,2.5));op(sg,.5*(1-es(t,2.9,4.3)));
   balls.forEach(b=>{const u=((t-b.t0)/2.2+b.ph*0);if(t<b.t0){op(b.n,0);b.tr.setAttribute('d','');return;}const q=u%1,x=b.x-q*150,y=-30+q*(GR+50);setA(b.n,{cx:x,cy:y});op(b.n,1);b.tr.setAttribute('d',`M${f(x)} ${f(y)}L${f(x+34)} ${f(y-70)}`);op(b.tr,.6);});
   const hide=es(t,7.4,8.4)*(1-es(t,15.2,16.2)),warm=es(t,13.9,15.6),go=(1-smooth(4.4,5,t))*(t<6?1:0)+smooth(16.4,16.9,t);
   hero.up(t,dt,go,{wind:w,legPts:hide>.4?crouch(22*hide):null,drop:hide>.4?22*hide:0,lean:12*hide,headDrop:3*hide-2*es(t,1,3)*(1-es(t,6,7)),swordAng:lerp(22,58,hide)});
   const hb=hero.at(38,48+22*hide),wa=lerp(80,30,warm)+Math.sin(t*1.6)*3,ax=hero.w.x-22,ay=GR-14-6*warm;place(angel.g,ax,ay,1,S*1.12);angel.update({pose:STAND.pose(0,0),go:0,dt,t,headDrop:2,nearHand:[lerp(50,62,warm),lerp(70,52,warm)]});
   const ab=toScene(ax,ay,1,38,47,S*1.12);wl.draw([ab[0]-4,ab[1]],-1,wa,78);wr.draw([ab[0]+4,ab[1]],1,wa-34*warm,74);op(angG,warm*.9);setA(ag,{cx:hb[0],cy:hb[1]+10,r:30+90*warm+5*Math.sin(t*3)});op(ag,warm);
   emb(t,w,.5+.5*shake);};}});
// ───────── ep1a08 피로 물든 병원 ─────────
const FONT='"Gowun Batang","Noto Serif KR","Nanum Myeongjo",serif';
A.add({zone:'ep1a08',paper:'#182024',ink:'#dde6e8',sky:[[0,'#0e1417'],[0.5,'#1c272b'],[1,'#131a1d']],line:'rgba(190,225,235,.42)',D:17,
 subs:[[0.9,4.9,'눈을 뜨자 차가운 형광등과 소독약 냄새가 나를 맞았다.'],[5.7,8.7,'갑옷 대신 환자복을 입고 있었고, 손목은 침대에 묶여 있었다.'],[8.85,11.1,'가까운 곳에서 가느다란 전자음이 이어졌다.'],[11.6,16.4,'복도에는 피가 흐르고 벽에는 도움을 청하는 붉은 글씨가 적혀 있었다.']],
 build(k){const R=seeded(708),S=1.1,COLD='#cfeaf2',RED='#b8392f';
  const cam=k.track([[0,320,168,1.12],[5.4,320,158,1.3],[5.6,286,206,1.55,'cut'],[8.6,318,202,1.7],[10.8,408,180,2.5],[11.2,320,190,1.0,'cut'],[17,320,184,1.2]]),dip=dipper(k,[5.6,11.2]);
  const A1=grp(k.root),A2=grp(k.glow),Af=grp(k.front),B1=grp(k.root),B2=grp(k.glow),C1=grp(k.root),C2=grp(k.glow);
  // A: 천장의 형광등(누운 눈으로 본)
  for(let i=0;i<9;i++){const y=30+i*38;ink(A1,`M-80 ${y}L720 ${f(y+R(-1,1))}`,.35,{opacity:.4});}for(let i=0;i<13;i++){const x=-40+i*60;ink(A1,`M${f(lerp(320,x,.9))} -30L${f(lerp(320,x,1.12))} 380`,.35,{opacity:.4});}
  sh(A1,Lp([[150,138],[490,138],[498,176],[142,176]],true),1.1);const tubes=[150,164].map(y=>pa(A1,COLD,Lp([[166,y-3],[474,y-3],[474,y+3],[166,y+3]],true),.8));ink(A1,'M160 144L160 170M480 144L480 170',.8);
  const lampG=k.glowAt(0,0,90,COLD,A2);const lidT=el('path',{d:'',fill:'#030405'},Af),lidB=el('path',{d:'',fill:'#030405'},Af);
  const after=el('rect',{x:166,y:144,width:308,height:26,fill:'#fff',opacity:0,filter:'url(#r880soft2)'},Af);
  // B: 침대, 묶인 손목, 심전도
  ink(B1,'M-80 262L720 262',.9);for(let i=0;i<10;i++)ink(B1,`M${f(R(-60,700))} ${f(R(270,350))}l${f(R(8,20))} 0`,.35,{opacity:.6});
  ink(B1,'M-80 96L720 96',.4,{opacity:.5});
  sh(B1,Lp([[184,262],[184,196],[192,192],[196,196],[196,262]],true),1);sh(B1,Lp([[196,238],[354,238],[358,252],[196,252]],true),1.1);ink(B1,'M204 252L204 262M346 252L346 262M196 245L356 245',.8);
  sh(B1,'M204 238Q202 228 214 228L242 229Q250 230 248 238Z',.9);
  const L2S=(lx,ly)=>[325+S*(ly-120),229-S*(lx-40)],lie=grp(B1,{transform:'translate(325 229) rotate(-90)'}),pat=figure(lie,PATIENT);place(pat.g,0,0,1,S);
  sh(B1,'M262 239Q262 214 286 216L328 218Q338 226 336 239Z',1);ink(B1,'M274 222q10 6 4 16M300 220q8 8 2 18',.4,{opacity:.6});
  const strap=sh(B1,'',.9),strapL=ink(B1,'',.8);
  ink(B1,'M168 262L168 112M160 262L176 262M168 112L182 112',1);sh(B1,'M176 114L188 114L190 140Q182 148 174 140Z',.9);const tube=ink(B1,'',.5,{opacity:.8});
  sh(B1,Lp([[420,262],[420,200],[426,200],[426,262]],true),.9);ink(B1,'M408 262L438 262',1);dark(B1,Lp([[392,150],[456,150],[456,198],[392,198]],true),'#0a1114',1.1);
  const ecg=el('path',{d:'',fill:'none',stroke:'#7af0c0','stroke-width':1.1,'stroke-linejoin':'round'},B1),eg=k.glowAt(424,174,40,'#5ad0a0',B2);ink(B1,'M392 198Q380 230 344 244',.5,{opacity:.7});
  // C: 복도 — 피, 붉은 글씨, 다가오는 의사
  const VP=[320,172],pp=(x,y,u)=>[lerp(VP[0],x,u),lerp(VP[1],y,u)],U0=.2;
  [[-60,-40],[700,-40],[700,400],[-60,400]].forEach(c=>ink(C1,`M${pt(pp(c[0],c[1],U0))}L${pt(c)}`,1));ink(C1,Lp([[-60,-40],[700,-40],[700,400],[-60,400]].map(c=>pp(c[0],c[1],U0)),true),.9);
  [.3,.42,.6,.84].forEach(u=>{ink(C1,Lp([pp(-60,400,u),pp(-60,-40,u),pp(700,-40,u),pp(700,400,u)]),.35,{opacity:.45});});
  [.36,.56].forEach((u,i)=>[-1,1].forEach(sg=>{const x=sg<0?-60:700,u2=u*1.28;sh(C1,Lp([pp(x,400,u),pp(x,60,u),pp(x,60,u2),pp(x,400,u2)],true),.9);const kb=pp(x,230,sg<0?u2*.94:u*1.05);ink(C1,`M${pt(kb)}l${sg*-3} 0`,1);}));
  const lights=[.3,.5,.8].map(u=>{const a=pp(250,-40,u),b=pp(390,-40,u),c=pp(390,-40,u*1.14),d=pp(250,-40,u*1.14);return{n:pa(C1,COLD,Lp([a,b,c,d],true),.7),g:k.glowAt((a[0]+b[0])/2,(a[1]+c[1])/2,40+u*60,COLD,C2),u};});
  const blood=el('path',{d:'',fill:RED,stroke:'#7a1f18','stroke-width':.8,opacity:.92},C1);
  const scr=[];for(let r=0;r<3;r++)for(let i=0;i<7;i++){const u=.5+i*.065,x=-60,y=120+r*44;let d='M'+pt(pp(x,y+R(-8,8),u));for(let j=1;j<5;j++)d+='L'+pt(pp(x,y+R(-16,16),u+j*.014));scr.push({n:el('path',{d,fill:'none',stroke:RED,'stroke-width':f(1+u*1.4),'stroke-linecap':'round','stroke-linejoin':'round',opacity:0},C1),o:r*.5+i*.16});
   if(i%3===1){const q=pp(x,y+14,u+.03);scr.push({n:el('path',{d:`M${pt(q)}l0 ${f(R(10,26)*u)}`,fill:'none',stroke:RED,'stroke-width':f(.8+u),'stroke-linecap':'round',opacity:0},C1),o:r*.5+i*.16+.3});}}
  const doc=actor(C1,{robe:'coat',robeFill:'#e6eef0',legs:'#3a454a',hat:HATS.doctor,seed:4},0,0,-1,.74);const fl0=pp(320,400,.62)[1];doc.w.y=fl0;doc.w.x=372+STAND.speed*.74*3.6;
  const dsh=el('ellipse',{rx:16,ry:3,fill:'#000',opacity:.4},C1);
  return(t,dt)=>{cam(t);dip(t);const a=t<5.6,b=t>=5.6&&t<11.2,c=t>=11.2;vis(A1,a);vis(A2,a);vis(Af,a);vis(B1,b);vis(B2,b);vis(C1,c);vis(C2,c);
   const fk=(Math.sin(t*37)>.86||Math.sin(t*5.3)>.97)?.45:1;
   if(a){const o=es(t,.5,2.4)*(1-.9*es(t,3.3,3.55)*(1-es(t,3.7,4.3))),h=o*210;lidT.setAttribute('d',`M-90 -60L730 -60L730 ${f(150-h)}Q320 ${f(182-h*1.25)} -90 ${f(150-h)}Z`);lidB.setAttribute('d',`M-90 420L730 420L730 ${f(170+h)}Q320 ${f(150+h*1.2)} -90 ${f(170+h)}Z`);
    tubes.forEach(n=>op(n,fk));lampG.setAttribute('transform',`translate(320 158) scale(${f(2.3)} ${f(.8+.1*fk)})`);op(lampG,.85*fk);op(after,.55*es(t,3.3,3.55)*(1-es(t,4.2,5.2)));}
   if(b){const tw=es(t,7.2,7.5)*(1-es(t,8.3,8.9));pat.update({pose:STAND.pose(0,0),go:0,dt,t,nearHand:[47+wobble(t*9,1)*1.6*tw,74+tw*-3],farHand:[35,74],headTurn:wobble(t*2,1)*.6});
    const wr=L2S(pat.st.handN[0],pat.st.handN[1]);strap.setAttribute('d',Lp([[wr[0]-4,wr[1]-3],[wr[0]+3,wr[1]-3],[wr[0]+3,wr[1]+3],[wr[0]-4,wr[1]+3]],true));strapL.setAttribute('d',`M${f(wr[0])} ${f(wr[1]+3)}Q${f(wr[0]+2)} ${f(wr[1]+10)} ${f(wr[0]+4)} 245`);
    const el2=L2S(pat.st.handN[0]-4,pat.st.handN[1]-12);tube.setAttribute('d',`M182 146Q190 200 ${f(lerp(182,el2[0],.6))} 214T${pt(el2)}`);
    let d='';for(let i=0;i<=60;i++){const x=394+i,ph=((i/60*2.4-t*.9)%1+1)%1;let y=174;if(ph<.06)y-=ph/.06*4;else if(ph<.1)y+=10;else if(ph<.16)y-=18;else if(ph<.2)y+=5;else if(ph<.3&&ph>.24)y-=3;d+=(i?'L':'M')+x+' '+f(y);}ecg.setAttribute('d',d);op(eg,.5+.3*Math.sin(t*9));}
   if(c){const u=es(t,11.3,15.6),fr=q=>lerp(U0+.02,1.2,q*u),w0=q=>(6+50*q*u);const L=[],Rr=[];for(let i=0;i<=8;i++){const q=i/8,uu=fr(q),cx=330+Math.sin(q*5+1)*26*q;L.push(pp(cx-w0(q),400,uu));Rr.push(pp(cx+w0(q)*(.7+.3*Math.sin(q*9)),400,uu));}
    blood.setAttribute('d',smoothD(L)+smoothD(Rr.reverse()).replace('M','L')+'Z');
    scr.forEach(s=>op(s.n,es(t,11.5+s.o,12+s.o)*.95));lights.forEach((l,i)=>{const v=i===1?fk:1;op(l.n,v);op(l.g,.6*v);});
    const go=1-smooth(15.0,15.6,t);doc.up(t,dt,go,{headDrop:1,farHand:t>15.4?[lerp(44,56,es(t,15.4,16.4)),lerp(80,58,es(t,15.4,16.4))]:null});setA(dsh,{cx:doc.w.x,cy:fl0+2});}};}});
// ───────── ep1a09 주사실 ─────────
A.add({zone:'ep1a09',paper:'#171f22',ink:'#dbe4e2',sky:[[0,'#0d1315'],[0.5,'#1a2527'],[1,'#12191b']],line:'rgba(230,210,150,.42)',D:16,
 subs:[[0.9,5.2,'목소리가 이끄는 곳으로 시선을 돌리자 복도 끝에 주사실이라는 글씨가 보였다.'],[5.8,8.2,'손끝이 떨리고 혀가 말랐다.'],[8.9,12.4,'서랍 깊은 곳에서 펜타닐이라고 적힌 약병을 찾았다.'],[13.0,15.8,'몸은 약을 원했고, 천사는 그 약액을 성수라고 믿게 했다.']],
 build(k){const R=seeded(709),GR=296,S=1.1,COLD='#cfeaf2',WARM='#ffdf9a';
  const cam=k.track([[0,214,202,1.32],[4.0,330,194,1.3],[5.3,548,150,2.6],[5.6,300,238,3.3,'cut'],[8.4,304,236,3.6],[8.6,372,214,1.6,'cut'],[10.6,418,226,3.0],[12.6,418,222,3.4],[13,356,206,1.5],[16,362,196,1.72]]),dip=dipper(k,[5.6,8.6]);
  const A1=grp(k.root),A2=grp(k.glow),B1=grp(k.root),B2=grp(k.glow);
  // A: 복도, 끝의 주사실 문
  ink(A1,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(A1,'M-80 70L720 70',.5,{opacity:.6});ink(A1,`M-80 ${GR-34}L500 ${GR-34}M604 ${GR-34}L720 ${GR-34}`,.4,{opacity:.5});
  for(let i=0;i<16;i++)ink(A1,`M${f(R(-60,700))} ${f(R(GR+10,354))}l${f(R(8,22))} 0`,.35,{opacity:.55});
  [[60,GR],[330,GR]].forEach(([x])=>{sh(A1,Lp([[x,GR+3],[x,128],[x+62,128],[x+62,GR+3]],true),1);sh(A1,Lp([[x+40,150],[x+54,150],[x+54,190],[x+40,190]],true),.6);ink(A1,`M${x+8} ${GR-76}l6 0`,1.2);});
  sh(A1,Lp([[518,GR+3],[518,120],[588,120],[588,GR+3]],true),1.2);ink(A1,`M553 120L553 ${GR+3}M542 ${GR-80}l6 0M558 ${GR-80}l6 0`,.8);sh(A1,Lp([[520,92],[586,92],[586,114],[520,114]],true),1);
  const sign=el('text',{x:553,y:108.5,'font-size':13,'text-anchor':'middle',fill:INK,'font-family':FONT,'font-weight':700},A1);sign.textContent='주사실';
  const cl=[150,440].map(x=>({n:pa(A1,COLD,Lp([[x,70],[x+70,70],[x+66,77],[x+4,77]],true),.7),g:k.glowAt(x+35,96,80,COLD,A2)})),sg=k.glowAt(553,104,10,WARM,A2);
  const hero=actor(A1,PATIENT,110,GR,1,S,SHUF);
  // B: 주사실 안 — 서랍, 약병
  ink(B1,`M-80 ${GR+3}L720 ${GR+3}`,1);ink(B1,'M-80 70L720 70',.5,{opacity:.6});
  sh(B1,Lp([[376,GR+3],[376,150],[492,150],[492,GR+3]],true),1.2);[178,206,262].forEach(y=>{ink(B1,`M376 ${y}L492 ${y}`,.8);ink(B1,`M426 ${y+12}l16 0`,1.2);});
  sh(B1,Lp([[384,150],[384,116],[484,116],[484,150]],true),.9);ink(B1,'M384 133L484 133M410 116L410 150M446 116L446 150',.4,{opacity:.7});
  [[394,126],[402,124],[420,127],[454,125],[466,127]].forEach(([x,y])=>sh(B1,`M${x-3} ${y+6}L${x-3} ${y-2}L${x-1.4} ${y-4}L${x+1.4} ${y-4}L${x+3} ${y-2}L${x+3} ${y+6}Z`,.5));
  const drawer=grp(B1);sh(drawer,Lp([[376,206],[376,234],[492,234],[492,206]],true),1.1);ink(drawer,'M426 220l16 0',1.4);dark(drawer,Lp([[376,206],[492,206],[484,198],[384,198]],true),'#0a0f10',.9);
  const vial=grp(B1);sh(vial,'M-4 0L-4 -11Q-4 -13 -2.4 -14L-2.4 -17L2.4 -17L2.4 -14Q4 -13 4 -11L4 0Z',.8);pa(vial,'#9fd0c8','M-3.2 -1L-3.2 -6L3.2 -6L3.2 -1Z',.3);sh(vial,'M-4.4 -10.4L4.4 -10.4L4.4 -5.6L-4.4 -5.6Z',.4);bl(vial,'M-2.8 -19L2.8 -19L2.8 -17L-2.8 -17Z');
  const lab=el('text',{x:0,y:-6.9,'font-size':2.9,'text-anchor':'middle',fill:INK,'font-family':FONT,'font-weight':700},vial);lab.textContent='펜타닐';
  const hero2=actor(B1,PATIENT,326,GR,1,S,SHUF),vg=k.glowAt(0,0,10,WARM,B2),rays=[0,1,2,3,4,5,6].map(()=>el('path',{d:'',fill:'none',stroke:WARM,'stroke-width':.8,'stroke-linecap':'round'},B2));
  const wg=grp(B1,{opacity:0}),wl=whiten(featherWing(wg,.8),'#fff6e0','#b8a070'),wr=whiten(featherWing(wg,.8),'#fff6e0','#b8a070');B1.insertBefore(wg,hero2.g);
  const fth=[];for(let i=0;i<9;i++)fth.push({n:pa(B1,'#fff6e0','M0 -5Q3 0 0 6Q-3 0 0 -5Z',.4),x:R(250,430),y:R(-60,60),ph:R(0,6),sp:R(14,26)});
  const lamp2=pa(B1,COLD,Lp([[250,70],[330,70],[326,77],[254,77]],true),.7),lg2=k.glowAt(290,100,90,COLD,B2);
  return(t,dt)=>{cam(t);dip(t);const a=t<8.6,b=!a;vis(A1,a);vis(A2,a);vis(B1,b);vis(B2,b);const fk=(Math.sin(t*41)>.84||Math.sin(t*4.7)>.96)?.4:1;
   if(a){const go=1-smooth(4.2,4.9,t),tr=es(t,5.3,5.7);hero.up(t,dt,go*.9,{headDrop:1.6-2.4*es(t,1.4,2.6),lean:3,nearHand:tr>.01?[56+wobble(t*11,1)*1.3,lerp(84,64,tr)+wobble(t*13+2,1)*1.1]:null,farHand:tr>.01?[50+wobble(t*10+5,1)*1.1,lerp(84,70,tr)]:null});
    cl.forEach((c,i)=>{const v=i?fk:1;op(c.n,v);op(c.g,.55*v);});setA(sg,{r:30+40*es(t,3.6,5.2)});op(sg,.6*es(t,3,5));
    if(t>=5.6){const hp=hero.at(hero.st.handN[0],hero.st.handN[1]);k.cam.x=hp[0]-6;k.cam.y=hp[1]-4;}}
   if(b){const open=es(t,9.0,9.9),take=es(t,12.5,13.3),lift=es(t,13.2,14.4),holy=es(t,13.4,15);drawer.setAttribute('transform',`translate(${f(-30*open)} ${f(2*open)})`);
    hero2.up(t,dt,0,{headDrop:2.4-3.4*lift,lean:6-5*lift,nearHand:[lerp(lerp(56,66,es(t,9.2,10.4)),60,lift),lerp(lerp(84,74,es(t,9.2,10.4)),46,lift)]});
    const hp=hero2.at(hero2.st.handN[0],hero2.st.handN[1]),rest=[lerp(440,418,open),lerp(205,204,open)],vp=[lerp(rest[0],hp[0]+2,take),lerp(rest[1],hp[1]+3,take)];vial.setAttribute('transform',`translate(${pt(vp)}) scale(${f(1+.25*take)})`);op(vial,es(t,9.3,9.9));
    setA(vg,{cx:vp[0],cy:vp[1]-8,r:8+60*holy+3*Math.sin(t*4)});op(vg,.25*open+.75*holy);
    rays.forEach((n,i)=>{const an=-1.57+(i-3)*.42+Math.sin(t*.7+i)*.05,r0=12,r1=30+26*holy+6*Math.sin(t*2+i*1.3);n.setAttribute('d',`M${f(vp[0]+Math.cos(an)*r0)} ${f(vp[1]-8+Math.sin(an)*r0)}L${f(vp[0]+Math.cos(an)*r1)} ${f(vp[1]-8+Math.sin(an)*r1)}`);op(n,holy*.8);});
    const wb=hero2.at(36,46),wa=lerp(86,34,holy)+Math.sin(t*1.4)*3;wl.draw([wb[0]-22,wb[1]-18],-1,wa,84);wr.draw([wb[0]-10,wb[1]-18],1,wa-10,84);op(wg,holy*.5);
    fth.forEach(q=>{const y=((q.y+(t-13)*q.sp)%300+300)%300+20;q.n.setAttribute('transform',`translate(${f(q.x+Math.sin(t*1.2+q.ph)*10)} ${f(y)}) rotate(${f(Math.sin(t*1.5+q.ph)*40)})`);op(q.n,holy*.85);});
    op(lamp2,fk*(1-.5*holy));op(lg2,.5*fk*(1-.6*holy));}};}});
// ───────── last304 중립 지역의 재각성 ─────────
const GOB={robe:'uniform',robeFill:'#4f6a4a',legs:'#33402f',hat:HATS.goblin,hatFill:'#6f8c62',sword:'#9aa08a',swordLen:30};
function forest(k,R,x0,x1,GR){for(let i=0;i<9;i++){const x=R(x0-40,x1+40);pine(k.far,x,GR-R(6,20),R(90,150),R,.7).setAttribute('opacity','.35');}
 for(let i=0;i<8;i++){const x=lerp(x0,x1,i/7)+R(-14,14);pine(k.back,x,GR+R(-4,2),R(120,190),R,1).setAttribute('opacity','.75');}}
A.add({zone:'last304',paper:'#182028',ink:'#d9dde6',sky:[[0,'#0e1320'],[0.5,'#27303f'],[0.82,'#3b3a46'],[1,'#1a1f27']],line:'rgba(190,200,230,.42)',D:18,
 subs:[[0.8,3.6,'차가운 뺨에 젖은 풀잎이 붙어 있었다.'],[4.0,7.4,'풀을 떼어 내고 천천히 몸을 일으켰다.'],[8.8,12.2,'들판 건너편으로 무너져 내린 고성이 보였다.'],[13.2,17.4,'숲 쪽에서 수상한 기척이 느껴져 몸을 낮추자 슬라임과 늑대, 고블린 무리가 드러났다.']],
 build(k){const R=seeded(304),GR=300,S=1.1,HX=196;
  const cam=k.track([[0,150,276,2.3],[2.6,160,268,2.1],[7.4,214,216,1.45],[8.4,236,208,1.32],[9.4,330,186,1.02],[12.6,424,150,1.5],[13.4,372,212,1.24],[18,468,222,1.6]]);
  k.glowAt(420,230,330,'#5a5670',k.far);for(let i=0;i<22;i++)el('circle',{cx:f(R(0,640)),cy:f(R(6,120)),r:f(R(.4,.9)),fill:INK,opacity:f(R(.3,.8))},k.far);
  // 언덕 위 무너진 고성
  el('path',{d:'M196 306Q340 168 470 160Q580 156 760 270L760 306Z',fill:'#131924'},k.back);ink(k.back,'M196 306Q340 168 470 160Q580 156 760 270',.8);
  const cg=grp(k.back);dark(cg,Lp([[404,170],[404,112],[412,112],[412,104],[420,104],[420,112],[428,112],[430,84],[440,70],[452,90],[452,128],[470,134],[470,112],[478,118],[486,104],[494,120],[494,150],[520,156],[520,128],[530,128],[530,120],[540,128],[544,160],[404,172]],true),'#0d121b',1);
  ink(cg,'M416 130l0 12M440 100l0 10M482 128l0 12M452 128l-10 14l8 10M508 150l4 -18',.5,{opacity:.7});dark(cg,'M436 150L436 136Q441 128 446 136L446 150Z','#182028',.6);
  for(let i=0;i<5;i++){const x=R(380,560),y=R(150,172);sh(cg,`M${f(x)} ${f(y)}l${f(R(4,9))} ${f(-R(3,6))}l${f(R(3,7))} ${f(R(3,6))}Z`,.5);}
  for(let i=0;i<7;i++)pine(k.back,R(250,400),R(236,262),R(40,70),R,.7).setAttribute('opacity','.6');
  forest(k,R,540,720,GR);
  ground(k.root,GR+3,R);scratches(k.root,26,R,GR+10,356);
  const g1=grass(k.root,90,R,-60,700,GR+2,5,13);
  // 영웅: 누웠다가 일어난다
  const hw=grp(k.root),hero=figure(hw,HWANDO);place(hero.g,0,0,1,S);
  const leaf=pa(k.root,'#7fae6a','M0 0Q4 -3 9 0Q4 2 0 0Z',.5);
  // 숲 가장자리의 무리
  const slime=dark(k.root,'','#3f7a5c',1),sgl=ink(k.root,'',.5,{opacity:.7}),sS=spring(26,3.4);
  const wf=wolf(k.root,{x:648,y:GR+2,dir:-1,s:1.25,phase:.3});
  const gobs=[[600,.8,0],[668,.74,.4]].map(([x,sc,ph],i)=>({a:actor(k.root,Object.assign({seed:i*3.1},GOB),x,GR+1,-1,sc,STAND),ph}));
  const g2=grass(k.front,60,R,-60,700,GR+8,8,20),fog=fogBand(k,k.front,8,R,236,300,'#c9d3ea',.05,.11);
  for(let i=0;i<10;i++){const x=i<6?R(-70,120):R(590,720),h=R(50,120);ink(k.near,`M${f(x)} 380Q${f(x+R(-5,5))} ${f(380-h*.5)} ${f(x+R(-16,16))} ${f(380-h)}`,1.3,{opacity:.45});}
  let hx=HX,ph=0;
  return(t,dt)=>{cam(t);const w=k.wind.step(t);g1(t,w);g2(t,w);fog(t,w,1);
   const up1=minJerk(seg(t,3.8,5.4)),up2=minJerk(seg(t,5.8,7.3)),duck=es(t,12.9,13.9),go=smooth(8.6,9.0,t)*(1-smooth(11.4,12,t));
   ph+=dt/STAND.period*go;hx+=STAND.speed*S*dt*go;
   const rot=lerp(lerp(-86,-8,up1),0,up2),cr=lerp(lerp(0,30,up1),0,up2)+16*duck,pose=STAND.pose(ph,go),wipe=es(t,1.6,2.4)*(1-es(t,3,3.6));
   hw.setAttribute('transform',`translate(${f(hx)} ${GR}) rotate(${f(rot)})`);
   hero.update({pose,go,dt,t,wind:w,legPts:go<.01&&cr>3?crouch(cr):null,drop:go<.01?cr:0,lean:lerp(0,34,up1)*(1-up2)+12*duck,headDrop:2*(1-up2)+1.6*duck,nearHand:wipe>.01?[lerp(56,49,wipe),lerp(80,36,wipe)]:null,swordAng:lerp(lerp(86,40,up1),22,up2)+30*duck,farHand:up1>.01&&up2<1?[lerp(52,58,up1),lerp(84,96,up1)]:null});
   const lu=seg(t,2.3,3.6);leaf.setAttribute('transform',`translate(${f(HX-98+lu*18+Math.sin(lu*9)*5)} ${f(GR-12+lu*12)}) rotate(${f(lu*200)})`);op(leaf,t<2.3?0:1-es(t,3.4,4));
   const show=es(t,12.8,14.2),hop=((t*.9)%1),sq=sS.step(hop<.18?-5:hop>.8?4:0,dt),sx=548-(t>13?(t-13)*7:0),sy=GR+2-Math.max(0,Math.sin(Math.PI*clamp((hop-.18)/.62,0,1)))*9;
   slime.setAttribute('d',smoothD([[sx-17-sq,sy],[sx-13-sq*.6,sy-12+sq],[sx,sy-19+sq*1.4],[sx+13+sq*.6,sy-12+sq],[sx+17+sq,sy]],false)+'Z');sgl.setAttribute('d',`M${f(sx-6)} ${f(sy-12+sq)}q3 -4 7 -3`);op(slime,show);op(sgl,show*.7);
   wf.step(dt,t>13.6?.55:0,t,es(t,14,15)*3);
   gobs.forEach(({a,ph:p0},i)=>{a.up(t,dt,t>14+p0?.5:0,{headDrop:1,swordAng:30,lean:5});op(a.g,show);});};}});
// ───────── last305 고블린 두목과 장미 인장 ─────────
A.add({zone:'last305',paper:'#141c1a',ink:'#d6ddd4',sky:[[0,'#0a100f'],[0.55,'#1b2623'],[1,'#111816']],line:'rgba(170,210,170,.42)',D:17,
 subs:[[0.9,5.4,'어딘가에서 들려오던 피리 소리가 달라지자 내 앞의 늑대가 갑자기 방향을 틀었다.'],[6.0,9.4,'안쪽 숲길을 가로막고 선 고블린 두목이 보였다.'],[11.0,15.6,'늑대들의 이빨 사이를 파고들어 그와 칼을 맞댔다.']],
 build(k){const R=seeded(305),GR=300,S=1.1,CX=524;
  const cam=k.track([[0,232,214,1.5],[3.6,250,214,1.56],[5.6,306,208,1.3],[9.4,500,192,1.7],[10.4,360,204,1.16],[12.6,484,196,1.9],[17,490,192,2.1]]);
  k.glowAt(520,150,260,'#3f5a4a',k.far);forest(k,R,-40,700,GR);
  [40,128,402,602,680].forEach(x=>{const h=R(210,280);dark(k.back,band([[x,GR+4],[x+R(-3,3),GR-h*.5],[x+R(-5,5),GR-h]],R(14,22),R(8,12)),'#0d1412',.9);ink(k.back,`M${x-3} ${GR-30}l2 -40M${x+4} ${GR-90}l-2 -50`,.4,{opacity:.6});});
  ground(k.root,GR+3,R);scratches(k.root,26,R,GR+10,356);ink(k.root,`M-80 ${GR+22}Q200 ${GR+14} 420 ${GR+20}T720 ${GR+16}`,.4,{opacity:.5});
  const g1=grass(k.root,70,R,-60,700,GR+2,4,11);
  const notes=[];for(let i=0;i<8;i++)notes.push({n:ink(k.root,'',.8),ph:i/8,y:R(-10,10)});
  const wf=wolf(k.root,{x:306,y:GR+2,dir:-1,s:1.05}),w2=wolf(k.root,{x:446,y:GR+2,dir:-1,s:1,phase:.4}),w3=wolf(k.root,{x:604,y:GR+3,dir:-1,s:1.08,phase:.7});
  const chief=actor(k.root,Object.assign({},GOB,{swordLen:40,seed:9,belt:1}),CX,GR,-1,1.5);const pipe=ink(k.root,'',1.4);
  const hero=actor(k.root,HWANDO,168,GR,1,S,RUN);
  const sp=spark(k.glow),cg=k.glowAt(0,0,10,'#fff0c8'),fog=fogBand(k,k.front,7,R,240,304,'#b8d0c4',.04,.1),g2=grass(k.front,40,R,-60,700,GR+10,8,18);
  dark(k.near,band([[-30,372],[-36,180],[-20,-40]],60,44),'#060a09',.8);dark(k.near,band([[690,372],[700,160],[684,-40]],56,40),'#060a09',.8);
  let dir=-1;
  return(t,dt)=>{cam(t);const w=k.wind.step(t);g1(t,w);g2(t,w);fog(t,w,1);
   const changed=t>3.5,clash=es(t,12.5,12.8);
   notes.forEach((q,i)=>{const u=((q.ph+t*.22)%1),x=lerp(CX-34,150,u),y=GR-112+q.y+Math.sin(u*9+i)*(changed?10:4);q.n.setAttribute('d',changed?`M${f(x)} ${f(y)}l5 -6l5 7l5 -6`:`M${f(x)} ${f(y)}q5 -5 10 0q5 5 10 0`);op(q.n,Math.sin(Math.PI*u)*.8*(1-es(t,9.4,10)));});
   const turn=es(t,3.7,4.3);dir=lerp(-1,1,turn);wf.dir=Math.abs(dir)<.08?.08:dir;wf.step(dt,smooth(4.3,4.7,t)*(1-smooth(6.3,6.8,t)),t,4*(1-turn)+3*es(t,11,12));
   w2.step(dt,0,t,3+2*Math.sin(t*5)*es(t,10.6,12.4));w3.step(dt,0,t,2+2*Math.sin(t*4.4+1)*es(t,10.6,12.4));
   const play=1-es(t,9.5,10.1),arm=es(t,10.2,11.2);
   chief.up(t,dt,0,{farHand:play>.01?[lerp(48,53,play),lerp(80,37,play)]:null,nearHand:arm>.01?[lerp(52,59,arm)-3*clash,lerp(84,56,arm)]:null,swordAng:lerp(18,128,arm)-6*clash,headDrop:.6,lean:-3*clash});
   const pm=chief.at(46,35),pe=chief.at(64,44);pipe.setAttribute('d',`M${pt(pm)}L${pt(pe)}`);op(pipe,play);
   const run=smooth(10.4,10.7,t)*(1-smooth(11.95,12.2,t)),hold=es(t,12.1,12.6);
   hero.up(t,dt,run,{wind:w,lean:8*run+6*hold,nearHand:hold>.01?[lerp(54,62,hold),lerp(82,52,hold)]:null,swordAng:lerp(24,126,hold)+3*Math.sin(t*20)*clash*(1-es(t,13,16)),capeKick:hold*6,headTurn:es(t,3.6,4.4)*(1-es(t,9.5,10.4))*1.2});
   const ht=hero.st.tip?hero.at(lerp(hero.st.handN[0],hero.st.tip[0],.6),lerp(hero.st.handN[1],hero.st.tip[1],.6)):[440,220];
   const pulse=[12.6,13.7,14.9].map(c=>seg(t,c,c+.5)).find(u=>u>0&&u<1)||0;sp(ht[0],ht[1],pulse,30);setA(cg,{cx:ht[0],cy:ht[1],r:16+30*(pulse>0?1-pulse:0)});op(cg,pulse>0?1-pulse:0);
   const shk=pulse>0?(1-pulse):0;k.cam.x+=wobble(t*33,1)*2.4*shk;k.cam.y+=wobble(t*29+4,1)*1.8*shk;};}});
// ───────── last303 한약과 불면귀 ─────────
A.add({zone:'last303',paper:'#1a2131',ink:'#d9dde6',sky:[[0,'#0f1522'],[0.55,'#1c2536'],[1,'#1a2131']],line:'rgba(200,190,170,.42)',D:18,
 subs:[[0.8,5.2,'자욱한 안개 속에서 앳된 얼굴의 남자가 걸어 나와 탕약을 내밀었다.'],[5.8,8.8,'따뜻한 약을 마신 뒤 흐트러진 정신을 가다듬었다.'],[9.2,13.2,'주민들의 축 처진 어깨에서 검은 안개가 스멀스멀 빠져나왔다.'],[14.0,17.2,'나는 환도를 고쳐 쥐고 그쪽을 겨누었다.']],
 build(k){const R=seeded(35),GR=304,S=1.12,RED='#b8392f',LAMP='#f0b45a',HANBOK='#4a5267',GX=566,GY=214;
  const cam=k.track([[0,330,198,1.25],[4.4,236,214,1.62],[8.6,232,210,1.72],[9.4,430,208,1.5],[12.6,486,198,1.45],[14,372,190,1.02],[18,392,188,1.14]]);
  dark(k.far,'M548 52A20 20 0 1 0 572 82A16 16 0 1 1 548 52Z','#e9e4d4',.6);k.glowAt(560,66,80,'#9fb4ff',k.far);
  const stars=[];for(let i=0;i<26;i++)stars.push([el('circle',{cx:f(R(10,630)),cy:f(R(8,120)),r:f(R(.4,1)),fill:INK},k.far),R(0,6),R(.6,2)]);
  ink(k.back,'M-80 196Q160 194 320 196T720 195',.8);const W8=[];for(let i=0;i<22;i++)W8.push([ink(k.back,'',.5),R(-60,700),R(200,236),R(8,20),R(.2,.6)]);
  const h1=hanok(k.root,26,214,GR-18,64,34,R);hanok(k.root,620,760,GR-24,58,30,R);
  const jg=grp(k.root);sh(jg,smoothD([[388,GR+2],[386,230],[389,196],[395,186],[402,196],[404,230],[402,GR+2]],true),1.1);sh(jg,smoothD([[383,198],[395,182],[407,198],[404,203],[386,203]],true),1);
  ink(jg,'M389 210Q392 207 394 210M397 210Q400 207 402 210M390 222Q395 228 401 222M395 212L394 219',.7);ink(jg,'M388 240L393 252L389 266M401 248L398 262',.45);
  const tal=[[396,236],[118,250],[207,248],[652,252]].map(([x,y],i)=>({x,y,n:paint(k.root,RED,.6),line:pen(k.root,.4),s:spring(30,3.2),i}));
  for(let i=0;i<7;i++){const x=R(90,330),y=GR+R(2,12);sh(k.root,`M${f(x)} ${f(y)}q${f(R(3,6))} ${f(-R(2,4))} ${f(R(7,11))} 0q-4 2 -${f(R(6,10))} 0z`,.6);}
  ground(k.root,GR+4,R);scratches(k.root,30,R,GR+8,356);
  const lan=lantern(k,k.root,196,h1.ye+2,16,LAMP);
  const vill=[[420,1,-1],[456,.96,-1],[492,1.02,-1]].map(([x,sc,dir],i)=>({fg:figure(k.root,{robe:'long',robeFill:HANBOK,hat:HATS.villager,seed:i*2.3,restN:2,restF:-2}),x,sc,dir,sway:spring(6,1.2),i}));
  const youth=actor(k.root,{robe:'long',hat:HATS.topknot,seed:1},0,GR,-1,S,SHUF);youth.w.x=248+SHUF.speed*S*4.35;
  const bowl=grp(k.root);sh(bowl,'M-6 0Q-5 6 0 6.4Q5 6 6 0Z',.9);ink(bowl,'M-6 0L6 0',.9);const steam=[0,1,2].map(()=>ink(k.root,'',.6,{opacity:.8}));
  const hero=actor(k.root,HWANDO,198,GR,1,S);
  const fog=fogBand(k,k.root,9,R,200,300,'#c9d3ea',.08,.16);
  const dk=grp(k.root),blobs=[];for(let i=0;i<34;i++)blobs.push({n:el('ellipse',{fill:'#05070c',opacity:0,filter:'url(#r880soft2)'},dk),src:i%3,r:R(5,13),ph:R(0,6),ang:R(0,6.28),rad:R(6,46),hy:R(-60,60)});
  // 불면귀: 검은 두건 덩어리 + 감기지 않는 눈, 여러 겹의 잔상
  const ghost=grp(k.root,{opacity:0}),echo=[0,1,2,3,4].map(i=>grp(ghost,{opacity:i===4?1:.22})),body=echo.map(e=>el('path',{fill:'#06080e',stroke:INK,'stroke-width':1.1,'stroke-linejoin':'round'},e)),E=echo[4];
  const lid=el('path',{fill:'#e8e3d6',stroke:INK,'stroke-width':.9},E),iris=el('circle',{r:3.4,fill:RED},E),pupil=el('ellipse',{rx:.9,ry:2.6,fill:'#05070c'},E),lidTop=el('path',{fill:'#06080e',stroke:INK,'stroke-width':.9},E);
  const wisps=[0,1,2,3,4].map(()=>ink(E,'',.6)),threads=[0,1,2,3,4,5,6].map(()=>ink(E,'',.45,{opacity:.55})),core=k.glowAt(GX,GY,0,'#ff5a3c');
  return(t,dt)=>{cam(t);const w=k.wind.step(t);
   stars.forEach(([s,ph,sp])=>op(s,.5+.5*Math.sin(t*sp+ph)));W8.forEach(([n,x,y,len,sp])=>{const xx=((x+t*sp*6+w*t)%800+800)%800-70;n.setAttribute('d',`M${f(xx)} ${f(y)}q${f(len/2)} -2 ${f(len)} 0`);});
   tal.forEach(q=>{const a=q.s.step(-w*16+Math.sin(t*3+q.i)*4,dt)*Math.PI/180,x2=q.x+Math.sin(a)*16,y2=q.y+Math.cos(a)*16;q.n.setAttribute('d',`M${f(q.x-3)} ${f(q.y)}L${f(q.x+3)} ${f(q.y)}L${f(x2+3)} ${f(y2)}L${f(x2-3)} ${f(y2)}Z`);q.line.setAttribute('d',`M${f(q.x)} ${f(q.y+3)}L${f(lerp(q.x,x2,.8))} ${f(lerp(q.y,y2,.8))}`);});
   lan.step(t,dt,w*.7);fog(t,w,.9);
   const yGo=1-smooth(3.9,4.4,t),offer=es(t,4.3,5.2)*(1-es(t,5.6,6));
   youth.up(t,dt,yGo,{nearHand:offer>.01?[lerp(54,63,offer),lerp(84,62,offer)]:(t<4.3?[56,70]:null),headDrop:1.2});op(youth.g,.5+.5*es(t,.4,2.8)-.55*es(t,9,10.4));
   const take=es(t,5.5,6),drink=es(t,6.2,7)*(1-es(t,7.5,8)),drop=es(t,8,8.6),aim=es(t,14.2,15.4);
   hero.up(t,dt,0,{wind:w,farHand:t>5.4&&t<8.7?[lerp(lerp(52,58,take),46,drink),lerp(lerp(78,64,take),34,drink)]:null,nearHand:aim>.01?[lerp(56,66,aim),lerp(84,56,aim)]:null,swordAng:lerp(24,94,aim),lean:5*aim,headDrop:-1.6*drink,capeKick:aim*6});
   let bp,bo=1;if(t<5.75)bp=youth.at(youth.st.handN[0],youth.st.handN[1]);else{bp=hero.at(hero.st.handF[0],hero.st.handF[1]);bo=1-drop;}
   bowl.setAttribute('transform',`translate(${f(bp[0])} ${f(bp[1]-2)}) rotate(${f(-drink*50)})`);op(bowl,bo);
   steam.forEach((n,i)=>{const P=[];for(let j=0;j<6;j++)P.push([bp[0]-3+i*3+wobble(t*1.3+i*2+j*.7,1.2)*2.4+j*w*.8,bp[1]-6-j*4.2]);n.setAttribute('d',smoothD(P));op(n,(1-drink)*bo*(t<7.6?1:0)*.75);});
   const drain=es(t,9,12);
   vill.forEach(v=>{const sw=v.sway.step(Math.sin(t*.9+v.i*1.7)*3*(1-drain)+w*1.2,dt);place(v.fg.g,v.x,GR,v.dir,S*v.sc);v.fg.update({pose:STAND.pose(0,0),go:0,dt,t,lean:sw+drain*6,headDrop:2+drain*3.2});});
   const gather=es(t,10.2,13.2);
   blobs.forEach((b,i)=>{const v=vill[b.src],s0=toScene(v.x,GR,v.dir,41,46,S),emit=seg(t,9+(i%7)*.16,10.4+(i%7)*.16),tg=[GX+Math.cos(b.ang+t*.6)*b.rad*.7,GY+b.hy+Math.sin(b.ang+t*.8)*6];
    setA(b.n,{cx:lerp(s0[0]+Math.sin(t+b.ph)*4,tg[0],gather)+w*5,cy:lerp(s0[1]-emit*18,tg[1],gather),rx:b.r*(.6+.6*emit),ry:b.r*(.45+.4*emit)});op(b.n,Math.min(emit,1)*.85*(1-gather*.7));});
   const form=es(t,12,13.8),split=es(t,14.4,17.4);op(ghost,form);
   echo.forEach((e,i)=>{const off=i===4?0:((i%2?1:-1)*(6+10*split)*(i<2?1:2.1)+3*Math.sin(t*2.3+i));e.setAttribute('transform',`translate(${f(off)} ${f(Math.sin(t*1.7+i)*2)})`);if(i<4)op(e,(i<2?.24:.14*split));
    const sway=Math.sin(t*1.1)*4+w*3,P=[[GX-8+sway*.4,GY-98],[GX+18+sway*.5,GY-84],[GX+30+sway*.3,GY-40],[GX+44,GY+20],[GX+58,GY+80],[GX+28,GY+72],[GX+10,GY+88],[GX-14,GY+70],[GX-40,GY+86],[GX-34,GY+20],[GX-26,GY-46],[GX-22,GY-80]];
    body[i].setAttribute('d',smoothD(P.map((q,j)=>[q[0]+Math.sin(t*1.9+j)*1.6,q[1]+Math.cos(t*1.5+j)*1.4]),true));});
   const bc=(t*.8)%1,close=t>13.4?.75*smooth(0,.55,bc)*(1-smooth(.6,.66,bc)):.3,ex=GX+2,ey=GY-6,eh=14*es(t,12.6,13.6)+1,ix=ex+Math.sin(t*.7)*1.2;
   lid.setAttribute('d',`M${f(ex)} ${f(ey-eh)}Q${f(ex+7)} ${f(ey)} ${f(ex)} ${f(ey+eh)}Q${f(ex-7)} ${f(ey)} ${f(ex)} ${f(ey-eh)}Z`);setA(iris,{cx:ix,cy:ey});setA(pupil,{cx:ix,cy:ey});
   const lc=ey-eh+2*eh*close;lidTop.setAttribute('d',`M${f(ex)} ${f(ey-eh-.5)}Q${f(ex+7.6)} ${f(ey-eh+(lc-ey+eh)*.9)} ${f(ex+.4)} ${f(lc)}Q${f(ex-7.6)} ${f(ey-eh+(lc-ey+eh)*.9)} ${f(ex)} ${f(ey-eh-.5)}Z`);
   wisps.forEach((n,i)=>{const x0=GX-30+i*15,P=[];for(let j=0;j<5;j++)P.push([x0+Math.sin(t*2+i+j)*3+w*j,GY+80+j*5]);n.setAttribute('d',smoothD(P));});
   threads.forEach((n,i)=>{const x0=GX-24+i*8,P=[];for(let j=0;j<5;j++)P.push([x0+Math.sin(t*1.3+i*1.7+j*.9)*3+j*j*.12*(i-3),GY-70+i%3*6+j*22]);n.setAttribute('d',smoothD(P));});
   setA(core,{r:26*form*(1+.15*Math.sin(t*5))});};}});
// 다음 묶음 장면 파일(lineart-scenes-r882.js …)이 같은 도우미를 쓰도록 내준다
window.__STORYWORLD_LINEART_SK_R881__=Object.freeze({STAND,SHUF,RUN,vis,op,dipper,ground,scratches,actor,crouch,EGO,HWANDO,PATIENT,pillar,balrog,deadTree,pine,grass,fogBand,spark,archKnee,web,dark,whiten,FONT});
})();
