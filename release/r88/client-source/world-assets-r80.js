/* R80: scene-specific, bounded, presentation-only art over the existing maze.
 * No PNG-defined collision, combat change, new narrative, or persisted schema. */
(()=>{'use strict';
 if(window.__STORYWORLD_WORLD_ASSETS_R80__)return;
 const data=window.__STORYWORLD_ASSETS_R80_DATA__;if(!data)throw Error('R80 asset catalogue is missing');
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const enabled=r=>mode()==='off'&&r?.layer==='STORY'&&!!data.regions[r.id];
 const dressed=new WeakSet(),roofLayouts=new WeakMap(),metrics={rooms:0,props:0,failedPlacements:0,draws:0,culled:0,faded:0,evicted:0,storyEchoes:0};
 function paths(id){const r=data.regions[id];return r?[...new Set([...r.props,r.echo].filter(Boolean).map(k=>data.assets[k].path))]:[];}
 function registerData(){
  for(const a of Object.values(data.assets)){imageInventory.add(a.path);register(a.path,'image','r80-scene-art');if(portable){portable.assetExists[a.path]=true;portable.runtimeAssetHashes[a.path]=a.sha256;}}
  for(const[id,r]of Object.entries(data.regions)){const native=regionById[id];if(native)native.paths=[...new Set([...native.paths,...paths(id)])];}
 }
 const compileBase=compileWorld;compileWorld=function(...args){const result=compileBase.apply(this,args);registerData();return result;};
 function safe(r,x,y,used){if(!Number.isFinite(x+y)||StoryPhase1.explorationBlocked(r.exploration,x,y,.25))return false;
  const L=r.exploration,entry=L.entry||L.entrance,doors=L.hospitalDoorsB3||L.worldR74?.doors||[];
  if(entry&&Math.hypot(x-entry.x,y-entry.y)<3)return false;
  if(doors.some(d=>Math.hypot(x-d.x,y-d.y)<3))return false;
  if((r.enemies||[]).some(e=>e.hp>0&&Math.hypot(x-e.x,y-e.y)<2))return false;
  if((r.props||[]).some(p=>!p.terrainWall&&!p.r80Dressing&&Math.hypot(x-p.x,y-p.y)<1.2))return false;
  return used.every(p=>Math.hypot(x-p.x,y-p.y)>2.8);
 }
 function location(r,node,index,used){const offset=[[-3.4,-1.7],[1.7,-3.4],[-2.6,2.6],[3.1,2.1]];
  for(let step=0;step<offset.length;step++){const[dx,dy]=offset[(index+step)%offset.length];for(const gain of [1,.8,.6,1.25]){const x=node.x+dx*gain,y=node.y+dy*gain;if(safe(r,x,y,used))return{x,y};}}
  return null;
 }
 function dress(r){if(!enabled(r)||dressed.has(r))return r;dressed.add(r);
  // Original hospital prop IDs, positions, counts, and physical data remain intact.
  if(r.id==='ep1a08'){metrics.rooms++;return r;}
  const spec=data.regions[r.id],L=r.exploration,nodes=(L.nodes||[]).filter(n=>n.id!==L.bossRoomNodeId),used=[];
  if(!nodes.length)nodes.push({x:10,y:10},{x:23,y:23});
  const count=Math.min(6,Math.max(3,spec.props.length*2));
  for(let i=0;i<count;i++){const artKey=spec.props[i%spec.props.length];if(!artKey)continue;
   let point=null;for(let k=0;k<nodes.length&&!point;k++)point=location(r,nodes[(i*3+k)%nodes.length],i,used);
   if(!point){metrics.failedPlacements++;continue;}
   const a=data.assets[artKey];used.push(point);r.props.push({id:'r80:scene:'+r.id+':'+i,path:a.path,x:point.x,y:point.y,height:64*a.scale,solid:false,visible:true,enabled:true,r80Dressing:true,r80Art:artKey,r80PresentationOnly:true});metrics.props++;
  }
  metrics.rooms++;return r;
 }
 const makeBase=makeRoom;makeRoom=function(...args){return dress(makeBase.apply(this,args));};
 function prune(id){const keep=new Set(paths(id));for(const key of imageCache.keys())if(key.startsWith('assets/world-r80/')&&!keep.has(key)){imageCache.delete(key);metrics.evicted++;}}
 const enterBase=enterRegion;enterRegion=async function(...args){const result=await enterBase.apply(this,args);if(result!==false&&enabled(room)){dress(room);await ensureImages(paths(room.id));}if(result!==false&&mode()==='off')prune(room?.id);return result;};
 const restoreBase=restoreSave;restoreSave=async function(...args){const result=await restoreBase.apply(this,args);if(result!==false){for(const r of new Set([...Object.values(world||{}),room]))dress(r);if(enabled(room)){await ensureImages(paths(room.id));prune(room.id);}}return result;};
 function artFor(p){if(p?.r80Art)return data.assets[p.r80Art];if(enabled(room)&&room.id==='ep1a08'&&/^ep1a08-prop-[1-8]$/.test(p?.id||'')){const i=Number(p.id.split('-').at(-1))-1;return data.assets[data.hospitalPropSkins[i]];}return null;}
 const drawBase=drawProp;drawProp=function(p,...args){const a=enabled(room)&&artFor(p);if(!a)return drawBase.apply(this,[p,...args]);
  if(p.visible===false||p.enabled===false||p.disabled||p.destroyed)return;
  const sight=window.__STORYWORLD_SIGHT24__;if(sight?.enabled&&!sight.pointVisible(p.x,p.y))return;
  const q=project(p.x,p.y),h=actorHeight()*a.scale,w=h*a.width/a.height,py=a.frame.pivot[1]/a.height*h;
  if(q.x+w<-32||q.x-w>W+32||q.y-py>H+32||q.y+h-py<-32){metrics.culled++;return;}
  const hero=project(player.x,player.y),left=q.x-a.frame.pivot[0]/a.width*w,overlap=hero.x>left-12&&hero.x<left+w+12&&hero.y>q.y-py-10&&hero.y<q.y+h-py&&q.y>hero.y-8,alpha=overlap?.30:1;
  if(overlap)metrics.faded++;
  const paint=()=>drawAssetFrame3(a.path,{path:a.path,assetFrame:a.frame},q.x,q.y,h,{alpha});
  metrics.draws++;return ctx.scope?ctx.scope({id:'r80-prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:a.path,groundAligned:false,alive:false,presentationOnly:true},paint):paint();
 };
 const advanceBase=advanceScene;advanceScene=function(...args){const result=advanceBase.apply(this,args);if(mode()!=='off'||!storyScene)return result;
  const spec=data.regions[storyScene.id],a=spec?.echo&&data.assets[spec.echo],root=document.querySelector('#panel .storyArt');if(!a||!root)return result;
  const old=document.getElementById('r80StoryEcho');old?.remove();const img=document.createElement('img');img.id='r80StoryEcho';img.src=urlFor(a.path);img.alt='';img.setAttribute('aria-hidden','true');Object.assign(img.style,{position:'absolute',right:'4%',bottom:'5%',width:'54%',height:'auto',maxHeight:'65%',objectFit:'contain',opacity:'.34',pointerEvents:'none'});root.appendChild(img);metrics.storyEchoes++;return result;
 };
 // The tested hospital wall-top caps extend to the 55 existing R78 mazes.
 // Only the renderer receives a cached view of the layout; physics stays native.
 function roofFrame(frame){const L=frame.exploration;if(mode()!=='off'||frame.layer!=='STORY'||!L?.worldR78)return frame;
  let view=roofLayouts.get(L);if(!view){view={...L,hospitalCoreB2:true};roofLayouts.set(L,view);}
  const hero=(frame.entities||[]).find(e=>e.hero&&Number.isFinite(e.x+e.y)),focus=hero?[{x:hero.x,y:hero.y,focusWidth:1.12,focusHeight:2.7}]:[];
  const near=(frame.entities||[]).filter(e=>e!==hero&&e.alive!==false&&(e.hp===undefined||e.hp>0)&&e.spawnState!=='hidden'&&hero&&Math.hypot(e.x-hero.x,e.y-hero.y)<7).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y)).slice(0,3);
  for(const e of near){const a=e.frame?.assetFrame,height=Number(e.height)||66,aspect=a?.sourceRect?.[2]&&a.visibleHeight?a.sourceRect[2]/a.visibleHeight:.8;focus.push({x:e.x,y:e.y,focusWidth:Math.max(.8,Math.min(1.8,height*aspect/68+.10)),focusHeight:Math.max(2.05,Math.min(7,height/34+.30))});}
  return{...frame,zone:'ep1a08',exploration:view,hospitalFocus13:focus};
 }
 const C=window.StoryPhase1?.ThreeRenderer?.prototype,roofBase=C?.ensureHospitalRoofsR2;
 if(roofBase)C.ensureHospitalRoofsR2=function(frame){const mapped=roofFrame(frame),result=roofBase.call(this,mapped);if(mapped!==frame&&this.hospitalRoofMaterialR2){this.hospitalRoofMaterialR2.color.set(frame.exploration.voidCover?.tint||'#354146');if(this.hospitalRoofMeshR2)this.hospitalRoofMeshR2.userData.r80WorldRoof=true;}return result;};
 if(typeof regionById!=='undefined'&&Object.keys(regionById).length){registerData();dress(room);}
 window.__STORYWORLD_WORLD_ASSETS_R80__=Object.freeze({dress,paths,artFor,roofFrame,prune,inspect:()=>({revision:'R80',metrics:{...metrics},regions:Object.keys(data.regions).length,selectedAssets:Object.keys(data.assets).length,loadedRuntimeImages:[...imageCache.keys()].filter(p=>p.startsWith('assets/world-r80/')),collisionChanged:false,saveSchemaChanged:false,browser:false,GPU:false})});
})();
