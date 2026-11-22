// R1305 3D 영웅 10명(환도 + TRELLIS.2 9명) · 칼날 금속 재질 · 2D 유령 복제 숨김. (아래 R1304 설명은 그대로 유효)
//  · 환도: Blender 5.3 재생성 GLB(걷기 보폭↓·로브 자락 웨이트, tools/r1305/blender_hwando_walk_r1305.py). 경로·저장 키·API 이름은 R1302 그대로.
//  · 서하·네온·라우렌·미카엘라·슬레이어·헌터·거너·페르소나·EGO: assets/r1305/<id>-3d.glb(tools/r1305/blender_heroes_r1305.py).
//    지금 영웅의 GLB 하나만, 그 영웅으로 3D 를 처음 볼 때 읽는다(기본 꺼짐이면 0바이트).
//  · 무기 메시(스킨 없는 메시 = Weapon_Socket 강체) 재질: metalness .65 · roughness .25, 몸 재질은 emissive 0.
//    빛나는 무기 부품(원래 emissive 가 있는 재질)은 그 빛을 유지한다. opacity ≥ .98 이면 transparent=false(불투명 pass·정렬 안정).
//  · R350/R448 가 몸 본체를 복사해 덧그리는 2D 유령·앞그림(c.owner.r350 + 열쇠 'r350:ghost:'·'r448:ghost:'·'r448:over:')도
//    3D 로 바꾼 본체 몫이면 함께 뺀다 — 3D 위에 2D 몸·무기가 반투명으로 겹치던 문제.
// R1304 3D 환도 마감.
//  · 저장 키·공개 API·GLB 경로는 R1302와 같아 기존 설정/세이브와 호환한다.
//  · 별도 WebGL 캔버스를 만들지 않고 활성 ThreeRenderer.scene의 몸/벽 레이어(2)에 GLTF를 붙인다.
//    따라서 벽·지형과 같은 depth pass에서 가려지고, R448 앞쪽 효과(레이어 3)는 그대로 위에 남는다.
//  · Three는 이미 게임 렌더러가 읽은 host.T를 공유한다. GLTFLoader 모듈과 GLB fetch를 병렬 시작하고
//    parseAsync로 분리 계측한다. 기본 꺼짐에서는 모듈/GLB를 한 바이트도 읽지 않는다.
//  · R1303의 Idle/Walk/Attack 크로스페이드·이동 속도·부드러운 방향 전환은 유지한다.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HWANDO3D_R1302__)return;
const REV='R1305-heroes3d',KEY='storyworld.r1302.hwando3d',GLB='assets/r1302/hwando-3d.glb';
const MODEL_H=1.75,SCALE=1.06,HOST_LAYER=2,YAW_CAMERA=Math.PI/4;
// 영웅 id → GLB·공격 클립. TRELLIS 영웅은 사용자 공용 스크립트 프리셋의 공격 클립 이름을 쓴다.
const HEROES=Object.freeze({
 hwando:{glb:GLB,attack:'Attack_DiagonalSlash'},
 seoha:{glb:'assets/r1305/seoha-3d.glb',attack:'Attack_EgoCast'},
 neon:{glb:'assets/r1305/neon-3d.glb',attack:'Attack_EgoCast'},
 lauren:{glb:'assets/r1305/lauren-3d.glb',attack:'Attack_LanceThrust'},
 michaela:{glb:'assets/r1305/michaela-3d.glb',attack:'Attack_HealPulse'},
 slayer:{glb:'assets/r1305/slayer-3d.glb',attack:'Attack_DownCleave'},
 hunter:{glb:'assets/r1305/hunter-3d.glb',attack:'Attack_BowShot'},
 gunner:{glb:'assets/r1305/gunner-3d.glb',attack:'Attack_AimFire'},
 persona:{glb:'assets/r1305/persona-3d.glb',attack:'Attack_EgoCast'},
 ego:{glb:'assets/r1305/ego-3d.glb',attack:'Attack_AwakenedBurst'}});
