// R713 헤드리스 검사(Playwright): 첫 맵(마수궁 피난 거점 hub)의 돌담이 얇은 종잇장(0.24)이 아니라 윗면이 읽히는 두께인지.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r713 node r96/qa/r713/r713-browser.mjs
// 헤드리스(소프트웨어 렌더): 판정만 본다. GPU·실기기·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r713';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(name,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,600)));};
const b=await chromium.launch({headless:true});
async function boot(off){const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(o=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(o)localStorage.setItem('storyworld.r713.walls',JSON.stringify({on:false}));}catch(_){}},off);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
 await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>(window.__STORYWORLD_PHASE1__?.controller?.state?.three?.wallRows?.size||0)>=40,null,{timeout:60000}).catch(()=>{});return{ctx,p,errors};}
const measure=()=>{const L=room.exploration,t=window.__STORYWORLD_PHASE1__.controller.state.three;
 const floor=new Set((L.floorCells||[]).map(c=>c[0]+':'+c[1]));const rows=[];
 for(const w of L.walls){if(!w.refugeR82)continue;const horiz=w.width>w.depth,thin=horiz?w.depth:w.width;
  const fixed=horiz?w.y:w.x,mid=horiz?w.x:w.y;let inner=null,innerOk=null;
  if(!w.partition){// 바깥 둘레: 바닥 쪽 면(안쪽 면)은 정수 칸 줄 ±.12 그대로여야 한다(걷는 자리 불변)
   const a=horiz?floor.has(Math.floor(mid)+':'+(fixed-1)):floor.has((fixed-1)+':'+Math.floor(mid)),c=horiz?floor.has(Math.floor(mid)+':'+fixed):floor.has(fixed+':'+Math.floor(mid));
   const centre=Math.round(fixed*2)/2;// 원래 줄(정수 또는 .5 칸 경계)
   if(a!==c){const lo=fixed-thin/2,hi=fixed+thin/2;inner=a?lo:hi;innerOk=a?Math.abs(hi-(Math.round(fixed)+ -0))>=0&&Math.abs(lo-(lo))<1e-9:true;}}
  const m=t.wallRows.get(w.id)?.mesh;let bb=null;if(m){m.geometry.computeBoundingBox();const g=m.geometry.boundingBox;bb=horiz?(g.max.z-g.min.z)*m.scale.z:(g.max.x-g.min.x)*m.scale.x;}
  rows.push({id:w.id,partition:!!w.partition,thin:+thin.toFixed(3),mesh:bb==null?null:+bb.toFixed(3),fixed,horiz,mid,w:w.width,d:w.depth});}
 return{n:rows.length,rows,on:window.__STORYWORLD_REFUGE_WALLS_R713__?.inspect?.()||null};};
const grid=()=>{const L=room.exploration,out=[],b=L.bounds;for(let x=b[0];x<=b[2];x+=.25)for(let y=b[1];y<=b[3];y+=.25)if(window.StoryPhase1.explorationBlocked(L,x,y,.27))out.push(x+':'+y);
 return{out,parts:L.walls.filter(w=>w.refugeR82&&w.partition).map(w=>[w.x,w.y,w.width,w.depth]),ends:L.walls.filter(w=>w.refugeR82).flatMap(w=>w.width>w.depth?[[w.x-w.width/2,w.y],[w.x+w.width/2,w.y]]:[[w.x,w.y-w.depth/2],[w.x,w.y+w.depth/2]])};};
