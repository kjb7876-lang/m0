// R1336 3D 헌터 활 공격 자세(사용자 2026-11-26 10:16 실플레이 영상 "헌터활모션강화").
//  · 영상·헤드리스 실측: 3D 헌터 공격은 원래 리그 모션 그대로라 활을 옆구리에서 세로로 들었다 내릴 뿐이었고, R1313 표대로 붙인 활은
//    공격 순간 위아래가 뒤집혀(위 끝 방향 y −0.9 안팎) 시위를 당기는 동작이 없었다.
//  · 고침(R1320 자세 오버레이와 같은 방식, hero-stance-3d-r1320.js 는 손대지 않음): 그리기 직전(scene.onBeforeRender)에 공격 가중치만큼
//    ① 가슴을 틀어 활 쪽 어깨를 과녁으로(옆으로 선 궁사 자세), 머리는 과녁 쪽으로 되돌림 ② 활 손(왼 주먹)을 어깨 높이 앞으로 곧게 뻗음
//    ③ 활을 곧게 세우고 시위(StringCenter)를 쏘는 사람 쪽으로, 손잡이를 주먹 살에 ④ 당기는 손(오른 주먹)을 얼굴 옆(입꼬리~광대)까지,
//    팔꿈치는 어깨 높이 뒤로. 그리기가 끝나면 뼈·활 값을 되돌린다(정령·판정·다른 검사가 보는 값과 R1313 표는 그대로).
//    대기·걷기는 바꾸지 않는다(공격 가중치 0 이면 아무 것도 안 함). 손·손가락 뼈와 시위 뼈가 없어 손가락·시위 휨은 못 바꾼다.
//  · 끄기: localStorage storyworld.r1336.hunterDraw=off.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HUNTER_DRAW_R1336__)return;
const REV='R1336-hunter-draw-1',KEY='storyworld.r1336.hunterDraw',ID='hunter',DEG=Math.PI/180;
// 좌표: 영웅 모델(+Z 앞, +Y 위, 오른손 −X). bow = 왼 어깨에서 잰 활 손 자리, draw = 머리 뼈에서 잰 당기는 손 자리.
const POSE={bow:[-.05,.02,.58],bowDir:[-.08,1,.02],stringSide:[0,0,-1],draw:[-.07,-.11,.03],poleL:[.45,-.55,-.15],poleR:[-.7,.55,-.6],twist:-34,head:28};
const stats={revision:REV,hooks:0,builds:0,frames:0,errors:0,last:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
let T=null,hookedScene=null,cur=null,scan=0;
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};
const num=(v,d)=>Number.isFinite(+v)?+v:d;
function fist(body,fore){const sk=body.skeleton,fb=sk.bones.indexOf(fore);if(fb<0)return null;const kids=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0);
 const G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight;if(!P||!SI||!SW)return null;const M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
 for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||kids.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;v.fromBufferAttribute(P,i).applyMatrix4(M);pts.push(v.clone());}
 if(pts.length<3)return null;const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)];const c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}return n?c.multiplyScalar(1/n):null;}
function bindQuat(body,bone){const sk=body.skeleton,i=sk.bones.indexOf(bone),pi=sk.bones.indexOf(bone.parent);if(i<0||pi<0)return bone.quaternion.clone();
 const m=new T.Matrix4().multiplyMatrices(sk.boneInverses[pi],new T.Matrix4().copy(sk.boneInverses[i]).invert());return new T.Quaternion().setFromRotationMatrix(m);}
