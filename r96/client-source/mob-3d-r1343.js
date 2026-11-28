// R1343 금이 간 안경(ep1b03, 질투) 고품질 3D(사용자 2026-11-26 13:39Z "금이간안경나오는 모든몹과 보스는 3d화하고 고품질로").
//  · 대상: 보스 '호텔 부매니저 · 레비아탄'(새로, 지역 첫 보스 3D), 질투로 얼룩진 망령·유리 망령(R1316 초기 GLB 를 고품질 재제작으로 바꿈).
//    자산: Dots SW-3D-R1343 v1 결과(R2 레비아탄 = 2,415,516 B sha256 b2908c3d…, 03 망령 8e986215…, 04 유리 망령 57fce6ea…) 바이트 그대로.
//    나머지 3종(긴 뱀의 그림자·추녀의 한탄·금이 간 비교잔영)은 R1330 그대로.
//  · 구조는 R1330(=R1322c) 그대로: 2D 몸 그림 명령을 빼고 3D, 크기 = 2D 보이는 키(SIZE 표), R1055 수묵·R451 국소광 제외, R1325 색 맞춤, 공격 방향 atkYaw.
//  · 더한 것: cast 클립(유리 조각 폭풍 시전 e.r1343Cast 동안), 사람형 보스 얼굴 데칼 호출(R1331 있으면), takes(e) — 켜져 있으면 R1316 이 두 망령을 건너뛴다.
//  · 켜고 끄기: 7대죄 지역은 R1326 규칙으로 늘 켜짐. 그 밖(유리 망령이 나오는 다른 지역)은 설정 storyworld.r1343.envy3d / ?envy3d43=1·0, 기본 꺼짐(그때는 R1316 이 그대로 그림).
//  · 미검증: GPU 실기기·모바일 프레임, 실제 플레이 손맛, 레비아탄 얼굴 데칼(R1331 표 등록 전).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_R1343__)return;
const REV='R1343-envy3d-1',KEY='storyworld.r1343.envy3d',HOST_LAYER=2,MAX_LIVE=16,FADE=.12,YAW_RATE=8,DEATH_HOLD=1.7;
// id: [GLB, 2D 경로 줄기(정규식), 게임 이름(접두·접미 뗀 것)]
const TABLE={
 leviathan:['assets/r1343/leviathan.glb',/(?!)/,'호텔 부매니저 · 레비아탄',true],
 jealousyWraith:['assets/r1343/jealousy-wraith.glb',/(?!)/,'질투로 얼룩진 망령'],
 glassWraith:['assets/r1343/glass-wraith.glb',/(?!)/,'유리 망령']};
const KINDS={};for(const [id,[glb,test,name,boss]] of Object.entries(TABLE))KINDS[id]={glb,test,name,boss:!!boss};
// 맘몬은 인간형 0페이즈만 3D(Dots: 후속 형태 미제작) — 2D 몸 그림이 악마형·후속 형태 경로면 그 프레임은 2D 그대로.
// 크기 재기용 2D 몸 그림 경로(종류 판정에는 쓰지 않음 — 같은 그림을 쓰는 다른 몹이 3D 로 바뀌지 않게). 헤드리스 실측 경로(R1330 _probe).
const SIZE={leviathan:/b03-(?:idle6|hit4)|envy[_-](?:sister|human)|envy-(?:idle|attack|hit|rain)/,jealousyWraith:/jealousy-wraith/,glassWraith:/glass-wraith|\/m018\b/};
for(const [id,re] of Object.entries(SIZE))if(KINDS[id])KINDS[id].size=re;
const BOSS_KINDS=new Set(Object.keys(KINDS).filter(id=>KINDS[id].boss));
// 이름에 번호가 붙은 정확한 대상(대수문장 05)은 번호를 떼지 않고 맞춘다 — 01·02·04·06 은 그림이 달라 2D 그대로.
const EXACT=new Map(Object.entries(KINDS).filter(([,k])=>/\s\d+$/.test(k.name)).map(([id,k])=>[k.name,id]));
const HOLD_2D=new Set(['ID 배양 점액체 우두머리','ID 잔류 점액체']);// Dots 배정 HOLD(10-03·10-04 색 지시 충돌)
const BY_NAME=new Map(Object.entries(KINDS).filter(([,k])=>!EXACT.has(k.name)).map(([id,k])=>[k.name,id]));
const LOOP=new Set(['idle','walk']);
const INK=[{color:0x0e0406,width:.018,slot:0},{color:0x6a1616,width:.024,slot:1}];
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
// 몹이 가진 그림 중 몸이 아닌 것(이펙트·표식) — 빼지 않는다.
const NOT_BODY=/(^|[\/_.-])(fx|vfx|pixelfx|effects?|sigil|telegraph|smoke|spark|blood|proj|projectile|bullet|beam|aura|halo|shadow|icon|bar)([\/_.-]|$)/i;
const stats={frames:0,consumed:0,hidden:0,ghosts:0,loads:0,loadMs:{},errors:0,capped:0,created:0,disposed:0,measured:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};

