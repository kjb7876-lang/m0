// R1313 3D 영웅 무기(드라이브 Armory R2·05) — 미카엘라·헌터·기억사수·환도·EGO.
//  · 사용자 11-25 10:44Z "나머지 영웅들 무기 있는것들 미카엘라, 기억사수, 헌터, 환도, ego각성영웅(환도칼사용)도
//    확실하게 공격모션이랑 맞게 적용해줘 무기방향성맞게". (슬레이어 대검은 R1309 가 맡는다.)
//  · 사용자 지시 동작 변경: 지금 게임은 이 영웅들이 3D 일 때 손에 든 무기를 숨기고(R1305 HELD) 빛 정령만 보여 준다.
//    여기서는 그 손 뼈에 드라이브 무기 모델을 쥐여 보이게 한다. 정령·2D 소환·판정은 그대로.
//  · hwando-3d-r1302.js 는 건드리지 않는다. 장면의 'r1305-<id>-3d-shared' 묶음을 찾아 붙인다(R1309 와 같은 방식).
//  · 방향(R1318 고침): 영웅마다 손 뼈(Weapon_Socket) 좌표에서 정한 고정 자리·회전으로 쥐여 준다.
//    R1313 은 원래 무기 메시 축에서 방향을 구하고 보인 뒤 3번째 렌더 자세로 끝 방향을 뒤집었는데,
//    그 순간 자세(걷기·공격)에 따라 기억사수 총이 위아래로 뒤집히고(사용자 11-26 "총 위아래 반대"),
//    원래 무기의 손잡이 추정 자리가 손에서 떨어져 미카엘라·환도·헌터(헌터는 아래팔 길이만큼)가 무기를 허공에 쥐었다.
//    이제 무기 손잡이(GripSocket)는 언제나 손 뼈 원점, 방향은 표의 고정 회전(q)이라 자세와 상관없다.
//    q·scale 은 R1313 이 대기 자세에서 맞춘 결과(하트 위·총구 앞·총 위쪽 위·활시위 쏘는 사람 쪽)를 손 뼈 좌표로 옮긴 값.
//  · 3D 설정을 켜고 그 영웅 3D 가 처음 보일 때만 그 무기 GLB 하나를 읽는다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_WEAPONS_R1313__)return;
const REV='R1313-hero-weapons',LAYER=2,DIR='assets/r1313/';
// socket: 쥐는 손 뼈, q: 손 뼈 좌표에서 무기 회전(x,y,z,w), scale: 무기 크기. size·roll·flip 은 검사·체험용 덧조정.
const WEAPONS={
 hwando:{glb:DIR+'joseon-hwando.glb',tip:/^BladeTip/,socket:'Weapon_Socket',q:[-.1027,-.5314,-.1042,.8344],scale:.8755,size:1,roll:0,flip:false},
 ego:{glb:DIR+'joseon-hwando.glb',tip:/^BladeTip/,socket:'Weapon_Socket_R',q:[0,0,0,1],scale:.8503,size:1,roll:0,flip:false},
 michaela:{glb:DIR+'michaela-heart-wand.glb',tip:/^HeartFX/,socket:'Weapon_Socket_R',q:[.2946,.6386,.6669,.2462],scale:1.2646,size:1,roll:0,flip:false},
 hunter:{glb:DIR+'hunter-oxblood-bow.glb',tip:/^UpperTip/,socket:'Weapon_Socket_L',q:[.5,-.5,.5,-.5],scale:.6821,size:1,roll:0,flip:false},
 gunner:{glb:DIR+'memory-arc-rifle.glb',tip:/^EmissionFX/,socket:'Weapon_Socket_R',q:[.0416,.5399,.0645,.8382],scale:.8055,size:1,roll:0,flip:false},
 // R1378(사용자 11-27 "네온과 라우렌에 무기 추가 — 영웅 고르는 곳 그림에 맞게, 닷츠랑 협업, 모션은 미카엘라 참고"): 오른손에 창.
 //  GLB = Dots 정식판(SW-R1378-01 네온 심연 창·02 라우렌 보라 창, 11-27 납품, 원본 바이트). 처음엔 코드 임시판(scripts/r1378-weapon-glb.py)이었다.
 //  쥐는 방향은 미카엘라와 같은 리그·소켓이라 미카엘라 값, 자세는 R1320 표(미카엘라 틀). 페르소나(라우렌 틀)는 표에 넣지 않는다 — 라우렌 흔적 없음.
 neon:{glb:'assets/r1378/neon-abyss-spear.glb',tip:/^BladeTip/,socket:'Weapon_Socket_R',q:[.2946,.6386,.6669,.2462],scale:1,size:1,roll:0,flip:false},
 lauren:{glb:'assets/r1378/lauren-violet-lance.glb',tip:/^BladeTip/,socket:'Weapon_Socket_R',q:[.2946,.6386,.6669,.2462],scale:1,size:1,roll:0,flip:false}
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

function place(s){const W=s.W;s.mount.position.set(0,0,0);s.mount.quaternion.set(...W.q).normalize();
 s.mount.scale.setScalar(W.scale*W.size);s.roll.rotation.set(W.flip?Math.PI:0,W.roll,0);s.mount.updateMatrixWorld(true);}
function build(id,group){
 const W=WEAPONS[id],model=group.getObjectByName('r1305-'+id+'-3d-model');if(!model)return null;const sock=model.getObjectByName(W.socket);if(!sock)return null;
 const wroot=templates[W.glb].clone(true);
 const mats=[];wroot.traverse(o=>{o.layers?.set(LAYER);if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(x=>{const m=tone(x);mats.push(m);return m;}):(mats.push(o.material=tone(o.material)),o.material);}});
 const mount=new T.Group(),roll=new T.Group();mount.name='r1313-'+id+'-weapon';mount.add(roll);roll.add(wroot);mount.layers.set(LAYER);roll.layers.set(LAYER);sock.add(mount);
 let body=null;model.traverse(o=>{if(!body&&o.isSkinnedMesh&&!o.material?.userData?.r1305Ink)body=o;});
 const s={id,W,group,model,sock,mount,roll,wroot,mats,body};place(s);stats.builds++;return s;
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
 tune:(id,patch)=>{const W=WEAPONS[id];if(!W||!patch)return false;for(const k of ['size','roll','flip','q','scale'])if(k in patch)W[k]=patch[k];if(cur[id])place(cur[id]);return true;},
 inspect:()=>({...stats,lastError,active:Object.fromEntries(Object.entries(cur).map(([k,s])=>[k,{visible:!!s.group.visible,scale:+s.mount.scale.x.toFixed(4),parent:s.sock.name,flip:!!s.W.flip,roll:+s.W.roll.toFixed(3)}]))})});
})();
