/* R90 spatial presentation. Uses only the current native frame and rendered
 * wall meshes. No simulation, layout, collision, clocks or save data is written. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!C||window.__STORYWORLD_SPATIAL_R90__)return;
 const prefs=()=>window.__STORYWORLD_VISUAL_R90__?.prefs()||{},MAX_LIGHTS=8,MAX_PARTICLES=72;
 const stats={frames:0,lightSources:0,wallBuilds:0,rimSegments:0,cornerPosts:0,atmosphereBuilds:0,errors:0};let lastError=null;
 const active=f=>f?.layer==='STORY'&&(!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off');
 const sight=()=>window.__STORYWORLD_SIGHT24__?.enabled===true;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 function family(f){const L=f.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(f.zone==='ep1a08'?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[f.zone]?.family||'regional';}
 function lightSources(frame){
  const found=new Map(),hero=frame.entities?.find(e=>e.hero),add=(p,path='')=>{
   if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
   const label=[p.kind,p.type,p.id,p.path,p.bodyPath,path].join(' ');
   if(!/portal|lamp|candle|torch|brazier|altar|shrine/i.test(label)||/extinguished/i.test(label))return;
   const key=p.x.toFixed(3)+':'+p.y.toFixed(3);if(found.has(key))return;
   found.set(key,{x:p.x,y:p.y,key,portal:/portal/i.test(label),phase:(hash(key)%6283)/1000,color:Array.isArray(p.color)?p.color:null});
  };
  for(const p of frame.props||[])add(p);
  for(const c of frame.commands||[]){const o=c.owner;if(o?.kind==='prop'||o?.kind==='portal'||/portal/i.test(o?.id||''))add(o,c.sourcePath||c.image?.src||c.image?.currentSrc||'');}
  // R91 lit wall decor and R92 standing light props feed the same light pool;
  // R92 props may carry their own colour (blue crystal, violet dream, green cauldron).
  for(const p of window.__STORYWORLD_VISUAL_R91__?.lightPoints?.()||[])add({x:p.x,y:p.y,kind:'lamp',id:p.id});
  for(const p of window.__STORYWORLD_VISUAL_R92__?.lightPoints?.()||[])add({x:p.x,y:p.y,kind:'lamp',id:p.id,color:p.color});
  return [...found.values()].sort((a,b)=>(hero?Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y):0)||a.key.localeCompare(b.key)).slice(0,MAX_LIGHTS);
 }
 const LIGHT_TOKEN='gl_FragColor=vec4(k,1.);';
 const LIGHT_HEAD='uniform int r90LocalCount;uniform vec4 r90Local[8];uniform vec3 r90LocalColor[8];\n';
 // Lift darkness to the lamp level (max), then tint the pool warm (multiply) so
 // a lamp still reads inside the carried light, where max() alone changes nothing.
 const LIGHT_BODY='vec3 w90=vec3(1.);for(int i=0;i<8;i++){if(i>=r90LocalCount)break;float d90=length((gl_FragCoord.xy-r90Local[i].xy)/r90Local[i].zw);vec3 c90=r90LocalColor[i];vec3 l90=mix(c90,vec3(edge)*tint,smoothstep(.12,1.,d90));k=max(k,l90);'+
  'float f90=1.-smoothstep(0.,.85,d90);w90=min(w90,mix(vec3(1.),c90/max(max(c90.r,c90.g),max(c90.b,.001)),f90*.6));}k*=w90;'+LIGHT_TOKEN;
 function restoreLight(r){const s=r.r90LightPatch;if(!s)return;const m=s.material;m.fragmentShader=s.fragmentShader;for(const key of ['r90LocalCount','r90Local','r90LocalColor'])delete m.uniforms[key];m.needsUpdate=true;r.r90LightPatch=null;}
 function updateLights(r,frame,restore){
  const m=r.r89Light?.material,L=r.r89Plan?.light,want=active(frame)&&prefs().localLights&&!sight()&&L&&m;
  if(!want){restoreLight(r);stats.lightSources=0;return;}
  if(r.r90LightPatch?.material!==m){restoreLight(r);if(m.fragmentShader.split(LIGHT_TOKEN).length!==2)throw Error('R90 expected one native R89 light output');
   r.r90LightPatch={material:m,fragmentShader:m.fragmentShader};
   m.fragmentShader=LIGHT_HEAD+m.fragmentShader.replace(LIGHT_TOKEN,LIGHT_BODY);
   m.uniforms.r90LocalCount={value:0};m.uniforms.r90Local={value:Array.from({length:8},()=>new r.T.Vector4())};m.uniforms.r90LocalColor={value:Array.from({length:8},()=>new r.T.Vector3())};m.needsUpdate=true;
  }
  const sources=lightSources(frame),scale=r.renderer.domElement.width/Math.max(1,r.projection.width),height=r.renderer.domElement.height,zoom=r.projection.zoom||1,lights=[];
  sources.forEach((p,i)=>{const s=r.projection.worldToScreen(p.x,p.y),radius=clamp(240*zoom,140,380),flicker=frame.settings?.reducedMotion?0:(Math.sin((frame.time||0)*2.1+p.phase)*.012+Math.sin((frame.time||0)*7.3+p.phase*3)*.008),gain=.95+flicker;
   m.uniforms.r90Local.value[i].set(s.x*scale,(height-s.y*scale),radius*scale,radius*.63*scale);
   if(p.color)m.uniforms.r90LocalColor.value[i].set(gain*p.color[0],gain*p.color[1],gain*p.color[2]);
   else m.uniforms.r90LocalColor.value[i].set(gain,gain*(p.portal?.97:.86),gain*(p.portal?1:.7));lights.push({x:s.x,y:s.y,rx:radius,ry:radius*.63,gain});
  });m.uniforms.r90LocalCount.value=sources.length;stats.lightSources=sources.length;
  // R89 has already multiplied prop colours by carried-light falloff. Restore
  // only the extra darkness relieved by a local light, during this pass only.
  for(const row of r.commands?.rows?.values()||[]){const o=row.geometryState?.owner,mesh=row.mesh,mat=mesh?.material;
   if(o?.kind!=='prop'||!mat?.color||!mesh.visible||!(mesh.layers.mask&4)||!Number.isFinite(o.x+o.y))continue;
   const p=r.projection.worldToScreen(o.x,o.y),base=window.__STORYWORLD_WORLD_RETRO_R89__.falloff(L,p.x,p.y);let value=base;
   for(const l of lights)value=Math.max(value,l.gain+(L.edge-l.gain)*smooth(.12,1,Math.hypot((p.x-l.x)/l.rx,(p.y-l.y)/l.ry)));
   if(value<=base)continue;const saved=mat.color.clone();restore.push(()=>mat.color.copy(saved));mat.color.multiplyScalar(value/Math.max(.001,base));
  }
 }
 function wallSources(r){const rows=new Set([...r.wallRows?.values()||[]].map(e=>e.mesh));return(r.spatialRoot?.children||[]).filter(o=>o.isMesh&&o.visible&&!o.userData?.r90Spatial&&(rows.has(o)||o.name==='hospital-r5-static-wall-batch'||/^r83-masonry/.test(o.name||'')));}
 const pointKey=p=>[p.x,p.y,p.z].map(n=>Math.round(n*10000)).join(':');
 const cross=(ax,az,bx,bz)=>ax*bz-az*bx;
 // Remove tessellation edges and split at overlapping wall intersections. Test
 // both sides against the union of actual top triangles, not collision boxes.
 function outline(r,sources){
  const T=r.T,tris=[],edges=new Map(),v=new T.Vector3();
  for(const mesh of sources){mesh.updateMatrixWorld(true);const g=mesh.geometry,P=g.attributes.position,I=g.index;if(!P)continue;
   const at=i=>v.fromBufferAttribute(P,I?I.getX(i):i).applyMatrix4(mesh.matrixWorld).clone();
   for(let i=0,n=I?I.count:P.count;i+2<n;i+=3){const a=at(i),b=at(i+1),c=at(i+2),normal=b.clone().sub(a).cross(c.clone().sub(a));
    if(normal.lengthSq()<1e-12||normal.normalize().y<.98||Math.min(a.y,b.y,c.y)<.2)continue;
    // Hospital caps share a floor material; use the same source wall's side
    // material so the trim inherits wall dither, not the floor-only grade.
    const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
    const tri={a,b,c,y:(a.y+b.y+c.y)/3,minX:Math.min(a.x,b.x,c.x),maxX:Math.max(a.x,b.x,c.x),minZ:Math.min(a.z,b.z,c.z),maxZ:Math.max(a.z,b.z,c.z),material};tris.push(tri);
    for(const[p,q]of[[a,b],[b,c],[c,a]]){const ka=pointKey(p),kb=pointKey(q),key=ka<kb?ka+'|'+kb:kb+'|'+ka,old=edges.get(key);if(old)old.count++;else edges.set(key,{a:p,b:q,count:1,material});}
   }
  }
  const inside=(x,z,y)=>tris.some(t=>Math.abs(t.y-y)<.02&&x>=t.minX-1e-7&&x<=t.maxX+1e-7&&z>=t.minZ-1e-7&&z<=t.maxZ+1e-7&&(()=>{const v1=cross(t.b.x-t.a.x,t.b.z-t.a.z,x-t.a.x,z-t.a.z),v2=cross(t.c.x-t.b.x,t.c.z-t.b.z,x-t.b.x,z-t.b.z),v3=cross(t.a.x-t.c.x,t.a.z-t.c.z,x-t.c.x,z-t.c.z);return(v1>=-1e-7&&v2>=-1e-7&&v3>=-1e-7)||(v1<=1e-7&&v2<=1e-7&&v3<=1e-7);})());
  const raw=[...edges.values()].filter(e=>e.count===1),out=new Map(),corners=new Map();
  for(const e of raw){const dx=e.b.x-e.a.x,dz=e.b.z-e.a.z,len=Math.hypot(dx,dz);if(len<.02)continue;const cuts=[0,1];
   for(const f of raw){if(f===e||Math.abs(f.a.y-e.a.y)>.02)continue;const ex=f.b.x-f.a.x,ez=f.b.z-f.a.z,qx=f.a.x-e.a.x,qz=f.a.z-e.a.z,den=cross(dx,dz,ex,ez);
    if(Math.abs(den)>1e-7){const t=cross(qx,qz,ex,ez)/den,u=cross(qx,qz,dx,dz)/den;if(t>1e-5&&t<1-1e-5&&u>=-1e-5&&u<=1+1e-5)cuts.push(t);}
    else if(Math.abs(cross(qx,qz,dx,dz))<1e-5){for(const p of[f.a,f.b]){const t=((p.x-e.a.x)*dx+(p.z-e.a.z)*dz)/(len*len);if(t>1e-5&&t<1-1e-5)cuts.push(t);}}
   }
   cuts.sort((a,b)=>a-b);for(let i=0;i<cuts.length-1;i++){const lo=cuts[i],hi=cuts[i+1];if((hi-lo)*len<.02)continue;
    const mid=(lo+hi)/2,x=e.a.x+dx*mid,z=e.a.z+dz*mid,ox=-dz/len*.006,oz=dx/len*.006;
    if(inside(x+ox,z+oz,e.a.y)===inside(x-ox,z-oz,e.a.y))continue;
    const a=e.a.clone().lerp(e.b,lo),b=e.a.clone().lerp(e.b,hi),ka=pointKey(a),kb=pointKey(b),key=ka<kb?ka+'|'+kb:kb+'|'+ka;
    if(out.has(key))continue;out.set(key,{a,b,material:e.material});corners.set(ka,{p:a,material:e.material});corners.set(kb,{p:b,material:e.material});
   }
  }
  const posts=[...corners.values()].filter(({p})=>{let occupied=0;for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;occupied+=inside(p.x+Math.cos(a)*.025,p.z+Math.sin(a)*.025,p.y)?1:0;}return occupied>0&&occupied<4;});
  return{edges:[...out.values()],posts,topTriangles:tris.length};
 }
 function merged(T,list){const pos=[],normal=[],uv=[];for(const box of list){const flat=box.index?box.toNonIndexed():box;pos.push(...flat.attributes.position.array);normal.push(...flat.attributes.normal.array);uv.push(...flat.attributes.uv.array);if(flat!==box)flat.dispose();box.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
 function trimMaterial(source,T){const m=source?.clone?source.clone():new T.MeshBasicMaterial();
  // Three Material.clone deliberately omits these callbacks; retain their exact
  // chain and markers, including R89 dither and sight24. Borrow no texture lease.
  if(source){m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;}
  for(const key of Object.keys(m))if(/Map$/.test(key)||key==='map')if(m[key]?.isTexture)m[key]=null;
  // A worn dark stone lip a step lighter than the cap, not a bright outline.
  m.color?.set(0x4c463d);m.emissive?.set(0x0c0b09);m.roughness=1;m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true;return m;
 }
 function disposeGroup(group,keep){if(!group)return;group.parent?.remove(group);const materials=new Set();group.traverse(o=>{o.geometry?.dispose();for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});for(const m of materials)if(!keep?.has(m))m.dispose();}
 // R141: 벽 테두리는 덩어리(벽 메시)가 들고 날 때마다 다시 만드는데(헤드리스 전투 15초에 15번), 그때마다 재질을 새로 복제·폐기해
 //  셰이더 프로그램이 다시 컴파일되었다(같은 시간 23번 — 실제 GPU 에서 끊김). 원본 재질마다 테두리 재질 하나를 두고 다시 쓴다.
 const trimCache=new WeakMap();
 function trimMaterialFor(r,source,T){if(!source)return trimMaterial(source,T);let m=trimCache.get(source);if(!m){m=trimMaterial(source,T);trimCache.set(source,m);(r.r90TrimMats||(r.r90TrimMats=new Set())).add(m);stats.trimMaterials=(stats.trimMaterials||0)+1;}return m;}
 function ensureWalls(r,frame){const want=active(frame)&&prefs().walls;if(!want){if(r.r90WallTrim)r.r90WallTrim.visible=false;return;}
  const sources=wallSources(r);
  // R141: 벽 목록이 지난 장면과 같은 물체들이면 9장면은 서명(모든 벽의 행렬을 이어 붙인 긴 문자열)과 행렬 갱신을 건너뛴다(장면당 약 8%).
  const prev=r.r90WallList;if(r.r90WallTrim?.parent===r.spatialRoot&&prev&&prev.length===sources.length&&sources.every((m,i)=>m===prev[i])&&((r.r90WallSkip=(r.r90WallSkip||0)+1)%10)){r.r90WallTrim.visible=true;for(const mesh of r.r90WallTrim.children){const so=mesh.userData.r90SourceMaterial;if(so){mesh.material.opacity=so.opacity;mesh.material.transparent=so.transparent;mesh.material.depthWrite=so.depthWrite;}}stats.wallSkips=(stats.wallSkips||0)+1;return;}
  r.r90WallList=sources.slice();for(const m of sources)m.updateMatrixWorld(true);
  const signature=sources.map(m=>[m.uuid,m.geometry.uuid,m.geometry.attributes.position?.version,...(Array.isArray(m.material)?m.material:[m.material]).map(v=>v?.uuid),...m.matrixWorld.elements].join(':')).join('|');
  const syncFade=group=>{for(const mesh of group.children){const source=mesh.userData.r90SourceMaterial;if(!source)continue;mesh.material.opacity=source.opacity;mesh.material.transparent=source.transparent;mesh.material.depthWrite=source.depthWrite;}};
  if(r.r90WallTrim?.parent===r.spatialRoot&&signature===r.r90WallSignature){r.r90WallTrim.visible=true;syncFade(r.r90WallTrim);return;}
  disposeGroup(r.r90WallTrim,r.r90TrimMats);r.r90WallTrim=null;r.r90WallSignature=signature;if(!sources.length)return;
  const data=outline(r,sources),T=r.T,group=new T.Group(),byMaterial=new Map();group.name='r90-cap-trim';group.userData.r90Spatial=true;
  const add=(source,g)=>{if(!byMaterial.has(source))byMaterial.set(source,[]);byMaterial.get(source).push(g);};
  // Low lip only; the raised corner posts read as toy blocks and are left out.
  for(const e of data.edges){const dx=e.b.x-e.a.x,dz=e.b.z-e.a.z,g=new T.BoxGeometry(Math.hypot(dx,dz),.022,.04);g.rotateY(-Math.atan2(dz,dx));g.translate((e.a.x+e.b.x)/2,e.a.y+.011,(e.a.z+e.b.z)/2);add(e.material,g);}
  for(const[source,boxes]of byMaterial){const mesh=new T.Mesh(merged(T,boxes),trimMaterialFor(r,source,T));mesh.name='r90-cap-rims-and-posts';mesh.layers.set(2);mesh.userData={r90Spatial:true,presentationOnly:true,r90SourceMaterial:source};group.add(mesh);}
  group.userData.counts={edges:data.edges.length,posts:data.posts.length,topTriangles:data.topTriangles};syncFade(group);r.spatialRoot.add(group);r.r90WallTrim=group;stats.wallBuilds++;stats.rimSegments=data.edges.length;stats.cornerPosts=0;
 }
 function atmosphere(r,frame){const fam=family(frame),want=active(frame)&&prefs().atmosphere&&!sight()&&!frame.settings?.lowFx&&!frame.settings?.reducedMotion&&['clinical','swamp','ash','forge'].includes(fam);
  if(!want){if(r.r90Atmosphere)r.r90Atmosphere.visible=false;return;}
  if(r.r90Atmosphere?.userData.zone!==frame.zone){disposeGroup(r.r90Atmosphere);r.r90Atmosphere=null;}
  const hero=frame.entities?.find(e=>e.hero);if(!hero)return;const T=r.T;
  if(!r.r90Atmosphere){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(MAX_PARTICLES*3),3));
   const m=new T.ShaderMaterial({uniforms:{size90:{value:2},color90:{value:new T.Vector3()},opacity90:{value:.12}},vertexShader:'uniform float size90;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size90;}',fragmentShader:'uniform vec3 color90;uniform float opacity90;void main(){float d=length(gl_PointCoord-vec2(.5))*2.;float a=(1.-smoothstep(.12,1.,d))*opacity90;if(a<.001)discard;gl_FragColor=vec4(color90,a);}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
   const mesh=new T.Points(g,m);mesh.name='r90-regional-air';mesh.layers.set(2);mesh.renderOrder=-900;mesh.frustumCulled=false;mesh.userData={zone:frame.zone,r90Spatial:true,presentationOnly:true};r.spatialRoot.add(mesh);r.r90Atmosphere=mesh;stats.atmosphereBuilds++;
  }
  const mesh=r.r90Atmosphere,P=mesh.geometry.attributes.position,phase=(hash(frame.zone)%10000)/1000,clock=Number(frame.time)||0,swamp=fam==='swamp',ash=fam==='ash'||fam==='forge',scale=r.renderer.domElement.width/Math.max(1,r.projection.width);
  // Fixed deterministic field around the viewer, clipped by the native floor
  // query. Positions are presentation buffers only; no game RNG is consumed.
  for(let i=0;i<MAX_PARTICLES;i++){const h=hash(frame.zone+':'+i),a=(h&65535)/65536,b=(h>>>16)/65536,x=hero.x+(a*26+clock*(swamp?.04:.09))%26-13,z=hero.y+(b*26+clock*(ash?.14:.025))%26-13;
   const blocked=A.explorationBlocked?.(frame.exploration,x,z,.04);P.setXYZ(i,x,blocked?-100:swamp?.12:.2+((a*3+clock*(ash?.12:.035)+phase)%1.3),z);
  }
  P.needsUpdate=true;const u=mesh.material.uniforms;u.size90.value=(swamp?95:ash?3.2:2.6)*(r.projection.zoom||1)*scale;u.opacity90.value=swamp?.085:ash?.2:.22;u.color90.value.set(...(swamp?[.48,.57,.46]:ash?[.58,.52,.45]:[.66,.7,.65]));mesh.visible=true;
 }
 function clear(r){disposeGroup(r.r90WallTrim);disposeGroup(r.r90Atmosphere);r.r90WallTrim=r.r90Atmosphere=null;r.r90WallSignature=null;restoreLight(r);}
 function wrapGL(r){if(!r.renderer||r.r90GL)return;const base=r.renderer.render;r.r90GL=true;
  r.renderer.render=function(scene,camera){if(scene!==r.scene||camera!==r.camera||camera.layers.mask!==4||!r.r90Frame)return base.apply(this,arguments);
   const restore=[];try{updateLights(r,r.r90Frame,restore);ensureWalls(r,r.r90Frame);atmosphere(r,r.r90Frame);}catch(error){stats.errors++;lastError=String(error);}
   try{return base.apply(this,arguments);}finally{for(let i=restore.length-1;i>=0;i--)restore[i]();}
  };
 }
 const render=C.render;C.render=function(frame){wrapGL(this);this.r90Frame=frame;stats.frames++;try{return render.apply(this,arguments);}finally{this.r90Frame=null;}};
 const clearScene=C.clearScene;if(clearScene)C.clearScene=function(...args){clear(this);return clearScene.apply(this,args);};
 const dispose=C.dispose;if(dispose)C.dispose=function(...args){clear(this);return dispose.apply(this,args);};
 window.__STORYWORLD_SPATIAL_R90__=Object.freeze({inspect:()=>({stats:{...stats},lastError,presentationOnly:true,newTextures:0}),lightSources,wallSources,outline});
})();
