/* Small Three.js treatment for the hospital surgeon's operating room.
 * These floor meshes are presentation only: no collision, damage, or saves. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 const stats={operatingRoomBuilds:0,surgeonMarkerBuilds:0,frames:0,visibleFrames:0};
 const plan=Object.freeze({revision:'hospital-surgeon-operating-room-r78',zoneId:'ep1a08',center:{x:20,z:12},rings:[{inner:6.52,outer:6.68,color:0x70918d,opacity:.34},{inner:4.38,outer:4.46,color:0xc4d0c3,opacity:.32}],table:{x:20,z:12,width:2.2,depth:3.6},marker:{outer:1.58,inner:1.49,secondaryOuter:1.15,secondaryInner:1.10},presentationOnly:true,collisionChanged:false,damageChanged:false,saveChanged:false});
 if(!C||typeof C.render!=='function'){
  window.__STORYWORLD_WORLD_VISUAL_R78__=Object.freeze({plan,inspect:()=>({revision:plan.revision,available:false,stats:{...stats},browser:false,GPU:false})});return;
 }
 function material(renderer,color,opacity){const m=new renderer.T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthTest:true,depthWrite:false,side:renderer.T.DoubleSide,toneMapped:false});m.userData.presentationOnly=true;renderer.spatialResources.add(m);return m;}
 function floorMesh(renderer,geometry,mat,name){const mesh=new renderer.T.Mesh(geometry,mat);mesh.layers.set(2);mesh.renderOrder=2;mesh.castShadow=mesh.receiveShadow=false;mesh.userData.presentationOnly=true;mesh.userData.collisionChanged=false;mesh.name=name;return mesh;}
 function buildOperatingRoom(renderer){
  const T=renderer.T,root=new T.Group();root.name='hospital-surgeon-operating-room-r78';root.userData.presentationOnly=true;root.userData.collisionChanged=false;
  const ringMat=material(renderer,0x70918d,.34),ivoryMat=material(renderer,0xc4d0c3,.32),redMat=material(renderer,0x9c6663,.30),tableMat=material(renderer,0xcbd5ca,.28),wellMat=material(renderer,0x3a5b5c,.28);
  const ring=(radius,thickness,mat,name,x=20,z=12)=>{const g=new T.RingGeometry(Math.max(0,radius-thickness),radius,64);g.rotateX(-Math.PI/2);const m=floorMesh(renderer,g,mat,name);m.position.set(x,.025,z);root.add(m);};
  ring(6.68,.16,ringMat,'surgeon-theatre-outer-ring');ring(4.46,.08,ivoryMat,'surgeon-theatre-inner-ring');
  for(const x of [13,27])for(const z of [8,16]){
   const sx=x<20?1:-1,sz=z<12?1:-1,m=floorMesh(renderer,new T.BoxGeometry(1.15,.018,.055),ivoryMat,'surgeon-bay-corner');m.position.set(x+sx*.58,.03,z);root.add(m);
   const n=floorMesh(renderer,new T.BoxGeometry(.055,.018,1.15),ivoryMat,'surgeon-bay-corner');n.position.set(x,.03,z+sz*.58);root.add(n);
  }
  const table=floorMesh(renderer,new T.BoxGeometry(2.2,.025,3.6),tableMat,'surgeon-operating-table-inlay');table.position.set(20,.035,12);root.add(table);
  const inner=floorMesh(renderer,new T.BoxGeometry(1.4,.016,2.6),wellMat,'surgeon-operating-table-centre');inner.position.set(20,.055,12);root.add(inner);
  const crossA=floorMesh(renderer,new T.BoxGeometry(.055,.012,1.9),ivoryMat,'surgeon-operating-table-mark');crossA.position.set(20,.068,12);root.add(crossA);
  const crossB=floorMesh(renderer,new T.BoxGeometry(.9,.012,.055),ivoryMat,'surgeon-operating-table-mark');crossB.position.set(20,.069,12);root.add(crossB);
  const blood=floorMesh(renderer,new T.BoxGeometry(1.0,.012,.045),redMat,'surgeon-theatre-red-axis');blood.position.set(20,.031,8.8);root.add(blood);
  renderer.spatialRoot.add(root);renderer.surgeonOperatingRoomR78=root;stats.operatingRoomBuilds++;
 }
 function buildMarker(renderer){
  const T=renderer.T,root=new T.Group();root.name='hospital-surgeon-follow-marker-r78';root.userData.presentationOnly=true;
  const outer=floorMesh(renderer,new T.RingGeometry(1.49,1.58,48),material(renderer,0x80b5ae,.46),'surgeon-follow-focus-outer'),inner=floorMesh(renderer,new T.RingGeometry(1.10,1.15,48),material(renderer,0xd4dfcf,.42),'surgeon-follow-focus-inner'),axis=floorMesh(renderer,new T.BoxGeometry(1.6,.012,.045),material(renderer,0xd4dfcf,.54),'surgeon-follow-focus-axis');
  for(const m of [outer,inner]){m.geometry.rotateX(-Math.PI/2);m.position.y=.045;root.add(m);}axis.position.y=.046;root.add(axis);
  renderer.spatialRoot.add(root);renderer.surgeonFollowMarkerR78=root;stats.surgeonMarkerBuilds++;
 }
 const renderBase=C.render,clearBase=C.clearScene,inspectBase=C.inspectSpatial;
 C.render=function(frame){const result=renderBase.call(this,frame);stats.frames++;
  if(frame.zone==='ep1a08'&&frame.layer==='STORY'&&frame.exploration?.hospitalCoreB2&&this.spatialRoot&&this.spatialResources){
   if(this.spatialBuilt&&!this.surgeonOperatingRoomR78)buildOperatingRoom(this);
   const e=(frame.entities||[]).find(a=>(a.mazeChiefR1||a.id==='ep1a08:maze-chief-r1')&&a.hp>0&&a.spawnState!=='hidden'&&!a.deadRecorded);
   if(e&&this.spatialBuilt){if(!this.surgeonFollowMarkerR78)buildMarker(this);this.surgeonFollowMarkerR78.position.set(e.x,.02,e.y);this.surgeonFollowMarkerR78.visible=true;stats.visibleFrames++;}
   else if(this.surgeonFollowMarkerR78)this.surgeonFollowMarkerR78.visible=false;
  }
  return result;
 };
 C.clearScene=function(...args){this.surgeonOperatingRoomR78=null;this.surgeonFollowMarkerR78=null;return clearBase.apply(this,args);};
 C.inspectSpatial=function(...args){return{...inspectBase.apply(this,args),hospitalOperatingBackdropR78:{available:true,room:!!this.surgeonOperatingRoomR78,followMarker:!!this.surgeonFollowMarkerR78,presentationOnly:true,collisionChanged:false,GPUVerified:false}};};
 const fixture=T=>{const renderer={T,spatialRoot:new T.Group(),spatialResources:new Set()};buildOperatingRoom(renderer);buildMarker(renderer);renderer.surgeonFollowMarkerR78.position.set(18.25,.02,10.75);return{root:renderer.spatialRoot,resources:renderer.spatialResources,marker:renderer.surgeonFollowMarkerR78,room:renderer.surgeonOperatingRoomR78};};
 window.__STORYWORLD_WORLD_VISUAL_R78__=Object.freeze({plan,fixture,inspect:()=>({revision:plan.revision,available:true,stats:{...stats},scope:'ep1a08 solo Three renderer, operating-room floor inlay and ground-level surgeon marker',collisionChanged:false,damageChanged:false,saveChanged:false,browser:false,GPU:false})});
})();
