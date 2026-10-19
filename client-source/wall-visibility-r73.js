/* Presentation only: retain flashlight shader hooks on isolated wall materials.
 * Wall hulls are camera-translation invariant; rebuild only for geometry/zoom. */
function cloneSpatialMaterialR73(source){
 const value=source.clone();value.onBeforeCompile=source.onBeforeCompile;value.customProgramCacheKey=source.customProgramCacheKey;return value;
}
function contextualWallOcclusion54(renderer,frame){
 if(frame.zone==='ep1a08')return;
 const sight=window.__STORYWORLD_SIGHT24__,projection=renderer.projection,zoom=frame.viewport?.zoom||1;
 const actors=(frame.entities||[]).filter(e=>e.alive&&(e.hero||e.enemy&&(!sight?.enabled||sight.pointVisible(e.x,e.y)))).map(e=>{
  const p=projection.worldToScreen(e.x,e.y),height=(e.height||66)*zoom;
  return{depth:(e.x+e.y)/2,points:[.30,.58,.82].flatMap(t=>[-.13,0,.13].map(x=>[p.x+height*x,p.y-height*t]))};
 });
 const dt=Math.max(0,Math.min(.1,frame.time-(renderer.occlusionTime54??frame.time)));renderer.occlusionTime54=frame.time;let faded=0,built=0;
 for(const entry of renderer.wallRows.values()){
  const mesh=entry.mesh,w=mesh.userData.originalWall;if(!w||!mesh.visible)continue;
  const key=[w.width,w.depth,w.height,w.angle||0,projection.zoom,projection.tile].join(':'),origin=projection.worldToScreen(w.x,w.y);
  let cached=mesh.userData.wallHullR73;
  if(cached?.key!==key){
   const a=w.angle||0,ca=Math.cos(a),sa=Math.sin(a),corners=[];
   for(const h of [0,w.height||0])for(const[x,y]of[[-w.width/2,-w.depth/2],[w.width/2,-w.depth/2],[w.width/2,w.depth/2],[-w.width/2,w.depth/2]]){const p=projection.worldToScreen(w.x+x*ca+y*sa,w.y-x*sa+y*ca,h);corners.push([p.x-origin.x,p.y-origin.y]);}
   corners.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),half=points=>{const h=[];for(const p of points){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
   const hull=half(corners).slice(0,-1).concat(half(corners.slice().reverse()).slice(0,-1));cached={key,hull,bounds:[Math.min(...hull.map(p=>p[0])),Math.min(...hull.map(p=>p[1])),Math.max(...hull.map(p=>p[0])),Math.max(...hull.map(p=>p[1]))]};mesh.userData.wallHullR73=cached;built++;
  }
  const b=cached.bounds,depth=(w.x+w.y)/2;
  const obscures=actors.some(e=>depth>e.depth+.04&&e.points.some(p=>{const q=[p[0]-origin.x,p[1]-origin.y];return q[0]>=b[0]&&q[0]<=b[2]&&q[1]>=b[1]&&q[1]<=b[3]&&polygonContains(cached.hull,q);})),target=obscures?.42:1;
  let state=mesh.userData.occlusion54;if(!state&&target===1)continue;
  if(!state){
   const original=Array.isArray(mesh.material)?mesh.material:[mesh.material],unique=new Map(),materials=original.map(m=>{if(!unique.has(m)){const c=cloneSpatialMaterialR73(m);c.transparent=true;renderer.spatialResources.add(c);unique.set(m,c);}return unique.get(m);});
   state={alpha:1,materials,baseOpacity:original.map(m=>m.opacity??1),baseDepth:original.map(m=>m.depthWrite)};mesh.material=Array.isArray(mesh.material)?materials:materials[0];mesh.userData.occlusion54=state;
  }
  state.alpha+=(target-state.alpha)*(1-Math.exp(-dt*(target<state.alpha?14:5)));if(Math.abs(state.alpha-target)<.002)state.alpha=target;
  state.materials.forEach((m,i)=>{m.opacity=state.baseOpacity[i]*state.alpha;m.depthWrite=state.alpha>=.995&&state.baseDepth[i];});if(state.alpha<.995)faded++;
 }
 renderer.occlusionStats54={revision:'r73-cached-masked-walls',fadedWalls:faded,admittedActors:actors.length,minimumAlpha:.42,hullsBuilt:built,localMaterials:true,collisionChanged:false,GPUVerified:false};
}
