// R572 — 사몽 발현 중 영웅 고유 테마(사용자 2026-11-10 "사몽스킬발동시 영웅고유테마 강화": 환도 수묵화·동양화풍 / 윤서하 시공간제어·시계 /
//  네온 전기·생화학·신성공학 / 미카엘라 사랑·의료·정신·신성의학 / 라우렌 중력·행성제어 / 헌터 불과 화살 / 슬레이어 광전사 갑옷·십자군·보혈 /
//  기억사수 미래 기계공학·유령). 사용자가 든 다른 작품은 느낌만 참고하고 이름·그림은 StoryWorld 고유로 만들었다.
//  ① 몸 둘레 문양: R571 불꽃 오라와 함께, 영웅마다 다른 문양을 뒤(몸 뒤)·앞(몸 앞)으로 나눠 그린다.
//  ② 스킬 적중 문양: 사몽 중 스킬(W/E/R·Q 스킬 맥락) 적중 자리에 영웅 문양이 .6초 남는다(기본 공격 제외, 같은 적 .08초 안 한 번, 최대 24개).
//  판정·피해·대기·키는 바꾸지 않는다(그림만). 영웅 스킬 파일은 고치지 않는다. 코드 그림(새 자산 없음), ctx.filter 안 씀, lowFx 면 줄임.
//  슬레이어 십자가는 위가 짧고 아래가 긴 똑바른 형태만(역십자 금지 — crossGeometry 로 검사). localStorage 'storyworld.r572.theme' {on:false} 로 끈다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SAMONG_THEME_R572__)return;
const REV='R572-samong-theme-1',KEY='storyworld.r572.theme',TAU=Math.PI*2;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={motifs:0,marks:0,dropped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const S571=()=>window.__STORYWORLD_SAMONG_SURGE_R571__;
const P=()=>typeof player==='object'&&player?player:null;
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
function active(p=P()){if(!prefs.on||!p)return false;const S=S571();return S?S.active():Number(p.samong)>0&&!(Number(p.hp)<=0);}
const rgba=(c,a)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';
const GOLD=[255,198,72],SILVER=[226,232,242],INK=[18,20,28];
function pal(h){const S=S571();try{if(S?.palette)return S.palette(h);}catch(_){}return{main:SILVER,sub:GOLD};}
// 선 굵기 배율: 멀리 본 카메라(줌 .67)에서도 문양이 1px 로 사라지지 않게 최소 1.2.
const Zf=()=>Math.max(1.2,(typeof zoom==='number'?zoom:1)*1.3);
function line(pts,col,a,w){ctx.strokeStyle=rgba(col,a);ctx.lineWidth=Math.max(1,w);ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function disc(x,y,r,col,a){ctx.fillStyle=rgba(col,a);ctx.beginPath();ctx.arc(x,y,Math.max(.5,r),0,TAU);ctx.fill();}
function ring(x,y,rx,ry,col,a,w,a0=0,a1=TAU){ctx.strokeStyle=rgba(col,a);ctx.lineWidth=Math.max(1,w);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,a0,a1);ctx.stroke();}
// 슬레이어 십자가: 위 팔이 짧고 아래가 긴 똑바른 형태(높이 h 기준).
function crossGeometry(h){return{top:h*.3,bottom:h*.82,arm:h*.28,width:Math.max(2,h*.09)};}

// ---- 영웅별 문양 -------------------------------------------------------------------------------------
// 각 함수: (layer,x,fy,h,F,t,a,low) — fy = 발 높이, h = 몸 높이(px). back 은 몸 뒤, front 는 몸 앞.
const THEMES={
 hwando:{name:'묵화 검무',draw(L,x,fy,h,F,t,a,low){const Z=Zf();
  if(L==='back'){ctx.globalCompositeOperation='source-over';
   // 먹 붓결 세 줄이 몸을 휘감아 오른다(굵은 먹 + 가는 은빛 결)
   for(let k=0;k<(low?2:3);k++){const cy=fy-h*(.25+.3*k),sp=t*(1.6+.4*k)+k*2.1,pts=[];for(let j=0;j<=10;j++){const u=sp+j*.32;pts.push([x+Math.cos(u)*h*(.5-.06*k),cy+Math.sin(u)*h*.16-j*h*.012]);}
    line(pts,INK,.88*a,(7.5-1.5*k)*Z);line(pts,k===1?GOLD:F.main,.75*a,1.3*Z);}
  }else{ctx.globalCompositeOperation='source-over';
   // 튀는 먹방울과 금박 점
   const n=low?4:8;for(let i=0;i<n;i++){const ph=(t*.7+i/n)%1,ang=i*2.4,r=h*(.25+.45*ph);disc(x+Math.cos(ang)*r,fy-h*.5+Math.sin(ang)*r*.5-ph*h*.3,(3.2-2*ph)*Z,INK,.8*(1-ph)*a);}
   disc(x-h*.32,fy-h*1.05,2.6*Z,GOLD,.9*a);}}},
 seoha:{name:'시간의 문자판',draw(L,x,fy,h,F,t,a,low){const Z=Zf();ctx.globalCompositeOperation='lighter';
  if(L==='back'){const rx=h*.72,ry=rx*.36;ring(x,fy,rx,ry,F.main,.55*a,1.6*Z);ring(x,fy,rx*.86,ry*.86,F.sub,.35*a,1*Z);
   const n=low?6:12;for(let i=0;i<n;i++){const u=i*TAU/n,c=Math.cos(u),s=Math.sin(u);line([[x+c*rx*.86,fy+s*ry*.86],[x+c*rx,fy+s*ry]],F.sub,.8*a,(i%3?1:2)*Z);}
   // 시침(느림)·분침(빠름) — 바닥 문자판 위
   line([[x,fy],[x+Math.cos(t*.8)*rx*.45,fy+Math.sin(t*.8)*ry*.45]],F.sub,.9*a,2.4*Z);line([[x,fy],[x+Math.cos(t*4.2)*rx*.78,fy+Math.sin(t*4.2)*ry*.78]],F.main,.9*a,1.4*Z);
   // 머리 뒤 톱니바퀴
   const gx=x+h*.3,gy=fy-h*1.12,gr=h*.16,teeth=10,pts=[];for(let i=0;i<=teeth*2;i++){const u=i*Math.PI/teeth+t*1.5,r=i%2?gr:gr*1.22;pts.push([gx+Math.cos(u)*r,gy+Math.sin(u)*r]);}line(pts,F.main,.6*a,1.3*Z);
  }else{const n=low?3:6;for(let i=0;i<n;i++){const ph=(t*.5+i/n)%1;disc(x+(i-(n-1)/2)*h*.12,fy-h*(1.3-ph*1.2),1.6*Z,F.sub,.8*(1-ph)*a);}}}},
 neon:{name:'생체 회로 성가',draw(L,x,fy,h,F,t,a,low){const Z=Zf();ctx.globalCompositeOperation='lighter';
  // 이중 나선이 몸을 감고 오른다(앞으로 오는 반은 front 에서)
  const steps=low?10:18,A=[],B=[];for(let i=0;i<=steps;i++){const u=i/steps,ang=u*TAU*1.6+t*2.4,y=fy-h*(.05+1.3*u),s=Math.sin(ang);
   const pa=[x+Math.cos(ang)*h*.42,y,s],pb=[x-Math.cos(ang)*h*.42,y,-s];A.push(pa);B.push(pb);}
  const want=L==='back'?-1:1;
  for(const [S,col] of [[A,F.main],[B,F.sub]]){let seg=[];for(const q of S){if(Math.sign(q[2]||-1)===want)seg.push([q[0],q[1]]);else{if(seg.length>1)line(seg,col,.85*a,1.8*Z);seg=[];}}if(seg.length>1)line(seg,col,.85*a,1.8*Z);}
  if(L==='front'){for(let i=0;i<=steps;i+=low?4:3)if(Math.abs(A[i][2])<.6)line([[A[i][0],A[i][1]],[B[i][0],B[i][1]]],F.main,.45*a,1*Z);
   // 성가 회로 번개 두 줄(18번/초 다시 굴림)
   const fr=Math.floor(t*18);for(let k=0;k<(low?1:2);k++){const pts=[];let px=x+(k?h*.35:-h*.35),py=fy-h*1.2;for(let j=0;j<5;j++){pts.push([px,py]);px+=Math.sin(fr*3.1+j*7+k)*h*.12;py+=h*.2;}line(pts,F.sub,.8*a,1.2*Z);}}}},
 michaela:{name:'심박 성의',draw(L,x,fy,h,F,t,a,low){const Z=Zf();ctx.globalCompositeOperation='lighter';
  if(L==='back'){// 몸을 도는 심전도 고리(한 바퀴에 박동 두 번)
   const n=low?40:72,pts=[],cy=fy-h*.55,rx=h*.62,ry=h*.22,beat=(t*1.3)%1;
   for(let i=0;i<=n;i++){const u=i/n,ang=u*TAU,k=(u*2+beat)%1;let spike=0;if(k>.42&&k<.5)spike=-h*.22*Math.sin((k-.42)/.08*Math.PI);else if(k>.5&&k<.55)spike=h*.08*Math.sin((k-.5)/.05*Math.PI);
    pts.push([x+Math.cos(ang)*rx,cy+Math.sin(ang)*ry+spike]);}
   line(pts,F.main,.75*a,1.8*Z);line(pts,F.sub,.35*a,4*Z);
  }else{// 솟는 하트
   const n=low?3:6;for(let i=0;i<n;i++){const ph=(t*.45+i/n)%1,hx=x+Math.sin(i*2.7+t)*h*.4,hy=fy-h*(.2+1.1*ph),s=h*.07*(1-ph*.4);
    ctx.fillStyle=rgba(i%2?F.main:F.sub,.85*(1-ph)*a);ctx.beginPath();ctx.moveTo(hx,hy+s);ctx.quadraticCurveTo(hx-s*1.6,hy-s*.2,hx-s*.8,hy-s);ctx.quadraticCurveTo(hx,hy-s*1.3,hx,hy-s*.5);ctx.quadraticCurveTo(hx,hy-s*1.3,hx+s*.8,hy-s);ctx.quadraticCurveTo(hx+s*1.6,hy-s*.2,hx,hy+s);ctx.closePath();ctx.fill();}}}},
 lauren:{name:'궤도의 왕관',draw(L,x,fy,h,F,t,a,low){const Z=Zf();ctx.globalCompositeOperation='lighter';
  const orbits=low?[[.62,.2,.9,0]]:[[.62,.2,.9,0],[.48,.14,-1.4,2.2],[.78,.26,.55,4.1]];
  if(L==='back'){// 발밑 중력 우물(안으로 줄어드는 고리)
   for(let i=0;i<(low?2:3);i++){const ph=(t*.6+i/3)%1,r=h*(.7-.5*ph);ring(x,fy,r,r*.34,F.main,.55*(1-ph)*a+.1*a,1.4*Z);}
   for(const [rx,ry] of orbits)ring(x,fy-h*.6,h*rx,h*ry,F.sub,.25*a,1*Z);}
  // 행성: 궤도의 뒤 반은 back, 앞 반은 front
  for(const [rx,ry,sp,ph0] of orbits){const u=t*sp+ph0,s=Math.sin(u);if((L==='front')!==(s>0))continue;const px=x+Math.cos(u)*h*rx,py=fy-h*.6+s*h*ry,r=h*.07*(1+.25*s);
   disc(px,py,r*1.8,F.main,.2*a);disc(px,py,r,F.main,.9*a);disc(px-r*.3,py-r*.3,r*.4,F.sub,.9*a);ring(px,py,r*1.7,r*.5,F.sub,.6*a,1*Z);}}},
 hunter:{name:'불화살 문',draw(L,x,fy,h,F,t,a,low){const Z=Zf();
  if(L==='back'){ctx.globalCompositeOperation='lighter';// 몸 뒤 반원에 열린 작은 불의 문, 문마다 화살촉이 바깥을 겨눈다
   const n=low?3:5;for(let i=0;i<n;i++){const u=Math.PI*(1.12+.76*i/(n-1)),gx=x+Math.cos(u)*h*.62,gy=fy-h*.95+Math.sin(u)*h*.42+Math.sin(t*3+i)*h*.03,out=Math.atan2(gy-(fy-h*.5),gx-x);
    ring(gx,gy,h*.1,h*.1,F.main,.75*a,2*Z);disc(gx,gy,h*.08,F.main,.25*a);
    const push=(Math.sin(t*4+i*1.3)*.5+.5)*h*.12,tx=gx+Math.cos(out)*(h*.08+push),ty=gy+Math.sin(out)*(h*.08+push),bx=tx-Math.cos(out)*h*.22,by=ty-Math.sin(out)*h*.22;
    line([[bx,by],[tx,ty]],F.sub,.9*a,1.6*Z);const hx=Math.cos(out),hy=Math.sin(out),s=h*.06;
    ctx.fillStyle=rgba(F.main,.95*a);ctx.beginPath();ctx.moveTo(tx+hx*s,ty+hy*s);ctx.lineTo(tx-hy*s*.6,ty+hx*s*.6);ctx.lineTo(tx+hy*s*.6,ty-hx*s*.6);ctx.closePath();ctx.fill();}
  }else{ctx.globalCompositeOperation='lighter';const n=low?3:7;for(let i=0;i<n;i++){const ph=(t*.9+i/n)%1;disc(x+Math.sin(i*3.3+t*2)*h*.35,fy-h*(.1+1.2*ph),(2.2-1.4*ph)*Z,i%2?F.main:F.sub,.85*(1-ph)*a);}}}},
 slayer:{name:'피의 갑주',draw(L,x,fy,h,F,t,a,low){const Z=Zf();
  if(L==='back'){// 등 뒤 핏빛 똑바른 십자가(위 짧고 아래 김) + 어깨 갑주 조각
   const g=crossGeometry(h),cx=x,cy=fy-h*1.12,pulse=.8+.2*Math.sin(t*5);ctx.globalCompositeOperation='lighter';
   ctx.fillStyle=rgba(F.main,.22*a*pulse);ctx.fillRect(cx-g.width*1.8,cy-g.top-g.width,g.width*3.6,g.top+g.bottom+g.width*2);
   ctx.fillStyle=rgba(F.main,.9*a*pulse);ctx.fillRect(cx-g.width/2,cy-g.top,g.width,g.top+g.bottom);ctx.fillRect(cx-g.arm,cy-g.width/2,g.arm*2,g.width);
   ctx.globalCompositeOperation='source-over';for(const s of [-1,1]){const sx=x+s*h*.24,sy=fy-h*.82;ctx.fillStyle=rgba(F.main.map(v=>Math.round(v*.18)),.78*a);ctx.beginPath();ctx.moveTo(sx,sy-h*.1);ctx.lineTo(sx+s*h*.2,sy-h*.04);ctx.lineTo(sx+s*h*.16,sy+h*.1);ctx.lineTo(sx,sy+h*.06);ctx.closePath();ctx.fill();
    line([[sx,sy-h*.1],[sx+s*h*.2,sy-h*.04]],F.main,.8*a,1.2*Z);}
  }else{ctx.globalCompositeOperation='source-over';// 떨어지는 핏방울
   const n=low?3:7;for(let i=0;i<n;i++){const ph=(t*.8+i/n)%1,dx=x+(i/(n-1)-.5)*h*.8,dy=fy-h*(1.2-1.1*ph),s=2.4*Z;ctx.fillStyle=rgba(F.main,.85*(1-ph*.6)*a);ctx.beginPath();ctx.moveTo(dx,dy-s*2);ctx.quadraticCurveTo(dx+s,dy,dx,dy+s);ctx.quadraticCurveTo(dx-s,dy,dx,dy-s*2);ctx.closePath();ctx.fill();}}}},
 gunner:{name:'유령 기계 망',draw(L,x,fy,h,F,t,a,low){const Z=Zf();ctx.globalCompositeOperation='lighter';
  if(L==='back'){// 발밑 육각 격자 고리 + 몸을 훑는 투시 띠
   const n=low?4:6;for(let i=0;i<n;i++){const u=i*TAU/n+t*.4,hx=x+Math.cos(u)*h*.56,hy=fy+Math.sin(u)*h*.2,r=h*.1,pts=[];for(let k=0;k<=6;k++){const v=k*TAU/6;pts.push([hx+Math.cos(v)*r,hy+Math.sin(v)*r*.36]);}line(pts,F.main,.85*a,1.6*Z);}
   const sy=fy-h*(((t*.9)%1)*1.3);line([[x-h*.46,sy],[x+h*.46,sy]],F.sub,.9*a,2.4*Z);line([[x-h*.46,sy+3*Z],[x+h*.46,sy+3*Z]],F.main,.5*a,1.2*Z);
  }else{// 도는 작은 무인기 세 대(앞 반)
   const n=low?2:3;for(let i=0;i<n;i++){const u=t*1.8+i*TAU/n,s=Math.sin(u);if(s<=0)continue;const dx=x+Math.cos(u)*h*.6,dy=fy-h*.9+s*h*.18,r=h*.06;
    ctx.fillStyle=rgba(F.main,.85*a);ctx.beginPath();ctx.moveTo(dx,dy-r);ctx.lineTo(dx+r*1.3,dy+r*.6);ctx.lineTo(dx-r*1.3,dy+r*.6);ctx.closePath();ctx.fill();disc(dx,dy,r*.35,F.sub,(Math.floor(t*6+i)%2?.95:.4)*a);}}}}};
function theme(h){return THEMES[h]||null;}

// ---- 스킬 적중 문양 ----------------------------------------------------------------------------------
const MARK_LIFE=.6,MAX_MARKS=24,marks=[],lastAt=new Map();
function markDraw(m,t){const age=(t-m.t0)/MARK_LIFE;if(age<0||age>1)return;const q=project(m.x,m.y),Z=Zf(),h=Math.max((typeof actorHeight==='function'?actorHeight():66)*.7,40),F=pal(m.hero),a=1-age,x=q.x,y=q.y-h*.5,g=1+age*.6;
 switch(m.hero){
  case'hwando':ctx.globalCompositeOperation='source-over';disc(x,y,h*.22*g,INK,.75*a);disc(x+h*.2,y-h*.1,h*.08*g,INK,.7*a);disc(x-h*.18,y+h*.08,h*.06*g,INK,.7*a);disc(x,y,h*.05,GOLD,.9*a);break;
  case'seoha':ctx.globalCompositeOperation='lighter';ring(x,y,h*.3*g,h*.3*g,F.main,.8*a,1.6*Z);line([[x,y],[x+Math.cos(m.t0*9+age*6)*h*.26*g,y+Math.sin(m.t0*9+age*6)*h*.26*g]],F.sub,.9*a,1.6*Z);break;
  case'neon':ctx.globalCompositeOperation='lighter';{const p=[];for(let k=0;k<=6;k++){const v=k*TAU/6;p.push([x+Math.cos(v)*h*.2*g,y+Math.sin(v)*h*.2*g]);}line(p,F.main,.85*a,1.4*Z);line([[x-h*.12,y-h*.3],[x+h*.04,y-h*.04],[x-h*.04,y+h*.04],[x+h*.12,y+h*.3]],F.sub,.95*a,1.6*Z);}break;
  case'michaela':ctx.globalCompositeOperation='lighter';{const s=h*.14;ctx.fillStyle=rgba(F.main,.85*a);ctx.beginPath();ctx.moveTo(x,y+s);ctx.quadraticCurveTo(x-s*1.6,y-s*.2,x-s*.8,y-s);ctx.quadraticCurveTo(x,y-s*1.3,x,y-s*.5);ctx.quadraticCurveTo(x,y-s*1.3,x+s*.8,y-s);ctx.quadraticCurveTo(x+s*1.6,y-s*.2,x,y+s);ctx.closePath();ctx.fill();ring(x,y,h*.32*g,h*.32*g,F.sub,.6*a,1.2*Z);}break;
  case'lauren':ctx.globalCompositeOperation='lighter';ring(x,y,h*.34*(1-age*.7),h*.12*(1-age*.7),F.main,.8*a,1.6*Z);disc(x,y,h*.07,F.main,.9*a);disc(x,y,h*.03,F.sub,.95*a);break;
  case'hunter':ctx.globalCompositeOperation='lighter';{const u=m.t0*13%TAU,c=Math.cos(u),s=Math.sin(u);line([[x-c*h*.34,y-s*h*.34],[x,y]],F.sub,.9*a,1.6*Z);disc(x,y,h*.12*g,F.main,.6*a);disc(x,y,h*.05,F.sub,.95*a);}break;
  case'slayer':ctx.globalCompositeOperation='source-over';for(let k=-1;k<=1;k++)line([[x-h*.24+k*h*.1,y-h*.24],[x+h*.24+k*h*.1,y+h*.24]],F.main,.85*a,2.2*Z);disc(x,y+h*.2,h*.05,F.main,.8*a);break;
  case'gunner':ctx.globalCompositeOperation='lighter';{const r=h*.24*(1.3-age*.3);for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])line([[x+sx*r,y+sy*r*.5],[x+sx*r,y+sy*r],[x+sx*r*.5,y+sy*r]],F.main,.9*a,1.4*Z);disc(x,y,h*.04,F.sub,.95*a);}break;
 }}
