// R442 CPU check — 낮은 돌 경계(성벽 조형물, garden_low_border) 단독 금지: 곧은 대지 가장자리를 따라 2장 이상 끝과 끝을 이어 한 줄로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='cave-r204.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
ok('revision R442-cave-1',/const REV='R442-cave-1'/.test(src));
ok('uprights go through borderRuns unless switched off (storyworld.r204.cave {"borderRuns":false})',/if\(ups\.length&&prefs\.borderRuns!==false\)\{const rr=borderRuns\(/.test(src)&&/prefs\.borderRuns=s\.borderRuns/.test(src)&&/prefs\.borderRuns=p\.borderRuns/.test(src));
ok('old one-by-one scatter only on the off path',/else if\(ups\.length\)\{const want=/.test(src));
// 함수만 떼어 가짜 지형에서 돌린다: y<20 은 높은 대지(가장자리 y=20 곧은 선), x<15 도 대지(가장자리 x=15).
const grab=name=>{const i=src.indexOf('function '+name+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]==='{')d++;else if(src[j]==='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const ctx={Math,stats:{},prefs:{},ISO_T:34,
 rng:s=>{let a=s>>>0;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};},
 rowOf:()=>({x0:24,x1:496,ax:260,ay:334.7,m:-0.329,w:512,h:512}),
 at:(F,f,x,y)=>Math.min(y-20,x-15),
 topHeight:()=>1.3};
class G{constructor(){this.a={};}setAttribute(k,v){this.a[k]=v;}setIndex(i){this.i=i;}computeBoundingSphere(){}}
ctx.T={MeshBasicMaterial:class{constructor(o){Object.assign(this,o);}},Color:class{constructor(r,g,b){this.r=r;}},DoubleSide:2,BufferGeometry:G,Float32BufferAttribute:class{constructor(a,k){this.array=a;this.k=k;}},
 Mesh:class{constructor(g,m){this.geometry=g;this.material=m;this.layers={set(){}};this.userData={};}}};
vm.createContext(ctx);vm.runInContext(grab('borderRuns'),ctx);
const added=[];const parent={add:o=>added.push(o)};const r={camera:null,spatialResources:{add(){}}};
const ups=[{m:{map:{image:{naturalWidth:512}}},sc:.3}];const Fd={W:60,H:60,f:null};
const cfg={seed:7,uprightRate:1/60,uprightEdge:[-1.0,-.35]};
const got=ctx.borderRuns(ctx.T,r,Fd,cfg,ups,()=>true,parent);
ok('places stones on straight plateau edges ('+got+' pieces)',got>=4);
ok('every run has at least 2 pieces (no lone single)',ctx.stats.borderRuns>0&&ctx.stats.borderRunMin>=2);
ok('pieces = segments reported',ctx.stats.borderRunSegments===got);
ok('both edge directions used: one normal mesh and one mirrored mesh',added.some(m=>/:n$/.test(m.name))&&added.some(m=>/:f$/.test(m.name)));
// 한 줄 안 조각은 같은 선 위에 일정 간격 → 첫 두 조각 사이 거리 = L
const mesh=added.find(m=>/:n$/.test(m.name)),P=mesh.geometry.a.position.array;const c0=[(P[0]+P[6])/2,(P[2]+P[8])/2],c1=[(P[12]+P[18])/2,(P[14]+P[20])/2];
ok('neighbouring pieces sit on one straight line',Math.abs(c0[0]-c1[0])<1e-6||Math.abs(c0[1]-c1[1])<1e-6);
const off=ctx.borderRuns(ctx.T,r,{W:60,H:60},cfg,ups,()=>false,{add(){}});
ok('nothing placed where the edge is not clear (no fallback single)',off===0);
ok('presentation only: no wall/floor/collision writes in borderRuns',!/\.walls\s*=|floorCells\s*=|blocked\s*=/.test(grab('borderRuns')));
console.log(bad?bad+' failed':'all '+n+' passed');process.exit(bad?1:0);
