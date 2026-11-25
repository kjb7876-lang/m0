// R1310 3D 영웅 걷기 모션 개선(사용자 11-25 "모든 3D 영웅 이동모션 이상한 것, 특히 페르소나").
//  · 문제(헤드리스 측정, qa/r1310): TRELLIS 9명 공용 Walk 클립은 키 4개(직선 보간) + 팔이 같은 쪽 다리와 함께 흔들림
//    (오른팔·오른발 앞뒤 상관 +0.95, 사람은 음수) + 골반 오르내림이 다리 길이와 안 맞아 디딤발이 뜨거나 바닥에 묻힘.
//    페르소나는 왼쪽 정강이·발 정점이 오른쪽 정강이 뼈(Shin_R)에 묶여 있어 왼발이 오른발을 따라 함께 차올림.
//  · 고침: GLB 파일·Idle·공격 클립은 그대로 두고, 3D 로더가 Walk 클립으로 동작을 만들 때(AnimationMixer.clipAction)
//    그 클립의 트랙만 새로 계산한 25키 보행으로 바꾼다. 원본 공용 스크립트와 같은 '월드 오일러 → 뼈 로컬' 변환을 쓰고,
//    골반 높이는 다리 각도로 계산해 디딤발이 늘 바닥에 닿게 한다. 페르소나는 왼쪽 정강이 무게를 Shin_L 로 옮긴다.
//  · 손대지 않음: 환도(R1303 별도 리그·#1004 작업 중), 슬레이어(R1309 대검 왼손 IK 병합 뒤 맞춤 — SKIP 에서 빼면 됨).
(()=>{'use strict';
const host=typeof window==='undefined'?globalThis:window;
const API='__STORYWORLD_HERO_WALK3D_R1310__';
if(host[API])return;
const REV='R1310-walk3d';
const HEROES=['seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego'];
const SKIP=new Set(['slayer']);
const KEYS=33;
const D2R=Math.PI/180;
const TAU=Math.PI*2;
const wrap=x=>x-Math.floor(x);
const bump=(p,c,w)=>{let d=Math.abs(wrap(p-c));d=Math.min(d,1-d);return Math.exp(-.5*(d/w)*(d/w));};
// 오른다리 위상 p(0=오른발 뒤꿈치 닿음). 각도는 원본 공용 스크립트와 같은 블렌더 월드 오일러(도):
//  x+ = 뒤로(다리·팔), 무릎(정강이) x+ = 굽힘, z = 수평 비틀기. 왼쪽은 반 주기 뒤.
function leg(p){
 const thigh=-8-19*Math.cos(TAU*p);
 const shin=3+10*bump(p,.12,.06)+50*bump(p,.72,.12);
 return {thigh,shin};
}
function pose(p){
 const R=leg(p),L=leg(p+.5);
 const yaw=6*Math.cos(TAU*p);
 const armR=3+13*Math.cos(TAU*(p-.04)),armL=3+13*Math.cos(TAU*(p-.54));
 const fwdR=(1+Math.cos(TAU*(p-.54)))/2; // 0..1, 1 = 오른팔이 가장 앞
 const fwdL=(1+Math.cos(TAU*(p-.04)))/2;
 return {
  rot:{
   Pelvis:[0,0,yaw],
   Spine_Chest:[5+1.5*Math.cos(2*TAU*p),0,-.8*yaw],
   Head:[-3-1.5*Math.cos(2*TAU*p),0,.55*yaw],
   Thigh_R:[R.thigh,0,0],Shin_R:[R.shin,0,0],
   Thigh_L:[L.thigh,0,0],Shin_L:[L.shin,0,0],
   Arm_R:[armR,-22,0],Forearm_R:[-12-14*fwdR,0,0],
   Arm_L:[armL,22,0],Forearm_L:[-12-14*fwdL,0,0]
  },
  legs:[R,L],
  sway:-.012*Math.sin(TAU*p)
 };
}
// T = three 모듈. rest: 뼈 이름 → {q:[x,y,z,w] 로컬 휴지 회전, t:[x,y,z] 로컬 휴지 위치, parent:이름|null}.
function maker(T){
 const qC=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),qCi=qC.clone().invert();
 const armature=(rest,name)=>{const chain=[];for(let n=name;n&&rest[n];n=rest[n].parent)chain.unshift(n);const q=new T.Quaternion();for(const n of chain)q.multiply(new T.Quaternion().fromArray(rest[n].q));return q;};
 // 블렌더 월드 오일러(XYZ, 도) → glTF 노드 회전(휴지 로컬 × 포즈).
 function world(rest,name,e){
  const Rb=new T.Quaternion().setFromEuler(new T.Euler(e[0]*D2R,e[1]*D2R,e[2]*D2R,'ZYX'));
  const Rg=qC.clone().multiply(Rb).multiply(qCi);
  const A=armature(rest,name),Ai=A.clone().invert();
  const pose=Ai.multiply(Rg).multiply(A);
  return new T.Quaternion().fromArray(rest[name].q).multiply(pose).normalize();
 }
 function worldLoc(rest,name,d){
  const v=new T.Vector3(d[0],d[1],d[2]).applyQuaternion(qC);
  const A=armature(rest,name);v.applyQuaternion(A.clone().invert());
  v.applyQuaternion(new T.Quaternion().fromArray(rest[name].q));
  return new T.Vector3().fromArray(rest[name].t).add(v);
 }
 // 순운동학: 뼈 이름 → 월드(아마추어) 행렬. frame[n]={q,t} 가 없으면 휴지값.
 function fk(rest,frame){
  const W={};const get=n=>{if(W[n])return W[n];const r=rest[n],f=frame[n]||{};
   const m=new T.Matrix4().compose(new T.Vector3().fromArray(f.t||r.t),new T.Quaternion().fromArray(f.q||r.q),new T.Vector3(1,1,1));
   W[n]=r.parent&&rest[r.parent]?get(r.parent).clone().multiply(m):m;return W[n];};
  for(const n in rest)get(n);return W;
 }
 // 발끝 = 정강이 뼈 Y 축으로 휴지 자세에서 바닥(y=0)에 닿는 길이.
 function lengths(rest){
  const W=fk(rest,{}),o=new T.Vector3().setFromMatrixPosition(W.Shin_R),d=new T.Vector3(0,1,0).transformDirection(W.Shin_R);
  return [Math.abs(rest.Shin_R.t[1]),d.y<-.5?o.y/-d.y:o.y];
 }
 // sole: soleOf() 의 발바닥 정점(스키닝 그대로). 없으면 두 정강이 뼈 축 끝.
 function feet(rest,frame,sole){const W=fk(rest,frame),Lb=lengths(rest)[1];
  if(!sole)return ['Shin_R','Shin_L'].map(n=>new T.Vector3(0,Lb,0).applyMatrix4(W[n]));
  const out=[],t=new T.Vector3();
  for(const r of sole){const v=new T.Vector3();for(let k=0;k<r.n.length;k++){if(!W[r.n[k]])continue;v.addScaledVector(t.fromArray(r.l[k]).applyMatrix4(W[r.n[k]]),r.w[k]);}out.push(v);}
  return out;}
 function build(rest,dur,sole,mirror){
  const times=new Float32Array(KEYS),q={},loc=new Float32Array(KEYS*3);
  const names=Object.keys(pose(0).rot).filter(n=>rest[n]);
  for(const n of names)q[n]=new Float32Array(KEYS*4);
  const restFoot=Math.min(...feet(rest,{},sole).map(v=>v.y));
  for(let i=0;i<KEYS;i++){
   const p=i/(KEYS-1),P=pose(p);times[i]=dur*p;const frame={};
   if(mirror)for(const n in P.rot){const e=P.rot[n];P.rot[n]=[-e[0],e[1],-e[2]];}
   for(const n of names){const r=world(rest,n,P.rot[n]);r.toArray(q[n],i*4);frame[n]={q:r.toArray()};}
   // 골반 높이: 둘 중 낮은(디딤) 발끝이 휴지 자세 바닥 높이에 오게 순운동학으로 맞춘다.
   const base=worldLoc(rest,'Pelvis',[P.sway,0,0]);frame.Pelvis.t=base.toArray();
   const low=Math.min(...feet(rest,frame,sole).map(v=>v.y));
   worldLoc(rest,'Pelvis',[P.sway,0,restFoot-low]).toArray(loc,i*3);
  }
  // 이음매 없는 반복: 마지막 키 = 첫 키(쿼터니언 부호까지).
  for(const n of names){const a=q[n];for(let i=1;i<KEYS;i++){let d=0;for(let k=0;k<4;k++)d+=a[i*4+k]*a[(i-1)*4+k];if(d<0)for(let k=0;k<4;k++)a[i*4+k]*=-1;}}
  const tracks=[new T.VectorKeyframeTrack('Pelvis.position',times,loc)];
  for(const n of names)tracks.push(new T.QuaternionKeyframeTrack(n+'.quaternion',times,q[n]));
  return tracks;
 }
 // 앞뒤 거울(정면 축 gl Z 뒤집기): 이미 있는 클립(대기·공격)을 몸 앞쪽이 뼈대 뒤쪽인 메시에 맞춘다.
 function mirrorTrack(rest,track){
  const [n,prop]=track.name.split('.');const r=rest[n];if(!r)return false;
  const A=armature(rest,n),Ai=A.clone().invert(),qr=new T.Quaternion().fromArray(r.q),qri=qr.clone().invert(),v=track.values;
  if(prop==='quaternion'){const q=new T.Quaternion();for(let i=0;i<v.length;i+=4){q.fromArray(v,i);const R=A.clone().multiply(qri.clone().multiply(q)).multiply(Ai);R.x=-R.x;R.y=-R.y;
    qr.clone().multiply(Ai.clone().multiply(R).multiply(A)).normalize().toArray(v,i);}return true;}
  if(prop==='position'){const t=new T.Vector3(),tr=new T.Vector3().fromArray(r.t);for(let i=0;i<v.length;i+=3){t.fromArray(v,i).sub(tr).applyQuaternion(qri).applyQuaternion(A);t.z=-t.z;
    t.applyQuaternion(Ai).applyQuaternion(qr).add(tr).toArray(v,i);}return true;}
  return false;
 }
 return {world,worldLoc,build,lengths,fk,feet,mirrorTrack};
}
function restOf(root){
 const rest={};root.traverse(o=>{if(o.isBone)rest[o.name]={q:o.quaternion.toArray(),t:o.position.toArray(),parent:o.parent?.isBone?o.parent.name:null};});
 return rest;
}
// 발바닥 표본: 휴지 자세(순운동학, 미터)에서 메시 맨 아래 5cm 띠의 정점(최대 240점)을 선형 블렌드 스키닝 그대로(뼈별 로컬 좌표·무게) 담는다.
// (R1305 GLB 는 정점이 양자화 정수라 bindMatrix 공간 단위가 미터가 아니다 → 높이는 뼈 로컬 좌표를 휴지 행렬로 되돌려 잰다.)
function soleOf(T,root,rest){
 const out=[],W=maker(T).fk(rest,{}),v=new T.Vector3(),t=new T.Vector3();
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;const bones=m.skeleton.bones,g=m.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;
  const rows=[],minY={};
  for(let i=0;i<P.count;i++){const row={n:[],w:[],l:[]};const y=new T.Vector3();
   for(let c=0;c<4;c++){const w=SW.getComponent(i,c);if(w<=0)continue;const bi=SI.getComponent(i,c),bn=bones[bi]?.name;if(!bn||!W[bn])continue;
    const l=v.fromBufferAttribute(P,i).applyMatrix4(m.bindMatrix).applyMatrix4(m.skeleton.boneInverses[bi]);row.n.push(bn);row.w.push(w);row.l.push(l.toArray());y.addScaledVector(t.copy(l).applyMatrix4(W[bn]),w);}
   if(!row.n.length)continue;row.y=y.y;
   // 어느 다리 정점인지: 왼다리(Thigh_L·Shin_L) 무게 vs 오른다리 무게. 다리 무게 없으면 몸(자락 등).
   let L=0,R=0;row.n.forEach((n,k)=>{if(/_L$/.test(n)&&/^(Thigh|Shin)/.test(n))L+=row.w[k];if(/_R$/.test(n)&&/^(Thigh|Shin)/.test(n))R+=row.w[k];});
   row.side=L>R?'L':R>L?'R':'B';if(row.y<(minY[row.side]??Infinity))minY[row.side]=row.y;rows.push(row);}
  // 두 발을 따로: 각 다리 정점 중 그 다리의 맨 아래 5cm 띠(발마다 최대 120점). 자락은 그 발들보다 낮을 때만.
  const floor=Math.min(minY.L??Infinity,minY.R??Infinity);
  for(const side of ['L','R','B']){if(!Number.isFinite(minY[side]))continue;if(side==='B'&&minY.B>floor)continue;
   const pick=rows.filter(r=>r.side===side&&r.y<minY[side]+.05),step=Math.max(1,Math.ceil(pick.length/120));
   for(let k=0;k<pick.length;k+=step){const r=pick[k];out.push({n:r.n,w:r.w,l:r.l});}}
 });
 return out.length?out:null;
}
// 페르소나: 왼쪽(Shin_L 쪽) 정점이 Shin_R 에 묶인 것을 Shin_L 로. 휴지 자세에서 두 정강이 뼈 중 가까운 쪽으로 가른다.
function fixPersonaSkin(T,root){
 let moved=0;
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;const bones=m.skeleton.bones,iL=bones.findIndex(b=>b.name==='Shin_L'),iR=bones.findIndex(b=>b.name==='Shin_R');
  if(iL<0||iR<0)return;
  const g=m.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;
  const bL=new T.Vector3().setFromMatrixPosition(m.skeleton.boneInverses[iL].clone().invert()),bR=new T.Vector3().setFromMatrixPosition(m.skeleton.boneInverses[iR].clone().invert());
  const axis=bL.clone().sub(bR),mid=bL.clone().add(bR).multiplyScalar(.5),half=axis.length()/2;axis.normalize();
  const v=new T.Vector3();
  for(let i=0;i<P.count;i++){
   let hasR=-1;for(let k=0;k<4;k++)if(SI.getComponent(i,k)===iR&&SW.getComponent(i,k)>0)hasR=k;
   if(hasR<0)continue;
   v.fromBufferAttribute(P,i).applyMatrix4(m.bindMatrix);
   const s=v.sub(mid).dot(axis);
   if(s>.15*half){let dupe=-1;for(let k=0;k<4;k++)if(SI.getComponent(i,k)===iL)dupe=k;
    if(dupe>=0){SW.setComponent(i,dupe,SW.getComponent(i,dupe)+SW.getComponent(i,hasR));SW.setComponent(i,hasR,0);}else SI.setComponent(i,hasR,iL);moved++;}
  }
  if(moved){SI.needsUpdate=true;SW.needsUpdate=true;}
 });
 return moved;
}
const stats={sole:{},turned:{},mirrored:{},patched:{},skipped:{},personaSkinMoved:0,installs:0,errors:0,lastError:null};
const heroOf=root=>{const m=/^r1305-([a-z]+)-3d-model$/.exec(root?.name||'');return m?m[1]:null;};
// 페르소나 메시는 뼈대와 앞뒤가 반대(얼굴·발끝이 뼈대 -Z, 다른 8명은 +Z)라 게임에서 뒤로 걷고 공격도 등 뒤로 나갔다.
// → 모델을 Y 축으로 180° 돌려 얼굴을 이동 방향에 맞추고, 그 모델의 모든 클립(대기·걷기·공격)을 앞뒤 거울로 바꾼다.
const REVERSED=new Set(['persona']);
function patchClip(T,root,clip){
 const id=heroOf(root);
 if(!id||!HEROES.includes(id)||!clip?.name||clip.userData?.r1310)return false;
 if(SKIP.has(id)){if(clip.name==='Walk')stats.skipped[id]=(stats.skipped[id]||0)+1;return false;}
 const rest=restOf(root),M=maker(T),rev=REVERSED.has(id);
 if(!['Pelvis','Thigh_L','Thigh_R','Shin_L','Shin_R','Arm_L','Arm_R'].every(n=>rest[n]))return false;
 if(rev&&!root.userData.r1310Turned){root.rotation.y+=Math.PI;root.userData.r1310Turned=true;stats.turned[id]=true;}
 if(clip.name!=='Walk'){
  if(!rev)return false;
  let n=0;for(const t of clip.tracks)if(M.mirrorTrack(rest,t))n++;
  clip.userData={...(clip.userData||{}),r1310:REV+'-mirror'};stats.mirrored[id]=(stats.mirrored[id]||[]).concat(clip.name+':'+n);return n>0;
 }
 if(id==='persona'&&!root.userData.r1310Skin){stats.personaSkinMoved+=fixPersonaSkin(T,root);root.userData.r1310Skin=true;}
 const sole=soleOf(T,root,rest);stats.sole[id]=sole?sole.length:0;
 const tracks=M.build(rest,clip.duration,sole,rev);
 const keep=clip.tracks.filter(t=>!tracks.some(n=>n.name===t.name));
 clip.tracks=keep.concat(tracks);clip.userData={...(clip.userData||{}),r1310:REV};
 stats.patched[id]=(stats.patched[id]||0)+1;return true;
}
function install(T){
 const P=T?.AnimationMixer?.prototype;if(!P||P.__r1310)return false;
 const base=P.clipAction;
 P.clipAction=function(clip,root,blend){
  try{const r=root||this.getRoot?.();if(clip?.isAnimationClip||clip?.tracks)patchClip(T,r,clip);}catch(e){stats.errors++;stats.lastError=String(e?.message||e);}
  return base.call(this,clip,root,blend);
 };
 Object.defineProperty(P,'__r1310',{value:true});stats.installs++;return true;
}
let done=false;
function poll(){
 if(done)return;
 try{const T=host.__STORYWORLD_PHASE1__?.controller?.state?.three?.T;if(T){install(T);done=true;return;}}catch(_){}
 if(typeof host.requestAnimationFrame==='function')host.requestAnimationFrame(poll);
}
if(typeof host.requestAnimationFrame==='function')poll();
host[API]=Object.freeze({revision:REV,heroes:HEROES.slice(),skip:()=>[...SKIP],pose,maker,restOf,fixPersonaSkin,soleOf,patchClip,install,inspect:()=>({revision:REV,installed:done,...JSON.parse(JSON.stringify(stats))})});
})();
