/* R83: stable player camera, close battle framing, coherent perimeter masonry and matching
 * wall-top materials. R81 API name retained for native integration guards. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!A||!C||window.__STORYWORLD_WORLD_PRESENTATION_R81__)return;
 const BRAIN='assets/scenery-r59/brain.webp',BATTLE_ZOOM=1.22,PERIMETER=3,ROOF_HEIGHT=2.705,cells=new WeakMap(),roofViews=new WeakMap();
 const stats={cameraPlans:0,cameraUpdates:0,voidBuilds:0,backingsHidden:0,roofMaterials:0,perimeterBuilds:0};
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const eligible=L=>!!L?.floorCells?.length&&!!(L.hospitalCoreB2||L.worldWardR81||L.refugeR82);
 const pc=()=>!(typeof mobile==='function'&&mobile())&&!(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches);
 const key=(x,y)=>x+':'+y;
 function floorSet(L){let f=cells.get(L);if(!f){f=new Set(L.floorCells.map(([x,y])=>key(x,y)));cells.set(L,f);}return f;}
 function palette(L){const family=L.surface?.art?.r81Environment||L.worldWardR81?.environment?.family||'clinical',p=L.surface?.art?.r81Palette;
  return{roof:p?'#'+p.wall.toString(16).padStart(6,'0'):'#b2b3b0',void:'#817985',family,backdrop:BRAIN};
 }
 function sample(L,p){const floor=floorSet(L),b=L.bounds;let walk=0,inside=0,total=0;
  // Equal-area samples in the actual isometric viewport; no screenshot claim.
  for(let sy=0;sy<16;sy++)for(let sx=0;sx<24;sx++){
   const u=((sx+.5)/24-.5)*p.width/(p.tile*p.zoom)+p.camX-p.camY,
    v=((sy+.5)/16-.52)*p.height/(p.tile*.5*p.zoom)+p.camX+p.camY,
    x=(u+v)/2,y=(v-u)/2;
   if(x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3])inside++;
   if(floor.has(key(Math.floor(x),Math.floor(y))))walk++;total++;
  }return{floor:walk/total,inside:inside/total,exterior:1-inside/total,samples:total};
 }
 function screen(p,a){return{x:(a.x-a.y-p.camX+p.camY)*p.tile*p.zoom+p.width*.5,y:(a.x+a.y-p.camX-p.camY)*p.tile*.5*p.zoom+p.height*.52};}

 function cameraPlan(L,input,hero){
  if(!eligible(L)||!hero||!Number.isFinite(hero.x+hero.y))return null;
  const projection={tile:34,...input,camX:hero.x,camY:hero.y},coverage=sample(L,projection);
  stats.cameraPlans++;return{projection,coverage,before:coverage,offset:{u:0,v:0},heroScreen:screen(projection,hero),visibleActors:[],method:'Continuous player-centred target; no enemy or floor-coverage steering',GPUVerified:false};
 }
 function outsideRects(bounds,view){const[x0,y0,x1,y1]=bounds,[vx0,vy0,vx1,vy1]=view,rows=[];
  const add=(x,y,w,d)=>{if(w>1e-6&&d>1e-6)rows.push({x,y,width:w,depth:d});};
  add(vx0,vy0,Math.max(0,Math.min(x0,vx1)-vx0),vy1-vy0);
  add(Math.max(x1,vx0),vy0,Math.max(0,vx1-Math.max(x1,vx0)),vy1-vy0);
  const left=Math.max(vx0,x0),right=Math.min(vx1,x1);
  add(left,vy0,right-left,Math.max(0,Math.min(y0,vy1)-vy0));
  add(left,Math.max(y1,vy0),right-left,Math.max(0,vy1-Math.max(y1,vy0)));
  return rows;
 }

 function perimeterBounds(L){const b=L.bounds;return[b[0]-PERIMETER,b[1]-PERIMETER,b[2]+PERIMETER,b[3]+PERIMETER];}
 // This is a render-only view. Floor cells, walls, doors and physics still use
 // L. Extending existing caps gives the maze a solid masonry edge instead of
 // a sudden brain-texture gutter immediately behind the boundary wall.
 function roofFrame(frame){const L=frame.exploration;if(!solo()||frame.layer!=='STORY'||!eligible(L))return frame;
  const inherited=window.__STORYWORLD_WORLD_ASSETS_R80__?.roofFrame(frame)||frame;
  let view=roofViews.get(L);if(!view){view={...inherited.exploration,hospitalCoreB2:true,bounds:perimeterBounds(L),r83PresentationEnvelope:true};roofViews.set(L,view);}
  const hero=frame.entities?.find(e=>e.hero&&Number.isFinite(e.x+e.y));
  return{...inherited,zone:'ep1a08',exploration:view,hospitalFocus13:inherited.hospitalFocus13?.length?inherited.hospitalFocus13:hero?[{x:hero.x,y:hero.y,focusWidth:1.2,focusHeight:3}]:[]};
 }
 function buildPerimeterGeometry(T,L){const b=perimeterBounds(L),bevel=.18,outer=[b[0]-bevel,b[1]-bevel,b[2]+bevel,b[3]+bevel],tile=L.surface?.art?.tileWorld||4.5,vertices=[],uv=[],indices=[];
  const ring=a=>[[a[0],a[1]],[a[2],a[1]],[a[2],a[3]],[a[0],a[3]]],inner=ring(b),rim=ring(outer);
  const quad=(points,coords)=>{const at=vertices.length/3;for(let i=0;i<4;i++){vertices.push(...points[i]);uv.push(...coords[i]);}indices.push(at,at+2,at+1,at,at+3,at+2);};
  for(let i=0;i<4;i++){const j=(i+1)%4,a=inner[i],c=inner[j],d=rim[j],e=rim[i];
   quad([[a[0],ROOF_HEIGHT,a[1]],[c[0],ROOF_HEIGHT,c[1]],[d[0],2.42,d[1]],[e[0],2.42,e[1]]],[a,c,d,e].map(([x,y])=>[x/tile,-y/tile]));
   const u0=(i%2?e[1]:e[0])/tile,u1=(i%2?d[1]:d[0])/tile;
   quad([[e[0],2.42,e[1]],[d[0],2.42,d[1]],[d[0],-.045,d[1]],[e[0],-.045,e[1]]],[[u0,2.42/tile],[u1,2.42/tile],[u1,-.045/tile],[u0,-.045/tile]]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData={presentationOnly:true,perimeterBounds:b,bevel,collisionChanged:false};return g;
 }
 function finishPerimeter(renderer,L){if(!renderer.hospitalRoofMaterialR2)return;
  const T=renderer.T,source=renderer.hospitalRoofMaterialR2;
  if(!renderer.perimeterMaterialR83){const m=source.clone();m.name='r83-wall-matched-boundary-material';renderer.spatialResources.add(m);renderer.perimeterMaterialR83=m;}
  const m=renderer.perimeterMaterialR83;if(m.map!==source.map){m.map=source.map;m.needsUpdate=true;}m.color.copy(source.color).multiplyScalar(.82);
  if(renderer.perimeterLayoutR83===L&&renderer.perimeterMeshR83)return;
  if(renderer.perimeterMeshR83){renderer.spatialRoot.remove(renderer.perimeterMeshR83);renderer.perimeterMeshR83.geometry.dispose();}
  const mesh=new T.Mesh(buildPerimeterGeometry(T,L),m);mesh.name='r83-masonry-boundary-bevel-and-fascia';mesh.layers.set(2);mesh.userData={presentationOnly:true,collisionChanged:false,perimeter:PERIMETER,beveled:true};renderer.spatialRoot.add(mesh);renderer.perimeterMeshR83=mesh;renderer.perimeterLayoutR83=L;stats.perimeterBuilds++;
 }
 function buildVoidGeometry(T,rects){const vertices=[],uv=[],indices=[];
  for(const r of rects){const at=vertices.length/3;for(const[x,y]of[[r.x,r.y],[r.x+r.width,r.y],[r.x+r.width,r.y+r.depth],[r.x,r.y+r.depth]]){vertices.push(x,-.045,y);uv.push(x/24,-y/24);}indices.push(at,at+2,at+1,at,at+3,at+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 function brainTexture(renderer){if(renderer.brainLeaseR82||!renderer.assets?.lease)return;
  const lease=renderer.assets.lease(BRAIN);renderer.brainLeaseR82=lease;
  lease.promise.then(asset=>{if(renderer.disposed||renderer.brainLeaseR82!==lease)return;const T=renderer.T,texture=asset.texture.clone();texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;texture.repeat.set(1,1);texture.offset.set(0,0);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;texture.userData={...texture.userData,r82BrainBackdrop:true,worldTile:24,sourcePath:BRAIN};renderer.spatialResources.add(texture);renderer.brainTextureR82=texture;
   if(renderer.voidMaterialR81){renderer.voidMaterialR81.map=texture;renderer.voidMaterialR81.needsUpdate=true;}
  }).catch(e=>{if(renderer.brainLeaseR82===lease)renderer.brainErrorR82=String(e);});
 }
 function finishRoof(renderer,L){const mesh=renderer.hospitalRoofMeshR2,m=renderer.hospitalRoofMaterialR2;if(!mesh||!m)return;
  const T=renderer.T,source=L.hospitalCoreB2?(renderer.hospitalWallMaterial||renderer.wallMaterial):(renderer.wallCapMaterial61||renderer.wallMaterial),tile=L.surface?.art?.tileWorld||4.5;
  if(source?.map&&renderer.roofSourceR82!==source.map){
   if(renderer.roofTextureR82){renderer.spatialResources.delete(renderer.roofTextureR82);renderer.roofTextureR82.dispose();}
   const map=source.map.clone();map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.needsUpdate=true;map.userData={...map.userData,r82SameWallSource:true};renderer.spatialResources.add(map);renderer.roofTextureR82=map;renderer.roofSourceR82=source.map;m.map=map;m.needsUpdate=true;stats.roofMaterials++;
  }
  if(source?.color)m.color.copy(source.color).multiplyScalar(.94);else m.color.set(palette(L).roof);
  const g=mesh.geometry;if(!g.userData.r82WallUV){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/tile,-p.getZ(i)/tile);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.userData.r82WallUV=true;}
  mesh.userData.r82WallMatched=true;
 }
 function ensureVoid(renderer,frame){const L=frame.exploration;if(!solo()||frame.layer!=='STORY'||!eligible(L)||!renderer.spatialRoot)return;
  if(renderer.visualWardMesh){renderer.visualWardMesh.visible=false;stats.backingsHidden++;}
  for(const mesh of renderer.backdropRows?.values()||[])mesh.visible=false;
  for(const mesh of renderer.fogRows?.values()||[])mesh.visible=false;
  const view=(renderer.visibleTerrainBounds||L.bounds).map((v,i)=>i<2?Math.floor(v/8)*8-16:Math.ceil(v/8)*8+16),tag=view.join(':'),plan=window.__STORYWORLD_HOSPITAL_A5__?.plan(L);if(!plan)return;
  finishRoof(renderer,L);finishPerimeter(renderer,L);brainTexture(renderer);
  if(renderer.voidLayoutR81===L&&renderer.voidBoundsR81===tag&&renderer.voidMeshR81)return;
  if(renderer.voidMeshR81){renderer.spatialRoot.remove(renderer.voidMeshR81);renderer.voidMeshR81.geometry.dispose();}
  const T=renderer.T,rects=[...plan.roofRects,...outsideRects(L.bounds,view)];
  if(!renderer.voidMaterialR81){renderer.voidMaterialR81=new T.MeshBasicMaterial({color:0x817985,map:renderer.brainTextureR82||null,side:T.DoubleSide,depthTest:true,depthWrite:true,toneMapped:false});renderer.spatialResources.add(renderer.voidMaterialR81);}
  const mesh=new T.Mesh(buildVoidGeometry(T,rects),renderer.voidMaterialR81);mesh.name='r82-brain-nonwalkable-backing';mesh.layers.set(2);mesh.renderOrder=-2;mesh.userData={presentationOnly:true,collisionChanged:false,rects,exteriorRects:outsideRects(L.bounds,view),texture:BRAIN,worldAnchored:true};renderer.spatialRoot.add(mesh);
  renderer.voidMeshR81=mesh;renderer.voidLayoutR81=L;renderer.voidBoundsR81=tag;stats.voidBuilds++;
 }
 const roomBase=C.ensureHospitalRooms;C.ensureHospitalRooms=function(frame){const r=roomBase.call(this,frame);if(solo()&&frame.layer==='STORY'&&eligible(frame.exploration)&&this.visualWardMesh)this.visualWardMesh.visible=false;return r;};
 const roofBase=C.ensureHospitalRoofsR2;C.ensureHospitalRoofsR2=function(frame){const r=roofBase.call(this,roofFrame(frame));ensureVoid(this,frame);return r;};
 const clearBase=C.clearScene;C.clearScene=function(...args){this.brainLeaseR82?.release();this.brainLeaseR82=null;this.brainTextureR82=this.roofSourceR82=this.roofTextureR82=this.brainErrorR82=null;this.voidMeshR81=this.voidMaterialR81=this.voidLayoutR81=this.voidBoundsR81=null;this.perimeterMeshR83=this.perimeterMaterialR83=this.perimeterLayoutR83=null;return clearBase.apply(this,args);};
 const inspectBase=C.inspectSpatial;C.inspectSpatial=function(...args){return{...inspectBase.apply(this,args),presentationR81:{revision:'R83',solidNonwalkableBacking:!!this.voidMeshR81,grayViewportTilesVisible:!!this.visualWardMesh?.visible,brainTextureReady:!!this.brainTextureR82,brainError:this.brainErrorR82||null,roofWallMatched:!!this.hospitalRoofMeshR2?.userData.r82WallMatched,perimeterMasonry:!!this.perimeterMeshR83,perimeterWidth:PERIMETER,collisionChanged:false,GPUVerified:false}};};
 let current=null,lastPlan=null;
 function cameraEnabled(){return solo()&&pc()&&layer==='STORY'&&eligible(room?.exploration)&&player&&Number.isFinite(player.x+player.y);}
 function applyCamera(dt=0){if(!cameraEnabled()){current=null;lastPlan=null;return null;}
  const L=room.exploration,native=window.__STORYWORLD_CAMERA_R63__?.plan(),targetZoom=(native?.targetZoom||1)*BATTLE_ZOOM;
  const changed=!current||current.layout!==L,step=Math.max(0,Math.min(.1,Number(dt)||0)),gain=changed?1:1-Math.exp(-9*step);
  // One owner updates position AND zoom. Draw and settings never invoke a
  // second competing tracker; nearby enemies cannot change the target.
  const z=changed?targetZoom:current.zoom+(targetZoom-current.zoom)*gain;
  let x=changed?player.x:current.x+(player.x-current.x)*gain,y=changed?player.y:current.y+(player.y-current.y)*gain;
  const du=(player.x-player.y-x+y)*TILE*z,dv=(player.x+player.y-x-y)*TILE*.5*z;
  // Large teleports are resynchronised once instead of dragging the camera
  // through walls. Normal walking uses continuous exponential following.
  if(Math.abs(du)>W*.34||Math.abs(dv)>H*.34){x=player.x;y=player.y;}
  zoom=Math.abs(z-targetZoom)<1e-8?targetZoom:z;cam.x=x;cam.y=y;
  current={layout:L,x,y,zoom,targetZoom,width:W,height:H};lastPlan={projection:{width:W,height:H,zoom,camX:x,camY:y,tile:TILE},offset:{u:0,v:0},method:'stable-player-follow'};stats.cameraUpdates++;return lastPlan;
 }
 const cameraBase=cameraTick;cameraTick=function(dt){if(cameraEnabled())return applyCamera(dt);current=null;lastPlan=null;return cameraBase.apply(this,arguments);};
 const controller=window.__STORYWORLD_PHASE1__?.controller,drawBase=controller?.draw;
 if(drawBase)controller.draw=function(...args){if(cameraEnabled()&&(!current||current.layout!==room.exploration))applyCamera(0);return drawBase.apply(this,args);};
 window.__STORYWORLD_WORLD_PRESENTATION_R81__=Object.freeze({eligible,palette,sample,cameraPlan,outsideRects,perimeterBounds,roofFrame,buildPerimeterGeometry,buildVoidGeometry,ensureVoid,finishRoof,finishPerimeter,applyCamera,ownsCamera:cameraEnabled,
  inspect:()=>({revision:'R83',stats:{...stats},camera:current?{x:current.x,y:current.y,zoom,targetZoom:current.targetZoom}:null,lastPlan,pcZoomFactor:BATTLE_ZOOM,perimeterWidth:PERIMETER,persistentProjection:true,enemySteering:false,collisionChanged:false,saveSchemaChanged:false,browserVerified:false,GPUVerified:false})});
})();
