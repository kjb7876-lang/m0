// R473 브라우저 검사(헤드리스): 발록 방(dist06)에서 보스를 깨워 R241 운석을 한 번 부르고 → 운석 자리가 발록→영웅 한 줄인지, 끄면 흩어지는지. SHOT=경로 면 예고 순간을 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,shot=process.env.SHOT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r473.tear':'{"on":false}'}:null});
await go(p,'dist06');
await p.waitForFunction(()=>window.__STORYWORLD_BALROG_TEAR_R473__?.inspect().installed,null,{timeout:60000}).catch(()=>{});
const r=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist06-boss');e.spawnState='active';room.engaged=true;player.x=e.x+5.5;player.y=e.y+3.5;e.speed=0;e.moveSpeed=0;player.hp=99999;
 for(const x of room.enemies)if(x!==e){x.hp=0;x.dead=true;}window.__bz=e;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 const ok=window.__STORYWORLD_BOSS_METEOR_R241__.cast(e);return {cast:!!ok,installed:window.__STORYWORLD_BALROG_TEAR_R473__.inspect().installed};});
await p.waitForFunction(()=>hazards.filter(h=>h.r241Meteor).length>0&&hazards.filter(h=>h.r241Meteor).every(h=>h.r473Tear||h.age>.05),null,{timeout:60000}).catch(()=>{});
const m=await p.evaluate(()=>{const e=window.__bz,H=hazards.filter(h=>h.r241Meteor),a=Math.atan2(player.y-e.y,player.x-e.x);
 return H.map(h=>({k:h.r241Meteor.k,tag:h.r473Tear||null,along:+((h.x-e.x)*Math.cos(a)+(h.y-e.y)*Math.sin(a)).toFixed(2),side:+(-(h.x-e.x)*Math.sin(a)+(h.y-e.y)*Math.cos(a)).toFixed(2),toHero:+Math.hypot(h.x-player.x,h.y-player.y).toFixed(2)}));});
if(shot){await p.evaluate(()=>{window.__SLOW=1;});await p.waitForFunction(()=>hazards.some(h=>h.r241Meteor&&h.age>h.warning*.45),null,{timeout:60000}).catch(()=>{});await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(600);await p.screenshot({path:shot});}
console.log(JSON.stringify({r,m,st:await p.evaluate(()=>window.__STORYWORLD_BALROG_TEAR_R473__.inspect().stats)}));
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};ok('R241 cast happened ('+m.length+' meteors)',r.cast&&m.length>=3);
if(off)ok('off → scattered (not on one line)',m.some(x=>Math.abs(x.side)>.6));
else{ok('wrapper installed after R241',r.installed);ok('all on the slash line',m.every(x=>x.tag==='line'?Math.abs(x.side)<=.45:x.tag==='kept'));
 ok('fall order runs outward from Balrog',m.filter(x=>x.tag==='line').sort((a,b)=>a.k-b.k).every((x,i,A)=>i===0||x.along>A[i-1].along));ok('one meteor still at the hero',m.some(x=>x.toHero<=1.25));}
await b.close();process.exit(fail?1:0);
