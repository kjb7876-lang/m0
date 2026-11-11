/* R83: bind regional doors to their actual wall aperture. Source PNG pixels,
 * native door states, interactions and collision remain authoritative. */
(()=>{'use strict';
 if(window.__STORYWORLD_WORLD_DOORS_R83__)return;
 const DOORS=window.__STORYWORLD_WORLD_R74__,stats={doors:0,closed:0,open:0,planes:0,culled:0},JAMB=.24;
 // R452(사용자 2026-11-09 "벽들 문높이 맞추고 문위에 벽이조금 감싸는 형태로 해서 벽을뚫고 문을 만든느낌"): 문틀 높이를 2.7 → 2.4 로 낮춰
 //  벽(2.85) 윗선 아래로 0.45 남긴다 — 그 틈을 R413 상인방(벽 그림 띠+윗면)이 메워 벽이 문 위를 감싼다. 병원 진료문(ep1a08)은 2.7 그대로.
 //  끄기: localStorage storyworld.r452.walls {"on":false}
 let r452=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r452.walls')||'null');if(s&&s.on===false)r452=false;}catch(_){}
 const DH=()=>{if(!r452)return 2.7;try{return typeof room!=='undefined'&&room&&room.id!=='ep1a08'?2.4:2.7;}catch(_){return 2.7;}};

 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const hospital=(r,p)=>r?.id==='ep1a08'&&!!r.exploration?.hospitalDoorsB3&&!!p?.hospitalDoorFrameB3;
 const enabled=(r,p)=>solo()&&r?.layer==='STORY'&&(hospital(r,p)||!!r.exploration?.worldWardR81&&!!p?.r74Door);
 const hospitalLeafPath='assets/world-r80/r80-057.webp';
 // R443(사용자 2026-11-09 06:49Z "문대신 커튼사용하는거야 문대용으로"): 색욕(ep1b05) 보스 문(door-0) 문짝 자리에 붉은 무대 커튼(R408 red-curtain)을 그린다.
 //  문 열림·충돌·문틀(벽 띠)은 그대로, 문짝 그림만 바뀐다. 끄기: localStorage storyworld.r443.curtainDoor {on:false}
 const CURTAIN_PATH='assets/r408/props/red-curtain.webp',CURTAIN_DOORS={ep1b05:'door-0'};
 let curtainOn=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r443.curtainDoor')||'null');if(s&&s.on===false)curtainOn=false;}catch(_){}
 function curtainFor(r,d){if(!curtainOn||!r||r.layer!=='STORY'||CURTAIN_DOORS[r.id]!==d?.id)return null;const row=readyImage(CURTAIN_PATH);if(!row){try{addImage(CURTAIN_PATH,'R443 curtain door');}catch(_){}return null;}stats.curtains=(stats.curtains||0)+1;return row.image;}
 // R347: 문 그림을 늘리지 않는다(사용자 2026-11-05 "문이미지 너무늘어나 … 부자연스럽지 않게 적절하게 배치 및 입구간격조절").
 //  원래는 문짝 그림 한 장(가로:세로 ≈ .72)을 5~8칸 통로 폭 전체에 펴 발라 가로로 3~4배 늘어났다.
 //  이제 통로를 그림 비율에 가장 가까운 문 칸(bay) 여러 개로 나누고, 칸 사이에 돌기둥(문설주)을 세운다. 문짝은 칸 안에서
 //  원래 비율(최대 +12%)만 쓰고 남는 폭은 기둥을 넓혀 메운다. 열린 문은 바깥 두 짝만 원래 길이로 젖힌다(통로 가운데를 가리지 않게).
 //  충돌·문 폭·열림 판정은 그대로(그림만). 벽 띠(문설주·상인방)도 벽 그림을 늘리지 않고 띠 비율대로 잘라 붙인다.
 //  끄기: localStorage storyworld.r347.doorFit {on:false}
 let fitOn=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r347.doorFit')||'null');if(s&&s.on===false)fitOn=false;}catch(_){}
 // 원본 문짝 정합점(leafPatch 와 같은 값)에서 잰 비율. 화면에서 바닥 1칸 길이 = √1.25·TILE, 높이 1 = √1.5·TILE.
 const LEAF_SRC={oak:{a:[112,251],b:[199,285],c:[112,122]},metal:{a:[728,254],b:[826,290],c:[728,127]},clinical:{a:[60,477],b:[237,431],c:[60,98]}};
 const leafAspect=k=>{const s=LEAF_SRC[k];return Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1])/Math.hypot(s.c[0]-s.a[0],s.c[1]-s.a[1]);};
 const Z_PER_U=Math.sqrt(1.5)/Math.sqrt(1.25),MAX_STRETCH=1.12;
 /* 문 한 칸(문짝 전체)의 자연 폭(칸 단위): 병원 문은 외짝 둘이 한 칸 */
 const naturalBay=kind=>(DH()-JAMB)*Z_PER_U*leafAspect(kind)*(kind==='clinical'?2:1);
 function bays(width,kind){const nat=naturalBay(kind);let best=null;for(let n=1;n<=8;n++){const bw=(width-(n-1)*JAMB)/n;if(bw<=.4)break;const cost=bw<nat?Math.log(nat/bw):.5*Math.log(Math.max(1,bw/(nat*MAX_STRETCH)));/* 줄이기는 그림이 찌그러지니 그대로, 넓히기는 12%까지 공짜·그 위는 기둥이 넓어질 뿐이라 반값 */if(!best||cost<best.cost-1e-9)best={n,bw,cost};}
  if(!best)best={n:1,bw:width,cost:0};const leafW=Math.min(best.bw,nat*MAX_STRETCH),pad=(best.bw-leafW)/2;return{n:best.n,bay:best.bw,leaf:leafW,pad,natural:nat,stretch:leafW/nat};}
 function geometry(d,open,clinical=false,metal=false){if(!d||!Number.isFinite(d.x+d.y+d.width+d.depth)||d.width<=0||d.depth<=0)throw Error('Invalid native ward door aperture');
  // A closed door's native wall has thickness. Its centre plane is hidden
  // behind the opaque front face; register art just outside that face.
  const width=d.axis==='x'?d.depth:d.width,faceOffset=(d.axis==='x'?d.width:d.depth)/2+.015,along=(u,v=0)=>d.axis==='x'?{x:d.x+faceOffset+v,y:d.y+u}:{x:d.x+u,y:d.y+faceOffset+v},at=(u,z)=>({...along(u),z}),parts=[];
  const strip=(id,u0,u1,z0,z1)=>parts.push({id,a:along(u0),b:along(u1),z0,z1,source:'wall'});
  strip('left-jamb',-width/2-JAMB,-width/2,0,DH());strip('right-jamb',width/2,width/2+JAMB,0,DH());strip('header',-width/2,width/2,(DH()-JAMB),DH());
  const aperture=[at(-width/2,0),at(width/2,0),at(width/2,DH()),at(-width/2,DH())];
  if(!fitOn){
   if(open){const left=along(-width/2),right=along(width/2);parts.push({id:'open-left',a:left,b:along(-width/2,width/2),z0:0,z1:(DH()-JAMB),source:'leaf',half:0});parts.push({id:'open-right',a:right,b:along(width/2,width/2),z0:0,z1:(DH()-JAMB),source:'leaf',half:1});}
   else if(clinical){parts.push({id:'closed-left',a:along(-width/2),b:along(0),z0:0,z1:(DH()-JAMB),source:'leaf'});parts.push({id:'closed-right',a:along(0),b:along(width/2),z0:0,z1:(DH()-JAMB),source:'leaf'});}
   else parts.push({id:'closed-leaf',a:along(-width/2),b:along(width/2),z0:0,z1:(DH()-JAMB),source:'leaf'});
   return{width,height:DH(),faceOffset,aperture,parts,fit:null};}
  const kind=clinical?'clinical':metal?'metal':'oak',B=bays(width,kind);
  if(open){/* 바깥 두 짝만, 원래 길이(쌍여닫이 반 칸·병원 외짝 한 짝)로 젖힌다 */const len=Math.min(width/2,B.leaf/2),left=along(-width/2),right=along(width/2);
   parts.push({id:'open-left',a:left,b:along(-width/2,len),z0:0,z1:(DH()-JAMB),source:'leaf',half:0});parts.push({id:'open-right',a:right,b:along(width/2,len),z0:0,z1:(DH()-JAMB),source:'leaf',half:1});}
  else for(let i=0;i<B.n;i++){const u0=-width/2+i*(B.bay+JAMB),l0=u0+B.pad,l1=l0+B.leaf,u1=u0+B.bay;
   if(i>0)strip('mullion-'+i,u0-JAMB-B.pad,l0,0,(DH()-JAMB));else if(B.pad>1e-6)strip('pad-left',u0,l0,0,(DH()-JAMB));
   if(i===B.n-1&&B.pad>1e-6)strip('pad-right',l1,u1,0,(DH()-JAMB));
   if(clinical){const m=(l0+l1)/2;parts.push({id:'closed-left-'+i,a:along(l0),b:along(m),z0:0,z1:(DH()-JAMB),source:'leaf'});parts.push({id:'closed-right-'+i,a:along(m),b:along(l1),z0:0,z1:(DH()-JAMB),source:'leaf'});}
   else parts.push({id:'closed-leaf-'+i,a:along(l0),b:along(l1),z0:0,z1:(DH()-JAMB),source:'leaf'});}
  return{width,height:DH(),faceOffset,aperture,parts,fit:{kind,bays:B.n,bay:B.bay,leaf:B.leaf,pad:B.pad,natural:B.natural,stretch:B.stretch}};
 }
 const point=(p,z)=>{const q=project(p.x,p.y);return{x:q.x,y:q.y-z*TILE*Math.sqrt(1.5)*zoom};};
 const corners=p=>[point(p.a,p.z1),point(p.b,p.z1),point(p.b,p.z0),point(p.a,p.z0)];
 // R264: R204 유기 지형을 쓰는 지역(디테일 전용 제외)인지 — 그 지역 문틀은 어두운 바위색. 끄기: storyworld.r264.doorFrame {on:false}
 let frameOn=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r264.doorFrame')||'null');if(s&&s.on===false)frameOn=false;}catch(_){}
 const darkFrame=r=>{try{if(!frameOn||!r||hospital(r,{hospitalDoorFrameB3:1}))return false;const st=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.__r204;/* 지금 그 지역 벽을 R204 유기 지형이 대신 그리는 중(디테일 전용 지역은 원래 벽 그대로라 원래 문틀이 맞다) */return !!(st&&st.zone===r.id&&!st.decorOnly&&!st.failed);}catch(_){return false;}};
 function polygon(ps){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
 function onScreen(ps){return Math.max(...ps.map(p=>p.x))>=-16&&Math.min(...ps.map(p=>p.x))<=W+16&&Math.max(...ps.map(p=>p.y))>=-16&&Math.min(...ps.map(p=>p.y))<=H+16;}
 /* R347: 벽 띠는 그림을 띠 비율대로 잘라 붙인다(늘리지 않음). key 로 자를 자리를 고정해 매 프레임 같다. */
 function cropRect(rect,ps,key=''){const[sx,sy,sw,sh]=rect,[a,b,,d]=ps,tw=Math.hypot(b.x-a.x,b.y-a.y),th=Math.hypot(d.x-a.x,d.y-a.y);if(!fitOn||!(tw>0&&th>0))return rect;const t=tw/th;let h=0;for(const ch of String(key))h=(h*31+ch.charCodeAt(0))>>>0;const f=(h%997)/996;
  if(sw/sh>t){const w=Math.max(4,sh*t);return[sx+(sw-w)*f,sy,w,sh];}const hh=Math.max(4,sw/t);return[sx,sy+(sh-hh)*f,sw,hh];}
 function affinePatch(image,rect0,ps,key){const rect=cropRect(rect0,ps,key),[sx,sy,sw,sh]=rect,[a,b,,d]=ps;ctx.save();try{ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);}finally{ctx.restore();}}
 // Rebase the already-isometric leaf art before projecting it onto the wall.
 // This removes the baked diagonal slope instead of skewing it a second time.
 function leafPatch(image,cell,part,ps,metal,clinical=false){const s=clinical?{a:[60,477],b:[237,431],c:[60,98]}:metal?{a:[728,254],b:[826,290],c:[728,127]}:{a:[112,251],b:[199,285],c:[112,122]};
  const half=clinical?null:part.half,sourceA=half===1?[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2]:s.a,sourceB=half===0?[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2]:s.b,sourceC=[sourceA[0],sourceA[1]+s.c[1]-s.a[1]],u=[sourceB[0]-sourceA[0],sourceB[1]-sourceA[1]],v=[sourceC[0]-sourceA[0],sourceC[1]-sourceA[1]],det=u[0]*v[1]-u[1]*v[0],a=ps[3],b=ps[2],c=ps[0],du=[b.x-a.x,b.y-a.y],dv=[c.x-a.x,c.y-a.y];
  if(Math.abs(det)<1e-8)throw Error('Degenerate original door leaf registration');
  const m00=(du[0]*v[1]-dv[0]*u[1])/det,m01=(-du[0]*v[0]+dv[0]*u[0])/det,m10=(du[1]*v[1]-dv[1]*u[1])/det,m11=(-du[1]*v[0]+dv[1]*u[0])/det;
  ctx.save();try{polygon(ps);ctx.clip();ctx.transform(m00,m10,m01,m11,a.x-m00*sourceA[0]-m01*sourceA[1],a.y-m10*sourceA[0]-m11*sourceA[1]);ctx.drawImage(image,...cell.sourceRect,...cell.sourceRect);}finally{ctx.restore();}
 }
 function draw(p,r=room){if(!enabled(r,p))return false;const clinical=hospital(r,p),d=clinical?p.hospitalDoorFrameB3:p.r74Door,open=DOORS.isOpen(r,d),metal=clinical||/forge|machine|clock|vault|chapel|cathedral/.test(r.exploration.worldR74?.style),g=geometry(d,open,clinical,metal),atlas=clinical?{path:hospitalLeafPath,cells:[{key:'bronze-closed',sourceRect:[0,0,264,512]}]}:StoryArtR74.atlases.props,cell=atlas.cells.find(c=>c.key===(metal?'bronze':'oak')+'-closed'),leaf=readyImage(atlas.path)?.image,art=clinical?{path:p.path,wallRect:[680,20,500,260]}:r.exploration.surface?.art,wall=art?.path&&readyImage(art.path)?.image;
  // Native 2D impact shake translates its whole canvas. Architecture belongs
  // to the stationary Three terrain: project() already supplies viewport
  // coordinates. Keep DPR/linear transform and inherited clips, but remove
  // the canvas-only translation while recording these wall planes.
  ctx.save();try{const matrix=ctx.getTransform();ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,0,0);
  for(const part of g.parts){const ps=corners(part);if(!onScreen(ps)){stats.culled++;continue;}const path=part.source==='wall'?art?.path:atlas.path,plane={ax:part.a.x,ay:part.a.y,bx:part.b.x,by:part.b.y},owner={id:'r83-ward-door:'+p.id+':'+part.id,kind:'prop',x:(part.a.x+part.b.x)/2,y:(part.a.y+part.b.y)/2,alive:true,bodyPath:path,r83WardDoor:true,hospitalDoorR86:clinical,doorFaceOffsetR86:g.faceOffset,doorId:d.id,doorOpen:open,r83DoorPart:part.id,r83DoorPlane:plane,r83WallTint:part.source==='wall'?r.exploration.surface?.art?.r81Palette?.wall:undefined,groundAligned:false},paint=()=>{ctx.save();try{
   if(open&&part.source==='leaf')ctx.globalAlpha*=.88;
   if(part.source==='wall'){if(darkFrame(r)){/* R264: 유기 지형(R204) 지역은 문틀을 어두운 바위색으로 — 원래 병동 벽 그림(밝은 회색)·대체색 #687874 가 검은 동굴·늪 바닥 위에서 흰 테두리처럼 떠 보였다(사용자 "문에 흰테두리가 있는문제") */polygon(ps);const top=ps[0],bot=ps[3]||ps[0],gr=ctx.createLinearGradient?ctx.createLinearGradient(top.x,top.y,bot.x,bot.y):null;if(gr){gr.addColorStop(0,'#2b2520');gr.addColorStop(1,'#16120f');ctx.fillStyle=gr;}else ctx.fillStyle='#211c18';ctx.fill();}else if(wall&&art.wallRect)affinePatch(wall,art.wallRect,ps,part.id);else{polygon(ps);ctx.fillStyle='#687874';ctx.fill();}}
   else{const cur=!clinical&&curtainFor(r,d);if(cur)affinePatch(cur,[0,0,cur.naturalWidth||cur.width,cur.naturalHeight||cur.height],ps,part.id+':curtain');else{polygon(ps);ctx.fillStyle=clinical?'#365154':metal?'#665b3d':'#584336';ctx.fill();if(leaf&&cell)leafPatch(leaf,cell,part,ps,metal,clinical);}}
   stats.planes++;
  }finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();}
  stats.doors++;stats[open?'open':'closed']++;return true;
  }finally{ctx.restore();}
 }
 const command=window.StoryPhase1?.CommandScene?.prototype,materialBase=command?.material;
 if(materialBase)command.material=function(c){const m=materialBase.call(this,c);if(c.owner?.r83WardDoor&&Number.isInteger(c.owner.r83WallTint))m.color?.setHex?.(c.owner.r83WallTint);if(c.owner?.r83WardDoor&&c.kind==='image'){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;m.userData.doorSurfaceR86=true;}return m;};
 // Load the already packaged clinical door with native hospital preloads.
 const registerHospitalLeaf=()=>{const r=regionById?.ep1a08;if(r&&!r.paths.includes(hospitalLeafPath))r.paths.push(hospitalLeafPath);};
 const compileBase=compileWorld;compileWorld=function(...args){const result=compileBase.apply(this,args);registerHospitalLeaf();return result;};
 const warmHospitalLeaf=async()=>{if(solo()&&room?.id==='ep1a08')await ensureImages([hospitalLeafPath]);};
 const enterBase=enterRegion;enterRegion=async function(...args){const result=await enterBase.apply(this,args);if(result!==false)await warmHospitalLeaf();return result;};
 const restoreBase=restoreSave;restoreSave=async function(...args){const result=await restoreBase.apply(this,args);if(result!==false)await warmHospitalLeaf();return result;};
 registerHospitalLeaf();
 const spatialBase=command?.applySpatialPolicy;if(spatialBase)command.applySpatialPolicy=function(row,c,...args){const result=spatialBase.call(this,row,c,...args);if(c.owner?.r83WardDoor)row.mesh.renderOrder=c.kind==='image'?2:1;return result;};
 const base=drawProp;drawProp=function(p,...args){if(enabled(room,p))return draw(p);return base.apply(this,[p,...args]);};
 window.__STORYWORLD_WORLD_DOORS_R83__=Object.freeze({curtainFor,CURTAIN_DOORS,enabled,geometry,point,draw,hospital,bays,naturalBay,cropRect,doorFitR347:()=>fitOn,doorHeight:()=>DH(),inspect:()=>({revision:'R83',refinement:'R86',doorFit:fitOn?'R347':'off',stats:{...stats},wallHeight:DH(),jamb:JAMB,physicalAperture:true,canvasImpactTranslation:false,collisionChanged:false,sourceBitmapsChanged:false,clinicalDoorPath:hospitalLeafPath,frontSurfaceRegistered:true,clinicalDoorsRegistered:true,browserVerified:false,GPUVerified:false})});
})();
