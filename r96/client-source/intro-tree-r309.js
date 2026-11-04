// R309 — 새 게임 오프닝: 궁전 한가운데서 악마화 나무가 자라나 천사들을 타락시키는 10초 3D 애니메이션(사용자 2026-11-04 "코드로 맨처음에 악마화나무가 궁전중심에서 자라나서 천사들을 타락시키는 3d애니메이션 10초정도").
//  · 영상 파일·외부 그림 없이 Three.js 기본 도형과 코드로만 만든다(절차적 나무·뿌리·천사). 임시 3D 연출이며 최종 아트가 아니다.
//  · 흐름(10초): 0–1.5 황금빛 궁전과 후광 천사들 → 1.2–6 중심 제단에서 나무가 솟고 가지·뿌리가 퍼짐 → 3–8.5 뿌리가 닿는 차례로 천사 타락
//    (후광이 깜빡이다 꺼지고, 날개가 검게, 옷이 붉고 어둡게, 눈이 붉게) → 8–10 붉은 하늘 아래 'StoryWorld : 합일몽세' → 게임으로.
//  · 카메라: 높은 원경에서 나무 둘레를 반 바퀴 돌며 내려와 마지막엔 낮은 앙각으로 나무 꼭대기를 올려다본다.
//  · 새 게임을 시작할 때 한 번(첫 장면 'hub' 진입 뒤 그 위에 덮음). 세이브 불러오기·지역 이동에는 띄우지 않는다.
//  · 건너뛰기: 오른쪽 아래 단추 · 화면 누르기 · Esc/Enter/Space. 재생 중 게임 키는 막는다(뒤에서 상태가 바뀌지 않게).
//  · 모바일: 픽셀 비율 1, 안티에일리어스 끔, 가지 깊이·입자 수 줄임, 느리면 해상도를 더 낮춤. 끝나면 렌더러·도형·재질을 모두 버린다.
//  · WebGL·Three.js 를 못 쓰면 바로 넘어간다. 자동 검사(navigator.webdriver)에서는 띄우지 않는다(?intro309=1 또는 play({force:true}) 로 강제).
//  · 환경 설정 '오프닝 3D 애니메이션'으로 끄고 켠다. storyworld.r309.intro {on:false}.
(()=>{'use strict';
if(window.__STORYWORLD_INTRO_TREE_R309__)return;
const REV='R309-intro-tree-1',KEY='storyworld.r309.intro',DUR=10;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,skips:0,ended:0,errors:0,lowered:0,frames:0};let lastError=null,active=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
let THREE=null;async function three(){if(THREE)return THREE;THREE=await import('./vendor/three/build/three.module.js');return THREE;}
const isMobile=()=>{try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}try{return matchMedia('(pointer:coarse)').matches;}catch(_){return false;}};
const forced=()=>{try{return /[?&]intro309=1\b/.test(location.search);}catch(_){return false;}};
// ---- 작은 도구 ----
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x,lerp=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function css(){if(document.getElementById('r309Css'))return;const s=document.createElement('style');s.id='r309Css';
 s.textContent='#r309{position:fixed;inset:0;z-index:2147483000;background:#000;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}#r309 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
 +'#r309 .ttl{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);text-align:center;color:#f3d9b8;font:700 clamp(26px,5.4vw,60px)/1.15 "Gowun Batang","Noto Serif KR",serif;letter-spacing:.08em;text-shadow:0 0 18px #6a0a08,0 0 4px #000,0 3px 12px #000;opacity:0;transition:opacity 1.1s;pointer-events:none;white-space:nowrap}'
 +'#r309 .ttl small{display:block;margin-top:.5em;font:600 clamp(11px,1.5vw,15px)/1.4 "Malgun Gothic",sans-serif;letter-spacing:.42em;color:#c99a86;opacity:.85}#r309 .ttl.on{opacity:1}'
 +'#r309 .skip{position:absolute;right:max(16px,3vw);bottom:max(16px,4vh);padding:8px 16px;font:14px "Malgun Gothic",sans-serif;color:#efe6da;background:rgba(20,12,12,.66);border:1px solid #7b5a55;border-radius:6px;cursor:pointer;z-index:2}'
 +'#r309 .fade{position:absolute;inset:0;background:#000;opacity:1;transition:opacity .6s;pointer-events:none}#r309 .fade.off{opacity:0}'
 +'#r309 .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,transparent 52%,rgba(0,0,0,.62) 100%)}';document.head.appendChild(s);}

