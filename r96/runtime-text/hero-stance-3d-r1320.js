// R1320 3D 영웅 무기 쥔 자세 — 환도·EGO 검 세워 들기, 기억사수 견착, 미카엘라 봉 쥐기.
//  · 사용자 11-26: "검을 이런 파란색 처럼 들어야지 자연스럽게"(환도 영웅: 손에서 앞·위로 비스듬히 세운 검),
//    "기억사수 총 쏠 때 개머리판 부분 어깨에 견착하고 진짜 군인처럼",
//    "미카엘라도 옆에서 봤을 때는 봉을 잡고 있는 게 아니라 봉이 그냥 손에 붙어있는 느낌이라 부자연스러워".
//  · 원인(실측): R1318 은 무기 손잡이를 손 뼈(Weapon_Socket) 원점에 붙였는데, 이 리그의 손 뼈는 손목 끝이고 주먹 살은 거기서
//    미카엘라 13cm·기억사수 10cm·환도 13cm 떨어져 있다 → 무기가 주먹 옆을 스쳐 '붙어 있는' 것처럼 보였다. 팔은 늘어뜨린 채라 검이 땅으로 처졌다.
//  · 고침: 렌더 직전(scene.onBeforeRender)에 ① 무기 손잡이를 주먹 살 무게중심으로 옮기고 ② 영웅별 자세 표대로 무기 자리·방향을 몸 기준으로 정한 뒤
//    ③ 팔 두 뼈 IK 로 주먹을 그 손잡이에 가져간다(기억사수는 왼손도 총열 덮개로, 가슴을 틀어 어깨를 내준다). 렌더가 끝나면 뼈·무기 값을 되돌린다
//    — 정령·판정·다른 검사가 보는 값(R1313 표·애니메이션)은 그대로다. 손·손가락 뼈가 없어 손가락 모양은 바꾸지 못한다.
//  · 환도·EGO: 대기·걷기에만(공격은 원래 베기 모션, 가중치로 부드럽게 넘어감). EGO 는 환도 틀이라 같은 자세로 맞춘다.
//    기억사수: 대기·걷기 = 총구를 내린 두 손 대기, 공격 = 어깨 견착 조준. 미카엘라: 대기·걷기 = 팔꿈치를 굽혀 봉을 세워 쥠, 공격 = 봉을 앞으로 내밈.
//  · R1320b(심사 지적 'EGO 정면 공격이 빈손처럼 보임'): 칼날이 카메라 축과 거의 나란하면(실측 10°) 화면에서 점으로 줄어 사라진다
//    → 환도·EGO 는 대기·공격 내내 칼날을 카메라 축에서 view(°) 넘게 벌려 준다(손잡이는 주먹에 둔 채 칼만 돌림).
//  · R1348(사용자 11-26 14:13Z "환도 손에 잘 쥐어서 모션 동작 자연스러워야한다"): 실측 ① 원래 베기 모션에서 칼날과 아래팔이 3~25°로 거의 일직선
//    — 손목이 꺾이지 않은 채 팔 끝에 막대를 붙인 모양(사람 손목은 칼을 쥐면 칼날이 아래팔과 45° 넘게 벌어진다). ② 대기↔공격이 섞이는 순간 주먹이 칼자루에서 9cm 떨어졌다.
//    → ① 칼날이 아래팔과 wrist[0]° 보다 가까우면 손목을 꺾듯 칼을 손잡이(주먹) 둘레로 돌려 그 각까지 벌린다. 벌리는 쪽은 칼날이 이미 벗어난 쪽,
//      거의 일직선이면 R1313 표 자세의 칼날 쪽(손목이 꺾이는 쪽)으로 이어지게 섞어 프레임 사이에 뛰지 않는다. 각이 충분하면 원래 모션 그대로.
//      (팔꿈치를 어깨→주먹 축으로 돌리는 방법도 재 봤지만 팔을 뻗은 끝 동작에서는 각이 13°→17° 밖에 안 벌어지고 팔꿈치가 크게 흔들려 버렸다.)
//    ② 대기↔공격을 섞는 동안에도 칼자루를 늘 주먹에 둔다.
//  · hwando-3d-r1302.js(해시 고정)·R1313 표는 건드리지 않는다. 끄기: localStorage storyworld.r1320.stance=off.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_STANCE_R1320__)return;
const REV='R1351-hero-stance-4',KEY='storyworld.r1320.stance',NAME=/^r1305-([a-z]+)-3d-shared$/,DEG=Math.PI/180;
// 좌표: 영웅 모델(+Z 앞, +Y 위, 오른손 −X, 키 약 1.75). at = 오른 어깨 뼈에서 잰 자리, dir = 무기 길이 방향(칼끝·총구·하트 쪽),
// side = 무기 +X 축이 향할 쪽(칼등·총 아래·하트 넓은 쪽), anchor = at 에 놓을 무기 자리(grip 손잡이, butt 개머리판 끝),
// pole = 팔꿈치가 향할 쪽, twist = 가슴을 위 축으로 튼 각(°), head = 머리 되돌림·숙임(°), left = 왼손도 무기를 받침.
const STANCES={
 hwando:{socket:'Weapon_Socket',view:34,wrist:[32],rest:{anchor:'grip',at:[.06,-.35,.29],dir:[.22,.78,.60],side:[0,1,0],pole:[-.5,-.6,-.6]}},
 ego:{socket:'Weapon_Socket_R',view:34,wrist:[32],rest:{anchor:'grip',at:[.06,-.35,.29],dir:[.22,.78,.60],side:[0,1,0],pole:[-.5,-.6,-.6]}},
 gunner:{socket:'Weapon_Socket_R',left:'Weapon_Socket_L',
  rest:{anchor:'butt',at:[.05,-.10,.08],dir:[.05,-.50,.86],side:[0,-1,0],pole:[-.5,-1,-.3],poleL:[.5,-1,0],twist:-14,head:[10,0]},
  attack:{anchor:'butt',at:[.05,-.03,.07],dir:[0,0,1],side:[0,-1,0],pole:[-.5,-1,-.3],poleL:[.5,-1,0],twist:-28,head:[22,8]}},
 michaela:{socket:'Weapon_Socket_R',
  rest:{anchor:'grip',at:[-.10,-.31,.19],dir:[-.16,1,.10],side:[1,0,0],pole:[-.6,-.4,-.7]},
  attack:{anchor:'grip',at:[.02,-.14,.38],dir:[0,.82,.57],side:[1,0,0],pole:[-.6,-.6,-.4]}}
};
const VIEW_RATE=720;// 칼날 화면 보정 결과가 움직일 수 있는 최대 속도(°/게임초) — R1351
const stats={revision:REV,hooks:0,builds:0,frames:0,errors:0,last:{}};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}

