// R1347 3D 검사 영웅(슬레이어·환도·EGO) 검술 연속 동작 — 기본 공격마다 다른 칼질이 번갈아 나온다.
//  · 사용자 11-26: "슬레이어랑 환도 그리고 ego각성영웅 공격모션 특히 검술 여러모션으로 / 이영상 모션 분석해서 이검술토대로 적용".
//  · 영상(조선 검법 시연, 실연 약 27초)을 0.2초 간격 낱장으로 나눠 칼끝·손·몸통 자리를 읽고 다섯 동작으로 묶었다.
//    ① 내려베기(3.0~4.2초): 칼을 오른 어깨 뒤로 들어 몸을 오른쪽으로 틀었다가, 왼쪽 앞 아래로 비스듬히 벤다.
//    ② 올려베기(4.2~5.4초): 왼쪽 아래에 칼끝을 둔 낮은 자세에서 오른쪽 위로 쳐 올린다.
//    ③ 찌르기(0~1.2초·14.4~15초): 손을 허리로 당겨 칼날을 수평으로 겨눈 뒤, 몸을 앞으로 실어 팔을 곧게 뻗는다.
//    ④ 횡베기(2.4~3.0초): 칼을 오른쪽 뒤로 젖혔다가 허리 높이에서 왼쪽으로 수평으로 휩쓴다.
//    ⑤ 감아베기(7.0~8.2초): 칼을 머리 위로 감아 돌려(왼 어깨 → 머리 뒤 → 오른 어깨) 오른쪽 앞 아래로 내려벤다.
//  · 사용자 11-26 14:31Z 두 번째 영상(무예도보통지 예도 총도 시연 58초)도 녹여 달라 → 첫 영상에 없는 결 셋을 더했다.
//    ⑥ 정수리 내려치기(2.0·17.1·32.1초): 칼을 머리 위 뒤로 곧게 세웠다가 몸을 틀지 않고 앞 가운데로 내려친다.
//    ⑦ 역횡베기(36.2·52.9초): 칼을 왼쪽 뒤로 젖혔다 손등 쪽으로 오른쪽까지 수평으로 벤다(횡베기의 반대).
//    ⑧ 낮게 찌르기(4.6~5.0·11.7·14.2·37.5초): 칼을 머리 옆 높이로 끌어올렸다가 몸을 깊이 숙이며 낮고 길게 찌른다.
//    이어 치기 순서는 두 영상의 결을 번갈아: 내려베기 → 올려베기 → 찌르기 → 횡베기 → 정수리 내려치기 → 역횡베기 → 낮게 찌르기 → 감아베기.
//  · 3D 영웅의 기본 공격 클립(R1302: 환도 Attack_DiagonalSlash, 슬레이어 Attack_DownCleave, EGO Attack_AwakenedBurst)은 하나뿐이라
//    렌더 직전(scene.onBeforeRender)에 공격 진행도(R1302 와 같은 .5초 규칙)를 읽어, 이번 공격의 동작 표대로
//    몸통 틀기·숙임 → 오른팔 두 뼈 IK(주먹을 손잡이 자리로) → 무기 묶음 방향(+Y = 칼날) → (슬레이어) 왼손 두 손 쥐기 를 얹는다.
//    렌더가 끝나면(onAfterRender) 뼈·무기 값을 되돌린다 — 판정·정령·2D 소환·다른 검사가 보는 값은 그대로다.
//  · 순서: 환도·EGO 는 R1320 자세 보정(칼날 시야 clearView, R1348 팔꿈치 비틀기)보다 먼저, 슬레이어는 R1309 두 손 쥐기 뒤에 돈다.
//  · 연속: 이어 치면(1.6초 안) 위 여덟 동작을 차례로, 끝나면 다시 처음. 쉬거나 영웅이 바뀌면 처음부터.
//  · 손대지 않음: hwando-3d-r1302.js(해시 고정)·R1309·R1313·R1320 파일과 표, 2D 영웅 그림(슬레이어 2D 기본 공격 그림 유지), 판정·피해·사거리.
//  · R1347b(사용자 11-27 "환도영웅검이 공중에뜨는 느낌없게", #1039 R1348 과 함께): 칼날이 카메라 축 가까이 오면 R1320 이 손목(32°)을 꺾은 뒤
//    clearView(34°)가 칼을 다시 돌려 칼날~아래팔 각이 23~27°로 줄었다(팔 끝 막대처럼 칼이 떠 보임). → 환도·EGO 는 칼을 놓은 뒤
//    두 조건(카메라 축과 37°, 아래팔과 35°, 뒤 보정보다 조금 넉넉히)을 함께 만족하는 가장 가까운 방향으로 손잡이 둘레로 돌려 둔다.
//  · 끄기: localStorage storyworld.r1347.combo=off (원래 클립 하나로 돌아감).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SWORD_COMBO_R1347__)return;
const REV='R1347-sword-combo-2',KEY='storyworld.r1347.combo',NAME=/^r1305-([a-z]+)-3d-shared$/,DEG=Math.PI/180,ATK_SEC=.5,GAP=1.6,REACH=.56;
// 좌표: 영웅 모델(+Z 앞, +Y 위, 오른손 −X, 키 약 1.75). at = 오른 어깨 뼈에서 잰 주먹(손잡이) 자리, dir = 칼날 방향(손잡이 → 칼끝),
// twist = 가슴을 위 축으로 튼 각(+ 는 왼쪽으로, 칼을 오른쪽 뒤로 젖힐 때 −), lean = 앞으로 숙인 각, pole = 팔꿈치가 향할 쪽.
const POLE=[-.6,-.5,-.4];
const REST={
 hwando:{at:[.06,-.35,.29],dir:[.22,.78,.60]},// R1320 대기 자세와 같게(섞일 때 튀지 않게)
 ego:{at:[.06,-.35,.29],dir:[.22,.78,.60]},
 slayer:{at:[.12,-.38,.30],dir:[.15,.75,.65]}// 두 손 중단 겨눔
};
const K=(t,at,dir,twist=0,lean=0,pole=POLE)=>({t,at,dir,twist,lean,pole});
const MOVES=[
 {id:'down',name:'내려베기',video:'3.0~4.2초',windup:.20,strike:.50,keys:[
  K(.20,[-.02,.30,-.02],[-.35,.55,-.76],-25,-8,[-.8,.1,-.3]),
  K(.34,[.08,.25,.25],[.05,.90,.43],-5,2,[-.8,-.1,-.2]),
  K(.42,[.16,.08,.40],[.25,.35,.90],5,7),
  K(.50,[.22,-.12,.45],[.40,-.55,.73],15,12),
  K(.68,[.28,-.38,.30],[.55,-.75,.35],22,15)]},
 {id:'rise',name:'올려베기',video:'4.2~5.4초',windup:.28,strike:.50,keys:[
  K(.28,[.25,-.42,.20],[.45,-.80,.40],20,15),
  K(.40,[.10,-.25,.42],[.05,-.20,.98],5,8),
  K(.50,[-.10,.05,.48],[-.40,.60,.69],-10,0,[-.8,-.3,-.2]),
  K(.68,[-.22,.30,.25],[-.45,.85,.25],-25,-5,[-.8,0,-.3])]},
 {id:'thrust',name:'찌르기',video:'0~1.2초·14.4~15초',one:true,windup:.28,strike:.50,keys:[
  K(.28,[-.08,-.25,0],[0,.05,1],-25,0,[-.5,-.7,-.4]),
  K(.50,[.08,-.12,.54],[.02,0,1],15,15,[-.5,-.8,0]),
  K(.70,[.08,-.13,.52],[.02,0,1],15,12,[-.5,-.8,0])]},
 {id:'sweep',name:'횡베기',video:'2.4~3.0초',windup:.26,strike:.52,keys:[
  K(.26,[-.32,-.10,.10],[-.85,.10,-.35],-35,5),
  K(.36,[-.26,-.10,.28],[-.70,.08,.70],-25,6),
  K(.44,[-.15,-.10,.40],[-.25,.05,.97],-15,8),
  K(.52,[.18,-.10,.45],[.70,.05,.71],15,8),
  K(.68,[.35,-.12,.30],[.90,.05,.25],35,6)]},
 {id:'wrap',name:'감아베기',video:'7.0~8.2초',windup:.32,strike:.54,keys:[
  K(.18,[.05,.32,.05],[.70,.35,-.62],15,-5,[-.8,.2,-.1]),
  K(.32,[-.02,.38,-.02],[-.55,.35,-.76],10,-8,[-.8,.2,-.2]),
  K(.40,[-.15,.30,.25],[-.45,.85,.15],-5,0,[-.8,0,-.2]),
  K(.47,[-.20,.12,.40],[-.55,.30,.78],-12,6),
  K(.54,[-.25,-.10,.45],[-.55,-.35,.76],-20,12),
  K(.72,[-.30,-.38,.25],[-.60,-.72,.35],-25,15)]},
 // 영상2(무예도보통지 예도 총도 시연 58초) — 첫 영상에 없는 결: 머리 위로 곧게 세웠다 정수리로 내려치기, 손등 쪽 역횡베기, 몸을 낮춰 길게 찌르기.
 {id:'chop',name:'정수리 내려치기',video:'영상2 2.0·17.1·32.1초',windup:.26,strike:.52,keys:[
  K(.26,[-.05,.40,.02],[-.05,.55,-.83],-5,-10,[-.8,.2,-.2]),
  K(.36,[-.03,.30,.25],[0,.95,.30],-3,-2,[-.8,0,-.2]),
  K(.44,[0,.08,.45],[0,.20,.98],0,10),
  K(.52,[0,-.20,.48],[0,-.50,.87],0,18,[-.6,-.6,0]),
  K(.70,[0,-.35,.38],[0,-.75,.66],0,20,[-.6,-.6,0])]},
 {id:'backsweep',name:'역횡베기',video:'영상2 36.2·52.9초',windup:.26,strike:.52,keys:[
  K(.26,[.30,-.15,.20],[.85,.05,-.40],35,5,[-.4,-.8,.3]),
  K(.36,[.20,-.15,.38],[.65,0,.75],20,6,[-.5,-.8,.2]),
  K(.44,[0,-.15,.48],[-.15,0,.99],0,8),
  K(.52,[-.22,-.15,.42],[-.70,0,.71],-15,8),
  K(.68,[-.35,-.17,.28],[-.92,0,.35],-35,6)]},
 {id:'lunge',name:'낮게 찌르기',video:'영상2 4.6~5.0·11.7·14.2·37.5초',one:true,windup:.30,strike:.52,keys:[
  K(.16,[-.20,.10,-.05],[-.30,.85,-.42],-20,-5,[-.8,.1,-.3]),
  K(.30,[-.12,.28,-.10],[.05,.35,.94],-30,-6,[-.8,.2,-.3]),
  K(.52,[.05,-.36,.44],[.03,-.24,.97],20,30,[-.5,-.8,0]),
  K(.74,[.05,-.37,.42],[.03,-.24,.97],20,28,[-.5,-.8,0])]}
];
// 이어 치기 순서: 두 영상의 결을 번갈아(크게 베기 ↔ 찌르기 ↔ 수평)
const ORDER=['down','rise','thrust','sweep','chop','backsweep','lunge','wrap'];
MOVES.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));
const HEROES={hwando:{phase:'pre',weapon:'r1313-hwando-weapon',two:false,view:0},ego:{phase:'pre',weapon:'r1313-ego-weapon',two:false,view:0},
 slayer:{phase:'post',weapon:'r1309-slayer-greatsword',two:true,view:34}};