// ---- 장면 짓기 ----
function build(T,scene,cam,low){
 const R=rng(309),disp=[];const keep=x=>(disp.push(x),x);
 const C=h=>new T.Color(h);
 const SKY0=C(0xd9c49a),SKY1=C(0x2a0605),FOG0=C(0xcdb88e),FOG1=C(0x1c0404);
 scene.background=SKY0.clone();scene.fog=new T.Fog(SKY0.clone(),30,95);
 const hemi=new T.HemisphereLight(0xfff1d0,0x3a3026,2.2);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffe2b0,2.4);sun.position.set(-18,36,14);scene.add(sun);
 const evil=new T.PointLight(0xff2a14,0,40,1.6);evil.position.set(0,5,0);scene.add(evil);
 // 궁전: 대리석 원형 마당 · 금 상감 고리 · 중심 제단 · 기둥 회랑 · 바깥 탑
 const floorM=keep(new T.MeshStandardMaterial({color:0xe6dccb,roughness:.55,metalness:.05}));
 const floor=new T.Mesh(keep(new T.CircleGeometry(30,low?40:72)),floorM);floor.rotation.x=-Math.PI/2;scene.add(floor);
 const goldM=keep(new T.MeshStandardMaterial({color:0xc9a24a,roughness:.35,metalness:.7,emissive:0x2a1a00}));
 for(const [a,b] of [[3.6,3.85],[7.4,7.6],[12.6,12.9]]){const r=new T.Mesh(keep(new T.RingGeometry(a,b,low?48:96)),goldM);r.rotation.x=-Math.PI/2;r.position.y=.012;scene.add(r);}
 const daisM=keep(new T.MeshStandardMaterial({color:0xf2ead9,roughness:.45}));
 const dais=new T.Mesh(keep(new T.CylinderGeometry(3,3.4,.6,low?20:36)),daisM);dais.position.y=.3;scene.add(dais);
 const step=new T.Mesh(keep(new T.CylinderGeometry(3.6,4,.25,low?20:36)),daisM);step.position.y=.12;scene.add(step);
 const NCOL=low?12:18,colG=keep(new T.CylinderGeometry(.42,.5,8,low?8:12)),capG=keep(new T.BoxGeometry(1.3,.5,1.3));
 const stoneM=keep(new T.MeshStandardMaterial({color:0xece3d2,roughness:.6}));
 const cols=new T.InstancedMesh(colG,stoneM,NCOL),caps=new T.InstancedMesh(capG,stoneM,NCOL*2);const m4=new T.Matrix4(),q=new T.Quaternion(),v3=new T.Vector3(),s3=new T.Vector3(1,1,1);
 for(let i=0;i<NCOL;i++){const a=i/NCOL*Math.PI*2,x=Math.cos(a)*17,z=Math.sin(a)*17;m4.makeTranslation(x,4,z);cols.setMatrixAt(i,m4);m4.makeTranslation(x,8.25,z);caps.setMatrixAt(i*2,m4);m4.makeTranslation(x,.25,z);caps.setMatrixAt(i*2+1,m4);}
 scene.add(cols,caps);
 const towerG=keep(new T.CylinderGeometry(2.6,3,24,low?8:12)),roofG=keep(new T.ConeGeometry(3.4,8,low?8:12));
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.26,x=Math.cos(a)*44,z=Math.sin(a)*44;const t=new T.Mesh(towerG,stoneM);t.position.set(x,12,z);const r=new T.Mesh(roofG,goldM);r.position.set(x,28,z);scene.add(t,r);}
 // 하늘에서 내려오는 빛기둥(시작엔 황금, 나무가 솟으면 붉어지며 꺼짐)
 const beamM=keep(new T.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.2,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
 const beam=new T.Mesh(keep(new T.CylinderGeometry(.9,2.2,60,24,1,true)),beamM);beam.position.y=30;scene.add(beam);
 // 솟을 때 퍼지는 충격 고리
 const shockM=keep(new T.MeshBasicMaterial({color:0xff3a1a,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
 const shock=new T.Mesh(keep(new T.RingGeometry(.9,1,low?48:96)),shockM);shock.rotation.x=-Math.PI/2;shock.position.y=.65;scene.add(shock);

 // ---- 악마화 나무(절차적 가지·뿌리) ----
 const segs=[];const UP=new T.Vector3(0,1,0);
 const add=(p0,dir,len,r0,r1,t0,dur,kind)=>{const s={p0:p0.clone(),dir:dir.clone().normalize(),len,r0,r1,t0,dur,kind};s.p1=s.p0.clone().addScaledVector(s.dir,len);segs.push(s);return s;};
 const jitter=(d,amt)=>d.clone().add(new T.Vector3((R()-.5)*amt,(R()-.5)*amt,(R()-.5)*amt)).normalize();
 // 줄기: 비틀린 다섯 마디
 let p=new T.Vector3(0,.55,0),d=new T.Vector3(0,1,0),t=1.15,r=1.25;const trunk=[];
 for(let i=0;i<5;i++){d=jitter(d,.42);d.y=Math.max(d.y,.75);d.normalize();const len=2.6-i*.14,s=add(p,d,len,r,r*.78,t,.34,'trunk');trunk.push(s);p=s.p1;t+=.3;r*=.78;}
 const maxDepth=low?3:4;
 function branch(from,dir,len,rad,t0,depth){const s=add(from,dir,len,rad,rad*.66,t0,.38-depth*.03,'branch');
  if(depth>=maxDepth){s.tip=true;return;}
  const n=depth<2?3:2;for(let k=0;k<n;k++){const az=(k/n)*Math.PI*2+R()*1.4,el=.55+R()*.5;
   const side=new T.Vector3(Math.cos(az),0,Math.sin(az));let nd=dir.clone().multiplyScalar(.55).addScaledVector(side,Math.sin(el)).normalize();
   nd.y-=depth>=2?.18:0;/* 끝가지는 처지며 갈고리처럼 */nd=jitter(nd,.3);branch(s.p1,nd,len*(.7+R()*.12),rad*.62,t0+s.dur*.85,depth+1);}}
 for(let i=2;i<5;i++){const base=trunk[i];const n=i===4?3:2;for(let k=0;k<n;k++){const az=R()*Math.PI*2;const side=new T.Vector3(Math.cos(az),0,Math.sin(az));
  const nd=base.dir.clone().multiplyScalar(i===4?.9:.5).addScaledVector(side,i===4?.8:1).normalize();branch(base.p1,nd,3.2-i*.2+R()*.5,base.r1*.72,base.t0+base.dur*.9,1);}}
 // 뿌리: 제단을 갈라 마당 위로 기어 나간다 — 끝이 천사 아래까지 닿는다
 const NROOT=low?9:12,rootTips=[];
 for(let i=0;i<NROOT;i++){const az=i/NROOT*Math.PI*2+(R()-.5)*.25;let rp=new T.Vector3(Math.cos(az)*.9,.5,Math.sin(az)*.9),rd=new T.Vector3(Math.cos(az),-.35,Math.sin(az)).normalize(),rt=1.35+(i/NROOT)*2.4+R()*.15,rr=.55;/* 뿌리는 한 바퀴 돌아가며 차례로 뻗는다 → 타락이 원을 따라 번진다 */
  const nseg=low?6:8;for(let k=0;k<nseg;k++){const out=new T.Vector3(rp.x,0,rp.z).normalize();rd=rd.clone().multiplyScalar(.6).addScaledVector(out,.4).add(new T.Vector3((R()-.5)*.5,0,(R()-.5)*.5)).normalize();
   const targetY=k<2?.25:.1+R()*.08;rd.y=(targetY-rp.y)/1.6;rd.normalize();const len=1.55+R()*.3;const s=add(rp,rd,len,rr,rr*.8,rt,.24,'root');rp=s.p1;rt+=.2;rr*=.8;
   if(k===3&&!low||k===3&&i%2===0){/* 갈래 뿌리 */const fd=rd.clone().applyAxisAngle(UP,(R()<.5?-1:1)*(.6+R()*.4));let fp=rp.clone(),fr=rr*.7,ft=rt;for(let j=0;j<3;j++){const f=add(fp,fd,1.3,fr,fr*.75,ft,.22,'root');fp=f.p1;ft+=.2;fr*=.75;}}}
  rootTips.push({az,t:rt,pos:rp.clone()});}
 const N=segs.length;
 const segG=keep(new T.CylinderGeometry(.66,1,1,low?6:8,1));segG.translate(0,.5,0);
 const barkM=keep(new T.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0,emissive:0x5a0606,emissiveIntensity:.0}));
 const tree=new T.InstancedMesh(segG,barkM,N);tree.instanceMatrix.setUsage(T.DynamicDrawUsage);
 const bark=C(0x1d1110),vein=C(0x3a0b0a);for(let i=0;i<N;i++)tree.setColorAt(i,segs[i].kind==='root'?vein:bark);
 tree.frustumCulled=false;scene.add(tree);
 // 이음매 마디(관절 혹) — 가지가 꺾이는 곳이 매끈하게 이어지게
 const knotG=keep(new T.SphereGeometry(1,low?6:8,low?5:6));const knots=new T.InstancedMesh(knotG,barkM,N);knots.instanceMatrix.setUsage(T.DynamicDrawUsage);knots.frustumCulled=false;
 for(let i=0;i<N;i++)knots.setColorAt(i,segs[i].kind==='root'?vein:bark);scene.add(knots);
 // 가지 끝 붉은 열매(눈)
 const tips=segs.filter(s=>s.tip);const fruitM=keep(new T.MeshBasicMaterial({color:0xff2a10}));
 const fruit=new T.InstancedMesh(keep(new T.SphereGeometry(.12,8,6)),fruitM,Math.max(1,tips.length));fruit.instanceMatrix.setUsage(T.DynamicDrawUsage);fruit.frustumCulled=false;scene.add(fruit);
 const qd=new T.Quaternion(),zero=new T.Matrix4().makeScale(0,0,0);
 function updateTree(tt){for(let i=0;i<N;i++){const s=segs[i],g=sm(0,1,(tt-s.t0)/s.dur);
   if(g<=0){tree.setMatrixAt(i,zero);knots.setMatrixAt(i,zero);continue;}
   const sway=s.kind==='branch'?Math.sin(tt*1.7+i)*.025*g:0;const dir=s.dir.clone();dir.x+=sway;dir.normalize();
   qd.setFromUnitVectors(UP,dir);const w=s.r0*(.35+.65*g);s3.set(w,s.len*g,w);m4.compose(s.p0,qd,s3);tree.setMatrixAt(i,m4);
   const kr=s.r0*.92*(.35+.65*g);m4.compose(s.p0,q.identity(),v3.set(kr,kr,kr));knots.setMatrixAt(i,m4);}
  tree.instanceMatrix.needsUpdate=true;knots.instanceMatrix.needsUpdate=true;
  for(let i=0;i<tips.length;i++){const s=tips[i],g=sm(0,1,(tt-s.t0-s.dur-.2)/.5);const k=g*(.8+.25*Math.sin(tt*6+i));m4.compose(s.p1,q.identity(),v3.set(k,k,k));fruit.setMatrixAt(i,g>0?m4:zero);}
  fruit.instanceMatrix.needsUpdate=true;}

 // ---- 천사들 ----
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(.5,.55,1.3,.95,2.1,1.05);wingShape.bezierCurveTo(1.85,.7,1.95,.45,1.7,.3);
 wingShape.bezierCurveTo(1.55,.05,1.6,-.15,1.3,-.25);wingShape.bezierCurveTo(1.05,-.45,.95,-.7,.65,-.75);wingShape.bezierCurveTo(.45,-.5,.25,-.35,0,0);
 const wingG=keep(new T.ShapeGeometry(wingShape,low?6:10));
 const robeG=keep(new T.ConeGeometry(.55,2,low?8:12,1,true)),chestG=keep(new T.CylinderGeometry(.2,.32,.6,low?8:10)),headG=keep(new T.SphereGeometry(.26,low?10:14,low?8:10));
 const haloG=keep(new T.TorusGeometry(.34,.045,6,low?20:28)),eyeG=keep(new T.SphereGeometry(.05,6,4));
 const NA=low?8:10,angels=[];
 const WHITE=C(0xf6f1e6),ROBE1=C(0x4a0a0c),WING0=C(0xfbf8f0),WING1=C(0x0b0606),GOLD=C(0xffd66a),RED=C(0xff2410),SKIN0=C(0xf0dcc4),SKIN1=C(0x6a4a50);
 for(let i=0;i<NA;i++){const az=i/NA*Math.PI*2+.18,rad=i%2?11.2:9.6,h=3.4+(i%3)*.7;
  const robeM=keep(new T.MeshStandardMaterial({color:WHITE.clone(),roughness:.6,emissive:0x3a3428,side:T.DoubleSide}));
  const skinM=keep(new T.MeshStandardMaterial({color:SKIN0.clone(),roughness:.7}));
  const wingM=keep(new T.MeshStandardMaterial({color:WING0.clone(),roughness:.5,emissive:0x5a5448,side:T.DoubleSide}));
  const haloM=keep(new T.MeshBasicMaterial({color:GOLD.clone(),transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false}));
  const eyeM=keep(new T.MeshBasicMaterial({color:RED.clone(),transparent:true,opacity:0}));
  const g=new T.Group(),body=new T.Group();g.add(body);
  const robe=new T.Mesh(robeG,robeM);robe.position.y=-.2;const chest=new T.Mesh(chestG,robeM);chest.position.y=1;const head=new T.Mesh(headG,skinM);head.position.y=1.55;
  const halo=new T.Mesh(haloG,haloM);halo.position.y=2.0;halo.rotation.x=Math.PI/2;
  const eL=new T.Mesh(eyeG,eyeM),eR=new T.Mesh(eyeG,eyeM);eL.position.set(-.09,1.58,.23);eR.position.set(.09,1.58,.23);
  const wL=new T.Group(),wR=new T.Group();wL.position.set(-.1,1.05,-.18);wR.position.set(.1,1.05,-.18);
  const mL=new T.Mesh(wingG,wingM);mL.scale.set(-1,1,1);mL.rotation.y=-.35;const mR=new T.Mesh(wingG,wingM);mR.rotation.y=.35;wL.add(mL);wR.add(mR);
  body.add(robe,chest,head,halo,eL,eR,wL,wR);g.position.set(Math.cos(az)*rad,h,Math.sin(az)*rad);g.lookAt(0,h,0);scene.add(g);
  // 뿌리가 가장 가까이 닿는 때 = 타락 시작
  let best=rootTips[0],bd=9;for(const tp of rootTips){let dd=Math.abs(((tp.az-az+Math.PI*3)%(Math.PI*2))-Math.PI);if(dd<bd){bd=dd;best=tp;}}
  const start=clamp(best.t-.35+(R()-.5)*.3,2.6,6.4);
  angels.push({g,body,halo,haloM,robeM,wingM,skinM,eyeM,wL,wR,h,az,rad,start,phase:R()*6,flick:R()*100});}
 function updateAngels(tt){for(const a of angels){const c=sm(a.start,a.start+1.9,tt);
   const bob=Math.sin(tt*1.6+a.phase)*.18*(1-c*.6);a.g.position.y=a.h+bob-c*1.1;
   // 몸은 나무 쪽으로 기울고, 끝엔 고개를 떨군다
   a.body.rotation.x=lerp(0,.32,c)+Math.sin(tt*9+a.phase)*.02*c;
   const flapSpeed=lerp(3.2,1.1,c),flap=Math.sin(tt*flapSpeed+a.phase)*lerp(.32,.12,c);
   const spread=lerp(.15,-.45,c);/* 날개가 처지며 갈퀴처럼 아래로 */a.wL.rotation.set(0,-flap,spread);a.wR.rotation.set(0,flap,-spread);
   a.robeM.color.copy(WHITE).lerp(ROBE1,c);a.robeM.emissive.setRGB(lerp(.23,.09,c),lerp(.2,.0,c),lerp(.16,.0,c));
   a.wingM.color.copy(WING0).lerp(WING1,sm(.15,.85,c));a.wingM.emissive.setRGB(lerp(.35,.12,c),lerp(.33,0,c),lerp(.28,0,c));
   a.skinM.color.copy(SKIN0).lerp(SKIN1,c);
   // 후광: 붉게 물들며 깜빡이다 꺼진다
   const fl=c>.15&&c<.9?(Math.sin(tt*37+a.flick)>.2-c*.9?1:.15):1;a.haloM.opacity=clamp((1-sm(.35,.95,c))*fl);a.haloM.color.copy(GOLD).lerp(RED,sm(.05,.6,c));
   a.halo.position.y=2.0-c*.25;a.halo.rotation.y=c*.6;a.halo.visible=a.haloM.opacity>.01;
   a.eyeM.opacity=sm(.55,.9,c);}}

 // ---- 빛 알갱이 → 잿불 ----
 const NP=low?160:380,pg=keep(new T.BufferGeometry()),pp=new Float32Array(NP*3),pv=new Float32Array(NP);
 for(let i=0;i<NP;i++){const a=R()*Math.PI*2,rr=2+R()*18;pp[i*3]=Math.cos(a)*rr;pp[i*3+1]=R()*14;pp[i*3+2]=Math.sin(a)*rr;pv[i]=.3+R()*.9;}
 pg.setAttribute('position',new T.BufferAttribute(pp,3));const pm=keep(new T.PointsMaterial({color:0xffe9b0,size:low?.22:.16,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}));
 const pts=new T.Points(pg,pm);pts.frustumCulled=false;scene.add(pts);const PC0=C(0xffe9b0),PC1=C(0xff3a12);
 let lastT=0;function updateParticles(tt){const dt=Math.min(.1,tt-lastT);lastT=tt;const k=sm(2,6,tt),sp=lerp(.6,2.4,k);
  for(let i=0;i<NP;i++){let y=pp[i*3+1]+dt*pv[i]*sp;if(y>16)y=0;pp[i*3+1]=y;const x=pp[i*3],z=pp[i*3+2];/* 타락 뒤엔 나무 쪽으로 빨려 든다 */const pull=k*dt*.35;pp[i*3]=x-x*pull*.1;pp[i*3+2]=z-z*pull*.1;}
  pg.attributes.position.needsUpdate=true;pm.color.copy(PC0).lerp(PC1,k);}

 // ---- 카메라: 높은 원경 → 나무 둘레 반 바퀴 하강 → 낮은 앙각 ----
 const reduce=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}})();
 const look=new T.Vector3();
 // 마지막 자리는 두 천사 사이(천사 고리 바깥·기둥 안쪽)라 몸을 뚫고 지나가지 않는다. 천사 고리는 높이 떠서 넘는다.
 const thEnd=Math.PI/2-(.18+Math.PI/NA),thStart=thEnd-1.55;
 function updateCam(tt){const th=lerp(thStart,thEnd-.08,sm(0,6.6,tt))+.08*sm(6.6,DUR,tt),/* 낮게 내려오기 전에 두 천사 사이 각도에 먼저 자리 잡는다 */rad=lerp(34,15.2,sm(0,7.2,tt)),h=lerp(26,1.5,sm(0,9.6,tt));
  cam.position.set(Math.sin(th)*rad,h,Math.cos(th)*rad);look.set(0,lerp(2.5,7.4,sm(2,DUR,tt)),0);
  if(!reduce){const shake=sm(1.1,1.4,tt)*(1-sm(1.6,2.8,tt))*.35;cam.position.x+=Math.sin(tt*53)*shake;cam.position.y+=Math.sin(tt*47+1)*shake;}
  cam.lookAt(look);}

 const tmp=C(0);
 function update(tt){updateTree(tt);updateAngels(tt);updateParticles(tt);updateCam(tt);
  const k=sm(1.4,7.5,tt);/* 하늘·안개·빛이 금빛에서 핏빛으로 */
  scene.background.copy(SKY0).lerp(SKY1,k);scene.fog.color.copy(FOG0).lerp(FOG1,k);scene.fog.near=lerp(30,14,k);scene.fog.far=lerp(95,60,k);
  hemi.color.copy(tmp.setHex(0xfff1d0)).lerp(C(0xff5a3a),k);hemi.intensity=lerp(2.2,.9,k);hemi.groundColor.setHex(0x3a3026).lerp(C(0x120404),k);
  sun.color.setHex(0xffe2b0).lerp(C(0xc02a10),k);sun.intensity=lerp(2.4,1.1,k);
  evil.intensity=sm(1.2,3,tt)*(38+Math.sin(tt*5)*8);evil.position.y=lerp(2,7,sm(1.2,5,tt));
  floorM.color.setHex(0xe6dccb).lerp(C(0x3c2624),sm(2,7.5,tt));stoneM.color.setHex(0xece3d2).lerp(C(0x4a3432),sm(2.5,8,tt));daisM.color.setHex(0xf2ead9).lerp(C(0x2a1412),sm(1.2,4,tt));
  goldM.emissive.setHex(0x2a1a00).lerp(C(0x5a0800),k);
  beamM.opacity=.2*(1-sm(1.1,2.2,tt))+.05*Math.sin(tt*3)*(1-k);beamM.color.setHex(0xfff0c0).lerp(C(0xff3010),sm(.9,1.6,tt));beam.visible=beamM.opacity>.005;
  const sk=clamp((tt-1.15)/1.3);shockM.opacity=sk>0&&sk<1?(1-sk)*.85:0;shock.scale.setScalar(1+sk*20);
  barkM.emissiveIntensity=sm(2,6,tt)*(.6+.4*Math.sin(tt*4.2));}
 return{update,disp,angels,tree,counts:{segments:N,angels:NA,particles:NP,tips:tips.length}};}

