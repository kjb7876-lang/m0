// R772 3D 화면(scene3d on)에서 소복 처녀 하나만 두고 찍기. usage: SW_URL=<사이트> node r96/qa/r760/r772-sobok-3d.mjs <out.png> 3d [nohover]
import {chromium,boot,go} from '/home/user/m0/r96/qa/r444/lib.mjs';
const mode=process.argv[3]||'3d';const b=await chromium.launch();
const {p}=await boot(b,{init:mode==='3d'?{'storyworld.r183.scene3d':JSON.stringify({on:true})}:null});
await go(p,'last302');
await p.waitForFunction(()=>['sobok-float','sobok-idle','sobok-atk'].every(k=>readyImage('assets/r770/villagers/'+k+'.webp')),null,{timeout:300000,polling:200});
const info=await p.evaluate((process_arg)=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};player.hp=player.maxHp=1e9;player.invincible=1e9;
 const V=window.__STORYWORLD_VILLAGERS_R763__;const sb=room.enemies.filter(e=>e.hp>0&&V.kindFor(e)==='sobok');const one=sb[0];
 for(const e of room.enemies)if(e!==one){e.spawnState='hidden';e.x=-999;e.y=-999;}if(process_arg==='nohover')V.villagers.sobok.hover=null;one.spawnState='active';one.speed=0;one.x=player.x+2;one.y=player.y-1;
 return {scene3d:JSON.parse(localStorage.getItem('storyworld.r183.scene3d')||'null'),n:sb.length,id:one.id};},process.argv[4]||'');
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t+.05,t0,{timeout:200000});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(800);
await p.screenshot({path:process.argv[2]});console.log(JSON.stringify(info));await b.close();
