// R452 — 길 가장자리 풀 덩어리(사용자 2026-11-09 참고 화면 6장 "이런느낌들 거의 유사하게" → 제안 3번 "바닥 가장자리를 덮는 겹겹의 바닥 장식" 승인 "응").
//  참고 화면에서 따온 것은 규칙뿐(모양·배치·자산은 가져오지 않음): 걷는 바닥과 못 걷는 곳(둔덕·벽)의 경계선이 직선으로 드러나지 않게
//  풀이 경계에 겹쳐 자라고, 길 한가운데는 비어 있다.
//  · 그림: 이미 게임에 쓰는 승인 자산 두 장만 — 늪 수초 덩어리(r138 weed)와 그 반대 방향 배치본(r257 weed-opp). 늘이기·회전·뒤집기 없이
//    크기만 바꾼다(r207·r257 규칙). 새 그림이 아니므로 최종 아트가 아니다 — 덤불·꽃·잔돌 묶음은 Dots 요청 목록으로 남긴다.
//  · 어디에: R450 PLACE 표의 실외(out) 지역 중 풀이 자랄 곳(정원·늪·해안·석조 폐허·마을; 잿더미는 마른 풀로 드물게).
//    실내·동굴·기억 공간·눈·기계·대장간에는 놓지 않는다(사용자 2026-11-09 "실내 실외구분도 잘해야해").
//  · 자리: 바닥 칸의 바깥 변(이웃이 바닥이 아닌 변)을 따라 반 칸마다 확률로 덩어리(1~3 포기)를 둔다.
//    R204 둔덕 지형이 있는 지역은 그 거리장으로 둔덕 윗면 가장자리(경계선을 넘어 늘어짐) 또는 절벽 밑(바닥 쪽 0.2~0.4칸)에,
//    없는 지역은 벽 밑 바닥 쪽에. R169 길 칸·문·제단·목표·입구·소품 둘레는 비운다(길은 그대로 보인다).
//  · 그리기: 한 지역의 모든 포기를 판 한 묶음(메시 1개, 그리기 1번)으로 — 카메라를 향한 판(R204 풀과 같은 모양), 밑동은 조금 어둡게.
//    R451 국지 조명이 같은 빛을 입힌다(세운 판 → 앞 바닥 빛). 충돌·판정·길찾기·저장은 바꾸지 않는다(그림만).
//  끄기: localStorage['storyworld.r452.fringe']='{"on":false}' (다음 지역부터).
(()=>{'use strict';
if(window.__STORYWORLD_GROUND_FRINGE_R452__)return;
const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!A||!C)return;
const REV='R452-fringe-1',KEY='storyworld.r452.fringe';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={builds:0,quads:0,spots:0,skippedPath:0,skippedAvoid:0,buildMs:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const finite=v=>Number.isFinite(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

// ---- 지역별 결 ------------------------------------------------------------------------------------------------
// rate: 바깥 변 반 칸마다 덩어리가 날 확률, k: 판 크기(그림 px × k ÷ 48px/칸), tint: 색(그림 × tint), top: R204 둔덕 윗면에 둘 비율.
const FAM=Object.freeze({
 garden:{rate:.62,k:[.16,.25],tint:[.95,1.06,.88],top:.55},
 swamp:{rate:.66,k:[.17,.26],tint:[.82,.96,.78],top:.5},
 coast:{rate:.42,k:[.14,.22],tint:[.9,.98,.84],top:.5},
 regional:{rate:.44,k:[.14,.22],tint:[.92,1,.86],top:.45},
 stone:{rate:.3,k:[.13,.2],tint:[.88,.94,.8],top:.45},
 ash:{rate:.18,k:[.12,.18],tint:[.8,.7,.56],top:.5}});            // 잿더미: 마른 풀(갈색)로 드물게
const ART=Object.freeze([{id:'weed',path:'assets/r138/props/weed.webp'},{id:'weed-opp',path:'assets/r257/props/weed-opp.webp'}]);
const PPU=34*Math.SQRT2,MAX_QUADS=1500;

function familyOf(r){try{const L=r?.exploration,z=typeof zone!=='undefined'?zone:null;
  return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[z]?.family||'regional';}catch(_){return'regional';}}
function placeOf(r){try{const f=window.__STORYWORLD_WEATHER_R450__?.placeOf;if(typeof f==='function')return f(r)?.kind||null;}catch(_){}return null;}
function specFor(r){const kind=placeOf(r);if(kind!=='out')return null;return FAM[familyOf(r)]||null;}

// ---- 그림 묶음(두 장을 한 캔버스에) --------------------------------------------------------------------------------
let artState='idle',atlas=null;
function loadImg(src){return new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(new Error('image '+src));im.src=src;});}
function bboxOf(c,g,y0,w,h){const d=g.getImageData(0,y0,w,h).data;let x0=w,yy0=h,x1=0,y1=0;for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2)if(d[(y*w+x)*4+3]>24){if(x<x0)x0=x;if(y<yy0)yy0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
 return{x0,y0:yy0,x1:x1+2,y1:y1+2,cx:(x0+x1+2)/2};}
async function loadArt(){if(artState!=='idle')return;artState='loading';
 try{const ims=await Promise.all(ART.map(a=>loadImg(a.path)));const W=Math.max(...ims.map(i=>i.naturalWidth)),GAP=4,H=ims.reduce((s,i)=>s+i.naturalHeight+GAP,0);
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});let y=0;const parts=[];
  ims.forEach((im,i)=>{g.drawImage(im,0,y);const w=im.naturalWidth,h=im.naturalHeight,b=bboxOf(c,g,y,w,h);parts.push({id:ART[i].id,y,w,h,box:b});y+=h+GAP;});
  atlas={canvas:c,W,H,parts};artState='ready';}catch(e){artState='failed';fail(e);}}

