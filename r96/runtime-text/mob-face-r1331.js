// R1331 인간형 3D 보스 얼굴 또렷하게(사용자 2026-11-26 "인간형 3D 몹들 움직임은 그나마 괜찮은데 얼굴이 너무 뭉개지는데 해결법 2d로 얼굴에 맞게 이목구비만 넣는건 어때",
//   "응 보여줘 서윤이랑 세이렌모르", 08:49Z "훨낫네 인간형 3d몹은 다 저런식으로 해줘 얼굴이목구비조금더 개선해서").
//  · 대상(3D 모델 51종 중 머리 뼈 + 사람 얼굴이 있는 8종): R1322c 서윤·세이렌 모르·호텔 그룹 회장·사이보그 회장, R1317 잠식된 약방 아낙 = 먹선 빼기 + 데칼.
//    R1316 붉은 하이힐 칼날·R1317 거짓천국 근위천사·흑장미 눈가린 신도 = 먹선만 빼기(2D 얼굴이 옆모습·몇 픽셀). 가면·두건·기계·짐승 머리는 제외.
//  · 원인(실측): 3D 얼굴 텍스처에는 눈·눈썹·입이 그려져 있다. 뭉개짐은 R1322c 몸 외곽 먹선(검정 .018 + 핏빛 .024 껍데기)이
//    눈두덩·콧등·귀걸이처럼 튀어나온 얼굴 굴곡마다 고리로 생겨, 게임 배율(얼굴 약 20px)에서 얼굴을 검붉은 얼룩으로 덮기 때문이다.
//  · 고침 ①: 머리 뼈(Head)에 붙은 얼굴 앞쪽 꼭짓점(머리 무게 ≥ .5, 머리 뼈보다 2cm 앞)에서는 먹선 껍데기를 그리지 않는다(옆 윤곽·머리카락·몸 테는 그대로).
//  · 고침 ②: 그 보스의 2D 게임 그림에서 딴 눈·눈썹·코끝 그늘·입만(qa/r1331/bake-faces.py, 256² 투명 PNG) 얼굴 앞면에 붙인다.
//    데칼은 3D 얼굴 표면에 맞춰 휜 격자(첫 모델에서 앞→뒤로 쏜 광선이 맞은 자리 + 2mm)로 만들어 머리 뼈 자식으로 둔다 → 고개·몸 움직임을 그대로 따른다.
//    카메라에서 돌아선 부분은 흐려진다(옆에서 납작한 스티커로 보이지 않게).
//  · 켜고 끄기: 설정 '3D 얼굴 2D 이목구비' / storyworld.r1331.face('on'|'off') / 주소 ?face31=1·0. 기본 켜짐(사용자 08:49Z 전체 적용).
//    각 3D 오버레이(R1316·R1317·R1322c) 설정이 켜져 있어야 보인다(그 모델에만 붙음). 3D 메시는 R1055 수묵·R451 국지 조명 제외(userData) 유지.
//  · 미검증: GPU 실기기·모바일, 실제 플레이 손맛. 2D 원본 얼굴이 약 15~20px 라 데칼도 그만큼의 결이다(가까이 당기면 흐림).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_FACE_R1331__)return;
const REV='R1331-face-1',KEY='storyworld.r1331.face';
// 머리 뼈 기준 좌표(모델 단위, 휴식 자세): 3D 얼굴에 그려진 왼눈·오른눈·입 중심. 데칼 틀(256²)에서 눈은 (.30,.36)·(.70,.36), 입은 (.50,.80).
const FACES=Object.freeze({
 seoyun:Object.freeze({tex:'assets/r1331/face-seoyun.png',eyeL:[-.0375,.1449],eyeR:[.0358,.1457],mouth:[-.0017,.0716],alpha:.95}),
 sirenMor:Object.freeze({tex:'assets/r1331/face-sirenMor.png',eyeL:[-.0441,.1457],eyeR:[.0398,.1464],mouth:[0,.0710],alpha:.95}),
 // R1322c 호텔 그룹 회장·사이보그 회장(같은 인물 두 단계 → 같은 데칼), R1317 잠식된 약방 아낙(2D 흉상 r843 에서 가까운 눈을 뒤집어 두 눈).
 hotelChairman:Object.freeze({tex:'assets/r1331/face-hotelChairman.png',eyeL:[-.0458,.1589],eyeR:[.0333,.1586],mouth:[-.0041,.0815],alpha:.95}),
 cyborgChairman:Object.freeze({tex:'assets/r1331/face-hotelChairman.png',eyeL:[-.0458,.1585],eyeR:[.0333,.1585],mouth:[-.0042,.0813],alpha:.95}),
 herbwife:Object.freeze({tex:'assets/r1331/face-herbwife.png',eyeL:[-.0575,.2163],eyeR:[.051,.2144],mouth:[.0045,.1602],alpha:.95})});
