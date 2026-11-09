// R452 CPU check: 길 가장자리 풀 덩어리 — 실외만, 길(R169) 칸·문·제단·소품 둘레는 비움, 바닥 바깥 변을 따라, 벽 속엔 없음, 같은 씨앗이면 같은 자리,
//  승인 자산 두 장(r138 weed·r257 weed-opp)만·뒤집기 없음, 그리기 1번(판 묶음).
const fs=require('fs'),path=require('path');const {R,RT,C,wiring,box,load,runner}=require('../r451/r450-453-common.cjs');
const {ok,done}=runner('R452');
wiring(ok,'ground-fringe-r452.js');
const ctx=box();load(ctx,'ground-fringe-r452.js');const api=ctx.__STORYWORLD_GROUND_FRINGE_R452__;
ok('api exposed',api&&api.revision.startsWith('R452')&&typeof api.plan==='function');
// 실내·동굴·기억·눈·기계·대장간에는 풀이 없다(사용자 2026-11-09 "실내 실외구분도 잘해야해")
ok('vegetation families only (no snow/neural/forge/memory/clinical/domestic/cave)',['snow','neural','forge','memory','clinical','domestic','cave'].every(f=>!api.families[f])&&['garden','swamp'].every(f=>api.families[f]));
ok('only approved existing art: r138 weed + r257 weed-opp',api.art.length===2&&api.art[0].path==='assets/r138/props/weed.webp'&&api.art[1].path==='assets/r257/props/weed-opp.webp'&&api.art.every(a=>fs.existsSync(path.join(RT,a.path))));
{const s=C('ground-fringe-r452.js');ok('places only where R450 says out',/function specFor\(r\)\{const kind=placeOf\(r\);if\(kind!=='out'\)return null;/.test(s));
 ok('no flipping / rotation (r207·r257 rules)',!/scale\.x\s*=\s*-|\*\s*-1\s*:|flipY\s*=\s*false|rotation/.test(s.replace(/\/\/.*$/gm,'')));
 ok('one mesh per zone (single draw), layer 2, presentation only',/new T\.Mesh\(geo,mat\)/.test(s)&&(s.match(/new T\.Mesh\(/g)||[]).length===1&&s.includes("mesh.layers.set(2)")&&s.includes('presentationOnly=true'));}
// 방 12×8, 길 = y 4 줄 전체, 제단(2,2) 둘레 1.5 비움, 가운데 기둥 벽
const cells=[];for(let x=0;x<12;x++)for(let y=0;y<8;y++)cells.push([x,y]);
const pathSet=new Set();for(let x=0;x<12;x++)pathSet.add(x+',4');
const spec={rate:1,k:[.15,.2],tint:[1,1,1],top:.5},opt={seed:7,path:pathSet,avoid:[{x:2,y:2,r:1.5}],walls:[[5.5,1.5,6.5,2.5]]};
const A=api.plan(cells,spec,opt),B=api.plan(cells,spec,opt),Cc=api.plan(cells,spec,{...opt,seed:8});
ok('spots found along the room edge',A.spots.length>20,A.spots.length);
ok('no spot inside a path cell',A.spots.every(q=>!pathSet.has(Math.floor(q.x)+','+Math.floor(q.y))),A.spots.filter(q=>pathSet.has(Math.floor(q.x)+','+Math.floor(q.y))));
ok('path skips counted',A.counts.path>0);
ok('no spot within the avoid radius (altar / doors / props)',A.spots.every(q=>Math.hypot(q.x-2,q.y-2)>=1.5));
ok('floor-side spots hug the outer edge (≤ .45 tile in)',A.spots.every(q=>q.x<=.45||q.x>=11.55||q.y<=.45||q.y>=7.55));
ok('no spot inside a wall box',A.spots.every(q=>!(q.x>5.38&&q.x<6.62&&q.y>1.38&&q.y<2.62)));
ok('spots spaced ≥ .62 tile',A.spots.every((q,i)=>A.spots.every((p,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=.62-1e-9)));
ok('same seed → same spots, other seed → different',JSON.stringify(A.spots)===JSON.stringify(B.spots)&&JSON.stringify(A.spots)!==JSON.stringify(Cc.spots));
// R204 둔덕 지역: 거리장(바닥 +, 둔덕 −)으로 둔덕 윗면 가장자리 또는 절벽 밑에만
{const fieldAt=(x,y)=>Math.min(x,12-x,y,8-y),topAt=()=>1.2,T=api.plan(cells,spec,{...opt,fieldAt,topAt});const top=T.spots.filter(q=>q.side==='top'),fl=T.spots.filter(q=>q.side==='floor');
 ok('field mode: some on the bank top, some at the cliff foot',top.length>5&&fl.length>5,{top:top.length,floor:fl.length});
 ok('bank-top spots are off the floor (field < −.1) and raised',top.every(q=>fieldAt(q.x,q.y)<-.1&&q.h===1.2));
 ok('cliff-foot spots are on the floor band (.04..0.8)',fl.every(q=>fieldAt(q.x,q.y)>.04&&fieldAt(q.x,q.y)<.8&&q.h<.05));
 ok('no low front bank tuft right in front of a path cell',top.filter(q=>q.front).every(q=>{const cx=q.x>12?11:q.x<0?0:Math.floor(q.x),cy=q.y>8?7:q.y<0?0:Math.floor(q.y);return !pathSet.has(cx+','+cy);}));}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r452/r452-cpu-check.cjs'));
done();
