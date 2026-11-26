// R1325 3D 몹·2D 몹 이질감 줄이기 시범(사용자 2026-11-26 "3d몹들과 기존 2d몹들 너무 이질감 없게 하는법 없나").
//  2D 몹은 손그림 프레임 몇 장을 끊어 넘기고, 먹 윤곽이 굵고, 명암이 몇 단으로 끊긴다. 3D 는 매끈하게 이어져 '다른 게임' 처럼 보였다.
//  ① 모션을 초당 FPS 장으로 끊는다: 각 3D 몹 오버레이가 자세를 뼈에 넣기 전(mixer.update(0)) hold(i,t) 를 묻고, 1/FPS 초가 안 지났으면 이전 자세를 붙잡는다.
//     (자리 이동은 2D 몹처럼 매끈하게 그대로 — 몸 자세만 끊는다.)
//  ② 명암 BANDS 단(셀 음영): 몸 재질의 밝기를 단으로 묶되 원화 결은 남기게 반쯤만 섞는다.
//  ③ 먹 윤곽 INK_MUL 배 굵게: 각 오버레이의 먹 껍질(뒤집은 껍질) 두께에 곱한다.
//  ④ 색 맞춤: 같은 몹의 2D 몸 그림(오버레이가 빼기 전 그 칸)과 3D 텍스처의 평균색(먹 선·하이라이트 뺀 중간 밝기)을 재서,
//     3D 몸에 채널별 배율(r1325Tint)을 TINT_MIX 만큼 곱한다(예: 2D 베이지 점액체 ↔ 3D 초록 점액체). 재질당 한 번.
//  · 대상: 기본 꺼짐 3D 묶음 R1316·R1317·R1322·R1322c(이름 r13xx-mob3d:). 공개판 기본 켜짐 3D(첫 맵·탐식 보스)는 손맞춤 톤이라 건드리지 않는다.
//  · 켜고 끄기: storyworld.r1325.mobstyle('on'|'off'), 주소 ?mobstyle25=1·0. 기본 켜짐(3D 몹 자체가 기본 꺼짐이라 켠 사람에게만 보인다).
//  · 미검증: GPU 실기기·모바일 프레임·실제 플레이 손맛(헤드리스만 봄).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_STYLE_R1325__)return;
const REV='R1325-mobstyle-1',KEY='storyworld.r1325.mobstyle',FPS=10,BANDS=3,INK_MUL=1.7,MIX=.55,TINT_MIX=.75;
const GROUP=/^r13(16|17|22c|22)-mob3d:/;
let on=true;
try{const v=localStorage.getItem(KEY);if(v==='off')on=false;else if(v==='on')on=true;}catch(_){}
try{const m=/[?&]mobstyle25=([01])\b/.exec(location.search);if(m)on=m[1]==='1';}catch(_){}
const stats={held:0,applied:0,body:0,ink:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.stack||e?.message||e).slice(0,300);};
// ① 자세 끊기 — 각 오버레이 animate() 가 부른다. true 면 이번 프레임은 뼈에 새 자세를 넣지 않는다.
function hold(i,t){try{if(!on||!i||!Number.isFinite(t))return false;
  if(i.r1325Pose!==i.pose||!Number.isFinite(i.r1325At)||t<i.r1325At||t-i.r1325At>=1/FPS-1e-6){i.r1325At=t;i.r1325Pose=i.pose;stats.applied++;return false;}
  stats.held++;return true;}catch(e){fail(e);return false;}}
// ②③ 재질 손질(한 번씩, 끄면 원래대로)
const orig=new WeakMap();
const BODY_GLSL=`
gl_FragColor.rgb*=r1325Tint;
float r1325L=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
float r1325Q=floor(r1325L*${BANDS}.0+.5)/${BANDS}.0;
gl_FragColor.rgb*=mix(1.0,clamp(r1325Q/max(r1325L,.04),.6,1.5),${MIX.toFixed(2)});`;
function patch(m,kind){if(!m||orig.has(m))return;const ob=m.onBeforeCompile,ok=m.customProgramCacheKey;orig.set(m,{ob,ok,kind});
 m.onBeforeCompile=function(shader,...a){if(typeof ob==='function')ob.call(this,shader,...a);
  if(kind==='ink')shader.vertexShader=shader.vertexShader.replace('transformed += normalize( objectNormal ) * ','transformed += normalize( objectNormal ) * '+INK_MUL.toFixed(2)+' * ');
  else{shader.uniforms=shader.uniforms||{};shader.uniforms.r1325Tint=tintOf(m);shader.fragmentShader='uniform vec3 r1325Tint;\n'+shader.fragmentShader;}
  if(kind==='ink');else if(shader.fragmentShader.includes('#include <dithering_fragment>'))shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>'+BODY_GLSL);
  else shader.fragmentShader=shader.fragmentShader.replace(/}\s*$/,BODY_GLSL+'\n}');};
 m.customProgramCacheKey=function(){return(typeof ok==='function'?ok.call(this):'')+'|r1325-'+kind;};m.needsUpdate=true;stats[kind]++;}