// ── 순수 계산(검사용으로 내놓음) ──
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(a,fb=[0,1,0])=>{const l=len(a);return l>1e-9&&isFinite(l)?[a[0]/l,a[1]/l,a[2]/l]:fb.slice();};
const num=(v,d)=>Number.isFinite(+v)?+v:d;
// 두 뼈 IK: 어깨 a, 목표 t, 뼈 길이 l1·l2, 팔꿈치 쪽 pole → 팔꿈치 자리와 실제 손 자리(닿지 않으면 뻗은 채 목표 쪽).
function elbow(a,t,l1,l2,pole){
 l1=Math.max(1e-6,num(l1,0));l2=Math.max(1e-6,num(l2,0));let d=sub(t,a);const raw=len(d);const dn=unit(d,[0,-1,0]);
 const D=Math.max(Math.abs(l1-l2)+1e-5,Math.min(isFinite(raw)?raw:0,(l1+l2)*.999));
 let p=add(pole||[0,-1,0],dn,-dot(pole||[0,-1,0],dn));if(len(p)<1e-6){p=cross(dn,[1,0,0]);if(len(p)<1e-6)p=cross(dn,[0,0,1]);}p=unit(p);
 const c=Math.max(-1,Math.min(1,(l1*l1+D*D-l2*l2)/(2*l1*D))),s=Math.sqrt(1-c*c);
 const e=add(add(a,dn,l1*c),p,l1*s);return {elbow:e,hand:add(a,dn,D),reach:raw/(l1+l2)};
}
// 무기 축(+Y = dir, +X ≈ side) → 회전 행렬 열(X,Y,Z). side 가 dir 과 나란하면 다른 축으로 대신한다.
function basis(dir,side){const Y=unit(dir);let X=add(side,Y,-dot(side,Y));if(len(X)<1e-5){X=cross(Y,[0,0,1]);if(len(X)<1e-5)X=cross(Y,[1,0,0]);}X=unit(X);return {X,Y,Z:unit(cross(X,Y))};}
// 칼날 방향 d 가 보는 축 c 와 min(라디안)보다 가까우면 그만큼 벌린 방향을 준다(축 반대쪽을 향해도 같게). 이미 벌어져 있으면 그대로.
function deflect(d,c,min){d=unit(d);c=unit(c,[0,0,-1]);min=Math.max(0,Math.min(Math.PI/2,num(min,0)));let k=dot(d,c);const sg=k<0?-1:1;k=Math.min(1,Math.abs(k));if(Math.acos(k)>=min)return d;
 let p=add(d,c,-dot(d,c));if(len(p)<1e-6){p=cross(c,[0,1,0]);if(len(p)<1e-6)p=cross(c,[1,0,0]);}p=unit(p);return unit(add([c[0]*sg*Math.cos(min),c[1]*sg*Math.cos(min),c[2]*sg*Math.cos(min)],p,Math.sin(min)));}
