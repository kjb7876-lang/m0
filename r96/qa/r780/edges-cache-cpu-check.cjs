// R780 CPU 검사: 바닥 가장자리 가림판(edges-r188.js)을 같은 입력이면 다시 만들지 않는다.
//  헤드리스 실측: 지역에 들어갈 때 엔진이 장면을 두 번 비워(clearScene) 같은 가림판(입력 해시 같음)을 두 번 만들고(한 번 0.2~0.3초),
//  다시 온 지역도 처음부터 다시 만들었다.
//  ① 같은 지역: 장면 비움 → 다시 그리기에서 그림 만들기 1번(두 번째는 다시 씀), 메시는 다시 붙음
//  ② 다시 온 지역: 만들기 없음 ③ 바닥·벽 모양만 다르면(id·bounds 같아도) 다시 만듦 ④ 사몽/아님은 그림이 같아 다시 씀(재질만 다름)
//  ⑤ 저장 개수·화소 상한 ⑥ 빈 판(null)도 기억 ⑦ 끄기·협동이면 안 만듦
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{if(!c){console.error('FAIL: '+m);process.exitCode=1;return;}n++;};
const SRC=fs.readFileSync(path.join(R,'client-source/edges-r188.js'),'utf8');
let gets=0;
function env(){const created=[];
 const ctx2d=c=>({fillRect(){},drawImage(){},set filter(v){},set fillStyle(v){},getImageData(x,y,w,h){gets++;const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<d.length;i+=4)d[i]=((i/4)%w)<w/2?255:128;return{data:d};},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(){}});
 const document={createElement(){const c={width:0,height:0};c.getContext=()=>ctx2d(c);created.push(c);return c;},querySelector:()=>null,getElementById:()=>null};
 class Tex{constructor(c){this.image=c;}dispose(){this.disposed=true;}}
 const T={CanvasTexture:Tex,NoColorSpace:0,SRGBColorSpace:1,RepeatWrapping:2,TextureLoader:class{load(){return{repeat:{set(){}},offset:{set(){}}};}},
  MeshBasicMaterial:class{constructor(o){Object.assign(this,o);this.color=this.color&&typeof this.color==='object'?this.color:{setRGB(){}};}dispose(){}},
  PlaneGeometry:class{dispose(){}},Mesh:class{constructor(g,m){this.geometry=g;this.material=m;this.rotation={};this.position={set(){}};this.layers={set(){}};this.userData={};}}};
 const proto={render(){},clearScene(){}};const win={StoryPhase1:{ThreeRenderer:{prototype:proto}},__STORYWORLD_PHASE1__:{controller:{state:{three:null}}}};
 const sb={window:win,localStorage:{s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;}},setInterval:()=>0,setTimeout:()=>0,performance:{now:()=>0},document,Math,JSON,Object,Array,Map,Set,WeakSet,WeakMap,String,Number,Uint8ClampedArray,Error,console};
 vm.createContext(sb);vm.runInContext(SRC,sb,{filename:'edges-r188.js'});
 const kids=new Set();const r=Object.create(proto);r.T=T;r.spatialRoot={add(m){kids.add(m);},remove(m){kids.delete(m);}};r.spatialResources={add(){}};
 return{sb,r,kids,E:win.__STORYWORLD_EDGES_R188__,created,proto};}
const layout=(id,shift=0)=>({id,bounds:[0,0,30,20],floorRects:[{x:2+shift,y:2,width:10,depth:8},{x:14,y:2,width:6,depth:12}],backdropRects:[],connectorFloorRects:[],walls:[{x:1,y:1,width:1,depth:6}]});
const built=E=>E.inspect().stats.built;
{const {r,kids,E,proto}=env();const A=layout('a'),B=layout('b',3);
 gets=0;proto.render.call(r,{exploration:A});ok(built(E)===1&&kids.size===1,'first render builds once and adds a mesh');const g1=gets;
 proto.render.call(r,{exploration:A});ok(built(E)===1&&gets===g1,'same frame again: no work');
 // ① 장면 비움(엔진이 지역 들어갈 때 두 번 함)
 proto.clearScene.call(r);ok(kids.size===0,'clearScene drops the mesh');proto.render.call(r,{exploration:layout('a')});
 ok(gets===g1,'after clearScene the same layout reuses the mask (no getImageData, was rebuilt before R780)');ok(kids.size===1,'mesh re-added after clearScene');
 ok(E.inspect().stats.reused>=1,'reuse counted');
 // ② 다른 지역 → 돌아오기
 proto.clearScene.call(r);proto.render.call(r,{exploration:B});const g2=gets;ok(g2>g1,'other region builds its own mask');
 proto.clearScene.call(r);proto.render.call(r,{exploration:layout('a')});ok(gets===g2&&kids.size===1,'revisited region reuses its mask');
 // ③ 같은 id·bounds, 바닥 모양 다름
 proto.clearScene.call(r);proto.render.call(r,{exploration:layout('a',1)});ok(gets>g2,'same id+bounds but different floor rects → rebuilt');
 const g3=gets;proto.clearScene.call(r);const W=layout('a',1);W.walls[0].x=5;proto.render.call(r,{exploration:W});ok(gets>g3,'different walls → rebuilt');
 // ④ 사몽 표시만 다름 → 그림 다시 씀, 재질은 사몽 것
 const g4=gets;proto.clearScene.call(r);const S=layout('a',1);S.walls[0].x=5;S.samongR103=true;proto.render.call(r,{exploration:S});ok(gets===g4,'samong flag only changes material; mask reused');
 ok([...kids][0]?.material?.map,'samong material has the flesh map');
 // 텍스처는 매번 새것(앞 것은 dispose 됐으므로)
 const t1=[...kids][0].material.alphaMap;proto.clearScene.call(r);proto.render.call(r,{exploration:S});const t2=[...kids][0].material.alphaMap;ok(t1!==t2&&t1.disposed&&!t2.disposed&&t1.image===t2.image,'new texture over the same cached canvas each time');}
// ⑤ 상한
{const {r,E,proto}=env();for(let i=0;i<20;i++){proto.clearScene.call(r);proto.render.call(r,{exploration:layout('z'+i,i*.01)});}
 const c=E.inspect().stats.cached;ok(c>=2&&c<=8,'cache bounded by count ('+c+')');ok(E.inspect().stats.cachedPx<=8e6,'cache bounded by pixels');}
// ⑥ 빈 판
{const {r,E,proto}=env();const L={id:'v',bounds:[0,0,4,4],floorRects:[],backdropRects:[],connectorFloorRects:[],walls:[]};
 const saveGet=gets;proto.render.call(r,{exploration:L});const g=gets;proto.clearScene.call(r);proto.render.call(r,{exploration:{...L}});ok(gets===g,'null (empty) mask remembered too');}
// ⑦ 끄기
{const {r,kids,E,proto,sb}=env();sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};const g=gets;proto.render.call(r,{exploration:layout('q')});ok(gets===g&&kids.size===0,'co-op: nothing built');}
ok(/if\(r\.r188EdgeKey!==key\)/.test(SRC),'still built once per zone key');
console.log('R780 edges cache CPU check: '+n+' passed'+(process.exitCode?' — FAILED':''));