function isSkill(s){if(s&&typeof s==='object'){if(s.storyWER)return true;if(typeof s.attackKind9==='string')return s.attackKind9==='skill'&&s.friendly!==false;if(s.friendly===false)return false;}
 try{return typeof e568HeroActionContext!=='undefined'&&e568HeroActionContext?.kind==='skill';}catch(_){return false;}}
function addMark(e,source){const t=now(),id=e?.id??e;const last=lastAt.get(id);if(last!==undefined&&t>=last&&t-last<.08)return;lastAt.set(id,t);if(lastAt.size>256)lastAt.delete(lastAt.keys().next().value);
 const hero=String(source?.sourceHero||P()?.hero||'hwando');marks.push({hero,x:+e.x,y:+e.y,t0:t});stats.marks++;while(marks.length>MAX_MARKS){marks.shift();stats.dropped++;}}
function prune(){const t=now();while(marks.length&&(t-marks[0].t0>MARK_LIFE||t<marks[0].t0-1))marks.shift();}
try{if(typeof hitEnemy==='function'){const b=hitEnemy;hitEnemy=function(e,v,source,...r){const res=b.call(this,e,v,source,...r);try{if(res&&e&&Number.isFinite(+e.x)&&active()&&isSkill(source))addMark(e,source);}catch(err){fail(err);}return res;};}}catch(e){fail(e);}

