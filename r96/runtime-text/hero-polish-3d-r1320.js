// R1320 3D 영웅 10명 가독성·재질 보정 — 사용자 2026-11-26 "3D 영웅은 초고품질로 개선 보정 작업도 해 줘".
//  실측(헤드리스 qa/r1320): 게임 카메라에서 3D 영웅이 바닥에 묻혀 거의 안 보였다. 원인은 3D 몸이 세계 층(2)에 붙은 메시라
//   맵용 수묵 셰이더(R1055)와 국지 조명(R451)이 '지형'으로 보고 같이 걸어, 몸이 바닥과 같은 먹·한지 3점 농담 + 종이 결이 된 것.
//   (2D 영웅은 그리기 명령 줄이라 처음부터 빠져 있다. 빨간 단색 재질로 바꿔도 갈색으로 보이는 것으로 확인.)
//  고침(hwando-3d-r1302.js 는 해시 고정 검사가 있어 건드리지 않는다 — 장면의 'r1305-<영웅>-3d-shared' 묶음을 찾아 덧붙인다):
//   ① 묶음의 모든 메시(나중에 붙는 무기 포함)를 맵 수묵·국지 조명 대상에서 뺀다(userData.r1055Skip·r451). 이미 끼워진 호출은 셰이더 글에서 지운다.
//   ② 몸·무기 재질에 덧빛: 채도 되살림(R1304 한지 톤 .62 → .9), 왼쪽 위 빛 기준 3단 명암(사용자 2026-11-09 광원 규칙), 윤곽 테두리빛.
//      테두리빛 색은 영웅 고유색(R302 표, 페르소나·EGO 언주, 환도 흰빛). 카메라는 그대로, 2D 그림 미감(먹선 + 밝은 바깥선)을 따른다.
//   ③ 밝은 바깥 테두리 껍질(2D 영웅의 R409 밝은 외곽선과 같은 말투) — 먹 테두리(R1305) 바깥에 한 겹.
//      무기 메시는 테두리가 없어 60px 키에서 사라졌다 → 무기마다 먹·밝은 테두리 껍질.
//   ④ 옷 색: TRELLIS 텍스처(512px)는 잘게 쪼개진 조각 사이가 검다. 60px 키로 줄면 밉맵이 검은 틈·먼 조각 색을 섞어 흰 옷이 갈색 얼룩이 됐다.
//      몸 정점(10만 개, 텍스처 칸 수와 비슷)마다 텍스처 색을 한 번 읽어 정점 색으로 굽고, 몸은 그 색으로 그린다(텍스처 곱은 셰이더에서 뺀다. 자산·재질 map 은 그대로).
//   껍질은 몸 재질 투명도를 매 프레임 따라간다. 판정·피해·AI·저장·동작·자산은 바꾸지 않는다.
//  R1362(사용자 11-27 "영웅윤곽 때문인지 칼끝이 뭉툭해 보임"): 무기 테두리 껍질은 법선 방향으로 고르게 부풀려 가는 칼끝을 둥근 덩어리로 감쌌다
//   (환도 밝은 껍질이 칼끝 너머 5.5%·칼끝 단면 폭 3.6배). 칼끝 표지(BladeTip)가 있는 무기는 칼끝에서 칼날 길이 25% 안쪽부터 껍질 두께를
//   0 까지 매끄럽게 줄인다(정점 속성 r1362Taper) — 칼 몸 테두리는 그대로, 칼끝만 칼 모양대로 뾰족하게 끝난다.
//  끄기: localStorage['storyworld.r1320.polish3d']='off' — 덧빛 0·밝은 껍질 숨김(①의 버그 고침은 남는다). 점검: window.__STORYWORLD_HERO_POLISH_R1320__.inspect()
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_POLISH_R1320__)return;
const REV='R1362-hero-polish-2',KEY='storyworld.r1320.polish3d',NAME=/^r1305-([a-z]+)-3d-shared$/,LAYER=2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
// 테두리빛 색(sRGB 0~1): R302 영웅 주색을 흰빛에 섞는다. 환도 = 먹+흰, 페르소나·EGO = 언주.
const WHITE=[.97,.96,.93],mixW=(c,k)=>c.map((v,i)=>+clamp(WHITE[i]+(v/255-WHITE[i])*k,0,1).toFixed(3));
const RIM=Object.freeze({
 hwando:Object.freeze(WHITE.slice()),seoha:Object.freeze(mixW([120,206,255],.55)),neon:Object.freeze(mixW([62,230,193],.55)),
 michaela:Object.freeze(mixW([178,26,62],.5)),lauren:Object.freeze(mixW([164,98,255],.55)),hunter:Object.freeze(mixW([255,96,40],.5)),
 slayer:Object.freeze(mixW([222,22,52],.5)),gunner:Object.freeze(mixW([70,124,255],.55)),
 persona:Object.freeze([.93,.27,.16]),ego:Object.freeze([.95,.30,.18])});
