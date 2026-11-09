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
ok('R300 dim + pools yield to R451',src('light-atmos-r300.js').includes('__STORYWORLD_LOCAL_LIGHT_R451__?.owns?.()')&&/dimOn=[^;]*&&!r451/.test(src('light-atmos-r300.js')));
ok('R123 fake corner lights yield to R451',/function drawLights\(\)\{[^]*?__STORYWORLD_LOCAL_LIGHT_R451__\?\.owns\?\.\(\)\)return 0/.test(src('dark-r123.js')));
ok('R335 glow keeps its shape; edge lighter + holes only when R451 owns',src('light-r182.js').includes('glowEdge?.(GLOW_EDGE)')&&src('light-r182.js').includes('glowHoles?.(g)')&&api.glowEdge(.6)===.6&&api.owns()===false);
// ⑦ 셰이더: R89 색 보정 다음(디더 뒤)에 곱하고, 판 그림(Sprite)은 색공간 뒤에 곱한다. 맵 rgb/a 로 막힌 텍셀이 섞여 검게 번지지 않음.
{const s=src('local-light-r451.js');ok('mesh shader multiplies after dithering (after R89 grade)',s.includes("'#include <dithering_fragment>\\ngl_FragColor.rgb*=r451Light();'"));
 ok('sprite shader (R204 grass) multiplies after colorspace',s.includes("'#include <colorspace_fragment>\\ngl_FragColor.rgb*=r451Light();'")&&s.includes('isSpriteMaterial'));
 ok('map sampled as rgb/a (blocked texels do not darken edges)',s.includes('s.rgb/s.a*'));
 ok('presentation only (no collision / gameplay writes)',!/floorCells\s*=|\.walls\s*=|\.push\(\s*\{[^}]*solid/.test(s)&&api.inspect().collisionChanged===false&&api.inspect().gameplayChanged===false);}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r451/r451-cpu-check.cjs'));
done();