const WEAPON={metalness:.65,roughness:.25};
// 먹 테두리(뒤집은 껍질): 2D 영웅의 붉은 먹 외곽선처럼 몸 둘레를 감싸 한지 바닥에서 읽히게 한다(7분야 심사: 3D 몸이 바닥색에 묻힘).
const INK={color:0x3a1612,width:.024};
function inkShell(mesh){const w=(INK.width/Math.max(1e-9,Math.abs(mesh.scale.x)||1)).toFixed(6)/* gltfpack 양자화 메시는 노드 scale 이 아주 작다 → 몸 로컬 단위로 바꾼다 */,m=new T.MeshBasicMaterial({color:INK.color,side:T.BackSide,transparent:false,depthTest:true,depthWrite:true});m.userData.r1305Ink=true;
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+'#if defined( USE_SKINNING )'+String.fromCharCode(10)+'transformed += normalize( objectNormal ) * '+w+';'+String.fromCharCode(10)+'#endif');};m.customProgramCacheKey=()=>'r1305-ink-shell-v2|'+w;
 const shell=new T.SkinnedMesh(mesh.geometry,m);shell.name='r1305-ink-shell';shell.bind(mesh.skeleton,mesh.bindMatrix);shell.bindMode=mesh.bindMode;shell.frustumCulled=false;shell.castShadow=shell.receiveShadow=false;shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.copy(mesh.scale);shell.renderOrder=mesh.renderOrder-1;
 mesh.parent.add(shell);mats.push(m);stats.inkShells++;return shell;}
