// R300 CPU 검사: 빛 웅덩이·안개 띠·재/포자·영웅 접지 그림자(light-atmos-r300.js). CPU 근거만 — GPU·실기기 화면은 미검증.
//  ① 사본·매니페스트·등록 ② 가짜 THREE 위에서 빛 개수 상한(PC 24·모바일 10·가벼운 화면 6) ③ 모바일 재·안개 감소
//  ④ 설정 끔 = 3D 물체 모두 숨김·영웅 그림 없음 ⑤ 시야(횃불·손전등) 켜짐 = 어둡게·빛 웅덩이 끔 ⑥ draw 증가 상한 ⑦ ctx.filter·blur·drop-shadow 금지.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..'),SRC=fs.readFileSync(path.join(R,'client-source/light-atmos-r300.js'),'utf8');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('PASS '+m);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// ① 등록
const rt=fs.readFileSync(path.join(R,'runtime-text/light-atmos-r300.js'),'utf8');ok(rt===SRC,'runtime copy matches client-source');
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok(man.files.find(r=>r.path==='light-atmos-r300.js')?.sha256===sha(SRC)&&inputs.textPaths.includes('light-atmos-r300.js'),'overlay in runtime manifest/inputs');
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok(/<script src="\.\/light-atmos-r300\.js"><\/script>(<script src="\.\/env-props-r299\.js"><\/script>)?<script src="\.\/mobile-perf-r298\.js">/.test(html.replace(/<script src="\.\/env-props-r299\.js"><\/script><script src="\.\/light-atmos-r300\.js">/,'<script src="./light-atmos-r300.js">')),'script tag right before mobile-perf-r298');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r300/r300-cpu-check.cjs'),'CI step');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'light-atmos-r300.js'"),'public verify list');
// ⑦ 금지 문자열
const CODE=SRC.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
ok(!/\.filter\s*=|drop-shadow|blur\(/.test(CODE),'no ctx.filter assignment / drop-shadow / blur');
ok(!/explorationBlocked|floorCells\s*=|\.walls\s*=|hp\s*-=|\.damage\s*=|saveGame|localStorage\.setItem\((?!KEY)/.test(CODE),'no collision/damage/save writes');
// ② 가짜 THREE
class Obj{constructor(){this.layers={mask:1,set(l){this.mask=1<<l;}};this.visible=true;this.position={x:0,y:0,z:0,set(){}};this.scale={set(){}};this.userData={};this.parent=null;}}
class Geo{constructor(){this.drawRange={start:0,count:Infinity};}rotateX(){return this;}setAttribute(){}setDrawRange(s,c){this.drawRange={start:s,count:c};}dispose(){}}
const V=()=>({x:0,y:0,z:0,set(...a){this.x=a[0];this.y=a[1];this.z=a[2];return this;},setRGB(){return this;}});
const T={PlaneGeometry:Geo,BufferGeometry:Geo,BufferAttribute:class{},Sphere:class{},Vector2:class{constructor(){Object.assign(this,V());}},Vector3:class{constructor(){Object.assign(this,V());}},
 Color:class{constructor(){this.r=this.g=this.b=0;}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}},Matrix4:class{makeScale(){return this;}setPosition(){return this;}},
 ShaderMaterial:class{constructor(o){Object.assign(this,o);}dispose(){}},MeshBasicMaterial:class{constructor(o){Object.assign(this,o);}dispose(){}},CanvasTexture:class{dispose(){}},TextureLoader:class{load(){}},
 Mesh:class extends Obj{constructor(g,m){super();this.geometry=g;this.material=m;}},Points:class extends Obj{constructor(g,m){super();this.geometry=g;this.material=m;}},
 InstancedMesh:class extends Obj{constructor(g,m,c){super();this.geometry=g;this.material=m;this.max=c;this.count=c;this.instanceMatrix={setUsage(){}};this.set=0;}setMatrixAt(i){assert.ok(i<this.max,'instance index within buffer');}setColorAt(){if(!this.instanceColor)this.instanceColor={setUsage(){}};}},
 CustomBlending:5,AddEquation:100,ZeroFactor:200,SrcColorFactor:202,OneFactor:201,AdditiveBlending:2,DynamicDrawUsage:35048,RepeatWrapping:1000};
function world({coarse=false,lowFx=false,store={},sight=false,layer='STORY',props=40,r287=false,own=false}={}){
 const kids=[];const scene={children:kids,add(o){o.parent=scene;kids.push(o);},remove(o){kids.splice(kids.indexOf(o),1);o.parent=null;}};
 const ctxCalls=[],scopes=[];const g2={createRadialGradient:()=>({addColorStop(){}}),fillRect(){},setTransform(){},fill(){},beginPath(){}};
 class Proto{render(f){this.rendered=(this.rendered||0)+1;}dispose(){}}
 const r=Object.create(Proto.prototype);Object.assign(r,{T,scene,renderer:{getPixelRatio:()=>1}});if(own)r.render=Proto.prototype.render;/* perf-r97 인스턴스 복사 */const timers=[];
 const c={console,Math,JSON,Object,Array,Set,WeakMap,Number,String,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},matchMedia:()=>({matches:coarse}),performance:{now:()=>1000},setInterval:f=>{timers.push(f);return timers.length;},setTimeout:()=>0,requestAnimationFrame:()=>0,innerWidth:1280,innerHeight:720,
  document:{createElement:()=>({getContext:()=>g2,width:0,height:0}),getElementById:()=>null},
  settings:{lowFx,flashlight58:sight?true:false,reducedMotion:false},player:{x:20,y:20},
  room:{props:Array.from({length:props},(_,i)=>({x:i*2,y:i%5,path:'assets/props/brazier.webp'})),exploration:{floorCells:[]}},
  actorHeight:()=>66,ctx:{globalAlpha:1,owner:{id:'hero1',kind:'hero'},save(){},restore(){},drawImage(...a){ctxCalls.push(a);},scope(o,fn){scopes.push(o);return fn();}},
  StoryPhase1:{ThreeRenderer:{prototype:Proto.prototype}}};
 c.window=c;c.__STORYWORLD_PHASE1__={controller:{state:{three:r}}};
 c.shadow=function(){ctxCalls.push(['base']);};c.drawHero=function(){c.shadow(20,20,18,{});};
 vm.createContext(c);vm.runInContext(SRC,c,{filename:'light-atmos-r300.js'});if(r287)vm.runInContext(fs.readFileSync(path.join(R,'client-source/render-lod-r287.js'),'utf8'),c,{filename:'render-lod-r287.js'});
 return{c,r,kids,ctxCalls,scopes,tick:k=>{for(let i=0;i<k;i++)for(const f of timers)f();},api:c.__STORYWORLD_LIGHT_ATMOS_R300__,frame:()=>{r.render({layer,zone:'z'});return r.__r300;}};}
