// R300: 빛 웅덩이·낮은 안개·재/포자·영웅 접지 그림자 (AAA 다크판타지 감사 2·5·10항).
//  · 빛 웅덩이: 화로·횃불·초·등불 소품(R123 isLight)과 R123 벽 횃불 자리 바닥에 따뜻한 가산 원형 빛 — InstancedMesh 1개(1 draw),
//    방사형 그라데이션 텍스처는 오프스크린 캔버스에서 만든다. 본편(STORY)에서는 지역 기본 밝기를 곱하기 한 장으로 15~17% 낮춘다.
//    횃불·손전등 시야(R182/R254 → settings.flashlight58)가 켜지면 R89 처럼 어둡게·빛 웅덩이를 끈다(시야와 이중 적용 금지).
//  · 안개 띠: 바닥 바로 위 투명 평면 2~3장(코드로 만든 얼룩 텍스처, UV 흐름). 나중에 assets/r300/fog-*.png 가 오면 FOG_TEXTURES 에 경로만 넣는다.
//  · 재·포자: Points 1 draw(PC 300, 모바일 150), 본편 = 따뜻한 재, 사몽 = 핏빛 포자.
//  · 영웅: 발밑 타원 접지 그림자 + 아주 약한 차가운 테두리 빛(둘 다 오프스크린 캔버스 그림을 drawImage — ctx.filter 안 씀).
// 화면 표현만 바꾼다. 충돌·피해·저장·서사·맵 순서는 그대로. 게임 ctx.filter 에 blur/drop-shadow 를 쓰지 않는다.
// perf-r97 이 렌더러 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다.
(()=>{'use strict';
if(window.__STORYWORLD_LIGHT_ATMOS_R300__)return;
const REV='R300-light-atmos-1',KEY='storyworld.r300.lightAtmos';
// 나중에 dots 안개 띠 텍스처가 오면 여기에 경로만 넣는다(예: './assets/r300/fog-ash.png'). 비어 있으면 코드로 만든 텍스처.
const FOG_TEXTURES=Object.freeze({story:null,samong:null});
const CFG=Object.freeze({
 dim:{pc:.84,mobile:.88},            // 지역 기본 밝기 곱(16% / 12% 낮춤)
 pools:{pc:24,mobile:10},             // 동시에 그리는 빛 웅덩이 상한(InstancedMesh 1개)
 poolGain:{pc:.28,mobile:.22},
 motes:{pc:300,mobile:150},           // 재·포자 상한(Points 1개)
 fogBands:{pc:3,mobile:2},
 extraDraws:{pc:6,mobile:5},          // 3D 쪽 draw 증가 상한(어둡게 1 + 웅덩이 1 + 안개 ≤3 + 재 1)
 heroAlpha:{pc:1,mobile:.75}
});
const DEFAULTS=Object.freeze({on:true,pools:true,fog:true,motes:true,hero:true});
let prefs={...DEFAULTS};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)for(const k in DEFAULTS)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,pools:0,poolsMax:0,motes:0,fogBands:0,dimFrames:0,heroDraws:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
function mobile(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
const tier=()=>mobile()?'mobile':'pc';
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
const sightOn=()=>!!(typeof settings!=='undefined'&&settings&&settings.flashlight58!==false);
const want=k=>prefs.on&&prefs[k]!==false;
function budget(){const t=tier(),lf=lowFx();
 return{tier:t,dim:CFG.dim[t],pools:lf?Math.min(6,CFG.pools[t]):CFG.pools[t],poolGain:CFG.poolGain[t],motes:lf?0:CFG.motes[t],fogBands:lf?1:CFG.fogBands[t],heroAlpha:CFG.heroAlpha[t]};}

// ---- 빛 자리(R123 과 같은 자리: 소품 + 뒷벽 횃불) ----
const lightCache=new WeakMap(),wallCache=new WeakMap();
const FIRE=/brazier|torch|candle|lantern|sconce|campfire|bonfire|altar|shrine/i,NOT=/door|beast|ailment|vfx/i;
function isLight(p){try{const f=window.__STORYWORLD_DARK_R123__?.isLight;if(typeof f==='function')return !!f(p);}catch(_){}
 return !!p&&p.visible!==false&&(['brazier','torch','candle','lantern'].includes(p.r74Prop||p.r105Prop||p.r115Prop)||(typeof p.path==='string'&&FIRE.test(p.path)&&!NOT.test(p.path)));}
function lightsOf(r){if(!r)return[];const n=r.props?.length||0;let c=lightCache.get(r);if(c&&c.n===n)return c.list;
 const list=(r.props||[]).filter(isLight).filter(p=>Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,r:3,prop:true}));
 const L=r.exploration,cells=L?.floorCells;let wall=L&&wallCache.get(L);
 if(!wall||wall.cells!==cells){const w=[];if(Array.isArray(cells)&&cells.length){const set=new Set(cells.map(q=>q[0]+':'+q[1]));
   for(const[a,b]of cells){if(set.has(a+':'+(b-1))&&set.has((a-1)+':'+b))continue;if(!set.has((a+1)+':'+b)||!set.has(a+':'+(b+1)))continue;if(((a*7+b*13)%5)!==0)continue;w.push({x:a+.6,y:b+.6,r:2.2});}}
  wall={cells,list:w};if(L)wallCache.set(L,wall);}
 for(const w of wall.list){if(list.length>=80)break;if(list.some(q=>Math.hypot(q.x-w.x,q.y-w.y)<9))continue;list.push(w);}
 c={n,list};lightCache.set(r,c);return list;}
