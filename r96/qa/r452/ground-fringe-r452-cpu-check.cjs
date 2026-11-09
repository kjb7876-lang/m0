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
{const s=C('ground-fringe-r452.js');ok('places only where R450 says out',/function specFor\(r\)\{const kind=placeOf\(r\);if\(kind!=='out'\|\|/.test(s));
 ok('no flipping / rotation (r207·r257 rules)',!/scale\.x\s*=\s*-|\*\s*-1\s*:|flipY\s*=\s*false|rotation/.test(s.replace(/\/\/.*$/gm,'')));
 ok('one mesh per zone (single draw), layer 2, presentation only',/new T\.Mesh\(geo,mat\)/.test(s)&&(s.match(/new T\.Mesh\(/g)||[]).length===1&&s.includes("mesh.layers.set(2)")&&s.includes('presentationOnly=true'));}
// 독립 심사 지적(2026-11-09): R81 '해안' 색 묶음에 든 도시 교차로(murder01)·빌라 옥상(murder03)에 늪 수초가 났다 → 뺀다.
//  쉼터·마을(R78 안전 지역)은 바닥이 1번 층 옛 지도 그림이라 바닥 칸 가장자리와 그림 가장자리가 맞지 않는다 → 세계 층(R81) 바닥만.
{const c3=box({__STORYWORLD_WEATHER_R450__:{placeOf:()=>({kind:'out'})}});load(c3,'ground-fringe-r452.js');const A3=c3.__STORYWORLD_GROUND_FRINGE_R452__;
 const ward=fam=>({floorCells:[[0,0],[1,0]],worldWardR81:{environment:{family:fam}}}),rm=(id,L)=>({id,exploration:L});
 ok('paved city (crossroads murder01, rooftop murder03) gets no grass; harbour village and garden still do',A3.specFor(rm('murder01',ward('coast')))===null&&A3.specFor(rm('murder03',ward('coast')))===null&&
  A3.specFor(rm('last302',ward('coast')))===A3.families.coast&&A3.specFor(rm('dist00',ward('garden')))===A3.families.garden&&A3.noFringe.length===2);
 ok('rest zones / village (floor not on the R81 world layer) get no grass',A3.specFor(rm('village',{floorCells:[[0,0]]}))===null&&A3.specFor(rm('restKairo',{floorCells:[[0,0]],surface:{art:{r81Environment:'garden'}}}))===null&&
  A3.specFor(rm('hub',{floorCells:[[0,0]],refugeR82:{}}))===A3.families.regional);}
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
// 소품이 늦게 붙거나 숨겨져(R449 가구·R414 건물) 다시 만들 때: 난수가 후보마다 따로라 그 둘레 밖 풀은 그대로(뒤섞이지 않음)
{const add={x:11.6,y:6,r:1.1},A2=api.plan(cells,spec,{...opt,avoid:[...opt.avoid,add]}),far=q=>Math.hypot(q.x-add.x,q.y-add.y)>2.6,key=q=>JSON.stringify(q);
 const a=A.spots.filter(far).map(key),b=new Set(A2.spots.filter(far).map(key));
 ok('a new avoid circle only changes spots near it (per-candidate random)',a.length>10&&a.every(k=>b.has(k))&&A2.spots.filter(far).length===a.length&&A2.spots.every(q=>Math.hypot(q.x-add.x,q.y-add.y)>=add.r),{far:a.length,kept:a.filter(k=>b.has(k)).length});}
{const s=C('ground-fringe-r452.js');
 ok('hidden props (r303Hide: R303 / R412 / R449 resting R224 furniture) do not reserve space',/p\.visible!==false&&!p\.r303Hide\)pt\(p,/.test(s));
 ok('rebuilds when visible props change (R449 furniture, late R414 buildings), at most 4 times per visit, old mesh disposed',
  /function propSig\(rm\)/.test(s)&&/REBUILD_MAX=4/.test(s)&&/if\(sig!==st\.psig\)\{drop\(r,st\);/.test(s)&&/r\.spatialResources\?\.delete\?\.\(x\);x\.dispose\?\.\(\);/.test(s));}
// R204 둔덕 지역: 거리장(바닥 +, 둔덕 −)으로 둔덕 윗면 가장자리 또는 절벽 밑에만
{const fieldAt=(x,y)=>Math.min(x,12-x,y,8-y),topAt=()=>1.2,T=api.plan(cells,spec,{...opt,fieldAt,topAt});const top=T.spots.filter(q=>q.side==='top'),fl=T.spots.filter(q=>q.side==='floor');
 ok('field mode: some on the bank top, some at the cliff foot',top.length>5&&fl.length>5,{top:top.length,floor:fl.length});
 ok('bank-top spots are off the floor (field < −.1) and raised',top.every(q=>fieldAt(q.x,q.y)<-.1&&q.h===1.2));
 ok('cliff-foot spots are on the floor band (.04..0.8)',fl.every(q=>fieldAt(q.x,q.y)>.04&&fieldAt(q.x,q.y)<.8&&q.h<.05));
 ok('no low front bank tuft right in front of a path cell',top.filter(q=>q.front).every(q=>{const cx=q.x>12?11:q.x<0?0:Math.floor(q.x),cy=q.y>8?7:q.y<0?0:Math.floor(q.y);return !pathSet.has(cx+','+cy);}));}
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r452/ground-fringe-r452-cpu-check.cjs'));
// R24 시야(횃불·손전등) 마스크(R452-4, 독립 심사 지적): R481 덤불·R204 땅처럼 풀 재질에도 attachSight24 — 없으면 시야 밖 검은 구석·벽 뒤에 풀만 길 가장자리를 따라 떠 보였다.
//  vm 상자에서 실제로 판 묶음을 지어 본다: 지을 때 한 번 붙고(장면에 붙기 전), 같은 상태로 다시 붙지 않으며, 지을 때 시야 상태가 없었으면 생긴 뒤 한 번 붙이고 다시 컴파일한다.
(async()=>{try{
 const T={SRGBColorSpace:'srgb',LinearMipmapLinearFilter:1008,LinearFilter:1006,DoubleSide:2,
  BufferGeometry:class{constructor(){this.attributes={};}setAttribute(k,v){this.attributes[k]=v;}setIndex(i){this.index=i;}computeBoundingSphere(){}dispose(){}},
  Float32BufferAttribute:class{constructor(a,n){this.array=a;this.itemSize=n;}},CanvasTexture:class{constructor(c){this.image=c;}dispose(){}},
  MeshBasicMaterial:class{constructor(o){Object.assign(this,o);this.isMeshBasicMaterial=true;this.userData={};this.onBeforeCompile=function(){};this.needsUpdate=false;}dispose(){}},
  Mesh:class{constructor(g,m){this.geometry=g;this.material=m;this.userData={};this.layers={mask:1,set(n){this.mask=1<<n;}};this.visible=true;this.parent=null;}}};
 const canvas=()=>({width:0,height:0,getContext(){return{drawImage(){},getImageData(x,y,w,h){const d=new Uint8Array(w*h*4);for(let yy=h>>2;yy<h-(h>>3);yy++)for(let xx=w>>2;xx<w-(w>>2);xx++)d[(yy*w+xx)*4+3]=255;return{data:d};}};}});
 class Img{constructor(){this.naturalWidth=128;this.naturalHeight=96;}set src(v){this._s=v;Promise.resolve().then(()=>this.onload&&this.onload());}get src(){return this._s;}}
 const cellsS=[];for(let x=0;x<16;x++)for(let y=0;y<10;y++)if(x<3||y<3||x>12)cellsS.push([x,y]);
 const L={floorCells:cellsS,walls:[],worldWardR81:{environment:{family:'garden'}}},rmS={id:'dist00',exploration:L,props:[],npcs:[]};
 const mkBox=()=>{const calls=[];const c=box({Image:Img,document:{createElement:()=>canvas()},room:rmS,zone:'dist00',__STORYWORLD_WEATHER_R450__:{placeOf:()=>({kind:'out'})},__STORYWORLD_SIGHT24__:{enabled:true}});
  // attachSight24 대역: 실제처럼 재질에 표식(userData.sight24·__storySight24)을 남긴다
  c.StoryPhase1.attachSight24=(m,st)=>{calls.push({m,st});const b=m.onBeforeCompile;m.onBeforeCompile=function(sh){b.call(this,sh);};m.onBeforeCompile.__storySight24=st;m.userData.sight24={projected:false};return m;};
  load(c,'ground-fringe-r452.js');const r=new c.StoryPhase1.ThreeRenderer(),kids=[];
  Object.assign(r,{T,scene:{},spatialBuilt:true,sceneGeneration:1,spatialResources:new Set(),spatialRoot:{children:kids,add(m){m.parent=this;kids.push(m);},remove(m){const i=kids.indexOf(m);if(i>=0)kids.splice(i,1);m.parent=null;}},
   camera:{updateMatrixWorld(){},matrixWorld:{elements:[.707,0,-.707,0,.408,.816,.408,0,.577,-.577,.577,0,0,0,0,1]}}});
  c.__STORYWORLD_PHASE1__={controller:{state:{three:r}}};return{c,r,calls};};
 const fr=()=>({layer:'STORY',exploration:L,zone:'dist00',entities:[]}),tick=()=>new Promise(ok=>setTimeout(ok,5));
 {const{c,r,calls}=mkBox();const S={uniforms:{}};r.sightState24=S;r.render(fr());await tick();r.render(fr());const m=r.__r452?.mesh;
  const atBuild=calls.length===1&&calls[0].st===S&&calls[0].m===m?.material&&m?.material?.needsUpdate===false;for(let i=0;i<4;i++)r.render(fr());
  ok('sight mask attached to the grass material once at build (before it joins the scene), never again for the same sight state',!!m&&m.name==='r452-fringe'&&atBuild&&calls.length===1&&c.__STORYWORLD_GROUND_FRINGE_R452__.inspect().sightMasked===true,{built:!!m,calls:calls.length});}
 {const{c,r,calls}=mkBox();r.sightState24=null;r.render(fr());await tick();r.render(fr());const m=r.__r452?.mesh,before=calls.length;const S={uniforms:{}};r.sightState24=S;r.render(fr());r.render(fr());
  ok('no sight state at build → attached once when it appears, and the material recompiles (needsUpdate)',!!m&&before===0&&calls.length===1&&calls[0].st===S&&m.material.needsUpdate===true&&c.__STORYWORLD_GROUND_FRINGE_R452__.inspect().stats.resight===1,{before,after:calls.length});}
 {const s2=C('ground-fringe-r452.js');ok('one attach per material (an attached material is never re-attached with a new state: duplicate shader declarations)',/function sight\(mat,r\)\{if\(!mat\|\|!r\?\.sightState24\|\|typeof A\.attachSight24!=='function'\|\|mat\.userData\?\.sight24\)return false;/.test(s2)&&/sight\(mat,r\);\s*\/\/[^\n]*\n const mesh=new T\.Mesh\(geo,mat\)/.test(s2));}
}catch(e){ok('R452 sight-mask run',false,String(e&&e.stack||e));}
done();})();