// ---- 재생 ----
async function play(opt={}){if(active)return false;if(!opt.force&&(!prefs.on||(navigator.webdriver&&!forced())))return false;if(typeof document==='undefined')return false;
 let T;try{T=await three();}catch(e){fail(e);return false;}
 const low=opt.low!=null?!!opt.low:isMobile();
 css();const root=document.createElement('div');root.id='r309';root.setAttribute('role','dialog');root.setAttribute('aria-label','오프닝 3D 애니메이션');
 root.innerHTML='<div class="vig"></div><div class="ttl">StoryWorld : 합일몽세<small>악마화 나무</small></div><button type="button" class="skip">건너뛰기 ▸</button><div class="fade"></div>';
 document.body.appendChild(root);
 const W=()=>Math.max(1,innerWidth),H=()=>Math.max(1,innerHeight);let renderer;
 try{renderer=new T.WebGLRenderer({antialias:!low,powerPreference:low?'low-power':'default'});}catch(e){fail(e);root.remove();return false;}
 let pr=Math.min(low?1:1.5,devicePixelRatio||1);renderer.setPixelRatio(pr);renderer.setSize(W(),H());root.insertBefore(renderer.domElement,root.firstChild);
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(46,W()/H(),.1,300);
 const fov=()=>{const a=W()/H();cam.aspect=a;cam.fov=a<1?Math.min(72,46/Math.max(.55,a)):46;cam.updateProjectionMatrix();};fov();
 let world;try{world=build(T,scene,cam,low);}catch(e){fail(e);try{renderer.dispose();}catch(_){}root.remove();return false;}
 const ttl=root.querySelector('.ttl'),fade=root.querySelector('.fade'),skipBtn=root.querySelector('.skip');
 let done=false,raf=0,t0=0,slow=0,lastNow=0;
 const finish=reason=>{if(done)return;done=true;cancelAnimationFrame(raf);if(reason==='skip')stats.skips++;else stats.ended++;fade.classList.remove('off');
  removeEventListener('keydown',key,true);removeEventListener('keyup',keyUp,true);removeEventListener('resize',rs);
  setTimeout(()=>{try{scene.traverse(o=>{if(o.isInstancedMesh)o.dispose?.();});world.disp.forEach(x=>x.dispose?.());renderer.dispose();renderer.forceContextLoss?.();}catch(e){fail(e);}root.remove();active=null;try{opt.onEnd?.(reason);}catch(_){}},reason==='skip'?380:620);};
 const key=e=>{e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&(e.key==='Escape'||e.key==='Enter'||e.key===' '||e.code==='Space'))finish('skip');};const keyUp=e=>{e.stopImmediatePropagation();};
 const rs=()=>{renderer.setSize(W(),H());fov();};
 root.addEventListener('pointerdown',e=>{e.preventDefault();finish('skip');});skipBtn.addEventListener('click',e=>{e.stopPropagation();finish('skip');});
 addEventListener('keydown',key,true);addEventListener('keyup',keyUp,true);addEventListener('resize',rs);try{if(typeof keys!=='undefined'&&keys?.clear)keys.clear();}catch(_){}
 active={finish,low,counts:world.counts};stats.plays++;
 const at=Number.isFinite(opt.at)?opt.at:null;/* 검사용: 특정 순간 고정 */
 const loop=now=>{if(!t0)t0=now;const tt=at!=null?at:(now-t0)/1000;
  if(lastNow){const dt=now-lastNow;/* 느리면 한 번 해상도를 낮춘다 */if(tt>.8&&dt>45){if(++slow>20&&pr>.75){pr=Math.max(.6,pr*.7);renderer.setPixelRatio(pr);renderer.setSize(W(),H());stats.lowered++;slow=0;}}else slow=Math.max(0,slow-1);}lastNow=now;
  try{world.update(Math.min(tt,DUR));}catch(e){fail(e);}renderer.render(scene,cam);stats.frames++;
  if(tt>.05&&!fade.dataset.in){fade.dataset.in=1;fade.classList.add('off');}
  if(tt>=7.9&&!ttl.classList.contains('on'))ttl.classList.add('on');
  if(at==null&&tt>=DUR-.65&&!fade.dataset.out){fade.dataset.out=1;fade.classList.remove('off');}
  if(at==null&&tt>=DUR)return finish('ended');raf=requestAnimationFrame(loop);};
 raf=requestAnimationFrame(loop);return true;}
function skip(){if(active){active.finish('skip');return true;}return false;}
// 새 게임 시작 때 한 번(첫 장면 진입 뒤 그 위에)
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const r=await base.apply(this,a);try{if(r!==false)play();}catch(e){fail(e);}return r;};}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings');if(grid&&!document.getElementById('r309On')){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='r309On';c.checked=prefs.on!==false;c.onchange=()=>{prefs.on=c.checked;save();};l.appendChild(c);l.appendChild(document.createTextNode(' 오프닝 3D 애니메이션(새 게임)'));grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){if(typeof p?.on==='boolean'){prefs.on=p.on;save();}return{on:prefs.on};}
window.__STORYWORLD_INTRO_TREE_R309__=Object.freeze({revision:REV,duration:DUR,play,skip,set,buildScene:build,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},active:!!active,low:active?.low??null,counts:active?.counts||null,lastError})});
})();
