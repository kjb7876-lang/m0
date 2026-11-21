// R1298 헤드리스 확인(소프트웨어 렌더 — GPU·실기기 아님): 망각의 묘지 바위턱 벽이 영웅 둘레에서 모두 3D 벽 줄로 그려지는지, 조형물·큰 묘비·문틀 훅 통계, 장면 캡처.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1298/r1298-browser.mjs <캡처 폴더> '[["이름",x,y],…]'
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const OUT=process.argv[2];const spots=JSON.parse(process.argv[3]);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r183.scene3d':JSON.stringify({on:true})}});
await go(p,'kair09');await p.evaluate(()=>{for(const e of room.enemies||[])e.hp=0;});
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+1,t0,{timeout:120000});
const res={};
for(const [n,x,y] of spots){await p.evaluate(([x,y])=>{player.x=x;player.y=y;cam={x,y};route=[];command=null;target=null;},[x,y]);
 const t1=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+1.2,t1,{timeout:120000});
 res[n]=await p.evaluate(()=>{const R=window.__STORYWORLD_PHASE1__.controller.state.three;const L=room.exploration;const ids=new Set();for(const[,e]of R.wallRows){const w=e.mesh.userData.originalWall;if(w)ids.add(String(w.id));}
  const O=L.outcropsR839;const owalls=L.walls.filter(w=>O.blocks.some(bl=>bl.rects.some(([bx,by,bw,bd])=>w.x>=bx-.01&&w.x<=bx+bw+.01&&w.y>=by-.01&&w.y<=by+bd+.01)));
  const near=owalls.filter(w=>Math.hypot(w.x-player.x,w.y-player.y)<14);
  return{nearOutcropWalls:near.length,drawn:near.filter(w=>ids.has(String(w.id))).length};});
 await p.screenshot({path:OUT+'/'+n+'.png'});}
const fin=await p.evaluate(()=>({c:window.__STORYWORLD_CEMETERY_R1298__.inspect(),dup:(()=>{const c=new Map();for(const w of room.exploration.walls)c.set(String(w.id),(c.get(String(w.id))||0)+1);return[...c].filter(([,v])=>v>1).length;})(),blockedProps:room.props.filter(p=>p.r1298Cemetery&&blocked(p.x,p.y,.25,room)).length,hidden:window.__STORYWORLD_CEMETERY_R1298__.inspect().stats.hidden||0,doorSkip:window.__STORYWORLD_WORLD_DOORS_R83__.inspect().stats.frameSkipped||0}));
console.log(JSON.stringify(res));console.log(JSON.stringify({props:fin.c.props.length,big:fin.c.props.filter(p=>p.id==='r1298:big'),dup:fin.dup,blockedProps:fin.blockedProps,hidden:fin.hidden,frames:fin.c.stats.frames,skipped:fin.c.stats.skipped,doorSkip:fin.doorSkip,err:fin.c.lastError}));
await b.close();
