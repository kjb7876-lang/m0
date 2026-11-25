// R1313 3D 영웅 무기(드라이브 Armory R2·05) — 미카엘라·헌터·기억사수·환도·EGO.
//  · 사용자 11-25 10:44Z "나머지 영웅들 무기 있는것들 미카엘라, 기억사수, 헌터, 환도, ego각성영웅(환도칼사용)도
//    확실하게 공격모션이랑 맞게 적용해줘 무기방향성맞게". (슬레이어 대검은 R1309 가 맡는다.)
//  · 사용자 지시 동작 변경: 지금 게임은 이 영웅들이 3D 일 때 손에 든 무기를 숨기고(R1305 HELD) 빛 정령만 보여 준다.
//    여기서는 숨긴 원래 무기 자리(무기 부모 노드)에 드라이브 무기 모델을 쥐여 보이게 한다. 정령·2D 소환·판정은 그대로.
//  · hwando-3d-r1302.js 는 건드리지 않는다. 장면의 'r1305-<id>-3d-shared' 묶음을 찾아 붙인다(R1309 와 같은 방식).
//  · 방향: 원래 무기 메시의 축(손잡이 끝→끝, 넓이 방향, 손 위치)에 새 무기의 GripSocket·+Y 축을 맞춘다.
//    공격 모션 안에서 앞뒤가 뒤집히는 무기(기억사수 총: 원래 짧은 권총이라 총구 쪽이 반대)·활시위 쪽은
//    원래 무기가 손 가운데를 지나는 막대(권총·지팡이·활)면 어느 끝이 '끝'인지 정해지지 않으므로 orient 규칙으로 정한다:
//    up = 끝(하트)이 몸 위쪽, forward = 끝(총구 쪽 발광부)이 몸 앞(+Z), string = 활시위가 몸 뒤(쏘는 사람) 쪽:
//    게임이 애니메이션 자세를 입힌 뒤(보인 뒤 3번째 렌더) 한 번 정한다. EGO 모델에는 무기가 없어 슬레이어와 같은 TRELLIS 소켓 축을 쓴다.
//  · 3D 설정을 켜고 그 영웅 3D 가 처음 보일 때만 그 무기 GLB 하나를 읽는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_WEAPONS_R1313__)return;
const REV='R1313-hero-weapons',LAYER=2,DIR='assets/r1313/';
// size: 길이 배율, roll: 칼(무기) 길이 축 둘레 회전, flip: 끝 방향 뒤집기, slide/off: 칼 길이 비율 이동.
const WEAPONS={
 hwando:{glb:DIR+'joseon-hwando.glb',tip:/^BladeTip/,held:'Hwando_Weapon',size:1,roll:0,slide:0,off:[0,0,0]},
 ego:{glb:DIR+'joseon-hwando.glb',tip:/^BladeTip/,socket:'Weapon_Socket_R',axis:{grip:[0,0,0],dir:[0,1,0],wv:[1,0,0],bladeLen:.95},size:1,roll:0,slide:0,off:[0,0,0]},
 michaela:{glb:DIR+'michaela-heart-wand.glb',tip:/^HeartFX/,held:'michaela_Weapon',orient:'up',size:1,roll:0,slide:0,off:[0,0,0]},
 hunter:{glb:DIR+'hunter-oxblood-bow.glb',tip:/^UpperTip/,held:'hunter_Weapon',orient:'string',size:1,roll:0,slide:0,off:[0,0,0]},
 gunner:{glb:DIR+'memory-arc-rifle.glb',tip:/^EmissionFX/,held:'gunner_Weapon',orient:'forward',size:1.8,roll:0,slide:0,off:[0,0,0]}
};
const stats={revision:REV,hooks:0,builds:0,frames:0,errors:0,loads:{}};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let T=null,hookedScene=null,scanWait=0;const templates={},loading={},failed={},cur={};
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};

function load(id){
 const W=WEAPONS[id],url=W.glb;if(templates[url]||loading[url]||failed[url])return;const t0=performance.now();
 const bytes=fetch(url,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer();});
 loading[url]=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),bytes]).then(async([{GLTFLoader},data])=>{
  const gltf=await new GLTFLoader().parseAsync(data,new URL('.',new URL(url,document.baseURI)).href);
  templates[url]=gltf.scene;stats.loads[url.slice(DIR.length)]={ms:Math.round(performance.now()-t0),bytes:data.byteLength};
 }).catch(e=>{failed[url]=true;fail(e);}).finally(()=>{delete loading[url];});
}

