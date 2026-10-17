import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const source=fs.readFileSync('_pages/docs/dist/phase1.js','utf8');
const baseline=fs.readFileSync('_baseline/docs/dist/phase1.js','utf8');
const start=source.indexOf('const affinePoint='),end=source.indexOf('/* All compiled regions depth/shadow path.',start);
assert.ok(start>=0&&end>start);
const env={window:{},console,finite:(v,d=0)=>Number.isFinite(v)?v:d};
vm.runInNewContext(source.slice(start,end)+'\nthis.Recorder=DrawCommands;',env);
const json=x=>JSON.parse(JSON.stringify(x));
const make=()=>new env.Recorder({canvas:{},makeCanvas:()=>({}),measureText:()=>({width:1})});
function distance(p,a,b){const x=b[0]-a[0],y=b[1]-a[1],l=x*x+y*y,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/l)):0;return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);}
function cubic(a,b,c,d,t){const s=1-t;return[0,1].map(k=>s*s*s*a[k]+3*s*s*t*b[k]+3*s*t*t*c[k]+t*t*t*d[k]);}
function maxError(points,a,b,c,d){let worst=0;for(let i=0;i<=500;i++){const p=cubic(a,b,c,d,i/500);let nearest=Infinity;for(let k=1;k<points.length;k++)nearest=Math.min(nearest,distance(p,points[k-1],points[k]));worst=Math.max(worst,nearest);}return worst;}
test('cubic Bézier support fixes the actual missing recorder method without modifying gameplay',()=>{
 const r=make();assert.equal(typeof r.bezierCurveTo,'function');assert.ok(!baseline.includes('bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y){'));
 const game=fs.readFileSync('_pages/docs/index.html','utf8');assert.ok(game.includes('ctx.bezierCurveTo(-size*.43,-size*.78,size*.48,-size*.95,size*.73,size*.34)'),'The original live thread-dance cubic is still present');
 const before=fs.readFileSync('_baseline/docs/index.html','utf8');assert.equal(game.replace('dist/phase1.js?r67=1','dist/phase1.js?r66=1'),before);
});
test('cubic endpoints and centerlines remain within 1/8 physical pixel under scale, shear, rotation and DPR',()=>{
 let seed=67,worstPhysical=0,maxSegments=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const dpr of [1,2,3])for(let trial=0;trial<20;trial++){
  const r=make();r.reset(dpr);const angle=trial*.21,co=Math.cos(angle),si=Math.sin(angle);
  r.setTransform(co*1.7,si*1.7,-si*.8+.21,co*.8,90,130);
  const input=Array.from({length:4},()=>[(random()-.5)*700,(random()-.5)*500]);
  const [a,b,c,d]=input.map(p=>json(r.point(...p)));
  r.moveTo(...input[0]);r.bezierCurveTo(...input[1],...input[2],...input[3]);const points=json(r.current.points);
  assert.deepEqual(points[0],a);assert.deepEqual(points.at(-1),d);assert.ok(points.length<=4097);
  const error=maxError(points,a,b,c,d)*dpr;assert.ok(error<=.125001,JSON.stringify({dpr,trial,error}));worstPhysical=Math.max(worstPhysical,error);maxSegments=Math.max(maxSegments,points.length-1);
 }
 console.log('R67_CUBIC_ACCURACY',JSON.stringify({curves:60,analyticSamplesPerCurve:501,worstPhysicalPixelError:worstPhysical,maxSegments,tolerancePhysicalPixels:.125}));
});
test('straight, looping, coincident-endpoint and collinear reversal curves are not erased',()=>{
 for(const points of [[[0,0],[20,0],[80,0],[100,0]],[[0,0],[100,160],[-100,160],[0,0]],[[0,0],[200,0],[-150,0],[10,0]],[[5,5],[5,5],[5,5],[5,5]]]){
  const r=make();r.moveTo(...points[0]);r.bezierCurveTo(...points[1],...points[2],...points[3]);const recorded=json(r.current.points);
  assert.ok(maxError(recorded,...points)<=.125001);assert.deepEqual(recorded.at(-1),points[3]);
 }
});
test('Canvas empty subpaths, closePath continuation, transforms and ignored nonfinite arguments are preserved',()=>{
 const r=make();r.reset(2);r.translate(20,40);r.bezierCurveTo(0,0,20,60,80,0);
 assert.deepEqual(json(r.current.points[0]),[10,20]);assert.deepEqual(json(r.current.points.at(-1)),[50,20]);
 r.beginPath();r.moveTo(0,0);r.lineTo(10,10);r.closePath();const old=r.current;r.bezierCurveTo(15,50,40,50,70,0);
 assert.equal(old.closed,true);assert.equal(r.paths.length,2);assert.notEqual(r.current,old);assert.deepEqual(json(r.current.points[0]),json(old.points[0]));
 r.beginPath();r.resetTransform();r.moveTo(4,8);r.translate(100,100);r.bezierCurveTo(1,1,2,2,3,3);assert.deepEqual(json(r.current.points[0]),[2,4]);assert.deepEqual(json(r.current.points.at(-1)),[51.5,51.5]);
 const before=json(r.paths);r.bezierCurveTo(NaN,1,2,3,4,5);r.bezierCurveTo(1,2,Infinity,4,5,6);assert.deepEqual(json(r.paths),before);
 const blank=make();blank.bezierCurveTo(Infinity,0,1,1,2,2);assert.equal(blank.paths.length,0);
});
test('extreme cubic input is bounded and fails before mutating the existing path',()=>{
 const r=make();r.moveTo(0,0);const before=json(r.paths);assert.throws(()=>r.bezierCurveTo(1e30,1e30,-1e30,1e30,0,0),/subdivision budget/);assert.deepEqual(json(r.paths),before);
 r.bezierCurveTo(10,20,30,20,40,0);assert.deepEqual(json(r.current.points.at(-1)),[40,0]);
});