const stats={heroCalls:0,wrapHero:0,heroImgs:0,frames:0,drawn:0,hidden:0,cleared:0,errors:0,requests:0,bytes:0,fetchMs:null,parseMs:null,loadMs:null,bodyFrames:0,heroFxFrames:0,lastHeroImages:0,lastBodies:0,lastHeroFx:0,lastBodyAlpha:null,lastNoBody:null,ghostsHidden:0,heroSwitches:0,weaponMeshes:0,inkShells:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=false;try{on=localStorage.getItem(KEY)==='on';}catch(_){}
try{if(/[?&]hwando3d=1\b/.test(location.search))on=true;}catch(_){}

let T=null,loading=null,ready=false,loadFailed=false,group=null,model=null,hostRenderer=null;
let mixer=null,actions={},mats=[],lastBox=null,yaw=0,yawTarget=0,lastAction='idle',lastT=0,lastDir=null,curAct=null;
let HERO='hwando',CLIP={idle:'Idle',walk:'Walk',attack:'Attack_DiagonalSlash'};
// 영웅마다 로드·동작 상태를 따로 둔다. 아래 함수들은 '지금 영웅' 변수만 보므로 영웅이 바뀌면 통째로 바꿔 끼운다.
const rigs={};
function saveRig(){const cur=rigs[HERO]||(rigs[HERO]={});Object.assign(cur,{loading,ready,loadFailed,group,model,mixer,actions,mats,yaw,yawTarget,lastAction,lastT,lastDir,curAct,atkT,lastAtk,wts});}
function useHero(id){if(!HEROES[id]||id===HERO)return;saveRig();if(group?.visible){group.visible=false;stats.cleared++;}
 const n=rigs[id]||(rigs[id]={loading:null,ready:false,loadFailed:false,group:null,model:null,mixer:null,actions:{},mats:[],yaw:0,yawTarget:0,lastAction:'idle',lastT:0,lastDir:null,curAct:null,atkT:-1,lastAtk:0,wts:{idle:1,walk:0,attack:0}});
 HERO=id;CLIP={idle:'Idle',walk:'Walk',attack:HEROES[id].attack};({loading,ready,loadFailed,group,model,mixer,actions,mats,yaw,yawTarget,lastAction,lastT,lastDir,curAct,atkT,lastAtk,wts}=n);caught=null;stats.heroSwitches++;}
// 페르소나·EGO 는 player.hero 값이 아니라 형상이다: 페르소나 = lauren + personaHeroR1113, EGO = hwando + egoSovereignR1046(R1046 formActive).
function heroKey(){try{if(typeof player==='undefined'||!player)return null;const h=player.hero;
 if(h==='lauren'&&player.personaHeroR1113===true)return'persona';
 if(h==='hwando'&&player.egoSovereignR1046===true&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.()!==false)return'ego';return h;}catch(_){return null;}}
function syncHero(){try{const h=heroKey();if(h&&HEROES[h]&&h!==HERO)useHero(h);}catch(e){fail(e);}}
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
function attach(r){if(!r||!group)return false;hostRenderer=r;T=r.T;if(group.parent!==r.scene){group.removeFromParent();r.scene.add(group);}group.layers.set(HOST_LAYER);group.traverse(o=>o.layers?.set(HOST_LAYER));return true;}
function toneMaterial(source,weapon=false){const m=source.clone();m.transparent=false;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;m.userData.r1305Weapon=weapon;
 const glow=!!m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity??1)>.05;
 if(weapon){if('metalness'in m)m.metalness=WEAPON.metalness;if('roughness'in m)m.roughness=WEAPON.roughness;if(!glow&&m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}}
 else{if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);if(m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1304Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1304Luma),gl_FragColor.rgb,.62)*1.12-.5)*1.04+.5,0.0,1.0);`);};m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1304-hanji-tone-v1';};m.needsUpdate=true;mats.push(m);return m;}
function load(r=currentHost()){
 if(ready){attach(r);return Promise.resolve(group);}if(loading)return loading;if(loadFailed||!r)return Promise.resolve(null);T=r.T;const id=HERO,GLB=HEROES[id].glb,started=performance.now(),fetchStarted=performance.now();stats.requests++;
 const bytes=fetch(GLB,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('GLB HTTP '+response.status);return response.arrayBuffer();}).then(data=>{stats.fetchMs=Math.round((performance.now()-fetchStarted)*10)/10;stats.bytes=data.byteLength;return data;});
 loading=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),bytes]).then(async([{GLTFLoader},data])=>{const parseStarted=performance.now(),base=new URL('.',new URL(GLB,document.baseURI)).href,gltf=await new GLTFLoader().parseAsync(data,base);stats.parseMs=Math.round((performance.now()-parseStarted)*10)/10;
  if(id!==HERO)throw Error('hero switched during load');model=gltf.scene;model.name='r1305-'+id+'-3d-model';model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){const weapon=!o.isSkinnedMesh;if(weapon)stats.weaponMeshes++;o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(x=>toneMaterial(x,weapon)):toneMaterial(o.material,weapon);}});
  {const skinned=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.material?.userData?.r1305Ink)skinned.push(o);});for(const o of skinned)inkShell(o).layers.set(HOST_LAYER);}
  model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model,true);if(Number.isFinite(bounds.min.y))model.position.y-=bounds.min.y;
  group=new T.Group();group.name='r1305-'+id+'-3d-shared';group.layers.set(HOST_LAYER);group.visible=false;group.add(model);attach(r);
  mixer=new T.AnimationMixer(model);for(const[k,n]of Object.entries(CLIP)){const clip=gltf.animations.find(x=>x.name===n);if(!clip)throw Error(id+' GLB 에 클립 없음: '+n);const act=mixer.clipAction(clip);act.play();act.enabled=false;actions[k]={act,clip};}
  stats.loadMs=Math.round((performance.now()-started)*10)/10;ready=true;return group;
 }).catch(e=>{fail(e);const switched=/switched/.test(String(e?.message));if(id===HERO){loadFailed=!switched;loading=null;ready=false;}else if(rigs[id]){rigs[id].loadFailed=!switched;rigs[id].loading=null;rigs[id].ready=false;}throw e;});
 // 켜기 동작이 unhandled rejection을 만들지 않게 내부 실패는 inspect()에 남기고 흡수한다.
 loading.catch(()=>null);return loading;
}

function active(){return on&&typeof player!=='undefined'&&player&&heroKey()===HERO&&!!HEROES[HERO]&&!player.r720Ally&&!player.r949Summon;}
const commandArea=c=>{const p=c?.points;if(!Array.isArray(p)||p.length<3)return 0;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const q of p){if(!Array.isArray(q))continue;x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}return Math.max(0,x1-x0)*Math.max(0,y1-y0);};
const assetKey=value=>{try{return decodeURIComponent(new URL(String(value||''),document.baseURI).pathname).replace(/^\//,'');}catch(_){return String(value||'').replace(/^\.\//,'');}};
// drawHero 범위에는 방어막·오라·사몽 십자도 함께 들어온다. sourcePath가 실제 bodyPath와 같은 행을
// 먼저 고르고, R350/R448의 몸 표지나 영웅 이름 경로만 보조로 쓴다. 모호하면 VFX를 지우지 않고 숨긴다.
const nestedCommands=new WeakSet();
function heroCommands(commands,hint=null){const all=[];for(const c of commands)if(c?.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r945Clone&&!nestedCommands.has(c))all.push(c);if(!all.length)return all;let mine=all;
 const actorRows=(rows,owner)=>{const x=Number(owner?.x),y=Number(owner?.y);let at=rows;if(Number.isFinite(x+y)){const same=at.filter(c=>Math.hypot(Number(c.owner?.x)-x,Number(c.owner?.y)-y)<.002);if(same.length)at=same;}if(owner?.id!=null){const same=at.filter(c=>c.owner?.id===owner.id);if(same.length)at=same;}return at;};
 if(hint)mine=actorRows(mine,hint);
 const exact=mine.filter(c=>c.owner.bodyPath&&assetKey(c.sourcePath)===assetKey(c.owner.bodyPath));if(exact.length)return actorRows(exact,exact[0].owner);
 const marked=mine.filter(c=>(c.spatialRole==='body'||c.r350Lifted)&&(c.mutable||String(c.sourcePath||'').includes(HERO)));if(marked.length)return actorRows(marked,marked[0].owner);
 const named=mine.filter(c=>c.mutable||String(c.sourcePath||'').includes(HERO));return named.length?actorRows(named,named[0].owner):named;}
let caught=null,heroDepth=0,heroWraps=0,heroGeneration=0;
// 뒤에 로드된 영웅 모션 스크립트까지 모두 그린 뒤 첫 본체의 표시 좌표만 기억한다. 여기서 명령을 빼면
// R350/R448이 몸 상자를 못 보고, 재귀 drawHero로 만든 R113/R945 분신까지 사라진다. 실제 제거는 render 직전에 한다.
function wrapHero(){if(typeof drawHero!=='function'||drawHero.__r1304||heroWraps>=8)return;const base=drawHero,generation=++heroGeneration;heroWraps++;stats.wrapHero=heroWraps;const wrappedHero=function(...args){if(generation!==heroGeneration)return base.apply(this,args);const rec=typeof ctx==='object'&&ctx&&Array.isArray(ctx.commands)?ctx.commands:null,start=rec?rec.length:0;if(heroDepth){try{return base.apply(this,args);}finally{if(rec)for(let i=start;i<rec.length;i++)if(rec[i]&&typeof rec[i]==='object')nestedCommands.add(rec[i]);}}
  stats.heroCalls++;const eligible=active(),actorHint=eligible?{x:Number(player.x),y:Number(player.y),id:player.id!=null?'hero:'+player.id:null}:null;heroDepth++;let result;try{result=base.apply(this,args);}finally{heroDepth--;}
  try{if(rec&&eligible&&ready&&!caught){const bodies=heroCommands(rec.slice(start),actorHint);if(bodies.length){const body=bodies.reduce((a,c)=>commandArea(c)>commandArea(a)?c:a);caught={owner:{...body.owner}};}}}catch(e){fail(e);}return result;};wrappedHero.__r1304=true;drawHero=wrappedHero;}

const ATK_SEC=.5,FADE_SEC=.12,ATK_FADE_IN=.05,WALK_REF=4,YAW_RATE=9;
let wts={idle:1,walk:0,attack:0},atkT=-1,lastAtk=0;
function action(){const a=+player.attackAnim||0;if(a>lastAtk+1e-4&&(atkT<0||atkT>ATK_SEC*.7))atkT=0;lastAtk=a;if(a>0&&atkT<0)atkT=0;if(atkT>=0&&atkT<ATK_SEC&&!(player.moving&&a<=0))return'attack';atkT=-1;return player.moving?'walk':'idle';}
const DIR={front:0,down:0,right:Math.PI/2,back:Math.PI,up:Math.PI,left:-Math.PI/2};
function updateModel(r,owner,alpha,frame){if(!attach(r)||!group)return;const h=Math.max(16,typeof actorHeight==='function'?actorHeight():60),p=r.projection,worldScale=h*SCALE/(MODEL_H*p.tile*p.zoom*Math.sqrt(1.5));
 group.visible=true;group.position.set(owner.x,Number(owner.renderHeight)||0,owner.y);group.scale.setScalar(worldScale);
 const now=Number.isFinite(frame?.time)?frame.time:(typeof time==='number'?time:performance.now()/1000),dt=lastT?Math.max(0,Math.min(.1,now-lastT)):0;lastT=now;const act=action();lastAction=act;
 const vx=+player.moveVX150||0,vy=+player.moveVY150||0;if(act==='walk'&&Math.hypot(vx,vy)>1e-3){const sx=vx-vy,sy=(vx+vy)*.5;yawTarget=Math.atan2(sx,sy);}else if(player.direction!==lastDir||act==='attack'){const d=DIR[String(player.direction||'').toLowerCase()];if(d!==undefined)yawTarget=d;}lastDir=player.direction;
 let df=yawTarget-yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;yaw+=df*Math.min(1,dt*YAW_RATE);group.rotation.y=yaw+YAW_CAMERA;
 for(const k in wts){const f=k===act?(k==='attack'?ATK_FADE_IN:FADE_SEC):FADE_SEC;wts[k]=Math.max(0,Math.min(1,wts[k]+(k===act?1:-1)*dt/f));}if(curAct!==act&&act==='attack')wts.attack=Math.max(wts.attack,.25);const total=wts.idle+wts.walk+wts.attack||1,walkRate=Math.max(.7,Math.min(1.8,Math.hypot(vx,vy)/WALK_REF||1));
 for(const k in actions){const A=actions[k],weight=wts[k]/total;A.act.enabled=weight>1e-3;A.act.setEffectiveWeight(weight);if(k==='attack'){if(act==='attack'){if(curAct!=='attack')A.act.time=0;A.act.time=Math.min(1,atkT/ATK_SEC)*A.clip.duration*.999;}}else if(weight>1e-3||k===act){if(k===act&&curAct!==act&&weight<.3&&k==='walk')A.act.time=0;A.act.time=(A.act.time+dt*(k==='walk'?walkRate:1))%A.clip.duration;}}
 if(act==='attack')atkT+=dt;curAct=act;mixer.update(0);const opacity=Math.max(0,Math.min(1,alpha));for(const m of mats){const solid=opacity>=.98;m.opacity=opacity;m.depthWrite=solid;if(m.transparent===solid){m.transparent=!solid;m.needsUpdate=true;}}group.updateMatrixWorld(true);stats.drawn++;
}
// R350 유령(가려질 때 몸 복사)·R448 유령/앞그림은 본체 열쇠 앞에 이 접두어를 붙인 c.owner.r350 명령이다.
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
function hide(){if(group?.visible){group.visible=false;stats.cleared++;}}
function consume(r,commands,frame){if(!active()){caught=null;hide();return;}if(!ready||!Array.isArray(commands)){caught=null;hide();return;}attach(r);const pending=caught;caught=null;const heroImages=commands.filter(c=>c?.kind==='image'&&c.owner?.kind==='hero'),bodies=heroCommands(commands,pending?.owner),selected=new Set(bodies);stats.heroImgs+=heroImages.length;
 stats.lastHeroImages=heroImages.length;stats.lastBodies=bodies.length;stats.lastHeroFx=heroImages.filter(c=>!selected.has(c)).length;if(stats.lastHeroFx)stats.heroFxFrames++;if(!bodies.length){if(heroImages.length)stats.lastNoBody=heroImages.slice(0,8).map(c=>({sourcePath:String(c.sourcePath||''),bodyPath:String(c.owner?.bodyPath||''),spatialRole:c.spatialRole||null,r350Lifted:!!c.r350Lifted,mutable:!!c.mutable,alpha:c.style?.globalAlpha??1}));hide();return;}stats.lastNoBody=null;stats.bodyFrames++;const body=bodies.reduce((a,c)=>commandArea(c)>commandArea(a)?c:a);stats.lastBodyAlpha=Math.max(0,Math.min(1,body.style?.globalAlpha??1));const ghostKeys=new Set();for(const c of bodies)if(c.key!=null)for(const p of GHOST_PREFIX)ghostKeys.add(p+c.key);
 for(let i=commands.length-1;i>=0;i--){const c=commands[i];if(selected.has(c)){commands.splice(i,1);stats.hidden++;}else if(c?.owner?.r350&&c.key!=null&&ghostKeys.has(String(c.key))){commands.splice(i,1);stats.ghostsHidden++;}}updateModel(r,body.owner,stats.lastBodyAlpha,frame);
}

// R350/R448의 ThreeRenderer 래퍼가 몸 상자를 먼저 쓴 뒤 호출하는 CommandScene.render 바로 앞에서만 몸을 뺀다.
// 그래서 덧씌움 순서와 무관하게 원래 가림/유령 효과와 재귀 분신을 보존하고, 같은 scene의 층 1→2→3 pass는 그대로 둔다.
let frameContext=null;
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1304)return;const base=scene.render,w=function(commands){try{consume(r,commands,frameContext);}catch(e){fail(e);hide();}try{return base.apply(this,arguments);}finally{frameContext=null;}};w.__r1304=true;scene.render=w;}
function prepare(r,frame){stats.frames++;frameContext=frame;wrapCommands(r);syncHero();if(!active()){caught=null;hide();return;}if(!ready){caught=null;hide();load(r);return;}attach(r);}
let depth=0;const wrapped=new WeakSet();
const wrapFn=fn=>{if(fn.__r1304)return fn;const w=function(frame){if(depth===0){try{prepare(this,frame);}catch(e){fail(e);hide();}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1304=w.__r1302=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}if(r)wrapCommands(r);if(r&&group&&hostRenderer!==r)attach(r);if(r&&on&&!ready&&!loading&&!loadFailed)load(r);}catch(e){fail(e);}}
(function tick(){syncHero();wrapInst();wrapHero();if(!active())hide();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('hwando3dR1302Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='hwando3dR1302Row';d.className='r1021-row';d.innerHTML='<label><input type="checkbox" id="hwando3dR1302Toggle"> 3D 영웅(시험)</label><p class="small muted">환도·서하·네온·미카엘라·라우렌·헌터·슬레이어·거너·페르소나·EGO를 월드 깊이에 맞는 입체 모델로 그립니다. 영웅마다 처음 볼 때 모델 약 4MB를 받으며, 기본은 끔입니다.</p>';host.appendChild(d);const el=d.querySelector('#hwando3dR1302Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('hwando3dR1302Toggle');if(el)el.checked=on;if(on){loadFailed=false;load(currentHost()).catch(()=>null);}else hide();return on;}
function measure(){if(!ready||!group?.visible||!hostRenderer)return null;group.updateMatrixWorld(true);const camera=hostRenderer.camera,width=hostRenderer.projection.width,height=hostRenderer.projection.height,vertex=new T.Vector3(),projected=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 group.traverse(o=>{const position=o.isMesh&&o.geometry?.attributes?.position;if(!position)return;for(let i=0;i<position.count;i++){if(typeof o.getVertexPosition==='function')o.getVertexPosition(i,vertex);else vertex.fromBufferAttribute(position,i);projected.copy(vertex).applyMatrix4(o.matrixWorld).project(camera);const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});if(!count)return{ink:0};const anchor=hostRenderer.projection.worldToScreen(group.position.x,group.position.z,group.position.y);lastBox={ink:count,top,bottom,left,right,cx:(left+right)/2,anchor};return lastBox;}
window.__STORYWORLD_HWANDO3D_R1302__=Object.freeze({revision:REV,glb:GLB,on:()=>on,set,load:()=>load(currentHost()),measure,heroes:()=>Object.keys(HEROES),inspect:()=>({revision:REV,hero:HERO,glbPath:HEROES[HERO].glb,loadedHeroes:Object.keys(HEROES).filter(k=>k===HERO?ready:!!rigs[k]?.ready),on,ready,action:lastAction,yaw:+yaw.toFixed(3),weights:{idle:+wts.idle.toFixed(3),walk:+wts.walk.toFixed(3),attack:+wts.attack.toFixed(3)},sharedScene:!!group&&!!hostRenderer&&group.parent===hostRenderer.scene,hostLayer:group?HOST_LAYER:null,overlayCanvas:!!document.getElementById('hwando3dR1302'),shown:!!group?.visible,opacity:mats[0]?.opacity??null,depthWrite:mats.length?mats.every(m=>m.depthWrite):null,transparent:mats.length?mats.some(m=>m.transparent):null,weaponMaterial:(()=>{const m=mats.find(x=>x.userData?.r1305Weapon);return m?{metalness:m.metalness,roughness:m.roughness,emissive:m.emissive?m.emissive.getHex():null}:null;})(),...stats,lastError})});
})();