// R1351(Codex #1039 P2): 칼날이 축 바로 옆을 스치면 deflect 의 벌리는 쪽이 한 프레임에 원뿔 반대편으로 넘어가 칼이 튀었다(실측 46~55°).
// 축을 지나는 칼을 원뿔 가장자리로 옮기는 일은 어떤 공식으로도 끊김 없이 할 수 없다 → 시간으로 잇는다: 앞 프레임 결과 prev 에서
// deflect 목표 쪽으로, 축 둘레 구면 좌표(축과의 각 θ·방위 φ)로 한 번에 maxTurn(라디안)까지만 옮긴다. θ 는 늘 [min, π−min] 안 → 칼은 축을 지나지 않고 돌아간다.
function follow(d,c,min,prev,maxTurn){const t=deflect(d,c,min);if(!prev||!(len(prev)>1e-6))return t;c=unit(c,[0,0,-1]);min=Math.max(0,Math.min(Math.PI/2,num(min,0)));
 const p=unit(prev),ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)))),mt=Math.max(0,num(maxTurn,Math.PI));if(ang(p,t)<=mt)return t;
 let e1=cross(c,[0,1,0]);if(len(e1)<1e-6)e1=cross(c,[1,0,0]);e1=unit(e1);const e2=cross(c,e1);
 const sp=v=>[Math.acos(Math.max(-1,Math.min(1,dot(v,c)))),Math.atan2(dot(v,e2),dot(v,e1))],[tp,fp]=sp(p),[tt,ft]=sp(t);let df=ft-fp;df-=2*Math.PI*Math.round(df/(2*Math.PI));
 const at=f=>{const th=Math.max(min,Math.min(Math.PI-min,tp+(tt-tp)*f)),ph=fp+df*f,st=Math.sin(th);return unit(add(add([c[0]*Math.cos(th),c[1]*Math.cos(th),c[2]*Math.cos(th)],e1,st*Math.cos(ph)),e2,st*Math.sin(ph)));};
 let lo=0,hi=1;for(let i=0;i<16;i++){const m=(lo+hi)/2;if(ang(p,at(m))<=mt)lo=m;else hi=m;}return at(lo);}
