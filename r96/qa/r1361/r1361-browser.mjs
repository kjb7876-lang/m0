// R1361 헤드리스(GPU·실기기·손맛 미검증): 탐식의 주방 보스전에서 R1263 탐식 시전 → 프라이팬 착지 자리 Dots 먹 튐이 실제로 그려지는지, 오류 없는지. 0.1초 프레임 저장(GIF 용).
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.R1361_OUT||'/tmp/r1361-shots';fs.mkdirSync(OUT,{recursive:true});
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'ep1b04');
await p.evaluate(()=>{for(let k=0;k<20;k++){const r=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss);if(!r.length)break;for(const e of r){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}if(room.objective){player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();}});await skip(p);
await p.evaluate(()=>{for(let i=0;i<40;i++)tick(.05);});await skip(p);
await p.evaluate(()=>{for(const e of room.enemies.filter(e=>(e.midboss)&&e.hp>0&&e.spawnState==='active')){e.hp=0;killEnemy(e);}for(let i=0;i<60;i++)tick(.05);});await skip(p);
await p.evaluate(()=>{const X=room.exploration,d=(X.worldR74?.doors||[]).find(d=>d.id===X.bossDoorId);if(d){player.x=d.x+.6;player.y=d.y+.6;interact();}});await skip(p);await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const b=room.exploration.worldWardR81?.bossBounds;if(b){player.x=(b[0]+b[2])/2;player.y=(b[1]+b[3])/2;}for(let i=0;i<10;i++)tick(.05);});await skip(p);
const setup=await p.evaluate(()=>{const A=window.__STORYWORLD_SIN_SKILLS_R1263__;const e=room.enemies.find(x=>A.which(x)==='gluttony');if(!e)return null;
 window.__STORYWORLD_GUT_WRITHE_R1345__?.set?.({on:false});window.__h=[];hurt=function(){window.__h.push(1);return 'hit';};
 e.speed=0;e.x=player.x+5;e.y=player.y-.5;window.__pc=0;
 return {boss:e.name,cast:A.cast(true)};});
ok('탐식 보스·시전',!!setup&&setup.cast,setup);
await p.evaluate(()=>{window.__SLOW=1e-4;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});await p.waitForTimeout(300);
let maxS=0;for(let i=0;i<=40;i++){const s=await p.evaluate(()=>{window.__SLOW=1;for(let k=0;k<4;k++)tick(.025);window.__SLOW=1e-4;return window.__STORYWORLD_SIN_SKILLS_R1263__.inspect().panSplashes||0;});maxS=Math.max(maxS,s);await p.waitForTimeout(250);await p.screenshot({path:`${OUT}/f-${String(i).padStart(3,'0')}.png`});}
await p.evaluate(()=>{window.__SLOW=1;});
const ins=await p.evaluate(()=>({i:window.__STORYWORLD_SIN_SKILLS_R1263__.inspect(),ok:!!readyImage('assets/r1361/pan-splash24.webp')?.image}));
ok('프라이팬 착지 먹 튐 1개 이상',maxS>=1,maxS);ok('Dots 시트 실제 로드',ins.ok);ok('오류 없음',ins.i.errors===0&&!errs.length,[ins.i.lastError,errs]);
await b.close();console.log(fail?`R1361 browser: ${fail} failed`:'R1361 browser: all passed');process.exit(fail?1:0);