// flat: 장면 조명 결과 대신 원래 옷 색(2D 그림처럼 평평한 색)을 얼마나 쓸지. 그 위에 왼쪽 위 빛 3단 명암을 얹는다.
// lift: 어두운 옷(슬레이어·헌터·페르소나 텍스처 평균 밝기 10%)의 결이 보이게 어두운 쪽만 조금 띄운다(밝은 색은 거의 그대로).
const TUNE=Object.freeze({lift:.35,sat:.95,flatBody:.75,flatWeapon:.45,shade:[.66,.63,.70],lit:[1.10,1.07,1.0],rimBody:.5,rimWeapon:.8,contrast:1.08});
const EXPOSE=Object.freeze({target:225,max:1.6});
const gainFor=p90=>clamp(EXPOSE.target/Math.max(1,Number.isFinite(p90)?p90:255),1,EXPOSE.max);
const SHELL=Object.freeze({pale:0xeadfc8,ink:0x2a1410,bodyPale:.06,weaponInk:.02,weaponPale:.05,push:.35,pushInk:.12});
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
const stats={materials:0,shells:0,tapered:0,baked:0,stripped:0,frames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e&&e.stack||e).slice(0,240);};
const U={r1320K:{value:on?1:0},r1320Push:{value:0},r1320PushInk:{value:0}};
const host=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;return r?.scene&&r?.T?r:null;};
const api3d=()=>window.__STORYWORLD_HWANDO3D_R1302__;
const f3=a=>'vec3('+a.map(v=>clamp(v,0,4).toFixed(3)).join(',')+')';
const INK_CALL='gl_FragColor.rgb=r1055Ink(gl_FragColor.rgb);',LIGHT_CALL='gl_FragColor.rgb*=r451Light();',CS='#include <colorspace_fragment>';
function glsl(hero,weapon){return `
uniform float r1320K;
vec3 r1320Polish(vec3 lit,vec3 albedo,vec3 n){
 vec3 own=pow(clamp(albedo,0.,1.),vec3(.4545));own=mix(own,sqrt(own),${TUNE.lift.toFixed(3)});
 vec3 c=mix(lit,own,${(weapon?TUNE.flatWeapon:TUNE.flatBody).toFixed(3)});
 float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,${TUNE.sat.toFixed(3)});
 float key=dot(n,normalize(vec3(-.48,.66,.58)));
 float band=.5*smoothstep(-.18,.02,key)+.5*smoothstep(.34,.56,key);
 c*=mix(${f3(TUNE.shade)},${f3(TUNE.lit)},band);
 float edge=1.-clamp(abs(n.z),0.,1.);
 float side=smoothstep(-.35,.55,dot(normalize(n.xy+vec2(1e-5)),normalize(vec2(-.6,.8))));
 c+=${f3(RIM[hero]||WHITE)}*pow(edge,2.4)*side*${(weapon?TUNE.rimWeapon:TUNE.rimBody).toFixed(3)};
 return clamp((c-.5)*${TUNE.contrast.toFixed(3)}+.5,0.,1.);}
`;}
// 셰이더 글에서 맵 수묵·국지 조명 호출을 지우고(①), 표준 재질이면 덧빛을 끼운다(②). 자리가 없으면 그대로 둔다.
function rewrite(shader,hero,weapon,lit,baked,ink){
 let f=shader.fragmentShader;if(typeof f!=='string')return;
 // R1305 먹 테두리 껍질: 주름 많은 몸 위로 튀어나와 60px 키에서 몸 전체를 갈색으로 덮었다 → 화면 깊이로 조금 밀어 실루엣·겹친 팔다리 가장자리에만 남긴다.
 if(ink&&typeof shader.vertexShader==='string'&&!shader.vertexShader.includes('r1320PushInk')&&shader.vertexShader.includes('#include <project_vertex>')){
  shader.vertexShader='uniform float r1320PushInk;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z+=r1320PushInk*gl_Position.w;');
  if(!shader.uniforms||typeof shader.uniforms!=='object')shader.uniforms={};shader.uniforms.r1320PushInk=U.r1320PushInk;}
 if(baked)f=f.replace('#include <map_fragment>','');
 if(f.includes(INK_CALL)){f=f.split(INK_CALL).join('');stats.stripped++;}
 if(f.includes(LIGHT_CALL)){f=f.split(LIGHT_CALL).join('');stats.stripped++;}
 const end=f.lastIndexOf('}');
 if(lit&&!f.includes('r1320Polish(')&&f.includes(CS)&&end>0){
  f=f.slice(0,end)+'gl_FragColor.rgb=mix(gl_FragColor.rgb,r1320Polish(r1320Raw,diffuseColor.rgb,normalize(normal)),clamp(r1320K,0.,1.));\n'+f.slice(end);
  f=glsl(hero,weapon)+f.replace(CS,CS+'\nvec3 r1320Raw=gl_FragColor.rgb;');
  if(!shader.uniforms||typeof shader.uniforms!=='object')shader.uniforms={};shader.uniforms.r1320K=U.r1320K;}
 shader.fragmentShader=f;}