// 손목 꺾기(순수): 칼날 D 가 아래팔 축 ax 와 min(라디안)보다 가까우면(칼이 팔 끝에 일직선으로 붙은 모양) 칼날을 ax 에서 min 만큼 벌린다.
// 벌리는 쪽은 칼날이 이미 벗어난 쪽, 거의 일직선이면 ref(손목이 꺾이는 쪽 = 표 자세의 칼날 방향)로 이어지게 섞는다 — 경계에서 값이 이어진다.
function cock(D,ax,ref,min){D=unit(D);ax=unit(ax,[0,1,0]);min=Math.max(0,Math.min(Math.PI/2,num(min,0)));const ca=dot(D,ax);if(Math.acos(Math.max(-1,Math.min(1,ca)))>=min)return D;
 let p=add(D,ax,-ca);const pl=len(p),sm=Math.sin(min);if(pl<sm){let r=add(ref||[0,0,1],ax,-dot(ref||[0,0,1],ax));if(len(r)<1e-6){r=cross(ax,[1,0,0]);if(len(r)<1e-6)r=cross(ax,[0,0,1]);}p=add(p,unit(r),sm-pl);}
 if(len(p)<1e-9)p=cross(ax,[1,0,0]);return unit(add([ax[0]*Math.cos(min),ax[1]*Math.cos(min),ax[2]*Math.cos(min)],unit(p),sm));}
// 두 자세 섞기(k: 0 = a, 1 = b). 한쪽이 없으면 있는 쪽.
function mix(a,b,k){if(!a||!b)return a||b||null;k=Math.max(0,Math.min(1,num(k,0)));const L=(x,y)=>x.map((v,i)=>v+(y[i]-v)*k);
 return {anchor:k<.5?a.anchor:b.anchor,at:L(a.at,b.at),dir:unit(L(unit(a.dir),unit(b.dir))),side:unit(L(unit(a.side),unit(b.side)),a.side),pole:L(a.pole,b.pole),poleL:a.poleL&&b.poleL?L(a.poleL,b.poleL):a.poleL||b.poleL,
  twist:num(a.twist,0)+(num(b.twist,0)-num(a.twist,0))*k,head:L(a.head||[0,0],b.head||[0,0])};}
// 자세 가중치: 공격 자세가 있으면 대기↔공격을 섞어 언제나 1, 없으면 공격 동안 원래 모션으로 돌아간다.
function weightOf(cfg,w){const i=Math.max(0,num(w?.idle,0)),k=Math.max(0,num(w?.walk,0)),a=Math.max(0,num(w?.attack,0)),t=i+k+a;if(!(t>1e-6))return {w:cfg.attack?1:1,atk:0};
 const atk=a/t;return cfg.attack?{w:1,atk}:{w:1-atk,atk:0};}

// ── 장면 ──
let T=null,hookedScene=null,scan=0;const cur={};
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};
const arr=v=>[v.x,v.y,v.z];
// 주먹 = 아래팔 뼈에 붙은 꼭짓점 가운데 손끝 쪽 7cm 의 무게중심(아래팔 뼈 좌표, 한 번만 계산).
function fist(body,fore){
 const sk=body.skeleton,fb=sk.bones.indexOf(fore);if(fb<0)return null;const kids=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0);
 const G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight;if(!P||!SI||!SW)return null;
 const M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
 for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||kids.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;v.fromBufferAttribute(P,i).applyMatrix4(M);pts.push(v.x,v.y,v.z);}
 if(pts.length<9)return null;const ys=[];for(let i=1;i<pts.length;i+=3)ys.push(pts[i]);ys.sort((a,b)=>a-b);const top=ys[Math.floor(ys.length*.98)];
 const c=new T.Vector3();let n=0;for(let i=0;i<pts.length;i+=3)if(pts[i+1]>=top-.07&&pts[i+1]<=top+.02){c.x+=pts[i];c.y+=pts[i+1];c.z+=pts[i+2];n++;}
 return n?c.multiplyScalar(1/n):null;
}
// 뼈의 기준(바인드) 회전: 애니메이션 순간값이 아니라 늘 같은 데서 풀어 팔 비틀림이 흔들리지 않게 한다.
function bindQuat(body,bone){const sk=body.skeleton,i=sk.bones.indexOf(bone),pi=sk.bones.indexOf(bone.parent);if(i<0||pi<0)return bone.quaternion.clone();
 const m=new T.Matrix4().multiplyMatrices(sk.boneInverses[pi],new T.Matrix4().copy(sk.boneInverses[i]).invert());return new T.Quaternion().setFromRotationMatrix(m);}
