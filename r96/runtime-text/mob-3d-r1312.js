// R1312 첫 몹 맵(악마화 나무의 정원 dist00) 몹 3D 임시 적용(사용자 2026-11-25 "맨첫맵 몹들 3d자산구글드라이브에 있는거 개선해서 적용해줘봐 임시로").
//  · 자산: Dots 가 드라이브에 올린 GLB 3개를 바이트 그대로 쓴다(덮어쓰기·재압축 없음).
//    MOB3D-01 침식 근위(mob-root-bound-guard-3d.glb) · MOB3D-02 뿌리 추적자(mob-root-stalker-3d.glb) · MOB3D-03 R2 뿌리의 문지기(boss-dist00-root-gatekeeper-3d.glb).
//  · 손질(코드 재질만): 한지 톤(채도 .9·명암 1.22), 안개 뒤에 그리기(투명 줄·renderOrder), 적 읽기 테(안쪽 먹선+바깥 핏빛 테, 2D R409 적 외곽선과 같은 신호), 금속감 0·거칠기 ≥ .78.
//    문지기의 주홍 균열(emissive)만 빛을 남긴다. 그림자·조명은 게임 장면 것을 그대로 쓴다.
//  · 그리기: 별도 WebGL 캔버스 없이 게임 ThreeRenderer.scene 의 몸/벽 층(2)에 붙인다(R1304 영웅과 같은 길) → 벽·지형 깊이와 맞음.
//    몹마다 SkeletonUtils.clone 으로 뼈째 복제, 동시에 3D 로 그리는 몹은 영웅에 가까운 순서로 MAX_LIVE 마리(나머지는 원래 2D).
//  · 2D 는 지우지 않는다: 같은 몹의 '몸 그림' 명령(2D 경로가 root-bound-ghoul · /root-stalker-r74 · dist00-boss · /bosses/dist00- 인 image,
//    R409 외곽선 캔버스로 바뀐 몸은 몹 이름·보스 여부로 판별)과
//    그 R350/R448 유령 복사만 CommandScene.render 직전에 뺀다. 그림자·체력바·조준·효과·연기/재(15세 사망 연출)는 그대로.
//    모델을 아직 못 읽었거나 오류가 나면 그 몹은 2D 로 그린다.
//  · 동작: 사망 > 공격(e.state 'attack') > 피격(e.flash) > 걷기(이동) > 대기. 사망은 Death 를 끝까지 틀고 1.7초 뒤 사라짐(피·절단 없음).
//    방향: 걸을 때 이동 방향, 아니면 영웅 쪽. 크기: 2D 몸과 같은 기준(actorHeight, 보스 2.05배)에 모델 키 비율.
//  · 범위: dist00(첫 몹 맵)만. 늪 뿌리 추적자(swamp-root-stalker) 등 다른 맵 몹은 손대지 않는다.
//  · 켜고 끄기: 설정 '3D 첫 맵 몹(시험)' / storyworld.r1312.mob3d('on'|'off') / 주소 ?mob3d=1·?mob3d=0.
//    기본: 사람이 할 때 켜짐, 자동 검사(navigator.webdriver)는 꺼짐 — 기존 2D 몹 검사 기준선을 바꾸지 않기 위해서다(시험 기능).
//  · 미검증: GPU 실기기·모바일 프레임, 7분야 심사 외 실제 플레이 손맛.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_R1312__)return;
const REV='R1312-mob3d-1',KEY='storyworld.r1312.mob3d',ZONE='dist00',HOST_LAYER=2,MAX_LIVE=24,REF_H=1.75,SCALE=1.06,FADE=.12,YAW_RATE=8,DEATH_HOLD=1.7;
const KINDS={
 guard:{glb:'assets/r1312/mob-root-bound-guard-3d.glb',h:1.9,mul:1,test:/root-bound-ghoul/,clips:{idle:'Idle',walk:'Walk',attack:'Attack_Claw',hit:'Hit',death:'Death'}},
 stalker:{glb:'assets/r1312/mob-root-stalker-3d.glb',h:1.5,mul:1,test:/\/root-stalker-r74/,clips:{idle:'Idle',walk:'Walk',attack:'Attack_Slash',hit:'Hit',death:'Death'}},
 boss:{glb:'assets/r1312/boss-dist00-root-gatekeeper-3d.glb',h:3.2,mul:2.05*REF_H/3.2,test:/dist00-boss|demon_tree_root_seraph|\/bosses\/dist00-/,clips:{idle:'Idle',walk:'Walk',attack:'Attack_RootSweep',hit:'Hit',death:'Death'}}
};
const LOOP=new Set(['idle','walk']);
// 적 읽기 테(R409 2D 적 외곽선과 같은 신호): 안쪽 먹선 rgb(14,4,6) + 바깥 핏빛 테 rgb(170,22,26)×.62 를 바닥 위 불투명색으로.
const INK=[{color:0x0e0406,width:.018,slot:0},{color:0x7c1a1a,width:.034,slot:1}];
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
const stats={frames:0,consumed:0,hidden:0,ghosts:0,loads:0,loadMs:{},errors:0,capped:0,created:0,disposed:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};