function turn(bone,q){const a=bone.parent.getWorldQuaternion(new T.Quaternion()),b=bone.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(a.invert().multiply(q).multiply(b));bone.updateMatrixWorld(true);}
function aim(bone,from,to){if(!(from.lengthSq()>1e-12&&to.lengthSq()>1e-12))return;turn(bone,new T.Quaternion().setFromUnitVectors(from.clone().normalize(),to.clone().normalize()));}
function reach(arm,target,pole,elbowFn){const {A,B,C,palm}=arm;A.quaternion.copy(arm.bindA);B.quaternion.copy(arm.bindB);A.updateMatrixWorld(true);
 const a=A.getWorldPosition(new T.Vector3()),t=target.clone();
 for(let it=0;it<4;it++){const b=B.getWorldPosition(new T.Vector3()),c=C.getWorldPosition(new T.Vector3()),pw=B.localToWorld(palm.clone());if(it>0&&pw.distanceTo(target)<.004)break;
  if(it===0)t.copy(target).sub(pw).add(c);else t.add(target.clone().sub(pw));
  const r=elbowFn(a.toArray(),t.toArray(),a.distanceTo(b),b.distanceTo(c),pole.toArray());
  aim(A,b.clone().sub(a),new T.Vector3().fromArray(r.elbow).sub(a));B.getWorldPosition(b);C.getWorldPosition(c);aim(B,c.clone().sub(b),t.clone().sub(b));}
 return B.localToWorld(palm.clone()).distanceTo(target);}
function build(group){const model=group.getObjectByName('r1305-'+ID+'-3d-model'),mount=group.getObjectByName('r1313-'+ID+'-weapon');if(!model||!mount)return null;
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink&&!/^r13/.test(o.name||''))body=o;});if(!body)return null;
 const bone=n=>model.getObjectByName(n),arm=side=>{const A=bone('Arm_'+side),B=bone('Forearm_'+side),C=B?.children.find(c=>/^Weapon_Socket/.test(c.name));if(!A?.isBone||!B?.isBone||!C)return null;const palm=fist(body,B);return palm?{A,B,C,palm,bindA:bindQuat(body,A),bindB:bindQuat(body,B)}:null;};
 const L=arm('L'),R=arm('R');if(!L||!R||mount.parent!==L.C)return null;let grip=null;mount.traverse(o=>{if(!grip&&/^GripSocket/.test(o.name||''))grip=o;});
 const s={group,model,mount,body,L,R,chest:bone('Spine_Chest'),head:bone('Head')||bone('Head_Hood'),gripLocal:grip?grip.position.clone():new T.Vector3(),applied:false};
 s.bones=[s.chest,s.head,L.A,L.B,R.A,R.B].filter(Boolean);s.saved=s.bones.map(()=>new T.Quaternion());s.mq=new T.Quaternion();s.mp=new T.Vector3();stats.builds++;return s;}
