import {boot} from './lib.mjs';
const U=process.env.U,Z=process.env.Z||'dist00',OUT=process.env.OUT,TAG=process.env.TAG;
const {b,p,errs,skip,go,gameWait}=await boot(U,960,540);await go(Z);
await p.waitForFunction(()=>window.__STORYWORLD_PIXELFX_R163__?.ready(),null,{timeout:30000});
await p.evaluate(()=>{const b=tick;tick=function(...a){if(player)player.hp=player.maxHp;return b.apply(this,a);};});
for(let i=0;i<60;i++){const ok=await p.evaluate(()=>{auto=false;const s=window.__STORYWORLD_COMBAT_R170__.nextSpot?.();if(s){player.x=s.x+2;player.y=s.y;}return (room.enemies||[]).some(e=>e.r170Tower&&e.hp>0);});if(ok)break;await p.waitForTimeout(1000);}
const setup=await p.evaluate(()=>{const t=(room.enemies||[]).find(e=>e.r170Tower&&e.hp>0);if(!t)return null;for(const e of room.enemies)if(!e.r170Tower&&Math.hypot(e.x-t.x,e.y-t.y)<14)e.hp=0;
 player.x=t.x+2.4;player.y=t.y+1.6;t.r170Tower.casts=1;t.r170Tower.next=time;return {x:t.x,y:t.y};});
console.log(TAG,'setup',JSON.stringify(setup));if(!setup){await b.close();process.exit(2);}
const rift=()=>p.evaluate(()=>window.__STORYWORLD_PIXELFX_R163__.inspect().active.filter(n=>n==='pvfx-rift-portal').length);
await gameWait(.5);const r0=await rift();await p.screenshot({path:`${OUT}/${TAG}-rift-0.5s.jpg`,quality:85});
await p.evaluate(()=>{for(const e of room.enemies)if(e.r170Summoned)e.hp=0;const t=room.enemies.find(e=>e.r170Tower);t.r170Tower.next=time+999;});
for(let i=0;i<12;i++)await p.mouse.wheel(0,-100);await p.mouse.move(480,200);await p.evaluate(()=>{player.x+=3;player.y+=1;});await gameWait(4);const r4=await rift();
const box=await p.evaluate(()=>{const t=room.enemies.find(e=>e.r170Tower);const q=project(t.x,t.y);const r=canvas.getBoundingClientRect?.()||{left:0,top:0};return {x:q.x,y:q.y};});
await p.screenshot({path:`${OUT}/${TAG}-scene.jpg`,quality:85});
await p.screenshot({path:`${OUT}/${TAG}-tower.png`,clip:{x:Math.max(0,box.x-230),y:Math.max(0,box.y-230),width:460,height:300}});
const st=await p.evaluate(()=>window.__STORYWORLD_COMBAT_R170__.inspect?.().stats);
console.log(TAG,'RESULT',JSON.stringify({rift05:r0,rift45:r4,towerShadows:st.towerShadows||0,errors:errs}));await b.close();
