// R1186 헤드리스 확인: 꿈 층에서 연산 장치(m032)·시간핵 잔류(m049)가 drawEnemy 로 r1186 그림을 그리는지 실제 drawImage 로 잰다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1186/live.mjs <out> <zone> [layer=DREAM]
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],Z=process.argv[3]||'ep1b09',L=process.argv[4]||'DREAM';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await p.evaluate(([z,l])=>enterRegion(z,null,{layer:l,restore:true}),[Z,L]);await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.waitForTimeout(1500);
const res=await p.evaluate(()=>{player.hp=player.maxHp=1e9;const out={zone:String(room.id||''),names:{}};const c=ctx,d=c.drawImage,own=Object.prototype.hasOwnProperty.call(c,'drawImage');
 for(const e of room.enemies.filter(e=>e.hp>0)){const n=String(e.name||'').replace(/\s*\d+$/,'');if(out.names[n])continue;const fs=[];
  c.drawImage=function(img,...a){fs.push(String(img&&img.src||'').replace(/^.*assets\//,''));return d.call(c,img,...a);};
  try{drawEnemy(e);}finally{if(own)c.drawImage=d;else delete c.drawImage;}out.names[n]=fs.slice(0,3);}return out;});
console.log(JSON.stringify(res));fs.writeFileSync(OUT+'/live-'+Z+'.json',JSON.stringify(res,null,1));
await p.evaluate(()=>{const ms=room.enemies.filter(e=>e.hp>0&&/연산 장치|명령 잔류/.test(e.name||''));ms.slice(0,3).forEach((e,i)=>{e.x=player.x+1.2+i*.9;e.y=player.y+(i%2?.6:-.4);e.speed=0;});});
await p.waitForTimeout(800);await p.screenshot({path:OUT+'/dream-'+Z+'.png'});await b.close();
