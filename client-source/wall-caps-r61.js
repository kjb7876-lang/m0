/* R61: finish regional wall tops with the wall's own isolated diffuse material.
 * Native wall bounds, floor cells, hospital geometry and collision stay intact.
 * One world-anchored mirrored UV calculation is shared by Canvas and Three.
 */
function wallCapArt61(art){
 if(!art?.r55PhysicalUV)return art;
 return{...art,floorRect:art.wallRect};
}
function wallCapTiles61(w,art){
 return terrainTiles([{x:w.x-w.width/2,y:w.y-w.depth/2,width:w.width,depth:w.depth}],wallCapArt61(art));
}
function paintWallCap61(w,art,project,lift,paint){
 const rect=art.wallRect;
 for(const tile of wallCapTiles61(w,art)){
  let points=tile.points.map(([x,y])=>{const p=project(x,y);return{x:p.x,y:p.y-lift};});
  const uv=tile.uv,u0=Math.min(uv[0],uv[2]),u1=Math.max(uv[0],uv[2]),v0=Math.min(uv[1],uv[5]),v1=Math.max(uv[1],uv[5]);
  if(uv[2]<uv[0])points=[points[1],points[0],points[3],points[2]];
  if(uv[5]<uv[1])points=[points[3],points[2],points[1],points[0]];
  paint(points,[rect[0]+u0*rect[2],rect[1]+v0*rect[3],(u1-u0)*rect[2],(v1-v0)*rect[3]],.82);
 }
}
function configureRegionalWallFinish61(renderer,art){
 if(!art?.r55PhysicalUV||!renderer.wallMaterial)return;
 const T=renderer.T;
 // Share the exact isolated wall map. Geometry supplies fixed world UVs;
 // no lights, camera-dependent shader term, normal map or bright outline.
 for(const [key,color]of[['wallCapMaterial61',0x999b98],['regionalTrimMaterial55',0x8c8d8a]]){
  const material=renderer.wallMaterial.clone();material.color=new T.Color(color);material.side=T.DoubleSide;
  material.userData.r61WallFinish={wallSourceRect:[...art.wallRect],sameWallTexture:true,worldAnchored:true,prelit:true,flatColorCap:false};
  renderer[key]=material;renderer.spatialResources.add(material);attachSight24(material,renderer.sightState24);
 }
}
