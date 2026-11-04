// R287 영웅 근처 우선 그리기 + 맵 한 번 미리 그리기(사용자 2026-11-04 "한번 모든맵 보조렌더링한 다음 영웅 근처쪽 렌더링해서 렉 최적화 …
//  영웅이 가는 근방만(시야에 보이는 곳+조금 더 주변부까지) 우선 렌더링하고 나머지는 약한 렌더링 혹은 대기").
//  측정(헤드리스, 같은 빌드): 맵 지형은 엔진이 영웅 둘레 3×3 덩어리(10칸)+화면 안만 올리고, 벗어나면 내린다(병원 벽 그림·가림 재질은 버림).
//  그래서 처음 가는 곳·되돌아오는 곳에서 덩어리를 새로 만들고 GPU 에 다시 올리느라 한 프레임이 길어진다(ep1a08 순간 이동 뒤 3D 그리기 최대 수백 ms).
//  또 2D 그리기는 맵의 모든 조형물·벽(ep1a08 222개×2번)을 매 프레임 그리고, 화면 밖 것은 엔진이 나중에 버린다.
//  ① 보조 렌더링(한 번): 지역에 들어오면 맵 전체 덩어리를 한 번 올리고(덩어리 수 상한 안이면 그대로 대기 상태로 둔다),
//     다 올라오면 화면 밖 4×4 렌더 타깃에 장면 전체를 한 번 그려 셰이더·지오메트리·텍스처를 미리 올린다. 화면에는 아무것도 그리지 않는다.
//     덩어리 그림 파일은 지역을 떠날 때까지 잡아 두고(리스), 2D 조형물 그림 텍스처도 지역 동안 잡아 둔다 → 다시 와도 다시 올리지 않는다.
//  ② 우선 렌더링: 시야(엔진이 계산한 보이는 범위)+주변 고리(RING 칸) 안의 지형 메시는 그대로 그리고, 밖의 메시는 그 프레임의 그리기 동안만
//     layers.mask=0(대기)로 두었다가 그리기가 끝나면 원래 값으로 되돌린다(엔진이 visible 을 매 프레임 다시 켜므로 visible 대신 layers).
//     덩어리 수가 상한을 넘는 큰 맵은 전체를 대기시키지 않고, 한 번 미리 올린 뒤 시야+고리(PREFETCH 칸)만 미리 올려 둔다.
//  ③ 약한 렌더링: 화면+여백 밖 조형물·벽의 2D 그리기는 PROP_EVERY 프레임에 한 번만(돌아가며) 한다 — 그림 지연 로딩·나무 그림 바꾸기 같은
//     그리기 부수 효과는 그대로 일어나고, 그 명령은 원래도 화면 밖이라 엔진이 버리던 것이다. 들어온 첫 몇 프레임은 전부 그린다(미리 그리기).
//  판정·충돌·길 찾기·몹 AI·진행은 건드리지 않는다(그리기만). room.props·room.exploration·엔진 레이아웃은 읽기만 한다.
//  끄기: localStorage['storyworld.r287.lod']='{"on":false}' (전부) — 부분: {"warm":false} {"resident":false} {"hide3d":false} {"props":false}
(()=>{'use strict';
if(window.__STORYWORLD_RENDER_LOD_R287__)return;
const REV='R287-lod-1',KEY='storyworld.r287.lod';
const CFG=Object.freeze({ring:4,prefetch:10,cap:400,capLow:120,propEvery:20,warmFrames:3,warmTimeout:900,propMarginFrac:.3,propMarginPx:160,texCap:320,texMaxPx:4096*4096});
const prefs={on:true,warm:true,resident:true,hide3d:true,props:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k in prefs)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={zones:0,warms:0,warmMs:0,warmMeshes:0,chunksResident:0,chunksAll:0,overCap:0,leases:0,texHeld:0,hidden:0,shown:0,propsNear:0,propsFar:0,propsFarDrawn:0,frames:0,errors:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const on=k=>prefs.on&&prefs[k];

// ---- 순수 계산(QA) ----
const expand=(b,m)=>[b[0]-m,b[1]-m,b[2]+m,b[3]+m];
function chunkGrid(grid){const columns=Number.isInteger(grid?.columns)&&grid.columns>0?grid.columns:3,rows=Number.isInteger(grid?.rows)&&grid.rows>0?grid.rows:3,
 minX=Number.isInteger(grid?.minX)?grid.minX:0,minY=Number.isInteger(grid?.minY)?grid.minY:0;return{columns,rows,minX,minY,count:Math.max(0,columns-minX)*Math.max(0,rows-minY)};}
/* 엔진 ChunkManager.update 가 visibleBounds 로 덩어리를 고르는 식(floor(v/size), 격자 안으로 자름) 그대로 — 맵 전체를 덮는 범위 */
function fullBounds(grid,size){const g=chunkGrid(grid);return[g.minX*size,g.minY*size,g.columns*size-1e-6,g.rows*size-1e-6];}
const finite4=b=>Array.isArray(b)&&b.length===4&&b.every(Number.isFinite);
/* 상자 [x0,y0,x1,y1] 가 범위 b 와 겹치지 않으면 true */
const outside=(box,b)=>box[2]<b[0]||box[0]>b[2]||box[3]<b[1]||box[1]>b[3];
/* 화면 상자 [x0,y0,x1,y1] 가 화면(w×h)+여백 m 밖이면 true */
const screenOutside=(s,w,h,m)=>s[2]<-m||s[0]>w+m||s[3]<-m||s[1]>h+m;
/* 먼 조형물은 propEvery 프레임에 한 번(번호로 엇갈려 한 프레임에 몰리지 않게) */
const farTurn=(id,frame,every)=>((id+frame)%every)===0;
function propMargin(w,h){return Math.max(w,h)*CFG.propMarginFrac+CFG.propMarginPx;}

// ---- 2D 조형물 화면 상자(넉넉하게) ----
const propIds=new WeakMap();let propSeq=0;
const idOf=p=>{let i=propIds.get(p);if(i===undefined){i=propSeq++;propIds.set(p,i);}return i;};
/* project() 는 아핀(등각 투영)이라 프레임마다 기준점·두 축만 구해 두고 곱셈으로 잰다(프레임마다 project 를 수백 번 부르지 않게) */
let basis=null,basisFrame=-1;
function frameBasis(){if(basisFrame===frameNo)return basis;basisFrame=frameNo;basis=null;
 try{const o=project(0,0),a=project(1,0),b=project(0,1),t=project(7.25,-3.5);const B={ox:o.x,oy:o.y,ax:a.x-o.x,ay:a.y-o.y,bx:b.x-o.x,by:b.y-o.y};
  if([B.ox,B.oy,B.ax,B.ay,B.bx,B.by].every(Number.isFinite)&&Math.abs(B.ox+7.25*B.ax-3.5*B.bx-t.x)<.5&&Math.abs(B.oy+7.25*B.ay-3.5*B.by-t.y)<.5)basis=B;}catch(_){}
 return basis;}
function propScreenBox(p,B){
 const z=typeof zoom==='number'?zoom:1,tile=(typeof TILE==='number'?TILE:34)*z;
 const b=Array.isArray(p.analyticBounds12)&&p.analyticBounds12.length===4?p.analyticBounds12:(Number.isFinite(p.width)&&Number.isFinite(p.depth)?[p.x-p.width/2,p.y-p.depth/2,p.x+p.width/2,p.y+p.depth/2]:null);
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const add=(x,y)=>{let qx,qy;if(B){qx=B.ox+x*B.ax+y*B.bx;qy=B.oy+x*B.ay+y*B.by;}else{const q=project(x,y);qx=q.x;qy=q.y;}if(qx<x0)x0=qx;if(qx>x1)x1=qx;if(qy<y0)y0=qy;if(qy>y1)y1=qy;};
 if(b&&b.every(Number.isFinite)){add(b[0],b[1]);add(b[2],b[1]);add(b[0],b[3]);add(b[2],b[3]);}else add(p.x,p.y);
 const tall=Math.max((Number(p.height)||0)*z,Number(p.wallHeight)*tile||0,(Number(p.radius)||1)*tile),side=Math.max(tall*.8,(Number(p.radius)||1.5)*tile,120);
 return[x0-side,y0-tall*1.6-120,x1+side,y1+side];
}
let frameNo=0,zoneFrames=0,inDraw=false;
function farProp(p){
 if(!on('props')||!inDraw||zoneFrames<CFG.warmFrames||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
 const w=typeof W==='number'?W:innerWidth,h=typeof H==='number'?H:innerHeight;
 if(!screenOutside(propScreenBox(p,frameBasis()),w,h,propMargin(w,h))){stats.propsNear++;return false;}
 stats.propsFar++;if(farTurn(idOf(p),frameNo,CFG.propEvery)){stats.propsFarDrawn++;return false;}return true;
}
let lastRoom=null;
if(typeof draw==='function'){const base=draw;draw=function(...a){inDraw=true;frameNo++;zoneFrames++;try{const rm=typeof room==='object'?room:null;if(rm!==lastRoom){lastRoom=rm;zoneFrames=0;}}catch(_){}try{return base.apply(this,a);}finally{inDraw=false;}};}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){try{if(farProp(p))return;}catch(e){fail(e);}return base.apply(this,[p,...a]);};}

// ---- 3D: 덩어리 대기·미리 올리기·시야 밖 대기 ----
let R=null,zoneKey=null,warmState='idle',warmPromise=null,leases=[],held=[],heldSet=new WeakSet(),heldOwner=null,warmRT=null;
let coarse=null;const capFor=r=>{if(coarse===null){try{coarse=!!matchMedia('(pointer:coarse)').matches;}catch(_){coarse=false;}}return((r?.lastViewportWidth||innerWidth)<960||coarse)?CFG.capLow:CFG.cap;};
function releaseZone(){for(const l of leases){try{l.release();}catch(e){fail(e);}}leases=[];
 if(heldOwner){for(const img of held){try{heldOwner.release(img);}catch(e){fail(e);}}}held=[];heldSet=new WeakSet();heldOwner=null;stats.leases=0;stats.texHeld=0;}
let zoneAt=0;function newZone(zone){releaseZone();coarse=null;zoneKey=zone;warmState='loading';zoneAt=frameNo;stats.zones++;}
function wrapChunks(r){const C=r?.chunks;if(!C||typeof C.update!=='function'||C.__r287)return;const base=C.update;
 const w=function(x,y,zone,grid={}){if(!prefs.on)return base.call(this,x,y,zone,grid);
  let vb=grid?.visibleBounds;try{const g=chunkGrid(grid),cap=capFor(r),size=this.size||10;stats.chunksAll=g.count;
   if(zone!==zoneKey)newZone(zone);
   if(warmState==='loading'&&frameNo-zoneAt>CFG.warmTimeout)warmState='done';// 덩어리가 끝내 안 올라오면 미리 그리기 없이 진행
   const all=(prefs.resident&&g.count<=cap)||(prefs.warm&&warmState==='loading'&&g.count<=cap*3);
   if(g.count>cap)stats.overCap=g.count;
   if(all)vb=fullBounds(grid,size);else if(finite4(vb))vb=expand(vb,CFG.prefetch);}catch(e){fail(e);}
  const pr=base.call(this,x,y,zone,{...grid,visibleBounds:vb});
  if(warmState==='loading'&&!warmPromise){const z=zone;warmPromise=Promise.resolve(pr).then(()=>{if(zoneKey===z&&warmState==='loading')warmState='ready';},e=>fail(e)).finally(()=>{warmPromise=null;});}
  return pr;};
 w.__r287base=base;C.update=w;C.__r287=true;}
function unwrapChunks(r){const C=r?.chunks;if(C?.__r287&&C.update.__r287base){C.update=C.update.__r287base;delete C.__r287;}}
function holdLeases(r){const C=r.chunks,A=r.assets;if(!C||!A?.lease)return;const paths=new Set();for(const row of C.rows.values())for(const p of row.assets||[])paths.add(p);
 for(const p of paths){try{leases.push(A.lease(p));}catch(e){fail(e);}}stats.leases=leases.length;}
/* 맵 전체를 화면 밖 4×4 타깃에 한 번 그린다 — 셰이더 컴파일·버퍼/텍스처 올리기만 일어나고 화면에는 그리지 않는다 */
function warmRender(r){const gl=r.renderer,T=r.T;if(!gl||!T?.WebGLRenderTarget)return;const t0=performance.now();
 const flips=[];r.scene.traverse(o=>{if((o.isMesh||o.isSprite||o.isPoints||o.isLine)&&o.frustumCulled){o.frustumCulled=false;flips.push(o);}});
 if(!warmRT){warmRT=new T.WebGLRenderTarget(4,4);warmRT.texture.colorSpace=T.SRGBColorSpace;}
 const prevRT=gl.getRenderTarget(),prevMask=r.camera.layers.mask,prevShadow=gl.shadowMap.needsUpdate;
 try{gl.shadowMap.needsUpdate=false;gl.setRenderTarget(warmRT);r.camera.layers.enableAll();gl.render(r.scene,r.camera);}
 finally{gl.setRenderTarget(prevRT);r.camera.layers.mask=prevMask;gl.shadowMap.needsUpdate=prevShadow;for(const o of flips)o.frustumCulled=true;}
 stats.warms++;stats.warmMeshes=flips.length;stats.warmMs=+(performance.now()-t0).toFixed(1);}
/* 2D 명령 그림 텍스처를 지역 동안 잡아 둔다(화면 밖으로 나가도 버리지 않음 → 돌아올 때 다시 올리지 않음) */
function holdCommandTextures(r,frame){const S=r.commands;if(!S?.texture||!Array.isArray(frame?.commands))return;if(heldOwner&&heldOwner!==S)releaseZone();
 for(const c of frame.commands){if(held.length>=CFG.texCap)break;const img=c?.kind==='image'&&!c.mutable?c.image:null;
  if(!img||heldSet.has(img)||!(typeof HTMLImageElement!=='undefined'&&img instanceof HTMLImageElement)||!(img.naturalWidth>0)||img.naturalWidth*img.naturalHeight>CFG.texMaxPx)continue;
  try{const tex=S.texture(img,false);heldOwner=S;held.push(img);heldSet.add(img);try{r.renderer?.initTexture?.(tex);}catch(_){}}catch(e){fail(e);}}
 stats.texHeld=held.length;}
// 지형 메시 세계 상자(바닥 평면 x,z) 캐시
const boxCache=new WeakMap();
function meshBox(o){const g=o.geometry;if(!g)return null;const m=o.matrixWorld.elements;const c=boxCache.get(o);
 if(c&&c.g===g&&c.m0===m[0]&&c.m12===m[12]&&c.m14===m[14]&&c.m10===m[10])return c.box;
 if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox;if(!bb||!Number.isFinite(bb.min.x))return null;
 let x0=Infinity,z0=Infinity,x1=-Infinity,z1=-Infinity;for(const X of [bb.min.x,bb.max.x])for(const Y of [bb.min.y,bb.max.y])for(const Z of [bb.min.z,bb.max.z]){const wx=m[0]*X+m[4]*Y+m[8]*Z+m[12],wz=m[2]*X+m[6]*Y+m[10]*Z+m[14];if(wx<x0)x0=wx;if(wx>x1)x1=wx;if(wz<z0)z0=wz;if(wz>z1)z1=wz;}
 const box=[x0,z0,x1,z1];boxCache.set(o,{g,m0:m[0],m12:m[12],m14:m[14],m10:m[10],box});return box;}
let parked=[];// [obj,mask] 이번 프레임 동안만 대기
function park(r){parked.length=0;if(!on('hide3d'))return;const vb=r.visibleTerrainBounds,root=r.spatialRoot;if(!finite4(vb)||!root)return;const act=expand(vb,CFG.ring);
 const kids=root.children;for(let i=0;i<kids.length;i++){const o=kids[i];if(!o||!o.isMesh||o.layers.mask===0)continue;const b=meshBox(o);if(!b||!outside(b,act))continue;parked.push(o,o.layers.mask);o.layers.mask=0;}
 stats.hidden=parked.length/2;stats.shown=kids.length-stats.hidden;}
function unpark(){for(let i=0;i<parked.length;i+=2){const o=parked[i];if(o.layers.mask===0)o.layers.mask=parked[i+1];}parked.length=0;}
function before(r,frame){try{stats.frames++;if(r!==R){R=r;}wrapChunks(r);if(!prefs.on)return;const key=frame?.layer+':'+frame?.zone;if(frame?.zone&&key!==zoneKey)newZone(key);if(on('warm')&&(zoneFrames<90||frameNo%15===0))holdCommandTextures(r,frame);/* 들어온 직후 몇 초 동안 + 그 뒤 15프레임에 한 번만 훑는다 */r.__r287Pending=true;}catch(e){fail(e);}}
function after(r){try{unpark();r.__r287Pending=false;if(!prefs.on)return;
 if(warmState==='ready'&&r.spatialBuilt){warmState='done';if(prefs.warm){holdLeases(r);warmRender(r);}stats.chunksResident=r.chunks?.rows?.size||0;}
 else if(warmState==='done')stats.chunksResident=r.chunks?.rows?.size||0;}catch(e){fail(e);}}
const wrapFn=fn=>{if(fn.__r287)return fn;const w=function(frame){before(this,frame);try{return fn.apply(this,arguments);}finally{after(this);}};w.__r287=true;return w;};
function wrapGL(r){const gl=r?.renderer;if(!gl||gl.__r287)return;const base=gl.render;gl.__r287=true;
 gl.render=function(scene,camera){if(r.__r287Pending&&scene===r.scene){r.__r287Pending=false;try{park(r);}catch(e){fail(e);}}return base.call(this,scene,camera);};}
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다.
function wrapAll(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r)return;const proto=Object.getPrototypeOf(r);
 if(proto&&typeof proto.render==='function'&&!proto.render.__r287)proto.render=wrapFn(proto.render);
 if(Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.__r287)r.render=wrapFn(r.render);wrapGL(r);wrapChunks(r);}catch(e){fail(e);}}
setInterval(wrapAll,500);wrapAll();
function set(p){const was=prefs.on;for(const k in prefs)if(typeof p?.[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}
 if(!prefs.on||!prefs.warm){releaseZone();}if(!prefs.on&&R)unwrapChunks(R);if(prefs.on&&!was){zoneKey=null;wrapAll();}return{...prefs};}
window.__STORYWORLD_RENDER_LOD_R287__=Object.freeze({revision:REV,config:CFG,expand,chunkGrid,fullBounds,outside,screenOutside,farTurn,propMargin,set,
 inspect:()=>({revision:REV,prefs:{...prefs},zone:zoneKey,warmState,stats:{...stats},lastError,gameplayChanged:false,browserVerified:false,GPUVerified:false})});
})();
