// R287 영웅 근처 우선 그리기 + 맵 한 번 미리 그리기(사용자 2026-11-04 "한번 모든맵 보조렌더링한 다음 영웅 근처쪽 렌더링해서 렉 최적화 …
//  영웅이 가는 근방만(시야에 보이는 곳+조금 더 주변부까지) 우선 렌더링하고 나머지는 약한 렌더링 혹은 대기").
//  측정(헤드리스, 같은 빌드): 맵 지형은 엔진이 영웅 둘레 3×3 덩어리(10칸)+화면 안만 올리고, 벗어나면 내린다(병원 벽 그림·가림 재질은 버림).
//  그래서 처음 가는 곳·되돌아오는 곳에서 덩어리를 새로 만들고 GPU 에 다시 올리느라 한 프레임이 길어진다(ep1a08 순간 이동 뒤 3D 그리기 최대 수백 ms).
//  또 2D 그리기는 맵의 모든 조형물·벽(ep1a08 222개×2번)을 매 프레임 그리고, 화면 밖 것은 엔진이 나중에 버린다.
//  ① 보조 렌더링(한 번): 지역에 들어오면 맵 전체 덩어리를 한 번 올리고(덩어리 수 상한×3 안에서),
//     다 올라오면 화면 밖 4×4 렌더 타깃에 장면 전체를 한 번 그려 셰이더·지오메트리·텍스처를 미리 올린다. 화면에는 아무것도 그리지 않는다.
//     덩어리 그림 파일은 지역을 떠날 때까지 잡아 두고(리스), 2D 조형물 그림 텍스처도 지역 동안 잡아 둔다 → 다시 와도 다시 올리지 않는다.
//  ② 우선 렌더링: 대기 중인 덩어리 메시 중 엔진이 원래 올려 두었을 것(영웅 둘레 3×3+보이는 범위, 엔진 규칙 그대로)만 그리고 — 그래서 화면에 그려지는 지형은 끄기 상태와 같다 —
//     덩어리에 속하지 않은 지형 메시는 시야(엔진이 계산한 보이는 범위)+주변 고리(RING 칸) 안만 그린다. 나머지는 그 프레임의 그리기 동안만
//     layers.mask=0(대기)로 두었다가 그리기가 끝나면 원래 값으로 되돌린다(엔진이 visible 을 매 프레임 다시 켜므로 visible 대신 layers).
//     그 뒤엔 엔진 규칙(영웅 둘레 3×3 덩어리=시야 밖 10~20칸 여유 + 화면 안) 그대로 올려 두고(PREFETCH 0 — 더 넓히면 R90 벽 테두리 다시 만들기가 그만큼 무거워짐), 내린 덩어리 지오메트리는 키운 대기 캐시(PC 24MB·모바일 6MB)에 GPU 버퍼째 남긴다.
//     {resident:true} 면 맵 전체를 계속 올려 둔다(기본 끔 — R90 벽 테두리 같은 파생 오버레이가 맵 전체 벽으로 만들어져 삼각형이 늘어남, ep1b03 19k→49k).
//  ③ 약한 렌더링: 화면+여백 밖 조형물·벽의 2D 그리기는 PROP_EVERY 프레임에 한 번만(돌아가며) 한다 — 그림 지연 로딩·나무 그림 바꾸기 같은
//     그리기 부수 효과는 그대로 일어나고, 그 명령은 원래도 화면 밖이라 엔진이 버리던 것이다. 들어온 첫 몇 프레임은 전부 그린다(미리 그리기).
//  판정·충돌·길 찾기·몹 AI·진행은 건드리지 않는다(그리기만). room.props·room.exploration·엔진 레이아웃은 읽기만 한다.
//  끄기: localStorage['storyworld.r287.lod']='{"on":false}' (전부) — 부분: {"warm":false} {"cache":false} {"hide3d":false} {"props":false}, 맵 전체 상주 {"resident":true}
(()=>{'use strict';
if(window.__STORYWORLD_RENDER_LOD_R287__)return;
const REV='R287-lod-1',KEY='storyworld.r287.lod';
const CFG=Object.freeze({ring:4,prefetch:0,cap:400,capLow:120,propEvery:20,warmFrames:3,warmTimeout:900,propMarginFrac:.3,propMarginPx:160,texCap:320,texMaxPx:4096*4096,cacheBytes:24*1024*1024,cacheBytesLow:6*1024*1024,cacheCount:1024});
const prefs={on:true,warm:true,resident:false,cache:true,hide3d:true,props:true};
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
let lastArgs=null,R=null,zoneKey=null,warmState='idle',warmPromise=null,leases=[],held=[],heldSet=new WeakSet(),heldOwner=null,warmRT=null;
let coarse=null;const capFor=r=>{if(coarse===null){try{coarse=!!matchMedia('(pointer:coarse)').matches;}catch(_){coarse=false;}}return((r?.lastViewportWidth||innerWidth)<960||coarse)?CFG.capLow:CFG.cap;};
function releaseZone(){for(const l of leases){try{l.release();}catch(e){fail(e);}}leases=[];
 if(heldOwner){for(const img of held){try{heldOwner.release(img);}catch(e){fail(e);}}}held=[];heldSet=new WeakSet();heldOwner=null;stats.leases=0;stats.texHeld=0;}
let zoneAt=0,warmGen=0;function newZone(zone){warmGen++;releaseZone();coarse=null;zoneKey=zone;warmState='loading';zoneAt=frameNo;stats.zones++;}
function wrapChunks(r){const C=r?.chunks;if(!C||typeof C.update!=='function'||C.__r287)return;const base=C.update;
 const w=function(x,y,zone,grid={}){lastArgs={x,y,grid};if(!prefs.on)return base.call(this,x,y,zone,grid);
  let vb=grid?.visibleBounds;try{const g=chunkGrid(grid),cap=capFor(r),size=this.size||10;stats.chunksAll=g.count;
   if(zone!==zoneKey)newZone(zone);
   const warming=warmState==='loading'||warmState==='ready';/* 'ready'(다 올라옴, 미리 그리기·리스 전)에도 맵 전체를 붙잡아 둔다 — 그 사이 엔진이 update 를 다시 불러도 먼 덩어리가 내려가지 않게 */
   if(warming&&frameNo-zoneAt>CFG.warmTimeout)warmState='done';// 덩어리가 끝내 안 올라오면 미리 그리기 없이 진행
   const all=(prefs.resident&&g.count<=cap)||(prefs.warm&&warming&&warmState!=='done'&&g.count<=cap*3);
   if(g.count>cap)stats.overCap=g.count;
   if(all)vb=fullBounds(grid,size);else if(finite4(vb)&&CFG.prefetch>0)vb=expand(vb,CFG.prefetch);}catch(e){fail(e);}
  const pr=base.call(this,x,y,zone,{...grid,visibleBounds:vb});
  if(warmState==='loading'&&warmPromise!==warmGen){const g=warmGen;warmPromise=g;/* 지역(세대)마다 완료 처리를 따로 단다 — 앞 지역 약속이 대기 중이어도 새 지역 것을 놓치지 않게 */
   Promise.resolve(pr).then(()=>{if(g===warmGen&&warmState==='loading')warmState='ready';},e=>fail(e));}
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
/* 엔진이 원래 올려 두었을 덩어리인가(ChunkManager.update 규칙 그대로: 영웅 둘레 3×3 + 보이는 범위 덩어리 + 경계 유지 여유).
   대기 중인 나머지 덩어리 메시는 그리기에서 빼 → 화면에 그려지는 지형은 끄기 상태와 같다(겹치는 안개·배경 판이 더 쌓이지 않음). */
function engineKeeps(key,x,y,size,view,grid){const k=String(key).split(',').map(Number);if(k.length!==2||!k.every(Number.isFinite))return true;const a=k[0],b=k[1];
 const g=chunkGrid(grid||{});if(a<g.minX||b<g.minY||a>=g.columns||b>=g.rows)return false;
 const cx=Math.floor(x/size),cy=Math.floor(y/size);if(Math.abs(a-cx)<=1&&Math.abs(b-cy)<=1)return true;
 const v=finite4(view);if(v&&a>=Math.floor(view[0]/size)&&a<=Math.floor(view[2]/size)&&b>=Math.floor(view[1]/size)&&b<=Math.floor(view[3]/size))return true;
 const mx=(a+.5)*size,my=(b+.5)*size;if(Math.abs(x-mx)<=size*1.5+1&&Math.abs(y-my)<=size*1.5+1)return true;
 return !!(v&&mx>=view[0]-size/2-1&&mx<=view[2]+size/2+1&&my>=view[1]-size/2-1&&my<=view[3]+size/2+1);}
let parked=[];// [obj,mask] 이번 프레임 동안만 대기
const rowMeshes=new Set();
function park(r){parked.length=0;if(!on('hide3d'))return;const vb=r.visibleTerrainBounds,root=r.spatialRoot;if(!finite4(vb)||!root)return;const act=expand(vb,CFG.ring);
 const put=o=>{if(o&&o.layers&&o.layers.mask!==0){parked.push(o,o.layers.mask);o.layers.mask=0;}};
 rowMeshes.clear();const A=lastArgs,size=r.chunks?.size||10;
 if(A){for(const M of [r.floorRows,r.backdropRows,r.fogRows,r.bridgeRows])if(M instanceof Map)for(const [key,mesh] of M){rowMeshes.add(mesh);if(!engineKeeps(key,A.x,A.y,size,vb,A.grid))put(mesh);}
  if(r.wallRows instanceof Map)for(const e of r.wallRows.values()){if(!e?.mesh)continue;rowMeshes.add(e.mesh);let keep=!(e.refs&&e.refs.size);if(!keep)for(const key of e.refs)if(engineKeeps(key,A.x,A.y,size,vb,A.grid)){keep=true;break;}if(!keep)put(e.mesh);}}
 const kids=root.children;for(let i=0;i<kids.length;i++){const o=kids[i];if(!o||!o.isMesh||o.layers.mask===0||rowMeshes.has(o))continue;const b=meshBox(o);if(!b||!outside(b,act))continue;put(o);}
 stats.hidden=parked.length/2;stats.shown=kids.length-stats.hidden;}
function unpark(){for(let i=0;i<parked.length;i+=2){const o=parked[i];if(o.layers.mask===0)o.layers.mask=parked[i+1];}parked.length=0;}
/* 대기 캐시: 엔진은 내린 덩어리의 지오메트리(GPU 버퍼째)를 개수 256·2MB 까지만 들고 있다가 버린다(매 프레임 한도를 다시 씀).
   미리 그리기로 맵 전체를 한 번 올린 뒤 내린 덩어리가 그대로 남도록 한도만 키운다(PC 24MB·모바일 6MB). 끄면 엔진 값 그대로. */
function boostCache(r){if(!r||r.__r287Cache)return;const ownB=Object.getOwnPropertyDescriptor(r,'idleGeometryByteLimit'),ownN=Object.getOwnPropertyDescriptor(r,'idleGeometryLimit');if(ownB&&!('value' in ownB)||ownN&&!('value' in ownN))return;
 let b=r.idleGeometryByteLimit,n=r.idleGeometryLimit;r.__r287Cache=true;
 Object.defineProperty(r,'idleGeometryByteLimit',{configurable:true,enumerable:true,get(){return on('cache')?Math.max(b||0,capFor(r)===CFG.cap?CFG.cacheBytes:CFG.cacheBytesLow):b;},set(v){b=v;}});
 Object.defineProperty(r,'idleGeometryLimit',{configurable:true,enumerable:true,get(){return on('cache')?Math.max(n||0,CFG.cacheCount):n;},set(v){n=v;}});}
function unboostCache(r){if(!r?.__r287Cache)return;const b=r.idleGeometryByteLimit,n=r.idleGeometryLimit;delete r.idleGeometryByteLimit;delete r.idleGeometryLimit;delete r.__r287Cache;r.idleGeometryByteLimit=b;r.idleGeometryLimit=n;}/* set() 이 prefs 를 먼저 바꿔 두므로 위 b,n 은 엔진 값 */
function before(r,frame){try{stats.frames++;if(r!==R){R=r;}wrapChunks(r);if(!prefs.on)return;boostCache(r);const key=frame?.layer+':'+frame?.zone;if(frame?.zone&&key!==zoneKey)newZone(key);if(on('warm')&&(zoneFrames<90||frameNo%15===0))holdCommandTextures(r,frame);/* 들어온 직후 몇 초 동안 + 그 뒤 15프레임에 한 번만 훑는다 */r.__r287Pending=true;}catch(e){fail(e);}}
/* 미리 그리기(또는 시간 초과)가 끝나면 엔진 범위로 바로 줄인다 — 엔진은 위치·시야 키가 바뀔 때만 update 를 불러, 가만히 있으면 맵 전체가 남는다.
   마지막 엔진 요청 그대로 다시 부르고(이제 'done' 이라 원래 범위), 엔진 키도 비워 다음 프레임에 엔진이 스스로 다시 요청하게 한다. */
function shrink(r){try{if('lastChunkPosition' in r)r.lastChunkPosition=null;const A=lastArgs;if(A&&zoneKey&&r.chunks?.update&&!(prefs.resident&&chunkGrid(A.grid).count<=capFor(r)))Promise.resolve(r.chunks.update(A.x,A.y,zoneKey,A.grid)).catch(fail);}catch(e){fail(e);}}
function after(r){try{unpark();r.__r287Pending=false;if(!prefs.on)return;if((warmState==='loading'||warmState==='ready')&&frameNo-zoneAt>CFG.warmTimeout){warmState='done';shrink(r);}/* 시간 초과는 프레임마다 본다(덩어리 update 가 없어도) */
 if(warmState==='ready'&&r.spatialBuilt){warmState='done';if(prefs.warm){holdLeases(r);warmRender(r);}shrink(r);stats.chunksResident=r.chunks?.rows?.size||0;}
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
 if(!prefs.on||!prefs.warm){releaseZone();}if(!prefs.on&&R){unwrapChunks(R);unboostCache(R);}else if(!prefs.cache&&R)unboostCache(R);if(prefs.on&&!was){zoneKey=null;wrapAll();}return{...prefs};}
window.__STORYWORLD_RENDER_LOD_R287__=Object.freeze({revision:REV,config:CFG,expand,engineKeeps,chunkGrid,fullBounds,outside,screenOutside,farTurn,propMargin,set,
 inspect:()=>({revision:REV,prefs:{...prefs},zone:zoneKey,warmState,stats:{...stats},lastError,gameplayChanged:false,browserVerified:false,GPUVerified:false})});
})();
