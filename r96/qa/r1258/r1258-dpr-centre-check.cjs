// R1258b — 낮은 성능(그래픽 단계 1, dpr .75)에서 적중 그림이 적 그림 왼쪽 위에 터지는 오류.
//  원인: R259 가 적 몸 그림 가운데를 '장치 좌표'(엔진 draw() 의 setTransform(dpr) 포함)로 재고, 적중 그림은 project 좌표에서 그 값으로 옮긴다.
//  dpr 1 이면 같지만 dpr .75 면 가운데가 원점 쪽(왼쪽 위)으로 25% 끌려가고, dpr 1.5 면 오른쪽 아래로 밀린다. R115 는 drawEnemy 시작 행렬의 역행렬로 바로잡아 재므로 R259 도 같게.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('hit-center-r259.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('hit-center-r259.js')===src);
function make(dpr,shake=0){const ctx={localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,String,Array,Set,WeakMap,Map,Object,Number,Promise,DOMMatrix:globalThis.DOMMatrix,DOMPoint:globalThis.DOMPoint,performance:{now:()=>1000}};ctx.window=ctx;
 const log=[];let T={a:dpr,b:0,c:0,d:dpr,e:shake*dpr,f:0};const c2d={getTransform:()=>({...T}),drawImage(){},translate(x,y){log.push(['t',x,y]);},save(){},restore(){}};
 const img={width:100,height:100,naturalWidth:100,naturalHeight:100,src:'assets/mobs/x.webp'};
 Object.assign(ctx,{ctx:c2d,time:1,effects:[],room:{enemies:[]},actorHeight:()=>50,project:(x,y)=>({x:x*10,y:y*10}),
  drawEnemy:e=>{c2d.drawImage(img,0,0,100,100,e.x*10-30,e.y*10-120,60,120);if(ctx.__inner)ctx.__inner(e);},drawEffect:f=>{log.push(['d',f.type]);},fx:(type,x,y,o={})=>{ctx.effects.push({type,x,y,...o});}});
 ctx.document={createElement:()=>({getContext:()=>({clearRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(40*40*4).fill(255)})})})};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,log};}
// 몸 그림: 발 (50,50) 기준 x 20..80, y -70..50 → 가운데 (50,-10), 머리 -70 (project 좌표)
for(const [dpr,shake] of [[1,0],[.75,0],[1.5,0],[.75,3]]){const {ctx,log}=make(dpr,shake);const e={id:'a',hp:10,x:5,y:5};ctx.room.enemies.push(e);ctx.drawEnemy(e);
 const H=ctx.__STORYWORLD_HIT_CENTER_R259__,v=H.centreOf(e);
 ok(`dpr ${dpr} shake ${shake}: measured centre is in project coordinates (50,-10), not device pixels`,v&&Math.abs(v.cx-50)<1e-6&&Math.abs(v.cy+10)<1e-6&&Math.abs(v.top+70)<1e-6&&Math.abs(v.h-120)<1e-6&&Math.abs(v.w-60)<1e-6,v&&{cx:v.cx,cy:v.cy,top:v.top,h:v.h,w:v.w});
 ctx.fx('burst',5,5);log.length=0;ctx.drawEffect(ctx.effects[0]);const t=log.find(x=>x[0]==='t');
 ok(`dpr ${dpr} shake ${shake}: hit burst moves only up to the body centre (no sideways pull toward the screen top-left)`,t&&Math.abs(t[1])<1e-6&&Math.abs(t[2]-(-10-(50-15)))<1e-6,t);
 const a=H.aim(5,5);ok(`dpr ${dpr} shake ${shake}: aim() returns the body centre in project coordinates`,Math.abs(a.x-50)<1e-6&&Math.abs(a.y+10)<1e-6,a);}
// mob-foot-r332 가 넘기는 실제 몸 그림(bodyDrawn, 그 순간 행렬)도 같은 좌표계로
{const {ctx}=make(.75,2);const e={id:'b',hp:10,x:5,y:5};ctx.room.enemies.push(e);const img={width:100,height:100,naturalWidth:100,naturalHeight:100,src:'assets/mobs/y.webp'};
 ctx.__inner=q=>ctx.__STORYWORLD_HIT_CENTER_R259__.bodyDrawn(q,img,[0,0,100,100,20,-70,60,120],ctx.ctx.getTransform());ctx.drawEnemy(e);const v=ctx.__STORYWORLD_HIT_CENTER_R259__.centreOf(e);
 ok('low dpr + shake: body handed over by mob-foot-r332 is measured in project coordinates too',v&&Math.abs(v.cx-50)<1e-6&&Math.abs(v.cy+10)<1e-6,v);}
const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`${checks.length-bad.length}/${checks.length}`);if(bad.length)process.exit(1);
