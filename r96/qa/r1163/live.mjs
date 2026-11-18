// R1163 헤드리스 확인: 지역마다 보스를 세워 두고(대기) 실제 그려진 몸 그림을 세고, 피격을 주어 피격 시트를 확인하고, 장면을 찍는다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1163/live.mjs <out dir> zone:정규식 ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});const JOBS=process.argv.slice(3).map(s=>s.split(':'));const res={};
const b=await chromium.launch();
for(const [z,re] of JOBS){const {p}=await boot(b,{vp:{width:640,height:360}});
 try{await go(p,z);await skip(p);}catch(e){res[z]={error:String(e).slice(0,160)};await p.close();continue;}
 const info=await p.evaluate(re=>{const R=new RegExp(re);const B=room.enemies.find(e=>e.hp>0&&R.test(String(e.name||''))&&(e.boss||e.midboss));if(!B)return {list:room.enemies.filter(e=>e.boss||e.midboss).map(e=>e.nativeId+':'+e.name)};
  for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;player.hp=player.maxHp=1e9;player.invincible=1e9;player.x=B.x+4;player.y=B.y-4;
  window.__B=B;const C={};window.__C=C;window.__TAG='idle';const hold=()=>{B.attack=null;B.rangedWindup=0;B.attackCooldown=9;B.cd=9;B.state='idle';B.moving=false;B.x=B.homeX??B.x;B.y=B.homeY??B.y;requestAnimationFrame(hold);};B.speed=0;B.moveSpeed=0;hold();
  const base=drawEnemy;drawEnemy=function(e,...r){const cm=ctx.commands,st=cm.length;const o=base.call(this,e,...r);if(e===B){let best=null,bh=0;for(let i=st;i<cm.length;i++){const k=cm[i];if(k?.kind!=='image'||!Array.isArray(k.points))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
   if(best){const s=window.__TAG+'|'+String(best.sourcePath||'').replace(/^.*?assets\//,'')+'|'+(best.sourceRect||[]).map(Math.round).join(',');C[s]=(C[s]||0)+1;}}return o;};
  return {name:B.name,nativeId:B.nativeId,boss:!!B.boss,midboss:!!B.midboss,r380:B.r380Mob||null,r374:B.r374Mob||null};},re);
 const wait=async s=>{const t0=await p.evaluate(()=>time);for(let i=0;i<200;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,s]))return;await p.waitForTimeout(200);}};
 if(info.list){res[z]=info;await p.close();continue;}
 await wait(1.2);await p.screenshot({path:OUT+'/'+z+'-idle.png'});
 await p.evaluate(()=>{window.__TAG='hit';window.__B.hitTimer=.3;});await wait(.35);
 await p.evaluate(()=>{window.__TAG='after';});await wait(.6);
 res[z]={info,C:await p.evaluate(()=>window.__C),r620:await p.evaluate(()=>window.__STORYWORLD_BOSS_MOTION_R620__?.inspect?.().stats)};console.log(z,JSON.stringify(res[z]).slice(0,700));await p.close();}
fs.writeFileSync(OUT+'/live.json',JSON.stringify(res,null,1));await b.close();