// 사람 얼굴이 있지만 2D 얼굴이 옆모습이거나 몇 픽셀뿐이라 이목구비를 딸 수 없는 셋: 얼굴 먹선만 뺀다(3D 에 그려진 눈·입이 드러남).
//  R1316 붉은 하이힐 칼날(heel) · R1317 거짓천국 근위천사(guard, 2D 옆모습) · 흑장미 눈가린 신도(rose, 3D 에 눈가리개가 이미 있음).
const HUMAN_INK_ONLY=new Set(['heel','guard','rose']);
// 3D 오버레이마다 먹선 껍데기 표식 이름이 다르다(r1316Ink·r1317Ink·r1322Ink·r1322cInk).
const isInk=o=>!!o.userData&&Object.keys(o.userData).some(k=>/^r13\d+c?Ink$/.test(k)&&o.userData[k]===true);
const GRID=16,LIFT=.002;
let on=true;
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const m=/[?&]face31=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}
const stats={decorated:0,decals:0,inkMasked:0,misses:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};
const perKind=new Map();// kind → {geo, mat, inkMats:Map}
const texCache=new Map();

// 데칼 틀 (u,v)∈[0,1]² → 머리 뼈 좌표 (x,y): 세 점 (눈L·눈R·입) 으로 정한 1차 변환.
function frameOf(f){const [ax,ay]=f.eyeL,[bx,by]=f.eyeR,[cx,cy]=f.mouth;
 // u=.30→.70 이 눈L→눈R, v=.36→.80 이 눈 중점→입.
 const ux=(bx-ax)/.40,uy=(by-ay)/.40;const mx=(ax+bx)/2,my=(ay+by)/2;const vx=(cx-mx)/.44,vy=(cy-my)/.44;
 const ox=mx-ux*.50-vx*.36,oy=my-uy*.50-vy*.36;
 return (u,v)=>[ox+ux*u+vx*v,oy+uy*u+vy*v];}

// 머리 뼈 무게 ≥ .5 이고 머리 뼈보다 앞쪽(머리 좌표 z > ZCUT)인 꼭짓점 = 1, 나머지 0. 같은 지오메트리는 한 번만(휴식 자세에서).
//  법선으로 고르면 눈두덩·콧방울 아래처럼 옆·아래를 보는 굴곡이 남아 고리가 그대로였다(1차 실측) → 위치로 고른다. 귀·옆머리 윤곽(z ≤ ZCUT)은 먹선 유지.
const ZCUT=.02;
function faceMaskAttr(T,mesh,head,headIndex){const g=mesh.geometry;if(g.getAttribute('r1331Face'))return g.getAttribute('r1331Face');
 const si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight'),pa=g.getAttribute('position');const count=pa.count;const arr=new Float32Array(count);
 if(si&&sw){const v=new T.Vector3();const m=new T.Matrix4().copy(head.matrixWorld).invert().multiply(mesh.matrixWorld);
  for(let i=0;i<count;i++){let w=0;for(let k=0;k<4;k++)if(si.getComponent(i,k)===headIndex)w+=sw.getComponent(i,k);
   if(w<.5)continue;v.fromBufferAttribute(pa,i).applyMatrix4(m);arr[i]=v.z>ZCUT?1:0;}}
 const a=new T.BufferAttribute(arr,1);g.setAttribute('r1331Face',a);return a;}
function maskedInk(T,src){const m=src.clone();const old=src.onBeforeCompile;
 m.onBeforeCompile=(s,...r)=>{old?.call(m,s,...r);
  s.vertexShader='attribute float r1331Face;\nvarying float vR1331Face;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvR1331Face = r1331Face;');
  s.fragmentShader='varying float vR1331Face;\n'+s.fragmentShader.replace('void main() {','void main() {\nif ( vR1331Face > .5 ) discard;');};
 const key=src.customProgramCacheKey;m.customProgramCacheKey=()=>(key?.call(src)||'')+'|r1331-face-mask';m.needsUpdate=true;return m;}

function texture(T,url){if(texCache.has(url))return texCache.get(url);const t=new T.TextureLoader().load(url,undefined,undefined,fail);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;texCache.set(url,t);return t;}
function decalMaterial(T,f){const m=new T.MeshBasicMaterial({map:texture(T,f.tex),transparent:true,opacity:f.alpha,depthTest:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,side:T.FrontSide,toneMapped:false});
 // 카메라에서 돌아선 부분은 흐리게: 보기 공간 법선 z 가 .08 이하면 0, .42 이상이면 1. 격자 가장자리(헛맞음)는 aR1331 = 0.
 m.onBeforeCompile=s=>{s.vertexShader='attribute float aR1331;\nvarying float vR1331;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvR1331 = aR1331 * smoothstep( .08, .42, normalize( normalMatrix * normal ).z );');
  s.fragmentShader='varying float vR1331;\n'+s.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= vR1331;\n#include <opaque_fragment>');};
 m.customProgramCacheKey=()=>'r1331-face-decal-v1';return m;}