let on=false;
try{if(navigator.webdriver)on=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const m=/[?&]envy3d43=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}

let T=null,hostRenderer=null,mods=null;
const kinds={};
const inst=new Map();
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
// 불면귀 마을(last302 잠들지 못하는 마을·last303 불면귀)은 새 3D 를 넣지 않는다(사용자 11-26: 2D 퀄이 좋음).
const NO3D=new Set(['last302','last303']);
const inStory=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600&&!NO3D.has(String(room.id));}catch(_){return false;}};
// R1326: 7대죄 지역은 늘 3D, 불면귀 마을은 늘 2D(사용자 11-26).
const active=()=>(window.__STORYWORLD_MOB3D_ZONE_R1326__?.pick?.(on)??on)&&inStory()||(window.__STORYWORLD_MOB_DIM_R1385__?.active?.('r1343',false)??false)&&inStory();
const enemyById=id=>{try{return (room?.enemies||[]).find(e=>String(e.id)===id)||null;}catch(_){return null;}};
const baseName=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s+(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'').trim();// murder02·03 은 '… 잔향 3' 처럼 번호가 붙는다
const kindOfPath=p=>{const s=String(p||'');if(!s||/^r409/.test(s)&&!/:u:/.test(s))return null;for(const id in KINDS)if(KINDS[id].test.test(s))return id;return null;};
const memo=new Map();// enemyId → kind | ''
const exactName=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s+(후속 증원|증원|추격대)$/,'').trim();
function enemyKind(id,rows){if(memo.has(id))return memo.get(id);const e=enemyById(id);if(!e)return null;
 let k=null;for(const c of rows){k=kindOfPath(c.sourcePath);if(k)break;}
 if(!k)k=EXACT.get(exactName(e.name))||null;
 if(!k){const n=baseName(e.name);k=BY_NAME.get(n)||null;
  // '우두머리' 는 자기 모델이 있으면 그것(태엽 수집자 우두머리), HOLD 이면 2D(ID 배양 점액체 우두머리), 아니면 기본 몹 모델.
  if(!k&&/\s우두머리$/.test(n)&&!HOLD_2D.has(n))k=BY_NAME.get(n.replace(/\s+우두머리$/,''))||null;}
 // 진짜 보스(e.boss)는 보스 표시한 항목만(다른 보스는 2D 그대로 — 뿌리의 문지기 R1312·탐식 R1315 는 각자 길).
 if(e.boss&&!BOSS_KINDS.has(k))k=null;
 memo.set(id,k||'');return k;}
const isBody=c=>c?.kind==='image'&&!NOT_BODY.test(String(c.sourcePath||''));
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;