const stats={revision:REV,hooks:0,builds:0,frames:0,posed:0,starts:0,errors:0,last:{}};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}

// ── 순수 계산(검사용으로 내놓음) ──
const num=(v,d)=>Number.isFinite(+v)?+v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const len=a=>Math.hypot(a[0],a[1],a[2]),unit=(a,fb=[0,1,0])=>{const l=len(a);return l>1e-9&&isFinite(l)?[a[0]/l,a[1]/l,a[2]/l]:fb.slice();};
const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
const cr=(p0,p1,p2,p3,u)=>{const u2=u*u,u3=u2*u;return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u2+(-p0+3*p1-3*p2+p3)*u3);};
const crv=(a,b,c,d,u)=>a.map((_,i)=>cr(a[i],b[i],c[i],d[i],u));
// 동작 m 의 t(0~1, 공격 .5초 진행도) 표본. 처음·끝은 그 영웅 대기 자세, env 는 클립과 섞는 정도(0 → 원래 클립).
function sample(hero,m,t){
 const rest=REST[hero];if(!rest)return null;const mv=MOVES[Number.isInteger(m)&&m>=0&&m<MOVES.length?m:0];t=clamp(num(t,0),0,1);
 const R=K(0,rest.at,rest.dir,0,0),E=K(1,rest.at,rest.dir,0,0),ks=[R,...mv.keys,E];
 let i=0;while(i<ks.length-2&&t>ks[i+1].t)i++;const a=ks[Math.max(0,i-1)],b=ks[i],c=ks[i+1],d=ks[Math.min(ks.length-1,i+2)],u=clamp((t-b.t)/Math.max(1e-6,c.t-b.t),0,1);
 let at=crv(a.at,b.at,c.at,d.at,u);const l=len(at);if(l>REACH)at=at.map(x=>x*REACH/l);
 const dir=unit(crv(unit(a.dir),unit(b.dir),unit(c.dir),unit(d.dir),u),unit(b.dir));
 const lin=(x,y)=>x+(y-x)*u,pole=unit(b.pole.map((x,j)=>lin(x,c.pole[j])),POLE);
 return {move:mv.id,one:!!mv.one,at,dir,twist:cr(a.twist,b.twist,c.twist,d.twist,u),lean:cr(a.lean,b.lean,c.lean,d.lean,u),pole,env:smooth(0,.1,t)*(1-smooth(.9,1,t))};
}
// 이번 공격의 동작 번호: 이어 치면(GAP 초 안) 다음, 아니면 처음부터.
function nextMove(prev,now,hero){const go=!!prev&&prev.hero===hero&&Number.isFinite(now)&&Number.isFinite(prev.at)&&now-prev.at>=0&&now-prev.at<=GAP;
 return {hero,at:Number.isFinite(now)?now:(prev?.at??0),idx:go?(prev.idx+1)%MOVES.length:0};}
