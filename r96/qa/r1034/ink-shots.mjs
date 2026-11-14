// R1034b 수묵 검흔 전후(헤드리스 소프트웨어 렌더링): 같은 장면에서 검흔 끔(before)/켬(after). 기본 공격 0.2초, W 0.25초·1.0초.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.SHOT_DIR||'.';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
await go(p,process.env.ZONE||'ep1a08');
await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));if(player.hero!=='hwando'){await switchHero('hwando');await wait(800);}modal=null;player.hp=player.maxHp=99999;
 const ok=(x,y)=>!blocked(x,y,.45,room);let spot=null;
 for(let k=0;k<6000&&!spot;k++){const x=4+Math.random()*(room.w||60),y=4+Math.random()*(room.h||60);if(!ok(x,y))continue;let g=true;for(let i=0;i<14&&g;i++){const a=i/14*Math.PI*2;for(const r of [2,3.5,5.2])if(!ok(x+Math.cos(a)*r,y+Math.sin(a)*r)||!clearLine({x,y},{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r},room))g=false;}if(g)spot={x,y};}
 player.x=spot.x;player.y=spot.y;player.direction='right';const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.speed=0;e.moveSpeed=0;e.x=-100-i;e.y=-100;});
 const use=live.filter(e=>!e.boss&&!e.midboss).slice(0,4);use.forEach((e,i)=>{e.spawnState='active';e.hp=e.maxHp=9999999;const a=[0,2.1,3.6,5][i],r=i?5.2:1.3;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;});window.__near=use[0];});
const res={};
for(const tag of ['before','after']){
 await p.evaluate(t=>window.__STORYWORLD_HWANDO_INK_TRACE_R1034__.set(t==='after'),tag);
 await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const A=window.__STORYWORLD_HWANDO_INK_TRACE_R1034__,n=window.__near,k0=A.inspect().stats.attack;for(let i=0;i<12;i++){n.hp=n.maxHp=9999999;n.spawnState='active';n.x=player.x+1.2;n.y=player.y+.2;player.attackCD=0;target=n;basicAttack(true);window.__c0=time;if(A.inspect().stats.attack>k0||!A.on())break;await wait(200);}});
 await p.waitForFunction(()=>time-window.__c0>=.4,null,{timeout:120000,polling:5});await p.screenshot({path:`${OUT}/ink-${tag}-attack.png`});
 await p.waitForFunction(()=>time-window.__c0>=1.5,null,{timeout:120000,polling:20});
 await p.evaluate(()=>{if(player.storyWER?.ready)for(const k in player.storyWER.ready)player.storyWER.ready[k]=0;target=null;__STORYWORLD_WER__.cast('w');window.__c0=time;});
 for(const at of [.25,1.0]){await p.waitForFunction(at=>time-window.__c0>=at,at,{timeout:120000,polling:5});await p.screenshot({path:`${OUT}/ink-${tag}-w${String(at).replace('.','')}.png`});}
 await p.waitForFunction(()=>time-window.__c0>=2,null,{timeout:120000,polling:20});
 res[tag]=await p.evaluate(()=>window.__STORYWORLD_HWANDO_INK_TRACE_R1034__.inspect());}
console.log(JSON.stringify(res).slice(0,1500));await b.close();
