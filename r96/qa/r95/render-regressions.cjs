'use strict';
// Isolated regression fixtures for two R94 presentation defects. Uses the
// canonical production modules and actual Three CPU geometry; no GPU claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..'),sourceRoot=path.resolve(process.argv[2]||root),checks=[];
const check=(name,passed,detail)=>checks.push({name,passed:!!passed,detail});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function lightFixture(){
 const requested=[],drawn=[],ready=new Set();let nativeGround=0,nativeHero=0;
 const index={families:{clinical:['clinical']},items:[
  {id:'lamp',kind:'light',region:'clinical',path:'lamp.png',w:80,h:120,color:[1,.7,.4]},
  {id:'floor',kind:'floor',region:'clinical',path:'floor.png',w:230,h:150}]};
 const floorCells=[];for(let x=0;x<24;x++)for(let y=0;y<24;y++)floorCells.push([x,y]);
 const room={exploration:{floorCells,walls:[{x:10,y:2,width:20,depth:.2},{x:2,y:10,width:.2,depth:20}],surface:{art:{r81Environment:'clinical'}}}};
 const c={console,performance:{now:()=>5000},fetch:async()=>({ok:true,json:async()=>index}),localStorage:{getItem:()=>null,setItem(){}},
  room,zone:'ep1a08',layer:'STORY',groundImage(){nativeGround++;},drawHero(){nativeHero++;},actorHeight:()=>66,project:(x,y)=>({x,y}),W:1000,H:1000,
  readyImage:p=>ready.has(p)?{image:{src:p,width:80,height:120}}:null,addImage:p=>{requested.push(p);ready.add(p);},
  ctx:{save(){},restore(){},drawImage(im){drawn.push(im.src);},scale(){},translate(){},globalAlpha:1},
  StoryPhase1:{CommandScene:function(){},explorationBlocked:()=>false}};
 c.StoryPhase1.CommandScene.prototype.applySpatialPolicy=()=>{};c.window=c;vm.createContext(c);
 vm.runInContext(fs.readFileSync(path.join(sourceRoot,'client-source/visual-r92.js'),'utf8'),c);
 const api=c.__STORYWORLD_VISUAL_R92__;api.set({floorDecals:false,lightProps:true});
 c.groundImage();await flush();c.groundImage();c.drawHero();
 check('Light-only setting loads and draws its planned lamps without enabling floor decals',
  api.plan().lights.length>0&&requested.includes('lamp.png')&&drawn.includes('lamp.png')&&!drawn.includes('floor.png'),
  {lights:api.plan().lights.length,requested:[...requested],drawn:[...drawn]});
 const before=drawn.filter(p=>p==='lamp.png').length;api.set({lightProps:false});c.drawHero();
 check('Disabling lamps stops their rendering and their local-light source list',drawn.filter(p=>p==='lamp.png').length===before&&api.lightPoints().length===0);
 api.set({floorDecals:true});c.groundImage();
 check('Floor-only setting still draws floor art and preserves native render calls',drawn.includes('floor.png')&&nativeGround===3&&nativeHero===2&&api.inspect().stats.errors===0,
  {nativeGround,nativeHero,errors:api.inspect().stats.errors});
}
async function wallFixture(){
 const T=await import(pathToFileURL(path.join(root,'hospital-three-pc/site/vendor/three/build/three.module.js')).href);
 let now=1000;function Renderer(){}Renderer.prototype.render=function(){this.renderer.render(this.scene,this.camera);};
 const specs=[{x:5,z:3,w:4,d:1},{x:3,z:5,w:1,d:4}];
 const c={console,performance:{now:()=>now},localStorage:{getItem:()=>null},room:{},
  fetch:async()=>({ok:true,json:async()=>({families:{clinical:['clinical']},items:[{id:'one',region:'clinical',w:60,h:100,path:'decor.png',kind:'flat'}]})}),
  StoryPhase1:{ThreeRenderer:Renderer,explorationBlocked:(_,x,z)=>specs.some(s=>x>=s.x-s.w/2&&x<=s.x+s.w/2&&z>=s.z-s.d/2&&z<=s.z+s.d/2)}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(sourceRoot,'client-source/visual-r91.js'),'utf8'),c);
 const r=new Renderer();r.T={...T,TextureLoader:class{load(){return new T.Texture();}}};r.scene=new T.Scene();r.spatialRoot=new T.Group();r.scene.add(r.spatialRoot);
 r.camera=new T.PerspectiveCamera();r.camera.position.set(10,10,10);r.camera.lookAt(0,0,0);r.camera.layers.set(2);r.renderer={render(){}};
 const meshes=specs.map(s=>{const m=new T.Mesh(new T.BoxGeometry(s.w,2,s.d),new T.MeshBasicMaterial());m.position.set(s.x,1,s.z);r.spatialRoot.add(m);return m;});
 const geometryBefore=meshes.map(m=>Array.from(m.geometry.attributes.position.array));r.wallRows=new Map(meshes.map((mesh,i)=>[i,{mesh}]));
 const frame={zone:'test',layer:'STORY',exploration:{surface:{art:{r81Environment:'clinical'}}},props:[]};
 r.render(frame);await flush();r.render(frame);now=3000;r.render(frame);
 const placed=(r.r91Decor||[]).map(m=>({x:m.position.x,z:m.position.z}));
 check('Distinct transposed wall faces both receive wall decorations',placed.some(p=>p.x>5&&Math.abs(p.z-3.535)<.001)&&placed.some(p=>p.z>5&&Math.abs(p.x-3.535)<.001),{placed,slots:c.__STORYWORLD_VISUAL_R91__.inspect().stats.slots});
 check('Wall decoration build preserves native source geometry and records no overlay errors',JSON.stringify(geometryBefore)===JSON.stringify(meshes.map(m=>Array.from(m.geometry.attributes.position.array)))&&c.__STORYWORLD_VISUAL_R91__.inspect().stats.errors===0);
}
(async()=>{await lightFixture();await wallFixture();})().catch(e=>check('Unexpected exception',false,e.stack)).finally(()=>{
 const report={schema:'storyworld.r95.render-regressions/v1',sourceRoot,method:'Canonical overlay modules in isolated Node VM settings fixtures, plus actual Three CPU BoxGeometry; no browser/GPU/natural-play claim.',checks,passed:checks.every(c=>c.passed),browserVerified:false,GPUVerified:false};
 fs.writeFileSync(path.join(__dirname,sourceRoot===root?'render-regressions-results.json':'render-regressions-before-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.passed)}));if(!report.passed)process.exitCode=1;
});