function nearest(list,x,y,cap){if(list.length<=cap)return list.slice();return list.map(l=>[l,(l.x-x)**2+(l.y-y)**2]).sort((a,b)=>a[1]-b[1]).slice(0,cap).map(a=>a[0]);}

// ---- 오프스크린 텍스처 ----
function canvasOf(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(g)fn(g,w,h);return c;}
function poolCanvas(){return canvasOf(128,128,(g,w)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.72)');gr.addColorStop(.55,'rgba(255,255,255,.28)');gr.addColorStop(.8,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=gr;g.fillRect(0,0,w,w);});}
function fogCanvas(){return canvasOf(256,256,g=>{let s=11;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 for(let i=0;i<70;i++){const x=rnd()*256,y=rnd()*256,rr=18+rnd()*54,a=.10+rnd()*.16;for(const[dx,dy]of[[0,0],[256,0],[-256,0],[0,256],[0,-256],[256,256],[-256,-256],[256,-256],[-256,256]]){
  const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,rr);gr.addColorStop(0,'rgba(255,255,255,'+a.toFixed(3)+')');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x+dx-rr,y+dy-rr,rr*2,rr*2);}}});}
let heroArt=null;
function heroCanvases(){if(heroArt)return heroArt;
 const shadow=canvasOf(128,64,(g)=>{const gr=g.createRadialGradient(64,32,0,64,32,64);gr.addColorStop(0,'rgba(3,3,5,.62)');gr.addColorStop(.45,'rgba(3,3,5,.36)');gr.addColorStop(1,'rgba(3,3,5,0)');
  g.setTransform(1,0,0,.5,0,16);g.fillStyle=gr;g.fillRect(0,-32,128,128);});
 const rim=canvasOf(96,192,(g)=>{g.setTransform(1,0,0,2,0,0);const gr=g.createRadialGradient(48,48,8,48,48,48);gr.addColorStop(0,'rgba(190,210,235,0)');gr.addColorStop(.55,'rgba(190,210,235,.30)');gr.addColorStop(.78,'rgba(170,195,230,.16)');gr.addColorStop(1,'rgba(170,195,230,0)');g.fillStyle=gr;g.fillRect(0,0,96,96);});
 shadow.__storyworldStaticSource=true;rim.__storyworldStaticSource=true;heroArt={shadow,rim};return heroArt;}

