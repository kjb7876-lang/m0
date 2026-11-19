// R1187 헤드리스 확인: 사몽 구역에서 중복 몹이 Dots 새 시트(assets/r1187)로 그려지는지 실제 drawImage 로 잰다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1183/live.mjs <out> [zone] [layer=DREAM]
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],Z=process.argv[3]||'ep1b08';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const L=process.argv[4]||'DREAM';if(L==='SAMONG')await p.evaluate(async z=>{await window.__STORYWORLD_SAMONG_R103__.goZone(z);},Z);else await p.evaluate(([z,l])=>enterRegion(z,null,{layer:l,restore:true}),[Z,L]);await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.waitForTimeout(1500);
const res=await p.evaluate(()=>{player.hp=player.maxHp=1e9;const A=window.__STORYWORLD_DUP_TINT_R1183__;const out={zone:String(room.id||'')+' / '+JSON.stringify(room.samongR103&&room.samongR103.zone),names:{},inspect:A.inspect()};
 const c=ctx,d=c.drawImage,own=Object.prototype.hasOwnProperty.call(c,'drawImage');
 for(const e of room.enemies.filter(e=>e.hp>0)){const n=String(e.name||'').replace(/\s*\d+$/,'');if(out.names[n])continue;const fs=[];
  c.drawImage=function(img,...a){fs.push([String(img&&img.src||'').replace(/^.*assets\//,''),String(c.filter)]);return d.call(c,img,...a);};
  try{drawEnemy(e);}finally{if(own)c.drawImage=d;else delete c.drawImage;}
  out.names[n]={rule:A.ruleFor(e),draws:fs.slice(0,3)};}
 return out;});
console.log(JSON.stringify(res));fs.writeFileSync(OUT+'/live1187-'+Z+'.json',JSON.stringify(res,null,1));
await p.evaluate(()=>{const ms=room.enemies.filter(e=>e.hp>0&&/골렘|아기 인형|제출되지|잔영/.test(e.name||''));ms.slice(0,4).forEach((e,i)=>{e.x=player.x+1.2+i*.9;e.y=player.y+(i%2?.6:-.4);e.speed=0;});});
await p.waitForTimeout(800);await p.screenshot({path:OUT+'/art-'+Z+'.png'});await b.close();
