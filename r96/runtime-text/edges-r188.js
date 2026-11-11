// R188 — 바닥 가장자리를 곡선으로(사용자 2026-11-01 "맵 타일 등이 너무 사각형으로만 되어 있어 생동감이 적음 — 곡선 형태로 서로 이어져 자연스럽게").
//  바닥·바닥 밖 배경(R59) 사각형이 1칸 계단 모양으로 빈 공간과 만나는 곳(벽이 없는 가장자리)을, 구역마다 한 번 만든 가장자리 가림판 하나로
//  물결치는 곡선 해안선처럼 덮는다. 가림판은 빈 공간과 같은 그림(사몽: R186 살덩이 무늬, 같은 세계 좌표로 이어짐 / 그 밖: 어두운 빈 색)이고
//  흐림+잡음 문턱으로 알파를 정한다. 벽 가까이는 덮지 않는다(벽이 이미 경계). 충돌·길·바닥 판정은 그대로 — 보이는 가장자리만 최대 약 1칸 안쪽으로 부드럽게 깎인다.
//  그리기 1번(판 하나), 구역 바뀔 때 한 번 계산. storyworld.r188.edges {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_EDGES_R188__)return;
const REV='R188-edges-2',KEY='storyworld.r188.edges',PX=4,PAD=4;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={built:0,ms:0,errors:0,reused:0,cached:0,cachedPx:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const isSamong=L=>!!(L&&(L.samongR103||L.samongR115||L.type==='r103-samong'));
// 값 잡음(세계 좌표 기준, 결정적)
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295;};
const sm=t=>t*t*(3-2*t);
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi);const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;}
const fbm=(x,y)=>.6*vnoise(x*.28,y*.28)+.28*vnoise(x*.8+31,y*.8+17)+.12*vnoise(x*2.3+7,y*2.3+3);
function buildMask(L){const t0=performance.now(),b=L.bounds,x0=b[0]-PAD,y0=b[1]-PAD,W=Math.ceil((b[2]-b[0]+2*PAD)*PX),H=Math.ceil((b[3]-b[1]+2*PAD)*PX);
 if(W*H>2.6e6)return null;
 const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
 const area=mk(),ag=area.getContext('2d');ag.fillStyle='#000';ag.fillRect(0,0,W,H);ag.fillStyle='#fff';
 for(const r of [...(L.floorRects||[]),...(L.backdropRects||[]),...(L.connectorFloorRects||[])])if(r&&r.width>0&&r.depth>0)ag.fillRect((r.x-x0)*PX,(r.y-y0)*PX,r.width*PX,r.depth*PX);
 const soft=mk(),sg=soft.getContext('2d');sg.filter=`blur(${PX*2.2}px)`;sg.drawImage(area,0,0);
 const wall=mk(),wg=wall.getContext('2d');wg.fillStyle='#000';wg.fillRect(0,0,W,H);wg.filter=`blur(${PX*.9}px)`;wg.fillStyle='#fff';
 for(const w of L.walls||[]){if(!w||!(w.width>0)||!(w.depth>0))continue;const ww=Math.max(w.width,1.6),dd=Math.max(w.depth,1.6);wg.fillRect((w.x-ww/2-x0)*PX,(w.y-dd/2-y0)*PX,ww*PX,dd*PX);}
 const A=ag.getImageData(0,0,W,H).data,S=sg.getImageData(0,0,W,H).data,Wl=wg.getImageData(0,0,W,H).data,out=ag.createImageData(W,H),O=out.data;let any=0;
 for(let j=0;j<H;j++){const wy=y0+(j+.5)/PX;for(let i=0;i<W;i++){const k=(j*W+i)*4,inside=A[k]>127,s=S[k]/255;let a=0;
   if(s>.01&&s<.998||!inside){const n=fbm(x0+(i+.5)/PX,wy)-.5,v=s+n*1.05,keep=v<=.38?0:v>=.62?1:sm((v-.38)/.24);a=1-keep;if(!inside)a=Math.max(a,.0);a*=1-Math.min(1,Wl[k]/255*1.4);}
   if(!inside&&s<.01)a=0;/* 멀리 빈 곳은 원래 그림(R186 판·빈 색)이 그대로 */
   const g=Math.round(a*255);O[k]=O[k+1]=O[k+2]=g;O[k+3]=255;if(g>8)any++;}}
 const c=mk();c.getContext('2d').putImageData(out,0,0);stats.ms=Math.round(performance.now()-t0);return any?{canvas:c,x0,y0,W:W/PX,H:H/PX}:null;}
// R800 렉: 같은 입력이면 가림판 그림을 다시 쓴다. 헤드리스 실측에서 지역에 들어갈 때 엔진이 장면을 두 번 비워(clearScene)
//  입력이 똑같은 판을 두 번 만들었고(한 번 0.2~0.3초), 다시 온 지역도 처음부터 다시 만들었다. 열쇠 = 판을 만드는 데 쓰는 값 전부
//  (bounds·바닥·배경·연결 바닥·벽 사각형) — 같으면 그림이 같다. 사몽 여부는 재질만 바꾸므로 열쇠에 넣지 않는다. 최근 6장·600만 화소까지.
const maskCache=new Map();let cachedPx=0;
function sigOf(L){let h=2166136261,c=0;const add=v=>{h=Math.imul(h^(Math.round((+v||0)*4096)|0),16777619);c++;};
 for(const v of L.bounds||[])add(v);
 for(const arr of [L.floorRects,L.backdropRects,L.connectorFloorRects,L.walls]){const A=arr||[];add(A.length);for(const r of A){if(!r){add(-1);continue;}add(r.x);add(r.y);add(r.width);add(r.depth);}}
 return (h>>>0).toString(36)+':'+c;}
