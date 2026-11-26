// R1335 헤드리스 확인(R1332 검사를 카이로 밖 야외 31지역으로, 가장자리 30칸마다)(소프트웨어 렌더 — GPU·실기기 아님): 카이로 야외형 5지역의 지도 경계 둘레를 위에서 똑바로 내려다보고(깊이·물체 번호 두 번 그리기, topscan.js)
//  '바닥이 아닌 칸인데 맨 위에 보이는 것이 땅 높이(바닥 판·검은 가장자리 판)'인 칸을 센다. 고친 뒤 0 이어야 한다.
//  또 경계 안 둔덕 칸(원래 R100 뚜껑)과 바닥 칸의 보이는 높이는 고치기 전과 같아야 한다(안쪽 그림 그대로).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1332/r1332-browser.mjs <결과.json> [kair03,kair06,…] [localStorage JSON]
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));const OUT=process.argv[2]||'r1335-browser.json';const zones=(process.argv[3]||'ep1a09b,ep1a10,ep1a11,ep1b05,ep1b09,u201,u202,u203,u204,hando03,murder01,murder03,cult01,cult02,cult04,cult05,cult06,dist00,dist02,dist03,dist04,dist05,dist06,ep1b06b,last301,last302,last303,last304,last305,hando01,hando02').split(',');
const STEP=+(process.env.STEP||30);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r1055.inkWash':JSON.stringify({mode:'off'}),...JSON.parse(process.argv[4]||'{}')}});
await p.addScriptTag({content:fs.readFileSync(path.join(here,'..','r1332','topscan.js'),'utf8')});const res={};let bad=0;
for(const z of zones){await go(p,z);
 // 경계 안쪽 가장자리를 따라 14칸마다 영웅·카메라를 옮기고 그 둘레 ±10칸을 내려다본다
 const pts=await p.evaluate((STEP)=>{const L=room.exploration,[x0,y0,x1,y1]=L.bounds,S=L.floorCells,out=[];for(let x=x0+7;x<x1;x+=STEP)for(const y of[y0+1,y1-1])out.push([x,y]);for(let y=y0+7;y<y1;y+=STEP)for(const x of[x0+1,x1-1])out.push([x,y]);
  return out.map(([x,y])=>{let best=null,d=1e9;for(const c of S){const dd=(c[0]+.5-x)**2+(c[1]+.5-y)**2;if(dd<d){d=dd;best=[c[0]+.5,c[1]+.5];}}return[best,[x,y]];});},STEP);
 const cells=new Map();
 for(const [hero,look] of pts){await p.evaluate(([x,y])=>{for(const e of room.enemies||[])e.hp=0;player.x=x;player.y=y;cam={x,y};route=[];command=null;target=null;},hero);await skip(p);
  const t1=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.2,t1,{timeout:60000}).catch(()=>{});
  for(const r of await p.evaluate(([x,y])=>__topscan(x,y,10),look))cells.set(r[0]+':'+r[1],r);}
 const B=await p.evaluate(()=>room.exploration.bounds);const out=[...cells.values()];const outside=r=>r[0]<B[0]||r[1]<B[1]||r[0]>=B[2]||r[1]>=B[3];
 const ground=out.filter(r=>!r[2]&&outside(r)&&r[3]!=null&&r[3]<.3);
 const rec={bounds:B,scanned:out.length,outside:out.filter(outside).length,outsideGround:ground.length,outsideGroundEx:ground.slice(0,6),
  insideCap:out.filter(r=>!r[2]&&!outside(r)&&r[3]!=null&&r[3]>=.3).length,floorGround:out.filter(r=>r[2]&&r[3]!=null&&r[3]<.3).length,
  ring:await p.evaluate(()=>{const R=window.__STORYWORLD_PHASE1__.controller.state.three;const m=R.spatialRoot.getObjectByName('r1335-outer-cap');return m?{visible:m.visible,mask:m.layers.mask,sameMaterial:m.material===R.r100Cap?.material}:null;}),
  stats:await p.evaluate(()=>window.__STORYWORLD_OUTDOOR_EDGES_R1335__?.inspect?.()||null)};
 res[z]=rec;console.log(z,JSON.stringify({outsideGround:rec.outsideGround,outside:rec.outside,insideCap:rec.insideCap,floorGround:rec.floorGround,ring:rec.ring}));if(rec.outsideGround)bad++;}
fs.writeFileSync(OUT,JSON.stringify(res,null,1));console.log(`\nR1335 browser: ${zones.length-bad}/${zones.length} zones without floor tiles beyond the map edge`);await b.close();process.exit(bad?1:0);