function build(id,group){
 const cfg=STANCES[id],model=group.getObjectByName('r1305-'+id+'-3d-model');if(!model)return null;
 const mount=group.getObjectByName('r1313-'+id+'-weapon');if(!mount)return null;const sock=mount.parent;if(!sock||sock.name!==cfg.socket)return null;
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink&&!/^r1320/.test(o.name||''))body=o;});if(!body)return null;
 const bone=n=>model.getObjectByName(n),B=sock.parent,A=B?.parent;if(!A?.isBone||!B?.isBone)return null;const palm=fist(body,B);if(!palm)return null;
 const s={id,cfg,group,model,mount,sock,body,A,B,palm,bindA:bindQuat(body,A),bindB:bindQuat(body,B),chest:bone('Spine_Chest'),head:bone('Head')||bone('Head_Hood'),applied:false,saved:[]};
 if(cfg.left){const C=bone(cfg.left),LB=C?.parent,LA=LB?.parent;if(C&&LB?.isBone&&LA?.isBone){const p=fist(body,LB);if(p)s.L={A:LA,B:LB,C,palm:p,bindA:bindQuat(body,LA),bindB:bindQuat(body,LB)};}}
 // 무기 치수(무기 묶음 좌표): 개머리판 끝·받침 자리
 model.updateMatrixWorld(true);const inv=new T.Matrix4().copy(mount.matrixWorld).invert(),bb=new T.Box3(),v=new T.Vector3();let fx=null,sup=null;
 mount.traverse(o=>{if(o.isMesh&&!/^r1320/.test(o.name||'')){const P=o.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);for(let i=0;i<P.count;i+=2)bb.expandByPoint(v.fromBufferAttribute(P,i).applyMatrix4(M));}
  else if(/^BladeTip/.test(o.name||''))s.tip=o;else if(/^EmissionFX/.test(o.name||''))fx=o.getWorldPosition(new T.Vector3()).applyMatrix4(inv);else if(/^SupportSocket/.test(o.name||''))sup=o.getWorldPosition(new T.Vector3()).applyMatrix4(inv);});
 s.butt=new T.Vector3(fx?fx.x:0,bb.isEmpty()?0:bb.min.y,0);s.support=sup||new T.Vector3(0,bb.isEmpty()?0:bb.max.y*.35,0);
 s.bones=[s.chest,s.head,A,B,s.L?.A,s.L?.B].filter(Boolean);s.saved=s.bones.map(()=>new T.Quaternion());s.mq=new T.Quaternion();s.mp=new T.Vector3();
 stats.builds++;return s;
}
function find(scene){
 for(const id of Object.keys(cur)){const s=cur[id];if(s.group.parent!==scene||!s.mount.parent||!s.model.parent||s.mount.parent!==s.sock){restore(s);delete cur[id];}}
 if(scan-->0)return;scan=20;
 for(const c of scene.children){const m=NAME.exec(c.name||''),id=m&&m[1];if(!id||!STANCES[id]||cur[id]?.group===c||!c.visible)continue;const s=build(id,c);if(s)cur[id]=s;else scan=2;}
}
const _v=[],_q=[];const V=i=>_v[i]||(_v[i]=new T.Vector3()),Q=i=>_q[i]||(_q[i]=new T.Quaternion());
// 뼈를 세계 좌표 회전 q 만큼 더 돌린다.
function turn(bone,q){bone.parent.getWorldQuaternion(Q(10));bone.getWorldQuaternion(Q(11));bone.quaternion.copy(Q(10).invert().multiply(q).multiply(Q(11)));bone.updateMatrixWorld(true);}
function aim(bone,from,to){if(!(from.lengthSq()>1e-12&&to.lengthSq()>1e-12))return;turn(bone,Q(12).setFromUnitVectors(V(20).copy(from).normalize(),V(21).copy(to).normalize()));}
// 팔 풀기: 주먹(아래팔 뼈 좌표 palm)이 target(세계)에 오게. 주먹이 뼈 축에서 벗어나 있어 몇 번 되풀이한다.
function reachArm(arm,target,poleW){
 const {A,B,palm}=arm,C=arm.C||arm.sock;A.quaternion.copy(arm.bindA);B.quaternion.copy(arm.bindB);A.updateMatrixWorld(true);
 const a=A.getWorldPosition(V(0)).clone(),t=target.clone();let err=1;
 for(let it=0;it<4;it++){
  const b=B.getWorldPosition(V(1)),c=C.getWorldPosition(V(2)),pw=B.localToWorld(V(3).copy(palm));if(it>0){err=pw.distanceTo(target);if(err<.004)break;}
  t.add(V(4).copy(target).sub(pw).multiplyScalar(it?1:0));if(it===0)t.copy(target).sub(pw).add(c);
  const l1=a.distanceTo(b),l2=b.distanceTo(c),r=elbow(arr(a),arr(t),l1,l2,arr(poleW));
  aim(A,V(5).copy(b).sub(a),V(6).fromArray(r.elbow).sub(a));B.getWorldPosition(b);C.getWorldPosition(c);aim(B,V(5).copy(c).sub(b),V(6).copy(t).sub(b));
 }
 return B.localToWorld(V(3).copy(palm)).distanceTo(target);
}
// 칼날을 카메라 축에서 벌리기(손잡이 자리 그대로, 무기 묶음만 세계 회전)
function clearView(s,again){const deg=num(s.cfg.view,0),cam=host()?.camera;if(!(deg>0)||!cam||!s.tip)return 0;
 const c=cam.getWorldDirection(V(30)),g=s.mount.getWorldPosition(V(31)),d=s.tip.getWorldPosition(V(32)).sub(g);if(!(d.lengthSq()>1e-12))return 0;d.normalize();
 const now=typeof time==='number'?time:performance.now()/1000,gap=now-num(s.vT,-1e9),dt=Math.max(0,Math.min(.1,gap));s.vT=now;
 const gq=s.group.getWorldQuaternion(Q(16)),prev=s.vPrev&&gap>=0&&gap<.25?arr(V(34).fromArray(s.vPrev).applyQuaternion(gq)):null;// 몸 좌표로 기억 → 몸이 도는 만큼은 늦추지 않음
 const n=follow(arr(d),arr(c),deg*DEG,again?null:prev,VIEW_RATE*DEG*Math.max(dt,1/240)),to=V(33).fromArray(n),turned=d.angleTo(to);s.vPrev=arr(V(35).copy(to).applyQuaternion(Q(17).copy(gq).invert()));if(turned<1e-5)return 0;
 const q=Q(13).setFromUnitVectors(d,to);s.mount.parent.getWorldQuaternion(Q(14));s.mount.getWorldQuaternion(Q(15));s.mount.quaternion.copy(Q(14).invert().multiply(q).multiply(Q(15)));s.mount.updateMatrixWorld(true);return turned/DEG;}
