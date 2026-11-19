// R1224 떠서 이동 장면 찍기(1280×720): 보스를 옆으로 직접 걸려 시트가 그려진 순간을 찍는다. node float-shot.mjs <출력접두> 지역:id,…
import {chromium,boot,go} from '../r444/lib.mjs';
const [pre,list]=[process.argv[2],process.argv[3].split(',')];
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r790.npc':'{"on":false}'}});
for(const it of list){const [z,id]=it.split(':');await go(p,z);
 await p.evaluate(id=>{const e=room.enemies.find(x=>x.nativeId===id);room.engaged=true;e.spawnState='active';e.hidden=false;player.invincible=1e9;player.hp=9e8;player.maxHp=9e8;
  for(const o of room.enemies)if(o!==e&&o.hp>0){o.x=-999;o.y=-999;o.speed=0;}e.speed=0;e.cd=99;e.x=player.x+3;e.y=player.y-3;window.__W={e,t:null,vx:-1.4};
  if(!window.__wh){window.__wh=1;const de=drawEnemy;drawEnemy=function(x,...a){const W=window.__W;if(W&&x===W.e){const t=time,dt=Math.max(0,Math.min(.1,t-(W.t??t)));W.t=t;x.x+=W.vx*dt;x.attack=null;x.cd=99;}const c=ctx,s0=c.commands.length;const r=de.call(this,x,...a);if(W&&x===W.e)W.L=c.commands.slice(s0).filter(k=>k?.kind==='image');return r;};}},id);
 let got=0;for(let i=0;i<80&&got<2;i++){await p.waitForTimeout(150);const g=await p.evaluate(()=>{const L=window.__W.L||[];const f=L.find(k=>k.r1029);if(!f)return null;const xs=f.points.map(q=>q[0]),ys=f.points.map(q=>q[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};});
  if(!g)continue;const pad=80;await p.screenshot({path:`${pre}-${id}-${got++}.png`,clip:{x:Math.max(0,g.x-pad),y:Math.max(0,g.y-pad),width:Math.min(1280-Math.max(0,g.x-pad),g.w+pad*2),height:Math.min(720-Math.max(0,g.y-pad),g.h+pad*2)}});}
 console.log(id,got);await p.evaluate(()=>{window.__W=null;});}
await b.close();
