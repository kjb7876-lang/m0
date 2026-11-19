import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2];const z=process.argv[3]||'dist06';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await p.evaluate(()=>{player.hero='hunter';});await go(p,z);
await p.evaluate(()=>{const B=room.enemies.find(e=>/발록/.test(e.name||'')&&e.boss)||room.enemies.find(e=>/발록/.test(e.name||''));window.__B=B;for(const e of room.enemies)if(e!==B)e.hp=0;B.x=player.x-2.2;B.y=player.y-1.2;B.homeX=B.x;B.homeY=B.y;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;B.speed=0;
 setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);});
const wait=s=>p.evaluate(async s=>{const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>=s)return r();setTimeout(g,100);};g();});},s);
for(const on of [true,false]){await p.evaluate(on=>window.__STORYWORLD_MOTION_FX_R1229__.set({balrog:on}),on);await wait(1);
 const info=await p.evaluate(()=>{const q=project(__B.x,__B.y);return {q:[q.x|0,q.y|0],sp:__B.spawnState,vis:__B.visible,hp:__B.hp,st:window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats};});console.log(on,JSON.stringify(info).slice(0,400));
 await p.screenshot({path:`${out}-${z}-${on?'on':'off'}.png`});}
await b.close();