// ---- 3D 물체 ----
function build(r){if(r.__r300)return r.__r300;const T=r.T,o={};
 // 지역 밝기 낮추기: 화면 전체 곱하기 한 장(R89 빛 판과 같은 방식, 그보다 먼저).
 o.dim=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms:{k:{value:1}},vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform float k;void main(){gl_FragColor=vec4(vec3(k),1.);}',
  transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.ZeroFactor,blendDst:T.SrcColorFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,toneMapped:false}));
 o.dim.name='r300-dim';o.dim.renderOrder=-1050;o.dim.frustumCulled=false;
 // 빛 웅덩이: 바닥에 누운 평면 InstancedMesh 1개.
 const pg=new T.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const ptex=new T.CanvasTexture(poolCanvas());
 o.pools=new T.InstancedMesh(pg,new T.MeshBasicMaterial({map:ptex,color:0xffffff,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),CFG.pools.pc);
 o.pools.instanceMatrix.setUsage(T.DynamicDrawUsage);o.pools.setColorAt(0,new T.Color(0,0,0));o.pools.instanceColor.setUsage(T.DynamicDrawUsage);
 o.pools.name='r300-light-pools';o.pools.renderOrder=-990;o.pools.frustumCulled=false;o.pools.count=0;
 // 안개 띠: 가장자리가 보이지 않게 둥글게 사라지는 큰 평면.
 o.fogTex=new T.CanvasTexture(fogCanvas());o.fogTex.wrapS=o.fogTex.wrapT=T.RepeatWrapping;
 o.fog=[];const fv='varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}';
 const ff='uniform sampler2D map;uniform vec2 off;uniform float scale;uniform float opacity;uniform vec3 color;uniform vec2 center;uniform float radius;varying vec2 vW;void main(){float a=texture2D(map,vW*scale+off).a;float d=length(vW-center)/radius;a*=opacity*(1.-smoothstep(.45,1.,d));gl_FragColor=vec4(color,a);}';
 for(let i=0;i<CFG.fogBands.pc;i++){const g=new T.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
  const m=new T.ShaderMaterial({uniforms:{map:{value:o.fogTex},off:{value:new T.Vector2()},scale:{value:.045+i*.018},opacity:{value:.16},color:{value:new T.Color(.62,.58,.55)},center:{value:new T.Vector2()},radius:{value:18}},vertexShader:fv,fragmentShader:ff,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
  const mesh=new T.Mesh(g,m);mesh.name='r300-fog-'+i;mesh.renderOrder=-985+i;mesh.frustumCulled=false;mesh.position.y=.1+i*.22;mesh.scale.set(40,1,40);o.fog.push(mesh);}
 // 재·포자: Points 1개, 위치는 셰이더에서 영웅 둘레 상자 안으로 감아 돈다(매 프레임 버퍼 갱신 없음).
 const n=CFG.motes.pc,seed=new Float32Array(n*3);let s=7;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};for(let i=0;i<n*3;i++)seed[i]=rnd();
 const mg=new T.BufferGeometry();mg.setAttribute('position',new T.BufferAttribute(seed,3));mg.boundingSphere=new T.Sphere(new T.Vector3(),1e6);
 o.motes=new T.Points(mg,new T.ShaderMaterial({uniforms:{t:{value:0},center:{value:new T.Vector3()},box:{value:new T.Vector3(30,5,30)},color:{value:new T.Color(1,.62,.32)},size:{value:2.4},rise:{value:.35}},
  vertexShader:'uniform float t;uniform vec3 center;uniform vec3 box;uniform float size;uniform float rise;varying float vA;void main(){vec3 s=position;vec3 lo=center-box*.5;'+
   'float y=mod(s.y*box.y+t*rise*(.5+s.x),box.y);vec3 p=vec3(mod(s.x*box.x+sin(t*.31+s.z*6.283)*.7-lo.x,box.x)+lo.x,y,mod(s.z*box.z+cos(t*.27+s.x*6.283)*.7-lo.z,box.z)+lo.z);'+
   'vA=smoothstep(0.,.8,y)*(1.-smoothstep(box.y*.55,box.y,y))*(.45+.55*fract(s.x*13.7+s.z*7.1));gl_PointSize=size*(.7+.6*fract(s.z*17.3));gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform vec3 color;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=vA*(1.-smoothstep(.15,.5,d));gl_FragColor=vec4(color*a,a);}',
  transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false}));
 o.motes.name='r300-motes';o.motes.renderOrder=-980;o.motes.frustumCulled=false;
 for(const m of [o.dim,o.pools,...o.fog,o.motes]){m.layers.set(2);m.visible=false;m.userData={presentationOnly:true,collisionChanged:false,r300:true};}
 o.color=new T.Color();o.mat=new T.Matrix4();o.tmp=[];o.pickAt=-1;o.fogSrc=null;
 r.__r300=o;return o;}
function attach(r,o){for(const m of [o.dim,o.pools,...o.fog,o.motes])if(m.parent!==r.scene)r.scene.add(m);}
function hideAll(o){if(!o)return;for(const m of [o.dim,o.pools,...o.fog,o.motes])m.visible=false;}
function loadFog(o,T,samong){const url=samong?FOG_TEXTURES.samong:FOG_TEXTURES.story;if(!url||o.fogSrc===url)return;o.fogSrc=url;
 try{new T.TextureLoader().load(url,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;for(const f of o.fog)f.material.uniforms.map.value=t;},undefined,()=>{});}catch(e){fail(e);}}