const draws=o=>[o.dim,o.pools,...o.fog,o.motes].filter(m=>m.visible&&m.parent).length;
{const w=world(),o=w.frame();ok(o.pools.count===24&&o.pools.visible,'PC: 40 lights capped at 24 pools ('+o.pools.count+')');ok(o.pools.max===24,'instance buffer = PC cap');
 ok(o.motes.geometry.drawRange.count===300,'PC motes 300');ok(o.fog.filter(f=>f.visible).length===3,'PC fog bands 3');ok(o.dim.visible&&o.dim.material.uniforms.k.value>=.8&&o.dim.material.uniforms.k.value<=.85,'STORY dim 15~20%');
 ok(draws(o)<=w.api.config.extraDraws.pc&&draws(o)===6,'PC 3D draw increase <= 6 ('+draws(o)+')');ok(w.r.rendered===1,'base render still called');
 w.c.drawHero();ok(w.ctxCalls.length===3&&w.ctxCalls[2][0]==='base','hero: shadow + rim images then native shadow');ok(w.scopes.length===1&&w.scopes[0].kind==='contact'&&w.scopes[0].id==='hero1','Codex P2: hero shadow/rim recorded in contact scope (layer 1, behind body/front walls), not hero scope');}
{const w=world({coarse:true}),o=w.frame();ok(o.pools.count===10,'mobile pools capped at 10');ok(o.motes.geometry.drawRange.count===150,'mobile motes halved (150)');ok(o.fog.filter(f=>f.visible).length===2,'mobile fog bands 2');
 ok(o.dim.material.uniforms.k.value>w.api.config.dim.pc,'mobile dims less');ok(draws(o)<=w.api.config.extraDraws.mobile,'mobile 3D draw increase <= 5');}
{const w=world({lowFx:true}),o=w.frame();ok(o.pools.count===6&&!o.motes.visible&&o.fog.filter(f=>f.visible).length===1,'low FX: 6 pools, no motes, 1 fog band');}
{const store={'storyworld.r300.lightAtmos':JSON.stringify({on:false})};const w=world({store}),o=w.frame();ok(draws(o)===0,'setting off: no 3D objects visible');w.c.drawHero();ok(w.ctxCalls.length===1,'setting off: no hero images');ok(w.r.rendered===1,'setting off: base render runs');}
{const w=world();w.api.set({pools:false});const o=w.frame();ok(!o.dim.visible&&!o.pools.visible&&o.motes.visible,'pools toggle off also removes dim, keeps motes');}
{const w=world({sight:true}),o=w.frame();ok(!o.dim.visible&&!o.pools.visible,'torch/flashlight sight on: no dim, no pools (no double light)');}
{const w=world({layer:'SAMONG'}),o=w.frame();ok(!o.dim.visible&&o.pools.visible,'samong: pools without extra dim');}
{const w=world({props:0}),o=w.frame();ok(o.pools.count===0&&!o.pools.visible,'no lights → pool mesh hidden');}
{const w=world();ok(typeof w.c.StoryPhase1.ThreeRenderer.prototype.render==='function'&&w.c.StoryPhase1.ThreeRenderer.prototype.render.__r300,'prototype render wrapped');
 w.r.render=w.c.StoryPhase1.ThreeRenderer.prototype.render;ok(/hasOwnProperty\.call\(r,'render'\)/.test(SRC),'instance render (perf-r97 copy) also wrapped');}
// Codex P1: R287 이 500ms 마다 render 를 다시 감싸도 R300 래퍼가 쌓이지 않고 프레임당 갱신 1회
for(const own of [false,true]){const w=world({r287:true,own});w.tick(600);const st=()=>w.api.inspect().stats.frames;const b=st();w.r.render({layer:'STORY',zone:'z'});
 ok(st()-b===1,'R287+R300 after 600 timer ticks'+(own?' (instance render copy)':'')+': exactly 1 R300 update per frame (got '+(st()-b)+')');
 ok(w.r.rendered>=1,'base render runs once per frame');}
ok(/FOG_TEXTURES=Object\.freeze\(\{story:null,samong:null\}\)/.test(SRC),'fog texture hook present (assets/r300/fog-*.png later), no 404 fetch now');
console.log('R300 CPU checks passed: '+n);
