// R435 — 사용자 2026-11-09 "환경 구성요소 검토본 토대로 77전문가 버전으로 개선작업"(벽·타일·지붕·조형물 AAA 대비 검토 1~4순위).
//  새 그림·메시·텍스처·패스 없이 바닥·벽 재질 셰이더(R323 과 같은 재질 목록)에 몇 줄을 더한다. 판정·충돌·저장·자산 원본은 그대로.
//  A) 바닥 반복 깨기: 월드 좌표 기준 큰 값 노이즈(약 9칸·3.5칸 두 겹 ±17% + 22칸 젖음·마름 얼룩 ±11%), 아주 약한 따뜻/차가운 기울기 ±4%.
//     (첫 판 ±10% 는 어두운 바닥에서 화면 차이 평균 2단계라 거의 안 보였다 — 헤드리스 전후 차이 측정)
//     같은 타일이 일정 간격으로 되풀이되어 보이던 것(u201 격자·갈색 무늬 바닥)을 흐트러뜨린다. 텍스처를 한 번 더 읽는 '회전 섞기'는
//     격자 바닥 줄눈이 이중으로 보일 위험이 있고 폰 부담이 늘어 넣지 않았다(검토본 A 의 안전한 절반).
//  B) 벽 밑동: 벽면 아래 0.4칸을 최대 52% 어둡게(접촉 그림자), 그 위 0.7칸까지 노이즈 섞인 때 띠(지역 문법 색: 병원=병적 청록 쪽,
//     늪·동굴·정원=오물 갈색 쪽, 그 밖=잿빛). 벽이 바닥 위에 올려 둔 상자처럼 보이던 직선 이음매를 부드럽게.
//  3) 밝은 바닥 명도 상한: 바닥 휘도가 무릎점(기본 .70, 설원 ep1b09 .46)을 넘으면 부드럽게 눌러 화면 70~85% 어둠 규칙 안으로.
//     설원은 하얀 판 대신 달빛 회청 눈으로. 장미 저택 바둑판(R323 이 지키는 테마)은 건드리지 않는다.
//  4) 벽 세로 그라데이션 + 윗면 가장자리 빛: 벽면이 위로 갈수록 최대 18% 어두워지고(빛은 바닥 쪽에 고임), 벽 맨 위 0.09칸에
//     가는 회백 가장자리 빛(+35% 와 아주 작은 들어 올림, 완전한 검정(시야 밖)은 그대로)을 둬 검은 윗면(덮개)이 빈 구멍이 아니라 벽 두께로 읽히게 한다. 윗면(덮개) 자체는 밝히지 않는다(어둠 유지).
//     벽 높이는 엔진이 mesh.position.y=높이/2 로 세우는 것을 이용(R115 가 높이를 올리면 엔진이 메시를 다시 세우므로 따라간다).
//  맘몬 금고(ep1b06)는 Codex 작업이라 세기 0. 끄기: localStorage['storyworld.r435.surface']='{"on":false}' (또는 {"floor":false} / {"wall":false}).
(()=>{'use strict';
if(window.__STORYWORLD_SURFACE_R435__)return;
const REV='R435-surface-2',KEY='storyworld.r435.surface';
let prefs={on:true,floor:true,wall:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,materials:0,compiles:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const SKIP=new Set(['ep1b06']);
const BRIGHT_FLOOR=Object.freeze({ep1b09:.46});/* 설원 아래의 기계 다리 — 거의 흰 바닥 */
const KNEE=.70;
// 지역 문법별 때 색(곱하는 색). 9·10절 팔레트: 병원=병적 청록 #568B84 쪽, 늪·부패=오물 갈색 #52402D 쪽, 그 밖=잿빛 #686C6C 쪽.
const GRIME={hospital:[.80,.90,.88],rot:[.86,.76,.62],ash:[.82,.83,.84]};
function grimeOf(id){if(/^ep1a0[89]|^ep1a1|hosp|^u20/.test(id))return GRIME.hospital;if(/^dist0[0-4]|swamp|cave|^sz115/.test(id))return GRIME.rot;return GRIME.ash;}
const U={on:{value:1},floorOn:{value:1},wallOn:{value:1},knee:{value:KNEE},grime:{value:[...GRIME.ash]}};
const states=new WeakMap();
// R323 과 같은 재질 찾기(바닥·벽·덮개) — 덮개(cap)는 밝히지 않으므로 건너뛴다.
function roleMaterials(r){
 const roles=new Map(),add=(m,role)=>{for(const x of Array.isArray(m)?m:[m])if(x)roles.set(x,role);};
 add(r.stoneMaterial,'floor');add(r.visualFloorMaterials,'floor');add(r.visualFloorMaterial,'floor');
 add(r.bridgeMaterial,'floor');add(r.wallMaterial,'wall');add(r.hospitalWallMaterial,'wall');add(r.regionalTrimMaterial55,'wall');
 for(const e of r.wallRows?.values?.()||[]){const m=e.mesh?.material;if(Array.isArray(m))m.forEach((x,i)=>{if(x)add(x,i===2||i===3?'cap':'wall');});else if(m)add(m,'wall');}
 const organic={'r204-ground':'floor','r204-cliff-faces':'wall'};
 for(const o of r.__r204?.group?.children||[])if(organic[o.name])add(o.material,organic[o.name]);
 add(r.wallCapMaterial61,'cap');add(r.hospitalRoofMaterialR2,'cap');
 return roles;}
const NOISE=`
float r435h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float r435n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(r435h(i),r435h(i+vec2(1,0)),f.x),mix(r435h(i+vec2(0,1)),r435h(i+vec2(1,1)),f.x),f.y);}
`;
function fragFor(role){
 if(role==='floor')return `if(r435On>.5&&r435Floor>.5){vec2 q=vR435W.xz;float n=r435n(q/9.)*.65+r435n(q/3.5+17.3)*.35;float big=r435n(q/22.+3.7)-.5;float v=(1.+.34*(n-.5))*(1.+.22*big);
 float t=r435n(q/14.+5.1)-.5;gl_FragColor.rgb*=v*vec3(1.+.08*t,1.,1.-.08*t);
 float L=dot(gl_FragColor.rgb,vec3(.299,.587,.114));if(L>r435Knee){float k=r435Knee+(L-r435Knee)*.35;gl_FragColor.rgb*=k/max(L,1e-4);}}
`;
 return `if(r435On>.5&&r435Wall>.5&&vR435N<.5){float h=vR435W.y;float top=vR435Top-h;
 float ao=mix(.48,1.,smoothstep(0.,.4,h));
 float band=(1.-smoothstep(.25,.7,h))*(.55+.45*r435n(vec2(vR435W.x+vR435W.z,h*2.)*2.3));
 vec3 c=gl_FragColor.rgb*ao;c=mix(c,c*r435Grime,band*.6);
 c*=1.-.18*smoothstep(.8,3.,h);
 float rim=(1.-smoothstep(0.,.09,top))*step(.5,vR435Top);c=c*(1.+.35*rim)+vec3(.035,.036,.04)*rim*step(.002,dot(c,c));
 gl_FragColor.rgb=clamp(c,0.,1.);}
`;}
function install(m,role){
 if(!m||role==='cap'||m.isShaderMaterial||m.isRawShaderMaterial)return;
 const st=states.get(m);if(st){st.role=role;return;}
 const previous=m.onBeforeCompile,previousKey=m.customProgramCacheKey;const state={role};states.set(m,state);stats.materials++;
 m.onBeforeCompile=function(shader,...a){
  previous?.call(this,shader,...a);
  try{
   if(shader.fragmentShader.includes('uniform float r435On;'))return;/* 복제 재질이 같은 콜백을 물려받은 경우 한 번만 */
   const end='#include <dithering_fragment>',bv='#include <begin_vertex>';
   if(!shader.fragmentShader.includes(end)||!shader.vertexShader.includes(bv)){fail(Error('surface hook missing'));return;}
   Object.assign(shader.uniforms,{r435On:U.on,r435Floor:U.floorOn,r435Wall:U.wallOn,r435Knee:U.knee,r435Grime:U.grime});
   shader.vertexShader='varying vec3 vR435W;varying float vR435Top;varying float vR435N;\n'+shader.vertexShader.replace(bv,bv+`
 {vec4 r435p=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 r435p=instanceMatrix*r435p;
 #endif
 r435p=modelMatrix*r435p;vR435W=r435p.xyz;vR435Top=2.*modelMatrix[3].y;vR435N=abs(normal.y)>.7?1.:0.;}`);
   shader.fragmentShader='uniform float r435On;uniform float r435Floor;uniform float r435Wall;uniform float r435Knee;uniform vec3 r435Grime;varying vec3 vR435W;varying float vR435Top;varying float vR435N;\n'+NOISE+shader.fragmentShader.replace(end,end+'\n'+fragFor(state.role));/* 디더링 뒤 = R323 명도 보정 뒤(누가 먼저 걸든 순서 같음) */
   stats.compiles++;}catch(e){fail(e);}};
 if(previous)for(const k of Object.keys(previous))m.onBeforeCompile[k]=previous[k];
 m.customProgramCacheKey=function(){return(previousKey?.call(this)||'')+'|surface-r435:'+state.role;};
 m.needsUpdate=true;}
let lastRoom='';
function sync(r){try{stats.frames++;
 const id=typeof room!=='undefined'&&room?String(room.id||''):'';
 const rose=r.r118TileLook==='rosehouse'||r.terrainArt?.r118Tiles?.file==='rosehouse';
 U.on.value=prefs.on&&!SKIP.has(id)?1:0;U.floorOn.value=prefs.floor&&!rose?1:0;U.wallOn.value=prefs.wall?1:0;
 if(id!==lastRoom){lastRoom=id;U.knee.value=BRIGHT_FLOOR[id]??KNEE;const g=grimeOf(id);U.grime.value[0]=g[0];U.grime.value[1]=g[1];U.grime.value[2]=g[2];}
 for(const[m,role]of roleMaterials(r))install(m,role);}catch(e){fail(e);}}
const wrapped=new WeakSet();
function attach(){const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,gl=r?.renderer;
 if(!r||typeof gl?.render!=='function'||wrapped.has(gl))return false;wrapped.add(gl);const base=gl.render;
 gl.render=function(scene,camera){if(scene===r.scene&&camera===r.camera&&camera.layers.mask===4)sync(r);return base.apply(this,arguments);};return true;}
if(typeof setInterval==='function')setInterval(attach,500);attach();
function set(p){if(p&&typeof p==='object')for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_SURFACE_R435__=Object.freeze({revision:REV,set,grimeOf,fragFor,
 inspect:()=>({revision:REV,prefs:{...prefs},room:lastRoom,knee:U.knee.value,on:U.on.value,stats:{...stats},lastError,extraDraws:0,extraTextures:0,geometryChanged:false,collisionChanged:false,assetsChanged:false,GPUVerified:false})});
})();
