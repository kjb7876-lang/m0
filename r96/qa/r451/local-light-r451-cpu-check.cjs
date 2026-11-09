// R451 CPU check: 광원 둘레 국지 조명 — 벽(충돌 상자)에 막히는 조명맵, 모든 광원 켜짐, 둥근 웅덩이, 문틈으로만 새는 빛, 실내 불꽃 → 전구,
//  빛 곱 어깨(하얗게 날지 않게), 예전 빛 층(R89·R300·R123·R335)이 R451 이 맡을 때만 쉬는 고리.
const fs=require('fs'),path=require('path');const {R,C,wiring,box,load,runner}=require('./r450-453-common.cjs');
const {ok,done}=runner('R451');
wiring(ok,'local-light-r451.js');
const ctx=box();load(ctx,'local-light-r451.js');const api=ctx.__STORYWORLD_LOCAL_LIGHT_R451__,P=api?.pure;
ok('api exposed',api&&api.revision.startsWith('R451')&&P&&typeof P.bakeAcc==='function');
// ① 벽 = 충돌과 같은 축 정렬 상자(R219 세로벽 width .24 · depth 10). 예전엔 depth 를 두께로 읽어 벽 둘레 5칸이 막혔다.
{const b=P.wallBox({x:1,y:6,width:.24,depth:10,height:2.85,endpoints:[[1,1],[1,11]]});ok('R219 vertical wall → thin box (.24 wide, 10 long)',b&&Math.abs(b[0]-.88)<1e-9&&Math.abs(b[2]-1.12)<1e-9&&b[1]===1&&b[3]===11,b);}
ok('low furniture (height < 1.2) does not block light',P.wallBox({x:5,y:5,width:3,depth:1.4,height:.01,sinFurniture:true})===null);
ok('decorative wall does not block light',P.wallBox({x:5,y:5,width:3,depth:.24,height:2.8,decorative:true})===null);
// ② 두 방 + 문틈: 바닥 20×6, x=10 세로벽(y 0~2, 3~6), 문틈 y 2~3
const cells=[];for(let x=0;x<20;x++)for(let y=0;y<6;y++)cells.push([x,y]);
const walls=[{x:10,y:1,width:.24,depth:2,height:2.85,endpoints:[[10,0],[10,2]]},{x:10,y:4.5,width:.24,depth:3,height:2.85,endpoints:[[10,3],[10,6]]}];
const W1={c:[1,1,1],k:1,r:5.4};
const at=(B,x,y)=>{const g=B.G,i=Math.floor((x-g.gx0)*g.S),j=Math.floor((y-g.gy0)*g.S);return B.acc[(j*g.W+i)*3];};
{const B=P.bakeAcc({floorCells:cells,walls},[{x:5.5,y:3.1,...W1,color:W1.c}]);ok('bake returns grid + acc, light used',B&&B.used===1&&B.G.S>=2);
 const e=at(B,7.5,3.1),w=at(B,3.5,3.1),n=at(B,5.5,1.1),s=at(B,5.5,5.1);
 ok('open room: round pool (±x, ±y within 15%)',Math.max(e,w,n,s)/Math.min(e,w,n,s)<1.15&&e>.2,{e,w,n,s});
 ok('pool fades to 0 past the radius',at(B,5.5+5.6,3.1)===0||at(B,5.5+5.6,3.1)<.01);}
{const B=P.bakeAcc({floorCells:cells,walls},[{x:8.5,y:2.5,...W1,color:W1.c}]);
 const through=at(B,11.5,2.5),behind=at(B,11.5,4.6),mirror=at(B,8.5-3,4.6);
 ok('light passes straight through the doorway',through>.15,{through});
 ok('wall blocks direct light (behind wall ≪ same distance in the open room)',behind<mirror*.3,{behind,mirror});
 ok('no light texel inside a wall',(()=>{const g=B.G;let bad=0;for(let k=0;k<g.W*g.H;k++)if(!g.open[k]&&B.acc[k*3]>0)bad++;return bad===0;})());}