// ---- 자리 고르기(순수 계산 — qa/r452 가 직접 시험) --------------------------------------------------------------------
// cells [[x,y]…], spec FAM 한 줄, opt: {seed, path:Set('x,y'), avoid:[{x,y,r}], walls:[[x0,y0,x1,y1]…], fieldAt:(x,y)=>부호 거리(바닥 +), topAt:(x,y)=>둔덕 높이}
function plan(cells,spec,opt={}){const S=new Set(cells.map(c=>c[0]+','+c[1])),has=(x,y)=>S.has(x+','+y),rnd=rng(opt.seed||1),path=opt.path||new Set(),avoid=opt.avoid||[],walls=opt.walls||[];
 const grid=new Map(),near=(x,y,r)=>{const gx=Math.floor(x*2),gy=Math.floor(y*2);for(let j=gy-2;j<=gy+2;j++)for(let i=gx-2;i<=gx+2;i++){const L=grid.get(i+','+j);if(L)for(const q of L)if(Math.hypot(q.x-x,q.y-y)<r)return true;}return false;};
 const put=q=>{const k=Math.floor(q.x*2)+','+Math.floor(q.y*2);let L=grid.get(k);if(!L)grid.set(k,L=[]);L.push(q);};
 const inWall=(x,y)=>walls.some(b=>x>b[0]-.12&&x<b[2]+.12&&y>b[1]-.12&&y<b[3]+.12);
 const onPath=(x,y)=>path.has(Math.floor(x)+','+Math.floor(y));
 const spots=[],counts={path:0,avoid:0};
 for(const[x,y]of cells)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){if(has(x+dx,y+dy))continue;
  for(const t of[.25,.75]){if(rnd()>spec.rate)continue;
   const ex=x+.5+dx*.5+(dy?t-.5:0),ey=y+.5+dy*.5+(dx?t-.5:0),front=dx>0||dy>0;// 앞쪽(카메라 쪽) 변: 둔덕이 화면에서 바닥 앞에 있다
   let px,py,h=.02,side='floor';
   if(opt.fieldAt&&opt.topAt&&rnd()<spec.top){const d=.32+rnd()*.38;px=ex+dx*d;py=ey+dy*d;const fv=opt.fieldAt(px,py);if(!(fv<-.1&&fv>-1.6))continue;h=opt.topAt(px,py);if(!(h>=.3))continue;side='top';
    if(onPath(x+.5,y+.5)&&front){counts.path++;continue;}}                      // 길 바로 앞 낮은 둔덕 풀은 길을 가린다
   else{const d=.2+rnd()*.18;px=ex-dx*d;py=ey-dy*d;if(opt.fieldAt){const fv=opt.fieldAt(px,py);if(!(fv>.04&&fv<.8))continue;}else if(inWall(px,py))continue;
    if(onPath(px,py)){counts.path++;continue;}}
   if(avoid.some(a=>Math.hypot(a.x-px,a.y-py)<a.r)){counts.avoid++;continue;}
   if(near(px,py,.62))continue;
   const q={x:+px.toFixed(3),y:+py.toFixed(3),h:+h.toFixed(3),side,front,ax:dy?1:0,ay:dx?1:0,r:rnd()};put(q);spots.push(q);}}
 return{spots,counts};}