// 텍스처 색 → 정점 색(선형). 그림이 아직 없거나 읽을 수 없으면 false(다음 프레임에 다시), 구울 것이 없으면 true.
const srgb=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};let LUT=null,pad=null;
function bake(T,mesh){
 const m=mats(mesh)[0],map=m?.map,g=mesh.geometry,uv=g?.attributes?.uv,pos=g?.attributes?.position;if(!map||!uv||!pos||g.attributes.color)return true;
 const im=map.image,w=im?.width|0,h=im?.height|0;if(!(w>0&&h>0))return false;
 if(!pad)pad=document.createElement('canvas');pad.width=w;pad.height=h;const c=pad.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,w,h);c.drawImage(im,0,0);
 const px=c.getImageData(0,0,w,h).data;if(!LUT){LUT=new Float32Array(256);for(let i=0;i<256;i++)LUT[i]=srgb(i);}
 map.updateMatrix?.();const e=map.matrix?.elements||[1,0,0,0,1,0,0,0,1],n=pos.count,out=new Float32Array(n*3),flip=map.flipY===true;
 const idx=new Uint32Array(n),hist=new Uint32Array(256);
 for(let i=0;i<n;i++){const u0=uv.getX(i),v0=uv.getY(i),u=e[0]*u0+e[3]*v0+e[6],v=e[1]*u0+e[4]*v0+e[7];
  const x=clamp(Math.floor((u-Math.floor(u))*w),0,w-1),y=clamp(Math.floor(((flip?1-v:v)-Math.floor(flip?1-v:v))*h),0,h-1),k=(y*w+x)*4;idx[i]=k;hist[Math.max(px[k],px[k+1],px[k+2])]++;}
 // 노출 맞춤: TRELLIS 텍스처는 그늘이 구워져 흰 옷도 회색(환도 상위 10% 밝기 145/255)이다. 상위 10% 밝기를 EXPOSE.target 으로 올리되 EXPOSE.max 배까지만(어두운 옷 영웅은 어두운 채로).
 let acc=0,p90=255;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=n*.1){p90=v;break;}}const gain=gainFor(p90);
 for(let i=0;i<n;i++){const k=idx[i];out[i*3]=LUT[Math.min(255,Math.round(px[k]*gain))];out[i*3+1]=LUT[Math.min(255,Math.round(px[k+1]*gain))];out[i*3+2]=LUT[Math.min(255,Math.round(px[k+2]*gain))];}
 m.userData.r1320Gain=+gain.toFixed(3);
 g.setAttribute('color',new T.BufferAttribute(out,3));m.vertexColors=true;m.userData.r1320Baked=true;m.needsUpdate=true;stats.baked++;return true;}