// 휴식 자세 모델에서 얼굴 표면에 맞춘 격자(머리 뼈 좌표)를 만든다.
function decalGeometry(T,model,head,f,bodies){
 model.updateMatrixWorld(true);const toLocal=new T.Matrix4().copy(head.matrixWorld).invert();const map=frameOf(f);
 const ray=new T.Raycaster();const pos=[],alpha=[],uv=[],idx=[];const a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3();
 for(let j=0;j<=GRID;j++)for(let i=0;i<=GRID;i++){const u=i/GRID,v=j/GRID;const [x,y]=map(u,1-v);
  // 1-v: 텍스처 v 는 아래에서 위로, 틀의 v 는 위에서 아래로.
  a.set(x,y,.6).applyMatrix4(head.matrixWorld);b.set(x,y,-.2).applyMatrix4(head.matrixWorld);dir.subVectors(b,a);const len=dir.length();dir.normalize();
  ray.set(a,dir);ray.far=len;const hit=ray.intersectObjects(bodies,false)[0];
  if(hit){const p=hit.point.clone().applyMatrix4(toLocal);pos.push(p.x,p.y,p.z+LIFT);alpha.push(1);}else{pos.push(x,y,0);alpha.push(0);stats.misses++;}
  uv.push(u,v);}
 for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const p=j*(GRID+1)+i;idx.push(p,p+1,p+GRID+1,p+1,p+GRID+2,p+GRID+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('aR1331',new T.Float32BufferAttribute(alpha,1));g.setIndex(idx);g.computeVertexNormals();
 return g;}

// R1322c create() 가 모델을 만든 직후 부른다(먹선 껍데기는 이미 붙어 있음). opts.layer = 3D 몹 그리기 층.
function decorate(model,kind,T,opts={}){if(!on||!T||!model||!(FACES[kind]||HUMAN_INK_ONLY.has(kind)))return false;
 try{const f=FACES[kind]||null;let head=null;const bodies=[],shells=[];
  model.traverse(o=>{if(o.isBone&&o.name==='Head'&&!head)head=o;if(o.isMesh){(isInk(o)?shells:bodies).push(o);}});
  if(!head||!bodies.length)return false;
  let k=perKind.get(kind);
  if(!k){k={geo:f?decalGeometry(T,model,head,f,bodies):null,mat:f?decalMaterial(T,f):null,inkMats:new Map()};perKind.set(kind,k);}
  // ① 얼굴 정면 먹선 빼기
  for(const sh of shells){const sk=sh.skeleton;const hi=sk?sk.bones.indexOf(sk.bones.find(b=>b.name==='Head')):-1;if(hi<0)continue;faceMaskAttr(T,sh,head,hi);
   let m=k.inkMats.get(sh.material);if(!m){m=maskedInk(T,sh.material);k.inkMats.set(sh.material,m);}sh.material=m;stats.inkMasked++;}
  // ② 2D 이목구비 데칼(먹선만 빼는 종류는 여기까지)
  if(!f){stats.decorated++;return true;}
  const d=new T.Mesh(k.geo,k.mat);d.name='r1331-face-decal';d.frustumCulled=false;d.userData.r1055Skip=true;d.userData.r451=true;d.userData.r1331Face=true;
  if(Number.isFinite(opts.layer))d.layers.set(opts.layer);head.add(d);stats.decals++;stats.decorated++;return true;
 }catch(e){fail(e);return false;}}
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}}
function inspect(){return {revision:REV,on,kinds:Object.keys(FACES),inkOnly:[...HUMAN_INK_ONLY],built:[...perKind.keys()],stats:{...stats},lastError};}
window.__STORYWORLD_FACE_R1331__=Object.freeze({revision:REV,faces:FACES,on:()=>on,set,decorate,inspect,frameOf});

// 설정 창 줄(R1322c 줄 바로 아래).
function addSetting(){try{const host=document.getElementById('boss3dR1322cToggle')?.closest('div');if(!host||document.getElementById('face1331Toggle'))return!!host;
 const d=document.createElement('div');d.innerHTML='<label><input type="checkbox" id="face1331Toggle"> 3D 얼굴 2D 이목구비</label><p class="small muted">사람 얼굴 3D 몹(서윤·세이렌 모르·호텔 회장 등 8종)의 얼굴 먹선을 빼고 2D 그림의 눈·입을 붙입니다. 각 3D 몹 설정과 함께 켜야 보이고, 다음 지역부터 적용됩니다.</p>';
 host.after(d);const box=d.querySelector('input');box.checked=on;box.addEventListener('change',()=>set(box.checked));return true;}catch(e){fail(e);return true;}}
if(typeof document!=='undefined'){let n=0;const t=setInterval(()=>{if(addSetting()||++n>120)clearInterval(t);},1000);}
})();
