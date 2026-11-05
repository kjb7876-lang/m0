// R347 문 그림 비율 유지·문 칸 나누기 검사(정적 + 가짜 엔진). 사용자 2026-11-05 "문이미지 너무늘어나 … 적절하게 배치 및 입구간격조절".
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/world-doors-r83.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/world-doors-r83.js'),'utf8'));ok('client-source and runtime copies agree');
assert(/storyworld\.r347\.doorFit/.test(src));ok('R347 has an off switch');
assert(!/\bblocked\s*=/.test(src)&&!/explorationBlocked/.test(src));ok('collision untouched (no blocked/explorationBlocked override)');
function load(fitOff){
 const store=fitOff?{'storyworld.r347.doorFit':'{"on":false}'}:{};
 const g={window:{__STORYWORLD_WORLD_R74__:{isOpen:(r,d)=>!!d.open}},localStorage:{getItem:k=>store[k]??null,setItem(){}},
  TILE:34,zoom:1,W:1280,H:720,ctx:null,StoryArtR74:{atlases:{props:{path:'p',cells:[]}}},readyImage:()=>null,room:null,regionById:{},
  compileWorld(){},enterRegion:async()=>true,restoreSave:async()=>true,ensureImages:async()=>{},drawProp(){},project:(x,y)=>({x:(x-y)*34+640,y:(x+y)*17+374})};
 const f=new Function(...Object.keys(g),src+';return window.__STORYWORLD_WORLD_DOORS_R83__;');return f(...Object.values(g));
}
const R=load(false),OFF=load(true);
assert.strictEqual(R.doorFitR347(),true);assert.strictEqual(OFF.doorFitR347(),false);ok('fit on by default, off by pref');
// 화면 비율: 원래 문짝 그림(원본 정합점) 비율 vs 화면에 그려지는 문짝 비율
const LEAF=2.7-.24,ZU=Math.sqrt(1.5)/Math.sqrt(1.25);
const screenAspect=(part)=>Math.hypot(part.b.x-part.a.x,part.b.y-part.a.y)/((part.z1-part.z0)*ZU);
const srcAspect={oak:Math.hypot(87,34)/129,metal:Math.hypot(98,36)/127,clinical:Math.hypot(177,46)/379};
const rows=[];
for(const [w,kind] of [[5,'oak'],[6,'oak'],[8,'oak'],[6,'metal'],[8,'metal'],[2.8,'oak'],[3.4,'metal'],[3.4,'clinical'],[2.2,'clinical']]){
 for(const axis of ['y','x']){
  const d=axis==='y'?{x:20,y:20,width:w,depth:.24,axis}:{x:20,y:20,width:.24,depth:w,axis};
  const g=R.geometry(d,false,kind==='clinical',kind==='metal'),leaves=g.parts.filter(p=>p.source==='leaf');
  assert(g.fit&&g.fit.bays>=1,'fit info');
  const per=kind==='clinical'?2:1;assert.strictEqual(leaves.length,g.fit.bays*per);
  for(const l of leaves){const a=screenAspect(l)/srcAspect[kind];assert(a>=.80&&a<=1.121,`leaf aspect ratio ${a.toFixed(3)} w=${w} ${kind}`);}
  // 칸·기둥이 통로 폭을 빈틈·겹침 없이 채운다
  const along=p=>axis==='y'?[p.a.x,p.b.x]:[p.a.y,p.b.y];const segs=g.parts.filter(p=>p.z0===0&&p.z1===LEAF||p.source==='leaf').map(along).map(([a,b])=>[Math.min(a,b),Math.max(a,b)]).sort((a,b)=>a[0]-b[0]);
  const c=axis==='y'?d.x:d.y;assert(Math.abs(segs[0][0]-(c-w/2))<1e-9&&Math.abs(segs.at(-1)[1]-(c+w/2))<1e-9,'covers aperture');for(let i=1;i<segs.length;i++)assert(Math.abs(segs[i][0]-segs[i-1][1])<1e-9,'no gap/overlap');
  // 문틀·상인방은 그대로
  for(const id of ['left-jamb','right-jamb','header'])assert(g.parts.some(p=>p.id===id));
  if(axis==='y')rows.push({w,kind,bays:g.fit.bays,leaf:+g.fit.leaf.toFixed(2),stretch:+g.fit.stretch.toFixed(2)});
 }
}
ok('closed doors: every leaf within 0.80-1.12 of the source art aspect; bays+mullions tile the aperture exactly, both axes');
{const old=OFF.geometry({x:0,y:0,width:6,depth:.24,axis:'y'},false,false,false);const leaf=old.parts.find(p=>p.id==='closed-leaf');assert(screenAspect(leaf)/srcAspect.oak>2.5);ok('baseline (off) reproduces the bug: one leaf stretched >2.5x over a 6-wide aperture');}
// 열린 문: 바깥 두 짝, 원래 길이
for(const [w,kind] of [[6,'oak'],[8,'metal'],[3.4,'clinical']]){const g=R.geometry({x:0,y:0,width:w,depth:.24,axis:'y'},true,kind==='clinical',kind==='metal'),L=g.parts.filter(p=>p.source==='leaf');
 assert.strictEqual(L.length,2);for(const l of L){const len=Math.hypot(l.b.x-l.a.x,l.b.y-l.a.y);assert(len<=w/2+1e-9&&Math.abs(len-g.fit.leaf/2)<1e-9);}assert(!g.parts.some(p=>/mullion/.test(p.id)));}
ok('open doors: two outer leaves swung at natural length, no mullions in the passage');
// 벽 띠 자르기: 늘이지 않는다
{const ps=[{x:0,y:0},{x:200,y:0},{x:200,y:10},{x:0,y:10}],r=R.cropRect([680,20,500,260],ps,'header');assert(Math.abs(r[2]/r[3]-20)<1e-6&&r[0]===680&&r[2]===500&&r[1]>=20&&r[1]+r[3]<=280+1e-6);
 const q=[{x:0,y:0},{x:8,y:0},{x:8,y:90},{x:0,y:90}],r2=R.cropRect([680,20,500,260],q,'left-jamb');assert(Math.abs(r2[2]/r2[3]-8/90)<1e-6&&r2[2]>=4);
 assert.deepStrictEqual(R.cropRect([680,20,500,260],ps,'header'),r);assert.deepStrictEqual(OFF.cropRect([680,20,500,260],ps,'header'),[680,20,500,260]);ok('wall strips crop the wall art to the strip aspect (deterministic), off = old stretch');}
console.log(JSON.stringify({ok:true,checks:n,bays:rows,method:'static + fake engine'}));
