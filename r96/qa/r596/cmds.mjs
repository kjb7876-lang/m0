import {boot} from './lib.mjs';
const U=process.env.U,Z=process.env.Z||'dist00';
const {b,p,errs,skip,go,gameWait}=await boot(U,960,540);await go(Z);
await p.evaluate(()=>{const b=tick;tick=function(...a){if(player)player.hp=player.maxHp;return b.apply(this,a);};});
for(let i=0;i<60;i++){const ok=await p.evaluate(()=>{auto=false;const s=window.__STORYWORLD_COMBAT_R170__.nextSpot?.();if(s){player.x=s.x+2;player.y=s.y;}return (room.enemies||[]).some(e=>e.r170Tower&&e.hp>0);});if(ok)break;await p.waitForTimeout(1000);}
await p.evaluate(()=>{const t=(room.enemies||[]).find(e=>e.r170Tower&&e.hp>0);for(const e of room.enemies)if(!e.r170Tower&&Math.hypot(e.x-t.x,e.y-t.y)<14)e.hp=0;player.x=t.x+3;player.y=t.y+2;t.r170Tower.next=time+999;});
await gameWait(1);
const r=await p.evaluate(async()=>{window.__cap=null;const base=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st=Array.isArray(c.commands)?c.commands.length:-1;const res=base.apply(this,[e,...a]);if(e?.r170Tower&&st>=0&&!window.__cap){window.__cap=c.commands.slice(st).map(k=>({kind:k.kind,owner:k.owner?.id,ok:k.owner?.kind,ground:!!k.owner?.groundAligned,filter:k.style?.filter??k.filter,alpha:+(k.style?.globalAlpha??k.alpha??-1),img:String(k.image?.src||k.path||k.style?.fillStyle||'').slice(-36),pts:(k.points||[]).slice(0,4).map(p=>p.map(v=>Math.round(v)))}));}return res;};
 await new Promise(r=>setTimeout(r,4000));drawEnemy=base;return window.__cap;});
console.log(JSON.stringify(r,null,0));await b.close();