// 벽 속에 박힌 벽등: 가장 가까운 열린 텍셀 하나에서 퍼진다(얇은 벽 너머로 새지 않음)
{const B=P.bakeAcc({floorCells:cells,walls},[{x:10,y:4.5,...W1,color:W1.c}]);ok('light embedded in a wall still lights one side',B.used===1&&Math.max(at(B,9.2,4.5),at(B,10.8,4.5))>.3);
 ok('…and only one side (no leak through the .24 wall)',Math.min(at(B,9.2,4.5),at(B,10.8,4.5))<Math.max(at(B,9.2,4.5),at(B,10.8,4.5))*.3,{a:at(B,9.2,4.5),b:at(B,10.8,4.5)});}
// ③ 감쇠·어깨
ok('bell(0)=1, bell(1)=0, monotonic',P.bell(0)===1&&P.bell(1)===0&&[0,.2,.4,.6,.8,1].every((t,i,a)=>i===0||P.bell(t)<=P.bell(a[i-1])));
ok('shoulder: identity ≤ knee, ≤ 1.5, monotonic',P.shoulder(.5)===.5&&P.shoulder(.92)===.92&&P.shoulder(9)<=1.5&&P.shoulder(1.2)<P.shoulder(1.6)&&P.shoulder(1.6)<1.5);
// ④ 광원 종류(사용자 2026-11-08 "실내엔 불(화염) 없게, 있어도 전구등")
ok('indoor candle → bulb',api.classify('candle stand','domestic',true,null,false)==='bulb');
ok('indoor fire kept where canon has fire (FIRE_OK)',api.classify('brazier','forge',true,null,true)==='fire'&&P.FIRE_OK.includes('kair07')&&P.FIRE_OK.includes('ep1b07'));
ok('outdoor torch stays fire',api.classify('wall torch','stone',false,null,false)==='fire');
ok('hospital lamps → cold fluorescent',api.classify('lights_hospital_03','clinical',true,null,false)==='fluor');
ok('blue crystal keeps its colour (magic)',api.classify('lights_cave_02','cave',false,[.4,.6,1],false)==='magic');
// ⑤ 바탕빛: 실외 > 실내 > 동굴, 모두 읽히는 밝기
{const o=api.ambientFor('garden','out').k,i=api.ambientFor('domestic','in').k,c=api.ambientFor('cave','cave').k;ok('ambient out > in > cave, all ≥ .58',o>i&&i>c&&c>=.58,{o,i,c});
 // 보정(2026-11-09): 실외 등불은 넓게(반지름·세기 ↑), 건물 안은 방 크기 그대로, 동굴은 그 사이. 눈밭은 원형 어둠을 거의 그대로.
 ok('outdoor lamps reach wider than indoor, cave in between',P.REACH.out.r>P.REACH.cave.r&&P.REACH.cave.r>P.REACH.in.r&&P.REACH.in.r===1&&P.REACH.in.k===1&&P.REACH.out.k>1,P.REACH);
 ok('snowfield keeps most of the R335 circle (≥ .85), others lighter (.6)',P.GLOW_FAM.snow>=.85&&P.GLOW_SCALE===.6&&api.ambient.snow.k<=api.ambient.garden.k);
 ok('every ambient k in [.58,.9]',Object.values(api.ambient).concat(Object.values(api.ambientIn),[api.ambientCave]).every(a=>a.k>=.58&&a.k<=.9));}
