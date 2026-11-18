// R1125 헤드리스 조사: 몹 한 마리를 네 방향으로 걷게 하고(엔진 걸음 멈춤, 게임 시간으로 옮김) 걷는 동안 실제로 그려진 몸 그림(경로|칸)을 센다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1125/census.mjs <out.json> zone:nativeId:이름 ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const JOBS=process.argv.slice(3).map(s=>s.split(':'));const res=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{};
const b=await chromium.launch();let p;
const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<300;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(200);}};
for(const [z,id,nm] of JOBS){const key=z+'|'+id+'|'+nm;if(res[key])continue;
 if(p)await p.close();({p}=await boot(b,{vp:{width:640,height:360}}));
 try{await go(p,z);await skip(p);}catch(e){res[key]={error:String(e).slice(0,120)};continue;}
 const found=await p.evaluate(([id,nm])=>{const B=room.enemies.find(e=>String(e.nativeId)===id&&e.hp>0&&!e.midboss&&String(e.name||'').includes(nm));if(!B)return room.enemies.map(e=>e.nativeId+':'+e.name).join(',');
  for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;B.explorationLeash=null;player.hp=player.maxHp=1e9;player.invincible=1e9;
  const open=(cx,cy)=>{for(let dx=-2.4;dx<=2.41;dx+=.6)for(let dy=-2.4;dy<=2.41;dy+=.6)if(Math.hypot(dx,dy)<=2.45&&blocked(cx+dx,cy+dy,.34))return false;return true;};
  let C=null;for(let r=0;r<=16&&!C;r+=.5)for(let a=0;a<Math.PI*2&&!C;a+=Math.PI/12){const cx=player.x+Math.cos(a)*r,cy=player.y+Math.sin(a)*r;if(open(cx,cy))C=[cx,cy];}
  if(C){player.x=C[0]+2.1;player.y=C[1]+.3;B.x=B.homeX=C[0];B.y=B.homeY=C[1];}window.__B=B;window.__V=null;window.__HX=B.x;window.__HY=B.y;window.__C={};
  const o=project(B.x,B.y),ax=project(B.x+1,B.y),ay=project(B.x,B.y+1);const a=ax.x-o.x,bb=ay.x-o.x,c=ax.y-o.y,d=ay.y-o.y,det=a*d-bb*c;window.__INV=(sx,sy)=>[(d*sx-bb*sy)/det,(-c*sx+a*sy)/det];
  let lt=time;const mv=()=>{const dt=Math.max(0,Math.min(.1,time-lt));lt=time;const B=window.__B;if(B&&B.hp>0&&window.__V){const[wx,wy]=window.__INV(window.__V[0],window.__V[1]);const n=Math.hypot(wx,wy)||1;B.x+=wx/n*1.6*dt;B.y+=wy/n*1.6*dt;B.attack=null;B.state='chase';B.attackCooldown=9;B.hitTimer=0;
}requestAnimationFrame(mv);};requestAnimationFrame(mv);
  // 조사 전용: drawEnemy 를 감싸 그 몹이 이번에 그린 명령만 본다(R974 가 다시 맨 바깥을 씌우므로 표 몹 동작은 그대로).
  const base=drawEnemy;drawEnemy=function(e,...a){const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st=cm?cm.length:0;const r=base.call(this,e,...a);
   if(cm&&e===window.__B&&window.__V){let best=null,bh=0;for(let i=st;i<cm.length;i++){const k=cm[i];if(k?.kind!=='image'||!Array.isArray(k.points))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best){const s=String(best.sourcePath||best.image?.src||'').replace(/^.*?assets\//,'');const r=Array.isArray(best.sourceRect)?best.sourceRect.map(Math.round).join(','):'whole';const kk=s+'|'+r+(best.r974?'|r974:'+best.r974:'');window.__C[kk]=(window.__C[kk]||0)+1;}}return r;};B.speed=0;B.moveSpeed=0;return true;},[id,nm]);
 if(found!==true){res[key]={error:'not found',list:found};fs.writeFileSync(OUT,JSON.stringify(res,null,1));console.log(key,'not found',found);continue;}
 for(const v of [[0,1],[0,-1],[1,0],[-1,0]]){await p.evaluate(v=>{const B=window.__B;B.x=window.__HX;B.y=window.__HY;window.__V=v;},v);await wait(1.2);}
 res[key]=await p.evaluate(()=>window.__C);fs.writeFileSync(OUT,JSON.stringify(res,null,1));console.log(key,JSON.stringify(res[key]));}
await b.close();
