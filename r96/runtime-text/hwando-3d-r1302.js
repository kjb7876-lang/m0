// R1302 3D 환도 시험(사용자 2026-11-21 15:27Z "이거 최우선적용 및 배포" — TRELLIS.2 환도 GLB + [3D 환도 ON/OFF] 토글로 2D 와 비교).
//  · 원본: 사용자가 준 hwando_hero_trellis2_clean.glb(14.8MB, 최신본 16:01Z)를 사용자가 준 blender_hwando_one_shot_rig.py 로 Blender 4.2.9 LTS 에서 리깅
//    (칼 분리·10뼈·Idle/Walk/Attack_DiagonalSlash). 원문은 자동 무게(열 확산)가 실패해 몸이 안 움직여서 r96/tools/r1302/blender_hwando_rig_r1302.py 로 고침
//    (몸 decimate 0.30 → 복셀 대리 메시에서 자동 무게 → 몸으로 옮김). 다른 AI 의 브리지 hwando_m0_3d_bridge.js 는 m0 구조를 몰라 그대로 안 붙어
//    카메라 앙각 32.5°·방향 표만 참고했다(원문 r96/tools/r1302 보관).
//  · GLB: gltfpack 양자화 + 텍스처 1024 webp → assets/r1302/hwando-3d.glb(약 3.9MB). 켤 때만 읽는다(꺼져 있으면 0바이트).
//  · 연결: Three 기록기(dist/phase1.js ThreeRenderer.render)에 들어가는 프레임 명령에서 '내 영웅(환도) 몸 그림' 명령
//    (image, owner.kind 'hero', owner 자리 = player 자리, 그림 경로 ∈ heroPaths('hwando'))을 빼고, 그 그림의 발밑 가운데 자리에 3D 환도를 그린다.
//    그래서 2D 가 몸을 그리는 순간(서기·걷기·공격·깜빡임·밀려남)에만 3D 가 보이고, 몸을 안 그리는 순간(영상·창·숨김)에는 3D 도 비운다.
//    그림자·오라·스킬·적중 이펙트·판정·충돌·저장·스토리는 손대지 않는다. 소환된 다른 환도(서하 소집·EGO R)는 2D 그대로.
//  · 3D 는 게임 캔버스 위 투명 WebGL 캔버스(#hwando3dR1302, 마우스 통과)에 그린다 → 벽 가림·이펙트보다 앞/뒤 순서는 맞추지 않는다(시험판 한계, 보고서에 적음).
//  · 설정 창 '전투 화면' 구역 한 줄 '3D 환도(시험)'. 기본 꺼짐(사용자 의도: 2D 와 비교). 저장 localStorage storyworld.r1302.hwando3d = on|off. 주소 ?hwando3d=1 도 켬.
//  · Legacy(캔버스) 경로에서는 동작하지 않는다(2D 그대로).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HWANDO3D_R1302__)return;
const REV='R1302-hwando3d-2',KEY='storyworld.r1302.hwando3d',GLB='assets/r1302/hwando-3d.glb',HERO='hwando';
const ELEV=32.5*Math.PI/180,MODEL_H=1.75,SCALE=1.06/* 2D 몸 그림은 두건 끝~발까지라 모델 키를 조금 키워 맞춤 */;
const D2R=Math.PI/180;
const stats={heroCalls:0,wrapHero:0,heroImgs:0,frames:0,drawn:0,hidden:0,cleared:0,errors:0,loadMs:null};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=false;try{on=localStorage.getItem(KEY)==='on';}catch(_){}
try{if(/[?&]hwando3d=1\b/.test(location.search))on=true;}catch(_){}
let T=null,loading=null,ready=false,renderer=null,scene=null,camera=null,group=null,canvas=null;
let lastBox=null,yaw=0,yawTarget=0,lastAction='idle',lastT=0,lastDir=null,pending=null;

