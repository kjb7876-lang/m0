// SW-0025: append Blender-authored attack tracks and rigid props to an exact R1305 GLB.
// The shipped body, textures, skins and Idle/Walk accessors are never rewritten.
(()=>{'use strict';
const host=typeof window==='undefined'?globalThis:window;
const api='__STORYWORLD_HERO_ATTACK_R1306__';
if(host[api])return;
const ids=new Set(['seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego']);
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const cap=512*1024;
const asInt=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
function need(ok,msg){if(!ok)throw new Error('R1306 '+msg);}
async function graft(source,d,id,clip){
 need(ids.has(id)&&d?.version===1&&d.hero===id&&/^[a-f0-9]{64}$/.test(d.sourceSha256),'delta identity');
 need(source instanceof ArrayBuffer&&source.byteLength>=28&&source.byteLength<=4500000,'GLB length');
 need(!!host.crypto?.subtle,'SHA-256 requires secure context');
 const raw=new Uint8Array(source);const view=new DataView(source);
 const h=await host.crypto.subtle.digest('SHA-256',source);
 const digest=Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');
 need(digest===d.sourceSha256,'source version');
 need(view.getUint32(0,true)===0x46546c67&&view.getUint32(4,true)===2&&view.getUint32(8,true)===raw.length,'GLB header');
 const jl=view.getUint32(12,true),bo=20+jl;
 need(jl%4===0&&bo+8<=raw.length&&view.getUint32(16,true)===0x4e4f534a,'JSON chunk');
 const n=view.getUint32(bo,true);
 need(n===d.sourceBinBytes&&n%4===0&&bo+8+n===raw.length&&view.getUint32(bo+4,true)===0x004e4942,'BIN chunk');
 const j=JSON.parse(dec.decode(raw.subarray(20,bo)));
 need(j.buffers?.[0]?.byteLength===n&&j.buffers.length===2&&!j.buffers[0].uri,'buffer layout');
 need(asInt(d.animationIndex,0,j.animations.length-1)&&j.animations[d.animationIndex].name===clip&&d.animation?.name===clip,
      'attack slot');
 need(typeof d.binBase64==='string'&&d.binBase64.length<=cap,'payload budget');
 const extra=host.atob(d.binBase64);need(extra.length%4===0&&extra.length>0,'suffix alignment');
 const a=d.append;
 for(const k of ['accessors','bufferViews','nodes','meshes'])need(Array.isArray(a?.[k])&&a[k].length<=128&&Array.isArray(j[k]),'append tables');
 const oldNodes=j.nodes.length,oldMeshes=j.meshes.length,oldViews=j.bufferViews.length,oldAcc=j.accessors.length;
 const mm=a.materials??[];
 need(Array.isArray(mm)&&(mm.length===0||id==='seoha'&&mm.length<=3),'prop palette');
 const num=v=>Number.isFinite(v)&&v>=0&&v<=1;
 const palette=(a,k)=>Array.isArray(a)&&a.length===k&&a.every(num);
 for(const mat of mm){
  const p=mat?.pbrMetallicRoughness;
  need(mat&&Object.keys(mat).every(k=>['name','doubleSided','pbrMetallicRoughness','emissiveFactor'].includes(k))&&
       p&&Object.keys(p).every(k=>['baseColorFactor','metallicFactor','roughnessFactor'].includes(k))&&
       palette(p.baseColorFactor,4)&&num(p.metallicFactor)&&num(p.roughnessFactor)&&palette(mat.emissiveFactor,3),'prop material');
 }
 j.materials.push(...mm);
 // Suffix references may not target immutable bytes or the virtual meshopt fallback buffer.
 for(const bv of a.bufferViews){
  need(bv.buffer===0&&asInt(bv.byteOffset,n,n+extra.length-1)&&asInt(bv.byteLength,1,n+extra.length-bv.byteOffset)&&
      bv.byteOffset%4===0&&!bv.extensions&&!bv.byteStride,'suffix buffer view');
 }
 for(const ac of a.accessors){
  const parts={SCALAR:1,VEC3:3,VEC4:4};
  need(asInt(ac.bufferView,oldViews,oldViews+a.bufferViews.length-1)&&!!parts[ac.type]&&
   (ac.componentType===5126||ac.componentType===5123&&ac.type==='SCALAR')&&
   asInt(ac.count,1,12288)&&!ac.sparse&&!ac.normalized&&!ac.byteOffset,'suffix accessor');
  const len=ac.count*parts[ac.type]*(ac.componentType===5126?4:2);
  need(len===a.bufferViews[ac.bufferView-oldViews].byteLength,'accessor bytes');
 }
 const knownParent=new Set(['Weapon_Socket_L','Weapon_Socket_R',id+'_Weapon']),bound=new Set();
 need(a.nodes.length===a.meshes.length&&(d.parentChildren!==null&&typeof d.parentChildren==='object'),'weapon layout');
 for(const [k,kids] of Object.entries(d.parentChildren)){
  const i=Number(k),p=j.nodes[i];
  need(String(i)===k&&asInt(i,0,oldNodes-1)&&knownParent.has(p.name)&&Array.isArray(kids)&&kids.length>0,'weapon socket');
  for(const child of kids){
   need(asInt(child,oldNodes,oldNodes+a.nodes.length-1)&&!bound.has(child),'weapon graph');
   bound.add(child);
  }
  p.children=[...(p.children||[]),...kids];
 }
 need(bound.size===a.nodes.length,'orphan weapon');
 for(const [i,node] of a.nodes.entries()){
  need((node?.name?.startsWith('contact-')||(id==='seoha'&&node?.name==='Seoha_Attack_DecorativeShard'))&&node.mesh===oldMeshes+i&&
   Object.keys(node).every(k=>['name','mesh','translation','rotation','scale'].includes(k)),'weapon node');
  for(const k of ['translation','rotation','scale'])if(k in node){
   const q=node[k];need(Array.isArray(q)&&q.length===(k==='rotation'?4:3)&&
    q.every(v=>Number.isFinite(v)&&Math.abs(v)<=10&&(k!=='scale'||v>=0)),'weapon transform');
  }
 }
 const newAccessor=i=>asInt(i,oldAcc,oldAcc+a.accessors.length-1);
 for(const m of a.meshes){
  need(Array.isArray(m?.primitives)&&m.primitives.length>=1&&m.primitives.length<=(id==='seoha'?3:1),'weapon primitives');
  for(const p of m.primitives){
   const pos=p?.attributes?.POSITION,norm=p?.attributes?.NORMAL;
   need((p.mode??4)===4&&newAccessor(pos)&&newAccessor(norm)&&asInt(p.material,0,j.materials.length-1),'weapon mesh');
   const pc=a.accessors[pos-oldAcc],nc=a.accessors[norm-oldAcc];
   need(pc?.type==='VEC3'&&nc?.type==='VEC3'&&pc?.count===nc?.count&&
        (newAccessor(p.indices)||(id==='seoha'&&p.indices===undefined&&pc.count%3===0)),'weapon triangles');
  }
 }
 for(const k of ['accessors','bufferViews','nodes','meshes'])j[k].push(...a[k]);
 const atk=d.animation;need(Array.isArray(atk.samplers)&&Array.isArray(atk.channels)&&atk.channels.length<=32&&atk.channels.length>=1,'attack channels');
 const allowed=new Set(j.skins.flatMap(s=>s.joints));
 for(let i=0;i<j.nodes.length;i++)if(knownParent.has(j.nodes[i].name)||i>=oldNodes)allowed.add(i);
 const joints=new Set();
 for(const c of atk.channels){
  const ch=c?.target, s=atk.samplers?.[c?.sampler];const key=ch?.node+'|'+ch?.path;
  need(ch&&allowed.has(ch.node)&&!joints.has(key)&&['rotation','translation','scale'].includes(ch.path)&&(ch.path!=='scale'||ch.node>=oldNodes)&&s&&
        !!j.accessors[s.input]&&!!j.accessors[s.output]&&['STEP','LINEAR','CUBICSPLINE'].includes(s.interpolation||'LINEAR'),'attack target or sampler');
  joints.add(key);
 }
 j.animations[d.animationIndex]=atk;j.buffers[0].byteLength=n+extra.length;
 const json=enc.encode(JSON.stringify(j)),pad=(4-json.length%4)%4;
 const b=new ArrayBuffer(28+json.length+pad+n+extra.length),out=new Uint8Array(b),v=new DataView(b);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,b.byteLength,true);
 v.setUint32(12,json.length+pad,true);v.setUint32(16,0x4e4f534a,true);
 out.set(json,20);out.fill(32,20+json.length,20+json.length+pad);
 const p=20+json.length+pad;
 v.setUint32(p,n+extra.length,true);v.setUint32(p+4,0x004e4942,true);
 out.set(raw.subarray(bo+8),p+8);
 for(let i=0;i<extra.length;i++)out[p+8+n+i]=extra.charCodeAt(i);
 return b;
}
host[api]=Object.freeze({version:1,graft,path:id=>ids.has(id)?'assets/r1306/'+id+'-attack.json':null});
})();
// R1305 3D 영웅 10명(환도 + TRELLIS.2 9명) · 칼날 금속 재질 · 2D 유령 복제 숨김. (아래 R1304 설명은 그대로 유효)
//  · 환도: Blender 5.3 재생성 GLB(걷기 보폭↓·로브 자락 웨이트, tools/r1305/blender_hwando_walk_r1305.py). 경로·저장 키·API 이름은 R1302 그대로.
//  · 서하·네온·라우렌·미카엘라·슬레이어·헌터·거너·페르소나·EGO: assets/r1305/<id>-3d.glb(tools/r1305/blender_heroes_r1305.py).
//  · Pages 예산(R580 1.1GB): GLB 10개는 텍스처 512px WebP(tools/r1305/glb_textures_512_r1305.py)·정점/인덱스 EXT_meshopt_compression 무손실(tools/r1305/glb_meshopt_r1305.mjs) → vendor/three/examples/jsm/libs/meshopt_decoder.module.js 로 푼다.
//    지금 영웅의 GLB 하나만, 그 영웅으로 3D 를 처음 볼 때 읽는다(기본 꺼짐이면 0바이트).
//  · 무기 메시(스킨 없는 메시 = Weapon_Socket 강체) 재질: metalness .65 · roughness .25, 몸 재질은 emissive 0.
//    빛나는 무기 부품(원래 emissive 가 있는 재질)은 그 빛을 유지한다. opacity ≥ .98 이면 transparent=false(불투명 pass·정렬 안정).
//  · R350/R448 가 몸 본체를 복사해 덧그리는 2D 유령·앞그림(c.owner.r350 + 열쇠 'r350:ghost:'·'r448:ghost:'·'r448:over:')도
//    3D 로 바꾼 본체 몫이면 함께 뺀다 — 3D 위에 2D 몸·무기가 반투명으로 겹치던 문제.
// R1304 3D 환도 마감.
//  · 저장 키·공개 API·GLB 경로는 R1302와 같아 기존 설정/세이브와 호환한다.
//  · 별도 WebGL 캔버스를 만들지 않고 활성 ThreeRenderer.scene의 몸/벽 레이어(2)에 GLTF를 붙인다.
//    따라서 벽·지형과 같은 depth pass에서 가려지고, R448 앞쪽 효과(레이어 3)는 그대로 위에 남는다.
//  · Three는 이미 게임 렌더러가 읽은 host.T를 공유한다. GLTFLoader 모듈과 GLB fetch를 병렬 시작하고
//    parseAsync로 분리 계측한다. 기본 꺼짐에서는 모듈/GLB를 한 바이트도 읽지 않는다.
//  · R1303의 Idle/Walk/Attack 크로스페이드·이동 속도·부드러운 방향 전환은 유지한다.
((ENGINE_HEROES)=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HWANDO3D_R1302__)return;
const REV='R1305-heroes3d',KEY='storyworld.r1302.hwando3d',GLB='assets/r1302/hwando-3d.glb';
const MODEL_H=1.75,SCALE=1.06,HOST_LAYER=2,YAW_CAMERA=Math.PI/4;
// 영웅 id → GLB·공격 클립. TRELLIS 영웅은 사용자 공용 스크립트 프리셋의 공격 클립 이름을 쓴다.
const HEROES=Object.freeze({
 hwando:{glb:GLB,attack:'Attack_DiagonalSlash'},
 seoha:{glb:'assets/r1305/seoha-3d.glb',attack:'Attack_EgoCast'},
 neon:{glb:'assets/r1305/neon-3d.glb',attack:'Attack_EgoCast'},
 lauren:{glb:'assets/r1305/lauren-3d.glb',attack:'Attack_LanceThrust'},
 michaela:{glb:'assets/r1305/michaela-3d.glb',attack:'Attack_HealPulse'},
 slayer:{glb:'assets/r1305/slayer-3d.glb',attack:'Attack_DownCleave'},
 hunter:{glb:'assets/r1305/hunter-3d.glb',attack:'Attack_BowShot'},
 gunner:{glb:'assets/r1305/gunner-3d.glb',attack:'Attack_AimFire'},
 persona:{glb:'assets/r1305/persona-3d.glb',attack:'Attack_EgoCast'},
 ego:{glb:'assets/r1305/ego-3d.glb',attack:'Attack_AwakenedBurst'}});
