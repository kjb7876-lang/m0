// R1221 한 몹 옆걸음 점검: 지정 지역의 이름 몹 하나를 화면 가로로 왕복시키며 R974/R1029 상태와 맨 마지막 몸 그림을 본다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,name]=[process.argv[2],process.argv[3]];const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await go(p,zone);await skip(p);
const r=await p.evaluate(async(nm)=>{auto=false;guide=false;const B=room.enemies.find(e=>e.hp>0&&String(e.name).includes(nm));if(!B)return 'none';for(const e of room.enemies)if(e!==B){e.hp=0;e.spawnState='dead';}
 B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e9;B.speed=0;const keys={};const p0=project(0,0),px=project(1,0),py=project(0,1);let hx=-(py.y-p0.y),hy=(px.y-p0.y);const m=Math.hypot(hx,hy);hx/=m;hy/=m;
 const cx=player.x+hx*2,cy=player.y+hy*2;const t0=time;
 await new Promise(res=>{const f=()=>{player.hp=9e9;player.invincible=99;B.attack=null;B.cd=9;B.rangedWindup=0;const u=time-t0;B.x=cx+hx*Math.sin(u*2)*.8;B.y=cy+hy*Math.sin(u*2)*.8;B.moving=true;
   const C=ctx.commands;if(Array.isArray(C)){for(const k of C){if(k?.kind==='image'&&String(k.sourcePath||'').match(/dist02|r1029|mb-|boss/)){const kk=String(k.sourcePath).replace(/^.*\/m0\//,'')+'|'+String(k.sourceRect);keys[kk]=(keys[kk]||0)+1;}}}
   if(time>t0+6)res();else setTimeout(f,30);};f();});
 return {name:B.name,state:B.state,ai:B.ai,keys,r974:window.__STORYWORLD_MOVE_DIR_R974__?.inspect()};},name);
console.log(JSON.stringify(r,null,1).slice(0,4000));await b.close();
