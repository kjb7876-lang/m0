// R1331 인간형 3D 보스 얼굴(얼굴 먹선 빼기 + 2D 이목구비 데칼) — 정적·동작 회귀(Node, 진짜 three 로 합성 모델).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-face-r1331.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// ── 자산: 2D 에서 딴 얼굴 데칼 PNG(256² RGBA, 작게)
for(const k of ['seoyun','sirenMor','hotelChairman','herbwife']){const p='assets/r1331/face-'+k+'.png',b=rd('runtime-text/'+p);
 ok(!!b&&b.slice(1,4).toString()==='PNG','데칼 '+p+' 있음');if(!b)continue;
 ok(b.readUInt32BE(16)===256&&b.readUInt32BE(20)===256&&b[25]===6,p+' 256×256 RGBA');ok(b.length<=200000,p+' 200KB 이하('+b.length+')');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(/\nlet on=true;/.test(s),'기본 켜짐(사용자 11-26 08:49Z 전체 적용 지시 — 시범 꺼짐에서 바뀜)');ok(/storyworld\.r1331\.face/.test(s)&&/face31=/.test(s),'설정 키·주소 강제(?face31=1/0)');
ok(/r1055Skip=true/.test(s)&&/r451=true/.test(s),'데칼도 R1055 수묵·R451 국지 조명 제외');
ok(!/new T\.WebGLRenderer|new THREE\.WebGLRenderer/.test(s),'별도 렌더러 없음');
// ── R1322c 연결: 먹선 껍데기를 붙인 뒤, 그릴 메시 목록을 모으기 전에 부른다(데칼도 renderOrder 를 받게).
const c22=String(rd('client-source/mob-3d-r1322c.js')||'');const cr=(c22.match(/function create\(eid,kindId\)\{[\s\S]*?\nfunction dispose/)||[''])[0];
const iInk=cr.indexOf('addInk(model,k);'),iHook=cr.indexOf('__STORYWORLD_FACE_R1331__'),iMesh=cr.indexOf('const meshes=[]');
ok(iInk>=0&&iHook>iInk&&iMesh>iHook,'R1322c create(): addInk → R1331 decorate → meshes 순서');
ok(/__STORYWORLD_FACE_R1331__\?\.decorate\?\.\(model,kindId,T,\{layer:HOST_LAYER\}\)/.test(cr),'R1322c 가 kindId·HOST_LAYER 를 넘김');
ok(/try\{window\.__STORYWORLD_FACE_R1331__\?\.decorate\?\.\([^)]*\);\}catch\(e\)\{fail\(e\);\}/.test(cr),'훅 오류는 R1322c 를 멈추지 않음(try/fail)');
// ── 전체 적용(사용자 11-26 08:49Z '인간형 3D 몹은 다 저런 식으로'): 사람 얼굴이 있는 3D 를 그리는 오버레이 R1316·R1317 에도 같은 훅.
for(const [f,flag] of [['mob-3d-r1316.js','r1316Ink'],['mob-3d-r1317.js','r1317Ink']]){const c=String(rd('client-source/'+f)||'');const cr2=(c.match(/function create\(eid,kindId\)\{[\s\S]*?\nfunction dispose/)||[''])[0];
 const a=cr2.indexOf('addInk(model,k);'),h=cr2.indexOf('__STORYWORLD_FACE_R1331__'),m=cr2.indexOf('const meshes=[]');ok(a>=0&&h>a&&m>h,f+' create(): addInk → R1331 decorate → meshes 순서');
 ok(/try\{window\.__STORYWORLD_FACE_R1331__\?\.decorate\?\.\(model,kindId,T,\{layer:HOST_LAYER\}\);\}catch\(e\)\{fail\(e\);\}/.test(cr2),f+' 훅은 try/fail');
 ok(c.includes('userData.'+flag+'=true'),f+' 먹선 껍데기 표식 '+flag+' 그대로');}
ok(/HUMAN_INK_ONLY=new Set\(\['heel','guard','rose'\]\)/.test(s),'2D 얼굴이 옆모습·아주 작은 셋(붉은 하이힐 칼날·거짓천국 근위천사·흑장미 눈가린 신도)은 먹선만 뺌');
// ── 연결 다섯 곳
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');ok(html.indexOf('"./mob-3d-r1322c.js"')>=0&&html.indexOf('"./mob-3d-r1322c.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1322c 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&['seoyun','sirenMor','hotelChairman','herbwife'].every(k=>paths.has('assets/r1331/face-'+k+'.png')),'runtime-manifest 에 스크립트·데칼 4장');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1331/'"),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1331/r1331-cpu-check.cjs'),'CI 에 이 검사');
// ── 동작(진짜 three, 합성 모델)
(async()=>{
 const T=await import(path.join(R,'..','docs','vendor','three','build','three.module.js'));
 const store={};const mkWin=(search)=>{const w={location:{search},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  document:{createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}}),getElementById:()=>null},setInterval:()=>0,clearInterval(){}};w.window=w;return w;};
 const load=search=>{const w=mkWin(search);globalThis.document=w.document;vm.runInNewContext(s,w);return w.__STORYWORLD_FACE_R1331__;};
 // 합성 인간형: 뼈 [Root, Head]. 머리 = 반지름 .1 구(무게 Head 1), 몸 = 상자(무게 Root 1). 머리 뼈 위치 (0,1.5,0).
 function model(opt={}){const root=new T.Bone();root.name='Root';const head=new T.Bone();head.name='Head';head.position.set(0,1.5,0);root.add(head);
  const hr=opt.headR??.1;const hg=new T.SphereGeometry(hr,24,16);hg.translate(0,1.5+(opt.headY??.1),0);const bg=new T.BoxGeometry(.4,1.4,.25);bg.translate(0,.7,0);
  const add=(g,bi)=>{const n=g.getAttribute('position').count;g.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Array(n*4).fill(0).map((_,i)=>i%4===0?bi:0),4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(new Array(n*4).fill(0).map((_,i)=>i%4===0?1:0),4));return g;};
  // 경계: 무게 정확히 .5(Head .5 + Root .5) 꼭짓점 하나를 앞쪽에 둔다.
  const geo=(()=>{const a=add(hg,1),b=add(bg,0);const g=new T.BufferGeometry();const merge=name=>{const A=a.getAttribute(name),B=b.getAttribute(name);const arr=new A.array.constructor(A.array.length+B.array.length);arr.set(A.array);arr.set(B.array,A.array.length);return new A.constructor(arr,A.itemSize);};
   for(const n of ['position','normal','skinIndex','skinWeight'])g.setAttribute(n,merge(n));const ia=[...a.index.array],ib=[...b.index.array].map(i=>i+a.getAttribute('position').count);g.setIndex([...ia,...ib]);g.userData.headCount=a.getAttribute('position').count;return g;})();
  const half=geo.userData.headCount;// 머리 첫 꼭짓점 중 앞쪽 하나를 .5/.5 로
  let halfIdx=-1;const P=geo.getAttribute('position');for(let i=0;i<half;i++){if(P.getZ(i)>.06){halfIdx=i;break;}}
  geo.getAttribute('skinIndex').setXYZW(halfIdx,1,0,0,0);geo.getAttribute('skinWeight').setXYZW(halfIdx,.5,.5,0,0);
  const mat=new T.MeshStandardMaterial();const mesh=new T.SkinnedMesh(geo,mat);const sk=new T.Skeleton([root,head]);mesh.add(root);mesh.bind(sk);
  const g=new T.Group();g.add(mesh);
  const ink=new T.MeshBasicMaterial({side:T.BackSide});ink.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n//ink');};ink.customProgramCacheKey=()=>'ink';
  const shell=new T.SkinnedMesh(geo,ink);shell.userData.r1322cInk=true;shell.bind(sk,mesh.bindMatrix);mesh.parent.add(shell);
  g.updateMatrixWorld(true);return {g,head,mesh,shell,geo,half,halfIdx,ink};}
 ok(load('').on()===true,'기본 켜짐');const off=load('?face31=0');const m0=model();ok(off.on()===false,'?face31=0 로 꺼짐');ok(off.decorate(m0.g,'seoyun',T,{layer:2})===false&&m0.head.children.length===0,'꺼짐이면 아무것도 안 붙임');
 const F1=load('?face31=1');ok(F1.on()===true,'?face31=1 로 켜짐');
 ok(F1.decorate(model().g,'controller',T,{layer:2})===false,'표에 없는 종류(컨트롤러 등 비인간형)는 손대지 않음');
 ok(F1.decorate(new T.Group(),'seoyun',T,{layer:2})===false,'Head 뼈가 없으면 손대지 않음');
 const m=model();ok(F1.decorate(m.g,'seoyun',T,{layer:2})===true,'서윤 모델에 붙음');
 const d=m.head.children.find(o=>o.name==='r1331-face-decal');ok(!!d,'데칼이 머리 뼈 자식(고개·몸 움직임을 따름)');
 if(d){ok(d.layers.mask===(1<<2),'데칼 층 = 3D 몹 층(2)');ok(d.userData.r1055Skip===true&&d.userData.r451===true,'데칼 R1055·R451 제외 표식');
  const pa=d.geometry.getAttribute('position'),al=d.geometry.getAttribute('aR1331');let hits=0,bad=0;const c=new T.Vector3(0,.1,0);const v=new T.Vector3();
  for(let i=0;i<pa.count;i++){if(al.getX(i)<.5)continue;hits++;v.fromBufferAttribute(pa,i);const r=v.distanceTo(c);if(Math.abs(r-(.1+.002))>.006)bad++;}
  ok(hits>pa.count*.8,'격자 대부분이 얼굴 표면에 맞음('+hits+'/'+pa.count+')');ok(bad===0,'맞은 점은 표면 + 2mm(휜 데칼, 납작한 판 아님)');
  ok(d.material.depthWrite===false&&d.material.transparent===true&&d.material.polygonOffset===true,'데칼 재질: 깊이 안 씀·투명·면 앞당김');
  const sh={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};d.material.onBeforeCompile(sh);
  ok(/vR1331 = aR1331 \* smoothstep/.test(sh.vertexShader),'정점 셰이더에 돌아선 면 흐리기가 들어감(고정 이름 앵커 존재)');ok(/diffuseColor\.a \*= vR1331;/.test(sh.fragmentShader),'조각 셰이더에 알파 곱이 들어감');}
 const fm=m.geo.getAttribute('r1331Face');ok(!!fm,'먹선 가림 속성 생성');
 if(fm){const P=m.geo.getAttribute('position');let frontHead=0,frontOn=0,backOn=0,bodyOn=0;
  for(let i=0;i<P.count;i++){const z=P.getZ(i),on=fm.getX(i)>.5;if(i<m.half){if(z>.02+1e-6&&i!==m.halfIdx){frontHead++;if(on)frontOn++;}else if(z<=.02&&on)backOn++;}else if(on)bodyOn++;}
  ok(frontHead>0&&frontOn===frontHead,'머리 앞쪽(머리 뼈보다 2cm 앞) 꼭짓점은 전부 먹선 뺌');ok(backOn===0,'머리 뒤·옆(z ≤ 2cm, 귀·윤곽)은 먹선 유지');ok(bodyOn===0,'몸 꼭짓점은 먹선 유지');
  ok(fm.getX(m.halfIdx)===1,'경계: 머리 무게 정확히 .5 는 얼굴로 봄');}
 ok(m.shell.material!==m.ink&&typeof m.shell.material.onBeforeCompile==='function','먹선 껍데기 재질을 얼굴 가림판으로 바꿈');
 {const sh={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};m.shell.material.onBeforeCompile(sh);
  ok(sh.vertexShader.includes('//ink'),'원래 먹선 두께 셰이더도 그대로 적용(덧감싸기)');ok(/if \( vR1331Face > \.5 \) discard;/.test(sh.fragmentShader),'얼굴 쪽은 버림');
  ok(m.shell.material.customProgramCacheKey()!==m.ink.customProgramCacheKey(),'셰이더 캐시 키가 원래 먹선과 다름');}
 // 회귀: 같은 종류 두 번째 복제는 같은 데칼 지오메트리·같은 가림판 재질(몹마다 광선 다시 쏘지 않음)
 const m2=model();m2.ink.customProgramCacheKey=()=>'ink';F1.decorate(m2.g,'seoyun',T,{layer:2});const d2=m2.head.children.find(o=>o.name==='r1331-face-decal');
 ok(d&&d2&&d2.geometry===d.geometry&&d2.material===d.material,'같은 종류는 데칼 지오메트리·재질 재사용');
 // 경계: 머리가 아주 작아 광선이 다 빗나가면 데칼은 보이지 않음(알파 0), 오류 없음
 const ms=model({headR:.004,headY:.6});const F2=load('?face31=1');ok(F2.decorate(ms.g,'sirenMor',T,{layer:2})===true,'세이렌 모르 종류도 붙음');
 const ds=ms.head.children.find(o=>o.name==='r1331-face-decal');const as=ds?.geometry.getAttribute('aR1331');ok(!!as&&[...as.array].every(v=>v===0),'경계: 표면에 안 맞은 격자 점은 알파 0(허공에 안 뜸)');
 ok(F2.inspect().stats.errors===0&&F1.inspect().stats.errors===0,'오류 0');
 // 전체 적용 종류
 for(const k of ['hotelChairman','cyborgChairman','herbwife']){const mm=model();const F3=load('?face31=1');ok(F3.decorate(mm.g,k,T,{layer:2})===true&&!!mm.head.children.find(o=>o.name==='r1331-face-decal'),k+' 에 데칼');}
 ok(load('?face31=1').faces.cyborgChairman.tex===load('?face31=1').faces.hotelChairman.tex,'사이보그 회장 = 호텔 회장 같은 인물, 같은 데칼');
 for(const k of ['heel','guard','rose']){const mm=model();const F3=load('?face31=1');ok(F3.decorate(mm.g,k,T,{layer:2})===true,k+' 붙음(먹선만)');
  ok(!mm.head.children.some(o=>o.name==='r1331-face-decal'),k+' 데칼 없음');ok(/r1331-face-mask/.test(mm.shell.material.customProgramCacheKey()),k+' 먹선 얼굴 가림');}
 for(const k of ['goat','mannequin','trash','clockworkCollector','remnantHotelAsh']){const mm=model();ok(load('?face31=1').decorate(mm.g,k,T,{layer:2})===false&&mm.shell.material===mm.ink,k+'(사람 얼굴 아님) 손대지 않음');}
 {const mm=model();delete mm.shell.userData.r1322cInk;mm.shell.userData.r1317Ink=true;load('?face31=1').decorate(mm.g,'rose',T,{layer:2});ok(/r1331-face-mask/.test(mm.shell.material.customProgramCacheKey()),'R1316·R1317 먹선 표식(r1317Ink)도 알아봄');}
 // frameOf: 틀의 눈·입 자리가 3D 랜드마크로 정확히 간다
 for(const k of ['seoyun','sirenMor','hotelChairman','cyborgChairman','herbwife']){const f=F1.faces[k],map=F1.frameOf(f);const near=(a,b)=>Math.abs(a[0]-b[0])<1e-9&&Math.abs(a[1]-b[1])<1e-9;
  ok(near(map(.30,.36),f.eyeL)&&near(map(.70,.36),f.eyeR)&&near(map(.50,.80),f.mouth),k+' 틀 눈(.30/.70,.36)·입(.50,.80) → 3D 눈·입');
  ok(f.eyeL[0]<0&&f.eyeR[0]>0&&f.mouth[1]<f.eyeL[1],k+' 랜드마크 방향(왼눈 x<0, 오른눈 x>0, 입이 눈 아래)');}
 console.log(fail?'R1331 FAIL '+fail:'R1331 ALL OK');process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL 예외 '+(e.stack||e));process.exit(1);});
