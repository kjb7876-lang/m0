// R1329 거미동굴·늪지대 몹 3D(사용자 2026-11-26 08:18Z "보랏빛 알집지기랑 보라검 천사 3d로 고품질로 만들어서 적용해줘 수호병은 그대로 이질감없네",
//   08:22Z "늪 뿌리추적자는 3d 첫맵꺼에 초록색늪색넣어서 스리디로하고 혼령체는 투디나두고 수렁주문사랑 뿔악마군주 쓰리디로").
//  · 대상: dist01 보랏빛 알집지기(우두머리·'중간보스 · ' 도 같은 모델, 2D 처럼 크기만 다름)·보라검천사(중간보스 mb-dist01),
//    dist02 수렁 주문사·늪의 뿔악마 군주(중간보스 mb-dist02) = Dots SW-3D-R1329 새 모델(오기 전에는 glb:null → 2D 그대로),
//    늪 뿌리 추적자 = 첫 맵 뿌리 추적자 3D(R1312, Dots MobGLB-02 R2)를 그대로 쓰고 2D 늪 그림 색에 완전히 맞춤(초록 늪색).
//  · 08:46Z "피냄새추적자 3d화 그리고 핓빛수호자 보스도 3d만들어봐": dist03 피냄새 추적자 = 2D 와 같은 디자인(용암 균열 검은 사냥개·사슬 목줄)인
//    R1316 분노의 사냥개 3D(Dots, 바이트 그대로)를 재사용하고 2D 색에 완전히 맞춤, 핏빛 수호로 추격자(중간보스 mb-dist03) = Dots SW-3D-R1329 v2 모델 대기.
//    같은 지역 보라검 추격천사(R248 임시 도트)는 요청 밖이라 2D 그대로.
//  · 2D 그대로: 거미줄에 묶인 수호병·늪에서 되살아난 혼령체(사용자), 늪의 염소머리 악마(언급 없음 — R1316 시험 설정 몫).
//  · 손질 = 색 맞춤만(사용자 11-26 08:03Z R1325 비교 "색맞춤만이 좋은듯"): 같은 몹의 2D 몸 그림 칸과 3D 텍스처의 평균색(밝기 .12~.92)을 재서
//    채널 배율(r1329Tint)을 TINT 만큼 곱한다. 먹 껍질·명암 단·모션 끊기 없음. 한지 톤·자체조명은 R1322c 와 같음(어두운 바닥에서 결이 보이게).
//  · 3D 메시는 R1055 수묵·R451 국지 조명에서 뺀다(userData.r1055Skip·r451). 이야기 층의 dist01·dist02 에서만.
//  · 켜고 끄기: 설정 '3D 거미동굴·늪지대·무너진 성 몹' / storyworld.r1329.mob3d('on'|'off') / 주소 ?mob3d29=1·0.
//    기본: 사람이 할 때 켜짐(사용자 "적용해줘"), 자동 검사(navigator.webdriver)는 꺼짐 — 기존 2D 몹 검사 기준선 보존(R1312 와 같은 규칙).
//  · 나머지 그리기 길(2D 몸 명령만 빼기·크기·동작·방향·renderOrder·감싸기 표식)은 R1322c 와 같다.
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이 손맛.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_R1329__)return;
const REV='R1329-mob3d-1',KEY='storyworld.r1329.mob3d',HOST_LAYER=2,MAX_LIVE=16,FADE=.12,YAW_RATE=8,DEATH_HOLD=1.7;
const ZONES=new Set(['dist01','dist02','dist03']);
// id: {glb(없으면 2D 그대로), 2D 경로 줄기, 게임 이름(접두·접미 뗀 것), 색 맞춤 세기}
const TABLE={
 eggkeeper:{glb:null,ref:['assets/r380/mobs/purple-eggkeeper-v1.webp',0,0,256,256],test:/purple-eggkeeper/,name:'보랏빛 알집지기',tint:.75},
 violetAngel:{glb:null,ref:['assets/r104/bosses/mb-dist01-p4.webp',0,0,477,447],test:/mb-dist01/,name:'보라검천사',tint:.75,boss:true},
 swampMage:{glb:null,ref:['assets/r380/mobs/swamp-mage-darkgreen-v1.webp',0,0,256,256],test:/swamp-mage/,name:'수렁 주문사',tint:.75},
 hornLord:{glb:null,ref:['assets/r104/bosses/mb-dist02-p4.webp',0,0,386,405],test:/mb-dist02/,name:'늪의 뿔악마 군주',tint:.75,boss:true},
 swampStalker:{glb:'assets/r1312/mob-root-stalker-3d.glb',ref:['assets/r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp',0,0,373,320],test:/swamp-root-stalker/,name:'늪 뿌리 추적자',tint:1},
 bloodHound:{glb:'assets/r1316/mob-wrath-hound-r1.glb',ref:['assets/r275/mobs/ember-hound.webp',0,0,155,237],test:/ember-hound/,name:'피냄새 추적자',tint:1},
 bloodPursuer:{glb:null,ref:['assets/r104/bosses/mb-dist03-p4.webp',0,0,438,495],test:/mb-dist03/,name:'핏빛 수호로 추격자',tint:.75,boss:true}
};
const KINDS=TABLE;
const LOOP=new Set(['idle','walk']);
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
// 몹이 가진 그림 중 몸이 아닌 것(이펙트·표식) — 빼지 않는다.
const NOT_BODY=/(^|[\/_.-])(fx|vfx|pixelfx|effects?|sigil|telegraph|smoke|spark|blood|proj|projectile|bullet|beam|aura|halo|shadow|icon|bar)([\/_.-]|$)/i;
const stats={frames:0,consumed:0,hidden:0,ghosts:0,loads:0,loadMs:{},errors:0,capped:0,created:0,disposed:0,measured:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};