function update(r,frame){const o=r.__r300;if(!o)return;
 const live=prefs.on&&frame&&typeof room!=='undefined'&&room&&typeof player!=='undefined'&&player&&Number.isFinite(player.x+player.y);
 if(!live){hideAll(o);return;}
 const B=budget(),t=performance.now()/1000,samong=frame.layer!=='STORY'||!!room.samongR103,sight=sightOn();stats.frames++;
 // 어둡게: 본편, 시야(횃불·손전등) 꺼짐일 때만.
 const dimOn=want('pools')&&!samong&&!sight;o.dim.visible=dimOn;if(dimOn){o.dim.material.uniforms.k.value=B.dim;stats.dimFrames++;}
 // 빛 웅덩이
 let n=0;if(want('pools')&&!sight){if(t-o.pickAt>.5||!o.pick){o.pickAt=t;o.pick=nearest(lightsOf(room),player.x,player.y,B.pools);}
  const warm=samong?[1,.32,.2]:[1,.52,.22];
  for(const l of o.pick){if(n>=B.pools)break;const ph=(l.x*3.1+l.y*1.7)%6.283,fl=reduced()?1:.92+.05*Math.sin(t*7.9+ph)+.03*Math.sin(t*17.3+ph*2),rad=(l.r||3)*2*(l.prop?1.15:.95),k=B.poolGain*fl*(l.prop?1:.8);
   o.mat.makeScale(rad,1,rad);o.mat.setPosition(l.x,.03,l.y);o.pools.setMatrixAt(n,o.mat);o.color.setRGB(warm[0]*k,warm[1]*k,warm[2]*k);o.pools.setColorAt(n,o.color);n++;}}
 o.pools.count=n;o.pools.visible=n>0;if(n){o.pools.instanceMatrix.needsUpdate=true;o.pools.instanceColor.needsUpdate=true;}stats.pools=n;stats.poolsMax=Math.max(stats.poolsMax,n);
 // 안개 띠
 const bands=want('fog')?B.fogBands:0;loadFog(o,r.T,samong);
 const fogCol=samong?[.34,.12,.11]:[.42,.39,.36],cx=Math.round(player.x),cy=Math.round(player.y);
 o.fog.forEach((f,i)=>{const on=i<bands;f.visible=on;if(!on)return;const u=f.material.uniforms,sp=reduced()?0:.006+i*.004;
  f.position.x=cx;f.position.z=cy;u.center.value.set(cx,cy);u.radius.value=19;u.opacity.value=(samong?.13:.09)*(i?.7:1);u.color.value.setRGB(...fogCol);
  u.off.value.set(t*sp*(i%2?-1:1),t*sp*.6);});stats.fogBands=bands;
 // 재·포자
 const motes=want('motes')?B.motes:0;o.motes.visible=motes>0;stats.motes=motes;
 if(motes){o.motes.geometry.setDrawRange(0,motes);const u=o.motes.material.uniforms;u.t.value=reduced()?0:t;u.center.value.set(player.x,0,player.y);
  u.color.value.setRGB(...(samong?[.9,.24,.2]:[1,.62,.32]));u.size.value=2.4*Math.min(2,r.renderer?.getPixelRatio?.()||1);}
 attach(r,o);}

// ---- 렌더러 감싸기(프로토타입 + 인스턴스) ----
// R287 등 다른 오버레이도 500ms 마다 자기 표식으로 render 를 다시 감싸므로 "가장 바깥 함수 표식"으로는 설치 여부를 알 수 없다
// (서로 번갈아 감싸며 래퍼가 쌓임). 설치한 대상(프로토타입·인스턴스)을 WeakSet 에 기억해 한 번만 감싸고, 같은 frame 은 한 번만 갱신한다.
const wrappedTargets=new WeakSet();
function wrapFn(fn){const w=function(frame){try{if(this?.T&&this.scene&&this.__r300Frame!==frame){this.__r300Frame=frame;stats.updates=(stats.updates||0)+1;build(this);update(this,frame);}}catch(e){fail(e);}
  try{return fn.apply(this,arguments);}finally{if(this)this.__r300Frame=undefined;}};w.__r300=true;return w;}