// ---- 그리기: 영웅 그리기 앞뒤 -------------------------------------------------------------------------
function motif(p,L){const T=THEMES[String(p.hero)];if(!T)return;const q=project(p.x,p.y),z0=typeof zoom==='number'?zoom:1,h0=typeof actorHeight==='function'?actorHeight():66*z0,h=Math.max(h0*1.15,64),
 fy=q.y-Math.max(0,Math.min(h*.65,Number(p.visualLiftPx)||0)),a=Math.min(1,Number(p.samong)/.6);
 const go=()=>{ctx.save();try{T.draw(L,q.x,fy,h,pal(String(p.hero)),now(),a,lowFx());}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r572:'+L,kind:'effect',x:p.x,y:p.y,groundAligned:false,r572:true},go);else go();stats.motifs++;}
function drawMarks(){prune();if(!marks.length)return;const t=now();const go=()=>{ctx.save();try{for(const m of marks)markDraw(m,t);}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'r572:marks',kind:'effect',x:P()?.x||0,y:P()?.y||0,groundAligned:false,r572:true},go);else go();}
try{if(typeof drawHero==='function'){const b=drawHero;drawHero=function(...args){const p=P(),on=!!(p&&active(p)&&typeof ctx!=='undefined'&&ctx&&typeof project==='function');
 if(on)try{motif(p,'back');}catch(e){fail(e);}const r=b.apply(this,args);
 if(on)try{motif(p,'front');}catch(e){fail(e);}try{if(typeof ctx!=='undefined'&&ctx&&typeof project==='function')drawMarks();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}

window.__STORYWORLD_SAMONG_THEME_R572__=Object.freeze({revision:REV,theme,themes:Object.keys(THEMES),crossGeometry,marks:()=>{prune();return marks.map(m=>({...m}));},
 set(next){prefs={...prefs,...next};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},active:active(),marks:marks.length,stats:{...stats},lastError})});
})();