let on=true;
try{if(navigator.webdriver)on=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const m=/[?&]mob3d29=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}

let T=null,hostRenderer=null,mods=null;
const kinds={};
const inst=new Map();
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
const inStory=()=>{try{return typeof room==='object'&&!!room&&(room.layer==='STORY'||room.layer==null)&&!room.samongR103&&!room.survivalR600&&ZONES.has(String(room.id));}catch(_){return false;}};
const active=()=>on&&inStory();
const enemyById=id=>{try{return (room?.enemies||[]).find(e=>String(e.id)===id)||null;}catch(_){return null;}};
const baseName=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s+(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'').trim();// murder02·03 은 '… 잔향 3' 처럼 번호가 붙는다
const kindOfPath=p=>{const s=String(p||'');if(!s||/^r409/.test(s)&&!/:u:/.test(s))return null;for(const id in KINDS)if(KINDS[id].test.test(s))return id;return null;};
const memo=new Map();// enemyId → kind | ''
const BY_NAME=new Map(Object.entries(KINDS).map(([id,k])=>[k.name,id]));
// 그림 경로 줄기가 먼저, 아니면 이름('우두머리' 는 기본 몹 모델). 모델(glb)이 아직 없는 종류는 2D 그대로.
function enemyKind(id,rows){if(memo.has(id))return memo.get(id);const e=enemyById(id);if(!e)return null;
 let k=null;for(const c of rows){k=kindOfPath(c.sourcePath);if(k)break;}
 if(!k){const n=baseName(e.name);k=BY_NAME.get(n)||BY_NAME.get(n.replace(/\s+우두머리$/,''))||null;}
 if(k&&!KINDS[k].glb)k=null;
 memo.set(id,k||'');return k;}
const isBody=c=>c?.kind==='image'&&!NOT_BODY.test(String(c.sourcePath||''));
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;