function wrapOnce(target){if(!target||wrappedTargets.has(target)||typeof target.render!=='function')return;wrappedTargets.add(target);target.render=wrapFn(target.render);}
function wrapAll(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const proto=r?Object.getPrototypeOf(r):window.StoryPhase1?.ThreeRenderer?.prototype;
 wrapOnce(proto);if(r&&Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
// 장면을 비우면(지역 이동) 우리 물체는 장면 밖으로 빠질 수 있다 — 다음 render 에서 다시 붙인다(attach). 버린 렌더러는 정리한다.
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype,d=C?.dispose;if(d&&!d.__r300){C.dispose=function(...a){try{const o=this.__r300;if(o){for(const m of [o.dim,o.pools,...o.fog,o.motes]){m.parent?.remove(m);m.geometry.dispose();m.material.map?.dispose?.();m.material.dispose();}o.fogTex.dispose();}this.__r300=null;}catch(_){}return d.apply(this,a);};C.dispose.__r300=true;}}catch(e){fail(e);}
if(typeof setInterval==='function')setInterval(wrapAll,500);wrapAll();

// ---- 영웅 접지 그림자 + 약한 테두리 빛(2D, drawImage 만) ----
let heroDrawing=false;
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){heroDrawing=true;try{return base.apply(this,a);}finally{heroDrawing=false;}};}
if(typeof shadow==='function'){const base=shadow;shadow=function(x,y,radius=18,opt={}){
 if(heroDrawing){heroDrawing=false;try{if(want('hero')&&typeof ctx!=='undefined'&&Number.isFinite(x+y)&&typeof player!=='undefined'&&player){const art=heroCanvases(),B=budget(),
   h=typeof actorHeight==='function'?actorHeight():66,lift=Math.max(0,Math.min(1,+(opt?.lift)||0)),a=B.heroAlpha*(1-lift*.6);
   const paint=()=>{ctx.save();try{ctx.globalAlpha*=a*.85;const w=Math.max(28,h*.92),hh=w*.36;ctx.drawImage(art.shadow,x-w/2,y-hh/2,w,hh);
    if(!lowFx()){ctx.globalAlpha=a*.55;const rw=h*.78,rh=h*1.12;ctx.drawImage(art.rim,x-rw/2,y-h*.47-rh/2,rw,rh);}stats.heroDraws++;}finally{ctx.restore();}};
   // 영웅 소유(layer 3, 깊이 무시)로 기록되면 앞벽·발 위에 그려진다 → 엔진 발밑 그림자처럼 contact 범위(layer 1, 몸·벽 뒤)로 기록한다.
   if(typeof ctx.scope==='function')ctx.scope({...(ctx.owner||{}),kind:'contact'},paint);else paint();}}catch(e){fail(e);}}
 return base.apply(this,arguments);};}

// ---- 설정 ----
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){for(const k in DEFAULTS)if(typeof p[k]==='boolean')prefs[k]=p[k];save();return{...prefs};}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('lightAtmosR300'))return;
 const s=document.createElement('section');s.id='lightAtmosR300';
 s.innerHTML='<h3>빛·안개 (R300)</h3><p class="small muted">화면 표현만 바꿉니다. 충돌·피해·저장은 그대로입니다. 모바일·가벼운 화면에서는 개수와 세기를 줄입니다.</p>'+
  [['on','빛·안개 효과 전체'],['pools','화로·횃불 바닥 빛과 주변 어둡게'],['fog','낮게 깔리는 안개'],['motes','떠도는 재·포자'],['hero','영웅 발밑 그림자·테두리 빛']].map(([k,l])=>'<label><input type="checkbox" data-r300="'+k+'"> '+l+'</label>').join(' ');
 panel.appendChild(s);s.querySelectorAll('[data-r300]').forEach(el=>{el.checked=!!prefs[el.dataset.r300];el.onchange=()=>set({[el.dataset.r300]:el.checked});});}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_LIGHT_ATMOS_R300__=Object.freeze({revision:REV,config:CFG,fogTextures:FOG_TEXTURES,storageKey:KEY,prefs:()=>({...prefs}),set,budget,lightsOf,nearest,isLight,
 inspect:()=>({revision:REV,prefs:{...prefs},budget:budget(),stats:{...stats},lastError,sightOn:sightOn(),collisionChanged:false,gameplayChanged:false,GPUVerified:false})});
})();
