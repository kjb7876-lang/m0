/* R81: one coherent environment over the current hospital's room grammar.
 * Scene art is selected by canonical region ID. Original bitmaps, enemy data,
 * story, solid flags and prop IDs stay intact; placement and rendering change. */
(()=>{'use strict';
 if(window.__STORYWORLD_ENVIRONMENT_R81__)return;
 const A=window.StoryPhase1,D=window.__STORYWORLD_ASSETS_R80_DATA__;
 if(!A||!D)throw Error('R81 environment requires the existing renderer and scene catalog');
 const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const families={
  garden:{atlas:'materials',patch:'garden',floor:0xc4c3b0,wall:0x778579,cap:0x919d88,edge:0x38483e,roof:'#26322b'},
  cave:{atlas:'outdoor',patch:'coast',wallPatch:'ash',alternate:true,floor:0xb4bbc6,wall:0x737988,cap:0x89909b,edge:0x343b46,roof:'#222630'},
  swamp:{atlas:'outdoor',patch:'swamp',alternate:true,floor:0xc0c9a8,wall:0x718373,cap:0x8b9a79,edge:0x324637,roof:'#202b23'},
  ash:{atlas:'outdoor',patch:'ash',alternate:true,floor:0xc9bab1,wall:0x817777,cap:0xa29185,edge:0x493a38,roof:'#2b2326'},
  clinical:{atlas:'materials',patch:'clinical',floor:0xc4cfcb,wall:0x7d9290,cap:0x9eaead,edge:0x425655,roof:'#293637'},
  domestic:{atlas:'materials',patch:'domestic',floor:0xd1c4b2,wall:0x918783,cap:0xb0a598,edge:0x514b46,roof:'#332e30'},
  stone:{atlas:'materials',patch:'garden',alternate:true,floor:0xc4c8c8,wall:0x7e858b,cap:0x9da5ae,edge:0x424952,roof:'#292e36'},
  forge:{atlas:'materials',patch:'forge',floor:0xc8c3b7,wall:0x7c858a,cap:0xa0a7ad,edge:0x414a53,roof:'#272d35'},
  snow:{atlas:'outdoor',patch:'snow',floor:0xd6e0e5,wall:0x869eae,cap:0xb4c6ce,edge:0x4e6572,roof:'#2e3d48'},
  coast:{atlas:'outdoor',patch:'coast',alternate:true,floor:0xc2cbd0,wall:0x718895,cap:0x91a3af,edge:0x364c59,roof:'#25353e'},
  memory:{atlas:'materials',patch:'forge',alternate:true,floor:0xc6c3d3,wall:0x86809a,cap:0xaca3bb,edge:0x4b435a,roof:'#302b3a'},
  neural:{atlas:'materials',patch:'forge',alternate:true,floor:0xb8cdd0,wall:0x698c91,cap:0x8eabb0,edge:0x344e55,roof:'#24333a'}
 };
 const groups={
  garden:['dist00','last304','last305','kair05','restKairo'],
  cave:['dist01'],swamp:['dist02'],ash:['dist03','dist04','dist05','dist06','ep1b07'],
  clinical:['ep1a08','ep1a09','dreamRest','restEp1b'],
  domestic:['ep1b02','ep1b03','ep1b04','murder02','murder04'],
  stone:['ep1a09b','ep1a10','ep1a11','ep1b01','ep1b05','ep1b08','kair01','kair04','kair09','hando01','hando02','cult05'],
  forge:['ep1b06','kair06','kair07','kair02'],snow:['ep1b06b','ep1b09'],
  coast:['last301','last302','last303','murder01','murder03'],
  memory:['u204','u205','u203','restU2','restLast3','kair08','kair10','kair03','hando03','restHando','cult06','cult03','cult04'],
  neural:['u201','u202','u206','cult01','cult02']
 };
 const specs=Object.fromEntries(Object.entries(groups).flatMap(([family,ids])=>ids.map(id=>[id,{family,...families[family],title:D.regions[id]?.title||id}])));
 const applied=new WeakMap(),metrics={surfaces:0,rooms:0,nativeMoved:0,genericReskinned:0,sceneProps:0,placementFailures:0,draws:0,faded:0};
 const bounds=[[30,4,46,20],[48,4,66,20],[68,4,84,20],[68,30,84,42],[10,30,34,42],[38,30,64,42],[10,52,32,68],[34,52,48,68],[50,52,68,68],[70,52,80,68],[10,74,36,82],[50,74,78,82],[10,90,24,104],[26,92,42,104],[44,90,62,104],[64,90,78,104]];
 const eligible=r=>mode()==='off'&&r?.layer==='STORY'&&r.id!=='ep1a08'&&!!r.exploration?.worldWardR81&&!!specs[r.id];
 function surface(L,id){if(!L?.worldWardR81||!specs[id]||mode()!=='off')return L;
  const s=specs[id];if(L.surface?.art?.r81Environment===s.family)return L;
  const atlas=StoryArtR74.atlases[s.atlas],p=atlas.styles[s.patch],w=atlas.styles[s.wallPatch||s.patch],original=L.surface?.art||{};
  L.surface={...L.surface,art:{...original,path:atlas.path,width:atlas.width,height:atlas.height,sha256:atlas.sha256,floorRect:[...(s.alternate?p.alternateFloorRect:p.floorRect)],wallRect:[...w.wallRect],tileWorld:4.5,r55PhysicalUV:true,r74Generated:true,theme:s.family,r59Backdrop:null,r81Environment:s.family,r81Palette:{floor:s.floor,wall:s.wall,cap:s.cap,edge:s.edge},r81SourceArt:{path:original.path,theme:original.theme,environment:original.environment}}};
  // The void is covered by solid wall tops, never a second walkable-looking floor.
  L.backdropRects=[];L.fogRects=[];L.voidCover={...L.voidCover,tint:s.roof,opacity:1,theme:s.family};
  L.worldWardR81.environment={family:s.family,title:s.title,sourceSceneId:D.regions[id].sceneId};metrics.surfaces++;return L;
 }
 function excluded(p){return !p||p.terrainWall||p.r74Door||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.passivePointDropR64||p.interactive||p.destroyed||p.disabled;}
 // R94: back corner and back edges first (they face the camera), then the side
 // corners; the front corner (largest x+y) sits behind the camera-side wall and
 // read as standing on its roof, so it is no longer a candidate.
 function candidates(node,index){const b=bounds[node.id];if(!b)return[];const[a,b0,c,d]=b,m=2.1,pts=[[a+m,b0+m],[(a+c)/2,b0+m],[a+m,(b0+d)/2],[c-m,b0+m],[a+m,d-m],[c-m,(b0+d)/2],[(a+c)/2,d-m]];return pts.map((_,i)=>{const p=pts[(i+index)%pts.length];return{x:p[0],y:p[1]};});}
 function safe(r,p,used,radius=.55){const L=r.exploration;if(A.explorationBlocked(L,p.x,p.y,radius))return false;
  for(const s of[.8,1.6,2.4])if(A.explorationBlocked(L,p.x+s,p.y+s,.2))return false;
  if((L.worldR74?.doors||[]).some(d=>Math.hypot(d.x-p.x,d.y-p.y)<4))return false;
  if(L.entry&&Math.hypot(p.x-L.entry.x,p.y-L.entry.y)<4)return false;
  if(r.objective&&Math.hypot(p.x-r.objective.x,p.y-r.objective.y)<4)return false;
  if((r.enemies||[]).some(e=>e.hp>0&&!e.deadRecorded&&Math.hypot(p.x-e.x,p.y-e.y)<2.3))return false;
  if((r.props||[]).some(q=>(q.r75NPC||q.r75NarrativeNPC||q.r75FortPerson||q.interactive)&&Math.hypot(p.x-q.x,p.y-q.y)<2))return false;
  return used.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>2.4);
 }
 function locate(r,index,used,radius=.55){const nodes=r.exploration.nodes.filter(n=>bounds[n.id]);for(let i=0;i<nodes.length;i++){const n=nodes[(index*5+i)%nodes.length];for(const p of candidates(n,index+i))if(safe(r,p,used,radius))return{...p,node:n.id};}return null;}
 function position(r,p,index,used){const q=locate(r,index,used,Math.max(.55,Number(p.radius)||0)+.12);if(!q){metrics.placementFailures++;return false;}p.x=q.x;p.y=q.y;p.r81RoomNode=q.node;used.push(q);return true;}
 function dress(r){if(!eligible(r))return r;surface(r.exploration,r.id);if(applied.get(r)===r.exploration)return r;applied.set(r,r.exploration);
  const spec=D.regions[r.id],native=r.props.filter(p=>!excluded(p)&&!p.r80Dressing&&!p.r74Prop),generic=r.props.filter(p=>!excluded(p)&&p.r74Prop),scene=r.props.filter(p=>p.r80Dressing),used=[];
  // Source scenery is kept, but removed from the obsolete 30x30 encounter frame.
  native.forEach((p,i)=>{if(position(r,p,i*2+1,used))metrics.nativeMoved++;});
  const sourcePalette=regionById[r.id]?.regionObjects6||native,quietPalette=sourcePalette.filter(p=>p.path&&!/gate|door|stair|arch|frame|threshold|portal|entrance/i.test(p.path)),palette=quietPalette.length?quietPalette:sourcePalette;
  generic.forEach((p,i)=>{if(position(r,p,i*2,used)){const donor=palette[i%Math.max(1,palette.length)];if(donor?.path){p.r81NativeSkin={path:donor.path,height:Math.min(86,Number(donor.height)||68)};metrics.genericReskinned++;}}});
  // R94: passage-like or façade art (R80 list) is swapped for a same-series piece.
  const swap=window.__STORYWORLD_PROP_SUBSTITUTE_R94__||(k=>k),keys=[...new Set((spec.props||[]).map(swap).filter(Boolean))],large=keys.length===1&&D.assets[keys[0]]?.scale>=1.7,count=large?4:6;// R140: 지역 장면 소품 12→6(큰 것 8→4) — 조형물이 너무 많았다
  for(let i=0;i<count;i++){const key=keys[i%keys.length],a=D.assets[key];if(!a)continue;let p=scene[i];if(!p){p={id:'r81:scene:'+r.id+':'+i,path:a.path,r80Dressing:true,r80Art:key,r80PresentationOnly:true,solid:false,visible:true,enabled:true,height:64*a.scale};r.props.push(p);}if(position(r,p,i+3,used))metrics.sceneProps++;}
  // R80 never made more than six; remove no source object and add no solid object.
  r.worldEnvironmentR81={version:1,family:specs[r.id].family,nativeProps:native.length,genericProps:generic.length,sceneProps:count,occupiedRooms:[...new Set(used.map(p=>p.node))].sort((a,b)=>a-b)};metrics.rooms++;return r;
 }
 const makeBase=makeRoom;makeRoom=function(...args){return dress(makeBase.apply(this,args));};
 const enterBase=enterRegion;enterRegion=async function(...args){const out=await enterBase.apply(this,args);if(out!==false)dress(room);return out;};
 const restoreBase=restoreSave;restoreSave=async function(...args){const out=await restoreBase.apply(this,args);if(out!==false)for(const r of new Set([...Object.values(world||{}),room]))dress(r);return out;};
 // Keep generated R74 prop identities while using the region's own old art.
 // Only the render copy changes; native throw/interact code retains its source object.
 const drawBase=drawProp;drawProp=function(p,...args){if(!eligible(room)||!p?.r81NativeSkin)return drawBase.apply(this,[p,...args]);
  const skin=p.r81NativeSkin,q=project(p.x,p.y),hero=project(player.x,player.y),h=(skin.height||72)*zoom,near=Math.abs(q.x-hero.x)<h*.55&&q.y>hero.y-8&&q.y-h<hero.y,copy={...p,path:skin.path,height:skin.height};delete copy.r74Prop;delete copy.r81NativeSkin;metrics.draws++;
  if(!near)return drawBase.apply(this,[copy,...args]);metrics.faded++;ctx.save();try{ctx.globalAlpha*=.32;return drawBase.apply(this,[copy,...args]);}finally{ctx.restore();}
 };
 const C=A.ThreeRenderer?.prototype,createBase=C?.createSpatial;
 if(createBase)C.createSpatial=function(asset,art,...args){const out=createBase.call(this,asset,art,...args),p=art?.r81Palette;if(p){for(const[name,key]of[['stoneMaterial','floor'],['wallMaterial','wall'],['wallCapMaterial61','cap'],['regionalTrimMaterial55','edge']])this[name]?.color?.setHex?.(p[key]);this.worldEnvironmentR81={family:art.r81Environment,palette:{...p},presentationOnly:true,GPUVerified:false};}return out;};
 window.__STORYWORLD_ENVIRONMENT_R81__=Object.freeze({specs,surface,dress,safe,inspect:()=>({version:1,regions:Object.keys(specs).length,metrics:{...metrics},browser:false,GPU:false})});
 for(const r of new Set([...Object.values(world||{}),room]))dress(r);
})();