const WEAPON={metalness:.65,roughness:.25};
// Visual-only summoner presentation. A socket is not enough to identify a weapon.
const SPIRIT_ATLAS='assets/r106/fx/flame.webp',SPIRIT_ORB='assets/r106/fx/orb.webp',SPIRIT_FALLBACK_Y=1.42;
const HELD={
 hwando:['Hwando_Weapon'],seoha:['Seoha_Attack_DecorativeShard'],neon:[],
 lauren:['lauren_Weapon','contact-lauren-winged-faceted-spearhead','contact-lauren-violet-ridge','contact-lauren-haft-ferrule'],
 michaela:['michaela_Weapon'],slayer:['slayer_Weapon','contact-slayer-faceted-blade','contact-slayer-central-engraving','contact-slayer-quillon'],
 hunter:['hunter_Weapon','contact-bowstring-top','contact-bowstring-bottom'],gunner:['gunner_Weapon','contact-blue-outer-accent'],persona:[],ego:[]
};
const SEOHA_HELD=new Set(['Blue steel sleeve shard','Muted steel hilt']);
function heldVisual(o,id){
 if(!o.isMesh||o.isSkinnedMesh||!HELD[id]?.length)return null;
 let node=null,socket=false;
 for(let n=o;n;n=n.parent){
  if(!node&&HELD[id].includes(n.name))node=n.name;
  if(/^Weapon_Socket(?:_[LR])?$/.test(n.name))socket=true;
 }
 if(!node||!socket)return null;
 if(id!=='seoha')return node;
 // The animated shard is a multi-primitive node: keep the dark wrist wrap even though its sibling
 // cutting shard & hilt share the socket and animation. Ambiguous/mixed mesh materials fail closed.
 const m=o.material;
 return Array.isArray(m)?(m.length&&m.every(x=>SEOHA_HELD.has(x?.name))?node:null):
  SEOHA_HELD.has(m?.name)?node+':'+m.name:null;
}
// Tinted from published R302 or the two hidden forms' native presentation colors.
// Each tuple is [drift rate, horizontal asymmetry, vertical offset, stroke width, gathering cadence].
const SPIRIT_SHAPE={
 hwando:[1.64,.12,.03,.28,.83],seoha:[2.18,-.13,.16,.24,1.02],neon:[3.04,-.05,.10,.24,1.36],
 lauren:[1.38,.19,.02,.32,.67],michaela:[1.20,-.15,-.06,.32,.70],slayer:[1.84,.12,-.14,.31,1.12],
 hunter:[2.72,.18,-.03,.24,1.24],gunner:[2.38,.16,.06,.25,1.18],persona:[2.02,-.17,.07,.28,.95],
 ego:[1.18,.14,.14,.34,.65]
};
const SPIRIT_COLOUR={
 hwando:[0xd6deea,0xffc648],seoha:[0x78ceff,0xe2e8f2],neon:[0x3ee6c1,0xe2e8f2],
 lauren:[0xa462ff,0xe2e8f2],michaela:[0xb21a3e,0xe2e8f2],slayer:[0xde1634,0xe2e8f2],
 hunter:[0xff6028,0xe2e8f2],gunner:[0x467cff,0xe2e8f2],persona:[0xcc3428,0xffb08c],
 ego:[0xc8323f,0xf2c3c8]
};
const spirits=new WeakMap(),spiritMaps=new WeakMap(),spiritCorners=[[-1,-1],[1,-1],[1,1],[-1,1]];
const spiritClamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
function cachedSpiritImage(p,asked){
 const row=typeof readyImage==='function'?readyImage(p):null;
 if(row?.image)return row.image;
 if(!asked.has(p)&&typeof addImage==='function'&&(typeof imageCache==='undefined'||!imageCache.has(p))){
  asked.add(p);addImage(p,'3D hero spirit paint');
 }
 return null;
}
function spiritArt(T,now){
 let a=spiritMaps.get(T);if(!a){a={map:null,checked:-Infinity,asked:new Set()};spiritMaps.set(T,a);}
 if(a.map||now>=a.checked&&now-a.checked<.25)return a.map;
 a.checked=now;
 const flame=cachedSpiritImage(SPIRIT_ATLAS,a.asked),orb=cachedSpiritImage(SPIRIT_ORB,a.asked);
 if(!flame||!orb||(flame.naturalWidth||flame.width)!==768||(flame.naturalHeight||flame.height)!==288||
   (orb.naturalWidth||orb.width)!==64||(orb.naturalHeight||orb.height)!==64)return null;
 // Neutral R106 artwork only; compose/upload once. Color stays per vertex in one scene draw.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=288;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.globalAlpha=.7;ctx.drawImage(flame,0,0);ctx.globalAlpha=.87;
 for(let i=0;i<4;i++)ctx.drawImage(orb,i*192+40,137+i%2*5,112,112);
 const m=new T.CanvasTexture(canvas);m.name='R106 flame + orb / shared hero spirit paint';m.colorSpace=T.SRGBColorSpace;
 m.generateMipmaps=false;m.minFilter=T.LinearFilter;m.magFilter=T.LinearFilter;a.map=m;return m;
}
function makeSpirit(T,g,model,id){
 const geo=new T.BufferGeometry(),pos=new T.BufferAttribute(new Float32Array(36),3),uv=new T.BufferAttribute(new Float32Array(24),2),
  colors=new T.BufferAttribute(new Float32Array(48),4);
 pos.setUsage(T.DynamicDrawUsage);uv.setUsage(T.DynamicDrawUsage);colors.setUsage(T.DynamicDrawUsage);
 geo.setAttribute('position',pos);geo.setAttribute('uv',uv);geo.setAttribute('color',colors);
 geo.setIndex([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11]);geo.setDrawRange(0,0);
 const mat=new T.MeshBasicMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false,vertexColors:true});
 const mesh=new T.Mesh(geo,mat);mesh.name='hero-spirit-light-batch';mesh.visible=false;mesh.frustumCulled=false;mesh.layers.set(HOST_LAYER);
 const head=model.getObjectByName(id==='hwando'?'Head_Hood':'Head'),[c0,c1]=SPIRIT_COLOUR[id];
 g.add(mesh);spirits.set(g,{mesh,head,pos,uv,colors,c0:new T.Color(c0),c1:new T.Color(c1),
  shape:SPIRIT_SHAPE[id],center:new T.Vector3(),right:new T.Vector3(),up:new T.Vector3(),inv:new T.Quaternion(),
  now:NaN,until:-Infinity,skill:0,ult:0,phase:'hidden',pulses:0,echo:false,rampUntil:-Infinity});
}
function hideSpirit(g){
 const s=g&&spirits.get(g);if(!s)return;
 s.mesh.visible=false;s.phase='hidden';s.now=NaN;s.until=s.rampUntil=-Infinity;s.skill=s.ult=0;s.echo=false;
}
function quadSpirit(s,n,dx,dy,w,h,turn,frame,col,a){
 const p=s.pos.array,u=s.uv.array,c=s.colors.array,cs=Math.cos(turn),sn=Math.sin(turn);
 const x=s.center.x+s.right.x*dx,y=s.center.y+s.right.y*dx+dy,z=s.center.z+s.right.z*dx;
 // One texel inset per cell; the original four paintings are separated and intact.
 const l=(frame*192+1)/768,r=((frame+1)*192-1)/768,b=1/288,t=1-b;
 for(let i=0;i<4;i++){
  const v=n*4+i,ox=spiritCorners[i][0]*w*.5,oy=spiritCorners[i][1]*h*.5;
  const xx=ox*cs-oy*sn,yy=ox*sn+oy*cs,j=v*3,k=v*2,q=v*4;
  p[j]=x+s.right.x*xx+s.up.x*yy;p[j+1]=y+s.right.y*xx+s.up.y*yy;p[j+2]=z+s.right.z*xx+s.up.z*yy;
  u[k]=i===1||i===2?r:l;u[k+1]=i>=2?t:b;
  c[q]=col.r;c[q+1]=col.g;c[q+2]=col.b;c[q+3]=a;
 }
}
function updateSpirit(T,g,camera,p,now,opacity,act,atk,echoed=false){
 const s=spirits.get(g);if(!s)return;
 if(!g.visible||p.visible===false||p.disabled===true||p.dead===true||p.hp<=0||opacity<.03){hideSpirit(g);return;}
 const map=spiritArt(T,now);if(!map){s.mesh.visible=false;return;}
 if(!s.mesh.material.map){s.mesh.material.map=map;s.mesh.material.needsUpdate=true;}
 // If time moves back on reload/region transition, throw away any stale spark, not world state.
 if(!Number.isFinite(s.now)||now<s.now){s.until=s.rampUntil=-Infinity;s.skill=s.ult=0;s.echo=false;}
 const skill=Math.max(0,Number(p.skillAnim)||0),ult=Math.max(0,Number(p.ultimateAnim)||0);
 if(skill>s.skill+.035||ult>s.ult+.035){s.until=now+(ult>s.ult+.035?.74:.54);s.pulses++;}
 if(s.echo!==echoed){s.echo=echoed;s.rampUntil=now+.14;}
 s.now=now;s.skill=skill;s.ult=ult;
 const [rate,bias,lift,width,cadence]=s.shape,spin=now*rate;
 const charge=Number.isFinite(s.until)?spiritClamp((s.until-now)*1.85,0,1):0;
 const contact=act==='attack'&&atk>=0?Math.sin(Math.PI*spiritClamp(atk/.5,0,1)):0;
 const pulse=Math.max(charge,contact),crest=spiritClamp(pulse*(.82+.18*Math.sin(spin*cadence)),0,1);
 if(s.head){s.head.getWorldPosition(s.center);g.worldToLocal(s.center);s.center.y=spiritClamp(s.center.y,1.02,1.75);}
 else s.center.set(0,SPIRIT_FALLBACK_Y,0);
 s.inv.copy(g.quaternion).invert();
 s.right.setFromMatrixColumn(camera.matrixWorld,0).applyQuaternion(s.inv);
 s.up.setFromMatrixColumn(camera.matrixWorld,1).applyQuaternion(s.inv);
 const i=(Math.floor(now*8*cadence)%4+4)%4,returnBeat=spiritClamp((s.rampUntil-now)/.14,0,1),
  draw=opacity*spiritClamp((s.echo?.47:.71)+crest*.24+returnBeat*.21,0,1);
 // Small ellipse anchored to one shoulder; horizontal travel stays on its own side.
 const sx=-.49+bias*.32+.055*Math.cos(spin)-.05*crest,sy=.11+lift+.07*Math.sin(spin)+.06*crest;
 // The hero carries one tinted shoulder companion. A cast can briefly trail a smaller
 // attached flare beside that orb; the opposite shoulder never holds a second companion.
 quadSpirit(s,0,sx,sy,width*(1+.16*crest),.34+.13*crest,-.25+.19*Math.sin(spin),i,s.c0,draw);
 const extra=crest>.10;
 if(extra)quadSpirit(s,1,sx-.09,sy+.17,.10,.18+crest*.08,-bias*1.2,(i+1)%4,s.c1,draw*crest*.56);
 s.mesh.geometry.setDrawRange(0,extra?12:6);s.pos.needsUpdate=s.uv.needsUpdate=s.colors.needsUpdate=true;
 s.phase=charge>0?'cast':contact>0?'attack':'idle';s.mesh.visible=true;
}
function spiritSnapshot(g){const s=g&&spirits.get(g);return s?{phase:s.phase,visible:!!g.visible&&s.mesh.visible,batches:s.mesh.visible&&g.visible?1:0,strokes:s.mesh.visible?s.mesh.geometry.drawRange.count/6:0,pulses:s.pulses,depthTest:s.mesh.material.depthTest,depthWrite:s.mesh.material.depthWrite}:null;}
// 먹 테두리(뒤집은 껍질): 2D 영웅의 붉은 먹 외곽선처럼 몸 둘레를 감싸 한지 바닥에서 읽히게 한다(7분야 심사: 3D 몸이 바닥색에 묻힘).
const INK={color:0x3a1612,width:.024};
function inkShell(mesh){const w=(INK.width/Math.max(1e-9,Math.abs(mesh.scale.x)||1)).toFixed(6)/* gltfpack 양자화 메시는 노드 scale 이 아주 작다 → 몸 로컬 단위로 바꾼다 */,m=new T.MeshBasicMaterial({color:INK.color,side:T.BackSide,transparent:false,depthTest:true,depthWrite:true});m.userData.r1305Ink=true;
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+String.fromCharCode(10)+'#if defined( USE_SKINNING )'+String.fromCharCode(10)+'transformed += normalize( objectNormal ) * '+w+';'+String.fromCharCode(10)+'#endif');};m.customProgramCacheKey=()=>'r1305-ink-shell-v2|'+w;
 const shell=new T.SkinnedMesh(mesh.geometry,m);shell.name='r1305-ink-shell';shell.bind(mesh.skeleton,mesh.bindMatrix);shell.bindMode=mesh.bindMode;shell.frustumCulled=false;shell.castShadow=shell.receiveShadow=false;shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.copy(mesh.scale);shell.renderOrder=mesh.renderOrder-1;
 mesh.parent.add(shell);mats.push(m);stats.inkShells++;return shell;}