let on=true;
try{if(navigator.webdriver)on=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const m=/[?&]mob3d=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}

let T=null,hostRenderer=null,mods=null;
const kinds={};// id → {state:'idle'|'loading'|'ready'|'failed',scene,animations,mats,inkMat}
const inst=new Map();// enemyId → instance
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
const inZone=()=>{try{return typeof room==='object'&&room&&room.id===ZONE;}catch(_){return false;}};
const active=()=>on&&inZone();
const enemyById=id=>{try{return (room?.enemies||[]).find(e=>String(e.id)===id)||null;}catch(_){return null;}};
const kindOf=path=>{const s=String(path||'');for(const k in KINDS)if(KINDS[k].test.test(s))return k;return null;};
// R409(전투 가독 외곽선)는 몸 그림을 외곽선 구운 캔버스로 바꾸며 sourcePath 를 'r409…' 로 덮는다 → 그 몸은 몹 이름·보스 여부로 종류를 정한다.
const kindByEnemy=e=>{if(!e)return null;if(e.boss)return 'boss';const n=String(e.name||'');if(/침식 근위|뿌리에 묶인 근위/.test(n))return 'guard';if(/^뿌리 추적자/.test(n))return 'stalker';return null;};
const seenKind=new Map();
function bodyKind(c){const id=String(c.owner.id).slice(6),direct=kindOf(c.sourcePath);if(direct){seenKind.set(id,direct);return direct;}
 if(c.r409Outlined==='enemy'||/^r409/.test(String(c.sourcePath||''))){const k=seenKind.get(id)||kindByEnemy(enemyById(id));if(k)seenKind.set(id,k);return k;}return null;}
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;

