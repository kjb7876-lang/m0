// R1309 3D 슬레이어 대검(Armory R2) + 두 손 쥐기.
//  · 사용자 11-25: 체험판(무기 체험실)에서 직접 맞춘 값(크기 118%·날 방향 -18°·쥔 위치 +14·손 안쪽 보정)으로
//    게임의 3D 슬레이어(R1305 GLB + R1306 두 손 내려베기)에 드라이브 Armory R2 대검을 쥐여 준다.
//  · hwando-3d-r1302.js 는 건드리지 않는다. 그 파일이 장면에 붙이는 'r1305-slayer-3d-shared' 묶음을 찾아
//    무기 부모 노드에 대검을 달고, 원래 손에 든 무기(이미 숨김)·2D 소환·판정·정령은 그대로 둔다.
//  · 왼손: 렌더 직전(scene.onBeforeRender: 행렬 갱신 뒤·스킨 본 갱신 전)에 왼팔 두 뼈 IK 로 칼자루 아래쪽을 잡는다.
//    공격 모션에서 두 손이 가까울 때만 거리로 부드럽게 섞어 켜고(대기·걷기의 늘어뜨린 왼손은 원래 모션 그대로) 매 프레임 애니메이션 값에서 다시 푼다.
//  · 기본 꺼진 3D 설정을 켰을 때만, 슬레이어 3D 가 처음 보일 때 GLB(약 0.57MB)를 한 번 읽는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SLAYER_BLADE_R1309__)return;
const REV='R1309-slayer-blade',GLB='assets/r1309/slayer-greatsword.glb',GROUP='r1305-slayer-3d-shared',MODEL='r1305-slayer-3d-model',LAYER=2;
// 체험판 슬레이어 값. off = 칼 넓이·두께·길이 방향 보정(칼 길이 비율), 주먹 정점 실측으로 손 안쪽에 오게 맞춘 값.
const FIT=Object.freeze({size:1.18,roll:-18*Math.PI/180,slide:.14,off:[-.03,.03,0],leftGrip:.62});
// 왼손 IK 를 섞는 거리(칼 길이 비율): 이보다 가까우면 완전히, 멀면 원래 모션.
const IK_FULL=.16,IK_NONE=.42;
const stats={revision:REV,hooks:0,builds:0,frames:0,ikFrames:0,lastIkWeight:0,lastIkError:null,loadMs:null,bytes:0,errors:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let T=null,hookedScene=null,template=null,loading=null,failed=false,cur=null,scanWait=0;
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};

function load(){
 if(template||loading||failed)return;const t0=performance.now();
 const bytes=fetch(GLB,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();});
 loading=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),bytes]).then(async([{GLTFLoader},data])=>{
  stats.bytes=data.byteLength;const gltf=await new GLTFLoader().parseAsync(data,new URL('.',new URL(GLB,document.baseURI)).href);
  template=gltf.scene;stats.loadMs=Math.round(performance.now()-t0);
 }).catch(e=>{failed=true;fail(e);}).finally(()=>{loading=null;});
}

