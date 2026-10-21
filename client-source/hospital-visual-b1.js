/* Local Three presentation candidate. No simulation/layout/actor writes.
 * Existing original floor/wall pixels, world UVs and door geometry are reused.
 * These wall-mounted observation markers are design proposals, not story facts.
 * No new image, light, fog, bloom, floor obstacle or collision is introduced. */
const HOSPITAL_VISUAL_B1=Object.freeze({
 revision:'ep1a08-local-material-placement-b1',
 palette:{floor:0xbfc6bf,wall:0x78878a,background:0x4c5d62,door:0x9eafaa},
 markers:[
  {id:'west-observation-marker',u:-20,v:48.19,bars:1},
  {id:'east-observation-marker',u:20,v:48.19,bars:2}
 ],
 markerSize:{width:1.2,height:.78,depth:.045,centreHeight:1.25},
 sourceWall:'assets/visual-test/hospital-quiet-material-atlas-r42.png',
 sourceFloor:'assets/visual-test/hospital-floor-material-atlas.png',
 GPUVerified:false,legacyApplied:false
});
const hospitalVisualStatesB1=new WeakMap();
function hospitalVisualPlanB1(frame){
 if(frame?.zone!=='ep1a08'||!frame.exploration?.hospitalPrototypeB1||window.__STORYWORLD_VISUAL_OPTIONS__?.enabled!==true||(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off')return null;
 return HOSPITAL_VISUAL_B1;
}
function releaseHospitalVisualB1(renderer,state){
 if(!state)return;
 const live=new Set([renderer.stoneMaterial,renderer.wallMaterial,renderer.backgroundMaterial,renderer.visualWardMaterial,renderer.hospitalWallMaterial,renderer.hospitalDoorDetailMaterial37,...(renderer.visualFloorMaterials||[])]);
 for(const [m,old]of state.original){if(live.has(m)){m.color?.copy(old.color);if(old.emissive)m.emissive?.copy(old.emissive);}}
 if(state.root?.parent){state.root.parent.remove(state.root);state.root.traverse(o=>o.geometry?.dispose());}
 for(const m of state.materials)if(renderer.spatialResources.has(m)){renderer.spatialResources.delete(m);m.dispose();}
 hospitalVisualStatesB1.delete(renderer);
}
function applyHospitalVisualB1(renderer,frame){
 const plan=hospitalVisualPlanB1(frame);let state=hospitalVisualStatesB1.get(renderer);
 if(!plan){releaseHospitalVisualB1(renderer,state);renderer.hospitalVisualB1Diagnostic=null;return null;}
 if(state&&(state.generation!==renderer.sceneGeneration||state.layout!==frame.exploration)){releaseHospitalVisualB1(renderer,state);state=null;}
 if(!state){state={generation:renderer.sceneGeneration,layout:frame.exploration,original:new Map(),materials:[],root:null};hospitalVisualStatesB1.set(renderer,state);}
 const grade=(m,hex)=>{if(!m?.color)return;if(!state.original.has(m))state.original.set(m,{color:m.color.clone(),emissive:m.emissive?.clone()});m.color.setHex(hex);m.emissive?.setHex(hex);};
 for(const m of [renderer.stoneMaterial,...(renderer.visualFloorMaterials||[])])grade(m,plan.palette.floor);
 for(const m of [renderer.wallMaterial,renderer.hospitalWallMaterial])grade(m,plan.palette.wall);
 for(const m of [renderer.backgroundMaterial,renderer.visualWardMaterial])grade(m,plan.palette.background);
 grade(renderer.hospitalDoorDetailMaterial37,plan.palette.door);
 if(renderer.hospitalWallMaterial&&!state.root){
  const T=renderer.T,root=new T.Group();root.name='hospital-visual-b1-wall-markers';root.userData.presentationOnly=true;
  const material=cloneSpatialMaterialR73(renderer.hospitalWallMaterial);material.depthTest=true;material.depthWrite=false;material.color.setHex(plan.palette.door);attachSight24(material,renderer.sightState24);renderer.spatialResources.add(material);state.materials.push(material);
  const inset=cloneSpatialMaterialR73(renderer.hospitalWallMaterial);inset.depthTest=true;inset.depthWrite=false;inset.color.setHex(plan.palette.background);attachSight24(inset,renderer.sightState24);renderer.spatialResources.add(inset);state.materials.push(inset);
  const size=plan.markerSize;
  for(const p of plan.markers){
   const group=new T.Group();group.name=p.id;group.position.set((p.v+p.u)/2,size.centreHeight,(p.v-p.u)/2);group.rotation.y=Math.PI/4;
   const box=(w,h,d,x,y,z,m,order=0)=>{
    const geometry=new T.BoxGeometry(w,h,d),pos=geometry.attributes.position,uv=geometry.attributes.uv,panelHeight=Math.max(...frame.exploration.hospitalVisualWalls12.map(w=>w.height));
    // Same atlas registration and world texel density as native wall faces.
    // The two anchors keep the small panel inside one mirrored UV cell.
    for(let i=0;i<pos.count;i++){const along=(p.u/Math.SQRT2+pos.getX(i)+x)/panelHeight,cell=Math.floor(along),u=((cell%2+2)%2)?1-(along-cell):along-cell,v=1-(size.centreHeight+pos.getY(i)+y)/panelHeight;uv.setXY(i,(628.5+u*623)/1254,1-(1.5+v*623)/1254);}
    const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.layers.set(2);mesh.renderOrder=order;mesh.castShadow=mesh.receiveShadow=false;mesh.userData.presentationOnly=true;mesh.userData.collisionChanged=false;group.add(mesh);
   };
   box(size.width,size.height,size.depth,0,0,0,material);
   box(size.width-.14,size.height-.14,.012,0,0,.03,inset,1);
   for(let i=0;i<p.bars;i++)box(.085,.31,.014,(i-(p.bars-1)/2)*.19,0,.045,material,2);
   root.add(group);
  }
  renderer.spatialRoot.add(root);state.root=root;
 }
 renderer.hospitalVisualB1Diagnostic={revision:plan.revision,scope:'ep1a08 solo Three only',materialsApplied:state.original.size,wallMarkers:state.root?.children.length||0,meshCount:state.root?.children.reduce((n,g)=>n+g.children.length,0)||0,existingTextureReused:true,worldUVsPreserved:true,projectionChanged:false,doorGeometryChanged:false,collisionChanged:false,actorsChanged:false,newLights:0,newFog:0,newBloom:0,GPUVerified:false,pixelVerified:false};
 return renderer.hospitalVisualB1Diagnostic;
}