// 자세는 GLB 안의 실제 애니메이션 클립(Blender 리깅본: Idle·Walk·Attack_DiagonalSlash)을 AnimationMixer 로 튼다.
const CLIP={idle:'Idle',walk:'Walk',attack:'Attack_DiagonalSlash'};
let mixer=null,actions={},mats=[],curAct=null;
// ---- 불러오기(켤 때 한 번) ----
function stage(){return document.getElementById('stage');}
function ensureCanvas(){if(canvas&&canvas.isConnected)return canvas;const st=stage();if(!st)return null;
 canvas=document.getElementById('hwando3dR1302')||document.createElement('canvas');canvas.id='hwando3dR1302';
 /* 2D 환도(한지빛 몸 + 밝은 테두리)와 색을 맞춘다: 채도를 낮추고 조금 밝게, 한지색 1px 테두리. DOM 캔버스 CSS 필터라 게임 Three 기록기와 무관 */
 Object.assign(canvas.style,{filter:'saturate(.62) brightness(1.12) contrast(1.04) drop-shadow(0 0 .8px rgba(244,238,224,.95)) drop-shadow(0 1px 1px rgba(20,16,12,.35))',position:'absolute',left:'0',top:'0',pointerEvents:'none',zIndex:'1',display:'none'});
 const gl=document.getElementById('phase1-webgl');if(gl&&gl.parentNode===st)gl.after(canvas);else st.appendChild(canvas);return canvas;}
function load(){if(loading)return loading;const t0=performance.now();
 loading=(async()=>{T=await import('./vendor/three/build/three.module.js');const {GLTFLoader}=await import('./vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const gltf=await new GLTFLoader().loadAsync(GLB);group=gltf.scene;
  group.traverse(o=>{if(o.isMesh){o.frustumCulled=false;const m=o.material=o.material.clone();m.transparent=true;m.metalness=0;m.side=T.DoubleSide;mats.push(m);}});
  mixer=new T.AnimationMixer(group);for(const [k,n] of Object.entries(CLIP)){const c=gltf.animations.find(x=>x.name===n);if(!c)throw Error('GLB 에 클립 없음: '+n);const act=mixer.clipAction(c);act.play();act.enabled=false;actions[k]={act,clip:c};}
  scene=new T.Scene();/* 빛은 사용자가 '잘 된다'고 한 시험 페이지(storyworld_3d.html)와 같게: 따뜻한 해 1 + 옅은 반구광 + 차가운 테두리광 */scene.add(new T.HemisphereLight(0xf5eadc,0x16202b,.52*Math.PI));const key=new T.DirectionalLight(0xfff0d8,1.15*Math.PI);key.position.set(4,7,5);scene.add(key);
  const rim=new T.DirectionalLight(0x8eb9e8,.55*Math.PI);rim.position.set(-5,3.5,-4);scene.add(rim);scene.add(group);
  camera=new T.OrthographicCamera(-1,1,1,-1,.1,40);camera.position.set(0,Math.sin(ELEV)*12,Math.cos(ELEV)*12);camera.lookAt(0,0,0);
  const cv=ensureCanvas();renderer=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true,premultipliedAlpha:true});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.setClearColor(0,0);
  stats.loadMs=Math.round(performance.now()-t0);ready=true;})().catch(e=>{fail(e);loading=null;ready=false;});
 return loading;}
// ---- 매 프레임 ----
function mine(c){if(!c||c.kind!=='image'||c.owner?.kind!=='hero'||typeof player==='undefined'||!player)return false;
 if(c.owner.x!==player.x||c.owner.y!==player.y)return false;const sp=c.sourcePath;if(typeof sp!=='string')return false;
 if(!heroSet||heroSetFor!==player.hero){try{heroSet=new Set(heroPaths(HERO));heroSetFor=player.hero;}catch(_){heroSet=new Set();}}
 return heroSet.has(sp);}
let heroSet=null,heroSetFor=null;
function active(){return on&&typeof player!=='undefined'&&player&&player.hero===HERO;}
// 1차: drawHero 가 기록기(ctx.commands)에 넣은 내 몸 그림을 그 자리에서 뺀다(렌더러 감싸기 순서와 무관).
let caught=null;
// 다른 덧씌우기(R283·R895 등)가 drawHero 바깥에서 몸을 더 그리므로, 모든 스크립트가 읽힌 뒤 맨 바깥에서 감싼다(바깥이 바뀌면 다시, 최대 6번).
let heroDepth=0,heroWraps=0;
function wrapHero(){if(typeof drawHero!=='function'||drawHero.__r1302||heroWraps>=6)return;const baseHero=drawHero;heroWraps++;stats.wrapHero=heroWraps;
 const w=function(...a){if(heroDepth>0)return baseHero.apply(this,a);stats.heroCalls++;const rec=typeof ctx==='object'&&ctx&&Array.isArray(ctx.commands)?ctx.commands:null,st=rec?rec.length:0;heroDepth++;let r;try{r=baseHero.apply(this,a);}finally{heroDepth--;}
  try{if(rec&&active()&&ready&&!(player&&player.r949Summon)){let best=null;for(let i=rec.length-1;i>=st;i--){const c=rec[i];if(mine(c)){if(!best)best=c;rec.splice(i,1);stats.hidden++;}}if(best)caught=anchorOf(best);}}catch(e){fail(e);}return r;};
 w.__r1302=true;drawHero=w;}