const attackVariants=Object.create(null);
const stats={heroCalls:0,wrapHero:0,heroImgs:0,frames:0,drawn:0,hidden:0,cleared:0,errors:0,requests:0,bytes:0,fetchMs:null,parseMs:null,loadMs:null,bodyFrames:0,heroFxFrames:0,lastHeroImages:0,lastBodies:0,lastHeroFx:0,lastBodyAlpha:null,lastNoBody:null,ghostsHidden:0,heroSwitches:0,weaponMeshes:0,inkShells:0};
let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
let on=false;try{on=localStorage.getItem(KEY)==='on';}catch(_){}
try{if(/[?&]hwando3d=1\b/.test(location.search))on=true;}catch(_){}

let T=null,loading=null,ready=false,loadFailed=false,group=null,model=null,hostRenderer=null;
let mixer=null,actions={},mats=[],lastBox=null,yaw=0,yawTarget=0,lastAction='idle',lastT=NaN,lastDir=null,curAct=null;
let HERO='hwando',CLIP={idle:'Idle',walk:'Walk',attack:'Attack_DiagonalSlash'};
// 영웅마다 로드·동작 상태를 따로 둔다. 아래 함수들은 '지금 영웅' 변수만 보므로 영웅이 바뀌면 통째로 바꿔 끼운다.
const rigs={};
function saveRig(){const cur=rigs[HERO]||(rigs[HERO]={});Object.assign(cur,{loading,ready,loadFailed,group,model,mixer,actions,mats,yaw,yawTarget,lastAction,lastT,lastDir,curAct,atkT,lastAtk,wts});}
function useHero(id){if(!HEROES[id]||id===HERO)return;saveRig();hide();
 const n=rigs[id]||(rigs[id]={loading:null,ready:false,loadFailed:false,group:null,model:null,mixer:null,actions:{},mats:[],yaw:0,yawTarget:0,lastAction:'idle',lastT:NaN,lastDir:null,curAct:null,atkT:-1,lastAtk:0,wts:{idle:1,walk:0,attack:0}});
 HERO=id;CLIP={idle:'Idle',walk:'Walk',attack:HEROES[id].attack};({loading,ready,loadFailed,group,model,mixer,actions,mats,yaw,yawTarget,lastAction,lastT,lastDir,curAct,atkT,lastAtk,wts}=n);caught=null;stats.heroSwitches++;}
