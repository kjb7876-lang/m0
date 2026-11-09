// R453 CPU check: 영웅·몹 빛 맞춤 — 발밑 빛으로 밝기·색(절반 세기, .72~1.22), 채도 맞춤(빛 밑은 덜), 왼쪽 위 가는 테 빛(화면 기준 — 뒤집힌 그림도 같은 쪽),
//  자산·그림자·판정 안 바뀜, 그린 뒤 색·필터 되돌림, R409 구운 그림 다시 굽지 않음.
const fs=require('fs'),path=require('path');const {R,C,wiring,box,load,runner}=require('../r451/r450-453-common.cjs');
const {ok,done}=runner('R453');
wiring(ok,'actor-tone-r453.js');
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
const ctx=box({__STORYWORLD_PHASE1__:{controller:{state:{three:{T:{Vector3:V3}}}}}});load(ctx,'actor-tone-r453.js');const api=ctx.__STORYWORLD_ACTOR_TONE_R453__,P=api?.pure;
ok('api exposed',api&&api.revision.startsWith('R453')&&P&&typeof P.toneOf==='function');
const t1=P.toneOf([1,1,1]),tD=P.toneOf([.5,.5,.5]),tB=P.toneOf([2,2,2]),tW=P.toneOf([1.4,1.15,.9]);
ok('neutral light keeps the painted colour',t1.every(v=>v===1));
ok('dark spot dims but never below .72 (readability)',tD.every(v=>v<1&&v>=P.TMIN),tD);
ok('bright spot brightens at most to 1.22',tB.every(v=>v>1&&v<=P.TMAX),tB);
ok('warm lamp tints warm (r > b)',tW[0]>tW[2],tW);
ok('half strength vs floor (actor change < floor change)',1-tD[0]<1-.5&&tB[0]-1<2-1);
ok('saturation: mobs .8 in the dark, more colour under light, ≤ 1',Math.abs(P.satOf('enemy',[.7,.7,.7])-.8)<1e-9&&P.satOf('enemy',[1.4,1.4,1.4])>.8&&P.satOf('enemy',[3,3,3])<=1&&P.satOf('hero',[.7,.7,.7])>P.satOf('enemy',[.7,.7,.7]));
// 테 빛 셰이더: 화면 미분(dFdx·dFdy)으로 화면 왼쪽 위를 읽는다 → 그림 u 가 왼쪽을 향하는(뒤집힌) 몹도 화면 왼쪽 위가 밝다
ok('rim uses screen-space derivatives toward screen top-left',/dFdx\(vMapUv\)/.test(P.RIM_GLSL)&&/dFdy\(vMapUv\)/.test(P.RIM_GLSL)&&/\(-r453dx\+r453dy\)/.test(P.RIM_GLSL));
ok('rim only inside the silhouette, only where the top-left neighbour is open',/smoothstep\(\.95,\.995,r453a0\)/.test(P.RIM_GLSL)&&/1\.-smoothstep\(\.86,\.97/.test(P.RIM_GLSL));
// 엔진 그림 줄 재질 흉내: 원래 onBeforeCompile(필터 행렬) 다음에 테 빛을 붙이고, 프로그램 열쇠가 갈린다
{const m={onBeforeCompile:sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\ngl_FragColor.rgb = clamp(sourceFilterMatrix * gl_FragColor.rgb + sourceFilterOffset, 0.0, 1.0);');},customProgramCacheKey:()=>'original-css-color-filter-v1'};
 const u=P.patch(m);const sh={fragmentShader:'void main(){\n#include <colorspace_fragment>\n}',uniforms:{}};m.onBeforeCompile(sh);
 ok('patch keeps engine filter, adds rim before it, own uniforms',u&&sh.uniforms.r453RimK===u.r453RimK&&sh.fragmentShader.indexOf('r453RimK>0.')<sh.fragmentShader.indexOf('sourceFilterMatrix *')&&sh.fragmentShader.includes('uniform float r453RimK;'));
 ok('program cache key distinguishes patched rows',m.customProgramCacheKey()==='original-css-color-filter-v1|r453');
 ok('rim off by default until a lit frame sets it',u.r453RimK.value===0);}
{const s=C('actor-tone-r453.js');
 ok('handles overlay (layer 3) and world (layer 2) passes, only rows in that pass',/pass===4\|\|pass===8/.test(s)&&/mesh\.layers\.mask&pass/.test(s));
 ok('colour and filter matrix restored after each draw',/restore\.push\(\(\)=>m\.color\.setRGB\(rr,gg,bb\)\)/.test(s)&&/restore\.push\(\(\)=>f\.fromArray\(saved\)\)/.test(s)&&/finally\{for\(let i=restore\.length-1;i>=0;i--\)restore\[i\]\(\);\}/.test(s));
 ok('only while R451 owns the light (off → old look)',/const owns=\(\)=>\{try\{return !disposed&&prefs\.on&&!!R451\(\)\?\.owns\?\.\(\);/.test(s));
 ok('no shadows, no asset swap, no R409 re-bake',!/shadow\s*[:=]|addImage|bake\(|\.src\s*=|sourcePath\s*=/.test(s.replace(/\/\/.*$/gm,''))&&api.inspect().shadowsAdded===false&&api.inspect().assetsChanged===false);}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r453/r453-cpu-check.cjs'));
done();
