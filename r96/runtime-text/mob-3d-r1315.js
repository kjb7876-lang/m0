// R1315 새 3D 보스·몹 시범 적용(사용자 2026-11-25 "잘나온것 특히 모션이 자연스러운거 게임에 개선및 시범적용해서 배포").
//  · 자산: storyworld-3d-assets PR #1(커밋 3abe8da) processed GLB 2개를 바이트 그대로 쓴다(재압축·덮어쓰기 없음).
//    자산 쪽 평가에서 모션이 가장 자연스러운 둘: 폭식 악마(보스) · 전극기계수호기사(몹). 분노(팔 25°)·나태·레이더(팔 붙음)·질투는 이번에 넣지 않는다.
//  · 탐식 보스(ep1b04 '최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑'): 설정이 켜져 있으면 방 안에서 내내 3D 악마 모습
//    (사용자 11-25 15:14Z 카드 선택 "보스 내내 3D 악마로"). 끄면 R463 의 사람 모습(총주방장) 2D 그대로. 판정·체력·패턴·저장은 그대로, 그림만.
//  · 전극기계수호기사(ep1b08 하늘 맵, R380 검수 몹·우두머리 포함): 2D 몸 그림 경로(electrode-machine-knight·mm-knight) 또는 이름으로 판별.
//  · 그리기·손질은 R1312(첫 맵 몹 3D)와 같은 길: 게임 ThreeRenderer.scene 층 2 공유, SkeletonUtils.clone, 한지 톤·자체 조명
//    (먹빛 금속 재질이 envmap 없는 장면에서 검게 뭉개지지 않게 원화 텍스처로 스스로 비춤), 안개 뒤 투명 줄, 먹선+핏빛 테.
//    같은 몹의 2D 몸 그림 명령과 그 유령 복사만 CommandScene.render 직전에 뺀다. 그림자·체력바·효과·연기/재는 그대로.
//  · 동작: 사망 > 피격 > 고유기(보스 패턴 공격 중 Special_DevourMaw) > 공격 > 걷기 > 대기.
//  · 켜고 끄기: 설정 '3D 새 보스·몹(시험)' / storyworld.r1315.mob3d('on'|'off') / 주소 ?mob3d15=1·?mob3d15=0.
//    기본: 사람이 할 때 켜짐, 자동 검사(navigator.webdriver)는 꺼짐(기존 2D 검사 기준선 보존).
//  · 미검증: GPU 실기기·모바일 프레임, 실제 플레이 손맛.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_R1315__)return;
const REV='R1315-mob3d-1',KEY='storyworld.r1315.mob3d',HOST_LAYER=2,MAX_LIVE=16,REF_H=1.75,SCALE=1.06,FADE=.12,YAW_RATE=8,DEATH_HOLD=1.7;
const KINDS={
 knight:{zone:'ep1b08',glb:'assets/r1315/mob-electrode-knight-3d.glb',mul:1.2,
  test:/electrode-machine-knight|\/mm-knight-/,name:/^(전극기계수호기사|전극을 두른 좀비 수호기사)/,
  clips:{idle:'Idle',walk:'Walk',attack:'Attack',hit:'Hit',death:'Death'}},
 glutton:{zone:'ep1b04',boss:true,glb:'assets/r1315/boss-gluttony-demon-3d.glb',mul:1.6,
  test:/glutton|\/b04[-_]|b04-boss/,name:null,
  clips:{idle:'Idle',walk:'Walk',attack:'Attack',special:'Special_DevourMaw',hit:'Hit',death:'Death'}}
};
const ZONES=new Set(Object.values(KINDS).map(k=>k.zone));
const LOOP=new Set(['idle','walk']);
const INK=[{color:0x0e0406,width:.012,slot:0},{color:0x7c1a1a,width:.022,slot:1}];
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
const stats={frames:0,consumed:0,hidden:0,ghosts:0,loads:0,loadMs:{},errors:0,capped:0,created:0,disposed:0,specials:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};

