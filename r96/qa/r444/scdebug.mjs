// R444 디버그 표시 화면: storyworld.r444.face {"debug":true} 로 켜고, 몹 무리 곁에 영웅을 세워 몇 초 싸우게 한 뒤 전체 화면을 찍는다.
// 실행: SW_URL=… node scdebug.mjs <zone> <out.png> [mobile]
import {chromium,boot,go} from './lib.mjs';
const [,,zone,out,mobile]=process.argv;const VP=mobile?{width:844,height:390}:{width:1280,height:720};
const b=await chromium.launch();const {p}=await boot(b,{init:{'storyworld.r444.face':JSON.stringify({debug:true})},vp:VP});await go(p,zone);await p.waitForTimeout(2000);
const info=await p.evaluate(()=>{const L=room.enemies.filter(e=>e.hp>0&&e.spawnState==='active'&&!e.persona&&!e.boss);let best=null,bn=-1;
 for(const e of L){const n=L.filter(o=>Math.hypot(o.x-e.x,o.y-e.y)<4).length;if(n>bn){bn=n;best=e;}}if(!best)return null;
 player.hp=9e8;player.invincible=999;for(let a=0;a<16;a++){const x=best.x+Math.cos(a*Math.PI/8)*2.2,y=best.y+Math.sin(a*Math.PI/8)*2.2;if(!blocked(x,y,.3)){player.x=x;player.y=y;break;}}
 window.__t0=time;return {name:best.name,group:bn};});
console.log(zone,JSON.stringify(info));
await p.waitForFunction(()=>time-window.__t0>=1.6,null,{timeout:120000});
await p.screenshot({path:out});
console.log(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_ENEMY_FACE_R444__.inspect())).slice(0,600));
await b.close();
