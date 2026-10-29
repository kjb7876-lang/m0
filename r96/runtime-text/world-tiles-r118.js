/* R118 map-surface tiles. The Drive map-surface catalog of 2026-10-29 delivers
 * painted floor and wall materials whose canon headings name the region they
 * belong to (dist00 palace garden, dist01 spider cave, dist03 ruined castle,
 * ep1b04 gluttony kitchen, ep1b06 vault, ep1b06b cabin, ep1b09 bootloader
 * snowfield, kair07 black workshop). Each of those regions swaps its floor
 * (and wall, where the catalog supplies one) texture once the image arrives.
 * Geometry, collision, doors, props, saves and the route are untouched, the
 * original art files stay as they are, and a region without a row here keeps
 * its look. Hospital (ep1a08) is not touched: its floor samples the original
 * sheet rectangles, not repeating physical UVs.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!A||!C||window.__STORYWORLD_TILES_R118__||typeof makeRoom!=='function'||typeof enterRegion!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r118.tiles';
 const DEFAULTS=Object.freeze({tiles:true});let prefs={...DEFAULTS},lastError=null;
 const stats={dressed:0,paints:0,floors:0,walls:0,waits:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof saved?.tiles==='boolean')prefs.tiles=saved.tiles;}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){if(typeof patch.tiles==='boolean')prefs.tiles=patch.tiles;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const DIR='assets/r118/tiles/';
 // region id -> look file (floor on the left 1024 px, wall on the right 1024 px), which halves to paint, and the
 // colour each material multiplies the painted texture by (near white: the picture carries the colour).
 const REGIONS={
  dist00:{file:'garden',floor:0xeceae0},                      // 악마화 나무의 정원 (hedge walls stay: R107)
  dist01:{file:'cave',floor:0xdcdadc},                         // 거미동굴
  dist03:{file:'castle',floor:0xe0dcd8},                       // 무너진 성
  ep1b04:{file:'kitchen',floor:0xffffff,wall:0xe8e8e8},        // 탐식의 주방
  ep1b06:{file:'vault',wall:0xdcdee2},                         // 맘몬의 금고 (wall only)
  ep1b06b:{file:'cabin',floor:0xf2eae2,wall:0xf2eae2},         // 눈보라 속의 소년
  ep1b09:{file:'snow',floor:0xffffff},                         // 생체 부트로더
  kair07:{file:'workshop',floor:0xece4dc,wall:0xe4dcd4},       // 검은 공방
  kair03:{file:'sandblack',floor:0xffffff},kair10:{file:'sandblack',floor:0xffffff}, // 세이렌 모르·붕괴 의식장: 발을 덮는 검은 모래 (R120)
  restKairo:{file:'sandgold',floor:0xd2c8bc},                  // 최초명령 재작성: 풀려난 시간의 금빛 모래, 효과와 겹치지 않게 살짝 낮춤 (R120)
  last304:{file:'meadow',floor:0xe8ecdc},                      // 중립 지역의 재각성 (젖은 풀밭)
  'sz115-S01-1':{file:'rosehouse',floor:0xf0e8dc,wall:0xece4d8}, // S-01 찻잔 안의 집 (흑백 타일·금 간 꽃무늬 벽)
  'sz115-S03-1':{file:'sparring',floor:0xe4e8f0,wall:0xe6e8e6}, 'sz115-S03-2':{file:'sparring',floor:0xe4e8f0,wall:0xe6e8e6}, 'sz115-S03-3':{file:'sparring',floor:0xe4e8f0,wall:0xe6e8e6}, // S-03 대련장
  'sz115-S03-5':{file:'asphalt',floor:0xffffff},                // S-03 스물세 해 전 빗속 (젖은 금 간 아스팔트, R120)
  'sz115-S05-1':{file:'gyeongseong',floor:0xf0e6e0,wall:0xece0dc}     // S-05 전차 지나는 술집
 };
 // S-02 밤의 출석부 school: wood floor only (the catalog wall is a non-tileable plaster-over-panel design).
 for(let i=1;i<=8;i++)REGIONS['sz115-S02-'+i]={file:'school',floor:0xece4dc};
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 // 사몽 구역은 호스트 지역 id(room.id)를 쓰므로 구역 id(samongR115.zone)가 있으면 그것으로 찾는다.
 const keyOf=r=>r?.samongR115?.zone||(r?.samongR103||r?.exploration?.samongR103||r?.exploration?.type==='r103-samong'?null:r?.id);
 const eligible=r=>solo()&&(r?.layer==='STORY'||r?.exploration?.type==='r103-samong')&&!!REGIONS[keyOf(r)]&&!!r.exploration?.surface?.art?.r55PhysicalUV;
 function dress(r){if(!eligible(r))return r;const art=r.exploration.surface.art;if(art.r118Tiles)return r;
  const k=keyOf(r),row=REGIONS[k];r.exploration.surface={...r.exploration.surface,art:{...art,r118Tiles:{id:k,...row}}};stats.dressed++;return r;}
 const makeBase=makeRoom;makeRoom=function(...args){const r=makeBase.apply(this,args);try{dress(r);}catch(e){fail(e);}return r;};
 const enterBase=enterRegion;enterRegion=async function(...args){const out=await enterBase.apply(this,args);try{if(out!==false)dress(room);}catch(e){fail(e);}return out;};
 if(typeof restoreSave==='function'){const restoreBase=restoreSave;restoreSave=async function(...args){const out=await restoreBase.apply(this,args);try{if(out!==false)for(const r of new Set([...Object.values(world||{}),room]))dress(r);}catch(e){fail(e);}return out;};}

 const images=new Map();
 function lookImage(file){let row=images.get(file);if(!row){row={image:new Image(),ready:false,waiters:[]};row.image.decoding='async';
  row.image.onload=()=>{row.ready=true;for(const f of row.waiters.splice(0))try{f(row.image);}catch(e){fail(e);}};
  row.image.onerror=()=>fail(Error('tile image failed: '+file));row.image.src=DIR+file+'.webp';images.set(file,row);}return row;}
 function cell(r,image,x){const T=r.T,c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.imageSmoothingEnabled=true;if('imageSmoothingQuality'in g)g.imageSmoothingQuality='high';g.drawImage(image,x,0,1024,1024,0,0,512,512);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);t.userData.r118Tile=true;r.spatialResources?.add(t);return t;}
 function paint(r,art){const spec=art?.r118Tiles;if(!spec||!prefs.tiles)return;const stone=r.stoneMaterial,wall=r.wallMaterial,back=art.r59Backdrop?null:r.backgroundMaterial;let tries=0;
  const apply=image=>{if(r.disposed||r.stoneMaterial!==stone)return;
   // R99 paints its own ground asynchronously for open regions; let it finish so this look is the last word.
   if(art.r99Ground&&r.r99GroundKind!==art.r99Ground.kind&&++tries<240){stats.waits++;requestAnimationFrame(()=>apply(image));return;}
   if(spec.floor!=null){const t=cell(r,image,0);for(const m of[stone,back])if(m){m.map=t;m.color?.setHex?.(spec.floor);m.needsUpdate=true;}stats.floors++;}
   if(spec.wall!=null&&wall){wall.map=cell(r,image,1024);wall.color?.setHex?.(spec.wall);wall.needsUpdate=true;stats.walls++;}
   r.r118TileLook=spec.file;stats.paints++;};
  const row=lookImage(spec.file);row.ready?apply(row.image):row.waiters.push(apply);}
 const spatialBase=C.createSpatial;
 if(spatialBase)C.createSpatial=function(asset,art,...args){const out=spatialBase.call(this,asset,art,...args);
  try{let a=art;// the zone id of a samong room is only known once the zone is built: dress the shown room here too
   if(!a?.r118Tiles&&typeof room==='object'&&room?.exploration?.surface?.art&&room.exploration.surface.art.path===art?.path){dress(room);a=room.exploration.surface.art;}
   paint(this,a);}catch(e){fail(e);}return out;};
 const clearBase=C.clearScene;C.clearScene=function(...args){this.r118TileLook=null;return clearBase.apply(this,args);};

 function settingsSection(){const host=document.getElementById('settingsR118')||document.getElementById('retroSettingsR99Outdoor');if(!host||document.getElementById('r118-tiles-row'))return;
  const l=document.createElement('label');l.id='r118-tiles-row';l.innerHTML='<input type="checkbox" id="r118-tiles"> 지역 맞춤 바닥·벽 타일 (정원·거미동굴·무너진 성·주방·금고·산장·설원·공방)';
  host.appendChild(l);const el=l.querySelector('#r118-tiles');el.checked=prefs.tiles;el.onchange=()=>set({tiles:el.checked});}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_TILES_R118__=Object.freeze({revision:'R118-tiles-1',prefs:()=>({...prefs}),set,regions:REGIONS,
  inspect:()=>({prefs:{...prefs},stats:{...stats},current:typeof room!=='undefined'?room?.exploration?.surface?.art?.r118Tiles||null:null,lastError,collisionChanged:false,layoutRouteChanged:false,savesTouched:false})});
 for(const r of new Set([...Object.values(typeof world==='object'&&world||{}),typeof room==='object'?room:null]))try{dress(r);}catch(e){fail(e);}
})();