// 공격 진행도 읽기: hwando-3d-r1302.js action() 과 같은 규칙(그 파일은 해시 고정이라 값을 내놓지 않음).
function tracker(){let atkT=-1,lastAtk=0,last=NaN;
 return {feed(now,a,moving){a=num(a,0);now=num(now,Number.isFinite(last)?last:0);const dt=Number.isFinite(last)?clamp(now-last,0,.1):0;last=now;let start=false;
  if(a>lastAtk+1e-4&&(atkT<0||atkT>ATK_SEC*.7)){atkT=0;start=true;}lastAtk=a;if(a>0&&atkT<0){atkT=0;start=true;}
  let active=false,t=0;if(atkT>=0&&atkT<ATK_SEC&&!(moving&&a<=0)){active=true;t=atkT/ATK_SEC;atkT+=dt;}else{atkT=-1;start=false;}
  return {active,start,t};}};}

// ── 장면 ──
let T=null,hookedScene=null,scan=0,forced=null;const cur={},combo={},track={};
// 엔진 전역(player·time)은 let 선언이라 window 에 없다 → typeof 로 읽는다.
const hero=()=>typeof player!=='undefined'?player:window.player;
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};
// 주먹 = 아래팔 뼈에 붙은 꼭짓점 가운데 손끝 쪽 7cm 의 무게중심(R1320 과 같은 계산, 아래팔 뼈 좌표).
function fist(body,fore){
 const sk=body.skeleton,fb=sk.bones.indexOf(fore);if(fb<0)return null;const kids=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0);
 const G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight;if(!P||!SI||!SW)return null;
 const M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
 for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||kids.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;v.fromBufferAttribute(P,i).applyMatrix4(M);pts.push(v.x,v.y,v.z);}
 if(pts.length<9)return null;const ys=[];for(let i=1;i<pts.length;i+=3)ys.push(pts[i]);ys.sort((a,b)=>a-b);const top=ys[Math.floor(ys.length*.98)];
 const c=new T.Vector3();let n=0;for(let i=0;i<pts.length;i+=3)if(pts[i+1]>=top-.07&&pts[i+1]<=top+.02){c.x+=pts[i];c.y+=pts[i+1];c.z+=pts[i+2];n++;}
 return n?c.multiplyScalar(1/n):null;
}
function bindQuat(body,bone){const sk=body.skeleton,i=sk.bones.indexOf(bone),pi=sk.bones.indexOf(bone.parent);if(i<0||pi<0)return bone.quaternion.clone();
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().multiplyMatrices(sk.boneInverses[pi],new T.Matrix4().copy(sk.boneInverses[i]).invert()));}
function build(id,group){
 const cfg=HEROES[id],model=group.getObjectByName('r1305-'+id+'-3d-model');if(!model)return null;const mount=group.getObjectByName(cfg.weapon);if(!mount?.parent)return null;
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink&&!/^r13/.test(o.name||''))body=o;});if(!body)return null;
 const bone=n=>model.getObjectByName(n),A=bone('Arm_R'),B=bone('Forearm_R'),C=B?.children.find(c=>/^Weapon_Socket/.test(c.name||''));if(!A?.isBone||!B?.isBone||!C)return null;
 const palm=fist(body,B);if(!palm)return null;
 const s={id,cfg,group,model,mount,body,R:{A,B,C,palm,bindA:bindQuat(body,A),bindB:bindQuat(body,B)},chest:bone('Spine_Chest'),head:bone('Head')||bone('Head_Hood'),applied:false};
 if(cfg.two){const LA=bone('Arm_L'),LB=bone('Forearm_L'),LC=LB?.children.find(c=>/^Weapon_Socket/.test(c.name||''));if(LA?.isBone&&LB?.isBone&&LC){const p=fist(body,LB);if(p)s.L={A:LA,B:LB,C:LC,palm:p,bindA:bindQuat(body,LA),bindB:bindQuat(body,LB)};}}
 s.bones=[s.chest,s.head,A,B,s.L?.A,s.L?.B].filter(Boolean);s.saved=s.bones.map(()=>new T.Quaternion());s.mq=new T.Quaternion();s.mp=new T.Vector3();
 stats.builds++;return s;
}
function find(scene){
 for(const id of Object.keys(cur)){const s=cur[id];if(s.group.parent!==scene||!s.mount.parent||!s.model.parent||s.group.getObjectByName(s.cfg.weapon)!==s.mount){restore(s);delete cur[id];}}
 if(scan-->0)return;scan=20;
 for(const c of scene.children){const m=NAME.exec(c.name||''),id=m&&m[1];if(!id||!HEROES[id]||cur[id]?.group===c||!c.visible)continue;const s=build(id,c);if(s)cur[id]=s;else scan=2;}
}
const _v=[],_q=[];const V=i=>_v[i]||(_v[i]=new T.Vector3()),Q=i=>_q[i]||(_q[i]=new T.Quaternion());
function turn(bone,q){bone.parent.getWorldQuaternion(Q(10));bone.getWorldQuaternion(Q(11));bone.quaternion.copy(Q(10).invert().multiply(q).multiply(Q(11)));bone.updateMatrixWorld(true);}
function aim(bone,from,to){if(!(from.lengthSq()>1e-12&&to.lengthSq()>1e-12))return;turn(bone,Q(12).setFromUnitVectors(V(20).copy(from).normalize(),V(21).copy(to).normalize()));}
// 두 뼈 IK(팔꿈치 자리 계산): R1320 elbow 와 같은 풀이.
function elbowAt(a,t,l1,l2,pole){
 const d=t.clone().sub(a),raw=d.length(),dn=raw>1e-9?d.clone().multiplyScalar(1/raw):new T.Vector3(0,-1,0),D=Math.max(Math.abs(l1-l2)+1e-5,Math.min(raw,(l1+l2)*.999));
 let p=pole.clone().addScaledVector(dn,-pole.dot(dn));if(p.lengthSq()<1e-12){p=new T.Vector3(1,0,0).cross(dn);if(p.lengthSq()<1e-12)p=new T.Vector3(0,0,1).cross(dn);}p.normalize();
 const c=clamp((l1*l1+D*D-l2*l2)/(2*l1*D),-1,1),s=Math.sqrt(1-c*c);return a.clone().addScaledVector(dn,l1*c).addScaledVector(p,l1*s);}