// 게임 3D 몸과 같은 한지 톤(R1304)·무기 금속감(R1305).
function tone(src){const m=src.clone();m.side=T.DoubleSide;m.transparent=false;m.depthTest=true;m.depthWrite=true;m.forceSinglePass=true;
 const glow=!!m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity??1)>.05;
 if('metalness'in m)m.metalness=.65;if('roughness'in m)m.roughness=.25;if(!glow&&m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const key=m.customProgramCacheKey;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1304Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1304Luma),gl_FragColor.rgb,.62)*1.12-.5)*1.04+.5,0.0,1.0);`);};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1304-hanji-tone-v1';};m.needsUpdate=true;return m;}

// 원래 칼의 축(무기 부모 좌표: 손잡이 끝→칼끝, 넓이 방향, 손 위치)을 메시 꼭짓점에서 읽는다(체험판 buildRig 와 같은 계산).
function axisOf(model){
 const held=[];model.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)held.push(o);});if(!held.length)return null;
 const par=held[0].parent;model.updateMatrixWorld(true);const inv=new T.Matrix4().copy(par.matrixWorld).invert(),pts=[];
 for(const o of held){if(o.parent!==par&&!par.children.includes(o.parent))continue;const rel=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld),p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)pts.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(rel));}
 if(pts.length<4)return null;
 const cen=pts.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/pts.length);
 let pA=pts[0];for(const p of pts)if(p.distanceTo(cen)>pA.distanceTo(cen))pA=p;let pB=pts[0];for(const p of pts)if(p.distanceTo(pA)>pB.distanceTo(pA))pB=p;
 let sock=null;for(let n=par;n;n=n.parent)if(/^Weapon_Socket/.test(n.name||'')){sock=n;break;}
 const hand=new T.Vector3();if(sock){sock.getWorldPosition(hand);hand.applyMatrix4(inv);}
 const butt=pA.distanceTo(hand)<pB.distanceTo(hand)?pA:pB,tip=butt===pA?pB:pA,dir=tip.clone().sub(butt).normalize();
 const along=T.MathUtils.clamp(hand.clone().sub(butt).dot(dir),0,butt.distanceTo(tip)*.5),grip=butt.clone().addScaledVector(dir,along);
 const wv=new T.Vector3();let wd=0;for(const p of pts){const r=p.clone().sub(grip);const perp=r.sub(dir.clone().multiplyScalar(r.dot(dir)));const l=perp.length();if(l>wd&&p.distanceTo(grip)>butt.distanceTo(tip)*.4){wd=l;wv.copy(perp).normalize();}}
 if(wd===0)wv.set(1,0,0).sub(dir.clone().multiplyScalar(dir.x)).normalize();
 return {par,grip,dir,wv,bladeLen:tip.distanceTo(grip)};
}

function build(group){
 const model=group.getObjectByName(MODEL);if(!model)return null;const ax=axisOf(model);if(!ax)return null;
 const wroot=template.clone(true);let tipLen=1;wroot.traverse(o=>{if(/^BladeTip/.test(o.name||''))tipLen=o.position.length()||1;});
 const mats=[];wroot.traverse(o=>{o.layers?.set(LAYER);if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(x=>{const m=tone(x);mats.push(m);return m;}):(mats.push(o.material=tone(o.material)),o.material);}});
 const box=new T.Box3().setFromObject(wroot);
 const mount=new T.Group(),roll=new T.Group();mount.name='r1309-slayer-greatsword';mount.add(roll);roll.add(wroot);mount.layers.set(LAYER);roll.layers.set(LAYER);
 const X=ax.wv.clone().sub(ax.dir.clone().multiplyScalar(ax.wv.dot(ax.dir))).normalize(),Y=ax.dir.clone(),Z=new T.Vector3().crossVectors(X,Y).normalize();
 mount.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X,Y,Z));
 mount.position.copy(ax.grip).addScaledVector(Y,FIT.slide*ax.bladeLen).addScaledVector(X,FIT.off[0]*ax.bladeLen).addScaledVector(Z,FIT.off[1]*ax.bladeLen).addScaledVector(Y,FIT.off[2]*ax.bladeLen);
 mount.scale.setScalar(ax.bladeLen/tipLen*FIT.size);roll.rotation.y=FIT.roll;ax.par.add(mount);
 const bone=n=>model.getObjectByName(n);
 const ik={a:bone('Arm_L'),b:bone('Forearm_L'),c:bone('Weapon_Socket_L')};
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink)body=o;});
 stats.builds++;
 return {group,model,mount,wroot,mats,body,ik:ik.a&&ik.b&&ik.c?ik:null,tipLen,rightHand:bone('Weapon_Socket_R'),gripLo:box.min.y*.82,gripHi:Math.min(.06*tipLen,box.max.y),fist:.075*tipLen,leftY:box.min.y*FIT.leftGrip,saved:[new T.Quaternion(),new T.Quaternion()]};
}

// 두 뼈 IK(체험판과 같은 풀이): 위팔을 팔꿈치 자리로, 아래팔을 목표로 돌린다.
const V=()=>new T.Vector3(),Q=()=>new T.Quaternion();let _a,_b,_c,_e,_t,_d,_p,_q,_pq,_bq,_v1,_v2;
function tmp(){if(_a)return;_a=V();_b=V();_c=V();_e=V();_t=V();_d=V();_p=V();_v1=V();_v2=V();_q=Q();_pq=Q();_bq=Q();}
function aim(bone,from,to){_v1.copy(from).normalize();_v2.copy(to).normalize();if(!(_v1.lengthSq()>1e-12&&_v2.lengthSq()>1e-12))return;
 _q.setFromUnitVectors(_v1,_v2);bone.parent.getWorldQuaternion(_pq);bone.getWorldQuaternion(_bq);bone.quaternion.copy(_pq.invert().multiply(_q).multiply(_bq));bone.updateMatrixWorld(true);}
function solve(A,B,C,t){A.getWorldPosition(_a);B.getWorldPosition(_b);C.getWorldPosition(_c);
 const l1=_a.distanceTo(_b),l2=_b.distanceTo(_c);_d.copy(t).sub(_a);const D=Math.max(1e-4,Math.min(_d.length(),(l1+l2)*.999));_d.normalize();
 _p.copy(_b).sub(_a);_p.addScaledVector(_d,-_p.dot(_d));if(_p.lengthSq()<1e-10)_p.set(0,-1,0);_p.normalize();
 const al=Math.acos(Math.max(-1,Math.min(1,(l1*l1+D*D-l2*l2)/(2*l1*D))));
 _e.copy(_a).addScaledVector(_d,l1*Math.cos(al)).addScaledVector(_p,l1*Math.sin(al));
 aim(A,_v1.copy(_b).sub(_a).clone(),_e.clone().sub(_a));B.getWorldPosition(_b);C.getWorldPosition(_c);aim(B,_c.clone().sub(_b),t.clone().sub(_b));
 C.getWorldPosition(_c);return _c.distanceTo(t);}

function twoHands(s){
 const k=s.ik;if(!k)return;tmp();
 s.wroot.updateMatrixWorld(true);k.c.getWorldPosition(_c);
 // 왼손이 잡을 자리: 칼자루 축 위에서 지금 왼손에 가장 가까운 점(손잡이 범위 안, 오른손과 한 주먹 이상 떨어지게).
 s.wroot.worldToLocal(_t.copy(_c));if(s.rightHand){s.rightHand.getWorldPosition(_p);s.wroot.worldToLocal(_p);}
 let y=Math.max(s.gripLo,Math.min(s.gripHi,_t.y));if(s.rightHand&&Math.abs(y-_p.y)<s.fist){y=_t.y>=_p.y?_p.y+s.fist:_p.y-s.fist;if(y<s.gripLo||y>s.gripHi)y=_t.y>=_p.y?_p.y-s.fist:_p.y+s.fist;}
 s.wroot.localToWorld(_t.set(0,y,0));
 // 거리 기준: 칼 길이(월드). 공격에서 두 손이 모일 때만 켠다.
 s.wroot.localToWorld(_e.set(0,0,0));s.wroot.localToWorld(_v2.set(0,s.tipLen,0));const L=Math.max(1e-6,_v2.distanceTo(_e));
 const d=_c.distanceTo(_t)/L,w=Math.max(0,Math.min(1,(IK_NONE-d)/(IK_NONE-IK_FULL))),ws=w*w*(3-2*w);stats.lastIkWeight=+ws.toFixed(3);
 if(ws<=0)return;
 s.saved[0].copy(k.a.quaternion);s.saved[1].copy(k.b.quaternion);
 k.a.getWorldPosition(_a);k.b.getWorldPosition(_b);const reach=(_a.distanceTo(_b)+_b.distanceTo(_c))/Math.max(1e-6,_a.distanceTo(_t));const err=solve(k.a,k.b,k.c,_t.clone());stats.lastReach=+reach.toFixed(3);stats.lastPre=+d.toFixed(4);
 if(ws<1){k.a.quaternion.slerpQuaternions(s.saved[0],k.a.quaternion.clone(),ws);k.b.quaternion.slerpQuaternions(s.saved[1],k.b.quaternion.clone(),ws);k.a.updateMatrixWorld(true);}
 stats.ikFrames++;stats.lastIkError=+(err/L).toFixed(4);// 칼 길이 비율
}

function find(scene){
 if(cur&&cur.group.parent===scene)return cur;
 if(cur){cur.mount.removeFromParent();cur=null;}
 if(scanWait-->0)return null;scanWait=20;
 for(const c of scene.children)if(c.name===GROUP){if(!template){load();return null;}const s=build(c);if(s){cur=s;scanWait=0;}return cur;}
 return null;
}
function step(scene){
 const s=find(scene);if(!s||!s.group.visible)return;
 // 같은 묶음을 다시 만든 경우(지역 이동 등)
 if(!s.mount.parent||!s.model.parent){s.mount.removeFromParent();cur=null;return;}
 // 몸이 반투명(가림·사라짐)일 때 칼도 같이
 const bm=Array.isArray(s.body?.material)?s.body.material[0]:s.body?.material,op=bm?bm.opacity:1;
 for(const m of s.mats){const solid=op>=.98;m.opacity=op;m.depthWrite=solid;if(m.transparent===solid){m.transparent=!solid;m.needsUpdate=true;}}
 twoHands(s);stats.frames++;
}
function hook(){
 const r=host();if(!r||r.scene===hookedScene)return;T=r.T;const scene=r.scene,prev=scene.onBeforeRender;
 scene.onBeforeRender=function(...a){try{prev?.apply(this,a);}finally{try{step(scene);}catch(e){fail(e);}}};
 hookedScene=scene;stats.hooks++;
}
setInterval(()=>{try{hook();}catch(e){fail(e);}},400);
window.__STORYWORLD_SLAYER_BLADE_R1309__=Object.freeze({revision:REV,fit:FIT,glb:GLB,
 inspect:()=>({...stats,loaded:!!template,failed,active:!!cur,visible:!!cur?.group.visible,lastError,
  mountScale:cur?+cur.mount.scale.x.toFixed(4):null,ik:!!cur?.ik})});
})();
