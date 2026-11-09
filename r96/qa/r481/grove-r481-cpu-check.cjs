// R481 CPU 검사: 실외 숲 덩어리(이터널시티 참고 — 길 둘레를 덤불·작은 나무 무리가 감싸는 밀도).
//  R204 가 대지 위에 한 그루씩 흩어 둔 나무 둘레에 덤불·어린 나무를 모으고, 나무 없는 대지 가장자리에 작은 숲을 더한다.
//  보기만 바꾼다(충돌·문·몹·저장 그대로). 놓는 자리 규칙·결정성·상한·저사양 절반·끄기·그리기 묶음 수를 검사한다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='grove-r481.js';let src='';try{src=C(F);}catch(e){}
ok('source exists',!!src);
try{ok('runtime copy matches source',src===RT(F));}catch(e){ok('runtime copy matches source',false);}
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after cave-r204',html.split('"./'+F+'"').length===2&&/<script src="\.\/cave-r204\.js"><\/script>\s*<script src="\.\/grove-r481\.js"><\/script>/.test(html));
ok('loads after cave-r204',html.indexOf('"./cave-r204.js"')>=0&&html.indexOf('"./cave-r204.js"')<html.indexOf('"./'+F+'"'));
ok('listed in verify-r96-public.py',/'grove-r481\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('CI runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('node r96/qa/r481/grove-r481-cpu-check.cjs'));
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
ok('no gameplay writes (walls/floorCells/hp/save)',!!src&&!/floorCells\s*=|walls\s*=|\.hp\s*=[^=]|saveGame|room\.exploration\s*=/.test(code));
ok('no drop-shadow/blur filter',!/drop-shadow|blur\(/.test(code));
ok('Mammon zones excluded explicitly',/ep1b06(?!b)/.test(src));
// ---- 순수 배치 함수 -------------------------------------------------------------------------
function load(o={}){const g={console,Math,JSON,Object,Array,Set,Map,Number,String,Error,Float32Array,Uint16Array,Uint32Array,performance:{now:()=>0},
 localStorage:{getItem:k=>k==='storyworld.r481.grove'&&o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setInterval(){},clearInterval(){},setTimeout(){},settings:{lowFx:!!o.low}};
 g.window=g;g.window.StoryPhase1={ThreeRenderer:function(){},attachSight24(m,s){(g.__sight=g.__sight||[]).push([m,s]);}};vm.createContext(g);vm.runInContext(src||'',g);return g;}
const G=load(),API=G.__STORYWORLD_GROVE_R481__;ok('API exported',!!API&&typeof API.plan==='function'&&typeof API.build==='function');
// 40×40 장: 가운데 바닥 (10..30)², 신호 거리 = 바닥 안 +, 밖 −. 뒤쪽(북서: x+y 작음) 대지는 높고(1.3) 앞쪽은 낮다(.4) — R204 와 같은 규칙.
const W=40,H=40,fv=(x,y)=>{const dx=Math.max(10-x,0,x-30),dy=Math.max(10-y,0,y-30);if(dx===0&&dy===0)return Math.min(x-10,30-x,y-10,30-y);return -Math.hypot(dx,dy);},top=(x,y)=>(x+y<40?1.3:.4);
const doors=[[20,9.5,3.5]];const trees=[[8,15,4],[15,7.5,4.2],[5,25,3.8]].map(([x,y,h])=>({x,y,h,mat:0}));
const P=API?API.plan({W,H,fv,top,doors,trees,seed:0x5d0077,mats:1}):[];
ok('places something',P.length>0);
ok('cap respected (≤ 3.2 per tree + 60, never > 320)',P.length<=Math.min(320,trees.length*3.2+60));
ok('every spot is on plateau ring −6 ≤ fv ≤ −0.9',P.length>0&&P.every(p=>{const v=fv(p.x,p.y);return v<=-.9&&v>=-6;}));
ok('every spot is on high back plateau (top ≥ 1.05, never camera side)',P.length>0&&P.every(p=>top(p.x,p.y)>=1.05));
ok('door clearings kept (≥ 4.5 from door, nothing tall in the 13-tile band in front of it — same rule as R204 nearDoorR443)',P.every(p=>{const dx=p.x-20,dy=p.y-9.5,f=dx+dy,sd=Math.abs(dx-dy);return Math.hypot(dx,dy)>=4.5&&!(f>0&&f<13&&sd<5.5);}));
ok('no stacking (new spots ≥ .7 apart, ≥ .6 from trees)',P.every((p,i)=>P.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=.7)&&trees.every(t=>Math.hypot(t.x-p.x,t.y-p.y)>=.6)));
ok('understory smaller than canopy (scale .3..1.0 of its tree)',P.length>0&&P.every(p=>p.s>=.3&&p.s<=1.0));
ok('understory is darker (shade .6..1.0)',P.length>0&&P.every(p=>p.shade>=.6&&p.shade<=1));
ok('companions cluster around existing trees (some within 2.2)',trees.every(t=>P.some(p=>Math.hypot(p.x-t.x,p.y-t.y)<=2.2)));
ok('bare rim gets new groves (x≥22 back edge has spots although no tree)',P.some(p=>p.y<10&&p.x>23));
const P2=API?API.plan({W,H,fv,top,doors,trees,seed:0x5d0077,mats:1}):[];ok('deterministic',JSON.stringify(P)===JSON.stringify(P2));
const P3=API?API.plan({W,H,fv,top,doors,trees,seed:0x123,mats:1}):[];ok('seed changes layout',JSON.stringify(P)!==JSON.stringify(P3));
const L=load({low:true}).__STORYWORLD_GROVE_R481__;const PL=L?L.plan({W,H,fv,top,doors,trees,seed:0x5d0077,mats:1}):[];
ok('low-fx halves the count',PL.length>0&&PL.length<=Math.ceil(P.length/2)+1);
const flat=API?API.plan({W,H,fv,top:()=>.4,doors,trees:[],seed:1,mats:1}):[1];ok('no high plateau → nothing',flat.length===0);
ok('pref off disables',load({prefs:{on:false}}).__STORYWORLD_GROVE_R481__?.enabled()===false&&API?.enabled()===true);
ok('indoor / Mammon / non-tree zones skipped',API&&API.zoneOk('dist00')&&!API.zoneOk('ep1b06')&&!API.zoneOk('ep1a08')&&!API.zoneOk(null));
// ---- 그리기 묶음: 그림(재질)마다 메시 1개 → 그리기 호출 수 상한 ----------------------------------------
if(API){class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}setFromMatrixColumn(m,i){const e=m.elements;this.x=e[i*4];this.y=e[i*4+1];this.z=e[i*4+2];return this;}}
 class Geo{constructor(){this.attr={};}setAttribute(n,a){this.attr[n]=a;}setIndex(i){this.index=i;}computeBoundingSphere(){}}
 class Attr{constructor(a,n){this.array=a;this.n=n;}}
 class Mat{constructor(o){Object.assign(this,o);this.color=o.color||{r:1,g:1,b:1};}}
 class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.layers={set:v=>this.layer=v};this.userData={};}}
 class Group{constructor(){this.children=[];this.userData={};}add(o){this.children.push(o);}getObjectByName(n){return this.children.find(c=>c.name===n);}}
 const T={Vector3:V3,BufferGeometry:Geo,Float32BufferAttribute:Attr,MeshBasicMaterial:Mat,Mesh,Group,Color:class{constructor(r,g,b){this.r=r;this.g=g;this.b=b;}},DoubleSide:2};
 const maps=[{id:'a'},{id:'b'},{id:'c'}];const sp=trees.map((t,i)=>({position:{x:t.x,y:t.h,z:t.y},scale:{x:3.6,y:3.8},center:{x:.5,y:.04},material:{map:maps[i%3],color:{r:.8,g:.8,b:.7},alphaTest:.45}}));
 const sightState={id:1};const res=new Set(),cam={matrixWorld:{elements:[.707,0,-.707,0,-.354,.866,-.354,0,0,0,0,0,0,0,0,1]}};
 const out=API.build(T,{camera:cam,spatialResources:res,sightState24:sightState},{W,H,fv,top,doors,seed:0x5d0077},sp);
 ok('build returns a group of ≤ 1 mesh per tree picture',!!out&&out.children.length>0&&out.children.length<=maps.length);
 ok('meshes are presentation-only on layer 2, depth-tested cutout',out&&out.children.every(m=>m.layer===2&&m.userData.presentationOnly===true&&m.material.alphaTest>=.4&&m.material.depthWrite===true));
 const quads=out?out.children.reduce((s,m)=>s+m.geometry.attr.position.array.length/12,0):0;ok('one quad per planted spot',quads===API.plan({W,H,fv,top,doors,trees:sp.map(s=>({x:s.position.x,y:s.position.z,h:s.position.y})),seed:0x5d0077,mats:3}).length);
 ok('quads face the camera (top edge along camera up)',out&&out.children.every(m=>{const a=m.geometry.attr.position.array;const dy=a[7]-a[1];return dy>0;}));
 ok('understory quads use the crown crop (uv v starts ≥ .35), canopy trees use the whole picture',out&&out.children.some(m=>{const a=m.geometry.attr.uv.array;for(let i=1;i<a.length;i+=8)if(a[i]>=.35)return true;return false;})&&out.children.every(m=>{const a=m.geometry.attr.uv.array;for(let i=1;i<a.length;i+=8)if(!(Math.abs(a[i])<1e-9||a[i]>=.35))return false;return true;}));
 ok('ground contact darker than crown (bottom vertex colour < top)',out&&out.children.every(m=>{const c=m.geometry.attr.color.array;return c[0]<c[6];}));
 // Codex #354 리뷰: 덤불도 시야(횃불) 마스크를 받아야 시야 밖에서 혼자 보이지 않는다(R204 나무·풀처럼)
 ok('every grove material gets the sight mask (attachSight24 with the renderer sight state)',out&&out.children.length>0&&out.children.every(m=>(G.__sight||[]).some(([mm,ss])=>mm===m.material&&ss===sightState)));
 ok('GPU resources registered for disposal',res.size>=out.children.length*2);}
console.log(`\nR481 grove: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