// 주먹(아래팔 뼈 좌표 palm)이 target(세계)에 오게. 주먹이 뼈 축에서 벗어나 있어 몇 번 되풀이한다.
function reachArm(arm,target,poleW){
 const {A,B,C,palm}=arm;A.quaternion.copy(arm.bindA);B.quaternion.copy(arm.bindB);A.updateMatrixWorld(true);
 const a=A.getWorldPosition(new T.Vector3()),t=target.clone();
 for(let it=0;it<4;it++){
  const b=B.getWorldPosition(V(1)),c=C.getWorldPosition(V(2)),pw=B.localToWorld(V(3).copy(palm));if(it>0&&pw.distanceTo(target)<.004)break;
  if(it===0)t.copy(target).sub(pw).add(c);else t.add(V(4).copy(target).sub(pw));
  const l1=a.distanceTo(b),l2=b.distanceTo(c),e=elbowAt(a,t,l1,l2,poleW);
  aim(A,V(5).copy(b).sub(a),V(6).copy(e).sub(a));B.getWorldPosition(b);C.getWorldPosition(c);aim(B,V(5).copy(c).sub(b),V(6).copy(t).sub(b));
 }
 return B.localToWorld(V(3).copy(arm.palm)).distanceTo(target);
}
// 칼끝 노드(BladeTip, 없으면 null) — 한 번만 찾는다.
function tipNode(s){if(s.tipN!==undefined)return s.tipN;let t=null;s.mount.traverse(o=>{if(!t&&/^BladeTip/.test(o.name||''))t=o;});return s.tipN=t;}
function restore(s){if(!s.applied)return;s.bones.forEach((b,i)=>b.quaternion.copy(s.saved[i]));s.mount.quaternion.copy(s.mq);s.mount.position.copy(s.mp);
 (s.chest||s.R.A).updateMatrixWorld(true);s.R.A.updateMatrixWorld(true);s.L?.A.updateMatrixWorld(true);s.applied=false;}
