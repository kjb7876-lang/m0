// R1221 헤드리스 장면(그래픽·GPU 검증 아님): 지정 몹 하나를 영웅 옆에서 화면 왼쪽·오른쪽으로 걷게 하고 각 방향에서 한 장씩 찍는다.
// 사용: SW_URL=… node r96/qa/r1221/side-shot2.mjs (움직이는 중에 찍기) <zone> <이름 일부> <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const [zone,name,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,zone);await skip(p);
console.log("booted");for(const dir of ['left','right']){const info=await p.evaluate(async([nm,dir])=>{auto=false;guide=false;const B=room.enemies.find(e=>e.hp>0&&(nm.startsWith("id:")?e.nativeId===nm.slice(3):String(e.name).includes(nm)));if(!B)return null;
  for(const e of room.enemies)if(e!==B){e.hp=0;e.spawnState='dead';}B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e9;B.speed=0;
  const p0=project(0,0),px=project(1,0),py=project(0,1);let hx=-(py.y-p0.y),hy=(px.y-p0.y);const s=(project(hx,hy).x-p0.x)>=0?1:-1;const m=Math.hypot(hx,hy);hx*=s/m;hy*=s/m;const sg=dir==='left'?-1:1;
  const cx=player.x+hx*2.2,cy=player.y+hy*2.2+.0;const t0=time;
  await new Promise(res=>{const f=()=>{player.hp=9e9;player.invincible=99;B.attack=null;B.cd=9;B.rangedWindup=0;B.hitTimer=0;B.state='idle';const u=((time-t0)*.9)%1.6-.8;B.x=cx+hx*sg*u;B.y=cy+hy*sg*u;B.moving=true;
    if(time>t0+1.2&&!window.__r1221res){window.__r1221res=1;res();}if(!window.__r1221stop)setTimeout(f,20);};window.__r1221stop=0;window.__r1221res=0;f();});window.__keep=()=>{};return {name:B.name,r974:window.__STORYWORLD_MOVE_DIR_R974__.inspect().last};},[name,dir]);
 console.log("shoot",dir);await p.screenshot({path:`${out}/${zone}-${dir}.png`,timeout:60000});await p.evaluate(()=>{window.__r1221stop=1;});await p.waitForTimeout(300);console.log(dir,JSON.stringify(info));}
await b.close();