let on=true;
try{if(navigator.webdriver)on=false;}catch(_){}
try{const v=localStorage.getItem(KEY);if(v==='on')on=true;else if(v==='off')on=false;}catch(_){}
try{const m=/[?&]mob3d15=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}

let T=null,hostRenderer=null,mods=null;
const kinds={};
const inst=new Map();
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
const zoneId=()=>{try{return typeof room==='object'&&room?String(room.id||''):'';}catch(_){return '';}};
const active=()=>on&&ZONES.has(zoneId());
const enemyById=id=>{try{return (room?.enemies||[]).find(e=>String(e.id)===id)||null;}catch(_){return null;}};
// 종류 판별: 지금 지역의 종류만. 보스 종류는 보스 몸만, 몹 종류는 보스가 아닌 몸만.
function kindFor(c,e){const z=zoneId(),p=String(c.sourcePath||''),r409=c.r409Outlined==='enemy'||/^r409/.test(p);
 for(const k in KINDS){const K=KINDS[k];if(K.zone!==z)continue;const isBoss=!!(e?.boss||c.owner?.boss);if(!!K.boss!==isBoss)continue;
  if(K.test.test(p))return k;
  if(r409||!p){if(K.boss&&isBoss)return k;if(K.name&&K.name.test(String(e?.name||'')))return k;}}
 return null;}
const seenKind=new Map();
function bodyKind(c){const id=String(c.owner.id).slice(6),e=enemyById(id);const k=kindFor(c,e);if(k){seenKind.set(id,k);return k;}return null;}
const now=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;

function modules(){
 if(!mods)mods=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),import('./vendor/three/examples/jsm/utils/SkeletonUtils.js')])
  .then(async([{GLTFLoader},{MeshoptDecoder},SU])=>{await MeshoptDecoder.ready;return {GLTFLoader,MeshoptDecoder,SU};});
 return mods;
}
// 한지 톤 + 자체 조명. 이 두 모델은 원본 금속/거칠기 맵을 베이크한 먹빛 재질이라(자산 쪽 경고: envmap 없는 장면에서 어두움)
// 2D 그림처럼 원화 텍스처를 스스로 비추고(SELF_LIT) 감마로 어두운 결을 들어 올린다(GAMMA<1). 값은 헤드리스 전후 비교(6안)로 정함.
// 베이크 텍스처 알파가 1 보다 작은 곳이 있어 투명 줄에서 몸이 비쳐 보였다 → 색을 낸 뒤 알파를 1 로 묶는다.
const ORDER={body:12,ink:[11,10]};
// 기사: 2D 원화의 밝은 강철 톤에 맞춰 채도를 낮추고(.6) 더 들어 올림. 폭식: 먹빛 몸과 배 속 주홍 불빛은 살리고 밝기만.
const TONE={knight:{selfLit:1.1,lift:1.5,gamma:.68,form:.45,sat:.6},glutton:{selfLit:1.1,lift:1.45,gamma:.7,form:.45,sat:.95}};
try{const t=JSON.parse(localStorage.getItem('storyworld.r1315.tone')||'null');if(t)for(const k in TONE)Object.assign(TONE[k],t[k]||{});}catch(_){}
function tone(source,kid){const m=source.clone(),P=TONE[kid];m.transparent=true;m.opacity=1;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;
 if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);m.metalnessMap=null;
 if(m.emissive&&m.map){m.emissive.setRGB(1,1,1);m.emissiveMap=m.map;m.emissiveIntensity=P.selfLit;}else if(m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);const lift=Number(P.lift).toFixed(3),gam=Number(P.gamma).toFixed(3),form=Number(P.form||0).toFixed(3),sat=Number(P.sat??.9).toFixed(3);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