// 손목: 칼자루는 주먹에 둔 채, 칼날이 아래팔과 일직선에 가까우면 손목을 꺾듯 칼을 손잡이 둘레로 돌린다.
function wrist(s){const band=s.cfg.wrist;if(!band||!s.tip)return null;
 const g=s.mount.getWorldPosition(new T.Vector3()),D=s.tip.getWorldPosition(new T.Vector3()).sub(g);if(!(D.lengthSq()>1e-12))return null;D.normalize();
 const bq=s.B.getWorldQuaternion(new T.Quaternion()),ax=s.palm.clone().normalize().applyQuaternion(bq);
 const ref=new T.Vector3(0,1,0).applyQuaternion(s.mq).applyQuaternion(s.sock.quaternion).applyQuaternion(bq);// 표(R1313) 자세의 칼날 방향
 const before=D.angleTo(ax)/DEG,n=cock(arr(D),arr(ax),arr(ref),band[0]*DEG),to=new T.Vector3().fromArray(n),t=D.angleTo(to);
 if(t<1e-5)return {before:+before.toFixed(1),after:+before.toFixed(1),turn:0};
 const q=new T.Quaternion().setFromUnitVectors(D,to);s.mount.parent.getWorldQuaternion(Q(14));s.mount.getWorldQuaternion(Q(15));s.mount.quaternion.copy(Q(14).invert().multiply(q).multiply(Q(15)));s.mount.updateMatrixWorld(true);
 return {before:+before.toFixed(1),after:+(to.angleTo(ax)/DEG).toFixed(1),turn:+(t/DEG).toFixed(1)};}