function restore(s){if(!s?.applied)return;s.bones.forEach((b,i)=>b.quaternion.copy(s.saved[i]));s.mount.quaternion.copy(s.mq);s.mount.position.copy(s.mp);(s.chest||s.L.A).updateMatrixWorld(true);s.L.A.updateMatrixWorld(true);s.R.A.updateMatrixWorld(true);s.applied=false;}
function pose(s,api,stance){
 const wt=api.inspect().weights||{},tot=Math.max(1e-6,num(wt.idle,0)+num(wt.walk,0)+num(wt.attack,0)),w=Math.max(0,Math.min(1,num(wt.attack,0)/tot));
 if(w<=.001){stats.last={w:0};return;}
 s.bones.forEach((b,i)=>s.saved[i].copy(b.quaternion));s.mq.copy(s.mount.quaternion);s.mp.copy(s.mount.position);s.applied=true;
 const mq=s.model.getWorldQuaternion(new T.Quaternion()),dirW=v=>new T.Vector3().fromArray(v).applyQuaternion(mq),scale=s.model.getWorldScale(new T.Vector3()).x,up=dirW([0,1,0]).normalize();
 const elbowFn=stance.pure.elbow;
 if(s.chest)turn(s.chest,new T.Quaternion().setFromAxisAngle(up,POSE.twist*DEG*w));
 if(s.head)turn(s.head,new T.Quaternion().setFromAxisAngle(up,POSE.head*DEG*w));
 // 활 손: 왼 어깨 앞으로
 const qLA=s.L.A.quaternion.clone(),qLB=s.L.B.quaternion.clone();
 const bowT=s.L.A.getWorldPosition(new T.Vector3()).add(dirW(POSE.bow).multiplyScalar(scale));const errL=reach(s.L,bowT,dirW(POSE.poleL),elbowFn);
 if(w<.999){s.L.A.quaternion.copy(qLA.slerp(s.L.A.quaternion,w));s.L.B.quaternion.copy(qLB.slerp(s.L.B.quaternion,w));s.L.A.updateMatrixWorld(true);}
 // 당기는 손: 얼굴 옆
 const qRA=s.R.A.quaternion.clone(),qRB=s.R.B.quaternion.clone();const headP=(s.head||s.chest).getWorldPosition(new T.Vector3());
 const drawT=headP.add(dirW(POSE.draw).multiplyScalar(scale));const errR=reach(s.R,drawT,dirW(POSE.poleR),elbowFn);
 if(w<.999){s.R.A.quaternion.copy(qRA.slerp(s.R.A.quaternion,w));s.R.B.quaternion.copy(qRB.slerp(s.R.B.quaternion,w));s.R.A.updateMatrixWorld(true);}
 // 활: 곧게 세우고 시위를 사람 쪽으로, 손잡이를 활 손 주먹에
 const bx=stance.pure.basis(POSE.bowDir,POSE.stringSide),wq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().fromArray(bx.X),new T.Vector3().fromArray(bx.Y),new T.Vector3().fromArray(bx.Z))).premultiply(mq);
 const palmW=s.L.B.localToWorld(s.L.palm.clone()),ms=s.mount.getWorldScale(new T.Vector3()).x,posW=palmW.clone().sub(s.gripLocal.clone().multiplyScalar(ms).applyQuaternion(wq));
 const sq=s.L.C.getWorldQuaternion(new T.Quaternion()),lq=sq.clone().invert().multiply(wq),lp=s.L.C.worldToLocal(posW.clone());
 s.mount.quaternion.copy(s.mq).slerp(lq,w);s.mount.position.copy(s.mp).lerp(lp,w);s.mount.updateMatrixWorld(true);
 stats.last={w:+w.toFixed(3),errL:+(errL/scale).toFixed(4),errR:+(errR/scale).toFixed(4)};}
function before(scene){if(!on){restore(cur);return;}const api=window.__STORYWORLD_HWANDO3D_R1302__,stance=window.__STORYWORLD_HERO_STANCE_R1320__;if(!api?.inspect||!stance?.pure)return;
 if(cur&&(cur.group.parent!==scene||cur.mount.parent!==cur.L.C||!cur.model.parent)){restore(cur);cur=null;}
 if(!cur&&scan--<=0){scan=20;for(const c of scene.children)if(c.name==='r1305-'+ID+'-3d-shared'&&c.visible){cur=build(c);if(!cur)scan=2;break;}}
 if(!cur||!cur.group.visible||cur.applied)return;try{pose(cur,api,stance);stats.frames++;}catch(e){restore(cur);fail(e);}}
function after(){try{restore(cur);}catch(e){fail(e);}}
function hook(){const r=host();if(!r||r.scene===hookedScene)return;T=r.T;const scene=r.scene,pb=scene.onBeforeRender,pa=scene.onAfterRender;
 scene.onBeforeRender=function(...a){try{pb?.apply(this,a);}finally{try{before(scene);}catch(e){fail(e);}}};
 scene.onAfterRender=function(...a){try{after();}finally{pa?.apply(this,a);}};hookedScene=scene;stats.hooks++;}
setInterval(()=>{try{hook();}catch(e){fail(e);}},400);
window.__STORYWORLD_HUNTER_DRAW_R1336__=Object.freeze({revision:REV,on:()=>on,set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},pose:()=>JSON.parse(JSON.stringify(POSE)),
 tune:patch=>{if(!patch)return false;Object.assign(POSE,patch);return true;},inspect:()=>({...stats,on,lastError,active:!!cur})});
})();
