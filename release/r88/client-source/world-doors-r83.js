/* R83: bind regional doors to their actual wall aperture. Source PNG pixels,
 * native door states, interactions and collision remain authoritative. */
(()=>{'use strict';
 if(window.__STORYWORLD_WORLD_DOORS_R83__)return;
 const DOORS=window.__STORYWORLD_WORLD_R74__,stats={doors:0,closed:0,open:0,planes:0,culled:0},HEIGHT=2.7,JAMB=.24,LEAF=HEIGHT-JAMB;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const hospital=(r,p)=>r?.id==='ep1a08'&&!!r.exploration?.hospitalDoorsB3&&!!p?.hospitalDoorFrameB3;
 const enabled=(r,p)=>solo()&&r?.layer==='STORY'&&(hospital(r,p)||!!r.exploration?.worldWardR81&&!!p?.r74Door);
 const hospitalLeafPath='assets/world-r80/r80-057.webp';
 function geometry(d,open,clinical=false){if(!d||!Number.isFinite(d.x+d.y+d.width+d.depth)||d.width<=0||d.depth<=0)throw Error('Invalid native ward door aperture');
  // A closed door's native wall has thickness. Its centre plane is hidden
  // behind the opaque front face; register art just outside that face.
  const width=d.axis==='x'?d.depth:d.width,faceOffset=(d.axis==='x'?d.width:d.depth)/2+.015,along=(u,v=0)=>d.axis==='x'?{x:d.x+faceOffset+v,y:d.y+u}:{x:d.x+u,y:d.y+faceOffset+v},at=(u,z)=>({...along(u),z}),parts=[];
  const strip=(id,u0,u1,z0,z1)=>parts.push({id,a:along(u0),b:along(u1),z0,z1,source:'wall'});
  strip('left-jamb',-width/2-JAMB,-width/2,0,HEIGHT);strip('right-jamb',width/2,width/2+JAMB,0,HEIGHT);strip('header',-width/2,width/2,LEAF,HEIGHT);
  if(open){const left=along(-width/2),right=along(width/2);parts.push({id:'open-left',a:left,b:along(-width/2,width/2),z0:0,z1:LEAF,source:'leaf',half:0});parts.push({id:'open-right',a:right,b:along(width/2,width/2),z0:0,z1:LEAF,source:'leaf',half:1});}
  else if(clinical){parts.push({id:'closed-left',a:along(-width/2),b:along(0),z0:0,z1:LEAF,source:'leaf'});parts.push({id:'closed-right',a:along(0),b:along(width/2),z0:0,z1:LEAF,source:'leaf'});}
  else parts.push({id:'closed-leaf',a:along(-width/2),b:along(width/2),z0:0,z1:LEAF,source:'leaf'});
  return{width,height:HEIGHT,faceOffset,aperture:[at(-width/2,0),at(width/2,0),at(width/2,HEIGHT),at(-width/2,HEIGHT)],parts};
 }
 const point=(p,z)=>{const q=project(p.x,p.y);return{x:q.x,y:q.y-z*TILE*Math.sqrt(1.5)*zoom};};
 const corners=p=>[point(p.a,p.z1),point(p.b,p.z1),point(p.b,p.z0),point(p.a,p.z0)];
 function polygon(ps){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
 function onScreen(ps){return Math.max(...ps.map(p=>p.x))>=-16&&Math.min(...ps.map(p=>p.x))<=W+16&&Math.max(...ps.map(p=>p.y))>=-16&&Math.min(...ps.map(p=>p.y))<=H+16;}
 function affinePatch(image,rect,ps){const[sx,sy,sw,sh]=rect,[a,b,,d]=ps;ctx.save();try{ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);}finally{ctx.restore();}}
 // Rebase the already-isometric leaf art before projecting it onto the wall.
 // This removes the baked diagonal slope instead of skewing it a second time.
 function leafPatch(image,cell,part,ps,metal,clinical=false){const s=clinical?{a:[60,477],b:[237,431],c:[60,98]}:metal?{a:[728,254],b:[826,290],c:[728,127]}:{a:[112,251],b:[199,285],c:[112,122]};
  const half=clinical?null:part.half,sourceA=half===1?[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2]:s.a,sourceB=half===0?[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2]:s.b,sourceC=[sourceA[0],sourceA[1]+s.c[1]-s.a[1]],u=[sourceB[0]-sourceA[0],sourceB[1]-sourceA[1]],v=[sourceC[0]-sourceA[0],sourceC[1]-sourceA[1]],det=u[0]*v[1]-u[1]*v[0],a=ps[3],b=ps[2],c=ps[0],du=[b.x-a.x,b.y-a.y],dv=[c.x-a.x,c.y-a.y];
  if(Math.abs(det)<1e-8)throw Error('Degenerate original door leaf registration');
  const m00=(du[0]*v[1]-dv[0]*u[1])/det,m01=(-du[0]*v[0]+dv[0]*u[0])/det,m10=(du[1]*v[1]-dv[1]*u[1])/det,m11=(-du[1]*v[0]+dv[1]*u[0])/det;
  ctx.save();try{polygon(ps);ctx.clip();ctx.transform(m00,m10,m01,m11,a.x-m00*sourceA[0]-m01*sourceA[1],a.y-m10*sourceA[0]-m11*sourceA[1]);ctx.drawImage(image,...cell.sourceRect,...cell.sourceRect);}finally{ctx.restore();}
 }
 function draw(p,r=room){if(!enabled(r,p))return false;const clinical=hospital(r,p),d=clinical?p.hospitalDoorFrameB3:p.r74Door,open=DOORS.isOpen(r,d),g=geometry(d,open,clinical),metal=clinical||/forge|machine|clock|vault|chapel|cathedral/.test(r.exploration.worldR74?.style),atlas=clinical?{path:hospitalLeafPath,cells:[{key:'bronze-closed',sourceRect:[0,0,264,512]}]}:StoryArtR74.atlases.props,cell=atlas.cells.find(c=>c.key===(metal?'bronze':'oak')+'-closed'),leaf=readyImage(atlas.path)?.image,art=clinical?{path:p.path,wallRect:[680,20,500,260]}:r.exploration.surface?.art,wall=art?.path&&readyImage(art.path)?.image;
  // Native 2D impact shake translates its whole canvas. Architecture belongs
  // to the stationary Three terrain: project() already supplies viewport
  // coordinates. Keep DPR/linear transform and inherited clips, but remove
  // the canvas-only translation while recording these wall planes.
  ctx.save();try{const matrix=ctx.getTransform();ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,0,0);
  for(const part of g.parts){const ps=corners(part);if(!onScreen(ps)){stats.culled++;continue;}const path=part.source==='wall'?art?.path:atlas.path,plane={ax:part.a.x,ay:part.a.y,bx:part.b.x,by:part.b.y},owner={id:'r83-ward-door:'+p.id+':'+part.id,kind:'prop',x:(part.a.x+part.b.x)/2,y:(part.a.y+part.b.y)/2,alive:true,bodyPath:path,r83WardDoor:true,hospitalDoorR86:clinical,doorFaceOffsetR86:g.faceOffset,doorId:d.id,doorOpen:open,r83DoorPart:part.id,r83DoorPlane:plane,r83WallTint:part.source==='wall'?r.exploration.surface?.art?.r81Palette?.wall:undefined,groundAligned:false},paint=()=>{ctx.save();try{
   if(open&&part.source==='leaf')ctx.globalAlpha*=.88;
   if(part.source==='wall'){if(wall&&art.wallRect)affinePatch(wall,art.wallRect,ps);else{polygon(ps);ctx.fillStyle='#687874';ctx.fill();}}
   else{polygon(ps);ctx.fillStyle=clinical?'#365154':metal?'#665b3d':'#584336';ctx.fill();if(leaf&&cell)leafPatch(leaf,cell,part,ps,metal,clinical);}
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
 window.__STORYWORLD_WORLD_DOORS_R83__=Object.freeze({enabled,geometry,point,draw,hospital,inspect:()=>({revision:'R83',refinement:'R86',stats:{...stats},wallHeight:HEIGHT,jamb:JAMB,physicalAperture:true,canvasImpactTranslation:false,collisionChanged:false,sourceBitmapsChanged:false,clinicalDoorPath:hospitalLeafPath,frontSurfaceRegistered:true,clinicalDoorsRegistered:true,browserVerified:false,GPUVerified:false})});
})();
