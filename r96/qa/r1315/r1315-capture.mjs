// R1315 심사용 전후 장면(헤드리스 SwiftShader — 그래픽 검증 아님). 2D(끔)·3D(켬) 같은 순간 비교 + 확대.
import path from 'node:path';import {fileURLToPath} from 'node:url';import {chromium,boot,go} from '../r444/lib.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),OUT=process.env.OUT||HERE,SUF=process.env.SUF||'';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r1315.mob3d':'on','storyworld.r1315.tone':process.env.TONE||'null'}});
const A=()=>p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__.inspect());
async function shot(name,setup,idFn){await p.evaluate(setup);
 await p.waitForFunction(()=>window.__STORYWORLD_MOB3D_R1315__.inspect().shown>0,null,{timeout:120000});await p.waitForTimeout(2500);
 const id=await p.evaluate(idFn);
 for(const [tag,v] of [['3d',true],['2d',false]]){await p.evaluate(v=>window.__STORYWORLD_MOB3D_R1315__.set(v),v);await p.waitForTimeout(700);
  const sp=await p.evaluate(id=>{const e=room.enemies.find(e=>e.id===id);const r=window.__STORYWORLD_PHASE1__.controller.state.three;const s=r.projection.worldToScreen(e.x,e.y,0);return s;},id);
  const q=await p.evaluate(([id,v])=>{if(v)return window.__STORYWORLD_MOB3D_R1315__.measure(id)?.h;const h=window.__STORYWORLD_PHASE1__.controller.state.three;return new Promise(res=>{const base=h.commands.render;h.commands.render=function(cmds){const out=base.apply(this,arguments);h.commands.render=base;const r=cmds.find(c=>c?.owner?.id==='enemy:'+id&&c.kind==='image');res(r?r.points[2][1]-r.points[0][1]:null);return out;};});},[id,v]);console.log(name,tag,'h',q);
  await p.screenshot({path:path.join(OUT,`r1315-${name}-${tag}${SUF}.png`)});
  const w=e=>Math.max(0,Math.min(1280-360,e));await p.screenshot({path:path.join(OUT,`r1315-${name}-${tag}${SUF}-zoom.png`),clip:{x:w(sp.x-180),y:Math.max(0,Math.min(720-300,sp.y-230)),width:360,height:300}});}
 await p.evaluate(()=>window.__STORYWORLD_MOB3D_R1315__.set(true));}
await go(p,'ep1b08');
await shot('knight',()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.damage=0;}const k=room.enemies.find(e=>/^전극기계수호기사/.test(e.name)&&!e.boss);window.__k=k.id;player.x=k.x-1.6;player.y=k.y+.6;},()=>__k);
await go(p,'ep1b04');
await shot('boss',()=>{player.hp=player.maxHp=99999;for(const e of room.enemies)e.damage=0;const e=room.enemies.find(e=>e.boss);window.__b=e.id;e.spawnState='active';e.visible=true;e.speed=0;e.x=player.x+2.2;e.y=player.y-.6;},()=>__b);
console.log(JSON.stringify((await A()).stats));await b.close();