// 칼날이 카메라 축과 거의 나란하면 화면에서 점이 된다 → min 도 넘게 벌린다(손잡이 둘레로 돌림). 환도·EGO 는 R1320 clearView 가 맡는다.
function clearView(s,grip){const deg=num(s.cfg.view,0),cam=host()?.camera;if(!(deg>0)||!cam)return;
 const c=cam.getWorldDirection(V(30)).normalize(),d=V(31).set(0,1,0).applyQuaternion(s.mount.getWorldQuaternion(Q(20))).normalize();let k=d.dot(c);const sg=k<0?-1:1;k=Math.min(1,Math.abs(k));
 if(Math.acos(k)>=deg*DEG)return;let p=V(32).copy(d).addScaledVector(c,-d.dot(c));if(p.lengthSq()<1e-10)p.set(0,1,0).cross(c);p.normalize();
 const to=V(33).copy(c).multiplyScalar(sg*Math.cos(deg*DEG)).addScaledVector(p,Math.sin(deg*DEG)).normalize();setMount(s,Q(21).setFromUnitVectors(d,to).multiply(Q(20)),grip);}
// 무기 묶음 세계 회전 wq, 손잡이(묶음 좌표 s.grip)를 세계 grip 자리에.
// R1347b: 칼날(손잡이→칼끝)을 카메라 축(양쪽)과 CAM_MIN°, 아래팔(팔꿈치→주먹)과 ARM_MIN° 넘게 벌린다(가장 적게 돌려). 돌린 각(도)을 돌려준다.
const CAM_MIN=37,ARM_MIN=35;
function spread(s,grip){const cam=host()?.camera,tn=tipNode(s);if(!cam||!tn)return 0;
 const c=cam.getWorldDirection(new T.Vector3()).normalize(),ax=s.R.palm.clone().normalize().applyQuaternion(s.R.B.getWorldQuaternion(new T.Quaternion())).normalize();
 const D0=tn.getWorldPosition(new T.Vector3()).sub(grip);if(!(D0.lengthSq()>1e-12))return 0;D0.normalize();const D=D0.clone();
 const away=(A,deg)=>{const cs=clamp(D.dot(A),-1,1);if(Math.acos(cs)>=deg*DEG-1e-6)return false;const p=D.clone().addScaledVector(A,-cs);
  if(p.lengthSq()<1e-10){p.set(0,1,0).addScaledVector(A,-A.y);if(p.lengthSq()<1e-10)p.set(1,0,0).addScaledVector(A,-A.x);}p.normalize();
  D.copy(A).multiplyScalar(Math.cos(deg*DEG)).addScaledVector(p,Math.sin(deg*DEG)).normalize();return true;};
 for(let i=0;i<10;i++){const cc=D.dot(c)>=0?c:c.clone().negate();const a=away(cc,CAM_MIN),b=away(ax,ARM_MIN);if(!a&&!b)break;}
 const t=D0.angleTo(D);if(!(t>1e-5))return 0;
 setMount(s,new T.Quaternion().setFromUnitVectors(D0,D).multiply(s.mount.getWorldQuaternion(new T.Quaternion())),grip);stats.spread=(stats.spread|0)+1;return t/DEG;}