const done=new WeakSet();
function polish(m,hero,weapon){
 if(!m||done.has(m))return;done.add(m);const before=m.onBeforeCompile,key=m.customProgramCacheKey,lit=m.isMeshStandardMaterial===true;
 const w=function(shader,...a){if(typeof before==='function')before.call(this,shader,...a);try{rewrite(shader,hero,weapon,lit,m.userData?.r1320Baked===true,m.userData?.r1305Ink===true);}catch(e){fail(e);}};
 if(typeof before==='function')for(const k of Object.keys(before))w[k]=before[k];
 m.onBeforeCompile=w;m.customProgramCacheKey=function(){return String(typeof key==='function'?key.call(this):'').replace(/\|r1055|\|r451[bgs]?/g,'')+'|r1320-'+hero+(weapon?'-w':'-b')+(lit?'-l':'')+(m.userData?.r1320Baked===true?'-vc':'')+(m.userData?.r1305Ink===true?'-ink':'');};
 m.needsUpdate=true;stats.materials++;}
const mark=o=>{const u=o.userData||(o.userData={});u.r1055Skip=true;u.r451=true;};
// 밝은 껍질은 화면 깊이로 PUSH(m)만큼 뒤로 민다 — 몸 앞면·주름 사이로 비치지 않고 실루엣 바깥에만 남는다(TRELLIS 메시는 주름이 잦아 두꺼운 껍질이 몸 위로 튀어나온다).
function shellMaterial(T,color,width,skinned,push=false,taper=false){
 const m=new T.MeshBasicMaterial({color,side:T.BackSide,transparent:false,depthTest:true,depthWrite:true});m.userData.r1305Ink=true;m.userData.r1320Shell=true;
 const w=clamp(width,0,1e6).toFixed(6);
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+(skinned?'#if defined( USE_SKINNING )\ntransformed += normalize( objectNormal ) * '+w+';\n#endif\n':'transformed += normalize( normal ) * '+w+(taper?' * r1362Taper':'')+';\n'));
  if(taper)shader.vertexShader='attribute float r1362Taper;\n'+shader.vertexShader;
  if(push){shader.uniforms.r1320Push=U.r1320Push;shader.vertexShader='uniform float r1320Push;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z+=r1320Push*gl_Position.w;');}};
 m.customProgramCacheKey=()=>'r1320-shell|'+(skinned?'s':'r')+(push?'p':'')+(taper?'t':'')+'|'+w;return m;}
const states=new WeakMap();
function bodyShell(T,s,mesh){
 const w=SHELL.bodyPale/Math.max(1e-9,Math.abs(mesh.scale.x)||1),m=shellMaterial(T,SHELL.pale,w,true,true),sh=new T.SkinnedMesh(mesh.geometry,m);
 sh.name='r1320-rim-shell';sh.bind(mesh.skeleton,mesh.bindMatrix);sh.bindMode=mesh.bindMode;sh.frustumCulled=false;sh.castShadow=sh.receiveShadow=false;
 sh.position.copy(mesh.position);sh.quaternion.copy(mesh.quaternion);sh.scale.copy(mesh.scale);sh.renderOrder=mesh.renderOrder-2;sh.layers.set(LAYER);mark(sh);
 mesh.parent.add(sh);s.shells.push(sh);s.pale.push(sh);stats.shells++;}
// R1362: 칼끝 쪽 껍질 두께 계수(0~1). 칼끝 표지가 있는 무기 묶음의 메시만 — 칼끝에서 칼날 길이(손잡이 → 칼끝) 25% 안쪽부터 0 까지 smoothstep.
const TAPER=.25;
function taperFor(T,mesh){const G=mesh.geometry,P=G?.attributes?.position;if(!P)return false;if(G.attributes.r1362Taper)return true;
 let W=mesh;while(W&&!/weapon$|greatsword$/.test(W.name||''))W=W.parent;if(!W)return false;let tip=null;W.traverse(x=>{if(!tip&&/^BladeTip/.test(x.name||''))tip=x;});if(!tip)return false;
 W.updateWorldMatrix(true,true);const t=mesh.worldToLocal(tip.getWorldPosition(new T.Vector3()));let base=mesh.worldToLocal(W.getWorldPosition(new T.Vector3()));
 const v=new T.Vector3();if(base.distanceTo(t)<1e-6){let far=0;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const d=v.distanceTo(t);if(d>far){far=d;base=v.clone();}}}
 const L=base.distanceTo(t);if(!(L>1e-6))return false;const A=t.clone().sub(base).divideScalar(L),a=new Float32Array(P.count);
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const x=clamp(t.clone().sub(v).dot(A)/(TAPER*L),0,1);a[i]=x*x*(3-2*x);}
 G.setAttribute('r1362Taper',new T.BufferAttribute(a,1));stats.tapered++;return true;}