// 손목 → 화면(앞 프레임과 이어지게, R1351) → 화면 보정이 손목을 다시 좁혔으면 손목 한 번 더 → 그 손목이 칼을 카메라 원뿔에 다시 넣었을 때만 바로 벌림(마지막은 늘 화면 쪽).
// 손목 cock 은 입력에 연속이고, 두 번째 화면 보정은 칼이 이미 원뿔 가장자리 근처일 때만 움직여 축을 건너지 않는다. 기억(s.vPrev)은 늘 마지막 결과.
function fit(s){let wr=wrist(s),v=clearView(s);if(s.cfg.wrist&&s.tip){const w2=wrist(s);if(w2?.turn>0){wr={...wr,again:w2.turn};v+=clearView(s,true);}}return [wr,v];}
function restore(s){if(!s.applied)return;s.bones.forEach((b,i)=>b.quaternion.copy(s.saved[i]));s.mount.quaternion.copy(s.mq);s.mount.position.copy(s.mp);(s.chest||s.A).updateMatrixWorld(true);s.A.updateMatrixWorld(true);s.L?.A.updateMatrixWorld(true);s.applied=false;}
function pose(s,api){
 const cfg=s.cfg,k=weightOf(cfg,api.inspect().weights),spec=mix(cfg.rest,cfg.attack,k.atk);if(!spec)return;
 s.bones.forEach((b,i)=>s.saved[i].copy(b.quaternion));s.mq.copy(s.mount.quaternion);s.mp.copy(s.mount.position);s.applied=true;
 const model=s.model,mq=model.getWorldQuaternion(new T.Quaternion()),dirW=v=>new T.Vector3().fromArray(v).applyQuaternion(mq);
 const scale=model.getWorldScale(new T.Vector3()).x,w=k.w;
 // ① 손잡이를 주먹으로(자세 가중치와 상관없이 늘): 손 뼈 좌표의 주먹 자리
 const palmSock=s.sock.worldToLocal(s.B.localToWorld(s.palm.clone()));s.mount.position.copy(palmSock);s.mount.updateMatrixWorld(true);
 if(w<=.001){const [wr,v]=fit(s),view=+v.toFixed(1);stats.last[s.id]={w:0,view,wrist:wr};return;}
 // ② 가슴 틀기·머리 되돌림(기억사수)
 const up=dirW([0,1,0]).normalize();
 if(s.chest&&spec.twist){turn(s.chest,new T.Quaternion().setFromAxisAngle(up,spec.twist*DEG*w));
  if(s.head){turn(s.head,new T.Quaternion().setFromAxisAngle(up,num(spec.head?.[0],0)*DEG*w));const right=dirW([1,0,0]).normalize();turn(s.head,new T.Quaternion().setFromAxisAngle(right,num(spec.head?.[1],0)*DEG*w));}}
 // ③ 무기 자리·방향(세계): 오른 어깨에서 잰 자리에 anchor 를 놓는다
 const bx=basis(spec.dir,spec.side),wq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3().fromArray(bx.X),new T.Vector3().fromArray(bx.Y),new T.Vector3().fromArray(bx.Z))).premultiply(mq);
 const shoulder=s.A.getWorldPosition(new T.Vector3()),at=shoulder.clone().add(dirW(spec.at).multiplyScalar(scale));
 const ms=s.mount.getWorldScale(new T.Vector3()).x,grip=at.clone();if(spec.anchor==='butt')grip.sub(s.butt.clone().multiplyScalar(ms).applyQuaternion(wq));
 // ④ 오른팔: 주먹을 손잡이로. 섞을 때는 푼 값과 원래 값을 구면 보간.
 const qa=s.A.quaternion.clone(),qb=s.B.quaternion.clone();const err=reachArm(s,grip,dirW(spec.pole));
 if(w<.999){s.A.quaternion.copy(qa.slerp(s.A.quaternion,w));s.B.quaternion.copy(qb.slerp(s.B.quaternion,w));s.A.updateMatrixWorld(true);}
 // ⑤ 무기: 손 뼈 좌표로 옮겨 놓는다(가중치만큼 표 자세에서 옮김)
 const sq=s.sock.getWorldQuaternion(new T.Quaternion()),lq=sq.clone().invert().multiply(wq),lp=s.sock.worldToLocal(grip.clone()),p0=s.sock.worldToLocal(s.B.localToWorld(s.palm.clone()));
 s.mount.quaternion.copy(s.mq).slerp(lq,w);s.mount.position.copy(w<.999?p0:lp);s.mount.updateMatrixWorld(true);// 섞는 동안에도 칼자루는 주먹에(R1348)
 // ⑥ 왼손: 받침 자리로(닿지 않으면 손잡이 쪽으로 당겨 닿는 데까지)
 let errL=null,slide=1;if(s.L){const L=s.L,la=L.A.quaternion.clone(),lb=L.B.quaternion.clone(),pole=dirW(spec.poleL||[.5,-1,0]);
  for(slide=1;slide>=.39;slide-=.15){const t=s.mount.localToWorld(s.support.clone().multiplyScalar(slide));errL=reachArm(L,t,pole);if(errL<.02*scale)break;}
  if(w<.999){L.A.quaternion.copy(la.slerp(L.A.quaternion,w));L.B.quaternion.copy(lb.slerp(L.B.quaternion,w));L.A.updateMatrixWorld(true);}}
 const [wr,view]=fit(s);// 손목 먼저, 화면에서 칼날이 사라지지 않게 하는 clearView 가 마지막
 stats.last[s.id]={wrist:wr,view:+view.toFixed(1),w:+w.toFixed(3),atk:+k.atk.toFixed(3),err:+(err/scale).toFixed(4),errL:errL==null?null:+(errL/scale).toFixed(4),slide:+slide.toFixed(2)};
}
function before(scene){
 if(!on){for(const id in cur)restore(cur[id]);return;}
 const api=window.__STORYWORLD_HWANDO3D_R1302__;if(!api?.inspect)return;find(scene);
 for(const id in cur){const s=cur[id];if(!s.group.visible||s.applied)continue;try{pose(s,api);stats.frames++;}catch(e){restore(s);fail(e);}}
}
function after(){for(const id in cur)try{restore(cur[id]);}catch(e){fail(e);}}
function hook(){
 const r=host();if(!r||r.scene===hookedScene)return;T=r.T;const scene=r.scene,pb=scene.onBeforeRender,pa=scene.onAfterRender;
 scene.onBeforeRender=function(...a){try{pb?.apply(this,a);}finally{try{before(scene);}catch(e){fail(e);}}};
 scene.onAfterRender=function(...a){try{after();}finally{pa?.apply(this,a);}};
 hookedScene=scene;stats.hooks++;
}
setInterval(()=>{try{hook();}catch(e){fail(e);}},400);
window.__STORYWORLD_HERO_STANCE_R1320__=Object.freeze({revision:REV,on:()=>on,
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},heroes:()=>Object.keys(STANCES),
 // 검사·체험용: 표 값 확인·임시 조정(새로고침하면 원래 값)
 stance:id=>STANCES[id]?JSON.parse(JSON.stringify(STANCES[id])):null,
 tune:(id,which,patch)=>{const st=STANCES[id]?.[which];if(!st||!patch)return false;Object.assign(st,patch);return true;},
 pure:Object.freeze({elbow,basis,mix,weightOf,deflect,follow,cock}),
 inspect:()=>({...stats,on,lastError,active:Object.keys(cur)})});
})();