let gOn=null;
{const {ctx,p,errors}=await boot(false);gOn=await p.evaluate(grid);ctx.__x=1;
 const m=await p.evaluate(measure);
 const outer=m.rows.filter(r=>!r.partition),part=m.rows.filter(r=>r.partition);
 check('R713 module loaded',m.on&&m.on.revision==='R713-walls-1',m.on);
 check('hub has refuge walls',m.n>=40&&outer.length>=30&&part.length>=4,{n:m.n,outer:outer.length,part:part.length});
 check('outer stone walls are thick enough to read the top (>= .6)',outer.every(r=>r.thin>=.6),outer.filter(r=>r.thin<.6).slice(0,3));
 check('inner partitions thickened too (>= .45) but thinner than the outer ring',part.every(r=>r.thin>=.45&&r.thin<outer[0].thin),part.slice(0,2));
 check('3D wall meshes follow the data (mesh thin axis == data thin axis)',m.rows.filter(r=>r.mesh!=null).length>=20&&m.rows.every(r=>r.mesh==null||Math.abs(r.mesh-r.thin)<.02),m.rows.filter(r=>r.mesh!=null&&Math.abs(r.mesh-r.thin)>=.02).slice(0,3));
 // 걷는 자리 불변: 바깥 둘레 벽은 바닥 쪽 면이 옛 줄(정수 칸 줄 ±.12) 그대로여야 하고 바깥쪽으로만 두꺼워진다.
 const face=await p.evaluate(()=>{const L=room.exploration,floor=new Set(L.floorCells.map(c=>c[0]+':'+c[1])),F=(x,y)=>floor.has(Math.floor(x)+':'+Math.floor(y)),near=(a,b)=>Math.abs(a-b)<1e-6,bad=[];let n=0;
  for(const w of L.walls){if(!w.refugeR82||w.partition)continue;n++;const horiz=w.width>w.depth,T=horiz?w.depth:w.width,c=horiz?w.y:w.x,mid=horiz?w.x:w.y,lo=c-T/2,hi=c+T/2;
   const at=(line,cellSide)=>horiz?F(mid,line+cellSide):F(line+cellSide,mid);
   const A=lo+.12,B=hi-.12,okA=near(A,Math.round(A))&&at(Math.round(A),-1)&&!at(Math.round(A),0),okB=near(B,Math.round(B))&&at(Math.round(B),0)&&!at(Math.round(B),-1);
   if(!okA&&!okB)bad.push({id:w.id,lo,hi});}
  return{n,bad:bad.slice(0,4),badN:bad.length};});
 check('outer ring keeps its floor-side face where it was (walkable area unchanged, grows outward only)',face.n>=30&&face.badN===0,face);
 // 충돌: 실제 이동 판정이 있으면 영웅 반지름으로 안쪽 면 바로 앞과 뒤를 묻는다(공개 판정 함수가 전역이면)
 await p.screenshot({path:`${OUT}/after-full.png`});
 check('no page errors',errors.length===0,errors);await ctx.close();}
{const {ctx,p,errors}=await boot(true);
 const gOff=await p.evaluate(grid),on=new Set(gOn.out),off=new Set(gOff.out);
 const changed=[...on].filter(k=>!off.has(k)).concat([...off].filter(k=>!on.has(k)));
 const nearPart=k=>{const [x,y]=k.split(':').map(Number);return gOn.ends.some(([ex,ey])=>Math.hypot(x-ex,y-ey)<=.7)||gOn.parts.some(([px,py,pw,pd])=>Math.abs(x-px)<=pw/2+.4&&Math.abs(y-py)<=pd/2+.4);};
 check('walk/blocked grid (.25 step, r=.27) identical except beside the inner partitions and wall corners (mitre fill)',gOff.out.length>1000&&changed.every(nearPart),{blockedOff:gOff.out.length,blockedOn:gOn.out.length,changed:changed.length,far:changed.filter(k=>!nearPart(k)).slice(0,5)});
 const m=await p.evaluate(measure);
 check('switch storyworld.r713.walls {"on":false} keeps the old .24 walls',m.rows.length>=40&&m.rows.every(r=>Math.abs(r.thin-.24)<1e-9),m.rows.filter(r=>Math.abs(r.thin-.24)>=1e-9).slice(0,3));
 await p.screenshot({path:`${OUT}/before-full.png`});await ctx.close();}
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;
