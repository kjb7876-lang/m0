// R1229 심사용 장면: 육망성 예고(ep1a09), 유리 망령 지역 탄(ep1b01), 발록 두 곳 + 운석(dist06·ep1a09b)
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1229rev';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await p.evaluate(()=>{player.hero='hunter';});
const hold=()=>p.evaluate(()=>{window.__hold=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);});
const wait=s=>p.evaluate(async s=>{const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>=s)return r();setTimeout(g,100);};g();});},s);
async function scene(z,setup,name,shots,gap){await go(p,z);await p.evaluate(setup);await hold();for(let i=0;i<shots;i++){await wait(gap);await p.screenshot({path:`${out}-${name}-${i}.png`});}await p.evaluate(()=>clearInterval(__hold));}
if(!process.env.ONLY)await scene('ep1a09',async()=>{room.engaged=true;let T=null;for(let i=0;i<120&&!T;i++){const sp=window.__STORYWORLD_COMBAT_R170__.nextSpot();if(sp){player.x=sp.x+1;player.y=sp.y+1;}T=room.enemies.find(e=>e.r170Tower&&e.hp>0);if(!T)await new Promise(r=>setTimeout(r,250));}if(!T)throw new Error('no tower '+JSON.stringify(window.__STORYWORLD_COMBAT_R170__.towers()));for(const e of room.enemies)if(e!==T)e.hp=0;player.x=T.x+2.5;player.y=T.y+1.5;room.engaged=true;window.__STORYWORLD_COMBAT_R170__.cast(T);},'hex',3,.45);
if(!process.env.ONLY)await scene('ep1b01',()=>{const keep=room.enemies.filter(e=>e.hp>0).slice(0,10);for(const e of room.enemies)if(!keep.includes(e))e.hp=0;keep.forEach((e,i)=>{const a=i/keep.length*6.28;e.x=player.x+Math.cos(a)*4;e.y=player.y+Math.sin(a)*4;e.spawnState='active';e.visible=true;e.hp=e.maxHp=1e8;});room.engaged=true;},'shots',2,2);
await scene('dist06',()=>{const B=room.enemies.find(e=>e.boss);for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;player.x=B.x+3.5;player.y=B.y+1.5;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;window.__STORYWORLD_BOSS_METEOR_R241__?.cast(B);},'dist06',2,.7);
await scene('ep1a09b',()=>{const B=room.enemies.find(e=>/발록/.test(e.name||''));for(const e of room.enemies)if(e!==B)e.hp=0;player.x=B.x+3.5;player.y=B.y+1.5;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;},'ep1a09b',2,1);
await b.close();
