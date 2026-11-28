// R1336 3D 헌터 활 공격 자세(사용자 2026-11-26 10:16 실플레이 영상 "헌터활모션강화").
//  · 영상·헤드리스 실측: 3D 헌터 공격은 원래 리그 모션 그대로라 활을 옆구리에서 세로로 들었다 내릴 뿐이었고, R1313 표대로 붙인 활은
//    공격 순간 위아래가 뒤집혀(위 끝 방향 y −0.9 안팎) 시위를 당기는 동작이 없었다.
//  · 고침(R1320 자세 오버레이와 같은 방식, hero-stance-3d-r1320.js 는 손대지 않음): 그리기 직전(scene.onBeforeRender)에 공격 가중치만큼
//    ① 가슴을 틀어 활 쪽 어깨를 과녁으로(옆으로 선 궁사 자세), 머리는 과녁 쪽으로 되돌림 ② 활 손(왼 주먹)을 어깨 높이 앞으로 곧게 뻗음
//    ③ 활을 곧게 세우고 시위(StringCenter)를 쏘는 사람 쪽으로, 손잡이를 주먹 살에 ④ 당기는 손(오른 주먹)을 얼굴 옆(입꼬리~광대)까지,
//    팔꿈치는 어깨 높이 뒤로. 그리기가 끝나면 뼈·활 값을 되돌린다(정령·판정·다른 검사가 보는 값과 R1313 표는 그대로).
//    대기·걷기는 바꾸지 않는다(공격 가중치 0 이면 아무 것도 안 함). 손·손가락 뼈와 시위 뼈가 없어 손가락·시위 휨은 못 바꾼다.
//  · 끄기: localStorage storyworld.r1336.hunterDraw=off.
//  · R1364(2026-11-27): hunter-cycle-3d-r1364.js 가 있으면 다 당긴 자세 한 장 대신 놓기 반동 → 화살 걸기 → 당기기 → 조준 정지 순환으로 당기는 손을 옮기고,
//    스킬 중에도 활 자세를 잡으며, 시위(활 GLB 의 bowstring 면) 가운데를 당기는 손 쪽으로 V 자로 휜다(그린 뒤 되돌림). anchor() = 3D 시위 기준점(화살 출발).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HUNTER_DRAW_R1336__)return;
const REV='R1336-hunter-draw-1',KEY='storyworld.r1336.hunterDraw',ID='hunter',DEG=Math.PI/180;
// 좌표: 영웅 모델(+Z 앞, +Y 위, 오른손 −X). bow = 왼 어깨에서 잰 활 손 자리, draw = 머리 뼈에서 잰 당기는 손 자리.
const POSE={bow:[-.05,.02,.58],bowDir:[-.08,1,.02],stringSide:[0,0,-1],draw:[-.07,-.11,.03],poleL:[.45,-.55,-.15],poleR:[-.7,.55,-.6],twist:-34,head:28};
// R1364 순환 자리(모델 좌표 방향, 영웅 배율): follow = 놓은 뒤 오른 어깨에서 손이 가는 자리(R1384: 어깨 기준이라 가슴이 돌아도 닿음, 뒤·조금 위·바깥), nock = 화살 걸 때 활 손 주먹에서 시위 쪽, recoil = 놓을 때 활 손이 튀는 쪽
// R1384 BOW_IN = 화살 걸 때 활 손을 몸 쪽으로 당기는 양(R1384: 시위가 오른손 닿는 거리 안에 오게, 2D raise_nock 처럼)
const CYCLE={follow:[-.22,.06,-.18],nock:[-.02,-.02,-.11],recoil:[0,-.02,.06]};
const BOW_IN=[-.02,-.03,-.13];
const cycle=()=>{try{const c=window.__STORYWORLD_HUNTER_CYCLE_R1364__;if(!c?.state)return null;const st=c.state();return st&&st.on?st:null;}catch(e){fail(e);return null;}};
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
// R1384 주먹(palm)을 끝점으로 두 뼈 IK — 손목 소켓 기준이면 주먹이 소켓에서 .14 옆이라 어깨 가까운 목표(놓기 반동)에서 수렴하지 않았다
function reach(arm,target,pole,elbowFn){const {A,B,palm}=arm;A.quaternion.copy(arm.bindA);B.quaternion.copy(arm.bindB);A.updateMatrixWorld(true);
 const a=A.getWorldPosition(new T.Vector3()),b=new T.Vector3(),pw=new T.Vector3();
 for(let it=0;it<2;it++){B.getWorldPosition(b);pw.copy(B.localToWorld(palm.clone()));
  const r=elbowFn(a.toArray(),target.toArray(),a.distanceTo(b),b.distanceTo(pw),pole.toArray());
  aim(A,b.clone().sub(a),new T.Vector3().fromArray(r.elbow).sub(a));B.getWorldPosition(b);pw.copy(B.localToWorld(palm.clone()));aim(B,pw.clone().sub(b),target.clone().sub(b));}
 return B.localToWorld(palm.clone()).distanceTo(target);}