// 페르소나·EGO 는 player.hero 값이 아니라 형상이다: 페르소나 = lauren + personaHeroR1113, EGO = hwando + egoSovereignR1046(R1046 formActive).
function heroKey(){try{if(typeof player==='undefined'||!player)return null;const h=player.hero;
 if(h==='lauren'&&player.personaHeroR1113===true)return'persona';
 if(h==='hwando'&&player.egoSovereignR1046===true&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.()!==false)return'ego';return h;}catch(_){return null;}}
function syncHero(){try{const h=heroKey();if(h&&HEROES[h]&&h!==HERO)useHero(h);}catch(e){fail(e);}}
const currentHost=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T&&r?.projection?r:null;};
function attach(r){if(!r||!group)return false;hostRenderer=r;T=r.T;if(group.parent!==r.scene){group.removeFromParent();r.scene.add(group);}group.layers.set(HOST_LAYER);group.traverse(o=>o.layers?.set(HOST_LAYER));return true;}
function toneMaterial(source,weapon=false){const m=source.clone();m.transparent=false;m.depthTest=true;m.depthWrite=true;m.side=T.DoubleSide;m.forceSinglePass=true;m.userData.r1305Weapon=weapon;
 const glow=!!m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity??1)>.05;
 if(weapon){if('metalness'in m)m.metalness=WEAPON.metalness;if('roughness'in m)m.roughness=WEAPON.roughness;if(!glow&&m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}}
 else{if('metalness'in m)m.metalness=0;if('roughness'in m)m.roughness=Math.max(.78,m.roughness||0);if(m.emissive){m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;}}
 m.alphaTest=Math.max(.005,m.alphaTest||0);
 const old=m.onBeforeCompile,key=m.customProgramCacheKey;m.onBeforeCompile=function(shader,...a){old?.call(this,shader,...a);shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
float r1304Luma=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
gl_FragColor.rgb=clamp((mix(vec3(r1304Luma),gl_FragColor.rgb,.62)*1.12-.5)*1.04+.5,0.0,1.0);`);};m.customProgramCacheKey=function(){return(key?.call(this)||'')+'|r1304-hanji-tone-v1';};m.needsUpdate=true;mats.push(m);return m;}
function load(r=currentHost()){
 if(ready){attach(r);return Promise.resolve(group);}if(loading)return loading;if(loadFailed||!r)return Promise.resolve(null);T=r.T;const id=HERO,GLB=HEROES[id].glb,started=performance.now(),fetchStarted=performance.now();stats.requests++;
 const original=fetch(GLB,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('GLB HTTP '+response.status);return response.arrayBuffer();}).then(data=>{
  // Keep original stock-fetch telemetry scoped to the actual network transfer;
  // the optional patch is fetched in parallel and must not inflate this metric.
  stats.fetchMs=Math.round((performance.now()-fetchStarted)*10)/10;stats.bytes=data.byteLength;
  return data;
 });
 const graft=window.__STORYWORLD_HERO_ATTACK_R1306__,patchPath=graft?.path(id);
 // Parallel, lazy, one hero only. If the versioned patch is missing or stale, the unchanged
 // R1305 model still works (including for a client with an older cached GLB).
 const delta=patchPath?fetch(patchPath,{credentials:'same-origin'}).then(async response=>{
  if(!response.ok)throw Error('HTTP '+response.status);
  const body=await response.text();
  if(body.length>650000)throw Error('payload size');
  return JSON.parse(body);
 }).catch(()=>null):Promise.resolve(null);
 const bytes=Promise.all([original,delta]).then(async ([base,patch])=>{
  if(!patch)return {base,data:base,variant:patchPath?'stock-fallback':'stock'};
  try{return {base,data:await graft.graft(base,patch,id,HEROES[id].attack),variant:'r1306'};}
  catch(_){return {base,data:base,variant:'stock-fallback'};}
 });
 loading=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/libs/meshopt_decoder.module.js'),bytes]).then(async([{GLTFLoader},{MeshoptDecoder},bytes])=>{const parseStarted=performance.now(),base=new URL('.',new URL(GLB,document.baseURI)).href;await MeshoptDecoder.ready;const parse=data=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data,base);
  let gltf,variant=bytes.variant;
  try{gltf=await parse(bytes.data);}
  catch(e){if(bytes.data===bytes.base)throw e;gltf=await parse(bytes.base);variant='stock-fallback';}
  attackVariants[id]=variant;stats.parseMs=Math.round((performance.now()-parseStarted)*10)/10;
  if(id!==HERO)throw Error('hero switched during load');model=gltf.scene;model.name='r1305-'+id+'-3d-model';model.traverse(o=>{o.layers?.set(HOST_LAYER);if(o.isMesh){const weapon=!o.isSkinnedMesh;if(weapon)stats.weaponMeshes++;const hidden=heldVisual(o,id);if(hidden){o.visible=false;o.userData.heldSpiritReplacement=hidden;}o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(x=>toneMaterial(x,weapon)):toneMaterial(o.material,weapon);}});
  {const skinned=[];model.traverse(o=>{if(o.isSkinnedMesh&&!o.material?.userData?.r1305Ink)skinned.push(o);});for(const o of skinned)inkShell(o).layers.set(HOST_LAYER);}
  model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model,true);if(Number.isFinite(bounds.min.y))model.position.y-=bounds.min.y;
  group=new T.Group();group.name='r1305-'+id+'-3d-shared';group.layers.set(HOST_LAYER);group.visible=false;group.add(model);try{makeSpirit(T,group,model,id);}catch(e){fail(e);}attach(r);
  mixer=new T.AnimationMixer(model);for(const[k,n]of Object.entries(CLIP)){const clip=gltf.animations.find(x=>x.name===n);if(!clip)throw Error(id+' GLB 에 클립 없음: '+n);const act=mixer.clipAction(clip);act.play();act.enabled=false;actions[k]={act,clip};}
  stats.loadMs=Math.round((performance.now()-started)*10)/10;ready=true;return group;
 }).catch(e=>{fail(e);const switched=/switched/.test(String(e?.message));if(id===HERO){loadFailed=!switched;loading=null;ready=false;}else if(rigs[id]){rigs[id].loadFailed=!switched;rigs[id].loading=null;rigs[id].ready=false;}throw e;});
 // 켜기 동작이 unhandled rejection을 만들지 않게 내부 실패는 inspect()에 남기고 흡수한다.
 loading.catch(()=>null);return loading;
}

function active(){return on&&typeof player!=='undefined'&&player&&heroKey()===HERO&&!!HEROES[HERO]&&!player.r720Ally&&!player.r949Summon;}
const commandArea=c=>{const p=c?.points;if(!Array.isArray(p)||p.length<3)return 0;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const q of p){if(!Array.isArray(q))continue;x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}return Math.max(0,x1-x0)*Math.max(0,y1-y0);};
const assetKey=value=>{try{return decodeURIComponent(new URL(String(value||''),document.baseURI).pathname).replace(/^\//,'');}catch(_){return String(value||'').replace(/^\.\//,'');}};
// drawHero 범위에는 방어막·오라·사몽 십자도 함께 들어온다. sourcePath가 실제 bodyPath와 같은 행을
// 먼저 고르고, R350/R448의 몸 표지나 영웅 이름 경로만 보조로 쓴다. 모호하면 VFX를 지우지 않고 숨긴다.
const nestedCommands=new WeakSet();
function heroCommands(commands,hint=null){const all=[];for(const c of commands)if(c?.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r945Clone&&!nestedCommands.has(c))all.push(c);if(!all.length)return all;let mine=all;
 const actorRows=(rows,owner)=>{const x=Number(owner?.x),y=Number(owner?.y);let at=rows;if(Number.isFinite(x+y)){const same=at.filter(c=>Math.hypot(Number(c.owner?.x)-x,Number(c.owner?.y)-y)<.002);if(same.length)at=same;}if(owner?.id!=null){const same=at.filter(c=>c.owner?.id===owner.id);if(same.length)at=same;}return at;};
 if(hint)mine=actorRows(mine,hint);
 const exact=mine.filter(c=>c.owner.bodyPath&&assetKey(c.sourcePath)===assetKey(c.owner.bodyPath));if(exact.length)return actorRows(exact,exact[0].owner);
 const marked=mine.filter(c=>(c.spatialRole==='body'||c.r350Lifted)&&(c.mutable||String(c.sourcePath||'').includes(HERO)));if(marked.length)return actorRows(marked,marked[0].owner);
 const named=mine.filter(c=>c.mutable||String(c.sourcePath||'').includes(HERO));return named.length?actorRows(named,named[0].owner):named;}
let caught=null,heroDepth=0,heroWraps=0,heroGeneration=0;
// 뒤에 로드된 영웅 모션 스크립트까지 모두 그린 뒤 첫 본체의 표시 좌표만 기억한다. 여기서 명령을 빼면
// R350/R448이 몸 상자를 못 보고, 재귀 drawHero로 만든 R113/R945 분신까지 사라진다. 실제 제거는 render 직전에 한다.
function wrapHero(){if(typeof drawHero!=='function'||drawHero.__r1304||heroWraps>=8)return;const base=drawHero,generation=++heroGeneration;heroWraps++;stats.wrapHero=heroWraps;const wrappedHero=function(...args){if(generation!==heroGeneration)return base.apply(this,args);const rec=typeof ctx==='object'&&ctx&&Array.isArray(ctx.commands)?ctx.commands:null,start=rec?rec.length:0;if(heroDepth){try{return base.apply(this,args);}finally{if(rec)for(let i=start;i<rec.length;i++)if(rec[i]&&typeof rec[i]==='object')nestedCommands.add(rec[i]);}}
  stats.heroCalls++;const eligible=active(),actorHint=eligible?{x:Number(player.x),y:Number(player.y),id:player.id!=null?'hero:'+player.id:null}:null;heroDepth++;let result;try{result=base.apply(this,args);}finally{heroDepth--;}
  try{if(rec&&eligible&&ready&&!caught){const bodies=heroCommands(rec.slice(start),actorHint);if(bodies.length){const body=bodies.reduce((a,c)=>commandArea(c)>commandArea(a)?c:a);caught={owner:{...body.owner}};}}}catch(e){fail(e);}return result;};wrappedHero.__r1304=true;drawHero=wrappedHero;}

const ATK_SEC=.5,FADE_SEC=.12,ATK_FADE_IN=.05,WALK_REF=4,YAW_RATE=9;
let wts={idle:1,walk:0,attack:0},atkT=-1,lastAtk=0;
function action(){const a=+player.attackAnim||0;if(a>lastAtk+1e-4&&(atkT<0||atkT>ATK_SEC*.7))atkT=0;lastAtk=a;if(a>0&&atkT<0)atkT=0;if(atkT>=0&&atkT<ATK_SEC&&!(player.moving&&a<=0))return'attack';atkT=-1;return player.moving?'walk':'idle';}
// Phase two: real 2D body pose only. RenderBridge events are already emitted by gameplay;
// never call an attack function, move the player or create an actor/projectile here.
const echoState=new WeakMap();
const ECHO_HEROES=new Set(['hwando','slayer','hunter']);
const RANGED_BASIC=new Set(['hunter']);
const ECHO_LIFE={attack:.40};
const SIDE_ART=Object.freeze({
 hwando:{left:['assets/r283/hwando/r271/attack-e.webp',3456,214,288,214,140.8,204.5,185,12,6,true,[50,80,100,110,130,250]],
         right:['assets/r283/hwando/r271/attack-e.webp',3456,214,288,214,140.8,204.5,185,12,6,false,[50,80,100,110,130,250]]},
 slayer:{left:['assets/r351/slayer/attack-w.webp',1350,196,225,196,140.9,191,180,6,3,false,[80,150,300]],
         right:['assets/r389/slayer/attack-e.webp',1536,256,384,256,192,226,180,4,2,false,[80,450]]},
 hunter:{left:['assets/r425/hunter/attack-l.webp',768,512,192,256,120,235,201,4,4,false,[110,140,220]],
         right:['assets/r425/hunter/attack-r.webp',768,512,192,256,72,235,201,4,4,false,[110,140,220]]}
});
const sideArtAsked=new Set();
function loadSideArt(id){
 const authored=SIDE_ART[id];
 if(authored)for(const art of Object.values(authored))cachedSpiritImage(art[0],sideArtAsked);
}
function chooseEchoSide(origin,aim,last){
 const lateral=sameXY(aim)?(aim.x-origin.x)-(aim.y-origin.y):0;
 return Math.abs(lateral)>.06?(lateral<0?'left':'right'):(last==='left'?'left':'right');
}
// Native world units are tiles (the engine's Euclidean distance()). One recall per short echo.
const ECHO_LEASH=Object.freeze({ranged:2.4,melee:4.7,resetMargin:.40,minLeft:.085});
const ECHO_RETURN_OFFSETS=[[.56,-.56],[-.56,.56],[.61,.22],[-.61,-.22],[.22,.61],[-.22,-.61]];
function clearEcho(s){s.placed=null;s.until=-Infinity;s.poseCache=null;s.firstDrawAt=null;s.leash=null;s.acceptedAt=null;s.retainPose=false;}

function readSummonAction(p){
 const m=window.__STORYWORLD_HERO_MOTION_R895__?.sample?.();
 if(!m)return null;
 if(p.ultimateAnim>0||p.skillAnim>0)return null;
 if(p.attackAnim>0)return {mode:'attack',at:m.atkT0};
 return null;
}
function sameXY(v){return !!v&&Number.isFinite(v.x)&&Number.isFinite(v.y);}
// Keep provenance out of gameplay and off the native event object. The bridge emits the
// launch inside makeShot; the stock outer adapter supplies authored muzzle and action data
// before returning. The projectile can hit/despawn before the next render, so track the
// exact already-emitted event object, not its later position or a snapshot of live shots.
const summonLaunchProvenance=new WeakMap();
function observeSummonLaunch(stream,previous,shot,p,r,now,action){
 const muzzle=shot?.currentPublicMuzzle,native=shot?.e568HeroActionContext;
 if(!p||!r||!RANGED_BASIC.has(p.hero)||!shot?.friendly||shot.owner!=='hero'||shot.r564Clone||
    !Number.isSafeInteger(shot.id)||!sameXY(shot)||
    !native||native.kind!=='attack'||native.heroId!==p.hero||
    muzzle?.applied&&(!sameXY(muzzle)||muzzle.x!==shot.x||muzzle.y!==shot.y||muzzle.castAt!==native.at)||
    !action||action.id!==native.id||action.at!==native.at||action.kind!==native.kind||
    !/^e568:attack:[1-9]\d*$/.test(native.id))return;
 const id='shot:'+shot.id,receipt=stream?.since(previous)?.find(e=>e.type==='projectile-spawn'&&
  e.hero===p.hero&&e.id===id&&e.at===now&&e.x===shot.x&&e.y===shot.y&&e.vx===shot.vx&&e.vy===shot.vy);
 if(receipt)summonLaunchProvenance.set(receipt,{p,r,castAt:native.at,authored:muzzle?.applied===true});
}
if(typeof makeShot==='function'){
 const stock=makeShot;
 makeShot=function(...args){
  const p=player,r=room,at=time,action=typeof e568HeroActionContext==='object'?e568HeroActionContext:null;
  const stream=window.__STORYWORLD_PHASE1__?.controller?.bridge?.events,previous=stream?.serial;
  const shot=stock.apply(this,args);
  if(Number.isSafeInteger(previous))try{observeSummonLaunch(stream,previous,shot,p,r,at,action);}catch(e){fail(e);}
  return shot;
 };
}
function isNativeBasicLaunch(e,p,dispatch,origin){
 const proof=summonLaunchProvenance.get(e);
 return !!(proof&&proof.p===p&&proof.r===room&&dispatch?.hero===p.hero&&dispatch.state==='attack'&&
  dispatch.at===proof.castAt&&e.at>=dispatch.at&&e.at<=dispatch.at+.12&&
  (proof.authored||Math.hypot(e.x-origin.x,e.y-origin.y)<1.9));
}
function nativeEvidence(frame,p,id,mode,at,origin,dispatch){
 const within=e=>e?.hero===p.hero&&Number.isFinite(e.at)&&e.at>=at-.065&&e.at<=at+.12&&sameXY(e);
 const hits=[];
 let fired=null;
 for(const e of frame.events||[]){
  if(!within(e))continue;
  if(e.type==='projectile-spawn'&&!fired&&RANGED_BASIC.has(id)&&
   Number.isSafeInteger(e.serial)&&e.serial>0&&isNativeBasicLaunch(e,p,dispatch,origin))fired=e;
  if(e.type==='confirmed-hit'&&e.target!=null&&e.damage>0&&
   (mode==='attack'?e.kind==='attack':e.kind==='skill'||/^story(?:-wer|-hwando-chain)/.test(e.kind||'')))hits.push(e);
 }
 // A ranged attack pose is not proof that the native engine actually spawned a shot.
 // Leave the shoulder cast running while waiting for an attributable RenderBridge receipt.
 if(mode==='attack'&&RANGED_BASIC.has(id))return fired?{type:'ranged',e:fired}:null;
 // Native melee confirmation wins over incidental secondary projectiles.
 if(hits.length){
  const selected=typeof target!=='undefined'?target:null;
  const preferred=selected!=null?hits.find(e=>e.target===selected):null;
  const actions=window.__STORYWORLD_CURRENT_HERO__?.actions?.(p);
  const match=actions?.findLast(a=>a.hero===p.hero&&a.state===mode&&Math.abs(a.at-at)<.065);
  const source=preferred||(match?.target?hits.find(e=>e.target===match.target.id):null)||(hits.length===1?hits[0]:null);
  if(source)return {type:'melee',e:source};
 }
 return null; // unresolved/non-selected melee, no hit or aim-only sentinel: do not invent an enemy
}
function openSummon(origin,o){
 if(!sameXY(o)||typeof blocked!=='function'||typeof clearLine!=='function')return false;
 return !blocked(o.x,o.y,.16)&&clearLine(origin,o);
}
function summonPlacement(mode,ev,origin,side){
 if(ev.type==='ranged'){
  for(const d of [side,-side]){const o={x:origin.x+d*.46,y:origin.y-d*.46,height:origin.height};
   if(openSummon(origin,o))return o;
  }
  return null;
 }
 const e=ev.e,dx=e.x-origin.x,dy=e.y-origin.y,n=Math.hypot(dx,dy);
 // Actual combat range is the engine profile; the inner HEROES table is visual rigs only.
 const profile=ENGINE_HEROES?.[player?.hero];
 if(n<.35||mode==='attack'&&(!Number.isFinite(profile?.range)||n>profile.range+.65))return null;
 if(typeof clearLine!=='function'||!clearLine(origin,e))return null;
 const o={x:e.x-dx/n*.38,y:e.y-dy/n*.38,height:0};
 return openSummon(origin,o)?o:null;
}
function resetSummon(g,inhibit=false){
 const s=g&&echoState.get(g);if(s){const prev=s.token||s.noReplayToken;clearEcho(s);s.token=null;s.now=null;s.noReplayToken=inhibit?prev:null;s.actionFloor=null;s.echoed=false;s.lastSource=null;s.family=s.mode=s.event=s.acceptLatency=s.nativeSlots=s.suppressedToken=s.inkContacts=null;}
}
function planSummon(g,frame,body,id,p,now){
 let s=echoState.get(g);if(!s){s={now:null,token:null,placed:null,until:-Infinity,echoed:false,lastSource:null};echoState.set(g,s);}
 const r=typeof room==='object'?room:null,mode=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();
 const scopeChanged=s.room!==r||s.p!==p||s.zone!==frame?.zone||s.layer!==frame?.layer;
 if(scopeChanged||s.now!=null&&now<s.now){const existed=s.p!=null;resetSummon(g);Object.assign(s,{room:r,p,zone:frame?.zone,layer:frame?.layer,actionFloor:existed?now:null,side:null});}
 s.now=now;s.echoed=false;s.lastSource=null;
 const a=readSummonAction(p);
 const actionValid=a&&Number.isFinite(a.at)&&a.at>=0&&now-a.at>=-.04&&now-a.at<=ECHO_LIFE[a.mode];
 const token=actionValid?a.mode+':'+a.at:null;
 if(!ECHO_HEROES.has(id)||p.skillAnim>0||p.ultimateAnim>0||!r||!frame?.ready||frame.paused||body.owner?.alive===false||p.hp<=0||p.visible===false||p.disabled===true||p.dead===true||p.dashAnim>0||mode&&mode!=='off'){
  if(token||s.token)s.noReplayToken=token||s.token;clearEcho(s);return s;
 }
 if(s.placed&&now>=s.until)clearEcho(s);
 if(s.placed&&s.mode==='attack'&&p.hurtAnim>0){s.noReplayToken=s.token;clearEcho(s);return s;}
 // Native walk/pose cancellation no longer fakes a relocation: the *existing* imprint can keep
 // its last real pose until its original expiry. Never create a new echo from a canceled action.
 if(s.placed&&(!token||token===s.token)){s.retainPose=!!p.moving;return s;}
 if(!actionValid||token===s.noReplayToken||s.actionFloor!=null&&a.at<s.actionFloor)return s;
 const age=Math.max(0,now-a.at);
 if(s.token!==token){clearEcho(s);s.token=token;s.until=a.at+ECHO_LIFE[a.mode];s.initial={x:body.owner.x,y:body.owner.y,height:Number(body.owner.renderHeight)||0};s.mode=a.mode;s.at=a.at;}
 if(p.moving&&age>(a.mode==='attack'?.12:.18)||a.mode==='attack'&&p.hurtAnim>0){s.noReplayToken=token;clearEcho(s);return s;}
 if(age>.12||s.placed||!sameXY(s.initial)||now>=s.until)return s;
 const origin=s.initial,dispatch=window.__STORYWORLD_CURRENT_HERO__?.actions?.(p);
 const exact=dispatch?.findLast(row=>row.hero===p.hero&&row.state===a.mode&&Math.abs(row.at-a.at)<.065&&sameXY(row.origin));
 if(exact){origin.x=exact.origin.x;origin.y=exact.origin.y;}
 const ev=nativeEvidence(frame,p,id,a.mode,a.at,origin,exact);
 if(!ev)return s;
 const o=summonPlacement(a.mode,ev,origin,p.direction==='left'?-1:1);
 if(o){s.placed=o;s.family=ev.type;s.event=ev.e?.serial??null;s.acceptedAt=Math.max(a.at,ev.e?.at??a.at);
  const aim=ev.type==='melee'?ev.e:(sameXY(exact?.target)?exact.target:
   Number.isFinite(ev.e?.vx+ev.e?.vy)?{x:origin.x+ev.e.vx,y:origin.y+ev.e.vy}:null);
  s.side=chooseEchoSide(origin,aim,s.side);
  s.acceptLatency=now-(ev.e?.at??a.at);s.direction=s.side;s.leash={phase:'fixed',count:0};}
 return s;
}
function authoredSidePose(id,side,base,proj,now,at){
 const A=SIDE_ART[id]?.[side];
 if(!A||!base?.owner||!Number.isFinite(now+at))return null;
 const [path,iw,ih,cw,ch,ax,ay,body,cols,start,mirror,durations]=A;
 const image=cachedSpiritImage(path,sideArtAsked);
 if(!image||(image.naturalWidth||image.width)!==iw||(image.naturalHeight||image.height)!==ih)return null;
 let elapsed=Math.max(0,now-at)*1000,frame=start;
 for(let i=0;i<durations.length-1&&elapsed>=durations[i];i++){elapsed-=durations[i];frame++;}
 const from=proj.worldToScreen(base.owner.x,base.owner.y);
 if(!sameXY(from))return null;
 const scale=(typeof actorHeight==='function'?actorHeight():66)*.98/body;
 const X=x=>from.x+(mirror?-1:1)*(x-ax)*scale,Y=y=>from.y+(y-ay)*scale;
 return {...base,image,sourcePath:path,sourceRect:[frame%cols*cw,Math.floor(frame/cols)*ch,cw,ch],imageSize:[iw,ih],
  points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],mutable:false,clips:[],immutableTint:null};
}
function echoReturnAnchor(r,frame,owner,side,cache){
 const v=frame?.viewport,w=r?.projection,q=w?.worldToScreen;
 const W=v?.width,H=v?.height;
 if(!sameXY(owner)||!Number.isFinite(W)||!Number.isFinite(H)||W<32||H<32||typeof q!=='function'||
    typeof blocked!=='function'||typeof clearLine!=='function')return null;
 const foot=q.call(w,owner.x,owner.y),scale=(Number(w.tile)||1)*(Number(w.zoom)||1)/cache.k;
 const onScreen=(x,y,pad=0)=>Number.isFinite(x+y)&&x>=pad&&x<=W-pad&&y>=pad&&y<=H-pad;
 if(!sameXY(foot)||!onScreen(foot.x,foot.y)||!Number.isFinite(scale)||scale<=0)return null;
 for(const [dx,dy] of ECHO_RETURN_OFFSETS){
  const dest={x:owner.x+dx*side,y:owner.y+dy*side,height:Number(owner.renderHeight)||0};
  const screen=q.call(w,dest.x,dest.y);
  if(sameXY(screen)&&cache.points.every(([x,y])=>onScreen(screen.x+x*scale,screen.y+y*scale,5))&&
     !blocked(dest.x,dest.y,.29)&&clearLine(owner,dest))return dest;
 }
 return null;
}
function updateEchoLeash(r,frame,s,owner,now){
 const l=s.leash,limit=ECHO_LEASH[s.family];
 if(!l||!Number.isFinite(limit)||!s.poseCache||!sameXY(owner)||!s.placed||l.count||l.phase==='recalled')return;
 const gap=Math.hypot(owner.x-s.placed.x,owner.y-s.placed.y);
 if(l.phase==='fixed'&&gap>limit)l.phase='pending';
 else if(l.phase==='pending'&&gap<limit-ECHO_LEASH.resetMargin)l.phase='fixed';
 if(l.phase!=='pending')return;
 const safeAt=Math.max(s.acceptedAt+(s.family==='melee'?.19:.085),s.firstDrawAt+(s.family==='melee'?.075:.04));
 if(now<safeAt)return; // never pull a committed swing off its impact frame
 if(s.until-now<ECHO_LEASH.minLeft){
  l.phase='recalled';l.reason='recovery-ended';s.placed=null;s.noReplayToken=s.token;return;
 }
 const dest=echoReturnAnchor(r,frame,owner,s.direction==='left'?-1:1,s.poseCache);
 if(!dest){l.phase='recalled';l.reason='no-safe-visible-foot';s.placed=null;s.noReplayToken=s.token;return;}
 s.placed=dest;l.phase='warped';l.count=1;l.warpAt=now;
}
function echoCommand(r,s,rows,id,now,frame=null,owner=null){
 if(!s?.placed||!r?.projection?.worldToScreen)return null;
 updateEchoLeash(r,frame,s,owner,now);
 if(!s.placed)return null;
 const base=rows.reduce((best,c)=>!best||commandArea(c)>commandArea(best)?c:best,null);
 const original=authoredSidePose(id,s.side||s.direction||'right',base,r.projection,now,s.acceptedAt??s.at);
 const w=r.projection,a=s.placed,to=w.worldToScreen(a.x,a.y);
 if(!sameXY(to))return null;
 const k=(Number(w.tile)||1)*(Number(w.zoom)||1);let nativeCrop=null;
 if(original){
  const b=original.owner,from=w.worldToScreen(b.x,b.y);
  if(sameXY(from)){
   const pose={...original,owner:{...original.owner},style:{...original.style},sourceRect:original.sourceRect.slice()};
   // Capture native pose relative to its feet, not stale canvas coordinates. Existing moving
   // actor/scene never reused. If the native body plays Walk, retain only this genuine frame.
   nativeCrop=original.sourceRect;s.poseCache={pose,k,points:original.points.map(p=>[p[0]-from.x,p[1]-from.y])};
  }
 }
 const cached=s.poseCache;if(!cached)return null;
 const pose=cached.pose,scale=k/cached.k;
 const fade=Math.max(0,Math.min(1,(s.until-now)/.09))*(s.family==='melee'?1:Math.min(1,.64+Math.max(0,now-s.at)*6));
 if(fade<=0)return null;
 if(s.firstDrawAt==null)s.firstDrawAt=now;
 s.echoed=true;s.lastSource=String(pose.sourcePath||'');s.lastFrame=pose.sourceRect[0];
 return {...pose,sourceRect:nativeCrop||pose.sourceRect,key:'summoner-echo:'+id,spatialRole:'body',summonerEcho:true,
  owner:{...pose.owner,id:'summoner-echo:'+id,x:a.x,y:a.y,renderHeight:a.height},
  style:{...pose.style,globalAlpha:(pose.style?.globalAlpha??1)*fade,globalCompositeOperation:'source-over'},
  points:cached.points.map(p=>[to.x+p[0]*scale,to.y+p[1]*scale])};
}
// Recognize already-rendered native clones with their own immutable native slot/lifetime.
 // Never draw them again or re-use their live combat structs. Moving R945 guards are not fixed echoes.
function existingEchoSlots(commands,p,id,now){
 const out={r767:0,r945Fixed:0,r945Moving:0,r1157:0,suppress:false,visibleFixed:0};
 const has=(x,y,predicate)=>commands.some(c=>c?.kind==='image'&&predicate(c)&&Math.hypot(c.owner.x-x,c.owner.y-y)<.025);
 const live=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&a<=now&&now<b;
 const r767=window.__STORYWORLD_CLONE_R767__;
 for(const n of (r767?.live?.()>0?r767.list():[])){
  if(!live(n.t0,n.t0+n.life)||!has(n.x,n.y,c=>c.owner?.kind==='hero'&&nestedCommands.has(c)&&!c.owner.r945Clone))continue;
  out.r767++;out.visibleFixed++;if(now-n.t0<.12)out.suppress=true;
 }
 if(id==='hwando')for(const n of window.__STORYWORLD_HWANDO_INK_R945__?.echoSlots?.(p)||[]){
  if(!live(n.t0,n.ends)||!has(n.x,n.y,c=>c.owner?.r945Clone===true))continue;
  if(n.fixed){out.r945Fixed++;out.visibleFixed++;if(now-n.t0<.12)out.suppress=true;}
  else out.r945Moving++;
 }
 if(id==='ego')for(const n of window.__STORYWORLD_EGO_SUMMON_R1157__?.inspect?.()?.summons||[]){
  if(!live(n.t0,n.until)||!has(n.x,n.y,c=>c.owner?.kind==='hero'&&/^hero:r1157:/.test(String(c.owner.id||''))))continue;
  out.r1157++;out.visibleFixed++;if(now-n.t0<.12)out.suppress=true;
 }
 return out;
}
function echoSnapshot(g){const s=g&&echoState.get(g);return s?{visible:s.echoed,mode:s.mode,family:s.family,x:s.placed?.x??null,y:s.placed?.y??null,
 nativeSlots:s.nativeSlots??null,inkContacts:s.inkContacts??null,leash:s.leash?{...s.leash}:null,side:s.side??null,ttl:s.placed?Math.max(0,s.until-s.now):0,source:s.lastSource,cellX:s.echoed?s.lastFrame:null,nativeEvent:s.event,latency:s.acceptLatency}:null;}
// Preserve all R945 native moving bodies. Decorate only same-tick admitted contacts, not cast intent.
const INK_CONTACT_LIMIT=7;let inkView=1,inkFramePaused=false;
function acceptInkContacts(p){return !inkFramePaused&&active()&&ready&&group?.visible&&HERO==='hwando'&&p===player&&p.hp>0&&!p.dead&&p.visible!==false&&!p.disabled?inkView:0;}
function inkContactCommands(r,frame,body,commands,p,now,mainEcho){
 const metrics={accepted:0,drawn:0,overlap:0,unavailable:0},rows=[];
 const suspended=!frame?.ready||!!frame.paused||body?.owner?.alive===false;
 if(suspended&&!inkFramePaused)inkView++;inkFramePaused=suspended;
 if(!acceptInkContacts(p)||!r?.projection?.worldToScreen)return {rows,metrics};
 const ink=window.__STORYWORLD_HWANDO_INK_R945__,art=window.__STORYWORLD_HWANDO_R271__,proj=r.projection;
 const events=ink?.cloneContacts?.(p,now)||[];
 metrics.accepted=events.length;
 if(!events.length)return {rows,metrics};
 const seen=new Set(),reserved=[];
 if(sameXY(body.owner))reserved.push(body.owner);
 if(sameXY(mainEcho?.owner))reserved.push(mainEcho.owner);
 for(const c of commands)if(c?.kind==='image'&&c.owner?.r945Clone&&sameXY(c.owner))reserved.push(c.owner);
 for(const v of events){
  if(seen.has(v.id)||rows.length>=INK_CONTACT_LIMIT)continue;seen.add(v.id);
  const from={x:v.fromX,y:v.fromY},hostile={x:v.targetX,y:v.targetY},native={x:v.pointX,y:v.pointY};
  if(!sameXY(from)||!sameXY(hostile))continue;
  const dx=hostile.x-from.x,dy=hostile.y-from.y,d=Math.hypot(dx,dy);
  if(d<.2)continue;
  // R945 normally supplies no exact tip point. Use its struck enemy surface projected toward
  // the real scout, pulling the depicted feet a little back toward that scout. No collider.
  const radius=Number.isFinite(v.radius)?Math.max(0,Math.min(v.radius,d-.06)):0;
  const contact=sameXY(native)?native:{x:hostile.x-dx/d*radius,y:hostile.y-dy/d*radius};
  const span=Math.hypot(contact.x-from.x,contact.y-from.y);
  if(span<.27)continue;
  const back=Math.min(.24,span*.35);
  const anchor={x:contact.x+(from.x-contact.x)/span*back,y:contact.y+(from.y-contact.y)/span*back};
  if(!openSummon(from,anchor))continue;
  if(reserved.some(a=>Math.hypot(a.x-anchor.x,a.y-anchor.y)<.28)){metrics.overlap++;continue;}
  const q=proj.worldToScreen(anchor.x,anchor.y),a=proj.worldToScreen(from.x,from.y),b=proj.worldToScreen(hostile.x,hostile.y);
  if(!sameXY(q)||!sameXY(a)||!sameXY(b))continue;
  const west=Math.abs(b.x-a.x)>2?b.x<a.x:window.__STORYWORLD_HWANDO_R277__?.down?.()==='w';
  const age=now-v.at,pose=art?.cloneContactPose?.(west,age);
  if(!pose?.image){metrics.unavailable++;continue;}
  const [ax,ay]=pose.pivot,[,,cw,ch]=pose.sourceRect;
  const scale=(typeof actorHeight==='function'?actorHeight():60)*.91/pose.body,flip=pose.flip?-1:1;
  const X=x=>q.x+flip*(x-ax)*scale,Y=y=>q.y+(y-ay)*scale;
  const alpha=.62*Math.max(0,Math.min(1,(v.ends-now)/.13));
  if(!Number.isFinite(scale)||scale<=0||alpha<=0)continue;
  const id='summoner-ink-contact:'+v.id;
  rows.push({...body,...pose,key:id,mutable:false,immutableTint:null,clips:[],r271:'attack',r121Walk:false,r277Hold:false,r350Lifted:false,summonerEcho:true,inkContact:v.family,contactBasis:sameXY(native)?'native-point':'target-surface-proxy',
   spatialRole:'body',owner:{...body.owner,id,x:anchor.x,y:anchor.y,renderHeight:0},points:[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]],
   style:{...body.style,globalAlpha:alpha,filter:'none',globalCompositeOperation:'source-over'}});
  reserved.push(anchor);
 }
 metrics.drawn=rows.length;return {rows,metrics};
}
const DIR={front:0,down:0,right:Math.PI/2,back:Math.PI,up:Math.PI,left:-Math.PI/2};
function updateModel(r,owner,alpha,frame,echo){if(!attach(r)||!group)return;const h=Math.max(16,typeof actorHeight==='function'?actorHeight():60),p=r.projection,worldScale=h*SCALE/(MODEL_H*p.tile*p.zoom*Math.sqrt(1.5));
 group.visible=true;group.position.set(owner.x,Number(owner.renderHeight)||0,owner.y);group.scale.setScalar(worldScale);
 const now=Number.isFinite(frame?.time)?frame.time:(typeof time==='number'?time:performance.now()/1000),dt=Number.isFinite(lastT)?Math.max(0,Math.min(.1,now-lastT)):0;lastT=now;const act=action(),summonPose=echo?.echoed===true;lastAction=act;const pose=(summonPose&&act==='attack')?(player.moving?'walk':'idle'):act;
 const vx=+player.moveVX150||0,vy=+player.moveVY150||0;if(act==='walk'&&Math.hypot(vx,vy)>1e-3){const sx=vx-vy,sy=(vx+vy)*.5;yawTarget=Math.atan2(sx,sy);}else if(player.direction!==lastDir||act==='attack'){const d=DIR[String(player.direction||'').toLowerCase()];if(d!==undefined)yawTarget=d;}lastDir=player.direction;
 let df=yawTarget-yaw;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;yaw+=df*Math.min(1,dt*YAW_RATE);group.rotation.y=yaw+YAW_CAMERA;
 // No unconditional gain on entry: fixed-time redraws must not jump the silhouette.
 const previousWalk=wts.walk/(wts.idle+wts.walk+wts.attack||1);
 for(const k in wts){const f=k===pose?(k==='attack'?ATK_FADE_IN:FADE_SEC):FADE_SEC;wts[k]=Math.max(0,Math.min(1,wts[k]+(k===pose?1:-1)*dt/f));}const total=wts.idle+wts.walk+wts.attack||1,walkRate=Math.max(.7,Math.min(1.8,Math.hypot(vx,vy)/WALK_REF||1));
 for(const k in actions){const A=actions[k],weight=wts[k]/total;A.act.enabled=weight>1e-3;A.act.setEffectiveWeight(weight);if(k==='attack'){if(pose==='attack'){A.act.time=Math.min(1,atkT/ATK_SEC)*A.clip.duration*.999;}}else if(weight>1e-3||k===pose){if(k==='walk'&&pose==='walk'&&curAct!==pose&&previousWalk<=.002)A.act.time=0;A.act.time=(A.act.time+dt*(k==='walk'?walkRate:1))%A.clip.duration;}}
 const spiritAtk=atkT;if(act==='attack')atkT+=dt;curAct=pose;mixer.update(0);const opacity=Math.max(0,Math.min(1,alpha));for(const m of mats){const solid=opacity>=.98;m.opacity=opacity;m.depthWrite=solid;if(m.transparent===solid){m.transparent=!solid;m.needsUpdate=true;}}group.updateMatrixWorld(true);try{updateSpirit(T,group,r.camera,player,now,opacity,act,spiritAtk,echo?.echoed===true||echo?.nativeSlots?.visibleFixed>0||echo?.inkContacts?.drawn>0);}catch(e){fail(e);hideSpirit(group);}stats.drawn++;
}
// R350 유령(가려질 때 몸 복사)·R448 유령/앞그림은 본체 열쇠 앞에 이 접두어를 붙인 c.owner.r350 명령이다.
const GHOST_PREFIX=['r350:ghost:','r448:ghost:','r448:over:'];
function hide(){if(group?.visible){group.visible=false;inkView++;inkFramePaused=false;stats.cleared++;hideSpirit(group);resetSummon(group,true);}}
const legacyOrbPaintActor=Symbol.for('r101.seoha.legacyOrbActor');
function replaceLegacyShoulderOrb(c,p,id,s,viewMode){
 return id==='seoha'&&(!viewMode||viewMode==='off')&&s?.mesh.visible===true&&
  c?.owner?.r101===true&&c.owner[legacyOrbPaintActor]===p&&
  /^r101:aura-(?:back|front):/.test(String(c.owner.id));
}
function consume(r,commands,frame){if(!active()){caught=null;hide();return;}if(!ready||!Array.isArray(commands)){caught=null;hide();return;}attach(r);const pending=caught;caught=null;const heroImages=commands.filter(c=>c?.kind==='image'&&c.owner?.kind==='hero'),bodies=heroCommands(commands,pending?.owner),selected=new Set(bodies);stats.heroImgs+=heroImages.length;
 stats.lastHeroImages=heroImages.length;stats.lastBodies=bodies.length;stats.lastHeroFx=heroImages.filter(c=>!selected.has(c)).length;if(stats.lastHeroFx)stats.heroFxFrames++;if(!bodies.length){if(heroImages.length)stats.lastNoBody=heroImages.slice(0,8).map(c=>({sourcePath:String(c.sourcePath||''),bodyPath:String(c.owner?.bodyPath||''),spatialRole:c.spatialRole||null,r350Lifted:!!c.r350Lifted,mutable:!!c.mutable,alpha:c.style?.globalAlpha??1}));hide();return;}stats.lastNoBody=null;stats.bodyFrames++;const body=bodies.reduce((a,c)=>commandArea(c)>commandArea(a)?c:a);stats.lastBodyAlpha=Math.max(0,Math.min(1,body.style?.globalAlpha??1));const ghostKeys=new Set();for(const c of bodies)if(c.key!=null)for(const p of GHOST_PREFIX)ghostKeys.add(p+c.key);
 const now=Number.isFinite(frame?.time)?frame.time:(typeof time==='number'?time:0);let echo=null,copy=null,inkRows=[];try{echo=planSummon(group,frame,body,HERO,player,now);echo.nativeSlots=existingEchoSlots(commands,player,HERO,now);if(echo.nativeSlots.suppress)echo.suppressedToken=echo.token;if(echo.token!==echo.suppressedToken)copy=echoCommand(r,echo,bodies,HERO,now,frame,body.owner);if(HERO==='hwando'){
  const ink=inkContactCommands(r,frame,body,commands,player,now,copy);inkRows=ink.rows;echo.inkContacts=ink.metrics;}
 }catch(e){fail(e);resetSummon(group);}
 updateModel(r,body.owner,stats.lastBodyAlpha,frame,echo);
 const spirit=group?.visible?spirits.get(group):null;
 const viewMode=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();
 for(let i=commands.length-1;i>=0;i--){const c=commands[i];if(replaceLegacyShoulderOrb(c,player,HERO,spirit,viewMode)){commands.splice(i,1);continue;}if(selected.has(c)){if(copy&&c===body)commands[i]=copy;else commands.splice(i,1);stats.hidden++;}else if(c?.owner?.r350&&c.key!=null&&ghostKeys.has(String(c.key))&&!c.owner.r945Clone){commands.splice(i,1);stats.ghostsHidden++;}}if(inkRows.length)commands.push(...inkRows);
}

// R350/R448의 ThreeRenderer 래퍼가 몸 상자를 먼저 쓴 뒤 호출하는 CommandScene.render 바로 앞에서만 몸을 뺀다.
// 그래서 덧씌움 순서와 무관하게 원래 가림/유령 효과와 재귀 분신을 보존하고, 같은 scene의 층 1→2→3 pass는 그대로 둔다.
let frameContext=null;
function wrapCommands(r){const scene=r?.commands;if(!scene||typeof scene.render!=='function'||scene.render.__r1304)return;const base=scene.render,w=function(commands){try{consume(r,commands,frameContext);}catch(e){fail(e);hide();}try{return base.apply(this,arguments);}finally{frameContext=null;}};w.__r1304=true;scene.render=w;}
function prepare(r,frame){stats.frames++;frameContext=frame;wrapCommands(r);syncHero();if(!active()){caught=null;hide();return;}if(!ready){caught=null;hide();load(r);return;}loadSideArt(HERO);attach(r);}
let depth=0;const wrapped=new WeakSet();
const wrapFn=fn=>{if(fn.__r1304)return fn;const w=function(frame){if(depth===0){try{prepare(this,frame);}catch(e){fail(e);hide();}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1304=w.__r1302=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
function wrapInst(){try{const r=currentHost();if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}if(r)wrapCommands(r);if(r&&group&&hostRenderer!==r)attach(r);if(r&&on&&!ready&&!loading&&!loadFailed)load(r);}catch(e){fail(e);}}
(function tick(){syncHero();wrapInst();wrapHero();if(!active())hide();requestAnimationFrame(tick);})();

function row(){const doc=document;if(doc.getElementById('hwando3dR1302Row'))return;const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;const d=doc.createElement('div');d.id='hwando3dR1302Row';d.className='r1021-row';d.innerHTML='<label><input type="checkbox" id="hwando3dR1302Toggle"> 3D 영웅(시험)</label><p class="small muted">환도·서하·네온·미카엘라·라우렌·헌터·슬레이어·거너·페르소나·EGO를 월드 깊이에 맞는 입체 모델로 그립니다. 영웅마다 처음 볼 때 모델 약 4MB를 받으며, 기본은 끔입니다.</p>';host.appendChild(d);const el=d.querySelector('#hwando3dR1302Toggle');if(el){el.checked=on;el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const result=base.apply(this,a);try{row();}catch(e){fail(e);}return result;};}
function set(value){on=!!value;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}const el=document.getElementById('hwando3dR1302Toggle');if(el)el.checked=on;if(on){loadFailed=false;load(currentHost()).catch(()=>null);}else hide();return on;}
function measure(){if(!ready||!group?.visible||!hostRenderer)return null;group.updateMatrixWorld(true);const camera=hostRenderer.camera,width=hostRenderer.projection.width,height=hostRenderer.projection.height,vertex=new T.Vector3(),projected=new T.Vector3();let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity,count=0;
 group.traverse(o=>{const position=o.isMesh&&!o.userData?.heldSpiritReplacement&&o!==spirits.get(group)?.mesh&&o.geometry?.attributes?.position;if(!position)return;for(let i=0;i<position.count;i++){if(typeof o.getVertexPosition==='function')o.getVertexPosition(i,vertex);else vertex.fromBufferAttribute(position,i);projected.copy(vertex).applyMatrix4(o.matrixWorld).project(camera);const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;if(Number.isFinite(x+y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}});if(!count)return{ink:0};const anchor=hostRenderer.projection.worldToScreen(group.position.x,group.position.z,group.position.y);lastBox={ink:count,top,bottom,left,right,cx:(left+right)/2,anchor};return lastBox;}
window.__STORYWORLD_HWANDO3D_R1302__=Object.freeze({revision:REV,glb:GLB,on:()=>on,set,load:()=>load(currentHost()),measure,heroes:()=>Object.keys(HEROES),acceptInkContacts,inspect:()=>({revision:REV,hero:HERO,glbPath:HEROES[HERO].glb,attackVariant:attackVariants[HERO]||null,loadedHeroes:Object.keys(HEROES).filter(k=>k===HERO?ready:!!rigs[k]?.ready),on,ready,action:lastAction,renderedPose:curAct,yaw:+yaw.toFixed(3),weights:{idle:+wts.idle.toFixed(3),walk:+wts.walk.toFixed(3),attack:+wts.attack.toFixed(3)},sharedScene:!!group&&!!hostRenderer&&group.parent===hostRenderer.scene,hostLayer:group?HOST_LAYER:null,overlayCanvas:!!document.getElementById('hwando3dR1302'),shown:!!group?.visible,opacity:mats[0]?.opacity??null,depthWrite:mats.length?mats.every(m=>m.depthWrite):null,transparent:mats.length?mats.some(m=>m.transparent):null,spirit:spiritSnapshot(group),summon:echoSnapshot(group),heldVisuals:(()=>{const a=[];model?.traverse(o=>{if(o.userData?.heldSpiritReplacement)a.push({name:o.userData.heldSpiritReplacement,mesh:o.name,visible:o.visible});});return a;})(),weaponMaterial:(()=>{const m=mats.find(x=>x.userData?.r1305Weapon);return m?{metalness:m.metalness,roughness:m.roughness,emissive:m.emissive?m.emissive.getHex():null}:null;})(),...stats,lastError})});
})(typeof HEROES==='object'?HEROES:null);