// ⑥ 다른 층 고리 — R451 이 맡을 때만 쉼(끄면 예전 그대로)
const src=f=>C(f);
ok('R89 carried light yields to R451',/lightState\(r,frame\)\{[^]*?__STORYWORLD_LOCAL_LIGHT_R451__\?\.owns\?\.\(\)\)return null/.test(src('world-retro-r89.js')));
ok('R300 dim + pools yield to R451',src('light-atmos-r300.js').includes('__STORYWORLD_LOCAL_LIGHT_R451__?.owns?.()')&&/dimOn=[^;]*&&!r451/.test(src('light-atmos-r300.js'))&&/if\(want\('pools'\)&&!sight&&!r451\)/.test(src('light-atmos-r300.js')));
ok('R123 fake corner lights yield to R451',/function drawLights\(\)\{[^]*?__STORYWORLD_LOCAL_LIGHT_R451__\?\.owns\?\.\(\)\)return 0/.test(src('dark-r123.js')));
ok('R335 glow keeps its shape; edge lighter + holes only when R451 owns',src('light-r182.js').includes('glowEdge?.(GLOW_EDGE)')&&src('light-r182.js').includes('glowHoles?.(g)')&&api.glowEdge(.6)===.6&&api.owns()===false);
// ⑦ 셰이더: R89 색 보정 다음(디더 뒤)에 곱하고, 판 그림(Sprite)은 색공간 뒤에 곱한다. 맵 rgb/a 로 막힌 텍셀이 섞여 검게 번지지 않음.
{const s=src('local-light-r451.js');ok('mesh shader multiplies after dithering (after R89 grade)',s.includes("'#include <dithering_fragment>\\ngl_FragColor.rgb*=r451Light();'"));
 ok('sprite shader (R204 grass) multiplies after colorspace',s.includes("'#include <colorspace_fragment>\\ngl_FragColor.rgb*=r451Light();'")&&s.includes('isSpriteMaterial'));
 ok('map sampled as rgb/a (blocked texels do not darken edges)',s.includes('s.rgb/s.a*'));
 ok('re-bakes only when the light list itself changes (R412 moving unrelated props 10~13s after entry → no bake), and then only the changed lights',/const lsig=list\.map\([^;]*l\.color\.map/.test(s)&&/else if\(o451\.lsig!==lsig\)\{o451\.lsig=lsig;rebake\(o451,lights\);\}/.test(s)&&/if\(o451\.layout!==L\|\|o451\.cells!==L\.floorCells\.length\|\|!o451\.tex\|\|!o451\.B\)/.test(s));
 // 독립 심사(2026-11-09) 지적: R91 벽 등은 지금 불러온 청크의 벽에만 놓여 걸으면 자리가 바뀐다 — 개수만 보면 같은 개수로 바뀐 자리를 놓치고, 바뀌면 지역 전체를 다시 구웠다(걸으면 4→14번, 한 번 30~60ms).
 ok('light-list signature sees moved lamps, not just counts (R91 lamps follow the loaded chunks)',/posHash\(p92\),posHash\(p91\)/.test(s)&&P.posHash([{x:1,y:2},{x:5,y:6}])!==P.posHash([{x:1,y:2},{x:5,y:7}])&&P.posHash([{x:1,y:2}])===P.posHash([{x:1.001,y:2.001}]));
 ok('texture is fixed in place on a delta (no new DataTexture, only changed tiles re-encoded)',/function rebake\(o,lights\)\{[^}]*bakeDelta\(o\.B,lights\)[^}]*encodeTiles\(o\.B\.G,o\.B\.acc,o\.data,d\.tiles\);o\.tex\.needsUpdate=true;/.test(s)&&!/function rebake[^\n]*new T\.DataTexture/.test(s));
 ok('hidden props (r303Hide, e.g. R449 resting R224 braziers) give no light; hidden count re-collects lights',/const isLightProp=p=>\{if\(!p\|\|p\.r303Hide\)return false;/.test(s)&&/sig=\[[^\]]*r\.props\?\.length\|\|0,hid,/.test(s));
 ok('presentation only (no collision / gameplay writes)',!/floorCells\s*=|\.walls\s*=|\.push\(\s*\{[^}]*solid/.test(s)&&api.inspect().collisionChanged===false&&api.inspect().gameplayChanged===false);}
// ⑦-2 빛 몫 따로 굽기(독립 심사 지적: 등 하나만 바뀌어도 지역 전체를 다시 구움) — 바뀐 등 둘레 타일만 다시 굽고, 결과는 처음부터 구운 것과 같아야 한다.
{const L={floorCells:cells,walls},mk=(x,y,c)=>({x,y,type:'lamp',k:1,r:5.4,color:c||[1,.8,.6]}),a=mk(3.5,2.5),b=mk(15.5,3.5),c=mk(8.5,1.5,[.6,.8,1]),d=mk(12.5,4.5);
 const B=P.bakeAcc(L,[a,b,c]),D=P.bakeDelta(B,[b,c,d]),F=P.bakeAcc(L,[b,c,d]);let mx=0;for(let k=0;k<F.acc.length;k++)mx=Math.max(mx,Math.abs(F.acc[k]-B.acc[k]));
 ok('delta bake (one lamp out, one in) equals a fresh bake of the new list',mx<1e-6&&D.added===1&&D.removed===1&&B.used===3,{mx,added:D.added,removed:D.removed,used:B.used});
 const D2=P.bakeDelta(B,[b,c,d]);ok('same light list → nothing re-baked',D2.added===0&&D2.removed===0&&D2.tiles.size===0);
 const D3=P.bakeDelta(B,[]);let left=0;for(let k=0;k<B.acc.length;k++)left=Math.max(left,B.acc[k]);ok('removing every lamp clears the map (no stale pools)',D3.removed===3&&left===0&&B.used===0,{left});}
{const big=[];for(let x=0;x<90;x++)for(let y=0;y<80;y++)big.push([x,y]);const L={floorCells:big,walls:[]},mk=(x,y)=>({x,y,type:'lamp',k:1,r:5.4*1.25,color:[1,.8,.6]});
 const ls=[];for(let i=0;i<24;i++)ls.push(mk(4+((i*37)%82),4+((i*53)%72)));const t0=performance.now(),B=P.bakeAcc(L,ls),tFull=performance.now()-t0;
 const moved=ls.slice(0,20).concat([mk(40.5,40.5),mk(60.5,20.5)]),t1=performance.now(),D=P.bakeDelta(B,moved),tDelta=performance.now()-t1,F=P.bakeAcc(L,moved);
 let mx=0;for(let k=0;k<F.acc.length;k++)mx=Math.max(mx,Math.abs(F.acc[k]-B.acc[k]));const nt=Math.ceil(B.G.W/P.TILE)*Math.ceil(B.G.H/P.TILE);
 ok('90×80 zone, 4 lamps out + 2 in: only their tiles redone, same result as a fresh bake',mx<1e-6&&D.added===2&&D.removed===4&&D.tiles.size<=6*9&&D.tiles.size<nt,{mx,tiles:D.tiles.size,of:nt,fullMs:+tFull.toFixed(1),deltaMs:+tDelta.toFixed(1)});}
// ⑦-3 새 덩어리는 붙은 그 프레임에 셰이더(독립 심사 지적: 0.5초 타이머만 기다려 새 풀·벽 장식이 그동안 ×1 로 밝았다가 어두워짐)
{const r={spatialRoot:{children:[{id:11},{id:12}]},scene:{children:[{id:3}]}},s0=P.sceneSig(r);r.spatialRoot.children.push({id:13});const s1=P.sceneSig(r);r.spatialRoot.children[2]={id:14};const s2=P.sceneSig(r);
 ok('scene fingerprint changes when a mesh is added or swapped (same count)',s0!==s1&&s1!==s2&&P.sceneSig(r)===s2);
 const s=src('local-light-r451.js');ok('patch runs on fingerprint change every frame (update) and in the first world pass (R91 decor is built there), timer kept as fallback',
  /function patchIfChanged\(r,timed\)\{[^}]*ss===o451\.scanSig&&!\(timed&&t>=o451\.nextScan\)/.test(s)&&/patchIfChanged\(r,true\);/.test(s)&&/if\(pass===4\)patchIfChanged\(r,false\);/.test(s)&&/o451\.scanSig=0;/.test(s));}
// ⑦-4 쉼터·마을(R78 안전 지역)은 바닥이 1번 층 옛 지도 그림이라 R451 셰이더가 닿지 않는다 → 맡지 않고 예전 빛(독립 심사 지적: 맡으면 바닥이 ×1 로 평평하게 밝아짐)
{const cellsL=[[0,0],[1,0]];ok('owns only floors drawn on the R81 world layer (ward / refuge / hospital B2), not rest zones or the village',P.floorOwned({floorCells:cellsL,worldWardR81:{}})===true&&P.floorOwned({floorCells:cellsL,refugeR82:{}})===true&&
  P.floorOwned({floorCells:cellsL,hospitalCoreB2:true})===true&&P.floorOwned({floorCells:cellsL})===false&&P.floorOwned({floorCells:[],worldWardR81:{}})===false&&P.floorOwned(null)===false);
 ok('wantFor uses the R81 floor rule (same rule R81 uses to cover pass 1 with its void plane)',/function wantFor\(frame\)\{[^}]*floorOwned\(room\?\.exploration\)/.test(src('local-light-r451.js'))&&/const eligible=L=>!!L\?\.floorCells\?\.length&&!!\(L\.hospitalCoreB2\|\|L\.worldWardR81\|\|L\.refugeR82\)/.test(src('world-presentation-r81.js')));}
// ⑧ R448 덮개(영웅 앞을 가리는 조형물 몸을 덧그림 층에 한 번 더 그린 줄)도 원본과 같은 빛 — 아니면 영웅 상자 안만 밝기가 튄다(헤드리스 실측 1.00 대 1.07~1.12).
//  기록기가 덮개 주인을 effect 로 바꾸고 id 를 버리므로 줄 열쇠로 알아본다. 영웅 실루엣·오라는 소품 빛을 받지 않는다(실루엣은 R453 몫).
ok('R448 cover rows (key r448:over:…, owner effect) take the prop light; ghost, aura, hero rows do not',P.litRow('prop:r138:dist00:root:0:3',{kind:'prop'})===true&&P.litRow('r448:over:prop:r138:dist00:root:0:3',{kind:'effect'})===true&&
 P.litRow('r448:ghost:hero:2:5',{kind:'effect'})===false&&P.litRow('r101:aura-back:hero:0',{kind:'effect'})===false&&P.litRow('hero:2:5',{kind:'hero'})===false&&P.litRow('r448:over:x',null)===false);
ok('prop-row lighting walks rows with their keys (entries) through litRow',/for\(const \[key,row\] of r\.commands\?\.rows\?\.entries\?\.\(\)\|\|\[\]\)\{[^}]*if\(!litRow\(key,ow\)/.test(src('local-light-r451.js')));
ok('R448 contract: covers/ghosts still keyed r448:over: / r448:ghost: with the original owner x·y',(()=>{const d=src('depth-overlap-r448.js');return d.includes("key:'r448:over:'+c.key,owner:{...c.owner,")&&d.includes("key:'r448:ghost:'+c.key,owner:{...c.owner,");})());
// ⑩ main R462(#348) 사체: 주인 없는 'scene' 줄(화면 한가운데 기준)이라 빛 밖이었다 — 등 밑에선 바닥(×1.44)보다 어둡고 어두운 곳에선 바닥보다 밝게 떴다(헤드리스 실측).
//  R462 가 3D 기록기에서 사체마다 주인(종류 scene, 바닥 x·y)·줄 열쇠 'r462:corpse:…' 를 달고, R451 은 그 줄에 바닥과 같은 빛을 곱한다. 불씨(screen 섞기)는 그대로.
ok('R462 corpse rows (key r462:corpse:…, owner scene with x·y) take the floor light; plain scene rows and other kinds do not',P.litRow('r462:corpse:3:0',{kind:'scene',x:4,y:5})===true&&P.litRow('scene:4',{kind:'scene'})===false&&
 P.litRow('r462:corpse:3:0',{kind:'effect'})===false&&P.litRow('r462:corpse:3:0',{kind:'hero'})===false&&P.litRow(7,{kind:'scene'})===false);
ok('corpse glow (non-normal blending) stays unlit; the background-layer pass (mask 2) lights corpse rows only',/if\(ow\.kind==='scene'\)\{if\(m\.blending!==undefined&&m\.blending!==1\)continue;\}else if\(pass===2\)continue;/.test(src('local-light-r451.js'))&&/\(pass===2\|\|pass===4\|\|pass===8\)/.test(src('local-light-r451.js')));
{const vm=require('vm'),d=src('mob-death-r462.js');
 const run=withScope=>{const calls=[];const g={window:{},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},Date,console,Math,JSON,calls};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,zoom=1,settings={lowFx:false},room={id:'dist01'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};
   var ctx={owner:{id:'scene',kind:'scene'},save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(im){calls.push(['img',im.src,ctx.owner]);},globalAlpha:1,filter:'none'};
   ${withScope?"ctx.scope=function(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}};":''}
   function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}function readyImage(p){return{image:{src:p,naturalWidth:1536,naturalHeight:1024}};}
   function sprite(p,x,y,h,opt){calls.push(['sprite',p,ctx.owner]);return true;}
   function drawAssetFrame3(p,f,x,y,h,opt){calls.push(['frame',p,ctx.owner]);return true;}
   function texture(){calls.push(['texture','',ctx.owner]);}
   function drawEnemy(e){sprite(e.drawn,0,0,60,{flip:false});}
   function drawBurnDeath3(fx){}
   function drawObjective(){calls.push(['objective','',ctx.owner]);}
   function enterRegion(){return 1;}`,g);
  vm.runInContext(d,g);const M=g.__STORYWORLD_MOB_DEATH_R462__;
  vm.runInContext('drawEnemy',g)({id:'m1',name:'망각의 거미 1',hp:10,drawn:'assets/r380/mobs/spider-own.webp'});vm.runInContext('drawBurnDeath3',g)({type:'enemyBurnDeath',sourceId:'m1',x:3,y:4,age:.05,life:.72});
  vm.runInContext('drawEnemy',g)({id:'m2',name:'유리 망령',hp:5,drawn:'assets/r380/mobs/glass.webp'});vm.runInContext('drawBurnDeath3',g)({type:'enemyBurnDeath',sourceId:'m2',x:7,y:2,age:.5,life:.72});
  vm.runInContext('time=3',g);calls.length=0;vm.runInContext('drawObjective',g)();return {M,calls:calls.slice()};};
 const a=run(true),b=run(false),ca=a.calls.filter(c=>c[0]!=='objective'),cb=b.calls.filter(c=>c[0]!=='objective');
 ok('R462 contract: on the 3D recorder (ctx.scope) every corpse draw (pool, body, ember) is owned by its own floor spot r462:corpse:<n> (scene, x·y)',a.M.corpseOwner==='r462:corpse:'&&ca.length>=5&&
  ca.every(c=>c[2]&&c[2].kind==='scene'&&/^r462:corpse:\d+$/.test(c[2].id))&&ca.some(c=>c[2].x===3&&c[2].y===4)&&ca.some(c=>c[2].x===7&&c[2].y===2)&&new Set(ca.map(c=>c[2].id)).size===2&&ca.some(c=>c[0]==='texture')&&a.calls[0][2].id==='scene');
 ok('R462 contract: plain 2D canvas (no ctx.scope) draws the same corpse calls with the default owner',cb.length===ca.length&&cb.every(c=>c[2].id==='scene')&&cb.map(c=>c[0]+c[1]).join()===ca.map(c=>c[0]+c[1]).join());}
// ⑨ main R451(#331) 이 R204 낮은 돌 경계를 Sprite 대신 법선 없는 판 묶음 메시 'r451-border-runs:n|f' 로 바꿨다. 이름이 r451 로 시작해 예전 건너뛰기(^r451)에 걸리면
//  빛을 못 받고 둘레보다 밝게 뜬다 → 세운 판(카메라 쪽 수평 법선, 앞 바닥 빛)으로 받는다. 효과 판(r450 비·r300 웅덩이·r89 화면 빛)은 그대로 건너뛴다.
{const mat=(o={})=>({isMeshBasicMaterial:true,map:{},blending:1,...o}),mesh=(name,m=mat(),geo={attributes:{position:{}}})=>({isMesh:true,name,material:m,geometry:geo,userData:{}}),rows=new Set();
 const br=P.eligible(mesh('r451-border-runs:n'),rows),bf=P.eligible(mesh('r451-border-runs:f'),rows),wall=P.eligible(mesh('wall-row',mat(),{attributes:{position:{},normal:{}}}),rows);
 ok('main R451 stone border runs (r451-border-runs:n|f) are lit as standing boards, not skipped',!!br&&br.board===true&&!!bf&&bf.board===true&&!!wall&&!wall.board);
 ok('effect planes stay unlit: r450 rain/splash, r300 dim/pools/fog/motes, r89 screen light',['r450-splash','r450-rain','r300-dim','r300-light-pools','r300-fog-0','r300-motes','r89-retro-light'].every(n=>P.eligible(mesh(n),rows)===null));
 const body=src('local-light-r451.js');ok('board shader: per-vertex world position with the camera-facing level normal (no normal attribute needed), own program key',/board\?\n?\s*'\{vec4 r451W=modelMatrix\*vec4\(transformed,1\.\);r451P=r451W\.xyz;vec3 r451V=-\(transpose\(mat3\(viewMatrix\)\)\*vec3\(0\.,0\.,-1\.\)\);r451V\.y=0\./.test(body)&&body.includes("(board?'|r451b':'|r451')")&&body.includes('patch(m,T,ms.board)'));
 ok('R204 contract: border runs are still meshes named r451-border-runs:<side> with no normal attribute',(()=>{const d=src('cave-r204.js');return d.includes("mesh.name='r451-border-runs:'+side")&&d.includes("geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);");})());}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r451/local-light-r451-cpu-check.cjs'));
done();