function build(group){const model=group.getObjectByName('r1305-'+ID+'-3d-model'),mount=group.getObjectByName('r1313-'+ID+'-weapon');if(!model||!mount)return null;
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink&&!/^r13/.test(o.name||''))body=o;});if(!body)return null;
 const bone=n=>model.getObjectByName(n),arm=side=>{const A=bone('Arm_'+side),B=bone('Forearm_'+side),C=B?.children.find(c=>/^Weapon_Socket/.test(c.name));if(!A?.isBone||!B?.isBone||!C)return null;const palm=fist(body,B);return palm?{A,B,C,palm,bindA:bindQuat(body,A),bindB:bindQuat(body,B)}:null;};
 const L=arm('L'),R=arm('R');if(!L||!R||mount.parent!==L.C)return null;let grip=null;mount.traverse(o=>{if(!grip&&/^GripSocket/.test(o.name||''))grip=o;});
 const s={group,model,mount,body,L,R,chest:bone('Spine_Chest'),head:bone('Head')||bone('Head_Hood'),gripLocal:grip?grip.position.clone():new T.Vector3(),applied:false};
 let sm=null;mount.traverse(o=>{if(!sm&&o.isMesh&&/bowstring/i.test(o.material?.name||''))sm=o;});if(sm?.geometry?.attributes?.position){const P=sm.geometry.attributes.position,ud=sm.geometry.userData;if(!ud.r1364Rest)ud.r1364Rest=Float32Array.from(P.array);let top=0;for(let i=1;i<ud.r1364Rest.length;i+=3)top=Math.max(top,Math.abs(ud.r1364Rest[i]));const c=new T.Vector3();let n=0;for(let i=0;i<P.count;i++)if(Math.abs(ud.r1364Rest[i*3+1])<top*.05){c.x+=ud.r1364Rest[i*3];c.y+=ud.r1364Rest[i*3+1];c.z+=ud.r1364Rest[i*3+2];n++;}if(top>0&&n)s.str={mesh:sm,rest:ud.r1364Rest,top,center:c.multiplyScalar(1/n),bent:false};}
 s.bones=[s.chest,s.head,L.A,L.B,R.A,R.B].filter(Boolean);s.saved=s.bones.map(()=>new T.Quaternion());s.mq=new T.Quaternion();s.mp=new T.Vector3();stats.builds++;return s;}
