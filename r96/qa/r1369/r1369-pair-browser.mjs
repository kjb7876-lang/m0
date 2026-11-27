import {chromium,boot,go} from './lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:800,height:450}});await go(p,process.env.Z||'dist00');
await p.evaluate(()=>{const bb=room.enemies.find(e=>e.boss&&e.hp>0);window.__bb=bb;bb.maxHp=bb.hp=1e9;player.maxHp=player.hp=1e9;setInterval(()=>{if(player.hp>0)player.hp=player.maxHp;},30);player.x=bb.x-2.2;player.y=bb.y-1.2;bb.spawnState='active';
 for(const e of room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,4)){e.x=player.x+1+Math.random();e.y=player.y+Math.random()-.5;e.spawnState='active';}});
await p.waitForTimeout(1500);
const A='window.__STORYWORLD_FX_ALPHA_R1369__';
async function pair(name){await p.evaluate(()=>{player.hp=player.maxHp;});
 await p.evaluate(`${A}.set({on:true})`);await p.waitForTimeout(150);await p.screenshot({path:`p-${name}-on.png`});console.log(name,await p.evaluate(()=>{const S=window.__STORYWORLD_PHASE1__.controller.state.three.commands;const A=window.__STORYWORLD_FX_ALPHA_R1369__;return new Promise(res=>{const fn=S.render;S.render=function(c){const r=fn.apply(this,arguments);S.render=fn;const out={};for(const x of c){const k=x.owner?.kind;if(['ground','prop','exits','objective','hero','enemy'].includes(k)||x.kind==='text')continue;const a=x.style?.globalAlpha??1;if(a<.45)continue;const key=(A.classify(x)||'·')+'|'+k+'|'+(x.r1369fx?.type||'')+'|'+String(x.owner?.id||'').slice(0,30)+'|'+String(x.sourcePath||'').slice(-40)+'|'+x.kind+'|'+a.toFixed(2);out[key]=(out[key]||0)+1;}res(JSON.stringify(out,null,0));return r;};});}));
 await p.evaluate(`${A}.set({on:false})`);await p.waitForTimeout(150);await p.screenshot({path:`p-${name}-off.png`});
 await p.evaluate(`${A}.set({on:true})`);}
for(const k of ['a','a','a']){await p.keyboard.press(k);await p.waitForTimeout(250);}
await pair('1hit');for(let i=0;i<1;i++){console.log(await p.evaluate(()=>JSON.stringify({time,modal:!!modal,scene:!!storyScene,loading,hp:player.hp,started})));await p.waitForTimeout(3000);}
const t0=await p.evaluate(()=>{const M=window.__STORYWORLD_BOSS_METEOR_R241__;const bb=window.__bb;bb.hp=1e9;bb.spawnState='active';M.cast(bb);return time;});
for(const [n,dt] of [['2warn',.35],['3impact',.9],['4smoke',1.5]]){await p.waitForFunction(([t0,dt])=>time>=t0+dt,[t0,dt],{timeout:500000,polling:500});await pair(n);}
console.log(JSON.stringify(await p.evaluate(`${A}.inspect()`)));await b.close();