// ---- 판 묶음 만들기 ------------------------------------------------------------------------------------------------
function build(r,frame,spec,F){const t0=performance.now(),T=r.T,L=frame.exploration,z=frame.zone,rm=typeof room!=='undefined'&&room?.exploration===L?room:null;
 const R204=window.__STORYWORLD_CAVE_R204__,useF=!!(F&&R204?.at&&R204?.topHeight);
 const path=new Set();try{const s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(rm);if(s&&typeof s.forEach==='function')s.forEach(k=>path.add(String(k)));}catch(e){fail(e);}
 const avoid=[];const pt=(q,rr)=>{if(q&&finite(q.x+q.y))avoid.push({x:q.x,y:q.y,r:rr});};
 for(const d of L.worldR74?.doors||[])pt(d,2.2);for(const d of F?.doors||[])if(Array.isArray(d))avoid.push({x:d[0],y:d[1],r:Math.max(2,(d[2]||3)-.6)});
 pt(rm?.altar,2.6);pt(rm?.objective,1.8);pt(L.entry,2.4);pt(L.entrance,2.4);pt(rm?.r72Entry,2.4);
 for(const p of rm?.props||[])if(p&&finite(p.x+p.y)&&p.visible!==false)pt(p,(p.interactive||p.r414Building?1.6:.9)+(Number(p.radius)||0));
 for(const n of rm?.npcs||[])pt(n,1.8);
 const walls=[];for(const w of L.walls||[])if(w&&!w.decorative&&finite(w.x+w.y+w.width+w.depth))walls.push([w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2]);
 const{spots,counts}=plan(L.floorCells||[],spec,{seed:h32(String(z))^0x452,path,avoid,walls:useF?[]:walls,
  fieldAt:useF?(x,y)=>R204.at(F,F.f,x,y):null,topAt:useF?(x,y)=>R204.topHeight(F,z,x,y):null});
 stats.skippedPath=counts.path;stats.skippedAvoid=counts.avoid;stats.spots=spots.length;
 // 카메라 방향(직교·고정 회전): 판은 화면과 평행(Sprite 와 같음) — 오른쪽·위 벡터. 법선은 카메라 쪽 수평(R451 이 세운 면으로 비춘다).
 r.camera.updateMatrixWorld();const e=r.camera.matrixWorld.elements,RX=[e[0],e[1],e[2]],UP=[e[4],e[5],e[6]],BK=[e[8],0,e[10]],bl=Math.hypot(BK[0],BK[2])||1;BK[0]/=bl;BK[2]/=bl;
 const pos=[],uv=[],col=[],nor=[],idx=[],rnd=rng(h32(String(z))^0x45201);let quads=0;
 const quad=(x,y,h,part,k,tint)=>{if(quads>=MAX_QUADS)return;const b=part.box,w=part.w*k/PPU,hh=part.h*k/PPU*1.1,cx=b.cx/part.w,cy=(b.y1-4)/part.h;// 밑동 기준점(그림 아래 끝)
  const base=pos.length/3;
  for(const[sx,sy]of[[0,0],[1,0],[1,1],[0,1]]){const ox=(sx-cx)*w,oy=(cy-sy)*hh;// sy=0 → 그림 위(캔버스 y 작음)
   pos.push(x+RX[0]*ox+UP[0]*oy,h+RX[1]*ox+UP[1]*oy,y+RX[2]*ox+UP[2]*oy);
   uv.push(sx*part.w/atlas.W,1-(part.y+sy*part.h)/atlas.H);
   const ao=sy===1?.62:1;col.push(tint[0]*ao,tint[1]*ao,tint[2]*ao);nor.push(BK[0],0,BK[2]);}
  idx.push(base,base+3,base+1,base+1,base+3,base+2);quads++;};
 for(const s of spots){const n=1+(s.r<.45?1:0)+(s.r<.15?1:0),parts=atlas.parts;
  for(let i=0;i<n;i++){const part=parts[(h32(s.x+','+s.y+':'+i)>>>3)%parts.length],k0=spec.k[0]+(spec.k[1]-spec.k[0])*rnd(),k=(i?.62+rnd()*.2:1)*k0*(s.side==='top'&&s.front?.72:1);
   const along=i?(rnd()<.5?-1:1)*(.22+rnd()*.24):0,x=s.x+s.ax*along,y=s.y+s.ay*along,v=.86+rnd()*.24,warm=(rnd()-.5)*.08;
   quad(x,y,s.h+(i?.01:0),part,k,[clamp(spec.tint[0]*v+warm,0,1.2),clamp(spec.tint[1]*v,0,1.2),clamp(spec.tint[2]*v-warm,0,1.2)]);}}
 if(!quads)return null;
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.setAttribute('normal',new T.Float32BufferAttribute(nor,3));geo.setIndex(idx);geo.computeBoundingSphere();
 const tex=new T.CanvasTexture(atlas.canvas);tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
 const mat=new T.MeshBasicMaterial({map:tex,vertexColors:true,alphaTest:.4,transparent:false,depthWrite:true,side:T.DoubleSide,toneMapped:false});
 const mesh=new T.Mesh(geo,mat);mesh.name='r452-fringe';mesh.layers.set(2);mesh.renderOrder=-24;mesh.userData.presentationOnly=true;mesh.userData.r452=true;
 for(const x of[geo,mat,tex])r.spatialResources?.add?.(x);r.spatialRoot.add(mesh);
 stats.builds++;stats.quads=quads;stats.buildMs=Math.round(performance.now()-t0);return mesh;}

