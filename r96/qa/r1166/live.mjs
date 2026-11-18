// R1166 헤드리스 확인: 병원 지역에서 몹을 죽여 R462 가 R1065 에 넘기는 '살아 있을 때 그림'(경로·칸)과 고른 사망 시트를 센다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1166/live.mjs <out> ep1a01 ep1a02 ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});const res={};const b=await chromium.launch();
for(const z of process.argv.slice(3)){console.log('boot',z);const {p}=await boot(b,{vp:{width:640,height:360}});console.log('booted');
 try{await go(p,z);await skip(p);}catch(e){res[z]={error:String(e).slice(0,160)};await p.close();continue;}
 await p.evaluate(()=>{const A=window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;const C={};window.__C=C;const df=A.deathFrame;
  A.__wrapped=true;window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__={...A,deathFrame(look,age){const r=df(look,age);const sr=look?.frame?.assetFrame?.sourceRect||look?.frame?.sourceRect;const k=String(look?.name||'')+'|'+String(look?.path||'').replace(/^.*?assets\//,'')+'|'+(Array.isArray(sr)?sr.slice(0,2).map(Math.round).join(','):'-')+'|'+(r?r.id+':'+r.cell:'none');C[k]=(C[k]||0)+1;return r;}};
  player.hp=player.maxHp=1e9;player.invincible=1e9;});
 const t0=await p.evaluate(()=>time);for(let i=0;i<40;i++){await skip(p);if(await p.evaluate(t=>time>t+1.5,t0))break;await p.waitForTimeout(200);}
 await p.evaluate(()=>{for(const e of room.enemies){e.hidden=false;e.spawnState='active';e.x=player.x+(Math.random()-.5)*6;e.y=player.y+(Math.random()-.5)*6;}});{const t=await p.evaluate(()=>time);for(let i=0;i<30;i++){await skip(p);if(await p.evaluate(t=>time>t+.6,t))break;await p.waitForTimeout(200);}}
 await p.evaluate(()=>{for(const e of room.enemies)if(e.hp>0&&!e.boss&&!e.midboss){try{hitEnemy(e,1e9,'test');}catch(_){e.hp=0;}}});
 const t1=await p.evaluate(()=>time);for(let i=0;i<60;i++){await skip(p);if(await p.evaluate(t=>time>t+1.2,t1))break;await p.waitForTimeout(200);}
 res[z]={C:await p.evaluate(()=>window.__C),r462:await p.evaluate(()=>window.__STORYWORLD_MOB_DEATH_R462__?.inspect?.().stats||null)};console.log(z,JSON.stringify(res[z].C).slice(0,900));await p.close();}
fs.writeFileSync(OUT+'/live.json',JSON.stringify(res,null,1));await b.close();