// ④ 색 맞춤 — 평균색(알파 큰 칸, 밝기 .12~.92) 재기
const tints=new WeakMap();let probe=null;
function tintOf(m){let u=tints.get(m);if(!u){const T=host()?.T;u={value:T?new T.Vector3(1,1,1):{x:1,y:1,z:1,set(){}}};tints.set(m,u);}return u;}
function avgRGB(img,sx,sy,sw,sh){if(!img||!(sw>2&&sh>2))return null;const W=Math.min(64,Math.round(sw)),H=Math.min(64,Math.round(sh));probe=probe||document.createElement('canvas');probe.width=W;probe.height=H;
 const g=probe.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,W,H);g.drawImage(img,sx,sy,sw,sh,0,0,W,H);const d=g.getImageData(0,0,W,H).data;let r=0,gg=0,b=0,n=0;
 for(let k=0;k<d.length;k+=4){if(d[k+3]<160)continue;const R=d[k]/255,G=d[k+1]/255,B=d[k+2]/255,L=.2126*R+.7152*G+.0722*B;if(L<.12||L>.92)continue;r+=R;gg+=G;b+=B;n++;}
 return n>20?[r/n,gg/n,b/n]:null;}
const sampled=new WeakSet(),stat2D=new Map();
function sample(i,rows){try{if(!on||!i?.meshes)return;const key=String(i.g?.name||'').split(':')[0]+'|'+i.kind;
  if(!stat2D.has(key)){const c=(rows||[]).find(c=>c?.image&&Array.isArray(c.sourceRect));if(!c)return;const [sx,sy,sw,sh]=c.sourceRect;stat2D.set(key,avgRGB(c.image,sx,sy,sw,sh));}
  const a2=stat2D.get(key);if(!a2)return;
  for(const o of i.meshes){if(/-ink-shell$/.test(String(o.name||'')))continue;for(const m of [].concat(o.material)){if(!m||sampled.has(m))continue;sampled.add(m);
   const im=m.map?.image;const a3=im?avgRGB(im,0,0,im.width,im.height):null;if(!a3)continue;
   const t=[0,1,2].map(c=>1+(Math.max(.55,Math.min(1.8,a2[c]/Math.max(.04,a3[c])))-1)*TINT_MIX);tintOf(m).value.set(t[0],t[1],t[2]);stats.tinted=(stats.tinted||0)+1;
   lastTint={key,a2:a2.map(v=>+v.toFixed(3)),a3:a3.map(v=>+v.toFixed(3)),t:t.map(v=>+v.toFixed(3))};}}}catch(e){fail(e);}}
let lastTint=null;
function unpatch(m){const o=orig.get(m);if(!o)return;m.onBeforeCompile=o.ob;m.customProgramCacheKey=o.ok;m.needsUpdate=true;orig.delete(m);}
const host=()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three||null;
function each(fn){const r=host();if(!r?.scene)return;for(const g of r.scene.children)if(GROUP.test(String(g.name||'')))g.traverse(o=>{if(!o.isMesh)return;
 const ink=/-ink-shell$/.test(String(o.name||''));for(const m of [].concat(o.material))if(m)fn(m,ink?'ink':'body');});}
let lastScan=-1;
function scan(){try{const t=performance.now();if(t-lastScan<400)return;lastScan=t;if(on)each((m,k)=>patch(m,k));}catch(e){fail(e);}}
function loop(){scan();requestAnimationFrame(loop);}requestAnimationFrame(loop);
function set(v){on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}if(!on)try{each(m=>unpatch(m));}catch(e){fail(e);}else{lastScan=-1;scan();}
 const el=document.getElementById('mobStyleR1325Toggle');if(el)el.checked=on;return on;}
function row(){const doc=document;if(doc.getElementById('mobStyleR1325Row'))return;const h=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!h)return;
 const d=doc.createElement('div');d.id='mobStyleR1325Row';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="mobStyleR1325Toggle"> 3D 몹 2D 풍 손질(시험)</label><p class="small muted">켠 3D 몹을 2D 몹처럼 보이게: 모션을 초당 10장으로 끊고, 명암을 3단으로, 먹 윤곽을 굵게. 3D 몹 설정을 켰을 때만 보입니다.</p>';
 h.appendChild(d);const el=d.querySelector('#mobStyleR1325Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
try{const mo=new MutationObserver(()=>row());mo.observe(document.documentElement,{childList:true,subtree:true});row();}catch(_){}
function inspect(){let body=0,ink=0;try{each((m,k)=>{if(orig.has(m)){if(k==='ink')ink++;else body++;}});}catch(e){fail(e);}return {revision:REV,on,fps:FPS,bands:BANDS,inkMul:INK_MUL,patched:{body,ink},lastTint,stats:{...stats},lastError};}
window.__STORYWORLD_MOB3D_STYLE_R1325__=Object.freeze({revision:REV,on:()=>on,set,hold,sample,inspect,scan:()=>{lastScan=-1;scan();}});
})();