// 몸과 같은 한지 톤(R1304)·무기 금속감(R1305). 빛나는 부품(발광 재질)은 빛을 유지한다.
function tone(src){const m=src.clone();m.side=T.DoubleSide;m.transparent=false;m.depthTest=true;m.depthWrite=true;m.forceSinglePass=true;
 const glow=!!m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity??1)>.05;
 if('metalness'in m)m.metalness=.65;if('roughness'in m)m.roughness=.25;if(!glow&&m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const key=m.customProgramCacheKey;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1304Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1304Luma),gl_FragColor.rgb,.62)*1.12-.5)*1.04+.5,0.0,1.0);`);};
 m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1304-hanji-tone-v1';};m.needsUpdate=true;return m;}

// 원래 무기 축(원래 무기 노드 좌표): 손잡이 끝→끝, 넓이 방향, 손(소켓) 위치. R1309 와 같은 계산.
function axisOf(model,W){
 if(W.axis){const s=model.getObjectByName(W.socket);if(!s)return null;const v=a=>new T.Vector3(...a);
  return {par:s,grip:v(W.axis.grip),dir:v(W.axis.dir).normalize(),wv:v(W.axis.wv).normalize(),bladeLen:W.axis.bladeLen};}
 const node=model.getObjectByName(W.held);if(!node)return null;model.updateMatrixWorld(true);
 const inv=new T.Matrix4().copy(node.matrixWorld).invert(),pts=[];
 node.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||/^contact-/.test(o.name||''))return;const rel=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld),p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)pts.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(rel));});
 if(pts.length<4)return null;
 const cen=pts.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/pts.length);
 let pA=pts[0];for(const p of pts)if(p.distanceTo(cen)>pA.distanceTo(cen))pA=p;let pB=pts[0];for(const p of pts)if(p.distanceTo(pA)>pB.distanceTo(pA))pB=p;
 let sock=null;for(let n=node;n;n=n.parent)if(/^Weapon_Socket/.test(n.name||'')){sock=n;break;}
 const hand=new T.Vector3();if(sock){sock.getWorldPosition(hand);hand.applyMatrix4(inv);}
 const butt=pA.distanceTo(hand)<pB.distanceTo(hand)?pA:pB,tip=butt===pA?pB:pA,dir=tip.clone().sub(butt).normalize();
 const along=T.MathUtils.clamp(hand.clone().sub(butt).dot(dir),0,butt.distanceTo(tip)*.5),grip=butt.clone().addScaledVector(dir,along);
 const wv=new T.Vector3();let wd=0;for(const p of pts){const r=p.clone().sub(grip);const perp=r.sub(dir.clone().multiplyScalar(r.dot(dir)));const l=perp.length();if(l>wd&&p.distanceTo(grip)>butt.distanceTo(tip)*.4){wd=l;wv.copy(perp).normalize();}}
 if(wd===0)wv.set(1,0,0).sub(dir.clone().multiplyScalar(dir.x)).normalize();
 return {par:node,grip,dir,wv,bladeLen:tip.distanceTo(grip)};
}

function place(s){const W=s.W,ax=s.ax;
 const X=ax.wv.clone().sub(ax.dir.clone().multiplyScalar(ax.wv.dot(ax.dir))).normalize(),Y=ax.dir.clone(),Z=new T.Vector3().crossVectors(X,Y).normalize();
 s.mount.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X,Y,Z));
 s.mount.position.copy(ax.grip).addScaledVector(Y,W.slide*ax.bladeLen).addScaledVector(X,W.off[0]*ax.bladeLen).addScaledVector(Z,W.off[1]*ax.bladeLen).addScaledVector(Y,W.off[2]*ax.bladeLen);
 s.mount.scale.setScalar(ax.bladeLen/s.tipLen*W.size);s.roll.rotation.set(W.flip?Math.PI:0,W.roll,0);s.mount.updateMatrixWorld(true);}

// orient 규칙: 지금(붙이는 순간) 자세에서 끝·시위 방향을 몸 좌표로 재서 반대면 뒤집는다.
function orient(s){const o=s.W.orient;if(!o)return;const m=s.model;m.updateMatrixWorld(true);s.mount.updateMatrixWorld(true);
 const at=re=>{let n=null;s.wroot.traverse(x=>{if(!n&&re.test(x.name||''))n=x;});if(!n)return null;const v=new T.Vector3();n.getWorldPosition(v);return m.worldToLocal(v);};
 const g=m.worldToLocal(s.mount.getWorldPosition(new T.Vector3()));
 if(o==='up'||o==='forward'){const t=at(s.W.tip);if(!t)return;const d=t.sub(g);if((o==='up'?d.y:d.z)<0){s.W.flip=!s.W.flip;place(s);}s.flipped=!!s.W.flip;return;}
 // string: 활시위(StringCenter)가 쏘는 사람 쪽 = 몸 뒤(-Z). 쏠 때 왼손이 앞으로 뻗으므로 시위는 손보다 뒤에 있어야 한다.
 //  (가슴 기준은 대기 자세에서 가슴이 손보다 앞이라 반대로 나와 쓰지 않는다.)
 if(o==='string'){const t=at(/^StringCenter/);if(!t)return;if(t.sub(g).z>0){s.W.roll+=Math.PI;place(s);}s.rolled=+s.W.roll.toFixed(3);}
}
function build(id,group){
 const W=WEAPONS[id],model=group.getObjectByName('r1305-'+id+'-3d-model');if(!model)return null;const ax=axisOf(model,W);if(!ax)return null;
 const wroot=templates[W.glb].clone(true);let tipLen=1;wroot.traverse(o=>{if(W.tip.test(o.name||''))tipLen=o.position.length()||1;});
 const mats=[];wroot.traverse(o=>{o.layers?.set(LAYER);if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(x=>{const m=tone(x);mats.push(m);return m;}):(mats.push(o.material=tone(o.material)),o.material);}});
 const mount=new T.Group(),roll=new T.Group();mount.name='r1313-'+id+'-weapon';mount.add(roll);roll.add(wroot);mount.layers.set(LAYER);roll.layers.set(LAYER);ax.par.add(mount);
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink)body=o;});
 const s={id,W,group,model,ax,mount,roll,wroot,tipLen,mats,body,frames:0,oriented:false};place(s);stats.builds++;return s;
}

function find(scene){
 for(const id of Object.keys(cur))if(cur[id].group.parent!==scene||!cur[id].mount.parent){cur[id].mount.removeFromParent();delete cur[id];}
 if(scanWait-->0)return;scanWait=20;
 for(const c of scene.children){const m=/^r1305-(\w+)-3d-shared$/.exec(c.name||'');const id=m&&m[1];if(!id||!WEAPONS[id]||cur[id]?.group===c||!c.visible)continue;
  if(!templates[WEAPONS[id].glb]){load(id);scanWait=0;continue;}const s=build(id,c);if(s)cur[id]=s;}
}
function step(scene){
 find(scene);
 for(const id in cur){const s=cur[id];if(!s.group.visible)continue;
  // 몸이 반투명(가림·사라짐)일 때 무기도 같이
  const bm=Array.isArray(s.body?.material)?s.body.material[0]:s.body?.material,op=bm?bm.opacity:1;
  for(const m of s.mats){const solid=op>=.98;m.opacity=op;m.depthWrite=solid;if(m.transparent===solid){m.transparent=!solid;m.needsUpdate=true;}}
  // 방향 규칙은 게임이 이 모델에 애니메이션 자세를 몇 번 입힌 뒤(바인드 자세가 아닐 때) 한 번 정한다.
  if(!s.oriented&&++s.frames>=3){s.oriented=true;orient(s);}
  stats.frames++;}
}
function hook(){
 const r=host();if(!r||r.scene===hookedScene)return;T=r.T;const scene=r.scene,prev=scene.onBeforeRender;
 scene.onBeforeRender=function(...a){try{prev?.apply(this,a);}finally{try{step(scene);}catch(e){fail(e);}}};
 hookedScene=scene;stats.hooks++;
}
setInterval(()=>{try{hook();}catch(e){fail(e);}},400);
window.__STORYWORLD_HERO_WEAPONS_R1313__=Object.freeze({revision:REV,heroes:()=>Object.keys(WEAPONS),
 // 검사용: 표 값 확인·임시 조정(새로고침하면 원래 값)
 fit:id=>WEAPONS[id]?{...WEAPONS[id],tip:String(WEAPONS[id].tip)}:null,
 tune:(id,patch)=>{const W=WEAPONS[id];if(!W||!patch)return false;for(const k of ['size','roll','slide','flip','off'])if(k in patch)W[k]=patch[k];if(cur[id])place(cur[id]);return true;},
 inspect:()=>({...stats,lastError,active:Object.fromEntries(Object.entries(cur).map(([k,s])=>[k,{visible:!!s.group.visible,scale:+s.mount.scale.x.toFixed(4),parent:s.ax.par.name,flip:!!s.W.flip,roll:+s.W.roll.toFixed(3)}]))})});
})();
