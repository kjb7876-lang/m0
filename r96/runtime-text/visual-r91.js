/* R91 wall decorations. Presentation only: processed copies of the R91
 * generated wall-decor sheets (assets/r91/walldecor) are mounted on the
 * rendered wall faces. Layout, collision, doors, props, saves and clocks are
 * read only. Canonical source; copied into site by scripts/apply-r91.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!C||window.__STORYWORLD_VISUAL_R91__)return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r91.presentation';
 const DEFAULTS=Object.freeze({wallDecor:true,remains:true,deathFx:true,walk8:true,blood:'normal'});
 const LABELS={wallDecor:'벽 장식',remains:'적 잔해·바닥 얼룩',deathFx:'사망 연출',walk8:'걷기 8방향'};
 const BLOOD=Object.freeze({normal:'피 표현: 보통',low:'피 표현: 약하게',off:'피 표현: 끔'});
 const valid=(k,v)=>typeof DEFAULTS[k]==='boolean'?typeof v==='boolean':k==='blood'&&Object.hasOwn(BLOOD,v);
 const INDEX='./assets/r91/walldecor/index.json',LIMIT=60,SPACING=2.7,WORLD_PER_PX=.008;
 let prefs={...DEFAULTS},index=null,indexState='idle',lastError=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(valid(k,saved?.[k]))prefs[k]=saved[k];}catch(_){}
 const stats={builds:0,placed:0,lights:0,slots:0,textures:0,errors:0};
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 const active=f=>f?.layer==='STORY'&&(!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off');
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(valid(k,patch[k]))prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 function loadIndex(){if(indexState!=='idle')return;indexState='loading';
  fetch(INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R91 index '+r.status);return r.json();}).then(j=>{index=j;indexState='ready';}).catch(e=>{indexState='failed';fail(e);});}
 function family(f){const L=f.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(f.zone==='ep1a08'?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[f.zone]?.family||'regional';}
 function region(f){const fam=family(f);for(const[k,list]of Object.entries(index.families))if(list.includes(fam))return k;return'regional';}

 // Same wall sources R89/R90 use: native wall rows, the hospital static batch
 // and the R83 masonry boundary. Decor meshes are never their own source.
 function wallSources(r){const rows=new Set([...r.wallRows?.values()||[]].map(e=>e.mesh));
  return(r.spatialRoot?.children||[]).filter(o=>o.isMesh&&o.visible&&!o.userData?.r91Decor&&(rows.has(o)||o.name==='hospital-r5-static-wall-batch'||/^r83-masonry/.test(o.name||'')));}
 // Full-height vertical faces whose outward side looks toward the camera.
 // Winding differs between wall builders (regional walls are reversed), so the
 // outward side is taken from the native walkability query, not the normal sign.
 function faces(r,sources,frame){const T=r.T,v=new T.Vector3(),seen=new Map(),view=new T.Vector3();r.camera.getWorldDirection(view);
  const solid=(x,z)=>typeof A.explorationBlocked==='function'?!!A.explorationBlocked(frame.exploration,x,z,.05):null;
  for(const mesh of sources){mesh.updateMatrixWorld(true);const P=mesh.geometry.attributes.position,I=mesh.geometry.index;if(!P)continue;
   const at=i=>v.fromBufferAttribute(P,I?I.getX(i):i).applyMatrix4(mesh.matrixWorld).clone();
   for(let i=0,n=I?I.count:P.count;i+2<n;i+=3){const a=at(i),b=at(i+1),c=at(i+2),nrm=b.clone().sub(a).cross(c.clone().sub(a));
    if(nrm.lengthSq()<1e-12)continue;nrm.normalize();if(Math.abs(nrm.y)>.1)continue;
    const low=[a,b,c].filter(p=>p.y<.05),top=Math.max(a.y,b.y,c.y);if(low.length!==2||top<1.6)continue;
    const[p,q]=low,len=Math.hypot(q.x-p.x,q.z-p.z);if(len<1.1)continue;
    // Sort complete endpoints, not their four scalars: transposed walls
    // such as (3,3.5)-(7,3.5) and (3.5,3)-(3.5,7) are different faces.
    const key=[p,q].map(v=>[v.x,v.z].map(n=>Math.round(n*100)).join(':')).sort().join('|');if(seen.has(key))continue;
    const mx=(p.x+q.x)/2,mz=(p.z+q.z)/2,front=solid(mx+nrm.x*.35,mz+nrm.z*.35),back=solid(mx-nrm.x*.35,mz-nrm.z*.35);
    let nx=nrm.x,nz=nrm.z;if(front===true&&back===false){nx=-nx;nz=-nz;}else if(front===back&&front!==null){seen.set(key,null);continue;}
    if(-(nx*view.x+nz*view.z)<.25){seen.set(key,null);continue;}
    seen.set(key,{a:p,b:q,len,top,nx,nz});}}
  return[...seen.values()].filter(Boolean);}
 // Doors, portals, interaction marks, objectives and authored props keep a clear wall.
 function guards(frame){const out=[],L=frame.exploration,add=(p,r)=>{if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))out.push({x:p.x,y:p.y,r});};
  for(const d of L?.hospitalDoorsB3||L?.worldR74?.doors||[])add(d,2.4+Math.max(d.width||0,d.depth||0)/2);
  for(const p of frame.props||[])add(p,/portal/i.test([p.kind,p.type,p.id].join(' '))?3.6:1.7);
  const rm=typeof room!=='undefined'?room:null;for(const p of rm?.markers||[])add(p,2.6);add(rm?.objective,3);add(rm?.altar,3);add(rm?.r72Entry,4);
  add(L?.entry,3.5);for(const p of L?.starts||[])add(p,3.5);return out;}
 function plan(frame,list,zone){const reg=region(frame),items=index.items.filter(i=>i.region===reg),g=guards(frame),slots=[];
  for(const f of list){const n=Math.max(1,Math.floor((f.len-1.2)/2.2)+1);
   for(let k=0;k<n;k++){const t=n===1?.5:(.6+k*(f.len-1.2)/Math.max(1,n-1))/f.len,x=f.a.x+(f.b.x-f.a.x)*t,z=f.a.z+(f.b.z-f.a.z)*t;
    if(g.some(q=>Math.hypot(x-q.x,z-q.y)<q.r))continue;slots.push({f,x,z,room:f.len,seed:hash(zone+':'+x.toFixed(2)+':'+z.toFixed(2))});}}
  stats.slots=slots.length;slots.sort((a,b)=>a.seed-b.seed);const picked=[];
  for(const s of slots){if(picked.length>=LIMIT)break;if(picked.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<SPACING))continue;
   const item=items[s.seed%items.length],w=item.w*WORLD_PER_PX;if(w>s.room-.3)continue;picked.push({...s,item});}
  return picked;}
 function texture(r,path){const cache=r.r91Textures||(r.r91Textures=new Map());if(cache.has(path))return cache.get(path);
  const t=new r.T.TextureLoader().load(path,()=>{stats.textures++;},undefined,fail);if(r.T.SRGBColorSpace)t.colorSpace=r.T.SRGBColorSpace;t.anisotropy=1;cache.set(path,t);return t;}
 function halo(r){if(r.r91HaloMaterial)return r.r91HaloMaterial;const T=r.T;
  r.r91HaloMaterial=new T.ShaderMaterial({uniforms:{tint:{value:new T.Vector3(1,.72,.42)},strength:{value:.3}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 tint;uniform float strength;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float a=(1.-smoothstep(0.,1.,d));a*=a*strength;gl_FragColor=vec4(tint*a,1.);}'});return r.r91HaloMaterial;}
 // Lit decor positions (game x/y, slightly out from the wall) shared with the
 // R90 local-light pool; unlit decor brightness per region (swamp art is dark).
 let decorLights=[];const TONE={swamp:1.4,cave:1.12},SETTLE=900;
 function dispose(r){for(const o of r.r91Decor||[]){o.parent?.remove(o);o.geometry?.dispose();if(o.userData.ownMaterial)o.material.dispose();}r.r91Decor=null;r.r91DecorSig=null;decorLights=[];}
 function disposeAll(r){dispose(r);for(const t of r.r91Textures?.values()||[])t.dispose();r.r91Textures=null;r.r91HaloMaterial?.dispose();r.r91HaloMaterial=null;}
 function ensure(r,frame){const want=prefs.wallDecor&&active(frame)&&index;
  if(!want){for(const o of r.r91Decor||[])o.visible=false;return;}
  const sources=wallSources(r),sig=frame.zone+'|'+region(frame)+'|'+sources.map(m=>m.uuid+':'+m.geometry.uuid).join('|')+'|'+(frame.props||[]).length;
  if(r.r91Decor&&r.r91DecorSig===sig&&r.r91Decor.every(o=>o.parent===r.spatialRoot)){for(const o of r.r91Decor)o.visible=true;return;}
  // Wall rows and props stream in for a moment after region entry, which used
  // to rebuild the placement several times. Build once the signature has held
  // for SETTLE ms; a new zone hides the previous set at once.
  const now=performance.now(),zoneKey=frame.zone+'|'+region(frame);
  if(r.r91PendingSig!==sig){r.r91PendingSig=sig;r.r91PendingAt=now;}
  if(r.r91DecorZone!==zoneKey){dispose(r);r.r91DecorZone=zoneKey;}else for(const o of r.r91Decor||[])o.visible=true;
  if(now-r.r91PendingAt<SETTLE){stats.settleWaits=(stats.settleWaits||0)+1;return;}
  dispose(r);r.r91DecorSig=sig;r.r91DecorZone=zoneKey;if(!sources.length)return;const T=r.T,out=[];let lights=0;
  if(r.r91TexturesRegion!==region(frame)){for(const t of r.r91Textures?.values()||[])t.dispose();r.r91Textures=null;r.r91TexturesRegion=region(frame);}
  for(const p of plan(frame,faces(r,sources,frame),frame.zone)){const it=p.item,w=it.w*WORLD_PER_PX,h=it.h*WORLD_PER_PX,lit=it.kind==='light'||it.kind==='glow',flat=it.kind==='flat';
   const cy=Math.min(p.f.top-h/2-.08,Math.max(h/2+.15,flat?1.05:lit?1.55:1.4)),yaw=Math.atan2(p.f.nx,p.f.nz),ox=p.f.nx*.035,oz=p.f.nz*.035;
   const m=new T.MeshBasicMaterial({map:texture(r,it.path),transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
   if(!lit&&TONE[it.region])m.color.setScalar(TONE[it.region]);
   if(it.kind==='light')decorLights.push({id:it.id,x:p.x+p.f.nx*.7,y:p.z+p.f.nz*.7});
   const mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.position.set(p.x+ox,cy,p.z+oz);mesh.rotation.y=yaw;mesh.layers.set(2);
   // Unlit decor is graded/dithered as wall (R89 role by name) and darkened by
   // the carried-light pass; lit decor is drawn after that pass so flames read.
   mesh.name=lit?'r91-decor-lit:'+it.id:'r91-wall-decor:'+it.id;mesh.renderOrder=lit?-990:-1050;mesh.userData={r91Decor:true,presentationOnly:true,ownMaterial:true,item:it.id};
   r.spatialRoot.add(mesh);out.push(mesh);
   if(it.kind==='light'){const s=Math.max(w,h)*1.9,hm=new T.Mesh(new T.PlaneGeometry(s,s),halo(r));hm.position.set(p.x+ox*1.4,cy+h*.18,p.z+oz*1.4);hm.rotation.y=yaw;hm.layers.set(2);hm.renderOrder=-985;hm.name='r91-decor-halo';hm.userData={r91Decor:true,presentationOnly:true};r.spatialRoot.add(hm);out.push(hm);lights++;}
  }
  r.r91Decor=out;stats.builds++;stats.placed=out.filter(o=>o.userData.item).length;stats.lights=lights;}
 // Built inside the first layer-2 pass: the spatial root is current there.
 function wrapGL(r){if(!r.renderer||r.r91GL)return;const base=r.renderer.render;r.r91GL=true;
  r.renderer.render=function(scene,camera){if(scene===r.scene&&camera===r.camera&&camera.layers.mask===4&&r.r91Frame){try{ensure(r,r.r91Frame);}catch(e){fail(e);}r.r91Frame=null;}return base.apply(this,arguments);};}
 const render=C.render;C.render=function(frame){try{if(this.spatialRoot&&this.renderer){loadIndex();wrapGL(this);this.r91Frame=frame;}}catch(e){fail(e);}return render.apply(this,arguments);};
 const clear=C.clearScene;if(clear)C.clearScene=function(...args){dispose(this);return clear.apply(this,args);};
 const disp=C.dispose;if(disp)C.dispose=function(...args){disposeAll(this);return disp.apply(this,args);};
 function settingsSection(){const host=document.getElementById('retroSettingsR90')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR91'))return;
  const flags=Object.keys(DEFAULTS).filter(k=>typeof DEFAULTS[k]==='boolean');
  const s=document.createElement('section');s.id='retroSettingsR91';s.innerHTML='<h3>신규 자산 (R91)</h3><p class="small muted">생성 자산 표현 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+flags.map(k=>'<label><input type="checkbox" id="r91-'+k+'"> '+LABELS[k]+'</label> ').join('')+
   '<label><select id="r91-blood">'+Object.entries(BLOOD).map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('')+'</select></label>';
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of flags){const el=s.querySelector('#r91-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}
  const b=s.querySelector('#r91-blood');b.value=prefs.blood;b.onchange=()=>set({blood:b.value});}
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 // ---- Stage 2: remains and floor stains where regular enemies die ----
 // The native kill is observed after it completes; the enemy object, rewards,
 // progression and the native death effect are untouched. Marks are visual
 // data only (never in room, saves, collision or hazards) and expire.
 const FLOOR_INDEX='./assets/r91/floor/index.json',LIFE={remains:11,stain:15},FADE=2.4,MAX=18;
 let floor=null,floorState='idle',rules=[],marks=[],markZone=null;
 const fstats={spawned:0,skippedBoss:0,draws:0,dimmedFrames:0,expired:0,families:{}};
 function loadFloor(){if(floorState!=='idle')return;floorState='loading';
  fetch(FLOOR_INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R91 floor index '+r.status);return r.json();}).then(j=>{floor=j;rules=j.familyRules.map(([f,re])=>[f,new RegExp(re)]);floorState='ready';}).catch(e=>{floorState='failed';fail(e);});}
 function familyOf(e){const s=((e.path||'')+' '+(e.name||'')).toLowerCase();for(const[f,re]of rules)if(re.test(s))return f;return'human-cultist';}
 function sprite(kind,family,variant){const it=floor.items.find(i=>i.kind===kind&&i.family===family&&i.variant===variant);if(!it)return null;
  const img=typeof readyImage==='function'?readyImage(it.path)?.image:null;if(!img&&typeof addImage==='function')addImage(it.path,'R91 generated '+kind);return img?{img,it}:null;}
 function onDeath(e,x,y){if(!floor||!Number.isFinite(x+y)||!(prefs.remains||prefs.deathFx))return;
  if(e.boss||e.midboss||e.type==='boss'||e.persona){fstats.skippedBoss++;return;}
  if(typeof layer!=='undefined'&&layer!=='STORY')return;if((window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off')return;
  if(prefs.deathFx)startDeath(e,x,y,familyOf(e));if(!prefs.remains)return;
  if(markZone!==zone){marks=[];markZone=zone;}
  const family=familyOf(e),seed=hash(String(e.id)+':'+x.toFixed(2));marks.push({id:String(e.id),x,y,family,variant:seed%4,stainVariant:(seed>>>3)%4,born:typeof time==='number'?time:0});
  while(marks.length>MAX)marks.shift();fstats.spawned++;fstats.families[family]=(fstats.families[family]||0)+1;}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...args){const first=!!e&&!e.deadRecorded,x=e?.x,y=e?.y,result=base.apply(this,[e,...args]);
  try{if(first&&e.deadRecorded)onDeath(e,x,y);}catch(err){fail(err);}return result;};}
 // The native image cache is purged some time after region entry. Requesting
 // the 64 small sheets (2.7 MB) only at the first death let them queue behind
 // long-lived audio range requests and time out, so missing ones are re-requested
 // every 2 s while the option is on (registered rows are not requested again).
 let preloadAt=0;
 function preload(){const now=performance.now();if(!floor||now-preloadAt<2000||typeof addImage!=='function'||typeof readyImage!=='function')return;preloadAt=now;let n=0;
  for(const it of floor.items)if(!readyImage(it.path)){addImage(it.path,'R91 generated '+it.kind);n++;}if(n)fstats.preloads=(fstats.preloads||0)+n;}
 function drawFloor(){loadFloor();if(prefs.remains&&floor&&typeof layer!=='undefined'&&layer==='STORY')preload();if(!prefs.remains||prefs.blood==='off'||!floor||!marks.length||typeof ctx==='undefined'||typeof project!=='function')return;
  if(markZone!==zone||(typeof layer!=='undefined'&&layer!=='STORY')){if(markZone!==zone)marks=[];return;}
  const now=typeof time==='number'?time:0,keep=[];for(const m of marks){const age=now-m.born;if(age<-.5||age>LIFE.stain){fstats.expired++;continue;}keep.push(m);}marks=keep;
  // Attack warnings keep priority: marks are dimmed (not hidden) while one is shown.
  const warn=window.__STORYWORLD_DECALS_R90__?.warnings?.()?.35:1;if(warn<1)fstats.dimmedFrames++;
  const body=typeof actorHeight==='function'?actorHeight():66,sight=window.__STORYWORLD_SIGHT24__,vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight;
  for(const kind of['stain','remains'])for(const m of marks){const age=now-m.born,life=LIFE[kind];if(age>life)continue;
   if(sight?.enabled&&!sight.pointVisible(m.x,m.y))continue;const q=project(m.x,m.y);if(q.x<-200||q.y<-200||q.x>vw+200||q.y>vh+200)continue;
   const s=sprite(kind,m.family,kind==='stain'?m.stainVariant:m.variant);if(!s)continue;
   const fade=Math.min(1,age/.35)*Math.min(1,(life-age)/FADE),w=body*(kind==='stain'?1.6:1.45),h=w*s.it.h/s.it.w;
   const low=prefs.blood==='low';
   const paint=()=>{ctx.save();try{ctx.globalAlpha*=fade*warn*(kind==='stain'?(low?.28:.55):(low?.8:.96));ctx.filter=kind==='stain'?(low?'brightness(.74) saturate(.4)':'brightness(.78) saturate(.8)'):(low?'brightness(.9) saturate(.45)':'brightness(.95) saturate(.9)');
    ctx.drawImage(s.img,0,0,s.img.naturalWidth||s.img.width,s.img.naturalHeight||s.img.height,q.x-w/2,q.y-h*.55,w,h);fstats.draws++;}finally{ctx.restore();}};
   if(typeof ctx.scope==='function')ctx.scope({id:'r91:floor:'+kind+':'+m.id,kind:'ground',x:m.x,y:m.y,groundAligned:true,r91Floor:kind,presentationOnly:true,alive:false,sourcePath:s.it.path},paint);else paint();}
 }
 // ---- Stage 3: 8-frame family death effect over the dying body ----
 // Played alongside the native death effect (which is unchanged). Drawn as an
 // effect owned by the death position, so the 3D command scene orders it by
 // that position; the call is made once per frame from the native hero draw.
 const DEATH_INDEX='./assets/r91/death/index.json',DEATH_DUR=.62,DEATH_MAX=12;
 let deathIdx=null,deathState='idle',deaths=[],deathAt=0;const dstats={started:0,frames:0,lowFx:0};
 function loadDeath(){if(deathState!=='idle')return;deathState='loading';
  fetch(DEATH_INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R91 death index '+r.status);return r.json();}).then(j=>{deathIdx=j;deathState='ready';}).catch(e=>{deathState='failed';fail(e);});}
 function startDeath(e,x,y,family){if(!deathIdx)return;const scale=Math.max(.6,Math.min(2.2,(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1)));
  deaths.push({id:String(e.id),x,y,family,scale,born:typeof time==='number'?time:0,zone});while(deaths.length>DEATH_MAX)deaths.shift();dstats.started++;}
 function drawDeaths(){loadDeath();if(!prefs.deathFx||!deathIdx)return;const now=performance.now();
  if(now-deathAt>2000&&typeof addImage==='function'&&typeof readyImage==='function'){deathAt=now;for(const it of deathIdx.items)if(!readyImage(it.path))addImage(it.path,'R91 generated death');}
  if(!deaths.length||typeof ctx==='undefined'||typeof project!=='function')return;const t=typeof time==='number'?time:0;
  deaths=deaths.filter(d=>d.zone===zone&&t-d.born>=-.05&&t-d.born<DEATH_DUR);
  const low=typeof settings!=='undefined'&&(settings.lowFx||settings.reducedMotion),body=typeof actorHeight==='function'?actorHeight():66,I=deathIdx;if(low)dstats.lowFx++;
  for(const d of deaths){const it=I.items.find(i=>i.family===d.family),img=it&&typeof readyImage==='function'?readyImage(it.path)?.image:null;if(!img)continue;
   const age=Math.max(0,t-d.born),frame=Math.min(I.frames-1,Math.floor(age/DEATH_DUR*I.frames)),sx=(frame%I.cols)*I.cellW,sy=Math.floor(frame/I.cols)*I.cellH;
   const k=body*d.scale/I.bodyHeightPx,w=I.cellW*k,h=I.cellH*k,q=project(d.x,d.y),dx=q.x-I.anchorX*k,dy=q.y-I.anchorY*k;
   const tone=prefs.blood==='off'?'saturate(0) brightness(.9)':prefs.blood==='low'?'saturate(.5)':null;
   const paint=()=>{ctx.save();try{ctx.globalAlpha*=low?.55:.92;if(tone)ctx.filter=tone;ctx.drawImage(img,sx,sy,I.cellW,I.cellH,dx,dy,w,h);dstats.frames++;}finally{ctx.restore();}};
   if(typeof ctx.scope==='function')ctx.scope({id:'r91:death:'+d.id,kind:'effect',x:d.x,y:d.y,presentationOnly:true,r91Death:true,sourcePath:it.path},paint);else paint();}
 }
 // ---- Stage 4: 8-direction walk cycle ----
 // Only while the hero is plainly walking (no attack, skill, dash, hit, ultimate,
 // guard or EGO pose) the single native body drawImage inside drawHero is
 // swapped for an R91 frame; shadow, auras, statuses and every other pose stay
 // native. Directions without a sheet use the mirrored opposite side or keep
 // the native art. The native draw origin is the hero foot, body height 66*zoom.
 const WALK_INDEX='./assets/r91/walk/index.json',CYCLE=1.9,HERO_ART=/hero-authored|hero_direction33\d|heroes\/normalized/;
 let walkIdx=null,walkState='idle',walkAt=0,lastWalk=null;const stride={hero:null,room:null,x:0,y:0,dist:0};
 const wstats={replaced:0,nativeDir:0,mirrored:0,missingImage:0};
 function loadWalk(){if(walkState!=='idle')return;walkState='loading';
  fetch(WALK_INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R91 walk index '+r.status);return r.json();}).then(j=>{walkIdx=j;walkState='ready';}).catch(e=>{walkState='failed';fail(e);});}
 function walkDir(){const vx=Number(player.moveVX150)||0,vy=Number(player.moveVY150)||0;if(Math.hypot(vx,vy)<.02)return null;
  const a=project(player.x,player.y),b=project(player.x+vx,player.y+vy),s=Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4));
  return{'0':'e','1':'se','2':'s','3':'sw','4':'w','-4':'w','-3':'nw','-2':'n','-1':'ne'}[s];}
 function plainWalk(){return player&&player.hp>0&&!(player.attackAnim>0||player.skillAnim>0||player.dashAnim>0||player.hurtAnim>.05||player.ultimateAnim>0||player.guard)&&
  !window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active&&(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off'&&(typeof layer==='undefined'||layer==='STORY');}
 function trackStride(){if(!player)return;if(stride.hero!==player.hero||stride.room!==room){Object.assign(stride,{hero:player.hero,room,x:player.x,y:player.y,dist:0});return;}
  const d=Math.hypot(player.x-stride.x,player.y-stride.y);if(d<2)stride.dist+=d;stride.x=player.x;stride.y=player.y;}
 function walkFrame(){loadWalk();if(!prefs.walk8||!walkIdx||!plainWalk())return null;const dir=walkDir();if(!dir)return null;
  const now=performance.now();if(now-walkAt>2000&&typeof addImage==='function'&&typeof readyImage==='function'){walkAt=now;for(const it of walkIdx.items)if(it.hero===player.hero&&!readyImage(it.path))addImage(it.path,'R91 generated walk');}
  const p=walkIdx.plan[player.hero]?.[dir];if(!p||p.native){wstats.nativeDir++;return null;}
  const it=walkIdx.items.find(i=>i.hero===player.hero&&i.dir===p.use),img=it&&readyImage(it.path)?.image;if(!img){wstats.missingImage++;return null;}
  const f=Math.floor((stride.dist%CYCLE)/CYCLE*walkIdx.frames)%walkIdx.frames;let fr=it.frames[f];for(let k=1;!fr&&k<8;k++)fr=it.frames[(f+k)%8];if(!fr)return null;
  return{it,img,mirror:p.mirror,dir,f,fr};}
 function paintWalk(c,drawBase,w){const I=walkIdx,k=(typeof actorHeight==='function'?actorHeight():66)/w.it.refBody,sx=(w.f%I.cols)*w.it.cellW,sy=Math.floor(w.f/I.cols)*w.it.cellH;
  const dx=-w.fr.footX*k,dy=-w.fr.footY*k,dw=w.it.cellW*k,dh=w.it.cellH*k;
  if(w.mirror){c.save();try{c.scale(-1,1);return drawBase.call(c,w.img,sx,sy,w.it.cellW,w.it.cellH,dx,dy,dw,dh);}finally{c.restore();}}
  return drawBase.call(c,w.img,sx,sy,w.it.cellW,w.it.cellH,dx,dy,dw,dh);}
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...args){let result,w=null;
  try{trackStride();w=walkFrame();}catch(e){fail(e);w=null;}
  if(w&&typeof ctx!=='undefined'){const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage;let done=false;
   // Every native hero-body draw in this pass gets the walk cell, so an overlay
   // or echo copy of the body never shows a second, different pose.
   c.drawImage=function(img,...a){if(a.length===8&&HERO_ART.test(String(img?.src||''))){if(done)wstats.extraBodies=(wstats.extraBodies||0)+1;done=true;try{return paintWalk(this,prev,w);}catch(e){fail(e);return prev.apply(this,[img,...a]);}}return prev.apply(this,[img,...a]);};
   try{result=base.apply(this,args);}finally{if(own)c.drawImage=prev;else delete c.drawImage;}
   if(done){wstats.replaced++;if(w.mirror)wstats.mirrored++;lastWalk={hero:player.hero,dir:w.dir,use:w.it.dir,mirror:w.mirror,frame:w.f};}}
  else result=base.apply(this,args);
  try{if(typeof layer==='undefined'||layer==='STORY')drawDeaths();}catch(e){fail(e);}return result;};}
 if(typeof groundImage==='function'){const base=groundImage;groundImage=function(...args){const result=base.apply(this,args);try{drawFloor();}catch(e){fail(e);}return result;};}
 const CS=A.CommandScene?.prototype,policy=CS?.applySpatialPolicy;
 if(policy)CS.applySpatialPolicy=function(row,command,...args){const result=policy.call(this,row,command,...args);const k=command?.owner?.r91Floor;
  if(k&&row?.mesh){const m=row.mesh.material;row.mesh.layers.set(2);row.mesh.renderOrder=k==='stain'?-1190:-1180;m.depthTest=true;m.depthWrite=false;m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;}return result;};

 window.__STORYWORLD_VISUAL_R91__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,
  marks:()=>marks.map(m=>({...m})),familyOf:e=>floor?familyOf(e):null,lightPoints:()=>prefs.wallDecor?decorLights.map(p=>({...p})):[],
  inspect:()=>({revision:'R91-walldecor+floor',prefs:{...prefs},index:indexState,items:index?.items?.length||0,floor:floorState,floorItems:floor?.items?.length||0,marks:marks.length,stats:{...stats},floorStats:{...fstats,families:{...fstats.families}},death:deathState,deathStats:{...dstats,active:deaths.length},walk:walkState,walkStats:{...wstats},lastWalk,lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();