function setMount(s,wq,grip){const m=s.mount,par=m.parent;par.getWorldQuaternion(Q(22));m.quaternion.copy(Q(22).invert().multiply(wq));m.updateMatrixWorld(true);
 const off=m.localToWorld(V(34).copy(s.gripLocal)).sub(m.getWorldPosition(V(35)));m.position.copy(par.worldToLocal(V(36).copy(grip).sub(off)));m.updateMatrixWorld(true);}
function pose(s,api,info,now){
 const tr=track[s.id]||(track[s.id]=tracker());const pl=hero();const r=tr.feed(now,+pl?.attackAnim||0,!!pl?.moving);
 if(r.start){combo[s.id]=nextMove(combo[s.id],now,s.id);stats.starts++;}
 const w8=info.weights||{},tot=num(w8.idle,0)+num(w8.walk,0)+num(w8.attack,0),wa=tot>1e-6?num(w8.attack,0)/tot:0;
 if(forced){r.active=true;r.t=forced.t;}
 if(!r.active||!(wa>1e-3)){stats.last[s.id]={w:0,move:null};return;}
 const idx=forced?forced.idx:combo[s.id]?.idx??0,sp=sample(s.id,idx,r.t);const w=clamp(wa*sp.env,0,1);if(!(w>1e-3)){stats.last[s.id]={w:0,move:sp.move,t:+r.t.toFixed(3)};return;}
 s.bones.forEach((b,i)=>s.saved[i].copy(b.quaternion));s.mq.copy(s.mount.quaternion);s.mp.copy(s.mount.position);s.applied=true;
 const model=s.model,mq=model.getWorldQuaternion(new T.Quaternion()),dirW=v=>new T.Vector3().fromArray(v).applyQuaternion(mq),scale=model.getWorldScale(new T.Vector3()).x;
 // 손잡이 자리(무기 묶음 좌표): 환도·EGO 는 R1320 처럼 묶음 원점이 손잡이, 슬레이어는 R1309 가 둔 지금 주먹 자리.
 s.gripLocal=s.cfg.two?s.mount.worldToLocal(s.R.B.localToWorld(s.R.palm.clone())):new T.Vector3();
 const wq0=s.mount.getWorldQuaternion(new T.Quaternion());
 // ① 몸통: 틀기(위 축)·숙이기(오른쪽 축), 머리는 틀기 반만 되돌려 앞을 본다
 if(s.chest){turn(s.chest,new T.Quaternion().setFromAxisAngle(dirW([0,1,0]).normalize(),sp.twist*DEG*w));turn(s.chest,new T.Quaternion().setFromAxisAngle(dirW([1,0,0]).normalize(),sp.lean*DEG*w));
  if(s.head)turn(s.head,new T.Quaternion().setFromAxisAngle(dirW([0,1,0]).normalize(),-sp.twist*.5*DEG*w));}
 // ② 오른팔: 주먹을 손잡이 자리로(어깨 + at)
 const R=s.R,qa=R.A.quaternion.clone(),qb=R.B.quaternion.clone(),target=R.A.getWorldPosition(new T.Vector3()).add(dirW(sp.at).multiplyScalar(scale));
 const err=reachArm(R,target,dirW(sp.pole));if(w<.999){R.A.quaternion.copy(qa.slerp(R.A.quaternion,w));R.B.quaternion.copy(qb.slerp(R.B.quaternion,w));R.A.updateMatrixWorld(true);}
 // ③ 무기: 칼날(+Y)을 표 방향으로(지금 묶음 회전에서 가장 적게 돌려 칼등·날 방향을 지킴), 손잡이는 주먹에
 const grip=R.B.localToWorld(R.palm.clone()),y0=new T.Vector3(0,1,0).applyQuaternion(wq0);
 // 칼끝이 땅(모델 발바닥 + 6cm)을 뚫지 않게: 칼 길이(실측)로 칼끝 높이를 재고 모자라면 칼날을 들어 올린다(슬레이어 대검은 표보다 훨씬 길다).
 const yt=dirW(sp.dir).normalize(),wq=new T.Quaternion().setFromUnitVectors(y0,yt).multiply(wq0);
 setMount(s,wq0.clone().slerp(wq,w),grip);clearView(s,grip);if(!s.cfg.two)spread(s,grip);
 // 칼끝이 땅(발바닥 + 6cm)을 뚫지 않게: 실제 칼끝 높이를 재고 모자라면 손잡이 둘레로 칼끝을 들어 올린다(슬레이어 대검은 표 기준보다 훨씬 길다).
 const tn=tipNode(s);if(tn)for(let it=0;it<3;it++){const tw=tn.getWorldPosition(new T.Vector3()),tl=model.worldToLocal(tw.clone());if(tl.y>=.06)break;
  const gl=model.worldToLocal(grip.clone()),v=tl.clone().sub(gl),L=v.length();if(!(L>1e-4))break;const want=Math.max(-1,Math.min(1,(.065-gl.y)/L)),cur=v.y/L;
  const axis=new T.Vector3(v.z,0,-v.x);if(axis.lengthSq()<1e-10)break;axis.normalize().applyQuaternion(mq);const ang=Math.asin(want)-Math.asin(Math.max(-1,Math.min(1,cur)));
  // 축 방향 부호: 칼끝이 위로 가게(작은 시험 회전으로 확인)
  const q1=new T.Quaternion().setFromAxisAngle(axis,ang),dW=tw.clone().sub(grip),up=dirW([0,1,0]);const sg=dW.clone().applyQuaternion(q1).dot(up)>=dW.dot(up)?1:-1;
  setMount(s,new T.Quaternion().setFromAxisAngle(axis,ang*sg).multiply(s.mount.getWorldQuaternion(new T.Quaternion())),grip);stats.groundLift=(stats.groundLift|0)+1;}
 if(!s.cfg.two)spread(s,grip);// 칼끝을 들어 올렸으면 두 조건을 다시 맞춘다(이미 맞으면 그대로)
 // ④ 슬레이어 왼손: 오른손 아래(칼자루 끝 쪽) 한 주먹
 // ④ 슬레이어 왼손: 두 손 동작은 칼자루 축 위 오른손 아래(칼자루 끝 쪽) 한 주먹, 한 손 찌르기(영상: 빈손을 뒤로 뻗어 균형)는 왼쪽 엉덩이 뒤로.
 let errL=null;if(s.L){const L=s.L,la=L.A.quaternion.clone(),lb=L.B.quaternion.clone();
  const bw=new T.Vector3(0,1,0).applyQuaternion(s.mount.getWorldQuaternion(new T.Quaternion())).normalize();
  const tgt=sp.one?L.A.getWorldPosition(new T.Vector3()).add(dirW([.16,-.42,-.18]).multiplyScalar(scale)):R.B.localToWorld(R.palm.clone()).addScaledVector(bw,-.1*scale);
  errL=reachArm(L,tgt,dirW(sp.one?[.8,-.3,.2]:[.6,-.5,-.4]));if(w<.999){L.A.quaternion.copy(la.slerp(L.A.quaternion,w));L.B.quaternion.copy(lb.slerp(L.B.quaternion,w));L.A.updateMatrixWorld(true);}}
 stats.posed++;stats.last[s.id]={move:sp.move,idx,t:+r.t.toFixed(3),w:+w.toFixed(3),err:+(err/scale).toFixed(4),errL:errL==null?null:+(errL/scale).toFixed(4)};
}
function run(scene,phase){
 if(!on){for(const id in cur)restore(cur[id]);return;}
 const api=window.__STORYWORLD_HWANDO3D_R1302__;if(!api?.inspect)return;if(phase==='pre')find(scene);
 let info=null;const now=typeof time==='number'?time:(typeof window.time==='number'?window.time:performance.now()/1000);
 for(const id in cur){const s=cur[id];if(s.cfg.phase!==phase||!s.group.visible||s.applied)continue;try{info=info||api.inspect();pose(s,api,info,now);stats.frames++;}catch(e){restore(s);fail(e);}}
}
function after(){for(const id in cur)try{restore(cur[id]);}catch(e){fail(e);}}
// 훅: R1309·R1313·R1320 이 이 장면에 먼저 붙은 뒤 바깥에서 감싼다 → 환도·EGO 는 그 보정들보다 먼저(pre), 슬레이어는 R1309 두 손 쥐기 뒤(post).
function ready(){for(const k of ['__STORYWORLD_SLAYER_BLADE_R1309__','__STORYWORLD_HERO_STANCE_R1320__']){const g=window[k];if(g?.inspect&&!(num(g.inspect().hooks,0)>stats.hooks))return false;}return true;}
function hook(){
 const r=host();if(!r||r.scene===hookedScene||!ready())return;T=r.T;const scene=r.scene,pb=scene.onBeforeRender,pa=scene.onAfterRender;
 scene.onBeforeRender=function(...a){try{run(scene,'pre');}catch(e){fail(e);}try{pb?.apply(this,a);}finally{try{run(scene,'post');}catch(e){fail(e);}}};
 scene.onAfterRender=function(...a){try{pa?.apply(this,a);}finally{after();}};
 hookedScene=scene;stats.hooks++;
}
setInterval(()=>{try{hook();}catch(e){fail(e);}},400);
window.__STORYWORLD_SWORD_COMBO_R1347__=Object.freeze({revision:REV,on:()=>on,
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}if(!on)after();return on;},heroes:()=>Object.keys(HEROES),
 moves:()=>MOVES.map(m=>({id:m.id,name:m.name,video:m.video})),current:id=>combo[id]?{...combo[id],move:MOVES[combo[id].idx].id}:null,
 // 검사·GIF 용: 공격 중일 때 동작 번호·진행도를 고정(null 이면 원래대로). 새로고침하면 사라진다.
 preview:(idx,t)=>{forced=idx==null?null:{idx:clamp(Math.trunc(num(idx,0)),0,MOVES.length-1),t:clamp(num(t,0),0,1)};return forced;},
 pure:Object.freeze({MOVES,sample,nextMove,tracker,rest:id=>REST[id]?JSON.parse(JSON.stringify(REST[id])):null}),
 inspect:()=>({...stats,on,lastError,active:Object.keys(cur)})});
})();
