// R1147 헤드리스 조사: 보스가 가만히 서 있을 때(공격·이동 없음) 실제로 그려진 몸 그림 경로를 센다(R620 SHEETS 열쇠 확인용).
// 사용: [SHOT=<폴더>] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1147/idle-census.mjs <out.json> zone:nativeId ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const JOBS=process.argv.slice(3).map(s=>s.split(':'));const res={};
const b=await chromium.launch();let p;
for(const [z,id] of JOBS){
 if(p)await p.close();({p}=await boot(b,{vp:process.env.SHOT?{width:960,height:540}:{width:640,height:360}}));
 try{await go(p,z);await skip(p);}catch(e){res[z+'|'+id]={error:String(e).slice(0,120)};continue;}
 const ok=await p.evaluate(id=>{const B=room.enemies.find(e=>String(e.nativeId)===id&&e.hp>0);if(!B)return room.enemies.map(e=>e.nativeId).join(',');
  for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;player.hp=player.maxHp=1e9;player.invincible=1e9;
  player.x=B.x+6;player.y=B.y+6;window.__B=B;window.__C={};
  const hold=()=>{const B=window.__B;if(B){B.attack=null;B.speed=0;B.attackCooldown=99;B.cooldown=99;}requestAnimationFrame(hold);};requestAnimationFrame(hold);
  const base=drawEnemy;drawEnemy=function(e,...a){const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st=cm?cm.length:0;const r=base.call(this,e,...a);
   if(cm&&e===window.__B){let best=null,bh=0;for(let i=st;i<cm.length;i++){const k=cm[i];if(k?.kind!=='image'||!Array.isArray(k.points))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best){const s=String(best.sourcePath||best.image?.src||'').replace(/^.*?assets\//,'assets/');const r=Array.isArray(best.sourceRect)?best.sourceRect.map(Math.round).join(','):'whole';const kk=s+'|'+r+'|'+(best.image?.naturalWidth||best.image?.width)+'x'+(best.image?.naturalHeight||best.image?.height);window.__C[kk]=(window.__C[kk]||0)+1;}}
   return r;};return true;},id);
 if(ok!==true){res[z+'|'+id]={error:'not found',list:ok};continue;}
 const t0=await p.evaluate(()=>time);for(let i=0;i<200;i++){await skip(p);if(await p.evaluate(t=>time>t+3,t0))break;await p.waitForTimeout(250);}
 if(process.env.SHOT){for(let k=0;k<3;k++){await p.screenshot({path:process.env.SHOT+'/'+z+'-'+k+'.png'});const t1=await p.evaluate(()=>time);for(let i=0;i<40;i++){if(await p.evaluate(t=>time>t+.25,t1))break;await p.waitForTimeout(150);}}}
 res[z+'|'+id]=await p.evaluate(()=>window.__C);console.log(z,id,JSON.stringify(res[z+'|'+id]));fs.writeFileSync(OUT,JSON.stringify(res,null,1));}
await b.close();
