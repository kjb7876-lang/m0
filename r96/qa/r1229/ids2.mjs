import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;const B=room.enemies.find(e=>e.boss),M=room.enemies.find(e=>e.midboss);player.x=B.x+2.5;player.y=B.y+1.5;room.engaged=true;for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e8;}
 setInterval(()=>{try{player.hp=maxHP();player.invincible=99;}catch(_){}},300);});
const R=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const ids={};const t0=time;
 three.render=function(f){for(const c of f.commands||[]){const s=String(c.sourcePath||'');if(/(glow|flame|smoke):52\.30\.58|fx:orb|spirit-orb|story-vfx/.test(s+String(c.owner?.id))&&Object.keys(ids).length<60){const k=String(c.owner?.id)+' | '+s.slice(0,60)+' | '+c.kind;ids[k]=(ids[k]||0)+1;}}return base.apply(this,arguments);};
 await new Promise(r=>{const g=()=>{if(time-t0>15)return r();setTimeout(g,200);};g();});three.render=base;
 return {ids,proj:(projectiles||[]).filter(x=>!x.friendly).slice(0,5).map(x=>Object.fromEntries(Object.entries(x).filter(([k,v])=>typeof v!=='object'||v===null).slice(0,30))),haz:(hazards||[]).slice(0,4).map(x=>Object.keys(x).join(','))};});
console.log(JSON.stringify(R,null,1).slice(0,6000));await b.close();