function maskFor(L){const k=sigOf(L);if(maskCache.has(k)){const m=maskCache.get(k);maskCache.delete(k);maskCache.set(k,m);stats.reused=(stats.reused||0)+1;return m;}
 const m=buildMask(L),px=m?.canvas?m.canvas.width*m.canvas.height:0;maskCache.set(k,m);cachedPx+=px;
 for(const [k0,m0] of maskCache){if(maskCache.size<=6&&cachedPx<=6e6)break;if(k0===k)continue;maskCache.delete(k0);cachedPx-=m0?.canvas?m0.canvas.width*m0.canvas.height:0;}
 stats.cached=maskCache.size;stats.cachedPx=cachedPx;return m;}
function install(){const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!C||typeof C.render!=='function')return false;
 function drop(r){if(r.r188Edge){try{r.spatialRoot?.remove(r.r188Edge);r.r188Edge.geometry?.dispose();r.r188Edge.material?.alphaMap?.dispose();r.r188Edge.material?.dispose();}catch(e){fail(e);}}r.r188Edge=null;r.r188EdgeKey=null;}
 function sync(r,frame){const T=r.T,L=frame?.exploration;if(!prefs.on||!solo()||!T||!r.spatialRoot||!L?.bounds){if(r.r188Edge)r.r188Edge.visible=false;return;}
  const sam=isSamong(L)&&window.__STORYWORLD_SAMONG_VOID_R186__?.inspect?.().prefs?.on!==false,key=String(L.id||'')+':'+(L.bounds||[]).join(',')+':'+(sam?'s':'d');
  if(r.r188EdgeKey!==key){drop(r);r.r188EdgeKey=key;const m=maskFor(L);if(!m)return;
   const am=new T.CanvasTexture(m.canvas);am.colorSpace=T.NoColorSpace;am.flipY=true;am.needsUpdate=true;
   let mat;if(sam){const tex=new T.TextureLoader().load('assets/r186/flesh-void.webp');tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(m.W/9,m.H/9);
     /* R186 판(구역+160, 반복 9칸)과 같은 세계 좌표로 이어지게 */const b=L.bounds;tex.offset.set(((m.x0-(b[0]-80))/9)%1,(((b[3]+80)-(m.y0+m.H))/9)%1);
     mat=new T.MeshBasicMaterial({map:tex,alphaMap:am,transparent:true,depthWrite:false,toneMapped:false,color:0xd8c4c4});r.spatialResources?.add(tex);}
   else mat=new T.MeshBasicMaterial({color:0x08070b,alphaMap:am,transparent:true,depthWrite:false,toneMapped:false});
   mat.name='r188-edge';const mesh=new T.Mesh(new T.PlaneGeometry(m.W,m.H),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(m.x0+m.W/2,.012,m.y0+m.H/2);mesh.renderOrder=1;mesh.name='r188-edge';mesh.layers.set(2);
   mesh.userData={presentationOnly:true,r188Edge:true,collisionChanged:false};r.spatialRoot.add(mesh);r.spatialResources?.add(mat);r.r188Edge=mesh;stats.built++;}
  if(r.r188Edge){r.r188Edge.visible=true;if(sam){const k=.9+.1*Math.sin(performance.now()/1000*.7);r.r188Edge.material.color.setRGB(1.25*k*.86,1.0*k*.86,1.0*k*.86);}}}
 const renderBase=C.render;C.render=function(frame){try{sync(this,frame);}catch(e){fail(e);}return renderBase.call(this,frame);};
 const WRAPPED=new WeakSet();
 const wrapInst=()=>{try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||!Object.prototype.hasOwnProperty.call(r,'render')||WRAPPED.has(r))return;WRAPPED.add(r);/* R192: 렌더러마다 한 번만 — 예전엔 R186·R188 이 서로의 감싸기를 보고 0.5초마다 다시 감싸 사슬이 끝없이 길어졌다(렉·스택 초과) */const b=r.render;const w=function(frame){try{sync(this,frame);}catch(e){fail(e);}return b.call(this,frame);};w.__r188=true;r.render=w;}catch(e){fail(e);}};
 setInterval(wrapInst,500);wrapInst();
 const clearBase=C.clearScene;C.clearScene=function(...a){try{drop(this);}catch(e){fail(e);}return clearBase.apply(this,a);};return true;}
let ok=false;try{ok=install();}catch(e){fail(e);}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{const grid=document.querySelector('#panel .settings')||document.querySelector('.settings');if(grid&&!document.getElementById('r188Edges')){const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.id='r188Edges';c.checked=prefs.on!==false;c.onchange=()=>set({on:c.checked});l.appendChild(c);l.appendChild(document.createTextNode(' 바닥 가장자리 곡선'));grid.appendChild(l);}}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_EDGES_R188__=Object.freeze({revision:REV,set,buildMask,inspect:()=>({revision:REV,installed:ok,prefs:{...prefs},stats:{...stats},lastError})});
})();
