/* Mammon miniature pilot: ep1b06 STORY only. Unregistered V3 surface/furniture candidate; public registration requires acceptance.
 * Expanded native baseline 533fbec; native geometry, R228 room tint and simulation retained.
 * Existing physical wall footprints own every architectural finish below.
 * No floor, collision, door, enemy, combat, story or save object is written.
 */
(()=>{'use strict';
 const W=window,NAME='__STORYWORLD_MAMMON_MINIATURE_PILOT__',ZONE='ep1b06';if(W[NAME])return;
 const A=W.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!C)return;
 const REV='mammon-miniature-v14-expanded-v3-review2';
 const ASSET_ROOT='assets/mammon-v3/';
 const assets=Object.freeze({postHigh:ASSET_ROOT+'P01-steel-post-tall-v2.webp',postLow:ASSET_ROOT+'P02-steel-post-low-v1.webp',jamb:ASSET_ROOT+'D01-open-portal-frame-v2.webp',floor:ASSET_ROOT+'F01-floor-single-slab-top-v1.webp',metal:ASSET_ROOT+'W06-wall-steel-front-flat-v1.webp',vault:ASSET_ROOT+'O02-deposit-cabinet-down-right-v3.webp',ledger:ASSET_ROOT+'O01-records-desk-up-right-v4.webp'});
 // Pixel contacts are from the reviewed derivative contract, not canvas bottom.
 const pivots=Object.freeze({lock:[362/768,411.5/512],ledger:[377.939120631/768,325.122886133/384]});
 const palette=Object.freeze({floor:0xb4bdc0,wall:0x9caeb9,cap:0xbac5c6,trim:0x9b825b});
 const states=new WeakMap(),live=new Set(),images=new Map(),wrapped=new WeakSet();
 const stats={builds:0,disposed:0,passes:0,errors:0,imageErrors:0,overlapSkips:0};let on=true,last=null,lastError=null;
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y),key=(x,y)=>x+':'+y;
 const solo=()=>!W.__STORYWORLD_COOP_SIM_R62__?.mode||W.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const overlap=()=>W.__STORYWORLD_SEVEN_SINS_ART__?.inspect?.().on===true;
 const eligible=f=>on&&solo()&&!overlap()&&f?.zone===ZONE&&f.layer==='STORY'&&!!f.exploration&&!f.exploration.samongR103&&f.exploration.type!=='r103-samong'&&!(typeof room==='object'&&room?.samongR115);
 function boxes(L){return L.r224Rooms?.length?L.r224Rooms.map(q=>({...q})):(L.nodes||[]).map(n=>{const b=n.box||[n.x-n.width/2,n.y-n.depth/2,n.x+n.width/2,n.y+n.depth/2];return{id:n.id,x0:b[0],y0:b[1],x1:b[2],y1:b[3]};}).filter(q=>Object.values(q).every(Number.isFinite));}
 // Pure native-coordinate planner. Waypoints are not rooms. Keep fighting areas
 // and door approaches empty, and re-evaluate when asynchronous R224 props arrive.
 function plan(id,L,rm){
  if(id!==ZONE||!L)return{zone:id,floors:[],props:[],reason:'outside-scope'};
  const cells=new Set((L.floorCells||[]).map(c=>key(c[0],c[1])));
  const walk=(x,y)=>cells.has(key(Math.floor(x),Math.floor(y)))&&!A.explorationBlocked?.(L,x,y,.42);
  const avoid=[...(L.worldR74?.doors||[]).filter(finite).map(p=>({...p,r:Math.max(p.width||0,p.depth||0)/2+3})),
   ...[L.entry,L.gate,rm?.objective,rm?.altar].filter(finite).map(p=>({...p,r:4})),
   ...(rm?.props||[]).filter(p=>finite(p)&&p.visible!==false&&!p.destroyed).map(p=>({...p,r:p.interactive||p.r74Door?3.5:2.3}))];
  const openMouth=(q,p)=>{
   const cross=(x,y,dx,dy)=>walk(x-dx*.6,y-dy*.6)&&walk(x+dx*.6,y+dy*.6)&&walk(x,y);
   for(const t of [-1.5,-.5,.5,1.5]){
    if(p.y-q.y0<3.4&&cross(p.x+t,q.y0,0,1)||q.y1-p.y<3.4&&cross(p.x+t,q.y1,0,1))return true;
    if(p.x-q.x0<3.4&&cross(q.x0,p.y+t,1,0)||q.x1-p.x<3.4&&cross(q.x1,p.y+t,1,0))return true;
   }return false;
  };
  const props=[],roles={records:0,vault:1,security:2,antechamber:3};
  const rooms=boxes(L).map(q=>{const n=(L.nodes||[]).find(n=>n.id===q.id);const name=n?.name||'';
   const role=/기록/.test(name)?'records':/금고 구획/.test(name)?'vault':/보안/.test(name)?'security':/전실/.test(name)?'antechamber':null;
   return{...q,role,name,centerX:n?.x??(q.x0+q.x1)/2,centerY:n?.y??(q.y0+q.y1)/2,waypoint:n?.storyMapR171==='waypoint'};
  }).filter(q=>q.role&&!q.waypoint).sort((a,b)=>roles[a.role]-roles[b.role]||a.id-b.id);
  for(const q of rooms){if(props.length>=12)break;const candidates=[];
   // Rear perimeter only. The center aisle and logical encounter centers stay open.
   for(const inset of (q.role==='records'?[2.4,3.05,3.55]:[2.4,3.05])){
    for(let x=q.x0+inset;x<=q.x1-inset;x+=.85)candidates.push({x,y:q.y0+inset});
    for(let y=q.y0+inset;y<=q.y1-inset;y+=.85)candidates.push({x:q.x0+inset,y});
    // A rear edge can be entirely open where a corridor merges into a records
    // room. Offer the opposite perimeter too, still outside the central aisle.
    if(q.role==='records'){
     for(let x=q.x0+inset;x<=q.x1-inset;x+=.85)candidates.push({x,y:q.y1-inset});
     for(let y=q.y0+inset;y<=q.y1-inset;y+=.85)candidates.push({x:q.x1-inset,y});
    }
   }
   // Expanded room bounds can extend far past the named room. Prefer the rear
   // perimeter that a player at its native center can see on a portrait screen.
   const score=p=>{const dx=p.x-q.centerX,dy=p.y-q.centerY;return Math.abs(dx-dy)*1.4+Math.abs(dx+dy+6);};
   candidates.sort((a,b)=>score(a)-score(b));
   const p=candidates.find(p=>(q.role!=='records'||Math.hypot(p.x-q.centerX,p.y-q.centerY)>=2.65)&&[-1.1,0,1.1].every(dx=>[-.7,0,.7].every(dy=>walk(p.x+dx,p.y+dy)))&&
    !openMouth(q,p)&&!avoid.some(a=>Math.hypot(p.x-a.x,p.y-a.y)<a.r+1.1)&&!props.some(a=>Math.hypot(p.x-a.x,p.y-a.y)<3.2));
   if(p)props.push({...p,kind:q.role==='records'||q.role==='antechamber'?'ledger':'lock',height:q.role==='records'?1.7:q.role==='antechamber'?1.25:1.95,roomId:q.id,role:q.role,groupId:ZONE+'-'+q.id});
  }
  return{zone:id,floors:[],props,sourceRooms:rooms.length,theme:'steel-brass-records',presentationOnly:true};
 }
 function roomFor(f){return typeof room==='object'&&room?.exploration===f.exploration?room:null;}
 function propSignature(rm){return (rm?.props||[]).reduce((n,p)=>n+(p.r224Furniture===true?1:0),0);}
 function image(path){if(images.has(path))return images.get(path);const im=new Image(),q={image:im,ready:false,failed:false};images.set(path,q);im.onload=()=>q.ready=true;im.onerror=()=>{q.failed=true;stats.imageErrors++;lastError='Image failed: '+path;};im.src=path;return q;}
 function own(r,s,x){s.resources.add(x);r.spatialResources?.add(x);return x;}
 function material(r,s,m){own(r,s,m);if(r.sightState24&&A.attachSight24)A.attachSight24(m,r.sightState24);return m;}
 function mesh(r,s,g,m,name){const o=new r.T.Mesh(own(r,s,g),material(r,s,m));o.name='mammon-pilot-'+name;o.layers.set(2);o.userData.mammonMiniaturePilot=true;o.userData.presentationOnly=true;s.group.add(o);return o;}
 function texture(r,s,im){const cache=s.textureCache||(s.textureCache=new Map());if(cache.has(im))return cache.get(im);const t=own(r,s,new r.T.Texture(im));t.colorSpace=r.T.SRGBColorSpace;t.needsUpdate=true;t.generateMipmaps=true;t.minFilter=r.T.LinearMipmapLinearFilter;cache.set(im,t);return t;}
 function dispose(r){const s=states.get(r);if(!s)return;if(s.scene&&s.scene.onBeforeRender===s.sceneHook)s.scene.onBeforeRender=s.previousSceneHook;if(s.scene&&s.scene.onAfterRender===s.afterHook)s.scene.onAfterRender=s.previousAfter;s.group.removeFromParent();for(const[m,v]of s.maps||[])if(m.map===v.applied){m.map=v.original;m.needsUpdate=true;}for(const[m,c]of s.originals)if(m.color?.getHex()===s.applied.get(m))m.color.copy(c);for(const x of s.resources){r.spatialResources?.delete(x);x.dispose?.();}states.delete(r);live.delete(r);last=null;stats.disposed++;}
 // All finishes lie ON original physical AABBs, never across a door gap.
 // Coplanar polygon offset reveals the finish without expanding the footprint.
 // They follow native chunk visibility and disappear with any native wall fade.
 function architecture(r,s){const T=r.T,max=512,types=[['cap',0xb0b8b6],['base',0x4c5355],['joint',0x8c8064]];
  s.arch=types.map(([name,color])=>{const g=own(r,s,new T.BoxGeometry(1,1,1)),m=material(r,s,new T.MeshBasicMaterial({map:s.surfaceTextures.metal||r.wallMaterial?.map||null,color,toneMapped:false,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
   const cols=[];for(let i=0;i<g.attributes.position.count;i++){const n=g.attributes.normal,shade=n.getY(i)>.5?1:n.getX(i)>.5?.7:n.getZ(i)>.5?.82:.58;cols.push(shade,shade,shade);}g.setAttribute('color',new T.Float32BufferAttribute(cols,3));
   const previous=m.onBeforeCompile;m.onBeforeCompile=function(sh,renderer){previous.call(this,sh,renderer);sh.vertexShader=sh.vertexShader.replace('vec4 sightWorld24 = modelMatrix * vec4(transformed, 1.0);','vec4 sightLocalPilot = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nsightLocalPilot = instanceMatrix * sightLocalPilot;\n#endif\nvec4 sightWorld24 = modelMatrix * sightLocalPilot;');};const cache=m.customProgramCacheKey.bind(m);m.customProgramCacheKey=()=>cache()+'|mammon-instance-sight-v1';
   const o=own(r,s,new T.InstancedMesh(g,m,max));o.name='mammon-pilot-wall-'+name;o.layers.set(2);o.frustumCulled=false;o.userData.mammonMiniaturePilot=true;o.userData.presentationOnly=true;s.group.add(o);return o;});s.matrix=new T.Matrix4();s.quat=new T.Quaternion();s.vector=new T.Vector3();s.scale=new T.Vector3();s.up=new T.Vector3(0,1,0);
  // R287 parks native walls after outer wrappers. Scene.onBeforeRender runs
  // after parking but BEFORE projectObject uploads instance matrices. A mesh
  // onBeforeRender callback would update matrices too late for the same draw.
  if(r.scene?.isScene){
   s.scene=r.scene;s.previousSceneHook=r.scene.onBeforeRender;s.previousAfter=r.scene.onAfterRender;
   // Apply maps for the actual draw only. R54 can later clone the unchanged
   // native materials for wall fades; no clone inherits a disposed V3 map.
   s.sceneHook=function(...args){s.previousSceneHook?.apply(this,args);if(states.get(r)===s&&(args[2]?.layers?.mask&4)){surfaces(r,s);syncArchitecture(r,s);syncMounts(r,s);if(last)last.architecture=s.wallEvidence;}};
   s.afterHook=function(...args){try{if(states.get(r)===s)restoreMaps(s);}finally{s.previousAfter?.apply(this,args);}};
   r.scene.onBeforeRender=s.sceneHook;r.scene.onAfterRender=s.afterHook;
  }
 }
 function syncArchitecture(r,s){if(!s.arch)return;const counts=[0,0,0],dirty=[false,false,false];let visibleCount=0;
  const put=(k,w,x,y,z,sx,sy,sz)=>{const o=s.arch[k],i=counts[k];if(i>=512)return;s.quat.setFromAxisAngle(s.up,w.angle||0);s.matrix.compose(s.vector.set(x,y,z),s.quat,s.scale.set(sx,sy,sz));const data=o.instanceMatrix.array,mat=s.matrix.elements;for(let j=0;j<16;j++)if(data[i*16+j]!==Math.fround(mat[j])){o.setMatrixAt(i,s.matrix);dirty[k]=true;break;}counts[k]++;};
  for(const e of r.wallRows?.values?.()||[]){const m=e.mesh,w=m?.userData?.originalWall;let visible=!!m?.visible;for(let p=m?.parent;p&&visible;p=p.parent)if(p.visible===false)visible=false;if(!w||w.decorative||!visible||m.layers?.mask===0||!m.parent||!finite(w)||![w.width,w.depth,w.height].every(v=>Number.isFinite(v)&&v>0))continue;
   const alpha=m.userData.occlusion54?.alpha??1;if(alpha<.995)continue;
   const h=w.height,width=Math.max(.02,w.width),depth=Math.max(.02,w.depth);
   put(0,w,w.x,h-.05,w.y,width,.10,depth);put(1,w,w.x,.09,w.y,width,.16,depth);
   const alongX=w.width>=w.depth,long=alongX?width:depth,short=alongX?depth:width,j=Math.min(.14,long*.2),a=w.angle||0;
   if(long>.5)for(const sign of[-1,1]){const d=sign*(long-j)/2,dx=alongX?d:0,dz=alongX?0:d;put(2,w,w.x+dx*Math.cos(a)+dz*Math.sin(a),h/2,w.y-dx*Math.sin(a)+dz*Math.cos(a),alongX?j:short,Math.max(.05,h-.14),alongX?short:j);}
   visibleCount++;
  }s.arch.forEach((o,i)=>{o.count=counts[i];if(dirty[i])o.instanceMatrix.needsUpdate=true;});s.wallEvidence={visiblePhysicalWalls:visibleCount,instances:counts,source:'current native wallRows.originalWall; original visibility + fade respected',footprintExpansion:0};
 }
 function restoreMaps(s){for(const [m,v] of s.maps)if(m.map===v.applied){m.map=v.original;if(!!v.original!==!!v.applied)m.needsUpdate=true;}s.maps.clear();}
 function applyMap(s,m,t){if(!m||!t)return;let entry=s.maps.get(m);if(!entry){entry={original:m.map,applied:t};s.maps.set(m,entry);}else if(m.map!==entry.applied)entry.original=m.map;
  if(m.map!==t){if(!!m.map!==!!t)m.needsUpdate=true;m.map=t;}entry.applied=t;
 }
 function floorFinish(s,nativeMap){
  const finish=s.surfaceTextures.floor;
  if(!finish||!nativeMap||nativeMap===finish)return finish;
  const slab=image(assets.floor).image,cell=nativeMap.image;
  if(!nativeMap.userData?.r55IsolatedCell){
   if(finish.image!==slab){finish.image=slab;finish.needsUpdate=true;}
   s.floorMix=null;return finish;
  }
  if(s.floorMix?.nativeMap===nativeMap&&s.floorMix.version===nativeMap.version)return s.floorMix.applied;
  if(!cell?.width||!cell?.height||!slab.naturalWidth||typeof document==='undefined')return nativeMap;
  // Bake the two authored diffuse cells once into the owned F01 texture. The
  // native tile already contains grout and worn edges at the map's UV scale.
  const mix=s.floorMix={nativeMap,version:nativeMap.version,applied:nativeMap};
  try{
   const tile=document.createElement('canvas');
   tile.width=slab.naturalWidth;tile.height=slab.naturalHeight;
   const paint=tile.getContext('2d');
   if(!paint)return nativeMap;
   paint.drawImage(slab,0,0,tile.width,tile.height);
   paint.globalAlpha=.57;
   paint.drawImage(cell,0,0,tile.width,tile.height);
   finish.image=tile;finish.anisotropy=nativeMap.anisotropy;finish.needsUpdate=true;
   mix.applied=finish;
  }catch(error){lastError='Floor texture blend: '+String(error?.message||error);}
  return mix.applied;
 }
 function surfaces(r,s){
  if(!r.terrainArt?.r55PhysicalUV)return; // No atlas/legacy UV assumptions.
  const floor=r.stoneMaterial,finish=floorFinish(s,floor?.map);
  applyMap(s,floor,finish);
  if(floor&&finish&&finish===s.surfaceTextures.floor)s.assembled.add('F01');else s.assembled.delete('F01');
  for(const e of r.wallRows?.values?.()||[]){if(!e.mesh?.userData?.originalWall||e.mesh.userData.originalWall.decorative)continue;
   for(const m of Array.isArray(e.mesh.material)?e.mesh.material:[e.mesh.material]){applyMap(s,m,s.surfaceTextures.metal);if(m&&s.surfaceTextures.metal)s.assembled.add('W06');}
  }
  for(const k of ['wallMaterial','wallCapMaterial61','regionalTrimMaterial55'])applyMap(s,r[k],s.surfaceTextures.metal);
 }
 // Positions come from a real physical wall; a missing nearby support means
 // no decoration. The jamb slices are camera-plane plates, never a rotated
 // image of a whole portal. Their inner edges stop at the native aperture.
 function mounts(r,s,im){
  const L=s.layout,ws=(L.walls||[]).filter(w=>finite(w)&&!w.decorative&&!w.angle&&w.width>0&&w.depth>0&&w.height>0);
  const distance=(w,x,y)=>Math.hypot(Math.max(0,Math.abs(w.x-x)-w.width/2),Math.max(0,Math.abs(w.y-y)-w.depth/2));
  const nearest=(x,y,d)=>ws.reduce((a,w)=>{const v=distance(w,x,y);return v<=d&&(!a||a.v>v)?{w,v}:a;},null)?.w;
  function plate(src,id,w,x,y,rect,contact,displayHeight){
   if(!src.ready||!w)return;const T=r.T,[left,top,right,bottom]=rect,[px,py]=contact;
   const k=displayHeight/(bottom-top),g=new T.PlaneGeometry((right-left)*k,displayHeight);
   g.translate(((left+right)/2-px)*k,(py-(top+bottom)/2)*k,0);
   const uv=g.attributes.uv,iw=src.image.naturalWidth,ih=src.image.naturalHeight;
   for(let i=0;i<uv.count;i++)uv.setXY(i,(left+(right-left)*uv.getX(i))/iw,1-(bottom-(bottom-top)*uv.getY(i))/ih);
   const o=mesh(r,s,g,new T.MeshBasicMaterial({map:texture(r,s,src.image),color:id==='D01'?0xb19a77:0xa9a397,transparent:true,alphaTest:.08,depthWrite:false,toneMapped:false}),'support-'+id);
   o.position.set(x,.022,y);o.renderOrder=-17;o.visible=false;o.userData.assetId=id;o.userData.support=w.id;o.userData.nativeAnchor=[x,.022,y];
   observeDecoration(s,o,{asset:id,x,y,wall:w.id});
   const bounds=groundRect(x,y,(left-px)*k,(right-px)*k,(py-bottom)*k,(py-top)*k);
   s.mounts.push({o,x,y,id,wall:w.id,bounds,normal:new T.Vector3(),corner:new T.Vector3()});
  }
  for(const d of L.worldR74?.doors||[]){if(!finite(d))continue;
   const ax=d.width>=d.depth,dx=ax?d.width/2:0,dy=ax?0:d.depth/2;
   const endpoints=[{x:d.x-dx,y:d.y-dy},{x:d.x+dx,y:d.y+dy}].sort((a,b)=>(a.x-a.y)-(b.x-b.y));
   endpoints.forEach((p,i)=>{const w=nearest(p.x,p.y,.16);if(!w)return;
    plate(im.jamb,'D01',w,p.x,p.y,i?[601,128,732,617]:[37,128,163,617],i?[601,617]:[163,617],Math.min(1.42,w.height));});
  }
  const used=new Set();for(const q of boxes(L)){const n=(L.nodes||[]).find(n=>n.id===q.id);if(!n||!(/기록실|금고 구획|보안 회랑|금고 전실/.test(n.name||'')))continue;
   const w=nearest(q.x0,q.y0,1.6);if(!w||used.has(w.id))continue;const x=Math.max(w.x-w.width/2,Math.min(w.x+w.width/2,q.x0)),y=Math.max(w.y-w.depth/2,Math.min(w.y+w.depth/2,q.y0));
   if((L.worldR74?.doors||[]).some(d=>Math.hypot(d.x-x,d.y-y)<=Math.max(d.width,d.depth)/2+2))continue;
   used.add(w.id);const low=/기록실|금고 전실/.test(n.name);if(low)plate(im.postLow,'P02',w,x,y,[0,0,768,768],[384,676.746411483],w.height*.86);
   else plate(im.postHigh,'P01',w,x,y,[0,0,512,768],[255.5,710],w.height*1.18);
  }
 }
 function syncMounts(r,s){for(const p of s.mounts){const wall=r.wallRows?.get(p.wall)?.mesh;let v=!!wall?.parent&&wall.visible&&wall.layers.mask!==0&&(wall.userData.occlusion54?.alpha??1)>=.995;
  for(let parent=wall?.parent;parent&&v;parent=parent.parent)if(!parent.visible)v=false;
  v=v&&!covered(s.cover,p.bounds);
  p.o.visible=!!v;if(v){
   const o=p.o,w=wall.userData.originalWall,rotation=r.camera.quaternion;o.quaternion.copy(rotation);
   // Lift only along the orthographic sight line. All corners clear this
   // support's *thin* camera-facing surface; projected aperture and pivot stay put.
   const n=p.normal.set(0,0,1).applyQuaternion(rotation),axis=w.width<=w.depth?'x':'z';
   const sign=Math.sign(n[axis]),anchor=axis==='x'?p.x:p.y,center=axis==='x'?w.x:w.y,extent=axis==='x'?w.width:w.depth;
   let shift=0;if(Math.abs(n[axis])>1e-4){const vertices=o.geometry.attributes.position;for(let i=0;i<vertices.count;i++){
    const k=p.corner.fromBufferAttribute(vertices,i).applyQuaternion(rotation)[axis];shift=Math.max(shift,((center-anchor-k)*sign+extent/2+.003)/Math.abs(n[axis]));
   }}o.position.set(p.x,.022,p.y).addScaledVector(n,shift);o.updateMatrixWorld(true);s.assembled.add(p.id);
  }
 }}
 function build(r,s){const im=Object.fromEntries(Object.entries(assets).map(([k,p])=>[k,image(p)]));if(!Object.values(im).every(q=>q.ready||q.failed))return;
  const T=r.T;s.attempted=true;s.failedAssets=Object.keys(im).filter(k=>im[k].failed);if(s.failedAssets.length)return;s.loaded=true;s.surfaceTextures={};
  for(const k of ['floor','metal'])if(im[k].ready){const t=texture(r,s,im[k].image);t.wrapS=t.wrapT=T.RepeatWrapping;s.surfaceTextures[k]=t;}
  for(const p of s.plan.props){const src=im[p.kind==='lock'?'vault':'ledger'];if(!src.ready)continue;
   const h=p.height,w=h*src.image.naturalWidth/src.image.naturalHeight,pivot=pivots[p.kind],g=new T.PlaneGeometry(w,h);
   g.translate((.5-pivot[0])*w,(pivot[1]-.5)*h,0);
   const o=mesh(r,s,g,new T.MeshBasicMaterial({map:texture(r,s,src.image),color:0xc3bbb0,transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false,side:T.DoubleSide}),'empty-'+p.kind);
   o.position.set(p.x,.025,p.y);o.renderOrder=-15;o.userData.assetId=p.kind==='lock'?'O02':'O01';o.userData.pivot=pivot.slice();s.assembled.add(o.userData.assetId);
   // Camera-plane billboard only: never tilt a pre-rendered isometric sprite
   // toward a world wall a second time. Pixel calibration is still unverified.
   const shadow=mesh(r,s,new T.PlaneGeometry(w*.7,h*.32),new T.MeshBasicMaterial({color:0x101317,transparent:true,opacity:.18,depthWrite:false,toneMapped:false}),'contact-'+p.kind);
   shadow.rotation.x=-Math.PI/2;shadow.position.set(p.x,.019,p.y);shadow.renderOrder=-19;
   const compile=shadow.material.onBeforeCompile;shadow.material.onBeforeCompile=function(sh,renderer){compile.call(this,sh,renderer);sh.vertexShader='varying vec2 mammonShadowUV;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmammonShadowUV=uv;');sh.fragmentShader='varying vec2 mammonShadowUV;\n'+sh.fragmentShader;sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a*=1.0-smoothstep(.12,.5,length(mammonShadowUV-.5));');};
   const program=shadow.material.customProgramCacheKey.bind(shadow.material);shadow.material.customProgramCacheKey=()=>program()+'|mammon-contact-v1';
   observeDecoration(s,o,{asset:o.userData.assetId,x:p.x,y:p.y,roomId:p.roomId,role:p.role});
   const alpha=p.kind==='lock'?[130/768,27/512,636/768,489/512]:[88/768,6/384,685/768,381/384];
   const bounds=groundRect(p.x,p.y,(alpha[0]-pivot[0])*w,(alpha[2]-pivot[0])*w,(pivot[1]-alpha[3])*h,(pivot[1]-alpha[1])*h);
   s.billboards.push({mesh:o,shadow,bounds,footRadius:p.kind==='lock'?1.3:1.15,...p});
  }
  mounts(r,s,im);architecture(r,s);
 }
 // Screen axes in orthographic world units. Translation and zoom cancel for
 // overlap, so this also works beyond the screen edge and at mobile zoom.
 function groundRect(x,y,left,right,bottom,top){
  const sx=(x-y)*Math.SQRT1_2,sy=-(x+y)*Math.SQRT1_2*.5;
  return{left:sx+left,right:sx+right,bottom:sy+bottom,top:sy+top};
 }
 // This records a draw submission after Three frustum/visibility culling.
 // Pixel visibility (depth, fog or alpha) still requires the real screenshot.
 function observeDecoration(s,o,record){o.onBeforeRender=()=>s.submitted.push(record);}
 function covered(c,b){
  return !!c&&(c.unknownWarning||c.rows.some(a=>a.left<b.right&&b.left<a.right&&a.bottom<b.top&&b.bottom<a.top));
 }
 function clearance(f){
  const entities=f.entities||[],hero=entities.find(e=>e.hero)||f.player||(typeof player==='object'?player:null);
  const tile=f.projection?.tile||34,rows=[];let unknownWarning=false,warningCount=0;
  function actor(p){if(!finite(p)||p.alive===false||p.alpha===0)return;
   const h=(p.height||66)/(tile*Math.SQRT2),art=p.frame?.assetFrame,rect=art?.sourceRect,pivot=art?.pivot;
   if(rect?.length===4&&rect.every(Number.isFinite)&&pivot?.length===2&&pivot.every(Number.isFinite)&&art.visibleHeight>0){
    const scale=h/art.visibleHeight,flip=p.frame.flip||p.frame.nativeHero5?.flip;
    const left=(flip?pivot[0]-rect[2]:-pivot[0])*scale,right=(flip?pivot[0]:rect[2]-pivot[0])*scale;
    rows.push(groundRect(p.x,p.y,left-.12,right+.12,(pivot[1]-rect[3])*scale-.12,pivot[1]*scale+.12));
   }else{
    const half=h*(p.hero ? .38 : .66)+.16;
    rows.push(groundRect(p.x,p.y,-half,half,-.17,h+.2));
   }
  }
  actor(hero);for(const p of entities)if(!p.hero)actor(p);
  for(const p of f.hazards||[]){if(!p||p.alpha===0)continue;warningCount++;
   // Missing position, or a directional telegraph without a reliable endpoint,
   // has no safe local extent. Only that case uses the conservative fallback.
   if(!finite(p)||/laser|beam|line/i.test(p.kind||'')){unknownWarning=true;continue;}
   const radius=Math.max(.7,p.radius||((p.height||50)/(2*tile)))+.45;
   rows.push(groundRect(p.x,p.y,-radius,radius,-radius*.5,radius*.5));
  }
  return{rows,unknownWarning,warningCount};
 }
 function ensure(r,f){if(!eligible(f)||r.disposed){if(overlap())stats.overlapSkips++;dispose(r);return;}if(!r.spatialBuilt||!r.spatialRoot||!r.T)return;let s=states.get(r);
  if(s&&(s.gen!==r.sceneGeneration||s.layout!==f.exploration||s.sight!==r.sightState24||s.propSignature!==propSignature(roomFor(f)))){dispose(r);s=null;}
  if(!s){const T=r.T,group=new T.Group();group.name='mammon-miniature-pilot';s={gen:r.sceneGeneration,layout:f.exploration,sight:r.sightState24,group,resources:new Set(),originals:new Map(),applied:new Map(),maps:new Map(),assembled:new Set(),mounts:[],propSignature:propSignature(roomFor(f)),plan:plan(ZONE,f.exploration,roomFor(f)),billboards:[],submitted:[],loaded:false};states.set(r,s);live.add(r);r.spatialRoot.add(group);stats.builds++;}
  if(!s.attempted)build(r,s);if(!s.loaded){last={zone:ZONE,loaded:false,assembledAssets:[],failedAssets:s.failedAssets||[],pending:!s.attempted};return;}
  for(const[name,k]of[['stoneMaterial','floor'],['wallMaterial','wall'],['wallCapMaterial61','cap'],['regionalTrimMaterial55','trim']]){const m=r[name];if(!m?.color)continue;if(!s.originals.has(m)||m.color.getHex()!==palette[k])s.originals.set(m,m.color.clone());m.color.setHex(palette[k]);s.applied.set(m,palette[k]);}
  if(!s.scene)syncArchitecture(r,s);const c=clearance(f);s.cover=c;s.submitted.length=0;
  for(const b of s.billboards){
   if(r.camera?.quaternion)b.mesh.quaternion.copy(r.camera.quaternion);
   const blockedByProp=(roomFor(f)?.props||[]).some(p=>finite(p)&&p.visible!==false&&!p.destroyed&&Math.hypot(p.x-b.x,p.y-b.y)<b.footRadius+1);
   b.mesh.visible=!covered(c,b.bounds)&&!blockedByProp;b.mesh.material.opacity=.9;b.shadow.visible=b.mesh.visible;
  }
  stats.passes++;last={zone:ZONE,loaded:s.loaded,floorQuads:s.plan.floors.length,props:s.plan.props.length,meshes:s.group.children.length,architecture:s.wallEvidence,textureCount:s.textureCache?.size||0,protectedRects:c.rows.length,unknownWarning:c.unknownWarning,warningCount:c.warningCount,r228ExtraFloorLayers:0,assembledAssets:[...s.assembled],submittedDecor:s.submitted,failedAssets:s.failedAssets||[],mounts:s.mounts.length,pendingAssets:['W01','W02','W03','W04','W05'],collisionChanged:false};
 }
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,600);};
 function guard(r){const gl=r.renderer;if(!gl||wrapped.has(gl)||typeof gl.render!=='function')return;wrapped.add(gl);const old=gl.render;gl.render=function(...args){try{if(r.__mammonMiniatureFrame&&(!args[1]?.layers||(args[1].layers.mask&4)))ensure(r,r.__mammonMiniatureFrame);}catch(e){fail(e);}return old.apply(this,args);};}
 function wrap(fn){if(typeof fn!=='function'||fn.__mammonMiniature)return fn;const out=function(f,...a){this.__mammonMiniatureFrame=f;guard(this);return fn.call(this,f,...a);};out.__mammonMiniature=true;return out;}
 C.render=wrap(C.render);const clear=C.clearScene;if(clear)C.clearScene=function(...a){dispose(this);this.__mammonMiniatureFrame=null;return clear.apply(this,a);};
 const attachCurrent=()=>{const r=W.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render'))r.render=wrap(r.render);return!!r;};
 W[NAME]=Object.freeze({revision:REV,zone:ZONE,assets,palette,eligible,plan,attachCurrent,set(v){on=v!==false;if(!on)for(const r of[...live])dispose(r);return on;},inspect:()=>({revision:REV,on,last,stats:{...stats},lastError,registered:false,layoutChanged:false,collisionChanged:false,gameplayChanged:false,hardwareGPUVerified:false})});attachCurrent();
})();