function weaponShells(T,s,mesh,gs,tmp){
 mesh.getWorldScale(tmp);const k=Math.max(1e-9,Math.abs(tmp.x)/Math.max(1e-9,gs));let tp=false;try{tp=taperFor(T,mesh);}catch(e){fail(e);}
 for(const [name,color,width,order] of [['r1320-weapon-ink',SHELL.ink,SHELL.weaponInk,-1],['r1320-weapon-rim',SHELL.pale,SHELL.weaponPale,-2]]){
  const sh=new T.Mesh(mesh.geometry,shellMaterial(T,color,width/k,false,order===-2,tp));sh.name=name;sh.frustumCulled=false;sh.castShadow=sh.receiveShadow=false;
  sh.renderOrder=mesh.renderOrder+order;sh.layers.set(LAYER);mark(sh);mesh.add(sh);s.shells.push(sh);if(order===-2)s.pale.push(sh);stats.shells++;}}
const shown=(o,g)=>{for(let q=o;q&&q!==g;q=q.parent)if(!q.visible)return false;return true;};
const mats=o=>Array.isArray(o.material)?o.material:[o.material];
function step(scene){
 const a=api3d();if(!a||!a.on?.())return;const r=host();if(!r)return;const T=r.T;let g=null;
 for(const o of scene.children)if(o.visible&&NAME.test(o.name||'')){g=o;break;}if(!g)return;
 const hero=NAME.exec(g.name)[1];let s=states.get(g);if(!s){s={seen:new WeakSet(),shelled:new WeakSet(),shells:[],pale:[],unbaked:[],body:null,tmp:new T.Vector3()};states.set(g,s);}
 stats.frames++;g.getWorldScale(s.tmp);const gs=Math.abs(s.tmp.x)||1;
 const cam=r.camera,span=cam&&cam.isOrthographicCamera?cam.far-cam.near:NaN,ortho=span>0;U.r1320Push.value=ortho?clamp(2*SHELL.push*gs/span,0,.5):0;U.r1320PushInk.value=ortho?clamp(2*SHELL.pushInk*gs/span,0,.5):0;
 const fresh=[];g.traverse(o=>{if(!o.isMesh)return;const n=o.name||'';if(!s.seen.has(o)){s.seen.add(o);mark(o);if(!/^r1320-/.test(n)&&!/spirit/.test(n)){const w=!o.isSkinnedMesh;for(const m of mats(o))polish(m,hero,w);}}
  if(/^r1320-/.test(n)||/spirit/.test(n)||s.shelled.has(o))return;
  if(o.isSkinnedMesh){if(n==='r1305-ink-shell')return;if(!s.body)s.body=o;fresh.push(o);s.unbaked.push(o);}else if(shown(o,g))fresh.push(o);});
 for(const o of fresh){s.shelled.add(o);if(o.isSkinnedMesh)bodyShell(T,s,o);else weaponShells(T,s,o,gs,s.tmp);}
 if(s.unbaked.length)s.unbaked=s.unbaked.filter(o=>{try{return !bake(T,o);}catch(e){fail(e);return false;}});
 const bm=s.body?mats(s.body)[0]:null,op=clamp(bm?bm.opacity:1,0,1),solid=op>=.98;
 for(const sh of s.shells){const m=sh.material;m.opacity=op;m.depthWrite=solid;if(m.transparent===solid){m.transparent=!solid;m.needsUpdate=true;}}
 for(const sh of s.pale)sh.visible=on&&op>0&&ortho;}
let hooked=null;
(function tick(){try{const r=host();if(r&&r.scene!==hooked){const scene=r.scene,prev=scene.onBeforeRender;
  scene.onBeforeRender=function(...args){try{step(scene);}catch(e){fail(e);}return prev?.apply(this,args);};hooked=scene;}}catch(e){fail(e);}requestAnimationFrame(tick);})();
function set(v){on=!!v;U.r1320K.value=on?1:0;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;}
window.__STORYWORLD_HERO_POLISH_R1320__=Object.freeze({revision:REV,on:()=>on,set,rim:RIM,tune:TUNE,shell:SHELL,expose:EXPOSE,pure:Object.freeze({rewrite,glsl,gainFor}),
 inspect:()=>({revision:REV,on,strength:U.r1320K.value,hooked:!!hooked,rim:RIM,...stats,lastError})});
})();