gl_FragColor.rgb=pow(max(gl_FragColor.rgb,vec3(0.0)),vec3(${gam}));
gl_FragColor.rgb*=mix(1.0-${form}*.6,1.0+${form}*.4,clamp(normal.y*.5+.5,0.0,1.0));
float r1315Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1315Luma),gl_FragColor.rgb,${sat})*${lift}-.5)*1.2+.5,0.0,1.0);
gl_FragColor.a=1.0;`);};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1315-hanji-tone-v3|'+lift+'|'+gam+'|'+form+'|'+sat;};m.needsUpdate=true;return m;}
function inkMaterial(scaleX,ink){const w=(ink.width/Math.max(1e-9,Math.abs(scaleX)||1)).toFixed(6);const m=new T.MeshBasicMaterial({color:ink.color,side:T.BackSide,transparent:true,opacity:1,depthTest:true,depthWrite:true});
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#if defined( USE_SKINNING )\ntransformed += normalize( objectNormal ) * '+w+';\n#endif');};
 m.customProgramCacheKey=()=>'r1315-ink-shell-v1|'+w+'|'+ink.color;return m;}
function addInk(model,k){const skinned=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.r1315Ink)skinned.push(o);});
 for(const mesh of skinned)for(const ink of INK){const key=Math.abs(mesh.scale.x).toFixed(9)+'|'+ink.color;let m=k.ink.get(key);if(!m){m=inkMaterial(mesh.scale.x,ink);k.ink.set(key,m);}
  const shell=new T.SkinnedMesh(mesh.geometry,m);shell.name='r1315-ink-shell';shell.userData.r1315Ink=true;shell.userData.r1315Slot=ink.slot;shell.bind(mesh.skeleton,mesh.bindMatrix);shell.bindMode=mesh.bindMode;
  shell.frustumCulled=false;shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.copy(mesh.scale);shell.renderOrder=ORDER.ink[ink.slot];shell.layers.set(HOST_LAYER);mesh.parent.add(shell);}}
function load(id){
 const k=kinds[id]||(kinds[id]={state:'idle'});if(k.state!=='idle'||!T)return;k.state='loading';stats.loads++;const t0=performance.now();
 Promise.all([modules(),fetch(KINDS[id].glb,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();})])
 .then(async([M,data])=>{const base=new URL('.',new URL(KINDS[id].glb,document.baseURI)).href;const gltf=await new M.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder).parseAsync(data,base);
  for(const n of Object.values(KINDS[id].clips))if(!gltf.animations.find(a=>a.name===n))throw Error(id+' GLB 에 클립 없음: '+n);
  const cache=new Map();gltf.scene.traverse(o=>{if(!o.isMesh)return;const one=src=>{if(!cache.has(src))cache.set(src,tone(src,id));return cache.get(src);};o.material=Array.isArray(o.material)?o.material.map(one):one(o.material);});
  gltf.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(gltf.scene,true);const h=box.max.y-box.min.y;
  Object.assign(k,{state:'ready',scene:gltf.scene,animations:gltf.animations,SU:M.SU,mats:[...cache.values()],ink:new Map(),minY:Number.isFinite(box.min.y)?box.min.y:0,height:Number.isFinite(h)&&h>0?h:REF_H});
  stats.loadMs[id]=Math.round(performance.now()-t0);
 }).catch(e=>{k.state='failed';fail(e);});
}
function create(eid,kindId){
 const k=kinds[kindId];const model=k.SU.clone(k.scene);model.name='r1315-'+kindId+'-model';model.position.y=-k.minY;
 model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.renderOrder=ORDER.body;}});addInk(model,k);
 const g=new T.Group();g.name='r1315-mob3d:'+eid;g.layers.set(HOST_LAYER);g.visible=false;g.add(model);
 const mixer=new T.AnimationMixer(model),actions={};
 for(const [pose,name] of Object.entries(KINDS[kindId].clips)){const clip=k.animations.find(a=>a.name===name);const a=mixer.clipAction(clip);a.play();a.enabled=false;a.setEffectiveWeight(0);
  if(!LOOP.has(pose)){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;}actions[pose]={a,clip};}
 const i={id:eid,kind:kindId,g,model,mixer,actions,pose:'idle',poseT:0,w:{idle:1},yaw:NaN,lastT:NaN,seen:-1,x:0,y:0,h:0,deadAt:null,flash:0,visible:false,phase:null,specialAt:NaN};
 stats.created++;return i;}
function dispose(i){try{i.g.removeFromParent();i.mixer.stopAllAction();i.mixer.uncacheRoot(i.model);}catch(e){fail(e);}inst.delete(i.id);stats.disposed++;}
// 그리기 순서: 2D 명령 그림(바닥 먼지·안개·장식 등)은 명령 order 를 renderOrder 로 써서 깊이 검사 없이 겹친다.
// 3D 몸을 고정 renderOrder(12)로 두면 그 뒤에 오는 바닥·먼지 판이 몸 위에 덮여 몸이 비쳐 보였다(헤드리스 실측: renderOrder 5000 이면 또렷).
// → 바꿔 낸 2D 몸 명령의 order 를 그대로 받아(테는 바로 앞) 2D 몸이 있던 자리 순서에 그린다.
function sortAs(i,order){if(!Number.isFinite(order)||i.order===order)return;i.order=order;i.model.traverse(o=>{if(!o.isMesh)return;o.renderOrder=o.userData.r1315Ink?order-(o.userData.r1315Slot===0?.1:.2):order;});}
function attach(r,i){if(i.g.parent!==r.scene){i.g.removeFromParent();r.scene.add(i.g);}}
function hide(i){if(i.g.visible)i.g.visible=false;i.visible=false;}
function hideAll(){for(const i of inst.values())hide(i);}

// 보스 고유기: 엔진 보스 패턴 단계(e.phase)가 바뀌는 순간과 원거리 패턴 공격(e.attack.kind 가 근접이 아님) 동안 Special 을 한 번 튼다.
function specialStart(i,e,t){if(!i.actions.special||!e)return false;let fire=false;
 const ph=e.phase;if(i.phase!==null&&ph!==undefined&&ph!==i.phase)fire=true;i.phase=ph===undefined?null:ph;
 const a=e.attack,ak=a&&String(a.kind||a.type||a.pattern||'');if(a&&Number.isFinite(a.elapsed)&&ak&&!/melee|claw|slash|bite/i.test(ak)&&a!==i.lastAtk){i.lastAtk=a;fire=true;}
 if(fire&&!(t-i.specialAt<i.actions.special.clip.duration)){i.specialAt=t;stats.specials++;return true;}return false;}
function choosePose(i,e,dead,t){
 if(dead)return 'death';
 const fl=Number(e?.flash)||0;if(fl>0&&fl>i.flash+1e-6)i.hitAt=t;i.flash=fl;
 specialStart(i,e,t);
 if(Number.isFinite(i.hitAt)&&t-i.hitAt<i.actions.hit.clip.duration&&!(t-i.specialAt<i.actions.special?.clip.duration))return 'hit';
 if(i.actions.special&&t-i.specialAt<i.actions.special.clip.duration)return 'special';
 if(e?.state==='attack'||(e?.attack&&Number.isFinite(e.attack.elapsed)))return 'attack';
 const mv=e&&(e.moving===true||Math.hypot(Number(e.moveDX)||0,Number(e.moveDY)||0)>1e-4)&&e.state!=='idle';
 return mv?'walk':'idle';
}
function animate(i,e,dead,t,alpha){
 const dt=Number.isFinite(i.lastT)?Math.max(0,Math.min(.1,t-i.lastT)):0;i.lastT=t;
 const pose=choosePose(i,e,dead,t);if(pose!==i.pose){i.pose=pose;i.poseT=0;if(i.actions[pose]&&!LOOP.has(pose))i.actions[pose].a.reset();}else i.poseT+=dt;
 let tx=NaN;if(e&&!dead){const dx=Number(e.moveDX)||0,dy=Number(e.moveDY)||0;if(pose==='walk'&&Math.hypot(dx,dy)>1e-5)tx=Math.atan2(dx,dy);
  else if(typeof player==='object'&&player)tx=Math.atan2(Number(player.x)-e.x,Number(player.y)-e.y);}
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
 const op=Math.max(0,Math.min(1,alpha));i.g.visible=op>.02;i.visible=i.g.visible;
}
// 크기: 2D 몸과 같은 기준(actorHeight). 보스는 R463 처럼 영웅 키의 2.1배, 광폭화(R205 등 e.enraged)는 엔진 배율(e.sizeMul·e.scale)을 따른다.
function scaleFor(i,r,e){const p=r.projection,h=Math.max(16,typeof actorHeight==='function'?actorHeight():60),K=KINDS[i.kind],k=kinds[i.kind];
 const em=Number(e?.sizeMul||e?.scaleMul)||1;return h*SCALE*K.mul*Math.max(.5,Math.min(2.2,em))/(k.height*p.tile*p.zoom*Math.sqrt(1.5));}
function place(i,r,x,y,h,e){i.x=x;i.y=y;i.h=h;i.g.position.set(x,h,y);i.g.scale.setScalar(scaleFor(i,r,e));}

let frameTime=null;
function consume(r,commands){
 stats.frames++;
 if(!active()||!Array.isArray(commands)){hideAll();return;}
 T=r.T;hostRenderer=r;const t=Number.isFinite(frameTime)?frameTime:now();
 const bodies=new Map();
 for(const c of commands){if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.owner.r350)continue;const id=String(c.owner.id||'');if(!id.startsWith('enemy:'))continue;
  const kid=bodyKind(c);if(!kid)continue;let b=bodies.get(id);if(!b)bodies.set(id,b={kid,rows:[],owner:c.owner,alpha:0});b.rows.push(c);b.alpha=Math.max(b.alpha,Number(c.style?.globalAlpha??1));const o=Number(c.order);if(Number.isFinite(o))b.order=Math.min(b.order??o,o);}
 for(const b of bodies.values()){const k=kinds[b.kid];if(!k||k.state==='idle')load(b.kid);}
 const px=Number(player?.x)||0,py=Number(player?.y)||0;
 const order=[...bodies.entries()].filter(([,b])=>kinds[b.kid]?.state==='ready').sort((a,b)=>(KINDS[b[1].kid].boss?1:0)-(KINDS[a[1].kid].boss?1:0)||Math.hypot(a[1].owner.x-px,a[1].owner.y-py)-Math.hypot(b[1].owner.x-px,b[1].owner.y-py));
 if(order.length>MAX_LIVE)stats.capped+=order.length-MAX_LIVE;
 const take=order.slice(0,MAX_LIVE),drop=new Set();
 for(const [oid,b] of take){const eid=oid.slice(6);let i=inst.get(eid);if(i&&i.kind!==b.kid){dispose(i);i=null;}
  if(!i){try{i=create(eid,b.kid);inst.set(eid,i);}catch(e){fail(e);continue;}}
  try{const e=enemyById(eid),dead=!!(e&&(e.hp<=0))||b.owner.alive===false;if(dead&&i.deadAt==null)i.deadAt=Number.isFinite(Number(e?.deadAt))?Number(e.deadAt):t;if(!dead)i.deadAt=null;
   if(dead&&t-i.deadAt>=DEATH_HOLD){hide(i);i.seen=t;for(const c of b.rows)drop.add(c);continue;}
   attach(r,i);place(i,r,Number(b.owner.x),Number(b.owner.y),Number(b.owner.renderHeight)||0,e);sortAs(i,b.order);animate(i,e,dead,t,dead?1:b.alpha);i.seen=t;
   for(const c of b.rows)drop.add(c);}catch(e){fail(e);hide(i);}}
 for(const i of [...inst.values()]){if(i.seen===t)continue;const e=enemyById(i.id);
  if(i.deadAt!=null&&t-i.deadAt<DEATH_HOLD&&i.visible){try{animate(i,e,true,t,1);}catch(e2){fail(e2);hide(i);}continue;}
  hide(i);if(!e||t-i.seen>8)dispose(i);}
 if(!drop.size)return;
 const keys=new Set();for(const c of drop)if(c.key!=null)for(const p of GHOST_PREFIX)keys.add(p+c.key);
 for(let n=commands.length-1;n>=0;n--){const c=commands[n];if(drop.has(c)){commands.splice(n,1);stats.hidden++;}else if(c?.owner?.r350&&c.key!=null&&keys.has(String(c.key))){commands.splice(n,1);stats.ghosts++;}}
 stats.consumed++;
}
// 감싼 장면은 WeakSet 으로 기억하고 밑 함수의 표식(R1302 __r1304·R1312 __r1312 등)을 새 함수에 옮긴다(감싸기 쌓임 방지).
const wrappedScenes=new WeakSet();
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1315||wrappedScenes.has(scene))return;const base=scene.render,w=function(commands){try{consume(r,commands);}catch(e){fail(e);hideAll();}return base.apply(this,arguments);};Object.assign(w,base);w.__r1315=true;wrappedScenes.add(scene);scene.render=w;}
const wrapped=new WeakSet();let depth=0;
const wrapFn=fn=>{if(fn.__r1315)return fn;const w=function(frame){if(depth===0){try{frameTime=Number.isFinite(frame?.time)?frame.time:null;wrapCommands(this);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};Object.assign(w,fn);w.__r1315=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(!r)return;if(Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}wrapCommands(r);if(!T)T=r.T;
 if(hostRenderer&&hostRenderer!==r){for(const i of [...inst.values()])dispose(i);}hostRenderer=r;
 if(active()){const z=zoneId();for(const id of Object.keys(KINDS))if(KINDS[id].zone===z&&(!kinds[id]||kinds[id].state==='idle'))load(id);}}catch(e){fail(e);}}
(function tick(){wrapInst();if(!active())hideAll();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('mob3dR1315Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='mob3dR1315Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="mob3dR1315Toggle"> 3D 새 보스·몹(시험)</label><p class="small muted">탐식 보스(악마 모습)와 하늘 맵 전극기계수호기사를 입체 모델로 그립니다(시범). 끄면 원래 2D 그림입니다.</p>';
 host.appendChild(d);const el=d.querySelector('#mob3dR1315Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('mob3dR1315Toggle');if(el)el.checked=on;if(!on)hideAll();return on;}
function measure(id){const i=inst.get(String(id));const r=hostRenderer;if(!i||!i.visible||!r)return null;i.g.updateMatrixWorld(true);
 const cam=r.camera,W=r.projection.width,H=r.projection.height,v=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 i.g.traverse(o=>{const pos=o.isMesh&&!o.userData.r1315Ink&&o.geometry?.attributes?.position;if(!pos)return;const step=Math.max(1,Math.floor(pos.count/1500));
  for(let n=0;n<pos.count;n+=step){if(typeof o.getVertexPosition==='function')o.getVertexPosition(n,v);else v.fromBufferAttribute(pos,n);v.applyMatrix4(o.matrixWorld).project(cam);
   const x=(v.x+1)*W/2,y=(1-v.y)*H/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});
 const anchor=r.projection.worldToScreen(i.x,i.y,i.h);
 return {count,top,bottom,left,right,h:bottom-top,anchor,ah:(typeof actorHeight==='function'?actorHeight():60)*KINDS[i.kind].mul,kind:i.kind};}
function inspect(){const list=[...inst.values()];return {revision:REV,on,zones:[...ZONES],zone:zoneId(),active:active(),loaded:Object.keys(kinds).filter(k=>kinds[k].state==='ready'),failed:Object.keys(kinds).filter(k=>kinds[k].state==='failed'),
 shown:list.filter(i=>i.visible).length,instances:list.map(i=>({id:i.id,kind:i.kind,pose:i.pose,visible:i.visible,yaw:Number.isFinite(i.yaw)?+i.yaw.toFixed(3):null})),stats:{...stats},lastError};}
window.__STORYWORLD_MOB3D_R1315__=Object.freeze({revision:REV,kinds:Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([k,v])=>[k,v.glb]))),on:()=>on,set,inspect,measure});
})();