function anchorOf(c){const pts=c.points;if(!Array.isArray(pts)||pts.length<4)return null;const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 return {x:(Math.min(...xs)+Math.max(...xs))/2,y:Math.max(...ys),alpha:Math.max(0,Math.min(1,c.style?.globalAlpha??1))};}
function process(commands){if(!Array.isArray(commands))return;stats.frames++;pending=caught;caught=null;
 if(!active()){return;}if(!ready){load();return;}
 let best=null;for(let i=commands.length-1;i>=0;i--){const c=commands[i];if(c?.kind==='image'&&c.owner?.kind==='hero')stats.heroImgs++;if(mine(c)){if(!best)best=c;commands.splice(i,1);stats.hidden++;}}
 if(best&&!pending)pending=anchorOf(best);}
const ATK_SEC=.45;/* 게임 공격 자세(attackAnim)는 0.24초라 0.73초 클립을 다 보이게 공격이 시작되면 0.45초 동안 끝까지 튼다(걷기 시작하면 끊음) */
let atkT=-1,lastAtk=0;
function action(){const a=+player.attackAnim||0;if(a>lastAtk+1e-4)atkT=0;lastAtk=a;if(a>0&&atkT<0)atkT=0;
 if(atkT>=0&&atkT<ATK_SEC&&!(player.moving&&a<=0))return 'attack';atkT=-1;if(player.moving)return 'walk';return 'idle';}
const DIR={front:0,down:0,right:Math.PI/2,back:Math.PI,up:Math.PI,left:-Math.PI/2};
function draw(){const cv=canvas;if(!ready||!cv)return;
 if(!pending||!active()){if(cv.style.display!=='none'){renderer.clear();cv.style.display='none';stats.cleared++;}return;}
 const st=stage(),rect=st.getBoundingClientRect();if(!(rect.width>0&&rect.height>0))return;
 // 영웅 둘레 상자만 그린다(전체 화면 캔버스보다 칠할 픽셀이 훨씬 적어 렉이 작다). 상자 = 가로 3.2h × 세로 2.3h, 발은 상자 안 (1.6h, 1.9h).
 const h=Math.max(16,typeof actorHeight==='function'?actorHeight():60),bw=Math.ceil(h*3.2),bh=Math.ceil(h*2.3),fx=h*1.6,fy=h*1.9;
 const dpr=Math.min(window.devicePixelRatio||1,1.5);renderer.setPixelRatio(dpr);if(lastBox!==bw+'x'+bh){renderer.setSize(bw,bh,false);cv.style.width=bw+'px';cv.style.height=bh+'px';lastBox=bw+'x'+bh;}
 cv.style.left=(pending.x-fx).toFixed(1)+'px';cv.style.top=(pending.y-fy).toFixed(1)+'px';cv.style.display='block';
 // 모델 1.75m 가 화면에서 h*SCALE px 가 되게(정사영 앙각 ELEV: 세로 길이 × cos). 원점(발)이 상자 안 (fx,fy) 에 오게 시야를 민다.
 const k=MODEL_H*Math.cos(ELEV)/(h*SCALE);camera.left=-fx*k;camera.right=(bw-fx)*k;camera.top=fy*k;camera.bottom=-(bh-fy)*k;camera.updateProjectionMatrix();
 const now=typeof time==='number'?time:performance.now()/1000,dt=Math.max(0,Math.min(.1,now-lastT));lastT=now;
 const act=action();lastAction=act;
 const vx=+player.moveVX150||0,vy=+player.moveVY150||0;
 if(act==='walk'&&Math.hypot(vx,vy)>1e-3){const sx=vx-vy,sy=(vx+vy)*.5;yawTarget=Math.atan2(sx,sy);}
 else if(player.direction!==lastDir||act==='attack'){const d=DIR[String(player.direction||'').toLowerCase()];if(d!==undefined&&(player.direction!==lastDir||act==='attack'))yawTarget=d;}
 lastDir=player.direction;
 let df=yawTarget-yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;yaw+=df*Math.min(1,dt*14);group.rotation.y=yaw;
 for(const k in actions)actions[k].act.enabled=(k===act);const A=actions[act];
 // 공격은 게임 공격 시간(attackAnim 0.24→0)에 맞춰 클립 위치를 정하고, 걷기·대기는 게임 시간으로 돌린다.
 if(act==='attack'){A.act.time=Math.min(1,atkT/ATK_SEC)*A.clip.duration*.999;atkT+=dt;}
 else{if(curAct!==act)A.act.time=0;A.act.time=(A.act.time+dt*(act==='walk'?1.15:1))%A.clip.duration;}
 curAct=act;mixer.update(0);for(const m of mats)m.opacity=pending.alpha;group.updateMatrixWorld(true);renderer.render(scene,camera);stats.drawn++;}
