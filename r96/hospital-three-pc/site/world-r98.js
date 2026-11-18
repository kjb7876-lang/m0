/* R98 place identity. Every story region was drawn as the same roofed ward
 * maze. The canonical profile of each region (StoryWorldProfilesR74: indoor,
 * outdoor, mixed, cavern, plus its style) now decides how the shared maze is
 * presented: outdoor and mixed places lose the roof slabs, the boundary
 * masonry and the brain backing, their walls drop to hedge / fence / ruin
 * height, the carried torch widens into daylight or moonlight, and a sky haze
 * tinted per region family settles over the far ground. Indoor places keep
 * the roofed maze. Collision, walls' footprints, doors, props, saves and the
 * route are untouched: only wall height, three presentation meshes, the light
 * and the colour grade change. Canonical source; copied by scripts/apply-r98.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!A||!C||window.__STORYWORLD_WORLD_R98__||typeof makeRoom!=='function'||typeof enterRegion!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r98.world';
 const DEFAULTS=Object.freeze({places:true,haze:true}),LABELS={places:'서사대로 야외·실내 구분',haze:'하늘·안개 색감'};
 let prefs={...DEFAULTS},lastError=null;
 const stats={dressed:0,wallsLowered:0,roofHidden:0,voidSwaps:0,hazeFrames:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const profiles=()=>globalThis.StoryWorldProfilesR74?.profiles||{};

 // Wall height by place. Outdoor walls read as hedges, fences, grave rows and
 // broken ruin walls; mixed places (castle fronts, stages, arenas) keep waist
 // to shoulder height; indoor keeps the authored 2.6-2.8 ward wall.
 const OUTDOOR=[[/cemetery|grave/,1.0],[/meadow|garden|forest|flute|tree/,1.1],[/swamp|reed|waterway|canal/,.95],[/snow|winter|frozen/,1.05],[/sea|port|coast|rampart|storm/,1.45],[/city|boulevard|approach|prison|war|crossing|pilgrim|pillar|gate|circle|threshold|nexus|rift|outpost|wormhole|observation|platform|ruins|plaza|dial|ritual|neuron|rescue|palace/,1.5],[/rooftop|crosswalk|rain/,1.2]];
 const MIXED=[[/castle|rampart|wall/,2.2],[/stage|heel/,1.7],[/academy|defense|ring/,2.0],[/throne|court|mirror/,2.4],[/neural|network|altar|chip/,2.1],[/organic|vat/,2.0],[/judgment|machine/,2.3],[/clinic|halo|heaven/,2.0],[/snow|neural|bootloader/,1.7]];
 function pick(table,text,fallback){for(const[re,h]of table)if(re.test(text))return h;return fallback;}
 function placeOf(id){const p=profiles()[id];if(!p)return null;const text=[p.style,p.sourceEnvironment,p.sourceTopology].join(' ').toLowerCase(),mode=p.mode||'indoor';
  const wall=mode==='outdoor'?pick(OUTDOOR,text,1.25):mode==='mixed'?pick(MIXED,text,2.0):null;
  return{id,mode,style:p.style,open:mode==='outdoor'||mode==='mixed',wall};}

 // Family haze: sky or fog colour and strength. Outdoor = sky light from the
 // top of the screen; cavern = dark damp air; indoor = faint dust.
 const HAZE={snow:[[.80,.86,.92],.34],swamp:[[.42,.50,.36],.30],coast:[[.40,.52,.60],.28],garden:[[.52,.56,.42],.24],ash:[[.40,.28,.22],.26],cave:[[.30,.33,.42],.22],memory:[[.40,.33,.50],.22],neural:[[.28,.42,.50],.22],stone:[[.42,.42,.40],.20],regional:[[.40,.38,.34],.20],clinical:[[.40,.46,.48],.14],domestic:[[.40,.35,.30],.14],forge:[[.38,.26,.18],.18]};
 // Carried-light shape per mode (edge = brightness at the rim, inner = pool radius share).
 const LIGHT={outdoor:{edge:.88,inner:.66},mixed:{edge:.76,inner:.54},cavern:{edge:.52,inner:.34}};
 // Grade nudges per mode so a snowfield is bright and a swamp stays sunk.
 const GRADE={outdoor:{gain:.08,sat:.04},mixed:{gain:.04,sat:.02},cavern:{gain:-.04,sat:-.02}};
 const FAMILY_GAIN={snow:.10,garden:.02,coast:.02,swamp:-.03,ash:-.02};

 function family(L,id){return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[id]?.family||'regional';}
 const eligible=r=>solo()&&r?.layer==='STORY'&&r.id!=='ep1a08'&&!!r.exploration?.worldWardR81;
 function dress(r){if(!prefs.places||!eligible(r))return r;const L=r.exploration,place=placeOf(r.id);if(!place)return r;
  if(L.r98Scene?.id===r.id&&L.r98Scene.applied)return r;
  if(place.wall!=null&&Array.isArray(L.walls)){for(const w of L.walls){if(!w||!Number.isFinite(w.height)||w.r98BaseHeight!=null)continue;w.r98BaseHeight=w.height;w.height=place.wall;stats.wallsLowered++;}}
  L.r98Scene={...place,family:family(L,r.id),applied:true,version:1};stats.dressed++;return r;}
 const makeBase=makeRoom;makeRoom=function(...args){const r=makeBase.apply(this,args);try{dress(r);}catch(e){fail(e);}return r;};
 const enterBase=enterRegion;enterRegion=async function(...args){const out=await enterBase.apply(this,args);try{if(out!==false)dress(room);}catch(e){fail(e);}return out;};
 if(typeof restoreSave==='function'){const restoreBase=restoreSave;restoreSave=async function(...args){const out=await restoreBase.apply(this,args);try{if(out!==false)for(const r of new Set([...Object.values(world||{}),room]))dress(r);}catch(e){fail(e);}return out;};}

 // ---- renderer -------------------------------------------------------------
 const sceneOf=frame=>prefs.places&&solo()&&frame?.layer==='STORY'?frame.exploration?.r98Scene||null:null;
 function voidMaterial(r){const T=r.T;if(r.r98VoidMaterial)return r.r98VoidMaterial;const m=new T.MeshBasicMaterial({color:0x8a8f86,side:T.DoubleSide,depthTest:true,depthWrite:true,toneMapped:false});m.name='r98-open-ground';r.r98VoidMaterial=m;r.spatialResources.add(m);return m;}
 function syncVoid(r,frame,scene){const mesh=r.voidMeshR81;if(!mesh)return;
  if(!scene?.open){if(mesh.userData.r98Open){mesh.material=r.voidMaterialR81||mesh.material;mesh.name='r82-brain-nonwalkable-backing';mesh.userData.r98Open=false;}return;}
  const m=voidMaterial(r),floor=r.stoneMaterial?.map;
  if(floor&&m.userData.source!==floor){if(m.map){r.spatialResources.delete(m.map);m.map.dispose();}const t=floor.clone();t.wrapS=t.wrapT=r.T.RepeatWrapping;const tile=frame.exploration?.surface?.art?.tileWorld||4.5;t.repeat.set(24/tile,24/tile);t.needsUpdate=true;r.spatialResources.add(t);m.map=t;m.userData.source=floor;m.needsUpdate=true;}
  // The same ground continues under the hedges, a shade darker than the path.
  const p=frame.exploration?.surface?.art?.r81Palette;if(p?.floor!=null)m.color.setHex(p.floor).multiplyScalar(.74);
  if(mesh.material!==m){mesh.material=m;mesh.userData.r98Open=true;stats.voidSwaps++;}
  // R89 grades materials by mesh name; "annex-ground" takes the floor grade, not the dark void grade.
  if(mesh.name!=='r98-annex-ground-open')mesh.name='r98-annex-ground-open';
 }
 function syncRoof(r,scene){const open=!!scene?.open;
  if(r.hospitalRoofMeshR2){if(r.hospitalRoofMeshR2.visible===open){r.hospitalRoofMeshR2.visible=!open;if(open)stats.roofHidden++;}}
  if(r.perimeterMeshR83)r.perimeterMeshR83.visible=!(scene?.mode==='outdoor');
  if(r.r89Doors)r.r89Doors.visible=!(scene?.mode==='outdoor');
 }
 function hazeQuad(r){if(r.r98Haze)return r.r98Haze;const T=r.T;
  const material=new T.ShaderMaterial({uniforms:{color:{value:new T.Vector3(.4,.4,.4)},strength:{value:0},horizon:{value:.28},resolution:{value:new T.Vector2(1,1)}},
   vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
   // Sky light settles from the top of the frame; the near ground stays clear.
   fragmentShader:'uniform vec3 color;uniform float strength;uniform float horizon;uniform vec2 resolution;void main(){float v=gl_FragCoord.y/resolution.y;float f=smoothstep(horizon,1.05,v);gl_FragColor=vec4(color,f*strength);}',
   transparent:true,depthTest:false,depthWrite:false,blending:T.NormalBlending,toneMapped:false});
  const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);mesh.name='r98-sky-haze';mesh.frustumCulled=false;mesh.renderOrder=-990;mesh.layers.set(2);mesh.userData.presentationOnly=true;r.r98Haze=mesh;return mesh;}
 function syncHaze(r,frame,scene){const mesh=hazeQuad(r);if(mesh.parent!==r.scene)r.scene.add(mesh);
  const fam=scene?.family||'regional',row=HAZE[fam]||HAZE.regional,want=prefs.haze&&!!scene&&!(window.__STORYWORLD_SIGHT24__?.enabled===true);
  mesh.visible=want;if(!want)return;
  const mode=scene.mode,k=mode==='outdoor'?1:mode==='mixed'?.7:mode==='cavern'?.8:.45;
  mesh.material.uniforms.color.value.set(...row[0]);mesh.material.uniforms.strength.value=row[1]*k;mesh.material.uniforms.horizon.value=mode==='outdoor'?.22:.42;
  mesh.material.uniforms.resolution.value.set(r.renderer.domElement.width,r.renderer.domElement.height);stats.hazeFrames++;}

 const roofsBase=C.ensureHospitalRoofsR2;
 if(roofsBase)C.ensureHospitalRoofsR2=function(frame){const out=roofsBase.call(this,frame);try{const scene=sceneOf(frame);syncRoof(this,scene);syncVoid(this,frame,scene);}catch(e){fail(e);}return out;};
 const renderBase=C.render;
 C.render=function(frame){try{if(this.scene&&this.renderer)syncHaze(this,frame,sceneOf(frame));}catch(e){fail(e);}return renderBase.call(this,frame);};
 const clearBase=C.clearScene;C.clearScene=function(...args){if(this.r98VoidMaterial){this.r98VoidMaterial=null;}return clearBase.apply(this,args);};
 const disposeBase=C.dispose;if(disposeBase)C.dispose=function(...args){try{this.r98Haze?.geometry.dispose();this.r98Haze?.material.dispose();}catch(_){}this.r98Haze=null;return disposeBase.apply(this,args);};

 // Hooks R89 reads for the carried light shape and the family grade.
 function light(frame,base){const scene=sceneOf(frame);if(!scene||!base)return null;const spec=LIGHT[scene.mode];return spec?{...base,edge:Math.max(base.edge,spec.edge),inner:Math.max(base.inner,spec.inner)}:null;}
 function grade(frame,base){const scene=sceneOf(frame);if(!scene||!base)return null;const g=GRADE[scene.mode]||{gain:0,sat:0},f=FAMILY_GAIN[scene.family]||0;return{...base,gain:base.gain+g.gain+f,sat:Math.min(1,base.sat+g.sat)};}

 function settingsSection(){const host=document.getElementById('retroSettingsR98Vfx')||document.getElementById('retroSettingsR98Combat')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR98World'))return;
  const s=document.createElement('section');s.id='retroSettingsR98World';s.innerHTML='<h3>장소 표현 (R98)</h3><p class="small muted">서사의 야외·실내 구분대로 벽 높이·지붕·조명·안개를 바꿉니다. 충돌과 길은 그대로이며 다음 지역 진입부터 적용됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r98w-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r98w-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_WORLD_R98__=Object.freeze({prefs:()=>({...prefs}),set,placeOf,light,grade,haze:HAZE,
  inspect:()=>({revision:'R98-place-identity',prefs:{...prefs},stats:{...stats},current:typeof room!=='undefined'?room?.exploration?.r98Scene||null:null,lastError,collisionChanged:false,layoutRouteChanged:false,savesTouched:false})});
})();
