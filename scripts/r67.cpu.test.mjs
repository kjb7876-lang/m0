import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {performance} from 'node:perf_hooks';
import * as THREE from '../_pages/docs/vendor/three/build/three.module.js';

const baseline=fs.readFileSync('_baseline/docs/dist/phase1.js','utf8');
const candidate=fs.readFileSync('_pages/docs/dist/phase1.js','utf8');
const json=value=>JSON.parse(JSON.stringify(value));
function fakeDocument(){
 const stats={created:0,removed:0,styleWrites:0,textWrites:0};
 const document={createElement(tag){
  stats.created++;let text='';const node={tag,children:[],parentNode:null,ownerDocument:document,
   style:new Proxy({}, {set(o,k,v){stats.styleWrites++;o[k]=v;return true;}}),
   appendChild(child){child.parentNode=this;this.children.push(child);return child;},
   remove(){if(this.parentNode){const a=this.parentNode.children,i=a.indexOf(this);if(i>=0)a.splice(i,1);this.parentNode=null;stats.removed++;}},
   get textContent(){return text;},set textContent(value){stats.textWrites++;text=String(value);}
  };return node;
 }};
 return{document,stats};
}
function classes(source,document){
 const start=source.indexOf('const affinePoint='),end=source.indexOf('/* All compiled regions depth/shadow path.',start);
 assert.ok(start>=0&&end>start,'Reviewed renderer class boundaries must exist');
 const context={window:{},document,console,finite:(v,d=0)=>Number.isFinite(v)?v:d};
 vm.runInNewContext(source.slice(start,end)+'\nthis.TEST={DrawCommands,CommandScene};',context);
 return context.TEST;
}
function makeCanvas(){return{width:0,height:0,getContext(){return{setTransform(){},drawImage(){},clearRect(){}};}};}
function projection(){return{width:640,height:480,zoom:1,tile:40,camX:0,camY:0,pixelsPerUnit:80,screenToWorld:(x,y)=>({x:(x-320)/80,y:(240-y)/80}),worldToScreen:(x,y)=>({x:320+x*80,y:240-y*80})};}
function recorder(C){return new C.DrawCommands({canvas:{},makeCanvas,measureText:(text)=>({width:text.length*7})});}
function scene(C,document){const root=document.createElement('div');return{root,scene:new C.CommandScene(THREE,{projection:projection(),makeCanvas,createLabelRoot:()=>root})};}
function drawComplex(r,round){
 r.reset(round%2+1);r.scope({id:'fixture',kind:'hero',x:0,y:0},()=>{
  r.fillStyle=round%2?'#aabbcc':'rgba(40,60,90,.7)';r.globalAlpha=.75;
  r.save();r.translate(round/10,round/20);r.rotate(.02*round);r.beginPath();r.rect(20,20,150,120);r.clip();
  r.fillRect(25,30,60,40);r.save();r.strokeStyle='#ddeecc';r.lineWidth=2;r.beginPath();r.ellipse(80,90,20,15,.2,0,Math.PI*2);r.stroke();r.restore();
  const gradient=r.createLinearGradient(0,0,120,0);gradient.addColorStop(0,'#000');gradient.addColorStop(1,'#fff');r.fillStyle=gradient;r.fillRect(10,10,50,20);
  r.restore();r.font='14px sans-serif';r.textAlign='center';r.fillText('실검무 '+round,100,100);r.drawImage({width:32,height:32,src:'fixture.png'},0,0,32,32,70,80,-30,30);
 });return r.finish();
}
const aDoc=fakeDocument(),bDoc=fakeDocument(),A=classes(baseline,aDoc.document),B=classes(candidate,bDoc.document);
test('R67 draw commands preserve exact style, nested state, clipping, gradients and mirrored images',()=>{
 const a=recorder(A),b=recorder(B);
 for(let i=0;i<100;i++)assert.deepEqual(json(drawComplex(b,i)),json(drawComplex(a,i)));
 assert.deepEqual(json(b.styleKeys),Object.keys(b.style()));
 a.dispose();b.dispose();
});
function labels(r,count,round=0){r.reset();r.scope({id:'labels',kind:'scene'},()=>{for(let i=0;i<count;i++){r.fillStyle=i%2?'#ffffff':'#ccddff';r.font=(12+i%3)+'px sans-serif';r.textAlign=i%2?'center':'left';r.globalAlpha=.5+(i%2)*.5;r.fillText('HP '+(1000-i-round),10+i*3+round,20+i*2);}});return r.finish();}
const labelSnapshot=root=>root.children.map(n=>({text:n.textContent,style:{...n.style}}));
test('retained text stays identical while stable frames create zero new nodes and zero DOM writes',()=>{
 const da=fakeDocument(),db=fakeDocument(),ca=classes(baseline,da.document),cb=classes(candidate,db.document),a=scene(ca,da.document),b=scene(cb,db.document),ra=recorder(ca),rb=recorder(cb);
 a.scene.render(labels(ra,24));b.scene.render(labels(rb,24));assert.deepEqual(labelSnapshot(b.root),labelSnapshot(a.root));
 const nodes=[...b.root.children],start={...db.stats};
 for(let i=0;i<99;i++){a.scene.render(labels(ra,24));b.scene.render(labels(rb,24));assert.deepEqual(labelSnapshot(b.root),labelSnapshot(a.root));}
 assert.equal(db.stats.created,start.created);assert.equal(db.stats.styleWrites,start.styleWrites);assert.equal(db.stats.textWrites,start.textWrites);
 assert.ok(nodes.every((n,i)=>n===b.root.children[i]));
 console.log('R67_RETAINED_LABELS',JSON.stringify({frames:100,labelsPerFrame:24,baselineLabelNodes:da.stats.created-1,candidateLabelNodes:db.stats.created-1,unchangedFramesNewNodes:db.stats.created-start.created,unchangedFramesStyleWrites:db.stats.styleWrites-start.styleWrites}));
 for(const [count,round] of [[30,1],[6,5],[0,0],[18,9],[1,21]]){a.scene.render(labels(ra,count,round));b.scene.render(labels(rb,count,round));assert.deepEqual(labelSnapshot(b.root),labelSnapshot(a.root));assert.equal(b.scene.labels.length,count);}
 b.scene.dispose();a.scene.dispose();assert.equal(b.root.children.length,0);assert.equal(b.scene.labels.length,0);
});
test('single-pass is scoped to unlit image materials and preserves all alpha, filter and depth settings',()=>{
 const da=fakeDocument(),db=fakeDocument(),ca=classes(baseline,da.document),cb=classes(candidate,db.document),a=scene(ca,da.document).scene,b=scene(cb,db.document).scene;
 for(const C of [a,b]){const image={width:32,height:32,src:'fixture.png'},r=recorder(C===a?ca:cb);r.scope({id:'image',kind:'hero',x:0,y:0},()=>{r.globalAlpha=.7;r.drawImage(image,30,30,40,40);});C.render(r.finish());}
 const ma=a.rows.get('image:0').mesh.material,mb=b.rows.get('image:0').mesh.material;
 assert.equal(ma.forceSinglePass,false);assert.equal(mb.forceSinglePass,true);assert.equal(mb.userData.r67FlatSinglePass,true);
 for(const key of ['transparent','side','depthTest','depthWrite','opacity','alphaTest','blending','toneMapped'])assert.equal(mb[key],ma[key],key);
 for(const key of ['position','uv'])assert.deepEqual(Array.from(b.rows.get('image:0').mesh.geometry.getAttribute(key).array),Array.from(a.rows.get('image:0').mesh.geometry.getAttribute(key).array));
 const r=recorder(cb);r.fillRect(10,10,40,40);b.render(r.finish());assert.equal(b.rows.get('scene:0').mesh.material.forceSinglePass,false,'Non-image policy is unchanged');
 a.dispose();b.dispose();
});
test('unversioned mutable canvases still take fresh snapshots rather than freezing animations',()=>{
 let copies=0;const C=classes(candidate,fakeDocument().document),r=new C.DrawCommands({canvas:{},makeCanvas:()=>({width:0,height:0,getContext:()=>({setTransform(){},drawImage(){copies++;}})})});
 const canvas={width:32,height:32,getContext(){}};
 for(let i=0;i<3;i++){r.reset();r.drawImage(canvas,0,0);const rows=r.finish();assert.equal(rows[0].mutable,true);}
 assert.equal(copies,3);r.dispose();
});
test('R67 modifies renderer and cache-key only, preserving the complete R66 game HTML',()=>{
 const before=fs.readFileSync('_baseline/docs/index.html','utf8'),after=fs.readFileSync('_pages/docs/index.html','utf8');
 assert.equal(after.replace('dist/phase1.js?r67=1','dist/phase1.js?r66=1'),before);
 const am=JSON.parse(fs.readFileSync('_baseline/docs/web-manifest-r62.json')),bm=JSON.parse(fs.readFileSync('_pages/docs/web-manifest-r62.json'));
 assert.equal(am.files.length,bm.files.length);
 for(let i=0;i<am.files.length;i++)if(!['index.html','dist/phase1.js'].includes(am.files[i].path))assert.deepEqual(bm.files[i],am.files[i]);
 assert.deepEqual(bm.r66,am.r66);assert.equal(bm.r67.simulationChanged,false);assert.equal(bm.r67.mediaChanged,false);
});
test('style snapshot microbenchmark records paired timings without asserting noisy speed ratios',()=>{
 const a=recorder(A),b=recorder(B),times=[];let sink=0;
 for(const [kind,r] of [['baseline',a],['candidate',b],['candidate',b],['baseline',a],['baseline',a],['candidate',b]]){
  for(let i=0;i<2000;i++)sink+=r.style().globalAlpha;
  const start=performance.now();for(let i=0;i<50000;i++){r.globalAlpha=.25+(i%3)*.25;sink+=r.style().globalAlpha;}times.push({kind,snapshots:50000,ms:performance.now()-start});
 }
 assert.ok(sink>0);console.log('R67_STYLE_SNAPSHOT_BENCH',JSON.stringify(times));
});
// Small read-only excerpts identify remaining dynamic-canvas producers; no code is changed here.
const html=fs.readFileSync('_pages/docs/index.html','utf8');
for(const term of ['function cropped(', '__storyworldStaticSource', 'function texturedFloor(']){const i=html.indexOf(term);console.log('R67_REMAINING_PRODUCER',JSON.stringify({term,found:i>=0,excerpt:i>=0?html.slice(Math.max(0,i-80),i+1400):null}));}
