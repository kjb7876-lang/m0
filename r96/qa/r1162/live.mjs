// R1162 헤드리스 확인: u205 지역에서 중간보스 u205-mid 를 화면 아래로 걷게 하고 실제 그려진 몸 그림·R974 상태와 장면을 찍는다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'/tmp/r1162';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await go(p,'u205');await skip(p);
const info=await p.evaluate(()=>{const B=room.enemies.find(e=>String(e.nativeId)==='u205-mid');if(!B)return {list:room.enemies.map(e=>e.nativeId+':'+e.name)};
 for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;B.explorationLeash=null;player.hp=player.maxHp=1e9;player.invincible=1e9;
 player.x=B.x+5;player.y=B.y-5;window.__B=B;B.speed=0;B.moveSpeed=0;
 const o=project(B.x,B.y),ax=project(B.x+1,B.y),ay=project(B.x,B.y+1);const a=ax.x-o.x,bb=ay.x-o.x,c=ax.y-o.y,d=ay.y-o.y,det=a*d-bb*c;const[wx,wy]=[(d*0-bb*1)/det,(-c*0+a*1)/det];const n=Math.hypot(wx,wy);
 let lt=time;const C={};const mv=()=>{const dt=Math.max(0,Math.min(.1,time-lt));lt=time;if(window.__GO){B.x+=wx/n*1.4*dt;B.y+=wy/n*1.4*dt;B.attack=null;B.state='chase';B.attackCooldown=9;B.hitTimer=0;B.moving=true;}requestAnimationFrame(mv);};requestAnimationFrame(mv);
 const base=drawEnemy;drawEnemy=function(e,...r){const cm=ctx.commands,st=cm.length;const out=base.call(this,e,...r);if(e===B&&window.__GO){let best=null,bh=0;for(let i=st;i<cm.length;i++){const k=cm[i];if(k?.kind!=='image'||!Array.isArray(k.points))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
  if(best){const s=String(best.sourcePath||'').replace(/^.*?assets\//,'')+'|'+(best.sourceRect||[]).map(Math.round).join(',');C[s]=(C[s]||0)+1;}}return out;};window.__C=C;window.__GO=true;return {name:B.name,midboss:!!B.midboss};});
console.log(JSON.stringify(info));
const t0=await p.evaluate(()=>time);for(let i=0;i<200;i++){await skip(p);if(await p.evaluate(t=>time>t+1.5,t0))break;await p.waitForTimeout(250);}
const res=await p.evaluate(()=>({C:window.__C,st:window.__STORYWORLD_MOVE_DIR_R974__?.inspect?.()}));
let shot=null;for(let i=0;i<60&&!shot;i++){const L=await p.evaluate(()=>window.__STORYWORLD_MOVE_DIR_R974__.inspect().last);if(L&&L.dir==='down'){await p.screenshot({path:OUT+'/walk-down.png'});shot=L;}else await p.waitForTimeout(150);}
res.shot=shot;
fs.writeFileSync(OUT+'/live.json',JSON.stringify({info,...res},null,1));console.log(JSON.stringify(res).slice(0,900));await b.close();