function modules(){
 if(!mods)mods=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),import('./vendor/three/examples/jsm/utils/SkeletonUtils.js')])
  .then(async([{GLTFLoader},{MeshoptDecoder},SU])=>{await MeshoptDecoder.ready;return {GLTFLoader,MeshoptDecoder,SU};});
 return mods;
}
// 한지 톤: R1304 영웅 식에서 출발해 몹은 채도 .9·밝기 1.2·명암 1.22 — 어두운 이끼·나무껍질 결이 회색 덩어리로 뭉개지지 않게(헤드리스 비교로 정함).
// 장면의 안개·하늘 아지랑이(r300-fog·r98-sky-haze)는 층 2 의 투명 판(깊이 검사 끔·renderOrder ≈ -990)이라, 불투명 3D 몸은 그 밑에 깔려 반투명하게 씻긴다.
// → 몸·테두리를 투명 줄(transparent, 불투명도 1, 깊이 쓰기 켬)에 renderOrder ≥ 0 으로 넣어 2D 몸 그림처럼 안개 뒤에 그린다.
const ORDER={body:12,ink:[11,10]},SELF_LIT=.5;
function tone(source,keepGlow){const m=source.clone();m.transparent=true;m.opacity=1;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;
 if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);
 // 2D 몹 그림은 조명 없이 원화 밝기 그대로 그려진다 → 3D 몸도 원화 텍스처를 스스로 .5 만큼 비춰(emissiveMap) 어두운 바닥에서 결이 보이게. 문지기 주홍 균열은 원래 emissive 유지.
 if(!keepGlow&&m.emissive&&m.map){m.emissive.setRGB(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=SELF_LIT;}else if(!keepGlow&&m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1312Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1312Luma),gl_FragColor.rgb,.9)*1.2-.5)*1.22+.5,0.0,1.0);`);};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1312-hanji-tone-v3';};m.needsUpdate=true;return m;}
function inkMaterial(scaleX,ink){const w=(ink.width/Math.max(1e-9,Math.abs(scaleX)||1)).toFixed(6);const m=new T.MeshBasicMaterial({color:ink.color,side:T.BackSide,transparent:true,opacity:1,depthTest:true,depthWrite:true});
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#if defined( USE_SKINNING )\ntransformed += normalize( objectNormal ) * '+w+';\n#endif');};
 m.customProgramCacheKey=()=>'r1312-ink-shell-v2|'+w+'|'+ink.color;return m;}
function addInk(model,k){const skinned=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.r1312Ink)skinned.push(o);});
 for(const mesh of skinned)for(const ink of INK){const key=Math.abs(mesh.scale.x).toFixed(9)+'|'+ink.color;let m=k.ink.get(key);if(!m){m=inkMaterial(mesh.scale.x,ink);k.ink.set(key,m);}
  const shell=new T.SkinnedMesh(mesh.geometry,m);shell.name='r1312-ink-shell';shell.userData.r1312Ink=true;shell.bind(mesh.skeleton,mesh.bindMatrix);shell.bindMode=mesh.bindMode;
  shell.frustumCulled=false;shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.copy(mesh.scale);shell.renderOrder=ORDER.ink[ink.slot];shell.layers.set(HOST_LAYER);mesh.parent.add(shell);}}
// R1321: 보스는 설정에 따라 R3 모델(window.__STORYWORLD_BOSS00_R1321__)을 쓸 수 있다(기본 R2).
//  R3 는 갑옷·날개 재질에도 원화 자체조명(.62)을 넣고(R2 처럼 장면 빛만 받으면 검은 덩어리), 주홍 균열처럼 원래 빛나는 재질만 그 빛을 남긴다.
function glbOf(id){try{const r=id==='boss'&&window.__STORYWORLD_BOSS00_R1321__;const g=r&&r.glb();if(g)return g;}catch(_){}return KINDS[id].glb;}
function load(id){
 const k=kinds[id]||(kinds[id]={state:'idle'});if(k.state!=='idle'||!T)return;k.state='loading';stats.loads++;const t0=performance.now();
 const url=glbOf(id);k.url=url;
 Promise.all([modules(),fetch(url,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();})])
 .then(async([M,data])=>{const base=new URL('.',new URL(url,document.baseURI)).href;const gltf=await new M.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder).parseAsync(data,base);
  for(const n of Object.values(KINDS[id].clips))if(!gltf.animations.find(a=>a.name===n))throw Error(id+' GLB 에 클립 없음: '+n);
  const cache=new Map();gltf.scene.traverse(o=>{if(!o.isMesh)return;const one=src=>{if(!cache.has(src))cache.set(src,tone(src,id==='boss'&&(url===KINDS.boss.glb||!!src.emissiveMap||(src.emissive&&src.emissive.getHex()!==0))));return cache.get(src);};o.material=Array.isArray(o.material)?o.material.map(one):one(o.material);});
  gltf.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(gltf.scene,true);
  Object.assign(k,{state:'ready',scene:gltf.scene,animations:gltf.animations,SU:M.SU,mats:[...cache.values()],ink:new Map(),minY:Number.isFinite(box.min.y)?box.min.y:0,height:Number.isFinite(box.max.y-box.min.y)?box.max.y-box.min.y:KINDS[id].h});
  stats.loadMs[id]=Math.round(performance.now()-t0);
 }).catch(e=>{k.state='failed';fail(e);});
}
function create(eid,kindId){
 const k=kinds[kindId];const model=k.SU.clone(k.scene);model.name='r1312-'+kindId+'-model';model.position.y=-k.minY;
 model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){o.userData.r1055Skip=true;o.userData.r451=true;o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.renderOrder=ORDER.body;}});addInk(model,k);
 const g=new T.Group();g.name='r1312-mob3d:'+eid;g.layers.set(HOST_LAYER);g.visible=false;g.add(model);
 const mixer=new T.AnimationMixer(model),actions={};
 for(const [pose,name] of Object.entries(KINDS[kindId].clips)){const clip=k.animations.find(a=>a.name===name);const a=mixer.clipAction(clip);a.play();a.enabled=false;a.setEffectiveWeight(0);
  if(!LOOP.has(pose)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[pose]={a,clip};}
 const i={id:eid,kind:kindId,g,model,mixer,actions,pose:'idle',poseT:0,w:{idle:1},yaw:NaN,lastT:NaN,seen:-1,x:0,y:0,h:0,deadAt:null,flash:0,walkPhase:0,visible:false};
 stats.created++;return i;}
function dispose(i){try{i.g.removeFromParent();i.mixer.stopAllAction();i.mixer.uncacheRoot(i.model);}catch(e){fail(e);}inst.delete(i.id);stats.disposed++;}
function attach(r,i){if(i.g.parent!==r.scene){i.g.removeFromParent();r.scene.add(i.g);}}
function hide(i){if(i.g.visible){i.g.visible=false;}i.visible=false;}
function hideAll(){for(const i of inst.values())hide(i);}

function choosePose(i,e,dead,t){
 if(dead)return 'death';
 // 피격 움찔(.3~.4초)은 공격 중에도 먼저 — 맞은 순간이 읽히게, 끝나면 공격 반복으로 돌아감
 const fl=Number(e?.flash)||0;
 if(fl>0&&fl>i.flash+1e-6)i.hitAt=t;i.flash=fl;
 if(Number.isFinite(i.hitAt)&&t-i.hitAt<i.actions.hit.clip.duration)return 'hit';
 if(e?.state==='attack')return 'attack';
 const mv=e&&(e.moving===true||Math.hypot(Number(e.moveDX)||0,Number(e.moveDY)||0)>1e-4)&&e.state!=='idle';
 return mv?'walk':'idle';
}
function animate(i,e,dead,t,alpha){
 const dt=Number.isFinite(i.lastT)?Math.max(0,Math.min(.1,t-i.lastT)):0;i.lastT=t;
 const pose=choosePose(i,e,dead,t);if(pose!==i.pose){i.pose=pose;i.poseT=0;if(i.actions[pose]&&!LOOP.has(pose))i.actions[pose].a.reset();}else i.poseT+=dt;
 // 방향
 let tx=NaN;if(e&&!dead){const dx=Number(e.moveDX)||0,dy=Number(e.moveDY)||0;if(pose==='walk'&&Math.hypot(dx,dy)>1e-5)tx=Math.atan2(dx,dy);
  else if(typeof player==='object'&&player)tx=Math.atan2(Number(player.x)-e.x,Number(player.y)-e.y);}
 if(Number.isFinite(tx)){if(!Number.isFinite(i.yaw))i.yaw=tx;let df=tx-i.yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;i.yaw+=df*Math.min(1,dt*YAW_RATE);}
 i.g.rotation.y=Number.isFinite(i.yaw)?i.yaw:0;
 // 섞기
 for(const k in i.actions){const target=k===pose?1:0,cur=i.w[k]||0;i.w[k]=dt>0?Math.max(0,Math.min(1,cur+(target?1:-1)*dt/FADE)):target;}
 let total=0;for(const k in i.w)total+=i.w[k];total=total||1;
 const speed=e?Math.max(.6,Math.min(1.8,(Number(e.speed)||1)/1.04)):1;
 for(const [k,A] of Object.entries(i.actions)){const w=(i.w[k]||0)/total;A.a.enabled=w>1e-3;A.a.setEffectiveWeight(w);
  if(LOOP.has(k)){if(A.a.enabled)A.a.time=(A.a.time+dt*(k==='walk'?speed:1))%A.clip.duration;}
  else if(k===pose){const d=A.clip.duration;
   // 공격 상태는 사거리 안에 있는 동안 계속 'attack' 이다(cd 가 돌며 여러 번 휘두름) → 휘두르기 + .25초 쉼을 되풀이
   const tt=k==='death'&&e?.deadAt!=null?Math.max(0,t-Number(e.deadAt)):k==='attack'?i.poseT%(d+.25):i.poseT;A.a.time=Math.min(d*.999,tt);}}
 i.mixer.update(0);
 const op=Math.max(0,Math.min(1,alpha));
 i.g.visible=op>.02;i.visible=i.g.visible;
}
function scaleFor(i,r){const p=r.projection,h=Math.max(16,typeof actorHeight==='function'?actorHeight():60),k=KINDS[i.kind];
 return h*SCALE*k.mul/(REF_H*p.tile*p.zoom*Math.sqrt(1.5));}
function place(i,r,x,y,h){i.x=x;i.y=y;i.h=h;i.g.position.set(x,h,y);i.g.scale.setScalar(scaleFor(i,r));}

let frameTime=null;
function consume(r,commands){
 stats.frames++;
 if(!active()||!Array.isArray(commands)){hideAll();return;}
 T=r.T;hostRenderer=r;const t=Number.isFinite(frameTime)?frameTime:now();
 // 몹별 몸 그림 모으기
 const bodies=new Map();
 for(const c of commands){if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.owner.r350)continue;const id=String(c.owner.id||'');if(!id.startsWith('enemy:'))continue;
  const kid=bodyKind(c);if(!kid)continue;let b=bodies.get(id);if(!b)bodies.set(id,b={kid,rows:[],owner:c.owner,alpha:0});b.rows.push(c);b.alpha=Math.max(b.alpha,Number(c.style?.globalAlpha??1));}
 for(const b of bodies.values()){const k=kinds[b.kid];if(!k||k.state==='idle')load(b.kid);}
 // 가까운 순서로 상한
 const px=Number(player?.x)||0,py=Number(player?.y)||0;
 const order=[...bodies.entries()].filter(([,b])=>kinds[b.kid]?.state==='ready').sort((a,b)=>Math.hypot(a[1].owner.x-px,a[1].owner.y-py)-Math.hypot(b[1].owner.x-px,b[1].owner.y-py));
 if(order.length>MAX_LIVE)stats.capped+=order.length-MAX_LIVE;
 const take=order.slice(0,MAX_LIVE),drop=new Set();
 for(const [oid,b] of take){const eid=oid.slice(6);let i=inst.get(eid);if(i&&i.kind!==b.kid){dispose(i);i=null;}
  if(!i){try{i=create(eid,b.kid);inst.set(eid,i);}catch(e){fail(e);continue;}}
  try{const e=enemyById(eid),dead=!!(e&&(e.hp<=0))||b.owner.alive===false;if(dead&&i.deadAt==null)i.deadAt=Number.isFinite(Number(e?.deadAt))?Number(e.deadAt):t;if(!dead)i.deadAt=null;
   // 사망 연출이 끝난 뒤에도 2D 몸을 오래 그리는 덧씌우기가 있으면 3D 는 숨기고 2D 몸도 계속 뺀다(죽은 몸이 2D 로 다시 나타나지 않게)
   if(dead&&t-i.deadAt>=DEATH_HOLD){hide(i);i.seen=t;for(const c of b.rows)drop.add(c);continue;}
   attach(r,i);place(i,r,Number(b.owner.x),Number(b.owner.y),Number(b.owner.renderHeight)||0);animate(i,e,dead,t,dead?1:b.alpha);i.seen=t;
   for(const c of b.rows)drop.add(c);}catch(e){fail(e);hide(i);}}
 // 이번 프레임에 몸 명령이 없는 3D: 사망 연출 중이면 계속, 아니면 숨김
 for(const i of [...inst.values()]){if(i.seen===t)continue;const e=enemyById(i.id);
  if(i.deadAt!=null&&t-i.deadAt<DEATH_HOLD&&i.visible){try{animate(i,e,true,t,1);}catch(e2){fail(e2);hide(i);}continue;}
  hide(i);if(!e||t-i.seen>8)dispose(i);}
 if(!drop.size)return;
 const keys=new Set();for(const c of drop)if(c.key!=null)for(const p of GHOST_PREFIX)keys.add(p+c.key);
 for(let n=commands.length-1;n>=0;n--){const c=commands[n];if(drop.has(c)){commands.splice(n,1);stats.hidden++;}else if(c?.owner?.r350&&c.key!=null&&keys.has(String(c.key))){commands.splice(n,1);stats.ghosts++;}}
 stats.consumed++;
}
// 감싼 장면은 WeakSet 으로 기억하고, 밑 함수의 표식(R1302 영웅 3D 의 __r1304 등)을 새 함수에 옮긴다.
// 표식이 사라지면 영웅 3D 가 매 프레임 다시 감싸고 이쪽도 다시 감싸 프레임마다 감싸기가 쌓인다(CI 영웅 3D 로딩 시간 초과의 원인).
const wrappedScenes=new WeakSet();
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1312||wrappedScenes.has(scene))return;const base=scene.render,w=function(commands){try{consume(r,commands);}catch(e){fail(e);hideAll();}return base.apply(this,arguments);};Object.assign(w,base);w.__r1312=true;wrappedScenes.add(scene);scene.render=w;}
const wrapped=new WeakSet();let depth=0;
const wrapFn=fn=>{if(fn.__r1312)return fn;const w=function(frame){if(depth===0){try{frameTime=Number.isFinite(frame?.time)?frame.time:null;wrapCommands(this);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};Object.assign(w,fn);w.__r1312=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(!r)return;if(Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}wrapCommands(r);if(!T)T=r.T;
 if(hostRenderer&&hostRenderer!==r){for(const i of [...inst.values()])dispose(i);}hostRenderer=r;
 if(active())for(const id of Object.keys(KINDS))if(id!=='boss'&&(!kinds[id]||kinds[id].state==='idle'))load(id);}catch(e){fail(e);}}
(function tick(){wrapInst();if(!active())hideAll();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('mob3dR1312Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='mob3dR1312Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="mob3dR1312Toggle"> 3D 첫 맵 몹(시험)</label><p class="small muted">악마화 나무의 정원의 침식 근위·뿌리 추적자·뿌리의 문지기를 입체 모델로 그립니다(임시). 끄면 원래 2D 그림입니다.</p>';
 host.appendChild(d);const el=d.querySelector('#mob3dR1312Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('mob3dR1312Toggle');if(el)el.checked=on;if(!on)hideAll();return on;}
function measure(id){const i=inst.get(String(id));const r=hostRenderer;if(!i||!i.visible||!r)return null;i.g.updateMatrixWorld(true);
 const cam=r.camera,W=r.projection.width,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 i.g.traverse(o=>{const pos=o.isMesh&&!o.userData.r1312Ink&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/1500));
  for(let n=0;n<pos.count;n+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(n,v);else v.fromBufferAttribute(pos,n);v.applyMatrix4(o.matrixWorld).project(cam);
   const x=(v.x+1)*W/2,y=(1-v.y)*H/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});
 const anchor=r.projection.worldToScreen(i.x,i.y,i.h);const e=enemyById(i.id);
 return {count,top,bottom,left,right,h:bottom-top,anchor,ah:(typeof actorHeight==='function'?actorHeight():60)*(e?.boss?2.05:1),kind:i.kind};}
function inspect(){const list=[...inst.values()];return {revision:REV,on,zone:ZONE,active:active(),bossGlb:kinds.boss?.url||glbOf('boss'),loaded:Object.keys(kinds).filter(k=>kinds[k].state==='ready'),failed:Object.keys(kinds).filter(k=>kinds[k].state==='failed'),
 shown:list.filter(i=>i.visible).length,instances:list.map(i=>({id:i.id,kind:i.kind,pose:i.pose,visible:i.visible,yaw:Number.isFinite(i.yaw)?+i.yaw.toFixed(3):null})),stats:{...stats},lastError};}
window.__STORYWORLD_MOB3D_R1312__=Object.freeze({revision:REV,kinds:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.glb]))),on:()=>on,set,inspect,measure});
})();
