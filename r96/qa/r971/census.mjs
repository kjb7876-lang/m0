// R971 헤드리스 조사: 방향 이동 그림을 받을 보스·중간보스가 걷는 동안 엔진이 실제로 그리는 몸 그림(경로·칸·크기)을 지역마다 모은다.
// 사용: [ZONES=dist01,dist04] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r971/census.mjs <out.json>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'census.json';const ZONES=(process.env.ZONES||'dist01,dist04,ep1a08,ep1a11,ep1b01,ep1b02,ep1b03,ep1b04,ep1b05,ep1b07,ep1b08,ep1b09,u201,u202,u203,u204,u205,u206,last305,last301,kair02,kair03,kair04,kair05,kair06,kair08,kair09,kair10,hando01,hando02').split(',');
const res=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{};const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:120000}).catch(()=>{});};
for(const z of ZONES){if(res[z])continue;try{await go(p,z);}catch(e){res[z]={error:String(e).slice(0,120)};continue;}
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;window.__C={};const L=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss||e.miniBoss||e.persona||/^mb-|boss|mid|great|elite/.test(String(e.nativeId||''))));window.__L=L;
  for(const e of room.enemies)if(!L.includes(e))e.hp=0;L.forEach((e,i)=>{e.spawnState='active';e.explorationLeash=null;e.x=e.homeX=player.x-4-i*1.5;e.y=e.homeY=player.y-4+i*1.5;});
  if(!drawEnemy.__r971c){const de=drawEnemy;drawEnemy=function(e,...a){const cx=ctx,s0=cx.commands?.length??-1;const r=de.call(this,e,...a);if(window.__L?.includes(e)&&s0>=0){let best=null,bh=0;for(let i=s0;i<cx.commands.length;i++){const k=cx.commands[i];if(k.kind!=='image'||k.owner?.kind!=='enemy'||k.r760Ghost||k.r620Ghost)continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best){const id=String(e.nativeId||e.id),C=window.__C[id]=window.__C[id]||{name:e.name,boss:!!e.boss,midboss:!!e.midboss,ai:e.ai,flying:!!e.flying,paths:{}};const st=e.attack?'atk':(e.hitTimer>0?'hit':'move');const q=project(e.x,e.y);
     const key=String(best.sourcePath||best.image?.src||'')+'|'+(best.sourceRect||[]).map(v=>Math.round(v)).join(',')+'|'+(best.imageSize||[]).join('x');const P=C.paths[key]=C.paths[key]||{n:0,st:{},h:0,foot:0,cx:0};P.n++;P.st[st]=(P.st[st]||0)+1;P.h=+bh.toFixed(1);
     P.foot=+((q.y-Math.min(...best.points.map(v=>v[1])))/bh).toFixed(3);P.cx=+((q.x-Math.min(best.points[0][0],best.points[1][0]))/Math.abs(best.points[1][0]-best.points[0][0])).toFixed(3);}}return r;};drawEnemy.__r971c=true;}});
 await wait(2.5);res[z]=await p.evaluate(()=>({room:room.id,n:window.__L.length,C:window.__C}));fs.writeFileSync(OUT,JSON.stringify(res,null,1));console.log(z,JSON.stringify(Object.keys(res[z].C||{})));}
await b.close();