function unbend(s){const st=s?.str;if(!st?.bent)return;const P=st.mesh.geometry.attributes.position;P.array.set(st.rest);P.needsUpdate=true;st.bent=false;}
function restore(s){unbend(s);if(!s?.applied)return;s.bones.forEach((b,i)=>b.quaternion.copy(s.saved[i]));s.mount.quaternion.copy(s.mq);s.mount.position.copy(s.mp);(s.chest||s.L.A).updateMatrixWorld(true);s.L.A.updateMatrixWorld(true);s.R.A.updateMatrixWorld(true);s.applied=false;}
function pose(s,api,stance){
 const wt=api.inspect().weights||{},tot=Math.max(1e-6,num(wt.idle,0)+num(wt.walk,0)+num(wt.attack,0)),cyc=cycle(),w=Math.max(0,Math.min(1,Math.max(num(wt.attack,0)/tot,cyc?num(cyc.skillW,0):0)));
 if(w<=.001){stats.last={w:0};return;}
 s.bones.forEach((b,i)=>s.saved[i].copy(b.quaternion));s.mq.copy(s.mount.quaternion);s.mp.copy(s.mount.position);s.applied=true;
 const mq=s.model.getWorldQuaternion(new T.Quaternion()),dirW=v=>new T.Vector3().fromArray(v).applyQuaternion(mq),scale=s.model.getWorldScale(new T.Vector3()).x,up=dirW([0,1,0]).normalize();
 const elbowFn=stance.pure.elbow;
 if(s.chest)turn(s.chest,new T.Quaternion().setFromAxisAngle(up,POSE.twist*DEG*w));
 if(s.head)turn(s.head,new T.Quaternion().setFromAxisAngle(up,POSE.head*DEG*w));
 // 활 손: 왼 어깨 앞으로
 const qLA=s.L.A.quaternion.clone(),qLB=s.L.B.quaternion.clone();
 const bowT=s.L.A.getWorldPosition(new T.Vector3()).add(dirW(POSE.bow).multiplyScalar(scale));const rc=cyc?num(cyc.recoil,0):0;if(rc>0)bowT.add(dirW(CYCLE.recoil).multiplyScalar(scale*rc));const wnB=cyc?num(cyc.wn,0):0;if(wnB>0)bowT.add(dirW(BOW_IN).multiplyScalar(scale*wnB));const errL=reach(s.L,bowT,dirW(POSE.poleL),elbowFn);
 if(w<.999){s.L.A.quaternion.copy(qLA.slerp(s.L.A.quaternion,w));s.L.B.quaternion.copy(qLB.slerp(s.L.B.quaternion,w));s.L.A.updateMatrixWorld(true);}
 // 활: 곧게 세우고 시위를 사람 쪽으로, 손잡이를 활 손 주먹에
 const bx=stance.pure.basis(POSE.bowDir,POSE.stringSide),wq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().fromArray(bx.X),new T.Vector3().fromArray(bx.Y),new T.Vector3().fromArray(bx.Z))).premultiply(mq);
 const palmW=s.L.B.localToWorld(s.L.palm.clone()),ms=s.mount.getWorldScale(new T.Vector3()).x,posW=palmW.clone().sub(s.gripLocal.clone().multiplyScalar(ms).applyQuaternion(wq));
 const sq=s.L.C.getWorldQuaternion(new T.Quaternion()),lq=sq.clone().invert().multiply(wq),lp=s.L.C.worldToLocal(posW.clone());
 s.mount.quaternion.copy(s.mq).slerp(lq,w);s.mount.position.copy(s.mp).lerp(lp,w);s.mount.updateMatrixWorld(true);
 // 당기는 손: 얼굴 옆
 const qRA=s.R.A.quaternion.clone(),qRB=s.R.B.quaternion.clone();const headP=(s.head||s.chest).getWorldPosition(new T.Vector3());
 const anchorT=headP.add(dirW(POSE.draw).multiplyScalar(scale)),drawT=anchorT.clone();s.anchorW=anchorT.clone();s.originW=s.model.getWorldPosition(new T.Vector3());s.anchorAt=typeof time==='number'?time:0;
 if(cyc){const wa=num(cyc.wa,1),wf=num(cyc.wf,0),wn=num(cyc.wn,0),sum=wa+wf+wn;if(sum>1e-6&&(wf>0||wn>0)){const fT=s.R.A.getWorldPosition(new T.Vector3()).add(dirW(CYCLE.follow).multiplyScalar(scale)),nT=nockW(s)||s.L.B.localToWorld(s.L.palm.clone()).add(dirW(CYCLE.nock).multiplyScalar(scale));drawT.copy(anchorT).multiplyScalar(wa/sum).addScaledVector(fT,wf/sum).addScaledVector(nT,wn/sum);}}
 const errR=reach(s.R,drawT,dirW(POSE.poleR),elbowFn);
 if(w<.999){s.R.A.quaternion.copy(qRA.slerp(s.R.A.quaternion,w));s.R.B.quaternion.copy(qRB.slerp(s.R.B.quaternion,w));s.R.A.updateMatrixWorld(true);}
 const held=cyc?num(cyc.str,1)*w:0;if(held>.001&&s.str)bend(s,s.R.B.localToWorld(s.R.palm.clone()),held);
 stats.last={w:+w.toFixed(3),errL:+(errL/scale).toFixed(4),errR:+(errR/scale).toFixed(4),stage:cyc?cyc.stage:null};}
// R1384 화살 걸기 자리 = 활 시위 가운데(쉬는 자리)의 지금 세계 좌표 — 활을 먼저 놓은 뒤 부른다
function nockW(s){const st=s.str;if(!st)return null;st.mesh.updateMatrixWorld(true);return st.mesh.localToWorld(st.center.clone());}
// R1364 시위 휨: 시위 면 꼭짓점을 가운데에서 끝(활 날개 끝)으로 갈수록 덜 옮겨 V 자로. 손 자리까지(활 로컬, 길이 0.9 까지)
function bend(s,handW,k){const st=s.str,m=st.mesh;m.updateMatrixWorld(true);const hl=m.worldToLocal(handW.clone()),pull=hl.sub(st.center);const L=pull.length();if(L>.9)pull.multiplyScalar(.9/L);pull.multiplyScalar(Math.max(0,Math.min(1,k)));
 const P=m.geometry.attributes.position,A=P.array,R=st.rest;for(let i=0;i<P.count;i++){const f=Math.max(0,1-Math.abs(R[i*3+1]-st.center.y)/st.top);A[i*3]=R[i*3]+pull.x*f;A[i*3+1]=R[i*3+1]+pull.y*f;A[i*3+2]=R[i*3+2]+pull.z*f;}P.needsUpdate=true;st.bent=true;}
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
 tune:patch=>{if(!patch)return false;Object.assign(POSE,patch);return true;},
 anchor:()=>{try{const c=cur;if(!c||!c.group.visible||!T)return null;let a=c.anchorW,o=c.originW;const t=typeof time==='number'?time:0;if(!a||!(t-c.anchorAt>=-1e-6&&t-c.anchorAt<.6)){const h=(c.head||c.chest);if(!h)return null;const mq=c.model.getWorldQuaternion(new T.Quaternion()),sc=c.model.getWorldScale(new T.Vector3()).x;a=h.getWorldPosition(new T.Vector3()).add(new T.Vector3().fromArray(POSE.draw).applyQuaternion(mq).multiplyScalar(sc));o=c.model.getWorldPosition(new T.Vector3());}return{T,anchor:a.toArray(),origin:o.toArray()};}catch(e){fail(e);return null;}},inspect:()=>({...stats,on,lastError,active:!!cur})});
})();