// ---- 한 프레임 ------------------------------------------------------------------------------------------------
function update(r,frame){if(disposed||!prefs.on||frame?.layer!=='STORY'||!r.spatialBuilt||!r.spatialRoot||!frame.exploration?.floorCells?.length)return;
 const st=r.__r452,z=frame.zone;if(st&&st.gen===r.sceneGeneration&&st.zone===z){if(st.mesh&&!st.mesh.parent)r.spatialRoot.add(st.mesh);return;}
 const rm=typeof room!=='undefined'&&room?.exploration===frame.exploration?room:null;if(!rm)return;
 const spec=specFor(rm);if(!spec){r.__r452={gen:r.sceneGeneration,zone:z,mesh:null,skip:'place'};return;}
 if(artState==='idle')loadArt();if(artState!=='ready'){if(artState==='failed')r.__r452={gen:r.sceneGeneration,zone:z,mesh:null,skip:'art'};return;}
 // R204 둔덕 지역은 그 지형이 다 지어진 뒤(거리장) — 꺼져 있으면 거리장 없이 벽 밑에만
 const R204=window.__STORYWORLD_CAVE_R204__;let F=null;
 if(R204?.zones?.includes?.(z)&&R204?.inspect?.()?.prefs?.on!==false){const s4=r.__r204;if(!s4||s4.zone!==z||s4.gen!==r.sceneGeneration||s4.pending)return;if(!s4.failed)F=s4.F||null;}
 let mesh=null;try{mesh=build(r,frame,spec,F);}catch(e){fail(e);}r.__r452={gen:r.sceneGeneration,zone:z,mesh,withField:!!F};}
const wrappedTargets=new WeakSet();
function wrapFn(fn){const w=function(frame){try{if(!disposed&&this?.T&&this.scene&&this.__r452Frame!==frame){this.__r452Frame=frame;update(this,frame);}}catch(e){fail(e);}
  try{return fn.apply(this,arguments);}finally{if(this)this.__r452Frame=undefined;}};w.__r452=true;return w;}
function wrapOnce(t){if(!t||wrappedTargets.has(t)||typeof t.render!=='function')return;wrappedTargets.add(t);t.render=wrapFn(t.render);}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const proto=r?Object.getPrototypeOf(r):C;wrapOnce(proto);if(r&&Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();

function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}
 try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r?.__r452?.mesh)r.__r452.mesh.visible=prefs.on;}catch(_){}return{...prefs};}
function dispose(){disposed=true;if(timer)clearInterval(timer);try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const m=r?.__r452?.mesh;if(m){m.parent?.remove(m);m.geometry?.dispose?.();m.material?.map?.dispose?.();m.material?.dispose?.();}if(r)r.__r452=null;}catch(_){}}
window.__STORYWORLD_GROUND_FRINGE_R452__=Object.freeze({revision:REV,storageKey:KEY,families:FAM,art:ART,plan,set,dispose,
 inspect:()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,st=r?.__r452;return{revision:REV,prefs:{...prefs},art:artState,zone:st?.zone||null,skip:st?.skip||null,withField:!!st?.withField,quads:st?.mesh?stats.quads:0,stats:{...stats},lastError,collisionChanged:false,gameplayChanged:false,finalArt:false};}});
})();