function modules(){
 if(!mods)mods=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),import('./vendor/three/examples/jsm/utils/SkeletonUtils.js')])
  .then(async([{GLTFLoader},{MeshoptDecoder},SU])=>{await MeshoptDecoder.ready;return {GLTFLoader,MeshoptDecoder,SU};});
 return mods;
}
const SELF_LIT=.62;
function tone(source,tint){const m=source.clone();m.userData.r1329TintU=tint;m.transparent=true;m.opacity=1;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;
 if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);
 // 몹 고유 빛(emissiveMap 이 따로 있는 눈·균열·약병·등불)은 그대로, 나머지는 원화를 스스로 .5 비춰 어두운 바닥에서 결이 보이게(2D 몹 그림은 조명 없이 원화 밝기).
 const glow=!!m.emissiveMap||(m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>.05);
 if(!glow&&m.emissive&&m.map){m.emissive.setRGB(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=SELF_LIT;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1329Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1329Luma),gl_FragColor.rgb,.9)*1.2-.5)*1.22+.5,0.0,1.0)*r1329Tint;`);
 shader.uniforms.r1329Tint=tint;shader.fragmentShader='uniform vec3 r1329Tint;\n'+shader.fragmentShader;};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1329-hanji-tone-tint-v1';};m.needsUpdate=true;return m;}
function load(id){
 const k=kinds[id]||(kinds[id]={state:'idle'});if(k.state!=='idle'||!T)return;k.state='loading';stats.loads++;const t0=performance.now();
 Promise.all([modules(),fetch(KINDS[id].glb,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();})])
 .then(async([M,data])=>{const base=new URL('.',new URL(KINDS[id].glb,document.baseURI)).href;const gltf=await new M.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder).parseAsync(data,base);
  const pick=re=>gltf.animations.find(a=>re.test(a.name));
  const clips={idle:pick(/^idle$/i),walk:pick(/^walk$/i)||pick(/^float$/i),attack:pick(/^attack/i),hit:pick(/^hit$/i),death:pick(/^death$/i)};
  for(const [p,c] of Object.entries(clips))if(!c)throw Error(id+' GLB 에 클립 없음: '+p);
  const cache=new Map();gltf.scene.traverse(o=>{if(!o.isMesh)return;const one=src=>{if(!cache.has(src))cache.set(src,tone(src,{value:new T.Vector3(1,1,1)}));return cache.get(src);};o.material=Array.isArray(o.material)?o.material.map(one):one(o.material);});
  gltf.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(gltf.scene,true);const minY=Number.isFinite(box.min.y)?Math.min(0,box.min.y):0;
  const fin=v=>Number.isFinite(v)?v:0;Object.assign(k,{state:'ready',scene:gltf.scene,clips,SU:M.SU,mats:[...cache.values()],minY,height:Math.max(.2,Number.isFinite(box.max.y)?box.max.y-minY:1.7),
   rest:{x0:fin(box.min.x),x1:fin(box.max.x),z0:fin(box.min.z),z1:fin(box.max.z),h:Math.max(.2,Number.isFinite(box.max.y)?box.max.y-minY:1.7)}});
  stats.loadMs[id]=Math.round(performance.now()-t0);
 }).catch(e=>{k.state='failed';fail(e);});
}
function create(eid,kindId){
 const k=kinds[kindId];const model=k.SU.clone(k.scene);model.name='r1329-'+kindId+'-model';model.position.y=-k.minY;
 model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){o.userData.r1055Skip=true;o.userData.r451=true;o.frustumCulled=false;o.castShadow=o.receiveShadow=false;}});
 const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const g=new T.Group();g.name='r1329-mob3d:'+eid;g.layers.set(HOST_LAYER);g.visible=false;g.add(model);
 const mixer=new T.AnimationMixer(model),actions={};
 for(const [pose,clip] of Object.entries(k.clips)){const a=mixer.clipAction(clip);a.play();a.enabled=false;a.setEffectiveWeight(0);
  if(!LOOP.has(pose)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[pose]={a,clip};}
 const i={id:eid,kind:kindId,g,model,meshes,mixer,actions,pose:'idle',poseT:0,w:{idle:1},yaw:NaN,lastT:NaN,seen:-1,x:0,y:0,h:0,deadAt:null,flash:0,visible:false,order:NaN,hs:[],target:NaN};
 stats.created++;return i;}
function dispose(i){try{i.g.removeFromParent();i.mixer.stopAllAction();i.mixer.uncacheRoot(i.model);}catch(e){fail(e);}inst.delete(i.id);stats.disposed++;}
function attach(r,i){if(i.g.parent!==r.scene){i.g.removeFromParent();r.scene.add(i.g);}}
function hide(i){i.g.visible=false;i.visible=false;}
function hideAll(){for(const i of inst.values())hide(i);}
function setOrder(i,order){if(!Number.isFinite(order)||order===i.order)return;i.order=order;for(const o of i.meshes)o.renderOrder=order;}

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
 let main=rows.filter(c=>k.test.test(String(c.sourcePath||'')));if(!main.length&&i.hs.length<6&&stats.frames-(i.born||0)>30)main=rows;
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

// 색 맞춤(R1325 ④ 와 같은 셈, 이 파일 몹에만): 2D 몸 그림 칸과 3D 텍스처의 평균색(알파 큰 칸, 밝기 .12~.92) → 채널 배율(.55~1.8)을 TINT 만큼.
// 종류마다 한 번(같은 종류는 같은 그림·같은 재질). 늪 뿌리 추적자는 TINT 1(첫 맵 갈색 모델을 2D 늪 초록에 완전히).
let probeRGB=null;
function avgRGB(img,sx,sy,sw,sh){if(!img||!(sw>2&&sh>2))return null;const W=Math.min(64,Math.round(sw)),H=Math.min(64,Math.round(sh));probeRGB=probeRGB||document.createElement('canvas');probeRGB.width=W;probeRGB.height=H;
 const g=probeRGB.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,W,H);g.drawImage(img,sx,sy,sw,sh,0,0,W,H);const d=g.getImageData(0,0,W,H).data;let r=0,gg=0,b=0,n=0;
 for(let q=0;q<d.length;q+=4){if(d[q+3]<160)continue;const R=d[q]/255,G=d[q+1]/255,B=d[q+2]/255,L=.2126*R+.7152*G+.0722*B;if(L<.12||L>.92)continue;r+=R;gg+=G;b+=B;n++;}
 return n>20?[r/n,gg/n,b/n]:null;}
const tintInfo={};
// 2D 기준색 = 그 몹 2D 걷기/서기 그림 첫 칸(ref, 고정 — 피격 섬광·R409 붉은 테·공격 칸에 흔들리지 않게)에
// 게임이 2D 몸에 거는 채도 필터(예: 'saturate(.5)')를 똑같이 건 평균색.
const refImgs={};
function refImg(kid){const r=KINDS[kid].ref;if(!r)return null;let im=refImgs[kid];if(!im){im=refImgs[kid]=new Image();im.src=r[0];}return im.complete&&im.naturalWidth?im:null;}
function sampleTint(i,rows){const k=kinds[i.kind];if(!k||k.tinted)return;const im=refImg(i.kind);if(!im)return;const R=KINDS[i.kind].ref;
 const raw=avgRGB(im,R[1],R[2],R[3],R[4]);if(!raw)return;
 let sat=1;for(const c of rows){const m=/saturate\(\s*([\d.]+)\s*\)/.exec(String(c?.style?.filter||''));if(m){sat=Math.max(0,Math.min(2,+m[1]));break;}}
 const L=.2126*raw[0]+.7152*raw[1]+.0722*raw[2];const a2=raw.map(v=>L+(v-L)*sat);
 const ims=[...new Set(k.mats.map(m=>m.map?.image).filter(Boolean))];let r=0,g=0,b=0,n=0;for(const im of ims){const a=avgRGB(im,0,0,im.width,im.height);if(a){r+=a[0];g+=a[1];b+=a[2];n++;}}if(!n)return;const a3=[r/n,g/n,b/n];
 const mix=KINDS[i.kind].tint;const t=[0,1,2].map(q=>1+(Math.max(.55,Math.min(1.8,a2[q]/Math.max(.04,a3[q])))-1)*mix);
 for(const m of k.mats)m.userData.r1329TintU&&m.userData.r1329TintU.value.set(t[0],t[1],t[2]);k.tinted=true;
 tintInfo[i.kind]={a2:a2.map(v=>+v.toFixed(3)),a3:a3.map(v=>+v.toFixed(3)),t:t.map(v=>+v.toFixed(3))};}
function choosePose(i,e,dead,t){
 if(dead)return 'death';
 const fl=Number(e?.flash)||0;if(fl>0&&fl>i.flash+1e-6)i.hitAt=t;i.flash=fl;
 if(Number.isFinite(i.hitAt)&&t-i.hitAt<i.actions.hit.clip.duration)return 'hit';
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
 i.mixer.update(0);
 i.g.visible=Math.max(0,Math.min(1,alpha))>.02;i.visible=i.g.visible;
}
// 투영 상자 계산은 근사라(실측 약 .8배) 걷기·쉬기 자세일 때 가끔 실제 꼭짓점을 비춰 재고, 2D 보이는 키와의 비를 천천히 보정한다.
function projH(i,r,n){const cam=r.camera,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity;i.g.updateMatrixWorld(true);
 i.g.traverse(o=>{const pos=o.isMesh&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/n));
  for(let k=0;k<pos.count;k+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(k,v);else v.fromBufferAttribute(pos,k);v.applyMatrix4(o.matrixWorld).project(cam);const y=(1-v.y)*H/2;if(Number.isFinite(y)){top=Math.min(top,y);bottom=Math.max(bottom,y);}}});
 return bottom-top;}
function place(i,r,x,y,h){i.x=x;i.y=y;i.h=h;i.g.position.set(x,h,y);const c=Number.isFinite(i.corr)?i.corr:1;i.g.scale.setScalar(scaleFor(i,r)*c);
 if(i.target>8&&(i.pose==='walk'||i.pose==='idle')&&(!(i.corrN>=2)||(stats.frames+(i.salt||0))%12===0)&&r.camera&&r.projection?.height){const m=projH(i,r,240);
  if(m>4){i.corrN=(i.corrN||0)+1;i.corr=Math.max(.6,Math.min(1.8,c*Math.pow(i.target/m,i.corrN<=2?1:.5)));}}}

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
 for(const [oid,b] of byEnemy){const kid=enemyKind(oid.slice(6),b.rows);if(!kid)continue;b.kid=kid;b.rows=b.rows.filter(isBody);if(!b.rows.length)continue;
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
   if(!dead){measure2D(i,b.rows);sampleTint(i,b.rows);}
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
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1329||wrappedScenes.has(scene))return;const base=scene.render,w=function(commands){try{consume(r,commands);}catch(e){fail(e);hideAll();}return base.apply(this,arguments);};Object.assign(w,base);w.__r1329=true;wrappedScenes.add(scene);scene.render=w;}
const wrapped=new WeakSet();let depth=0;
const wrapFn=fn=>{if(fn.__r1329)return fn;const w=function(frame){if(depth===0){try{frameTime=Number.isFinite(frame?.time)?frame.time:null;wrapCommands(this);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};Object.assign(w,fn);w.__r1329=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(!r)return;if(Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}wrapCommands(r);if(!T)T=r.T;
 if(hostRenderer&&hostRenderer!==r){for(const i of [...inst.values()])dispose(i);}hostRenderer=r;}catch(e){fail(e);}}
let lastRoom=null;
(function tick(){wrapInst();try{const id=typeof room==='object'&&room?room.id:null;if(id!==lastRoom){lastRoom=id;memo.clear();}}catch(_){}if(!active())hideAll();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('mob3dR1329Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='mob3dR1329Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="mob3dR1329Toggle"> 3D 거미동굴·늪지대·무너진 성 몹</label><p class="small muted">보랏빛 알집지기·보라검천사·수렁 주문사·늪의 뿔악마 군주·늪 뿌리 추적자·피냄새 추적자·핏빛 수호로 추격자를 입체 모델로 그립니다(2D 그림 색에 맞춤). 끄면 원래 2D 그림입니다.</p>';
 host.appendChild(d);const el=d.querySelector('#mob3dR1329Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('mob3dR1329Toggle');if(el)el.checked=on;if(!on)hideAll();return on;}
function measure(id){const i=inst.get(String(id));const r=hostRenderer;if(!i||!i.visible||!r)return null;i.g.updateMatrixWorld(true);
 const cam=r.camera,W=r.projection.width,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 i.g.traverse(o=>{const pos=o.isMesh&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/1500));
  for(let n=0;n<pos.count;n+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(n,v);else v.fromBufferAttribute(pos,n);v.applyMatrix4(o.matrixWorld).project(cam);
   const x=(v.x+1)*W/2,y=(1-v.y)*H/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});
 const anchor=r.projection.worldToScreen(i.x,i.y,i.h);
 return {count,top,bottom,left,right,h:bottom-top,anchor,target:i.target,kind:i.kind,order:i.order};}
function inspect(){const list=[...inst.values()];return {revision:REV,on,active:active(),loaded:Object.keys(kinds).filter(k=>kinds[k].state==='ready'),failed:Object.keys(kinds).filter(k=>kinds[k].state==='failed'),
 shown:list.filter(i=>i.visible).length,instances:list.map(i=>({id:i.id,kind:i.kind,pose:i.pose,visible:i.visible,target:Number.isFinite(i.target)?Math.round(i.target):null,yaw:Number.isFinite(i.yaw)?+i.yaw.toFixed(3):null})),stats:{...stats},lastError};}
// 검사용: 표의 종류를 모두 미리 읽는다(실제 플레이에서는 그 몹이 처음 보일 때 읽음).
function preload(){if(!T){const r=currentHost();if(r)T=r.T;}let n=0;for(const id of Object.keys(KINDS))if(KINDS[id].glb){load(id);n++;}return n;}
window.__STORYWORLD_MOB3D_R1329__=Object.freeze({revision:REV,kinds:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.glb]))),names:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.name]))),on:()=>on,set,inspect,measure,preload,kindOf:id=>memo.get(String(id))||null,
 tintOf:id=>{const i=inst.get(String(id));return i&&tintInfo[i.kind]?{...tintInfo[i.kind]}:null;}});
})();
