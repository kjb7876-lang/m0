import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;const B=room.enemies.find(e=>e.boss),M=room.enemies.find(e=>e.midboss);player.x=B.x+4;player.y=B.y+2;room.engaged=true;for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;}window.__B=B;});
await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let o=null;three.render=function(f){if(!o){o=(f.commands||[]).filter(c=>c.owner?.kind==='enemy'&&c.kind==='image').map(c=>[c.owner.id,String(c.sourcePath).split('/').slice(-2).join('/'),Math.round(Math.abs(c.points[3][1]-c.points[0][1]))]);}return base.apply(this,arguments);};await new Promise(r=>setTimeout(r,1500));three.render=base;return {o,B:[__B.id,__B.x,__B.y,__B.hp,__B.spawnState],P:[player.x,player.y]};});
console.log(JSON.stringify(r));await p.screenshot({path:'/tmp/claude-0/r1229/ids.png'});await b.close();
