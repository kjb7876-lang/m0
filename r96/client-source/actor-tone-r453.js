// R453 — 영웅·몹 빛 맞춤(사용자 2026-11-09 "영웅몬스터는 자산교체는 안하고 코드로 적용해서 이질감없게끔 같이 작업해").
//  R451 국지 조명이 바닥·벽만 밝히면 영웅·몹 그림은 어디서나 같은 밝기·색이라 등불 밑에서도, 어둠 속에서도 '붙여 놓은' 것처럼 떠 보인다.
//  그림(자산)은 그대로 두고, 그릴 때만 세 가지를 맞춘다(R451 이 빛을 맡을 때만, 끄면 예전 그대로):
//   1) 밝기·색 — 발밑 빛(R451 lightAt: 지역 바탕빛 + 조명맵 + 영웅 둘레 빛)을 몸 색에 곱한다. 그림은 이미 칠해진 명암이 있어
//      바닥만큼 세게는 아니고 절반쯤(어둠 쪽 .62, 밝은 쪽 .5 비율, .72~1.22 안). 등불 밑은 따뜻하게, 형광등 밑은 차게 물든다.
//   2) 채도 — 바탕(어둡고 채도 낮음)에 맞춰 몸 채도를 조금 낮춘다(몹 .8·영웅 .88, 빛 밑에서는 덜 낮춤) — 읽기(R409 테두리)는 그대로 둔다.
//   3) 왼쪽 위 가는 테 빛 — 이 게임 그림 규칙(광원 왼쪽 위)대로, 몸 실루엣의 왼쪽 위 가장자리 1.5px 만 살짝 밝힌다.
//      셰이더가 화면 기준 왼쪽 위 방향으로 그림 투명도를 한 번 더 읽어 가장자리를 찾으므로 좌우 뒤집힌 몹·영웅도 늘 화면 왼쪽 위가 밝다
//      (R409 구운 그림을 다시 굽지 않음 — 굽기 캐시·렉 수정 #335 에 부담 없음). 테 세기는 발밑 빛이 밝을수록 조금 세진다.
//  몹 그림자는 만들지 않는다(R443). 판정·피해·AI·저장·그림 원본은 바꾸지 않는다.
//  끄기: 설정 '영웅·몹 빛 맞춤 (R453)' 또는 localStorage['storyworld.r453.actorTone']='{"on":false}'.
(()=>{'use strict';
if(window.__STORYWORLD_ACTOR_TONE_R453__)return;
const REV='R453-actor-tone-2',KEY='storyworld.r453.actorTone';
const DEFAULTS=Object.freeze({on:true,rim:true});
let prefs={...DEFAULTS};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');for(const k in DEFAULTS)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,actors:0,toned:0,ghosts:0,rimmed:0,patched:0,sharedSkips:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=v=>Number.isFinite(v);
const R451=()=>window.__STORYWORLD_LOCAL_LIGHT_R451__;
const owns=()=>{try{return !disposed&&prefs.on&&!!R451()?.owns?.();}catch(_){return false;}};

// ---- 1) 밝기·색 -----------------------------------------------------------------------------------------------
// 빛 L(채널별, R451 어깨 뒤 .6~1.5) → 몸에 곱할 값. 1 이 '그림 그대로'.
const DARK=.62,BRIGHT=.5,TMIN=.72,TMAX=1.22;
function toneOf(L){const t=[0,0,0];for(let c=0;c<3;c++){const v=L[c]-1;t[c]=clamp(1+v*(v<0?DARK:BRIGHT),TMIN,TMAX);}return t;}
// ---- 2) 채도 ---------------------------------------------------------------------------------------------------
const SAT={enemy:.8,hero:.88};
function satOf(kind,L){const base=SAT[kind]??.86,lit=clamp(((L[0]+L[1]+L[2])/3-.85)/.5,0,1);return base+(1-base)*.5*lit;}// 빛 밑은 색이 더 산다
const LR=.2126,LG=.7152,LB=.0722;
// ---- 3) 왼쪽 위 테 빛 ------------------------------------------------------------------------------------------
const RIM_PX=1.5,RIM_BASE=.13,RIM_LIT=.17,RIM_C=[1,.93,.82];
const RIM_GLSL=`
#ifdef USE_MAP
if(r453RimK>0.){vec2 r453dx=dFdx(vMapUv),r453dy=dFdy(vMapUv);vec2 r453o=(-r453dx+r453dy)*(r453RimPx*.7071);
 float r453a0=texture2D(map,vMapUv).a,r453a1=texture2D(map,vMapUv+r453o).a,r453a2=texture2D(map,vMapUv+r453o*.5).a;
 float r453in=smoothstep(.95,.995,r453a0),r453edge=1.-smoothstep(.86,.97,min(r453a1,r453a2+.03));
 gl_FragColor.rgb=min(gl_FragColor.rgb+r453RimC*(r453RimK*r453in*r453edge),vec3(1.));}
#endif
`;
// 화면 왼쪽 위 = 창 좌표(-x,+y). dFdx·dFdy 가 그림 u·v 를 화면 방향으로 바꿔 주므로 뒤집힌 그림도 같은 화면 쪽을 읽는다.
const patched=new WeakMap();
function patch(m){if(patched.has(m))return patched.get(m);const T=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.T;if(!T)return null;
 const u={r453RimK:{value:0},r453RimC:{value:new T.Vector3(...RIM_C)},r453RimPx:{value:RIM_PX}},before=m.onBeforeCompile,key=m.customProgramCacheKey,ownKey=Object.prototype.hasOwnProperty.call(m,'customProgramCacheKey');
 const wrapper=function(shader,...args){if(typeof before==='function')before.call(this,shader,...args);Object.assign(shader.uniforms,u);
  if(!shader.fragmentShader.includes('uniform float r453RimK;')&&shader.fragmentShader.includes('#include <colorspace_fragment>'))
   shader.fragmentShader='uniform float r453RimK;uniform vec3 r453RimC;uniform float r453RimPx;\n'+shader.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\n'+RIM_GLSL);};
 if(typeof before==='function')for(const k of Object.keys(before))wrapper[k]=before[k];
 m.onBeforeCompile=wrapper;m.customProgramCacheKey=function(){let k='';try{k=ownKey&&typeof key==='function'?String(key.call(this)):String(before||'');}catch(_){}return k+'|r453';};m.needsUpdate=true;
 patched.set(m,u);stats.patched++;return u;}

// ---- 그리기 ----------------------------------------------------------------------------------------------------
const ACTOR=new Set(['hero','enemy']);
// R448 실루엣(가려진 영웅을 앞 조형물 덮개 위에 .58 로 한 번 더 그린 것)도 영웅과 같은 빛·테를 받아야 조형물 뒤로 갈 때만 영웅이 밝아지지 않는다.
//  기록기가 실루엣의 주인을 effect 로 바꾸고 id·r448 표시는 버리므로(실측: owner={kind,groundAligned,x,y,…}) 줄 열쇠(명령 key 'r448:ghost:…')로 알아본다.
//  주인 x·y 는 영웅 것 그대로다. 오라·결계 같은 다른 효과 줄은 스스로 빛나는 것이라 건드리지 않는다.
const R448_GHOST='r448:ghost:';
function actorKind(key,ow){if(!ow)return null;if(ACTOR.has(ow.kind))return ow.kind;return ow.kind==='effect'&&typeof key==='string'&&key.startsWith(R448_GHOST)?'hero':null;}
const GL_TOKEN={};
function wrapGL(r){const gl=r.renderer;if(!gl||gl.r453Wrapped===GL_TOKEN)return;const base=gl.render;
 gl.render=function(scene,camera){const restore=[];
  // 영웅·몹 몸 그림은 대개 덧그림 층(3, 깊이 지운 뒤)에, 벽 뒤 등은 세계 층(2)에 있다 — 두 그리기 모두에서 그 층에 있는 줄만 맞춘다.
  try{const pass=camera?.layers?.mask;if(scene===r.scene&&camera===r.camera&&(pass===4||pass===8)){const on=owns();if(pass===8)stats.frames++;const seenMat=new Set(),seenF=new Set(),dpr=typeof gl.getPixelRatio==='function'?gl.getPixelRatio():1;
    for(const [key,row] of r.commands?.rows?.entries?.()||[]){const ow=row?.geometryState?.owner,mesh=row?.mesh,m=mesh?.material,kind=actorKind(key,ow);
     if(!kind||!m||!m.map||!m.color||ow.groundAligned===true||!mesh.visible||!(mesh.layers.mask&pass)||!finite(ow.x+ow.y))continue;
     stats.actors++;let u=patched.get(m);
     if(!on){if(u)u.r453RimK.value=0;continue;}
     if(!u&&prefs.rim)u=patch(m);
     if(seenMat.has(m)){stats.sharedSkips++;continue;}seenMat.add(m);
     const L=R451().lightAt(ow.x,ow.y);if(!L)continue;
     const t=toneOf(L),rr=m.color.r,gg=m.color.g,bb=m.color.b;restore.push(()=>m.color.setRGB(rr,gg,bb));m.color.setRGB(rr*t[0],gg*t[1],bb*t[2]);stats.toned++;if(ow.kind==='effect')stats.ghosts++;
     const f=m.userData?.filter?.m;if(f?.elements&&!seenF.has(f)){seenF.add(f);const s=satOf(kind,L);if(s<.999){const saved=f.elements.slice(),q=1-s,S=new f.constructor();
       S.set(s+q*LR,q*LG,q*LB, q*LR,s+q*LG,q*LB, q*LR,q*LG,s+q*LB);f.multiply(S);restore.push(()=>f.fromArray(saved));}}
     if(u){if(prefs.rim){const avg=(L[0]+L[1]+L[2])/3,lit=clamp((avg-.7)/.6,0,1),mx=Math.max(L[0],L[1],L[2],1e-3);u.r453RimK.value=RIM_BASE+RIM_LIT*lit;
       u.r453RimC.value.set(RIM_C[0]*(.6+.4*L[0]/mx),RIM_C[1]*(.6+.4*L[1]/mx),RIM_C[2]*(.6+.4*L[2]/mx));u.r453RimPx.value=RIM_PX*clamp(dpr,1,3);stats.rimmed++;}
      else u.r453RimK.value=0;}}}}catch(e){fail(e);}
  try{return base.call(this,scene,camera);}finally{for(let i=restore.length-1;i>=0;i--)restore[i]();}};
 gl.r453Wrapped=GL_TOKEN;}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r?.renderer&&r.scene&&r.commands)wrapGL(r);}catch(e){fail(e);}}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();

