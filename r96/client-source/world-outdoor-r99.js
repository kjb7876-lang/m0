/* R99 outdoor ground. R98 opened the roof over outdoor, mixed and cavern
 * places, but their ground and hedges still used the 298 px indoor patches
 * and the space past the path was the same floor a shade darker. The R8 art
 * package (checkpoint06) supplies painted ground: warm coursed paving, mossy
 * rock ledges and mountain cliff faces, two water surfaces and two swaying
 * trees. Each open region now takes a family ground (floor + wall face), its
 * swamp, sea or canal surroundings become slowly moving water, and living or
 * dead trees stand on the ground beside the path. Collision, walls, doors,
 * props that the story uses, saves and the route are untouched; trees are
 * non-solid presentation props that fade when they cover the hero.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype,R98=window.__STORYWORLD_WORLD_R98__;
 if(!A||!C||!R98||window.__STORYWORLD_OUTDOOR_R99__||typeof makeRoom!=='function'||typeof enterRegion!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r99.outdoor';
 const DEFAULTS=Object.freeze({ground:true,water:true,trees:true}),LABELS={ground:'야외 바닥·절벽 원화',water:'늪·바다·수로 물결',trees:'흔들리는 나무'};
 let prefs={...DEFAULTS},lastError=null;
 const stats={grounds:0,waters:0,surrounds:0,trees:0,treeFrames:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const DIR='assets/r99/outdoor/',FRAMES=12,FRAME_MS=100;
 const treeFrames=kind=>Array.from({length:FRAMES},(_,i)=>DIR+'tree-'+kind+'-'+String(i).padStart(2,'0')+'.webp');

 // Ground image: floor on the left 1024 px, wall face on the right 1024 px.
 // Palettes multiply the painted colour, so they stay near white with the
 // family's cast; the cap and edge keep the R81 masonry trim readable.
 const LOOK={
  garden:{ground:'paving',surround:'moss',palette:{floor:0xe6e0cc,wall:0xc2c8b4,cap:0xb4bea4,edge:0x3e4a3a}},
  swamp:{ground:'moss',palette:{floor:0xd2d8c0,wall:0xb4bca6,cap:0xa4ae92,edge:0x2e3c30},water:'swamp'},
  cave:{ground:'cliff',palette:{floor:0xbcc0cc,wall:0xa6aab8,cap:0x9ca0ae,edge:0x2e333e}},
  ash:{ground:'ruin',surround:'cliff',palette:{floor:0xd8c8be,wall:0xb4a8a4,cap:0xb0a094,edge:0x46383a}},
  coast:{ground:'cliff',palette:{floor:0xd0d6da,wall:0xb4bec6,cap:0xa8b4bc,edge:0x34444e},water:'sea'},
  snow:null,clinical:null,domestic:null,memory:null,neural:null,
  stone:{ground:'ruin',surround:'cliff',palette:{floor:0xd6d6d2,wall:0xb8bcbe,cap:0xaeb4b8,edge:0x3e444c}},
  forge:{ground:'ruin',surround:'cliff',palette:{floor:0xd2ccc2,wall:0xb0b2b4,cap:0xa8aaac,edge:0x3c4248}}
 };
 // Open ground past the path: moss or bare rock instead of more paving.
 const SURROUND={moss:{file:'surround-moss',tile:7},cliff:{file:'surround-cliff',tile:7}};
 // Water tint per surface (multiplies the painted water) and its drift speed.
 const WATER={swamp:{file:'water-swamp',tint:0xb8c4b0,drift:[.006,.0035]},sea:{file:'water-swamp',tint:0x9cb4c8,drift:[.009,.005]},canal:{file:'water-canal',tint:0xc4c4b4,drift:[.012,.002]}};
 const TEXT=p=>[p?.style,p?.sourceEnvironment,p?.sourceTopology].join(' ').toLowerCase();
 function lookOf(id,scene){if(!scene||!(scene.open||scene.mode==='cavern'))return null;
  const base=LOOK[scene.family];if(!base)return null;const text=TEXT(globalThis.StoryWorldProfilesR74?.profiles?.[id]);
  let water=base.water||null;if(/canal|waterway/.test(text))water='canal';else if(/swamp|reed/.test(text))water='swamp';else if(/black-sea|sea|port|harbou?r/.test(text))water='sea';
  // Trees: dead in cursed, burnt, drowned and grave ground; living in meadows and forests.
  let trees=null;if(scene.mode!=='cavern'){if(/meadow|forest|flute|time-forest|first-command-garden|rewritten/.test(text))trees='living';else if(/demon|dead|grave|cemetery|swamp|reed|ash|ruin|fallen|pillar|pilgrim|crossing|approach|boulevard/.test(text))trees='dead';}
  if(water==='sea')trees=null;
  return{...base,water,trees};}

 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const eligible=r=>solo()&&r?.layer==='STORY'&&r.id!=='ep1a08'&&!!r.exploration?.r98Scene;
 function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}

 // The floor/wall source rectangles in L.surface.art stay as authored (doors
 // and props sample them); the renderer swaps its own floor, wall and backing
 // textures once the painted ground image arrives.
 function ground(L,look){if(!prefs.ground||!look?.ground||L.surface?.art?.r99Ground)return;const art=L.surface?.art;if(!art)return;
  L.surface={...L.surface,art:{...art,r99Ground:{kind:look.ground,palette:{...look.palette}}}};stats.grounds++;}

 // Trees stand on open ground beside the path (never on it): grid samples that
 // are blocked but have walkable floor within reach, spaced apart, away from
 // the entry, exits and objective.
 function plant(r,look){if(!prefs.trees||!look?.trees||r.r99Trees)return;const L=r.exploration,b=L.bounds;if(!Array.isArray(b)||typeof A.explorationBlocked!=='function')return;
  const blocked=(x,y,s=.3)=>A.explorationBlocked(L,x,y,s),pts=[],seed=hash(r.id),step=2.5,forest=look.trees==='living',cap=forest?30:14,gap=forest?4.6:6.5;
  for(let y=b[1]+1;y<b[3]-1;y+=step)for(let x=b[0]+1;x<b[2]-1;x+=step){const jx=x+((hash(seed+':'+x+':'+y)%100)/100-.5)*1.2,jy=y+((hash(y+':'+x+':'+seed)%100)/100-.5)*1.2;
   if(!blocked(jx,jy,.9))continue;let near=0;for(const[dx,dy]of[[2.6,0],[-2.6,0],[0,2.6],[0,-2.6]])if(!blocked(jx+dx,jy+dy,.2))near++;if(near>2||(!near&&!forest))continue;pts.push({x:jx,y:jy,k:hash(seed+':'+jx.toFixed(2)+jy.toFixed(2))});}
  pts.sort((a,c)=>a.k-c.k);const keep=[],avoid=[L.entry,r.objective,...(L.worldR74?.doors||[])].filter(p=>p&&Number.isFinite(p.x));
  for(const p of pts){if(keep.length>=cap)break;if(avoid.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<5))continue;if(keep.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<gap))continue;keep.push(p);}
  const frames=treeFrames(look.trees);if(typeof addImage==='function')for(const f of frames)try{addImage(f);}catch(_){}
  r.r99Trees=keep.map((p,i)=>{const q={id:'r99:tree:'+r.id+':'+i,path:frames[0],x:p.x,y:p.y,height:(look.trees==='living'?196:176)*(.86+(p.k%30)/100),solid:false,visible:true,enabled:true,r80PresentationOnly:true,r99Tree:{kind:look.trees,phase:p.k%FRAMES,rate:.8+(p.k%5)/10}};r.props.push(q);return q.id;});stats.trees+=keep.length;}

 function dress(r){if(!eligible(r))return r;const L=r.exploration,scene=L.r98Scene;if(L.r99Outdoor?.id===r.id)return r;const look=lookOf(r.id,scene);
  L.r99Outdoor={id:r.id,family:scene.family,mode:scene.mode,ground:null,water:null,trees:null};if(!look)return r;
  ground(L,look);plant(r,look);L.r99Outdoor={id:r.id,family:scene.family,mode:scene.mode,ground:L.surface?.art?.r99Ground?.kind||null,water:prefs.water?look.water:null,surround:prefs.ground&&!look.water?look.surround||null:null,trees:r.r99Trees?look.trees:null,treeCount:r.r99Trees?.length||0};return r;}
 const makeBase=makeRoom;makeRoom=function(...args){const r=makeBase.apply(this,args);try{dress(r);}catch(e){fail(e);}return r;};
 const enterBase=enterRegion;enterRegion=async function(...args){const out=await enterBase.apply(this,args);try{if(out!==false)dress(room);}catch(e){fail(e);}return out;};
 if(typeof restoreSave==='function'){const restoreBase=restoreSave;restoreSave=async function(...args){const out=await restoreBase.apply(this,args);try{if(out!==false)for(const r of new Set([...Object.values(world||{}),room]))dress(r);}catch(e){fail(e);}return out;};}

 // Tree sway: the rig's 12 samples loop at 10 fps, each tree on its own phase.
 if(typeof drawProp==='function'){const drawBase=drawProp;drawProp=function(p,...args){const t=p?.r99Tree;if(t){const frames=treeFrames(t.kind),i=(Math.floor(performance.now()/FRAME_MS*t.rate)+t.phase)%FRAMES;if(typeof readyImage!=='function'||readyImage(frames[i])){p.path=frames[i];stats.treeFrames++;}}return drawBase.apply(this,[p,...args]);};}

 // ---- renderer: water around open swamp, sea and canal places -------------
 const sceneOf=frame=>solo()&&frame?.layer==='STORY'?frame.exploration?.r99Outdoor||null:null;
 function textured(r,key,file,tile,tint,drift){r.r99Ground=r.r99Ground||{};if(r.r99Ground[key])return r.r99Ground[key];const T=r.T;
  const tex=new T.TextureLoader().load(DIR+file+'.webp');tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(24/tile,24/tile);tex.anisotropy=Math.min(8,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);
  const m=new T.MeshBasicMaterial({map:tex,color:tint,side:T.DoubleSide,toneMapped:false});m.name='r99-'+key;m.userData.r99Drift=drift||null;r.spatialResources?.add(tex);r.spatialResources?.add(m);return r.r99Ground[key]=m;}
 function syncGround(r,frame){const mesh=r.voidMeshR81,o=sceneOf(frame);if(!mesh)return;
  let m=null;if(mesh.userData.r98Open&&o){
   if(o.water&&prefs.water){const w=WATER[o.water];m=textured(r,'water-'+o.water,w.file,7,w.tint,w.drift);}
   else if(o.surround){const g=SURROUND[o.surround],art=frame.exploration?.surface?.art,p=art?.r99Ground?.palette||art?.r81Palette;m=textured(r,'surround-'+o.surround,g.file,g.tile,0xffffff,null);if(p?.floor!=null)m.color.setHex(p.floor).multiplyScalar(.8);}}
  mesh.userData.r99Ground=m?m.name:null;if(m&&mesh.material!==m){mesh.material=m;stats.waters++;}}
 const images=new Map();
 function groundImage(kind){let row=images.get(kind);if(!row){row={image:new Image(),ready:false,waiters:[]};row.image.decoding='async';row.image.onload=()=>{row.ready=true;for(const f of row.waiters.splice(0))try{f(row.image);}catch(e){fail(e);}};row.image.onerror=()=>fail(Error('ground image failed: '+kind));row.image.src=DIR+'ground-'+kind+'.webp';images.set(kind,row);}return row;}
 function cell(r,image,x){const T=r.T,c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.imageSmoothingEnabled=true;if('imageSmoothingQuality'in g)g.imageSmoothingQuality='high';g.drawImage(image,x,0,1024,1024,0,0,512,512);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.anisotropy=Math.min(8,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);t.userData.r99Ground=true;r.spatialResources?.add(t);return t;}
 function paintGround(r,art){const spec=art?.r99Ground;if(!spec||!prefs.ground||!art.r55PhysicalUV)return;const stone=r.stoneMaterial,wall=r.wallMaterial,back=art.r59Backdrop?null:r.backgroundMaterial;
  const apply=image=>{if(r.stoneMaterial!==stone||r.disposed)return;const floor=cell(r,image,0),face=cell(r,image,1024);
   for(const m of[stone,back])if(m){m.map=floor;m.needsUpdate=true;}if(wall){wall.map=face;wall.needsUpdate=true;}
   const p=spec.palette;for(const[name,key]of[['stoneMaterial','floor'],['wallMaterial','wall'],['wallCapMaterial61','cap'],['regionalTrimMaterial55','edge']])r[name]?.color?.setHex?.(p[key]);r.r99GroundKind=spec.kind;stats.paints=(stats.paints||0)+1;};
  const row=groundImage(spec.kind);row.ready?apply(row.image):row.waiters.push(apply);}
 const spatialBase=C.createSpatial;
 if(spatialBase)C.createSpatial=function(asset,art,...args){const out=spatialBase.call(this,asset,art,...args);try{paintGround(this,art);}catch(e){fail(e);}return out;};
 const roofsBase=C.ensureHospitalRoofsR2;
 if(roofsBase)C.ensureHospitalRoofsR2=function(frame){const out=roofsBase.call(this,frame);try{syncGround(this,frame);}catch(e){fail(e);}return out;};
 const renderBase=C.render;
 C.render=function(frame){try{const m=this.voidMeshR81?.userData?.r99Ground&&this.voidMeshR81.material;if(m?.map&&m.userData.r99Drift){const s=performance.now()/1000,d=m.userData.r99Drift;m.map.offset.set((s*d[0])%1,(s*d[1]+Math.sin(s*.35)*.004)%1);}}catch(e){fail(e);}return renderBase.call(this,frame);};
 const clearBase=C.clearScene;C.clearScene=function(...args){this.r99Ground=null;return clearBase.apply(this,args);};

 function settingsSection(){const host=document.getElementById('retroSettingsR98World');if(!host||document.getElementById('retroSettingsR99Outdoor'))return;
  const s=document.createElement('section');s.id='retroSettingsR99Outdoor';s.innerHTML='<h3>야외 원화 (R99)</h3><p class="small muted">야외·동굴 지역의 바닥과 벽을 원화 질감으로 바꾸고, 늪·바다·수로 주변에 물결을, 길가에 나무를 둡니다. 충돌과 길은 그대로이며 다음 지역 진입부터 적용됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r99o-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r99o-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_OUTDOOR_R99__=Object.freeze({prefs:()=>({...prefs}),set,lookOf,look:LOOK,
  inspect:()=>({revision:'R99-outdoor-ground',prefs:{...prefs},stats:{...stats},current:typeof room!=='undefined'?room?.exploration?.r99Outdoor||null:null,lastError,collisionChanged:false,layoutRouteChanged:false,savesTouched:false})});
 for(const r of new Set([...Object.values(typeof world==='object'&&world||{}),typeof room==='object'?room:null]))try{dress(r);}catch(e){fail(e);}
})();
