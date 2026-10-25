/* R89: retro dark-fantasy presentation over the existing Three renderer.
 * Presentation only. Collision, layouts, damage, cooldowns, saves, progression
 * and source images stay native. Preferences live outside save slots. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!A||!C||window.__STORYWORLD_WORLD_RETRO_R89__)return;
 const STORE_KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.r89:')+'r89.presentation';
 const DEFAULTS=Object.freeze({light:'normal',grade:true,dither:true,contact:true});
 // R97: the carried light left ~60% of the frame near black (mean luma 21/255 over
 // the campaign). Wider pool and lighter rim keep the torch mood but let the maze read.
 const LIGHT=Object.freeze({off:null,soft:{edge:.76,inner:.46},normal:{edge:.62,inner:.4}});
 // Per-family mood. Gain/saturation unify the dark palette; tints keep each
 // region's own material identity (tile, wet earth, stone, ash...).
 // R97: every gain +.10 (same relative order between families).
 const FAMILY={
  clinical:{tint:[.95,1,.97],sat:.7,gain:.96},garden:{tint:[.94,.99,.91],sat:.78,gain:.96},cave:{tint:[.93,.96,1],sat:.75,gain:.94},
  swamp:{tint:[.9,.98,.84],sat:.78,gain:.92},ash:{tint:[1.02,.94,.89],sat:.74,gain:.94},domestic:{tint:[1,.96,.92],sat:.76,gain:.96},
  stone:{tint:[.97,.96,.94],sat:.72,gain:.95},forge:{tint:[1.03,.95,.88],sat:.78,gain:.95},snow:{tint:[.95,.99,1.04],sat:.74,gain:.98},
  coast:{tint:[.92,.98,1.01],sat:.76,gain:.95},memory:{tint:[.97,.93,1.02],sat:.74,gain:.94},neural:{tint:[.91,.98,1],sat:.74,gain:.94},
  regional:{tint:[.98,.97,.95],sat:.78,gain:.96}
 };
 // Core colour of the carried light per family (multiplier, <=1 per channel).
 const WARM={regional:[1,.95,.87],clinical:[1,.95,.86],garden:[1,.96,.88],cave:[1,.94,.84],swamp:[1,.96,.86],ash:[1,.92,.8],domestic:[1,.94,.84],
  stone:[1,.94,.84],forge:[1,.91,.78],snow:[1,.98,.94],coast:[1,.97,.92],memory:[1,.95,.9],neural:[1,.97,.93]};
 const MAX_FOCUS=6,stats={patched:0,skirtBuilds:0,skirtEdges:0,frames:0,litFrames:0,focusMax:0,propsDimmed:0,fadesSuppressed:0,hintFixes:0,errors:0};
 let prefs=load(),U=null,lastError=null;
 function load(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return{...DEFAULTS};const v=JSON.parse(raw);return{light:LIGHT.hasOwnProperty(v.light)?v.light:DEFAULTS.light,grade:v.grade!==false,dither:v.dither!==false,contact:v.contact!==false};}catch(_){return{...DEFAULTS};}}
 function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(prefs));}catch(_){}}
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const sightOn=()=>window.__STORYWORLD_SIGHT24__?.enabled===true;
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

 function uniforms(T){if(U)return U;
  U={r89Grade:{value:0},r89Sat:{value:.75},r89Gain:{value:.86},r89Tint:{value:new T.Vector3(1,1,1)},r89Knee:{value:.6},r89Compress:{value:.42},
   r89Faces:{value:new T.Vector3(.8,.6,1)},r89Grime:{value:.1},r89VoidGain:{value:.4},r89Dither:{value:0},r89FocusCount:{value:0},
   r89Focus:{value:Array.from({length:MAX_FOCUS},()=>new T.Vector4(-1e4,-1e4,-1e4,0))},r89FocusR:{value:Array.from({length:MAX_FOCUS},()=>new T.Vector2(1,1))}};
  return U;
 }
 const HEAD=`uniform float r89Grade;uniform float r89Sat;uniform float r89Gain;uniform vec3 r89Tint;uniform float r89Knee;uniform float r89Compress;
uniform vec3 r89Faces;uniform float r89Grime;uniform float r89VoidGain;uniform float r89Dither;uniform int r89FocusCount;
uniform vec4 r89Focus[${MAX_FOCUS}];uniform vec2 r89FocusR[${MAX_FOCUS}];varying vec3 r89WorldPos;varying vec3 r89WorldNormal;
float r89Hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float r89Noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(r89Hash(i),r89Hash(i+vec2(1.,0.)),u.x),mix(r89Hash(i+vec2(0.,1.)),r89Hash(i+vec2(1.,1.)),u.x),u.y);}
float r89Bayer(vec2 p){vec2 q=mod(p,4.);int i=int(q.x)+int(q.y)*4;float m[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);return (m[i]+.5)/16.;}
`;
 // Occluders in front of a focused actor become a coarse ordered dither (the
 // classic isometric wall see-through) instead of a rebuilt rectangular hole.
 const DITHER=`if(r89Dither>.5&&r89WorldPos.y>.06){vec2 r89fc=gl_FragCoord.xy;float r89d=(r89WorldPos.x+r89WorldPos.z)*.5;
 for(int i=0;i<${MAX_FOCUS};i++){if(i>=r89FocusCount)break;vec4 f=r89Focus[i];if(r89d>f.z+.04){vec2 q=(r89fc-f.xy)/r89FocusR[i];float rr=dot(q,q);
 if(rr<1.){float keep=i==0?mix(.08,1.,smoothstep(.35,1.,rr)):mix(.38,1.,smoothstep(.45,1.,rr));if(r89Bayer(floor(r89fc))>=keep)discard;}}}}
`;
 function gradeCode(role){return `{vec3 c=gl_FragColor.rgb;float l=dot(c,vec3(.2126,.7152,.0722));
 if(l>r89Knee){float nl=r89Knee+(l-r89Knee)*r89Compress;c*=nl/max(l,1e-4);l=nl;}
 c=mix(vec3(l),c,r89Sat)*r89Tint*r89Gain;`+
  // Wall caps were one flat plastic-looking slab; give them a darker, mottled
  // worn-stone surface in world space so long runs no longer read as strips.
  (role==='wall'?`vec3 n=r89WorldNormal;float face=abs(n.y)>.6?r89Faces.y*mix(.7,1.1,r89Noise(r89WorldPos.xz*4.3)*.45+r89Noise(r89WorldPos.xz*11.+3.1)*.3+r89Noise(r89WorldPos.xz*.9+7.7)*.25):mix(r89Faces.x,r89Faces.z,clamp(.5+.5*(abs(n.z)-abs(n.x)),0.,1.));c*=face*mix(.8,1.,smoothstep(0.,.9,r89WorldPos.y));`:
   // Roof caps reuse the wall panel bitmap (R82). Flatten its bands into one
   // slate mass so the perimeter no longer reads as a striped ramp.
   role==='roof'?`float lr=mix(.45,dot(c,vec3(.2126,.7152,.0722)),.3)*mix(.86,1.08,r89Noise(r89WorldPos.xz*.23))*mix(.72,1.1,r89Noise(r89WorldPos.xz*4.3)*.45+r89Noise(r89WorldPos.xz*11.+1.7)*.3+r89Noise(r89WorldPos.xz*.9+7.7)*.25);c=vec3(lr)*vec3(.94,1.,.98)*r89Tint*r89Faces.y*.92;`:
   role==='void'?`c*=r89VoidGain;`:
   `float g=r89Noise(r89WorldPos.xz*.19)*.65+r89Noise(r89WorldPos.xz*.61+7.3)*.35;c*=mix(1.-r89Grime,1.+r89Grime*.4,g);`)+
  `gl_FragColor.rgb=mix(gl_FragColor.rgb,c,r89Grade);}
`;}
 const patched=new WeakMap();
 function patch(material,role,T){
  if(!material||patched.has(material)||!(material.isMeshBasicMaterial||material.isMeshStandardMaterial||material.isMeshLambertMaterial))return;
  const u=uniforms(T),before=material.onBeforeCompile,key=material.customProgramCacheKey;
  const wrapper=function(shader,...args){
   if(typeof before==='function')before.call(this,shader,...args);
   Object.assign(shader.uniforms,u);
   if(!shader.vertexShader.includes('varying vec3 r89WorldPos;'))shader.vertexShader='varying vec3 r89WorldPos;varying vec3 r89WorldNormal;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n{vec4 r89W=modelMatrix*vec4(transformed,1.);r89WorldPos=r89W.xyz;vec3 r89N=mat3(modelMatrix)*normal;r89WorldNormal=dot(r89N,r89N)>1e-8?normalize(r89N):vec3(0.,1.,0.);}');
   if(!shader.fragmentShader.includes('uniform float r89Grade;')){
    shader.fragmentShader=HEAD+shader.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,m=>m+'\n'+(role==='wall'||role==='roof'?DITHER:''));
    shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',gradeCode(role)+'#include <dithering_fragment>');
   }
  };
  // Older patches mark their own function to avoid re-attachment; keep those markers.
  if(typeof before==='function')for(const k of Object.keys(before))wrapper[k]=before[k];
  material.onBeforeCompile=wrapper;
  material.customProgramCacheKey=function(){return(typeof key==='function'?key.call(this):'')+'|r89-'+role;};
  material.needsUpdate=true;patched.set(material,role);stats.patched++;
 }
 const materialsOf=m=>Array.isArray(m)?m:[m];
 function roleByName(name){
  if(/surgeon|marker|guidance|r89-/i.test(name))return null;
  if(/brain|backing|backdrop|void/i.test(name))return'void';
  if(/roof/i.test(name))return'roof';
  if(/annex-ground|apron|floor|bridge/i.test(name))return'floor';
  if(/wall|maze|door|threshold|fascia|bevel|masonry|hospital-b[23]/i.test(name))return'wall';
  return null;
 }
 function patchScene(r){const T=r.T;
  for(const e of r.floorRows?.values()||[])for(const m of materialsOf(e.material))patch(m,'floor',T);
  for(const e of r.backdropRows?.values()||[])for(const m of materialsOf(e.material))patch(m,'void',T);
  for(const e of r.wallRows?.values()||[])for(const m of materialsOf(e.mesh?.material))patch(m,'wall',T);
  for(const m of r.visualFloorMaterials||[])patch(m,'floor',T);
  for(const m of [r.stoneMaterial,r.bridgeMaterial,r.visualFloorMaterial])patch(m,'floor',T);
  for(const m of [r.wallMaterial,r.hospitalWallMaterial,r.regionalTrimMaterial55,r.wallCapMaterial61,r.perimeterMaterialR83,r.hospitalDoorDetailMaterial37])patch(m,'wall',T);
  for(const m of [r.backgroundMaterial,r.visualWardMaterial,r.voidMaterialR81])patch(m,'void',T);
  patch(r.hospitalRoofMaterialR2,'roof',T);
  for(const o of r.spatialRoot?.children||[]){if(!o.isMesh)continue;const role=roleByName(o.name||'');if(role)for(const m of materialsOf(o.material))patch(m,role,T);}
 }
 function family(frame){const L=frame.exploration,f=L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(frame.zone==='ep1a08'||L?.hospitalCoreB2&&!L?.worldWardR81?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[frame.zone]?.family;return FAMILY[f]?f:'regional';}
 function active(frame){return !!frame&&frame.layer==='STORY'&&solo();}

 // Screen-space light. Rendered in the layer-2 pass after opaque floor/walls
 // and before transparent actors, warnings and effects, so readability stays.
 function lightQuad(r){if(r.r89Light)return r.r89Light;const T=r.T;
  const material=new T.ShaderMaterial({uniforms:{center:{value:new T.Vector2()},radius:{value:new T.Vector2(1,1)},inner:{value:.34},edge:{value:.46},gain:{value:.97},tint:{value:new T.Vector3(.86,.9,1)},warm:{value:new T.Vector3(1,1,1)}},
   vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
   // The carried light is faintly warm at its core (torch against cold tile/stone)
   // and cools toward the edge; multiply-only, so it never brightens the scene.
   fragmentShader:'uniform vec2 center;uniform vec2 radius;uniform float inner;uniform float edge;uniform float gain;uniform vec3 tint;uniform vec3 warm;void main(){vec2 q=(gl_FragCoord.xy-center)/radius;float d=length(q);float t=smoothstep(inner,1.,d);vec3 core=vec3(gain)*mix(warm,vec3(1.),smoothstep(0.,inner*1.6,d));vec3 k=mix(core,vec3(edge)*tint,t);gl_FragColor=vec4(k,1.);}',
   transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.ZeroFactor,blendDst:T.SrcColorFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,toneMapped:false});
  const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);mesh.name='r89-retro-light';mesh.frustumCulled=false;mesh.renderOrder=-1000;mesh.layers.set(2);mesh.userData.presentationOnly=true;
  r.r89Light=mesh;return mesh;
 }
 function lightState(r,frame){const spec=LIGHT[prefs.light];if(!spec||sightOn()||!active(frame))return null;
  const hero=frame.entities?.find(e=>e.hero&&Number.isFinite(e.x+e.y));if(!hero)return null;
  const p=r.projection,s=p.worldToScreen(hero.x,hero.y),zoom=p.zoom||1,w=p.width,h=p.height,rx=Math.max(w*.36,h*.66),ry=rx*.64;
  return{cx:s.x,cy:s.y-(hero.height||66)*zoom*.35,rx,ry,inner:spec.inner,edge:spec.edge,gain:.97};
 }
 const falloff=(L,x,y)=>{const d=Math.hypot((x-L.cx)/L.rx,(y-L.cy)/L.ry),t=smooth(L.inner,1,d);return L.gain*(1-t)+L.edge*t;};

 // Actor footing: the native shadow() is two very light ellipses (alpha .075/.22)
 // that vanish on mid-grey tile, so bodies looked pasted on. Add a tight occlusion
 // core under the feet with the native size, lift and low-FX rules.
 if(typeof shadow==='function'){const base=shadow;
  shadow=function(x,y,radius=18,opt={}){const result=base.apply(this,arguments);
   try{if(!prefs.contact||typeof ctx==='undefined'||!Number.isFinite(x+y))return result;
    const n=(v,d=0)=>Number.isFinite(+v)?+v:d,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),o=opt||{},alpha=cl(n(o.alpha,1),0,1),lift=cl(n(o.lift),0,1),
     compact=!!(typeof settings!=='undefined'&&settings.lowFx)||!!(typeof coarsePointerQueryR63R2!=='undefined'&&coarsePointerQueryR63R2?.matches),
     rx=Math.max(compact?5:6,n(radius,18)*.78*cl(n(o.scale,1),.45,2.4)*(1+lift*.08)),ry=Math.max(2,rx*(compact?.18:.29)*(1-lift*.25)),op=alpha*(compact?.74:1)*(1-lift*.7);
    if(op<=.01)return result;ctx.save();try{ctx.globalAlpha*=op;ctx.fillStyle='rgba(6,8,10,.2)';ctx.beginPath();ctx.ellipse(x,y,rx*.96,ry*1.06,0,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='rgba(4,5,7,.4)';ctx.beginPath();ctx.ellipse(x,y,rx*.56,ry*.6,0,0,Math.PI*2);ctx.fill();stats.footShadows=(stats.footShadows||0)+1;}finally{ctx.restore();}
   }catch(error){stats.errors++;lastError=String(error);}
   return result;};}

 // Contact shadow skirts from the actual rendered wall bases (door cuts included).
 function skirtMaterial(r){if(r.r89SkirtMaterial)return r.r89SkirtMaterial;const T=r.T;
  r.r89SkirtMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});return r.r89SkirtMaterial;}
 function wallSources(r){const out=[],rows=new Set();for(const e of r.wallRows?.values()||[])if(e.mesh)rows.add(e.mesh);
  for(const o of r.spatialRoot?.children||[]){if(!o.isMesh||!o.visible||o.userData?.r89Skirt)continue;const name=o.name||'';
   if(name==='hospital-r5-static-wall-batch'||/^r83-masonry/.test(name)||rows.has(o))out.push(o);}return out;}
 function buildSkirt(r,sources){const T=r.T,pos=[],col=[],idx=[],s=.42,v=new T.Vector3(),n=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let edges=0;
  for(const mesh of sources){mesh.updateMatrixWorld();const g=mesh.geometry,P=g.attributes.position;if(!P)continue;const I=g.index,count=I?I.count:P.count,M=mesh.matrixWorld;
   const at=i=>v.fromBufferAttribute(P,I?I.getX(i):i).applyMatrix4(M).clone();
   for(let t=0;t+2<count;t+=3){a.copy(at(t));b.copy(at(t+1));c.copy(at(t+2));
    n.subVectors(b,a).cross(c.clone().sub(a));const len=n.length();if(len<1e-9)continue;n.divideScalar(len);if(Math.abs(n.y)>.2)continue;
    const pts=[a,b,c],low=pts.filter(p=>p.y<.03);if(low.length!==2)continue;
    const nx=n.x,nz=n.z,hl=Math.hypot(nx,nz);if(hl<1e-6)continue;const ox=nx/hl*s,oz=nz/hl*s,base=pos.length/3;
    for(const p of low)pos.push(p.x,.014,p.z);for(const p of low)pos.push(p.x+ox,.014,p.z+oz);
    col.push(.02,.025,.03,.52,.02,.025,.03,.52,.02,.025,.03,0,.02,.025,.03,0);
    idx.push(base,base+1,base+3,base,base+3,base+2);edges++;
   }}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new T.Float32BufferAttribute(col,4));geometry.setIndex(idx);
  stats.skirtBuilds++;stats.skirtEdges=edges;return geometry;
 }
 function ensureSkirt(r,frame){const want=prefs.contact&&active(frame);
  if(!want){if(r.r89Skirt)r.r89Skirt.visible=false;return;}
  const sources=wallSources(r),sig=sources.map(m=>m.uuid+':'+m.geometry.uuid).join('|');
  if(r.r89Skirt&&r.r89Skirt.parent===r.spatialRoot&&r.r89SkirtSig===sig){r.r89Skirt.visible=true;return;}
  if(r.r89Skirt){r.r89Skirt.parent?.remove(r.r89Skirt);r.r89Skirt.geometry.dispose();r.r89Skirt=null;}
  if(!sources.length)return;
  const mesh=new r.T.Mesh(buildSkirt(r,sources),skirtMaterial(r));mesh.name='r89-wall-contact-skirt';mesh.layers.set(2);mesh.renderOrder=-1100;mesh.frustumCulled=false;mesh.userData={presentationOnly:true,r89Skirt:true,collisionChanged:false};
  r.spatialRoot.add(mesh);r.r89Skirt=mesh;r.r89SkirtSig=sig;
 }

 // Door apertures: the native leaves/jambs are flat planes on the wall face, so
 // the opening had no depth and met the floor with no sill. Add jamb reveals
 // through the wall thickness, a worn metal threshold and a floor contact strip.
 // Presentation only: native door state, collision and interaction are untouched.
 function doorList(frame){const L=frame.exploration;return (L?.hospitalDoorsB3||L?.worldR74?.doors||[]).filter(d=>Number.isFinite(d?.x+d?.y+d?.width+d?.depth));}
 function doorMaterials(r){if(r.r89DoorMaterials)return r.r89DoorMaterials;const T=r.T;
  r.r89DoorMaterials={frame:new T.MeshBasicMaterial({color:0x737c79,toneMapped:false}),sill:new T.MeshBasicMaterial({color:0x545b5a,toneMapped:false}),shade:new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2})};
  return r.r89DoorMaterials;}
 function buildDoors(r,doors){const T=r.T,group=new T.Group();group.name='r89-door-apertures';group.userData={presentationOnly:true,r89Doors:true,collisionChanged:false};const m=doorMaterials(r),boxes=[],sills=[],shade={pos:[],col:[],idx:[]};
  const H=2.7,REVEAL=.07,SILL=.035;
  for(const d of doors){const alongX=d.axis!=='x',w=alongX?d.width:d.depth,t=alongX?d.depth:d.width,place=(u,v)=>alongX?[d.x+u,d.y+v]:[d.x+v,d.y+u];
   for(const s of[-1,1]){const g=new T.BoxGeometry(alongX?REVEAL:t+.05,H,alongX?t+.05:REVEAL);const[x,z]=place(s*(w/2-REVEAL/2),0);g.translate(x,H/2,z);boxes.push(g);}
   const sg=new T.BoxGeometry(alongX?w:t+.44,SILL,alongX?t+.44:w);const[sx,sz]=place(0,0);sg.translate(sx,SILL/2,sz);sills.push(sg);
   for(const s of[-1,1]){const base=shade.pos.length/3,inner=t/2+.22,outer=inner+.38;for(const[u,v]of[[-w/2,s*inner],[w/2,s*inner],[w/2,s*outer],[-w/2,s*outer]]){const[x,z]=place(u,v);shade.pos.push(x,.016,z);}
    shade.col.push(.02,.025,.03,.42,.02,.025,.03,.42,.02,.025,.03,0,.02,.025,.03,0);shade.idx.push(base,base+1,base+2,base,base+2,base+3);}
  }
  const merge=list=>{if(!list.length)return null;const flat=list.map(g=>{const gi=g.toNonIndexed();g.dispose();return gi;});let n=0;for(const g of flat)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;for(const g of flat){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;g.dispose();}const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(P,3));out.setAttribute('normal',new T.BufferAttribute(N,3));return out;};
  const add=(g,mat,name,order=0)=>{if(!g)return;const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.layers.set(2);mesh.renderOrder=order;mesh.userData.presentationOnly=true;group.add(mesh);};
  add(merge(boxes),m.frame,'r89-door-jamb-reveals');add(merge(sills),m.sill,'r89-door-thresholds');
  if(shade.pos.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(shade.pos,3));g.setAttribute('color',new T.Float32BufferAttribute(shade.col,4));g.setIndex(shade.idx);add(g,m.shade,'r89-door-contact',-1100);}
  return group;}
 function ensureDoors(r,frame){const want=prefs.contact&&active(frame),doors=want?doorList(frame):[],sig=doors.map(d=>[d.id,d.x,d.y,d.width,d.depth,d.axis].join(':')).join('|');
  if(r.r89Doors&&(r.r89DoorsSig!==sig||r.r89Doors.parent!==r.spatialRoot)){r.r89Doors.parent?.remove(r.r89Doors);r.r89Doors.traverse(o=>o.geometry?.dispose());r.r89Doors=null;}
  if(!want||!doors.length||r.r89Doors)return;
  const T=r.T;patch(doorMaterials(r).frame,'wall',T);patch(doorMaterials(r).sill,'wall',T);
  r.r89Doors=buildDoors(r,doors);r.r89DoorsSig=sig;r.spatialRoot.add(r.r89Doors);stats.doorBuilds=(stats.doorBuilds||0)+1;stats.doors=doors.length;}

 function focusList(r,frame){const list=[];if(!prefs.dither||!active(frame))return list;
  const p=r.projection,zoom=p.zoom||1,hero=frame.entities?.find(e=>e.hero&&Number.isFinite(e.x+e.y));if(!hero)return list;
  const sight=window.__STORYWORLD_SIGHT24__,actors=[hero,...(frame.entities||[]).filter(e=>e!==hero&&e.alive!==false&&e.enemy&&Number.isFinite(e.x+e.y)&&Math.hypot(e.x-hero.x,e.y-hero.y)<11&&(!sight?.enabled||sight.pointVisible(e.x,e.y))).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))].slice(0,MAX_FOCUS);
  // The hero window also opens the floor around the feet: camera-side boundary
  // walls and the exterior roof otherwise hide ~4 units of walkable floor, which
  // reads as walking on a roof (R93).
  for(const e of actors){const s=p.worldToScreen(e.x,e.y),h=Math.max(30,(e.height||66)*zoom);list.push(e.hero?{x:s.x,y:s.y-h*.25,depth:(e.x+e.y)/2,rx:h*1.8,ry:h*1.4}:{x:s.x,y:s.y-h*.5,depth:(e.x+e.y)/2,rx:h*.42,ry:h*.62});}
  stats.focusMax=Math.max(stats.focusMax,list.length);return list;
 }

 // Native cutaways rebuild wall/roof geometry around actors. While the dither is
 // active they receive no focus, so the static batch is no longer rebuilt.
 const roomsBase=C.ensureHospitalRooms;
 if(roomsBase)C.ensureHospitalRooms=function(frame){if(!(prefs.dither&&active(frame))||!frame)return roomsBase.call(this,frame);
  const saved=frame.hospitalFocus13;frame.hospitalFocus13=[];try{return roomsBase.call(this,frame);}finally{frame.hospitalFocus13=saved;}};
 const roofsBase=C.ensureHospitalRoofsR2;
 if(roofsBase)C.ensureHospitalRoofsR2=function(frame){if(!(prefs.dither&&active(frame))||!Array.isArray(frame?.entities))return roofsBase.call(this,frame);
  const saved=frame.entities,savedFocus=frame.hospitalFocus13;frame.entities=saved.filter(e=>!e.hero);frame.hospitalFocus13=[];
  try{return roofsBase.call(this,frame);}finally{frame.entities=saved;frame.hospitalFocus13=savedFocus;}};

 function wrapGL(r){const gl=r.renderer;if(!gl||gl.r89Wrapped)return;const base=gl.render;
  gl.render=function(scene,camera){
   const plan=r.r89Plan;
   if(!plan||scene!==r.scene||camera!==r.camera||camera.layers.mask!==4)return base.call(this,scene,camera);
   const restore=[];
   try{
    const scale=r.renderer.domElement.width/Math.max(1,r.projection.width),bufH=r.renderer.domElement.height;
    U.r89Dither.value=plan.focus.length?1:0;U.r89FocusCount.value=plan.focus.length;
    plan.focus.forEach((f,i)=>{U.r89Focus.value[i].set(f.x*scale,bufH-f.y*scale,f.depth,0);U.r89FocusR.value[i].set(f.rx*scale,f.ry*scale);});
    // Whole-wall fades (R54) are replaced by the dither while it is on. The
    // native state is restored after this pass so turning the option off is exact.
    if(plan.focus.length)for(const e of r.wallRows?.values()||[]){const st=e.mesh?.userData?.occlusion54;if(!st)continue;st.materials.forEach((m,i)=>{
     const o=m.opacity,dw=m.depthWrite,tr=m.transparent;restore.push(()=>{m.opacity=o;m.depthWrite=dw;m.transparent=tr;});
     if(o!==st.baseOpacity[i])stats.fadesSuppressed++;m.opacity=st.baseOpacity[i];m.depthWrite=st.baseDepth[i];if(st.baseOpacity[i]>=1)m.transparent=false;});}
    const light=lightQuad(r);if(light.parent!==r.scene)r.scene.add(light);light.visible=!!plan.light;
    if(plan.light){const L=plan.light,u=light.material.uniforms;u.center.value.set(L.cx*scale,bufH-L.cy*scale);u.radius.value.set(L.rx*scale,L.ry*scale);u.inner.value=L.inner;u.edge.value=L.edge;u.gain.value=L.gain;u.warm.value.set(...(WARM[plan.family]||WARM.regional));stats.litFrames++;
     for(const row of r.commands?.rows?.values()||[]){const o=row.geometryState?.owner,m=row.mesh?.material;if(!o||!m?.color||!row.mesh.visible||!(row.mesh.layers.mask&4))continue;
      const k=o.kind==='prop'?1:o.kind==='enemy'?.38:0;if(!k||!Number.isFinite(o.x+o.y))continue;const s=r.projection.worldToScreen(o.x,o.y),f=1-(1-falloff(L,s.x,s.y))*k;if(f>.995)continue;
      const rr=m.color.r,gg=m.color.g,bb=m.color.b;restore.push(()=>m.color.setRGB(rr,gg,bb));m.color.multiplyScalar(f);stats.propsDimmed++;}}
   }catch(error){stats.errors++;lastError=String(error);}
   try{return base.call(this,scene,camera);}finally{for(let i=restore.length-1;i>=0;i--)restore[i]();}
  };
  gl.r89Wrapped=true;
 }
 const renderBase=C.render;
 C.render=function(frame){
  let plan=null;
  try{if(active(frame)&&this.spatialRoot&&this.renderer){wrapGL(this);const T=this.T,u=uniforms(T),fam=FAMILY[family(frame)];
   u.r89Grade.value=prefs.grade?1:0;u.r89Sat.value=fam.sat;u.r89Gain.value=fam.gain;u.r89Tint.value.set(...fam.tint);
   plan={family:family(frame),focus:[],light:null};}}catch(error){stats.errors++;lastError=String(error);}
  this.r89Plan=null;
  if(plan){// projection is configured inside the base render, so the light and
   // focus positions are resolved from it lazily at the first layer-2 pass.
   const self=this,frameRef=frame;let resolved=false;
   this.r89Plan={get focus(){resolve();return plan.focus;},get light(){resolve();return plan.light;}};
   function resolve(){if(resolved)return;resolved=true;try{plan.focus=focusList(self,frameRef);plan.light=lightState(self,frameRef);patchScene(self);ensureSkirt(self,frameRef);ensureDoors(self,frameRef);}catch(error){stats.errors++;lastError=String(error);}}
  }else if(this.r89Light)this.r89Light.visible=false;
  stats.frames++;
  try{return renderBase.call(this,frame);}finally{this.r89Plan=null;}
 };
 const clearBase=C.clearScene;
 C.clearScene=function(...args){if(this.r89Skirt){this.r89Skirt.parent?.remove(this.r89Skirt);this.r89Skirt.geometry.dispose();}this.r89Skirt=null;this.r89SkirtSig=null;this.r89Doors=null;this.r89DoorsSig=null;return clearBase.apply(this,args);};
 const disposeBase=C.dispose;
 if(disposeBase)C.dispose=function(...args){try{this.r89Light?.geometry.dispose();this.r89Light?.material.dispose();this.r89SkirtMaterial?.dispose();for(const m of Object.values(this.r89DoorMaterials||{}))m.dispose();}catch(_){}this.r89Light=this.r89SkirtMaterial=this.r89DoorMaterials=null;return disposeBase.apply(this,args);};

 // Texture churn: CommandScene.release() disposed a GPU texture the moment its
 // last command row went away, and the same atlas (bleed 1024², medical impacts
 // 1254², syringe 1280², tinted enemy canvases) was re-created and re-uploaded
 // moments later. In a hospital rally that was 446 creations / 429 disposals and
 // up to 1.5 s main-thread stalls. Idle textures now stay resident in an LRU
 // (20 s, 64 entries, 192 MB; 64 MB with low FX). Scene clear still disposes all.
 const CS=A.CommandScene?.prototype,texBase=CS?.texture,relBase=CS?.release;
 const texStats={reused:0,retained:0,evicted:0,expired:0,idleBytes:0,idleCount:0};let texCacheOn=true;
 if(texBase&&relBase){
  const idleOf=s=>s.r89Idle||(s.r89Idle=new Map());
  const bytesOf=image=>{const w=image?.naturalWidth||image?.width||0,h=image?.naturalHeight||image?.height||0;return w*h*4*1.34;};
  // Idle entries live outside s.textures (whose size the native contracts read
  // as "live leases"); a later texture() call for the same image restores them.
  function evict(s,image,why){const idle=idleOf(s),meta=idle.get(image);if(!meta)return;idle.delete(image);meta.texture.dispose();s.stats.texturesDisposed++;texStats[why]++;}
  // An image its owner already released (FINAL42 budget clears src) must not keep a GPU copy.
  const released=image=>{try{if(typeof HTMLImageElement==='undefined'||!(image instanceof HTMLImageElement))return false;return typeof image.getAttribute==='function'?!image.getAttribute('src'):image.src==='';}catch(_){return false;}};
  function sweep(s,force=false){const now=performance.now();if(!force&&now-(s.r89SweepAt||0)<1000)return;s.r89SweepAt=now;const idle=idleOf(s),low=typeof settings!=='undefined'&&settings.lowFx,capBytes=(low?64:192)*1048576,capCount=low?24:64;
   for(const[image,meta]of[...idle])if(now-meta.at>20000||released(image))evict(s,image,'expired');
   let bytes=0;for(const m of idle.values())bytes+=m.bytes;
   for(const[image,meta]of[...idle]){if(idle.size<=capCount&&bytes<=capBytes)break;bytes-=meta.bytes;evict(s,image,'evicted');}
   texStats.idleBytes=Math.round(bytes);texStats.idleCount=idle.size;}
  CS.texture=function(image,mutable){const idle=idleOf(this),meta=idle.get(image);if(meta&&!this.textures.has(image)){idle.delete(image);this.textures.set(image,{texture:meta.texture,refs:0});texStats.reused++;}const t=texBase.call(this,image,mutable);sweep(this);return t;};
  CS.release=function(image){const r=this.textures.get(image);if(!r)return;if(!texCacheOn||r.refs!==1||released(image))return relBase.call(this,image);
   r.refs=0;this.textures.delete(image);idleOf(this).set(image,{texture:r.texture,at:performance.now(),bytes:bytesOf(image)});texStats.retained++;sweep(this);};
  // clear() removes every row through release(); dispose what that parked as idle.
  const clearCS=CS.clear;if(clearCS)CS.clear=function(...args){const result=clearCS.apply(this,args);for(const image of[...idleOf(this).keys()])evict(this,image,'expired');texStats.idleBytes=0;texStats.idleCount=0;return result;};
 }

 // HUD hint: the shipped text promised WASD/J/2/3 while the native handler binds
 // arrows, A/J/1, S/2, D/3 (see index keydown and hospital-pc-test.js J alias).
 const HINT='방향키 이동 · A/J/1 공격 · S/2 블링크 · D/3 공명 · Q/4 고유기 · F/5 EGO · E 상호작용';
 if(typeof setHudTextR63R2==='function'){const hudBase=setHudTextR63R2;setHudTextR63R2=function(id,text,...rest){if(id==='hint'&&typeof text==='string'&&text.startsWith('WASD/')){text=HINT;stats.hintFixes++;}return hudBase.call(this,id,text,...rest);};}
 // Skill bar keycaps showed only "2"/"3" for blink/guard although S and D are bound.
 const caps=[['blinkBtn','2','S / 2',null],['guardBtn','3','D / 3',null]];
 function keycaps(){for(const row of caps){if(!row[3]?.isConnected)row[3]=document.querySelector('#'+row[0]+' kbd');const k=row[3];if(k&&k.textContent.trim()===row[1]){k.textContent=row[2];stats.hintFixes++;}}}
 keycaps();if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...args){const result=base.apply(this,args);keycaps();return result;};}

 function settingsSection(){const panel=document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('retroSettingsR89'))return;
  const s=document.createElement('section');s.id='retroSettingsR89';
  s.innerHTML='<h3>레트로 화면 (R89)</h3><p class="small muted">화면 표현만 바꿉니다. 충돌·피해·저장은 바뀌지 않으며 이 설정은 저장 슬롯 밖에 따로 보관됩니다.</p>'+
   '<label>주변 조명 <select id="r89Light"><option value="normal">기본</option><option value="soft">약하게</option><option value="off">끔</option></select></label> '+
   '<label><input type="checkbox" id="r89Grade"> 지역 색감·벽면 명암</label> <label><input type="checkbox" id="r89Dither"> 가린 벽 격자 투시</label> <label><input type="checkbox" id="r89Contact"> 벽 밑 그림자·문틀 두께·문턱</label>'+
   '<p class="small muted">손전등 시야(전체 시야 끔)를 켜면 주변 조명은 자동으로 꺼집니다.</p>';
  panel.appendChild(s);
  const light=s.querySelector('#r89Light');light.value=prefs.light;light.onchange=()=>{prefs.light=LIGHT.hasOwnProperty(light.value)?light.value:'normal';save();};
  for(const[id,key]of[['r89Grade','grade'],['r89Dither','dither'],['r89Contact','contact']]){const el=s.querySelector('#'+id);el.checked=!!prefs[key];el.onchange=()=>{prefs[key]=el.checked;save();};}
 }
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{settingsSection();}catch(error){stats.errors++;lastError=String(error);}return result;};}

 window.__STORYWORLD_WORLD_RETRO_R89__=Object.freeze({
  prefs:()=>({...prefs}),set(patch={}){for(const k of Object.keys(DEFAULTS))if(Object.prototype.hasOwnProperty.call(patch,k))prefs[k]=patch[k];if(!LIGHT.hasOwnProperty(prefs.light))prefs.light=DEFAULTS.light;save();return{...prefs};},
  storageKey:STORE_KEY,falloff,
  // QA switch for A/B measurement of the idle texture cache (not persisted).
  textureCache(on){texCacheOn=!!on;return texCacheOn;},
  inspect:()=>({revision:'R89-world-retro',prefs:{...prefs},stats:{...stats},textureCache:{...texStats},lastError,savesTouched:false,collisionChanged:false,damageChanged:false,nativeCutawaysWhileDither:'suppressed (focus withheld from wall/roof batches)'})
 });
})();