// ---- 설정 ----------------------------------------------------------------------------------------------------
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){for(const k in DEFAULTS)if(typeof p[k]==='boolean')prefs[k]=p[k];save();return{...prefs};}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('actorToneR453'))return;
 const s=document.createElement('section');s.id='actorToneR453';
 s.innerHTML='<h3>영웅·몹 빛 맞춤 (R453)</h3><p class="small muted">국지 조명이 켜져 있을 때 영웅·몹이 발밑 빛에 맞춰 밝기·색이 바뀌고, 왼쪽 위 가장자리에 가는 빛 테가 생깁니다. 그림 원본은 그대로입니다.</p>'+
  [['on','발밑 빛에 맞춘 밝기·색'],['rim','왼쪽 위 가는 테 빛']].map(([k,l])=>'<label><input type="checkbox" data-r453="'+k+'"> '+l+'</label>').join(' ');
 panel.appendChild(s);s.querySelectorAll('[data-r453]').forEach(el=>{el.checked=!!prefs[el.dataset.r453];el.onchange=()=>set({[el.dataset.r453]:el.checked});});}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!disposed)settingsSection();}catch(e){fail(e);}return r;};}
function dispose(){disposed=true;if(timer)clearInterval(timer);}
window.__STORYWORLD_ACTOR_TONE_R453__=Object.freeze({revision:REV,storageKey:KEY,prefs:()=>({...prefs}),set,toneOf,satOf,dispose,pure:Object.freeze({toneOf,satOf,patch,actorKind,RIM_GLSL,TMIN,TMAX,SAT}),
 inspect:()=>({revision:REV,prefs:{...prefs},owns:owns(),stats:{...stats},lastError,assetsChanged:false,shadowsAdded:false,gameplayChanged:false,GPUVerified:false})});
})();