function modules(){
 if(!mods)mods=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),import('./vendor/three/examples/jsm/utils/SkeletonUtils.js')])
  .then(async([{GLTFLoader},{MeshoptDecoder},SU])=>{await MeshoptDecoder.ready;return {GLTFLoader,MeshoptDecoder,SU};});
 return mods;
}
const SELF_LIT=.62;
function tone(source){const m=source.clone();m.transparent=true;m.opacity=1;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;
 if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);
 // 몹 고유 빛(emissiveMap 이 따로 있는 눈·균열·약병·등불)은 그대로, 나머지는 원화를 스스로 .5 비춰 어두운 바닥에서 결이 보이게(2D 몹 그림은 조명 없이 원화 밝기).
 const glow=!!m.emissiveMap||(m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>.05);
 if(!glow&&m.emissive&&m.map){m.emissive.setRGB(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=SELF_LIT;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1343Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1343Luma),gl_FragColor.rgb,.9)*1.2-.5)*1.22+.5,0.0,1.0);`);};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1343-hanji-tone-v1';};m.needsUpdate=true;return m;}
function inkMaterial(scaleX,ink){const w=(ink.width/Math.max(1e-9,Math.abs(scaleX)||1)).toFixed(6);const m=new T.MeshBasicMaterial({color:ink.color,side:T.BackSide,transparent:true,opacity:1,depthTest:true,depthWrite:true});
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#if defined( USE_SKINNING )\ntransformed += normalize( objectNormal ) * '+w+';\n#endif');};
 m.customProgramCacheKey=()=>'r1343-ink-shell-v1|'+w+'|'+ink.color;return m;}
function addInk(model,k){const skinned=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.r1343Ink)skinned.push(o);});
 for(const mesh of skinned)for(const ink of INK){const key=Math.abs(mesh.scale.x).toFixed(9)+'|'+ink.color;let m=k.ink.get(key);if(!m){m=inkMaterial(mesh.scale.x,ink);k.ink.set(key,m);}
  const shell=new T.SkinnedMesh(mesh.geometry,m);shell.name='r1343-ink-shell';shell.userData.r1343Ink=true;shell.userData.r1343Slot=ink.slot;shell.bind(mesh.skeleton,mesh.bindMatrix);shell.bindMode=mesh.bindMode;
  shell.frustumCulled=false;shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.copy(mesh.scale);shell.layers.set(HOST_LAYER);mesh.parent.add(shell);}}
function load(id){
 const k=kinds[id]||(kinds[id]={state:'idle'});if(k.state!=='idle'||!T)return;k.state='loading';stats.loads++;const t0=performance.now();
 Promise.all([modules(),fetch(KINDS[id].glb,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();})])
 .then(async([M,data])=>{const base=new URL('.',new URL(KINDS[id].glb,document.baseURI)).href;const gltf=await new M.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder).parseAsync(data,base);
  const pick=re=>gltf.animations.find(a=>re.test(a.name));
  const clips={idle:pick(/^idle$/i),walk:pick(/^walk$/i)||pick(/^float$/i),attack:pick(/^attack/i),hit:pick(/^hit$/i),death:pick(/^death$/i)};
  const castClip=pick(/^cast$/i);
  for(const [p,c] of Object.entries(clips))if(!c)throw Error(id+' GLB 에 클립 없음: '+p);
  const cache=new Map();gltf.scene.traverse(o=>{if(!o.isMesh)return;const one=src=>{if(!cache.has(src))cache.set(src,tone(src));return cache.get(src);};o.material=Array.isArray(o.material)?o.material.map(one):one(o.material);});
  gltf.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(gltf.scene,true);const minY=Number.isFinite(box.min.y)?Math.min(0,box.min.y):0;
  const fin=v=>Number.isFinite(v)?v:0;if(castClip)clips.cast=castClip;
  Object.assign(k,{state:'ready',scene:gltf.scene,clips,SU:M.SU,mats:[...cache.values()],ink:new Map(),minY,height:Math.max(.2,Number.isFinite(box.max.y)?box.max.y-minY:1.7),
   rest:{x0:fin(box.min.x),x1:fin(box.max.x),z0:fin(box.min.z),z1:fin(box.max.z),h:Math.max(.2,Number.isFinite(box.max.y)?box.max.y-minY:1.7)}});
  stats.loadMs[id]=Math.round(performance.now()-t0);
 }).catch(e=>{k.state='failed';fail(e);});
}
function create(eid,kindId){
 const k=kinds[kindId];const model=k.SU.clone(k.scene);model.name='r1343-'+kindId+'-model';model.position.y=-k.minY;
 model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){o.userData.r1055Skip=true;o.userData.r451=true;o.frustumCulled=false;o.castShadow=o.receiveShadow=false;}});addInk(model,k);
 // 사람형 보스 얼굴 데칼(R1331 이 있으면, 종류 등록은 R1331 표 몫).
 if(kindId==='leviathan'){try{window.__STORYWORLD_FACE_R1331__?.decorate?.(model,kindId,T,{layer:HOST_LAYER});}catch(e){fail(e);}}
 const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const g=new T.Group();g.name='r1343-mob3d:'+eid;g.layers.set(HOST_LAYER);g.visible=false;g.add(model);
 const mixer=new T.AnimationMixer(model),actions={};
 for(const [pose,clip] of Object.entries(k.clips)){const a=mixer.clipAction(clip);a.play();a.enabled=false;a.setEffectiveWeight(0);
  if(!LOOP.has(pose)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[pose]={a,clip};}
 const i={id:eid,kind:kindId,g,model,meshes,mixer,actions,pose:'idle',poseT:0,w:{idle:1},yaw:NaN,lastT:NaN,seen:-1,x:0,y:0,h:0,deadAt:null,flash:0,visible:false,order:NaN,hs:[],target:NaN};
 stats.created++;return i;}
function dispose(i){try{i.g.removeFromParent();i.mixer.stopAllAction();i.mixer.uncacheRoot(i.model);}catch(e){fail(e);}inst.delete(i.id);stats.disposed++;}
function attach(r,i){if(i.g.parent!==r.scene){i.g.removeFromParent();r.scene.add(i.g);}}
function hide(i){i.g.visible=false;i.visible=false;}
function hideAll(){for(const i of inst.values())hide(i);}
function setOrder(i,order){if(!Number.isFinite(order)||order===i.order)return;i.order=order;for(const o of i.meshes)o.renderOrder=o.userData.r1343Ink?order-1-(o.userData.r1343Slot||0)*.5:order;}

// 2D 몸 그림 칸의 알파 상자(보이는 키 비율) — 그림·칸마다 한 번만 잰다.
const alphaCache=new WeakMap();let probe=null;
function visibleFrac(c){const im=c.image,r=c.sourceRect;if(!im||!Array.isArray(r))return null;const [sx,sy,sw,sh]=r.map(Math.round);if(!(sw>2&&sh>2))return null;
 let per=alphaCache.get(im);if(!per){per=new Map();alphaCache.set(im,per);}const key=sx+','+sy+','+sw+','+sh;if(per.has(key))return per.get(key);
 let v=null;try{const W=Math.min(96,sw),H=Math.min(128,sh);probe=probe||document.createElement('canvas');probe.width=W;probe.height=H;const g=probe.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,W,H);g.drawImage(im,sx,sy,sw,sh,0,0,W,H);
  const d=g.getImageData(0,0,W,H).data;let top=-1,bot=-1;for(let y=0;y<H&&top<0;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40){top=y;break;}
  for(let y=H-1;y>=0&&bot<0;y--)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40){bot=y;break;}
  if(top>=0&&bot>=top)v=(bot-top+1)/H;stats.measured++;}catch(_){v=null;}
 per.set(key,v);return v;}
const quadH=c=>{const p=c.points;if(!Array.isArray(p)||p.length!==4)return NaN;return (Math.hypot(p[3][0]-p[0][0],p[3][1]-p[0][1])+Math.hypot(p[2][0]-p[1][0],p[2][1]-p[1][1]))/2;};
// R1316b: 표본은 화면 픽셀 ÷ pxPerUnit(줌과 무관한 값)으로 저장하고, 화면 키는 매 프레임 지금 줌으로 다시 셈(R217 시야 배율을 바꿔도 따라감).
function measure2D(i,rows){if(Number.isFinite(i.targetU)&&i.hs.length>=6)return;const ppu=hostRenderer?pxPerUnit(hostRenderer):0;if(!(ppu>0))return;const k=KINDS[i.kind];
 const re=k.size||k.test;let main=rows.filter(c=>re.test(String(c.sourcePath||'')));if(!main.length&&i.hs.length<6&&(!k.size||stats.frames-(i.born||0)>30))main=rows;
 for(const c of main){const f=visibleFrac(c),q=quadH(c);if(f>0&&q>0){i.hs.push(f*q/pxPerUnit(hostRenderer));break;}}
 if(i.hs.length){const s=[...i.hs].sort((a,b)=>a-b);i.targetU=s[s.length>>1];i.target=i.targetU*ppu;}}
function pxPerUnit(r){const p=r.projection;return p.tile*p.zoom*Math.sqrt(1.5);}
// 화면에서의 세로 폭은 서 있는 키만이 아니라 몸 길이(깊이)도 기울어진 카메라에 비쳐 생긴다(사냥개처럼 긴 몸).
// → 지금 방향으로 돌린 쉬는 자세 상자의 8 꼭짓점을 게임 투영(worldToScreen)으로 비춰 세로 폭을 재고, 그 폭이 2D 의 보이는 키와 같도록 크기를 정한다.
const S0=.5;
function spanAt(i,r,yaw){const k=kinds[i.kind],R=k.rest,c=Math.cos(yaw),s=Math.sin(yaw),P=r.projection;if(!R||typeof P.worldToScreen!=='function')return NaN;let lo=Infinity,hi=-Infinity;
 for(const x of [R.x0,R.x1])for(const z of [R.z0,R.z1])for(const y of [0,R.h]){const wx=(x*c+z*s)*S0,wz=(-x*s+z*c)*S0;const q=P.worldToScreen(i.x+wx,i.y+wz,i.h+y*S0);const v=Number(q?.y);if(Number.isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}}
 return hi-lo;}
function scaleFor(i,r){const k=kinds[i.kind];let px=i.target;if(!(px>8)){const h=Math.max(16,typeof actorHeight==='function'?actorHeight():60);px=h;}
 const span=spanAt(i,r,Number.isFinite(i.yaw)?i.yaw:0);if(span>1)return S0*px/span;
 return px/(pxPerUnit(r)*k.height);}

function choosePose(i,e,dead,t){
 if(dead)return 'death';
 const fl=Number(e?.flash)||0;if(fl>0&&fl>i.flash+1e-6)i.hitAt=t;i.flash=fl;
 if(Number.isFinite(i.hitAt)&&t-i.hitAt<i.actions.hit.clip.duration)return 'hit';
 // R1343: 유리 조각 폭풍 시전 중(envy-glass-r1343 가 e.r1343Cast 를 세움)이면 cast 클립.
 if(e?.r1343Cast&&i.actions.cast)return 'cast';
 if(e?.state==='attack')return 'attack';
 const mv=e&&(e.moving===true||Math.hypot(Number(e.moveDX)||0,Number(e.moveDY)||0)>1e-4)&&e.state!=='idle';
 return mv?'walk':'idle';
}
// 공격 중 몸 방향 = 판정 각(R444 atkAngle 과 같은 순서): 근접 e.attack.angle(R1028 가짜 공격 자세 storyWorldPose5 는 제외) > 원거리 rangedAim > 진행 중 R61 동작 각.
// 엔진 각은 atan2(dy,dx), 이 모델 yaw 는 atan2(dx,dy) 라 바꿔 넣는다. 없으면 NaN(→ 영웅 쪽).
function atkYaw(e){try{const a=e.attack;let g=null;if(a&&!a.storyWorldPose5&&Number.isFinite(a.angle))g=a.angle;else if(e.rangedWindup>0&&Number.isFinite(e.rangedAim))g=e.rangedAim;
 else{const r=e.r61Action;if(r&&Number.isFinite(r.angle)&&typeof time==='number'&&time<Number(r.endAt))g=r.angle;}return g==null?NaN:Math.atan2(Math.cos(g),Math.sin(g));}catch(_){return NaN;}}
function animate(i,e,dead,t,alpha){
 const dt=Number.isFinite(i.lastT)?Math.max(0,Math.min(.1,t-i.lastT)):0;i.lastT=t;
 const pose=choosePose(i,e,dead,t);if(pose!==i.pose){i.pose=pose;i.poseT=0;if(!LOOP.has(pose))i.actions[pose].a.reset();}else i.poseT+=dt;
 let tx=NaN;if(e&&!dead){const dx=Number(e.moveDX)||0,dy=Number(e.moveDY)||0;if(pose==='walk'&&Math.hypot(dx,dy)>1e-5)tx=Math.atan2(dx,dy);
  else{tx=atkYaw(e);if(!Number.isFinite(tx)&&typeof player==='object'&&player)tx=Math.atan2(Number(player.x)-e.x,Number(player.y)-e.y);}}
 if(Number.isFinite(tx)){if(!Number.isFinite(i.yaw))i.yaw=tx;let df=tx-i.yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;i.yaw+=df*Math.min(1,dt*YAW_RATE);}
 i.g.rotation.y=Number.isFinite(i.yaw)?i.yaw:0;
 for(const k in i.actions){const target=k===pose?1:0,cur=i.w[k]||0;i.w[k]=dt>0?Math.max(0,Math.min(1,cur+(target?1:-1)*dt/FADE)):target;}
 let total=0;for(const k in i.w)total+=i.w[k];total=total||1;
 const speed=e?Math.max(.6,Math.min(1.8,(Number(e.speed)||1)/1.04)):1;
 for(const [k,A] of Object.entries(i.actions)){const w=(i.w[k]||0)/total;A.a.enabled=w>1e-3;A.a.setEffectiveWeight(w);
  if(LOOP.has(k)){if(A.a.enabled)A.a.time=(A.a.time+dt*(k==='walk'?speed:1))%A.clip.duration;}
  else if(k===pose){const d=A.clip.duration;
   const tt=k==='death'&&e?.deadAt!=null?Math.max(0,t-Number(e.deadAt)):k==='attack'?i.poseT%(d+.25):i.poseT;A.a.time=Math.min(d*.999,tt);}}
 if(!window.__STORYWORLD_MOB3D_STYLE_R1325__?.hold?.(i,t))i.mixer.update(0);
 i.g.visible=Math.max(0,Math.min(1,alpha))>.02;i.visible=i.g.visible;
}
// 투영 상자 계산은 근사라(실측 약 .8배) 걷기·쉬기 자세일 때 가끔 실제 꼭짓점을 비춰 재고, 2D 보이는 키와의 비를 천천히 보정한다.
function projH(i,r,n){const cam=r.camera,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity;i.g.updateMatrixWorld(true);
 i.g.traverse(o=>{const pos=o.isMesh&&!o.userData.r1343Ink&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/n));
  for(let k=0;k<pos.count;k+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(k,v);else v.fromBufferAttribute(pos,k);v.applyMatrix4(o.matrixWorld).project(cam);const y=(1-v.y)*H/2;if(Number.isFinite(y)){top=Math.min(top,y);bottom=Math.max(bottom,y);}}});
 return bottom-top;}
function place(i,r,x,y,h){i.x=x;i.y=y;i.h=h;i.g.position.set(x,h,y);const c=Number.isFinite(i.corr)?i.corr:1;i.g.scale.setScalar(scaleFor(i,r)*c);
 if(i.target>8&&(i.pose==='walk'||i.pose==='idle')&&(!(i.corrN>=2)||(stats.frames+(i.salt||0))%12===0)&&r.camera&&r.projection?.height){const m=projH(i,r,240);
  if(m>4){i.corrN=(i.corrN||0)+1;i.corr=(()=>{/* R1393: 걷기·대기 위상마다 크기가 출렁이지 않게 표본 중앙값으로 천천히(없거나 끄면 예전 식) */try{const v=window.__STORYWORLD_MOB3D_SIZE_R1393__?.corr?.(i,c,i.target,m);if(Number.isFinite(v))return v;}catch(_){}return Math.max(.6,Math.min(1.8,c*Math.pow(i.target/m,i.corrN<=2?1:.5)));})();}}}

let frameTime=null;
function consume(r,commands){
 stats.frames++;
 if(!active()||!Array.isArray(commands)){hideAll();return;}
 T=r.T;hostRenderer=r;const t=Number.isFinite(frameTime)?frameTime:now();
 // 몹별 그림 명령 모으기(유령 복사·이펙트 소유는 제외)
 const byEnemy=new Map();
 for(const c of commands){if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.owner.r350)continue;let id=String(c.owner.id||'');if(id.startsWith('r248:mob:'))id='enemy:'+id.slice(9);else if(!id.startsWith('enemy:'))continue; // R248 고유 몹 그림은 'r248:mob:<몹 id>' 소유로 그린다(ep1a09b 기억 운반거미)
  let b=byEnemy.get(id);if(!b)byEnemy.set(id,b={rows:[],owner:c.owner,alpha:0,order:-Infinity});b.rows.push(c);}
 const bodies=new Map();
 for(const [oid,b] of byEnemy){const kid=enemyKind(oid.slice(6),b.rows);if(!kid||!(window.__STORYWORLD_MOB_DIM_R1385__?.use?.('r1343',kid,(window.__STORYWORLD_MOB3D_ZONE_R1326__?.pick?.(on)??on))??true))continue;b.kid=kid;b.rows=b.rows.filter(isBody);if(!b.rows.length)continue;
  if(KINDS[kid].deny&&b.rows.some(c=>KINDS[kid].deny.test(String(c.sourcePath||''))))continue;
  for(const c of b.rows){b.alpha=Math.max(b.alpha,Number(c.style?.globalAlpha??1));const o=Number(c.order);if(Number.isFinite(o))b.order=Math.max(b.order,o);}
  bodies.set(oid,b);const k=kinds[kid];if(!k||k.state==='idle')load(kid);}
 const px=Number(player?.x)||0,py=Number(player?.y)||0;
 const order=[...bodies.entries()].filter(([,b])=>kinds[b.kid]?.state==='ready').sort((a,b)=>(KINDS[b[1].kid].boss?1:0)-(KINDS[a[1].kid].boss?1:0)||Math.hypot(a[1].owner.x-px,a[1].owner.y-py)-Math.hypot(b[1].owner.x-px,b[1].owner.y-py));
 if(order.length>MAX_LIVE)stats.capped+=order.length-MAX_LIVE;
 const take=order.slice(0,MAX_LIVE),drop=new Set();
 for(const [oid,b] of take){const eid=oid.slice(6);let i=inst.get(eid);if(i&&i.kind!==b.kid){dispose(i);i=null;}
  if(!i){try{i=create(eid,b.kid);i.born=stats.frames;i.salt=(Math.random()*12)|0;inst.set(eid,i);}catch(e){fail(e);continue;}}
  try{const e=enemyById(eid),dead=!!(e&&(e.hp<=0))||b.owner.alive===false;if(dead&&i.deadAt==null)i.deadAt=Number.isFinite(Number(e?.deadAt))?Number(e.deadAt):t;if(!dead)i.deadAt=null;
   if(dead&&t-i.deadAt>=DEATH_HOLD){hide(i);i.seen=t;for(const c of b.rows)drop.add(c);continue;}
   if(!dead)measure2D(i,b.rows);window.__STORYWORLD_MOB3D_STYLE_R1325__?.sample?.(i,b.rows);
   if(Number.isFinite(i.targetU))i.target=i.targetU*pxPerUnit(r);
   attach(r,i);setOrder(i,Number.isFinite(b.order)?b.order:12);i.x=Number(b.owner.x);i.y=Number(b.owner.y);i.h=Number(b.owner.renderHeight)||0;animate(i,e,dead,t,dead?1:b.alpha);place(i,r,i.x,i.y,i.h);i.seen=t;
   for(const c of b.rows)drop.add(c);}catch(e){fail(e);hide(i);}}
 for(const i of [...inst.values()]){if(i.seen===t)continue;const e=enemyById(i.id);
  if(i.deadAt!=null&&t-i.deadAt<DEATH_HOLD&&i.visible){try{animate(i,e,true,t,1);}catch(e2){fail(e2);hide(i);}continue;}
  hide(i);if(!e||t-i.seen>8)dispose(i);}
 if(!drop.size)return;
 const keys=new Set();for(const c of drop)if(c.key!=null)for(const p of GHOST_PREFIX)keys.add(p+c.key);
 for(let n=commands.length-1;n>=0;n--){const c=commands[n];if(drop.has(c)){commands.splice(n,1);stats.hidden++;}else if(c?.owner?.r350&&c.key!=null&&keys.has(String(c.key))){commands.splice(n,1);stats.ghosts++;}}
 stats.consumed++;
}
// 감싼 장면은 WeakSet 으로 기억하고, 밑 함수의 표식(R1302 __r1304·R1312 __r1312 등)을 새 함수에 옮긴다(옮기지 않으면 서로 매 프레임 다시 감싸 호출이 쌓인다).
const wrappedScenes=new WeakSet();
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1343||wrappedScenes.has(scene))return;const base=scene.render,w=function(commands){try{consume(r,commands);}catch(e){fail(e);hideAll();}return base.apply(this,arguments);};Object.assign(w,base);w.__r1343=true;wrappedScenes.add(scene);scene.render=w;}
const wrapped=new WeakSet();let depth=0;
const wrapFn=fn=>{if(fn.__r1343)return fn;const w=function(frame){if(depth===0){try{frameTime=Number.isFinite(frame?.time)?frame.time:null;wrapCommands(this);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};Object.assign(w,fn);w.__r1343=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(!r)return;if(Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}wrapCommands(r);if(!T)T=r.T;
 if(hostRenderer&&hostRenderer!==r){for(const i of [...inst.values()])dispose(i);}hostRenderer=r;}catch(e){fail(e);}}
let lastRoom=null;
(function tick(){wrapInst();try{const id=typeof room==='object'&&room?room.id:null;if(id!==lastRoom){lastRoom=id;memo.clear();}}catch(_){}if(!active())hideAll();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('envy3dR1343Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='envy3dR1343Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="envy3dR1343Toggle"> 금이 간 안경 3D(시험, SW-R1343)</label><p class="small muted">Dots 가 새로 만든 질투 보스 레비아탄과 질투로 얼룩진 망령·유리 망령 고품질 3D 입니다. 7대죄 지역에서는 늘 켜지고, 이 설정은 그 밖 지역용입니다. 끄면 원래 그림입니다.</p>';
 host.appendChild(d);const el=d.querySelector('#envy3dR1343Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('envy3dR1343Toggle');if(el)el.checked=on;if(!on)hideAll();return on;}
function measure(id){const i=inst.get(String(id));const r=hostRenderer;if(!i||!i.visible||!r)return null;i.g.updateMatrixWorld(true);
 const cam=r.camera,W=r.projection.width,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 i.g.traverse(o=>{const pos=o.isMesh&&!o.userData.r1343Ink&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/1500));
  for(let n=0;n<pos.count;n+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(n,v);else v.fromBufferAttribute(pos,n);v.applyMatrix4(o.matrixWorld).project(cam);
   const x=(v.x+1)*W/2,y=(1-v.y)*H/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});
 const anchor=r.projection.worldToScreen(i.x,i.y,i.h);
 return {count,top,bottom,left,right,h:bottom-top,anchor,target:i.target,kind:i.kind,order:i.order};}
function inspect(){const list=[...inst.values()];return {revision:REV,on,active:active(),loaded:Object.keys(kinds).filter(k=>kinds[k].state==='ready'),failed:Object.keys(kinds).filter(k=>kinds[k].state==='failed'),
 shown:list.filter(i=>i.visible).length,instances:list.map(i=>({id:i.id,kind:i.kind,pose:i.pose,visible:i.visible,target:Number.isFinite(i.target)?Math.round(i.target):null,yaw:Number.isFinite(i.yaw)?+i.yaw.toFixed(3):null})),stats:{...stats},lastError};}
// 검사용: 표의 종류를 모두 미리 읽는다(실제 플레이에서는 그 몹이 처음 보일 때 읽음).
function preload(){if(!T){const r=currentHost();if(r)T=r.T;}for(const id of Object.keys(KINDS))load(id);return Object.keys(KINDS).length;}
window.__STORYWORLD_MOB3D_R1343__=Object.freeze({revision:REV,kinds:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.glb]))),names:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.name]))),on:()=>on,set,inspect,measure,preload,kindOf:id=>memo.get(String(id))||null,
 /* R1316 이 같은 몹(질투로 얼룩진 망령·유리 망령)을 겹쳐 그리지 않게: 이 오버레이가 켜져 있고 이름이 표에 있으면 true */
 takes:e=>{try{if(!e||!active())return false;const n=baseName(e.name);return !e.boss&&(BY_NAME.has(n)||BY_NAME.has(n.replace(/\s+우두머리$/,'')));}catch(_){return false;}}});
})();
