// R186 — 사몽 맵 바닥 밖 검은 공간을 뇌·내장 주름 타일로 채움(사용자 2026-10-31 "사몽 맵 검은 공간을 뇌·위장 같은 기괴한 타일로").
//  사몽 구역(R103·R115)에서만, 바닥·배경보다 아래(y=-0.12)에 구역보다 넓은 판을 하나 깔고 자체 생성 텍스처(assets/r186/flesh-void.webp, 이음매 없음)를 반복한다.
//  아주 천천히 숨 쉬듯 밝기가 바뀐다. 바닥·벽·충돌·길은 그대로이고 판은 하나(그리기 1번). 본편·함께하기에는 깔지 않는다.
//  임시 자산 — 좋은 자산이 오면 텍스처만 바꾼다. storyworld.r186.void {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_VOID_R186__)return;
const REV='R186-void-2',KEY='storyworld.r186.void',TEX='assets/r186/flesh-void.webp';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={planes:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const isSamong=f=>{const L=f?.exploration;return !!(L&&(L.type==='r103-samong'||L.samongR103||L.samongR105||(typeof room==='object'&&room?.samongR103&&room.exploration===L)));};
function install(){const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!C||typeof C.render!=='function')return false;
 function drop(r){if(r.r186Void){try{r.spatialRoot?.remove(r.r186Void);r.r186Void.geometry?.dispose();}catch(e){fail(e);}}r.r186Void=null;r.r186Key=null;}
 function sync(r,frame){const T=r.T;if(!prefs.on||!solo()||!T||!r.spatialRoot||!isSamong(frame)){if(r.r186Void)r.r186Void.visible=false;return;}
  const L=frame.exploration,key=String(L.id||'')+':'+(L.bounds||[]).join(',');
  if(r.r186Key!==key){drop(r);const b=L.bounds||[0,0,64,64],w=(b[2]-b[0])+160,h=(b[3]-b[1])+160;
   const tex=new T.TextureLoader().load(TEX);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(w/9,h/9);
   const m=new T.MeshBasicMaterial({map:tex,color:0xb09898,side:T.DoubleSide,toneMapped:false,depthWrite:false});m.name='r186-flesh-void';
   const mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.rotation.x=-Math.PI/2;mesh.position.set((b[0]+b[2])/2,-.12,(b[1]+b[3])/2);mesh.renderOrder=-4;mesh.name='r186-void';mesh.layers.set(2);
   mesh.userData={presentationOnly:true,r186Void:true,collisionChanged:false};r.spatialRoot.add(mesh);r.spatialResources?.add(tex);r.spatialResources?.add(m);r.r186Void=mesh;r.r186Key=key;stats.planes++;}
  const mesh=r.r186Void;mesh.visible=true;const s=performance.now()/1000,k=.9+.1*Math.sin(s*.7);mesh.material.color.setRGB(1.25*k,1.0*k,1.0*k);}
 const renderBase=C.render;C.render=function(frame){try{sync(this,frame);}catch(e){fail(e);}return renderBase.call(this,frame);};
 /* perf-r97 이 렌더러 인스턴스에 render 를 복사해 두므로(이 파일보다 먼저 설치되면 위 prototype 손질이 안 탐) 인스턴스도 감싼다 */
 const WRAPPED=new WeakSet();
 const wrapInst=()=>{try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||!Object.prototype.hasOwnProperty.call(r,'render')||WRAPPED.has(r))return;WRAPPED.add(r);/* R192: 렌더러마다 한 번만 — 예전엔 R186·R188 이 서로의 감싸기를 보고 0.5초마다 다시 감싸 사슬이 끝없이 길어졌다(렉·스택 초과) */const b=r.render;const w=function(frame){try{sync(this,frame);}catch(e){fail(e);}return b.call(this,frame);};w.__r186=true;r.render=w;stats.instWrapped=(stats.instWrapped||0)+1;}catch(e){fail(e);}};
 setInterval(wrapInst,500);wrapInst();
 const clearBase=C.clearScene;C.clearScene=function(...a){try{drop(this);}catch(e){fail(e);}return clearBase.apply(this,a);};return true;}
let ok=false;try{ok=install();}catch(e){fail(e);}
/* R187: 환경 설정 창에 켜고 끄기 */
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');if(grid&&!document.getElementById('r186Void')){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='r186Void';c.checked=prefs.on!==false;c.onchange=()=>set({on:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 사몽 빈 공간 살덩이 무늬'));grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_VOID_R186__=Object.freeze({revision:REV,TEX,set,inspect:()=>({revision:REV,installed:ok,prefs:{...prefs},stats:{...stats},lastError})});
})();