// ---- 렌더러 감싸기(perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입·인스턴스 둘 다, R350 방식) ----
let depth=0;const wrapped=new WeakSet();
const wrapFn=fn=>{if(fn.__r1302)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;let r;try{r=fn.apply(this,arguments);}finally{depth--;}
 if(depth===0){try{draw();}catch(e){fail(e);}}return r;};w.__r1302=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
// 3D 가 그려지지 않는 프레임(Legacy·창·다른 영웅)에서는 캔버스를 비운다.
(function tick(){wrapInst();if(document.readyState==='complete')wrapHero();try{if(canvas&&canvas.style.display!=='none'){const st=window.__STORYWORLD_PHASE1__?.controller?.state;if(!active()||st?.active!=='three'){renderer?.clear();canvas.style.display='none';stats.cleared++;}}}catch(e){fail(e);}requestAnimationFrame(tick);})();
// ---- 설정 창 한 줄 ----
function row(){const doc=document;if(doc.getElementById('hwando3dR1302Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;
 const d=doc.createElement('div');d.id='hwando3dR1302Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="hwando3dR1302Toggle"> 3D 환도(시험)</label><p class="small muted">환도를 입체 모델로 그립니다(2D 와 비교용). 처음 켤 때 모델 약 4MB 를 받습니다. 판정·스킬·이펙트는 같습니다. 기본은 끔.</p>';
 host.appendChild(d);const el=d.querySelector('#hwando3dR1302Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{row();}catch(e){fail(e);}return r;};}
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('hwando3dR1302Toggle');if(el)el.checked=on;if(on)load();else if(canvas){renderer?.clear();canvas.style.display='none';}return on;}
if(on&&document.readyState!=='loading')ensureCanvas();
// 검사용: 마지막 자세를 다시 그려 바로 읽은 칠한 상자(CSS px). 그림을 바꾸지 않는다.
function measure(){if(!ready||!canvas||canvas.style.display==='none')return null;renderer.render(scene,camera);const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);
 gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);let n=0,minY=1e9,maxY=-1,sx=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(px[(y*w+x)*4+3]>40){n++;const yy=h-1-y;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;sx+=x;}}
 const k=w/Math.max(1,canvas.clientWidth);const ox=parseFloat(canvas.style.left)||0,oy=parseFloat(canvas.style.top)||0;return n?{ink:n,top:oy+minY/k,bottom:oy+(maxY+1)/k,cx:ox+sx/n/k,anchor:pending?{x:pending.x,y:pending.y}:null}:{ink:0};}
window.__STORYWORLD_HWANDO3D_R1302__=Object.freeze({revision:REV,glb:GLB,on:()=>on,set,load:()=>load(),measure,
 inspect:()=>({revision:REV,on,ready,action:lastAction,yaw:+yaw.toFixed(3),loadMs:stats.loadMs,...stats,lastError,canvas:!!canvas,shown:!!canvas&&canvas.style.display!=='none'})});
})();
